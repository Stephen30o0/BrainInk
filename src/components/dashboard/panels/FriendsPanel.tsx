import React, { useState, useEffect } from 'react';
import { Search, UserPlus, MessageSquare, Crown, Star, Shield, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// API Configuration
const API_BASE_URL = 'https://brainink-backend-freinds-micro.onrender.com/friends';

// Types and Interfaces
interface User {
  id: number;
  username: string;
  fname: string;
  lname: string;
  avatar: string;
}

interface FriendRequest {
  id: number;
  requester_id: number;
  addressee_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  message?: string;
  friend_info?: User;
}

interface Friend extends User {
  status: string;
  level: number;
  rank: string;
  lastActive: string;
  isOnline?: boolean;
  friendshipId?: number;
}

type FriendStatus = 'online' | 'offline' | 'pending';

interface FriendsList {
  online: Friend[];
  offline: Friend[];
  pending: Friend[];
}

export const FriendsPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FriendStatus>('online');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [friends, setFriends] = useState<FriendsList>({
    online: [],
    offline: [],
    pending: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Enhanced token validation and user ID extraction like ProfilePanel
  const getValidToken = async (): Promise<string | null> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('No access token found');
      return null;
    }
    console.log('Token found:', token.substring(0, 10) + '...');
    return token;
  };

  // Decode JWT token to extract user ID - similar to ProfilePanel
  const getUserIdFromToken = (token: string): number | null => {
    try {
      // JWT tokens have 3 parts separated by dots
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('Invalid token format');
        return null;
      }

      // Decode the payload (second part)
      const base64Payload = tokenParts[1];
      // Add padding if necessary
      const paddedPayload = base64Payload.padEnd(base64Payload.length + (4 - base64Payload.length % 4) % 4, '=');
      const decodedPayload = atob(paddedPayload);
      const payload = JSON.parse(decodedPayload);

      console.log('Decoded token payload:', payload);

      // Extract user ID (could be under different property names)
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
    switch (rank) {
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

  const transformUserToFriend = (user: User, isOnline: boolean = false): Friend => ({
    ...user,
    status: isOnline ? 'Online' : 'Offline',
    level: Math.floor(Math.random() * 20) + 1,
    rank: ['beginner', 'advanced', 'expert', 'master'][Math.floor(Math.random() * 4)],
    lastActive: isOnline ? 'now' : '2h ago',
    isOnline
  });

  const loadFriendsData = async () => {
    const token = await getValidToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // Extract user ID from token
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

      // Use user ID in URLs like the backend expects
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
      const pendingRequests = await pendingResponse.json();

      console.log('Friends list response:', friendsList);
      console.log('Pending requests response:', pendingRequests);

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
      if (Array.isArray(pendingRequests)) {
        pendingArray = pendingRequests;
      } else if (pendingRequests.requests && Array.isArray(pendingRequests.requests)) {
        pendingArray = pendingRequests.requests;
      } else if (pendingRequests.data && Array.isArray(pendingRequests.data)) {
        pendingArray = pendingRequests.data;
      }

      // Transform API data to component format
      const onlineFriends = friendsArray.slice(0, Math.ceil(friendsArray.length / 2))
        .map((user: User) => transformUserToFriend(user, true));

      const offlineFriends = friendsArray.slice(Math.ceil(friendsArray.length / 2))
        .map((user: User) => transformUserToFriend(user, false));

      const pendingFriends = pendingArray.map((request: any) => {
        // Handle different structures for friend request data
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
      }).filter(Boolean);

      setFriends({
        online: onlineFriends,
        offline: offlineFriends,
        pending: pendingFriends
      });

    } catch (err: any) {
      console.error('Error loading friends:', err);

      if (err.message.includes('401')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('encrypted_user_data');
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to load friends data');
      }

      // Set empty data on error
      setFriends({
        online: [],
        offline: [],
        pending: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = () => {
    navigate('/messages');
  };

  const handleAddFriend = () => {
    setIsAddFriendModalOpen(true);
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

      // Handle different response structures
      let usersArray = [];
      if (Array.isArray(results)) {
        usersArray = results;
      } else if (results.users && Array.isArray(results.users)) {
        usersArray = results.users;
      } else if (results.data && Array.isArray(results.data)) {
        usersArray = results.data;
      }

      setSearchResults(usersArray);
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

      // Validate that user isn't trying to friend themselves
      if (user.id === currentUserId) {
        setError('You cannot send a friend request to yourself');
        return;
      }

      // Check if user is already in friends list
      const allFriends = [...friends.online, ...friends.offline, ...friends.pending];
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

      // Ensure username is properly formatted
      const cleanUsername = user.username.trim();
      if (!cleanUsername) {
        setError('Invalid username');
        return;
      }

      const requestBody = {
        addressee_username: cleanUsername,
        message: '' // Optional message - empty string is fine
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

      // Get the response text for debugging
      const responseText = await response.text();
      console.log('Send Request Response body:', responseText);

      if (!response.ok) {
        let errorMessage = `Friend request failed (${response.status})`;

        // Try to parse error response for more details
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
          // If response is not JSON, use the raw text
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

      // Success - close modal and refresh data
      setIsAddFriendModalOpen(false);
      setFriendSearchQuery('');
      setSearchResults([]);

      // Refresh friends data to show the pending request
      await loadFriendsData();

      setError(null);

      // Show success message if available
      if (result.message) {
        console.log('Success:', result.message);
      }

    } catch (err: any) {
      console.error('Error sending friend request:', err);

      // More specific error handling based on common API responses
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
        // Clear token on auth failure
        localStorage.removeItem('access_token');
        localStorage.removeItem('encrypted_user_data');
      }

      setError(`Failed to send friend request: ${userFriendlyMessage}`);
    }
  };

  const handleAcceptFriend = async (friendId: string | number) => {
    const token = await getValidToken();
    if (!token || !currentUserId) {
      setError('Please log in to accept friend requests');
      return;
    }

    try {
      const friend = friends.pending.find(f => f.id === friendId);
      if (!friend) {
        setError('Friend request not found');
        return;
      }

      console.log('Accepting friend request:', friend.friendshipId);

      const response = await fetch(`${API_BASE_URL}/request/respond/${currentUserId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          friendship_id: friend.friendshipId,
          status: 'accepted'
        })
      });

      console.log('Accept Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Accept API Error Response:', errorText);
        throw new Error(`Accept friend API error: ${response.status}`);
      }

      await loadFriendsData();

    } catch (err: any) {
      console.error('Error accepting friend request:', err);
      setError(`Failed to accept friend request: ${err.message}`);
    }
  };

  const handleDeclineFriend = async (friendId: string | number) => {
    const token = await getValidToken();
    if (!token || !currentUserId) {
      setError('Please log in to decline friend requests');
      return;
    }

    try {
      const friend = friends.pending.find(f => f.id === friendId);
      if (!friend) {
        setError('Friend request not found');
        return;
      }

      console.log('Declining friend request:', friend.friendshipId);

      const response = await fetch(`${API_BASE_URL}/request/respond/${currentUserId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          friendship_id: friend.friendshipId,
          status: 'declined'
        })
      });

      console.log('Decline Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Decline API Error Response:', errorText);
        throw new Error(`Decline friend API error: ${response.status}`);
      }

      await loadFriendsData();

    } catch (err: any) {
      console.error('Error declining friend request:', err);
      setError(`Failed to decline friend request: ${err.message}`);
    }
  };

  // Retry function for failed requests
  const retryFetchData = async () => {
    setLoading(true);
    setError(null);
    await loadFriendsData();
  };

  // Check for authentication on component mount
  useEffect(() => {
    const initializeFriends = async () => {
      const token = await getValidToken();
      if (!token) {
        setLoading(false);
        setError('Please log in to view friends');
        return;
      }

      // Extract user ID from token
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

  // Load friends data when currentUserId is available
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

  return (
    <div className="p-4">
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setError(null)}
              className="text-red-300 hover:text-red-100 text-xs underline"
            >
              Dismiss
            </button>
            <button
              onClick={retryFetchData}
              className="text-red-300 hover:text-red-100 text-xs underline"
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
          className="w-full bg-dark/50 border border-primary/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary"
        />
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['online', 'offline', 'pending'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as FriendStatus)}
            className={`px-3 py-1 rounded-lg text-sm capitalize ${activeTab === tab
              ? 'bg-primary/20 text-primary'
              : 'bg-dark/50 text-gray-400 hover:bg-primary/10'
              }`}
          >
            {tab}
            {tab === 'online' && friends.online.length > 0 && (
              <span className="ml-2 bg-green-500/20 text-green-400 px-1.5 rounded-full text-xs">
                {friends.online.length}
              </span>
            )}
            {tab === 'pending' && friends.pending.length > 0 && (
              <span className="ml-2 bg-yellow-500/20 text-yellow-400 px-1.5 rounded-full text-xs">
                {friends.pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Friends List */}
      <div className="space-y-4">
        {friends[activeTab].length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {activeTab === 'pending' ? 'No pending friend requests' : `No ${activeTab} friends`}
          </div>
        ) : (
          friends[activeTab]
            .filter((friend: Friend) => friend.username.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((friend: Friend) => (
              <div
                key={friend.id}
                className="bg-dark/30 border border-primary/20 rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-2xl">
                      {friend.avatar || friend.username?.substring(0, 2).toUpperCase() || '👤'}
                    </div>
                    {activeTab === 'online' && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-dark"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-pixel text-primary text-sm">
                          {friend.username}
                        </h3>
                        <p className="text-gray-400 text-xs mt-1">
                          {friend.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${getRankColor(friend.rank)}`}>
                          Lvl {friend.level}
                        </span>
                        {friend.rank === 'master' && (
                          <Crown size={14} className="text-yellow-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {activeTab === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleAcceptFriend(friend.id)}
                            className="px-3 py-1 bg-primary/20 text-primary text-xs rounded hover:bg-primary/30 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineFriend(friend.id)}
                            className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30 transition-colors"
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="p-1 hover:bg-primary/20 rounded transition-colors"
                            onClick={handleMessageClick}
                          >
                            <MessageSquare size={16} className="text-primary" />
                          </button>
                          <button className="p-1 hover:bg-primary/20 rounded transition-colors">
                            <Shield size={16} className="text-primary" />
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
      <button
        onClick={handleAddFriend}
        className="mt-6 w-full bg-dark/50 border border-primary/20 rounded-lg p-3 text-primary flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors"
      >
        <UserPlus size={16} />
        <span className="text-sm">Add New Friend</span>
      </button>

      {/* Add Friend Modal */}
      {isAddFriendModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark border border-primary/20 rounded-lg w-full max-w-md p-6">
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
                className="w-full bg-dark/50 border border-primary/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary"
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
                    className="flex items-center justify-between p-3 bg-dark/30 border border-primary/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-xl">
                        {user.avatar || user.username?.substring(0, 2).toUpperCase() || '👤'}
                      </div>
                      <div>
                        <h4 className="text-sm text-primary">{user.username}</h4>
                        <p className="text-xs text-gray-400">{user.fname} {user.lname}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendFriendRequest(user.id.toString())}
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
}