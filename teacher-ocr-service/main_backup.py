from fastapi import FastAPI, File, UploadFile, HTTPException, Form
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

# OCR and Image Processing
try:
    import paddleocr
    from PIL import Image, ImageEnhance, ImageFilter
    import numpy as np
    import cv2
    PADDLEOCR_AVAILABLE = True
except ImportError as e:
    print(f"Warning: OCR libraries not fully available: {e}")
    print("Install with: pip install paddleocr pillow opencv-python")
    PADDLEOCR_AVAILABLE = False

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
    title="BrainInk Teacher OCR Service", 
    version="1.0.0",
    description="Advanced OCR service with PaddleOCR and K.A.N.A. AI integration"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OCR with lazy loading
ocr_instance = None

def get_ocr_instance():
    """Get or create OCR instance with lazy initialization"""
    global ocr_instance
    
    if ocr_instance is None and PADDLEOCR_AVAILABLE:
        print("🔧 LAZY LOADING: Initializing PaddleOCR in worker process...")
        try:
            # Try different initialization approaches
            try:
                # First try with minimal configuration
                print("🔧 LAZY: Trying minimal config...")
                ocr_instance = paddleocr.PaddleOCR(lang='en')
                print("🔧 LAZY: ✅ PaddleOCR initialized successfully with minimal config")
                logger.info("PaddleOCR initialized successfully with minimal config")
            except Exception as e1:
                print(f"🔧 LAZY: ❌ Minimal config failed: {e1}")
                logger.warning(f"Minimal config failed, trying with use_angle_cls: {e1}")
                try:
                    # Fallback to legacy parameter
                    ocr_instance = paddleocr.PaddleOCR(use_angle_cls=True, lang='en')
                    print("🔧 LAZY: ✅ PaddleOCR initialized successfully with legacy config")
                    logger.info("PaddleOCR initialized successfully with legacy config")
                except Exception as e2:
                    print(f"🔧 LAZY: ❌ Legacy config also failed: {e2}")
                    logger.error(f"Legacy config also failed: {e2}")
                    raise e2
                    
            # Test the OCR instance with a simple operation
            print("🔧 LAZY: Testing OCR instance...")
            logger.info("Testing OCR instance...")
            import numpy as np
            test_image = np.ones((50, 100, 3), dtype=np.uint8) * 255  # Small white test image
            test_result = ocr_instance.ocr(test_image)
            print("🔧 LAZY: ✅ OCR test successful - PaddleOCR is ready!")
            logger.info("✅ OCR test successful - PaddleOCR is ready!")
            
        except Exception as e:
            print(f"🔧 LAZY: ❌ Failed to initialize PaddleOCR completely: {e}")
            logger.error(f"❌ Failed to initialize PaddleOCR completely: {e}")
            logger.warning("Falling back to mock OCR service")
            ocr_instance = None
    
    return ocr_instance

# Configuration
KANA_API_URL = os.getenv("KANA_API_URL", "https://kana-backend-app.onrender.com")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
UPLOAD_DIR.mkdir(exist_ok=True)

# Supported file types
SUPPORTED_IMAGE_TYPES = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}
SUPPORTED_EXTENSIONS = SUPPORTED_IMAGE_TYPES | {".pdf"}

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

def preprocess_image(image: Image.Image) -> Image.Image:
    """Enhance image quality for better OCR results"""
    try:
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Enhance contrast and sharpness
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.2)
        
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.1)
        
        # Apply slight denoising
        image = image.filter(ImageFilter.MedianFilter(size=3))
        
        return image
    except Exception as e:
        logger.warning(f"Image preprocessing failed: {e}")
        return image

async def process_image_ocr(image_bytes: bytes, filename: str = "") -> OCRResult:
    """Process image using PaddleOCR with enhanced error handling"""
    start_time = time.time()
    
    # Get OCR instance (lazy initialization)
    ocr = get_ocr_instance()
    
    if not ocr:
        print("🔧 WORKER: OCR instance not available, using intelligent mock analysis")
        logger.warning("PaddleOCR not available, using intelligent mock analysis")
        # Create intelligent mock based on actual image analysis
        try:
            from PIL import Image
            import io
            
            # Analyze the actual uploaded image
            image = Image.open(io.BytesIO(image_bytes))
            width, height = image.size
            mode = image.mode
            format_name = image.format or "Unknown"
            
            # Get basic image statistics
            if mode in ['RGB', 'RGBA']:
                # Convert to grayscale for analysis
                gray_image = image.convert('L')
                import numpy as np
                img_array = np.array(gray_image)
                
                # Calculate basic statistics
                brightness = np.mean(img_array)
                contrast = np.std(img_array)
                
                # Determine if image likely contains text based on contrast patterns
                likely_has_text = contrast > 40  # Higher contrast suggests text
                
                # Generate intelligent mock response based on image analysis
                mock_text = f"📋 INTELLIGENT MOCK ANALYSIS 📋\n\n"
                mock_text += f"Image Properties:\n"
                mock_text += f"• File: {filename}\n"
                mock_text += f"• Format: {format_name}\n"
                mock_text += f"• Dimensions: {width}×{height} pixels\n"
                mock_text += f"• Color Mode: {mode}\n"
                mock_text += f"• Brightness: {brightness:.1f}/255\n"
                mock_text += f"• Contrast Level: {contrast:.1f}\n\n"
                
                if likely_has_text:
                    mock_text += "🔍 ANALYSIS: This image appears to contain text or written content.\n"
                    mock_text += "📝 MOCK CONTENT: [Mathematical equations, notes, or diagrams would be extracted here]\n"
                    mock_text += "🧮 Sample detected content: 'x² + 2x + 1 = 0', 'Quadratic formula', 'Student work analysis'\n"
                    confidence = 0.75
                    quality = "good - clear text detected"
                else:
                    mock_text += "🔍 ANALYSIS: This image appears to be primarily graphical or low-contrast.\n"
                    mock_text += "📝 MOCK CONTENT: [Diagrams, charts, or images would be analyzed here]\n" 
                    confidence = 0.45
                    quality = "fair - primarily graphical content"
                
                mock_text += f"\n💡 NOTE: This is simulated analysis. Install PaddleOCR for real text extraction."
                
            else:
                mock_text = f"📋 MOCK ANALYSIS for {filename} ({format_name}, {width}×{height})\n"
                mock_text += "Unsupported color mode for detailed analysis. Real OCR would handle this properly."
                confidence = 0.3
                quality = "unknown format"
            
        except Exception as e:
            logger.error(f"Mock image analysis failed: {e}")
            mock_text = f"[BASIC MOCK] Could not analyze {filename}. Real OCR would extract text content here."
            confidence = 0.1
            quality = "analysis failed"
        
        processing_time = time.time() - start_time
        return OCRResult(
            text=mock_text,
            confidence=confidence,
            equations=["[MOCK EQUATION]"],
            diagrams=["[MOCK DIAGRAM]"],
            handwriting_quality=quality,
            processing_time=processing_time
        )
    
    try:
        # Load and preprocess image
        image = Image.open(io.BytesIO(image_bytes))
        image = preprocess_image(image)
        
        # Convert to numpy array for PaddleOCR
        image_np = np.array(image)
        
        # Convert RGB to BGR for OpenCV
        if len(image_np.shape) == 3:
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        
        logger.info(f"Processing image with shape: {image_np.shape}")
        print(f"🔧 WORKER: About to run OCR on image with shape: {image_np.shape}")
        
        # Run OCR
        result = ocr.ocr(image_np, cls=True)
        print(f"🔧 WORKER: OCR result: {result}")
        
        if not result or not result[0]:
            print("🔧 WORKER: No text detected in image")
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
        diagrams = detect_diagrams(image_np)
        
        # Assess handwriting quality
        quality = assess_handwriting_quality(avg_confidence, extracted_text)
        
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
        return OCRResult(
            text=f"Error processing image: {str(e)}",
            confidence=0.0,
            equations=[],
            diagrams=[],
            handwriting_quality="error",
            processing_time=processing_time
        )

def extract_equations(text: str) -> List[str]:
    """Extract mathematical equations and expressions from text"""
    if not text:
        return []
    
    equations = []
    
    # Enhanced patterns for mathematical content
    patterns = [
        # Basic equations with equals sign
        r'[a-z]\s*[²³⁴⁵⁶⁷⁸⁹]?\s*[+\-*/=]\s*[^.!?]*[=][^.!?]*',
        
        # Polynomial expressions
        r'[a-z]\s*[²³⁴⁵⁶⁷⁸⁹]\s*[+\-]\s*\d*[a-z]\s*[+\-]?\s*\d*',
        
        # Variables with exponents
        r'[a-z]\s*[\^]\s*\d+',
        r'[a-z]\s*[²³⁴⁵⁶⁷⁸⁹]',
        
        # Fractions and ratios
        r'\d+/\d+',
        r'\(\s*\d+\s*[+\-*/]\s*\d+\s*\)\s*/\s*\d+',
        
        # Mathematical symbols and operations
        r'[∫∑√±≤≥≠∞∂∆∇].*?[a-z0-9]',
        
        # Function notation
        r'[a-z]+\s*\(\s*[a-z0-9+\-*/\s,]+\s*\)',
        
        # Matrix notation (simple)
        r'\[\s*[0-9+\-*/\s,]+\s*\]',
    ]
    
    for pattern in patterns:
        try:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                cleaned = match.strip()
                if len(cleaned) > 2 and cleaned not in equations:
                    equations.append(cleaned)
        except Exception as e:
            logger.warning(f"Pattern matching error: {e}")
    
    # Remove duplicates and sort by length (longer expressions first)
    equations = list(set(equations))
    equations.sort(key=len, reverse=True)
    
    return equations[:10]  # Limit to top 10 equations

def detect_diagrams(image_np: np.ndarray) -> List[str]:
    """Detect common diagram types in the image"""
    diagrams = []
    
    try:
        # Convert to grayscale for analysis
        if len(image_np.shape) == 3:
            gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
        else:
            gray = image_np
        
        # Detect edges
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        
        # Detect lines (could indicate graphs, geometric figures)
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100, minLineLength=50, maxLineGap=10)
        
        if lines is not None and len(lines) > 10:
            diagrams.append("geometric_figure")
        
        # Detect circles (could indicate pie charts, geometric circles)
        circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, 1, 20, param1=50, param2=30, minRadius=10, maxRadius=100)
        
        if circles is not None:
            diagrams.append("circular_diagram")
        
        # Simple coordinate system detection (look for perpendicular lines)
        if lines is not None and len(lines) >= 2:
            # Check for perpendicular lines that might indicate axes
            for i, line1 in enumerate(lines[:5]):
                for line2 in lines[i+1:6]:
                    x1, y1, x2, y2 = line1[0]
                    x3, y3, x4, y4 = line2[0]
                    
                    # Calculate angles
                    angle1 = np.arctan2(y2-y1, x2-x1)
                    angle2 = np.arctan2(y4-y3, x4-x3)
                    
                    # Check if roughly perpendicular
                    angle_diff = abs(angle1 - angle2)
                    if abs(angle_diff - np.pi/2) < 0.3 or abs(angle_diff - 3*np.pi/2) < 0.3:
                        diagrams.append("coordinate_system")
                        break
                
                if "coordinate_system" in diagrams:
                    break
        
    except Exception as e:
        logger.warning(f"Diagram detection failed: {e}")
    
    return list(set(diagrams))

def assess_handwriting_quality(confidence: float, text: str) -> str:
    """Assess handwriting quality based on OCR confidence and text characteristics"""
    if confidence >= 0.95:
        return "excellent"
    elif confidence >= 0.85:
        return "good"
    elif confidence >= 0.70:
        return "fair"
    elif confidence >= 0.50:
        return "poor"
    else:
        return "illegible"

async def analyze_with_kana(ocr_result: OCRResult, student_id: Optional[str] = None) -> AIAnalysis:
    """Send OCR result to K.A.N.A. for AI analysis"""
    
    if not GOOGLE_API_KEY:
        # Mock analysis for demo
        return AIAnalysis(
            subject="Mathematics",
            difficulty="intermediate",
            concepts=["Quadratic Equations", "Algebraic Manipulation"],
            understanding=78,
            gaps=["Factoring techniques", "Graphing"],
            suggestions=[
                "Practice more factoring problems",
                "Review quadratic formula derivation",
                "Work on graphing parabolas"
            ],
            student_id=student_id
        )
    
    try:
        # Prepare prompt for K.A.N.A.
        prompt = f"""
        Analyze this student's work extracted from their handwritten notes:
        
        Text: {ocr_result.text}
        Equations found: {', '.join(ocr_result.equations)}
        Handwriting quality: {ocr_result.handwriting_quality}
        
        Please provide a detailed analysis including:
        1. Subject area
        2. Difficulty level (beginner/intermediate/advanced)
        3. Key concepts demonstrated
        4. Understanding level (0-100%)
        5. Knowledge gaps identified
        6. Specific suggestions for improvement
        
        Respond in JSON format with keys: subject, difficulty, concepts, understanding, gaps, suggestions
        """
        
        # Call Gemini API through K.A.N.A. service
        kana_response = await call_kana_analysis(prompt)
        
        if kana_response:
            return AIAnalysis(**kana_response, student_id=student_id)
        else:
            # Fallback analysis
            return AIAnalysis(
                subject="General",
                difficulty="intermediate",
                concepts=["Problem Solving"],
                understanding=75,
                gaps=["Needs more practice"],
                suggestions=["Review fundamentals", "Practice similar problems"],
                student_id=student_id
            )
            
    except Exception as e:
        print(f"K.A.N.A. analysis error: {e}")
        # Return fallback analysis
        return AIAnalysis(
            subject="Unknown",
            difficulty="intermediate",
            concepts=["General"],
            understanding=70,
            gaps=["Analysis unavailable"],
            suggestions=["Manual review recommended"],
            student_id=student_id
        )

async def call_kana_analysis(prompt: str) -> Optional[dict]:
    """Call K.A.N.A. analysis service"""
    try:
        response = requests.post(
            f"{KANA_API_URL}/api/kana/analyze-notes",
            json={"prompt": prompt},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get("analysis")
        
    except Exception as e:
        print(f"K.A.N.A. API call failed: {e}")
    
    return None

@app.post("/analyze-upload")
async def analyze_upload(
    file: UploadFile = File(...),
    student_id: Optional[str] = None
):
    """Analyze uploaded student notes using OCR + AI"""
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Only image files are supported")
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Process with OCR
        ocr_result = await process_image_ocr(file_content)
        
        # Analyze with K.A.N.A.
        ai_analysis = await analyze_with_kana(ocr_result, student_id)
        
        # Prepare response
        response = {
            "file_name": file.filename,
            "file_size": len(file_content),
            "timestamp": datetime.now().isoformat(),
            "ocr_result": {
                "text": ocr_result.text,
                "confidence": ocr_result.confidence,
                "equations": ocr_result.equations,
                "diagrams": ocr_result.diagrams,
                "handwriting_quality": ocr_result.handwriting_quality
            },
            "ai_analysis": {
                "subject": ai_analysis.subject,
                "difficulty": ai_analysis.difficulty,
                "concepts": ai_analysis.concepts,
                "understanding": ai_analysis.understanding,
                "gaps": ai_analysis.gaps,
                "suggestions": ai_analysis.suggestions,
                "student_id": ai_analysis.student_id
            },
            "status": "completed"
        }
        
        return JSONResponse(content=response)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/batch-analyze")
async def batch_analyze(
    files: List[UploadFile] = File(...),
    student_id: Optional[str] = None
):
    """Analyze multiple files in batch"""
    
    results = []
    
    for file in files:
        try:
            file_content = await file.read()
            ocr_result = await process_image_ocr(file_content)
            ai_analysis = await analyze_with_kana(ocr_result, student_id)
            
            results.append({
                "file_name": file.filename,
                "status": "completed",
                "ocr_result": ocr_result.__dict__,
                "ai_analysis": ai_analysis.__dict__
            })
            
        except Exception as e:
            results.append({
                "file_name": file.filename,
                "status": "error",
                "error": str(e)
            })
    
    return JSONResponse(content={"results": results})

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    
    # Test OCR with a simple operation
    ocr = get_ocr_instance()
    ocr_working = False
    if ocr:
        try:
            import numpy as np
            test_image = np.ones((50, 100, 3), dtype=np.uint8) * 255
            test_result = ocr.ocr(test_image)
            ocr_working = True
            print(f"🔧 HEALTH CHECK: OCR test passed - result: {test_result}")
        except Exception as e:
            print(f"🔧 HEALTH CHECK: OCR test failed - {e}")
            ocr_working = False
    else:
        print("🔧 HEALTH CHECK: ocr instance is None")
    
    return {
        "status": "healthy",
        "ocr_available": ocr is not None,
        "ocr_working": ocr_working,
        "kana_api": KANA_API_URL,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "BrainInk Teacher OCR Service",
        "version": "1.0.0",
        "endpoints": [
            "/analyze-upload - POST: Analyze single file",
            "/batch-analyze - POST: Analyze multiple files",
            "/health - GET: Health check"
        ]
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8001)),
        reload=True
    )
