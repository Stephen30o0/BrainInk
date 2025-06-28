interface User {
    id: number;
    username: string;
    fname: string;
    lname: string;
    avatar: string;
    email?: string;
}

interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    message_type: string;
    status: string;
    created_at: string;
    read_at?: string;
    sender_info?: User;
}

interface Achievement {
    id: number;
    name: string;
    description: string;
    category: string;
    badge_icon?: string;
    xp_reward: number;
    earned_at?: string;
}

interface UserProgress {
    total_xp: number;
    current_rank?: {
        id: number;
        name: string;
        tier: string;
        level: number;
        required_xp: number;
        emoji?: string;
    };
    login_streak: number;
    total_quiz_completed: number;
    tournaments_won: number;
    tournaments_entered: number;
    courses_completed: number;
    time_spent_hours: number;
}

interface UserStats {
    user_id: number;
    username: string;
    total_xp: number;
    current_rank: string;
    achievements_count: number;
    stats: {
        login_streak: number;
        total_quiz_completed: number;
        tournaments_won: number;
        tournaments_entered: number;
        courses_completed: number;
        time_spent_hours: number;
    };
}

interface FriendRequest {
    id: number;
    requester_id: number;
    receiver_id: number;
    status: string;
    created_at: string;
    friend_info?: User;
}

interface PreloadedData {
    user: {
        profile: any;
        progress: UserProgress | null;
        stats: UserStats | null;
    };
    friends: {
        list: User[];
        pendingRequests: FriendRequest[];
        conversations: Map<string, Message[]>;
    };
    achievements: Achievement[];
    tournaments: {
        myTournaments: {
            created: any[];
            participating: any[];
            invited: any[];
        };
        availableTournaments: any[];
        invitations: any[];
    };
    notifications: {
        friendRequests: any[];
        messages: any[];
        achievements: any[];
        tournaments: any[];
    };
    lastUpdated: number;
}

class APIService {
    private static instance: APIService;
    private preloadedData: PreloadedData | null = null;
    private isLoading = false;
    private loadingPromise: Promise<void> | null = null;

    // API Base URLs
    private readonly MAIN_API = 'https://brainink-backend.onrender.com';
    private readonly FRIENDS_API = 'https://brainink-backend-freinds-micro.onrender.com/friends';
    private readonly ACHIEVEMENTS_API = 'https://brainink-backend-achivements-micro.onrender.com';

    // Tournament API endpoints
    private readonly TOURNAMENTS_API = 'https://brainink-backend-achivements-micro.onrender.com/tournaments';

    // Tournament Types (matching your backend enums)
    public static readonly TOURNAMENT_STATUS = {
        DRAFT: 'draft',
        OPEN: 'open',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
    } as const;

    public static readonly TOURNAMENT_TYPE = {
        PUBLIC: 'public',
        PRIVATE: 'private',
        INVITE_ONLY: 'invite_only'
    } as const;

    public static readonly BRACKET_TYPE = {
        SINGLE_ELIMINATION: 'single_elimination',
        DOUBLE_ELIMINATION: 'double_elimination',
        ROUND_ROBIN: 'round_robin'
    } as const;

    public static readonly DIFFICULTY_LEVEL = {
        ELEMENTARY: 'elementary',
        MIDDLE_SCHOOL: 'middle_school',
        HIGH_SCHOOL: 'high_school',
        UNIVERSITY: 'university',
        PROFESSIONAL: 'professional',
        MIXED: 'mixed'
    } as const;

    private constructor() { }

    public static getInstance(): APIService {
        if (!APIService.instance) {
            APIService.instance = new APIService();
        }
        return APIService.instance;
    }

    private getValidToken(): string | null {
        const token = localStorage.getItem('access_token');
        if (!token) {
            console.log('No access token found');
            return null;
        }
        return token;
    }

    private getUserIdFromToken(token: string): number | null {
        try {
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) return null;

            const base64Payload = tokenParts[1];
            const paddedPayload = base64Payload.padEnd(base64Payload.length + (4 - base64Payload.length % 4) % 4, '=');
            const decodedPayload = atob(paddedPayload);
            const payload = JSON.parse(decodedPayload);

            return payload.user_id || payload.sub || payload.id || payload.userId ?
                parseInt(payload.user_id || payload.sub || payload.id || payload.userId) : null;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    private getUserDataFromToken(token: string): any {
        try {
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) return {};

            const base64Payload = tokenParts[1];
            const paddedPayload = base64Payload.padEnd(base64Payload.length + (4 - base64Payload.length % 4) % 4, '=');
            const decodedPayload = atob(paddedPayload);
            const payload = JSON.parse(decodedPayload);

            return {
                fname: payload.fname || payload.first_name,
                lname: payload.lname || payload.last_name,
                username: payload.username || payload.sub,
                email: payload.email,
                user_id: payload.user_id || payload.sub || payload.id || payload.userId
            };
        } catch (error) {
            console.error('Error extracting user data from token:', error);
            return {};
        }
    }

    private async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
        const token = this.getValidToken();
        if (!token) throw new Error('No access token available');

        const defaultHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        };

        const response = await fetch(url, {
            ...options,
            headers: { ...defaultHeaders, ...options.headers }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('encrypted_user_data');
                throw new Error('Authentication failed');
            }
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        return response.json();
    }

    // Load user progress and stats
    private async loadUserData(): Promise<{ progress: UserProgress | null; stats: UserStats | null }> {
        try {
            const [progressResponse, statsResponse] = await Promise.allSettled([
                this.makeRequest(`${this.ACHIEVEMENTS_API}/progress`),
                this.makeRequest(`${this.ACHIEVEMENTS_API}/stats`)
            ]);

            return {
                progress: progressResponse.status === 'fulfilled' ? progressResponse.value : null,
                stats: statsResponse.status === 'fulfilled' ? statsResponse.value : null
            };
        } catch (error) {
            console.error('Error loading user data:', error);
            return { progress: null, stats: null };
        }
    }

    // Load friends and conversations
    private async loadFriendsData(currentUserId: number): Promise<{
        list: User[];
        pendingRequests: FriendRequest[];
        conversations: Map<string, Message[]>;
    }> {
        try {
            const [friendsResponse, requestsResponse] = await Promise.allSettled([
                this.makeRequest(`${this.FRIENDS_API}/list/${currentUserId}`),
                this.makeRequest(`${this.FRIENDS_API}/requests/pending/${currentUserId}`)
            ]);            let friends: User[] = [];
            if (friendsResponse.status === 'fulfilled') {
                const friendsData = friendsResponse.value;
                console.log('🔍 Raw friends API response:', friendsData);
                
                if (Array.isArray(friendsData)) {
                    friends = friendsData;
                } else if (friendsData.friends && Array.isArray(friendsData.friends)) {
                    friends = friendsData.friends;
                } else if (friendsData.data && Array.isArray(friendsData.data)) {
                    friends = friendsData.data;
                }
                
                console.log('🔍 Processed friends array:', friends);
                console.log('🔍 First friend structure:', friends[0]);
                console.log('🔍 Friend usernames:', friends.map(f => f?.username || 'MISSING'));
            } else {
                console.error('❌ Friends API request failed:', friendsResponse.reason);
            }

            const pendingRequests: FriendRequest[] = requestsResponse.status === 'fulfilled' ?
                requestsResponse.value : [];

            // Load recent conversations for each friend
            const conversations = new Map<string, Message[]>();
            const conversationPromises = friends.slice(0, 10).map(async (friend) => {
                try {
                    const conversationData = await this.makeRequest(
                        `${this.FRIENDS_API}/conversation/${currentUserId}/${friend.username}?page=1&page_size=5`
                    );
                    const messages = conversationData.messages || [];
                    conversations.set(friend.username, messages);
                } catch (error) {
                    console.error(`Error loading conversation for ${friend.username}:`, error);
                    conversations.set(friend.username, []);
                }
            });

            await Promise.allSettled(conversationPromises);

            return { list: friends, pendingRequests, conversations };
        } catch (error) {
            console.error('Error loading friends data:', error);
            return { list: [], pendingRequests: [], conversations: new Map() };
        }
    }

    // Load achievements
    private async loadAchievements(): Promise<Achievement[]> {
        try {
            const achievements = await this.makeRequest(`${this.ACHIEVEMENTS_API}/achievements`);
            return Array.isArray(achievements) ? achievements : [];
        } catch (error) {
            console.error('Error loading achievements:', error);
            return [];
        }
    }

    // Load tournament data for preloading
    private async loadTournamentData(): Promise<{
        myTournaments: any;
        availableTournaments: any[];
        invitations: any[];
    }> {
        try {
            const [myTournamentsResponse, availableResponse, invitationsResponse] = await Promise.allSettled([
                this.getMyTournaments(),
                this.getTournaments({ limit: 10, status: APIService.TOURNAMENT_STATUS.OPEN }),
                this.getMyTournamentInvitations()
            ]);

            return {
                myTournaments: myTournamentsResponse.status === 'fulfilled' ? myTournamentsResponse.value : { created: [], participating: [], invited: [] },
                availableTournaments: availableResponse.status === 'fulfilled' ? availableResponse.value : [],
                invitations: invitationsResponse.status === 'fulfilled' ? invitationsResponse.value : []
            };
        } catch (error) {
            console.error('Error loading tournament data:', error);
            return {
                myTournaments: { created: [], participating: [], invited: [] },
                availableTournaments: [],
                invitations: []
            };
        }
    }

    // Generate notifications from loaded data
    private generateNotifications(data: PreloadedData, currentUserId: number): any {
        const notifications: {
            friendRequests: any[];
            messages: any[];
            achievements: any[];
            tournaments: any[];
        } = {
            friendRequests: [],
            messages: [],
            achievements: [],
            tournaments: []
        };

        // Friend request notifications
        notifications.friendRequests = data.friends.pendingRequests.map(request => ({
            id: `friend_request_${request.id}`,
            type: 'friend_request',
            title: 'New Friend Request',
            message: `${request.friend_info?.fname && request.friend_info?.lname
                ? `${request.friend_info.fname} ${request.friend_info.lname}`
                : request.friend_info?.username || 'Someone'} wants to be your friend`,
            time: this.formatTimestamp(request.created_at),
            read: false,
            data: { friendship_id: request.id, requester: request.friend_info }
        }));

        // Message notifications (recent unread messages)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        data.friends.conversations.forEach((messages, friendUsername) => {
            const friend = data.friends.list.find(f => f.username === friendUsername);
            if (!friend) return;

            const recentUnreadMessages = messages.filter(msg =>
                msg.sender_id !== currentUserId &&
                new Date(msg.created_at) > oneDayAgo &&
                (!msg.read_at || msg.status !== 'read')
            );

            if (recentUnreadMessages.length > 0) {
                const latestMessage = recentUnreadMessages[0];
                notifications.messages.push({
                    id: `message_${friend.id}_${latestMessage.id}`,
                    type: 'message',
                    title: 'New Message',
                    message: `${friend.fname && friend.lname ? `${friend.fname} ${friend.lname}` : friend.username}: ${latestMessage.content.length > 30 ? latestMessage.content.substring(0, 30) + '...' : latestMessage.content
                        }`,
                    time: this.formatTimestamp(latestMessage.created_at),
                    read: false,
                    data: { friend, message: latestMessage, unreadCount: recentUnreadMessages.length }
                });
            }
        });

        // Achievement notifications (recent achievements)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        notifications.achievements = data.achievements
            .filter(achievement => achievement.earned_at && new Date(achievement.earned_at) > weekAgo)
            .slice(0, 5)
            .map(achievement => ({
                id: `achievement_${achievement.id}`,
                type: 'achievement',
                title: 'New Achievement!',
                message: `You've unlocked "${achievement.name}"`,
                time: this.formatTimestamp(achievement.earned_at!),
                read: false,
                reward: {
                    xp: achievement.xp_reward || 0,
                    tokens: Math.floor((achievement.xp_reward || 0) / 2)
                },
                data: { achievement }
            }));

        // Tournament notifications
        notifications.tournaments = [
            // Tournament invitations
            ...data.tournaments.invitations.map(invitation => ({
                id: `tournament_invitation_${invitation.id}`,
                type: 'tournament_invitation',
                title: 'Tournament Invitation',
                message: `${invitation.inviter_username} invited you to "${invitation.tournament_name}"`,
                time: this.formatTimestamp(invitation.invited_at),
                read: false,
                data: { invitation }
            })),
            // Tournament starting soon (for participating tournaments)
            ...data.tournaments.myTournaments.participating
                .filter((tournament: any) => {
                    if (!tournament.tournament_start) return false;
                    const startTime = new Date(tournament.tournament_start);
                    const now = new Date();
                    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                    return hoursUntilStart > 0 && hoursUntilStart <= 24; // Starting within 24 hours
                })
                .map((tournament: any) => ({
                    id: `tournament_starting_${tournament.id}`,
                    type: 'tournament_starting',
                    title: 'Tournament Starting Soon',
                    message: `"${tournament.name}" starts soon!`,
                    time: this.formatTimestamp(tournament.tournament_start),
                    read: false,
                    data: { tournament }
                }))
        ].slice(0, 10); // Limit to 10 tournament notifications

        return notifications;
    }

    private formatTimestamp(timestamp: string): string {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const minutes = Math.floor(diff / (1000 * 60));
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));

            if (minutes < 1) return 'now';
            if (minutes < 60) return `${minutes}m ago`;
            if (hours < 24) return `${hours}h ago`;
            if (days < 7) return `${days}d ago`;
            return date.toLocaleDateString();
        } catch (error) {
            return 'unknown';
        }
    }

    // Main preload function
    public async preloadAllData(): Promise<PreloadedData> {
        if (this.isLoading && this.loadingPromise) {
            await this.loadingPromise;
            return this.preloadedData!;
        }

        if (this.preloadedData && (Date.now() - this.preloadedData.lastUpdated) < 300000) { // 5 minutes cache
            return this.preloadedData;
        }

        this.isLoading = true;
        this.loadingPromise = this.performPreload();

        try {
            await this.loadingPromise;
            return this.preloadedData!;
        } finally {
            this.isLoading = false;
            this.loadingPromise = null;
        }
    }

    private async performPreload(): Promise<void> {
        console.log('🚀 Starting data preload...');
        const startTime = Date.now();

        const token = this.getValidToken();
        if (!token) {
            throw new Error('No access token available');
        }

        const tokenUserData = this.getUserDataFromToken(token);
        const currentUserId = this.getUserIdFromToken(token);

        if (!currentUserId) {
            throw new Error('Unable to extract user ID from token');
        }

        try {
            // Load all data in parallel including tournaments
            const [userData, friendsData, achievements, tournamentData] = await Promise.all([
                this.loadUserData(),
                this.loadFriendsData(currentUserId),
                this.loadAchievements(),
                this.loadTournamentData()
            ]);

            this.preloadedData = {
                user: {
                    profile: tokenUserData,
                    progress: userData.progress,
                    stats: userData.stats
                },
                friends: friendsData,
                achievements,
                tournaments: tournamentData,
                notifications: {
                    friendRequests: [],
                    messages: [],
                    achievements: [],
                    tournaments: []
                },
                lastUpdated: Date.now()
            };

            // Generate notifications from loaded data
            this.preloadedData.notifications = this.generateNotifications(this.preloadedData, currentUserId);

            const loadTime = Date.now() - startTime;
            console.log(`✅ Data preload completed in ${loadTime}ms`);
            console.log('📊 Preloaded data:', {
                friends: this.preloadedData.friends.list.length,
                pendingRequests: this.preloadedData.friends.pendingRequests.length,
                conversations: this.preloadedData.friends.conversations.size,
                achievements: this.preloadedData.achievements.length,
                tournaments: {
                    myTournaments: this.preloadedData.tournaments.myTournaments,
                    available: this.preloadedData.tournaments.availableTournaments.length,
                    invitations: this.preloadedData.tournaments.invitations.length
                },
                notifications: {
                    friendRequests: this.preloadedData.notifications.friendRequests.length,
                    messages: this.preloadedData.notifications.messages.length,
                    achievements: this.preloadedData.notifications.achievements.length,
                    tournaments: this.preloadedData.notifications.tournaments.length
                }
            });

        } catch (error) {
            console.error('❌ Error during data preload:', error);
            throw error;
        }
    }

    // ========== TOURNAMENT API METHODS ==========

    // Get all tournaments with optional filters
    public async getTournaments(params?: {
        status?: string;
        tournament_type?: string;
        limit?: number;
        offset?: number;
    }): Promise<any[]> {
        const url = new URL(`${this.TOURNAMENTS_API}/`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value));
                }
            });
        }
        return this.makeRequest(url.toString());
    }

    // Get tournament details by ID
    public async getTournamentDetails(tournamentId: number): Promise<any> {
        return this.makeRequest(`${this.TOURNAMENTS_API}/${tournamentId}`);
    }

    // Create a new tournament
    public async createTournament(tournamentData: {
        name: string;
        description?: string;
        max_players: number;
        tournament_type?: string;
        bracket_type?: string;
        prize_config: {
            has_prizes?: boolean;
            first_place_prize?: string;
            second_place_prize?: string;
            third_place_prize?: string;
            prize_type?: string;
        };
        question_config: {
            total_questions?: number;
            time_limit_minutes?: number;
            difficulty_level?: string;
            subject_category?: string;
            custom_topics?: string[];
        };
        registration_end?: string;
        tournament_start?: string;
        invited_users?: number[];
    }): Promise<any> {
        return this.makeRequest(`${this.TOURNAMENTS_API}/create`, {
            method: 'POST',
            body: JSON.stringify(tournamentData)
        });
    }

    // Join a tournament
    public async joinTournament(tournamentId: number): Promise<any> {
        return this.makeRequest(`${this.TOURNAMENTS_API}/${tournamentId}/join`, {
            method: 'POST'
        });
    }

    // Start a tournament (creator only)
    public async startTournament(tournamentId: number): Promise<any> {
        return this.makeRequest(`${this.TOURNAMENTS_API}/${tournamentId}/start`, {
            method: 'POST'
        });
    }

    // Get tournament bracket
    public async getTournamentBracket(tournamentId: number): Promise<any> {
        return this.makeRequest(`${this.TOURNAMENTS_API}/${tournamentId}/bracket`);
    }

    // Get user's tournaments (created, participating, invited)
    public async getMyTournaments(): Promise<{
        created: any[];
        participating: any[];
        invited: any[];
    }> {
        return this.makeRequest(`${this.TOURNAMENTS_API}/user/my-tournaments`);
    }

    // Invite players to a tournament (creator only)
    public async invitePlayersToTournament(tournamentId: number, userIds: number[], message?: string): Promise<any> {
        return this.makeRequest(`${this.TOURNAMENTS_API}/${tournamentId}/invite`, {
            method: 'POST',
            body: JSON.stringify({
                user_ids: userIds,
                message
            })
        });
    }

    // Get user's tournament invitations
    public async getMyTournamentInvitations(): Promise<any[]> {
        return this.makeRequest(`${this.TOURNAMENTS_API}/invitations/my-invitations`);
    }

    // Respond to tournament invitation
    public async respondToTournamentInvitation(invitationId: number, accept: boolean): Promise<any> {
        return this.makeRequest(`${this.TOURNAMENTS_API}/invitations/${invitationId}/respond?accept=${accept}`, {
            method: 'POST'
        });
    }

    // Utility method to create a tournament with default values
    public async createQuickTournament(params: {
        name: string;
        description?: string;
        maxPlayers?: number;
        difficulty?: string;
        subjects?: string[];
        timeLimit?: number;
        totalQuestions?: number;
        hasPrizes?: boolean;
        firstPlacePrize?: string;
    }): Promise<any> {
        const tournamentData = {
            name: params.name,
            description: params.description || '',
            max_players: params.maxPlayers || 8,
            tournament_type: APIService.TOURNAMENT_TYPE.PUBLIC,
            bracket_type: APIService.BRACKET_TYPE.SINGLE_ELIMINATION,
            prize_config: {
                has_prizes: params.hasPrizes || false,
                first_place_prize: params.firstPlacePrize || undefined,
                second_place_prize: undefined,
                third_place_prize: undefined,
                prize_type: 'tokens'
            },
            question_config: {
                total_questions: params.totalQuestions || 20,
                time_limit_minutes: params.timeLimit || 30,
                difficulty_level: params.difficulty || APIService.DIFFICULTY_LEVEL.MIXED,
                subject_category: params.subjects?.[0] || 'general',
                custom_topics: params.subjects || ['general']
            }
        };

        return this.createTournament(tournamentData);
    }

    // ========== QUESTIONS API METHODS ==========

    /**
     * Fetch random questions for tournaments or practice.
     */
    public async getRandomQuestions(params: {
        count: number;
        subject?: string;
        difficulty_level?: string;
        topics?: string[]
    }): Promise<any[]> {
        const url = new URL(`${this.ACHIEVEMENTS_API}/questions/random/${params.count}`);
        if (params.subject) url.searchParams.append('subject', params.subject);
        if (params.difficulty_level) url.searchParams.append('difficulty_level', params.difficulty_level);
        if (params.topics && params.topics.length) url.searchParams.append('topics', params.topics.join(','));
        return this.makeRequest(url.toString());
    }

    // ========== GETTER METHODS ==========

    // Getter methods for components to access preloaded data
    public getPreloadedData(): PreloadedData | null {
        return this.preloadedData;
    }

    public getUserProfile(): any {
        return this.preloadedData?.user.profile || null;
    }

    public getUserProgress(): UserProgress | null {
        return this.preloadedData?.user.progress || null;
    }    /**
     * Get friends from preloaded data (alias for getFriendsList for backward compatibility)
     */
    public getFriends(): User[] {
        return this.preloadedData?.friends.list || [];
    }

    /**
     * Get pending friend requests from preloaded data (synchronous)
     */
    public getPendingFriendRequests(): FriendRequest[] {
        return this.preloadedData?.friends.pendingRequests || [];
    }

    /**
     * Get user stats from preloaded data
     */
    public getUserStats(): UserStats | null {
        return this.preloadedData?.user.stats || null;
    }

    /**
     * Get achievements from preloaded data
     */
    public getAchievements(): Achievement[] {
        return this.preloadedData?.achievements || [];
    }

    /**
     * Get notifications from preloaded data
     */
    public getNotifications(): any {
        return this.preloadedData?.notifications || {
            friendRequests: [],
            messages: [],
            achievements: [],
            tournaments: []
        };
    }

    /**
     * Get tournament data from preloaded data
     */
    public getTournamentData(): any {
        return this.preloadedData?.tournaments || {
            myTournaments: { created: [], participating: [], invited: [] },
            availableTournaments: [],
            invitations: []
        };
    }

    // ========== FRIENDS API METHODS ==========

    /**
     * Get user's friends list
     */
    public async getFriendsList(): Promise<User[]> {
        try {
            // First try to get from preloaded data if available
            if (this.preloadedData?.friends.list) {
                return this.preloadedData.friends.list;
            }

            // If not available in preloaded data, fetch directly
            const token = this.getValidToken();
            if (!token) throw new Error('No access token available');

            const currentUserId = this.getUserIdFromToken(token);
            if (!currentUserId) throw new Error('Unable to extract user ID from token');

            const response = await this.makeRequest(`${this.FRIENDS_API}/list/${currentUserId}`);

            // Handle different response formats
            if (Array.isArray(response)) {
                return response;
            } else if (response.friends && Array.isArray(response.friends)) {
                return response.friends;
            } else if (response.data && Array.isArray(response.data)) {
                return response.data;
            }

            return [];
        } catch (error) {
            console.error('Error fetching friends list:', error);
            return [];
        }
    }

    /**
     * Get friend requests (pending)
     */
    public async getFriendRequests(): Promise<FriendRequest[]> {
        try {
            // First try to get from preloaded data if available
            if (this.preloadedData?.friends.pendingRequests) {
                return this.preloadedData.friends.pendingRequests;
            }

            // If not available in preloaded data, fetch directly
            const token = this.getValidToken();
            if (!token) throw new Error('No access token available');

            const currentUserId = this.getUserIdFromToken(token);
            if (!currentUserId) throw new Error('Unable to extract user ID from token');

            return await this.makeRequest(`${this.FRIENDS_API}/requests/pending/${currentUserId}`);
        } catch (error) {
            console.error('Error fetching friend requests:', error);
            return [];
        }
    }

    /**
     * Send friend request
     */
    public async sendFriendRequest(username: string): Promise<any> {
        return this.makeRequest(`${this.FRIENDS_API}/request`, {
            method: 'POST',
            body: JSON.stringify({ username })
        });
    }

    /**
     * Accept friend request
     */
    public async acceptFriendRequest(requestId: number): Promise<any> {
        return this.makeRequest(`${this.FRIENDS_API}/accept/${requestId}`, {
            method: 'POST'
        });
    }

    /**
     * Decline friend request
     */
    public async declineFriendRequest(requestId: number): Promise<any> {
        return this.makeRequest(`${this.FRIENDS_API}/decline/${requestId}`, {
            method: 'POST'
        });
    }

    /**
     * Remove friend
     */
    public async removeFriend(friendId: number): Promise<any> {
        return this.makeRequest(`${this.FRIENDS_API}/remove/${friendId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Search for users to add as friends
     */
    public async searchUsers(query: string): Promise<User[]> {
        try {
            const response = await this.makeRequest(`${this.FRIENDS_API}/search?q=${encodeURIComponent(query)}`);
            return Array.isArray(response) ? response : response.users || [];
        } catch (error: any) {
            // Handle specific error cases
            if (error.message?.includes('404')) {
                // Friends API endpoint is not available (404 error)
                // This is expected when the friends microservice is not deployed
                // Silently return empty array to avoid console spam
                return [];
            } else if (error.message?.includes('401')) {
                // Authentication failed
                console.warn('Authentication failed for user search');
                return [];
            } else {
                // Other errors - log once and return empty array
                if (!sessionStorage.getItem('user-search-api-error')) {
                    console.warn('User search API temporarily unavailable:', error.message);
                    sessionStorage.setItem('user-search-api-error', 'true');
                }
                return [];
            }
        }
    }

    /**
     * Get conversation with a friend
     */
    public async getConversation(friendUsername: string, page: number = 1, pageSize: number = 20): Promise<any> {
        try {
            const token = this.getValidToken();
            if (!token) throw new Error('No access token available');

            const currentUserId = this.getUserIdFromToken(token);
            if (!currentUserId) throw new Error('Unable to extract user ID from token');

            return await this.makeRequest(
                `${this.FRIENDS_API}/conversation/${currentUserId}/${friendUsername}?page=${page}&page_size=${pageSize}`
            );
        } catch (error) {
            console.error('Error fetching conversation:', error);
            return { messages: [], total: 0 };
        }
    }

    /**
     * Send message to friend
     */
    public async sendMessage(receiverUsername: string, content: string, messageType: string = 'text'): Promise<any> {
        return this.makeRequest(`${this.FRIENDS_API}/send-message`, {
            method: 'POST',
            body: JSON.stringify({
                receiver_username: receiverUsername,
                content,
                message_type: messageType
            })
        });
    }

    /**
     * Mark messages as read
     */
    public async markMessagesAsRead(messageIds: number[]): Promise<any> {
        return this.makeRequest(`${this.FRIENDS_API}/mark-read`, {
            method: 'POST',
            body: JSON.stringify({ message_ids: messageIds })
        });
    }

    /**
     * Force refresh friends data (clears cache and reloads)
     */
    public async refreshFriendsData(): Promise<User[]> {
        try {
            const token = this.getValidToken();
            if (!token) throw new Error('No access token available');

            const currentUserId = this.getUserIdFromToken(token);
            if (!currentUserId) throw new Error('Unable to extract user ID from token');

            console.log('🔄 Refreshing friends data for user:', currentUserId);

            const response = await this.makeRequest(`${this.FRIENDS_API}/list/${currentUserId}`);

            let friends: User[] = [];
            if (Array.isArray(response)) {
                friends = response;
            } else if (response.friends && Array.isArray(response.friends)) {
                friends = response.friends;
            } else if (response.data && Array.isArray(response.data)) {
                friends = response.data;
            }

            console.log('👥 Fresh friends data:', friends);

            // Update the preloaded data if it exists
            if (this.preloadedData) {
                this.preloadedData.friends.list = friends;
            }

            return friends;
        } catch (error) {
            console.error('❌ Error refreshing friends data:', error);            return [];
        }
    }

    /**
     * Refresh specific data in the cache
     */
    public async refreshData(dataType: 'friends' | 'achievements' | 'tournaments' | 'all' = 'all'): Promise<void> {
        try {
            if (dataType === 'all') {
                await this.preloadAllData();
                return;
            }

            const token = this.getValidToken();
            if (!token) return;

            const currentUserId = this.getUserIdFromToken(token);
            if (!currentUserId) return;

            switch (dataType) {
                case 'friends':
                    if (this.preloadedData) {
                        const friendsData = await this.loadFriendsData(currentUserId);
                        this.preloadedData.friends = friendsData;
                        this.preloadedData.lastUpdated = Date.now();
                    }
                    break;
                case 'achievements':
                    if (this.preloadedData) {
                        const achievements = await this.loadAchievements();
                        this.preloadedData.achievements = achievements;
                        this.preloadedData.lastUpdated = Date.now();
                    }
                    break;
                case 'tournaments':
                    if (this.preloadedData) {
                        const tournaments = await this.loadTournamentData();
                        this.preloadedData.tournaments = tournaments;
                        this.preloadedData.lastUpdated = Date.now();
                    }
                    break;
            }
        } catch (error) {
            console.error(`Error refreshing ${dataType} data:`, error);
        }
    }
}

// Add this export at the bottom of the file
export const apiService = APIService.getInstance();

// Keep the default export for backward compatibility
export default APIService;
