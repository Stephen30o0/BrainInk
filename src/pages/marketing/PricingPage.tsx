import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MarketingHeader from '../../components/marketing/MarketingHeader';
import MarketingFooter from '../../components/marketing/MarketingFooter';
import { ScrollReveal } from '../../components/marketing/ScrollReveal';
import { Link } from 'react-router-dom';


/* ── Custom Styles ──────────────────────────────────────────── */
const customStyles = {
  gridPattern: {
    backgroundSize: '40px 40px',
    backgroundImage:
      'linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px)',
  },
  glassPanel: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow:
      '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255,255,255, 0.8)',
  },
};

/* ── Icon helper ────────────────────────────────────────────── */
const Icon = ({ name, className = 'w-6 h-6', style }: { name: string; className?: string; style?: React.CSSProperties }) => {
  const icons: Record<string, React.ReactNode> = {
    zap: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    sprout: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 20h10" /><path d="M10 20c5.5-2.5.8-6.4 3-10" />
        <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
        <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
      </svg>
    ),
    'bar-chart-2': (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    star: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    building: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" />
        <path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" />
        <path d="M8 10h.01" /><path d="M8 14h.01" />
      </svg>
    ),
    check: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    'arrow-right': (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
      </svg>
    ),
    'flask-conical': (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
        <path d="M8.5 2h7" /><path d="M7 16h10" />
      </svg>
    ),
    info: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  };
  return <>{icons[name] || null}</>;
};

/* ── Feature Card ───────────────────────────────────────────── */
const FeatureCard = ({
  icon,
  iconColor,
  borderColor,
  title,
  description,
  moduleId,
}: {
  icon: string;
  iconColor: string;
  borderColor: string;
  title: string;
  description: string;
  moduleId: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={customStyles.glassPanel}
      className={`p-6 rounded-3xl transition-all duration-300 group cursor-default flex-1 border-l-4 ${borderColor} hover:bg-white`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 ${iconColor} rounded-2xl transition-transform duration-300 shadow-inner`}
          style={{ transform: isHovered ? 'rotate(6deg)' : 'rotate(0deg)' }}
        >
          <Icon name={icon} className="w-6 h-6" />
        </div>
        <span
          className="text-[10px] font-bold text-stone-300 bg-stone-50 px-2 py-1 rounded"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          {moduleId}
        </span>
      </div>
      <h3
        className="text-2xl mb-2 font-semibold tracking-tight transition-colors"
        style={{
          color: isHovered
            ? iconColor.includes('blue')
              ? '#2563EB'
              : iconColor.includes('stone')
              ? '#57534e'
              : '#2563EB'
            : '#1a1a1a',
        }}
      >
        {title}
      </h3>
      <p className="text-sm text-stone-600 leading-relaxed">{description}</p>
    </div>
  );
};

/* ── CheckList Item ─────────────────────────────────────────── */
const CheckListItem = ({ title, subtitle }: { title: string; subtitle: string }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <li
      className="flex items-start gap-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="mt-1 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/30 transition-transform"
        style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
      >
        <Icon name="check" className="w-3.5 h-3.5 text-white" />
      </div>
      <div>
        <span className="font-medium block text-lg">{title}</span>
        <span className="text-sm text-stone-500 font-light">{subtitle}</span>
      </div>
    </li>
  );
};

/* ── Pricing Page ───────────────────────────────────────────── */
export const PricingPage: React.FC = () => {
  const [customPlanHovered, setCustomPlanHovered] = useState(false);
  const [getStartedHovered, setGetStartedHovered] = useState(false);
  const [pilotSectionHovered, setPilotSectionHovered] = useState(false);



  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900 relative">

      <div className="grain-overlay" />
      <MarketingHeader />

      {/* Pricing Content */}
      <div
        className="flex flex-col items-center justify-center px-4 sm:px-6 md:px-12 pt-24 sm:pt-28 md:pt-32 pb-12 md:pb-20 overflow-x-hidden relative noise-bg"
        style={customStyles.gridPattern}
      >
        {/* Ambient background glows */}
        <div className="absolute top-0 left-[20%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-stone-100/30 rounded-full blur-[100px] pointer-events-none animate-blob-drift" />
        <main className="max-w-7xl w-full flex flex-col gap-8 md:gap-12">
          {/* Header */}
          <ScrollReveal>
          <header className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="section-tag">
              <span>Pricing</span>
            </div>

            <h1
              className="text-4xl sm:text-5xl md:text-7xl text-stone-900 tracking-tighter font-bold"
              style={{ lineHeight: '0.95' }}
            >
              Simple pricing <br />
              <span className="text-stone-400 font-light">for schools.</span>
            </h1>

            <div className="flex flex-col items-center gap-2">
              <p className="text-base sm:text-lg md:text-xl text-stone-600 font-light leading-relaxed max-w-2xl mx-auto">
                Save teachers time, give students clarity, and give leaders real-time insight.
              </p>
              <div className="h-px w-24 bg-stone-300 mt-4 mb-2" />
              <p
                className="text-[10px] md:text-xs text-stone-400 uppercase tracking-widest"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                // Built in Rwanda for African Classrooms //
              </p>
            </div>
          </header>
          </ScrollReveal>

          {/* Feature Cards + Custom Pricing Card */}
          <ScrollReveal delay={0.15}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: Feature cards */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <FeatureCard
                icon="zap"
                iconColor="bg-blue-50 text-blue-600"
                borderColor="border-l-blue-500/0 hover:border-l-blue-500"
                title="Instant Grading"
                description="AI-powered grading with rubrics for consistent, fair assessment."
                moduleId="MOD-01"
              />
              <FeatureCard
                icon="sprout"
                iconColor="bg-blue-50/70 text-blue-500"
                borderColor="border-l-blue-400/0 hover:border-l-blue-400"
                title="Student Growth"
                description="Individual dashboards track progress and provide actionable feedback."
                moduleId="MOD-02"
              />
              <FeatureCard
                icon="bar-chart-2"
                iconColor="bg-stone-100 text-stone-600"
                borderColor="border-l-stone-400/0 hover:border-l-stone-400"
                title="School Analytics"
                description="Real-time insights across classes, subjects, and terms."
                moduleId="MOD-03"
              />
            </div>

            {/* Right: Dark Custom plan card */}
            <div className="lg:col-span-8 h-full min-h-[500px]">
              <div
                className="h-full bg-[#111] text-white rounded-[2rem] p-6 sm:p-8 md:p-12 relative overflow-hidden flex flex-col justify-between shadow-2xl border border-stone-800 group"
                onMouseEnter={() => setCustomPlanHovered(true)}
                onMouseLeave={() => setCustomPlanHovered(false)}
              >
                {/* Glow effects */}
                <div
                  className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none transition-opacity duration-700"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    opacity: customPlanHovered ? 0.8 : 0.5,
                  }}
                />
                <div
                  className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none transition-opacity duration-700"
                  style={{
                    background: 'rgba(37, 99, 235, 0.1)',
                    opacity: customPlanHovered ? 1 : 0.5,
                  }}
                />

                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-md border shadow-lg mb-4"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(12px)',
                          borderColor: 'rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <Icon name="star" className="w-3 h-3 text-yellow-400" />
                        <span
                          className="text-[10px] font-bold tracking-widest"
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            color: 'rgba(255, 255, 255, 0.9)',
                          }}
                        >
                          MOST POPULAR
                        </span>
                      </div>
                      <h2
                        className="text-5xl sm:text-6xl md:text-7xl mb-2 tracking-tighter font-bold"
                      >
                        Custom
                      </h2>
                      <p className="text-stone-400 text-base sm:text-lg font-light max-w-md">
                        Tailored solutions for large institutions and districts.
                      </p>
                    </div>

                    <div
                      className="hidden md:flex items-center justify-center w-20 h-20 rounded-full border"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Icon name="building" className="w-8 h-8 text-white" style={{ opacity: 0.4 }} />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
                    <ul className="space-y-6">
                      <CheckListItem title="Everything in Standard" subtitle="All core features included" />
                      <CheckListItem title="Security & SSO" subtitle="Enterprise-grade protection" />
                      <CheckListItem title="Admin Controls" subtitle="Advanced user management" />
                    </ul>
                    <ul className="space-y-6">
                      <CheckListItem title="Custom Integrations" subtitle="API access and support" />
                      <CheckListItem title="Dedicated Support" subtitle="24/7 priority account manager" />
                      <CheckListItem title="Training & Onboarding" subtitle="Complete program for staff" />
                    </ul>
                  </div>
                </div>

                <Link
                  to="/get-started"
                  className="relative z-10 w-full bg-white text-black py-4 sm:py-5 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 no-underline"
                  onMouseEnter={() => setGetStartedHovered(true)}
                  onMouseLeave={() => setGetStartedHovered(false)}
                  style={{
                    backgroundColor: getStartedHovered ? '#f3f4f6' : '#ffffff',
                    transform: getStartedHovered ? 'scale(0.99)' : 'scale(1)',
                  }}
                >
                  <span>Get Started Now</span>
                  <Icon
                    name="arrow-right"
                    className="w-5 h-5 transition-transform"
                    style={{ transform: getStartedHovered ? 'translateX(4px)' : 'translateX(0)' }}
                  />
                </Link>
              </div>
            </div>
          </div>
          </ScrollReveal>

          {/* Pilot Program Section */}
          <ScrollReveal delay={0.1}>
          <div
            className="w-full bg-white border border-stone-200 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-14 shadow-lg relative overflow-hidden section-accent-top"
            onMouseEnter={() => setPilotSectionHovered(true)}
            onMouseLeave={() => setPilotSectionHovered(false)}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                opacity: 0.05,
              }}
            />

            <div
              className="absolute -right-20 -top-20 w-64 h-64 bg-yellow-100 rounded-full blur-3xl opacity-50 transition-transform duration-700"
              style={{ transform: pilotSectionHovered ? 'scale(1.1)' : 'scale(1)' }}
            />

            <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-20 items-center justify-between">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-lg">
                    <Icon name="flask-conical" className="w-6 h-6" />
                  </div>
                  <h2
                    className="text-3xl sm:text-4xl md:text-5xl text-stone-900 font-bold tracking-tight"
                  >
                    Pilot Program
                  </h2>
                </div>

                <p className="text-stone-600 text-base sm:text-lg md:text-xl font-light leading-relaxed max-w-2xl">
                  Run a pilot with selected teachers before full implementation. During the trial period, schools
                  contribute{' '}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-yellow-100 border border-yellow-200 text-yellow-800 font-semibold mx-1 text-base transform -translate-y-0.5">
                    30% of the standard fee
                  </span>
                  .
                </p>

                <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl border border-stone-100 max-w-xl">
                  <Icon name="info" className="w-5 h-5 text-stone-400 mt-0.5 shrink-0" />
                  <p
                    className="text-sm text-stone-500"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    Complete onboarding, training, and support included to ensure successful adoption across your
                    institution.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full lg:w-auto">
                <Link
                  to="/get-started"
                  className="px-8 py-4 bg-stone-900 text-white rounded-xl font-medium hover:bg-black hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 min-w-[200px] no-underline"
                >
                  Start Pilot Program
                </Link>
                <Link
                  to="/contact"
                  className="px-8 py-4 bg-transparent border border-stone-300 text-stone-700 rounded-xl font-medium hover:border-stone-900 hover:text-stone-900 transition-colors flex items-center justify-center gap-2 min-w-[200px] no-underline"
                >
                  Schedule Demo
                </Link>
              </div>
            </div>
          </div>
          </ScrollReveal>
        </main>
      </div>

      <MarketingFooter />
    </div>
  );
};

export default PricingPage;
