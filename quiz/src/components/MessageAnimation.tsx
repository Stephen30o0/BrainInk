import React, { useEffect, useState } from 'react';
interface MessageAnimationProps {
  children: React.ReactNode;
  isVisible: boolean;
}
const MessageAnimation: React.FC<MessageAnimationProps> = ({
  children,
  isVisible
}) => {
  const [animationClass, setAnimationClass] = useState('opacity-0 translate-y-4');
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setAnimationClass('opacity-100 translate-y-0');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);
  return <div className={`transition-all duration-300 ease-out ${animationClass}`}>
      {children}
    </div>;
};
export default MessageAnimation;