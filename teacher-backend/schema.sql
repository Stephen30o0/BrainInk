-- BrainInk Teacher Dashboard Database Schema
-- PostgreSQL Schema for teacher dashboard data

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS improvement_plans CASCADE;
DROP TABLE IF EXISTS analysis_results CASCADE;
DROP TABLE IF EXISTS ai_suggestions CASCADE;
DROP TABLE IF EXISTS student_activities CASCADE;
DROP TABLE IF EXISTS class_enrollments CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;

-- Teachers table
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'teacher',
    school VARCHAR(255),
    subjects TEXT[],
    profile_image_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes table
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    description TEXT,
    capacity INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    grade_level VARCHAR(50),
    learning_style VARCHAR(100),
    goals TEXT[],
    profile_image_url TEXT,
    brain_ink_user_id VARCHAR(255), -- Link to main Brain Ink platform
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class enrollments (many-to-many relationship)
CREATE TABLE class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    overall_grade DECIMAL(5,2),
    UNIQUE(class_id, student_id)
);

-- Student activities and submissions
CREATE TABLE student_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL, -- 'quiz', 'assignment', 'note_upload', etc.
    subject VARCHAR(100),
    title VARCHAR(255),
    description TEXT,
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    completion_status VARCHAR(50) DEFAULT 'pending',
    submission_data JSONB DEFAULT '{}',
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Analysis results from OCR and AI
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT,
    file_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'processing',
    ocr_result JSONB DEFAULT '{}',
    ai_analysis JSONB DEFAULT '{}',
    kana_insights JSONB DEFAULT '{}',
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI-generated suggestions for teachers
CREATE TABLE ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    suggestion_type VARCHAR(100) NOT NULL, -- 'teaching_strategy', 'resource', 'intervention'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium',
    category VARCHAR(100),
    applicable_students UUID[],
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Improvement plans sent to students
CREATE TABLE improvement_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    goals TEXT[] NOT NULL,
    strategies TEXT[] NOT NULL,
    timeline VARCHAR(255),
    resources TEXT[],
    milestones JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'active',
    sent_to_townsquare BOOLEAN DEFAULT FALSE,
    townsquare_message_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_teachers_email ON teachers(email);
CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX idx_class_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX idx_class_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX idx_student_activities_student_id ON student_activities(student_id);
CREATE INDEX idx_student_activities_class_id ON student_activities(class_id);
CREATE INDEX idx_student_activities_created_at ON student_activities(created_at);
CREATE INDEX idx_analysis_results_teacher_id ON analysis_results(teacher_id);
CREATE INDEX idx_analysis_results_student_id ON analysis_results(student_id);
CREATE INDEX idx_analysis_results_created_at ON analysis_results(created_at);
CREATE INDEX idx_ai_suggestions_teacher_id ON ai_suggestions(teacher_id);
CREATE INDEX idx_ai_suggestions_class_id ON ai_suggestions(class_id);
CREATE INDEX idx_improvement_plans_teacher_id ON improvement_plans(teacher_id);
CREATE INDEX idx_improvement_plans_student_id ON improvement_plans(student_id);

-- Triggers for updated_at fields
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_improvement_plans_updated_at BEFORE UPDATE ON improvement_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
INSERT INTO teachers (id, name, email, password_hash, school, subjects) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Dr. Sarah Wilson', 'sarah.wilson@school.edu', '$2b$12$hashed_password', 'Lincoln High School', '{"Mathematics", "Physics"}'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Prof. Mike Johnson', 'mike.johnson@school.edu', '$2b$12$hashed_password', 'Lincoln High School', '{"Chemistry", "Biology"}');

INSERT INTO classes (id, name, subject, grade_level, teacher_id) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'Advanced Mathematics', 'Mathematics', '11th Grade', '550e8400-e29b-41d4-a716-446655440001'),
    ('660e8400-e29b-41d4-a716-446655440002', 'Physics Fundamentals', 'Physics', '10th Grade', '550e8400-e29b-41d4-a716-446655440001');

INSERT INTO students (id, name, email, learning_style, goals, brain_ink_user_id) VALUES
    ('770e8400-e29b-41d4-a716-446655440001', 'Alice Johnson', 'alice.johnson@school.edu', 'Visual', '{"Improve problem-solving speed", "Master calculus"}', 'alice_brainink_123'),
    ('770e8400-e29b-41d4-a716-446655440002', 'Bob Smith', 'bob.smith@school.edu', 'Kinesthetic', '{"Improve math fundamentals", "Increase study time"}', 'bob_brainink_124'),
    ('770e8400-e29b-41d4-a716-446655440003', 'Carol Davis', 'carol.davis@school.edu', 'Auditory', '{"Master physics concepts", "Improve lab skills"}', 'carol_brainink_125');

INSERT INTO class_enrollments (class_id, student_id, overall_grade) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 87.5),
    ('660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 72.3),
    ('660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 91.2),
    ('660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440003', 84.7);

INSERT INTO student_activities (student_id, class_id, activity_type, subject, title, score, max_score, completion_status) VALUES
    ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'quiz', 'Mathematics', 'Algebra Quiz #1', 95, 100, 'completed'),
    ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'assignment', 'Mathematics', 'Calculus Problem Set', 88, 100, 'completed'),
    ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'quiz', 'Mathematics', 'Algebra Quiz #1', 65, 100, 'completed'),
    ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'assignment', 'Mathematics', 'Calculus Problem Set', 78, 100, 'completed');

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO brainink_teacher_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO brainink_teacher_user;
