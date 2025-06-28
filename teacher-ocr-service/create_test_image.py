#!/usr/bin/env python3
"""
Create a test image for teacher dashboard testing
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_test_student_work():
    """Create a realistic student work sample"""
    
    # Create image
    width, height = 700, 500
    image = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(image)
    
    # Student work content
    content = """Math Assignment - Quadratic Equations
Student: Sarah Johnson        Date: June 25, 2025

Problem 1: Solve x² - 5x + 6 = 0

Solution:
Using factoring method:
x² - 5x + 6 = 0
(x - 2)(x - 3) = 0
x = 2 or x = 3

Check: 2² - 5(2) + 6 = 4 - 10 + 6 = 0 ✓
       3² - 5(3) + 6 = 9 - 15 + 6 = 0 ✓

Problem 2: Solve 2x² + 7x - 4 = 0

Using quadratic formula:
x = (-b ± √(b² - 4ac)) / 2a
x = (-7 ± √(49 + 32)) / 4
x = (-7 ± √81) / 4
x = (-7 ± 9) / 4

x = 2/4 = 1/2  or  x = -16/4 = -4

Notes:
- Factoring is faster when possible
- Always check solutions
- Need to practice more with quadratic formula"""
    
    try:
        # Try to use a nice font
        font = ImageFont.truetype("arial.ttf", 11)
        title_font = ImageFont.truetype("arial.ttf", 14)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
        title_font = ImageFont.load_default()
    
    # Draw the content
    draw.multiline_text((30, 30), content, fill='#1a365d', font=font, spacing=4)
    
    # Save to downloads folder so it's easy to find
    downloads_path = os.path.join(os.path.expanduser("~"), "Downloads")
    image_path = os.path.join(downloads_path, "student_math_work.png")
    image.save(image_path)
    
    print(f"✅ Test student work image created: {image_path}")
    print("📁 This image is ready to upload to the teacher dashboard!")
    print("🎯 Go to: http://localhost:5173/teacher-dashboard")
    print("   1. Click on 'Upload & Analyze' tab")
    print("   2. Upload this image")
    print("   3. Watch the enhanced K.A.N.A. analysis!")
    
    return image_path

if __name__ == "__main__":
    create_test_student_work()
