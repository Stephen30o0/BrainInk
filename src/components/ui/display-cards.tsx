"use client";

import React, { useState } from 'react';
import { Sparkles } from "lucide-react";

// Simple cn utility function inline since we may not have clsx/tailwind-merge yet
function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
  explanation?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function DisplayCard({
  className,
  icon = <Sparkles className="size-4 text-blue-300" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  iconClassName = "text-blue-500",
  titleClassName = "text-blue-500",
  onMouseEnter,
  onMouseLeave,
}: DisplayCardProps) {
  return (
    <div
      className={cn(
        "relative flex h-36 w-[22rem] -skew-y-[8deg] select-none flex-col justify-between rounded-xl border-2 bg-slate-100/70 backdrop-blur-sm px-4 py-3 transition-all duration-700 after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-gradient-to-l after:from-white after:to-transparent after:content-[''] hover:border-white/20 hover:bg-slate-100 [&>*]:flex [&>*]:items-center [&>*]:gap-2",
        className
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div>
        <span className="relative inline-block rounded-full bg-blue-800 p-1">
          {icon}
        </span>
        <p className={cn("text-lg font-medium", titleClassName)}>{title}</p>
      </div>
      <p className="whitespace-nowrap text-lg">{description}</p>
      <p className="text-slate-500">{date}</p>
    </div>
  );
}

// Separate Explanation Component
interface ExplanationPanelProps {
  activeCard: DisplayCardProps;
  isVisible: boolean;
}

function ExplanationPanel({ activeCard, isVisible }: ExplanationPanelProps) {
  return (
    <div 
      className={cn(
        "relative bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 min-h-[300px] flex items-center",
        "transition-all duration-500 ease-out transform",
        "before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none",
        "after:absolute after:inset-0 after:rounded-3xl after:bg-gradient-to-t after:from-slate-900/5 after:to-transparent after:pointer-events-none",
        isVisible 
          ? "opacity-100 translate-x-0 scale-100" 
          : "opacity-70 translate-x-4 scale-95"
      )}
    >
      <div className="relative z-10 space-y-6 w-full">
        <div 
          className={cn(
            "flex items-center space-x-4 transition-all duration-300 delay-100",
            isVisible ? "opacity-100 translate-y-0" : "opacity-60 translate-y-2"
          )}
        >
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20 flex-shrink-0 shadow-lg">
            {activeCard.icon}
          </div>
          <h3 className="text-2xl font-bold text-slate-800 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text">
            {activeCard.title}
          </h3>
        </div>
        <p 
          className={cn(
            "text-lg text-slate-700 leading-relaxed font-medium transition-all duration-400 delay-200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-70 translate-y-1"
          )}
        >
          {activeCard.explanation || "Experience the power of AI-driven education technology."}
        </p>
        <div 
          className={cn(
            "flex items-center space-x-3 text-sm text-slate-600 transition-all duration-300 delay-300",
            isVisible ? "opacity-100 translate-y-0" : "opacity-50 translate-y-1"
          )}
        >
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm"></div>
          <span className="font-medium">{activeCard.date}</span>
        </div>
      </div>
    </div>
  );
}

interface DisplayCardsProps {
  cards?: (DisplayCardProps & { explanation?: string })[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const defaultCards = [
    {
      icon: <Sparkles className="size-4 text-blue-300" />,
      title: "Smart Grading",
      description: "AI-powered instant feedback",
      date: "Available now",
      titleClassName: "text-blue-600",
      explanation: "Our advanced AI system instantly analyzes handwritten and digital assignments, providing detailed feedback that helps students understand their mistakes and learn from them. Teachers save hours while students get immediate, actionable insights to improve their performance.",
      className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-slate-200 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      icon: <Sparkles className="size-4 text-green-300" />,
      title: "Progress Tracking",
      description: "Real-time student analytics",
      date: "Live updates",
      titleClassName: "text-green-600",
      explanation: "Monitor student progress with comprehensive analytics dashboards. Track improvement over time, identify learning gaps early, and get real-time insights that help teachers make data-driven decisions to support every student's academic journey.",
      className: "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-slate-200 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      icon: <Sparkles className="size-4 text-orange-300" />,
      title: "Quick Setup",
      description: "Ready in minutes, not hours",
      date: "Get started",
      titleClassName: "text-orange-600",
      explanation: "Get your entire classroom up and running in just minutes with our streamlined onboarding process. No complex installations or lengthy training sessions required - just upload your first assignment and start experiencing the future of education technology.",
      className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
    },
  ];

  const displayCards = cards || defaultCards;

  const handleMouseEnter = (index: number) => {
    setActiveCardIndex(index);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setActiveCardIndex(0);
    setIsHovering(false);
  };

  return (
    <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-6 gap-32">
      {/* Left side - Cards stack (Separate Entity) */}
      <div className="flex-shrink-0 w-fit max-w-md">
        <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700">
          {displayCards.map((cardProps, index) => (
            <DisplayCard 
              key={index} 
              {...cardProps}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            />
          ))}
        </div>
      </div>

      {/* Right side - Explanation Panel (Separate Entity) - Well separated */}
      <div className="flex-1 min-w-0 max-w-lg ml-auto" style={{ minHeight: '350px' }}>
        <div className="w-full flex items-center justify-center h-full">
          <ExplanationPanel 
            activeCard={displayCards[activeCardIndex]} 
            isVisible={isHovering}
          />
        </div>
      </div>
    </div>
  );
}
