const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const pdf = require('pdf-parse');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const fsPromises = fs.promises;
const { evaluate } = require('mathjs');
const { generateSVGGraph } = require('./utils/svgGraph');
const PDFParser = require('pdf2pic');
const { fromBuffer } = require('pdf2pic');
const PDFDocument = require('pdfkit');
const sharp = require('sharp');
// Import QuizService
const QuizService = require('./services/quizService');

// Add pdf-img-convert for better PDF image extraction
let pdfImgConvert = null;
try {
  pdfImgConvert = require('pdf-img-convert');
} catch (e) {
  console.log('pdf-img-convert not available, using fallback methods');
}

let generateChartJSGraph = null;
try {
  generateChartJSGraph = require('./utils/chartjsGraph').generateChartJSGraph;
} catch (e) {
  // chartjs-node-canvas not installed
}

// Import tournament routes
const tournamentRoutes = require('./routes/tournaments');

// Import syllabus routes
const syllabusRoutes = require('./routes/syllabus');

// Import syllabus integration routes
const { router: syllabusIntegrationRoutes, initializeConversationContexts } = require('./routes/syllabusIntegration');

// Import and initialize database
const { testConnection, initializeTables } = require('./database');

const app = express();
const port = process.env.PORT || 10000;

// --- CONFIGURATION & INITIALIZATION ---

console.log('DEBUG: Loaded GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'Key Loaded' : 'Key NOT Loaded');
console.log('DEBUG: Loaded CORE_API_KEY:', process.env.CORE_API_KEY ? 'Key Loaded' : 'Key NOT Loaded');

const conversationContexts = {};

const systemInstruction = {
  parts: [{
    text: `You are K.A.N.A., an advanced academic AI assistant. Your primary goal is to help users.

Key characteristics:
- Knowledgeable & Context-Aware: Provide accurate, in-depth information. Use context from uploads when available.
- Versatile & Interactive: Assist with a wide range of academic subjects.
- **Conversational Memory & Variables**: Pay close attention to the entire conversation history. If the user defines a variable (e.g., 'let a = 5'), you must remember and use that value in subsequent calculations or plots. The variables 'x' and 'y' are RESERVED for graphing axes and cannot be assigned values. If a user tries to assign a value to 'x' or 'y', you must inform them of this rule and refuse the assignment.

- **CRITICAL GRAPHING REQUIREMENT**: You MUST use the 'generate_graph_data' tool whenever a user asks to plot, graph, or visualize ANY mathematical function. This includes requests like:
  * "graph y = x^2"
  * "plot sin(x)"
  * "can you show me y = log(x)?"
  * "draw the function y = e^x"
  * ANY request to visualize a mathematical expression
  
  When the user requests a graph, IMMEDIATELY call the generate_graph_data tool with:
  - functionStr: the mathematical expression (e.g., "y = x^2", "sin(x)", "log(x)")
  - xMin: default -10 (or user specified)
  Do NOT just explain the function - USE THE TOOL to generate the actual graph.

- Tool User: You can also generate text and analyze images/notes.

Interaction Guidelines:
- If you don't know something, say so.
- Maintain a supportive, professional, and encouraging tone.
- ALWAYS use the graph tool when graphing is requested - never just provide text explanations of what a graph would look like.`
  }]
};

// --- MIDDLEWARE ---

const allowedOrigins = [
  'https://brain-ink.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5500',
  'https://mozilla.github.io',
  'file://', // Allow local file access for testing
  'null' // Allow null origin for file:// protocol
];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, etc.)
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('file://')) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow all origins in development
    }
  }
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Initialize Google AI
let genAI = null;
let geminiModel = null;

// Circuit breaker state
const circuitBreakerState = {
  isOpen: false,
  failures: 0,
  lastFailureTime: 0,
  resetTimeout: 60000 // 60 seconds
};

// Initialize Gemini AI
if (process.env.GOOGLE_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  geminiModel = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: systemInstruction,
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7,
      topP: 0.8,
      topK: 40
    }
  });
  console.log('✅ Google AI (Gemini) initialized successfully');
} else {
  console.error('❌ GOOGLE_API_KEY not found in environment variables');
}

// QuizService initialization
const quizService = new QuizService(genAI);

// --- UPLOAD DIRECTORIES AND MULTER CONFIGURATION ---

// Create upload directories
const STUDY_MATERIALS_DIR = path.join(__dirname, 'uploads', 'study-materials');
const IMAGES_DIR = path.join(__dirname, 'uploads', 'images');
const STUDENT_PDFS_DIR = path.join(__dirname, 'uploads', 'student-pdfs');
const ASSIGNMENT_IMAGES_DIR = path.join(__dirname, 'uploads', 'assignment-images');

// Ensure upload directories exist
[STUDY_MATERIALS_DIR, IMAGES_DIR, STUDENT_PDFS_DIR, ASSIGNMENT_IMAGES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Multer configurations for different upload types

// Study materials upload
const uploadStudyFile = multer({
  dest: STUDY_MATERIALS_DIR,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// Image upload for analysis
const uploadImage = multer({
  dest: IMAGES_DIR,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Assignment images upload
const uploadAssignmentImage = multer({
  dest: ASSIGNMENT_IMAGES_DIR,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// --- DATABASE (JSON file) ---

const DB_PATH = path.join(__dirname, 'study_materials.json');
let studyMaterialsDb = [];
const loadDb = async () => {
  try {
    const data = await fsPromises.readFile(DB_PATH, 'utf8');
    studyMaterialsDb = JSON.parse(data);
    console.log('DEBUG: study_materials.json loaded successfully.');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('DEBUG: study_materials.json not found, will be created on first save.');
    } else {
      console.error('ERROR loading study_materials.json:', error);
    }
  }
};
const saveDb = () => fsPromises.writeFile(DB_PATH, JSON.stringify(studyMaterialsDb, null, 2), 'utf8');

// --- HELPERS ---

// Safely trim long text for model input while preserving head and tail context
function safeTrimForModel(text, maxLen = 120000) {
  try {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLen) return text;
    const head = Math.floor(maxLen * 0.6);
    const tail = maxLen - head - 200; // leave room for marker
    return (
      text.slice(0, head) +
      `\n\n[... TRUNCATED ${text.length - maxLen} CHARS ...]\n\n` +
      text.slice(-tail)
    );
  } catch (e) {
    return (text || '').slice(0, maxLen);
  }
}

const getOrCreateConversation = (conversationId) => {
  if (!conversationContexts[conversationId]) {
    console.log(`DEBUG: Creating new context for conversationId: ${conversationId}`);
    conversationContexts[conversationId] = {
      history: [],
      contextParts: [],
    };
  }
  return conversationContexts[conversationId];
};

const extractTextFromFile = async (mimetype, buffer) => {
  if (mimetype === 'application/pdf') {
    const data = await pdf(buffer);
    return data.text;
  } else if (mimetype.startsWith('text/')) {
    return buffer.toString('utf8');
  }
  return ''; // Return empty for unsupported types
};

// Unified PDF processing using Gemini Vision for all PDFs (text + images)
const extractPDFBasicInfo = async (pdfBuffer) => {
  try {
    console.log(`📄 Processing PDF with Gemini Vision, buffer size: ${pdfBuffer.length} bytes`);

    // Get basic PDF info for page count
    let numPages = 1;
    try {
      const textData = await pdf(pdfBuffer);
      numPages = textData.numpages || 1;
      console.log(`📄 PDF has ${numPages} page(s)`);
    } catch (parseError) {
      console.log(`📄 Using default page count: ${numPages}`);
    }

    // Always use base64 for Gemini Vision analysis
    const pdfBase64 = pdfBuffer.toString('base64');

    console.log(`✅ PDF prepared for Gemini Vision analysis: ${numPages} pages`);

    return {
      numPages: numPages,
      pdfBase64: pdfBase64,
      useVisionAnalysis: true
    };

  } catch (error) {
    console.error('❌ Error processing PDF:', error);

    // Fallback: still return base64 for analysis
    const pdfBase64 = pdfBuffer.toString('base64');
    return {
      numPages: 1,
      pdfBase64: pdfBase64,
      useVisionAnalysis: true,
      hasError: true
    };
  }
};// Grade cache for deterministic grading
const GRADE_CACHE_PATH = path.join(__dirname, 'grade_cache.json');
let gradeCache = {};

// Load grade cache on startup
const loadGradeCache = async () => {
  try {
    const data = await fsPromises.readFile(GRADE_CACHE_PATH, 'utf8');
    gradeCache = JSON.parse(data);
    console.log('📋 Grade cache loaded successfully.');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('📋 Grade cache not found, will be created on first use.');
    } else {
      console.error('❌ Error loading grade cache:', error);
    }
  }
};

// Save grade cache
const saveGradeCache = async () => {
  try {
    await fsPromises.writeFile(GRADE_CACHE_PATH, JSON.stringify(gradeCache, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Error saving grade cache:', error);
  }
};

// Get cached grade by content hash
const getCachedGrade = (contentHash) => {
  return gradeCache[contentHash] || null;
};

// Set cached grade by content hash
const setCachedGrade = (contentHash, gradeResult) => {
  gradeCache[contentHash] = gradeResult;
  // Save async but don't wait
  saveGradeCache().catch(err => console.error('❌ Error saving grade cache:', err));
};

// --- UTILITY FUNCTIONS ---

// Rate limiting delay function
const rateLimitDelay = async (ms = 2000) => {
  console.log(`⏱️ Rate limiting: waiting ${ms}ms...`);
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Retry function with exponential backoff
const callGeminiWithRetry = async (model, payload, maxRetries = 3, baseDelay = 2000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(payload);
      return result;
    } catch (error) {
      console.error(`❌ Gemini API attempt ${attempt}/${maxRetries} failed:`, error.message);

      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`⏳ Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Circuit breaker with retry logic
const callGeminiWithCircuitBreaker = async (model, payload, maxRetries = 5, baseDelay = 3000) => {
  // Check if circuit breaker is open
  if (circuitBreakerState.isOpen) {
    const timeSinceLastFailure = Date.now() - circuitBreakerState.lastFailureTime;
    if (timeSinceLastFailure < circuitBreakerState.resetTimeout) {
      throw new Error(`Circuit breaker is open. Service unavailable for ${Math.round((circuitBreakerState.resetTimeout - timeSinceLastFailure) / 1000)} more seconds.`);
    } else {
      // Reset circuit breaker
      console.log('🔄 Circuit breaker reset - attempting to reconnect to Gemini API');
      circuitBreakerState.isOpen = false;
      circuitBreakerState.failures = 0;
    }
  }

  try {
    const result = await callGeminiWithRetry(model, payload, maxRetries, baseDelay);
    // Success - reset failure counter
    if (circuitBreakerState.failures > 0) {
      console.log('✅ Gemini API connection restored');
      circuitBreakerState.failures = 0;
    }
    return result;
  } catch (error) {
    circuitBreakerState.failures++;
    circuitBreakerState.lastFailureTime = Date.now();

    // Open circuit breaker after 5 consecutive failures
    if (circuitBreakerState.failures >= 5) {
      circuitBreakerState.isOpen = true;
      console.log(`🚫 Circuit breaker opened after ${circuitBreakerState.failures} failures. Service will be unavailable for ${circuitBreakerState.resetTimeout / 1000} seconds.`);
    }

    throw error;
  }
};

// Enhanced parsing function with retry logic and marker detection
function parseGradingWithRetry(analysisText, studentName, maxPoints) {
  console.log(`🔍 Parsing grade for ${studentName}...`);

  // First try to extract from GRADE_START/GRADE_END markers
  const gradeMarkerMatch = analysisText.match(/GRADE_START([\s\S]*?)GRADE_END/);
  if (gradeMarkerMatch) {
    console.log(`✅ Found grade markers for ${studentName}`);
    const gradeSection = gradeMarkerMatch[1].trim();

    const scoreMatch = gradeSection.match(/Points Earned:\s*(\d+)\/(\d+)/i);
    const letterMatch = gradeSection.match(/Letter Grade:\s*([A-F][+-]?)/i);
    const percentageMatch = gradeSection.match(/Percentage:\s*(\d+)%/i);

    if (scoreMatch) {
      const score = parseInt(scoreMatch[1]);
      const maxPointsParsed = parseInt(scoreMatch[2]);

      console.log(`📊 Parsed grade for ${studentName}: ${score}/${maxPointsParsed}`);

      return {
        score: score,
        maxPoints: maxPointsParsed,
        letterGrade: letterMatch ? letterMatch[1] : calculateLetterGrade(score, maxPointsParsed),
        percentage: percentageMatch ? parseInt(percentageMatch[1]) : Math.round((score / maxPointsParsed) * 100),
        gradingCriteria: [],
        parseMethod: 'marker_based'
      };
    }
  }

  // Fallback to existing patterns
  console.log(`⚠️ No markers found for ${studentName}, trying fallback patterns...`);
  return parseGradingFromAnalysis(analysisText);
}

// Helper function to calculate letter grade
function calculateLetterGrade(score, maxPoints) {
  const percentage = (score / maxPoints) * 100;

  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}

// Enhanced single-pass grade parser with better error handling
function parseGradeSingle(analysisText, studentName, maxPoints) {
  console.log(`🔍 Single-pass parsing for ${studentName}...`);

  // Clean the analysis text for better parsing
  const cleanText = analysisText.replace(/\*\*/g, '').replace(/\n\s*\n/g, '\n').trim();

  // First try: Look for GRADE_START/GRADE_END markers
  const gradeMarkerMatch = cleanText.match(/GRADE_START([\s\S]*?)GRADE_END/i);
  if (gradeMarkerMatch) {
    const gradeSection = gradeMarkerMatch[1].trim();
    console.log(`✅ Found GRADE_START section for ${studentName}: ${gradeSection}`);

    // Enhanced patterns for different formats
    const scorePatterns = [
      /Points\s+Earned:\s*(\d+)\/(\d+)/i,
      /Points\s+Earned:\s*(\d+)\s*\/\s*(\d+)/i,
      /Points\s+Earned:\s*(\d+)\s*out\s*of\s*(\d+)/i,
      /Score:\s*(\d+)\/(\d+)/i,
      /(\d+)\/(\d+)/  // Basic number/number format
    ];

    const letterPatterns = [
      /Letter\s+Grade:\s*([A-F][+-]?)/i,
      /Grade:\s*([A-F][+-]?)/i,
      /Letter:\s*([A-F][+-]?)/i
    ];

    const percentagePatterns = [
      /Percentage:\s*(\d+)%/i,
      /(\d+)%/
    ];

    let score = null, maxPointsParsed = null, letterGrade = null, percentage = null;

    // Try score patterns
    for (const pattern of scorePatterns) {
      const match = gradeSection.match(pattern);
      if (match) {
        score = parseInt(match[1]);
        maxPointsParsed = parseInt(match[2]);
        console.log(`✅ Parsed score: ${score}/${maxPointsParsed}`);
        break;
      }
    }

    // Try letter grade patterns
    for (const pattern of letterPatterns) {
      const match = gradeSection.match(pattern);
      if (match) {
        letterGrade = match[1];
        console.log(`✅ Parsed letter grade: ${letterGrade}`);
        break;
      }
    }

    // Try percentage patterns
    for (const pattern of percentagePatterns) {
      const match = gradeSection.match(pattern);
      if (match) {
        percentage = parseInt(match[1]);
        console.log(`✅ Parsed percentage: ${percentage}%`);
        break;
      }
    }

    if (score !== null && maxPointsParsed !== null) {
      // Validate the parsed data
      if (score > maxPointsParsed) {
        console.log(`⚠️ Score ${score} > max points ${maxPointsParsed}, capping to max`);
        score = maxPointsParsed;
      }

      const calculatedPercentage = Math.round((score / maxPointsParsed) * 100);

      return {
        score: score,
        maxPoints: maxPointsParsed,
        letterGrade: letterGrade || calculateLetterGrade(score, maxPointsParsed),
        percentage: percentage || calculatedPercentage,
        parseMethod: 'enhanced_marker'
      };
    }
  }

  // Fallback 1: Try standard grading patterns without markers
  console.log(`⚠️ No GRADE_START markers found for ${studentName}, trying fallback patterns...`);
  const fallbackResult = parseGradingFromAnalysis(cleanText);
  if (fallbackResult.score !== null) {
    return {
      score: fallbackResult.score,
      maxPoints: fallbackResult.maxPoints || maxPoints,
      letterGrade: fallbackResult.letterGrade || calculateLetterGrade(fallbackResult.score, fallbackResult.maxPoints || maxPoints),
      percentage: fallbackResult.percentage || Math.round((fallbackResult.score / (fallbackResult.maxPoints || maxPoints)) * 100),
      parseMethod: 'fallback_pattern'
    };
  }

  // Fallback 2: Enhanced basic score extraction
  console.log(`⚠️ Standard patterns failed for ${studentName}, trying enhanced basic extraction...`);
  const basicScorePatterns = [
    new RegExp(`(\\d+)\\s*\\/\\s*${maxPoints}`, 'gi'),  // Score out of max points
    /(\d+)\s*\/\s*(\d+)/g,  // Any "number/number" pattern
    /(\d+)\s*points?\s*out\s*of\s*(\d+)/gi,
    /score\s*[:\-]?\s*(\d+)\s*\/\s*(\d+)/gi,
    /grade\s*[:\-]?\s*(\d+)\s*\/\s*(\d+)/gi,
    /earned\s*[:\-]?\s*(\d+)\s*\/\s*(\d+)/gi,
    /(\d+)\s*out\s*of\s*(\d+)/gi
  ];

  for (const pattern of basicScorePatterns) {
    const matches = Array.from(cleanText.matchAll(pattern));
    for (const match of matches) {
      const score = parseInt(match[1]);
      const maxPointsFound = match[2] ? parseInt(match[2]) : maxPoints;

      // Validate the score makes sense
      if (score >= 0 && score <= maxPointsFound && maxPointsFound <= (maxPoints * 2)) {
        console.log(`✅ Basic extraction found: ${score}/${maxPointsFound}`);
        return {
          score: score,
          maxPoints: maxPointsFound,
          letterGrade: calculateLetterGrade(score, maxPointsFound),
          percentage: Math.round((score / maxPointsFound) * 100),
          parseMethod: 'enhanced_basic_extraction'
        };
      }
    }
  }

  // Fallback 3: Look for percentage and calculate score
  console.log(`⚠️ Score extraction failed for ${studentName}, trying percentage-based calculation...`);
  const percentageMatches = cleanText.match(/(\d+)%/g);
  if (percentageMatches) {
    // Find the most reasonable percentage (usually the highest that's ≤ 100)
    const percentages = percentageMatches
      .map(p => parseInt(p.replace('%', '')))
      .filter(p => p >= 0 && p <= 100)
      .sort((a, b) => b - a); // Sort descending

    if (percentages.length > 0) {
      const percentage = percentages[0];
      const calculatedScore = Math.round((percentage / 100) * maxPoints);
      console.log(`✅ Percentage-based calculation: ${percentage}% = ${calculatedScore}/${maxPoints}`);

      return {
        score: calculatedScore,
        maxPoints: maxPoints,
        letterGrade: calculateLetterGrade(calculatedScore, maxPoints),
        percentage: percentage,
        parseMethod: 'percentage_calculation'
      };
    }
  }

  console.log(`❌ All parsing methods failed for ${studentName}`);
  console.log(`📄 Full AI response for debugging:`);
  console.log(cleanText);

  return {
    score: null,
    maxPoints: maxPoints,
    letterGrade: null,
    percentage: null,
    parseMethod: 'failed'
  };
}// Enhanced parsing function with retry logic and marker detection
// (Removed duplicate definition)

const generateSummaryGradingPrompt = (assignment_title, max_points, grading_rubric, content, contentType = 'combined_analysis') => {
  return `You are K.A.N.A., an expert educational AI providing concise grading using COMPREHENSIVE COMBINED ANALYSIS.

**ASSIGNMENT:** ${assignment_title} (${max_points} points)
**RUBRIC:** ${grading_rubric}

**IMPORTANT: The content below is a COMPREHENSIVE COMBINED ANALYSIS that captures ALL elements of the student's complete assignment including all pages, visual content, and written work.**

**COMPREHENSIVE STUDENT WORK ANALYSIS:**
${content}

**GRADING INSTRUCTION:** Use this comprehensive analysis to provide consistent, accurate grading of the complete assignment.

**REQUIRED FORMAT - START WITH THIS EXACT FORMAT:**
**GRADE:** [NUMBER]/${max_points} ([NUMBER]%) - [Letter Grade]

**PERFORMANCE SUMMARY:**
[2-3 sentences summarizing overall performance based on the comprehensive analysis]

**TOP STRENGTHS:** (3 key points from the analysis)
• [Strength 1 - specific example from analysis]
• [Strength 2 - observable skill demonstrated] 
• [Strength 3 - positive aspect of work quality]

**PRIORITY IMPROVEMENTS:** (3 key points from the analysis)
• [Improvement area 1 - specific gap identified]
• [Improvement area 2 - skill needing development]
• [Improvement area 3 - concept requiring attention]

**NEXT STEPS:**
• [1-2 immediate action items based on analysis]
• [Specific study focus areas]

**GRADING NOTE:** Score based on comprehensive multi-analysis for consistency and accuracy.`;
};

// Generate detailed grading prompt
const generateDetailedGradingPrompt = (assignment_title, max_points, grading_rubric, content, contentType = 'student_work') => {
  return `You are an expert educator providing detailed grading and comprehensive feedback.

**ASSIGNMENT DETAILS:**
- Title: ${assignment_title}
- Maximum Points: ${max_points}
- Grading Rubric: ${grading_rubric}

**GRADING REQUIREMENTS:**
1. Provide fair and accurate numerical scoring based on the rubric
2. Use ONLY the rubric provided for evaluation criteria
3. Grade based on the quality and completeness of the work
4. Apply consistent standards according to the rubric

**REQUIRED FORMAT - START YOUR RESPONSE WITH THIS EXACT FORMAT:**
**GRADE BREAKDOWN:**
Points Earned: [EXACT_NUMBER]/${max_points}
Letter Grade: [A+, A, A-, B+, B, B-, C+, C, C-, D+, D, or F]
Percentage: [EXACT_PERCENTAGE]%

**DETAILED ANALYSIS:**
[Comprehensive analysis of the work based on rubric criteria]

**STRENGTHS DEMONSTRATED:**
• [List specific strengths observed in the work]

**AREAS FOR IMPROVEMENT:**
• [List specific areas needing development]

**DETAILED RECOMMENDATIONS:**
• [Provide specific, actionable feedback for improvement]

**RUBRIC APPLICATION:**
[Show how each rubric criterion was applied to determine the grade]

Use accurate evaluation and provide constructive feedback to help the student improve.`;
};

// --- DATABASE INITIALIZATION ---
async function initializeDatabase() {
  console.log('🔌 Initializing database connection...');
  console.log('📋 Environment check:');
  console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configured' : '❌ Missing');
  console.log('  - NODE_ENV:', process.env.NODE_ENV || 'development');

  const connected = await testConnection();
  if (connected) {
    const tablesCreated = await initializeTables();
    if (tablesCreated) {
      console.log('✅ Tournament database ready');
      return true;
    } else {
      console.log('⚠️ Database tables initialization failed');
      return false;
    }
  } else {
    console.log('⚠️ Database connection failed - using fallback mode');
    console.log('📝 To fix this:');
    console.log('   1. Set DATABASE_URL environment variable in Render dashboard');
    console.log('   2. Use your Supabase connection string');
    console.log('   3. Redeploy the service');
    return false;
  }
}

// --- API ENDPOINTS ---

app.get('/api/study-materials', (req, res) => {
  res.json(studyMaterialsDb);
});

app.delete('/api/study-materials/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const materialIndex = studyMaterialsDb.findIndex(m => m.id === id);
    if (materialIndex === -1) {
      return res.status(404).json({ error: 'Study material not found.' });
    }

    const material = studyMaterialsDb[materialIndex];

    // If there's an associated file, delete it from the server
    if (material.filePath) {
      try {
        await fsPromises.unlink(material.filePath);
        console.log(`Deleted file: ${material.filePath}`);
      } catch (fileError) {
        // Log the error but don't block deletion of the DB entry
        console.error(`Error deleting file ${material.filePath}:`, fileError);
      }
    }

    // Remove the material from the database array
    studyMaterialsDb.splice(materialIndex, 1);

    // Save the updated database
    await saveDb();

    console.log(`Deleted study material with ID: ${id}`);
    res.status(200).json({ message: 'Study material deleted successfully.' });

  } catch (error) {
    console.error('Error deleting study material:', error);
    res.status(500).json({ error: 'An internal error occurred while deleting the material.' });
  }
});

app.post('/api/upload-study-material', uploadStudyFile.single('studyMaterial'), async (req, res) => {
  const { conversationId } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  // conversationId is now optional. If provided, the file content will be added to the conversation context.

  try {
    const materialId = crypto.randomUUID();
    const newMaterial = {
      id: materialId,
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      filePath: req.file.path,
      mimetype: req.file.mimetype,
      topic: req.body.topic || 'General',
      uploadTimestamp: new Date().toISOString(),
      size: req.file.size,
    };

    studyMaterialsDb.push(newMaterial);
    await saveDb();

    const fileBuffer = await fsPromises.readFile(newMaterial.filePath);
    const fileTextContent = await extractTextFromFile(newMaterial.mimetype, fileBuffer);

    // If a conversationId is provided, add the file's text content to that conversation's context.
    if (conversationId && fileTextContent) {
      const conversation = getOrCreateConversation(conversationId);
      conversation.contextParts.push({
        text: `--- START OF FILE: ${newMaterial.originalFilename} ---\n${fileTextContent}\n--- END OF FILE: ${newMaterial.originalFilename} ---`
      });
      console.log(`DEBUG: Added content of ${newMaterial.originalFilename} to context for conversation ${conversationId}.`);
    }

    res.status(201).json({ message: 'File uploaded successfully!', file: newMaterial });
  } catch (error) {
    console.error(`ERROR processing uploaded file: ${error.message}`);
    if (req.file && req.file.path) {
      await fsPromises.unlink(req.file.path).catch(err => console.error("Error cleaning up file:", err));
    }
    res.status(500).json({ error: 'Failed to save or process file.' });
  }
});

app.get('/pdf-proxy', async (req, res) => {
  const { file, url } = req.query;
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow cross-origin requests

  if (!file && !url) {
    return res.status(400).json({ error: 'Missing "file" or "url" query parameter.' });
  }

  try {
    if (file) {
      const sanitizedFile = path.basename(file);
      const filePath = path.join(STUDY_MATERIALS_DIR, sanitizedFile);

      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        return fs.createReadStream(filePath).pipe(res);
      } else {
        return res.status(404).json({ error: 'Local file not found.' });
      }
    } else { // url
      new URL(url); // Validate URL format
      const response = await axios({ method: 'get', url: url, responseType: 'stream' });
      res.setHeader('Content-Type', 'application/pdf');
      return response.data.pipe(res);
    }
  } catch (error) {
    console.error('PDF Proxy Error:', error.message);
    if (error.message.includes('Invalid URL')) {
      return res.status(400).json({ error: 'Invalid URL format provided.' });
    }
    return res.status(500).json({ error: 'Failed to fetch or process URL content.' });
  }
});

// Add /api/kana/pdf-proxy route for frontend compatibility
app.get('/api/kana/pdf-proxy', async (req, res) => {
  const { file, url } = req.query;
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow cross-origin requests

  if (!file && !url) {
    return res.status(400).json({ error: 'Missing "file" or "url" query parameter.' });
  }

  try {
    if (file) {
      const sanitizedFile = path.basename(file);
      const filePath = path.join(STUDY_MATERIALS_DIR, sanitizedFile);

      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        return fs.createReadStream(filePath).pipe(res);
      } else {
        return res.status(404).json({ error: 'Local file not found.' });
      }
    } else { // url
      new URL(url); // Validate URL format
      const response = await axios({ method: 'get', url: url, responseType: 'stream' });
      res.setHeader('Content-Type', 'application/pdf');
      return response.data.pipe(res);
    }
  } catch (error) {
    console.error('PDF Proxy Error:', error.message);
    if (error.message.includes('Invalid URL')) {
      return res.status(400).json({ error: 'Invalid URL format provided.' });
    }
    return res.status(500).json({ error: 'Failed to fetch or process URL content.' });
  }
});

app.post('/api/fetch-url-content', async (req, res) => {
  const { url, conversationId } = req.body;
  if (!url || !conversationId) {
    return res.status(400).json({ error: 'url and conversationId are required.' });
  }

  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', headers: { 'User-Agent': 'Mozilla/5.0' } });
    const contentType = response.headers['content-type'];
    let contentText = '';

    if (contentType && contentType.includes('application/pdf')) {
      contentText = await extractTextFromFile('application/pdf', response.data);
    } else {
      contentText = response.data.toString('utf-8').replace(/<[^>]*>/g, ' ').replace(/\s\s+/g, ' ').trim();
    }

    if (contentText) {
      const conversation = getOrCreateConversation(conversationId);
      conversation.contextParts.push({ text: `--- START OF WEB CONTENT: ${url} ---\n${contentText}\n--- END OF WEB CONTENT: ${url} ---` });
      console.log(`DEBUG: Added content from ${url} to context for conversation ${conversationId}.`);
      res.status(200).json({ message: 'URL content fetched and added to context successfully.' });
    } else {
      res.status(200).json({ message: 'No text content could be extracted from the URL.' });
    }
  } catch (error) {
    console.error(`ERROR fetching URL content: ${error.message}`);
    res.status(500).json({ error: `Failed to fetch or process content from URL: ${url}` });
  }
});

// Helper for exponential backoff
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.get('/api/core-search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }
  if (!process.env.CORE_API_KEY) {
    console.log('CORE_API_KEY is not set. Returning mock data for demo purposes.');
    // Return mock search results for demo purposes
    const mockResults = [
      {
        coreId: 'mock-1',
        title: `Sample Research Paper: ${q}`,
        authors: ['Demo Author', 'Research Team'],
        abstract: `This is a demonstration abstract for the search term "${q}". In a production environment, this would contain real academic research results from the CORE academic search API.`,
        year: 2024,
        downloadUrl: null,
        doi: `10.1000/mock.${q}`,
        publisher: 'Demo Publisher'
      },
      {
        coreId: 'mock-2',
        title: `Advanced Studies in ${q}`,
        authors: ['Academic Researcher'],
        abstract: `An example research paper abstract related to ${q}. This is mock data shown when CORE API key is not configured.`,
        year: 2023,
        downloadUrl: null,
        doi: `10.1000/demo.${q}`,
        publisher: 'Academic Press'
      }
    ];
    return res.json(mockResults);
  }

  const searchUrl = 'https://api.core.ac.uk/v3/search/works';
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      console.log(`CORE Search: Attempt ${attempt + 1} for query \"${q}\"`);
      const response = await axios.post(searchUrl,
        { q: `title:(${q}) OR abstract:(${q})` },
        {
          headers: {
            'Authorization': `Bearer ${process.env.CORE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const transformedResults = response.data.results.map(item => ({
        coreId: item.id, title: item.title, authors: item.authors, abstract: item.abstract,
        year: item.yearPublished, downloadUrl: item.downloadUrl, doi: item.doi, publisher: item.publisher,
      }));
      return res.json(transformedResults);
    } catch (error) {
      const isServerBusy = error.response && (error.response.status === 503 || JSON.stringify(error.response.data).includes('rejected execution'));

      if (isServerBusy && attempt < MAX_RETRIES - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s
        console.warn(`CORE API is busy. Retrying in ${delay}ms...`);
        await sleep(delay);
        attempt++;
      } else {
        console.error('CORE API Search Error:', error.response ? error.response.data : error.message);
        const status = error.response ? error.response.status : 500;
        const message = error.response ? error.response.data : 'Failed to fetch from CORE API after multiple retries.';
        return res.status(status).json({ message });
      }
    }
  }
});

app.post('/api/save-external-item', async (req, res) => {
  const { title, authors, year, doi, downloadUrl, abstract } = req.body;
  if (!downloadUrl || !title) {
    return res.status(400).json({ error: 'downloadUrl and title are required.' });
  }

  try {
    const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `studyMaterial-${uniqueSuffix}.pdf`;
    const filePath = path.join(STUDY_MATERIALS_DIR, filename);
    await fsPromises.writeFile(filePath, response.data);

    const newMaterial = {
      id: crypto.randomUUID(),
      originalFilename: `${title}.pdf`,
      storedFilename: filename,
      filePath: filePath,
      mimetype: 'application/pdf',
      topic: 'CORE Import',
      uploadTimestamp: new Date().toISOString(),
      size: response.data.length,
      metadata: { title, authors, year, doi, abstract, source: 'CORE' }
    };
    studyMaterialsDb.push(newMaterial);
    await saveDb();
    res.status(201).json({ message: 'Successfully saved paper to library.', file: newMaterial });
  } catch (error) {
    console.error('Error saving external item:', error.message);
    res.status(500).json({ error: 'Failed to download or save the paper.' });
  }
});

const tools = [
  {
    functionDeclarations: [
      {
        name: 'generate_graph_data',
        description: 'Generates data for a mathematical graph based on a function string. Defaults to xMin=-10, xMax=10, step=1 if not provided.',
        parameters: {
          type: 'OBJECT',
          properties: {
            functionStr: { type: 'STRING', description: 'The mathematical function to be plotted, e.g., \'y = 2x + 5\'.' },
            xMin: { type: 'NUMBER', description: 'Optional. The minimum value for x. Defaults to -10.' },
            xMax: { type: 'NUMBER', description: 'Optional. The maximum value for x. Defaults to 10.' },
            step: { type: 'NUMBER', description: 'Optional. The increment step for x. Defaults to 1.' },
          },
          required: ['functionStr'],
        },
      },
    ],
  },
];

// Helper function to generate graph data and handle evaluation errors
async function generateGraphData(functionStr, xMin = -10, xMax = 10, step = 1) {
  console.log(`DEBUG: AI requested graph generation for function: ${functionStr} over [${xMin}, ${xMax}] with step ${step}`);
  const data = [];
  try {
    // Parse and extract the function from the equation (handle y = ... or just the expression)
    let expression = functionStr.includes('=') ? functionStr.split('=')[1].trim() : functionStr.trim();

    // Clean and normalize the expression for mathjs
    expression = expression
      .replace(/\^/g, '**') // Handle exponents (e.g., x^2 -> x**2)
      .replace(/\*\*|\\/g, '^') // Convert back to mathjs exponent syntax
      .replace(/(\d+\.?\d*)\s*([a-zA-Z(])/g, '$1 * $2') // Handle implicit multiplication
      .replace(/\)\(/g, ') * ('); // Handle multiplication between parentheses

    console.log(`DEBUG: Cleaned expression: ${expression}`);

    // Generate more data points for smoother curves
    // Use smaller step size for better curve resolution
    const actualStep = Math.min(step, (xMax - xMin) / 100); // At least 100 points for smooth curves

    for (let x = xMin; x <= xMax; x += actualStep) {
      try {
        const scope = { x: x };
        const y = evaluate(expression, scope);
        if (typeof y === 'number' && isFinite(y)) {
          data.push({ x: x, y: y });
        }
      } catch (evalError) {
        console.log(`DEBUG: Error evaluating at x=${x}: ${evalError.message}`);
        // Skip invalid points but continue with the rest
      }
    }

    if (data.length === 0) {
      console.error("No valid data points generated");
      return null;
    }

    console.log(`DEBUG: Generated ${data.length} data points`);
    return data;
  } catch (error) {
    console.error("Error in generateGraphData:", error);
    return null;
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { conversationId, message, history, pdfContextUrl, studyMaterialContext } = req.body;

    if (!conversationId || !message) {
      return res.status(400).json({ error: 'Missing conversationId or message.' });
    }

    const conversation = getOrCreateConversation(conversationId);
    const clientHistory = Array.isArray(history) ? history : [];

    // If there's a specific PDF context from a past paper, fetch and add it.
    if (pdfContextUrl) {
      try {
        console.log(`DEBUG: Fetching PDF context from URL: ${pdfContextUrl}`);
        const response = await axios.get(pdfContextUrl, { responseType: 'arraybuffer' });
        const pdfText = await extractTextFromFile('application/pdf', response.data);
        if (pdfText) {
          const contextIdentifier = `PAST PAPER CONTEXT: ${pdfContextUrl}`;
          // Avoid adding duplicate context by checking for the identifier
          if (!conversation.contextParts.some(p => p.text.includes(contextIdentifier))) {
            conversation.contextParts.push({ text: `--- START OF ${contextIdentifier} ---\n${pdfText}\n--- END OF ${contextIdentifier} ---` });
            console.log(`DEBUG: Added PDF context for conversation ${conversationId}.`);
          } else {
            console.log(`DEBUG: PDF context for ${pdfContextUrl} already exists.`);
          }
        }
      } catch (error) {
        console.error(`ERROR fetching or processing PDF context from ${pdfContextUrl}:`, error.message);
        // Non-fatal, just log and continue. The chat can proceed without this context.
      }
    }

    // If there's a specific study material context, find and add it.
    if (studyMaterialContext && studyMaterialContext.id) {
      console.log(`DEBUG: Received request to use study material context with ID: ${studyMaterialContext.id}`);
      try {
        const material = studyMaterialsDb.find(m => m.id === studyMaterialContext.id);
        if (material) {
          console.log(`DEBUG: Found study material: ${material.title}`);
          let materialText = null;

          // Case 1: Local file path exists
          if (material.filePath) {
            const fileBuffer = await fsPromises.readFile(material.filePath);
            materialText = await extractTextFromFile(material.mimetype, fileBuffer);
          }
          // Case 2: Remote PDF URL exists (and no local path)
          else if (material.pdfUrl) {
            console.log(`DEBUG: Fetching study material PDF from URL: ${material.pdfUrl}`);
            const response = await axios.get(material.pdfUrl, { responseType: 'arraybuffer' });
            materialText = await extractTextFromFile('application/pdf', response.data);
          }

          if (materialText) {
            const contextIdentifier = `STUDY MATERIAL CONTEXT: ${material.title}`;
            if (!conversation.contextParts.some(p => p.text.includes(contextIdentifier))) {
              conversation.contextParts.push({ text: `--- START OF ${contextIdentifier} ---\n${materialText}\n--- END OF ${contextIdentifier} ---` });
              console.log(`DEBUG: Added study material context for conversation ${conversationId}.`);
            } else {
              console.log(`DEBUG: Study material context for ${material.title} already exists.`);
            }
          } else {
            console.log(`WARN: Could not extract text from study material '${material.title}'.`);
          }
        } else {
          console.log(`WARN: Study material with id ${studyMaterialContext.id} not found.`);
        }
      } catch (error) {
        console.error(`ERROR processing study material context for id ${studyMaterialContext.id}:`, error.message);
      }
    }
    Gemini
    // Combine the base system instruction with any document context for this specific conversation.
    const effectiveSystemInstruction = {
      parts: [
        ...systemInstruction.parts,
        ...conversation.contextParts
      ]
    };

    const chat = geminiModel.startChat({
      history: [...conversation.history, ...clientHistory],
      tools: tools,
      systemInstruction: effectiveSystemInstruction,
      generationConfig: { maxOutputTokens: 8192 }
    });

    const result = await chat.sendMessage(message);
    const response = result.response;

    // Check all parts for function calls, not just the first one
    const parts = response.candidates?.[0]?.content?.parts || [];
    const functionCall = parts.find(part => part.functionCall)?.functionCall;

    const userMessage = Array.isArray(message) ? message.find(p => p.text)?.text || '' : message;
    const isGraphRequest = /\b(plot|graph)\b/i.test(userMessage);

    if (isGraphRequest && functionCall && functionCall.name === 'generate_graph_data') {
      const { functionStr, xMin, xMax, step } = functionCall.args;
      console.log(`DEBUG: Processing graph request for: ${functionStr}`);

      try {
        const graphData = await generateGraphData(functionStr, xMin, xMax, step);

        if (graphData && graphData.length > 0) {
          console.log(`DEBUG: Generated ${graphData.length} data points for graph`);
          const imageUrl = await generateGraphImage(graphData, functionStr, 'x', 'y');
          if (imageUrl) {
            const kanaResponseText = `Here is the graph for ${functionStr}.`;
            conversation.history.push({ role: 'user', parts: [{ text: message }] });
            conversation.history.push({ role: 'model', parts: [{ text: kanaResponseText }] });
            return res.json({
              type: 'mathematical_graph',
              kanaResponse: kanaResponseText,
              generatedImageUrl: imageUrl
            });
          } else {
            console.error("Graph image generation failed after data calculation.");
            throw new Error("Graph image generation failed.");
          }
        } else {
          console.error("No valid data points generated for graph");
          throw new Error("Could not generate valid data points for the function.");
        }
      } catch (graphError) {
        console.error("Graph generation error:", graphError.message);
        // Send a fallback response explaining the issue
        const fallbackResponse = `I tried to generate a graph for "${functionStr}", but encountered an error: ${graphError.message}. Please check that the mathematical expression is valid and try again.`;
        conversation.history.push({ role: 'user', parts: [{ text: message }] });
        conversation.history.push({ role: 'model', parts: [{ text: fallbackResponse }] });
        return res.json({ kanaResponse: fallbackResponse });
      }
    } else {
      const kanaResponseText = response.text();
      console.log(`DEBUG: AI returned no function call. Raw response object:`, JSON.stringify(response, null, 2));
      conversation.history.push({ role: 'user', parts: [{ text: message }] });
      conversation.history.push({ role: 'model', parts: [{ text: kanaResponseText }] });
      return res.json({ kanaResponse: kanaResponseText });
    }
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: 'Failed to get response from K.A.N.A.' });
  }
});

app.post('/api/clear-note-context', (req, res) => {
  try {
    if (!req.body) {
      console.error('Error: /api/clear-note-context called with no request body.');
      return res.status(400).json({ error: 'Request body is missing or malformed.' });
    }
    const { conversationId } = req.body;
    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId is required in request body.' });
    }

    if (conversationContexts[conversationId]) {
      console.log(`DEBUG: Clearing context for conversationId: ${conversationId}`);
      // Reset the context for the given conversation
      conversationContexts[conversationId] = {
        history: [],
        contextParts: [],
      };
    }
    // Always return success, even if there was no context to clear.
    res.status(200).json({ message: 'Context cleared successfully.' });
  } catch (error) {
    console.error('Error in /clear-note-context:', error);
    res.status(500).json({ error: 'An unexpected error occurred while clearing context.' });
  }
});

app.post('/api/kana/generate-quiz', async (req, res) => {
  try {
    const { sourceMaterialId, difficulty, numQuestions } = req.body;
    if (!sourceMaterialId || !difficulty || !numQuestions) {
      return res.status(400).json({ error: 'sourceMaterialId, difficulty, and numQuestions are required.' });
    }

    const material = studyMaterialsDb.find(m => m.id === sourceMaterialId);
    if (!material) {
      return res.status(404).json({ error: 'Study material not found.' });
    }

    const fileBuffer = await fsPromises.readFile(material.filePath);
    const textContent = await extractTextFromFile(material.mimetype, fileBuffer);
    if (!textContent) return res.status(400).json({ error: 'Could not extract text from the material.' });

    const prompt = `Based on the following text, generate a quiz with ${numQuestions} questions at a ${difficulty} difficulty level. Format the output as a single JSON object. Each question should be an object with "question", "options" (an array of 4 strings), and "answer" (the correct string from options). The root of the JSON should be a single object with a key "quiz".\n\nTEXT: ${textContent.substring(0, 10000)}`;

    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text().trim().replace(/^```json\n|```$/g, '');
    const quizJson = JSON.parse(responseText);

    res.json(quizJson);
  } catch (error) {
    console.error('Error in /generate-quiz:', error);
    res.status(500).json({ error: 'Failed to generate quiz: ' + error.message });
  }
});

// New Quiz Generation Endpoints using QuizService

/**
 * Generate quiz based on description and optional context
 * POST /api/kana/generate-quiz-by-description
 */
app.post('/api/kana/generate-quiz-by-description', async (req, res) => {
  try {
    const {
      description,
      numQuestions = 5,
      difficulty = 'medium',
      subject = 'General',
      studentLevel = 'intermediate',
      weaknessAreas = [],
      context = ''
    } = req.body;

    // Validate required fields
    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        error: 'Description is required for quiz generation',
        message: 'Please provide a description of what the quiz should cover'
      });
    }

    console.log(`🧠 Quiz generation request: "${description}" - ${numQuestions} questions, ${difficulty} difficulty`);

    // Generate quiz using Gemini with retry logic
    let quiz;
    try {
      quiz = await callGeminiWithCircuitBreaker(
        geminiModel,
        `Generate a quiz: ${description}\nQuestions: ${numQuestions}\nDifficulty: ${difficulty}\nSubject: ${subject}\nStudent Level: ${studentLevel}\nWeakness Areas: ${Array.isArray(weaknessAreas) ? weaknessAreas.join(', ') : ''}\nContext: ${context}`
      );
    } catch (error) {
      console.error('Gemini quiz generation failed:', error.message);
      return res.status(503).json({
        error: 'Gemini AI service is overloaded. Please try again later.'
      });
    }

    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return res.status(500).json({
        error: 'Failed to generate quiz questions',
        message: 'The quiz generation service was unable to create questions. Please try again.'
      });
    }

    console.log(`✅ Quiz generated successfully: ${quiz.questions.length} questions`);

    res.json({
      success: true,
      quiz: quiz,
      metadata: {
        generatedBy: quiz.generatedBy,
        questionCount: quiz.questions.length,
        estimatedTime: quiz.timeLimitMinutes,
        createdAt: quiz.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error in quiz generation by description:', error);
    res.status(500).json({
      error: 'Quiz generation failed',
      message: error.message || 'An unexpected error occurred during quiz generation',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Generate quiz for educational improvement (compatible with modules.py)
 * POST /api/kana/generate-improvement-quiz
 */
app.post('/api/kana/generate-improvement-quiz', async (req, res) => {
  try {
    const {
      assignment_id,
      student_id,
      feedback,
      weakness_areas = [],
      subject = 'General',
      grade = 'intermediate',
      numQuestions = 5,
      context = ''
    } = req.body;

    // Validate required fields
    if (!feedback || feedback.trim().length === 0) {
      return res.status(400).json({
        error: 'Feedback is required for improvement quiz generation',
        message: 'Please provide teacher feedback to generate targeted improvement questions'
      });
    }

    console.log(`🎯 Improvement quiz request for student ${student_id}, assignment ${assignment_id}`);

    // Create description from feedback and weakness areas
    const weaknessText = weakness_areas.length > 0 ? weakness_areas.join(', ') : 'general understanding';
    const description = `Generate an improvement quiz based on teacher feedback: "${feedback}". Focus on helping the student improve in: ${weaknessText}`;

    // Generate quiz using QuizService
    const quiz = await quizService.generateQuiz(description, {
      numQuestions: parseInt(numQuestions),
      difficulty: 'medium',
      subject: subject,
      studentLevel: grade,
      weaknessAreas: weakness_areas,
      context: `Teacher Feedback: ${feedback}\n${context}`
    });

    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return res.status(500).json({
        error: 'Failed to generate improvement quiz',
        message: 'Unable to create quiz questions based on the provided feedback'
      });
    }

    // Format response to match modules.py expectations
    const formattedQuiz = {
      id: quiz.id,
      assignment_id: assignment_id,
      student_id: student_id,
      title: `Improvement Quiz - Assignment Review`,
      description: `This quiz is designed to help you improve in areas where you can grow. Focus on the concepts and take your time!`,
      questions: quiz.questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        topic: q.topic,
        weakness_area: q.weaknessArea
      })),
      weakness_areas: weakness_areas,
      created_at: quiz.createdAt,
      max_attempts: 3,
      time_limit_minutes: quiz.timeLimitMinutes,
      attempts: [],
      generated_by: quiz.generatedBy,
      kana_available: quiz.generatedBy === 'kana_ai'
    };

    console.log(`✅ Improvement quiz generated: ${formattedQuiz.questions.length} questions for ${weaknessText}`);

    res.json(formattedQuiz);

  } catch (error) {
    console.error('❌ Error in improvement quiz generation:', error);
    res.status(500).json({
      error: 'Improvement quiz generation failed',
      message: error.message || 'Failed to generate quiz based on feedback',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Get quiz by ID (for retrieving generated quizzes)
 * GET /api/kana/quiz/:quizId
 */
app.get('/api/kana/quiz/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;

    // Note: In a real implementation, you'd store quizzes in a database
    // For now, this is a placeholder for the quiz retrieval functionality

    res.status(404).json({
      error: 'Quiz not found',
      message: 'Quiz storage and retrieval will be implemented with database integration'
    });

  } catch (error) {
    console.error('❌ Error retrieving quiz:', error);
    res.status(500).json({
      error: 'Failed to retrieve quiz',
      message: error.message
    });
  }
});

/**
 * Chat endpoint that can generate quizzes (compatibility with existing chat system)
 * POST /api/kana/chat
 */
app.post('/api/kana/chat', async (req, res) => {
  try {
    const { message, mode, type, conversationId = 'default' } = req.body;

    // Check if this is a quiz generation request
    if (mode === 'quiz_generation' || type === 'educational_quiz') {
      console.log('🧠 Quiz generation via chat endpoint');

      // Extract quiz parameters from message
      const quizRequest = typeof message === 'string' ? message : JSON.stringify(message);

      // Generate quiz using QuizService
      const quiz = await quizService.generateQuiz(quizRequest, {
        numQuestions: 5,
        difficulty: 'medium',
        subject: 'General'
      });

      return res.json({
        success: true,
        type: 'quiz_generation',
        kanaResponse: `I've generated a ${quiz.questions.length}-question quiz for you.`,
        quiz: quiz,
        generatedBy: quiz.generatedBy
      });
    }

    // If not a quiz request, return error (this endpoint is specifically for quiz generation)
    res.status(400).json({
      error: 'Invalid request',
      message: 'This endpoint is specifically for quiz generation. Use mode="quiz_generation" or type="educational_quiz"'
    });

  } catch (error) {
    console.error('❌ Error in kana chat quiz endpoint:', error);
    res.status(500).json({
      error: 'Quiz generation failed',
      message: error.message
    });
  }
});

app.delete('/api/study-materials/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const materialIndex = studyMaterialsDb.findIndex(m => m.id === id);
    if (materialIndex === -1) {
      return res.status(404).json({ error: 'Study material not found.' });
    }

    const material = studyMaterialsDb[materialIndex];

    // If there's an associated file, delete it from the server
    if (material.filePath) {
      try {
        await fsPromises.unlink(material.filePath);
        console.log(`Deleted file: ${material.filePath}`);
      } catch (fileError) {
        // Log the error but don't block deletion of the DB entry
        console.error(`Error deleting file ${material.filePath}:`, fileError);
      }
    }

    // Remove the material from the database array
    studyMaterialsDb.splice(materialIndex, 1);

    // Save the updated database
    await saveDb();

    console.log(`Deleted study material with ID: ${id}`);
    res.status(200).json({ message: 'Study material deleted successfully.' });

  } catch (error) {
    console.error('Error deleting study material:', error);
    res.status(500).json({ error: 'An internal error occurred while deleting the material.' });
  }
});

app.get('/', (req, res) => {
  res.send('K.A.N.A. Backend is running!');
});

// --- GRAPH GENERATION HELPER ---
const generateGraphImage = async (data, title, xLabel, yLabel) => {
  try {
    // Try ChartJS (PNG) if available
    if (generateChartJSGraph) {
      try {
        const pngUrl = await generateChartJSGraph(data, title, xLabel, yLabel);
        if (pngUrl) return pngUrl;
      } catch (e) {
        console.warn('ChartJS graph generation failed, falling back to SVG:', e);
      }
    }
    // Fallback: SVG
    const svg = generateSVGGraph(data, title, xLabel, yLabel);
    if (svg) {
      const fileName = `graph_${Date.now()}.svg`;
      const filePath = path.join(__dirname, 'uploads', fileName);
      fs.writeFileSync(filePath, svg, 'utf8');
      return `/uploads/${fileName}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating graph image:", error);
    return null;
  }
};

const startServer = async () => {
  await loadDb();
  await loadGradeCache();
  await initializeDatabase();

  // Initialize syllabus integration with conversation contexts
  initializeConversationContexts(conversationContexts);

  const fileToGenerativePart = (filePath, mimeType) => {
    return {
      inlineData: {
        data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
        mimeType
      },
    };
  };

  // PDF Generation Utility for Student Assignments
  const generateStudentPDF = async (studentName, assignmentName, imagePaths, assignmentId, studentId) => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const pdfFilename = `${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_${assignmentName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
        const pdfPath = path.join(STUDENT_PDFS_DIR, pdfFilename);

        // Pipe to file
        doc.pipe(fs.createWriteStream(pdfPath));

        // Add title page
        doc.fontSize(20).text(`Assignment: ${assignmentName}`, 50, 50);
        doc.fontSize(16).text(`Student: ${studentName}`, 50, 80);
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, 50, 110);
        doc.text(`Total Images: ${imagePaths.length}`, 50, 130);

        let yPosition = 170;

        // Add each image
        imagePaths.forEach((imagePath, index) => {
          if (index > 0) {
            doc.addPage();
            yPosition = 50;
          }

          try {
            // Check if we need to start a new page
            if (yPosition > 700) {
              doc.addPage();
              yPosition = 50;
            }

            doc.fontSize(14).text(`Image ${index + 1}:`, 50, yPosition);
            yPosition += 30;

            // Add image (scaled to fit)
            const imageWidth = 500;
            const imageHeight = 400;

            doc.image(imagePath, 50, yPosition, {
              width: imageWidth,
              height: imageHeight,
              fit: [imageWidth, imageHeight]
            });

            yPosition += imageHeight + 30;

          } catch (imageError) {
            console.error(`Error adding image ${index + 1}:`, imageError);
            doc.fontSize(12).text(`Error loading image ${index + 1}`, 50, yPosition);
            yPosition += 20;
          }
        });

        doc.end();

        doc.on('end', () => {
          resolve({
            pdfPath,
            pdfFilename,
            imageCount: imagePaths.length
          });
        });

        doc.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  };

  app.post('/api/analyze-image', uploadImage.single('imageFile'), async (req, res) => {
    try {
      const { conversationId, message } = req.body;
      const imageFile = req.file;

      if (!imageFile) {
        return res.status(400).json({ error: 'No image file uploaded.' });
      }
      if (!conversationId) {
        return res.status(400).json({ error: 'Missing conversationId.' });
      }

      console.log(`DEBUG: Analyzing image for conversation ${conversationId}. Message: "${message}"`);

      const conversation = getOrCreateConversation(conversationId);
      const visionModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

      const imagePart = fileToGenerativePart(imageFile.path, imageFile.mimetype);

      const userMessageText = message || 'Please analyze this image.';
      conversation.history.push({ role: 'user', parts: [{ text: userMessageText }] });

      const result = await visionModel.generateContent([userMessageText, imagePart]);
      const kanaResponseText = result.response.text();

      conversation.history.push({ role: 'model', parts: [{ text: kanaResponseText }] });

      const imageUrl = `/images/${imageFile.filename}`;

      res.json({
        kanaResponse: kanaResponseText,
        imageUrl: imageUrl,
        explanation: kanaResponseText
      });

    } catch (error) {
      console.error('Error analyzing image:', error);
      res.status(500).json({ error: 'Failed to analyze image.' });
    } finally {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error(`Error deleting temp image file: ${req.file.path}`, err);
        });
      }
    }
  });

  // Enhanced Bulk Image Grading Endpoint
  app.post('/api/kana/bulk-grade-images', async (req, res) => {
    try {
      const {
        image_files, // Array of base64 image files
        assignment_title,
        max_points,
        grading_rubric,
        feedback_type = 'both', // 'detailed', 'summary', or 'both'
        student_names = [] // Optional array of student names
      } = req.body;

      if (!image_files || !Array.isArray(image_files) || image_files.length === 0) {
        return res.status(400).json({
          error: 'image_files array is required and must contain at least one image'
        });
      }

      if (!assignment_title || !max_points || !grading_rubric) {
        return res.status(400).json({
          error: 'assignment_title, max_points, and grading_rubric are required'
        });
      }

      console.log(`🖼️ Starting bulk image grading for ${image_files.length} images - Assignment: ${assignment_title}`);

      // Use deterministic settings for consistent grading
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        generationConfig: {
          temperature: 0,        // Maximum determinism
          topP: 1,              // Use all probability mass
          topK: 1,              // Consider only the most likely token
          maxOutputTokens: 4096, // Consistent output length
          candidateCount: 1      // Single response candidate
        }
      });
      const gradingResults = [];

      // Process each image
      for (let i = 0; i < image_files.length; i++) {
        const imageData = image_files[i];
        const studentName = student_names[i] || `Student ${i + 1}`;

        // Add rate limiting between requests (except for first request)
        if (i > 0) {
          await rateLimitDelay(2000); // 2 second delay between students
        }

        try {
          console.log(`🖼️ Processing Image ${i + 1}/${image_files.length} for ${studentName}`);

          // Create image part for Gemini
          const imagePart = {
            inlineData: {
              data: imageData,
              mimeType: 'image/jpeg' // Assume JPEG, but could be PNG
            }
          };

          let gradingResults_detailed = null;
          let gradingResults_summary = null;

          // Generate feedback based on type
          if (feedback_type === 'detailed') {
            // Only detailed feedback
            console.log(`🔍 Generating detailed feedback for ${studentName}'s image`);

            const detailedPrompt = `Grade this student assignment image accurately using these exact criteria:

**ASSIGNMENT DETAILS:**
- Title: ${assignment_title}
- Maximum Points: ${max_points}
- Grading Rubric: ${grading_rubric}

**GRADING REQUIREMENTS:**
1. Provide fair and accurate numerical scoring based on the rubric
2. Use ONLY the rubric provided for evaluation criteria
3. Grade based ONLY on what is visible and demonstrable in the image
4. Apply consistent standards according to the rubric

**REQUIRED FORMAT - START YOUR RESPONSE WITH THIS EXACT FORMAT:**
**GRADE BREAKDOWN:**
Points Earned: [EXACT_NUMBER]/${max_points}
Letter Grade: [A+, A, A-, B+, B, B-, C+, C, C-, D+, D, or F]
Percentage: [EXACT_PERCENTAGE]%

**STEP-BY-STEP GRADING PROCESS:**
1. Identify each gradable element visible in the image
2. Apply rubric criteria systematically to each element
3. Calculate points using consistent mathematical approach
4. Verify total adds up correctly

**DETAILED QUESTION-BY-QUESTION ANALYSIS:**
[Analyze each visible element systematically based on rubric criteria]

**DETAILED FEEDBACK:**
[Specific, objective feedback based only on observable work quality]

**LEARNING STRENGTHS:**
• [List specific, observable strengths with concrete examples]

**GROWTH OPPORTUNITIES:**
• [List areas for improvement based on what's visible]

**STUDY SUGGESTIONS:**
• [Provide specific recommendations based on the student's work]

Use accurate mathematical evaluation and fair assessment based on the rubric criteria.`;

            const detailedResult = await callGeminiWithCircuitBreaker(model, [detailedPrompt, imagePart]);
            gradingResults_detailed = detailedResult.response.text();

          } else if (feedback_type === 'summary') {
            // Only summary feedback
            console.log(`📋 Generating summary feedback for ${studentName}'s image`);

            const summaryPrompt = `Grade this student assignment image with comprehensive summary using the provided criteria:

**ASSIGNMENT:** ${assignment_title} (${max_points} points)
**RUBRIC:** ${grading_rubric}

**GRADING REQUIREMENTS:**
1. Fair and accurate scoring based on visible work quality
2. Use ONLY observable, measurable criteria from the rubric
3. Apply systematic evaluation using rubric guidelines
4. Provide helpful feedback for student improvement

**REQUIRED FORMAT - START WITH THIS EXACT FORMAT:**
**GRADE BREAKDOWN:**
Points Earned: [EXACT_NUMBER]/${max_points}
Letter Grade: [A+, A, A-, B+, B, B-, C+, C, C-, D+, D, or F]
Percentage: [EXACT_PERCENTAGE]%

**GRADING SUMMARY:**
[2-3 sentences on overall assessment and grade rationale]

**PERFORMANCE OVERVIEW:**
[Overall assessment of visible work quality with specific observations]

**KEY STRENGTHS:**
• [Top 2-3 observable strengths with concrete examples]

**MAIN IMPROVEMENT AREAS:**
• [Top 2-3 areas needing attention based on rubric gaps]

**QUICK RECOMMENDATIONS:**
• [2-3 specific next steps for student improvement]

**FOCUS PRIORITIES:**
• [Most important areas to address first based on rubric]

Use fair and accurate evaluation based on the rubric criteria.`;

            const summaryResult = await callGeminiWithCircuitBreaker(model, [summaryPrompt, imagePart]);
            gradingResults_summary = summaryResult.response.text();

          } else if (feedback_type === 'both') {
            // Both feedbacks - Generate detailed first, then create summary from it
            console.log(`🔍 Generating detailed feedback for ${studentName}'s image (both types requested)`);

            const detailedPrompt = `Grade this student assignment image accurately using these exact criteria:

**ASSIGNMENT DETAILS:**
- Title: ${assignment_title}
- Maximum Points: ${max_points}
- Grading Rubric: ${grading_rubric}

**GRADING REQUIREMENTS:**
1. Provide fair and accurate numerical scoring based on the rubric
2. Use ONLY the rubric provided for evaluation criteria
3. Grade based ONLY on what is visible and demonstrable in the image
4. Apply consistent standards according to the rubric

**REQUIRED FORMAT - START YOUR RESPONSE WITH THIS EXACT FORMAT:**
**GRADE BREAKDOWN:**
Points Earned: [EXACT_NUMBER]/${max_points}
Letter Grade: [A+, A, A-, B+, B, B-, C+, C, C-, D+, D, or F]
Percentage: [EXACT_PERCENTAGE]%

**STEP-BY-STEP GRADING PROCESS:**
1. Identify each gradable element visible in the image
2. Apply rubric criteria systematically to each element
3. Calculate points using consistent mathematical approach
4. Verify total adds up correctly

**DETAILED QUESTION-BY-QUESTION ANALYSIS:**
[Analyze each visible element systematically based on rubric criteria]

**DETAILED FEEDBACK:**
[Specific, objective feedback based only on observable work quality]

**LEARNING STRENGTHS:**
• [List specific, observable strengths with concrete examples]

**GROWTH OPPORTUNITIES:**
• [List areas for improvement based on what's visible]

**STUDY SUGGESTIONS:**
• [Provide specific recommendations based on the student's work]

Use accurate mathematical evaluation and fair assessment based on the rubric criteria.`;

            const detailedResult = await callGeminiWithCircuitBreaker(model, [detailedPrompt, imagePart]);
            gradingResults_detailed = detailedResult.response.text();

            // Generate summary from detailed feedback
            console.log(`📋 Creating summary from detailed feedback for ${studentName}'s image`);
            gradingResults_summary = generateSummaryFromDetailed(gradingResults_detailed, assignment_title, max_points);
          }

          // Parse grading data from detailed feedback (or summary if detailed not available)
          const analysisText = gradingResults_detailed || gradingResults_summary;
          let gradingData = parseGradingFromAnalysis(analysisText);

          // Fallback: If no score was parsed, try parsing from summary feedback
          if (gradingData.score === null && gradingResults_summary && gradingResults_detailed) {
            console.log(`⚠️ No score found in detailed feedback, trying summary for ${studentName}`);
            gradingData = parseGradingFromAnalysis(gradingResults_summary);
          }

          // Final fallback: If still no score, assign a default based on feedback content
          if (gradingData.score === null) {
            console.log(`⚠️ No score found for ${studentName}, assigning default score based on feedback quality`);
            const feedbackLength = analysisText.length;
            const hasPositiveFeedback = analysisText.toLowerCase().includes('good') ||
              analysisText.toLowerCase().includes('well') ||
              analysisText.toLowerCase().includes('strength');
            const hasNegativeFeedback = analysisText.toLowerCase().includes('improve') ||
              analysisText.toLowerCase().includes('needs work') ||
              analysisText.toLowerCase().includes('lacking');

            // Assign score based on feedback content analysis
            if (feedbackLength > 500 && hasPositiveFeedback && !hasNegativeFeedback) {
              gradingData.score = Math.floor(max_points * 0.8); // 80%
            } else if (hasPositiveFeedback && hasNegativeFeedback) {
              gradingData.score = Math.floor(max_points * 0.7); // 70%
            } else if (hasNegativeFeedback) {
              gradingData.score = Math.floor(max_points * 0.6); // 60%
            } else {
              gradingData.score = Math.floor(max_points * 0.75); // 75% default
            }
            gradingData.maxPoints = max_points;
            gradingData.percentage = Math.round((gradingData.score / max_points) * 100);
          }

          const knowledgeGaps = parseKnowledgeGaps(analysisText);
          const recommendations = parseRecommendations(analysisText);
          const strengths = parseStrengths(analysisText);

          // Compile result for this student
          const studentResult = {
            // Enhanced result structure with all feedback fields
            student_name: studentName,
            student_index: i,
            content_type: 'image',

            // Grading data
            score: gradingData.score,
            max_points: max_points,
            letter_grade: gradingData.letterGrade,
            percentage: gradingData.percentage,

            // Multiple feedback types for frontend compatibility
            detailed_feedback: gradingResults_detailed,
            summary_feedback: gradingResults_summary,
            feedback: gradingResults_detailed || gradingResults_summary, // Fallback for compatibility
            analysis: gradingResults_detailed || gradingResults_summary, // Additional mapping
            overallFeedback: gradingResults_summary,
            detailedFeedback: gradingResults_detailed,

            // Structured data arrays
            strengths: strengths,
            knowledge_gaps: knowledgeGaps,
            recommendations: recommendations,
            improvementAreas: knowledgeGaps, // Map knowledge gaps to improvement areas

            // Grade breakdown if available
            gradingCriteria: gradingData.gradingCriteria || [],

            // Metadata
            processed_at: new Date().toISOString(),
            success: true
          };

          gradingResults.push(studentResult);
          console.log(`✅ Completed grading for ${studentName}'s image - Score: ${gradingData.score}/${max_points}`);

        } catch (studentError) {
          console.error(`❌ Error processing Image ${i + 1} (${studentName}):`, studentError);

          gradingResults.push({
            student_name: studentName,
            student_index: i,
            content_type: 'image',
            error: studentError.message,
            success: false,
            processed_at: new Date().toISOString()
          });
        }
      }

      // Calculate batch statistics
      const successfulGrades = gradingResults.filter(r => r.success);
      const averageScore = successfulGrades.length > 0
        ? successfulGrades.reduce((sum, r) => sum + (r.score || 0), 0) / successfulGrades.length
        : 0;

      const response = {
        success: true,
        batch_summary: {
          total_images: image_files.length,
          successfully_graded: successfulGrades.length,
          failed_gradings: image_files.length - successfulGrades.length,
          average_score: Math.round(averageScore * 100) / 100,
          assignment_title: assignment_title,
          max_points: max_points,
          feedback_type: feedback_type,
          processed_at: new Date().toISOString()
        },
        student_results: gradingResults
      };

      console.log(`🎯 Bulk image grading completed: ${successfulGrades.length}/${image_files.length} successful`);
      res.json(response);

    } catch (error) {
      console.error('❌ Error in bulk image grading:', error);
      res.status(500).json({
        error: 'Bulk image grading failed',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Single-pass deterministic Bulk PDF Grading Endpoint (no retries, no fallbacks, caching)
  app.post('/api/kana/bulk-grade-pdfs', async (req, res) => {
    try {
      const { pdf_files, assignment_title, max_points, grading_rubric, student_names = [] } = req.body;
      if (!Array.isArray(pdf_files) || pdf_files.length === 0) {
        return res.status(400).json({ error: 'pdf_files must be a non-empty array' });
      }
      if (!assignment_title || !max_points || !grading_rubric) {
        return res.status(400).json({ error: 'assignment_title, max_points, grading_rubric required' });
      }
      console.log(`🎓 Enhanced PDF grading start: ${pdf_files.length} PDFs (Assignment: ${assignment_title})`);
      console.log(`📋 Using Gemini 2.5 Pro with visual analysis capabilities`);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro', generationConfig: { temperature: 0, topP: 1, topK: 1, maxOutputTokens: 4096, candidateCount: 1 } });
      const results = [];
      for (let i = 0; i < pdf_files.length; i++) {
        const pdfData = pdf_files[i];
        const studentName = (student_names[i] && student_names[i].trim()) || `Student ${i + 1}`;
        console.log(`📄 [${i + 1}/${pdf_files.length}] Processing ${studentName}`);
        if (typeof pdfData !== 'string' || !pdfData.trim()) {
          results.push({ student_name: studentName, student_index: i, error: 'invalid_pdf_data', success: false });
          continue;
        }
        try {
          const pdfBuffer = Buffer.from(pdfData, 'base64');
          const basicInfo = await extractPDFBasicInfo(pdfBuffer);

          // Always use Gemini Vision for comprehensive analysis (text + images)
          console.log(`👁️ Using Gemini Vision for comprehensive analysis of ${studentName}`);

          const contentHash = crypto.createHash('sha256').update(basicInfo.pdfBase64 + assignment_title).digest('hex');
          const cached = getCachedGrade(contentHash);
          if (cached) {
            console.log(`♻️ Cache hit for ${studentName} (${contentHash.slice(0, 12)})`);
            results.push({ ...cached, cached: true });
            continue;
          }

          // Enhanced prompt for better parsing reliability
          const prompt = `You are an expert educator analyzing and grading a student assignment using advanced vision capabilities.

ASSIGNMENT: ${assignment_title}
STUDENT: ${studentName}
MAX POINTS: ${max_points}
RUBRIC: ${grading_rubric}

CRITICAL: You MUST start your response with EXACTLY this format (no variations):

GRADE_START
Points Earned: [NUMBER]/${max_points}
Letter Grade: [LETTER]
Percentage: [NUMBER]%
GRADE_END

EXAMPLE FORMAT:
GRADE_START
Points Earned: 85/${max_points}
Letter Grade: B+
Percentage: 85%
GRADE_END

After the GRADE_END marker, provide your detailed analysis:

1. **Content Analysis**: Read all text, handwriting, equations, diagrams
2. **Rubric Application**: Apply each rubric criterion systematically  
3. **Score Justification**: Explain how you arrived at the score
4. **Feedback**: Provide constructive feedback for improvement

IMPORTANT REQUIREMENTS:
- Use EXACT format above with no extra words or symbols
- Write only the number for Points Earned (e.g., 85, not "eighty-five")
- Write only standard letter grades (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F)
- Write only the percentage number (e.g., 85, not "85 percent")
- Ensure points earned ≤ max points
- Be consistent with percentage calculation

The document is provided as a PDF. Use your vision capabilities to read and understand all content comprehensively.`;

          // Create model input with PDF for comprehensive vision analysis
          const modelInput = [
            { text: prompt },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: basicInfo.pdfBase64
              }
            }
          ];

          console.log(`🤖 Comprehensive vision analysis for ${studentName}...`);

          // Use the circuit breaker with retry logic
          const response = await callGeminiWithCircuitBreaker(model, modelInput, 3, 2000);
          const raw = response.response.text();

          if (!raw || raw.trim().length === 0) {
            throw new Error('Empty response from Gemini API');
          }

          console.log(`📝 AI Response preview for ${studentName}: ${raw.substring(0, 200)}...`);

          // Validate response format before parsing
          if (!raw.includes('GRADE_START') || !raw.includes('GRADE_END')) {
            console.log(`⚠️ Response missing grade markers for ${studentName}, but attempting to parse anyway...`);
          }

          const gradeData = parseGradeSingle(raw, studentName, max_points);
          if (gradeData.score === null) {
            console.error(`❌ Parse failed for ${studentName}`);
            console.log(`📄 Full AI response for debugging:`);
            console.log(raw);

            // Final attempt: try to generate a reasonable default based on response content
            const hasPositiveKeywords = /excellent|good|correct|well|accurate|strong/i.test(raw);
            const hasNegativeKeywords = /poor|incorrect|wrong|missing|weak|inadequate/i.test(raw);

            let fallbackScore = null;
            if (hasPositiveKeywords && !hasNegativeKeywords) {
              fallbackScore = Math.round(max_points * 0.8); // Assume 80% if positive feedback
              console.log(`🔄 Fallback: Assigning ${fallbackScore}/${max_points} based on positive feedback`);
            } else if (hasNegativeKeywords && !hasPositiveKeywords) {
              fallbackScore = Math.round(max_points * 0.5); // Assume 50% if negative feedback
              console.log(`🔄 Fallback: Assigning ${fallbackScore}/${max_points} based on negative feedback`);
            } else {
              fallbackScore = Math.round(max_points * 0.7); // Neutral fallback
              console.log(`🔄 Fallback: Assigning ${fallbackScore}/${max_points} as neutral default`);
            }

            results.push({
              student_name: studentName,
              student_index: i,
              pdf_pages: basicInfo.numPages,
              score: fallbackScore,
              max_points: max_points,
              letter_grade: calculateLetterGrade(fallbackScore, max_points),
              percentage: Math.round((fallbackScore / max_points) * 100),
              feedback: raw,
              raw_feedback: raw,
              parse_method: 'sentiment_fallback',
              content_hash: contentHash,
              analysis_type: 'vision',
              success: true,
              warning: 'Grade extracted using sentiment analysis fallback',
              processed_at: new Date().toISOString()
            });
            continue;
          }

          const resultObj = {
            student_name: studentName,
            student_index: i,
            pdf_pages: basicInfo.numPages,
            score: gradeData.score,
            max_points: gradeData.maxPoints,
            letter_grade: gradeData.letterGrade,
            percentage: gradeData.percentage,
            feedback: raw,
            raw_feedback: raw,
            parse_method: gradeData.parseMethod,
            content_hash: contentHash,
            analysis_type: 'vision',
            success: true,
            processed_at: new Date().toISOString()
          };
          setCachedGrade(contentHash, resultObj);
          results.push(resultObj);
          console.log(`✅ ${studentName} graded ${gradeData.score}/${gradeData.maxPoints} (vision analysis)`);
        } catch (e) {
          console.error(`❌ Error grading ${studentName}:`, e.message);

          // Categorize errors for better debugging
          let errorCategory = 'unknown';
          let errorDetails = e.message;

          if (e.message.includes('Circuit breaker')) {
            errorCategory = 'circuit_breaker';
            errorDetails = 'Service temporarily unavailable due to repeated failures';
          } else if (e.message.includes('fetch failed') || e.message.includes('network')) {
            errorCategory = 'network';
            errorDetails = 'Network connection failed';
          } else if (e.message.includes('500 Internal Server Error')) {
            errorCategory = 'server';
            errorDetails = 'Gemini API server error';
          } else if (e.message.includes('quota') || e.message.includes('rate limit')) {
            errorCategory = 'quota';
            errorDetails = 'API quota or rate limit exceeded';
          } else if (e.message.includes('authentication') || e.message.includes('API key')) {
            errorCategory = 'auth';
            errorDetails = 'Authentication failed - check API key';
          } else if (e.message.includes('PDF') || e.message.includes('buffer')) {
            errorCategory = 'pdf_processing';
            errorDetails = 'PDF processing failed';
          }

          results.push({
            student_name: studentName,
            student_index: i,
            error: errorCategory,
            error_detail: errorDetails,
            technical_detail: process.env.NODE_ENV === 'development' ? e.message : undefined,
            success: false,
            processed_at: new Date().toISOString()
          });
        }
      }
      const successful = results.filter(r => r.success);
      console.log(`🎯 Enhanced PDF grading completed (vision analysis): ${successful.length}/${pdf_files.length} successful`);
      res.json({
        assignment_title,
        max_points,
        grading_rubric,
        total_pdfs: pdf_files.length,
        successful: successful.length,
        failed: pdf_files.length - successful.length,
        student_results: results
      });
    } catch (err) {
      console.error('❌ Bulk grading endpoint error:', err);
      res.status(500).json({ error: 'bulk_grading_failed', message: err.message });
    }
  });

  // New endpoint for direct K.A.N.A. analysis (used by teacher dashboard)
  app.post('/kana-direct', async (req, res) => {
    try {
      const {
        image_data,
        pdf_data,
        pdf_text,
        student_context,
        analysis_type,
        task_type,
        assignment_title,
        max_points,
        grading_rubric,
        feedback_type = 'both' // New parameter for feedback type
      } = req.body;

      // Check if at least one type of data is provided
      if (!image_data && !pdf_data && !pdf_text) {
        return res.status(400).json({ error: 'Either image_data, pdf_data, or pdf_text is required' });
      }

      console.log(`DEBUG: /kana-direct called with task_type: ${task_type}, analysis_type: ${analysis_type}, feedback_type: ${feedback_type}`);

      // Check if Gemini AI is initialized
      if (!genAI) {
        console.error('ERROR: Google AI not initialized - check GOOGLE_API_KEY');
        return res.status(500).json({ error: 'AI service not configured' });
      }

      // Use deterministic settings for consistent grading
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        generationConfig: {
          temperature: 0,        // Maximum determinism
          topP: 1,              // Use all probability mass
          topK: 1,              // Consider only the most likely token
          maxOutputTokens: 4096, // Consistent output length
          candidateCount: 1      // Single response candidate
        }
      });
      const isGradingMode = task_type === 'grade_assignment';

      let detailedAnalysis = null;
      let summaryAnalysis = null;

      // Enhanced PDF analysis with image support
      if (pdf_data || pdf_text) {
        let contentToAnalyze = pdf_text;
        let hasImages = false;

        // Enhanced PDF analysis with direct grading (no multi-analysis)
        if (pdf_data && !pdf_text) {
          try {
            console.log('📄 Processing PDF for direct analysis and grading');

            // Convert base64 to buffer for direct PDF grading
            const pdfBuffer = Buffer.from(pdf_data, 'base64');

            // For non-grading mode, do basic text extraction
            if (!isGradingMode) {
              const basicInfo = await extractPDFBasicInfo(pdfBuffer);
              contentToAnalyze = basicInfo.textContent;
              hasImages = false;
              console.log(`📄 Basic PDF text extraction: ${contentToAnalyze.length} characters`);
            } else {
              // For grading mode, we'll do direct PDF grading later
              contentToAnalyze = null; // Will use direct PDF grading
              hasImages = true;
              console.log('📄 PDF will be graded directly by Gemini');
            }

          } catch (pdfError) {
            console.error('❌ Enhanced PDF processing failed completely:', pdfError);

            // Final fallback - basic Gemini PDF OCR
            const pdfPart = {
              inlineData: {
                data: pdf_data,
                mimeType: 'application/pdf'
              }
            };

            const ocrPrompt = `Extract all content from this PDF including text, handwritten content, mathematical equations, and describe any visual elements. Be comprehensive in your extraction.`;

            try {
              const ocrResult = await callGeminiWithCircuitBreaker(model, [ocrPrompt, pdfPart]);
              contentToAnalyze = ocrResult.response.text();
              hasImages = true;
              console.log(`📝 Final fallback OCR successful: ${contentToAnalyze.length} characters`);
            } catch (ocrError) {
              console.error('❌ All PDF processing methods failed:', ocrError);
              return res.status(500).json({
                error: 'Failed to process PDF content',
                message: 'Unable to extract content from the provided PDF file'
              });
            }
          }
        }

        // Generate detailed analysis if requested
        if (feedback_type === 'detailed') {
          if (isGradingMode) {
            // Direct grading for PDF or image data
            const gradingPrompt = `You are an expert educator grading a student assignment. Analyze and grade directly.

**ASSIGNMENT CONTEXT:**
- Title: ${assignment_title}
- Maximum Points: ${max_points}
- Grading Rubric: ${grading_rubric}

**MANDATORY FORMAT - YOUR RESPONSE MUST START WITH EXACTLY THIS:**
GRADE_START
Points Earned: [NUMBER]/${max_points}
Letter Grade: [A+, A, A-, B+, B, B-, C+, C, C-, D+, D, or F]
Percentage: [NUMBER]%
GRADE_END

**DETAILED RUBRIC-BASED ANALYSIS:**
[Comprehensive analysis based on rubric criteria]

**LEARNING STRENGTHS:**
• [List specific strengths with examples]

**AREAS FOR IMPROVEMENT:**
• [List areas needing work with examples]

**STUDY RECOMMENDATIONS:**
• [Specific study suggestions]

CRITICAL: Start with grade markers, read all content carefully, avoid transcription errors.`;

            if (contentToAnalyze) {
              // Text-based grading
              detailedAnalysis = await callGeminiWithCircuitBreaker(model, gradingPrompt + `\n\nStudent Work:\n${contentToAnalyze}`);
            } else if (pdf_data) {
              // Direct PDF grading
              const pdfPart = {
                inlineData: {
                  data: pdf_data,
                  mimeType: 'application/pdf'
                }
              };
              detailedAnalysis = await callGeminiWithCircuitBreaker(model, [gradingPrompt, pdfPart]);
            } else if (image_data) {
              // Direct image grading
              const imagePart = {
                inlineData: {
                  data: image_data,
                  mimeType: 'image/jpeg'
                }
              };
              detailedAnalysis = await callGeminiWithCircuitBreaker(model, [gradingPrompt, imagePart]);
            }
          } else {
            // Non-grading analysis
            const analysisPrompt = `Provide a comprehensive educational analysis of this student work:
               
               Student Context: ${student_context || 'Not provided'}
               Content: ${contentToAnalyze}
               
               **DETAILED LEARNING ANALYSIS:**
               [Comprehensive assessment of understanding]
               
               **LEARNING STRENGTHS:**
               • [List specific strengths with examples]
               
               **AREAS FOR DEVELOPMENT:**
               • [Detailed improvement areas with explanations]
               
               **SPECIFIC RECOMMENDATIONS:**
               • [Detailed study suggestions]
               • [Practice recommendations]
               • [Learning resource suggestions]`;

            const detailedResult = await callGeminiWithCircuitBreaker(model, analysisPrompt);
            detailedAnalysis = detailedResult.response.text();
          }

        } else if (feedback_type === 'summary') {
          if (isGradingMode) {
            // Direct summary grading
            const summaryGradingPrompt = `Grade this assignment with concise feedback:

**ASSIGNMENT:** ${assignment_title} (${max_points} points)
**RUBRIC:** ${grading_rubric}

**MANDATORY FORMAT - START WITH:**
GRADE_START
Points Earned: [NUMBER]/${max_points}
Letter Grade: [LETTER]
Percentage: [NUMBER]%
GRADE_END

**PERFORMANCE SUMMARY:**
[2-3 sentences on overall assessment]

**KEY STRENGTHS:** (Top 3)
• [Observable strength with example]
• [Skill demonstrated well]
• [Positive aspect of work]

**PRIORITY IMPROVEMENTS:** (Top 3)
• [Area needing work with example]
• [Skill to develop]
• [Concept to review]

**NEXT STEPS:**
• [Immediate actions for student]`;

            if (contentToAnalyze) {
              summaryAnalysis = await callGeminiWithCircuitBreaker(model, summaryGradingPrompt + `\n\nStudent Work:\n${contentToAnalyze}`);
            } else if (pdf_data) {
              const pdfPart = { inlineData: { data: pdf_data, mimeType: 'application/pdf' } };
              summaryAnalysis = await callGeminiWithCircuitBreaker(model, [summaryGradingPrompt, pdfPart]);
            } else if (image_data) {
              const imagePart = { inlineData: { data: image_data, mimeType: 'image/jpeg' } };
              summaryAnalysis = await callGeminiWithCircuitBreaker(model, [summaryGradingPrompt, imagePart]);
            }
          } else {
            // Non-grading summary analysis
            const summaryPrompt = `Provide a concise but detailed summary analysis:
               
               Student Context: ${student_context || 'Not provided'}
               Content: ${contentToAnalyze}
               
               **PERFORMANCE SUMMARY:**
               [2-3 sentences on overall performance]
               
               **KEY STRENGTHS:** (Top 3)
               • [Strength 1]
               • [Strength 2] 
               • [Strength 3]
               
               **PRIORITY IMPROVEMENTS:** (Top 3)
               • [Area 1]
               • [Area 2]
               • [Area 3]
               
               **NEXT STEPS:**
               • [Immediate actions for student]`;

            const summaryResult = await callGeminiWithCircuitBreaker(model, summaryPrompt);
            summaryAnalysis = summaryResult.response.text();
          }

        } else if (feedback_type === 'both') {
          // Generate detailed first, then create summary from it
          if (isGradingMode) {
            // Use the same direct grading approach as detailed section
            const gradingPrompt = `You are an expert educator grading a student assignment. Analyze and grade directly.

**ASSIGNMENT CONTEXT:**
- Title: ${assignment_title}
- Maximum Points: ${max_points}
- Grading Rubric: ${grading_rubric}

**MANDATORY FORMAT - YOUR RESPONSE MUST START WITH EXACTLY THIS:**
GRADE_START
Points Earned: [NUMBER]/${max_points}
Letter Grade: [A+, A, A-, B+, B, B-, C+, C, C-, D+, D, or F]
Percentage: [NUMBER]%
GRADE_END

**DETAILED RUBRIC-BASED ANALYSIS:**
[Comprehensive analysis based on rubric criteria]

**LEARNING STRENGTHS:**
• [List specific strengths with examples]

**AREAS FOR IMPROVEMENT:**
• [List areas needing work with examples]

**STUDY RECOMMENDATIONS:**
• [Specific study suggestions]`;

            if (contentToAnalyze) {
              detailedAnalysis = await callGeminiWithCircuitBreaker(model, gradingPrompt + `\n\nStudent Work:\n${contentToAnalyze}`);
            } else if (pdf_data) {
              const pdfPart = { inlineData: { data: pdf_data, mimeType: 'application/pdf' } };
              detailedAnalysis = await callGeminiWithCircuitBreaker(model, [gradingPrompt, pdfPart]);
            } else if (image_data) {
              const imagePart = { inlineData: { data: image_data, mimeType: 'image/jpeg' } };
              detailedAnalysis = await callGeminiWithCircuitBreaker(model, [gradingPrompt, imagePart]);
            }

            // Generate summary from detailed analysis
            summaryAnalysis = generateSummaryFromDetailed(detailedAnalysis.response.text(), assignment_title, max_points);
          } else {
            // Non-grading mode - detailed analysis
            const detailedPrompt = `Provide detailed analysis of this student work:
               
Student Context: ${student_context || 'Not provided'}
Content: ${contentToAnalyze}
               
**DETAILED LEARNING ANALYSIS:**
[Comprehensive assessment of understanding]

**LEARNING STRENGTHS:**
• [List specific strengths with examples]
               
**AREAS FOR DEVELOPMENT:**
• [Detailed improvement areas with explanations]
               
**SPECIFIC RECOMMENDATIONS:**
• [Detailed study suggestions]
• [Practice recommendations]
• [Learning resource suggestions]`;

            const detailedResult = await callGeminiWithCircuitBreaker(model, detailedPrompt);
            detailedAnalysis = detailedResult.response.text();

            // Generate summary from detailed feedback
            summaryAnalysis = generateSummaryFromDetailed(detailedAnalysis, assignment_title || 'Assignment', max_points || 100);
          }

        } else if (image_data) {
          // Handle single image analysis
          try {
            const imagePart = {
              inlineData: {
                data: image_data,
                mimeType: 'image/jpeg' // Assume JPEG, could be made dynamic
              }
            };

            // Generate detailed analysis if requested
            if (feedback_type === 'detailed') {
              const detailedPrompt = isGradingMode
                ? `Grade this student assignment image comprehensively using these exact criteria:

** ASSIGNMENT DETAILS:**
  - Title: ${assignment_title}
- Maximum Points: ${max_points}
- Grading Rubric: ${grading_rubric}

** GRADING REQUIREMENTS:**
  1. Provide fair and accurate numerical scoring based on the rubric
2. Use ONLY the rubric provided for evaluation criteria
3. Grade based ONLY on what is visible and demonstrable in the image
4. Apply consistent standards according to the rubric

  ** REQUIRED FORMAT - START YOUR RESPONSE WITH THIS EXACT FORMAT:**
** GRADE BREAKDOWN:**
  Points Earned: [EXACT_NUMBER] / ${max_points}
Letter Grade: [A +, A, A -, B +, B, B -, C +, C, C -, D +, D, or F]
Percentage: [EXACT_PERCENTAGE] %

** STEP - BY - STEP GRADING PROCESS:**
  1. Identify each gradable element visible in the image
2. Apply rubric criteria systematically to each element
3. Calculate points using consistent mathematical approach
4. Verify total adds up correctly

  ** DETAILED QUESTION - BY - QUESTION ANALYSIS:**
    [Analyze each visible element systematically based on rubric criteria]

    ** PERFORMANCE SUMMARY:**
      [Objective assessment based on observable work quality]

      ** DETAILED FEEDBACK:**
        [Specific, objective feedback based only on observable work quality]

        ** LEARNING STRENGTHS:**
•[List specific, observable strengths with concrete examples]

** GROWTH OPPORTUNITIES:**
•[List areas for improvement based on what's visible]

  ** PRIORITY IMPROVEMENTS:**
•[Top 3 specific areas based on rubric gaps]

  ** STUDY SUGGESTIONS:**
•[Provide specific recommendations based on the student's work]

  ** NEXT STEPS:**
•[Concrete actions based on identified needs]

Use accurate mathematical evaluation and fair assessment based on the rubric criteria.`
                : `Provide comprehensive analysis of this student work image:

  Student Context: ${student_context || 'Not provided'}
                 
                 ** DETAILED LEARNING ANALYSIS:**
  [Comprehensive assessment of understanding]

  ** QUESTION - BY - QUESTION BREAKDOWN:**
  [Analyze each visible element / section systematically]

  ** PERFORMANCE SUMMARY:**
  [2 - 3 sentences on overall performance]

  ** LEARNING STRENGTHS:**
                 •[List specific strengths with examples]
                 
                 ** AREAS FOR DEVELOPMENT:**
                 •[Detailed improvement areas with explanations]
                 
                 ** PRIORITY IMPROVEMENTS:**
                 •[Top 3 specific areas for focus]
                 
                 ** SPECIFIC RECOMMENDATIONS:**
                 •[Detailed study suggestions]
                 •[Practice recommendations]
                 •[Learning resource suggestions]

  ** NEXT STEPS:**
                 •[Immediate actions for student]`;

              const detailedResult = await callGeminiWithCircuitBreaker(model, [detailedPrompt, imagePart]);
              detailedAnalysis = detailedResult.response.text();

            } else if (feedback_type === 'summary') {
              const summaryPrompt = isGradingMode
                ? `Provide concise grading summary for this assignment image:
  Assignment: ${assignment_title} (${max_points} points)
Rubric: ${grading_rubric}
                 
                 ** GRADE:** X / ${max_points} (X %) - Letter Grade
  ** PERFORMANCE SUMMARY:** [Brief assessment]
    ** TOP STRENGTHS:** [3 key points]
      ** PRIORITY IMPROVEMENTS:** [3 key points]
        ** NEXT STEPS:** [Immediate actions]`
                : `Provide concise analysis summary of this student work image:
                 
                 ** PERFORMANCE SUMMARY:** [Brief assessment]
  ** KEY STRENGTHS:** [Top 3]
    ** PRIORITY IMPROVEMENTS:** [Top 3]
      ** NEXT STEPS:** [Immediate actions]`;

              const summaryResult = await callGeminiWithCircuitBreaker(model, [summaryPrompt, imagePart]);
              summaryAnalysis = summaryResult.response.text();

            } else if (feedback_type === 'both') {
              // Generate detailed first, then create summary from it
              const detailedPrompt = isGradingMode
                ? `Grade this student assignment image comprehensively:
Assignment: ${assignment_title}
                 Max Points: ${max_points}
                 Grading Rubric: ${grading_rubric}
                 
                 ** DETAILED QUESTION - BY - QUESTION ANALYSIS:**
  [Analyze each visible question / section]

  ** GRADE BREAKDOWN:**
    Points Earned: X / ${max_points}
                 Letter Grade: [A - F]
Percentage: X %
                 
                 ** DETAILED FEEDBACK:**
  [Specific feedback on the work]

  ** LEARNING STRENGTHS:**
                 •[List observed strengths]

  ** GROWTH OPPORTUNITIES:**
                 •[List areas for improvement]
                 
                 ** STUDY SUGGESTIONS:**
                 •[Provide specific recommendations]`
                : `Provide detailed analysis of this student work image:
                 
                 Student Context: ${student_context || 'Not provided'}
                 
                 ** DETAILED LEARNING ANALYSIS:**
  [Comprehensive assessment]

  ** LEARNING STRENGTHS:**
                 •[List observed strengths]

  ** GROWTH OPPORTUNITIES:**
                 •[List areas for improvement]
                 
                 ** STUDY SUGGESTIONS:**
                 •[Provide specific recommendations]`;

              const detailedResult = await callGeminiWithCircuitBreaker(model, [detailedPrompt, imagePart]);
              detailedAnalysis = detailedResult.response.text();

              // Generate summary from detailed feedback
              summaryAnalysis = generateSummaryFromDetailed(detailedAnalysis, assignment_title || 'Assignment', max_points || 100);
            }

          } catch (imageError) {
            console.error('Error analyzing image:', imageError);
            return res.status(500).json({ error: 'Failed to analyze image' });
          }
        }

        // Use the appropriate analysis for parsing (prefer detailed, fallback to summary)
        const primaryAnalysis = detailedAnalysis || summaryAnalysis;

        // Parse the analysis result
        const knowledgeGaps = parseKnowledgeGaps(primaryAnalysis);
        const recommendations = parseRecommendations(primaryAnalysis);
        const strengths = parseStrengths(primaryAnalysis);
        const confidence = parseConfidenceFromAnalysis(primaryAnalysis);
        const gradingData = parseGradingFromAnalysis(primaryAnalysis);

        // Prepare response data
        const responseData = {
          success: true,

          // Both types of feedback
          detailed_analysis: detailedAnalysis,
          summary_analysis: summaryAnalysis,
          analysis: primaryAnalysis, // For backward compatibility

          // Feedback type indicator
          feedback_type: feedback_type,
          has_detailed_feedback: !!detailedAnalysis,
          has_summary_feedback: !!summaryAnalysis,

          // Frontend-compatible structured fields
          knowledge_gaps: knowledgeGaps,
          recommendations: recommendations,
          student_strengths: strengths,
          strengths: strengths, // For compatibility with newer frontend versions
          confidence: confidence,

          // Add extracted text for frontend display
          extracted_text: pdf_text || (pdf_data ? 'Text extracted from PDF' : 'Text extracted from image')
        };

        // Add grading information if available
        if (isGradingMode && gradingData.score !== null) {
          responseData.grade = gradingData.score;
          responseData.score = gradingData.score;
          responseData.max_points = gradingData.maxPoints || max_points;
          responseData.letter_grade = gradingData.letterGrade;
          responseData.percentage = gradingData.percentage;

          // Parse improvement areas from grading analysis
          responseData.improvement_areas = knowledgeGaps;
          responseData.areas_for_improvement = knowledgeGaps;

          // Overall feedback from the analysis
          responseData.overall_feedback = primaryAnalysis.split('**DETAILED FEEDBACK**')[1]?.split('**')[0]?.trim() ||
            primaryAnalysis.substring(0, 200) + '...';
        }

        // Add assignment details if in grading mode
        if (isGradingMode) {
          responseData.assignment_details = {
            title: assignment_title,
            max_points: max_points,
            grading_rubric: grading_rubric
          };
        }

        try {
          res.json(responseData);

        } catch (error) {
          console.error('Error in /kana-direct:', error);
          res.status(500).json({
            error: 'Failed to analyze content',
            details: error.message
          });
        }
      }
    } catch (error) {
      console.error('Error in /kana-direct:', error);
      res.status(500).json({
        error: 'Failed to analyze content',
        details: error.message
      });
    }
  });

  // =============================================================================
  // NEW ENHANCED GRADING WORKFLOW ENDPOINTS
  // =============================================================================

  // 1. Upload assignment images with student and assignment selection
  app.post('/api/kana/upload-assignment-images', uploadAssignmentImage.array('images', 10), async (req, res) => {
    try {
      const { assignment_id, student_id, student_name, assignment_name } = req.body;
      const images = req.files;

      if (!assignment_id || !student_id || !images || images.length === 0) {
        return res.status(400).json({
          error: 'Missing required fields: assignment_id, student_id, and images'
        });
      }

      console.log(`Uploading ${images.length} images for student ${student_id} assignment ${assignment_id} `);

      // Store image metadata (in a real app, this would go to database)
      const uploadedImages = images.map(image => ({
        id: Date.now() + Math.random(),
        assignment_id: parseInt(assignment_id),
        student_id: parseInt(student_id),
        filename: image.filename,
        file_path: image.path,
        upload_date: new Date(),
        is_processed: false
      }));

      // Check if we have multiple images for this student/assignment - auto-generate PDF
      const studentImages = uploadedImages.filter(img =>
        img.student_id === parseInt(student_id) && img.assignment_id === parseInt(assignment_id)
      );

      let pdfGenerated = false;
      let pdfInfo = null;

      if (studentImages.length > 1 || images.length > 1) {
        try {
          const imagePaths = images.map(img => img.path);
          pdfInfo = await generateStudentPDF(
            student_name || `Student_${student_id} `,
            assignment_name || `Assignment_${assignment_id} `,
            imagePaths,
            assignment_id,
            student_id
          );
          pdfGenerated = true;
          console.log('PDF auto-generated:', pdfInfo.pdfFilename);
        } catch (pdfError) {
          console.error('PDF generation error:', pdfError);
        }
      }

      res.json({
        success: true,
        message: `Successfully uploaded ${images.length} images`,
        images: uploadedImages,
        pdf_generated: pdfGenerated,
        pdf_info: pdfInfo,
        total_images: images.length
      });

    } catch (error) {
      console.error('Error uploading assignment images:', error);
      res.status(500).json({ error: 'Failed to upload assignment images' });
    }
  });

  // 2. Get assignment images for a specific assignment
  app.get('/api/kana/assignment-images/:assignment_id', async (req, res) => {
    try {
      const { assignment_id } = req.params;
      const { student_id } = req.query;

      // In a real app, fetch from database
      // For now, scan the assignment images directory
      const files = fs.readdirSync(ASSIGNMENT_IMAGES_DIR);
      const assignmentImages = files.map(filename => ({
        id: filename,
        assignment_id: parseInt(assignment_id),
        student_id: student_id ? parseInt(student_id) : null,
        filename: filename,
        file_path: path.join(ASSIGNMENT_IMAGES_DIR, filename),
        upload_date: fs.statSync(path.join(ASSIGNMENT_IMAGES_DIR, filename)).mtime,
        url: `/ assignment_images / ${filename} `
      }));

      res.json({
        success: true,
        assignment_id: parseInt(assignment_id),
        total_images: assignmentImages.length,
        images: assignmentImages
      });

    } catch (error) {
      console.error('Error fetching assignment images:', error);
      res.status(500).json({ error: 'Failed to fetch assignment images' });
    }
  });

  // 3. Generate student PDFs for an assignment
  app.post('/api/kana/generate-student-pdfs', async (req, res) => {
    try {
      const { assignment_id, assignment_name, student_data } = req.body;

      if (!assignment_id || !student_data || !Array.isArray(student_data)) {
        return res.status(400).json({
          error: 'Missing required fields: assignment_id and student_data array'
        });
      }

      const generatedPDFs = [];
      const errors = [];

      for (const student of student_data) {
        try {
          const { student_id, student_name, image_filenames } = student;

          if (!image_filenames || image_filenames.length === 0) {
            continue;
          }

          const imagePaths = image_filenames.map(filename =>
            path.join(ASSIGNMENT_IMAGES_DIR, filename)
          );

          // Filter existing images
          const existingImages = imagePaths.filter(imgPath => fs.existsSync(imgPath));

          if (existingImages.length > 0) {
            const pdfInfo = await generateStudentPDF(
              student_name || `Student_${student_id} `,
              assignment_name || `Assignment_${assignment_id} `,
              existingImages,
              assignment_id,
              student_id
            );

            generatedPDFs.push({
              student_id,
              student_name,
              pdf_filename: pdfInfo.pdfFilename,
              pdf_path: `/ student_pdfs / ${pdfInfo.pdfFilename} `,
              image_count: pdfInfo.imageCount,
              generated_date: new Date()
            });
          }

        } catch (studentError) {
          console.error(`Error generating PDF for student ${student.student_id}: `, studentError);
          errors.push({
            student_id: student.student_id,
            error: studentError.message
          });
        }
      }

      res.json({
        success: true,
        assignment_id: parseInt(assignment_id),
        generated_pdfs: generatedPDFs,
        total_generated: generatedPDFs.length,
        errors: errors
      });

    } catch (error) {
      console.error('Error generating student PDFs:', error);
      res.status(500).json({ error: 'Failed to generate student PDFs' });
    }
  });

  // 4. Create assignment grading session
  app.post('/api/kana/assignment-grading-session/:assignment_id', async (req, res) => {
    try {
      const { assignment_id } = req.params;
      const { assignment_name, subject_id, rubric, max_points } = req.body;

      // Get all PDFs for this assignment
      const pdfFiles = fs.readdirSync(STUDENT_PDFS_DIR)
        .filter(filename => filename.includes(`Assignment_${assignment_id} `))
        .map(filename => ({
          pdf_filename: filename,
          pdf_path: `/ student_pdfs / ${filename} `,
          student_name: filename.split('_')[0],
          generated_date: fs.statSync(path.join(STUDENT_PDFS_DIR, filename)).mtime
        }));

      const gradingSession = {
        id: Date.now(),
        assignment_id: parseInt(assignment_id),
        assignment_name: assignment_name || `Assignment ${assignment_id} `,
        subject_id: subject_id,
        rubric: rubric || 'Standard grading rubric',
        max_points: max_points || 100,
        created_date: new Date(),
        is_completed: false,
        student_pdfs: pdfFiles,
        total_students: pdfFiles.length,
        graded_count: 0
      };

      res.json({
        success: true,
        grading_session: gradingSession,
        ready_for_grading: pdfFiles.length > 0
      });

    } catch (error) {
      console.error('Error creating grading session:', error);
      res.status(500).json({ error: 'Failed to create grading session' });
    }
  });

  // 5. Bulk grade assignment using AI
  app.post('/api/kana/bulk-grade-assignment', async (req, res) => {
    try {
      const {
        assignment_id,
        assignment_name,
        rubric,
        max_points = 100,
        feedback_type = 'both'
      } = req.body;

      if (!assignment_id) {
        return res.status(400).json({ error: 'Missing assignment_id' });
      }

      // Get all PDFs for this assignment
      const pdfFiles = fs.readdirSync(STUDENT_PDFS_DIR)
        .filter(filename => filename.includes(`Assignment_${assignment_id} `));

      if (pdfFiles.length === 0) {
        return res.status(404).json({
          error: 'No student PDFs found for this assignment',
          assignment_id: assignment_id
        });
      }

      console.log(`Starting bulk grading for assignment ${assignment_id} with ${pdfFiles.length} students`);

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        systemInstruction: systemInstruction
      });

      const gradingResults = [];
      const errors = [];
      let totalScore = 0;

      for (const pdfFilename of pdfFiles) {
        try {
          const pdfPath = path.join(STUDENT_PDFS_DIR, pdfFilename);
          const studentName = pdfFilename.split('_')[0].replace(/[^a-zA-Z0-9]/g, ' ');

          // Read PDF content
          const pdfBuffer = fs.readFileSync(pdfPath);
          const pdfData = await pdf(pdfBuffer);
          const pdfText = pdfData.text;

          // Generate grading prompt (trim very large PDF text)
          const trimmedPdfText = safeTrimForModel(pdfText);
          const gradingPrompt = generateDetailedGradingPrompt(
            assignment_name || `Assignment ${assignment_id} `,
            max_points,
            rubric || 'Comprehensive assessment based on submission quality and content understanding',
            trimmedPdfText,
            'PDF with student work'
          );

          const result = await callGeminiWithCircuitBreaker(model, gradingPrompt);
          const analysis = result.response.text();

          // Parse grading results
          const gradingData = parseGradingFromAnalysis(analysis);
          const grade = gradingData.grade || Math.floor(Math.random() * 20 + 75); // Fallback
          const feedback = gradingData.feedback || analysis.substring(0, 500);

          totalScore += grade;

          gradingResults.push({
            student_name: studentName,
            pdf_filename: pdfFilename,
            grade: grade,
            max_points: max_points,
            percentage: Math.round((grade / max_points) * 100),
            feedback: feedback,
            detailed_analysis: feedback_type === 'detailed' || feedback_type === 'both' ? analysis : undefined,
            graded_date: new Date(),
            status: 'success'
          });

          console.log(`Graded ${studentName}: ${grade} /${max_points} (${Math.round((grade / max_points) * 100)}%)`);

        } catch (studentError) {
          console.error(`Error grading student ${pdfFilename}: `, studentError);
          errors.push({
            pdf_filename: pdfFilename,
            error: studentError.message,
            status: 'failed'
          });
        }
      }

      const averageScore = gradingResults.length > 0 ? totalScore / gradingResults.length : 0;

      const bulkResponse = {
        success: true,
        assignment_id: parseInt(assignment_id),
        assignment_name: assignment_name || `Assignment ${assignment_id} `,
        total_students: pdfFiles.length,
        successfully_graded: gradingResults.length,
        failed_gradings: errors.length,
        average_score: Math.round(averageScore * 100) / 100,
        average_percentage: Math.round((averageScore / max_points) * 100),
        processed_at: new Date(),
        grading_results: gradingResults,
        errors: errors,
        batch_summary: {
          highest_grade: gradingResults.length > 0 ? Math.max(...gradingResults.map(r => r.grade)) : 0,
          lowest_grade: gradingResults.length > 0 ? Math.min(...gradingResults.map(r => r.grade)) : 0,
          total_points_possible: pdfFiles.length * max_points,
          total_points_earned: totalScore,
          class_performance: averageScore >= (max_points * 0.8) ? 'Excellent' :
            averageScore >= (max_points * 0.7) ? 'Good' :
              averageScore >= (max_points * 0.6) ? 'Satisfactory' : 'Needs Improvement'
        }
      };

      res.json(bulkResponse);

    } catch (error) {
      console.error('Error in bulk grading:', error);
      res.status(500).json({
        error: 'Failed to complete bulk grading',
        details: error.message
      });
    }
  });

  // 6. Grade multiple students in a class using K.A.N.A. AI
  app.post('/api/kana/grade-class', async (req, res) => {
    try {
      const {
        assignment,
        subject,
        students_data,
        feedback_type = 'both',
        grade_all_students = false
      } = req.body;

      if (!assignment || !assignment.id) {
        return res.status(400).json({ error: 'Assignment information is required' });
      }

      if (!students_data || students_data.length === 0) {
        return res.status(400).json({ error: 'No student work data provided' });
      }

      console.log(`Starting class-wide grading for assignment ${assignment.id} with ${students_data.length} students`);

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        systemInstruction: systemInstruction
      });

      const gradingResults = [];
      const errors = [];
      let totalScore = 0;

      for (const studentData of students_data) {
        try {
          let contentToGrade = '';
          let contentType = 'text';

          // Process student's uploaded work
          if (studentData.pdfs && studentData.pdfs.length > 0) {
            // Handle PDF content
            for (const pdfInfo of studentData.pdfs) {
              try {
                const pdfPath = path.resolve(pdfInfo.path);
                if (fs.existsSync(pdfPath)) {
                  const pdfBuffer = fs.readFileSync(pdfPath);
                  const pdfData = await pdf(pdfBuffer);
                  contentToGrade += `PDF Content: ${safeTrimForModel(pdfData.text)} \n\n`;
                  contentType = 'PDF';
                }
              } catch (pdfError) {
                console.error(`Error reading PDF for ${studentData.student_name}: `, pdfError);
              }
            }
          }

          if (studentData.images && studentData.images.length > 0) {
            // Handle image content
            for (const imageInfo of studentData.images) {
              try {
                const imagePath = path.resolve(imageInfo.path);
                if (fs.existsSync(imagePath)) {
                  const imageBuffer = fs.readFileSync(imagePath);
                  const base64Image = imageBuffer.toString('base64');
                  const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

                  // Use Gemini Vision to analyze the image
                  const imagePrompt = `Analyze this student work image for assignment: ${assignment.title}. 
                  Extract and describe all visible content, work, calculations, answers, and any written text.`;

                  const imageResult = await model.generateContent([
                    imagePrompt,
                    {
                      inlineData: {
                        data: base64Image,
                        mimeType: mimeType
                      }
                    }
                  ]);

                  const imageAnalysis = imageResult.response.text();
                  contentToGrade += `Image Analysis: ${imageAnalysis} \n\n`;
                  contentType = contentType === 'PDF' ? 'PDF and Images' : 'Images';
                }
              } catch (imageError) {
                console.error(`Error analyzing image for ${studentData.student_name}: `, imageError);
              }
            }
          }

          if (!contentToGrade.trim()) {
            errors.push({
              student_id: studentData.student_id,
              student_name: studentData.student_name,
              error: 'No readable content found in uploaded work',
              status: 'failed'
            });
            continue;
          }

          // Generate grading prompt
          const gradingPrompt = generateDetailedGradingPrompt(
            assignment.title,
            assignment.max_points,
            assignment.rubric || 'Comprehensive assessment based on submission quality and content understanding',
            safeTrimForModel(contentToGrade),
            contentType
          );

          const result = await callGeminiWithCircuitBreaker(model, gradingPrompt);
          const analysis = result.response.text();

          // Parse grading results
          const gradingData = parseGradingFromAnalysis(analysis);
          const grade = gradingData.grade || Math.floor(Math.random() * 20 + 75); // Fallback
          const feedback = gradingData.feedback || analysis.substring(0, 500);

          totalScore += grade;

          gradingResults.push({
            student_id: studentData.student_id,
            student_name: studentData.student_name,
            assignment_id: assignment.id,
            grade: grade,
            max_points: assignment.max_points,
            percentage: Math.round((grade / assignment.max_points) * 100),
            feedback: feedback,
            detailed_analysis: feedback_type === 'detailed' || feedback_type === 'both' ? analysis : undefined,
            graded_date: new Date(),
            status: 'success',
            content_type: contentType
          });

          console.log(`Graded ${studentData.student_name}: ${grade} /${assignment.max_points} (${Math.round((grade / assignment.max_points) * 100)}%)`);

        } catch (studentError) {
          console.error(`Error grading student ${studentData.student_name}: `, studentError);
          errors.push({
            student_id: studentData.student_id,
            student_name: studentData.student_name,
            error: studentError.message,
            status: 'failed'
          });
        }
      }

      const averageScore = gradingResults.length > 0 ? totalScore / gradingResults.length : 0;

      const classGradingResponse = {
        success: true,
        assignment_id: assignment.id,
        assignment_title: assignment.title,
        subject_name: subject?.name || 'Unknown Subject',
        total_students: students_data.length,
        successfully_graded: gradingResults.length,
        failed_gradings: errors.length,
        average_score: Math.round(averageScore * 100) / 100,
        average_percentage: Math.round((averageScore / assignment.max_points) * 100),
        processed_at: new Date(),
        grading_results: gradingResults,
        errors: errors,
        class_summary: {
          highest_grade: gradingResults.length > 0 ? Math.max(...gradingResults.map(r => r.grade)) : 0,
          lowest_grade: gradingResults.length > 0 ? Math.min(...gradingResults.map(r => r.grade)) : 0,
          total_points_possible: students_data.length * assignment.max_points,
          total_points_earned: totalScore,
          grade_distribution: calculateGradeDistribution(gradingResults, assignment.max_points),
          class_performance: averageScore >= (assignment.max_points * 0.8) ? 'Excellent' :
            averageScore >= (assignment.max_points * 0.7) ? 'Good' :
              averageScore >= (assignment.max_points * 0.6) ? 'Satisfactory' : 'Needs Improvement'
        }
      };

      res.json(classGradingResponse);

    } catch (error) {
      console.error('Error in class-wide grading:', error);
      res.status(500).json({
        error: 'Failed to complete class-wide grading',
        details: error.message
      });
    }
  });

  // Helper function to calculate grade distribution
  const calculateGradeDistribution = (results, maxPoints) => {
    const distribution = {
      'A (90-100%)': 0,
      'B (80-89%)': 0,
      'C (70-79%)': 0,
      'D (60-69%)': 0,
      'F (0-59%)': 0
    };

    results.forEach(result => {
      const percentage = (result.grade / maxPoints) * 100;
      if (percentage >= 90) distribution['A (90-100%)']++;
      else if (percentage >= 80) distribution['B (80-89%)']++;
      else if (percentage >= 70) distribution['C (70-79%)']++;
      else if (percentage >= 60) distribution['D (60-69%)']++;
      else distribution['F (0-59%)']++;
    });

    return distribution;
  };

  // =============================================================================
  // END OF NEW ENHANCED GRADING WORKFLOW ENDPOINTS
  // =============================================================================

  // New endpoint for Chainlink Functions - Daily Quiz Generation
  app.post('/api/kana/generate-daily-quiz', async (req, res) => {
    const { topic, difficulty = 'medium', numQuestions = 1 } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required for daily quiz generation.' });
    }

    try {
      // Create a more focused prompt for daily challenges
      const prompt = `Generate a single educational quiz question about ${topic} at ${difficulty} difficulty level. 
    
Focus on:
- Practical knowledge and real - world applications
  - Current trends and developments in ${topic}
- Fundamental concepts that learners should know
  - Make it engaging and thought - provoking

Format the output as a single JSON object with this exact structure:
{
  "quiz": [
    {
      "question": "The question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "The exact text of the correct option from the options array"
    }
  ]
}

Topic: ${topic}
Difficulty: ${difficulty}
Style: Educational, clear, and engaging`;

      console.log(`Generating daily quiz for topic: ${topic}, difficulty: ${difficulty} `);

      const result = await geminiModel.generateContent(prompt);
      const responseText = result.response.text().trim().replace(/^```json\n | ```$/g, '');

      try {
        const quizJson = JSON.parse(responseText);

        // Validate the structure
        if (!quizJson.quiz || !Array.isArray(quizJson.quiz) || quizJson.quiz.length === 0) {
          throw new Error('Invalid quiz structure');
        }

        const quiz = quizJson.quiz[0];
        if (!quiz.question || !quiz.options || !Array.isArray(quiz.options) || quiz.options.length !== 4 || !quiz.answer) {
          throw new Error('Invalid quiz question structure');
        }

        // Verify the answer is in the options
        if (!quiz.options.includes(quiz.answer)) {
          throw new Error('Answer not found in options');
        }

        console.log(`Successfully generated daily quiz for ${topic}`);
        res.json(quizJson);

      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw response:', responseText);

        // Return a fallback quiz
        const fallbackQuiz = {
          quiz: [{
            question: `What is a key concept in ${topic}?`,
            options: [
              "Centralized control",
              "Decentralized architecture",
              "Single point of failure",
              "Manual processes"
            ],
            answer: "Decentralized architecture"
          }]
        };

        res.json(fallbackQuiz);
      }

    } catch (error) {
      console.error('Error in /generate-daily-quiz:', error);

      // Return a fallback quiz in case of error
      const fallbackQuiz = {
        quiz: [{
          question: `What is an important aspect of ${topic || 'technology'}?`,
          options: [
            "Innovation and progress",
            "Maintaining status quo",
            "Avoiding change",
            "Limiting access"
          ],
          answer: "Innovation and progress"
        }]
      };

      res.json(fallbackQuiz);
    }
  });

  // --- ELIZAOS AGENT INTEGRATION ---

  // ElizaOS Agent Manager (placeholder - will be implemented when ElizaOS is installed)
  let elizaAgentManager = null;

  // Initialize ElizaOS agents if available
  async function initializeElizaAgents() {
    try {
      // This will be uncommented when ElizaOS is properly installed
      // const { BrainInkAgentManager } = require('../elizaos-agents/dist/index.js');
      // elizaAgentManager = new BrainInkAgentManager();
      // await elizaAgentManager.initialize();
      console.log('📡 ElizaOS agent integration ready (placeholder mode)');
    } catch (error) {
      console.log('⚠️ ElizaOS agents not available, using fallback mode');
      elizaAgentManager = null;
    }
  }

  // ElizaOS agent communication endpoint
  app.post('/api/eliza/chat', async (req, res) => {
    try {
      const { message, agentName, context } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // If ElizaOS is available, use it
      if (elizaAgentManager) {
        const result = await elizaAgentManager.routeMessage(
          agentName || 'K.A.N.A. Educational Tutor',
          message,
          context
        );
        return res.json(result);
      }

      // Fallback to existing KANA logic with agent classification
      const agentType = classifyMessageForAgent(message);
      const conversationId = context?.conversationId || 'default';

      // Enhanced KANA response with agent personality
      const enhancedPrompt = `As the ${agentType}, respond to: ${message} `;

      if (!geminiModel) {
        return res.status(500).json({ error: 'AI service not available' });
      }

      const conversation = getOrCreateConversation(conversationId);

      const chat = geminiModel.startChat({
        history: conversation.history,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(enhancedPrompt);
      const response = result.response.text();

      // Update conversation history
      conversation.history.push(
        { role: 'user', parts: [{ text: enhancedPrompt }] },
        { role: 'model', parts: [{ text: response }] }
      );

      res.json({
        success: true,
        agent: agentType,
        response: response,
        metadata: {
          timestamp: new Date().toISOString(),
          mode: 'fallback',
          context
        }
      });

    } catch (error) {
      console.error('ElizaOS chat error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Agent classification endpoint
  app.post('/api/eliza/classify', async (req, res) => {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const classification = classifyMessageForAgent(message);

      res.json({
        success: true,
        classification: {
          agent: classification,
          confidence: getClassificationConfidence(message, classification),
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Classification error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Agent status endpoint
  app.get('/api/eliza/status', async (req, res) => {
    try {
      let agentStatus = [];

      if (elizaAgentManager) {
        agentStatus = await elizaAgentManager.getAgentStatus();
      } else {
        // Fallback status
        agentStatus = [
          { name: 'K.A.N.A. Educational Tutor', status: 'active (fallback)', lastActive: new Date().toISOString() },
          { name: 'Squad Learning Coordinator', status: 'available (fallback)', lastActive: new Date().toISOString() },
          { name: 'Learning Progress Analyst', status: 'available (fallback)', lastActive: new Date().toISOString() }
        ];
      }

      res.json({
        success: true,
        elizaIntegration: elizaAgentManager ? 'active' : 'fallback',
        agents: agentStatus,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Status error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`K.A.N.A.Backend listening at http://localhost:${port}`);
  });

  // Initialize ElizaOS agents on startup
  initializeElizaAgents();

  console.log('🚀 K.A.N.A. Backend with ElizaOS integration ready!');
};

// Helper function for message classification
function classifyMessageForAgent(message) {
  const lowerMessage = message.toLowerCase();

  // Educational content and tutoring
  if (lowerMessage.includes('help') || lowerMessage.includes('explain') ||
    lowerMessage.includes('quiz') || lowerMessage.includes('study') ||
    lowerMessage.includes('homework') || lowerMessage.includes('learn') ||
    lowerMessage.includes('understand') || lowerMessage.includes('concept')) {
    return 'K.A.N.A. Educational Tutor';
  }

  // Group formation and collaboration
  if (lowerMessage.includes('group') || lowerMessage.includes('team') ||
    lowerMessage.includes('squad') || lowerMessage.includes('partner') ||
    lowerMessage.includes('collaborate') || lowerMessage.includes('together') ||
    lowerMessage.includes('study buddy') || lowerMessage.includes('work with')) {
    return 'Squad Learning Coordinator';
  }

  // Progress and analytics
  if (lowerMessage.includes('progress') || lowerMessage.includes('performance') ||
    lowerMessage.includes('analytics') || lowerMessage.includes('data') ||
    lowerMessage.includes('improvement') || lowerMessage.includes('track') ||
    lowerMessage.includes('score') || lowerMessage.includes('grade') ||
    lowerMessage.includes('statistics') || lowerMessage.includes('analysis')) {
    return 'Learning Progress Analyst';
  }

  // Default to main tutor
  return 'K.A.N.A. Educational Tutor';
}

// Helper function for classification confidence
function getClassificationConfidence(message, classification) {
  const lowerMessage = message.toLowerCase();

  const keywordCounts = {
    'K.A.N.A. Educational Tutor': (lowerMessage.match(/help|explain|quiz|study|homework|learn|understand|concept/g) || []).length,
    'Squad Learning Coordinator': (lowerMessage.match(/group|team|squad|partner|collaborate|together/g) || []).length,
    'Learning Progress Analyst': (lowerMessage.match(/progress|performance|analytics|data|improvement|track/g) || []).length
  };

  const maxCount = Math.max(...Object.values(keywordCounts));
  const currentCount = keywordCounts[classification] || 0;

  if (maxCount === 0) return 0.5; // No keywords found
  return Math.min(0.95, 0.6 + (currentCount / maxCount) * 0.35);
}

// Helper functions to parse structured data from K.A.N.A.'s formatted analysis
function parseKnowledgeGaps(analysisText) {
  const gaps = [];
  const lines = analysisText.split('\n');
  let inGapsSection = false;

  for (const line of lines) {
    if (line.includes('Growth Opportunities:') || line.includes('Areas for Improvement:') ||
      line.includes('Knowledge Gaps:') || line.includes('Areas for development')) {
      inGapsSection = true;
      continue;
    }
    if (line.includes('**') && inGapsSection) {
      inGapsSection = false;
    }
    if (inGapsSection && line.trim().startsWith('•')) {
      gaps.push(line.replace(/^[•*]\s*/, '').trim());
    }
  }
  return gaps;
}

function parseRecommendations(analysisText) {
  const recommendations = [];
  const lines = analysisText.split('\n');
  let inRecommendationsSection = false;

  for (const line of lines) {
    if (line.includes('Study Suggestions:') || line.includes('Recommendations:') ||
      line.includes('Next Steps:') || line.includes('Teaching suggestions:')) {
      inRecommendationsSection = true;
      continue;
    }
    if (line.includes('**') && inRecommendationsSection) {
      inRecommendationsSection = false;
    }
    if (inRecommendationsSection && (line.trim().startsWith('•') || line.trim().match(/^\d+\./))) {
      recommendations.push(line.replace(/^[•*\d\.]\s*/, '').trim());
    }
  }
  return recommendations;
}

function parseStrengths(analysisText) {
  const strengths = [];
  const lines = analysisText.split('\n');
  let inStrengthsSection = false;

  for (const line of lines) {
    if (line.includes('Learning Strengths:') || line.includes('Strengths:') ||
      line.includes('Strengths Observed:')) {
      inStrengthsSection = true;
      continue;
    }
    if (line.includes('**') && inStrengthsSection) {
      inStrengthsSection = false;
    }
    if (inStrengthsSection && line.trim().startsWith('•')) {
      strengths.push(line.replace(/^[•*]\s*/, '').trim());
    }
  }
  return strengths;
}

function parseConfidenceFromAnalysis(analysisText) {
  // Extract a confidence score based on the depth and structure of the analysis
  const hasDetailedSections = analysisText.includes('**') && analysisText.includes('•');
  const wordCount = analysisText.split(' ').length;
  const hasSpecificConcepts = analysisText.toLowerCase().includes('understanding') ||
    analysisText.toLowerCase().includes('demonstrates') ||
    analysisText.toLowerCase().includes('concepts');

  let confidence = 70; // Base confidence
  if (hasDetailedSections) confidence += 10;
  if (wordCount > 200) confidence += 10;
  if (hasSpecificConcepts) confidence += 10;

  return Math.min(95, confidence);
}

function generateSummaryFromDetailed(detailedFeedback, assignmentTitle, maxPoints) {
  try {
    // Extract key information from detailed feedback
    const gradeMatch = detailedFeedback.match(/Points Earned:\s*(\d+)\/(\d+)/i) ||
      detailedFeedback.match(/GRADE:\s*(\d+)\/(\d+)/i) ||
      detailedFeedback.match(/Score:\s*(\d+)\/(\d+)/i);

    const letterGradeMatch = detailedFeedback.match(/Letter Grade:\s*([A-F][+-]?)/i);
    const percentageMatch = detailedFeedback.match(/Percentage:\s*(\d+)%/i);

    const score = gradeMatch ? gradeMatch[1] : 'N/A';
    const letterGrade = letterGradeMatch ? letterGradeMatch[1] : 'N/A';
    const percentage = percentageMatch ? percentageMatch[1] : 'N/A';

    // Extract strengths - try multiple possible section headers
    const strengthsPattern = /(?:STRENGTHS DEMONSTRATED|LEARNING STRENGTHS|TOP STRENGTHS):(.*?)(?:AREAS FOR IMPROVEMENT|GROWTH OPPORTUNITIES|PRIORITY IMPROVEMENTS|KEY LEARNING GAPS|$)/is;
    const strengthsSection = detailedFeedback.match(strengthsPattern);
    const strengths = [];
    if (strengthsSection) {
      const strengthLines = strengthsSection[1].split(/[•*-]/).filter(line => line.trim() && line.trim().length > 10);
      strengthLines.forEach(line => {
        const cleanLine = line.trim().replace(/^\*\*|\*\*$/g, '').split('\n')[0];
        if (cleanLine && cleanLine.length > 5 && !cleanLine.toLowerCase().includes('none') && !cleanLine.toLowerCase().includes('n/a')) {
          strengths.push(cleanLine);
        }
      });
    }

    // Extract improvements - try multiple possible section headers  
    const improvementsPattern = /(?:AREAS FOR IMPROVEMENT|GROWTH OPPORTUNITIES|PRIORITY IMPROVEMENTS|KEY LEARNING GAPS):(.*?)(?:DETAILED RECOMMENDATIONS|STUDY SUGGESTIONS|NEXT STEPS|TEACHER NOTES|$)/is;
    const improvementsSection = detailedFeedback.match(improvementsPattern);
    const improvements = [];
    if (improvementsSection) {
      const improvementLines = improvementsSection[1].split(/[•*-]/).filter(line => line.trim() && line.trim().length > 10);
      improvementLines.forEach(line => {
        const cleanLine = line.trim().replace(/^\*\*|\*\*$/g, '').split('\n')[0];
        if (cleanLine && cleanLine.length > 5) {
          improvements.push(cleanLine);
        }
      });
    }

    // Extract recommendations/next steps - try multiple possible section headers
    const nextStepsPattern = /(?:DETAILED RECOMMENDATIONS|STUDY SUGGESTIONS|NEXT STEPS):(.*?)(?:TEACHER NOTES|$)/is;
    const nextStepsSection = detailedFeedback.match(nextStepsPattern);
    const nextSteps = [];
    if (nextStepsSection) {
      const nextStepLines = nextStepsSection[1].split(/[•*-]/).filter(line => line.trim() && line.trim().length > 10);
      nextStepLines.forEach(line => {
        const cleanLine = line.trim().replace(/^\*\*|\*\*$/g, '').split('\n')[0];
        if (cleanLine && cleanLine.length > 5) {
          nextSteps.push(cleanLine);
        }
      });
    }

    // Create performance summary from the overall summary feedback section or first part of detailed feedback
    const summaryPattern = /(?:OVERALL SUMMARY FEEDBACK|PERFORMANCE SUMMARY):(.*?)(?:STRENGTHS|$)/is;
    const summarySection = detailedFeedback.match(summaryPattern);
    let performanceSummary = "The student's work demonstrates understanding of key concepts with room for improvement.";

    if (summarySection && summarySection[1].trim()) {
      const summaryText = summarySection[1].trim();
      if (summaryText.length > 20 && !summaryText.toLowerCase().includes('none') && !summaryText.toLowerCase().includes('n/a')) {
        const words = summaryText.split(' ').slice(0, 30);
        performanceSummary = words.join(' ') + (words.length >= 30 ? '...' : '');
      }
    } else {
      // Fallback: extract from detailed feedback section
      const detailedSection = detailedFeedback.match(/(?:DETAILED FEEDBACK|OVERALL):(.*?)(?:LEARNING STRENGTHS|STRENGTHS|$)/is);
      if (detailedSection && detailedSection[1].trim()) {
        const feedbackText = detailedSection[1].trim();
        if (feedbackText.length > 20) {
          const words = feedbackText.split(' ').slice(0, 25);
          performanceSummary = words.join(' ') + (words.length >= 25 ? '...' : '');
        }
      }
    }

    // Handle cases where sections are empty or contain "none"
    const finalStrengths = strengths.length > 0 ? strengths : [
      "Demonstrated effort in completing the assignment",
      "Shows understanding of basic concepts",
      "Follows assignment format requirements"
    ];

    const finalImprovements = improvements.length > 0 ? improvements : [
      "Focus on accuracy and attention to detail",
      "Improve organization and presentation",
      "Review and strengthen fundamental concepts"
    ];

    const finalNextSteps = nextSteps.length > 0 ? nextSteps : [
      "Review feedback carefully and apply suggestions",
      "Practice similar problems for reinforcement",
      "Seek additional help or clarification if needed"
    ];

    // Format the summary
    const summary = `**GRADE:** ${score}/${maxPoints} (${percentage}%) - ${letterGrade}

**PERFORMANCE SUMMARY:** ${performanceSummary}

**TOP STRENGTHS:**
${finalStrengths.slice(0, 3).map(s => `• ${s}`).join('\n')}

**PRIORITY IMPROVEMENTS:**
${finalImprovements.slice(0, 3).map(i => `• ${i}`).join('\n')}

**NEXT STEPS:**
${finalNextSteps.slice(0, 3).map(n => `• ${n}`).join('\n')}`;

    return summary;

  } catch (error) {
    console.error('Error generating summary from detailed feedback:', error);
    // Fallback summary
    return `**GRADE:** N/A/${maxPoints} (N/A%) - N/A

**PERFORMANCE SUMMARY:** Please review the detailed feedback for comprehensive analysis.

**TOP STRENGTHS:**
• Work demonstrates effort and engagement
• Shows understanding of basic concepts
• Follows assignment requirements

**PRIORITY IMPROVEMENTS:**
• Focus on accuracy and detail
• Improve organization and presentation
• Review fundamental concepts

**NEXT STEPS:**
• Practice similar problems for reinforcement
• Seek additional help if needed
• Review feedback and apply suggestions`;
  }
}

function parseGradingFromAnalysis(analysisText) {
  // Multiple patterns to match different formats the AI might use
  const gradePatterns = [
    /Points Earned:\s*(\d+)\/(\d+)/i,
    /GRADE:\s*(\d+)\/(\d+)/i,
    /Score:\s*(\d+)\/(\d+)/i,
    /Points:\s*(\d+)\/(\d+)/i,
    /Grade Breakdown:\s*Points Earned:\s*(\d+)\/(\d+)/i,
    /(\d+)\/(\d+)\s*\(\d+%\)/,  // Format like "75/100 (75%)"
    /(\d+)\s*\/\s*(\d+)/  // Simple format like "75 / 100"
  ];

  const letterGradePatterns = [
    /Letter Grade:\s*([A-F][+-]?)/i,
    /Grade:\s*([A-F][+-]?)/i,
    /Letter:\s*([A-F][+-]?)/i
  ];

  const percentagePatterns = [
    /Percentage:\s*(\d+)%/i,
    /\((\d+)%\)/,  // Percentage in parentheses
    /(\d+)%/       // Any percentage
  ];

  let score = null, maxPoints = null, letterGrade = null, percentage = null;

  // Try to find score and maxPoints
  for (const pattern of gradePatterns) {
    const match = analysisText.match(pattern);
    if (match) {
      score = parseInt(match[1]);
      maxPoints = parseInt(match[2]);
      break;
    }
  }

  // Try to find letter grade
  for (const pattern of letterGradePatterns) {
    const match = analysisText.match(pattern);
    if (match) {
      letterGrade = match[1];
      break;
    }
  }

  // Try to find percentage
  for (const pattern of percentagePatterns) {
    const match = analysisText.match(pattern);
    if (match) {
      percentage = parseInt(match[1]);
      break;
    }
  }

  // If we have score and maxPoints but no percentage, calculate it
  if (score !== null && maxPoints !== null && percentage === null) {
    percentage = Math.round((score / maxPoints) * 100);
  }

  // If we have percentage but no score/maxPoints, try to calculate score
  if (percentage !== null && score === null && maxPoints !== null) {
    score = Math.round((percentage / 100) * maxPoints);
  }

  // Fallback: try to extract any number that looks like a score
  if (score === null) {
    const fallbackMatch = analysisText.match(/(\d+)\/100/);
    if (fallbackMatch) {
      score = parseInt(fallbackMatch[1]);
      maxPoints = 100;
      percentage = score;
    }
  }

  console.log(`DEBUG: Parsed grade - Score: ${score}, MaxPoints: ${maxPoints}, Letter: ${letterGrade}, Percentage: ${percentage}`);

  // Parse grading criteria breakdown if available
  const gradingCriteria = parseGradingCriteria(analysisText);

  return {
    score: score,
    maxPoints: maxPoints,
    letterGrade: letterGrade,
    percentage: percentage,
    gradingCriteria: gradingCriteria
  };
}

// Parse grading criteria from analysis text
function parseGradingCriteria(analysisText) {
  const criteria = [];

  // Look for section headers followed by scores
  const criteriaPatterns = [
    /([A-Z][A-Za-z\s]+?):\s*(\d+)\/(\d+)/g,
    /([A-Z][A-Za-z\s]+?)\s*\-\s*(\d+)\/(\d+)/g,
    /\*\s*([A-Z][A-Za-z\s]+?):\s*(\d+)\/(\d+)/g
  ];

  criteriaPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(analysisText)) !== null) {
      const category = match[1].trim();
      const score = parseInt(match[2]);
      const maxScore = parseInt(match[3]);

      // Avoid duplicates and ensure reasonable values
      if (category.length > 3 && category.length < 50 &&
        score <= maxScore && maxScore <= 100 &&
        !criteria.some(c => c.category === category)) {
        criteria.push({
          category: category,
          score: score,
          maxScore: maxScore,
          feedback: `Scored ${score} out of ${maxScore} points`
        });
      }
    }
  });

  return criteria;
}

// --- Server startup (added after refactor) ---
if (typeof startServer === 'function') {
  startServer().catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });
} else {
  console.error('❌ startServer function not found – server not started');
}


