// Core types for our ElizaOS-style agent system

export interface Memory {
    id: string;
    userId: string;
    content: {
        text: string;
        source?: string;
        metadata?: Record<string, any>;
    };
    createdAt: number;
    embedding?: number[];
}

export interface Message {
    id: string;
    userId: string;
    content: {
        text: string;
        attachments?: any[];
        metadata?: Record<string, any>;
    };
    timestamp: number;
}

export interface State {
    userId: string;
    roomId: string;
    agentId: string;
    bio: string;
    lore: string[];
    messageDirections: string[];
    postDirections: string[];
    recentMessages: Memory[];
    goals: string[];
    topics: string[];
    adjectives: string[];
    knowledge: string[];
    clients: string[];
    agentName: string;
    senderName: string;
    actors: string[];
    roomName: string;
    actionNames: string[];
    evaluatorNames: string[];
    providerNames: string[];
    serviceNames: string[];
    [key: string]: any;
}

export interface ActionExample {
    user: string;
    content: {
        text: string;
        action?: string;
    };
}

export interface Handler {
    handler: (
        runtime: IAgentRuntime,
        message: Message,
        state?: State,
        options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => Promise<boolean>;
}

export interface HandlerCallback {
    (response: Content, files?: any[]): void;
}

export interface Content {
    text: string;
    action?: string;
    source?: string;
    metadata?: Record<string, any>;
    attachments?: any[];
}

export interface Action {
    name: string;
    similes: string[];
    description: string;
    validate: (
        runtime: IAgentRuntime,
        message: Message,
        state?: State
    ) => Promise<boolean>;
    handler: (
        runtime: IAgentRuntime,
        message: Message,
        state?: State,
        options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => Promise<boolean>;
    examples: ActionExample[][];
}

export interface Evaluator {
    name: string;
    similes: string[];
    description: string;
    validate: (
        runtime: IAgentRuntime,
        message: Message,
        state?: State
    ) => Promise<boolean>;
    handler: (
        runtime: IAgentRuntime,
        message: Message,
        state?: State,
        options?: { [key: string]: unknown }
    ) => Promise<boolean>;
    examples: ActionExample[][];
}

export interface Provider {
    name: string;
    get: (
        runtime: IAgentRuntime,
        message: Message,
        state?: State
    ) => Promise<string>;
}

export interface Service {
    name: string;
    description: string;
    initialize: (runtime: IAgentRuntime) => Promise<void>;
    stop: (runtime: IAgentRuntime) => Promise<void>;
}

export interface Plugin {
    name: string;
    description: string;
    actions?: Action[];
    evaluators?: Evaluator[];
    providers?: Provider[];
    services?: Service[];
}

export interface Character {
    name: string;
    username?: string;
    plugins: string[];
    clients: string[];
    modelProvider: string;
    settings?: {
        secrets?: Record<string, string>;
        voice?: {
            model?: string;
        };
    };
    system?: string;
    bio: string;
    lore: string[];
    messageExamples: ActionExample[][];
    postExamples?: string[];
    topics: string[];
    style: {
        all: string[];
        chat: string[];
        post: string[];
    };
    adjectives: string[];
    knowledge?: string[];
}

export interface IAgentRuntime {
    agentId: string;
    serverUrl: string;
    databaseAdapter: any;
    token: string;
    modelProvider: string;
    character: Character;
    providers: Map<string, Provider>;
    actions: Map<string, Action>;
    evaluators: Map<string, Evaluator>;
    services: Map<string, Service>;

    // Core methods
    initialize(): Promise<void>;
    stop(): Promise<void>;

    // Memory management
    saveMemory(memory: Memory): Promise<void>;
    searchMemories(query: string, count?: number): Promise<Memory[]>;
    getMemories(userId: string, count?: number): Promise<Memory[]>;

    // Message processing
    processMessage(message: Message, state?: State): Promise<Content>;

    // Evaluation
    evaluate(message: Message, state?: State): Promise<number>;

    // Providers
    getProvider(name: string): Provider | undefined;

    // Actions
    getAction(name: string): Action | undefined;

    // Services
    getService(name: string): Service | undefined;

    // Composition
    compose(state: State): Promise<string>;

    // Logging
    log(...args: any[]): void;
}

export interface DatabaseAdapter {
    init(): Promise<void>;
    close(): Promise<void>;

    // Memory operations
    getMemories(userId: string, count?: number): Promise<Memory[]>;
    saveMemory(memory: Memory): Promise<void>;
    searchMemories(query: string, count?: number): Promise<Memory[]>;

    // Account operations
    createAccount(userId: string): Promise<void>;
    getAccount(userId: string): Promise<any>;
}

export interface Client {
    start(): Promise<void>;
    stop(): Promise<void>;
}

export interface ModelProvider {
    generateText(
        prompt: string,
        options?: {
            temperature?: number;
            maxTokens?: number;
            stop?: string[];
        }
    ): Promise<string>;

    generateEmbedding(text: string): Promise<number[]>;
}
