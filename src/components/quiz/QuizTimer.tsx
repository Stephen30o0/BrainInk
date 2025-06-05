import React, { useState, useEffect } from 'react';

interface QuizTimerProps {
  initialTime: number; // in seconds
  onTimeUp?: () => void;
}

export const QuizTimer: React.FC<QuizTimerProps> = ({ initialTime, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className="bg-gray-700 p-4 rounded-lg shadow-md text-center">
      <h2 className="text-xl font-semibold text-blue-300 mb-1">Time Left</h2>
      <p className={`text-3xl font-bold ${timeLeft < 60 ? 'text-red-400' : 'text-green-400'}`}>
        {formatTime(timeLeft)}
      </p>
    </div>
  );
};
