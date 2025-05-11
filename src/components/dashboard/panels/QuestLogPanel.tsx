import React, { useState } from 'react';
import { Star, Trophy, Calendar, Target } from 'lucide-react';
export const QuestLogPanel = () => {
  const [activeTab, setActiveTab] = useState('active');
  const quests = {
    active: [{
      id: '1',
      title: 'Knowledge Seeker',
      type: 'main',
      desc: 'Complete 3 lessons in different subjects',
      progress: 2,
      total: 3,
      reward: {
        xp: 100,
        tokens: 50
      }
    }, {
      id: '2',
      title: 'Daily Challenge',
      type: 'daily',
      desc: 'Win 2 quick matches',
      progress: 1,
      total: 2,
      reward: {
        xp: 50,
        tokens: 25
      }
    }],
    completed: [{
      id: '3',
      title: 'First Steps',
      type: 'main',
      desc: 'Complete the tutorial',
      progress: 1,
      total: 1,
      reward: {
        xp: 200,
        tokens: 100
      }
    }]
  };
  return <div className="p-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['active', 'completed'].map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm capitalize ${activeTab === tab ? 'bg-primary/20 text-primary' : 'bg-dark/50 text-gray-400 hover:bg-primary/10'}`}>
            {tab}
          </button>)}
      </div>
      {/* Quest List */}
      <div className="space-y-4">
        {quests[activeTab].map(quest => <div key={quest.id} className="bg-dark/30 border border-primary/20 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-pixel text-primary">{quest.title}</h3>
                <p className="text-gray-400 text-sm mt-1">{quest.desc}</p>
              </div>
              <div className="px-2 py-1 bg-primary/10 rounded text-xs text-primary">
                {quest.type}
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>
                  {quest.progress}/{quest.total}
                </span>
              </div>
              <div className="h-2 bg-dark rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{
              width: `${quest.progress / quest.total * 100}%`
            }} />
              </div>
            </div>
            {/* Rewards */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1 text-secondary">
                <Star size={12} />
                <span>{quest.reward.xp} XP</span>
              </div>
              <div className="flex items-center gap-1 text-yellow-400">
                <Trophy size={12} />
                <span>{quest.reward.tokens} INK</span>
              </div>
            </div>
          </div>)}
      </div>
    </div>;
};