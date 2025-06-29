// Update SquadRoleEnum and status enums to match backend
export type SquadRole = 'leader' | 'member' | 'moderator';
export type BattleStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type LeagueStatus = 'upcoming' | 'active' | 'ended';

// Match backend SquadMemberResponse
export interface SquadMember {
  id: number;
  username: string;
  fname?: string | null;
  lname?: string | null;
  avatar?: string | null;
  role: SquadRole;
  weekly_xp: number;
  total_xp: number;
  joined_at: string;
  last_active: string;
  is_online?: boolean;
}

// Match backend SquadResponse
export interface Squad {
  id: string;
  name: string;
  emoji: string;
  description?: string | null;
  creator_id: number;
  is_public: boolean;
  max_members: number;
  subject_focus?: string[] | null;
  weekly_xp: number;
  total_xp: number;
  rank: number;
  members: SquadMember[];
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_activity?: string | null;
}

// Match backend SquadMessageResponse
export interface SquadMessage {
  id: string;
  squad_id: string;
  sender_id: number;
  sender_name: string;
  sender_avatar?: string | null;
  content: string;
  message_type: string;
  metadata?: Record<string, any> | null;
  created_at: string;
  reactions?: Record<string, any>[]; // or any[] if not using reaction objects
}

// Match backend StudyLeagueResponse
export interface StudyLeague {
  id: string;
  name: string;
  description?: string | null;
  subject: string;
  participants: number;
  max_participants: number;
  entry_fee: number;
  prize_pool: number;
  difficulty: string;
  league_type: string;
  status: LeagueStatus;
  start_date: string;
  end_date: string;
  created_at: string;
  my_rank?: number | null;
  my_score?: number | null;
}

interface SquadBattle {
  id: string;
  challenger_squad_id: string;
  challenged_squad_id: string;
  status: 'pending' | 'active' | 'completed';
  battle_type: string;
  start_time?: string;
  end_time?: string;
  winner_squad_id?: string;
  challenger_score: number;
  challenged_score: number;
  entry_fee: number;
  prize_pool: number;
  duration_minutes: number;
  subject?: string;
  challenger_squad?: any;
  challenged_squad?: any;
}

// Add new interfaces for leaderboard responses
export interface LeagueParticipant {
  id: number;
  username: string;
  fname?: string | null;
  lname?: string | null;
  avatar?: string | null;
  rank: number;
  score: number;
  questions_answered: number;
  correct_answers: number;
  xp_earned: number;
  accuracy: number;
  joined_at: string;
  last_active: string;
}

export interface LeagueLeaderboardResponse {
  league_info: StudyLeague;
  participants: LeagueParticipant[];
  total_participants: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

// Enhanced squad leaderboard interface
export interface SquadLeaderboardStats {
  total_members: number;
  average_weekly_xp: number;
  top_performer: SquadMember | null;
  squad_rank_change: number;
  weekly_growth: number;
}

class SquadService {
  // Use the main backend microservice on render.com
  private readonly SQUAD_API_BASE = 'https://brainink-backend-freinds-micro.onrender.com/squads';
  private readonly USE_MOCK_DATA = false;

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

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
      console.error('Error decoding token:', error);
      return null;
    }
  }

  async getUserSquads(): Promise<Squad[]> {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.SQUAD_API_BASE}/user/${userId}/squads`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const squads = await response.json();
      return squads;
    } catch (error) {
      console.error('Error fetching user squads:', error);
      return [];
    }
  }

  async createSquad(squadData: {
    name: string;
    emoji: string;
    description?: string;
    invitedFriends: number[];
    subject_focus?: string[];
    is_public?: boolean;
  }): Promise<Squad> {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.SQUAD_API_BASE}/create`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          name: squadData.name,
          emoji: squadData.emoji,
          description: squadData.description,
          creator_id: userId,
          invitedFriends: squadData.invitedFriends,
          subject_focus: squadData.subject_focus,
          is_public: squadData.is_public
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating squad:', error);
      throw error;
    }
  }

  async joinSquad(squadId: string): Promise<boolean> {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.SQUAD_API_BASE}/join/${squadId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error joining squad:', error);
      return false;
    }
  }

  async leaveSquad(squadId: string): Promise<boolean> {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.SQUAD_API_BASE}/squad/${squadId}/leave?user_id=${userId}`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error leaving squad:', error);
      return false;
    }
  }

  async updateSquad(squadId: string, updateData: {
    name?: string;
    emoji?: string;
    description?: string;
    subject_focus?: string[];
    is_public?: boolean;
    max_members?: number;
  }): Promise<Squad | null> {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.SQUAD_API_BASE}/squad/${squadId}?user_id=${userId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating squad:', error);
      return null;
    }
  }

  async deleteSquad(squadId: string, confirmDeletion: boolean = true, transferLeadership?: number): Promise<boolean> {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.SQUAD_API_BASE}/squad/${squadId}?user_id=${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          confirm_deletion: confirmDeletion,
          transfer_leadership: transferLeadership
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error deleting squad:', error);
      return false;
    }
  }

  async sendSquadMessage(squadId: string, content: string, messageType: string = 'text', metadata?: any): Promise<boolean> {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.SQUAD_API_BASE}/message/send`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          squad_id: squadId,
          sender_id: userId,
          content,
          message_type: messageType,
          metadata
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error sending squad message:', error);
      return false;
    }
  }

  async getSquadMessages(squadId: string, page: number = 1, pageSize: number = 50): Promise<{ messages: SquadMessage[], totalCount: number, hasNext: boolean }> {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.SQUAD_API_BASE}/messages/${squadId}?user_id=${userId}&page=${page}&page_size=${pageSize}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      return {
        messages: result.messages || [],
        totalCount: result.total_count || 0,
        hasNext: result.has_next || false
      };
    } catch (error) {
      console.error('Error fetching squad messages:', error);
      return { messages: [], totalCount: 0, hasNext: false };
    }
  }

  async getSquadDetail(squadId: string): Promise<Squad | null> {
    try {
      const userId = this.getUserId();
      const response = await fetch(`${this.SQUAD_API_BASE}/squad/${squadId}${userId ? `?user_id=${userId}` : ''}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching squad detail:', error);
      return null;
    }
  }

  async promoteMember(squadId: string, memberId: number): Promise<boolean> {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.SQUAD_API_BASE}/squad/${squadId}/promote`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          member_id: memberId,
          promoter_id: userId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error promoting member:', error);
      return false;
    }
  }

  async removeMember(squadId: string, memberId: number): Promise<boolean> {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.SQUAD_API_BASE}/squad/${squadId}/remove`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          member_id: memberId,
          remover_id: userId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error removing member:', error);
      return false;
    }
  }

  async transferLeadership(squadId: string, newLeaderId: number): Promise<boolean> {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.SQUAD_API_BASE}/squad/${squadId}/transfer-leadership?current_leader_id=${userId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ new_leader_id: newLeaderId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error transferring leadership:', error);
      return false;
    }
  }

  // Study Leagues
  async getStudyLeagues(status: string = 'all'): Promise<StudyLeague[]> {
    try {
      const response = await fetch(`${this.SQUAD_API_BASE}/study-leagues?status=${status}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching study leagues:', error);
      return [];
    }
  }

  async browseStudyLeagues(filters: {
    status?: string;
    subject?: string;
    difficulty?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ leagues: StudyLeague[], totalCount: number, hasNext: boolean }> {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      params.append('page', String(filters.page || 1));
      params.append('page_size', String(filters.pageSize || 20));

      const response = await fetch(`${this.SQUAD_API_BASE}/study-leagues/browse?${params.toString()}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      return {
        leagues: result.leagues || [],
        totalCount: result.total_count || 0,
        hasNext: result.has_next || false
      };
    } catch (error) {
      console.error('Error browsing study leagues:', error);
      return { leagues: [], totalCount: 0, hasNext: false };
    }
  }

  async joinStudyLeague(leagueId: string): Promise<boolean> {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.SQUAD_API_BASE}/study-leagues/${leagueId}/join`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error joining study league:', error);
      return false;
    }
  }

  async createStudyLeague(leagueData: {
    name: string;
    description?: string;
    subject: string;
    max_participants?: number;
    entry_fee?: number;
    prize_pool?: number;
    difficulty?: string;
    league_type?: string;
    duration_days?: number;
  }): Promise<StudyLeague | null> {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.SQUAD_API_BASE}/study-leagues/create`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          ...leagueData,
          creator_id: userId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating study league:', error);
      return null;
    }
  }

  async getUserStudyLeagues(status: string = 'all'): Promise<StudyLeague[]> {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.SQUAD_API_BASE}/user/${userId}/study-leagues?status=${status}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user study leagues:', error);
      return [];
    }
  }

  async getLeagueLeaderboard(leagueId: string, page: number = 1, pageSize: number = 50): Promise<LeagueLeaderboardResponse> {
    try {
      const userId = this.getUserId();
      const response = await fetch(`${this.SQUAD_API_BASE}/study-leagues/${leagueId}/leaderboard?page=${page}&page_size=${pageSize}${userId ? `&user_id=${userId}` : ''}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching league leaderboard:', error);
      throw error;
    }
  }

  async updateParticipantStats(leagueId: string, stats: {
    questions_answered?: number;
    correct_answers?: number;
    xp_earned?: number;
    time_spent?: number;
  }): Promise<boolean> {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.SQUAD_API_BASE}/study-leagues/${leagueId}/stats`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          user_id: userId,
          ...stats
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error updating participant stats:', error);
      return false;
    }
  }

  // Squad Battles
  async getSquadBattles(): Promise<SquadBattle[]> {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.SQUAD_API_BASE}/battles?user_id=${userId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching squad battles:', error);
      return [];
    }
  }

  async challengeSquad(challengeData: {
    challenger_squad_id: string;
    challenged_squad_id: string;
    battle_type?: string;
    entry_fee?: number;
    duration_minutes?: number;
    subject?: string;
  }): Promise<SquadBattle | null> {
    try {
      const response = await fetch(`${this.SQUAD_API_BASE}/challenge`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(challengeData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error challenging squad:', error);
      return null;
    }
  }

  // Voice Quiz Battle methods (you'll need to implement these endpoints)
  async startVoiceQuizBattle(squadId: string, entryFee: number, prizeDistribution: number[]): Promise<any> {
    // POST to your backend to create a new quiz battle
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.SQUAD_API_BASE}/voice-quiz-battle/start`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          squad_id: squadId,
          creator_id: userId,
          entry_fee: entryFee,
          prize_distribution: prizeDistribution
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting voice quiz battle:', error);
      return null;
    }
  }

  async distributeQuizPrizes(battleId: string): Promise<boolean> {
    // POST to your backend to distribute prizes after quiz ends
    try {
      const response = await fetch(`${this.SQUAD_API_BASE}/voice-quiz-battle/${battleId}/distribute-prizes`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error distributing quiz prizes:', error);
      return false;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.SQUAD_API_BASE}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Enhanced method to get squad leaderboard with stats
  async getSquadLeaderboard(squadId: string): Promise<{
    members: SquadMember[];
    stats: SquadLeaderboardStats;
  }> {
    try {
      const squad = await this.getSquadDetail(squadId);
      if (!squad) {
        throw new Error('Squad not found');
      }

      // Sort members by weekly XP
      const sortedMembers = squad.members.sort((a, b) => b.weekly_xp - a.weekly_xp);

      // Calculate stats
      const stats: SquadLeaderboardStats = {
        total_members: squad.members.length,
        average_weekly_xp: squad.members.length > 0
          ? Math.round(squad.members.reduce((sum, m) => sum + m.weekly_xp, 0) / squad.members.length)
          : 0,
        top_performer: sortedMembers[0] || null,
        squad_rank_change: 0, // This would come from backend comparison
        weekly_growth: 15 // Mock data - this would come from backend
      };

      return {
        members: sortedMembers,
        stats
      };
    } catch (error) {
      console.error('Error fetching squad leaderboard:', error);
      return {
        members: [],
        stats: {
          total_members: 0,
          average_weekly_xp: 0,
          top_performer: null,
          squad_rank_change: 0,
          weekly_growth: 0
        }
      };
    }
  }

  // Method to get global squad rankings
  async getGlobalSquadRankings(page: number = 1, pageSize: number = 20): Promise<{
    squads: Squad[];
    totalCount: number;
    hasNext: boolean;
  }> {
    try {
      // This would be a new endpoint you'd need to add to your backend
      const response = await fetch(`${this.SQUAD_API_BASE}/rankings/global?page=${page}&page_size=${pageSize}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      return {
        squads: result.squads || [],
        totalCount: result.total_count || 0,
        hasNext: result.has_next || false
      };
    } catch (error) {
      console.error('Error fetching global squad rankings:', error);
      return { squads: [], totalCount: 0, hasNext: false };
    }
  }

  // Agent Integration Methods
  async getSquadAnalysis(squadId: string): Promise<string | null> {
    try {
      // Import the real agent service
      const { realAgentService } = await import('../../src/services/realAgentService');
      return await realAgentService.analyzeSquadPerformance(squadId);
    } catch (error) {
      console.error('Error getting squad analysis from agent:', error);
      return `Unable to analyze squad performance: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  async getStudyRecommendations(userId: number, subject?: string): Promise<string | null> {
    try {
      const { realAgentService } = await import('../../src/services/realAgentService');
      return await realAgentService.analyzeUserProgress(userId, subject);
    } catch (error) {
      console.error('Error getting study recommendations from agent:', error);
      return `Unable to get study recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  async generateQuizForSquad(squadId: string, subject: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<string | null> {
    try {
      const { realAgentService } = await import('../../src/services/realAgentService');
      return await realAgentService.generateSquadQuiz(squadId, subject, difficulty);
    } catch (error) {
      console.error('Error generating quiz from agent:', error);
      return `Unable to generate quiz: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  async getSquadMotivation(squadId: string): Promise<string | null> {
    try {
      const { realAgentService } = await import('../../src/services/realAgentService');
      return await realAgentService.coordinateSquadActivity(squadId, 'progress_check');
    } catch (error) {
      console.error('Error getting squad motivation from agent:', error);
      return `Unable to get motivation message: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  async planSquadStudySession(squadId: string): Promise<string | null> {
    try {
      const { realAgentService } = await import('../../src/services/realAgentService');
      return await realAgentService.coordinateSquadActivity(squadId, 'study_session');
    } catch (error) {
      console.error('Error planning study session:', error);
      return `Unable to plan study session: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  async suggestSquadChallenge(squadId: string): Promise<string | null> {
    try {
      const { realAgentService } = await import('../../src/services/realAgentService');
      return await realAgentService.coordinateSquadActivity(squadId, 'challenge');
    } catch (error) {
      console.error('Error suggesting squad challenge:', error);
      return `Unable to suggest challenge: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

export const squadService = new SquadService();