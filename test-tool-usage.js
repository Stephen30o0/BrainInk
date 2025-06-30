// Simple test to check if AI model uses the graph generation tool
async function testGraphToolUsage() {
    console.log('🔧 TESTING GRAPH TOOL USAGE');
    console.log('='.repeat(40));
    
    const baseUrl = 'http://localhost:10000';
    
    const simpleTests = [
        'graph y = x',
        'plot y = x^2', 
        'can you graph y = sin(x)?',
        'draw a graph of y = 2x + 1'
    ];
    
    for (let i = 0; i < simpleTests.length; i++) {
        const message = simpleTests[i];
        console.log(`\n${i+1}. Testing: "${message}"`);
        
        try {
            const payload = {
                conversationId: `tool-test-${i}`,
                message: message,
                history: []
            };
            
            const response = await fetch(`${baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const result = await response.json();
                
                if (result.type === 'mathematical_graph') {
                    console.log(`✅ Tool used successfully - Graph generated`);
                } else {
                    console.log(`❌ Tool not used - Text response: ${result.kanaResponse?.substring(0, 150)}...`);
                }
            } else {
                console.log(`❌ HTTP Error: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Request Error: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

testGraphToolUsage().catch(console.error);
