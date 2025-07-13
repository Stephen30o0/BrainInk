import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeOffIcon, ArrowLeftIcon, SchoolIcon } from 'lucide-react';
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
    const [form, setForm] = useState({
        username: '',
        password: '',
        email: '',
        fname: '',
        lname: ''
    });
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [googleLoaded, setGoogleLoaded] = useState(false);
    const [googleError, setGoogleError] = useState(false);
    const navigate = useNavigate();

    // Google Client ID from environment
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '969723698837-9aepndmu033gu0bk3gdrb6o1707mknp6.apps.googleusercontent.com';

    useEffect(() => {
        // Validate Google Client ID
        if (!GOOGLE_CLIENT_ID) {
            console.error('GOOGLE_CLIENT_ID not found');
            setGoogleError(true);
            return;
        }

        // Define the global callback function for Google authentication
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
                    // Store authentication data
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('encrypted_user_data', data.encrypted_data);

                    // Clear any existing role to force role selection
                    localStorage.removeItem('user_role');

                    console.log('✅ Google authentication successful');
                    // Redirect to role selection
                    navigate('/role-selection');
                } else {
                    setError(data.detail || 'Google authentication failed');
                }
            } catch (error) {
                console.error('Google authentication error:', error);
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
                setGoogleError(true);
            };
        };

        const initializeGoogle = () => {
            if (window.google && GOOGLE_CLIENT_ID) {
                try {
                    window.google.accounts.id.initialize({
                        client_id: GOOGLE_CLIENT_ID,
                        callback: window.handleCredentialResponse!,
                        auto_select: false,
                        cancel_on_tap_outside: false
                    });
                    setGoogleLoaded(true);
                    setGoogleError(false);
                    console.log('Google Sign-In initialized successfully with Client ID:', GOOGLE_CLIENT_ID);

                    // Render the Google button when ready
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
            if (window.handleCredentialResponse) {
                delete window.handleCredentialResponse;
            }
        };
    }, [navigate, GOOGLE_CLIENT_ID, isLogin]);

    // Render Google Sign-In button
    const renderGoogleButton = () => {
        const buttonContainer = document.getElementById('google-button-container-school');
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

    // Update button when Google loads or mode changes
    useEffect(() => {
        if (googleLoaded) {
            setTimeout(renderGoogleButton, 100);
        }
    }, [googleLoaded, isLogin]);

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
        if (isLogin) {
            await handleLogin();
        } else {
            await handleSignUp();
        }
    };

    const handleLogin = async () => {
        if (!form.username || !form.password) {
            setError('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            console.log('🔐 Attempting school login...');
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
                console.log('✅ Backend login successful');

                // Store authentication data
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('encrypted_user_data', data.encrypted_data);

                // Clear any existing role to force role selection
                localStorage.removeItem('user_role');

                // Redirect to role selection
                navigate('/role-selection');
            } else {
                console.log('⚠️ Backend login failed, showing error');
                setError(data.detail || 'Invalid username or password. Please check your credentials.');
            }
        } catch (error) {
            console.error('School login error:', error);
            setError('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async () => {
        if (!form.fname || !form.lname || !form.username || !form.email || !form.password) {
            setError('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            console.log('� Attempting school registration...');
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
                console.log('✅ Backend registration successful');

                // Store authentication data
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('encrypted_user_data', data.encrypted_data);

                // Clear any existing role to force role selection
                localStorage.removeItem('user_role');

                // Redirect to role selection
                navigate('/role-selection');
            } else {
                console.log('⚠️ Backend registration failed, showing error');
                setError(data.detail || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('School registration error:', error);
            setError('Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToHome = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-gray-50/50"></div>
            <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.1) 1px, transparent 0)',
                backgroundSize: '20px 20px'
            }}></div>

            {/* Back button */}
            <button
                onClick={handleBackToHome}
                className="absolute top-6 left-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-all duration-300 z-10"
            >
                <ArrowLeftIcon size={20} />
                <span className="font-medium text-sm">Back to Home</span>
            </button>

            <div className="relative w-full max-w-md">
                {/* Login Card */}
                <div className="bg-white backdrop-blur-md border border-gray-200 rounded-2xl p-8 shadow-xl relative z-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <SchoolIcon size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            School Portal
                        </h1>
                        <p className="text-gray-600 text-sm">
                            {isLogin ? 'Access your educational dashboard' : 'Create your school account'}
                        </p>
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-700 text-xs font-medium">
                                🎓 For Teachers, Principals, and School Staff
                            </p>
                        </div>
                    </div>

                    {/* Toggle Buttons */}
                    <div className="flex justify-center mb-8">
                        <div className="flex rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
                            <button
                                type="button"
                                className={`px-6 py-2 text-sm font-medium transition-all duration-300 ${isLogin
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                                onClick={() => setIsLogin(true)}
                            >
                                Login
                            </button>
                            <button
                                type="button"
                                className={`px-6 py-2 text-sm font-medium transition-all duration-300 ${!isLogin
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                                onClick={() => setIsLogin(false)}
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Google Sign-In Button - Only show if Google is available and no error */}
                    {!googleError ? (
                        <div className="mb-6">
                            <div
                                id="google-button-container-school"
                                className="w-full"
                                style={{ minHeight: '40px' }}
                            ></div>
                        </div>
                    ) : (
                        <div className="w-full mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-700 text-sm text-center">
                                Google Sign-In temporarily unavailable. Please use username/password login below.
                            </p>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="flex items-center my-6">
                        <div className="flex-1 border-t border-gray-300"></div>
                        <span className="px-4 text-gray-500 text-sm font-medium">OR</span>
                        <div className="flex-1 border-t border-gray-300"></div>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* First Name and Last Name - Only show in signup mode */}
                        {!isLogin && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="fname" className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        id="fname"
                                        name="fname"
                                        value={form.fname}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                        placeholder="First name"
                                        required={!isLogin}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="lname" className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        id="lname"
                                        name="lname"
                                        value={form.lname}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                        placeholder="Last name"
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Username Field */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={form.username}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        {/* Email Field - Only show in signup mode */}
                        {!isLogin && (
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                    placeholder="Enter your email"
                                    required={!isLogin}
                                />
                            </div>
                        )}

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 pr-12"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300"
                                >
                                    {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    {isLogin ? 'Signing in...' : 'Creating account...'}
                                </>
                            ) : (
                                isLogin ? 'Access School Portal' : 'Create School Account'
                            )}
                        </button>

                        {/* Forgot Password Button - Only show in login mode */}
                        {isLogin && (
                            <div className="text-center mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-blue-600 hover:text-blue-700 text-sm transition-colors duration-300 font-medium"
                                >
                                    Forgot your password?
                                </button>
                            </div>
                        )}
                    </form>

                    {/* Info Box */}
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-700 text-sm">
                            {isLogin
                                ? "After login, you'll select your role (Teacher, Principal, or Student) to access your personalized dashboard."
                                : "After creating your account, you'll select your role (Teacher, Principal, or Student) to access your personalized dashboard."
                            }
                        </p>
                    </div>

                    {/* Alternative Login */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm">
                            Need a personal account?{' '}
                            <button
                                onClick={() => navigate('/signup')}
                                className="text-blue-600 hover:text-blue-700 transition-colors duration-300 font-medium"
                            >
                                Sign up here
                            </button>
                        </p>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-100 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-blue-200 rounded-full animate-pulse delay-1000"></div>
            </div>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                isOpen={showForgotPassword}
                onClose={() => setShowForgotPassword(false)}
            />
        </div>
    );
};
