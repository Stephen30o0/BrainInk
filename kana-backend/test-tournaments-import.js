console.log('🔍 Testing tournaments.js import...');

try {
    const routes = require('./routes/tournaments');
    console.log('✅ Import successful');
    console.log('Routes type:', typeof routes);
    console.log('Stack length:', routes.stack ? routes.stack.length : 'no stack');

    if (routes.stack) {
        console.log('Available routes:');
        routes.stack.forEach((layer, i) => {
            const path = layer.route?.path || 'unknown';
            const methods = layer.route?.methods ? Object.keys(layer.route.methods).join(',') : 'unknown';
            console.log(`  ${i + 1}. ${path} (${methods})`);
        });
    }
} catch (e) {
    console.log('❌ Import failed:', e.message);
    console.log('Stack trace:', e.stack);
}
