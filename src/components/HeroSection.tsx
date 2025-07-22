import React, { useEffect, useState, useRef } from 'react';
import { Star, ArrowRight, Sparkles, BookOpen, Trophy, Brain, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PixelButtonProps {
  children: React.ReactNode;
  primary?: boolean;
  href?: string;
  onClick?: () => void;
}

const PixelButton: React.FC<PixelButtonProps> = ({ children, primary, href, onClick }) => {
  return <a href={href} onClick={onClick} className={`font-pixel px-6 py-3 inline-flex items-center justify-center transition-all duration-300 relative overflow-hidden ${primary ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700' : 'bg-dark border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-500/10'} transform hover:scale-105 active:scale-95`}>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100">
        <div className="w-1 h-1 bg-white absolute"></div>
      </div>
      <span className="relative z-10 flex items-center">{children}</span>
    </a>;
};

// Main interactive game-like grid system
const InteractiveGrid = () => {
  const canvasRef = useRef(null);
  const [activeCell, setActiveCell] = useState(null);
  const [cells, setCells] = useState([]);
  const gridSize = 20;
  useEffect(() => {
    // Initialize grid cells
    const newCells = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        newCells.push({
          x,
          y,
          active: Math.random() > 0.7,
          color: `rgba(${Math.random() * 100}, ${Math.random() * 200 + 55}, ${Math.random() * 255}, 0.2)`,
          pulseRate: 3 + Math.random() * 5
        });
      }
    }
    setCells(newCells);
    // Handle animation
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrame;
    const draw = () => {
      if (!canvas) return;
      const width = canvas.width = window.innerWidth;
      const height = canvas.height = window.innerHeight;
      const cellWidth = width / gridSize;
      const cellHeight = height / gridSize;
      ctx.clearRect(0, 0, width, height);
      // Draw grid
      cells.forEach(cell => {
        if (cell.active) {
          const now = Date.now() / 1000;
          const brightness = 0.3 + Math.sin(now * cell.pulseRate) * 0.2;
          ctx.fillStyle = cell.color.replace('0.2', brightness.toFixed(2));
          ctx.strokeStyle = 'rgba(0, 168, 255, 0.1)';
          ctx.lineWidth = 1;
          ctx.fillRect(cell.x * cellWidth, cell.y * cellHeight, cellWidth, cellHeight);
          ctx.strokeRect(cell.x * cellWidth, cell.y * cellHeight, cellWidth, cellHeight);
        }
      });
      // Draw connections between active cells
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 168, 255, 0.1)';
      ctx.lineWidth = 0.5;
      let prevActiveCell = null;
      cells.filter(cell => cell.active).forEach(cell => {
        if (prevActiveCell) {
          ctx.moveTo(prevActiveCell.x * cellWidth + cellWidth / 2, prevActiveCell.y * cellHeight + cellHeight / 2);
          ctx.lineTo(cell.x * cellWidth + cellWidth / 2, cell.y * cellHeight + cellHeight / 2);
        }
        prevActiveCell = cell;
      });
      ctx.stroke();
      animationFrame = requestAnimationFrame(draw);
    };
    draw();
    // Handle window resize
    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    // Handle mouse interaction
    const handleMouseMove = e => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / (canvas.width / gridSize));
      const y = Math.floor((e.clientY - rect.top) / (canvas.height / gridSize));
      if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        setActiveCell({
          x,
          y
        });
        // Activate nearby cells
        setCells(prevCells => prevCells.map(cell => {
          const distance = Math.sqrt(Math.pow(cell.x - x, 2) + Math.pow(cell.y - y, 2));
          if (distance < 3) {
            return {
              ...cell,
              active: true
            };
          }
          return cell;
        }));
      }
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationFrame);
    };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 z-0" style={{
    background: 'transparent'
  }} />;
};

// Interactive character that follows cursor
const KanaCharacter = () => {
  const [position, setPosition] = useState({
    x: 100,
    y: 100
  });
  const [target, setTarget] = useState({
    x: 100,
    y: 100
  });
  const [isWaving, setIsWaving] = useState(false);
  const [emotion, setEmotion] = useState('happy');
  useEffect(() => {
    const handleMouseMove = e => {
      const {
        clientX,
        clientY
      } = e;
      setTarget({
        x: clientX,
        y: clientY
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    const interval = setInterval(() => {
      setPosition(prev => {
        const dx = (target.x - prev.x) * 0.05;
        const dy = (target.y - prev.y) * 0.05;
        return {
          x: prev.x + dx,
          y: prev.y + dy
        };
      });
    }, 16);
    // Random emotional states
    const emotionInterval = setInterval(() => {
      const emotions = ['happy', 'excited', 'curious', 'thinking'];
      setEmotion(emotions[Math.floor(Math.random() * emotions.length)]);
      // Occasionally wave
      if (Math.random() > 0.8) {
        setIsWaving(true);
        setTimeout(() => setIsWaving(false), 1000);
      }
    }, 3000);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
      clearInterval(emotionInterval);
    };
  }, [target]);
  const characterColor = emotion === 'happy' ? '#00A8FF' : emotion === 'excited' ? '#FF00A8' : emotion === 'curious' ? '#A8FF00' : '#FFBB00';
  return <div className="fixed z-50 pointer-events-none" style={{
    left: `${position.x - 25}px`,
    top: `${position.y - 25}px`,
    transition: 'transform 0.3s ease-out',
    transform: `scale(${emotion === 'excited' ? 1.2 : 1}) ${isWaving ? 'rotate(5deg)' : ''}`
  }}>
      <div className="relative">
        {/* Character body */}
        <div className="w-12 h-12 rounded-lg" style={{
        backgroundColor: characterColor,
        boxShadow: `0 0 15px ${characterColor}`
      }}>
          {/* Eyes */}
          <div className="absolute flex gap-4 top-2 left-2">
            <div className="w-2 h-2 bg-black rounded-full"></div>
            <div className="w-2 h-2 bg-black rounded-full"></div>
          </div>

          {/* Mouth */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2" style={{
          width: emotion === 'happy' || emotion === 'excited' ? '8px' : '4px',
          height: emotion === 'happy' || emotion === 'excited' ? '4px' : '2px',
          borderRadius: '2px',
          backgroundColor: '#000'
        }}></div>

          {/* Waving arm */}
          {isWaving && <div className="absolute -right-4 top-0 w-4 h-2" style={{
          backgroundColor: characterColor
        }}></div>}
        </div>

        {/* Floating text */}
        {(emotion === 'curious' || emotion === 'thinking') && <div className="absolute -top-6 left-0 text-xs text-white">
            {emotion === 'curious' ? '?' : '...'}
          </div>}
      </div>
    </div>;
};

// Floating elements that respond to mouse movement
const FloatingElements = () => {
  const [elements] = useState(() => Array.from({
    length: 8
  }).map((_, i) => ({
    id: i,
    icon: i % 5 === 0 ? <Sparkles size={20} /> : i % 5 === 1 ? <BookOpen size={20} /> : i % 5 === 2 ? <Trophy size={20} /> : i % 5 === 3 ? <Brain size={20} /> : <Zap size={20} />,
    x: 20 + Math.random() * 60,
    y: 20 + Math.random() * 60,
    speed: 1 + Math.random() * 3,
    direction: Math.random() * Math.PI * 2,
    color: `hsl(${Math.random() * 60 + 180}, 100%, 70%)`
  })));
  // Reference for mouse position
  const mousePos = useRef({
    x: 0,
    y: 0
  });
  const [positions, setPositions] = useState(elements.map(e => ({
    x: e.x,
    y: e.y
  })));
  useEffect(() => {
    const handleMouseMove = e => {
      const {
        clientX,
        clientY
      } = e;
      mousePos.current = {
        x: clientX / window.innerWidth * 100,
        y: clientY / window.innerHeight * 100
      };
    };
    window.addEventListener('mousemove', handleMouseMove);
    const interval = setInterval(() => {
      setPositions(prev => prev.map((pos, i) => {
        const element = elements[i];
        // Calculate distance to mouse
        const dx = mousePos.current.x - pos.x;
        const dy = mousePos.current.y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Move away from mouse if close
        let newX = pos.x;
        let newY = pos.y;
        if (distance < 15) {
          // Repel from mouse
          newX -= dx / distance * 2;
          newY -= dy / distance * 2;
        } else {
          // Regular floating movement
          newX += Math.cos(element.direction) * element.speed * 0.2;
          newY += Math.sin(element.direction) * element.speed * 0.2;
          // Bounce off edges
          if (newX < 0 || newX > 100) element.direction = Math.PI - element.direction;
          if (newY < 0 || newY > 100) element.direction = -element.direction;
        }
        // Keep in bounds
        newX = Math.max(0, Math.min(100, newX));
        newY = Math.max(0, Math.min(100, newY));
        return {
          x: newX,
          y: newY
        };
      }));
    }, 50);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, [elements]);
  return <>
      {elements.map((element, i) => <div key={element.id} className="absolute transform" style={{
      left: `${positions[i].x}%`,
      top: `${positions[i].y}%`,
      color: element.color,
      filter: `drop-shadow(0 0 5px ${element.color})`,
      transform: `translate(-50%, -50%)`
    }}>
          {element.icon}
        </div>)}
    </>;
};

// XP Counter with animation
const XpCounter = ({
  xp
}) => {
  const [displayXp, setDisplayXp] = useState(0);
  const [showIncrease, setShowIncrease] = useState(false);
  useEffect(() => {
    if (xp > displayXp) {
      setShowIncrease(true);
      const interval = setInterval(() => {
        setDisplayXp(prev => {
          const diff = xp - prev;
          const increment = Math.max(1, Math.floor(diff / 10));
          return Math.min(prev + increment, xp);
        });
      }, 50);
      setTimeout(() => setShowIncrease(false), 2000);
      return () => clearInterval(interval);
    }
  }, [xp, displayXp]);
  return <div className="relative">
      <div className="flex items-center gap-1 text-white">
        <span className="text-sm">XP:</span>
        <span className="text-cyan-300">{displayXp}</span>
      </div>

      {showIncrease && <div className="absolute -top-6 left-0 text-xs text-green-400">
          +{xp - displayXp > 0 ? xp - displayXp : 10} XP
        </div>}
    </div>;
};

// Slideshow Component
const HeroSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Placeholder images - replace these with your actual image paths
  const slides = [
    '/Screenshot_2025-05-05_141452-removebg-preview.png',
    '/Screenshot_2025-05-05_141452-removebg-preview.png',
    '/Screenshot_2025-05-05_141452-removebg-preview.png',
    '/Screenshot_2025-05-05_141452-removebg-preview.png',
    '/Screenshot_2025-05-05_141452-removebg-preview.png',
    '/Screenshot_2025-05-05_141452-removebg-preview.png',
    '/Screenshot_2025-05-05_141452-removebg-preview.png',
    '/Screenshot_2025-05-05_141452-removebg-preview.png',
    '/Screenshot_2025-05-05_141452-removebg-preview.png'
  ];

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-purple-900/20 to-cyan-900/20 rounded-lg overflow-hidden border border-cyan-500/30">
      {/* Slideshow Container */}
      <div className="relative w-full h-full">
        {/* Slides */}
        <div className="relative w-full h-full overflow-hidden">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                index === currentSlide 
                  ? 'opacity-100 transform translate-x-0' 
                  : index < currentSlide 
                    ? 'opacity-0 transform -translate-x-full' 
                    : 'opacity-0 transform translate-x-full'
              }`}
            >
              <img
                src={slide}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Neon overlay effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10"></div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-cyan-400 p-2 rounded-full border border-cyan-500/30 transition-all duration-300 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/25 z-10"
        >
          <ChevronLeft size={20} />
        </button>
        
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-cyan-400 p-2 rounded-full border border-cyan-500/30 transition-all duration-300 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/25 z-10"
        >
          <ChevronRight size={20} />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-cyan-400 shadow-lg shadow-cyan-500/50' 
                  : 'bg-gray-600 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Slide Counter */}
        <div className="absolute top-4 right-4 bg-black/60 text-cyan-400 px-3 py-1 rounded-full text-sm font-pixel border border-cyan-500/30 z-10">
          {currentSlide + 1} / {slides.length}
        </div>

        {/* Glitch effect overlay */}
        <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent animate-pulse pointer-events-none"></div>
      </div>
    </div>
  );
};

export const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [xp, setXp] = useState(0);
  const [showKana, setShowKana] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Award initial XP
      setXp(10);
    }, 300);
    // Interactive elements increase XP
    const xpInterval = setInterval(() => {
      setXp(prev => prev + Math.floor(Math.random() * 3));
    }, 8000);
    return () => {
      clearTimeout(timer);
      clearInterval(xpInterval);
    };
  }, []);
  const handleKanaClick = () => {
    setShowKana(!showKana);
    setXp(prev => prev + 5);
  };
  return <section className="relative min-h-screen w-full bg-black pt-20 overflow-hidden">
      {/* Interactive grid background */}
      <InteractiveGrid />

      {/* Interactive floating elements */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        <FloatingElements />
      </div>

      {showKana && <KanaCharacter />}

      <div className="container mx-auto px-4 py-16 relative z-20">
        <div className="flex flex-col md:flex-row items-center">
          <div className={`w-full md:w-1/2 transition-all duration-1000 transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'}`}>
            <h1 className="text-3xl md:text-5xl mb-6">
              <span className="text-cyan-400">WELCOME TO THE</span> <br />
              <span className="text-green-400 inline-block mt-2 text-4xl md:text-6xl">
                BRAININK
              </span>
            </h1>            <p className="text-gray-300 mb-8 text-sm leading-relaxed">
              Master any subject. Challenge yourself. <br />
              Learn anything. Earn rewards. <br />
              All in one immersive educational universe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <PixelButton primary onClick={() => navigate('/signup')}>
                Start Your Quest
                <ArrowRight size={16} className="ml-2" />
              </PixelButton>
              <PixelButton href="#kana" onClick={handleKanaClick}>
                Meet K.A.N.A.
                <Star size={16} className="ml-2" />
              </PixelButton>
            </div>

            {/* Achievement notification */}
            <div className="mt-12 bg-black/80 border border-cyan-500/30 p-4 rounded-lg max-w-xs">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center mr-3">
                  <Star size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-cyan-400 text-xs">First Visit!</p>
                  <XpCounter xp={xp} />
                </div>
              </div>
            </div>
          </div>

          <div className={`w-full md:w-1/2 mt-12 md:mt-0 transition-all duration-1000 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}>
            <div className="relative h-96 md:h-[500px]">
              {/* Hero Slideshow */}
              <HeroSlideshow />
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-pink-500 z-30"></div>
              <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-green-500 z-30"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-6 h-10 rounded-full border-2 border-cyan-500 flex items-center justify-center">
          <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
        </div>
      </div>
    </section>;
};