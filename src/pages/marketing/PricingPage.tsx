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
      <section className="pt-20 sm:pt-24 lg:pt-28 pb-8 sm:pb-12 lg:pb-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-8xl px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-tight mb-4 sm:mb-6 lg:mb-8">
            Simple pricing for schools.
          </h1>
          <p className="mt-4 sm:mt-6 lg:mt-8 text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 max-w-4xl lg:max-w-5xl mx-auto leading-relaxed px-4">
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
      <section className="py-8 sm:py-12 lg:py-16 bg-slate-50">
        <div className="mx-auto max-w-8xl px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-12">
            <div className="p-4 sm:p-6 lg:p-8 border border-slate-200 rounded-xl bg-white hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-slate-900 mb-2 sm:mb-3 text-base sm:text-lg lg:text-xl">Instant Grading</h4>
              <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed">AI-powered grading with rubrics for consistent, fair assessment</p>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 border border-slate-200 rounded-xl bg-white hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-slate-900 mb-2 sm:mb-3 text-base sm:text-lg lg:text-xl">Student Growth</h4>
              <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed">Individual dashboards track progress and provide actionable feedback</p>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 border border-slate-200 rounded-xl bg-white hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
              <h4 className="font-semibold text-slate-900 mb-2 sm:mb-3 text-base sm:text-lg lg:text-xl">School Analytics</h4>
              <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed">Real-time insights across classes, subjects, and terms</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 sm:p-6 lg:p-8 xl:p-10 bg-white hover:shadow-lg transition-shadow">
            <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold text-slate-900 mb-2 sm:mb-3 lg:mb-4">Pilot Program Available</h3>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 lg:mb-8">
              Run a pilot with selected teachers before full implementation. During the trial period,
              schools contribute 30% of the standard fee. Complete onboarding, training, and support included
              to ensure successful adoption across your institution.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6">
              <button className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 bg-slate-900 text-white rounded-md text-sm sm:text-base lg:text-lg font-medium hover:bg-slate-800 transition-colors hover:scale-105 transform">
                Start Pilot Program
              </button>
              <button className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 border border-slate-300 text-slate-700 rounded-md text-sm sm:text-base lg:text-lg font-medium hover:bg-slate-50 transition-colors hover:scale-105 transform">
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
