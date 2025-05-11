import React, { useState } from 'react';
import { Bell, Star, Trophy, BookOpen, MessageSquare, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'achievement' | 'challenge' | 'social' | 'system';
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
}

export const NotificationsPanel = ({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([{
    id: '1',
    type: 'achievement',
    title: 'New Achievement!',
    message: 'You\'ve unlocked "Knowledge Seeker" badge',
    time: '2m ago',
    read: false,
    icon: <Star className="text-yellow-400" />,
    action: 'View Badge',
    reward: {
      xp: 100,
      tokens: 50
    }
  }, {
    id: '2',
    type: 'challenge',
    title: 'Challenge Complete',
    message: "You've completed the Physics 101 challenge",
    time: '1h ago',
    read: false,
    icon: <Trophy className="text-orange-400" />,
    action: 'Claim Reward',
    reward: {
      xp: 200,
      tokens: 100
    }
  }, {
    id: '3',
    type: 'social',
    title: 'New Follower',
    message: 'PhysicsProf is now following you',
    time: '2h ago',
    read: true,
    icon: <MessageSquare className="text-blue-400" />,
    action: 'View Profile'
  }, {
    id: '4',
    type: 'system',
    title: 'Course Update',
    message: 'New content available in your enrolled courses',
    time: '1d ago',
    read: true,
    icon: <BookOpen className="text-green-400" />,
    action: 'View Updates'
  }]);

  const handleAction = (notification: Notification) => {
    switch (notification.type) {
      case 'achievement':
        navigate('/achievements');
        break;
      case 'challenge':
        // Claim reward logic here
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        ));
        break;
      case 'social':
        navigate(`/profile/${notification.message.split(' ')[0]}`);
        break;
      case 'system':
        navigate('/courses');
        break;
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-96 bg-dark/95 border border-primary/20 rounded-lg shadow-xl backdrop-blur-md overflow-hidden z-50">
      <div className="p-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <h3 className="font-pixel text-primary text-sm">Notifications</h3>
          <button 
            onClick={markAllAsRead}
            className="text-xs text-primary/60 hover:text-primary"
          >
            Mark all as read
          </button>
        </div>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        {notifications.map(notif => (
          <div 
            key={notif.id} 
            className={`p-4 border-b border-primary/10 hover:bg-primary/5 transition-colors ${
              !notif.read ? 'bg-primary/10' : ''
            }`}
          >
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-dark/50 flex items-center justify-center flex-shrink-0">
                {notif.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white mb-1">
                  {notif.title}
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
        ))}
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