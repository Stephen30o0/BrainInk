-- Tournament System Database Schema for PostgreSQL
-- This script creates all the necessary tables for the tournament system

-- Drop existing tables if they exist (in correct order to handle foreign keys)
DROP TABLE
IF
  EXISTS tournament_submissions CASCADE;
  DROP TABLE
  IF
    EXISTS tournament_questions CASCADE;
    DROP TABLE
    IF
      EXISTS tournament_matches CASCADE;
      DROP TABLE
      IF
        EXISTS tournament_brackets CASCADE;
        DROP TABLE
        IF
          EXISTS tournament_participants CASCADE;
          DROP TABLE
          IF
            EXISTS tournament_invitations CASCADE;
            DROP TABLE
            IF
              EXISTS tournaments CASCADE;
              DROP TABLE
              IF
                EXISTS user_profiles CASCADE;

                -- User profiles table
                CREATE TABLE user_profiles (
                  user_address VARCHAR(42) PRIMARY KEY
                  , username VARCHAR(50)
                  , total_xp INTEGER DEFAULT 0
                  , tournaments_won INTEGER DEFAULT 0
                  , tournaments_participated INTEGER DEFAULT 0
                  , total_matches_played INTEGER DEFAULT 0
                  , total_matches_won INTEGER DEFAULT 0
                  , average_score DECIMAL(10, 2) DEFAULT 0
                  , favorite_subjects TEXT
                  , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Tournaments table (main tournament information)
                CREATE TABLE tournaments (
                  id VARCHAR(36) PRIMARY KEY
                  , name VARCHAR(255) NOT NULL
                  , description TEXT
                  , creator_address VARCHAR(42) NOT NULL
                  , max_players INTEGER NOT NULL DEFAULT 8
                  , current_players INTEGER NOT NULL DEFAULT 0
                  , entry_fee DECIMAL(20, 8) DEFAULT 0
                  , prize_pool DECIMAL(20, 8) DEFAULT 0
                  , bracket_type VARCHAR(20) DEFAULT 'single_elimination'
                  , questions_per_match INTEGER DEFAULT 10
                  , time_limit_minutes INTEGER DEFAULT 30
                  , difficulty_level VARCHAR(10) DEFAULT 'medium'
                  , subject_category VARCHAR(100) DEFAULT 'general'
                  , custom_topics TEXT
                  , registration_end TIMESTAMP
                  , tournament_start TIMESTAMP
                  , invited_users TEXT
                  , is_public BOOLEAN DEFAULT TRUE
                  , prize_distribution TEXT
                  , status VARCHAR(20) DEFAULT 'registration'
                  , winner VARCHAR(42)
                  , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  , started_at TIMESTAMP
                  , completed_at TIMESTAMP
                );

                -- Tournament participants table
                CREATE TABLE tournament_participants (
                  id SERIAL PRIMARY KEY
                  , tournament_id VARCHAR(36) NOT NULL
                  , user_address VARCHAR(42) NOT NULL
                  , joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  , FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
                  ON DELETE CASCADE
                  , UNIQUE (tournament_id, user_address)
                );

                -- Tournament invitations table
                CREATE TABLE tournament_invitations (
                  id SERIAL PRIMARY KEY
                  , tournament_id VARCHAR(36) NOT NULL
                  , inviter_address VARCHAR(42) NOT NULL
                  , invited_address VARCHAR(42) NOT NULL
                  , status VARCHAR(20) DEFAULT 'pending'
                  , -- pending, accepted, declined
                    message TEXT
                  , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  , responded_at TIMESTAMP
                  , FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
                  ON DELETE CASCADE
                  , UNIQUE (tournament_id, invited_address)
                );

                -- Tournament brackets table
                CREATE TABLE tournament_brackets (
                  id SERIAL PRIMARY KEY
                  , tournament_id VARCHAR(36) NOT NULL
                  , bracket_data TEXT NOT NULL
                  , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  , FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
                  ON DELETE CASCADE
                );

                -- Tournament matches table
                CREATE TABLE tournament_matches (
                  id VARCHAR(36) PRIMARY KEY
                  , tournament_id VARCHAR(36) NOT NULL
                  , round_number INTEGER NOT NULL
                  , player1_address VARCHAR(42)
                  , player2_address VARCHAR(42)
                  , winner_address VARCHAR(42)
                  , status VARCHAR(20) DEFAULT 'waiting'
                  , questions_generated BOOLEAN DEFAULT FALSE
                  , started_at TIMESTAMP
                  , completed_at TIMESTAMP
                  , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  , FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
                  ON DELETE CASCADE
                );

                -- Tournament questions table
                CREATE TABLE tournament_questions (
                  id SERIAL PRIMARY KEY
                  , tournament_id VARCHAR(36) NOT NULL
                  , match_id VARCHAR(36) NOT NULL
                  , questions_data TEXT NOT NULL
                  , generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  , expires_at TIMESTAMP
                  , FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
                  ON DELETE CASCADE
                  , FOREIGN KEY (match_id) REFERENCES tournament_matches(id)
                  ON DELETE CASCADE
                );

                -- Tournament submissions table
                CREATE TABLE tournament_submissions (
                  id SERIAL PRIMARY KEY
                  , tournament_id VARCHAR(36) NOT NULL
                  , match_id VARCHAR(36) NOT NULL
                  , user_address VARCHAR(42) NOT NULL
                  , answers TEXT NOT NULL
                  , score INTEGER NOT NULL
                  , correct_answers INTEGER NOT NULL
                  , total_questions INTEGER NOT NULL
                  , completion_time_ms INTEGER
                  , submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  , FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
                  ON DELETE CASCADE
                  , FOREIGN KEY (match_id) REFERENCES tournament_matches(id)
                  ON DELETE CASCADE
                  , UNIQUE (match_id, user_address)
                );

                -- Create indexes for better performance
                CREATE INDEX idx_tournaments_creator
                ON tournaments(creator_address);
                CREATE INDEX idx_tournaments_status
                ON tournaments(status);
                CREATE INDEX idx_tournaments_created
                ON tournaments(created_at);
                CREATE INDEX idx_tournaments_public
                ON tournaments(is_public);

                CREATE INDEX idx_participants_tournament
                ON tournament_participants(tournament_id);
                CREATE INDEX idx_participants_user
                ON tournament_participants(user_address);

                CREATE INDEX idx_invitations_tournament
                ON tournament_invitations(tournament_id);
                CREATE INDEX idx_invitations_invited
                ON tournament_invitations(invited_address);
                CREATE INDEX idx_invitations_status
                ON tournament_invitations(status);

                CREATE INDEX idx_matches_tournament
                ON tournament_matches(tournament_id);
                CREATE INDEX idx_matches_players
                ON tournament_matches(player1_address, player2_address);
                CREATE INDEX idx_matches_status
                ON tournament_matches(status);

                CREATE INDEX idx_questions_tournament
                ON tournament_questions(tournament_id);
                CREATE INDEX idx_questions_match
                ON tournament_questions(match_id);

                CREATE INDEX idx_submissions_tournament
                ON tournament_submissions(tournament_id);
                CREATE INDEX idx_submissions_match
                ON tournament_submissions(match_id);
                CREATE INDEX idx_submissions_user
                ON tournament_submissions(user_address);

                CREATE INDEX idx_profiles_username
                ON user_profiles(username);
                CREATE INDEX idx_profiles_xp
                ON user_profiles(total_xp);

                -- Show all tables
                SELECT
                  tablename
                FROM
                  pg_tables
                WHERE
                  schemaname = 'public';