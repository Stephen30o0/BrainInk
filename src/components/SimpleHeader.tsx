import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';

export const SimpleHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle scroll to change header transparency
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLoginDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleSignUpClick = () => {
    // Navigate to signup page
    window.location.href = '/signup';
  };

  const handleLoginTypeClick = (type: 'school' | 'student') => {
    // Navigate to specific login pages
    if (type === 'school') {
      window.location.href = '/school-login';
    } else {
      window.location.href = '/signup'; // Students use signup flow which leads to role selection
    }
    setLoginDropdownOpen(false);
  };

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm' 
        : 'bg-transparent backdrop-blur-none border-b border-white/20 shadow-none'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        
        {/* Logo Section - Left */}
        <div 
          className="flex items-center cursor-pointer group" 
          onClick={handleLogoClick}
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 p-0.5 relative overflow-hidden group-hover:shadow-sm group-hover:shadow-blue-500/10 transition-all duration-300">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              <img 
                src="/Screenshot_2025-05-05_141452-removebg-preview.png" 
                alt="BrainInk Logo" 
                className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-300" 
              />
            </div>
          </div>
          <span className={`font-pixel text-2xl ml-3 transition-colors duration-300 drop-shadow-lg font-light ${
            isScrolled 
              ? 'bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent' 
              : 'bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent'
          }`}>
            Brain Ink
          </span>
        </div>

        {/* Auth Buttons - Right (Desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Login Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
              className={`text-blue-600 font-medium hover:text-blue-700 transition-all duration-300 flex items-center gap-2 px-4 py-2 rounded-lg ${
                !isScrolled ? 'bg-white/90 backdrop-blur-sm shadow-sm' : ''
              }`}
            >
              <span className="font-light">LOGIN</span>
              <ChevronDown size={16} className={`transition-transform duration-300 ${loginDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {loginDropdownOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-md border border-gray-200 py-2 min-w-[140px] z-50">
                <button
                  onClick={() => handleLoginTypeClick('school')}
                  className="w-full px-4 py-2 text-left text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors duration-200 font-light text-sm"
                >
                  School
                </button>
                <button
                  onClick={() => handleLoginTypeClick('student')}
                  className="w-full px-4 py-2 text-left text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors duration-200 font-light text-sm"
                >
                  Students
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={handleSignUpClick}
            className={`text-blue-600 font-medium hover:text-blue-700 transition-all duration-300 px-4 py-2 rounded-lg ${
              !isScrolled ? 'bg-white/90 backdrop-blur-sm shadow-sm' : ''
            }`}
          >
            <span className="font-light">SIGN UP</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={`md:hidden hover:text-cyan-300 transition-colors duration-300 drop-shadow-lg ${
            isScrolled ? 'text-gray-800' : 'text-white'
          }`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg">
          <div className="px-4 py-6 space-y-4">
            {/* Mobile Login Options */}
            <div className="space-y-2">
              <p className="text-slate-600 font-light text-sm">Login As:</p>
              <button
                onClick={() => handleLoginTypeClick('school')}
                className="w-full text-blue-600 font-medium hover:text-blue-700 transition-colors py-2 text-left"
              >
                <span className="font-light">SCHOOL</span>
              </button>
              <button
                onClick={() => handleLoginTypeClick('student')}
                className="w-full text-blue-600 font-medium hover:text-blue-700 transition-colors py-2 text-left"
              >
                <span className="font-light">STUDENTS</span>
              </button>
            </div>
            
            <div className="border-t border-slate-200 pt-4">
              <button
                onClick={handleSignUpClick}
                className="w-full text-blue-600 font-medium hover:text-blue-700 transition-colors py-2 text-left"
              >
                <span className="font-light">SIGN UP</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
