import React, { useState } from 'react';
import { MailIcon, SendIcon, BellIcon, InstagramIcon, TwitterIcon } from 'lucide-react';

export const JoinSection = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => {
        setSubscribed(false);
      }, 3000);
    }
  };

  return (
    <section className="py-20 bg-white" id="join">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-light text-slate-900 mb-4">
            Join Brain Ink
          </h2>
          <p className="text-xl text-slate-500 font-light">
            Don't miss the next breakthrough in education. Join our community today.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Newsletter Form */}
          <div className="py-12 border-b border-slate-200 mb-12">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-light text-slate-900 mb-4">
                Get Early Access
              </h3>
            </div>
            
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <div className="flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full border border-slate-300 rounded px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-8 py-3 rounded font-light hover:bg-blue-700 transition-colors"
              >
                Subscribe
              </button>
            </form>

            {subscribed && (
              <div className="mt-6 bg-green-50 border border-green-200 text-green-700 p-4 rounded text-center">
                Thanks for subscribing! You'll be the first to know about our updates.
              </div>
            )}
            
            <p className="text-slate-500 font-light mt-4 text-center">
              Join our waitlist to get early access to features, exclusive rewards, and tournament invitations.
            </p>
          </div>
          {/* Social Links */}
          <div className="py-12 border-b border-slate-200 mb-12">
            <h3 className="text-3xl font-light text-slate-900 mb-8 text-center">
              Connect With Us
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <a
                href="https://wa.me/250780663905"
                target="_blank"
                rel="noopener noreferrer"
                className="text-center p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </div>
                <h4 className="font-medium text-slate-900 mb-2">WhatsApp Support</h4>
                <p className="text-slate-600 font-light">
                  Get instant support and updates on WhatsApp
                </p>
              </a>

              <a
                href="https://twitter.com/brainink"
                target="_blank"
                rel="noopener noreferrer"
                className="text-center p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-slate-900 mb-2">Twitter/X</h4>
                <p className="text-slate-600 font-light">
                  Follow for updates, tips, and tournament announcements
                </p>
              </a>

              <a
                href="https://instagram.com/brainink"
                target="_blank"
                rel="noopener noreferrer"
                className="text-center p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-slate-900 mb-2">Instagram</h4>
                <p className="text-slate-600 font-light">
                  See behind-the-scenes and community highlights
                </p>
              </a>
            </div>
          </div>

          {/* Footer */}
          <footer className="py-12 border-t border-slate-200">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              {/* Company Info */}
              <div className="md:col-span-2">
                <h3 className="text-3xl font-light text-slate-900 mb-4">
                  Brain Ink
                </h3>
                <p className="text-slate-600 font-light mb-4 max-w-md">
                  The future of AI-powered education. Transforming learning through personalized, adaptive technology.
                </p>
                <p className="text-slate-500 font-light">
                  © 2025 Brain Ink. All rights reserved.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-medium text-slate-900 mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><a href="/about" className="text-slate-600 hover:text-blue-600 transition-colors font-light">About Us</a></li>
                  <li><a href="/features" className="text-slate-600 hover:text-blue-600 transition-colors font-light">Features</a></li>
                  <li><a href="/pricing" className="text-slate-600 hover:text-blue-600 transition-colors font-light">Pricing</a></li>
                  <li><a href="/contact" className="text-slate-600 hover:text-blue-600 transition-colors font-light">Contact</a></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="font-medium text-slate-900 mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><a href="/terms" className="text-slate-600 hover:text-blue-600 transition-colors font-light">Terms of Service</a></li>
                  <li><a href="/privacy" className="text-slate-600 hover:text-blue-600 transition-colors font-light">Privacy Policy</a></li>
                  <li><a href="/cookies" className="text-slate-600 hover:text-blue-600 transition-colors font-light">Cookie Policy</a></li>
                </ul>
              </div>
            </div>

            {/* Contact & Social */}
            <div className="border-t border-slate-200 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <p className="text-slate-600 font-light">
                    Questions? Email us at 
                    <a href="https://mail.google.com/mail/?view=cm&fs=1&to=info@brainink.com&su=Question%20about%20Brain%20Ink&body=Hi%2C%20I%20have%20a%20question%20about%20Brain%20Ink." target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1 font-light">
                      info@brainink.com
                    </a>
                  </p>
                </div>
                
                <div className="flex space-x-4">
                  <a href="https://twitter.com/brainink" target="_blank" rel="noopener noreferrer" 
                     className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  <a href="https://wa.me/250780663905" target="_blank" rel="noopener noreferrer"
                     className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  </a>
                  <a href="https://instagram.com/brainink" target="_blank" rel="noopener noreferrer"
                     className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white hover:from-purple-600 hover:to-pink-600 transition-all">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
};