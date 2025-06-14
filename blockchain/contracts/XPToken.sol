// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title XPToken
 * @dev ERC20 XP token with mint/burn capabilities for gamification
 */
contract XPToken is ERC20, Ownable {
    // XP multipliers and rules
    uint256 public constant DAILY_XP_BASE = 10;
    uint256 public constant QUIZ_XP_BASE = 20;
    uint256 public constant STREAK_MULTIPLIER = 2;
    uint256 public constant MAX_DAILY_XP = 200;
    
    // User streak tracking
    mapping(address => uint256) public streakCount;
    mapping(address => uint256) public lastActivityDay;
    mapping(address => uint256) public dailyXpEarned;
    
    // Agent drop rewards
    mapping(address => uint256) public agentDropsReceived;
    uint256 public constant AGENT_DROP_XP = 50;
    
    // Events
    event XPMinted(address indexed user, uint256 amount, string reason);
    event XPBurned(address indexed user, uint256 amount, string reason);
    event StreakUpdated(address indexed user, uint256 newStreak);
    event AgentDropReceived(address indexed user, uint256 xpAmount);

    constructor() ERC20("Experience Points", "XP") Ownable(msg.sender) {}

    /**
     * @dev Mint XP tokens for study activities
     */
    function mintXP(address user, uint256 baseAmount, string memory reason) external onlyOwner {
        require(user != address(0), "Invalid user address");
        
        uint256 currentDay = block.timestamp / 86400; // Current day
        uint256 userLastDay = lastActivityDay[user];
        
        // Update streak
        if (userLastDay == 0 || currentDay == userLastDay + 1) {
            // First activity or consecutive day
            if (userLastDay != 0) {
                streakCount[user]++;
            } else {
                streakCount[user] = 1;
            }
        } else if (currentDay > userLastDay + 1) {
            // Streak broken
            streakCount[user] = 1;
        }
        // If same day, streak stays the same
        
        // Reset daily XP if new day
        if (currentDay != userLastDay) {
            dailyXpEarned[user] = 0;
        }
        
        // Calculate final XP with multipliers
        uint256 finalAmount = baseAmount;
        
        // Apply streak multiplier (caps at 5x)
        uint256 streakMultiplier = streakCount[user] > 5 ? 5 : streakCount[user];
        if (streakMultiplier > 1) {
            finalAmount = finalAmount * (1 + (streakMultiplier - 1) * STREAK_MULTIPLIER / 10);
        }
        
        // Check daily limit
        if (dailyXpEarned[user] + finalAmount > MAX_DAILY_XP) {
            finalAmount = MAX_DAILY_XP > dailyXpEarned[user] ? MAX_DAILY_XP - dailyXpEarned[user] : 0;
        }
        
        if (finalAmount > 0) {
            dailyXpEarned[user] += finalAmount;
            lastActivityDay[user] = currentDay;
            
            _mint(user, finalAmount);
            emit XPMinted(user, finalAmount, reason);
            emit StreakUpdated(user, streakCount[user]);
        }
    }

    /**
     * @dev Burn XP tokens (for penalties or spending)
     */
    function burnXP(address user, uint256 amount, string memory reason) external onlyOwner {
        require(balanceOf(user) >= amount, "Insufficient XP balance");
        
        _burn(user, amount);
        emit XPBurned(user, amount, reason);
    }

    /**
     * @dev Special agent drop bonus
     */
    function grantAgentDrop(address user) external onlyOwner {
        require(user != address(0), "Invalid user address");
        
        agentDropsReceived[user]++;
        _mint(user, AGENT_DROP_XP);
        
        emit AgentDropReceived(user, AGENT_DROP_XP);
        emit XPMinted(user, AGENT_DROP_XP, "Agent Drop Bonus");
    }

    /**
     * @dev Apply inactivity penalty
     */
    function applyInactivityPenalty(address user) external onlyOwner {
        uint256 currentDay = block.timestamp / 86400;
        uint256 userLastDay = lastActivityDay[user];
        
        // If inactive for more than 3 days, reset streak and apply penalty
        if (currentDay > userLastDay + 3) {
            streakCount[user] = 0;
            
            uint256 penalty = balanceOf(user) / 10; // 10% penalty
            if (penalty > 0) {
                _burn(user, penalty);
                emit XPBurned(user, penalty, "Inactivity Penalty");
            }
            
            emit StreakUpdated(user, 0);
        }
    }

    /**
     * @dev Get user XP stats
     */
    function getUserStats(address user) external view returns (
        uint256 balance,
        uint256 streak,
        uint256 lastActivity,
        uint256 dailyXp,
        uint256 agentDrops
    ) {
        return (
            balanceOf(user),
            streakCount[user],
            lastActivityDay[user],
            dailyXpEarned[user],
            agentDropsReceived[user]
        );
    }
}
