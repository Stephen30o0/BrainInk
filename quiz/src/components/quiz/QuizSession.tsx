import React, { useEffect, useState, useRef } from 'react';
import { QuizQuestion as QuizQuestionType } from '../../lib/types';
import { useQuiz } from '../../lib/hooks/useQuiz';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
interface QuizSessionProps {
  question: QuizQuestionType;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number;
  onAnswer: (answer: any) => void;
  isLoading?: boolean;
}
const QuizSession: React.FC<QuizSessionProps> = ({
  question,
  questionNumber,
  totalQuestions,
  timeRemaining,
  onAnswer,
  isLoading = false
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Reset selection when question changes
  useEffect(() => {
    setSelectedOption(null);
    setTextAnswer('');
  }, [question]);
  const handleOptionSelect = (idx: number) => {
    setSelectedOption(idx);
    onAnswer(idx);
  };
  const handleTextSubmit = () => {
    if (textAnswer.trim()) {
      onAnswer(textAnswer);
    }
  };
  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (question.type === 'multiple-choice' && question.options) {
        const num = parseInt(e.key);
        if (!isNaN(num) && num > 0 && num <= question.options.length) {
          onAnswer(num - 1);
        }
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [question, onAnswer]);
  // Auto-focus first option or textarea
  useEffect(() => {
    if (question.type === 'multiple-choice' && optionRefs.current[0]) {
      optionRefs.current[0].focus();
    } else if (question.type === 'theoretical' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [question]);
  // Timer color based on time remaining
  const timerPercentage = timeRemaining / question.timeLimit * 100;
  const timerColor = timerPercentage > 50 ? 'text-green-500' : timerPercentage > 25 ? 'text-yellow-500' : 'text-red-500';
  if (isLoading) {
    return <div className="bg-[#141b2d] p-4 rounded-lg border border-[#1a223a]">
        <div className="flex items-center text-yellow-500">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p>Loading question...</p>
        </div>
      </div>;
  }
  if (!question) {
    return null;
  }
  return <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">
          Question {questionNumber} of {totalQuestions}
        </h3>
        <div className={`font-medium ${timerColor}`}>
          {formatTime(timeRemaining)}
        </div>
      </div>
      <div className="bg-[#141b2d] p-4 rounded-lg border border-[#1a223a]">
        <p className="mb-4">{question.question}</p>
        {question.type === 'multiple-choice' && question.options && <div className="space-y-2" role="radiogroup">
            {question.options.map((option, idx) => <button key={idx} ref={el => optionRefs.current[idx] = el} onClick={() => handleOptionSelect(idx)} className={`w-full text-left p-3 rounded-md transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none
                  ${selectedOption === idx ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#1a223a] hover:bg-[#232d4a]'}`} role="radio" aria-checked={selectedOption === idx}>
                <span className="inline-block w-6">{idx + 1}.</span>
                {option}
              </button>)}
          </div>}
        {question.type === 'theoretical' && <div className="mt-2">
            <textarea ref={textareaRef} value={textAnswer} onChange={e => setTextAnswer(e.target.value)} className="w-full bg-[#1a223a] border border-[#2a324a] rounded-md p-3 min-h-[100px] text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" placeholder="Type your answer here..." />
            <button onClick={handleTextSubmit} disabled={!textAnswer.trim()} className={`mt-2 px-4 py-2 rounded-md font-medium transition-colors
                ${textAnswer.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#1a223a] opacity-50 cursor-not-allowed'}`}>
              Submit Answer
            </button>
          </div>}
      </div>
    </div>;
};
export default QuizSession;