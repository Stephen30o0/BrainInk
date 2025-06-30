const axios = require('axios');

const BASE_URL = 'http://localhost:10000';

async function testKanaDirectWithData() {
    console.log('🧪 Testing /kana-direct endpoint with proper data...');
    
    try {
        // Test 1: Analysis mode with text data
        console.log('\n📝 Test 1: Analysis mode with text data');
        const analysisResponse = await axios.post(`${BASE_URL}/kana-direct`, {
            mode: 'analysis',
            pdf_text: 'Solve for x: 2x + 5 = 15. Show your work step by step.'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Analysis response status:', analysisResponse.status);
        console.log('✅ Analysis response preview:', JSON.stringify(analysisResponse.data, null, 2).substring(0, 500) + '...');
        
    } catch (error) {
        if (error.response) {
            console.log('❌ Analysis error:', error.response.status, error.response.data);
        } else {
            console.log('❌ Analysis error:', error.message);
        }
    }
    
    try {
        // Test 2: Grading mode with text data
        console.log('\n📝 Test 2: Grading mode with student work');
        const gradingResponse = await axios.post(`${BASE_URL}/kana-direct`, {
            mode: 'grading',
            pdf_text: 'Problem: Solve 2x + 5 = 15\nStudent Answer: 2x = 10, x = 5\nWork shown: Subtracted 5 from both sides, then divided by 2.'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Grading response status:', gradingResponse.status);
        console.log('✅ Grading response preview:', JSON.stringify(gradingResponse.data, null, 2).substring(0, 500) + '...');
        
    } catch (error) {
        if (error.response) {
            console.log('❌ Grading error:', error.response.status, error.response.data);
        } else {
            console.log('❌ Grading error:', error.message);
        }
    }
    
    // Test 3: Check endpoint structure
    try {
        console.log('\n📝 Test 3: Testing with minimal valid data');
        const minimalResponse = await axios.post(`${BASE_URL}/kana-direct`, {
            mode: 'analysis',
            pdf_text: 'x + 1 = 2'
        });
        
        console.log('✅ Minimal test successful');
        console.log('✅ Response structure keys:', Object.keys(minimalResponse.data));
        
    } catch (error) {
        console.log('❌ Minimal test error:', error.message);
    }
}

testKanaDirectWithData();
