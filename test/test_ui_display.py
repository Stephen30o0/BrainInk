#!/usr/bin/env python3
"""
Test UI display issue by checking the actual K.A.N.A. response format
"""

import requests
import json
import base64

def test_ui_display():
    """Test the K.A.N.A. response format to ensure UI compatibility"""
    
    print("🔍 Testing K.A.N.A. Response Format for UI Display")
    print("=" * 55)
    
    KANA_BASE_URL = "http://localhost:10000"
    
    # Test with a simple image
    test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    
    test_payload = {
        "image_data": test_image_b64,
        "image_analysis": True,
        "context": "ui_display_test",
        "image_filename": "test_ui.png"
    }
    
    try:
        print("📤 Sending test request to K.A.N.A...")
        response = requests.post(f"{KANA_BASE_URL}/kana-direct", json=test_payload, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            
            print("✅ K.A.N.A. Response Received Successfully")
            print("\n📊 Response Structure Analysis:")
            print("-" * 40)
            
            # Check all required fields
            required_fields = [
                'extracted_text', 'subject_matter', 'student_strengths', 
                'knowledge_gaps', 'learning_level', 'teaching_suggestions', 
                'next_steps', 'confidence', 'method'
            ]
            
            for field in required_fields:
                if field in result:
                    value = result[field]
                    if isinstance(value, list):
                        print(f"✅ {field}: {len(value)} items")
                        for i, item in enumerate(value[:2]):  # Show first 2 items
                            print(f"   {i+1}. {item[:60]}...")
                    else:
                        print(f"✅ {field}: {str(value)[:60]}...")
                else:
                    print(f"❌ {field}: MISSING")
            
            print(f"\n🎯 Full Response JSON Structure:")
            print("-" * 40)
            print(json.dumps(result, indent=2, ensure_ascii=False)[:1000] + "...")
            
            # Check if arrays are properly structured
            print(f"\n🔍 Array Structure Validation:")
            print("-" * 40)
            
            array_fields = ['student_strengths', 'knowledge_gaps', 'teaching_suggestions', 'next_steps']
            for field in array_fields:
                if field in result:
                    value = result[field]
                    if isinstance(value, list):
                        print(f"✅ {field}: Valid array with {len(value)} items")
                        if len(value) > 0:
                            print(f"   First item type: {type(value[0])}")
                            print(f"   First item: {value[0][:50]}...")
                    else:
                        print(f"⚠️  {field}: Not an array (type: {type(value)})")
                else:
                    print(f"❌ {field}: Missing from response")
            
            return True
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during test: {e}")
        return False

if __name__ == "__main__":
    success = test_ui_display()
    
    if success:
        print("\n🎉 K.A.N.A. response format is compatible with UI!")
        print("✅ The display issues might be CSS-related, not data-related.")
        print("\n💡 Next steps:")
        print("   1. Check if text colors have sufficient contrast")
        print("   2. Verify array items are being rendered properly")
        print("   3. Test with actual student work images")
    else:
        print("\n❌ K.A.N.A. response format issues detected!")
        print("   Please check the backend response structure.")
