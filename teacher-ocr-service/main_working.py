#!/usr/bin/env python3
"""
BrainInk Teacher OCR Service - Working Version with K.A.N.A. Integration
Replaces the main.py with a working implementation that doesn't use lazy loading
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
import asyncio
import logging
from pathlib import Path
import time

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize PaddleOCR at startup - NO LAZY LOADING
print("🔧 Initializing PaddleOCR at startup...")
try:
    import paddleocr
    from PIL import Image, ImageEnhance, ImageFilter
    import numpy as np
    import cv2
    import requests
    
    # Initialize OCR immediately with CPU mode for stability
    ocr_instance = paddleocr.PaddleOCR(lang='en', use_gpu=False)
    print("✅ PaddleOCR initialized successfully!")
    PADDLEOCR_AVAILABLE = True
except Exception as e:
    print(f"❌ PaddleOCR initialization failed: {e}")
    ocr_instance = None
    PADDLEOCR_AVAILABLE = False

# Configuration
KANA_API_URL = os.getenv("KANA_API_URL", "http://localhost:10000")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
UPLOAD_DIR.mkdir(exist_ok=True)

# Supported file types
SUPPORTED_IMAGE_TYPES = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}
SUPPORTED_EXTENSIONS = SUPPORTED_IMAGE_TYPES | {".pdf"}

class OCRResult:
    def __init__(self, text: str, confidence: float, bounding_boxes: List = None, processing_time: float = 0):
        self.text = text
        self.confidence = confidence
        self.bounding_boxes = bounding_boxes or []
        self.processing_time = processing_time

app = FastAPI(
    title="BrainInk Teacher OCR Service",
    description="OCR and AI-powered analysis of student notes",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def preprocess_image(image: Image.Image) -> Image.Image:
    """Preprocess image for better OCR recognition"""
    try:
        logger.info("Preprocessing image for OCR...")
        
        # Convert to RGB if necessary
        if image.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'RGBA':
                background.paste(image, mask=image.split()[-1])
            else:
                background.paste(image, mask=image.split()[-1])
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Enhance contrast for better text recognition
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.2)
        
        # Enhance sharpness
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.1)
        
        return image
    except Exception as e:
        logger.warning(f"Image preprocessing failed: {e}")
        return image

async def process_image_ocr(image_bytes: bytes, filename: str = "") -> OCRResult:
    """Process image using PaddleOCR with enhanced error handling"""
    start_time = time.time()
    
    if not PADDLEOCR_AVAILABLE or ocr_instance is None:
        logger.warning("PaddleOCR not available, using mock analysis")
        return OCRResult(
            text="🚨 MOCK DATA: PaddleOCR not available - this is fallback text",
            confidence=0.0,
            processing_time=time.time() - start_time
        )
    
    try:
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        logger.info(f"Processing image: {filename}, size: {image.size}, mode: {image.mode}")
        
        # Preprocess image
        image = preprocess_image(image)
        
        # Convert to numpy array for PaddleOCR
        img_array = np.array(image)
        
        # Run OCR
        logger.info("Running PaddleOCR...")
        result = ocr_instance.ocr(img_array)
        logger.info(f"OCR completed, result: {result}")
        
        # Extract text and confidence
        extracted_text = ""
        total_confidence = 0
        text_count = 0
        bounding_boxes = []
        
        if result and result[0]:
            for line in result[0]:
                bbox, (text, confidence) = line
                extracted_text += text + " "
                total_confidence += confidence
                text_count += 1
                bounding_boxes.append({
                    "bbox": bbox,
                    "text": text,
                    "confidence": confidence
                })
        
        avg_confidence = total_confidence / text_count if text_count > 0 else 0
        processing_time = time.time() - start_time
        
        if extracted_text.strip():
            logger.info(f"✅ OCR successful: extracted {len(extracted_text.strip())} characters")
            return OCRResult(
                text=extracted_text.strip(),
                confidence=avg_confidence,
                bounding_boxes=bounding_boxes,
                processing_time=processing_time
            )
        else:
            logger.info("OCR completed but no text detected")
            return OCRResult(
                text="No text detected in image",
                confidence=0.0,
                processing_time=processing_time
            )
            
    except Exception as e:
        logger.error(f"OCR processing error: {e}")
        return OCRResult(
            text=f"OCR processing failed: {str(e)}",
            confidence=0.0,
            processing_time=time.time() - start_time
        )

async def analyze_with_kana(text: str, image_filename: str = "") -> Dict[str, Any]:
    """Send extracted text to K.A.N.A. for AI analysis"""
    
    if not text or len(text.strip()) < 3:
        return {
            "analysis": "Insufficient text for meaningful analysis",
            "knowledge_gaps": [],
            "recommendations": ["Upload a clearer image with more visible text"],
            "confidence": 0.0
        }
    
    try:
        logger.info(f"Sending text to K.A.N.A. API: {KANA_API_URL}")
        
        # Prepare request for K.A.N.A.
        kana_payload = {
            "message": f"Analyze this student content for educational insights: {text}",
            "context": "teacher_dashboard_ocr",
            "image_filename": image_filename
        }
        
        # Send to K.A.N.A. backend
        response = requests.post(
            f"{KANA_API_URL}/api/kana/analyze", 
            json=kana_payload,
            timeout=30
        )
        
        if response.status_code == 200:
            analysis_result = response.json()
            logger.info("✅ K.A.N.A. analysis successful")
            return analysis_result
        else:
            logger.warning(f"K.A.N.A. API error: {response.status_code}")
            return {
                "analysis": f"K.A.N.A. API returned status {response.status_code}",
                "knowledge_gaps": ["API communication issue"],
                "recommendations": ["Check K.A.N.A. backend service"],
                "confidence": 0.0
            }
            
    except requests.exceptions.RequestException as e:
        logger.error(f"K.A.N.A. API request failed: {e}")
        return {
            "analysis": f"Unable to connect to K.A.N.A. backend: {str(e)}",
            "knowledge_gaps": ["Backend connectivity issue"],
            "recommendations": ["Ensure K.A.N.A. backend is running", "Check network connectivity"],
            "confidence": 0.0
        }
    except Exception as e:
        logger.error(f"K.A.N.A. analysis error: {e}")
        return {
            "analysis": f"Analysis failed: {str(e)}",
            "knowledge_gaps": ["Analysis error"],
            "recommendations": ["Try again with different content"],
            "confidence": 0.0
        }

@app.get("/health")
async def health_check():
    """Health check endpoint with detailed status"""
    
    # Test OCR with a simple operation
    ocr_working = False
    if PADDLEOCR_AVAILABLE and ocr_instance:
        try:
            import numpy as np
            test_image = np.ones((50, 100, 3), dtype=np.uint8) * 255
            test_result = ocr_instance.ocr(test_image)
            ocr_working = True
            print(f"🔧 HEALTH CHECK: OCR test passed - result: {test_result}")
        except Exception as e:
            print(f"🔧 HEALTH CHECK: OCR test failed - {e}")
            ocr_working = False
    else:
        print("🔧 HEALTH CHECK: ocr_instance is None")
    
    return {
        "status": "healthy",
        "ocr_available": PADDLEOCR_AVAILABLE and ocr_instance is not None,
        "ocr_working": ocr_working,
        "kana_api": KANA_API_URL,
        "google_api_configured": bool(GOOGLE_API_KEY),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/ocr")
async def process_ocr(file: UploadFile = File(...)):
    """Process OCR on uploaded image"""
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in SUPPORTED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Supported: {', '.join(SUPPORTED_IMAGE_TYPES)}"
        )
    
    # Check file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")
    
    # Process with OCR
    ocr_result = await process_image_ocr(content, file.filename)
    
    return {
        "success": True,
        "filename": file.filename,
        "text": ocr_result.text,
        "confidence": ocr_result.confidence,
        "bounding_boxes": ocr_result.bounding_boxes,
        "processing_time": ocr_result.processing_time,
        "message": "✅ Real OCR processing completed" if PADDLEOCR_AVAILABLE else "Mock OCR response"
    }

@app.post("/ocr-analyze")
async def process_ocr_and_analyze(file: UploadFile = File(...)):
    """Process OCR and perform K.A.N.A. AI analysis"""
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in SUPPORTED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Supported: {', '.join(SUPPORTED_IMAGE_TYPES)}"
        )
    
    # Check file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")
    
    # Process with OCR
    ocr_result = await process_image_ocr(content, file.filename)
    
    # Analyze with K.A.N.A. if text was extracted
    if ocr_result.text and ocr_result.text != "No text detected in image":
        kana_analysis = await analyze_with_kana(ocr_result.text, file.filename)
    else:
        kana_analysis = {
            "analysis": "No text detected for analysis",
            "knowledge_gaps": [],
            "recommendations": ["Upload an image with clearer text"],
            "confidence": 0.0
        }
    
    return {
        "success": True,
        "filename": file.filename,
        "ocr": {
            "text": ocr_result.text,
            "confidence": ocr_result.confidence,
            "bounding_boxes": ocr_result.bounding_boxes,
            "processing_time": ocr_result.processing_time
        },
        "analysis": kana_analysis,
        "message": "✅ OCR and AI analysis completed" if PADDLEOCR_AVAILABLE else "Mock response"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "BrainInk Teacher OCR Service",
        "version": "2.0.0",
        "status": "ready",
        "ocr_available": PADDLEOCR_AVAILABLE and ocr_instance is not None,
        "endpoints": {
            "/health - GET": "Health check",
            "/ocr - POST": "OCR processing only",
            "/ocr-analyze - POST": "OCR + K.A.N.A. AI analysis",
            "/ - GET": "This endpoint"
        }
    }

if __name__ == "__main__":
    print("🚀 Starting BrainInk Teacher OCR Service...")
    print(f"🔧 OCR Available: {PADDLEOCR_AVAILABLE}")
    print(f"🔧 K.A.N.A. API: {KANA_API_URL}")
    print(f"🔧 Google API Key: {'✅ Configured' if GOOGLE_API_KEY else '❌ Not configured'}")
    uvicorn.run(app, host="0.0.0.0", port=8001)
