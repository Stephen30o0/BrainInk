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

    constructor() {
        this.app = express();
        this.setupExpress();
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

        // Chat endpoint for interacting with agents
        this.app.post('/chat/:agentName', async (req, res) => {
            try {
                const { agentName } = req.params;
                const { message, userId = 'anonymous' } = req.body;

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
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export default BrainInkAgentManager;
