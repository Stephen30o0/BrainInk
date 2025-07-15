// Comprehensive Mathematical Expression Tests for K.A.N.A.
// Testing advanced math functions: logs, exponentials, trig, etc.

const fs = require('fs');

async function testAdvancedMathExpressions() {
    console.log('🧮 COMPREHENSIVE MATHEMATICAL EXPRESSION TESTS');
    console.log('='.repeat(60));
    
    const baseUrl = 'http://localhost:10000';
    
    // Define comprehensive test cases
    const mathTests = [
        // Basic Functions
        { name: 'Linear Function', expression: 'y = 2*x + 3', category: 'Basic' },
        { name: 'Quadratic Function', expression: 'y = x^2', category: 'Basic' },
        { name: 'Cubic Function', expression: 'y = x^3 - 2*x', category: 'Basic' },
        
        // Exponential Functions
        { name: 'Natural Exponential', expression: 'y = e^x', category: 'Exponential' },
        { name: 'Base 2 Exponential', expression: 'y = 2^x', category: 'Exponential' },
        { name: 'Exponential Decay', expression: 'y = e^(-x)', category: 'Exponential' },
        { name: 'Exponential with Coefficient', expression: 'y = 3 * e^(2*x)', category: 'Exponential' },
        
        // Logarithmic Functions
        { name: 'Natural Logarithm', expression: 'y = log(x)', category: 'Logarithmic' },
        { name: 'Base 10 Logarithm', expression: 'y = log10(x)', category: 'Logarithmic' },
        { name: 'Base 2 Logarithm', expression: 'y = log2(x)', category: 'Logarithmic' },
        { name: 'Logarithm with Coefficient', expression: 'y = 2 * log(x + 1)', category: 'Logarithmic' },
        
        // Trigonometric Functions
        { name: 'Sine Function', expression: 'y = sin(x)', category: 'Trigonometric' },
        { name: 'Cosine Function', expression: 'y = cos(x)', category: 'Trigonometric' },
        { name: 'Tangent Function', expression: 'y = tan(x)', category: 'Trigonometric' },
        { name: 'Sine Wave', expression: 'y = 2 * sin(3*x + pi/4)', category: 'Trigonometric' },
        
        // Inverse Trigonometric Functions
        { name: 'Arcsine', expression: 'y = asin(x)', category: 'Inverse Trig' },
        { name: 'Arccosine', expression: 'y = acos(x)', category: 'Inverse Trig' },
        { name: 'Arctangent', expression: 'y = atan(x)', category: 'Inverse Trig' },
        
        // Hyperbolic Functions
        { name: 'Hyperbolic Sine', expression: 'y = sinh(x)', category: 'Hyperbolic' },
        { name: 'Hyperbolic Cosine', expression: 'y = cosh(x)', category: 'Hyperbolic' },
        { name: 'Hyperbolic Tangent', expression: 'y = tanh(x)', category: 'Hyperbolic' },
        
        // Root Functions
        { name: 'Square Root', expression: 'y = sqrt(x)', category: 'Root Functions' },
        { name: 'Cube Root', expression: 'y = cbrt(x)', category: 'Root Functions' },
        { name: 'General Root', expression: 'y = x^(1/3)', category: 'Root Functions' },
        
        // Complex Expressions
        { name: 'Rational Function', expression: 'y = (x^2 + 1) / (x - 2)', category: 'Complex' },
        { name: 'Mixed Functions', expression: 'y = sin(x) * e^(-x/2)', category: 'Complex' },
        { name: 'Logarithmic Spiral', expression: 'y = log(x) * sin(x)', category: 'Complex' },
        { name: 'Gaussian Function', expression: 'y = e^(-(x^2)/2)', category: 'Complex' },
        
        // Absolute Value and Floor/Ceiling
        { name: 'Absolute Value', expression: 'y = abs(x)', category: 'Special' },
        { name: 'Floor Function', expression: 'y = floor(x)', category: 'Special' },
        { name: 'Ceiling Function', expression: 'y = ceil(x)', category: 'Special' },
        
        // Constants and Special Values
        { name: 'Pi Function', expression: 'y = sin(pi * x)', category: 'Constants' },
        { name: 'Euler Number', expression: 'y = e^x', category: 'Constants' }
    ];
    
    let results = {
        total: mathTests.length,
        passed: 0,
        failed: 0,
        categories: {},
        failures: []
    };
    
    console.log(`🎯 Testing ${results.total} mathematical expressions...\n`);
    
    for (let i = 0; i < mathTests.length; i++) {
        const test = mathTests[i];
        const testNum = i + 1;
        
        console.log(`${testNum}/${results.total} Testing: ${test.name} (${test.category})`);
        console.log(`Expression: ${test.expression}`);
        
        try {
            // Test with chat endpoint that should trigger graph generation
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
                    
                    // Track by category
                    if (!results.categories[test.category]) {
                        results.categories[test.category] = { passed: 0, failed: 0 };
                    }
                    results.categories[test.category].passed++;
                } else if (result.kanaResponse) {
                    console.log(`⚠️ PARTIAL - AI responded but no graph: ${result.kanaResponse.substring(0, 100)}...`);
                    results.failed++;
                    results.failures.push({
                        test: test.name,
                        expression: test.expression,
                        reason: 'AI responded but did not generate graph',
                        response: result.kanaResponse.substring(0, 200)
                    });
                    
                    if (!results.categories[test.category]) {
                        results.categories[test.category] = { passed: 0, failed: 0 };
                    }
                    results.categories[test.category].failed++;
                } else {
                    console.log(`❌ FAILED - Unexpected response format`);
                    results.failed++;
                    results.failures.push({
                        test: test.name,
                        expression: test.expression,
                        reason: 'Unexpected response format',
                        response: JSON.stringify(result)
                    });
                }
            } else {
                console.log(`❌ FAILED - HTTP ${response.status}`);
                results.failed++;
                results.failures.push({
                    test: test.name,
                    expression: test.expression,
                    reason: `HTTP ${response.status}`,
                    response: await response.text()
                });
            }
        } catch (error) {
            console.log(`❌ FAILED - Error: ${error.message}`);
            results.failed++;
            results.failures.push({
                test: test.name,
                expression: test.expression,
                reason: error.message,
                response: 'Network or parsing error'
            });
        }
        
        console.log(''); // Empty line for readability
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Generate comprehensive report
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 OVERALL PERFORMANCE:`);
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed} (${((results.passed/results.total)*100).toFixed(1)}%)`);
    console.log(`Failed: ${results.failed} (${((results.failed/results.total)*100).toFixed(1)}%)`);
    
    console.log(`\n📈 PERFORMANCE BY CATEGORY:`);
    Object.entries(results.categories).forEach(([category, stats]) => {
        const total = stats.passed + stats.failed;
        const successRate = ((stats.passed / total) * 100).toFixed(1);
        console.log(`${category}: ${stats.passed}/${total} (${successRate}%)`);
    });
    
    if (results.failures.length > 0) {
        console.log(`\n❌ FAILURE ANALYSIS:`);
        results.failures.forEach((failure, index) => {
            console.log(`\n${index + 1}. ${failure.test}`);
            console.log(`   Expression: ${failure.expression}`);
            console.log(`   Reason: ${failure.reason}`);
            console.log(`   Response: ${failure.response.substring(0, 150)}...`);
        });
    }
    
    console.log(`\n🏆 MATHEMATICAL INTELLIGENCE ASSESSMENT:`);
    const overallScore = (results.passed / results.total) * 100;
    
    if (overallScore >= 90) {
        console.log(`🌟 EXCELLENT (${overallScore.toFixed(1)}%) - K.A.N.A. handles advanced mathematics exceptionally well!`);
    } else if (overallScore >= 75) {
        console.log(`🎯 VERY GOOD (${overallScore.toFixed(1)}%) - K.A.N.A. handles most mathematical expressions successfully!`);
    } else if (overallScore >= 60) {
        console.log(`📈 GOOD (${overallScore.toFixed(1)}%) - K.A.N.A. handles basic and intermediate mathematics well!`);
    } else if (overallScore >= 40) {
        console.log(`⚠️ FAIR (${overallScore.toFixed(1)}%) - K.A.N.A. handles basic mathematics but struggles with advanced functions!`);
    } else {
        console.log(`❌ NEEDS IMPROVEMENT (${overallScore.toFixed(1)}%) - K.A.N.A. has difficulty with mathematical expressions!`);
    }
    
    // Save detailed results to file
    const reportData = {
        timestamp: new Date().toISOString(),
        summary: results,
        testCases: mathTests,
        detailedResults: results.failures
    };
    
    fs.writeFileSync('MATH_EXPRESSION_TEST_RESULTS.json', JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Detailed results saved to: MATH_EXPRESSION_TEST_RESULTS.json`);
    
    return results;
}

// Run the comprehensive test
testAdvancedMathExpressions().catch(console.error);
