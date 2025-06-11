import React, { useEffect, useState, useRef } from 'react';
import { Search, Phone, Video, Image as ImageIcon, Smile, Send, Heart, MoreHorizontal, X, Camera } from 'lucide-react';
import { apiService } from '../../services/apiService';

// Define types locally since import is causing issues
interface User {
  id: number;
  username: string;
  fname: string;
  lname: string;
  avatar: string;
  email?: string;
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
}

interface ConversationResponse {
  messages: Message[];
  total_count: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export const MessagesPanel = ({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // API Configuration
  const API_BASE_URL = 'https://brainink-backend-freinds-micro.onrender.com/friends';

  // Token validation function
  const getValidToken = (): string | null => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('No access token found');
      return null;
    }
    return token;
  };

  // Token utility functions
  const getUserIdFromToken = (token: string): number | null => {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return null;

      const base64Payload = tokenParts[1];
      const paddedPayload = base64Payload.padEnd(base64Payload.length + (4 - base64Payload.length % 4) % 4, '=');
      const decodedPayload = atob(paddedPayload);
      const payload = JSON.parse(decodedPayload);

      return payload.user_id || payload.sub || payload.id || payload.userId ?
        parseInt(payload.user_id || payload.sub || payload.id || payload.userId) : null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

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

  // Load chats from preloaded data
  const loadChatsFromPreloadedData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get preloaded data
      let preloadedData = apiService.getPreloadedData();

      if (!preloadedData) {
        console.log('No preloaded data found, loading...');
        try {
          preloadedData = await apiService.preloadAllData();
        } catch (preloadError) {
          console.error('Failed to preload data:', preloadError);
          // Fallback to regular loading
          await loadFriends();
          return;
        }
      }

      const friends = apiService.getFriends();
      const token = getValidToken();

      if (!token) {
        setError('Please log in to view messages');
        return;
      }

      // Extract user ID from token
      const userId = getUserIdFromToken(token);
      if (!userId) {
        setError('Unable to identify user');
        return;
      }

      setCurrentUserId(userId);

      // Convert friends to chats with preloaded conversation data
      const chatsWithMessages = friends.map(friend => {
        const conversation = apiService.getConversation(friend.username);
        const latestMessage = conversation.length > 0 ? conversation[conversation.length - 1] : undefined;

        // Calculate unread count
        const unreadCount = conversation.filter(msg =>
          msg.sender_id !== userId &&
          (!msg.read_at || msg.status !== 'read')
        ).length;

        return {
          id: friend.id.toString(),
          user: friend,
          messages: [],
          unreadCount,
          lastMessage: latestMessage ? {
            ...latestMessage,
            timestamp: formatTimestamp(latestMessage.created_at)
          } : undefined
        };
      });

      // Sort by last message timestamp
      chatsWithMessages.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;

        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
      });

      setChats(chatsWithMessages);
      console.log('Loaded chats from preloaded data:', chatsWithMessages.length);

    } catch (err: any) {
      console.error('Error loading chats:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Send message function
  const sendMessage = async (friendUsername: string, content: string): Promise<boolean> => {
    const token = getValidToken();
    if (!token || !currentUserId) {
      console.log('No token or user ID for sending message');
      return false;
    }

    try {
      setSendingMessage(true);
      console.log(`Sending message to ${friendUsername}: ${content}`);

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
          receiver_username: friendUsername,
          content: content,
          message_type: 'text'
        })
      });

      console.log(`Send message API Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Send message API Error:', errorText);
        setError('Failed to send message');
        return false;
      }

      const data = await response.json();
      console.log('Message sent successfully:', data);
      return true;
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(`Failed to send message: ${err.message}`);
      return false;
    } finally {
      setSendingMessage(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (friendUsername: string): Promise<void> => {
    const token = getValidToken();
    if (!token || !currentUserId) return;

    try {
      console.log(`Marking messages as read for ${friendUsername}`);

      const response = await fetch(`${API_BASE_URL}/message/mark-read/${currentUserId}/${friendUsername}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        console.warn('Failed to mark messages as read:', response.status);
      } else {
        console.log('Messages marked as read successfully');
      }
    } catch (err: any) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Load conversation with friend
  const loadConversation = async (friendUsername: string, page: number = 1, pageSize: number = 50): Promise<Message[]> => {
    const token = getValidToken();
    if (!token || !currentUserId) {
      console.log('No token or user ID for conversation');
      return [];
    }

    try {
      console.log(`Loading conversation with ${friendUsername}, page ${page}, size ${pageSize}...`);

      const response = await fetch(`${API_BASE_URL}/conversation/${currentUserId}/${friendUsername}?page=${page}&page_size=${pageSize}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      console.log(`Conversation API Response status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`No conversation found with ${friendUsername}`);
          return [];
        }
        const errorText = await response.text();
        console.error('Conversation API Error:', errorText);
        return [];
      }

      const data: ConversationResponse = await response.json();
      console.log(`Conversation data for ${friendUsername}:`, data);

      const actualMessages = data.messages || [];

      const transformedMessages = actualMessages.map(msg => ({
        ...msg,
        isMe: msg.sender_id === currentUserId,
        timestamp: formatTimestamp(msg.created_at)
      }));

      return page === 1 ? transformedMessages.reverse() : transformedMessages;
    } catch (err: any) {
      console.error('Error loading conversation:', err);
      return [];
    }
  };

  // Load friends list to create chats
  const loadFriends = async () => {
    const token = getValidToken();
    if (!token || !currentUserId) {
      return;
    }

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

      console.log('Friends API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Friends API Error:', errorText);
        setChats([]);
        return;
      }

      const friendsList = await response.json();
      console.log('Friends list response:', friendsList);

      let friendsArray = [];
      if (Array.isArray(friendsList)) {
        friendsArray = friendsList;
      } else if (friendsList.friends && Array.isArray(friendsList.friends)) {
        friendsArray = friendsList.friends;
      } else if (friendsList.data && Array.isArray(friendsList.data)) {
        friendsArray = friendsList.data;
      }

      console.log('Friends array:', friendsArray);

      if (friendsArray.length === 0) {
        setChats([]);
        return;
      }

      const chatsWithMessages = await Promise.all(
        friendsArray.map(async (friend: User) => {
          try {
            const messages = await loadConversation(friend.username, 1, 5);
            const latestMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

            const unreadCount = messages.filter(msg =>
              msg.sender_id !== currentUserId &&
              (!msg.read_at || msg.status !== 'read')
            ).length;

            console.log(`Friend ${friend.username}: ${messages.length} messages, ${unreadCount} unread`);

            return {
              id: friend.id.toString(),
              user: friend,
              messages: [],
              unreadCount,
              lastMessage: latestMessage ? {
                ...latestMessage,
                timestamp: formatTimestamp(latestMessage.created_at)
              } : undefined
            };
          } catch (error) {
            console.error(`Error loading messages for ${friend.username}:`, error);
            return {
              id: friend.id.toString(),
              user: friend,
              messages: [],
              unreadCount: 0,
              lastMessage: undefined
            };
          }
        })
      );

      chatsWithMessages.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;

        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
      });

      console.log('Chats list created with messages:', chatsWithMessages);
      setChats(chatsWithMessages);

    } catch (err: any) {
      console.error('Error loading friends:', err);
      setError(`Failed to load friends: ${err.message}`);
      setChats([]);
    }
  };

  // Handle chat selection
  const handleChatSelect = async (chatId: string) => {
    setSelectedChat(chatId);
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setError(null);
      console.log('Loading conversation for:', chat.user.username);

      const messages = await loadConversation(chat.user.username);

      setChats(prevChats =>
        prevChats.map(c =>
          c.id === chatId
            ? { ...c, messages, unreadCount: 0 }
            : c
        )
      );

      await markMessagesAsRead(chat.user.username);
    }
  };

  // Handle sending message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sendingMessage) return;

    const chat = chats.find(c => c.id === selectedChat);
    if (!chat) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    const tempMessage: Message = {
      id: Date.now(),
      sender_id: currentUserId!,
      receiver_id: chat.user.id,
      content: messageContent,
      message_type: 'text',
      status: 'sending',
      created_at: new Date().toISOString(),
      isMe: true,
      timestamp: 'now'
    };

    setChats(prevChats =>
      prevChats.map(c =>
        c.id === selectedChat
          ? {
            ...c,
            messages: [...c.messages, tempMessage],
            lastMessage: { ...tempMessage, timestamp: 'now' }
          }
          : c
      )
    );

    scrollToBottom();

    const success = await sendMessage(chat.user.username, messageContent);

    if (success) {
      setTimeout(async () => {
        const messages = await loadConversation(chat.user.username);
        const latestMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

        setChats(prevChats =>
          prevChats.map(c =>
            c.id === selectedChat
              ? {
                ...c,
                messages,
                lastMessage: latestMessage ? {
                  ...latestMessage,
                  timestamp: formatTimestamp(latestMessage.created_at)
                } : undefined
              }
              : c
          )
        );
      }, 1000);
    } else {
      setChats(prevChats =>
        prevChats.map(c =>
          c.id === selectedChat
            ? {
              ...c,
              messages: c.messages.filter(msg => msg.id !== tempMessage.id),
              lastMessage: c.messages.length > 1 ? c.messages[c.messages.length - 2] : undefined
            }
            : c
        )
      );
      setNewMessage(messageContent);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'end'
        });
      }
    }, 100);
  };

  // Add this new function for immediate scroll (without animation)
  const scrollToBottomImmediate = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'auto',
        block: 'end'
      });
    }
  };

  // Initialize component
  useEffect(() => {
    const initializeMessages = async () => {
      if (!isOpen) return;

      setLoading(true);
      setError(null);
      setChats([]);

      const token = getValidToken();
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

    initializeMessages();
  }, [isOpen]);

  useEffect(() => {
    if (currentUserId && isOpen) {
      loadChatsFromPreloadedData();
    }
  }, [currentUserId, isOpen]);

  // Update the useEffect for initial scroll when messages load
  useEffect(() => {
    if (selectedChat) {
      const active = chats.find(chat => chat.id === selectedChat);
      if (active && active.messages.length > 0) {
        // Immediate scroll when messages are first loaded
        setTimeout(() => {
          scrollToBottomImmediate();
        }, 200);
      }
    }
  }, [selectedChat, chats]);

  if (!isOpen) return null;

  const activeChat = chats.find(chat => chat.id === selectedChat);
  const filteredChats = chats.filter(chat =>
    chat.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.user.fname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.user.lname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[80vh] bg-dark border border-primary/20 rounded-lg overflow-hidden">
        <div className="flex h-full">
          {/* Chats List */}
          <div className="w-80 border-r border-primary/20 flex flex-col">
            <div className="p-4 border-b border-primary/20 flex items-center justify-between">
              <h2 className="font-pixel text-primary text-sm">Messages</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

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

            <div className="p-3 border-b border-primary/20">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-dark/50 border border-primary/20 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-400">
                  Loading conversations...
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  {searchQuery ? 'No conversations found' : 'No friends to message yet'}
                </div>
              ) : (
                filteredChats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => handleChatSelect(chat.id)}
                    className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${selectedChat === chat.id ? 'bg-primary/10' : 'hover:bg-primary/5'
                      }`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                        {chat.user.avatar || chat.user.username?.substring(0, 2).toUpperCase() || '👤'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-medium text-white truncate">
                          {chat.user.fname && chat.user.lname
                            ? `${chat.user.fname} ${chat.user.lname}`
                            : chat.user.username
                          }
                        </h3>
                        <span className="text-xs text-gray-400">
                          {chat.lastMessage?.timestamp || ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 truncate">
                        {chat.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-xs text-white">{chat.unreadCount}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedChat && activeChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-primary/20 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">
                      {activeChat.user.avatar || activeChat.user.username?.substring(0, 2).toUpperCase() || '👤'}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">
                        {activeChat.user.fname && activeChat.user.lname
                          ? `${activeChat.user.fname} ${activeChat.user.lname}`
                          : activeChat.user.username
                        }
                      </h3>
                      <span className="text-xs text-gray-400">
                        @{activeChat.user.username}
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
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                </div>

                {/* Messages Container - Scrollable */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <div className="h-full overflow-y-auto p-4 space-y-4">
                    {activeChat.messages.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      activeChat.messages.map(message => (
                        <div key={message.id} className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-[70%] group">
                            <div className={`rounded-2xl px-4 py-2 ${message.isMe
                              ? 'bg-primary/20 text-white'
                              : 'bg-gray-800 text-white'
                              }`}>
                              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">{message.timestamp}</span>
                              {message.isMe && (
                                <span className="text-xs text-gray-500">
                                  {message.status === 'read' ? '✓✓' : message.status === 'sent' ? '✓' : '○'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-primary/20 bg-dark/50 flex-shrink-0">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <button type="button" className="text-primary hover:text-primary/80">
                      <Camera size={20} />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
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
                    <button type="button" className="text-primary hover:text-primary/80">
                      <Smile size={20} />
                    </button>
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="text-primary hover:text-primary/80 disabled:opacity-50"
                    >
                      <Send size={20} />
                    </button>
                  </form>
                  {sendingMessage && (
                    <div className="text-xs text-gray-400 mt-1 px-4">Sending...</div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Select a chat to start messaging</h3>
                  <p className="text-sm">Choose a friend from your list to begin chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};