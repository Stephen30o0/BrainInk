// Simple test for mock API
const http = require('http');

function testMockAPI() {
    console.log('🧪 Testing Mock Tournament API...\n');

    // Test GET /api/tournaments
    const req = http.request({
        hostname: 'localhost',
        port: 10001,
        path: '/api/tournaments',
        method: 'GET'
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('✅ GET /api/tournaments successful!');
                console.log('📊 Found tournaments:', response.tournaments?.length || 0);
                console.log('📝 Sample tournament:', response.tournaments?.[0]?.name || 'None');

                // Test creating a tournament
                testCreateTournament();
            } catch (error) {
                console.log('❌ Failed to parse response:', error.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ Request failed:', error.message);
    });

    req.end();
}

function testCreateTournament() {
    console.log('\n🆕 Testing tournament creation...');

    const tournamentData = JSON.stringify({
        name: 'Test Tournament',
        description: 'A test tournament',
        creator_address: '0x1234567890123456789012345678901234567890',
        max_players: 8,
        difficulty_level: 'medium',
        subject_category: 'general'
    });

    const req = http.request({
        hostname: 'localhost',
        port: 10001,
        path: '/api/tournaments/create',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(tournamentData)
        }
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (res.statusCode === 201) {
                    console.log('✅ Tournament created successfully!');
                    console.log('🆔 Tournament ID:', response.tournament?.id);
                    console.log('📝 Tournament Name:', response.tournament?.name);
                } else {
                    console.log('❌ Failed to create tournament:', response.error);
                }
            } catch (error) {
                console.log('❌ Failed to parse create response:', error.message);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ Create request failed:', error.message);
    });

    req.write(tournamentData);
    req.end();
}

testMockAPI();
