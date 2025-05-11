import React, { ButtonHTMLAttributes } from 'react';
import { useAudio } from './AudioManager';

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  primary?: boolean;
  small?: boolean;
  href?: string;
}

export const PixelButton = ({
  children,
  primary = false,
  small = false,
  className = '',
  href,
  onClick,
  ...props
}: PixelButtonProps) => {
  const {
    playClick,
    playHover
  } = useAudio();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playClick();
    if (href) {
      const element = document.getElementById(href.replace('#', ''));
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }
    onClick?.(e);
  };

  return <button className={`
        ${small ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'}
        font-pixel rounded-md transition-all duration-200
        ${primary ? 'bg-primary text-dark hover:bg-primary/80' : 'bg-dark border border-primary/50 text-primary hover:bg-primary/20'}
        hover:transform hover:translate-y-[-2px]
        active:transform active:translate-y-[1px]
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-dark
        ${className}
      `} onClick={handleClick} onMouseEnter={() => playHover()} {...props}>
      <div className="flex items-center justify-center">{children}</div>
    </button>;
};