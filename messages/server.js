#!/usr/bin/env node

/**
 * BrainInk XMTP + AgentKit AI Study Bot
 * Simple JavaScript backend for testing
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

console.log('🧠 BrainInk AI Study Bot - Backend Server');
console.log('========================================\n');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

console.log('✅ Environment variables loaded');
console.log('✅ Express middleware configured');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'BrainInk Messages Backend',
    version: '1.0.0'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'BrainInk Messages Backend is running!',
    features: [
      'XMTP + AgentKit Integration',
      'AI Study Assistant (Gemini)',
      'Squad Competitions',
      'Gamification & XP System',
      'Smart Contracts (Base)',
      'User Embeddings & Tribe Matching'
    ]
  });
});

// Mock endpoints for frontend integration
app.get('/api/stats/:address', (req, res) => {
  res.json({
    xpBalance: 1250,
    streak: 5,
    badges: 3,
    squadId: 1,
    rank: 12,
    weeklyXP: 350,
    totalQuizzes: 15,
    accuracy: 0.85
  });
});

app.get('/api/leaderboard', (req, res) => {
  res.json([
    { id: 1, name: 'Alpha Squad', weeklyScore: 2500, position: 1, members: 8 },
    { id: 2, name: 'Beta Squad', weeklyScore: 2200, position: 2, members: 7 },
    { id: 3, name: 'Gamma Squad', weeklyScore: 1800, position: 3, members: 6 }
  ]);
});

app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  res.json({
    id: Date.now().toString(),
    agent: 'kana',
    content: `I received your message: "${message}". This is a mock response from the BrainInk AI Study Bot!`,
    type: 'text',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log('\n✨ Ready for frontend integration!\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});
