import { useState, useEffect, useCallback } from 'react';
interface UseTimerProps {
  initialTime: number; // in seconds
  onTimeUp?: () => void;
  autoStart?: boolean;
}
export const useTimer = ({
  initialTime,
  onTimeUp,
  autoStart = false
}: UseTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);
  const start = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
  }, []);
  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);
  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);
  const reset = useCallback(() => {
    setTimeLeft(initialTime);
    setIsActive(false);
    setIsPaused(false);
  }, [initialTime]);
  useEffect(() => {
    if (timeLeft !== initialTime) {
      setTimeLeft(initialTime);
    }
  }, [initialTime]);
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            if (interval) clearInterval(interval);
            setIsActive(false);
            if (onTimeUp) onTimeUp();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, onTimeUp]);
  return {
    timeLeft,
    setTimeLeft,
    formattedTime: formatTime(timeLeft),
    isActive,
    isPaused,
    start,
    pause,
    resume,
    reset,
    percentageLeft: timeLeft / initialTime * 100
  };
};