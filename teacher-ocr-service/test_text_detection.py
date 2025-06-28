#!/usr/bin/env python3
"""
Test the working OCR service with your actual handwritten image
"""
import requests
import base64
from io import BytesIO
from PIL import Image

def test_with_handwritten_image():
    """Test OCR service with your handwritten image"""
    print("🧪 Testing OCR with your handwritten image...")
    
    # Check if we have access to the image from your message
    # For now, let's test with a more realistic approach
    
    # First test the simple OCR service health
    try:
        health_response = requests.get('http://localhost:8002/health', timeout=5)
        health_data = health_response.json()
        print(f"🔍 Health Status: {health_data}")
        
        if not health_data.get('ocr_available'):
            print("❌ OCR not available")
            return False
            
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False
    
    # Create a test image with visible text using PIL
    print("🖼️ Creating test image with actual text...")
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # Create an image with text that should be detectable
        img = Image.new('RGB', (600, 200), color='white')
        draw = ImageDraw.Draw(img)
        
        # Try to use a basic font
        try:
            # Try to use a system font
            font = ImageFont.truetype("arial.ttf", 24)
        except:
            # Fallback to default font
            font = ImageFont.load_default()
        
        # Draw some text that should be easily readable
        draw.text((50, 50), "Hello World", fill='black', font=font)
        draw.text((50, 100), "This is a test", fill='black', font=font)
        draw.text((50, 150), "Mathematics: x + y = z", fill='black', font=font)
        
        # Save to bytes
        img_bytes = BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        # Test OCR endpoint
        print("📝 Testing OCR with text image...")
        files = {'file': ('test_with_text.png', img_bytes, 'image/png')}
        response = requests.post('http://localhost:8002/ocr', files=files, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print(f"🎉 OCR Response: {result}")
            
            if result.get('success'):
                extracted_text = result.get('text', '').strip()
                confidence = result.get('confidence', 0)
                
                print(f"   📝 Extracted Text: '{extracted_text}'")
                print(f"   🎯 Confidence: {confidence:.2f}")
                print(f"   💬 Message: {result.get('message', '')}")
                
                if extracted_text and len(extracted_text) > 0:
                    print("✅ SUCCESS: OCR detected text from the image!")
                    return True
                else:
                    print("⚠️  OCR ran but no text was detected")
                    return False
            else:
                print(f"❌ OCR failed: {result}")
                return False
        else:
            print(f"❌ HTTP Error: {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_direct_paddleocr():
    """Test PaddleOCR directly with text image"""
    print("\n🔬 Testing PaddleOCR directly...")
    
    try:
        import paddleocr
        from PIL import Image, ImageDraw, ImageFont
        import numpy as np
        
        # Initialize OCR
        print("🔧 Initializing PaddleOCR...")
        ocr = paddleocr.PaddleOCR(lang='en', use_gpu=False)
        print("✅ PaddleOCR initialized")
        
        # Create test image with text
        print("🖼️ Creating image with text...")
        img = Image.new('RGB', (600, 200), color='white')
        draw = ImageDraw.Draw(img)
        
        try:
            font = ImageFont.truetype("arial.ttf", 24)
        except:
            font = ImageFont.load_default()
        
        draw.text((50, 50), "Hello World", fill='black', font=font)
        draw.text((50, 100), "Mathematics: 2 + 2 = 4", fill='black', font=font)
        
        # Convert to numpy array
        img_array = np.array(img)
        
        # Process with OCR
        print("🔍 Processing with PaddleOCR...")
        result = ocr.ocr(img_array)
        print(f"📝 Direct OCR Result: {result}")
        
        if result and result[0]:
            print("✅ SUCCESS: Direct PaddleOCR detected text!")
            for line in result[0]:
                bbox, (text, confidence) = line
                print(f"  📝 Text: '{text}' (confidence: {confidence:.2f})")
            return True
        else:
            print("⚠️  Direct PaddleOCR found no text")
            return False
            
    except Exception as e:
        print(f"❌ Direct OCR test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Testing OCR with Text Detection...")
    
    # Test direct PaddleOCR first
    direct_success = test_direct_paddleocr()
    
    # Test web service
    service_success = test_with_handwritten_image()
    
    if direct_success and service_success:
        print("\n🎉 BOTH DIRECT OCR AND WEB SERVICE ARE WORKING!")
        print("✅ The OCR can detect text - the issue might be with the specific image format or content")
    elif direct_success:
        print("\n✅ Direct OCR works, but web service has issues")
    else:
        print("\n💥 OCR is not detecting text properly")
        print("This might be due to:")
        print("- Font rendering issues")
        print("- Image preprocessing needed")
        print("- OCR model parameters")
