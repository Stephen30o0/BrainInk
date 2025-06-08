import React, { useState, useEffect } from 'react';
import { Bell, Star, Trophy, BookOpen, MessageSquare, X, ChevronRight, UserPlus, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  data?: any; // Additional data for actions
}

// API Configuration
const FRIENDS_API_BASE = 'https://brainink-backend-freinds-micro.onrender.com/friends';
const ACHIEVEMENTS_API_BASE = 'https://brainink-backend-achivements-micro.onrender.com';

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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Token validation and user ID extraction
  const getValidToken = async (): Promise<string | null> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('No access token found');
      return null;
    }
    return token;
  };

  const getUserIdFromToken = (token: string): number | null => {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return null;

      const base64Payload = tokenParts[1];
      const paddedPayload = base64Payload.padEnd(base64Payload.length + (4 - base64Payload.length % 4) % 4, '=');
      const decodedPayload = atob(paddedPayload);
      const payload = JSON.parse(decodedPayload);

      return payload.user_id || payload.sub || payload.id || payload.userId ? parseInt(payload.user_id || payload.sub || payload.id || payload.userId) : null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (minutes < 1) return 'now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'unknown';
    }
  };

  // Load friend requests notifications
  const loadFriendRequestNotifications = async (): Promise<Notification[]> => {
    const token = await getValidToken();
    if (!token || !currentUserId) return [];

    try {
      console.log('Loading friend request notifications...');

      const response = await fetch(`${FRIENDS_API_BASE}/requests/pending/${currentUserId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        console.log('No pending friend requests or error loading them');
        return [];
      }

      const friendRequests = await response.json();
      console.log('Friend requests data:', friendRequests);

      return friendRequests.map((request: any) => ({
        id: `friend_request_${request.id}`,
        type: 'friend_request' as const,
        title: 'New Friend Request',
        message: `${request.friend_info?.fname && request.friend_info?.lname
          ? `${request.friend_info.fname} ${request.friend_info.lname}`
          : request.friend_info?.username || 'Someone'} wants to be your friend`,
        time: formatTimestamp(request.created_at),
        read: false,
        icon: <UserPlus className="text-blue-400" />,
        action: 'View Request',
        data: {
          friendship_id: request.id,
          requester: request.friend_info
        }
      }));
    } catch (err: any) {
      console.error('Error loading friend requests:', err);
      return [];
    }
  };

  // Load recent achievements notifications
  const loadAchievementNotifications = async (): Promise<Notification[]> => {
    const token = await getValidToken();
    if (!token) return [];

    try {
      console.log('Loading achievement notifications...');

      const response = await fetch(`${ACHIEVEMENTS_API_BASE}/achievements`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        console.log('No achievements or error loading them');
        return [];
      }

      const achievements = await response.json();
      console.log('Achievements data:', achievements);

      // Get recent achievements (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      return achievements
        .filter((achievement: any) => {
          if (!achievement.earned_at) return false;
          const earnedDate = new Date(achievement.earned_at);
          return earnedDate > weekAgo;
        })
        .slice(0, 5) // Limit to 5 recent achievements
        .map((achievement: any) => ({
          id: `achievement_${achievement.id}`,
          type: 'achievement' as const,
          title: 'New Achievement!',
          message: `You've unlocked "${achievement.name}"`,
          time: formatTimestamp(achievement.earned_at),
          read: false,
          icon: <Award className="text-yellow-400" />,
          action: 'View Achievement',
          reward: {
            xp: achievement.xp_reward || 0,
            tokens: Math.floor((achievement.xp_reward || 0) / 2) // Assuming tokens are half of XP
          },
          data: { achievement }
        }));
    } catch (err: any) {
      console.error('Error loading achievements:', err);
      return [];
    }
  };

  // Load recent messages notifications (unread messages from different friends)
  const loadMessageNotifications = async (): Promise<Notification[]> => {
    const token = await getValidToken();
    if (!token || !currentUserId) return [];

    try {
      console.log('Loading message notifications...');

      // First get friends list
      const friendsResponse = await fetch(`${FRIENDS_API_BASE}/list/${currentUserId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      console.log('Friends response status:', friendsResponse.status);

      if (!friendsResponse.ok) {
        console.log('Error loading friends or no friends found');
        const errorText = await friendsResponse.text();
        console.log('Friends API error:', errorText);
        return [];
      }

      const friendsData = await friendsResponse.json();
      console.log('Raw friends data:', friendsData);

      // Handle different possible response formats
      let friends = [];
      if (Array.isArray(friendsData)) {
        friends = friendsData;
      } else if (friendsData.friends && Array.isArray(friendsData.friends)) {
        friends = friendsData.friends;
      } else if (friendsData.data && Array.isArray(friendsData.data)) {
        friends = friendsData.data;
      } else {
        console.log('Unexpected friends data format:', friendsData);
        return [];
      }

      console.log('Processed friends:', friends);

      if (friends.length === 0) {
        console.log('No friends found');
        return [];
      }

      // Check for recent messages from each friend
      const messageNotifications: Notification[] = [];
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 24); // Extend to 24 hours for testing

      console.log('Checking messages for friends...', friends.length);

      for (const friend of friends.slice(0, 5)) { // Limit to check first 5 friends
        try {
          console.log(`Checking messages for friend: ${friend.username} (ID: ${friend.id})`);

          const conversationUrl = `${FRIENDS_API_BASE}/conversation/${currentUserId}/${friend.username}?page=1&page_size=10`;
          console.log('Conversation URL:', conversationUrl);

          const conversationResponse = await fetch(conversationUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });

          console.log(`Conversation response for ${friend.username}:`, conversationResponse.status);

          if (conversationResponse.ok) {
            const conversationData = await conversationResponse.json();
            console.log(`Conversation data for ${friend.username}:`, conversationData);

            const messages = conversationData.messages || [];
            console.log(`Messages for ${friend.username}:`, messages);

            if (messages.length === 0) {
              console.log(`No messages found for ${friend.username}`);
              continue;
            }

            // Find recent messages from this friend (not from current user)
            const recentMessages = messages.filter((msg: any) => {
              console.log(`Checking message from sender ${msg.sender_id} vs current user ${currentUserId}`);

              if (msg.sender_id === currentUserId) {
                console.log('Skipping own message');
                return false; // Skip my own messages
              }

              const messageDate = new Date(msg.created_at);
              const isRecent = messageDate > oneHourAgo;
              const isUnread = !msg.read_at || msg.status !== 'read';

              console.log(`Message date: ${messageDate}, is recent: ${isRecent}, is unread: ${isUnread}`);

              return isRecent && isUnread;
            });

            console.log(`Recent unread messages for ${friend.username}:`, recentMessages);

            if (recentMessages.length > 0) {
              const latestMessage = recentMessages[0];
              console.log(`Adding notification for message from ${friend.username}:`, latestMessage);

              messageNotifications.push({
                id: `message_${friend.id}_${latestMessage.id}`,
                type: 'message' as const,
                title: 'New Message',
                message: `${friend.fname && friend.lname
                  ? `${friend.fname} ${friend.lname}`
                  : friend.username}: ${latestMessage.content.length > 30
                    ? latestMessage.content.substring(0, 30) + '...'
                    : latestMessage.content}`,
                time: formatTimestamp(latestMessage.created_at),
                read: false,
                icon: <MessageSquare className="text-green-400" />,
                action: 'Reply',
                data: {
                  friend,
                  message: latestMessage,
                  unreadCount: recentMessages.length
                }
              });
            } else {
              console.log(`No recent unread messages for ${friend.username}`);
            }
          } else {
            const errorText = await conversationResponse.text();
            console.error(`Error fetching conversation for ${friend.username}:`, errorText);
          }
        } catch (err) {
          console.error(`Error checking messages for ${friend.username}:`, err);
        }
      }

      console.log('Total message notifications found:', messageNotifications);
      return messageNotifications;
    } catch (err: any) {
      console.error('Error loading message notifications:', err);
      return [];
    }
  };

  // Load all notifications
  const loadNotifications = async () => {
    if (!currentUserId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Loading all notifications...');

      // Add API test for debugging
      await testApiEndpoints();

      const [friendRequests, achievements, messages] = await Promise.all([
        loadFriendRequestNotifications(),
        loadAchievementNotifications(),
        loadMessageNotifications()
      ]);

      // Combine all notifications and sort by time
      const allNotifications = [...friendRequests, ...achievements, ...messages];

      console.log('Friend requests found:', friendRequests.length);
      console.log('Achievements found:', achievements.length);
      console.log('Messages found:', messages.length);

      // Sort by most recent first
      allNotifications.sort((a, b) => {
        // Extract actual dates for proper sorting
        const getDate = (timeStr: string) => {
          if (timeStr === 'now') return new Date();
          if (timeStr.includes('m ago')) return new Date(Date.now() - parseInt(timeStr) * 60 * 1000);
          if (timeStr.includes('h ago')) return new Date(Date.now() - parseInt(timeStr) * 60 * 60 * 1000);
          if (timeStr.includes('d ago')) return new Date(Date.now() - parseInt(timeStr) * 24 * 60 * 60 * 1000);
          return new Date(timeStr);
        };

        return getDate(b.time).getTime() - getDate(a.time).getTime();
      });

      console.log('All notifications loaded:', allNotifications);
      setNotifications(allNotifications);
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Add this test function to debug the API endpoints
  const testApiEndpoints = async () => {
    const token = await getValidToken();
    if (!token || !currentUserId) return;

    console.log('=== Testing API Endpoints ===');

    // Test friends list endpoint
    try {
      const friendsUrl = `${FRIENDS_API_BASE}/list/${currentUserId}`;
      console.log('Testing friends endpoint:', friendsUrl);

      const response = await fetch(friendsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Friends endpoint status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Friends endpoint data:', data);
      } else {
        const error = await response.text();
        console.log('Friends endpoint error:', error);
      }
    } catch (err) {
      console.error('Friends endpoint failed:', err);
    }

    console.log('=== End API Test ===');
  };

  // Handle notification actions
  const handleAction = async (notification: Notification) => {
    switch (notification.type) {
      case 'achievement':
        // Navigate to achievements page or show achievement details
        navigate('/achievements');
        break;

      case 'friend_request':
        // Navigate to friends panel or handle friend request
        navigate('/dashboard', { state: { activePanel: 'friends' } });
        break;

      case 'message':
        // Navigate to the messages page with the friend selected
        if (notification.data?.friend) {
          // Close the notifications panel first
          onClose();

          // Navigate to the messages page with friend data
          navigate('/messages', {
            state: {
              selectedFriend: notification.data.friend,
              openConversation: true
            }
          });
        }
        break;

      case 'system':
        // Handle system notifications
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

  // Initialize component
  useEffect(() => {
    const initializeNotifications = async () => {
      if (!isOpen) return;

      const token = await getValidToken();
      if (!token) {
        setError('Please log in to view notifications');
        return;
      }

      const userId = getUserIdFromToken(token);
      if (!userId) {
        setError('Unable to identify user');
        return;
      }

      setCurrentUserId(userId);
    };

    initializeNotifications();
  }, [isOpen]);

  // Load notifications when user ID is available
  useEffect(() => {
    if (currentUserId && isOpen) {
      loadNotifications();
    }
  }, [currentUserId, isOpen]);

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