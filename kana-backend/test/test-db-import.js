// Test database import
try {
    console.log('Testing database import...');
    const { db } = require('./database');
    console.log('✅ Database imported successfully');
    console.log('Type of db:', typeof db);
    console.log('db properties:', Object.keys(db));
} catch (error) {
    console.log('❌ Database import failed:', error.message);
    console.log('Full error:', error);
}
