console.log('🔍 Testing backend student and teacher endpoints...');

async function testEndpoints() {
    // First, let's test without authentication to see the response
    console.log('\n=== Testing WITHOUT Authentication ===');
    try {
        const response = await fetch('http://localhost:8000/study-area/students/my-school');
        console.log('📊 Students - Status:', response.status);
        console.log('📊 Students - Headers:', Object.fromEntries(response.headers.entries()));

        const data = await response.text();
        console.log('📊 Students - Raw response:', data);

        try {
            const jsonData = JSON.parse(data);
            console.log('📊 Students - Parsed JSON:', jsonData);
        } catch (e) {
            console.log('📊 Students - Not valid JSON');
        }
    } catch (error) {
        console.error('❌ Students Error:', error.message);
    }

    console.log('\n=== Testing Teachers ===');
    try {
        const response = await fetch('http://localhost:8000/study-area/teachers/my-school');
        console.log('📊 Teachers - Status:', response.status);

        const data = await response.text();
        console.log('📊 Teachers - Raw response:', data);

        try {
            const jsonData = JSON.parse(data);
            console.log('📊 Teachers - Parsed JSON:', jsonData);
        } catch (e) {
            console.log('📊 Teachers - Not valid JSON');
        }
    } catch (error) {
        console.error('❌ Teachers Error:', error.message);
    }

    // Test with mock token
    console.log('\n=== Testing WITH Mock Authentication ===');
    try {
        const response = await fetch('http://localhost:8000/study-area/students/my-school', {
            headers: {
                'Authorization': 'Bearer mock-token',
                'Content-Type': 'application/json'
            }
        });

        console.log('📊 Students (Auth) - Status:', response.status);
        const data = await response.text();
        console.log('📊 Students (Auth) - Response:', data);
    } catch (error) {
        console.error('❌ Students (Auth) Error:', error.message);
    }
}

testEndpoints();

// Also create a browser-ready test function
console.log('\n=== BROWSER TEST INSTRUCTIONS ===');
console.log('1. Go to http://localhost:5173/');
console.log('2. Open browser developer tools (F12)');
console.log('3. Go to Console tab');
console.log('4. Run this test:');
console.log(`
async function testInBrowser() {
    const token = localStorage.getItem('access_token');
    console.log('🔑 Token exists:', !!token);
    console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
    
    if (!token) {
        console.log('❌ No authentication token found in localStorage');
        return;
    }
    
    try {
        console.log('🧪 Testing students endpoint...');
        const studentsResponse = await fetch('http://localhost:8000/study-area/students/my-school', {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Students Status:', studentsResponse.status);
        const studentsData = await studentsResponse.json();
        console.log('📊 Students Data:', studentsData);
        console.log('📊 Students Type:', typeof studentsData);
        console.log('📊 Students Is Array:', Array.isArray(studentsData));
        if (Array.isArray(studentsData)) {
            console.log('📊 Students Count:', studentsData.length);
        }
        
        console.log('\\n🧪 Testing teachers endpoint...');
        const teachersResponse = await fetch('http://localhost:8000/study-area/teachers/my-school', {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Teachers Status:', teachersResponse.status);
        const teachersData = await teachersResponse.json();
        console.log('📊 Teachers Data:', teachersData);
        console.log('📊 Teachers Type:', typeof teachersData);
        console.log('📊 Teachers Is Array:', Array.isArray(teachersData));
        if (Array.isArray(teachersData)) {
            console.log('📊 Teachers Count:', teachersData.length);
        }
        
    } catch (error) {
        console.error('❌ Test Error:', error);
    }
}

// Run the test
testInBrowser();
`);
