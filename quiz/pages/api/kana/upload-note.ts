import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File as FormidableFile } from 'formidable';
import { promises as fs } from 'fs';
import { pdf } from 'pdf-to-text-lib';

// Disable Next.js body parsing
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
    const form = new IncomingForm();
    const formData: any = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const { files } = formData;
    const noteFile = files?.noteFile?.[0] as FormidableFile | undefined;

    if (!noteFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let textContent = '';
    const fileContent = await fs.readFile(noteFile.filepath);
    
    if (noteFile.mimetype?.includes('text/plain')) {
      textContent = fileContent.toString('utf8');
    } else if (noteFile.mimetype === 'application/pdf') {
      textContent = await pdf(fileContent).then(pdf => pdf.text);
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // In a real app, you'd save this to a database
    // For now, we'll just return the extracted text
    return res.status(200).json({
      type: 'success',
      message: 'Note processed successfully',
      content: textContent,
      fileName: noteFile.originalFilename || 'note.txt'
    });
  } catch (error: any) {
    console.error('Error in upload-note API:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while processing the note'
    });
  }
}
