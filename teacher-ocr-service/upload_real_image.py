#!/usr/bin/env python3
"""
Upload and analyze a real handwritten image
Usage: python upload_real_image.py <image_path>
"""
import sys
import requests
import os
from pathlib import Path

def upload_and_analyze_image(image_path):
    """Upload a real image to the OCR + K.A.N.A. service"""
    
    if not os.path.exists(image_path):
        print(f"❌ Error: Image file '{image_path}' not found!")
        return False
    
    print(f"📤 Uploading and analyzing: {image_path}")
    print("=" * 60)
    
    # Prepare the file
    with open(image_path, 'rb') as f:
        files = {'file': (os.path.basename(image_path), f, 'image/*')}
        
        try:
            # Send to OCR + Analysis service
            response = requests.post(
                "http://localhost:8003/ocr-analyze", 
                files=files,
                timeout=120  # Give more time for complex images
            )
            
            if response.status_code == 200:
                result = response.json()
                
                print("✅ SUCCESS! Image processed successfully!")
                print(f"📄 Filename: {result.get('filename')}")
                print()
                
                # OCR Results
                ocr_data = result.get('ocr', {})
                print("🔍 OCR RESULTS:")
                print("-" * 40)
                print(f"📝 Extracted Text: {ocr_data.get('text', 'No text detected')}")
                print(f"🎯 Confidence: {ocr_data.get('confidence', 0):.2f}")
                print(f"⏱️  Processing Time: {ocr_data.get('processing_time', 0):.2f}s")
                print()
                
                # AI Analysis Results
                analysis_data = result.get('analysis', {})
                print("🤖 K.A.N.A. AI ANALYSIS:")
                print("-" * 40)
                print(f"📊 Analysis:\n{analysis_data.get('analysis', 'No analysis available')}")
                print()
                print(f"⚠️  Knowledge Gaps: {analysis_data.get('knowledge_gaps', [])}")
                print()
                print(f"💡 Recommendations: {analysis_data.get('recommendations', [])}")
                print()
                print(f"🎯 AI Confidence: {analysis_data.get('confidence', 0):.2f}")
                
                return True
                
            else:
                print(f"❌ Upload failed with status {response.status_code}")
                print(f"Error: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Upload error: {e}")
            return False

def main():
    print("📚 BrainInk OCR + K.A.N.A. Analysis Tool")
    print("=" * 60)
    
    if len(sys.argv) != 2:
        print("Usage: python upload_real_image.py <image_path>")
        print("\nExample:")
        print("  python upload_real_image.py my_handwritten_notes.jpg")
        print("\nSupported formats: .jpg, .jpeg, .png, .bmp, .tiff, .webp")
        return
    
    image_path = sys.argv[1]
    
    # Check if services are running
    try:
        health_response = requests.get("http://localhost:8003/health", timeout=5)
        if health_response.status_code != 200:
            print("❌ OCR service not available at http://localhost:8003")
            print("Please start the OCR service first:")
            print("  cd teacher-ocr-service && python main.py")
            return
    except:
        print("❌ Cannot connect to OCR service at http://localhost:8003")
        print("Please start the OCR service first.")
        return
    
    success = upload_and_analyze_image(image_path)
    
    if success:
        print("\n🎉 Analysis complete! The OCR + K.A.N.A. pipeline is working perfectly!")
        print("✅ Ready for integration with the BrainInk dashboard!")
    else:
        print("\n❌ Analysis failed. Please check the image and try again.")

if __name__ == "__main__":
    main()
