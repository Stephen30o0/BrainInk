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
        "relative flex h-24 sm:h-32 md:h-40 lg:h-48 xl:h-56 w-[16rem] sm:w-[20rem] md:w-[24rem] lg:w-[28rem] xl:w-[32rem] -skew-y-[8deg] select-none flex-col justify-between rounded-xl border-2 bg-slate-100/70 backdrop-blur-sm px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 transition-all duration-700 after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[14rem] sm:after:w-[18rem] md:after:w-[22rem] lg:after:w-[26rem] xl:after:w-[30rem] after:bg-gradient-to-l after:from-white after:to-transparent after:content-[''] hover:border-white/20 hover:bg-slate-100 [&>*]:flex [&>*]:items-center [&>*]:gap-1 sm:[&>*]:gap-2",
        className
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div>
        <span className="relative inline-block rounded-full bg-blue-800 p-1 sm:p-1.5 md:p-2">
          {React.isValidElement(icon)
            ? React.cloneElement(icon, {
              className: cn(icon.props.className, iconClassName, "size-5 sm:size-6 md:size-7 lg:size-8")
            })
            : icon
          }
        </span>
        <p className={cn("text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium", titleClassName)}>{title}</p>
      </div>
      <p className="whitespace-nowrap text-sm sm:text-base md:text-lg lg:text-xl">{description}</p>
      <p className="text-slate-500 text-sm sm:text-sm md:text-base lg:text-lg">{date}</p>
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
        "relative bg-white/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/30 shadow-2xl p-4 sm:p-6 lg:p-8 min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] flex items-center",
        "transition-all duration-500 ease-out transform",
        "before:absolute before:inset-0 before:rounded-2xl sm:before:rounded-3xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none",
        "after:absolute after:inset-0 after:rounded-2xl sm:after:rounded-3xl after:bg-gradient-to-t after:from-slate-900/5 after:to-transparent after:pointer-events-none",
        isVisible
          ? "opacity-100 translate-x-0 scale-100"
          : "opacity-70 translate-x-4 scale-95"
      )}
    >
      <div className="relative z-10 space-y-3 sm:space-y-4 lg:space-y-6 w-full">
        <div
          className={cn(
            "flex items-center space-x-2 sm:space-x-3 lg:space-x-4 transition-all duration-300 delay-100",
            isVisible ? "opacity-100 translate-y-0" : "opacity-60 translate-y-2"
          )}
        >
          <div className="p-1.5 sm:p-2 lg:p-3 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm border border-white/20 flex-shrink-0 shadow-lg">
            {activeCard.icon}
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text">
            {activeCard.title}
          </h3>
        </div>
        <p
          className={cn(
            "text-sm sm:text-base lg:text-lg text-slate-700 leading-relaxed font-medium transition-all duration-400 delay-200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-70 translate-y-1"
          )}
        >
          {activeCard.explanation || "Experience the power of AI-driven education technology."}
        </p>
        <div
          className={cn(
            "flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm text-slate-600 transition-all duration-300 delay-300",
            isVisible ? "opacity-100 translate-y-0" : "opacity-50 translate-y-1"
          )}
        >
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm"></div>
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
      icon: <Sparkles className="text-blue-300" />,
      title: "Smart Grading",
      description: "AI-powered instant feedback",
      date: "Available now",
      titleClassName: "text-blue-600",
      explanation: "Our advanced AI system instantly analyzes handwritten and digital assignments, providing detailed feedback that helps students understand their mistakes and learn from them. Teachers save hours while students get immediate, actionable insights to improve their performance.",
      className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-slate-200 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      icon: <Sparkles className="text-green-300" />,
      title: "Progress Tracking",
      description: "Real-time student analytics",
      date: "Live updates",
      titleClassName: "text-green-600",
      explanation: "Monitor student progress with comprehensive analytics dashboards. Track improvement over time, identify learning gaps early, and get real-time insights that help teachers make data-driven decisions to support every student's academic journey.",
      className: "[grid-area:stack] translate-x-10 sm:translate-x-16 lg:translate-x-20 translate-y-8 sm:translate-y-12 lg:translate-y-16 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-slate-200 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      icon: <Sparkles className="text-orange-300" />,
      title: "Quick Setup",
      description: "Ready in minutes, not hours",
      date: "Get started",
      titleClassName: "text-orange-600",
      explanation: "Get your entire classroom up and running in just minutes with our streamlined onboarding process. No complex installations or lengthy training sessions required - just upload your first assignment and start experiencing the future of education technology.",
      className: "[grid-area:stack] translate-x-20 sm:translate-x-28 lg:translate-x-32 translate-y-16 sm:translate-y-24 lg:translate-y-32 hover:translate-y-10",
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
    <div className="flex flex-col lg:flex-row items-center justify-between w-full max-w-7xl mx-auto px-4 sm:px-6 gap-16 sm:gap-20 lg:gap-24 xl:gap-32">
      {/* Left side - Cards stack (Separate Entity) */}
      <div className="flex-shrink-0 w-fit max-w-md mx-auto lg:mx-0">
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
      <div className="flex-1 min-w-0 max-w-lg lg:ml-auto w-full" style={{ minHeight: '300px' }}>
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
