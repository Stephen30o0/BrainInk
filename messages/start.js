#!/usr/bin/env node

/**
 * BrainInk XMTP + AgentKit AI Study Bot Startup Script
 * Checks environment, dependencies, and starts the system
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🧠 BrainInk AI Study Bot - Startup Check');
console.log('=====================================\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('❌ .env file not found');
  console.log('📋 Please copy .env.example to .env and fill in your values:');
  console.log('   cp .env.example .env');
  console.log('   nano .env\n');
  console.log('Required variables:');
  console.log('   - GEMINI_API_KEY');
  console.log('   - WALLET_PRIVATE_KEY');
  console.log('   - WALLET_ADDRESS\n');
  process.exit(1);
}

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('❌ Dependencies not installed');
  console.log('📦 Please run: npm install\n');
  process.exit(1);
}

// Load environment variables
require('dotenv').config();

const requiredEnvVars = [
  'GEMINI_API_KEY',
  'WALLET_PRIVATE_KEY',
  'WALLET_ADDRESS'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n📝 Please update your .env file\n');
  process.exit(1);
}

console.log('✅ Environment variables configured');
console.log('✅ Dependencies installed');
console.log('✅ Ready to start!\n');

console.log('🚀 Starting BrainInk AI Study Bot...\n');

// Start the server
const serverProcess = spawn('node', ['index.js'], {
  stdio: 'inherit',
  env: process.env
});

serverProcess.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  if (code !== 0) {
    console.log(`❌ Server exited with code ${code}`);
  }
  process.exit(code);
});
