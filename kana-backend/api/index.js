const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const pdf = require('pdf-parse');
// Adjusted path for .env: assumes .env is in kana-backend/ and this file is in kana-backend/api/
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), override: true });

// Log loaded env variables for debugging
console.log('DEBUG: Loaded HUGGING_FACE_MODEL_URL:', process.env.HUGGING_FACE_MODEL_URL);
console.log('DEBUG: Loaded HUGGING_FACE_API_TOKEN:', process.env.HUGGING_FACE_API_TOKEN ? 'Token Loaded' : 'Token NOT Loaded');

const app = express();

// Middleware
app.use(cors()); // Consider restricting origin in production: app.use(cors({ origin: 'https://your-vercel-frontend-url.app' }));
app.use(express.json());

// Simple test route (will be accessible at /api/ if this file is the handler for /api/*)
app.get('/', (req, res) => {
  res.send('K.A.N.A. Backend API is running!');
});

// PDF Proxy Endpoint
// Access via: https://your-vercel-deployment.app/api/kana/pdf-proxy
app.get('/kana/pdf-proxy', async (req, res) => { // Note: Path changed slightly for Vercel routing
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

    res.setHeader('Content-Type', 'application/pdf');
    response.data.pipe(res);

  } catch (error) {
    console.error('Error proxying PDF:', error.message);
    if (error.response) {
      console.error('Proxied URL Error Status:', error.response.status);
      // console.error('Proxied URL Error Data:', error.response.data); // Can be verbose
      return res.status(error.response.status).send('Error fetching PDF from external source.');
    }
    res.status(500).send('Error proxying PDF');
  }
});

// K.A.N.A. Chat API endpoint
// Access via: https://your-vercel-deployment.app/api/kana/chat
app.post('/kana/chat', async (req, res) => { // Note: Path changed slightly for Vercel routing
  const { message, activePdfUrl } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!process.env.HUGGING_FACE_API_TOKEN || !process.env.HUGGING_FACE_MODEL_URL) {
    console.error('Hugging Face API Token or Model URL is not configured.');
    return res.status(500).json({ error: 'AI service not configured' });
  }

  try {
    let systemPrompt = "You are K.A.N.A., the Knowledge Assistant for Natural Academics. Your purpose is to help students learn and understand academic topics. You are friendly, patient, clear, and encouraging. Your primary focus is academic subjects. If the user asks a question clearly outside of academics (e.g., asking for random jokes or personal opinions unrelated to learning), politely state that you're here to help with studies and try to guide them back to an educational topic. Do not invent information; if you don't know something, say so. You are an AI learning buddy.";
    let pdfContext = '';

    if (activePdfUrl) {
      try {
        console.log(`Fetching PDF for Q&A from: ${activePdfUrl}`);
        const pdfResponse = await axios.get(activePdfUrl, { responseType: 'arraybuffer' });
        const pdfData = await pdf(pdfResponse.data);

        const MIN_TEXT_LENGTH = 200;
        const watermarkPattern = /CamScanner/ig;

        if (pdfData.text && pdfData.text.length >= MIN_TEXT_LENGTH && !watermarkPattern.test(pdfData.text.substring(0, MIN_TEXT_LENGTH * 2))) {
          const MAX_PDF_CONTEXT_LENGTH = 10000;
          pdfContext = pdfData.text.substring(0, MAX_PDF_CONTEXT_LENGTH);
          console.log(`Extracted ${pdfContext.length} characters of text from PDF using pdf-parse.`);
        } else {
          pdfContext = '';
          if (!pdfData.text || pdfData.text.length < MIN_TEXT_LENGTH) {
            console.log(`Extracted text is too short (${pdfData.text ? pdfData.text.length : 0} chars). Skipping PDF context.`);
          }
          if (pdfData.text && watermarkPattern.test(pdfData.text.substring(0, MIN_TEXT_LENGTH * 2))) {
            console.log('Extracted text appears to be primarily watermarks. Skipping PDF context.');
          }
        }
      } catch (pdfError) {
        console.error('Error fetching or parsing PDF for Q&A:', pdfError.message);
      }
    }

    let fullPrompt;
    if (pdfContext) {
      fullPrompt = `${systemPrompt}\n\nDocument Context:\n${pdfContext}\n\nUser: ${message}\nK.A.N.A.:`;
    } else {
      fullPrompt = `${systemPrompt}\n\nUser: ${message}\nK.A.N.A.:`;
    }

    // console.log('Full prompt being sent to Hugging Face:', fullPrompt); // Can be very verbose

    const payload = {
      inputs: fullPrompt,
      parameters: {
        return_full_text: false,
        repetition_penalty: 1.2,
        max_new_tokens: 300,
        temperature: 0.6,
      }
    };

    // console.log('Sending to Hugging Face:', payload);

    const hfResponse = await axios.post(
      process.env.HUGGING_FACE_MODEL_URL,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGING_FACE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      }
    );

    let aiResponseText = "Sorry, I couldn't parse the AI response.";
    if (hfResponse.data && Array.isArray(hfResponse.data) && hfResponse.data.length > 0 && hfResponse.data[0].generated_text) {
      aiResponseText = hfResponse.data[0].generated_text;
    } else if (hfResponse.data && hfResponse.data.generated_text) {
      aiResponseText = hfResponse.data.generated_text;
    } else if (typeof hfResponse.data === 'string') { // Or just a string
      aiResponseText = hfResponse.data;
    }
    // console.log('Received from Hugging Face (attempting to parse):', hfResponse.data);
    // console.log('Parsed AI Response Text:', aiResponseText);
    res.json({ kanaResponse: aiResponseText });

  } catch (error) {
    console.error('Error calling Hugging Face API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Raw Error Data from Hugging Face:', error.response.data);
      if (error.response.status === 401) {
        return res.status(500).json({ error: 'AI service authentication failed. Check API token.' });
      } else if (error.response.status === 404) {
        return res.status(500).json({ error: 'AI model not found. Check configuration.' });
      } else if (error.response.status === 503 && error.response.data && typeof error.response.data === 'object' && error.response.data.error && error.response.data.error.includes('is currently loading')) {
        return res.status(503).json({ error: `AI model is currently loading. Estimated time: ${error.response.data.estimated_time || 'a few moments'}. Please try again shortly.` });
      }
      return res.status(500).json({ error: 'Failed to get response from AI service due to server-side error on their end.' });
    } else if (error.request) {
      console.error('Request:', error.request);
      return res.status(500).json({ error: 'No response from AI service.' });
    } else {
      console.error('Error Message:', error.message);
      return res.status(500).json({ error: 'Error setting up AI request.' });
    }
  }
});

// Export the app for Vercel
module.exports = app;
