// Test tournament creation
console.log('🧪 Testing Tournament Creation...\n');

const { exec } = require('child_process');

function testCreateTournament() {
    console.log('1️⃣ Testing POST /api/tournaments/create');
    const command = `curl -s -X POST http://localhost:10000/api/tournaments/create -H "Content-Type: application/json" -d "{\\"name\\":\\"Test Tournament\\",\\"creator_address\\":\\"0x123\\"}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('❌ API Test failed:', error.message);
            return;
        }

        // Ignore stderr for curl progress info, focus on stdout
        console.log('Raw response:', stdout);

        try {
            const data = JSON.parse(stdout);
            console.log('✅ Tournament Created:', data);

            if (data.success && data.tournament) {
                console.log('🎉 Tournament creation working!');
                console.log('🆔 Tournament ID:', data.tournament.id);
                console.log('📝 Tournament Name:', data.tournament.name);
            } else {
                console.log('❌ Unexpected response format');
            }
        } catch (parseError) {
            console.log('❌ Failed to parse JSON response:', stdout);
        }
    });
}

// Test after a short delay
setTimeout(testCreateTournament, 1000);
