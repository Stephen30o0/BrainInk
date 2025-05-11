import React from 'react';
import { Quiz } from '../../lib/types';
export interface QuizCategory {
  subject: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  topics: string[];
  timeOptions: number[]; // in minutes
  years: number[];
}
export const quizCategories: QuizCategory[] = [{
  subject: 'Mathematics',
  level: 'Beginner',
  topics: ['Algebra', 'Geometry', 'Trigonometry', 'Calculus'],
  timeOptions: [5, 10, 15, 30],
  years: [2023, 2022, 2021, 2020]
}, {
  subject: 'Physics',
  level: 'Intermediate',
  topics: ["Newton's Laws", 'Thermodynamics', 'Waves', 'Electricity'],
  timeOptions: [10, 20, 30, 45],
  years: [2023, 2022, 2021, 2020]
}
// Add more subjects
];
// Update quiz data structure
export const quizzes: Quiz[] = [{
  id: 'q1',
  title: 'Basic Algebra',
  subject: 'Mathematics',
  topic: 'Algebra',
  level: 'Beginner',
  year: 2023,
  difficulty: 'easy',
  timeLimit: 300,
  questions: [{
    id: 'q1-1',
    question: 'Solve for x: 2x + 5 = 15',
    options: ['x = 5', 'x = 7', 'x = 10', 'x = 3'],
    correctAnswer: 0,
    explanation: '2x + 5 = 15\n2x = 15 - 5\n2x = 10\nx = 5',
    type: 'multiple-choice'
  }, {
    id: 'q1-2',
    question: 'If y = 3x - 4, and x = 2, what is the value of y?',
    options: ['y = 2', 'y = 8', 'y = 6', 'y = 10'],
    correctAnswer: 1,
    explanation: 'y = 3x - 4\ny = 3(2) - 4\ny = 6 - 4\ny = 2',
    type: 'multiple-choice'
  }, {
    id: 'q1-3',
    question: 'Simplify: (3x² + 2x - 1) - (x² - 3x + 4)',
    options: ['2x² + 5x - 5', '4x² - x - 5', '2x² + 5x - 5', '4x² - x + 3'],
    correctAnswer: 0,
    explanation: '(3x² + 2x - 1) - (x² - 3x + 4)\n= 3x² + 2x - 1 - x² + 3x - 4\n= 2x² + 5x - 5',
    type: 'multiple-choice'
  }]
}, {
  id: 'q2',
  title: "Physics: Newton's Laws",
  subject: 'Physics',
  level: 'Intermediate',
  year: 2023,
  difficulty: 'medium',
  timeLimit: 240,
  questions: [{
    id: 'q2-1',
    question: "Which of Newton's laws states that an object at rest stays at rest unless acted upon by an external force?",
    options: ['First law', 'Second law', 'Third law', 'Fourth law'],
    correctAnswer: 0,
    explanation: "Newton's First Law of Motion (Law of Inertia) states that an object at rest stays at rest and an object in motion stays in motion with the same speed and direction unless acted upon by an unbalanced force.",
    type: 'multiple-choice'
  }, {
    id: 'q2-2',
    question: 'A 5 kg object experiences a net force of 20 N. What is its acceleration?',
    options: ['4 m/s²', '5 m/s²', '100 m/s²', '0.25 m/s²'],
    correctAnswer: 0,
    explanation: "Using Newton's Second Law: F = ma\n20 N = 5 kg × a\na = 20 N ÷ 5 kg = 4 m/s²",
    type: 'multiple-choice'
  }, {
    id: 'q2-3',
    question: "Explain the concept of action-reaction pairs as described in Newton's Third Law.",
    correctAnswer: "Newton's Third Law states that for every action, there is an equal and opposite reaction. When one object exerts a force on a second object, the second object exerts an equal force in the opposite direction on the first object. These forces act on different objects and occur simultaneously.",
    explanation: "Newton's Third Law states that for every action, there is an equal and opposite reaction. The forces always come in pairs - equal in magnitude and opposite in direction. These forces act on different objects and occur simultaneously.",
    type: 'theoretical'
  }]
}, {
  id: 'q3',
  title: 'Cell Biology Basics',
  subject: 'Biology',
  level: 'Intermediate',
  year: 2023,
  difficulty: 'medium',
  timeLimit: 360,
  questions: [{
    id: 'q3-1',
    question: "Which organelle is known as the 'powerhouse of the cell'?",
    options: ['Nucleus', 'Mitochondria', 'Golgi apparatus', 'Endoplasmic reticulum'],
    correctAnswer: 1,
    explanation: "Mitochondria are often called the 'powerhouse of the cell' because they generate most of the cell's supply of adenosine triphosphate (ATP), which is used as a source of chemical energy.",
    type: 'multiple-choice'
  }, {
    id: 'q3-2',
    question: 'What is the primary function of chloroplasts in plant cells?',
    options: ['Cell division', 'Protein synthesis', 'Photosynthesis', 'Waste removal'],
    correctAnswer: 2,
    explanation: 'Chloroplasts are organelles found in plant cells and algae that conduct photosynthesis, converting light energy into chemical energy stored in glucose or other compounds.',
    type: 'multiple-choice'
  }, {
    id: 'q3-3',
    question: 'Compare and contrast prokaryotic and eukaryotic cells in terms of structure and complexity.',
    correctAnswer: 'Prokaryotic cells are simpler, smaller, lack a nucleus and membrane-bound organelles. Eukaryotic cells are larger, more complex, have a true nucleus enclosed by a nuclear membrane, and contain various membrane-bound organelles like mitochondria, endoplasmic reticulum, and Golgi apparatus.',
    explanation: 'Prokaryotic cells (bacteria and archaea) are simpler, smaller (0.1-5 μm), lack a nucleus and membrane-bound organelles, have a single circular chromosome, and divide through binary fission. Eukaryotic cells (plants, animals, fungi, protists) are larger (10-100 μm), more complex, have a true nucleus enclosed by a nuclear membrane, contain various membrane-bound organelles, have multiple linear chromosomes, and divide through mitosis or meiosis.',
    type: 'theoretical'
  }]
}];
export default quizzes;