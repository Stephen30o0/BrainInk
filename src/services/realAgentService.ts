/**
 * Real Agent Service with Database Integration
 * Connects to Brain Ink's actual backend services and database
 */

interface DatabaseConfig {
    connectionString: string;
    supabaseUrl: string;
    supabaseKey: string;
}

interface UserData {
    id: number;
    username: string;
    total_xp: number;
    tournaments_won: number;
    tournaments_participated: number;
    favorite_subjects?: string[];
    squad_id?: string;
}

interface SquadData {
    id: string;
    name: string;
    emoji: string;
    description?: string;
    creator_id: number;
    members: Array<{
        id: number;
        username: string;
        weekly_xp: number;
        total_xp: number;
        role: string;
    }>;
    subject_focus?: string[];
    weekly_xp: number;
    total_xp: number;
    rank: number;
}

class RealAgentService {
    private readonly AGENT_API_BASE = import.meta.env.VITE_AGENT_API_BASE_URL || 'http://localhost:3001';
    private readonly SQUAD_API_BASE = 'https://brainink-backend-freinds-micro.onrender.com/squads';
    private readonly KANA_API_BASE = import.meta.env.VITE_KANA_API_BASE_URL || 'http://localhost:10000/api/kana';
    private readonly API_KEY = import.meta.env.VITE_AGENT_API_KEY || 'brainink_agent_secure_key_2025';

    private getAuthHeaders(): HeadersInit {
        const token = localStorage.getItem('access_token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Agent-Key': this.API_KEY
        };
    }

    private getUserId(): number | null {
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
            console.error('Error decoding token:', error);
            return null;
        }
    }

    // Agent System Health Check
    async isAgentSystemOnline(): Promise<boolean> {
        try {
            const response = await fetch(`${this.AGENT_API_BASE}/health`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            return response.ok;
        } catch (error) {
            console.error('Agent system health check failed:', error);
            return false;
        }
    }

    // Get real user data from database
    async getUserData(userId?: number): Promise<UserData | null> {
        try {
            const targetUserId = userId || this.getUserId();
            if (!targetUserId) return null;

            // This would connect to your actual user profile API
            const response = await fetch(`${this.SQUAD_API_BASE}/../user/${targetUserId}/profile`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch user data: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    }

    // Get real squad data from database
    async getSquadData(squadId: string): Promise<SquadData | null> {
        try {
            const response = await fetch(`${this.SQUAD_API_BASE}/squad/${squadId}`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch squad data: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching squad data:', error);
            return null;
        }
    }

    // Get user's squad memberships
    async getUserSquads(userId?: number): Promise<SquadData[]> {
        try {
            const targetUserId = userId || this.getUserId();
            if (!targetUserId) return [];

            const response = await fetch(`${this.SQUAD_API_BASE}/user/${targetUserId}/squads`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch user squads: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching user squads:', error);
            return [];
        }
    }

    // REAL AGENT INTEGRATIONS WITH DATABASE DATA

    // Squad Analysis with real data
    async analyzeSquadPerformance(squadId: string): Promise<string> {
        try {
            const squadData = await this.getSquadData(squadId);
            if (!squadData) {
                return "I couldn't find data for this squad. Please check the squad ID.";
            }

            // Send real squad data to the agent
            const agentResponse = await fetch(`${this.AGENT_API_BASE}/chat/Squad Learning Coordinator`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    message: `Analyze this squad's performance and provide insights`,
                    userId: this.getUserId()?.toString(),
                    context: {
                        action: 'analyze_squad',
                        squadData: {
                            name: squadData.name,
                            totalMembers: squadData.members.length,
                            weeklyXP: squadData.weekly_xp,
                            totalXP: squadData.total_xp,
                            rank: squadData.rank,
                            subjectFocus: squadData.subject_focus,
                            topPerformers: squadData.members
                                .sort((a, b) => b.weekly_xp - a.weekly_xp)
                                .slice(0, 3)
                                .map(m => ({ username: m.username, weekly_xp: m.weekly_xp })),
                            averageXP: squadData.members.length > 0
                                ? Math.round(squadData.members.reduce((sum, m) => sum + m.weekly_xp, 0) / squadData.members.length)
                                : 0
                        }
                    }
                })
            });

            if (!agentResponse.ok) {
                throw new Error(`Agent response failed: ${agentResponse.status}`);
            }

            const result = await agentResponse.json();
            return result.response || "Squad analysis completed, but no specific insights were generated.";
        } catch (error) {
            console.error('Error analyzing squad performance:', error);
            return `I encountered an error while analyzing the squad: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }

    // Progress Analysis with real user data
    async analyzeUserProgress(userId?: number, subject?: string): Promise<string> {
        try {
            const targetUserId = userId || this.getUserId();
            if (!targetUserId) {
                return "I need you to be logged in to analyze your progress.";
            }

            const userData = await this.getUserData(targetUserId);
            if (!userData) {
                return "I couldn't find your learning data. Please make sure you have some activity recorded.";
            }

            // Get user's squads for additional context
            const userSquads = await this.getUserSquads(targetUserId);

            const agentResponse = await fetch(`${this.AGENT_API_BASE}/chat/Learning Progress Analyst`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    message: subject
                        ? `Analyze my progress in ${subject}`
                        : 'Analyze my overall learning progress',
                    userId: targetUserId.toString(),
                    context: {
                        action: 'analyze_progress',
                        userData: {
                            username: userData.username,
                            totalXP: userData.total_xp,
                            tournamentsWon: userData.tournaments_won,
                            tournamentsParticipated: userData.tournaments_participated,
                            favoriteSubjects: userData.favorite_subjects,
                            squadMemberships: userSquads.length,
                            currentSquads: userSquads.map(s => ({
                                name: s.name,
                                rank: s.rank,
                                subjectFocus: s.subject_focus
                            }))
                        },
                        subject
                    }
                })
            });

            if (!agentResponse.ok) {
                throw new Error(`Agent response failed: ${agentResponse.status}`);
            }

            const result = await agentResponse.json();
            return result.response || "Progress analysis completed, but no specific insights were generated.";
        } catch (error) {
            console.error('Error analyzing user progress:', error);
            return `I encountered an error while analyzing your progress: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }

    // Quiz Generation with subject context
    async generateSquadQuiz(squadId: string, subject: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<string> {
        try {
            const squadData = await this.getSquadData(squadId);
            if (!squadData) {
                return "I couldn't find data for this squad to generate a customized quiz.";
            }

            const agentResponse = await fetch(`${this.AGENT_API_BASE}/chat/K.A.N.A. Educational Tutor`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    message: `Generate a ${difficulty} difficulty quiz about ${subject} for our squad "${squadData.name}"`,
                    userId: this.getUserId()?.toString(),
                    context: {
                        action: 'generate_quiz',
                        squadData: {
                            name: squadData.name,
                            memberCount: squadData.members.length,
                            subjectFocus: squadData.subject_focus,
                            averageLevel: this.calculateSquadLevel(squadData.members)
                        },
                        subject,
                        difficulty,
                        questionCount: 5
                    }
                })
            });

            if (!agentResponse.ok) {
                throw new Error(`Agent response failed: ${agentResponse.status}`);
            }

            const result = await agentResponse.json();
            return result.response || "Quiz generated, but content was not properly formatted.";
        } catch (error) {
            console.error('Error generating squad quiz:', error);
            return `I encountered an error while generating the quiz: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }

    // Squad Coordination with real member data
    async coordinateSquadActivity(squadId: string, activityType: 'study_session' | 'challenge' | 'progress_check'): Promise<string> {
        try {
            const squadData = await this.getSquadData(squadId);
            if (!squadData) {
                return "I couldn't find data for this squad to coordinate activities.";
            }

            let message = '';
            switch (activityType) {
                case 'study_session':
                    message = `Plan a study session for our squad "${squadData.name}"`;
                    break;
                case 'challenge':
                    message = `Suggest a challenge activity for our squad "${squadData.name}"`;
                    break;
                case 'progress_check':
                    message = `Help us review our squad's progress and plan next steps`;
                    break;
            }

            const agentResponse = await fetch(`${this.AGENT_API_BASE}/chat/Squad Learning Coordinator`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    message,
                    userId: this.getUserId()?.toString(),
                    context: {
                        action: 'coordinate_squad',
                        activityType,
                        squadData: {
                            name: squadData.name,
                            memberCount: squadData.members.length,
                            subjectFocus: squadData.subject_focus,
                            weeklyXP: squadData.weekly_xp,
                            rank: squadData.rank,
                            members: squadData.members.map(m => ({
                                username: m.username,
                                role: m.role,
                                weekly_xp: m.weekly_xp,
                                engagement_level: this.calculateEngagementLevel(m.weekly_xp)
                            }))
                        }
                    }
                })
            });

            if (!agentResponse.ok) {
                throw new Error(`Agent response failed: ${agentResponse.status}`);
            }

            const result = await agentResponse.json();
            return result.response || "Activity coordination completed, but no specific recommendations were generated.";
        } catch (error) {
            console.error('Error coordinating squad activity:', error);
            return `I encountered an error while coordinating the activity: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }

    // Helper method to calculate squad level
    private calculateSquadLevel(members: SquadData['members']): string {
        if (members.length === 0) return 'beginner';

        const averageXP = members.reduce((sum, m) => sum + m.total_xp, 0) / members.length;

        if (averageXP < 1000) return 'beginner';
        if (averageXP < 5000) return 'intermediate';
        return 'advanced';
    }

    // Helper method to calculate engagement level
    private calculateEngagementLevel(weeklyXP: number): string {
        if (weeklyXP < 100) return 'low';
        if (weeklyXP < 500) return 'medium';
        return 'high';
    }

    // General chat with context awareness
    async sendMessage(message: string, agentName: string, context?: any): Promise<string> {
        try {
            const userId = this.getUserId();
            let enhancedContext = { ...context };

            // Add user context if available
            if (userId) {
                const userData = await this.getUserData(userId);
                const userSquads = await this.getUserSquads(userId);

                enhancedContext = {
                    ...enhancedContext,
                    userData: userData ? {
                        username: userData.username,
                        totalXP: userData.total_xp,
                        tournamentsWon: userData.tournaments_won,
                        favoriteSubjects: userData.favorite_subjects
                    } : null,
                    userSquads: userSquads.length > 0 ? userSquads.map(s => ({
                        id: s.id,
                        name: s.name,
                        rank: s.rank,
                        subjectFocus: s.subject_focus
                    })) : null
                };
            }

            const agentResponse = await fetch(`${this.AGENT_API_BASE}/chat/${encodeURIComponent(agentName)}`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    message,
                    userId: userId?.toString() || 'anonymous',
                    context: enhancedContext
                })
            });

            if (!agentResponse.ok) {
                throw new Error(`Agent response failed: ${agentResponse.status}`);
            }

            const result = await agentResponse.json();
            return result.response || "I processed your message, but couldn't generate a proper response.";
        } catch (error) {
            console.error('Error sending message to agent:', error);
            return `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }

    // Get available agents
    async getAvailableAgents(): Promise<Array<{ name: string, status: string, capabilities: string[] }>> {
        try {
            const response = await fetch(`${this.AGENT_API_BASE}/agents`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch agents: ${response.status}`);
            }

            const data = await response.json();
            return data.agents || [];
        } catch (error) {
            console.error('Error fetching available agents:', error);
            return [
                {
                    name: 'K.A.N.A. Educational Tutor',
                    status: 'offline',
                    capabilities: ['Quiz Generation', 'Subject Help', 'Study Planning']
                },
                {
                    name: 'Learning Progress Analyst',
                    status: 'offline',
                    capabilities: ['Progress Analysis', 'Performance Insights', 'Recommendations']
                },
                {
                    name: 'Squad Learning Coordinator',
                    status: 'offline',
                    capabilities: ['Squad Management', 'Activity Planning', 'Team Coordination']
                }
            ];
        }
    }
}

export const realAgentService = new RealAgentService();
