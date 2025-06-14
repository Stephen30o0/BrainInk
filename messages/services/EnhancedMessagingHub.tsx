import React, { useState, useEffect } from 'react';
import { MessageCircle, Users, Bot, Trophy, Target, Zap, BookOpen, TrendingUp } from 'lucide-react';
import { aiAgentService } from './services/aiAgentService';
import { squadService } from './services/squadService';
import { apiService } from '../src/services/apiService'; // <-- import your apiService
import { DirectMessagesTab } from './components/DirectMessagesTab';
import { GroupChatsTab } from './components/GroupChatsTab';
import { AIAgentChat } from './components/AIAgentChat';
import { SquadRoomPanel } from './components/SquadRoomPanel';
import { StudyLeaguesPanel } from './components/StudyLeaguesPanel';

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  badge?: number;
}

export const EnhancedMessagingHub = () => {
  const [activeTab, setActiveTab] = useState('dms');
  const [aiAgentActive, setAiAgentActive] = useState(false);
  const [kanaMessages, setKanaMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState({
    dms: 0,
    groups: 0,
    kana: 0
  });
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        console.log('🔄 Loading messaging hub data...');
        
        // Try to preload all data
        try {
          await apiService.preloadAllData();
        } catch (preloadError) {
          console.warn('⚠️ Preload failed, trying direct load:', preloadError);
        }

        // Get user and friends data
        let user = apiService.getUserProfile();
        let friends = apiService.getFriends();

        console.log('👤 User:', user);
        console.log('👥 Friends loaded:', friends);
        console.log('📊 Friends count:', friends?.length || 0);

        // If friends data seems incomplete, try direct API call
        if (!friends || friends.length === 0 || friends.some(f => !f.username || !f.fname)) {
          console.log('🔧 Friends data incomplete, trying direct refresh...');
          try {
            await apiService.refreshData('friends');
            friends = apiService.getFriends();
            console.log('🔄 Refreshed friends:', friends);
          } catch (refreshError) {
            console.warn('⚠️ Friends refresh failed:', refreshError);
          }
        }

        setUser(user);
        setFriends(friends || []);

        const kanaWelcome = await aiAgentService.getWelcomeMessage();
        setKanaMessages([kanaWelcome]);
        await loadNotifications();

      } catch (error) {
        console.error('❌ Error loading initial data:', error);
        // Set empty arrays so components don't crash
        setFriends([]);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const loadNotifications = async () => {
    // Optionally, update notifications here
  };

  const tabs: TabConfig[] = [
    {
      id: 'dms',
      label: 'Direct Messages',
      icon: <MessageCircle size={20} />,
      component: <DirectMessagesTab friends={friends} />,
      badge: notifications.dms
    },
    {
      id: 'groups',
      label: 'Squad Chats',
      icon: <Users size={20} />,
      component: <GroupChatsTab />,
      badge: notifications.groups
    },
    {
      id: 'leagues',
      label: 'Study Leagues',
      icon: <Trophy size={20} />,
      component: <StudyLeaguesPanel />
    },
    {
      id: 'squad-rooms',
      label: 'Squad Rooms',
      icon: <Target size={20} />,
      component: <SquadRoomPanel onBack={() => setActiveTab('groups')} />
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark text-primary text-xl">
        Loading your data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark flex">

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Tab Navigation */}
        <div className="border-b border-primary/20 bg-dark/95">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 flex items-center gap-3 transition-colors border-b-2 ${activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-gray-400 hover:text-white'
                  }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs text-white">{tab.badge}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {tabs.find(tab => tab.id === activeTab)?.component}
        </div>
      </div>      {/* AI Agent Modal */}
      {aiAgentActive && (
        <AIAgentChat
          onClose={() => setAiAgentActive(false)}
          kanaMessages={kanaMessages}
        />
      )}
    </div>
  );
};