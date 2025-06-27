const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

// List tournaments endpoint
router.get('/', async (req, res) => {
    try {
        const { status, creator_address, is_public, limit = 50 } = req.query;

        const filters = {};
        if (status) filters.status = status;
        if (creator_address) filters.creator_address = creator_address;
        if (is_public !== undefined) filters.is_public = is_public === 'true';
        filters.limit = parseInt(limit);

        const tournaments = await db.getTournaments(filters);

        // Get participant counts for each tournament
        const tournamentsWithCounts = await Promise.all(
            tournaments.map(async (tournament) => {
                try {
                    const participants = await db.getParticipants(tournament.id);
                    return {
                        ...tournament,
                        current_players: participants.length,
                        participants: participants.map(p => p.user_address)
                    };
                } catch (err) {
                    console.error('Error getting participants for tournament:', tournament.id, err);
                    return {
                        ...tournament,
                        current_players: 0,
                        participants: []
                    };
                }
            })
        );

        res.json({
            success: true,
            tournaments: tournamentsWithCounts
        });

    } catch (error) {
        console.error('Error listing tournaments:', error);
        res.status(500).json({ error: 'Failed to list tournaments' });
    }
});

// Tournament creation endpoint
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

        if (![4, 8, 16, 32, 64].includes(max_players)) {
            return res.status(400).json({ error: 'Max players must be 4, 8, 16, 32, or 64' });
        }

        if (questions_per_match < 7 || questions_per_match > 15) {
            return res.status(400).json({ error: 'Questions per match must be between 7 and 15' });
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

        // Create or update creator profile if function exists
        try {
            if (db.createOrUpdateProfile) {
                await db.createOrUpdateProfile({
                    user_address: creator_address,
                    username: `Player_${creator_address.slice(-6)}`
                });
            }
        } catch (profileError) {
            console.warn('Could not create profile:', profileError.message);
        }

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
