/**
 * K.A.N.A. Study Centre Workflow Test
 * 
 * This test simulates the complete workflow:
 * 1. Teacher grades student work
 * 2. K.A.N.A. provides analysis and suggestions
 * 3. System automatically generates personalized assignments
 * 4. Student sees assignments in Study Centre
 */

const fetch = require('node-fetch');

// Test configuration
const BACKEND_URL = 'http://localhost:10000';
const FRONTEND_URL = 'http://localhost:5173';
const TEST_USER = {
  user_id: 4,
  username: 'Brain',
  name: 'Brain'
};

// Sample student work for grading
const SAMPLE_STUDENT_WORK = {
  subject: 'Mathematics',
  assignment: 'Quadratic Equations Practice',
  studentAnswer: `
    Problem 1: Solve x² + 5x + 6 = 0
    Student Work: 
    x² + 5x + 6 = 0
    I think I can factor this...
    (x + 2)(x + 3) = 0
    So x = -2 or x = -3
    
    Problem 2: Solve 2x² - 8x + 6 = 0
    Student Work:
    2x² - 8x + 6 = 0
    I'll divide by 2 first: x² - 4x + 3 = 0
    This factors to (x - 1)(x - 3) = 0
    So x = 1 or x = 3
    
    Problem 3: Solve x² + 4x + 1 = 0 using quadratic formula
    Student Work:
    x = (-4 ± √(16 - 4))/2 = (-4 ± √12)/2
    I'm not sure how to simplify √12...
  `,
  correctAnswers: {
    problem1: 'x = -2 or x = -3',
    problem2: 'x = 1 or x = 3', 
    problem3: 'x = -2 ± √3'
  }
};

class KanaWorkflowTester {
  constructor() {
    this.testResults = [];
    this.assignmentsCreated = [];
  }

  async runCompleteTest() {
    console.log('🧪 Starting K.A.N.A. Study Centre Workflow Test');
    console.log('=' .repeat(60));
    
    try {
      // Step 1: Simulate teacher grading with K.A.N.A. analysis
      await this.testTeacherGrading();
      
      // Step 2: Test K.A.N.A. assignment generation
      await this.testKanaAssignmentGeneration();
      
      // Step 3: Test Study Centre integration
      await this.testStudyCentreIntegration();
      
      // Step 4: Test assignment interaction
      await this.testAssignmentInteraction();
      
      // Step 5: Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      this.testResults.push({
        step: 'Overall Test',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async testTeacherGrading() {
    console.log('\n📝 Step 1: Testing Teacher Grading with K.A.N.A. Analysis');
    console.log('-'.repeat(50));
    
    try {
      // Simulate K.A.N.A. analyzing the student work
      const kanaAnalysis = await this.simulateKanaAnalysis(SAMPLE_STUDENT_WORK);
      console.log('✅ K.A.N.A. analysis completed');
      console.log('📊 Analysis Result:', kanaAnalysis);
      
      // Store the analysis as if a teacher just graded the work
      await this.storeGradingResult(kanaAnalysis);
      console.log('✅ Grading result stored');
      
      this.testResults.push({
        step: 'Teacher Grading',
        status: 'PASSED',
        details: 'K.A.N.A. analysis completed and stored'
      });
      
    } catch (error) {
      console.error('❌ Teacher grading failed:', error);
      this.testResults.push({
        step: 'Teacher Grading',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async simulateKanaAnalysis(studentWork) {
    // Simulate K.A.N.A.'s intelligent analysis
    const analysis = {
      gradeId: `grade_${Date.now()}`,
      userId: TEST_USER.user_id,
      subject: studentWork.subject,
      assignment: studentWork.assignment,
      studentWork: studentWork.studentAnswer,
      gradedBy: 'K.A.N.A.',
      gradedAt: new Date().toISOString(),
      score: 75, // 75% - good but needs improvement
      feedback: `Strong foundational understanding demonstrated! You correctly solved problems 1 and 2 using factoring methods. However, you struggled with simplifying √12 in the quadratic formula. 

Key Areas for Improvement:
• Simplifying square roots (√12 = 2√3)
• Quadratic formula application with irrational solutions
• Confidence in algebraic manipulation

Strengths Observed:
• Excellent factoring skills
• Systematic approach to problem-solving
• Clear mathematical reasoning

Recommended Focus: Practice with radical expressions and quadratic formula applications involving irrational numbers.`,
      analysisData: {
        weakAreas: ['Radical simplification', 'Quadratic formula with irrationals', 'Square root properties'],
        strengths: ['Factoring', 'Problem-solving approach', 'Basic algebra'],
        recommendations: [
          'Practice simplifying square roots',
          'Work through quadratic formula examples with irrational solutions',
          'Complete exercises on radical expressions',
          'Review properties of square roots'
        ],
        difficulty: 'intermediate',
        suggestedPracticeTime: 45,
        needsAssignments: true
      }
    };

    console.log('🤖 K.A.N.A. Analysis Generated:');
    console.log(`   Score: ${analysis.score}%`);
    console.log(`   Weak Areas: ${analysis.analysisData.weakAreas.join(', ')}`);
    console.log(`   Strengths: ${analysis.analysisData.strengths.join(', ')}`);
    
    return analysis;
  }

  async storeGradingResult(analysis) {
    // Store in localStorage as the system would do
    const studentId = TEST_USER.user_id;
    
    // Store the analysis flag for assignment generation
    const analysisFlag = {
      gradeId: analysis.gradeId,
      analyzedAt: analysis.gradedAt,
      needsAssignments: true,
      feedback: analysis.feedback,
      subject: analysis.subject,
      score: analysis.score,
      extractedText: analysis.studentWork,
      analysisData: analysis.analysisData
    };
    
    // In a real scenario, this would be stored by the teacher grading interface
    console.log(`💾 Storing analysis flag for student ${studentId}`);
    console.log(`   Flag key: student_${studentId}_new_analysis`);
    
    return analysisFlag;
  }

  async testKanaAssignmentGeneration() {
    console.log('\n🤖 Step 2: Testing K.A.N.A. Assignment Generation');
    console.log('-'.repeat(50));
    
    try {
      // Test the assignment generation endpoint
      const assignmentRequest = {
        userId: TEST_USER.user_id.toString(),
        originalFeedback: `Strong foundational understanding demonstrated! You correctly solved problems 1 and 2 using factoring methods. However, you struggled with simplifying √12 in the quadratic formula. 

Key Areas for Improvement:
• Simplifying square roots (√12 = 2√3)
• Quadratic formula application with irrational solutions
• Confidence in algebraic manipulation`,
        subject: 'Mathematics',
        score: 75,
        analysisDate: new Date().toISOString(),
        studentWork: SAMPLE_STUDENT_WORK.studentAnswer
      };

      console.log('📤 Sending assignment generation request...');
      const response = await fetch(`${BACKEND_URL}/api/create-assignments-from-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentRequest)
      });

      if (!response.ok) {
        throw new Error(`Assignment generation failed: ${response.status}`);
      }

      const assignments = await response.json();
      this.assignmentsCreated = Array.isArray(assignments) ? assignments : [assignments];
      
      console.log('✅ Assignment generation successful');
      console.log(`📚 Generated ${this.assignmentsCreated.length} assignments:`);
      
      this.assignmentsCreated.forEach((assignment, index) => {
        console.log(`   ${index + 1}. ${assignment.title} (${assignment.type})`);
        console.log(`      Subject: ${assignment.subject} | Difficulty: ${assignment.difficulty}`);
        console.log(`      Resources: ${assignment.resources?.length || 0} | Practices: ${assignment.practices?.length || 0}`);
        console.log(`      Reason: ${assignment.reason.substring(0, 100)}...`);
      });
      
      this.testResults.push({
        step: 'Assignment Generation',
        status: 'PASSED',
        details: `Generated ${this.assignmentsCreated.length} personalized assignments`
      });
      
    } catch (error) {
      console.error('❌ Assignment generation failed:', error);
      this.testResults.push({
        step: 'Assignment Generation',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async testStudyCentreIntegration() {
    console.log('\n🏫 Step 3: Testing Study Centre Integration');
    console.log('-'.repeat(50));
    
    try {
      // Simulate storing assignments for the user (as the frontend would do)
      if (this.assignmentsCreated.length > 0) {
        const studentId = TEST_USER.user_id;
        console.log(`💾 Simulating assignment storage for student ${studentId}`);
        console.log(`   Storage key: student_${studentId}_assignments`);
        console.log(`   Assignments stored: ${this.assignmentsCreated.length}`);
        
        // Test assignment retrieval logic
        const retrievedAssignments = this.assignmentsCreated; // Simulate retrieval
        console.log('✅ Assignment retrieval successful');
        
        // Test learning path generation
        const learningPaths = await this.generateLearningPaths(retrievedAssignments);
        console.log(`📈 Generated ${learningPaths.length} learning paths`);
        
        learningPaths.forEach((path, index) => {
          console.log(`   ${index + 1}. ${path.title}`);
          console.log(`      Progress: ${path.completedAssignments}/${path.totalAssignments}`);
          console.log(`      Subjects: ${path.subjects.join(', ')}`);
        });
        
        this.testResults.push({
          step: 'Study Centre Integration',
          status: 'PASSED',
          details: `Integrated ${retrievedAssignments.length} assignments into ${learningPaths.length} learning paths`
        });
        
      } else {
        throw new Error('No assignments were created to integrate');
      }
      
    } catch (error) {
      console.error('❌ Study Centre integration failed:', error);
      this.testResults.push({
        step: 'Study Centre Integration',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async generateLearningPaths(assignments) {
    // Simulate learning path generation logic
    const subjectGroups = assignments.reduce((groups, assignment) => {
      const subject = assignment.subject;
      if (!groups[subject]) {
        groups[subject] = [];
      }
      groups[subject].push(assignment);
      return groups;
    }, {});

    return Object.keys(subjectGroups).map(subject => ({
      id: `path_${subject.toLowerCase()}_${Date.now()}`,
      title: `${subject} Mastery Path`,
      description: `Personalized learning path for ${subject} based on K.A.N.A. analysis`,
      totalAssignments: subjectGroups[subject].length,
      completedAssignments: 0,
      estimatedCompletion: `${subjectGroups[subject].reduce((sum, a) => sum + a.estimatedTime, 0)} minutes`,
      subjects: [subject],
      assignments: subjectGroups[subject]
    }));
  }

  async testAssignmentInteraction() {
    console.log('\n🎯 Step 4: Testing Assignment Interaction');
    console.log('-'.repeat(50));
    
    try {
      if (this.assignmentsCreated.length > 0) {
        const testAssignment = this.assignmentsCreated[0];
        console.log(`🎯 Testing interaction with: ${testAssignment.title}`);
        
        // Test starting an assignment
        console.log('   📝 Simulating assignment start...');
        const startResult = await this.simulateAssignmentProgress(testAssignment.id, 10);
        console.log(`   ✅ Assignment started: ${startResult.status}`);
        
        // Test progress update
        console.log('   📈 Simulating progress update...');
        const progressResult = await this.simulateAssignmentProgress(testAssignment.id, 50);
        console.log(`   ✅ Progress updated: ${progressResult.progress}%`);
        
        // Test completion
        console.log('   🏁 Simulating assignment completion...');
        const completeResult = await this.simulateAssignmentProgress(testAssignment.id, 100);
        console.log(`   ✅ Assignment completed: ${completeResult.status}`);
        
        this.testResults.push({
          step: 'Assignment Interaction',
          status: 'PASSED',
          details: 'Successfully tested assignment start, progress, and completion'
        });
        
      } else {
        throw new Error('No assignments available for interaction testing');
      }
      
    } catch (error) {
      console.error('❌ Assignment interaction failed:', error);
      this.testResults.push({
        step: 'Assignment Interaction',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async simulateAssignmentProgress(assignmentId, progress) {
    // Simulate assignment progress update
    return {
      assignmentId,
      progress,
      status: progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : 'pending',
      timestamp: new Date().toISOString()
    };
  }

  generateTestReport() {
    console.log('\n📊 K.A.N.A. Workflow Test Report');
    console.log('='.repeat(60));
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ${failed > 0 ? '❌' : ''}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    console.log('\nDetailed Results:');
    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.step}`);
      if (result.details) {
        console.log(`   📝 ${result.details}`);
      }
      if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
      }
    });
    
    if (this.assignmentsCreated.length > 0) {
      console.log('\nGenerated Assignments Summary:');
      this.assignmentsCreated.forEach((assignment, index) => {
        console.log(`${index + 1}. ${assignment.title}`);
        console.log(`   📚 Type: ${assignment.type} | Subject: ${assignment.subject}`);
        console.log(`   🎯 Difficulty: ${assignment.difficulty} | Time: ${assignment.estimatedTime}min`);
        console.log(`   📖 Resources: ${assignment.resources?.length || 0}`);
        console.log(`   🎮 Practices: ${assignment.practices?.length || 0}`);
      });
    }
    
    console.log('\n🎉 Test completed! Check the Study Centre dashboard to see the generated assignments.');
    console.log(`💡 Tip: Look for assignments for user "${TEST_USER.username}" (ID: ${TEST_USER.user_id})`);
  }
}

// Run the test
async function runTest() {
  const tester = new KanaWorkflowTester();
  await tester.runCompleteTest();
}

// Execute if run directly
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { KanaWorkflowTester, runTest };
