import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, BookOpen, Trophy, Users, Search, Bell, Mail, Menu, User, Sparkles, Wallet, Edit3 } from 'lucide-react'; // Added Edit3 for quiz link
import { NotificationsPanel } from '../components/dashboard/NotificationsPanel';
import { MessagesPanel } from '../components/dashboard/MessagesPanel';
import { GameHUD } from '../components/dashboard/GameHUD';
import GameEnvironment from '../components/dashboard/GameEnvironment';
import { ProfilePanel } from '../components/dashboard/panels/ProfilePanel';
import { QuestLogPanel } from '../components/dashboard/panels/QuestLogPanel';
import { InventoryPanel } from '../components/dashboard/panels/InventoryPanel';
import { AchievementsPanel } from '../components/dashboard/panels/AchievementsPanel';
import { FriendsPanel } from '../components/dashboard/panels/FriendsPanel';
import { WalletPanel } from '../components/wallet/WalletPanel';
import { useWallet } from '../components/shared/WalletContext';
import { useNavigate } from 'react-router-dom';

type Section = 'arena' | 'echo' | 'vault' | 'guild' | 'lab' | 'messages' | 'profile' | 'quests' | 'inventory' | 'achievements' | 'friends' | 'quiz';

interface NavItem {
  id: Section;
  label: string;
  icon: React.ReactNode;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

export const TownSquare = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeHUDButton, setActiveHUDButton] = useState<string | null>(null);
  const [activeSidePanel, setActiveSidePanel] = useState<string | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const { balance, isConnected } = useWallet();

  const navItems: NavItem[] = [{
    id: 'profile',
    label: 'Profile',
    icon: <User size={24} />,
    color: '#00a8ff',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-500'
  }, {
    id: 'quests',
    label: 'Quest Log',
    icon: <Sparkles size={24} />,
    color: '#4db6ac',
    gradientFrom: 'from-teal-500',
    gradientTo: 'to-emerald-500'
  }, {
    id: 'inventory',
    label: 'Inventory',
    icon: <BookOpen size={24} />,
    color: '#9575cd',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-pink-500'
  }, {
    id: 'quiz',
    label: 'Math Quiz',
    icon: <Edit3 size={24} />,
    color: '#f59e0b', // amber-500
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-yellow-500'
  }, {
    id: 'achievements',
    label: 'Achievements',
    icon: <Trophy size={24} />,
    color: '#ffb74d',
    gradientFrom: 'from-yellow-500',
    gradientTo: 'to-orange-500'
  }, {
    id: 'friends',
    label: 'Friends',
    icon: <Users size={24} />,
    color: '#ef5350',
    gradientFrom: 'from-red-500',
    gradientTo: 'to-pink-500'
  }, {
    id: 'messages',
    label: 'Messages',
    icon: <Mail size={24} />,
    color: '#7986cb',
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-blue-500'
  }];

  const handlePanelToggle = (panel: string) => {
    switch (panel) {
      case 'notifications':
        setIsNotificationsOpen(!isNotificationsOpen);
        break;
      // Add other panel handlers as needed
    }
  };

  const handleNavItemClick = (item: Section) => {
    if (item === 'messages') {
      navigate('/messages');
    } else if (item === 'achievements') {
      navigate('/achievements');
    } else if (item === 'quiz') {
      navigate('/quiz/math');
    } else {
      setActiveSidePanel(activeSidePanel === item ? null : item);
    }
  };

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-dark/90 backdrop-blur-md border-b border-primary/20 z-50">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-primary hover:text-primary/80" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Brain size={20} className="text-dark" />
              </div>
              <span className="hidden md:block font-pixel text-primary">
                BRAIN INK
              </span>
            </div>
          </div>
          {/* Center section - Search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="w-full relative">
              <input type="text" placeholder="Search knowledge..." className="w-full bg-dark/50 border border-primary/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary" />
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          {/* Right section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="text-primary hover:text-primary/80 relative" onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
                <Bell size={24} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                  3
                </span>
              </button>
              <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px] cursor-pointer hover:from-primary/80 hover:to-secondary/80">
              <div className="w-full h-full rounded-full bg-dark flex items-center justify-center text-primary text-sm">
                JP
              </div>
            </div>
          </div>
          {/* Add this before the profile picture */}
          <div className="relative">
            <button onClick={() => setIsWalletOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors">
              <Wallet size={16} className="text-primary" />
              <span className="text-primary font-pixel text-sm">
                {isConnected ? `${balance} INK` : 'Connect'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Game HUD */}
      <GameHUD activeButton={activeHUDButton} setActiveButton={setActiveHUDButton} onPanelToggle={handlePanelToggle} />

      {/* Sidebar Navigation */}
      <nav className={`fixed left-0 top-16 bottom-0 w-64 bg-dark/90 backdrop-blur-md border-r border-primary/20 transform transition-transform lg:translate-x-0 z-40 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                activeSidePanel === item.id
                  ? `bg-gradient-to-r ${item.gradientFrom} ${item.gradientTo} text-white`
                  : 'hover:bg-primary/10 text-gray-400 hover:text-primary'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
              {activeSidePanel === item.id && <div className="ml-auto w-2 h-2 rounded-full bg-white" />}
            </button>
          ))}
        </div>
        {/* Progress Widget */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary/20">
          <div className="bg-primary/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-primary text-sm font-medium">Level 5</span>
              <span className="text-xs text-primary/60">2,180 XP</span>
            </div>
            <div className="w-full h-2 bg-dark rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </nav>

      {/* Side Panels */}
      <AnimatePresence>
        {activeSidePanel && (
          <motion.div
            key={activeSidePanel} // Ensures AnimatePresence tracks the component correctly
            className="fixed left-64 top-16 bottom-0 w-96 bg-dark/95 border-r border-primary/20 overflow-y-auto z-30"
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: "0%", opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {activeSidePanel === 'profile' && <ProfilePanel />}
            {activeSidePanel === 'quests' && <QuestLogPanel />}
            {activeSidePanel === 'inventory' && <InventoryPanel />}
            {activeSidePanel === 'achievements' && <AchievementsPanel />}
            {activeSidePanel === 'friends' && <FriendsPanel />}
            {activeSidePanel === 'messages' && <MessagesPanel isOpen={true} onClose={() => setActiveSidePanel(null)} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className={`flex-1 pt-16 min-h-screen transition-all duration-300 ${isMobileMenuOpen ? 'ml-64' : 'ml-0'} ${activeSidePanel ? 'lg:ml-[40rem]' : 'lg:ml-64'}`}>
        <GameEnvironment />
      </main>

      {/* Add the WalletPanel */}
      <WalletPanel isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </div>
  );
};