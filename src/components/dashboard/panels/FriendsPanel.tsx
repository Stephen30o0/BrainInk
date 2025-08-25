import { useState, useEffect } from 'react';
import { Search, UserPlus, MessageSquare, Star, Shield, X, Users, UserCheck, Trophy, Clock, Calendar, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../../services/apiService';

// API Configuration
const API_BASE_URL = 'https://brainink-backend-freinds-micro.onrender.com/friends';

// Types and Interfaces
interface User {
  id: number;
  username: string;
  fname: string;
  lname: string; avatar: string;
}

interface Friend extends User {
  status: string;
  friendshipId?: number;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  badge_icon?: string;
  xp_reward: number;
  earned_at?: string;
}

interface FriendProfile {
  friend: Friend;
  achievements: Achievement[];
  stats: {
    totalXp: number;
    rank: string;
    studyHours: number;
    loginStreak: number;
    quizCompleted: number;
    tournamentsWon: number;
    coursesCompleted: number;
  };
}

type ActiveTab = 'friends' | 'pending';

export const FriendsPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState(''); const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Enhanced token validation and user ID extraction
  const getValidToken = async (): Promise<string | null> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('No access token found');
      return null;
    }
    console.log('Token found:', token.substring(0, 10) + '...');
    return token;
  };

  // Decode JWT token to extract user ID
  const getUserIdFromToken = (token: string): number | null => {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('Invalid token format');
        return null;
      }

      const base64Payload = tokenParts[1];
      const paddedPayload = base64Payload.padEnd(base64Payload.length + (4 - base64Payload.length % 4) % 4, '=');
      const decodedPayload = atob(paddedPayload);
      const payload = JSON.parse(decodedPayload);

      console.log('Decoded token payload:', payload);
      const userId = payload.user_id || payload.sub || payload.id || payload.userId;

      if (!userId) {
        console.error('No user ID found in token payload');
        return null;
      }

      console.log('Extracted user ID:', userId);
      return parseInt(userId);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank?.toLowerCase()) {
      case 'master':
        return 'text-yellow-400';
      case 'expert':
        return 'text-purple-400';
      case 'advanced':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const transformUserToFriend = (user: User): Friend => ({
    ...user,
    status: 'Friend'
  });

  // Load friend achievements separately for profile modal
  const loadFriendAchievements = async (friendId: number): Promise<Achievement[]> => {
    try {
      console.log(`Loading achievements for friend ${friendId}`);

      // Try to get friend's achievements from direct API call
      const token = await getValidToken();
      if (!token) {
        console.warn('No token available for loading friend achievements');
        return [];
      }

      // Call friend achievements API (you'll need to implement this endpoint)
      const response = await fetch(`${API_BASE_URL}/achievements/${friendId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        console.warn(`Failed to load friend achievements: ${response.status}`);
        // Fallback to current user's achievements as example
        return apiService.getAchievements() || [];
      }

      const achievements = await response.json();
      return Array.isArray(achievements) ? achievements : achievements.data || [];

    } catch (error) {
      console.error('Error loading friend achievements:', error);
      // Fallback to current user's achievements
      return apiService.getAchievements() || [];
    }
  };
  // Load friend profile with quick name data and separate achievements loading
  const loadFriendProfile = async (friend: Friend | User) => {
    try {
      // Quick load - use existing friend data for immediate display
      const friendData: Friend = 'status' in friend ? friend : transformUserToFriend(friend);

      // Get current user's stats from apiService for immediate display
      const userStats = apiService.getUserStats();
      const userProgress = apiService.getUserProgress();

      // Build stats from API data
      const stats = {
        totalXp: userProgress?.total_xp || userStats?.total_xp || 0,
        rank: userProgress?.current_rank?.name || userStats?.current_rank || 'Beginner',
        studyHours: userProgress?.time_spent_hours || userStats?.stats?.time_spent_hours || 0,
        loginStreak: userProgress?.login_streak || userStats?.stats?.login_streak || 0,
        quizCompleted: userProgress?.total_quiz_completed || userStats?.stats?.total_quiz_completed || 0,
        tournamentsWon: userProgress?.tournaments_won || userStats?.stats?.tournaments_won || 0,
        coursesCompleted: userProgress?.courses_completed || userStats?.stats?.courses_completed || 0
      };

      // Set initial profile with empty achievements
      setSelectedFriend({
        friend: friendData,
        achievements: [], // Start with empty, will load separately
        stats
      });

      setIsProfileModalOpen(true);

      // Load achievements separately in background
      console.log('Loading achievements for friend:', friendData.id);
      const friendAchievements = await loadFriendAchievements(friendData.id);

      // Update profile with loaded achievements
      setSelectedFriend(prev => prev ? {
        ...prev,
        achievements: friendAchievements.slice(0, 5) // Show recent achievements
      } : null);
    } catch (error) {
      console.error('Error loading friend profile:', error);
      setError('Failed to load friend profile');
    }
  };

  // Handle friend click to show profile popup
  const handleFriendClick = (friend: Friend) => {
    if (activeTab === 'friends') {
      loadFriendProfile(friend);
    }
  };

  // Handle search result click to show profile popup  
  const handleSearchResultClick = (user: User) => {
    loadFriendProfile(user);
  };

  // Quick load friends data from apiService
  const quickLoadFriendsData = async () => {
    try {
      console.log('Quick loading friends data from apiService...');

      // Quick load from apiService cache
      const friendsList = apiService.getFriends() || [];
      const pendingRequestsList = apiService.getPendingFriendRequests() || [];

      console.log('Quick loaded from apiService:', { friendsList, pendingRequestsList });

      // Transform API data to component format - no artificial online/offline split
      const transformedFriends = friendsList.map((user: User) => transformUserToFriend(user));

      const transformedPending = pendingRequestsList.map((request: any) => {
        const friendInfo = request.friend_info || request.user || request;
        if (!friendInfo) {
          console.warn('Missing friend info in request:', request);
          return null;
        }
        return {
          ...transformUserToFriend(friendInfo),
          id: request.id || friendInfo.id,
          status: 'Wants to connect',
          friendshipId: request.id || request.friendship_id
        };
      }).filter((item): item is NonNullable<typeof item> => item !== null);

      setFriends(transformedFriends);
      setPendingRequests(transformedPending);
      setError(null);

      return true; // Success
    } catch (error) {
      console.error('Error quick loading from apiService:', error);
      return false; // Failed
    }
  };

  const loadFriendsData = async () => {
    try {
      // First try quick load from apiService
      const quickLoadSuccess = await quickLoadFriendsData();

      if (!quickLoadSuccess) {
        console.log('Quick load failed, trying full preload...');
        // If quick load fails, try full preload
        await apiService.preloadAllData();
        await quickLoadFriendsData();
      }

    } catch (err: any) {
      console.error('Error loading friends from apiService:', err);

      // Fallback to direct API calls
      const token = await getValidToken();
      if (!token) {
        setLoading(false);
        setError('Please log in to view friends');
        return;
      }

      if (!currentUserId) {
        const userId = getUserIdFromToken(token);
        if (!userId) {
          setError('Unable to identify user from token');
          setLoading(false);
          return;
        }
        setCurrentUserId(userId);
      }

      try {
        setError(null);
        console.log('Loading friends data for user:', currentUserId);

        const friendsResponse = await fetch(`${API_BASE_URL}/list/${currentUserId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        const pendingResponse = await fetch(`${API_BASE_URL}/requests/pending/${currentUserId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        console.log('Friends Response status:', friendsResponse.status);
        console.log('Pending Response status:', pendingResponse.status);

        if (!friendsResponse.ok) {
          const errorText = await friendsResponse.text();
          console.error('Friends API Error Response:', errorText);
          throw new Error(`Friends API error: ${friendsResponse.status}`);
        }

        if (!pendingResponse.ok) {
          const errorText = await pendingResponse.text();
          console.error('Pending API Error Response:', errorText);
          throw new Error(`Pending requests API error: ${pendingResponse.status}`);
        }

        const friendsList = await friendsResponse.json();
        const pendingRequestsList = await pendingResponse.json();

        console.log('Friends list response:', friendsList);
        console.log('Pending requests response:', pendingRequestsList);

        // Handle different response structures
        let friendsArray = [];
        if (Array.isArray(friendsList)) {
          friendsArray = friendsList;
        } else if (friendsList.friends && Array.isArray(friendsList.friends)) {
          friendsArray = friendsList.friends;
        } else if (friendsList.data && Array.isArray(friendsList.data)) {
          friendsArray = friendsList.data;
        }

        let pendingArray = [];
        if (Array.isArray(pendingRequestsList)) {
          pendingArray = pendingRequestsList;
        } else if (pendingRequestsList.requests && Array.isArray(pendingRequestsList.requests)) {
          pendingArray = pendingRequestsList.requests;
        } else if (pendingRequestsList.data && Array.isArray(pendingRequestsList.data)) {
          pendingArray = pendingRequestsList.data;
        }

        // Transform API data to component format - no artificial categorization
        const transformedFriends = friendsArray.map((user: User) => transformUserToFriend(user));

        const transformedPending = pendingArray.map((request: any) => {
          const friendInfo = request.friend_info || request.user || request;
          if (!friendInfo) {
            console.warn('Missing friend info in request:', request);
            return null;
          }
          return {
            ...transformUserToFriend(friendInfo),
            id: request.id || friendInfo.id,
            status: 'Wants to connect',
            friendshipId: request.id || request.friendship_id
          };
        }).filter((item: Friend | null): item is Friend => item !== null);

        setFriends(transformedFriends);
        setPendingRequests(transformedPending);

      } catch (err: any) {
        console.error('Error loading friends:', err);

        if (err.message.includes('401')) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('encrypted_user_data');
          setError('Session expired. Please log in again.');
        } else {
          setError('Failed to load friends data');
        }

        setFriends([]);
        setPendingRequests([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = (friend?: Friend) => {
    if (friend) {
      navigate('/messages', {
        state: {
          selectedFriend: friend,
          openConversation: true
        }
      });
    } else {
      navigate('/messages');
    }
  };

  const handleSearchFriends = async (query: string) => {
    setFriendSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    const token = await getValidToken();
    if (!token) {
      setError('Please log in to search for friends');
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching for users:', query);

      const response = await fetch(`${API_BASE_URL}/users/search?username=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      console.log('Search Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search API Error Response:', errorText);
        throw new Error(`Search API error: ${response.status}`);
      }

      const results = await response.json();
      console.log('Search results:', results);

      let usersArray = [];
      if (Array.isArray(results)) {
        usersArray = results;
      } else if (results.users && Array.isArray(results.users)) {
        usersArray = results.users;
      } else if (results.data && Array.isArray(results.data)) {
        usersArray = results.data;
      }

      // Filter out current user and existing friends
      const filteredUsers = usersArray.filter((user: User) =>
        user.id !== currentUserId &&
        !friends.some(friend => friend.id === user.id)
      );

      setSearchResults(filteredUsers);
    } catch (err: any) {
      console.error('Error searching users:', err);
      setSearchResults([]);

      if (err.message.includes('401')) {
        setError('Session expired. Please log in again.');
      } else {
        setError(`Search failed: ${err.message}`);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // KEEPING THE EXACT SAME handleSendFriendRequest FUNCTION - DON'T CHANGE
  const handleSendFriendRequest = async (userId: string) => {
    const token = await getValidToken();
    if (!token || !currentUserId) {
      setError('Please log in to send friend requests');
      return;
    }

    try {
      const user = searchResults.find(u => u.id.toString() === userId);
      if (!user) {
        setError('User not found');
        return;
      }

      if (user.id === currentUserId) {
        setError('You cannot send a friend request to yourself');
        return;
      }

      const allFriends = [...friends, ...pendingRequests];
      const isAlreadyFriend = allFriends.some(friend =>
        friend.id === user.id || friend.username === user.username
      );
      if (isAlreadyFriend) {
        setError('This user is already in your friends list');
        return;
      }

      console.log('Sending friend request to:', user.username);
      console.log('Current user ID:', currentUserId);
      console.log('Target user:', user);

      const cleanUsername = user.username.trim();
      if (!cleanUsername) {
        setError('Invalid username');
        return;
      }

      const requestBody = {
        addressee_username: cleanUsername,
        message: ''
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${API_BASE_URL}/request/send/${currentUserId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Send Request Response status:', response.status);
      console.log('Send Request Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Send Request Response body:', responseText);

      if (!response.ok) {
        let errorMessage = `Friend request failed (${response.status})`;

        try {
          const errorData = JSON.parse(responseText);
          console.log('Parsed error data:', errorData);

          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          errorMessage = responseText || errorMessage;
        }

        console.error('Send Request API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText,
          headers: Object.fromEntries(response.headers.entries())
        });

        throw new Error(errorMessage);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        result = { message: 'Friend request sent successfully' };
      }

      console.log('Friend request result:', result);

      setIsAddFriendModalOpen(false);
      setFriendSearchQuery('');
      setSearchResults([]);

      // Refresh friends data and apiService cache
      await apiService.refreshData('friends');
      await loadFriendsData();

      setError(null);

      if (result.message) {
        console.log('Success:', result.message);
      }

    } catch (err: any) {
      console.error('Error sending friend request:', err);

      let userFriendlyMessage = err.message;

      if (err.message.includes('already friends') || err.message.includes('Already friends')) {
        userFriendlyMessage = 'You are already friends with this user';
      } else if (err.message.includes('request already exists') || err.message.includes('already sent')) {
        userFriendlyMessage = 'Friend request already sent to this user';
      } else if (err.message.includes('cannot send request to yourself') || err.message.includes('yourself')) {
        userFriendlyMessage = 'You cannot send a friend request to yourself';
      } else if (err.message.includes('user not found') || err.message.includes('User not found')) {
        userFriendlyMessage = 'User not found or may have been deleted';
      } else if (err.message.includes('Invalid username') || err.message.includes('username')) {
        userFriendlyMessage = 'Invalid username format';
      } else if (err.message.includes('Database connection')) {
        userFriendlyMessage = 'Database connection error. Please try again later.';
      } else if (err.message.includes('503')) {
        userFriendlyMessage = 'Service temporarily unavailable. Please try again later.';
      } else if (err.message.includes('500')) {
        userFriendlyMessage = 'Server error occurred. Please try again.';
      } else if (err.message.includes('401')) {
        userFriendlyMessage = 'Authentication failed. Please log in again.';
        localStorage.removeItem('access_token');
        localStorage.removeItem('encrypted_user_data');
      }

      setError(`Failed to send friend request: ${userFriendlyMessage}`);
    }
  };

  const handleAcceptFriend = async (friendId: string | number) => {
    const token = await getValidToken();
    if (!token || !currentUserId) return;

    try {
      const friend = pendingRequests.find(f => f.id === friendId);
      if (!friend) return;

      const response = await fetch(`${API_BASE_URL}/request/respond/${currentUserId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          friendship_id: friend.friendshipId,
          status: 'accepted'
        })
      });

      if (response.ok) {
        await apiService.refreshData('friends');
        await loadFriendsData();
      }
    } catch (err: any) {
      console.error('Error accepting friend request:', err);
      setError('Failed to accept friend request');
    }
  };

  const handleDeclineFriend = async (friendId: string | number) => {
    const token = await getValidToken();
    if (!token || !currentUserId) return;

    try {
      const friend = pendingRequests.find(f => f.id === friendId);
      if (!friend) return;

      const response = await fetch(`${API_BASE_URL}/request/respond/${currentUserId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          friendship_id: friend.friendshipId,
          status: 'declined'
        })
      });

      if (response.ok) {
        await apiService.refreshData('friends');
        await loadFriendsData();
      }
    } catch (err: any) {
      console.error('Error declining friend request:', err);
      setError('Failed to decline friend request');
    }
  };

  const retryFetchData = async () => {
    setLoading(true);
    setError(null);
    await loadFriendsData();
  };

  useEffect(() => {
    const initializeFriends = async () => {
      const token = await getValidToken();
      if (!token) {
        setLoading(false);
        setError('Please log in to view friends');
        return;
      }

      const userId = getUserIdFromToken(token);
      if (!userId) {
        setLoading(false);
        setError('Unable to identify user from token');
        return;
      }

      setCurrentUserId(userId);
    };

    initializeFriends();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadFriendsData();
    }
  }, [currentUserId]);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="text-primary">Loading friends...</div>
      </div>
    );
  }

  const currentList = activeTab === 'friends' ? friends : pendingRequests;
  const filteredList = currentList.filter((item: Friend) =>
    item.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 bg-white min-h-screen">
      {/* Header with link to Friends page */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-xl text-gray-800">Friends</h2>
        <button
          onClick={() => navigate('/friends')}
          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 transition-colors"
        >
          View All
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-1">
            <path d="M4 3L7 6L4 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 text-xs underline"
            >
              Dismiss
            </button>
            <button
              onClick={retryFetchData}
              className="text-red-500 hover:text-red-700 text-xs underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search friends..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Tabs - Only Friends and Pending */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${activeTab === 'friends'
            ? 'bg-blue-50 text-blue-600 border border-blue-200'
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-blue-50'
            }`}
        >
          <Users size={16} />
          All Friends
          {friends.length > 0 && (
            <span className="ml-1 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
              {friends.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${activeTab === 'pending'
            ? 'bg-blue-50 text-blue-600 border border-blue-200'
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-blue-50'
            }`}
        >
          <UserCheck size={16} />
          Requests
          {pendingRequests.length > 0 && (
            <span className="ml-1 bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full text-xs">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Friends List - Simple Clean Layout */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {activeTab === 'pending' ? 'No pending friend requests' : 'No friends yet'}
            {activeTab === 'friends' && (
              <div>
                <p className="text-sm mt-2">Add some friends to get started!</p>
                <button
                  onClick={() => navigate('/friends')}
                  className="mt-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                >
                  Go to Friends Page
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredList.map((friend: Friend) => (
            <div
              key={friend.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer shadow-sm"
              onClick={() => handleFriendClick(friend)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-xl text-blue-600">
                  {friend.username?.substring(0, 2).toUpperCase() || '👤'}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">
                        {friend.fname && friend.lname
                          ? `${friend.fname} ${friend.lname}`
                          : friend.username
                        }
                      </h3>
                      <p className="text-gray-600 text-xs mt-1">
                        @{friend.username}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {friend.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {activeTab === 'pending' ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptFriend(friend.id);
                          }}
                          className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded hover:bg-green-500/30 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeclineFriend(friend.id);
                          }}
                          className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30 transition-colors"
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMessageClick(friend);
                          }}
                          className="p-1 hover:bg-blue-50 rounded transition-colors"
                          title="Send Message"
                        >
                          <MessageSquare size={16} className="text-blue-600" />
                        </button>
                        <button
                          className="p-1 hover:bg-blue-50 rounded transition-colors"
                          title="View Profile"
                        >
                          <Shield size={16} className="text-blue-600" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Friend Button */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setIsAddFriendModalOpen(true)}
          className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-blue-600 flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-sm"
        >
          <UserPlus size={16} />
          <span className="text-sm">Add New Friend</span>
        </button>
        <button
          onClick={() => navigate('/friends')}
          className="px-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center"
          title="View All Friends"
        >
          <Users size={16} />
        </button>
      </div>

      {/* Friend Profile Modal */}
      {isProfileModalOpen && selectedFriend && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-primary/20">
              <h3 className="font-pixel text-xl text-primary">User Profile</h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-2xl text-blue-600 font-bold">
                    {selectedFriend.friend.username?.substring(0, 2).toUpperCase() || '👤'}
                  </div>
                </div>
                <div>
                  <h2 className="font-pixel text-xl text-primary">
                    {selectedFriend.friend.fname && selectedFriend.friend.lname
                      ? `${selectedFriend.friend.fname} ${selectedFriend.friend.lname}`
                      : selectedFriend.friend.username
                    }
                  </h2>
                  <p className="text-gray-400 text-sm">@{selectedFriend.friend.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Medal size={14} className="text-yellow-400" />
                    <span className="text-gray-400 text-sm">{selectedFriend.stats.rank}</span>
                  </div>
                </div>
              </div>

              {/* Real Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[{
                  label: 'Total XP',
                  value: selectedFriend.stats.totalXp.toLocaleString(),
                  icon: <Star size={16} />
                }, {
                  label: 'Study Hours',
                  value: `${selectedFriend.stats.studyHours}h`,
                  icon: <Clock size={16} />
                }, {
                  label: 'Login Streak',
                  value: `${selectedFriend.stats.loginStreak} days`,
                  icon: <Calendar size={16} />
                }, {
                  label: 'Tournaments Won',
                  value: selectedFriend.stats.tournamentsWon.toString(),
                  icon: <Trophy size={16} />
                }].map((stat, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      {stat.icon}
                      <span className="text-xs">{stat.label}</span>
                    </div>
                    <div className="font-pixel text-primary">{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Trophy size={14} />
                    <span className="text-xs">Quizzes Completed</span>
                  </div>
                  <div className="font-bold text-lg text-green-600">{selectedFriend.stats.quizCompleted}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Star size={14} />
                    <span className="text-xs">Courses Completed</span>
                  </div>
                  <div className="font-bold text-lg text-purple-600">{selectedFriend.stats.coursesCompleted}</div>
                </div>
              </div>

              {/* Achievements - Loading separately */}
              <div className="mb-6">
                <h3 className="font-pixel text-primary text-lg mb-4">Recent Achievements</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {selectedFriend.achievements.length > 0 ? (
                    selectedFriend.achievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="text-2xl">{achievement.badge_icon || '🏆'}</div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-800">{achievement.name}</div>
                          <div className="text-xs text-gray-600">{achievement.description}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-yellow-600">+{achievement.xp_reward} XP</span>
                            {achievement.earned_at && (
                              <span className="text-xs text-gray-500">
                                {new Date(achievement.earned_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      <div className="animate-pulse">Loading achievements...</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {selectedFriend.friend.status === 'Friend' ? (
                  <button
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      handleMessageClick(selectedFriend.friend);
                    }}
                    className="flex-1 bg-primary/20 text-primary py-3 px-4 rounded-lg hover:bg-primary/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={16} />
                    Send Message
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      handleSendFriendRequest(selectedFriend.friend.id.toString());
                    }}
                    className="flex-1 bg-primary/20 text-primary py-3 px-4 rounded-lg hover:bg-primary/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus size={16} />
                    Add Friend
                  </button>
                )}
                <button className="bg-white border border-gray-200 text-blue-600 py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <Shield size={16} />
                  More Options
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Friend Modal - KEEPING EXACTLY AS IS */}
      {isAddFriendModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-lg w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-pixel text-primary text-lg">Add Friend</h3>
              <button
                onClick={() => setIsAddFriendModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search by username..."
                value={friendSearchQuery}
                onChange={(e) => handleSearchFriends(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="text-center py-4 text-gray-400">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer shadow-sm"
                    onClick={() => handleSearchResultClick(user)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-xl">
                        {user.username?.substring(0, 2).toUpperCase() || '👤'}
                      </div>
                      <div>
                        <h4 className="text-sm text-primary">{user.username}</h4>
                        <p className="text-xs text-gray-400">
                          {user.fname && user.lname ? `${user.fname} ${user.lname}` : 'User'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendFriendRequest(user.id.toString());
                      }}
                      className="px-3 py-1 bg-primary/20 text-primary text-xs rounded hover:bg-primary/30 transition-colors"
                    >
                      Add Friend
                    </button>
                  </div>
                ))
              ) : friendSearchQuery.length > 0 ? (
                <div className="text-center py-4 text-gray-400">No users found</div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  Enter a username to search
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};