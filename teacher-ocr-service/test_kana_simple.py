#!/usr/bin/env python3
"""
Simple test for K.A.N.A. direct image analysis using a base64 encoded test image
"""
import requests
import base64
import time
import json

# Create a simple test image (1x1 white pixel PNG) encoded in base64
# This is just for testing the API structure
TEST_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

def test_kana_backend_direct():
    """Test the K.A.N.A. backend direct image analysis"""
    
    print("🧪 Testing K.A.N.A. Backend Direct Image Analysis")
    print("="*60)
    
    # Test K.A.N.A. backend health first
    try:
        response = requests.get("http://localhost:10000/api/test", timeout=5)
        if response.status_code == 200:
            print("✅ K.A.N.A. Backend is running")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ K.A.N.A. Backend health check failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ K.A.N.A. Backend not reachable: {e}")
        return
    
    # Test direct image analysis
    print("\n🔍 Testing direct image analysis...")
    
    kana_payload = {
        "message": "Please analyze this test image and extract any text you can see.",
        "context": "teacher_dashboard_direct_image_test",
        "image_filename": "test_image.png",
        "image_data": TEST_IMAGE_BASE64,
        "image_analysis": True
    }
    
    try:
        start_time = time.time()
        response = requests.post(
            "http://localhost:10000/api/kana/analyze",
            json=kana_payload,
            timeout=30
        )
        processing_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ K.A.N.A. direct analysis successful! ({processing_time:.2f}s)")
            print(f"📝 Extracted text: {result.get('extracted_text', 'N/A')}")
            print(f"🎯 Analysis snippet: {result.get('analysis', 'N/A')[:150]}...")
            print(f"📊 Confidence: {result.get('confidence', 'N/A')}")
            print(f"🔍 Knowledge gaps: {result.get('knowledge_gaps', [])}")
            print(f"💡 Recommendations: {result.get('recommendations', [])}")
            print(f"🔧 Method: {result.get('method', 'N/A')}")
            
            # Show full analysis if short
            if len(result.get('analysis', '')) < 300:
                print(f"\n📋 Full Analysis:\n{result.get('analysis', 'N/A')}")
            
        else:
            print(f"❌ K.A.N.A. direct analysis failed: {response.status_code}")
            print(f"Error response: {response.text}")
    except Exception as e:
        print(f"❌ K.A.N.A. direct analysis error: {e}")

def test_with_actual_text():
    """Test with text that simulates the handwritten note we know works"""
    
    print("\n" + "="*60)
    print("🧪 Testing K.A.N.A. Text Analysis (Simulating OCR Results)")
    print("="*60)
    
    # Simulate the text that was successfully extracted from the handwritten note
    test_text = "Intersectionality isn't necessarily duality. It is an understanding of multiple perspectives, bereft of any binary characteristics."
    
    kana_payload = {
        "message": f"Analyze this student content for educational insights: {test_text}",
        "context": "teacher_dashboard_ocr_simulation",
        "image_filename": "simulated_handwritten.png"
    }
    
    try:
        start_time = time.time()
        response = requests.post(
            "http://localhost:10000/api/kana/analyze",
            json=kana_payload,
            timeout=30
        )
        processing_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ K.A.N.A. text analysis successful! ({processing_time:.2f}s)")
            print(f"🎯 Analysis: {result.get('analysis', 'N/A')[:300]}...")
            print(f"📊 Confidence: {result.get('confidence', 'N/A')}")
            print(f"🔍 Knowledge gaps: {result.get('knowledge_gaps', [])}")
            print(f"💡 Recommendations: {result.get('recommendations', [])}")
            
        else:
            print(f"❌ K.A.N.A. text analysis failed: {response.status_code}")
            print(f"Error response: {response.text}")
    except Exception as e:
        print(f"❌ K.A.N.A. text analysis error: {e}")

if __name__ == "__main__":
    test_kana_backend_direct()
    test_with_actual_text()
    print("\n✅ Test completed!")
