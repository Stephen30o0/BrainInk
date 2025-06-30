const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:10000';

async function testKanaDirectEndpoint() {
    console.log('🧪 Testing /kana-direct endpoint...');
    
    try {
        // Test 1: Check if endpoint exists with a simple request
        console.log('\n📝 Test 1: Basic endpoint availability');
        const response = await axios.post(`${BASE_URL}/kana-direct`, {
            mode: 'analysis',
            text: 'Test basic functionality'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Response status:', response.status);
        console.log('✅ Response data:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        if (error.response) {
            console.log('❌ Response error:', error.response.status, error.response.data);
        } else if (error.request) {
            console.log('❌ Request error:', error.message);
        } else {
            console.log('❌ Error:', error.message);
        }
    }
    
    // Test 2: Check available endpoints
    try {
        console.log('\n📝 Test 2: Check server health');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health check:', healthResponse.data);
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
    }
}

testKanaDirectEndpoint();
