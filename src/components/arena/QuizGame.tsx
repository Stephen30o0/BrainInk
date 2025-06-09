import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Timer, ChevronRight, AlertCircle, Send, ArrowLeft } from 'lucide-react';
import { QuizQuestion, Quiz as QuizType, QuizAttempt } from '../../../quiz/src/lib/types';
import { useQuizAttempts } from '../../../quiz/src/lib/store';
import { useXP } from '../../../quiz/src/lib/store';

interface QuizGameProps {
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  category?: string;
  opponentName?: string;
  opponentAvatar?: string;
  onComplete: (result: QuizResult) => void;
  onExit: () => void;
}

interface QuizResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: number;
  xpEarned: number;
  inkEarned: number;
}

const DEFAULT_TIME_PER_QUESTION = 30; // seconds

export const QuizGame: React.FC<QuizGameProps> = ({
  difficulty = 'easy',
  category = 'neuroscience',
  opponentName,
  opponentAvatar,
  onComplete,
  onExit
}) => {
  const [currentQuiz, setCurrentQuiz] = useState<QuizType | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number | string>>({});
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME_PER_QUESTION);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [theoryAnswer, setTheoryAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { attempts: quizAttempts, setAttempts: setQuizAttempts } = useQuizAttempts();
  const { xp, setXp } = useXP();

  useEffect(() => {
    const KANA_API_BASE_URL = import.meta.env.VITE_KANA_API_BASE_URL || 'https://kana-backend-app.onrender.com/api/kana';

    const loadQuiz = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // For now, we'll use the passed 'category' and 'difficulty' props directly.
        // 'sourceMaterialId' will be hardcoded for this test.
        // 'numQuestions' can be a default or parsed if included in category/difficulty string later.
        const requestedDifficulty = difficulty || 'medium';
        const numQuestions = 5; // Default number of questions
        // TODO: Make sourceMaterialId dynamic based on category or user selection
        const sourceMaterialId = "83701c55-dc53-4220-a9fa-c1a3e52f0b96"; // Hardcoded Starlink PDF ID

        console.log(`Requesting dynamic quiz. Topic/Category: ${category}, Difficulty: ${requestedDifficulty}, SourceID: ${sourceMaterialId}`);

        const response = await fetch(`${KANA_API_BASE_URL}/generate-quiz`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceMaterialId: sourceMaterialId,
            difficulty: requestedDifficulty,
            numQuestions: numQuestions,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from server.' }));
          throw new Error(`Network response was not ok: ${response.status} ${response.statusText}. ${errorData.message || ''}`);
        }

        const quizData: QuizType = await response.json();

        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
          console.error('Received invalid quiz data from backend:', quizData);
          throw new Error('Quiz data from backend is invalid or has no questions.');
        }
        
        setCurrentQuiz(quizData); // Contains title, category, difficulty, questions
        setQuestions(quizData.questions);
        setTimeLeft(DEFAULT_TIME_PER_QUESTION); // Reset timer for the new quiz
        setStartTime(Date.now());
        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to load dynamic quiz:', err);
        setError(`Failed to load quiz: ${err.message || 'Unknown error'}. Please try again.`);
        setIsLoading(false);
      }
    };

    loadQuiz();
  }, [category, difficulty]); // Keep dependencies, so it reloads if category/difficulty props change

  const handleQuizCompletion = useCallback(() => {
    setIsGameOver(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000);

    let finalCorrectAnswers = 0;
    const processedAnswers: Record<string, string | number> = {};

    questions.forEach((q, idx) => {
      const answerKey = q.id || idx.toString();
      const userAnswer = userAnswers[answerKey];
      processedAnswers[answerKey] = userAnswer === undefined ? "skipped" : userAnswer;
      let isCorrect = false;
      if (userAnswer !== undefined) {
        if (q.type === 'multiple-choice' && userAnswer === q.correctAnswer) {
          isCorrect = true;
        }
        if (q.type === 'theoretical' && typeof q.correctAnswer === 'string' && typeof userAnswer === 'string') {
          if (userAnswer.toLowerCase().includes(q.correctAnswer.toLowerCase()) && q.correctAnswer.toLowerCase().includes(userAnswer.toLowerCase())){
            isCorrect = true;
          }
        }
      }
      if (isCorrect) {
        finalCorrectAnswers++;
      }
    });
    
    const finalScore = questions.length > 0 ? Math.round((finalCorrectAnswers / questions.length) * 100) : 0;
    setScore(finalScore);

    const calculatedXpEarned = finalScore > 0 ? Math.max(10, Math.floor(finalScore / 5)) : 0;
    const calculatedInkEarned = finalScore > 50 ? Math.max(5, Math.floor(finalScore / 10)) : 0;

    const newAttempt: QuizAttempt = {
      id: `attempt_${Date.now()}`,
      quizId: currentQuiz?.id || 'unknown_quiz',
      answers: processedAnswers,
      score: finalScore,
      startTime: startTime, 
      endTime: endTime,     
      completed: true,
    };

    setQuizAttempts([...quizAttempts, newAttempt]);
    setXp(xp + calculatedXpEarned);

    onComplete({
      score: finalScore,
      correctAnswers: finalCorrectAnswers,
      totalQuestions: questions.length,
      timeTaken,
      xpEarned: calculatedXpEarned,
      inkEarned: calculatedInkEarned,
    });
  }, [questions, userAnswers, startTime, currentQuiz, onComplete, setQuizAttempts, quizAttempts, setXp, xp]);

  const handleNextQuestion = useCallback(() => {
    setShowExplanation(false);
    setSelectedOption(null);
    setTheoryAnswer('');
    if (timerRef.current) clearInterval(timerRef.current);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setTimeLeft(DEFAULT_TIME_PER_QUESTION);
    } else {
      handleQuizCompletion();
    }
  }, [currentQuestionIndex, questions.length, handleQuizCompletion, currentQuiz]); // Added currentQuiz as it's used in timeLimitPerQuestion logic indirectly

 useEffect(() => {
    if (isGameOver || showExplanation || isLoading || questions.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleNextQuestion(); 
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex, isGameOver, showExplanation, isLoading, questions, theoryAnswer, selectedOption, handleNextQuestion]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [theoryAnswer]);

  const currentQuestion = useMemo(() => {
    return questions.length > 0 && currentQuestionIndex < questions.length ? questions[currentQuestionIndex] : null;
  }, [questions, currentQuestionIndex]);

  const processAnswer = useCallback((answer: number | string) => {
    if (!currentQuestion) return;
    
    setUserAnswers(prev => ({ ...prev, [currentQuestion.id || currentQuestionIndex.toString()]: answer }));
    setShowExplanation(true);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [currentQuestion, currentQuestionIndex, setUserAnswers, setShowExplanation]);

  const handleOptionSelect = (optionIndex: number) => {
    if (showExplanation) return;
    setSelectedOption(optionIndex);
    processAnswer(optionIndex);
  };

  const handleTheorySubmit = () => {
    if (showExplanation || !theoryAnswer.trim()) return;
    processAnswer(theoryAnswer.trim());
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-800 text-white rounded-lg shadow-xl">
        <Timer className="w-12 h-12 mb-4 animate-spin text-purple-400" />
        <p className="text-xl">Loading Quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-800 text-white rounded-lg shadow-xl">
        <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
        <p className="text-xl text-center mb-2">Error</p>
        <p className="text-center mb-4">{error}</p>
        <button 
          onClick={onExit}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-semibold transition-colors duration-150 flex items-center"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Go Back
        </button>
      </div>
    );
  }

  if (!currentQuestion && !isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-800 text-white rounded-lg shadow-xl">
        <AlertCircle className="w-12 h-12 mb-4 text-yellow-400" />
        <p className="text-xl">No questions available for this quiz.</p>
         <button 
          onClick={onExit}
          className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-semibold transition-colors duration-150 flex items-center"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Go Back
        </button>
      </div>
    );
  }

  if (isGameOver) {
    // Calculate correct answers for display on game over screen
    let correctAnswersCount = 0;
    questions.forEach((q, idx) => {
      const answerKey = q.id || idx.toString();
      const userAnswer = userAnswers[answerKey];
      if (userAnswer !== undefined) {
        if (q.type === 'multiple-choice' && userAnswer === q.correctAnswer) {
          correctAnswersCount++;
        }
        if (q.type === 'theoretical' && typeof q.correctAnswer === 'string' && typeof userAnswer === 'string') {
          if (userAnswer.toLowerCase().includes(q.correctAnswer.toLowerCase()) && q.correctAnswer.toLowerCase().includes(userAnswer.toLowerCase())){
            correctAnswersCount++;
          }
        }
      }
    });
    const calculatedXpEarned = score > 0 ? Math.max(10, Math.floor(score / 5)) : 0;

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="flex flex-col items-center justify-center h-full p-6 bg-gray-800 text-white rounded-lg shadow-xl"
      >
        <h2 className="text-3xl font-bold mb-4 text-purple-400">Quiz Completed!</h2>
        <p className="text-xl mb-2">Your Score: <span className="font-bold text-green-400">{score}%</span></p>
        <p className="text-lg mb-1">Correct Answers: {correctAnswersCount} / {questions.length}</p>
        <p className="text-lg mb-6">XP Earned: <span className="font-bold text-yellow-400">{calculatedXpEarned}</span></p>
        
        {opponentName && (
          <div className="my-4 p-3 bg-gray-700 rounded-md w-full max-w-sm text-center">
            <p className="text-lg">Opponent: {opponentName}</p>
            <p className="text-sm text-gray-400">(Opponent score display pending integration)</p>
          </div>
        )}

        <button 
          onClick={onExit} 
          className="mt-6 px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-semibold transition-colors duration-150 text-lg flex items-center"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Arena
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      key={currentQuestionIndex} 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full p-4 md:p-6 bg-gray-800 text-white rounded-lg shadow-2xl overflow-y-auto"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Timer className="w-6 h-6 mr-2 text-purple-400" />
          <span className="text-2xl font-mono p-1 rounded bg-gray-700 text-purple-300">{String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}</span>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Question {currentQuestionIndex + 1} of {questions.length}</p>
          <p className="text-lg font-semibold text-purple-400">{currentQuiz?.title}</p>
        </div>
      </div>

      {opponentName && (
        <div className="mb-4 p-3 bg-gray-700 rounded-lg flex items-center justify-between shadow">
          <div className="flex items-center">
            <img 
              src={opponentAvatar || `https://ui-avatars.com/api/?name=${opponentName.replace(/\s+/g, '+')}&background=random&color=fff&bold=true`}
              alt={`${opponentName}'s avatar`}
              className="w-10 h-10 rounded-full mr-3 border-2 border-purple-500"
            />
            <div>
              <p className="font-semibold text-purple-300">{opponentName}</p>
              {/* <p className="text-xs text-gray-400">Playing {mode}</p> */}
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-700 p-4 md:p-6 rounded-lg shadow-lg mb-4 flex-grow">
        <h3 className="text-xl md:text-2xl font-semibold mb-4 leading-tight text-purple-200">{currentQuestion?.questionText}</h3>
        
        {currentQuestion?.type === 'multiple-choice' && currentQuestion.options && (
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleOptionSelect(index)}
                disabled={showExplanation}
                className={`w-full text-left p-3 md:p-4 rounded-md border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500 
                  ${showExplanation && index === currentQuestion.correctAnswer ? 'bg-green-600 border-green-500 text-white scale-105 shadow-lg' : 
                    showExplanation && selectedOption === index && index !== currentQuestion.correctAnswer ? 'bg-red-600 border-red-500 text-white scale-105 shadow-lg' : 
                    selectedOption === index ? 'bg-purple-600 border-purple-500 text-white' : 
                    'bg-gray-600 border-gray-500 hover:bg-purple-700 hover:border-purple-600 disabled:opacity-60 disabled:cursor-not-allowed'}`}
                whileHover={{ scale: showExplanation ? 1 : 1.02 }}
                whileTap={{ scale: showExplanation ? 1 : 0.98 }}
              >
                {option}
              </motion.button>
            ))}
          </div>
        )}

        {currentQuestion?.type === 'theoretical' && (
          <div className="flex flex-col">
            <textarea
              ref={textareaRef}
              value={theoryAnswer}
              onChange={(e) => setTheoryAnswer(e.target.value)}
              placeholder="Type your answer here..."
              disabled={showExplanation}
              className="w-full p-3 md:p-4 bg-gray-600 border-2 border-gray-500 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none overflow-hidden text-white placeholder-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
              rows={3}
            />
            {!showExplanation && (
              <button 
                onClick={handleTheorySubmit}
                disabled={!theoryAnswer.trim() || showExplanation}
                className="mt-3 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md self-end transition-colors duration-150 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center"
              >
                <Send className="w-4 h-4 mr-2" /> Submit Answer
              </button>
            )}
          </div>
        )}
      </div>

      {showExplanation && currentQuestion && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }} 
          transition={{ duration: 0.3 }}
          className={`bg-gray-750 p-4 md:p-5 rounded-lg shadow-inner mb-4 border-l-4 
            ${(currentQuestion.type === 'multiple-choice' && selectedOption === currentQuestion.correctAnswer) || 
             (currentQuestion.type === 'theoretical' && typeof currentQuestion.correctAnswer === 'string' && typeof userAnswers[currentQuestion.id || currentQuestionIndex.toString()] === 'string' && (userAnswers[currentQuestion.id || currentQuestionIndex.toString()] as string).toLowerCase().includes(currentQuestion.correctAnswer.toLowerCase()) && currentQuestion.correctAnswer.toLowerCase().includes((userAnswers[currentQuestion.id || currentQuestionIndex.toString()] as string).toLowerCase())) ? 
             'border-green-500' : 'border-red-500'}`}
        >
          <h4 className={`text-lg font-semibold mb-2 
            ${(currentQuestion.type === 'multiple-choice' && selectedOption === currentQuestion.correctAnswer) || 
             (currentQuestion.type === 'theoretical' && typeof currentQuestion.correctAnswer === 'string' && typeof userAnswers[currentQuestion.id || currentQuestionIndex.toString()] === 'string' && (userAnswers[currentQuestion.id || currentQuestionIndex.toString()] as string).toLowerCase().includes(currentQuestion.correctAnswer.toLowerCase()) && currentQuestion.correctAnswer.toLowerCase().includes((userAnswers[currentQuestion.id || currentQuestionIndex.toString()] as string).toLowerCase())) ? 
             'text-green-400' : 'text-red-400'}`}
          >
            {(currentQuestion.type === 'multiple-choice' && selectedOption === currentQuestion.correctAnswer) || 
             (currentQuestion.type === 'theoretical' && typeof currentQuestion.correctAnswer === 'string' && typeof userAnswers[currentQuestion.id || currentQuestionIndex.toString()] === 'string' && (userAnswers[currentQuestion.id || currentQuestionIndex.toString()] as string).toLowerCase().includes(currentQuestion.correctAnswer.toLowerCase()) && currentQuestion.correctAnswer.toLowerCase().includes((userAnswers[currentQuestion.id || currentQuestionIndex.toString()] as string).toLowerCase())) ? 
             'Correct!' : 'Incorrect.'}
          </h4>
          <p className="text-sm md:text-base text-gray-300">{currentQuestion.explanation}</p>
          {currentQuestion.type === 'theoretical' && (
            <p className="text-sm md:text-base text-gray-400 mt-1">Correct Answer: <span className="text-green-300">{currentQuestion.correctAnswer}</span></p>
          )}
        </motion.div>
      )}

      <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-700">
        <button 
          onClick={onExit} 
          className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors duration-150 flex items-center"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Exit Quiz
        </button>
        {showExplanation && (
          <button 
            onClick={handleNextQuestion}
            className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md transition-colors duration-150 flex items-center"
          >
            {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'} 
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

