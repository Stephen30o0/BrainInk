/**
 * Test script to verify the correct endpoints are being called
 * This script tests that all student API calls use the /study-area/academic/students/ prefix
 */

// Mock fetch to capture the URLs being called
const capturedUrls = [];

global.fetch = async (url, options) => {
    console.log('📡 API Call:', url);
    capturedUrls.push(url);

    // Simulate 200 OK responses with minimal data
    return {
        ok: true,
        status: 200,
        json: async () => ({
            message: 'success',
            student_id: 1,
            // Add minimal response structure for each endpoint
            ...(url.includes('dashboard') && {
                student_info: { id: 1, name: 'Test Student' },
                academic_summary: { total_subjects: 0 },
                recent_grades: [],
                upcoming_assignments: [],
                subjects: []
            }),
            ...(url.includes('assignments') && {
                assignments: []
            }),
            ...(url.includes('grades') && {
                subjects: []
            }),
            ...(url.includes('learning-path') && {
                learning_path: []
            }),
            ...(url.includes('analytics') && {
                performance_metrics: {},
                study_time: {},
                weekly_goals: {}
            }),
            ...(url.includes('subjects') && []),
            ...(url.includes('classes') && []),
            ...(url.includes('progress') && {
                progress_percentage: 0
            })
        })
    };
};

// Mock localStorage for auth token
global.localStorage = {
    getItem: (key) => {
        if (key === 'auth_token' || key === 'authToken') {
            return 'test-token-123';
        }
        return null;
    },
    setItem: () => { },
    removeItem: () => { }
};

async function testCorrectEndpoints() {
    try {
        console.log('🧪 Testing that correct endpoints are being called...\n');

        // Clear captured URLs
        capturedUrls.length = 0;

        // Import the services
        const { studentService } = await import('./src/services/studentService.ts');
        const { academicBackendService } = await import('./src/services/academicBackendService.ts');

        console.log('1️⃣ Testing Student Service endpoints...');

        // Test studentService methods
        await studentService.getDashboard();
        await studentService.getMyAssignments();

        console.log('\n2️⃣ Testing Academic Backend Service endpoints...');

        // Test academicBackendService methods directly
        await academicBackendService.getMyGrades();
        await academicBackendService.getMyLearningPath();
        await academicBackendService.getMyStudyAnalytics();
        await academicBackendService.getMySubjects();
        await academicBackendService.getMyClasses();
        await academicBackendService.getSubjectProgress(1);

        console.log('\n📋 Summary of API calls made:');
        capturedUrls.forEach((url, index) => {
            const isCorrect = url.includes('/study-area/academic/students/');
            const status = isCorrect ? '✅' : '❌';
            console.log(`${status} ${index + 1}. ${url}`);
        });

        const correctEndpoints = capturedUrls.filter(url => url.includes('/study-area/academic/students/'));
        const incorrectEndpoints = capturedUrls.filter(url => !url.includes('/study-area/academic/students/'));

        console.log(`\n📊 Results:`);
        console.log(`✅ Correct endpoints: ${correctEndpoints.length}`);
        console.log(`❌ Incorrect endpoints: ${incorrectEndpoints.length}`);

        if (incorrectEndpoints.length > 0) {
            console.log('\n❌ The following endpoints need to be fixed:');
            incorrectEndpoints.forEach(url => console.log(`   - ${url}`));
        } else {
            console.log('\n🎉 All endpoints are using the correct /study-area/academic/students/ prefix!');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testCorrectEndpoints();
