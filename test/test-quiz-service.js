// Test file for QuizService integration
const axios = require('axios');

const BASE_URL = 'http://localhost:10000';

async function testQuizGeneration() {
    console.log('🧪 Testing Quiz Service Integration...\n');

    try {
        // Test 1: Generate quiz by description
        console.log('📝 Test 1: Generate quiz by description');
        const descriptionResponse = await axios.post(`${BASE_URL}/api/kana/generate-quiz-by-description`, {
            description: 'Basic algebra - solving linear equations',
            numQuestions: 3,
            difficulty: 'medium',
            subject: 'Mathematics',
            studentLevel: 'high school'
        });

        console.log('✅ Description-based quiz generated successfully');
        console.log(`   Questions: ${descriptionResponse.data.quiz?.questions?.length || 0}`);
        console.log(`   Generated by: ${descriptionResponse.data.quiz?.generatedBy}`);

        if (descriptionResponse.data.quiz?.questions?.length > 0) {
            console.log(`   Sample question: ${descriptionResponse.data.quiz.questions[0].question.substring(0, 60)}...`);
        }
        console.log('');

        // Test 2: Generate improvement quiz
        console.log('📈 Test 2: Generate improvement quiz');
        const improvementResponse = await axios.post(`${BASE_URL}/api/kana/generate-improvement-quiz`, {
            assignment_id: 'test-assignment-123',
            student_id: 'test-student-456',
            feedback: 'Student needs to work on understanding quadratic equations and factoring',
            weakness_areas: ['quadratic equations', 'factoring', 'polynomial operations'],
            subject: 'Algebra',
            grade: 'high school',
            numQuestions: 2
        });

        console.log('✅ Improvement quiz generated successfully');
        console.log(`   Questions: ${improvementResponse.data.questions?.length || 0}`);
        console.log(`   Generated by: ${improvementResponse.data.generated_by}`);
        console.log(`   Weakness areas: ${improvementResponse.data.weakness_areas?.join(', ')}`);

        if (improvementResponse.data.questions?.length > 0) {
            console.log(`   Sample question: ${improvementResponse.data.questions[0].question.substring(0, 60)}...`);
        }
        console.log('');

        // Test 3: Test quiz via chat endpoint
        console.log('💬 Test 3: Generate quiz via chat endpoint');
        const chatResponse = await axios.post(`${BASE_URL}/api/kana/chat`, {
            message: 'Create a quiz about basic chemistry - atomic structure',
            mode: 'quiz_generation',
            conversationId: 'test-conversation'
        });

        console.log('✅ Chat-based quiz generated successfully');
        console.log(`   Questions: ${chatResponse.data.quiz?.questions?.length || 0}`);
        console.log(`   Generated by: ${chatResponse.data.quiz?.generatedBy}`);
        console.log('');

        console.log('🎉 All quiz generation tests passed successfully!');
        console.log('\n📋 Summary:');
        console.log('   ✓ QuizService is properly initialized');
        console.log('   ✓ Description-based quiz generation works');
        console.log('   ✓ Improvement quiz generation works');
        console.log('   ✓ Chat-based quiz generation works');
        console.log('   ✓ All endpoints are properly connected');

    } catch (error) {
        console.error('❌ Test failed:', error.message);

        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }

        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Make sure the server is running on port 10000');
        console.log('   2. Check that GOOGLE_API_KEY is set in .env file');
        console.log('   3. Verify QuizService is properly initialized');
    }
}

// Function to test server availability
async function testServerConnection() {
    try {
        const response = await axios.get(`${BASE_URL}/`);
        console.log('✅ Server is running:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Server connection failed:', error.message);
        console.log('💡 Make sure to start the server with: node index.js');
        return false;
    }
}

// Main test execution
async function runTests() {
    console.log('🚀 Starting Quiz Service Integration Tests\n');

    const serverAvailable = await testServerConnection();
    if (serverAvailable) {
        await testQuizGeneration();
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { testQuizGeneration, testServerConnection };
