import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GraduationCapIcon, EyeIcon, EyeOffIcon, ArrowLeftIcon } from 'lucide-react';

export const TeacherLogin = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    email: 'teacher@school.edu',
    password: 'password123'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  // Get redirect URL from query parameters
  const redirectUrl = searchParams.get('redirect') || '/teacher-dashboard';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await login(form.email, form.password);
      if (success) {
        // Redirect to the specified URL or teacher dashboard
        navigate(redirectUrl);
      } else {
        setError('Invalid email or password. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
      
      {/* Back button */}
      <button
        onClick={handleBackToHome}
        className="absolute top-6 left-6 flex items-center space-x-2 text-gray-400 hover:text-primary transition-colors duration-300"
      >
        <ArrowLeftIcon size={20} />
        <span className="font-pixel text-sm">Back to Home</span>
      </button>

      <div className="relative w-full max-w-md">
        {/* Login Card */}
        <div className="bg-dark/90 backdrop-blur-md border border-primary/30 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCapIcon size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-pixel text-primary mb-2">
              Teacher Portal
            </h1>
            <p className="text-gray-400 text-sm">
              Access your teaching dashboard
            </p>
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-400 text-xs">
                <strong>Demo:</strong> Use email containing "teacher" or "edu"<br/>
                e.g., teacher@school.edu
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm font-pixel text-center">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-pixel text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-dark/60 border border-gray-600 rounded-lg focus:border-primary focus:outline-none transition-all duration-300 text-white font-pixel text-sm"
                placeholder="teacher@school.edu"
                required
                autoComplete="email"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-pixel text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-dark/60 border border-gray-600 rounded-lg focus:border-primary focus:outline-none transition-all duration-300 text-white font-pixel text-sm pr-12"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-pixel py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Logging in...</span>
                </div>
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-xs font-pixel">
              Need access? Contact your administrator
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary/20 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-secondary/20 rounded-full animate-pulse delay-1000"></div>
      </div>
    </div>
  );
};
