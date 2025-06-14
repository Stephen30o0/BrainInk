interface UserProfile {
  address: string;
  interests: string[];
  studyHabits: string[];
  skillLevel: number;
  activeHours: number[];
  subjects: string[];
  personality: string[];
  goals: string[];
}

interface UserEmbedding {
  address: string;
  vector: number[];
  lastUpdated: Date;
  profile: UserProfile;
}

interface MatchResult {
  userAddress: string;
  similarity: number;
  profile: UserProfile;
  compatibilityReasons: string[];
}

class TribeMatchingService {
  private readonly BACKEND_API_BASE = 'https://brainink-backend.onrender.com';
  
  constructor() {
    // Frontend service - connects to backend API
  }

  /**
   * Capture user profile data from various sources
   */
  async captureUserProfile(userAddress: string): Promise<UserProfile> {
    try {
      // Call backend API to capture profile
      const response = await fetch(`${this.BACKEND_API_BASE}/api/user-profile/${userAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to capture profile: ${response.status}`);
      }

      const profile = await response.json();
      return profile;
      
    } catch (error) {
      console.error('Error capturing user profile:', error);
      return this.getDefaultProfile(userAddress);
    }
  }

  /**
   * Create vector embedding for user profile
   */
  async createUserEmbedding(profile: UserProfile): Promise<UserEmbedding> {
    try {
      // Call backend API to create embedding
      const response = await fetch(`${this.BACKEND_API_BASE}/api/user-embedding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create embedding: ${response.status}`);
      }

      const embedding = await response.json();
      return embedding;
      
    } catch (error) {
      console.error('Error creating user embedding:', error);
      throw error;
    }
  }

  /**
   * Find similar users for tribe matching
   */
  async findSimilarUsers(userAddress: string, limit: number = 5): Promise<MatchResult[]> {
    try {
      // Call backend API to find similar users
      const response = await fetch(`${this.BACKEND_API_BASE}/api/similar-users/${userAddress}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to find similar users: ${response.status}`);
      }

      const matches = await response.json();
      return matches;
        
    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  /**
   * Trigger introduction message when users match
   */
  async triggerIntroMessage(userAddress1: string, userAddress2: string, matchResult: MatchResult): Promise<void> {
    try {
      // Call backend API to trigger intro message
      const response = await fetch(`${this.BACKEND_API_BASE}/api/intro-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress1,
          userAddress2,
          matchResult,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to trigger intro message: ${response.status}`);      }
      
    } catch (error) {
      console.error('Error triggering intro message:', error);
    }
  }

  /**
   * Get default user profile
   */
  private getDefaultProfile(userAddress: string): UserProfile {
    return {
      address: userAddress,
      interests: ['learning', 'technology'],
      studyHabits: ['visual', 'interactive'],
      skillLevel: 1,
      activeHours: [9, 10, 11, 14, 15, 16],
      subjects: ['general'],
      personality: ['curious', 'analytical'],
      goals: ['skill-improvement', 'knowledge-expansion']
    };
  }
}

export default TribeMatchingService;
export type { UserProfile, UserEmbedding, MatchResult };
