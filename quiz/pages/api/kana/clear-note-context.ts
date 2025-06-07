import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // In a real app, you'd clear the note context from your database
    // For now, we'll just return success
    return res.status(200).json({
      success: true,
      message: 'Note context cleared'
    });
  } catch (error: any) {
    console.error('Error in clear-note-context API:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while clearing note context'
    });
  }
}
