// Test the chat endpoint with graph generation
async function testChatGraph() {
    try {
        console.log('🧪 Testing K.A.N.A. Chat with Graph Generation...');
        
        const response = await fetch('http://localhost:10000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversationId: 'test-' + Date.now(),
                message: 'graph y = x^2',
                history: []
            })
        });
        
        const result = await response.json();
        console.log('Status:', response.status);
        console.log('Response type:', result.type || 'text');
        console.log('K.A.N.A. response:', result.kanaResponse);
        if (result.generatedImageUrl) {
            console.log('✅ Graph generated:', result.generatedImageUrl);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testChatGraph();
