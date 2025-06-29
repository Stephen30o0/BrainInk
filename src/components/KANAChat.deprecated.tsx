import React, { useState, useEffect } from 'react';
import { Brain, Loader, CheckCircle, XCircle, Send } from 'lucide-react';
import { realAgentService } from '../services/realAgentService';

// Define interfaces needed for this component
interface ChatMessage {
    id: string;
    sender: 'user' | 'agent';
    content: string;
    timestamp: Date;
}

export const KANAChat: React.FC = () => {
    const [message, setMessage] = useState('');
    const [conversation, setConversation] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [systemStatus, setSystemStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    useEffect(() => {
        checkSystemStatus();
    }, []);

    const checkSystemStatus = async () => {
        setSystemStatus('checking');
        try {
            const isOnline = await realAgentService.isAgentSystemOnline();
            setSystemStatus(isOnline ? 'online' : 'offline');
        } catch (error) {
            console.error('Failed to check system status:', error);
            setSystemStatus('offline');
        }
    };

    const sendMessage = async () => {
        if (!message.trim()) return;

        setIsLoading(true);
        const userMessage = message;
        setMessage('');

        // Add user message to conversation
        const newUserMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            sender: 'user',
            content: userMessage,
            timestamp: new Date()
        };
        setConversation(prev => [...prev, newUserMessage]);

        try {
            const response = await realAgentService.sendMessage(userMessage, 'K.A.N.A. Educational Tutor');

            // Add K.A.N.A. response to conversation
            const agentMessage: ChatMessage = {
                id: `agent-${Date.now()}`,
                sender: 'agent',
                content: response,
                timestamp: new Date()
            };
            setConversation(prev => [...prev, agentMessage]);
        } catch (error) {
            console.error('Failed to send message:', error);

            // Add error message to conversation
            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                sender: 'agent',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            };
            setConversation(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const getStatusIndicator = () => {
        switch (systemStatus) {
            case 'checking':
                return <Loader className="w-4 h-4 animate-spin text-yellow-500" />;
            case 'online':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'offline':
                return <XCircle className="w-4 h-4 text-red-500" />;
        }
    };

    const getStatusText = () => {
        switch (systemStatus) {
            case 'checking':
                return 'Connecting to K.A.N.A...';
            case 'online':
                return 'K.A.N.A. is online';
            case 'offline':
                return 'K.A.N.A. is offline';
        }
    };

    return (
        <div className="h-full bg-[#0a0e17] text-white flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Brain className="w-8 h-8" />
                        <div>
                            <h2 className="text-xl font-bold">K.A.N.A. Lab</h2>
                            <p className="text-sm opacity-90">Knowledge & Neural Assistant</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        {getStatusIndicator()}
                        <span>{getStatusText()}</span>
                    </div>
                </div>
            </div>

            {/* Conversation Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {conversation.length === 0 ? (
                        <div className="text-center text-gray-400 mt-8">
                            <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">Welcome to K.A.N.A. Lab</h3>
                            <p className="mb-6">Your Knowledge & Neural Assistant is ready to help!</p>

                            <div className="text-left max-w-md mx-auto">
                                <p className="font-medium mb-3">Try asking K.A.N.A.:</p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-400">•</span>
                                        <span>"Generate 5 math questions, medium difficulty"</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-400">•</span>
                                        <span>"Explain quantum physics in simple terms"</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-400">•</span>
                                        <span>"Create a Japanese quiz for me"</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-400">•</span>
                                        <span>"Help me study chemistry"</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-400">•</span>
                                        <span>"What's my learning progress?"</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        conversation.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-lg ${msg.sender === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-100'
                                        }`}
                                >
                                    {msg.sender === 'agent' && (
                                        <div className="flex items-center gap-2 mb-2 text-xs opacity-70">
                                            <Brain className="w-4 h-4" />
                                            <span>K.A.N.A.</span>
                                        </div>
                                    )}
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                    <div className="text-xs opacity-50 mt-1">
                                        {msg.timestamp.toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-700 text-gray-100 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Loader className="w-4 h-4 animate-spin" />
                                    <span>K.A.N.A. is thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-700">
                    <div className="flex gap-2">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask K.A.N.A. anything about learning, quizzes, or your progress..."
                            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-purple-500"
                            rows={2}
                            disabled={isLoading}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={isLoading || !message.trim()}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
