import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrophyIcon, ZapIcon, Target, Users, ArrowLeft, Calendar, ChevronRight, Award } from 'lucide-react';
import { QuizGame } from './QuizGame';
import { QuizResults } from './QuizResults';
import { GameSetup, GameSettings } from './GameSetup';
import { Leaderboard } from './Leaderboard';
import { FriendBattle, BattleSettings } from './FriendBattle';

interface ArenaHubProps {
  onExit: () => void;
  initialMode?: string;
  featureId?: string;
  subFeatureId?: string;
}

type GameMode = 'quick' | 'ranked' | 'practice' | 'tournament' | null;
type GameSetupScreen = 'quick-setup' | 'ranked-setup' | null;
type ArenaScreen = 'hub' | 'game' | 'results' | 'tournaments' | 'leaderboard' | 'training' | 'friend-battle';

interface QuizResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: number;
  xpEarned: number;
  inkEarned: number;
}

export const ArenaHub: React.FC<ArenaHubProps> = ({ 
  onExit, 
  featureId,
  subFeatureId
 }) => {
  const [currentScreen, setCurrentScreen] = useState<ArenaScreen>(
    featureId === 'tournament' ? 'tournaments' :
    featureId === 'practice' ? 'training' :
    featureId === 'leaderboard' ? 'leaderboard' : 'hub'
  );
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [setupScreen, setSetupScreen] = useState<GameSetupScreen>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  
  // User rank data - in a real app this would come from user profile
  const userRank = {
    tier: 'Silver',
    division: 2,
    points: 1250
  };
  
  // Auto-start specific game modes based on subFeatureId
  React.useEffect(() => {
    if (subFeatureId) {
      switch (subFeatureId) {
        case 'quick-match':
          setSetupScreen('quick-setup');
          break;
        case 'ranked':
          setSetupScreen('ranked-setup');
          break;
        case 'ai-training':
          setGameMode('practice');
          setCurrentScreen('game');
          break;
        case 'friend-battle':
          // Could open a friend selection dialog instead
          setCurrentScreen('training');
          break;
        case 'custom':
          setCurrentScreen('tournaments');
          break;
      }
    }
  }, [subFeatureId]);
  
  const handleStartGame = (mode: GameMode) => {
    if (mode === 'quick') {
      setSetupScreen('quick-setup');
    } else if (mode === 'ranked') {
      setSetupScreen('ranked-setup');
    } else {
      setGameMode(mode);
      setCurrentScreen('game');
    }
  };
  
  const handleStartWithSettings = (settings: GameSettings) => {
    setGameSettings(settings);
    setGameMode(settings.mode);
    setSetupScreen(null);
    setCurrentScreen('game');
  };
  
  const handleCancelSetup = () => {
    setSetupScreen(null);
  };
  
  const handleGameComplete = (result: QuizResult) => {
    setQuizResult(result);
    setCurrentScreen('results');
  };
  
  const handleContinue = () => {
    setQuizResult(null);
    
    // Return to appropriate screen based on previous game mode
    switch (gameMode) {
      case 'quick':
      case 'ranked':
        setCurrentScreen('hub');
        break;
      case 'practice':
        setCurrentScreen('training');
        break;
      case 'tournament':
        setCurrentScreen('tournaments');
        break;
      default:
        setCurrentScreen('hub');
    }
    
    setGameMode(null);
  };
  
  const handlePlayAgain = () => {
    // Keep the same game mode and start a new game
    setQuizResult(null);
    setCurrentScreen('game');
  };
  
  // Animation variants
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

  // Function to handle Friend Battle settings submission
  const handleStartBattle = (settings: BattleSettings) => {
    console.log('Starting battle with settings:', settings);
    // Here you would typically make API calls to send invites
    // For now we'll just transition to a game with practice mode
    setGameMode('practice');
    setCurrentScreen('game');
  };

  // Render appropriate content based on current screen
  const renderContent = () => {
    // Show setup screens if active
    if (setupScreen === 'quick-setup') {
      return (
        <GameSetup 
          mode='quick'
          onStart={handleStartWithSettings}
          onBack={handleCancelSetup}
        />
      );
    }
    
    if (setupScreen === 'ranked-setup') {
      return (
        <GameSetup 
          mode='ranked'
          onStart={handleStartWithSettings}
          onBack={handleCancelSetup}
          userRank={userRank}
        />
      );
    }
    
    // Show screens based on currentScreen state
    switch (currentScreen) {
      case 'game':
        return (
          <QuizGame 
            mode={gameMode || 'quick'} 
            difficulty={gameSettings?.difficulty}
            category={gameSettings?.subjects[0]}
            opponentName={gameMode === 'practice' ? 'KANA' : undefined}
            opponentAvatar={gameMode === 'practice' ? '🤖' : undefined}
            onComplete={handleGameComplete}
            onExit={() => setCurrentScreen('hub')}
          />
        );
      case 'results':
        if (!quizResult) return null;
        return (
          <QuizResults 
            {...quizResult}
            isRanked={gameMode === 'ranked'}
            rankChange={gameMode === 'ranked' ? Math.floor(Math.random() * 20) - 5 : undefined}
            opponentName={gameMode === 'practice' ? 'KANA' : undefined}
            opponentScore={gameMode === 'practice' ? Math.floor(Math.random() * 1000) + 500 : undefined}
            onContinue={handleContinue}
            onPlayAgain={handlePlayAgain}
          />
        );
      case 'tournaments':
        return renderTournamentsScreen();
      case 'leaderboard':
        return renderLeaderboardScreen();
      case 'training':
        return renderTrainingScreen();
      case 'friend-battle':
        return (
          <FriendBattle
            onExit={() => setCurrentScreen('training')}
            onStartBattle={handleStartBattle}
          />
        );
      default:
        return renderHubScreen();
    }
  };
  
  // Different screens
  const renderHubScreen = () => {
    return (
      <motion.div 
        className="h-full flex flex-col"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="bg-dark/50 border-b border-primary/30 p-4 flex justify-between items-center"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2">
            <TrophyIcon size={20} className="text-red-400" />
            <h2 className="text-primary font-pixel text-lg">Battle Arena</h2>
          </div>
          <button 
            onClick={onExit}
            className="p-2 text-gray-400 hover:text-primary"
          >
            <ArrowLeft size={20} />
          </button>
        </motion.div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Quick access buttons */}
          <motion.div 
            className="grid grid-cols-2 gap-4 mb-8"
            variants={itemVariants}
          >
            <button 
              onClick={() => handleStartGame('quick')}
              className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 rounded-lg p-6 text-center transition-all hover-scale"
            >
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                <ZapIcon size={24} className="text-blue-400" />
              </div>
              <h3 className="font-pixel text-blue-400 mb-1">Quick Match</h3>
              <p className="text-gray-400 text-xs">Fast 5-question battle</p>
            </button>
            
            <button 
              onClick={() => handleStartGame('ranked')}
              className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-lg p-6 text-center transition-all hover-scale"
            >
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Award size={24} className="text-purple-400" />
              </div>
              <h3 className="font-pixel text-purple-400 mb-1">Ranked Match</h3>
              <p className="text-gray-400 text-xs">Compete for leaderboard position</p>
            </button>
          </motion.div>
          
          {/* Feature sections */}
          <motion.div variants={itemVariants}>
            <h3 className="font-pixel text-primary mb-3">Arena Features</h3>
            
            <div className="space-y-4">
              {/* Tournaments */}
              <button 
                onClick={() => setCurrentScreen('tournaments')}
                className="w-full bg-dark/30 border border-primary/20 hover:border-primary/50 rounded-lg p-4 flex items-center justify-between transition-all hover-scale"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Calendar size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-medium">Tournaments</h4>
                    <p className="text-gray-400 text-xs">Join or create knowledge competitions</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </button>
              
              {/* Training */}
              <button 
                onClick={() => setCurrentScreen('training')}
                className="w-full bg-dark/30 border border-primary/20 hover:border-primary/50 rounded-lg p-4 flex items-center justify-between transition-all hover-scale"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Target size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-medium">Training Grounds</h4>
                    <p className="text-gray-400 text-xs">Practice with AI or challenge friends</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </button>
              
              {/* Leaderboard */}
              <button 
                onClick={() => setCurrentScreen('leaderboard')}
                className="w-full bg-dark/30 border border-primary/20 hover:border-primary/50 rounded-lg p-4 flex items-center justify-between transition-all hover-scale"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <TrophyIcon size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-medium">Leaderboard</h4>
                    <p className="text-gray-400 text-xs">See who's on top and climb the ranks</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  };
  
  const renderTournamentsScreen = () => {
    const tournaments = [
      {
        id: 'national-cup',
        name: 'National Academic Cup',
        date: 'June 15',
        participants: 128,
        prize: '5000 INK',
        status: 'upcoming'
      }, 
      {
        id: 'science-battle',
        name: 'Science Battle Royale',
        date: 'May 30',
        participants: 64,
        prize: '2500 INK',
        status: 'registration'
      }, 
      {
        id: 'math-challenge',
        name: 'Mathematics Challenge',
        date: 'May 22',
        participants: 32,
        prize: '1000 INK',
        status: 'live'
      }
    ];
    
    return (
      <motion.div 
        className="h-full flex flex-col"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="bg-dark/50 border-b border-primary/30 p-4 flex justify-between items-center"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            <h2 className="text-primary font-pixel text-lg">Tournaments</h2>
          </div>
          <button 
            onClick={() => setCurrentScreen('hub')}
            className="p-2 text-gray-400 hover:text-primary"
          >
            <ArrowLeft size={20} />
          </button>
        </motion.div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tournaments.map(tournament => (
                <div 
                  key={tournament.id} 
                  className="bg-dark/30 border border-primary/20 rounded-lg p-4 hover-scale transition-all"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-pixel text-primary text-sm">
                      {tournament.name}
                    </h3>
                    <div className={`px-2 py-1 rounded text-xs ${
                      tournament.status === 'live' ? 'bg-green-500/20 text-green-400' : 
                      tournament.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' : 
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {tournament.status === 'live' ? 'LIVE NOW' : 
                       tournament.status === 'upcoming' ? 'UPCOMING' : 
                       'REGISTRATION'}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between">
                    <div className="flex items-center text-gray-400 text-xs">
                      <Calendar size={14} className="mr-1" />
                      {tournament.date}
                    </div>
                    <div className="flex items-center text-gray-400 text-xs">
                      <Users size={14} className="mr-1" />
                      {tournament.participants} Players
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="bg-yellow-400/20 px-2 py-1 rounded">
                      <span className="text-yellow-400 text-xs">
                        {tournament.prize}
                      </span>
                    </div>
                    <button 
                      onClick={() => tournament.status === 'live' ? handleStartGame('tournament') : null}
                      className="px-4 py-1.5 bg-primary text-dark text-xs rounded font-medium hover:bg-primary/90 transition-colors"
                    >
                      {tournament.status === 'live' ? 'Join Now' : 
                       tournament.status === 'upcoming' ? 'Reminder' : 
                       'Register'}
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="bg-gradient-to-br from-primary/10 to-tertiary/10 border border-primary/20 border-dashed rounded-lg p-4 flex flex-col items-center justify-center">
                <div className="text-4xl mb-2">🏆</div>
                <h3 className="font-pixel text-primary text-sm mb-2 text-center">
                  Create Your Own Tournament
                </h3>
                <p className="text-gray-400 text-xs text-center mb-4">
                  Challenge friends or your school
                </p>
                <button className="px-4 py-1.5 bg-primary text-dark text-xs rounded font-medium hover:bg-primary/90 transition-colors">
                  Create Now
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  };
  
  const renderLeaderboardScreen = () => {
    // User rank data - in a real app this would come from user profile/API
    const userLeague = {
      type: 'master' as const,
      tier: 2
    };
    const userRegion = 'North America';
    
    return (
      <Leaderboard
        onExit={() => setCurrentScreen('hub')}
        currentUserId="current-user-id"
        userLeague={userLeague}
        userRegion={userRegion}
      />
    );
  };
  
  const renderTrainingScreen = () => {
    return (
      <motion.div 
        className="h-full flex flex-col"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="bg-dark/50 border-b border-primary/30 p-4 flex justify-between items-center"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2">
            <Target size={20} className="text-primary" />
            <h2 className="text-primary font-pixel text-lg">Training Grounds</h2>
          </div>
          <button 
            onClick={() => setCurrentScreen('hub')}
            className="p-2 text-gray-400 hover:text-primary"
          >
            <ArrowLeft size={20} />
          </button>
        </motion.div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          <motion.div variants={itemVariants}>
            <h3 className="font-pixel text-primary mb-4">Practice Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <button 
                onClick={() => handleStartGame('practice')}
                className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 rounded-lg p-6 text-center transition-all hover-scale flex flex-col items-center"
              >
                <div className="w-16 h-16 mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="font-pixel text-blue-400 mb-1">AI Training</h3>
                <p className="text-gray-400 text-xs">Practice with KANA in simulated matches</p>
              </button>
              
              <button 
                onClick={() => setCurrentScreen('friend-battle')}
                className="bg-gradient-to-br from-green-500/20 to-teal-500/20 hover:from-green-500/30 hover:to-teal-500/30 border border-green-500/30 rounded-lg p-6 text-center transition-all hover-scale flex flex-col items-center"
              >
                <div className="w-16 h-16 mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-3xl">🤝</span>
                </div>
                <h3 className="font-pixel text-green-400 mb-1">Friend Battle</h3>
                <p className="text-gray-400 text-xs">Challenge a friend to a private match</p>
              </button>
            </div>
            
            <h3 className="font-pixel text-primary mb-4">Training Categories</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: 'Science', icon: '🔬', color: 'blue' },
                { name: 'Mathematics', icon: '🧮', color: 'purple' },
                { name: 'Literature', icon: '📚', color: 'yellow' },
                { name: 'History', icon: '🏛️', color: 'orange' },
                { name: 'Technology', icon: '💻', color: 'green' },
                { name: 'Arts', icon: '🎨', color: 'pink' }
              ].map(category => (
                <button 
                  key={category.name}
                  onClick={() => handleStartGame('practice')}
                  className={`bg-${category.color}-500/20 border border-${category.color}-500/30 rounded-lg p-4 text-center hover-scale transition-all`}
                >
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className={`font-pixel text-${category.color}-400 text-sm`}>{category.name}</div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  };
  
  return (
    <div className="h-full">
      {renderContent()}
    </div>
  );
};
