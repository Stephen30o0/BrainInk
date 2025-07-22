import React from 'react';

export const FeaturesSection: React.FC = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Simple Header */}
        <div className="text-center mb-20">
          <h2 className="text-3xl font-light text-slate-900 mb-4">
            Key Features
          </h2>
          <p className="text-slate-600 font-light">
            Everything you need for modern education
          </p>
        </div>

        {/* Clean Feature Grid */}
        <div className="grid md:grid-cols-3 gap-16">
          {/* Teacher Dashboard */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 text-blue-600">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h3 className="text-2xl text-slate-900 mb-3">Teacher Dashboard</h3>
            <p className="text-slate-500 mb-6 leading-relaxed">
              Comprehensive tools for classroom management, progress tracking, and curriculum design
            </p>
            <button 
              onClick={() => window.location.href = '/school-login'}
              className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
            >
              Learn More →
            </button>
          </div>

          {/* Student Center */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 text-blue-600">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl text-slate-900 mb-3">Student Center</h3>
            <p className="text-slate-500 mb-6 leading-relaxed">
              Personalized learning experiences with adaptive content and progress tracking
            </p>
            <button 
              onClick={() => window.location.href = '/signup'}
              className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
            >
              Get Started →
            </button>
          </div>

          {/* AI Tutor */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 text-blue-600">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-2xl text-slate-900 mb-3">AI Tutor</h3>
            <p className="text-slate-500 mb-6 leading-relaxed">
              Intelligent tutoring system that adapts to each student's learning style and pace
            </p>
            <button 
              onClick={() => window.location.href = '/signup'}
              className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
            >
              Try Now →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
