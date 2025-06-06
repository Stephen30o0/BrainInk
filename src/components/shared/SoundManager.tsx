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
  const audioRefs = useRef<Record<SoundEffect, HTMLAudioElement>>({} as Record<SoundEffect, HTMLAudioElement>);
  useEffect(() => {
    // Sound effects have been disabled.
    // If you re-enable them, ensure proper initialization and cleanup.
    return () => {
      // Perform cleanup if any sounds were to be played.
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