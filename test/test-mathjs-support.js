// Test mathjs capabilities directly to understand what K.A.N.A. can handle
const { evaluate, create, all } = require('mathjs');

console.log('🔬 MATHJS CAPABILITIES ANALYSIS');
console.log('='.repeat(50));

// Test basic math functions that mathjs supports
const testExpressions = [
    // Basic arithmetic
    { expr: 'x + 2', x: 5, expected: 7, category: 'Basic Arithmetic' },
    { expr: 'x^2', x: 3, expected: 9, category: 'Exponentiation' },
    { expr: 'x * 2 + 1', x: 4, expected: 9, category: 'Linear' },
    
    // Exponential and logarithmic
    { expr: 'exp(x)', x: 1, expected: Math.E, category: 'Exponential' },
    { expr: 'log(x)', x: Math.E, expected: 1, category: 'Natural Log' },
    { expr: 'log10(x)', x: 100, expected: 2, category: 'Base 10 Log' },
    { expr: 'log(x, 2)', x: 8, expected: 3, category: 'Base 2 Log' },
    
    // Trigonometric
    { expr: 'sin(x)', x: 0, expected: 0, category: 'Trigonometric' },
    { expr: 'cos(x)', x: 0, expected: 1, category: 'Trigonometric' },
    { expr: 'tan(x)', x: 0, expected: 0, category: 'Trigonometric' },
    { expr: 'sin(pi/2)', x: 0, expected: 1, category: 'Trig with Pi' },
    
    // Inverse trigonometric
    { expr: 'asin(x)', x: 1, expected: Math.PI/2, category: 'Inverse Trig' },
    { expr: 'acos(x)', x: 0, expected: Math.PI/2, category: 'Inverse Trig' },
    { expr: 'atan(x)', x: 1, expected: Math.PI/4, category: 'Inverse Trig' },
    
    // Hyperbolic
    { expr: 'sinh(x)', x: 0, expected: 0, category: 'Hyperbolic' },
    { expr: 'cosh(x)', x: 0, expected: 1, category: 'Hyperbolic' },
    { expr: 'tanh(x)', x: 0, expected: 0, category: 'Hyperbolic' },
    
    // Root functions
    { expr: 'sqrt(x)', x: 16, expected: 4, category: 'Root Functions' },
    { expr: 'cbrt(x)', x: 27, expected: 3, category: 'Root Functions' },
    { expr: 'nthRoot(x, 3)', x: 27, expected: 3, category: 'Root Functions' },
    
    // Special functions
    { expr: 'abs(x)', x: -5, expected: 5, category: 'Absolute Value' },
    { expr: 'floor(x)', x: 3.7, expected: 3, category: 'Floor/Ceiling' },
    { expr: 'ceil(x)', x: 3.2, expected: 4, category: 'Floor/Ceiling' },
    { expr: 'round(x)', x: 3.6, expected: 4, category: 'Rounding' },
    
    // Constants
    { expr: 'pi', x: 0, expected: Math.PI, category: 'Constants' },
    { expr: 'e', x: 0, expected: Math.E, category: 'Constants' },
    
    // Complex expressions
    { expr: 'sin(x) * exp(-x/2)', x: 1, expected: null, category: 'Complex' },
    { expr: 'log(x) + sqrt(x)', x: 4, expected: null, category: 'Complex' },
];

console.log('\n🧮 Testing Mathematical Expression Support...\n');

let supported = 0;
let unsupported = 0;
const supportedFunctions = [];
const unsupportedFunctions = [];

testExpressions.forEach((test, index) => {
    try {
        const result = evaluate(test.expr, { x: test.x });
        const isValid = typeof result === 'number' && !isNaN(result);
        
        if (isValid) {
            console.log(`✅ ${test.category}: ${test.expr} = ${result}`);
            supported++;
            supportedFunctions.push(test);
        } else {
            console.log(`⚠️ ${test.category}: ${test.expr} = ${result} (invalid result)`);
            unsupported++;
            unsupportedFunctions.push(test);
        }
    } catch (error) {
        console.log(`❌ ${test.category}: ${test.expr} - Error: ${error.message}`);
        unsupported++;
        unsupportedFunctions.push(test);
    }
});

console.log('\n' + '='.repeat(50));
console.log('📊 MATHJS FUNCTION SUPPORT SUMMARY');
console.log('='.repeat(50));

console.log(`\n🎯 Overall Support:`);
console.log(`Supported: ${supported}/${testExpressions.length} (${((supported/testExpressions.length)*100).toFixed(1)}%)`);
console.log(`Unsupported: ${unsupported}/${testExpressions.length} (${((unsupported/testExpressions.length)*100).toFixed(1)}%)`);

// Group by category
const categoryResults = {};
testExpressions.forEach(test => {
    if (!categoryResults[test.category]) {
        categoryResults[test.category] = { total: 0, supported: 0 };
    }
    categoryResults[test.category].total++;
    
    if (supportedFunctions.includes(test)) {
        categoryResults[test.category].supported++;
    }
});

console.log(`\n📈 Support by Category:`);
Object.entries(categoryResults).forEach(([category, stats]) => {
    const percentage = ((stats.supported / stats.total) * 100).toFixed(1);
    console.log(`${category}: ${stats.supported}/${stats.total} (${percentage}%)`);
});

if (unsupportedFunctions.length > 0) {
    console.log(`\n❌ Unsupported Functions:`);
    unsupportedFunctions.forEach(func => {
        console.log(`   ${func.expr} (${func.category})`);
    });
}

console.log(`\n💡 K.A.N.A. Graph Generation Recommendations:`);
console.log(`✅ Strong support for: Basic arithmetic, trigonometry, exponentials, logarithms`);
console.log(`⚠️ Limited support for: Complex nested functions, specialized mathematical functions`);
console.log(`🎯 Best performance expected with: Polynomial, trigonometric, exponential, and logarithmic functions`);

// Test some advanced mathematical expressions that might be common in education
console.log(`\n🎓 Educational Math Expression Tests:`);
const educationalTests = [
    'x^2 + 2*x + 1',        // Quadratic
    'sin(x) + cos(x)',      // Trigonometric sum
    'exp(x) - 1',           // Exponential
    'log(x^2)',             // Logarithm of power
    '1/(x^2 + 1)',          // Rational function
    'sqrt(x^2 + 1)',        // Square root of sum
    'abs(sin(x))',          // Absolute value of trig
    '2^x',                  // Exponential base 2
];

educationalTests.forEach(expr => {
    try {
        const testResult = evaluate(expr, { x: 2 });
        console.log(`✅ ${expr} works (result at x=2: ${testResult})`);
    } catch (error) {
        console.log(`❌ ${expr} fails: ${error.message}`);
    }
});

console.log(`\n🚀 Ready to test K.A.N.A.'s graph generation with these expressions!`);
