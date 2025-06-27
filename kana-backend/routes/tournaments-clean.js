const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Simple working routes for testing
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Tournament API is working!',
        tournaments: []
    });
});

router.post('/create', (req, res) => {
    res.json({
        success: true,
        message: 'Tournament created successfully!',
        tournament: {
            id: uuidv4(),
            name: req.body.name || 'Test Tournament',
            status: 'registration',
            created_at: new Date().toISOString()
        }
    });
});

module.exports = router;
