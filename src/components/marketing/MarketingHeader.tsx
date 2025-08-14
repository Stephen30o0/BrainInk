import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const NavItem: React.FC<{ to: string; label: string }> = ({ to, label }) => {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`px-2 lg:px-3 py-1.5 lg:py-2 rounded-md text-xs lg:text-sm font-medium transition-colors ${active ? 'text-blue-700' : 'text-slate-700 hover:text-blue-700'
        }`}
    >
      {label}
    </Link>
  );
};

export const MarketingHeader: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all ${scrolled ? 'bg-white/80 backdrop-blur border-b border-slate-200' : 'bg-transparent'
        }`}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2">
            <div className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 sm:p-2 shadow-glow">
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain-icon lucide-brain">
                <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
                <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
                <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
                <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
                <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
                <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
                <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
                <path d="M6 18a4 4 0 0 1-1.967-.516" />
                <path d="M19.967 17.484A4 4 0 0 1 18 18" />
              </svg>
            </div>
            <span className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
              Brain Ink
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1">
            <NavItem to="/" label="Home" />
            <NavItem to="/pricing" label="Pricing" />
            <NavItem to="/help" label="Help Center" />
            <NavItem to="/onboarding" label="Onboarding" />
          </nav>
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <Link
              to="/get-started"
              className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm hover:opacity-95"
            >
              Get Started
            </Link>
          </div>
          <button
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 py-2 sm:py-3 flex flex-col gap-1 sm:gap-2">
            <Link to="/" className="py-1.5 sm:py-2 text-sm sm:text-base text-slate-700" onClick={() => setOpen(false)}>Home</Link>
            <Link to="/pricing" className="py-1.5 sm:py-2 text-sm sm:text-base text-slate-700" onClick={() => setOpen(false)}>Pricing</Link>
            <Link to="/help" className="py-1.5 sm:py-2 text-sm sm:text-base text-slate-700" onClick={() => setOpen(false)}>Help Center</Link>
            <Link to="/onboarding" className="py-1.5 sm:py-2 text-sm sm:text-base text-slate-700" onClick={() => setOpen(false)}>Onboarding</Link>
            <Link
              to="/get-started"
              onClick={() => setOpen(false)}
              className="mt-1 sm:mt-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-center text-sm sm:text-base text-white bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default MarketingHeader;
