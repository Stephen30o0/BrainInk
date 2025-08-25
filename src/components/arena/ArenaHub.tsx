import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrophyIcon, ZapIcon, Target, ArrowLeft, Calendar, ChevronRight, Award } from 'lucide-react';
import { QuizGame } from './QuizGame';
import { QuizResults } from './QuizResults';
import { GameSetup, GameSettings } from './GameSetup';
import { Leaderboard } from './Leaderboard';
import { FriendBattle, BattleSettings } from './FriendBattle';
import { UnifiedTournamentHub } from './UnifiedTournamentHub';
import { QuizMatch } from '../tournaments/QuizMatch';
import { useWallet } from '../shared/WalletContext';

interface ArenaHubProps {
  onExit: () => void;
  initialMode?: string;
  featureId?: string;
  subFeatureId?: string;
}

type GameMode = 'quick' | 'ranked' | 'practice' | 'tournament' | null;
type GameSetupScreen = 'quick-setup' | 'ranked-setup' | null;
type ArenaScreen = 'hub' | 'game' | 'results' | 'tournaments' | 'leaderboard' | 'training' | 'friend-battle' | 'create-tournament' | 'tournament-detail' | 'tournament-match';

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
  const { address: userAddress } = useWallet();

  const [currentScreen, setCurrentScreen] = useState<ArenaScreen>(
    featureId === 'tournament' ? 'tournaments' :
      featureId === 'practice' ? 'training' :
        featureId === 'leaderboard' ? 'leaderboard' : 'hub'
  );
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [setupScreen, setSetupScreen] = useState<GameSetupScreen>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // Tournament state (simplified for new components)
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  // User rank data - in a real app this would come from user profile
  const userRank = {
    tier: 'Silver',
    division: 2,
    points: 1250
  };

  const handleMatchComplete = () => {
    setCurrentScreen('tournaments');
    setSelectedMatchId(null);
  };

  // Auto-start specific game modes based on subFeatureId
  useEffect(() => {
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
        return (
          <UnifiedTournamentHub
            onBack={() => setCurrentScreen('hub')}
            onStartQuiz={(tournamentId) => {
              setSelectedTournamentId(tournamentId);
              setCurrentScreen('tournament-match');
            }}
          />
        );
      case 'tournament-match':
        if (!selectedMatchId || !selectedTournamentId) {
          return renderHubScreen();
        }
        return (
          <QuizMatch
            tournamentId={selectedTournamentId}
            matchId={selectedMatchId}
            userAddress={userAddress || ''}
            onMatchComplete={handleMatchComplete}
          />
        );
      case 'tournament-detail':
        // TODO: Implement tournament detail view if needed
        return renderHubScreen();
      case 'create-tournament':
        // TODO: Implement create tournament view if needed  
        return renderHubScreen();
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
        className="h-full flex flex-col bg-white"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="bg-white shadow-sm border-b border-gray-200 p-6 flex justify-between items-center"
          variants={itemVariants}
        >
          <div className="flex items-center gap-3">
            <TrophyIcon size={24} className="text-red-500" />
            <h2 className="text-gray-800 font-bold text-xl">Battle Arena</h2>
          </div>
          <button
            onClick={onExit}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={20} />
          </button>
        </motion.div>

        <div className="flex-1 p-8 overflow-y-auto">
          {/* Quick access buttons */}
          <motion.div
            className="grid grid-cols-2 gap-6 mb-8"
            variants={itemVariants}
          >
            <button
              onClick={() => handleStartGame('quick')}
              className="bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl p-6 text-center transition-all hover-scale shadow-lg"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
                <ZapIcon size={24} className="text-white" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-4">Quick Match</h3>
              <p className="text-gray-600 text-sm">Fast 5-question battle</p>
            </button>

            <button
              onClick={() => handleStartGame('ranked')}
              className="bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl p-6 text-center transition-all hover-scale shadow-lg"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
                <Award size={24} className="text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Ranked Match</h3>
              <p className="text-white/80 text-sm">Compete for leaderboard position</p>
            </button>
          </motion.div>

          {/* Feature sections */}
          <motion.div variants={itemVariants}>
            <h3 className="font-bold text-gray-800 text-lg mb-4">Arena Features</h3>

            <div className="space-y-4">
              {/* Tournaments */}
              <button
                onClick={() => setCurrentScreen('tournaments')}
                className="w-full bg-white border border-gray-200 hover:border-blue-300 rounded-lg p-4 flex items-center justify-between transition-all hover-scale shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Calendar size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-gray-800 font-semibold">Tournaments</h4>
                    <p className="text-gray-600 text-sm">Join or create knowledge competitions</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </button>

              {/* Training */}
              <button
                onClick={() => setCurrentScreen('training')}
                className="w-full bg-white border border-gray-200 hover:border-blue-300 rounded-lg p-4 flex items-center justify-between transition-all hover-scale shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <Target size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-gray-800 font-semibold">Training Grounds</h4>
                    <p className="text-gray-600 text-sm">Practice with AI or challenge friends</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </button>

              {/* Leaderboard */}
              <button
                onClick={() => setCurrentScreen('leaderboard')}
                className="w-full bg-white border border-gray-200 hover:border-blue-300 rounded-lg p-4 flex items-center justify-between transition-all hover-scale shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                    <TrophyIcon size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-gray-800 font-semibold">Leaderboard</h4>
                    <p className="text-gray-600 text-sm">See who's on top and climb the ranks</p>
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
        className="h-full flex flex-col bg-white"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="bg-white shadow-sm border-b border-gray-200 p-6 flex justify-between items-center"
          variants={itemVariants}
        >
          <div className="flex items-center gap-3">
            <Target size={24} className="text-green-600" />
            <h2 className="text-gray-800 font-bold text-xl">Training Grounds</h2>
          </div>
          <button
            onClick={() => setCurrentScreen('hub')}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={20} />
          </button>
        </motion.div>

        <div className="flex-1 p-8 overflow-y-auto">
          <motion.div variants={itemVariants}>
            <h3 className="font-bold text-gray-800 text-lg mb-6">Practice Options</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <button
                onClick={() => handleStartGame('practice')}
                className="bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl p-6 text-center transition-all hover-scale shadow-lg flex flex-col items-center"
              >
                <div className="w-16 h-16 mb-4 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="font-bold text-lg mb-2">AI Training</h3>
                <p className="text-white/80 text-sm">Practice with KANA in simulated matches</p>
              </button>

              <button
                onClick={() => setCurrentScreen('friend-battle')}
                className="bg-gradient-to-br from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-xl p-6 text-center transition-all hover-scale shadow-lg flex flex-col items-center"
              >
                <div className="w-16 h-16 mb-4 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-3xl">🤝</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Friend Battle</h3>
                <p className="text-white/80 text-sm">Challenge a friend to a private match</p>
              </button>
            </div>

            <h3 className="font-bold text-gray-800 text-lg mb-6">Training Categories</h3>

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
                  className="bg-white border border-gray-200 hover:border-blue-300 rounded-lg p-4 text-center transition-all hover-scale shadow-sm flex flex-col items-center"
                >
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className="font-semibold text-gray-800 text-sm">{category.name}</div>
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
