#!/usr/bin/env python3
"""
Quick script to test and verify the new teacher endpoints
"""
import urllib.request
import urllib.error
import json

# Configuration
BACKEND_URL = "http://localhost:8000"

def test_endpoints_simple():
    """Test if the endpoints exist and return data"""
    
    print("🧪 Testing Teacher Endpoints (Quick Test)...")
    print("=" * 50)
    
    # Test the specific endpoint that's failing
    endpoint = "/study-area/teachers/my-students"
    url = f"{BACKEND_URL}{endpoint}"
    
    print(f"📡 Testing: {endpoint}")
    print(f"🌐 Full URL: {url}")
    
    try:
        req = urllib.request.Request(url)
        
        try:
            response = urllib.request.urlopen(req)
            content = response.read().decode('utf-8')
            print(f"✅ Success! Response (200)")
            
            # Try to parse as JSON
            try:
                data = json.loads(content)
                if isinstance(data, list):
                    print(f"📊 Returned {len(data)} items")
                    if len(data) > 0:
                        print(f"📝 Sample item: {json.dumps(data[0], indent=2)[:200]}...")
                else:
                    print(f"📝 Response: {json.dumps(data, indent=2)[:300]}...")
            except:
                print(f"📝 Raw response: {content[:300]}...")
                
        except urllib.error.HTTPError as e:
            print(f"🔍 HTTP Error: {e.code}")
            if e.code == 401:
                print("   ➡️  Authentication required (normal for protected endpoint)")
            elif e.code == 404:
                print("   ❌ Endpoint not found - check if backend is running correct code")
            elif e.code == 500:
                print("   ⚠️  Server error - check backend logs")
            else:
                print(f"   ❓ Unexpected status: {e.code}")
                
            try:
                error_content = e.read().decode('utf-8')
                error_data = json.loads(error_content)
                print(f"   📝 Error details: {error_data}")
            except:
                pass
                
    except urllib.error.URLError as e:
        print(f"❌ Connection Error: {e}")
        print("   Make sure backend is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
    
    print("\n" + "=" * 50)
    print("✅ Test completed")

if __name__ == "__main__":
    test_endpoints_simple()
