const http = require('http');

// Test the frontend endpoints
const testEndpoint = (url, description) => {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`✅ ${description}: Status ${res.statusCode}`);
                if (res.statusCode === 200) {
                    console.log('   Frontend is accessible');
                }
                resolve(data);
            });
        });
        req.on('error', (err) => {
            console.log(`❌ ${description}: ${err.message}`);
            resolve(null);
        });
    });
};

(async () => {
    console.log('🔍 Testing frontend application...');
    await testEndpoint('http://localhost:5173', 'Frontend app');
    console.log('✅ Frontend test complete');
})();
