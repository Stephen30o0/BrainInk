// Test mathjs capabilities directly to understand what K.A.N.A. can handle
const { evaluate } = require('mathjs');

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
    
    // Root functions
    { expr: 'sqrt(x)', x: 16, expected: 4, category: 'Root Functions' },
    { expr: 'cbrt(x)', x: 27, expected: 3, category: 'Root Functions' },
    
    // Special functions
    { expr: 'abs(x)', x: -5, expected: 5, category: 'Absolute Value' },
    { expr: 'floor(x)', x: 3.7, expected: 3, category: 'Floor/Ceiling' },
    { expr: 'ceil(x)', x: 3.2, expected: 4, category: 'Floor/Ceiling' },
    { expr: 'round(x)', x: 3.6, expected: 4, category: 'Rounding' },
    
    // Constants
    { expr: 'pi', x: 0, expected: Math.PI, category: 'Constants' },
    { expr: 'e', x: 0, expected: Math.E, category: 'Constants' },
];

console.log('\n🧮 Testing Mathematical Expression Support...\n');

let supported = 0;
let unsupported = 0;

testExpressions.forEach((test, index) => {
    try {
        const result = evaluate(test.expr, { x: test.x });
        const isValid = typeof result === 'number' && !isNaN(result) && isFinite(result);
        
        if (isValid) {
            console.log(`✅ ${test.category}: ${test.expr} = ${result.toFixed(4)}`);
            supported++;
        } else {
            console.log(`⚠️ ${test.category}: ${test.expr} = ${result} (invalid result)`);
            unsupported++;
        }
    } catch (error) {
        console.log(`❌ ${test.category}: ${test.expr} - Error: ${error.message}`);
        unsupported++;
    }
});

console.log('\n' + '='.repeat(50));
console.log('📊 MATHJS FUNCTION SUPPORT SUMMARY');
console.log('='.repeat(50));

console.log(`\nSupported: ${supported}/${testExpressions.length} (${((supported/testExpressions.length)*100).toFixed(1)}%)`);
console.log(`Unsupported: ${unsupported}/${testExpressions.length} (${((unsupported/testExpressions.length)*100).toFixed(1)}%)`);

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
    'tan(x)',               // Tangent
    'log10(x)',             // Base 10 log
    'sin(pi*x)',            // Sine with pi
    'e^(-x^2)',             // Gaussian-like
];

let eduSupported = 0;
educationalTests.forEach(expr => {
    try {
        const testResult = evaluate(expr, { x: 2 });
        if (typeof testResult === 'number' && !isNaN(testResult) && isFinite(testResult)) {
            console.log(`✅ ${expr} works (result at x=2: ${testResult.toFixed(4)})`);
            eduSupported++;
        } else {
            console.log(`⚠️ ${expr} gives invalid result: ${testResult}`);
        }
    } catch (error) {
        console.log(`❌ ${expr} fails: ${error.message}`);
    }
});

console.log(`\n📈 Educational expressions supported: ${eduSupported}/${educationalTests.length} (${((eduSupported/educationalTests.length)*100).toFixed(1)}%)`);

console.log(`\n🚀 K.A.N.A. should be able to graph most common mathematical functions!`);
