import React, { useEffect, useState, useRef } from 'react';
import { Search, Phone, Video, Image as ImageIcon, Smile, Send, Heart, MoreHorizontal, X, Camera } from 'lucide-react';
interface Message {
  id: string;
  content: string;
  timestamp: string;
  isMe: boolean;
  liked?: boolean;
  image?: string;
}
interface Chat {
  id: string;
  user: {
    name: string;
    avatar: string;
    isOnline: boolean;
    lastActive?: string;
  };
  messages: Message[];
  unreadCount: number;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chats] = useState<Chat[]>([{
    id: '1',
    user: {
      name: 'Sarah Connor',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=1',
      isOnline: true
    },
    messages: [{
      id: '1',
      content: "Hey! Did you complete today's quest?",
      timestamp: '2:30 PM',
      isMe: false
    }, {
      id: '2',
      content: 'Yes! Just earned 50 INK tokens! 🎉',
      timestamp: '2:31 PM',
      isMe: true
    }],
    unreadCount: 2
  }, {
    id: '2',
    user: {
      name: 'John Matrix',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=2',
      isOnline: false,
      lastActive: '1h ago'
    },
    messages: [{
      id: '1',
      content: 'Want to join the tournament?',
      timestamp: '1:15 PM',
      isMe: false
    }],
    unreadCount: 1
  }]);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [selectedChat]);
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    // Add message handling logic here
    setNewMessage('');
    scrollToBottom();
  };
  if (!isOpen) return null;
  const activeChat = chats.find(chat => chat.id === selectedChat);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[80vh] bg-dark border border-primary/20 rounded-lg overflow-hidden">
        <div className="flex h-full">
          {/* Chats List */}
          <div className="w-80 border-r border-primary/20 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-primary/20 flex items-center justify-between">
              <h2 className="font-pixel text-primary text-sm">Messages</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            {/* Search */}
            <div className="p-3 border-b border-primary/20">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search messages..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-dark/50 border border-primary/20 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-primary" />
              </div>
            </div>
            {/* Chats List */}
            <div className="flex-1 overflow-y-auto">
              {chats.map(chat => <div key={chat.id} onClick={() => setSelectedChat(chat.id)} className={`p-3 flex items-center gap-3 cursor-pointer transition-colors
                    ${selectedChat === chat.id ? 'bg-primary/10' : 'hover:bg-primary/5'}`}>
                  <div className="relative">
                    <img src={chat.user.avatar} alt={chat.user.name} className="w-12 h-12 rounded-full" />
                    {chat.user.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium text-white truncate">
                        {chat.user.name}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {chat.messages[chat.messages.length - 1]?.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {chat.messages[chat.messages.length - 1]?.content}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs text-white">
                        {chat.unreadCount}
                      </span>
                    </div>}
                </div>)}
            </div>
          </div>
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedChat ? <>
                {/* Chat Header */}
                <div className="p-4 border-b border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={activeChat?.user.avatar} alt={activeChat?.user.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <h3 className="font-medium text-white">
                        {activeChat?.user.name}
                      </h3>
                      <span className="text-xs text-green-400">
                        {activeChat?.user.isOnline ? 'Active now' : activeChat?.user.lastActive}
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
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {activeChat?.messages.map(message => <div key={message.id} className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[70%] group">
                        {message.image && <img src={message.image} alt="Shared" className="rounded-lg mb-2 max-w-full" />}
                        <div className={`rounded-2xl px-4 py-2 ${message.isMe ? 'bg-primary/20 text-white' : 'bg-gray-800 text-white'}`}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {message.timestamp}
                          </span>
                          <button className={`opacity-0 group-hover:opacity-100 transition-opacity ${message.liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                            <Heart size={14} />
                          </button>
                        </div>
                      </div>
                    </div>)}
                  <div ref={messagesEndRef} />
                </div>
                {/* Message Input */}
                <div className="p-3 border-t border-primary/20">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <button type="button" className="text-primary hover:text-primary/80">
                      <Camera size={20} />
                    </button>
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Message..." className="flex-1 bg-dark/50 border border-primary/20 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary" />
                    <button type="button" className="text-primary hover:text-primary/80">
                      <Smile size={20} />
                    </button>
                    <button type="submit" disabled={!newMessage.trim()} className="text-primary hover:text-primary/80 disabled:opacity-50">
                      <Send size={20} />
                    </button>
                  </form>
                </div>
              </> : <div className="flex-1 flex items-center justify-center text-gray-400">
                Select a chat to start messaging
              </div>}
          </div>
        </div>
      </div>
    </div>;
};