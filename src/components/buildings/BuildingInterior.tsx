import { useState } from 'react';
import { X, ChevronLeft, Users, Crown, Star } from 'lucide-react';
import { ArenaHub } from '../arena/ArenaHub';
import { EchoChambers } from '../echo/EchoChambers';
import { Library } from '../library/Library';
import { StudyCentre } from '../study/StudyCentre';
import { Marketplace } from '../marketplace/Marketplace';
import { useAuth } from '../../hooks/useAuth';
import ChatArea from '../../../quiz/src/components/ChatArea';

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
  const { user } = useAuth(); // Get the current authenticated user
  const [activeStation, setActiveStation] = useState<string | null>(null);
  const [activeSubFeature, setActiveSubFeature] = useState<string | null>(null);

  // ChatArea state variables
  const [activeChat, setActiveChat] = useState<{ id: number; subject: string; title: string; } | null>(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);

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
      icon: '🏢' // Default icon
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
          icon: '🏆',
          activeUsers: 64,
          interaction: () => setActiveStation('tournament'),
          subFeatures: [
            {
              id: 'quick-match',
              name: 'Quick Match',
              description: 'Jump into a game now',
              icon: '⚡',
              interaction: () => setActiveSubFeature('quick-match')
            },
            {
              id: 'ranked',
              name: 'Ranked Match',
              description: 'Compete for leaderboard position',
              icon: '📊',
              interaction: () => setActiveSubFeature('ranked')
            },
            {
              id: 'custom',
              name: 'Custom Tournament',
              description: 'Create your own tournament',
              icon: '🎮',
              interaction: () => setActiveSubFeature('custom')
            }
          ]
        },
        {
          id: 'practice',
          name: 'Training Grounds',
          description: 'Practice with AI opponents or friends',
          icon: '🎯',
          activeUsers: 32,
          interaction: () => setActiveStation('practice'),
          subFeatures: [
            {
              id: 'ai-training',
              name: 'AI Training',
              description: 'Practice with KANA',
              icon: '🤖',
              interaction: () => setActiveSubFeature('ai-training')
            },
            {
              id: 'friend-battle',
              name: 'Friend Battle',
              description: 'Challenge a friend',
              icon: '🤝',
              interaction: () => setActiveSubFeature('friend-battle')
            }
          ]
        },
        {
          id: 'leaderboard',
          name: 'Hall of Fame',
          description: 'View rankings and achievements',
          icon: '👑',
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
          icon: '🤖',
          interaction: () => window.location.href = '/quiz/math'
        },
        {
          id: 'study-pods',
          name: 'Study Pods',
          description: 'Private spaces for focused learning',
          icon: '🎧'
        },
        {
          id: 'research',
          name: 'Research Terminal',
          description: 'Access the knowledge database',
          icon: '💻',
          isLocked: true
        }
      ]
    },
    'echo-chambers': {
      title: 'Echo Chambers',
      description: 'Discuss, debate, and exchange ideas with others',
      color: '#4db6ac',
      activeUsers: 95,
      features: [
        {
          id: 'debate-hall',
          name: 'Debate Hall',
          description: 'Engage in structured debates on various topics',
          icon: '🗣️',
          activeUsers: 42,
          interaction: () => setActiveStation('debate-hall'),
          subFeatures: [
            {
              id: 'live-debate',
              name: 'Live Debate',
              description: 'Join an ongoing debate session',
              icon: '🎭',
              interaction: () => setActiveSubFeature('live-debate')
            },
            {
              id: 'debate-challenge',
              name: 'Challenge',
              description: 'Challenge someone to a formal debate',
              icon: '⚔️',
              interaction: () => setActiveSubFeature('debate-challenge')
            }
          ]
        },
        {
          id: 'discussion-rooms',
          name: 'Discussion Rooms',
          description: 'Join themed rooms for casual discussions',
          icon: '💬',
          activeUsers: 38,
          interaction: () => setActiveStation('discussion-rooms'),
          subFeatures: [
            {
              id: 'science-room',
              name: 'Science & Tech',
              description: 'Discuss scientific topics and new technologies',
              icon: '🔬',
              interaction: () => setActiveSubFeature('science-room')
            },
            {
              id: 'philosophy-room',
              name: 'Philosophy & Ethics',
              description: 'Explore philosophical questions and ethical dilemmas',
              icon: '🧠',
              interaction: () => setActiveSubFeature('philosophy-room')
            },
            {
              id: 'arts-room',
              name: 'Arts & Culture',
              description: 'Discuss literature, music, and visual arts',
              icon: '🎨',
              interaction: () => setActiveSubFeature('arts-room')
            }
          ]
        },
        {
          id: 'think-tank',
          name: 'Think Tank',
          description: 'Collaborate on solving complex problems',
          icon: '💡',
          activeUsers: 15,
          interaction: () => setActiveStation('think-tank'),
          subFeatures: [
            {
              id: 'active-projects',
              name: 'Active Projects',
              description: 'Join ongoing collaborative projects',
              icon: '📋',
              interaction: () => setActiveSubFeature('active-projects')
            },
            {
              id: 'new-proposal',
              name: 'New Proposal',
              description: 'Submit a new problem to solve together',
              icon: '✨',
              interaction: () => setActiveSubFeature('new-proposal')
            }
          ]
        }
      ]
    },
    'study-centre': {
      title: 'Stud Centre',
      description: 'Your personalized agentic learning hub powered by K.A.N.A.',
      color: '#4ade80',
      features: [
        {
          id: 'assignments',
          name: 'K.A.N.A. Assignments',
          description: 'Personalized learning tasks created by AI analysis',
          icon: '�'
        },
        {
          id: 'learning-paths',
          name: 'Learning Paths',
          description: 'Adaptive curricula based on your progress',
          icon: '�️'
        },
        {
          id: 'ai-tutor',
          name: 'AI Tutor',
          description: 'One-on-one guidance from K.A.N.A.',
          icon: '🧠'
        }
      ]
    },
    'marketplace': {
      title: 'Knowledge Marketplace',
      description: 'Trade and exchange learning resources',
      color: '#feca57',
      activeUsers: 64,
      features: [
        {
          id: 'resource-exchange',
          name: 'Resource Exchange',
          description: 'Trade study materials with others',
          icon: '🔄',
          activeUsers: 30,
          interaction: () => setActiveStation('resource-exchange'),
          subFeatures: [
            {
              id: 'buy-resources',
              name: 'Buy Resources',
              description: 'Purchase learning materials',
              icon: '🛒',
              interaction: () => setActiveSubFeature('buy-resources')
            },
            {
              id: 'sell-resources',
              name: 'Sell Resources',
              description: 'Share your study materials',
              icon: '💰',
              interaction: () => setActiveSubFeature('sell-resources')
            }
          ]
        },
        {
          id: 'tutoring',
          name: 'Tutoring Services',
          description: 'Find or become a tutor',
          icon: '👩‍🏫',
          activeUsers: 22,
          interaction: () => setActiveStation('tutoring'),
          subFeatures: [
            {
              id: 'find-tutor',
              name: 'Find Tutor',
              description: 'Browse available tutors',
              icon: '🔍',
              interaction: () => setActiveSubFeature('find-tutor')
            },
            {
              id: 'become-tutor',
              name: 'Become Tutor',
              description: 'Start tutoring others',
              icon: '✨',
              interaction: () => setActiveSubFeature('become-tutor')
            }
          ]
        },
        {
          id: 'marketplace-stats',
          name: 'Market Analytics',
          description: 'View trading statistics',
          icon: '📊',
          activeUsers: 12,
          interaction: () => setActiveStation('marketplace-stats')
        }
      ]
    }
  };

  // Get building details from either provided buildings array or interiors data
  const buildingDetails = getBuildingDetails();
  const interior = interiors[buildingId];

  // Check if interior data exists
  if (!interior) return null;

  // Render appropriate content based on the activeStation and buildingId
  const renderActiveContent = () => {
    // Clear active states for the exit function
    const handleExit = () => {
      setActiveStation(null);
      setActiveSubFeature(null);
    };

    // ChatArea handlers
    const handleOpenPDFReader = (pdfUrl: string) => {
      window.open(pdfUrl, '_blank');
    };

    const handleToggleHistoryPanel = () => {
      setIsHistoryPanelOpen(!isHistoryPanelOpen);
    };

    const handleChatSelect = (chat: { id: number; subject: string; title: string; }) => {
      setActiveChat(chat);
    };

    // Render content based on building type
    console.log(`Rendering content for building: ${buildingId} with station: ${activeStation} and subFeature: ${activeSubFeature}`);

    switch (buildingId) {
      case 'arena':
        return (
          <ArenaHub
            onExit={handleExit}
            initialMode={'game'}
            featureId={'practice'}
            subFeatureId={'quick-match'}
          />
        );
      case 'echo-chambers':
        return (
          <EchoChambers
            onExit={handleExit}
            activeStation={activeStation}
            activeSubFeature={activeSubFeature}
          />
        );
      case 'study-centre':
        return (
          <StudyCentre
            onNavigate={handleExit}
            currentUser={user}
          />
        );
      case 'library':
        return (
          <Library
            onExit={handleExit}
            activeStation={activeStation}
            activeSubFeature={activeSubFeature}
          />
        );
      case 'marketplace':
        return (
          <Marketplace
            onExit={handleExit}
            activeStation={activeStation}
            activeSubFeature={activeSubFeature}
          />
        );
      case 'kana-lab':
        return (
          <div className="h-full">
            <ChatArea
              openPDFReader={handleOpenPDFReader}
              toggleHistoryPanel={handleToggleHistoryPanel}
              activeChat={activeChat}
              onChatSelect={handleChatSelect}
            />
          </div>
        );
      default:
        return (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="text-6xl mb-6">🚧</div>
            <h3 className="font-pixel text-primary mb-3 text-xl">Building Under Construction</h3>
            <p className="text-gray-400 mb-8">This feature is coming soon!</p>
            <button
              onClick={handleExit}
              className="px-4 py-2 bg-primary/20 border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors"
            >
              Go Back
            </button>
          </div>
        );
    }
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
        <div className="h-[calc(80vh-65px)]">
          {/* Feature Content */}
          <div className="w-full h-full overflow-y-auto p-6">
            {['arena', 'echo', 'library'].includes(buildingId) && activeStation ? (
              // Specialized component rendering
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
                        {sub.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {sub.description}
                      </p>
                      <button
                        className="mt-4 px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm hover:bg-primary/30 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Set the active sub-feature and then directly trigger screen change
                          if (buildingId === 'arena') {
                            setActiveSubFeature(sub.id);
                            // Force re-render - this is critical for Arena mode to activate
                            setActiveStation(activeStation);
                          } else if (sub.interaction) {
                            sub.interaction();
                          }
                        }}
                      >
                        Enter
                      </button>
                    </div>
                  ))}
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