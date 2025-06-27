console.log('🔄 Testing if server needs restart...');

// Test if the debug route exists
const express = require('express');
const tournamentRoutes = require('./routes/tournaments');

console.log('Checking tournament routes structure...');
console.log('Routes type:', typeof tournamentRoutes);
console.log('Routes stack length:', tournamentRoutes.stack ? tournamentRoutes.stack.length : 'no stack');

if (tournamentRoutes.stack) {
    console.log('Available routes:');
    tournamentRoutes.stack.forEach((layer, index) => {
        console.log(`  ${index + 1}. ${layer.route ? layer.route.path : 'unknown path'} (${layer.route ? Object.keys(layer.route.methods).join(',') : 'unknown method'})`);
    });
} else {
    console.log('❌ No route stack found');
}

console.log('\n✅ Route check complete. If you see debug routes above, restart the server to apply changes.');
