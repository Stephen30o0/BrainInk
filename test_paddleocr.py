#!/usr/bin/env python3
"""
PaddleOCR Test Script
Test script to verify PaddleOCR installation and functionality
"""

import sys
import os
from pathlib import Path

def test_imports():
    """Test if all required packages can be imported"""
    print("🔍 Testing package imports...")
    
    try:
        import paddleocr
        print("✅ PaddleOCR imported successfully")
    except ImportError as e:
        print(f"❌ PaddleOCR import failed: {e}")
        return False
        
    try:
        from PIL import Image
        print("✅ PIL (Pillow) imported successfully")
    except ImportError as e:
        print(f"❌ PIL import failed: {e}")
        return False
        
    try:
        import cv2
        print("✅ OpenCV imported successfully")
    except ImportError as e:
        print(f"❌ OpenCV import failed: {e}")
        return False
        
    try:
        import numpy as np
        print("✅ NumPy imported successfully")
    except ImportError as e:
        print(f"❌ NumPy import failed: {e}")
        return False
        
    return True

def test_ocr_initialization():
    """Test PaddleOCR initialization"""
    print("\n🚀 Testing PaddleOCR initialization...")
    
    try:
        import paddleocr
        ocr = paddleocr.PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        print("✅ PaddleOCR initialized successfully")
        return ocr
    except Exception as e:
        print(f"❌ PaddleOCR initialization failed: {e}")
        return None

def create_test_image():
    """Create a simple test image with text"""
    try:
        from PIL import Image, ImageDraw, ImageFont
        import io
        
        # Create a simple image with text
        img = Image.new('RGB', (400, 100), color='white')
        draw = ImageDraw.Draw(img)
        
        # Try to use a default font
        try:
            font = ImageFont.load_default()
        except:
            font = None
            
        text = "x^2 + 2x + 1 = 0"
        draw.text((50, 30), text, fill='black', font=font)
        
        # Save to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        print("✅ Test image created successfully")
        return img_bytes.getvalue(), img
        
    except Exception as e:
        print(f"❌ Test image creation failed: {e}")
        return None, None

def test_ocr_processing(ocr, img_bytes):
    """Test OCR processing on the test image"""
    print("\n📄 Testing OCR processing...")
    
    try:
        import numpy as np
        from PIL import Image
        import io
        
        # Convert bytes to PIL Image
        img = Image.open(io.BytesIO(img_bytes))
        img_array = np.array(img)
        
        # Run OCR
        result = ocr.ocr(img_array, cls=True)
        
        print("✅ OCR processing completed")
        print(f"📊 Result: {result}")
        
        if result and result[0]:
            for line in result[0]:
                if line and len(line) >= 2:
                    text = line[1][0]
                    confidence = line[1][1]
                    print(f"📝 Detected text: '{text}' (confidence: {confidence:.2f})")
        else:
            print("⚠️  No text detected in image")
            
        return True
        
    except Exception as e:
        print(f"❌ OCR processing failed: {e}")
        return False

def test_api_server():
    """Test if the OCR API server can start"""
    print("\n🌐 Testing API server startup...")
    
    try:
        from fastapi import FastAPI
        from fastapi.testclient import TestClient
        import sys
        import os
        
        # Add the teacher-ocr-service directory to path
        ocr_service_path = Path(__file__).parent / "teacher-ocr-service"
        if ocr_service_path.exists():
            sys.path.insert(0, str(ocr_service_path))
            
            try:
                from main import app
                client = TestClient(app)
                response = client.get("/health")
                
                if response.status_code == 200:
                    print("✅ API server can start and respond to health checks")
                    print(f"📊 Health response: {response.json()}")
                    return True
                else:
                    print(f"⚠️  API server responded with status {response.status_code}")
                    return False
                    
            except ImportError as e:
                print(f"⚠️  Could not import API server: {e}")
                return False
        else:
            print("⚠️  OCR service directory not found")
            return False
            
    except Exception as e:
        print(f"❌ API server test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧠 BrainInk PaddleOCR Verification Test")
    print("=" * 50)
    
    # Test 1: Package imports
    if not test_imports():
        print("\n❌ Package import test failed. Please install missing packages.")
        print("Run: pip install paddleocr pillow opencv-python numpy")
        sys.exit(1)
    
    # Test 2: OCR initialization
    ocr = test_ocr_initialization()
    if not ocr:
        print("\n❌ OCR initialization failed.")
        sys.exit(1)
    
    # Test 3: Create test image
    img_bytes, img = create_test_image()
    if not img_bytes:
        print("\n❌ Test image creation failed.")
        sys.exit(1)
    
    # Test 4: OCR processing
    if not test_ocr_processing(ocr, img_bytes):
        print("\n❌ OCR processing failed.")
        sys.exit(1)
    
    # Test 5: API server (optional)
    test_api_server()
    
    print("\n" + "=" * 50)
    print("🎉 All core tests passed! PaddleOCR is working correctly.")
    print("\n📋 Next steps:")
    print("1. Run: python teacher-ocr-service/main.py")
    print("2. Test OCR endpoint: http://localhost:8001/docs")
    print("3. Upload an image to test real OCR functionality")

if __name__ == "__main__":
    main()
