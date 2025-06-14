// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title BadgeNFT
 * @dev NFT contract for achievement badges with metadata
 */
contract BadgeNFT is ERC721, Ownable {
    using Strings for uint256;
    
    uint256 private _tokenIdCounter;
    
    // Badge types
    enum BadgeType {
        STREAK_MASTER,      // 7+ day streak
        QUIZ_CHAMPION,      // 50+ quizzes completed
        KNOWLEDGE_SEEKER,   // 100+ questions answered
        STUDY_WARRIOR,      // 30+ days active
        PERFECT_SCORE,      // 10+ perfect quiz scores
        EARLY_BIRD,         // Study before 8 AM
        NIGHT_OWL,          // Study after 10 PM
        SOCIAL_LEARNER,     // Active in study groups
        MENTOR,             // Help other students
        ACHIEVEMENT_HUNTER  // Unlock all other badges
    }
    
    // Badge metadata
    struct Badge {
        BadgeType badgeType;
        uint256 timestamp;
        uint256 level; // For upgradeable badges
        string customData; // Additional metadata
    }
    
    mapping(uint256 => Badge) public badges;
    mapping(address => mapping(BadgeType => bool)) public hasBadge;
    mapping(address => uint256[]) public userBadges;
    
    // Badge requirements tracking
    mapping(address => uint256) public userStreaks;
    mapping(address => uint256) public quizzesCompleted;
    mapping(address => uint256) public questionsAnswered;
    mapping(address => uint256) public activeDays;
    mapping(address => uint256) public perfectScores;
    
    // Events
    event BadgeMinted(address indexed user, uint256 tokenId, BadgeType badgeType);
    event BadgeUpgraded(address indexed user, uint256 tokenId, uint256 newLevel);
    
    constructor() ERC721("BrainInk Achievement Badges", "BADGE") Ownable(msg.sender) {}

    /**
     * @dev Mint a badge to a user
     */
    function mintBadge(
        address to,
        BadgeType badgeType,
        string memory customData
    ) external onlyOwner returns (uint256) {
        require(!hasBadge[to][badgeType], "User already has this badge");
        
        uint256 tokenId = _tokenIdCounter++;
        _mint(to, tokenId);
        
        badges[tokenId] = Badge({
            badgeType: badgeType,
            timestamp: block.timestamp,
            level: 1,
            customData: customData
        });
        
        hasBadge[to][badgeType] = true;
        userBadges[to].push(tokenId);
        
        emit BadgeMinted(to, tokenId, badgeType);
        return tokenId;
    }

    /**
     * @dev Update user progress and check for badge eligibility
     */
    function updateProgress(
        address user,
        uint256 streakCount,
        uint256 quizCount,
        uint256 questionCount,
        uint256 dayCount,
        uint256 perfectCount
    ) external onlyOwner {
        userStreaks[user] = streakCount;
        quizzesCompleted[user] = quizCount;
        questionsAnswered[user] = questionCount;
        activeDays[user] = dayCount;
        perfectScores[user] = perfectCount;
        
        _checkBadgeEligibility(user);
    }

    /**
     * @dev Check and award badges based on user progress
     */
    function _checkBadgeEligibility(address user) internal {
        // Streak Master - 7+ day streak
        if (userStreaks[user] >= 7 && !hasBadge[user][BadgeType.STREAK_MASTER]) {
            mintBadge(user, BadgeType.STREAK_MASTER, "Maintained a 7-day study streak");
        }
        
        // Quiz Champion - 50+ quizzes
        if (quizzesCompleted[user] >= 50 && !hasBadge[user][BadgeType.QUIZ_CHAMPION]) {
            mintBadge(user, BadgeType.QUIZ_CHAMPION, "Completed 50 quizzes");
        }
        
        // Knowledge Seeker - 100+ questions
        if (questionsAnswered[user] >= 100 && !hasBadge[user][BadgeType.KNOWLEDGE_SEEKER]) {
            mintBadge(user, BadgeType.KNOWLEDGE_SEEKER, "Answered 100 questions");
        }
        
        // Study Warrior - 30+ active days
        if (activeDays[user] >= 30 && !hasBadge[user][BadgeType.STUDY_WARRIOR]) {
            mintBadge(user, BadgeType.STUDY_WARRIOR, "30 days of active studying");
        }
        
        // Perfect Score - 10+ perfect scores
        if (perfectScores[user] >= 10 && !hasBadge[user][BadgeType.PERFECT_SCORE]) {
            mintBadge(user, BadgeType.PERFECT_SCORE, "Achieved 10 perfect quiz scores");
        }
    }

    /**
     * @dev Award special badges
     */
    function awardSpecialBadge(
        address user,
        BadgeType badgeType,
        string memory customData
    ) external onlyOwner {
        require(
            badgeType == BadgeType.EARLY_BIRD ||
            badgeType == BadgeType.NIGHT_OWL ||
            badgeType == BadgeType.SOCIAL_LEARNER ||
            badgeType == BadgeType.MENTOR ||
            badgeType == BadgeType.ACHIEVEMENT_HUNTER,
            "Invalid special badge type"
        );
        
        mintBadge(user, badgeType, customData);
    }

    /**
     * @dev Upgrade badge level
     */
    function upgradeBadge(uint256 tokenId, uint256 newLevel) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Badge does not exist");
        
        badges[tokenId].level = newLevel;
        emit BadgeUpgraded(_ownerOf(tokenId), tokenId, newLevel);
    }

    /**
     * @dev Get user's badges
     */
    function getUserBadges(address user) external view returns (uint256[] memory) {
        return userBadges[user];
    }

    /**
     * @dev Get badge details
     */
    function getBadgeDetails(uint256 tokenId) external view returns (
        BadgeType badgeType,
        uint256 timestamp,
        uint256 level,
        string memory customData
    ) {
        Badge memory badge = badges[tokenId];
        return (badge.badgeType, badge.timestamp, badge.level, badge.customData);
    }

    /**
     * @dev Get badge type name
     */
    function getBadgeTypeName(BadgeType badgeType) external pure returns (string memory) {
        if (badgeType == BadgeType.STREAK_MASTER) return "Streak Master";
        if (badgeType == BadgeType.QUIZ_CHAMPION) return "Quiz Champion";
        if (badgeType == BadgeType.KNOWLEDGE_SEEKER) return "Knowledge Seeker";
        if (badgeType == BadgeType.STUDY_WARRIOR) return "Study Warrior";
        if (badgeType == BadgeType.PERFECT_SCORE) return "Perfect Score";
        if (badgeType == BadgeType.EARLY_BIRD) return "Early Bird";
        if (badgeType == BadgeType.NIGHT_OWL) return "Night Owl";
        if (badgeType == BadgeType.SOCIAL_LEARNER) return "Social Learner";
        if (badgeType == BadgeType.MENTOR) return "Mentor";
        if (badgeType == BadgeType.ACHIEVEMENT_HUNTER) return "Achievement Hunter";
        return "Unknown Badge";
    }

    /**
     * @dev Override tokenURI for custom metadata
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Badge does not exist");
        
        Badge memory badge = badges[tokenId];
        string memory badgeName = this.getBadgeTypeName(badge.badgeType);
        
        // Return JSON metadata (in production, this would be a proper IPFS URL)
        return string(abi.encodePacked(
            'data:application/json;base64,',
            _encode(abi.encodePacked(
                '{"name":"', badgeName, ' #', tokenId.toString(),
                '","description":"', badge.customData,
                '","level":', badge.level.toString(),
                ',"timestamp":', badge.timestamp.toString(),
                ',"image":"https://brainink.badges/', uint256(badge.badgeType).toString(), '.svg"}'
            ))
        ));
    }
    
    // Base64 encoding helper (simplified)
    function _encode(bytes memory data) internal pure returns (string memory) {
        // This is a simplified version - in production use a proper base64 library
        return "encoded_metadata";
    }
}
