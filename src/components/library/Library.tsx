import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowLeft, Users, Book, Film, Archive, BookOpen } from 'lucide-react';

interface LibraryProps {
  onExit: () => void;
  activeStation: string | null;
  activeSubFeature: string | null;
}

type LibraryScreen = 'hub' | 'digital-books' | 'multimedia-center' | 'archives' | 
  'textbooks' | 'research-papers' | 'video-lectures' | 'simulations' | 'historical-archives' | 'special-collections';

export const Library: React.FC<LibraryProps> = ({
  onExit,
  activeStation,
  activeSubFeature
}) => {
  const [currentScreen, setCurrentScreen] = useState<LibraryScreen>(
    (activeSubFeature as LibraryScreen) || (activeStation as LibraryScreen) || 'hub'
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  // Hub screen (main screen)
  const renderHubScreen = () => (
    <motion.div
      className="h-full flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="bg-dark/50 border-b border-primary/30 p-4 flex justify-between items-center"
        variants={itemVariants}
      >
        <div className="flex items-center gap-2">
          <Book size={20} className="text-amber-400" />
          <h2 className="text-amber-400 font-pixel text-lg">Library</h2>
        </div>
        <button onClick={onExit} className="p-2 text-gray-400 hover:text-primary">
          <X size={20} />
        </button>
      </motion.div>

      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div className="grid grid-cols-1 gap-4 mb-8" variants={itemVariants}>
          <button
            onClick={() => setCurrentScreen('digital-books')}
            className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/30 rounded-lg p-6 text-left transition-all hover:scale-[1.02] flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-2xl">ud83dudcda</div>
            <div className="flex-1">
              <h3 className="font-pixel text-amber-400 mb-1">Digital Books</h3>
              <p className="text-gray-400 text-xs">Access textbooks and research papers</p>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <span>250+ titles</span>
            </div>
          </button>

          <button
            onClick={() => setCurrentScreen('multimedia-center')}
            className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 rounded-lg p-6 text-left transition-all hover:scale-[1.02] flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl">ud83cudfa5</div>
            <div className="flex-1">
              <h3 className="font-pixel text-blue-400 mb-1">Multimedia Center</h3>
              <p className="text-gray-400 text-xs">Watch lectures and interactive simulations</p>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <span>100+ resources</span>
            </div>
          </button>

          <button
            onClick={() => setCurrentScreen('archives')}
            className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 hover:from-purple-500/30 hover:to-violet-500/30 border border-purple-500/30 rounded-lg p-6 text-left transition-all hover:scale-[1.02] flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-2xl">ud83duddc3️</div>
            <div className="flex-1">
              <h3 className="font-pixel text-purple-400 mb-1">Archives</h3>
              <p className="text-gray-400 text-xs">Explore historical and special collections</p>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <span>75+ collections</span>
            </div>
          </button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h3 className="font-pixel text-amber-400 mb-3">Recently Added</h3>
          <div className="space-y-3">
            {[
              { title: 'Advanced Neural Networks', type: 'Textbook', category: 'Computer Science', date: '2 days ago' },
              { title: 'Understanding Quantum Physics', type: 'Video Lecture', category: 'Physics', date: '4 days ago' },
              { title: 'The Evolution of Modern Medicine', type: 'Research Paper', category: 'Medicine', date: '1 week ago' }
            ].map((item, index) => (
              <div key={index} className="bg-dark/30 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                  {item.type === 'Textbook' && 'ud83dudcda'}
                  {item.type === 'Video Lecture' && 'ud83cudfa5'}
                  {item.type === 'Research Paper' && 'ud83dudcc4'}
                </div>
                <div className="flex-1">
                  <h4 className="text-primary text-sm">{item.title}</h4>
                  <div className="flex text-xs text-gray-400 gap-2">
                    <span>{item.type}</span>
                    <span>u2022</span>
                    <span>{item.category}</span>
                    <span>u2022</span>
                    <span>{item.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  // Digital Books screen
  const renderDigitalBooksScreen = () => (
    <motion.div 
      className="h-full flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="bg-dark/50 border-b border-primary/30 p-4 flex justify-between items-center"
        variants={itemVariants}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-amber-400" />
          <h2 className="text-amber-400 font-pixel text-lg">Digital Books</h2>
        </div>
        <button onClick={() => setCurrentScreen('hub')} className="p-2 text-gray-400 hover:text-primary">
          <ArrowLeft size={20} />
        </button>
      </motion.div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" variants={itemVariants}>
          <button 
            onClick={() => setCurrentScreen('textbooks')} 
            className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/30 rounded-lg p-5 text-center transition-all hover:scale-[1.02] flex flex-col items-center"
          >
            <div className="w-16 h-16 mb-3 rounded-full bg-amber-500/20 flex items-center justify-center text-3xl">
              ud83dudcda
            </div>
            <h3 className="font-pixel text-amber-400 mb-1">Textbooks</h3>
            <p className="text-gray-400 text-xs">Browse academic textbooks by subject</p>
          </button>
          
          <button 
            onClick={() => setCurrentScreen('research-papers')} 
            className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-500/30 rounded-lg p-5 text-center transition-all hover:scale-[1.02] flex flex-col items-center"
          >
            <div className="w-16 h-16 mb-3 rounded-full bg-yellow-500/20 flex items-center justify-center text-3xl">
              ud83dudcc4
            </div>
            <h3 className="font-pixel text-yellow-400 mb-1">Research Papers</h3>
            <p className="text-gray-400 text-xs">Explore the latest academic research</p>
          </button>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <h3 className="font-pixel text-amber-400 mb-3">Popular Books</h3>
          <div className="space-y-4">
            {[
              { title: 'Introduction to Machine Learning', author: 'Dr. Sarah Chen', category: 'Computer Science', reads: 324 },
              { title: 'Fundamentals of Cognitive Psychology', author: 'Prof. James Wilson', category: 'Psychology', reads: 287 },
              { title: 'Advanced Calculus and Applications', author: 'Dr. Robert Lee', category: 'Mathematics', reads: 246 }
            ].map((book, index) => (
              <div key={index} className="bg-dark/30 border border-primary/20 rounded-lg p-4 hover:bg-dark/40 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-primary font-pixel">{book.title}</h4>
                  <span className="px-2 py-0.5 bg-primary/10 rounded-full text-xs text-gray-400">{book.category}</span>
                </div>
                <p className="text-sm text-gray-400 mb-2">by {book.author}</p>
                <div className="flex items-center text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    <span>{book.reads} reads</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  // Multimedia Center screen
  const renderMultimediaCenterScreen = () => (
    <motion.div 
      className="h-full flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="bg-dark/50 border-b border-primary/30 p-4 flex justify-between items-center"
        variants={itemVariants}
      >
        <div className="flex items-center gap-2">
          <Film size={20} className="text-blue-400" />
          <h2 className="text-blue-400 font-pixel text-lg">Multimedia Center</h2>
        </div>
        <button onClick={() => setCurrentScreen('hub')} className="p-2 text-gray-400 hover:text-primary">
          <ArrowLeft size={20} />
        </button>
      </motion.div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" variants={itemVariants}>
          <button 
            onClick={() => setCurrentScreen('video-lectures')} 
            className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 rounded-lg p-5 text-center transition-all hover:scale-[1.02] flex flex-col items-center"
          >
            <div className="w-16 h-16 mb-3 rounded-full bg-blue-500/20 flex items-center justify-center text-3xl">
              ud83cudfa5
            </div>
            <h3 className="font-pixel text-blue-400 mb-1">Video Lectures</h3>
            <p className="text-gray-400 text-xs">Watch lectures from top educators</p>
          </button>
          
          <button 
            onClick={() => setCurrentScreen('simulations')} 
            className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 hover:to-teal-500/30 border border-cyan-500/30 rounded-lg p-5 text-center transition-all hover:scale-[1.02] flex flex-col items-center"
          >
            <div className="w-16 h-16 mb-3 rounded-full bg-cyan-500/20 flex items-center justify-center text-3xl">
              ud83dudcbb
            </div>
            <h3 className="font-pixel text-cyan-400 mb-1">Simulations</h3>
            <p className="text-gray-400 text-xs">Experience interactive learning simulations</p>
          </button>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <h3 className="font-pixel text-blue-400 mb-3">Featured Media</h3>
          <div className="space-y-4">
            {[
              { title: 'The Future of Artificial Intelligence', presenter: 'Dr. Michael Chen', duration: '45:28', views: 1842, thumbnail: 'ud83cudfa5' },
              { title: 'Exploring the Human Brain', presenter: 'Prof. Elizabeth Taylor', duration: '38:15', views: 1506, thumbnail: 'ud83cudfa5' },
              { title: 'Physics in Motion: Forces and Energy', presenter: 'Dr. Richard Feynman', duration: '52:10', views: 1247, thumbnail: 'ud83cudfa5' }
            ].map((video, index) => (
              <div key={index} className="bg-dark/30 border border-primary/20 rounded-lg p-4 hover:bg-dark/40 transition-colors cursor-pointer">
                <div className="flex gap-3">
                  <div className="w-16 h-16 flex-shrink-0 bg-blue-500/10 rounded flex items-center justify-center text-2xl">
                    {video.thumbnail}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-primary font-pixel mb-1">{video.title}</h4>
                    <p className="text-sm text-gray-400 mb-2">by {video.presenter}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{video.duration}</span>
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        <span>{video.views} views</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  // Archives screen
  const renderArchivesScreen = () => (
    <motion.div 
      className="h-full flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="bg-dark/50 border-b border-primary/30 p-4 flex justify-between items-center"
        variants={itemVariants}
      >
        <div className="flex items-center gap-2">
          <Archive size={20} className="text-purple-400" />
          <h2 className="text-purple-400 font-pixel text-lg">Archives</h2>
        </div>
        <button onClick={() => setCurrentScreen('hub')} className="p-2 text-gray-400 hover:text-primary">
          <ArrowLeft size={20} />
        </button>
      </motion.div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" variants={itemVariants}>
          <button 
            onClick={() => setCurrentScreen('historical-archives')} 
            className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 hover:from-purple-500/30 hover:to-violet-500/30 border border-purple-500/30 rounded-lg p-5 text-center transition-all hover:scale-[1.02] flex flex-col items-center"
          >
            <div className="w-16 h-16 mb-3 rounded-full bg-purple-500/20 flex items-center justify-center text-3xl">
              ud83duddd2️
            </div>
            <h3 className="font-pixel text-purple-400 mb-1">Historical Archives</h3>
            <p className="text-gray-400 text-xs">Explore documents from the past</p>
          </button>
          
          <button 
            onClick={() => setCurrentScreen('special-collections')} 
            className="bg-gradient-to-br from-violet-500/20 to-indigo-500/20 hover:from-violet-500/30 hover:to-indigo-500/30 border border-violet-500/30 rounded-lg p-5 text-center transition-all hover:scale-[1.02] flex flex-col items-center"
          >
            <div className="w-16 h-16 mb-3 rounded-full bg-violet-500/20 flex items-center justify-center text-3xl">
              ud83duddc3️
            </div>
            <h3 className="font-pixel text-violet-400 mb-1">Special Collections</h3>
            <p className="text-gray-400 text-xs">Access rare and unique materials</p>
          </button>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <h3 className="font-pixel text-purple-400 mb-3">Featured Collections</h3>
          <div className="space-y-4">
            {[
              { title: 'The Renaissance Period', description: 'Original manuscripts and artworks from the 14th-17th centuries', items: 128, era: '14th-17th Century' },
              { title: 'Scientific Discoveries', description: 'Important papers documenting major scientific breakthroughs', items: 95, era: '18th-20th Century' },
              { title: 'World History Collection', description: 'Historical documents from significant world events', items: 142, era: 'Various' }
            ].map((collection, index) => (
              <div key={index} className="bg-dark/30 border border-primary/20 rounded-lg p-4 hover:bg-dark/40 transition-colors cursor-pointer">
                <h4 className="text-primary font-pixel mb-1">{collection.title}</h4>
                <p className="text-sm text-gray-400 mb-2">{collection.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{collection.items} items</span>
                  <span className="px-2 py-0.5 bg-primary/10 rounded-full">{collection.era}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  // Generic placeholder for screens not fully implemented yet
  const renderPlaceholderScreen = (title: string, emoji: string) => (
    <motion.div
      className="h-full flex flex-col items-center justify-center p-8 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="text-6xl mb-6" variants={itemVariants}>
        {emoji}
      </motion.div>
      <motion.h3 className="font-pixel text-primary mb-3 text-xl" variants={itemVariants}>
        {title}
      </motion.h3>
      <motion.p className="text-gray-400 mb-8" variants={itemVariants}>
        This section is coming soon!
      </motion.p>
      <motion.button
        onClick={() => {
          if (currentScreen === 'textbooks' || currentScreen === 'research-papers') {
            setCurrentScreen('digital-books');
          } else if (currentScreen === 'video-lectures' || currentScreen === 'simulations') {
            setCurrentScreen('multimedia-center');
          } else if (currentScreen === 'historical-archives' || currentScreen === 'special-collections') {
            setCurrentScreen('archives');
          } else {
            setCurrentScreen('hub');
          }
        }}
        className="px-4 py-2 bg-primary/20 border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors"
        variants={itemVariants}
      >
        Go Back
      </motion.button>
    </motion.div>
  );

  // Render appropriate content based on current screen
  const renderContent = () => {
    switch (currentScreen) {
      case 'hub':
        return renderHubScreen();
      case 'digital-books':
        return renderDigitalBooksScreen();
      case 'multimedia-center':
        return renderMultimediaCenterScreen();
      case 'archives':
        return renderArchivesScreen();
      case 'textbooks':
        return renderPlaceholderScreen('Textbooks', 'ud83dudcda');
      case 'research-papers':
        return renderPlaceholderScreen('Research Papers', 'ud83dudcc4');
      case 'video-lectures':
        return renderPlaceholderScreen('Video Lectures', 'ud83cudfa5');
      case 'simulations':
        return renderPlaceholderScreen('Interactive Simulations', 'ud83dudcbb');
      case 'historical-archives':
        return renderPlaceholderScreen('Historical Archives', 'ud83duddd2️');
      case 'special-collections':
        return renderPlaceholderScreen('Special Collections', 'ud83duddc3️');
      default:
        return renderHubScreen();
    }
  };

  return renderContent();
};
