import { Client } from '@xmtp/xmtp-js';
import { ethers } from 'ethers';

interface StudyPrompt {
  id: string;
  subject: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  deadline: Date;
}

interface SquadLeaderboard {
  squadId: string;
  squadName: string;
  totalScore: number;
  weeklyScore: number;
  members: number;
  position: number;
}

class XMTPStudyBot {
  private client: Client | null = null;
  private wallet: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;
  private geminiApiKey: string;
  
  // Contract addresses (will be set after deployment)
  private contractAddresses = {
    xpToken: process.env.XP_CONTRACT_ADDRESS || '',
    badgeNFT: '',
    squadScore: '',
    bountyVault: ''
  };

  constructor() {
    // Initialize wallet with private key
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    
    // Base Sepolia testnet configuration
    this.provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
    this.wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY || '', this.provider);
    
    console.log('🤖 XMTP Study Bot initialized with wallet:', this.wallet.address);
  }

  /**
   * Initialize XMTP client
   */
  async initializeXMTP(): Promise<void> {
    try {
      console.log('🔌 Connecting to XMTP network...');
      this.client = await Client.create(this.wallet, { env: 'production' });
      console.log('✅ XMTP client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize XMTP client:', error);
      throw error;
    }
  }

  /**
   * Send daily study prompt to a conversation
   */
  async sendDailyStudyPrompt(conversationTopic: string, userAddress: string): Promise<void> {
    if (!this.client) {
      throw new Error('XMTP client not initialized');
    }

    try {
      const prompt = await this.generateStudyPrompt(userAddress);
      const message = this.formatStudyPromptMessage(prompt);
      
      // Find or create conversation
      const conversations = await this.client.conversations.list();
      let conversation = conversations.find(conv => conv.topic === conversationTopic);
      
      if (!conversation) {
        conversation = await this.client.conversations.newConversation(userAddress);
      }
      
      await conversation.send(message);
      console.log(`📚 Study prompt sent to ${userAddress}`);
      
    } catch (error) {
      console.error('❌ Failed to send study prompt:', error);
      throw error;
    }
  }

  /**
   * Generate study prompt using Gemini AI
   */
  private async generateStudyPrompt(userAddress: string): Promise<StudyPrompt> {
    try {
      // Get user's study history and weak areas from our backend
      const userProfile = await this.getUserStudyProfile(userAddress);
      
      const prompt = `Generate a study question for a student with the following profile:
      Subjects: ${userProfile.subjects.join(', ')}
      Difficulty preference: ${userProfile.preferredDifficulty}
      Weak areas: ${userProfile.weakAreas.join(', ')}
      Recent topics: ${userProfile.recentTopics.join(', ')}
      
      Create a challenging but fair question that helps them improve. Include:
      1. A clear question
      2. The subject area
      3. Difficulty level (easy/medium/hard)
      4. Expected XP reward (10-50 based on difficulty)
      
      Format as JSON.`;

      const response = await this.callGeminiAPI(prompt);
      const generatedPrompt = JSON.parse(response);
      
      return {
        id: `prompt_${Date.now()}`,
        subject: generatedPrompt.subject || 'General',
        question: generatedPrompt.question,
        difficulty: generatedPrompt.difficulty || 'medium',
        xpReward: generatedPrompt.xpReward || 20,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };
      
    } catch (error) {
      console.error('❌ Failed to generate study prompt:', error);
      // Fallback prompt
      return {
        id: `prompt_${Date.now()}`,
        subject: 'Mathematics',
        question: 'What is the derivative of x²?',
        difficulty: 'easy',
        xpReward: 10,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
    }
  }

  /**
   * Process answer submission and provide feedback
   */
  async processAnswerSubmission(
    conversationTopic: string,
    userAddress: string,
    promptId: string,
    answer: string
  ): Promise<void> {
    if (!this.client) {
      throw new Error('XMTP client not initialized');
    }

    try {
      // Get the original prompt
      const originalPrompt = await this.getStoredPrompt(promptId);
      if (!originalPrompt) {
        throw new Error('Prompt not found');
      }

      // Score the answer using Gemini AI
      const feedback = await this.scoreAnswerWithAI(originalPrompt, answer);
      
      // Award XP based on score
      const xpEarned = Math.floor(originalPrompt.xpReward * feedback.scorePercentage / 100);
      if (xpEarned > 0) {
        await this.awardXP(userAddress, xpEarned, `Answer submission for ${originalPrompt.subject}`);
      }

      // Send feedback message
      const feedbackMessage = this.formatFeedbackMessage(feedback, xpEarned);
      
      const conversations = await this.client.conversations.list();
      const conversation = conversations.find(conv => conv.topic === conversationTopic);
      
      if (conversation) {
        await conversation.send(feedbackMessage);
        console.log(`📝 Feedback sent to ${userAddress}, XP awarded: ${xpEarned}`);
      }

      // Update squad score if user is in a squad
      await this.updateSquadScore(userAddress, xpEarned);
      
    } catch (error) {
      console.error('❌ Failed to process answer submission:', error);
      throw error;
    }
  }

  /**
   * Post squad leaderboard updates
   */
  async postSquadLeaderboardUpdate(squadConversationTopic: string): Promise<void> {
    if (!this.client) {
      throw new Error('XMTP client not initialized');
    }

    try {
      const leaderboard = await this.getSquadLeaderboard();
      const message = this.formatLeaderboardMessage(leaderboard);
      
      const conversations = await this.client.conversations.list();
      const conversation = conversations.find(conv => conv.topic === squadConversationTopic);
      
      if (conversation) {
        await conversation.send(message);
        console.log('📊 Squad leaderboard update posted');
      }
      
    } catch (error) {
      console.error('❌ Failed to post leaderboard update:', error);
      throw error;
    }
  }

  /**
   * Handle random agent drops
   */
  async triggerAgentDrop(userAddress: string, conversationTopic: string): Promise<void> {
    if (!this.client) {
      throw new Error('XMTP client not initialized');
    }

    try {
      const bonusXP = 25 + Math.floor(Math.random() * 25); // 25-50 XP bonus
      await this.awardXP(userAddress, bonusXP, 'Agent Drop Bonus');
      
      const message = `🎁 **AGENT DROP!** 🎁\n\nCongratulations! You've received a random bonus of ${bonusXP} XP!\n\nKeep studying to increase your chances of more drops! 📚✨`;
      
      const conversations = await this.client.conversations.list();
      const conversation = conversations.find(conv => conv.topic === conversationTopic);
      
      if (conversation) {
        await conversation.send(message);
        console.log(`🎁 Agent drop sent to ${userAddress}: ${bonusXP} XP`);
      }
      
    } catch (error) {
      console.error('❌ Failed to trigger agent drop:', error);
      throw error;
    }
  }

  /**
   * Award XP tokens on-chain
   */
  private async awardXP(userAddress: string, amount: number, reason: string): Promise<void> {
    try {
      if (!this.contractAddresses.xpToken) {
        console.warn('⚠️ XP contract address not set, skipping on-chain XP award');
        return;
      }

      // XP Token contract ABI (simplified)
      const xpTokenABI = [
        "function mintXP(address user, uint256 baseAmount, string memory reason) external"
      ];
      
      const xpTokenContract = new ethers.Contract(
        this.contractAddresses.xpToken,
        xpTokenABI,
        this.wallet
      );
      
      const tx = await xpTokenContract.mintXP(
        userAddress,
        ethers.parseEther(amount.toString()),
        reason
      );
      
      await tx.wait();
      console.log(`⚡ ${amount} XP awarded to ${userAddress} on-chain`);
      
    } catch (error) {
      console.error('❌ Failed to award XP on-chain:', error);
      // Continue execution even if blockchain interaction fails
    }
  }

  /**
   * Update squad score on-chain
   */
  private async updateSquadScore(userAddress: string, scoreIncrease: number): Promise<void> {
    try {
      if (!this.contractAddresses.squadScore) {
        console.warn('⚠️ Squad score contract address not set');
        return;
      }

      // Squad Score contract ABI (simplified)
      const squadScoreABI = [
        "function updateSquadScore(uint256 squadId, uint256 scoreIncrease, address triggeredBy) external",
        "function userSquad(address user) external view returns (uint256)"
      ];
      
      const squadScoreContract = new ethers.Contract(
        this.contractAddresses.squadScore,
        squadScoreABI,
        this.wallet
      );
      
      // Get user's squad ID
      const squadId = await squadScoreContract.userSquad(userAddress);
      
      if (squadId > 0) {
        const tx = await squadScoreContract.updateSquadScore(squadId, scoreIncrease, userAddress);
        await tx.wait();
        console.log(`👥 Squad score updated: +${scoreIncrease} for squad ${squadId}`);
      }
      
    } catch (error) {
      console.error('❌ Failed to update squad score:', error);
    }
  }

  /**
   * Call Gemini AI API
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
      
    } catch (error) {
      console.error('❌ Gemini API call failed:', error);
      throw error;
    }
  }

  /**
   * Score answer using AI
   */
  private async scoreAnswerWithAI(prompt: StudyPrompt, answer: string): Promise<{
    scorePercentage: number;
    feedback: string;
    isCorrect: boolean;
  }> {
    try {
      const scoringPrompt = `
      You are an educational AI scoring student answers. 
      
      Original Question: ${prompt.question}
      Subject: ${prompt.subject}
      Difficulty: ${prompt.difficulty}
      Student Answer: ${answer}
      
      Please score this answer on a scale of 0-100 and provide constructive feedback.
      Consider:
      1. Correctness of the answer
      2. Completeness of explanation
      3. Understanding demonstrated
      
      Respond in JSON format with:
      {
        "scorePercentage": number (0-100),
        "feedback": "detailed feedback text",
        "isCorrect": boolean
      }`;

      const response = await this.callGeminiAPI(scoringPrompt);
      return JSON.parse(response);
      
    } catch (error) {
      console.error('❌ Failed to score answer with AI:', error);
      return {
        scorePercentage: 50,
        feedback: "Unable to score answer automatically. Please review with instructor.",
        isCorrect: false
      };
    }
  }

  /**
   * Format study prompt message
   */
  private formatStudyPromptMessage(prompt: StudyPrompt): string {
    return `📚 **Daily Study Challenge** 📚

**Subject:** ${prompt.subject}
**Difficulty:** ${prompt.difficulty.toUpperCase()}
**XP Reward:** ${prompt.xpReward} XP

**Question:**
${prompt.question}

Reply with your answer to earn XP! You have 24 hours to respond.

Good luck! 🚀`;
  }

  /**
   * Format feedback message
   */
  private formatFeedbackMessage(feedback: any, xpEarned: number): string {
    const emoji = feedback.isCorrect ? '✅' : '📝';
    return `${emoji} **Answer Feedback**

**Score:** ${feedback.scorePercentage}%
**XP Earned:** ${xpEarned} XP

**Feedback:**
${feedback.feedback}

Keep up the great work! 🌟`;
  }

  /**
   * Format leaderboard message
   */
  private formatLeaderboardMessage(leaderboard: SquadLeaderboard[]): string {
    let message = "🏆 **Weekly Squad Leaderboard** 🏆\n\n";
    
    leaderboard.slice(0, 10).forEach((squad, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      message += `${medal} **${squad.squadName}**\n`;
      message += `   Weekly Score: ${squad.weeklyScore} | Members: ${squad.members}\n\n`;
    });
    
    message += "Keep studying to climb the ranks! 📚⚡";
    return message;
  }

  // Placeholder methods for data storage/retrieval
  private async getUserStudyProfile(userAddress: string): Promise<any> {
    // In production, this would fetch from your backend
    return {
      subjects: ['Mathematics', 'Physics', 'Chemistry'],
      preferredDifficulty: 'medium',
      weakAreas: ['Calculus', 'Quantum Physics'],
      recentTopics: ['Derivatives', 'Wave Functions']
    };
  }

  private async getStoredPrompt(promptId: string): Promise<StudyPrompt | null> {
    // In production, this would fetch from your database
    return null;
  }

  private async getSquadLeaderboard(): Promise<SquadLeaderboard[]> {
    // In production, this would fetch from blockchain or database
    return [];
  }
}

export { XMTPStudyBot };
