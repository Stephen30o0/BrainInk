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
    notifications: {
        friendRequests: any[];
        messages: any[];
        achievements: any[];
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
            ]);

            let friends: User[] = [];
            if (friendsResponse.status === 'fulfilled') {
                const friendsData = friendsResponse.value;
                if (Array.isArray(friendsData)) {
                    friends = friendsData;
                } else if (friendsData.friends && Array.isArray(friendsData.friends)) {
                    friends = friendsData.friends;
                } else if (friendsData.data && Array.isArray(friendsData.data)) {
                    friends = friendsData.data;
                }
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

    // Generate notifications from loaded data
    private generateNotifications(data: PreloadedData, currentUserId: number): any {
        const notifications: {
            friendRequests: any[];
            messages: any[];
            achievements: any[];
        } = {
            friendRequests: [],
            messages: [],
            achievements: []
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
            // Load all data in parallel
            const [userData, friendsData, achievements] = await Promise.all([
                this.loadUserData(),
                this.loadFriendsData(currentUserId),
                this.loadAchievements()
            ]);

            this.preloadedData = {
                user: {
                    profile: tokenUserData,
                    progress: userData.progress,
                    stats: userData.stats
                },
                friends: friendsData,
                achievements,
                notifications: {
                    friendRequests: [],
                    messages: [],
                    achievements: []
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
                notifications: {
                    friendRequests: this.preloadedData.notifications.friendRequests.length,
                    messages: this.preloadedData.notifications.messages.length,
                    achievements: this.preloadedData.notifications.achievements.length
                }
            });

        } catch (error) {
            console.error('❌ Error during data preload:', error);
            throw error;
        }
    }

    // Getter methods for components to access preloaded data
    public getPreloadedData(): PreloadedData | null {
        return this.preloadedData;
    }

    public getUserProfile(): any {
        return this.preloadedData?.user.profile || null;
    }

    public getUserProgress(): UserProgress | null {
        return this.preloadedData?.user.progress || null;
    }

    public getUserStats(): UserStats | null {
        return this.preloadedData?.user.stats || null;
    }

    public getFriends(): User[] {
        return this.preloadedData?.friends.list || [];
    }

    public getPendingFriendRequests(): FriendRequest[] {
        return this.preloadedData?.friends.pendingRequests || [];
    }

    public getConversation(friendUsername: string): Message[] {
        return this.preloadedData?.friends.conversations.get(friendUsername) || [];
    }

    public getAchievements(): Achievement[] {
        return this.preloadedData?.achievements || [];
    }

    public getNotifications(): any {
        return this.preloadedData?.notifications || { friendRequests: [], messages: [], achievements: [] };
    }

    // Refresh specific data
    public async refreshData(type?: 'user' | 'friends' | 'achievements' | 'all'): Promise<void> {
        if (!this.preloadedData) return;

        const token = this.getValidToken();
        const currentUserId = this.getUserIdFromToken(token!);
        if (!token || !currentUserId) return;

        try {
            if (!type || type === 'all') {
                await this.performPreload();
                return;
            }

            switch (type) {
                case 'user':
                    const userData = await this.loadUserData();
                    this.preloadedData.user.progress = userData.progress;
                    this.preloadedData.user.stats = userData.stats;
                    break;

                case 'friends':
                    const friendsData = await this.loadFriendsData(currentUserId);
                    this.preloadedData.friends = friendsData;
                    break;

                case 'achievements':
                    const achievements = await this.loadAchievements();
                    this.preloadedData.achievements = achievements;
                    break;
            }

            // Regenerate notifications
            this.preloadedData.notifications = this.generateNotifications(this.preloadedData, currentUserId);
            this.preloadedData.lastUpdated = Date.now();

        } catch (error) {
            console.error(`Error refreshing ${type} data:`, error);
        }
    }

    // Clear cached data (for logout)
    public clearData(): void {
        this.preloadedData = null;
        this.isLoading = false;
        this.loadingPromise = null;
    }
}

export const apiService = APIService.getInstance();