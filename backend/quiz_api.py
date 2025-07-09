"""
Quiz API endpoints for BrainInk education platform.

This module provides endpoints for:
- Generating quizzes based on assignment feedback
- Managing quiz attempts and results
- Teacher quiz oversight and analytics
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import requests
from datetime import datetime, timezone

from database import get_db
from auth_dependencies import get_current_user_from_token
from models import User

router = APIRouter(prefix="/study-area/quizzes", tags=["Generated Quizzes"])


# Pydantic models for request/response
from pydantic import BaseModel

class QuizQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_answer: int
    explanation: str
    difficulty: str
    topic: str
    weakness_area: str

class GeneratedQuiz(BaseModel):
    id: str
    assignment_id: int
    student_id: int
    title: str
    description: str
    questions: List[QuizQuestion]
    weakness_areas: List[str]
    created_at: datetime
    max_attempts: int = 3
    time_limit_minutes: Optional[int] = 15

class QuizAttempt(BaseModel):
    id: str
    quiz_id: str
    student_id: int
    answers: dict  # {question_id: answer_index}
    score: int
    completed_at: datetime
    time_taken_seconds: int
    feedback: str

class QuizGenerationRequest(BaseModel):
    assignment_id: int
    student_id: int
    feedback: str
    weakness_areas: List[str]
    subject: str
    grade: int

class QuizAttemptRequest(BaseModel):
    quiz_id: str
    answers: dict
    time_taken_seconds: int


# In-memory storage (replace with database models in production)
generated_quizzes = {}
quiz_attempts = {}


@router.post("/generated", response_model=dict)
async def create_generated_quiz(
    quiz: GeneratedQuiz,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Save a generated quiz to the system."""
    try:
        # Store quiz in memory (replace with database storage)
        generated_quizzes[quiz.id] = quiz.dict()
        
        print(f"✅ Quiz {quiz.id} saved for student {quiz.student_id}")
        
        return {
            "success": True,
            "message": "Quiz saved successfully",
            "quiz_id": quiz.id
        }
    except Exception as e:
        print(f"❌ Failed to save quiz: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save quiz"
        )


@router.get("/generated/{quiz_id}", response_model=GeneratedQuiz)
async def get_quiz(
    quiz_id: str,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get a specific quiz by ID."""
    try:
        if quiz_id not in generated_quizzes:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found"
            )
        
        quiz_data = generated_quizzes[quiz_id]
        
        # Add attempts to the quiz data
        quiz_attempts_list = [
            attempt for attempt in quiz_attempts.values()
            if attempt["quiz_id"] == quiz_id
        ]
        quiz_data["attempts"] = quiz_attempts_list
        
        return quiz_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Failed to get quiz: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve quiz"
        )


@router.get("/generated/student/{student_id}/assignment/{assignment_id}", response_model=List[GeneratedQuiz])
async def get_student_quizzes_for_assignment(
    student_id: int,
    assignment_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get all quizzes for a specific student and assignment."""
    try:
        student_quizzes = []
        
        for quiz_data in generated_quizzes.values():
            if (quiz_data["student_id"] == student_id and 
                quiz_data["assignment_id"] == assignment_id):
                
                # Add attempts to the quiz data
                quiz_attempts_list = [
                    attempt for attempt in quiz_attempts.values()
                    if attempt["quiz_id"] == quiz_data["id"]
                ]
                quiz_data["attempts"] = quiz_attempts_list
                student_quizzes.append(quiz_data)
        
        return student_quizzes
    except Exception as e:
        print(f"❌ Failed to get student quizzes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve student quizzes"
        )


@router.post("/attempts", response_model=QuizAttempt)
async def submit_quiz_attempt(
    attempt_request: QuizAttemptRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Submit a quiz attempt and calculate score."""
    try:
        quiz_id = attempt_request.quiz_id
        
        if quiz_id not in generated_quizzes:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found"
            )
        
        quiz_data = generated_quizzes[quiz_id]
        questions = quiz_data["questions"]
        
        # Calculate score
        correct_answers = 0
        total_questions = len(questions)
        
        for question in questions:
            question_id = question["id"]
            correct_answer = question["correct_answer"]
            user_answer = attempt_request.answers.get(question_id)
            
            if user_answer == correct_answer:
                correct_answers += 1
        
        score = round((correct_answers / total_questions) * 100) if total_questions > 0 else 0
        
        # Generate feedback
        feedback = generate_attempt_feedback(score, correct_answers, total_questions)
        
        # Create attempt record
        attempt_id = f"attempt_{datetime.now().timestamp()}"
        attempt = {
            "id": attempt_id,
            "quiz_id": quiz_id,
            "student_id": current_user.id,
            "answers": attempt_request.answers,
            "score": score,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "time_taken_seconds": attempt_request.time_taken_seconds,
            "feedback": feedback
        }
        
        # Store attempt
        quiz_attempts[attempt_id] = attempt
        
        print(f"✅ Quiz attempt {attempt_id} submitted with score {score}%")
        
        return attempt
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Failed to submit quiz attempt: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit quiz attempt"
        )


@router.get("/attempts/student/{student_id}", response_model=List[QuizAttempt])
async def get_student_attempts(
    student_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get all quiz attempts for a specific student."""
    try:
        student_attempts = [
            attempt for attempt in quiz_attempts.values()
            if attempt["student_id"] == student_id
        ]
        
        return student_attempts
    except Exception as e:
        print(f"❌ Failed to get student attempts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve student attempts"
        )


@router.get("/analytics/teacher/{teacher_id}")
async def get_teacher_quiz_analytics(
    teacher_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get quiz analytics for a teacher."""
    try:
        # This would be more complex with proper database relationships
        analytics = {
            "total_quizzes_generated": len(generated_quizzes),
            "total_attempts": len(quiz_attempts),
            "average_score": calculate_average_score(),
            "common_weakness_areas": get_common_weakness_areas(),
            "student_engagement": calculate_student_engagement()
        }
        
        return analytics
    except Exception as e:
        print(f"❌ Failed to get teacher analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve analytics"
        )


def generate_attempt_feedback(score: int, correct: int, total: int) -> str:
    """Generate personalized feedback for a quiz attempt."""
    if score >= 80:
        return f"Excellent work! You scored {score}% ({correct}/{total} correct). You show great improvement in your understanding!"
    elif score >= 60:
        return f"Good effort! You scored {score}% ({correct}/{total} correct). You're making progress - keep practicing!"
    else:
        return f"You scored {score}% ({correct}/{total} correct). Don't worry, this is a learning opportunity! Review the explanations and try again."


def calculate_average_score() -> float:
    """Calculate average score across all quiz attempts."""
    if not quiz_attempts:
        return 0.0
    
    total_score = sum(attempt["score"] for attempt in quiz_attempts.values())
    return round(total_score / len(quiz_attempts), 2)


def get_common_weakness_areas() -> List[str]:
    """Get the most common weakness areas across all quizzes."""
    weakness_counts = {}
    
    for quiz in generated_quizzes.values():
        for area in quiz["weakness_areas"]:
            weakness_counts[area] = weakness_counts.get(area, 0) + 1
    
    # Return top 5 most common areas
    return sorted(weakness_counts.keys(), key=lambda x: weakness_counts[x], reverse=True)[:5]


def calculate_student_engagement() -> dict:
    """Calculate student engagement metrics."""
    student_quiz_counts = {}
    
    for quiz in generated_quizzes.values():
        student_id = quiz["student_id"]
        student_quiz_counts[student_id] = student_quiz_counts.get(student_id, 0) + 1
    
    return {
        "active_students": len(student_quiz_counts),
        "average_quizzes_per_student": round(sum(student_quiz_counts.values()) / len(student_quiz_counts), 2) if student_quiz_counts else 0
    }
