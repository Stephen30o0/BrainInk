// API-based Tournament Service for BrainInk Backend Integration
import { chainlinkTestnetService } from './chainlinkTestnetService';
import { ethers, Contract, formatUnits, parseUnits } from 'ethers';

const API_BASE_URL = 'http://localhost:10000/api/tournaments';

// INK Token Contract ABI for frontend interactions
const INK_TOKEN_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function name() view returns (string)",
    "function symbol() view returns (string)"
];

// Tournament backend escrow address (where tokens are held during tournaments)
const TOURNAMENT_ESCROW_ADDRESS = "0x1234567890123456789012345678901234567890"; // Replace with actual backend escrow address
const INK_TOKEN_ADDRESS = "0x3400d455aC4d50dF70E581b96f980516Af63Fa1c"; // Base Sepolia INK Token

export interface BackendTournament {
    id: string;
    name: string;
    description: string;
    creator_address: string;
    max_players: number;
    current_players: number;
    entry_fee: number;
    prize_pool: number;
    bracket_type: string;
    questions_per_match: number; // 7-15 questions configurable
    time_limit_minutes: number;
    difficulty_level: 'easy' | 'medium' | 'hard';
    subject_category: string;
    custom_topics: string[];
    status: 'registration' | 'active' | 'completed';
    is_public: boolean;
    participants: string[];
    created_at: string;
    started_at?: string;
    completed_at?: string;
}

export interface TournamentMatch {
    id: string;
    tournament_id: string;
    round_number: number;
    player1_address: string;
    player2_address: string;
    status: 'ready' | 'active' | 'completed';
    winner_address?: string;
    questions_generated?: boolean;
    started_at?: string;
    completed_at?: string;
}

export interface QuizQuestion {
    question: string;
    options: {
        A: string;
        B: string;
        C: string;
        D: string;
    };
    correct_answer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
}

export interface MatchSubmission {
    user_address: string;
    answers: string[];
    score: number;
    correct_answers: number;
    total_questions: number;
    completion_time_ms: number;
    percentage: number;
    detailed_results: Array<{
        question_index: number;
        question: string;
        user_answer: string;
        correct_answer: string;
        is_correct: boolean;
        explanation: string;
    }>;
}

export interface TournamentInvitation {
    id: string;
    tournament_id: string;
    inviter_address: string;
    invited_address: string;
    message: string;
    status: 'pending' | 'accepted' | 'declined';
    created_at: string;
    responded_at?: string;
    tournament: BackendTournament;
}

export class BackendTournamentService {
    private userAddress: string | null = null;
    private provider: ethers.BrowserProvider | null = null;
    private signer: ethers.Signer | null = null;
    private inkTokenContract: Contract | null = null;

    initialize(userAddress: string, provider?: ethers.BrowserProvider, signer?: ethers.Signer) {
        this.userAddress = userAddress;

        // Initialize INK token contract if provider and signer are available
        if (provider && signer) {
            this.provider = provider;
            this.signer = signer;
            this.inkTokenContract = new Contract(
                INK_TOKEN_ADDRESS,
                INK_TOKEN_ABI,
                signer
            );
        }
    }

    private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
        const maxRetries = 3;
        const retryDelay = 1000; // 1 second

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                return response;
            } catch (error) {
                console.error(`Request attempt ${attempt} failed:`, error);

                if (attempt === maxRetries) {
                    if (error instanceof Error) {
                        if (error.name === 'AbortError') {
                            throw new Error('Request timeout. Please check your connection and try again.');
                        } else if (error.message.includes('ERR_CONNECTION_REFUSED')) {
                            throw new Error('Tournament backend is not available. Please ensure the server is running at localhost:10000');
                        } else if (error.message.includes('ERR_NETWORK_CHANGED')) {
                            throw new Error('Network connection changed. Please try again.');
                        }
                    }
                    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }

                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            }
        }

        throw new Error('Max retries exceeded');
    }

    // === Tournament Management ===

    async createTournament(params: {
        name: string;
        description?: string;
        creator_address: string;
        max_players: number; // 4, 8, 16, 32, 64
        entry_fee?: number;
        prize_pool?: number;
        questions_per_match: number; // 7-15 questions
        time_limit_minutes?: number;
        difficulty_level?: 'easy' | 'medium' | 'hard';
        subject_category?: string;
        custom_topics?: string[];
        is_public?: boolean;
    }): Promise<{ success: boolean; tournament_id: string; tournament: BackendTournament; transaction_hash?: string }> {
        // Step 1: Handle INK token transactions if prize pool is specified
        let transactionHash: string | undefined;

        if (params.prize_pool && params.prize_pool > 0) {
            // Check if user has enough INK tokens
            const balance = await this.getINKBalance();
            if (parseFloat(balance) < params.prize_pool) {
                throw new Error(`Insufficient INK balance. You have ${balance} INK but need ${params.prize_pool} INK for the prize pool.`);
            }

            // Check and approve INK tokens if needed
            const allowance = await this.checkINKAllowance();
            if (parseFloat(allowance) < params.prize_pool) {
                await this.approveINKForTournament(params.prize_pool.toString());
            }

            // Transfer INK tokens to escrow
            transactionHash = await this.transferINKToEscrow(params.prize_pool.toString());
        }

        // Step 2: Create tournament in backend with transaction hash
        const response = await this.makeRequest(`${API_BASE_URL}/create`, {
            method: 'POST',
            body: JSON.stringify({
                ...params,
                bracket_type: 'single_elimination',
                time_limit_minutes: params.time_limit_minutes || 30,
                difficulty_level: params.difficulty_level || 'medium',
                subject_category: params.subject_category || 'general',
                custom_topics: params.custom_topics || [],
                is_public: params.is_public !== false,
                ink_transaction_hash: transactionHash // Include transaction hash for verification
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create tournament');
        }

        const result = await response.json();
        return {
            ...result,
            transaction_hash: transactionHash
        };
    }

    async getTournaments(filters?: {
        status?: string;
        creator_address?: string;
        is_public?: boolean;
        limit?: number;
    }): Promise<{ success: boolean; tournaments: BackendTournament[] }> {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.creator_address) params.append('creator_address', filters.creator_address);
        if (filters?.is_public !== undefined) params.append('is_public', String(filters.is_public));
        if (filters?.limit) params.append('limit', String(filters.limit));

        const url = `${API_BASE_URL}${params.toString() ? '?' + params.toString() : ''}`;
        const response = await this.makeRequest(url);

        if (!response.ok) {
            throw new Error('Failed to fetch tournaments');
        }

        return await response.json();
    }

    async getTournament(tournamentId: string): Promise<{ success: boolean; tournament: BackendTournament }> {
        const response = await this.makeRequest(`${API_BASE_URL}/${tournamentId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get tournament');
        }

        return await response.json();
    }

    async joinTournament(tournamentId: string, userAddress: string): Promise<{
        success: boolean;
        message: string;
        current_players: number;
        transaction_hash?: string
    }> {
        if (!userAddress || userAddress.trim() === '') {
            throw new Error('User address is required');
        }

        if (!tournamentId || tournamentId.trim() === '') {
            throw new Error('Tournament ID is required');
        }

        // Step 1: Get tournament details to check entry fee
        const tournamentResponse = await this.getTournament(tournamentId);
        if (!tournamentResponse.success) {
            throw new Error('Tournament not found');
        }

        const tournament = tournamentResponse.tournament;
        let transactionHash: string | undefined;

        // Step 2: Handle INK token payment if entry fee is required
        if (tournament.entry_fee && tournament.entry_fee > 0) {
            // Check if user has enough INK tokens
            const balance = await this.getINKBalance();
            if (parseFloat(balance) < tournament.entry_fee) {
                throw new Error(`Insufficient INK balance. You have ${balance} INK but need ${tournament.entry_fee} INK entry fee.`);
            }

            // Check and approve INK tokens if needed
            const allowance = await this.checkINKAllowance();
            if (parseFloat(allowance) < tournament.entry_fee) {
                await this.approveINKForTournament(tournament.entry_fee.toString());
            }

            // Transfer INK tokens to escrow
            transactionHash = await this.transferINKToEscrow(tournament.entry_fee.toString());
        }

        const cleanUserAddress = userAddress.toLowerCase().trim();
        const requestBody = {
            user_address: cleanUserAddress,
            ink_transaction_hash: transactionHash // Include transaction hash for verification
        };

        console.log('Joining tournament:', tournamentId);
        console.log('Request body:', requestBody);

        // Step 3: Join tournament in backend
        const response = await this.makeRequest(`${API_BASE_URL}/${tournamentId}/join`, {
            method: 'POST',
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Join tournament error:', error);
            throw new Error(error.error || 'Failed to join tournament');
        }

        const result = await response.json();
        return {
            ...result,
            transaction_hash: transactionHash
        };
    }

    async startTournament(tournamentId: string, userAddress: string): Promise<{
        success: boolean;
        message: string;
        bracket: {
            tournament_id: string;
            total_rounds: number;
            current_round: number;
            matches: TournamentMatch[];
        };
    }> {
        const response = await this.makeRequest(`${API_BASE_URL}/${tournamentId}/start`, {
            method: 'POST',
            body: JSON.stringify({ user_address: userAddress })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to start tournament');
        }

        return await response.json();
    }

    // === Question Generation with Chainlink Integration ===

    async generateQuestionsForMatch(tournamentId: string, matchId: string): Promise<{
        success: boolean;
        questions: QuizQuestion[];
        expires_at: string;
        time_limit_minutes: number;
    }> {
        // First try to get existing questions
        const response = await this.makeRequest(`${API_BASE_URL}/${tournamentId}/matches/${matchId}/questions`, {
            method: 'POST'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate questions');
        }

        return await response.json();
    }

    async generateChainlinkQuestions(
        subject: string,
        difficulty: 'easy' | 'medium' | 'hard',
        questionCount: number = 10
    ): Promise<QuizQuestion[]> {
        try {
            // Use Chainlink Automation service to generate AI questions
            const quizData = await chainlinkTestnetService.generateDynamicQuiz(subject, difficulty);

            if (quizData && quizData.success) {
                // Convert single question to array format expected by tournament
                return Array(questionCount).fill(null).map((_, index) => ({
                    question: `${quizData.question} (Question ${index + 1})`,
                    options: {
                        A: quizData.options[0] || 'Option A',
                        B: quizData.options[1] || 'Option B',
                        C: quizData.options[2] || 'Option C',
                        D: quizData.options[3] || 'Option D'
                    },
                    correct_answer: ['A', 'B', 'C', 'D'][quizData.correctAnswer] as 'A' | 'B' | 'C' | 'D',
                    explanation: `Generated via Chainlink Functions + Kana AI for ${subject}`
                }));
            }

            throw new Error('Failed to generate questions via Chainlink');
        } catch (error) {
            console.error('Chainlink question generation failed:', error);
            // Fallback to backend generation
            throw error;
        }
    }

    // === Match & Quiz Gameplay ===

    async submitAnswers(
        tournamentId: string,
        matchId: string,
        userAddress: string,
        answers: string[],
        completionTimeMs: number
    ): Promise<{
        success: boolean;
        submission: MatchSubmission;
        match_result?: {
            winner: string;
            final_scores: Array<{
                user_address: string;
                score: number;
                completion_time_ms: number;
            }>;
        };
    }> {
        const response = await this.makeRequest(`${API_BASE_URL}/${tournamentId}/matches/${matchId}/submit`, {
            method: 'POST',
            body: JSON.stringify({
                user_address: userAddress,
                answers,
                completion_time_ms: completionTimeMs
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to submit answers');
        }

        return await response.json();
    }

    async getMatchDetails(tournamentId: string, matchId: string): Promise<{
        success: boolean;
        match: TournamentMatch & {
            submissions: Array<{
                user_address: string;
                score: number;
                correct_answers: number;
                total_questions: number;
                completion_time_ms: number;
                submitted_at: string;
            }>;
            questions_available: boolean;
            questions_expired: boolean;
        };
    }> {
        const response = await this.makeRequest(`${API_BASE_URL}/${tournamentId}/matches/${matchId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get match details');
        }

        return await response.json();
    }

    // === Tournament Bracket ===

    async getTournamentBracket(tournamentId: string): Promise<{
        success: boolean;
        bracket: any;
        matches: TournamentMatch[];
        tournament_status: string;
    }> {
        const response = await this.makeRequest(`${API_BASE_URL}/${tournamentId}/bracket`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get tournament bracket');
        }

        return await response.json();
    }

    // === User Tournaments ===

    async getMyTournaments(userAddress: string, filters?: {
        status?: string;
        limit?: number;
    }): Promise<{
        success: boolean;
        tournaments: Array<BackendTournament & {
            user_role: 'creator' | 'participant';
            is_creator: boolean;
            is_participant: boolean;
        }>;
    }> {
        if (!userAddress || userAddress.trim() === '') {
            throw new Error('User address is required');
        }

        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.limit) params.append('limit', String(filters.limit));

        const cleanUserAddress = userAddress.toLowerCase().trim();
        const url = `${API_BASE_URL}/my/${cleanUserAddress}${params.toString() ? '?' + params.toString() : ''}`;

        console.log('Getting my tournaments for user:', cleanUserAddress);
        console.log('Full URL:', url);

        const response = await this.makeRequest(url);

        if (!response.ok) {
            const error = await response.json();
            console.error('getMyTournaments error:', error);
            throw new Error(error.error || 'Tournament not found');
        }

        return await response.json();
    }

    // === Invitations ===

    async invitePlayersToTournament(
        tournamentId: string,
        inviterAddress: string,
        invitedAddresses: string[],
        message?: string
    ): Promise<{
        success: boolean;
        invited: Array<{ address: string; status: string }>;
        errors: Array<{ address: string; error: string }>;
        message: string;
    }> {
        const response = await this.makeRequest(`${API_BASE_URL}/${tournamentId}/invite`, {
            method: 'POST',
            body: JSON.stringify({
                inviter_address: inviterAddress,
                invited_addresses: invitedAddresses,
                message: message || ''
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send invitations');
        }

        return await response.json();
    }

    async getMyInvitations(userAddress: string, status: 'pending' | 'accepted' | 'declined' = 'pending'): Promise<{
        success: boolean;
        invitations: TournamentInvitation[];
    }> {
        const response = await this.makeRequest(`${API_BASE_URL}/invitations/${userAddress}?status=${status}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get invitations');
        }

        return await response.json();
    }

    async respondToInvitation(
        invitationId: string,
        userAddress: string,
        response: 'accept' | 'decline'
    ): Promise<{
        success: boolean;
        message: string;
        response: string;
        invitation_id: string;
        tournament_id: string;
        joined?: boolean;
        current_players?: number;
    }> {
        const apiResponse = await this.makeRequest(`${API_BASE_URL}/invitations/${invitationId}/respond`, {
            method: 'POST',
            body: JSON.stringify({
                user_address: userAddress,
                response
            })
        });

        if (!apiResponse.ok) {
            const error = await apiResponse.json();
            throw new Error(error.error || 'Failed to respond to invitation');
        }

        return await apiResponse.json();
    }

    // === INK Token Integration Methods ===

    async getINKBalance(): Promise<string> {
        if (!this.inkTokenContract || !this.userAddress) {
            throw new Error('INK token contract not initialized. Please connect your wallet.');
        }

        try {
            const balance = await this.inkTokenContract.balanceOf(this.userAddress);
            const decimals = await this.inkTokenContract.decimals();
            return formatUnits(balance, decimals);
        } catch (error) {
            console.error('Error getting INK balance:', error);
            throw new Error('Failed to get INK token balance');
        }
    }

    async checkINKAllowance(): Promise<string> {
        if (!this.inkTokenContract || !this.userAddress) {
            throw new Error('INK token contract not initialized. Please connect your wallet.');
        }

        try {
            const allowance = await this.inkTokenContract.allowance(this.userAddress, TOURNAMENT_ESCROW_ADDRESS);
            const decimals = await this.inkTokenContract.decimals();
            return formatUnits(allowance, decimals);
        } catch (error) {
            console.error('Error checking INK allowance:', error);
            throw new Error('Failed to check INK token allowance');
        }
    }

    async approveINKForTournament(amount: string): Promise<string> {
        if (!this.inkTokenContract || !this.userAddress) {
            throw new Error('INK token contract not initialized. Please connect your wallet.');
        }

        try {
            const decimals = await this.inkTokenContract.decimals();
            const amountWei = parseUnits(amount, decimals);

            console.log(`Approving ${amount} INK tokens for tournament escrow...`);
            const tx = await this.inkTokenContract.approve(TOURNAMENT_ESCROW_ADDRESS, amountWei);

            console.log('Approval transaction sent:', tx.hash);
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                console.log('INK tokens approved successfully');
                return tx.hash;
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Error approving INK tokens:', error);
            throw new Error(`Failed to approve INK tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async transferINKToEscrow(amount: string): Promise<string> {
        if (!this.inkTokenContract || !this.userAddress) {
            throw new Error('INK token contract not initialized. Please connect your wallet.');
        }

        try {
            const decimals = await this.inkTokenContract.decimals();
            const amountWei = parseUnits(amount, decimals);

            console.log(`Transferring ${amount} INK tokens to escrow...`);
            const tx = await this.inkTokenContract.transfer(TOURNAMENT_ESCROW_ADDRESS, amountWei);

            console.log('Transfer transaction sent:', tx.hash);
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                console.log('INK tokens transferred successfully');
                return tx.hash;
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Error transferring INK tokens:', error);
            throw new Error(`Failed to transfer INK tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getINKTokenInfo(): Promise<{
        name: string;
        symbol: string;
        decimals: number;
        userBalance: string;
        allowance: string;
    }> {
        if (!this.inkTokenContract || !this.userAddress) {
            throw new Error('INK token contract not initialized. Please connect your wallet.');
        }

        try {
            const [name, symbol, decimals, balance, allowance] = await Promise.all([
                this.inkTokenContract.name(),
                this.inkTokenContract.symbol(),
                this.inkTokenContract.decimals(),
                this.inkTokenContract.balanceOf(this.userAddress),
                this.inkTokenContract.allowance(this.userAddress, TOURNAMENT_ESCROW_ADDRESS)
            ]);

            return {
                name,
                symbol,
                decimals: Number(decimals),
                userBalance: formatUnits(balance, decimals),
                allowance: formatUnits(allowance, decimals)
            };
        } catch (error) {
            console.error('Error getting INK token info:', error);
            throw new Error('Failed to get INK token information');
        }
    }

    // === Tournament Escrow Methods ===

    async getTournamentEscrowInfo(tournamentId: string): Promise<{
        success: boolean;
        escrow: {
            total_prize_pool: number;
            total_entry_fees: number;
            creator_contribution: number;
            participants_paid: number;
            status: string;
        };
    }> {
        const response = await this.makeRequest(`${API_BASE_URL}/${tournamentId}/escrow`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get tournament escrow info');
        }

        return await response.json();
    }

    async getTournamentTransactions(tournamentId: string): Promise<{
        success: boolean;
        transactions: Array<{
            user_address: string;
            transaction_type: string;
            amount: number;
            transaction_hash: string;
            status: string;
            created_at: string;
        }>;
    }> {
        const response = await this.makeRequest(`${API_BASE_URL}/${tournamentId}/transactions`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get tournament transactions');
        }

        return await response.json();
    }

    // === Utility Methods ===

    async checkBackendHealth(): Promise<boolean> {
        try {
            const response = await this.makeRequest(`${API_BASE_URL}/debug/test`);
            return response.ok;
        } catch {
            return false;
        }
    }

    // Test if backend is accessible
    async testConnection(): Promise<{ connected: boolean; message: string }> {
        try {
            const response = await this.makeRequest(`${API_BASE_URL}/debug/test`);
            if (response.ok) {
                const data = await response.json();
                return {
                    connected: true,
                    message: `Backend connected: ${data.message}`
                };
            } else {
                return {
                    connected: false,
                    message: `Backend responded with status ${response.status}`
                };
            }
        } catch (error) {
            return {
                connected: false,
                message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    // Tournament validation helpers
    validateQuestionCount(count: number): boolean {
        return count >= 7 && count <= 15;
    }

    validateMaxPlayers(count: number): boolean {
        return [4, 8, 16, 32, 64].includes(count);
    }

    getAvailableSubjects(): string[] {
        return [
            'mathematics',
            'physics',
            'chemistry',
            'biology',
            'history',
            'geography',
            'literature',
            'computer-science',
            'psychology',
            'economics',
            'astronomy',
            'art-history',
            'philosophy',
            'environmental-science',
            'anatomy',
            'genetics',
            'world-languages',
            'music-theory',
            'engineering',
            'archaeology',
            'neuroscience',
            'statistics',
            'geology',
            'political-science',
            'sociology'
        ];
    }
}

export const backendTournamentService = new BackendTournamentService();
