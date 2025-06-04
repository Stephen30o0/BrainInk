import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Send, X } from 'lucide-react';

interface FriendBattleProps {
  onExit: () => void;
  onStartBattle: (settings: BattleSettings) => void;
}

export interface BattleSettings {
  battleType: BattleType;
  subjects: string[];
  invitedFriends: Friend[];
}

type BattleType = '1v1' | '2v2' | '4v4' | 'ffa-3' | 'ffa-4' | 'ffa-6';
type BattleSetupStage = 'type-selection' | 'subject-selection' | 'friend-selection';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'in-game';
  lastSeen?: string;
}

export const FriendBattle: React.FC<FriendBattleProps> = ({ onExit, onStartBattle }) => {
  const [currentStage, setCurrentStage] = useState<BattleSetupStage>('type-selection');
  const [battleSettings, setBattleSettings] = useState<BattleSettings>({
    battleType: '1v1',
    subjects: [],
    invitedFriends: []
  });
  
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
  
  // Mock data - in a real app this would come from API
  const availableSubjects = [
    { id: 'science', name: 'Science', icon: '🔬' },
    { id: 'math', name: 'Mathematics', icon: '🧮' },
    { id: 'literature', name: 'Literature', icon: '📚' },
    { id: 'history', name: 'History', icon: '🏛️' },
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'arts', name: 'Arts', icon: '🎨' },
    { id: 'geography', name: 'Geography', icon: '🌎' },
    { id: 'music', name: 'Music', icon: '🎵' }
  ];
  
  const mockFriends: Friend[] = [
    { id: '1', name: 'BrainMaster99', avatar: '🧠', status: 'online' },
    { id: '2', name: 'QuizWizard', avatar: '🧙‍♂️', status: 'online' },
    { id: '3', name: 'EinsteinJr', avatar: '👨‍🔬', status: 'in-game' },
    { id: '4', name: 'QuantumThinker', avatar: '🔮', status: 'offline', lastSeen: '2 hours ago' },
    { id: '5', name: 'NeuralNinja', avatar: '🥷', status: 'online' },
    { id: '6', name: 'LogicLion', avatar: '🦁', status: 'online' },
    { id: '7', name: 'CodeCrafter', avatar: '👩‍💻', status: 'offline', lastSeen: '1 day ago' },
    { id: '8', name: 'MindMatrix', avatar: '🧩', status: 'in-game' }
  ];
  
  const battleTypes = [
    { id: '1v1', name: '1v1 Duel', description: 'Head-to-head knowledge battle', icon: '⚔️' },
    { id: '2v2', name: '2v2 Team Battle', description: 'Team up with a friend against another duo', icon: '🛡️' },
    { id: '4v4', name: '4v4 Squad Battle', description: 'Form a squad of 4 for a team challenge', icon: '👥' },
    { id: 'ffa-3', name: 'Free-for-All (3)', description: 'Every player for themselves (3 players)', icon: '🔥' },
    { id: 'ffa-4', name: 'Free-for-All (4)', description: 'Every player for themselves (4 players)', icon: '💥' },
    { id: 'ffa-6', name: 'Free-for-All (6)', description: 'Every player for themselves (6 players)', icon: '⚡' }
  ];
  
  const selectBattleType = (type: BattleType) => {
    setBattleSettings(prev => ({ ...prev, battleType: type }));
    setCurrentStage('subject-selection');
  };
  
  const toggleSubject = (subjectId: string) => {
    setBattleSettings(prev => {
      const subjects = prev.subjects.includes(subjectId)
        ? prev.subjects.filter(id => id !== subjectId)
        : [...prev.subjects, subjectId];
      return { ...prev, subjects };
    });
  };
  
  const proceedToFriendSelection = () => {
    if (battleSettings.subjects.length > 0) {
      setCurrentStage('friend-selection');
    }
  };
  
  const toggleFriend = (friend: Friend) => {
    setBattleSettings(prev => {
      const isAlreadyInvited = prev.invitedFriends.some(f => f.id === friend.id);
      const invitedFriends = isAlreadyInvited
        ? prev.invitedFriends.filter(f => f.id !== friend.id)
        : [...prev.invitedFriends, friend];
      return { ...prev, invitedFriends };
    });
  };
  
  const startBattle = () => {
    const requiredFriends = {
      '1v1': 1,
      '2v2': 3,
      '4v4': 7,
      'ffa-3': 2,
      'ffa-4': 3,
      'ffa-6': 5
    }[battleSettings.battleType];
    
    if (battleSettings.invitedFriends.length >= requiredFriends) {
      onStartBattle(battleSettings);
    }
  };
  
  const goBack = () => {
    if (currentStage === 'type-selection') {
      onExit();
    } else if (currentStage === 'subject-selection') {
      setCurrentStage('type-selection');
    } else if (currentStage === 'friend-selection') {
      setCurrentStage('subject-selection');
    }
  };
  
  const renderBattleTypeSelection = () => (
    <motion.div variants={itemVariants}>
      <h3 className="font-pixel text-primary mb-4">Choose Battle Type</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {battleTypes.map(type => (
          <button
            key={type.id}
            onClick={() => selectBattleType(type.id as BattleType)}
            className="bg-dark/30 border border-primary/20 hover:border-primary/50 rounded-lg p-4 flex items-center gap-4 transition-all hover-scale"
          >
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
              {type.icon}
            </div>
            <div className="text-left">
              <h4 className="text-white font-medium">{type.name}</h4>
              <p className="text-gray-400 text-xs">{type.description}</p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
  
  const renderSubjectSelection = () => (
    <motion.div variants={itemVariants}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-pixel text-primary">Select Subjects</h3>
        <p className="text-gray-400 text-sm">{battleSettings.subjects.length} selected</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {availableSubjects.map(subject => {
          const isSelected = battleSettings.subjects.includes(subject.id);
          return (
            <button
              key={subject.id}
              onClick={() => toggleSubject(subject.id)}
              className={`rounded-lg p-4 text-center transition-all hover-scale ${isSelected ? 'bg-primary/20 border border-primary/50' : 'bg-dark/30 border border-primary/20'}`}
            >
              <div className="text-2xl mb-2">{subject.icon}</div>
              <div className={`font-pixel text-sm ${isSelected ? 'text-primary' : 'text-gray-300'}`}>
                {subject.name}
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={proceedToFriendSelection}
          disabled={battleSettings.subjects.length === 0}
          className={`px-6 py-2 rounded-lg font-medium ${battleSettings.subjects.length > 0 ? 'bg-primary text-dark hover:bg-primary/90' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
  
  const renderFriendSelection = () => {
    const battleType = battleTypes.find(t => t.id === battleSettings.battleType);
    const requiredFriends = {
      '1v1': 1,
      '2v2': 3,
      '4v4': 7,
      'ffa-3': 2,
      'ffa-4': 3,
      'ffa-6': 5
    }[battleSettings.battleType];
    
    return (
      <motion.div variants={itemVariants}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-pixel text-primary">Invite Friends</h3>
          <p className="text-gray-400 text-sm">
            {battleSettings.invitedFriends.length}/{requiredFriends} needed for {battleType?.name}
          </p>
        </div>
        
        {battleSettings.invitedFriends.length > 0 && (
          <div className="mb-4 p-3 bg-dark/50 border border-primary/20 rounded-lg">
            <p className="text-gray-300 text-sm mb-2">Selected Friends:</p>
            <div className="flex flex-wrap gap-2">
              {battleSettings.invitedFriends.map(friend => (
                <div 
                  key={friend.id}
                  className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-3 py-1"
                >
                  <span>{friend.avatar}</span>
                  <span className="text-sm text-primary">{friend.name}</span>
                  <button 
                    onClick={() => toggleFriend(friend)}
                    className="text-gray-400 hover:text-primary"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-2 max-h-[400px] overflow-y-auto mb-6">
          {mockFriends
            .filter(f => !battleSettings.invitedFriends.some(invited => invited.id === f.id))
            .map(friend => {
              const statusColor = {
                'online': 'text-green-400',
                'offline': 'text-gray-400',
                'in-game': 'text-blue-400'
              }[friend.status];
              
              return (
                <div 
                  key={friend.id}
                  className="flex items-center justify-between p-3 bg-dark/30 border border-primary/20 rounded-lg hover:bg-dark/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg">{friend.avatar}</span>
                    </div>
                    <div>
                      <h4 className="text-white">{friend.name}</h4>
                      <div className="flex items-center gap-1">
                        <span className={`block w-2 h-2 rounded-full ${statusColor}`}></span>
                        <p className="text-xs text-gray-400">
                          {friend.status === 'offline' ? friend.lastSeen : friend.status}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFriend(friend)}
                    className="px-3 py-1 bg-dark border border-primary/30 rounded text-primary text-xs hover:bg-primary/10 transition-colors"
                  >
                    Invite
                  </button>
                </div>
              );
          })}
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={startBattle}
            disabled={battleSettings.invitedFriends.length < requiredFriends}
            className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${battleSettings.invitedFriends.length >= requiredFriends ? 'bg-primary text-dark hover:bg-primary/90' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
          >
            <Send size={16} />
            Send Invites
          </button>
        </div>
      </motion.div>
    );
  };
  
  // Render content based on current stage
  const renderContent = () => {
    switch (currentStage) {
      case 'type-selection':
        return renderBattleTypeSelection();
      case 'subject-selection':
        return renderSubjectSelection();
      case 'friend-selection':
        return renderFriendSelection();
      default:
        return null;
    }
  };
  
  // Stage indicator
  const renderStageIndicator = () => {
    const stages = [
      { id: 'type-selection', label: 'Battle Type' },
      { id: 'subject-selection', label: 'Subjects' },
      { id: 'friend-selection', label: 'Invite Friends' }
    ];
    
    return (
      <motion.div 
        className="flex justify-between items-center mb-6 bg-dark/30 rounded-lg p-2"
        variants={itemVariants}
      >
        {stages.map((stage, index) => {
          const isCurrent = stage.id === currentStage;
          const isPast = stages.findIndex(s => s.id === currentStage) > index;
          
          return (
            <div 
              key={stage.id}
              className={`flex-1 text-center py-2 rounded ${isCurrent ? 'bg-primary/20 text-primary' : isPast ? 'text-gray-300' : 'text-gray-500'}`}
            >
              <p className="text-sm font-pixel">{stage.label}</p>
            </div>
          );
        })}
      </motion.div>
    );
  };
  
  return (
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
          <Users size={20} className="text-primary" />
          <h2 className="text-primary font-pixel text-lg">Friend Battle</h2>
        </div>
        <button 
          onClick={goBack}
          className="p-2 text-gray-400 hover:text-primary"
        >
          <ArrowLeft size={20} />
        </button>
      </motion.div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        {renderStageIndicator()}
        {renderContent()}
      </div>
    </motion.div>
  );
};
