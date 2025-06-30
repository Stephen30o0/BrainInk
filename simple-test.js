// Simple test for K.A.N.A. endpoint
async function simpleTest() {
    try {
        const response = await fetch('http://localhost:10000/kana-direct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pdf_text: "Test analysis of student work",
                task_type: 'analyze',
                student_context: 'Test student'
            })
        });
        
        console.log('Status:', response.status);
        const result = await response.json();
        console.log('Analysis length:', result.analysis?.length || 0);
        console.log('Knowledge gaps:', result.knowledge_gaps?.length || 0);
        console.log('Success!');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

simpleTest();
