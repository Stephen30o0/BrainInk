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

const app = express();
const port = process.env.PORT || 10000;

// --- CONFIGURATION & INITIALIZATION ---

console.log('DEBUG: Loaded GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'Key Loaded' : 'Key NOT Loaded');
console.log('DEBUG: Loaded CORE_API_KEY:', process.env.CORE_API_KEY ? 'Key Loaded' : 'Key NOT Loaded');

const conversationContexts = {};

const systemInstruction = {
  parts: [{ text: `You are K.A.N.A., an advanced academic AI assistant. Your primary goal is to help users understand complex topics, solve problems, and learn effectively.\nKey characteristics:\n- Knowledgeable & Context-Aware: Provide accurate, in-depth information. Prioritize information from user-provided context (like uploaded files or web links). If no context is relevant, use your general knowledge to answer. When using context, state that you are doing so (e.g., "According to the document you provided...").\n- Versatile & Interactive: Assist with a wide range of academic subjects. Engage users with questions and encourage critical thinking.\n- Tool User: You can generate text, render mathematical graphs, and analyze images/notes.\nInteraction Guidelines:\n- For file-related questions (e.g., "summarize this PDF"), use the context provided for that conversation. If no context is available, politely state that you need the file to be uploaded first.\n- Do not invent information. If you don't know something, say so.\n- Maintain a supportive, professional, and encouraging tone.`
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

app.use('/study_material_files', express.static(STUDY_MATERIALS_DIR));
app.use('/images', express.static(IMAGES_DIR));
console.log(`DEBUG: Serving static files from ${STUDY_MATERIALS_DIR} at /study_material_files`);
console.log(`DEBUG: Serving static files from ${IMAGES_DIR} at /images`);

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

// --- API ENDPOINTS ---

app.get('/api/study-materials', (req, res) => {
  res.json(studyMaterialsDb);
});

app.post('/api/upload-study-material', uploadStudyFile.single('studyMaterial'), async (req, res) => {
  const { conversationId } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  if (!conversationId) {
    await fsPromises.unlink(req.file.path);
    return res.status(400).json({ error: 'conversationId is required.' });
  }

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
    
    if (fileTextContent) {
        const conversation = getOrCreateConversation(conversationId);
        conversation.contextParts.push({
            text: `--- START OF FILE: ${newMaterial.originalFilename} ---\n${fileTextContent}\n--- END OF FILE: ${newMaterial.originalFilename} ---`
        });
        console.log(`DEBUG: Added content of ${newMaterial.originalFilename} to context for conversation ${conversationId}.`);
    }

    res.status(201).json({ message: 'File uploaded successfully!', file: newMaterial });
  } catch (error) {
    console.error(`ERROR processing uploaded file: ${error.message}`);
    if(req.file && req.file.path) {
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
        return res.status(500).json({ error: 'Failed to fetch the PDF file.' });
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

app.get('/api/core-search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter "q" is required.' });
  if (!process.env.CORE_API_KEY) return res.status(500).json({ error: 'CORE API key not configured.' });

  try {
    const response = await axios.get(`https://api.core.ac.uk/v3/search/works`, {
      params: { q, limit: 20 },
      headers: { 'Authorization': `Bearer ${process.env.CORE_API_KEY}` }
    });
    const transformedResults = response.data.results.map(item => ({
      coreId: item.id, title: item.title, authors: item.authors, abstract: item.abstract,
      year: item.yearPublished, downloadUrl: item.downloadUrl, doi: item.doi, publisher: item.publisher,
    }));
    res.json(transformedResults);
  } catch (error) {
    console.error('CORE API Search Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to search CORE API.' });
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

app.post('/api/chat', async (req, res) => {
  try {
    const { conversationId, message, history, subject, title } = req.body;
    if (!message || !conversationId) {
      return res.status(400).json({ error: 'Missing message or conversationId' });
    }

    const conversation = getOrCreateConversation(conversationId);
    
    // Check for plot request
    const plotKeywords = ['plot', 'graph', 'chart', 'draw', 'diagram'];
    const wantsPlot = plotKeywords.some(keyword => message.toLowerCase().includes(keyword));

    if (wantsPlot) {
        console.log(`DEBUG: Detected plot request for conversation ${conversationId}`);
        const plotPrompt = `The user wants a chart based on this request: "${message}". Generate a valid JSON object compatible with Chart.js. The object must have 'type', 'data', and 'options' properties. For 'data', include 'labels' and 'datasets'. Each dataset needs a 'label' and a 'data' array. Only output the raw JSON object.`;
        
        try {
            const plotModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const plotResult = await plotModel.generateContent(plotPrompt);
            const plotResponseText = plotResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const chartData = JSON.parse(plotResponseText);

            console.log('DEBUG: Successfully generated chart data.');
            // Note: The frontend expects a 'type' field at the top level to identify the message.
            return res.json({
                type: 'mathematical_graph',
                chartData: chartData,
                conversationId: conversationId
            });
        } catch (e) {
            console.error("Error generating or parsing chart JSON from AI:", e);
            // Fallback to a normal text response if chart generation fails
            res.json({ kanaResponse: "I tried to generate a chart, but I couldn't. Please try rephrasing your request." });
            return;
        }
    }

    // Default chat logic with context
    const clientHistory = Array.isArray(history) ? history : [];
    const chat = geminiModel.startChat({
        history: [...conversation.history, ...clientHistory],
        generationConfig: { maxOutputTokens: 4096 }
    });

    let messageToSend = message;
    if (conversation.context && conversation.context.trim().length > 0) {
        console.log(`DEBUG: Prepending document context for conversation ${conversationId}`);
        messageToSend = `Please use the following context to answer the user's question.\n\n--- Context ---\n${conversation.context}\n\n--- User Question ---\n${message}`;
    }

    const result = await chat.sendMessage(messageToSend);
    const kanaResponseText = result.response.text();

    // Update conversation history
    conversation.history.push({ role: 'user', parts: [{ text: message }] }); // Push original message for history
    conversation.history.push({ role: 'model', parts: [{ text: kanaResponseText }] });

    res.json({
      kanaResponse: kanaResponseText,
      conversationId: conversationId,
      subject: subject || 'General',
      title: title || 'Chat'
    });

  } catch (error) {
    console.error('Chat endpoint error:', error);
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

app.get('/', (req, res) => {
  res.send('K.A.N.A. Backend is running!');
});

const startServer = async () => {
    await loadDb();
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

    app.listen(port, () => {
        console.log(`K.A.N.A. Backend listening at http://localhost:${port}`);
    });
};

startServer();
