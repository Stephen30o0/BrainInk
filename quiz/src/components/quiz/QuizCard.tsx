import React from 'react';
import { Quiz } from '../../lib/types';
import { Clock, Target, BookOpen } from 'lucide-react';
interface QuizCardProps {
  quiz: Quiz;
  onStart: () => void;
}
const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  onStart
}) => {
  return <div className="bg-[#141b2d] p-4 rounded-lg border border-[#1a223a] hover:border-blue-500 transition-colors">
      <h3 className="text-lg font-medium mb-2">{quiz.title}</h3>
      <div className="flex items-center text-sm text-gray-400 mb-3 space-x-4">
        <div className="flex items-center">
          <Target className="h-4 w-4 mr-1" />
          <span className="capitalize">{quiz.difficulty}</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span>{Math.floor(quiz.timeLimit / 60)} mins</span>
        </div>
        <div className="flex items-center">
          <BookOpen className="h-4 w-4 mr-1" />
          <span>{quiz.questions.length} questions</span>
        </div>
      </div>
      <button onClick={onStart} className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors">
        Start Quiz
      </button>
    </div>;
};
export default QuizCard;