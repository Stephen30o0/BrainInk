const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

// List tournaments - with real database
router.get('/', async (req, res) => {
    try {
        const tournaments = await db.getTournaments({ limit: 50 });

        res.json({
            success: true,
            tournaments: tournaments || []
        });
    } catch (error) {
        console.error('Error listing tournaments:', error);
        res.status(500).json({ error: 'Failed to list tournaments' });
    }
});

// Tournament creation endpoint - with real database
router.post('/create', async (req, res) => {
    try {
        const {
            name,
            description,
            creator_address,
            max_players = 8,
            entry_fee = 0,
            prize_pool = 0,
            bracket_type = 'single_elimination',
            questions_per_match = 10,
            time_limit_minutes = 30,
            difficulty_level = 'medium',
            subject_category = 'general',
            custom_topics = [],
            registration_end,
            tournament_start,
            invited_users = [],
            is_public = true,
            prize_distribution = [60, 30, 10]
        } = req.body;

        // Validation
        if (!name || !creator_address) {
            return res.status(400).json({ error: 'Name and creator address are required' });
        }

        const tournamentId = uuidv4();
        const tournament = {
            id: tournamentId,
            name,
            description: description || '',
            creator_address,
            max_players,
            entry_fee,
            prize_pool,
            bracket_type,
            questions_per_match,
            time_limit_minutes,
            difficulty_level,
            subject_category,
            custom_topics,
            registration_end: registration_end ? new Date(registration_end) : null,
            tournament_start: tournament_start ? new Date(tournament_start) : null,
            invited_users,
            is_public,
            prize_distribution
        };

        await db.createTournament(tournament);

        console.log(`🏆 Tournament created: ${name} (ID: ${tournamentId})`);

        res.status(201).json({
            success: true,
            tournament_id: tournamentId,
            tournament: {
                ...tournament,
                current_players: 0,
                participants: [],
                created_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error creating tournament:', error);
        res.status(500).json({ error: 'Failed to create tournament' });
    }
});

module.exports = router;
