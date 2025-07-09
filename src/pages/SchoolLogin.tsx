import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeOffIcon, ArrowLeftIcon, SchoolIcon } from 'lucide-react';

export const SchoolLogin = () => {
    const [form, setForm] = useState({
        username: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

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
        if (!form.username || !form.password) {
            setError('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Use the same login endpoint as SignUp page
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

                // Store authentication data (same as SignUp page)
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
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <SchoolIcon size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-pixel text-primary mb-2">
                            School Portal
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Access your educational dashboard
                        </p>
                        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                            <p className="text-blue-300 text-xs">
                                🎓 For Teachers, Principals, and School Staff
                            </p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6">
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username Field */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={form.username}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 pr-12"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300"
                                >
                                    {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-dark font-semibold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Signing in...
                                </>
                            ) : (
                                'Access School Portal'
                            )}
                        </button>
                    </form>

                    {/* Info Box */}
                    <div className="mt-8 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                        <p className="text-blue-300 text-sm">
                            After login, you'll select your role (Teacher, Principal, or Student) to access your personalized dashboard.
                        </p>
                    </div>

                    {/* Alternative Login */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-400 text-sm">
                            Need a personal account?{' '}
                            <button
                                onClick={() => navigate('/signup')}
                                className="text-primary hover:text-primary/80 transition-colors duration-300"
                            >
                                Sign up here
                            </button>
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
