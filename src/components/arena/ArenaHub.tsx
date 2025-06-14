import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrophyIcon, ZapIcon, Target, Users, ArrowLeft, Calendar, ChevronRight, Award, Plus, Clock, Crown } from 'lucide-react';
import { QuizGame } from './QuizGame';
import { QuizResults } from './QuizResults';
import { GameSetup, GameSettings } from './GameSetup';
import { Leaderboard } from './Leaderboard';
import { FriendBattle, BattleSettings } from './FriendBattle';
import { apiService } from '../../services/apiService';

interface ArenaHubProps {
  onExit: () => void;
  initialMode?: string;
  featureId?: string;
  subFeatureId?: string;
}

type GameMode = 'quick' | 'ranked' | 'practice' | 'tournament' | null;
type GameSetupScreen = 'quick-setup' | 'ranked-setup' | null;
type ArenaScreen = 'hub' | 'game' | 'results' | 'tournaments' | 'leaderboard' | 'training' | 'friend-battle' | 'create-tournament' | 'tournament-detail';

interface QuizResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: number;
  xpEarned: number;
  inkEarned: number;
}

interface Tournament {
  id: number;
  name: string;
  description?: string;
  creator: {
    id: number;
    username: string;
  };
  max_players: number;
  current_players: number;
  tournament_type: string;
  bracket_type: string;
  status: string;
  has_prizes: boolean;
  first_place_prize?: string;
  second_place_prize?: string;
  third_place_prize?: string;
  prize_type?: string;
  total_questions: number;
  time_limit_minutes: number;
  difficulty_level: string;
  subject_category?: string;
  tournament_start?: string;
  registration_end?: string;
  created_at: string;
  can_join?: boolean;
  is_participant?: boolean;
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

  // Tournament state
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myTournaments, setMyTournaments] = useState<any>({ created: [], participating: [], invited: [] });
  const [tournamentInvitations, setTournamentInvitations] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joiningTournamentId, setJoiningTournamentId] = useState<number | null>(null);

  // Tournament creation form state
  const [tournamentFormData, setTournamentFormData] = useState({
    name: '',
    description: '',
    max_players: 8,
    tournament_type: 'public',
    bracket_type: 'single_elimination',
    total_questions: 20,
    time_limit_minutes: 30,
    difficulty_level: 'mixed',
    subject_category: 'general',
    has_prizes: false,
    first_place_prize: '',
    invited_friends: [] as number[] // Add this line
  });

  // Friend selection state
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);

  // User rank data - in a real app this would come from user profile
  const userRank = {
    tier: 'Silver',
    division: 2,
    points: 1250
  };

  // Load tournament data on component mount and when tournaments screen is accessed
  useEffect(() => {
    if (currentScreen === 'tournaments') {
      loadTournamentData();
    }
  }, [currentScreen]);

  // Load friends when create tournament screen opens
  useEffect(() => {
    if (currentScreen === 'create-tournament') {
      loadFriendsList();
    }
  }, [currentScreen]);

  const loadTournamentData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load all tournament data in parallel
      const [availableTournaments, userTournaments, invitations] = await Promise.allSettled([
        apiService.getTournaments({ limit: 20 }),
        apiService.getMyTournaments(),
        apiService.getMyTournamentInvitations()
      ]);

      if (availableTournaments.status === 'fulfilled') {
        setTournaments(availableTournaments.value);
      } else {
        console.error('Failed to load tournaments:', availableTournaments.reason);
      }

      if (userTournaments.status === 'fulfilled') {
        setMyTournaments(userTournaments.value);
      } else {
        console.error('Failed to load user tournaments:', userTournaments.reason);
      }

      if (invitations.status === 'fulfilled') {
        setTournamentInvitations(invitations.value);
      } else {
        console.error('Failed to load invitations:', invitations.reason);
      }

    } catch (err) {
      console.error('Error loading tournament data:', err);
      setError('Failed to load tournament data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFriendsList = async () => {
    try {
      const friends = await apiService.getFriendsList();
      setFriendsList(friends);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const handleJoinTournament = async (tournamentId: number) => {
    try {
      setJoiningTournamentId(tournamentId);
      await apiService.joinTournament(tournamentId);

      // Reload tournament data to reflect changes
      await loadTournamentData();

      // Show success message
      setError(null);
      console.log('Successfully joined tournament');
    } catch (err: any) {
      console.error('Error joining tournament:', err);
      setError(err.message || 'Failed to join tournament');
    } finally {
      setJoiningTournamentId(null);
    }
  };

  const handleCreateTournament = async (tournamentData: any) => {
    try {
      setIsLoading(true);
      await apiService.createTournament(tournamentData);

      // Reset form
      setTournamentFormData({
        name: '',
        description: '',
        max_players: 8,
        tournament_type: 'public',
        bracket_type: 'single_elimination',
        total_questions: 20,
        time_limit_minutes: 30,
        difficulty_level: 'mixed',
        subject_category: 'general',
        has_prizes: false,
        first_place_prize: '',
        invited_friends: []
      });

      // Reload tournament data and navigate back to tournaments list
      await loadTournamentData();
      setCurrentScreen('tournaments');
      setError(null);

      console.log('Tournament created successfully');
    } catch (err: any) {
      console.error('Error creating tournament:', err);
      setError(err.message || 'Failed to create tournament');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespondToInvitation = async (invitationId: number, accept: boolean) => {
    try {
      setIsLoading(true);
      await apiService.respondToTournamentInvitation(invitationId, accept);

      // Reload tournament data
      await loadTournamentData();
      setError(null);

      console.log(`Invitation ${accept ? 'accepted' : 'declined'}`);
    } catch (err: any) {
      console.error('Error responding to invitation:', err);
      setError(err.message || 'Failed to respond to invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const getTournamentStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'DRAFT' },
      open: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'OPEN' },
      in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'LIVE' },
      completed: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'COMPLETED' },
      cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'CANCELLED' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <div className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </div>
    );
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canJoinTournament = (tournament: Tournament) => {
    // Don't show join button if user is already a participant
    if (tournament.is_participant) {
      return false;
    }

    // Allow joining if tournament is open, draft, or in_progress
    const allowedStatuses = ['open', 'draft', 'in_progress'];

    return allowedStatuses.includes(tournament.status) &&
      (tournament.current_players || 0) < (tournament.max_players || 0);
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

  const handleFriendToggle = (friendId: number) => {
    setSelectedFriends(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
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
        return renderTournamentsScreen();
      case 'tournament-detail':
        return renderTournamentDetailScreen();
      case 'create-tournament':
        return renderCreateTournamentScreen();
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
          {/* Create Tournament Button */}
          <button
            onClick={() => setCurrentScreen('create-tournament')}
            className="px-4 py-2 bg-primary text-dark font-medium rounded hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Create Tournament
          </button>
        </motion.div>

        <div className="flex-1 p-6 overflow-y-auto">
          {/* Tournament Invitations */}
          {tournamentInvitations.length > 0 && (
            <motion.div variants={itemVariants} className="mb-6">
              <h3 className="font-pixel text-yellow-400 mb-3">Pending Invitations</h3>
              <div className="space-y-3">
                {tournamentInvitations.map(invitation => (
                  <div
                    key={invitation.id}
                    className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-white font-medium">{invitation.tournament_name}</h4>
                      <p className="text-gray-400 text-sm">Invited by {invitation.inviter_username}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespondToInvitation(invitation.id, true)}
                        disabled={isLoading}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespondToInvitation(invitation.id, false)}
                        disabled={isLoading}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* My Tournaments */}
          {(myTournaments.created.length > 0 || myTournaments.participating.length > 0) && (
            <motion.div variants={itemVariants} className="mb-6">
              <h3 className="font-pixel text-primary mb-3">My Tournaments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Use a Set to avoid duplicates */}
                {Array.from(new Set([...myTournaments.created, ...myTournaments.participating].map(t => t.id)))
                  .map(id => [...myTournaments.created, ...myTournaments.participating].find(t => t.id === id))
                  .map(tournament => (
                    <div
                      key={`my-tournament-${tournament.id}`}
                      className="bg-dark/30 border border-primary/20 rounded-lg p-4 hover-scale transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedTournament(tournament);
                        setCurrentScreen('tournament-detail');
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-pixel text-primary text-sm">{tournament.name}</h4>
                        {getTournamentStatusBadge(tournament.status)}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                        <div className="flex items-center gap-1">
                          <Users size={12} />
                          {tournament.current_players}/{tournament.max_players}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {tournament.time_limit_minutes}min
                        </div>
                      </div>

                      {tournament.has_prizes && tournament.first_place_prize && (
                        <div className="bg-yellow-400/20 px-2 py-1 rounded text-xs text-yellow-400 inline-block">
                          🏆 {tournament.first_place_prize}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Available Tournaments */}
          <motion.div variants={itemVariants}>
            <h3 className="font-pixel text-primary mb-3">Available Tournaments</h3>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading tournaments...</p>
              </div>
            ) : tournaments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar size={48} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400 mb-2">No tournaments available</p>
                <button
                  onClick={() => setCurrentScreen('create-tournament')}
                  className="text-primary hover:text-primary/80 text-sm"
                >
                  Create the first tournament
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tournaments.map(tournament => (
                  <div
                    key={`available-tournament-${tournament.id}`}
                    className="bg-dark/30 border border-primary/20 rounded-lg p-4 hover-scale transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedTournament(tournament);
                      setCurrentScreen('tournament-detail');
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-pixel text-primary text-sm">
                        {tournament.name}
                      </h3>
                      {getTournamentStatusBadge(tournament.status)}
                    </div>

                    <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                      {tournament.description || 'No description available'}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Users size={12} />
                        {tournament.current_players}/{tournament.max_players} Players
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {tournament.time_limit_minutes}min
                      </div>
                      <div className="flex items-center gap-1">
                        <Target size={12} />
                        {tournament.total_questions} Questions
                      </div>
                      <div className="flex items-center gap-1">
                        <Award size={12} />
                        {tournament.difficulty_level?.replace('_', ' ') || 'Unknown'}
                      </div>
                    </div>

                    {tournament.tournament_start && (
                      <div className="text-xs text-gray-400 mb-3">
                        Starts: {formatDateTime(tournament.tournament_start)}
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      {tournament.has_prizes && tournament.first_place_prize && (
                        <div className="bg-yellow-400/20 px-2 py-1 rounded text-xs text-yellow-400">
                          🏆 {tournament.first_place_prize}
                        </div>
                      )}

                      <div className="flex-1"></div>

                      {/* Show join button only if user is NOT a participant and can join */}
                      {!tournament.is_participant && canJoinTournament(tournament) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinTournament(tournament.id);
                          }}
                          disabled={joiningTournamentId === tournament.id}
                          className="px-3 py-1.5 bg-primary text-dark text-xs rounded font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {joiningTournamentId === tournament.id ? (
                            <>
                              <div className="w-3 h-3 border border-dark border-t-transparent rounded-full animate-spin"></div>
                              Joining...
                            </>
                          ) : (
                            'Join Now'
                          )}
                        </button>
                      )}

                      {/* Show joined status if user is a participant */}
                      {tournament.is_participant && (
                        <div className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs rounded font-medium">
                          ✓ Joined
                        </div>
                      )}

                      {/* Show full status if tournament is full but user isn't a participant */}
                      {!tournament.is_participant &&
                        (tournament.status === 'open' || tournament.status === 'draft' || tournament.status === 'in_progress') &&
                        (tournament.current_players || 0) >= (tournament.max_players || 0) && (
                          <div className="px-3 py-1.5 bg-gray-500/20 text-gray-400 text-xs rounded font-medium">
                            Full
                          </div>
                        )}

                      {/* Show status for completed/cancelled tournaments */}
                      {!tournament.is_participant &&
                        (tournament.status === 'completed' || tournament.status === 'cancelled') && (
                          <div className="px-3 py-1.5 bg-gray-500/20 text-gray-400 text-xs rounded font-medium">
                            {tournament.status === 'completed' ? 'Completed' : 'Cancelled'}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    );
  };

  const renderTournamentDetailScreen = () => {
    if (!selectedTournament) return null;

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
            <TrophyIcon size={20} className="text-primary" />
            <h2 className="text-primary font-pixel text-lg">{selectedTournament?.name || 'Tournament Details'}</h2>
          </div>
          <button
            onClick={() => setCurrentScreen('tournaments')}
            className="p-2 text-gray-400 hover:text-primary"
          >
            <ArrowLeft size={20} />
          </button>
        </motion.div>

        <div className="flex-1 p-6 overflow-y-auto">
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tournament Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-dark/30 border border-primary/20 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-pixel text-primary">Tournament Details</h3>
                    {getTournamentStatusBadge(selectedTournament.status)}
                  </div>

                  <p className="text-gray-300 mb-4">
                    {selectedTournament.description || 'No description available'}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Created by:</span>
                      <div className="text-white">{selectedTournament.creator?.username || 'Unknown'}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Tournament Type:</span>
                      <div className="text-white capitalize">{selectedTournament.tournament_type?.replace('_', ' ') || 'Unknown'}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Bracket Type:</span>
                      <div className="text-white capitalize">{selectedTournament.bracket_type?.replace('_', ' ') || 'Unknown'}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Difficulty:</span>
                      <div className="text-white capitalize">{selectedTournament.difficulty_level?.replace('_', ' ') || 'Unknown'}</div>
                    </div>
                  </div>
                </div>

                {/* Game Settings */}
                <div className="bg-dark/30 border border-primary/20 rounded-lg p-6">
                  <h3 className="font-pixel text-primary mb-4">Game Settings</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl text-primary mb-1">{selectedTournament.total_questions || 0}</div>
                      <div className="text-gray-400">Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl text-primary mb-1">{selectedTournament.time_limit_minutes || 0}</div>
                      <div className="text-gray-400">Minutes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl text-primary mb-1">{selectedTournament.max_players || 0}</div>
                      <div className="text-gray-400">Max Players</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Join/Status */}
                <div className="bg-dark/30 border border-primary/20 rounded-lg p-6">
                  <h3 className="font-pixel text-primary mb-4">Participation</h3>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Players:</span>
                      <span className="text-white">{selectedTournament.current_players || 0}/{selectedTournament.max_players || 0}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${selectedTournament.max_players > 0 ? (selectedTournament.current_players / selectedTournament.max_players) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Enhanced Join Button in Detail View */}
                  {!selectedTournament.is_participant && canJoinTournament(selectedTournament) && (
                    <button
                      onClick={() => handleJoinTournament(selectedTournament.id)}
                      disabled={joiningTournamentId === selectedTournament.id}
                      className="w-full px-4 py-2 bg-primary text-dark font-medium rounded hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {joiningTournamentId === selectedTournament.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin"></div>
                          Joining Tournament...
                        </>
                      ) : (
                        'Join Tournament'
                      )}
                    </button>
                  )}

                  {selectedTournament.is_participant && (
                    <div className="w-full px-4 py-2 bg-green-500/20 text-green-400 font-medium rounded text-center">
                      ✓ You're registered
                    </div>
                  )}

                  {/* Show full status if tournament is full but user isn't a participant */}
                  {!selectedTournament.is_participant &&
                    (selectedTournament.status === 'open' || selectedTournament.status === 'draft' || selectedTournament.status === 'in_progress') &&
                    (selectedTournament.current_players || 0) >= (selectedTournament.max_players || 0) && (
                      <div className="w-full px-4 py-2 bg-gray-500/20 text-gray-400 font-medium rounded text-center">
                        Tournament Full
                      </div>
                    )}

                  {/* Show status for completed/cancelled tournaments */}
                  {!selectedTournament.is_participant &&
                    (selectedTournament.status === 'completed' || selectedTournament.status === 'cancelled') && (
                      <div className="w-full px-4 py-2 bg-gray-500/20 text-gray-400 font-medium rounded text-center">
                        {selectedTournament.status === 'completed' ? 'Tournament Completed' : 'Tournament Cancelled'}
                      </div>
                    )}
                </div>

                {/* Prize Pool */}
                {selectedTournament.has_prizes && (
                  <div className="bg-dark/30 border border-yellow-500/30 rounded-lg p-6">
                    <h3 className="font-pixel text-yellow-400 mb-4">Prize Pool</h3>
                    <div className="space-y-2 text-sm">
                      {selectedTournament.first_place_prize && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">🥇 1st Place:</span>
                          <span className="text-yellow-400">{selectedTournament.first_place_prize}</span>
                        </div>
                      )}
                      {selectedTournament.second_place_prize && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">🥈 2nd Place:</span>
                          <span className="text-yellow-400">{selectedTournament.second_place_prize}</span>
                        </div>
                      )}
                      {selectedTournament.third_place_prize && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">🥉 3rd Place:</span>
                          <span className="text-yellow-400">{selectedTournament.third_place_prize}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Schedule */}
                <div className="bg-dark/30 border border-primary/20 rounded-lg p-6">
                  <h3 className="font-pixel text-primary mb-4">Schedule</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Created:</span>
                      <div className="text-white">{formatDateTime(selectedTournament.created_at)}</div>
                    </div>
                    {selectedTournament.registration_end && (
                      <div>
                        <span className="text-gray-400">Registration Ends:</span>
                        <div className="text-white">{formatDateTime(selectedTournament.registration_end)}</div>
                      </div>
                    )}
                    {selectedTournament.tournament_start && (
                      <div>
                        <span className="text-gray-400">Starts:</span>
                        <div className="text-white">{formatDateTime(selectedTournament.tournament_start)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  const renderCreateTournamentScreen = () => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      const tournamentData = {
        name: tournamentFormData.name,
        description: tournamentFormData.description,
        max_players: tournamentFormData.max_players,
        tournament_type: tournamentFormData.tournament_type,
        bracket_type: tournamentFormData.bracket_type,
        prize_config: {
          has_prizes: tournamentFormData.has_prizes,
          first_place_prize: tournamentFormData.has_prizes ? tournamentFormData.first_place_prize : undefined,
          prize_type: 'tokens'
        },
        question_config: {
          total_questions: tournamentFormData.total_questions,
          time_limit_minutes: tournamentFormData.time_limit_minutes,
          difficulty_level: tournamentFormData.difficulty_level,
          subject_category: tournamentFormData.subject_category,
          custom_topics: [tournamentFormData.subject_category]
        },
        invited_users: selectedFriends // Add invited friends
      };

      handleCreateTournament(tournamentData);
    };

    const handleFormChange = (field: string, value: any) => {
      setTournamentFormData(prev => ({ ...prev, [field]: value }));
    };

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
            <Plus size={20} className="text-primary" />
            <h2 className="text-primary font-pixel text-lg">Create Tournament</h2>
          </div>
          <button
            onClick={() => {
              setCurrentScreen('tournaments');
              setSelectedFriends([]); // Reset selected friends
            }}
            className="p-2 text-gray-400 hover:text-primary"
          >
            <ArrowLeft size={20} />
          </button>
        </motion.div>

        <div className="flex-1 p-6 overflow-y-auto">
          <motion.form onSubmit={handleSubmit} variants={itemVariants} className="max-w-2xl mx-auto space-y-6">
            {/* Basic Info */}
            <div className="bg-dark/30 border border-primary/20 rounded-lg p-6">
              <h3 className="font-pixel text-primary mb-4">Basic Information</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Tournament Name *</label>
                  <input
                    type="text"
                    value={tournamentFormData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full bg-dark/50 border border-gray-600 rounded px-3 py-2 text-white focus:border-primary focus:outline-none"
                    placeholder="Enter tournament name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Description</label>
                  <textarea
                    value={tournamentFormData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    className="w-full bg-dark/50 border border-gray-600 rounded px-3 py-2 text-white focus:border-primary focus:outline-none"
                    placeholder="Describe your tournament"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Max Players</label>
                    <select
                      value={tournamentFormData.max_players}
                      onChange={(e) => handleFormChange('max_players', parseInt(e.target.value))}
                      className="w-full bg-dark/50 border border-gray-600 rounded px-3 py-2 text-white focus:border-primary focus:outline-none"
                    >
                      <option value={4}>4 Players</option>
                      <option value={8}>8 Players</option>
                      <option value={16}>16 Players</option>
                      <option value={32}>32 Players</option>
                      <option value={64}>64 Players</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Tournament Type</label>
                    <select
                      value={tournamentFormData.tournament_type}
                      onChange={(e) => handleFormChange('tournament_type', e.target.value)}
                      className="w-full bg-dark/50 border border-gray-600 rounded px-3 py-2 text-white focus:border-primary focus:outline-none"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="invite_only">Invite Only</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Friend Invitations */}
            <div className="bg-dark/30 border border-primary/20 rounded-lg p-6">
              <h3 className="font-pixel text-primary mb-4">Invite Friends</h3>

              {friendsList.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">No friends available to invite</p>
                  <p className="text-gray-500 text-xs mt-1">Add friends first to invite them to tournaments</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-300 text-sm mb-3">
                    Select friends to invite to your tournament ({selectedFriends.length} selected)
                  </p>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {friendsList.map(friend => (
                      <label
                        key={friend.id}
                        className="flex items-center gap-3 p-3 bg-dark/50 rounded-lg hover:bg-dark/70 transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFriends.includes(friend.id)}
                          onChange={() => handleFriendToggle(friend.id)}
                          className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary focus:ring-2"
                        />

                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-pixel text-sm">
                          {friend.avatar || friend.username.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1">
                          <div className="text-white text-sm font-medium">
                            {friend.fname && friend.lname ? `${friend.fname} ${friend.lname}` : friend.username}
                          </div>
                          {friend.fname && friend.lname && (
                            <div className="text-gray-400 text-xs">@{friend.username}</div>
                          )}
                        </div>

                        <div className="text-xs text-gray-400">
                          {selectedFriends.includes(friend.id) && (
                            <span className="text-primary">✓ Selected</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  {selectedFriends.length > 0 && (
                    <div className="mt-3 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                      <p className="text-primary text-sm font-medium mb-1">
                        {selectedFriends.length} friend(s) will be invited:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedFriends.map(friendId => {
                          const friend = friendsList.find(f => f.id === friendId);
                          return friend ? (
                            <span
                              key={friendId}
                              className="px-2 py-1 bg-primary/20 text-primary text-xs rounded flex items-center gap-1"
                            >
                              {friend.fname && friend.lname ? `${friend.fname} ${friend.lname}` : friend.username}
                              <button
                                type="button"
                                onClick={() => handleFriendToggle(friendId)}
                                className="ml-1 text-primary hover:text-primary/70"
                              >
                                ×
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedFriends(friendsList.map(f => f.id))}
                      className="px-3 py-1 bg-primary/20 text-primary text-xs rounded hover:bg-primary/30 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFriends([])}
                      className="px-3 py-1 bg-gray-600/20 text-gray-400 text-xs rounded hover:bg-gray-600/30 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Game Settings */}
            <div className="bg-dark/30 border border-primary/20 rounded-lg p-6">
              <h3 className="font-pixel text-primary mb-4">Game Settings</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Questions</label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={tournamentFormData.total_questions}
                    onChange={(e) => handleFormChange('total_questions', parseInt(e.target.value))}
                    className="w-full bg-dark/50 border border-gray-600 rounded px-3 py-2 text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Time Limit (minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={tournamentFormData.time_limit_minutes}
                    onChange={(e) => handleFormChange('time_limit_minutes', parseInt(e.target.value))}
                    className="w-full bg-dark/50 border border-gray-600 rounded px-3 py-2 text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Difficulty</label>
                  <select
                    value={tournamentFormData.difficulty_level}
                    onChange={(e) => handleFormChange('difficulty_level', e.target.value)}
                    className="w-full bg-dark/50 border border-gray-600 rounded px-3 py-2 text-white focus:border-primary focus:outline-none"
                  >
                    <option value="elementary">Elementary</option>
                    <option value="middle_school">Middle School</option>
                    <option value="high_school">High School</option>
                    <option value="university">University</option>
                    <option value="professional">Professional</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Subject</label>
                  <select
                    value={tournamentFormData.subject_category}
                    onChange={(e) => handleFormChange('subject_category', e.target.value)}
                    className="w-full bg-dark/50 border border-gray-600 rounded px-3 py-2 text-white focus:border-primary focus:outline-none"
                  >
                    <option value="general">General Knowledge</option>
                    <option value="science">Science</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="literature">Literature</option>
                    <option value="history">History</option>
                    <option value="technology">Technology</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Prizes */}
            <div className="bg-dark/30 border border-primary/20 rounded-lg p-6">
              <h3 className="font-pixel text-primary mb-4">Prizes (Optional)</h3>

              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tournamentFormData.has_prizes}
                    onChange={(e) => handleFormChange('has_prizes', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-gray-300">Enable prizes</span>
                </label>

                {tournamentFormData.has_prizes && (
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">First Place Prize</label>
                    <input
                      type="text"
                      value={tournamentFormData.first_place_prize}
                      onChange={(e) => handleFormChange('first_place_prize', e.target.value)}
                      className="w-full bg-dark/50 border border-gray-600 rounded px-3 py-2 text-white focus:border-primary focus:outline-none"
                      placeholder="e.g., 1000 INK tokens"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setCurrentScreen('tournaments');
                  setSelectedFriends([]);
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !tournamentFormData.name}
                className="flex-1 px-4 py-2 bg-primary text-dark font-medium rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : selectedFriends.length > 0 ? `Create & Invite ${selectedFriends.length} Friend(s)` : 'Create Tournament'}
              </button>
            </div>
          </motion.form>
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
                  className="bg-dark/30 border border-primary/20 hover:border-primary/50 rounded-lg p-4 text-center transition-all hover-scale flex flex-col items-center"
                >
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className={`font-pixel text-${category.color}-400 text-sm`}>{category.name}</div>
                </button>
              ))}
            </div>
          </motion.div>
        </div >
      </motion.div >
    );
  };

  return (
    <div className="h-full">
      {renderContent()}
    </div>
  );
};
