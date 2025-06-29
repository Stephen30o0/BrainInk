import { DatabaseAdapter, Memory } from '../types/core.js';

export class MemoryDatabaseAdapter implements DatabaseAdapter {
    private memories: Map<string, Memory[]> = new Map();
    private accounts: Map<string, any> = new Map();

    async init(): Promise<void> {
        console.log('MemoryDatabaseAdapter initialized');
    }

    async close(): Promise<void> {
        console.log('MemoryDatabaseAdapter closed');
    }

    async getMemories(userId: string, count: number = 10): Promise<Memory[]> {
        const userMemories = this.memories.get(userId) || [];
        return userMemories.slice(-count);
    }

    async saveMemory(memory: Memory): Promise<void> {
        const userId = memory.userId;
        const userMemories = this.memories.get(userId) || [];
        userMemories.push(memory);

        // Keep only the last 100 memories per user
        if (userMemories.length > 100) {
            userMemories.splice(0, userMemories.length - 100);
        }

        this.memories.set(userId, userMemories);
    }

    async searchMemories(query: string, count: number = 10): Promise<Memory[]> {
        const allMemories: Memory[] = [];

        for (const userMemories of this.memories.values()) {
            allMemories.push(...userMemories);
        }

        // Simple search - filter by text content
        const filtered = allMemories.filter(memory =>
            memory.content.text.toLowerCase().includes(query.toLowerCase())
        );

        // Sort by creation time (most recent first)
        filtered.sort((a, b) => b.createdAt - a.createdAt);

        return filtered.slice(0, count);
    }

    async createAccount(userId: string): Promise<void> {
        if (!this.accounts.has(userId)) {
            this.accounts.set(userId, {
                id: userId,
                createdAt: Date.now()
            });
        }
    }

    async getAccount(userId: string): Promise<any> {
        return this.accounts.get(userId);
    }
}
