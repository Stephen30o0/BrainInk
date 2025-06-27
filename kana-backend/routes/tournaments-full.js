const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { db } = require('../database');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

console.log('🏆 Loading FULL tournament routes with all endpoints...');

// Debug test route
router.get('/debug/test', async (req, res) => {
    res.json({ message: 'Full tournament routes working!', timestamp: new Date().toISOString() });
});

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
                const participants = await db.getParticipants(tournament.id);
                return {
                    ...tournament,
                    current_players: participants.length,
                    participants: participants.map(p => p.user_address)
                };
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

        // Create or update creator profile
        await db.createOrUpdateProfile({
            user_address: creator_address,
            username: `Player_${creator_address.slice(-6)}`
        });

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

// Join tournament endpoint
router.post('/:tournamentId/join', async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { user_address } = req.body;

        if (!user_address) {
            return res.status(400).json({ error: 'User address is required' });
        }

        const tournament = await db.getTournament(tournamentId);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournament.status !== 'registration') {
            return res.status(400).json({ error: 'Tournament registration is closed' });
        }

        // Check current participants
        const participants = await db.getParticipants(tournamentId);
        const isAlreadyJoined = participants.some(p => p.user_address === user_address);

        if (isAlreadyJoined) {
            return res.status(400).json({ error: 'User already joined this tournament' });
        }

        if (participants.length >= tournament.max_players) {
            return res.status(400).json({ error: 'Tournament is full' });
        }

        // Add participant
        await db.addParticipant(tournamentId, user_address);

        // Update tournament current_players count
        await db.updateTournament(tournamentId, {
            current_players: participants.length + 1
        });

        // Create or update user profile
        await db.createOrUpdateProfile({
            user_address,
            username: `Player_${user_address.slice(-6)}`
        });

        console.log(`👤 User ${user_address} joined tournament ${tournamentId}`);

        res.json({
            success: true,
            message: 'Successfully joined tournament',
            current_players: participants.length + 1
        });

    } catch (error) {
        console.error('Error joining tournament:', error);
        res.status(500).json({ error: 'Failed to join tournament' });
    }
});

// Get tournament details
router.get('/:tournamentId', async (req, res) => {
    try {
        const { tournamentId } = req.params;

        const tournament = await db.getTournament(tournamentId);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Get participants
        const participants = await db.getParticipants(tournamentId);
        const participantAddresses = participants.map(p => p.user_address);

        // Get matches if tournament has started
        let matches = [];
        if (tournament.status !== 'registration') {
            matches = await db.getMatches(tournamentId);
        }

        res.json({
            success: true,
            tournament: {
                ...tournament,
                current_players: participants.length,
                participants: participantAddresses,
                matches: matches
            }
        });

    } catch (error) {
        console.error('Error getting tournament:', error);
        res.status(500).json({ error: 'Failed to get tournament details' });
    }
});

// Start tournament (generate brackets)
router.post('/:tournamentId/start', async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { user_address } = req.body;

        const tournament = await db.getTournament(tournamentId);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournament.creator_address !== user_address) {
            return res.status(403).json({ error: 'Only tournament creator can start the tournament' });
        }

        if (tournament.status !== 'registration') {
            return res.status(400).json({ error: 'Tournament has already started' });
        }

        const participants = await db.getParticipants(tournamentId);
        if (participants.length < 2) {
            return res.status(400).json({ error: 'At least 2 players required to start tournament' });
        }

        // Generate bracket
        const bracket = generateBracket(participants.map(p => p.user_address), tournament.bracket_type);

        // Save bracket to database
        await db.createBracket(tournamentId, bracket);

        // Create matches for first round
        const matches = [];
        for (let i = 0; i < bracket.matches.length; i++) {
            const match = bracket.matches[i];
            const matchId = uuidv4();

            const matchData = {
                id: matchId,
                tournament_id: tournamentId,
                round_number: 1,
                player1_address: match.player1,
                player2_address: match.player2,
                status: 'ready'
            };

            await db.createMatch(matchData);
            matches.push(matchData);
        }

        // Update tournament status
        await db.updateTournament(tournamentId, {
            status: 'active',
            started_at: new Date()
        });

        console.log(`🚀 Tournament ${tournamentId} started with ${participants.length} players`);

        res.json({
            success: true,
            message: 'Tournament started successfully',
            bracket: {
                tournament_id: tournamentId,
                total_rounds: bracket.totalRounds,
                current_round: 1,
                matches: matches
            }
        });

    } catch (error) {
        console.error('Error starting tournament:', error);
        res.status(500).json({ error: 'Failed to start tournament' });
    }
});

// Get tournament bracket
router.get('/:tournamentId/bracket', async (req, res) => {
    try {
        const { tournamentId } = req.params;

        const tournament = await db.getTournament(tournamentId);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Get bracket data
        const bracket = await db.getBracket(tournamentId);
        if (!bracket) {
            return res.status(404).json({ error: 'Bracket not found' });
        }

        // Get current matches
        const matches = await db.getMatches(tournamentId);

        res.json({
            success: true,
            bracket: JSON.parse(bracket.bracket_data),
            matches: matches,
            tournament_status: tournament.status
        });

    } catch (error) {
        console.error('Error getting bracket:', error);
        res.status(500).json({ error: 'Failed to get tournament bracket' });
    }
});

// Get my tournaments
router.get('/my/:userAddress', async (req, res) => {
    try {
        const { userAddress } = req.params;
        const { status, limit = 50 } = req.query;

        // Get tournaments where user is creator
        const createdTournaments = await db.getTournaments({
            creator_address: userAddress,
            status: status,
            limit: Math.floor(parseInt(limit) / 2)
        });

        // Get tournaments where user is participant
        const participatedTournaments = await db.getUserParticipatedTournaments(userAddress, {
            status: status,
            limit: Math.floor(parseInt(limit) / 2)
        });

        // Combine and add participant counts
        const allTournaments = [...createdTournaments, ...participatedTournaments];
        const uniqueTournaments = allTournaments.filter((tournament, index, self) =>
            index === self.findIndex(t => t.id === tournament.id)
        );

        const tournamentsWithDetails = await Promise.all(
            uniqueTournaments.map(async (tournament) => {
                const participants = await db.getParticipants(tournament.id);
                const isCreator = tournament.creator_address === userAddress;
                const isParticipant = participants.some(p => p.user_address === userAddress);

                return {
                    ...tournament,
                    current_players: participants.length,
                    participants: participants.map(p => p.user_address),
                    user_role: isCreator ? 'creator' : 'participant',
                    is_creator: isCreator,
                    is_participant: isParticipant
                };
            })
        );

        res.json({
            success: true,
            tournaments: tournamentsWithDetails.slice(0, parseInt(limit))
        });

    } catch (error) {
        console.error('Error getting my tournaments:', error);
        res.status(500).json({ error: 'Failed to get user tournaments' });
    }
});

// Invite players to tournament
router.post('/:tournamentId/invite', async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { inviter_address, invited_addresses, message = '' } = req.body;

        if (!inviter_address || !invited_addresses || !Array.isArray(invited_addresses)) {
            return res.status(400).json({ error: 'Inviter address and invited addresses array are required' });
        }

        const tournament = await db.getTournament(tournamentId);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Check if inviter is the creator
        if (tournament.creator_address !== inviter_address) {
            return res.status(403).json({ error: 'Only tournament creator can send invitations' });
        }

        if (tournament.status !== 'registration') {
            return res.status(400).json({ error: 'Tournament registration is closed' });
        }

        const results = [];
        const errors = [];

        for (const invited_address of invited_addresses) {
            try {
                // Check if already invited
                const existingInvitation = await db.getInvitation(tournamentId, invited_address);
                if (existingInvitation) {
                    errors.push({ address: invited_address, error: 'Already invited' });
                    continue;
                }

                // Check if already participant
                const participants = await db.getParticipants(tournamentId);
                const isAlreadyParticipant = participants.some(p => p.user_address === invited_address);
                if (isAlreadyParticipant) {
                    errors.push({ address: invited_address, error: 'Already participant' });
                    continue;
                }

                await db.createInvitation({
                    tournament_id: tournamentId,
                    inviter_address,
                    invited_address,
                    message
                });

                results.push({ address: invited_address, status: 'invited' });

            } catch (error) {
                errors.push({ address: invited_address, error: error.message });
            }
        }

        console.log(`📧 Sent ${results.length} invitations for tournament ${tournamentId}`);

        res.json({
            success: true,
            invited: results,
            errors: errors,
            message: `Sent ${results.length} invitations successfully`
        });

    } catch (error) {
        console.error('Error sending invitations:', error);
        res.status(500).json({ error: 'Failed to send invitations' });
    }
});

// Get my invitations
router.get('/invitations/:userAddress', async (req, res) => {
    try {
        const { userAddress } = req.params;
        const { status = 'pending', limit = 50 } = req.query;

        const invitations = await db.getUserInvitations(userAddress, {
            status: status,
            limit: parseInt(limit)
        });

        // Get tournament details for each invitation
        const invitationsWithDetails = await Promise.all(
            invitations.map(async (invitation) => {
                const tournament = await db.getTournament(invitation.tournament_id);
                const participants = await db.getParticipants(invitation.tournament_id);

                return {
                    ...invitation,
                    tournament: {
                        ...tournament,
                        current_players: participants.length,
                        participants: participants.map(p => p.user_address)
                    }
                };
            })
        );

        res.json({
            success: true,
            invitations: invitationsWithDetails
        });

    } catch (error) {
        console.error('Error getting invitations:', error);
        res.status(500).json({ error: 'Failed to get user invitations' });
    }
});

// Respond to invitation
router.post('/invitations/:invitationId/respond', async (req, res) => {
    try {
        const { invitationId } = req.params;
        const { user_address, response } = req.body; // response: 'accept' or 'decline'

        if (!user_address || !response || !['accept', 'decline'].includes(response)) {
            return res.status(400).json({ error: 'User address and valid response (accept/decline) are required' });
        }

        const invitation = await db.getInvitationById(invitationId);
        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        if (invitation.invited_address !== user_address) {
            return res.status(403).json({ error: 'Not authorized to respond to this invitation' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ error: 'Invitation already responded to' });
        }

        const tournament = await db.getTournament(invitation.tournament_id);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournament.status !== 'registration') {
            return res.status(400).json({ error: 'Tournament registration is closed' });
        }

        // Update invitation status
        await db.updateInvitation(invitationId, {
            status: response === 'accept' ? 'accepted' : 'declined',
            responded_at: new Date()
        });

        let joinResult = null;

        if (response === 'accept') {
            // Check if tournament is full
            const participants = await db.getParticipants(invitation.tournament_id);
            if (participants.length >= tournament.max_players) {
                await db.updateInvitation(invitationId, {
                    status: 'declined' // Auto-decline if tournament is full
                });
                return res.status(400).json({ error: 'Tournament is full, invitation auto-declined' });
            }

            // Check if already joined
            const isAlreadyJoined = participants.some(p => p.user_address === user_address);
            if (!isAlreadyJoined) {
                // Add participant
                await db.addParticipant(invitation.tournament_id, user_address);

                // Update tournament current_players count
                await db.updateTournament(invitation.tournament_id, {
                    current_players: participants.length + 1
                });

                // Create or update user profile
                await db.createOrUpdateProfile({
                    user_address,
                    username: `Player_${user_address.slice(-6)}`
                });

                joinResult = {
                    joined: true,
                    current_players: participants.length + 1
                };

                console.log(`✅ User ${user_address} accepted invitation and joined tournament ${invitation.tournament_id}`);
            }
        }

        res.json({
            success: true,
            message: `Invitation ${response}ed successfully`,
            response: response,
            invitation_id: invitationId,
            tournament_id: invitation.tournament_id,
            ...joinResult
        });

    } catch (error) {
        console.error('Error responding to invitation:', error);
        res.status(500).json({ error: 'Failed to respond to invitation' });
    }
});

// Helper function to generate tournament brackets
function generateBracket(players, bracketType = 'single_elimination') {
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

    // Pad to next power of 2 if needed
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(shuffledPlayers.length)));
    while (shuffledPlayers.length < nextPowerOf2) {
        shuffledPlayers.push(null); // null represents a "bye"
    }

    const matches = [];

    // Create first round matches
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
        const player1 = shuffledPlayers[i];
        const player2 = shuffledPlayers[i + 1];

        // Skip matches where both players are null
        if (player1 || player2) {
            matches.push({
                round: 1,
                player1: player1,
                player2: player2,
                winner: null
            });
        }
    }

    const totalRounds = Math.log2(nextPowerOf2);

    return {
        type: bracketType,
        totalRounds: totalRounds,
        matches: matches,
        players: shuffledPlayers.filter(p => p !== null)
    };
}

console.log(`✅ Full tournament routes loaded with ${Object.keys(router.stack || {}).length} endpoints`);

module.exports = router;
