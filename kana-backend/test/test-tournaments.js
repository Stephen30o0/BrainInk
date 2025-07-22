// Simple test script for tournament API
// Using built-in fetch or a simple HTTP client

const API_BASE = 'http://localhost:10000/api/tournaments';

async function testTournamentAPI() {
    console.log('🧪 Testing Tournament API...\n');

    // Try to use built-in fetch, fallback to http module
    let fetch;
    try {
        // For Node.js 18+ built-in fetch
        fetch = globalThis.fetch;
        if (!fetch) {
            throw new Error('No built-in fetch');
        }
    } catch (e) {
        // Fallback to http module for simple requests
        const http = require('http');
        const url = require('url');

        fetch = function (urlString, options = {}) {
            return new Promise((resolve, reject) => {
                const parsedUrl = url.parse(urlString);
                const requestOptions = {
                    hostname: parsedUrl.hostname,
                    port: parsedUrl.port,
                    path: parsedUrl.path,
                    method: options.method || 'GET',
                    headers: options.headers || {}
                };

                const req = http.request(requestOptions, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        resolve({
                            ok: res.statusCode >= 200 && res.statusCode < 300,
                            status: res.statusCode,
                            statusText: res.statusMessage,
                            json: () => Promise.resolve(JSON.parse(data))
                        });
                    });
                });

                req.on('error', reject);

                if (options.body) {
                    req.write(options.body);
                }
                req.end();
            });
        };
    }

    try {
        // Test 1: Get tournaments (should be empty initially)
        console.log('1. Testing GET /api/tournaments');
        const getResponse = await fetch(`${API_BASE}/`);
        if (getResponse.ok) {
            const data = await getResponse.json();
            console.log('✅ GET tournaments successful:', data);
        } else {
            console.log('❌ GET tournaments failed:', getResponse.status, getResponse.statusText);
        }

        // Test 2: Create a tournament
        console.log('\n2. Testing POST /api/tournaments/create');
        const createData = {
            name: 'Test Tournament',
            description: 'A test tournament for API validation',
            creator_address: '0x1234567890123456789012345678901234567890',
            max_players: 8,
            entry_fee: 0,
            prize_pool: 0,
            bracket_type: 'single_elimination',
            questions_per_match: 10,
            time_limit_minutes: 30,
            difficulty_level: 'medium',
            subject_category: 'general',
            custom_topics: [],
            is_public: true,
            prize_distribution: [60, 30, 10]
        };

        const createResponse = await fetch(`${API_BASE}/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createData)
        });

        if (createResponse.ok) {
            const tournamentData = await createResponse.json();
            console.log('✅ Create tournament successful:', tournamentData);

            // Test 3: Get tournaments again (should show our new tournament)
            console.log('\n3. Testing GET /api/tournaments (after create)');
            const getResponse2 = await fetch(`${API_BASE}/`);
            if (getResponse2.ok) {
                const data2 = await getResponse2.json();
                console.log('✅ GET tournaments after create:', data2);
            }

        } else {
            const errorData = await createResponse.json();
            console.log('❌ Create tournament failed:', createResponse.status, errorData);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testTournamentAPI();
