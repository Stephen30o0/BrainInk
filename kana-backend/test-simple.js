// Quick API test using PowerShell curl
console.log('🧪 Testing Tournament API with curl...\n');

const { exec } = require('child_process');

function testAPI() {
    console.log('1️⃣ Testing GET /api/tournaments');

    exec('curl -s http://localhost:10000/api/tournaments', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ API Test failed:', error.message);
            return;
        }

        if (stderr) {
            console.error('❌ Error:', stderr);
            return;
        }

        try {
            const data = JSON.parse(stdout);
            console.log('✅ API Response:', data);
            console.log('📊 Current tournaments count:', data.tournaments?.length || 0);

            if (data.success && Array.isArray(data.tournaments)) {
                console.log('🎉 Tournament API is working correctly!');
            } else {
                console.log('❌ Unexpected response format');
            }
        } catch (parseError) {
            console.log('❌ Failed to parse JSON response:', stdout);
        }
    });
}

// Wait a moment then test
setTimeout(testAPI, 1000);
