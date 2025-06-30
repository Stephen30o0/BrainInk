// Quick test of advanced mathematical expressions with K.A.N.A.
async function testAdvancedMath() {
    console.log('🧮 TESTING K.A.N.A. ADVANCED MATHEMATICAL EXPRESSIONS');
    console.log('='.repeat(60));
    
    const baseUrl = 'http://localhost:10000';
    
    // Define key mathematical expressions to test
    const mathTests = [
        { name: 'Quadratic', expression: 'y = x^2', category: 'Polynomial' },
        { name: 'Cubic', expression: 'y = x^3 - 2*x', category: 'Polynomial' },
        { name: 'Exponential', expression: 'y = e^x', category: 'Exponential' },
        { name: 'Natural Log', expression: 'y = log(x)', category: 'Logarithmic' },
        { name: 'Base 10 Log', expression: 'y = log10(x)', category: 'Logarithmic' },
        { name: 'Sine Wave', expression: 'y = sin(x)', category: 'Trigonometric' },
        { name: 'Cosine Wave', expression: 'y = cos(x)', category: 'Trigonometric' },
        { name: 'Tangent', expression: 'y = tan(x)', category: 'Trigonometric' },
        { name: 'Square Root', expression: 'y = sqrt(x)', category: 'Root' },
        { name: 'Absolute Value', expression: 'y = abs(x)', category: 'Special' },
        { name: 'Rational Function', expression: 'y = 1/(x+1)', category: 'Rational' },
        { name: 'Gaussian', expression: 'y = e^(-x^2)', category: 'Complex' },
        { name: 'Damped Sine', expression: 'y = sin(x)*e^(-x/2)', category: 'Complex' },
        { name: 'Hyperbolic Sine', expression: 'y = sinh(x)', category: 'Hyperbolic' },
        { name: 'Inverse Sine', expression: 'y = asin(x)', category: 'Inverse Trig' }
    ];
    
    let results = { total: mathTests.length, passed: 0, failed: 0, details: [] };
    
    console.log(`🎯 Testing ${results.total} mathematical expressions...\n`);
    
    for (let i = 0; i < mathTests.length; i++) {
        const test = mathTests[i];
        const testNum = i + 1;
        
        console.log(`${testNum}/${results.total} Testing: ${test.name} (${test.category})`);
        console.log(`Expression: ${test.expression}`);
        
        try {
            const payload = {
                conversationId: `test-math-${testNum}`,
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
        
        // Delay to avoid overwhelming server
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 ADVANCED MATH TEST RESULTS');
    console.log('='.repeat(60));
    
    const successRate = (results.passed / results.total * 100).toFixed(1);
    console.log(`\n🎯 Overall Performance: ${results.passed}/${results.total} (${successRate}%)`);
    
    console.log(`\n✅ Successful Graphs:`);
    results.details.filter(d => d.status === 'success').forEach(d => {
        console.log(`   ${d.name}: ${d.expression}`);
    });
    
    if (results.failed > 0) {
        console.log(`\n❌ Failed Tests:`);
        results.details.filter(d => d.status !== 'success').forEach(d => {
            console.log(`   ${d.name}: ${d.expression} (${d.status})`);
        });
    }
    
    console.log(`\n🏆 K.A.N.A. Mathematical Intelligence Rating:`);
    if (successRate >= 90) {
        console.log(`🌟 EXCEPTIONAL (${successRate}%) - Handles advanced mathematics excellently!`);
    } else if (successRate >= 75) {
        console.log(`🎯 EXCELLENT (${successRate}%) - Very good mathematical expression support!`);
    } else if (successRate >= 60) {
        console.log(`📈 GOOD (${successRate}%) - Solid mathematical capabilities!`);
    } else if (successRate >= 40) {
        console.log(`⚠️ FAIR (${successRate}%) - Basic math support, some advanced features missing!`);
    } else {
        console.log(`❌ NEEDS IMPROVEMENT (${successRate}%) - Limited mathematical expression support!`);
    }
    
    return results;
}

// Run the test
testAdvancedMath().catch(console.error);
