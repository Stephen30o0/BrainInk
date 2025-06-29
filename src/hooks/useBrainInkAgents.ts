import { useState, useEffect, useCallback } from 'react';

// Define interfaces locally since we removed the agentService
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

interface AgentResponse {
    success: boolean;
    agent: string;
    response: string;
    metadata: {
        timestamp: string;
        action?: string;
        mode?: string;
        confidence?: number;
    };
}

interface UseBrainInkAgentsOptions {
    autoConnect?: boolean;
    defaultAgent?: string;
}

interface UseBrainInkAgentsReturn {
    agents: AgentInfo[];
    selectedAgent: string;
    conversation: AgentMessage[];
    isLoading: boolean;
    isConnected: boolean;
    systemStatus: 'checking' | 'online' | 'offline';

    // Actions
    setSelectedAgent: (agentName: string) => void;
    sendMessage: (message: string, context?: any) => Promise<AgentResponse>;
    clearConversation: () => void;
    reconnect: () => Promise<void>;
}

export const useBrainInkAgents = (options: UseBrainInkAgentsOptions = {}): UseBrainInkAgentsReturn => {
    const { autoConnect = true, defaultAgent = 'K.A.N.A. Educational Tutor' } = options;

    const [agents, setAgents] = useState<AgentInfo[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<string>(defaultAgent);
    const [conversation, setConversation] = useState<AgentMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [systemStatus, setSystemStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    const loadAgentStatus = useCallback(async () => {
        setSystemStatus('checking');
        try {
            // Check the real agent backend directly
            const response = await fetch('http://localhost:3001/health');
            if (response.ok) {
                setSystemStatus('online');
                setIsConnected(true);

                // Set real agents from the backend
                const agentsResponse = await fetch('http://localhost:3001/agents');
                if (agentsResponse.ok) {
                    const data = await agentsResponse.json();
                    setAgents(data.agents || []);
                } else {
                    // Default agents if endpoint fails
                    setAgents([
                        {
                            name: 'K.A.N.A. Educational Tutor',
                            status: 'online',
                            lastActive: new Date().toISOString(),
                            description: 'Educational AI assistant with real Kana AI integration',
                            capabilities: ['quiz_generation', 'tutoring', 'subject_help']
                        },
                        {
                            name: 'Learning Progress Analyst',
                            status: 'online',
                            lastActive: new Date().toISOString(),
                            description: 'Real data analysis and progress tracking',
                            capabilities: ['progress_analysis', 'performance_insights', 'recommendations']
                        },
                        {
                            name: 'Squad Learning Coordinator',
                            status: 'online',
                            lastActive: new Date().toISOString(),
                            description: 'Squad coordination with real database integration',
                            capabilities: ['squad_coordination', 'partner_matching', 'team_activities']
                        }
                    ]);
                }
            } else {
                setSystemStatus('offline');
                setIsConnected(false);
                setAgents([]);
            }
        } catch (error) {
            console.error('Failed to load agent status:', error);
            setSystemStatus('offline');
            setIsConnected(false);
            setAgents([]);
        }
    }, []);

    useEffect(() => {
        if (autoConnect) {
            loadAgentStatus();
        }
    }, [autoConnect, loadAgentStatus]);

    const sendMessage = useCallback(async (message: string, context?: any): Promise<AgentResponse> => {
        setIsLoading(true);

        // Add user message to conversation
        const userMessage: AgentMessage = {
            type: 'user',
            content: message,
            timestamp: new Date().toISOString()
        };
        setConversation(prev => [...prev, userMessage]);

        try {
            // Use direct API call instead of agentService
            const response = await fetch(`http://localhost:3001/chat/${encodeURIComponent(selectedAgent)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    userId: 'current-user',
                    squadId: context?.squadId,
                    conversationId: context?.conversationId || 'main',
                    ...context
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();

            const agentResponse: AgentResponse = {
                success: true,
                agent: selectedAgent,
                response: data.response || data.content || 'No response',
                metadata: {
                    timestamp: new Date().toISOString(),
                    action: data.action,
                    mode: 'real_api'
                }
            };

            // Add agent response to conversation
            const agentMessage: AgentMessage = {
                type: 'agent',
                content: agentResponse.response,
                timestamp: agentResponse.metadata.timestamp,
                agent: agentResponse.agent,
                metadata: agentResponse.metadata
            };
            setConversation(prev => [...prev, agentMessage]);

            return agentResponse;
        } catch (error) {
            console.error('Failed to send message:', error);

            // Add error message to conversation
            const errorMessage: AgentMessage = {
                type: 'agent',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date().toISOString(),
                agent: selectedAgent,
                metadata: { mode: 'error' }
            };
            setConversation(prev => [...prev, errorMessage]);

            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [selectedAgent]);

    const clearConversation = useCallback(() => {
        setConversation([]);
    }, []);

    const reconnect = useCallback(async () => {
        await loadAgentStatus();
    }, [loadAgentStatus]);

    return {
        agents,
        selectedAgent,
        conversation,
        isLoading,
        isConnected,
        systemStatus,

        // Actions
        setSelectedAgent,
        sendMessage,
        clearConversation,
        reconnect
    };
};
