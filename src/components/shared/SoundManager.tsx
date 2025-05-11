import React, { useEffect, useRef, createContext, useContext } from 'react';
type SoundEffect = 'footstep' | 'door' | 'rain' | 'ambient' | 'dialogue' | 'quest';
interface SoundContextType {
  playSound: (effect: SoundEffect) => void;
  setVolume: (volume: number) => void;
}
const SoundContext = createContext<SoundContextType | null>(null);
export const useSoundEffect = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSoundEffect must be used within a SoundProvider');
  }
  return context;
};
export const SoundProvider = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const audioRefs = useRef<Record<SoundEffect, HTMLAudioElement>>({
    footstep: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-quick-jump-arcade-game-239.mp3'),
    door: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-ancient-clock-opening-1385.mp3'),
    rain: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-1251.mp3'),
    ambient: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-wandering-around-in-a-cave-439.mp3'),
    dialogue: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-fairy-bells-583.mp3'),
    quest: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-magical-shine-583.mp3')
  });
  useEffect(() => {
    // Loop ambient and rain sounds
    audioRefs.current.ambient.loop = true;
    audioRefs.current.rain.loop = true;
    // Start ambient sound
    audioRefs.current.ambient.play();
    audioRefs.current.ambient.volume = 0.1;
    return () => {
      Object.values(audioRefs.current).forEach(audio => audio.pause());
    };
  }, []);
  const playSound = (effect: SoundEffect) => {
    const audio = audioRefs.current[effect];
    if (audio) {
      audio.currentTime = 0;
      audio.play();
    }
  };
  const setVolume = (volume: number) => {
    Object.values(audioRefs.current).forEach(audio => {
      audio.volume = volume;
    });
  };
  return <SoundContext.Provider value={{
    playSound,
    setVolume
  }}>
      {children}
    </SoundContext.Provider>;
};