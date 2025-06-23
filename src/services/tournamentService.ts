import { ethers, Contract, formatUnits, parseUnits } from 'ethers';

interface TournamentData {
  id: number;
  name: string;
  creator: string;
  entryFee: string;
  maxParticipants: number;
  currentParticipants: number;
  prizePool: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
  isCompleted: boolean;
  participants: string[];
  winner: string;
}

interface ParticipantData {
  player: string;
  score: number;
  completionTime: number;
  hasSubmitted: boolean;
}

const TOURNAMENT_MANAGER_ABI = [
  "function createTournament(string memory _name, uint256 _entryFee, uint256 _maxParticipants, uint256 _duration) external",
  "function joinTournament(uint256 _tournamentId) external",
  "function submitScore(uint256 _tournamentId, uint256 _score, uint256 _completionTime) external",
  "function getTournament(uint256 _tournamentId) external view returns (tuple(uint256 id, string name, address creator, uint256 entryFee, uint256 maxParticipants, uint256 currentParticipants, uint256 prizePool, uint256 startTime, uint256 endTime, bool isActive, bool isCompleted, address[] participants, address winner, uint256 vrfRequestId))",
  "function getParticipant(uint256 _tournamentId, address _player) external view returns (tuple(address player, uint256 score, uint256 completionTime, bool hasSubmitted))",
  "function getActiveTournaments() external view returns (uint256[])",
  "function getTournamentParticipants(uint256 _tournamentId) external view returns (address[])",
  "event TournamentCreated(uint256 indexed tournamentId, string name, address creator, uint256 entryFee)",
  "event PlayerJoined(uint256 indexed tournamentId, address player)",
  "event ScoreSubmitted(uint256 indexed tournamentId, address player, uint256 score, uint256 completionTime)",
  "event TournamentEnded(uint256 indexed tournamentId, address winner, uint256 prize)"
];

const INK_TOKEN_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

export class TournamentService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private tournamentContract: Contract | null = null;
  private inkTokenContract: Contract | null = null;
  private userAddress: string | null = null;
  // Contract addresses (update with actual deployed addresses)
  private readonly TOURNAMENT_CONTRACT_ADDRESS = "0x31C3D3de371e155b7dacEd91Cf1C2C675964Af30"; // TournamentManager on Base Sepolia
  private readonly INK_TOKEN_ADDRESS = "0x3400d455aC4d50dF70E581b96f980516Af63Fa1c"; // Base Sepolia INK Token

  async initialize(provider: ethers.BrowserProvider, signer: ethers.Signer, userAddress: string) {
    this.provider = provider;
    this.signer = signer;
    this.userAddress = userAddress;

    this.tournamentContract = new Contract(
      this.TOURNAMENT_CONTRACT_ADDRESS,
      TOURNAMENT_MANAGER_ABI,
      signer
    );

    this.inkTokenContract = new Contract(
      this.INK_TOKEN_ADDRESS,
      INK_TOKEN_ABI,
      signer
    );
  }

  async getINKBalance(): Promise<string> {
    if (!this.inkTokenContract || !this.userAddress) {
      throw new Error("Service not initialized");
    }

    try {
      const balance = await this.inkTokenContract.balanceOf(this.userAddress);
      const decimals = await this.inkTokenContract.decimals();
      return formatUnits(balance, decimals);
    } catch (error) {
      console.error("Error getting INK balance:", error);
      throw error;
    }
  }

  async approveINKForTournament(amount: string): Promise<void> {
    if (!this.inkTokenContract) {
      throw new Error("Service not initialized");
    }

    try {
      const decimals = await this.inkTokenContract.decimals();
      const amountInWei = parseUnits(amount, decimals);
      
      const tx = await this.inkTokenContract.approve(this.TOURNAMENT_CONTRACT_ADDRESS, amountInWei);
      await tx.wait();
    } catch (error) {
      console.error("Error approving INK tokens:", error);
      throw error;
    }
  }

  async checkINKAllowance(): Promise<string> {
    if (!this.inkTokenContract || !this.userAddress) {
      throw new Error("Service not initialized");
    }

    try {
      const allowance = await this.inkTokenContract.allowance(this.userAddress, this.TOURNAMENT_CONTRACT_ADDRESS);
      const decimals = await this.inkTokenContract.decimals();
      return formatUnits(allowance, decimals);
    } catch (error) {
      console.error("Error checking INK allowance:", error);
      throw error;
    }
  }
  async createTournament(name: string, entryFee: string, maxParticipants: number, durationHours: number): Promise<number> {
    if (!this.tournamentContract) {
      throw new Error("Service not initialized");
    }

    try {
      const decimals = await this.inkTokenContract!.decimals();
      const entryFeeInWei = parseUnits(entryFee, decimals);
      const durationInSeconds = durationHours * 3600;

      const tx = await this.tournamentContract.createTournament(
        name,
        entryFeeInWei,
        maxParticipants,
        durationInSeconds
      );
      const receipt = await tx.wait();

      // Extract tournament ID from the event
      const event = receipt.logs.find((log: any) => log.fragment?.name === 'TournamentCreated');
      if (event) {
        return Number(event.args[0]); // Tournament ID is the first argument
      }
      
      throw new Error("Tournament creation event not found");
    } catch (error) {
      console.error("Error creating tournament:", error);
      throw error;
    }
  }

  async joinTournament(tournamentId: number): Promise<void> {
    if (!this.tournamentContract) {
      throw new Error("Service not initialized");
    }

    try {
      // First check if we need to approve tokens
      const tournament = await this.getTournament(tournamentId);
      const entryFee = formatUnits(tournament.entryFee, 18);
      const allowance = await this.checkINKAllowance();

      if (parseFloat(allowance) < parseFloat(entryFee)) {
        await this.approveINKForTournament(entryFee);
      }

      const tx = await this.tournamentContract.joinTournament(tournamentId);
      await tx.wait();
    } catch (error) {
      console.error("Error joining tournament:", error);
      throw error;
    }
  }

  async submitScore(tournamentId: number, score: number, completionTimeMs: number): Promise<void> {
    if (!this.tournamentContract) {
      throw new Error("Service not initialized");
    }

    try {
      const tx = await this.tournamentContract.submitScore(tournamentId, score, completionTimeMs);
      await tx.wait();
    } catch (error) {
      console.error("Error submitting score:", error);
      throw error;
    }
  }

  async getTournament(tournamentId: number): Promise<TournamentData> {
    if (!this.tournamentContract) {
      throw new Error("Service not initialized");
    }

    try {
      const tournament = await this.tournamentContract.getTournament(tournamentId);
      return {
        id: Number(tournament.id),
        name: tournament.name,
        creator: tournament.creator,
        entryFee: tournament.entryFee.toString(),
        maxParticipants: Number(tournament.maxParticipants),
        currentParticipants: Number(tournament.currentParticipants),
        prizePool: tournament.prizePool.toString(),
        startTime: Number(tournament.startTime),
        endTime: Number(tournament.endTime),
        isActive: tournament.isActive,
        isCompleted: tournament.isCompleted,
        participants: tournament.participants,
        winner: tournament.winner
      };
    } catch (error) {
      console.error("Error getting tournament:", error);
      throw error;
    }
  }

  async getActiveTournaments(): Promise<number[]> {
    if (!this.tournamentContract) {
      throw new Error("Service not initialized");
    }

    try {
      const tournamentIds = await this.tournamentContract.getActiveTournaments();
      return tournamentIds.map((id: any) => Number(id));
    } catch (error) {
      console.error("Error getting active tournaments:", error);
      throw error;
    }
  }

  async getParticipant(tournamentId: number, playerAddress?: string): Promise<ParticipantData> {
    if (!this.tournamentContract) {
      throw new Error("Service not initialized");
    }

    const address = playerAddress || this.userAddress;
    if (!address) {
      throw new Error("No player address provided");
    }

    try {
      const participant = await this.tournamentContract.getParticipant(tournamentId, address);
      return {
        player: participant.player,
        score: Number(participant.score),
        completionTime: Number(participant.completionTime),
        hasSubmitted: participant.hasSubmitted
      };
    } catch (error) {
      console.error("Error getting participant:", error);
      throw error;
    }
  }

  async getAllTournamentsWithDetails(): Promise<TournamentData[]> {
    try {
      const activeTournamentIds = await this.getActiveTournaments();
      const tournaments: TournamentData[] = [];

      for (const id of activeTournamentIds) {
        try {
          const tournament = await this.getTournament(id);
          tournaments.push(tournament);
        } catch (error) {
          console.error(`Error fetching tournament ${id}:`, error);
        }
      }

      return tournaments.sort((a, b) => b.startTime - a.startTime);
    } catch (error) {
      console.error("Error getting all tournaments:", error);
      return [];
    }
  }

  async isUserInTournament(tournamentId: number, userAddress: string): Promise<boolean> {
    if (!this.tournamentContract) {
      throw new Error("Service not initialized");
    }

    try {
      const participant = await this.tournamentContract.getParticipant(tournamentId, userAddress);
      // If the participant address is not zero address, user is in tournament
      return participant.player !== "0x0000000000000000000000000000000000000000";
    } catch (error) {
      // If the call fails, user is probably not in tournament
      console.log(`User ${userAddress} not in tournament ${tournamentId}`);
      return false;
    }
  }

  // Event listeners
  onTournamentCreated(callback: (tournamentId: number, name: string, creator: string, entryFee: string) => void) {
    if (!this.tournamentContract) return;

    this.tournamentContract.on("TournamentCreated", (tournamentId, name, creator, entryFee) => {
      callback(Number(tournamentId), name, creator, entryFee.toString());
    });
  }

  onPlayerJoined(callback: (tournamentId: number, player: string) => void) {
    if (!this.tournamentContract) return;

    this.tournamentContract.on("PlayerJoined", (tournamentId, player) => {
      callback(Number(tournamentId), player);
    });
  }

  onTournamentEnded(callback: (tournamentId: number, winner: string, prize: string) => void) {
    if (!this.tournamentContract) return;

    this.tournamentContract.on("TournamentEnded", (tournamentId, winner, prize) => {
      callback(Number(tournamentId), winner, prize.toString());
    });
  }

  removeAllListeners() {
    if (this.tournamentContract) {
      this.tournamentContract.removeAllListeners();
    }
  }
}

export const tournamentService = new TournamentService();
