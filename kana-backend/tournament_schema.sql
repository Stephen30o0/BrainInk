-- Tournament System Database Schema
-- This script creates all the necessary tables for the tournament system
-- Run this script in your MySQL database to set up the tournament tables

-- Use the database
-- USE your_database_name;

-- Drop existing tables if they exist (run only if you want to recreate tables)
-- DROP TABLE IF EXISTS tournament_submissions;
-- DROP TABLE IF EXISTS tournament_questions;
-- DROP TABLE IF EXISTS tournament_matches;
-- DROP TABLE IF EXISTS tournament_brackets;
-- DROP TABLE IF EXISTS tournament_participants;
-- DROP TABLE IF EXISTS tournaments;
-- DROP TABLE IF EXISTS user_profiles;

-- Tournaments table (main tournament information)
CREATE TABLE
IF
  NOT EXISTS tournaments (
    id VARCHAR(36) PRIMARY KEY
    , name VARCHAR(255) NOT NULL
    , description TEXT
    , creator_address VARCHAR(42) NOT NULL
    , max_players INT NOT NULL DEFAULT 8
    , current_players INT NOT NULL DEFAULT 0
    , entry_fee DECIMAL(20, 8) DEFAULT 0
    , prize_pool DECIMAL(20, 8) DEFAULT 0
    , bracket_type VARCHAR(20) DEFAULT 'single_elimination'
    , questions_per_match INT DEFAULT 10
    , time_limit_minutes INT DEFAULT 30
    , difficulty_level VARCHAR(10) DEFAULT 'medium'
    , subject_category VARCHAR(100) DEFAULT 'general'
    , custom_topics TEXT
    , registration_end DATETIME
    , tournament_start DATETIME
    , invited_users TEXT
    , is_public BOOLEAN DEFAULT TRUE
    , prize_distribution TEXT
    , status VARCHAR(20) DEFAULT 'registration'
    , winner VARCHAR(42)
    , created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ON
    UPDATE
      CURRENT_TIMESTAMP
      , started_at DATETIME
      , completed_at DATETIME
  );

  -- Tournament participants table
  CREATE TABLE
  IF
    NOT EXISTS tournament_participants (
      id INT AUTO_INCREMENT PRIMARY KEY
      , tournament_id VARCHAR(36) NOT NULL
      , user_address VARCHAR(42) NOT NULL
      , joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
      , FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
      ON DELETE CASCADE
      , UNIQUE KEY unique_participant (tournament_id, user_address)
    );

    -- Tournament brackets table
    CREATE TABLE
    IF
      NOT EXISTS tournament_brackets (
        id INT AUTO_INCREMENT PRIMARY KEY
        , tournament_id VARCHAR(36) NOT NULL
        , bracket_data TEXT NOT NULL
        , created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        , updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON
        UPDATE
          CURRENT_TIMESTAMP
          , FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
        ON DELETE CASCADE
      );

      -- Tournament matches table
      CREATE TABLE
      IF
        NOT EXISTS tournament_matches (
          id VARCHAR(36) PRIMARY KEY
          , tournament_id VARCHAR(36) NOT NULL
          , round_number INT NOT NULL
          , player1_address VARCHAR(42)
          , player2_address VARCHAR(42)
          , winner_address VARCHAR(42)
          , status VARCHAR(20) DEFAULT 'waiting'
          , questions_generated BOOLEAN DEFAULT FALSE
          , started_at DATETIME
          , completed_at DATETIME
          , created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          , updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          ON
          UPDATE
            CURRENT_TIMESTAMP
            , FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
          ON DELETE CASCADE
        );

        -- Tournament questions table
        CREATE TABLE
        IF
          NOT EXISTS tournament_questions (
            id INT AUTO_INCREMENT PRIMARY KEY
            , tournament_id VARCHAR(36) NOT NULL
            , match_id VARCHAR(36) NOT NULL
            , questions_data TEXT NOT NULL
            , generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            , expires_at DATETIME
            , FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
            ON DELETE CASCADE
            , FOREIGN KEY (match_id) REFERENCES tournament_matches(id)
            ON DELETE CASCADE
          );

          -- Tournament submissions table
          CREATE TABLE
          IF
            NOT EXISTS tournament_submissions (
              id INT AUTO_INCREMENT PRIMARY KEY
              , tournament_id VARCHAR(36) NOT NULL
              , match_id VARCHAR(36) NOT NULL
              , user_address VARCHAR(42) NOT NULL
              , answers TEXT NOT NULL
              , score INT NOT NULL
              , correct_answers INT NOT NULL
              , total_questions INT NOT NULL
              , completion_time_ms INT
              , submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
              , FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
              ON DELETE CASCADE
              , FOREIGN KEY (match_id) REFERENCES tournament_matches(id)
              ON DELETE CASCADE
              , UNIQUE KEY unique_submission (match_id, user_address)
            );

            -- User profiles table
            CREATE TABLE
            IF
              NOT EXISTS user_profiles (
                user_address VARCHAR(42) PRIMARY KEY
                , username VARCHAR(50)
                , total_xp INT DEFAULT 0
                , tournaments_won INT DEFAULT 0
                , tournaments_participated INT DEFAULT 0
                , total_matches_played INT DEFAULT 0
                , total_matches_won INT DEFAULT 0
                , average_score DECIMAL(10, 2) DEFAULT 0
                , favorite_subjects TEXT
                , created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                , updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                ON
                UPDATE
                  CURRENT_TIMESTAMP
              );

              -- Create indexes for better performance
              CREATE INDEX
              IF
                NOT EXISTS idx_tournaments_creator
                ON tournaments(creator_address);
                CREATE INDEX
                IF
                  NOT EXISTS idx_tournaments_status
                  ON tournaments(status);
                  CREATE INDEX
                  IF
                    NOT EXISTS idx_tournaments_created
                    ON tournaments(created_at);
                    CREATE INDEX
                    IF
                      NOT EXISTS idx_tournaments_public
                      ON tournaments(is_public);

                      CREATE INDEX
                      IF
                        NOT EXISTS idx_participants_tournament
                        ON tournament_participants(tournament_id);
                        CREATE INDEX
                        IF
                          NOT EXISTS idx_participants_user
                          ON tournament_participants(user_address);

                          CREATE INDEX
                          IF
                            NOT EXISTS idx_matches_tournament
                            ON tournament_matches(tournament_id);
                            CREATE INDEX
                            IF
                              NOT EXISTS idx_matches_players
                              ON tournament_matches(player1_address, player2_address);
                              CREATE INDEX
                              IF
                                NOT EXISTS idx_matches_status
                                ON tournament_matches(status);

                                CREATE INDEX
                                IF
                                  NOT EXISTS idx_questions_tournament
                                  ON tournament_questions(tournament_id);
                                  CREATE INDEX
                                  IF
                                    NOT EXISTS idx_questions_match
                                    ON tournament_questions(match_id);

                                    CREATE INDEX
                                    IF
                                      NOT EXISTS idx_submissions_tournament
                                      ON tournament_submissions(tournament_id);
                                      CREATE INDEX
                                      IF
                                        NOT EXISTS idx_submissions_match
                                        ON tournament_submissions(match_id);
                                        CREATE INDEX
                                        IF
                                          NOT EXISTS idx_submissions_user
                                          ON tournament_submissions(user_address);

                                          CREATE INDEX
                                          IF
                                            NOT EXISTS idx_profiles_username
                                            ON user_profiles(username);
                                            CREATE INDEX
                                            IF
                                              NOT EXISTS idx_profiles_xp
                                              ON user_profiles(total_xp);

                                              -- Insert some sample data (optional)
                                              /*
                                                 INSERT IGNORE INTO user_profiles (user_address, username, total_xp) VALUES
                                                 ('0x1234567890123456789012345678901234567890', 'player1', 1000),
                                                 ('0x2345678901234567890123456789012345678901', 'player2', 800),
                                                 ('0x3456789012345678901234567890123456789012', 'player3', 1200),
                                                 ('0x4567890123456789012345678901234567890123', 'player4', 600);
                                                 */

                                              -- Show all tables
                                              SHOW TABLES;