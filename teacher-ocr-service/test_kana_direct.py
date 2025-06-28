#!/usr/bin/env python3
"""
Test K.A.N.A. backend endpoint directly
"""
import requests
import json

def test_kana_direct():
    """Test the K.A.N.A. analyze endpoint directly"""
    print("🧪 Testing K.A.N.A. backend directly...")
    
    url = "http://localhost:10000/api/kana/analyze"
    payload = {
        "message": "Hello World This is my notes Math: 2 + 2 = 4",
        "context": "teacher_dashboard_ocr",
        "image_filename": "test.png"
    }
    
    try:
        print(f"📤 Sending POST request to {url}")
        print(f"📦 Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload, timeout=30)
        
        print(f"📥 Response status: {response.status_code}")
        print(f"📝 Response headers: {dict(response.headers)}")
        print(f"📄 Response text: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ K.A.N.A. analysis successful!")
            print(f"🤖 Analysis: {result.get('analysis', 'No analysis')}")
            return True
        else:
            print(f"❌ K.A.N.A. analysis failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ K.A.N.A. test failed: {e}")
        return False

if __name__ == "__main__":
    test_kana_direct()
