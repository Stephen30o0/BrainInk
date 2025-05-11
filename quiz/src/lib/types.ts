export interface Message {
  id: string;
  sender: 'user' | 'kana';
  content: string | React.ReactNode;
  timestamp: number;
  type: 'text' | 'quiz-start' | 'quiz-question' | 'quiz-result' | 'past-paper' | 'pdf';
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
  question: string;
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