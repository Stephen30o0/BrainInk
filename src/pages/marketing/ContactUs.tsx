import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle, AlertCircle, BarChart3, Globe, Zap, ListChecks } from 'lucide-react';
import MarketingHeader from '../../components/marketing/MarketingHeader';
import MarketingFooter from '../../components/marketing/MarketingFooter';
import { motion } from 'framer-motion';
import { ScrollReveal } from '../../components/marketing/ScrollReveal';

/* ─── Types ─── */
interface FormData {
  fullName: string;
  workEmail: string;
  companyName: string;
  interest: string;
  message: string;
}

/* ─── Small feature card shown on the left ─── */
const FeatureChip: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  badge?: React.ReactNode;
}> = ({ icon, iconBg, title, description, badge }) => (
  <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 group cursor-default">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      {badge}
    </div>
    <h3 className="font-medium text-stone-900 mb-1">{title}</h3>
    <p className="text-sm text-stone-500 leading-snug">{description}</p>
  </div>
);

/* ─── Interest radio pill ─── */
const InterestPill: React.FC<{
  value: string;
  label: string;
  selected: boolean;
  onChange: (v: string) => void;
}> = ({ value, label, selected, onChange }) => (
  <label className="cursor-pointer">
    <input
      type="radio"
      name="interest"
      value={value}
      checked={selected}
      onChange={() => onChange(value)}
      className="peer sr-only"
    />
    <div className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 peer-checked:bg-blue-50 peer-checked:border-blue-200 peer-checked:text-blue-700 transition-all">
      {label}
    </div>
  </label>
);

/* ═══════════ MAIN COMPONENT ═══════════ */
export const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    workEmail: '',
    companyName: '',
    interest: 'School Adoption',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  /* ── validation ── */
  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!formData.fullName.trim()) e.fullName = 'Full name is required';
    if (!formData.workEmail.trim()) e.workEmail = 'Work email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.workEmail)) e.workEmail = 'Enter a valid email';
    if (!formData.companyName.trim()) e.companyName = 'Company name is required';
    if (!formData.message.trim()) e.message = 'Message is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── submit ── */
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setIsSubmitted(true);
        setFormData({ fullName: '', workEmail: '', companyName: '', interest: 'School Adoption', message: '' });
      } else {
        throw new Error(result.error || 'Failed to send');
      }
    } catch {
      setSubmitError('Failed to send message. Please try again or email braininkedu@gmail.com directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name as keyof FormData]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  /* ── Success screen ── */
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-stone-900">
        <MarketingHeader />
        <div className="flex-grow flex items-center justify-center pt-24 pb-16">
          <div className="text-center max-w-md px-6">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
            <h1 className="text-3xl font-semibold tracking-tight mb-3">Thank You!</h1>
            <p className="text-lg text-stone-500 mb-8">Your message has been sent. We'll get back to you shortly.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </div>
        </div>
        <MarketingFooter />
      </div>
    );
  }

  /* ── Main layout ── */
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-stone-900 relative overflow-x-hidden">
      <MarketingHeader />
      <div className="grain-overlay" />

      {/* Background decorations */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none z-0 animate-blob-drift" />
      <div className="fixed inset-0 dot-grid-bg opacity-20 pointer-events-none z-0" />

      <main className="relative z-10 flex-grow max-w-7xl mx-auto w-full px-6 pt-28 pb-16 lg:pt-36 lg:pb-24 grid lg:grid-cols-12 gap-12 lg:gap-24 items-start">
        {/* ─── Left column ─── */}
        <div className="lg:col-span-5 flex flex-col gap-12">
          {/* Hero text */}
          <header className="space-y-6">
            <div className="section-tag">
              <span>Contact Us</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-semibold tracking-tight text-stone-900 leading-[0.95]">
              Let's shape the{' '}
              <span className="text-blue-600">
                future
              </span>{' '}
              of learning.
            </h1>
            <p className="text-lg text-stone-500 font-light leading-relaxed max-w-md">
              Get in touch with our team. We'd love to hear from you and discuss how BrainInk can help transform your educational experience.
            </p>
          </header>

          {/* Email card */}
          <div className="group relative bg-white border border-stone-200 p-6 rounded-2xl hover:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM203.43,64,128,133.15,52.57,64ZM216,192H40V74.19l82.59,75.71a8,8,0,0,0,10.82,0L216,74.19V192Z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-mono text-stone-400 uppercase tracking-widest mb-1">Electronic Mail</p>
                <a href="mailto:braininkedu@gmail.com" className="text-lg font-medium text-stone-900 hover:text-blue-600 transition-colors">
                  braininkedu@gmail.com
                </a>
              </div>
            </div>
          </div>



          {/* Feature chips */}
          <div className="space-y-6">
            <p className="font-mono text-xs uppercase tracking-widest text-stone-400">The BrainInk Standard</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FeatureChip
                icon={<ListChecks className="w-[18px] h-[18px] text-blue-600" />}
                iconBg="bg-blue-50"
                title="Instant Grading"
                description="AI-powered assessment that saves hours of manual review."
                badge={<div className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">A+</div>}
              />
              <FeatureChip
                icon={<BarChart3 className="w-[18px] h-[18px] text-blue-600" />}
                iconBg="bg-blue-50"
                title="Real-time Data"
                description="Live analytics to track student progress and gaps."
                badge={
                  <div className="flex items-end gap-0.5 h-4">
                    <div className="w-1 h-2 bg-stone-200" />
                    <div className="w-1 h-3 bg-stone-300" />
                    <div className="w-1 h-4 bg-blue-500" />
                  </div>
                }
              />
              <FeatureChip
                icon={<Globe className="w-[18px] h-[18px] text-blue-600" />}
                iconBg="bg-blue-50"
                title="Region Specific"
                description="Built specifically for the unique needs of African classrooms."
              />
              <FeatureChip
                icon={<Zap className="w-[18px] h-[18px] text-teal-600" />}
                iconBg="bg-teal-50"
                title="Quick Setup"
                description="Ready in minutes. Zero complex infrastructure required."
              />
            </div>
          </div>
        </div>

        {/* ─── Right column – form ─── */}
        <div className="lg:col-span-7 lg:pl-12">
          <div className="relative bg-white rounded-3xl p-8 lg:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-stone-200/60 overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-blue-50 to-stone-50 rounded-full blur-2xl pointer-events-none" />

            <form className="relative space-y-10" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-stone-900">Request Access</h2>
                <p className="text-sm text-stone-500">Fill out the details below to initiate a dialogue.</p>
              </div>

              {/* Full Name */}
              <div className="relative">
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`block w-full px-0 py-3 text-lg bg-transparent border-0 border-b ${
                    errors.fullName ? 'border-red-300' : 'border-stone-200'
                  } appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer transition-colors`}
                  placeholder=" "
                  required
                />
                <label
                  htmlFor="fullName"
                  className="absolute top-4 left-0 z-10 origin-[0] -translate-y-6 scale-[0.85] transform text-xs font-mono font-bold uppercase tracking-widest text-stone-400 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-[0.85] peer-focus:text-blue-600 cursor-text"
                >
                  Full Name <span className="text-red-400">*</span>
                </label>
                {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
              </div>

              {/* Email + Company */}
              <div className="grid md:grid-cols-2 gap-10">
                <div className="relative">
                  <input
                    type="email"
                    id="workEmail"
                    name="workEmail"
                    value={formData.workEmail}
                    onChange={handleChange}
                    className={`block w-full px-0 py-3 text-lg bg-transparent border-0 border-b ${
                      errors.workEmail ? 'border-red-300' : 'border-stone-200'
                    } appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer transition-colors`}
                    placeholder=" "
                    required
                  />
                  <label
                    htmlFor="workEmail"
                    className="absolute top-4 left-0 z-10 origin-[0] -translate-y-6 scale-[0.85] transform text-xs font-mono font-bold uppercase tracking-widest text-stone-400 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-[0.85] peer-focus:text-blue-600 cursor-text"
                  >
                    Work Email <span className="text-red-400">*</span>
                  </label>
                  {errors.workEmail && <p className="mt-1 text-xs text-red-600">{errors.workEmail}</p>}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className={`block w-full px-0 py-3 text-lg bg-transparent border-0 border-b ${
                      errors.companyName ? 'border-red-300' : 'border-zinc-200'
                    } appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer transition-colors`}
                    placeholder=" "
                    required
                  />
                  <label
                    htmlFor="companyName"
                    className="absolute top-4 left-0 z-10 origin-[0] -translate-y-6 scale-[0.85] transform text-xs font-mono font-bold uppercase tracking-widest text-stone-400 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-[0.85] peer-focus:text-blue-600 cursor-text"
                  >
                    Company Name <span className="text-red-400">*</span>
                  </label>
                  {errors.companyName && <p className="mt-1 text-xs text-red-600">{errors.companyName}</p>}
                </div>
              </div>

              {/* Interest pills */}
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-stone-400">Primary Interest</span>
                <div className="flex flex-wrap gap-3">
                  {['School Adoption', 'Partnership', 'Investment'].map((opt) => (
                    <InterestPill
                      key={opt}
                      value={opt}
                      label={opt}
                      selected={formData.interest === opt}
                      onChange={(v) => setFormData((p) => ({ ...p, interest: v }))}
                    />
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="relative">
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className={`block w-full px-0 py-3 text-lg bg-transparent border-0 border-b ${
                    errors.message ? 'border-red-300' : 'border-stone-200'
                  } appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer transition-colors resize-none`}
                  placeholder=" "
                  required
                />
                <label
                  htmlFor="message"
                  className="absolute top-4 left-0 z-10 origin-[0] -translate-y-6 scale-[0.85] transform text-xs font-mono font-bold uppercase tracking-widest text-stone-400 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-[0.85] peer-focus:text-blue-600 cursor-text"
                >
                  What would you like to see? <span className="text-red-400">*</span>
                </label>
                {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
              </div>

              {/* Error */}
              {submitError && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}

              {/* Submit */}
              <div className="pt-4 flex items-center justify-between">
                <div className="hidden sm:block text-xs text-stone-400 max-w-[200px]">
                  By clicking send you agree to process your data per our privacy policy.
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <span
                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
                    style={{ animation: 'shimmer-slide 1.5s infinite' }}
                  />
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">Send Message</span>
                      <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Status bar */}
          <div className="mt-8 flex justify-between items-center px-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono text-stone-400">SYSTEM OPERATIONAL</span>
            </div>
            <div className="text-xs font-mono text-stone-400">ID: BK-2026-V9</div>
          </div>
        </div>
      </main>

      {/* Bottom accent line */}
      <div className="fixed bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400/40 to-transparent z-50" />

      <MarketingFooter />
    </div>
  );
};

export default ContactUs;
