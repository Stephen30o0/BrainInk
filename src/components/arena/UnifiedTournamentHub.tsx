import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrophyIcon,
    Users,
    Clock,
    Coins,
    Plus,
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    Crown,
    Target,
    RefreshCw,
    Play,
    Zap,
    BookOpen,
    Brain
} from 'lucide-react';
import { backendTournamentService, BackendTournament } from '../../services/backendTournamentService';
import { useWallet } from '../shared/WalletContext';
import { TournamentCreation } from '../tournaments/TournamentCreation';

interface TournamentHubProps {
    onBack: () => void;
    onStartQuiz?: (tournamentId: string) => void;
}

export const UnifiedTournamentHub: React.FC<TournamentHubProps> = ({ onBack, onStartQuiz }) => {
    const { address, provider, signer } = useWallet();
    const userAddress = address || '';

    const [tournaments, setTournaments] = useState<BackendTournament[]>([]);
    const [myTournaments, setMyTournaments] = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'my' | 'invitations' | 'create'>('all');
    const [backendConnected, setBackendConnected] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const [debugScrollButtons, setDebugScrollButtons] = useState(false);
    const [inkBalance, setInkBalance] = useState<string>('0');
    const [inkTokenInfo, setInkTokenInfo] = useState<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        initializeService();
    }, [userAddress, provider, signer]);

    const initializeService = async () => {
        try {
            backendTournamentService.initialize(userAddress, provider || undefined, signer || undefined);
            const isHealthy = await backendTournamentService.checkBackendHealth();
            setBackendConnected(isHealthy);

            if (isHealthy) {
                await loadData();
                await loadInkTokenInfo();
            } else {
                setError('Backend API is not available. Please ensure the server is running on localhost:10000');
            }
        } catch (err: any) {
            setError(`Failed to connect to backend: ${err.message}`);
        }
    };

    const loadInkTokenInfo = async () => {
        try {
            if (provider && signer) {
                const balance = await backendTournamentService.getINKBalance();
                const tokenInfo = await backendTournamentService.getINKTokenInfo();
                setInkBalance(balance);
                setInkTokenInfo(tokenInfo);
            }
        } catch (err) {
            console.warn('Failed to load INK token info:', err);
        }
    };

    const loadData = async () => {
        if (!userAddress || userAddress.trim() === '') {
            setError('User address is required. Please connect your wallet.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('Loading tournament data for user:', userAddress);

            // First test backend connection
            const connectionTest = await backendTournamentService.testConnection();
            if (!connectionTest.connected) {
                setError(`Backend connection failed: ${connectionTest.message}. Please ensure the tournament backend is running.`);
                return;
            }

            // Load all public tournaments
            const tournamentsResult = await backendTournamentService.getTournaments({
                is_public: true,
                limit: 20
            });
            setTournaments(tournamentsResult.tournaments);

            // Load user's tournaments
            const myTournamentsResult = await backendTournamentService.getMyTournaments(userAddress.toLowerCase().trim());
            setMyTournaments(myTournamentsResult.tournaments);

            // Load pending invitations
            const invitationsResult = await backendTournamentService.getMyInvitations(userAddress.toLowerCase().trim(), 'pending');
            setInvitations(invitationsResult.invitations);

            // Load INK token balance
            const balance = await backendTournamentService.getINKBalance();
            setInkBalance(balance);

            // Load INK token info
            const tokenInfo = await backendTournamentService.getINKTokenInfo();
            setInkTokenInfo(tokenInfo);

        } catch (err: any) {
            setError(err.message || 'Failed to load tournament data');
            console.error('Load data error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinTournament = async (tournamentId: string) => {
        if (!userAddress || userAddress.trim() === '') {
            setError('User address is required. Please connect your wallet.');
            return;
        }

        try {
            setError(null);
            console.log('Joining tournament:', tournamentId, 'with user:', userAddress);
            await backendTournamentService.joinTournament(tournamentId, userAddress.toLowerCase().trim());
            await loadData(); // Refresh data

            // If onStartQuiz is provided and joining is successful, start the quiz
            if (onStartQuiz) {
                onStartQuiz(tournamentId);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to join tournament');
            console.error('Join tournament error:', err);
        }
    };

    const handleStartTournament = async (tournamentId: string) => {
        try {
            setError(null);
            await backendTournamentService.startTournament(tournamentId, userAddress);
            await loadData(); // Refresh data
        } catch (err: any) {
            setError(err.message || 'Failed to start tournament');
        }
    };

    const handleRespondToInvitation = async (invitationId: string, response: 'accept' | 'decline') => {
        try {
            setError(null);
            await backendTournamentService.respondToInvitation(invitationId, userAddress, response);
            await loadData(); // Refresh data
        } catch (err: any) {
            setError(err.message || `Failed to ${response} invitation`);
        }
    };

    const TournamentCard: React.FC<{ tournament: BackendTournament; showActions?: boolean }> = ({
        tournament,
        showActions = true
    }) => {
        const isCreator = tournament.creator_address === userAddress;
        const isParticipant = tournament.participants.includes(userAddress);
        const canJoin = !isCreator && !isParticipant && tournament.status === 'registration';
        const canStart = isCreator && tournament.status === 'registration' && tournament.current_players >= 2;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                className="group relative bg-gradient-to-br from-dark/40 via-dark/30 to-dark/20 backdrop-blur-md border border-primary/20 rounded-xl p-6 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 overflow-hidden"
            >
                {/* Background Gradient Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Tournament Header */}
                <div className="relative z-10 flex justify-between items-start mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <TrophyIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors duration-300">
                                    {tournament.name}
                                </h3>
                                {tournament.description && (
                                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{tournament.description}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg ${tournament.status === 'registration'
                            ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border border-blue-500/30'
                            : tournament.status === 'active'
                                ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 border border-green-500/30'
                                : 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-300 border border-gray-500/30'
                            }`}>
                            {tournament.status}
                        </span>
                        {(isCreator || isParticipant) && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${isCreator
                                ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 border border-purple-500/30'
                                : 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border border-blue-500/30'
                                }`}>
                                {isCreator ? <Crown size={12} /> : <CheckCircle size={12} />}
                                {isCreator ? 'Creator' : 'Joined'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Tournament Stats Grid */}
                <div className="relative z-10 space-y-4 mb-6">
                    {/* First Row: Players and Questions */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Players */}
                        <div className="bg-dark/30 rounded-lg p-3 border border-gray-700/50 hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                                <Users className="w-4 h-4 text-blue-400" />
                                <span className="text-gray-400 text-xs font-medium">Players</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-white font-bold text-lg">{tournament.current_players}</span>
                                <span className="text-gray-500">/{tournament.max_players}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-blue-400 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min((tournament.current_players / tournament.max_players) * 100, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Questions */}
                        <div className="bg-dark/30 rounded-lg p-3 border border-gray-700/50 hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                                <BookOpen className="w-4 h-4 text-purple-400" />
                                <span className="text-gray-400 text-xs font-medium">Questions</span>
                            </div>
                            <span className="text-white font-bold text-lg">{tournament.questions_per_match}</span>
                        </div>
                    </div>

                    {/* Second Row: Entry Fee and Prize Pool */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Entry Fee */}
                        <div className="bg-dark/30 rounded-lg p-3 border border-gray-700/50 hover:border-yellow-500/30 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                                <Coins className="w-4 h-4 text-yellow-400" />
                                <span className="text-gray-400 text-xs font-medium">Entry Fee</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {tournament.entry_fee > 0 ? (
                                    <>
                                        <span className="text-yellow-400 font-bold text-lg">{parseFloat(tournament.entry_fee.toString()).toFixed(2)}</span>
                                        <span className="text-yellow-500 text-sm font-medium">INK</span>
                                    </>
                                ) : (
                                    <span className="text-green-400 font-bold text-sm">FREE</span>
                                )}
                            </div>
                        </div>

                        {/* Prize Pool */}
                        <div className="bg-dark/30 rounded-lg p-3 border border-gray-700/50 hover:border-green-500/30 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                                <TrophyIcon className="w-4 h-4 text-green-400" />
                                <span className="text-gray-400 text-xs font-medium">Prize Pool</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {tournament.prize_pool > 0 ? (
                                    <>
                                        <span className="text-green-400 font-bold text-lg">{parseFloat(tournament.prize_pool.toString()).toFixed(2)}</span>
                                        <span className="text-green-500 text-sm font-medium">INK</span>
                                    </>
                                ) : (
                                    <span className="text-gray-500 font-medium text-sm">None</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tournament Details */}
                <div className="relative z-10 grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-dark/20 rounded-lg border border-gray-700/30">
                        {getDifficultyIcon(tournament.difficulty_level)}
                        <div>
                            <p className="text-gray-400 text-xs">Difficulty</p>
                            <p className="text-white font-semibold capitalize">{tournament.difficulty_level}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-dark/20 rounded-lg border border-gray-700/30">
                        <Brain className="w-4 h-4 text-indigo-400" />
                        <div>
                            <p className="text-gray-400 text-xs">Subject</p>
                            <p className="text-white font-semibold capitalize">
                                {tournament.subject_category.replace('-', ' ')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Custom Topics */}
                {tournament.custom_topics && tournament.custom_topics.length > 0 && (
                    <div className="relative z-10 mb-6">
                        <p className="text-gray-400 text-sm mb-3 font-medium">Topics:</p>
                        <div className="flex flex-wrap gap-2">
                            {tournament.custom_topics.slice(0, 4).map(topic => (
                                <span
                                    key={topic}
                                    className="px-3 py-1.5 bg-gradient-to-r from-primary/20 to-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20 hover:border-primary/40 transition-colors"
                                >
                                    {topic}
                                </span>
                            ))}
                            {tournament.custom_topics.length > 4 && (
                                <span className="px-3 py-1.5 bg-gray-700/50 text-gray-400 text-xs font-medium rounded-full border border-gray-600/50">
                                    +{tournament.custom_topics.length - 4} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Tournament Info Footer */}
                <div className="relative z-10 flex items-center justify-between text-sm text-gray-400 mb-6 pt-4 border-t border-gray-700/30">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                            <span>Creator: {tournament.creator_address.slice(0, 6)}...{tournament.creator_address.slice(-4)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{tournament.time_limit_minutes}min</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                {showActions && (
                    <div className="relative z-10 flex gap-3 flex-wrap">
                        {canJoin && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleJoinTournament(tournament.id)}
                                className="flex-1 min-w-[140px] px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-dark font-bold rounded-xl hover:from-primary/90 hover:to-primary/70 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/25"
                            >
                                <Play size={18} />
                                <span>Join Tournament</span>
                                {tournament.entry_fee > 0 && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-dark/20 text-dark/80 rounded-lg font-medium">
                                        {parseFloat(tournament.entry_fee.toString()).toFixed(2)} INK
                                    </span>
                                )}
                            </motion.button>
                        )}

                        {canStart && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleStartTournament(tournament.id)}
                                className="flex-1 min-w-[140px] px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/25"
                            >
                                <Zap size={18} />
                                <span>Start Tournament</span>
                            </motion.button>
                        )}

                        {isParticipant && tournament.status === 'active' && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onStartQuiz?.(tournament.id)}
                                className="flex-1 min-w-[140px] px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/25"
                            >
                                <Play size={18} />
                                <span>View Matches</span>
                            </motion.button>
                        )}
                    </div>
                )}
            </motion.div>
        );
    };

    const InvitationCard: React.FC<{ invitation: any }> = ({ invitation }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className="group relative bg-gradient-to-br from-yellow-500/10 via-dark/30 to-dark/20 backdrop-blur-md border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/50 hover:shadow-xl hover:shadow-yellow-500/10 transition-all duration-300 overflow-hidden"
        >
            {/* Background Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Invitation Header */}
            <div className="relative z-10 flex justify-between items-start mb-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center flex-shrink-0">
                        <AlertCircle size={24} className="text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-yellow-400 mb-2 flex items-center gap-2">
                            Tournament Invitation
                        </h3>
                        <p className="text-white font-semibold text-lg">{invitation.tournament.name}</p>
                        {invitation.message && (
                            <p className="text-gray-300 text-sm mt-2 italic bg-dark/30 p-3 rounded-lg border-l-4 border-yellow-500/50">
                                "{invitation.message}"
                            </p>
                        )}
                    </div>
                </div>
                <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-300 border border-yellow-500/30 shadow-lg">
                    PENDING
                </span>
            </div>

            {/* Embedded Tournament Preview */}
            <div className="relative z-10 mb-6 p-4 bg-dark/20 rounded-xl border border-gray-700/30">
                <TournamentCard tournament={invitation.tournament} showActions={false} />
            </div>

            {/* Action Buttons */}
            <div className="relative z-10 flex gap-3 mb-4">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRespondToInvitation(invitation.id, 'accept')}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/25"
                >
                    <CheckCircle size={18} />
                    <span>Accept Invitation</span>
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRespondToInvitation(invitation.id, 'decline')}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/25"
                >
                    <AlertCircle size={18} />
                    <span>Decline</span>
                </motion.button>
            </div>

            {/* Invitation Details */}
            <div className="relative z-10 flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-700/30">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500/60"></div>
                        <span>From: {invitation.inviter_address.slice(0, 6)}...{invitation.inviter_address.slice(-4)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>Invited: {new Date(invitation.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    // Scroll functionality
    useEffect(() => {
        const handleScroll = () => {
            if (containerRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
                const isScrollable = scrollHeight > clientHeight;

                // Clear any existing timeout
                if (scrollTimeoutRef.current) {
                    clearTimeout(scrollTimeoutRef.current);
                }

                // Debounce the scroll button updates to prevent flicker
                scrollTimeoutRef.current = setTimeout(() => {
                    // Show scroll-to-top button if scrolled down by at least 50px and content is scrollable
                    setShowScrollTop(scrollTop > 50 && isScrollable);

                    // Show scroll-to-bottom button if not at bottom and content is scrollable
                    setShowScrollBottom(scrollTop < scrollHeight - clientHeight - 50 && isScrollable);
                }, 50); // 50ms debounce
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            // Initial check after a short delay to ensure content is rendered
            setTimeout(handleScroll, 100);
            // Also check on resize
            window.addEventListener('resize', handleScroll);

            return () => {
                container.removeEventListener('scroll', handleScroll);
                window.removeEventListener('resize', handleScroll);
                // Clear timeout on cleanup
                if (scrollTimeoutRef.current) {
                    clearTimeout(scrollTimeoutRef.current);
                }
            };
        }
    }, [tournaments, myTournaments, invitations, activeTab]); // Re-run when content changes

    const scrollToTop = () => {
        containerRef.current?.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const scrollToBottom = () => {
        containerRef.current?.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: 'smooth'
        });
    };

    const getDifficultyIcon = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return <Target className="w-4 h-4 text-green-400" />;
            case 'medium': return <Zap className="w-4 h-4 text-yellow-400" />;
            case 'hard': return <Crown className="w-4 h-4 text-red-400" />;
            default: return <Brain className="w-4 h-4 text-blue-400" />;
        }
    };

    if (!backendConnected) {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center p-6">
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 max-w-md mx-auto text-center">
                    <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-400 mb-2">Backend Unavailable</h3>
                    <p className="text-gray-300 mb-4">
                        Cannot connect to the tournament backend server.
                    </p>
                    <p className="text-sm text-gray-400 mb-6">
                        Please ensure the backend is running on localhost:10000
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onBack}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>
                        <button
                            onClick={initializeService}
                            className="flex-1 px-4 py-2 bg-primary text-dark rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={16} />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 bg-dark/30 border-b border-primary/20 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBack}
                                className="p-2 text-gray-400 hover:text-primary transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                                    <TrophyIcon size={32} />
                                    Tournament Arena
                                </h1>
                                <p className="text-gray-300">
                                    Compete in AI-powered quiz tournaments with Chainlink automation
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* INK Balance Display */}
                            {inkTokenInfo && (
                                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 min-w-[140px]">
                                    <div className="text-xs text-yellow-400 mb-1 flex items-center gap-1">
                                        <Coins size={12} />
                                        INK Balance
                                    </div>
                                    <div className="text-lg font-bold text-yellow-300">
                                        {parseFloat(inkBalance).toFixed(2)}
                                    </div>
                                    <div className="text-xs text-yellow-400">{inkTokenInfo.symbol}</div>
                                </div>
                            )}

                            <button
                                onClick={loadData}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-3 py-2 bg-dark border border-primary/30 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50 transition-all"
                                title="Refresh tournaments"
                            >
                                <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto" ref={containerRef}>
                <div className="max-w-6xl mx-auto p-6 space-y-6">
                    {/* Backend Status */}
                    <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 flex-shrink-0">
                        <p className="text-green-400 text-sm text-center flex items-center justify-center gap-2">
                            <CheckCircle size={16} />
                            Connected to Tournament Backend • {tournaments.length} tournaments loaded
                        </p>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex-shrink-0"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={20} className="text-red-400" />
                                    <p className="text-red-400 flex-1">{error}</p>
                                </div>
                                <button
                                    onClick={() => setError(null)}
                                    className="ml-4 text-gray-400 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Navigation Tabs */}
                    <div className="flex gap-4 mb-6 flex-shrink-0 flex-wrap">
                        {[
                            { key: 'all', label: 'All Tournaments', count: tournaments.length, icon: TrophyIcon },
                            { key: 'my', label: 'My Tournaments', count: myTournaments.length, icon: Crown },
                            { key: 'invitations', label: 'Invitations', count: invitations.length, icon: AlertCircle },
                            { key: 'create', label: 'Create Tournament', count: 0, icon: Plus }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === tab.key
                                    ? 'bg-primary text-dark shadow-lg scale-105'
                                    : 'bg-dark/50 text-gray-300 hover:bg-dark/70 hover:scale-105'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className="ml-1 px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-12"
                            >
                                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-gray-300">Loading tournaments...</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="min-h-0 flex-1"
                            >
                                {activeTab === 'all' && (
                                    <div className="space-y-4">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <TrophyIcon size={24} />
                                            Public Tournaments
                                        </h2>
                                        {tournaments.length === 0 ? (
                                            <div className="text-center py-12 text-gray-400">
                                                <TrophyIcon size={64} className="mx-auto mb-4 opacity-50" />
                                                <h3 className="text-xl font-bold mb-2">No tournaments available</h3>
                                                <p>Be the first to create one!</p>
                                            </div>
                                        ) : (
                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {tournaments.map(tournament => (
                                                    <TournamentCard key={tournament.id} tournament={tournament} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'my' && (
                                    <div className="space-y-4">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <Crown size={24} />
                                            My Tournaments
                                        </h2>
                                        {myTournaments.length === 0 ? (
                                            <div className="text-center py-12 text-gray-400">
                                                <Crown size={64} className="mx-auto mb-4 opacity-50" />
                                                <h3 className="text-xl font-bold mb-2">No tournaments yet</h3>
                                                <p>You haven't created or joined any tournaments.</p>
                                            </div>
                                        ) : (
                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {myTournaments.map(tournament => (
                                                    <TournamentCard key={tournament.id} tournament={tournament} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'invitations' && (
                                    <div className="space-y-4">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <AlertCircle size={24} />
                                            Tournament Invitations
                                        </h2>
                                        {invitations.length === 0 ? (
                                            <div className="text-center py-12 text-gray-400">
                                                <AlertCircle size={64} className="mx-auto mb-4 opacity-50" />
                                                <h3 className="text-xl font-bold mb-2">No pending invitations</h3>
                                                <p>You're all caught up!</p>
                                            </div>
                                        ) : (
                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {invitations.map(invitation => (
                                                    <InvitationCard key={invitation.id} invitation={invitation} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'create' && (
                                    <div className="max-w-4xl mx-auto">
                                        <TournamentCreation
                                            userAddress={userAddress}
                                            onTournamentCreated={(_tournamentId) => {
                                                setActiveTab('my');
                                                loadData();
                                            }}
                                            onClose={() => setActiveTab('all')}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Scroll Buttons */}
            <AnimatePresence>
                {(showScrollTop || debugScrollButtons) && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={scrollToTop}
                        className="fixed bottom-20 right-6 z-[9999] bg-primary hover:bg-primary/90 text-dark p-3 rounded-full shadow-xl border-2 border-dark/20 transition-all duration-300 ease-in-out transform hover:scale-110"
                        title="Scroll to top"
                        style={{ backdropFilter: 'blur(8px)' }}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {(showScrollBottom || debugScrollButtons) && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={scrollToBottom}
                        className="fixed bottom-6 right-6 z-[9999] bg-primary hover:bg-primary/90 text-dark p-3 rounded-full shadow-xl border-2 border-dark/20 transition-all duration-300 ease-in-out transform hover:scale-110"
                        title="Scroll to bottom"
                        style={{ backdropFilter: 'blur(8px)' }}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Debug Toggle */}
            {process.env.NODE_ENV === 'development' && (
                <button
                    onClick={() => setDebugScrollButtons(!debugScrollButtons)}
                    className="fixed top-20 right-6 z-[9999] bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg"
                    title="Toggle scroll buttons (debug)"
                >
                    {debugScrollButtons ? 'Hide' : 'Show'} Scroll Debug
                </button>
            )}
        </div>
    );
};
