import { useState, useEffect, useCallback } from 'react';
import { realAgentService } from '../services/realAgentService';

// Define interfaces needed for the hook
interface AgentInfo {
    name: string;
    status: string;
    capabilities: string[];
}

interface AgentMessage {
    id: string;
    sender: 'user' | 'agent';
    content: string;
    timestamp: Date;
    agentName?: string;
}

interface AgentResponse {
    success: boolean;
    message: string;
    data?: any;
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

    // Specialized agent methods
    generateQuiz: (subject: string, difficulty?: 'easy' | 'medium' | 'hard', questionCount?: number, squadId?: string) => Promise<AgentResponse>;
    analyzeProgress: (subject?: string) => Promise<AgentResponse>;
    coordinateSquad: (squadId?: string, action?: 'status' | 'find_partners' | 'suggest_activity', subject?: string) => Promise<AgentResponse>;
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
            const isAvailable = await realAgentService.isAgentSystemOnline();
            if (isAvailable) {
                const agentList = await realAgentService.getAvailableAgents();
                setAgents(agentList);
                setSystemStatus('online');
                setIsConnected(true);
            } else {
                setSystemStatus('offline');
                setIsConnected(false);
                // Fallback agents when offline
                setAgents([
                    { name: 'K.A.N.A. Educational Tutor', status: 'offline', capabilities: ['Teaching', 'Q&A'] },
                    { name: 'Learning Progress Analyst', status: 'offline', capabilities: ['Analysis'] },
                    { name: 'Squad Learning Coordinator', status: 'offline', capabilities: ['Coordination'] }
                ]);
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
            id: `user-${Date.now()}`,
            sender: 'user',
            content: message,
            timestamp: new Date()
        };
        setConversation(prev => [...prev, userMessage]);

        try {
            const response = await realAgentService.sendMessage(message, selectedAgent, context);

            // Add agent response to conversation
            const agentMessage: AgentMessage = {
                id: `agent-${Date.now()}`,
                sender: 'agent',
                content: response,
                timestamp: new Date(),
                agentName: selectedAgent
            };
            setConversation(prev => [...prev, agentMessage]);

            return {
                success: true,
                message: response,
                data: { agentName: selectedAgent }
            };
        } catch (error) {
            console.error('Failed to send message:', error);

            // Add error message to conversation
            const errorMessage: AgentMessage = {
                id: `error-${Date.now()}`,
                sender: 'agent',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
                agentName: selectedAgent
            };
            setConversation(prev => [...prev, errorMessage]);

            return {
                success: false,
                message: 'Failed to send message',
                data: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
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

    // Specialized agent methods
    const generateQuiz = useCallback(async (
        subject: string,
        difficulty: 'easy' | 'medium' | 'hard' = 'medium',
        questionCount: number = 5,
        squadId?: string
    ): Promise<AgentResponse> => {
        const previousAgent = selectedAgent;
        setSelectedAgent('K.A.N.A. Educational Tutor');

        try {
            // If squadId is provided, use generateSquadQuiz, otherwise use sendMessage for a general quiz
            let response: string;
            if (squadId) {
                response = await realAgentService.generateSquadQuiz(squadId, subject, difficulty);
            } else {
                response = await realAgentService.sendMessage(
                    `Generate a ${difficulty} difficulty quiz with ${questionCount} questions about ${subject}`,
                    'K.A.N.A. Educational Tutor'
                );
            }

            // Add to conversation
            const userMessage: AgentMessage = {
                id: `user-${Date.now()}`,
                sender: 'user',
                content: `Generate a ${difficulty} difficulty quiz with ${questionCount} questions about ${subject}`,
                timestamp: new Date()
            };

            const agentMessage: AgentMessage = {
                id: `agent-${Date.now()}`,
                sender: 'agent',
                content: response,
                timestamp: new Date(),
                agentName: 'K.A.N.A. Educational Tutor'
            };

            setConversation(prev => [...prev, userMessage, agentMessage]);

            return {
                success: true,
                message: response,
                data: { subject, difficulty, questionCount }
            };
        } catch (error) {
            console.error('Failed to generate quiz:', error);
            return {
                success: false,
                message: 'Failed to generate quiz',
                data: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
        } finally {
            setSelectedAgent(previousAgent);
        }
    }, [selectedAgent]);

    const analyzeProgress = useCallback(async (subject?: string): Promise<AgentResponse> => {
        const previousAgent = selectedAgent;
        setSelectedAgent('Learning Progress Analyst');

        try {
            const response = await realAgentService.analyzeUserProgress(undefined, subject);

            // Add to conversation
            const userMessage: AgentMessage = {
                id: `user-${Date.now()}`,
                sender: 'user',
                content: subject ? `Analyze my progress in ${subject}` : 'Analyze my overall learning progress',
                timestamp: new Date()
            };

            const agentMessage: AgentMessage = {
                id: `agent-${Date.now()}`,
                sender: 'agent',
                content: response,
                timestamp: new Date(),
                agentName: 'Learning Progress Analyst'
            };

            setConversation(prev => [...prev, userMessage, agentMessage]);

            return {
                success: true,
                message: response,
                data: { subject }
            };
        } catch (error) {
            console.error('Failed to analyze progress:', error);
            return {
                success: false,
                message: 'Failed to analyze progress',
                data: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
        } finally {
            setSelectedAgent(previousAgent);
        }
    }, [selectedAgent]);

    const coordinateSquad = useCallback(async (
        squadId?: string,
        action: 'status' | 'find_partners' | 'suggest_activity' = 'status',
        subject?: string
    ): Promise<AgentResponse> => {
        const previousAgent = selectedAgent;
        setSelectedAgent('Squad Learning Coordinator');

        try {
            // Map actions to realAgentService activityTypes
            let activityType: 'study_session' | 'challenge' | 'progress_check' = 'progress_check';
            let userMessage = '';

            switch (action) {
                case 'status':
                    activityType = 'progress_check';
                    userMessage = 'How does my squad look like?';
                    break;
                case 'find_partners':
                    activityType = 'study_session';
                    userMessage = subject ? `Help me find study partners for ${subject}` : 'Help me find study partners';
                    break;
                case 'suggest_activity':
                    activityType = 'challenge';
                    userMessage = subject ? `Suggest a squad activity for ${subject}` : 'Suggest a squad learning activity';
                    break;
            }

            const response = await realAgentService.coordinateSquadActivity(squadId || 'default', activityType);

            // Add to conversation
            const userMsg: AgentMessage = {
                id: `user-${Date.now()}`,
                sender: 'user',
                content: userMessage,
                timestamp: new Date()
            };

            const agentMsg: AgentMessage = {
                id: `agent-${Date.now()}`,
                sender: 'agent',
                content: response,
                timestamp: new Date(),
                agentName: 'Squad Learning Coordinator'
            };

            setConversation(prev => [...prev, userMsg, agentMsg]);

            return {
                success: true,
                message: response,
                data: { squadId, action, subject }
            };
        } catch (error) {
            console.error('Failed to coordinate squad:', error);
            return {
                success: false,
                message: 'Failed to coordinate squad',
                data: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
        } finally {
            setSelectedAgent(previousAgent);
        }
    }, [selectedAgent]);

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
        reconnect,

        // Specialized methods
        generateQuiz,
        analyzeProgress,
        coordinateSquad
    };
};
