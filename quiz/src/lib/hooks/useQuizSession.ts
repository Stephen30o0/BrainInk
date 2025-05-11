import { useState, useEffect, useCallback } from 'react';
import { Quiz, QuizQuestion, QuizAttempt } from '../types';
import { useTimer } from './useTimer';
import { v4 as uuidv4 } from 'uuid';
interface UseQuizSessionProps {
  onComplete: (attempt: QuizAttempt) => void;
  onTimeout: () => void;
}
export const useQuizSession = ({
  onComplete,
  onTimeout
}: UseQuizSessionProps) => {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const {
    timeLeft,
    formattedTime,
    start,
    reset,
    setTimeLeft
  } = useTimer({
    initialTime: currentQuiz?.timeLimit || 60,
    onTimeUp: onTimeout
  });
  const startQuiz = useCallback((quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setCurrentQuestion(0);
    setAnswers({});
    setIsCompleted(false);
    setSessionId(uuidv4());
    reset();
    setTimeLeft(quiz.timeLimit);
    start();
  }, [reset, setTimeLeft, start]);
  const submitAnswer = useCallback((questionId: string, answer: any) => {
    if (!currentQuiz || isCompleted) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    if (currentQuestion < currentQuiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Complete quiz
      const correctAnswers = currentQuiz.questions.reduce((acc, question) => {
        return acc + (answers[question.id] === question.correctAnswer ? 1 : 0);
      }, 0);
      const score = Math.round(correctAnswers / currentQuiz.questions.length * 100);
      const attempt: QuizAttempt = {
        id: uuidv4(),
        quizId: currentQuiz.id,
        startTime: Date.now() - (currentQuiz.timeLimit - timeLeft) * 1000,
        endTime: Date.now(),
        answers,
        score,
        completed: true
      };
      setIsCompleted(true);
      onComplete(attempt);
    }
  }, [currentQuiz, currentQuestion, answers, timeLeft, isCompleted, onComplete]);
  // Persist session state
  useEffect(() => {
    if (sessionId) {
      const sessionState = {
        quizId: currentQuiz?.id,
        currentQuestion,
        answers,
        timeLeft,
        isCompleted
      };
      localStorage.setItem(`quiz-session-${sessionId}`, JSON.stringify(sessionState));
    }
  }, [sessionId, currentQuiz, currentQuestion, answers, timeLeft, isCompleted]);
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        localStorage.removeItem(`quiz-session-${sessionId}`);
      }
    };
  }, [sessionId]);
  return {
    currentQuiz,
    currentQuestion,
    answers,
    isCompleted,
    timeLeft,
    formattedTime,
    startQuiz,
    submitAnswer
  };
};