const axios = require('axios');

const BASE_URL = 'http://localhost:10000';

async function testFrontendCompatibility() {
    console.log('🧪 Testing /kana-direct endpoint with frontend-compatible format...');
    
    try {
        // Test 1: Analysis mode (matching frontend format)
        console.log('\n📝 Test 1: PDF Analysis mode (frontend format)');
        const analysisRequest = {
            pdf_data: 'UEsDBBQABgAIAAAAIQAPa+uLegEAAGoFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAACAAAAAAAAAAAAAA==', // Sample base64 PDF data
            pdf_analysis: true,
            student_context: 'Analyzing PDF for student: Test Student',
            analysis_type: 'pdf_student_notes'
        };
        
        const analysisResponse = await axios.post(`${BASE_URL}/kana-direct`, analysisRequest, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            }
        });
        
        console.log('✅ Analysis response status:', analysisResponse.status);
        console.log('✅ Analysis response keys:', Object.keys(analysisResponse.data));
        console.log('✅ Analysis preview:', JSON.stringify(analysisResponse.data, null, 2).substring(0, 300) + '...');
        
    } catch (error) {
        if (error.response) {
            console.log('❌ Analysis error:', error.response.status, JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('❌ Analysis error:', error.message);
        }
    }
    
    try {
        // Test 2: Grading mode (matching frontend format)
        console.log('\n📝 Test 2: PDF Grading mode (frontend format)');
        const gradingRequest = {
            pdf_data: 'UEsDBBQABgAIAAAAIQAPa+uLegEAAGoFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAACAAAAAAAAAAAAAA==', // Sample base64 PDF data
            pdf_analysis: true,
            grading_mode: true,
            assignment_type: 'Math Assignment',
            max_points: 100,
            grading_rubric: 'Standard academic grading criteria',
            student_context: 'Grading PDF assignment for student: Test Student',
            analysis_type: 'pdf_assignment_grading'
        };
        
        const gradingResponse = await axios.post(`${BASE_URL}/kana-direct`, gradingRequest, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            }
        });
        
        console.log('✅ Grading response status:', gradingResponse.status);
        console.log('✅ Grading response keys:', Object.keys(gradingResponse.data));
        console.log('✅ Grading preview:', JSON.stringify(gradingResponse.data, null, 2).substring(0, 300) + '...');
        
    } catch (error) {
        if (error.response) {
            console.log('❌ Grading error:', error.response.status, JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('❌ Grading error:', error.message);
        }
    }
    
    try {
        // Test 3: Image upload format
        console.log('\n📝 Test 3: Image analysis (frontend format)');
        const imageRequest = {
            image_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            student_context: 'Analyzing image for student: Test Student',
            analysis_type: 'image_student_work'
        };
        
        const imageResponse = await axios.post(`${BASE_URL}/kana-direct`, imageRequest, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            }
        });
        
        console.log('✅ Image response status:', imageResponse.status);
        console.log('✅ Image response keys:', Object.keys(imageResponse.data));
        console.log('✅ Image preview:', JSON.stringify(imageResponse.data, null, 2).substring(0, 300) + '...');
        
    } catch (error) {
        if (error.response) {
            console.log('❌ Image error:', error.response.status, JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('❌ Image error:', error.message);
        }
    }
    
    console.log('\n🎯 Frontend compatibility test completed!');
}

testFrontendCompatibility();
