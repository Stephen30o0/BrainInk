import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Timer, CheckCircle, XCircle, ChevronRight, AlertCircle, Send, Image as ImageIcon, ArrowLeft } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  questionType: 'multiple-choice' | 'theory' | 'image-based';
  imageUrl?: string; // For image-based questions
  options: string[]; // For multiple choice
  correctAnswer: number; // For multiple choice: index of correct option
  correctTheoryAnswer?: string; // For theory questions
  explanation?: string;
  category?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  timeLimit?: number; // in seconds
}

interface QuizGameProps {
  mode: 'quick' | 'ranked' | 'practice' | 'tournament';
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

export const QuizGame: React.FC<QuizGameProps> = ({
  mode,
  difficulty = 'mixed',
  category,
  opponentName,
  opponentAvatar,
  onComplete,
  onExit
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [theoryAnswer, setTheoryAnswer] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [opponentScore, setOpponentScore] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(Date.now());
  
  // Reference for theory answer textarea autoresize
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Mock questions - in a real app, these would come from an API
  useEffect(() => {
    const mockQuestions: QuizQuestion[] = [
      // Multiple choice questions
      {
        id: '1',
        question: 'What is the capital of France?',
        questionType: 'multiple-choice',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 2,
        explanation: 'Paris is the capital and most populous city of France.',
        category: 'Geography',
        difficulty: 'easy',
        points: 100,
        timeLimit: 15
      },
      {
        id: '2',
        question: 'Which planet is known as the Red Planet?',
        questionType: 'multiple-choice',
        options: ['Earth', 'Mars', 'Jupiter', 'Venus'],
        correctAnswer: 1,
        explanation: 'Mars is called the Red Planet because of the reddish iron oxide on its surface.',
        category: 'Astronomy',
        difficulty: 'easy',
        points: 100,
        timeLimit: 15
      },
      // Theory question
      {
        id: '3',
        question: 'Explain how the brain processes visual information. Include key brain regions involved.',
        questionType: 'theory',
        options: [],
        correctAnswer: 0,
        correctTheoryAnswer: 'Visual information is processed starting with the retina, then passes through the optic nerve to the lateral geniculate nucleus (LGN) in the thalamus. From there, signals travel to the primary visual cortex (V1) in the occipital lobe, where basic visual features are processed. Further processing occurs in higher visual areas (V2-V5), which analyze motion, color, and complex shapes.',
        explanation: 'The visual processing pathway includes multiple specialized regions working in parallel to analyze different aspects of the visual scene.',
        category: 'Neuroscience',
        difficulty: 'medium',
        points: 250,
        timeLimit: 60
      },
      // Image-based question
      {
        id: '4',
        question: 'What brain structure is highlighted in this image?',
        questionType: 'image-based',
        imageUrl: 'https://placeholder.com/800x500?text=Brain+MRI+Image',
        options: ['Hippocampus', 'Amygdala', 'Thalamus', 'Cerebellum'],
        correctAnswer: 0,
        explanation: 'The hippocampus is highlighted, which is crucial for memory formation and spatial navigation.',
        category: 'Neuroscience',
        difficulty: 'medium',
        points: 200,
        timeLimit: 20
      },
      {
        id: '5',
        question: 'What is the time complexity of binary search?',
        questionType: 'multiple-choice',
        options: ['O(n)', 'O(n²)', 'O(log n)', 'O(n log n)'],
        correctAnswer: 2,
        explanation: 'Binary search has a time complexity of O(log n) because it divides the search interval in half with each step.',
        category: 'Computer Science',
        difficulty: 'hard',
        points: 300,
        timeLimit: 30
      }
    ];
    
    // Filter questions based on difficulty and category if provided
    let filteredQuestions = [...mockQuestions];
    
    if (difficulty !== 'mixed') {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
    }
    
    if (category) {
      filteredQuestions = filteredQuestions.filter(q => q.category === category);
    }
    
    // If no questions match the filters, use all questions
    if (filteredQuestions.length === 0) {
      filteredQuestions = mockQuestions;
    }
    
    // Shuffle questions
    const shuffledQuestions = filteredQuestions.sort(() => Math.random() - 0.5);
    
    setQuestions(shuffledQuestions);
    if (shuffledQuestions.length > 0) {
      setTimeLeft(shuffledQuestions[0].timeLimit || 30);
    }
    
    setGameStartTime(Date.now());
  }, [difficulty, category]);
  
  // Timer logic
  useEffect(() => {
    if (questions.length === 0 || isGameOver) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Time's up, move to next question
          if (selectedOption === null) {
            handleNextQuestion();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentQuestionIndex, questions, selectedOption, isGameOver]);
  
  // Simulated opponent logic for practice mode
  useEffect(() => {
    if (mode !== 'practice' || questions.length === 0 || isGameOver) return;
    
    // Simulate opponent answering questions
    const opponentTimer = setInterval(() => {
      const correctnessChance = Math.random();
      // 70% chance opponent gets it right
      if (correctnessChance > 0.3) {
        const currentQuestion = questions[currentQuestionIndex];
        setOpponentScore(prev => prev + currentQuestion.points);
      }
    }, 5000); // Opponent answers roughly every 5 seconds
    
    return () => clearInterval(opponentTimer);
  }, [currentQuestionIndex, mode, questions, isGameOver]);
  
  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [theoryAnswer]);

  // Handle selection for multiple choice questions
  const handleOptionSelect = (optionIndex: number) => {
    if (selectedOption !== null || isGameOver) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const isAnswerCorrect = optionIndex === currentQuestion.correctAnswer;
    
    setSelectedOption(optionIndex);
    setIsCorrect(isAnswerCorrect);
    
    if (isAnswerCorrect) {
      // Calculate time bonus (faster answers get more points)
      const timeBonus = Math.floor((timeLeft / (currentQuestion.timeLimit || 30)) * 50);
      const pointsEarned = currentQuestion.points + timeBonus;
      setScore(prev => prev + pointsEarned);
    }
    
    setShowExplanation(true);
  };
  
  // Handle submission for theory questions
  const handleTheorySubmit = () => {
    if (isGameOver || theoryAnswer.trim() === '') return;
    
    const currentQuestion = questions[currentQuestionIndex];
    
    // In a real app, this would use AI to evaluate the answer
    // For demo purposes, we'll give partial credit if answer contains key terms
    const keyTerms = currentQuestion.correctTheoryAnswer?.split(' ').filter(word => 
      word.length > 5).map(word => word.toLowerCase()) || [];
    
    let matchCount = 0;
    const userAnswer = theoryAnswer.toLowerCase();
    keyTerms.forEach(term => {
      if (userAnswer.includes(term)) matchCount++;
    });
    
    const accuracyPercent = keyTerms.length > 0 ? matchCount / keyTerms.length : 0;
    const isPartiallyCorrect = accuracyPercent > 0.3; // At least 30% correct
    // We calculate if answer is fully correct for potential future use (e.g. different scoring)
    // const isFullyCorrect = accuracyPercent > 0.7; // Over 70% correct
    
    setIsCorrect(isPartiallyCorrect);
    
    if (isPartiallyCorrect) {
      // Award points based on accuracy
      const pointsEarned = Math.round(currentQuestion.points * accuracyPercent);
      setScore(prev => prev + pointsEarned);
    }
    
    setShowExplanation(true);
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
      setShowExplanation(false);
      setTimeLeft(questions[currentQuestionIndex + 1].timeLimit || 30);
    } else {
      // Game over
      const timeTaken = (Date.now() - gameStartTime) / 1000;
      const correctAnswers = questions.filter((_, index) => {
        const userAnswer = index === currentQuestionIndex ? selectedOption : null;
        return userAnswer === questions[index].correctAnswer;
      }).length;
      
      // Calculate rewards
      const xpEarned = Math.floor(score * 0.1);
      const inkEarned = Math.floor(score * 0.05);
      
      onComplete({
        score,
        correctAnswers,
        totalQuestions: questions.length,
        timeTaken,
        xpEarned,
        inkEarned
      });
      
      setIsGameOver(true);
    }
  };
  
  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  
  // Helper function to render different question types
  const renderQuestionContent = () => {
    if (questions.length === 0) return null;
    
    return (
      <div>
        {/* Question */}
        <div className="bg-dark/70 border border-primary/20 rounded-lg p-5 mb-6">
          <h3 className="text-white text-lg mb-2">
            {currentQuestion.question}
          </h3>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{currentQuestion.category}</span>
            <span className={`
              ${currentQuestion.difficulty === 'easy' ? 'text-green-400' : ''}
              ${currentQuestion.difficulty === 'medium' ? 'text-yellow-400' : ''}
              ${currentQuestion.difficulty === 'hard' ? 'text-red-400' : ''}
            `}>
              {currentQuestion.difficulty.toUpperCase()}
            </span>
          </div>
        </div>
        
        {/* Image for image-based questions */}
        {currentQuestion.questionType === 'image-based' && currentQuestion.imageUrl && (
          <div className="mb-6 bg-dark/50 p-2 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <ImageIcon size={16} />
              <span>Reference Image</span>
            </div>
            <img 
              src={currentQuestion.imageUrl} 
              alt="Question reference" 
              className="w-full rounded" 
            />
          </div>
        )}
        
        {/* Multiple choice options */}
        {(currentQuestion.questionType === 'multiple-choice' || currentQuestion.questionType === 'image-based') && (
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                disabled={selectedOption !== null || isGameOver}
                className={`
                  w-full text-left p-4 rounded-lg border transition-all flex items-center 
                  ${selectedOption === index 
                    ? (index === currentQuestion.correctAnswer 
                        ? 'bg-green-500/20 border-green-500/50' 
                        : 'bg-red-500/20 border-red-500/50') 
                    : 'bg-dark/50 border-primary/30 hover:bg-dark/70'}
                  ${selectedOption !== null && index === currentQuestion.correctAnswer 
                    ? 'bg-green-500/20 border-green-500/50' : ''}
                `}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-7 h-7 rounded-full flex items-center justify-center border
                      ${selectedOption === index 
                        ? (index === currentQuestion.correctAnswer 
                            ? 'border-green-500 text-green-500' 
                            : 'border-red-500 text-red-500') 
                        : 'border-gray-600 text-gray-400'}
                      ${selectedOption !== null && index === currentQuestion.correctAnswer 
                        ? 'border-green-500 text-green-500' : ''}
                    `}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-white">{option}</span>
                  </div>
                  
                  {selectedOption === index && index === currentQuestion.correctAnswer && (
                    <CheckCircle className="text-green-500" size={20} />
                  )}
                  {selectedOption === index && index !== currentQuestion.correctAnswer && (
                    <XCircle className="text-red-500" size={20} />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* Theory question input */}
        {currentQuestion.questionType === 'theory' && (
          <div className="mb-6">
            <div className="bg-dark/50 border border-primary/20 rounded-lg p-4">
              <textarea
                ref={textareaRef}
                value={theoryAnswer}
                onChange={(e) => setTheoryAnswer(e.target.value)}
                disabled={showExplanation || isGameOver}
                placeholder="Type your answer here..."
                className="w-full bg-dark/50 border border-gray-700 rounded-lg p-3 text-white min-h-[120px] resize-none focus:outline-none focus:border-primary/50"
              />
              
              {!showExplanation && (
                <button
                  onClick={handleTheorySubmit}
                  disabled={theoryAnswer.trim() === '' || isGameOver}
                  className={`mt-3 px-4 py-2 rounded-lg flex items-center gap-2 justify-center w-full transition-colors ${
                    theoryAnswer.trim() === '' 
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                      : 'bg-primary text-dark hover:bg-primary/90'
                  }`}
                >
                  Submit Answer
                  <Send size={16} />
                </button>
              )}
            </div>
            
            {showExplanation && (
              <div className="mt-4 p-4 border border-primary/20 rounded-lg bg-dark/70">
                <h4 className="text-primary font-medium mb-2">Model Answer</h4>
                <p className="text-gray-300 text-sm whitespace-pre-line">
                  {currentQuestion.correctTheoryAnswer}
                </p>
                
                <div className="mt-4 pt-3 border-t border-gray-700">
                  <h4 className="text-primary font-medium mb-2">Your Answer</h4>
                  <p className="text-gray-300 text-sm whitespace-pre-line">
                    {theoryAnswer}
                  </p>
                </div>
                
                <div className="mt-4 flex items-center">
                  <div className={`rounded-full px-3 py-1 text-sm ${
                    isCorrect 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isCorrect ? 'Acceptable Answer' : 'Incomplete Answer'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Explanation (when an answer is submitted/selected) */}
        {showExplanation && currentQuestion.questionType !== 'theory' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-dark/70 border-l-4 border-primary/50 p-4 rounded-r-lg mb-6"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="text-primary shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-primary font-medium mb-1">Explanation</h4>
                <p className="text-gray-300 text-sm">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* PvP opponent info (for practice mode) */}
        {mode === 'practice' && opponentName && (
          <div className="bg-dark/50 border border-primary/20 rounded-lg p-4 mt-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                  {opponentAvatar}
                </div>
                <div>
                  <div className="text-white font-medium">{opponentName}</div>
                  <div className="text-gray-400 text-xs">AI Opponent</div>
                </div>
              </div>
              <div className="bg-dark/50 rounded-full px-3 py-1 text-sm font-pixel">
                <span className="text-primary">{opponentScore}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="h-full flex flex-col bg-dark/80">
      {/* Quiz header */}
      <div className="bg-dark/50 border-b border-primary/30 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 text-gray-400 hover:text-primary"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-primary font-pixel">
              {mode.charAt(0).toUpperCase() + mode.slice(1)} Match
            </h2>
            <div className="text-xs text-gray-400">Question {currentQuestionIndex + 1} of {questions.length}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className="flex items-center gap-1 text-sm">
            <Timer size={16} className="text-yellow-400" />
            <span className="text-yellow-400 font-mono">{timeLeft}s</span>
          </div>
          
          {/* Score */}
          <div className="bg-dark/50 rounded-full px-3 py-1 text-sm font-pixel">
            <span className="text-primary">{score}</span>
          </div>
        </div>
      </div>
      
      {/* Quiz content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {questions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderQuestionContent()}
          </motion.div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-primary/30 flex justify-between items-center">
        <div className="text-gray-400 text-sm">
          <span className="text-primary font-pixel">{Math.floor((Date.now() - gameStartTime) / 1000)}</span> seconds elapsed
        </div>
        
        {showExplanation && (
          <button
            onClick={handleNextQuestion}
            className="px-4 py-2 bg-primary text-dark rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
