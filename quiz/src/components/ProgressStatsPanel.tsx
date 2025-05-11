import React from 'react';
import { X, Award, TrendingUp, Brain, Target, Timer } from 'lucide-react';
import { useQuizAttempts } from '../lib/store';
import quizzes from './data/QuizData';
interface ProgressStatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}
const ProgressStatsPanel: React.FC<ProgressStatsPanelProps> = ({
  isOpen,
  onClose
}) => {
  const {
    attempts
  } = useQuizAttempts();
  if (!isOpen) return null;
  const calculateStats = () => {
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.completed).length;
    const averageScore = attempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalAttempts || 0;
    const subjectStats = attempts.reduce((acc: Record<string, number>, curr) => {
      const quiz = quizzes.find(q => q.id === curr.quizId);
      if (quiz) {
        acc[quiz.subject] = (acc[quiz.subject] || 0) + 1;
      }
      return acc;
    }, {});
    return {
      totalAttempts,
      completedAttempts,
      averageScore,
      subjectStats
    };
  };
  const stats = calculateStats();
  return <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-[#0a0e17] border border-[#1a223a] rounded-lg w-[600px] max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-[#1a223a]">
          <h3 className="text-lg font-medium flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-400" />
            Progress Statistics
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#141b2d] p-4 rounded-lg border border-[#1a223a]">
              <div className="flex items-center justify-between mb-2">
                <Brain className="h-5 w-5 text-blue-400" />
                <span className="text-2xl font-bold">
                  {stats.totalAttempts}
                </span>
              </div>
              <p className="text-sm text-gray-400">Total Attempts</p>
            </div>
            <div className="bg-[#141b2d] p-4 rounded-lg border border-[#1a223a]">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-5 w-5 text-green-400" />
                <span className="text-2xl font-bold">
                  {Math.round(stats.averageScore)}%
                </span>
              </div>
              <p className="text-sm text-gray-400">Average Score</p>
            </div>
            <div className="bg-[#141b2d] p-4 rounded-lg border border-[#1a223a]">
              <div className="flex items-center justify-between mb-2">
                <Timer className="h-5 w-5 text-purple-400" />
                <span className="text-2xl font-bold">
                  {stats.completedAttempts}
                </span>
              </div>
              <p className="text-sm text-gray-400">Completed</p>
            </div>
          </div>
          {/* Subject Progress */}
          <div className="bg-[#141b2d] p-4 rounded-lg border border-[#1a223a] mb-6">
            <h4 className="font-medium mb-4">Subject Progress</h4>
            <div className="space-y-4">
              {Object.entries(stats.subjectStats).map(([subject, count]) => <div key={subject}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{subject}</span>
                    <span className="text-gray-400">{count} attempts</span>
                  </div>
                  <div className="w-full bg-[#0a0e17] h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{
                  width: `${count / stats.totalAttempts * 100}%`
                }} />
                  </div>
                </div>)}
            </div>
          </div>
          {/* Recent Achievements */}
          <div className="bg-[#141b2d] p-4 rounded-lg border border-[#1a223a]">
            <h4 className="font-medium mb-4">Recent Achievements</h4>
            <div className="space-y-3">
              {attempts.slice(-3).map((attempt, idx) => {
              const quiz = quizzes.find(q => q.id === attempt.quizId);
              if (!quiz) return null;
              return <div key={attempt.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Award className={`h-5 w-5 mr-2 ${attempt.score && attempt.score >= 80 ? 'text-yellow-400' : 'text-blue-400'}`} />
                      <div>
                        <p className="text-sm font-medium">{quiz.title}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(attempt.startTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`font-medium ${attempt.score && attempt.score >= 80 ? 'text-green-500' : attempt.score && attempt.score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {attempt.score}%
                    </span>
                  </div>;
            })}
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default ProgressStatsPanel;