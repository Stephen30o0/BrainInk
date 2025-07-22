import React from 'react';

export const MissionVisionSection: React.FC = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Simple Header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl font-light text-slate-900 mb-4">
            Our Mission & Vision
          </h2>
          <p className="text-xl text-slate-500 font-light">
            Transforming education through innovative technology
          </p>
        </div>

        {/* Clean Content Grid */}
        <div className="grid lg:grid-cols-2 gap-20">
          
          {/* Mission */}
          <div className="space-y-6">
            <h3 className="text-3xl text-slate-900 mb-6">Our Mission</h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              To democratize quality education by creating an immersive, AI-powered learning platform that adapts to every student's unique needs and learning style.
            </p>
            <div className="space-y-4 mt-8">
              <div className="text-slate-700">Make learning engaging and interactive for all ages</div>
              <div className="text-slate-700">Provide personalized education experiences</div>
              <div className="text-slate-700">Bridge the gap between traditional and digital learning</div>
            </div>
          </div>

          {/* Vision */}
          <div className="space-y-6">
            <h3 className="text-3xl text-slate-900 mb-6">Our Vision</h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              A world where every learner has access to personalized, adaptive education that unlocks their full potential and prepares them for the challenges of tomorrow.
            </p>
            <div className="space-y-4 mt-8">
              <div className="text-slate-700">Global accessibility to quality education</div>
              <div className="text-slate-700">AI-driven personalized learning paths</div>
              <div className="text-slate-700">Preparing students for the future workforce</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
