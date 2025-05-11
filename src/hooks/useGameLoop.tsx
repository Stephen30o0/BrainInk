import React, { useEffect, useRef } from 'react';
export const useGameLoop = (canvasRef: React.RefObject<HTMLCanvasElement>, draw: (ctx: CanvasRenderingContext2D, deltaTime: number) => void) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        draw(ctx, deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [draw]);
};