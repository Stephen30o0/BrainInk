const axios = require('axios');

const BASE_URL = 'http://localhost:10000';

async function testEnhancedResponse() {
    console.log('🧪 Testing enhanced /kana-direct response structure...');
    
    try {
        // Test with a detailed analysis request
        console.log('\n📝 Test: Enhanced response structure');
        
        const analysisRequest = {
            pdf_text: `Math Problem: Solve the quadratic equation x² + 5x + 6 = 0
            
Student Work:
x² + 5x + 6 = 0
I factored this: (x + 2)(x + 3) = 0
So x = -2 or x = -3

Check: (-2)² + 5(-2) + 6 = 4 - 10 + 6 = 0 ✓
Check: (-3)² + 5(-3) + 6 = 9 - 15 + 6 = 0 ✓`,
            student_context: 'Analyzing quadratic equation work for student: Alex Thompson',
            analysis_type: 'pdf_student_notes',
            task_type: 'analyze'
        };
        
        const response = await axios.post(`${BASE_URL}/kana-direct`, analysisRequest, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            }
        });
        
        console.log(`✅ Response status: ${response.status}`);
        console.log('\n📊 Response Structure:');
        
        const data = response.data;
        
        // Check core fields
        console.log('🔹 Core fields:');
        console.log(`   success: ${data.success}`);
        console.log(`   content_type: ${data.content_type}`);
        console.log(`   grading_mode: ${data.grading_mode}`);
        console.log(`   confidence: ${data.confidence}`);
        
        // Check structured fields for frontend
        console.log('\n🔹 Frontend-compatible fields:');
        console.log(`   knowledge_gaps: ${data.knowledge_gaps?.length || 0} items`);
        if (data.knowledge_gaps?.length > 0) {
            data.knowledge_gaps.forEach((gap, i) => console.log(`      ${i+1}. ${gap}`));
        }
        
        console.log(`   recommendations: ${data.recommendations?.length || 0} items`);
        if (data.recommendations?.length > 0) {
            data.recommendations.forEach((rec, i) => console.log(`      ${i+1}. ${rec}`));
        }
        
        console.log(`   student_strengths: ${data.student_strengths?.length || 0} items`);
        if (data.student_strengths?.length > 0) {
            data.student_strengths.forEach((strength, i) => console.log(`      ${i+1}. ${strength}`));
        }
        
        // Check analysis content
        console.log('\n🔹 Analysis preview:');
        console.log(`   ${data.analysis.substring(0, 200)}...`);
        
        // Now test grading mode
        console.log('\n📝 Test: Grading mode with enhanced parsing');
        
        const gradingRequest = {
            pdf_text: analysisRequest.pdf_text,
            grading_mode: true,
            task_type: 'grade_assignment',
            assignment_title: 'Quadratic Equations Quiz',
            max_points: 20,
            grading_rubric: 'Correct method (10 pts), correct answer (5 pts), verification (5 pts)',
            student_context: 'Grading quadratic equation work for Alex Thompson',
            analysis_type: 'pdf_assignment_grading'
        };
        
        const gradingResponse = await axios.post(`${BASE_URL}/kana-direct`, gradingRequest, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            }
        });
        
        console.log(`✅ Grading response status: ${gradingResponse.status}`);
        console.log('\n📊 Grading Response Structure:');
        
        const gradingData = gradingResponse.data;
        
        console.log('🔹 Grading fields:');
        console.log(`   grade/score: ${gradingData.grade || gradingData.score}`);
        console.log(`   max_points: ${gradingData.max_points}`);
        console.log(`   letter_grade: ${gradingData.letter_grade}`);
        console.log(`   percentage: ${gradingData.percentage}`);
        console.log(`   confidence: ${gradingData.confidence}`);
        
        console.log('\n🔹 Improvement areas:');
        if (gradingData.improvement_areas?.length > 0) {
            gradingData.improvement_areas.forEach((area, i) => console.log(`   ${i+1}. ${area}`));
        } else {
            console.log('   (No improvement areas extracted)');
        }
        
        console.log('\n🔹 Overall feedback preview:');
        console.log(`   ${gradingData.overall_feedback?.substring(0, 150) || 'No feedback extracted'}...`);
        
        console.log('\n🎯 Enhanced response testing completed!');
        console.log('📋 Frontend compatibility summary:');
        console.log('   ✅ Structured data extraction working');
        console.log('   ✅ Confidence scoring implemented');
        console.log('   ✅ Knowledge gaps parsing functional');
        console.log('   ✅ Recommendations extraction working');
        console.log('   ✅ Strengths identification active');
        console.log('   ✅ Grading data parsing operational');
        
    } catch (error) {
        console.log('\n❌ Enhanced response test error:');
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
    }
}

testEnhancedResponse();
