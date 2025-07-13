import React, { useState } from 'react';
import { X, Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'email' | 'code' | 'password' | 'success';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const resetModal = () => {
        setCurrentStep('email');
        setEmail('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setLoading(false);
        setShowPassword(false);
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('https://brainink-backend.onrender.com/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setCurrentStep('code');
            } else {
                setError(data.detail || 'Failed to send reset code');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('https://brainink-backend.onrender.com/verify-reset-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    reset_code: resetCode,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setCurrentStep('password');
            } else {
                setError(data.detail || 'Invalid reset code');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('https://brainink-backend.onrender.com/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    reset_code: resetCode,
                    new_password: newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setCurrentStep('success');
            } else {
                setError(data.detail || 'Failed to reset password');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('https://brainink-backend.onrender.com/resend-reset-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setError('New reset code sent to your email');
            } else {
                setError(data.detail || 'Failed to resend code');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        {currentStep === 'email' && 'Forgot Password'}
                        {currentStep === 'code' && 'Enter Reset Code'}
                        {currentStep === 'password' && 'Create New Password'}
                        {currentStep === 'success' && 'Password Reset Success'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className={`mb-4 p-3 rounded-lg border ${error.includes('sent') || error.includes('New reset code')
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Step 1: Email */}
                {currentStep === 'email' && (
                    <form onSubmit={handleSendCode} className="space-y-4">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-blue-600" />
                            </div>
                            <p className="text-gray-600 text-sm">
                                Enter your email address and we'll send you a reset code.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending...' : 'Send Reset Code'}
                        </button>
                    </form>
                )}

                {/* Step 2: Code Verification */}
                {currentStep === 'code' && (
                    <form onSubmit={handleVerifyCode} className="space-y-4">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-green-600" />
                            </div>
                            <p className="text-gray-600 text-sm">
                                We've sent a 6-digit code to <strong>{email}</strong>
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reset Code
                            </label>
                            <input
                                type="text"
                                value={resetCode}
                                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono"
                                placeholder="000000"
                                maxLength={6}
                                required
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={() => setCurrentStep('email')}
                                className="flex-1 flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading || resetCode.length !== 6}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </button>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={loading}
                                className="text-blue-600 hover:text-blue-700 text-sm transition-colors disabled:opacity-50"
                            >
                                Didn't receive the code? Resend
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 3: New Password */}
                {currentStep === 'password' && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-purple-600" />
                            </div>
                            <p className="text-gray-600 text-sm">
                                Create a new password for your account
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                                    placeholder="Enter new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Confirm new password"
                                required
                            />
                        </div>

                        <div className="text-xs text-gray-500">
                            Password must be at least 8 characters long
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={() => setCurrentStep('code')}
                                className="flex-1 flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 4: Success */}
                {currentStep === 'success' && (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Password Reset Successfully!</h3>
                        <p className="text-gray-600 text-sm">
                            Your password has been reset. You can now log in with your new password.
                        </p>
                        <button
                            onClick={handleClose}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                        >
                            Continue to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
