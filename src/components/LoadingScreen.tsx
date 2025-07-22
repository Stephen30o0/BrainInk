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

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <div className="animate-pulse-slow mb-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 p-1">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
            <img 
              src="/Screenshot_2025-05-05_141452-removebg-preview.png" 
              alt="Brain Ink Logo" 
              className="w-28 h-28 object-contain" 
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent font-pixel text-xl mb-8 animate-glitch">
        LOADING BRAININK...
      </div>

      <div className="w-64 bg-gray-200 h-4 rounded-sm overflow-hidden border-2 border-gray-300">
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 to-purple-600" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="mt-4 text-gray-600 font-pixel text-xs">
        {Math.floor(progress)}% - Initializing Brain Ink
      </div>
    </div>
  );
};