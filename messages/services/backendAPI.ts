import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Base provider for blockchain interactions
const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY || '', provider);

// Contract addresses (to be updated after deployment)
const contracts = {
  xpToken: process.env.XP_CONTRACT_ADDRESS || '',
  badgeNFT: '',
  squadScore: '',
  bountyVault: ''
};

// Gemini AI configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// In-memory storage (in production, use a proper database)
let userProfiles: any = {};
let squadData: any = {};
let dailyPrompts: any = {};
let quizSessions: any = {};
let leaderboardData: any = {};

// Helper function to call Gemini AI
async function callGeminiAI(prompt: string): Promise<string> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini AI error:', error);
    throw error;
  }
}

// Helper function to interact with XP Token contract
async function awardXP(userAddress: string, amount: number, reason: string): Promise<boolean> {
  try {
    if (!contracts.xpToken) return false;

    const xpTokenABI = [
      "function mintXP(address user, uint256 baseAmount, string memory reason) external"
    ];
    
    const xpContract = new ethers.Contract(contracts.xpToken, xpTokenABI, wallet);
    const tx = await xpContract.mintXP(userAddress, ethers.parseEther(amount.toString()), reason);
    await tx.wait();
    
    console.log(`XP awarded: ${amount} to ${userAddress} for ${reason}`);
    return true;
  } catch (error) {
    console.error('Error awarding XP:', error);
    return false;
  }
}

// Routes

// 🤖 AI Agent Chat Endpoint
app.post('/api/kana/chat', async (req, res) => {
  try {
    const { message, context, user_address } = req.body;
    
    // Get user profile for personalized responses
    const userProfile = userProfiles[user_address] || {
      xpBalance: 0,
      streak: 0,
      subjects: ['General'],
      weakAreas: [],
      preferences: {}
    };

    const prompt = `You are Kana, an AI study coach for BrainInk. 
    
User Profile:
- XP: ${userProfile.xpBalance}
- Streak: ${userProfile.streak} days
- Subjects: ${userProfile.subjects.join(', ')}
- Weak areas: ${userProfile.weakAreas.join(', ')}

User message: "${message}"

Respond as a helpful, encouraging study coach. Keep responses under 200 words. 
Use emojis and be motivational. If they ask for help with a specific topic, provide educational content.`;

    const aiResponse = await callGeminiAI(prompt);
    
    res.json({
      response: aiResponse,
      type: 'text',
      metadata: {
        userProfile,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// 📚 Daily Study Prompt Generation
app.post('/api/daily-prompt', async (req, res) => {
  try {
    const { user_address, difficulty = 'medium', subject } = req.body;
    
    const userProfile = userProfiles[user_address] || {};
    const subjects = subject ? [subject] : userProfile.subjects || ['Mathematics', 'Science'];
    const selectedSubject = subjects[Math.floor(Math.random() * subjects.length)];
    
    const prompt = `Generate a ${difficulty} level study question for ${selectedSubject}. 
    
    User's weak areas: ${userProfile.weakAreas?.join(', ') || 'None identified'}
    
    Create a challenging but educational question. Return JSON format:
    {
      "question": "the question text",
      "subject": "${selectedSubject}",
      "difficulty": "${difficulty}",
      "xp_reward": number between 10-50,
      "hints": ["hint1", "hint2"],
      "expected_answer_type": "text/multiple_choice/calculation"
    }`;

    const aiResponse = await callGeminiAI(prompt);
    const promptData = JSON.parse(aiResponse);
    
    // Store prompt for answer validation
    const promptId = `prompt_${Date.now()}_${user_address}`;
    dailyPrompts[promptId] = {
      ...promptData,
      id: promptId,
      user_address,
      created_at: new Date().toISOString(),
      answered: false
    };
    
    res.json({
      id: promptId,
      ...promptData,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Daily prompt error:', error);
    res.status(500).json({ error: 'Failed to generate daily prompt' });
  }
});

// ✅ Answer Submission and Scoring
app.post('/api/submit-answer', async (req, res) => {
  try {
    const { prompt_id, answer, user_address } = req.body;
    
    const prompt = dailyPrompts[prompt_id];
    if (!prompt || prompt.answered) {
      return res.status(400).json({ error: 'Invalid or already answered prompt' });
    }
    
    // Score the answer using AI
    const scoringPrompt = `Score this student answer:

Question: ${prompt.question}
Subject: ${prompt.subject}
Student Answer: ${answer}

Evaluate on accuracy, completeness, and understanding. Return JSON:
{
  "score": number 0-100,
  "feedback": "detailed constructive feedback",
  "correct": boolean,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]
}`;

    const aiResponse = await callGeminiAI(scoringPrompt);
    const scoring = JSON.parse(aiResponse);
    
    // Calculate XP earned
    const baseXP = prompt.xp_reward || 20;
    const xpEarned = Math.floor(baseXP * (scoring.score / 100));
    
    // Award XP on blockchain
    if (xpEarned > 0) {
      await awardXP(user_address, xpEarned, `Answer submission: ${prompt.subject}`);
    }
    
    // Mark prompt as answered
    dailyPrompts[prompt_id].answered = true;
    dailyPrompts[prompt_id].answer = answer;
    dailyPrompts[prompt_id].scoring = scoring;
    
    // Update user profile
    if (!userProfiles[user_address]) {
      userProfiles[user_address] = { xpBalance: 0, totalAnswers: 0, subjects: [] };
    }
    
    userProfiles[user_address].xpBalance += xpEarned;
    userProfiles[user_address].totalAnswers++;
    
    // Track weak areas
    if (scoring.score < 70) {
      if (!userProfiles[user_address].weakAreas) {
        userProfiles[user_address].weakAreas = [];
      }
      if (!userProfiles[user_address].weakAreas.includes(prompt.subject)) {
        userProfiles[user_address].weakAreas.push(prompt.subject);
      }
    }
    
    res.json({
      score: scoring.score,
      feedback: scoring.feedback,
      xp_earned: xpEarned,
      correct: scoring.correct,
      strengths: scoring.strengths,
      improvements: scoring.improvements
    });
  } catch (error) {
    console.error('Answer submission error:', error);
    res.status(500).json({ error: 'Failed to process answer submission' });
  }
});

// 🎯 Quiz Drop Generation
app.get('/api/quiz-drop', async (req, res) => {
  try {
    const { subject, difficulty = 'medium' } = req.query;
    
    const prompt = `Generate a ${difficulty} multiple choice quiz question${subject ? ` about ${subject}` : ''}.

Return JSON format:
{
  "question": "the question text",
  "options": ["option A", "option B", "option C", "option D"],
  "correct_answer": index of correct option (0-3),
  "explanation": "why this answer is correct",
  "subject": "subject area",
  "difficulty": "${difficulty}",
  "xp_reward": number 10-30 based on difficulty
}`;

    const aiResponse = await callGeminiAI(prompt);
    const quizData = JSON.parse(aiResponse);
    
    // Store quiz for validation
    const quizId = `quiz_${Date.now()}`;
    quizSessions[quizId] = {
      ...quizData,
      id: quizId,
      created_at: new Date().toISOString()
    };
    
    res.json({
      id: quizId,
      ...quizData
    });
  } catch (error) {
    console.error('Quiz drop error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// 📊 Submit Quiz Answer
app.post('/api/quiz-drop/:quizId/submit', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answer, user_address } = req.body;
    
    const quiz = quizSessions[quizId];
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    const correct = answer === quiz.correct_answer;
    const xpEarned = correct ? quiz.xp_reward : Math.floor(quiz.xp_reward * 0.3);
    
    // Award XP
    if (xpEarned > 0) {
      await awardXP(user_address, xpEarned, `Quiz: ${quiz.subject}`);
    }
    
    // Update user profile
    if (!userProfiles[user_address]) {
      userProfiles[user_address] = { xpBalance: 0, totalQuizzes: 0 };
    }
    
    userProfiles[user_address].xpBalance += xpEarned;
    userProfiles[user_address].totalQuizzes = (userProfiles[user_address].totalQuizzes || 0) + 1;
    
    if (correct) {
      userProfiles[user_address].correctAnswers = (userProfiles[user_address].correctAnswers || 0) + 1;
    }
    
    res.json({
      correct,
      explanation: quiz.explanation,
      xp_earned: xpEarned,
      correct_answer: quiz.correct_answer
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ error: 'Failed to submit quiz answer' });
  }
});

// 👥 Squad Leaderboard
app.get('/api/squad-leaderboard', async (req, res) => {
  try {
    // In production, this would fetch from SquadScore contract
    const mockLeaderboard = [
      { id: 1, name: "Brain Busters", weeklyScore: 1250, members: 8, totalStaked: 500 },
      { id: 2, name: "Study Warriors", weeklyScore: 1100, members: 6, totalStaked: 400 },
      { id: 3, name: "Knowledge Seekers", weeklyScore: 980, members: 7, totalStaked: 600 },
      { id: 4, name: "Academic Aces", weeklyScore: 850, members: 5, totalStaked: 300 },
      { id: 5, name: "Learning Legends", weeklyScore: 720, members: 4, totalStaked: 250 }
    ];
    
    res.json({
      leaderboard: mockLeaderboard,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// 📈 User Stats
app.get('/api/user-stats/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    
    const profile = userProfiles[userAddress] || {
      xpBalance: 0,
      streak: 0,
      totalAnswers: 0,
      totalQuizzes: 0,
      correctAnswers: 0,
      weakAreas: [],
      subjects: [],
      badges: []
    };
    
    // Calculate accuracy
    const accuracy = profile.totalQuizzes > 0 ? 
      Math.round((profile.correctAnswers / profile.totalQuizzes) * 100) : 0;
    
    res.json({
      ...profile,
      accuracy,
      rank: calculateUserRank(userAddress),
      suggestions: generatePersonalizedSuggestions(profile)
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// 🎁 Agent Drop (Random Bonus)
app.post('/api/agent-drop', async (req, res) => {
  try {
    const { user_address } = req.body;
    
    const dropTypes = [
      { type: 'xp_bonus', xp: 25, message: '🎁 Surprise XP Bonus!' },
      { type: 'study_tip', xp: 15, message: '💡 Study Tip: Try the Pomodoro Technique!' },
      { type: 'motivation', xp: 10, message: '🌟 Keep pushing forward!' },
      { type: 'quiz_bonus', xp: 35, message: '⚡ Special Quiz Bonus XP!' }
    ];
    
    const drop = dropTypes[Math.floor(Math.random() * dropTypes.length)];
    
    // Award bonus XP
    await awardXP(user_address, drop.xp, 'Agent Drop Bonus');
    
    // Update user profile
    if (!userProfiles[user_address]) {
      userProfiles[user_address] = { xpBalance: 0 };
    }
    userProfiles[user_address].xpBalance += drop.xp;
    
    res.json({
      type: drop.type,
      message: drop.message,
      xp_earned: drop.xp,
      rarity: Math.random() > 0.8 ? 'rare' : 'common'
    });
  } catch (error) {
    console.error('Agent drop error:', error);
    res.status(500).json({ error: 'Failed to process agent drop' });
  }
});

// 🏆 Achievements and Badges
app.get('/api/achievements/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    const profile = userProfiles[userAddress] || {};
    
    const achievements = checkAchievements(profile);
    
    res.json({
      earned_badges: achievements.earned,
      available_badges: achievements.available,
      progress: achievements.progress
    });
  } catch (error) {
    console.error('Achievements error:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// 🔍 Study Recommendations
app.get('/api/recommendations/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    const profile = userProfiles[userAddress] || {};
    
    const recommendations = await generateStudyRecommendations(profile);
    
    res.json({
      recommendations,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// 🤖 AI Chat Endpoint (used by aiAgentService)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userProfile, context } = req.body;
    
    const prompt = `You are Kana, an AI study coach for BrainInk, a gamified learning platform. 

User Profile:
- XP Balance: ${userProfile?.xpBalance || 0}
- Current Streak: ${userProfile?.streak || 0} days
- Badges Earned: ${userProfile?.badges || 0}
- Squad: ${userProfile?.squadId > 0 ? `Member of Squad ${userProfile.squadId}` : 'Not in a squad'}

User Message: "${message}"

Guidelines:
1. Be encouraging and motivational
2. Suggest gamified learning strategies
3. Reference their XP, streaks, and badges when relevant
4. Promote squad collaboration
5. Keep responses concise but helpful
6. Use emojis to make it engaging

Respond naturally as a helpful study coach.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    res.json({
      content: aiResponse,
      type: 'text',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      content: "Sorry, I'm having trouble right now. Please try again later! 🤖",
      type: 'text'
    });
  }
});

// 👤 User Profile Endpoint (used by tribeMatchingService)
app.get('/api/user-profile/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    
    // Mock user profile generation based on address
    const profile = {
      address: userAddress,
      interests: ['learning', 'technology', 'science'],
      studyHabits: ['visual', 'interactive', 'spaced-repetition'],
      skillLevel: Math.floor(Math.random() * 8) + 2, // 2-10
      activeHours: [9, 10, 11, 14, 15, 16, 19, 20],
      subjects: ['math', 'physics', 'chemistry', 'biology'],
      personality: ['curious', 'analytical', 'collaborative'],
      goals: ['skill-improvement', 'exam-preparation', 'knowledge-expansion']
    };

    res.json(profile);
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// 🧠 User Embedding Endpoint (used by tribeMatchingService)
app.post('/api/user-embedding', async (req, res) => {
  try {
    const { profile } = req.body;
    
    // Generate simple embedding based on profile
    const vector = new Array(50).fill(0).map(() => Math.random() * 2 - 1);
    
    const embedding = {
      address: profile.address,
      vector,
      lastUpdated: new Date(),
      profile
    };

    res.json(embedding);
  } catch (error) {
    console.error('Embedding error:', error);
    res.status(500).json({ error: 'Failed to create embedding' });
  }
});

// 👥 Similar Users Endpoint (used by tribeMatchingService)
app.get('/api/similar-users/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    const { limit = 5 } = req.query;
    
    // Mock similar users data
    const mockUsers = [
      {
        userAddress: '0x1234567890abcdef1234567890abcdef12345678',
        similarity: 0.87,
        profile: {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          interests: ['math', 'physics'],
          studyHabits: ['visual'],
          skillLevel: 7,
          subjects: ['calculus', 'mechanics']
        },
        compatibilityReasons: ['Both study physics', 'Similar skill levels', 'Compatible study schedules']
      }
    ];

    res.json(mockUsers.slice(0, parseInt(limit as string)));
  } catch (error) {
    console.error('Similar users error:', error);
    res.status(500).json({ error: 'Failed to find similar users' });
  }
});

// 💬 Intro Message Endpoint (used by tribeMatchingService)
app.post('/api/intro-message', async (req, res) => {
  try {
    const { userAddress1, userAddress2, matchResult } = req.body;
    
    console.log(`Triggering intro message between ${userAddress1} and ${userAddress2}`);
    console.log(`Match similarity: ${matchResult.similarity}`);
    
    res.json({ success: true, message: 'Introduction message triggered' });
  } catch (error) {
    console.error('Intro message error:', error);
    res.status(500).json({ error: 'Failed to trigger intro message' });
  }
});

// 🏆 Award XP Endpoint (used by aiAgentService)
app.post('/api/award-xp', async (req, res) => {
  try {
    const { userAddress, amount, reason } = req.body;
    
    try {
      // Award XP via smart contract
      const xpTokenABI = [
        "function mintXP(address user, uint256 baseAmount, string memory reason) external"
      ];
        const xpContract = new ethers.Contract(
        contracts.xpToken,
        xpTokenABI,
        wallet
      );
      
      const tx = await xpContract.mintXP(
        userAddress,
        ethers.parseEther(amount.toString()),
        reason
      );
      
      await tx.wait();
      console.log(`✅ ${amount} XP awarded to ${userAddress} for: ${reason}`);
      
      res.json({ 
        success: true, 
        txHash: tx.hash,
        amount,
        reason 
      });

    } catch (contractError) {
      console.warn('Contract award failed, using mock response:', contractError);
      res.json({ 
        success: true, 
        amount,
        reason,
        mock: true
      });
    }

  } catch (error) {
    console.error('Award XP error:', error);
    res.status(500).json({ error: 'Failed to award XP' });
  }
});

// Helper functions
function calculateUserRank(userAddress: string): number {
  const allUsers = Object.entries(userProfiles)
    .sort(([,a], [,b]) => (b as any).xpBalance - (a as any).xpBalance);
  
  const userIndex = allUsers.findIndex(([addr]) => addr === userAddress);
  return userIndex + 1;
}

function generatePersonalizedSuggestions(profile: any): string[] {
  const suggestions: string[] = [];
  
  if (profile.accuracy < 70) {
    suggestions.push("Focus on reviewing fundamental concepts");
  }
  
  if (profile.weakAreas?.length > 0) {
    suggestions.push(`Study more ${profile.weakAreas[0]} problems`);
  }
  
  if (profile.streak < 7) {
    suggestions.push("Try to build a 7-day study streak");
  }
  
  suggestions.push("Join a study squad for collaborative learning");
  
  return suggestions;
}

function checkAchievements(profile: any): any {
  const earned: Array<{name: string; description: string}> = [];
  const available: Array<{name: string; description: string}> = [];
  const progress: any = {};
  
  // Streak achievements
  if (profile.streak >= 7) {
    earned.push({ name: "Week Warrior", description: "7-day study streak" });
  } else {
    available.push({ name: "Week Warrior", description: "7-day study streak" });
    progress["Week Warrior"] = profile.streak || 0;
  }
  
  // Quiz achievements
  if (profile.totalQuizzes >= 50) {
    earned.push({ name: "Quiz Master", description: "Complete 50 quizzes" });
  } else {
    available.push({ name: "Quiz Master", description: "Complete 50 quizzes" });
    progress["Quiz Master"] = profile.totalQuizzes || 0;
  }
  
  return { earned, available, progress };
}

async function generateStudyRecommendations(profile: any): Promise<string[]> {
  const prompt = `Based on this user's study profile, suggest 3 specific study recommendations:

Profile:
- XP Balance: ${profile.xpBalance || 0}
- Total Quizzes: ${profile.totalQuizzes || 0}
- Accuracy: ${profile.accuracy || 0}%
- Weak Areas: ${profile.weakAreas?.join(', ') || 'None'}
- Subjects: ${profile.subjects?.join(', ') || 'General'}

Return as JSON array of strings: ["recommendation 1", "recommendation 2", "recommendation 3"]`;

  try {
    const aiResponse = await callGeminiAI(prompt);
    return JSON.parse(aiResponse);
  } catch (error) {
    return [
      "Set a daily study goal and stick to it",
      "Practice with quiz drops regularly",
      "Join a study squad for motivation"
    ];
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BrainInk AI Study Bot API running on port ${PORT}`);
  console.log(`📚 Endpoints available:`);
  console.log(`  POST /api/kana/chat - AI chat with Kana`);
  console.log(`  POST /api/daily-prompt - Generate study prompts`);
  console.log(`  POST /api/submit-answer - Submit answers for scoring`);
  console.log(`  GET /api/quiz-drop - Get quiz questions`);
  console.log(`  POST /api/quiz-drop/:id/submit - Submit quiz answers`);
  console.log(`  GET /api/squad-leaderboard - Get squad rankings`);
  console.log(`  GET /api/user-stats/:address - Get user statistics`);
  console.log(`  POST /api/agent-drop - Trigger random bonuses`);
  console.log(`  GET /api/achievements/:address - Get user achievements`);
  console.log(`  GET /api/recommendations/:address - Get study recommendations`);
});

export default app;
