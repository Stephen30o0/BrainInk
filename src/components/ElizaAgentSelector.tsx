import React, { useState, useEffect } from 'react';
import { Brain, Users, BarChart3, Bot, Loader, CheckCircle, XCircle, Send } from 'lucide-react';

// Define interfaces locally since we're not using the agent service anymore
interface AgentInfo {
    name: string;
    status: string;
    lastActive: string;
    description?: string;
    capabilities: string[];
}

interface AgentMessage {
    type: 'user' | 'agent';
    content: string;
    timestamp: string;
    agent?: string;
    metadata?: {
        action?: string;
        mode?: string;
        confidence?: number;
    };
}

export const ElizaAgentSelector: React.FC = () => {
    const [selectedAgent, setSelectedAgent] = useState<string>('K.A.N.A. Educational Tutor');
    const [agents, setAgents] = useState<AgentInfo[]>([]);
    const [message, setMessage] = useState('');
    const [conversation, setConversation] = useState<AgentMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [agentSystemStatus, setAgentSystemStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    const agentIcons = {
        'K.A.N.A. Educational Tutor': <Brain className="w-5 h-5" />,
        'Squad Learning Coordinator': <Users className="w-5 h-5" />,
        'Learning Progress Analyst': <BarChart3 className="w-5 h-5" />
    };

    useEffect(() => {
        loadAgentStatus();
    }, []);

    const loadAgentStatus = async () => {
        setAgentSystemStatus('checking');
        try {
            // Check the real agent backend directly
            const response = await fetch('http://localhost:3001/health');
            if (response.ok) {
                setAgentSystemStatus('online');

                // Set real agents from the backend
                setAgents([
                    {
                        name: 'K.A.N.A. Educational Tutor',
                        status: 'active',
                        lastActive: new Date().toISOString(),
                        description: 'AI tutor for educational assistance',
                        capabilities: ['quiz_generation', 'tutoring', 'subject_help']
                    },
                    {
                        name: 'Learning Progress Analyst',
                        status: 'active',
                        lastActive: new Date().toISOString(),
                        description: 'Analyzes learning progress and provides insights',
                        capabilities: ['progress_analysis', 'performance_insights', 'recommendations']
                    },
                    {
                        name: 'Squad Learning Coordinator',
                        status: 'active',
                        lastActive: new Date().toISOString(),
                        description: 'Coordinates squad activities and learning',
                        capabilities: ['squad_coordination', 'partner_matching', 'team_activities']
                    }
                ]);
            } else {
                setAgentSystemStatus('offline');
                setAgents([]);
            }
        } catch (error) {
            console.error('Failed to load agent status:', error);
            setAgentSystemStatus('offline');
            setAgents([]);
        }
    };

    const sendMessage = async () => {
        if (!message.trim()) return;

        setIsLoading(true);
        const userMessage = message;
        setMessage('');

        // Add user message to conversation
        setConversation(prev => [...prev, {
            type: 'user',
            content: userMessage,
            timestamp: new Date().toISOString()
        }]);

        try {
            // Call the real agent backend directly
            const response = await fetch(`http://localhost:3001/chat/${encodeURIComponent(selectedAgent)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userMessage,
                    userId: 'current-user',
                    conversationId: `main_chat_${Date.now()}`
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();

            setConversation(prev => [...prev, {
                type: 'agent',
                content: data.response || 'No response received',
                timestamp: new Date().toISOString(),
                agent: selectedAgent,
                metadata: {
                    mode: 'real_backend'
                }
            }]);
        } catch (error) {
            console.error('Failed to send message:', error);
            setConversation(prev => [...prev, {
                type: 'agent',
                content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure the agent backend is running on port 3001.`,
                timestamp: new Date().toISOString(),
                agent: selectedAgent,
                metadata: { mode: 'error' }
            }]);
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
        switch (agentSystemStatus) {
            case 'checking':
                return <Loader className="w-4 h-4 animate-spin text-yellow-500" />;
            case 'online':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'offline':
                return <XCircle className="w-4 h-4 text-red-500" />;
        }
    };

    const getStatusText = () => {
        switch (agentSystemStatus) {
            case 'checking':
                return 'Checking agent status...';
            case 'online':
                return 'Agent system online';
            case 'offline':
                return 'Agent system offline - using fallback mode';
        }
    };

    return (
        <div className="h-full bg-[#0a0e17] text-white flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bot className="w-6 h-6" />
                        <h2 className="text-xl font-bold">Brain Ink AI Agents</h2>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        {getStatusIndicator()}
                        <span>{getStatusText()}</span>
                    </div>
                </div>
            </div>

            {/* Agent Selector */}
            <div className="p-4 border-b border-gray-700">
                <div className="grid grid-cols-3 gap-2">
                    {Object.entries(agentIcons).map(([agentName, icon]) => {
                        const agent = agents.find(a => a.name === agentName);
                        const isSelected = selectedAgent === agentName;
                        const isOnline = agent?.status === 'active';

                        return (
                            <button
                                key={agentName}
                                onClick={() => setSelectedAgent(agentName)}
                                className={`p-3 rounded-lg border transition-all duration-200 text-left ${isSelected
                                    ? 'bg-purple-600 border-purple-400 text-white'
                                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    {icon}
                                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
                                </div>
                                <div className="text-xs font-medium truncate">{agentName}</div>
                                <div className="text-xs opacity-70 truncate">
                                    {agent?.description || 'Educational AI Assistant'}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Conversation Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {conversation.length === 0 ? (
                        <div className="text-center text-gray-400 mt-8">
                            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Start a conversation with {selectedAgent}</p>
                            <div className="mt-4 text-sm">
                                <p>Try asking:</p>
                                <ul className="list-disc list-inside mt-2 space-y-1 text-left max-w-md mx-auto">
                                    {selectedAgent === 'K.A.N.A. Educational Tutor' && (
                                        <>
                                            <li>"Generate 5 math questions, medium difficulty"</li>
                                            <li>"Explain quantum physics in simple terms"</li>
                                            <li>"Create a Japanese quiz for me"</li>
                                        </>
                                    )}
                                    {selectedAgent === 'Learning Progress Analyst' && (
                                        <>
                                            <li>"Show me my learning progress"</li>
                                            <li>"What subjects am I strongest in?"</li>
                                            <li>"Analyze my performance trends"</li>
                                        </>
                                    )}
                                    {selectedAgent === 'Squad Learning Coordinator' && (
                                        <>
                                            <li>"How does my squad look like?"</li>
                                            <li>"Help me find study partners for chemistry"</li>
                                            <li>"Suggest a group study activity"</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        conversation.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-lg ${msg.type === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-100'
                                        }`}
                                >
                                    {msg.type === 'agent' && (
                                        <div className="flex items-center gap-2 mb-2 text-xs opacity-70">
                                            {agentIcons[msg.agent as keyof typeof agentIcons]}
                                            <span>{msg.agent}</span>
                                            {msg.metadata?.mode && (
                                                <span className="px-1 py-0.5 bg-gray-600 rounded text-xs">
                                                    {msg.metadata.mode}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                    <div className="text-xs opacity-50 mt-1">
                                        {new Date(msg.timestamp).toLocaleTimeString()}
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
                                    <span>{selectedAgent} is thinking...</span>
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
                            placeholder={`Ask ${selectedAgent} a question...`}
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
