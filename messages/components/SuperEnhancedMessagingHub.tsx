import { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Users, Trophy, Target, Zap, Brain, Gift, Settings, Bell } from 'lucide-react';
import { AIAgentChat } from './AIAgentChat';
import { DirectMessagesTab } from './DirectMessagesTab';
import { GroupChatsTab } from './GroupChatsTab';
import { StudyLeaguesPanel } from './StudyLeaguesPanel';
import { SquadRoomPanel } from './SquadRoomPanel';
import { aiAgentService } from '../services/aiAgentService';
import TribeMatchingService from '../services/tribeMatchingService';
import { Squad } from '../services/squadService';

interface UserStats {
  xpBalance: number;
  streak: number;
  badges: number;
  squadId: number;
  rank: number;
  weeklyXP: number;
  totalQuizzes: number;
  accuracy: number;
}

interface AgentDrop {
  id: string;
  type: 'xp_bonus' | 'quiz_challenge' | 'study_tip' | 'motivation';
  content: string;
  xp_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  timestamp: Date;
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'achievement';
  timestamp: Date;
}

export const SuperEnhancedMessagingHub = ({ onClose }: { onClose?: () => void }) => {
  const [activeTab, setActiveTab] = useState<'kana' | 'dms' | 'groups' | 'leagues' | 'squad'>('kana');
  const [messages, setMessages] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    xpBalance: 0,
    streak: 0,
    badges: 0,
    squadId: 0,
    rank: 0,
    weeklyXP: 0,
    totalQuizzes: 0,
    accuracy: 0
  });
  const [agentDrops, setAgentDrops] = useState<AgentDrop[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [friends, setFriends] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [squadData, setSquadData] = useState<Squad | null>(null);
  
  const tribeMatchingService = useRef(new TribeMatchingService());
  const lastAgentDrop = useRef<number>(0);
  const agentDropTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeMessagingHub();
    startAgentDropTimer();
    startTribeMatching();
    
    return () => {
      if (agentDropTimer.current) {
        clearInterval(agentDropTimer.current);
      }
    };
  }, []);

  const initializeMessagingHub = async () => {
    try {
      setIsLoadingStats(true);
      
      // Load user stats
      await loadUserStats();
      
      // Load initial Kana message
      const welcomeMessage = await aiAgentService.getWelcomeMessage();
      setMessages([welcomeMessage]);
      
      // Load friends and other data
      await loadFriendsData();
      await loadLeaderboard();
      
      // Check for pending achievements
      await checkAchievements();
      
    } catch (error) {
      console.error('Failed to initialize messaging hub:', error);
      addNotification('Failed to load some data. Please refresh.', 'warning');
    } finally {
      setIsLoadingStats(false);
    }
  };  const loadUserStats = async () => {
    try {
      // Simulate API call - in production, this would fetch from your backend
      const mockStats: UserStats = {
        xpBalance: Math.floor(Math.random() * 1000) + 100,
        streak: Math.floor(Math.random() * 30) + 1,
        badges: Math.floor(Math.random() * 10) + 1,
        squadId: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : 0,
        rank: Math.floor(Math.random() * 100) + 1,
        weeklyXP: Math.floor(Math.random() * 500) + 50,
        totalQuizzes: Math.floor(Math.random() * 50) + 5,
        accuracy: Math.floor(Math.random() * 40) + 60
      };
      
      setUserStats(mockStats);
      
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const loadFriendsData = async () => {
    try {
      // Mock friends data
      const mockFriends = [
        { id: 1, name: 'Alice Scholar', status: 'online', lastSeen: new Date() },
        { id: 2, name: 'Bob Learner', status: 'studying', lastSeen: new Date() },
        { id: 3, name: 'Carol Genius', status: 'offline', lastSeen: new Date(Date.now() - 3600000) }
      ];
      setFriends(mockFriends);
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const mockLeaderboard = [
        { id: 1, name: "Brain Busters", weeklyScore: 1250, members: 8, position: 1 },
        { id: 2, name: "Study Warriors", weeklyScore: 1100, members: 6, position: 2 },
        { id: 3, name: "Knowledge Seekers", weeklyScore: 980, members: 7, position: 3 },
        { id: 4, name: "Academic Aces", weeklyScore: 850, members: 5, position: 4 },
        { id: 5, name: "Learning Legends", weeklyScore: 720, members: 4, position: 5 }
      ];
      setLeaderboard(mockLeaderboard);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const startAgentDropTimer = () => {
    // Random agent drops every 3-10 minutes of activity
    agentDropTimer.current = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastDrop = now - lastAgentDrop.current;
      const minInterval = 180000; // 3 minutes minimum
      const shouldDrop = Math.random() < 0.2 && timeSinceLastDrop > minInterval;
      
      if (shouldDrop) {
        await triggerAgentDrop();
      }
    }, 30000); // Check every 30 seconds
  };
  const startTribeMatching = async () => {
    try {
      const walletAddress = localStorage.getItem('wallet_address');
      if (!walletAddress) return;      // Capture user profile for tribe matching
      const profile = await tribeMatchingService.current.captureUserProfile(walletAddress);
      await tribeMatchingService.current.createUserEmbedding(profile);
      
      // Find similar users
      const matches = await tribeMatchingService.current.findSimilarUsers(walletAddress, 3);
      
      // Trigger introduction messages for high-similarity matches
      for (const match of matches) {
        if (match.similarity > 0.8) {
          await tribeMatchingService.current.triggerIntroMessage(walletAddress, match.userAddress, match);
          addNotification(`🤝 Found a study match with ${match.similarity * 100}% compatibility!`, 'info');
        }
      }
    } catch (error) {
      console.error('Tribe matching failed:', error);
    }
  };

  const triggerAgentDrop = async () => {
    try {
      const drop = await aiAgentService.triggerAgentDrop();
      const newDrop: AgentDrop = {
        ...drop,
        timestamp: new Date()
      };
      
      setAgentDrops(prev => [newDrop, ...prev.slice(0, 9)]); // Keep last 10 drops
      
      // Add notification
      addNotification(`🎁 Agent Drop: ${drop.content} (+${drop.xp_reward} XP)`, 'success');
      
      lastAgentDrop.current = Date.now();
      
      // Update user stats
      setUserStats(prev => ({
        ...prev,
        xpBalance: prev.xpBalance + drop.xp_reward,
        weeklyXP: prev.weeklyXP + drop.xp_reward
      }));
      
    } catch (error) {
      console.error('Failed to trigger agent drop:', error);
    }
  };

  const addNotification = (message: string, type: Notification['type']) => {
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const checkAchievements = async () => {
    try {
      // Check for streak achievements
      if (userStats.streak === 7) {
        addNotification('🏆 Achievement Unlocked: Week Warrior!', 'achievement');
      }
      if (userStats.streak === 30) {
        addNotification('🏆 Achievement Unlocked: Study Master!', 'achievement');
      }
      
      // Check for XP milestones
      if (userStats.xpBalance >= 1000) {
        addNotification('🎯 Milestone: 1000 XP reached!', 'achievement');
      }
      
      // Check for quiz achievements
      if (userStats.totalQuizzes >= 50) {
        addNotification('🏆 Achievement Unlocked: Quiz Champion!', 'achievement');
      }
      
    } catch (error) {
      console.error('Failed to check achievements:', error);
    }
  };

  const handleTabSwitch = (tab: typeof activeTab) => {
    setActiveTab(tab);
    
    // Load tab-specific data
    switch (tab) {
      case 'leagues':
        loadLeaderboard();
        break;
      case 'squad':
        loadSquadData();
        break;
      case 'kana':
        // Refresh Kana if needed
        break;
    }
  };

  const loadSquadData = async () => {    try {
      if (!userStats.squadId) return;

      // Mock squad data
      const mockSquadData: Squad = {
        id: userStats.squadId.toString(),
        name: leaderboard.find(s => s.id === userStats.squadId)?.name || 'My Squad',
        emoji: '🧠',
        description: 'AI Study Squad',
        creator_id: 1,
        is_public: true,
        max_members: 10,
        subject_focus: ['AI', 'Programming'],
        weekly_xp: leaderboard.find(s => s.id === userStats.squadId)?.weeklyScore || 500,
        total_xp: 2500,
        rank: leaderboard.find(s => s.id === userStats.squadId)?.position || 5,        members: [
          { id: 1, username: 'You', fname: 'You', lname: '', avatar: null, role: 'member', weekly_xp: 150, total_xp: 750, joined_at: new Date().toISOString(), last_active: new Date().toISOString() },
          { id: 2, username: 'Alice', fname: 'Alice', lname: 'Smith', avatar: null, role: 'member', weekly_xp: 120, total_xp: 650, joined_at: new Date().toISOString(), last_active: new Date().toISOString() },
          { id: 3, username: 'Bob', fname: 'Bob', lname: 'Johnson', avatar: null, role: 'member', weekly_xp: 130, total_xp: 700, joined_at: new Date().toISOString(), last_active: new Date().toISOString() }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        unread_count: 0,
        last_activity: new Date().toISOString()
      };
      
      setSquadData(mockSquadData);
    } catch (error) {
      console.error('Failed to load squad data:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'kana':
        return <AIAgentChat onClose={undefined} kanaMessages={messages} />;
      case 'dms':
        return <DirectMessagesTab friends={friends} />;
      case 'groups':
        return <GroupChatsTab />;      case 'leagues':
        return <StudyLeaguesPanel />;      case 'squad':
        return <SquadRoomPanel squad={squadData || undefined} onBack={() => setActiveTab('groups')} />;
      default:
        return <AIAgentChat onClose={undefined} kanaMessages={messages} />;
    }
  };

  const getRarityColor = (rarity: AgentDrop['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-600';
      case 'rare': return 'text-blue-400 border-blue-600';
      case 'epic': return 'text-purple-400 border-purple-600';
      case 'legendary': return 'text-yellow-400 border-yellow-600';
      default: return 'text-gray-400 border-gray-600';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'bg-green-500/90 border-green-400';
      case 'info': return 'bg-blue-500/90 border-blue-400';
      case 'warning': return 'bg-yellow-500/90 border-yellow-400';
      case 'achievement': return 'bg-purple-500/90 border-purple-400';
      default: return 'bg-gray-500/90 border-gray-400';
    }
  };

  if (isLoadingStats) {
    return (
      <div className="w-full h-full bg-dark rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading BrainInk Messaging...</p>
        </div>
      </div>
    );
  }  return (
    <div className="w-full h-full bg-dark rounded-lg overflow-hidden flex flex-col">
      {/* Header with User Stats */}
      <div className="p-4 border-b border-primary/20 bg-dark/95">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="text-primary" size={24} />
            BrainInk Messaging Hub
          </h1>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        {/* Enhanced User Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2 bg-primary/10 rounded px-3 py-2">
            <Zap size={16} className="text-primary" />
            <div>
              <div className="text-white font-medium">{userStats.xpBalance} XP</div>
              <div className="text-gray-400 text-xs">+{userStats.weeklyXP} this week</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-orange-500/10 rounded px-3 py-2">
            <Target size={16} className="text-orange-400" />
            <div>
              <div className="text-white font-medium">{userStats.streak} days</div>
              <div className="text-gray-400 text-xs">study streak</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-yellow-500/10 rounded px-3 py-2">
            <Trophy size={16} className="text-yellow-400" />
            <div>
              <div className="text-white font-medium">{userStats.badges} badges</div>
              <div className="text-gray-400 text-xs">earned</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-blue-500/10 rounded px-3 py-2">
            <Users size={16} className="text-blue-400" />
            <div>
              <div className="text-white font-medium">#{userStats.rank}</div>
              <div className="text-gray-400 text-xs">global rank</div>
            </div>
          </div>
        </div>
      </div>      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="absolute top-24 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`${getNotificationColor(notification.type)} border text-white px-4 py-3 rounded-lg shadow-lg max-w-sm animate-slide-in`}
            >
              <div className="flex items-start gap-2">
                {notification.type === 'achievement' && <Trophy size={16} className="mt-0.5 flex-shrink-0" />}
                {notification.type === 'success' && <Gift size={16} className="mt-0.5 flex-shrink-0" />}
                {notification.type === 'info' && <Bell size={16} className="mt-0.5 flex-shrink-0" />}
                <span className="text-sm">{notification.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Enhanced Sidebar */}
        <div className="w-72 bg-dark/50 border-r border-primary/20 p-4 space-y-4 overflow-y-auto">          {/* Navigation Tabs */}
          <div className="space-y-1">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Navigation</h3>
            
            <button
              onClick={() => handleTabSwitch('kana')}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                activeTab === 'kana' 
                  ? 'bg-primary/20 border border-primary/40 text-primary' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Brain size={20} />
              <div className="flex-1 text-left">
                <div>AI Study Coach</div>
                <div className="text-xs opacity-70">Chat with Kana</div>
              </div>
            </button>
            
            <button
              onClick={() => handleTabSwitch('dms')}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                activeTab === 'dms' 
                  ? 'bg-primary/20 border border-primary/40 text-primary' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <MessageCircle size={20} />
              <div className="flex-1 text-left">
                <div>Direct Messages</div>
                <div className="text-xs opacity-70">{friends.length} friends online</div>
              </div>
            </button>
            
            <button
              onClick={() => handleTabSwitch('groups')}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                activeTab === 'groups' 
                  ? 'bg-primary/20 border border-primary/40 text-primary' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Users size={20} />
              <div className="flex-1 text-left">
                <div>Study Groups</div>
                <div className="text-xs opacity-70">Join study sessions</div>
              </div>
            </button>
            
            <button
              onClick={() => handleTabSwitch('leagues')}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                activeTab === 'leagues' 
                  ? 'bg-primary/20 border border-primary/40 text-primary' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Trophy size={20} />
              <div className="flex-1 text-left">
                <div>Study Leagues</div>
                <div className="text-xs opacity-70">Compete & climb ranks</div>
              </div>
            </button>
            
            {userStats.squadId > 0 && (
              <button
                onClick={() => handleTabSwitch('squad')}
                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === 'squad' 
                    ? 'bg-primary/20 border border-primary/40 text-primary' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Target size={20} />
                <div className="flex-1 text-left">
                  <div>My Squad</div>
                  <div className="text-xs opacity-70">Squad #{userStats.squadId}</div>
                </div>
              </button>
            )}
          </div>          {/* Recent Agent Drops */}
          {agentDrops.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Recent Drops</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {agentDrops.slice(0, 5).map((drop) => (
                  <div
                    key={drop.id}
                    className={`p-3 bg-gray-800/50 rounded border ${getRarityColor(drop.rarity)}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className={`text-xs font-medium uppercase ${getRarityColor(drop.rarity).split(' ')[0]}`}>
                        {drop.rarity} DROP
                      </div>
                      <div className="text-primary text-xs font-medium">+{drop.xp_reward} XP</div>
                    </div>
                    <div className="text-gray-300 text-sm">{drop.content}</div>
                    <div className="text-gray-500 text-xs mt-1">
                      {drop.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Quick Actions</h3>
            <div className="space-y-1">
              <button
                onClick={() => triggerAgentDrop()}
                className="w-full p-2 text-left text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded flex items-center gap-2"
              >
                <Gift size={14} />
                Request Agent Drop
              </button>
              <button
                onClick={() => handleTabSwitch('leagues')}
                className="w-full p-2 text-left text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded flex items-center gap-2"
              >
                <Trophy size={14} />
                View Leaderboard
              </button>
              <button
                onClick={() => addNotification('Feature coming soon!', 'info')}
                className="w-full p-2 text-left text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded flex items-center gap-2"
              >
                <Settings size={14} />
                Settings
              </button>
            </div>
          </div>        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
