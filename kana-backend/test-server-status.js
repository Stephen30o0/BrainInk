// Simple server status test
const http = require('http');

function testServerStatus() {
    console.log('🔍 Testing if server is running...');

    const req = http.request({
        hostname: 'localhost',
        port: 10000,
        path: '/',
        method: 'GET'
    }, (res) => {
        console.log(`✅ Server is running! Status: ${res.statusCode}`);

        // Test if tournament routes exist
        const tournamentReq = http.request({
            hostname: 'localhost',
            port: 10000,
            path: '/api/tournaments',
            method: 'GET'
        }, (tournamentRes) => {
            if (tournamentRes.statusCode === 404) {
                console.log('❌ Tournament routes not found (404)');
                console.log('This means the routes are not registered correctly.');
            } else {
                console.log(`✅ Tournament routes accessible! Status: ${tournamentRes.statusCode}`);
            }
        });

        tournamentReq.on('error', (err) => {
            console.log('❌ Tournament routes test failed:', err.message);
        });

        tournamentReq.end();
    });

    req.on('error', (err) => {
        console.log('❌ Server is not running:', err.message);
        console.log('Please start the server with: npm start');
    });

    req.end();
}

testServerStatus();
