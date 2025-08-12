import React from 'react';
import { Link } from 'react-router-dom';

export const MarketingFooter: React.FC = () => {
  return (
    <footer className="mt-24 bg-gradient-to-b from-white to-slate-50 border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8 text-sm">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-px">
                <div className="h-full w-full rounded-[10px] bg-white grid place-items-center">
                  <span className="text-lg font-black text-blue-700">BI</span>
                </div>
              </div>
              <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">BrainInk</span>
            </div>
            <p className="text-slate-600 max-w-md">Learning AI that helps during the work, not after. Try BrainInk in your next study session today.</p>
            <div className="mt-4 flex gap-3">
              <Link to="/signup" className="px-3 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 text-xs">Start for free</Link>
              <Link to="/pricing" className="px-3 py-2 rounded-md bg-slate-900 text-white hover:opacity-90 text-xs">See pricing</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Use Cases</h4>
            <ul className="space-y-2 text-slate-600">
              <li>Sales</li>
              <li>Support</li>
              <li>Consulting</li>
              <li>Recruiting</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Enterprise</h4>
            <ul className="space-y-2 text-slate-600">
              <li>Security</li>
              <li>ROI Calculator</li>
              <li>Book a demo</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Resources</h4>
            <ul className="space-y-2 text-slate-600">
              <li><Link to="/pricing">Pricing</Link></li>
              <li>Manifesto</li>
              <li>Careers</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Support</h4>
            <ul className="space-y-2 text-slate-600">
              <li><Link to="/help">Help Center</Link></li>
              <li>Contact us</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 pt-6 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between">
          <p>© {new Date().getFullYear()} BrainInk. All rights reserved.</p>
          <div className="flex gap-4 mt-2 md:mt-0">
            <Link to="#">Privacy Policy</Link>
            <Link to="#">Terms of Service</Link>
            <Link to="#">Marketing</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
