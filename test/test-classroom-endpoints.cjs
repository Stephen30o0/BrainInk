// Test the exact format expected by backend classroom endpoints
const http = require('http');

async function testClassroomEndpoints() {
    const token = 'your-token-here'; // Replace with actual token from browser localStorage

    console.log('🔍 Testing classroom endpoint formats...\n');

    // Test assign-teacher with different formats
    const formats = [
        {
            name: 'Query Parameter',
            url: 'http://localhost:8000/study-area/classrooms/1/assign-teacher?teacher_id=1',
            method: 'POST',
            body: null
        },
        {
            name: 'JSON Body (Object)',
            url: 'http://localhost:8000/study-area/classrooms/1/assign-teacher',
            method: 'POST',
            body: JSON.stringify({ teacher_id: 1 })
        },
        {
            name: 'JSON Body (Direct)',
            url: 'http://localhost:8000/study-area/classrooms/1/assign-teacher',
            method: 'POST',
            body: JSON.stringify(1)
        }
    ];

    for (const format of formats) {
        console.log(`📋 Testing ${format.name}:`);
        try {
            const response = await makeRequest(format.url, format.method, format.body, token);
            console.log(`   ✅ Status: ${response.status}`);
            console.log(`   📄 Response: ${response.data.substring(0, 100)}...`);
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        console.log('');
    }
}

function makeRequest(url, method, body, token) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, data });
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

testClassroomEndpoints().catch(console.error);
