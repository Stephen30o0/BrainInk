import React from 'react';
import { PixelButton } from './shared/PixelButton';
import { LinkedinIcon, GithubIcon, TwitterIcon } from 'lucide-react';
export const TeamSection = () => {
  const team = [{
    name: 'Eseosa Kay-Uwagboe',
    title: 'Code Architect & Unity Mage',
    avatar: '👨‍💻',
    bio: 'Full-stack developer with a passion for educational technology and game design.',
    links: {
      linkedin: '#',
      github: '#',
      twitter: '#'
    }
  }, {
    name: 'Kibogora Nsora',
    title: 'AI Sorcerer & NLP Alchemist',
    avatar: '🧙‍♂️',
    bio: 'AI specialist focused on natural language processing and educational applications.',
    links: {
      linkedin: '#',
      github: '#',
      twitter: '#'
    }
  }, {
    name: 'Stephen Olurinola',
    title: 'Backend Blacksmith & Unity Warrior',
    avatar: '🛡️',
    bio: 'Backend developer with expertise in blockchain technology and game mechanics.',
    links: {
      linkedin: '#',
      github: '#',
      twitter: '#'
    }
  }];
  return <section className="min-h-screen w-full bg-dark py-20 relative overflow-hidden" id="team">
      {/* Background decorations */}
      <div className="absolute inset-0 z-0">
        {/* Grid pattern */}
        <div className="w-full h-full opacity-5" style={{
        backgroundImage: 'linear-gradient(to right, #00a8ff 1px, transparent 1px), linear-gradient(to bottom, #00a8ff 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}></div>
      </div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-pixel text-3xl md:text-4xl mb-4 text-primary">
            THE LEGENDS <span className="text-secondary">BEHIND THE WORLD</span>
          </h2>
          <p className="text-gray-300 font-pixel text-sm max-w-2xl mx-auto">
            Meet the team building Brain Ink
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member, index) => <div key={index} className="bg-dark/50 border-2 border-primary/30 rounded-lg p-6 hover-scale">
              <div className="text-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-tertiary p-1 mx-auto">
                  <div className="w-full h-full rounded-full bg-dark flex items-center justify-center overflow-hidden">
                    <span className="text-4xl">{member.avatar}</span>
                  </div>
                </div>
                <h3 className="font-pixel text-primary text-lg mt-4">
                  {member.name}
                </h3>
                <div className="text-secondary text-sm">{member.title}</div>
              </div>
              <p className="text-gray-300 text-center mb-6">{member.bio}</p>
              <div className="flex justify-center space-x-4">
                <a href={member.links.linkedin} className="text-gray-400 hover:text-primary transition-colors">
                  <LinkedinIcon size={20} />
                </a>
                <a href={member.links.github} className="text-gray-400 hover:text-primary transition-colors">
                  <GithubIcon size={20} />
                </a>
                <a href={member.links.twitter} className="text-gray-400 hover:text-primary transition-colors">
                  <TwitterIcon size={20} />
                </a>
              </div>
            </div>)}
        </div>
        {/* Timeline */}
        <div className="mt-16 bg-dark/70 border-2 border-primary/20 rounded-lg p-6">
          <h3 className="font-pixel text-primary text-lg mb-6 text-center">
            Our Journey
          </h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary/30 transform -translate-x-1/2"></div>
            {[{
            year: '2022',
            event: 'Concept Development',
            desc: 'Initial idea for Brain Ink was born'
          }, {
            year: 'Early 2023',
            event: 'K.A.N.A. Development',
            desc: 'First version of our AI assistant created'
          }, {
            year: 'Mid 2023',
            event: 'Platform Beta',
            desc: 'First users testing the learning platform'
          }, {
            year: 'Late 2023',
            event: 'Blockchain Integration',
            desc: 'INK token system implementation'
          }, {
            year: '2024',
            event: 'Global Expansion',
            desc: 'Launching in multiple countries'
          }].map((milestone, i) => <div key={i} className={`flex mb-8 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className="w-1/2 px-6">
                  <div className={`${i % 2 === 0 ? 'text-right' : 'text-left'}`}>
                    <h4 className="font-pixel text-primary text-sm mb-1">
                      {milestone.event}
                    </h4>
                    <p className="text-gray-300 text-sm">{milestone.desc}</p>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute top-0 left-1/2 w-4 h-4 rounded-full bg-primary transform -translate-x-1/2"></div>
                </div>
                <div className="w-1/2 px-6">
                  <div className={`${i % 2 === 0 ? 'text-left' : 'text-right'}`}>
                    <span className="font-pixel text-secondary text-sm">
                      {milestone.year}
                    </span>
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </div>
    </section>;
};