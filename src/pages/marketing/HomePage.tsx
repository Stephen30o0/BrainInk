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
      <section ref={heroRef as any} className="relative overflow-hidden flex items-center justify-center" onMouseMove={onHeroMouseMove} style={{ minHeight: '100vh' }}>
        {/* subtle radial background for character */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(59,130,246,0.14),transparent_60%)]" />
        <GradientOrb className="w-[20rem] sm:w-[30rem] lg:w-[50rem] xl:w-[60rem] h-[20rem] sm:h-[30rem] lg:h-[50rem] xl:h-[60rem] bg-blue-200 -top-20 sm:-top-40 -left-10 sm:-left-20" style={{ transform: `translate3d(${mouse.x * -20}px, ${mouse.y * -10}px, 0)` }} />
        <GradientOrb className="w-[15rem] sm:w-[25rem] lg:w-[40rem] xl:w-[50rem] h-[15rem] sm:h-[25rem] lg:h-[40rem] xl:h-[50rem] bg-indigo-200 top-5 sm:top-10 -right-12 sm:-right-24" style={{ transform: `translate3d(${mouse.x * 25}px, ${mouse.y * 12}px, 0)` }} />
        <div className="mx-auto max-w-8xl px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <Reveal className="relative max-w-none pt-12 sm:pt-16 lg:pt-20 pb-6 sm:pb-8 lg:pb-12 mx-auto text-center" >
            <h1 className="mt-4 sm:mt-6 lg:mt-8 text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl 2xl:text-10xl 3xl:text-11xl 4xl:text-12xl font-black tracking-tight text-slate-900 leading-[1.0] sm:leading-[0.95] lg:leading-[0.9] xl:leading-[0.85]" style={{
              transform: `translateY(${progress * -20}px) scale(${1.06 - progress * 0.04})`,
              transition: 'transform 200ms ease',
              willChange: 'transform',
              textShadow: '0 1px 0 rgba(255,255,255,0.7), 0 18px 40px rgba(15,23,42,0.18)'
            }}>
              <span className="block mb-1 sm:mb-2 lg:mb-3">Instant  Grades</span>
              <span className="block mb-1 sm:mb-2 lg:mb-3">Free  Learning</span>
              <span className="block">Academic Freedom</span>
            </h1>
            {/* decorative soft divider lines behind heading */}
            <div aria-hidden className="absolute left-1/2 -translate-x-1/2 mt-4 sm:mt-6 lg:mt-8 w-[95%] sm:w-[98%] max-w-none">
              <div className="h-[2px] sm:h-[3px] lg:h-[4px] bg-gradient-to-r from-transparent via-slate-300/50 to-transparent" />
              <div className="mt-2 sm:mt-3 lg:mt-4 h-[1px] sm:h-[2px] bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />
            </div>
            <p className="mt-6 sm:mt-8 lg:mt-12 text-slate-600 text-base sm:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl max-w-none mx-auto leading-relaxed px-4 sm:px-8 lg:px-16 xl:px-24">
              BrainInk is a Rwandan‑built platform that saves teachers hours on grading and gives students, parents, and principals clear,
              actionable feedback. Built by a Pan‑African team for real classrooms.
            </p>
            <div className="mt-6 sm:mt-8 lg:mt-12 xl:mt-16 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 lg:gap-8 xl:gap-10 px-4">
              <Link to="/get-started" className="px-6 sm:px-8 lg:px-10 xl:px-12 2xl:px-14 py-3 sm:py-4 lg:py-5 xl:py-6 2xl:py-7 rounded-xl bg-slate-900 text-white text-base sm:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl shadow-[0_10px_24px_rgba(15,23,42,0.25)] ring-1 ring-slate-900/10 hover:translate-y-[-1px] transition will-change-transform hover:scale-105 transform">Get Started</Link>
              <Link to="/pricing" className="px-6 sm:px-8 lg:px-10 xl:px-12 2xl:px-14 py-3 sm:py-4 lg:py-5 xl:py-6 2xl:py-7 rounded-xl bg-blue-600 text-white text-base sm:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl shadow-[0_10px_24px_rgba(59,130,246,0.35)] ring-1 ring-blue-700/20 hover:bg-blue-600/90 hover:translate-y-[-1px] transition will-change-transform hover:scale-105 transform">See pricing</Link>
            </div>
          </Reveal>
          <div className="mt-4 sm:mt-6 lg:mt-10 relative group" style={{
            transform: `translateY(${(1 - progress) * 24}px)`,
            opacity: 0.85 + progress * 0.15,
            transition: 'transform 200ms ease, opacity 200ms ease',
            willChange: 'transform, opacity'
          }}>
            {/* Floating shadow effect */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl shadow-[0_15px_40px_rgba(15,23,42,0.15)] sm:shadow-[0_25px_60px_rgba(15,23,42,0.2)] group-hover:shadow-[0_25px_60px_rgba(15,23,42,0.2)] sm:group-hover:shadow-[0_35px_80px_rgba(15,23,42,0.25)] transition-shadow duration-500" />

            <Reveal>
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 backdrop-blur-sm" style={{
                clipPath: 'inset(50px 0 35px 0)',
                borderRadius: '1.5rem'
              }}>
                <video
                  className="aspect-[16/9] w-full object-cover"
                  autoPlay
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
        <SoftFloat className="size-16 sm:size-20 lg:size-24 right-3 sm:right-6 lg:right-16 top-1 sm:top-2 lg:top-12 rotate-6">
          <Upload className="w-5 sm:w-6 lg:w-7 h-5 sm:h-6 lg:h-7" />
        </SoftFloat>
        <SoftFloat className="size-12 sm:size-16 lg:size-20 left-2 sm:left-4 lg:left-12 bottom-8 sm:bottom-10 -rotate-6">
          <FileCheck2 className="w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6" />
        </SoftFloat>
        <SoftFloat className="size-18 sm:size-20 lg:size-24 xl:size-28 right-12 sm:right-16 lg:right-24 bottom-4 sm:bottom-6 rotate-3">
          <BarChart3 className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8" />
        </SoftFloat>
      </section>

      {/* DisplayCards Showcase Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 xl:py-28 bg-gradient-to-b from-sky-50 to-indigo-50/20 overflow-hidden">
        {/* ambient orbs */}
        <GradientOrb className="w-48 sm:w-60 lg:w-72 h-48 sm:h-60 lg:h-72 bg-sky-200 -top-5 sm:-top-8 lg:-top-10 -left-5 sm:-left-8 lg:-left-10" style={{ opacity: 0.35 }} />
        <GradientOrb className="w-56 sm:w-68 lg:w-80 h-56 sm:h-68 lg:h-80 bg-indigo-200 -bottom-10 sm:-bottom-16 lg:-bottom-20 -right-10 sm:-right-16 lg:-right-20" style={{ opacity: 0.25 }} />

        <div className="mx-auto max-w-8xl px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <Reveal>
            <div className="text-center mb-12 sm:mb-16 lg:mb-20">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 lg:mb-6 leading-tight">
                Experience BrainInk in Action
              </h2>
              <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-slate-600 max-w-3xl lg:max-w-4xl mx-auto leading-relaxed px-4">
                Discover how our platform transforms traditional grading into an intelligent,
                efficient process that benefits teachers, students, and administrators alike.
              </p>
            </div>

            <div className="flex justify-center items-center min-h-[700px] sm:min-h-[800px] md:min-h-[900px] lg:min-h-[700px] xl:min-h-[800px] 2xl:min-h-[900px]">
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
                Start Your Journey
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features preview grid */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-8xl px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold mb-6 sm:mb-8 lg:mb-12 leading-tight">
            Grade faster. Give better feedback. See progress in real time.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[
              { title: 'Instant Grading', desc: 'Scan or upload handwritten/typed work and get results immediately.' },
              { title: 'Actionable Feedback', desc: 'Breakdowns of strengths, gaps, and suggested follow‑ups for each student.' },
              { title: 'Student Dashboards', desc: 'Individual progress, topics to review, and growth over time.' },
              { title: 'Class & School Analytics', desc: 'Principals see real‑time performance across classes and terms.' },
            ].map((f) => (
              <div key={f.title} className="p-4 sm:p-6 lg:p-8 rounded-2xl border border-slate-200 bg-white/70 shadow-sm hover:shadow-md transition-shadow hover:scale-105 transform">
                <h3 className="font-semibold mb-1 sm:mb-2 lg:mb-3 text-sm sm:text-base lg:text-lg">{f.title}</h3>
                <p className="text-slate-600 text-xs sm:text-sm lg:text-base leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Visual flow: Test → Upload → Results */}
          <div className="mt-8 sm:mt-10 lg:mt-12">
            <GradingProcessPinDemo />
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-12 sm:py-14 lg:py-18">
        <div className="mx-auto max-w-8xl px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {[{
              icon: <GraduationCap className="text-blue-600" size={20} />, title: 'Students',
              desc: 'Know where you went wrong, what to review next, and track improvement each term.'
            }, {
              icon: <Users className="text-blue-600" size={20} />, title: 'Teachers',
              desc: 'Save 10+ hours/week with instant grading, clear rubrics, and organized feedback.'
            }, {
              icon: <Building2 className="text-blue-600" size={20} />, title: 'School Leaders',
              desc: 'Get real‑time visibility across classes and subjects to make data‑driven decisions.'
            }].map((c) => (
              <div key={c.title} className="rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8 bg-white hover:shadow-md transition-shadow hover:scale-105 transform">
                <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-lg bg-blue-50 grid place-items-center mb-3 sm:mb-4">{c.icon}</div>
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base lg:text-lg">{c.title}</h3>
                <p className="text-xs sm:text-sm lg:text-base text-slate-600 mt-1 sm:mt-2 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-slate-50 to-white border-y border-slate-200/60">
        <div className="mx-auto max-w-8xl px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold mb-6 sm:mb-8 lg:mb-12 leading-tight">
            How BrainInk fits in your school
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
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
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-8xl px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="rounded-2xl border border-slate-200 p-6 sm:p-8 lg:p-10 xl:p-12 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 text-center bg-white shadow-sm hover:shadow-md transition-shadow">
            {[
              { stat: '10+ hrs', label: 'Teacher time saved per week' },
              { stat: '3× faster', label: 'Feedback turnaround to students' },
              { stat: 'Real‑time', label: 'Visibility for principals and HoDs' },
            ].map((x) => (
              <div key={x.label} className="hover:scale-105 transform transition-transform">
                <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-slate-900">{x.stat}</div>
                <div className="text-slate-600 mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">{x.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-8xl px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
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
