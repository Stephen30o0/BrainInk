import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignIn2 } from '../components/ui/clean-minimal-sign-in';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';

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

export const SchoolLogin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const navigate = useNavigate();

    // Google Client ID from environment
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '969723698837-9aepndmu033gu0bk3gdrb6o1707mknp6.apps.googleusercontent.com';

    useEffect(() => {
        // Define the global callback function for Google authentication
        window.handleCredentialResponse = async (response: any) => {
            console.log("JWT ID token received:", response.credential);
            setIsLoading(true);
            setError('');

            try {
                if (!response.credential) {
                    throw new Error('No credential received from Google');
                }

                const apiResponse = await fetch(`https://brainink-backend.onrender.com/google-login`, {
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
                    // Store authentication data
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('encrypted_user_data', data.encrypted_data);
                    localStorage.setItem('user_role', 'school'); // Set school role

                    console.log('✅ School Google authentication successful');
                    // Redirect to appropriate dashboard
                    navigate('/teacher-dashboard');
                } else {
                    setError(data.detail || 'Google authentication failed');
                }
            } catch (error) {
                console.error('Google auth error:', error);
                setError('Network error during Google authentication. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        // Load Google Sign-In script
        if (!window.google) {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);

            script.onload = () => {
                console.log('Google script loaded successfully');
            };

            script.onerror = () => {
                console.error('Failed to load Google script');
                setError('Failed to load Google Sign-In. Please refresh the page.');
            };
        }
    }, [navigate]);

    // Handle email/password sign in
    const handleEmailSignIn = async (email: string, password: string) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('https://brainink-backend.onrender.com/login', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: email, // Using email as username
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Store authentication data
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('encrypted_user_data', data.encrypted_data);
                localStorage.setItem('user_role', 'school'); // Set school role

                console.log('✅ School email authentication successful');
                // Redirect to appropriate dashboard
                navigate('/teacher-dashboard');
            } else {
                setError(data.detail || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Google authentication
    const handleGoogleAuth = () => {
        setIsLoading(true);
        setError('');

        if (window.google && GOOGLE_CLIENT_ID) {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: window.handleCredentialResponse!,
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

    const handleForgotPassword = () => {
        setShowForgotPassword(true);
    };

    return (
        <>
            <SignIn2
                onSignIn={handleEmailSignIn}
                onGoogleSignIn={handleGoogleAuth}
                isLoading={isLoading}
                error={error}
                title="School Portal Sign In"
                subtitle="Access your school's BrainInk dashboard to manage teachers and students"
                buttonText="Sign In to Portal"
                showForgotPassword={true}
                onForgotPassword={handleForgotPassword}
            />
            
            {showForgotPassword && (
                <ForgotPasswordModal 
                    isOpen={showForgotPassword}
                    onClose={() => setShowForgotPassword(false)}
                />
            )}
        </>
    );
};
