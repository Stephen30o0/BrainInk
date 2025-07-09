import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Brain, Lock, Mail, User, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { apiService } from '../services/apiService';

// Define the Google API interface
interface GoogleAccountsType {
  id: {
    initialize: (config: {
      client_id: string;
      callback: (response: any) => void;
      auto_select?: boolean;
      cancel_on_tap_outside?: boolean;
    }) => void;
    prompt: (callback?: (notification: any) => void) => void;
    renderButton?: (element: HTMLElement, options: any) => void;
  }
}

// Extend the Window interface
declare global {
  interface Window {
    google?: {
      accounts: GoogleAccountsType;
    };
    handleCredentialResponse?: (response: any) => void;
  }

}

export const SignUp = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    fname: '',
    lname: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [googleError, setGoogleError] = useState(false);
  const navigate = useNavigate();

  // Get redirect parameter from URL
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || '/townsquare';
  const roleIntent = searchParams.get('role'); // Get intended role from URL

  // Set login mode based on current route
  useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

  // Import from environment variable with fallback
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '969723698837-9aepndmu033gu0bk3gdrb6o1707mknp6.apps.googleusercontent.com';

  // Debug log to verify the environment variable is loaded
  useEffect(() => {
    console.log('Environment variables:', import.meta.env);
    console.log('GOOGLE_CLIENT_ID from env:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
    console.log('Using GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID);
  }, []);

  // Function to handle successful authentication and preload data
  const handleSuccessfulAuth = async (data: any, isGoogleAuth = false) => {
    try {
      // Store tokens
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('encrypted_user_data', data.encrypted_data);

      console.log(`${isGoogleAuth ? 'Google' : 'Regular'} authentication successful:`, data);

      // Start preloading data immediately
      setIsPreloading(true);
      setError('Loading your data...');

      try {
        await apiService.preloadAllData();
        console.log('✅ All data preloaded successfully');
        setError('');
        navigate(redirectTo);
      } catch (preloadError) {
        console.error('⚠️ Error preloading data:', preloadError);
        // Still navigate even if preload fails - data will load on demand
        setError('');
        navigate(redirectTo);
      } finally {
        setIsPreloading(false);
      }
    } catch (error) {
      console.error('Error in handleSuccessfulAuth:', error);
      setError('Authentication succeeded but data loading failed');
      setIsPreloading(false);
    }
  };

  useEffect(() => {
    // Validate Google Client ID
    if (!GOOGLE_CLIENT_ID) {
      console.error('GOOGLE_CLIENT_ID not found');
      setError('Google authentication not configured. Please check environment variables.');
      return;
    }

    // Define the global callback function (same as test.html)
    window.handleCredentialResponse = async (response: any) => {
      console.log("JWT ID token received:", response.credential);
      setIsLoading(true);
      setError('');

      try {
        if (!response.credential) {
          throw new Error('No credential received from Google');
        }

        const endpoint = isLogin ? '/google-login' : '/google-register';
        console.log(`Making request to: https://brainink-backend.onrender.com${endpoint}`);

        const apiResponse = await fetch(`https://brainink-backend.onrender.com${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            token: response.credential
          })
        });

        console.log('API Response status:', apiResponse.status);
        const data = await apiResponse.json();
        console.log('API Response data:', data);

        if (apiResponse.ok) {
          await handleSuccessfulAuth(data, true);
        } else {
          setError(data.detail || 'Google authentication failed');
        }
      } catch (error) {
        setError('Network error during Google authentication. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    const loadGoogleScript = () => {
      // Check if script is already loaded
      if (window.google) {
        initializeGoogle();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      script.onload = () => {
        console.log('Google script loaded successfully');
        setTimeout(initializeGoogle, 500);
      };

      script.onerror = () => {
        console.error('Failed to load Google script');
        setError('Failed to load Google Sign-In. Please refresh the page.');
      };
    };

    const initializeGoogle = () => {
      if (window.google && GOOGLE_CLIENT_ID) {
        try {
          // Use the global callback function name (same as test.html)
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: window.handleCredentialResponse!,
            auto_select: false,
            cancel_on_tap_outside: false
          });
          setGoogleLoaded(true);
          setGoogleError(false);
          console.log('Google Sign-In initialized successfully with Client ID:', GOOGLE_CLIENT_ID);

          // Immediately render the Google button when ready
          setTimeout(renderGoogleButton, 100);
        } catch (error) {
          console.error('Error initializing Google Sign-In:', error);
          setGoogleError(true);
          setGoogleLoaded(false);
        }
      } else {
        console.error('Google or Client ID not available');
        setGoogleError(true);
        setGoogleLoaded(false);
      }
    };

    loadGoogleScript();

    // Cleanup function
    return () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.remove();
      }
      // Clean up global function
      if (window.handleCredentialResponse) {
        delete window.handleCredentialResponse;
      }
    };
  }, [isLogin, navigate, GOOGLE_CLIENT_ID]); // Add GOOGLE_CLIENT_ID to dependencies

  // Alternative method - render button directly
  const renderGoogleButton = () => {
    const buttonContainer = document.getElementById('google-button-container');
    if (buttonContainer && window.google && window.google.accounts.id.renderButton) {
      buttonContainer.innerHTML = ''; // Clear existing content

      window.google.accounts.id.renderButton(buttonContainer, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: isLogin ? 'signin_with' : 'signup_with',
        logo_alignment: 'left',
        width: buttonContainer.offsetWidth || 300
      });

      // Show the button container
      buttonContainer.style.display = 'block';

      console.log('Google button rendered successfully');
    }
  };

  // Update button when login/signup mode changes
  useEffect(() => {
    if (googleLoaded) {
      setTimeout(renderGoogleButton, 100);
    }
  }, [isLogin, googleLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch("https://brainink-backend.onrender.com/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fname: form.fname,
          lname: form.lname,
          username: form.username,
          email: form.email,
          password: form.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        await handleSuccessfulAuth(data, false);
      } else {
        setError(data.detail || 'Registration failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch("https://brainink-backend.onrender.com/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: form.username,
          password: form.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        await handleSuccessfulAuth(data, false);
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Add the Google One Tap container using environment variable */}
      <div
        id="g_id_onload"
        data-client_id={GOOGLE_CLIENT_ID}
        data-callback="handleCredentialResponse"
        data-auto_prompt="false"
        style={{ display: 'none' }}
      ></div>

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
                className={`px-6 py-2 font-pixel text-sm transition-all duration-300 ${isLogin
                  ? 'bg-gradient-to-r from-primary to-secondary text-dark'
                  : 'text-primary hover:bg-primary/10'
                  }`}
                onClick={() => setIsLogin(true)}
              >
                Login
              </button>
              <button
                className={`px-6 py-2 font-pixel text-sm transition-all duration-300 ${!isLogin
                  ? 'bg-gradient-to-r from-primary to-secondary text-dark'
                  : 'text-primary hover:bg-primary/10'
                  }`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Google Sign-In Button - Only show if Google is available and no error */}
          {!googleError ? (
            <div
              id="google-button-container"
              className="w-full mb-6"
              style={{ minHeight: '40px' }}
            ></div>
          ) : (
            <div className="w-full mb-6 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm text-center">
                Google Sign-In temporarily unavailable. Please use email/password login below.
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-primary/30"></div>
            <span className="px-4 text-primary/50 text-sm font-pixel">OR</span>
            <div className="flex-1 border-t border-primary/30"></div>
          </div>

          {/* Form */}
          <form onSubmit={isLogin ? handleLogin : handleSubmit} className="space-y-6">
            {/* Show error message if exists */}
            {error && (
              <div className={`text-sm mb-4 text-center border rounded-lg p-3 ${isPreloading
                ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                : 'text-red-500 bg-red-500/10 border-red-500/20'
                }`}>
                {error}
                {isPreloading && (
                  <div className="mt-2">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                )}
              </div>
            )}

            {/* Form fields remain the same as before */}
            {!isLogin && (
              <>
                <div className="relative">
                  <label className="block font-pixel text-primary text-xs mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" size={18} />
                    <input
                      type="text"
                      value={form.fname}
                      onChange={(e) => setForm({ ...form, fname: e.target.value })}
                      className="w-full bg-[#0a0e17] border-2 border-primary/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block font-pixel text-primary text-xs mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" size={18} />
                    <input
                      type="text"
                      value={form.lname}
                      onChange={(e) => setForm({ ...form, lname: e.target.value })}
                      className="w-full bg-[#0a0e17] border-2 border-primary/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                </div>
              </>
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
              disabled={isLoading || isPreloading}
              className="w-full bg-gradient-to-r from-primary to-secondary text-dark font-pixel py-3 rounded-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading || isPreloading ? (
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