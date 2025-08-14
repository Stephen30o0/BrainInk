"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs?: Tab[];
  defaultTab?: string;
  className?: string;
}

const defaultTabs: Tab[] = [
  {
    id: "test",
    label: "1. TEST",
    content: (
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 w-full h-full items-start">
        <div className="flex-shrink-0">
          <img
            src="/gradingImages/test.jpg"
            alt="Handwritten math equations on grid paper"
            className="rounded-lg w-full max-h-60 sm:max-h-72 md:max-h-80 object-contain mt-0 !m-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
          />
        </div>

        <div className="flex-1 flex flex-col gap-y-2 sm:gap-y-3 md:gap-y-4 justify-center lg:pl-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 text-gray-800 leading-tight">
            1. TEST
          </h2>
          <div className="space-y-2 sm:space-y-3">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              <span className="font-semibold text-gray-800">Capture your work effortlessly.</span> Whether it's handwritten notes on paper or digital assignments, our system handles both seamlessly.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Simply take a photo with your phone camera or scan documents using any copier. Our advanced OCR technology recognizes mathematical equations, text, and diagrams with remarkable accuracy.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Support for multiple formats including handwritten work, typed documents, and mixed media assignments ensures nothing gets left behind.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "upload",
    label: "2. UPLOAD",
    content: (
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 w-full h-full items-start">
        <div className="flex-shrink-0">
          <img
            src="/gradingImages/upload.png"
            alt="Upload interface with drag and drop functionality"
            className="rounded-lg w-full max-h-60 sm:max-h-72 md:max-h-80 object-contain mt-0 !m-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
          />
        </div>
        <div className="flex-1 flex flex-col gap-y-2 sm:gap-y-3 md:gap-y-4 justify-center lg:pl-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 text-gray-800 leading-tight">
            2. UPLOAD
          </h2>
          <div className="space-y-2 sm:space-y-3">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              <span className="font-semibold text-gray-800">Intelligent grading at your fingertips.</span> Our drag-and-drop interface makes uploading assignments as simple as dropping files into a folder.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Batch upload multiple assignments simultaneously and apply custom rubrics tailored to your specific requirements. Support for images, PDFs, and various document formats.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Smart organization automatically categorizes submissions by student, assignment type, and subject matter for streamlined workflow management.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "results",
    label: "3. RESULTS",
    content: (
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 w-full h-full items-start">
        <div className="flex-shrink-0">
          <img
            src="/gradingImages/results.png"
            alt="Analytics dashboard showing grading results and feedback"
            className="rounded-lg w-full max-h-60 sm:max-h-72 md:max-h-80 object-contain mt-0 !m-0  shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
          />
        </div>
        <div className="flex-1 flex flex-col gap-y-2 sm:gap-y-3 md:gap-y-4 justify-center lg:pl-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 text-gray-800 leading-tight">
            3. RESULTS
          </h2>
          <div className="space-y-2 sm:space-y-3">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              <span className="font-semibold text-gray-800">Comprehensive insights that drive improvement.</span> Get detailed breakdowns of student performance with actionable feedback and growth recommendations.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Instant feedback generation highlights strengths, identifies knowledge gaps, and suggests personalized next steps for each student's learning journey.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Class-wide and school-wide analytics provide administrators with real-time performance data to make informed educational decisions and track progress over time.
            </p>
          </div>
        </div>
      </div>
    ),
  },
];

const AnimatedTabs = ({
  tabs = defaultTabs,
  defaultTab,
  className,
}: AnimatedTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id);

  if (!tabs?.length) return null;

  return (
    <div className={cn("w-full max-w-6xl flex flex-col gap-y-1 sm:gap-y-2", className)}>
      <div className="flex gap-1 sm:gap-2 flex-wrap bg-gray-200/30 backdrop-blur-md p-1 sm:p-1.5 rounded-xl border border-gray-300/40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg text-gray-800 outline-none transition-colors"
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-gray-300/40 backdrop-blur-lg shadow-[0_0_20px_rgba(0,0,0,0.1)] !rounded-lg border border-gray-400/50"
                transition={{ type: "spring", duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="p-3 sm:p-4 md:p-6 bg-gray-200/30 shadow-[0_0_20px_rgba(0,0,0,0.1)] text-gray-800 backdrop-blur-md rounded-xl border border-gray-300/40 min-h-fit h-auto">
        {tabs.map(
          (tab) =>
            activeTab === tab.id && (
              <motion.div
                key={tab.id}
                initial={{
                  opacity: 0,
                  scale: 0.95,
                  x: -10,
                  filter: "blur(10px)",
                }}
                animate={{ opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, x: -10, filter: "blur(10px)" }}
                transition={{
                  duration: 0.5,
                  ease: "circInOut",
                  type: "spring",
                }}
              >
                {tab.content}
              </motion.div>
            )
        )}
      </div>
    </div>
  );
};

export { AnimatedTabs };
