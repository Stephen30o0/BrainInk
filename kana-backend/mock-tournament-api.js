// Mock tournament API server for testing frontend
const http = require('http');
const url = require('url');

const mockTournaments = [
    {
        id: '1',
        name: 'Math Championship',
        description: 'A competitive math tournament',
        creator_address: '0x1234567890123456789012345678901234567890',
        max_players: 8,
        current_players: 3,
        entry_fee: 0,
        prize_pool: 100,
        bracket_type: 'single_elimination',
        questions_per_match: 10,
        time_limit_minutes: 30,
        difficulty_level: 'medium',
        subject_category: 'mathematics',
        custom_topics: [],
        is_public: true,
        prize_distribution: [60, 30, 10],
        status: 'registration',
        created_at: new Date().toISOString(),
        participants: ['0x1111111111111111111111111111111111111111', '0x2222222222222222222222222222222222222222']
    },
    {
        id: '2',
        name: 'Science Quiz Battle',
        description: 'General science knowledge tournament',
        creator_address: '0x3333333333333333333333333333333333333333',
        max_players: 16,
        current_players: 8,
        entry_fee: 0,
        prize_pool: 200,
        bracket_type: 'single_elimination',
        questions_per_match: 15,
        time_limit_minutes: 45,
        difficulty_level: 'hard',
        subject_category: 'science',
        custom_topics: ['physics', 'chemistry'],
        is_public: true,
        prize_distribution: [60, 30, 10],
        status: 'active',
        created_at: new Date().toISOString(),
        participants: [
            '0x1111111111111111111111111111111111111111',
            '0x2222222222222222222222222222222222222222',
            '0x4444444444444444444444444444444444444444',
            '0x5555555555555555555555555555555555555555'
        ]
    }
];

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;

    res.setHeader('Content-Type', 'application/json');

    try {
        if (path === '/api/tournaments' && req.method === 'GET') {
            // Get all tournaments
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                tournaments: mockTournaments,
                count: mockTournaments.length
            }));

        } else if (path === '/api/tournaments/create' && req.method === 'POST') {
            // Create tournament
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const tournamentData = JSON.parse(body);
                    const newTournament = {
                        id: (mockTournaments.length + 1).toString(),
                        ...tournamentData,
                        current_players: 0,
                        participants: [],
                        status: 'registration',
                        created_at: new Date().toISOString()
                    };

                    mockTournaments.push(newTournament);

                    res.writeHead(201);
                    res.end(JSON.stringify({
                        success: true,
                        message: 'Tournament created successfully',
                        tournament: newTournament
                    }));
                } catch (error) {
                    res.writeHead(400);
                    res.end(JSON.stringify({
                        error: 'Invalid JSON data'
                    }));
                }
            });

        } else if (path.startsWith('/api/tournaments/') && path.endsWith('/join') && req.method === 'POST') {
            // Join tournament
            const tournamentId = path.split('/')[3];
            const tournament = mockTournaments.find(t => t.id === tournamentId);

            if (!tournament) {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Tournament not found' }));
                return;
            }

            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const { user_address } = JSON.parse(body);

                    if (tournament.participants.includes(user_address)) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: 'Already joined tournament' }));
                        return;
                    }

                    if (tournament.current_players >= tournament.max_players) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: 'Tournament is full' }));
                        return;
                    }

                    tournament.participants.push(user_address);
                    tournament.current_players++;

                    res.writeHead(200);
                    res.end(JSON.stringify({
                        success: true,
                        message: 'Successfully joined tournament',
                        tournament
                    }));
                } catch (error) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Invalid request data' }));
                }
            });

        } else {
            // 404 for all other routes
            res.writeHead(404);
            res.end(JSON.stringify({
                error: 'Route not found'
            }));
        }
    } catch (error) {
        res.writeHead(500);
        res.end(JSON.stringify({
            error: 'Internal server error'
        }));
    }
});

const PORT = 10001; // Different port to avoid conflict
server.listen(PORT, () => {
    console.log(`🎮 Mock Tournament API Server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('  GET  /api/tournaments');
    console.log('  POST /api/tournaments/create');
    console.log('  POST /api/tournaments/:id/join');
    console.log('');
    console.log('You can test the frontend with this API by changing');
    console.log('TOURNAMENT_API_BASE to "http://localhost:10001/api/tournaments"');
});
