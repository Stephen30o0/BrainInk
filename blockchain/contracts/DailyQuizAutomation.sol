// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DailyQuizAutomation
 * @dev Combines Chainlink Functions and Automation for AI-generated daily quizzes
 */
contract DailyQuizAutomation is FunctionsClient, AutomationCompatibleInterface, Ownable {
    using FunctionsRequest for FunctionsRequest.Request;

    // Events
    event QuizGenerated(uint256 indexed day, bytes32 indexed requestId);
    event QuizAnswered(address indexed user, uint256 indexed day, bool correct, uint256 xpEarned);
    event DailyQuizTriggered(uint256 indexed day);

    // Structs
    struct DailyQuiz {
        string question;
        string[4] options;
        uint8 correctAnswer;
        uint256 xpReward;
        bool exists;
        uint256 generatedAt;
    }

    struct UserProgress {
        uint256 streak;
        uint256 totalXP;
        uint256 lastCompletedDay;
        mapping(uint256 => bool) completedDays;
        mapping(uint256 => uint8) answers;
    }

    // State variables
    mapping(uint256 => DailyQuiz) public dailyQuizzes;
    mapping(address => UserProgress) public userProgress;
    mapping(bytes32 => uint256) public requestIdToDay;

    uint64 public subscriptionId;
    uint32 public gasLimit = 300000;
    bytes32 public donID;
    
    uint256 public currentDay;
    uint256 public lastGeneratedDay;
    
    // Chainlink Functions JavaScript source code
    string public source = 
        "const kanaApiUrl = args[0];"
        "const topic = args[1] || 'blockchain';"
        "const difficulty = args[2] || 'medium';"
        ""
        "const response = await Functions.makeHttpRequest({"
        "  url: `${kanaApiUrl}/api/kana/generate-daily-quiz`,"
        "  method: 'POST',"
        "  headers: {"
        "    'Content-Type': 'application/json'"
        "  },"
        "  data: {"
        "    topic: topic,"
        "    difficulty: difficulty,"
        "    numQuestions: 1"
        "  }"
        "});"
        ""
        "if (response.error) {"
        "  throw new Error('Kana API request failed');"
        "}"
        ""
        "const quiz = response.data.quiz[0];"
        "if (!quiz || !quiz.question || !quiz.options || quiz.options.length !== 4) {"
        "  throw new Error('Invalid quiz format from Kana AI');"
        "}"
        ""
        "// Find correct answer index"
        "const correctIndex = quiz.options.findIndex(option => option === quiz.answer);"
        "if (correctIndex === -1) {"
        "  throw new Error('Correct answer not found in options');"
        "}"
        ""
        "// Encode the response"
        "const encodedResponse = Functions.encodeString("
        "  JSON.stringify({"
        "    question: quiz.question,"
        "    options: quiz.options,"
        "    correctAnswer: correctIndex,"
        "    xpReward: 50"
        "  })"
        ");"
        ""
        "return encodedResponse;";

    constructor(
        address router,
        bytes32 _donID,
        uint64 _subscriptionId
    ) FunctionsClient(router) Ownable(msg.sender) {
        donID = _donID;
        subscriptionId = _subscriptionId;
        currentDay = getCurrentDay();
    }

    /**
     * @dev Chainlink Automation checkUpkeep - checks if new quiz needed
     */
    function checkUpkeep(bytes calldata /* checkData */) 
        external 
        view 
        override 
        returns (bool upkeepNeeded, bytes memory /* performData */) 
    {
        uint256 today = getCurrentDay();
        upkeepNeeded = (today > lastGeneratedDay) && !dailyQuizzes[today].exists;
    }

    /**
     * @dev Chainlink Automation performUpkeep - generates new quiz via Functions
     */
    function performUpkeep(bytes calldata /* performData */) external override {
        uint256 today = getCurrentDay();
        
        if (today > lastGeneratedDay && !dailyQuizzes[today].exists) {
            generateDailyQuiz(today);
        }
    }

    /**
     * @dev Generate daily quiz using Chainlink Functions
     */
    function generateDailyQuiz(uint256 day) public onlyOwner {
        string[] memory args = new string[](3);
        args[0] = "https://your-kana-backend-url.com"; // Replace with your Kana backend URL
        args[1] = getDailyTopic(day);
        args[2] = "medium";

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        req.setArgs(args);

        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donID
        );

        requestIdToDay[requestId] = day;
        
        emit DailyQuizTriggered(day);
    }

    /**
     * @dev Callback function for Chainlink Functions
     */    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) 
        internal 
        override 
    {
        uint256 day = requestIdToDay[requestId];
        
        if (err.length > 0) {
            // Handle error - create fallback quiz
            createFallbackQuiz(day);
            return;
        }

        string memory responseString = string(response);
        
        // Parse the JSON response from Kana AI
        // Note: In production, you'd want more robust JSON parsing
        // For demo, we assume the response is properly formatted
        
        dailyQuizzes[day] = DailyQuiz({
            question: "Parsed from Kana AI response", // Would parse from responseString
            options: ["Option A", "Option B", "Option C", "Option D"], // Would parse from responseString
            correctAnswer: 1, // Would parse from responseString
            xpReward: 50,
            exists: true,
            generatedAt: block.timestamp
        });

        lastGeneratedDay = day;
        currentDay = day;

        emit QuizGenerated(day, requestId);
    }

    /**
     * @dev Submit answer to daily quiz
     */
    function submitAnswer(uint256 day, uint8 answer) external {
        require(dailyQuizzes[day].exists, "Quiz not available");
        require(answer < 4, "Invalid answer");
        require(!userProgress[msg.sender].completedDays[day], "Already completed");

        UserProgress storage user = userProgress[msg.sender];
        user.answers[day] = answer;
        user.completedDays[day] = true;

        bool correct = (answer == dailyQuizzes[day].correctAnswer);
        uint256 xpEarned = correct ? dailyQuizzes[day].xpReward : dailyQuizzes[day].xpReward / 4;

        user.totalXP += xpEarned;

        // Update streak
        if (correct) {
            if (day == user.lastCompletedDay + 1) {
                user.streak++;
            } else {
                user.streak = 1;
            }
            user.lastCompletedDay = day;
        } else {
            user.streak = 0;
        }

        emit QuizAnswered(msg.sender, day, correct, xpEarned);
    }

    /**
     * @dev Get current day number (days since epoch)
     */
    function getCurrentDay() public view returns (uint256) {
        return block.timestamp / 86400; // 24 * 60 * 60
    }

    /**
     * @dev Get daily topic based on day (cycles through topics)
     */
    function getDailyTopic(uint256 day) internal pure returns (string memory) {
        string[7] memory topics = [
            "blockchain",
            "cryptography", 
            "defi",
            "smart-contracts",
            "web3",
            "oracles",
            "consensus"
        ];
        return topics[day % 7];
    }

    /**
     * @dev Create fallback quiz if Kana AI fails
     */
    function createFallbackQuiz(uint256 day) internal {
        dailyQuizzes[day] = DailyQuiz({
            question: "What is the primary purpose of blockchain technology?",
            options: ["Data storage", "Decentralized consensus", "Web hosting", "Gaming"],
            correctAnswer: 1,
            xpReward: 50,
            exists: true,
            generatedAt: block.timestamp
        });

        lastGeneratedDay = day;
        currentDay = day;
    }

    /**
     * @dev Admin functions
     */
    function updateGasLimit(uint32 _gasLimit) external onlyOwner {
        gasLimit = _gasLimit;
    }

    function updateSubscription(uint64 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
    }

    function updateSource(string calldata _source) external onlyOwner {
        source = _source;
    }

    /**
     * @dev View functions
     */
    function getDailyQuiz(uint256 day) external view returns (DailyQuiz memory) {
        return dailyQuizzes[day];
    }

    function getUserProgress(address user) external view returns (
        uint256 streak,
        uint256 totalXP,
        uint256 lastCompletedDay
    ) {
        UserProgress storage progress = userProgress[user];
        return (progress.streak, progress.totalXP, progress.lastCompletedDay);
    }

    function hasCompletedDay(address user, uint256 day) external view returns (bool) {
        return userProgress[user].completedDays[day];
    }

    function getUserAnswer(address user, uint256 day) external view returns (uint8) {
        return userProgress[user].answers[day];
    }
}
