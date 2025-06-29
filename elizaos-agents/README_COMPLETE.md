# Brain Ink ElizaOS-Style Agents

A multi-agent system inspired by ElizaOS for the Brain Ink educational platform, built with TypeScript and Node.js.

## ✅ **WORKING IMPLEMENTATION**

This implementation has been successfully built and tested. It provides a complete ElizaOS-style agent framework without requiring external ElizaOS packages that aren't available on npm.

## 🤖 Agents

- **Kana Tutor**: Japanese language learning specialist (hiragana/katakana)
- **Squad Coordinator**: Study group formation and coordination
- **Progress Analyst**: Learning analytics and progress tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Start the agent system:**
   ```bash
   npm start
   ```

4. **Alternative: Use the batch file (Windows):**
   ```bash
   start.bat
   ```

### Testing

Run the test script to verify all agents are working:
```bash
node test.js
```

## 📡 API Endpoints

Once running (default port 3001):

- **Health Check:** `GET http://localhost:3001/health`
- **List Agents:** `GET http://localhost:3001/agents`  
- **Chat with Agent:** `POST http://localhost:3001/chat/:agentName`

### Example Chat Request:
```bash
curl -X POST http://localhost:3001/chat/Kana%20Tutor \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a Japanese quiz", "userId": "student123"}'
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file (copy from `.env.example`):

```env
PORT=3001
NODE_ENV=development
OPENAI_API_KEY=your_api_key_here
MODEL_PROVIDER=openai
SERVER_URL=http://localhost:3001
```

### Custom Characters
Add character JSON files to the `characters/` directory. The system will load them automatically.

## 🏗️ Architecture

```
src/
├── types/          # Core type definitions
├── runtime/        # Agent runtime implementation  
├── database/       # Memory database adapter
├── actions/        # Agent action implementations
├── plugin.ts       # Brain Ink plugin definition
└── index.ts        # Main application entry point
```

### Core Components

- **AgentRuntime**: Main agent execution environment
- **MemoryDatabaseAdapter**: In-memory storage for conversations
- **Actions**: Specific agent capabilities (quiz generation, progress analysis, etc.)
- **Plugin System**: Modular agent functionality

## 🎯 Agent Actions

### Quiz Generation (`generateQuizAction`)
- **Trigger**: Messages containing "quiz", "test", "questions"
- **Capabilities**: Creates subject-specific quizzes with multiple choice questions
- **Subjects**: Mathematics, Japanese, English, Science, General Knowledge
- **Difficulty Levels**: Easy, Medium, Hard

### Progress Analysis (`analyzeProgressAction`)  
- **Trigger**: Messages about "progress", "analytics", "performance"
- **Capabilities**: Analyzes learning data and provides insights
- **Features**: Performance tracking, recommendations, study streaks

### Squad Coordination (`coordinateSquadAction`)
- **Trigger**: Messages about "squad", "group", "partners", "team"
- **Capabilities**: Matches students for study groups
- **Features**: Compatibility scoring, availability matching, subject preferences

## 🔗 Integration with Brain Ink

This agent system is designed to integrate with the Brain Ink platform:

1. **Backend Integration**: Connect to K.A.N.A. backend APIs
2. **Frontend Integration**: Embed chat interface in React components  
3. **Database Integration**: Connect to PostgreSQL for persistent storage
4. **Authentication**: Integrate with Brain Ink user system

## 🛠️ Development

### Build Commands
```bash
npm run build    # Compile TypeScript
npm run clean    # Remove dist folder
npm run dev      # Build and start in development mode
```

### Adding New Agents

1. Create character JSON file in `characters/`
2. Implement actions in `src/actions/`
3. Register actions in `src/plugin.ts`
4. Rebuild and restart

### Custom Actions

```typescript
import { Action, IAgentRuntime, Message, State } from './types/core.js';

export const myCustomAction: Action = {
    name: "MY_ACTION",
    similes: ["CUSTOM", "MY_CUSTOM"],
    description: "My custom action description",
    validate: async (runtime, message, state) => {
        // Return true if this action should handle the message
        return message.content.text.includes('custom');
    },
    handler: async (runtime, message, state, options, callback) => {
        // Process the message and return response
        if (callback) {
            callback({
                text: "Custom response",
                action: "MY_ACTION"
            });
        }
        return true;
    },
    examples: [
        [
            { user: "user", content: { text: "Custom request" } },
            { user: "agent", content: { text: "Custom response" } }
        ]
    ]
};
```

## ✅ Status

- ✅ **Core Runtime**: Fully implemented and working
- ✅ **Agent Actions**: All three agents with complete functionality  
- ✅ **Plugin System**: Modular architecture with plugin support
- ✅ **TypeScript Build**: Clean compilation without errors
- ✅ **HTTP API**: REST endpoints for agent communication
- ✅ **Memory Management**: In-memory database for conversations
- ✅ **Character Loading**: Dynamic character configuration
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Windows Compatible**: Built and tested on Windows

## 🎉 Success!

This ElizaOS-style agent system for Brain Ink is now **fully functional** and ready for integration with your educational platform. The system provides a solid foundation for multi-agent educational assistance with room for expansion and customization.

## 📞 Support

For issues or questions, check the console output for detailed logging and error messages. All agents provide helpful feedback about their operation status.
