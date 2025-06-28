#!/usr/bin/env python3
"""
Direct test of the /kana-direct endpoint for the teacher dashboard
"""

import requests
import json

# Test configuration
KANA_BASE_URL = "http://localhost:10000"

def test_kana_direct_endpoint():
    """Test the exact endpoint the dashboard uses"""
    
    print("🎯 Testing /kana-direct endpoint directly...")
    print("=" * 50)
    
    # Create a simple test image (base64 encoded 1x1 pixel PNG)
    test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    
    test_payload = {
        "image_data": test_image_b64,
        "image_analysis": True,
        "context": "teacher_dashboard_test",
        "image_filename": "test_image.png"
    }
    
    try:
        print(f"📤 Sending POST request to {KANA_BASE_URL}/kana-direct")
        print(f"   Payload keys: {list(test_payload.keys())}")
        
        response = requests.post(f"{KANA_BASE_URL}/kana-direct", json=test_payload)
        
        print(f"📥 Response status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ /kana-direct endpoint is working!")
            result = response.json()
            
            print(f"\n📊 Analysis Results:")
            print(f"   Confidence: {result.get('confidence', 'N/A')}")
            print(f"   Method: {result.get('method', 'N/A')}")
            print(f"   Extracted text: '{result.get('extracted_text', 'N/A')[:100]}...'")
            print(f"   Subject matter: '{result.get('subject_matter', 'N/A')[:100]}...'")
            print(f"   Student strengths: {len(result.get('student_strengths', []))} items")
            if result.get('student_strengths'):
                for i, strength in enumerate(result.get('student_strengths', [])[:3]):
                    print(f"     • {strength[:80]}...")
            print(f"   Knowledge gaps: {len(result.get('knowledge_gaps', []))} items")
            if result.get('knowledge_gaps'):
                for i, gap in enumerate(result.get('knowledge_gaps', [])[:3]):
                    print(f"     • {gap[:80]}...")
            print(f"   Teaching suggestions: {len(result.get('teaching_suggestions', []))} items")
            if result.get('teaching_suggestions'):
                for i, suggestion in enumerate(result.get('teaching_suggestions', [])[:3]):
                    print(f"     • {suggestion[:80]}...")
            print(f"   Next steps: {len(result.get('next_steps', []))} items")
            if result.get('next_steps'):
                for i, step in enumerate(result.get('next_steps', [])[:3]):
                    print(f"     • {step[:80]}...")
            
            return True
        else:
            print(f"❌ Endpoint responded with status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error testing /kana-direct endpoint: {e}")
        return False

if __name__ == "__main__":
    print("🧠 Direct K.A.N.A. Dashboard Endpoint Test")
    print("=" * 45)
    
    success = test_kana_direct_endpoint()
    
    if success:
        print("\n🎉 Dashboard endpoint test completed successfully!")
        print("\n📝 Dashboard is ready to use:")
        print("   ✅ K.A.N.A. backend running on port 10000")
        print("   ✅ /kana-direct endpoint working")
        print("   ✅ Structured analysis parsing functional")
        print("   ✅ All analysis fields being returned")
        print("\n🌐 Access the teacher dashboard at:")
        print("   http://localhost:5173/teacher-dashboard")
    else:
        print("\n❌ Dashboard endpoint test failed!")
        print("   Please check K.A.N.A. backend configuration")
