import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MarketingHeader from '../../components/marketing/MarketingHeader';
import MarketingFooter from '../../components/marketing/MarketingFooter';
import { Search, ArrowUpRight, Layers, Lock, Scan, BarChart3, PlaneTakeoff } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '../../components/marketing/ScrollReveal';

const gridBg: React.CSSProperties = {
  backgroundSize: '40px 40px',
  backgroundImage: 'radial-gradient(circle, #000000 1px, transparent 1px)',
  opacity: 0.03,
};

export const HelpCenterPage: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [barHeights, setBarHeights] = useState([0, 0, 0, 0]);

  useEffect(() => {
    setTimeout(() => setBarHeights([40, 75, 90, 60]), 100);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-[#1D1D1F]">
      <MarketingHeader />
      <div className="grain-overlay" />

      <div className="flex-grow relative overflow-x-hidden pt-24">
        {/* Background decorations */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 dot-grid-bg opacity-25" />
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-3xl opacity-40 animate-blob-drift" />
        </div>

        <div className="relative max-w-[1440px] mx-auto px-6 py-12 lg:px-16 lg:py-20 flex flex-col gap-12">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-6 w-6 rounded bg-black flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-mono text-xs font-medium tracking-wider text-stone-500 uppercase">BrainInk Knowledge Base v2.4</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-stone-900 mb-6">Help Center</h1>
              <p className="text-xl text-stone-500 leading-relaxed font-light">Answers to common questions about BrainInk grading, dashboards, privacy, and school rollout.</p>
            </div>
            <div className="w-full md:w-auto flex flex-col gap-2">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  className="w-full md:w-80 bg-white/80 hover:bg-white border border-stone-200 focus:border-blue-500 rounded-2xl py-3 pl-12 pr-4 outline-none transition-all shadow-sm hover:shadow-md text-sm placeholder-stone-400"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-blue-500 transition-colors" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-stone-100 px-2 py-0.5 rounded text-[10px] text-stone-400 font-mono border border-stone-200">⌘K</div>
              </div>
            </div>
          </header>



          {/* Decorative image strip */}
          <div className="relative rounded-2xl overflow-hidden group">
            <div className="aspect-[21/6]">
              <img src="/images/brainink-help.png" alt="BrainInk Help Center" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAF8]/40 to-transparent" />
              <div className="absolute bottom-4 left-6 font-mono text-[10px] text-white/70 uppercase tracking-widest">BrainInk Knowledge Base</div>
            </div>
          </div>

          {/* Bento grid */}
          <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {/* Getting Started - large card */}
            <div className="group relative rounded-[2rem] bg-white border border-stone-200 p-8 flex flex-col justify-between overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-400 row-span-2">
              <div className="absolute top-0 right-0 p-6 opacity-30 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-6 h-6 text-stone-900" />
              </div>
              <div className="relative z-10">
                <div className="section-tag mb-6">
                  <span>Start Here</span>
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-stone-900 mb-4">Getting started <span className="text-stone-400 font-normal">(teachers)</span></h2>
                <p className="text-stone-500 leading-relaxed">Create a school account, add your classes, and upload a sample rubric. You can scan handwritten papers or upload PDFs/images for grading.</p>
              </div>
              <div className="mt-12 relative h-64 w-full bg-stone-50 rounded-2xl border border-stone-100 overflow-hidden flex items-center justify-center">
                <div className="absolute inset-x-8 top-8 bottom-0 flex flex-col gap-3">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-stone-200 flex items-center gap-3 transform group-hover:translate-x-2 transition-transform duration-500">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                    <div className="h-2 w-24 bg-stone-100 rounded-full" />
                  </div>
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-stone-200 flex items-center gap-3 transform translate-x-4 group-hover:translate-x-6 transition-transform duration-500 delay-75">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-sm">2</div>
                    <div className="h-2 w-16 bg-stone-100 rounded-full" />
                  </div>
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-stone-200 flex items-center gap-3 transform translate-x-8 group-hover:translate-x-10 transition-transform duration-500 delay-150">
                    <div className="h-8 w-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 font-bold text-sm">3</div>
                    <div className="h-2 w-20 bg-stone-100 rounded-full" />
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 text-[10px] font-mono text-stone-300">FIG. 1.0</div>
              </div>
            </div>

            {/* Privacy & security */}
            <div className="group relative rounded-[2rem] bg-white border border-stone-200 p-8 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-400">
              <div className="absolute top-6 right-6 font-mono text-xs text-stone-300 group-hover:text-stone-900 transition-colors">SEC_PROTO_01</div>
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-stone-900 text-white flex items-center justify-center mb-6 shadow-lg shadow-stone-200">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-2">Privacy & security</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">We minimize what we store and encrypt data in transit and at rest. Admins control access, exports, and integrations.</p>
                </div>
              </div>
            </div>

            {/* Scanning & rubrics - dark card */}
            <div className="group relative rounded-[2rem] bg-black text-white border border-stone-800 p-8 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-400">
              <div className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
                <div className="absolute top-6 left-6 w-8 h-8 border-l-2 border-t-2 border-white/50" />
                <div className="absolute top-6 right-6 w-8 h-8 border-r-2 border-t-2 border-white/50" />
                <div className="absolute bottom-6 left-6 w-8 h-8 border-l-2 border-b-2 border-white/50" />
                <div className="absolute bottom-6 right-6 w-8 h-8 border-r-2 border-b-2 border-white/50" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                      <Scan className="w-6 h-6" />
                    </div>
                    <span className="bg-red-500/20 text-red-300 text-[10px] font-mono px-2 py-1 rounded border border-red-500/30">REC •</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Scanning & rubrics</h3>
                  <p className="text-sm text-stone-400 leading-relaxed">Use a copier or phone to batch scan stacks of papers. Apply your rubric templates for consistent marking.</p>
                </div>
              </div>
            </div>

            {/* Dashboards & reports - wide card */}
            <div className="group lg:col-span-2 relative rounded-[2rem] bg-white border border-stone-200 p-8 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-400 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 z-10">
                <div className="flex items-center gap-2 mb-4 text-stone-400 font-mono text-xs">
                  <BarChart3 className="w-4 h-4" />
                  <span>ANALYTICS_V4</span>
                </div>
                <h3 className="text-2xl font-semibold text-stone-900 mb-3">Dashboards & reports</h3>
                <p className="text-stone-500 leading-relaxed mb-6 max-w-md">Teachers and leaders see performance by class, subject, and term. Export summaries for staff meetings, parent updates, and records.</p>
                <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors group/btn">
                  View Sample Report <ArrowUpRight className="ml-1 w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
              <div className="flex-1 w-full h-40 md:h-full min-h-[160px] relative">
                <div className="absolute inset-0 bg-stone-50 rounded-xl border border-stone-100 overflow-hidden flex items-end justify-between px-6 pb-0 pt-8 gap-4">
                  {[
                    { h: barHeights[0], color: 'bg-blue-100 hover:bg-blue-200' },
                    { h: barHeights[1], color: 'bg-stone-100 hover:bg-stone-200' },
                    { h: barHeights[2], color: 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20' },
                    { h: barHeights[3], color: 'bg-stone-200 hover:bg-stone-300' },
                  ].map((bar, i) => (
                    <div key={i} className={`w-full ${bar.color} rounded-t-lg transition-all duration-1000 relative group/bar`} style={{ height: `${bar.h}%` }}>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity">{bar.h}%</div>
                    </div>
                  ))}
                  <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ backgroundImage: 'linear-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: '100% 20%' }} />
                </div>
              </div>
            </div>

            {/* Contact us - gradient border */}
            <div className="group relative rounded-[2rem] bg-white border border-stone-200 p-[1px] overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-400 hover:border-blue-200">
              <div className="absolute inset-0 bg-white rounded-[2rem]" />
              <div className="relative h-full bg-white rounded-[1.9rem] p-8 flex flex-col justify-between overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors" />
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <PlaneTakeoff className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-2">Contact us</h3>
                  <p className="text-sm text-stone-500 leading-relaxed mb-6">Email braininkedu@gmail.com to book a demo or request onboarding for your school.</p>
                </div>
                <Link to="/contact" className="inline-flex justify-center items-center w-full py-3 px-4 bg-stone-900 hover:bg-black text-white rounded-xl font-medium transition-colors text-sm shadow-lg shadow-stone-200">
                  Get in touch
                </Link>
              </div>
            </div>
          </div>
          </ScrollReveal>

          {/* Bottom */}
          <div className="border-t border-stone-200 pt-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-stone-400">Can&apos;t find what you need? <Link to="/contact" className="text-blue-600 hover:underline">Contact support</Link> directly.</p>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-mono text-stone-500 uppercase tracking-wide">System Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
};

export default HelpCenterPage;
