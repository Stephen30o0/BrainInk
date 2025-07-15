/**
 * Test script to verify teacher selection flow
 */

const BACKEND_URL = 'http://localhost:8000';

// Test the teacher selection endpoint
async function testTeacherSelection() {
    console.log('🧪 Testing Teacher Selection Flow...\n');

    // Get token from localStorage (this would normally be done in the browser)
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('❌ No authentication token found in localStorage');
        return;
    }

    console.log('✅ Token found:', token.substring(0, 20) + '...');

    // Test data - adjust these values based on your test setup
    const testData = {
        school_id: 1,
        email: 'test@example.com' // Replace with actual test email
    };

    try {
        console.log('\n📡 Making request to /study-area/login-school/select-teacher...');
        console.log('Request body:', testData);

        const response = await fetch(`${BACKEND_URL}/study-area/login-school/select-teacher`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const data = await response.json();
            console.log('✅ SUCCESS! Response data:', data);

            // Verify expected response structure
            const expectedFields = ['message', 'status', 'school_name', 'success', 'school_id', 'role'];
            const missingFields = expectedFields.filter(field => !(field in data));

            if (missingFields.length === 0) {
                console.log('✅ Response has all expected fields');
            } else {
                console.log('⚠️  Missing fields:', missingFields);
            }

            // Store the result (like the service would do)
            if (data.success) {
                console.log('\n💾 Storing teacher selection result...');
                localStorage.setItem('selected_school_id', data.school_id.toString());
                localStorage.setItem('selected_school_name', data.school_name);
                localStorage.setItem('user_role', data.role);
                localStorage.setItem('school_role_confirmed', 'true');
                console.log('✅ Teacher selection stored successfully');
            }

        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ FAILED! Error response:', errorData);

            // Provide helpful debugging information
            if (response.status === 403) {
                console.log('\n🔍 403 Forbidden Analysis:');
                console.log('- User may not be assigned as teacher in this school');
                console.log('- User may need to accept teacher invitation first');
                console.log('- Check if user has teacher permissions in the backend');
            } else if (response.status === 401) {
                console.log('\n🔍 401 Unauthorized Analysis:');
                console.log('- Token may be expired or invalid');
                console.log('- User may need to re-authenticate');
            }
        }

    } catch (error) {
        console.error('❌ Network error:', error);
    }
}

// Test the invitation flow first
async function testInvitationFlow() {
    console.log('\n🧪 Testing Invitation Flow...\n');

    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('❌ No authentication token found');
        return;
    }

    try {
        // Check available invitations
        console.log('📧 Checking available invitations...');
        const invitationsResponse = await fetch(`${BACKEND_URL}/study-area/invitations/available`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (invitationsResponse.ok) {
            const invitations = await invitationsResponse.json();
            console.log('✅ Available invitations:', invitations);

            // If there are teacher invitations, show them
            const teacherInvitations = invitations.filter(inv => inv.invitation_type === 'teacher');
            if (teacherInvitations.length > 0) {
                console.log('\n👩‍🏫 Teacher invitations found:');
                teacherInvitations.forEach(inv => {
                    console.log(`  - School: ${inv.school_name} (ID: ${inv.school_id})`);
                    console.log(`  - Invitation ID: ${inv.id}`);
                    console.log(`  - Used: ${inv.is_used ? 'Yes' : 'No'}`);
                });
            } else {
                console.log('⚠️  No teacher invitations found');
            }
        } else {
            console.log('⚠️  Invitations endpoint not available or failed');
        }

    } catch (error) {
        console.log('⚠️  Invitation flow test failed:', error.message);
    }
}

// Run the tests
async function runTests() {
    console.log('🚀 Starting Teacher Selection Integration Tests\n');
    console.log('='.repeat(50));

    await testInvitationFlow();
    console.log('\n' + '='.repeat(50));
    await testTeacherSelection();

    console.log('\n' + '='.repeat(50));
    console.log('✅ Tests completed!');
}

// Export for use in browser console or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testTeacherSelection, testInvitationFlow, runTests };
} else {
    // Browser environment - make functions available globally
    window.testTeacherSelection = testTeacherSelection;
    window.testInvitationFlow = testInvitationFlow;
    window.runTests = runTests;

    console.log('🧪 Teacher Selection Test Functions Available:');
    console.log('- testTeacherSelection()');
    console.log('- testInvitationFlow()');
    console.log('- runTests() - runs all tests');
}
