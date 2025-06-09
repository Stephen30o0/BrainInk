import React, { useEffect, useState, useRef } from 'react';
import { Search, Phone, Video, Image as ImageIcon, Smile, Send, Mic, Paperclip, MoreVertical, ChevronLeft, Settings } from 'lucide-react';
import AvatarDisplay from '../components/shared/AvatarDisplay';

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

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  message_type: string;
  status: string;
  created_at: string;
  read_at?: string;
  sender_info?: User;
  isMe?: boolean;
  timestamp?: string;
}

interface Chat {
  id: string;
  user: User;
  messages: Message[];
  unreadCount: number;
  lastMessage?: Message;
  status?: 'online' | 'offline' | 'away';
}

interface ConversationResponse {
  messages: Message[];
  total_count: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export const MessagingPage = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      if (tokenParts.length !== 3) {
        console.error('Invalid token format');
        return null;
      }

      const base64Payload = tokenParts[1];
      const paddedPayload = base64Payload.padEnd(base64Payload.length + (4 - base64Payload.length % 4) % 4, '=');
      const decodedPayload = atob(paddedPayload);
      const payload = JSON.parse(decodedPayload);

      const userId = payload.user_id || payload.sub || payload.id || payload.userId;
      return userId ? parseInt(userId) : null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Load friends list to create chats
  const loadFriends = async () => {
    const token = await getValidToken();
    if (!token || !currentUserId) return;

    try {
      console.log('Loading friends for user:', currentUserId);

      const response = await fetch(`${API_BASE_URL}/list/${currentUserId}`, {
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
        throw new Error(`Failed to load friends: ${response.status}`);
      }

      const friendsList = await response.json();
      console.log('Friends list response:', friendsList);

      // Handle different response structures
      let friendsArray = [];
      if (Array.isArray(friendsList)) {
        friendsArray = friendsList;
      } else if (friendsList.friends && Array.isArray(friendsList.friends)) {
        friendsArray = friendsList.friends;
      } else if (friendsList.data && Array.isArray(friendsList.data)) {
        friendsArray = friendsList.data;
      }

      // Transform friends to chats
      const chatsList: Chat[] = friendsArray.map((friend: User) => ({
        id: friend.id.toString(),
        user: friend,
        messages: [],
        unreadCount: 0,
        lastMessage: undefined,
        status: 'offline' // Default status, you can enhance this with real status
      }));

      setChats(chatsList);
    } catch (err: any) {
      console.error('Error loading friends:', err);
      setError('Failed to load friends list');
      setChats([]);
    }
  };

  // Load conversation messages
  const loadConversation = async (friendUsername: string): Promise<Message[]> => {
    const token = await getValidToken();
    if (!token || !currentUserId) return [];

    try {
      console.log(`Loading conversation with ${friendUsername}...`);

      const response = await fetch(`${API_BASE_URL}/conversation/${currentUserId}/${friendUsername}?page=1&page_size=50`, {
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
        console.log('No conversation found or error loading messages');
        return [];
      }

      const data: ConversationResponse = await response.json();
      console.log('Conversation data:', data);

      const actualMessages = data.messages || [];

      // Transform messages and add isMe flag
      const transformedMessages = actualMessages.map(msg => ({
        ...msg,
        isMe: msg.sender_id === currentUserId,
        timestamp: formatTimestamp(msg.created_at)
      }));

      return transformedMessages.reverse(); // Show oldest first
    } catch (err: any) {
      console.error('Error loading conversation:', err);
      return [];
    }
  };

  // Send message
  const sendMessage = async (receiverUsername: string, content: string): Promise<boolean> => {
    const token = await getValidToken();
    if (!token || !currentUserId) return false;

    try {
      setSendingMessage(true);

      const response = await fetch(`${API_BASE_URL}/message/send/${currentUserId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          receiver_username: receiverUsername,
          content: content,
          message_type: 'text'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const result = await response.json();
      console.log('Message sent:', result);
      return true;
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(`Failed to send message: ${err.message}`);
      return false;
    } finally {
      setSendingMessage(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'unknown';
    }
  };


  // Handle chat selection
  const handleChatSelect = async (chat: Chat) => {
    setSelectedChat(chat);
    setError(null);

    // Load conversation messages
    const messages = await loadConversation(chat.user.username);

    // Update selected chat with messages
    setSelectedChat(prev => prev ? { ...prev, messages } : null);
  };

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat || sendingMessage) return;

    const messageContent = message.trim();
    setMessage('');

    // Add temporary message for immediate UI feedback
    const tempMessage: Message = {
      id: Date.now(),
      sender_id: currentUserId!,
      receiver_id: selectedChat.user.id,
      content: messageContent,
      message_type: 'text',
      status: 'sending',
      created_at: new Date().toISOString(),
      isMe: true,
      timestamp: 'now'
    };

    setSelectedChat(prev => prev ? {
      ...prev,
      messages: [...prev.messages, tempMessage]
    } : null);

    scrollToBottom();

    const success = await sendMessage(selectedChat.user.username, messageContent);

    if (success) {
      // Reload conversation to get actual message
      setTimeout(async () => {
        const messages = await loadConversation(selectedChat.user.username);
        setSelectedChat(prev => prev ? { ...prev, messages } : null);
      }, 1000);
    } else {
      // Remove failed message
      setSelectedChat(prev => prev ? {
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== tempMessage.id)
      } : null);
      setMessage(messageContent);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // Add voice recording logic here
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Add voice recording stop logic here
  };

  // Initialize component
  useEffect(() => {
    const initializeMessaging = async () => {
      setLoading(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        setError('Please log in to view messages');
        setLoading(false);
        return;
      }

      const userId = getUserIdFromToken(token);
      if (!userId) {
        setError('Unable to identify user');
        setLoading(false);
        return;
      }

      setCurrentUserId(userId);
    };

    initializeMessaging();
  }, []);

  // Load friends when user ID is available
  useEffect(() => {
    if (currentUserId) {
      loadFriends().finally(() => setLoading(false));
    }
  }, [currentUserId]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (selectedChat?.messages) {
      scrollToBottom();
    }
  }, [selectedChat?.messages]);

  const filteredChats = chats.filter(chat =>
    chat.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.user.fname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.user.lname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-dark flex">
      {/* Contacts Sidebar */}
      <div className="w-80 border-r border-primary/20 flex flex-col">
        <div className="p-4 border-b border-primary/20 flex items-center justify-between">
          <h1 className="font-pixel text-primary text-sm">Messages</h1>
          <Settings size={20} className="text-primary cursor-pointer" />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-500/20 border-b border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b border-primary/20">
          <div className="relative">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-dark/50 border border-primary/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-400">
              Loading friends...
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              {searchQuery ? 'No friends found matching search' : 'No friends connected yet'}
              <div className="text-xs mt-2">
                {chats.length === 0 && !searchQuery && (
                  <span>Add friends to start messaging</span>
                )}
              </div>
            </div>
          ) : (
            filteredChats.map(chat => (
              <div
                key={chat.id}
                onClick={() => handleChatSelect(chat)}
                className={`p-4 flex items-center gap-3 cursor-pointer transition-colors border-b border-primary/10
                  ${selectedChat?.id === chat.id ? 'bg-primary/10' : 'hover:bg-primary/5'}`}
              >
                <div className="relative">
                  <AvatarDisplay avatar={chat.user.avatar} size="w-12 h-12" altText={`${chat.user.username}'s avatar`} fallbackText={chat.user.username?.substring(0, 2).toUpperCase() || '👤'} />

                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-dark
                    ${chat.status === 'online' ? 'bg-green-500' : chat.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-medium text-white truncate">
                      {chat.user.fname && chat.user.lname
                        ? `${chat.user.fname} ${chat.user.lname}`
                        : chat.user.username
                      }
                    </h3>
                    {chat.lastMessage?.timestamp && (
                      <span className="text-xs text-gray-400">
                        {chat.lastMessage.timestamp}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {chat.lastMessage?.content || ''}
                  </p>
                </div>
                {chat.unreadCount && chat.unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs text-white">
                      {chat.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedChat ? (
          <>
            {/* Chat Header - Fixed height */}
            <div className="p-4 border-b border-primary/20 flex items-center justify-between bg-dark/90 flex-shrink-0">
              <div className="flex items-center gap-3">
                <ChevronLeft
                  size={24}
                  className="text-primary cursor-pointer lg:hidden"
                  onClick={() => setSelectedChat(null)}
                />
                <AvatarDisplay avatar={selectedChat.user.avatar} size="w-10 h-10" altText={`${selectedChat.user.username}'s avatar`} />

                <div>
                  <h2 className="font-medium text-white">
                    {selectedChat.user.fname && selectedChat.user.lname
                      ? `${selectedChat.user.fname} ${selectedChat.user.lname}`
                      : selectedChat.user.username
                    }
                  </h2>
                  <span className="text-xs text-gray-400">
                    @{selectedChat.user.username}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-primary hover:text-primary/80">
                  <Phone size={20} />
                </button>
                <button className="text-primary hover:text-primary/80">
                  <Video size={20} />
                </button>
                <button className="text-primary hover:text-primary/80">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Messages Container - Scrollable area */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                  {selectedChat.messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    selectedChat.messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${msg.isMe ? 'bg-primary/20' : 'bg-gray-800'} rounded-lg p-3`}>
                          <p className="text-white whitespace-pre-wrap break-words">{msg.content}</p>
                          <span className="text-xs text-gray-400 mt-1 block">
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Message Input - Fixed at bottom */}
            <div className="p-4 border-t border-primary/20 bg-dark/90 flex-shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <button type="button" className="text-primary hover:text-primary/80">
                  <Paperclip size={20} />
                </button>
                <button type="button" className="text-primary hover:text-primary/80">
                  <ImageIcon size={20} />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sendingMessage}
                  className="flex-1 bg-dark/50 border border-primary/20 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button
                  type="button"
                  className="text-primary hover:text-primary/80"
                  onMouseDown={handleStartRecording}
                  onMouseUp={handleStopRecording}
                >
                  <Mic size={20} className={isRecording ? 'text-red-500' : ''} />
                </button>
                <button type="button" className="text-primary hover:text-primary/80">
                  <Smile size={20} />
                </button>
                <button
                  type="submit"
                  disabled={!message.trim() || sendingMessage}
                  className="text-primary hover:text-primary/80 disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </form>
              {sendingMessage && (
                <div className="text-xs text-gray-400 mt-1">
                  Sending...
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Select a contact to start messaging</h3>
              <p className="text-sm">
                {chats.length === 0
                  ? 'Add friends to start messaging'
                  : 'Choose a friend from your list to begin chatting'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};