const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path'); // Added for explicit .env path
const pdf = require('pdf-parse');
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: true }); // Explicitly set path and override existing vars
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const multer = require('multer');
const fs = require('fs');
// pdf-parse is already required earlier
console.log('DEBUG: ChartJSNodeCanvas type:', typeof ChartJSNodeCanvas, ChartJSNodeCanvas);
const { create, all } = require('mathjs');
const { ImageAnnotatorClient } = require('@google-cloud/vision'); // For OCR and image analysis
const math = create(all); // For graph generation
let parameterScope = {}; // To store user-defined parameters

// Log loaded env variables for debugging
console.log('DEBUG: Loaded GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'Key Loaded' : 'Key NOT Loaded');
console.log('DEBUG: Loaded HUGGING_FACE_API_TOKEN for image gen:', process.env.HUGGING_FACE_API_TOKEN ? 'Token Loaded' : 'Token NOT Loaded');

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

let uploadedNoteContent = null; // To store text from uploaded note
let uploadedNoteName = null;

// In-memory cache for PDF text
const pdfCache = {};
// Simple cache eviction strategy: limit cache size
const MAX_CACHE_SIZE = 50; // Store up to 50 PDFs' text
let cacheKeys = []; // To track insertion order for LRU-like eviction

// Middleware
app.use(cors());
app.use(express.json());

// Google Gemini API details
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
let genAI, geminiModel;
let visionClient; // Google Cloud Vision client
if (GOOGLE_API_KEY) {
  genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest"}); // Trying gemini-1.5-flash-latest
  console.log('DEBUG: Google AI SDK initialized.');
  try {
    if (process.env.VERCEL_ENV && process.env.GOOGLE_CREDENTIALS_CONTENT) {
      // For Vercel deployment, parse credentials from environment variable content
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_CONTENT);
      visionClient = new ImageAnnotatorClient({ credentials });
      console.log('DEBUG: Google Cloud Vision client initialized from VERCEL_ENV/GOOGLE_CREDENTIALS_CONTENT.');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // For local development, use the file path from GOOGLE_APPLICATION_CREDENTIALS
      visionClient = new ImageAnnotatorClient(); 
      console.log('DEBUG: Google Cloud Vision client initialized from GOOGLE_APPLICATION_CREDENTIALS file path.');
    } else {
      console.error('DEBUG: Google Cloud Vision credentials not found (GOOGLE_CREDENTIALS_CONTENT or GOOGLE_APPLICATION_CREDENTIALS).');
    }
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
    res.status(500).json({ type: 'error', message: 'Error processing file: ' + error.message });
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

    let systemPrompt = `You are K.A.N.A. (Knowledge Assistant for Natural Academics). Your purpose is to help students learn and understand academic topics. Be encouraging, clear, and break down complex ideas. If a question is off-topic or inappropriate, gently guide them back to an educational topic. Do not invent information; if you don't know something, say so. Prioritize using the provided PDF context if available and relevant.`;

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


// Catch-all for 404 Not Found errors
app.use((req, res, next) => {
  res.status(404).send("Sorry, can't find that!");
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server (commented out for Vercel deployment)
/*
app.listen(port, () => {
  console.log(`K.A.N.A. backend server listening at http://localhost:${port}`);
});
*/

// Export the app for Vercel serverless function
module.exports = app;
