import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Book, FileText, Film, Gamepad, Archive, ArrowLeft, Search, BookOpen, Clock } from 'lucide-react';
import { TextbookViewer } from './TextbookViewer';
import { ResearchPapers } from './ResearchPapers';
import { VideoLectures } from './VideoLectures';
import { InteractiveSimulations } from './InteractiveSimulations';
import { ArchiveExplorer } from './ArchiveExplorer';

interface LibraryHubProps {
  onExit: () => void;
  initialMode?: string;
  featureId?: string;
  subFeatureId?: string;
}

type LibraryScreen = 'hub' | 'textbooks' | 'research-papers' | 'video-lectures' | 'simulations' | 'archives';

interface LibraryItem {
  id: string;
  title: string;
  author: string;
  category: string;
  coverImage: string;
  description: string;
  publishDate: string;
  rating: number;
  views: number;
  readTime: string;
}

// Mock data for library items
const mockLibraryItems: LibraryItem[] = [
  {
    id: 'book-1',
    title: 'Introduction to Neuroscience',
    author: 'Dr. Sarah Johnson',
    category: 'Textbooks',
    coverImage: '🧠',
    description: 'A comprehensive introduction to the study of the nervous system.',
    publishDate: '2023-05-15',
    rating: 4.8,
    views: 1245,
    readTime: '12 hours'
  },
  {
    id: 'book-2',
    title: 'Cognitive Psychology: A Primer',
    author: 'Prof. Michael Chen',
    category: 'Textbooks',
    coverImage: '🧠',
    description: 'Explores the foundations of human cognition and mental processes.',
    publishDate: '2022-09-10',
    rating: 4.6,
    views: 985,
    readTime: '8 hours'
  },
  {
    id: 'paper-1',
    title: 'Neural Networks in Learning Systems',
    author: 'Dr. Emily Wilson et al.',
    category: 'Research Papers',
    coverImage: '📑',
    description: 'Recent advances in neural network applications for educational technology.',
    publishDate: '2024-02-20',
    rating: 4.9,
    views: 562,
    readTime: '45 minutes'
  },
  {
    id: 'video-1',
    title: 'Understanding Memory Formation',
    author: 'BrainLab Academy',
    category: 'Video Lectures',
    coverImage: '🎬',
    description: 'A visual journey through the process of memory formation in the brain.',
    publishDate: '2024-01-05',
    rating: 4.7,
    views: 3240,
    readTime: '1.5 hours'
  },
  {
    id: 'sim-1',
    title: 'Neural Pathway Simulator',
    author: 'Interactive Neuroscience Team',
    category: 'Simulations',
    coverImage: '🎮',
    description: 'Simulate signal transmission through neural pathways with this interactive tool.',
    publishDate: '2023-11-30',
    rating: 4.9,
    views: 1872,
    readTime: 'Interactive'
  },
  {
    id: 'archive-1',
    title: 'History of Neuroscience: 1800-1950',
    author: 'Historical Archive Foundation',
    category: 'Archives',
    coverImage: '🗄️',
    description: 'A historical collection of key neuroscientific discoveries and papers.',
    publishDate: '2022-06-12',
    rating: 4.5,
    views: 782,
    readTime: '5 hours'
  }
];

export const LibraryHub: React.FC<LibraryHubProps> = ({
  onExit,
  initialMode = 'hub',
  featureId,
  subFeatureId
}) => {
  const [currentScreen, setCurrentScreen] = useState<LibraryScreen>('hub');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<LibraryItem[]>(mockLibraryItems);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

  // Automatically navigate to the correct screen based on subFeatureId
  useEffect(() => {
    if (subFeatureId) {
      switch (subFeatureId) {
        case 'textbooks':
          setCurrentScreen('textbooks');
          break;
        case 'research-papers':
          setCurrentScreen('research-papers');
          break;
        case 'video-lectures':
          setCurrentScreen('video-lectures');
          break;
        case 'interactive-simulations':
          setCurrentScreen('simulations');
          break;
        default:
          if (featureId === 'archives') {
            setCurrentScreen('archives');
          }
          break;
      }
    } else if (featureId) {
      // Handle feature navigation without specific sub-feature
      switch (featureId) {
        case 'digital-books':
          setCurrentScreen('textbooks');
          break;
        case 'multimedia':
          setCurrentScreen('video-lectures');
          break;
        case 'archives':
          setCurrentScreen('archives');
          break;
      }
    }
  }, [featureId, subFeatureId]);

  // Filter items based on search query and current screen
  useEffect(() => {
    let items = mockLibraryItems;
    
    // Filter by category based on current screen
    if (currentScreen !== 'hub') {
      const categoryMap: Record<LibraryScreen, string> = {
        'textbooks': 'Textbooks',
        'research-papers': 'Research Papers',
        'video-lectures': 'Video Lectures',
        'simulations': 'Simulations',
        'archives': 'Archives',
        'hub': ''
      };
      
      items = items.filter(item => item.category === categoryMap[currentScreen]);
    }
    
    // Apply search filter if query exists
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => (
        item.title.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      ));
    }
    
    setFilteredItems(items);
  }, [currentScreen, searchQuery]);

  // Function to render the appropriate component based on current screen
  const renderContent = () => {
    if (selectedItem) {
      // Render item detail view based on category
      switch (selectedItem.category) {
        case 'Textbooks':
          return <TextbookViewer item={selectedItem} onBack={() => setSelectedItem(null)} />;
        case 'Research Papers':
          return <ResearchPapers item={selectedItem} onBack={() => setSelectedItem(null)} />;
        case 'Video Lectures':
          return <VideoLectures item={selectedItem} onBack={() => setSelectedItem(null)} />;
        case 'Simulations':
          return <InteractiveSimulations item={selectedItem} onBack={() => setSelectedItem(null)} />;
        case 'Archives':
          return <ArchiveExplorer item={selectedItem} onBack={() => setSelectedItem(null)} />;
        default:
          return null;
      }
    }

    if (currentScreen === 'hub') {
      return renderLibraryHub();
    }

    // Render category view with filtered items
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setCurrentScreen('hub')} 
            className="p-2 rounded-lg hover:bg-primary/20 transition-colors"
          >
            <ArrowLeft size={20} className="text-primary" />
          </button>
          <h2 className="font-pixel text-xl text-primary">
            {getCategoryTitle(currentScreen)}
          </h2>
        </div>

        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark/50 border border-primary/30 rounded-lg py-2 px-4 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-primary/60"
          />
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
          {filteredItems.map(item => (
            <div 
              key={item.id}
              className="bg-dark/40 rounded-lg p-4 border border-primary/20 hover:border-primary/50 cursor-pointer transition-all hover:scale-[1.02]"
              onClick={() => setSelectedItem(item)}
            >
              <div className="flex items-start gap-3">
                <div className="text-4xl">{item.coverImage}</div>
                <div className="flex-1">
                  <h3 className="font-pixel text-sm text-primary mb-1">{item.title}</h3>
                  <p className="text-gray-400 text-xs">{item.author}</p>
                  
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center text-yellow-400 text-xs">
                      <span className="mr-1">★</span> {item.rating.toFixed(1)}
                    </div>
                    <div className="flex items-center text-gray-400 text-xs">
                      <Clock size={12} className="mr-1" />
                      {item.readTime}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            No items found matching your search criteria.
          </div>
        )}
      </div>
    );
  };

  // Render the main library hub with category selections
  const renderLibraryHub = () => {
    return (
      <div className="h-full">
        <div className="mb-6">
          <h2 className="font-pixel text-xl text-primary mb-2">Knowledge Library</h2>
          <p className="text-gray-300">
            Explore our vast collection of learning materials and resources.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CategoryCard 
            title="Textbooks"
            description="Academic textbooks and guides"
            icon={<Book size={30} />}
            color="#4db6ac"
            onClick={() => setCurrentScreen('textbooks')}
            itemCount={mockLibraryItems.filter(item => item.category === 'Textbooks').length}
          />
          
          <CategoryCard 
            title="Research Papers"
            description="Academic publications and papers"
            icon={<FileText size={30} />}
            color="#7986cb"
            onClick={() => setCurrentScreen('research-papers')}
            itemCount={mockLibraryItems.filter(item => item.category === 'Research Papers').length}
          />
          
          <CategoryCard 
            title="Video Lectures"
            description="Watch educational content"
            icon={<Film size={30} />}
            color="#ef5350"
            onClick={() => setCurrentScreen('video-lectures')}
            itemCount={mockLibraryItems.filter(item => item.category === 'Video Lectures').length}
          />
          
          <CategoryCard 
            title="Interactive Simulations"
            description="Hands-on learning experiences"
            icon={<Gamepad size={30} />}
            color="#ffa726"
            onClick={() => setCurrentScreen('simulations')}
            itemCount={mockLibraryItems.filter(item => item.category === 'Simulations').length}
          />
          
          <CategoryCard 
            title="Archives"
            description="Historical knowledge repository"
            icon={<Archive size={30} />}
            color="#9575cd"
            onClick={() => setCurrentScreen('archives')}
            itemCount={mockLibraryItems.filter(item => item.category === 'Archives').length}
          />

          <div className="bg-dark/40 rounded-lg p-6 border border-primary/20 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <BookOpen size={30} className="mx-auto mb-2 opacity-50" />
              <p>More categories coming soon</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to get the category title based on screen
  const getCategoryTitle = (screen: LibraryScreen): string => {
    switch (screen) {
      case 'textbooks': return 'Textbooks';
      case 'research-papers': return 'Research Papers';
      case 'video-lectures': return 'Video Lectures';
      case 'simulations': return 'Interactive Simulations';
      case 'archives': return 'Archives';
      default: return 'Library';
    }
  };

  return (
    <div className="h-full p-6 overflow-y-auto">
      {renderContent()}
    </div>
  );
};

// Category card component for the library hub
interface CategoryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  itemCount: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  description,
  icon,
  color,
  onClick,
  itemCount
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="bg-dark/40 rounded-lg p-6 border border-primary/20 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div 
          className="p-3 rounded-lg" 
          style={{ backgroundColor: `${color}30`, color }}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-pixel text-primary mb-1">{title}</h3>
          <p className="text-gray-400 text-sm mb-2">{description}</p>
          <div className="flex items-center text-xs text-gray-400">
            <BookOpen size={12} className="mr-1" />
            {itemCount} items
          </div>
        </div>
      </div>
    </motion.div>
  );
};
