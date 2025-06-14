import * as React from 'react';
import { useState, useEffect } from 'react';
import { X, Users, Smile, Plus, Sparkles, Search, Crown, UserPlus, Shuffle } from 'lucide-react';
import { apiService } from '../../src/services/apiService';
import { squadService, Squad } from '../services/squadService'; // Import Squad type from squadService

interface User {
  id: number;
  username: string;
  fname: string;
  lname: string;
  avatar: string;
  email?: string;
  total_xp?: number;
  current_rank?: string;
}

interface TribeSuggestion {
  id: string;
  name: string;
  emoji: string;
  similarityScore: number;
  memberCount: number;
  averageXP: number;
  description: string;
}

// Remove the local Squad interface - use the one from squadService

const EMOJI_OPTIONS = [
  '🦄', '🔥', '⚡', '🌟', '🎯', '🚀', '💎', '🏆', '👑', '🎨',
  '🧠', '📚', '🔬', '⚔️', '🎮', '🎵', '🌈', '🦋', '🌸', '🎭',
  '🏅', '⭐', '💫', '🎪', '🎊', '🎉', '🎈', '🌊', '🔥', '🌙'
];

const SQUAD_NAME_SUGGESTIONS = [
  'Study Warriors', 'Brain Squad', 'Knowledge Seekers', 'Quiz Masters',
  'Academic Avengers', 'Learning Legends', 'Wisdom Wolves', 'Study Stars',
  'Intellectual Icons', 'Smart Spartans', 'Genius Guild', 'Brainy Bunch'
];

export const SquadFormationModal = ({
  onClose,
  onSquadCreated
}: {
  onClose: () => void;
  onSquadCreated: (squad: Squad) => void; // Use Squad type from squadService
}) => {
  const [step, setStep] = useState<'basic' | 'invite' | 'suggestions' | 'confirm'>('basic');
  const [squadName, setSquadName] = useState('');
  const [squadEmoji, setSquadEmoji] = useState('🦄');
  const [squadDescription, setSquadDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<User[]>([]);
  const [invitedFriends, setInvitedFriends] = useState<User[]>([]);
  const [tribeSuggestions, setTribeSuggestions] = useState<TribeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [subjectFocus, setSubjectFocus] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    loadFriends();
    loadTribeSuggestions();
  }, []);

  const loadFriends = async () => {
    try {
      const friendsList = apiService.getFriends();
      // Add mock XP data for demonstration
      const enrichedFriends = friendsList.map(friend => ({
        ...friend,
        total_xp: Math.floor(Math.random() * 5000) + 1000,
        current_rank: ['Bronze', 'Silver', 'Gold', 'Platinum'][Math.floor(Math.random() * 4)]
      }));
      setFriends(enrichedFriends);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadTribeSuggestions = async () => {
    try {
      // Mock tribe suggestions - replace with actual API call
      const mockSuggestions: TribeSuggestion[] = [
        {
          id: '1',
          name: 'Math Mavericks',
          emoji: '🔢',
          similarityScore: 95,
          memberCount: 12,
          averageXP: 3500,
          description: 'Masters of mathematics and problem-solving'
        },
        {
          id: '2',
          name: 'Science Squad',
          emoji: '🔬',
          similarityScore: 88,
          memberCount: 8,
          averageXP: 4200,
          description: 'Exploring the wonders of science together'
        },
        {
          id: '3',
          name: 'Literature Lions',
          emoji: '📖',
          similarityScore: 82,
          memberCount: 15,
          averageXP: 2800,
          description: 'Passionate readers and writers'
        }
      ];
      setTribeSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error loading tribe suggestions:', error);
    }
  };

  const generateSquadName = () => {
    setAutoGenerating(true);
    setTimeout(() => {
      const randomName = SQUAD_NAME_SUGGESTIONS[Math.floor(Math.random() * SQUAD_NAME_SUGGESTIONS.length)];
      setSquadName(randomName);
      setAutoGenerating(false);
    }, 1000);
  };

  const generateRandomEmoji = () => {
    const randomEmoji = EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)];
    setSquadEmoji(randomEmoji);
  };

  const handleInviteFriend = (friend: User) => {
    if (!invitedFriends.find(f => f.id === friend.id)) {
      setInvitedFriends(prev => [...prev, friend]);
    }
  };

  const handleRemoveInvite = (friendId: number) => {
    setInvitedFriends(prev => prev.filter(f => f.id !== friendId));
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

  const handleCreateSquad = async () => {
    if (!squadName.trim()) return;

    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      console.error('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      // Use backend squadService to create the squad with proper parameters
      const createSquadData = {
        name: squadName.trim(),
        emoji: squadEmoji,
        description: squadDescription.trim() || undefined,
        creator_id: currentUserId,
        invitedFriends: invitedFriends.map(f => f.id),
        subject_focus: subjectFocus.length > 0 ? subjectFocus : undefined,
        is_public: isPublic
      };

      const success = await squadService.createSquad(createSquadData);
      if (success) {
        // Reload user squads to get the newly created squad
        const userSquads = await squadService.getUserSquads();
        const newSquad = userSquads.find(squad => squad.name === squadName.trim());

        if (newSquad) {
          onSquadCreated(newSquad);
        }
        onClose();
      }
    } catch (error) {
      console.error('Error creating squad:', error);
      // Optionally show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.fname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.lname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addSubjectFocus = (subject: string) => {
    if (subject && !subjectFocus.includes(subject)) {
      setSubjectFocus(prev => [...prev, subject]);
    }
  };

  const removeSubjectFocus = (subject: string) => {
    setSubjectFocus(prev => prev.filter(s => s !== subject));
  };

  const renderBasicStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-pixel text-primary text-xl mb-2">Create Your Squad</h2>
        <p className="text-gray-400 text-sm">Set up your study group and invite friends to join</p>
      </div>

      {/* Squad Name */}
      <div>
        <label className="block text-white font-medium mb-2">Squad Name</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter squad name..."
            value={squadName}
            onChange={e => setSquadName(e.target.value)}
            className="flex-1 bg-dark/50 border border-primary/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary"
            maxLength={100}
          />
          <button
            onClick={generateSquadName}
            disabled={autoGenerating}
            className="px-4 py-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors disabled:opacity-50"
          >
            {autoGenerating ? (
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Shuffle size={16} />
            )}
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          {squadName.length}/100 characters
        </div>
      </div>

      {/* Squad Emoji */}
      <div>
        <label className="block text-white font-medium mb-2">Squad Avatar</label>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-16 h-16 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-2xl hover:bg-primary/30 transition-colors"
          >
            {squadEmoji}
          </button>
          <button
            onClick={generateRandomEmoji}
            className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors"
          >
            <Shuffle size={16} className="inline mr-2" />
            Random
          </button>
        </div>

        {showEmojiPicker && (
          <div className="mt-3 p-3 bg-dark/80 border border-primary/20 rounded-lg">
            <div className="grid grid-cols-10 gap-2 max-h-32 overflow-y-auto">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    setSquadEmoji(emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="w-8 h-8 rounded hover:bg-primary/20 transition-colors flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Squad Description */}
      <div>
        <label className="block text-white font-medium mb-2">Description (Optional)</label>
        <textarea
          placeholder="What's your squad about? Study goals, subjects, etc..."
          value={squadDescription}
          onChange={e => setSquadDescription(e.target.value)}
          className="w-full bg-dark/50 border border-primary/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
          rows={3}
          maxLength={500}
        />
        <div className="mt-1 text-xs text-gray-400">
          {squadDescription.length}/500 characters
        </div>
      </div>

      {/* Subject Focus */}
      <div>
        <label className="block text-white font-medium mb-2">Subject Focus (Optional)</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Add a subject..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addSubjectFocus(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
            className="flex-1 bg-dark/50 border border-primary/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary"
          />
        </div>
        {subjectFocus.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {subjectFocus.map((subject, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2"
              >
                {subject}
                <button
                  onClick={() => removeSubjectFocus(subject)}
                  className="text-primary/60 hover:text-primary"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Privacy Setting */}
      <div>
        <label className="block text-white font-medium mb-2">Squad Privacy</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="privacy"
              checked={isPublic}
              onChange={() => setIsPublic(true)}
              className="text-primary"
            />
            <span className="text-white">Public - Anyone can join</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="privacy"
              checked={!isPublic}
              onChange={() => setIsPublic(false)}
              className="text-primary"
            />
            <span className="text-white">Private - Invite only</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep('invite')}
          disabled={!squadName.trim()}
          className="flex-1 py-3 bg-primary text-dark font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Invite Friends
        </button>
      </div>
    </div>
  );

  const renderInviteStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-pixel text-primary text-xl mb-2">Invite Friends</h2>
        <p className="text-gray-400 text-sm">Choose friends to join your squad</p>
      </div>

      {/* Search Friends */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search friends..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-dark/50 border border-primary/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
        />
      </div>

      {/* Invited Friends */}
      {invitedFriends.length > 0 && (
        <div>
          <h3 className="text-white font-medium mb-3">Invited ({invitedFriends.length})</h3>
          <div className="flex flex-wrap gap-2">
            {invitedFriends.map(friend => (
              <div key={friend.id} className="flex items-center gap-2 px-3 py-2 bg-primary/20 border border-primary/40 rounded-full">
                <span className="text-sm text-white">{friend.fname}</span>
                <button
                  onClick={() => handleRemoveInvite(friend.id)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h3 className="text-white font-medium mb-3">Your Friends</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredFriends.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>No friends found</p>
            </div>
          ) : (
            filteredFriends.map(friend => (
              <div
                key={friend.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${invitedFriends.find(f => f.id === friend.id)
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-dark/50 border-primary/20 hover:border-primary/40'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    {friend.avatar || friend.username[0]?.toUpperCase() || '👤'}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{friend.fname} {friend.lname}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>@{friend.username}</span>
                      {friend.total_xp && (
                        <>
                          <span>•</span>
                          <span>{friend.total_xp.toLocaleString()} XP</span>
                        </>
                      )}
                      {friend.current_rank && (
                        <>
                          <span>•</span>
                          <span>{friend.current_rank}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (invitedFriends.find(f => f.id === friend.id)) {
                      handleRemoveInvite(friend.id);
                    } else {
                      handleInviteFriend(friend);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg border transition-colors ${invitedFriends.find(f => f.id === friend.id)
                    ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                    : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
                    }`}
                >
                  {invitedFriends.find(f => f.id === friend.id) ? 'Remove' : 'Invite'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep('basic')}
          className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep('suggestions')}
          className="flex-1 py-3 bg-primary text-dark font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          Next: View Suggestions
        </button>
      </div>
    </div>
  );

  const renderSuggestionsStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-pixel text-primary text-xl mb-2">Tribe Suggestions</h2>
        <p className="text-gray-400 text-sm">Similar squads you might want to join instead</p>
      </div>

      <div className="space-y-3">
        {tribeSuggestions.map(tribe => (
          <div key={tribe.id} className="p-4 bg-dark/50 border border-primary/20 rounded-lg hover:border-primary/40 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                  {tribe.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{tribe.name}</h3>
                    <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs">
                      {tribe.similarityScore}% match
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{tribe.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{tribe.memberCount} members</span>
                    <span>Avg {tribe.averageXP.toLocaleString()} XP</span>
                  </div>
                </div>
              </div>
              <button className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors text-sm">
                Join Tribe
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep('invite')}
          className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep('confirm')}
          className="flex-1 py-3 bg-primary text-dark font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          Continue with My Squad
        </button>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-pixel text-primary text-xl mb-2">Confirm Squad Creation</h2>
        <p className="text-gray-400 text-sm">Review your squad details before creating</p>
      </div>

      {/* Squad Preview */}
      <div className="p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-3xl">
            {squadEmoji}
          </div>
          <div>
            <h3 className="text-white text-xl font-bold">{squadName}</h3>
            {squadDescription && (
              <p className="text-gray-300 text-sm mt-1">{squadDescription}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 rounded text-xs ${isPublic ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {isPublic ? 'Public' : 'Private'}
              </span>
              {subjectFocus.length > 0 && (
                <div className="flex gap-1">
                  {subjectFocus.slice(0, 2).map((subject, index) => (
                    <span key={index} className="px-2 py-1 rounded bg-primary/20 text-primary text-xs">
                      {subject}
                    </span>
                  ))}
                  {subjectFocus.length > 2 && (
                    <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-400 text-xs">
                      +{subjectFocus.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-dark/50 rounded-lg">
            <div className="text-primary font-bold text-lg">{invitedFriends.length + 1}</div>
            <div className="text-gray-400 text-sm">Members</div>
          </div>
          <div className="text-center p-3 bg-dark/50 rounded-lg">
            <div className="text-yellow-400 font-bold text-lg">New</div>
            <div className="text-gray-400 text-sm">Squad Rank</div>
          </div>
        </div>
      </div>

      {/* Invited Members */}
      {invitedFriends.length > 0 && (
        <div>
          <h3 className="text-white font-medium mb-3">Invited Members</h3>
          <div className="space-y-2">
            {invitedFriends.map(friend => (
              <div key={friend.id} className="flex items-center gap-3 p-3 bg-dark/50 border border-primary/20 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  {friend.avatar || friend.username[0]?.toUpperCase() || '👤'}
                </div>
                <div className="flex-1">
                  <h4 className="text-white text-sm font-medium">{friend.fname} {friend.lname}</h4>
                  <p className="text-gray-400 text-xs">@{friend.username}</p>
                </div>
                <div className="text-xs text-gray-400">Will receive invite</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Crown size={20} className="text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-blue-300 font-medium">Squad Leader Benefits</h4>
            <ul className="text-blue-200 text-sm mt-2 space-y-1">
              <li>• Manage squad settings and members</li>
              <li>• Initiate squad challenges and activities</li>
              <li>• Access detailed squad analytics</li>
              <li>• Exclusive leader badges and rewards</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep('suggestions')}
          className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleCreateSquad}
          disabled={loading}
          className="flex-1 py-3 bg-primary text-dark font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin"></div>
              Creating Squad...
            </div>
          ) : (
            <>
              <UserPlus size={16} className="inline mr-2" />
              Create Squad
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-dark border border-primary/20 rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-primary/20 bg-dark/95 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="font-pixel text-primary text-lg">Squad Formation</h1>
                <p className="text-gray-400 text-sm">
                  Step {
                    step === 'basic' ? '1' :
                      step === 'invite' ? '2' :
                        step === 'suggestions' ? '3' : '4'
                  } of 4
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-primary/10 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${step === 'basic' ? '25%' :
                  step === 'invite' ? '50%' :
                    step === 'suggestions' ? '75%' : '100%'
                  }%`
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'basic' && renderBasicStep()}
          {step === 'invite' && renderInviteStep()}
          {step === 'suggestions' && renderSuggestionsStep()}
          {step === 'confirm' && renderConfirmStep()}
        </div>
      </div>
    </div>
  );
};