const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const SyllabusProcessor = require('../services/syllabusProcessor');

const router = express.Router();
const syllabusProcessor = new SyllabusProcessor();

// Configure multer for textbook uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'textbooks');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

/**
 * Process textbook and generate syllabus
 * POST /api/kana/process-syllabus-textbook
 */
router.post('/process-syllabus-textbook', upload.single('textbook'), async (req, res) => {
  try {
    console.log('Received syllabus textbook processing request');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No textbook file uploaded'
      });
    }
    
    const { syllabus_id, term_length_weeks, subject_name } = req.body;
    
    if (!syllabus_id || !term_length_weeks || !subject_name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: syllabus_id, term_length_weeks, subject_name'
      });
    }

    console.log(`Processing textbook for syllabus ${syllabus_id}, ${term_length_weeks} weeks, subject: ${subject_name}`);
    
    // Process the textbook
    const result = await syllabusProcessor.processTextbook(
      req.file.path,
      parseInt(syllabus_id),
      parseInt(term_length_weeks),
      subject_name,
      req.body.additional_preferences ? JSON.parse(req.body.additional_preferences) : {}
    );
    
    // Clean up uploaded file after processing
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.error('Failed to clean up uploaded file:', cleanupError);
    }
    
    if (result.success) {
      console.log(`Successfully processed textbook for syllabus ${syllabus_id}`);
      res.json({
        success: true,
        message: 'Textbook processed successfully',
        analysis_data: result.analysis_data,
        weekly_plans: result.weekly_plans
      });
    } else {
      console.error(`Failed to process textbook for syllabus ${syllabus_id}:`, result.error);
      res.status(500).json({
        success: false,
        message: 'Failed to process textbook',
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Syllabus processing error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to clean up uploaded file after error:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during textbook processing',
      error: error.message
    });
  }
});

/**
 * Generate quiz for a specific week
 * POST /api/kana/generate-weekly-quiz
 */
router.post('/generate-weekly-quiz', async (req, res) => {
  try {
    const { week_plan, difficulty = 'medium' } = req.body;
    
    if (!week_plan) {
      return res.status(400).json({
        success: false,
        message: 'Week plan data is required'
      });
    }
    
    console.log(`Generating quiz for week ${week_plan.week_number}: ${week_plan.title}`);
    
    const quiz = await syllabusProcessor.generateWeeklyQuiz(week_plan, difficulty);
    
    if (quiz) {
      res.json({
        success: true,
        message: 'Quiz generated successfully',
        quiz: quiz
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to generate quiz'
      });
    }
    
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during quiz generation',
      error: error.message
    });
  }
});

/**
 * Enhance existing weekly plan with more details
 * POST /api/kana/enhance-weekly-plan
 */
router.post('/enhance-weekly-plan', async (req, res) => {
  try {
    const { week_plan, textbook_context, subject_name } = req.body;
    
    if (!week_plan || !subject_name) {
      return res.status(400).json({
        success: false,
        message: 'Week plan and subject name are required'
      });
    }
    
    console.log(`Enhancing weekly plan for week ${week_plan.week_number}`);
    
    const enhancedPlan = await syllabusProcessor.enhanceWeeklyPlan(
      week_plan,
      textbook_context || '',
      subject_name
    );
    
    res.json({
      success: true,
      message: 'Weekly plan enhanced successfully',
      enhanced_plan: enhancedPlan
    });
    
  } catch (error) {
    console.error('Weekly plan enhancement error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during weekly plan enhancement',
      error: error.message
    });
  }
});

/**
 * Analyze textbook content without full processing
 * POST /api/kana/analyze-textbook
 */
router.post('/analyze-textbook', upload.single('textbook'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No textbook file uploaded'
      });
    }
    
    const { subject_name, term_length_weeks } = req.body;
    
    if (!subject_name || !term_length_weeks) {
      return res.status(400).json({
        success: false,
        message: 'Subject name and term length are required'
      });
    }
    
    console.log(`Analyzing textbook for ${subject_name}, ${term_length_weeks} weeks`);
    
    // Extract text from PDF
    const buffer = fs.readFileSync(req.file.path);
    const textContent = await syllabusProcessor.extractTextFromPDF(buffer);
    
    // Analyze textbook structure
    const analysis = await syllabusProcessor.analyzeTextbook(
      textContent,
      parseInt(term_length_weeks),
      subject_name
    );
    
    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.error('Failed to clean up uploaded file:', cleanupError);
    }
    
    res.json({
      success: true,
      message: 'Textbook analyzed successfully',
      analysis: analysis,
      textbook_info: {
        size: buffer.length,
        text_length: textContent.length,
        estimated_pages: Math.ceil(textContent.length / 2000) // Rough estimate
      }
    });
    
  } catch (error) {
    console.error('Textbook analysis error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to clean up uploaded file after error:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during textbook analysis',
      error: error.message
    });
  }
});

/**
 * Health check for syllabus service
 * GET /api/kana/syllabus/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Syllabus service is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
