import * as React from 'react';
import { useState, useEffect } from 'react';
import { Trophy, Users, Clock, Zap, Target, Award, TrendingUp, Star, Crown, Medal } from 'lucide-react';
import { squadService } from '../services/squadService';

interface StudyLeague {
  id: string;
  name: string;
  subject: string;
  participants: number;
  max_participants: number;
  start_date: string;
  end_date: string;
  entry_fee: number;
  prize_pool: number;
  my_rank?: number;
  my_score?: number;
  status: 'upcoming' | 'active' | 'ended';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  league_type: 'weekly' | 'monthly' | 'tournament';
  description: string;
}

interface LeagueParticipant {
  id: number;
  username: string;
  fname: string;
  lname: string;
  avatar: string;
  score: number;
  rank: number;
  xp_earned: number;
  questions_answered: number;
  accuracy: number;
}

interface NationalLeaderboard {
  id: number;
  username: string;
  fname: string;
  lname: string;
  avatar: string;
  total_xp: number;
  rank: number;
  school?: string;
  region?: string;
}

export const StudyLeaguesPanel = () => {
  const [activeTab, setActiveTab] = useState<'leagues' | 'national' | 'tournaments'>('leagues');
  const [studyLeagues, setStudyLeagues] = useState<StudyLeague[]>([]);
  const [nationalLeaderboard, setNationalLeaderboard] = useState<NationalLeaderboard[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<StudyLeague | null>(null);
  const [leagueParticipants, setLeagueParticipants] = useState<LeagueParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all');
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    loadStudyLeagues();
    loadLeaderboard();
  }, []);

  // Connect to backend: fetch study leagues
  const loadStudyLeagues = async () => {
    try {
      setLoading(true);
      const leagues = await squadService.getStudyLeagues(filter);
      setStudyLeagues(leagues as StudyLeague[]);
    } catch (error) {
      console.error('Error loading study leagues:', error);
      setStudyLeagues([]);
    } finally {
      setLoading(false);
    }
  };

  // Connect to backend: fetch national leaderboard
  const loadLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      // If you have a backend endpoint for national leaderboard, use it here.
      // Otherwise, keep the fetch as is.
      const response = await fetch('https://brainink-backend-achivements-micro.onrender.com/leaderboard');
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      let leaderboard: NationalLeaderboard[] = [];
      if (Array.isArray(data)) {
        leaderboard = data;
      } else if (Array.isArray(data.leaderboard)) {
        leaderboard = data.leaderboard;
      }
      setNationalLeaderboard(leaderboard);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setNationalLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Connect to backend: join a league
  const handleJoinLeague = async (leagueId: string) => {
    try {
      const success = await squadService.joinStudyLeague(leagueId);
      if (success) {
        setStudyLeagues(prev => prev.map(league =>
          league.id === leagueId
            ? { ...league, participants: league.participants + 1 }
            : league
        ));
      }
    } catch (error) {
      console.error('Error joining league:', error);
    }
  };

  // Refetch leagues when filter changes
  useEffect(() => {
    loadStudyLeagues();
    // eslint-disable-next-line
  }, [filter]);

  const filteredLeagues = studyLeagues.filter(league => {
    if (filter === 'all') return true;
    return league.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'upcoming': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'ended': return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
      default: return 'text-gray-400';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/10';
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/10';
      case 'advanced': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400';
    }
  };

  const renderLeagueCard = (league: StudyLeague) => (
    <div key={league.id} className="bg-dark/50 border border-primary/20 rounded-lg p-6 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-medium text-white text-lg">{league.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(league.status)}`}>
              {league.status}
            </span>
          </div>
          <p className="text-gray-400 text-sm mb-3">{league.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{league.participants.toLocaleString()}/{league.max_participants.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{league.league_type}</span>
            </div>
            <span className={`px-2 py-1 rounded ${getDifficultyColor(league.difficulty)}`}>
              {league.difficulty}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-primary font-bold text-xl mb-1">
            ${league.prize_pool.toLocaleString()}
          </div>
          <div className="text-gray-400 text-sm">Prize Pool</div>
        </div>
      </div>
      <div className="border-t border-primary/10 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-white font-medium">{league.subject}</div>
              <div className="text-gray-400 text-xs">Subject</div>
            </div>
            {league.my_rank && (
              <div className="text-center">
                <div className="text-yellow-400 font-medium">#{league.my_rank}</div>
                <div className="text-gray-400 text-xs">My Rank</div>
              </div>
            )}
            {league.my_score && (
              <div className="text-center">
                <div className="text-primary font-medium">{league.my_score.toLocaleString()}</div>
                <div className="text-gray-400 text-xs">My Score</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {league.status === 'upcoming' && (
              <button
                onClick={() => handleJoinLeague(league.id)}
                className="px-4 py-2 bg-primary/20 border border-primary/40 text-primary rounded-lg hover:bg-primary/30 transition-colors"
              >
                Join League
              </button>
            )}
            <button
              onClick={() => setSelectedLeague(league)}
              className="px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNationalLeaderboard = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-yellow-500/10 to-primary/10 border border-yellow-500/20 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Crown size={24} className="text-yellow-400" />
          <h2 className="font-pixel text-xl text-white">National Leaderboard</h2>
        </div>
        <p className="text-gray-400">Top performers from across the country</p>
      </div>
      {loadingLeaderboard ? (
        <div className="text-center text-gray-400 py-8">Loading leaderboard...</div>
      ) : nationalLeaderboard.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No leaderboard data available.</div>
      ) : (
        <div className="space-y-3">
          {nationalLeaderboard.map((user, index) => (
            <div key={user.id} className={`p-4 rounded-lg border transition-colors ${index < 3
              ? 'bg-gradient-to-r from-yellow-500/5 to-primary/5 border-yellow-500/20'
              : 'bg-dark/50 border-primary/20 hover:border-primary/40'
              }`}>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${index === 0 ? 'bg-yellow-500/20 border-2 border-yellow-500/40' :
                    index === 1 ? 'bg-gray-400/20 border-2 border-gray-400/40' :
                      index === 2 ? 'bg-orange-500/20 border-2 border-orange-500/40' :
                        'bg-primary/20'
                    }`}>
                    {index < 3 ? (
                      index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'
                    ) : (
                      user.avatar || user.username[0]?.toUpperCase() || '👤'
                    )}
                  </div>
                  <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-500 text-black' :
                        'bg-primary text-white'
                    }`}>
                    {user.rank}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{user.fname} {user.lname}</h3>
                    <span className="text-gray-400 text-sm">@{user.username}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                    {user.school && <span>🏫 {user.school}</span>}
                    {user.region && <span>📍 {user.region}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-primary font-bold text-lg">
                    {user.total_xp?.toLocaleString?.() ?? '0'} XP
                  </div>
                  <div className="text-gray-400 text-sm">Total Score</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-primary/20 bg-dark/95">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-pixel text-primary text-2xl">Study Leagues</h1>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-primary/20 border border-primary/40 text-primary rounded-lg hover:bg-primary/30 transition-colors">
              <Zap size={16} className="inline mr-2" />
              Quick Match
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1">
          {[
            {
              id: 'leagues',
              label: 'Study Leagues',
              icon: <Trophy size={16} />
            },
            {
              id: 'national',
              label: 'National Rankings',
              icon: <Crown size={16} />
            },
            {
              id: 'tournaments',
              label: 'Tournaments',
              icon: <Medal size={16} />
            }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${activeTab === tab.id
                ? 'bg-primary/20 border-primary/40 text-primary'
                : 'bg-dark/50 border-primary/20 text-gray-400 hover:text-white'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'leagues' && (
          <div>
            {/* Filters */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-gray-400">Filter:</span>
              {['all', 'active', 'upcoming', 'ended'].map(filterOption => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption as any)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${filter === filterOption
                    ? 'bg-primary/20 text-primary border border-primary/40'
                    : 'bg-dark/50 text-gray-400 border border-primary/20 hover:text-white'
                    }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </button>
              ))}
            </div>
            {/* Leagues Grid */}
            {loading ? (
              <div className="text-center text-gray-400 py-12">
                Loading study leagues...
              </div>
            ) : filteredLeagues.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <Trophy size={64} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2">No Leagues Found</h3>
                <p className="text-sm">Try adjusting your filters or check back later!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLeagues.map(renderLeagueCard)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'national' && renderNationalLeaderboard()}

        {activeTab === 'tournaments' && (
          <div className="text-center text-gray-400 py-12">
            <Medal size={64} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">Tournaments Coming Soon</h3>
            <p className="text-sm">Special tournament features are being developed!</p>
          </div>
        )}
      </div>

      {/* League Details Modal */}
      {selectedLeague && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-dark border border-primary/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-pixel text-primary text-xl">{selectedLeague.name}</h2>
              <button
                onClick={() => setSelectedLeague(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-300">{selectedLeague.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="text-primary font-medium">{selectedLeague.participants.toLocaleString()}</div>
                  <div className="text-gray-400 text-sm">Participants</div>
                </div>
                <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                  <div className="text-yellow-400 font-medium">${selectedLeague.prize_pool.toLocaleString()}</div>
                  <div className="text-gray-400 text-sm">Prize Pool</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleJoinLeague(selectedLeague.id)}
                  className="flex-1 py-2 bg-primary text-dark font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Join League
                </button>
                <button
                  onClick={() => setSelectedLeague(null)}
                  className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};