const axios = require('axios');

const BASE_URL = 'http://localhost:10000';

async function debugGradingFlow() {
    console.log('🧪 Debugging grading flow and response structure...');
    
    try {
        // Test grading mode with detailed logging
        console.log('\n📝 Test: Grading mode response structure');
        
        const gradingRequest = {
            pdf_text: `Math Assignment: Solve 2x + 5 = 15

Student Work:
2x + 5 = 15
2x = 15 - 5  
2x = 10
x = 5

Check: 2(5) + 5 = 10 + 5 = 15 ✓`,
            grading_mode: true,
            task_type: 'grade_assignment',
            assignment_title: 'Linear Equations Quiz',
            max_points: 20,
            grading_rubric: 'Correct method (10 pts), correct answer (5 pts), verification (5 pts)',
            student_context: 'Grading assignment for student: testuser123',
            analysis_type: 'pdf_assignment_grading'
        };
        
        const response = await axios.post(`${BASE_URL}/kana-direct`, gradingRequest, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            }
        });
        
        console.log(`✅ Response status: ${response.status}`);
        
        const data = response.data;
        
        console.log('\n📊 Response Structure Check:');
        console.log('🔹 Core fields:');
        console.log(`   success: ${data.success}`);
        console.log(`   grading_mode: ${data.grading_mode}`);
        console.log(`   content_type: ${data.content_type}`);
        
        console.log('\n🔹 Grading fields (needed for frontend):');
        console.log(`   grade: ${data.grade} (frontend expects this)`);
        console.log(`   score: ${data.score} (alternative field)`);
        console.log(`   max_points: ${data.max_points}`);
        console.log(`   letter_grade: ${data.letter_grade}`);
        console.log(`   percentage: ${data.percentage}`);
        
        console.log('\n🔹 Frontend compatibility:');
        console.log(`   overall_feedback: ${data.overall_feedback ? 'PRESENT' : 'MISSING'}`);
        console.log(`   improvement_areas: ${data.improvement_areas?.length || 0} items`);
        console.log(`   student_strengths: ${data.student_strengths?.length || 0} items`);
        console.log(`   knowledge_gaps: ${data.knowledge_gaps?.length || 0} items`);
        console.log(`   confidence: ${data.confidence}`);
        
        console.log('\n🎯 Frontend Mapping Check:');
        
        // Simulate frontend mapping logic
        const result = {
            extractedText: data.extracted_text || 'No text extracted',
            analysis: data.analysis || 'Analysis not available',
            knowledgeGaps: data.knowledge_gaps || [],
            recommendations: data.recommendations || [],
            confidence: data.confidence || 0,
            targetStudent: 'testuser123' // This should be set by frontend
        };
        
        // Add grading information if available
        if (data.grading_mode || data.grade !== undefined || data.score !== undefined) {
            result.grade = data.grade || data.score;
            result.maxPoints = data.max_points || 20;
            result.gradingCriteria = data.grading_criteria || data.rubric_scores;
            result.overallFeedback = data.overall_feedback || data.feedback;
            result.improvementAreas = data.improvement_areas || data.areas_for_improvement;
            result.strengths = data.strengths || data.student_strengths;
        }
        
        console.log('\n🔍 Simulated Frontend Result:');
        console.log(`   grade: ${result.grade} (should not be undefined)`);
        console.log(`   maxPoints: ${result.maxPoints}`);
        console.log(`   targetStudent: ${result.targetStudent} (should not be undefined)`);
        console.log(`   overallFeedback: ${result.overallFeedback ? 'PRESENT' : 'MISSING'}`);
        
        console.log('\n✅ Save Condition Check:');
        const canSave = result.grade !== undefined && result.targetStudent;
        console.log(`   assignmentType === 'grading': TRUE (assumed)`);
        console.log(`   result.grade !== undefined: ${result.grade !== undefined}`);
        console.log(`   result.targetStudent: ${result.targetStudent ? 'PRESENT' : 'MISSING'}`);
        console.log(`   CAN SAVE: ${canSave ? '✅ YES' : '❌ NO'}`);
        
        if (canSave) {
            console.log('\n🎉 Grading should work! The issue might be elsewhere.');
        } else {
            console.log('\n⚠️ Grading will fail because conditions are not met.');
            
            if (result.grade === undefined) {
                console.log('   🔧 FIX: Backend needs to provide grade/score field');
            }
            if (!result.targetStudent) {
                console.log('   🔧 FIX: Frontend needs to set targetStudent field');
            }
        }
        
    } catch (error) {
        console.log('\n❌ Debug test error:');
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
    }
}

debugGradingFlow();
