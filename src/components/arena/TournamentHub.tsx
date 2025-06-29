// import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { 
//   TrophyIcon, 
//   ZapIcon, 
//   Users, 
//   Clock, 
//   Coins, 
//   Plus, 
//   ArrowLeft, 
//   CheckCircle, 
//   AlertCircle, 
//   Crown,
//   Target,
//   Timer,
//   Award,
//   RefreshCw,
//   Play,
//   Calendar,
//   Zap,
//   BookOpen,
//   Brain
// } from 'lucide-react';
// import { backendTournamentService, BackendTournament } from '../../services/backendTournamentService';
// import { useWallet } from '../shared/WalletContext';
// import { TournamentCreation } from '../tournaments/TournamentCreation';

// interface TournamentHubProps {
//   onBack: () => void;
//   onStartQuiz?: (tournamentId: string) => void;
// }

// export const TournamentHub: React.FC<TournamentHubProps> = ({ onBack, onStartQuiz }) => {
//   const { address, provider, signer, balance } = useWallet();
//   const userAddress = address || '';
  
//   const [tournaments, setTournaments] = useState<BackendTournament[]>([]);
//   const [myTournaments, setMyTournaments] = useState<any[]>([]);
//   const [invitations, setInvitations] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [activeTab, setActiveTab] = useState<'all' | 'my' | 'invitations' | 'create'>('all');
//   const [backendConnected, setBackendConnected] = useState(false);
//   const [showScrollTop, setShowScrollTop] = useState(false);
//   const [showScrollBottom, setShowScrollBottom] = useState(false);
//   const [debugScrollButtons, setDebugScrollButtons] = useState(false);
//   const [inkBalance, setInkBalance] = useState<string>('0');
//   const [inkTokenInfo, setInkTokenInfo] = useState<any>(null);
//   const containerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     initializeService();
//   }, [userAddress, provider, signer]);

//   const initializeService = async () => {
//     try {
//       backendTournamentService.initialize(userAddress, provider || undefined, signer || undefined);
//       const isHealthy = await backendTournamentService.checkBackendHealth();
//       setBackendConnected(isHealthy);

//       if (isHealthy) {
//         await loadData();
//         await loadInkTokenInfo();
//       } else {
//         setError('Backend API is not available. Please ensure the server is running on localhost:10000');
//       }
//     } catch (err: any) {
//       setError(`Failed to connect to backend: ${err.message}`);
//     }
//   };

//   const loadInkTokenInfo = async () => {
//     try {
//       if (provider && signer) {
//         const balance = await backendTournamentService.getINKBalance();
//         const tokenInfo = await backendTournamentService.getINKTokenInfo();
//         setInkBalance(balance);
//         setInkTokenInfo(tokenInfo);
//       }
//     } catch (err) {
//       console.warn('Failed to load INK token info:', err);
//     }
//   };

//   const loadData = async () => {
//     if (!userAddress || userAddress.trim() === '') {
//       setError('User address is required. Please connect your wallet.');
//       return;
//     }

//     setIsLoading(true);
//     setError(null);

//     try {
//       console.log('Loading tournament data for user:', userAddress);

//       // First test backend connection
//       const connectionTest = await backendTournamentService.testConnection();
//       if (!connectionTest.connected) {
//         setError(`Backend connection failed: ${connectionTest.message}. Please ensure the tournament backend is running.`);
//         return;
//       }

//       // Load all public tournaments
//       const tournamentsResult = await backendTournamentService.getTournaments({
//         is_public: true,
//         limit: 20
//       });
//       setTournaments(tournamentsResult.tournaments);

//       // Load user's tournaments
//       const myTournamentsResult = await backendTournamentService.getMyTournaments(userAddress.toLowerCase().trim());
//       setMyTournaments(myTournamentsResult.tournaments);

//       // Load pending invitations
//       const invitationsResult = await backendTournamentService.getMyInvitations(userAddress.toLowerCase().trim(), 'pending');
//       setInvitations(invitationsResult.invitations);

//       // Load INK token balance
//       const balance = await backendTournamentService.getINKBalance();
//       setInkBalance(balance);

//       // Load INK token info
//       const tokenInfo = await backendTournamentService.getINKTokenInfo();
//       setInkTokenInfo(tokenInfo);

//     } catch (err: any) {
//       setError(err.message || 'Failed to load tournament data');
//       console.error('Load data error:', err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleJoinTournament = async (tournamentId: string) => {
//     if (!userAddress || userAddress.trim() === '') {
//       setError('User address is required. Please connect your wallet.');
//       return;
//     }

//     try {
//       setError(null);
//       console.log('Joining tournament:', tournamentId, 'with user:', userAddress);
//       await backendTournamentService.joinTournament(tournamentId, userAddress.toLowerCase().trim());
//       await loadData(); // Refresh data
      
//       // If onStartQuiz is provided and joining is successful, start the quiz
//       if (onStartQuiz) {
//         onStartQuiz(tournamentId);
//       }
//     } catch (err: any) {
//       setError(err.message || 'Failed to join tournament');
//       console.error('Join tournament error:', err);
//     }
//   };

//   const handleStartTournament = async (tournamentId: string) => {
//     try {
//       setError(null);
//       const result = await backendTournamentService.startTournament(tournamentId, userAddress);
//       await loadData(); // Refresh data
//     } catch (err: any) {
//       setError(err.message || 'Failed to start tournament');
//     }
//   };

//   const handleRespondToInvitation = async (invitationId: string, response: 'accept' | 'decline') => {
//     try {
//       setError(null);
//       await backendTournamentService.respondToInvitation(invitationId, userAddress, response);
//       await loadData(); // Refresh data
//     } catch (err: any) {
//       setError(err.message || `Failed to ${response} invitation`);
//     }
//   };

//   const TournamentCard: React.FC<{ tournament: BackendTournament; showActions?: boolean }> = ({
//     tournament,
//     showActions = true
//   }) => {
//     const isCreator = tournament.creator_address === userAddress;
//     const isParticipant = tournament.participants.includes(userAddress);
//     const canJoin = !isCreator && !isParticipant && tournament.status === 'registration';
//     const canStart = isCreator && tournament.status === 'registration' && tournament.current_players >= 2;

//     return (
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.3 }}
//         className="bg-dark/20 backdrop-blur-sm border border-primary/30 rounded-lg p-6 hover:border-primary/50 transition-all duration-300"
//       >
//         <div className="flex justify-between items-start mb-4">
//           <div>
//             <h3 className="text-xl font-bold text-primary">{tournament.name}</h3>
//             {tournament.description && (
//               <p className="text-gray-300 text-sm mt-1">{tournament.description}</p>
//             )}
//           </div>
//           <div className="text-right">
//             <span className={`px-3 py-1 rounded-full text-xs font-medium ${
//               tournament.status === 'registration' ? 'bg-blue-500/20 text-blue-400' :
//               tournament.status === 'active' ? 'bg-green-500/20 text-green-400' :
//               'bg-gray-500/20 text-gray-400'
//             }`}>
//               {tournament.status}
//             </span>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
//           <div className="flex items-center gap-2">
//             <Users className="w-4 h-4 text-gray-400" />
//             <div>
//               <p className="text-gray-400">Players</p>
//               <p className="text-white font-medium">
//                 {tournament.current_players}/{tournament.max_players}
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center gap-2">
//             <BookOpen className="w-4 h-4 text-gray-400" />
//             <div>
//               <p className="text-gray-400">Questions</p>
//               <p className="text-white font-medium">{tournament.questions_per_match}</p>
//             </div>
//           </div>
//           <div className="flex items-center gap-2">
//             <Coins className="w-4 h-4 text-yellow-400" />
//             <div>
//               <p className="text-gray-400">Entry Fee</p>
//               <p className="text-yellow-400 font-medium">
//                 {tournament.entry_fee > 0 ? `${tournament.entry_fee} INK` : 'Free'}
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center gap-2">
//             <TrophyIcon className="w-4 h-4 text-green-400" />
//             <div>
//               <p className="text-gray-400">Prize Pool</p>
//               <p className="text-green-400 font-medium">
//                 {tournament.prize_pool > 0 ? `${tournament.prize_pool} INK` : 'None'}
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
//           <div className="flex items-center gap-2">
//             {getDifficultyIcon(tournament.difficulty_level)}
//             <div>
//               <p className="text-gray-400">Difficulty</p>
//               <p className="text-white font-medium capitalize">{tournament.difficulty_level}</p>
//             </div>
//           </div>
//           <div className="flex items-center gap-2">
//             <Brain className="w-4 h-4 text-gray-400" />
//             <div>
//               <p className="text-gray-400">Subject</p>
//               <p className="text-white font-medium capitalize">
//                 {tournament.subject_category.replace('-', ' ')}
//               </p>
//             </div>
//           </div>
//         </div>

//         {tournament.custom_topics && tournament.custom_topics.length > 0 && (
//           <div className="mb-4">
//             <p className="text-gray-400 text-sm mb-2">Custom Topics:</p>
//             <div className="flex flex-wrap gap-2">
//               {tournament.custom_topics.map(topic => (
//                 <span
//                   key={topic}
//                   className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
//                 >
//                   {topic}
//                 </span>
//               ))}
//             </div>
//           </div>
//         )}

//         <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
//           <span>Creator: {tournament.creator_address.slice(0, 6)}...{tournament.creator_address.slice(-4)}</span>
//           <div className="flex items-center gap-1">
//             <Clock className="w-3 h-3" />
//             <span>Time Limit: {tournament.time_limit_minutes}min</span>
//           </div>
//         </div>

//         {showActions && (
//           <div className="flex gap-2 flex-wrap">
//             {canJoin && (
//               <button
//                 onClick={() => handleJoinTournament(tournament.id)}
//                 className="px-4 py-2 bg-primary text-dark font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
//               >
//                 <Play size={16} />
//                 <span>Join Tournament</span>
//                 {tournament.entry_fee > 0 && (
//                   <span className="text-xs bg-dark/30 px-2 py-1 rounded">
//                     {tournament.entry_fee} INK
//                   </span>
//                 )}
//               </button>
//             )}

//             {canStart && (
//               <button
//                 onClick={() => handleStartTournament(tournament.id)}
//                 className="px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
//               >
//                 <Zap size={16} />
//                 Start Tournament
//               </button>
//             )}

//             {isParticipant && tournament.status === 'active' && (
//               <button
//                 onClick={() => onStartQuiz?.(tournament.id)}
//                 className="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
//               >
//                 <Play size={16} />
//                 View Matches
//               </button>
//             )}

//             {(isCreator || isParticipant) && (
//               <span className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${
//                 isCreator ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
//               }`}>
//                 {isCreator ? <Crown size={16} /> : <CheckCircle size={16} />}
//                 {isCreator ? 'Creator' : 'Participant'}
//               </span>
//             )}
//           </div>
//         )}
//       </motion.div>
//     );
//   };

//   const InvitationCard: React.FC<{ invitation: any }> = ({ invitation }) => (
//     <motion.div
//       initial={{ opacity: 0, scale: 0.95 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{ duration: 0.3 }}
//       className="bg-dark/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-6 hover:border-yellow-500/50 transition-all duration-300"
//     >
//       <div className="flex justify-between items-start mb-4">
//         <div>
//           <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
//             <AlertCircle size={20} />
//             Tournament Invitation
//           </h3>
//           <p className="text-gray-300">{invitation.tournament.name}</p>
//           {invitation.message && (
//             <p className="text-gray-400 text-sm mt-1 italic">"{invitation.message}"</p>
//           )}
//         </div>
//         <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
//           Pending
//         </span>
//       </div>

//       <div className="mb-4">
//         <TournamentCard tournament={invitation.tournament} showActions={false} />
//       </div>

//       <div className="flex gap-2">
//         <button
//           onClick={() => handleRespondToInvitation(invitation.id, 'accept')}
//           className="px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
//         >
//           <CheckCircle size={16} />
//           Accept Invitation
//         </button>
//         <button
//           onClick={() => handleRespondToInvitation(invitation.id, 'decline')}
//           className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
//         >
//           <AlertCircle size={16} />
//           Decline
//         </button>
//       </div>

//       <div className="mt-4 text-sm text-gray-400">
//         <p>From: {invitation.inviter_address.slice(0, 6)}...{invitation.inviter_address.slice(-4)}</p>
//         <p>Invited: {new Date(invitation.created_at).toLocaleDateString()}</p>
//       </div>
//     </motion.div>
//   );

//   // Scroll functionality
//   useEffect(() => {
//     const handleScroll = () => {
//       if (containerRef.current) {
//         const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
//         const isScrollable = scrollHeight > clientHeight;

//         // Show scroll-to-top button if scrolled down by at least 50px and content is scrollable
//         setShowScrollTop(scrollTop > 50 && isScrollable);

//         // Show scroll-to-bottom button if not at bottom and content is scrollable
//         setShowScrollBottom(scrollTop < scrollHeight - clientHeight - 50 && isScrollable);
//       }
//     };

//     const container = containerRef.current;
//     if (container) {
//       container.addEventListener('scroll', handleScroll);
//       // Initial check after a short delay to ensure content is rendered
//       setTimeout(handleScroll, 100);
//       // Also check on resize
//       window.addEventListener('resize', handleScroll);

//       return () => {
//         container.removeEventListener('scroll', handleScroll);
//         window.removeEventListener('resize', handleScroll);
//       };
//     }
//   }, [tournaments, myTournaments, invitations, activeTab]); // Re-run when content changes

//   const scrollToTop = () => {
//     containerRef.current?.scrollTo({
//       top: 0,
//       behavior: 'smooth'
//     });
//   };

//   const scrollToBottom = () => {
//     containerRef.current?.scrollTo({
//       top: containerRef.current.scrollHeight,
//       behavior: 'smooth'
//     });
//   };

//   const getDifficultyIcon = (difficulty: string) => {
//     switch (difficulty.toLowerCase()) {
//       case 'easy': return <Target className="w-4 h-4 text-green-400" />;
//       case 'medium': return <Zap className="w-4 h-4 text-yellow-400" />;
//       case 'hard': return <Crown className="w-4 h-4 text-red-400" />;
//       default: return <Brain className="w-4 h-4 text-blue-400" />;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-dark p-6">
//       <div className="max-w-6xl mx-auto">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-8">
//           <div className="flex items-center gap-4">
//             <button
//               onClick={onBack}
//               className="p-2 text-gray-400 hover:text-primary transition-colors"
//             >
//               <ArrowLeft size={24} />
//             </button>
//             <div>
//               <h1 className="text-3xl font-pixel text-primary">BrainInk Tournaments</h1>
//               <p className="text-gray-400">Compete in AI-powered knowledge battles</p>
//             </div>
//           </div>
          
//           <div className="flex items-center gap-4">
//             <button
//               onClick={loadTournaments}
//               disabled={isLoading}
//               className="flex items-center gap-2 px-3 py-2 bg-dark border border-primary/30 text-primary rounded font-pixel hover:bg-primary/20 disabled:opacity-50 transition-all"
//               title="Refresh tournaments"
//             >
//               <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
//             </button>
            
//             <button
//               onClick={() => setShowCreateForm(true)}
//               className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 text-primary rounded font-pixel hover:bg-primary/30 transition-all"
//             >
//               <Plus size={20} />
//               Create Tournament
//             </button>
//           </div>
//         </div>

//         {/* Error Display */}
//         {error && (
//           <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <AlertCircle size={20} className="text-red-400" />
//                 <span className="text-red-400">{error}</span>
//               </div>
//               <button
//                 onClick={() => setError(null)}
//                 className="ml-4 text-gray-400 hover:text-white"
//               >
//                 ✕
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Tournaments Grid */}
//         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {isLoading ? (
//             Array.from({ length: 6 }).map((_, i) => (
//               <div key={i} className="bg-dark/50 border border-primary/20 rounded-lg p-6 animate-pulse">
//                 <div className="h-6 bg-gray-600 rounded mb-4"></div>
//                 <div className="space-y-2">
//                   <div className="h-4 bg-gray-600 rounded w-3/4"></div>
//                   <div className="h-4 bg-gray-600 rounded w-1/2"></div>
//                 </div>
//               </div>
//             ))
//           ) : tournaments.length === 0 ? (
//             <div className="col-span-full text-center py-12">
//               <TrophyIcon size={64} className="text-gray-600 mx-auto mb-4" />
//               <h3 className="text-xl font-pixel text-gray-400 mb-2">No Active Tournaments</h3>
//               <p className="text-gray-500">Be the first to create a tournament!</p>
//             </div>
//           ) : (
//             tournaments.map((tournament) => {
//               const userInTournament = isUserInTournament(tournament);
//               const userIsCreator = isUserCreator(tournament);
//               const isFull = tournament.current_players >= tournament.max_players;

//               return (
//                 <motion.div
//                   key={tournament.id}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   className="bg-dark/50 border border-primary/20 rounded-lg p-6 hover:border-primary/40 transition-all"
//                 >
//                   {/* Tournament Header */}
//                   <div className="flex justify-between items-start mb-4">
//                     <div className="flex-1">
//                       <h3 className="font-pixel text-primary text-lg mb-1">{tournament.name}</h3>
//                       {tournament.description && (
//                         <p className="text-gray-400 text-sm mb-2">{tournament.description}</p>
//                       )}
//                       <div className="flex items-center gap-2">
//                         <span className={`px-2 py-1 rounded text-xs font-pixel ${getStatusColor(tournament.status)}`}>
//                           {tournament.status.toUpperCase()}
//                         </span>
//                         {userIsCreator && (
//                           <span className="px-2 py-1 rounded text-xs font-pixel bg-yellow-400/20 text-yellow-400">
//                             CREATOR
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       {getDifficultyIcon(tournament.difficulty_level)}
//                     </div>
//                   </div>

//                   {/* Tournament Info */}
//                   <div className="space-y-3 mb-4">
//                     <div className="flex justify-between items-center">
//                       <div className="flex items-center gap-2">
//                         <Users size={16} className="text-gray-400" />
//                         <span className="text-sm text-gray-300">
//                           {tournament.current_players}/{tournament.max_players} players
//                         </span>
//                       </div>
//                       <div className="w-20 bg-gray-700 rounded-full h-2">
//                         <div
//                           className="bg-primary h-2 rounded-full transition-all"
//                           style={{ width: `${(tournament.current_players / tournament.max_players) * 100}%` }}
//                         />
//                       </div>
//                     </div>

//                     <div className="flex justify-between items-center">
//                       <div className="flex items-center gap-2">
//                         <Brain size={16} className="text-gray-400" />
//                         <span className="text-sm text-gray-300">{tournament.questions_per_match} questions</span>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <Timer size={16} className="text-gray-400" />
//                         <span className="text-sm text-gray-300">{tournament.time_limit_minutes}m</span>
//                       </div>
//                     </div>

//                     <div className="flex justify-between items-center">
//                       <div className="flex items-center gap-2">
//                         <BookOpen size={16} className="text-gray-400" />
//                         <span className="text-sm text-gray-300">{tournament.subject_category}</span>
//                       </div>
//                       <span className="text-xs text-gray-400 capitalize">{tournament.bracket_type.replace('_', ' ')}</span>
//                     </div>

//                     {(tournament.prize_pool > 0 || tournament.entry_fee > 0) && (
//                       <div className="grid grid-cols-2 gap-2">
//                         {tournament.entry_fee > 0 && (
//                           <div className="flex justify-between items-center">
//                             <div className="flex items-center gap-2">
//                               <Coins size={16} className="text-yellow-400" />
//                               <span className="text-sm text-yellow-400">Entry Fee</span>
//                             </div>
//                             <span className="text-sm font-bold text-yellow-400">{tournament.entry_fee} INK</span>
//                           </div>
//                         )}
                        
//                         {tournament.prize_pool > 0 && (
//                           <div className="flex justify-between items-center">
//                             <div className="flex items-center gap-2">
//                               <Award size={16} className="text-green-400" />
//                               <span className="text-sm text-green-400">Prize Pool</span>
//                             </div>
//                             <span className="text-sm font-bold text-green-400">{tournament.prize_pool} INK</span>
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>

//                   {/* Action Buttons */}
//                   <div className="flex gap-2">
//                     {tournament.status === 'completed' ? (
//                       <div className="flex-1 text-center">
//                         {(tournament as any).winner && (
//                           <div className="flex items-center justify-center gap-2 text-yellow-400">
//                             <Crown size={16} />
//                             <span className="text-sm">Winner: {(tournament as any).winner.slice(0, 8)}...</span>
//                           </div>
//                         )}
//                       </div>
//                     ) : userInTournament ? (
//                       <div className="flex-1 space-y-2">
//                         <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
//                           <CheckCircle size={16} />
//                           <span>Joined Tournament</span>
//                         </div>
//                         {tournament.status === 'active' && (
//                           <button
//                             onClick={() => onStartQuiz && onStartQuiz(tournament.id)}
//                             className="w-full px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded font-pixel hover:bg-green-500/30 transition-all flex items-center justify-center gap-2"
//                           >
//                             <Play size={16} />
//                             Start Quiz
//                           </button>
//                         )}
//                       </div>
//                     ) : isFull ? (
//                       <button
//                         disabled
//                         className="flex-1 px-4 py-2 bg-gray-600/20 border border-gray-600/30 text-gray-500 rounded font-pixel cursor-not-allowed"
//                       >
//                         Tournament Full
//                       </button>
//                     ) : tournament.status === 'registration' ? (
//                       <button
//                         onClick={() => handleJoinTournament(tournament)}
//                         disabled={joiningTournamentId === tournament.id}
//                         className="flex-1 px-4 py-2 bg-primary/20 border border-primary/30 text-primary rounded font-pixel hover:bg-primary/30 transition-all disabled:opacity-50"
//                       >
//                         {joiningTournamentId === tournament.id ? 'Joining...' : 
//                           tournament.entry_fee > 0 ? 
//                             `Join (${tournament.entry_fee} INK)` : 
//                             'Join Tournament'
//                         }
//                       </button>
//                     ) : (
//                       <button
//                         disabled
//                         className="flex-1 px-4 py-2 bg-gray-600/20 border border-gray-600/30 text-gray-500 rounded font-pixel cursor-not-allowed"
//                       >
//                         Tournament Active
//                       </button>
//                     )}

//                     {userIsCreator && tournament.status === 'registration' && tournament.current_players >= 4 && (
//                       <button
//                         onClick={() => handleStartTournament(tournament)}
//                         className="px-4 py-2 bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 rounded font-pixel hover:bg-yellow-400/30 transition-all"
//                       >
//                         Start
//                       </button>
//                     )}
//                   </div>
//                 </motion.div>
//               );
//             })
//           )}
//         </div>

//         {/* Create Tournament Modal */}
//         <AnimatePresence>
//           {showCreateForm && (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
//               onClick={() => setShowCreateForm(false)}
//             >
//               <motion.div
//                 initial={{ scale: 0.9, opacity: 0 }}
//                 animate={{ scale: 1, opacity: 1 }}
//                 exit={{ scale: 0.9, opacity: 0 }}
//                 className="bg-dark border border-primary/30 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
//                 onClick={(e) => e.stopPropagation()}
//               >
//                 <h2 className="text-xl font-pixel text-primary mb-4">Create Tournament</h2>
                
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-sm text-gray-400 mb-1">Tournament Name</label>
//                     <input
//                       type="text"
//                       value={createForm.name}
//                       onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
//                       className="w-full px-3 py-2 bg-dark border border-gray-600 rounded text-white"
//                       placeholder="Enter tournament name"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm text-gray-400 mb-1">Description (Optional)</label>
//                     <textarea
//                       value={createForm.description}
//                       onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
//                       className="w-full px-3 py-2 bg-dark border border-gray-600 rounded text-white h-20 resize-none"
//                       placeholder="Describe your tournament"
//                     />
//                   </div>

//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm text-gray-400 mb-1">Max Players</label>
//                       <select
//                         value={createForm.max_players}
//                         onChange={(e) => setCreateForm({ ...createForm, max_players: parseInt(e.target.value) })}
//                         className="w-full px-3 py-2 bg-dark border border-gray-600 rounded text-white"
//                       >
//                         <option value={4}>4 Players</option>
//                         <option value={8}>8 Players</option>
//                         <option value={16}>16 Players</option>
//                         <option value={32}>32 Players</option>
//                         <option value={64}>64 Players</option>
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm text-gray-400 mb-1">Questions</label>
//                       <select
//                         value={createForm.questions_per_match}
//                         onChange={(e) => setCreateForm({ ...createForm, questions_per_match: parseInt(e.target.value) })}
//                         className="w-full px-3 py-2 bg-dark border border-gray-600 rounded text-white"
//                       >
//                         {Array.from({ length: 9 }, (_, i) => i + 7).map(num => (
//                           <option key={num} value={num}>{num} Questions</option>
//                         ))}
//                       </select>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
//                       <select
//                         value={createForm.difficulty_level}
//                         onChange={(e) => setCreateForm({ ...createForm, difficulty_level: e.target.value as 'easy' | 'medium' | 'hard' })}
//                         className="w-full px-3 py-2 bg-dark border border-gray-600 rounded text-white"
//                       >
//                         <option value="easy">Easy</option>
//                         <option value="medium">Medium</option>
//                         <option value="hard">Hard</option>
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm text-gray-400 mb-1">Time Limit</label>
//                       <select
//                         value={createForm.time_limit_minutes}
//                         onChange={(e) => setCreateForm({ ...createForm, time_limit_minutes: parseInt(e.target.value) })}
//                         className="w-full px-3 py-2 bg-dark border border-gray-600 rounded text-white"
//                       >
//                         <option value={15}>15 minutes</option>
//                         <option value={30}>30 minutes</option>
//                         <option value={45}>45 minutes</option>
//                         <option value={60}>60 minutes</option>
//                       </select>
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-sm text-gray-400 mb-1">Subject Category</label>
//                     <select
//                       value={createForm.subject_category}
//                       onChange={(e) => setCreateForm({ ...createForm, subject_category: e.target.value })}
//                       className="w-full px-3 py-2 bg-dark border border-gray-600 rounded text-white"
//                     >
//                       <option value="general">General Knowledge</option>
//                       <option value="mathematics">Mathematics</option>
//                       <option value="science">Science</option>
//                       <option value="history">History</option>
//                       <option value="literature">Literature</option>
//                       <option value="technology">Technology</option>
//                       <option value="sports">Sports</option>
//                     </select>
//                   </div>

//                   {/* INK Token Economics */}
//                   <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
//                     <h3 className="text-yellow-400 font-pixel mb-3">💰 INK Token Economics</h3>
                    
//                     {balance && (
//                       <div className="mb-3 text-sm text-gray-300">
//                         Your INK Balance: <span className="text-yellow-400 font-bold">{balance} INK</span>
//                       </div>
//                     )}

//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm text-gray-400 mb-1">Entry Fee (INK)</label>
//                         <input
//                           type="number"
//                           min="0"
//                           step="0.1"
//                           value={createForm.entry_fee}
//                           onChange={(e) => setCreateForm({ ...createForm, entry_fee: parseFloat(e.target.value) || 0 })}
//                           className="w-full px-3 py-2 bg-dark border border-gray-600 rounded text-white"
//                           placeholder="0"
//                         />
//                         <p className="text-xs text-gray-500 mt-1">Charged to each participant</p>
//                       </div>

//                       <div>
//                         <label className="block text-sm text-gray-400 mb-1">Prize Pool (INK)</label>
//                         <input
//                           type="number"
//                           min="0"
//                           step="0.1"
//                           value={createForm.prize_pool}
//                           onChange={(e) => setCreateForm({ ...createForm, prize_pool: parseFloat(e.target.value) || 0 })}
//                           className="w-full px-3 py-2 bg-dark border border-gray-600 rounded text-white"
//                           placeholder="0"
//                         />
//                         <p className="text-xs text-gray-500 mt-1">Your contribution to prize</p>
//                       </div>
//                     </div>

//                     {createForm.prize_pool > 0 && (
//                       <div className="mt-3 p-2 bg-blue-500/20 border border-blue-500/50 rounded text-blue-400 text-sm">
//                         ⚡ You will be charged {createForm.prize_pool} INK tokens when creating this tournament
//                       </div>
//                     )}

//                     {(createForm.entry_fee > 0 || createForm.prize_pool > 0) && (
//                       <div className="mt-3 p-2 bg-green-500/20 border border-green-500/50 rounded text-green-400 text-sm">
//                         🏆 Winner gets: {(createForm.prize_pool + (createForm.entry_fee * createForm.max_players)).toFixed(1)} INK tokens
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 <div className="flex gap-2 mt-6">
//                   <button
//                     onClick={() => setShowCreateForm(false)}
//                     className="flex-1 px-4 py-2 bg-gray-600/20 border border-gray-600/30 text-gray-400 rounded font-pixel hover:bg-gray-600/30 transition-all"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={handleCreateTournament}
//                     disabled={isLoading || !createForm.name.trim()}
//                     className="flex-1 px-4 py-2 bg-primary/20 border border-primary/30 text-primary rounded font-pixel hover:bg-primary/30 transition-all disabled:opacity-50"
//                   >
//                     {isLoading ? 'Creating...' : 'Create'}
//                   </button>
//                 </div>
//               </motion.div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </div>
//   );
// };
