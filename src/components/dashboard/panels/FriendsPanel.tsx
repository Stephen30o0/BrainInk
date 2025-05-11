import React, { useState } from 'react';
import { Search, UserPlus, MessageSquare, Crown, Star, Shield, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: string;
  level: number;
  rank: string;
  lastActive: string;
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
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const friends: FriendsList = {
    online: [{
      id: '1',
      name: 'PhysicsProf',
      avatar: '👨‍🏫',
      status: 'In Arena Battle',
      level: 15,
      rank: 'master',
      lastActive: 'now'
    }, {
      id: '2',
      name: 'MathWizard',
      avatar: '🧙‍♂️',
      status: 'Studying Calculus',
      level: 12,
      rank: 'expert',
      lastActive: 'now'
    }],
    offline: [{
      id: '3',
      name: 'ChemQueen',
      avatar: '👩‍🔬',
      status: 'Last seen 2h ago',
      level: 8,
      rank: 'advanced',
      lastActive: '2h ago'
    }],
    pending: [{
      id: '4',
      name: 'BioStudent',
      avatar: '🧬',
      status: 'Wants to connect',
      level: 5,
      rank: 'beginner',
      lastActive: '1h ago'
    }]
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

    setIsSearching(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock search results
    setSearchResults([
      {
        id: '5',
        name: 'CodeNinja',
        avatar: '👨‍💻',
        status: 'Available',
        level: 10,
        rank: 'expert',
        lastActive: 'now'
      },
      {
        id: '6',
        name: 'DataScientist',
        avatar: '👩‍🔬',
        status: 'Available',
        level: 8,
        rank: 'advanced',
        lastActive: 'now'
      }
    ]);
    setIsSearching(false);
  };

  const handleSendFriendRequest = (userId: string) => {
    // Add to pending requests
    const newFriend = searchResults.find(f => f.id === userId);
    if (newFriend) {
      friends.pending.push({
        ...newFriend,
        status: 'Wants to connect',
        lastActive: 'now'
      });
    }
    setIsAddFriendModalOpen(false);
    setFriendSearchQuery('');
    setSearchResults([]);
  };

  const handleAcceptFriend = (userId: string) => {
    const friend = friends.pending.find(f => f.id === userId);
    if (friend) {
      friends.online.push({
        ...friend,
        status: 'Online',
        lastActive: 'now'
      });
      friends.pending = friends.pending.filter(f => f.id !== userId);
    }
  };

  const handleDeclineFriend = (userId: string) => {
    friends.pending = friends.pending.filter(f => f.id !== userId);
  };

  return (
    <div className="p-4">
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
            className={`px-3 py-1 rounded-lg text-sm capitalize ${
              activeTab === tab
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
        {friends[activeTab]
          .filter((friend: Friend) => friend.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((friend: Friend) => (
            <div
              key={friend.id}
              className="bg-dark/30 border border-primary/20 rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-2xl">
                    {friend.avatar}
                  </div>
                  {activeTab === 'online' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-dark"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-pixel text-primary text-sm">
                        {friend.name}
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
          ))}
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
                        {user.avatar}
                      </div>
                      <div>
                        <h4 className="text-sm text-primary">{user.name}</h4>
                        <p className="text-xs text-gray-400">Level {user.level}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendFriendRequest(user.id)}
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