// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./XPToken.sol";

/**
 * @title BountyVault
 * @dev Escrow pool for challenge bounties and tournament prizes
 */
contract BountyVault is Ownable, ReentrancyGuard {
    XPToken public xpToken;
    
    // Challenge structure
    struct Challenge {
        uint256 id;
        string title;
        string description;
        uint256 bountyAmount;
        address creator;
        uint256 deadline;
        bool active;
        bool completed;
        address winner;
        uint256 createdAt;
        ChallengeType challengeType;
    }
    
    enum ChallengeType {
        INDIVIDUAL_QUIZ,
        SQUAD_COMPETITION,
        STUDY_STREAK,
        KNOWLEDGE_RACE,
        CREATIVE_CHALLENGE
    }
    
    // Submission structure
    struct Submission {
        uint256 challengeId;
        address participant;
        string submissionData; // IPFS hash or data
        uint256 score;
        uint256 submittedAt;
        bool evaluated;
    }
    
    mapping(uint256 => Challenge) public challenges;
    mapping(uint256 => Submission[]) public challengeSubmissions;
    mapping(address => uint256[]) public userChallenges; // challenges created by user
    mapping(address => uint256[]) public userParticipations; // challenges user participated in
    
    uint256 public challengeCounter;
    uint256 public constant MIN_BOUNTY = 50 * 10**18; // 50 XP minimum
    uint256 public constant PLATFORM_FEE_PERCENT = 5; // 5% platform fee
    
    // Events
    event ChallengeCreated(uint256 indexed challengeId, address creator, uint256 bounty);
    event SubmissionMade(uint256 indexed challengeId, address participant);
    event ChallengeCompleted(uint256 indexed challengeId, address winner, uint256 prize);
    event BountyWithdrawn(uint256 indexed challengeId, address creator, uint256 amount);

    constructor(address _xpToken) Ownable(msg.sender) {
        xpToken = XPToken(_xpToken);
    }

    /**
     * @dev Create a new challenge with bounty
     */
    function createChallenge(
        string memory title,
        string memory description,
        uint256 bountyAmount,
        uint256 durationHours,
        ChallengeType challengeType
    ) external nonReentrant returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bountyAmount >= MIN_BOUNTY, "Bounty too low");
        require(durationHours > 0 && durationHours <= 168, "Invalid duration"); // Max 1 week
        require(xpToken.balanceOf(msg.sender) >= bountyAmount, "Insufficient XP balance");
        
        challengeCounter++;
        uint256 challengeId = challengeCounter;
        
        challenges[challengeId] = Challenge({
            id: challengeId,
            title: title,
            description: description,
            bountyAmount: bountyAmount,
            creator: msg.sender,
            deadline: block.timestamp + (durationHours * 1 hours),
            active: true,
            completed: false,
            winner: address(0),
            createdAt: block.timestamp,
            challengeType: challengeType
        });
        
        userChallenges[msg.sender].push(challengeId);
        
        // Escrow the bounty
        require(xpToken.transferFrom(msg.sender, address(this), bountyAmount), "XP transfer failed");
        
        emit ChallengeCreated(challengeId, msg.sender, bountyAmount);
        return challengeId;
    }

    /**
     * @dev Submit to a challenge
     */
    function submitToChallenge(
        uint256 challengeId,
        string memory submissionData
    ) external nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.active, "Challenge not active");
        require(block.timestamp < challenge.deadline, "Challenge deadline passed");
        require(challenge.creator != msg.sender, "Creator cannot participate");
        
        // Check if user already submitted
        Submission[] memory submissions = challengeSubmissions[challengeId];
        for (uint i = 0; i < submissions.length; i++) {
            require(submissions[i].participant != msg.sender, "Already submitted");
        }
        
        challengeSubmissions[challengeId].push(Submission({
            challengeId: challengeId,
            participant: msg.sender,
            submissionData: submissionData,
            score: 0, // To be set by evaluator
            submittedAt: block.timestamp,
            evaluated: false
        }));
        
        userParticipations[msg.sender].push(challengeId);
        
        emit SubmissionMade(challengeId, msg.sender);
    }

    /**
     * @dev Evaluate submissions and declare winner (only owner/AI agent)
     */
    function evaluateChallenge(
        uint256 challengeId,
        address winner,
        uint256[] memory scores
    ) external onlyOwner {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.active, "Challenge not active");
        require(block.timestamp >= challenge.deadline, "Challenge still ongoing");
        
        Submission[] storage submissions = challengeSubmissions[challengeId];
        require(scores.length == submissions.length, "Score count mismatch");
        
        // Update scores
        for (uint i = 0; i < submissions.length; i++) {
            submissions[i].score = scores[i];
            submissions[i].evaluated = true;
        }
        
        // Complete challenge
        challenge.active = false;
        challenge.completed = true;
        challenge.winner = winner;
        
        // Calculate payouts
        uint256 platformFee = (challenge.bountyAmount * PLATFORM_FEE_PERCENT) / 100;
        uint256 winnerPrize = challenge.bountyAmount - platformFee;
        
        // Pay winner
        if (winner != address(0)) {
            require(xpToken.transfer(winner, winnerPrize), "Winner payout failed");
        } else {
            // No winner, return to creator minus platform fee
            require(xpToken.transfer(challenge.creator, winnerPrize), "Refund failed");
        }
        
        // Keep platform fee in contract (can be withdrawn by owner)
        
        emit ChallengeCompleted(challengeId, winner, winnerPrize);
    }

    /**
     * @dev Cancel challenge and refund (only creator, before deadline, no submissions)
     */
    function cancelChallenge(uint256 challengeId) external nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.creator == msg.sender, "Only creator can cancel");
        require(challenge.active, "Challenge not active");
        require(challengeSubmissions[challengeId].length == 0, "Cannot cancel with submissions");
        
        challenge.active = false;
        
        // Refund the bounty
        require(xpToken.transfer(msg.sender, challenge.bountyAmount), "Refund failed");
        
        emit BountyWithdrawn(challengeId, msg.sender, challenge.bountyAmount);
    }

    /**
     * @dev Get challenge details
     */
    function getChallengeDetails(uint256 challengeId) external view returns (
        string memory title,
        string memory description,
        uint256 bountyAmount,
        address creator,
        uint256 deadline,
        bool active,
        bool completed,
        address winner,
        ChallengeType challengeType
    ) {
        Challenge memory challenge = challenges[challengeId];
        return (
            challenge.title,
            challenge.description,
            challenge.bountyAmount,
            challenge.creator,
            challenge.deadline,
            challenge.active,
            challenge.completed,
            challenge.winner,
            challenge.challengeType
        );
    }

    /**
     * @dev Get challenge submissions
     */
    function getChallengeSubmissions(uint256 challengeId) external view returns (
        address[] memory participants,
        uint256[] memory scores,
        bool[] memory evaluated
    ) {
        Submission[] memory submissions = challengeSubmissions[challengeId];
        
        participants = new address[](submissions.length);
        scores = new uint256[](submissions.length);
        evaluated = new bool[](submissions.length);
        
        for (uint i = 0; i < submissions.length; i++) {
            participants[i] = submissions[i].participant;
            scores[i] = submissions[i].score;
            evaluated[i] = submissions[i].evaluated;
        }
        
        return (participants, scores, evaluated);
    }

    /**
     * @dev Get active challenges
     */
    function getActiveChallenges() external view returns (uint256[] memory) {
        uint256[] memory activeChallengeIds = new uint256[](challengeCounter);
        uint256 activeCount = 0;
        
        for (uint256 i = 1; i <= challengeCounter; i++) {
            if (challenges[i].active && block.timestamp < challenges[i].deadline) {
                activeChallengeIds[activeCount] = i;
                activeCount++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = activeChallengeIds[i];
        }
        
        return result;
    }

    /**
     * @dev Get user's created challenges
     */
    function getUserChallenges(address user) external view returns (uint256[] memory) {
        return userChallenges[user];
    }

    /**
     * @dev Get user's participations
     */
    function getUserParticipations(address user) external view returns (uint256[] memory) {
        return userParticipations[user];
    }

    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawPlatformFees(uint256 amount) external onlyOwner {
        require(xpToken.balanceOf(address(this)) >= amount, "Insufficient balance");
        require(xpToken.transfer(owner(), amount), "Transfer failed");
    }

    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = xpToken.balanceOf(address(this));
        require(xpToken.transfer(owner(), balance), "Transfer failed");
    }

    /**
     * @dev Get contract XP balance
     */
    function getContractBalance() external view returns (uint256) {
        return xpToken.balanceOf(address(this));
    }
}
