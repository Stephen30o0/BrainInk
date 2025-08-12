import React from 'react';
import MarketingHeader from '../../components/marketing/MarketingHeader';
import MarketingFooter from '../../components/marketing/MarketingFooter';
import { PricingSection } from '@/components/ui/pricing-section';
import { Sparkles, Building2 } from 'lucide-react';

const pricingTiers = [
  {
    name: "Standard",
    price: {
      monthly: 15000,  // per term
      yearly: 45000,   // per year
    },
    description: "Perfect for schools looking to modernize their assessment process",
    icon: (
      <div className="relative">
        <Sparkles className="w-7 h-7 relative z-10" />
      </div>
    ),
    features: [
      {
        name: "Instant Grading",
        description: "AI-powered grading for handwritten and digital assignments",
        included: true,
      },
      {
        name: "Student Dashboards",
        description: "Individual progress tracking and personalized feedback",
        included: true,
      },
      {
        name: "Rubrics & Consistency",
        description: "Standardized marking criteria across all classes",
        included: true,
      },
      {
        name: "School Analytics",
        description: "Real-time insights and performance reports",
        included: true,
      },
      {
        name: "Email Support",
        description: "Professional support with 24h response time",
        included: true,
      },
    ],
  },
  {
    name: "Enterprise",
    price: {
      monthly: "Custom",  // Custom pricing
      yearly: "Custom",   // Custom pricing
    },
    description: "Tailored solutions for large institutions and districts",
    highlight: true,
    badge: "Most Popular",
    icon: (
      <div className="relative">
        <Building2 className="w-7 h-7 relative z-10" />
      </div>
    ),
    features: [
      {
        name: "Everything in Standard",
        description: "All features from the Standard plan included",
        included: true,
      },
      {
        name: "Security & SSO",
        description: "Enterprise-grade security and single sign-on",
        included: true,
      },
      {
        name: "Admin Controls",
        description: "Advanced user management and permissions",
        included: true,
      },
      {
        name: "Custom Integrations",
        description: "API access and custom integration support",
        included: true,
      },
      {
        name: "Dedicated Support",
        description: "24/7 priority support with dedicated account manager",
        included: true,
      },
      {
        name: "Training & Onboarding",
        description: "Complete training program for teachers and staff",
        included: true,
      },
    ],
  },
];

export const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />
      
      {/* Hero Section */}
      <section className="pt-28 pb-12 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-black tracking-tight">Simple pricing for schools.</h1>
          <p className="mt-6 text-xl text-slate-600 max-w-3xl mx-auto">
            Save teachers time, give students clarity, and give leaders real‑time insight. 
            Built in Rwanda for African classrooms.
          </p>
        </div>
      </section>

      {/* Custom Pricing Section */}
      <div className="relative">
        <PricingSection tiers={pricingTiers} />
      </div>

      {/* Additional Info */}
      <section className="py-12 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            <div className="p-6 border border-slate-200 rounded-xl bg-white">
              <h4 className="font-semibold text-slate-900 mb-2">Instant Grading</h4>
              <p className="text-sm text-slate-600">AI-powered grading with rubrics for consistent, fair assessment</p>
            </div>
            <div className="p-6 border border-slate-200 rounded-xl bg-white">
              <h4 className="font-semibold text-slate-900 mb-2">Student Growth</h4>
              <p className="text-sm text-slate-600">Individual dashboards track progress and provide actionable feedback</p>
            </div>
            <div className="p-6 border border-slate-200 rounded-xl bg-white">
              <h4 className="font-semibold text-slate-900 mb-2">School Analytics</h4>
              <p className="text-sm text-slate-600">Real-time insights across classes, subjects, and terms</p>
            </div>
          </div>
          
          <div className="rounded-xl border border-slate-200 p-8 bg-white">
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Pilot Program Available</h3>
            <p className="text-slate-600 leading-relaxed">
              Run a pilot with selected teachers before full implementation. During the trial period, 
              schools contribute 30% of the standard fee. Complete onboarding, training, and support included 
              to ensure successful adoption across your institution.
            </p>
            <div className="mt-4 flex gap-4">
              <button className="px-6 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors">
                Start Pilot Program
              </button>
              <button className="px-6 py-2 border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default PricingPage;
