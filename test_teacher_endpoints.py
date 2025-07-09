#!/usr/bin/env python3
"""
Test script for new teacher endpoints
"""
import urllib.request
import urllib.error
import json

# Configuration
BACKEND_URL = "http://localhost:8000"

def test_teacher_endpoints():
    """Test the new teacher endpoints"""
    
    endpoints_to_test = [
        "/study-area/classrooms/my-assigned",
        "/study-area/teachers/my-students", 
        "/study-area/academic/teachers/my-subjects"
    ]
    
    print("🧪 Testing Teacher Endpoints...")
    print(f"Backend URL: {BACKEND_URL}")
    print("=" * 50)
    
    for endpoint in endpoints_to_test:
        print(f"\n📡 Testing: {endpoint}")
        
        try:
            # First, test if endpoint exists (without auth)
            url = f"{BACKEND_URL}{endpoint}"
            req = urllib.request.Request(url)
            
            try:
                response = urllib.request.urlopen(req)
                print(f"✅ Endpoint exists and responds (200)")
                content = response.read().decode('utf-8')
                print(f"   Response: {content[:200]}...")
            except urllib.error.HTTPError as e:
                if e.code == 401:
                    print(f"✅ Endpoint exists but requires authentication (401)")
                elif e.code == 404:
                    print(f"❌ Endpoint not found (404)")
                else:
                    print(f"🔍 Endpoint response: {e.code}")
                    try:
                        content = e.read().decode('utf-8')
                        print(f"   Error response: {content[:200]}...")
                    except:
                        print(f"   Error: {e}")
                        
        except urllib.error.URLError as e:
            print(f"❌ Cannot connect to backend at {BACKEND_URL}")
            print(f"   Error: {e}")
            print("   Make sure the backend server is running!")
            break
        except Exception as e:
            print(f"❌ Error testing endpoint: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Endpoint testing complete!")

if __name__ == "__main__":
    test_teacher_endpoints()
