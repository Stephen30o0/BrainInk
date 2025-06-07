import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IncomingForm, File as FormidableFile } from 'formidable';
import { promises as fs } from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

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
    const imageFile = files?.imageFile?.[0] as FormidableFile | undefined;
    const message = fields.message?.[0] || '';
    const subject = fields.subject?.[0] || 'General';
    const conversationId = fields.conversationId?.[0] || '';
    const title = fields.title?.[0] || '';
    const activePdfUrl = fields.activePdfUrl?.[0];
    const uploadedNoteName = fields.uploadedNoteName?.[0];

    if (!imageFile) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Get the vision model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    // Read the image file
    const imageData = await fs.readFile(imageFile.filepath);
    const base64Image = imageData.toString('base64');
    const mimeType = imageFile.mimetype || 'image/jpeg';

    // Generate content with the image
    const result = await model.generateContent([
      message || 'Analyze this image',
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    return res.status(200).json({
      kanaResponse: text,
      type: 'image_with_explanation',
      explanation: text,
      imageUrl: `data:${mimeType};base64,${base64Image}`,
      subject,
      conversationId,
      title,
      activePdfUrl,
      uploadedNoteName
    });
  } catch (error: any) {
    console.error('Error in analyze-image API:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while processing the image',
      details: error
    });
  }
};

export default allowCors(handler);
