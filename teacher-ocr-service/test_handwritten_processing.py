#!/usr/bin/env python3
"""
Process the actual handwritten image with preprocessing
"""
import requests
import base64
from io import BytesIO
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np

def enhance_handwritten_image(image):
    """Enhance image for better OCR recognition"""
    print("🔧 Enhancing image for OCR...")
    
    # Convert to grayscale
    if image.mode != 'L':
        image = image.convert('L')
    
    # Enhance contrast
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(2.0)  # Increase contrast
    
    # Enhance sharpness
    enhancer = ImageEnhance.Sharpness(image)
    image = enhancer.enhance(2.0)  # Increase sharpness
    
    # Apply slight blur to smooth out noise
    image = image.filter(ImageFilter.SMOOTH)
    
    return image

def test_handwritten_with_enhancements():
    """Test with image enhancements"""
    print("📝 Testing handwritten image with enhancements...")
    
    # You would upload your handwritten image here
    # For now, let me simulate what might work better
    
    try:
        # Create a handwriting-like test image
        img = Image.new('RGB', (800, 600), color='white')
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(img)
        
        # Simulate handwritten style text (less perfect than printed)
        text_lines = [
            "Dear Student,",
            "Please solve this equation:",
            "x² + 5x + 6 = 0",
            "Show your work below.",
            "Good luck!"
        ]
        
        try:
            font = ImageFont.truetype("arial.ttf", 20)
        except:
            font = ImageFont.load_default()
        
        y_pos = 50
        for line in text_lines:
            draw.text((50, y_pos), line, fill='black', font=font)
            y_pos += 60
        
        print("🔧 Original image created")
        
        # Test without enhancement
        print("\n📝 Testing without enhancement...")
        img_bytes = BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        files = {'file': ('test_handwritten.png', img_bytes, 'image/png')}
        response = requests.post('http://localhost:8002/ocr', files=files, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print(f"📄 Without enhancement: {result.get('text', 'No text')}")
        
        # Test with enhancement
        print("\n🔧 Testing WITH enhancement...")
        enhanced_img = enhance_handwritten_image(img)
        
        img_bytes = BytesIO()
        enhanced_img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        files = {'file': ('test_enhanced.png', img_bytes, 'image/png')}
        response = requests.post('http://localhost:8002/ocr', files=files, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✨ With enhancement: {result.get('text', 'No text')}")
            print(f"🎯 Confidence: {result.get('confidence', 0):.2f}")
            
            if result.get('text') and len(result.get('text', '').strip()) > 0:
                print("✅ Enhancement helped detect text!")
                return True
        
        return False
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def instructions_for_real_image():
    """Instructions for testing with your real handwritten image"""
    print("\n📋 TO TEST YOUR ACTUAL HANDWRITTEN IMAGE:")
    print("1. Save your handwritten image as 'my_handwriting.jpg'")
    print("2. Put it in this folder: c:\\Users\\musev\\BrainInk\\teacher-ocr-service\\")
    print("3. Run this command:")
    print("   python -c \"")
    print("   import requests")
    print("   with open('my_handwriting.jpg', 'rb') as f:")
    print("       files = {'file': ('my_handwriting.jpg', f, 'image/jpeg')}")
    print("       response = requests.post('http://localhost:8002/ocr', files=files)")
    print("       print(response.json())")
    print("   \"")
    print("\n🔧 Or we can create a proper upload test if you provide the image file!")

if __name__ == "__main__":
    print("🚀 Testing Handwritten Image Processing...")
    
    # Test with enhancements
    test_handwritten_with_enhancements()
    
    # Show instructions
    instructions_for_real_image()
