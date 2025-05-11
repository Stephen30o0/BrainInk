import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, X, Users } from 'react-feather';

interface Position {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

interface Building {
  id: string;
  name: string;
  color: string;
  size: 'small' | 'medium' | 'large';
  position: Position;
  description: string;
  notification?: number;
  animation: 'pulse' | 'float' | 'glow' | 'bounce' | 'shake';
  icon: string;
}

interface BuildingInteriorProps {
  buildingId: string;
  onExit: () => void;
  buildings: Building[];
}

interface Particle {
  id: number;
  size: number;
  x: number;
  y: number;
  opacity: number;
  speed: number;
  delay: number;
  color: string;
}

interface Connection {
  id: string;
  x1: string;
  y1: string;
  x2: string;
  y2: string;
  color: string;
}

interface InteriorFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  activeUsers?: number;
  subFeatures?: {
    id: string;
    name: string;
    description: string;
    icon: string;
    interaction?: () => void;
  }[];
}

interface Interior {
  title: string;
  description: string;
  color: string;
  activeUsers?: number;
  features: InteriorFeature[];
}

const BuildingInterior = ({
  buildingId,
  onExit,
  buildings
}: BuildingInteriorProps) => {
  const getBuildingDetails = () => {
    const building = buildings.find(b => b.id === buildingId);
    return {
      name: building?.name || 'Unknown Location',
      color: building?.color || '#ffffff',
      icon: building?.icon || '❓'
    };
  };
  const {
    name,
    color,
    icon
  } = getBuildingDetails();
  return <motion.div initial={{
    opacity: 0,
    scale: 0.8
  }} animate={{
    opacity: 1,
    scale: 1
  }} exit={{
    opacity: 0,
    scale: 0.8
  }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative w-4/5 h-4/5 max-w-4xl bg-gray-900 rounded-xl border-2" style={{
      borderColor: color
    }}>
        <div className="absolute top-0 left-0 w-full bg-gray-800 rounded-t-xl px-6 py-4 flex justify-between items-center border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{icon}</span>
            <h2 className="text-xl font-bold text-white">{name}</h2>
          </div>
          <button onClick={onExit} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-all duration-200">
            Exit
          </button>
        </div>
        <div className="p-6 mt-16 text-white">
          <div className="flex items-center justify-center h-full">
            <p className="text-lg text-center text-gray-400">
              Interior content for {name} would go here...
            </p>
          </div>
        </div>
      </div>
    </motion.div>;
};
const interiorData = {
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
        description: 'Jump into a fast-paced knowledge battle',
        icon: '⚡'
      }, {
        id: 'ranked',
        name: 'Ranked Match',
        description: 'Climb the leaderboards in competitive matches',
        icon: '📊'
      }, {
        id: 'custom',
        name: 'Custom Tournament',
        description: 'Create and host your own tournament',
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
        description: 'Practice with KANA in simulated matches',
        icon: '🤖'
      }, {
        id: 'friend-battle',
        name: 'Friend Battle',
        description: 'Challenge a friend to a private match',
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
  'echo-chambers': {
    title: 'Echo Chambers',
    description: 'Engage in intellectual discussions and debates',
    color: '#48dbfb',
    activeUsers: 86,
    features: [{
      id: 'debate-hall',
      name: 'Debate Hall',
      description: 'Participate in structured academic debates',
      icon: '🗣️',
      activeUsers: 42,
      subFeatures: [{
        id: 'live-debate',
        name: 'Live Debate',
        description: 'Join ongoing debates on various topics',
        icon: '🎭'
      }, {
        id: 'debate-tournament',
        name: 'Tournament',
        description: 'Compete in formal debate tournaments',
        icon: '🏆'
      }]
    }, {
      id: 'study-groups',
      name: 'Study Groups',
      description: 'Join or create topic-focused study groups',
      icon: '👥',
      activeUsers: 28,
      subFeatures: [{
        id: 'create-group',
        name: 'Create Group',
        description: 'Start a new study group',
        icon: '✨'
      }, {
        id: 'join-group',
        name: 'Join Group',
        description: 'Browse and join existing groups',
        icon: '🤝'
      }]
    }, {
      id: 'workshops',
      name: 'Workshops',
      description: 'Interactive learning sessions',
      icon: '🔧',
      activeUsers: 16
    }]
  },
  'kana-lab': {
    title: 'K.A.N.A. Lab',
    description: 'Advanced AI-powered learning assistance',
    color: '#6c5ce7',
    activeUsers: 95,
    features: [{
      id: 'ai-tutor',
      name: 'AI Tutor',
      description: 'One-on-one learning with KANA',
      icon: '🤖',
      activeUsers: 45,
      subFeatures: [{
        id: 'question-answering',
        name: 'Ask Questions',
        description: 'Get instant answers to your queries',
        icon: '❓',
        interaction: () => window.location.href = '/chatbot'
      }, {
        id: 'concept-explanation',
        name: 'Learn Concepts',
        description: 'Deep dive into complex topics',
        icon: '📚',
        interaction: () => window.location.href = '/chatbot'
      }]
    }, {
      id: 'study-analysis',
      name: 'Study Analytics',
      description: 'Track your learning progress',
      icon: '📊',
      activeUsers: 32,
      subFeatures: [{
        id: 'progress-tracking',
        name: 'Progress Tracker',
        description: 'View your learning journey',
        icon: '📈'
      }, {
        id: 'skill-assessment',
        name: 'Skill Assessment',
        description: 'Evaluate your knowledge',
        icon: '🎯'
      }]
    }, {
      id: 'research-tools',
      name: 'Research Tools',
      description: 'Advanced learning resources',
      icon: '🔬',
      activeUsers: 18
    }]
  },
  library: {
    title: 'Knowledge Library',
    description: 'Vast collection of learning resources',
    color: '#1dd1a1',
    activeUsers: 73,
    features: [{
      id: 'digital-books',
      name: 'Digital Books',
      description: 'Access thousands of educational materials',
      icon: '📚',
      activeUsers: 38,
      subFeatures: [{
        id: 'textbooks',
        name: 'Textbooks',
        description: 'Academic textbooks and guides',
        icon: '📖'
      }, {
        id: 'research-papers',
        name: 'Research Papers',
        description: 'Academic publications and papers',
        icon: '📑'
      }]
    }, {
      id: 'multimedia',
      name: 'Multimedia Center',
      description: 'Video lectures and interactive content',
      icon: '🎥',
      activeUsers: 25,
      subFeatures: [{
        id: 'video-lectures',
        name: 'Video Lectures',
        description: 'Watch educational content',
        icon: '🎬'
      }, {
        id: 'interactive-simulations',
        name: 'Simulations',
        description: 'Interactive learning experiences',
        icon: '🎮'
      }]
    }, {
      id: 'archives',
      name: 'Archives',
      description: 'Historical knowledge repository',
      icon: '🗄️',
      activeUsers: 10
    }]
  },
  marketplace: {
    title: 'Knowledge Marketplace',
    description: 'Trade and exchange learning resources',
    color: '#feca57',
    activeUsers: 64,
    features: [{
      id: 'resource-exchange',
      name: 'Resource Exchange',
      description: 'Trade study materials with others',
      icon: '🔄',
      activeUsers: 30,
      subFeatures: [{
        id: 'buy-resources',
        name: 'Buy Resources',
        description: 'Purchase learning materials',
        icon: '🛒'
      }, {
        id: 'sell-resources',
        name: 'Sell Resources',
        description: 'Share your study materials',
        icon: '💰'
      }]
    }, {
      id: 'tutoring',
      name: 'Tutoring Services',
      description: 'Find or become a tutor',
      icon: '👩‍🏫',
      activeUsers: 22,
      subFeatures: [{
        id: 'find-tutor',
        name: 'Find Tutor',
        description: 'Browse available tutors',
        icon: '🔍'
      }, {
        id: 'become-tutor',
        name: 'Become Tutor',
        description: 'Start tutoring others',
        icon: '✨'
      }]
    }, {
      id: 'marketplace-stats',
      name: 'Market Analytics',
      description: 'View trading statistics',
      icon: '📊',
      activeUsers: 12
    }]
  }
};
const EnhancedGameEnvironment = () => {
  const [activeBuilding, setActiveBuilding] = useState<string | null>(null);
  const [hoverBuilding, setHoverBuilding] = useState<string | null>(null);
  const [activeStation, setActiveStation] = useState<string | null>(null);
  const [activeSubFeature, setActiveSubFeature] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [time, setTime] = useState<'day' | 'night'>('day');
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0
  });
  const [isMobile, setIsMobile] = useState(false);
  const [interiors, setInteriors] = useState<Record<string, Interior>>(interiorData);
  // Handle viewport size detection
  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
      setIsMobile(window.innerWidth < 768);
    };
    // Initial call
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // Time cycle effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setTime(time === 'day' ? 'night' : 'day');
    }, 60000); // Change every minute
    return () => clearTimeout(timer);
  }, [time]);
  // Get building positions adjusted for mobile
  const getAdjustedPositions = (building: Building) => {
    if (!isMobile) return building.position;
    // On mobile, organize buildings in a more structured grid layout
    const mobilePositions: Record<string, { top?: string; left?: string; right?: string; bottom?: string }> = {
      arena: { top: '20%', left: '30%' },
      'guild-hall': { top: '20%', right: '30%' },
      'echo-chambers': { top: '50%', right: '30%' },
      'kana-lab': { top: '50%', left: '30%' },
      marketplace: { bottom: '20%', left: '30%' },
      library: { bottom: '20%', right: '30%' }
    };
    return mobilePositions[building.id] || building.position;
  };
  // Generate connection lines between buildings - with mobile adjustments
  useEffect(() => {
    const lines: Connection[] = [];
    // Connections depend on screen size
    const connectionPairs = isMobile ?
    // Mobile connections (simplified)
    [['arena', 'guild-hall'], ['guild-hall', 'echo-chambers'], ['echo-chambers', 'library'], ['library', 'marketplace'], ['marketplace', 'kana-lab'], ['kana-lab', 'arena']] :
    // Desktop connections
    [['arena', 'guild-hall'], ['guild-hall', 'echo-chambers'], ['kana-lab', 'library'], ['marketplace', 'kana-lab'], ['library', 'echo-chambers'], ['arena', 'marketplace']];
    connectionPairs.forEach(pair => {
      const buildingA = buildings.find(b => b.id === pair[0]);
      const buildingB = buildings.find(b => b.id === pair[1]);
      if (buildingA && buildingB) {
        // Calculate center positions (approximate based on percentages)
        const getPosition = pos => {
          const result = {
            x: 50,
            y: 50
          }; // Default to center
          if (pos.top) result.y = parseInt(pos.top);else if (pos.bottom) result.y = 100 - parseInt(pos.bottom);
          if (pos.left) result.x = parseInt(pos.left);else if (pos.right) result.x = 100 - parseInt(pos.right);
          return result;
        };
        // Use mobile adjusted positions if needed
        const posA = getPosition(getAdjustedPositions(buildingA));
        const posB = getPosition(getAdjustedPositions(buildingB));
        lines.push({
          id: `${buildingA.id}-${buildingB.id}`,
          x1: `${posA.x}%`,
          y1: `${posA.y}%`,
          x2: `${posB.x}%`,
          y2: `${posB.y}%`,
          color: `${buildingA.color}80`
        });
      }
    });
    setConnections(lines);
  }, [isMobile, viewport]);
  // Generate floating particles - reduce count on mobile
  useEffect(() => {
    const particleCount = isMobile ? 20 : 50;
    const newParticles = Array.from({
      length: particleCount
    }).map((_, i) => ({
      id: i,
      size: Math.random() * (isMobile ? 3 : 4) + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: Math.random() * 0.4 + 0.1,
      speed: Math.random() * 15 + 10,
      delay: Math.random() * 10,
      color: i % 5 === 0 ? '#ff6b6b' : i % 4 === 0 ? '#48dbfb' : i % 3 === 0 ? '#1dd1a1' : i % 2 === 0 ? '#feca57' : '#c8d6e5'
    }));
    setParticles(newParticles);
  }, [isMobile]);
  const buildings: Building[] = [{
    id: 'arena',
    name: 'Battle Arena',
    icon: '🏆',
    color: '#ff6b6b',
    size: 'large',
    position: {
      top: '25%',
      left: '22%'
    },
    description: 'Challenge others in knowledge battles and tournaments. Prove your expertise and win rewards!',
    notification: 2,
    animation: 'pulse'
  }, {
    id: 'echo-chambers',
    name: 'Echo Chambers',
    icon: '🗣️',
    color: '#48dbfb',
    size: 'medium',
    position: {
      top: '35%',
      right: '22%'
    },
    description: 'Join thought-provoking discussions and debates on various topics. Share your perspectives!',
    animation: 'float'
  }, {
    id: 'kana-lab',
    name: 'K.A.N.A. Lab',
    icon: '🧪',
    color: '#6c5ce7',
    size: 'large',
    position: {
      top: '60%',
      left: '28%'
    },
    description: 'Access cutting-edge AI assistance for your academic pursuits and research needs.',
    notification: 1,
    animation: 'glow'
  }, {
    id: 'library',
    name: 'Library',
    icon: '📚',
    color: '#1dd1a1',
    size: 'medium',
    position: {
      bottom: '25%',
      right: '25%'
    },
    description: 'Explore a vast collection of digital learning resources and rare knowledge artifacts.',
    animation: 'float'
  }, {
    id: 'marketplace',
    name: 'Marketplace',
    icon: '🏪',
    color: '#feca57',
    size: 'small',
    position: {
      bottom: '38%',
      left: '18%'
    },
    description: 'Trade, purchase or sell valuable learning materials and digital goods.',
    animation: 'bounce'
  }, {
    id: 'guild-hall',
    name: 'Guild Hall',
    icon: '⚔️',
    color: '#d881f7',
    size: 'medium',
    position: {
      top: '28%',
      left: '55%'
    },
    description: 'Join specialized study groups and skill guilds. Team up with like-minded learners!',
    notification: 3,
    animation: 'shake'
  }];
  const getBuildingSize = (size: 'small' | 'medium' | 'large') => {
    // Smaller on mobile, regular sizes on larger screens
    if (isMobile) {
      switch (size) {
        case 'small':
          return 'w-16 h-16';
        case 'medium':
          return 'w-20 h-20';
        case 'large':
          return 'w-24 h-24';
      }
    } else {
      switch (size) {
        case 'small':
          return 'w-24 h-24 md:w-28 md:h-28';
        case 'medium':
          return 'w-28 h-28 md:w-36 md:h-36';
        case 'large':
          return 'w-32 h-32 md:w-44 md:h-44';
      }
    }
  };
  const getAnimationClass = (animation: 'pulse' | 'float' | 'glow' | 'bounce' | 'shake') => {
    switch (animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'float':
        return 'animate-float';
      case 'glow':
        return 'animate-glow';
      case 'bounce':
        return 'animate-bounce';
      case 'shake':
        return 'animate-shake';
      default:
        return '';
    }
  };
  // Handle fog movement
  const [fogPosition, setFogPosition] = useState({
    x: 0,
    y: 0
  });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth * 20;
      const y = e.clientY / window.innerHeight * 20;
      setFogPosition({
        x,
        y
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  const handleBuildingClick = (buildingId: string) => {
    setActiveBuilding(buildingId);
    setActiveStation(null);
    setActiveSubFeature(null);
  };
  const handleFeatureClick = (featureId: string) => {
    setActiveStation(featureId);
    setActiveSubFeature(null);
  };
  const handleSubFeatureClick = (subFeatureId: string) => {
    setActiveSubFeature(subFeatureId);
    const feature = interiors[activeBuilding!]?.features.find(f => f.id === activeStation);
    const subFeature = feature?.subFeatures?.find(sf => sf.id === subFeatureId);
    if (subFeature?.interaction) {
      subFeature.interaction();
    }
  };
  return <div className={`relative w-full h-[calc(100vh-4rem)] overflow-hidden ${time === 'day' ? 'bg-gradient-to-b from-blue-900 to-indigo-900' : 'bg-gradient-to-b from-gray-900 to-blue-900'}`}>
      {/* Mobile mode indicator */}
      {isMobile && <div className="absolute top-4 left-4 z-50 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1">
          <button className="text-xs text-white flex items-center" onClick={() => setIsMobile(!isMobile)} // Toggle for testing
      >
            <span className="mr-1">📱</span> Mobile View
          </button>
        </div>}

      {/* Stars (only at night) - fewer on mobile */}
      {time === 'night' && <div className="absolute inset-0 z-0">
          {Array.from({
        length: isMobile ? 50 : 100
      }).map((_, i) => <div key={`star-${i}`} className="absolute rounded-full bg-white" style={{
        width: Math.random() * 2 + 1 + 'px',
        height: Math.random() * 2 + 1 + 'px',
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        opacity: Math.random() * 0.8 + 0.2,
        animation: `twinkle ${Math.random() * 3 + 2}s infinite ${Math.random() * 2}s`
      }} />)}
        </div>}

      {/* Time indicator */}
      <div className="absolute top-4 right-4 z-10">
        <div className={`w-8 h-8 rounded-full ${time === 'day' ? 'bg-yellow-300' : 'bg-blue-200'} flex items-center justify-center`}>
          <span>{time === 'day' ? '☀️' : '🌙'}</span>
        </div>
      </div>

      {/* Background grid */}
      <div className="absolute inset-0 z-0" style={{
      backgroundImage: `linear-gradient(to right, ${time === 'day' ? 'rgba(255,255,255,0.1)' : 'rgba(0,144,255,0.1)'} 1px, transparent 1px), 
             linear-gradient(to bottom, ${time === 'day' ? 'rgba(255,255,255,0.1)' : 'rgba(0,144,255,0.1)'} 1px, transparent 1px)`,
      backgroundSize: '80px 80px',
      transform: `translate(${fogPosition.x}px, ${fogPosition.y}px)`,
      transition: 'transform 0.5s ease-out'
    }} />

      {/* Moving fog effect */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {Array.from({
        length: 3
      }).map((_, i) => <div key={`fog-${i}`} className="absolute w-full h-full opacity-30" style={{
        backgroundImage: `radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        transform: `scale(${1.5 + i * 0.3}) translate(${fogPosition.x * (i + 1)}px, ${fogPosition.y * (i + 1)}px)`,
        transition: 'transform 0.8s ease-out',
        top: `${i * 10}%`,
        left: `${i * 5}%`
      }} />)}
      </div>

      {/* Floating particles */}
      {particles.map(particle => <motion.div key={`particle-${particle.id}`} className="absolute rounded-full z-10" style={{
      width: `${particle.size}px`,
      height: `${particle.size}px`,
      backgroundColor: particle.color,
      left: `${particle.x}%`,
      top: `${particle.y}%`,
      opacity: particle.opacity
    }} animate={{
      y: ['0%', '-100%'],
      x: ['0%', `${Math.random() * 20 - 10}%`, `${Math.random() * 40 - 20}%`, `${Math.random() * 20 - 10}%`, '0%']
    }} transition={{
      duration: particle.speed,
      repeat: Infinity,
      delay: particle.delay,
      ease: 'linear',
      times: [0, 0.25, 0.5, 0.75, 1]
    }} />)}

      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {connections.map(line => <g key={line.id}>
            <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke={line.color} strokeWidth="2" strokeDasharray="8,8" filter="url(#glow)">
              <animate attributeName="stroke-dashoffset" from="0" to="16" dur="1s" repeatCount="indefinite" />
            </line>

            {/* Traveling dot on the line */}
            <circle r="4" fill="#fff">
              <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
              <animateMotion dur="3s" repeatCount="indefinite" path={`M${line.x1} ${line.y1} L ${line.x2} ${line.y2}`} />
            </circle>
          </g>)}
      </svg>

      {/* Buildings */}
      {buildings.map(building => <motion.div key={building.id} className={`
            absolute ${getBuildingSize(building.size)}
            transform -translate-x-1/2 -translate-y-1/2
            cursor-pointer z-20
          `} style={{
      ...getAdjustedPositions(building) // Use responsive positions
    }} initial={{
      scale: 0.9,
      opacity: 0
    }} animate={{
      scale: hoverBuilding === building.id ? 1.1 : 1,
      opacity: 1,
      y: hoverBuilding === building.id ? isMobile ? -5 : -10 : 0
    }} transition={{
      type: 'spring',
      stiffness: 300,
      damping: 20,
      delay: Math.random() * 0.5
    }} onClick={() => handleBuildingClick(building.id)} onMouseEnter={() => setHoverBuilding(building.id)} onMouseLeave={() => setHoverBuilding(null)} whileHover={{
      scale: 1.1,
      y: isMobile ? -5 : -10
    }}>
          {/* Building structure */}
          <div className={`
              relative w-full h-full rounded-xl
              ${getAnimationClass(building.animation)}
              backdrop-blur-md
              border-2 transition-all duration-300
              flex flex-col items-center justify-center
              ${activeBuilding === building.id ? 'bg-white/20' : hoverBuilding === building.id ? 'bg-white/15' : 'bg-black/40'}
            `} style={{
        borderColor: building.color,
        boxShadow: `0 0 ${isMobile ? '10px' : '20px'} ${building.color}${hoverBuilding === building.id ? 'aa' : '60'}`
      }}>
            {/* Building icon with glow effect */}
            <div className="relative mb-1 md:mb-2">
              <div className="absolute inset-0 rounded-full blur-md" style={{
            backgroundColor: building.color,
            opacity: 0.7
          }}></div>
              <div className={`text-2xl md:text-4xl z-10 relative ${hoverBuilding === building.id ? 'transform scale-110' : ''}`}>
                {building.icon}
              </div>
            </div>

            <div className="text-center">
              <h3 className={`font-bold ${isMobile ? 'text-xs' : 'text-xs sm:text-sm'}`} style={{
            color: building.color,
            textShadow: `0 0 10px ${building.color}80`
          }}>
                {isMobile && building.name.length > 10 ? building.name.split(' ')[0] // Show only first word on mobile
            : building.name}
              </h3>
            </div>

            {/* Notification badge - smaller on mobile */}
            {building.notification && <motion.div className={`absolute -top-2 -right-2 ${isMobile ? 'w-5 h-5 text-2xs' : 'w-6 h-6 text-xs'} bg-red-500 rounded-full text-white flex items-center justify-center border-2 border-gray-900 shadow-lg`} animate={{
          scale: [1, 1.2, 1]
        }} transition={{
          repeat: Infinity,
          duration: 2,
          repeatType: 'reverse'
        }}>
                {building.notification}
              </motion.div>}
          </div>

          {/* Hover/tap tooltip - positioned differently on mobile */}
          <motion.div className={`
              absolute ${isMobile ? 'top-1/2 left-1/2' : 'top-full left-1/2'} transform -translate-x-1/2 ${isMobile ? '-translate-y-1/2' : 'mt-4'}
              bg-gray-900/90 backdrop-blur-md border-2 rounded-lg p-2 md:p-3
              transition-all duration-300 z-30 ${isMobile ? 'w-40' : 'w-48'}
              shadow-lg
            `} style={{
        borderColor: building.color,
        boxShadow: `0 4px 20px ${building.color}60`,
        display: isMobile && hoverBuilding === building.id ? 'block' : 'auto' // Force display on mobile
      }} initial={{
        opacity: 0,
        y: isMobile ? 0 : -10,
        scale: 0.8
      }} animate={{
        opacity: hoverBuilding === building.id ? 1 : 0,
        y: hoverBuilding === building.id ? 0 : isMobile ? 0 : -10,
        scale: hoverBuilding === building.id ? 1 : 0.8
      }} transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20
      }}>
            <p className="text-white text-xs">
              {isMobile ? building.description.substring(0, 60) + (building.description.length > 60 ? '...' : '') : building.description}
            </p>
          </motion.div>
        </motion.div>)}

      {/* Building Interior Modal */}
      {activeBuilding && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full h-full max-w-7xl bg-dark/95 rounded-lg border-2 border-primary/30 flex flex-col">
            {/* Header */}
            <div className="bg-dark/80 border-b border-primary/20 backdrop-blur-md px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => {
              setActiveBuilding(null);
              setActiveStation(null);
              setActiveSubFeature(null);
            }} className="p-2 rounded-lg hover:bg-primary/20 transition-colors">
                  <ChevronLeft size={24} className="text-primary" />
                </button>
                <div>
                  <h1 className="font-pixel text-xl text-primary">
                    {interiors[activeBuilding]?.title}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Users size={14} />
                    <span>
                      {interiors[activeBuilding]?.activeUsers || 0} active
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => {
            setActiveBuilding(null);
            setActiveStation(null);
            setActiveSubFeature(null);
          }} className="p-2 rounded-lg hover:bg-primary/20 transition-colors">
                <X size={24} className="text-primary" />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Features List */}
              <div className="w-72 border-r border-primary/20 overflow-y-auto">
                {interiors[activeBuilding]?.features.map(feature => <div key={feature.id} className={`p-4 border-b border-primary/10 cursor-pointer transition-all
                      ${activeStation === feature.id ? 'bg-primary/20' : 'hover:bg-primary/10'}`} onClick={() => handleFeatureClick(feature.id)}>
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
                    {/* Feature Content */}
                    <div className="mb-6">
                      <h2 className="font-pixel text-xl mb-2 text-primary">
                        {interiors[activeBuilding]?.features.find(f => f.id === activeStation)?.name}
                      </h2>
                      <p className="text-gray-300">
                        {interiors[activeBuilding]?.features.find(f => f.id === activeStation)?.description}
                      </p>
                    </div>
                    {/* Sub-features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {interiors[activeBuilding]?.features.find(f => f.id === activeStation)?.subFeatures?.map(sub => <div key={sub.id} className={`
                              bg-dark/50 border rounded-lg p-6 transition-all cursor-pointer
                              ${activeSubFeature === sub.id ? 'border-primary scale-105' : 'border-primary/30'}
                              hover:border-primary/50 hover:scale-[1.02]
                            `} onClick={() => handleSubFeatureClick(sub.id)}>
                            <div className="text-3xl mb-3">{sub.icon}</div>
                            <h3 className="font-pixel text-primary mb-2">
                              {sub.name}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {sub.description}
                            </p>
                            <button className="mt-4 px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm hover:bg-primary/30 transition-colors" onClick={(e) => {
                              e.stopPropagation();
                              handleSubFeatureClick(sub.id);
                            }}>
                              Enter
                            </button>
                          </div>)}
                    </div>
                  </div> : <div className="h-full flex items-center justify-center text-gray-400">
                    Select a feature to begin
                  </div>}
              </div>
            </div>
          </div>
        </div>}
      {/* HUD Elements */}
      <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm rounded-lg p-2 border border-white/20 z-30">
        <div className="flex items-center text-white">
          <span className="mr-2 text-xs">World:</span>
          <span className="text-green-400 text-xs font-bold">ONLINE</span>
          <span className="mx-2 text-white/40">|</span>
          <span className="text-xs">Players:</span>
          <span className="text-blue-400 text-xs font-bold ml-1">247</span>
        </div>
      </div>
      {/* Mini map */}
      <div className="absolute bottom-4 right-4 w-32 md:w-40 h-32 md:h-40 bg-black/40 backdrop-blur-sm rounded-lg border border-white/20 p-2 z-30">
        <div className="relative w-full h-full">
          {buildings.map(building => <div key={`map-${building.id}`} className="absolute w-2 h-2 rounded-full" style={{
          backgroundColor: building.color,
          top: building.position.top || (building.position.bottom ? `calc(100% - ${building.position.bottom})` : '50%'),
          left: building.position.left || (building.position.right ? `calc(100% - ${building.position.right})` : '50%'),
          boxShadow: `0 0 4px ${building.color}`
        }} />)}
          <div className="absolute w-3 h-3 rounded-full bg-yellow-400 border-2 border-white animate-pulse" style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }} />
          <div className="absolute bottom-0 left-0 text-gray-400 text-xs">
            Mini Map
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes twinkle {
            0% { opacity: 0.2; }
            50% { opacity: 1; }
            100% { opacity: 0.2; }
          }
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          .animate-glow {
            animation: glow 2s ease-in-out infinite alternate;
          }
          @keyframes glow {
            from { box-shadow: 0 0 10px -5px currentColor; }
            to { box-shadow: 0 0 20px 5px currentColor; }
          }
          .animate-shake {
            animation: shake 4s ease-in-out infinite;
            animation-delay: 2s;
          }
          @keyframes shake {
            0% { transform: rotate(0deg); }
            2% { transform: rotate(2deg); }
            4% { transform: rotate(-2deg); }
            6% { transform: rotate(2deg); }
            8% { transform: rotate(0deg); }
            100% { transform: rotate(0deg); }
          }
        `}
      </style>
    </div>;
};
export default EnhancedGameEnvironment;