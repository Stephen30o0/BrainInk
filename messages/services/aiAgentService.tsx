interface AIMessage {
  id: string;
  agent: 'kana';
  content: string;
  type: 'text' | 'quiz' | 'explanation' | 'suggestion' | 'leaderboard' | 'achievement';
  timestamp: string;
  metadata?: any;
}

interface QuizDrop {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xp_reward: number;
}

interface UserProfile {
  address: string;
  xpBalance: number;
  streak: number;
  badges: number[];
  squadId: number;
  weeklyXP: number;
  totalXP: number;
}

interface AgentDrop {
  id: string;
  type: 'xp_bonus' | 'quiz_challenge' | 'study_tip' | 'motivation';
  content: string;
  xp_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

class AIAgentService {
  private readonly BACKEND_API_BASE = 'https://kana-backend-app.onrender.com';
  
  constructor() {
    // Frontend service - connects to backend API
  }

  async getWelcomeMessage(): Promise<AIMessage> {
    const userProfile = await this.getUserProfile();
    const greeting = this.generatePersonalizedGreeting(userProfile);
    
    return {
      id: `kana_welcome_${Date.now()}`,
      agent: 'kana',
      content: greeting,
      type: 'text',
      timestamp: new Date().toISOString(),
      metadata: { userProfile }
    };
  }

  async sendMessageToAgent(message: string, context?: any): Promise<AIMessage> {
    try {
      // Enhanced AI processing with Gemini
      const response = await this.processMessageWithGemini(message, context);
      
      // Check for special commands or triggers
      if (message.toLowerCase().includes('leaderboard')) {
        return await this.getSquadLeaderboard();
      }
      
      if (message.toLowerCase().includes('my stats') || message.toLowerCase().includes('profile')) {
        return await this.getUserStatsMessage();
      }
      
      if (message.toLowerCase().includes('challenge') || message.toLowerCase().includes('bounty')) {
        return await this.suggestChallenges();
      }

      return {
        id: `kana_${Date.now()}`,
        agent: 'kana',
        content: response.content,
        type: (response.type as any) || 'text',
        timestamp: new Date().toISOString(),
        metadata: response.metadata
      };
    } catch (error) {
      console.error(`Error communicating with Kana:`, error);
      return {
        id: `kana_error_${Date.now()}`,
        agent: 'kana',
        content: `Sorry, I'm having trouble connecting right now. Please try again later.`,
        type: 'text',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getQuizDrop(subject?: string, difficulty?: string): Promise<QuizDrop> {
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      if (subject) params.append('subject', subject);
      if (difficulty) params.append('difficulty', difficulty);

      const response = await fetch(`${this.BACKEND_API_BASE}/quiz-drop?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Quiz drop error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting quiz drop:', error);
      // Fallback quiz
      return {
        id: `quiz_${Date.now()}`,
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correct_answer: 2,
        explanation: "Paris is the capital and most populous city of France.",
        subject: "Geography",
        difficulty: "easy",
        xp_reward: 10
      };
    }
  }

  async submitQuizAnswer(quizId: string, answer: number): Promise<{
    correct: boolean;
    explanation: string;
    xp_earned: number;
  }> {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${this.BACKEND_API_BASE}/quiz-drop/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answer,
          user_id: this.getUserId()
        })
      });

      if (!response.ok) {
        throw new Error(`Quiz submission error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting quiz answer:', error);
      return {
        correct: false,
        explanation: "Unable to verify answer at this time.",
        xp_earned: 0
      };
    }
  }

  async getPersonalizedSuggestions(): Promise<string[]> {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${this.BACKEND_API_BASE}/suggestions/${this.getUserId()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Suggestions error: ${response.status}`);
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [
        "Review your weak topics in Mathematics",
        "Practice more Chemistry problems",
        "Join a Physics study group"
      ];
    }
  }  /**
   * Process message with Gemini AI via kana-backend
   */
  private async processMessageWithGemini(message: string, context?: any): Promise<{
    content: string;
    type: string;
    metadata?: any;
  }> {
    try {
      const userProfile = await this.getUserProfile();
      
      const response = await fetch(`${this.BACKEND_API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: `user_${userProfile.address || 'default'}`,
          message,
          history: []
        })
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        content: data.kanaResponse || data.response || 'Sorry, I encountered an error.',
        type: 'text',
        metadata: data.metadata
      };
      
    } catch (error) {
      console.error('Gemini AI error:', error);
      return {
        content: "I'm having trouble processing that right now. Could you try rephrasing?",
        type: 'text'
      };
    }
  }
  /**
   * Get user profile from blockchain and local storage
   */  private async getUserProfile(): Promise<UserProfile> {
    try {
      const walletAddress = this.getWalletAddress();
      if (!walletAddress) {
        return this.getDefaultProfile();
      }

      // Get user stats from main backend API (not kana-backend)
      // Import and use the main apiService instead of direct fetch to kana-backend
      let xpBalance = 0;
      let streak = 0;
      
      try {
        // Try to get data from main backend microservice
        const MAIN_BACKEND_API = 'https://brainink-backend.onrender.com';
        const response = await fetch(`${MAIN_BACKEND_API}/api/user-stats/${walletAddress}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
          },
        });

        if (response.ok) {
          const stats = await response.json();
          xpBalance = stats.xpBalance || stats.total_xp || 0;
          streak = stats.streak || stats.login_streak || 0;
        }
      } catch (error) {
        console.warn('Could not fetch user stats from main backend:', error);
      }

      return {
        address: walletAddress,
        xpBalance,
        streak,
        badges: [], // TODO: Fetch from main backend user achievements
        squadId: 0, // TODO: Fetch from main backend squad membership
        weeklyXP: 0,
        totalXP: xpBalance
      };
      
    } catch (error) {
      console.error('Error getting user profile:', error);
      return this.getDefaultProfile();
    }
  }

  /**
   * Generate personalized greeting based on user profile
   */
  private generatePersonalizedGreeting(userProfile: UserProfile): string {
    const greetings = [
      `Welcome back! 📚 You have ${userProfile.xpBalance} XP`,
      `Hey there, scholar! 🎓 Your ${userProfile.streak}-day streak is impressive!`,
      `Ready to learn? ⚡ Let's boost that XP balance!`
    ];
    
    let greeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    if (userProfile.streak >= 7) {
      greeting += `\n\n🔥 Amazing ${userProfile.streak}-day streak! You're on fire!`;
    }
    
    if (userProfile.badges.length > 0) {
      greeting += `\n\n🏆 You've earned ${userProfile.badges.length} badges so far!`;
    }
    
    if (userProfile.squadId === 0) {
      greeting += `\n\n👥 Consider joining a study squad to earn bonus XP and compete on leaderboards!`;
    }
    
    greeting += `\n\nI'm Kana, your AI study coach. I can help with:\n• Daily study challenges\n• Quiz drops for instant XP\n• Study explanations\n• Squad leaderboards\n• Achievement tracking\n\nWhat would you like to work on today?`;
    
    return greeting;
  }

  /**
   * Get squad leaderboard message
   */
  private async getSquadLeaderboard(): Promise<AIMessage> {
    try {
      // TODO: Fetch real leaderboard data from SquadScore contract
      const mockLeaderboard = [
        { name: "Brain Busters", score: 1250, members: 8 },
        { name: "Study Warriors", score: 1100, members: 6 },
        { name: "Knowledge Seekers", score: 980, members: 7 },
        { name: "Academic Aces", score: 850, members: 5 },
        { name: "Learning Legends", score: 720, members: 4 }
      ];

      let content = "🏆 **Weekly Squad Leaderboard** 🏆\n\n";
      
      mockLeaderboard.forEach((squad, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        content += `${medal} **${squad.name}**\n`;
        content += `   Score: ${squad.score} • Members: ${squad.members}\n\n`;
      });
      
      content += "Want to climb the ranks? Join a squad and start earning XP together! 🚀";
      
      return {
        id: `leaderboard_${Date.now()}`,
        agent: 'kana',
        content,
        type: 'leaderboard',
        timestamp: new Date().toISOString(),
        metadata: { leaderboard: mockLeaderboard }
      };
      
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return {
        id: `leaderboard_error_${Date.now()}`,
        agent: 'kana',
        content: "Sorry, I couldn't fetch the leaderboard right now. Try again later!",
        type: 'text',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get user stats message
   */
  private async getUserStatsMessage(): Promise<AIMessage> {
    try {
      const profile = await this.getUserProfile();
      
      let content = `📊 **Your Study Stats** 📊\n\n`;
      content += `⚡ **XP Balance:** ${profile.xpBalance}\n`;
      content += `🔥 **Current Streak:** ${profile.streak} days\n`;
      content += `🏆 **Badges Earned:** ${profile.badges.length}\n`;
      content += `📈 **Weekly XP:** ${profile.weeklyXP}\n`;
      content += `🎯 **Total XP:** ${profile.totalXP}\n\n`;
      
      if (profile.squadId > 0) {
        content += `👥 **Squad:** Member of Squad ${profile.squadId}\n\n`;
      } else {
        content += `👥 **Squad:** Not in a squad yet - join one for bonus XP!\n\n`;
      }
      
      // Add motivational message based on stats
      if (profile.streak >= 30) {
        content += `🌟 Incredible dedication! You're a true study champion!`;
      } else if (profile.streak >= 7) {
        content += `💪 Great consistency! Keep that streak alive!`;
      } else if (profile.xpBalance >= 1000) {
        content += `🎓 Impressive XP balance! You're becoming a true scholar!`;
      } else {
        content += `🚀 Keep learning and watch your XP grow!`;
      }
      
      return {
        id: `stats_${Date.now()}`,
        agent: 'kana',
        content,
        type: 'text',
        timestamp: new Date().toISOString(),
        metadata: { userProfile: profile }
      };
      
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        id: `stats_error_${Date.now()}`,
        agent: 'kana',
        content: "I couldn't fetch your stats right now. Please try again!",
        type: 'text',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Suggest challenges and bounties
   */
  private async suggestChallenges(): Promise<AIMessage> {
    const challenges = [
      {
        title: "Daily Quiz Master",
        description: "Complete 5 quizzes in different subjects",
        reward: "100 XP + Quiz Master badge",
        difficulty: "Medium"
      },
      {
        title: "Streak Warrior",
        description: "Maintain a 14-day study streak",
        reward: "250 XP + Streak Warrior badge",
        difficulty: "Hard"
      },
      {
        title: "Knowledge Sharer",
        description: "Help 3 squad members with explanations",
        reward: "150 XP + Mentor badge",
        difficulty: "Easy"
      },
      {
        title: "Perfect Score Challenge",
        description: "Get 100% on 3 consecutive quizzes",
        reward: "200 XP + Perfect Score badge",
        difficulty: "Hard"
      }
    ];
    
    let content = `🎯 **Available Challenges** 🎯\n\n`;
    
    challenges.forEach((challenge) => {
      const difficultyEmoji = challenge.difficulty === 'Easy' ? '🟢' : 
                             challenge.difficulty === 'Medium' ? '🟡' : '🔴';
      
      content += `${difficultyEmoji} **${challenge.title}**\n`;
      content += `${challenge.description}\n`;
      content += `💰 Reward: ${challenge.reward}\n\n`;
    });
    
    content += `Ready to take on a challenge? Start studying and I'll track your progress! 🚀`;
    
    return {
      id: `challenges_${Date.now()}`,
      agent: 'kana',
      content,
      type: 'suggestion',
      timestamp: new Date().toISOString(),
      metadata: { challenges }
    };
  }

  /**
   * Trigger random agent drop
   */
  async triggerAgentDrop(): Promise<AgentDrop> {
    const drops = [
      {
        type: 'xp_bonus' as const,
        content: '🎁 Surprise XP Bonus! Keep up the great work!',
        xp_reward: 25,
        rarity: 'common' as const
      },
      {
        type: 'quiz_challenge' as const,
        content: '⚡ Special Quiz Challenge! Answer correctly for bonus XP!',
        xp_reward: 50,
        rarity: 'rare' as const
      },
      {
        type: 'study_tip' as const,
        content: '💡 Pro Study Tip: Use the Pomodoro Technique - 25min focus, 5min break!',
        xp_reward: 15,
        rarity: 'common' as const
      },
      {
        type: 'motivation' as const,
        content: '🌟 "The expert in anything was once a beginner." - Keep pushing forward!',
        xp_reward: 10,
        rarity: 'common' as const
      }
    ];
    
    const drop = drops[Math.floor(Math.random() * drops.length)];
    
    return {
      id: `drop_${Date.now()}`,
      ...drop
    };
  }  /**
   * Award XP via main backend API (not kana-backend)
   * This ensures all user data is stored centrally in the main backend
   */
  async awardXP(userAddress: string, amount: number, reason: string): Promise<boolean> {
    try {
      // Use main backend for XP awards to keep all user data centralized
      const MAIN_BACKEND_API = 'https://brainink-backend.onrender.com';
      const response = await fetch(`${MAIN_BACKEND_API}/api/award-xp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
        },
        body: JSON.stringify({
          userAddress,
          amount,
          reason,
          source: 'ai_interaction' // Track that this XP came from AI chat
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to award XP: ${response.status}`);
      }

      console.log(`✅ ${amount} XP awarded to ${userAddress} via main backend`);
      return true;
      
    } catch (error) {
      console.error('Failed to award XP:', error);
      return false;
    }
  }
  /**
   * Get wallet address from local storage
   */
  private getWalletAddress(): string | null {
    return localStorage.getItem('wallet_address') || null;
  }

  /**
   * Get default user profile
   */
  private getDefaultProfile(): UserProfile {
    return {
      address: '',
      xpBalance: 0,
      streak: 0,
      badges: [],
      squadId: 0,
      weeklyXP: 0,
      totalXP: 0
    };
  }

  /**
   * Get user ID from token (legacy method for backward compatibility)
   */
  private getUserId(): number | null {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
      const tokenParts = token.split('.');
      const base64Payload = tokenParts[1];
      const paddedPayload = base64Payload.padEnd(base64Payload.length + (4 - base64Payload.length % 4) % 4, '=');
      const decodedPayload = atob(paddedPayload);
      const payload = JSON.parse(decodedPayload);
      return payload.user_id || payload.sub || payload.id || null;
    } catch (error) {
      return null;
    }
  }
}

export const aiAgentService = new AIAgentService();