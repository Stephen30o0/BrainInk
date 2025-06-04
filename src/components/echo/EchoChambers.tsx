import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowLeft, Users, MessageCircle, MessageSquare, Zap } from 'lucide-react';

interface EchoChamberProps {
  onExit: () => void;
  activeStation: string | null;
  activeSubFeature: string | null;
}

type EchoScreen = 'hub' | 'debate-hall' | 'discussion-rooms' | 'think-tank' | 
  'live-debate' | 'debate-challenge' | 'science-room' | 'philosophy-room' | 'arts-room';

export const EchoChambers: React.FC<EchoChamberProps> = ({
  onExit,
  activeStation,
  activeSubFeature
}) => {
  const [currentScreen, setCurrentScreen] = useState<EchoScreen>(
    (activeSubFeature as EchoScreen) || (activeStation as EchoScreen) || 'hub'
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  // Hub screen (main screen)
  const renderHubScreen = () => (
    <motion.div
      className="h-full flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="bg-dark/50 border-b border-primary/30 p-4 flex justify-between items-center"
        variants={itemVariants}
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={20} className="text-teal-400" />
          <h2 className="text-teal-400 font-pixel text-lg">Echo Chambers</h2>
        </div>
        <button onClick={onExit} className="p-2 text-gray-400 hover:text-primary">
          <X size={20} />
        </button>
      </motion.div>

      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div className="grid grid-cols-1 gap-4 mb-8" variants={itemVariants}>
          <button
            onClick={() => setCurrentScreen('debate-hall')}
            className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-500/30 rounded-lg p-6 text-left transition-all hover:scale-[1.02] flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-2xl">🎭</div>
            <div className="flex-1">
              <h3 className="font-pixel text-orange-400 mb-1">Debate Hall</h3>
              <p className="text-gray-400 text-xs">Engage in structured debates on various topics</p>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Users size={12} />
              42
            </div>
          </button>

          <button
            onClick={() => setCurrentScreen('discussion-rooms')}
            className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 rounded-lg p-6 text-left transition-all hover:scale-[1.02] flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl">💬</div>
            <div className="flex-1">
              <h3 className="font-pixel text-blue-400 mb-1">Discussion Rooms</h3>
              <p className="text-gray-400 text-xs">Join themed rooms for casual discussions</p>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Users size={12} />
              38
            </div>
          </button>

          <button
            onClick={() => setCurrentScreen('think-tank')}
            className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 hover:from-purple-500/30 hover:to-violet-500/30 border border-purple-500/30 rounded-lg p-6 text-left transition-all hover:scale-[1.02] flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-2xl">💡</div>
            <div className="flex-1">
              <h3 className="font-pixel text-purple-400 mb-1">Think Tank</h3>
              <p className="text-gray-400 text-xs">Collaborate on solving complex problems</p>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Users size={12} />
              15
            </div>
          </button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h3 className="font-pixel text-teal-400 mb-3">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { title: 'Climate Change Solutions', type: 'Debate', participants: 8, time: '2 hours ago' },
              { title: 'Ethics of AI Development', type: 'Discussion', participants: 12, time: '4 hours ago' },
              { title: 'Urban Planning Challenge', type: 'Think Tank', participants: 5, time: '1 day ago' }
            ].map((activity, index) => (
              <div key={index} className="bg-dark/30 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                  {activity.type === 'Debate' && '🎭'}
                  {activity.type === 'Discussion' && '💬'}
                  {activity.type === 'Think Tank' && '💡'}
                </div>
                <div className="flex-1">
                  <h4 className="text-primary text-sm">{activity.title}</h4>
                  <div className="flex text-xs text-gray-400 gap-2">
                    <span>{activity.type}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Users size={10} />
                      {activity.participants}
                    </div>
                    <span>•</span>
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  // Render debate hall view
  const renderDebateHallScreen = () => (
    <motion.div 
      className="h-full flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="bg-dark/50 border-b border-primary/30 p-4 flex justify-between items-center"
        variants={itemVariants}
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={20} className="text-orange-400" />
          <h2 className="text-orange-400 font-pixel text-lg">Debate Hall</h2>
        </div>
        <button onClick={() => setCurrentScreen('hub')} className="p-2 text-gray-400 hover:text-primary">
          <ArrowLeft size={20} />
        </button>
      </motion.div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" variants={itemVariants}>
          <button 
            onClick={() => setCurrentScreen('live-debate')} 
            className="bg-gradient-to-br from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 border border-red-500/30 rounded-lg p-5 text-center transition-all hover:scale-[1.02] flex flex-col items-center"
          >
            <div className="w-16 h-16 mb-3 rounded-full bg-red-500/20 flex items-center justify-center text-3xl">
              🎭
            </div>
            <h3 className="font-pixel text-red-400 mb-1">Live Debate</h3>
            <p className="text-gray-400 text-xs">Join an ongoing debate session</p>
          </button>
          
          <button 
            onClick={() => setCurrentScreen('debate-challenge')} 
            className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/30 rounded-lg p-5 text-center transition-all hover:scale-[1.02] flex flex-col items-center"
          >
            <div className="w-16 h-16 mb-3 rounded-full bg-amber-500/20 flex items-center justify-center text-3xl">
              ⚔️
            </div>
            <h3 className="font-pixel text-amber-400 mb-1">Challenge</h3>
            <p className="text-gray-400 text-xs">Challenge someone to a formal debate</p>
          </button>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <h3 className="font-pixel text-orange-400 mb-3">Active Debates</h3>
          <div className="space-y-4">
            {[
              { title: 'Should AI Development Be Regulated?', participants: 12, status: 'Live', timeRemaining: '18:24' },
              { title: 'Universal Basic Income: Pro vs Con', participants: 8, status: 'Voting', timeRemaining: '05:13' },
              { title: 'Space Exploration: Public vs Private', participants: 10, status: 'Scheduled', timeRemaining: '2h 30m' }
            ].map((debate, index) => (
              <div key={index} className="bg-dark/30 border border-primary/20 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-primary font-pixel">{debate.title}</h4>
                  <div className={`px-2 py-1 rounded text-xs font-medium
                    ${debate.status === 'Live' ? 'bg-green-500/20 text-green-400' :
                      debate.status === 'Voting' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'}`}
                  >
                    {debate.status}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    <span>{debate.participants} participants</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {debate.status !== 'Scheduled' && (
                      <span className="animate-pulse text-amber-400">● </span>
                    )}
                    <span>{debate.timeRemaining}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  // Render discussion rooms view
  const renderDiscussionRoomsScreen = () => (
    <motion.div 
      className="h-full flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="bg-dark/50 border-b border-primary/30 p-4 flex justify-between items-center"
        variants={itemVariants}
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-blue-400" />
          <h2 className="text-blue-400 font-pixel text-lg">Discussion Rooms</h2>
        </div>
        <button onClick={() => setCurrentScreen('hub')} className="p-2 text-gray-400 hover:text-primary">
          <ArrowLeft size={20} />
        </button>
      </motion.div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" variants={itemVariants}>
          <button 
            onClick={() => setCurrentScreen('science-room')} 
            className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 rounded-lg p-4 text-center transition-all hover:scale-[1.02]"
          >
            <div className="text-3xl mb-2">🔬</div>
            <h3 className="font-pixel text-blue-400 mb-1">Science & Tech</h3>
            <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <Users size={12} />
              14 active
            </div>
          </button>
          
          <button 
            onClick={() => setCurrentScreen('philosophy-room')} 
            className="bg-gradient-to-br from-indigo-500/20 to-violet-500/20 hover:from-indigo-500/30 hover:to-violet-500/30 border border-indigo-500/30 rounded-lg p-4 text-center transition-all hover:scale-[1.02]"
          >
            <div className="text-3xl mb-2">🧠</div>
            <h3 className="font-pixel text-indigo-400 mb-1">Philosophy & Ethics</h3>
            <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <Users size={12} />
              8 active
            </div>
          </button>
          
          <button 
            onClick={() => setCurrentScreen('arts-room')} 
            className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 hover:from-pink-500/30 hover:to-rose-500/30 border border-pink-500/30 rounded-lg p-4 text-center transition-all hover:scale-[1.02]"
          >
            <div className="text-3xl mb-2">🎨</div>
            <h3 className="font-pixel text-pink-400 mb-1">Arts & Culture</h3>
            <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <Users size={12} />
              16 active
            </div>
          </button>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <h3 className="font-pixel text-blue-400 mb-3">Popular Topics</h3>
          <div className="space-y-3">
            {[
              { title: 'Quantum Computing Applications', category: 'Science & Tech', users: 28 },
              { title: 'Existentialism in Modern Society', category: 'Philosophy & Ethics', users: 15 },
              { title: 'Digital Art Revolution', category: 'Arts & Culture', users: 22 }
            ].map((topic, index) => (
              <div key={index} className="bg-dark/30 border border-primary/20 rounded-lg p-3 hover:bg-dark/40 transition-colors cursor-pointer">
                <h4 className="font-pixel text-primary text-sm mb-1">{topic.title}</h4>
                <div className="flex justify-between text-xs text-gray-400">
                  <span className="px-2 py-0.5 bg-primary/10 rounded-full">{topic.category}</span>
                  <div className="flex items-center gap-1">
                    <Users size={10} />
                    {topic.users}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  // Render think tank view
  const renderThinkTankScreen = () => (
    <motion.div 
      className="h-full flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="bg-dark/50 border-b border-primary/30 p-4 flex justify-between items-center"
        variants={itemVariants}
      >
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-purple-400" />
          <h2 className="text-purple-400 font-pixel text-lg">Think Tank</h2>
        </div>
        <button onClick={() => setCurrentScreen('hub')} className="p-2 text-gray-400 hover:text-primary">
          <ArrowLeft size={20} />
        </button>
      </motion.div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div variants={itemVariants} className="mb-6">
          <h3 className="font-pixel text-purple-400 mb-3">Current Projects</h3>
          <div className="space-y-4">
            {[
              { title: 'Urban Mobility Solutions', description: 'Developing innovative transportation models for future cities', members: 12, progress: 65 },
              { title: 'Education Reimagined', description: 'Designing new educational frameworks for the AI era', members: 20, progress: 30 },
              { title: 'Healthcare Accessibility', description: 'Creating solutions for equitable healthcare access globally', members: 15, progress: 45 }
            ].map((project, index) => (
              <div key={index} className="bg-dark/30 border border-primary/20 rounded-lg p-4 hover:bg-dark/40 transition-colors cursor-pointer">
                <h4 className="font-pixel text-primary mb-1">{project.title}</h4>
                <p className="text-gray-400 text-sm mb-3">{project.description}</p>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Users size={12} />
                    {project.members} collaborators
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-purple-400">{project.progress}%</div>
                    <div className="w-24 h-2 bg-dark/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-pixel text-purple-400">Join a Project</h3>
            <button className="text-xs text-purple-400 border border-purple-500/30 rounded-full px-3 py-1 hover:bg-purple-500/10">
              + Create New
            </button>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Renewable Energy Initiative', category: 'Environment', members: 8, difficulty: 'Medium' },
              { title: 'Digital Literacy Program', category: 'Education', members: 5, difficulty: 'Easy' },
              { title: 'Mental Health Platform', category: 'Healthcare', members: 10, difficulty: 'Hard' }
            ].map((project, index) => (
              <div key={index} className="bg-dark/30 border border-primary/20 rounded-lg p-3 hover:bg-dark/40 transition-colors cursor-pointer">
                <div className="flex justify-between items-start">
                  <h4 className="font-pixel text-primary text-sm">{project.title}</h4>
                  <span className={`text-xs rounded px-2 py-0.5 ${
                    project.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                    project.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>{project.difficulty}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span className="px-2 py-0.5 bg-primary/10 rounded-full">{project.category}</span>
                  <div className="flex items-center gap-1">
                    <Users size={10} />
                    {project.members}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  // Generic placeholder for screens not fully implemented yet
  const renderPlaceholderScreen = (title: string, emoji: string) => (
    <motion.div
      className="h-full flex flex-col items-center justify-center p-8 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="text-6xl mb-6" variants={itemVariants}>
        {emoji}
      </motion.div>
      <motion.h3 className="font-pixel text-primary mb-3 text-xl" variants={itemVariants}>
        {title}
      </motion.h3>
      <motion.p className="text-gray-400 mb-8" variants={itemVariants}>
        This feature is coming soon!
      </motion.p>
      <motion.button
        onClick={() => {
          if (currentScreen === 'live-debate' || currentScreen === 'debate-challenge') {
            setCurrentScreen('debate-hall');
          } else if (currentScreen.includes('room')) {
            setCurrentScreen('discussion-rooms');
          } else {
            setCurrentScreen('hub');
          }
        }}
        className="px-4 py-2 bg-primary/20 border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors"
        variants={itemVariants}
      >
        Go Back
      </motion.button>
    </motion.div>
  );

  // Render appropriate content based on current screen
  const renderContent = () => {
    switch (currentScreen) {
      case 'hub':
        return renderHubScreen();
      case 'debate-hall':
        return renderDebateHallScreen();
      case 'discussion-rooms':
        return renderDiscussionRoomsScreen();
      case 'think-tank':
        return renderThinkTankScreen();
      case 'live-debate':
        return renderPlaceholderScreen('Live Debate', '🎭');
      case 'debate-challenge':
        return renderPlaceholderScreen('Debate Challenge', '⚔️');
      case 'science-room':
        return renderPlaceholderScreen('Science & Tech Room', '🔬');
      case 'philosophy-room':
        return renderPlaceholderScreen('Philosophy & Ethics Room', '🧠');
      case 'arts-room':
        return renderPlaceholderScreen('Arts & Culture Room', '🎨');
      default:
        return renderHubScreen();
    }
  };

  return renderContent();
};
