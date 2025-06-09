const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path'); // Added for explicit .env path
const pdf = require('pdf-parse');
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: true }); // Explicitly set path and override existing vars
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const multer = require('multer');
const fs = require('fs'); // For sync operations like readFileSync for config
const fsPromises = fs.promises; // For async file operations like readFile, access
// pdf-parse is already required earlier
console.log('DEBUG: ChartJSNodeCanvas type:', typeof ChartJSNodeCanvas, ChartJSNodeCanvas);
const { create, all } = require('mathjs');
const { ImageAnnotatorClient } = require('@google-cloud/vision'); // For OCR and image analysis
const crypto = require('crypto'); // For generating unique IDs
const math = create(all); // For graph generation
let parameterScope = {}; // To store user-defined parameters

// Log loaded env variables for debugging
console.log('DEBUG: Loaded GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'Key Loaded' : 'Key NOT Loaded');
console.log('DEBUG: Loaded HUGGING_FACE_API_TOKEN for image gen:', process.env.HUGGING_FACE_API_TOKEN ? 'Token Loaded' : 'Token NOT Loaded');
console.log('DEBUG: Loaded CORE_API_KEY:', process.env.CORE_API_KEY ? 'Key Loaded' : 'Key NOT Loaded');

const app = express();
const port = process.env.PORT || 3001;

// Multer setup for file uploads (in-memory storage)
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/plain' || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only .txt and .pdf files are allowed.'), false);
  }
};
const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // Limit file size to 10MB for notes

// Multer setup for image uploads (allow common image types)
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only image files are allowed.'), false);
  }
};
const uploadImage = multer({ storage: storage, fileFilter: imageFileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // Limit image size to 10MB

// Multer setup for study material uploads (disk storage)
const studyMaterialStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure STUDY_MATERIALS_DIR exists
    if (!fs.existsSync(STUDY_MATERIALS_DIR)){
        fs.mkdirSync(STUDY_MATERIALS_DIR, { recursive: true });
    }
    cb(null, STUDY_MATERIALS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'studyMaterialFile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const studyMaterialFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Please upload a supported study material file.'), false);
  }
};

const uploadStudyFile = multer({ storage: studyMaterialStorage, fileFilter: studyMaterialFileFilter, limits: { fileSize: 500 * 1024 * 1024 } }); // Limit file size to 500MB for study materials

let uploadedNoteContent = null; // To store text from uploaded note
let uploadedNoteName = null;

// In-memory cache for PDF text
const pdfCache = {};
// Simple cache eviction strategy: limit cache size
const MAX_CACHE_SIZE = 50; // Store up to 50 PDFs' text
let cacheKeys = []; // To track insertion order for LRU-like eviction

// Middleware
const allowedOrigins = [
  'https://brain-ink.vercel.app',
  'http://localhost:3000', // For local frontend dev (if you use port 3000)
  'http://localhost:5173', // For local Vite frontend dev (default Vite port)
  'https://mozilla.github.io' // Allow Mozilla PDF.js viewer origin
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // If you plan to use cookies or authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Specify allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // General uploads serving if needed elsewhere

// Google Gemini API details
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
let genAI, geminiModel;
let visionClient; // Google Cloud Vision client
if (GOOGLE_API_KEY) {
  genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest"}); // Trying gemini-1.5-flash-latest
  console.log('DEBUG: Google AI SDK initialized.');
  try {
    visionClient = new ImageAnnotatorClient(); // Assumes GOOGLE_APPLICATION_CREDENTIALS is set
    console.log('DEBUG: Google Cloud Vision client initialized.');
  } catch (error) {
    console.error('DEBUG: Failed to initialize Google Cloud Vision client:', error.message);
    // Depending on requirements, you might want to prevent app start or run in a degraded mode.
  }
} else {
  console.error('DEBUG: GOOGLE_API_KEY not found. Google AI SDK not initialized.');
}

// Hugging Face Image Generation API details
const HUGGING_FACE_API_TOKEN = process.env.HUGGING_FACE_API_TOKEN;
const HF_IMAGE_MODEL_URL = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0'; // A popular choice

// API endpoint to get study materials metadata
app.get('/api/study-materials', (req, res) => {
  res.json(studyMaterialsDb);
});

// API endpoint to upload a new study material
app.post('/api/upload-study-material', uploadStudyFile.single('studyMaterial'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ type: 'error', message: 'File upload failed. No file provided or file type not allowed.' });
  }

  const { topic } = req.body;
  const newMaterial = {
    id: crypto.randomUUID(),
    originalFilename: req.file.originalname,
    storedFilename: req.file.filename,
    filePath: req.file.path,
    mimetype: req.file.mimetype,
    topic: topic || 'General',
    uploadTimestamp: new Date().toISOString(),
    size: req.file.size,
  };

  try {
    // Read current study materials, add new, then write back
    const studyMaterialsJsonPath = path.join(__dirname, 'study_materials.json');
    let currentMaterials = [];
    try {
      const data = await fsPromises.readFile(studyMaterialsJsonPath, 'utf8');
      currentMaterials = JSON.parse(data);
    } catch (readErr) {
      // If file doesn't exist or is invalid JSON, start with an empty array (or handle error differently)
      console.warn('DEBUG: study_materials.json not found or unreadable on upload, starting new list.', readErr.message);
    }

    currentMaterials.push(newMaterial);
    await fsPromises.writeFile(studyMaterialsJsonPath, JSON.stringify(currentMaterials, null, 2), 'utf8');
    
    // Update in-memory DB as well
    studyMaterialsDb = currentMaterials;

    res.status(201).json({ type: 'success', message: 'Study material uploaded successfully!', material: newMaterial });
  } catch (error) {
    console.error('Error saving study material metadata:', error);
    // Potentially delete the uploaded file if DB update fails to prevent orphans
    try {
      await fsPromises.unlink(req.file.path);
      console.log(`DEBUG: Cleaned up orphaned file ${req.file.path} after DB error.`);
    } catch (unlinkErr) {
      console.error(`DEBUG: Failed to clean up orphaned file ${req.file.path}:`, unlinkErr);
    }
    res.status(500).json({ type: 'error', message: 'Failed to save study material metadata.' });
  }
});

// API endpoint to clear uploaded note context
app.post('/api/clear-note-context', (req, res) => {
  uploadedNoteContent = null;
  uploadedNoteName = null;
  console.log('DEBUG: Uploaded note context cleared.');
  res.json({ type: 'success', message: 'Uploaded note context cleared successfully.' });
});

// API endpoint for K.A.N.A. Chat
app.post('/api/chat', async (req, res) => {
  if (!geminiModel) {
    return res.status(503).json({ type: 'error', message: 'AI model not initialized. Check API key.' });
  }

  const { message, subject, conversationId, title, uploadedNoteContent, pastedImageBase64 } = req.body;

  console.log('DEBUG: /api/chat received payload:', { message, subject, conversationId, title, uploadedNoteContent: uploadedNoteContent ? 'Exists' : 'Empty', pastedImageBase64: pastedImageBase64 ? 'Exists' : 'Empty' });

  try {
    let promptParts = [];
    let fullPrompt = '';

    if (uploadedNoteContent) {
      fullPrompt += `Context from uploaded note:\n${uploadedNoteContent}\n\n`;
    }

    // Add a system prompt or role instruction if desired
    // fullPrompt += "You are K.A.N.A., a helpful AI assistant.\n";

    fullPrompt += `User message: ${message}`;
    promptParts.push({ text: fullPrompt });

    if (pastedImageBase64) {
      // Extract raw base64 data and mime type if the string includes a data URI prefix
      let rawBase64Data = pastedImageBase64;
      let mimeType = 'image/jpeg'; // Default, can be refined
      const match = pastedImageBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        rawBase64Data = match[2];
      }
      promptParts.push({
        inlineData: {
          data: rawBase64Data,
          mimeType: mimeType,
        },
      });
      console.log(`DEBUG: Added image to prompt with MIME type: ${mimeType}`);
    }

    const result = await geminiModel.generateContent({ contents: [{ role: "user", parts: promptParts }] });
    const response = result.response;
    const aiResponseText = response.text();
    
    console.log('DEBUG: Gemini AI Response:', aiResponseText);
    res.json({ type: 'success', kanaResponse: aiResponseText, subject, conversationId, title });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    let errorMessage = 'Failed to get response from AI.';
    if (error.message) {
        errorMessage += ` Details: ${error.message}`;
    }
    // Check for specific Google AI error structures if available
    if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error.message;
    }
    res.status(500).json({ type: 'error', message: errorMessage });
  }
});


// API endpoint for CORE search
app.get('/api/core-search', async (req, res) => {
  const searchTerm = req.query.q;
  if (!searchTerm) {
    return res.status(400).json({ type: 'error', message: 'Search term (q) is required.' });
  }

  if (!process.env.CORE_API_KEY) {
    console.error('CORE_API_KEY not configured.');
    return res.status(500).json({ type: 'error', message: 'CORE API key not configured on server. Please set CORE_API_KEY environment variable.' });
  }

  try {
    const coreApiUrl = 'https://api.core.ac.uk/v3/search/works';
    console.log(`DEBUG: Searching CORE API for: "${searchTerm}"`);
    const response = await axios.get(coreApiUrl, {
      params: {
        q: searchTerm,
        limit: 20, // Return up to 20 results, can be made configurable
        // Available fields include: title, authors, abstract, yearPublished, doi, downloadUrl, etc.
        // We can specify fields to return if needed, e.g., fields: ['title', 'authors', 'doi', 'downloadUrl', 'abstract']
      },
      headers: {
        'Authorization': `Bearer ${process.env.CORE_API_KEY}`
      }
    });

    if (response.data && response.data.results) {
      res.json({ type: 'success', results: response.data.results, totalHits: response.data.totalHits });
    } else {
      // Handle cases where CORE API might return 200 OK but not the expected structure
      console.warn('CORE API response did not contain expected results structure:', response.data);
      res.json({ type: 'success', results: [], totalHits: 0, message: 'Received response from CORE, but no results found or unexpected format.' });
    }

  } catch (error) {
    let errorMessage = 'Failed to search CORE API.';
    let statusCode = 500;
    let errorDetails = error.message;

    if (error.response) {
      // CORE API returned an error status
      console.error('Error response from CORE API:', error.response.status, error.response.data);
      errorMessage = error.response.data.message || `CORE API Error: ${error.response.statusText}` || errorMessage;
      statusCode = error.response.status || statusCode;
      errorDetails = error.response.data;
      if (error.response.status === 401) {
          errorMessage = 'CORE API request unauthorized. Please check your API Key and ensure it is correctly set in the .env file.';
      } else if (error.response.status === 403) {
          errorMessage = 'CORE API request forbidden. Your API key might not have the necessary permissions or there might be an issue with your account.';
      } else if (error.response.status === 429) {
          errorMessage = 'CORE API rate limit exceeded. Please try again later.';
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from CORE API:', error.request);
      errorMessage = 'No response received from CORE API. Check network connectivity or CORE API status.';
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request to CORE API:', error.message);
    }
    res.status(statusCode).json({ type: 'error', message: errorMessage, details: errorDetails });
  }
});

// API endpoint to save an external (e.g., CORE) item as a study material
app.post('/api/save-external-item', async (req, res) => {
  const { 
    title, 
    authors, // Expected to be an array of objects like [{name: 'Author Name'}]
    abstract,
    doi,
    downloadUrl,
    yearPublished,
    publisher,
    targetCategory // The K.A.N.A. category like 'Research Papers'
  } = req.body;

  if (!title || !targetCategory) {
    return res.status(400).json({ type: 'error', message: 'Title and target category are required to save an external item.' });
  }

  const newExternalMaterial = {
    id: crypto.randomUUID(),
    title: title,
    originalFilename: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.corelink`, // Create a pseudo-filename
    storedFilename: null, // No local file stored
    filePath: null, // No local file path
    mimetype: 'application/external-link', // Custom mimetype for external links
    topic: targetCategory, // User-selected K.A.N.A. category
    uploadTimestamp: new Date().toISOString(),
    size: 0, // No actual file size
    isExternal: true,
    sourceApi: 'CORE',
    authors: authors || [],
    abstract: abstract || '',
    yearPublished: yearPublished || null,
    publisher: publisher || '',
    externalUrl: downloadUrl || (doi ? `https://doi.org/${doi}` : null), // Prefer downloadUrl, fallback to DOI
    doi: doi || null
  };

  if (!newExternalMaterial.externalUrl) {
    console.warn('DEBUG: Attempted to save external item without a downloadUrl or DOI:', newExternalMaterial.title);
    // Decide if this should be an error or if items without direct links are permissible
  }

  try {
    const studyMaterialsJsonPath = path.join(__dirname, 'study_materials.json');
    let currentMaterials = [];
    try {
      const data = await fsPromises.readFile(studyMaterialsJsonPath, 'utf8');
      currentMaterials = JSON.parse(data);
    } catch (readErr) {
      console.warn('DEBUG: study_materials.json not found or unreadable on save-external, starting new list.', readErr.message);
    }

    currentMaterials.push(newExternalMaterial);
    await fsPromises.writeFile(studyMaterialsJsonPath, JSON.stringify(currentMaterials, null, 2), 'utf8');
    
    // Update in-memory DB as well
    studyMaterialsDb = currentMaterials;

    res.status(201).json({ type: 'success', message: 'External item saved successfully!', material: newExternalMaterial });
  } catch (error) {
    console.error('Error saving external study material metadata:', error);
    res.status(500).json({ type: 'error', message: 'Failed to save external study material metadata.' });
  }
});

// Define the directory for study materials
const STUDY_MATERIALS_DIR = path.join(__dirname, 'uploads', 'study_materials');

// Serve static files from the study_materials directory
app.use('/study_material_files', express.static(STUDY_MATERIALS_DIR));
console.log(`DEBUG: Serving static files from ${STUDY_MATERIALS_DIR} at /study_material_files`);

// Placeholder for study materials metadata (replace with actual loading from study_materials.json if needed)
// For now, assume study_materials.json is an array of objects like:
// { originalFilename: "MyDoc.pdf", storedFilename: "unique-doc-name.pdf", topic: "Science" }
// And that these files are stored in a known directory, e.g., './uploads/study_materials/'
let studyMaterialsDb = []; 
try {
  // Corrected path joining for study_materials.json, assuming it's in the same dir as index.js
  const smData = fs.readFileSync(path.join(__dirname, 'study_materials.json'), 'utf8');
  studyMaterialsDb = JSON.parse(smData);
  console.log('DEBUG: study_materials.json loaded successfully.');
} catch (err) {
  console.error('DEBUG: Could not load study_materials.json. Proceeding with empty study materials DB.', err.message);
}

// Helper function to extract text from a PDF file
async function extractTextFromPdf(filePath) {
  try {
    const dataBuffer = await fs.promises.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error(`Error reading or parsing PDF at ${filePath}:`, error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

// New Quiz Generation Endpoint
app.post('/api/kana/generate-quiz', async (req, res) => {
  const { sourceMaterialId, difficulty, numQuestions } = req.body;

  if (!sourceMaterialId) {
    return res.status(400).json({ type: 'error', message: 'Missing sourceMaterialId (e.g., filename or ID).' });
  }

  try {
    // Find the material in our "DB"
    const materialInfo = studyMaterialsDb.find(m => m.id === sourceMaterialId || m.originalFilename === sourceMaterialId || m.storedFilename === sourceMaterialId);

    if (!materialInfo) {
      return res.status(404).json({ type: 'error', message: `Source material '${sourceMaterialId}' not found.` });
    }

    // Use the absolute filePath from study_materials.json directly if it exists and is preferred
    // Otherwise, construct it using STUDY_MATERIALS_DIR and storedFilename
    let filePathToUse = materialInfo.filePath; // Prefer the absolute path from the JSON if available
    if (!filePathToUse || !path.isAbsolute(filePathToUse)) { 
        // Fallback or if filePath is relative/not provided, construct from STUDY_MATERIALS_DIR
        filePathToUse = path.join(STUDY_MATERIALS_DIR, materialInfo.storedFilename);
        console.log(`Constructed file path: ${filePathToUse} (original was: ${materialInfo.filePath})`);
    }
    
    // Check if file exists
    try {
      await fs.promises.access(filePathToUse);
      console.log(`Access confirmed for file: ${filePathToUse}`);
    } catch (err) {
      console.error(`File not found or inaccessible at path: ${filePathToUse} for material ID: ${sourceMaterialId}. Error: ${err.message}`);
      return res.status(404).json({ type: 'error', message: `File for '${materialInfo.originalFilename}' not found or inaccessible on server.` });
    }

    console.log(`Generating quiz from: ${materialInfo.originalFilename} (difficulty: ${difficulty}, questions: ${numQuestions})`);
    
    const extractedText = await extractTextFromPdf(filePathToUse);

    if (!extractedText || extractedText.trim() === "") {
        return res.status(500).json({ type: 'error', message: 'Extracted text is empty. Cannot generate quiz.' });
    }

    // --- Actual Gemini Call for Quiz Generation ---
    if (!geminiModel) {
      return res.status(500).json({ type: 'error', message: 'Quiz generation service is not available (Gemini model not initialized).' });
    }

    const requestedNumQuestions = parseInt(numQuestions, 10) || 5;
    const requestedDifficulty = difficulty || 'medium';

    // Truncate text to avoid exceeding API limits (e.g., ~30k characters for gemini-1.5-flash context window, be conservative)
    // A character is roughly 4 tokens. 30k chars ~ 7.5k tokens. Max tokens for gemini-1.5-flash is 32k for prompt.
    // Let's use a safe limit for the text, e.g., 20000 characters for the context part of the prompt.
    const maxTextLength = 20000;
    const contextText = extractedText.length > maxTextLength ? extractedText.substring(0, maxTextLength) + "... (text truncated)" : extractedText;

    const prompt = `
      You are an expert quiz generator. Based on the following text from the document titled "${materialInfo.originalFilename}", please generate a quiz.

      Quiz Requirements:
      - Number of questions: ${requestedNumQuestions}
      - Difficulty level: ${requestedDifficulty}
      - Topic: ${materialInfo.topic || 'General knowledge from the text'}

      For each question, provide the following fields:
      1.  "id": A unique string identifier for the question (e.g., "q1", "q2", ...).
      2.  "questionText": The text of the question itself.
      3.  "type": The type of question. This should be either "multiple-choice" or "theory".
      4.  "options" (only for "multiple-choice" type): An array of exactly 4 strings, representing the answer choices. One of these must be the correct answer.
      5.  "correctAnswer": 
          - For "multiple-choice" questions: The 0-indexed integer of the correct option in the "options" array.
          - For "theory" questions: A string representing the ideal or expected answer.
      6.  "explanation": A brief explanation of why the correct answer is correct, or more details for a theory question.

      The entire response MUST be a single, valid JSON object. This JSON object should have the following structure:
      {
        "title": "Quiz on ${materialInfo.topic || materialInfo.originalFilename}",
        "category": "${materialInfo.topic || 'Generated Quiz'}",
        "difficulty": "${requestedDifficulty}",
        "questions": [ /* array of question objects as described above */ ]
      }

      Extracted Text for Quiz Generation:
      --- BEGIN TEXT ---
      ${contextText}
      --- END TEXT ---

      Please ensure the JSON is well-formed and complete. Do not include any text outside of the main JSON object.
    `;
    
    console.log(`Sending prompt to Gemini for ${materialInfo.originalFilename}. Prompt length: ${prompt.length} chars. Context text length: ${contextText.length} chars.`);
    // console.log("Gemini Prompt Snippet:", prompt.substring(0, 500) + "..."); // For debugging if needed

    try {
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      // Gemini might wrap JSON in backticks if it thinks it's code, so try to strip them.
      let geminiText = response.text().trim();
      if (geminiText.startsWith('```json')) {
        geminiText = geminiText.substring(7);
      }
      if (geminiText.startsWith('```')) {
        geminiText = geminiText.substring(3);
      }
      if (geminiText.endsWith('```')) {
        geminiText = geminiText.substring(0, geminiText.length - 3);
      }
      geminiText = geminiText.trim(); // Trim again after stripping backticks

      console.log("Gemini Raw Response (cleaned):", geminiText.substring(0, 500) + (geminiText.length > 500 ? '...' : ''));

      const quizJson = JSON.parse(geminiText);
      // Basic validation of the parsed JSON structure
      if (!quizJson.title || !quizJson.category || !quizJson.difficulty || !Array.isArray(quizJson.questions)) {
        console.error("Gemini response missing required quiz structure.", quizJson);
        throw new Error("AI response did not conform to the expected quiz structure.");
      }
      res.json(quizJson);
    } catch (e) {
      console.error("Error during Gemini API call or parsing response:", e);
      // Check if e.response exists (from Gemini API error) or e.message for other errors
      const errorMessage = e.response && e.response.data && e.response.data.error ? e.response.data.error.message : e.message;
      res.status(500).json({ 
        type: 'error', 
        message: 'Failed to generate quiz using AI: ' + errorMessage,
        details: e.toString()
      });
    }
    // --- End Actual Gemini Call ---

  } catch (error) {
    console.error('Error in /generate-quiz endpoint:', error);
    res.status(500).json({ type: 'error', message: 'Failed to generate quiz: ' + error.message });
  }
});

// Simple test route
app.get('/', (req, res) => {
  res.send('K.A.N.A. Backend is running!');
});

// PDF Proxy Endpoint
app.get('/api/kana/pdf-proxy', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('Missing URL query parameter');
  }

  try {
    const decodedUrl = decodeURIComponent(url);
    console.log(`Proxying PDF from: ${decodedUrl}`);

    const response = await axios({
      method: 'get',
      url: decodedUrl,
      responseType: 'stream',
    });

    // Set the content type to application/pdf
    res.setHeader('Content-Type', 'application/pdf');

    // Pipe the PDF stream to the response
    response.data.pipe(res);

  } catch (error) {
    console.error('Error proxying PDF:', error.message);
    if (error.response) {
      console.error('Proxied URL Error Status:', error.response.status);
      console.error('Proxied URL Error Data:', error.response.data);
      // Forward the status code from the external server if available
      return res.status(error.response.status).send('Error fetching PDF from external source.');
    }
    res.status(500).send('Error proxying PDF');
  }
});

// K.A.N.A. Chat API endpoint
// Endpoint to upload a note
app.post('/api/kana/upload-note', upload.single('noteFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ type: 'error', message: 'No file uploaded.' });
  }

  try {
    let textContent = '';
    if (req.file.mimetype === 'text/plain') {
      textContent = req.file.buffer.toString('utf8');
    } else if (req.file.mimetype === 'application/pdf') {
      const data = await pdf(req.file.buffer);
      textContent = data.text;
    }

    uploadedNoteContent = textContent;
    uploadedNoteName = req.file.originalname;
    console.log(`Note uploaded and processed: ${uploadedNoteName}, length: ${uploadedNoteContent.length}`);
    res.json({ 
      type: 'success',
      message: `Note '${uploadedNoteName}' uploaded successfully. K.A.N.A. will now use it as context.`,
      fileName: uploadedNoteName
    });
  } catch (error) {
    console.error('Error processing uploaded file:', error);
    uploadedNoteContent = null; // Clear context on error
    uploadedNoteName = null;
    res.status(500).json({ type: 'error', message: 'An error occurred while searching CORE.' });
  }
});

// API endpoint to save an external (e.g., CORE) item as a study material
app.post('/api/save-external-item', async (req, res) => {
  const { 
    title, 
    authors, // Expected to be an array of objects like [{name: 'Author Name'}]
    abstract,
    doi,
    downloadUrl,
    yearPublished,
    publisher,
    targetCategory // The K.A.N.A. category like 'Research Papers'
  } = req.body;

  if (!title || !targetCategory) {
    return res.status(400).json({ type: 'error', message: 'Title and target category are required to save an external item.' });
  }

  const newExternalMaterial = {
    id: crypto.randomUUID(),
    title: title,
    originalFilename: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.corelink`, // Create a pseudo-filename
    storedFilename: null, // No local file stored
    filePath: null, // No local file path
    mimetype: 'application/external-link', // Custom mimetype for external links
    topic: targetCategory, // User-selected K.A.N.A. category
    uploadTimestamp: new Date().toISOString(),
    size: 0, // No actual file size
    isExternal: true,
    sourceApi: 'CORE',
    authors: authors || [],
    abstract: abstract || '',
    yearPublished: yearPublished || null,
    publisher: publisher || '',
    externalUrl: downloadUrl || (doi ? `https://doi.org/${doi}` : null), // Prefer downloadUrl, fallback to DOI
    doi: doi || null
  };

  if (!newExternalMaterial.externalUrl) {
    console.warn('DEBUG: Attempted to save external item without a downloadUrl or DOI:', newExternalMaterial.title);
    // Decide if this should be an error or if items without direct links are permissible
    // For now, we'll allow it, but it might be less useful to the user.
  }

  try {
    const studyMaterialsJsonPath = path.join(__dirname, 'study_materials.json');
    let currentMaterials = [];
    try {
      const data = await fsPromises.readFile(studyMaterialsJsonPath, 'utf8');
      currentMaterials = JSON.parse(data);
    } catch (readErr) {
      console.warn('DEBUG: study_materials.json not found or unreadable on save-external, starting new list.', readErr.message);
    }

    currentMaterials.push(newExternalMaterial);
    await fsPromises.writeFile(studyMaterialsJsonPath, JSON.stringify(currentMaterials, null, 2), 'utf8');
    
    // Update in-memory DB as well
    studyMaterialsDb = currentMaterials;

    res.status(201).json({ type: 'success', message: 'External item saved successfully!', material: newExternalMaterial });
  } catch (error) {
    console.error('Error saving external study material metadata:', error);
    res.status(500).json({ type: 'error', message: 'Failed to save external study material metadata.' });
  }
});

// Endpoint to clear uploaded note context
// New Endpoint for Image Analysis (OCR + Gemini)
app.post('/api/kana/analyze-image', uploadImage.single('imageFile'), async (req, res) => {
  const { message, subject, conversationId, title, activePdfUrl, uploadedNoteName } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ type: 'error', message: 'No image file uploaded.' });
  }

  console.log(`Received image analysis request:`);
  console.log(`  File: ${req.file.originalname} (${req.file.mimetype}, ${req.file.size} bytes)`);
  console.log(`  Message: "${message || ''}"`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Conversation ID: ${conversationId}`);
  console.log(`  Title: ${title}`);
  if (activePdfUrl) console.log(`  Active PDF URL: ${activePdfUrl}`);
  if (uploadedNoteName) console.log(`  Uploaded Note Name: ${uploadedNoteName}`);

  if (!visionClient) {
    return res.status(500).json({ type: 'error', message: 'Image analysis service is not available (Vision client not initialized).' });
  }
  if (!geminiModel) {
    return res.status(500).json({ type: 'error', message: 'Chat service is not available (Gemini model not initialized).' });
  }

  try {
    const imageBuffer = req.file.buffer;

    // 1. Send to Vision AI for OCR and Label Detection
    const [visionResults] = await visionClient.annotateImage({
      image: { content: imageBuffer },
      features: [
        { type: 'TEXT_DETECTION' },
        { type: 'LABEL_DETECTION', maxResults: 10 }, // Get up to 10 labels
        // Consider adding { type: 'OBJECT_LOCALIZATION' } for more detail if needed
      ],
    });

    const textAnnotations = visionResults.textAnnotations || [];
    const fullTextAnnotation = textAnnotations.length > 0 ? textAnnotations[0].description : null;
    const labels = visionResults.labelAnnotations ? visionResults.labelAnnotations.map(label => label.description) : [];

    console.log('Vision API - Full Text Annotation:', fullTextAnnotation ? `"${fullTextAnnotation.substring(0, 100).replace(/\n/g, ' ')}..."` : 'None');
    console.log('Vision API - Labels:', labels.join(', '));

    // 2. Construct prompt for Gemini
    let geminiPrompt = `You are K.A.N.A. (Knowledge Assistant for Natural Academics). Your purpose is to help students learn and understand academic topics. Be helpful, informative, and concise. If you don't know something, say so. Prioritize using provided context. Steer conversations back to an educational topic. Do not invent information.

The user has uploaded an image titled '${req.file.originalname}'. You have analyzed it with the following results:
`;

    if (fullTextAnnotation) {
      geminiPrompt += `
---BEGIN DETECTED TEXT FROM IMAGE (OCR)---
${fullTextAnnotation}
---END DETECTED TEXT FROM IMAGE---
`;
    }

    if (labels.length > 0) {
      geminiPrompt += `
The image appears to contain or be about: ${labels.join(', ')}.
`;
    }

    if (!fullTextAnnotation && labels.length === 0) {
      geminiPrompt += "You could not detect any specific text or labels in the image.\n";
    }

    geminiPrompt += `
User's message related to the image: "${message || '(No specific message provided alongside the image)'}"

Based on the image content and the user's message, please provide a helpful and informative academic response.`;

    // Add other context if available and relevant (e.g., PDF context, note context)
    // This part needs to be consistent with how context is added in the /api/kana/chat endpoint
    let fullPromptForGemini = geminiPrompt;
    if (activePdfUrl) {
      // Assuming getPdfText is a function that retrieves cached/fetched PDF text
      // const pdfText = await getPdfText(activePdfUrl); // You'll need to implement or adapt getPdfText
      // if (pdfText) fullPromptForGemini = `---BEGIN PDF CONTEXT---\n${pdfText}\n---END PDF CONTEXT---\n\n${geminiPrompt}`;
      // For now, let's just indicate that a PDF is active, as getPdfText is not fully implemented here.
      fullPromptForGemini = `(The user also has a PDF titled '${activePdfUrl}' active as context.)\n\n${geminiPrompt}`;
    }
    if (uploadedNoteContent && uploadedNoteName) {
      fullPromptForGemini = `---BEGIN UPLOADED NOTE CONTENT ('${uploadedNoteName}')---\n${uploadedNoteContent}\n---END UPLOADED NOTE CONTENT---\n\n${fullPromptForGemini}`;
    }

    console.log("\n--- Sending Combined Prompt to Gemini for Image Analysis ---");
    console.log(fullPromptForGemini.substring(0, 500) + (fullPromptForGemini.length > 500 ? '...' : '')); // Log truncated prompt
    console.log("-----------------------------------------------------------\n");

    // 3. Get response from Gemini
    const result = await geminiModel.generateContent(fullPromptForGemini);
    const geminiResponseText = await result.response.text();

    console.log("K.A.N.A.'s (Gemini) Answer (Image Analysis):", geminiResponseText.substring(0,200) + "...");

    // 4. Send structured response back to frontend
    res.json({
      type: 'image_with_explanation', // Consistent with frontend expectation
      kanaResponse: geminiResponseText,
      imageUrl: null, // We are not storing/reserving the image yet
      explanation: geminiResponseText, 
      originalFileName: req.file.originalname,
      // Optionally, still send raw OCR/labels if frontend might use them directly
      ocrText: fullTextAnnotation,
      detectedLabels: labels
    });

  } catch (error) {
    console.error('Error during image analysis:', error);
    res.status(500).json({ type: 'error', message: 'Error analyzing image: ' + error.message });
  }
});

app.post('/api/kana/clear-note-context', (req, res) => {
  uploadedNoteContent = null;
  uploadedNoteName = null;
  console.log('Uploaded note context cleared.');
  res.json({ type: 'success', message: 'Uploaded note context has been cleared.' });
});

app.post('/api/kana/chat', async (req, res) => {
  const { message, activePdfUrl } = req.body; // Get message and optional activePdfUrl

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!GOOGLE_API_KEY || !geminiModel) {
    console.error('Google API Key is not configured or Gemini model failed to initialize.');
    return res.status(500).json({ error: 'AI service not configured' });
  }

  try {
    // Parameter assignment detection
    const assignmentMatch = message.match(/^(?:let|define|set)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|as|to)\s*(-?\d+(?:\.\d+)?)$/i);
    if (assignmentMatch) {
      const varName = assignmentMatch[1];
      if (varName.toLowerCase() === 'x') {
        return res.json({
          type: "error",
          kanaResponse: "Sorry, 'x' is a reserved variable for graphing and cannot be set as a parameter."
        });
      } else {
        // Proceed with assignment if varName is not 'x'
        const varValue = parseFloat(assignmentMatch[2]);
        if (isNaN(varValue)) {
          return res.status(400).json({
            type: "error",
            kanaResponse: `Sorry, '${assignmentMatch[2]}' is not a valid number for ${varName}.`
          });
        }
        parameterScope[varName] = varValue;
        console.log(`Parameter set: ${varName} = ${varValue}. Current scope:`, parameterScope);
        return res.json({
          type: "info",
          kanaResponse: `Okay, I've set ${varName} = ${varValue}.`
        });
      }
    }

    // Conditional graphing intent detection
    const conditionalPlotMatch = message.match(/^if\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*([><=!]=?)\s*(-?\d+(?:\.\d+)?)\s*,\s*(?:then\s*)?(?:plot|graph)\s*(.+)$/i);
    if (conditionalPlotMatch) {
      const varName = conditionalPlotMatch[1];
      const operator = conditionalPlotMatch[2];
      const comparisonValueStr = conditionalPlotMatch[3];
      const expressionString = conditionalPlotMatch[4].trim();

      console.log(`Conditional plot: if ${varName} ${operator} ${comparisonValueStr}, plot ${expressionString}`);

      if (!parameterScope.hasOwnProperty(varName)) {
        return res.json({
          type: "error",
          kanaResponse: `Sorry, the variable '${varName}' in the condition is not defined. Please define it first (e.g., 'let ${varName} = 5').`
        });
      }

      const actualValue = parameterScope[varName];
      const comparisonValue = parseFloat(comparisonValueStr);

      if (isNaN(comparisonValue)) {
         return res.status(400).json({
          type: "error",
          kanaResponse: `Sorry, '${comparisonValueStr}' is not a valid number for comparison in the condition.`
        });
      }

      let conditionMet = false;
      switch (operator) {
        case '>': conditionMet = actualValue > comparisonValue; break;
        case '<': conditionMet = actualValue < comparisonValue; break;
        case '>=': conditionMet = actualValue >= comparisonValue; break;
        case '<=': conditionMet = actualValue <= comparisonValue; break;
        case '==': conditionMet = actualValue == comparisonValue; break;
        case '!=': conditionMet = actualValue != comparisonValue; break;
        default:
          return res.json({ type: "error", kanaResponse: `Unknown operator '${operator}' in condition.` });
      }

      if (conditionMet) {
        console.log(`Condition MET: ${varName} (${actualValue}) ${operator} ${comparisonValue}. Plotting ${expressionString}`);
        // Proceed with graphing logic (this is a simplified copy of the main graphing logic below)
        // This could be refactored into a common function later
        const width = 600; const height = 400;
        const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
        let compiledExpr;
        try {
          compiledExpr = math.compile(expressionString);
        } catch (error) {
          return res.status(400).json({ type: "error", kanaResponse: `Error compiling expression '${expressionString}': ${error.message}` });
        }

        const labels = []; const dataPoints = [];
        const xMinPlot = -5; const xMaxPlot = 5; const stepsPlot = 100;
        let minActualY = Infinity, maxActualY = -Infinity;

        for (let i = 0; i <= stepsPlot; i++) {
          const x = xMinPlot + (xMaxPlot - xMinPlot) * i / stepsPlot;
          labels.push(x.toFixed(2));
          let yValue;
          try {
            yValue = compiledExpr.evaluate({ ...parameterScope, x: x });
            if (typeof yValue !== 'number' || !isFinite(yValue)) yValue = null;
          } catch (evalError) { yValue = null; }
          dataPoints.push(yValue);
          if (yValue !== null) { minActualY = Math.min(minActualY, yValue); maxActualY = Math.max(maxActualY, yValue); }
        }

        let yAxisMin = minActualY, yAxisMax = maxActualY;
        if (minActualY === Infinity) { yAxisMin = -1; yAxisMax = 1; }
        else { const padding = Math.abs(maxActualY - minActualY) * 0.1 || 1; yAxisMin -= padding; yAxisMax += padding; }
        
        const configuration = {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{ label: expressionString, data: dataPoints, borderColor: 'rgb(75, 192, 192)', tension: 0.1, fill: false }]
          },
          options: {
            scales: { y: { min: yAxisMin, max: yAxisMax }, x: { title: { display: true, text: 'x' } } },
            plugins: { title: { display: true, text: `Graph of y = ${expressionString} (Condition: ${varName} ${operator} ${comparisonValueStr} was true)` } }
          }
        };
        const dataUrl = await chartJSNodeCanvas.renderToDataURL(configuration);
        return res.json({
          type: "mathematical_graph",
          kanaResponse: `Condition (${varName} ${operator} ${comparisonValueStr}) was met. Here's the graph of y = ${expressionString}:`,
          generatedImageUrl: dataUrl
        });
      } else {
        console.log(`Condition NOT MET: ${varName} (${actualValue}) ${operator} ${comparisonValue}.`);
        return res.json({
          type: "info",
          kanaResponse: `Condition (${varName} ${operator} ${comparisonValueStr}) was not met. No graph plotted.`
        });
      }
    }

    // Graphing intent detection
    const graphRequestMatch = message.match(/^(?:plot|graph)(?:\s+a\s+graph\s+of)?(?:\s*y\s*=\s*|\s*f\(x\)\s*=\s*)?\s*(.+)$/i);
    if (graphRequestMatch) {
      const expressionString = graphRequestMatch[1].trim();
      console.log('Graphing intent detected for expression:', expressionString);
      const width = 600; //px
      const height = 400; //px
      const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });

      let compiledExpr;
      try {
        compiledExpr = math.compile(expressionString);
      } catch (error) {
        console.error('Error compiling expression:', error);
        return res.status(400).json({ 
          type: "error", 
          kanaResponse: `Sorry, I couldn't understand the mathematical expression: ${expressionString}. Error: ${error.message}` 
        });
      }

      const labels = [];
      const dataPoints = [];
      const xMinPlot = -5; // Default x-range min
      const xMaxPlot = 5;  // Default x-range max
      const steps = 100;
      let minActualY = Infinity;
      let maxActualY = -Infinity;

      for (let i = 0; i <= steps; i++) {
        const x = xMinPlot + (xMaxPlot - xMinPlot) * i / steps;
        labels.push(x.toFixed(2));
        let yValue;
        try {
          yValue = compiledExpr.evaluate({ ...parameterScope, x: x });
          if (typeof yValue !== 'number' || !isFinite(yValue)) {
            yValue = null; // Handle non-numeric results or infinities for plotting
          }
        } catch (evalError) {
          console.error(`Error evaluating expression at x=${x}:`, evalError);
          yValue = null; // Plot as a gap if evaluation fails for a point
        }
        dataPoints.push(yValue);
        if (yValue !== null) {
          minActualY = Math.min(minActualY, yValue);
          maxActualY = Math.max(maxActualY, yValue);
        }
      }

      // Determine y-axis range with padding
      let yAxisMin = minActualY;
      let yAxisMax = maxActualY;
      if (minActualY === Infinity) { // All points were null or no valid points
        yAxisMin = -1; yAxisMax = 1; // Default if no data
      } else {
        const padding = Math.abs(maxActualY - minActualY) * 0.1 || 1; // 10% padding or 1 unit if flat
        yAxisMin -= padding;
        yAxisMax += padding;
      }

      const configuration = {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: expressionString,
            data: dataPoints,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            fill: false
          }]
        },
        options: {
          scales: {
            y: {
              min: yAxisMin,
              max: yAxisMax
            },
            x: {
              title: {
                display: true,
                text: 'Radians'
              }
            }
          },
          plugins: {
            title: {
                display: true,
                text: 'Graph of y = ' + expressionString
            }
          }
        }
      };

      const dataUrl = await chartJSNodeCanvas.renderToDataURL(configuration);
      return res.json({
        type: "mathematical_graph",
        kanaResponse: `Here is the graph of y = ${expressionString}:`,
        generatedImageUrl: dataUrl
      });
    }
    // End of graphing logic, proceed to Gemini if not a graph request

    let systemPrompt = `You are K.A.N.A. (Knowledge Assistant for Natural Academics). Your purpose is to help students learn and understand academic topics. Be encouraging, clear, and break down complex ideas. If a question is off-topic or inappropriate, gently guide them back to an educational topic. Do not invent information; if you don't know something, say so. Prioritize using the provided PDF context if available and relevant. When you ask a direct yes/no question, interpret simple user responses like "yes", "no", "okay", "sure", etc., as direct answers to your question and continue the conversation accordingly, rather than treating them as new, unrelated queries.`;

    if (uploadedNoteContent) {
      systemPrompt += `\n\nIMPORTANT: The user has uploaded a note titled '${uploadedNoteName}'. Use the following content from this note to answer their questions if relevant:\n---BEGIN UPLOADED NOTE CONTENT---\n${uploadedNoteContent}\n---END UPLOADED NOTE CONTENT---`;
    }

    let pdfContext = '';

    if (activePdfUrl) {
      try {
        if (pdfCache[activePdfUrl]) {
          pdfContext = pdfCache[activePdfUrl];
          console.log(`Cache HIT for PDF: ${activePdfUrl}. Using cached text.`);
        } else {
          console.log(`Cache MISS for PDF: ${activePdfUrl}. Fetching and parsing...`);
          const pdfResponse = await axios.get(activePdfUrl, { responseType: 'arraybuffer' });
          const pdfData = await pdf(pdfResponse.data);
          console.log('DEBUG: Initial pdfData.text (first 500 chars):', pdfData.text ? pdfData.text.substring(0, 500) : 'No text found'); // Log initial snippet
          const MIN_TEXT_LENGTH = 200;
          const watermarkPattern = /CamScanner/ig;
          if (pdfData.text && pdfData.text.length >= MIN_TEXT_LENGTH && !watermarkPattern.test(pdfData.text.substring(0, MIN_TEXT_LENGTH * 2))) {
            const MAX_PDF_CONTEXT_LENGTH = 15000; // Max context for Gemini (adjust as needed for model limits)
            pdfContext = pdfData.text.substring(0, MAX_PDF_CONTEXT_LENGTH);
            console.log(`Extracted ${pdfContext.length} characters of text from PDF using pdf-parse.`);
            if (cacheKeys.length >= MAX_CACHE_SIZE) {
              const oldestKey = cacheKeys.shift();
              delete pdfCache[oldestKey];
              console.log(`Cache full. Evicted: ${oldestKey}`);
            }
            pdfCache[activePdfUrl] = pdfContext;
            cacheKeys.push(activePdfUrl);
            console.log(`Stored PDF text in cache: ${activePdfUrl}`);
          } else {
            pdfContext = '';
            if (!pdfData.text || pdfData.text.length < MIN_TEXT_LENGTH) console.log(`Extracted text is too short (${pdfData.text ? pdfData.text.length : 0} chars). Skipping PDF context.`);
            if (pdfData.text && watermarkPattern.test(pdfData.text.substring(0, MIN_TEXT_LENGTH * 2))) console.log('Extracted text appears to be primarily watermarks. Skipping PDF context.');
          }
        }
      } catch (pdfError) {
        console.error('Error fetching or parsing PDF for Q&A:', pdfError.message);
      }
    }

    // Construct prompt for Gemini
    // For gemini-pro, a direct instruction-like prompt works well.
    // The system prompt sets the persona, PDF context provides specific info, and message is the user's query.
    let fullPromptForGemini = systemPrompt; // Start with the system prompt defining K.A.N.A.
    if (pdfContext) {
      fullPromptForGemini += `\n\nConsider the following document context before answering the user's question:\n---BEGIN DOCUMENT CONTEXT---\n${pdfContext}\n---END DOCUMENT CONTEXT---`;
    }
    fullPromptForGemini += `\n\nUser's question: ${message}\n\nK.A.N.A.'s Answer:`; // Clearly demarcate where K.A.N.A. should respond

    console.log('Sending prompt to Google Gemini:', fullPromptForGemini);

    const result = await geminiModel.generateContent(fullPromptForGemini);
    const response = await result.response;
    const aiResponseText = await response.text();
    
    console.log('Received from Google Gemini:', aiResponseText);
    res.json({ kanaResponse: aiResponseText });
  } catch (error) {
    console.error('Error in /api/kana/chat:', error);
    res.status(500).json({ kanaResponse: 'An error occurred on the server.', error: error.message });
  }
});

// K.A.N.A. Image Generation and Explanation API endpoint
app.post('/api/kana/generate-and-explain', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (!HUGGING_FACE_API_TOKEN) {
    console.error('Hugging Face API Token is not configured for image generation.');
    return res.status(500).json({ error: 'Image generation service not configured (missing HF Token).' });
  }
  if (!GOOGLE_API_KEY || !geminiModel) {
    console.error('Google API Key is not configured or Gemini model failed to initialize for explanation.');
    return res.status(500).json({ error: 'Text explanation service not configured (Gemini issue).' });
  }

  // Attempt to extract image prompt. Example: "Generate an image of a cat riding a unicorn and explain it."
  // This regex looks for "Generate an image of ... and explain it."
  const imagePromptRegex = /generate an image of (.*?) and explain it/i;
  const match = message.match(imagePromptRegex);
  let imagePromptText = '';

  if (match && match[1]) {
    imagePromptText = match[1].trim();
  } else {
    // Fallback or a simpler trigger phrase if the complex regex fails
    const simpleImageTrigger = "generate image: ";
    if (message.toLowerCase().startsWith(simpleImageTrigger)) {
        imagePromptText = message.substring(simpleImageTrigger.length).trim();
    } else {
        return res.status(400).json({ error: 'Could not understand the image generation request. Try: "Generate an image of [your idea] and explain it." or "Generate image: [your idea]"' });
    }
  }

  if (!imagePromptText) {
    return res.status(400).json({ error: 'Image prompt is empty. Please specify what image to generate.' });
  }

  try {
    // 1. Generate Image with Hugging Face
    console.log(`Sending to Hugging Face for image generation: "${imagePromptText}"`);
    const hfImageResponse = await axios.post(
      HF_IMAGE_MODEL_URL,
      { inputs: imagePromptText },
      {
        headers: { 
          'Authorization': `Bearer ${HUGGING_FACE_API_TOKEN}`,
          'Accept': 'image/jpeg' // Specify that we want a JPEG image
        },
        responseType: 'arraybuffer' // Get image as binary data
      }
    );

    const imageBase64 = Buffer.from(hfImageResponse.data, 'binary').toString('base64');
    const imageUrl = `data:image/jpeg;base64,${imageBase64}`;
    console.log('Image generated and converted to base64.');

    // 2. Get Explanation from Gemini (based on the image prompt)
    const explanationPrompt = `An image was generated based on the following idea: "${imagePromptText}". Please provide a brief explanation of this concept or subject.`;
    console.log('Sending prompt to Google Gemini for explanation:', explanationPrompt);

    const geminiResult = await geminiModel.generateContent(explanationPrompt);
    const geminiResponse = await geminiResult.response;
    const explanationText = await geminiResponse.text();
    console.log('Received explanation from Google Gemini:', explanationText);

    res.json({ 
      kanaResponse: explanationText, // For consistency with chat endpoint
      generatedImageUrl: imageUrl, 
      explanation: explanationText 
    });

  } catch (error) {
    console.error('Error in generate-and-explain endpoint:');
    if (error.response && error.response.data) {
      // Try to decode error from Hugging Face if it's JSON
      try {
        const errorDataString = Buffer.from(error.response.data).toString('utf-8');
        const errorJson = JSON.parse(errorDataString);
        console.error('HF/Gemini Error Data:', errorJson);
        if (errorJson.error && errorJson.error.includes('currently loading')) {
            return res.status(503).json({ error: `The image model is currently loading. Estimated time: ${errorJson.estimated_time || 'a moment'}. Please try again.`});
        }
      } catch (e) {
        console.error('Raw Error Data (not JSON):', Buffer.from(error.response.data).toString('utf-8'));
      }
      console.error('Status:', error.response.status);
    }
    console.error('Error Message:', error.message);
    res.status(500).json({ error: 'Failed to generate image or get explanation.', details: error.message });
  }
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(port, () => {
  console.log(`K.A.N.A. backend server listening at http://localhost:${port}`);
});


// Catch-all for 404 Not Found errors
app.use((req, res, next) => {
  res.status(404).send("Sorry, can't find that!");
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`K.A.N.A. backend server listening at http://localhost:${port}`);
});
