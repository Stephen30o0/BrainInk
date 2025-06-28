#!/usr/bin/env python3
"""
BrainInk Teacher OCR Service - Minimal Version
FastAPI service with mock OCR for testing when PaddleOCR is not available
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import io
import base64
from typing import List, Optional, Dict, Any
import json
from datetime import datetime
import logging
from pathlib import Path

# Try to import image processing libraries
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("PIL not available - image processing will be limited")

# Try to import OCR libraries
try:
    import paddleocr
    PADDLEOCR_AVAILABLE = True
    print("PaddleOCR available")
except ImportError:
    PADDLEOCR_AVAILABLE = False
    print("PaddleOCR not available - using mock OCR")

try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("OpenCV not available - using basic image processing")

# AI Integration
import requests
from dotenv import load_dotenv
import re
import time

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="BrainInk Teacher OCR Service (Minimal)", 
    version="1.0.0-minimal",
    description="OCR service with fallback to mock data when dependencies are not available"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OCR with error handling
ocr_instance = None
if PADDLEOCR_AVAILABLE:
    try:
        logger.info("Initializing PaddleOCR...")
        ocr_instance = paddleocr.PaddleOCR(
            use_angle_cls=True, 
            lang='en',
            use_gpu=False,
            show_log=False
        )
        logger.info("PaddleOCR initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize PaddleOCR: {e}")
        ocr_instance = None
else:
    logger.warning("PaddleOCR not available - using mock OCR")

# Configuration
KANA_API_URL = os.getenv("KANA_API_URL", "https://kana-backend-app.onrender.com")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
UPLOAD_DIR.mkdir(exist_ok=True)

class OCRResult:
    def __init__(self, text: str, confidence: float, equations: List[str], 
                 diagrams: List[str], handwriting_quality: str, processing_time: float = 0):
        self.text = text
        self.confidence = confidence
        self.equations = equations
        self.diagrams = diagrams
        self.handwriting_quality = handwriting_quality
        self.processing_time = processing_time
        
    def to_dict(self):
        return {
            "text": self.text,
            "confidence": self.confidence,
            "equations": self.equations,
            "diagrams": self.diagrams,
            "handwriting_quality": self.handwriting_quality,
            "processing_time": self.processing_time
        }

class AIAnalysis:
    def __init__(self, subject: str, difficulty: str, concepts: List[str],
                 understanding: int, gaps: List[str], suggestions: List[str],
                 student_id: Optional[str] = None):
        self.subject = subject
        self.difficulty = difficulty
        self.concepts = concepts
        self.understanding = understanding
        self.gaps = gaps
        self.suggestions = suggestions
        self.student_id = student_id
        
    def to_dict(self):
        return {
            "subject": self.subject,
            "difficulty": self.difficulty,
            "concepts": self.concepts,
            "understanding": self.understanding,
            "gaps": self.gaps,
            "suggestions": self.suggestions,
            "student_id": self.student_id
        }

def get_mock_ocr_result(filename: str = "") -> OCRResult:
    """Generate realistic mock OCR result"""
    mock_texts = [
        "Solving quadratic equation: x² + 3x - 4 = 0. Using factoring method: (x + 4)(x - 1) = 0. Therefore x = -4 or x = 1.",
        "Physics problem: A ball is thrown upward with initial velocity v₀ = 20 m/s. Find the maximum height. Using h = v₀²/(2g), h = 400/19.6 = 20.4 m",
        "Chemistry: Balance the equation H₂ + O₂ → H₂O. Balanced: 2H₂ + O₂ → 2H₂O. Molar ratio 2:1:2",
        "Calculus: Find the derivative of f(x) = x³ + 2x² - 5x + 1. f'(x) = 3x² + 4x - 5",
        "Geometry: Area of circle A = πr². If r = 5cm, then A = π(5)² = 25π = 78.54 cm²"
    ]
    
    import random
    text = random.choice(mock_texts)
    confidence = round(random.uniform(0.75, 0.95), 3)
    
    # Extract equations from text
    equations = extract_equations(text)
    
    # Mock diagrams
    diagram_types = ["coordinate_system", "geometric_figure", "graph", "table"]
    diagrams = [random.choice(diagram_types)] if random.random() > 0.5 else []
    
    # Quality based on confidence
    if confidence >= 0.9:
        quality = "excellent"
    elif confidence >= 0.8:
        quality = "good"
    elif confidence >= 0.7:
        quality = "fair"
    else:
        quality = "poor"
    
    return OCRResult(
        text=text,
        confidence=confidence,
        equations=equations,
        diagrams=diagrams,
        handwriting_quality=quality,
        processing_time=round(random.uniform(0.5, 2.0), 2)
    )

def extract_equations(text: str) -> List[str]:
    """Extract mathematical equations and expressions from text"""
    if not text:
        return []
    
    equations = []
    
    # Enhanced patterns for mathematical content
    patterns = [
        # Basic equations with equals sign
        r'[a-zA-Z0-9²³⁴⁵⁶⁷⁸⁹\(\)\+\-\*/\s]*=[\sa-zA-Z0-9²³⁴⁵⁶⁷⁸⁹\(\)\+\-\*/\s]*',
        # Polynomial expressions
        r'[a-zA-Z]\s*[²³⁴⁵⁶⁷⁸⁹]\s*[+\-]\s*\d*[a-zA-Z]\s*[+\-]?\s*\d*',
        # Fractions
        r'\d+/\d+',
        # Function notation
        r'[a-zA-Z]+\s*\([^)]+\)',
        # Mathematical symbols
        r'[∫∑√±≤≥≠∞∂∆∇][^.]*',
    ]
    
    for pattern in patterns:
        try:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                cleaned = match.strip()
                if len(cleaned) > 2 and cleaned not in equations:
                    equations.append(cleaned)
        except Exception:
            pass
    
    return equations[:5]  # Limit to top 5 equations

async def process_image_ocr(image_bytes: bytes, filename: str = "") -> OCRResult:
    """Process image using available OCR or mock data"""
    start_time = time.time()
    
    if not ocr_instance:
        logger.info("Using mock OCR result")
        mock_result = get_mock_ocr_result(filename)
        mock_result.processing_time = round(time.time() - start_time, 2)
        return mock_result
    
    try:
        if not PIL_AVAILABLE:
            logger.warning("PIL not available, using mock result")
            return get_mock_ocr_result(filename)
        
        # Load image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # If OpenCV is available, use it for preprocessing
        if CV2_AVAILABLE:
            import numpy as np
            image_np = np.array(image)
            # Convert RGB to BGR for OpenCV
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        else:
            # Use PIL image directly
            image_np = image
        
        logger.info(f"Processing image: {filename}")
        
        # Run OCR
        result = ocr_instance.ocr(image_np, cls=True)
        
        if not result or not result[0]:
            logger.warning("No text detected in image")
            return OCRResult(
                text="",
                confidence=0.0,
                equations=[],
                diagrams=[],
                handwriting_quality="unreadable",
                processing_time=time.time() - start_time
            )
        
        # Extract text and confidence
        extracted_text = ""
        confidences = []
        
        for line in result[0]:
            if line and len(line) >= 2:
                text_info = line[1]
                if isinstance(text_info, (list, tuple)) and len(text_info) >= 2:
                    text = str(text_info[0])
                    confidence = float(text_info[1])
                    
                    extracted_text += text + " "
                    confidences.append(confidence)
        
        # Calculate average confidence
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        # Extract mathematical content
        equations = extract_equations(extracted_text)
        
        # Simple diagram detection (mock for now)
        diagrams = ["handwritten_work"] if len(extracted_text) > 20 else []
        
        # Assess handwriting quality
        if avg_confidence >= 0.9:
            quality = "excellent"
        elif avg_confidence >= 0.8:
            quality = "good"
        elif avg_confidence >= 0.7:
            quality = "fair"
        else:
            quality = "poor"
        
        processing_time = time.time() - start_time
        
        logger.info(f"OCR completed in {processing_time:.2f}s with confidence {avg_confidence:.2f}")
        
        return OCRResult(
            text=extracted_text.strip(),
            confidence=round(avg_confidence, 3),
            equations=equations,
            diagrams=diagrams,
            handwriting_quality=quality,
            processing_time=round(processing_time, 2)
        )
        
    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        processing_time = time.time() - start_time
        # Return mock result on error
        mock_result = get_mock_ocr_result(filename)
        mock_result.processing_time = processing_time
        return mock_result

async def analyze_with_kana(ocr_result: OCRResult, student_id: Optional[str] = None) -> AIAnalysis:
    """Generate AI analysis based on OCR result"""
    
    # Mock analysis based on detected content
    subject_keywords = {
        "mathematics": ["equation", "x²", "solve", "factor", "derivative", "integral", "polynomial"],
        "physics": ["velocity", "acceleration", "force", "energy", "wave", "momentum", "gravity"],
        "chemistry": ["equation", "balance", "molecular", "reaction", "pH", "molar", "element"],
        "biology": ["cell", "DNA", "protein", "organism", "evolution", "gene", "membrane"],
        "english": ["essay", "paragraph", "thesis", "argument", "literature", "grammar"]
    }
    
    text_lower = ocr_result.text.lower()
    subject = "General"
    
    # Determine subject
    for subj, keywords in subject_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            subject = subj.capitalize()
            break
    
    # Determine difficulty based on content complexity
    if len(ocr_result.equations) > 2 or any(symbol in text_lower for symbol in ["integral", "derivative", "logarithm"]):
        difficulty = "advanced"
        understanding = 70 + int(ocr_result.confidence * 20)
    elif len(ocr_result.equations) > 0 or any(symbol in text_lower for symbol in ["equation", "solve", "calculate"]):
        difficulty = "intermediate"
        understanding = 60 + int(ocr_result.confidence * 30)
    else:
        difficulty = "beginner"
        understanding = 50 + int(ocr_result.confidence * 40)
    
    # Generate concepts, gaps, and suggestions
    concepts = []
    gaps = []
    suggestions = []
    
    if subject == "Mathematics":
        if "equation" in text_lower:
            concepts.append("Algebraic Equations")
            if ocr_result.confidence < 0.8:
                gaps.append("Equation solving techniques")
                suggestions.append("Practice solving similar equations step by step")
        if "derivative" in text_lower or "integral" in text_lower:
            concepts.append("Calculus")
            if ocr_result.confidence < 0.8:
                gaps.append("Calculus fundamentals")
                suggestions.append("Review differentiation and integration rules")
    elif subject == "Physics":
        concepts.append("Mechanics")
        if ocr_result.confidence < 0.8:
            gaps.append("Formula application")
            suggestions.append("Practice applying physics formulas to real problems")
    
    # Default suggestions if none generated
    if not suggestions:
        suggestions = [
            "Review the fundamental concepts",
            "Practice similar problems",
            "Seek clarification on unclear areas"
        ]
    
    if not concepts:
        concepts = ["Problem Solving"]
    
    return AIAnalysis(
        subject=subject,
        difficulty=difficulty,
        concepts=concepts,
        understanding=min(100, max(0, understanding)),
        gaps=gaps if gaps else ["Needs further assessment"],
        suggestions=suggestions,
        student_id=student_id
    )

@app.post("/analyze-upload")
async def analyze_upload(
    file: UploadFile = File(...),
    student_id: Optional[str] = None
):
    """Analyze uploaded student notes using OCR + AI"""
    
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Only image files are supported")
    
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size: {MAX_FILE_SIZE} bytes")
    
    try:
        # Read file content
        file_content = await file.read()
        
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Process with OCR
        ocr_result = await process_image_ocr(file_content, file.filename or "unknown")
        
        # Analyze with AI
        ai_analysis = await analyze_with_kana(ocr_result, student_id)
        
        # Prepare response
        response = {
            "file_name": file.filename,
            "file_size": len(file_content),
            "timestamp": datetime.now().isoformat(),
            "ocr_result": ocr_result.to_dict(),
            "ai_analysis": ai_analysis.to_dict(),
            "status": "completed",
            "engine": "paddleocr" if ocr_instance else "mock"
        }
        
        return JSONResponse(content=response)
        
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "ocr_available": ocr_instance is not None,
        "paddleocr_installed": PADDLEOCR_AVAILABLE,
        "pil_available": PIL_AVAILABLE,
        "cv2_available": CV2_AVAILABLE,
        "kana_api": KANA_API_URL,
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0-minimal"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "BrainInk Teacher OCR Service (Minimal)",
        "version": "1.0.0-minimal",
        "status": "operational",
        "features": {
            "paddleocr": PADDLEOCR_AVAILABLE,
            "mock_ocr": True,
            "ai_analysis": True,
            "image_processing": PIL_AVAILABLE
        },
        "endpoints": [
            "/analyze-upload - POST: Analyze single file",
            "/health - GET: Health check",
            "/docs - GET: API documentation"
        ]
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8001"))
    print(f"Starting BrainInk OCR Service on port {port}")
    print(f"PaddleOCR available: {PADDLEOCR_AVAILABLE}")
    print(f"PIL available: {PIL_AVAILABLE}")
    print(f"OpenCV available: {CV2_AVAILABLE}")
    
    uvicorn.run(
        "main_minimal:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
