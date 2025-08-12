import React from 'react';
import MarketingHeader from '../../components/marketing/MarketingHeader';
import MarketingFooter from '../../components/marketing/MarketingFooter';

const Article: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <article className="rounded-2xl border border-slate-200 p-6 bg-white shadow-sm">
    <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
    <div className="prose prose-slate max-w-none text-sm">{children}</div>
  </article>
);

export const HelpCenterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />

      <section className="pt-28 pb-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-black tracking-tight">Help Center</h1>
          <p className="mt-3 text-slate-600 max-w-2xl">Answers to common questions about BrainInk grading, dashboards, privacy, and school rollout. Can’t find what you need? Contact support.</p>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Article title="Getting started (teachers)">
              <p>Create a school account, add your classes, and upload a sample rubric. You can scan handwritten papers or upload PDFs/images for grading.</p>
            </Article>
            <Article title="Pricing & pilots">
              <p>Standard plan is 15,000 RWF per student per trimester. Schools can run a pilot where the school contributes 30% of the fee for selected teachers. Training and onboarding included.</p>
            </Article>
            <Article title="Privacy & security">
              <p>We minimize what we store and encrypt data in transit and at rest. Admins control access, exports, and integrations. Records can be exported for your SIS.</p>
            </Article>
            <Article title="Dashboards & reports">
              <p>Teachers and leaders see performance by class, subject, and term. Export summaries for staff meetings, parent updates, and records.</p>
            </Article>
            <Article title="Scanning & rubrics">
              <p>Use a copier or phone to batch scan stacks of papers. Apply your rubric templates for consistent marking across departments.</p>
            </Article>
            <Article title="Contact us">
              <p>Email support@brainink.ai to book a demo or request onboarding for your school.</p>
            </Article>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default HelpCenterPage;
