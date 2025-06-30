// Test extremely advanced mathematical expressions
async function testAdvancedMathExpressions() {
    console.log('🚀 TESTING EXTREMELY ADVANCED MATHEMATICAL EXPRESSIONS');
    console.log('='.repeat(60));
    
    const baseUrl = 'http://localhost:10000';
    
    // Very advanced mathematical expressions
    const advancedTests = [
        { name: 'Hyperbolic Cosine', expression: 'y = cosh(x)', category: 'Hyperbolic' },
        { name: 'Hyperbolic Tangent', expression: 'y = tanh(x)', category: 'Hyperbolic' },
        { name: 'Arccosine', expression: 'y = acos(x)', category: 'Inverse Trig' },
        { name: 'Arctangent', expression: 'y = atan(x)', category: 'Inverse Trig' },
        { name: 'Cube Root', expression: 'y = cbrt(x)', category: 'Root Functions' },
        { name: 'Floor Function', expression: 'y = floor(x)', category: 'Special' },
        { name: 'Ceiling Function', expression: 'y = ceil(x)', category: 'Special' },
        { name: 'Complex Polynomial', expression: 'y = x^4 - 3*x^3 + 2*x^2 - x + 1', category: 'Complex Polynomial' },
        { name: 'Logarithmic Base 2', expression: 'y = log(x, 2)', category: 'Logarithmic' },
        { name: 'Exponential Decay', expression: 'y = e^(-x)', category: 'Exponential' },
        { name: 'Sine with Phase', expression: 'y = sin(x + pi/4)', category: 'Trigonometric' },
        { name: 'Cosine with Amplitude', expression: 'y = 3*cos(2*x)', category: 'Trigonometric' },
        { name: 'Rational Complex', expression: 'y = (x^2 + 1)/(x^2 - 1)', category: 'Rational' },
        { name: 'Logarithm of Sine', expression: 'y = log(abs(sin(x)) + 1)', category: 'Complex' },
        { name: 'Power Function', expression: 'y = x^(1/3)', category: 'Power' }
    ];
    
    let results = { total: advancedTests.length, passed: 0, failed: 0, details: [] };
    
    console.log(`🎯 Testing ${results.total} extremely advanced mathematical expressions...\n`);
    
    for (let i = 0; i < advancedTests.length; i++) {
        const test = advancedTests[i];
        const testNum = i + 1;
        
        console.log(`${testNum}/${results.total} Testing: ${test.name} (${test.category})`);
        console.log(`Expression: ${test.expression}`);
        
        try {
            const payload = {
                conversationId: `advanced-test-${testNum}`,
                message: `Graph ${test.expression}`,
                history: []
            };
            
            const response = await fetch(`${baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const result = await response.json();
                
                if (result.type === 'mathematical_graph' && result.generatedImageUrl) {
                    console.log(`✅ SUCCESS - Graph generated: ${result.generatedImageUrl}`);
                    results.passed++;
                    results.details.push({ ...test, status: 'success', url: result.generatedImageUrl });
                } else {
                    console.log(`⚠️ PARTIAL - Response: ${result.kanaResponse?.substring(0, 100)}...`);
                    results.failed++;
                    results.details.push({ ...test, status: 'partial', response: result.kanaResponse });
                }
            } else {
                console.log(`❌ FAILED - HTTP ${response.status}`);
                results.failed++;
                results.details.push({ ...test, status: 'failed', error: `HTTP ${response.status}` });
            }
        } catch (error) {
            console.log(`❌ ERROR - ${error.message}`);
            results.failed++;
            results.details.push({ ...test, status: 'error', error: error.message });
        }
        
        console.log('');
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🏆 EXTREMELY ADVANCED MATH TEST RESULTS');
    console.log('='.repeat(60));
    
    const successRate = (results.passed / results.total * 100).toFixed(1);
    console.log(`\n🎯 Extremely Advanced Performance: ${results.passed}/${results.total} (${successRate}%)`);
    
    // Group by category
    const categories = {};
    results.details.forEach(detail => {
        if (!categories[detail.category]) {
            categories[detail.category] = { total: 0, passed: 0 };
        }
        categories[detail.category].total++;
        if (detail.status === 'success') {
            categories[detail.category].passed++;
        }
    });
    
    console.log(`\n📊 Performance by Category:`);
    Object.entries(categories).forEach(([category, stats]) => {
        const rate = ((stats.passed / stats.total) * 100).toFixed(1);
        console.log(`${category}: ${stats.passed}/${stats.total} (${rate}%)`);
    });
    
    console.log(`\n✅ Successfully Graphed Advanced Functions:`);
    results.details.filter(d => d.status === 'success').forEach(d => {
        console.log(`   ${d.name}: ${d.expression}`);
    });
    
    if (results.failed > 0) {
        console.log(`\n⚠️ Challenging Functions:`);
        results.details.filter(d => d.status !== 'success').forEach(d => {
            console.log(`   ${d.name}: ${d.expression} (${d.status})`);
        });
    }
    
    console.log(`\n🎓 K.A.N.A. Mathematical Mastery Assessment:`);
    if (successRate >= 90) {
        console.log(`🌟 MATHEMATICAL GENIUS (${successRate}%) - Handles even the most advanced expressions!`);
    } else if (successRate >= 80) {
        console.log(`🎯 ADVANCED MATHEMATICIAN (${successRate}%) - Excellent with complex mathematical functions!`);
    } else if (successRate >= 70) {
        console.log(`📈 SOLID MATHEMATICIAN (${successRate}%) - Very good mathematical capabilities!`);
    } else if (successRate >= 60) {
        console.log(`⚡ COMPETENT (${successRate}%) - Good mathematical expression support!`);
    } else {
        console.log(`📚 DEVELOPING (${successRate}%) - Basic to intermediate mathematical support!`);
    }
    
    return results;
}

testAdvancedMathExpressions().catch(console.error);
