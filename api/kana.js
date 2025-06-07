// c:\Users\musev\Downloads\Brain\api\kana.js
// Adapted for Vercel Serverless Functions
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const multer = require('multer');
// const fs = require('fs'); // fs usage should be minimal and for temporary/non-critical storage in serverless
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { create, all } = require('mathjs');

const app = express(); // This will be the main app for this serverless function
const math = create(all);
let parameterScope = {}; // For math evaluations. Note: Serverless functions are generally stateless.

// Middleware
app.use(cors()); // Configure CORS appropriately for your frontend's Vercel domain
app.use(express.json());

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

// Multer setup for image uploads
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only image files are allowed.'), false);
  }
};
const uploadImage = multer({ storage: storage, fileFilter: imageFileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // Limit image size to 10MB

// Global variables (Warning: Global state like this is not reliable in serverless environments due to statelessness and potential concurrency)
// These will reset on each invocation or be inconsistent across scaled instances.
// Consider using Vercel KV or an external DB for state that needs to persist.
let uploadedNoteContent = null;
let uploadedNoteName = null;
const pdfCache = {}; // Simple in-memory cache, also not reliable across serverless invocations for long.
const MAX_CACHE_SIZE = 10; // Reduced for serverless memory constraints
let cacheKeys = [];

// Google Clients Initialization
let genAI, geminiModel;
let visionClient;

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
// GOOGLE_CREDENTIALS_JSON_STRING should be the string content of the JSON keyfile
const GOOGLE_CREDENTIALS_JSON_STRING = process.env.GOOGLE_CREDENTIALS_JSON;

if (GOOGLE_API_KEY && GOOGLE_CREDENTIALS_JSON_STRING) {
  try {
    const credentials = JSON.parse(GOOGLE_CREDENTIALS_JSON_STRING);
    genAI = new GoogleGenerativeAI(GOOGLE_API_KEY); // The API key is often enough for GenAI if the project is configured.
    geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest"});
    
    // ImageAnnotatorClient usually needs explicit credentials for service accounts
    visionClient = new ImageAnnotatorClient({ credentials });
    console.log('DEBUG: Google AI SDK and Vision client initialized via parsed JSON credentials for serverless.');
  } catch (e) {
    console.error("CRITICAL_ERROR initializing Google clients with parsed JSON credentials:", e.message, e.stack);
    // In a real app, you might set a flag here to indicate services are degraded.
  }
} else {
  let missingVars = [];
  if (!GOOGLE_API_KEY) missingVars.push("GOOGLE_API_KEY");
  if (!GOOGLE_CREDENTIALS_JSON_STRING) missingVars.push("GOOGLE_CREDENTIALS_JSON");
  console.error(`CRITICAL_ERROR: Missing Google credentials for Vercel deployment. Ensure ${missingVars.join(' and ')} are set in Vercel environment variables.`);
}

// Hugging Face Image Generation API details
const HUGGING_FACE_API_TOKEN = process.env.HUGGING_FACE_API_TOKEN;
const HF_IMAGE_MODEL_URL = process.env.HUGGING_FACE_MODEL_URL || 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';

// --- API ROUTES ---
// Vercel maps requests to /api/kana.js to handle routes defined here.
// So, a route app.get('/chat', ...) in this file will handle GET /api/kana/chat.

// Simple test route (e.g., /api/kana/test)
app.get('/test', (req, res) => {
  res.send('K.A.N.A. API (kana.js) is responding!');
});

// PDF Proxy Endpoint (e.g., /api/kana/pdf-proxy)
app.get('/pdf-proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing URL query parameter');
  try {
    const decodedUrl = decodeURIComponent(url);
    console.log(`Serverless: Proxying PDF from: ${decodedUrl}`);
    const response = await axios({ method: 'get', url: decodedUrl, responseType: 'stream', timeout: 15000 });
    res.setHeader('Content-Type', 'application/pdf');
    response.data.pipe(res);
  } catch (error) {
    console.error('Serverless: Error proxying PDF:', error.message);
    res.status(error.response ? error.response.status : 500).send('Error proxying PDF');
  }
});

// Endpoint to upload a note (e.g., /api/kana/upload-note)
app.post('/upload-note', upload.single('noteFile'), async (req, res) => {
  if (!req.file) return res.status(400).json({ type: 'error', message: 'No file uploaded.' });
  try {
    let textContent = '';
    if (req.file.mimetype === 'text/plain') {
      textContent = req.file.buffer.toString('utf8');
    } else if (req.file.mimetype === 'application/pdf') {
      const data = await pdf(req.file.buffer);
      textContent = data.text;
    }
    
    uploadedNoteContent = textContent; // State is per-invocation or short-lived in serverless
    uploadedNoteName = req.file.originalname;
    console.log(`Serverless: Note uploaded and processed: ${uploadedNoteName}, length: ${textContent.length}`);
    res.json({ 
      type: 'success',
      message: `Note '${uploadedNoteName}' uploaded. K.A.N.A. will use it as context (this instance).`,
      fileName: uploadedNoteName
    });
  } catch (error) {
    console.error('Serverless: Error processing uploaded file:', error);
    uploadedNoteContent = null; 
    uploadedNoteName = null;
    res.status(500).json({ type: 'error', message: 'Error processing file: ' + error.message });
  }
});

// Endpoint to clear uploaded note context (e.g., /api/kana/clear-note-context)
app.post('/clear-note-context', (req, res) => {
  uploadedNoteContent = null;
  uploadedNoteName = null;
  console.log('Serverless: Uploaded note context cleared (this instance).');
  res.json({ type: 'success', message: 'Uploaded note context cleared (this instance).' });
});

// Endpoint for Image Analysis (e.g., /api/kana/analyze-image)
app.post('/analyze-image', uploadImage.single('imageFile'), async (req, res) => {
  const { message, subject, conversationId, title, activePdfUrl } = req.body;
  
  if (!req.file) return res.status(400).json({ type: 'error', message: 'No image file uploaded.' });

  if (!visionClient || !geminiModel) {
    console.error("Serverless: Image analysis services not ready. VisionClient:", !!visionClient, "GeminiModel:", !!geminiModel);
    return res.status(500).json({ type: 'error', message: 'Image analysis service is not available due to initialization issues.' });
  }

  console.log(`Serverless: Received image analysis request for ${req.file.originalname}`);
  try {
    const imageBuffer = req.file.buffer;
    const [visionResults] = await visionClient.annotateImage({
      image: { content: imageBuffer },
      features: [
        { type: 'TEXT_DETECTION' },
        { type: 'LABEL_DETECTION', maxResults: 10 },
      ],
    });

    const textAnnotations = visionResults.textAnnotations || [];
    const fullTextAnnotation = textAnnotations.length > 0 ? textAnnotations[0].description : null;
    const labels = visionResults.labelAnnotations ? visionResults.labelAnnotations.map(label => label.description) : [];

    console.log('Serverless: Vision API - OCR:', fullTextAnnotation ? 'Text found' : 'No text', '- Labels:', labels.join(', '));

    let geminiPrompt = `You are K.A.N.A. (Knowledge Assistant for Natural Academics). Your purpose is to help students learn and understand academic topics. Be helpful, informative, and concise. If you don't know something, say so. Prioritize using provided context. Steer conversations back to an educational topic. Do not invent information.\n\nThe user has uploaded an image titled '${req.file.originalname}'. You have analyzed it with the following results:\n`;
    if (fullTextAnnotation) geminiPrompt += `\n---BEGIN DETECTED TEXT FROM IMAGE (OCR)---\n${fullTextAnnotation}\n---END DETECTED TEXT FROM IMAGE---\n`;
    if (labels.length > 0) geminiPrompt += `\nThe image appears to contain or be about: ${labels.join(', ')}.\n`;
    if (!fullTextAnnotation && labels.length === 0) geminiPrompt += "\nYou could not detect any specific text or labels in the image.\n";
    geminiPrompt += `\nUser's message related to the image: "${message || '(No specific message provided alongside the image)'}"\n\nBased on the image content and the user's message, please provide a helpful and informative academic response.`;
    
    let fullPromptForGemini = geminiPrompt;
    // Add other context if available (PDF, notes) - remember statelessness
    if (activePdfUrl) { // This context would need to be fetched or passed with each request in a truly stateless app
        fullPromptForGemini = `(The user also has a PDF titled '${activePdfUrl}' potentially active as context.)\n\n${fullPromptForGemini}`;
    }
    if (uploadedNoteContent && uploadedNoteName) { // This is using the unreliable global var
        fullPromptForGemini = `---BEGIN UPLOADED NOTE CONTENT ('${uploadedNoteName}')---\n${uploadedNoteContent}\n---END UPLOADED NOTE CONTENT---\n\n${fullPromptForGemini}`;
    }

    const result = await geminiModel.generateContent(fullPromptForGemini);
    const geminiResponseText = await result.response.text();
    
    res.json({
      type: 'image_with_explanation',
      kanaResponse: geminiResponseText, 
      explanation: geminiResponseText, // For frontend compatibility
      originalFileName: req.file.originalname,
      ocrText: fullTextAnnotation,
      detectedLabels: labels,
      imageUrl: null // Not returning image data URL from this endpoint
    });
  } catch (error) {
    console.error('Serverless: Error during image analysis:', error.message, error.stack);
    res.status(500).json({ type: 'error', message: 'Error analyzing image: ' + error.message });
  }
});

// Main Chat Endpoint (e.g., /api/kana/chat)
app.post('/chat', async (req, res) => {
  const { message, activePdfUrl } = req.body; 

  if (!message) return res.status(400).json({ error: 'Message is required' });
  if (!geminiModel) {
    console.error("Serverless: Chat service not ready. GeminiModel:", !!geminiModel);
    return res.status(500).json({ error: 'Chat service is not available due to initialization issues.' });
  }

  try {
    // Parameter assignment detection (simplified, ensure full logic from original)
    const assignmentMatch = message.match(/^(?:let|define|set)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|as|to)\s*(-?\d+(?:\.\d+)?)$/i);
    if (assignmentMatch) {
      const varName = assignmentMatch[1];
      const varValue = parseFloat(assignmentMatch[2]);
      parameterScope[varName] = varValue; // Unreliable state
      return res.json({ kanaResponse: `Parameter ${varName} set to ${varValue}. Note: parameters are session-specific in this environment.`});
    }
    // Add other command parsing here (conditional plot, graph request) from original index.js

    let pdfContext = '';
    const KANA_SYSTEM_PROMPT = "You are K.A.N.A. (Knowledge Assistant for Natural Academics). Your purpose is to help students learn and understand academic topics. Be helpful, informative, and concise. If you don't know something, say so. Prioritize using provided PDF context if available and relevant. Steer conversations back to an educational topic. Do not invent information.";

    if (activePdfUrl) {
        if (pdfCache[activePdfUrl]) { // Unreliable cache
            pdfContext = pdfCache[activePdfUrl];
            console.log(`Serverless: PDF Cache HIT for: ${activePdfUrl}`);
        } else {
            try {
                console.log(`Serverless: Fetching PDF for context: ${activePdfUrl}`);
                // In a serverless function, direct HTTP calls to external URLs are standard.
                const pdfResponse = await axios.get(activePdfUrl, { responseType: 'arraybuffer', timeout: 10000 });
                const data = await pdf(pdfResponse.data);
                pdfContext = data.text;
                if (Object.keys(pdfCache).length >= MAX_CACHE_SIZE) {
                    const oldestKey = cacheKeys.shift(); // LRU-like
                    delete pdfCache[oldestKey];
                }
                pdfCache[activePdfUrl] = pdfContext;
                cacheKeys.push(activePdfUrl);
                console.log(`Serverless: PDF Cached: ${activePdfUrl.substring(0,50)}...`);
            } catch (e) { 
                console.error('Serverless: Error fetching/processing PDF for chat context:', e.message); 
                // Don't fail the whole chat, just proceed without PDF context
            }
        }
    }

    let fullPrompt = KANA_SYSTEM_PROMPT;
    if (pdfContext) {
      fullPrompt += `\n\n---BEGIN PDF CONTEXT ('${activePdfUrl}')---\n${pdfContext}\n---END PDF CONTEXT---`;
    }
    // Use uploadedNoteContent (unreliable global)
    if (uploadedNoteContent && uploadedNoteName) {
      fullPrompt += `\n\n---BEGIN UPLOADED NOTE CONTENT ('${uploadedNoteName}')---\n${uploadedNoteContent}\n---END UPLOADED NOTE CONTENT---`;
    }
    fullPrompt += `\n\nUser's question: ${message}`;
    
    console.log(`Serverless: Sending to Gemini for chat: "${message.substring(0,50)}..."`);
    const result = await geminiModel.generateContent(fullPrompt);
    const kanaResponseText = await result.response.text();
    res.json({ kanaResponse: kanaResponseText });

  } catch (error) {
    console.error('Serverless: Error in /chat:', error.message, error.stack);
    res.status(500).json({ kanaResponse: 'An error occurred processing your chat request.', error: error.message });
  }
});

// Image Generation and Explanation Endpoint (e.g., /api/kana/generate-and-explain)
app.post('/generate-and-explain', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message for image generation is required.' });
  
  if (!HUGGING_FACE_API_TOKEN) {
    console.error("Serverless: Hugging Face API token not configured.");
    return res.status(500).json({ error: 'Image generation service not configured (missing token).' });
  }
  if (!geminiModel) {
    console.error("Serverless: Chat service (Gemini) not ready for explanation.");
    return res.status(500).json({ error: 'Chat service not available for explanation due to initialization issues.' });
  }

  const imagePromptMatch = message.match(/(?:generate|create|make|draw)(?: an image of| image of| an image| image)? (.+)/i);
  if (!imagePromptMatch || !imagePromptMatch[1]) {
    return res.status(400).json({ error: 'Could not understand image generation request format. Use "generate image of X".' });
  }
  const imagePrompt = imagePromptMatch[1].trim();
  console.log(`Serverless: Image generation request for: "${imagePrompt}"`);

  try {
    const hfResponse = await axios({
      method: 'post',
      url: HF_IMAGE_MODEL_URL,
      headers: { 
        'Authorization': `Bearer ${HUGGING_FACE_API_TOKEN}`, 
        'Content-Type': 'application/json' 
      },
      data: { inputs: imagePrompt },
      responseType: 'arraybuffer',
      timeout: 30000 // Increased timeout for image generation
    });
    const imageBase64 = Buffer.from(hfResponse.data).toString('base64');
    const imageUrl = `data:image/jpeg;base64,${imageBase64}`; // Or appropriate image type

    const explanationPrompt = `Explain the key elements or concepts in an image generated from the prompt: "${imagePrompt}". The image depicts this. Be concise and informative.`;
    const result = await geminiModel.generateContent(explanationPrompt);
    const explanation = await result.response.text();

    res.json({ type: 'image_with_explanation', imageUrl, explanation, kanaResponse: explanation });
  } catch (error) {
    console.error('Serverless: Error in /generate-and-explain:', error.message, error.response ? error.response.data : '');
    let errorMessage = 'Failed to generate or explain image.';
    if (error.response && error.response.data) {
        try { // Attempt to get more specific error from Hugging Face
            const errorDataString = Buffer.from(error.response.data).toString('utf-8');
            errorMessage += ` HF Details: ${errorDataString.substring(0,150)}`;
        } catch (e) { /* ignore parsing error */ }
    }
    res.status(500).json({ error: errorMessage });
  }
});

// Chart/Graph Generation Endpoint (e.g., /api/kana/plot-graph)
app.post('/plot-graph', async (req, res) => {
    const { expression, variable, min, max } = req.body;
    if (!expression || !variable || min == null || max == null) {
        return res.status(400).json({ error: 'Expression, variable, min, and max are required for plotting.' });
    }
    console.log(`Serverless: Plotting graph for: ${expression}, var: ${variable}, range: [${min}, ${max}]`);

    try {
        const scope = { ...parameterScope }; // Uses unreliable global state
        const node = math.parse(expression);
        const compiledExpr = node.compile();
        const xValues = [];
        const yValues = [];
        const numPoints = 100;
        // Ensure step is valid even if min=max
        const step = (numPoints <= 1 || min === max) ? 0 : (max - min) / (numPoints - 1);

        for (let i = 0; i < numPoints; i++) {
            let x = (numPoints === 1) ? min : min + i * step;
            if (i === numPoints - 1 && numPoints > 1) x = max; // Ensure last point is exactly max

            xValues.push(x);
            scope[variable] = x; // Set variable in scope for evaluation
            yValues.push(compiledExpr.evaluate(scope));
        }
        
        if (yValues.some(val => isNaN(val))) { // Check for NaN in results
            console.error("Serverless: NaN detected in yValues for plot", expression, variable, min, max, "Scope:", scope, "yValues:", yValues);
            return res.status(400).json({ error: `Could not evaluate expression "${expression}" over the given range. It might result in undefined values (e.g., division by zero, log of negative number) or use undefined variables.` });
        }

        const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 600, height: 400, backgroundColour: 'white' });
        const configuration = {
            type: 'line',
            data: {
                labels: xValues.map(val => parseFloat(val.toFixed(3))), // Format labels
                datasets: [{
                    label: expression,
                    data: yValues,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: { 
                scales: { 
                    y: { beginAtZero: false }, // Allow y-axis to not start at zero for better visualization
                    x: { type: 'linear', position: 'bottom'} // Ensure x-axis is treated as linear
                },
                responsive: true,
                maintainAspectRatio: false
            }
        };

        const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
        const imageUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;
        res.json({ type: 'image', imageUrl, kanaResponse: `Here is the plot of ${expression} for ${variable} from ${min} to ${max}.` });

    } catch (error) {
        console.error('Serverless: Error plotting graph:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to plot graph: ' + error.message });
    }
});


// Export the app for Vercel. Vercel will wrap this Express app in a single serverless function.
// All routes defined on `app` will be available under /api/kana/*
module.exports = app;