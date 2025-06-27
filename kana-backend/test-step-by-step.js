// Test tournaments.js step by step
console.log('Step 1: Basic imports...');
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

console.log('Step 2: Google AI import...');
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('Step 3: Database import...');
const { db } = require('./database');

console.log('Step 4: Initialize Gemini AI...');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

console.log('Step 5: Define a simple route...');
router.get('/test', (req, res) => {
    res.json({ message: 'Test route works' });
});

console.log('Step 6: Export router...');
module.exports = router;

console.log('✅ All steps completed successfully!');
console.log('Router type:', typeof router);
console.log('Router constructor:', router.constructor.name);
