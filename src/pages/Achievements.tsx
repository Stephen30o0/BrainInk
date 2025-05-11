import React, { useState } from 'react';
import { Trophy, Star, Target, Award, Medal, Filter, ChevronDown, Search } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  progress: number;
  total: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  reward: {
    xp: number;
    tokens: number;
  };
  completed: boolean;
  category: 'academic' | 'social' | 'special';
  dateCompleted?: string;
}

export const Achievements = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rarity' | 'progress' | 'recent'>('rarity');
  const [showFilters, setShowFilters] = useState(false);

  const achievements: Achievement[] = [
    {
      id: '1',
      name: 'First Scholar',
      desc: 'Complete your first course',
      icon: '📚',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: {
        xp: 50,
        tokens: 25
      },
      completed: true,
      category: 'academic',
      dateCompleted: '2024-03-15'
    },
    {
      id: '2',
      name: 'Knowledge Seeker',
      desc: 'Complete 5 different subjects',
      icon: '🔍',
      progress: 3,
      total: 5,
      rarity: 'rare',
      reward: {
        xp: 200,
        tokens: 100
      },
      completed: false,
      category: 'academic'
    },
    {
      id: '3',
      name: 'Master Mind',
      desc: 'Achieve 100% in any subject',
      icon: '🧠',
      progress: 92,
      total: 100,
      rarity: 'epic',
      reward: {
        xp: 500,
        tokens: 250
      },
      completed: false,
      category: 'academic'
    },
    {
      id: '4',
      name: 'Team Player',
      desc: 'Join a study group',
      icon: '👥',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: {
        xp: 50,
        tokens: 25
      },
      completed: true,
      category: 'social',
      dateCompleted: '2024-03-10'
    },
    {
      id: '5',
      name: 'Helpful Hand',
      desc: 'Answer 10 community questions',
      icon: '🤝',
      progress: 7,
      total: 10,
      rarity: 'rare',
      reward: {
        xp: 150,
        tokens: 75
      },
      completed: false,
      category: 'social'
    },
    {
      id: '6',
      name: 'Early Bird',
      desc: 'Join during beta phase',
      icon: '🌟',
      progress: 100,
      total: 100,
      rarity: 'legendary',
      reward: {
        xp: 1000,
        tokens: 500
      },
      completed: true,
      category: 'special',
      dateCompleted: '2024-03-01'
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-400 to-orange-400';
      case 'epic':
        return 'from-purple-400 to-pink-400';
      case 'rare':
        return 'from-blue-400 to-cyan-400';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'Legendary';
      case 'epic':
        return 'Epic';
      case 'rare':
        return 'Rare';
      default:
        return 'Common';
    }
  };

  const filteredAchievements = achievements
    .filter(achievement => 
      (activeCategory === 'all' || achievement.category === activeCategory) &&
      (achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       achievement.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'rarity':
          const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
          return rarityOrder[a.rarity] - rarityOrder[b.rarity];
        case 'progress':
          return (b.progress / b.total) - (a.progress / a.total);
        case 'recent':
          if (!a.dateCompleted && !b.dateCompleted) return 0;
          if (!a.dateCompleted) return 1;
          if (!b.dateCompleted) return -1;
          return new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime();
        default:
          return 0;
      }
    });

  const stats = {
    total: achievements.length,
    completed: achievements.filter(a => a.completed).length,
    totalXP: achievements.reduce((sum, a) => sum + (a.completed ? a.reward.xp : 0), 0),
    totalTokens: achievements.reduce((sum, a) => sum + (a.completed ? a.reward.tokens : 0), 0)
  };

  return (
    <div className="min-h-screen bg-dark p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-pixel text-2xl text-primary">Achievements</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search achievements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-dark/50 border border-primary/20 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 bg-dark/50 border border-primary/20 rounded-lg text-primary hover:bg-primary/10"
            >
              <Filter size={16} />
              <span>Filter</span>
              <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-dark/30 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Trophy size={16} />
              <span className="text-sm">Total</span>
            </div>
            <div className="font-pixel text-primary text-xl">{stats.completed}/{stats.total}</div>
          </div>
          <div className="bg-dark/30 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Star size={16} />
              <span className="text-sm">XP Earned</span>
            </div>
            <div className="font-pixel text-secondary text-xl">{stats.totalXP}</div>
          </div>
          <div className="bg-dark/30 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Medal size={16} />
              <span className="text-sm">Tokens</span>
            </div>
            <div className="font-pixel text-yellow-400 text-xl">{stats.totalTokens}</div>
          </div>
          <div className="bg-dark/30 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Target size={16} />
              <span className="text-sm">Completion</span>
            </div>
            <div className="font-pixel text-tertiary text-xl">
              {Math.round((stats.completed / stats.total) * 100)}%
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-dark/50 border border-primary/20 rounded-lg">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Category</label>
                <div className="flex gap-2">
                  {['all', 'academic', 'social', 'special'].map(category => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-3 py-1 rounded-lg text-sm capitalize ${
                        activeCategory === category
                          ? 'bg-primary/20 text-primary'
                          : 'bg-dark/50 text-gray-400 hover:bg-primary/10'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'rarity' | 'progress' | 'recent')}
                  className="bg-dark/50 border border-primary/20 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-primary"
                >
                  <option value="rarity">Rarity</option>
                  <option value="progress">Progress</option>
                  <option value="recent">Recently Completed</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map(achievement => (
            <div
              key={achievement.id}
              className="bg-dark/30 border border-primary/20 rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getRarityColor(achievement.rarity)} flex items-center justify-center text-2xl`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-pixel text-primary text-sm">
                        {achievement.name}
                      </h3>
                      <p className="text-gray-400 text-xs mt-1">
                        {achievement.desc}
                      </p>
                    </div>
                    {achievement.completed && (
                      <div className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                        COMPLETED
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>
                        {achievement.progress}/{achievement.total}
                      </span>
                    </div>
                    <div className="h-2 bg-dark rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} transition-all`}
                        style={{
                          width: `${(achievement.progress / achievement.total) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-1 text-xs">
                      <Medal size={12} className="text-yellow-400" />
                      <span className="text-yellow-400">
                        {achievement.reward.xp} XP + {achievement.reward.tokens} INK
                      </span>
                    </div>
                    <span className={`text-xs capitalize ${
                      achievement.rarity === 'legendary'
                        ? 'text-yellow-400'
                        : achievement.rarity === 'epic'
                        ? 'text-purple-400'
                        : achievement.rarity === 'rare'
                        ? 'text-blue-400'
                        : 'text-gray-400'
                    }`}>
                      {getRarityLabel(achievement.rarity)}
                    </span>
                  </div>
                  {achievement.dateCompleted && (
                    <div className="text-xs text-gray-500 mt-2">
                      Completed on {new Date(achievement.dateCompleted).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark/50 flex items-center justify-center">
              <Trophy size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No achievements found</h3>
            <p className="text-gray-400">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Start completing tasks to earn achievements!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 