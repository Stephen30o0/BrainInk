# 🏆 BrainInk Tournament System Integration

## Overview

The BrainInk tournament system is now fully integrated with:
- **Backend API**: Full tournament management with PostgreSQL
- **Chainlink Automation**: AI-powered question generation
- **Configurable Quizzes**: 7-15 questions per match
- **Real-time Matching**: Tournament brackets and live competitions

## 🚀 Quick Start

### 1. Ensure Backend is Running
```bash
cd kana-backend
npm start
# Server should start on localhost:10000
```

### 2. Import Components in Your App
```tsx
import { TournamentDashboard } from './components/tournaments/TournamentDashboard';
import { TournamentCreation } from './components/tournaments/TournamentCreation';
import { QuizMatch } from './components/tournaments/QuizMatch';
import { backendTournamentService } from './services/backendTournamentService';
```

### 3. Basic Tournament Dashboard Usage
```tsx
function App() {
  const userAddress = "0x1234..."; // User's wallet address

  return (
    <TournamentDashboard userAddress={userAddress} />
  );
}
```

## 🎯 Key Features

### Tournament Creation with AI Integration
- **Configurable Questions**: Choose 7-15 questions per match
- **AI-Powered Content**: Questions generated via Chainlink + Kana AI
- **Multiple Subjects**: 25+ subject categories available
- **Custom Topics**: Add your own custom topics
- **Difficulty Levels**: Easy, Medium, Hard
- **Real-time Preview**: Preview Chainlink-generated questions before creating

### Tournament Management
- **Public/Private Tournaments**: Control visibility
- **Player Limits**: 4, 8, 16, 32, or 64 players
- **Entry Fees & Prizes**: Optional INK token integration
- **Invitation System**: Invite specific players
- **Real-time Status**: Track registration, active, completed states

### Quiz Gameplay
- **Timed Matches**: Configurable time limits (5-120 minutes)
- **Progressive Questions**: Navigate forward/backward through quiz
- **Real-time Timer**: Visual countdown with warnings
- **Instant Results**: Detailed scoring and explanations
- **Match Completion**: Automatic winner determination

## 🔗 API Integration

### Backend Tournament Service
```tsx
import { backendTournamentService } from './services/backendTournamentService';

// Initialize with user address
backendTournamentService.initialize(userAddress);

// Create a tournament
const result = await backendTournamentService.createTournament({
  name: "AI Quiz Championship",
  creator_address: userAddress,
  max_players: 16,
  questions_per_match: 12, // 7-15 questions
  difficulty_level: "medium",
  subject_category: "computer-science",
  custom_topics: ["machine-learning", "web-development"],
  time_limit_minutes: 30
});

// Join a tournament
await backendTournamentService.joinTournament(tournamentId, userAddress);

// Start tournament (creator only)
await backendTournamentService.startTournament(tournamentId, userAddress);

// Generate questions with Chainlink + AI
const questions = await backendTournamentService.generateQuestionsForMatch(
  tournamentId, 
  matchId
);
```

### Chainlink Integration
```tsx
// Generate AI questions for any subject
const questions = await backendTournamentService.generateChainlinkQuestions(
  "mathematics",     // Subject
  "hard",           // Difficulty 
  10                // Number of questions (7-15)
);
```

## 🧠 Question Generation

### Available Subjects
- Mathematics, Physics, Chemistry, Biology
- History, Geography, Literature
- Computer Science, Psychology, Economics
- Astronomy, Art History, Philosophy
- Environmental Science, Anatomy, Genetics
- And 15+ more subjects...

### Custom Topics
Add specific topics to focus questions:
```tsx
custom_topics: [
  "react-development", 
  "blockchain-technology", 
  "machine-learning-algorithms"
]
```

### Question Format
```json
{
  "question": "What is the time complexity of quicksort?",
  "options": {
    "A": "O(n)",
    "B": "O(n log n)", 
    "C": "O(n²)",
    "D": "O(log n)"
  },
  "correct_answer": "B",
  "explanation": "Quicksort has average time complexity O(n log n)"
}
```

## 🎮 Component Usage

### Tournament Creation Modal
```tsx
<TournamentCreation
  userAddress={userAddress}
  onTournamentCreated={(tournamentId) => {
    console.log(`Tournament created: ${tournamentId}`);
  }}
  onClose={() => setShowModal(false)}
/>
```

### Quiz Match Component
```tsx
<QuizMatch
  tournamentId="tournament-123"
  matchId="match-456"
  userAddress={userAddress}
  onMatchComplete={(result) => {
    console.log(`Score: ${result.score}%`);
  }}
/>
```

### Full Integration Example
```tsx
import React from 'react';
import { TournamentIntegration } from './pages/TournamentIntegration';

function App() {
  const userAddress = "0x1234567890123456789012345678901234567890";
  
  return (
    <div className="min-h-screen bg-dark">
      <TournamentIntegration userAddress={userAddress} />
    </div>
  );
}
```

## 🛠 Configuration Options

### Tournament Settings
```tsx
{
  name: string;                    // Tournament name
  description?: string;            // Optional description
  max_players: 4|8|16|32|64;      // Player limits
  questions_per_match: 7-15;      // Configurable question count
  time_limit_minutes: 5-120;      // Time limit per match
  difficulty_level: "easy"|"medium"|"hard";
  subject_category: string;        // From available subjects
  custom_topics: string[];         // Custom topic focus
  entry_fee?: number;             // Optional INK tokens
  prize_pool?: number;            // Optional prize
  is_public: boolean;             // Public visibility
}
```

### Question Generation
```tsx
{
  subject: string;                 // Subject category
  difficulty: "easy"|"medium"|"hard";
  questionCount: 7-15;            // Number of questions
  customTopics?: string[];        // Optional topic focus
}
```

## 🔄 Tournament Lifecycle

1. **Creation**: User creates tournament with 7-15 question configuration
2. **Registration**: Players join (up to max_players limit)
3. **Invitation**: Creator can invite specific players
4. **Start**: Creator starts tournament → brackets generated
5. **Matches**: Players compete in timed quiz matches
6. **Questions**: AI generates questions via Chainlink + Kana AI
7. **Scoring**: Automatic scoring with detailed results
8. **Winners**: Tournament progresses through elimination rounds
9. **Completion**: Final winner determined and prizes distributed

## 🎯 Benefits

- **Scalable**: Supports 4-64 player tournaments
- **Flexible**: 7-15 questions configurable per match
- **AI-Powered**: Dynamic question generation via Chainlink
- **Secure**: Backend API with PostgreSQL persistence
- **Real-time**: Live tournament status and match updates
- **Educational**: 25+ subjects with custom topic support
- **Competitive**: Timed matches with leaderboards

## 🚀 Next Steps

1. Add the components to your routing
2. Style with your design system
3. Integrate with wallet connection
4. Add notifications for match invitations
5. Implement tournament chat/messaging
6. Add tournament statistics and history

The tournament system is now ready for production use with full Chainlink + AI integration!
