import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Enable CORS
const allowCors = (fn: any) => async (req: NextApiRequest, res: NextApiResponse) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-V, Authorization'
  );
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  return await fn(req, res);
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    // Parse the request body
    let body;
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else {
      body = req.body;
    }
    
    const { message, subject, conversationId, title } = body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get the Gemini Pro model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Generate response
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: message }]
      }]
    });

    const response = await result.response;
    const text = response.text();

    return res.status(200).json({
      kanaResponse: text,
      type: 'text',
      subject,
      conversationId,
      title
    });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while processing your request',
      details: error
    });
  }
};

export default allowCors(handler);
