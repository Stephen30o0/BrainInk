// import React, { useState, useEffect, useRef } from 'react';
// import { backendTournamentService, BackendTournament } from '../../services/backendTournamentService';
// import { TournamentCreation } from './TournamentCreation';
// import { useWallet } from '../shared/WalletContext';

// interface TournamentDashboardProps {
//     userAddress: string;
// }

// export const TournamentDashboard: React.FC<TournamentDashboardProps> = ({ userAddress }) => {
//     const { provider, signer } = useWallet();
//     const [tournaments, setTournaments] = useState<BackendTournament[]>([]);
//     const [myTournaments, setMyTournaments] = useState<any[]>([]);
//     const [invitations, setInvitations] = useState<any[]>([]);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const [activeTab, setActiveTab] = useState<'all' | 'my' | 'invitations' | 'create'>('all');
//     const [backendConnected, setBackendConnected] = useState(false);
//     const [showScrollTop, setShowScrollTop] = useState(false);
//     const [showScrollBottom, setShowScrollBottom] = useState(false);
//     const [debugScrollButtons, setDebugScrollButtons] = useState(false); // Debug mode
//     const [inkBalance, setInkBalance] = useState<string>('0');
//     const [inkTokenInfo, setInkTokenInfo] = useState<any>(null);
//     const containerRef = useRef<HTMLDivElement>(null);

//     useEffect(() => {
//         initializeService();
//     }, [userAddress, provider, signer]);

//     const initializeService = async () => {
//         try {
//             backendTournamentService.initialize(userAddress, provider || undefined, signer || undefined);
//             const isHealthy = await backendTournamentService.checkBackendHealth();
//             setBackendConnected(isHealthy);

//             if (isHealthy) {
//                 await loadData();
//                 await loadInkTokenInfo();
//             } else {
//                 setError('Backend API is not available. Please ensure the server is running on localhost:10000');
//             }
//         } catch (err: any) {
//             setError(`Failed to connect to backend: ${err.message}`);
//         }
//     };

//     const loadInkTokenInfo = async () => {
//         try {
//             if (provider && signer) {
//                 const balance = await backendTournamentService.getINKBalance();
//                 const tokenInfo = await backendTournamentService.getINKTokenInfo();
//                 setInkBalance(balance);
//                 setInkTokenInfo(tokenInfo);
//             }
//         } catch (err) {
//             console.warn('Failed to load INK token info:', err);
//         }
//     };

//     const loadData = async () => {
//         if (!userAddress || userAddress.trim() === '') {
//             setError('User address is required. Please connect your wallet.');
//             return;
//         }

//         setIsLoading(true);
//         setError(null);

//         try {
//             console.log('Loading tournament data for user:', userAddress);

//             // First test backend connection
//             const connectionTest = await backendTournamentService.testConnection();
//             if (!connectionTest.connected) {
//                 setError(`Backend connection failed: ${connectionTest.message}. Please ensure the tournament backend is running.`);
//                 return;
//             }

//             // Load all public tournaments
//             const tournamentsResult = await backendTournamentService.getTournaments({
//                 is_public: true,
//                 limit: 20
//             });
//             setTournaments(tournamentsResult.tournaments);

//             // Load user's tournaments
//             const myTournamentsResult = await backendTournamentService.getMyTournaments(userAddress.toLowerCase().trim());
//             setMyTournaments(myTournamentsResult.tournaments);

//             // Load pending invitations
//             const invitationsResult = await backendTournamentService.getMyInvitations(userAddress.toLowerCase().trim(), 'pending');
//             setInvitations(invitationsResult.invitations);

//             // Load INK token balance
//             const balance = await backendTournamentService.getINKBalance();
//             setInkBalance(balance);

//             // Load INK token info
//             const tokenInfo = await backendTournamentService.getINKTokenInfo();
//             setInkTokenInfo(tokenInfo);

//         } catch (err: any) {
//             setError(err.message || 'Failed to load tournament data');
//             console.error('Load data error:', err);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleJoinTournament = async (tournamentId: string) => {
//         if (!userAddress || userAddress.trim() === '') {
//             setError('User address is required. Please connect your wallet.');
//             return;
//         }

//         try {
//             setError(null);
//             console.log('Joining tournament:', tournamentId, 'with user:', userAddress);
//             await backendTournamentService.joinTournament(tournamentId, userAddress.toLowerCase().trim());
//             await loadData(); // Refresh data
//             alert('Successfully joined tournament!');
//         } catch (err: any) {
//             setError(err.message || 'Failed to join tournament');
//             console.error('Join tournament error:', err);
//         }
//     };

//     const handleStartTournament = async (tournamentId: string) => {
//         try {
//             setError(null);
//             const result = await backendTournamentService.startTournament(tournamentId, userAddress);
//             await loadData(); // Refresh data
//             alert(`Tournament started! ${result.bracket.matches.length} matches created.`);
//         } catch (err: any) {
//             setError(err.message || 'Failed to start tournament');
//         }
//     };

//     const handleRespondToInvitation = async (invitationId: string, response: 'accept' | 'decline') => {
//         try {
//             setError(null);
//             await backendTournamentService.respondToInvitation(invitationId, userAddress, response);
//             await loadData(); // Refresh data
//             alert(`Invitation ${response}ed successfully!`);
//         } catch (err: any) {
//             setError(err.message || `Failed to ${response} invitation`);
//         }
//     };

//     const TournamentCard: React.FC<{ tournament: BackendTournament; showActions?: boolean }> = ({
//         tournament,
//         showActions = true
//     }) => {
//         const isCreator = tournament.creator_address === userAddress;
//         const isParticipant = tournament.participants.includes(userAddress);
//         const canJoin = !isCreator && !isParticipant && tournament.status === 'registration';
//         const canStart = isCreator && tournament.status === 'registration' && tournament.current_players >= 2;

//         return (
//             <div className="bg-dark/20 backdrop-blur-sm border border-primary/30 rounded-lg p-6">
//                 <div className="flex justify-between items-start mb-4">
//                     <div>
//                         <h3 className="text-xl font-bold text-primary">{tournament.name}</h3>
//                         {tournament.description && (
//                             <p className="text-gray-300 text-sm mt-1">{tournament.description}</p>
//                         )}
//                     </div>
//                     <div className="text-right">
//                         <span className={`px-3 py-1 rounded-full text-xs font-medium ${tournament.status === 'registration' ? 'bg-blue-500/20 text-blue-400' :
//                             tournament.status === 'active' ? 'bg-green-500/20 text-green-400' :
//                                 'bg-gray-500/20 text-gray-400'
//                             }`}>
//                             {tournament.status}
//                         </span>
//                     </div>
//                 </div>

//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
//                     <div>
//                         <p className="text-gray-400">Players</p>
//                         <p className="text-white font-medium">
//                             {tournament.current_players}/{tournament.max_players}
//                         </p>
//                     </div>
//                     <div>
//                         <p className="text-gray-400">Questions</p>
//                         <p className="text-white font-medium">{tournament.questions_per_match}</p>
//                     </div>
//                     <div>
//                         <p className="text-gray-400">Entry Fee</p>
//                         <p className="text-yellow-400 font-medium">
//                             {tournament.entry_fee > 0 ? `${tournament.entry_fee} INK` : 'Free'}
//                         </p>
//                     </div>
//                     <div>
//                         <p className="text-gray-400">Prize Pool</p>
//                         <p className="text-green-400 font-medium">
//                             {tournament.prize_pool > 0 ? `${tournament.prize_pool} INK` : 'None'}
//                         </p>
//                     </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
//                     <div>
//                         <p className="text-gray-400">Difficulty</p>
//                         <p className="text-white font-medium capitalize">{tournament.difficulty_level}</p>
//                     </div>
//                     <div>
//                         <p className="text-gray-400">Subject</p>
//                         <p className="text-white font-medium capitalize">
//                             {tournament.subject_category.replace('-', ' ')}
//                         </p>
//                     </div>
//                 </div>

//                 {tournament.custom_topics && tournament.custom_topics.length > 0 && (
//                     <div className="mb-4">
//                         <p className="text-gray-400 text-sm mb-2">Custom Topics:</p>
//                         <div className="flex flex-wrap gap-2">
//                             {tournament.custom_topics.map(topic => (
//                                 <span
//                                     key={topic}
//                                     className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
//                                 >
//                                     {topic}
//                                 </span>
//                             ))}
//                         </div>
//                     </div>
//                 )}

//                 <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
//                     <span>Creator: {tournament.creator_address.slice(0, 6)}...{tournament.creator_address.slice(-4)}</span>
//                     <span>Time Limit: {tournament.time_limit_minutes}min</span>
//                 </div>

//                 {showActions && (
//                     <div className="flex gap-2">
//                         {canJoin && (
//                             <button
//                                 onClick={() => handleJoinTournament(tournament.id)}
//                                 className="px-4 py-2 bg-primary text-dark font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
//                             >
//                                 <span>Join Tournament</span>
//                                 {tournament.entry_fee > 0 && (
//                                     <span className="text-xs bg-dark/30 px-2 py-1 rounded">
//                                         {tournament.entry_fee} INK
//                                     </span>
//                                 )}
//                             </button>
//                         )}

//                         {canStart && (
//                             <button
//                                 onClick={() => handleStartTournament(tournament.id)}
//                                 className="px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
//                             >
//                                 Start Tournament
//                             </button>
//                         )}

//                         {isParticipant && tournament.status === 'active' && (
//                             <button
//                                 className="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
//                             >
//                                 View Matches
//                             </button>
//                         )}

//                         {(isCreator || isParticipant) && (
//                             <span className={`px-3 py-2 rounded-lg text-sm ${isCreator ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
//                                 }`}>
//                                 {isCreator ? '👑 Creator' : '🎮 Participant'}
//                             </span>
//                         )}
//                     </div>
//                 )}
//             </div>
//         );
//     };

//     const InvitationCard: React.FC<{ invitation: any }> = ({ invitation }) => (
//         <div className="bg-dark/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-6">
//             <div className="flex justify-between items-start mb-4">
//                 <div>
//                     <h3 className="text-xl font-bold text-yellow-400">📧 Tournament Invitation</h3>
//                     <p className="text-gray-300">{invitation.tournament.name}</p>
//                     {invitation.message && (
//                         <p className="text-gray-400 text-sm mt-1 italic">"{invitation.message}"</p>
//                     )}
//                 </div>
//                 <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
//                     Pending
//                 </span>
//             </div>

//             <div className="mb-4">
//                 <TournamentCard tournament={invitation.tournament} showActions={false} />
//             </div>

//             <div className="flex gap-2">
//                 <button
//                     onClick={() => handleRespondToInvitation(invitation.id, 'accept')}
//                     className="px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
//                 >
//                     Accept Invitation
//                 </button>
//                 <button
//                     onClick={() => handleRespondToInvitation(invitation.id, 'decline')}
//                     className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
//                 >
//                     Decline
//                 </button>
//             </div>

//             <div className="mt-4 text-sm text-gray-400">
//                 <p>From: {invitation.inviter_address.slice(0, 6)}...{invitation.inviter_address.slice(-4)}</p>
//                 <p>Invited: {new Date(invitation.created_at).toLocaleDateString()}</p>
//             </div>
//         </div>
//     );

//     // Scroll functionality
//     useEffect(() => {
//         const handleScroll = () => {
//             if (containerRef.current) {
//                 const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
//                 const isScrollable = scrollHeight > clientHeight;

//                 // Show scroll-to-top button if scrolled down by at least 50px and content is scrollable
//                 setShowScrollTop(scrollTop > 50 && isScrollable);

//                 // Show scroll-to-bottom button if not at bottom and content is scrollable
//                 setShowScrollBottom(scrollTop < scrollHeight - clientHeight - 50 && isScrollable);
//             }
//         };

//         const container = containerRef.current;
//         if (container) {
//             container.addEventListener('scroll', handleScroll);
//             // Initial check after a short delay to ensure content is rendered
//             setTimeout(handleScroll, 100);
//             // Also check on resize
//             window.addEventListener('resize', handleScroll);

//             return () => {
//                 container.removeEventListener('scroll', handleScroll);
//                 window.removeEventListener('resize', handleScroll);
//             };
//         }
//     }, [tournaments, myTournaments, invitations, activeTab]); // Re-run when content changes

//     const scrollToTop = () => {
//         containerRef.current?.scrollTo({
//             top: 0,
//             behavior: 'smooth'
//         });
//     };

//     const scrollToBottom = () => {
//         containerRef.current?.scrollTo({
//             top: containerRef.current.scrollHeight,
//             behavior: 'smooth'
//         });
//     };

//     if (!backendConnected) {
//         return (
//             <div className="text-center py-12">
//                 <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 max-w-md mx-auto">
//                     <h3 className="text-xl font-bold text-red-400 mb-2">Backend Unavailable</h3>
//                     <p className="text-gray-300 mb-4">
//                         Cannot connect to the tournament backend server.
//                     </p>
//                     <p className="text-sm text-gray-400">
//                         Please ensure the backend is running on localhost:10000
//                     </p>
//                     <button
//                         onClick={initializeService}
//                         className="mt-4 px-4 py-2 bg-primary text-dark rounded-lg hover:bg-primary/90 transition-colors"
//                     >
//                         Retry Connection
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="h-full flex flex-col overflow-hidden">
//             {/* Header */}
//             <div className="flex-shrink-0 text-center p-6 bg-dark/30 border-b border-primary/20">
//                 <div className="flex justify-between items-center mb-4">
//                     <div></div> {/* Spacer */}
//                     <div>
//                         <h1 className="text-3xl font-bold text-primary mb-2">🏆 Tournament Arena</h1>
//                         <p className="text-gray-300">
//                             Compete in AI-powered quiz tournaments with Chainlink automation
//                         </p>
//                     </div>
//                     {/* INK Balance Display */}
//                     {inkTokenInfo && (
//                         <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 min-w-[120px]">
//                             <div className="text-xs text-yellow-400 mb-1">INK Balance</div>
//                             <div className="text-lg font-bold text-yellow-300">
//                                 {parseFloat(inkBalance).toFixed(2)}
//                             </div>
//                             <div className="text-xs text-yellow-400">{inkTokenInfo.symbol}</div>
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* Main Content Area */}
//             <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={containerRef}>
//                 {/* Backend Status */}
//                 <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 flex-shrink-0">
//                     <p className="text-green-400 text-sm text-center">
//                         ✅ Connected to Tournament Backend • {tournaments.length} tournaments loaded
//                     </p>
//                 </div>

//                 {/* Error Display */}
//                 {error && (
//                     <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex-shrink-0">
//                         <div className="flex justify-between items-start">
//                             <p className="text-red-400 flex-1">{error}</p>
//                             <button
//                                 onClick={loadData}
//                                 className="ml-4 px-3 py-1 bg-red-500/30 hover:bg-red-500/50 text-red-300 rounded text-sm transition-colors"
//                             >
//                                 Retry
//                             </button>
//                         </div>
//                     </div>
//                 )}

//                 {/* Navigation Tabs */}
//                 <div className="flex gap-4 mb-6 flex-shrink-0 flex-wrap">
//                     {[
//                         { key: 'all', label: 'All Tournaments', count: tournaments.length },
//                         { key: 'my', label: 'My Tournaments', count: myTournaments.length },
//                         { key: 'invitations', label: 'Invitations', count: invitations.length },
//                         { key: 'create', label: 'Create Tournament', count: 0 }
//                     ].map(tab => (
//                         <button
//                             key={tab.key}
//                             onClick={() => setActiveTab(tab.key as any)}
//                             className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.key
//                                 ? 'bg-primary text-dark'
//                                 : 'bg-dark/50 text-gray-300 hover:bg-dark/70'
//                                 }`}
//                         >
//                             {tab.label}
//                             {tab.count > 0 && (
//                                 <span className="ml-2 px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
//                                     {tab.count}
//                                 </span>
//                             )}
//                         </button>
//                     ))}
//                 </div>

//                 {/* Content */}
//                 {isLoading ? (
//                     <div className="text-center py-12">
//                         <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
//                         <p className="text-gray-300">Loading tournaments...</p>
//                     </div>
//                 ) : (
//                     <div className="min-h-0 flex-1">
//                         {activeTab === 'all' && (
//                             <div className="space-y-4">
//                                 <h2 className="text-xl font-bold text-white">Public Tournaments</h2>
//                                 {tournaments.length === 0 ? (
//                                     <div className="text-center py-8 text-gray-400">
//                                         No public tournaments available. Be the first to create one!
//                                     </div>
//                                 ) : (
//                                     <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
//                                         {tournaments.map(tournament => (
//                                             <TournamentCard key={tournament.id} tournament={tournament} />
//                                         ))}
//                                     </div>
//                                 )}
//                             </div>
//                         )}

//                         {activeTab === 'my' && (
//                             <div className="space-y-4">
//                                 <h2 className="text-xl font-bold text-white">My Tournaments</h2>
//                                 {myTournaments.length === 0 ? (
//                                     <div className="text-center py-8 text-gray-400">
//                                         You haven't created or joined any tournaments yet.
//                                     </div>
//                                 ) : (
//                                     <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
//                                         {myTournaments.map(tournament => (
//                                             <TournamentCard key={tournament.id} tournament={tournament} />
//                                         ))}
//                                     </div>
//                                 )}
//                             </div>
//                         )}

//                         {activeTab === 'invitations' && (
//                             <div className="space-y-4">
//                                 <h2 className="text-xl font-bold text-white">Tournament Invitations</h2>
//                                 {invitations.length === 0 ? (
//                                     <div className="text-center py-8 text-gray-400">
//                                         No pending invitations.
//                                     </div>
//                                 ) : (
//                                     <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
//                                         {invitations.map(invitation => (
//                                             <InvitationCard key={invitation.id} invitation={invitation} />
//                                         ))}
//                                     </div>
//                                 )}
//                             </div>
//                         )}

//                         {activeTab === 'create' && (
//                             <div className="max-h-[70vh] overflow-y-auto pr-2">
//                                 <TournamentCreation
//                                     userAddress={userAddress}
//                                     onTournamentCreated={(_tournamentId) => {
//                                         setActiveTab('my');
//                                         loadData();
//                                     }}
//                                     onClose={() => setActiveTab('all')}
//                                 />
//                             </div>
//                         )}
//                     </div>
//                 )}
//             </div>

//             {/* Scroll Buttons */}
//             {(showScrollTop || debugScrollButtons) && (
//                 <button
//                     onClick={scrollToTop}
//                     className="fixed bottom-20 right-6 z-[9999] bg-primary hover:bg-primary/90 text-dark p-3 rounded-full shadow-xl border-2 border-dark/20 transition-all duration-300 ease-in-out transform hover:scale-110"
//                     title="Scroll to top"
//                     style={{ backdropFilter: 'blur(8px)' }}
//                 >
//                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
//                     </svg>
//                 </button>
//             )}

//             {(showScrollBottom || debugScrollButtons) && (
//                 <button
//                     onClick={scrollToBottom}
//                     className="fixed bottom-6 right-6 z-[9999] bg-primary hover:bg-primary/90 text-dark p-3 rounded-full shadow-xl border-2 border-dark/20 transition-all duration-300 ease-in-out transform hover:scale-110"
//                     title="Scroll to bottom"
//                     style={{ backdropFilter: 'blur(8px)' }}
//                 >
//                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
//                     </svg>
//                 </button>
//             )}

//             {/* Debug button to test scroll buttons */}
//             <button
//                 onClick={() => setDebugScrollButtons(!debugScrollButtons)}
//                 className="fixed top-20 right-6 z-[9999] bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg"
//                 title="Toggle scroll buttons (debug)"
//             >
//                 {debugScrollButtons ? 'Hide' : 'Show'} Scroll Buttons
//             </button>

//             {/* Debug Mode Toggle */}
//             {debugScrollButtons && (
//                 <div className="fixed top-20 right-6 z-[9999] bg-dark/80 p-4 rounded-lg shadow-lg border border-primary/30">
//                     <p className="text-gray-300 text-sm mb-2">Debug Mode: Scroll Buttons</p>
//                     <div className="flex gap-2">
//                         <button
//                             onClick={() => setShowScrollTop(prev => !prev)}
//                             className="flex-1 px-3 py-2 bg-primary text-dark rounded-lg hover:bg-primary/90 transition-colors"
//                         >
//                             Toggle Scroll Top
//                         </button>
//                         <button
//                             onClick={() => setShowScrollBottom(prev => !prev)}
//                             className="flex-1 px-3 py-2 bg-primary text-dark rounded-lg hover:bg-primary/90 transition-colors"
//                         >
//                             Toggle Scroll Bottom
//                         </button>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };
