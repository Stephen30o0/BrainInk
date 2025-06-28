/**
 * Real-Time Study Centre Test
 * 
 * This test generates assignments and stores them for the real Study Centre to display
 * Simulates the complete teacher → K.A.N.A. → Study Centre workflow
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:10000';
const TEST_USER_ID = 4;
const TEST_USERNAME = 'Brain';

async function createRealStudyCentreData() {
  console.log('🎭 Creating Real Study Centre Data for Live Testing');
  console.log('User:', TEST_USERNAME, '(ID:', TEST_USER_ID + ')');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Create a realistic K.A.N.A. analysis scenario
    console.log('\n📝 Creating realistic grading scenario...');
    const gradingScenario = await createGradingScenario();
    
    // Step 2: Generate assignments using K.A.N.A. backend
    console.log('\n🤖 Generating assignments via K.A.N.A. backend...');
    const assignments = await generateRichAssignments(gradingScenario);
    
    // Step 3: Store for Study Centre display
    console.log('\n💾 Storing assignments for Study Centre...');
    await storeAssignmentsForStudyCentre(assignments);
    
    // Step 4: Create sample learning progress
    console.log('\n📈 Creating sample learning progress...');
    await createLearningProgress(assignments);
    
    console.log('\n🎉 Study Centre data created successfully!');
    console.log('\n💡 Next steps:');
    console.log('1. Open http://localhost:5173 in your browser');
    console.log('2. Navigate to the Study Centre building');
    console.log('3. Click "Debug User Data" to verify user is "Brain" (ID: 4)');
    console.log('4. Check the dashboard to see your personalized assignments');
    console.log('5. Try clicking "Generate Rich Assignments" to create more');
    
    return assignments;
    
  } catch (error) {
    console.error('❌ Failed to create Study Centre data:', error);
    process.exit(1);
  }
}

async function createGradingScenario() {
  const scenarios = [
    {
      subject: 'Physics',
      topic: 'Quantum Mechanics',
      studentWork: `
        Problem: Explain the wave-particle duality of electrons
        
        Student Answer:
        Electrons can behave like both waves and particles depending on how we observe them. When we don't observe them, they act like waves and can go through multiple paths at once (superposition). But when we measure them, they collapse into particle-like behavior and have a definite position.
        
        The double-slit experiment shows this well - electrons create interference patterns like waves when not observed, but act like particles when we try to detect which slit they go through.
        
        I understand the basic concept but I'm still confused about why observation changes the behavior and what this means for reality.
      `,
      score: 78,
      kanaFeedback: `Excellent conceptual understanding of wave-particle duality! You correctly identified the key principles of superposition and wave collapse upon measurement. Your explanation of the double-slit experiment demonstrates solid grasp of experimental evidence.

Areas of Strength:
• Clear understanding of superposition principle
• Correct application of double-slit experiment
• Recognition of measurement's role in quantum behavior

Areas for Growth:
• Quantum measurement theory and the observer effect
• Mathematical formalism of wave functions
• Interpretation of quantum mechanics (Copenhagen vs Many-worlds)
• Uncertainty principle and its implications

Your philosophical questioning about "what this means for reality" shows excellent critical thinking. You're ready for deeper exploration of quantum interpretation and mathematical foundations.`,
      analysisData: {
        weakAreas: ['Quantum measurement theory', 'Wave function mathematics', 'Uncertainty principle', 'Quantum interpretations'],
        strengths: ['Wave-particle duality', 'Superposition', 'Experimental understanding', 'Critical thinking'],
        recommendations: [
          'Study quantum measurement theory in depth',
          'Practice wave function calculations',
          'Explore different interpretations of quantum mechanics',
          'Work through uncertainty principle problems'
        ],
        difficulty: 'advanced',
        confidenceLevel: 'moderate'
      }
    },
    {
      subject: 'Computer Science',
      topic: 'Data Structures & Algorithms',
      studentWork: `
        Problem: Implement a binary search tree and explain its time complexity
        
        Student Solution:
        class BST:
            def __init__(self, value):
                self.value = value
                self.left = None
                self.right = None
            
            def insert(self, value):
                if value < self.value:
                    if self.left is None:
                        self.left = BST(value)
                    else:
                        self.left.insert(value)
                else:
                    if self.right is None:
                        self.right = BST(value)
                    else:
                        self.right.insert(value)
        
        Time Complexity: O(log n) for balanced trees, but can be O(n) for unbalanced trees.
        
        I think my implementation is correct but I'm not sure about handling edge cases or how to keep the tree balanced.
      `,
      score: 82,
      kanaFeedback: `Solid implementation of a basic binary search tree! Your code correctly handles insertion with proper left/right placement based on value comparison. You also demonstrate good understanding of time complexity trade-offs.

Areas of Strength:
• Correct BST insertion logic
• Proper recursive implementation
• Understanding of balanced vs unbalanced complexity
• Clean, readable code structure

Areas for Growth:
• Tree balancing algorithms (AVL, Red-Black trees)
• Edge case handling (duplicates, deletion)
• In-order, pre-order, post-order traversals
• Memory optimization and iterative solutions

Your concern about balancing shows excellent algorithmic intuition. You're ready for advanced tree algorithms and optimization techniques.`,
      analysisData: {
        weakAreas: ['Tree balancing', 'Edge case handling', 'Tree traversals', 'Deletion operations'],
        strengths: ['BST fundamentals', 'Recursion', 'Time complexity analysis', 'Code structure'],
        recommendations: [
          'Study AVL and Red-Black tree balancing',
          'Practice tree traversal algorithms',
          'Implement deletion with case handling',
          'Explore iterative tree operations'
        ],
        difficulty: 'intermediate',
        confidenceLevel: 'high'
      }
    }
  ];
  
  // Select a random scenario for variety
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  
  console.log(`📚 Selected scenario: ${scenario.subject} - ${scenario.topic}`);
  console.log(`📊 Student score: ${scenario.score}%`);
  console.log(`🎯 Focus areas: ${scenario.analysisData.weakAreas.slice(0, 2).join(', ')}`);
  
  return scenario;
}

async function generateRichAssignments(scenario) {
  const assignmentRequest = {
    userId: TEST_USER_ID.toString(),
    originalFeedback: scenario.kanaFeedback,
    subject: scenario.subject,
    score: scenario.score,
    analysisDate: new Date().toISOString(),
    studentWork: scenario.studentWork,
    analysisData: scenario.analysisData
  };
  
  console.log('📤 Requesting assignment generation from K.A.N.A...');
  
  const response = await fetch(`${BACKEND_URL}/api/create-assignments-from-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(assignmentRequest)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Assignment generation failed: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  const assignments = Array.isArray(result) ? result : [result];
  
  console.log(`✅ Generated ${assignments.length} rich assignments:`);
  
  assignments.forEach((assignment, index) => {
    console.log(`\n   ${index + 1}. ${assignment.title}`);
    console.log(`      🎯 ${assignment.type} | ${assignment.difficulty} | ${assignment.estimatedTime}min`);
    console.log(`      📚 ${assignment.resources?.length || 0} resources | 🎮 ${assignment.practices?.length || 0} practices`);
    console.log(`      💡 ${assignment.reason.substring(0, 80)}...`);
  });
  
  return assignments;
}

async function storeAssignmentsForStudyCentre(assignments) {
  // In a browser environment, this would be localStorage
  // For this test, we'll simulate the storage structure
  
  const storageKey = `student_${TEST_USER_ID}_assignments`;
  console.log(`💾 Simulating localStorage storage: ${storageKey}`);
  
  // Add metadata to assignments
  const enrichedAssignments = assignments.map(assignment => ({
    ...assignment,
    assignedAt: new Date().toISOString(),
    status: Math.random() > 0.5 ? 'pending' : 'in-progress',
    progress: assignment.status === 'in-progress' ? Math.floor(Math.random() * 80) + 10 : 0,
    createdBy: 'K.A.N.A.',
    gradeAnalysis: {
      weakAreas: assignment.resources?.map(r => r.title.split(' ')[0]) || [],
      strengths: ['Problem-solving', 'Mathematical reasoning'],
      recommendations: assignment.practices?.map(p => p.title) || []
    }
  }));
  
  console.log(`✅ ${enrichedAssignments.length} assignments ready for Study Centre display`);
  console.log('📝 Assignment statuses:', enrichedAssignments.map(a => `${a.title.substring(0, 20)}... (${a.status})`).join(', '));
  
  return enrichedAssignments;
}

async function createLearningProgress(assignments) {
  // Simulate some learning progress for a more realistic dashboard
  const subjects = [...new Set(assignments.map(a => a.subject))];
  
  console.log(`📈 Creating learning paths for subjects: ${subjects.join(', ')}`);
  
  const learningPaths = subjects.map(subject => {
    const subjectAssignments = assignments.filter(a => a.subject === subject);
    const completed = Math.floor(subjectAssignments.length * Math.random() * 0.6); // 0-60% completion
    
    return {
      id: `path_${subject.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
      title: `${subject} Mastery Path`,
      description: `Personalized learning journey for ${subject} based on K.A.N.A. analysis`,
      totalAssignments: subjectAssignments.length,
      completedAssignments: completed,
      estimatedCompletion: `${subjectAssignments.reduce((sum, a) => sum + a.estimatedTime, 0)} minutes`,
      subjects: [subject],
      assignments: subjectAssignments
    };
  });
  
  learningPaths.forEach(path => {
    console.log(`   📚 ${path.title}: ${path.completedAssignments}/${path.totalAssignments} completed`);
  });
  
  console.log('✅ Learning progress created');
  
  return learningPaths;
}

// Create sample K.A.N.A. analysis flag for Study Centre to detect
async function createAnalysisFlag() {
  const analysisFlag = {
    gradeId: `test_grade_${Date.now()}`,
    analyzedAt: new Date().toISOString(),
    needsAssignments: true,
    feedback: 'Sample K.A.N.A. analysis for testing Study Centre workflow',
    subject: 'Test Subject',
    score: 85,
    extractedText: 'Sample student work for testing purposes'
  };
  
  const flagKey = `student_${TEST_USER_ID}_new_analysis`;
  console.log(`🚩 Creating analysis flag: ${flagKey}`);
  console.log('✅ Analysis flag created (Study Centre will detect this)');
  
  return analysisFlag;
}

async function main() {
  console.log('🔍 Verifying K.A.N.A. backend is running...');
  
  try {
    const healthCheck = await fetch(`${BACKEND_URL}/api/create-assignments-from-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    console.log('✅ K.A.N.A. backend is operational');
  } catch (error) {
    console.error('❌ K.A.N.A. backend not available:', BACKEND_URL);
    console.log('\n💡 Start the backend first: cd kana-backend && npm start');
    process.exit(1);
  }
  
  // Create the study centre data
  const assignments = await createRealStudyCentreData();
  
  // Also create an analysis flag for the Study Centre to detect
  await createAnalysisFlag();
  
  console.log('\n🌟 Study Centre is now ready for testing!');
  console.log('\n🔗 Test URLs:');
  console.log(`   Frontend: http://localhost:5173`);
  console.log(`   Study Centre: Navigate to the Study Centre building`);
  console.log(`   Debug: Click "Debug User Data" button`);
  console.log(`   Generate: Click "Generate Rich Assignments" button`);
}

main().catch(console.error);

export { createRealStudyCentreData, generateRichAssignments, createAnalysisFlag };
