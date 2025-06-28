#!/usr/bin/env python3
"""
Test the full OCR + K.A.N.A. pipeline by uploading an image to the OCR service
"""
import requests
import os
from PIL import Image, ImageDraw, ImageFont
import io

def create_test_handwritten_image():
    """Create a synthetic handwritten-style image for testing"""
    # Create a white background
    img = Image.new('RGB', (400, 200), color='white')
    draw = ImageDraw.Draw(img)
    
    # Simulate handwritten text
    text = "Hello World\nThis is my notes\nMath: 2 + 2 = 4"
    
    # Draw the text (simulating handwriting)
    try:
        # Try to use a default font
        font = ImageFont.load_default()
    except:
        font = None
    
    # Draw text lines
    y_pos = 30
    for line in text.split('\n'):
        draw.text((30, y_pos), line, fill='black', font=font)
        y_pos += 40
    
    # Save to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    return img_bytes.getvalue()

def test_ocr_analyze():
    """Test the OCR + AI analysis endpoint"""
    print("🧪 Testing OCR + K.A.N.A. Analysis Pipeline...")
    
    # Create test image
    image_data = create_test_handwritten_image()
    
    # Test the OCR + Analysis endpoint
    url = "http://localhost:8003/ocr-analyze"
    
    files = {'file': ('test_handwritten.png', image_data, 'image/png')}
    
    try:
        print(f"📤 Sending request to {url}...")
        response = requests.post(url, files=files, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS! Full pipeline working!")
            print(f"📄 Filename: {result.get('filename')}")
            print(f"🔍 OCR Text: {result.get('ocr', {}).get('text', 'No text')}")
            print(f"🎯 OCR Confidence: {result.get('ocr', {}).get('confidence', 0):.2f}")
            print(f"🤖 AI Analysis: {result.get('analysis', {}).get('analysis', 'No analysis')}")
            print(f"⚠️  Knowledge Gaps: {result.get('analysis', {}).get('knowledge_gaps', [])}")
            print(f"💡 Recommendations: {result.get('analysis', {}).get('recommendations', [])}")
            
            return True
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_health_check():
    """Test the health check endpoint"""
    print("🏥 Testing Health Check...")
    
    try:
        response = requests.get("http://localhost:8003/health", timeout=10)
        if response.status_code == 200:
            health = response.json()
            print("✅ Health check passed!")
            print(f"OCR Available: {health.get('ocr_available')}")
            print(f"OCR Working: {health.get('ocr_working')}")
            print(f"K.A.N.A. API: {health.get('kana_api')}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting End-to-End Pipeline Test...")
    print("=" * 50)
    
    # Test health first
    health_ok = test_health_check()
    print()
    
    if health_ok:
        # Test full pipeline
        pipeline_ok = test_ocr_analyze()
        print()
        
        if pipeline_ok:
            print("🎉 ALL TESTS PASSED! The OCR + K.A.N.A. pipeline is working!")
            print("✅ Ready for real handwritten images!")
        else:
            print("❌ Pipeline test failed")
    else:
        print("❌ Health check failed - service not ready")
    
    print("=" * 50)
