#!/usr/bin/env python3
"""
Simple working OCR web service without lazy loading
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize PaddleOCR at startup
try:
    import paddleocr
    print("🔧 Initializing PaddleOCR at startup...")
    ocr_instance = paddleocr.PaddleOCR(lang='en', use_gpu=False)
    print("✅ PaddleOCR initialized successfully!")
    OCR_AVAILABLE = True
except Exception as e:
    print(f"❌ PaddleOCR initialization failed: {e}")
    ocr_instance = None
    OCR_AVAILABLE = False

app = FastAPI(title="BrainInk OCR Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "ocr_available": OCR_AVAILABLE and ocr_instance is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/ocr")
async def process_ocr(file: UploadFile = File(...)):
    """Process OCR on uploaded image"""
    
    if not OCR_AVAILABLE or ocr_instance is None:
        return {
            "success": False,
            "text": "🚨 MOCK DATA: PaddleOCR not available",
            "confidence": 0.0,
            "message": "Using mock OCR service"
        }
    
    try:
        # Read image data
        image_data = await file.read()
        
        # Process with OCR
        import numpy as np
        from PIL import Image
        import io
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to numpy array for PaddleOCR
        img_array = np.array(image)
        
        # Run OCR
        print(f"🔍 Processing image: {file.filename}")
        result = ocr_instance.ocr(img_array)
        print(f"📝 OCR result: {result}")
        
        # Extract text
        extracted_text = ""
        total_confidence = 0
        text_count = 0
        
        if result and result[0]:
            for line in result[0]:
                bbox, (text, confidence) = line
                extracted_text += text + " "
                total_confidence += confidence
                text_count += 1
        
        avg_confidence = total_confidence / text_count if text_count > 0 else 0
        
        if extracted_text.strip():
            return {
                "success": True,
                "text": extracted_text.strip(),
                "confidence": avg_confidence,
                "message": "✅ Real OCR processing completed"
            }
        else:
            return {
                "success": True,
                "text": "No text detected in image",
                "confidence": 0.0,
                "message": "Real OCR completed but no text found"
            }
            
    except Exception as e:
        logger.error(f"OCR processing error: {e}")
        return {
            "success": False,
            "text": f"OCR processing failed: {str(e)}",
            "confidence": 0.0,
            "message": "OCR error"
        }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "BrainInk Simple OCR Service",
        "version": "1.0.0",
        "ocr_available": OCR_AVAILABLE,
        "status": "ready"
    }

if __name__ == "__main__":
    print("🚀 Starting Simple OCR Service...")
    uvicorn.run(app, host="0.0.0.0", port=8002)  # Use different port to avoid conflicts
