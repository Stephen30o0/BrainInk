import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MarketingHeader from '../../components/marketing/MarketingHeader';
import MarketingFooter from '../../components/marketing/MarketingFooter';
import { GraduationCap, Users, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, Copy, Check, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '../../components/marketing/ScrollReveal';

/* ─── style objects ─── */
const fontDisplay: React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif" };
/* bgGrid removed — was causing visible grid overlay */
const dotPattern: React.CSSProperties = {
  backgroundImage: 'radial-gradient(#d6d3d1 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

/* ─── Onboarding Role Card ─── */
interface OnboardingCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  hoverGradient: string;
  progressColor: string;
  idCode: string;
  steps: number;
  onClick: () => void;
}

const OnboardingCard: React.FC<OnboardingCardProps> = ({
  title, description, icon, iconBg, iconColor, hoverGradient, progressColor, idCode, steps, onClick,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative bg-white border border-stone-200 rounded-3xl p-8 md:p-10 flex flex-col justify-between overflow-hidden cursor-pointer"
      style={{
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 20px 40px -5px rgba(0,0,0,0.05), 0 10px 20px -5px rgba(0,0,0,0.02)' : 'none',
      }}
    >
      {/* Hover gradient blob */}
      <div
        className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${hoverGradient} to-transparent rounded-bl-[100%] transition-opacity duration-500`}
        style={{ opacity: hovered ? 1 : 0 }}
      />

      {/* Top */}
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div
            className={`w-16 h-16 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center border shadow-sm transition-all duration-300`}
            style={{
              transform: hovered ? 'scale(1.1)' : 'scale(1)',
              borderColor: hovered ? 'transparent' : undefined,
            }}
          >
            {icon}
          </div>
          <div className="font-mono text-xs text-stone-400 border border-stone-100 px-2 py-1 rounded bg-stone-50 uppercase">
            ID: {idCode}
          </div>
        </div>

        <h2 className="text-3xl font-medium text-stone-900 mb-3 tracking-tight">{title}</h2>
        <p className="text-stone-500 leading-relaxed mb-8">{description}</p>
      </div>

      {/* Bottom */}
      <div className="relative z-10 mt-auto pt-8 border-t border-stone-100">
        <div className="flex items-end justify-between mb-4">
          <div>
            <span className="block font-mono text-[10px] text-stone-400 uppercase tracking-widest mb-1">Modules</span>
            <div
              className="inline-flex items-center justify-center px-4 py-1.5 border rounded-full text-sm font-medium transition-all duration-300"
              style={{
                backgroundColor: hovered ? '#000' : '#fff',
                color: hovered ? '#fff' : '#111827',
                borderColor: hovered ? '#000' : '#e5e7eb',
              }}
            >
              {steps} Guided Steps
            </div>
          </div>
          <div
            className="transition-all duration-300"
            style={{
              transform: hovered ? 'translateX(0)' : 'translateX(16px)',
              opacity: hovered ? 1 : 0,
            }}
          >
            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Progress bars */}
        <div className="flex gap-1 h-1.5 w-full">
          {Array.from({ length: steps }).map((_, i) => (
            <div
              key={i}
              className={`h-full flex-grow ${progressColor} rounded-full transition-opacity`}
              style={{
                opacity: hovered ? 1 : 0.2,
                transitionDelay: `${i * (steps > 6 ? 20 : 50)}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Credentials Panel (for walkthrough) ─── */
const CredentialsPanel: React.FC = () => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />

      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Session Credentials</span>
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
      </div>

      <div className="space-y-3">
        {[
          { label: 'Username', value: 'Teacher1' },
          { label: 'Password', value: 'password123' },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="text-[10px] uppercase text-stone-400 font-semibold tracking-wider">{label}</label>
            <div
              className="flex items-center justify-between bg-white border border-stone-100 rounded px-2 py-1.5 hover:border-blue-200 transition-colors cursor-pointer group/item"
              onClick={() => handleCopy(label.toLowerCase(), value)}
            >
              <code className="font-mono text-sm text-blue-900">{value}</code>
              {copiedField === label.toLowerCase() ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-stone-300 group-hover/item:text-blue-500 transition-colors" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Progress Bar (walkthrough sidebar) ─── */
const ProgressBar: React.FC<{ progress: number; currentStep: number; totalSteps: number }> = ({
  progress, currentStep, totalSteps,
}) => (
  <div className="p-8 border-t border-stone-100 bg-white">
    <div className="flex items-center justify-between mb-2 text-xs font-mono text-stone-400">
      <span>PROGRESS</span>
      <span>{progress}%</span>
    </div>
    <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
      <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
    </div>
    <div className="mt-4 text-xs text-stone-400 flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
      Step {currentStep} of {totalSteps}
    </div>
  </div>
);

/* ─── Browser Window Chrome ─── */
const BrowserWindow: React.FC<{ children?: React.ReactNode; imageSrc?: string; urlText?: string }> = ({ children, imageSrc, urlText = 'app.brainink.com' }) => (
  <div
    className="relative w-full max-w-[900px] bg-white rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.1)] border border-stone-200/60 overflow-hidden flex flex-col ring-1 ring-black/5"
    style={{ animation: 'fadeIn 0.6s ease-out forwards' }}
  >
    <div className="h-10 bg-white border-b border-stone-100 flex items-center px-4 gap-2 flex-shrink-0 z-10">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E]" />
        <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#D89E24]" />
        <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29]" />
      </div>
      <div className="flex-1 flex justify-center px-20">
        <div className="h-6 bg-stone-50 rounded-md w-full max-w-[400px] flex items-center justify-center border border-stone-100">
          <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-medium">
            <Lock className="w-3 h-3" />
            {urlText}
          </div>
        </div>
      </div>
      <div className="w-10" />
    </div>
    {imageSrc ? (
      <div className="flex-1 overflow-hidden">
        <img
          src={imageSrc}
          alt="BrainInk platform screenshot"
          className="w-full h-full object-cover object-top transition-opacity duration-500"
        />
      </div>
    ) : (
      children
    )}
  </div>
);

/* ─── Mock Join Page (shown inside browser window) ─── */
const JoinPage: React.FC = () => (
  <div className="flex-1 overflow-y-auto bg-white relative flex flex-col items-center justify-center p-8 lg:p-12">
    <div className="w-full max-w-4xl text-center z-0 mt-10">
      <div className="inline-block px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-semibold uppercase tracking-wider mb-6">
        Start your journey
      </div>
      <h2 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4 tracking-tight">Join BrainInk</h2>
      <p className="text-stone-500 text-lg mb-12 max-w-xl mx-auto font-light">
        Choose how you'd like to get started with our AI-powered learning platform.
      </p>

      <div className="grid md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto">
        {/* School card */}
        <div className="group relative bg-white border border-stone-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Building2Icon />
            </div>
            <h3 className="text-xl font-semibold text-stone-900 mb-2">Join as School</h3>
            <p className="text-sm text-stone-500 mb-6 leading-relaxed">
              Set up your institution with BrainInk. Manage classes, students, and get comprehensive analytics.
            </p>
            <ul className="space-y-2 mb-8">
              <CheckItem color="blue">School-wide content management</CheckItem>
              <CheckItem color="blue">Admin dashboard access</CheckItem>
            </ul>
            <button className="w-full py-2.5 rounded-lg border border-blue-200 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors">
              Get started as school &rarr;
            </button>
          </div>
        </div>

        {/* Student card */}
        <div className="group relative bg-white border border-stone-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-fuchsia-100 text-fuchsia-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-stone-900 mb-2">Join as Student</h3>
            <p className="text-sm text-stone-500 mb-6 leading-relaxed">
              Start your personalized learning journey. Access assignments, get AI-powered feedback, and track your progress.
            </p>
            <ul className="space-y-2 mb-8">
              <CheckItem color="fuchsia">Personalized learning path</CheckItem>
              <CheckItem color="fuchsia">AI feedback integration</CheckItem>
            </ul>
            <button className="w-full py-2.5 rounded-lg border border-fuchsia-200 text-fuchsia-600 text-sm font-medium hover:bg-fuchsia-50 transition-colors">
              Get started as student &rarr;
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-xs text-stone-400">
        Need help choosing?{' '}
        <Link to="/contact" className="text-blue-600 underline">
          Contact our support team
        </Link>
      </div>
    </div>
  </div>
);

const Building2Icon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256">
    <path fill="currentColor" d="M240,112v88a8,8,0,0,1-8,8H184a8,8,0,0,1-8-8V144H80v56a8,8,0,0,1-8,8H24a8,8,0,0,1-8-8V112a8,8,0,0,1,3.46-6.61l104-72a8,8,0,0,1,9.08,0l104,72A8,8,0,0,1,240,112Z" opacity="0.2" />
    <path fill="currentColor" d="M244.46,105.39l-104-72a8,8,0,0,0-9,0l-104,72A8,8,0,0,0,32,128h40v64H32a8,8,0,0,0,0,16H72a8,8,0,0,0,8-8V136H176v64a8,8,0,0,0,8,8h40a8,8,0,0,0,0-16H184V128h40a8,8,0,0,0,4.54-14.61ZM128,47.41,215.34,108H40.66Z" />
  </svg>
);

const CheckItem: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <li className="flex items-center gap-2 text-xs text-stone-600">
    <svg className={`w-4 h-4 text-${color}-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
    {children}
  </li>
);

/* ═══════════════════════════════════════════════════════════════
   TEACHER WALKTHROUGH (file 9 content)
   ═══════════════════════════════════════════════════════════════ */
const teacherSteps = [
  {
    module: '01',
    category: 'Initial Setup',
    title: 'Join BrainInk',
    image: '/new_for_images/join.png',
    body: (
      <>
        <p>
          Start your journey by navigating to the main{' '}
          <span className="font-medium text-stone-900 border-b border-blue-200">BrainInk platform</span>.
        </p>
        <p className="mt-4">
          Locate the primary navigation area and click on the{' '}
          <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded shadow-sm">
            Join
          </span>{' '}
          button to initialize your registration sequence.
        </p>
        <p className="mt-4 text-sm text-stone-400 italic border-l-2 border-stone-200 pl-3">
          Tip: Ensure you are logged out of any previous sessions before beginning the test procedure.
        </p>
      </>
    ),
  },
  {
    module: '02',
    category: 'Account Setup',
    title: 'Create School Account',
    image: '/new_for_images/school_portal.png',
    body: (
      <p>Register your school institution. Provide your school name, select your country (Rwanda), and set up your admin credentials. This creates the organization container for all users.</p>
    ),
  },
  {
    module: '03',
    category: 'Authentication',
    title: 'Login as Teacher',
    image: '/new_for_images/choose_role.png',
    body: (
      <p>Use the credentials provided in the credentials panel to sign in. Select the &ldquo;Teacher&rdquo; role when prompted and complete the authentication flow.</p>
    ),
  },
  {
    module: '04',
    category: 'Dashboard',
    title: 'Explore Teacher Dashboard',
    image: '/new_for_images/dashboard.png',
    body: (
      <p>Familiarize yourself with the teacher dashboard layout. Review the sidebar navigation, stat cards, and K.A.I.A insights panel to understand the data you'll be working with.</p>
    ),
  },
  {
    module: '05',
    category: 'Classroom',
    title: 'Create a Classroom',
    image: '/new_for_images/choose_school.png',
    body: (
      <p>Navigate to classroom management and create a new classroom. Set the subject, level/grade, and academic term. This is the container for your students and assignments.</p>
    ),
  },
  {
    module: '06',
    category: 'Students',
    title: 'Add Students',
    image: '/new_for_images/studentsportal.png',
    body: (
      <p>Invite students to your classroom. You can add them via code, bulk CSV import, or manually enter student details. Verify they appear in your class roster.</p>
    ),
  },
  {
    module: '07',
    category: 'Content',
    title: 'Upload Assignment',
    image: '/new_for_images/upload.png',
    body: (
      <p>Create an assignment with a rubric. Upload student work (PDF, image, or photo scan). Watch as the AI processes and grades the submission using your rubric criteria.</p>
    ),
  },
  {
    module: '08',
    category: 'Grading',
    title: 'Review AI Grades',
    image: '/new_for_images/grade1.png',
    body: (
      <p>Once grading is complete, review the AI-generated scores and feedback. Make manual adjustments if needed and approve the final grades before publishing to students.</p>
    ),
  },
  {
    module: '09',
    category: 'Analytics',
    title: 'View Class Analytics',
    image: '/new_for_images/grade2.png',
    body: (
      <p>Navigate to the analytics section to see class performance trends, topic-level breakdowns, and student comparisons. Use K.A.I.A. insights for actionable recommendations.</p>
    ),
  },
  {
    module: '10',
    category: 'AI Assistant',
    title: 'Chat with K.A.I.A.',
    image: '/new_for_images/grade3.png',
    body: (
      <p>Open the K.A.I.A. AI assistant to ask questions about student performance, generate reports, or get suggestions for improving learning outcomes in your class.</p>
    ),
  },
  {
    module: '11',
    category: 'Completion',
    title: 'Review & Complete',
    image: '/new_for_images/grade4.png',
    body: (
      <p>Congratulations! You've completed the teacher onboarding. Review what you've learned and explore additional features at your own pace. Reach out to support if you need any help.</p>
    ),
  },
];

/* ─── Teacher Walkthrough View ─── */
const TeacherWalkthrough: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = teacherSteps.length;
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);
  const step = teacherSteps[currentStep];

  return (
    <div className="flex-grow flex flex-col lg:flex-row min-h-0">
      {/* Sidebar */}
      <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col bg-white border-r border-stone-200 shadow-xl z-20 relative">
        <div className="px-8 pt-20 pb-4">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-blue-600 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Role Selection</span>
          </button>

          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 mb-2">
            Platform<br />Onboarding Guide
          </h1>
          <p className="text-stone-500 leading-relaxed text-sm">
            Follow the interactive guide below to configure your test environment.
          </p>
        </div>

        <div className="px-8 py-4">
          <CredentialsPanel />
        </div>

        <div className="h-px bg-stone-100 mx-8 my-2" />

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-blue-50 text-blue-600 text-xs font-bold font-mono border border-blue-100">
              {step.module}
            </span>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-widest">{step.category}</span>
          </div>

          <h2 className="text-2xl font-bold text-stone-900 mb-4">{step.title}</h2>
          <div className="prose prose-sm prose-stone text-stone-600 leading-relaxed">
            {step.body}
          </div>
        </div>

        <ProgressBar progress={progress} currentStep={currentStep + 1} totalSteps={totalSteps} />
      </div>

      {/* Preview pane */}
      <div className="flex-1 relative flex items-center justify-center bg-[#F5F5F7] min-h-[500px] p-8 pt-24">
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={dotPattern} />
        <div className="absolute inset-0 bg-gradient-to-tr from-white/50 via-transparent to-transparent pointer-events-none" />

        <BrowserWindow key={currentStep} imageSrc={step.image} urlText={`app.brainink.com/${step.category.toLowerCase().replace(/\s+/g, '-')}`} />

        {/* Navigation controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-30">
          <button
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="w-12 h-12 rounded-full bg-white shadow-lg border border-stone-100 flex items-center justify-center text-stone-400 hover:text-blue-600 hover:scale-110 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            className="flex items-center gap-3 px-6 py-3 bg-white/80 rounded-full shadow-lg border border-white/50"
            style={{ backdropFilter: 'blur(12px)' }}
          >
            {Array.from({ length: Math.min(6, totalSteps) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`rounded-full transition-all ${
                  i === currentStep
                    ? 'w-2.5 h-2.5 bg-blue-600 ring-2 ring-blue-200'
                    : 'w-2 h-2 bg-stone-300 hover:bg-stone-400'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentStep((s) => Math.min(totalSteps - 1, s + 1))}
            disabled={currentStep === totalSteps - 1}
            className="w-12 h-12 rounded-full bg-blue-600 shadow-lg shadow-blue-200 flex items-center justify-center text-white hover:bg-blue-700 hover:scale-110 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Student Walkthrough View ─── */
const studentSteps = [
  {
    module: '01',
    category: 'Getting Started',
    title: 'Join Your School',
    image: '/new_for_images/join.png',
    body: (
      <p>Ask your teacher for the school join code. Navigate to the BrainInk platform and enter the code to connect to your school and classroom.</p>
    ),
  },
  {
    module: '02',
    category: 'Profile',
    title: 'Set Up Your Profile',
    image: '/new_for_images/studentsportal.png',
    body: (
      <p>Complete your student profile with your name, grade/level, and preferred subjects. This helps personalize your learning experience and dashboard.</p>
    ),
  },
  {
    module: '03',
    category: 'Assignments',
    title: 'View & Submit Work',
    image: '/new_for_images/assignment.png',
    body: (
      <p>Access your assignments from the student dashboard. Submit your work by uploading photos, PDFs, or typing responses directly. Track submission status in real time.</p>
    ),
  },
  {
    module: '04',
    category: 'Growth',
    title: 'Track Your Progress',
    image: '/new_for_images/study1.png',
    body: (
      <p>Review AI-generated feedback on your submissions. See your strengths, areas for improvement, and growth over time on your personal analytics dashboard.</p>
    ),
  },
];

const StudentWalkthrough: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = studentSteps.length;
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);
  const step = studentSteps[currentStep];

  return (
    <div className="flex-grow flex flex-col lg:flex-row min-h-0">
      {/* Sidebar */}
      <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col bg-white border-r border-stone-200 shadow-xl z-20 relative">
        <div className="px-8 pt-20 pb-4">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-blue-600 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Role Selection</span>
          </button>

          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 mb-2">
            Student<br />Onboarding Guide
          </h1>
          <p className="text-stone-500 leading-relaxed text-sm">
            Follow the steps below to set up your learning environment.
          </p>
        </div>

        <div className="h-px bg-stone-100 mx-8 my-2" />

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-emerald-50 text-emerald-600 text-xs font-bold font-mono border border-emerald-100">
              {step.module}
            </span>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-widest">{step.category}</span>
          </div>

          <h2 className="text-2xl font-bold text-stone-900 mb-4">{step.title}</h2>
          <div className="prose prose-sm prose-stone text-stone-600 leading-relaxed">
            {step.body}
          </div>
        </div>

        <ProgressBar progress={progress} currentStep={currentStep + 1} totalSteps={totalSteps} />
      </div>

      {/* Preview pane */}
      <div className="flex-1 relative flex items-center justify-center bg-[#F5F5F7] min-h-[500px] p-8 pt-24">
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={dotPattern} />
        <div className="absolute inset-0 bg-gradient-to-tr from-white/50 via-transparent to-transparent pointer-events-none" />

        <BrowserWindow key={currentStep} imageSrc={step.image} urlText={`app.brainink.com/${step.category.toLowerCase().replace(/\s+/g, '-')}`} />

        {/* Navigation controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-30">
          <button
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="w-12 h-12 rounded-full bg-white shadow-lg border border-stone-100 flex items-center justify-center text-stone-400 hover:text-emerald-600 hover:scale-110 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            className="flex items-center gap-3 px-6 py-3 bg-white/80 rounded-full shadow-lg border border-white/50"
            style={{ backdropFilter: 'blur(12px)' }}
          >
            {Array.from({ length: totalSteps }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`rounded-full transition-all ${
                  i === currentStep
                    ? 'w-2.5 h-2.5 bg-emerald-600 ring-2 ring-emerald-200'
                    : 'w-2 h-2 bg-stone-300 hover:bg-stone-400'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentStep((s) => Math.min(totalSteps - 1, s + 1))}
            disabled={currentStep === totalSteps - 1}
            className="w-12 h-12 rounded-full bg-emerald-600 shadow-lg shadow-emerald-200 flex items-center justify-center text-white hover:bg-emerald-700 hover:scale-110 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN ONBOARDING PAGE
   ═══════════════════════════════════════════════════════════════ */
type OnboardingView = 'hub' | 'teacher' | 'student';

const OnboardingPage: React.FC = () => {
  const [view, setView] = useState<OnboardingView>('hub');

  if (view === 'teacher') {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-stone-900">
        <MarketingHeader />
        <div className="flex-grow flex flex-col">
          <TeacherWalkthrough onBack={() => setView('hub')} />
        </div>
      </div>
    );
  }

  if (view === 'student') {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-stone-900">
        <MarketingHeader />
        <div className="flex-grow flex flex-col">
          <StudentWalkthrough onBack={() => setView('hub')} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-stone-900">
      <div className="grain-overlay" />
      <MarketingHeader />

      {/* Background blobs */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-100/30 rounded-full mix-blend-multiply blur-[100px] opacity-30 pointer-events-none z-0 animate-blob-drift" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-100/20 rounded-full mix-blend-multiply blur-[120px] opacity-30 pointer-events-none z-0" />
      <div className="fixed inset-0 dot-grid-bg opacity-20 pointer-events-none z-0" />

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center justify-center relative z-10">
        {/* Header */}
        <header className="text-center max-w-2xl mx-auto mb-20 md:mb-24 relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-b from-transparent to-stone-300" />

          <div className="section-tag mb-6">
            <span>Onboarding</span>
          </div>

          <h1
            className="text-5xl md:text-7xl font-bold tracking-tighter text-stone-900 mb-6"
            style={fontDisplay}
          >
            Platform Onboarding
          </h1>

          <p className="text-lg md:text-xl text-stone-500 font-light leading-relaxed">
            Initiate your BrainInk experience. Select your designated role below to access the guided walkthrough.
          </p>
        </header>

        {/* Role selection cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-stretch">
          <OnboardingCard
            title="Teacher Guide"
            description="Master the classroom control protocols. Manage rosters, calibrate grading systems, and monitor student academic velocity."
            icon={<GraduationCap className="w-8 h-8" />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            hoverGradient="from-blue-50"
            progressColor="bg-blue-500"
            idCode="TCHR-01"
            steps={11}
            onClick={() => setView('teacher')}
          />
          <OnboardingCard
            title="Student Guide"
            description="Access learning materials, submit assignments for review, and analyze your personal performance metrics."
            icon={<Users className="w-8 h-8" />}
            iconBg="bg-stone-100"
            iconColor="text-stone-600"
            hoverGradient="from-stone-50"
            progressColor="bg-stone-500"
            idCode="STDN-02"
            steps={4}
            onClick={() => setView('student')}
          />
        </div>

        {/* Footer status bar */}
        <div className="mt-24 w-full border-t border-stone-200 pt-8 flex flex-col sm:flex-row justify-between items-end opacity-50 gap-4">
          <div className="flex gap-12">
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">Status</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-xs font-mono text-stone-600">All Systems Normal</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">Security</span>
              <span className="text-xs font-mono text-stone-600">Encrypted</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] text-stone-400 mb-1">SESSION_ID</div>
            <div className="font-mono text-xs text-stone-600">8F-92X-LQ</div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
};

export default OnboardingPage;
