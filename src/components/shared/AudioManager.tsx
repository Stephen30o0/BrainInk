import React, { useEffect, useState, createContext, useContext } from 'react';
interface AudioContextType {
  playClick: () => void;
  playHover: () => void;
  playSuccess: () => void;
}
const AudioContext = createContext<AudioContextType | null>(null);
export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
export const AudioProvider = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  useEffect(() => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioContext(context);
  }, []);
  const createSound = (frequency: number, type: OscillatorType, duration: number) => {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  };
  const playClick = () => createSound(200, 'square', 0.1);
  const playHover = () => createSound(400, 'sine', 0.05);
  const playSuccess = () => {
    if (!audioContext) return;
    [400, 600, 800].forEach((freq, i) => {
      setTimeout(() => createSound(freq, 'sine', 0.1), i * 100);
    });
  };
  return <AudioContext.Provider value={{
    playClick,
    playHover,
    playSuccess
  }}>
      {children}
    </AudioContext.Provider>;
};