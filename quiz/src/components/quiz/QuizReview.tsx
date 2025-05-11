import React from 'react';
import { QuizQuestion } from '../../lib/types';
import { CheckCircle, XCircle } from 'lucide-react';
interface QuizReviewProps {
  title: string;
  questions: QuizQuestion[];
  answers: Record<string, any>;
  score: number;
  onRetry: () => void;
}
const QuizReview: React.FC<QuizReviewProps> = ({
  title,
  questions,
  answers,
  score,
  onRetry
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };
  return <div className="space-y-6">
      <div className="bg-[#141b2d] p-6 rounded-lg border border-[#1a223a]">
        <h2 className="text-xl font-medium mb-4">{title} - Results</h2>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-400">Final Score</p>
            <p className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score}%
            </p>
          </div>
          <button onClick={onRetry} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
            Try Again
          </button>
        </div>
        <div className="space-y-4">
          {questions.map((question, idx) => {
          const userAnswer = answers[question.id];
          const isCorrect = userAnswer === question.correctAnswer;
          return <div key={question.id} className="border-t border-[#1a223a] pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-400 mr-2">
                      Question {idx + 1}
                    </span>
                    {isCorrect ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                  </div>
                </div>
                <p className="mb-2">{question.question}</p>
                {question.type === 'multiple-choice' && <div className="space-y-2">
                    {question.options?.map((option, optIdx) => <div key={optIdx} className={`p-3 rounded-md ${optIdx === question.correctAnswer ? 'bg-green-500 bg-opacity-10 border border-green-500' : optIdx === userAnswer ? 'bg-red-500 bg-opacity-10 border border-red-500' : 'bg-[#1a223a]'}`}>
                        {option}
                      </div>)}
                  </div>}
                {question.type === 'theoretical' && <div className="space-y-2">
                    <div className="p-3 bg-[#1a223a] rounded-md">
                      <p className="text-sm text-gray-400">Your Answer:</p>
                      <p>{userAnswer}</p>
                    </div>
                    <div className="p-3 bg-green-500 bg-opacity-10 border border-green-500 rounded-md">
                      <p className="text-sm text-gray-400">Correct Answer:</p>
                      <p>{question.correctAnswer}</p>
                    </div>
                  </div>}
                <div className="mt-2 p-3 bg-[#1a223a] rounded-md">
                  <p className="text-sm text-gray-400">Explanation:</p>
                  <p>{question.explanation}</p>
                </div>
              </div>;
        })}
        </div>
      </div>
    </div>;
};
export default QuizReview;