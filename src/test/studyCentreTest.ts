import { studyCentreService } from '../services/studyCentreService';

// Simple test script to verify Study Centre functionality
async function testStudyCentre() {
  console.log('🧪 Testing Study Centre Service...');
  
  try {
    // Test assignment generation
    console.log('📝 Testing assignment generation...');
    const assignments = await studyCentreService.generateKanaAssignments('1');
    console.log(`✅ Generated ${assignments.length} assignments:`, assignments);
    
    // Test learning path generation
    console.log('🛤️ Testing learning path generation...');
    const learningPaths = await studyCentreService.generateLearningPaths(assignments);
    console.log(`✅ Generated ${learningPaths.length} learning paths:`, learningPaths);
    
    if (assignments.length > 0) {
      // Test assignment progress update
      console.log('📊 Testing assignment progress update...');
      await studyCentreService.updateAssignmentProgress(assignments[0].id, 50);
      console.log('✅ Assignment progress updated successfully');
      
      // Test assignment completion
      console.log('✅ Testing assignment completion...');
      await studyCentreService.completeAssignment(assignments[0].id);
      console.log('✅ Assignment completed successfully');
    }
    
    console.log('🎉 All Study Centre tests passed!');
    
  } catch (error) {
    console.error('❌ Study Centre test failed:', error);
  }
}

// Run test when this file is imported or executed
testStudyCentre();

export { testStudyCentre };
