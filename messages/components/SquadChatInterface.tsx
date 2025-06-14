import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Users, Trophy, Zap, TrendingUp, Send, Bot,
  MoreVertical, Target, BookOpen, Award, Settings, UserPlus,
  Calendar, Clock, Flame, Star, Volume2, Gift, Mic, Users as UsersIcon,
  X
} from 'lucide-react';
import { aiAgentService } from '../services/aiAgentService';
import { squadService, Squad, SquadMember, SquadMessage, SquadLeaderboardStats, StudyLeague, LeagueParticipant } from '../services/squadService';

// Remove duplicate interfaces and use the ones from squadService
interface LocalSquadMessage {
  id: string;
  squad_id?: string;
  sender_id: number;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  type: 'text' | 'quiz_drop' | 'achievement' | 'system' | 'challenge' | 'study_session';
  timestamp: string;
  metadata?: any;
  reactions?: { emoji: string; count: number; users: number[] }[];
}

interface SquadActivity {
  id: string;
  type: 'quiz_completed' | 'xp_earned' | 'rank_up' | 'challenge_won' | 'study_session';
  user: SquadMember;
  details: string;
  timestamp: string;
  xp_value?: number;
}

export const SquadChatInterface = ({
  squad: initialSquad,
  onBack,
  onSquadUpdated
}: {
  squad: Squad;
  onBack: () => void;
  onSquadUpdated?: () => void;
}) => {
  const [squad, setSquad] = useState<Squad>(initialSquad);
  const [messages, setMessages] = useState<LocalSquadMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeView, setActiveView] = useState<'chat' | 'leaderboard' | 'progress' | 'activities'>('chat');
  const [recentActivities, setRecentActivities] = useState<SquadActivity[]>([]);
  const [squadStats, setSquadStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    studyStreak: 0,
    challengesWon: 0
  });
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizInProgress, setQuizInProgress] = useState(false);
  const [quizLeaderboard, setQuizLeaderboard] = useState<any[]>([]);
  const [prizePool, setPrizePool] = useState(0);
  const [quizParticipants, setQuizParticipants] = useState<SquadMember[]>([]);
  const [quizSettings, setQuizSettings] = useState({
    entryFee: 0,
    prizeDistribution: [60, 30, 10], // % for 1st, 2nd, 3rd
  });
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [memberActionLoading, setMemberActionLoading] = useState<number | null>(null);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const [memberActionSuccess, setMemberActionSuccess] = useState<string | null>(null);
  const [leaderboardStats, setLeaderboardStats] = useState<SquadLeaderboardStats | null>(null);
  const [leaderboardView, setLeaderboardView] = useState<'squad' | 'global' | 'leagues'>('squad');
  const [globalSquads, setGlobalSquads] = useState<Squad[]>([]);
  const [userLeagues, setUserLeagues] = useState<StudyLeague[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<StudyLeague | null>(null);
  const [leagueLeaderboard, setLeagueLeaderboard] = useState<LeagueParticipant[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load squad detail and messages from backend
  useEffect(() => {
    loadSquadDetail();
    loadSquadMessages();
    // Optionally: loadSquadActivities(); loadSquadStats();
  }, [initialSquad.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load squad detail (members, stats, etc.)
  const loadSquadDetail = async () => {
    try {
      const detail = await squadService.getSquadDetail(initialSquad.id);
      if (detail) {
        setSquad(detail);
        onSquadUpdated?.();
      }
    } catch (error) {
      console.error('Error loading squad detail:', error);
    }
  };

  // Load squad messages from backend
  const loadSquadMessages = async () => {
    try {
      const { messages: backendMessages } = await squadService.getSquadMessages(initialSquad.id, 1, 50);
      // Map backend messages to local format
      setMessages(
        backendMessages.map(msg => ({
          id: msg.id,
          squad_id: msg.squad_id,
          sender_id: msg.sender_id,
          sender_name: msg.sender_name,
          sender_avatar: msg.sender_avatar || undefined,
          content: msg.content,
          type: msg.message_type as LocalSquadMessage['type'],
          timestamp: msg.created_at,
          metadata: msg.metadata,
          reactions: msg.reactions
            ? msg.reactions.map((r: any) => ({
              emoji: r.emoji,
              count: r.count,
              users: Array.isArray(r.users) ? r.users : [],
            }))
            : undefined,
        }))
      );
    } catch (error) {
      console.error('Error loading squad messages:', error);
    }
  };

  // Load squad activities - can be used for recent activities view
  const loadSquadActivities = async () => {
    // Mock recent activities
    const mockActivities: SquadActivity[] = [
      {
        id: '1',
        type: 'quiz_completed',
        user: squad.members[0],
        details: 'Completed Advanced Algebra Quiz',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        xp_value: 75
      },
      {
        id: '2',
        type: 'rank_up',
        user: squad.members[1],
        details: 'Reached Silver Tier',
        timestamp: new Date(Date.now() - 600000).toISOString()
      }
    ];
    setRecentActivities(mockActivities);
  };

  // Load squad statistics
  const loadSquadStats = async () => {
    // Mock squad statistics
    setSquadStats({
      totalQuizzes: 127,
      averageScore: 84.3,
      studyStreak: 12,
      challengesWon: 8
    });
  };

  // Load leaderboard data when leaderboard view is active
  useEffect(() => {
    if (activeView === 'leaderboard') {
      loadLeaderboardData();
    }
  }, [activeView, leaderboardView]);

  // Remove dummy leaderboard methods and update with real backend calls
  const loadLeaderboardData = async () => {
    setLeaderboardLoading(true);
    try {
      if (leaderboardView === 'squad') {
        // Load real squad detail to get updated members
        const detail = await squadService.getSquadDetail(squad.id);
        if (detail) {
          // Sort members by weekly XP for leaderboard
          const sortedMembers = detail.members.sort((a, b) => b.weekly_xp - a.weekly_xp);
          setSquad(prev => ({ ...prev, members: sortedMembers }));

          // Calculate real stats from actual data
          const stats: SquadLeaderboardStats = {
            total_members: detail.members.length,
            average_weekly_xp: detail.members.length > 0
              ? Math.round(detail.members.reduce((sum, m) => sum + m.weekly_xp, 0) / detail.members.length)
              : 0,
            top_performer: sortedMembers[0] || null,
            squad_rank_change: 0, // This would come from backend historical data
            weekly_growth: 0 // This would come from backend weekly comparison
          };
          setLeaderboardStats(stats);
        }
      } else if (leaderboardView === 'global') {
        // Load real global squad rankings
        const { squads } = await squadService.getGlobalSquadRankings(1, 20);
        setGlobalSquads(squads);
      } else if (leaderboardView === 'leagues') {
        // Load real user leagues
        const leagues = await squadService.getUserStudyLeagues('active');
        setUserLeagues(leagues);
        if (leagues.length > 0 && !selectedLeague) {
          setSelectedLeague(leagues[0]);
          await loadLeagueLeaderboard(leagues[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const loadLeagueLeaderboard = async (leagueId: string) => {
    try {
      const response = await squadService.getLeagueLeaderboard(leagueId, 1, 50);
      setLeagueLeaderboard(response.participants);
    } catch (error) {
      console.error('Error loading league leaderboard:', error);
      setLeagueLeaderboard([]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const success = await squadService.sendSquadMessage(
        squad.id,
        newMessage,
        'text'
      );
      if (success) {
        setNewMessage('');
        await loadSquadMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const triggerQuizDrop = async () => {
    try {
      const quiz = await aiAgentService.getQuizDrop();
      const quizMessage: LocalSquadMessage = {
        id: Date.now().toString(),
        sender_id: 0,
        sender_name: 'Kana',
        sender_avatar: '📚',
        content: '🎯 Squad Quiz Drop! Answer quickly to earn bonus XP for the team!',
        type: 'quiz_drop',
        timestamp: new Date().toISOString(),
        metadata: quiz
      };

      setMessages(prev => [...prev, quizMessage]);
      scrollToBottom();
    } catch (error) {
      console.error('Error triggering quiz drop:', error);
    }
  };

  const startStudySession = () => {
    const sessionMessage: LocalSquadMessage = {
      id: Date.now().toString(),
      sender_id: getCurrentUserId() || 0,
      sender_name: 'You',
      content: '📚 Started a group study session! Join me to earn collaborative XP',
      type: 'study_session',
      timestamp: new Date().toISOString(),
      metadata: {
        session_type: 'collaborative',
        subject: 'Mathematics',
        duration: 60,
        max_participants: 5
      }
    };

    setMessages(prev => [...prev, sessionMessage]);
    scrollToBottom();
  };

  const challengeAnotherSquad = async () => {
    try {
      // This would open a squad selection modal
      console.log('Challenge another squad initiated');
      const challengeMessage: LocalSquadMessage = {
        id: Date.now().toString(),
        sender_id: 0,
        sender_name: 'System',
        content: '⚔️ Squad challenge initiated! Waiting for opponent response...',
        type: 'challenge',
        timestamp: new Date().toISOString(),
        metadata: {
          challenge_type: 'quiz_battle',
          stakes: 'XP_POOL',
          duration: 30
        }
      };

      setMessages(prev => [...prev, challengeMessage]);
    } catch (error) {
      console.error('Error challenging squad:', error);
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        const currentUserId = getCurrentUserId() || 0;

        if (existingReaction) {
          if (existingReaction.users.includes(currentUserId)) {
            // Remove reaction
            existingReaction.count--;
            existingReaction.users = existingReaction.users.filter(id => id !== currentUserId);
          } else {
            // Add reaction
            existingReaction.count++;
            existingReaction.users.push(currentUserId);
          }
        } else {
          // New reaction
          reactions.push({ emoji, count: 1, users: [currentUserId] });
        }

        return { ...msg, reactions: reactions.filter(r => r.count > 0) };
      }
      return msg;
    }));
  };

  const getCurrentUserId = (): number | null => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      const tokenParts = token.split('.');
      const base64Payload = tokenParts[1];
      const paddedPayload = base64Payload.padEnd(base64Payload.length + (4 - base64Payload.length % 4) % 4, '=');
      const decodedPayload = atob(paddedPayload);
      const payload = JSON.parse(decodedPayload);
      return payload.user_id || payload.sub || payload.id || null;
    } catch (error) {
      return null;
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = (message: LocalSquadMessage) => {
    const isMe = message.sender_id === getCurrentUserId();
    const isSystem = message.sender_id === 0 && message.type !== 'quiz_drop';
    const isAI = message.sender_id === 0 && message.type === 'quiz_drop';

    if (message.type === 'quiz_drop') {
      return (
        <div key={message.id} className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              📚
            </div>
            <span className="font-medium text-purple-300">Kana</span>
            <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
          </div>

          <p className="text-white mb-3">{message.content}</p>

          {message.metadata && (
            <div className="bg-dark/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-white">{message.metadata.question}</h4>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-xs">
                    {message.metadata.subject}
                  </span>
                  <span className="text-primary text-xs">+{message.metadata.xp_reward} XP</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {message.metadata.options?.map((option: string, index: number) => (
                  <button
                    key={index}
                    className="text-left p-3 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-white transition-colors"
                    onClick={() => {
                      // Handle quiz answer
                      console.log('Quiz answer:', index);
                    }}
                  >
                    <span className="font-medium mr-2">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </button>
                ))}
              </div>

              {message.metadata.time_limit && (
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className="text-gray-400">
                    <Clock size={14} className="inline mr-1" />
                    {message.metadata.time_limit}s to answer
                  </span>
                  <span className="text-gray-400">{message.metadata.difficulty}</span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (message.type === 'achievement' || isSystem) {
      return (
        <div key={message.id} className="flex justify-center mb-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2 max-w-md">
            <p className="text-green-300 text-sm text-center">{message.content}</p>
            <span className="text-xs text-gray-400 block text-center mt-1">
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4 group`}>
        <div className={`max-w-[70%] ${isMe ? 'bg-primary/20' : 'bg-gray-800'} rounded-lg p-3 relative`}>
          {!isMe && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{message.sender_avatar || '👤'}</span>
              <span className="font-medium text-primary text-sm">{message.sender_name}</span>
            </div>
          )}

          <p className="text-white">{message.content}</p>

          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction, index) => (
                <button
                  key={index}
                  onClick={() => addReaction(message.id, reaction.emoji)}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-dark/50 hover:bg-dark/70 transition-colors"
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-xs text-gray-400">{reaction.count}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>

            {/* Quick Reactions */}
            <div className="hidden group-hover:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {['❤️', '👍', '😂', '🔥', '🎯'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => addReaction(message.id, emoji)}
                  className="hover:scale-110 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Handler to start a voice quiz battle
  const handleStartVoiceQuiz = () => {
    setShowQuizModal(true);
  };

  // Handler to confirm and start the quiz
  const handleConfirmQuiz = () => {
    setQuizInProgress(true);
    setShowQuizModal(false);
    // Simulate inviting all squad members
    setQuizParticipants(squad.members);
    // Simulate prize pool calculation
    setPrizePool(quizSettings.entryFee * squad.members.length);
    // Simulate quiz duration (e.g., 30 seconds)
    setTimeout(() => {
      // Simulate leaderboard (random for demo)
      const shuffled = [...squad.members].sort(() => Math.random() - 0.5);
      setQuizLeaderboard(shuffled.map((m, i) => ({
        ...m,
        rank: i + 1,
        prize: i < 3 ? Math.floor(prizePool * quizSettings.prizeDistribution[i] / 100) : 0
      })));
      setQuizInProgress(false);
    }, 30000); // 30 seconds for demo
  };

  // Add a modal for quiz setup
  const renderQuizModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-dark border border-primary/20 rounded-lg p-8 w-full max-w-md">
        <h2 className="font-pixel text-primary text-xl mb-4 flex items-center gap-2">
          <Mic size={20} /> Start Voice Quiz Battle
        </h2>
        <div className="mb-4">
          <label className="block text-white mb-2">Entry Fee (Ink Tokens per participant)</label>
          <input
            type="number"
            min={0}
            value={quizSettings.entryFee}
            onChange={e => setQuizSettings(s => ({ ...s, entryFee: Number(e.target.value) }))
            }
            className="w-full bg-dark/50 border border-primary/20 rounded-lg px-4 py-2 text-white"
          />
        </div>
        <div className="mb-4">
          <label className="block text-white mb-2">Prize Distribution (%)</label>
          <div className="flex gap-2">
            {quizSettings.prizeDistribution.map((val, idx) => (
              <input
                key={idx}
                type="number"
                min={0}
                max={100}
                value={val}
                onChange={e => {
                  const arr = [...quizSettings.prizeDistribution];
                  arr[idx] = Number(e.target.value);
                  setQuizSettings(s => ({ ...s, prizeDistribution: arr }));
                }}
                className="w-16 bg-dark/50 border border-primary/20 rounded-lg px-2 py-1 text-white"
              />
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-1">1st, 2nd, 3rd place</div>
        </div>
        <div className="mb-4">
          <label className="block text-white mb-2">Participants</label>
          <div className="flex flex-wrap gap-2">
            {squad.members.map(m => (
              <span key={m.id} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {m.fname}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowQuizModal(false)}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmQuiz}
            className="flex-1 py-2 bg-primary text-dark font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Start Quiz Battle
          </button>
        </div>
      </div>
    </div>
  );

  // Add a modal for quiz leaderboard
  const renderQuizLeaderboard = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-dark border border-primary/20 rounded-lg p-8 w-full max-w-lg">
        <h2 className="font-pixel text-primary text-xl mb-4 flex items-center gap-2">
          <Gift size={20} /> Quiz Battle Results
        </h2>
        <div className="mb-4">
          <div className="flex items-center gap-2 text-lg text-primary">
            <UsersIcon size={18} /> Prize Pool: <span className="font-bold">{prizePool} Ink</span>
          </div>
        </div>
        <div className="space-y-3">
          {quizLeaderboard.map((m, idx) => (
            <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg ${idx < 3 ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-primary/10 border border-primary/20'}`}>
              <div className="flex items-center gap-3">
                <span className="font-bold text-xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}</span>
                <span className="text-white">{m.fname} {m.lname}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary font-bold">{m.prize} Ink</span>
                <span className="text-gray-400 text-xs">Rank #{m.rank}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setQuizLeaderboard([])}
          className="mt-6 w-full py-2 bg-primary text-dark font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );

  const handlePromote = async (memberId: number) => {
    setMemberActionLoading(memberId);
    setMemberActionError(null);
    setMemberActionSuccess(null);

    try {
      const success = await squadService.promoteMember(squad.id, memberId);
      if (success) {
        setMemberActionSuccess('Member promoted successfully!');
        await loadSquadDetail();
        setTimeout(() => setMemberActionSuccess(null), 3000);
      } else {
        setMemberActionError('Failed to promote member. You may not have permission.');
      }
    } catch (error) {
      console.error('Error promoting member:', error);
      setMemberActionError('Failed to promote member. Please try again.');
    } finally {
      setMemberActionLoading(null);
    }
  };

  const handleRemove = async (memberId: number) => {
    setMemberActionLoading(memberId);
    setMemberActionError(null);
    setMemberActionSuccess(null);

    try {
      const success = await squadService.removeMember(squad.id, memberId);
      if (success) {
        setMemberActionSuccess('Member removed successfully!');
        await loadSquadDetail();
        setTimeout(() => setMemberActionSuccess(null), 3000);
      } else {
        setMemberActionError('Failed to remove member. You may not have permission.');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      setMemberActionError('Failed to remove member. Please try again.');
    } finally {
      setMemberActionLoading(null);
    }
  };

  const handleTransferLeadership = async (memberId: number) => {
    if (!confirm('Are you sure you want to transfer leadership? This action cannot be undone.')) {
      return;
    }

    setMemberActionLoading(memberId);
    setMemberActionError(null);
    setMemberActionSuccess(null);

    try {
      const success = await squadService.transferLeadership(squad.id, memberId);
      if (success) {
        setMemberActionSuccess('Leadership transferred successfully!');
        await loadSquadDetail();
        setTimeout(() => {
          setMemberActionSuccess(null);
          setShowManageMembers(false);
        }, 2000);
      } else {
        setMemberActionError('Failed to transfer leadership. Please try again.');
      }
    } catch (error) {
      console.error('Error transferring leadership:', error);
      setMemberActionError('Failed to transfer leadership. Please try again.');
    } finally {
      setMemberActionLoading(null);
    }
  };

  // Enhanced Manage Members Modal with better error handling
  const renderManageMembersModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-dark border border-primary/20 rounded-lg p-8 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pixel text-primary text-xl">Manage Squad Members</h2>
          <button
            onClick={() => {
              setShowManageMembers(false);
              setMemberActionError(null);
              setMemberActionSuccess(null);
            }}
            className="text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success/Error Messages */}
        {memberActionSuccess && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-sm">{memberActionSuccess}</p>
          </div>
        )}

        {memberActionError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{memberActionError}</p>
          </div>
        )}

        <div className="space-y-4">
          {squad.members.map(member => {
            const isCurrentUser = member.id === getCurrentUserId();
            const isLeaderUser = member.role === 'leader';
            const isCurrentUserLeader = squad.members.find(m => m.id === getCurrentUserId())?.role === 'leader';
            const isLoading = memberActionLoading === member.id;

            return (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-dark/50 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    {member.avatar || member.username[0]?.toUpperCase() || '👤'}
                  </div>
                  <div>
                    <div className="text-white font-medium flex items-center gap-2">
                      {member.fname} {member.lname}
                      {isCurrentUser && <span className="text-xs text-primary">(You)</span>}
                      {isLeaderUser && <span className="text-xs text-yellow-400">👑 Leader</span>}
                    </div>
                    <div className="text-xs text-gray-400">
                      @{member.username} • {member.role} • {member.weekly_xp} XP this week
                    </div>
                  </div>
                </div>

                {isCurrentUserLeader && !isCurrentUser && (
                  <div className="flex gap-2">
                    {!isLeaderUser && (
                      <>
                        <button
                          className="px-3 py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs hover:bg-yellow-500/20 disabled:opacity-50"
                          onClick={() => handlePromote(member.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? '...' : 'Promote'}
                        </button>
                        <button
                          className="px-3 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs hover:bg-blue-500/20 disabled:opacity-50"
                          onClick={() => handleTransferLeadership(member.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? '...' : 'Make Leader'}
                        </button>
                        <button
                          className="px-3 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-xs hover:bg-red-500/20 disabled:opacity-50"
                          onClick={() => handleRemove(member.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? '...' : 'Remove'}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {!isCurrentUserLeader && (
                  <div className="text-xs text-gray-500">
                    {isCurrentUser ? 'You' : 'Member'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-300 text-sm">
            <strong>Leader permissions:</strong> Promote members, transfer leadership, or remove members from the squad.
          </p>
        </div>
      </div>
    </div>
  );

  // Enhanced leaderboard with better sorting and display
  const renderLeaderboard = () => (
    <div className="flex-1 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-white">Leaderboards</h3>
        <div className="flex gap-2">
          {[
            { id: 'squad', label: 'Squad', icon: '👥' },
            { id: 'global', label: 'Global', icon: '🌍' },
            { id: 'leagues', label: 'Leagues', icon: '🏆' }
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setLeaderboardView(view.id as any)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${leaderboardView === view.id
                ? 'bg-primary text-dark'
                : 'bg-dark/50 text-gray-400 hover:text-white'
                }`}
            >
              {view.icon} {view.label}
            </button>
          ))}
        </div>
      </div>

      {leaderboardLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-400">Loading leaderboard...</div>
        </div>
      ) : (
        <>
          {leaderboardView === 'squad' && renderSquadLeaderboard()}
          {leaderboardView === 'global' && renderGlobalLeaderboard()}
          {leaderboardView === 'leagues' && renderLeaguesLeaderboard()}
        </>
      )}
    </div>
  );

  const renderSquadLeaderboard = () => (
    <div>
      {/* Squad Stats Overview */}
      {leaderboardStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <h4 className="text-white font-medium text-sm">Members</h4>
            <p className="text-primary text-xl font-bold">{leaderboardStats.total_members}</p>
          </div>
          <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
            <h4 className="text-white font-medium text-sm">Avg Weekly XP</h4>
            <p className="text-green-400 text-xl font-bold">{leaderboardStats.average_weekly_xp.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
            <h4 className="text-white font-medium text-sm">Squad Rank</h4>
            <p className="text-yellow-400 text-xl font-bold">#{squad.rank}</p>
            <p className="text-xs text-gray-400">
              {leaderboardStats.squad_rank_change > 0 ? '↑' : leaderboardStats.squad_rank_change < 0 ? '↓' : '→'}
              {Math.abs(leaderboardStats.squad_rank_change)}
            </p>
          </div>
          <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <h4 className="text-white font-medium text-sm">Growth</h4>
            <p className="text-blue-400 text-xl font-bold">+{leaderboardStats.weekly_growth}%</p>
            <p className="text-xs text-gray-400">This week</p>
          </div>
        </div>
      )}

      {/* Squad Members Leaderboard */}
      <div className="space-y-3">
        {squad.members.map((member, index) => {
          const isCurrentUser = member.id === getCurrentUserId();
          const isTopThree = index < 3;
          const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

          return (
            <div
              key={member.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${isCurrentUser
                ? 'bg-primary/10 border-primary/40 ring-2 ring-primary/30'
                : isTopThree
                  ? 'bg-gradient-to-r from-yellow-500/5 to-yellow-500/10 border-yellow-500/20'
                  : 'bg-dark/30 border-primary/20 hover:border-primary/30'
                }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-gray-400 text-black' :
                    index === 2 ? 'bg-orange-500 text-black' :
                      'bg-primary/20 text-primary'
                  }`}>
                  {medalEmoji || (index + 1)}
                </div>

                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  {member.avatar || member.username?.[0]?.toUpperCase() || '👤'}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-medium">
                      {member.fname} {member.lname}
                    </h4>
                    {isCurrentUser && (
                      <span className="text-xs text-primary bg-primary/20 px-2 py-1 rounded-full">You</span>
                    )}
                    {member.role === 'leader' && (
                      <span className="text-xs text-yellow-400">👑 Leader</span>
                    )}
                    {member.role === 'moderator' && (
                      <span className="text-xs text-blue-400">🛡️ Mod</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>@{member.username}</span>
                    {member.is_online && <span className="text-green-400">🟢 Online</span>}
                    <span>Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-primary font-bold text-xl">{member.weekly_xp.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">{member.total_xp.toLocaleString()} total XP</div>
                <div className="text-xs text-gray-500">
                  Last active: {new Date(member.last_active).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderGlobalLeaderboard = () => (
    <div>
      <div className="mb-4">
        <h4 className="text-white font-medium mb-2">Top Squads Globally</h4>
        <p className="text-gray-400 text-sm">See how your squad ranks against others worldwide</p>
      </div>

      <div className="space-y-3">
        {globalSquads.map((globalSquad, index) => {
          const isCurrentSquad = globalSquad.id === squad.id;
          const isTopThree = index < 3;
          const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

          return (
            <div
              key={globalSquad.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${isCurrentSquad
                ? 'bg-primary/10 border-primary/40 ring-2 ring-primary/30'
                : isTopThree
                  ? 'bg-gradient-to-r from-yellow-500/5 to-yellow-500/10 border-yellow-500/20'
                  : 'bg-dark/30 border-primary/20'
                }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-gray-400 text-black' :
                    index === 2 ? 'bg-orange-500 text-black' :
                      'bg-primary/20 text-primary'
                  }`}>
                  {medalEmoji || (index + 1)}
                </div>

                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                  {globalSquad.emoji}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-medium">{globalSquad.name}</h4>
                    {isCurrentSquad && (
                      <span className="text-xs text-primary bg-primary/20 px-2 py-1 rounded-full">Your Squad</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {globalSquad.members.length} members • {globalSquad.is_public ? 'Public' : 'Private'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-primary font-bold text-xl">{globalSquad.weekly_xp.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">{globalSquad.total_xp.toLocaleString()} total XP</div>
                <div className="text-xs text-gray-500">Rank #{globalSquad.rank}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderLeaguesLeaderboard = () => (
    <div>
      <div className="mb-4">
        <h4 className="text-white font-medium mb-2">Study League Leaderboards</h4>
        {userLeagues.length > 0 ? (
          <div className="flex gap-2 mb-4">
            {userLeagues.map(league => (
              <button
                key={league.id}
                onClick={() => {
                  setSelectedLeague(league);
                  loadLeagueLeaderboard(league.id);
                }}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${selectedLeague?.id === league.id
                  ? 'bg-primary text-dark'
                  : 'bg-dark/50 text-gray-400 hover:text-white'
                  }`}
              >
                {league.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">You're not in any active study leagues</p>
        )}
      </div>

      {selectedLeague && (
        <div className="mb-4 p-4 bg-dark/50 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-white font-medium">{selectedLeague.name}</h5>
            <span className={`px-2 py-1 rounded text-xs ${selectedLeague.status === 'active' ? 'bg-green-500/20 text-green-400' :
              selectedLeague.status === 'upcoming' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
              {selectedLeague.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Subject:</span>
              <span className="text-white ml-2">{selectedLeague.subject}</span>
            </div>
            <div>
              <span className="text-gray-400">Participants:</span>
              <span className="text-white ml-2">{selectedLeague.participants}/{selectedLeague.max_participants}</span>
            </div>
            <div>
              <span className="text-gray-400">Prize Pool:</span>
              <span className="text-primary ml-2">{selectedLeague.prize_pool} Ink</span>
            </div>
            <div>
              <span className="text-gray-400">Your Rank:</span>
              <span className="text-yellow-400 ml-2">#{selectedLeague.my_rank || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {leagueLeaderboard.length > 0 && (
        <div className="space-y-3">
          {leagueLeaderboard.map((participant, index) => {
            const isCurrentUser = participant.id === getCurrentUserId();
            const isTopThree = index < 3;
            const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

            return (
              <div
                key={participant.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${isCurrentUser
                  ? 'bg-primary/10 border-primary/40 ring-2 ring-primary/30'
                  : isTopThree
                    ? 'bg-gradient-to-r from-yellow-500/5 to-yellow-500/10 border-yellow-500/20'
                    : 'bg-dark/30 border-primary/20'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-500 text-black' :
                        'bg-primary/20 text-primary'
                    }`}>
                    {medalEmoji || participant.rank}
                  </div>

                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    {participant.avatar || participant.username?.[0]?.toUpperCase() || '👤'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-medium">
                        {participant.fname} {participant.lname}
                      </h4>
                      {isCurrentUser && (
                        <span className="text-xs text-primary bg-primary/20 px-2 py-1 rounded-full">You</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      @{participant.username} • {participant.accuracy}% accuracy
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-primary font-bold text-xl">{participant.score.toLocaleString()}</div>
                  <div className="text-gray-400 text-sm">{participant.xp_earned.toLocaleString()} XP earned</div>
                  <div className="text-xs text-gray-500">
                    {participant.correct_answers}/{participant.questions_answered} correct
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const isLeader = squad.members.find(
    m => m.id === getCurrentUserId() && m.role === 'leader'
  );

  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-primary/20 bg-dark/95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="text-primary hover:text-primary/80">
                <ArrowLeft size={20} />
              </button>
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                {squad.emoji}
              </div>
              <div>
                <h2 className="font-medium text-white text-lg">{squad.name}</h2>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span>{squad.members.length} members</span>
                  <span>Rank #{squad.rank}</span>
                  <span>{squad.weekly_xp} XP this week</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Add Voice Quiz Battle Button */}
              <button
                onClick={handleStartVoiceQuiz}
                className="px-3 py-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/20 transition-colors flex items-center gap-2"
              >
                <Volume2 size={16} />
                Voice Quiz Battle
              </button>
              <button
                onClick={triggerQuizDrop}
                className="px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors"
              >
                <Zap size={16} className="inline mr-1" />
                Quiz Drop
              </button>
              <button
                onClick={startStudySession}
                className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors"
              >
                <BookOpen size={16} className="inline mr-1" />
                Study
              </button>
              <button className="text-primary hover:text-primary/80">
                <MoreVertical size={20} />
              </button>
              {isLeader && (
                <button
                  onClick={() => setShowManageMembers(true)}
                  className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                >
                  <Users size={16} />
                  Manage Members
                </button>
              )}
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex mt-4 border-b border-primary/20">
            {[
              { id: 'chat', label: 'Chat', icon: <Users size={16} /> },
              { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy size={16} /> },
              { id: 'progress', label: 'Progress', icon: <TrendingUp size={16} /> },
              { id: 'activities', label: 'Activities', icon: <Flame size={16} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${activeView === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-white'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {activeView === 'chat' ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-primary/20">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={`Message ${squad.name}...`}
                  className="flex-1 bg-dark/50 border border-primary/20 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 rounded-full bg-primary text-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        ) : activeView === 'leaderboard' ? (
          renderLeaderboard()
        ) : activeView === 'progress' ? (
          <div className="flex-1 p-4">
            <h3 className="font-medium text-white mb-4">Squad Progress</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-medium text-white mb-2">Weekly XP</h4>
                <p className="text-2xl font-bold text-primary">{squad.weekly_xp}</p>
                <p className="text-sm text-gray-400">+15% from last week</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <h4 className="font-medium text-white mb-2">Squad Rank</h4>
                <p className="text-2xl font-bold text-yellow-400">#{squad.rank}</p>
                <p className="text-sm text-gray-400">↑2 positions</p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <h4 className="font-medium text-white mb-2">Avg Score</h4>
                <p className="text-2xl font-bold text-green-400">{squadStats.averageScore}%</p>
                <p className="text-sm text-gray-400">Quiz performance</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <h4 className="font-medium text-white mb-2">Study Streak</h4>
                <p className="text-2xl font-bold text-blue-400">{squadStats.studyStreak}</p>
                <p className="text-sm text-gray-400">Days active</p>
              </div>
            </div>

            {/* Progress Chart Placeholder */}
            <div className="bg-dark/50 border border-primary/20 rounded-lg p-6">
              <h4 className="font-medium text-white mb-4">Weekly Activity</h4>
              <div className="h-32 bg-primary/5 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Progress chart coming soon...</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4">
            <h3 className="font-medium text-white mb-4">Recent Activities</h3>
            <div className="space-y-3">
              {recentActivities.map(activity => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-dark/50 border border-primary/20">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    {activity.user.avatar || activity.user.username[0]?.toUpperCase() || '👤'}
                  </div>
                  <div className="flex-1">
                    <p className="text-white">
                      <span className="font-medium">{activity.user.fname} {activity.user.lname}</span>
                      {' '}{activity.details}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{formatTime(activity.timestamp)}</span>
                      {activity.xp_value && (
                        <span className="text-primary">+{activity.xp_value} XP</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.type === 'quiz_completed' && <BookOpen size={16} className="text-blue-400" />}
                    {activity.type === 'rank_up' && <Star size={16} className="text-yellow-400" />}
                    {activity.type === 'xp_earned' && <Zap size={16} className="text-primary" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Squad Sidebar */}
      <div className="w-72 border-l border-primary/20 bg-dark/95 flex flex-col">
        <div className="p-4 border-b border-primary/20">
          <h3 className="font-medium text-white mb-4">Squad Actions</h3>
          <div className="space-y-3">
            <button
              onClick={challengeAnotherSquad}
              className="w-full p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Target size={16} className="inline mr-2" />
              Challenge Squad
            </button>
            <button
              onClick={startStudySession}
              className="w-full p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors"
            >
              <BookOpen size={16} className="inline mr-2" />
              Study Session
            </button>
            <button className="w-full p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors">
              <Award size={16} className="inline mr-2" />
              View Badges
            </button>
            <button className="w-full p-3 rounded-lg bg-gray-600/10 border border-gray-600/20 text-gray-400 hover:bg-gray-600/20 transition-colors">
              <UserPlus size={16} className="inline mr-2" />
              Invite Members
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-primary/20">
          <h4 className="font-medium text-white mb-3">Online Members</h4>
          <div className="space-y-2">
            {squad.members.slice(0, 5).map(member => (
              <div key={member.id} className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">
                    {member.avatar || member.username[0]?.toUpperCase() || '👤'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-dark"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{member.fname}</p>
                  <p className="text-gray-400 text-xs">{member.weekly_xp} XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 p-4">
          <h4 className="font-medium text-white mb-3">Squad Stats</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Quizzes</span>
              <span className="text-primary">{squadStats.totalQuizzes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Challenges Won</span>
              <span className="text-green-400">{squadStats.challengesWon}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Study Streak</span>
              <span className="text-yellow-400">{squadStats.studyStreak} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Created</span>
              <span className="text-gray-400">
                {squad.created_at ? new Date(squad.created_at).toLocaleDateString() : 'Recently'}
              </span>
            </div>
            {squad.description && (
              <div className="pt-2 border-t border-primary/20">
                <span className="text-gray-400 text-xs">Description</span>
                <p className="text-white text-sm mt-1">{squad.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {quizInProgress && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
          <div className="bg-dark border border-primary/20 rounded-lg p-8 text-center">
            <Mic size={48} className="mx-auto text-primary mb-4" />
            <h2 className="font-pixel text-primary text-2xl mb-2">Voice Quiz In Progress</h2>
            <p className="text-gray-400 mb-4">Quiz is live! Answer questions via voice. Prize Pool: <span className="text-primary font-bold">{prizePool} Ink</span></p>
            <div className="text-gray-400">Leaderboard will appear when the quiz ends.</div>
          </div>
        </div>
      )}
      {showQuizModal && renderQuizModal()}
      {quizLeaderboard.length > 0 && renderQuizLeaderboard()}
      {showManageMembers && renderManageMembersModal()}
    </div>
  );
};