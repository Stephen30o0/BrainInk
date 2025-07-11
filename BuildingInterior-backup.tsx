import React, { useState } from 'react';
import { X, ChevronLeft, Users, Crown, Star } from 'lucide-react';
import { ArenaHub } from '../arena/ArenaHub';

interface BuildingInteriorProps {
  buildingId: string;
  onExit: () => void;
  buildings?: Building[];
}

interface Building {
  id: string;
  name: string;
  color: string;
  size: 'small' | 'medium' | 'large';
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  description: string;
  notification?: number;
  animation: 'pulse' | 'float' | 'glow' | 'bounce' | 'shake';
  icon: string;
}

export const BuildingInterior = ({
  buildingId,
  onExit,
  buildings
}: BuildingInteriorProps) => {
  const [activeStation, setActiveStation] = useState<string | null>(null);
  const [activeSubFeature, setActiveSubFeature] = useState<string | null>(null);

  // Get building details from buildings array if provided
  const getBuildingDetails = () => {
    if (buildings && buildings.length > 0) {
      const building = buildings.find(b => b.id === buildingId);
      if (building) {
        return {
          name: building.name,
          color: building.color,
          icon: building.icon
        };
      }
    }
    // Fallback to interior data if buildings not provided
    const interior = interiors[buildingId];
    return {
      name: interior?.title || 'Unknown Location',
      color: interior?.color || '#ffffff',
      icon: 'ðŸ¢' // Default icon
    };
  };

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
        interaction?: () => void;
      }[];
      interaction?: () => void;
    }[];
  }> = {
    arena: {
      title: 'Battle Arena',
      description: 'Test your knowledge in epic tournaments',
      color: '#ef5350',
      activeUsers: 128,
      features: [
        {
          id: 'tournament',
          name: 'Tournament Hall',
          description: 'Join live tournaments and compete for rewards',
          icon: 'ðŸ†',
          activeUsers: 64,
          interaction: () => setActiveStation('tournament'),
          subFeatures: [
            {
              id: 'quick-match',
              name: 'Quick Match',
              description: 'Jump into a game now',
              icon: 'âš¡',
              interaction: () => setActiveSubFeature('quick-match')
            },
            {
              id: 'ranked',
              name: 'Ranked Match',
              description: 'Compete for leaderboard position',
              icon: 'ðŸ“Š',
              interaction: () => setActiveSubFeature('ranked')
            },
            {
              id: 'custom',
              name: 'Custom Tournament',
              description: 'Create your own tournament',
              icon: 'ðŸŽ®',
              interaction: () => setActiveSubFeature('custom')
            }
          ]
        },
        {
          id: 'practice',
          name: 'Training Grounds',
          description: 'Practice with AI opponents or friends',
          icon: 'ðŸŽ¯',
          activeUsers: 32,
          interaction: () => setActiveStation('practice'),
          subFeatures: [
            {
              id: 'ai-training',
              name: 'AI Training',
              description: 'Practice with KANA',
              icon: 'ðŸ¤–',
              interaction: () => setActiveSubFeature('ai-training')
            },
            {
              id: 'friend-battle',
              name: 'Friend Battle',
              description: 'Challenge a friend',
              icon: 'ðŸ¤',
              interaction: () => setActiveSubFeature('friend-battle')
            }
          ]
        },
        {
          id: 'leaderboard',
          name: 'Hall of Fame',
          description: 'View rankings and achievements',
          icon: 'ðŸ‘‘',
          activeUsers: 15,
          interaction: () => setActiveStation('leaderboard')
        }
      ]
    },
    lab: {
      title: 'K.A.N.A. Lab',
      description: 'Where knowledge meets artificial intelligence',
      color: '#64b5f6',
      features: [
        {
          id: 'ai-interface',
          name: 'AI Interface',
          description: 'Direct connection to K.A.N.A.',
          icon: 'ðŸ¤–',
          interaction: () => window.location.href = '/chatbot'
        },
        {
          id: 'study-pods',
          name: 'Study Pods',
          description: 'Private spaces for focused learning',
          icon: 'ðŸŽ§'
        },
        {
          id: 'research',
          name: 'Research Terminal',
          description: 'Access the knowledge database',
          icon: 'ðŸ’»',
          isLocked: true
        }
      ]
    },
    'creators-guild': {
      title: 'Creators Guild',
      description: 'Create and share your knowledge',
      color: '#9575cd',
      features: [
        {
          id: 'course-creator',
          name: 'Course Creator',
          description: 'Build and publish your own courses',
          icon: 'ðŸ“š'
        },
        {
          id: 'publishing',
          name: 'Publishing Center',
          description: 'Manage and monitor your content',
          icon: 'ðŸ“'
        },
        {
          id: 'community',
          name: 'Community Hub',
          description: 'Connect with other creators',
          icon: 'ðŸ‘¥',
          isLocked: true
        }
      ]
    }
  };

  // Get building details from either provided buildings array or interiors data
  const buildingDetails = getBuildingDetails();
  const interior = interiors[buildingId];

  // Check if interior data exists
  if (!interior) return null;

  // Render appropriate content based on the activeStation
  const renderActiveContent = () => {
    // For Arena building, render the appropriate ArenaHub with proper props
    console.log('Rendering ArenaHub with:', { activeStation, activeSubFeature });
    return (
      <ArenaHub 
        onExit={() => {
          setActiveStation(null);
          setActiveSubFeature(null);
        }}
        initialMode={activeSubFeature ? 'game' : (activeStation || 'hub')}
        featureId={activeStation || undefined}
        subFeatureId={activeSubFeature || undefined}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="relative w-full max-w-6xl h-[80vh] bg-dark/95 rounded-lg border-2 shadow-2xl overflow-hidden"
        style={{
          borderColor: buildingDetails.color || interior.color
        }}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-dark/80 border-b border-primary/20 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onExit}
              className="p-2 rounded-lg hover:bg-primary/20 transition-colors"
            >
              <ChevronLeft size={24} className="text-primary" />
            </button>
            <div>
              <h1
                className="font-pixel text-xl"
                style={{
                  color: interior.color
                }}
              >
                {interior.title}
              </h1>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Users size={14} />
                <span>{interior.activeUsers} active</span>
              </div>
            </div>
          </div>
          <button
            onClick={onExit}
            className="p-2 rounded-lg hover:bg-primary/20 transition-colors"
          >
            <X size={24} className="text-primary" />
          </button>
        </div>
        {/* Main Content */}
        <div className="flex h-[calc(80vh-65px)]">
          {/* Sidebar */}
          <div className="w-72 border-r border-primary/20 overflow-y-auto">
            {interior.features.map(feature => (
              <div
                key={feature.id}
                className={`p-4 border-b border-primary/10 cursor-pointer transition-all
                  ${activeStation === feature.id ? 'bg-primary/20' : 'hover:bg-primary/10'}`}
                onClick={() => {
                  setActiveStation(feature.id);
                  setActiveSubFeature(null);
                }}
              >
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
                  {feature.activeUsers && (
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Users size={12} />
                      {feature.activeUsers}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Feature Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {buildingId === 'arena' && activeStation ? (
              // Arena-specific rendering
              renderActiveContent()
            ) : activeStation ? (
              // Standard feature rendering for other buildings
              <div className="h-full">
                {/* Active Feature Content */}
                <div className="mb-6">
                  <h2 className="font-pixel text-xl mb-2" style={{
                    color: interior.color
                  }}>
                    {interior.features.find((f: any) => f.id === activeStation)?.name}
                  </h2>
                  <p className="text-gray-300">
                    {interior.features.find((f: any) => f.id === activeStation)?.description}
                  </p>
                </div>
                {/* Sub-features Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {interior.features.find((f: any) => f.id === activeStation)?.subFeatures?.map((sub: any) => (
                    <div 
                      key={sub.id} 
                      className={`bg-dark/50 border rounded-lg p-6 transition-all cursor-pointer
                        ${activeSubFeature === sub.id ? 'border-primary scale-105' : 'border-primary/30'}
                        hover:border-primary/50 hover:scale-[1.02]
                      `} 
                      onClick={() => setActiveSubFeature(sub.id)}
                    >
                      <div className="text-3xl mb-3">{sub.icon}</div>
                      <h3 className="font-pixel text-primary mb-2">
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
              </div>
            ) : (
              // Default - no feature selected
              <div className="h-full flex items-center justify-center text-gray-400">
                Select a feature to begin
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
