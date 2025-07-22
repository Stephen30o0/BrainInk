import React, { useState, useEffect } from 'react';

interface HeaderSlideshowProps {
  images?: string[];
  autoPlayDuration?: number;
}

export const HeaderSlideshow: React.FC<HeaderSlideshowProps> = ({ 
  // Slideshow images from the slideshowimages folder
  images = [
    '/slideshowimages/young-person-taking-notes-textbook-paper-with-pen-looking-modern-laptop-woman-writing-information-notebook-files-doing-remote-work-adult-working-from-home-business.jpg',
    '/slideshowimages/woman-teaching-kids-class.jpg',
    '/slideshowimages/teachernstudent.jpg',
    '/slideshowimages/students-studying-together-medium-shot.jpg',
    '/slideshowimages/people-practicing-social-integration-workspace.jpg',
    '/slideshowimages/group-african-kids-paying-attention-class.jpg'
  ],
  autoPlayDuration = 5000 
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate slides every 5 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, autoPlayDuration);

    return () => clearInterval(interval);
  }, [images.length, autoPlayDuration]);

  if (images.length === 0) return null;

  return (
    <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] bg-white overflow-hidden">
      {/* Slideshow Container */}
      <div className="relative w-full h-full">
        {/* Slides */}
        <div className="relative w-full h-full">
          {images.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                index === currentSlide 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-105'
              }`}
            >
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
              {/* Darker overlay for better text visibility */}
              <div className="absolute inset-0 bg-black/40"></div>
            </div>
          ))}
        </div>

        {/* Left-aligned text overlay */}
        <div className="absolute top-0 left-0 w-1/2 h-full flex items-center justify-start px-8 lg:px-16 z-10">
          <div className="drop-shadow-2xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light mb-4 leading-tight">
              <span className="text-white">Welcome to</span><br />
              <span className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">Brain Ink</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl xl:text-2xl mb-8 leading-relaxed opacity-90 text-white font-light">
              The future of AI in education - personalized learning & automation
            </p>
            <button 
              onClick={() => window.location.href = '/signup'}
              className="bg-white text-blue-600 hover:bg-blue-50 px-6 md:px-8 py-3 rounded-lg text-base md:text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Get Started
            </button>
          </div>
        </div>

        {/* Slide Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-blue-400 shadow-lg shadow-blue-500/50 scale-110' 
                    : 'bg-white/60 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}


      </div>
    </div>
  );
};
