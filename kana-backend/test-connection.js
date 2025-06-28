const axios = require('axios');

async function testConnection() {
    try {
        console.log('Testing connection to http://localhost:10000...');
        const response = await axios.get('http://localhost:10000');
        console.log('✅ Server is running:', response.data);
    } catch (error) {
        console.error('❌ Server connection failed:', error.message);
        console.error('Error code:', error.code);
    }
}

testConnection();
