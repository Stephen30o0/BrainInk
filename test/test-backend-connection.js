// Test backend connection and endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8000';
const TEST_TOKEN = 'test-token';

async function testEndpoint(endpoint, description) {
    try {
        console.log(`\n🔍 Testing: ${description}`);
        console.log(`   Endpoint: ${endpoint}`);

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ Success! Data keys: ${Object.keys(data).join(', ')}`);
            return data;
        } else {
            const error = await response.text();
            console.log(`   ❌ Failed: ${error}`);
            return null;
        }
    } catch (error) {
        console.log(`   💥 Network Error: ${error.message}`);
        return null;
    }
}

async function runTests() {
    console.log('🚀 BrainInk Backend Connection Test\n');

    // Test basic connectivity
    await testEndpoint('/', 'Root endpoint');
    await testEndpoint('/health', 'Health check');

    // Test student endpoints
    const studentEndpoints = [
        '/study-area/students/my-dashboard',
        '/study-area/students/my-assignments',
        '/study-area/students/my-subjects',
        '/study-area/students/my-learning-path',
        '/students/my-dashboard',
        '/students/my-assignments',
        '/students/my-subjects'
    ];

    for (const endpoint of studentEndpoints) {
        await testEndpoint(endpoint, `Student endpoint: ${endpoint}`);
    }

    console.log('\n🏁 Tests completed!');
}

runTests().catch(console.error);
