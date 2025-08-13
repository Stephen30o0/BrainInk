import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { SignUp2 } from '../components/ui/clean-minimal-sign-up';
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
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [error, setError] = useState('');

  // Get redirect parameter from URL
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || '/townsquare';

  // Set login mode based on current route
  useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

  // Import from environment variable with fallback
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '969723698837-9aepndmu033gu0bk3gdrb6o1707mknp6.apps.googleusercontent.com';

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

  // Handle form submission for both login and signup
  const handleFormSubmit = async (firstName: string, lastName: string, username: string, email: string, password: string) => {
    setIsLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/login' : '/register';
      const body = isLogin 
        ? { username, password }
        : { fname: firstName, lname: lastName, username, email, password };

      const response = await fetch(`https://brainink-backend.onrender.com${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        await handleSuccessfulAuth(data, false);
      } else {
        setError(data.detail || `${isLogin ? 'Login' : 'Registration'} failed`);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google authentication
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError('');

    // Initialize Google Sign-In if not already done
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      script.onload = () => {
        initializeGoogleSignIn();
      };

      script.onerror = () => {
        setError('Failed to load Google Sign-In. Please try again.');
        setIsLoading(false);
      };
    } else {
      initializeGoogleSignIn();
    }
  };

  const initializeGoogleSignIn = () => {
    if (window.google && GOOGLE_CLIENT_ID) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: false
      });
      
      // Trigger the sign-in prompt
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setError('Google Sign-In was cancelled or blocked.');
          setIsLoading(false);
        }
      });
    } else {
      setError('Google Sign-In is not properly configured.');
      setIsLoading(false);
    }
  };

  const handleCredentialResponse = async (response: any) => {
    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      const endpoint = isLogin ? '/google-login' : '/google-register';
      const apiResponse = await fetch(`https://brainink-backend.onrender.com${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token: response.credential
        })
      });

      const data = await apiResponse.json();

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

  const displayError = error || (isPreloading ? 'Loading your data...' : '');

  return (
    <SignUp2
      mode={isLogin ? 'login' : 'signup'}
      onModeChange={(mode) => setIsLogin(mode === 'login')}
      onSignUp={handleFormSubmit}
      onGoogleSignUp={handleGoogleAuth}
      isLoading={isLoading || isPreloading}
      error={displayError}
    />
  );
};
