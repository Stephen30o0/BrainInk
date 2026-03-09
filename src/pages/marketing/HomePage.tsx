import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';
import MarketingHeader from '../../components/marketing/MarketingHeader';
import MarketingFooter from '../../components/marketing/MarketingFooter';
import { ScrollReveal } from '../../components/marketing/ScrollReveal';
import { Marquee } from '../../components/marketing/Marquee';
import { SmoothScroll } from '../../components/marketing/SmoothScroll';
import {
  ScrollScale,
  TextReveal,
  CountUp,
  ZoomParallax,
  StaggerOnScroll,
  ScrollFade,
} from '../../components/marketing/ScrollAnimations';
import { Swirl } from '@paper-design/shaders-react';
import {
  ArrowRight, Upload, FileCheck, Zap, LayoutGrid, Users,
  GraduationCap, Building2, Shield, Clock, BarChart3, BookOpen,
  Sparkles, TrendingUp, AlertCircle, CheckCircle,
} from 'lucide-react';

/* ─── shared style objects ─── */
/* bgGrid removed — was causing visible grid overlay across page */

const gridPattern: React.CSSProperties = {
  backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};
const glassPanelStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(0,0,0,0.08)',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02), 0 0 0 1px rgba(0,0,0,0.02)',
};
const corporateShadow: React.CSSProperties = {
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)',
};
/* gridBg removed — was a fixed fullscreen grid overlay causing the visible grid issue */
const darkGridBg: React.CSSProperties = {
  backgroundImage: 'linear-gradient(0deg, transparent 24%, #ffffff 25%, #ffffff 26%, transparent 27%, transparent 74%, #ffffff 75%, #ffffff 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #ffffff 25%, #ffffff 26%, transparent 27%, transparent 74%, #ffffff 75%, #ffffff 76%, transparent 77%, transparent)',
  backgroundSize: '50px 50px',
};
const spaceGrotesk = { fontFamily: "'Space Grotesk', sans-serif" };

/* ────────────────────────────────────────
   SECTION 1 — Hero  (Split Scroll Cinema)
   ──────────────────────────────────────── */

/* ── Column A cards — left marquee column (scrolls up) ── */
const heroColumnA = [
  // 1. Upload grid — tall card with paper thumbnails
  <div key="upload" className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm w-full">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Upload className="w-4 h-4 text-blue-500" /></div>
      <div><div className="text-sm font-semibold text-stone-900">Papers uploaded</div><div className="text-[10px] text-stone-400 font-mono">24 files &bull; S2 Mathematics</div></div>
      <div className="ml-auto"><CheckCircle className="w-4 h-4 text-blue-400" /></div>
    </div>
    <div className="grid grid-cols-4 gap-1.5">
      {[1,2,3,4,5,6,7,8].map(n => (
        <div key={n} className="aspect-[3/4] rounded-lg bg-gradient-to-b from-blue-50 to-blue-100/40 border border-blue-100 flex items-center justify-center">
          <div className="w-2/3 space-y-1"><div className="h-0.5 bg-blue-200 rounded-full" /><div className="h-0.5 bg-blue-200/60 rounded-full w-3/4" /><div className="h-0.5 bg-blue-200/40 rounded-full w-1/2" /></div>
        </div>
      ))}
    </div>
  </div>,
  // 2. Big stat — single number hero
  <div key="bigstat" className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-6 shadow-lg w-full">
    <div className="text-[10px] font-mono uppercase tracking-widest text-blue-200 mb-2">Accuracy Rate</div>
    <div className="text-5xl font-bold tracking-tight" style={spaceGrotesk}>99.8%</div>
    <div className="mt-3 flex items-center gap-2 text-blue-200 text-xs">
      <TrendingUp className="w-3.5 h-3.5" />
      <span>+2.1% from last month</span>
    </div>
  </div>,
  // 3. Feedback quote — editorial style
  <div key="feedback" className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm w-full">
    <div className="text-3xl text-stone-200 font-serif leading-none mb-2">&ldquo;</div>
    <p className="text-sm text-stone-700 leading-relaxed italic">
      Strong algebraic reasoning. Revisit quadratic factoring — try the AC method for cleaner solutions.
    </p>
    <div className="mt-4 flex items-center gap-3">
      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><Sparkles className="w-3.5 h-3.5" /></div>
      <div>
        <div className="text-xs font-semibold text-stone-900">AI Feedback</div>
        <div className="text-[10px] text-stone-400 font-mono">Generated in 2.4s</div>
      </div>
    </div>
  </div>,
  // 4. Mini bar chart — dark card
  <div key="chart" className="bg-stone-900 text-white rounded-2xl p-5 shadow-lg w-full">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-violet-400" />
        <span className="text-xs font-semibold">Weekly trend</span>
      </div>
      <span className="text-[9px] font-mono text-emerald-400 uppercase">+18%</span>
    </div>
    <div className="flex items-end gap-[3px] h-20">
      {[25, 40, 35, 55, 50, 65, 60, 75, 70, 82, 78, 88, 85, 90, 87, 95].map((h, i) => (
        <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-600 to-violet-400" style={{ height: `${h}%` }} />
      ))}
    </div>
    <div className="flex justify-between mt-2 text-[8px] text-gray-500 font-mono"><span>Mon</span><span>Sun</span></div>
  </div>,
  // 5. Notification toast
  <div key="toast" className="bg-white rounded-xl border border-emerald-200 p-3.5 shadow-md w-full flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><CheckCircle className="w-4 h-4 text-emerald-500" /></div>
    <div className="min-w-0">
      <div className="text-xs font-semibold text-stone-900">Grading complete</div>
      <div className="text-[10px] text-stone-400 truncate">31 papers graded in 3m 12s</div>
    </div>
  </div>,
  // 6. Subject breakdown
  <div key="subjects" className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm w-full">
    <div className="text-xs font-semibold text-stone-900 mb-3">Subject Performance</div>
    <div className="space-y-2.5">
      {[
        { name: 'Mathematics', score: 87, color: 'bg-blue-500' },
        { name: 'English', score: 91, color: 'bg-emerald-500' },
        { name: 'Science', score: 78, color: 'bg-amber-500' },
        { name: 'History', score: 84, color: 'bg-violet-500' },
      ].map(s => (
        <div key={s.name} className="flex items-center gap-3 text-xs">
          <span className="w-20 text-stone-400 truncate">{s.name}</span>
          <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden"><div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.score}%` }} /></div>
          <span className="w-8 text-right font-mono text-stone-500">{s.score}%</span>
        </div>
      ))}
    </div>
  </div>,
];

/* ── Column B cards — right marquee column (scrolls down) ── */
const heroColumnB = [
  // 1. Dashboard overview — dark premium
  <div key="dashboard" className="bg-stone-900 text-white rounded-2xl p-5 shadow-lg w-full">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-violet-400" /></div>
      <div><div className="text-sm font-semibold">School overview</div><div className="text-[10px] text-gray-500 font-mono">Real-time</div></div>
      <div className="ml-auto flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /><span className="text-[8px] text-emerald-400 font-mono uppercase">Live</span></div>
    </div>
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="bg-white/5 rounded-xl py-2.5 border border-white/10"><div className="text-lg font-bold" style={spaceGrotesk}>342</div><div className="text-[8px] text-gray-500 font-mono">Students</div></div>
      <div className="bg-white/5 rounded-xl py-2.5 border border-white/10"><div className="text-lg font-bold" style={spaceGrotesk}>87%</div><div className="text-[8px] text-gray-500 font-mono">Pass rate</div></div>
      <div className="bg-white/5 rounded-xl py-2.5 border border-white/10"><div className="text-lg font-bold text-violet-400" style={spaceGrotesk}>+12%</div><div className="text-[8px] text-gray-500 font-mono">Growth</div></div>
    </div>
  </div>,
  // 2. Rubric criteria — emerald
  <div key="rubric" className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm w-full">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><FileCheck className="w-4 h-4 text-emerald-500" /></div>
      <div><div className="text-sm font-semibold text-stone-900">Rubric applied</div><div className="text-[10px] text-stone-400 font-mono">S2 Algebra &bull; 5 criteria</div></div>
    </div>
    <div className="space-y-2.5">
      {['Content accuracy', 'Problem solving', 'Methodology', 'Notation', 'Presentation'].map((label, i) => (
        <div key={label} className="flex items-center gap-2 text-xs">
          <span className="w-24 text-stone-400 truncate">{label}</span>
          <div className="flex-1 h-1.5 bg-emerald-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${95 - i * 8}%` }} /></div>
          <span className="w-8 text-right font-mono text-stone-400">{95 - i * 8}%</span>
        </div>
      ))}
    </div>
  </div>,
  // 3. Speed hero — big timestamp
  <div key="speed" className="bg-gradient-to-br from-stone-800 to-stone-900 text-white rounded-2xl p-6 shadow-lg w-full text-center">
    <Clock className="w-5 h-5 text-stone-400 mx-auto mb-2" />
    <div className="text-4xl font-bold tracking-tight" style={spaceGrotesk}>2:41</div>
    <div className="text-[10px] font-mono text-stone-400 mt-1 uppercase tracking-wider">Avg grading time</div>
    <div className="text-xs text-stone-500 mt-2">24 papers per batch</div>
  </div>,
  // 4. Student leaderboard
  <div key="leaderboard" className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm w-full">
    <div className="flex items-center gap-2 mb-3">
      <GraduationCap className="w-4 h-4 text-stone-400" />
      <span className="text-xs font-semibold text-stone-900">Top performers</span>
    </div>
    <div className="space-y-2">
      {[
        { name: 'Amara Okafor', score: 97, medal: 'bg-amber-400' },
        { name: 'Kweku Mensah', score: 94, medal: 'bg-stone-300' },
        { name: 'Nalini Patel', score: 91, medal: 'bg-amber-600' },
      ].map((s, i) => (
        <div key={s.name} className="flex items-center gap-3 py-1.5">
          <div className={`w-5 h-5 rounded-full ${s.medal} flex items-center justify-center text-[9px] font-bold text-white`}>{i + 1}</div>
          <span className="text-xs text-stone-700 flex-1">{s.name}</span>
          <span className="text-xs font-mono font-semibold text-stone-900">{s.score}%</span>
        </div>
      ))}
    </div>
  </div>,
  // 5. AI insight card — amber accent
  <div key="insight" className="bg-amber-50 rounded-2xl border border-amber-200 p-5 w-full">
    <div className="flex items-center gap-2 mb-3">
      <Sparkles className="w-4 h-4 text-amber-600" />
      <span className="text-xs font-bold uppercase tracking-wide text-amber-700">Focus area</span>
    </div>
    <h4 className="text-sm font-semibold text-stone-900 mb-1">Quadratic equations</h4>
    <p className="text-xs text-stone-600 leading-relaxed">6 students need additional support in factoring methods. Recommend review session.</p>
  </div>,
  // 6. Security badge
  <div key="security" className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm w-full flex items-center gap-4">
    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center shrink-0"><Shield className="w-5 h-5 text-stone-500" /></div>
    <div>
      <div className="text-xs font-semibold text-stone-900">Data encrypted</div>
      <div className="text-[10px] text-stone-400">AES-256 &bull; SOC 2 compliant</div>
    </div>
  </div>,
  // 7. Results summary
  <div key="results" className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm w-full">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><Zap className="w-4 h-4 text-amber-500" /></div>
      <div><div className="text-sm font-semibold text-stone-900">Results ready</div><div className="text-[10px] text-stone-400 font-mono">24 students</div></div>
    </div>
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="bg-amber-50/60 rounded-xl py-2"><div className="text-xl font-bold text-stone-900" style={spaceGrotesk}>92%</div><div className="text-[9px] text-stone-400 font-mono">Average</div></div>
      <div className="bg-amber-50/60 rounded-xl py-2"><div className="text-xl font-bold text-stone-900" style={spaceGrotesk}>A-</div><div className="text-[9px] text-stone-400 font-mono">Median</div></div>
      <div className="bg-emerald-50/60 rounded-xl py-2"><div className="text-xl font-bold text-emerald-600" style={spaceGrotesk}>3m</div><div className="text-[9px] text-stone-400 font-mono">Time</div></div>
    </div>
  </div>,
];

/* Infinite vertical marquee for hero */
const HeroVerticalMarquee: React.FC<{ cards: React.ReactNode[]; reverse?: boolean; speed?: number }> = ({ cards, reverse = false, speed = 35 }) => {
  const doubled = [...cards, ...cards];
  return (
    <div className="overflow-hidden h-full relative">
      <motion.div
        className="flex flex-col gap-4"
        animate={{ y: reverse ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ y: { duration: speed, repeat: Infinity, ease: 'linear' } }}
      >
        {doubled.map((card, i) => (
          <div key={i} className="w-full shrink-0">{card}</div>
        ))}
      </motion.div>
    </div>
  );
};

const TrustedBy: React.FC = () => (
  <div className="border-t border-blue-500/20 bg-blue-600 py-12 overflow-hidden">
    <div className="max-w-7xl mx-auto px-6 text-center">
      <p className="text-sm font-medium text-blue-200 mb-8 uppercase tracking-widest font-mono">Trusted by educators at</p>
      <Marquee speed={25} className="opacity-60">
        <div className="flex items-center gap-16">
          {[
            { shape: <div className="w-6 h-6 bg-white rounded-sm" />, name: 'ACADEMY' },
            { shape: <div className="w-6 h-6 rounded-full border-4 border-white" />, name: 'UNIV' },
            { shape: <div className="w-6 h-6 bg-white rotate-45" />, name: 'FUTURE' },
            { shape: <div className="flex gap-0.5"><div className="w-2 h-6 bg-white" /><div className="w-2 h-6 bg-white" /><div className="w-2 h-6 bg-white" /></div>, name: 'TECH.EDU' },
            { shape: <div className="w-6 h-6 bg-white rounded-full" />, name: 'KIGALI' },
            { shape: <div className="w-6 h-6 border-4 border-white rotate-45" />, name: 'SCHOOL' },
          ].map(l => (
            <div key={l.name} className="flex items-center gap-2 shrink-0">{l.shape}<span className="font-bold text-xl text-white" style={spaceGrotesk}>{l.name}</span></div>
          ))}
        </div>
      </Marquee>
    </div>
  </div>
);

/* ── ArrowUpRight icon used in hero CTA ── */
const ArrowUpRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
);

const HeroSection: React.FC = () => (
  <>
    <main className="flex-grow pt-28 lg:pt-36 relative z-10">
      {/* Swirl shader background — full bleed */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-[-20%] opacity-30">
          <Swirl
            speed={0.25}
            bandCount={3}
            twist={0.25}
            scale={1.4}
            softness={1}
            noiseFrequency={0.15}
            noise={0.05}
            center={0.15}
            proportion={0.5}
            offsetX={-0.1}
            offsetY={0.5}
            colors={['#FEFFF0', '#95CEED', '#68AADC']}
            colorBack="#00000000"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 min-h-[75vh]">
          {/* Left — headline, anchored */}
          <motion.div
            className="space-y-8 lg:pr-16 flex flex-col justify-center lg:pt-0 pt-4 lg:-mt-10"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } }, hidden: {} }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 bg-white/80 backdrop-blur-sm w-fit"
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } } }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-xs font-medium text-stone-500">Built for African Classrooms</span>
            </motion.div>

            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.9] text-stone-900"
              style={spaceGrotesk}
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } } }}
            >
              From paper<br />
              to insight<br />
              <span className="text-blue-600">in minutes.</span>
            </motion.h1>

            <motion.p
              className="text-lg text-stone-500 max-w-md leading-relaxed"
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } } }}
            >
              BrainInk turns assessment into opportunity — AI-powered grading with actionable insights for students, teachers, and school leaders.
            </motion.p>

            <motion.div
              className="flex items-center gap-4"
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } } }}
            >
              <Link to="/get-started" className="group px-7 py-3.5 bg-stone-900 text-white rounded-full font-medium text-base hover:bg-stone-800 transition-all active:scale-[0.98] flex items-center gap-2">
                Get Started <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
              <Link to="/pricing" className="px-7 py-3.5 text-stone-600 border border-stone-200 rounded-full font-medium text-base hover:border-stone-400 transition-all bg-white/80 backdrop-blur-sm active:scale-[0.98]">
                See Pricing
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="pt-8 border-t border-stone-200/60 flex items-center gap-8"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 0.5 } } }}
            >
              <div><span className="text-2xl font-bold text-stone-900" style={spaceGrotesk}>10+</span><span className="text-xs text-stone-400 ml-1.5">hrs saved/week</span></div>
              <div className="w-px h-8 bg-stone-200" />
              <div><span className="text-2xl font-bold text-stone-900" style={spaceGrotesk}>3x</span><span className="text-xs text-stone-400 ml-1.5">faster feedback</span></div>
              <div className="w-px h-8 bg-stone-200 hidden sm:block" />
              <div className="hidden sm:block"><span className="text-2xl font-bold text-stone-900" style={spaceGrotesk}>99.8%</span><span className="text-xs text-stone-400 ml-1.5">accuracy</span></div>
            </motion.div>
          </motion.div>

          {/* Right — dual vertical marquee columns with distinct card sets */}
          <div className="relative hidden lg:grid grid-cols-2 gap-4 h-[85vh] overflow-hidden">
            {/* Fade edges */}
            <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#FAFAF8] to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#FAFAF8] to-transparent z-10 pointer-events-none" />
            {/* Column A scrolls up */}
            <HeroVerticalMarquee cards={heroColumnA} speed={42} />
            {/* Column B scrolls down — different cards */}
            <HeroVerticalMarquee cards={heroColumnB} reverse speed={48} />
          </div>
        </div>
      </div>
    </main>
    <TrustedBy />
  </>
);

/* ────────────────────────────────────────
   SECTION 2 — Experience in Action  (file 3)
   ──────────────────────────────────────── */

const FeatureTabButton: React.FC<{ active: boolean; icon: React.ReactNode; module: string; title: string; description: string; onClick: () => void }> = ({ active, icon, module, title, description, onClick }) => {
  const colorMap: Record<string, string> = { '01': 'bg-blue-50 text-blue-600 group-hover:bg-blue-100', '02': 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100', '03': 'bg-orange-50 text-orange-600 group-hover:bg-orange-100' };
  return (
    <button onClick={onClick} className={`group text-left p-6 rounded-2xl border transition-all duration-300 w-full ${active ? 'bg-white border-zinc-200 shadow-md' : 'border-transparent hover:bg-white/40'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl transition-colors ${colorMap[module] || colorMap['01']}`}>{icon}</div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">MOD_{module}</span>
      </div>
      <h3 className="text-xl font-semibold text-zinc-900 mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed group-hover:text-zinc-600">{description}</p>
    </button>
  );
};

const SmartGradingPreview: React.FC = () => (
  <div className="h-full flex flex-col">
    <div className="flex-1 flex flex-col items-center justify-center mb-8 relative bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden p-8 group">
      <div className="absolute inset-0 opacity-[0.03]" style={gridPattern} />
      <div className="relative bg-white w-64 md:w-80 shadow-lg rounded-lg p-6 rotate-[-2deg] transition-transform duration-700 group-hover:rotate-0">
        <div className="space-y-3 blur-[0.5px]"><div className="h-2 bg-zinc-200 rounded w-3/4" /><div className="h-2 bg-zinc-200 rounded w-full" /><div className="h-2 bg-zinc-200 rounded w-5/6" /><div className="h-2 bg-zinc-200 rounded w-4/5" /></div>
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 text-2xl text-indigo-600 opacity-60 rotate-[-5deg]">B+ <span className="text-sm block text-zinc-500 font-sans mt-1">Great analysis!</span></div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-scan" />
      </div>
      <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur shadow-lg border border-zinc-100 px-4 py-2 rounded-lg flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <div className="text-xs font-mono text-zinc-600"><div>ACCURACY: 99.8%</div><div className="text-zinc-400">PROCESSING...</div></div>
      </div>
    </div>
    <div className="space-y-4">
      <span className="px-2 py-1 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 uppercase tracking-wide">AI Grading</span>
      <h2 className="text-3xl font-semibold text-zinc-900">Intelligent Feedback Loop</h2>
      <p className="text-zinc-600 leading-relaxed max-w-2xl">Our advanced AI system instantly analyzes handwritten and digital assignments. It provides detailed feedback that helps students conceptualize their mistakes.</p>
    </div>
  </div>
);

const ProgressTrackingPreview: React.FC = () => (
  <div className="h-full flex flex-col">
    <div className="flex-1 flex flex-col items-center justify-center mb-8 relative bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden p-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-zinc-100 p-6">
        <div className="flex justify-between items-end mb-6">
          <div><div className="text-xs text-zinc-400 font-mono uppercase mb-1">Class Performance</div><div className="text-2xl font-semibold text-zinc-900">+24.5%</div></div>
          <div className="flex gap-1">
            {[40, 65, 55, 85, 75, 95].map((h, i) => (
              <div key={i} className="w-8 h-12 bg-emerald-100 rounded-t-sm relative">
                <div className="absolute bottom-0 left-0 right-0 bg-emerald-500 rounded-t-sm" style={{ height: `${h}%`, animation: `grow 1.5s ease-out forwards ${i * 0.1}s` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
          <div><div className="text-[10px] text-zinc-400 font-mono uppercase">Avg Score</div><div className="text-sm font-medium">88.2</div></div>
          <div><div className="text-[10px] text-zinc-400 font-mono uppercase">Completion</div><div className="text-sm font-medium">94%</div></div>
        </div>
      </div>
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" /></span>
        <span className="text-xs font-mono text-emerald-600 font-medium tracking-wide">LIVE UPDATES</span>
      </div>
    </div>
    <div className="space-y-4">
      <span className="px-2 py-1 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 uppercase tracking-wide">Analytics</span>
      <h2 className="text-3xl font-semibold text-zinc-900">Data-Driven Decisions</h2>
      <p className="text-zinc-600 leading-relaxed max-w-2xl">Monitor student progress with comprehensive analytics dashboards. Track improvement over time and identify learning gaps early.</p>
    </div>
  </div>
);

const QuickSetupPreview: React.FC = () => (
  <div className="h-full flex flex-col">
    <div className="flex-1 flex flex-col items-center justify-center mb-8 relative bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden p-8">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" stroke="#f4f4f5" strokeWidth="8" fill="none" />
          <circle cx="50" cy="50" r="40" stroke="#f97316" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset="20" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-bold text-zinc-900">2<span className="text-xl text-zinc-400 font-normal">m</span></span>
          <span className="text-xs text-zinc-500 uppercase font-mono mt-1">Avg Setup</span>
        </div>
        <div className="absolute inset-0 rounded-full border border-orange-200 animate-pulse-ring" />
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        <div className="w-2 h-2 rounded-full bg-orange-500" /><div className="w-2 h-2 rounded-full bg-orange-500" /><div className="w-2 h-2 rounded-full bg-orange-500" /><div className="w-2 h-2 rounded-full bg-zinc-300" />
      </div>
    </div>
    <div className="space-y-4">
      <span className="px-2 py-1 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 uppercase tracking-wide">Quick Setup</span>
      <h2 className="text-3xl font-semibold text-zinc-900">Minutes, Not Hours</h2>
      <p className="text-zinc-600 leading-relaxed max-w-2xl">Get your entire classroom up and running in just minutes. No complex installations or lengthy training sessions required.</p>
    </div>
  </div>
);

const ExperienceSection: React.FC = () => {
  const [tab, setTab] = useState(0);
  const statuses = ['SYSTEM_ANALYSIS_ACTIVE', 'DATA_STREAM_LIVE', 'SETUP_WIZARD_READY'];
  return (
    <section className="w-full py-24 relative noise-bg section-accent-top overflow-hidden" style={{ backgroundColor: '#F5F4F0' }}>

      {/* ── Background image (cropped to hide watermark) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src="/images/brainink-student.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-[0.12] scale-[1.08] origin-top-left"
          style={{ filter: 'grayscale(20%) contrast(1.1)' }}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[100px] animate-blob-drift" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-stone-200/15 rounded-full blur-[100px]" style={{ animationDelay: '-6s' }} />
      </div>
      <div className="max-w-6xl mx-auto px-6 flex flex-col gap-16 relative z-10">
        <header className="text-center space-y-6 max-w-3xl mx-auto">
          <ScrollReveal delay={0}>
            <div className="section-tag">
              <span>Platform Demo</span>
            </div>
          </ScrollReveal>
          <TextReveal text="Experience BrainInk in Action" className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-zinc-900" />
          <ScrollReveal delay={0.2}>
            <p className="text-lg md:text-xl text-zinc-500 leading-relaxed font-light">Discover how our platform transforms traditional grading into an <span className="text-zinc-900 font-medium">intelligent</span>, <span className="text-zinc-900 font-medium">efficient</span> process.</p>
          </ScrollReveal>
        </header>
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:min-h-[600px]">
          <div className="lg:col-span-4 flex flex-col gap-4">
            <FeatureTabButton active={tab === 0} icon={<Sparkles className="w-6 h-6" />} module="01" title="Smart Grading" description="AI-powered analysis of handwritten and digital assignments." onClick={() => setTab(0)} />
            <FeatureTabButton active={tab === 1} icon={<TrendingUp className="w-6 h-6" />} module="02" title="Progress Tracking" description="Real-time analytics to identify gaps and monitor improvement." onClick={() => setTab(1)} />
            <FeatureTabButton active={tab === 2} icon={<Zap className="w-6 h-6" />} module="03" title="Quick Setup" description="Streamlined onboarding to get classrooms running in minutes." onClick={() => setTab(2)} />
          </div>
          <div className="lg:col-span-8 relative">
            <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden flex flex-col min-h-[600px]">
              <div className="h-12 border-b border-zinc-100 flex items-center px-6 justify-between bg-zinc-50/50">
                <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400" /><div className="w-3 h-3 rounded-full bg-yellow-400/20 border border-yellow-400" /><div className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400" /></div>
                <div className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">{statuses[tab]}</div>
              </div>
              <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                {tab === 0 && <SmartGradingPreview />}
                {tab === 1 && <ProgressTrackingPreview />}
                {tab === 2 && <QuickSetupPreview />}
              </div>
              <div className="h-12 border-t border-zinc-100 bg-zinc-50/30 flex items-center justify-between px-6">
                <div className="text-[10px] text-zinc-300 font-mono">ID: BRNK-2024-V2</div>
                <div className="w-20 h-1 bg-zinc-200 rounded-full overflow-hidden"><div className="h-full bg-zinc-400 w-2/3" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ────────────────────────────────────────
   SECTION 3 — Feature Cards & Demo  (file 4)
   ──────────────────────────────────────── */

const FeatureCard: React.FC<{ category: string; title: string; description: string; colorClass: string }> = ({ category, title, description, colorClass }) => {
  const [hov, setHov] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    cardRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  return (
    <div ref={cardRef} className="spotlight-card group relative p-8 rounded-2xl transition-all duration-300 overflow-hidden hover:-translate-y-1 hover:shadow-lg" style={glassPanelStyle} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onMouseMove={handleMouseMove}>
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${colorClass} rounded-full blur-2xl transition-opacity`} style={{ opacity: hov ? 1 : 0.5 }} />
      <div className="relative z-10">
        <h3 className="font-mono text-xs text-blue-600 uppercase tracking-widest mb-2">{category}</h3>
        <h2 className="text-lg font-bold text-slate-900 mb-2">{title}</h2>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const DemoTabButton: React.FC<{ index: number; activeTab: number; onClick: (i: number) => void; num: string; label: string }> = ({ index, activeTab, onClick, num, label }) => (
  <button onClick={() => onClick(index)} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === index ? 'shadow-sm bg-white text-slate-900 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}>
    <span className="font-mono text-xs text-slate-400">{num}</span>{label}
  </button>
);

const DemoBarChart: React.FC<{ height: number; label: string; active?: boolean }> = ({ height, label, active }) => {
  const [hov, setHov] = useState(false);
  const bg = active ? 'bg-blue-500' : height >= 65 ? 'bg-slate-200' : 'bg-slate-100';
  return (
    <div className={`flex-1 ${bg} rounded-t-sm relative transition-all`} style={{ height: `${height}%`, boxShadow: active ? '0 20px 25px -5px rgba(59,130,246,0.3)' : 'none' }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded transition-opacity ${active || hov ? 'opacity-100' : 'opacity-0'}`}>{label}</div>
    </div>
  );
};

const DemoTestTab: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
    <div className="relative group cursor-pointer">
      <div className="relative bg-[#Fdfdf8] rounded-lg shadow-xl border border-slate-200 p-8 transition-transform duration-500 origin-center z-10 hover:rotate-0 hover:scale-105" style={{ transform: 'rotate(-2deg)' }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="space-y-6">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div className="text-2xl text-slate-800" style={{ fontFamily: "'Indie Flower', cursive" }}>Calculus Quiz 4</div>
            <div className="text-xl text-slate-500" style={{ fontFamily: "'Indie Flower', cursive" }}>Oct 24</div>
          </div>
          <div className="text-xl text-slate-600 space-y-4" style={{ fontFamily: "'Indie Flower', cursive" }}>
            <p>1. Find the derivative of f(x) = x² + 3x</p>
            <div className="pl-4 border-l-2 border-blue-200 text-blue-900">f'(x) = 2x + 3</div>
            <p>2. Solve for x: 2x + 4 = 10</p>
            <div className="pl-4 border-l-2 border-blue-200 text-blue-900">2x = 6<br />x = 3</div>
          </div>
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20" style={{ boxShadow: '0 0 15px rgba(59,130,246,0.5)' }} />
        </div>
      </div>
      <div className="absolute inset-0 bg-slate-100 rounded-lg border border-slate-200" style={{ transform: 'rotate(2deg)', zIndex: -10 }} />
    </div>
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-6">Capture your work <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">effortlessly</span>.</h2>
        <p className="text-lg text-slate-600 leading-relaxed">Whether it's handwritten notes or digital assignments, our system handles both seamlessly. Our advanced OCR technology recognizes equations, text, and diagrams accurately.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100"><div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Upload className="w-5 h-5" /></div><h4 className="font-semibold text-slate-900">Photo Capture</h4><p className="text-sm text-slate-500">Snap a photo with any device.</p></div>
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100"><div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><FileCheck className="w-5 h-5" /></div><h4 className="font-semibold text-slate-900">Math OCR</h4><p className="text-sm text-slate-500">Recognizes complex formulas.</p></div>
      </div>
    </div>
  </div>
);

const DemoUploadTab: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
    <div className="relative">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
          <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-blue-400" /><div className="w-3 h-3 rounded-full bg-green-400" /></div>
          <div className="mx-auto bg-white px-3 py-1 rounded text-xs text-slate-400 font-mono border border-slate-100 shadow-sm">upload_assignment.exe</div>
        </div>
        <div className="p-8 bg-slate-50/50">
          <div className="border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-xl p-8 text-center transition-all hover:border-blue-400 hover:bg-blue-50 cursor-pointer group">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform text-blue-500"><Upload className="w-8 h-8" /></div>
            <h3 className="text-lg font-semibold text-slate-900">Drag & Drop Files</h3>
            <p className="text-slate-500 text-sm mt-1">Supports PDF, JPG, PNG</p>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
              <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center text-red-500"><FileCheck className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">Homework_Final.pdf</p><div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden"><div className="bg-blue-500 h-full rounded-full w-full" /></div></div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
              <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-500"><FileCheck className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">scan_002.jpg</p><div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden"><div className="bg-blue-500 h-full rounded-full w-[60%] animate-pulse" /></div></div>
              <span className="text-xs font-mono text-slate-400">60%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-6">Intelligent grading at your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">fingertips</span>.</h2>
        <p className="text-lg text-slate-600 leading-relaxed">Our drag-and-drop interface makes uploading assignments as simple as dropping files into a folder.</p>
      </div>
      <ul className="space-y-4">
        <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" /><span className="text-slate-600">Smart categorization by student ID and subject.</span></li>
        <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" /><span className="text-slate-600">Support for mixed media formats in a single batch.</span></li>
        <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" /><span className="text-slate-600">Instant validation of file integrity.</span></li>
      </ul>
    </div>
  </div>
);

const DemoResultsTab: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
    <div className="relative">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden transform transition-transform hover:scale-[1.01] duration-500">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div><h3 className="font-bold text-slate-900">Performance Overview</h3><p className="text-xs text-slate-500">Class 4-B &bull; Mathematics</p></div>
          <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">+12% vs Last Term</div>
        </div>
        <div className="p-6">
          <div className="flex items-end gap-3 h-40 mb-8 border-b border-slate-100 pb-4">
            <DemoBarChart height={40} label="40%" /><DemoBarChart height={65} label="65%" /><DemoBarChart height={88} label="88%" active /><DemoBarChart height={72} label="72%" /><DemoBarChart height={55} label="55%" />
          </div>
          <div className="space-y-3">
            <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-100"><AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" /><div><h4 className="text-sm font-semibold text-slate-800">Concept Gap Detected</h4><p className="text-xs text-slate-500 mt-1">35% of students struggled with quadratic equations.</p></div></div>
            <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-100"><TrendingUp className="w-5 h-5 text-green-500 mt-0.5" /><div><h4 className="text-sm font-semibold text-slate-800">Strong Improvement</h4><p className="text-xs text-slate-500 mt-1">Class average is up 12 points since last assessment.</p></div></div>
          </div>
        </div>
      </div>
    </div>
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-6">Comprehensive insights that drive <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">improvement</span>.</h2>
        <p className="text-lg text-slate-600 leading-relaxed">Get detailed breakdowns of student performance with actionable feedback. Highlights strengths and identifies knowledge gaps.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button className="p-4 rounded-lg border border-slate-200 text-left hover:border-blue-500 hover:bg-blue-50 transition-all group"><div className="text-xs font-mono text-slate-400 mb-1">VIEW</div><div className="font-semibold text-slate-800 group-hover:text-blue-700">Class Analytics →</div></button>
        <button className="p-4 rounded-lg border border-slate-200 text-left hover:border-blue-500 hover:bg-blue-50 transition-all group"><div className="text-xs font-mono text-slate-400 mb-1">VIEW</div><div className="font-semibold text-slate-800 group-hover:text-blue-700">Student Reports →</div></button>
      </div>
    </div>
  </div>
);

const FeatureCardsAndDemoSection: React.FC = () => {
  const [demoTab, setDemoTab] = useState(0);
  return (
    <section className="relative py-24 noise-bg warm-glow" style={{ backgroundColor: '#F5F4F0' }}>
      {/* ── Shader background: Swirl ── */}
      <div className="absolute inset-0 pointer-events-none">
        <Swirl speed={0.3} bandCount={4} twist={0.33} scale={1} softness={1} noiseFrequency={0.21} noise={0.07} center={0.12} proportion={0.47} offsetX={-0.58} offsetY={1} colors={['#FEFFF0', '#95CEED', '#68AADC']} colorBack="#00000000" style={{ width: '100%', height: '100%' }} />
      </div>
      {/* Grain texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.15] mix-blend-multiply" style={{ backgroundImage: 'url(/assets/visuals/noise texture.webp)', backgroundRepeat: 'repeat', backgroundSize: '200px 200px' }} />
      {/* Decorative corner marks */}
      <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-blue-200/40 pointer-events-none" />
      <div className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-blue-200/40 pointer-events-none" />
      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <svg className="absolute bottom-[10%] left-[5%] w-24 h-24 opacity-[0.05]" viewBox="0 0 96 96"><circle cx="48" cy="48" r="44" stroke="#2563EB" strokeWidth="1.5" fill="none" /><circle cx="48" cy="48" r="20" fill="#2563EB" /></svg>
        <svg className="absolute top-[40%] right-[3%] w-16 h-16 text-stone-400 opacity-10" viewBox="0 0 64 64"><polygon points="32,4 60,60 4,60" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
        <div className="absolute top-[20%] right-[12%] w-3 h-3 bg-blue-500 rounded-full opacity-20 animate-pulse" />
        <div className="absolute bottom-[30%] left-[8%] w-2 h-2 bg-stone-500 rounded-full opacity-15" />
      </div>
      <div className="max-w-7xl mx-auto px-6 space-y-32 relative z-10">
        {/* Feature cards */}
        <div>
          <div className="max-w-5xl mb-16">
            <ScrollReveal><div className="section-tag mb-8"><span>Core Features</span></div></ScrollReveal>
            <TextReveal text="Grade faster. Give better feedback. See progress real-time." className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[0.95] mb-8" />
            <ScrollReveal delay={0.15}>
              <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">The complete operating system for modern education. Automated grading, insightful analytics, and student growth tracking.</p>
            </ScrollReveal>
          </div>
          <StaggerOnScroll className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.12}>
            <FeatureCard category="Efficiency" title="Instant Grading" description="Scan or upload work and let our OCR engine process results immediately." colorClass="bg-blue-50" />
            <FeatureCard category="Clarity" title="Actionable Feedback" description="Automated breakdowns of strengths, gaps, and suggested follow-ups." colorClass="bg-green-50" />
            <FeatureCard category="Growth" title="Student Dashboards" description="Individual progress tracking, topic review, and growth over time." colorClass="bg-purple-50" />
            <FeatureCard category="Oversight" title="School Analytics" description="Principals see real-time performance across all classes and terms." colorClass="bg-orange-50" />
          </StaggerOnScroll>
        </div>

        {/* Interactive demo tabs — scales in on scroll */}
        <ScrollScale scaleRange={[0.9, 1]}>
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden" style={corporateShadow}>
          <div className="bg-slate-50/80 backdrop-blur border-b border-slate-200 p-2 flex flex-col md:flex-row gap-2 sticky top-0 z-10">
            <div className="grid grid-cols-3 gap-2 w-full md:w-auto p-1 bg-slate-200/50 rounded-xl">
              <DemoTabButton index={0} activeTab={demoTab} onClick={setDemoTab} num="01" label="Test" />
              <DemoTabButton index={1} activeTab={demoTab} onClick={setDemoTab} num="02" label="Upload" />
              <DemoTabButton index={2} activeTab={demoTab} onClick={setDemoTab} num="03" label="Results" />
            </div>
            <div className="flex-grow flex items-center justify-end px-4 gap-4 hidden md:flex">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /><span className="font-mono text-xs text-slate-400 tracking-widest">SYSTEM_READY</span>
            </div>
          </div>
          <div className="p-8 md:p-16 min-h-[600px] flex flex-col justify-center relative bg-white">
            {demoTab === 0 && <DemoTestTab />}
            {demoTab === 1 && <DemoUploadTab />}
            {demoTab === 2 && <DemoResultsTab />}
          </div>
        </div>
        </ScrollScale>
        {/* Role cards — staggered reveal */}
        <div>
          <ScrollReveal><div className="text-center mb-16"><h2 className="text-3xl font-bold tracking-tight text-slate-900">Built for the entire ecosystem</h2></div></ScrollReveal>
          <StaggerOnScroll className="grid grid-cols-1 md:grid-cols-3 gap-8" stagger={0.2}>
            {([
              { icon: <GraduationCap className="w-8 h-8 text-white" />, title: 'Students', access: 'ACCESS_LEVEL_1', desc: 'Know exactly where you went wrong, what to review next, and track improvement each term with personalized dashboards.', color: 'bg-blue-500', imgPath: '/images/brainink-student-role.webp' },
              { icon: <Users className="w-8 h-8 text-white" />, title: 'Teachers', access: 'ACCESS_LEVEL_2', desc: 'Save 10+ hours/week with instant grading, clear rubrics, and organized feedback. Focus on teaching, not grading.', color: 'bg-blue-600', imgPath: '/images/brainink-teacher-role.webp' },
              { icon: <Building2 className="w-8 h-8 text-white" />, title: 'School Leaders', access: 'ACCESS_LEVEL_ADMIN', desc: 'Get real-time visibility across classes and subjects to make data-driven decisions for curriculum improvements.', color: 'bg-stone-900', imgPath: '/images/brainink-leader-role.webp' },
            ] as const).map(r => (
              <div key={r.title} className="group relative bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden hover:-translate-y-1 transition-transform duration-300">
                {/* Top image strip */}
                <div className="relative h-36 overflow-hidden">
                  <img src={r.imgPath} alt={`${r.title} using BrainInk`} className="w-full h-full object-cover scale-[1.08] origin-top-left transition-transform duration-500 group-hover:scale-[1.13]" loading="lazy" decoding="async" />
                  <div className={`absolute inset-0 ${r.color} opacity-40 mix-blend-multiply`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                </div>
                <div className="p-8 pt-4 relative">
                  {/* Icon badge overlapping image */}
                  <div className={`${r.color} w-14 h-14 rounded-xl flex items-center justify-center border-4 border-white shadow-lg absolute -top-7 left-8`}>{r.icon}</div>
                  <div className="mt-6">
                    <div className="flex items-center gap-3 mb-4"><h3 className="font-bold text-xl text-stone-900">{r.title}</h3><p className="text-[10px] font-mono text-stone-400">{r.access}</p></div>
                    <p className="text-stone-600 leading-relaxed text-sm">{r.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </StaggerOnScroll>
        </div>
      </div>
    </section>
  );
};

/* ────────────────────────────────────────
   SECTION 4 — Process + Capabilities + Stats + Testimonials + FAQ  (file 5)
   ──────────────────────────────────────── */

const stepAccents: Record<string, { bg: string; border: string; text: string; icon: string; glow: string }> = {
  '1': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', icon: 'bg-blue-100 text-blue-600', glow: 'shadow-blue-200/40' },
  '2': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', icon: 'bg-emerald-100 text-emerald-600', glow: 'shadow-emerald-200/40' },
  '3': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', icon: 'bg-amber-100 text-amber-600', glow: 'shadow-amber-200/40' },
  '4': { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600', icon: 'bg-violet-100 text-violet-600', glow: 'shadow-violet-200/40' },
};

/* "How It Works" — scroll-pinned stack: section pins via fixed positioning (Lenis-safe) */
const HowItWorksSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  /* Pin state: 'before' = hasn't reached top yet, 'pinned' = fixed in viewport, 'after' = scrolled past */
  const [pinState, setPinState] = useState<'before' | 'pinned' | 'after'>('before');
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (v <= 0) setPinState('before');
    else if (v >= 1) setPinState('after');
    else setPinState('pinned');
  });

  /* Step highlighting — each step lights up during its scroll phase.
     With 500vh container (400vh scroll), each card gets ~25% of the range. */
  const step1Opacity = useTransform(scrollYProgress, [0, 0.03], [0.35, 1]);
  const step2Opacity = useTransform(scrollYProgress, [0.18, 0.25], [0.35, 1]);
  const step3Opacity = useTransform(scrollYProgress, [0.43, 0.50], [0.35, 1]);
  const step4Opacity = useTransform(scrollYProgress, [0.68, 0.75], [0.35, 1]);
  const stepOpacities = [step1Opacity, step2Opacity, step3Opacity, step4Opacity];

  /* Card slide-up — pixel Y offset: 700 = fully below (hidden), 0 = covering previous card */
  const card2Y = useTransform(scrollYProgress, [0.18, 0.38], [700, 0], { clamp: true });
  const card3Y = useTransform(scrollYProgress, [0.43, 0.63], [700, 0], { clamp: true });
  const card4Y = useTransform(scrollYProgress, [0.68, 0.88], [700, 0], { clamp: true });

  /* Card rotation — slight tilt as each card arrives for a stacking feel */
  const card2Rotate = useTransform(scrollYProgress, [0.18, 0.38], [4, 1.5], { clamp: true });
  const card3Rotate = useTransform(scrollYProgress, [0.43, 0.63], [-3.5, -0.8], { clamp: true });
  const card4Rotate = useTransform(scrollYProgress, [0.68, 0.88], [3, 0.5], { clamp: true });

  const steps = [
    { number: '1', icon: <Upload className="w-5 h-5" />, title: 'Upload or scan work', desc: 'Teachers scan handwritten papers or upload PDFs/Images for assignments, quizzes, and exams.' },
    { number: '2', icon: <FileCheck className="w-5 h-5" />, title: 'Apply rubrics', desc: 'Import your rubric or use templates so marking is consistent across classes.' },
    { number: '3', icon: <Zap className="w-5 h-5" />, title: 'Get instant results', desc: 'Students and teachers receive clear breakdowns: strengths, gaps, and next steps.' },
    { number: '4', icon: <LayoutGrid className="w-5 h-5" />, title: 'See school-wide insights', desc: 'Principals and admins view live dashboards by class, subject, and term.' },
  ];

  /* Pin styles: before = normal flow at top, pinned = fixed to viewport, after = parked at bottom */
  const panelStyle: React.CSSProperties = pinState === 'pinned'
    ? { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30 }
    : pinState === 'after'
    ? { position: 'absolute', bottom: 0, left: 0, right: 0 }
    : {};

  return (
    <div ref={containerRef} className="relative" style={{ height: '500vh' }}>
      <div className="h-[100dvh] flex flex-col justify-start pt-20 lg:pt-28 bg-[#FAFAF8]" style={panelStyle}>
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 border-b border-gray-200 pb-4">
            <div>
              <div className="section-tag mb-3"><span>How It Works</span></div>
              <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-gray-900" style={spaceGrotesk}>How BrainInk fits in your school</h2>
            </div>
            <p className="text-gray-400 max-w-sm mt-3 md:mt-0 text-[14px] leading-relaxed">Four steps from paper to insight — works with any school, any curriculum.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left — step list */}
            <div className="lg:col-span-5 space-y-1">
              {steps.map((step, i) => {
                const a = stepAccents[step.number];
                return (
                  <motion.div key={i} className="flex items-start gap-4 py-4" style={{ opacity: stepOpacities[i] }}>
                    <div className={`shrink-0 w-12 h-12 rounded-xl ${a.bg} border ${a.border} flex items-center justify-center`}>
                      <span className={`text-xl font-bold tracking-tighter ${a.text}`} style={spaceGrotesk}>{step.number}</span>
                    </div>
                    <div className="min-w-0">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md ${a.icon} mb-1.5 text-[10px]`}>
                        {step.icon}
                        <span className="font-mono uppercase tracking-wider opacity-70">Step {step.number}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 tracking-tight leading-snug" style={spaceGrotesk}>{step.title}</h3>
                      <p className="text-[13px] text-gray-500 leading-relaxed mt-0.5">{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Right — card stack with overflow clip so cards slide in from below */}
            <div className="lg:col-span-7 hidden lg:block relative rounded-2xl overflow-hidden p-3" style={{ height: 'clamp(420px, 58vh, 560px)' }}>
              {/* Card 1 — Upload (always visible, base layer) */}
              <div className="absolute inset-0 z-10 p-1" style={{ transform: 'rotate(-1.5deg)' }}>
                <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-lg h-full flex flex-col" style={{ boxShadow: '0 4px 20px rgba(59,130,246,0.12), 0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center"><Upload className="w-4 h-4 text-blue-600" /></div>
                    <div><div className="text-sm font-semibold text-gray-900">Papers uploaded</div><div className="text-xs text-gray-400 font-mono">24 files • S2 Mathematics</div></div>
                    <div className="ml-auto"><CheckCircle className="w-5 h-5 text-blue-500" /></div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 flex-1 content-start">
                    {[1,2,3,4,5,6,7,8].map(n => (
                      <div key={n} className="aspect-[3/4] rounded-lg bg-gradient-to-b from-blue-100/60 to-blue-50 border border-blue-100 flex items-center justify-center">
                        <div className="w-2/3 space-y-1.5"><div className="h-1 bg-blue-200 rounded-full" /><div className="h-1 bg-blue-200/60 rounded-full w-3/4" /><div className="h-1 bg-blue-200/40 rounded-full w-1/2" /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2 — Rubrics (slides up over card 1) */}
              <motion.div className="absolute inset-0 z-20 p-1" style={{ y: card2Y, rotate: card2Rotate }}>
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 h-full flex flex-col" style={{ boxShadow: '0 8px 30px rgba(16,185,129,0.15), 0 2px 8px rgba(0,0,0,0.08)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center"><FileCheck className="w-4 h-4 text-emerald-600" /></div>
                    <div><div className="text-sm font-semibold text-gray-900">Rubric applied</div><div className="text-xs text-gray-400 font-mono">S2 Algebra • 5 criteria</div></div>
                    <div className="ml-auto"><CheckCircle className="w-5 h-5 text-emerald-500" /></div>
                  </div>
                  <div className="space-y-3 flex-1">
                    {['Content accuracy', 'Problem solving', 'Methodology', 'Notation', 'Presentation'].map((label, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs">
                        <span className="w-28 text-gray-500 truncate">{label}</span>
                        <div className="flex-1 h-2 bg-emerald-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${95 - i * 8}%` }} /></div>
                        <span className="w-8 text-right font-mono text-gray-400">{95 - i * 8}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Card 3 — Results (slides up over card 2) */}
              <motion.div className="absolute inset-0 z-30 p-1" style={{ y: card3Y, rotate: card3Rotate }}>
                <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 h-full flex flex-col" style={{ boxShadow: '0 8px 30px rgba(245,158,11,0.15), 0 2px 8px rgba(0,0,0,0.08)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center"><Zap className="w-4 h-4 text-amber-600" /></div>
                    <div><div className="text-sm font-semibold text-gray-900">Results ready</div><div className="text-xs text-gray-400 font-mono">Feedback for 24 students</div></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center mb-4">
                    <div className="bg-white rounded-xl py-3 border border-amber-100"><div className="text-2xl font-bold text-gray-900" style={spaceGrotesk}>92%</div><div className="text-[10px] font-mono text-gray-400 uppercase tracking-wide">Average</div></div>
                    <div className="bg-white rounded-xl py-3 border border-amber-100"><div className="text-2xl font-bold text-gray-900" style={spaceGrotesk}>A-</div><div className="text-[10px] font-mono text-gray-400 uppercase tracking-wide">Median</div></div>
                    <div className="bg-white rounded-xl py-3 border border-emerald-100"><div className="text-2xl font-bold text-emerald-600" style={spaceGrotesk}>3m</div><div className="text-[10px] font-mono text-gray-400 uppercase tracking-wide">Time</div></div>
                  </div>
                  <div className="flex-1 bg-amber-50/60 rounded-xl p-4 border border-amber-100">
                    <div className="text-[10px] font-mono text-amber-600 uppercase tracking-wider mb-2">Sample feedback</div>
                    <p className="text-sm text-amber-800 leading-relaxed italic">&ldquo;Strong algebraic reasoning. Revisit quadratic factoring — try the AC method for cleaner solutions.&rdquo;</p>
                  </div>
                </div>
              </motion.div>

              {/* Card 4 — Dashboard (slides up over card 3) */}
              <motion.div className="absolute inset-0 z-40 p-1" style={{ y: card4Y, rotate: card4Rotate }}>
                <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-gray-950 to-gray-900 p-5 text-white h-full flex flex-col" style={{ boxShadow: '0 12px 40px rgba(139,92,246,0.2), 0 4px 12px rgba(0,0,0,0.15)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-violet-400" /></div>
                    <div><div className="text-sm font-semibold">School-wide dashboard</div><div className="text-xs text-gray-500 font-mono">Real-time performance</div></div>
                    <div className="ml-auto flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="font-mono text-[9px] text-emerald-400 uppercase">Live</span></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white/5 rounded-xl py-3 text-center border border-white/10"><div className="text-xl font-bold" style={spaceGrotesk}>342</div><div className="text-[9px] font-mono text-gray-500 uppercase">Students</div></div>
                    <div className="bg-white/5 rounded-xl py-3 text-center border border-white/10"><div className="text-xl font-bold" style={spaceGrotesk}>87%</div><div className="text-[9px] font-mono text-gray-500 uppercase">Pass rate</div></div>
                    <div className="bg-white/5 rounded-xl py-3 text-center border border-white/10"><div className="text-xl font-bold text-violet-400" style={spaceGrotesk}>+12%</div><div className="text-[9px] font-mono text-gray-500 uppercase">vs last term</div></div>
                  </div>
                  <div className="flex items-end gap-1 flex-1">
                    {[30, 45, 35, 60, 55, 70, 65, 80, 75, 85, 78, 90, 85, 92, 88, 95].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-500 to-violet-400" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2"><span className="text-[9px] text-gray-600 font-mono">Week 1</span><span className="text-[9px] text-gray-600 font-mono">Week 16</span></div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CapabilityCard: React.FC<{ icon: React.ReactNode; title: string; description: string; accent?: string; large?: boolean }> = ({ icon, title, description, accent = 'bg-stone-50', large = false }) => (
  <div className={`group relative ${large ? 'p-10' : 'p-8'} rounded-2xl border border-stone-200/80 bg-white hover:border-stone-300 transition-all duration-300 hover:shadow-lg overflow-hidden`}>
    <div className={`absolute inset-0 ${accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    <div className="relative z-10">
      <div className={`${large ? 'w-14 h-14 mb-8' : 'w-11 h-11 mb-6'} rounded-xl bg-stone-100 group-hover:bg-white flex items-center justify-center text-stone-500 group-hover:text-blue-600 transition-all duration-300 shadow-sm`}>{icon}</div>
      <h4 className={`font-semibold text-gray-900 mb-3 tracking-tight ${large ? 'text-2xl' : 'text-lg'}`} style={spaceGrotesk}>{title}</h4>
      <p className={`text-gray-500 leading-relaxed ${large ? 'text-base' : 'text-sm'}`}>{description}</p>
    </div>
  </div>
);

/* Bento capability cards — each with unique inline visual */
const BentoScan: React.FC = () => (
  <div className="group relative rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-10 overflow-hidden text-white h-full flex flex-col justify-between hover:shadow-2xl transition-shadow duration-500">
    <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
    <div className="absolute bottom-6 right-8 opacity-[0.07] pointer-events-none">
      <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="3" x2="9" y2="21" /></svg>
    </div>
    <div className="relative z-10">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm mb-6 text-xs font-mono uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Core feature
      </div>
      <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={spaceGrotesk}>Scan & grade<br />at speed</h3>
      <p className="text-blue-100 text-base leading-relaxed max-w-md">Batch scan stacks of papers or upload photos. AI reads handwriting and structured answers, returning results in seconds.</p>
    </div>
    <div className="relative z-10 flex items-center gap-6 mt-8">
      <div className="flex items-center gap-2"><div className="text-3xl font-bold" style={spaceGrotesk}>24</div><span className="text-xs text-blue-200 leading-tight">papers<br />per batch</span></div>
      <div className="w-px h-8 bg-white/20" />
      <div className="flex items-center gap-2"><div className="text-3xl font-bold" style={spaceGrotesk}>&lt;3s</div><span className="text-xs text-blue-200 leading-tight">average<br />per page</span></div>
    </div>
  </div>
);

const BentoRubrics: React.FC = () => (
  <div className="group relative rounded-3xl bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200 p-8 overflow-hidden h-full hover:border-stone-300 hover:shadow-lg transition-all duration-300">
    <div className="relative z-10">
      <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center mb-5 shadow-sm text-emerald-600 group-hover:scale-110 transition-transform"><FileCheck className="w-5 h-5" /></div>
      <h4 className="text-lg font-semibold text-gray-900 mb-2 tracking-tight" style={spaceGrotesk}>Rubrics & consistency</h4>
      <p className="text-sm text-gray-500 leading-relaxed mb-5">Build once, apply everywhere. Fair and standardized.</p>
    </div>
    {/* mini rubric mockup */}
    <div className="space-y-2 relative z-10">
      {['Content accuracy', 'Methodology', 'Presentation'].map((label, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-24 text-gray-400 truncate">{label}</span>
          <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${85 - i * 15}%` }} /></div>
        </div>
      ))}
    </div>
  </div>
);

const BentoFeedback: React.FC = () => (
  <div className="group relative rounded-3xl bg-white border border-stone-200 p-8 overflow-hidden h-full hover:border-amber-300 hover:shadow-lg transition-all duration-300">
    <div className="absolute -bottom-4 -right-4 w-28 h-28 bg-amber-100/50 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-200/60 transition-colors" />
    <div className="relative z-10">
      <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center mb-5 text-amber-600 group-hover:scale-110 transition-transform"><Clock className="w-5 h-5" /></div>
      <h4 className="text-lg font-semibold text-gray-900 mb-2 tracking-tight" style={spaceGrotesk}>Detailed feedback</h4>
      <p className="text-sm text-gray-500 leading-relaxed mb-5">Strengths, misconceptions, and next-step recs.</p>
      {/* feedback snippet mockup */}
      <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-100 text-xs text-amber-800 leading-relaxed italic">
        &ldquo;Strong algebraic reasoning. Revisit quadratic factoring — try the AC method.&rdquo;
      </div>
    </div>
  </div>
);

const BentoDashboard: React.FC = () => (
  <div className="group relative rounded-3xl bg-gray-950 p-8 overflow-hidden text-white h-full hover:shadow-2xl transition-shadow duration-300">
    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
    <div className="relative z-10 flex flex-col h-full">
      <div className="flex-1">
        <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-5 text-blue-400"><BarChart3 className="w-5 h-5" /></div>
        <h4 className="text-xl font-semibold mb-2 tracking-tight" style={spaceGrotesk}>Dashboards &<br />analytics</h4>
        <p className="text-sm text-gray-400 leading-relaxed">Live class and school views surface trends before they become problems.</p>
      </div>
      {/* mini chart mockup */}
      <div className="flex items-end gap-1.5 h-24 mt-6 pt-4 border-t border-white/10">
        {[40, 55, 35, 70, 60, 80, 75, 90, 85, 95, 88, 92].map((h, i) => (
          <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-blue-500 to-blue-400 group-hover:from-blue-400 group-hover:to-blue-300 transition-colors" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  </div>
);

const BentoPrivacy: React.FC = () => (
  <div className="group relative rounded-3xl bg-white border border-stone-200 p-8 overflow-hidden h-full hover:border-stone-300 hover:shadow-lg transition-all duration-300">
    <div className="relative z-10">
      <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center mb-5 text-rose-500 group-hover:scale-110 transition-transform"><Shield className="w-5 h-5" /></div>
      <h4 className="text-lg font-semibold text-gray-900 mb-2 tracking-tight" style={spaceGrotesk}>Privacy by design</h4>
      <p className="text-sm text-gray-500 leading-relaxed mb-4">Minimal footprint. Full encryption. Zero compromise.</p>
      <div className="flex flex-wrap gap-2">
        {['AES-256', 'SOC 2', 'GDPR'].map((tag) => (
          <span key={tag} className="px-2.5 py-1 rounded-full bg-stone-100 text-[10px] font-mono font-medium text-stone-500 uppercase tracking-wider">{tag}</span>
        ))}
      </div>
    </div>
  </div>
);

const BentoStudents: React.FC = () => (
  <div className="group relative rounded-3xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200/60 p-10 overflow-hidden h-full hover:shadow-lg transition-all duration-300">
    <div className="absolute top-0 right-0 w-40 h-40 bg-teal-200/30 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4 pointer-events-none" />
    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
      <div className="flex-1">
        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm text-teal-600 group-hover:scale-110 transition-transform"><GraduationCap className="w-6 h-6" /></div>
        <h4 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight" style={spaceGrotesk}>Student empowerment</h4>
        <p className="text-base text-gray-600 leading-relaxed">Clear, personalized insights turn feedback into a roadmap for growth.</p>
      </div>
      {/* student journey mockup */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-teal-100 min-w-[200px]">
        <div className="text-xs font-mono text-teal-600 mb-3 uppercase tracking-wider">Growth path</div>
        <div className="space-y-3">
          {[{ label: 'Algebra', pct: 92, color: 'bg-emerald-500' }, { label: 'Geometry', pct: 78, color: 'bg-teal-500' }, { label: 'Statistics', pct: 65, color: 'bg-amber-500' }].map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-xs">
              <span className="w-16 text-gray-500">{s.label}</span>
              <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden"><div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} /></div>
              <span className="text-gray-400 font-mono w-8 text-right">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const BentoEfficiency: React.FC = () => (
  <div className="group relative rounded-3xl bg-white border border-stone-200 p-8 overflow-hidden h-full hover:border-blue-200 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
    <div className="relative z-10">
      <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center mb-5 text-sky-600 group-hover:scale-110 transition-transform"><Users className="w-5 h-5" /></div>
      <h4 className="text-lg font-semibold text-gray-900 mb-2 tracking-tight" style={spaceGrotesk}>Teacher efficiency</h4>
      <p className="text-sm text-gray-500 leading-relaxed">Automated grading with the personal touch.</p>
    </div>
    <div className="mt-6 pt-4 border-t border-stone-100 relative z-10">
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold text-gray-900 tracking-tighter" style={spaceGrotesk}>10+</span>
        <span className="text-sm text-gray-400 ml-1">hrs saved / week</span>
      </div>
    </div>
  </div>
);

const BentoRecords: React.FC = () => (
  <div className="group relative rounded-3xl bg-stone-900 p-8 overflow-hidden text-white h-full hover:shadow-xl transition-all duration-300">
    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 8px)' }} />
    <div className="relative z-10">
      <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-5 text-stone-300"><Shield className="w-5 h-5" /></div>
      <h4 className="text-lg font-semibold mb-2 tracking-tight" style={spaceGrotesk}>Records & credentials</h4>
      <p className="text-sm text-stone-400 leading-relaxed mb-4">Tamper-evident storage. Export term reports or transcripts anytime.</p>
      <div className="flex items-center gap-2 text-xs text-stone-500"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Blockchain-verified</div>
    </div>
  </div>
);

const TestimonialCard: React.FC<{ id: string; quote: string; name: string; role: string; imgPath: string; accent: string }> = ({ id, quote, name, role, imgPath, accent }) => (
  <div className="bg-white p-8 border border-stone-200 shadow-sm relative group hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 rounded-2xl">
    <div className={`absolute top-0 left-0 w-full h-1.5 ${accent} group-hover:h-2 transition-all`} style={{ borderRadius: '1rem 1rem 0 0' }} />
    <div className="font-mono text-xs text-gray-400 mb-6">{id}</div>
    <blockquote className="text-xl font-medium text-gray-900 mb-8 leading-relaxed">&ldquo;{quote}&rdquo;</blockquote>
    <div className="flex items-center gap-4">
      <img src={imgPath} alt={name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" loading="lazy" decoding="async" />
      <div><div className="text-sm font-bold text-gray-900">{name}</div><div className="text-xs text-gray-500">{role}</div></div>
    </div>
  </div>
);

const FAQItem: React.FC<{ question: string; answer: string | null; isOpen: boolean; onClick: () => void; index: number }> = ({ question, answer, isOpen, onClick, index }) => (
  <div className={`group cursor-pointer transition-all duration-300 ${isOpen ? 'bg-white rounded-2xl shadow-md border border-stone-200 p-6' : 'border-b border-stone-200/80 px-2 py-5 hover:px-4 hover:bg-stone-50/50 hover:rounded-xl'}`} onClick={onClick}>
    <div className="flex items-start gap-4">
      <span className={`font-mono text-xs mt-1 min-w-[2rem] transition-colors ${isOpen ? 'text-blue-600' : 'text-stone-300'}`}>{String(index + 1).padStart(2, '0')}</span>
      <div className="flex-1">
        <h3 className={`flex items-center justify-between font-medium transition-colors ${isOpen ? 'text-gray-900 text-lg' : 'text-gray-700'}`} style={spaceGrotesk}>
          {question}
          <span className={`ml-4 w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-all duration-300 ${isOpen ? 'bg-blue-600 text-white rotate-45' : 'bg-stone-100 text-stone-400 group-hover:bg-stone-200'}`}>+</span>
        </h3>
        {isOpen && answer && (
          <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mt-3 text-gray-500 leading-relaxed text-[15px]">{answer}</motion.p>
        )}
      </div>
    </div>
  </div>
);

const BottomSection: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState(0);
  const faqs = [
    { question: 'How does grading work?', answer: 'Teachers scan or upload student work. BrainInk processes responses, applies rubrics, and returns detailed feedback instantly.' },
    { question: 'Is student data safe?', answer: 'Yes. BrainInk uses encryption in transit and at rest, minimal data footprint, and principle of least privilege architecture.' },
    { question: 'Which levels are supported?', answer: 'BrainInk supports primary, secondary, and tertiary education levels with customizable rubrics for each.' },
    { question: 'Do you support pilots?', answer: 'Absolutely. We offer a free pilot program for schools wanting to trial BrainInk before committing.' },
  ];

  return (
    <>
    <HowItWorksSection />
    <section className="relative noise-bg cool-glow bg-white">
      <div className="absolute inset-0 dot-grid-bg opacity-30 pointer-events-none" />
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-12 flex flex-col gap-32 pb-24">

        {/* Visual break — wide image strip with zoom parallax */}
        <ZoomParallax className="rounded-[2rem] min-h-[280px] md:min-h-[340px]" imageUrl="/images/brainink-wide.webp">
          <div className="relative rounded-[2rem] overflow-hidden group">
            <div className="aspect-[21/6] md:aspect-[21/5]">
              <div className="absolute inset-0 bg-gradient-to-r from-stone-900/50 via-stone-900/20 to-transparent z-10" />
              <div className="absolute bottom-6 left-8 md:bottom-8 md:left-12 z-20">
                <p className="font-mono text-[10px] text-white/60 uppercase tracking-widest mb-1">BrainInk in schools</p>
                <p className="text-white text-lg md:text-2xl font-semibold tracking-tight" style={spaceGrotesk}>Where technology meets the classroom</p>
              </div>
              {/* Corner accents */}
              <div className="absolute top-4 right-4 w-10 h-10 border-r border-t border-white/20 pointer-events-none z-20" />
              <div className="absolute bottom-4 right-4 w-10 h-10 border-r border-b border-white/20 pointer-events-none z-20" />
            </div>
          </div>
        </ZoomParallax>

        {/* Capabilities — expressive bento grid */}
        <div>
          <div className="max-w-3xl mx-auto text-center mb-16">
            <ScrollReveal><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100 mb-6"><span className="w-2 h-2 rounded-full bg-blue-600" /><span className="font-mono text-xs font-medium uppercase tracking-wider text-blue-700">Capabilities</span></div></ScrollReveal>
            <TextReveal text="What you can do with BrainInk" className="text-4xl md:text-5xl font-medium tracking-tight mb-6" />
            <ScrollReveal delay={0.15}><p className="text-gray-500 text-lg leading-relaxed">Speed, consistency, and insight for everyday assessment.</p></ScrollReveal>
          </div>
          {/* Bento grid with explicit placement */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ gridTemplateRows: 'auto auto auto' }}>
            <motion.div className="lg:col-span-1 lg:row-span-2" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 80, damping: 20 }}>
              <BentoScan />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.06 }}>
              <BentoRubrics />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.12 }}>
              <BentoFeedback />
            </motion.div>
            <motion.div className="lg:row-span-2" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.18 }}>
              <BentoDashboard />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.24 }}>
              <BentoRecords />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.3 }}>
              <BentoPrivacy />
            </motion.div>
            <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.36 }}>
              <BentoStudents />
            </motion.div>
            <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.42 }}>
              <BentoEfficiency />
            </motion.div>
          </div>
        </div>

        {/* Dark stats section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gray-900 skew-y-1 transform rounded-[2rem] z-0" />
          <div className="relative z-10 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white rounded-[2rem] p-12 md:p-20 overflow-hidden shadow-2xl ring-1 ring-white/5">
            <div className="absolute top-0 left-0 right-0 h-full opacity-10" style={darkGridBg} />
            {/* Background image for texture */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'url(/images/brainink-stats.png)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'grayscale(100%)' }} />
            {/* Ambient accent glow inside dark card */}
            <div className="absolute top-[-50px] left-[20%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none animate-blob-drift" />
            <div className="absolute bottom-[-50px] right-[10%] w-[200px] h-[200px] bg-blue-500/8 rounded-full blur-[60px] pointer-events-none" style={{ animationDelay: '-8s' }} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
              <motion.div className="flex flex-col border-b md:border-b-0 md:border-r border-gray-800 pb-10 md:pb-0" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 80, damping: 20 }}>
                <span className="font-mono text-xs text-blue-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2"><span className="w-1 h-1 bg-blue-400 rounded-full" /> Time Savings</span>
                <div className="flex items-baseline"><h3 className="text-8xl font-bold tracking-tighter" style={spaceGrotesk}><CountUp target={10} duration={2000} /></h3><span className="text-4xl font-light text-gray-500 ml-2">+ hrs</span></div>
                <p className="text-gray-400 mt-4 text-sm font-mono border-t border-gray-800 pt-4">Teacher time saved per week</p>
              </motion.div>
              <motion.div className="flex flex-col border-b md:border-b-0 md:border-r border-gray-800 pb-10 md:pb-0 md:pl-10" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.15 }}>
                <span className="font-mono text-xs text-blue-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2"><span className="w-1 h-1 bg-blue-400 rounded-full" /> Velocity</span>
                <div className="flex items-baseline"><h3 className="text-8xl font-bold tracking-tighter" style={spaceGrotesk}><CountUp target={3} duration={1500} /><span className="text-blue-500">x</span></h3></div>
                <p className="text-gray-400 mt-4 text-sm font-mono border-t border-gray-800 pt-4">Faster feedback turnaround</p>
              </motion.div>
              <motion.div className="flex flex-col md:pl-10" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.3 }}>
                <span className="font-mono text-xs text-blue-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2"><span className="w-1 h-1 bg-blue-400 rounded-full" /> Visibility</span>
                <div className="flex flex-col"><h3 className="text-7xl font-bold tracking-tighter leading-none" style={spaceGrotesk}>REAL</h3><h3 className="text-7xl font-bold tracking-tighter leading-none text-gray-600" style={spaceGrotesk}>TIME</h3></div>
                <p className="text-gray-400 mt-4 text-sm font-mono border-t border-gray-800 pt-4">For principals and HoDs</p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Testimonials — staggered horizontal reveal */}
        <div>
          <div className="flex items-end justify-between mb-12">
            <div>
              <ScrollReveal><span className="font-mono text-[10px] text-stone-400 uppercase tracking-[0.2em] block mb-3">Social proof</span></ScrollReveal>
              <TextReveal text="What educators are saying" className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900" />
            </div>
            <ScrollReveal delay={0.1}><span className="hidden md:block h-px w-32 bg-gradient-to-r from-stone-200 to-transparent" /></ScrollReveal>
          </div>
          <StaggerOnScroll className="grid grid-cols-1 md:grid-cols-3 gap-8" stagger={0.15} direction="left">
            <TestimonialCard id="ID: TEACHER_MATH_S2" quote="I graded three classes before lunch. The feedback is clearer than ever." name="Odette Murenzi" role="Math Teacher, S2" imgPath="/images/teacher-odette.webp" accent="bg-blue-500" />
            <TestimonialCard id="ID: HEAD_TEACHER" quote="We finally see progress across departments at a glance." name="Jean-Pierre Habimana" role="Head Teacher" imgPath="/images/headteacher-jp.webp" accent="bg-stone-800" />
            <TestimonialCard id="ID: DIR_STUDIES" quote="Parents now understand strengths and gaps without meetings." name="Grace Uwimana" role="Director of Studies" imgPath="/images/director-grace.webp" accent="bg-blue-600" />
          </StaggerOnScroll>
        </div>

        {/* FAQ + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 pb-20">
          <div className="lg:col-span-7">
            <ScrollReveal>
              <div className="mb-10">
                <span className="font-mono text-[10px] text-stone-400 uppercase tracking-[0.2em] block mb-3">Support</span>
                <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-gray-900" style={spaceGrotesk}>Frequently Asked<br />Questions</h2>
              </div>
            </ScrollReveal>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <FAQItem key={i} question={faq.question} answer={faq.answer} isOpen={openFAQ === i} onClick={() => setOpenFAQ(openFAQ === i ? -1 : i)} index={i} />
              ))}
            </div>
            <ScrollReveal delay={0.2}>
              <div className="mt-8 pl-2"><Link to="/help" className="inline-flex items-center gap-3 text-blue-600 font-medium text-sm hover:gap-4 transition-all group">Visit Help Center <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></Link></div>
            </ScrollReveal>
          </div>
          <ScrollFade direction="in" className="lg:col-span-5 flex flex-col gap-5 lg:pt-20">
            <div className="rounded-2xl border border-stone-200/80 bg-gradient-to-br from-white to-stone-50 p-8 shadow-sm">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-5 text-blue-600"><LayoutGrid className="w-5 h-5" /></div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg tracking-tight" style={spaceGrotesk}>Works with your systems</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Use BrainInk alongside your existing workflows. Bulk scans from phone or copier, and export reports for records.</p>
            </div>
            <div className="rounded-2xl border border-stone-200/80 bg-gradient-to-br from-white to-stone-50 p-8 shadow-sm">
              <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center mb-5 text-emerald-600"><Building2 className="w-5 h-5" /></div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg tracking-tight" style={spaceGrotesk}>Built for African classrooms</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Offline-friendly flows, simple onboarding, and training included. Built in Rwanda by a Pan-African team.</p>
            </div>
            <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-8 text-center">
              <p className="text-sm text-blue-800/70 font-medium mb-3">Still have questions?</p>
              <Link to="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Talk to our team <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          </ScrollFade>
        </div>
      </div>
    </section>
    </>
  );
};

/* ── Dramatic CTA Section ── */
const CTASection: React.FC = () => (
  <section className="relative w-full overflow-hidden">
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <div className="relative rounded-[2.5rem] overflow-hidden min-h-[480px] flex items-center">
        {/* Background image */}
        <img
          src="/images/brainink-cta.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-[1.08] origin-top-left"
          loading="lazy"
          decoding="async"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700/90 via-blue-600/80 to-blue-500/60" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={gridPattern} />
        {/* Decorative elements */}
        <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-white/20 pointer-events-none" />
        <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-white/20 pointer-events-none" />
        {/* Large circle accent */}
        <svg className="absolute right-[-80px] top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-10 pointer-events-none" viewBox="0 0 400 400"><circle cx="200" cy="200" r="190" stroke="white" strokeWidth="1" fill="none" /><circle cx="200" cy="200" r="140" stroke="white" strokeWidth="0.5" fill="none" strokeDasharray="6 8" /></svg>
        
        {/* Content */}
        <div className="relative z-10 px-8 md:px-16 py-16 max-w-3xl">
          <p className="font-mono text-xs text-blue-200 uppercase tracking-[0.3em] mb-6">Ready to transform assessment?</p>
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[0.95] mb-6" style={spaceGrotesk}>
            Start grading<br />smarter today.
          </h2>
          <p className="text-lg text-blue-100 font-light leading-relaxed max-w-xl mb-10">
            Join schools across Africa already using BrainInk to save time, improve feedback, and drive student success.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/get-started" className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-full font-semibold text-lg hover:bg-blue-50 transition-all shadow-xl active:scale-[0.98]">
              Get Started Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white rounded-full font-medium text-lg hover:bg-white/10 transition-all backdrop-blur-sm">
              Book a Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ────────────────────────────────────────
   Main HomePage
   ──────────────────────────────────────── */
const HomePage: React.FC = () => {
  return (
    <SmoothScroll>
    <div className="min-h-screen flex flex-col relative bg-[#FAFAF8] text-[#1D1D1F]" style={{ overflowX: 'clip' }}>
      {/* Fixed grain overlay for print-like texture */}
      <div className="grain-overlay" />
      {/* Ambient hero glow — now more visible */}
      <div className="absolute top-0 left-[10%] w-[800px] h-[600px] bg-gradient-to-br from-blue-100/60 via-blue-50/30 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      {/* Secondary accent — visible warm blob */}
      <div className="absolute top-[400px] right-[-200px] w-[600px] h-[600px] bg-gradient-to-bl from-blue-100/50 to-transparent rounded-full blur-3xl -z-10 pointer-events-none animate-blob-drift" />
      {/* Third accent — lower page */}
      <div className="absolute top-[1200px] left-[-100px] w-[500px] h-[500px] bg-gradient-to-tr from-stone-200/40 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <MarketingHeader />
      <HeroSection />
      {/* Each section now uses creative scroll effects internally instead of simple fade-in wrappers */}
      <ExperienceSection />
      <FeatureCardsAndDemoSection />
      <BottomSection />
      <ScrollScale scaleRange={[0.92, 1]}>
        <CTASection />
      </ScrollScale>
      <MarketingFooter />
    </div>
    </SmoothScroll>
  );
};

export default HomePage;