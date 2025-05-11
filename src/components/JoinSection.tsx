import React, { useState } from 'react';
import { PixelButton } from './shared/PixelButton';
import { MailIcon, SendIcon, BellIcon, InstagramIcon, TwitterIcon } from 'lucide-react';
export const JoinSection = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const handleSubscribe = e => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => {
        setSubscribed(false);
      }, 3000);
    }
  };
  return <section className="min-h-screen w-full bg-dark py-20 relative overflow-hidden" id="join">
      {/* Background decorations */}
      <div className="absolute inset-0 z-0">
        {/* Animated gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-tertiary/5 opacity-30" style={{
        animation: 'pulse 10s infinite'
      }}></div>
        {/* Pixel particles */}
        {Array.from({
        length: 20
      }).map((_, i) => <div key={i} className="absolute animate-float" style={{
        width: `${Math.random() * 10 + 5}px`,
        height: `${Math.random() * 10 + 5}px`,
        backgroundColor: i % 3 === 0 ? '#00a8ff30' : i % 3 === 1 ? '#00ffaa30' : '#ff00aa30',
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDuration: `${Math.random() * 15 + 10}s`,
        animationDelay: `${Math.random() * 5}s`
      }} />)}
      </div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-pixel text-3xl md:text-4xl mb-4 text-primary">
            JOIN THE <span className="text-tertiary">INKVERSE</span>
          </h2>
          <p className="text-gray-300 font-pixel text-sm max-w-2xl mx-auto">
            Don't Miss the Next Tournament. Join the Town.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="bg-dark/50 border-2 border-primary/30 rounded-lg p-8">
            {/* Newsletter Form */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <BellIcon size={24} className="text-primary mr-2" />
                <h3 className="font-pixel text-primary text-lg">
                  Get Early Access
                </h3>
              </div>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <MailIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" className="w-full bg-dark border border-primary/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary" required />
                </div>
                <PixelButton primary type="submit">
                  <span className="flex items-center">
                    Subscribe
                    <SendIcon size={16} className="ml-2" />
                  </span>
                </PixelButton>
              </form>
              {subscribed && <div className="mt-4 bg-green-500/20 border border-green-500/30 text-green-400 p-3 rounded-lg text-sm">
                  Thanks for subscribing! You'll be the first to know about our
                  updates.
                </div>}
              <p className="text-gray-400 text-xs mt-4">
                Join our waitlist to get early access to features, exclusive
                rewards, and tournament invitations.
              </p>
            </div>
            {/* Social Links */}
            <div className="border-t border-primary/20 pt-8">
              <h3 className="font-pixel text-primary text-lg mb-6 text-center">
                Connect With Us
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <a href="#discord" className="flex flex-col items-center bg-dark border border-primary/20 rounded-lg p-6 hover:border-primary/50 transition-colors hover-scale">
                  <div size={32} className="text-[#5865F2] mb-4" />
                  <h4 className="font-pixel text-primary text-sm mb-2">
                    Discord Community
                  </h4>
                  <p className="text-gray-400 text-xs text-center">
                    Join our learning community with over 5,000 members
                  </p>
                </a>
                <a href="#twitter" className="flex flex-col items-center bg-dark border border-primary/20 rounded-lg p-6 hover:border-primary/50 transition-colors hover-scale">
                  <TwitterIcon size={32} className="text-[#1DA1F2] mb-4" />
                  <h4 className="font-pixel text-primary text-sm mb-2">
                    Twitter/X
                  </h4>
                  <p className="text-gray-400 text-xs text-center">
                    Follow for updates, tips, and tournament announcements
                  </p>
                </a>
                <a href="#instagram" className="flex flex-col items-center bg-dark border border-primary/20 rounded-lg p-6 hover:border-primary/50 transition-colors hover-scale">
                  <InstagramIcon size={32} className="text-[#E1306C] mb-4" />
                  <h4 className="font-pixel text-primary text-sm mb-2">
                    Instagram
                  </h4>
                  <p className="text-gray-400 text-xs text-center">
                    See behind-the-scenes and community highlights
                  </p>
                </a>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="mt-16 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-tertiary p-1 mx-auto mb-4">
              <div className="w-full h-full rounded-full bg-dark flex items-center justify-center overflow-hidden">
                <img src="/Screenshot_2025-05-05_141452-removebg-preview.png" alt="Brain Ink Logo" className="w-20 h-20 object-contain" />
              </div>
            </div>
            <h3 className="font-pixel text-primary text-lg mb-2">BRAIN INK</h3>
            <p className="text-gray-400 text-sm mb-6">
              The Future of Learning is a Game
            </p>
            <div className="flex justify-center space-x-6 mb-8">
              <a href="#terms" className="text-gray-400 hover:text-white text-sm">
                Terms
              </a>
              <a href="#privacy" className="text-gray-400 hover:text-white text-sm">
                Privacy
              </a>
              <a href="#contact" className="text-gray-400 hover:text-white text-sm">
                Contact
              </a>
            </div>
            <p className="text-gray-500 text-xs">
              © 2023 Brain Ink. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </section>;
};