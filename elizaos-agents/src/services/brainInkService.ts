/**
 * Brain Ink Service - Real Database Integration
 * Connects ElizaOS agents to Brain Ink's real database and services
 */

interface BrainInkConfig {
    supabaseUrl: string;
    supabaseKey: string;
    backendUrl: string;
    kanaApiUrl: string;
}

interface UserProfile {
    id: number;
    username: string;
    total_xp: number;
    tournaments_won: number;
    tournaments_participated: number;
    favorite_subjects?: string[];
    squad_id?: string;
    created_at: string;
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
    created_at: string;
}

interface QuizData {
    id: string;
    question: string;
    options: string[];
    correct_answer: number;
    subject: string;
    difficulty: string;
    xp_reward: number;
    created_at: string;
}

export class BrainInkService {
    private config: BrainInkConfig;
    private supabase: any = null;

    constructor() {
        this.config = {
            supabaseUrl: process.env.SUPABASE_URL || '',
            supabaseKey: process.env.SUPABASE_KEY || '',
            backendUrl: process.env.BRAIN_INK_BACKEND_URL || 'https://brainink-backend-freinds-micro.onrender.com',
            kanaApiUrl: process.env.KANA_API_URL || 'http://localhost:10000'
        };

        this.initializeSupabase();
    }

    private async initializeSupabase() {
        try {
            // Initialize Supabase client for real database access
            if (this.config.supabaseUrl && this.config.supabaseKey) {
                const { createClient } = await import('@supabase/supabase-js');
                this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey);
                console.log('✅ Supabase connected for Brain Ink integration');
            }
        } catch (error) {
            console.warn('⚠️ Supabase not available, using fallback methods:', error);
        }
    }

    // Get user profile data
    async getUserProfile(userId: number): Promise<UserProfile | null> {
        try {
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) throw error;
                return data;
            } else {
                // Fallback to REST API
                const response = await fetch(`${this.config.backendUrl}/user/${userId}/profile`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    }

    // Get squad data with members
    async getSquadData(squadId: string): Promise<SquadData | null> {
        try {
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('squads')
                    .select(`
                        *,
                        squad_members (
                            user_id,
                            role,
                            users (
                                id,
                                username,
                                total_xp
                            )
                        )
                    `)
                    .eq('id', squadId)
                    .single();

                if (error) throw error;

                // Transform the data to match expected format
                return {
                    ...data,
                    members: data.squad_members?.map((member: any) => ({
                        id: member.users.id,
                        username: member.users.username,
                        weekly_xp: member.weekly_xp || 0,
                        total_xp: member.users.total_xp || 0,
                        role: member.role
                    })) || []
                };
            } else {
                // Fallback to REST API
                const response = await fetch(`${this.config.backendUrl}/squads/squad/${squadId}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching squad data:', error);
            return null;
        }
    }

    // Get user's recent quiz activities
    async getUserQuizActivity(userId: number, limit: number = 10): Promise<any[]> {
        try {
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('quiz_attempts')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (error) throw error;
                return data || [];
            } else {
                // Fallback to REST API
                const response = await fetch(`${this.config.backendUrl}/quiz/user/${userId}/activity?limit=${limit}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching quiz activity:', error);
            return [];
        }
    }

    // Get squad activity and engagement metrics
    async getSquadActivity(squadId: string, days: number = 7): Promise<any[]> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('squad_activities')
                    .select(`
                        *,
                        users (
                            id,
                            username
                        )
                    `)
                    .eq('squad_id', squadId)
                    .gte('created_at', cutoffDate.toISOString())
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return data || [];
            } else {
                // Fallback method - get basic activity data
                return [];
            }
        } catch (error) {
            console.error('Error fetching squad activity:', error);
            return [];
        }
    }

    // Generate quiz using Kana AI
    async generateQuizWithKana(topic: string, difficulty: string = 'medium', numQuestions: number = 1): Promise<QuizData | null> {
        try {
            const response = await fetch(`${this.config.kanaApiUrl}/api/kana/generate-daily-quiz`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    topic,
                    difficulty,
                    numQuestions
                })
            });

            if (!response.ok) {
                throw new Error(`Kana API request failed: ${response.status}`);
            }

            const data = await response.json();

            if (!data.quiz || !data.quiz[0]) {
                throw new Error('Invalid quiz format from Kana AI');
            }

            const quiz = data.quiz[0];
            const correctIndex = quiz.options.findIndex((option: string) => option === quiz.answer);

            return {
                id: `quiz_${Date.now()}`,
                question: quiz.question,
                options: quiz.options,
                correct_answer: correctIndex,
                subject: topic,
                difficulty,
                xp_reward: 50,
                created_at: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error generating quiz with Kana:', error);
            return null;
        }
    }

    // Analyze user progress patterns
    async analyzeUserProgress(userId: number): Promise<any> {
        try {
            const profile = await this.getUserProfile(userId);
            const quizActivity = await this.getUserQuizActivity(userId, 20);

            if (!profile) {
                return { error: 'User not found' };
            }

            // Calculate progress metrics
            const totalQuizzes = quizActivity.length;
            const correctAnswers = quizActivity.filter(q => q.is_correct).length;
            const accuracy = totalQuizzes > 0 ? (correctAnswers / totalQuizzes * 100).toFixed(1) : 0;

            const subjectBreakdown = quizActivity.reduce((acc, quiz) => {
                const subject = quiz.subject || 'Unknown';
                acc[subject] = (acc[subject] || 0) + 1;
                return acc;
            }, {});

            const recentActivity = quizActivity.filter(q => {
                const activityDate = new Date(q.created_at);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return activityDate >= weekAgo;
            });

            return {
                user: profile,
                stats: {
                    totalQuizzes,
                    accuracy: `${accuracy}%`,
                    totalXP: profile.total_xp,
                    tournamentsWon: profile.tournaments_won,
                    recentActivity: recentActivity.length,
                    strongSubjects: Object.entries(subjectBreakdown)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 3)
                        .map(([subject]) => subject)
                },
                recommendations: this.generateProgressRecommendations(profile, quizActivity)
            };
        } catch (error) {
            console.error('Error analyzing user progress:', error);
            return { error: 'Failed to analyze progress' };
        }
    }

    // Generate personalized recommendations
    private generateProgressRecommendations(profile: UserProfile, activity: any[]): string[] {
        const recommendations = [];

        if (activity.length < 5) {
            recommendations.push('Take more quizzes to build your learning streak');
        }

        if (profile.total_xp < 1000) {
            recommendations.push('Focus on consistent daily practice to reach your first milestone');
        }

        if (profile.tournaments_participated === 0) {
            recommendations.push('Join a tournament to challenge yourself and earn bonus XP');
        }

        if (!profile.squad_id) {
            recommendations.push('Join a study squad to learn collaboratively');
        }

        const recentActivity = activity.filter(q => {
            const activityDate = new Date(q.created_at);
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            return activityDate >= threeDaysAgo;
        });

        if (recentActivity.length === 0) {
            recommendations.push('You haven\'t been active recently - try taking a quick quiz to get back on track');
        }

        return recommendations.length > 0 ? recommendations : ['Keep up the great work! You\'re doing amazing.'];
    }

    // Get leaderboard data
    async getLeaderboard(type: 'global' | 'squad' = 'global', squadId?: string, limit: number = 10): Promise<any[]> {
        try {
            if (this.supabase) {
                let query = this.supabase
                    .from('users')
                    .select('id, username, total_xp, tournaments_won')
                    .order('total_xp', { ascending: false })
                    .limit(limit);

                if (type === 'squad' && squadId) {
                    query = this.supabase
                        .from('squad_members')
                        .select(`
                            user_id,
                            users (
                                id,
                                username,
                                total_xp,
                                tournaments_won
                            )
                        `)
                        .eq('squad_id', squadId)
                        .order('users.total_xp', { ascending: false })
                        .limit(limit);
                }

                const { data, error } = await query;
                if (error) throw error;

                return data || [];
            } else {
                // Fallback to REST API
                const endpoint = type === 'squad' && squadId
                    ? `${this.config.backendUrl}/squads/${squadId}/leaderboard`
                    : `${this.config.backendUrl}/leaderboard`;

                const response = await fetch(`${endpoint}?limit=${limit}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    }

    // Health check
    async healthCheck(): Promise<boolean> {
        try {
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('users')
                    .select('count')
                    .limit(1);

                return !error;
            } else {
                const response = await fetch(`${this.config.backendUrl}/health`);
                return response.ok;
            }
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }
}

export const brainInkService = new BrainInkService();
