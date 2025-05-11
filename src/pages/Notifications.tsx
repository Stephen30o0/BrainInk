import React, { useState } from 'react';
import { Star, Trophy, BookOpen, MessageSquare, Filter, ChevronDown, X, Bell } from 'lucide-react';
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

export const Notifications = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
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
    },
    {
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
    },
    {
      id: '3',
      type: 'social',
      title: 'New Follower',
      message: 'PhysicsProf is now following you',
      time: '2h ago',
      read: true,
      icon: <MessageSquare className="text-blue-400" />,
      action: 'View Profile'
    },
    {
      id: '4',
      type: 'system',
      title: 'Course Update',
      message: 'New content available in your enrolled courses',
      time: '1d ago',
      read: true,
      icon: <BookOpen className="text-green-400" />,
      action: 'View Updates'
    }
  ]);

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

  const filteredNotifications = notifications.filter(notif => 
    activeFilter === 'all' || notif.type === activeFilter
  );

  return (
    <div className="min-h-screen bg-dark p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-pixel text-2xl text-primary">Notifications</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 bg-dark/50 border border-primary/20 rounded-lg text-primary hover:bg-primary/10"
            >
              <Filter size={16} />
              <span>Filter</span>
              <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30"
            >
              Mark all as read
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-dark/50 border border-primary/20 rounded-lg">
            <div className="flex flex-wrap gap-2">
              {['all', 'achievement', 'challenge', 'social', 'system'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-sm capitalize ${
                    activeFilter === filter
                      ? 'bg-primary/20 text-primary'
                      : 'bg-dark/50 text-gray-400 hover:bg-primary/10'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.map(notif => (
            <div
              key={notif.id}
              className={`p-4 bg-dark/50 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors ${
                !notif.read ? 'bg-primary/10' : ''
              }`}
            >
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-dark/50 flex items-center justify-center flex-shrink-0">
                  {notif.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-1">
                        {notif.title}
                      </h3>
                      <p className="text-gray-400">{notif.message}</p>
                    </div>
                    <span className="text-sm text-gray-500">{notif.time}</span>
                  </div>
                  {notif.reward && (
                    <div className="flex gap-4 mt-2">
                      <span className="text-sm text-secondary">+{notif.reward.xp} XP</span>
                      <span className="text-sm text-yellow-400">+{notif.reward.tokens} INK</span>
                    </div>
                  )}
                  {notif.action && (
                    <button
                      onClick={() => handleAction(notif)}
                      className="mt-3 text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      {notif.action}
                      <ChevronDown size={14} className="rotate-[-90deg]" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark/50 flex items-center justify-center">
              <Bell size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No notifications</h3>
            <p className="text-gray-400">
              {activeFilter === 'all' 
                ? "You're all caught up!"
                : `No ${activeFilter} notifications at the moment.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};