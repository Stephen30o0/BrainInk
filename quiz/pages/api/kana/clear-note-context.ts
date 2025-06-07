import type { NextApiRequest, NextApiResponse } from 'next';

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
    
    const { subject, conversationId, title } = body;

    // In a real app, you'd clear the note context from your database or state management
    // For now, we'll just return a success response
    
    return res.status(200).json({
      success: true,
      message: 'Note context cleared successfully',
      subject,
      conversationId,
      title
    });
  } catch (error: any) {
    console.error('Error in clear-note-context API:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while clearing note context',
      details: error
    });
  }
};

export default allowCors(handler);
