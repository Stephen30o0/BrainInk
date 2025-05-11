import React, { useEffect, useState } from 'react';
import { TrophyIcon } from 'lucide-react';
interface AchievementPopupProps {
  title: string;
  description: string;
  reward: {
    xp: number;
    tokens: number;
  };
  onComplete: () => void;
}
export const AchievementPopup = ({
  title,
  description,
  reward,
  onComplete
}: AchievementPopupProps) => {
  const [show, setShow] = useState(false);
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    // Start show animation
    setShow(true);
    setTimeout(() => setAnimate(true), 100);
    // Hide after 5 seconds
    const timer = setTimeout(() => {
      setAnimate(false);
      setTimeout(() => {
        setShow(false);
        onComplete();
      }, 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  if (!show) return null;
  return <div className={`fixed top-4 right-4 bg-dark/95 border border-yellow-400/30 rounded-lg p-4 transform transition-all duration-300 ${animate ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-yellow-400/20 flex items-center justify-center">
          <TrophyIcon className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h3 className="font-pixel text-yellow-400 text-sm mb-1">
            Achievement Unlocked!
          </h3>
          <p className="text-white font-semibold mb-1">{title}</p>
          <p className="text-gray-400 text-sm mb-2">{description}</p>
          <div className="flex gap-4 text-xs">
            <span className="text-secondary">+{reward.xp} XP</span>
            <span className="text-yellow-400">+{reward.tokens} INK</span>
          </div>
        </div>
      </div>
    </div>;
};