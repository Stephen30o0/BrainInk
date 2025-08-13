#!/usr/bin/env python3
"""
Simple test to check if endpoints are responding
"""

import sys
import subprocess

def test_endpoints():
    """Test if the fixed endpoints are working"""
    base_url = 'http://localhost:8000'
    
    print('🧪 Testing fixed endpoints...')
    
    # Test using curl instead of requests
    endpoints = [
        '/study-area/user/status',
        '/study-area/grades/assignments-management/my-assignments'
    ]
    
    for endpoint in endpoints:
        full_url = f'{base_url}{endpoint}'
        print(f'\n🔍 Testing: {full_url}')
        
        try:
            # Use curl to test endpoint
            result = subprocess.run([
                'curl', '-s', '-w', '%{http_code}', '-o', 'nul', full_url
            ], capture_output=True, text=True, timeout=10)
            
            status_code = result.stdout.strip()
            print(f'   Status Code: {status_code}')
            
            if status_code == '401':
                print('   ✅ Endpoint exists (401 = needs authentication)')
            elif status_code == '404':
                print('   ❌ Endpoint not found')
            elif status_code == '500':
                print('   ⚠️  Server error (but endpoint exists)')
            else:
                print(f'   📊 Response: {status_code}')
                
        except subprocess.TimeoutExpired:
            print('   ⏰ Timeout - server might not be running')
        except Exception as e:
            print(f'   ❌ Error: {e}')
    
    print('\n🔍 Test complete!')

if __name__ == "__main__":
    test_endpoints()
