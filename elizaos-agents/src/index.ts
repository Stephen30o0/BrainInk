import dotenv from 'dotenv';
import { AgentRuntime } from './runtime/AgentRuntime.js';
import { MemoryDatabaseAdapter } from './database/MemoryAdapter.js';
import brainInkPlugin from './plugin.js';
import { Character } from './types/core.js';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Brain Ink ElizaOS-style Agent Manager
export class BrainInkAgentManager {
    private agents: Map<string, AgentRuntime> = new Map();
    private app: express.Application;
    private server: any;
    private isInitialized = false;
    private supabase: any;

    constructor() {
        this.app = express();
        this.setupDatabase();
        this.setupExpress();
    }

    private setupDatabase() {
        // Initialize Supabase client for Brain Ink database
        const supabaseUrl = process.env.SUPABASE_URL || 'https://qzwmcobcfqsbnhztfxti.supabase.co';
        const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6d21jb2JjZnFzYm5oenRmeHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NDc4MDUsImV4cCI6MjA2NDUyMzgwNX0.e_FH-55B0xvUKR8Pnn-IGLLWD4ZnPvm1dXo1UjRTLLA';

        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Supabase client initialized for Brain Ink database');
    }

    private setupExpress() {
        this.app.use(cors());
        this.app.use(express.json());

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                agents: Array.from(this.agents.keys()),
                timestamp: new Date().toISOString()
            });
        });

        // Squad data endpoints for real Brain Ink integration
        this.app.get('/squad/:squadId/activities', async (req, res) => {
            try {
                const { squadId } = req.params;
                const { data, error } = await this.supabase
                    .from('squad_messages')
                    .select('*')
                    .eq('squad_id', squadId)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;
                res.json({ activities: data || [] });
            } catch (error) {
                console.error('Squad activities error:', error);
                res.status(500).json({ error: 'Failed to fetch squad activities' });
            }
        });

        this.app.get('/squad/:squadId/members', async (req, res) => {
            try {
                const { squadId } = req.params;
                const { data, error } = await this.supabase
                    .from('squad_members')
                    .select('*, users(*)')
                    .eq('squad_id', squadId);

                if (error) throw error;
                res.json({ members: data || [] });
            } catch (error) {
                console.error('Squad members error:', error);
                res.status(500).json({ error: 'Failed to fetch squad members' });
            }
        });

        this.app.post('/squad/:squadId/analyze', async (req, res) => {
            try {
                const { squadId } = req.params;

                // Get real squad data, members, and recent activity using correct table names
                const [squadResult, membersResult, messagesResult] = await Promise.all([
                    // Get squad info
                    this.supabase
                        .from('squads')
                        .select(`
                            id,
                            name,
                            emoji,
                            description,
                            creator_id,
                            is_public,
                            max_members,
                            subject_focus,
                            weekly_xp,
                            total_xp,
                            rank,
                            created_at
                        `)
                        .eq('id', squadId)
                        .single(),

                    // Get squad members with correct table name
                    this.supabase
                        .from('squad_memberships')
                        .select(`
                            id,
                            user_id,
                            role,
                            weekly_xp,
                            total_xp,
                            joined_at,
                            last_active
                        `)
                        .eq('squad_id', squadId),

                    // Get recent messages and activity
                    this.supabase
                        .from('squad_messages')
                        .select(`
                            id,
                            sender_id,
                            content,
                            message_type,
                            created_at
                        `)
                        .eq('squad_id', squadId)
                        .order('created_at', { ascending: false })
                        .limit(50)
                ]);

                const squad = squadResult.data;
                const members = membersResult.data || [];
                const messages = messagesResult.data || [];

                if (squadResult.error) throw squadResult.error;
                if (membersResult.error) throw membersResult.error;
                if (messagesResult.error) throw messagesResult.error;

                if (!squad) {
                    return res.status(404).json({ error: `Squad ${squadId} not found` });
                }

                // Get user details for members
                const userIds = members.map((m: any) => m.user_id);
                const { data: users } = await this.supabase
                    .from('users')
                    .select('id, username, fname, lname')
                    .in('id', userIds);

                // Analyze the data
                const membersWithUsers = members.map((member: any) => {
                    const user = (users || []).find((u: any) => u.id === member.user_id);
                    return {
                        ...member,
                        username: user?.username || 'Unknown',
                        full_name: user ? `${user.fname} ${user.lname}` : 'Unknown User'
                    };
                });

                // Calculate engagement metrics
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

                const recentMessages = messages.filter((m: any) =>
                    new Date(m.created_at) > oneWeekAgo
                );

                const memberActivity = membersWithUsers.map((member: any) => {
                    const memberMessages = recentMessages.filter((m: any) => m.sender_id === member.user_id);
                    const quizDrops = memberMessages.filter((m: any) => m.message_type === 'quiz_drop').length;
                    const textMessages = memberMessages.filter((m: any) => m.message_type === 'text').length;
                    const achievements = memberMessages.filter((m: any) => m.message_type === 'achievement').length;

                    return {
                        ...member,
                        recent_messages: memberMessages.length,
                        quiz_drops: quizDrops,
                        text_messages: textMessages,
                        achievements: achievements,
                        engagement_score: (textMessages * 1) + (quizDrops * 3) + (achievements * 2)
                    };
                });

                // Generate AI analysis using real Kana AI backend (same as Free Chat and Quiz Generation)
                const KANA_BACKEND_BASE_URL = process.env.KANA_API_URL || 'http://localhost:10000';
                
                const analysisPrompt = `Analyze this squad's real performance data and provide detailed insights:

SQUAD INFO:
- Name: ${squad.name} ${squad.emoji}
- Description: ${squad.description || 'No description'}
- Total Members: ${members.length}/${squad.max_members}
- Subject Focus: ${squad.subject_focus || 'General'}
- Weekly XP: ${squad.weekly_xp}
- Total XP: ${squad.total_xp}
- Current Rank: ${squad.rank}
- Created: ${new Date(squad.created_at).toLocaleDateString()}

MEMBER ACTIVITY (Last 7 days):
${memberActivity.map((m: any) => `- ${m.username} (${m.role}): ${m.recent_messages} messages, ${m.quiz_drops} quiz drops, ${m.weekly_xp} weekly XP, Engagement: ${m.engagement_score}`).join('\n')}

RECENT ACTIVITY SUMMARY:
- Total recent messages: ${recentMessages.length}
- Quiz drops: ${recentMessages.filter((m: any) => m.message_type === 'quiz_drop').length}
- Achievements shared: ${recentMessages.filter((m: any) => m.message_type === 'achievement').length}
- Most active member: ${memberActivity.sort((a: any, b: any) => b.engagement_score - a.engagement_score)[0]?.username || 'None'}
- Least active member: ${memberActivity.sort((a: any, b: any) => a.engagement_score - b.engagement_score)[0]?.username || 'None'}

Provide insights about:
1. Squad engagement levels and trends
2. Top and underperforming members
3. Activity patterns and areas for improvement
4. Specific recommendations for squad growth
5. Subject focus effectiveness

Please provide a detailed analysis in a clear, structured format.`;

                console.log(`📊 Generating squad analysis via Kana AI for squad "${squad.name}"`);
                
                try {
                    const kanaResponse = await fetch(`${KANA_BACKEND_BASE_URL}/api/chat`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            conversationId: `squad_analysis_${squadId}_${Date.now()}`,
                            message: analysisPrompt,
                            history: []
                        })
                    });

                    if (!kanaResponse.ok) {
                        throw new Error(`Kana AI request failed: ${kanaResponse.status} - ${await kanaResponse.text()}`);
                    }

                    const kanaData = await kanaResponse.json();
                    
                    console.log(`✅ Generated real squad analysis via Kana AI for squad "${squad.name}"`);

                    res.json({
                        analysis: kanaData.kanaResponse || 'Analysis completed but no response received',
                        squad_data: {
                            squad,
                            member_count: members.length,
                            recent_activity_count: recentMessages.length,
                            top_performer: memberActivity.sort((a: any, b: any) => b.engagement_score - a.engagement_score)[0],
                            engagement_summary: {
                                total_messages: recentMessages.length,
                                quiz_drops: recentMessages.filter((m: any) => m.message_type === 'quiz_drop').length,
                                achievements: recentMessages.filter((m: any) => m.message_type === 'achievement').length,
                                average_engagement: memberActivity.length > 0
                                    ? Math.round(memberActivity.reduce((sum: number, m: any) => sum + m.engagement_score, 0) / memberActivity.length)
                                    : 0
                            }
                        },
                        source: 'Kana AI (Gemini)',
                        timestamp: new Date().toISOString()
                    });
                } catch (kanaError) {
                    console.error('Kana AI analysis failed, using fallback:', kanaError);
                    
                    // Fallback analysis if Kana AI is unavailable
                    const fallbackAnalysis = `📊 **Squad Analysis Report**

**Squad Overview:**
- **Name:** ${squad.name} ${squad.emoji}
- **Members:** ${members.length}/${squad.max_members}
- **Total XP:** ${squad.total_xp} (Weekly: ${squad.weekly_xp})
- **Rank:** ${squad.rank}
- **Subject Focus:** ${squad.subject_focus || 'General'}

**Recent Activity (7 days):**
- **Messages:** ${recentMessages.length}
- **Quiz Drops:** ${recentMessages.filter((m: any) => m.message_type === 'quiz_drop').length}
- **Achievements:** ${recentMessages.filter((m: any) => m.message_type === 'achievement').length}

**Top Performers:**
${memberActivity.sort((a: any, b: any) => b.engagement_score - a.engagement_score).slice(0, 3).map((m: any, i: number) => 
    `${i + 1}. ${m.username} - ${m.engagement_score} engagement points`
).join('\n')}

**Recommendations:**
- Encourage more quiz participation to boost engagement
- Consider organizing study sessions for less active members
- Share more achievements to motivate the squad
- Focus on ${squad.subject_focus || 'diverse subjects'} to align with squad goals

*Note: AI analysis service was unavailable, using database-driven insights.*`;

                    res.json({
                        analysis: fallbackAnalysis,
                        squad_data: {
                            squad,
                            member_count: members.length,
                            recent_activity_count: recentMessages.length,
                            top_performer: memberActivity.sort((a: any, b: any) => b.engagement_score - a.engagement_score)[0],
                            engagement_summary: {
                                total_messages: recentMessages.length,
                                quiz_drops: recentMessages.filter((m: any) => m.message_type === 'quiz_drop').length,
                                achievements: recentMessages.filter((m: any) => m.message_type === 'achievement').length,
                                average_engagement: memberActivity.length > 0
                                    ? Math.round(memberActivity.reduce((sum: number, m: any) => sum + m.engagement_score, 0) / memberActivity.length)
                                    : 0
                            }
                        },
                        source: 'Fallback Analysis (Kana AI unavailable)',
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.error('Squad analysis error:', error);
                res.status(500).json({
                    error: 'Failed to analyze squad',
                    details: error instanceof Error ? error.message : String(error)
                });
            }
        });

        this.app.post('/squad/:squadId/generate-quiz', async (req, res) => {
            try {
                const { squadId } = req.params;
                const { topic = 'mathematics', difficulty = 'medium' } = req.body;

                // Get squad data for context
                const { data: squadData } = await this.supabase
                    .from('squads')
                    .select('name, subject_focus, weekly_xp, total_xp')
                    .eq('id', squadId)
                    .single();

                if (!squadData) {
                    return res.status(404).json({ error: `Squad ${squadId} not found` });
                }

                // Use the real Kana backend API to generate quiz (same as ChainlinkTestnetService)
                const KANA_BACKEND_BASE_URL = process.env.KANA_API_URL || 'http://localhost:10000';

                console.log(`🎯 Generating quiz via Kana API for squad "${squadData.name}" - Topic: ${topic}, Difficulty: ${difficulty}`);

                const kanaResponse = await fetch(`${KANA_BACKEND_BASE_URL}/api/kana/generate-daily-quiz`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        topic: topic,
                        difficulty: difficulty,
                        numQuestions: 1,
                        context: {
                            squadName: squadData.name,
                            squadFocus: squadData.subject_focus,
                            squadLevel: squadData.total_xp > 5000 ? 'advanced' : squadData.total_xp > 1000 ? 'intermediate' : 'beginner'
                        }
                    })
                });

                if (!kanaResponse.ok) {
                    throw new Error(`Kana API request failed: ${kanaResponse.status} - ${await kanaResponse.text()}`);
                }

                const kanaData = await kanaResponse.json();

                if (!kanaData.quiz || !kanaData.quiz[0]) {
                    throw new Error('Invalid quiz format from Kana AI');
                }

                const quiz = kanaData.quiz[0];

                // Find correct answer index
                const correctIndex = quiz.options.findIndex((option: string) => option === quiz.answer);

                // Calculate XP reward based on difficulty
                const xpRewards = { easy: 30, medium: 50, hard: 75 };
                const xpReward = xpRewards[difficulty as keyof typeof xpRewards] || 50;

                const finalQuiz = {
                    question: quiz.question,
                    options: quiz.options,
                    correctAnswer: correctIndex >= 0 ? correctIndex : 0,
                    xpReward: xpReward,
                    explanation: quiz.explanation || `This ${difficulty} difficulty question tests knowledge of ${topic}.`,
                    topic: topic,
                    generatedAt: new Date().toISOString(),
                    squadId: squadId,
                    source: 'Kana AI (Gemini)',
                    squadContext: {
                        name: squadData.name,
                        focus: squadData.subject_focus,
                        level: squadData.total_xp > 5000 ? 'advanced' : squadData.total_xp > 1000 ? 'intermediate' : 'beginner'
                    }
                };

                console.log(`✅ Generated real quiz via Kana AI for squad "${squadData.name}"`);

                res.json({
                    success: true,
                    quiz: finalQuiz
                });

            } catch (error) {
                console.error('Quiz generation error:', error);

                // If Kana API fails, provide a helpful error message
                if (error instanceof Error && error.message.includes('Kana API')) {
                    res.status(503).json({
                        success: false,
                        error: 'Quiz generation service unavailable',
                        details: 'The Kana AI backend is not responding. Please ensure it is running on port 10000.',
                        fallback: {
                            question: `Sample ${(req.body.topic || 'general')} question (service unavailable)`,
                            options: ["Option A", "Option B", "Option C", "Option D"],
                            correctAnswer: 0,
                            xpReward: 25,
                            explanation: "This is a fallback question since the AI service is unavailable.",
                            topic: req.body.topic || 'general',
                            generatedAt: new Date().toISOString(),
                            squadId: req.params.squadId,
                            source: 'Fallback (Kana AI unavailable)'
                        }
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to generate quiz',
                        details: error instanceof Error ? error.message : String(error)
                    });
                }
            }
        });

        this.app.post('/squad/:squadId/coordinate', async (req, res) => {
            try {
                const { squadId } = req.params;

                const agent = this.agents.get('Squad Learning Coordinator');
                if (!agent) {
                    return res.status(404).json({ error: 'Squad Learning Coordinator not found' });
                }

                // Get recent squad data for context
                const { data: activities } = await this.supabase
                    .from('squad_messages')
                    .select('*')
                    .eq('squad_id', squadId)
                    .order('created_at', { ascending: false })
                    .limit(20);

                const coordinationPrompt = `Provide squad coordination suggestions for squad ${squadId}.
Recent activities: ${activities?.length || 0}
Suggest:
- Study session topics
- Collaboration activities  
- Engagement strategies
- Competition ideas
- Timeline recommendations`;

                const response = await agent.processMessage({
                    id: `coord_${Date.now()}`,
                    userId: 'system',
                    content: { text: coordinationPrompt },
                    timestamp: Date.now()
                });

                res.json({
                    coordination: response.text,
                    squadId,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Squad coordination error:', error);
                res.status(500).json({ error: 'Failed to generate coordination suggestions' });
            }
        });

        // Chat endpoint for interacting with agents
        this.app.post('/chat/:agentName', async (req, res) => {
            try {
                const { agentName } = req.params;
                const { message, userId = 'anonymous', squadId, conversationId } = req.body;

                // For Free Chat, use the real Kana AI backend instead of mock responses
                if (agentName === 'Free Chat Agent') {
                    const KANA_BACKEND_BASE_URL = process.env.KANA_API_URL || 'http://localhost:10000';

                    // Create a unique conversation ID for this chat session
                    const finalConversationId = conversationId || `agent_chat_${squadId || userId}_${Date.now()}`;

                    console.log(`💬 Processing Free Chat via Kana AI - User: ${userId}, Squad: ${squadId || 'none'}`);

                    // Add squad context if available
                    let contextualMessage = message;
                    if (squadId) {
                        try {
                            const { data: squadData } = await this.supabase
                                .from('squads')
                                .select('name, subject_focus, description')
                                .eq('id', squadId)
                                .single();

                            if (squadData) {
                                contextualMessage = `[Squad Context: "${squadData.name}" - ${squadData.subject_focus}] ${message}`;
                            }
                        } catch (error) {
                            console.log('Could not fetch squad context:', error);
                        }
                    }

                    const kanaResponse = await fetch(`${KANA_BACKEND_BASE_URL}/api/chat`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            conversationId: finalConversationId,
                            message: contextualMessage,
                            history: [] // Could be extended to maintain chat history
                        })
                    });

                    if (!kanaResponse.ok) {
                        throw new Error(`Kana AI request failed: ${kanaResponse.status} - ${await kanaResponse.text()}`);
                    }

                    const kanaData = await kanaResponse.json();

                    console.log(`✅ Free Chat processed via Kana AI`);

                    return res.json({
                        response: kanaData.kanaResponse || kanaData.response || 'I received your message!',
                        action: null,
                        source: 'Kana AI (Gemini)',
                        conversationId: finalConversationId,
                        type: kanaData.type || 'text',
                        generatedImageUrl: kanaData.generatedImageUrl || null
                    });
                }

                // For other agents, use the original ElizaOS logic
                const agent = this.agents.get(agentName);
                if (!agent) {
                    return res.status(404).json({ error: `Agent ${agentName} not found` });
                }

                const response = await agent.processMessage({
                    id: `msg_${Date.now()}`,
                    userId,
                    content: { text: message },
                    timestamp: Date.now()
                });

                res.json({ response: response.text, action: response.action });
            } catch (error) {
                console.error('Chat error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // List all agents
        this.app.get('/agents', (req, res) => {
            const agentList = Array.from(this.agents.keys()).map(name => {
                const agent = this.agents.get(name);
                return {
                    name,
                    character: agent?.character.name,
                    bio: agent?.character.bio,
                    topics: agent?.character.topics
                };
            });
            res.json({ agents: agentList });
        });
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🚀 Initializing Brain Ink Agent Manager...');

            // Load character configurations
            const characters = await this.loadCharacters();

            // Initialize agents
            for (const character of characters) {
                await this.createAgent(character);
            }

            this.isInitialized = true;
            console.log('✅ Brain Ink Agent Manager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize agents:', error);
            throw error;
        }
    }

    private async createAgent(character: Character): Promise<void> {
        try {
            const databaseAdapter = new MemoryDatabaseAdapter();

            const runtime = new AgentRuntime({
                character,
                databaseAdapter,
                token: process.env.OPENAI_API_KEY || '',
                serverUrl: process.env.SERVER_URL || 'http://localhost:3000',
                modelProvider: process.env.MODEL_PROVIDER || 'openai'
            });

            // Register the Brain Ink plugin
            runtime.registerPlugin(brainInkPlugin);

            // Initialize the runtime
            await runtime.initialize();

            this.agents.set(character.name, runtime);
            console.log(`✅ Initialized agent: ${character.name}`);
        } catch (error) {
            console.error(`❌ Failed to create agent ${character.name}:`, error);
            throw error;
        }
    }

    private async loadCharacters(): Promise<Character[]> {
        const charactersDir = path.join(__dirname, '../characters');

        if (!fs.existsSync(charactersDir)) {
            console.log('❌ Characters directory not found, creating default characters...');
            return this.createDefaultCharacters();
        }

        const characterFiles = fs.readdirSync(charactersDir)
            .filter(file => file.endsWith('.json'));

        if (characterFiles.length === 0) {
            console.log('⚠️ No character files found, creating default characters...');
            return this.createDefaultCharacters();
        }

        const characters: Character[] = [];

        for (const file of characterFiles) {
            try {
                const filePath = path.join(charactersDir, file);
                const characterData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                characters.push(characterData as Character);
                console.log(`📖 Loaded character: ${characterData.name}`);
            } catch (error) {
                console.error(`❌ Failed to load character file ${file}:`, error);
            }
        }

        return characters;
    }

    private createDefaultCharacters(): Character[] {
        return [
            {
                name: "Kana Tutor",
                username: "kana_tutor",
                plugins: ["brainink"],
                clients: ["direct"],
                modelProvider: "openai",
                bio: "I'm Kana, your friendly Japanese language tutor specializing in hiragana and katakana. I make learning Japanese characters fun and interactive!",
                lore: [
                    "Born in Tokyo, raised bilingually",
                    "Studied linguistics and education",
                    "Passionate about making language learning accessible"
                ],
                messageExamples: [
                    [
                        {
                            user: "student",
                            content: { text: "Help me learn hiragana" }
                        },
                        {
                            user: "Kana Tutor",
                            content: { text: "Great! Let's start with the basic hiragana characters. Would you like me to create a quiz for you?" }
                        }
                    ]
                ],
                topics: ["japanese", "hiragana", "katakana", "language learning", "quizzes"],
                style: {
                    all: ["encouraging", "patient", "clear"],
                    chat: ["friendly", "supportive", "educational"],
                    post: ["motivational", "informative"]
                },
                adjectives: ["patient", "encouraging", "knowledgeable", "friendly"]
            },
            {
                name: "Squad Coordinator",
                username: "squad_coordinator",
                plugins: ["brainink"],
                clients: ["direct"],
                modelProvider: "openai",
                bio: "I'm your study squad coordinator! I help students find compatible study partners and organize effective group learning sessions.",
                lore: [
                    "Former study group leader in university",
                    "Expert in collaborative learning techniques",
                    "Believes in the power of peer-to-peer education"
                ],
                messageExamples: [
                    [
                        {
                            user: "student",
                            content: { text: "I need study partners for chemistry" }
                        },
                        {
                            user: "Squad Coordinator",
                            content: { text: "Perfect! I'll help you find compatible chemistry study partners. What's your preferred study time?" }
                        }
                    ]
                ],
                topics: ["study groups", "collaboration", "team formation", "peer learning"],
                style: {
                    all: ["organized", "social", "helpful"],
                    chat: ["energetic", "coordinating", "supportive"],
                    post: ["motivational", "team-building"]
                },
                adjectives: ["organized", "social", "helpful", "energetic"]
            },
            {
                name: "Progress Analyst",
                username: "progress_analyst",
                plugins: ["brainink"],
                clients: ["direct"],
                modelProvider: "openai",
                bio: "I analyze your learning progress and provide insights to help you improve. I track your strengths, identify areas for growth, and suggest personalized study strategies.",
                lore: [
                    "Data scientist turned education specialist",
                    "Expert in learning analytics and assessment",
                    "Passionate about evidence-based learning"
                ],
                messageExamples: [
                    [
                        {
                            user: "student",
                            content: { text: "How am I doing in my studies?" }
                        },
                        {
                            user: "Progress Analyst",
                            content: { text: "Let me analyze your recent performance data and provide you with detailed insights!" }
                        }
                    ]
                ],
                topics: ["progress tracking", "analytics", "performance", "improvement", "assessment"],
                style: {
                    all: ["analytical", "data-driven", "insightful"],
                    chat: ["detailed", "encouraging", "strategic"],
                    post: ["informative", "evidence-based"]
                },
                adjectives: ["analytical", "insightful", "strategic", "encouraging"]
            }
        ];
    }

    async start(port: number = 3001) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return new Promise<void>((resolve) => {
            this.server = this.app.listen(port, () => {
                console.log(`🌟 Brain Ink Agent Manager running on port ${port}`);
                console.log(`📊 Health check: http://localhost:${port}/health`);
                console.log(`🤖 Chat endpoint: http://localhost:${port}/chat/:agentName`);
                console.log(`📋 Agents list: http://localhost:${port}/agents`);
                resolve();
            });
        });
    }

    async stop() {
        console.log('🛑 Stopping Brain Ink Agent Manager...');

        // Stop all agents
        for (const [name, agent] of this.agents) {
            try {
                await agent.stop();
                console.log(`✅ Stopped agent: ${name}`);
            } catch (error) {
                console.error(`❌ Error stopping agent ${name}:`, error);
            }
        }

        // Stop the express server
        if (this.server) {
            this.server.close();
            console.log('✅ Express server stopped');
        }

        console.log('✅ Brain Ink Agent Manager stopped');
    }

    getAgent(name: string): AgentRuntime | undefined {
        return this.agents.get(name);
    }

    listAgents(): string[] {
        return Array.from(this.agents.keys());
    }
}

// Main execution
async function main() {
    const manager = new BrainInkAgentManager();

    try {
        const port = parseInt(process.env.PORT || '3001');
        await manager.start(port);

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Received SIGINT, shutting down gracefully...');
            await manager.stop();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
            await manager.stop();
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Failed to start Brain Ink Agent Manager:', error);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (import.meta.url === `file://${__filename}` || process.argv[1]?.endsWith('index.js')) {
    main().catch(console.error);
}

export default BrainInkAgentManager;
