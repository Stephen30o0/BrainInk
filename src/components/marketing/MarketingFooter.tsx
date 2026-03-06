import React from 'react';
import { Link } from 'react-router-dom';

const MarketingFooter = () => {
  return (
    <footer className="bg-[#FAFAF8] border-t border-stone-200/60 py-10 sm:py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12">
        {/* Brand Column */}
        <div className="col-span-2 md:col-span-2">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <div className="w-6 h-6 bg-stone-900 rounded flex items-center justify-center text-white text-xs font-bold">
              B
            </div>
            <span className="font-bold text-stone-900 text-base sm:text-lg">BrainInk</span>
          </div>
          <p className="text-stone-500 text-sm max-w-sm leading-relaxed mb-6">
            AI-powered grading and learning tools built in Rwanda for African classrooms.
          </p>
          <div className="flex gap-4 text-stone-400">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://github.com/Stephen30o0/BrainInk" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>

        {/* Platform Column */}
        <div>
          <h4 className="font-bold text-stone-900 mb-4 sm:mb-6 text-sm sm:text-base">Platform</h4>
          <ul className="space-y-3 sm:space-y-4 text-sm text-stone-500">
            <li><Link to="/" className="hover:text-blue-600 transition-colors">Features</Link></li>
            <li><Link to="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link></li>
            <li><Link to="/get-started" className="hover:text-blue-600 transition-colors">Enterprise</Link></li>
            <li><Link to="/help" className="hover:text-blue-600 transition-colors">Security</Link></li>
          </ul>
        </div>

        {/* Company Column */}
        <div>
          <h4 className="font-bold text-stone-900 mb-4 sm:mb-6 text-sm sm:text-base">Company</h4>
          <ul className="space-y-3 sm:space-y-4 text-sm text-stone-500">
            <li><Link to="/" className="hover:text-blue-600 transition-colors">About</Link></li>
            <li><Link to="/help" className="hover:text-blue-600 transition-colors">Help Center</Link></li>
            <li><Link to="/contact" className="hover:text-blue-600 transition-colors">Contact</Link></li>
            <li><a href="mailto:hello@brainink.com" className="hover:text-blue-600 transition-colors">Email Us</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 sm:mt-12 md:mt-16 pt-6 sm:pt-8 border-t border-stone-100 flex flex-col md:flex-row justify-between items-center text-xs text-stone-400 font-mono gap-4 md:gap-0">
        <div>&copy; {new Date().getFullYear()} BrainInk. All rights reserved.</div>
        <div className="flex gap-4 sm:gap-6">
          <Link to="#" className="hover:text-stone-600 transition-colors">Privacy Policy</Link>
          <Link to="#" className="hover:text-stone-600 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
