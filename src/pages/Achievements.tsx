import { useState } from 'react';
import { Trophy, Star, Target, Medal, Filter, ChevronDown, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  category: 'quizzing' | 'tournaments' | 'gamified' | 'social' | 'courses' | 'customization' | 'events' | 'wallet' | 'progress' | 'hidden';
  dateCompleted?: string;
}

export default function Achievements() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'all' | 'quizzing' | 'tournaments' | 'gamified' | 'social' | 'courses' | 'customization' | 'events' | 'wallet' | 'progress' | 'hidden'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rarity' | 'progress' | 'recent'>('rarity');
  const [showFilters, setShowFilters] = useState(false);

  const achievements: Achievement[] = [
    // QUIZZING
    {
      id: '1',
      name: 'Quiz Novice',
      desc: 'Complete your first quiz',
      icon: '📝',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: {
        xp: 50,
        tokens: 10
      },
      completed: true,
      category: 'quizzing',
      dateCompleted: '2024-05-15'
    },
    {
      id: '2',
      name: 'Quiz Master',
      desc: 'Get a perfect score on 5 quizzes',
      icon: '🎯',
      progress: 3,
      total: 5,
      rarity: 'rare',
      reward: {
        xp: 200,
        tokens: 50
      },
      completed: false,
      category: 'quizzing'
    },
    {
      id: '3',
      name: 'Quiz Creator',
      desc: 'Create a quiz that is taken by 10 users',
      icon: '✏️',
      progress: 6,
      total: 10,
      rarity: 'epic',
      reward: {
        xp: 300,
        tokens: 100
      },
      completed: false,
      category: 'quizzing'
    },
    {
      id: '4',
      name: 'Quiz Champion',
      desc: 'Complete 100 quizzes with at least 80% score',
      icon: '🏆',
      progress: 47,
      total: 100,
      rarity: 'legendary',
      reward: {
        xp: 1000,
        tokens: 500
      },
      completed: false,
      category: 'quizzing'
    },
    
    // TOURNAMENTS
    {
      id: '5',
      name: 'Tournament Participant',
      desc: 'Join your first tournament',
      icon: '🎮',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: {
        xp: 50,
        tokens: 15
      },
      completed: true,
      category: 'tournaments',
      dateCompleted: '2024-05-10'
    },
    {
      id: '6',
      name: 'Top Contender',
      desc: 'Reach the finals in any tournament',
      icon: '🥈',
      progress: 0,
      total: 1,
      rarity: 'rare',
      reward: {
        xp: 300,
        tokens: 75
      },
      completed: false,
      category: 'tournaments'
    },
    {
      id: '7',
      name: 'Tournament Victor',
      desc: 'Win first place in a tournament',
      icon: '🏅',
      progress: 0,
      total: 1,
      rarity: 'epic',
      reward: {
        xp: 500,
        tokens: 200
      },
      completed: false,
      category: 'tournaments'
    },
    
    // GAMIFIED LEARNING
    {
      id: '8',
      name: 'Game Starter',
      desc: 'Complete your first learning game',
      icon: '🎲',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: {
        xp: 50,
        tokens: 10
      },
      completed: true,
      category: 'gamified',
      dateCompleted: '2024-05-08'
    },
    {
      id: '9',
      name: 'Game Enthusiast',
      desc: 'Play 10 different learning games',
      icon: '🎯',
      progress: 4,
      total: 10,
      rarity: 'rare',
      reward: {
        xp: 200,
        tokens: 50
      },
      completed: false,
      category: 'gamified'
    },
    {
      id: '10',
      name: 'Brain Challenger',
      desc: 'Complete a difficult learning game with a perfect score',
      icon: '🧠',
      progress: 0,
      total: 1,
      rarity: 'epic',
      reward: {
        xp: 400,
        tokens: 150
      },
      completed: false,
      category: 'gamified'
    },
    
    // SOCIAL & SQUAD
    {
      id: '11',
      name: 'Team Player',
      desc: 'Join a squad',
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
      dateCompleted: '2024-04-10'
    },
    {
      id: '12',
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
      id: '13',
      name: 'Squad Leader',
      desc: 'Lead your squad to victory in a team challenge',
      icon: '👑',
      progress: 0,
      total: 1,
      rarity: 'epic',
      reward: {
        xp: 400,
        tokens: 200
      },
      completed: false,
      category: 'social'
    },
    
    // COURSES & TEACHING
    {
      id: '14',
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
      category: 'courses',
      dateCompleted: '2024-03-15'
    },
    {
      id: '15',
      name: 'Knowledge Seeker',
      desc: 'Complete 5 different courses',
      icon: '🔍',
      progress: 3,
      total: 5,
      rarity: 'rare',
      reward: {
        xp: 200,
        tokens: 100
      },
      completed: false,
      category: 'courses'
    },
    {
      id: '16',
      name: 'Teaching Assistant',
      desc: 'Help 5 students complete a course',
      icon: '👨‍🏫',
      progress: 2,
      total: 5,
      rarity: 'epic',
      reward: {
        xp: 300,
        tokens: 150
      },
      completed: false,
      category: 'courses'
    },
    {
      id: '17',
      name: 'Academic Excellence',
      desc: 'Complete 25 courses with at least 90% score',
      icon: '🎓',
      progress: 5,
      total: 25,
      rarity: 'legendary',
      reward: {
        xp: 1000,
        tokens: 500
      },
      completed: false,
      category: 'courses'
    },

    // CUSTOMIZATION
    {
      id: '18',
      name: 'Personal Touch',
      desc: 'Customize your profile for the first time',
      icon: '🎨',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: {
        xp: 25,
        tokens: 10
      },
      completed: true,
      category: 'customization',
      dateCompleted: '2024-04-05'
    },
    {
      id: '19',
      name: 'Avatar Collector',
      desc: 'Unlock 10 different avatar options',
      icon: '👤',
      progress: 5,
      total: 10,
      rarity: 'rare',
      reward: {
        xp: 100,
        tokens: 75
      },
      completed: false,
      category: 'customization'
    },
    {
      id: '20',
      name: 'Theme Master',
      desc: 'Create a custom theme that is used by 50 users',
      icon: '💅',
      progress: 12,
      total: 50,
      rarity: 'epic',
      reward: {
        xp: 300,
        tokens: 150
      },
      completed: false,
      category: 'customization'
    },

    // EVENTS
    {
      id: '21',
      name: 'Event Attendee',
      desc: 'Attend your first virtual event',
      icon: '📅',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: {
        xp: 50,
        tokens: 25
      },
      completed: true,
      category: 'events',
      dateCompleted: '2024-05-02'
    },
    {
      id: '22',
      name: 'Event Host',
      desc: 'Host a virtual event with at least 10 attendees',
      icon: '🎤',
      progress: 0,
      total: 10,
      rarity: 'rare',
      reward: {
        xp: 200,
        tokens: 100
      },
      completed: false,
      category: 'events'
    },
    {
      id: '23',
      name: 'Conference Speaker',
      desc: 'Present at a major virtual conference',
      icon: '💬',
      progress: 0,
      total: 1,
      rarity: 'legendary',
      reward: {
        xp: 750,
        tokens: 500
      },
      completed: false,
      category: 'events'
    },

    // WALLET & BLOCKCHAIN
    {
      id: '24',
      name: 'Wallet Creator',
      desc: 'Create your first blockchain wallet',
      icon: '💰',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: {
        xp: 50,
        tokens: 50
      },
      completed: true,
      category: 'wallet',
      dateCompleted: '2024-03-25'
    },
    {
      id: '25',
      name: 'Token Collector',
      desc: 'Collect 1000 INK tokens',
      icon: '🪙',
      progress: 425,
      total: 1000,
      rarity: 'rare',
      reward: {
        xp: 300,
        tokens: 100
      },
      completed: false,
      category: 'wallet'
    },
    {
      id: '26',
      name: 'NFT Creator',
      desc: 'Mint your first educational NFT',
      icon: '🎭',
      progress: 0,
      total: 1,
      rarity: 'epic',
      reward: {
        xp: 500,
        tokens: 250
      },
      completed: false,
      category: 'wallet'
    },

    // PROGRESS & DEDICATION
    {
      id: '27',
      name: 'Daily Learner',
      desc: 'Log in for 7 consecutive days',
      icon: '📆',
      progress: 7,
      total: 7,
      rarity: 'common',
      reward: {
        xp: 70,
        tokens: 35
      },
      completed: true,
      category: 'progress',
      dateCompleted: '2024-04-22'
    },
    {
      id: '28',
      name: 'Study Streak',
      desc: 'Complete learning activities for 30 consecutive days',
      icon: '🔥',
      progress: 14,
      total: 30,
      rarity: 'rare',
      reward: {
        xp: 300,
        tokens: 150
      },
      completed: false,
      category: 'progress'
    },
    {
      id: '29',
      name: 'Brain Dedication',
      desc: 'Spend 100 hours in learning activities',
      icon: '⏱️',
      progress: 46,
      total: 100,
      rarity: 'epic',
      reward: {
        xp: 750,
        tokens: 350
      },
      completed: false,
      category: 'progress'
    },
    {
      id: '30',
      name: 'Learning Legend',
      desc: 'Complete 1000 learning activities of any kind',
      icon: '👑',
      progress: 214,
      total: 1000,
      rarity: 'legendary',
      reward: {
        xp: 2000,
        tokens: 1000
      },
      completed: false,
      category: 'progress'
    },

    // HIDDEN & RARE
    {
      id: '31',
      name: 'Easter Egg Hunter',
      desc: 'Find a hidden feature in the platform',
      icon: '🥚',
      progress: 100,
      total: 100,
      rarity: 'rare',
      reward: {
        xp: 100,
        tokens: 50
      },
      completed: true,
      category: 'hidden',
      dateCompleted: '2024-05-01'
    },
    {
      id: '32',
      name: 'Night Owl',
      desc: 'Study for 2 hours between 12 AM and 5 AM',
      icon: '🦉',
      progress: 85,
      total: 120,
      rarity: 'rare',
      reward: {
        xp: 150,
        tokens: 75
      },
      completed: false,
      category: 'hidden'
    },
    {
      id: '33',
      name: 'Lucky Number',
      desc: 'Score exactly 777 points in a game',
      icon: '🎰',
      progress: 0,
      total: 1,
      rarity: 'epic',
      reward: {
        xp: 777,
        tokens: 77
      },
      completed: false,
      category: 'hidden'
    },
    {
      id: '34',
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
      category: 'hidden',
      dateCompleted: '2024-03-01'
    },
    
    // ADDITIONAL ACHIEVEMENTS TO REACH 50
    {
      id: '35',
      name: 'Quiz Streak',
      desc: 'Complete 10 quizzes in a row with at least 80% score',
      icon: '🔄',
      progress: 6,
      total: 10,
      rarity: 'rare',
      reward: {
        xp: 250,
        tokens: 125
      },
      completed: false,
      category: 'quizzing'
    },
    {
      id: '36',
      name: 'Tournament Organizer',
      desc: 'Create and host a tournament with at least 8 participants',
      icon: '📋',
      progress: 0,
      total: 8,
      rarity: 'epic',
      reward: {
        xp: 400,
        tokens: 200
      },
      completed: false,
      category: 'tournaments'
    },
    {
      id: '37',
      name: 'Game Designer',
      desc: 'Create a learning game that is played by 25 users',
      icon: '🎲',
      progress: 0,
      total: 25,
      rarity: 'epic',
      reward: {
        xp: 500,
        tokens: 250
      },
      completed: false,
      category: 'gamified'
    },
    {
      id: '38',
      name: 'Battle Royale Champion',
      desc: 'Win a learning battle royale game',
      icon: '⚔️',
      progress: 0,
      total: 1,
      rarity: 'legendary',
      reward: {
        xp: 750,
        tokens: 500
      },
      completed: false,
      category: 'gamified'
    },
    {
      id: '39',
      name: 'Social Butterfly',
      desc: 'Connect with 25 other students',
      icon: '🦋',
      progress: 12,
      total: 25,
      rarity: 'rare',
      reward: {
        xp: 200,
        tokens: 100
      },
      completed: false,
      category: 'social'
    },
    {
      id: '40',
      name: 'Course Creator',
      desc: 'Create a course that is taken by 50 students',
      icon: '📚',
      progress: 8,
      total: 50,
      rarity: 'legendary',
      reward: {
        xp: 1000,
        tokens: 500
      },
      completed: false,
      category: 'courses'
    },
    {
      id: '41',
      name: 'Badge Designer',
      desc: 'Create a custom badge that is approved by admins',
      icon: '🏷️',
      progress: 0,
      total: 1,
      rarity: 'epic',
      reward: {
        xp: 350,
        tokens: 175
      },
      completed: false,
      category: 'customization'
    },
    {
      id: '42',
      name: 'Event Series',
      desc: 'Attend 10 events in the same series',
      icon: '🎪',
      progress: 4,
      total: 10,
      rarity: 'epic',
      reward: {
        xp: 400,
        tokens: 200
      },
      completed: false,
      category: 'events'
    },
    {
      id: '43',
      name: 'Blockchain Scholar',
      desc: 'Complete the blockchain fundamentals course',
      icon: '⛓️',
      progress: 75,
      total: 100,
      rarity: 'rare',
      reward: {
        xp: 300,
        tokens: 150
      },
      completed: false,
      category: 'wallet'
    },
    {
      id: '44',
      name: 'Weekly Warrior',
      desc: 'Complete at least 20 learning activities every week for a month',
      icon: '📊',
      progress: 2,
      total: 4,
      rarity: 'epic',
      reward: {
        xp: 600,
        tokens: 300
      },
      completed: false,
      category: 'progress'
    },
    {
      id: '45',
      name: 'Secret Society',
      desc: 'Join a hidden study group',
      icon: '🎭',
      progress: 0,
      total: 1,
      rarity: 'epic',
      reward: {
        xp: 500,
        tokens: 250
      },
      completed: false,
      category: 'hidden'
    },
    {
      id: '46',
      name: 'Quiz Creator Elite',
      desc: 'Create 25 quizzes that are taken by at least 10 users each',
      icon: '✨',
      progress: 4,
      total: 25,
      rarity: 'legendary',
      reward: {
        xp: 1250,
        tokens: 625
      },
      completed: false,
      category: 'quizzing'
    },
    {
      id: '47',
      name: 'Global Tournament',
      desc: 'Participate in an international tournament',
      icon: '🌎',
      progress: 0,
      total: 1,
      rarity: 'legendary',
      reward: {
        xp: 800,
        tokens: 400
      },
      completed: false,
      category: 'tournaments'
    },
    {
      id: '48',
      name: 'Friend Referrer',
      desc: 'Refer 5 friends who join the platform',
      icon: '👋',
      progress: 2,
      total: 5,
      rarity: 'rare',
      reward: {
        xp: 250,
        tokens: 125
      },
      completed: false,
      category: 'social'
    },
    {
      id: '49',
      name: 'Coding Maestro',
      desc: 'Solve 50 coding challenges',
      icon: '💻',
      progress: 22,
      total: 50,
      rarity: 'epic',
      reward: {
        xp: 600,
        tokens: 300
      },
      completed: false,
      category: 'courses'
    },
    {
      id: '50',
      name: 'Brain Legend',
      desc: 'Unlock 40 other achievements',
      icon: '🧩',
      progress: 5,
      total: 40,
      rarity: 'legendary',
      reward: {
        xp: 2500,
        tokens: 1000
      },
      completed: false,
      category: 'hidden'
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
    .filter((achievement: Achievement) => 
      (activeCategory === 'all' || achievement.category === activeCategory) &&
      (achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       achievement.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a: Achievement, b: Achievement) => {
      switch (sortBy) {
        case 'rarity':
          const rarityOrder: Record<string, number> = { legendary: 0, epic: 1, rare: 2, common: 3 };
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
    total: 50, // Total number of achievements in the system
    completed: achievements.filter((a: Achievement) => a.completed).length,
    totalXP: achievements.reduce((sum: number, a: Achievement) => sum + (a.completed ? a.reward.xp : 0), 0),
    totalTokens: achievements.reduce((sum: number, a: Achievement) => sum + (a.completed ? a.reward.tokens : 0), 0)
  };

  return (
    <div className="min-h-screen bg-dark p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/townsquare')}
              className="p-2 rounded-lg hover:bg-primary/20 transition-colors"
            >
              <ArrowLeft size={20} className="text-primary" />
            </button>
            <div className="flex items-center gap-3">
              <Trophy size={24} className="text-primary" />
              <h1 className="font-pixel text-2xl text-primary">Achievements</h1>
            </div>
          </div>
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

        {/* Category Filter */}
        {showFilters && (
          <div className="bg-dark/30 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="mb-4">
              <h3 className="font-pixel text-primary mb-2">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  'all',
                  'quizzing',
                  'tournaments',
                  'gamified',
                  'social',
                  'courses',
                  'customization',
                  'events',
                  'wallet',
                  'progress',
                  'hidden'
                ].map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category as 'all' | 'quizzing' | 'tournaments' | 'gamified' | 'social' | 'courses' | 'customization' | 'events' | 'wallet' | 'progress' | 'hidden')}
                    className={`px-3 py-1 rounded-lg text-sm capitalize whitespace-nowrap ${activeCategory === category ? 'bg-primary/20 text-primary' : 'bg-dark/50 text-gray-400 hover:bg-primary/10'}`}
                  >
                    {category === 'gamified' ? 'gamified learning' : 
                     category === 'social' ? 'social & squad' : 
                     category === 'courses' ? 'courses & teaching' : 
                     category === 'customization' ? 'customization' : 
                     category === 'events' ? 'events' : 
                     category === 'wallet' ? 'wallet & blockchain' : 
                     category === 'progress' ? 'progress & dedication' : 
                     category === 'hidden' ? 'hidden & rare' : category}
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
}