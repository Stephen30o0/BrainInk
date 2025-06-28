#!/usr/bin/env python3
"""
Direct test of OCR functionality with real image
"""
import requests
import io
import base64
from PIL import Image
import sys
import os

def test_ocr_service():
    """Test the OCR service with a simple request"""
    
    # Test the health endpoint first
    print("🧪 Testing health endpoint...")
    try:
        health_response = requests.get("http://localhost:8001/health", timeout=10)
        print(f"Health Status: {health_response.status_code}")
        print(f"Health Response: {health_response.json()}")
    except Exception as e:
        print(f"Health check failed: {e}")
        return False
    
    # Create a simple test image with text
    print("\n🧪 Creating test image...")
    try:
        # Create a simple white image with black text
        from PIL import Image, ImageDraw, ImageFont
        
        # Create a white background
        img = Image.new('RGB', (400, 100), color='white')
        draw = ImageDraw.Draw(img)
        
        # Add some text
        try:
            # Try to use a default font
            font = ImageFont.load_default()
        except:
            font = None
            
        draw.text((10, 30), "Hello World Test 123", fill='black', font=font)
        
        # Save to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        print("✅ Test image created successfully")
        
        # Test OCR endpoint
        print("\n🧪 Testing OCR endpoint...")
        files = {'file': ('test_image.png', img_bytes.getvalue(), 'image/png')}
        
        response = requests.post("http://localhost:8001/ocr", files=files, timeout=30)
        
        print(f"OCR Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"OCR Response: {result}")
            
            # Check if it's mock data
            if "MOCK" in str(result) or "mock" in str(result):
                print("❌ STILL USING MOCK DATA!")
                return False
            else:
                print("✅ REAL OCR DATA DETECTED!")
                return True
        else:
            print(f"❌ OCR request failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting OCR Service Test...")
    success = test_ocr_service()
    
    if success:
        print("\n🎉 SUCCESS: OCR service is working with real data!")
        sys.exit(0)
    else:
        print("\n💥 FAILURE: OCR service is still using mock data")
        sys.exit(1)
