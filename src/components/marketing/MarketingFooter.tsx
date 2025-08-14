import React from 'react';
import { Link } from 'react-router-dom';

export const MarketingFooter: React.FC = () => {
  return (
    <footer className="mt-16 sm:mt-20 md:mt-24 bg-gradient-to-b from-white to-slate-50 border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 text-sm">
          <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <div className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 sm:p-2">
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
              <span className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">BrainInk</span>
            </div>
            <p className="text-slate-600 max-w-md text-sm sm:text-base">Learning AI that helps during the work, not after. Try BrainInk in your next study session today.</p>
            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link to="/signup" className="px-3 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm text-center">Start for free</Link>
              <Link to="/pricing" className="px-3 py-2 rounded-md bg-slate-900 text-white hover:opacity-90 text-xs sm:text-sm text-center">See pricing</Link>
            </div>
          </div>

          <div className="mt-3 sm:mt-0">
            <h4 className="font-semibold text-slate-900 mb-2 sm:mb-3 text-sm sm:text-base">Use Cases</h4>
            <ul className="space-y-1 sm:space-y-2 text-slate-600 text-xs sm:text-sm">
              <li>Sales</li>
              <li>Support</li>
              <li>Consulting</li>
              <li>Recruiting</li>
            </ul>
          </div>
          <div className="mt-3 sm:mt-0">
            <h4 className="font-semibold text-slate-900 mb-2 sm:mb-3 text-sm sm:text-base">Enterprise</h4>
            <ul className="space-y-1 sm:space-y-2 text-slate-600 text-xs sm:text-sm">
              <li>Security</li>
              <li>ROI Calculator</li>
              <li>Book a demo</li>
            </ul>
          </div>
          <div className="mt-3 sm:mt-0">
            <h4 className="font-semibold text-slate-900 mb-2 sm:mb-3 text-sm sm:text-base">Resources</h4>
            <ul className="space-y-1 sm:space-y-2 text-slate-600 text-xs sm:text-sm">
              <li><Link to="/pricing">Pricing</Link></li>
              <li>Manifesto</li>
              <li>Careers</li>
            </ul>
          </div>
          <div className="mt-3 sm:mt-0">
            <h4 className="font-semibold text-slate-900 mb-2 sm:mb-3 text-sm sm:text-base">Support</h4>
            <ul className="space-y-1 sm:space-y-2 text-slate-600 text-xs sm:text-sm">
              <li><Link to="/help">Help Center</Link></li>
              <li>Contact us</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 md:mt-12 border-t border-slate-200 pt-4 sm:pt-6 text-xs sm:text-sm text-slate-500 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
          <p>© {new Date().getFullYear()} BrainInk. All rights reserved.</p>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Link to="#" className="hover:text-slate-700 transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-slate-700 transition-colors">Terms of Service</Link>
            <Link to="#" className="hover:text-slate-700 transition-colors">Marketing</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
