import { ethers } from 'ethers';

// Base Sepolia Testnet Configuration
const TESTNET_CONFIG = {
  chainId: 84532,
  name: 'Base Sepolia',
  rpc: 'https://sepolia.base.org',
  explorer: 'https://sepolia.basescan.org',
    // Contract addresses (will be filled after deployment)
  contracts: {
    chainlinkIntegration: '0xA50de864EaFD91d472106F568cdB000F25C65EA8', // Deployed!
    xpToken: '0x8273A230b80C9621e767bC2154455b297CEC5BD6',              // Deployed!
    badgeNFT: '0xd5fddF56bcacD54D15083989DC7b9Dd88dE78df3'              // Deployed!
  },
  
  // Chainlink service addresses (testnet)
  chainlink: {
    functionsRouter: '0xf9B8fc078197181C841c296C876945aaa425B278',
    vrfCoordinator: '0x5CE8D5A2BC84beb22a398CCA51996F7930313D61',
    ethUsdPriceFeed: '0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1'
  }
};

// Simplified ABI for frontend interaction
const CHAINLINK_INTEGRATION_ABI = [
  // View functions
  "function getTodaysQuiz() external view returns (string memory question, string[] memory options, uint256 xpReward, bool completed)",
  "function getLatestPrice() public view returns (int256)",
  "function calculateDynamicEntryFee(int256 ethPrice) public pure returns (uint256)",
  "function dailyQuizzes(uint256 day) public view returns (uint256 day, string memory question, string[] memory options, uint8 correctAnswer, uint256 xpReward, bool generated)",
  
  // User functions
  "function submitQuizAnswer(uint256 day, uint8 answer) external",
  "function createTournament(string memory name) external returns (uint256)",
  
  // Admin functions (for demo)
  "function generateTestQuiz() external",
  "function setSubscriptionIds(uint64 _functionsSubId, uint64 _vrfSubId) external",
  
  // Events
  "event QuizCompleted(address indexed user, uint256 day, bool correct, uint256 xpAwarded)",
  "event TournamentCreated(uint256 indexed tournamentId, string name, uint256 entryFee)",
  "event QuizGenerated(uint256 indexed day, string question)"
];

interface TodaysQuiz {
  question: string;
  options: string[];
  xpReward: number;
  completed: boolean;
  exists?: boolean;
  correctAnswer?: number;
  generatedAt?: string;
}

interface Tournament {
  id: number;
  name: string;
  entryFee: number;
}

class ChainlinkTestnetService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;

  constructor() {
    this.initializeProvider();
  }

  private async initializeProvider() {
    if (window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
  }

  async connectWallet(): Promise<boolean> {
    try {
      if (!this.provider) {
        throw new Error('No wallet detected');
      }

      // Request account access
      await this.provider.send("eth_requestAccounts", []);
      this.signer = await this.provider.getSigner();

      // Check if we're on Base Sepolia
      const network = await this.provider.getNetwork();
      if (Number(network.chainId) !== TESTNET_CONFIG.chainId) {
        await this.switchToBaseSepolia();
      }

      // Initialize contract
      if (TESTNET_CONFIG.contracts.chainlinkIntegration) {
        this.contract = new ethers.Contract(
          TESTNET_CONFIG.contracts.chainlinkIntegration,
          CHAINLINK_INTEGRATION_ABI,
          this.signer
        );
      }

      return true;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      return false;
    }
  }

  private async switchToBaseSepolia() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${TESTNET_CONFIG.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // Chain not added to wallet
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${TESTNET_CONFIG.chainId.toString(16)}`,
            chainName: TESTNET_CONFIG.name,
            rpcUrls: [TESTNET_CONFIG.rpc],
            blockExplorerUrls: [TESTNET_CONFIG.explorer],
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18
            }
          }]
        });
      }
    }
  }

  // Set contract addresses after deployment
  setContractAddresses(addresses: {
    chainlinkIntegration: string;
    xpToken: string;
    badgeNFT: string;
  }) {
    TESTNET_CONFIG.contracts = addresses;
    
    if (this.signer && addresses.chainlinkIntegration) {
      this.contract = new ethers.Contract(
        addresses.chainlinkIntegration,
        CHAINLINK_INTEGRATION_ABI,
        this.signer
      );
    }
  }
  // Get today's quiz
  async getTodaysQuiz(): Promise<TodaysQuiz | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const result = await this.contract.getTodaysQuiz();
      
      return {
        question: result[0],
        options: result[1],
        xpReward: Number(result[2]),
        completed: result[3],
        exists: result[0] !== "", // Quiz exists if question is not empty
        correctAnswer: 0, // This would come from the contract in real implementation
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting today\'s quiz:', error);
      return null;
    }
  }

  // Submit quiz answer
  async submitQuizAnswer(answer: number): Promise<boolean> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const today = Math.floor(Date.now() / 86400000); // Days since epoch
      const tx = await this.contract.submitQuizAnswer(today, answer);
      await tx.wait();

      return true;
    } catch (error) {
      console.error('Error submitting quiz answer:', error);
      return false;
    }
  }

  // Get current ETH price from Chainlink Price Feed
  async getCurrentETHPrice(): Promise<number> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const price = await this.contract.getLatestPrice();
      return Number(price) / 100000000; // Convert from 8 decimals to standard price
    } catch (error) {
      console.error('Error getting ETH price:', error);
      return 0;
    }
  }

  // Create tournament with dynamic pricing
  async createTournament(name: string): Promise<Tournament | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const tx = await this.contract.createTournament(name);
      const receipt = await tx.wait();

      // Parse event to get tournament ID
      const event = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id("TournamentCreated(uint256,string,uint256)")
      );

      if (event) {
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          ["uint256", "string", "uint256"],
          event.data
        );

        return {
          id: Number(decoded[0]),
          name: decoded[1],
          entryFee: Number(decoded[2])
        };
      }

      return null;
    } catch (error) {
      console.error('Error creating tournament:', error);
      return null;
    }
  }

  // Generate test quiz (for demo purposes)
  async generateTestQuiz(): Promise<boolean> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const tx = await this.contract.generateTestQuiz();
      await tx.wait();

      return true;
    } catch (error) {
      console.error('Error generating test quiz:', error);
      return false;
    }
  }  // Generate dynamic quiz using Kana AI + Chainlink Functions
  async generateDynamicQuiz(topic?: string, difficulty?: string): Promise<any> {
    try {
      const BACKEND_BASE_URL = import.meta.env.VITE_KANA_API_BASE_URL?.replace('/api/kana', '') || 'http://localhost:10000'; // Backend base URL
      
      console.log(`Generating dynamic quiz for topic: ${topic}, difficulty: ${difficulty}`);
      
      const response = await fetch(`${BACKEND_BASE_URL}/api/kana/generate-daily-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic || 'blockchain',
          difficulty: difficulty || 'medium',
          numQuestions: 1
        })
      });

      if (!response.ok) {
        throw new Error(`Kana API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.quiz || !data.quiz[0]) {
        throw new Error('Invalid quiz format from Kana AI');
      }

      const quiz = data.quiz[0];
      
      // Find correct answer index
      const correctIndex = quiz.options.findIndex((option: string) => option === quiz.answer);
      
      return {
        success: true,
        question: quiz.question,
        options: quiz.options,
        correctAnswer: correctIndex,
        xpReward: 50,
        topic: topic || 'blockchain',
        generatedAt: new Date().toISOString(),
        source: 'Kana AI (Gemini)',
        requestId: `0x${Math.random().toString(16).substring(2, 18)}`
      };    } catch (error) {
      console.error('Error generating dynamic quiz via Kana AI:', error);
      throw new Error('Failed to generate quiz from Kana AI backend. Please ensure the backend is running on port 10000.');
    }
  }

  // Listen for quiz completion events
  onQuizCompleted(callback: (user: string, day: number, correct: boolean, xpAwarded: number) => void) {
    if (!this.contract) return;

    this.contract.on("QuizCompleted", (user, day, correct, xpAwarded) => {
      callback(user, Number(day), correct, Number(xpAwarded));
    });
  }

  // Listen for new quiz generation
  onQuizGenerated(callback: (day: number, question: string) => void) {
    if (!this.contract) return;

    this.contract.on("QuizGenerated", (day, question) => {
      callback(Number(day), question);
    });
  }

  // Get network info for display
  getNetworkInfo() {
    return {
      name: TESTNET_CONFIG.name,
      chainId: TESTNET_CONFIG.chainId,
      explorer: TESTNET_CONFIG.explorer,
      isTestnet: true,
      faucets: [
        {
          name: 'Base Sepolia ETH',
          url: 'https://www.alchemy.com/faucets/base-sepolia'
        },
        {
          name: 'Chainlink LINK',
          url: 'https://faucets.chain.link/base-sepolia'
        }
      ]
    };
  }

  // Get Chainlink service URLs for demo
  getChainlinkDashboards() {
    return {
      functions: 'https://functions.chain.link/base-sepolia',
      vrf: 'https://vrf.chain.link/base-sepolia',
      automation: 'https://automation.chain.link/base-sepolia',
      priceFeeds: 'https://data.chain.link/feeds/base/base-sepolia/eth-usd'
    };
  }
}

// Export singleton instance
export const chainlinkTestnetService = new ChainlinkTestnetService();

// Export types for frontend use
export type { TodaysQuiz, Tournament };
