// Simple script to start the server and test it
const { spawn } = require('child_process');

console.log('🚀 Starting BrainInk backend server...');

const server = spawn('node', ['index.js'], {
    stdio: 'inherit',
    cwd: __dirname
});

server.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
});

server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
});

// Give server time to start, then run test
setTimeout(() => {
    console.log('\n🧪 Running API test...');
    const test = spawn('node', ['test-api.js'], {
        stdio: 'inherit',
        cwd: __dirname
    });
}, 3000);
