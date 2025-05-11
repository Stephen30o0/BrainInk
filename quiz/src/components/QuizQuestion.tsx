import React, { useEffect, useRef } from 'react';
import { QuizQuestion as QuizQuestionType } from '../lib/types';
interface QuizQuestionProps {
  question: QuizQuestionType;
  index: number;
  total: number;
  onAnswer: (answer: any) => void;
  timeLeft: number;
  formattedTime: string;
}
const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  index,
  total,
  onAnswer,
  timeLeft,
  formattedTime
}) => {
  const answerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
  // Focus first option or textarea on mount
  useEffect(() => {
    if (question.type === 'multiple-choice' && answerRefs.current[0]) {
      answerRefs.current[0].focus();
    } else if (question.type === 'theoretical' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [question]);
  const percentage = timeLeft / (question.timeLimit || 60) * 100;
  const timerColor = percentage > 50 ? 'text-green-500' : percentage > 25 ? 'text-yellow-500' : 'text-red-500';
  return <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">
          Question {index + 1}/{total}
        </h3>
        <div className="relative inline-flex items-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12">
              <circle className="text-[#1a223a]" strokeWidth="4" stroke="currentColor" fill="transparent" r="20" cx="24" cy="24" />
              <circle className={`${timerColor} transition-all duration-1000 ease-in-out`} strokeWidth="4" strokeDasharray={125.6} strokeDashoffset={125.6 * ((100 - percentage) / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="20" cx="24" cy="24" />
            </svg>
          </div>
          <span className={`text-sm font-medium ${timerColor} ml-3 relative z-10`}>
            {formattedTime}
          </span>
        </div>
      </div>
      <div className="bg-[#141b2d] p-4 rounded-lg border border-[#1a223a]">
        <p className="mb-4">{question.question}</p>
        {question.type === 'multiple-choice' && question.options && <div className="space-y-2" role="radiogroup">
            {question.options.map((option, idx) => <button key={idx} ref={el => answerRefs.current[idx] = el} onClick={() => onAnswer(idx)} className="w-full text-left p-3 bg-[#1a223a] hover:bg-[#232d4a] rounded-md transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none" role="radio" aria-checked="false">
                <span className="inline-block w-6">{idx + 1}.</span>
                {option}
              </button>)}
          </div>}
        {question.type === 'theoretical' && <div className="mt-2">
            <textarea ref={textareaRef} className="w-full bg-[#1a223a] border border-[#2a324a] rounded-md p-3 min-h-[100px] text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Type your answer here..." onChange={e => onAnswer(e.target.value)} />
          </div>}
      </div>
    </div>;
};
export default QuizQuestion;