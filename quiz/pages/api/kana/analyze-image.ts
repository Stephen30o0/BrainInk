import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IncomingForm, File as FormidableFile } from 'formidable';
import { promises as fs } from 'fs';
import { promisify } from 'util';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Disable Next.js body parsing, we'll handle it with formidable
// This is a Next.js specific configuration
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
      // In a real app, you'd upload this to a CDN and return the URL
      // For now, we'll just return the base64 data URL
      imageUrl: `data:${mimeType};base64,${base64Image}`,
    });
  } catch (error: any) {
    console.error('Error in analyze-image API:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while processing the image'
    });
  }
}
