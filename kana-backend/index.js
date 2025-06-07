const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path'); // Added for explicit .env path
const pdf = require('pdf-parse');
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: true }); // Explicitly set path and override existing vars
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Log loaded env variables for debugging
console.log('DEBUG: Loaded GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'Key Loaded' : 'Key NOT Loaded');

const app = express();

// In-memory cache for PDF text
const pdfCache = {};
// Simple cache eviction strategy: limit cache size
const MAX_CACHE_SIZE = 50; // Store up to 50 PDFs' text
let cacheKeys = []; // To track insertion order for LRU-like eviction
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Google Gemini API details
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
let genAI, geminiModel;
if (GOOGLE_API_KEY) {
  genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest"}); // Trying gemini-1.5-flash-latest
  console.log('DEBUG: Google AI SDK initialized.');
} else {
  console.error('DEBUG: GOOGLE_API_KEY not found. Google AI SDK not initialized.');
}

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
    let systemPrompt = "You are K.A.N.A., the Knowledge Assistant for Natural Academics. Your purpose is to help students learn and understand academic topics. You are friendly, patient, clear, and encouraging. Your primary focus is academic subjects. If the user asks a question clearly outside of academics (e.g., asking for random jokes or personal opinions unrelated to learning), politely state that you're here to help with studies and try to guide them back to an educational topic. Do not invent information; if you don't know something, say so. You are an AI learning buddy.";
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
    console.error('Error calling Google Gemini API:', error);
    // Add more specific error handling for Gemini if needed, e.g., checking error.message or error.code
    // For now, a general error message:
    let errorMessage = 'Failed to get response from AI service.';
    if (error.message && error.message.includes('API key not valid')) {
        errorMessage = 'AI service authentication failed. Check your Google API Key.';
    } else if (error.message && error.message.includes('quota')) {
        errorMessage = 'AI service quota exceeded. Please check your Google Cloud project quotas.';
    }
    // Check for specific error types from the Gemini SDK if available, e.g. error.status or error.details
    // This is a generic catch-all for now.
    res.status(500).json({ error: errorMessage, details: error.message });
  }
});

app.listen(port, () => {
  console.log(`K.A.N.A. backend server listening at http://localhost:${port}`);
});
