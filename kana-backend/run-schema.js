const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

async function runSchema() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🗄️ Reading schema file...');
        const schema = fs.readFileSync('./tournament_schema_postgres.sql', 'utf8');

        console.log('🔄 Connecting to database...');
        const client = await pool.connect();

        console.log('⚠️ Dropping and recreating all tournament tables...');
        await client.query(schema);

        console.log('✅ Schema applied successfully!');
        console.log('📊 Checking created tables...');

        const tablesResult = await client.query(`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename LIKE '%tournament%' OR tablename = 'user_profiles'
            ORDER BY tablename;
        `);

        console.log('Created tables:');
        tablesResult.rows.forEach(row => {
            console.log('  - ' + row.tablename);
        });

        client.release();
        await pool.end();

        console.log('🎉 Database schema setup complete!');

    } catch (error) {
        console.error('❌ Error applying schema:', error);
        await pool.end();
        process.exit(1);
    }
}

runSchema();
