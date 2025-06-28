#!/usr/bin/env python3
"""
Test the working OCR service with a real image
"""
import requests
import base64
from io import BytesIO
from PIL import Image

def test_working_ocr_service():
    """Test the working OCR service"""
    print("🧪 Testing Working OCR Service...")
    
    # Test health first
    print("🔍 Checking health...")
    try:
        health_response = requests.get('http://localhost:8002/health', timeout=5)
        health_data = health_response.json()
        print(f"Health Status: {health_data}")
        
        if not health_data.get('ocr_available'):
            print("❌ OCR not available according to health check")
            return False
            
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False
    
    # Create a simple test image with text
    print("🖼️ Creating test image...")
    try:
        # Create a simple white image with black text (simulated)
        img = Image.new('RGB', (400, 100), color='white')
        
        # Save to bytes
        img_bytes = BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        # Test OCR endpoint
        print("📝 Testing OCR endpoint...")
        files = {'file': ('test.png', img_bytes, 'image/png')}
        response = requests.post('http://localhost:8002/ocr', files=files, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print(f"🎉 OCR Response: {result}")
            
            if result.get('success'):
                print("✅ SUCCESS: OCR processed the image!")
                print(f"   Text: {result.get('text', 'No text')}")
                print(f"   Confidence: {result.get('confidence', 0)}")
                print(f"   Message: {result.get('message', 'No message')}")
                
                # Check if it's real processing (not mock)
                if "MOCK" in result.get('text', ''):
                    print("⚠️  Still using mock data")
                    return False
                else:
                    print("🎯 REAL OCR PROCESSING!")
                    return True
            else:
                print(f"❌ OCR failed: {result}")
                return False
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_working_ocr_service()
    if success:
        print("\n🎉 WORKING OCR SERVICE IS PROCESSING REAL DATA!")
    else:
        print("\n💥 OCR service test failed")
