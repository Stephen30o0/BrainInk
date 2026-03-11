import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Users, ArrowRight } from 'lucide-react';
import MarketingHeader from '../components/marketing/MarketingHeader';
import MarketingFooter from '../components/marketing/MarketingFooter';
import { motion } from 'framer-motion';
import { ScrollReveal } from '../components/marketing/ScrollReveal';

const GetStarted: React.FC = () => {
  return (
    <div className="min-h-[100dvh] bg-[#FAFAF8] relative">
      <MarketingHeader />
      <div className="grain-overlay" />

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[100px]" />
      </div>

      <div className="relative pt-32 pb-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          {/* Header */}
          <ScrollReveal>
            <div className="mb-16">
              <span className="inline-block text-xs font-mono uppercase tracking-widest text-stone-400 mb-4">Get Started</span>
              <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 tracking-tighter leading-[0.95] mb-4">
                Join BrainInk
              </h1>
              <p className="text-stone-500 text-lg max-w-lg">
                Choose how you'd like to get started with our AI-powered learning platform.
              </p>
            </div>
          </ScrollReveal>

          {/* Two cards side by side */}
          <div className="grid md:grid-cols-2 gap-5">
            <ScrollReveal delay={0.1}>
              <Link
                to="/school-login"
                className="group relative bg-white rounded-2xl border border-stone-200 hover:border-stone-300 hover:shadow-lg transition-all duration-300 block no-underline h-full"
              >
                <div className="p-8 flex flex-col h-full">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100/50 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-2 tracking-tight">
                    School
                  </h3>
                  <p className="text-stone-500 text-sm leading-relaxed mb-8">
                    Set up your institution. Manage teachers, students, and access school-wide analytics.
                  </p>
                  <div className="mt-auto flex items-center gap-2 text-sm font-medium text-blue-600 group-hover:text-blue-700">
                    <span>Get started</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <Link
                to="/signup"
                className="group relative bg-white rounded-2xl border border-stone-200 hover:border-stone-300 hover:shadow-lg transition-all duration-300 block no-underline h-full"
              >
                <div className="p-8 flex flex-col h-full">
                  <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600 border border-stone-200/50 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-2 tracking-tight">
                    Student
                  </h3>
                  <p className="text-stone-500 text-sm leading-relaxed mb-8">
                    Start your personalized learning journey with AI-powered feedback and progress tracking.
                  </p>
                  <div className="mt-auto flex items-center gap-2 text-sm font-medium text-stone-600 group-hover:text-stone-900">
                    <span>Get started</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          </div>

          <p className="text-stone-400 text-sm mt-10">
            Need help choosing?{' '}
            <Link to="/help" className="text-blue-600 hover:text-blue-700 font-medium">Contact our support team</Link>
          </p>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
};

export default GetStarted;
