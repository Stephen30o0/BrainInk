import React, { useState } from 'react';
import { MessageSquareIcon, SendIcon, MicIcon, BrainIcon } from 'lucide-react';
import { PixelButton } from './shared/PixelButton';
import { useNavigate } from 'react-router-dom';

export const KanaSection = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([{
    type: 'system',
    text: 'K.A.N.A. initialized. How can I help with your studies today?'
  }, {
    type: 'user',
    text: 'Can you explain photosynthesis?'
  }, {
    type: 'assistant',
    text: "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with carbon dioxide and water. It's how plants convert light energy into chemical energy!"
  }]);
  const handleSend = () => {
    if (!message.trim()) return;
    // Add user message
    setChatHistory([...chatHistory, {
      type: 'user',
      text: message
    }]);
    setMessage('');
    // Simulate AI response
    setTimeout(() => {
      setChatHistory(prev => [...prev, {
        type: 'assistant',
        text: "I'm analyzing your question... This is a simulated response from K.A.N.A., your AI learning buddy! In a real implementation, I would provide an educational answer based on your question."
      }]);
    }, 1000);
  };
  return <section className="min-h-screen w-full bg-dark py-20 relative overflow-hidden" id="kana">
      {/* Decorative circuit patterns */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="w-full h-full" style={{
        backgroundImage: 'linear-gradient(to right, #00a8ff 1px, transparent 1px), linear-gradient(to bottom, #00a8ff 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}></div>
        {/* Circuit nodes */}
        {Array.from({
        length: 20
      }).map((_, i) => <div key={i} className="absolute w-3 h-3 rounded-full bg-primary" style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        boxShadow: '0 0 10px #00a8ff',
        opacity: 0.7
      }}></div>)}
      </div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-pixel text-3xl md:text-4xl mb-4 text-primary">
            MEET <span className="text-secondary">K.A.N.A.</span>
          </h2>
          <p className="text-gray-300 font-pixel text-sm max-w-2xl mx-auto">
            Knowledge Assistant for National Academics - Your AI Learning Buddy
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* AI Character */}
          <div className="w-full md:w-1/3 flex justify-center">
            <div className="relative">
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary to-tertiary p-1">
                <div className="w-full h-full rounded-full bg-dark flex items-center justify-center overflow-hidden">
                  <BrainIcon size={64} className="text-primary animate-pulse-slow" />
                </div>
              </div>
              {/* Energy rings */}
              {[1, 2, 3].map(ring => <div key={ring} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/30" style={{
              width: `${100 + ring * 30}%`,
              height: `${100 + ring * 30}%`,
              animation: `pulse ${2 + ring}s infinite`,
              animationDelay: `${ring * 0.3}s`
            }}></div>)}
            </div>
          </div>
          {/* Chat Interface */}
          <div className="w-full md:w-2/3">
            <div className="bg-dark border-2 border-primary/30 rounded-lg overflow-hidden">
              {/* Chat Header */}
              <div className="bg-primary/20 p-3 border-b border-primary/30 flex items-center">
                <MessageSquareIcon size={18} className="text-primary mr-2" />
                <span className="font-pixel text-primary text-sm">
                  K.A.N.A. TERMINAL
                </span>
              </div>
              {/* Chat Messages */}
              <div className="h-64 overflow-y-auto p-4 custom-scrollbar">
                {chatHistory.map((msg, i) => <div key={i} className={`mb-4 flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs p-3 rounded-lg ${msg.type === 'system' ? 'bg-gray-800 text-gray-300' : msg.type === 'user' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary/20 text-secondary border border-secondary/30'}`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>)}
              </div>
              {/* Chat Input */}
              <div className="p-3 border-t border-primary/30 flex items-center">
                <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Ask K.A.N.A. anything..." className="flex-1 bg-dark border border-primary/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" onKeyPress={e => e.key === 'Enter' && handleSend()} />
                <button onClick={() => handleSend()} className="ml-2 bg-primary/20 p-2 rounded-lg hover:bg-primary/30 transition-colors">
                  <SendIcon size={18} className="text-primary" />
                </button>
                <button className="ml-2 bg-secondary/20 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                  <MicIcon size={18} className="text-secondary" />
                </button>
              </div>
            </div>
            {/* Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[{
                title: 'Ask Questions',
                icon: '❓',
                desc: 'Past papers, homework, anything'
              }, {
                title: 'Get Solutions',
                icon: '✅',
                desc: 'Step-by-step explanations'
              }, {
                title: 'Adaptive Learning',
                icon: '📈',
                desc: 'Personalized to your level'
              }, {
                title: 'Earn XP',
                icon: '⭐',
                desc: 'Learn and be rewarded'
              }].map((feature, i) => (
                <div 
                  key={i} 
                  className="bg-dark/50 border border-primary/20 p-4 rounded-lg hover:border-primary/50 transition-colors hover-scale cursor-pointer"
                >
                  <div className="text-2xl mb-2">{feature.icon}</div>
                  <h3 className="font-pixel text-primary text-xs mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-xs">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-12 text-center">
          <PixelButton primary onClick={() => navigate('/signup')}>
            Sign Up to Start Learning
          </PixelButton>
        </div>
      </div>
    </section>;
};