import React from 'react';
import { PixelButton } from './shared/PixelButton';
import { BuildingIcon, GlobeIcon, HeartIcon, CodeIcon } from 'lucide-react';
export const InstitutionalSection = () => {
  return <section className="min-h-screen w-full bg-dark py-20 relative overflow-hidden" id="institutional">
      {/* Background decorations */}
      <div className="absolute inset-0 z-0 opacity-10">
        {/* World map dots */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-4/5 h-4/5 relative">
            {Array.from({
            length: 100
          }).map((_, i) => <div key={i} className="absolute w-2 h-2 rounded-full bg-primary" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.7 + 0.3,
            animation: `pulse ${Math.random() * 4 + 2}s infinite`
          }}></div>)}
            {/* Connection lines */}
            {Array.from({
            length: 20
          }).map((_, i) => <div key={i} className="absolute bg-primary/30" style={{
            height: '1px',
            width: `${Math.random() * 20 + 5}%`,
            left: `${Math.random() * 80}%`,
            top: `${Math.random() * 100}%`,
            transform: `rotate(${Math.random() * 360}deg)`
          }}></div>)}
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-pixel text-3xl md:text-4xl mb-4 text-primary">
            FOR <span className="text-secondary">SCHOOLS</span>, COMMUNITIES &
            CHALLENGERS
          </h2>
          <p className="text-gray-300 font-pixel text-sm max-w-2xl mx-auto">
            Host Your Own National Academic League
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* For Schools */}
          <div className="bg-dark/50 border-2 border-primary/30 rounded-lg p-6 hover-scale">
            <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center mb-6">
              <BuildingIcon size={32} className="text-primary" />
            </div>
            <h3 className="font-pixel text-primary text-lg mb-4">
              For Schools
            </h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                <span className="text-gray-300 text-sm">
                  Host branded tournaments for your students
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                <span className="text-gray-300 text-sm">
                  Track student progress with advanced analytics
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                <span className="text-gray-300 text-sm">
                  Create custom curriculum aligned with standards
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                <span className="text-gray-300 text-sm">
                  Compete against other schools nationwide
                </span>
              </li>
            </ul>
            <PixelButton>School Solutions</PixelButton>
          </div>
          {/* For Communities */}
          <div className="bg-dark/50 border-2 border-secondary/30 rounded-lg p-6 hover-scale">
            <div className="w-16 h-16 rounded-lg bg-secondary/20 flex items-center justify-center mb-6">
              <HeartIcon size={32} className="text-secondary" />
            </div>
            <h3 className="font-pixel text-secondary text-lg mb-4">
              For Communities
            </h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center mr-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                </div>
                <span className="text-gray-300 text-sm">
                  Launch digital learning campaigns for NGOs
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center mr-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                </div>
                <span className="text-gray-300 text-sm">
                  Create free educational resources for underserved areas
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center mr-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                </div>
                <span className="text-gray-300 text-sm">
                  Build knowledge-sharing networks for communities
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center mr-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                </div>
                <span className="text-gray-300 text-sm">
                  Host community learning events with rewards
                </span>
              </li>
            </ul>
            <PixelButton>Community Programs</PixelButton>
          </div>
          {/* For Partners */}
          <div className="bg-dark/50 border-2 border-tertiary/30 rounded-lg p-6 hover-scale">
            <div className="w-16 h-16 rounded-lg bg-tertiary/20 flex items-center justify-center mb-6">
              <GlobeIcon size={32} className="text-tertiary" />
            </div>
            <h3 className="font-pixel text-tertiary text-lg mb-4">
              For Partners
            </h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-tertiary/20 flex items-center justify-center mr-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                </div>
                <span className="text-gray-300 text-sm">
                  Sponsor academic competitions and tournaments
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-tertiary/20 flex items-center justify-center mr-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                </div>
                <span className="text-gray-300 text-sm">
                  Integrate with national education bodies
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-tertiary/20 flex items-center justify-center mr-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                </div>
                <span className="text-gray-300 text-sm">
                  Access our API for educational platforms
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-tertiary/20 flex items-center justify-center mr-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                </div>
                <span className="text-gray-300 text-sm">
                  Co-create branded learning experiences
                </span>
              </li>
            </ul>
            <PixelButton>Partnership Options</PixelButton>
          </div>
        </div>
        {/* API Integration */}
        <div className="mt-16 bg-dark/70 border-2 border-primary/20 rounded-lg p-6">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-full md:w-1/2">
              <div className="flex items-center mb-4">
                <CodeIcon size={24} className="text-primary mr-2" />
                <h3 className="font-pixel text-primary text-lg">
                  API & Integration
                </h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Integrate Brain Ink into your existing educational platforms
                with our robust API. Access leaderboards, tournaments, and
                learning data to create custom experiences.
              </p>
              <PixelButton primary>Developer Docs</PixelButton>
            </div>
            <div className="w-full md:w-1/2 bg-dark rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre className="text-gray-400">
                <code>
                  {`// Example API call to create a tournament
fetch('https://api.brainink.io/v1/tournaments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    name: 'School Championship',
    startDate: '2023-06-15T10:00:00Z',
    participants: 64,
    prize: 1000,
    subjects: ['math', 'science']
  })
})`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>;
};