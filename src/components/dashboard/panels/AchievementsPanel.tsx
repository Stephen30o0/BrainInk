import { useState } from 'react';
import { Trophy, Star, Target, Medal } from 'lucide-react';
export const AchievementsPanel = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const achievements = {
    quizzing: [{
      id: '1',
      name: 'First Spark',
      desc: 'Complete your first quiz',
      icon: '🔥',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: '500 XP',
      completed: true
    }, {
      id: '2',
      name: 'Knowledge Seeker',
      desc: 'Finish 10 quizzes',
      icon: '📜',
      progress: 4,
      total: 10,
      rarity: 'common',
      reward: '1,000 XP',
      completed: false
    }, {
      id: '3',
      name: 'Quiz Marathoner',
      desc: 'Complete 50 quizzes in a week',
      icon: '⏱️',
      progress: 12,
      total: 50,
      rarity: 'epic',
      reward: '2,500 XP',
      completed: false
    }, {
      id: '4',
      name: 'Subject Conqueror',
      desc: 'Master all quizzes in one subject',
      icon: '👑',
      progress: 5,
      total: 12,
      rarity: 'legendary',
      reward: '3,000 XP',
      completed: false
    }, {
      id: '5',
      name: 'Nationwide Explorer',
      desc: 'Complete quizzes from 5+ countries',
      icon: '🌎',
      progress: 2,
      total: 5,
      rarity: 'epic',
      reward: '2,000 XP',
      completed: false
    }],
    
    tournaments: [{
      id: '6',
      name: 'First Blood',
      desc: 'Enter your first tournament',
      icon: '🛡️',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: '500 XP',
      completed: true
    }, {
      id: '7',
      name: 'Clash Champion',
      desc: 'Win a tournament',
      icon: '🏆',
      progress: 0,
      total: 1,
      rarity: 'epic',
      reward: '3,500 XP',
      completed: false
    }, {
      id: '8',
      name: 'Streak Breaker',
      desc: 'Win 3 tournaments in a row',
      icon: '🔥',
      progress: 0,
      total: 3,
      rarity: 'legendary',
      reward: '5,000 XP',
      completed: false
    }, {
      id: '9',
      name: 'Underdog Victory',
      desc: 'Win after entering as lowest rank',
      icon: '🦅',
      progress: 0,
      total: 1,
      rarity: 'legendary',
      reward: '4,000 XP',
      completed: false
    }, {
      id: '10',
      name: 'Tournament Organizer',
      desc: 'Host your own event',
      icon: '📝',
      progress: 0,
      total: 1,
      rarity: 'epic',
      reward: '2,500 XP',
      completed: false
    }],
    
    gamified: [{
      id: '11',
      name: 'Quest Initiate',
      desc: 'Complete 1 daily quest',
      icon: '📋',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: '500 XP',
      completed: true
    }, {
      id: '12',
      name: 'Relentless Adventurer',
      desc: 'Complete 50 daily quests',
      icon: '👢',
      progress: 12,
      total: 50,
      rarity: 'epic',
      reward: '2,500 XP',
      completed: false
    }, {
      id: '13',
      name: 'Perfect Week',
      desc: 'Complete all daily quests 7 days straight',
      icon: '📅',
      progress: 3,
      total: 7,
      rarity: 'epic',
      reward: '3,000 XP',
      completed: false
    }, {
      id: '14',
      name: 'Time Traveler',
      desc: 'Log in 100 different days',
      icon: '⌛',
      progress: 17,
      total: 100,
      rarity: 'epic',
      reward: '2,000 XP',
      completed: false
    }, {
      id: '15',
      name: 'XP Grinder',
      desc: 'Earn 1 million XP in a month',
      icon: '📈',
      progress: 250000,
      total: 1000000,
      rarity: 'epic',
      reward: '3,000 XP',
      completed: false
    }],
    
    social: [{
      id: '16',
      name: 'Friend Requester',
      desc: 'Add your first friend',
      icon: '❤️',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: '500 XP',
      completed: true
    }, {
      id: '17',
      name: 'Squad Goals',
      desc: 'Join or form a squad',
      icon: '⛑️',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: '1,000 XP',
      completed: true
    }, {
      id: '18',
      name: 'Debate Star',
      desc: 'Participate in 10 debates',
      icon: '🎤',
      progress: 2,
      total: 10,
      rarity: 'epic',
      reward: '2,500 XP',
      completed: false
    }, {
      id: '19',
      name: 'Squad Slayer',
      desc: 'Win a team tournament',
      icon: '⚔️',
      progress: 0,
      total: 1,
      rarity: 'epic',
      reward: '3,000 XP',
      completed: false
    }, {
      id: '20',
      name: 'Social Butterfly',
      desc: 'Chat with 50 different users',
      icon: '💬',
      progress: 12,
      total: 50,
      rarity: 'epic',
      reward: '2,000 XP',
      completed: false
    }],
    
    courses: [{
      id: '21',
      name: 'Student of the Scroll',
      desc: 'Enroll in a course',
      icon: '📖',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: '500 XP',
      completed: true
    }, {
      id: '22',
      name: 'Path Walker',
      desc: 'Complete a full learning path',
      icon: '🌲',
      progress: 0,
      total: 1,
      rarity: 'epic',
      reward: '2,000 XP',
      completed: false
    }, {
      id: '23',
      name: 'Course Collector',
      desc: 'Enroll in 20+ courses',
      icon: '📚',
      progress: 4,
      total: 20,
      rarity: 'epic',
      reward: '2,000 XP',
      completed: false
    }, {
      id: '24',
      name: 'Verified Creator',
      desc: 'Publish a course',
      icon: '✒️',
      progress: 0,
      total: 1,
      rarity: 'legendary',
      reward: '3,500 XP',
      completed: false
    }, {
      id: '25',
      name: 'Master Mentor',
      desc: 'Get 100 learners on your course',
      icon: '🦉',
      progress: 0,
      total: 100,
      rarity: 'legendary',
      reward: '4,000 XP',
      completed: false
    }],
    
    customization: [{
      id: '26',
      name: 'New Threads',
      desc: 'Change avatar appearance',
      icon: '✨',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: '500 XP',
      completed: true
    }, {
      id: '27',
      name: 'Pixel Pioneer',
      desc: 'Unlock 10 cosmetics',
      icon: '🖌️',
      progress: 5,
      total: 10,
      rarity: 'rare',
      reward: '1,500 XP',
      completed: false
    }, {
      id: '28',
      name: 'Holo Hero',
      desc: 'Summon KANA as companion',
      icon: '📊',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: '1,000 XP',
      completed: true
    }, {
      id: '29',
      name: 'Fashion Sage',
      desc: 'Unlock 50 cosmetics',
      icon: '👔',
      progress: 5,
      total: 50,
      rarity: 'legendary',
      reward: '3,500 XP',
      completed: false
    }, {
      id: '30',
      name: 'Title Collector',
      desc: 'Earn 5 unique titles',
      icon: '🏷️',
      progress: 1,
      total: 5,
      rarity: 'rare',
      reward: '1,500 XP',
      completed: false
    }],
    
    events: [{
      id: '31',
      name: 'Event Attendee',
      desc: 'Join a live learning event',
      icon: '🎉',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: '1,000 XP',
      completed: true
    }, {
      id: '32',
      name: 'Hype Beast',
      desc: 'RSVP to 10 events',
      icon: '📣',
      progress: 3,
      total: 10,
      rarity: 'common',
      reward: '1,000 XP',
      completed: false
    }, {
      id: '33',
      name: 'Festival of Knowledge',
      desc: 'Attend a festival with 1,000+ players',
      icon: '✨',
      progress: 0,
      total: 1,
      rarity: 'epic',
      reward: '3,000 XP',
      completed: false
    }, {
      id: '34',
      name: 'Countdown King/Queen',
      desc: 'Join event at the last second',
      icon: '⏰',
      progress: 0,
      total: 1,
      rarity: 'epic',
      reward: '2,000 XP',
      completed: false
    }, {
      id: '35',
      name: 'Early Bird',
      desc: 'Join event first 5 minutes',
      icon: '🌅',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: '500 XP',
      completed: true
    }],
    
    wallet: [{
      id: '36',
      name: 'First Token',
      desc: 'Earn or receive your first token',
      icon: '💰',
      progress: 100,
      total: 100,
      rarity: 'common',
      reward: '500 XP',
      completed: true
    }, {
      id: '37',
      name: 'Stake Master',
      desc: 'Stake in a tournament',
      icon: '📦',
      progress: 0,
      total: 1,
      rarity: 'rare',
      reward: '1,500 XP',
      completed: false
    }, {
      id: '38',
      name: 'Cash Out',
      desc: 'Withdraw tokens',
      icon: '💎',
      progress: 0,
      total: 1,
      rarity: 'epic',
      reward: '2,000 XP',
      completed: false
    }, {
      id: '39',
      name: 'Crypto Curious',
      desc: 'Read blockchain guide',
      icon: '📃',
      progress: 0,
      total: 1,
      rarity: 'common',
      reward: '1,000 XP',
      completed: false
    }, {
      id: '40',
      name: 'Trader Trailblazer',
      desc: 'Make 5 token transactions',
      icon: '📈',
      progress: 1,
      total: 5,
      rarity: 'epic',
      reward: '2,500 XP',
      completed: false
    }],
    
    progress: [{
      id: '41',
      name: 'Steady Climber',
      desc: 'Advance 3 ranks',
      icon: '⛰️',
      progress: 2,
      total: 3,
      rarity: 'common',
      reward: '1,000 XP',
      completed: false
    }, {
      id: '42',
      name: 'Celestial Aspirant',
      desc: 'Reach Sage rank',
      icon: '👑',
      progress: 0,
      total: 1,
      rarity: 'legendary',
      reward: '5,000 XP',
      completed: false
    }, {
      id: '43',
      name: 'All In',
      desc: 'Spend 100 hours in app',
      icon: '⌚',
      progress: 36,
      total: 100,
      rarity: 'epic',
      reward: '3,000 XP',
      completed: false
    }, {
      id: '44',
      name: 'Ultimate User',
      desc: 'Log in daily for 60 days',
      icon: '💎',
      progress: 14,
      total: 60,
      rarity: 'legendary',
      reward: '4,000 XP',
      completed: false
    }, {
      id: '45',
      name: 'The Long Haul',
      desc: 'Reach 10 million lifetime XP',
      icon: '🚨',
      progress: 750000,
      total: 10000000,
      rarity: 'legendary',
      reward: '4,000 XP',
      completed: false
    }],
    
    hidden: [{
      id: '46',
      name: 'Night Owl',
      desc: 'Log in after 2am local time',
      icon: '🌙',
      progress: 0,
      total: 1,
      rarity: 'common',
      reward: '1,000 XP',
      completed: false
    }, {
      id: '47',
      name: 'Lucky Streak',
      desc: 'Win 5 random draws',
      icon: '🍀',
      progress: 1,
      total: 5,
      rarity: 'rare',
      reward: '1,500 XP',
      completed: false
    }, {
      id: '48',
      name: 'Friendly Fire',
      desc: 'Beat a friend in a quiz',
      icon: '👾',
      progress: 0,
      total: 1,
      rarity: 'common',
      reward: '1,000 XP',
      completed: false
    }, {
      id: '49',
      name: 'Beta Legend',
      desc: 'Used app during prototype phase',
      icon: '🔄',
      progress: 100,
      total: 100,
      rarity: 'epic',
      reward: '3,000 XP',
      completed: true
    }, {
      id: '50',
      name: 'Bug Buster',
      desc: 'Report 3 valid bugs',
      icon: '🐛',
      progress: 1,
      total: 3,
      rarity: 'rare',
      reward: '1,500 XP',
      completed: false
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
          <div className="font-pixel text-primary">10/50</div>
        </div>
        <div className="bg-dark/30 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Star size={14} />
            <span className="text-xs">Points</span>
          </div>
          <div className="font-pixel text-secondary">6,500</div>
        </div>
        <div className="bg-dark/30 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Target size={14} />
            <span className="text-xs">Rank</span>
          </div>
          <div className="font-pixel text-tertiary">#89</div>
        </div>
      </div>
      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
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
            onClick={() => setActiveCategory(category)} 
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