import React from 'react';
import MarketingHeader from '../../components/marketing/MarketingHeader';
import MarketingFooter from '../../components/marketing/MarketingFooter';
import DisplayCards from '../../components/ui/display-cards';
import { GradingProcessPinDemo } from '../../components/ui/grading-process-pin-demo';
import BrainInkCapabilities from '@/components/ui/brainink-capabilities';
import { Link } from 'react-router-dom';
import { GraduationCap, Users, Building2, FileCheck2, BarChart3, Upload, Sparkles, TrendingUp, Zap } from 'lucide-react';

const GradientOrb: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <div className={`absolute rounded-full blur-3xl opacity-30 ${className}`} style={style} />
);

// Soft floating tile ("keycap"-like) used decoratively in hero
const SoftFloat: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className = '', children }) => (
  <div
    className={`pointer-events-none select-none absolute grid place-items-center rounded-2xl bg-white/80 backdrop-blur-md border border-white/70 shadow-[0_20px_50px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5 ${className}`}
  >
    <div className="text-slate-500 opacity-80">{children}</div>
  </div>
);

// IntersectionObserver-based reveal
const useInView = (rootMargin = '0px 0px -10% 0px') => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { root: null, rootMargin, threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);
  return { ref, visible } as const;
};

const Reveal: React.FC<{ delay?: number; y?: number; x?: number; className?: string; children: React.ReactNode }>
  = ({ delay = 0, y = 24, x = 0, className = '', children }) => {
    const { ref, visible } = useInView();
    const style: React.CSSProperties = {
      transition: 'opacity 500ms ease, transform 600ms cubic-bezier(0.22,1,0.36,1)',
      transitionDelay: `${delay}ms`,
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : `translate3d(${x}px, ${y}px, 0) scale(0.98)`,
      willChange: 'opacity, transform'
    };
    return (
      <div ref={ref} style={style} className={className}>
        {children}
      </div>
    );
  };

type StepProps = { step: string; title: string; desc: string };
const StepCard: React.FC<StepProps> = ({ step, title, desc }) => {
  const [tilt, setTilt] = React.useState<string>('perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)');
  const onMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const rx = ((y - r.height / 2) / r.height) * -6; // tilt up/down
    const ry = ((x - r.width / 2) / r.width) * 6; // tilt left/right
    setTilt(`perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`);
  };
  const onLeave = () => setTilt('perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)');

  return (
    <div
      className="group relative"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transform: tilt, transition: 'transform 200ms ease' }}
    >
      {/* glow */}
      <div className="pointer-events-none absolute -inset-0.5 rounded-3xl opacity-0 group-hover:opacity-100 transition duration-500" style={{
        background: 'radial-gradient(400px circle at 50% -10%, rgba(59,130,246,0.18), transparent 40%)'
      }} />
      <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:border-slate-300">
        <div className="h-8 w-8 rounded-md bg-slate-900 text-white grid place-items-center text-sm font-semibold mb-3">{step}</div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-slate-600 mt-1">{desc}</p>
      </div>
    </div>
  );
};

export const HomePage: React.FC = () => {
  const [mouse, setMouse] = React.useState({ x: 0, y: 0 });
  const heroRef = React.useRef<HTMLElement | null>(null);
  const [progress, setProgress] = React.useState(0);
  const onHeroMouseMove: React.MouseEventHandler<HTMLElement> = (e) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    setMouse({ x: dx, y: dy });
  };
  React.useEffect(() => {
    const onScroll = () => {
      const el = heroRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress from 0 when hero fully in view to 1 as we approach the next section
      const start = 0; // top aligned
      const end = Math.max(1, rect.height - vh * 0.5);
      const raw = (vh - rect.bottom - start) / end;
      const p = Math.min(1, Math.max(0, raw));
      setProgress(p);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />

      {/* Hero */}
      <section ref={heroRef as any} className="relative overflow-hidden" onMouseMove={onHeroMouseMove} style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* subtle radial background for character */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(59,130,246,0.14),transparent_60%)]" />
        <GradientOrb className="w-[40rem] h-[40rem] bg-blue-200 -top-40 -left-20" style={{ transform: `translate3d(${mouse.x * -20}px, ${mouse.y * -10}px, 0)` }} />
        <GradientOrb className="w-[30rem] h-[30rem] bg-indigo-200 top-10 -right-24" style={{ transform: `translate3d(${mouse.x * 25}px, ${mouse.y * 12}px, 0)` }} />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal className="relative max-w-4xl pt-28 pb-10 sm:pb-16 mx-auto text-center" >
            <p className="text-blue-600 text-sm font-semibold">For schools across Africa</p>
            <h1 className="mt-4 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-slate-900" style={{
              transform: `translateY(${progress * -20}px) scale(${1.06 - progress * 0.04})`,
              transition: 'transform 200ms ease',
              willChange: 'transform',
              textShadow: '0 1px 0 rgba(255,255,255,0.7), 0 18px 40px rgba(15,23,42,0.18)'
            }}>
              Smart classrooms start
              <br />
              with smart feedback.
            </h1>
            {/* decorative soft divider lines behind heading */}
            <div aria-hidden className="absolute left-1/2 -translate-x-1/2 mt-4 w-[92%] max-w-3xl">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-slate-300/50 to-transparent" />
              <div className="mt-2 h-[1px] bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />
            </div>
            <p className="mt-4 text-slate-600 text-lg max-w-3xl mx-auto">
              BrainInk is a Rwandan‑built platform that saves teachers hours on grading and gives students, parents, and principals clear,
              actionable feedback. Built by a Pan‑African team for real classrooms.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/get-started" className="px-5 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-[0_10px_24px_rgba(15,23,42,0.25)] ring-1 ring-slate-900/10 hover:translate-y-[-1px] transition will-change-transform">Get Started</Link>
              <Link to="/pricing" className="px-5 py-3 rounded-xl bg-blue-600 text-white text-sm shadow-[0_10px_24px_rgba(59,130,246,0.35)] ring-1 ring-blue-700/20 hover:bg-blue-600/90 hover:translate-y-[-1px] transition will-change-transform">See pricing</Link>
            </div>
          </Reveal>
          <div className="mt-6 sm:mt-10 relative group" style={{
            transform: `translateY(${(1 - progress) * 24}px)`,
            opacity: 0.85 + progress * 0.15,
            transition: 'transform 200ms ease, opacity 200ms ease',
            willChange: 'transform, opacity'
          }}>
            {/* Floating shadow effect */}
            <div className="absolute inset-0 rounded-3xl shadow-[0_25px_60px_rgba(15,23,42,0.2)] group-hover:shadow-[0_35px_80px_rgba(15,23,42,0.25)] transition-shadow duration-500" />
            
            <Reveal>
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 backdrop-blur-sm" style={{
                clipPath: 'inset(50px 0 35px 0)',
                borderRadius: '1.5rem'
              }}>
                <video
                  ref={(el) => {
                    if (el) {
                      const handleMouseEnter = () => {
                        el.play().catch(() => {
                          // Handle autoplay restrictions gracefully
                        });
                      };
                      const handleMouseLeave = () => {
                        el.pause();
                      };
                      
                      const container = el.closest('.group');
                      if (container) {
                        container.addEventListener('mouseenter', handleMouseEnter);
                        container.addEventListener('mouseleave', handleMouseLeave);
                        
                        return () => {
                          container.removeEventListener('mouseenter', handleMouseEnter);
                          container.removeEventListener('mouseleave', handleMouseLeave);
                        };
                      }
                    }
                  }}
                  className="aspect-[16/9] w-full object-cover"
                  muted
                  loop
                  playsInline
                  poster=""
                >
                  <source src="/video/Brain Ink Teacher Dashboard and Student study Center Demo video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                
                {/* Subtle overlay for better text visibility if needed */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                
                {/* Play indicator that shows on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                    <div className="w-8 h-8 text-white flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs">
            <div className="h-5 w-3 rounded-full border border-slate-300 relative overflow-hidden">
              <div className="absolute left-1/2 -translate-x-1/2 top-1 h-2 w-1 rounded bg-slate-400 animate-[bounce_1.5s_infinite]" />
            </div>
            <span>Scroll</span>
          </div>
        </div>

        {/* floating decorative tiles */}
        <SoftFloat className="size-20 sm:size-24 right-6 sm:right-16 top-2 sm:top-12 rotate-6">
          <Upload className="w-7 h-7" />
        </SoftFloat>
        <SoftFloat className="size-16 sm:size-20 left-4 sm:left-12 bottom-10 -rotate-6">
          <FileCheck2 className="w-6 h-6" />
        </SoftFloat>
        <SoftFloat className="size-24 sm:size-28 right-24 bottom-6 rotate-3">
          <BarChart3 className="w-8 h-8" />
        </SoftFloat>
      </section>

      {/* DisplayCards Showcase Section */}
      <section className="relative py-16 sm:py-20 bg-gradient-to-b from-sky-50 to-indigo-50/20 overflow-hidden">
        {/* ambient orbs */}
        <GradientOrb className="w-72 h-72 bg-sky-200 -top-10 -left-10" style={{ opacity: 0.35 }} />
        <GradientOrb className="w-80 h-80 bg-indigo-200 -bottom-20 -right-20" style={{ opacity: 0.25 }} />
        
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Experience BrainInk in Action
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Discover how our platform transforms traditional grading into an intelligent, 
                efficient process that benefits teachers, students, and administrators alike.
              </p>
            </div>
            
            <div className="flex justify-center items-center min-h-[500px]">
              <DisplayCards 
                cards={[
                  {
                    icon: <Sparkles className="size-4 text-blue-300" />,
                    title: "Smart Grading",
                    description: "AI-powered instant feedback",
                    date: "Available now",
                    titleClassName: "text-blue-600",
                    explanation: "Our advanced AI system instantly analyzes handwritten and digital assignments, providing detailed feedback that helps students understand their mistakes and learn from them. Teachers save hours while students get immediate, actionable insights to improve their performance.",
                    className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-slate-200 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
                  },
                  {
                    icon: <TrendingUp className="size-4 text-green-300" />,
                    title: "Progress Tracking",
                    description: "Real-time student analytics",
                    date: "Live updates",
                    titleClassName: "text-green-600",
                    explanation: "Monitor student progress with comprehensive analytics dashboards. Track improvement over time, identify learning gaps early, and get real-time insights that help teachers make data-driven decisions to support every student's academic journey.",
                    className: "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-slate-200 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
                  },
                  {
                    icon: <Zap className="size-4 text-orange-300" />,
                    title: "Quick Setup",
                    description: "Ready in minutes, not hours",
                    date: "Get started",
                    titleClassName: "text-orange-600",
                    explanation: "Get your entire classroom up and running in just minutes with our streamlined onboarding process. No complex installations or lengthy training sessions required - just upload your first assignment and start experiencing the future of education technology.",
                    className: "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10",
                  },
                ]}
              />
            </div>
            
            <div className="text-center mt-12">
              <p className="text-slate-600 mb-6">
                Join thousands of educators already using BrainInk to revolutionize their teaching experience
              </p>
              <Link 
                to="/signup" 
                className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 will-change-transform"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Your Free Trial
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

    {/* Features preview grid */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold">Grade faster. Give better feedback. See progress in real time.</h2>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
        { title: 'Instant Grading', desc: 'Scan or upload handwritten/typed work and get results immediately.' },
        { title: 'Actionable Feedback', desc: 'Breakdowns of strengths, gaps, and suggested follow‑ups for each student.' },
        { title: 'Student Dashboards', desc: 'Individual progress, topics to review, and growth over time.' },
        { title: 'Class & School Analytics', desc: 'Principals see real‑time performance across classes and terms.' },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-slate-200 bg-white/70 shadow-sm">
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-slate-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Visual flow: Test → Upload → Results */}
          <div className="mt-10">
            <GradingProcessPinDemo />
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-6">
            {[{
              icon: <GraduationCap className="text-blue-600" size={24} />, title: 'Students',
              desc: 'Know where you went wrong, what to review next, and track improvement each term.'
            },{
              icon: <Users className="text-blue-600" size={24} />, title: 'Teachers',
              desc: 'Save 10+ hours/week with instant grading, clear rubrics, and organized feedback.'
            },{
              icon: <Building2 className="text-blue-600" size={24} />, title: 'School Leaders',
              desc: 'Get real‑time visibility across classes and subjects to make data‑driven decisions.'
            }].map((c) => (
              <div key={c.title} className="rounded-2xl border border-slate-200 p-6 bg-white">
                <div className="h-10 w-10 rounded-lg bg-blue-50 grid place-items-center mb-3">{c.icon}</div>
                <h3 className="font-semibold text-slate-900">{c.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    {/* How it works */}
  <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-y border-slate-200/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-semibold">How BrainInk fits in your school</h2>
          <div className="mt-8 grid md:grid-cols-4 gap-6">
            {[
        { step: '1', title: 'Upload or scan work', desc: 'Teachers scan handwritten papers or upload PDFs/images for assignments, quizzes, and exams.' },
        { step: '2', title: 'Apply rubrics', desc: 'Import your rubric or use templates so marking is consistent across classes.' },
        { step: '3', title: 'Get instant results', desc: 'Students and teachers receive clear breakdowns: strengths, gaps, and next steps.' },
        { step: '4', title: 'See school‑wide insights', desc: 'Principals and admins view live dashboards by class, subject, and term.' },
            ].map((s) => (
      <StepCard key={s.step} step={s.step} title={s.title} desc={s.desc} />
            ))}
          </div>
        </div>
      </section>

    <BrainInkCapabilities />

      {/* Outcomes section */}
      <section className="py-16 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 p-8 grid sm:grid-cols-3 gap-6 text-center">
            {[
              { stat: '10+ hrs', label: 'Teacher time saved per week' },
              { stat: '3× faster', label: 'Feedback turnaround to students' },
              { stat: 'Real‑time', label: 'Visibility for principals and HoDs' },
            ].map((x) => (
              <div key={x.label}>
                <div className="text-4xl font-black text-slate-900">{x.stat}</div>
                <div className="text-slate-600 mt-1">{x.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: 'I graded three classes before lunch. The feedback is clearer than ever.', name: 'Teacher (Math, S2)' },
              { quote: 'We finally see progress across departments at a glance.', name: 'Head Teacher' },
              { quote: 'Parents now understand strengths and gaps without meetings.', name: 'Director of Studies' },
            ].map((t) => (
              <figure key={t.quote} className="rounded-2xl border border-slate-200 p-6 bg-white">
                <blockquote className="text-slate-900">“{t.quote}”</blockquote>
                <figcaption className="mt-3 text-sm text-slate-600">— {t.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold">Frequently asked questions</h2>
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            {[
              { q: 'How does grading work?', a: 'Teachers scan or upload student work. BrainInk processes responses, applies rubrics, and returns detailed feedback instantly.' },
              { q: 'Is student data safe?', a: 'Yes. We minimize data collection and encrypt data in transit and at rest. Admins control access and integrations.' },
              { q: 'Which levels are supported?', a: 'Primary, secondary, and tertiary. Rubrics make it easy to adapt by subject and grade.' },
              { q: 'Do you support pilots?', a: 'Yes. Schools can run a pilot where the school contributes 30% of the fee for a selected group of teachers.' },
            ].map((f) => (
              <details key={f.q} className="rounded-xl border border-slate-200 p-4 bg-white">
                <summary className="cursor-pointer font-medium text-slate-900">{f.q}</summary>
                <p className="mt-2 text-sm text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-8">
            <Link to="/help" className="text-blue-600 hover:text-blue-700 text-sm font-medium">Visit the Help Center →</Link>
          </div>
        </div>
      </section>

      {/* Integrations banner */}
      <section className="py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 p-6 text-sm text-slate-600 grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-slate-900 font-semibold mb-1">Works with your systems</h3>
              <p>Use BrainInk alongside your existing workflows. Bulk scans from phone or copier, and export reports for records.</p>
            </div>
            <div>
              <h3 className="text-slate-900 font-semibold mb-1">Built for African classrooms</h3>
              <p>Offline‑friendly flows, simple onboarding, and training included. Built in Rwanda by a Pan‑African team.</p>
            </div>
          </div>
        </div>
      </section>

  {/* Final CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 p-8 text-center bg-white">
    <h3 className="text-2xl font-semibold">Let’s build the future of learning — together.</h3>
    <p className="text-slate-600 mt-2">Start a pilot at your school or roll out the standard plan in minutes.</p>
            <div className="mt-6 flex justify-center gap-3">
      <Link to="/signup" className="px-4 py-3 rounded-md bg-slate-900 text-white text-sm shadow-sm">Start a pilot</Link>
      <Link to="/pricing" className="px-4 py-3 rounded-md bg-blue-600 text-white text-sm shadow-sm">Pricing & plans</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default HomePage;
