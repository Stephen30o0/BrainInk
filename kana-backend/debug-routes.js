console.log('🔍 Debugging full tournament routes...');

try {
    // Test basic requires
    console.log('1. Testing express...');
    const express = require('express');
    console.log('✅ Express loaded');

    console.log('2. Testing router creation...');
    const router = express.Router();
    console.log('✅ Router created');

    console.log('3. Testing uuid...');
    const { v4: uuidv4 } = require('uuid');
    console.log('✅ UUID loaded');

    console.log('4. Testing Google AI...');
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    console.log('✅ Google AI loaded');

    console.log('5. Testing database...');
    const { db } = require('./database');
    console.log('✅ Database loaded');

    console.log('6. Testing Gemini initialization...');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    console.log('✅ Gemini AI initialized');

    console.log('7. Testing model creation...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('✅ Model created');

    console.log('8. Testing a simple route...');
    router.get('/debug/test', async (req, res) => {
        res.json({ message: 'Debug route working', timestamp: new Date().toISOString() });
    });
    console.log('✅ Simple route added');

    console.log('9. Testing module export...');
    console.log('Router type before export:', typeof router);
    console.log('Router stack length:', router.stack ? router.stack.length : 'no stack');

    // Try to export
    module.exports = router;
    console.log('✅ Export successful');

} catch (error) {
    console.error('❌ Error during debugging:', error.message);
    console.error('Stack:', error.stack);
}
