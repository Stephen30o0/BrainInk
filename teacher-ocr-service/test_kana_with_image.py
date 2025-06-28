#!/usr/bin/env python3
"""
Test K.A.N.A. direct image analysis with a real handwritten-style image
"""
import requests
import base64
import time
import json
from PIL import Image, ImageDraw, ImageFont
import io

def create_test_handwritten_image():
    """Create a simple test image with text"""
    
    # Create a white image
    width, height = 400, 200
    image = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(image)
    
    # Add some text (simulating handwriting)
    text = "Intersectionality isn't necessarily\nduality. It is an understanding\nof multiple perspectives."
    
    try:
        # Try to use a more handwriting-like font
        font = ImageFont.truetype("arial.ttf", 16)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    # Draw the text
    draw.multiline_text((20, 30), text, fill='blue', font=font)
    
    # Convert to bytes
    img_buffer = io.BytesIO()
    image.save(img_buffer, format='PNG')
    img_bytes = img_buffer.getvalue()
    
    # Convert to base64
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')
    
    return img_base64

def test_kana_with_real_text_image():
    """Test K.A.N.A. with an actual text image"""
    
    print("🧪 Testing K.A.N.A. Direct Image Analysis with Real Text")
    print("="*70)
    
    # Create test image
    print("🎨 Creating test image with handwritten-style text...")
    test_image_base64 = create_test_handwritten_image()
    print(f"✅ Test image created (base64 length: {len(test_image_base64)})")
    
    # Test K.A.N.A. backend health first
    try:
        response = requests.get("http://localhost:10000/api/test", timeout=5)
        if response.status_code == 200:
            print("✅ K.A.N.A. Backend is running")
        else:
            print(f"❌ K.A.N.A. Backend health check failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ K.A.N.A. Backend not reachable: {e}")
        return
    
    # Test direct image analysis
    print("\n🔍 Testing direct image analysis with text image...")
    
    kana_payload = {
        "message": "Please analyze this student handwritten note. Extract the text and provide educational insights about the content.",
        "context": "teacher_dashboard_test",
        "image_filename": "test_handwritten_note.png",
        "image_data": test_image_base64,
        "image_analysis": True
    }
    
    try:
        start_time = time.time()
        response = requests.post(
            "http://localhost:10000/api/kana/analyze",
            json=kana_payload,
            timeout=45
        )
        processing_time = time.time() - start_time
        
        print(f"📊 Response status: {response.status_code}")
        print(f"⏱️ Processing time: {processing_time:.2f}s")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ K.A.N.A. direct image analysis successful!")
            print(f"📝 Extracted text: {result.get('extracted_text', 'N/A')}")
            print(f"📊 Confidence: {result.get('confidence', 'N/A')}")
            print(f"🔧 Method: {result.get('method', 'N/A')}")
            print(f"🔍 Knowledge gaps: {result.get('knowledge_gaps', [])}")
            print(f"💡 Recommendations: {result.get('recommendations', [])}")
            
            # Show analysis
            analysis = result.get('analysis', 'N/A')
            if len(analysis) > 400:
                print(f"\n📋 Analysis (first 400 chars):\n{analysis[:400]}...")
            else:
                print(f"\n📋 Full Analysis:\n{analysis}")
                
            return result
            
        else:
            print(f"❌ K.A.N.A. direct image analysis failed: {response.status_code}")
            print(f"Error response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ K.A.N.A. direct image analysis error: {e}")
        return None

if __name__ == "__main__":
    result = test_kana_with_real_text_image()
    if result:
        print("\n✅ Test completed successfully!")
        print("🎯 The K.A.N.A. direct image analysis is working!")
    else:
        print("\n❌ Test failed - need to troubleshoot")
