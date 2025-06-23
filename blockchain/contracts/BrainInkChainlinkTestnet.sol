// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/functions/v1_3_0/FunctionsClient.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./XPToken.sol";
import "./BadgeNFT.sol";

/**
 * @title BrainInkChainlinkTestnet
 * @dev Testnet-optimized Chainlink integration for Brain Ink platform
 * Designed for competition demo with minimal costs
 */
contract BrainInkChainlinkTestnet is 
    FunctionsClient, 
    AutomationCompatibleInterface, 
    VRFConsumerBaseV2, 
    Ownable 
{
    // Base Sepolia Chainlink addresses
    VRFCoordinatorV2Interface COORDINATOR;
    AggregatorV3Interface internal priceFeed;
    
    // Subscription IDs (set after creating subscriptions)
    uint64 public s_functionsSubscriptionId;
    uint64 public s_vrfSubscriptionId;
    
    // VRF Configuration
    bytes32 keyHash = 0x06eb0e2ea7cca202fc7c8258397a36f33d6d52c0c7c0c8f8ddca3b33e9f4deff;
    uint32 callbackGasLimit = 100000;
    uint16 requestConfirmations = 3;
    uint32 numWords = 1;
    
    // Contract references
    XPToken public xpToken;
    BadgeNFT public badgeNFT;
    
    // Daily challenge system
    uint256 public lastChallengeDay;
    uint256 public challengeCounter;
    
    // Quiz system
    struct DailyQuiz {
        uint256 day;
        string question;
        string[] options;
        uint8 correctAnswer;
        uint256 xpReward;
        bool generated;
    }
      mapping(uint256 => DailyQuiz) public dailyQuizzes;
    mapping(uint256 => uint256) public vrfRequestToDay;
    mapping(bytes32 => bool) public functionsRequestPending;
    mapping(address => mapping(uint256 => bool)) public userQuizCompleted;
    
    // Tournament system
    struct Tournament {
        uint256 id;
        string name;
        uint256 entryFee;
        uint256[] participants;
        uint256 winner;
        bool completed;
        uint256 randomSeed;
    }
    
    mapping(uint256 => Tournament) public tournaments;
    uint256 public tournamentCounter;
    
    // Events
    event DailyChallengeStarted(uint256 indexed day, uint256 requestId);
    event QuizGenerated(uint256 indexed day, string question);
    event QuizCompleted(address indexed user, uint256 day, bool correct, uint256 xpAwarded);
    event TournamentCreated(uint256 indexed tournamentId, string name, uint256 entryFee);
    event TournamentCompleted(uint256 indexed tournamentId, uint256 winner);
    event PriceUpdated(int256 newPrice);
    
    constructor(
        address _xpToken,
        address _badgeNFT
    ) 
        FunctionsClient(0xf9B8fc078197181C841c296C876945aaa425B278) // Base Sepolia Functions Router
        VRFConsumerBaseV2(0x5CE8D5A2BC84beb22a398CCA51996F7930313D61) // Base Sepolia VRF Coordinator
        Ownable(msg.sender)
    {
        COORDINATOR = VRFCoordinatorV2Interface(0x5CE8D5A2BC84beb22a398CCA51996F7930313D61);
        priceFeed = AggregatorV3Interface(0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1); // ETH/USD Base Sepolia
        xpToken = XPToken(_xpToken);
        badgeNFT = BadgeNFT(_badgeNFT);
    }
    
    /**
     * @dev Set subscription IDs after creating them on Chainlink
     */
    function setSubscriptionIds(uint64 _functionsSubId, uint64 _vrfSubId) external onlyOwner {
        s_functionsSubscriptionId = _functionsSubId;
        s_vrfSubscriptionId = _vrfSubId;
    }
    
    /**
     * @dev Chainlink Automation - Check if daily challenge needs to be created
     */
    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint256 currentDay = block.timestamp / 86400;
        upkeepNeeded = currentDay > lastChallengeDay && s_vrfSubscriptionId > 0;
        performData = abi.encode(currentDay);
    }
    
    /**
     * @dev Automation callback - Start daily challenge creation
     */
    function performUpkeep(bytes calldata performData) external override {
        uint256 currentDay = abi.decode(performData, (uint256));
        
        if (currentDay > lastChallengeDay && s_vrfSubscriptionId > 0) {
            lastChallengeDay = currentDay;
              // Request randomness for challenge type selection
            uint256 requestId = COORDINATOR.requestRandomWords(
                keyHash,
                s_vrfSubscriptionId,
                requestConfirmations,
                callbackGasLimit,
                numWords
            );
            
            vrfRequestToDay[requestId] = currentDay;
            emit DailyChallengeStarted(currentDay, requestId);
        }
    }
    
    /**
     * @dev VRF Callback - Use randomness to generate quiz
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        uint256 day = vrfRequestToDay[requestId];
        uint256 randomness = randomWords[0];
        
        // Use randomness to determine quiz parameters
        string memory subject = getRandomSubject(randomness % 5);
        string memory difficulty = getRandomDifficulty((randomness / 5) % 3);
        
        // For testnet demo, create quiz immediately without external API
        createTestnetQuiz(day, subject, difficulty, randomness);
    }
    
    /**
     * @dev Create a quiz for testnet demonstration
     */
    function createTestnetQuiz(
        uint256 day,
        string memory subject,
        string memory difficulty,
        uint256 seed
    ) internal {
        // Pre-defined quiz questions for testnet demo
        string[5] memory questions = [
            "What is 2 + 2?",
            "What is the capital of France?",
            "What is H2O?",
            "Who wrote Romeo and Juliet?",
            "What is the largest planet?"
        ];
          string[4][5] memory allOptions = [
            ["3", "4", "5", "6"],
            ["London", "Paris", "Berlin", "Madrid"],
            ["Water", "Oxygen", "Hydrogen", "Carbon"],
            ["Shakespeare", "Dickens", "Austen", "Hemingway"],
            ["Earth", "Jupiter", "Saturn", "Mars"]
        ];
        
        uint8[5] memory correctAnswers = [1, 1, 0, 0, 1];
        
        uint256 questionIndex = seed % 5;
        
        DailyQuiz storage quiz = dailyQuizzes[day];
        quiz.day = day;
        quiz.question = questions[questionIndex];
        quiz.options = allOptions[questionIndex];
        quiz.correctAnswer = correctAnswers[questionIndex];
        quiz.xpReward = 20 + (seed % 30); // 20-50 XP reward
        quiz.generated = true;
        
        emit QuizGenerated(day, quiz.question);
    }
    
    /**
     * @dev Submit quiz answer
     */
    function submitQuizAnswer(uint256 day, uint8 answer) external {
        require(dailyQuizzes[day].generated, "Quiz not available");
        require(!userQuizCompleted[msg.sender][day], "Already completed today's quiz");
        
        DailyQuiz storage quiz = dailyQuizzes[day];
        bool isCorrect = answer == quiz.correctAnswer;
        uint256 xpAwarded = 0;
        
        if (isCorrect) {
            xpAwarded = quiz.xpReward;
            // Award XP through existing XPToken contract
            xpToken.mintXP(msg.sender, xpAwarded, "Daily Quiz Completion");
        } else {
            xpAwarded = quiz.xpReward / 4; // 25% XP for participation
            xpToken.mintXP(msg.sender, xpAwarded, "Daily Quiz Participation");
        }
        
        userQuizCompleted[msg.sender][day] = true;
        emit QuizCompleted(msg.sender, day, isCorrect, xpAwarded);
    }
    
    /**
     * @dev Create tournament with dynamic pricing
     */
    function createTournament(string memory name) external returns (uint256) {
        // Get current ETH price for dynamic fee calculation
        int256 ethPrice = getLatestPrice();
        uint256 entryFee = calculateDynamicEntryFee(ethPrice);
        
        tournamentCounter++;
        uint256 tournamentId = tournamentCounter;
        
        Tournament storage tournament = tournaments[tournamentId];
        tournament.id = tournamentId;
        tournament.name = name;
        tournament.entryFee = entryFee;
        tournament.completed = false;
        
        emit TournamentCreated(tournamentId, name, entryFee);
        return tournamentId;
    }
    
    /**
     * @dev Complete tournament with VRF randomness
     */
    function completeTournament(uint256 tournamentId) external onlyOwner {
        require(!tournaments[tournamentId].completed, "Tournament already completed");
        require(tournaments[tournamentId].participants.length > 0, "No participants");
          // Request randomness for winner selection
        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_vrfSubscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
          // Store tournament ID for callback
        // In production, you'd use a mapping to handle this properly
        tournaments[tournamentId].randomSeed = requestId;
    }
    
    /**
     * @dev Get latest ETH price from Chainlink Price Feed
     */
    function getLatestPrice() public view returns (int256) {
        (
            /* uint80 roundID */,
            int256 price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        
        return price;
    }
    
    /**
     * @dev Calculate dynamic entry fee based on ETH price
     */
    function calculateDynamicEntryFee(int256 ethPrice) public pure returns (uint256) {
        // Base fee of $10 USD worth of XP tokens
        uint256 baseFeeUSD = 10 * 10**8; // $10 in 8 decimals
        
        // Convert to XP tokens (assuming 1 XP = $0.01)
        uint256 feeInXP = (baseFeeUSD * 10**18) / (ethPrice > 0 ? uint256(ethPrice) / 100 : 200000000000);
        
        return feeInXP;
    }
    
    /**
     * @dev Get random subject for quiz
     */
    function getRandomSubject(uint256 index) internal pure returns (string memory) {
        string[5] memory subjects = ["Mathematics", "Science", "History", "Literature", "Geography"];
        return subjects[index];
    }
    
    /**
     * @dev Get random difficulty
     */
    function getRandomDifficulty(uint256 index) internal pure returns (string memory) {
        string[3] memory difficulties = ["easy", "medium", "hard"];
        return difficulties[index];
    }
    
    /**
     * @dev Get today's quiz
     */
    function getTodaysQuiz() external view returns (
        string memory question,
        string[] memory options,
        uint256 xpReward,
        bool completed
    ) {
        uint256 today = block.timestamp / 86400;
        DailyQuiz storage quiz = dailyQuizzes[today];
        
        return (
            quiz.question,
            quiz.options,
            quiz.xpReward,
            userQuizCompleted[msg.sender][today]
        );
    }
    
    /**
     * @dev Manual quiz generation for testing
     */
    function generateTestQuiz() external onlyOwner {
        uint256 today = block.timestamp / 86400;
        createTestnetQuiz(today, "Mathematics", "medium", block.timestamp);
    }
      
    /**
     * @dev Chainlink Functions callback - handle API responses
     */
    function _fulfillRequest(
        bytes32 requestId, 
        bytes memory response, 
        bytes memory err
    ) internal override {
        functionsRequestPending[requestId] = false;
        
        if (err.length > 0) {
            // Handle error - for demo, we'll just create a fallback quiz
            emit RequestError(requestId, err);
            return;
        }
        
        // For demo purposes, we'll parse the response as a simple string
        // In production, you'd parse JSON responses from external APIs
        string memory responseString = string(response);
        emit RequestFulfilled(requestId, responseString);
        
        // Here you could parse the response and create dynamic quiz content
        // For the competition demo, we'll keep it simple
    }
    
    /**
     * @dev Emergency functions for demo
     */
    function forceUpdateChallenge() external onlyOwner {
        lastChallengeDay = block.timestamp / 86400;
    }
    
    // Events for demo tracking
    event RequestError(bytes32 indexed requestId, bytes error);
    event RequestFulfilled(bytes32 indexed requestId, string response);
}
