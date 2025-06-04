import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, MapPin, Trophy } from 'lucide-react';

type LeaderboardTab = 'global' | 'regional' | 'league';
type LeagueType = 'novus' | 'scholar' | 'master' | 'grandmaster';

interface LeaderboardEntry {
  id: string;
  username: string;
  avatar: string;
  xp: number;
  rank: number; 
  league: {
    type: LeagueType;
    tier: number; // 1, 2, 3 (3 being lowest)
  };
  country?: string;
  region?: string;
}

interface LeaderboardProps {
  onExit: () => void;
  currentUserId: string;
  userLeague: {
    type: LeagueType;
    tier: number;
  };
  userRegion: string;
}

const getLeagueName = (league: { type: LeagueType; tier: number }): string => {
  const typeName = league.type.charAt(0).toUpperCase() + league.type.slice(1);
  return `${typeName} League ${league.tier}`;
};

// League badge colors
const getLeagueColors = (leagueType: LeagueType): { bg: string; text: string; border: string } => {
  switch (leagueType) {
    case 'grandmaster':
      return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' };
    case 'master':
      return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' };
    case 'scholar':
      return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' };
    case 'novus':
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' };
    default:
      return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' };
  }
};

export const Leaderboard: React.FC<LeaderboardProps> = ({
  onExit,
  currentUserId,
  userLeague,
  userRegion
}) => {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('global');
  
  // Mock leaderboard data - in a real app, this would come from an API
  const mockLeaderboardData: LeaderboardEntry[] = [
    {
      id: '1',
      username: 'BrainMaster',
      avatar: '🧠',
      xp: 12500,
      rank: 1,
      league: { type: 'grandmaster', tier: 1 },
      country: 'USA',
      region: 'North America'
    },
    {
      id: '2',
      username: 'QuizWizard',
      avatar: '🧙',
      xp: 10200,
      rank: 2,
      league: { type: 'grandmaster', tier: 1 },
      country: 'UK',
      region: 'Europe'
    },
    {
      id: currentUserId,
      username: 'You',
      avatar: '😎',
      xp: 6800,
      rank: 8,
      league: userLeague,
      country: 'Canada',
      region: userRegion
    },
    {
      id: '4',
      username: 'ThoughtLeader',
      avatar: '🤔',
      xp: 9800,
      rank: 3,
      league: { type: 'grandmaster', tier: 1 },
      country: 'Germany',
      region: 'Europe'
    },
    {
      id: '5',
      username: 'KnowledgeSeeker',
      avatar: '📚',
      xp: 9500,
      rank: 4,
      league: { type: 'grandmaster', tier: 1 },
      country: 'Japan',
      region: 'Asia'
    },
    {
      id: '6',
      username: 'MindExpander',
      avatar: '🌌',
      xp: 8200,
      rank: 5,
      league: { type: 'grandmaster', tier: 2 },
      country: 'Australia',
      region: 'Oceania'
    },
    {
      id: '7',
      username: 'BrainWave',
      avatar: '🌊',
      xp: 7500,
      rank: 6,
      league: { type: 'grandmaster', tier: 2 },
      country: 'Brazil',
      region: 'South America'
    },
    {
      id: '8',
      username: 'NeuralNetwork',
      avatar: '🔮',
      xp: 7200,
      rank: 7,
      league: { type: 'grandmaster', tier: 2 },
      country: 'India',
      region: 'Asia'
    },
    {
      id: '9',
      username: 'SynapseStorm',
      avatar: '⚡',
      xp: 6500,
      rank: 9,
      league: { type: 'master', tier: 1 },
      country: 'France',
      region: 'Europe'
    },
    {
      id: '10',
      username: 'CortexKing',
      avatar: '👑',
      xp: 6300,
      rank: 10,
      league: { type: 'master', tier: 1 },
      country: 'South Korea',
      region: 'Asia'
    },
    // More mock entries for other leagues
    {
      id: '11',
      username: 'ScholarSage',
      avatar: '🦉',
      xp: 4200,
      rank: 1,
      league: { type: 'scholar', tier: 1 },
      country: 'Mexico',
      region: 'North America'
    },
    {
      id: '12',
      username: 'NoviceNinja',
      avatar: '🥋',
      xp: 1800,
      rank: 1,
      league: { type: 'novus', tier: 1 },
      country: 'South Africa',
      region: 'Africa'
    }
  ];
  
  // Filter data based on the active tab
  const getFilteredData = () => {
    switch (activeTab) {
      case 'global':
        return mockLeaderboardData.sort((a, b) => b.xp - a.xp);
      case 'regional':
        return mockLeaderboardData
          .filter(entry => entry.region === userRegion)
          .sort((a, b) => b.xp - a.xp);
      case 'league':
        return mockLeaderboardData
          .filter(entry => 
            entry.league.type === userLeague.type && 
            entry.league.tier === userLeague.tier
          )
          .sort((a, b) => b.xp - a.xp);
      default:
        return mockLeaderboardData;
    }
  };
  
  const filteredData = getFilteredData();
  const currentUser = mockLeaderboardData.find(entry => entry.id === currentUserId);
  
  // Get the appropriate tab title
  const getTabTitle = (): string => {
    switch (activeTab) {
      case 'global':
        return 'Global Rankings';
      case 'regional':
        return `${userRegion} Rankings`;
      case 'league':
        return `${getLeagueName(userLeague)} Rankings`;
      default:
        return 'Leaderboard';
    }
  };
  
  // Format XP for display
  const formatXP = (xp: number): string => {
    if (xp >= 10000) {
      return `${(xp / 1000).toFixed(1)}k`;
    }
    return xp.toString();
  };
  
  return (
    <div className="h-full flex flex-col bg-dark/80">
      {/* Header */}
      <div className="bg-dark/50 border-b border-primary/30 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 text-gray-400 hover:text-primary"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-primary font-pixel">Leaderboard</h2>
            <div className="text-xs text-gray-400">{getTabTitle()}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {currentUser && (
            <div className="text-gray-400 text-sm">
              Your Rank: <span className="text-primary font-pixel">{currentUser.rank}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-primary/30">
        <button
          onClick={() => setActiveTab('global')}
          className={`flex items-center gap-2 px-4 py-3 ${
            activeTab === 'global' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Globe size={16} />
          <span>Global</span>
        </button>
        
        <button
          onClick={() => setActiveTab('regional')}
          className={`flex items-center gap-2 px-4 py-3 ${
            activeTab === 'regional' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <MapPin size={16} />
          <span>Regional</span>
        </button>
        
        <button
          onClick={() => setActiveTab('league')}
          className={`flex items-center gap-2 px-4 py-3 ${
            activeTab === 'league' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Trophy size={16} />
          <span>League</span>
        </button>
      </div>
      
      {/* Leaderboard content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* League info for league tab */}
        {activeTab === 'league' && (
          <div className="mb-5 bg-dark/50 border border-primary/30 rounded-lg p-4">
            <h3 className="text-primary font-medium mb-2">{getLeagueName(userLeague)}</h3>
            <p className="text-gray-400 text-sm">
              Compete with other members of your league to climb the ranks and advance to the next tier.
              The top 10% of players will be promoted at the end of each season.
            </p>
          </div>
        )}
        
        {/* List of players */}
        <div className="space-y-3">
          {filteredData.map((entry, index) => {
            const isCurrentUser = entry.id === currentUserId;
            const leagueColors = getLeagueColors(entry.league.type);
            
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`flex items-center p-3 rounded-lg ${
                  isCurrentUser ? 'bg-primary/10 border border-primary/30' : 'bg-dark/50 border border-gray-800'
                }`}
              >
                <div className={`w-8 text-center font-medium ${isCurrentUser ? 'text-primary' : 'text-gray-400'}`}>
                  {entry.rank}
                </div>
                
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl bg-dark/50 mx-3">
                  {entry.avatar}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className={`font-medium ${isCurrentUser ? 'text-primary' : 'text-white'}`}>
                      {entry.username}
                    </div>
                    
                    {/* League badge */}
                    <div className={`ml-2 text-xs px-2 py-0.5 rounded-full ${leagueColors.bg} ${leagueColors.text} border ${leagueColors.border}`}>
                      {entry.league.type.charAt(0).toUpperCase()}
                      {entry.league.tier}
                    </div>
                  </div>
                  
                  {entry.region && (
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin size={12} />
                      {entry.country}
                    </div>
                  )}
                </div>
                
                <div className={`font-pixel text-right ${isCurrentUser ? 'text-primary' : 'text-gray-300'}`}>
                  {formatXP(entry.xp)} XP
                </div>
              </motion.div>
            );
          })}
          
          {filteredData.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No players found in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
