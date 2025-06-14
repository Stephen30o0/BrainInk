import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Users, Trophy, Zap, TrendingUp, Send, Bot,
  MoreVertical, Target, BookOpen, Award
} from 'lucide-react';
import { aiAgentService } from '../services/aiAgentService';
import { squadService, Squad, SquadMember, SquadMessage } from '../services/squadService';

// Remove local Squad interface - use the one from squadService
// Remove local SquadMessage interface - use the one from squadService

// Create a local message interface for internal handling
interface LocalSquadMessage {
  id: string;
  squad_id?: string;
  sender_id: number;
  sender_name: string;
  sender_avatar?: string | null;
  content: string;
  message_type: string;
  metadata?: any;
  created_at: string;
  reactions?: any[];
}

export const SquadRoomPanel = ({
  squad,
  onBack
}: {
  squad?: Squad; // allow undefined for safety
  onBack: () => void;
}) => {
  const [messages, setMessages] = useState<LocalSquadMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeView, setActiveView] = useState<'chat' | 'leaderboard' | 'progress'>('chat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [squadDetail, setSquadDetail] = useState<Squad | undefined>(squad);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (squad?.id) {
      loadSquadDetail();
      loadSquadMessages();
    }
    // eslint-disable-next-line
  }, [squad?.id]);

  const loadSquadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await squadService.getSquadDetail(squad!.id);
      if (detail) setSquadDetail(detail);
    } catch (e) {
      setError('Failed to load squad details.');
    } finally {
      setLoading(false);
    }
  };

  const loadSquadMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const { messages: backendMessages } = await squadService.getSquadMessages(squad!.id, 1, 50);
      // Map backend messages to local format
      const localMessages: LocalSquadMessage[] = backendMessages.map(msg => ({
        id: msg.id,
        squad_id: msg.squad_id,
        sender_id: msg.sender_id,
        sender_name: msg.sender_name,
        sender_avatar: msg.sender_avatar,
        content: msg.content,
        message_type: msg.message_type,
        metadata: msg.metadata,
        created_at: msg.created_at,
        reactions: msg.reactions
      }));
      setMessages(localMessages);
    } catch (e) {
      setError('Failed to load messages.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !squad) return;
    setError(null);
    try {
      const success = await squadService.sendSquadMessage(
        squad.id,
        newMessage,
        'text'
      );
      if (success) {
        setNewMessage('');
        await loadSquadMessages();
        scrollToBottom();
      } else {
        setError('Failed to send message.');
      }
    } catch (error) {
      setError('Failed to send message.');
    }
  };

  const triggerQuizDrop = async () => {
    try {
      const quiz = await aiAgentService.getQuizDrop();
      // Optionally, you can send this as a special message to the backend if you want it persisted
      // For now, just append to local messages
      const quizMessage: LocalSquadMessage = {
        id: Date.now().toString(),
        squad_id: squad?.id,
        sender_id: 0,
        sender_name: 'Kana',
        content: '🎯 Quiz Drop! Answer this question to earn XP for your squad!',
        message_type: 'quiz_drop',
        created_at: new Date().toISOString(),
        metadata: quiz
      };
      setMessages(prev => [...prev, quizMessage]);
      scrollToBottom();
    } catch (error) {
      console.error('Error triggering quiz drop:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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

  const renderMessage = (message: LocalSquadMessage) => {
    if (message.message_type === 'quiz_drop') {
      return (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Bot size={20} className="text-purple-400" />
            <span className="font-medium text-purple-300">Kana</span>
            <span className="text-xs text-gray-400">{new Date(message.created_at).toLocaleTimeString()}</span>
          </div>
          <p className="text-white mb-3">{message.content}</p>
          {message.metadata && (
            <div className="bg-dark/50 rounded-lg p-3">
              <h4 className="font-medium text-white mb-2">{message.metadata.question}</h4>
              <div className="space-y-2">
                {message.metadata.options?.map((option: string, index: number) => (
                  <button
                    key={index}
                    className="w-full text-left p-2 rounded bg-primary/10 hover:bg-primary/20 text-white transition-colors"
                    onClick={() => {
                      aiAgentService.submitQuizAnswer(message.metadata.id, index);
                    }}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 text-sm">
                <span className="text-primary">+{message.metadata.xp_reward} XP</span>
                <span className="text-gray-400">{message.metadata.subject}</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    const isMe = message.sender_id === getCurrentUserId();
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[70%] ${isMe ? 'bg-primary/20' : 'bg-gray-800'} rounded-lg p-3`}>
          {!isMe && (
            <div className="text-sm text-primary font-medium mb-1">{message.sender_name}</div>
          )}
          <p className="text-white">{message.content}</p>
          <span className="text-xs text-gray-400 mt-1 block">
            {new Date(message.created_at).toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  };

  if (!squadDetail) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Loading squad...
      </div>
    );
  }

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
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                {squadDetail.emoji}
              </div>
              <div>
                <h2 className="font-medium text-white">{squadDetail.name}</h2>
                <span className="text-sm text-gray-400">{squadDetail.members.length} members</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={triggerQuizDrop}
                className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors"
              >
                <Zap size={16} className="inline mr-1" />
                Quiz Drop
              </button>
              <button className="text-primary hover:text-primary/80">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex mt-4 border-b border-primary/20">
            {[
              { id: 'chat', label: 'Chat', icon: <Users size={16} /> },
              { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy size={16} /> },
              { id: 'progress', label: 'Progress', icon: <TrendingUp size={16} /> }
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
              {loading ? (
                <div className="text-center text-gray-400">Loading...</div>
              ) : error ? (
                <div className="text-center text-red-400">{error}</div>
              ) : (
                <>
                  {messages.map(message => (
                    <div key={message.id}>
                      {renderMessage(message)}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-primary/20">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Message the squad..."
                  className="flex-1 bg-dark/50 border border-primary/20 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || loading}
                  className="p-2 rounded-full bg-primary text-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        ) : activeView === 'leaderboard' ? (
          <div className="flex-1 p-4">
            <h3 className="font-medium text-white mb-4">Squad Leaderboard</h3>
            <div className="space-y-3">
              {squadDetail.members
                .sort((a, b) => (b.weekly_xp || 0) - (a.weekly_xp || 0))
                .map((member: SquadMember, index: number) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3">
                      <span className="text-primary font-bold">#{index + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        {member.avatar || member.username?.[0]?.toUpperCase() || '👤'}
                      </div>
                      <div>
                        <span className="text-white">{member.fname} {member.lname}</span>
                        <div className="text-xs text-gray-400">@{member.username} • {member.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-primary font-medium">{member.weekly_xp || 0} XP</span>
                      <div className="text-xs text-gray-400">{member.total_xp || 0} total</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4">
            <h3 className="font-medium text-white mb-4">Squad Progress</h3>
            {/* Add heat maps, XP charts, subject progress here */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-medium text-white mb-2">Weekly XP</h4>
                <p className="text-2xl font-bold text-primary">{squadDetail.weekly_xp}</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <h4 className="font-medium text-white mb-2">Squad Rank</h4>
                <p className="text-2xl font-bold text-yellow-400">#{squadDetail.rank}</p>
              </div>
            </div>

            {/* Squad Description */}
            {squadDetail.description && (
              <div className="mt-4 p-4 rounded-lg bg-dark/50 border border-primary/20">
                <h4 className="font-medium text-white mb-2">About This Squad</h4>
                <p className="text-gray-300">{squadDetail.description}</p>
              </div>
            )}

            {/* Subject Focus */}
            {squadDetail.subject_focus && squadDetail.subject_focus.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-white mb-2">Subject Focus</h4>
                <div className="flex flex-wrap gap-2">
                  {squadDetail.subject_focus.map((subject, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Squad Sidebar */}
      <div className="w-64 border-l border-primary/20 bg-dark/95 p-4">
        <h3 className="font-medium text-white mb-4">Squad Actions</h3>
        <div className="space-y-3">
          <button className="w-full p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors">
            <Target size={16} className="inline mr-2" />
            Challenge Squad
          </button>
          <button className="w-full p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors">
            <BookOpen size={16} className="inline mr-2" />
            Study Session
          </button>
          <button className="w-full p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors">
            <Award size={16} className="inline mr-2" />
            View Badges
          </button>
        </div>

        <div className="mt-6">
          <h4 className="font-medium text-white mb-3">Squad Info</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Created</span>
              <span className="text-white">
                {squadDetail.created_at ? new Date(squadDetail.created_at).toLocaleDateString() : 'Recently'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Privacy</span>
              <span className="text-white">{squadDetail.is_public ? 'Public' : 'Private'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Max Members</span>
              <span className="text-white">{squadDetail.max_members}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-medium text-white mb-3">Recent Activity</h4>
          <div className="space-y-2 text-sm text-gray-400">
            <p>• Squad earned {squadDetail.weekly_xp} XP this week</p>
            <p>• Currently ranked #{squadDetail.rank}</p>
            <p>• {squadDetail.members.length} active members</p>
          </div>
        </div>
      </div>
    </div>
  );
};