'use client';
import React from 'react';
import { motion } from 'framer-motion';

/**
 * Marquee — infinite horizontal scroll band (taste skill §8: Kinetic Marquee).
 * Content is duplicated to create seamless loop.
 */
interface MarqueeProps {
  children: React.ReactNode;
  /** Speed in seconds for one full cycle */
  speed?: number;
  /** Pause on hover */
  pauseOnHover?: boolean;
  className?: string;
  /** Reverse direction */
  reverse?: boolean;
}

export const Marquee: React.FC<MarqueeProps> = ({
  children,
  speed = 30,
  pauseOnHover = true,
  className = '',
  reverse = false,
}) => {
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)' }}
    >
      <motion.div
        className="flex w-max gap-12"
        animate={{ x: reverse ? ['0%', '50%'] : ['0%', '-50%'] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: speed,
            ease: 'linear',
          },
        }}
        {...(pauseOnHover ? { whileHover: { animationPlayState: 'paused' } } : {})}
        style={pauseOnHover ? { cursor: 'default' } : undefined}
      >
        {children}
        {/* Duplicate for seamless loop */}
        {children}
      </motion.div>
    </div>
  );
};

export default Marquee;
