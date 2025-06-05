import { useState } from 'react';
import { useWallet } from '../shared/WalletContext'; // Added for Ink token payments
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ShoppingCart, DollarSign, BookOpen, Users, BarChart2, Search, Plus, X } from 'lucide-react'; // Added X icon

interface MarketplaceProps {
  onExit: () => void;
  activeStation?: string | null;
  activeSubFeature?: string | null;
}

// Define types for marketplace items
interface Resource {
  id: number;
  title: string;
  description: string;
  type: 'book' | 'course' | 'notes' | 'video';
  price: number;
  rating: number;
  seller: {
    id: number;
    name: string;
    rating: number;
  };
  thumbnail?: string;
  popularity: number;
}

interface Tutor {
  id: number;
  name: string;
  expertise: string[];
  rating: number;
  hourlyRate: number;
  availability: string;
  thumbnail?: string;
  students: number;
}

interface MarketStats {
  title: string;
  value: number | string;
  change: number;
  icon: JSX.Element;
}

// Mock data for the marketplace
const MARKETPLACE_TREASURY_ADDRESS = '0xMarketplaceTreasuryAddressPlaceholder'; // TODO: Replace with actual address

const mockResources: Resource[] = [
  {
    id: 1,
    title: 'Advanced Machine Learning Notes',
    description: 'Comprehensive study notes covering deep learning, neural networks, and ML algorithms',
    type: 'notes',
    price: 15,
    rating: 4.8,
    seller: {
      id: 101,
      name: 'DataScientist42',
      rating: 4.9
    },
    popularity: 342,
    thumbnail: '📝'
  },
  {
    id: 2,
    title: 'Quantum Physics Explained',
    description: 'Video course breaking down complex quantum concepts with visual examples',
    type: 'video',
    price: 35,
    rating: 4.7,
    seller: {
      id: 102,
      name: 'QuantumProf',
      rating: 4.8
    },
    popularity: 189,
    thumbnail: '🎬'
  },
  {
    id: 3,
    title: 'Organic Chemistry Essentials',
    description: 'Simplified guide to organic chemistry reactions and mechanisms',
    type: 'book',
    price: 25,
    rating: 4.6,
    seller: {
      id: 103,
      name: 'ChemistryWhiz',
      rating: 4.7
    },
    popularity: 275,
    thumbnail: '📚'
  },
  {
    id: 4,
    title: 'Calculus Made Easy',
    description: 'Step-by-step approach to mastering calculus with practice problems',
    type: 'course',
    price: 40,
    rating: 4.9,
    seller: {
      id: 104,
      name: 'MathGenius',
      rating: 5.0
    },
    popularity: 523,
    thumbnail: '🧮'
  },
  {
    id: 5,
    title: 'World History Timeline',
    description: 'Comprehensive timeline of major historical events with analysis',
    type: 'notes',
    price: 18,
    rating: 4.5,
    seller: {
      id: 105,
      name: 'HistoryBuff',
      rating: 4.6
    },
    popularity: 210,
    thumbnail: '🗿'
  },
];

const mockTutors: Tutor[] = [
  {
    id: 201,
    name: 'Dr. Sarah Johnson',
    expertise: ['Physics', 'Mathematics', 'Engineering'],
    rating: 4.9,
    hourlyRate: 45,
    availability: 'Evenings & Weekends',
    students: 87,
    thumbnail: '👩‍🏫'
  },
  {
    id: 202,
    name: 'Prof. Michael Chen',
    expertise: ['Computer Science', 'AI', 'Data Structures'],
    rating: 4.8,
    hourlyRate: 50,
    availability: 'Weekdays',
    students: 64,
    thumbnail: '👨‍💻'
  },
  {
    id: 203,
    name: 'Emma Rodriguez',
    expertise: ['Biology', 'Chemistry', 'Medicine'],
    rating: 4.7,
    hourlyRate: 40,
    availability: 'Flexible',
    students: 52,
    thumbnail: '🧬'
  },
  {
    id: 204,
    name: 'James Wilson',
    expertise: ['Literature', 'Writing', 'History'],
    rating: 4.6,
    hourlyRate: 35,
    availability: 'Afternoons',
    students: 41,
    thumbnail: '📝'
  },
];

// Market statistics mock data
const getMarketStats = (): MarketStats[] => [
  {
    title: 'Active Listings',
    value: 583,
    change: 12,
    icon: <BookOpen size={18} className="text-green-400" />
  },
  {
    title: 'Available Tutors',
    value: 124,
    change: 8,
    icon: <Users size={18} className="text-blue-400" />
  },
  {
    title: 'Average Sale',
    value: '$28.50',
    change: 5.2,
    icon: <DollarSign size={18} className="text-yellow-400" />
  },
  {
    title: 'Trading Volume',
    value: '$4,285',
    change: 15.7,
    icon: <BarChart2 size={18} className="text-purple-400" />
  },
];

export function Marketplace({ onExit, activeStation, activeSubFeature }: MarketplaceProps) {
  // State management
  const [currentScreen, setCurrentScreen] = useState<string>(activeStation || 'hub');
  const [currentSubFeature, setCurrentSubFeature] = useState<string | null>(activeSubFeature || null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { balance, sendTokens, isConnected } = useWallet(); // Added for Ink token payments
  const [cartItems, setCartItems] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<{ type: 'success' | 'error' | ''; message: string } | null>(null);

  const removeFromCart = (itemIndex: number) => {
    setCartItems(currentItems => currentItems.filter((_, index) => index !== itemIndex));
    // If the cart becomes empty after removing, clear any checkout status messages
    if (cartItems.length === 1) {
      setCheckoutStatus(null);
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0,
      transition: { when: "afterChildren" }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 }
  };

  // Navigation function
  const navigateTo = (screen: string, subFeature: string | null = null) => {
    setCurrentScreen(screen);
    setCurrentSubFeature(subFeature);
  };

  // Add resource to cart
  const addToCart = (resource: Resource) => {
    setCartItems([...cartItems, resource]);
  };

  // View resource details
  const viewResourceDetails = (resource: Resource) => {
    setSelectedResource(resource);
    navigateTo('resource-detail');
  };

  // View tutor details
  const viewTutorDetails = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    navigateTo('tutor-detail');
  };

  // Search function
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Render marketplace hub
  const renderMarketplaceHub = () => {
    return (
      <motion.div 
        className="w-full h-full p-6 overflow-y-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-yellow-400 mb-2 font-pixel">Knowledge Marketplace</h1>
            <p className="text-gray-400">Trade and exchange learning resources</p>
          </div>
          <div className="flex items-center">
            <button 
              onClick={onExit} // Keep this for main exit
              className="p-2 rounded-full bg-dark-800 hover:bg-dark-700 transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-400" />
            </button>
            <button 
              onClick={() => navigateTo('cart')}
              className="relative ml-4 p-2 rounded-full bg-dark-800 hover:bg-dark-700 transition-colors"
            >
              <ShoppingCart size={24} className="text-yellow-400" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Search for resources, tutors, or subjects..."
            className="w-full bg-dark-800 border border-gray-700 rounded-lg p-3 pl-10 text-gray-300 focus:outline-none focus:ring-1 focus:ring-yellow-400"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Search size={18} className="absolute left-3 top-3.5 text-gray-500" />
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {getMarketStats().map((stat) => (
            <motion.div 
              key={stat.title}
              variants={itemVariants}
              className="bg-dark-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-gray-400 text-sm">{stat.title}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <div className="flex items-center mt-1">
                  <span className={`text-xs ${stat.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.change > 0 ? '+' : ''}{stat.change}%
                  </span>
                </div>
              </div>
              <div className="rounded-full p-3 bg-dark-700">
                {stat.icon}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div 
            variants={itemVariants}
            className="bg-dark-800 border border-yellow-900/30 hover:border-yellow-500/50 rounded-lg p-6 cursor-pointer transition-all hover:translate-y-[-5px]"
            onClick={() => navigateTo('resource-exchange')}
          >
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-lg font-bold text-yellow-400 mb-2">Resource Exchange</h3>
            <p className="text-gray-400 text-sm mb-4">Trade study materials with others</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>30 active users</span>
              <span>583 listings</span>
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="bg-dark-800 border border-yellow-900/30 hover:border-yellow-500/50 rounded-lg p-6 cursor-pointer transition-all hover:translate-y-[-5px]"
            onClick={() => navigateTo('tutoring')}
          >
            <div className="text-4xl mb-4">👩‍🏫</div>
            <h3 className="text-lg font-bold text-yellow-400 mb-2">Tutoring Services</h3>
            <p className="text-gray-400 text-sm mb-4">Find or become a tutor</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>22 active users</span>
              <span>124 tutors</span>
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="bg-dark-800 border border-yellow-900/30 hover:border-yellow-500/50 rounded-lg p-6 cursor-pointer transition-all hover:translate-y-[-5px]"
            onClick={() => navigateTo('marketplace-stats')}
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-bold text-yellow-400 mb-2">Market Analytics</h3>
            <p className="text-gray-400 text-sm mb-4">View trading statistics</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>12 active users</span>
              <span>Real-time data</span>
            </div>
          </motion.div>
        </div>

        {/* Featured Resources */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Featured Resources</h2>
            <button 
              className="text-yellow-400 text-sm hover:underline"
              onClick={() => navigateTo('resource-exchange')}
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockResources.slice(0, 3).map((resource) => (
              <motion.div 
                key={resource.id}
                variants={itemVariants}
                className="bg-dark-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-yellow-500/50 transition-all"
                onClick={() => viewResourceDetails(resource)}
              >
                <div className="flex items-start mb-3">
                  <div className="text-3xl mr-3">{resource.thumbnail}</div>
                  <div>
                    <h3 className="font-medium text-white">{resource.title}</h3>
                    <p className="text-yellow-400 text-sm">${resource.price}</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{resource.description}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="text-yellow-400 mr-1">★</span>
                    {resource.rating}
                  </div>
                  <button 
                    className="px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded text-sm hover:bg-yellow-400/30 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(resource);
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Featured Tutors */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Top Tutors</h2>
            <button 
              className="text-yellow-400 text-sm hover:underline"
              onClick={() => navigateTo('tutoring')}
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockTutors.slice(0, 4).map((tutor) => (
              <motion.div 
                key={tutor.id}
                variants={itemVariants}
                className="bg-dark-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-yellow-500/50 transition-all flex flex-col items-center text-center"
                onClick={() => viewTutorDetails(tutor)}
              >
                <div className="text-4xl mb-2">{tutor.thumbnail}</div>
                <h3 className="font-medium text-white">{tutor.name}</h3>
                <p className="text-gray-400 text-sm mb-1">{tutor.expertise.join(', ')}</p>
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <span className="text-yellow-400 mr-1">★</span>
                  {tutor.rating} ({tutor.students} students)
                </div>
                <p className="text-yellow-400 font-medium">${tutor.hourlyRate}/hr</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  // Render resource exchange
  const renderResourceExchange = () => {
    // Resource exchange UI implementation
    return (
      <motion.div 
        className="w-full h-full p-6 overflow-y-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigateTo('hub')}
            className="p-2 rounded-full bg-dark-800 hover:bg-dark-700 transition-colors mr-4"
          >
            <ChevronLeft size={20} className="text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-yellow-400 mb-1 font-pixel">Resource Exchange</h1>
            <p className="text-gray-400 text-sm">Trade study materials with others</p>
          </div>
        </div>

        {/* Sub-features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <motion.div 
            variants={itemVariants}
            className={`bg-dark-800 border rounded-lg p-4 cursor-pointer transition-all
              ${currentSubFeature === 'buy-resources' ? 'border-yellow-400' : 'border-gray-700 hover:border-yellow-500/50'}`}
            onClick={() => navigateTo('resource-exchange', 'buy-resources')}
          >
            <div className="flex items-center">
              <div className="text-2xl mr-3">🛒</div>
              <div>
                <h3 className="font-medium text-white">Buy Resources</h3>
                <p className="text-gray-400 text-sm">Purchase learning materials</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className={`bg-dark-800 border rounded-lg p-4 cursor-pointer transition-all
              ${currentSubFeature === 'sell-resources' ? 'border-yellow-400' : 'border-gray-700 hover:border-yellow-500/50'}`}
            onClick={() => navigateTo('resource-exchange', 'sell-resources')}
          >
            <div className="flex items-center">
              <div className="text-2xl mr-3">💰</div>
              <div>
                <h3 className="font-medium text-white">Sell Resources</h3>
                <p className="text-gray-400 text-sm">Share your study materials</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Resource listing */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Available Resources</h2>
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search resources..."
                className="bg-dark-800 border border-gray-700 rounded-lg p-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-yellow-400 mr-2"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <button className="p-2 bg-yellow-400/20 text-yellow-400 rounded-lg hover:bg-yellow-400/30 transition-colors">
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {mockResources.map((resource) => (
              <motion.div 
                key={resource.id}
                variants={itemVariants}
                className="bg-dark-800 border border-gray-700 rounded-lg p-4 hover:border-yellow-500/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="text-3xl mr-3">{resource.thumbnail}</div>
                    <div>
                      <h3 className="font-medium text-white cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => viewResourceDetails(resource)}>
                        {resource.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-1">{resource.type.charAt(0).toUpperCase() + resource.type.slice(1)} • {resource.popularity} views</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>by {resource.seller.name}</span>
                        <span className="mx-2">•</span>
                        <span className="flex items-center">
                          <span className="text-yellow-400 mr-1">★</span>
                          {resource.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-400">${resource.price}</p>
                    <button 
                      className="mt-2 px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded text-sm hover:bg-yellow-400/30 transition-colors"
                      onClick={() => addToCart(resource)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-3">{resource.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  // Render tutoring services
  const renderTutoringServices = () => {
    return (
      <motion.div 
        className="w-full h-full p-6 overflow-y-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigateTo('hub')}
            className="p-2 rounded-full bg-dark-800 hover:bg-dark-700 transition-colors mr-4"
          >
            <ChevronLeft size={20} className="text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-yellow-400 mb-1 font-pixel">Tutoring Services</h1>
            <p className="text-gray-400 text-sm">Find or become a tutor</p>
          </div>
        </div>

        {/* Sub-features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <motion.div 
            variants={itemVariants}
            className={`bg-dark-800 border rounded-lg p-4 cursor-pointer transition-all
              ${currentSubFeature === 'find-tutor' ? 'border-yellow-400' : 'border-gray-700 hover:border-yellow-500/50'}`}
            onClick={() => navigateTo('tutoring', 'find-tutor')}
          >
            <div className="flex items-center">
              <div className="text-2xl mr-3">🔍</div>
              <div>
                <h3 className="font-medium text-white">Find Tutor</h3>
                <p className="text-gray-400 text-sm">Browse available tutors</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className={`bg-dark-800 border rounded-lg p-4 cursor-pointer transition-all
              ${currentSubFeature === 'become-tutor' ? 'border-yellow-400' : 'border-gray-700 hover:border-yellow-500/50'}`}
            onClick={() => navigateTo('tutoring', 'become-tutor')}
          >
            <div className="flex items-center">
              <div className="text-2xl mr-3">✨</div>
              <div>
                <h3 className="font-medium text-white">Become Tutor</h3>
                <p className="text-gray-400 text-sm">Start tutoring others</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Available tutors */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Available Tutors</h2>
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search tutors or subjects..."
                className="bg-dark-800 border border-gray-700 rounded-lg p-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {mockTutors.map((tutor) => (
              <motion.div 
                key={tutor.id}
                variants={itemVariants}
                className="bg-dark-800 border border-gray-700 rounded-lg p-4 hover:border-yellow-500/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="text-3xl mr-3">{tutor.thumbnail}</div>
                    <div>
                      <h3 className="font-medium text-white cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => viewTutorDetails(tutor)}>
                        {tutor.name}
                      </h3>
                      <p className="text-sm text-gray-400">{tutor.expertise.join(', ')}</p>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <span className="flex items-center">
                          <span className="text-yellow-400 mr-1">★</span>
                          {tutor.rating}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{tutor.students} students</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-400">${tutor.hourlyRate}/hr</p>
                    <p className="text-xs text-gray-400">{tutor.availability}</p>
                    <button 
                      className="mt-2 px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded text-sm hover:bg-yellow-400/30 transition-colors"
                      onClick={() => viewTutorDetails(tutor)}
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  // Render market analytics
  const renderMarketAnalytics = () => {
    return (
      <motion.div 
        className="w-full h-full p-6 overflow-y-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigateTo('hub')}
            className="p-2 rounded-full bg-dark-800 hover:bg-dark-700 transition-colors mr-4"
          >
            <ChevronLeft size={20} className="text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-yellow-400 mb-1 font-pixel">Market Analytics</h1>
            <p className="text-gray-400 text-sm">View trading statistics</p>
          </div>
        </div>

        {/* Market statistics cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {getMarketStats().map((stat) => (
            <motion.div 
              key={stat.title}
              variants={itemVariants}
              className="bg-dark-800 border border-gray-700 rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white">{stat.title}</h3>
                <div className="rounded-full p-2 bg-dark-700">
                  {stat.icon}
                </div>
              </div>
              <p className="text-3xl font-bold text-yellow-400 mb-2">{stat.value}</p>
              <div className="flex items-center">
                <span className={`text-sm ${stat.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </span>
                <span className="text-gray-500 text-sm ml-2">from last week</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Market trends section - placeholder for charts */}
        <div className="bg-dark-800 border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Market Trends</h2>
          <div className="h-64 flex items-center justify-center border border-gray-700 rounded bg-dark-900 p-4">
            <p className="text-gray-500">Interactive charts coming soon</p>
          </div>
        </div>

        {/* Popular categories */}
        <div className="bg-dark-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Computer Science', 'Mathematics', 'Physics', 'Biology', 'History', 'Languages', 'Chemistry', 'Engineering'].map((category) => (
              <motion.div 
                key={category}
                variants={itemVariants}
                className="bg-dark-900 border border-gray-700 rounded-lg p-3 text-center"
              >
                <p className="text-white">{category}</p>
                <p className="text-yellow-400 text-sm mt-1">{Math.floor(Math.random() * 100) + 50} items</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  // Render resource detail
  const renderResourceDetail = () => {
    if (!selectedResource) return null;
    
    return (
      <motion.div 
        className="w-full h-full p-6 overflow-y-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigateTo('resource-exchange')}
            className="p-2 rounded-full bg-dark-800 hover:bg-dark-700 transition-colors mr-4"
          >
            <ChevronLeft size={20} className="text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-yellow-400 mb-1 font-pixel">Resource Details</h1>
            <p className="text-gray-400 text-sm">View information about this learning resource</p>
          </div>
        </div>

        <div className="bg-dark-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-start mb-6">
            <div className="text-5xl mr-6">{selectedResource.thumbnail}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{selectedResource.title}</h2>
              <div className="flex items-center text-sm text-gray-400 mb-3">
                <span className="mr-3">{selectedResource.type.charAt(0).toUpperCase() + selectedResource.type.slice(1)}</span>
                <span className="mx-2">•</span>
                <span className="flex items-center">
                  <span className="text-yellow-400 mr-1">★</span>
                  {selectedResource.rating}
                </span>
                <span className="mx-2">•</span>
                <span>{selectedResource.popularity} views</span>
              </div>
              <p className="text-lg font-bold text-yellow-400 mb-4">${selectedResource.price}</p>
              <button 
                className="px-4 py-2 bg-yellow-400 text-dark-900 rounded-lg font-medium hover:bg-yellow-500 transition-colors mr-3"
                onClick={() => addToCart(selectedResource)}
              >
                Add to Cart
              </button>
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-white mb-3">Description</h3>
          <p className="text-gray-300 mb-6">{selectedResource.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-dark-900 border border-gray-700 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-1">Seller</h4>
              <p className="text-white">{selectedResource.seller.name}</p>
              <div className="flex items-center text-sm mt-1">
                <span className="text-yellow-400 mr-1">★</span>
                <span>{selectedResource.seller.rating}</span>
              </div>
            </div>
            
            <div className="bg-dark-900 border border-gray-700 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-1">Format</h4>
              <p className="text-white">{selectedResource.type.charAt(0).toUpperCase() + selectedResource.type.slice(1)}</p>
            </div>
            
            <div className="bg-dark-900 border border-gray-700 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-1">Popularity</h4>
              <p className="text-white">{selectedResource.popularity} views</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Similar Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockResources.filter(r => r.id !== selectedResource.id).slice(0, 3).map((resource) => (
              <motion.div 
                key={resource.id}
                variants={itemVariants}
                className="bg-dark-900 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-yellow-500/50 transition-all"
                onClick={() => viewResourceDetails(resource)}
              >
                <div className="flex items-start mb-3">
                  <div className="text-3xl mr-3">{resource.thumbnail}</div>
                  <div>
                    <h3 className="font-medium text-white">{resource.title}</h3>
                    <p className="text-yellow-400 text-sm">${resource.price}</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{resource.description}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="text-yellow-400 mr-1">★</span>
                    {resource.rating}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  // Render Cart Screen
  const renderCartScreen = () => {
    const totalItems = cartItems.length;
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

    const handleCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutStatus(null);
      if (!isConnected) {
        alert('Please connect your wallet first.');
        return;
      }
      if (totalPrice === 0) {
        alert('Your cart is empty.');
        return;
      }
      if (balance < totalPrice) {
        alert('Insufficient Ink balance.');
        return;
      }
      try {
        // Attempt to send tokens
        await sendTokens(totalPrice, MARKETPLACE_TREASURY_ADDRESS, `Marketplace purchase: ${cartItems.map(item => item.title).join(', ')}`);
        setCheckoutStatus({ type: 'success', message: `Successfully purchased items for ${totalPrice} INK!` });
        setTimeout(() => {
          setCartItems([]); // Clear cart on successful purchase
          navigateTo('hub'); // Optionally navigate to hub or a success page
          setCheckoutStatus(null); // Clear message after navigation
        }, 2000); // Delay for user to see message
      } catch (error: any) {
        console.error('Checkout error:', error);
        setCheckoutStatus({ type: 'error', message: error.message || 'An unexpected error occurred during checkout. Please try again.' });
      } finally {
        setIsCheckingOut(false);
      }
    };

    return (
      <motion.div
        className="w-full h-full p-6 overflow-y-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigateTo('hub')} // Or previous screen, e.g., resource-exchange
            className="p-2 rounded-full bg-dark-800 hover:bg-dark-700 transition-colors mr-4"
          >
            <ChevronLeft size={20} className="text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-yellow-400 mb-1 font-pixel">Shopping Cart</h1>
            <p className="text-gray-400 text-sm">Review your items before purchase</p>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
            <p>Your cart is empty.</p>
            <button 
              onClick={() => navigateTo('resource-exchange')}
              className="mt-4 px-4 py-2 bg-yellow-400 text-dark-900 rounded-lg font-medium hover:bg-yellow-500 transition-colors"
            >
              Browse Resources
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {cartItems.map((item, index) => (
                <motion.div 
                  key={`${item.id}-${index}`} // Ensure unique key if items can be duplicated
                  variants={itemVariants}
                  className="bg-dark-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">{item.thumbnail}</div>
                    <div>
                      <h3 className="font-medium text-white">{item.title}</h3>
                      <p className="text-sm text-gray-400">{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <p className="text-lg font-bold text-yellow-400 mr-4">${item.price}</p>
                    <button 
                      onClick={() => removeFromCart(index)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      aria-label="Remove item"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="bg-dark-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-bold text-white mb-4">Order Summary</h2>
              <div className="flex justify-between text-gray-300 mb-2">
                <span>Subtotal ({totalItems} item{totalItems === 1 ? '' : 's'})</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300 mb-2">
                <span>Transaction Fee</span>
                <span>$0.00</span> {/* Placeholder */}
              </div>
              <hr className="border-gray-700 my-3" />
              <div className="flex justify-between text-white font-bold text-xl mb-6">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)} INK</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={!isConnected || cartItems.length === 0 || balance < totalPrice || isCheckingOut}
                className="w-full px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isCheckingOut ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{ width: 20, height: 20, borderWidth: 2, borderStyle: 'solid', borderColor: 'white', borderTopColor: 'transparent'}}
                      className="rounded-full mr-2"
                    />
                    Processing...
                  </>
                ) : isConnected ? `Pay ${totalPrice.toFixed(2)} INK` : 'Connect Wallet to Pay'}
              </button>
              {!isConnected && <p className="text-xs text-red-400 text-center mt-2">Please connect your wallet to proceed.</p>}
              {isConnected && balance < totalPrice && cartItems.length > 0 && !isCheckingOut && <p className="text-xs text-red-400 text-center mt-2">Insufficient INK balance.</p>}
              {checkoutStatus && (
                <div className={`mt-4 p-3 rounded-md text-sm ${checkoutStatus.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                  {checkoutStatus.message}
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    );
  };

  // Render tutor detail
  const renderTutorDetail = () => {
    if (!selectedTutor) return null;
    
    return (
      <motion.div 
        className="w-full h-full p-6 overflow-y-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigateTo('tutoring')}
            className="p-2 rounded-full bg-dark-800 hover:bg-dark-700 transition-colors mr-4"
          >
            <ChevronLeft size={20} className="text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-yellow-400 mb-1 font-pixel">Tutor Profile</h1>
            <p className="text-gray-400 text-sm">Learn more about this tutor</p>
          </div>
        </div>

        <div className="bg-dark-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start mb-6">
            <div className="text-8xl mb-4 md:mb-0 md:mr-6">{selectedTutor.thumbnail}</div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-white mb-2">{selectedTutor.name}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                {selectedTutor.expertise.map(skill => (
                  <span key={skill} className="px-2 py-1 bg-dark-700 rounded-full text-xs text-yellow-400">{skill}</span>
                ))}
              </div>
              <div className="flex items-center justify-center md:justify-start text-sm text-gray-400 mb-4">
                <span className="flex items-center">
                  <span className="text-yellow-400 mr-1">★</span>
                  {selectedTutor.rating}
                </span>
                <span className="mx-2">•</span>
                <span>{selectedTutor.students} students</span>
                <span className="mx-2">•</span>
                <span>{selectedTutor.availability}</span>
              </div>
              <p className="text-lg font-bold text-yellow-400 mb-4">${selectedTutor.hourlyRate}/hr</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <button 
                  className="px-4 py-2 bg-yellow-400 text-dark-900 rounded-lg font-medium hover:bg-yellow-500 transition-colors"
                >
                  Book a Session
                </button>
                <button 
                  className="px-4 py-2 bg-dark-700 text-gray-300 rounded-lg font-medium hover:bg-dark-600 transition-colors"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-white mb-3">About</h3>
          <p className="text-gray-300 mb-6">
            {selectedTutor.name} is an experienced tutor specializing in {selectedTutor.expertise.join(', ')}. 
            With a proven track record of helping {selectedTutor.students} students master these subjects, 
            they provide personalized learning experiences tailored to each student's needs.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-dark-900 border border-gray-700 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-1">Teaching Style</h4>
              <p className="text-white">Interactive and example-based learning with hands-on exercises</p>
            </div>
            
            <div className="bg-dark-900 border border-gray-700 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-1">Experience</h4>
              <p className="text-white">{Math.floor(selectedTutor.students / 10) + 2} years of tutoring experience</p>
            </div>
            
            <div className="bg-dark-900 border border-gray-700 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-1">Languages</h4>
              <p className="text-white">English, Spanish</p>
            </div>
            
            <div className="bg-dark-900 border border-gray-700 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-1">Availability</h4>
              <p className="text-white">{selectedTutor.availability}</p>
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-white mb-3">Schedule</h3>
          <div className="bg-dark-900 border border-gray-700 rounded-lg p-4 mb-6">
            <p className="text-gray-400 text-center">Calendar scheduling coming soon</p>
          </div>
        </div>

        <div className="bg-dark-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Similar Tutors</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockTutors.filter(t => t.id !== selectedTutor.id).slice(0, 3).map((tutor) => (
              <motion.div 
                key={tutor.id}
                variants={itemVariants}
                className="bg-dark-900 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-yellow-500/50 transition-all flex flex-col items-center text-center"
                onClick={() => viewTutorDetails(tutor)}
              >
                <div className="text-4xl mb-2">{tutor.thumbnail}</div>
                <h3 className="font-medium text-white">{tutor.name}</h3>
                <p className="text-gray-400 text-sm mb-1">{tutor.expertise.join(', ')}</p>
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <span className="text-yellow-400 mr-1">★</span>
                  {tutor.rating} ({tutor.students} students)
                </div>
                <p className="text-yellow-400 font-medium">${tutor.hourlyRate}/hr</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  // Main render function
  return (
    <div className="w-full h-full bg-dark-900 text-white relative overflow-hidden">
      <AnimatePresence mode="wait">
        {currentScreen === 'hub' && renderMarketplaceHub()}
        {currentScreen === 'resource-exchange' && renderResourceExchange()}
        {currentScreen === 'tutoring' && renderTutoringServices()}
        {currentScreen === 'marketplace-stats' && renderMarketAnalytics()}
        {currentScreen === 'resource-detail' && renderResourceDetail()}
        {currentScreen === 'tutor-detail' && renderTutorDetail()}
        {currentScreen === 'cart' && renderCartScreen()}
      </AnimatePresence>
    </div>
  );
}
