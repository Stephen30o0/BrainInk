const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const pdf = require('pdf-parse');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const fsPromises = fs.promises;

// Import tournament routes
const tournamentRoutes = require('./routes/tournaments');

// Import and initialize database
const { testConnection, initializeTables } = require('./database');

const app = express();
const port = process.env.PORT || 10000;

// --- CONFIGURATION & INITIALIZATION ---

console.log('DEBUG: Loaded GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'Key Loaded' : 'Key NOT Loaded');
console.log('DEBUG: Loaded CORE_API_KEY:', process.env.CORE_API_KEY ? 'Key Loaded' : 'Key NOT Loaded');

const conversationContexts = {};

const systemInstruction = {
  parts: [{
    text: `You are K.A.N.A., an advanced academic AI assistant. Your primary goal is to help users.

Key characteristics:
- Knowledgeable & Context-Aware: Provide accurate, in-depth information. Use context from uploads when available.
- Versatile & Interactive: Assist with a wide range of academic subjects.
- **Conversational Memory & Variables**: Pay close attention to the entire conversation history. If the user defines a variable (e.g., 'let a = 5'), you must remember and use that value in subsequent calculations or plots. The variables 'x' and 'y' are RESERVED for graphing axes and cannot be assigned values. If a user tries to assign a value to 'x' or 'y', you must inform them of this rule and refuse the assignment.

- IMPORTANT GRAPHING TASK: You have a tool for plotting mathematical functions named 'generate_graph_data'. If a user asks to 'plot' or 'graph' a function, you MUST use this tool. Use a default range of -10 to 10 if the user does not provide one. If the user provides an equation with a variable you remember from the conversation, substitute it before plotting.

- Tool User: You can also generate text and analyze images/notes.

Interaction Guidelines:
- If you don't know something, say so.
- Maintain a supportive, professional, and encouraging tone.`
  }]
};

// --- MIDDLEWARE ---

const allowedOrigins = [
  'https://brain-ink.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://mozilla.github.io'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json({ limit: '50mb' }));

// --- FILE UPLOAD (Multer) ---

const STUDY_MATERIALS_DIR = path.join(__dirname, 'uploads', 'study_materials');
if (!fs.existsSync(STUDY_MATERIALS_DIR)) {
  fs.mkdirSync(STUDY_MATERIALS_DIR, { recursive: true });
}
const studyMaterialStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, STUDY_MATERIALS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'studyMaterial-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadStudyFile = multer({ storage: studyMaterialStorage, limits: { fileSize: 500 * 1024 * 1024 } });

const IMAGES_DIR = path.join(__dirname, 'uploads', 'images');
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadImage = multer({ storage: imageStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// Serve static files at the paths expected by the frontend
app.use('/study_material_files', express.static(STUDY_MATERIALS_DIR));
app.use('/api/kana/study_material_files', express.static(STUDY_MATERIALS_DIR));
app.use('/images', express.static(IMAGES_DIR));
app.use('/api/kana/images', express.static(IMAGES_DIR));
console.log(`DEBUG: Serving static files from ${STUDY_MATERIALS_DIR} at /study_material_files and /api/kana/study_material_files`);
console.log(`DEBUG: Serving static files from ${IMAGES_DIR} at /images and /api/kana/images`);

// Tournament routes
app.use('/api/tournaments', tournamentRoutes);
console.log('DEBUG: Tournament routes enabled');

// --- API CLIENTS ---

let genAI, geminiModel;
if (process.env.GOOGLE_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", systemInstruction });
  console.log('DEBUG: Google AI SDK initialized.');
} else {
  console.error('FATAL: GOOGLE_API_KEY not found. AI services will not work.');
}

// --- DATABASE (JSON file) ---

const DB_PATH = path.join(__dirname, 'study_materials.json');
let studyMaterialsDb = [];
const loadDb = async () => {
  try {
    const data = await fsPromises.readFile(DB_PATH, 'utf8');
    studyMaterialsDb = JSON.parse(data);
    console.log('DEBUG: study_materials.json loaded successfully.');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('DEBUG: study_materials.json not found, will be created on first save.');
    } else {
      console.error('ERROR loading study_materials.json:', error);
    }
  }
};
const saveDb = () => fsPromises.writeFile(DB_PATH, JSON.stringify(studyMaterialsDb, null, 2), 'utf8');

// --- HELPERS ---

const getOrCreateConversation = (conversationId) => {
  if (!conversationContexts[conversationId]) {
    console.log(`DEBUG: Creating new context for conversationId: ${conversationId}`);
    conversationContexts[conversationId] = {
      history: [],
      contextParts: [],
    };
  }
  return conversationContexts[conversationId];
};

const extractTextFromFile = async (mimetype, buffer) => {
  if (mimetype === 'application/pdf') {
    const data = await pdf(buffer);
    return data.text;
  } else if (mimetype.startsWith('text/')) {
    return buffer.toString('utf8');
  }
  return ''; // Return empty for unsupported types
};

// --- DATABASE INITIALIZATION ---
async function initializeDatabase() {
  console.log('🔌 Initializing database connection...');
  console.log('📋 Environment check:');
  console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configured' : '❌ Missing');
  console.log('  - NODE_ENV:', process.env.NODE_ENV || 'development');

  const connected = await testConnection();
  if (connected) {
    const tablesCreated = await initializeTables();
    if (tablesCreated) {
      console.log('✅ Tournament database ready');
      return true;
    } else {
      console.log('⚠️ Database tables initialization failed');
      return false;
    }
  } else {
    console.log('⚠️ Database connection failed - using fallback mode');
    console.log('📝 To fix this:');
    console.log('   1. Set DATABASE_URL environment variable in Render dashboard');
    console.log('   2. Use your Supabase connection string');
    console.log('   3. Redeploy the service');
    return false;
  }
}

// --- API ENDPOINTS ---

app.get('/api/study-materials', (req, res) => {
  res.json(studyMaterialsDb);
});

app.delete('/api/study-materials/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const materialIndex = studyMaterialsDb.findIndex(m => m.id === id);
    if (materialIndex === -1) {
      return res.status(404).json({ error: 'Study material not found.' });
    }

    const material = studyMaterialsDb[materialIndex];

    // If there's an associated file, delete it from the server
    if (material.filePath) {
      try {
        await fsPromises.unlink(material.filePath);
        console.log(`Deleted file: ${material.filePath}`);
      } catch (fileError) {
        // Log the error but don't block deletion of the DB entry
        console.error(`Error deleting file ${material.filePath}:`, fileError);
      }
    }

    // Remove the material from the database array
    studyMaterialsDb.splice(materialIndex, 1);

    // Save the updated database
    await saveDb();

    console.log(`Deleted study material with ID: ${id}`);
    res.status(200).json({ message: 'Study material deleted successfully.' });

  } catch (error) {
    console.error('Error deleting study material:', error);
    res.status(500).json({ error: 'An internal error occurred while deleting the material.' });
  }
});

app.post('/api/upload-study-material', uploadStudyFile.single('studyMaterial'), async (req, res) => {
  const { conversationId } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  // conversationId is now optional. If provided, the file content will be added to the conversation context.

  try {
    const materialId = crypto.randomUUID();
    const newMaterial = {
      id: materialId,
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      filePath: req.file.path,
      mimetype: req.file.mimetype,
      topic: req.body.topic || 'General',
      uploadTimestamp: new Date().toISOString(),
      size: req.file.size,
    };

    studyMaterialsDb.push(newMaterial);
    await saveDb();

    const fileBuffer = await fsPromises.readFile(newMaterial.filePath);
    const fileTextContent = await extractTextFromFile(newMaterial.mimetype, fileBuffer);

    // If a conversationId is provided, add the file's text content to that conversation's context.
    if (conversationId && fileTextContent) {
      const conversation = getOrCreateConversation(conversationId);
      conversation.contextParts.push({
        text: `--- START OF FILE: ${newMaterial.originalFilename} ---\n${fileTextContent}\n--- END OF FILE: ${newMaterial.originalFilename} ---`
      });
      console.log(`DEBUG: Added content of ${newMaterial.originalFilename} to context for conversation ${conversationId}.`);
    }

    res.status(201).json({ message: 'File uploaded successfully!', file: newMaterial });
  } catch (error) {
    console.error(`ERROR processing uploaded file: ${error.message}`);
    if (req.file && req.file.path) {
      await fsPromises.unlink(req.file.path).catch(err => console.error("Error cleaning up file:", err));
    }
    res.status(500).json({ error: 'Failed to save or process file.' });
  }
});

app.get('/pdf-proxy', async (req, res) => {
  const { file, url } = req.query;
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow cross-origin requests

  if (!file && !url) {
    return res.status(400).json({ error: 'Missing "file" or "url" query parameter.' });
  }

  try {
    if (file) {
      const sanitizedFile = path.basename(file);
      const filePath = path.join(STUDY_MATERIALS_DIR, sanitizedFile);

      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        return fs.createReadStream(filePath).pipe(res);
      } else {
        return res.status(404).json({ error: 'Local file not found.' });
      }
    } else { // url
      new URL(url); // Validate URL format
      const response = await axios({ method: 'get', url: url, responseType: 'stream' });
      res.setHeader('Content-Type', 'application/pdf');
      return response.data.pipe(res);
    }
  } catch (error) {
    console.error('PDF Proxy Error:', error.message);
    if (error.message.includes('Invalid URL')) {
      return res.status(400).json({ error: 'Invalid URL format provided.' });
    }
    return res.status(500).json({ error: 'Failed to fetch or process URL content.' });
  }
});

// Add /api/kana/pdf-proxy route for frontend compatibility
app.get('/api/kana/pdf-proxy', async (req, res) => {
  const { file, url } = req.query;
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow cross-origin requests

  if (!file && !url) {
    return res.status(400).json({ error: 'Missing "file" or "url" query parameter.' });
  }

  try {
    if (file) {
      const sanitizedFile = path.basename(file);
      const filePath = path.join(STUDY_MATERIALS_DIR, sanitizedFile);

      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        return fs.createReadStream(filePath).pipe(res);
      } else {
        return res.status(404).json({ error: 'Local file not found.' });
      }
    } else { // url
      new URL(url); // Validate URL format
      const response = await axios({ method: 'get', url: url, responseType: 'stream' });
      res.setHeader('Content-Type', 'application/pdf');
      return response.data.pipe(res);
    }
  } catch (error) {
    console.error('PDF Proxy Error:', error.message);
    if (error.message.includes('Invalid URL')) {
      return res.status(400).json({ error: 'Invalid URL format provided.' });
    }
    return res.status(500).json({ error: 'Failed to fetch or process URL content.' });
  }
});

app.post('/api/fetch-url-content', async (req, res) => {
  const { url, conversationId } = req.body;
  if (!url || !conversationId) {
    return res.status(400).json({ error: 'url and conversationId are required.' });
  }

  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', headers: { 'User-Agent': 'Mozilla/5.0' } });
    const contentType = response.headers['content-type'];
    let contentText = '';

    if (contentType && contentType.includes('application/pdf')) {
      contentText = await extractTextFromFile('application/pdf', response.data);
    } else {
      contentText = response.data.toString('utf-8').replace(/<[^>]*>/g, ' ').replace(/\s\s+/g, ' ').trim();
    }

    if (contentText) {
      const conversation = getOrCreateConversation(conversationId);
      conversation.contextParts.push({ text: `--- START OF WEB CONTENT: ${url} ---\n${contentText}\n--- END OF WEB CONTENT: ${url} ---` });
      console.log(`DEBUG: Added content from ${url} to context for conversation ${conversationId}.`);
      res.status(200).json({ message: 'URL content fetched and added to context successfully.' });
    } else {
      res.status(200).json({ message: 'No text content could be extracted from the URL.' });
    }
  } catch (error) {
    console.error(`ERROR fetching URL content: ${error.message}`);
    res.status(500).json({ error: `Failed to fetch or process content from URL: ${url}` });
  }
});

// Helper for exponential backoff
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.get('/api/core-search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }
  if (!process.env.CORE_API_KEY) {
    console.log('CORE_API_KEY is not set. Returning mock data for demo purposes.');
    // Return mock search results for demo purposes
    const mockResults = [
      {
        coreId: 'mock-1',
        title: `Sample Research Paper: ${q}`,
        authors: ['Demo Author', 'Research Team'],
        abstract: `This is a demonstration abstract for the search term "${q}". In a production environment, this would contain real academic research results from the CORE academic search API.`,
        year: 2024,
        downloadUrl: null,
        doi: `10.1000/mock.${q}`,
        publisher: 'Demo Publisher'
      },
      {
        coreId: 'mock-2',
        title: `Advanced Studies in ${q}`,
        authors: ['Academic Researcher'],
        abstract: `An example research paper abstract related to ${q}. This is mock data shown when CORE API key is not configured.`,
        year: 2023,
        downloadUrl: null,
        doi: `10.1000/demo.${q}`,
        publisher: 'Academic Press'
      }
    ];
    return res.json(mockResults);
  }

  const searchUrl = 'https://api.core.ac.uk/v3/search/works';
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      console.log(`CORE Search: Attempt ${attempt + 1} for query \"${q}\"`);
      const response = await axios.post(searchUrl,
        { q: `title:(${q}) OR abstract:(${q})` },
        {
          headers: {
            'Authorization': `Bearer ${process.env.CORE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const transformedResults = response.data.results.map(item => ({
        coreId: item.id, title: item.title, authors: item.authors, abstract: item.abstract,
        year: item.yearPublished, downloadUrl: item.downloadUrl, doi: item.doi, publisher: item.publisher,
      }));
      return res.json(transformedResults);
    } catch (error) {
      const isServerBusy = error.response && (error.response.status === 503 || JSON.stringify(error.response.data).includes('rejected execution'));

      if (isServerBusy && attempt < MAX_RETRIES - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s
        console.warn(`CORE API is busy. Retrying in ${delay}ms...`);
        await sleep(delay);
        attempt++;
      } else {
        console.error('CORE API Search Error:', error.response ? error.response.data : error.message);
        const status = error.response ? error.response.status : 500;
        const message = error.response ? error.response.data : 'Failed to fetch from CORE API after multiple retries.';
        return res.status(status).json({ message });
      }
    }
  }
});

app.post('/api/save-external-item', async (req, res) => {
  const { title, authors, year, doi, downloadUrl, abstract } = req.body;
  if (!downloadUrl || !title) {
    return res.status(400).json({ error: 'downloadUrl and title are required.' });
  }

  try {
    const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `studyMaterial-${uniqueSuffix}.pdf`;
    const filePath = path.join(STUDY_MATERIALS_DIR, filename);
    await fsPromises.writeFile(filePath, response.data);

    const newMaterial = {
      id: crypto.randomUUID(),
      originalFilename: `${title}.pdf`,
      storedFilename: filename,
      filePath: filePath,
      mimetype: 'application/pdf',
      topic: 'CORE Import',
      uploadTimestamp: new Date().toISOString(),
      size: response.data.length,
      metadata: { title, authors, year, doi, abstract, source: 'CORE' }
    };
    studyMaterialsDb.push(newMaterial);
    await saveDb();
    res.status(201).json({ message: 'Successfully saved paper to library.', file: newMaterial });
  } catch (error) {
    console.error('Error saving external item:', error.message);
    res.status(500).json({ error: 'Failed to download or save the paper.' });
  }
});

const tools = [
  {
    functionDeclarations: [
      {
        name: 'generate_graph_data',
        description: 'Generates data for a mathematical graph based on a function string. Defaults to xMin=-10, xMax=10, step=1 if not provided.',
        parameters: {
          type: 'OBJECT',
          properties: {
            functionStr: { type: 'STRING', description: 'The mathematical function to be plotted, e.g., \'y = 2x + 5\'.' },
            xMin: { type: 'NUMBER', description: 'Optional. The minimum value for x. Defaults to -10.' },
            xMax: { type: 'NUMBER', description: 'Optional. The maximum value for x. Defaults to 10.' },
            step: { type: 'NUMBER', description: 'Optional. The increment step for x. Defaults to 1.' },
          },
          required: ['functionStr'],
        },
      },
    ],
  },
];

// Helper function to generate graph data and handle evaluation errors
async function generateGraphData(functionStr, xMin = -10, xMax = 10, step = 1) {
  console.log(`DEBUG: AI requested graph generation for function: ${functionStr} over [${xMin}, ${xMax}] with step ${step}`);
  const data = [];
  try {
    // WARNING: Using eval() is a security risk in production. This is a simplified example.
    let expression = functionStr.split('=')[1].trim();
    // Sanitize the expression to be valid JavaScript
    expression = expression
      .replace(/\^/g, '**') // Handle exponents (e.g., x^2 -> x**2)
      .replace(/(\d+\.?\d*)\s*([a-zA-Z(])/g, '$1 * $2') // Handle implicit multiplication with variables and parentheses (e.g., 2x -> 2 * x, 3(x) -> 3 * (x))
      .replace(/\)\( /g, ') * ('); // Handle implicit multiplication between parentheses (e.g., (x+1)(x-1) -> (x+1) * (x-1))

    const func = new Function('x', `return ${expression};`);
    for (let x = xMin; x <= xMax; x += step) {
      data.push({ x: x, y: func(x) });
    }
    return data; // Return data on success
  } catch (evalError) {
    console.error("Error evaluating math function:", evalError);
    return null; // Return null on failure
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { conversationId, message, history, pdfContextUrl, studyMaterialContext } = req.body;

    if (!conversationId || !message) {
      return res.status(400).json({ error: 'Missing conversationId or message.' });
    }

    const conversation = getOrCreateConversation(conversationId);
    const clientHistory = Array.isArray(history) ? history : [];

    // If there's a specific PDF context URL from a past paper, fetch and add it.
    if (pdfContextUrl) {
      try {
        console.log(`DEBUG: Fetching PDF context from URL: ${pdfContextUrl}`);
        const response = await axios.get(pdfContextUrl, { responseType: 'arraybuffer' });
        const pdfText = await extractTextFromFile('application/pdf', response.data);
        if (pdfText) {
          const contextIdentifier = `PAST PAPER CONTEXT: ${pdfContextUrl}`;
          // Avoid adding duplicate context by checking for the identifier
          if (!conversation.contextParts.some(p => p.text.includes(contextIdentifier))) {
            conversation.contextParts.push({ text: `--- START OF ${contextIdentifier} ---\n${pdfText}\n--- END OF ${contextIdentifier} ---` });
            console.log(`DEBUG: Added PDF context for conversation ${conversationId}.`);
          } else {
            console.log(`DEBUG: PDF context for ${pdfContextUrl} already exists.`);
          }
        }
      } catch (error) {
        console.error(`ERROR fetching or processing PDF context from ${pdfContextUrl}:`, error.message);
        // Non-fatal, just log and continue. The chat can proceed without this context.
      }
    }

    // If there's a specific study material context, find and add it.
    if (studyMaterialContext && studyMaterialContext.id) {
      console.log(`DEBUG: Received request to use study material context with ID: ${studyMaterialContext.id}`);
      try {
        const material = studyMaterialsDb.find(m => m.id === studyMaterialContext.id);
        if (material) {
          console.log(`DEBUG: Found study material: ${material.title}`);
          let materialText = null;

          // Case 1: Local file path exists
          if (material.filePath) {
            const fileBuffer = await fsPromises.readFile(material.filePath);
            materialText = await extractTextFromFile(material.mimetype, fileBuffer);
          }
          // Case 2: Remote PDF URL exists (and no local path)
          else if (material.pdfUrl) {
            console.log(`DEBUG: Fetching study material PDF from URL: ${material.pdfUrl}`);
            const response = await axios.get(material.pdfUrl, { responseType: 'arraybuffer' });
            materialText = await extractTextFromFile('application/pdf', response.data);
          }

          if (materialText) {
            const contextIdentifier = `STUDY MATERIAL CONTEXT: ${material.title}`;
            if (!conversation.contextParts.some(p => p.text.includes(contextIdentifier))) {
              conversation.contextParts.push({ text: `--- START OF ${contextIdentifier} ---\n${materialText}\n--- END OF ${contextIdentifier} ---` });
              console.log(`DEBUG: Added study material context for conversation ${conversationId}.`);
            } else {
              console.log(`DEBUG: Study material context for ${material.title} already exists.`);
            }
          } else {
            console.log(`WARN: Could not extract text from study material '${material.title}'.`);
          }
        } else {
          console.log(`WARN: Study material with id ${studyMaterialContext.id} not found.`);
        }
      } catch (error) {
        console.error(`ERROR processing study material context for id ${studyMaterialContext.id}:`, error.message);
      }
    }

    // Combine the base system instruction with any document context for this specific conversation.
    const effectiveSystemInstruction = {
      parts: [
        ...systemInstruction.parts,
        ...conversation.contextParts
      ]
    };

    const chat = geminiModel.startChat({
      history: [...conversation.history, ...clientHistory],
      tools: tools,
      systemInstruction: effectiveSystemInstruction,
      generationConfig: { maxOutputTokens: 8192 }
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    const functionCall = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;
    const userMessage = Array.isArray(message) ? message.find(p => p.text)?.text || '' : message;
    const isGraphRequest = /\b(plot|graph)\b/i.test(userMessage);

    if (isGraphRequest && functionCall && functionCall.name === 'generate_graph_data') {
      const { functionStr, xMin, xMax, step } = functionCall.args;
      const graphData = await generateGraphData(functionStr, xMin, xMax, step);

      if (graphData) {
        const imageUrl = await generateGraphImage(graphData, functionStr, 'x', 'y');
        if (imageUrl) {
          const kanaResponseText = `Here is the graph for ${functionStr}.`;
          conversation.history.push({ role: 'user', parts: [{ text: message }] });
          conversation.history.push({ role: 'model', parts: [{ text: kanaResponseText }] });
          return res.json({
            type: 'mathematical_graph',
            kanaResponse: kanaResponseText,
            generatedImageUrl: imageUrl
          });
        } else {
          // This case might happen if canvas fails, but the function was valid
          throw new Error("Graph image generation failed after data calculation.");
        }
      } else {
        // This case handles the evaluation error from generateGraphData
        const fallbackResponse = await chat.sendMessage("I tried to generate a graph, but there was an error with the function. Please check the mathematical expression and ensure it's valid.");
        const kanaResponseText = fallbackResponse.response.text();
        conversation.history.push({ role: 'user', parts: [{ text: message }] });
        conversation.history.push({ role: 'model', parts: [{ text: kanaResponseText }] });
        return res.json({ kanaResponse: kanaResponseText });
      }
    } else {
      const kanaResponseText = response.text();
      console.log(`DEBUG: AI returned no function call. Raw response object:`, JSON.stringify(response, null, 2));
      conversation.history.push({ role: 'user', parts: [{ text: message }] });
      conversation.history.push({ role: 'model', parts: [{ text: kanaResponseText }] });
      return res.json({ kanaResponse: kanaResponseText });
    }
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: 'Failed to get response from K.A.N.A.' });
  }
});

app.post('/api/clear-note-context', (req, res) => {
  try {
    if (!req.body) {
      console.error('Error: /api/clear-note-context called with no request body.');
      return res.status(400).json({ error: 'Request body is missing or malformed.' });
    }
    const { conversationId } = req.body;
    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId is required in request body.' });
    }

    if (conversationContexts[conversationId]) {
      console.log(`DEBUG: Clearing context for conversationId: ${conversationId}`);
      // Reset the context for the given conversation
      conversationContexts[conversationId] = {
        history: [],
        contextParts: [],
      };
    }
    // Always return success, even if there was no context to clear.
    res.status(200).json({ message: 'Context cleared successfully.' });
  } catch (error) {
    console.error('Error in /clear-note-context:', error);
    res.status(500).json({ error: 'An unexpected error occurred while clearing context.' });
  }
});

app.post('/api/kana/generate-quiz', async (req, res) => {
  const { sourceMaterialId, difficulty, numQuestions } = req.body;
  if (!sourceMaterialId || !difficulty || !numQuestions) {
    return res.status(400).json({ error: 'sourceMaterialId, difficulty, and numQuestions are required.' });
  }

  try {
    const material = studyMaterialsDb.find(m => m.id === sourceMaterialId);
    if (!material) return res.status(404).json({ error: 'Source material not found.' });

    const fileBuffer = await fsPromises.readFile(material.filePath);
    const textContent = await extractTextFromFile(material.mimetype, fileBuffer);
    if (!textContent) return res.status(400).json({ error: 'Could not extract text from the material.' });

    const prompt = `Based on the following text, generate a quiz with ${numQuestions} questions at a ${difficulty} difficulty level. Format the output as a single JSON object. Each question should be an object with "question", "options" (an array of 4 strings), and "answer" (the correct string from options). The root of the JSON should be a single object with a key "quiz".\n\nTEXT: ${textContent.substring(0, 10000)}`;

    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text().trim().replace(/^```json\n|```$/g, '');
    const quizJson = JSON.parse(responseText);

    res.json(quizJson);
  } catch (error) {
    console.error('Error in /generate-quiz:', error);
    res.status(500).json({ error: 'Failed to generate quiz: ' + error.message });
  }
});

app.delete('/api/study-materials/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const materialIndex = studyMaterialsDb.findIndex(m => m.id === id);
    if (materialIndex === -1) {
      return res.status(404).json({ error: 'Study material not found.' });
    }

    const material = studyMaterialsDb[materialIndex];

    // If there's an associated file, delete it from the server
    if (material.filePath) {
      try {
        await fsPromises.unlink(material.filePath);
        console.log(`Deleted file: ${material.filePath}`);
      } catch (fileError) {
        // Log the error but don't block deletion of the DB entry
        console.error(`Error deleting file ${material.filePath}:`, fileError);
      }
    }

    // Remove the material from the database array
    studyMaterialsDb.splice(materialIndex, 1);

    // Save the updated database
    await saveDb();

    console.log(`Deleted study material with ID: ${id}`);
    res.status(200).json({ message: 'Study material deleted successfully.' });

  } catch (error) {
    console.error('Error deleting study material:', error);
    res.status(500).json({ error: 'An internal error occurred while deleting the material.' });
  }
});

app.get('/', (req, res) => {
  res.send('K.A.N.A. Backend is running!');
});

// --- GRAPH GENERATION HELPER ---
const generateGraphImage = async (data, title, xLabel, yLabel) => {
  try {
    console.log("DEBUG: Generating graph with data:", data);
    const configuration = {
      type: 'line',
      data: {
        labels: data.map(p => p.x),
        datasets: [{
          label: title,
          data: data.map(p => p.y),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: xLabel || 'X Axis'
            }
          },
          y: {
            title: {
              display: true,
              text: yLabel || 'Y Axis'
            }
          }
        }
      }
    };

    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    const filename = `graph-${Date.now()}.png`;
    const imagePath = path.join(IMAGES_DIR, filename);
    fs.writeFileSync(imagePath, imageBuffer);
    console.log(`DEBUG: Saved graph image to ${imagePath}`);
    return `/images/${filename}`;
  } catch (error) {
    console.error("Error generating graph image:", error);
    return null;
  }
};

const startServer = async () => {
  await loadDb();
  await initializeDatabase();
  const fileToGenerativePart = (filePath, mimeType) => {
    return {
      inlineData: {
        data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
        mimeType
      },
    };
  };

  app.post('/api/analyze-image', uploadImage.single('imageFile'), async (req, res) => {
    try {
      const { conversationId, message } = req.body;
      const imageFile = req.file;

      if (!imageFile) {
        return res.status(400).json({ error: 'No image file uploaded.' });
      }
      if (!conversationId) {
        return res.status(400).json({ error: 'Missing conversationId.' });
      }

      console.log(`DEBUG: Analyzing image for conversation ${conversationId}. Message: "${message}"`);

      const conversation = getOrCreateConversation(conversationId);
      const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const imagePart = fileToGenerativePart(imageFile.path, imageFile.mimetype);

      const userMessageText = message || 'Please analyze this image.';
      conversation.history.push({ role: 'user', parts: [{ text: userMessageText }] });

      const result = await visionModel.generateContent([userMessageText, imagePart]);
      const kanaResponseText = result.response.text();

      conversation.history.push({ role: 'model', parts: [{ text: kanaResponseText }] });

      const imageUrl = `/images/${imageFile.filename}`;

      res.json({
        kanaResponse: kanaResponseText,
        imageUrl: imageUrl,
        explanation: kanaResponseText
      });

    } catch (error) {
      console.error('Error analyzing image:', error);
      res.status(500).json({ error: 'Failed to analyze image.' });
    } finally {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error(`Error deleting temp image file: ${req.file.path}`, err);
        });
      }
    }
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`K.A.N.A. Backend listening on port ${port}`);
  });
};

startServer();

// New endpoint for Chainlink Functions - Daily Quiz Generation
app.post('/api/kana/generate-daily-quiz', async (req, res) => {
  const { topic, difficulty = 'medium', numQuestions = 1 } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required for daily quiz generation.' });
  }

  try {
    // Create a more focused prompt for daily challenges
    const prompt = `Generate a single educational quiz question about ${topic} at ${difficulty} difficulty level. 
    
Focus on:
- Practical knowledge and real-world applications
- Current trends and developments in ${topic}
- Fundamental concepts that learners should know
- Make it engaging and thought-provoking

Format the output as a single JSON object with this exact structure:
{
  "quiz": [
    {
      "question": "The question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "The exact text of the correct option from the options array"
    }
  ]
}

Topic: ${topic}
Difficulty: ${difficulty}
Style: Educational, clear, and engaging`;

    console.log(`Generating daily quiz for topic: ${topic}, difficulty: ${difficulty}`);

    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text().trim().replace(/^```json\n|```$/g, '');

    try {
      const quizJson = JSON.parse(responseText);

      // Validate the structure
      if (!quizJson.quiz || !Array.isArray(quizJson.quiz) || quizJson.quiz.length === 0) {
        throw new Error('Invalid quiz structure');
      }

      const quiz = quizJson.quiz[0];
      if (!quiz.question || !quiz.options || !Array.isArray(quiz.options) || quiz.options.length !== 4 || !quiz.answer) {
        throw new Error('Invalid quiz question structure');
      }

      // Verify the answer is in the options
      if (!quiz.options.includes(quiz.answer)) {
        throw new Error('Answer not found in options');
      }

      console.log(`Successfully generated daily quiz for ${topic}`);
      res.json(quizJson);

    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response:', responseText);

      // Return a fallback quiz
      const fallbackQuiz = {
        quiz: [{
          question: `What is a key concept in ${topic}?`,
          options: [
            "Centralized control",
            "Decentralized architecture",
            "Single point of failure",
            "Manual processes"
          ],
          answer: "Decentralized architecture"
        }]
      };

      res.json(fallbackQuiz);
    }

  } catch (error) {
    console.error('Error in /generate-daily-quiz:', error);

    // Return a fallback quiz in case of error
    const fallbackQuiz = {
      quiz: [{
        question: `What is an important aspect of ${topic || 'technology'}?`,
        options: [
          "Innovation and progress",
          "Maintaining status quo",
          "Avoiding change",
          "Limiting access"
        ],
        answer: "Innovation and progress"
      }]
    };

    res.json(fallbackQuiz);
  }
});

<<<<<<< HEAD
// === KANA-DIRECT ENDPOINT (for dashboard compatibility) ===
console.log('DEBUG: Registering /kana-direct endpoint...');
app.post('/kana-direct', async (req, res) => {
  console.log('DEBUG: /kana-direct endpoint called from dashboard!');
  console.log('DEBUG: Request headers:', req.headers);
  console.log('DEBUG: Request body type:', typeof req.body);
  console.log('DEBUG: Request body:', req.body ? JSON.stringify(req.body) : 'undefined/null');
  try {
    const { 
      image_data, 
      image_analysis, 
      pdf_data, 
      pdf_analysis, 
      context, 
      image_filename,
      grading_mode,
      assignment_type,
      max_points,
      grading_rubric,
      student_context,
      analysis_type
    } = req.body || {};
    
    console.log(`DEBUG: Received dashboard request - image_analysis: ${image_analysis}, pdf_analysis: ${pdf_analysis}, grading_mode: ${grading_mode}`);
    
    // Handle PDF analysis first
    if (pdf_analysis && pdf_data) {
      console.log('DEBUG: Processing dashboard PDF analysis...');
      
      try {
        // Convert base64 PDF to buffer and extract text
        const pdfBuffer = Buffer.from(pdf_data, 'base64');
        console.log(`DEBUG: PDF buffer size: ${pdfBuffer.length} bytes`);
        
        const pdfData = await pdf(pdfBuffer);
        const extractedText = pdfData.text;
        console.log(`DEBUG: Extracted text length: ${extractedText.length} characters`);
        
        if (!extractedText || extractedText.trim().length === 0) {
          return res.status(400).json({
            error: 'No text found in PDF',
            analysis: 'The PDF appears to be empty or contains only images',
            knowledge_gaps: ['PDF processing issue'],
            recommendations: ['Try uploading a PDF with text content or convert images to text first'],
            confidence: 0.0,
            extracted_text: 'No text extracted from PDF'
          });
        }
        
        if (!geminiModel) {
          console.error('Gemini model not initialized');
          return res.status(500).json({
            error: 'AI model not available',
            analysis: 'AI analysis service unavailable',
            knowledge_gaps: ['Service configuration issue'],
            recommendations: ['Check AI service configuration'],
            confidence: 0.0,
            extracted_text: extractedText
          });
        }
        
        // Create analysis prompt based on grading mode
        let analysisPrompt;
        if (grading_mode) {
          analysisPrompt = `You are an expert teacher grading a student assignment. Please analyze and grade this student work.

**ASSIGNMENT DETAILS:**
- Assignment Type: ${assignment_type || 'General Assignment'}
- Maximum Points: ${max_points || 100}
- Grading Rubric: ${grading_rubric || 'Standard academic grading criteria'}
- Student Context: ${student_context || 'Student assignment'}

**STUDENT WORK TEXT:**
${extractedText}

Please provide a comprehensive grading analysis in the following format:

**GRADE:** [Numerical score out of ${max_points || 100}]

**TEXT EXTRACTION:**
[Confirm the text was properly extracted]

**GRADING BREAKDOWN:**
• Content Understanding: [Score/Points] - [Feedback]
• Technical Accuracy: [Score/Points] - [Feedback]  
• Organization & Structure: [Score/Points] - [Feedback]
• Critical Thinking: [Score/Points] - [Feedback]

**OVERALL FEEDBACK:**
[Comprehensive feedback on the assignment]

**STUDENT STRENGTHS:**
• [Strength 1 - what the student did well]
• [Strength 2 - another positive aspect]
• [Strength 3 - additional accomplishment]

**AREAS FOR IMPROVEMENT:**
• [Area 1 - specific improvement needed]
• [Area 2 - concept requiring work]
• [Area 3 - skill to develop]

**RECOMMENDATIONS:**
• [Recommendation 1 - specific next step]
• [Recommendation 2 - study suggestion]
• [Recommendation 3 - practice area]

Provide detailed, constructive feedback that will help the student improve.`;
        } else {
          analysisPrompt = `You are an expert educational AI analyzing student work from a PDF document. Please provide a comprehensive analysis.

**STUDENT WORK TEXT:**
${extractedText}

Please analyze this student work and provide structured feedback in the following format:

**TEXT EXTRACTION:**
[Confirm all visible text was properly extracted]

**SUBJECT ANALYSIS:**
[Identify the subject and specific topics covered]

**STUDENT STRENGTHS:**
• [Strength 1 - what the student demonstrates well]
• [Strength 2 - another area of competence]
• [Strength 3 - additional positive observations]

**KNOWLEDGE GAPS:**
• [Gap 1 - specific area needing improvement]
• [Gap 2 - concept requiring reinforcement]
• [Gap 3 - skill to develop further]

**LEARNING LEVEL:**
[Academic level assessment]

**TEACHING RECOMMENDATIONS:**
• [Recommendation 1 - specific teaching strategy]
• [Recommendation 2 - targeted intervention]
• [Recommendation 3 - additional support needed]

**NEXT LEARNING STEPS:**
• [Step 1 - immediate next practice area]
• [Step 2 - follow-up skill development]
• [Step 3 - advanced concept to introduce]

Context: ${student_context || 'teacher_dashboard_pdf_analysis'}
Analysis Type: ${analysis_type || 'pdf_student_work'}

Provide detailed, actionable insights that will help teachers understand and support this student's learning.`;
        }
        
        console.log('DEBUG: Sending PDF text to Gemini for analysis...');
        const result = await geminiModel.generateContent(analysisPrompt);
        const analysisText = result.response.text();
        console.log(`DEBUG: Gemini PDF analysis response - length: ${analysisText.length}`);
        
        // Parse the structured analysis
        const parsedAnalysis = parseStructuredAnalysis(analysisText);
        
        // Extract grade if in grading mode
        let grade = null;
        let gradingCriteria = [];
        let overallFeedback = '';
        let improvementAreas = [];
        let strengths = [];
        
        if (grading_mode) {
          // Extract grade from analysis
          const gradeMatch = analysisText.match(/\*\*GRADE:\*\*\s*(\d+(?:\.\d+)?)/i);
          if (gradeMatch) {
            grade = parseFloat(gradeMatch[1]);
          }
          
          // Extract grading breakdown
          const breakdownMatch = analysisText.match(/\*\*GRADING BREAKDOWN:\*\*(.*?)(?=\*\*|$)/s);
          if (breakdownMatch) {
            const breakdown = breakdownMatch[1];
            const criteriaMatches = breakdown.match(/•\s*([^:]+):\s*(\d+(?:\.\d+)?)[\/\s]*(\d+(?:\.\d+)?)\s*-\s*(.+?)(?=\n•|\n\*\*|$)/gs);
            if (criteriaMatches) {
              gradingCriteria = criteriaMatches.map(match => {
                const parts = match.match(/•\s*([^:]+):\s*(\d+(?:\.\d+)?)[\/\s]*(\d+(?:\.\d+)?)\s*-\s*(.+)/s);
                if (parts) {
                  return {
                    category: parts[1].trim(),
                    score: parseFloat(parts[2]),
                    maxScore: parseFloat(parts[3]),
                    feedback: parts[4].trim()
                  };
                }
                return null;
              }).filter(Boolean);
            }
          }
          
          // Extract overall feedback
          const feedbackMatch = analysisText.match(/\*\*OVERALL FEEDBACK:\*\*(.*?)(?=\*\*|$)/s);
          if (feedbackMatch) {
            overallFeedback = feedbackMatch[1].trim();
          }
          
          // Extract strengths
          const strengthsMatch = analysisText.match(/\*\*STUDENT STRENGTHS:\*\*(.*?)(?=\*\*|$)/s);
          if (strengthsMatch) {
            strengths = strengthsMatch[1].match(/•\s*([^\n]+)/g)?.map(s => s.replace(/•\s*/, '').trim()) || [];
          }
          
          // Extract improvement areas
          const improvementMatch = analysisText.match(/\*\*AREAS FOR IMPROVEMENT:\*\*(.*?)(?=\*\*|$)/s);
          if (improvementMatch) {
            improvementAreas = improvementMatch[1].match(/•\s*([^\n]+)/g)?.map(s => s.replace(/•\s*/, '').trim()) || [];
          }
        }
        
        const analysis = {
          analysis: analysisText,
          extracted_text: extractedText,
          subject_matter: parsedAnalysis.subject_matter,
          student_strengths: strengths.length > 0 ? strengths : parsedAnalysis.student_strengths,
          knowledge_gaps: parsedAnalysis.knowledge_gaps,
          learning_level: parsedAnalysis.learning_level,
          teaching_suggestions: parsedAnalysis.teaching_suggestions,
          next_steps: parsedAnalysis.next_steps,
          confidence: parsedAnalysis.confidence,
          method: 'dashboard_pdf_analysis',
          // Legacy fields for backward compatibility
          recommendations: parsedAnalysis.teaching_suggestions,
          // Grading-specific fields
          ...(grading_mode && {
            grade,
            maxPoints: max_points,
            grading_criteria: gradingCriteria,
            overall_feedback: overallFeedback,
            improvement_areas: improvementAreas,
            strengths
          })
        };

        console.log('✅ Dashboard PDF Analysis completed successfully');
        console.log(`📝 PDF extracted text: ${extractedText.substring(0, 100)}...`);
        console.log(`📊 Grade: ${grade || 'N/A'}/${max_points || 100}`);
        return res.json(analysis);

      } catch (pdfError) {
        console.error('Dashboard PDF analysis error:', pdfError);
        return res.status(500).json({
          error: 'PDF analysis failed',
          analysis: `PDF analysis error: ${pdfError.message}`,
          knowledge_gaps: ['PDF processing error'],
          recommendations: ['Try uploading a different PDF or check file format'],
          confidence: 0.0,
          extracted_text: 'PDF analysis failed'
        });
      }
    }
    
    // Handle direct image analysis
    if (image_analysis && image_data) {
      console.log('DEBUG: Processing dashboard image analysis...');
      
      if (!geminiModel) {
        console.error('Gemini model not initialized');
        return res.status(500).json({
          error: 'AI model not available',
          analysis: 'AI vision analysis service unavailable',
          knowledge_gaps: ['Service configuration issue'],
          recommendations: ['Check AI service configuration'],
          confidence: 0.0,
          extracted_text: 'Service Unavailable'
        });
      }

      try {
        // Convert base64 to image part for Gemini
        const imageBuffer = Buffer.from(image_data, 'base64');
        
        // Detect image type from base64 header or default to JPEG
        let mimeType = 'image/jpeg';
        if (image_data.startsWith('/9j/')) mimeType = 'image/jpeg';
        else if (image_data.startsWith('iVBORw0KGgo')) mimeType = 'image/png';
        else if (image_data.startsWith('R0lGOD')) mimeType = 'image/gif';
        else if (image_data.startsWith('UklGR')) mimeType = 'image/webp';
        
        console.log(`DEBUG: Dashboard image - type: ${mimeType}, data length: ${image_data.length}`);
        
        const imagePart = {
          inlineData: {
            data: image_data,
            mimeType: mimeType
          }
        };

        // Use the vision model specifically
        const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Create analysis prompt based on grading mode
        let visionPrompt;
        if (grading_mode) {
          visionPrompt = `You are an expert teacher grading a student assignment from an image. Please analyze and grade this student work.

**ASSIGNMENT DETAILS:**
- Assignment Type: ${assignment_type || 'General Assignment'}
- Maximum Points: ${max_points || 100}
- Grading Rubric: ${grading_rubric || 'Standard academic grading criteria'}
- Student Context: ${student_context || 'Student assignment'}

Please provide a comprehensive grading analysis in the following format:

**GRADE:** [Numerical score out of ${max_points || 100}]

**TEXT EXTRACTION:**
[Extract all visible text exactly as written]

**GRADING BREAKDOWN:**
• Content Understanding: [Score/Points] - [Feedback]
• Technical Accuracy: [Score/Points] - [Feedback]  
• Organization & Structure: [Score/Points] - [Feedback]
• Critical Thinking: [Score/Points] - [Feedback]

**OVERALL FEEDBACK:**
[Comprehensive feedback on the assignment]

**STUDENT STRENGTHS:**
• [Strength 1 - what the student did well]
• [Strength 2 - another positive aspect]
• [Strength 3 - additional accomplishment]

**AREAS FOR IMPROVEMENT:**
• [Area 1 - specific improvement needed]
• [Area 2 - concept requiring work]
• [Area 3 - skill to develop]

**RECOMMENDATIONS:**
• [Recommendation 1 - specific next step]
• [Recommendation 2 - study suggestion]
• [Recommendation 3 - practice area]

Context: ${student_context || 'teacher_dashboard_grading'}
Analysis Type: ${analysis_type || 'assignment_grading'}

Provide detailed, constructive feedback that will help the student improve.`;
        } else {
          visionPrompt = `You are an expert educational AI analyzing student work. Please provide a comprehensive analysis of this student work image.

Please analyze this student work and provide structured feedback in the following format:

**TEXT EXTRACTION:**
[Extract all visible text exactly as written]

**SUBJECT ANALYSIS:**
[Identify the subject and specific topics]

**STUDENT STRENGTHS:**
• [Strength 1 - what the student demonstrates well]
• [Strength 2 - another area of competence]
• [Strength 3 - additional positive observations]

**KNOWLEDGE GAPS:**
• [Gap 1 - specific area needing improvement]
• [Gap 2 - concept requiring reinforcement]
• [Gap 3 - skill to develop further]

**LEARNING LEVEL:**
[Academic level assessment]

**TEACHING RECOMMENDATIONS:**
• [Recommendation 1 - specific teaching strategy]
• [Recommendation 2 - targeted intervention]
• [Recommendation 3 - additional support needed]

**NEXT LEARNING STEPS:**
• [Step 1 - immediate next practice area]
• [Step 2 - follow-up skill development]
• [Step 3 - advanced concept to introduce]

Context: ${student_context || context || 'teacher_dashboard_direct_image'}
Image file: ${image_filename || 'uploaded_image'}

Provide detailed, actionable insights that will help teachers understand and support this student's learning. Use bullet points (•) for lists to ensure clear parsing.`;
        }

        console.log('DEBUG: Sending dashboard image to Gemini vision model...');
        const result = await visionModel.generateContent([visionPrompt, imagePart]);
        const analysisText = result.response.text();
        console.log(`DEBUG: Gemini response for dashboard - length: ${analysisText.length}`);
        
        // Parse structured analysis from the response
        const parsedAnalysis = parseStructuredAnalysis(analysisText);
        
        // Extract grade if in grading mode
        let grade = null;
        let gradingCriteria = [];
        let overallFeedback = '';
        let improvementAreas = [];
        let strengths = [];
        
        if (grading_mode) {
          // Extract grade from analysis
          const gradeMatch = analysisText.match(/\*\*GRADE:\*\*\s*(\d+(?:\.\d+)?)/i);
          if (gradeMatch) {
            grade = parseFloat(gradeMatch[1]);
          }
          
          // Extract grading breakdown
          const breakdownMatch = analysisText.match(/\*\*GRADING BREAKDOWN:\*\*(.*?)(?=\*\*|$)/s);
          if (breakdownMatch) {
            const breakdown = breakdownMatch[1];
            const criteriaMatches = breakdown.match(/•\s*([^:]+):\s*(\d+(?:\.\d+)?)[\/\s]*(\d+(?:\.\d+)?)\s*-\s*(.+?)(?=\n•|\n\*\*|$)/gs);
            if (criteriaMatches) {
              gradingCriteria = criteriaMatches.map(match => {
                const parts = match.match(/•\s*([^:]+):\s*(\d+(?:\.\d+)?)[\/\s]*(\d+(?:\.\d+)?)\s*-\s*(.+)/s);
                if (parts) {
                  return {
                    category: parts[1].trim(),
                    score: parseFloat(parts[2]),
                    maxScore: parseFloat(parts[3]),
                    feedback: parts[4].trim()
                  };
                }
                return null;
              }).filter(Boolean);
            }
          }
          
          // Extract overall feedback
          const feedbackMatch = analysisText.match(/\*\*OVERALL FEEDBACK:\*\*(.*?)(?=\*\*|$)/s);
          if (feedbackMatch) {
            overallFeedback = feedbackMatch[1].trim();
          }
          
          // Extract strengths
          const strengthsMatch = analysisText.match(/\*\*STUDENT STRENGTHS:\*\*(.*?)(?=\*\*|$)/s);
          if (strengthsMatch) {
            strengths = strengthsMatch[1].match(/•\s*([^\n]+)/g)?.map(s => s.replace(/•\s*/, '').trim()) || [];
          }
          
          // Extract improvement areas
          const improvementMatch = analysisText.match(/\*\*AREAS FOR IMPROVEMENT:\*\*(.*?)(?=\*\*|$)/s);
          if (improvementMatch) {
            improvementAreas = improvementMatch[1].match(/•\s*([^\n]+)/g)?.map(s => s.replace(/•\s*/, '').trim()) || [];
          }
        }
        
        const analysis = {
          analysis: analysisText,
          extracted_text: parsedAnalysis.extracted_text,
          subject_matter: parsedAnalysis.subject_matter,
          student_strengths: strengths.length > 0 ? strengths : parsedAnalysis.student_strengths,
          knowledge_gaps: parsedAnalysis.knowledge_gaps,
          learning_level: parsedAnalysis.learning_level,
          teaching_suggestions: parsedAnalysis.teaching_suggestions,
          next_steps: parsedAnalysis.next_steps,
          confidence: parsedAnalysis.confidence,
          method: 'dashboard_direct_vision_analysis',
          // Legacy fields for backward compatibility
          recommendations: parsedAnalysis.teaching_suggestions,
          // Grading-specific fields
          ...(grading_mode && {
            grade,
            maxPoints: max_points,
            grading_criteria: gradingCriteria,
            overall_feedback: overallFeedback,
            improvement_areas: improvementAreas,
            strengths
          })
        };

        console.log('✅ Dashboard K.A.N.A. Analysis completed successfully');
        console.log(`📝 Dashboard extracted text: ${parsedAnalysis.extracted_text.substring(0, 50)}...`);
        console.log(`📚 Dashboard subject: ${parsedAnalysis.subject_matter}`);
        return res.json(analysis);

      } catch (visionError) {
        console.error('Dashboard vision analysis error:', visionError);
        return res.status(500).json({
          error: 'Vision analysis failed',
          analysis: `Vision analysis error: ${visionError.message}`,
          knowledge_gaps: ['Vision processing error'],
          recommendations: ['Try uploading a clearer image'],
          confidence: 0.0,
          extracted_text: 'Vision analysis failed'
        });
      }
    }
    
    // Handle other types of analysis if needed
    return res.status(400).json({
      error: 'Invalid request',
      analysis: 'Please provide image_data and set image_analysis to true',
      knowledge_gaps: ['Invalid request format'],
      recommendations: ['Check request parameters'],
      confidence: 0.0,
      extracted_text: 'Invalid request'
    });

  } catch (error) {
    console.error('Dashboard K.A.N.A. Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      analysis: `Dashboard analysis error: ${error.message}`,
      knowledge_gaps: ['Analysis processing error'],
      recommendations: ['Try again with different content'],
      confidence: 0.0,
      extracted_text: 'Analysis failed'
    });
  }
});

// === OCR ANALYSIS ENDPOINT ===
console.log('DEBUG: Registering /api/kana/analyze endpoint...');
app.post('/api/kana/analyze', async (req, res) => {
  console.log('DEBUG: /api/kana/analyze endpoint called!');
  try {
    const { message, context, image_filename, image_data, image_analysis } = req.body;
    console.log(`DEBUG: Received message: ${message?.substring(0, 50)}...`);
    console.log(`DEBUG: Direct image analysis requested: ${image_analysis || false}`);
    
    // Handle direct image analysis
    if (image_analysis && image_data) {
      console.log('DEBUG: Processing direct image analysis...');
      
      if (!geminiModel) {
        console.error('Gemini model not initialized');
        return res.status(500).json({
          error: 'AI model not available',
          analysis: 'AI vision analysis service unavailable',
          knowledge_gaps: ['Service configuration issue'],
          recommendations: ['Check AI service configuration'],
          confidence: 0.0,
          extracted_text: 'Service Unavailable'
        });
      }

      try {
        // Convert base64 to image part for Gemini
        const imageBuffer = Buffer.from(image_data, 'base64');
        
        // Detect image type from base64 header or default to JPEG
        let mimeType = 'image/jpeg';
        if (image_data.startsWith('/9j/')) mimeType = 'image/jpeg';
        else if (image_data.startsWith('iVBORw0KGgo')) mimeType = 'image/png';
        else if (image_data.startsWith('R0lGOD')) mimeType = 'image/gif';
        else if (image_data.startsWith('UklGR')) mimeType = 'image/webp';
        
        console.log(`DEBUG: Detected image type: ${mimeType}, data length: ${image_data.length}`);
        
        const imagePart = {
          inlineData: {
            data: image_data,
            mimeType: mimeType
          }
        };

        // Use the vision model specifically
        const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const visionPrompt = `You are an expert educational AI analyzing student work. Please provide a comprehensive analysis of this student work image.

Please analyze this student work and provide structured feedback in the following format:

**TEXT EXTRACTION:**
[Extract all visible text exactly as written]

**SUBJECT ANALYSIS:**
[Identify the subject and specific topics]

**STUDENT STRENGTHS:**
• [Strength 1 - what the student demonstrates well]
• [Strength 2 - another area of competence]
• [Strength 3 - additional positive observations]

**KNOWLEDGE GAPS:**
• [Gap 1 - specific area needing improvement]
• [Gap 2 - concept requiring reinforcement]
• [Gap 3 - skill to develop further]

**LEARNING LEVEL:**
[Academic level assessment]

**TEACHING RECOMMENDATIONS:**
• [Recommendation 1 - specific teaching strategy]
• [Recommendation 2 - targeted intervention]
• [Recommendation 3 - additional support needed]

**NEXT LEARNING STEPS:**
• [Step 1 - immediate next practice area]
• [Step 2 - follow-up skill development]
• [Step 3 - advanced concept to introduce]

Context: ${context || 'teacher_dashboard_direct_image'}
Image file: ${image_filename || 'uploaded_image'}

Provide detailed, actionable insights that will help teachers understand and support this student's learning. Use bullet points (•) for lists to ensure clear parsing.`;

        console.log('DEBUG: Sending image to Gemini vision model...');
        const result = await visionModel.generateContent([visionPrompt, imagePart]);
        const analysisText = result.response.text();
        console.log(`DEBUG: Gemini response received, length: ${analysisText.length}`);
        console.log(`DEBUG: Raw Gemini response (first 1000 chars):`);
        console.log(`"${analysisText.substring(0, 1000)}..."`);
        
        // Parse structured analysis from the response
        const parsedAnalysis = parseStructuredAnalysis(analysisText);
        
        const analysis = {
          analysis: analysisText,
          extracted_text: parsedAnalysis.extracted_text,
          subject_matter: parsedAnalysis.subject_matter,
          student_strengths: parsedAnalysis.student_strengths,
          knowledge_gaps: parsedAnalysis.knowledge_gaps,
          learning_level: parsedAnalysis.learning_level,
          teaching_suggestions: parsedAnalysis.teaching_suggestions,
          next_steps: parsedAnalysis.next_steps,
          confidence: parsedAnalysis.confidence,
          method: 'direct_vision_analysis',
          // Legacy fields for backward compatibility
          recommendations: parsedAnalysis.teaching_suggestions
        };

        console.log('✅ K.A.N.A. Direct Image Analysis completed successfully');
        console.log(`📝 Extracted text: ${parsedAnalysis.extracted_text}`);
        console.log(`📚 Subject matter: ${parsedAnalysis.subject_matter}`);
        console.log(`💪 Student strengths: ${parsedAnalysis.student_strengths.slice(0, 2).join(', ')}...`);
        return res.json(analysis);

      } catch (visionError) {
        console.error('Vision analysis error:', visionError);
        return res.status(500).json({
          error: 'Vision analysis failed',
          analysis: `Vision analysis error: ${visionError.message}`,
          knowledge_gaps: ['Vision processing error'],
          recommendations: ['Try uploading a clearer image'],
          confidence: 0.0,
          extracted_text: 'Vision analysis failed'
        });
      }
    }
    
    // Handle text-based analysis (existing functionality)
    if (!message || message.trim().length < 3) {
      return res.status(400).json({
        error: 'Message too short for analysis',
        analysis: 'Insufficient text for meaningful analysis',
        knowledge_gaps: [],
        recommendations: ['Upload a clearer image with more visible text'],
        confidence: 0.0
      });
    }

    console.log(`K.A.N.A. Analysis request: ${message.substring(0, 100)}...`);
    
    // Use Google Gemini for analysis
    if (!geminiModel) {
      console.error('Gemini model not initialized');
      return res.status(500).json({
        error: 'AI model not available',
        analysis: 'AI analysis service unavailable',
        knowledge_gaps: ['Service configuration issue'],
        recommendations: ['Check AI service configuration'],
        confidence: 0.0
      });
    }

    const analysisPrompt = `
Analyze this student content for educational insights:
"${message}"

Context: ${context || 'teacher_dashboard_ocr'}
Image file: ${image_filename || 'unknown'}

Please provide:
1. A brief analysis of the student's understanding
2. Any knowledge gaps you identify
3. Specific recommendations for improvement
4. A confidence score (0.0 to 1.0)

Format your response as educational feedback for a teacher.
`;

    const result = await geminiModel.generateContent(analysisPrompt);
    const analysisText = result.response.text();
    
    // Parse the analysis to extract structured data
    const analysis = {
      analysis: analysisText,
      knowledge_gaps: extractKnowledgeGaps(analysisText),
      recommendations: extractRecommendations(analysisText),
      confidence: 0.8 // Default confidence for AI analysis
    };

    console.log('K.A.N.A. Analysis completed successfully');
    res.json(analysis);

  } catch (error) {
    console.error('K.A.N.A. Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      analysis: `Analysis error: ${error.message}`,
      knowledge_gaps: ['Analysis processing error'],
      recommendations: ['Try again with different content'],
      confidence: 0.0
    });
  }
});

// Helper functions for parsing analysis
function extractKnowledgeGaps(text) {
  const gaps = [];
  const gapIndicators = ['gap', 'missing', 'unclear', 'confusion', 'misunderstanding'];
  
  for (const indicator of gapIndicators) {
    if (text.toLowerCase().includes(indicator)) {
      gaps.push(`Potential ${indicator} detected in content`);
    }
  }
  
  return gaps.length > 0 ? gaps : ['No major knowledge gaps identified'];
}

function extractRecommendations(text) {
  const recommendations = [];
  
  if (text.toLowerCase().includes('practice')) {
    recommendations.push('Additional practice recommended');
  }
  if (text.toLowerCase().includes('review')) {
    recommendations.push('Review fundamental concepts');
  }
  if (text.toLowerCase().includes('clarify')) {
    recommendations.push('Clarify understanding with examples');
  }
  
  return recommendations.length > 0 ? recommendations : ['Continue current learning approach'];
}

function parseStructuredAnalysis(analysisText) {
  // Parse structured analysis from K.A.N.A. response
  const sections = {
    extracted_text: '',
    subject_matter: '',
    student_strengths: [],
    knowledge_gaps: [],
    learning_level: '',
    teaching_suggestions: [],
    next_steps: [],
    confidence: 0.9
  };

  try {
    // Extract text content - Gemini uses "TEXT EXTRACTION:"
    const extractedTextMatch = analysisText.match(/\*\*TEXT EXTRACTION:\*\*\s*([\s\S]*?)(?=\*\*[A-Z ]+:\*\*|$)/i);
    if (extractedTextMatch) {
      sections.extracted_text = extractedTextMatch[1].trim();
    } else {
      // Fallback to old format
      const oldFormatMatch = analysisText.match(/\*\*EXTRACTED_TEXT:\*\*\s*([\s\S]*?)(?=\*\*[A-Z_]+:\*\*|$)/i);
      if (oldFormatMatch) {
        sections.extracted_text = oldFormatMatch[1].trim().replace(/^\[|\]$/g, '');
      } else {
        // Look for transcription section
        const transcriptionMatch = analysisText.match(/\*\*1\.\s*Text\s*Transcription[:\*]*\s*([\s\S]*?)(?=\*\*2\.|$)/i);
        if (transcriptionMatch) {
          let transcription = transcriptionMatch[1].trim();
          // Extract the actual student text from bullet points or quotes
          const textLines = transcription.split('\n').filter(line => 
            line.includes('Math Problem') || 
            line.includes('Student:') || 
            line.includes('Solve for') ||
            line.includes('Simplify:') ||
            line.includes('Notes:') ||
            (line.trim().length > 10 && !line.includes('**'))
          );
          sections.extracted_text = textLines.join(' ').replace(/\*+/g, '').trim();
        } else {
          // Fallback extraction methods
          const fallbackMatch = analysisText.match(/(?:text|transcription|extract|reads?)[:\s]*[""]?([^"\n]+)[""]?/i);
          sections.extracted_text = fallbackMatch ? fallbackMatch[1].trim() : 'Text extraction not available';
        }
      }
    }

    // Extract subject matter - Gemini uses "SUBJECT ANALYSIS:"
    const subjectMatch = analysisText.match(/\*\*SUBJECT ANALYSIS:\*\*\s*([\s\S]*?)(?=\*\*[A-Z ]+:\*\*|$)/i);
    if (subjectMatch) {
      sections.subject_matter = subjectMatch[1].trim();
    } else {
      // Fallback to old format
      const oldSubjectMatch = analysisText.match(/\*\*SUBJECT_MATTER:\*\*\s*([\s\S]*?)(?=\*\*[A-Z_]+:\*\*|$)/i);
      if (oldSubjectMatch) {
        sections.subject_matter = oldSubjectMatch[1].trim().replace(/^\[|\]$/g, '');
      } else {
        // Look for subject in the analysis
        const subjectPatterns = [
          /\*\*2\.\s*Subject\s*Matter[:\*]*\s*([\s\S]*?)(?=\*\*3\.|The key concepts|$)/i,
          /subject\s*matter\s*is\s*([^.]+)/i,
          /mathematics|algebra|geometry|calculus|english|science|history/i
        ];
        
        for (const pattern of subjectPatterns) {
          const match = analysisText.match(pattern);
          if (match) {
            sections.subject_matter = match[1] ? match[1].trim() : match[0];
            break;
          }
        }
      }
    }

    // Extract student strengths with improved parsing - Gemini uses "STUDENT STRENGTHS:"
    const strengthsMatch = analysisText.match(/\*\*STUDENT STRENGTHS:\*\*\s*([\s\S]*?)(?=\*\*KNOWLEDGE GAPS:\*\*|\*\*LEARNING LEVEL:\*\*|\*\*TEACHING RECOMMENDATIONS:\*\*|$)/i);
    if (strengthsMatch) {
      const strengthsText = strengthsMatch[1].trim();
      console.log(`DEBUG: Raw strengths text: "${strengthsText.substring(0, 200)}..."`);
      
      // Split by actual bullet point patterns (*, •, -) that start new lines
      const strengthItems = [];
      const bulletLines = strengthsText.split(/\n/);
      let currentItem = '';
      
      for (const line of bulletLines) {
        const trimmedLine = line.trim();
        if (trimmedLine.match(/^[*•\-]\s+/)) {
          // This is a new bullet point
          if (currentItem.trim().length > 10) {
            const cleanItem = currentItem.trim().replace(/^[*•\-]\s*/, '').trim();
            if (cleanItem.length > 10) {
              strengthItems.push(cleanItem);
            }
          }
          currentItem = trimmedLine;
        } else if (trimmedLine.length > 0) {
          // This is a continuation of the current bullet point, or standalone text
          if (currentItem) {
            currentItem += ' ' + trimmedLine;
          } else {
            // No current item, this might be a continuation from previous processing
            if (strengthItems.length > 0 && trimmedLine.length > 5) {
              // Append to the last item
              strengthItems[strengthItems.length - 1] += ' ' + trimmedLine;
            }
          }
        }
      }
      
      // Don't forget the last item
      if (currentItem.trim().length > 10) {
        const cleanItem = currentItem.trim().replace(/^[*•\-]\s*/, '').trim();
        if (cleanItem.length > 10) {
          strengthItems.push(cleanItem);
        }
      }
      
      sections.student_strengths = strengthItems.slice(0, 8);
      console.log(`DEBUG: Parsed ${strengthItems.length} student strengths`);
    } else {
      console.log('DEBUG: No STUDENT_STRENGTHS section found');
      sections.student_strengths = [];
    }

    // Extract knowledge gaps with improved parsing - Gemini uses "KNOWLEDGE GAPS:"
    const gapsMatch = analysisText.match(/\*\*KNOWLEDGE GAPS:\*\*\s*([\s\S]*?)(?=\*\*LEARNING LEVEL:\*\*|\*\*TEACHING RECOMMENDATIONS:\*\*|$)/i);
    if (gapsMatch) {
      const gapsText = gapsMatch[1].trim();
      console.log(`DEBUG: Raw gaps text: "${gapsText.substring(0, 200)}..."`);
      
      // Split by actual bullet point patterns
      const gapItems = [];
      const bulletLines = gapsText.split(/\n/);
      let currentItem = '';
      
      for (const line of bulletLines) {
        const trimmedLine = line.trim();
        if (trimmedLine.match(/^[*•\-]\s+/)) {
          // This is a new bullet point
          if (currentItem.trim().length > 10) {
            gapItems.push(currentItem.trim().replace(/^[*•\-]\s*/, ''));
          }
          currentItem = trimmedLine;
        } else if (trimmedLine.length > 0 && currentItem) {
          // This is a continuation of the current bullet point
          currentItem += ' ' + trimmedLine;
        }
      }
      
      // Don't forget the last item
      if (currentItem.trim().length > 10) {
        gapItems.push(currentItem.trim().replace(/^[*•\-]\s*/, ''));
      }
      
      sections.knowledge_gaps = gapItems.slice(0, 8);
      console.log(`DEBUG: Parsed ${gapItems.length} knowledge gaps`);
    } else {
      console.log('DEBUG: No KNOWLEDGE_GAPS section found');
      sections.knowledge_gaps = extractKnowledgeGaps(analysisText);
    }

    // Extract learning level - Gemini uses "LEARNING LEVEL:"
    const levelMatch = analysisText.match(/\*\*LEARNING LEVEL:\*\*\s*([\s\S]*?)(?=\*\*TEACHING RECOMMENDATIONS:\*\*|\*\*NEXT LEARNING STEPS:\*\*|$)/i);
    if (levelMatch) {
      sections.learning_level = levelMatch[1].trim();
    } else {
      // Try old format
      const oldLevelMatch = analysisText.match(/\*\*LEARNING_LEVEL:\*\*\s*([\s\S]*?)(?=\*\*[A-Z_]+:\*\*|$)/i);
      if (oldLevelMatch) {
        sections.learning_level = oldLevelMatch[1].trim().replace(/^\[|\]$/g, '');
      }
    }

    // Extract teaching suggestions with improved parsing - Gemini uses "TEACHING RECOMMENDATIONS:"
    const suggestionsMatch = analysisText.match(/\*\*TEACHING RECOMMENDATIONS:\*\*\s*([\s\S]*?)(?=\*\*NEXT LEARNING STEPS:\*\*|\*\*CONFIDENCE_SCORE:\*\*|$)/i);
    if (suggestionsMatch) {
      const suggestionsText = suggestionsMatch[1].trim();
      console.log(`DEBUG: Raw suggestions text: "${suggestionsText.substring(0, 200)}..."`);
      
      // Handle numbered lists (1., 2., etc.) and bullet points
      const suggestionItems = [];
      const lines = suggestionsText.split(/\n/);
      let currentItem = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        // Check for numbered list items or bullet points at the start of a line
        if (trimmedLine.match(/^(?:\d+\.\s*\*\*|\d+\.\s+|[*•\-]\s+)/)) {
          // This is a new numbered item or bullet point
          if (currentItem.trim().length > 10) {
            suggestionItems.push(currentItem.trim().replace(/^(?:\d+\.\s*\*\*|\d+\.\s+|[*•\-]\s*)/, ''));
          }
          currentItem = trimmedLine;
        } else if (trimmedLine.length > 0 && currentItem) {
          // This is a continuation of the current item
          currentItem += ' ' + trimmedLine;
        }
      }
      
      // Don't forget the last item
      if (currentItem.trim().length > 10) {
        suggestionItems.push(currentItem.trim().replace(/^(?:\d+\.\s*\*\*|\d+\.\s+|[*•\-]\s*)/, ''));
      }
      
      sections.teaching_suggestions = suggestionItems.slice(0, 8);
      console.log(`DEBUG: Parsed ${suggestionItems.length} teaching suggestions`);
    } else {
      console.log('DEBUG: No TEACHING_SUGGESTIONS section found');
      sections.teaching_suggestions = extractRecommendations(analysisText);
    }

    // Extract next steps with improved parsing - Gemini uses "NEXT LEARNING STEPS:"
    const nextStepsMatch = analysisText.match(/\*\*NEXT LEARNING STEPS:\*\*\s*([\s\S]*?)(?=\*\*CONFIDENCE_SCORE:\*\*|$)/i);
    if (nextStepsMatch) {
      const nextStepsText = nextStepsMatch[1].trim();
      console.log(`DEBUG: Raw next steps text: "${nextStepsText.substring(0, 200)}..."`);
      
      // Handle numbered lists and bullet points
      const nextStepItems = [];
      const lines = nextStepsText.split(/\n/);
      let currentItem = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.match(/^(?:\d+\.\s*|\d+\s+|[*•\-]\s+)/)) {
          // This is a new numbered item or bullet point
          if (currentItem.trim().length > 10) {
            nextStepItems.push(currentItem.trim().replace(/^(?:\d+\.\s*|\d+\s+|[*•\-]\s*)/, ''));
          }
          currentItem = trimmedLine;
        } else if (trimmedLine.length > 0 && currentItem) {
          // This is a continuation of the current item
          currentItem += ' ' + trimmedLine;
        }
      }
      
      // Don't forget the last item
      if (currentItem.trim().length > 10) {
        nextStepItems.push(currentItem.trim().replace(/^(?:\d+\.\s*|\d+\s+|[*•\-]\s*)/, ''));
      }
      
      sections.next_steps = nextStepItems.slice(0, 8);
      console.log(`DEBUG: Parsed ${nextStepItems.length} next steps`);
    } else {
      console.log('DEBUG: No NEXT_STEPS section found');
      sections.next_steps = [];
    }

    // Extract confidence score
    const confidenceMatch = analysisText.match(/\*\*CONFIDENCE_SCORE:\*\*\s*([\d.]+)/i);
    if (confidenceMatch) {
      sections.confidence = parseFloat(confidenceMatch[1]);
    }

    console.log(`DEBUG: Parsed analysis - Text: "${sections.extracted_text.substring(0, 50)}...", Subject: "${sections.subject_matter}"`);
    
  } catch (error) {
    console.error('Error parsing structured analysis:', error);
    // Fallback to basic extraction
    sections.extracted_text = analysisText.substring(0, 200) + '...';
    sections.subject_matter = 'Analysis parsing error';
    sections.knowledge_gaps = ['Unable to parse detailed analysis'];
    sections.teaching_suggestions = ['Review content and try again'];
  }

  return sections;
}

// === STUDY CENTRE ENDPOINTS ===

// Create assignments based on K.A.N.A.'s own analysis of student work
app.post('/api/create-assignments-from-analysis', async (req, res) => {
  try {
    console.log('DEBUG: Creating assignments from K.A.N.A. analysis...');
    const { userId, originalFeedback, subject, score, analysisDate, studentWork } = req.body;

    if (!originalFeedback) {
      return res.status(400).json({ error: 'Original K.A.N.A. feedback is required' });
    }

    // Use K.A.N.A. to create comprehensive follow-up content based on its own analysis
    const prompt = `You are K.A.N.A., an advanced AI tutor. You previously analyzed a student's ${subject} work and gave this feedback:

"${originalFeedback}"

The student scored ${score}% on this assignment. Based on YOUR OWN analysis, create a comprehensive learning package with 2-3 assignments PLUS rich resources and interactive practices.

For each assignment, provide:
1. A specific, actionable title
2. Assignment type (reading, quiz, exercise, or project) 
3. Difficulty level (beginner, intermediate, advanced)
4. Estimated time in minutes (15-60)
5. Clear reason why this assignment helps address your identified issues
6. 3-5 diverse learning resources with different types (books, articles, videos, interactive tools, simulations, practice sets)
7. 2-3 practice activities that reinforce the concepts

Each resource should have: type, title, source, description, and difficulty
Each practice should have: type, title, description, estimatedTime, and interactiveElements

Focus on creating a rich, multi-modal learning experience that addresses the specific gaps YOU identified. Include visual, auditory, kinesthetic, and interactive elements.

Format as a JSON array with these exact keys for each assignment: title, type, difficulty, estimatedTime, reason, resources (array with type, title, source, description, difficulty), practices (array with type, title, description, estimatedTime, interactiveElements).`;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const assignmentText = result.response.text();
      
      console.log('DEBUG: K.A.N.A. assignment response:', assignmentText);
      
      // Try to parse JSON response
      let assignments;
      try {
        const cleanText = assignmentText.replace(/```json\n?|\n?```/g, '').trim();
        assignments = JSON.parse(cleanText);
      } catch (parseError) {
        console.log('DEBUG: JSON parse failed, extracting manually...');
        
        // Fallback: Create comprehensive assignments based on feedback analysis
        assignments = [
          {
            title: `Master ${subject} Fundamentals`,
            type: score < 60 ? 'exercise' : 'reading',
            difficulty: score < 60 ? 'beginner' : score < 80 ? 'intermediate' : 'advanced',
            estimatedTime: 30,
            reason: `Based on K.A.N.A.'s analysis of your ${subject} work (${score}%), this comprehensive package addresses the specific areas identified for improvement.`,
            resources: [
              { 
                type: 'article', 
                title: `${subject} Core Concepts Review`, 
                source: 'Core Library',
                description: 'Comprehensive review of fundamental concepts',
                difficulty: 'beginner'
              },
              { 
                type: 'video', 
                title: `${subject} Visual Learning Guide`, 
                source: 'K.A.N.A. Media',
                description: 'Interactive video tutorials with examples',
                difficulty: 'intermediate'
              },
              { 
                type: 'interactive', 
                title: `${subject} Practice Simulator`, 
                source: 'K.A.N.A. Platform',
                description: 'Hands-on practice with immediate feedback',
                difficulty: 'intermediate'
              },
              { 
                type: 'book', 
                title: `${subject} Study Guide`, 
                source: 'Academic Library',
                description: 'Detailed explanations and worked examples',
                difficulty: 'advanced'
              }
            ],
            practices: [
              {
                type: 'drill',
                title: `${subject} Quick Practice`,
                description: 'Short focused exercises on key concepts',
                estimatedTime: 15,
                interactiveElements: ['immediate feedback', 'progress tracking', 'adaptive difficulty']
              },
              {
                type: 'simulation',
                title: `${subject} Real-World Application`,
                description: 'Apply concepts to realistic scenarios',
                estimatedTime: 25,
                interactiveElements: ['scenario-based learning', 'decision making', 'outcome analysis']
              }
            ]
          }
        ];
      }

      // Ensure assignments is an array
      if (!Array.isArray(assignments)) {
        assignments = [assignments];
      }

      // Add metadata to each assignment
      const enrichedAssignments = assignments.map((assignment, index) => ({
        ...assignment,
        id: `kana_analysis_${userId}_${Date.now()}_${index}`,
        subject,
        assignedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + (2 + index) * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        originalAnalysis: {
          feedback: originalFeedback,
          score,
          analysisDate,
          basedOnWork: studentWork.substring(0, 100) + '...'
        }
      }));

      console.log(`DEBUG: Created ${enrichedAssignments.length} assignments from K.A.N.A. analysis`);
      res.json(enrichedAssignments);

    } catch (aiError) {
      console.error('Error generating assignments with AI:', aiError);
      
      // Comprehensive fallback assignment based on score and subject
      const fallbackAssignment = [{
        id: `kana_fallback_${userId}_${Date.now()}`,
        title: `${subject} Comprehensive Review & Practice`,
        type: score < 70 ? 'exercise' : 'reading',
        subject,
        difficulty: score < 60 ? 'beginner' : score < 80 ? 'intermediate' : 'advanced',
        estimatedTime: 45,
        reason: `Based on your recent ${subject} performance (${score}%), K.A.N.A. recommends this comprehensive learning package to strengthen your understanding with multiple learning modalities.`,
        resources: [
          { 
            type: 'book', 
            title: `${subject} Complete Study Guide`, 
            source: 'Core Library',
            description: 'Comprehensive textbook with detailed explanations',
            difficulty: 'intermediate'
          },
          { 
            type: 'video', 
            title: `${subject} Video Lecture Series`, 
            source: 'K.A.N.A. Media',
            description: 'Step-by-step video explanations of key concepts',
            difficulty: 'beginner'
          },
          { 
            type: 'interactive', 
            title: `${subject} Practice Exercises`, 
            source: 'K.A.N.A. Tools',
            description: 'Interactive problems with guided solutions',
            difficulty: 'intermediate'
          },
          { 
            type: 'article', 
            title: `${subject} Quick Reference`, 
            source: 'Study Hub',
            description: 'Concise summary of essential formulas and concepts',
            difficulty: 'beginner'
          }
        ],
        practices: [
          {
            type: 'quiz',
            title: `${subject} Knowledge Check`,
            description: 'Self-assessment quiz to identify areas of strength and weakness',
            estimatedTime: 20,
            interactiveElements: ['instant feedback', 'performance analytics', 'personalized recommendations']
          },
          {
            type: 'application',
            title: `${subject} Problem Solving Workshop`,
            description: 'Work through complex problems step-by-step',
            estimatedTime: 30,
            interactiveElements: ['guided solutions', 'hint system', 'multiple approaches']
          }
        ],
        assignedAt: new Date().toISOString(),
        status: 'pending'
      }];
      
      res.json(fallbackAssignment);
    }

  } catch (error) {
    console.error('Error creating assignments from analysis:', error);
    res.status(500).json({ error: 'Failed to create assignments from analysis' });
  }
});

// Generate K.A.N.A. assignments based on student analysis
app.post('/api/generate-assignments', async (req, res) => {
  try {
    console.log('DEBUG: Generating K.A.N.A. assignments...');
    const { userId, gradeData, recommendations, preferences } = req.body;

    if (!gradeData || !Array.isArray(gradeData)) {
      return res.status(400).json({ error: 'Valid grade data is required' });
    }

    // Analyze grade patterns to create intelligent assignments
    const subjectAverages = calculateSubjectAverages(gradeData);
    const weakSubjects = Object.entries(subjectAverages)
      .filter(([_, avg]) => avg < 70)
      .map(([subject, _]) => subject);
    
    const strongSubjects = Object.entries(subjectAverages)
      .filter(([_, avg]) => avg >= 85)
      .map(([subject, _]) => subject);

    const assignments = [];
    const currentTime = new Date().toISOString();

    // Generate assignments for weak subjects
    for (const subject of weakSubjects.slice(0, 3)) {
      const prompt = `Create a personalized learning assignment for a student struggling with ${subject}. 
        Their current average is ${Math.round(subjectAverages[subject])}%. 
        Recent grades: ${gradeData.filter(g => g.subject === subject).map(g => g.score).join(', ')}.
        
        Provide:
        1. Assignment title (engaging and specific)
        2. Assignment type (reading, quiz, exercise, or project)
        3. Difficulty level (beginner, intermediate, advanced)
        4. Estimated time in minutes
        5. Detailed reason why this assignment helps
        6. 2-3 relevant resources (books, articles, videos, interactive tools)
        
        Format as JSON with these exact keys: title, type, difficulty, estimatedTime, reason, resources.`;

      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const assignmentText = result.response.text();
        
        // Try to parse JSON, fallback to manual extraction if needed
        let assignment;
        try {
          assignment = JSON.parse(assignmentText.replace(/```json\n?|\n?```/g, ''));
        } catch {
          // Fallback assignment
          assignment = {
            title: `Strengthen ${subject} Fundamentals`,
            type: 'exercise',
            difficulty: 'intermediate',
            estimatedTime: 45,
            reason: `K.A.N.A. detected areas for improvement in ${subject} based on recent grades (avg: ${Math.round(subjectAverages[subject])}%)`,
            resources: [
              { type: 'book', title: `${subject} Study Guide`, source: 'Core Library' },
              { type: 'interactive', title: `${subject} Practice Tools`, source: 'K.A.N.A. Tools' }
            ]
          };
        }

        assignments.push({
          id: `kana_weak_${subject.toLowerCase()}_${Date.now()}`,
          ...assignment,
          subject,
          assignedAt: currentTime,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          createdBy: 'K.A.N.A.'
        });
      } catch (error) {
        console.error(`Error generating assignment for ${subject}:`, error);
      }
    }

    // Generate challenge assignments for strong subjects
    for (const subject of strongSubjects.slice(0, 2)) {
      assignments.push({
        id: `kana_strong_${subject.toLowerCase()}_${Date.now()}`,
        title: `Advanced ${subject} Challenge`,
        type: 'project',
        subject,
        difficulty: 'advanced',
        estimatedTime: 90,
        reason: `K.A.N.A. recognizes your strength in ${subject} (avg: ${Math.round(subjectAverages[subject])}%) - time for advanced challenges!`,
        resources: [
          { type: 'article', title: `Advanced ${subject} Concepts`, source: 'Research Library' },
          { type: 'video', title: `${subject} Masterclass`, source: 'K.A.N.A. Academy' }
        ],
        assignedAt: currentTime,
        status: 'pending',
        createdBy: 'K.A.N.A.'
      });
    }

    // Add a general assessment if no specific subjects identified
    if (assignments.length === 0) {
      assignments.push({
        id: `kana_assessment_${Date.now()}`,
        title: 'Learning Assessment Quiz',
        type: 'quiz',
        subject: 'General',
        difficulty: 'intermediate',
        estimatedTime: 30,
        reason: 'K.A.N.A. needs to assess your current knowledge level to create personalized assignments',
        resources: [
          { type: 'interactive', title: 'Adaptive Assessment Tool', source: 'K.A.N.A. Platform' }
        ],
        assignedAt: currentTime,
        status: 'pending',
        createdBy: 'K.A.N.A.'
      });
    }

    console.log(`DEBUG: Generated ${assignments.length} assignments`);
    res.json(assignments);

  } catch (error) {
    console.error('Error generating assignments:', error);
    res.status(500).json({ error: 'Failed to generate assignments' });
  }
});

// Update assignment progress
app.post('/api/update-assignment-progress', async (req, res) => {
  try {
    const { assignmentId, progress, timestamp } = req.body;
    
    if (!assignmentId || progress === undefined) {
      return res.status(400).json({ error: 'Assignment ID and progress are required' });
    }

    // In a real implementation, this would update a database
    console.log(`DEBUG: Updated assignment ${assignmentId} progress to ${progress}%`);
    
    res.json({ success: true, assignmentId, progress, timestamp });
  } catch (error) {
    console.error('Error updating assignment progress:', error);
    res.status(500).json({ error: 'Failed to update assignment progress' });
  }
});

// Complete assignment
app.post('/api/complete-assignment', async (req, res) => {
  try {
    const { assignmentId, completedAt } = req.body;
    
    if (!assignmentId) {
      return res.status(400).json({ error: 'Assignment ID is required' });
    }

    // In a real implementation, this would update a database
    console.log(`DEBUG: Completed assignment ${assignmentId} at ${completedAt}`);
    
    res.json({ success: true, assignmentId, completedAt });
  } catch (error) {
    console.error('Error completing assignment:', error);
    res.status(500).json({ error: 'Failed to complete assignment' });
  }
});

// Trigger new assignment generation
app.post('/api/trigger-assignment-generation', async (req, res) => {
  try {
    const { reason, timestamp } = req.body;
    
    console.log(`DEBUG: Triggered assignment generation - Reason: ${reason}, Time: ${timestamp}`);
    
    // In a real implementation, this would analyze recent performance and generate new assignments
    res.json({ success: true, message: 'Assignment generation triggered' });
  } catch (error) {
    console.error('Error triggering assignment generation:', error);
    res.status(500).json({ error: 'Failed to trigger assignment generation' });
  }
});

// Helper function to calculate subject averages
function calculateSubjectAverages(gradeData) {
  const subjectTotals = {};
  
  gradeData.forEach(grade => {
    if (!subjectTotals[grade.subject]) {
      subjectTotals[grade.subject] = { sum: 0, count: 0 };
    }
    subjectTotals[grade.subject].sum += grade.score;
    subjectTotals[grade.subject].count += 1;
  });

  const averages = {};
  Object.entries(subjectTotals).forEach(([subject, data]) => {
    averages[subject] = data.sum / data.count;
  });

  return averages;
}

// === SIMPLE TEST ENDPOINT ===
console.log('DEBUG: Registering /api/test endpoint...');
app.get('/api/test', (req, res) => {
  console.log('DEBUG: /api/test endpoint called!');
  res.json({ message: 'Test endpoint working!', timestamp: new Date().toISOString() });
});

// --- HEALTH CHECK ENDPOINT ---
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'disconnected',
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'configured' : 'missing',
      DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'missing'
    }
  };

  try {
    const dbConnected = await testConnection();
    health.database = dbConnected ? 'connected' : 'disconnected';
  } catch (error) {
    health.database = 'error';
    health.databaseError = error.message;
  }

  const statusCode = health.database === 'connected' ? 200 : 503;
  res.status(statusCode).json(health);
});

// === START SERVER ===
app.listen(port, () => {
  console.log(`K.A.N.A. Backend listening at http://localhost:${port}`);
});

// Load database
loadDb();
