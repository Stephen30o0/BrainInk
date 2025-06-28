// Test minimal tournament routes import
try {
    console.log('Testing express import...');
    const express = require('express');
    console.log('✅ Express imported');

    console.log('Testing uuid import...');
    const { v4: uuidv4 } = require('uuid');
    console.log('✅ UUID imported');

    console.log('Testing Google AI import...');
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    console.log('✅ Google AI imported');

    console.log('Testing database import...');
    const { db } = require('./database');
    console.log('✅ Database imported');

    console.log('Creating router...');
    const router = express.Router();
    console.log('✅ Router created');

    console.log('All imports successful!');
} catch (error) {
    console.log('❌ Import failed:', error.message);
    console.log('Full error:', error);
}
