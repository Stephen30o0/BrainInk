// Brain Ink Agent Integration - Vanilla JavaScript
// Use this in any HTML page or non-React part of your Brain Ink app

class BrainInkAgentClient {
    constructor(options = {}) {
        this.apiBaseUrl = options.apiBaseUrl || process.env.BRAININK_AGENT_URL || 'https://brainink.onrender.com';
        this.onMessage = options.onMessage || (() => { });
        this.onError = options.onError || console.error;
        this.agents = [];
        this.currentAgent = null;
    }

    // Initialize and load agents
    async init() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/agents`);
            if (!response.ok) throw new Error('Failed to connect to agents');

            const data = await response.json();
            this.agents = data.agents;
            return this.agents;
        } catch (error) {
            this.onError('Failed to initialize agents:', error);
            throw error;
        }
    }

    // Send message to specific agent
    async sendMessage(agentName, message, userId = 'web-user') {
        try {
            const response = await fetch(`${this.apiBaseUrl}/chat/${encodeURIComponent(agentName)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    userId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Request failed');
            }

            const data = await response.json();
            this.onMessage(data.response, agentName, data.action);
            return data;
        } catch (error) {
            this.onError('Chat error:', error);
            throw error;
        }
    }

    // Get agent suggestions based on user input
    suggestAgent(userInput) {
        const input = userInput.toLowerCase();

        if (input.includes('quiz') || input.includes('japanese') || input.includes('kana')) {
            return this.agents.find(a => a.name.includes('Kana'));
        } else if (input.includes('progress') || input.includes('analytics') || input.includes('performance')) {
            return this.agents.find(a => a.name.includes('Progress'));
        } else if (input.includes('study') || input.includes('group') || input.includes('partner')) {
            return this.agents.find(a => a.name.includes('Squad'));
        }

        return this.agents[0]; // Default to first agent
    }

    // Quick actions for common tasks
    async generateQuiz(subject = 'general', difficulty = 'medium') {
        const agent = this.agents.find(a => a.name.includes('Kana')) || this.agents[0];
        return this.sendMessage(agent.name, `Create a ${difficulty} ${subject} quiz`);
    }

    async analyzeProgress(userId = 'web-user') {
        const agent = this.agents.find(a => a.name.includes('Progress')) || this.agents[0];
        return this.sendMessage(agent.name, 'Show me my learning progress and analytics', userId);
    }

    async findStudyPartners(subject, preferences = '') {
        const agent = this.agents.find(a => a.name.includes('Squad')) || this.agents[0];
        return this.sendMessage(agent.name, `Help me find study partners for ${subject} ${preferences}`);
    }
}

// Usage Examples:

// 1. Basic Integration
function initBrainInkAgents() {
    const agentClient = new BrainInkAgentClient({
        apiBaseUrl: process.env.BRAININK_AGENT_URL || 'https://brainink.onrender.com',
        onMessage: (response, agentName, action) => {
            console.log(`${agentName} responded:`, response);

            // Handle specific actions
            switch (action) {
                case 'QUIZ_GENERATED':
                    showQuizModal(response);
                    break;
                case 'PROGRESS_ANALYZED':
                    updateProgressDashboard(response);
                    break;
                case 'SQUAD_COORDINATED':
                    showStudyPartners(response);
                    break;
                default:
                    showGenericResponse(response);
            }
        },
        onError: (error) => {
            console.error('Agent error:', error);
            showErrorMessage('AI assistant is temporarily unavailable');
        }
    });

    return agentClient;
}

// 2. Integrate with existing Brain Ink chat
function enhanceExistingChat() {
    const agentClient = initBrainInkAgents();

    // Wait for agents to load
    agentClient.init().then(() => {
        console.log('✅ AI Agents loaded:', agentClient.agents.map(a => a.name));

        // Add AI suggestions to your existing chat input
        const chatInput = document.querySelector('#chat-input');
        if (chatInput) {
            chatInput.addEventListener('input', (e) => {
                const suggestedAgent = agentClient.suggestAgent(e.target.value);
                if (suggestedAgent) {
                    showAgentSuggestion(suggestedAgent);
                }
            });
        }

        // Add quick action buttons
        addAIQuickActions(agentClient);
    });
}

// 3. Helper functions for UI integration
function showQuizModal(quizContent) {
    // Create or show quiz modal with the generated content
    const modal = document.createElement('div');
    modal.className = 'quiz-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>🧠 Generated Quiz</h3>
            <div class="quiz-content">${quizContent}</div>
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function updateProgressDashboard(progressData) {
    // Update your existing progress dashboard
    const progressContainer = document.querySelector('#progress-dashboard');
    if (progressContainer) {
        // Parse and display progress data
        console.log('Updating progress dashboard with:', progressData);
    }
}

function showStudyPartners(partnersData) {
    // Show study partner recommendations
    const partnersContainer = document.querySelector('#study-partners');
    if (partnersContainer) {
        console.log('Showing study partners:', partnersData);
    }
}

function addAIQuickActions(agentClient) {
    const quickActionsContainer = document.querySelector('#quick-actions');
    if (!quickActionsContainer) return;

    const aiActions = [
        { label: '🇯🇵 Generate Japanese Quiz', action: () => agentClient.generateQuiz('japanese') },
        { label: '📊 Analyze My Progress', action: () => agentClient.analyzeProgress() },
        { label: '👥 Find Study Partners', action: () => agentClient.findStudyPartners('chemistry') },
        { label: '🔢 Math Practice Quiz', action: () => agentClient.generateQuiz('mathematics', 'medium') }
    ];

    aiActions.forEach(action => {
        const button = document.createElement('button');
        button.className = 'ai-quick-action';
        button.textContent = action.label;
        button.onclick = action.action;
        quickActionsContainer.appendChild(button);
    });
}

// 4. Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if agents service is available
    fetch((process.env.BRAININK_AGENT_URL || 'https://brainink.onrender.com') + '/health')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                enhanceExistingChat();
                console.log('🤖 Brain Ink AI Agents are ready!');
            }
        })
        .catch(error => {
            console.log('AI Agents service not available:', error);
        });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrainInkAgentClient, initBrainInkAgents };
}
