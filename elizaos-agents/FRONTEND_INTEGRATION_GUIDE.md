# 🚀 Brain Ink Agent Frontend Integration Guide

Your AI agents are now running successfully! Here's how to integrate them with your Brain Ink frontend.

## 🎯 Available Agents & Endpoints

Your agent service is running on `http://localhost:3001` with these endpoints:

- **Health Check**: `GET /health`
- **List Agents**: `GET /agents`
- **Chat**: `POST /chat/:agentName`

### Available Agents:
1. **Kana Tutor** 🇯🇵 - Japanese language learning specialist
2. **Progress Analyst** 📊 - Learning analytics and progress tracking  
3. **Squad Coordinator** 👥 - Study group formation

## 🔧 Integration Options

### 1. **HTML Test Interface** (Ready to Use)
Open `test-interface.html` in your browser to test the agents immediately:
```bash
# Open in browser
file:///C:/Users/user/Desktop/BrainInk/elizaos-agents/test-interface.html
```

### 2. **React Component Integration**
Use the `AgentChat.tsx` component in your React app:

```tsx
import AgentChat from './path/to/AgentChat';

function MyComponent() {
    return (
        <div>
            <h2>AI Learning Assistant</h2>
            <AgentChat 
                apiBaseUrl="http://localhost:3001"
                defaultAgent="Kana Tutor"
                onMessageSent={(msg, agent) => console.log('Sent:', msg)}
                onAgentResponse={(response, action) => {
                    if (action === 'QUIZ_GENERATED') {
                        // Handle quiz generation
                    }
                }}
            />
        </div>
    );
}
```

### 3. **Vanilla JavaScript Integration**
For non-React parts of your app, use `brain-ink-agent-client.js`:

```html
<script src="brain-ink-agent-client.js"></script>
<script>
    const agentClient = initBrainInkAgents();
    
    // Generate a quiz
    agentClient.generateQuiz('japanese', 'easy');
    
    // Analyze progress
    agentClient.analyzeProgress();
    
    // Find study partners
    agentClient.findStudyPartners('chemistry');
</script>
```

## 🧪 Quick Testing

### Test with cURL:
```bash
# Test health
curl http://localhost:3001/health

# List agents
curl http://localhost:3001/agents

# Chat with Kana Tutor
curl -X POST http://localhost:3001/chat/Kana%20Tutor \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a Japanese quiz", "userId": "test123"}'

# Chat with Progress Analyst
curl -X POST http://localhost:3001/chat/Progress%20Analyst \
  -H "Content-Type: application/json" \
  -d '{"message": "Show my learning progress", "userId": "test123"}'

# Chat with Squad Coordinator
curl -X POST http://localhost:3001/chat/Squad%20Coordinator \
  -H "Content-Type: application/json" \
  -d '{"message": "Find study partners for chemistry", "userId": "test123"}'
```

### Test with JavaScript (in browser console):
```javascript
// Test the API directly
fetch('http://localhost:3001/agents')
  .then(r => r.json())
  .then(console.log);

// Send a message
fetch('http://localhost:3001/chat/Kana Tutor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Create a Japanese quiz',
    userId: 'browser-test'
  })
})
.then(r => r.json())
.then(console.log);
```

## 🎮 Interactive Examples

### 1. **Quiz Generation**
```javascript
// Request a quiz
POST /chat/Kana%20Tutor
{
  "message": "Create a medium difficulty Japanese quiz with 5 questions",
  "userId": "student123"
}

// Expected response format:
{
  "response": "🧠 **Quiz Generated: Japanese**\n\n**Difficulty:** medium\n**Questions:** 5\n\n**1.** What does あ represent?\n...",
  "action": "QUIZ_GENERATED"
}
```

### 2. **Progress Analysis**
```javascript
// Request progress analysis
POST /chat/Progress%20Analyst
{
  "message": "How am I doing in my studies?",
  "userId": "student123"
}

// Expected response:
{
  "response": "📊 **Learning Progress Analysis**\n\n**Overall Performance:** B+ (87%)\n...",
  "action": "PROGRESS_ANALYZED"
}
```

### 3. **Study Group Formation**
```javascript
// Find study partners
POST /chat/Squad%20Coordinator
{
  "message": "I need study partners for chemistry who can meet evenings",
  "userId": "student123"
}

// Expected response:
{
  "response": "🤝 **Study Squad Coordination**\n\n**Subject Focus:** Chemistry\n...",
  "action": "SQUAD_COORDINATED"
}
```

## 🔗 Integration with Existing Brain Ink Features

### Connect to K.A.N.A. Backend
Update the agent actions to call your existing K.A.N.A. backend:

```typescript
// In generateQuiz.ts action
const kanaResponse = await fetch('http://localhost:3000/api/generate-quiz', {
  method: 'POST',
  body: JSON.stringify({ subject, difficulty, userId })
});
```

### Connect to User Database
Modify the database adapter to use your PostgreSQL database:

```typescript
// In MemoryAdapter.ts, replace with real DB calls
async saveMemory(memory: Memory): Promise<void> {
  await fetch('/api/save-conversation', {
    method: 'POST',
    body: JSON.stringify(memory)
  });
}
```

### Integrate with Authentication
Pass real user tokens to the agents:

```typescript
// In frontend
const response = await fetch(`/chat/${agent}`, {
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ message, userId: currentUser.id })
});
```

## 🎨 Styling & Customization

### CSS Classes for Styling
The React component includes these customizable classes:
- `.agent-chat` - Main container
- `.agent-header` - Header section
- `.messages-container` - Messages area
- `.message` - Individual message
- `.input-container` - Input area

### Theme Integration
Match your Brain Ink theme colors:

```css
.agent-chat {
  --primary-color: #your-brand-color;
  --secondary-color: #your-secondary-color;
  --background-color: #your-background;
}
```

## 🚀 Production Deployment

### Environment Configuration
Update your `.env` file:

```env
# Development
AGENT_API_URL=http://localhost:3001

# Production
AGENT_API_URL=https://your-domain.com/api/agents
```

### CORS Configuration
The agent service already includes CORS support. For production, restrict origins:

```typescript
app.use(cors({
  origin: ['https://your-brainink-domain.com'],
  credentials: true
}));
```

## 📊 Monitoring & Analytics

### Track Agent Usage
```javascript
// Track which agents are used most
const handleAgentInteraction = (agentName, action) => {
  analytics.track('Agent Interaction', {
    agent: agentName,
    action: action,
    timestamp: Date.now(),
    userId: currentUser.id
  });
};
```

### Monitor Performance
```javascript
// Track response times
const startTime = Date.now();
await sendMessage(agent, message);
const responseTime = Date.now() - startTime;

analytics.track('Agent Response Time', {
  agent,
  responseTime,
  messageLength: message.length
});
```

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure agent service is running on port 3001
2. **Connection Failed**: Check if `npm start` is running in agent directory
3. **Agent Not Found**: Use exact agent names: "Kana Tutor", "Progress Analyst", "Squad Coordinator"

### Debug Mode:
```javascript
// Enable debug logging
const agentClient = new BrainInkAgentClient({
  apiBaseUrl: 'http://localhost:3001',
  debug: true,
  onMessage: console.log,
  onError: console.error
});
```

## 🎉 You're Ready!

Your Brain Ink AI agents are now fully integrated and ready to enhance your educational platform! The agents can:

- Generate personalized quizzes
- Analyze learning progress
- Coordinate study groups
- Provide interactive educational assistance

Start with the HTML test interface, then gradually integrate the React components and JavaScript client into your existing Brain Ink application.
