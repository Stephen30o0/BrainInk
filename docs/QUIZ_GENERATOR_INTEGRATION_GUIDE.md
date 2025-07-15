# Quiz Generator Integration Guide

## Overview
This document explains how to integrate the quiz generation system into your BrainInk backend.

## Backend Integration

### 1. Add to your main FastAPI app
In your main application file (usually `main.py` or where you initialize FastAPI), add:

```python
from Endpoints.modules import quiz_router

app = FastAPI()

# Include the quiz router
app.include_router(quiz_router, prefix="/api/v1")
```

### 2. Database Integration (Optional)
The current implementation uses in-memory storage. To integrate with your database:

1. Replace the `generated_quizzes` and `quiz_attempts` dictionaries with proper database models
2. Add database session dependencies to the endpoints
3. Update CRUD operations to use your database ORM

### 3. Authentication Integration
Add your authentication dependencies to the endpoints:

```python
@quiz_router.post("/generated")
async def create_generated_quiz(
    quiz: GeneratedQuiz,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    # ... endpoint logic
```

## Frontend Integration

### 1. Components Created
- `QuizButton`: Shows in assignment feedback, allows students to generate/take quizzes
- `QuizComponent`: The actual quiz interface for taking quizzes
- `QuizPage`: Wrapper page for the quiz component

### 2. Service Integration
The `quizGeneratorService` handles:
- Communication with backend APIs
- Fallback to local storage when backend is unavailable
- Integration with Kana AI for intelligent question generation

### 3. UI Integration Points

#### Student Dashboard (StudyCentre)
- Quiz buttons appear in assignment feedback sections
- Students can see their quiz attempts and scores
- Multiple attempts are allowed (configurable)

#### Teacher Dashboard (UploadAnalyze)
- Teachers see quiz generation options after grading
- Analytics on student quiz performance
- Overview of common weakness areas

## How It Works

### 1. Quiz Generation Flow
1. Teacher grades an assignment using Kana AI
2. Kana provides feedback and identifies weakness areas
3. QuizButton appears in assignment feedback
4. Student clicks "Create Quiz"
5. System calls Kana AI to generate 5 personalized questions
6. Quiz is saved and opened for the student

### 2. Quiz Taking Flow
1. Student takes the quiz (timed, multiple choice)
2. System calculates score and provides feedback
3. Results are saved with detailed explanations
4. Student can retake up to maximum attempts

### 3. AI Integration
- Kana AI generates contextual questions based on:
  - Student's grade level
  - Specific weakness areas identified
  - Subject matter
  - Assignment feedback
  - Appropriate difficulty level

## Configuration

### Environment Variables
Add to your `.env` file:
```
KANA_AI_URL=http://localhost:8001
QUIZ_MAX_ATTEMPTS=3
QUIZ_TIME_LIMIT_MINUTES=15
```

### Customization Options
- Number of questions per quiz (default: 5)
- Maximum attempts per quiz (default: 3)
- Time limits (default: 15 minutes)
- Difficulty algorithms
- Feedback generation

## API Endpoints Added

### Quiz Management
- `POST /api/v1/quizzes/generated` - Save a generated quiz
- `GET /api/v1/quizzes/generated/{quiz_id}` - Get specific quiz
- `GET /api/v1/quizzes/generated/student/{student_id}/assignment/{assignment_id}` - Get student's quizzes for assignment

### Quiz Taking
- `POST /api/v1/quizzes/attempts` - Submit quiz attempt
- `GET /api/v1/quizzes/attempts/student/{student_id}` - Get student's attempts

### Quiz Generation
- `POST /api/v1/quizzes/generate-with-kana` - Generate quiz using Kana AI

### Analytics
- `GET /api/v1/quizzes/analytics/teacher/{teacher_id}` - Get teacher analytics

## Benefits

### For Students
- Personalized learning based on their specific weaknesses
- Immediate feedback and explanations
- Multiple attempts to master concepts
- No impact on assignment grades (pure learning tool)

### For Teachers
- Automated generation of practice materials
- Analytics on student learning patterns
- Reduced workload for creating practice questions
- Data-driven insights into common problem areas

### For the Platform
- Enhanced engagement through gamified learning
- AI-powered personalization
- Comprehensive learning analytics
- Seamless integration with existing grading workflow

## Next Steps
1. Test the integration in your development environment
2. Add database models for persistent storage
3. Configure Kana AI integration
4. Deploy and monitor usage analytics
5. Gather user feedback for improvements
