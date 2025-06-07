import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    // Forward the appropriate headers
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/pdf');
    res.setHeader('Content-Length', response.headers.get('content-length') || '0');
    
    // Stream the PDF data
    const data = await response.buffer();
    return res.send(data);
  } catch (error: any) {
    console.error('Error in PDF proxy:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while fetching the PDF'
    });
  }
}
