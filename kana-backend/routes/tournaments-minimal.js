const express = require('express');
const router = express.Router();

console.log('🔧 Creating minimal tournament routes...');

// Test route
router.get('/debug/test', (req, res) => {
    res.json({ message: 'Debug route working', timestamp: new Date().toISOString() });
});

// List tournaments 
router.get('/', (req, res) => {
    res.json({ success: true, tournaments: [], message: 'Minimal tournaments endpoint' });
});

// Create tournament
router.post('/create', (req, res) => {
    res.json({ success: true, message: 'Minimal create endpoint' });
});

console.log('✅ Minimal routes created, exporting router...');
console.log('✅ Router type before export:', typeof router);
console.log('✅ Router stack length:', router.stack.length);

module.exports = router;
