import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { SignUp2 } from '../components/ui/clean-minimal-sign-up';

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
  const [error, setError] = useState('');

  // Get redirect parameter from URL
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || '/student-hub';

  // Set login mode based on current route
  useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

  // Import from environment variable with fallback
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '969723698837-9aepndmu033gu0bk3gdrb6o1707mknp6.apps.googleusercontent.com';

  // Get the correct backend URL based on environment
  const getBackendUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'https://brainink-backend.onrender.com'; // Use production backend even in dev
    }
    return 'https://brainink-backend.onrender.com';
  };

  // Function to handle successful authentication
  const handleSuccessfulAuth = async (data: any, isGoogleAuth = false) => {
    try {
      // Store tokens
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('encrypted_user_data', data.encrypted_data);

      console.log(`${isGoogleAuth ? 'Google' : 'Regular'} authentication successful:`, data);

      // Navigate immediately without preloading data
      navigate(redirectTo);
    } catch (error) {
      console.error('Error in handleSuccessfulAuth:', error);
      setError('Authentication succeeded but navigation failed');
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

      const response = await fetch(`${getBackendUrl()}${endpoint}`, {
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

    try {
      // Initialize Google Sign-In if not already done
      if (!window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
          setTimeout(() => initializeGoogleSignIn(), 100);
        };

        script.onerror = () => {
          setError('Failed to load Google Sign-In. Please try again.');
          setIsLoading(false);
        };
      } else {
        initializeGoogleSignIn();
      }
    } catch (error) {
      console.error('Google auth setup error:', error);
      setError('Google Sign-In setup failed.');
      setIsLoading(false);
    }
  };

  const initializeGoogleSignIn = () => {
    if (window.google && GOOGLE_CLIENT_ID) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        // Always render button instead of using prompt
        renderGoogleButton();
      } catch (error) {
        console.error('Google Sign-In initialization error:', error);
        setError('Google Sign-In initialization failed.');
        setIsLoading(false);
      }
    } else {
      setError('Google Sign-In is not properly configured.');
      setIsLoading(false);
    }
  };

  // Fallback method: render a Google button
  const renderGoogleButton = () => {
    try {
      const buttonContainer = document.createElement('div');
      buttonContainer.style.position = 'fixed';
      buttonContainer.style.top = '50%';
      buttonContainer.style.left = '50%';
      buttonContainer.style.transform = 'translate(-50%, -50%)';
      buttonContainer.style.zIndex = '10000';
      buttonContainer.style.backgroundColor = 'white';
      buttonContainer.style.padding = '20px';
      buttonContainer.style.borderRadius = '8px';
      buttonContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      document.body.appendChild(buttonContainer);

      // Add close button
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '×';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '5px';
      closeButton.style.right = '10px';
      closeButton.style.background = 'none';
      closeButton.style.border = 'none';
      closeButton.style.fontSize = '20px';
      closeButton.style.cursor = 'pointer';
      closeButton.onclick = () => {
        document.body.removeChild(buttonContainer);
        setIsLoading(false);
      };
      buttonContainer.appendChild(closeButton);

      // Add title
      const title = document.createElement('h3');
      title.textContent = isLogin ? 'Sign in with Google' : 'Sign up with Google';
      title.style.margin = '0 0 20px 0';
      title.style.textAlign = 'center';
      buttonContainer.appendChild(title);

      // Render Google button
      if (window.google?.accounts?.id?.renderButton) {
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          width: '300'
        });
      }

      // Auto-cleanup after 30 seconds
      setTimeout(() => {
        if (document.body.contains(buttonContainer)) {
          document.body.removeChild(buttonContainer);
          setIsLoading(false);
        }
      }, 30000);
    } catch (error) {
      console.error('Render Google button error:', error);
      setError('Google Sign-In button failed to render.');
      setIsLoading(false);
    }
  };

  const handleCredentialResponse = async (response: any) => {
    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      console.log('Received Google credential, attempting authentication...');

      const endpoint = isLogin ? '/google-login' : '/google-register';
      const apiResponse = await fetch(`${getBackendUrl()}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        // Remove credentials for regular auth to avoid CORS issues
        body: JSON.stringify({
          token: response.credential
        })
      });

      const data = await apiResponse.json();

      if (apiResponse.ok) {
        console.log('Google authentication successful');
        // Clean up any modal dialogs
        const modals = document.querySelectorAll('[style*="position: fixed"]');
        modals.forEach(modal => {
          if (modal.parentNode === document.body) {
            document.body.removeChild(modal);
          }
        });
        await handleSuccessfulAuth(data, true);
      } else {
        console.error('Google authentication failed:', data);
        setError(data.detail || 'Google authentication failed');
      }
    } catch (error) {
      console.error('Network error during Google authentication:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setError('Network error: Unable to connect to server. Please check your internet connection and try again.');
      } else {
        setError('Google authentication failed. Please try again or use regular login.');
      }
    } finally {
      setIsLoading(false);
      // Clean up any remaining modals
      const modals = document.querySelectorAll('[style*="position: fixed"]');
      modals.forEach(modal => {
        if (modal.parentNode === document.body) {
          document.body.removeChild(modal);
        }
      });
    }
  };

  const displayError = error;

  return (
    <SignUp2
      mode={isLogin ? 'login' : 'signup'}
      onModeChange={(mode) => setIsLogin(mode === 'login')}
      onSignUp={handleFormSubmit}
      onGoogleSignUp={handleGoogleAuth}
      isLoading={isLoading}
      error={displayError}
    />
  );
};
