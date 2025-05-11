import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Lock, Mail, User, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';

export const SignUp = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    navigate('/townsquare');
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-tertiary/10 animate-gradient"></div>
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              backgroundColor: `rgba(${Math.random() * 100}, ${Math.random() * 200 + 55}, ${Math.random() * 255}, 0.5)`,
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 10 + 5}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="w-full max-w-md relative z-10 px-4">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-tertiary p-1 mx-auto mb-4 animate-pulse-slow">
            <div className="w-full h-full rounded-full bg-[#0a0e17] flex items-center justify-center overflow-hidden">
              <img
                src="/Screenshot_2025-05-05_141452-removebg-preview.png"
                alt="Brain Ink Logo"
                className="w-20 h-20 object-contain"
              />
            </div>
          </div>
          <h1 className="font-pixel text-2xl text-primary mb-2">
            Welcome to <span className="text-tertiary">Brain Ink</span>
          </h1>
          <p className="text-gray-400 text-sm">
            {isLogin ? 'Enter the world of knowledge' : 'Begin your learning journey'}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-[#0a0e17]/50 backdrop-blur-md border-2 border-primary/30 rounded-lg p-8 shadow-xl">
          {/* Toggle Buttons */}
          <div className="flex justify-center mb-8">
            <div className="flex rounded-lg overflow-hidden border-2 border-primary/30 bg-[#0a0e17]">
              <button
                className={`px-6 py-2 font-pixel text-sm transition-all duration-300 ${
                  isLogin
                    ? 'bg-gradient-to-r from-primary to-secondary text-dark'
                    : 'text-primary hover:bg-primary/10'
                }`}
                onClick={() => setIsLogin(true)}
              >
                Login
              </button>
              <button
                className={`px-6 py-2 font-pixel text-sm transition-all duration-300 ${
                  !isLogin
                    ? 'bg-gradient-to-r from-primary to-secondary text-dark'
                    : 'text-primary hover:bg-primary/10'
                }`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="relative">
                <label className="block font-pixel text-primary text-xs mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" size={18} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-[#0a0e17] border-2 border-primary/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>
              </div>
            )}

            <div className="relative">
              <label className="block font-pixel text-primary text-xs mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" size={18} />
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full bg-[#0a0e17] border-2 border-primary/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <label className="block font-pixel text-primary text-xs mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-[#0a0e17] border-2 border-primary/30 rounded-lg pl-10 pr-10 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/50 hover:text-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary to-secondary text-dark font-pixel py-3 rounded-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Enter the World' : 'Begin Your Journey'}
                  <ArrowRight className="ml-2" size={18} />
                </>
              )}
            </button>
          </form>

          {/* Features */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { icon: <Brain size={16} />, text: 'AI Learning' },
              { icon: <Sparkles size={16} />, text: 'Earn Rewards' },
              { icon: <Lock size={16} />, text: 'Secure' },
              { icon: <User size={16} />, text: 'Community' }
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-primary/70 text-sm"
              >
                {feature.icon}
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};