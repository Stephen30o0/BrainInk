import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Search, Plus, MessageCircle, Bot, Users, Phone, Video, MoreVertical, Send, Image as ImageIcon, Smile, X } from 'lucide-react';
import { apiService } from '../../src/services/apiService';
import { AIAgentChat } from './AIAgentChat';

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

interface Conversation {
    user: User;
    messages: Message[];
    unreadCount: number;
    lastMessage?: Message;
    lastActivity?: string;
}

interface AIAgent {
    id: string;
    name: string;
    type: 'kana';
    avatar: string;
    description: string;
    unreadCount: number;
    isOnline: boolean;
}

interface DirectMessagesTabProps {
    friends: any[];
}

export const DirectMessagesTab: React.FC<DirectMessagesTabProps> = ({ friends }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [selectedAIAgent, setSelectedAIAgent] = useState<AIAgent | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
    const [friendSearchQuery, setFriendSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [showKanaChat, setShowKanaChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const API_BASE_URL = 'https://brainink-backend-freinds-micro.onrender.com/friends';

    const aiAgents: AIAgent[] = [
        {
            id: 'kana',
            name: 'Kana',
            type: 'kana',
            avatar: '📚',
            description: 'Study Coach & Academic Assistant',
            unreadCount: 2,
            isOnline: true
        }
    ];    useEffect(() => {
        loadConversations();
        // eslint-disable-next-line
    }, [friends]);

    useEffect(() => {
        // If friends data seems incomplete, try to reload it
        if (friends && friends.length > 0) {
            const hasIncompleteData = friends.some(friend => 
                !friend.username || !friend.fname || friend.username === 'undefined'
            );
            if (hasIncompleteData) {
                console.warn('🔧 Detected incomplete friends data, attempting to reload...');
                reloadFriendsData();
            }
        }
    }, [friends]);

    const reloadFriendsData = async () => {
        try {
            console.log('🔄 Reloading friends data directly from API...');
            
            // Force a fresh load of friends data
            await apiService.refreshData('friends');
            
            // Get the updated friends data
            const updatedFriends = apiService.getFriends();
            console.log('🔄 Updated friends data:', updatedFriends);
            
            // Load conversations with updated data
            if (updatedFriends && updatedFriends.length > 0) {
                await loadConversationsWithFriends(updatedFriends);
            }
        } catch (error) {
            console.error('❌ Error reloading friends data:', error);
        }
    };

    const loadConversationsWithFriends = async (friendsData: User[]) => {
        // Similar to loadConversations but with provided friends data
        const conversationList: Conversation[] = await Promise.all(
            friendsData.map(async friend => {
                try {
                    let conversationData = await apiService.getConversation(friend.username);
                    let messages: any[] = [];

                    if (Array.isArray(conversationData)) {
                        messages = conversationData;
                    } else if (conversationData.messages && Array.isArray(conversationData.messages)) {
                        messages = conversationData.messages;
                    } else if (conversationData.data && Array.isArray(conversationData.data)) {
                        messages = conversationData.data;
                    }

                    messages = messages.sort(
                        (a: Message, b: Message) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );

                    return {
                        user: friend,
                        messages,
                        unreadCount: Math.floor(Math.random() * 3),
                        lastMessage: messages.length > 0 ? messages[messages.length - 1] : undefined,
                        lastActivity: messages.length > 0 ? messages[messages.length - 1].created_at : undefined
                    };
                } catch (error) {
                    console.error(`Error loading conversation for ${friend.username}:`, error);
                    return {
                        user: friend,
                        messages: [],
                        unreadCount: 0,
                        lastMessage: undefined,
                        lastActivity: undefined
                    };
                }
            })
        );

        // Add Kana at the top
        const allConversations = [
            {
                user: KANA_USER,
                messages: [],
                unreadCount: 2,
                lastMessage: undefined,
                lastActivity: undefined
            },
            ...conversationList
        ];

        setConversations(allConversations);
        setError(null);
        setLoading(false);
    };

    useEffect(() => {
        scrollToBottom();
    }, [selectedConversation?.messages]);

    const KANA_USER: User = {
        id: -999, // Unique negative ID to avoid collision
        username: 'kana',
        fname: 'Kana',
        lname: 'AI',
        avatar: '📚'
    };    const loadConversations = async () => {
        try {
            setLoading(true);

            console.log('🔍 DirectMessagesTab received friends:', friends);
            console.log('🔍 Friends length:', friends?.length);
            if (friends && friends.length > 0) {
                console.log('🔍 First friend structure:', friends[0]);
                console.log('🔍 Friend usernames:', friends.map(f => f?.username || 'MISSING USERNAME'));
            }

            if (!friends || friends.length === 0) {
                console.log('⚠️ No friends found, showing only Kana');
                // If no friends, just show Kana and return
                setConversations([{
                    user: KANA_USER,
                    messages: [],
                    unreadCount: 0,
                    lastMessage: undefined,
                    lastActivity: undefined
                }]);
                return;
            }

            const conversationList: Conversation[] = await Promise.all(
                friends.map(async friend => {                    try {
                        let conversationData = await apiService.getConversation(friend.username);
                        let messages: any[] = [];

                        // Handle different response formats
                        if (Array.isArray(conversationData)) {
                            messages = conversationData;
                        } else if (conversationData.messages && Array.isArray(conversationData.messages)) {
                            messages = conversationData.messages;
                        } else if (conversationData.data && Array.isArray(conversationData.data)) {
                            messages = conversationData.data;
                        }

                        messages = messages.sort(
                            (a: Message, b: Message) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                        );

                        return {
                            user: friend,
                            messages,
                            unreadCount: Math.floor(Math.random() * 3),
                            lastMessage: messages.length > 0 ? messages[messages.length - 1] : undefined,
                            lastActivity: messages.length > 0 ? messages[messages.length - 1].created_at : undefined
                        };
                    } catch (error) {
                        console.error(`Error loading conversation for ${friend.username}:`, error);
                        return {
                            user: friend,
                            messages: [],
                            unreadCount: 0,
                            lastMessage: undefined,
                            lastActivity: undefined
                        };
                    }
                })
            );

            // Add Kana as a conversation at the top
            conversationList.unshift({
                user: KANA_USER,
                messages: [],
                unreadCount: 0,
                lastMessage: undefined,
                lastActivity: undefined
            });

            // Sort by last activity (friends with recent messages first)
            conversationList.sort((a, b) => {
                if (a.user.username === 'kana') return -1; // Keep Kana at top
                if (b.user.username === 'kana') return 1;
                return new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime();
            });

            setConversations(conversationList);
        } catch (error) {
            console.error('Error loading conversations:', error);
            // Still show Kana even if there's an error
            setConversations([{
                user: KANA_USER,
                messages: [],
                unreadCount: 0,
                lastMessage: undefined,
                lastActivity: undefined
            }]);
        } finally {
            setLoading(false);
        }
    };    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || !selectedConversation.user || sendingMessage) return;

        const messageContent = newMessage.trim();
        setNewMessage('');

        const tempMessage: Message = {
            id: Date.now(),
            sender_id: getCurrentUserId() || 0,
            receiver_id: selectedConversation.user.id,
            content: messageContent,
            message_type: 'text',
            status: 'sending',
            created_at: new Date().toISOString(),
            isMe: true
        };

        // Optimistically add the message to the end (bottom) and update lastActivity/lastMessage
        setConversations(prev => {
            const updated = prev.map(conv =>
                conv.user.id === selectedConversation.user.id
                    ? {
                        ...conv,
                        messages: [...conv.messages, tempMessage],
                        lastMessage: tempMessage,
                        lastActivity: tempMessage.created_at
                    }
                    : conv
            );
            // Sort by newest lastActivity
            return updated.sort((a, b) =>
                new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime()
            );
        });
        setSelectedConversation(prev => prev ? {
            ...prev,
            messages: [...prev.messages, tempMessage],
            lastMessage: tempMessage,
            lastActivity: tempMessage.created_at
        } : null);

        setSendingMessage(true);

        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`${API_BASE_URL}/message/send/${getCurrentUserId()}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                body: JSON.stringify({
                    receiver_username: selectedConversation.user.username,
                    content: messageContent,
                    message_type: 'text'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            // Update the status to 'sent'
            setConversations(prev => {
                const updated = prev.map(conv =>
                    conv.user.id === selectedConversation.user.id
                        ? {
                            ...conv,
                            messages: conv.messages.map(msg =>
                                msg.id === tempMessage.id
                                    ? { ...msg, status: 'sent' }
                                    : msg
                            )
                        }
                        : conv
                );
                // Sort by newest lastActivity
                return updated.sort((a, b) =>
                    new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime()
                );
            });
            setSelectedConversation(prev => prev ? {
                ...prev,
                messages: prev.messages.map(msg =>
                    msg.id === tempMessage.id
                        ? { ...msg, status: 'sent' }
                        : msg
                )
            } : null);

        } catch (error) {
            setConversations(prev => {
                const updated = prev.map(conv =>
                    conv.user.id === selectedConversation.user.id
                        ? {
                            ...conv,
                            messages: conv.messages.map(msg =>
                                msg.id === tempMessage.id
                                    ? { ...msg, status: 'failed' }
                                    : msg
                            )
                        }
                        : conv
                );
                // Sort by newest lastActivity
                return updated.sort((a, b) =>
                    new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime()
                );
            });
            setSelectedConversation(prev => prev ? {
                ...prev,
                messages: prev.messages.map(msg =>
                    msg.id === tempMessage.id
                        ? { ...msg, status: 'failed' }
                        : msg
                )
            } : null);
        } finally {
            setSendingMessage(false);
        }
    };

    const getAIResponse = (agentType: 'kana', userMessage: string): string => {
        const responses = [
            "I can help you with that topic. Let me find some relevant past papers.",
            "Here's a detailed explanation of that concept...",
            "Based on your progress, I recommend focusing on these areas next.",
            "Would you like me to create a practice quiz for this topic?"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
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

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };    const filteredConversations = conversations.filter(conv =>
        (conv.user?.fname?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (conv.user?.lname?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (conv.user?.username?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    // Ensure Kana is always at the top of the conversations list
    const kanaConversation = filteredConversations.find(
        conv => conv.user.username === 'kana'
    );
    const otherConversations = filteredConversations.filter(
        conv => conv.user.username !== 'kana'
    );
    const sortedConversations = kanaConversation
        ? [kanaConversation, ...otherConversations]
        : otherConversations;

    const renderMessage = (message: Message) => {
        const isMe = message.isMe || message.sender_id === getCurrentUserId();

        return (
            <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className={`max-w-[70%] ${isMe ? 'bg-primary/20' : 'bg-gray-800'} rounded-lg p-3`}>
                    {!isMe && message.sender_info && (
                        <div className="text-sm text-primary font-medium mb-1">
                            {message.sender_info.fname} {message.sender_info.lname}
                        </div>
                    )}
                    <p className="text-white">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">
                            {formatTime(message.created_at)}
                        </span>
                        {isMe && (
                            <span className={`text-xs ${message.status === 'sent' ? 'text-green-400' :
                                message.status === 'sending' ? 'text-yellow-400' :
                                    'text-red-400'
                                }`}>
                                {message.status === 'sent' ? '✓' :
                                    message.status === 'sending' ? '○' : '✗'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Add Friend Search Logic (copy from FriendsPanel)
    const handleSearchFriends = async (query: string) => {
        setFriendSearchQuery(query);
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setError('Please log in to search for friends');
                setIsSearching(false);
                return;
            }
            const response = await fetch(
                `https://brainink-backend-freinds-micro.onrender.com/friends/users/search?username=${encodeURIComponent(query)}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                }
            );
            if (!response.ok) {
                setError('Search failed');
                setIsSearching(false);
                return;
            }            const results = await response.json();
            let usersArray: any[] = [];
            if (Array.isArray(results)) {
                usersArray = results;
            } else if (results.users && Array.isArray(results.users)) {
                usersArray = results.users;
            } else if (results.data && Array.isArray(results.data)) {
                usersArray = results.data;
            }
            setSearchResults(usersArray);
        } catch (err) {
            setError('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSendFriendRequest = async (userId: string) => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setError('Please log in to send friend requests');
            return;
        }
        try {
            const user = searchResults.find(u => u.id.toString() === userId);
            if (!user) {
                setError('User not found');
                return;
            }
            const requestBody = {
                addressee_username: user.username,
                message: ''
            };
            const currentUserId = (() => {
                try {
                    const tokenParts = token.split('.');
                    const base64Payload = tokenParts[1];
                    const paddedPayload = base64Payload.padEnd(base64Payload.length + (4 - base64Payload.length % 4) % 4, '=');
                    const decodedPayload = atob(paddedPayload);
                    const payload = JSON.parse(decodedPayload);
                    return payload.user_id || payload.sub || payload.id || payload.userId;
                } catch {
                    return null;
                }
            })();
            if (!currentUserId) {
                setError('Unable to identify user');
                return;
            }
            const response = await fetch(
                `https://brainink-backend-freinds-micro.onrender.com/friends/request/send/${currentUserId}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    },
                    body: JSON.stringify(requestBody)
                }
            );
            if (!response.ok) {
                setError('Failed to send friend request');
                return;
            }
            setIsAddFriendModalOpen(false);
            setFriendSearchQuery('');
            setSearchResults([]);
            setError(null);
        } catch (err) {
            setError('Failed to send friend request');
        }
    };

    return (
        <div className="h-full flex">
            {/* Conversations List */}
            <div className="w-80 border-r border-primary/20 flex flex-col">                {/* Header */}
                <div className="p-4 border-b border-primary/20">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-pixel text-primary text-lg">Messages</h2>
                        <button
                            className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
                            onClick={() => setIsAddFriendModalOpen(true)}
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-dark/50 border border-primary/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                        />
                    </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-400">
                            Loading conversations...
                        </div>
                    ) : sortedConversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-400">
                            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                            <h3 className="font-medium mb-2">No Friends Yet</h3>
                            <p className="text-sm">Add some friends to start chatting!</p>
                            <button
                                onClick={() => setIsAddFriendModalOpen(true)}
                                className="mt-3 px-4 py-2 bg-primary/20 text-primary text-sm rounded hover:bg-primary/30 transition-colors"
                            >
                                Add Friends
                            </button>
                        </div>
                    ) : sortedConversations.length === 1 && sortedConversations[0]?.user?.username === 'kana' ? (
                        // Only Kana in the list (no real friends)
                        <div className="space-y-0">
                            {/* Show Kana */}                            {sortedConversations.map(conversation => (
                                <div
                                    key={conversation.user?.id}
                                    onClick={() => {
                                        if (conversation.user?.username === 'kana') {
                                            setShowKanaChat(true);
                                            setSelectedConversation(null);
                                            setSelectedAIAgent(null);
                                        }
                                    }}
                                    className="p-4 border-b border-primary/10 cursor-pointer transition-colors hover:bg-primary/5"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">                                                {conversation.user?.avatar}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-white">
                                                {conversation.user?.fname} {conversation.user?.lname}
                                            </h3>
                                            <p className="text-sm text-gray-400">Study Coach & Academic Assistant</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Empty state for no friends */}
                            <div className="p-6 text-center text-gray-400">
                                <Users size={48} className="mx-auto mb-4 opacity-50" />
                                <h3 className="font-medium mb-2">No Friends Added</h3>
                                <p className="text-sm mb-4">Connect with friends to start conversations!</p>
                                <button
                                    onClick={() => setIsAddFriendModalOpen(true)}
                                    className="px-4 py-2 bg-primary/20 text-primary text-sm rounded hover:bg-primary/30 transition-colors flex items-center gap-2 mx-auto"
                                >
                                    <Plus size={16} />
                                    Add Friends
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Show all conversations (friends + Kana)
                        sortedConversations.map(conversation => (                            <div
                                key={conversation.user?.id}
                                onClick={() => {
                                    if (conversation.user?.username === 'kana') {
                                        setShowKanaChat(true);
                                        setSelectedConversation(null);
                                        setSelectedAIAgent(null);
                                    } else {
                                        setSelectedConversation(conversation);
                                        setSelectedAIAgent(null);
                                        setShowKanaChat(false);
                                    }
                                }}
                                className={`p-4 border-b border-primary/10 cursor-pointer transition-colors ${selectedConversation?.user?.id === conversation.user?.id
                                    ? 'bg-primary/10'
                                    : 'hover:bg-primary/5'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                            {conversation.user?.avatar || conversation.user?.username?.[0]?.toUpperCase() || '👤'}
                                        </div>
                                        {conversation.unreadCount > 0 && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                <span className="text-xs text-white">{conversation.unreadCount}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">                                        <div className="flex items-center justify-between">
                                            <h3 className="font-medium text-white truncate">
                                                {conversation.user?.username === 'kana'
                                                    ? `${conversation.user?.fname || 'Kana'} ${conversation.user?.lname || 'AI'}`
                                                    : `${conversation.user?.fname || conversation.user?.username || 'Unknown'} ${conversation.user?.lname || ''}`
                                                }
                                            </h3>
                                            <span className="text-xs text-gray-400">
                                                {conversation.lastActivity ? formatTime(conversation.lastActivity) : ''}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 truncate">
                                            {conversation.user?.username === 'kana'
                                                ? 'Study Coach & Academic Assistant'
                                                : `@${conversation.user?.username || 'unknown'}`
                                            }
                                        </p>
                                        {conversation.lastMessage && (
                                            <p className="text-sm text-gray-400 truncate mt-1">
                                                {conversation.lastMessage.content}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Only show regular chat UI for non-Kana conversations */}
                {selectedConversation || selectedAIAgent ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-primary/20 bg-dark/95">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">                                        {selectedAIAgent ?
                                            selectedAIAgent.avatar :
                                            selectedConversation?.user?.avatar ||
                                            selectedConversation?.user?.username?.[0]?.toUpperCase() || '👤'
                                        }
                                    </div>
                                    <div>
                                        <h2 className="font-medium text-white">
                                            {selectedAIAgent ?
                                                selectedAIAgent.name :
                                                `${selectedConversation?.user.fname} ${selectedConversation?.user.lname}`
                                            }
                                        </h2>
                                        <span className="text-sm text-gray-400">
                                            {selectedAIAgent ?
                                                selectedAIAgent.description :
                                                `@${selectedConversation?.user.username}`
                                            }
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!selectedAIAgent && (
                                        <>
                                            <button className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                                                <Phone size={16} />
                                            </button>
                                            <button className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                                                <Video size={16} />
                                            </button>
                                        </>
                                    )}
                                    <button className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>                        {/* Messages - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-3 min-h-0">
                            {selectedConversation?.messages.map(renderMessage)}
                            {selectedAIAgent && (
                                <div className="text-center text-gray-400 py-8">
                                    <Bot size={48} className="mx-auto mb-4 opacity-50" />
                                    <h3 className="font-medium mb-2">Chat with {selectedAIAgent.name}</h3>
                                    <p className="text-sm">{selectedAIAgent.description}</p>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>                        {/* Message Input */}
                        <div className="p-4 border-t border-primary/20">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                                <button
                                    type="button"
                                    className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                                >
                                    <ImageIcon size={16} />
                                </button>
                                <button
                                    type="button"
                                    className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                                >
                                    <Smile size={16} />
                                </button>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-dark/50 border border-primary/20 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="p-2 rounded-full bg-primary text-dark disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    /* No conversation selected */
                    <div className="">
                        <MessageCircle size={0} className="" />
                        <h3 className=""></h3>
                        <p className=""></p>
                    </div>
                )}
            </div>            {/* Kana AI Agent Modal - renders as full-screen overlay */}
            {showKanaChat && (
                <AIAgentChat
                    onClose={() => setShowKanaChat(false)}
                    kanaMessages={[]} // Pass stored Kana messages if you want to persist them
                />
            )}

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
                                        className="flex items-center justify-between p-3 bg-dark/30 border border-primary/20 rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
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
                        {error && (
                            <div className="mt-4 text-red-400 text-sm text-center">{error}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};