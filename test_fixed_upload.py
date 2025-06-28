#!/usr/bin/env python3
"""
Test the fixed file upload functionality
"""

import requests
import json
import base64
from PIL import Image, ImageDraw, ImageFont
import io

def create_test_image():
    """Create a simple test image with text"""
    # Create a white background image
    img = Image.new('RGB', (400, 300), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a font, fallback to default
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
    
    # Add some test content
    draw.text((20, 50), "Math Test - Algebra", fill='black', font=font)
    draw.text((20, 100), "1. Solve: 2x + 5 = 15", fill='black', font=font)
    draw.text((20, 130), "   2x = 10", fill='blue', font=font)
    draw.text((20, 160), "   x = 5", fill='green', font=font)
    draw.text((20, 210), "2. Factor: x² - 9", fill='black', font=font)
    draw.text((20, 240), "   (x + 3)(x - 3)", fill='blue', font=font)
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    return img_base64

def test_fixed_upload():
    """Test the fixed upload functionality"""
    
    print("🧪 Testing Fixed File Upload to K.A.N.A.")
    print("=" * 50)
    
    # Create test image
    print("📝 Creating test math homework image...")
    image_b64 = create_test_image()
    
    # Test payload (matching what the fixed frontend sends)
    payload = {
        "image_data": image_b64,
        "image_analysis": True,
        "context": "teacher_dashboard_test_student",
        "image_filename": "test_math_homework.png"
    }
    
    print("📤 Sending POST request to /kana-direct...")
    print(f"   Payload size: {len(json.dumps(payload))} bytes")
    print(f"   Image data length: {len(image_b64)} characters")
    
    try:
        response = requests.post(
            "http://localhost:10000/kana-direct",
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=15
        )
        
        print(f"📥 Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            print("✅ Upload and analysis successful!")
            print("\n📊 Analysis Results:")
            print("-" * 30)
            print(f"🔤 Extracted Text: {result.get('extracted_text', 'N/A')[:100]}...")
            print(f"📚 Subject: {result.get('subject_matter', 'N/A')[:60]}...")
            print(f"🎯 Learning Level: {result.get('learning_level', 'N/A')}")
            print(f"💪 Strengths: {len(result.get('student_strengths', []))} items")
            print(f"🔍 Gaps: {len(result.get('knowledge_gaps', []))} items")
            print(f"💡 Suggestions: {len(result.get('teaching_suggestions', []))} items")
            print(f"🚀 Next Steps: {len(result.get('next_steps', []))} items")
            print(f"📊 Confidence: {result.get('confidence', 'N/A')}")
            print(f"🔧 Method: {result.get('method', 'N/A')}")
            
            return True
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_fixed_upload()
    
    if success:
        print("\n🎉 File upload fix successful!")
        print("✅ The frontend should now work properly with file uploads")
        print("🌐 Try uploading an image in the dashboard at:")
        print("   http://localhost:5173/teacher-dashboard")
    else:
        print("\n❌ Upload test failed!")
        print("🔧 Check backend logs for more details")
