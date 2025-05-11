import React, { useEffect, useState, useRef } from 'react';
import { Search, Phone, Video, Image as ImageIcon, Smile, Send, Mic, Paperclip, MoreVertical, X, ChevronLeft, Settings } from 'lucide-react';
interface Contact {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastMessage?: string;
  lastActive?: string;
  unreadCount?: number;
}
interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: string;
  type: 'text' | 'image' | 'voice';
  imageUrl?: string;
  voiceUrl?: string;
}
export const MessagingPage = () => {
  const [contacts] = useState<Contact[]>([{
    id: '1',
    name: 'John Doe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    status: 'online',
    lastMessage: 'Hey, want to study together?',
    unreadCount: 2
  }, {
    id: '2',
    name: 'Jane Doe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
    status: 'offline',
    lastMessage: 'Thanks for the help!',
    lastActive: '2h ago'
  }, {
    id: '3',
    name: 'Johnny Doe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
    status: 'away',
    lastMessage: 'See you in the arena!',
    lastActive: '5m ago'
  },
  // Add more fake contacts
  {
    id: '4',
    name: 'Jonathan Doe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
    status: 'online',
    lastMessage: 'Ready for the quiz?'
  }, {
    id: '5',
    name: 'Jack Doe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
    status: 'online',
    lastMessage: 'Great match!'
  }]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      sender: 'me',
      type: 'text'
    };
    setMessages([...messages, newMessage]);
    setMessage('');
  };
  const handleStartRecording = () => {
    setIsRecording(true);
    // Add voice recording logic here
  };
  const handleStopRecording = () => {
    setIsRecording(false);
    // Add voice recording stop logic here
  };
  return <div className="min-h-screen bg-dark flex">
      {/* Contacts Sidebar */}
      <div className="w-80 border-r border-primary/20 flex flex-col">
        <div className="p-4 border-b border-primary/20 flex items-center justify-between">
          <h1 className="font-pixel text-primary text-sm">Messages</h1>
          <Settings size={20} className="text-primary cursor-pointer" />
        </div>
        {/* Search */}
        <div className="p-4 border-b border-primary/20">
          <div className="relative">
            <input type="text" placeholder="Search contacts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-dark/50 border border-primary/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary" />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {contacts.filter(contact => contact.name.toLowerCase().includes(searchQuery.toLowerCase())).map(contact => <div key={contact.id} onClick={() => setSelectedContact(contact)} className={`p-4 flex items-center gap-3 cursor-pointer transition-colors border-b border-primary/10
                  ${selectedContact?.id === contact.id ? 'bg-primary/10' : 'hover:bg-primary/5'}`}>
                <div className="relative">
                  <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full" />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-dark
                    ${contact.status === 'online' ? 'bg-green-500' : contact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-medium text-white truncate">
                      {contact.name}
                    </h3>
                    {contact.lastActive && <span className="text-xs text-gray-400">
                        {contact.lastActive}
                      </span>}
                  </div>
                  {contact.lastMessage && <p className="text-sm text-gray-400 truncate">
                      {contact.lastMessage}
                    </p>}
                </div>
                {contact.unreadCount && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs text-white">
                      {contact.unreadCount}
                    </span>
                  </div>}
              </div>)}
        </div>
      </div>
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? <>
            {/* Chat Header */}
            <div className="p-4 border-b border-primary/20 flex items-center justify-between bg-dark/90">
              <div className="flex items-center gap-3">
                <ChevronLeft size={24} className="text-primary cursor-pointer lg:hidden" onClick={() => setSelectedContact(null)} />
                <img src={selectedContact.avatar} alt={selectedContact.name} className="w-10 h-10 rounded-full" />
                <div>
                  <h2 className="font-medium text-white">
                    {selectedContact.name}
                  </h2>
                  <span className="text-xs text-green-400">
                    {selectedContact.status === 'online' ? 'Active now' : selectedContact.status === 'away' ? 'Away' : 'Offline'}
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
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${msg.sender === 'me' ? 'bg-primary/20' : 'bg-gray-800'} rounded-lg p-3`}>
                    {msg.type === 'text' && <p className="text-white">{msg.content}</p>}
                    {msg.type === 'image' && msg.imageUrl && <img src={msg.imageUrl} alt="Shared" className="rounded-lg max-w-full" />}
                    {msg.type === 'voice' && msg.voiceUrl && <div className="flex items-center gap-2">
                        <div className="w-32 h-1 bg-primary/30 rounded-full" />
                        <span className="text-xs text-gray-400">0:00</span>
                      </div>}
                    <span className="text-xs text-gray-400 mt-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>)}
              <div ref={messagesEndRef} />
            </div>
            {/* Message Input */}
            <div className="p-4 border-t border-primary/20 bg-dark/90">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <button type="button" className="text-primary hover:text-primary/80">
                  <Paperclip size={20} />
                </button>
                <button type="button" className="text-primary hover:text-primary/80">
                  <ImageIcon size={20} />
                </button>
                <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-dark/50 border border-primary/20 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary" />
                <button type="button" className="text-primary hover:text-primary/80" onMouseDown={handleStartRecording} onMouseUp={handleStopRecording}>
                  <Mic size={20} className={isRecording ? 'text-red-500' : ''} />
                </button>
                <button type="button" className="text-primary hover:text-primary/80">
                  <Smile size={20} />
                </button>
                <button type="submit" disabled={!message.trim()} className="text-primary hover:text-primary/80 disabled:opacity-50">
                  <Send size={20} />
                </button>
              </form>
            </div>
          </> : <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a contact to start messaging
          </div>}
      </div>
    </div>;
};