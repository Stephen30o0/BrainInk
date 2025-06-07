import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File as FormidableFile } from 'formidable';
import { promises as fs } from 'fs';
import * as pdf from 'pdf-parse';

// Disable Next.js body parsing, we'll handle it with formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

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
    // Parse the form data
    const form = new IncomingForm();
    const formData: any = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const { fields, files } = formData;
    const noteFile = files?.noteFile?.[0] as FormidableFile | undefined;
    const subject = fields.subject?.[0] || 'General';
    const conversationId = fields.conversationId?.[0] || '';
    const title = fields.title?.[0] || '';

    if (!noteFile) {
      return res.status(400).json({ error: 'Note file is required' });
    }

    let content = '';
    
    // Check file type and extract text accordingly
    if (noteFile.mimetype === 'application/pdf') {
      // Extract text from PDF using pdf-parse
      const pdfBuffer = await fs.readFile(noteFile.filepath);
      const pdfData = await pdf(pdfBuffer);
      content = pdfData.text;
    } else {
      // Read text file
      content = await fs.readFile(noteFile.filepath, 'utf-8');
    }

    return res.status(200).json({
      success: true,
      content,
      filename: noteFile.originalFilename || 'note.txt',
      fileType: noteFile.mimetype || 'text/plain',
      subject,
      conversationId,
      title
    });
  } catch (error: any) {
    console.error('Error in upload-note API:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while processing the note',
      details: error
    });
  }
};

export default allowCors(handler);
