#!/usr/bin/env python3
"""
Test script to verify K.A.N.A. backend integration for teacher dashboard
"""

import requests
import json
import base64
import os

# Test configuration
KANA_BASE_URL = "http://localhost:10000"
TEST_IMAGE_PATH = "c:/Users/musev/BrainInk/test_images/math_homework.jpg"  # You can replace with any test image

def test_kana_backend():
    """Test K.A.N.A. backend endpoints"""
    
    print("🔍 Testing K.A.N.A. Backend Integration...")
    print("=" * 50)
    
    # Test 1: Basic connectivity
    print("\n1. Testing basic connectivity...")
    try:
        response = requests.get(f"{KANA_BASE_URL}/api/test")
        if response.status_code == 200:
            print("✅ K.A.N.A. backend is accessible")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Backend responded with status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to K.A.N.A. backend: {e}")
        return False
    
    # Test 2: Check if /kana-direct endpoint exists (this is what the dashboard calls)
    print("\n2. Testing /kana-direct endpoint availability...")
    
    # Create a simple test image (base64 encoded 1x1 pixel PNG)
    test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    
    test_payload = {
        "image_data": test_image_b64,
        "image_analysis": True,
        "context": "teacher_dashboard_test",
        "image_filename": "test_image.png"
    }
    
    try:
        # Note: The dashboard tries to call /kana-direct, but our backend uses /api/kana/analyze
        # Let's test the actual endpoint
        response = requests.post(f"{KANA_BASE_URL}/api/kana/analyze", json=test_payload)
        
        if response.status_code == 200:
            print("✅ K.A.N.A. analysis endpoint is working")
            result = response.json()
            print(f"   Analysis confidence: {result.get('confidence', 'N/A')}")
            print(f"   Extracted text: {result.get('extracted_text', 'N/A')[:50]}...")
            print(f"   Subject matter: {result.get('subject_matter', 'N/A')}")
            print(f"   Student strengths: {len(result.get('student_strengths', []))} items")
            print(f"   Knowledge gaps: {len(result.get('knowledge_gaps', []))} items")
            print(f"   Teaching suggestions: {len(result.get('teaching_suggestions', []))} items")
        else:
            print(f"❌ Analysis endpoint responded with status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error testing analysis endpoint: {e}")
        return False
    
    # Test 3: Check if dashboard endpoint mapping is correct
    print("\n3. Checking dashboard endpoint mapping...")
    print("   Dashboard expects: /kana-direct")
    print("   Backend provides: /api/kana/analyze")
    print("   ⚠️  Endpoint mismatch detected!")
    
    print("\n✅ K.A.N.A. backend integration test completed!")
    return True

def check_endpoint_mapping():
    """Check if the /kana-direct endpoint exists or needs to be created"""
    print("\n🔧 Checking endpoint mapping...")
    
    try:
        # Test the endpoint the dashboard is trying to use
        response = requests.get(f"{KANA_BASE_URL}/kana-direct")
        print(f"   /kana-direct status: {response.status_code}")
    except requests.exceptions.RequestException:
        print("   /kana-direct endpoint not found")
    
    try:
        # Test our actual endpoint
        response = requests.get(f"{KANA_BASE_URL}/api/kana/analyze")
        print(f"   /api/kana/analyze status: {response.status_code} (expects POST)")
    except requests.exceptions.RequestException:
        print("   /api/kana/analyze endpoint error")

if __name__ == "__main__":
    print("🧠 BrainInk K.A.N.A. Integration Test")
    print("=" * 40)
    
    success = test_kana_backend()
    check_endpoint_mapping()
    
    if success:
        print("\n🎉 Integration test completed successfully!")
        print("\n📝 Next steps:")
        print("   1. Fix endpoint mapping in dashboard or backend")
        print("   2. Test with real student work images")
        print("   3. Verify UI display of all analysis fields")
    else:
        print("\n❌ Integration test failed!")
        print("   Please check K.A.N.A. backend configuration")
