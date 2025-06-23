import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrophyIcon, 
  ZapIcon, 
  Users, 
  Clock, 
  Coins, 
  Plus, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Crown,
  Target,
  Timer,
  Award,
  RefreshCw
} from 'lucide-react';
import { useWallet } from '../shared/WalletContext';
import { tournamentService } from '../../services/tournamentService';
import { formatUnits } from 'ethers';

interface Tournament {
  id: number;
  name: string;
  creator: string;
  entryFee: string;
  maxParticipants: number;
  currentParticipants: number;
  prizePool: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
  isCompleted: boolean;
  participants: string[];
  winner: string;
}

interface TournamentHubProps {
  onBack: () => void;
  onStartQuiz?: (tournamentId: number) => void;
}

export const TournamentHub: React.FC<TournamentHubProps> = ({ onBack, onStartQuiz }) => {
  const { balance, address, isConnected, provider, signer, inkTokenContract } = useWallet();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joiningTournamentId, setJoiningTournamentId] = useState<number | null>(null);
  const [userBalance, setUserBalance] = useState<string>('0');

  // Create tournament form state
  const [createForm, setCreateForm] = useState({
    name: '',
    entryFee: '10',
    maxParticipants: 8,
    durationHours: 2
  });

  useEffect(() => {
    if (isConnected && provider && signer && address) {
      initializeTournamentService();
      loadTournaments();
      loadUserBalance();
    }
  }, [isConnected, provider, signer, address]);

  const initializeTournamentService = async () => {
    if (!provider || !signer || !address) return;
    
    try {
      await tournamentService.initialize(provider, signer, address);
      
      // Set up event listeners
      tournamentService.onTournamentCreated((id, name, creator, entryFee) => {
        console.log(`Tournament created: ${name} (ID: ${id})`);
        loadTournaments();
      });

      tournamentService.onPlayerJoined((id, player) => {
        console.log(`Player ${player} joined tournament ${id}`);
        loadTournaments();
      });

      tournamentService.onTournamentEnded((id, winner, prize) => {
        console.log(`Tournament ${id} ended. Winner: ${winner}, Prize: ${prize}`);
        loadTournaments();
      });
    } catch (err) {
      console.error('Failed to initialize tournament service:', err);
      setError('Failed to connect to tournament system');
    }
  };

  const loadUserBalance = async () => {
    try {
      const inkBalance = await tournamentService.getINKBalance();
      setUserBalance(inkBalance);
    } catch (err) {
      console.error('Failed to load INK balance:', err);
    }
  };

  const loadTournaments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tournamentsData = await tournamentService.getAllTournamentsWithDetails();
      setTournaments(tournamentsData);
    } catch (err) {
      console.error('Failed to load tournaments:', err);
      setError('Failed to load tournaments');
    } finally {
      setIsLoading(false);
    }
  };

  const forceRefreshTournaments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Force a complete refresh by re-initializing if needed
      if (provider && signer && address) {
        await tournamentService.initialize(provider, signer, address);
      }
      
      const tournamentsData = await tournamentService.getAllTournamentsWithDetails();
      setTournaments(tournamentsData);
      console.log('Force refreshed tournaments:', tournamentsData);
    } catch (err) {
      console.error('Failed to force refresh tournaments:', err);
      setError('Failed to load tournaments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTournament = async () => {
    if (!createForm.name.trim()) {
      setError('Tournament name is required');
      return;
    }

    if (parseFloat(createForm.entryFee) <= 0) {
      setError('Entry fee must be greater than 0');
      return;
    }

    if (parseFloat(userBalance) < parseFloat(createForm.entryFee)) {
      setError('Insufficient INK balance to create tournament');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await tournamentService.createTournament(
        createForm.name,
        createForm.entryFee,
        createForm.maxParticipants,
        createForm.durationHours
      );

      setShowCreateForm(false);
      setCreateForm({
        name: '',
        entryFee: '10',
        maxParticipants: 8,
        durationHours: 2
      });
      
      await loadTournaments();
      await loadUserBalance();
    } catch (err: any) {
      console.error('Failed to create tournament:', err);
      setError(err.message || 'Failed to create tournament');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinTournament = async (tournament: Tournament) => {
    if (parseFloat(userBalance) < parseFloat(formatUnits(tournament.entryFee, 18))) {
      setError('Insufficient INK balance to join tournament');
      return;
    }

    setJoiningTournamentId(tournament.id);
    setError(null);

    try {
      await tournamentService.joinTournament(tournament.id);
      await loadTournaments();
      await loadUserBalance();
      
      if (onStartQuiz) {
        onStartQuiz(tournament.id);
      }    } catch (err: any) {
      console.error('Failed to join tournament:', err);      // Handle specific error cases
      if (err.message?.includes('Already joined') || err.reason?.includes('Already joined')) {
        setError('✅ You have already joined this tournament! Look for the "Start Quiz" button below. This message will disappear in 8 seconds...');
        
        // Double-check the user's status and force refresh tournaments
        const isUserInContract = await checkUserInTournamentFromContract(tournament.id);
        console.log(`Contract check: User is ${isUserInContract ? '' : 'NOT '}in tournament ${tournament.id}`);
        
        // Force refresh to get the most up-to-date data
        await forceRefreshTournaments();
        // Clear error after longer delay to give user time to read and see the UI change
        setTimeout(() => setError(null), 8000);
      } else if (err.message?.includes('Insufficient balance')) {
        setError('Insufficient INK balance to join tournament');
      } else if (err.message?.includes('Tournament full')) {
        setError('Tournament is full');
      } else {
        setError(err.message || 'Failed to join tournament');
      }
    } finally {
      setJoiningTournamentId(null);
    }
  };
  const isUserInTournament = (tournament: Tournament): boolean => {
    return address ? tournament.participants.includes(address) : false;
  };

  const checkUserInTournamentFromContract = async (tournamentId: number): Promise<boolean> => {
    if (!address) return false;
    
    try {
      return await tournamentService.isUserInTournament(tournamentId, address);
    } catch (error) {
      console.error('Error checking user tournament status:', error);
      return false;
    }
  };

  const getTimeRemaining = (endTime: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = endTime - now;
    
    if (remaining <= 0) return 'Ended';
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <TrophyIcon size={64} className="text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-pixel text-primary mb-4">Connect Wallet</h2>
          <p className="text-gray-400 mb-6">Connect your wallet to participate in tournaments</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-primary/20 border border-primary/30 text-primary rounded font-pixel hover:bg-primary/30"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-primary"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-pixel text-primary">INK Tournaments</h1>
              <p className="text-gray-400">Compete with INK tokens, win big prizes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-dark/50 border border-yellow-400/30 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Coins size={20} className="text-yellow-400" />
                <span className="text-yellow-400 font-pixel">{parseFloat(userBalance).toFixed(2)} INK</span>
              </div>
            </div>            <button
              onClick={() => {
                forceRefreshTournaments();
                loadUserBalance();
              }}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-dark border border-primary/30 text-primary rounded font-pixel hover:bg-primary/20 disabled:opacity-50"
              title="Refresh tournaments"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 text-primary rounded font-pixel hover:bg-primary/30"
            >
              <Plus size={20} />
              Create Tournament
            </button>
          </div>
        </div>        {error && (
          <div className={`border rounded-lg p-4 mb-6 ${
            error.includes('already joined') || error.includes('Already joined') 
              ? 'bg-blue-500/20 border-blue-500/30' 
              : 'bg-red-500/20 border-red-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {error.includes('already joined') || error.includes('Already joined') ? (
                  <CheckCircle size={20} className="text-blue-400" />
                ) : (
                  <AlertCircle size={20} className="text-red-400" />
                )}
                <span className={
                  error.includes('already joined') || error.includes('Already joined') 
                    ? 'text-blue-400' 
                    : 'text-red-400'
                }>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Tournaments Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-dark/50 border border-primary/20 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-600 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : tournaments.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <TrophyIcon size={64} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-pixel text-gray-400 mb-2">No Active Tournaments</h3>
              <p className="text-gray-500">Be the first to create a tournament!</p>
            </div>
          ) : (
            tournaments.map((tournament) => {
              const userInTournament = isUserInTournament(tournament);
              const isFull = tournament.currentParticipants >= tournament.maxParticipants;
              const timeRemaining = getTimeRemaining(tournament.endTime);
              const entryFeeFormatted = parseFloat(formatUnits(tournament.entryFee, 18)).toFixed(2);
              const prizePoolFormatted = parseFloat(formatUnits(tournament.prizePool, 18)).toFixed(2);

              return (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-dark/50 border border-primary/20 rounded-lg p-6 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-pixel text-primary truncate">{tournament.name}</h3>
                    {tournament.isCompleted && (
                      <Crown size={20} className="text-yellow-400" />
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Entry Fee:</span>
                      <div className="flex items-center gap-1">
                        <Coins size={16} className="text-yellow-400" />
                        <span className="text-yellow-400 font-pixel">{entryFeeFormatted} INK</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Prize Pool:</span>
                      <div className="flex items-center gap-1">
                        <Award size={16} className="text-green-400" />
                        <span className="text-green-400 font-pixel">{prizePoolFormatted} INK</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Players:</span>
                      <div className="flex items-center gap-1">
                        <Users size={16} className="text-blue-400" />
                        <span className="text-blue-400">{tournament.currentParticipants}/{tournament.maxParticipants}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Time Left:</span>
                      <div className="flex items-center gap-1">
                        <Timer size={16} className="text-orange-400" />
                        <span className="text-orange-400">{timeRemaining}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  {tournament.isCompleted ? (
                    <div className="text-center py-2">
                      <span className="text-gray-500 font-pixel">Tournament Ended</span>
                      {tournament.winner && (
                        <div className="text-sm text-yellow-400 mt-1">
                          Winner: {tournament.winner.slice(0, 6)}...{tournament.winner.slice(-4)}
                        </div>
                      )}
                    </div>                  ) : userInTournament ? (
                    <button
                      onClick={() => onStartQuiz && onStartQuiz(tournament.id)}
                      className="w-full py-3 bg-green-500/30 border-2 border-green-400/50 text-green-300 rounded font-pixel hover:bg-green-500/40 transition-all duration-200 animate-pulse"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Target size={20} />
                        🎯 Start Quiz Now!
                      </div>
                    </button>
                  ) : isFull ? (
                    <button
                      disabled
                      className="w-full py-3 bg-gray-500/20 border border-gray-500/30 text-gray-500 rounded font-pixel cursor-not-allowed"
                    >
                      Tournament Full
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinTournament(tournament)}
                      disabled={joiningTournamentId === tournament.id}
                      className="w-full py-3 bg-primary/20 border border-primary/30 text-primary rounded font-pixel hover:bg-primary/30 disabled:opacity-50"
                    >
                      {joiningTournamentId === tournament.id ? (
                        'Joining...'
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <ZapIcon size={20} />
                          Join Tournament
                        </div>
                      )}
                    </button>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {/* Create Tournament Modal */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-dark border border-primary/30 rounded-lg p-6 w-full max-w-md"
              >
                <h3 className="text-xl font-pixel text-primary mb-6">Create Tournament</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Tournament Name</label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-primary"
                      placeholder="Enter tournament name"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Entry Fee (INK)</label>
                    <input
                      type="number"
                      value={createForm.entryFee}
                      onChange={(e) => setCreateForm({ ...createForm, entryFee: e.target.value })}
                      className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-primary"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Max Participants</label>
                    <select
                      value={createForm.maxParticipants}
                      onChange={(e) => setCreateForm({ ...createForm, maxParticipants: parseInt(e.target.value) })}
                      className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-primary"
                    >
                      <option value={4}>4 Players</option>
                      <option value={8}>8 Players</option>
                      <option value={16}>16 Players</option>
                      <option value={32}>32 Players</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Duration (Hours)</label>
                    <select
                      value={createForm.durationHours}
                      onChange={(e) => setCreateForm({ ...createForm, durationHours: parseInt(e.target.value) })}
                      className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-primary"
                    >
                      <option value={1}>1 Hour</option>
                      <option value={2}>2 Hours</option>
                      <option value={4}>4 Hours</option>
                      <option value={8}>8 Hours</option>
                      <option value={24}>24 Hours</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 py-2 bg-gray-500/20 border border-gray-500/30 text-gray-400 rounded font-pixel hover:bg-gray-500/30"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTournament}
                    disabled={isLoading}
                    className="flex-1 py-2 bg-primary/20 border border-primary/30 text-primary rounded font-pixel hover:bg-primary/30 disabled:opacity-50"
                  >
                    {isLoading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
