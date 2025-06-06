const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path'); // Added for explicit .env path
const pdf = require('pdf-parse');
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: true }); // Explicitly set path and override existing vars

// Log loaded env variables for debugging
console.log('DEBUG: Loaded HUGGING_FACE_MODEL_URL:', process.env.HUGGING_FACE_MODEL_URL); 
console.log('DEBUG: Loaded HUGGING_FACE_API_TOKEN:', process.env.HUGGING_FACE_API_TOKEN ? 'Token Loaded' : 'Token NOT Loaded');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Hugging Face API details
const HUGGING_FACE_API_TOKEN = process.env.HUGGING_FACE_API_TOKEN; // Still from .env
const HUGGING_FACE_MODEL_URL = process.env.HUGGING_FACE_MODEL_URL;
console.log('DEBUG: Loaded HUGGING_FACE_MODEL_URL:', HUGGING_FACE_MODEL_URL);

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

  if (!HUGGING_FACE_API_TOKEN || !HUGGING_FACE_MODEL_URL) {
    console.error('Hugging Face API Token or Model URL is not configured.');
    return res.status(500).json({ error: 'AI service not configured' });
  }

  try {
    // Construct the payload for Hugging Face API
    // For DialoGPT, the 'inputs' field can directly take the user's text
    // or an object with 'text', 'past_user_inputs', 'generated_responses'.
    // We'll start simple and can enhance with history later.
    let systemPrompt = "You are K.A.N.A., the Knowledge Assistant for Natural Academics. Your purpose is to help students learn and understand academic topics. You are friendly, patient, clear, and encouraging. Your primary focus is academic subjects. If the user asks a question clearly outside of academics (e.g., asking for random jokes or personal opinions unrelated to learning), politely state that you're here to help with studies and try to guide them back to an educational topic. Do not invent information; if you don't know something, say so. You are an AI learning buddy.";
    let pdfContext = '';

    if (activePdfUrl) {
      try {
        console.log(`Fetching PDF for Q&A from: ${activePdfUrl}`);
        const pdfResponse = await axios.get(activePdfUrl, { responseType: 'arraybuffer' });
        const pdfData = await pdf(pdfResponse.data);

        const MIN_TEXT_LENGTH = 200; // Minimum characters to be considered useful content
        const watermarkPattern = /CamScanner/ig; // Basic watermark check

        if (pdfData.text && pdfData.text.length >= MIN_TEXT_LENGTH && !watermarkPattern.test(pdfData.text.substring(0, MIN_TEXT_LENGTH * 2))) {
          const MAX_PDF_CONTEXT_LENGTH = 10000; // Reset to a reasonable length for pdf-parse
          pdfContext = pdfData.text.substring(0, MAX_PDF_CONTEXT_LENGTH);
          console.log(`Extracted ${pdfContext.length} characters of text from PDF using pdf-parse.`);
        } else {
          pdfContext = ''; // Set to empty if text is too short or likely just watermarks
          if (!pdfData.text || pdfData.text.length < MIN_TEXT_LENGTH) {
            console.log(`Extracted text is too short (${pdfData.text ? pdfData.text.length : 0} chars). Skipping PDF context.`);
          }
          if (pdfData.text && watermarkPattern.test(pdfData.text.substring(0, MIN_TEXT_LENGTH * 2))) {
            console.log('Extracted text appears to be primarily watermarks. Skipping PDF context.');
          }
        }
      } catch (pdfError) {
        console.error('Error fetching or parsing PDF for Q&A:', pdfError.message);
        // Optionally, inform the user that the PDF couldn't be processed for Q&A
        // For now, we'll just proceed without PDF context if it fails.
      }
    }

    let fullPrompt;
    if (pdfContext) {
      fullPrompt = `${systemPrompt}\n\nDocument Context:\n${pdfContext}\n\nUser: ${message}\nK.A.N.A.:`;
    } else {
      fullPrompt = `${systemPrompt}\n\nUser: ${message}\nK.A.N.A.:`;
    }

    console.log('Full prompt being sent to Hugging Face:', fullPrompt);

    const payload = {
      inputs: fullPrompt, // Use the full prompt with persona and user message
      parameters: {
        return_full_text: false, // IMPORTANT: Keep this false, as we only want the text generated after 'K.A.N.A.:'
        repetition_penalty: 1.2,
        max_new_tokens: 300, // Further increased for more complete responses
        temperature: 0.6, // Lowered for more focused and less random responses
      }
    };

    console.log('Sending to Hugging Face:', payload);

    const hfResponse = await axios.post(
      HUGGING_FACE_MODEL_URL,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${HUGGING_FACE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json' // Added to request more detailed errors
        },
      }
    );

    // The response structure for many conversational models (like DialoGPT, GPT-2) 
    // when not using return_full_text:false (or when it's not supported and returns full by default)
    // is typically an array with one object containing `generated_text`.
    // Or, if parameters like `return_full_text: false` are used and respected, it might be directly the text.
    // We will try to cater to the common { generated_text: "..." } structure within an array.
    let aiResponseText = "Sorry, I couldn't parse the AI response.";
    if (hfResponse.data && Array.isArray(hfResponse.data) && hfResponse.data.length > 0 && hfResponse.data[0].generated_text) {
      aiResponseText = hfResponse.data[0].generated_text;
    } else if (hfResponse.data && hfResponse.data.generated_text) { // Some models might return it directly
      aiResponseText = hfResponse.data.generated_text;
    } else if (typeof hfResponse.data === 'string') { // Or just a string
      aiResponseText = hfResponse.data;
    }
    console.log('Received from Hugging Face (attempting to parse):', hfResponse.data);
    console.log('Parsed AI Response Text:', aiResponseText);
    res.json({ kanaResponse: aiResponseText });

  } catch (error) {
    console.error('Error calling Hugging Face API:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      // console.error('Headers:', error.response.headers); // Can be verbose
      console.error('Raw Error Data from Hugging Face:', error.response.data);

      // Attempt to provide more specific guidance based on common issues
      if (error.response.status === 401) {
        console.error("Authentication Error (401): Please check your HUGGING_FACE_API_TOKEN in the .env file. Ensure it's correct and has inference permissions.");
        return res.status(500).json({ error: 'AI service authentication failed. Check API token.' });
      } else if (error.response.status === 404) {
        console.error("Not Found Error (404): The model URL might be incorrect or the model isn't available. Current URL:", HUGGING_FACE_MODEL_URL);
        return res.status(500).json({ error: 'AI model not found. Check configuration.' });
      } else if (error.response.status === 503 && error.response.data && typeof error.response.data === 'object' && error.response.data.error && error.response.data.error.includes('is currently loading')) {
        console.error("Model Loading Error (503): The AI model is currently loading on Hugging Face's side.");
        return res.status(503).json({ error: `AI model is currently loading. Estimated time: ${error.response.data.estimated_time || 'a few moments'}. Please try again shortly.` });
      }
      // General error for other statuses
      return res.status(500).json({ error: 'Failed to get response from AI service due to server-side error on their end.' });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Request:', error.request);
      return res.status(500).json({ error: 'No response from AI service.' });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error Message:', error.message);
      return res.status(500).json({ error: 'Error setting up AI request.' });
    }
  }
});

app.listen(port, () => {
  console.log(`K.A.N.A. backend server listening at http://localhost:${port}`);
});
