// Test script for graph generation functionality
const { generateSVGGraph } = require('./utils/svgGraph');

// Test data in the correct format
const testData = [
  { x: -5, y: 25 },
  { x: -4, y: 16 },
  { x: -3, y: 9 },
  { x: -2, y: 4 },
  { x: -1, y: 1 },
  { x: 0, y: 0 },
  { x: 1, y: 1 },
  { x: 2, y: 4 },
  { x: 3, y: 9 },
  { x: 4, y: 16 },
  { x: 5, y: 25 }
];

console.log('🧪 Testing SVG Graph Generation...');

try {
  const svg = generateSVGGraph(testData, 'y = x²', 'x', 'y');
  
  if (svg) {
    console.log('✅ SVG generation successful!');
    console.log('✅ SVG length:', svg.length, 'characters');
    console.log('✅ Contains expected elements:', 
      svg.includes('<svg') && 
      svg.includes('<polyline') && 
      svg.includes('y = x²'));
  } else {
    console.log('❌ SVG generation failed - returned null');
  }
} catch (error) {
  console.error('❌ SVG generation error:', error.message);
}

console.log('\n🧪 Testing Math Expression Evaluation...');

try {
  const { evaluate } = require('mathjs');
  
  // Test the same expression that would be used in graph generation
  const expression = 'x^2';
  const cleanedExpression = expression.replace(/\^/g, '^'); // mathjs uses ^ for exponents
  console.log(`DEBUG: Original expression: ${expression}`);
  console.log(`DEBUG: Cleaned expression: ${cleanedExpression}`);
  
  const testX = 3;
  const result = evaluate(cleanedExpression, { x: testX });
  
  console.log(`✅ Math evaluation successful: ${cleanedExpression} at x=${testX} = ${result}`);
} catch (error) {
  console.error('❌ Math evaluation error:', error.message);
}

console.log('\n🎯 Graph Generation Test Complete!');
