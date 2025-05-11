import React from 'react';
import { User, Medal, Sparkles, BookOpen, Trophy, Users, MessageSquare, Bell, Brain, Wallet, Calendar, Settings } from 'lucide-react';
interface HUDButton {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  onClick: () => void;
  notification?: number;
}
interface HUDPanel {
  id: string;
  title: string;
  content: React.ReactNode;
  position: 'left' | 'right' | 'top' | 'bottom';
}
export const GameHUD = ({
  activeButton,
  setActiveButton,
  onPanelToggle
}: {
  activeButton: string | null;
  setActiveButton: (id: string | null) => void;
  onPanelToggle: (panel: string) => void;
}) => {
  const buttons: HUDButton[] = [{
    id: 'profile',
    icon: <User size={20} />,
    label: 'Profile',
    color: '#00a8ff',
    position: 'top-left',
    onClick: () => onPanelToggle('profile')
  }, {
    id: 'achievements',
    icon: <Medal size={20} />,
    label: 'Achievements',
    color: '#ffd700',
    position: 'top-right',
    onClick: () => onPanelToggle('achievements'),
    notification: 2
  }, {
    id: 'modules',
    icon: <BookOpen size={20} />,
    label: 'Modules',
    color: '#4db6ac',
    position: 'left',
    onClick: () => onPanelToggle('modules')
  }, {
    id: 'leaderboard',
    icon: <Trophy size={20} />,
    label: 'Leaderboard',
    color: '#ef5350',
    position: 'right',
    onClick: () => onPanelToggle('leaderboard')
  }, {
    id: 'messages',
    icon: <MessageSquare size={20} />,
    label: 'Messages',
    color: '#7986cb',
    position: 'bottom-right',
    onClick: () => onPanelToggle('messages'),
    notification: 3
  }, {
    id: 'kana',
    icon: <Brain size={20} />,
    label: 'Ask KANA',
    color: '#9575cd',
    position: 'bottom',
    onClick: () => onPanelToggle('kana')
  }];
  const getButtonPosition = (position: HUDButton['position']) => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return '';
    }
  };
  return <div className="fixed inset-0 pointer-events-none">
      {/* Floating Buttons */}
      {buttons.map(button => <button key={button.id} onClick={() => {
      setActiveButton(activeButton === button.id ? null : button.id);
      button.onClick();
    }} className={`
            absolute ${getButtonPosition(button.position)}
            pointer-events-auto
            px-4 py-2 rounded-lg
            backdrop-blur-md
            transition-all duration-300
            group
            ${activeButton === button.id ? 'bg-white/20 scale-105' : 'bg-dark/50 hover:bg-white/10'}
          `} style={{
      border: `2px solid ${button.color}`,
      boxShadow: `0 0 20px ${button.color}40`
    }}>
          <div className="flex items-center gap-2">
            <div className="relative" style={{
          color: button.color
        }}>
              {button.icon}
              {button.notification && <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                  {button.notification}
                </div>}
            </div>
            <span className={`
                text-sm font-pixel
                transition-all duration-300
                ${activeButton === button.id ? 'text-white' : 'text-gray-400'}
                group-hover:text-white
              `}>
              {button.label}
            </span>
          </div>
          <div className={`
              absolute inset-0 opacity-0 group-hover:opacity-100
              transition-opacity duration-300 pointer-events-none
            `} style={{
        background: `radial-gradient(circle at center, ${button.color}10 0%, transparent 70%)`
      }} />
        </button>)}
      {/* Fixed Panels */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        <div className="bg-dark/50 backdrop-blur-md rounded-lg p-4 border border-primary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px]">
              <div className="w-full h-full rounded-full bg-dark flex items-center justify-center">
                <span className="text-primary font-medium">JP</span>
              </div>
            </div>
            <div>
              <div className="text-white font-pixel text-sm">johndoe54</div>
              <div className="flex items-center gap-2">
                <Medal size={14} className="text-yellow-400" />
                <span className="text-xs text-gray-400">Silver II</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Daily Quests Panel */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <div className="bg-dark/50 backdrop-blur-md rounded-lg p-4 border border-primary/30 w-64">
          <h3 className="font-pixel text-primary text-sm mb-4">Daily Quests</h3>
          <div className="space-y-3">
            {[{
            label: 'Complete 2 quizzes',
            progress: 1,
            total: 2
          }, {
            label: 'Win 1 debate',
            progress: 0,
            total: 1
          }, {
            label: 'Help a friend',
            progress: 1,
            total: 1
          }].map((quest, i) => <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{quest.label}</span>
                  <span className="text-gray-400">
                    {quest.progress}/{quest.total}
                  </span>
                </div>
                <div className="h-2 bg-dark rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{
                width: `${quest.progress / quest.total * 100}%`
              }} />
                </div>
              </div>)}
          </div>
        </div>
      </div>
      {/* My Courses Panel */}
      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <div className="bg-dark/50 backdrop-blur-md rounded-lg p-4 border border-primary/30 w-64">
          <h3 className="font-pixel text-primary text-sm mb-4">My Courses</h3>
          <div className="space-y-3">
            {[{
            name: 'Math Basics',
            progress: 65,
            icon: '📘'
          }, {
            name: 'Geography 101',
            progress: 80,
            icon: '🌍'
          }, {
            name: 'Physics',
            progress: 45,
            icon: '⚡'
          }].map((course, i) => <div key={i}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{course.icon}</span>
                  <span className="text-gray-300 text-sm">{course.name}</span>
                  <span className="text-gray-400 text-xs ml-auto">
                    {course.progress}%
                  </span>
                </div>
                <div className="h-2 bg-dark rounded-full overflow-hidden">
                  <div className="h-full bg-secondary transition-all" style={{
                width: `${course.progress}%`
              }} />
                </div>
              </div>)}
          </div>
        </div>
      </div>
    </div>;
};