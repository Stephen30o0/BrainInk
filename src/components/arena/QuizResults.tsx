import React from 'react';
import { motion } from 'framer-motion';
import { Award, Brain, Wallet, ChevronRight, BarChart, Clock } from 'lucide-react';

interface QuizResultProps {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: number;
  xpEarned: number;
  inkEarned: number;
  opponentScore?: number;
  opponentName?: string;
  opponentAvatar?: string;
  isRanked?: boolean;
  rankChange?: number;
  onContinue: () => void;
  onPlayAgain: () => void;
}

export const QuizResults: React.FC<QuizResultProps> = ({
  score,
  correctAnswers,
  totalQuestions,
  timeTaken,
  xpEarned,
  inkEarned,
  opponentScore,
  opponentName,
  opponentAvatar,
  isRanked = false,
  rankChange = 0,
  onContinue,
  onPlayAgain
}) => {
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
  const averageTimePerQuestion = Math.round(timeTaken / totalQuestions);
  const hasWon = !opponentScore || score > opponentScore;
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };
  
  return (
    <motion.div 
      className="h-full flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="bg-dark/50 border-b border-primary/30 p-4 text-center"
        variants={itemVariants}
      >
        <h2 className="text-primary font-pixel text-2xl mb-1">
          {hasWon ? 'Victory!' : 'Nice Try!'}
        </h2>
        <p className="text-gray-400 text-sm">
          {hasWon ? 'You won this match!' : 'Better luck next time!'}
        </p>
      </motion.div>
      
      {/* Results */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Score comparison (if vs opponent) */}
        {opponentScore !== undefined && (
          <motion.div 
            className="bg-dark/30 border border-primary/20 rounded-lg p-4 mb-6 flex items-center justify-between"
            variants={itemVariants}
          >
            <div className="flex-1 text-center">
              <div className="font-pixel text-primary text-xl">{score}</div>
              <div className="text-xs text-gray-400">YOUR SCORE</div>
            </div>
            
            <div className="px-4 py-2 bg-primary/20 rounded-full text-sm font-pixel text-primary">
              {hasWon ? 'WIN' : 'LOSS'}
            </div>
            
            <div className="flex-1 text-center">
              <div className="font-pixel text-gray-300 text-xl">{opponentScore}</div>
              <div className="text-xs text-gray-400">
                {opponentName?.toUpperCase() || 'OPPONENT'}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Rank change (if ranked) */}
        {isRanked && (
          <motion.div 
            className="bg-dark/30 border border-primary/20 rounded-lg p-4 mb-6"
            variants={itemVariants}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-yellow-400" />
                <span className="text-white font-medium">Rank Change</span>
              </div>
              <div className={`font-pixel ${rankChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {rankChange >= 0 ? '+' : ''}{rankChange}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Stats */}
        <motion.div 
          className="grid grid-cols-2 gap-4 mb-6"
          variants={itemVariants}
        >
          <div className="bg-dark/30 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart size={16} className="text-primary" />
              <span className="text-white text-sm">Accuracy</span>
            </div>
            <div className="font-pixel text-primary text-xl">{accuracy}%</div>
            <div className="text-xs text-gray-400 mt-1">{correctAnswers}/{totalQuestions} CORRECT</div>
          </div>
          
          <div className="bg-dark/30 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-primary" />
              <span className="text-white text-sm">Avg. Time</span>
            </div>
            <div className="font-pixel text-primary text-xl">{averageTimePerQuestion}s</div>
            <div className="text-xs text-gray-400 mt-1">PER QUESTION</div>
          </div>
        </motion.div>
        
        {/* Rewards */}
        <motion.div 
          className="bg-dark/30 border border-primary/20 rounded-lg p-4 mb-6"
          variants={itemVariants}
        >
          <h3 className="text-white font-medium mb-3">Rewards Earned</h3>
          
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Brain size={20} className="text-blue-400" />
              </div>
              <div>
                <div className="text-white">{xpEarned} XP</div>
                <div className="text-xs text-gray-400">EXPERIENCE</div>
              </div>
            </div>
            
            <div className="font-pixel text-blue-400">+{xpEarned}</div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Wallet size={20} className="text-yellow-400" />
              </div>
              <div>
                <div className="text-white">{inkEarned} INK</div>
                <div className="text-xs text-gray-400">CURRENCY</div>
              </div>
            </div>
            
            <div className="font-pixel text-yellow-400">+{inkEarned}</div>
          </div>
        </motion.div>
      </div>
      
      {/* Controls */}
      <motion.div 
        className="bg-dark/50 border-t border-primary/30 p-4 flex justify-between"
        variants={itemVariants}
      >
        <button 
          onClick={onPlayAgain}
          className="px-4 py-2 border border-primary/30 rounded text-primary hover:bg-primary/10 transition-colors"
        >
          Play Again
        </button>
        
        <button 
          onClick={onContinue}
          className="px-6 py-2 bg-primary text-dark rounded font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          Continue
          <ChevronRight size={16} />
        </button>
      </motion.div>
    </motion.div>
  );
};
