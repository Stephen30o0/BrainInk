import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
    IAgentRuntime,
    Character,
    Memory,
    Message,
    State,
    Content,
    Action,
    Evaluator,
    Provider,
    Service,
    Plugin,
    DatabaseAdapter
} from '../types/core.js';

export class AgentRuntime extends EventEmitter implements IAgentRuntime {
    public agentId: string;
    public serverUrl: string;
    public databaseAdapter: DatabaseAdapter;
    public token: string;
    public modelProvider: string;
    public character: Character;
    public providers: Map<string, Provider>;
    public actions: Map<string, Action>;
    public evaluators: Map<string, Evaluator>;
    public services: Map<string, Service>;

    constructor(options: {
        character: Character;
        databaseAdapter: DatabaseAdapter;
        token?: string;
        serverUrl?: string;
        modelProvider?: string;
    }) {
        super();

        this.agentId = uuidv4();
        this.character = options.character;
        this.databaseAdapter = options.databaseAdapter;
        this.token = options.token || '';
        this.serverUrl = options.serverUrl || 'http://localhost:3000';
        this.modelProvider = options.modelProvider || 'openai';

        this.providers = new Map();
        this.actions = new Map();
        this.evaluators = new Map();
        this.services = new Map();
    }

    async initialize(): Promise<void> {
        this.log('Initializing agent runtime...');

        // Initialize database
        await this.databaseAdapter.init();

        // Initialize services
        for (const [name, service] of this.services) {
            try {
                await service.initialize(this);
                this.log(`Service ${name} initialized`);
            } catch (error) {
                this.log(`Failed to initialize service ${name}:`, error);
            }
        }

        this.log('Agent runtime initialized');
    }

    async stop(): Promise<void> {
        this.log('Stopping agent runtime...');

        // Stop services
        for (const [name, service] of this.services) {
            try {
                await service.stop(this);
                this.log(`Service ${name} stopped`);
            } catch (error) {
                this.log(`Error stopping service ${name}:`, error);
            }
        }

        // Close database
        await this.databaseAdapter.close();

        this.log('Agent runtime stopped');
    }

    registerPlugin(plugin: Plugin): void {
        this.log(`Registering plugin: ${plugin.name}`);

        // Register actions
        if (plugin.actions) {
            for (const action of plugin.actions) {
                this.actions.set(action.name, action);
                this.log(`Registered action: ${action.name}`);
            }
        }

        // Register evaluators
        if (plugin.evaluators) {
            for (const evaluator of plugin.evaluators) {
                this.evaluators.set(evaluator.name, evaluator);
                this.log(`Registered evaluator: ${evaluator.name}`);
            }
        }

        // Register providers
        if (plugin.providers) {
            for (const provider of plugin.providers) {
                this.providers.set(provider.name, provider);
                this.log(`Registered provider: ${provider.name}`);
            }
        }

        // Register services
        if (plugin.services) {
            for (const service of plugin.services) {
                this.services.set(service.name, service);
                this.log(`Registered service: ${service.name}`);
            }
        }
    }

    async saveMemory(memory: Memory): Promise<void> {
        await this.databaseAdapter.saveMemory(memory);
    }

    async searchMemories(query: string, count: number = 10): Promise<Memory[]> {
        return await this.databaseAdapter.searchMemories(query, count);
    }

    async getMemories(userId: string, count: number = 10): Promise<Memory[]> {
        return await this.databaseAdapter.getMemories(userId, count);
    }

    async processMessage(message: Message, state?: State): Promise<Content> {
        this.log(`Processing message from ${message.userId}: ${message.content.text}`);

        // Create default state if not provided
        if (!state) {
            state = await this.createState(message);
        }

        // Check if any action should handle this message
        for (const [name, action] of this.actions) {
            try {
                const shouldHandle = await action.validate(this, message, state);
                if (shouldHandle) {
                    this.log(`Action ${name} will handle the message`);

                    return new Promise((resolve) => {
                        const callback = (response: Content) => {
                            resolve(response);
                        };

                        action.handler(this, message, state, {}, callback);
                    });
                }
            } catch (error) {
                this.log(`Error validating action ${name}:`, error);
            }
        }

        // Default response if no action handles the message
        return {
            text: "I understand, but I'm not sure how to help with that right now.",
            source: this.character.name
        };
    }

    async evaluate(message: Message, state?: State): Promise<number> {
        if (!state) {
            state = await this.createState(message);
        }

        let totalScore = 0;
        let evaluatorCount = 0;

        for (const [name, evaluator] of this.evaluators) {
            try {
                const shouldEvaluate = await evaluator.validate(this, message, state);
                if (shouldEvaluate) {
                    await evaluator.handler(this, message, state);
                    evaluatorCount++;
                    totalScore += 1; // Simple scoring for now
                }
            } catch (error) {
                this.log(`Error in evaluator ${name}:`, error);
            }
        }

        return evaluatorCount > 0 ? totalScore / evaluatorCount : 0;
    }

    getProvider(name: string): Provider | undefined {
        return this.providers.get(name);
    }

    getAction(name: string): Action | undefined {
        return this.actions.get(name);
    }

    getService(name: string): Service | undefined {
        return this.services.get(name);
    }

    async compose(state: State): Promise<string> {
        // Simple composition logic - can be enhanced
        const bio = state.bio || this.character.bio;
        const topics = state.topics || this.character.topics;
        const recentContext = state.recentMessages?.slice(-3).map(m => m.content.text).join(' ') || '';

        return `${bio}\n\nRecent context: ${recentContext}\n\nTopics of interest: ${topics.join(', ')}`;
    }

    private async createState(message: Message): Promise<State> {
        const recentMessages = await this.getMemories(message.userId, 5);

        return {
            userId: message.userId,
            roomId: 'default',
            agentId: this.agentId,
            bio: this.character.bio,
            lore: this.character.lore,
            messageDirections: [],
            postDirections: [],
            recentMessages,
            goals: [],
            topics: this.character.topics,
            adjectives: this.character.adjectives,
            knowledge: this.character.knowledge || [],
            clients: this.character.clients,
            agentName: this.character.name,
            senderName: message.userId,
            actors: [this.character.name, message.userId],
            roomName: 'default',
            actionNames: Array.from(this.actions.keys()),
            evaluatorNames: Array.from(this.evaluators.keys()),
            providerNames: Array.from(this.providers.keys()),
            serviceNames: Array.from(this.services.keys()),
        };
    }

    log(...args: any[]): void {
        console.log(`[${this.character.name}]`, ...args);
    }
}
