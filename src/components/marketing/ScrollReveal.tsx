'use client';
import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * ScrollReveal — wraps children in a fade+slide-up that fires when visible.
 * Uses framer-motion spring physics (taste skill §4 / §9B).
 */
interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Delay in seconds before animation begins */
  delay?: number;
  /** Direction to animate from */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Distance in px */
  distance?: number;
  /** Trigger once vs every time */
  once?: boolean;
}

const directionMap = {
  up: { y: 1, x: 0 },
  down: { y: -1, x: 0 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
};

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  distance = 40,
  once = true,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: '-60px' });
  const d = directionMap[direction];

  return (
    <motion.div
      ref={ref}
      className={`${className} will-change-[transform,opacity]`}
      initial={{ opacity: 0, x: d.x * distance, y: d.y * distance }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : undefined}
      transition={{
        type: 'spring',
        stiffness: 80,
        damping: 20,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerContainer — staggers child ScrollReveal components.
 */
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className = '',
  staggerDelay = 0.08,
  once = true,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{
        visible: { transition: { staggerChildren: staggerDelay } },
        hidden: {},
      }}
    >
      {children}
    </motion.div>
  );
};

/** Child variant for use inside StaggerContainer */
export const staggerItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 20 },
  },
};

export default ScrollReveal;
