import React, { useState, useEffect } from 'react';
import { Bell, Star, Trophy, BookOpen, MessageSquare, X, ChevronRight, UserPlus, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';

interface Notification {
  id: string;
  type: 'achievement' | 'friend_request' | 'message' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon?: React.ReactNode;
  action?: string;
  reward?: {
    xp: number;
    tokens: number;
  };
  data?: any;
}

export const NotificationsPanel = ({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load notifications from preloaded data
  const loadNotifications = async () => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);

    try {
      // First try to get preloaded data
      let preloadedData = apiService.getPreloadedData();

      // If no preloaded data, try to load it
      if (!preloadedData) {
        console.log('No preloaded data found, loading...');
        try {
          preloadedData = await apiService.preloadAllData();
        } catch (preloadError) {
          console.error('Failed to preload data:', preloadError);
          setError('Failed to load notifications. Please try again.');
          setLoading(false);
          return;
        }
      }

      const notificationsData = apiService.getNotifications();

      // Convert to notification format with icons
      const allNotifications: Notification[] = [
        ...notificationsData.friendRequests.map((notif: any) => ({
          ...notif,
          icon: <UserPlus className="text-blue-400" />
        })),
        ...notificationsData.achievements.map((notif: any) => ({
          ...notif,
          icon: <Award className="text-yellow-400" />
        })),
        ...notificationsData.messages.map((notif: any) => ({
          ...notif,
          icon: <MessageSquare className="text-green-400" />
        }))
      ];

      // Sort by most recent first
      allNotifications.sort((a, b) => {
        const getDate = (timeStr: string) => {
          if (timeStr === 'now') return new Date();
          if (timeStr.includes('m ago')) return new Date(Date.now() - parseInt(timeStr) * 60 * 1000);
          if (timeStr.includes('h ago')) return new Date(Date.now() - parseInt(timeStr) * 60 * 60 * 1000);
          if (timeStr.includes('d ago')) return new Date(Date.now() - parseInt(timeStr) * 24 * 60 * 60 * 1000);
          return new Date(timeStr);
        };

        return getDate(b.time).getTime() - getDate(a.time).getTime();
      });

      setNotifications(allNotifications);
      console.log('Loaded notifications from preloaded data:', allNotifications.length);

    } catch (err: any) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Handle notification actions
  const handleAction = async (notification: Notification) => {
    switch (notification.type) {
      case 'achievement':
        navigate('/achievements');
        break;

      case 'friend_request':
        navigate('/dashboard', { state: { activePanel: 'friends' } });
        break;

      case 'message':
        if (notification.data?.friend) {
          onClose();
          navigate('/messages', {
            state: {
              selectedFriend: notification.data.friend,
              openConversation: true
            }
          });
        }
        break;

      case 'system':
        navigate('/dashboard');
        break;
    }

    // Mark notification as read
    setNotifications(prev => prev.map(n =>
      n.id === notification.id ? { ...n, read: true } : n
    ));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Load notifications when panel opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-96 bg-dark/95 border border-primary/20 rounded-lg shadow-xl backdrop-blur-md overflow-hidden z-50">
      <div className="p-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <h3 className="font-pixel text-primary text-sm">Notifications</h3>
          <div className="flex items-center gap-2">
            {notifications.filter(n => !n.read).length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary/60 hover:text-primary"
              >
                Mark all as read
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/20 border-b border-red-500/30 text-red-400 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-300 hover:text-red-100 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="max-h-[60vh] overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-400">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <Bell size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No new notifications</p>
            <p className="text-xs mt-1">Check back later for updates</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-4 border-b border-primary/10 hover:bg-primary/5 transition-colors ${!notif.read ? 'bg-primary/10' : ''
                }`}
            >
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-dark/50 flex items-center justify-center flex-shrink-0">
                  {notif.icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-white mb-1">
                    {notif.title}
                    {!notif.read && (
                      <span className="ml-2 w-2 h-2 bg-primary rounded-full inline-block"></span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-400 mb-2">{notif.message}</p>
                  {notif.reward && (
                    <div className="flex gap-2 mb-2">
                      <span className="text-xs text-secondary">+{notif.reward.xp} XP</span>
                      <span className="text-xs text-yellow-400">+{notif.reward.tokens} INK</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{notif.time}</span>
                    {notif.action && (
                      <button
                        onClick={() => handleAction(notif)}
                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                      >
                        {notif.action}
                        <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-primary/20 bg-dark/50">
        <button
          onClick={() => navigate('/notifications')}
          className="w-full text-center text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-2"
        >
          View All Notifications
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};