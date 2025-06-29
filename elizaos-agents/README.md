# Brain Ink ElizaOS Integration

This directory contains the ElizaOS agent integration for Brain Ink.

## Setup Instructions

1. Install ElizaOS CLI globally:
```bash
bun install -g @elizaos/cli
```

2. Install dependencies:
```bash
bun install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Start agents:
```bash
elizaos start
```

## Project Structure

- `characters/` - Agent character definitions
- `src/` - Custom plugin and integration code
- `.env` - Environment configuration
- `package.json` - Dependencies and scripts

## Agents

- **K.A.N.A. Educational Tutor** - Primary educational assistant
- **Squad Learning Coordinator** - Group learning management
- **Learning Progress Analyst** - Data analysis and insights
