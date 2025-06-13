import { useEffect, useState } from 'react';

declare global {
  interface Window {
    scrollTimer?: NodeJS.Timeout;
  }
}
import { BrainIcon, BookOpenIcon, TrophyIcon, WalletIcon, UsersIcon, MapIcon, MessageSquareIcon } from 'lucide-react';
export const HudNavigation = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [xp] = useState(247);
  const [coins] = useState(125);
  const [activeSection, setActiveSection] = useState('hero');
  const [isScrolling, setIsScrolling] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = window.scrollY / totalHeight * 100;
      setScrollProgress(progress);

      // Set scrolling state for animations
      setIsScrolling(true);
      clearTimeout(window.scrollTimer);
      window.scrollTimer = setTimeout(() => {
        setIsScrolling(false);
      }, 150);

      // Determine active section based on scroll position
      const sections = ['hero', 'kana', 'knowledge', 'quest', 'arena', 'creator', 'token', 'team', 'institutional', 'roadmap', 'join'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(window.scrollTimer);
    };
  }, []);

  useEffect(() => {
    const storedAvatar = localStorage.getItem('userAvatar');
    const storedDisplayName = localStorage.getItem('userDisplayName');
    if (storedAvatar) {
      setUserAvatar(storedAvatar);
    }
    if (storedDisplayName) {
      setUserDisplayName(storedDisplayName);
    }
  }, []);

  // Main navigation items
  const mainNavItems = [{
    icon: <MessageSquareIcon size={18} />,
    label: 'Kana',
    color: 'from-blue-500 to-cyan-500'
  }, {
    icon: <BrainIcon size={18} />,
    label: 'Knowledge',
    color: 'from-emerald-500 to-green-500'
  }, {
    icon: <BookOpenIcon size={18} />,
    label: 'Quest',
    color: 'from-orange-500 to-yellow-500'
  }, {
    icon: <TrophyIcon size={18} />,
    label: 'Arena',
    color: 'from-red-500 to-orange-500'
  }, {
    icon: <UsersIcon size={18} />,
    label: 'Creator',
    color: 'from-amber-500 to-yellow-500'
  }, {
    icon: <UsersIcon size={18} />,
    label: 'Team',
    color: 'from-pink-500 to-rose-500'
  }];

  // Additional navigation items that might appear in the mobile menu
  const additionalNavItems = [{
    icon: <MapIcon size={18} />,
    label: 'Roadmap',
    color: 'from-teal-500 to-green-500'
  }, {
    icon: <BookOpenIcon size={18} />,
    label: 'Institutional',
    color: 'from-sky-500 to-blue-500'
  }, {
    icon: <UsersIcon size={18} />,
    label: 'Join',
    color: 'from-purple-500 to-pink-500'
  }];

  // Handle nav item click
  const handleNavClick = (section: string) => {
    setActiveSection(section.toLowerCase());
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };

  // Handle logo click to navigate to hero section
  const handleLogoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setActiveSection('hero');
    window.location.href = '#hero';
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };
  return <>
      <header className="fixed top-0 left-0 w-full z-40 bg-dark/80 backdrop-blur-md border-b-2 border-primary/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          {/* Logo - redirects to Hero section */}
          <div className="flex items-center cursor-pointer" onClick={handleLogoClick}>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-tertiary p-0.5 relative overflow-visible">
              <div className="w-full h-full rounded-full bg-dark flex items-center justify-center overflow-hidden">
                <img src="/Screenshot_2025-05-05_141452-removebg-preview.png" alt="Brain Ink Logo" className="w-10 h-10 object-contain" />
              </div>
            </div>
            <span className="font-pixel text-primary text-lg hidden md:block ml-3">
              BRAIN INK
            </span>
          </div>

          {/* Navigation Items - Desktop */}
          <nav className="hidden lg:flex items-center space-x-6 overflow-x-auto py-1">
            {mainNavItems.map((item, index) => {
            const isActive = activeSection === item.label.toLowerCase();
            return <a key={index} href={`#${item.label.toLowerCase()}`} className="flex flex-col items-center group relative" onClick={() => handleNavClick(item.label)}>
                  <div className={`
                    ${isActive ? 'text-primary' : 'text-gray-400'} 
                    group-hover:text-primary transition-colors duration-300
                    ${isActive ? 'scale-110' : 'scale-100'} transform
                  `}>
                    {item.icon}
                    {isActive && <div className="absolute -inset-1 rounded-full bg-gradient-to-r opacity-20 animate-pulse -z-10"></div>}
                  </div>
                  <span className={`
                    text-xs font-pixel transition-all duration-300
                    ${isActive ? 'text-primary' : 'text-gray-400'} 
                    group-hover:text-primary
                  `}>
                    {item.label}
                  </span>
                  <div className={`
                    h-0.5 bg-gradient-to-r ${item.color} rounded-full transition-all duration-300
                    ${isActive ? 'w-full opacity-100' : 'w-0 opacity-0'} 
                    group-hover:w-full group-hover:opacity-75
                    mt-1
                  `}></div>
                </a>;
          })}
            
            {/* Token Button */}
            <a href="#token" className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-md font-pixel text-dark text-sm flex items-center space-x-2 hover:brightness-110 transition-all duration-300 shadow-glow" onClick={() => handleNavClick('Token')}>
              <WalletIcon size={16} />
              <span>TOKEN</span>
            </a>
          </nav>

          {/* Progress and Stats */}
          <div className="hidden md:flex items-center space-x-6 ml-4">
            {/* Level Progress */}
            <div className="flex items-center">
              {(userAvatar || userDisplayName) ? (
                <div className="flex items-center space-x-2 mr-2">
                  {userAvatar && <span className="text-2xl leading-none">{userAvatar}</span>} {/* Display avatar as emoji */}
                  {userDisplayName && <span className="text-sm font-pixel text-primary">{userDisplayName}</span>}
                </div>
              ) : (
                <span className="text-xs font-pixel text-primary mr-2">
                  LVL 5
                </span>
              )}
              <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden relative">
                <div className={`absolute inset-0 bg-primary/20 rounded-full ${isScrolling ? 'animate-pulse' : ''}`}></div>
                <div className="h-full bg-gradient-to-r from-primary via-tertiary to-secondary rounded-full relative" style={{
                width: `${scrollProgress}%`,
                transition: 'width 0.3s ease-out'
              }}>
                  <div className="absolute inset-0 bg-white/20 rounded-full"></div>
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="shimmer-effect"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* XP */}
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center mr-1 relative">
                <span className="text-dark text-xs font-bold">XP</span>
                <div className="absolute inset-0 rounded-full bg-secondary/30 animate-ping opacity-50"></div>
              </div>
              <span className="text-xs font-pixel text-secondary">{xp}</span>
            </div>
            
            {/* Coins */}
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center mr-1 relative">
                <span className="text-dark text-xs font-bold">$</span>
                <div className="absolute inset-0 rounded-full bg-yellow-400/30 animate-ping opacity-50"></div>
              </div>
              <span className="text-xs font-pixel text-yellow-400">
                {coins}
              </span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden text-primary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <div className={`w-6 h-0.5 bg-primary mb-1 transition-all ${mobileMenuOpen ? 'transform rotate-45 translate-y-1.5' : ''}`}></div>
            <div className={`w-6 h-0.5 bg-primary mb-1 transition-all ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></div>
            <div className={`w-6 h-0.5 bg-primary transition-all ${mobileMenuOpen ? 'transform -rotate-45 -translate-y-1.5' : ''}`}></div>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`
          lg:hidden bg-dark/90 border-b-2 border-primary/30 overflow-hidden transition-all duration-300
          ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="px-4 py-2 flex flex-col space-y-2 max-w-7xl mx-auto">
            {/* Stats in mobile view */}
            <div className="flex items-center justify-between py-2 border-b border-primary/20">
              <div className="flex items-center">
                <span className="text-xs font-pixel text-primary mr-2">
                  LVL 5
                </span>
                <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-primary via-tertiary to-secondary rounded-full relative" style={{
                  width: `${scrollProgress}%`
                }}>
                    <div className="absolute inset-0 bg-white/20 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center mr-1">
                    <span className="text-dark text-xs font-bold">XP</span>
                  </div>
                  <span className="text-xs font-pixel text-secondary">{xp}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center mr-1">
                    <span className="text-dark text-xs font-bold">$</span>
                  </div>
                  <span className="text-xs font-pixel text-yellow-400">{coins}</span>
                </div>
              </div>
            </div>
            
            {/* Main Navigation Items */}
            {mainNavItems.map((item, index) => {
            const isActive = activeSection === item.label.toLowerCase();
            return <a key={index} href={`#${item.label.toLowerCase()}`} className="flex items-center space-x-3 py-2" onClick={() => handleNavClick(item.label)}>
                  <div className={`
                    p-2 rounded-full bg-gray-800/60 
                    ${isActive ? 'text-primary bg-gray-700/80' : 'text-gray-400'}
                  `}>
                    {item.icon}
                  </div>
                  <span className={`
                    font-pixel ${isActive ? 'text-primary' : 'text-gray-400'}
                  `}>
                    {item.label}
                  </span>
                  {isActive && <div className="ml-auto">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    </div>}
                </a>;
          })}
            
            {/* Token Button in Mobile */}
            <a href="#token" className="flex items-center space-x-3 py-2 my-1 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-md px-3" onClick={() => handleNavClick('Token')}>
              <WalletIcon size={18} className="text-dark" />
              <span className="font-pixel text-dark font-bold">TOKEN</span>
            </a>
            
            {/* Additional Items */}
            <div className="pt-2 border-t border-primary/20 mt-1">
              {additionalNavItems.map((item, index) => {
              const isActive = activeSection === item.label.toLowerCase();
              return <a key={index} href={`#${item.label.toLowerCase()}`} className="flex items-center space-x-3 py-2" onClick={() => handleNavClick(item.label)}>
                    <div className={`
                      p-2 rounded-full bg-gray-800/60 
                      ${isActive ? 'text-primary bg-gray-700/80' : 'text-gray-400'}
                    `}>
                      {item.icon}
                    </div>
                    <span className={`
                      font-pixel ${isActive ? 'text-primary' : 'text-gray-400'}
                    `}>
                      {item.label}
                    </span>
                    {isActive && <div className="ml-auto">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      </div>}
                  </a>;
            })}
            </div>
          </div>
        </div>
      </header>

      {/* Background pattern */}
      <div className="magic-pattern"></div>
    </>;
};
