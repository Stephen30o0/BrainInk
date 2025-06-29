import React, { useState, useEffect, useRef } from 'react';

interface Agent {
    name: string;
    character: string;
    bio: string;
    topics: string[];
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'agent';
    timestamp: number;
    action?: string;
    agentName?: string;
}

interface AgentChatProps {
    apiBaseUrl?: string;
    defaultAgent?: string;
    className?: string;
    onMessageSent?: (message: string, agent: string) => void;
    onAgentResponse?: (response: string, action?: string) => void;
}

const AgentChat: React.FC<AgentChatProps> = ({
    apiBaseUrl = 'http://localhost:3001',
    defaultAgent,
    className = '',
    onMessageSent,
    onAgentResponse
}) => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<string | null>(defaultAgent || null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load agents on component mount
    useEffect(() => {
        loadAgents();
    }, []);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-select first agent if none selected
    useEffect(() => {
        if (agents.length > 0 && !selectedAgent) {
            setSelectedAgent(agents[0].name);
        }
    }, [agents, selectedAgent]);

    const loadAgents = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/agents`);
            if (response.ok) {
                const data = await response.json();
                setAgents(data.agents);
                setIsConnected(true);

                // Add welcome message
                addMessage(
                    '👋 Welcome to Brain Ink AI Agents! Select an agent and start chatting.',
                    'agent',
                    { agentName: 'System' }
                );
            }
        } catch (error) {
            console.error('Failed to load agents:', error);
            setIsConnected(false);
            addMessage(
                '❌ Failed to connect to AI agents. Please check if the agent service is running.',
                'agent',
                { agentName: 'System' }
            );
        }
    };

    const addMessage = (text: string, sender: 'user' | 'agent', options: {
        action?: string;
        agentName?: string;
    } = {}) => {
        const message: Message = {
            id: `msg_${Date.now()}_${Math.random()}`,
            text,
            sender,
            timestamp: Date.now(),
            action: options.action,
            agentName: options.agentName || selectedAgent || 'Unknown'
        };

        setMessages(prev => [...prev, message]);
    };

    const sendMessage = async () => {
        if (!selectedAgent || !inputMessage.trim()) return;

        const messageText = inputMessage.trim();
        setInputMessage('');

        // Add user message
        addMessage(messageText, 'user');

        // Trigger callback
        onMessageSent?.(messageText, selectedAgent);

        setIsLoading(true);

        try {
            const response = await fetch(`${apiBaseUrl}/chat/${encodeURIComponent(selectedAgent)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: messageText,
                    userId: `user_${Date.now()}`
                })
            });

            const data = await response.json();

            if (response.ok) {
                addMessage(data.response, 'agent', {
                    action: data.action,
                    agentName: selectedAgent
                });

                // Trigger callback
                onAgentResponse?.(data.response, data.action);
            } else {
                addMessage(`Error: ${data.error}`, 'agent', { agentName: 'System' });
            }
        } catch (error) {
            console.error('Chat error:', error);
            addMessage(
                'Sorry, I encountered an error. Please try again.',
                'agent',
                { agentName: 'System' }
            );
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

    const getAgentEmoji = (agentName: string) => {
        if (agentName.toLowerCase().includes('kana')) return '🇯🇵';
        if (agentName.toLowerCase().includes('squad')) return '👥';
        if (agentName.toLowerCase().includes('progress')) return '📊';
        return '🤖';
    };

    const quickActions = [
        { label: '🇯🇵 Japanese Quiz', message: 'Create a Japanese quiz for me', agent: 'Kana Tutor' },
        { label: '📊 Progress Report', message: 'Show me my learning progress', agent: 'Progress Analyst' },
        { label: '👥 Study Group', message: 'Help me find study partners', agent: 'Squad Coordinator' },
        { label: '🔢 Math Quiz', message: 'Generate 5 math questions', agent: 'Kana Tutor' },
    ];

    const sendQuickMessage = (action: typeof quickActions[0]) => {
        if (agents.find(a => a.name === action.agent)) {
            setSelectedAgent(action.agent);
        }
        setInputMessage(action.message);
        setTimeout(() => sendMessage(), 100);
    };

    return (
        <div className={`agent-chat ${className}`}>
            <style>{`
        .agent-chat {
          display: flex;
          flex-direction: column;
          height: 600px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          overflow: hidden;
        }

        .agent-header {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .agent-selector {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .agent-selector select {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
        }

        .agent-selector select option {
          background: #4f46e5;
          color: white;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${isConnected ? '#10b981' : '#ef4444'};
        }

        .quick-actions {
          padding: 15px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          background: #f8fafc;
        }

        .quick-action {
          padding: 6px 12px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .quick-action:hover {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #fafafa;
        }

        .message {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
        }

        .message.user {
          align-items: flex-end;
        }

        .message.agent {
          align-items: flex-start;
        }

        .message-bubble {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 18px;
          word-wrap: break-word;
          white-space: pre-wrap;
        }

        .message.user .message-bubble {
          background: #4f46e5;
          color: white;
        }

        .message.agent .message-bubble {
          background: white;
          border: 1px solid #e2e8f0;
          color: #374151;
        }

        .message-meta {
          font-size: 11px;
          color: #6b7280;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .input-container {
          padding: 20px;
          border-top: 1px solid #e2e8f0;
          background: white;
        }

        .input-group {
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }

        .message-input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 20px;
          resize: none;
          max-height: 100px;
          font-family: inherit;
          font-size: 14px;
        }

        .message-input:focus {
          outline: none;
          border-color: #4f46e5;
        }

        .send-button {
          padding: 12px 20px;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .send-button:hover:not(:disabled) {
          background: #3730a3;
        }

        .send-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .loading-indicator {
          text-align: center;
          padding: 16px;
          color: #6b7280;
          font-style: italic;
        }
      `}</style>

            {/* Header */}
            <div className="agent-header">
                <div className="agent-selector">
                    <span>{getAgentEmoji(selectedAgent || '')}</span>
                    <select
                        value={selectedAgent || ''}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                    >
                        <option value="">Select Agent</option>
                        {agents.map(agent => (
                            <option key={agent.name} value={agent.name}>
                                {agent.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="connection-status">
                    <div className="status-dot"></div>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                {quickActions.map((action, index) => (
                    <button
                        key={index}
                        className="quick-action"
                        onClick={() => sendQuickMessage(action)}
                    >
                        {action.label}
                    </button>
                ))}
            </div>

            {/* Messages */}
            <div className="messages-container">
                {messages.map(message => (
                    <div key={message.id} className={`message ${message.sender}`}>
                        <div className="message-bubble">
                            {message.text}
                        </div>
                        <div className="message-meta">
                            {getAgentEmoji(message.agentName || '')} {message.agentName}
                            {message.action && ` • ${message.action}`}
                            • {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="loading-indicator">
                        🤖 {selectedAgent} is thinking...
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="input-container">
                <div className="input-group">
                    <textarea
                        className="message-input"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Message ${selectedAgent || 'agent'}...`}
                        disabled={!selectedAgent || isLoading}
                        rows={1}
                    />
                    <button
                        className="send-button"
                        onClick={sendMessage}
                        disabled={!selectedAgent || !inputMessage.trim() || isLoading}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgentChat;
