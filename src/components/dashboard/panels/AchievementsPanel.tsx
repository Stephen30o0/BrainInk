import React, { useState } from 'react';
import { Trophy, Star, Target, Award, Medal } from 'lucide-react';
export const AchievementsPanel = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const achievements = {
    academic: [{
      id: '1',
      name: 'First Scholar',
      desc: 'Complete your first course',
      icon: '📚',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: '50 XP',
      completed: true
    }, {
      id: '2',
      name: 'Knowledge Seeker',
      desc: 'Complete 5 different subjects',
      icon: '🔍',
      progress: 3,
      total: 5,
      rarity: 'rare',
      reward: '200 XP',
      completed: false
    }, {
      id: '3',
      name: 'Master Mind',
      desc: 'Achieve 100% in any subject',
      icon: '🧠',
      progress: 92,
      total: 100,
      rarity: 'epic',
      reward: '500 XP',
      completed: false
    }],
    social: [{
      id: '4',
      name: 'Team Player',
      desc: 'Join a study group',
      icon: '👥',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: '50 XP',
      completed: true
    }, {
      id: '5',
      name: 'Helpful Hand',
      desc: 'Answer 10 community questions',
      icon: '🤝',
      progress: 7,
      total: 10,
      rarity: 'rare',
      reward: '150 XP',
      completed: false
    }],
    special: [{
      id: '6',
      name: 'Early Bird',
      desc: 'Join during beta phase',
      icon: '🌟',
      progress: 100,
      total: 100,
      rarity: 'legendary',
      reward: '1000 XP',
      completed: true
    }]
  };
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
  return <div className="p-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-dark/30 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Trophy size={14} />
            <span className="text-xs">Total</span>
          </div>
          <div className="font-pixel text-primary">12/30</div>
        </div>
        <div className="bg-dark/30 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Star size={14} />
            <span className="text-xs">Points</span>
          </div>
          <div className="font-pixel text-secondary">2,450</div>
        </div>
        <div className="bg-dark/30 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Target size={14} />
            <span className="text-xs">Rank</span>
          </div>
          <div className="font-pixel text-tertiary">#126</div>
        </div>
      </div>
      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'academic', 'social', 'special'].map(category => <button key={category} onClick={() => setActiveCategory(category)} className={`px-3 py-1 rounded-lg text-sm capitalize whitespace-nowrap ${activeCategory === category ? 'bg-primary/20 text-primary' : 'bg-dark/50 text-gray-400 hover:bg-primary/10'}`}>
            {category}
          </button>)}
      </div>
      {/* Achievements List */}
      <div className="space-y-4">
        {Object.entries(achievements).map(([category, items]) => {
        if (activeCategory !== 'all' && activeCategory !== category) return null;
        return items.map(achievement => <div key={achievement.id} className="bg-dark/30 border border-primary/20 rounded-lg p-4 hover:border-primary/50 transition-colors">
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
                    {achievement.completed && <div className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                        COMPLETED
                      </div>}
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>
                        {achievement.progress}/{achievement.total}
                      </span>
                    </div>
                    <div className="h-2 bg-dark rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} transition-all`} style={{
                    width: `${achievement.progress / achievement.total * 100}%`
                  }} />
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-1 text-xs">
                      <Medal size={12} className="text-yellow-400" />
                      <span className="text-yellow-400">
                        {achievement.reward}
                      </span>
                    </div>
                    <span className={`text-xs capitalize ${achievement.rarity === 'legendary' ? 'text-yellow-400' : achievement.rarity === 'epic' ? 'text-purple-400' : achievement.rarity === 'rare' ? 'text-blue-400' : 'text-gray-400'}`}>
                      {achievement.rarity}
                    </span>
                  </div>
                </div>
              </div>
            </div>);
      })}
      </div>
    </div>;
};