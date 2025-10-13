const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads', 'textbooks');
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

class SyllabusProcessor {
  constructor() {
    this.systemPrompt = `You are K.A.N.A., an advanced AI assistant specialized in educational content analysis and syllabus creation. 

Your task is to analyze textbook content and create a comprehensive weekly syllabus breakdown that:

1. **Analyzes the textbook structure** - Identify chapters, sections, and logical learning progressions
2. **Creates weekly plans** - Break down content into digestible weekly segments
3. **Aligns with academic standards** - Ensure proper pacing and learning objectives
4. **Considers student learning** - Balance theoretical concepts with practical applications

For each week, provide:
- Clear learning objectives
- Topics to be covered
- Relevant textbook chapters/pages
- Suggested assignments/activities
- Additional resources if applicable

Always maintain academic rigor while ensuring content is appropriately paced for the specified term length.`;
  }

  /**
   * Extract text content from PDF buffer
   */
  async extractTextFromPDF(buffer) {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF text extraction failed: ${error.message}`);
    }
  }

  /**
   * Analyze textbook content and generate syllabus structure
   */
  async analyzeTextbook(textContent, termWeeks, subjectName, additionalPreferences = {}) {
    try {
      const analysisPrompt = `
${this.systemPrompt}

**TEXTBOOK ANALYSIS REQUEST**

Subject: ${subjectName}
Term Length: ${termWeeks} weeks
Additional Preferences: ${JSON.stringify(additionalPreferences)}

**TEXTBOOK CONTENT:**
${textContent.substring(0, 50000)} // Limit content to avoid token limits

**INSTRUCTIONS:**
1. Analyze the textbook structure and identify main topics/chapters
2. Create a ${termWeeks}-week syllabus that covers the content systematically
3. Ensure each week has appropriate content load
4. Provide learning objectives that build upon previous weeks

**REQUIRED OUTPUT FORMAT (JSON):**
{
  "analysis_summary": "Brief overview of textbook content and structure",
  "content_overview": {
    "total_chapters": number,
    "main_topics": ["topic1", "topic2", ...],
    "difficulty_progression": "description",
    "estimated_study_hours_per_week": number
  },
  "weekly_plans": [
    {
      "week_number": 1,
      "title": "Week title",
      "description": "What students will learn this week",
      "learning_objectives": ["objective1", "objective2"],
      "topics_covered": ["topic1", "topic2"],
      "textbook_chapters": "Chapters covered (e.g., 'Chapter 1-2')",
      "textbook_pages": "Page range (e.g., 'Pages 1-45')",
      "assignments": ["assignment1", "assignment2"],
      "resources": ["resource1", "resource2"]
    }
    // ... continue for all ${termWeeks} weeks
  ]
}

Return ONLY the JSON object, no additional text.`;

      const result = await model.generateContent(analysisPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse JSON from the response
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        console.error('Raw response:', text);
        
        // Fallback: Create a basic structure
        return this.createFallbackSyllabus(termWeeks, subjectName);
      }
      
    } catch (error) {
      console.error('Textbook analysis failed:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Create a fallback syllabus structure when AI analysis fails
   */
  createFallbackSyllabus(termWeeks, subjectName) {
    const weeklyPlans = [];
    
    for (let week = 1; week <= termWeeks; week++) {
      weeklyPlans.push({
        week_number: week,
        title: `${subjectName} - Week ${week}`,
        description: `Week ${week} content for ${subjectName}`,
        learning_objectives: [
          `Understand key concepts for week ${week}`,
          `Apply learned principles in practical exercises`
        ],
        topics_covered: [`Week ${week} topics`],
        textbook_chapters: `To be determined`,
        textbook_pages: `To be determined`,
        assignments: [`Week ${week} reading assignment`, `Week ${week} practice exercises`],
        resources: [`Textbook chapters`, `Online resources`]
      });
    }

    return {
      analysis_summary: `Basic syllabus structure created for ${termWeeks}-week ${subjectName} course`,
      content_overview: {
        total_chapters: "To be determined",
        main_topics: [`${subjectName} fundamentals`, `${subjectName} applications`],
        difficulty_progression: "Progressive from basic to advanced concepts",
        estimated_study_hours_per_week: 8
      },
      weekly_plans: weeklyPlans
    };
  }

  /**
   * Generate enhanced weekly plan with additional details
   */
  async enhanceWeeklyPlan(weekPlan, textbookContext, subjectName) {
    try {
      const enhancementPrompt = `
${this.systemPrompt}

**WEEKLY PLAN ENHANCEMENT REQUEST**

Subject: ${subjectName}
Week Number: ${weekPlan.week_number}
Current Plan: ${JSON.stringify(weekPlan)}

**TEXTBOOK CONTEXT:**
${textbookContext.substring(0, 10000)}

**TASK:**
Enhance the weekly plan with more specific and detailed content based on the textbook context.

**REQUIRED OUTPUT FORMAT (JSON):**
{
  "week_number": ${weekPlan.week_number},
  "title": "Enhanced week title",
  "description": "Detailed description of what students will learn",
  "learning_objectives": ["specific objective 1", "specific objective 2", "specific objective 3"],
  "topics_covered": ["specific topic 1", "specific topic 2"],
  "textbook_chapters": "Specific chapters referenced",
  "textbook_pages": "Specific page ranges",
  "assignments": ["detailed assignment 1", "detailed assignment 2"],
  "resources": ["specific resource 1", "specific resource 2"]
}

Return ONLY the JSON object.`;

      const result = await model.generateContent(enhancementPrompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Enhancement parsing failed:', parseError);
      }
      
      return weekPlan; // Return original if enhancement fails
      
    } catch (error) {
      console.error('Weekly plan enhancement failed:', error);
      return weekPlan; // Return original plan if enhancement fails
    }
  }

  /**
   * Process uploaded textbook and generate complete syllabus
   */
  async processTextbook(filePath, syllabusId, termWeeks, subjectName, additionalPreferences = {}) {
    try {
      console.log(`Processing textbook for syllabus ${syllabusId}`);
      
      // Read and extract text from PDF
      const buffer = fs.readFileSync(filePath);
      const textContent = await this.extractTextFromPDF(buffer);
      
      console.log(`Extracted ${textContent.length} characters from PDF`);
      
      // Analyze textbook and generate syllabus
      const analysis = await this.analyzeTextbook(textContent, termWeeks, subjectName, additionalPreferences);
      
      console.log(`Generated syllabus with ${analysis.weekly_plans.length} weekly plans`);
      
      // Enhance each weekly plan with more specific details
      const enhancedPlans = [];
      for (const plan of analysis.weekly_plans) {
        try {
          const enhanced = await this.enhanceWeeklyPlan(plan, textContent, subjectName);
          enhancedPlans.push(enhanced);
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to enhance week ${plan.week_number}:`, error);
          enhancedPlans.push(plan); // Use original plan
        }
      }
      
      return {
        success: true,
        syllabus_id: syllabusId,
        analysis_data: {
          analysis_summary: analysis.analysis_summary,
          content_overview: analysis.content_overview,
          processing_date: new Date().toISOString(),
          textbook_length: textContent.length
        },
        weekly_plans: enhancedPlans
      };
      
    } catch (error) {
      console.error('Textbook processing failed:', error);
      return {
        success: false,
        syllabus_id: syllabusId,
        error: error.message,
        weekly_plans: []
      };
    }
  }

  /**
   * Generate quiz questions based on weekly plan content
   */
  async generateWeeklyQuiz(weekPlan, difficulty = 'medium') {
    try {
      const quizPrompt = `
${this.systemPrompt}

**QUIZ GENERATION REQUEST**

Week: ${weekPlan.week_number} - ${weekPlan.title}
Topics: ${JSON.stringify(weekPlan.topics_covered)}
Learning Objectives: ${JSON.stringify(weekPlan.learning_objectives)}
Difficulty: ${difficulty}

**TASK:**
Generate a quiz with 5-10 questions covering the week's topics and learning objectives.

**REQUIRED OUTPUT FORMAT (JSON):**
{
  "quiz_title": "Week ${weekPlan.week_number} Quiz: ${weekPlan.title}",
  "instructions": "Quiz instructions for students",
  "questions": [
    {
      "question": "Question text",
      "type": "multiple_choice", // or "true_false", "short_answer", "essay"
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"], // for multiple choice
      "correct_answer": "B) Option 2", // or answer explanation for other types
      "explanation": "Why this answer is correct",
      "points": 10
    }
  ],
  "total_points": 100,
  "estimated_time": "30 minutes"
}

Return ONLY the JSON object.`;

      const result = await model.generateContent(quizPrompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Quiz generation parsing failed:', parseError);
      }
      
      return null;
      
    } catch (error) {
      console.error('Quiz generation failed:', error);
      return null;
    }
  }
}

module.exports = SyllabusProcessor;
