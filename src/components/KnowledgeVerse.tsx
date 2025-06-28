import React, { useState } from 'react';
import { PixelButton } from './shared/PixelButton';
export const KnowledgeVerse = () => {
  const [activeZone, setActiveZone] = useState(null);
  const zones = [{
    id: 'town-square',
    name: 'Town Square',
    description: 'Your starting base. Meet other students and plan your learning journey.',
    color: '#00a8ff',
    icon: '🏙️'
  }, {
    id: 'lab',
    name: 'The Lab',
    description: 'Where you talk to K.A.N.A. and get answers to your toughest questions.',
    color: '#00ffaa',
    icon: '🧪'
  }, {
    id: 'arena',
    name: 'The Arena',
    description: 'Quiz tournaments & competitions. Test your knowledge against others.',
    color: '#ff00aa',
    icon: '🏆'
  }, {
    id: 'study-centre',
    name: "Study Centre",
    description: 'Your personalized agentic learning hub powered by K.A.N.A. AI.',
    color: '#4ade80',
    icon: '🧠'
  }, {
    id: 'chambers',
    name: 'Echo Chambers',
    description: 'Debate & discussion rooms. Share ideas and learn from peers.',
    color: '#aa00ff',
    icon: '🗣️'
  }, {
    id: 'vault',
    name: 'Lore Vault',
    description: 'Saved learning resources and past papers. Your personal library.',
    color: '#00aaff',
    icon: '📚'
  }];
  return <section className="min-h-screen w-full bg-dark py-20 relative overflow-hidden" id="knowledgeverse">
      {/* Decorative elements */}
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
            THE <span className="text-secondary">KNOWLEDGEVERSE</span>
          </h2>
          <p className="text-gray-300 font-pixel text-sm max-w-2xl mx-auto">
            Explore different zones in our learning universe
          </p>
        </div>
        {/* Interactive Map */}
        <div className="relative w-full aspect-square max-w-4xl mx-auto bg-dark border-2 border-primary/30 rounded-lg overflow-hidden">
          {/* Map Background */}
          <div className="absolute inset-0 z-0">
            {/* Grid */}
            <div className="w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle, #00a8ff10 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}></div>
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <line x1="50%" y1="20%" x2="25%" y2="40%" stroke="#00a8ff" strokeWidth="2" strokeDasharray="5,5" opacity="0.3" />
              <line x1="50%" y1="20%" x2="75%" y2="40%" stroke="#00a8ff" strokeWidth="2" strokeDasharray="5,5" opacity="0.3" />
              <line x1="25%" y1="40%" x2="25%" y2="60%" stroke="#00a8ff" strokeWidth="2" strokeDasharray="5,5" opacity="0.3" />
              <line x1="75%" y1="40%" x2="75%" y2="60%" stroke="#00a8ff" strokeWidth="2" strokeDasharray="5,5" opacity="0.3" />
              <line x1="25%" y1="60%" x2="50%" y2="80%" stroke="#00a8ff" strokeWidth="2" strokeDasharray="5,5" opacity="0.3" />
              <line x1="75%" y1="60%" x2="50%" y2="80%" stroke="#00a8ff" strokeWidth="2" strokeDasharray="5,5" opacity="0.3" />
            </svg>
          </div>
          {/* Zone Points */}
          {zones.map((zone, index) => {
          // Position zones in a hexagon pattern
          let positionX, positionY;
          switch (index) {
            case 0:
              // Town Square (center top)
              positionX = '50%';
              positionY = '20%';
              break;
            case 1:
              // Lab (left middle)
              positionX = '25%';
              positionY = '40%';
              break;
            case 2:
              // Arena (right middle)
              positionX = '75%';
              positionY = '40%';
              break;
            case 3:
              // Guild (left bottom)
              positionX = '25%';
              positionY = '60%';
              break;
            case 4:
              // Chambers (right bottom)
              positionX = '75%';
              positionY = '60%';
              break;
            case 5:
              // Vault (center bottom)
              positionX = '50%';
              positionY = '80%';
              break;
            default:
              positionX = '50%';
              positionY = '50%';
          }
          return <div key={zone.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 hover-scale cursor-pointer" style={{
            left: positionX,
            top: positionY
          }} onClick={() => setActiveZone(zone)}>
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center border-2 ${activeZone === zone ? 'animate-pulse-slow' : ''}`} style={{
              backgroundColor: `${zone.color}20`,
              borderColor: zone.color
            }}>
                  <span className="text-2xl">{zone.icon}</span>
                </div>
                <div className="mt-2 text-center">
                  <h3 className="font-pixel text-xs" style={{
                color: zone.color
              }}>
                    {zone.name}
                  </h3>
                </div>
              </div>;
        })}
          {/* Zone Info Popup */}
          {activeZone && <div className="absolute bottom-4 left-4 right-4 bg-dark/80 backdrop-blur-sm border border-primary/30 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0" style={{
              backgroundColor: `${activeZone.color}30`,
              borderColor: activeZone.color
            }}>
                  <span className="text-xl">{activeZone.icon}</span>
                </div>
                <div>
                  <h3 className="font-pixel text-sm mb-1" style={{
                color: activeZone.color
              }}>
                    {activeZone.name}
                  </h3>
                  <p className="text-gray-300 text-xs">
                    {activeZone.description}
                  </p>
                  <button className="mt-2 px-3 py-1 text-xs font-pixel rounded" style={{
                backgroundColor: `${activeZone.color}30`,
                color: activeZone.color
              }}>
                    Travel Here
                  </button>
                </div>
                <button className="ml-auto text-gray-400 hover:text-white" onClick={() => setActiveZone(null)}>
                  ✕
                </button>
              </div>
            </div>}
        </div>
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm mb-4">
            Click on a zone to learn more about it
          </p>
          <PixelButton>Explore All Zones</PixelButton>
        </div>
      </div>
    </section>;
};