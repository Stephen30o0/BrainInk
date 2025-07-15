console.log('🔧 Testing tournament routes step by step...');

// Test 1: Basic imports
try {
    console.log('1️⃣ Testing basic imports...');
    const express = require('express');
    const router = express.Router();
    console.log('✅ Express and router created');

    // Test 2: UUID import
    const { v4: uuidv4 } = require('uuid');
    console.log('✅ UUID imported');

    // Test 3: Google AI import
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    console.log('✅ Google AI imported');

    // Test 4: Database import
    const { db } = require('./database');
    console.log('✅ Database imported');

    // Test 5: Create a simple route
    router.get('/test', (req, res) => {
        res.json({ message: 'test' });
    });
    console.log('✅ Route created');

    // Test 6: Check router type
    console.log('✅ Router type:', typeof router);
    console.log('✅ Router stack length:', router.stack.length);

    console.log('🎉 All tests passed! The issue might be elsewhere.');

} catch (error) {
    console.error('❌ Error during testing:', error.message);
    console.error('Stack trace:', error.stack);
}
