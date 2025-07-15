// Test localStorage grading functionality

console.log('🧪 Testing localStorage grading functionality...');

// Simulate saving a grade like the teacherService does
const testStudentId = 1;
const testGradeData = {
    title: 'Test Assignment',
    grade: 85,
    maxPoints: 100,
    feedback: 'Great work! Shows good understanding of the concepts.',
    gradingCriteria: [],
    extractedText: 'Student work content...',
    uploadDate: new Date().toISOString(),
    subject: 'Mathematics'
};

// Save the grade
const saved = localStorage.getItem(`student_${testStudentId}_grades`) || '[]';
console.log('Current saved grades:', saved);

const grades = JSON.parse(saved);
console.log('Parsed grades:', grades);

const newGrade = {
    id: Date.now().toString(),
    ...testGradeData,
    gradedBy: 'K.A.N.A.',
    gradedAt: new Date().toISOString()
};

grades.unshift(newGrade); // Add to beginning of array
console.log('New grades array:', grades);

// Save back to localStorage
localStorage.setItem(`student_${testStudentId}_grades`, JSON.stringify(grades));

// Verify it was saved
const verification = localStorage.getItem(`student_${testStudentId}_grades`);
console.log('Verification - saved grades:', verification);

// Test retrieving grades
const retrievedGrades = JSON.parse(verification || '[]');
console.log('Retrieved grades count:', retrievedGrades.length);
console.log('Latest grade:', retrievedGrades[0]);

console.log('✅ localStorage grading test completed');
