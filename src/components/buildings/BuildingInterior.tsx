import React, { useState } from 'react';
import { X, ChevronLeft, Users, Crown, Star } from 'lucide-react';
interface BuildingInteriorProps {
  buildingId: string;
  onExit: () => void;
}
export const BuildingInterior = ({
  buildingId,
  onExit
}: BuildingInteriorProps) => {
  const [activeStation, setActiveStation] = useState<string | null>(null);
  const [activeSubFeature, setActiveSubFeature] = useState<string | null>(null);
  const interiors: Record<string, {
    title: string;
    description: string;
    color: string;
    activeUsers?: number;
    features: {
      id: string;
      name: string;
      description: string;
      icon: string;
      isLocked?: boolean;
      activeUsers?: number;
      level?: number;
      subFeatures?: {
        id: string;
        name: string;
        description: string;
        icon: string;
      }[];
      interaction?: () => void;
    }[];
  }> = {
    arena: {
      title: 'Battle Arena',
      description: 'Test your knowledge in epic tournaments',
      color: '#ef5350',
      activeUsers: 128,
      features: [{
        id: 'tournament',
        name: 'Tournament Hall',
        description: 'Join live tournaments and compete for rewards',
        icon: '🏆',
        activeUsers: 64,
        subFeatures: [{
          id: 'quick-match',
          name: 'Quick Match',
          description: 'Jump into a game now',
          icon: '⚡'
        }, {
          id: 'ranked',
          name: 'Ranked Match',
          description: 'Compete for leaderboard position',
          icon: '📊'
        }, {
          id: 'custom',
          name: 'Custom Tournament',
          description: 'Create your own tournament',
          icon: '🎮'
        }]
      }, {
        id: 'practice',
        name: 'Training Grounds',
        description: 'Practice with AI opponents or friends',
        icon: '🎯',
        activeUsers: 32,
        subFeatures: [{
          id: 'ai-training',
          name: 'AI Training',
          description: 'Practice with KANA',
          icon: '🤖'
        }, {
          id: 'friend-battle',
          name: 'Friend Battle',
          description: 'Challenge a friend',
          icon: '🤝'
        }]
      }, {
        id: 'leaderboard',
        name: 'Hall of Fame',
        description: 'View rankings and achievements',
        icon: '👑',
        activeUsers: 15
      }]
    },
    lab: {
      title: 'K.A.N.A. Lab',
      description: 'Where knowledge meets artificial intelligence',
      color: '#64b5f6',
      features: [{
        id: 'ai-interface',
        name: 'AI Interface',
        description: 'Direct connection to K.A.N.A.',
        icon: '🤖',
        interaction: () => window.location.href = '/chatbot'
      }, {
        id: 'study-pods',
        name: 'Study Pods',
        description: 'Private spaces for focused learning',
        icon: '🎧'
      }, {
        id: 'research',
        name: 'Research Terminal',
        description: 'Access the knowledge database',
        icon: '💻',
        isLocked: true
      }]
    },
    'creators-guild': {
      title: 'Creators Guild',
      description: 'Create and share your knowledge',
      color: '#9575cd',
      features: [{
        id: 'course-creator',
        name: 'Course Creator',
        description: 'Build and publish your own courses',
        icon: '📚'
      }, {
        id: 'publishing',
        name: 'Publishing Center',
        description: 'Manage and monitor your content',
        icon: '📝'
      }, {
        id: 'community',
        name: 'Community Hub',
        description: 'Connect with other creators',
        icon: '👥',
        isLocked: true
      }]
    }
  };
  const interior = interiors[buildingId];
  if (!interior) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl h-[80vh] bg-dark/95 rounded-lg border-2 shadow-2xl overflow-hidden" style={{
      borderColor: interior.color
    }}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-dark/80 border-b border-primary/20 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onExit} className="p-2 rounded-lg hover:bg-primary/20 transition-colors">
              <ChevronLeft size={24} className="text-primary" />
            </button>
            <div>
              <h1 className="font-pixel text-xl" style={{
              color: interior.color
            }}>
                {interior.title}
              </h1>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Users size={14} />
                <span>{interior.activeUsers} active</span>
              </div>
            </div>
          </div>
          <button onClick={onExit} className="p-2 rounded-lg hover:bg-primary/20 transition-colors">
            <X size={24} className="text-primary" />
          </button>
        </div>
        {/* Main Content */}
        <div className="h-full pt-16 flex">
          {/* Features List */}
          <div className="w-72 border-r border-primary/20 overflow-y-auto">
            {interior.features.map(feature => <div key={feature.id} className={`p-4 border-b border-primary/10 cursor-pointer transition-all
                  ${activeStation === feature.id ? 'bg-primary/20' : 'hover:bg-primary/10'}`} onClick={() => {
            setActiveStation(feature.id);
            setActiveSubFeature(null);
          }}>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{feature.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-pixel text-sm text-primary">
                      {feature.name}
                    </h3>
                    <p className="text-gray-400 text-xs">
                      {feature.description}
                    </p>
                  </div>
                  {feature.activeUsers && <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Users size={12} />
                      {feature.activeUsers}
                    </div>}
                </div>
              </div>)}
          </div>
          {/* Feature Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeStation ? <div className="h-full">
                {/* Active Feature Content */}
                <div className="mb-6">
                  <h2 className="font-pixel text-xl mb-2" style={{
                color: interior.color
              }}>
                    {interior.features.find(f => f.id === activeStation)?.name}
                  </h2>
                  <p className="text-gray-300">
                    {interior.features.find(f => f.id === activeStation)?.description}
                  </p>
                </div>
                {/* Sub-features Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {interior.features.find(f => f.id === activeStation)?.subFeatures?.map(sub => <div key={sub.id} className={`
                          bg-dark/50 border rounded-lg p-6 transition-all cursor-pointer
                          ${activeSubFeature === sub.id ? 'border-primary scale-105' : 'border-primary/30'}
                          hover:border-primary/50 hover:scale-[1.02]
                        `} onClick={() => setActiveSubFeature(sub.id)}>
                        <div className="text-3xl mb-3">{sub.icon}</div>
                        <h3 className="font-pixel text-primary mb-2">
                          {sub.name}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {sub.description}
                        </p>
                        <button className="mt-4 px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm hover:bg-primary/30 transition-colors">
                          Enter
                        </button>
                      </div>)}
                </div>
                {/* Stats and Info */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-dark/30 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown size={16} className="text-yellow-400" />
                      <span className="text-sm text-gray-300">Top Player</span>
                    </div>
                    <div className="text-primary font-pixel">BrainMaster99</div>
                  </div>
                  <div className="bg-dark/30 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={16} className="text-yellow-400" />
                      <span className="text-sm text-gray-300">
                        Active Events
                      </span>
                    </div>
                    <div className="text-primary font-pixel">3 Tournaments</div>
                  </div>
                  <div className="bg-dark/30 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={16} className="text-primary" />
                      <span className="text-sm text-gray-300">Online Now</span>
                    </div>
                    <div className="text-primary font-pixel">128 Players</div>
                  </div>
                </div>
              </div> : <div className="h-full flex items-center justify-center text-gray-400">
                Select a feature to begin
              </div>}
          </div>
        </div>
      </div>
    </div>;
};