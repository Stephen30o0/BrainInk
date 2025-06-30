// Test graph generation and display fix
import axios from 'axios';

async function testGraphDisplay() {
  console.log('🧮 Testing Graph Display Fix...\n');
  
  try {
    const response = await axios.post('http://localhost:10000/api/chat', {
      message: 'Can you graph the function y = 3*cos(2*x) for me?',
      conversationId: 'test-graph-display'
    });
    
    console.log('✅ Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    
    // Check if there's a graph URL in the response
    const responseText = response.data.kanaResponse || response.data.content || response.data.message || '';
    const generatedImageUrl = response.data.generatedImageUrl;
    
    let graphUrl = null;
    if (generatedImageUrl) {
      graphUrl = generatedImageUrl;
      console.log('🎯 Graph URL Found in generatedImageUrl:', graphUrl);
    } else {
      const graphUrlMatch = responseText.match(/\/uploads\/graph_\d+\.(svg|png)/);
      if (graphUrlMatch) {
        graphUrl = graphUrlMatch[0];
        console.log('🎯 Graph URL Found in text:', graphUrl);
      }
    }
    
    if (graphUrl) {
      
      // Test if the graph file is accessible
      try {
        const graphResponse = await axios.get(`http://localhost:10000${graphUrl}`);
        console.log('✅ Graph file accessible! Status:', graphResponse.status);
        console.log('📁 Content-Type:', graphResponse.headers['content-type']);
        console.log('📊 File size:', graphResponse.headers['content-length'] || 'Unknown');
        
        console.log('\n🏆 SUCCESS: Graph is generated and accessible!');
      } catch (graphError) {
        console.log('❌ Graph file NOT accessible:', graphError.message);
        console.log('🔧 This indicates the static file serving is not working');
      }
    } else {
      console.log('⚠️ No graph URL found in response');
      console.log('Response content:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testGraphDisplay();
