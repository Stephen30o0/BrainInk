const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool using your Supabase configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test database connection
async function testConnection() {
    try {
        console.log('🔍 Testing database connection...');
        console.log('DATABASE_URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');

        const client = await pool.connect();
        console.log('✅ Database connected successfully');

        // Test a simple query
        const result = await client.query('SELECT NOW()');
        console.log('✅ Database query test successful:', result.rows[0]);

        client.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('❌ Error details:', {
            code: error.code,
            severity: error.severity,
            detail: error.detail
        });
        return false;
    }
}

// Initialize database tables
async function initializeTables() {
    try {
        // Create user_profiles table first (no foreign keys)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_address VARCHAR(42) PRIMARY KEY,
        username VARCHAR(50),
        total_xp INTEGER DEFAULT 0,
        tournaments_won INTEGER DEFAULT 0,
        tournaments_participated INTEGER DEFAULT 0,
        total_matches_played INTEGER DEFAULT 0,
        total_matches_won INTEGER DEFAULT 0,
        average_score DECIMAL(10,2) DEFAULT 0,
        favorite_subjects TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create tournaments table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        creator_address VARCHAR(42) NOT NULL,
        max_players INTEGER NOT NULL DEFAULT 8,
        current_players INTEGER NOT NULL DEFAULT 0,
        entry_fee DECIMAL(20, 8) DEFAULT 0,
        prize_pool DECIMAL(20, 8) DEFAULT 0,
        bracket_type VARCHAR(20) DEFAULT 'single_elimination',
        questions_per_match INTEGER DEFAULT 10,
        time_limit_minutes INTEGER DEFAULT 30,
        difficulty_level VARCHAR(10) DEFAULT 'medium',
        subject_category VARCHAR(100) DEFAULT 'general',
        custom_topics TEXT,
        registration_end TIMESTAMP,
        tournament_start TIMESTAMP,
        invited_users TEXT,
        is_public BOOLEAN DEFAULT TRUE,
        prize_distribution TEXT,
        status VARCHAR(20) DEFAULT 'registration',
        winner VARCHAR(42),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

        // Create dependent tables
        await pool.query(`
      CREATE TABLE IF NOT EXISTS tournament_participants (
        id SERIAL PRIMARY KEY,
        tournament_id VARCHAR(36) NOT NULL,
        user_address VARCHAR(42) NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tournament_id, user_address)
      )
    `);

        // Create tournament invitations table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tournament_invitations (
                id SERIAL PRIMARY KEY,
                tournament_id VARCHAR(36) NOT NULL,
                inviter_address VARCHAR(42) NOT NULL,
                invited_address VARCHAR(42) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                responded_at TIMESTAMP,
                UNIQUE(tournament_id, invited_address)
            )
        `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS tournament_brackets (
        id SERIAL PRIMARY KEY,
        tournament_id VARCHAR(36) NOT NULL,
        bracket_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS tournament_matches (
        id VARCHAR(36) PRIMARY KEY,
        tournament_id VARCHAR(36) NOT NULL,
        round_number INTEGER NOT NULL,
        player1_address VARCHAR(42),
        player2_address VARCHAR(42),
        winner_address VARCHAR(42),
        status VARCHAR(20) DEFAULT 'waiting',
        questions_generated BOOLEAN DEFAULT FALSE,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS tournament_questions (
        id SERIAL PRIMARY KEY,
        tournament_id VARCHAR(36) NOT NULL,
        match_id VARCHAR(36) NOT NULL,
        questions_data TEXT NOT NULL,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      )
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS tournament_submissions (
        id SERIAL PRIMARY KEY,
        tournament_id VARCHAR(36) NOT NULL,
        match_id VARCHAR(36) NOT NULL,
        user_address VARCHAR(42) NOT NULL,
        answers TEXT NOT NULL,
        score INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        completion_time_ms INTEGER,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(match_id, user_address)
      )
    `);

        // Create INK token escrow and transaction tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tournament_escrows (
                id SERIAL PRIMARY KEY,
                tournament_id VARCHAR(36) NOT NULL UNIQUE,
                total_prize_pool DECIMAL(20, 8) DEFAULT 0,
                total_entry_fees DECIMAL(20, 8) DEFAULT 0,
                creator_contribution DECIMAL(20, 8) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'active',
                escrow_address VARCHAR(42),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                released_at TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS ink_transactions (
                id SERIAL PRIMARY KEY,
                tournament_id VARCHAR(36) NOT NULL,
                user_address VARCHAR(42) NOT NULL,
                transaction_type VARCHAR(20) NOT NULL, -- 'entry_fee', 'prize_pool', 'payout'
                amount DECIMAL(20, 8) NOT NULL,
                transaction_hash VARCHAR(66),
                status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                confirmed_at TIMESTAMP
            )
        `);

        console.log('✅ Database tables initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Error initializing database tables:', error.message);
        return false;
    }
}

// Database query helper functions
const db = {
    // Generic query function
    async query(text, params = []) {
        try {
            const result = await pool.query(text, params);
            return result.rows;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    },

    // Tournament queries
    async createTournament(tournament) {
        const query = `
      INSERT INTO tournaments (
        id, name, description, creator_address, max_players, entry_fee, 
        prize_pool, bracket_type, questions_per_match, time_limit_minutes,
        difficulty_level, subject_category, custom_topics, registration_end,
        tournament_start, invited_users, is_public, prize_distribution
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

        const values = [
            tournament.id, tournament.name, tournament.description, tournament.creator_address,
            tournament.max_players, tournament.entry_fee, tournament.prize_pool, tournament.bracket_type,
            tournament.questions_per_match, tournament.time_limit_minutes, tournament.difficulty_level,
            tournament.subject_category, JSON.stringify(tournament.custom_topics), tournament.registration_end,
            tournament.tournament_start, JSON.stringify(tournament.invited_users), tournament.is_public,
            JSON.stringify(tournament.prize_distribution)
        ];

        const result = await this.query(query, values);
        return result[0];
    },

    async getTournament(id) {
        const query = 'SELECT * FROM tournaments WHERE id = $1';
        const results = await this.query(query, [id]);
        if (results.length > 0) {
            const tournament = results[0];
            // Parse JSON fields
            if (tournament.custom_topics) tournament.custom_topics = JSON.parse(tournament.custom_topics);
            if (tournament.invited_users) tournament.invited_users = JSON.parse(tournament.invited_users);
            if (tournament.prize_distribution) tournament.prize_distribution = JSON.parse(tournament.prize_distribution);
            return tournament;
        }
        return null;
    },

    async getTournaments(filters = {}) {
        let query = 'SELECT * FROM tournaments WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (filters.status) {
            query += ` AND status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }

        if (filters.creator_address) {
            query += ` AND creator_address = $${paramIndex}`;
            params.push(filters.creator_address);
            paramIndex++;
        }

        if (filters.is_public !== undefined) {
            query += ` AND is_public = $${paramIndex}`;
            params.push(filters.is_public);
            paramIndex++;
        }

        query += ' ORDER BY created_at DESC';

        if (filters.limit) {
            query += ` LIMIT $${paramIndex}`;
            params.push(filters.limit);
            paramIndex++;
        }

        const results = await this.query(query, params);
        return results.map(tournament => {
            if (tournament.custom_topics) tournament.custom_topics = JSON.parse(tournament.custom_topics);
            if (tournament.invited_users) tournament.invited_users = JSON.parse(tournament.invited_users);
            if (tournament.prize_distribution) tournament.prize_distribution = JSON.parse(tournament.prize_distribution);
            return tournament;
        });
    },

    async updateTournament(id, updates) {
        const fields = [];
        const params = [];
        let paramIndex = 1;

        Object.keys(updates).forEach(key => {
            if (key === 'custom_topics' || key === 'invited_users' || key === 'prize_distribution') {
                fields.push(`${key} = $${paramIndex}`);
                params.push(JSON.stringify(updates[key]));
            } else {
                fields.push(`${key} = $${paramIndex}`);
                params.push(updates[key]);
            }
            paramIndex++;
        });

        if (fields.length === 0) return;

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);
        const query = `UPDATE tournaments SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
        return await this.query(query, params);
    },

    // Participant queries
    async addParticipant(tournament_id, user_address) {
        const query = 'INSERT INTO tournament_participants (tournament_id, user_address) VALUES ($1, $2) RETURNING *';
        return await this.query(query, [tournament_id, user_address]);
    },

    async getParticipants(tournament_id) {
        const query = 'SELECT * FROM tournament_participants WHERE tournament_id = $1 ORDER BY joined_at';
        return await this.query(query, [tournament_id]);
    },

    async removeParticipant(tournament_id, user_address) {
        const query = 'DELETE FROM tournament_participants WHERE tournament_id = $1 AND user_address = $2';
        return await this.query(query, [tournament_id, user_address]);
    },

    // Match queries
    async createMatch(match) {
        const query = `
      INSERT INTO tournament_matches (
        id, tournament_id, round_number, player1_address, player2_address, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
        return await this.query(query, [
            match.id, match.tournament_id, match.round_number,
            match.player1_address, match.player2_address, match.status
        ]);
    },

    async getMatches(tournament_id) {
        const query = 'SELECT * FROM tournament_matches WHERE tournament_id = $1 ORDER BY round_number, created_at';
        return await this.query(query, [tournament_id]);
    },

    async updateMatch(id, updates) {
        const fields = [];
        const params = [];
        let paramIndex = 1;

        Object.keys(updates).forEach(key => {
            fields.push(`${key} = $${paramIndex}`);
            params.push(updates[key]);
            paramIndex++;
        });

        if (fields.length === 0) return;

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);
        const query = `UPDATE tournament_matches SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
        return await this.query(query, params);
    },

    // Question queries
    async saveQuestions(tournament_id, match_id, questions, expires_at) {
        const query = `
      INSERT INTO tournament_questions (tournament_id, match_id, questions_data, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        return await this.query(query, [tournament_id, match_id, JSON.stringify(questions), expires_at]);
    },

    async getQuestions(match_id) {
        const query = 'SELECT * FROM tournament_questions WHERE match_id = $1 ORDER BY generated_at DESC LIMIT 1';
        const results = await this.query(query, [match_id]);
        if (results.length > 0) {
            const result = results[0];
            result.questions_data = JSON.parse(result.questions_data);
            return result;
        }
        return null;
    },

    // Submission queries
    async createSubmission(submission) {
        const query = `
      INSERT INTO tournament_submissions (
        tournament_id, match_id, user_address, answers, score, 
        correct_answers, total_questions, completion_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
        return await this.query(query, [
            submission.tournament_id, submission.match_id, submission.user_address,
            JSON.stringify(submission.answers), submission.score, submission.correct_answers,
            submission.total_questions, submission.completion_time_ms
        ]);
    },

    async getSubmissions(match_id) {
        const query = 'SELECT * FROM tournament_submissions WHERE match_id = $1 ORDER BY submitted_at';
        const results = await this.query(query, [match_id]);
        return results.map(submission => {
            submission.answers = JSON.parse(submission.answers);
            return submission;
        });
    },

    // User profile queries
    async createOrUpdateProfile(profile) {
        const query = `
      INSERT INTO user_profiles (user_address, username, total_xp, tournaments_won, tournaments_participated)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_address) 
      DO UPDATE SET
        username = EXCLUDED.username,
        total_xp = EXCLUDED.total_xp,
        tournaments_won = EXCLUDED.tournaments_won,
        tournaments_participated = EXCLUDED.tournaments_participated,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
        return await this.query(query, [
            profile.user_address, profile.username, profile.total_xp || 0,
            profile.tournaments_won || 0, profile.tournaments_participated || 0
        ]);
    },

    async getProfile(user_address) {
        const query = 'SELECT * FROM user_profiles WHERE user_address = $1';
        const results = await this.query(query, [user_address]);
        return results.length > 0 ? results[0] : null;
    },

    // Bracket queries
    async createBracket(tournament_id, bracket_data) {
        const query = `
            INSERT INTO tournament_brackets (tournament_id, bracket_data)
            VALUES ($1, $2)
            RETURNING *
        `;
        return await this.query(query, [tournament_id, JSON.stringify(bracket_data)]);
    },

    async getBracket(tournament_id) {
        const query = 'SELECT * FROM tournament_brackets WHERE tournament_id = $1 ORDER BY created_at DESC LIMIT 1';
        const results = await this.query(query, [tournament_id]);
        return results.length > 0 ? results[0] : null;
    },

    async updateBracket(tournament_id, bracket_data) {
        const query = `
            UPDATE tournament_brackets 
            SET bracket_data = $2, updated_at = CURRENT_TIMESTAMP 
            WHERE tournament_id = $1
            RETURNING *
        `;
        return await this.query(query, [tournament_id, JSON.stringify(bracket_data)]);
    },

    // User tournament queries
    async getUserParticipatedTournaments(user_address, filters = {}) {
        let query = `
            SELECT t.* FROM tournaments t 
            INNER JOIN tournament_participants p ON t.id = p.tournament_id 
            WHERE p.user_address = $1
        `;
        const params = [user_address];
        let paramIndex = 2;

        if (filters.status) {
            query += ` AND t.status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }

        query += ' ORDER BY t.created_at DESC';

        if (filters.limit) {
            query += ` LIMIT $${paramIndex}`;
            params.push(filters.limit);
        }

        const results = await this.query(query, params);
        return results.map(tournament => {
            if (tournament.custom_topics) tournament.custom_topics = JSON.parse(tournament.custom_topics);
            if (tournament.invited_users) tournament.invited_users = JSON.parse(tournament.invited_users);
            if (tournament.prize_distribution) tournament.prize_distribution = JSON.parse(tournament.prize_distribution);
            return tournament;
        });
    },

    // Invitation queries
    async createInvitation(invitation) {
        const query = `
            INSERT INTO tournament_invitations (tournament_id, inviter_address, invited_address, message)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        return await this.query(query, [
            invitation.tournament_id,
            invitation.inviter_address,
            invitation.invited_address,
            invitation.message || ''
        ]);
    },

    async getInvitation(tournament_id, invited_address) {
        const query = 'SELECT * FROM tournament_invitations WHERE tournament_id = $1 AND invited_address = $2';
        const results = await this.query(query, [tournament_id, invited_address]);
        return results.length > 0 ? results[0] : null;
    },

    async getInvitationById(invitation_id) {
        const query = 'SELECT * FROM tournament_invitations WHERE id = $1';
        const results = await this.query(query, [invitation_id]);
        return results.length > 0 ? results[0] : null;
    },

    async getUserInvitations(user_address, filters = {}) {
        let query = 'SELECT * FROM tournament_invitations WHERE invited_address = $1';
        const params = [user_address];
        let paramIndex = 2;

        if (filters.status) {
            query += ` AND status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }

        query += ' ORDER BY created_at DESC';

        if (filters.limit) {
            query += ` LIMIT $${paramIndex}`;
            params.push(filters.limit);
        }

        return await this.query(query, params);
    },

    async updateInvitation(invitation_id, updates) {
        const fields = [];
        const params = [];
        let paramIndex = 1;

        Object.keys(updates).forEach(key => {
            fields.push(`${key} = $${paramIndex}`);
            params.push(updates[key]);
            paramIndex++;
        });

        if (fields.length === 0) return;

        params.push(invitation_id);
        const query = `UPDATE tournament_invitations SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
        return await this.query(query, params);
    },

    // INK Token Escrow queries
    async createTournamentEscrow(tournament_id, creator_contribution, escrow_address = null) {
        const query = `
            INSERT INTO tournament_escrows (tournament_id, creator_contribution, total_prize_pool, escrow_address)
            VALUES ($1, $2, $2, $3)
            RETURNING *
        `;
        return await this.query(query, [tournament_id, creator_contribution, escrow_address]);
    },

    async getTournamentEscrow(tournament_id) {
        const query = 'SELECT * FROM tournament_escrows WHERE tournament_id = $1';
        const results = await this.query(query, [tournament_id]);
        return results.length > 0 ? results[0] : null;
    },

    async updateTournamentEscrow(tournament_id, updates) {
        const fields = [];
        const params = [];
        let paramIndex = 1;

        Object.keys(updates).forEach(key => {
            fields.push(`${key} = $${paramIndex}`);
            params.push(updates[key]);
            paramIndex++;
        });

        if (fields.length === 0) return;

        params.push(tournament_id);
        const query = `UPDATE tournament_escrows SET ${fields.join(', ')} WHERE tournament_id = $${paramIndex}`;
        return await this.query(query, params);
    },

    async addEntryFeeToEscrow(tournament_id, entry_fee_amount) {
        const query = `
            UPDATE tournament_escrows 
            SET total_entry_fees = total_entry_fees + $2
            WHERE tournament_id = $1
            RETURNING *
        `;
        return await this.query(query, [tournament_id, entry_fee_amount]);
    },

    // INK Transaction queries
    async createInkTransaction(transaction) {
        const query = `
            INSERT INTO ink_transactions (tournament_id, user_address, transaction_type, amount, transaction_hash, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        return await this.query(query, [
            transaction.tournament_id,
            transaction.user_address,
            transaction.transaction_type,
            transaction.amount,
            transaction.transaction_hash,
            transaction.status || 'pending'
        ]);
    },

    async updateInkTransaction(id, updates) {
        const fields = [];
        const params = [];
        let paramIndex = 1;

        Object.keys(updates).forEach(key => {
            fields.push(`${key} = $${paramIndex}`);
            params.push(updates[key]);
            paramIndex++;
        });

        if (fields.length === 0) return;

        params.push(id);
        const query = `UPDATE ink_transactions SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
        return await this.query(query, params);
    },

    async getTournamentTransactions(tournament_id) {
        const query = 'SELECT * FROM ink_transactions WHERE tournament_id = $1 ORDER BY created_at';
        return await this.query(query, [tournament_id]);
    },

    async getUserInkTransactions(user_address, tournament_id = null) {
        let query = 'SELECT * FROM ink_transactions WHERE user_address = $1';
        const params = [user_address];

        if (tournament_id) {
            query += ' AND tournament_id = $2';
            params.push(tournament_id);
        }

        query += ' ORDER BY created_at DESC';
        return await this.query(query, params);
    },

    // Tournament completion and payout functions
    async getTournamentEscrowSummary(tournament_id) {
        const query = `
            SELECT 
                e.*,
                COUNT(DISTINCT t_entry.user_address) as participants_paid,
                SUM(CASE WHEN t_entry.transaction_type = 'entry_fee' AND t_entry.status = 'confirmed' THEN t_entry.amount ELSE 0 END) as confirmed_entry_fees,
                SUM(CASE WHEN t_prize.transaction_type = 'prize_pool' AND t_prize.status = 'confirmed' THEN t_prize.amount ELSE 0 END) as confirmed_prize_pool
            FROM tournament_escrows e
            LEFT JOIN ink_transactions t_entry ON e.tournament_id = t_entry.tournament_id AND t_entry.transaction_type = 'entry_fee'
            LEFT JOIN ink_transactions t_prize ON e.tournament_id = t_prize.tournament_id AND t_prize.transaction_type = 'prize_pool'
            WHERE e.tournament_id = $1
            GROUP BY e.id
        `;
        const results = await this.query(query, [tournament_id]);
        return results.length > 0 ? results[0] : null;
    }
};

module.exports = {
    pool,
    db,
    testConnection,
    initializeTables
};
