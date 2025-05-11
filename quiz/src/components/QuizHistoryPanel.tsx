import React from 'react';
import { X, Clock, Award, BookOpen } from 'lucide-react';
import { useQuizAttempts } from '../lib/store';
import quizzes from './data/QuizData';
interface QuizHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}
const QuizHistoryPanel: React.FC<QuizHistoryPanelProps> = ({
  isOpen,
  onClose
}) => {
  const {
    attempts
  } = useQuizAttempts();
  if (!isOpen) return null;
  const getQuizById = (id: string) => {
    return quizzes.find(quiz => quiz.id === id);
  };
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };
  const calculatePercentage = (attempt: any) => {
    const quiz = getQuizById(attempt.quizId);
    if (!quiz) return 0;
    const totalQuestions = quiz.questions.length;
    const correctAnswers = Object.keys(attempt.answers).filter(qId => {
      const question = quiz.questions.find(q => q.id === qId);
      return question && attempt.answers[qId] === question.correctAnswer;
    }).length;
    return Math.round(correctAnswers / totalQuestions * 100);
  };
  return <div className="absolute right-0 top-0 h-full w-80 bg-[#0a0e17] border-l border-[#1a223a] z-10 flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-[#1a223a]">
        <h3 className="text-lg font-medium flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-blue-400" />
          Quiz History
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {attempts.length === 0 ? <div className="text-center py-8 text-gray-400">
            <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No quiz attempts yet</p>
            <p className="text-sm mt-1">Complete a quiz to see your history</p>
          </div> : <div className="space-y-4">
            {attempts.map(attempt => {
          const quiz = getQuizById(attempt.quizId);
          if (!quiz) return null;
          const percentage = calculatePercentage(attempt);
          return <div key={attempt.id} className="bg-[#141b2d] rounded-lg p-4 border border-[#1a223a] hover:border-blue-500 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{quiz.title}</h4>
                    <span className={`font-bold ${getScoreColor(percentage)}`}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 flex items-center mb-2">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(attempt.startTime)}
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#1a223a] text-sm">
                    <div className="flex justify-between">
                      <span>Subject:</span>
                      <span className="font-medium">{quiz.subject}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Difficulty:</span>
                      <span className="font-medium capitalize">
                        {quiz.difficulty}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Questions:</span>
                      <span className="font-medium">
                        {quiz.questions.length}
                      </span>
                    </div>
                  </div>
                </div>;
        })}
          </div>}
      </div>
    </div>;
};
export default QuizHistoryPanel;