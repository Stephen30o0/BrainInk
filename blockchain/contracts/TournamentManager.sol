// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

contract TournamentManager is VRFConsumerBaseV2, Ownable, ReentrancyGuard {
    VRFCoordinatorV2Interface COORDINATOR;
    
    // Chainlink VRF configuration
    uint64 s_subscriptionId;
    bytes32 keyHash;
    uint32 callbackGasLimit = 100000;
    uint16 requestConfirmations = 3;
    uint32 numWords = 1;
    
    IERC20 public inkToken;
    
    struct Tournament {
        uint256 id;
        string name;
        address creator;
        uint256 entryFee;
        uint256 maxParticipants;
        uint256 currentParticipants;
        uint256 prizePool;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isCompleted;
        address[] participants;
        address winner;
        uint256 vrfRequestId;
    }
    
    struct Participant {
        address player;
        uint256 score;
        uint256 completionTime;
        bool hasSubmitted;
    }
    
    mapping(uint256 => Tournament) public tournaments;
    mapping(uint256 => mapping(address => Participant)) public tournamentParticipants;
    mapping(uint256 => uint256) public vrfRequestToTournament;
    
    uint256 public tournamentCounter;
    uint256 public platformFeePercentage = 10; // 10% platform fee
    
    event TournamentCreated(uint256 indexed tournamentId, string name, address creator, uint256 entryFee);
    event PlayerJoined(uint256 indexed tournamentId, address player);
    event ScoreSubmitted(uint256 indexed tournamentId, address player, uint256 score, uint256 completionTime);
    event TournamentEnded(uint256 indexed tournamentId, address winner, uint256 prize);
    event RandomnessRequested(uint256 indexed tournamentId, uint256 requestId);
      constructor(
        address _vrfCoordinator,
        address _inkToken,
        uint64 _subscriptionId,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(_vrfCoordinator) Ownable(msg.sender) {
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        inkToken = IERC20(_inkToken);
        s_subscriptionId = _subscriptionId;
        keyHash = _keyHash;
    }
    
    function createTournament(
        string memory _name,
        uint256 _entryFee,
        uint256 _maxParticipants,
        uint256 _duration
    ) external {
        require(_entryFee > 0, "Entry fee must be greater than 0");
        require(_maxParticipants >= 2, "Tournament must allow at least 2 participants");
        require(_duration > 0, "Duration must be greater than 0");
        
        tournamentCounter++;
        
        tournaments[tournamentCounter] = Tournament({
            id: tournamentCounter,
            name: _name,
            creator: msg.sender,
            entryFee: _entryFee,
            maxParticipants: _maxParticipants,
            currentParticipants: 0,
            prizePool: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            isActive: true,
            isCompleted: false,
            participants: new address[](0),
            winner: address(0),
            vrfRequestId: 0
        });
        
        emit TournamentCreated(tournamentCounter, _name, msg.sender, _entryFee);
    }
    
    function joinTournament(uint256 _tournamentId) external nonReentrant {
        Tournament storage tournament = tournaments[_tournamentId];
        
        require(tournament.isActive, "Tournament is not active");
        require(!tournament.isCompleted, "Tournament is completed");
        require(tournament.currentParticipants < tournament.maxParticipants, "Tournament is full");
        require(block.timestamp < tournament.endTime, "Tournament registration ended");
        require(tournamentParticipants[_tournamentId][msg.sender].player == address(0), "Already joined");
        
        // Transfer entry fee from player
        require(inkToken.transferFrom(msg.sender, address(this), tournament.entryFee), "Transfer failed");
        
        // Add participant
        tournament.participants.push(msg.sender);
        tournament.currentParticipants++;
        tournament.prizePool += tournament.entryFee;
        
        tournamentParticipants[_tournamentId][msg.sender] = Participant({
            player: msg.sender,
            score: 0,
            completionTime: 0,
            hasSubmitted: false
        });
        
        emit PlayerJoined(_tournamentId, msg.sender);
    }
    
    function submitScore(uint256 _tournamentId, uint256 _score, uint256 _completionTime) external {
        Tournament storage tournament = tournaments[_tournamentId];
        Participant storage participant = tournamentParticipants[_tournamentId][msg.sender];
        
        require(tournament.isActive, "Tournament is not active");
        require(!tournament.isCompleted, "Tournament is completed");
        require(participant.player == msg.sender, "Not a participant");
        require(!participant.hasSubmitted, "Score already submitted");
        require(block.timestamp <= tournament.endTime, "Tournament ended");
        
        participant.score = _score;
        participant.completionTime = _completionTime;
        participant.hasSubmitted = true;
        
        emit ScoreSubmitted(_tournamentId, msg.sender, _score, _completionTime);
        
        // Check if all participants have submitted or time is up
        if (_allParticipantsSubmitted(_tournamentId) || block.timestamp >= tournament.endTime) {
            _endTournament(_tournamentId);
        }
    }
    
    function _allParticipantsSubmitted(uint256 _tournamentId) internal view returns (bool) {
        Tournament storage tournament = tournaments[_tournamentId];
        
        for (uint256 i = 0; i < tournament.participants.length; i++) {
            if (!tournamentParticipants[_tournamentId][tournament.participants[i]].hasSubmitted) {
                return false;
            }
        }
        return true;
    }
    
    function _endTournament(uint256 _tournamentId) internal {
        Tournament storage tournament = tournaments[_tournamentId];
        tournament.isCompleted = true;
        tournament.isActive = false;
        
        // Request randomness for fair winner selection among top performers
        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        
        tournament.vrfRequestId = requestId;
        vrfRequestToTournament[requestId] = _tournamentId;
        
        emit RandomnessRequested(_tournamentId, requestId);
    }
    
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 tournamentId = vrfRequestToTournament[requestId];
        Tournament storage tournament = tournaments[tournamentId];
        
        // Find the winner based on highest score, with VRF used for tiebreaking
        address winner = _determineWinner(tournamentId, randomWords[0]);
        tournament.winner = winner;
        
        // Distribute prizes
        _distributePrizes(tournamentId);
        
        emit TournamentEnded(tournamentId, winner, tournament.prizePool);
    }
    
    function _determineWinner(uint256 _tournamentId, uint256 _randomness) internal view returns (address) {
        Tournament storage tournament = tournaments[_tournamentId];
        
        address winner = address(0);
        uint256 highestScore = 0;
        address[] memory topPerformers = new address[](tournament.participants.length);
        uint256 topPerformerCount = 0;
        
        // Find highest score
        for (uint256 i = 0; i < tournament.participants.length; i++) {
            address participant = tournament.participants[i];
            Participant storage p = tournamentParticipants[_tournamentId][participant];
            
            if (p.hasSubmitted && p.score > highestScore) {
                highestScore = p.score;
            }
        }
        
        // Collect all participants with highest score
        for (uint256 i = 0; i < tournament.participants.length; i++) {
            address participant = tournament.participants[i];
            Participant storage p = tournamentParticipants[_tournamentId][participant];
            
            if (p.hasSubmitted && p.score == highestScore) {
                topPerformers[topPerformerCount] = participant;
                topPerformerCount++;
            }
        }
        
        // If tie, use VRF to select winner fairly
        if (topPerformerCount > 1) {
            uint256 winnerIndex = _randomness % topPerformerCount;
            winner = topPerformers[winnerIndex];
        } else if (topPerformerCount == 1) {
            winner = topPerformers[0];
        }
        
        return winner;
    }
    
    function _distributePrizes(uint256 _tournamentId) internal {
        Tournament storage tournament = tournaments[_tournamentId];
        
        if (tournament.winner != address(0) && tournament.prizePool > 0) {
            uint256 platformFee = (tournament.prizePool * platformFeePercentage) / 100;
            uint256 winnerPrize = tournament.prizePool - platformFee;
            
            // Transfer prize to winner
            inkToken.transfer(tournament.winner, winnerPrize);
            
            // Transfer platform fee to owner
            inkToken.transfer(owner(), platformFee);
        }
    }
    
    // Emergency functions
    function endTournamentManually(uint256 _tournamentId) external onlyOwner {
        Tournament storage tournament = tournaments[_tournamentId];
        require(tournament.isActive, "Tournament not active");
        require(block.timestamp >= tournament.endTime, "Tournament not ended yet");
        
        _endTournament(_tournamentId);
    }
    
    function setPlatformFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 20, "Fee cannot exceed 20%");
        platformFeePercentage = _feePercentage;
    }
    
    // View functions
    function getTournament(uint256 _tournamentId) external view returns (Tournament memory) {
        return tournaments[_tournamentId];
    }
    
    function getParticipant(uint256 _tournamentId, address _player) external view returns (Participant memory) {
        return tournamentParticipants[_tournamentId][_player];
    }
    
    function getTournamentParticipants(uint256 _tournamentId) external view returns (address[] memory) {
        return tournaments[_tournamentId].participants;
    }
    
    function getActiveTournaments() external view returns (uint256[] memory) {
        uint256[] memory activeTournaments = new uint256[](tournamentCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= tournamentCounter; i++) {
            if (tournaments[i].isActive && !tournaments[i].isCompleted) {
                activeTournaments[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeTournaments[i];
        }
        
        return result;
    }
}
