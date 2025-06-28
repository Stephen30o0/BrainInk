#!/usr/bin/env python3
"""
Test the full OCR service /kana-direct endpoint with a real image file
"""
import requests
import time
import json
from PIL import Image, ImageDraw, ImageFont
import io

def create_and_save_test_image():
    """Create and save a test image file"""
    
    # Create a white image
    width, height = 500, 300
    image = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(image)
    
    # Add some realistic student note text
    text = """Intersectionality isn't necessarily duality.
It is an understanding of multiple perspectives,
bereft of any binary characteristics.

Key concepts:
- Multiple identities
- Overlapping systems
- Non-binary thinking"""
    
    try:
        font = ImageFont.truetype("arial.ttf", 14)
    except:
        font = ImageFont.load_default()
    
    # Draw the text in blue (like handwriting)
    draw.multiline_text((20, 30), text, fill='#2E86AB', font=font, spacing=4)
    
    # Save the image
    image_path = "test_student_note.png"
    image.save(image_path)
    print(f"✅ Test image saved as {image_path}")
    
    return image_path

def test_ocr_service_endpoints():
    """Test both OCR service endpoints when available"""
    
    print("🧪 Testing OCR Service Endpoints")
    print("="*50)
    
    # Create test image
    image_path = create_and_save_test_image()
    
    # Test OCR service health
    print("\n🔍 Checking OCR service status...")
    try:
        response = requests.get("http://localhost:8003/health", timeout=5)
        if response.status_code == 200:
            health_data = response.json()
            print("✅ OCR Service is running")
            print(f"📊 OCR Available: {health_data.get('ocr_available', 'Unknown')}")
            print(f"🔧 OCR Working: {health_data.get('ocr_working', 'Unknown')}")
            print(f"🔗 K.A.N.A. API: {health_data.get('kana_api', 'Unknown')}")
        else:
            print(f"❌ OCR Service health check failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ OCR Service not reachable: {e}")
        print("💡 The OCR service might still be initializing PaddleOCR...")
        return
    
    # Test the new /kana-direct endpoint
    print("\n🚀 Testing /kana-direct endpoint...")
    
    try:
        with open(image_path, 'rb') as f:
            files = {'file': (image_path, f, 'image/png')}
            
            start_time = time.time()
            response = requests.post(
                "http://localhost:8003/kana-direct",
                files=files,
                timeout=60
            )
            processing_time = time.time() - start_time
            
        if response.status_code == 200:
            result = response.json()
            print(f"✅ K.A.N.A. Direct endpoint successful! ({processing_time:.2f}s)")
            print(f"📄 Filename: {result.get('filename', 'N/A')}")
            print(f"🔧 Method: {result.get('method', 'N/A')}")
            print(f"📊 Processing time: {result.get('processing_time', 'N/A'):.2f}s")
            
            analysis = result.get('analysis', {})
            print(f"📝 Extracted text: {analysis.get('extracted_text', 'N/A')}")
            print(f"📊 Confidence: {analysis.get('confidence', 'N/A')}")
            print(f"🎯 Analysis method: {analysis.get('method', 'N/A')}")
            
            # Show analysis snippet
            analysis_text = analysis.get('analysis', 'N/A')
            if len(analysis_text) > 300:
                print(f"\n📋 Analysis (first 300 chars):\n{analysis_text[:300]}...")
            else:
                print(f"\n📋 Full Analysis:\n{analysis_text}")
                
            print(f"\n💡 Recommendations: {analysis.get('recommendations', [])}")
            
        else:
            print(f"❌ K.A.N.A. Direct endpoint failed: {response.status_code}")
            print(f"Error response: {response.text}")
            
    except Exception as e:
        print(f"❌ K.A.N.A. Direct endpoint error: {e}")
    
    # Test traditional OCR+Analysis endpoint for comparison
    print("\n🔄 Testing traditional /ocr-analyze endpoint for comparison...")
    
    try:
        with open(image_path, 'rb') as f:
            files = {'file': (image_path, f, 'image/png')}
            
            start_time = time.time()
            response = requests.post(
                "http://localhost:8003/ocr-analyze",
                files=files,
                timeout=60
            )
            processing_time = time.time() - start_time
            
        if response.status_code == 200:
            result = response.json()
            print(f"✅ OCR+Analysis endpoint successful! ({processing_time:.2f}s)")
            
            ocr_data = result.get('ocr', {})
            print(f"📝 OCR Text: {ocr_data.get('text', 'N/A')}")
            print(f"📊 OCR Confidence: {ocr_data.get('confidence', 'N/A'):.3f}")
            
            analysis = result.get('analysis', {})
            analysis_text = analysis.get('analysis', 'N/A')
            if len(analysis_text) > 200:
                print(f"🎯 Analysis snippet: {analysis_text[:200]}...")
            else:
                print(f"🎯 Analysis: {analysis_text}")
                
        else:
            print(f"❌ OCR+Analysis endpoint failed: {response.status_code}")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"❌ OCR+Analysis endpoint error: {e}")

if __name__ == "__main__":
    test_ocr_service_endpoints()
    print("\n✅ Test completed!")
