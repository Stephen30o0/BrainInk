#!/usr/bin/env python3
"""
Debug script to see the complete raw response from K.A.N.A./Gemini
"""
import requests
import base64
import json
from PIL import Image, ImageDraw, ImageFont
import io

def create_test_image():
    """Create a simple test image"""
    width, height = 400, 200
    image = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(image)
    
    content = """Math Problem: Solve 2x + 5 = 15
Solution: 
2x = 15 - 5
2x = 10
x = 5

Good work! Shows understanding of basic algebra."""
    
    try:
        font = ImageFont.truetype("arial.ttf", 12)
    except:
        font = ImageFont.load_default()
    
    draw.multiline_text((20, 20), content, fill='black', font=font)
    
    # Save and return as base64
    image_path = "debug_test.png"
    image.save(image_path)
    
    with open(image_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def test_raw_response():
    """Test and show the complete raw response"""
    print("🔍 Debugging Raw K.A.N.A./Gemini Response")
    print("="*60)
    
    # Create test image
    image_base64 = create_test_image()
    print(f"✅ Test image created")
    
    # Send to K.A.N.A. backend
    try:
        response = requests.post(
            "http://localhost:10000/api/kana/analyze",
            json={
                "message": "Please analyze this student work image for educational insights.",
                "context": "debug_test",
                "image_data": image_base64,
                "image_analysis": True,
                "image_filename": "debug_test.png"
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Response received")
            print("\n" + "="*60)
            print("📄 COMPLETE RAW ANALYSIS:")
            print("="*60)
            
            # Show the complete analysis text
            full_analysis = result.get('analysis', 'No analysis field')
            print(full_analysis)
            
            print("\n" + "="*60)
            print("📊 PARSED STRUCTURED FIELDS:")
            print("="*60)
            
            # Show each parsed field
            fields = ['extracted_text', 'subject_matter', 'student_strengths', 
                     'knowledge_gaps', 'learning_level', 'teaching_suggestions', 'next_steps']
            
            for field in fields:
                value = result.get(field, 'Not found')
                print(f"\n🔸 {field.upper()}:")
                if isinstance(value, list):
                    for i, item in enumerate(value, 1):
                        print(f"  {i}. {item}")
                else:
                    print(f"  {value}")
            
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_raw_response()
