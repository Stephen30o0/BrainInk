const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const pdf = require('pdf-parse');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const fsPromises = fs.promises;
const { evaluate } = require('mathjs');
const { generateSVGGraph } = require('./utils/svgGraph');
// Import QuizService
const QuizService = require('./services/quizService');

let generateChartJSGraph = null;
try {
  generateChartJSGraph = require('./utils/chartjsGraph').generateChartJSGraph;
} catch (e) {
  // chartjs-node-canvas not installed
}

// Import tournament routes
const tournamentRoutes = require('./routes/tournaments');

// Import syllabus routes
const syllabusRoutes = require('./routes/syllabus');

// Import syllabus integration routes
const { router: syllabusIntegrationRoutes, initializeConversationContexts } = require('./routes/syllabusIntegration');

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

- **CRITICAL GRAPHING REQUIREMENT**: You MUST use the 'generate_graph_data' tool whenever a user asks to plot, graph, or visualize ANY mathematical function. This includes requests like:
  * "graph y = x^2"
  * "plot sin(x)"
  * "can you show me y = log(x)?"
  * "draw the function y = e^x"
  * ANY request to visualize a mathematical expression
  
  When the user requests a graph, IMMEDIATELY call the generate_graph_data tool with:
  - functionStr: the mathematical expression (e.g., "y = x^2", "sin(x)", "log(x)")
  - xMin: default -10 (or user specified)
  Do NOT just explain the function - USE THE TOOL to generate the actual graph.

- Tool User: You can also generate text and analyze images/notes.

Interaction Guidelines:
- If you don't know something, say so.
- Maintain a supportive, professional, and encouraging tone.
- ALWAYS use the graph tool when graphing is requested - never just provide text explanations of what a graph would look like.`
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

// Ensure uploads directory exists for graphs
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
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

// Serve graph uploads directory
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/api/kana/uploads', express.static(UPLOADS_DIR));

// Serve textbook files for syllabus
const TEXTBOOKS_DIR = path.join(__dirname, 'uploads', 'textbooks');
if (!fs.existsSync(TEXTBOOKS_DIR)) {
  fs.mkdirSync(TEXTBOOKS_DIR, { recursive: true });
}
app.use('/textbooks', express.static(TEXTBOOKS_DIR));
app.use('/api/kana/textbooks', express.static(TEXTBOOKS_DIR));

console.log(`DEBUG: Serving static files from ${STUDY_MATERIALS_DIR} at /study_material_files and /api/kana/study_material_files`);
console.log(`DEBUG: Serving static files from ${IMAGES_DIR} at /images and /api/kana/images`);
console.log(`DEBUG: Serving graph files from ${UPLOADS_DIR} at /uploads and /api/kana/uploads`);
console.log(`DEBUG: Serving textbook files from ${TEXTBOOKS_DIR} at /textbooks and /api/kana/textbooks`);

// Tournament routes
app.use('/api/tournaments', tournamentRoutes);
console.log('DEBUG: Tournament routes enabled');

// Syllabus routes
app.use('/api/syllabus', syllabusRoutes);
console.log('DEBUG: Syllabus routes enabled');

// Syllabus integration routes
app.use('/api/kana/syllabus', syllabusIntegrationRoutes);
console.log('DEBUG: Syllabus integration routes enabled');

// Add K.A.N.A. syllabus processing routes (alias for compatibility)
app.use('/api/kana', syllabusRoutes);
console.log('DEBUG: K.A.N.A. syllabus processing routes enabled');

// Debug route to check if endpoint exists
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(function (middleware) {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach(function (handler) {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json({ routes, timestamp: new Date().toISOString() });
});

// --- API CLIENTS ---

let genAI, geminiModel, quizService;
if (process.env.GOOGLE_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-latest", systemInstruction });
  quizService = new QuizService(process.env.GOOGLE_API_KEY);
  console.log('DEBUG: Google AI SDK initialized.');
  console.log('DEBUG: Quiz Service initialized.');
} else {
  console.error('FATAL: GOOGLE_API_KEY not found. AI services will not work.');
  quizService = new QuizService(); // Initialize without API key for fallback
}

// --- Gemini API Retry Helper ---
async function callGeminiWithRetry(payload, maxRetries = 3, delay = 2000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await geminiModel.generateContent(payload);
    } catch (error) {
      const status = error.status || error.response?.status;
      if (status === 503 && attempt < maxRetries - 1) {
        await new Promise(res => setTimeout(res, delay * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Gemini AI service is overloaded. Please try again later.');
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
    // Parse and extract the function from the equation (handle y = ... or just the expression)
    let expression = functionStr.includes('=') ? functionStr.split('=')[1].trim() : functionStr.trim();

    // Clean and normalize the expression for mathjs
    expression = expression
      .replace(/\^/g, '**') // Handle exponents (e.g., x^2 -> x**2)
      .replace(/\*\*|\\/g, '^') // Convert back to mathjs exponent syntax
      .replace(/(\d+\.?\d*)\s*([a-zA-Z(])/g, '$1 * $2') // Handle implicit multiplication
      .replace(/\)\(/g, ') * ('); // Handle multiplication between parentheses

    console.log(`DEBUG: Cleaned expression: ${expression}`);

    // Generate more data points for smoother curves
    // Use smaller step size for better curve resolution
    const actualStep = Math.min(step, (xMax - xMin) / 100); // At least 100 points for smooth curves

    for (let x = xMin; x <= xMax; x += actualStep) {
      try {
        const scope = { x: x };
        const y = evaluate(expression, scope);
        if (typeof y === 'number' && isFinite(y)) {
          data.push({ x: x, y: y });
        }
      } catch (evalError) {
        console.log(`DEBUG: Error evaluating at x=${x}: ${evalError.message}`);
        // Skip invalid points but continue with the rest
      }
    }

    if (data.length === 0) {
      console.error("No valid data points generated");
      return null;
    }

    console.log(`DEBUG: Generated ${data.length} data points`);
    return data;
  } catch (error) {
    console.error("Error in generateGraphData:", error);
    return null;
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

    // If there's a specific PDF context from a past paper, fetch and add it.
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

    // Check all parts for function calls, not just the first one
    const parts = response.candidates?.[0]?.content?.parts || [];
    const functionCall = parts.find(part => part.functionCall)?.functionCall;

    const userMessage = Array.isArray(message) ? message.find(p => p.text)?.text || '' : message;
    const isGraphRequest = /\b(plot|graph)\b/i.test(userMessage);

    if (isGraphRequest && functionCall && functionCall.name === 'generate_graph_data') {
      const { functionStr, xMin, xMax, step } = functionCall.args;
      console.log(`DEBUG: Processing graph request for: ${functionStr}`);

      try {
        const graphData = await generateGraphData(functionStr, xMin, xMax, step);

        if (graphData && graphData.length > 0) {
          console.log(`DEBUG: Generated ${graphData.length} data points for graph`);
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
            console.error("Graph image generation failed after data calculation.");
            throw new Error("Graph image generation failed.");
          }
        } else {
          console.error("No valid data points generated for graph");
          throw new Error("Could not generate valid data points for the function.");
        }
      } catch (graphError) {
        console.error("Graph generation error:", graphError.message);
        // Send a fallback response explaining the issue
        const fallbackResponse = `I tried to generate a graph for "${functionStr}", but encountered an error: ${graphError.message}. Please check that the mathematical expression is valid and try again.`;
        conversation.history.push({ role: 'user', parts: [{ text: message }] });
        conversation.history.push({ role: 'model', parts: [{ text: fallbackResponse }] });
        return res.json({ kanaResponse: fallbackResponse });
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
  try {
    const { sourceMaterialId, difficulty, numQuestions } = req.body;
    if (!sourceMaterialId || !difficulty || !numQuestions) {
      return res.status(400).json({ error: 'sourceMaterialId, difficulty, and numQuestions are required.' });
    }

    const material = studyMaterialsDb.find(m => m.id === sourceMaterialId);
    if (!material) {
      return res.status(404).json({ error: 'Study material not found.' });
    }

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

// New Quiz Generation Endpoints using QuizService

/**
 * Generate quiz based on description and optional context
 * POST /api/kana/generate-quiz-by-description
 */
app.post('/api/kana/generate-quiz-by-description', async (req, res) => {
  try {
    const {
      description,
      numQuestions = 5,
      difficulty = 'medium',
      subject = 'General',
      studentLevel = 'intermediate',
      weaknessAreas = [],
      context = ''
    } = req.body;

    // Validate required fields
    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        error: 'Description is required for quiz generation',
        message: 'Please provide a description of what the quiz should cover'
      });
    }

    console.log(`🧠 Quiz generation request: "${description}" - ${numQuestions} questions, ${difficulty} difficulty`);

    // Generate quiz using Gemini with retry logic
    let quiz;
    try {
      quiz = await callGeminiWithRetry(
        `Generate a quiz: ${description}\nQuestions: ${numQuestions}\nDifficulty: ${difficulty}\nSubject: ${subject}\nStudent Level: ${studentLevel}\nWeakness Areas: ${Array.isArray(weaknessAreas) ? weaknessAreas.join(', ') : ''}\nContext: ${context}`
      );
    } catch (error) {
      console.error('Gemini quiz generation failed:', error.message);
      return res.status(503).json({
        error: 'Gemini AI service is overloaded. Please try again later.'
      });
    }

    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return res.status(500).json({
        error: 'Failed to generate quiz questions',
        message: 'The quiz generation service was unable to create questions. Please try again.'
      });
    }

    console.log(`✅ Quiz generated successfully: ${quiz.questions.length} questions`);

    res.json({
      success: true,
      quiz: quiz,
      metadata: {
        generatedBy: quiz.generatedBy,
        questionCount: quiz.questions.length,
        estimatedTime: quiz.timeLimitMinutes,
        createdAt: quiz.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error in quiz generation by description:', error);
    res.status(500).json({
      error: 'Quiz generation failed',
      message: error.message || 'An unexpected error occurred during quiz generation',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Generate quiz for educational improvement (compatible with modules.py)
 * POST /api/kana/generate-improvement-quiz
 */
app.post('/api/kana/generate-improvement-quiz', async (req, res) => {
  try {
    const {
      assignment_id,
      student_id,
      feedback,
      weakness_areas = [],
      subject = 'General',
      grade = 'intermediate',
      numQuestions = 5,
      context = ''
    } = req.body;

    // Validate required fields
    if (!feedback || feedback.trim().length === 0) {
      return res.status(400).json({
        error: 'Feedback is required for improvement quiz generation',
        message: 'Please provide teacher feedback to generate targeted improvement questions'
      });
    }

    console.log(`🎯 Improvement quiz request for student ${student_id}, assignment ${assignment_id}`);

    // Create description from feedback and weakness areas
    const weaknessText = weakness_areas.length > 0 ? weakness_areas.join(', ') : 'general understanding';
    const description = `Generate an improvement quiz based on teacher feedback: "${feedback}". Focus on helping the student improve in: ${weaknessText}`;

    // Generate quiz using QuizService
    const quiz = await quizService.generateQuiz(description, {
      numQuestions: parseInt(numQuestions),
      difficulty: 'medium',
      subject: subject,
      studentLevel: grade,
      weaknessAreas: weakness_areas,
      context: `Teacher Feedback: ${feedback}\n${context}`
    });

    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return res.status(500).json({
        error: 'Failed to generate improvement quiz',
        message: 'Unable to create quiz questions based on the provided feedback'
      });
    }

    // Format response to match modules.py expectations
    const formattedQuiz = {
      id: quiz.id,
      assignment_id: assignment_id,
      student_id: student_id,
      title: `Improvement Quiz - Assignment Review`,
      description: `This quiz is designed to help you improve in areas where you can grow. Focus on the concepts and take your time!`,
      questions: quiz.questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        topic: q.topic,
        weakness_area: q.weaknessArea
      })),
      weakness_areas: weakness_areas,
      created_at: quiz.createdAt,
      max_attempts: 3,
      time_limit_minutes: quiz.timeLimitMinutes,
      attempts: [],
      generated_by: quiz.generatedBy,
      kana_available: quiz.generatedBy === 'kana_ai'
    };

    console.log(`✅ Improvement quiz generated: ${formattedQuiz.questions.length} questions for ${weaknessText}`);

    res.json(formattedQuiz);

  } catch (error) {
    console.error('❌ Error in improvement quiz generation:', error);
    res.status(500).json({
      error: 'Improvement quiz generation failed',
      message: error.message || 'Failed to generate quiz based on feedback',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Get quiz by ID (for retrieving generated quizzes)
 * GET /api/kana/quiz/:quizId
 */
app.get('/api/kana/quiz/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;

    // Note: In a real implementation, you'd store quizzes in a database
    // For now, this is a placeholder for the quiz retrieval functionality

    res.status(404).json({
      error: 'Quiz not found',
      message: 'Quiz storage and retrieval will be implemented with database integration'
    });

  } catch (error) {
    console.error('❌ Error retrieving quiz:', error);
    res.status(500).json({
      error: 'Failed to retrieve quiz',
      message: error.message
    });
  }
});

/**
 * Chat endpoint that can generate quizzes (compatibility with existing chat system)
 * POST /api/kana/chat
 */
app.post('/api/kana/chat', async (req, res) => {
  try {
    const { message, mode, type, conversationId = 'default' } = req.body;

    // Check if this is a quiz generation request
    if (mode === 'quiz_generation' || type === 'educational_quiz') {
      console.log('🧠 Quiz generation via chat endpoint');

      // Extract quiz parameters from message
      const quizRequest = typeof message === 'string' ? message : JSON.stringify(message);

      // Generate quiz using QuizService
      const quiz = await quizService.generateQuiz(quizRequest, {
        numQuestions: 5,
        difficulty: 'medium',
        subject: 'General'
      });

      return res.json({
        success: true,
        type: 'quiz_generation',
        kanaResponse: `I've generated a ${quiz.questions.length}-question quiz for you.`,
        quiz: quiz,
        generatedBy: quiz.generatedBy
      });
    }

    // If not a quiz request, return error (this endpoint is specifically for quiz generation)
    res.status(400).json({
      error: 'Invalid request',
      message: 'This endpoint is specifically for quiz generation. Use mode="quiz_generation" or type="educational_quiz"'
    });

  } catch (error) {
    console.error('❌ Error in kana chat quiz endpoint:', error);
    res.status(500).json({
      error: 'Quiz generation failed',
      message: error.message
    });
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
    // Try ChartJS (PNG) if available
    if (generateChartJSGraph) {
      try {
        const pngUrl = await generateChartJSGraph(data, title, xLabel, yLabel);
        if (pngUrl) return pngUrl;
      } catch (e) {
        console.warn('ChartJS graph generation failed, falling back to SVG:', e);
      }
    }
    // Fallback: SVG
    const svg = generateSVGGraph(data, title, xLabel, yLabel);
    if (svg) {
      const fileName = `graph_${Date.now()}.svg`;
      const filePath = path.join(__dirname, 'uploads', fileName);
      fs.writeFileSync(filePath, svg, 'utf8');
      return `/uploads/${fileName}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating graph image:", error);
    return null;
  }
};

const startServer = async () => {
  await loadDb();
  await initializeDatabase();

  // Initialize syllabus integration with conversation contexts
  initializeConversationContexts(conversationContexts);

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

  // New endpoint for direct K.A.N.A. analysis (used by teacher dashboard)
  app.post('/kana-direct', async (req, res) => {
    try {
      const { image_data, pdf_data, pdf_text, student_context, analysis_type, task_type, assignment_title, max_points, grading_rubric } = req.body;

      // Check if at least one type of data is provided
      if (!image_data && !pdf_data && !pdf_text) {
        return res.status(400).json({ error: 'Either image_data, pdf_data, or pdf_text is required' });
      }

      console.log(`DEBUG: /kana-direct called with task_type: ${task_type}, analysis_type: ${analysis_type}, student_context: ${student_context}`);

      // Check if Gemini AI is initialized
      if (!genAI) {
        console.error('ERROR: Google AI not initialized - check GOOGLE_API_KEY');
        return res.status(500).json({ error: 'AI service not configured' });
      }

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const isGradingMode = task_type === 'grade_assignment';

      let analysisResult;

      // Handle PDF analysis
      if (pdf_data || pdf_text) {
        let textContent = pdf_text;

        // If we have pdf_data (base64), convert it to text
        if (pdf_data && !pdf_text) {
          try {
            const pdfBuffer = Buffer.from(pdf_data, 'base64');
            textContent = await extractTextFromFile('application/pdf', pdfBuffer);
          } catch (pdfError) {
            console.error('Error extracting text from PDF:', pdfError);
            return res.status(500).json({ error: 'Failed to extract text from PDF' });
          }
        }

        // Generate analysis prompt for PDF content
        const analysisPrompt = isGradingMode
          ? `Grade this student assignment based on the following criteria:
             Assignment: ${assignment_title}
             Max Points: ${max_points}
             Grading Rubric: ${grading_rubric}
             
             Student Work:
             ${textContent}
             
             Provide a detailed analysis including:
             **GRADE BREAKDOWN**
             Points Earned: X/${max_points}
             Letter Grade: [A-F]
             Percentage: X%
             
             **DETAILED FEEDBACK**
             [Provide specific feedback on the work]
             
             **LEARNING STRENGTHS**
             • [List observed strengths]
             
             **GROWTH OPPORTUNITIES**
             • [List areas for improvement]
             
             **STUDY SUGGESTIONS**
             • [Provide specific recommendations]`
          : `Analyze this student work and provide educational insights:
             
             Student Context: ${student_context || 'Not provided'}
             Content: ${textContent}
             
             Please provide:
             **LEARNING ANALYSIS**
             [Overall assessment of understanding]
             
             **LEARNING STRENGTHS**
             • [List observed strengths]
             
             **GROWTH OPPORTUNITIES**
             • [List areas for improvement]
             
             **STUDY SUGGESTIONS**
             • [Provide specific recommendations]`;

        const result = await model.generateContent(analysisPrompt);
        analysisResult = result.response.text();

      } else if (image_data) {
        // Handle image analysis
        try {
          const imageBuffer = Buffer.from(image_data, 'base64');
          const imagePart = {
            inlineData: {
              data: image_data,
              mimeType: 'image/jpeg' // Assume JPEG, could be made dynamic
            }
          };

          const analysisPrompt = isGradingMode
            ? `Grade this student assignment based on the following criteria:
               Assignment: ${assignment_title}
               Max Points: ${max_points}
               Grading Rubric: ${grading_rubric}
               
               Please analyze the image and provide:
               **GRADE BREAKDOWN**
               Points Earned: X/${max_points}
               Letter Grade: [A-F]
               Percentage: X%
               
               **DETAILED FEEDBACK**
               [Provide specific feedback on the work]
               
               **LEARNING STRENGTHS**
               • [List observed strengths]
               
               **GROWTH OPPORTUNITIES**
               • [List areas for improvement]
               
               **STUDY SUGGESTIONS**
               • [Provide specific recommendations]`
            : `Analyze this student work image and provide educational insights:
               
               Student Context: ${student_context || 'Not provided'}
               
               Please provide:
               **LEARNING ANALYSIS**
               [Overall assessment of understanding]
               
               **LEARNING STRENGTHS**
               • [List observed strengths]
               
               **GROWTH OPPORTUNITIES**
               • [List areas for improvement]
               
               **STUDY SUGGESTIONS**
               • [Provide specific recommendations]`;

          const result = await model.generateContent([analysisPrompt, imagePart]);
          analysisResult = result.response.text();

        } catch (imageError) {
          console.error('Error analyzing image:', imageError);
          return res.status(500).json({ error: 'Failed to analyze image' });
        }
      }

      // Parse the analysis result
      const knowledgeGaps = parseKnowledgeGaps(analysisResult);
      const recommendations = parseRecommendations(analysisResult);
      const strengths = parseStrengths(analysisResult);
      const confidence = parseConfidenceFromAnalysis(analysisResult);
      const gradingData = parseGradingFromAnalysis(analysisResult);

      // Prepare response data
      const responseData = {
        analysis: analysisResult,
        success: true,

        // Frontend-compatible structured fields
        knowledge_gaps: knowledgeGaps,
        recommendations: recommendations,
        student_strengths: strengths,
        strengths: strengths, // For compatibility with newer frontend versions
        confidence: confidence,

        // Add extracted text for frontend display
        extracted_text: pdf_text || (pdf_data ? 'Text extracted from PDF' : 'Text extracted from image')
      };

      // Add grading information if available
      if (isGradingMode && gradingData.score !== null) {
        responseData.grade = gradingData.score;
        responseData.score = gradingData.score;
        responseData.max_points = gradingData.maxPoints || max_points;
        responseData.letter_grade = gradingData.letterGrade;
        responseData.percentage = gradingData.percentage;

        // Parse improvement areas from grading analysis
        responseData.improvement_areas = parseKnowledgeGaps(analysisResult);
        responseData.areas_for_improvement = parseKnowledgeGaps(analysisResult);

        // Overall feedback from the analysis
        responseData.overall_feedback = analysisResult.split('**DETAILED FEEDBACK**')[1]?.split('**')[0]?.trim() ||
          analysisResult.substring(0, 200) + '...';
      }

      // Add assignment details if in grading mode
      if (isGradingMode) {
        responseData.assignment_details = {
          title: assignment_title,
          max_points: max_points,
          grading_rubric: grading_rubric
        };
      }

      res.json(responseData);

    } catch (error) {
      console.error('Error in /kana-direct:', error);
      res.status(500).json({
        error: 'Failed to analyze content',
        details: error.message
      });
    }
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`K.A.N.A. Backend listening at http://localhost:${port}`);
  });
};

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

// --- ELIZAOS AGENT INTEGRATION ---

// ElizaOS Agent Manager (placeholder - will be implemented when ElizaOS is installed)
let elizaAgentManager = null;

// Initialize ElizaOS agents if available
async function initializeElizaAgents() {
  try {
    // This will be uncommented when ElizaOS is properly installed
    // const { BrainInkAgentManager } = require('../elizaos-agents/dist/index.js');
    // elizaAgentManager = new BrainInkAgentManager();
    // await elizaAgentManager.initialize();
    console.log('📡 ElizaOS agent integration ready (placeholder mode)');
  } catch (error) {
    console.log('⚠️ ElizaOS agents not available, using fallback mode');
    elizaAgentManager = null;
  }
}

// ElizaOS agent communication endpoint
app.post('/api/eliza/chat', async (req, res) => {
  try {
    const { message, agentName, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // If ElizaOS is available, use it
    if (elizaAgentManager) {
      const result = await elizaAgentManager.routeMessage(
        agentName || 'K.A.N.A. Educational Tutor',
        message,
        context
      );
      return res.json(result);
    }

    // Fallback to existing KANA logic with agent classification
    const agentType = classifyMessageForAgent(message);
    const conversationId = context?.conversationId || 'default';

    // Enhanced KANA response with agent personality
    const enhancedPrompt = `As the ${agentType}, respond to: ${message}`;

    if (!geminiModel) {
      return res.status(500).json({ error: 'AI service not available' });
    }

    const conversation = getOrCreateConversation(conversationId);

    const chat = geminiModel.startChat({
      history: conversation.history,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(enhancedPrompt);
    const response = result.response.text();

    // Update conversation history
    conversation.history.push(
      { role: 'user', parts: [{ text: enhancedPrompt }] },
      { role: 'model', parts: [{ text: response }] }
    );

    res.json({
      success: true,
      agent: agentType,
      response: response,
      metadata: {
        timestamp: new Date().toISOString(),
        mode: 'fallback',
        context
      }
    });

  } catch (error) {
    console.error('ElizaOS chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Agent classification endpoint
app.post('/api/eliza/classify', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const classification = classifyMessageForAgent(message);

    res.json({
      success: true,
      classification: {
        agent: classification,
        confidence: getClassificationConfidence(message, classification),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Classification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Agent status endpoint
app.get('/api/eliza/status', async (req, res) => {
  try {
    let agentStatus = [];

    if (elizaAgentManager) {
      agentStatus = await elizaAgentManager.getAgentStatus();
    } else {
      // Fallback status
      agentStatus = [
        { name: 'K.A.N.A. Educational Tutor', status: 'active (fallback)', lastActive: new Date().toISOString() },
        { name: 'Squad Learning Coordinator', status: 'available (fallback)', lastActive: new Date().toISOString() },
        { name: 'Learning Progress Analyst', status: 'available (fallback)', lastActive: new Date().toISOString() }
      ];
    }

    res.json({
      success: true,
      elizaIntegration: elizaAgentManager ? 'active' : 'fallback',
      agents: agentStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function for message classification
function classifyMessageForAgent(message) {
  const lowerMessage = message.toLowerCase();

  // Educational content and tutoring
  if (lowerMessage.includes('help') || lowerMessage.includes('explain') ||
    lowerMessage.includes('quiz') || lowerMessage.includes('study') ||
    lowerMessage.includes('homework') || lowerMessage.includes('learn') ||
    lowerMessage.includes('understand') || lowerMessage.includes('concept')) {
    return 'K.A.N.A. Educational Tutor';
  }

  // Group formation and collaboration
  if (lowerMessage.includes('group') || lowerMessage.includes('team') ||
    lowerMessage.includes('squad') || lowerMessage.includes('partner') ||
    lowerMessage.includes('collaborate') || lowerMessage.includes('together') ||
    lowerMessage.includes('study buddy') || lowerMessage.includes('work with')) {
    return 'Squad Learning Coordinator';
  }

  // Progress and analytics
  if (lowerMessage.includes('progress') || lowerMessage.includes('performance') ||
    lowerMessage.includes('analytics') || lowerMessage.includes('data') ||
    lowerMessage.includes('improvement') || lowerMessage.includes('track') ||
    lowerMessage.includes('score') || lowerMessage.includes('grade') ||
    lowerMessage.includes('statistics') || lowerMessage.includes('analysis')) {
    return 'Learning Progress Analyst';
  }

  // Default to main tutor
  return 'K.A.N.A. Educational Tutor';
}

// Helper function for classification confidence
function getClassificationConfidence(message, classification) {
  const lowerMessage = message.toLowerCase();

  const keywordCounts = {
    'K.A.N.A. Educational Tutor': (lowerMessage.match(/help|explain|quiz|study|homework|learn|understand|concept/g) || []).length,
    'Squad Learning Coordinator': (lowerMessage.match(/group|team|squad|partner|collaborate|together/g) || []).length,
    'Learning Progress Analyst': (lowerMessage.match(/progress|performance|analytics|data|improvement|track/g) || []).length
  };

  const maxCount = Math.max(...Object.values(keywordCounts));
  const currentCount = keywordCounts[classification] || 0;

  if (maxCount === 0) return 0.5; // No keywords found
  return Math.min(0.95, 0.6 + (currentCount / maxCount) * 0.35);
}

// Helper functions to parse structured data from K.A.N.A.'s formatted analysis
function parseKnowledgeGaps(analysisText) {
  const gaps = [];
  const lines = analysisText.split('\n');
  let inGapsSection = false;

  for (const line of lines) {
    if (line.includes('Growth Opportunities:') || line.includes('Areas for Improvement:') ||
      line.includes('Knowledge Gaps:') || line.includes('Areas for development')) {
      inGapsSection = true;
      continue;
    }
    if (line.includes('**') && inGapsSection) {
      inGapsSection = false;
    }
    if (inGapsSection && line.trim().startsWith('•')) {
      gaps.push(line.replace(/^[•*]\s*/, '').trim());
    }
  }
  return gaps;
}

function parseRecommendations(analysisText) {
  const recommendations = [];
  const lines = analysisText.split('\n');
  let inRecommendationsSection = false;

  for (const line of lines) {
    if (line.includes('Study Suggestions:') || line.includes('Recommendations:') ||
      line.includes('Next Steps:') || line.includes('Teaching suggestions:')) {
      inRecommendationsSection = true;
      continue;
    }
    if (line.includes('**') && inRecommendationsSection) {
      inRecommendationsSection = false;
    }
    if (inRecommendationsSection && (line.trim().startsWith('•') || line.trim().match(/^\d+\./))) {
      recommendations.push(line.replace(/^[•*\d\.]\s*/, '').trim());
    }
  }
  return recommendations;
}

function parseStrengths(analysisText) {
  const strengths = [];
  const lines = analysisText.split('\n');
  let inStrengthsSection = false;

  for (const line of lines) {
    if (line.includes('Learning Strengths:') || line.includes('Strengths:') ||
      line.includes('Strengths Observed:')) {
      inStrengthsSection = true;
      continue;
    }
    if (line.includes('**') && inStrengthsSection) {
      inStrengthsSection = false;
    }
    if (inStrengthsSection && line.trim().startsWith('•')) {
      strengths.push(line.replace(/^[•*]\s*/, '').trim());
    }
  }
  return strengths;
}

function parseConfidenceFromAnalysis(analysisText) {
  // Extract a confidence score based on the depth and structure of the analysis
  const hasDetailedSections = analysisText.includes('**') && analysisText.includes('•');
  const wordCount = analysisText.split(' ').length;
  const hasSpecificConcepts = analysisText.toLowerCase().includes('understanding') ||
    analysisText.toLowerCase().includes('demonstrates') ||
    analysisText.toLowerCase().includes('concepts');

  let confidence = 70; // Base confidence
  if (hasDetailedSections) confidence += 10;
  if (wordCount > 200) confidence += 10;
  if (hasSpecificConcepts) confidence += 10;

  return Math.min(95, confidence);
}

function parseGradingFromAnalysis(analysisText) {
  const gradeMatch = analysisText.match(/Points Earned:\s*(\d+)\/(\d+)/);
  const letterGradeMatch = analysisText.match(/Letter Grade:\s*([A-F][+-]?)/);
  const percentageMatch = analysisText.match(/Percentage:\s*(\d+)%/);

  return {
    score: gradeMatch ? parseInt(gradeMatch[1]) : null,
    maxPoints: gradeMatch ? parseInt(gradeMatch[2]) : null,
    letterGrade: letterGradeMatch ? letterGradeMatch[1] : null,
    percentage: percentageMatch ? parseInt(percentageMatch[1]) : null
  };
}

// Initialize ElizaOS agents on startup
initializeElizaAgents();

console.log('🚀 K.A.N.A. Backend with ElizaOS integration ready!');

startServer();
