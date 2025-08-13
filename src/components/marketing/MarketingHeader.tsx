import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const NavItem: React.FC<{ to: string; label: string }> = ({ to, label }) => {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active ? 'text-blue-700' : 'text-slate-700 hover:text-blue-700'
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
      className={`fixed top-0 inset-x-0 z-50 transition-all ${
        scrolled ? 'bg-white/80 backdrop-blur border-b border-slate-200' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-px shadow-glow">
              <div className="h-full w-full rounded-[10px] bg-white grid place-items-center">
                <span className="text-lg font-black text-blue-700">BI</span>
              </div>
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
              BrainInk
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <NavItem to="/" label="Home" />
            <NavItem to="/pricing" label="Pricing" />
            <NavItem to="/help" label="Help Center" />
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/get-started"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm hover:opacity-95"
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
          <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-2">
            <Link to="/" className="py-2 text-slate-700" onClick={() => setOpen(false)}>Home</Link>
            <Link to="/pricing" className="py-2 text-slate-700" onClick={() => setOpen(false)}>Pricing</Link>
            <Link to="/help" className="py-2 text-slate-700" onClick={() => setOpen(false)}>Help Center</Link>
            <Link
              to="/get-started"
              onClick={() => setOpen(false)}
              className="mt-2 px-4 py-2 rounded-lg text-center text-white bg-gradient-to-r from-blue-600 to-indigo-600"
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
