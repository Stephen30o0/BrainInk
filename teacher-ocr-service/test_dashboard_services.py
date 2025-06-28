#!/usr/bin/env python3
"""
Quick test to verify OCR service is ready for teacher dashboard
"""
import requests
import time

def test_services():
    print("🧪 Testing BrainInk Services for Teacher Dashboard")
    print("="*60)
    
    # Test OCR Service
    print("\n1. Testing OCR Service...")
    try:
        response = requests.get("http://localhost:8003/health", timeout=5)
        if response.status_code == 200:
            health = response.json()
            print(f"✅ OCR Service: {health['status']}")
            print(f"   - OCR Available: {health['ocr_available']}")
            print(f"   - OCR Working: {health['ocr_working']}")
        else:
            print(f"❌ OCR Service: {response.status_code}")
    except Exception as e:
        print(f"❌ OCR Service: {e}")
    
    # Test K.A.N.A. Backend
    print("\n2. Testing K.A.N.A. Backend...")
    try:
        response = requests.get("http://localhost:10000/health", timeout=5)
        if response.status_code == 200:
            print("✅ K.A.N.A. Backend: Running")
        else:
            print(f"❌ K.A.N.A. Backend: {response.status_code}")
    except Exception as e:
        print(f"❌ K.A.N.A. Backend: {e}")
    
    # Test Main App
    print("\n3. Testing Main BrainInk App...")
    try:
        response = requests.get("http://localhost:5173", timeout=5)
        if response.status_code == 200:
            print("✅ BrainInk App: Running")
        else:
            print(f"⚠️ BrainInk App: {response.status_code}")
    except Exception as e:
        print(f"❌ BrainInk App: {e}")
    
    print("\n" + "="*60)
    print("🎯 Ready to test teacher dashboard at:")
    print("   http://localhost:5173/teacher-dashboard")
    print("="*60)

if __name__ == "__main__":
    test_services()
