// Simple API test script for tournaments
const http = require('http');
const API_BASE = 'http://localhost:10000/api/tournaments'; // Real backend API

// Simple fetch implementation using Node.js http module
function fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
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
                    json: () => Promise.resolve(JSON.parse(data)),
                    text: () => Promise.resolve(data)
                });
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

async function testAPI() {
    console.log('🧪 Testing Tournament API...\n');

    try {
        // Test 1: Get tournaments (should return empty array initially)
        console.log('1️⃣ Testing GET /api/tournaments');
        const response = await fetch(API_BASE);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Response:', data);
        console.log('📊 Current tournaments count:', data.tournaments?.length || 0);

        // Test 2: Create a tournament
        console.log('\n2️⃣ Testing POST /api/tournaments/create');
        const createResponse = await fetch(`${API_BASE}/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Tournament',
                description: 'A test tournament created via API',
                creator_address: '0x1234567890123456789012345678901234567890',
                max_players: 8,
                entry_fee: 0,
                prize_pool: 100,
                bracket_type: 'single_elimination',
                questions_per_match: 10,
                time_limit_minutes: 30,
                difficulty_level: 'medium',
                subject_category: 'general',
                custom_topics: ['science', 'math'],
                is_public: true,
                prize_distribution: [60, 30, 10]
            })
        });

        if (!createResponse.ok) {
            const errorData = await createResponse.json();
            throw new Error(`Create failed: ${errorData.error || createResponse.statusText}`);
        }

        const createData = await createResponse.json();
        console.log('✅ Tournament created:', createData.tournament?.name);
        console.log('🆔 Tournament ID:', createData.tournament?.id);

        // Test 3: Get tournaments again (should show the new tournament)
        console.log('\n3️⃣ Testing GET /api/tournaments (after creation)');
        const response2 = await fetch(API_BASE);
        const data2 = await response2.json();
        console.log('✅ Response:', data2);
        console.log('📊 Current tournaments count:', data2.tournaments?.length || 0);

        console.log('\n🎉 All API tests passed!');
    } catch (error) {
        console.error('❌ API Test failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

// Run the test
testAPI();
