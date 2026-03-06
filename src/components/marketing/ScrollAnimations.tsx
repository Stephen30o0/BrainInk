'use client';
import React, { useRef, useEffect, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useInView,
  MotionValue,
} from 'framer-motion';

/* ════════════════════════════════════════════════════════
   1. PARALLAX LAYER — elements move at different scroll speeds
   ════════════════════════════════════════════════════════ */
interface ParallaxProps {
  children: React.ReactNode;
  /** Negative = slower (recedes), Positive = faster (comes toward) */
  speed?: number;
  className?: string;
}

export const Parallax: React.FC<ParallaxProps> = ({ children, speed = 0.5, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [speed * -100, speed * 100]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div style={{ y: smoothY }}>{children}</motion.div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   2. SCROLL SCALE — element scales up/down based on scroll position
   ════════════════════════════════════════════════════════ */
interface ScrollScaleProps {
  children: React.ReactNode;
  className?: string;
  /** Scale range: [start, end] — e.g. [0.85, 1] means starts smaller, grows on scroll */
  scaleRange?: [number, number];
}

export const ScrollScale: React.FC<ScrollScaleProps> = ({
  children,
  className = '',
  scaleRange = [0.85, 1],
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], scaleRange);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30 });

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ scale: smoothScale, opacity }}>{children}</motion.div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   3. TEXT REVEAL — words/characters reveal on scroll with clip mask
   ════════════════════════════════════════════════════════ */
interface TextRevealProps {
  text?: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** 'word' reveals word by word, 'char' reveals character by character */
  mode?: 'word' | 'char';
}

export const TextReveal: React.FC<TextRevealProps> = ({ text, children, className = '', style, mode = 'word' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.9', 'start 0.25'],
  });

  const resolvedText = text ?? (typeof children === 'string' ? children : '');
  const units = mode === 'word' ? resolvedText.split(' ') : resolvedText.split('');
  const total = units.length;

  return (
    <div ref={ref} className={`relative ${className}`} style={style}>
      <span className="flex flex-wrap gap-x-[0.3em]">
        {units.map((unit, i) => {
          const start = i / total;
          const end = start + 1 / total;
          return <TextRevealUnit key={i} progress={scrollYProgress} range={[start, end]} unit={unit} />;
        })}
      </span>
    </div>
  );
};

const TextRevealUnit: React.FC<{
  progress: MotionValue<number>;
  range: [number, number];
  unit: string;
}> = ({ progress, range, unit }) => {
  const opacity = useTransform(progress, range, [0.15, 1]);
  const y = useTransform(progress, range, [8, 0]);
  return (
    <motion.span style={{ opacity, y }} className="inline-block will-change-transform">
      {unit}
    </motion.span>
  );
};

/* ════════════════════════════════════════════════════════
   4. SCROLL PROGRESS LINE — SVG path that draws on scroll
   ════════════════════════════════════════════════════════ */
interface ScrollProgressPathProps {
  className?: string;
  color?: string;
  strokeWidth?: number;
}

export const ScrollProgressPath: React.FC<ScrollProgressPathProps> = ({
  className = '',
  color = '#2563EB',
  strokeWidth = 2,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const pathLength = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <div ref={ref} className={`absolute inset-0 pointer-events-none ${className}`}>
      <svg viewBox="0 0 2 600" className="w-[2px] h-full mx-auto" preserveAspectRatio="none">
        {/* Track */}
        <line x1="1" y1="0" x2="1" y2="600" stroke={color} strokeWidth={strokeWidth} strokeOpacity={0.1} />
        {/* Progress */}
        <motion.line
          x1="1"
          y1="0"
          x2="1"
          y2="600"
          stroke={color}
          strokeWidth={strokeWidth}
          style={{ pathLength }}
        />
      </svg>
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   5. COUNT UP — numbers animate from 0 to target on scroll
   ════════════════════════════════════════════════════════ */
interface CountUpProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
  decimals?: number;
}

export const CountUp: React.FC<CountUpProps> = ({
  target,
  suffix = '',
  prefix = '',
  duration = 2000,
  className = '',
  decimals = 0,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let start = 0;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Eased progress (ease-out quad)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [inView, target, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
};

/* ════════════════════════════════════════════════════════
   6. HORIZONTAL SCROLL SECTION — vertical scroll → horizontal pan
   ════════════════════════════════════════════════════════ */
interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
  /** How many screens tall the sticky container should be to create the horizontal scroll effect */
  heightMultiplier?: number;
}

export const HorizontalScroll: React.FC<HorizontalScrollProps> = ({
  children,
  className = '',
  heightMultiplier = 3,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  const [trackWidth, setTrackWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (trackRef.current) setTrackWidth(trackRef.current.scrollWidth);
      setViewportWidth(window.innerWidth);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const x = useTransform(scrollYProgress, [0, 1], [0, -(trackWidth - viewportWidth)]);
  const smoothX = useSpring(x, { stiffness: 100, damping: 30 });

  return (
    <div ref={containerRef} style={{ height: `${heightMultiplier * 100}vh` }} className={className}>
      <div className="sticky top-0 h-screen overflow-hidden flex items-center">
        <motion.div ref={trackRef} className="flex gap-8 px-8 will-change-transform" style={{ x: smoothX }}>
          {children}
        </motion.div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   7. STICKY STACK — cards stack on top of each other as you scroll
   ════════════════════════════════════════════════════════ */
interface StickyStackProps {
  children: React.ReactNode[];
  className?: string;
}

export const StickyStack: React.FC<StickyStackProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {children.map((child, i) => (
        <div
          key={i}
          className="sticky top-24 mb-8"
          style={{
            zIndex: i + 1,
            paddingTop: `${i * 12}px`,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{
              type: 'spring',
              stiffness: 80,
              damping: 20,
              delay: 0.05,
            }}
          >
            {child}
          </motion.div>
        </div>
      ))}
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   8. CURTAIN REVEAL — section parts from center on scroll
   ════════════════════════════════════════════════════════ */
interface CurtainRevealProps {
  children: React.ReactNode;
  className?: string;
}

export const CurtainReveal: React.FC<CurtainRevealProps> = ({ children, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  const leftClip = useTransform(scrollYProgress, [0, 1], [50, 0]);
  const rightClip = useTransform(scrollYProgress, [0, 1], [50, 100]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        style={{
          clipPath: useMotionTemplate(leftClip, rightClip),
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

/** Helper: builds clip-path from two motion values */
function useMotionTemplate(left: MotionValue<number>, right: MotionValue<number>) {
  const clipPath = useMotionValue('inset(0 50% 0 50%)');

  useEffect(() => {
    const unsubL = left.on('change', (l) => {
      clipPath.set(`inset(0 ${100 - right.get()}% 0 ${l}%)`);
    });
    const unsubR = right.on('change', (r) => {
      clipPath.set(`inset(0 ${100 - r}% 0 ${left.get()}%)`);
    });
    return () => {
      unsubL();
      unsubR();
    };
  }, [left, right, clipPath]);

  return clipPath;
}

/* ════════════════════════════════════════════════════════
   9. ZOOM PARALLAX — background image zooms as you scroll
   ════════════════════════════════════════════════════════ */
interface ZoomParallaxProps {
  children: React.ReactNode;
  className?: string;
  /** Image URL for the zooming background */
  imageUrl?: string;
}

export const ZoomParallax: React.FC<ZoomParallaxProps> = ({ children, className = '', imageUrl }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.3]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.3, 1, 1, 0.3]);
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30 });

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {imageUrl && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ scale: smoothScale, opacity }}
        >
          <img src={imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        </motion.div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   10. STAGGER ON SCROLL — children animate in with stagger
   ════════════════════════════════════════════════════════ */
interface StaggerOnScrollProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const StaggerOnScroll: React.FC<StaggerOnScrollProps> = ({
  children,
  className = '',
  stagger = 0.1,
  direction = 'up',
}) => {
  const dirMap = { up: { y: 40 }, down: { y: -40 }, left: { x: 40 }, right: { x: -40 } };
  const initial = { opacity: 0, ...dirMap[direction] };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={{
        visible: { transition: { staggerChildren: stagger } },
        hidden: {},
      }}
    >
      {React.Children.map(children, (child) => (
        <motion.div
          variants={{
            hidden: initial,
            visible: {
              opacity: 1,
              x: 0,
              y: 0,
              transition: { type: 'spring', stiffness: 100, damping: 20 },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

/* ════════════════════════════════════════════════════════
   11. SCROLL ROTATE — element rotates as user scrolls
   ════════════════════════════════════════════════════════ */
interface ScrollRotateProps {
  children: React.ReactNode;
  className?: string;
  /** Degrees of rotation across the scroll range */
  degrees?: number;
}

export const ScrollRotate: React.FC<ScrollRotateProps> = ({
  children,
  className = '',
  degrees = 15,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const rotate = useTransform(scrollYProgress, [0, 1], [-degrees, degrees]);
  const smoothRotate = useSpring(rotate, { stiffness: 100, damping: 30 });

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ rotate: smoothRotate }}>{children}</motion.div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   12. SCROLL OPACITY — fade in/out based on scroll position
   ════════════════════════════════════════════════════════ */
interface ScrollFadeProps {
  children: React.ReactNode;
  className?: string;
  /** 'in' = fades in, 'out' = fades out, 'both' = fades in then out */
  mode?: 'in' | 'out' | 'both';
}

export const ScrollFade: React.FC<ScrollFadeProps> = ({
  children,
  className = '',
  mode = 'in',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const opacityMap = {
    in: { input: [0, 0.3], output: [0, 1] },
    out: { input: [0.7, 1], output: [1, 0] },
    both: { input: [0, 0.2, 0.8, 1], output: [0, 1, 1, 0] },
  };

  const { input, output } = opacityMap[mode];
  const opacity = useTransform(scrollYProgress, input, output);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ opacity }}>{children}</motion.div>
    </div>
  );
};
