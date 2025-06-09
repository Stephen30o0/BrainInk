export interface Message {
  id: string;
  sender: 'user' | 'kana' | 'system';
  content: string | React.ReactNode;
  timestamp: number;
  type: 'text' | 'quiz-start' | 'quiz-question' | 'quiz-result' | 'past-paper' | 'pdf' | 'image_with_explanation' | 'typing' | 'mathematical_graph'; // Added image_with_explanation, typing, and mathematical_graph
  imageUrl?: string;      // Added for generated images
  explanation?: string;   // Added for image explanations
}
export interface Quiz {
  id: string;
  title: string;
  subject: string;
  questions: QuizQuestion[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // in seconds
}
export interface QuizQuestion {
  id: string;
  questionText: string; // Changed from 'question' to 'questionText'
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  type: 'multiple-choice' | 'theoretical';
}
export interface QuizAttempt {
  id: string;
  quizId: string;
  startTime: number;
  endTime?: number;
  answers: Record<string, string | number>;
  score?: number;
  completed: boolean;
}
export interface PastPaper {
  id: string;
  title: string;
  examBody: string;
  subject: string;
  year: number;
  pdfUrl: string;
  description: string;
  pages: number;
}

export interface Chat {
  id: number;
  title: string;
  subject: string;
}