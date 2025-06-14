# BrainInk XMTP + AgentKit AI Study Bot

A comprehensive AI-powered study messaging system built for the Base Batches Messaging Buildathon.

## Features

🧠 **AI Study Assistant**: Gemini-powered AI agent that provides study prompts, feedback, and personalized recommendations  
💬 **XMTP Messaging**: Decentralized messaging with direct messages, group chats, and squad rooms  
🎮 **Gamification**: XP tokens, NFT badges, streaks, multipliers, and achievement system  
👥 **Squad Competitions**: Team-based challenges, leaderboards, and collaborative learning  
🔗 **Smart Contracts**: On-chain XP tracking, badge minting, squad scoring, and bounty rewards  
🎯 **Daily Challenges**: Automated quiz drops, study prompts, and agent rewards  
🤖 **AgentKit Integration**: Blockchain-aware agent actions and automated rewards  

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Messaging**: XMTP Protocol
- **AI**: Google Gemini API
- **Blockchain**: Base (Ethereum L2), Solidity
- **Backend**: Node.js, Express
- **Agent Framework**: Coinbase AgentKit

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Wallet with Base Sepolia ETH
- Gemini API key

### Installation

1. **Clone and setup**
   ```bash
   cd messages
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Fill in your actual values in .env
   ```

3. **Deploy Smart Contracts** (if needed)
   ```bash
   cd ../blockchain
   npm install
   npx hardhat run scripts/deployBrainInkContracts.ts --network base-sepolia
   ```

4. **Start Development Server**
   ```bash
   cd ../messages
   npm run dev
   ```

### Environment Variables

Set these in your `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key
WALLET_PRIVATE_KEY=your_wallet_private_key
WALLET_ADDRESS=your_wallet_address
PORT=3001
```

## Architecture

### Smart Contracts
- **XPToken.sol**: ERC-20 token for experience points with staking and multipliers
- **BadgeNFT.sol**: ERC-721 for achievement badges with rarity and metadata
- **SquadScore.sol**: Squad leaderboards and competitive challenges
- **BountyVault.sol**: Reward distribution and staking mechanisms

### Services
- **XMTP Study Bot**: Core messaging and AI integration
- **AI Agent Service**: Gemini-powered study assistance and blockchain interactions
- **Tribe Matching**: User embeddings and similarity-based squad recommendations
- **Backend API**: RESTful endpoints for all frontend features

### Components
- **SuperEnhancedMessagingHub**: Main UI with all tabs and notifications
- **AI Agent Chat**: Interactive study chat with the AI assistant
- **Squad Panels**: Team collaboration and competition interfaces
- **Study Leagues**: Tournament-style competitive learning

## API Endpoints

### Chat & AI
- `POST /api/chat` - Send message to AI agent
- `GET /api/daily-prompt` - Get today's study prompt
- `POST /api/submit-answer` - Submit quiz/prompt answer

### Gamification
- `GET /api/stats/:address` - User stats and progress
- `GET /api/leaderboard` - Squad leaderboards
- `GET /api/achievements/:address` - User badges and achievements

### Agent System
- `POST /api/agent-drop` - Trigger agent reward drop
- `GET /api/recommendations/:address` - Personalized study suggestions

## Development

### Adding New Features

1. **Smart Contracts**: Add to `../blockchain/contracts/`
2. **Backend APIs**: Add to `services/backendAPI.ts`
3. **Frontend Components**: Add to `components/`
4. **AI Prompts**: Update `services/aiAgentService.tsx`

### Testing

```bash
# Backend tests
npm test

# Smart contract tests
cd ../blockchain
npx hardhat test
```

## Deployment

### Smart Contracts
```bash
cd ../blockchain
npx hardhat run scripts/deployBrainInkContracts.ts --network base-sepolia
```

### Backend Service
```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Buildathon Submission

This project is submitted to the Base Batches Messaging Buildathon with the following key implementations:

✅ **XMTP Integration**: Full messaging protocol implementation  
✅ **AgentKit Usage**: Blockchain-aware AI agent with automated actions  
✅ **Base Integration**: Smart contracts deployed on Base Sepolia  
✅ **Educational Focus**: AI-powered study assistance and gamified learning  
✅ **Open Source**: MIT licensed with comprehensive documentation  

---

Built with ❤️ for the Base Batches Messaging Buildathon
