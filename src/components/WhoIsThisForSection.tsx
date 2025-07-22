import React from 'react';

export const WhoIsThisForSection: React.FC = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Simple Header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl font-light text-slate-900 mb-4">
            Who is Brain Ink for?
          </h2>
          <p className="text-xl text-slate-500 font-light">
            Our AI-powered educational platform is designed for forward-thinking institutions
          </p>
        </div>

        {/* Clean Target Grid */}
        <div className="grid md:grid-cols-3 gap-16 mb-20">
          {/* Schools & Universities */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 text-blue-600">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-2xl text-slate-900 mb-3">Schools & Universities</h3>
            <p className="text-slate-500 leading-relaxed">
              Transform your entire institution with AI-powered personalized learning that adapts to every student's unique needs and learning style.
            </p>
          </div>

          {/* Teachers & Educators */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 text-blue-600">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-2xl text-slate-900 mb-3">Teachers & Educators</h3>
            <p className="text-slate-500 leading-relaxed">
              Empower your teaching with intelligent analytics, automated grading, and AI-generated content that saves time and improves outcomes.
            </p>
          </div>

          {/* Training Organizations */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 text-blue-600">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM12 7h.01M12 11h.01" />
              </svg>
            </div>
            <h3 className="text-2xl text-slate-900 mb-3">Training Organizations</h3>
            <p className="text-slate-500 leading-relaxed">
              Deliver scalable, personalized corporate training programs with measurable results and comprehensive progress tracking.
            </p>
          </div>
        </div>

        {/* Simple Demo Section */}
        <div className="text-center py-16 border-t border-slate-200">
          <h3 className="text-3xl text-slate-900 mb-6">Ready to See More?</h3>
          <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto">
            Book a personalized demo with our team to discover how Brain Ink can transform your educational approach.
          </p>
          <div className="space-y-4">
            <p className="text-slate-600">Contact us for a demo:</p>
            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=info@brainink.com&su=Demo%20Request%20for%20Brain%20Ink&body=Hi%2C%20I%20would%20like%20to%20schedule%20a%20demo%20of%20Brain%20Ink%20for%20my%20organization." target="_blank" rel="noopener noreferrer" className="text-blue-600 text-lg font-medium hover:text-blue-700 transition-colors">
              info@brainink.com
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
