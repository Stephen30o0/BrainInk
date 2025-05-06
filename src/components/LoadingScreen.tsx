import React, { useEffect, useState } from 'react';
export const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 15;
        return next > 100 ? 100 : next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);
  return <div className="fixed inset-0 bg-dark flex flex-col items-center justify-center z-50">
      <div className="animate-pulse-slow mb-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-tertiary p-1">
          <div className="w-full h-full rounded-full bg-dark flex items-center justify-center overflow-hidden">
            <img src="/Screenshot_2025-05-05_141452-removebg-preview.png" alt="Brain Ink Logo" className="w-28 h-28 object-contain" />
          </div>
        </div>
      </div>
      <div className="text-primary font-pixel text-xl mb-8 animate-glitch">
        LOADING INKVERSE...
      </div>
      <div className="w-64 bg-gray-800 h-4 rounded-sm overflow-hidden pixel-border">
        <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{
        width: `${progress}%`
      }}></div>
      </div>
      <div className="mt-4 text-gray-400 font-pixel text-xs">
        {Math.floor(progress)}% - Initializing K.A.N.A.
      </div>
    </div>;
};