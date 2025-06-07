import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, subject, conversationId, title } = req.body;
    
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
      type: 'text'
    });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while processing your request'
    });
  }
}
