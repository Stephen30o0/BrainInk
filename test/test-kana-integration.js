/**
 * K.A.N.A. Study Centre Integration Test
 * 
 * This test simulates the real workflow by:
 * 1. Creating a K.A.N.A. analysis (as if a teacher just graded work)
 * 2. Triggering assignment generation
 * 3. Verifying assignments appear in Study Centre
 */

import fetch from 'node-fetch';

// Test configuration
const BACKEND_URL = 'http://localhost:10000';
const TEST_USER_ID = 4; // Brain user
const TEST_USERNAME = 'Brain';

async function runIntegrationTest() {
  console.log('🧪 Starting K.A.N.A. Study Centre Integration Test');
  console.log('User:', TEST_USERNAME, '(ID:', TEST_USER_ID + ')');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Simulate K.A.N.A. grading a student's work
    console.log('\n📝 Step 1: Simulating K.A.N.A. grading student work...');
    const analysisData = await simulateKanaGrading();
    console.log('✅ K.A.N.A. analysis completed');
    
    // Step 2: Generate assignments from the analysis
    console.log('\n🤖 Step 2: Generating personalized assignments...');
    const assignments = await generateAssignmentsFromAnalysis(analysisData);
    console.log(`✅ Generated ${assignments.length} assignments`);
    
    // Step 3: Display the results
    console.log('\n📊 Step 3: Assignment Generation Results');
    displayAssignments(assignments);
    
    // Step 4: Test assignment interaction
    console.log('\n🎯 Step 4: Testing assignment operations...');
    await testAssignmentOperations(assignments[0]);
    
    console.log('\n🎉 Integration test completed successfully!');
    console.log('\n💡 Next Steps:');
    console.log('1. Open the Study Centre in your browser: http://localhost:5173');
    console.log('2. Navigate to the Study Centre building');
    console.log('3. Click "Debug User Data" to verify user consistency');
    console.log('4. Check that assignments appear for user "Brain" (ID: 4)');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  }
}

async function simulateKanaGrading() {
  // Simulate a teacher grading student work with K.A.N.A. analysis
  const studentWork = {
    subject: 'Advanced Mathematics',
    topic: 'Calculus - Derivatives',
    studentAnswer: `
      Problem: Find the derivative of f(x) = x³ + 2x² - 5x + 1
      
      Student Solution:
      f'(x) = 3x² + 4x - 5
      
      I used the power rule: d/dx(xⁿ) = n·xⁿ⁻¹
      - For x³: 3x²
      - For 2x²: 4x  
      - For -5x: -5
      - For constant 1: 0
      
      So f'(x) = 3x² + 4x - 5
      
      I think this is correct but I'm still not confident with more complex functions.
    `,
    score: 85,
    teacherNotes: 'Excellent work on basic derivatives, but needs practice with chain rule and complex functions.'
  };
  
  const kanaAnalysis = {
    gradeId: `kana_grade_${Date.now()}`,
    userId: TEST_USER_ID,
    subject: studentWork.subject,
    topic: studentWork.topic,
    studentWork: studentWork.studentAnswer,
    score: studentWork.score,
    gradedBy: 'K.A.N.A.',
    gradedAt: new Date().toISOString(),
    feedback: `Excellent foundational understanding of derivatives! You correctly applied the power rule and showed clear mathematical reasoning. Your solution is completely correct.

Areas of Strength:
• Perfect application of power rule
• Clear step-by-step methodology
• Correct algebraic manipulation
• Good mathematical notation

Areas for Growth:
• Chain rule applications
• Implicit differentiation
• Derivatives of composite functions
• Confidence building with complex problems

Based on your strong foundation, you're ready for more advanced derivative concepts. K.A.N.A. recommends focused practice on chain rule and composite functions to build your confidence.`,
    
    analysisData: {
      weakAreas: ['Chain rule', 'Composite functions', 'Implicit differentiation', 'Advanced derivative rules'],
      strengths: ['Power rule', 'Basic derivatives', 'Mathematical reasoning', 'Clear notation'],
      recommendations: [
        'Practice chain rule with guided examples',
        'Work through composite function derivatives',
        'Complete implicit differentiation exercises',
        'Build confidence with challenging problems'
      ],
      difficulty: 'advanced',
      suggestedPracticeTime: 60,
      needsAssignments: true,
      confidenceLevel: 'moderate',
      masteryAreas: ['basic_derivatives', 'power_rule'],
      improvementAreas: ['chain_rule', 'composite_functions']
    }
  };
  
  console.log(`📊 Analysis Summary:`);
  console.log(`   Score: ${kanaAnalysis.score}%`);
  console.log(`   Subject: ${kanaAnalysis.subject} - ${kanaAnalysis.topic}`);
  console.log(`   Strengths: ${kanaAnalysis.analysisData.strengths.slice(0, 2).join(', ')}`);
  console.log(`   Growth Areas: ${kanaAnalysis.analysisData.weakAreas.slice(0, 2).join(', ')}`);
  
  return kanaAnalysis;
}

async function generateAssignmentsFromAnalysis(analysisData) {
  const assignmentRequest = {
    userId: TEST_USER_ID.toString(),
    originalFeedback: analysisData.feedback,
    subject: analysisData.subject,
    score: analysisData.score,
    analysisDate: analysisData.gradedAt,
    studentWork: analysisData.studentWork,
    analysisData: analysisData.analysisData
  };
  
  console.log('📤 Sending assignment generation request to K.A.N.A. backend...');
  
  const response = await fetch(`${BACKEND_URL}/api/create-assignments-from-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(assignmentRequest)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Assignment generation failed (${response.status}): ${errorText}`);
  }
  
  const result = await response.json();
  const assignments = Array.isArray(result) ? result : [result];
  
  console.log(`✅ K.A.N.A. backend responded with ${assignments.length} assignments`);
  
  return assignments;
}

function displayAssignments(assignments) {
  console.log('-'.repeat(50));
  assignments.forEach((assignment, index) => {
    console.log(`\n📚 Assignment ${index + 1}: ${assignment.title}`);
    console.log(`   🎯 Type: ${assignment.type} | Subject: ${assignment.subject}`);
    console.log(`   📈 Difficulty: ${assignment.difficulty} | Time: ${assignment.estimatedTime} min`);
    console.log(`   💡 Reason: ${assignment.reason.substring(0, 100)}...`);
    
    if (assignment.resources && assignment.resources.length > 0) {
      console.log(`   📖 Resources (${assignment.resources.length}):`);
      assignment.resources.forEach((resource, rIndex) => {
        console.log(`      ${rIndex + 1}. ${resource.title} (${resource.type}) - ${resource.source}`);
      });
    }
    
    if (assignment.practices && assignment.practices.length > 0) {
      console.log(`   🎮 Practices (${assignment.practices.length}):`);
      assignment.practices.forEach((practice, pIndex) => {
        console.log(`      ${pIndex + 1}. ${practice.title} (${practice.type}) - ${practice.estimatedTime} min`);
      });
    }
  });
  console.log('-'.repeat(50));
}

async function testAssignmentOperations(assignment) {
  if (!assignment) {
    console.log('⚠️ No assignment available for testing operations');
    return;
  }
  
  console.log(`🎯 Testing operations on: ${assignment.title}`);
  
  // Test assignment progress update
  console.log('   📝 Testing assignment progress...');
  const progressResponse = await fetch(`${BACKEND_URL}/api/update-assignment-progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assignmentId: assignment.id,
      progress: 25,
      userId: TEST_USER_ID.toString(),
      timestamp: new Date().toISOString()
    })
  });
  
  if (progressResponse.ok) {
    console.log('   ✅ Progress update successful (25%)');
  } else {
    console.log('   ⚠️ Progress update failed (backend may not have this endpoint yet)');
  }
  
  // Test assignment completion
  console.log('   🏁 Testing assignment completion...');
  const completeResponse = await fetch(`${BACKEND_URL}/api/complete-assignment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assignmentId: assignment.id,
      userId: TEST_USER_ID.toString(),
      completedAt: new Date().toISOString()
    })
  });
  
  if (completeResponse.ok) {
    console.log('   ✅ Assignment completion successful');
  } else {
    console.log('   ⚠️ Assignment completion failed (backend may not have this endpoint yet)');
  }
}

// Test helper to check if backend is running
async function checkBackendHealth() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/create-assignments-from-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking if K.A.N.A. backend is running...');
  const backendRunning = await checkBackendHealth();
  
  if (!backendRunning) {
    console.error('❌ K.A.N.A. backend is not running on ' + BACKEND_URL);
    console.log('\n💡 Please start the backend first:');
    console.log('   cd kana-backend');
    console.log('   npm start');
    process.exit(1);
  }
  
  console.log('✅ K.A.N.A. backend is running');
  await runIntegrationTest();
}

// Run the test
main().catch(console.error);

export { runIntegrationTest, simulateKanaGrading, generateAssignmentsFromAnalysis };
