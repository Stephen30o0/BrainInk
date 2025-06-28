#!/usr/bin/env python3
"""
Test script for K.A.N.A. direct image analysis endpoint
"""
import requests
import base64
import time
import json

def test_kana_direct_image():
    """Test the new /kana-direct endpoint"""
    
    # Use the sample handwritten image we know works
    test_image_path = "test_image_handwritten.png"  # You'll need to save your test image here
    
    # For now, let's create a simple test image or use an existing one
    # First, let's test with a direct API call to the K.A.N.A. backend
    
    # Test image (you can replace this with your actual image)
    try:
        with open(test_image_path, 'rb') as f:
            image_data = f.read()
    except FileNotFoundError:
        print("❌ Test image not found. Creating a simple test...")
        # For now, let's test the API structure
        print("🔧 Testing API structure without image...")
        
        # Test the OCR service health
        response = requests.get("http://localhost:8003/health")
        if response.status_code == 200:
            print("✅ OCR Service health check passed")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"❌ OCR Service health check failed: {response.status_code}")
        
        # Test K.A.N.A. backend health
        response = requests.get("http://localhost:10000/api/test")
        if response.status_code == 200:
            print("✅ K.A.N.A. Backend health check passed")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"❌ K.A.N.A. Backend health check failed: {response.status_code}")
        
        return
    
    # Encode image as base64
    image_base64 = base64.b64encode(image_data).decode('utf-8')
    
    print("🧪 Testing direct K.A.N.A. image analysis...")
    
    # Test 1: Direct K.A.N.A. backend API
    print("\n1️⃣ Testing K.A.N.A. backend direct image analysis...")
    kana_payload = {
        "message": "Please analyze this student work image for educational insights. Extract any text and provide teaching recommendations.",
        "context": "teacher_dashboard_direct_image_test",
        "image_filename": "test_handwritten.png",
        "image_data": image_base64,
        "image_analysis": True
    }
    
    try:
        start_time = time.time()
        response = requests.post(
            "http://localhost:10000/api/kana/analyze",
            json=kana_payload,
            timeout=60
        )
        processing_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ K.A.N.A. direct analysis successful! ({processing_time:.2f}s)")
            print(f"📝 Extracted text: {result.get('extracted_text', 'N/A')}")
            print(f"🎯 Analysis: {result.get('analysis', 'N/A')[:200]}...")
            print(f"📊 Confidence: {result.get('confidence', 'N/A')}")
            print(f"🔍 Knowledge gaps: {result.get('knowledge_gaps', [])}")
            print(f"💡 Recommendations: {result.get('recommendations', [])}")
        else:
            print(f"❌ K.A.N.A. direct analysis failed: {response.status_code}")
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"❌ K.A.N.A. direct analysis error: {e}")
    
    print("\n" + "="*60)
    
    # Test 2: OCR Service /kana-direct endpoint
    print("\n2️⃣ Testing OCR Service /kana-direct endpoint...")
    
    try:
        # Create a file-like object for testing
        files = {
            'file': ('test_handwritten.png', image_data, 'image/png')
        }
        
        start_time = time.time()
        response = requests.post(
            "http://localhost:8003/kana-direct",
            files=files,
            timeout=60
        )
        processing_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ OCR Service K.A.N.A. direct endpoint successful! ({processing_time:.2f}s)")
            print(f"📄 Filename: {result.get('filename', 'N/A')}")
            print(f"🔧 Method: {result.get('method', 'N/A')}")
            print(f"📝 Analysis: {result.get('analysis', {}).get('analysis', 'N/A')[:200]}...")
            print(f"📊 Confidence: {result.get('analysis', {}).get('confidence', 'N/A')}")
            print(f"🎯 Extracted text: {result.get('analysis', {}).get('extracted_text', 'N/A')}")
        else:
            print(f"❌ OCR Service K.A.N.A. direct endpoint failed: {response.status_code}")
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"❌ OCR Service K.A.N.A. direct endpoint error: {e}")

if __name__ == "__main__":
    print("🧪 Testing K.A.N.A. Direct Image Analysis")
    print("="*60)
    test_kana_direct_image()
    print("\n✅ Test completed!")
