-- Tournament System Database Schema
-- This script creates all the necessary tables for the tournament system
-- Run this script in your MySQL database to set up the tournament tables

-- Note: Execute these commands one by one in your MySQL client

-- Tournaments table (main tournament information)
CREATE TABLE tournaments (
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
  , started_at DATETIME
  , completed_at DATETIME
);

-- Tournament participants table
CREATE TABLE tournament_participants (
  id INT AUTO_INCREMENT PRIMARY KEY
  , tournament_id VARCHAR(36) NOT NULL
  , user_address VARCHAR(42) NOT NULL
  , joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tournament brackets table
CREATE TABLE tournament_brackets (
  id INT AUTO_INCREMENT PRIMARY KEY
  , tournament_id VARCHAR(36) NOT NULL
  , bracket_data TEXT NOT NULL
  , created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  , updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tournament matches table
CREATE TABLE tournament_matches (
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
);

-- Tournament questions table
CREATE TABLE tournament_questions (
  id INT AUTO_INCREMENT PRIMARY KEY
  , tournament_id VARCHAR(36) NOT NULL
  , match_id VARCHAR(36) NOT NULL
  , questions_data TEXT NOT NULL
  , generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  , expires_at DATETIME
);

-- Tournament submissions table
CREATE TABLE tournament_submissions (
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
);

-- User profiles table
CREATE TABLE user_profiles (
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
);

-- Create indexes for better performance
-- Run these after creating the tables
-- CREATE INDEX idx_creator ON tournaments(creator_address);
-- CREATE INDEX idx_status ON tournaments(status);
-- CREATE INDEX idx_created ON tournaments(created_at);
-- CREATE INDEX idx_tournament_participants ON tournament_participants(tournament_id);
-- CREATE INDEX idx_user_participants ON tournament_participants(user_address);
-- CREATE INDEX idx_tournament_matches ON tournament_matches(tournament_id);
-- CREATE INDEX idx_match_submissions ON tournament_submissions(match_id);
-- CREATE INDEX idx_user_submissions ON tournament_submissions(user_address);