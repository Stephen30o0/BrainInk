console.log('🔍 Testing fixed student endpoints...');

fetch('http://localhost:8000/students/my-dashboard', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
})
    .then(response => {
        console.log('📍 Dashboard endpoint status:', response.status);
        if (response.status === 401) {
            console.log('✅ 401 Unauthorized is expected (need authentication)');
            console.log('✅ Endpoint exists - 404 error fixed!');
        } else if (response.status === 404) {
            console.log('❌ Still getting 404 - endpoint may not exist');
        } else {
            console.log('📊 Response status:', response.status);
        }
        return response.text();
    })
    .then(text => {
        console.log('📄 Response:', text.substring(0, 200));
    })
    .catch(error => {
        console.error('❌ Network error:', error.message);
    });
