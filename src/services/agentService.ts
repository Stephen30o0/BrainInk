// /**
//  * Brain Ink Agent Service
//  * Connects to the ElizaOS-style agent backend using BRAININK_AGENT_URL
//  */

// export interface AgentInfo {
//     name: string;
//     status: string;
//     lastActive: string;
//     description?: string;
//     capabilities: string[];
// }

// export interface AgentMessage {
//     type: 'user' | 'agent';
//     content: string;
//     timestamp: string;
//     agent?: string;
//     metadata?: {
//         action?: string;
//         mode?: string;
//         confidence?: number;
//     };
// }

// export interface AgentResponse {
//     success: boolean;
//     agent: string;
//     response: string;
//     metadata: {
//         timestamp: string;
//         action?: string;
//         mode?: string;
//         confidence?: number;
//     };
// }

// export interface ChatRequest {
//     message: string;
//     agentName: string;
//     context?: {
//         conversationId?: string;
//         userId?: string;
//         squadId?: string;
//         subject?: string;
//         action?: string;
//     };
// }

// class AgentService {
//     private readonly AGENT_API_BASE = process.env.BRAININK_AGENT_URL || 'https://elizaos-agent-REPLACE.onrender.com';

//     async healthCheck(): Promise<boolean> {
//         try {
//             const response = await fetch(`${this.AGENT_API_BASE}/health`, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 }
//             });
//             return response.ok;
//         } catch (error) {
//             console.error('Agent health check failed:', error);
//             return false;
//         }
//     }

//     async getAgents(): Promise<AgentInfo[]> {
//         try {
//             const response = await fetch(`${this.AGENT_API_BASE}/agents`, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 }
//             });

//             if (!response.ok) {
//                 throw new Error(`HTTP ${response.status}: ${await response.text()}`);
//             }

//             const data = await response.json();

//             // Transform the agent data to match our interface
//             return data.agents.map((agent: any) => ({
//                 name: agent.name,
//                 status: agent.status,
//                 lastActive: agent.lastActive || new Date().toISOString(),
//                 description: agent.description,
//                 capabilities: agent.capabilities || []
//             }));
//         } catch (error) {
//             console.error('Failed to fetch agents:', error);
//             return this.getFallbackAgents();
//         }
//     }

//     async sendMessage(request: ChatRequest): Promise<AgentResponse> {
//         try {
//             const response = await fetch(`${this.AGENT_API_BASE}/chat/${encodeURIComponent(request.agentName)}`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({
//                     message: request.message,
//                     userId: request.context?.userId || 'anonymous',
//                     context: request.context || {}
//                 })
//             });

//             if (!response.ok) {
//                 throw new Error(`HTTP ${response.status}: ${await response.text()}`);
//             }

//             const data = await response.json();
//             return {
//                 success: true,
//                 agent: request.agentName,
//                 response: data.response,
//                 metadata: {
//                     timestamp: data.timestamp || new Date().toISOString(),
//                     action: data.action,
//                     mode: data.mode,
//                     confidence: data.confidence
//                 }
//             };
//         } catch (error) {
//             console.error('Failed to send message to agent:', error);
//             return this.getFallbackResponse(request);
//         }
//     }

//     // Integration methods for Brain Ink specific features
//     async generateQuiz(subject: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium', questionCount: number = 5): Promise<AgentResponse> {
//         return this.sendMessage({
//             message: `Generate a ${difficulty} difficulty quiz with ${questionCount} questions about ${subject}`,
//             agentName: 'K.A.N.A. Educational Tutor',
//             context: {
//                 subject,
//                 action: 'generate_quiz'
//             }
//         });
//     }

//     async analyzeProgress(userId: string, subject?: string): Promise<AgentResponse> {
//         return this.sendMessage({
//             message: subject ? `Analyze my progress in ${subject}` : 'Analyze my overall learning progress',
//             agentName: 'Learning Progress Analyst',
//             context: {
//                 userId,
//                 subject,
//                 action: 'analyze_progress'
//             }
//         });
//     }

//     async coordinateSquad(squadId: string, action: 'status' | 'find_partners' | 'suggest_activity', subject?: string): Promise<AgentResponse> {
//         let message = '';
//         switch (action) {
//             case 'status':
//                 message = 'How does my squad look like?';
//                 break;
//             case 'find_partners':
//                 message = subject ? `Help me find study partners for ${subject}` : 'Help me find study partners';
//                 break;
//             case 'suggest_activity':
//                 message = subject ? `Suggest a squad activity for ${subject}` : 'Suggest a squad learning activity';
//                 break;
//         }

//         return this.sendMessage({
//             message,
//             agentName: 'Squad Learning Coordinator',
//             context: {
//                 squadId,
//                 subject,
//                 action: 'coordinate_squad'
//             }
//         });
//     }

//     // Fallback methods when agents are not available
//     private getFallbackAgents(): AgentInfo[] {
//         return [
//             {
//                 name: 'K.A.N.A. Educational Tutor',
//                 status: 'offline',
//                 lastActive: new Date().toISOString(),
//                 description: 'Primary educational AI assistant (offline)',
//                 capabilities: ['quiz_generation', 'tutoring', 'subject_help']
//             },
//             {
//                 name: 'Learning Progress Analyst',
//                 status: 'offline',
//                 lastActive: new Date().toISOString(),
//                 description: 'Learning analytics and progress tracking (offline)',
//                 capabilities: ['progress_analysis', 'performance_insights', 'recommendations']
//             },
//             {
//                 name: 'Squad Learning Coordinator',
//                 status: 'offline',
//                 lastActive: new Date().toISOString(),
//                 description: 'Study group coordination and team learning (offline)',
//                 capabilities: ['squad_coordination', 'partner_matching', 'team_activities']
//             }
//         ];
//     }

//     private getFallbackResponse(request: ChatRequest): AgentResponse {
//         const fallbackResponses = {
//             'K.A.N.A. Educational Tutor': 'I apologize, but the AI tutor system is currently offline. Please try again later or use the traditional study materials.',
//             'Learning Progress Analyst': 'The progress analysis system is currently unavailable. Your learning data is still being tracked and will be available when the system comes back online.',
//             'Squad Learning Coordinator': 'The squad coordination system is temporarily offline. You can still interact with your squad through the messaging system.'
//         };

//         return {
//             success: false,
//             agent: request.agentName,
//             response: fallbackResponses[request.agentName as keyof typeof fallbackResponses] || 'This agent is currently unavailable.',
//             metadata: {
//                 timestamp: new Date().toISOString(),
//                 mode: 'fallback'
//             }
//         };
//     }

//     // Helper method to check if agents are available
//     async isAgentSystemAvailable(): Promise<boolean> {
//         return await this.healthCheck();
//     }

//     // Method to get agent capabilities for UI purposes
//     getAgentCapabilities(): Record<string, string[]> {
//         return {
//             'K.A.N.A. Educational Tutor': [
//                 'Generate custom quizzes',
//                 'Provide subject tutoring',
//                 'Answer academic questions',
//                 'Create study plans',
//                 'Explain complex concepts'
//             ],
//             'Learning Progress Analyst': [
//                 'Analyze learning patterns',
//                 'Track progress over time',
//                 'Identify knowledge gaps',
//                 'Suggest improvement areas',
//                 'Generate performance reports'
//             ],
//             'Squad Learning Coordinator': [
//                 'Form study groups',
//                 'Match learning partners',
//                 'Coordinate group activities',
//                 'Suggest team challenges',
//                 'Manage squad dynamics'
//             ]
//         };
//     }
// }

// export const agentService = new AgentService();
