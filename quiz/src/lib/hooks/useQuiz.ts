import { useState, useCallback, useEffect } from 'react';
import { Quiz, QuizQuestion, QuizAttempt } from '../types';
import { v4 as uuidv4 } from 'uuid';
interface QuizState {
  quiz: Quiz | null;
  currentQuestionIndex: number;
  answers: Record<string, any>;
  isComplete: boolean;
  timeRemaining: number;
  status: 'idle' | 'active' | 'paused' | 'completed' | 'timeout';
}
export const useQuiz = () => {
  const [state, setState] = useState<QuizState>({
    quiz: null,
    currentQuestionIndex: 0,
    answers: {},
    isComplete: false,
    timeRemaining: 0,
    status: 'idle'
  });
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  // Initialize a new quiz session
  const startQuiz = useCallback((quiz: Quiz) => {
    setState({
      quiz,
      currentQuestionIndex: 0,
      answers: {},
      isComplete: false,
      timeRemaining: quiz.timeLimit,
      status: 'active'
    });
    // Save initial state to localStorage
    localStorage.setItem('currentQuiz', JSON.stringify({
      quizId: quiz.id,
      startTime: Date.now(),
      timeRemaining: quiz.timeLimit
    }));
  }, []);
  // Handle answer submission
  const submitAnswer = useCallback((answer: any) => {
    setState(prev => {
      if (!prev.quiz) return prev;
      const currentQuestion = prev.quiz.questions[prev.currentQuestionIndex];
      const newAnswers = {
        ...prev.answers,
        [currentQuestion.id]: answer
      };
      const isLastQuestion = prev.currentQuestionIndex === prev.quiz.questions.length - 1;
      if (isLastQuestion) {
        // Complete the quiz
        return {
          ...prev,
          answers: newAnswers,
          isComplete: true,
          status: 'completed'
        };
      }
      // Move to next question
      return {
        ...prev,
        answers: newAnswers,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      };
    });
  }, []);
  // Calculate quiz results
  const calculateResults = useCallback(() => {
    if (!state.quiz) return null;
    const totalQuestions = state.quiz.questions.length;
    let correctAnswers = 0;
    state.quiz.questions.forEach(question => {
      const userAnswer = state.answers[question.id];
      if (userAnswer === question.correctAnswer) {
        correctAnswers++;
      }
    });
    const score = Math.round(correctAnswers / totalQuestions * 100);
    return {
      id: uuidv4(),
      quizId: state.quiz.id,
      startTime: Date.now() - (state.quiz.timeLimit - state.timeRemaining) * 1000,
      endTime: Date.now(),
      answers: state.answers,
      score,
      completed: true,
      questions: state.quiz.questions,
      title: state.quiz.title
    };
  }, [state.quiz, state.answers, state.timeRemaining]);
  // Handle timer
  useEffect(() => {
    if (state.status === 'active' && state.timeRemaining > 0) {
      const interval = setInterval(() => {
        setState(prev => {
          const newTimeRemaining = prev.timeRemaining - 1;
          if (newTimeRemaining <= 0) {
            clearInterval(interval);
            return {
              ...prev,
              timeRemaining: 0,
              status: 'timeout'
            };
          }
          return {
            ...prev,
            timeRemaining: newTimeRemaining
          };
        });
      }, 1000);
      setTimer(interval);
      return () => clearInterval(interval);
    }
  }, [state.status]);
  // Handle cleanup
  useEffect(() => {
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [timer]);
  // Recovery from browser refresh
  useEffect(() => {
    const savedQuiz = localStorage.getItem('currentQuiz');
    const savedAnswers = localStorage.getItem('quizAnswers');
    if (savedQuiz && savedAnswers) {
      const {
        quizId,
        startTime,
        timeRemaining
      } = JSON.parse(savedQuiz);
      const answers = JSON.parse(savedAnswers);
      // Calculate elapsed time
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remainingTime = Math.max(timeRemaining - elapsedSeconds, 0);
      // Restore quiz state
      if (remainingTime > 0) {
        setState(prev => ({
          ...prev,
          answers,
          timeRemaining: remainingTime,
          status: 'active'
        }));
      }
    }
  }, []);
  return {
    currentQuestion: state.quiz ? state.quiz.questions[state.currentQuestionIndex] : null,
    questionNumber: state.currentQuestionIndex + 1,
    totalQuestions: state.quiz?.questions.length ?? 0,
    timeRemaining: state.timeRemaining,
    status: state.status,
    answers: state.answers,
    quiz: state.quiz,
    startQuiz,
    submitAnswer,
    calculateResults
  };
};