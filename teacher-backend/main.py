#!/usr/bin/env python3
"""
BrainInk Teacher Dashboard Backend
FastAPI service for teacher dashboard with real data integration
"""

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
import uvicorn
import os
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import asyncio
import json
import uuid
from pydantic import BaseModel, EmailStr
import logging

# Database imports
try:
    import asyncpg
    from databases import Database
except ImportError:
    print("Warning: Database libraries not installed. Install with: pip install asyncpg databases")

# AI and OCR integration
import requests
from dotenv import load_dotenv

# Import quiz router from the modules file
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'BrainInk-Backend', 'users_micro', 'Endpoints'))
try:
    from modules import router as quiz_router
except ImportError:
    print("Warning: Quiz router not found. Will create local quiz endpoints.")
    quiz_router = None

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="BrainInk Teacher Dashboard API",
    description="Backend service for AI-powered teacher dashboard",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include quiz router if available
if quiz_router:
    app.include_router(quiz_router, prefix="/study-area")
    print("✅ Quiz router included successfully")
else:
    print("⚠️ Quiz router not available")

# Environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/brainink_teacher")
OCR_SERVICE_URL = os.getenv("OCR_SERVICE_URL", "http://localhost:8001")
KANA_API_URL = os.getenv("KANA_API_URL", "https://kana-backend-app.onrender.com")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")

# Database connection
database = None
if "asyncpg" in globals():
    database = Database(DATABASE_URL)

# Pydantic models
class TeacherProfile(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str = "teacher"
    school: Optional[str] = None
    subjects: List[str] = []
    classes: List[str] = []

class StudentProfile(BaseModel):
    id: str
    name: str
    email: EmailStr
    class_id: str
    overall_grade: float
    subjects: List[Dict[str, Any]]
    learning_style: str
    goals: List[str]
    recent_activity: List[Dict[str, Any]]
    kana_insights: List[Dict[str, Any]]

class ClassMetrics(BaseModel):
    class_id: str
    total_students: int
    active_students: int
    average_score: float
    completion_rate: float
    struggling_students: int
    top_performers: int
    recent_submissions: int

class AnalysisResult(BaseModel):
    id: str
    file_name: str
    student_id: Optional[str] = None
    status: str
    ocr_result: Optional[Dict[str, Any]] = None
    ai_analysis: Optional[Dict[str, Any]] = None
    timestamp: datetime
    teacher_id: str

class ImprovementPlan(BaseModel):
    student_id: str
    teacher_id: str
    goals: List[str]
    strategies: List[str]
    timeline: str
    resources: List[str]
    milestones: List[Dict[str, Any]]

class AISuggestion(BaseModel):
    id: str
    type: str  # 'teaching_strategy', 'resource', 'intervention'
    title: str
    description: str
    priority: str  # 'high', 'medium', 'low'
    applicable_students: List[str]
    category: str

# Mock data for development (replace with real database queries)
MOCK_STUDENTS = [
    {
        "id": "student_1",
        "name": "Alice Johnson",
        "email": "alice.johnson@school.edu",
        "class_id": "class_1",
        "overall_grade": 87.5,
        "subjects": [
            {"name": "Mathematics", "grade": 92, "progress": 0.85},
            {"name": "Science", "grade": 83, "progress": 0.78}
        ],
        "learning_style": "Visual",
        "goals": ["Improve problem-solving speed", "Master calculus"],
        "recent_activity": [
            {"type": "quiz", "subject": "Math", "score": 95, "date": "2024-01-15"},
            {"type": "assignment", "subject": "Science", "score": 88, "date": "2024-01-14"}
        ],
        "kana_insights": [
            {
                "type": "strength",
                "description": "Shows strong analytical thinking in mathematics",
                "confidence": 0.92
            }
        ]
    },
    {
        "id": "student_2",
        "name": "Bob Smith",
        "email": "bob.smith@school.edu",
        "class_id": "class_1",
        "overall_grade": 72.3,
        "subjects": [
            {"name": "Mathematics", "grade": 68, "progress": 0.62},
            {"name": "Science", "grade": 76, "progress": 0.71}
        ],
        "learning_style": "Kinesthetic",
        "goals": ["Improve math fundamentals", "Increase study time"],
        "recent_activity": [
            {"type": "quiz", "subject": "Math", "score": 65, "date": "2024-01-15"},
            {"type": "assignment", "subject": "Science", "score": 78, "date": "2024-01-14"}
        ],
        "kana_insights": [
            {
                "type": "concern",
                "description": "Struggling with abstract mathematical concepts",
                "confidence": 0.87
            }
        ]
    }
]

MOCK_CLASS_METRICS = {
    "class_id": "class_1",
    "total_students": 25,
    "active_students": 23,
    "average_score": 79.2,
    "completion_rate": 0.92,
    "struggling_students": 5,
    "top_performers": 8,
    "recent_submissions": 18
}

# Authentication helper
async def get_current_teacher(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TeacherProfile:
    """Validate teacher authentication and return teacher profile"""
    # In production, validate JWT token here
    # For now, return mock teacher profile
    return TeacherProfile(
        id="teacher_1",
        name="Dr. Sarah Wilson",
        email="sarah.wilson@school.edu",
        school="Lincoln High School",
        subjects=["Mathematics", "Physics"],
        classes=["class_1", "class_2"]
    )

@app.on_event("startup")
async def startup_event():
    """Initialize database connection and services"""
    logger.info("Starting BrainInk Teacher Dashboard Backend...")
    if database:
        await database.connect()
        logger.info("Database connected successfully")
    else:
        logger.warning("Database connection not available - using mock data")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    if database:
        await database.disconnect()
        logger.info("Database disconnected")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "BrainInk Teacher Dashboard API",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.get("/api/teacher/profile", response_model=TeacherProfile)
async def get_teacher_profile(teacher: TeacherProfile = Depends(get_current_teacher)):
    """Get current teacher's profile"""
    return teacher

@app.get("/api/students", response_model=List[StudentProfile])
async def get_students(teacher: TeacherProfile = Depends(get_current_teacher)):
    """Get all students for the current teacher"""
    # In production, query database based on teacher's classes
    return [StudentProfile(**student) for student in MOCK_STUDENTS]

@app.get("/api/students/{student_id}", response_model=StudentProfile)
async def get_student_profile(
    student_id: str,
    teacher: TeacherProfile = Depends(get_current_teacher)
):
    """Get detailed profile for a specific student"""
    student_data = next((s for s in MOCK_STUDENTS if s["id"] == student_id), None)
    if not student_data:
        raise HTTPException(status_code=404, detail="Student not found")
    return StudentProfile(**student_data)

@app.get("/api/class/metrics", response_model=ClassMetrics)
async def get_class_metrics(teacher: TeacherProfile = Depends(get_current_teacher)):
    """Get class performance metrics"""
    return ClassMetrics(**MOCK_CLASS_METRICS)

@app.post("/api/analyze/upload")
async def upload_and_analyze(
    files: List[UploadFile] = File(...),
    student_id: Optional[str] = None,
    teacher: TeacherProfile = Depends(get_current_teacher)
):
    """Upload files for OCR and AI analysis"""
    try:
        results = []
        for file in files:
            # Create analysis record
            analysis_id = str(uuid.uuid4())
            
            # Read file content
            content = await file.read()
            
            # Call OCR service
            ocr_response = await call_ocr_service(content, file.filename)
            
            # Call K.A.N.A. AI for analysis
            ai_analysis = await call_kana_analysis(ocr_response.get("text", ""))
            
            result = AnalysisResult(
                id=analysis_id,
                file_name=file.filename,
                student_id=student_id,
                status="completed",
                ocr_result=ocr_response,
                ai_analysis=ai_analysis,
                timestamp=datetime.utcnow(),
                teacher_id=teacher.id
            )
            
            results.append(result)
        
        return {"results": results, "count": len(results)}
    
    except Exception as e:
        logger.error(f"Error in upload_and_analyze: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/improvement-plan/send")
async def send_improvement_plan(
    plan: ImprovementPlan,
    teacher: TeacherProfile = Depends(get_current_teacher)
):
    """Send improvement plan to student via TownSquare"""
    try:
        # In production, integrate with TownSquare API
        # For now, simulate sending
        logger.info(f"Sending improvement plan for student {plan.student_id}")
        
        # Store in database
        # await store_improvement_plan(plan)
        
        # Send notification to student
        # await notify_student(plan.student_id, plan)
        
        return {
            "success": True,
            "message": "Improvement plan sent successfully",
            "plan_id": str(uuid.uuid4())
        }
    
    except Exception as e:
        logger.error(f"Error sending improvement plan: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send improvement plan")

@app.get("/api/ai-suggestions", response_model=List[AISuggestion])
async def get_ai_suggestions(teacher: TeacherProfile = Depends(get_current_teacher)):
    """Get AI-powered teaching suggestions"""
    # Mock suggestions - in production, generate based on class data
    suggestions = [
        {
            "id": "sugg_1",
            "type": "teaching_strategy",
            "title": "Visual Learning Enhancement",
            "description": "Consider using more diagrams and visual aids for mathematical concepts",
            "priority": "high",
            "applicable_students": ["student_1", "student_2"],
            "category": "pedagogy"
        },
        {
            "id": "sugg_2",
            "type": "intervention",
            "title": "Math Fundamentals Review",
            "description": "5 students need additional support with basic algebra",
            "priority": "high",
            "applicable_students": ["student_2"],
            "category": "remediation"
        }
    ]
    
    return [AISuggestion(**sugg) for sugg in suggestions]

@app.get("/api/analytics/trends")
async def get_analytics_trends(teacher: TeacherProfile = Depends(get_current_teacher)):
    """Get performance trends and analytics data"""
    # Mock analytics data
    return {
        "weekly_performance": [
            {"week": "Week 1", "average": 78.5, "submissions": 22},
            {"week": "Week 2", "average": 82.1, "submissions": 24},
            {"week": "Week 3", "average": 79.8, "submissions": 23},
            {"week": "Week 4", "average": 85.2, "submissions": 25}
        ],
        "subject_breakdown": [
            {"subject": "Mathematics", "average": 82.3, "students": 25},
            {"subject": "Science", "average": 79.1, "students": 25}
        ],
        "engagement_metrics": {
            "daily_active": 23,
            "weekly_active": 25,
            "assignment_completion": 0.92
        }
    }

# Helper functions
async def call_ocr_service(file_content: bytes, filename: str) -> Dict[str, Any]:
    """Call the OCR microservice"""
    try:
        # In production, make HTTP request to OCR service
        # For now, return mock OCR result
        return {
            "text": "Sample extracted text from image",
            "confidence": 0.95,
            "equations": ["x^2 + 2x + 1 = 0"],
            "handwriting_quality": "good"
        }
    except Exception as e:
        logger.error(f"OCR service error: {str(e)}")
        return {"error": str(e)}

async def call_kana_analysis(text: str) -> Dict[str, Any]:
    """Call K.A.N.A. AI for content analysis"""
    try:
        # In production, make HTTP request to K.A.N.A. service
        # For now, return mock analysis
        return {
            "subject": "Mathematics",
            "difficulty": "intermediate",
            "concepts": ["algebra", "quadratic equations"],
            "understanding": 0.85,
            "gaps": ["factoring techniques"],
            "suggestions": ["Practice more factoring problems", "Review quadratic formula"]
        }
    except Exception as e:
        logger.error(f"K.A.N.A. analysis error: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
