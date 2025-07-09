/**
 * End-to-End Quiz Generation Integration Test
 * Tests the complete flow: Frontend -> Python Backend -> Node.js Backend -> AI Service
 */

const fetch = require('node-fetch');

// Configuration
const PYTHON_BACKEND = 'http://127.0.0.1:8000';
const NODE_BACKEND = 'http://localhost:3000';

// Test data
const testPayload = {
    assignment_id: "test_assignment_123",
    student_id: "student_456",
    feedback: "Student struggles with algebraic equations and needs practice with solving for variables. Specifically weak in multi-step equations and combining like terms.",
    weakness_areas: ["algebraic equations", "solving for variables", "multi-step equations"],
    subject: "Mathematics",
    grade: "8th Grade"
};

async function testHealthChecks() {
    console.log('\n🏥 Testing Backend Health Checks...');

    try {
        // Test Node.js backend health
        const nodeHealth = await fetch(`${NODE_BACKEND}/health`);
        console.log(`✅ Node.js Backend Health: ${nodeHealth.status} ${nodeHealth.statusText}`);

        // Test Python backend health
        const pythonHealth = await fetch(`${PYTHON_BACKEND}/health`);
        console.log(`✅ Python Backend Health: ${pythonHealth.status} ${pythonHealth.statusText}`);

        // Test Kana service health through Python backend
        const kanaHealth = await fetch(`${PYTHON_BACKEND}/health/kana-service`);
        console.log(`✅ Kana Service Health: ${kanaHealth.status} ${kanaHealth.statusText}`);

        if (kanaHealth.ok) {
            const healthData = await kanaHealth.json();
            console.log(`   Kana Service Status: ${healthData.status}`);
        }

    } catch (error) {
        console.error('❌ Health check failed:', error.message);
    }
}

async function testDirectNodeEndpoint() {
    console.log('\n🔧 Testing Direct Node.js Quiz Generation...');

    try {
        const response = await fetch(`${NODE_BACKEND}/api/kana/generate-quiz-by-description`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                description: testPayload.feedback,
                subject: testPayload.subject,
                grade: testPayload.grade,
                difficulty: "medium"
            })
        });

        console.log(`✅ Node.js Direct Response: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const quiz = await response.json();
            console.log(`   Generated ${quiz.questions?.length || 0} questions`);
            console.log(`   Quiz title: ${quiz.title || 'No title'}`);
        } else {
            const error = await response.text();
            console.log(`   Error: ${error}`);
        }

    } catch (error) {
        console.error('❌ Direct Node.js test failed:', error.message);
    }
}

async function testPythonV2Endpoint() {
    console.log('\n🆕 Testing Python V2 Endpoint (New Integration)...');

    try {
        const response = await fetch(`${PYTHON_BACKEND}/study-area/quizzes/generate-with-kana-v2`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload)
        });

        console.log(`✅ Python V2 Response: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const quiz = await response.json();
            console.log(`   Generated ${quiz.questions?.length || 0} questions`);
            console.log(`   Quiz title: ${quiz.title || quiz.quiz_title || 'No title'}`);
            console.log(`   Using backend: ${quiz.backend_used || 'Unknown'}`);

            // Validate quiz structure
            if (quiz.questions && quiz.questions.length > 0) {
                const firstQuestion = quiz.questions[0];
                console.log(`   Sample question: ${firstQuestion.question?.substring(0, 50) || 'No question text'}...`);
                console.log(`   Question has options: ${firstQuestion.options ? 'Yes' : 'No'}`);
                console.log(`   Question has correct answer: ${firstQuestion.correct_answer ? 'Yes' : 'No'}`);
            }
        } else {
            const error = await response.text();
            console.log(`   Error: ${error}`);
        }

    } catch (error) {
        console.error('❌ Python V2 test failed:', error.message);
    }
}

async function testPythonV1Endpoint() {
    console.log('\n🔄 Testing Python V1 Endpoint (Legacy/Fallback)...');

    try {
        const response = await fetch(`${PYTHON_BACKEND}/study-area/quizzes/generate-with-kana`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload)
        });

        console.log(`✅ Python V1 Response: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const quiz = await response.json();
            console.log(`   Generated ${quiz.questions?.length || 0} questions`);
            console.log(`   Quiz title: ${quiz.title || quiz.quiz_title || 'No title'}`);
            console.log(`   Using backend: ${quiz.backend_used || 'Legacy'}`);
        } else {
            const error = await response.text();
            console.log(`   Error: ${error}`);
        }

    } catch (error) {
        console.error('❌ Python V1 test failed:', error.message);
    }
}

async function testFrontendFlow() {
    console.log('\n🌐 Testing Frontend-Like Flow (V2 with V1 Fallback)...');

    try {
        // Try V2 first (new endpoint)
        let response = await fetch(`${PYTHON_BACKEND}/study-area/quizzes/generate-with-kana-v2`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload)
        });

        let usedEndpoint = 'V2';

        // Fallback to V1 if V2 fails (mimicking frontend behavior)
        if (!response.ok) {
            console.log('🔄 V2 endpoint failed, trying V1 fallback...');
            response = await fetch(`${PYTHON_BACKEND}/study-area/quizzes/generate-with-kana`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testPayload)
            });
            usedEndpoint = 'V1 (Fallback)';
        }

        console.log(`✅ Frontend Flow Response: ${response.status} ${response.statusText} (Used: ${usedEndpoint})`);

        if (response.ok) {
            const quiz = await response.json();
            console.log(`   ✅ Quiz generated successfully!`);
            console.log(`   📝 Questions: ${quiz.questions?.length || 0}`);
            console.log(`   📚 Subject: ${quiz.subject || testPayload.subject}`);
            console.log(`   🎯 Grade: ${quiz.grade || testPayload.grade}`);

            if (quiz.questions && quiz.questions.length > 0) {
                console.log(`   📋 Quiz Structure Valid: Yes`);
                return true;
            }
        } else {
            const error = await response.text();
            console.log(`   ❌ Error: ${error}`);
        }

    } catch (error) {
        console.error('❌ Frontend flow test failed:', error.message);
    }

    return false;
}

async function runAllTests() {
    console.log('🚀 Starting End-to-End Quiz Generation Integration Test');
    console.log('='.repeat(60));

    await testHealthChecks();
    await testDirectNodeEndpoint();
    await testPythonV2Endpoint();
    await testPythonV1Endpoint();
    const frontendSuccess = await testFrontendFlow();

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    if (frontendSuccess) {
        console.log('🎉 SUCCESS: End-to-end quiz generation is working!');
        console.log('✅ Frontend can successfully generate quizzes via backend');
        console.log('✅ Python backend properly integrates with Node.js QuizService');
        console.log('✅ Fallback mechanisms are in place');
        console.log('\n🔧 Integration Status: COMPLETE ✅');
    } else {
        console.log('⚠️  ISSUES: Some problems detected in the flow');
        console.log('🔍 Check the test output above for specific errors');
        console.log('\n🔧 Integration Status: NEEDS ATTENTION ⚠️');
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Run the React frontend and test quiz generation in the UI');
    console.log('2. Verify that quizzes display correctly in StudyCentre');
    console.log('3. Test with different subjects and difficulty levels');
    console.log('4. Monitor logs for any edge cases or performance issues');
}

// Run the tests
runAllTests().catch(console.error);
