"use client";
import * as React from "react";

/**
 * CapabilitiesStack
 * Separate scrollable stacked-cards section (no hero scroll indicator inside).
 */
export const CapabilitiesStack: React.FC<{ className?: string }> = ({ className = "" }) => {

  return (
    <section id="capabilities" className={`relative bg-stone-50 ${className}`}>
      <div className="container min-h-svh place-content-center px-6 text-stone-900 xl:px-12 py-4 md:py-0">
        <div className="grid md:grid-cols-2 md:gap-8 xl:gap-12">
          {/* Sticky left intro */}
          <div className="left-0 top-0 md:sticky md:h-svh md:py-12">
            <h5 className="text-xs uppercase tracking-wide text-slate-600">BrainInk capabilities</h5>
            <h2 className="mb-6 mt-4 text-4xl font-bold tracking-tight">
              What you can do with <span className="text-blue-500">BrainInk</span>
            </h2>
            <p className="max-w-prose text-sm text-slate-600 leading-relaxed">
              The platform brings speed, consistency, and insight to everyday assessment. Scroll to explore the core capabilities teachers, students, and school leaders rely on daily.
            </p>
          </div>
          {/* Scroll stack hidden per request */}
          <div className="hidden" aria-hidden />
        </div>
      </div>
    </section>
  );
};

export default CapabilitiesStack;
