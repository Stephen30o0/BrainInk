#!/usr/bin/env python3
"""
Test the enhanced K.A.N.A. structured educational analysis
"""
import requests
import base64
import time
import json
from PIL import Image, ImageDraw, ImageFont
import io

def create_comprehensive_test_image():
    """Create a more comprehensive student work image"""
    
    # Create a larger image with more educational content
    width, height = 600, 400
    image = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(image)
    
    # Add realistic student work content
    content = """Math Problem Set - Algebra
Student: Alex Chen

1. Solve for x: 2x + 5 = 15
   2x = 15 - 5
   2x = 10
   x = 5

2. Simplify: (x + 3)(x - 2)
   = x² - 2x + 3x - 6
   = x² + x - 6

Notes:
- Remember to distribute carefully
- Check answers by substitution
- Need to practice factoring more"""
    
    try:
        font = ImageFont.truetype("arial.ttf", 12)
        title_font = ImageFont.truetype("arial.ttf", 14)
    except:
        font = ImageFont.load_default()
        title_font = ImageFont.load_default()
    
    # Draw the content
    draw.multiline_text((20, 20), content, fill='#1a365d', font=font, spacing=3)
    
    # Save the image
    image_path = "comprehensive_student_work.png"
    image.save(image_path)
    print(f"✅ Comprehensive test image saved as {image_path}")
    
    # Convert to base64
    img_buffer = io.BytesIO()
    image.save(img_buffer, format='PNG')
    img_bytes = img_buffer.getvalue()
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')
    
    return img_base64, image_path

def test_enhanced_kana_analysis():
    """Test the enhanced structured K.A.N.A. analysis"""
    
    print("🧪 Testing Enhanced K.A.N.A. Structured Educational Analysis")
    print("="*70)
    
    # Create comprehensive test image
    print("🎨 Creating comprehensive student work image...")
    test_image_base64, image_path = create_comprehensive_test_image()
    print(f"✅ Test image created (base64 length: {len(test_image_base64)})")
    
    # Test K.A.N.A. backend health
    try:
        response = requests.get("http://localhost:10000/api/test", timeout=5)
        if response.status_code == 200:
            print("✅ K.A.N.A. Backend is running")
        else:
            print(f"❌ K.A.N.A. Backend health check failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ K.A.N.A. Backend not reachable: {e}")
        return
    
    # Test enhanced structured analysis
    print("\n🔍 Testing enhanced structured educational analysis...")
    
    kana_payload = {
        "message": "Please provide a comprehensive educational analysis of this student's math work. Include detailed insights about their understanding, strengths, and areas for improvement.",
        "context": "teacher_dashboard_comprehensive_analysis",
        "image_filename": "alex_chen_algebra_homework.png",
        "image_data": test_image_base64,
        "image_analysis": True
    }
    
    try:
        start_time = time.time()
        response = requests.post(
            "http://localhost:10000/api/kana/analyze",
            json=kana_payload,
            timeout=60
        )
        processing_time = time.time() - start_time
        
        print(f"📊 Response status: {response.status_code}")
        print(f"⏱️ Processing time: {processing_time:.2f}s")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Enhanced K.A.N.A. analysis successful!")
            
            # Display structured results
            print("\n" + "="*50)
            print("📋 STRUCTURED EDUCATIONAL ANALYSIS")
            print("="*50)
            
            print(f"\n📝 EXTRACTED TEXT:")
            print(f"{result.get('extracted_text', 'N/A')}")
            
            print(f"\n📚 SUBJECT MATTER:")
            print(f"{result.get('subject_matter', 'N/A')}")
            
            print(f"\n💪 STUDENT STRENGTHS:")
            strengths = result.get('student_strengths', [])
            if isinstance(strengths, list):
                for i, strength in enumerate(strengths, 1):
                    # Clean up the strength text and ensure it's complete
                    clean_strength = strength.replace('*', '').strip()
                    if len(clean_strength) > 10:  # Only show meaningful strengths
                        print(f"  {i}. {clean_strength}")
            else:
                print(f"  {strengths}")
            
            print(f"\n🔍 KNOWLEDGE GAPS:")
            gaps = result.get('knowledge_gaps', [])
            if isinstance(gaps, list):
                for i, gap in enumerate(gaps, 1):
                    clean_gap = gap.replace('*', '').strip()
                    if len(clean_gap) > 10:  # Only show meaningful gaps
                        print(f"  {i}. {clean_gap}")
            else:
                print(f"  {gaps}")
            
            print(f"\n🎓 LEARNING LEVEL:")
            print(f"{result.get('learning_level', 'N/A')}")
            
            print(f"\n💡 TEACHING SUGGESTIONS:")
            suggestions = result.get('teaching_suggestions', [])
            if isinstance(suggestions, list):
                for i, suggestion in enumerate(suggestions, 1):
                    clean_suggestion = suggestion.replace('*', '').strip()
                    if len(clean_suggestion) > 10:  # Only show meaningful suggestions
                        print(f"  {i}. {clean_suggestion}")
            else:
                print(f"  {suggestions}")
            
            print(f"\n🚀 NEXT STEPS:")
            next_steps = result.get('next_steps', [])
            if isinstance(next_steps, list):
                for i, step in enumerate(next_steps, 1):
                    clean_step = step.replace('*', '').strip()
                    if len(clean_step) > 10:  # Only show meaningful steps
                        print(f"  {i}. {clean_step}")
            else:
                print(f"  {next_steps}")
            
            print(f"\n📊 CONFIDENCE SCORE: {result.get('confidence', 'N/A')}")
            print(f"🔧 ANALYSIS METHOD: {result.get('method', 'N/A')}")
            
            # Show a snippet of the full analysis
            full_analysis = result.get('analysis', 'N/A')
            if len(full_analysis) > 500:
                print(f"\n📄 FULL ANALYSIS (first 500 chars):")
                print(f"{full_analysis[:500]}...")
            else:
                print(f"\n📄 FULL ANALYSIS:")
                print(f"{full_analysis}")
                
            return result
            
        else:
            print(f"❌ Enhanced K.A.N.A. analysis failed: {response.status_code}")
            print(f"Error response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Enhanced K.A.N.A. analysis error: {e}")
        return None

def test_ocr_service_enhanced_endpoint():
    """Test the OCR service /kana-direct endpoint with enhanced analysis"""
    
    print("\n" + "="*70)
    print("🚀 Testing OCR Service Enhanced /kana-direct Endpoint")
    print("="*70)
    
    try:
        # Test if OCR service is running
        response = requests.get("http://localhost:8003/health", timeout=5)
        if response.status_code != 200:
            print("❌ OCR Service not running or not ready")
            return
        print("✅ OCR Service is running")
    except:
        print("❌ OCR Service not accessible")
        return
    
    # Use our comprehensive test image
    image_path = "comprehensive_student_work.png"
    
    try:
        with open(image_path, 'rb') as f:
            files = {'file': (image_path, f, 'image/png')}
            
            start_time = time.time()
            response = requests.post(
                "http://localhost:8003/kana-direct",
                files=files,
                timeout=60
            )
            processing_time = time.time() - start_time
            
        if response.status_code == 200:
            result = response.json()
            print(f"✅ OCR Service enhanced analysis successful! ({processing_time:.2f}s)")
            
            analysis = result.get('analysis', {})
            print(f"\n📝 Extracted text: {analysis.get('extracted_text', 'N/A')[:100]}...")
            print(f"📚 Subject matter: {analysis.get('subject_matter', 'N/A')}")
            print(f"🎓 Learning level: {analysis.get('learning_level', 'N/A')}")
            print(f"📊 Confidence: {analysis.get('confidence', 'N/A')}")
            
            # Show structured data counts
            strengths = analysis.get('student_strengths', [])
            gaps = analysis.get('knowledge_gaps', [])
            suggestions = analysis.get('teaching_suggestions', [])
            
            print(f"\n📈 Analysis Summary:")
            print(f"  💪 Student strengths identified: {len(strengths) if isinstance(strengths, list) else 'N/A'}")
            print(f"  🔍 Knowledge gaps found: {len(gaps) if isinstance(gaps, list) else 'N/A'}")
            print(f"  💡 Teaching suggestions: {len(suggestions) if isinstance(suggestions, list) else 'N/A'}")
            
        else:
            print(f"❌ OCR Service enhanced analysis failed: {response.status_code}")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"❌ OCR Service enhanced analysis error: {e}")

if __name__ == "__main__":
    result = test_enhanced_kana_analysis()
    if result:
        test_ocr_service_enhanced_endpoint()
        print("\n✅ Enhanced analysis testing completed!")
        print("🎯 K.A.N.A. now provides comprehensive structured educational analysis!")
    else:
        print("\n❌ Enhanced analysis test failed - need to troubleshoot")
