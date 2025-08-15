import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { MarketingHeader } from '../../components/marketing/MarketingHeader';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import emailjs from '@emailjs/browser';

interface FormData {
    fullName: string;
    workEmail: string;
    companyName: string;
    message: string;
}

export const ContactUs: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        workEmail: '',
        companyName: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Partial<FormData>>({});

    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!formData.workEmail.trim()) {
            newErrors.workEmail = 'Work email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.workEmail)) {
            newErrors.workEmail = 'Please enter a valid email address';
        }

        if (!formData.companyName.trim()) {
            newErrors.companyName = 'Company name is required';
        }

        if (!formData.message.trim()) {
            newErrors.message = 'Message is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Send to our backend API
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Mark as submitted successfully
                setIsSubmitted(true);
                setFormData({ fullName: '', workEmail: '', companyName: '', message: '' });
            } else {
                throw new Error(result.error || 'Failed to send email');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            setSubmitError('Failed to send message. Please try again or contact us directly at braininkedu@gmail.com');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name as keyof FormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-white text-slate-900">
                <MarketingHeader />

                <div className="pt-24 pb-16 sm:pt-32 sm:pb-24">
                    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
                        <div className="mb-8">
                            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                                Thank You!
                            </h1>
                            <p className="text-lg text-slate-600 mb-8">
                                Your message has been sent successfully. We'll get back to you as soon as possible.
                            </p>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>

                <MarketingFooter />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900">
            <MarketingHeader />

            <div className="pt-24 pb-16 sm:pt-32 sm:pb-24">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-12 sm:mb-16">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Link>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                            Contact Us
                        </h1>
                        <p className="text-xl sm:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                            Get in touch with our team. We'd love to hear from you and discuss how BrainInk can help transform your educational experience.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
                        {/* Contact Info */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900 mb-6">
                                    Let's Talk
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1">
                                            <Mail className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">Email Us</h3>
                                            <p className="text-slate-600">braininkedu@gmail.com</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8">
                                <h3 className="text-xl font-semibold text-slate-900 mb-4">
                                    Why Choose BrainInk?
                                </h3>
                                <ul className="space-y-3 text-slate-700">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span>AI-powered instant grading saves teachers hours</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span>Real-time analytics and progress tracking</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span>Built specifically for African classrooms</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span>Quick setup - ready in minutes, not hours</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-semibold text-slate-900 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 rounded-lg border ${errors.fullName ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors`}
                                        placeholder="Enter your full name"
                                    />
                                    {errors.fullName && (
                                        <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="workEmail" className="block text-sm font-semibold text-slate-900 mb-2">
                                        Work Email *
                                    </label>
                                    <input
                                        type="email"
                                        id="workEmail"
                                        name="workEmail"
                                        value={formData.workEmail}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 rounded-lg border ${errors.workEmail ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors`}
                                        placeholder="your.email@company.com"
                                    />
                                    {errors.workEmail && (
                                        <p className="mt-1 text-sm text-red-600">{errors.workEmail}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="companyName" className="block text-sm font-semibold text-slate-900 mb-2">
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="companyName"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 rounded-lg border ${errors.companyName ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors`}
                                        placeholder="Your school or organization"
                                    />
                                    {errors.companyName && (
                                        <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-semibold text-slate-900 mb-2">
                                        What would you like to see? *
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={5}
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 rounded-lg border ${errors.message ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors resize-vertical`}
                                        placeholder="Tell us about your specific needs, what features you're most interested in, or any questions you have about BrainInk..."
                                    />
                                    {errors.message && (
                                        <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                                    )}
                                </div>

                                {submitError && (
                                    <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-red-700">{submitError}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <MarketingFooter />
        </div>
    );
};

export default ContactUs;
