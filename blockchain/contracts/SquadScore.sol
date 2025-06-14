// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./XPToken.sol";

/**
 * @title SquadScore
 * @dev Squad staking and leaderboard management contract
 */
contract SquadScore is Ownable, ReentrancyGuard {
    XPToken public xpToken;
    
    // Squad structure
    struct Squad {
        string name;
        address leader;
        address[] members;
        uint256 totalStaked;
        uint256 weeklyScore;
        uint256 totalScore;
        bool active;
        uint256 createdAt;
    }
    
    // Staking info
    struct UserStake {
        uint256 amount;
        uint256 squadId;
        uint256 stakedAt;
        uint256 lastClaimAt;
    }
    
    // Leaderboard entry
    struct LeaderboardEntry {
        uint256 squadId;
        uint256 score;
        uint256 members;
        string name;
    }
    
    mapping(uint256 => Squad) public squads;
    mapping(address => UserStake) public userStakes;
    mapping(address => uint256) public userSquad; // user -> squadId
    
    uint256 public squadCounter;
    uint256 public constant MIN_STAKE = 100 * 10**18; // 100 XP minimum
    uint256 public constant WEEKLY_RESET_INTERVAL = 7 days;
    uint256 public lastWeeklyReset;
    
    // Rewards
    uint256 public constant STAKING_REWARD_RATE = 5; // 5% weekly for stakers
    uint256 public constant LEADER_BONUS_RATE = 10; // 10% bonus for squad leaders
    
    // Events
    event SquadCreated(uint256 indexed squadId, string name, address leader);
    event MemberJoined(uint256 indexed squadId, address member, uint256 stakeAmount);
    event MemberLeft(uint256 indexed squadId, address member, uint256 unstakedAmount);
    event ScoreUpdated(uint256 indexed squadId, uint256 newScore, address updatedBy);
    event WeeklyReward(address indexed user, uint256 amount);
    event WeeklyReset(uint256 timestamp);

    constructor(address _xpToken) Ownable(msg.sender) {
        xpToken = XPToken(_xpToken);
        lastWeeklyReset = block.timestamp;
    }

    /**
     * @dev Create a new squad
     */
    function createSquad(string memory name, uint256 initialStake) external nonReentrant {
        require(bytes(name).length > 0, "Squad name cannot be empty");
        require(initialStake >= MIN_STAKE, "Initial stake too low");
        require(userSquad[msg.sender] == 0, "Already in a squad");
        require(xpToken.balanceOf(msg.sender) >= initialStake, "Insufficient XP balance");
        
        squadCounter++;
        uint256 squadId = squadCounter;
        
        address[] memory members = new address[](1);
        members[0] = msg.sender;
        
        squads[squadId] = Squad({
            name: name,
            leader: msg.sender,
            members: members,
            totalStaked: initialStake,
            weeklyScore: 0,
            totalScore: 0,
            active: true,
            createdAt: block.timestamp
        });
        
        userStakes[msg.sender] = UserStake({
            amount: initialStake,
            squadId: squadId,
            stakedAt: block.timestamp,
            lastClaimAt: block.timestamp
        });
        
        userSquad[msg.sender] = squadId;
        
        // Transfer XP to contract
        require(xpToken.transferFrom(msg.sender, address(this), initialStake), "XP transfer failed");
        
        emit SquadCreated(squadId, name, msg.sender);
        emit MemberJoined(squadId, msg.sender, initialStake);
    }

    /**
     * @dev Join an existing squad
     */
    function joinSquad(uint256 squadId, uint256 stakeAmount) external nonReentrant {
        require(squads[squadId].active, "Squad does not exist or is inactive");
        require(stakeAmount >= MIN_STAKE, "Stake amount too low");
        require(userSquad[msg.sender] == 0, "Already in a squad");
        require(xpToken.balanceOf(msg.sender) >= stakeAmount, "Insufficient XP balance");
        require(squads[squadId].members.length < 10, "Squad is full"); // Max 10 members
        
        squads[squadId].members.push(msg.sender);
        squads[squadId].totalStaked += stakeAmount;
        
        userStakes[msg.sender] = UserStake({
            amount: stakeAmount,
            squadId: squadId,
            stakedAt: block.timestamp,
            lastClaimAt: block.timestamp
        });
        
        userSquad[msg.sender] = squadId;
        
        // Transfer XP to contract
        require(xpToken.transferFrom(msg.sender, address(this), stakeAmount), "XP transfer failed");
        
        emit MemberJoined(squadId, msg.sender, stakeAmount);
    }

    /**
     * @dev Leave squad and unstake
     */
    function leaveSquad() external nonReentrant {
        uint256 squadId = userSquad[msg.sender];
        require(squadId != 0, "Not in a squad");
        
        UserStake memory stake = userStakes[msg.sender];
        Squad storage squad = squads[squadId];
        
        // Remove from squad members
        for (uint i = 0; i < squad.members.length; i++) {
            if (squad.members[i] == msg.sender) {
                squad.members[i] = squad.members[squad.members.length - 1];
                squad.members.pop();
                break;
            }
        }
        
        squad.totalStaked -= stake.amount;
        
        // If leader leaves and squad has members, transfer leadership
        if (squad.leader == msg.sender && squad.members.length > 0) {
            squad.leader = squad.members[0];
        }
        
        // If no members left, deactivate squad
        if (squad.members.length == 0) {
            squad.active = false;
        }
        
        // Clean up user data
        delete userStakes[msg.sender];
        delete userSquad[msg.sender];
        
        // Return staked XP plus any rewards
        uint256 rewards = calculateStakingRewards(msg.sender);
        uint256 totalReturn = stake.amount + rewards;
        
        if (totalReturn > 0) {
            require(xpToken.transfer(msg.sender, totalReturn), "XP transfer failed");
        }
        
        emit MemberLeft(squadId, msg.sender, totalReturn);
    }

    /**
     * @dev Update squad score (only callable by contract owner/AI agent)
     */
    function updateSquadScore(uint256 squadId, uint256 scoreIncrease, address triggeredBy) external onlyOwner {
        require(squads[squadId].active, "Squad inactive");
        
        squads[squadId].weeklyScore += scoreIncrease;
        squads[squadId].totalScore += scoreIncrease;
        
        emit ScoreUpdated(squadId, squads[squadId].totalScore, triggeredBy);
    }

    /**
     * @dev Get leaderboard (top 10 squads by weekly score)
     */
    function getWeeklyLeaderboard() external view returns (LeaderboardEntry[] memory) {
        LeaderboardEntry[] memory entries = new LeaderboardEntry[](10);
        uint256 entryCount = 0;
        
        // Simple sorting for top squads (in production, use more efficient sorting)
        for (uint256 i = 1; i <= squadCounter && entryCount < 10; i++) {
            if (squads[i].active && squads[i].weeklyScore > 0) {
                entries[entryCount] = LeaderboardEntry({
                    squadId: i,
                    score: squads[i].weeklyScore,
                    members: squads[i].members.length,
                    name: squads[i].name
                });
                entryCount++;
            }
        }
        
        // Sort entries by score (bubble sort for simplicity)
        for (uint i = 0; i < entryCount - 1; i++) {
            for (uint j = 0; j < entryCount - i - 1; j++) {
                if (entries[j].score < entries[j + 1].score) {
                    LeaderboardEntry memory temp = entries[j];
                    entries[j] = entries[j + 1];
                    entries[j + 1] = temp;
                }
            }
        }
        
        return entries;
    }

    /**
     * @dev Calculate staking rewards for user
     */
    function calculateStakingRewards(address user) public view returns (uint256) {
        UserStake memory stake = userStakes[user];
        if (stake.amount == 0) return 0;
        
        uint256 timeStaked = block.timestamp - stake.lastClaimAt;
        uint256 baseReward = (stake.amount * STAKING_REWARD_RATE * timeStaked) / (100 * WEEKLY_RESET_INTERVAL);
        
        // Leader bonus
        uint256 squadId = userSquad[user];
        if (squadId != 0 && squads[squadId].leader == user) {
            baseReward = (baseReward * (100 + LEADER_BONUS_RATE)) / 100;
        }
        
        return baseReward;
    }

    /**
     * @dev Claim staking rewards
     */
    function claimRewards() external nonReentrant {
        uint256 rewards = calculateStakingRewards(msg.sender);
        require(rewards > 0, "No rewards to claim");
        
        userStakes[msg.sender].lastClaimAt = block.timestamp;
        
        // Mint new XP as rewards
        xpToken.mintXP(msg.sender, rewards, "Staking Rewards");
        
        emit WeeklyReward(msg.sender, rewards);
    }

    /**
     * @dev Reset weekly scores (called by automation or admin)
     */
    function resetWeeklyScores() external onlyOwner {
        require(block.timestamp >= lastWeeklyReset + WEEKLY_RESET_INTERVAL, "Too early for reset");
        
        for (uint256 i = 1; i <= squadCounter; i++) {
            squads[i].weeklyScore = 0;
        }
        
        lastWeeklyReset = block.timestamp;
        emit WeeklyReset(block.timestamp);
    }

    /**
     * @dev Get squad details
     */
    function getSquadDetails(uint256 squadId) external view returns (
        string memory name,
        address leader,
        address[] memory members,
        uint256 totalStaked,
        uint256 weeklyScore,
        uint256 totalScore,
        bool active
    ) {
        Squad memory squad = squads[squadId];
        return (
            squad.name,
            squad.leader,
            squad.members,
            squad.totalStaked,
            squad.weeklyScore,
            squad.totalScore,
            squad.active
        );
    }

    /**
     * @dev Get user's squad info
     */
    function getUserSquadInfo(address user) external view returns (
        uint256 squadId,
        uint256 stakedAmount,
        uint256 pendingRewards,
        bool isLeader
    ) {
        squadId = userSquad[user];
        if (squadId == 0) return (0, 0, 0, false);
        
        UserStake memory stake = userStakes[user];
        return (
            squadId,
            stake.amount,
            calculateStakingRewards(user),
            squads[squadId].leader == user
        );
    }
}
