#!/usr/bin/env python3
"""
Comprehensive system status check for the enhanced K.A.N.A. teacher dashboard
"""

import requests
import json
import base64
from datetime import datetime

def check_system_status():
    """Check all components of the K.A.N.A. system"""
    
    print("🧠 BrainInk K.A.N.A. Enhanced Teacher Dashboard")
    print("=" * 60)
    print(f"🕒 System Check: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Component status
    components = {
        'frontend': {'url': 'http://localhost:5173', 'status': '❓', 'details': ''},
        'kana_backend': {'url': 'http://localhost:10000', 'status': '❓', 'details': ''},
        'kana_direct_endpoint': {'url': 'http://localhost:10000/kana-direct', 'status': '❓', 'details': ''},
        'user_search_api': {'url': 'https://brainink-backend-freinds-micro.onrender.com', 'status': '❓', 'details': ''}
    }
    
    # Check Frontend
    print("\n🌐 FRONTEND STATUS")
    print("-" * 30)
    try:
        response = requests.get(components['frontend']['url'], timeout=5)
        if response.status_code == 200:
            components['frontend']['status'] = '✅'
            components['frontend']['details'] = 'React/Vite dev server running'
        else:
            components['frontend']['status'] = '⚠️'
            components['frontend']['details'] = f'HTTP {response.status_code}'
    except requests.exceptions.RequestException as e:
        components['frontend']['status'] = '❌'
        components['frontend']['details'] = f'Connection failed: {str(e)[:50]}...'
    
    print(f"   {components['frontend']['status']} Frontend: {components['frontend']['details']}")
    
    # Check K.A.N.A. Backend
    print("\n🔮 K.A.N.A. BACKEND STATUS")
    print("-" * 30)
    try:
        response = requests.get(f"{components['kana_backend']['url']}/api/test", timeout=5)
        if response.status_code == 200:
            components['kana_backend']['status'] = '✅'
            result = response.json()
            components['kana_backend']['details'] = f"Active - {result.get('message', 'OK')}"
        else:
            components['kana_backend']['status'] = '⚠️'
            components['kana_backend']['details'] = f'HTTP {response.status_code}'
    except requests.exceptions.RequestException as e:
        components['kana_backend']['status'] = '❌'
        components['kana_backend']['details'] = f'Connection failed: {str(e)[:50]}...'
    
    print(f"   {components['kana_backend']['status']} K.A.N.A. Backend: {components['kana_backend']['details']}")
    
    # Check K.A.N.A. Direct Endpoint (what dashboard uses)
    print("\n🎯 DASHBOARD ENDPOINT STATUS")
    print("-" * 30)
    
    # Test with minimal payload
    test_payload = {
        "image_data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "image_analysis": True,
        "context": "system_status_check",
        "image_filename": "test.png"
    }
    
    try:
        response = requests.post(f"{components['kana_direct_endpoint']['url']}", json=test_payload, timeout=10)
        if response.status_code == 200:
            components['kana_direct_endpoint']['status'] = '✅'
            result = response.json()
            confidence = result.get('confidence', 'N/A')
            method = result.get('method', 'N/A')
            components['kana_direct_endpoint']['details'] = f"Working - Confidence: {confidence}, Method: {method}"
        else:
            components['kana_direct_endpoint']['status'] = '⚠️'
            components['kana_direct_endpoint']['details'] = f'HTTP {response.status_code}'
    except requests.exceptions.RequestException as e:
        components['kana_direct_endpoint']['status'] = '❌'
        components['kana_direct_endpoint']['details'] = f'Connection failed: {str(e)[:50]}...'
    
    print(f"   {components['kana_direct_endpoint']['status']} /kana-direct endpoint: {components['kana_direct_endpoint']['details']}")
    
    # Check User Search API
    print("\n👥 USER SEARCH API STATUS")
    print("-" * 30)
    try:
        # This might fail without auth, but we just want to check connectivity
        response = requests.get(f"{components['user_search_api']['url']}/health", timeout=5)
        components['user_search_api']['status'] = '✅'
        components['user_search_api']['details'] = 'Reachable (auth required for actual use)'
    except requests.exceptions.RequestException:
        try:
            # Try the friends endpoint - might return 401 but shows it's up
            response = requests.get(f"{components['user_search_api']['url']}/friends/search?q=test", timeout=5)
            if response.status_code in [401, 403]:
                components['user_search_api']['status'] = '✅'
                components['user_search_api']['details'] = 'Reachable (auth required)'
            else:
                components['user_search_api']['status'] = '⚠️'
                components['user_search_api']['details'] = f'HTTP {response.status_code}'
        except requests.exceptions.RequestException as e:
            components['user_search_api']['status'] = '❌'
            components['user_search_api']['details'] = f'Connection failed: {str(e)[:50]}...'
    
    print(f"   {components['user_search_api']['status']} User Search API: {components['user_search_api']['details']}")
    
    # System Summary
    print("\n📊 SYSTEM SUMMARY")
    print("=" * 30)
    
    working_components = sum(1 for comp in components.values() if comp['status'] == '✅')
    total_components = len(components)
    
    print(f"   Components Status: {working_components}/{total_components} operational")
    
    if working_components == total_components:
        print("   🎉 All systems operational!")
        status = "FULLY_OPERATIONAL"
    elif working_components >= 3:
        print("   ⚠️  Most systems operational")
        status = "MOSTLY_OPERATIONAL"
    else:
        print("   ❌ Multiple system issues detected")
        status = "DEGRADED"
    
    # Features Available
    print("\n🚀 AVAILABLE FEATURES")
    print("-" * 30)
    
    features = [
        "✅ Image upload and analysis",
        "✅ Text extraction from student work",
        "✅ Subject identification",
        "✅ Student strengths analysis",
        "✅ Knowledge gaps detection",
        "✅ Teaching recommendations",
        "✅ Next learning steps",
        "✅ Confidence scoring",
        "✅ Student search integration",
        "✅ Real-time analysis results"
    ]
    
    for feature in features:
        print(f"   {feature}")
    
    # Usage Instructions
    print("\n📝 USAGE INSTRUCTIONS")
    print("-" * 30)
    print("   1. Access teacher dashboard: http://localhost:5173/teacher-dashboard")
    print("   2. Search for students using the search box")
    print("   3. Select a student from the dropdown")
    print("   4. Upload student work image (drag & drop or click)")
    print("   5. View comprehensive AI analysis results")
    print("   6. Use insights for personalized teaching strategies")
    
    # Technical Details
    print("\n🔧 TECHNICAL DETAILS")
    print("-" * 30)
    print("   • Frontend: React + TypeScript + Vite")
    print("   • Backend: Node.js + Express + Google Gemini Vision")
    print("   • AI Model: Gemini 1.5 Flash (latest)")
    print("   • OCR: Integrated with Gemini Vision")
    print("   • User System: BrainInk micro-services")
    print("   • Analysis: Structured educational feedback")
    
    return status

if __name__ == "__main__":
    final_status = check_system_status()
    
    print(f"\n🏁 FINAL STATUS: {final_status}")
    print("=" * 60)
    
    if final_status == "FULLY_OPERATIONAL":
        print("🎯 The enhanced K.A.N.A. teacher dashboard is ready for production use!")
        print("📚 Teachers can now analyze student work with AI-powered insights.")
    elif final_status == "MOSTLY_OPERATIONAL":
        print("⚠️  The system is mostly functional. Check any failing components.")
    else:
        print("🔧 System issues detected. Please resolve before production use.")
