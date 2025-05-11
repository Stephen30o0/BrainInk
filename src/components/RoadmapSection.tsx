import React, { useState } from 'react';
export const RoadmapSection = () => {
  const [activePhase, setActivePhase] = useState('kana');
  const phases = [{
    id: 'kana',
    name: 'K.A.N.A. Awakens',
    icon: '🧠',
    description: 'Launch of our AI chatbot assistant with question answering capabilities',
    status: 'done',
    date: 'Q1 2023',
    features: ['Natural language question answering', 'Past paper database integration', 'Step-by-step explanations', 'Voice interaction support']
  }, {
    id: 'battles',
    name: 'First Battles',
    icon: '🏆',
    description: 'Introduction of leaderboards, badges, and competitive elements',
    status: 'in-progress',
    date: 'Q2 2023',
    features: ['Global and regional leaderboards', 'Achievement badge system', 'XP progression framework', 'First tournament structure']
  }, {
    id: 'guild',
    name: 'Open the Guild',
    icon: '🧩',
    description: 'Release of the creator system for educators to build courses',
    status: 'upcoming',
    date: 'Q3 2023',
    features: ['Course creation tools', 'Verification system for educators', 'Revenue sharing model', 'Interactive content builder']
  }, {
    id: 'chain',
    name: 'Unleash the Chain',
    icon: '⛓️',
    description: 'Full blockchain integration with INK token economy',
    status: 'upcoming',
    date: 'Q4 2023',
    features: ['INK token launch', 'Secure wallet integration', 'Stake & earn mechanisms', 'Tournament prize pools']
  }, {
    id: 'world',
    name: 'World Expansion',
    icon: '🌐',
    description: 'Global launch with multi-language support and partnerships',
    status: 'upcoming',
    date: 'Q1 2024',
    features: ['Multi-language support', 'School & institution partnerships', 'Mobile app release', 'API for third-party integration']
  }];
  return <section className="min-h-screen w-full bg-dark py-20 relative overflow-hidden" id="roadmap">
      {/* Background decorations */}
      <div className="absolute inset-0 z-0">
        {/* Stars */}
        {Array.from({
        length: 50
      }).map((_, i) => <div key={i} className="absolute bg-white rounded-full" style={{
        width: `${Math.random() * 3 + 1}px`,
        height: `${Math.random() * 3 + 1}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        opacity: Math.random() * 0.7 + 0.3,
        animation: `pulse ${Math.random() * 4 + 2}s infinite`
      }}></div>)}
      </div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-pixel text-3xl md:text-4xl mb-4 text-primary">
            THE ROAD TO <span className="text-secondary">GLORY</span>
          </h2>
          <p className="text-gray-300 font-pixel text-sm max-w-2xl mx-auto">
            Our development roadmap and future plans
          </p>
        </div>
        {/* Horizontal Roadmap */}
        <div className="relative mb-16 overflow-x-auto pb-4">
          <div className="flex min-w-max">
            {/* Timeline line */}
            <div className="absolute top-10 left-0 right-0 h-1 bg-primary/30"></div>
            {phases.map((phase, index) => <div key={phase.id} className={`relative px-8 flex flex-col items-center cursor-pointer ${activePhase === phase.id ? 'scale-105' : ''}`} onClick={() => setActivePhase(phase.id)}>
                {/* Status indicator */}
                <div className={`w-6 h-6 rounded-full border-2 z-10 ${phase.status === 'done' ? 'bg-green-500 border-green-400' : phase.status === 'in-progress' ? 'bg-yellow-500 border-yellow-400' : 'bg-gray-700 border-gray-600'}`}>
                  {phase.status === 'done' && <div className="w-full h-full flex items-center justify-center text-dark text-xs">
                      ✓
                    </div>}
                  {phase.status === 'in-progress' && <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-dark rounded-full animate-pulse"></div>
                    </div>}
                </div>
                {/* Phase content */}
                <div className={`mt-6 w-40 bg-dark/50 border-2 rounded-lg p-3 ${activePhase === phase.id ? 'border-primary animate-pulse-slow' : 'border-primary/30'}`}>
                  <div className="text-center mb-2">
                    <div className="text-xl mb-1">{phase.icon}</div>
                    <h3 className="font-pixel text-primary text-xs">
                      {phase.name}
                    </h3>
                    <div className="text-gray-400 text-xs mt-1">
                      {phase.date}
                    </div>
                  </div>
                </div>
              </div>)}
          </div>
        </div>
        {/* Phase Details */}
        {phases.map(phase => <div key={phase.id} className={`bg-dark/50 border-2 border-primary/30 rounded-lg p-6 transition-all duration-300 ${activePhase === phase.id ? 'opacity-100 transform translate-y-0' : 'opacity-0 absolute -z-10 transform -translate-y-10'}`} style={{
        display: activePhase === phase.id ? 'block' : 'none'
      }}>
            <div className="flex items-start mb-6">
              <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-3xl">{phase.icon}</span>
              </div>
              <div>
                <h3 className="font-pixel text-primary text-xl mb-1">
                  {phase.name}
                </h3>
                <div className="flex items-center mb-2">
                  <div className={`px-2 py-1 rounded text-xs mr-2 ${phase.status === 'done' ? 'bg-green-500/20 text-green-400' : phase.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>
                    {phase.status === 'done' ? 'COMPLETED' : phase.status === 'in-progress' ? 'IN PROGRESS' : 'UPCOMING'}
                  </div>
                  <span className="text-gray-400 text-sm">{phase.date}</span>
                </div>
                <p className="text-gray-300">{phase.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {phase.features.map((feature, i) => <div key={i} className="flex items-start">
                  <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                  <span className="text-gray-300 text-sm">{feature}</span>
                </div>)}
            </div>
            {phase.status === 'in-progress' && <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mr-3">
                    <span className="text-yellow-400">⚙️</span>
                  </div>
                  <div>
                    <h4 className="font-pixel text-yellow-400 text-sm mb-1">
                      Currently In Development
                    </h4>
                    <p className="text-gray-300 text-sm">
                      We're actively working on this phase. Stay tuned for
                      updates!
                    </p>
                  </div>
                </div>
              </div>}
          </div>)}
      </div>
    </section>;
};