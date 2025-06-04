import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Users, BookOpen, X, ArrowRight, Edit3, FileText, Star, Share2 } from 'lucide-react';

// Define types for course creation workflow
type Lesson = {
  id: number;
  title: string;
  content: string;
  type: 'video' | 'text' | 'quiz';
};

type _Module = {
  id: number;
  title: string;
  description: string;
  lessons: Lesson[];
};

type Course = {
  id: number;
  title: string;
  description?: string;
  modules: number;
  published: boolean;
  thumbnail?: string;
  views?: number;
  status?: string;
  students?: number;
  rating?: number;
  category?: string;
  difficulty?: string;
};

type Creator = {
  id: number;
  name: string;
  specialty: string;
  followers: number;
};

type _Publication = {
  id: number;
  title: string;
  type: string;
  views: number;
  comments: number;
};

interface CreatorsGuildProps {
  onExit: () => void;
  activeStation: string | null;
  activeSubFeature: string | null;
}

export const CreatorsGuild: React.FC<CreatorsGuildProps> = ({
  onExit,
  activeStation,
  activeSubFeature
}) => {
  // State for navigation between different screens
  const [currentScreen, setCurrentScreen] = useState<string>(activeStation || 'hub');
  // Use activeSubFeature for initial state if provided
  const [_currentSubFeature, setCurrentSubFeature] = useState<string | null>(activeSubFeature);
  
  // State for course creation workflow
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courseModules, setCourseModules] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('content');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'technology',
    difficulty: 'beginner',
    isPublic: true,
    estimatedHours: 5
  });

  // Handle navigation between screens
  const navigateTo = (screen: string, subFeature: string | null = null) => {
    setCurrentScreen(screen);
    setCurrentSubFeature(subFeature);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
    exit: { y: -20, opacity: 0, transition: { duration: 0.2 } }
  };

  // Mock data for creators guild
  const mockCourses: Course[] = [
    {
      id: 1,
      title: 'Introduction to Blockchain',
      description: 'Learn the fundamentals of blockchain and cryptocurrency',
      modules: 5,
      published: true,
      views: 1245,
      category: 'technology',
      difficulty: 'intermediate'
    },
    {
      id: 2,
      title: 'Neural Networks Fundamentals',
      description: 'Master the basics of neural networks and deep learning',
      modules: 8,
      published: false,
      category: 'technology',
      difficulty: 'advanced'
    },
    {
      id: 3,
      title: 'Quantum Computing Basics',
      description: 'Explore the principles of quantum computing and its applications',
      modules: 6,
      published: true,
      views: 892,
      category: 'technology',
      difficulty: 'beginner'
    }
  ];

  const mockPublications = [
    {
      id: 1,
      title: 'The Future of AI in Education',
      type: 'article',
      views: 2458,
      comments: 47
    },
    {
      id: 2,
      title: 'Understanding Cryptography',
      type: 'tutorial',
      views: 1237,
      comments: 23
    },
    {
      id: 3,
      title: 'Data Structures Explained',
      type: 'course',
      views: 3754,
      comments: 128
    }
  ];

  // Top creators displayed in the hub screen
  const _mockCreators: Creator[] = [
    {
      id: 1,
      name: 'DataScientist42',
      specialty: 'Machine Learning',
      followers: 1245
    },
    {
      id: 2,
      name: 'CryptoEducator',
      specialty: 'Blockchain',
      followers: 876
    },
    {
      id: 3,
      name: 'CodeMaster',
      specialty: 'Programming',
      followers: 2356
    }
  ];

  // Render the hub screen
  const renderHub = () => (
    <motion.div 
      className="h-full w-full p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-purple-300 mb-2">Creators Guild</h2>
        <p className="text-gray-400">Create, publish, and share your knowledge with the world</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          className="bg-dark-800 border border-purple-500/30 rounded-lg p-5 hover:border-purple-500/70 transition-all cursor-pointer"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          onClick={() => navigateTo('course-creator')}
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
              <BookOpen size={20} className="text-purple-400" />
            </div>
            <h3 className="font-semibold text-lg text-white">Course Creator</h3>
          </div>
          <p className="text-gray-400 mb-4">Build and publish your own interactive courses</p>
          <div className="flex justify-between items-center text-sm">
            <span className="text-purple-300">{mockCourses.length} courses</span>
            <ArrowRight size={16} className="text-purple-400" />
          </div>
        </motion.div>

        <motion.div 
          className="bg-dark-800 border border-purple-500/30 rounded-lg p-5 hover:border-purple-500/70 transition-all cursor-pointer"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          onClick={() => navigateTo('publishing')}
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
              <FileText size={20} className="text-purple-400" />
            </div>
            <h3 className="font-semibold text-lg text-white">Publishing Center</h3>
          </div>
          <p className="text-gray-400 mb-4">Manage and monitor your published content</p>
          <div className="flex justify-between items-center text-sm">
            <span className="text-purple-300">{mockPublications.length} publications</span>
            <ArrowRight size={16} className="text-purple-400" />
          </div>
        </motion.div>

        <motion.div 
          className="bg-dark-800 border border-gray-700 rounded-lg p-5 opacity-50 cursor-not-allowed"
          variants={itemVariants}
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-3">
              <Users size={20} className="text-gray-400" />
            </div>
            <h3 className="font-semibold text-lg text-white">Community Hub</h3>
          </div>
          <p className="text-gray-400 mb-4">Connect with other creators (Coming Soon)</p>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Locked</span>
            <div className="bg-gray-800 px-2 py-1 rounded text-xs">UPCOMING</div>
          </div>
        </motion.div>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="bg-dark-800 border border-purple-500/20 rounded-lg p-4">
          <div className="space-y-4">
            <div className="flex items-center text-sm">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mr-3">
                <Star size={14} className="text-green-400" />
              </div>
              <span className="text-gray-300">Your course "Introduction to Blockchain" received a 5-star rating</span>
              <span className="ml-auto text-gray-500 text-xs">2h ago</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                <Users size={14} className="text-blue-400" />
              </div>
              <span className="text-gray-300">15 new students enrolled in your courses today</span>
              <span className="ml-auto text-gray-500 text-xs">8h ago</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mr-3">
                <Edit3 size={14} className="text-yellow-400" />
              </div>
              <span className="text-gray-300">Your draft "Neural Networks Fundamentals" was saved</span>
              <span className="ml-auto text-gray-500 text-xs">1d ago</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button 
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 transition-colors rounded-md text-white"
          onClick={onExit}
        >
          Exit to Town Square
        </button>
      </div>
    </motion.div>
  );

  // Render the course creator screen
  const renderCourseCreator = () => (
    <motion.div 
      className="h-full w-full p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="flex items-center mb-6">
        <button 
          className="mr-4 p-2 hover:bg-dark-700 rounded-full transition-colors"
          onClick={() => navigateTo('hub')}
        >
          <ArrowLeft size={20} className="text-purple-300" />
        </button>
        <h2 className="text-2xl font-bold text-purple-300">Course Creator</h2>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Your Courses</h3>
          <button className="flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 transition-colors rounded-md text-white text-sm">
            <Plus size={16} className="mr-1" />
            New Course
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {mockCourses.map(course => (
            <motion.div 
              key={course.id}
              className="bg-dark-800 border border-gray-700 rounded-lg p-4 flex flex-col"
              variants={itemVariants}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-white">{course.title}</h3>
                <div className={`px-2 py-1 rounded text-xs ${
                  course.published ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {course.published ? 'Published' : 'Draft'}
                </div>
              </div>

              <div className="mt-auto pt-4 flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-400">
                  <Users size={14} className="mr-1" />
                  <span>{course.students || 0}</span>
                  <Star size={14} className="ml-3 mr-1" />
                  <span>{course.rating || 0}</span>
                </div>
                <button 
                  onClick={() => {
                    // Set the editing course and navigate to editor
                    setEditingCourse(course);
                    setFormData({
                      title: course.title,
                      description: course.description || '',
                      category: course.category || 'technology',
                      difficulty: course.difficulty || 'beginner',
                      isPublic: course.published,
                      estimatedHours: 5
                    });
                    // Navigate to course editor
                    navigateTo('course-editor');
                  }}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 transition-colors rounded text-white text-sm"
                >
                  Edit
                </button>
              </div>
            </motion.div>
          ))}

          <motion.div 
            className="border border-dashed border-purple-500/30 rounded-lg p-6 hover:border-purple-500/70 transition-all cursor-pointer flex flex-col items-center justify-center text-center"
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            onClick={() => {
              // Reset form and navigate to course editor
              setEditingCourse(null);
              setFormData({
                title: '',
                description: '',
                category: 'technology',
                difficulty: 'beginner',
                isPublic: true,
                estimatedHours: 5
              });
              setCourseModules([]);
              navigateTo('course-editor');
            }}
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
              <Plus size={24} className="text-purple-400" />
            </div>
            <h4 className="font-medium text-white mb-1">Create New Course</h4>
            <p className="text-gray-400 text-sm">Start building your next knowledge masterpiece</p>
          </motion.div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Course Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div 
            className="bg-dark-800 border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/70 transition-all cursor-pointer"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
          >
            <h4 className="font-medium text-white mb-2">Interactive Tutorial</h4>
            <p className="text-gray-400 text-sm mb-3">Step-by-step guide with interactive elements</p>
            <div className="text-xs text-purple-300">Best for practical skills</div>
          </motion.div>
          <motion.div 
            className="bg-dark-800 border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/70 transition-all cursor-pointer"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
          >
            <h4 className="font-medium text-white mb-2">Academic Course</h4>
            <p className="text-gray-400 text-sm mb-3">In-depth modules with assessments and resources</p>
            <div className="text-xs text-purple-300">Best for comprehensive learning</div>
          </motion.div>
          <motion.div 
            className="bg-dark-800 border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/70 transition-all cursor-pointer"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
          >
            <h4 className="font-medium text-white mb-2">Quick Guide</h4>
            <p className="text-gray-400 text-sm mb-3">Concise content focused on key concepts</p>
            <div className="text-xs text-purple-300">Best for reference materials</div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

  // Render the publishing center screen
  const renderPublishingCenter = () => (
    <motion.div 
      className="h-full w-full p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="flex items-center mb-6">
        <button 
          className="mr-4 p-2 hover:bg-dark-700 rounded-full transition-colors"
          onClick={() => navigateTo('hub')}
        >
          <ArrowLeft size={20} className="text-purple-300" />
        </button>
        <h2 className="text-2xl font-bold text-purple-300">Publishing Center</h2>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Your Publications</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1.5 bg-dark-700 hover:bg-dark-600 transition-colors rounded-md text-gray-300 text-sm">
              Filter
            </button>
            <button className="flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 transition-colors rounded-md text-white text-sm">
              <Plus size={16} className="mr-1" />
              New Publication
            </button>
          </div>
        </div>

        <div className="bg-dark-800 border border-purple-500/20 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-900">
              <tr>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Title</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Type</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Views</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Comments</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockPublications.map((pub, index) => (
                <motion.tr 
                  key={pub.id} 
                  className={`border-t border-dark-700 hover:bg-dark-700 cursor-pointer transition-colors ${index % 2 === 0 ? 'bg-dark-800' : 'bg-dark-850'}`}
                  variants={itemVariants}
                >
                  <td className="py-3 px-4 text-white">{pub.title}</td>
                  <td className="py-3 px-4">
                    <div className={`px-2 py-0.5 inline-block rounded text-xs ${pub.type === 'article' ? 'bg-blue-500/20 text-blue-400' : pub.type === 'tutorial' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                      {pub.type.toUpperCase()}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{pub.views.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-300">{pub.comments}</td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="p-1.5 hover:bg-dark-600 rounded transition-colors">
                        <Edit3 size={16} className="text-purple-300" />
                      </button>
                      <button className="p-1.5 hover:bg-dark-600 rounded transition-colors">
                        <Share2 size={16} className="text-green-400" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Analytics Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div 
            className="bg-dark-800 border border-purple-500/30 rounded-lg p-4"
            variants={itemVariants}
          >
            <h4 className="font-medium text-gray-400 mb-1 text-sm">Total Views</h4>
            <div className="text-2xl font-bold text-white">7,449</div>
            <div className="text-xs text-green-400 mt-1">+12% from last month</div>
          </motion.div>
          <motion.div 
            className="bg-dark-800 border border-purple-500/30 rounded-lg p-4"
            variants={itemVariants}
          >
            <h4 className="font-medium text-gray-400 mb-1 text-sm">Engagement Rate</h4>
            <div className="text-2xl font-bold text-white">32%</div>
            <div className="text-xs text-green-400 mt-1">+5% from last month</div>
          </motion.div>
          <motion.div 
            className="bg-dark-800 border border-purple-500/30 rounded-lg p-4"
            variants={itemVariants}
          >
            <h4 className="font-medium text-gray-400 mb-1 text-sm">Revenue</h4>
            <div className="text-2xl font-bold text-white">2,180 INK</div>
            <div className="text-xs text-green-400 mt-1">+24% from last month</div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

  // Course editor screen
  const renderCourseEditor = () => (
    <motion.div 
      className="h-full w-full p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="flex items-center mb-6">
        <button 
          className="mr-4 p-2 hover:bg-dark-700 rounded-full transition-colors"
          onClick={() => navigateTo('course-creator')}
        >
          <ArrowLeft size={20} className="text-purple-300" />
        </button>
        <h2 className="text-2xl font-bold text-purple-300">
          {editingCourse ? `Edit: ${editingCourse.title}` : 'Create New Course'}
        </h2>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-700 mb-6">
        <nav className="flex space-x-4" aria-label="Tabs">
          {['content', 'settings', 'quizzes', 'preview'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 text-sm font-medium ${
                activeTab === tab 
                  ? 'border-purple-500 text-purple-400' 
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Course Title & Description */}
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                Course Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="mt-1 block w-full bg-dark-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g. Introduction to Machine Learning"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                className="mt-1 block w-full bg-dark-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Describe your course and what students will learn..."
              />
            </div>
          </div>

          {/* Modules Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Course Modules</h3>
              <button 
                className="flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 transition-colors rounded-md text-white text-sm"
                onClick={() => {
                  setCourseModules([...courseModules, {
                    id: Date.now(),
                    title: `Module ${courseModules.length + 1}`,
                    description: '',
                    lessons: []
                  }]);
                }}
              >
                <Plus size={16} className="mr-1" />
                Add Module
              </button>
            </div>

            <div className="space-y-4">
              {courseModules.length === 0 ? (
                <div className="bg-dark-800 border border-dashed border-gray-700 rounded-lg p-8 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                    <Plus size={24} className="text-purple-400" />
                  </div>
                  <h3 className="text-sm font-medium text-white mb-1">No modules yet</h3>
                  <p className="text-xs text-gray-400 mb-3">Start by adding your first course module</p>
                  <button 
                    className="inline-flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 transition-colors rounded-md text-white text-xs"
                    onClick={() => {
                      setCourseModules([...courseModules, {
                        id: Date.now(),
                        title: 'Module 1',
                        description: '',
                        lessons: []
                      }]);
                    }}
                  >
                    <Plus size={14} className="mr-1" />
                    Create First Module
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {courseModules.map((module, index) => (
                    <motion.div
                      key={module.id}
                      className="bg-dark-800 border border-gray-700 rounded-lg overflow-hidden"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <div className="p-4 bg-dark-850 border-b border-gray-700 flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="mr-3 bg-purple-900 text-purple-300 w-8 h-8 rounded-full flex items-center justify-center font-semibold">
                            {index + 1}
                          </div>
                          <input
                            type="text"
                            value={module.title}
                            onChange={(e) => {
                              const newModules = [...courseModules];
                              newModules[index].title = e.target.value;
                              setCourseModules(newModules);
                            }}
                            className="bg-transparent border-none text-white focus:outline-none focus:ring-0 font-medium"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-1 hover:bg-dark-700 rounded transition-colors" onClick={() => {
                            const newModules = [...courseModules];
                            newModules.splice(index, 1);
                            setCourseModules(newModules);
                          }}>
                            <X size={16} className="text-gray-400 hover:text-red-400" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Module Description
                          </label>
                          <textarea
                            value={module.description}
                            onChange={(e) => {
                              const newModules = [...courseModules];
                              newModules[index].description = e.target.value;
                              setCourseModules(newModules);
                            }}
                            rows={2}
                            className="w-full bg-dark-700 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white text-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                            placeholder="Brief description of this module..."
                          />
                        </div>
                        
                        {/* Lessons */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="block text-xs font-medium text-gray-400">
                              Lessons
                            </label>
                            <button 
                              className="flex items-center px-2 py-1 bg-dark-700 hover:bg-dark-600 transition-colors rounded text-gray-300 text-xs"
                              onClick={() => {
                                const newModules = [...courseModules];
                                if (!newModules[index].lessons) {
                                  newModules[index].lessons = [];
                                }
                                newModules[index].lessons.push({
                                  id: Date.now(),
                                  title: `Lesson ${(newModules[index].lessons.length || 0) + 1}`,
                                  content: '',
                                  type: 'video'
                                });
                                setCourseModules(newModules);
                              }}
                            >
                              <Plus size={12} className="mr-1" />
                              Add Lesson
                            </button>
                          </div>
                          
                          {!module.lessons || module.lessons.length === 0 ? (
                            <div className="text-xs text-gray-500 italic">No lessons added yet</div>
                          ) : (
                            <div className="space-y-2">
                              {module.lessons.map((lesson: Lesson, lessonIndex: number) => (
                                <div 
                                  key={lesson.id} 
                                  className="flex items-center justify-between bg-dark-700 p-2 rounded text-sm"
                                >
                                  <div className="flex items-center">
                                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center mr-2 text-xs text-purple-300">
                                      {lessonIndex + 1}
                                    </div>
                                    <input
                                      type="text"
                                      value={lesson.title}
                                      onChange={(e) => {
                                        const newModules = [...courseModules];
                                        newModules[index].lessons[lessonIndex].title = e.target.value;
                                        setCourseModules(newModules);
                                      }}
                                      className="bg-transparent border-none text-white text-xs focus:outline-none focus:ring-0"
                                    />
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <select
                                      value={lesson.type}
                                      onChange={(e) => {
                                        const newModules = [...courseModules];
                                        newModules[index].lessons[lessonIndex].type = e.target.value as 'video' | 'text' | 'quiz';
                                        setCourseModules(newModules);
                                      }}
                                      className="bg-dark-800 border border-gray-700 rounded text-xs p-1 text-gray-300"
                                    >
                                      <option value="video">Video</option>
                                      <option value="text">Article</option>
                                      <option value="quiz">Quiz</option>
                                    </select>
                                    <button 
                                      className="p-1 hover:bg-dark-600 rounded transition-colors"
                                      onClick={() => {
                                        const newModules = [...courseModules];
                                        newModules[index].lessons.splice(lessonIndex, 1);
                                        setCourseModules(newModules);
                                      }}
                                    >
                                      <X size={12} className="text-gray-400 hover:text-red-400" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="block w-full bg-dark-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="technology">Technology</option>
                <option value="science">Science</option>
                <option value="math">Mathematics</option>
                <option value="business">Business</option>
                <option value="arts">Arts & Humanities</option>
                <option value="language">Language</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300 mb-1">
                Difficulty Level
              </label>
              <select
                id="difficulty"
                value={formData.difficulty}
                onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                className="block w-full bg-dark-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-300 mb-1">
                Estimated Hours to Complete
              </label>
              <input
                type="number"
                id="estimatedHours"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({...formData, estimatedHours: parseInt(e.target.value) || 0})}
                className="block w-full bg-dark-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                min="1"
                max="100"
              />
            </div>
            
            <div className="flex items-center h-full pt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-700 rounded bg-dark-700"
                />
                <span className="ml-2 text-sm text-gray-300">Make course publicly available</span>
              </label>
            </div>
          </div>
          
          <div className="bg-dark-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-2">Course Thumbnail</h3>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
                <Plus size={24} className="text-purple-400" />
              </div>
              <p className="text-sm text-gray-400 mb-2">Drag and drop an image here, or click to select</p>
              <p className="text-xs text-gray-500">Recommended size: 1280 x 720px (16:9 ratio)</p>
              <button className="mt-4 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 transition-colors rounded-md text-gray-300 text-sm">
                Select Image
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Quizzes Tab */}
      {activeTab === 'quizzes' && (
        <div>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Plus size={24} className="text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Create Course Quizzes</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
              Add quizzes to test knowledge and reinforce learning. You can create different types of questions.
            </p>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 transition-colors rounded-md text-white text-sm">
              Create New Quiz
            </button>
          </div>
        </div>
      )}
      
      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="bg-dark-800 border border-gray-700 rounded-lg overflow-hidden">
            <div className="aspect-video bg-dark-950 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                  <Plus size={24} className="text-purple-400" />
                </div>
                <p className="text-gray-400">Course thumbnail preview</p>
              </div>
            </div>
            
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-2">
                {formData.title || 'Your Course Title'}
              </h2>
              <p className="text-gray-400 mb-4">
                {formData.description || 'Your course description will appear here. Make it compelling to attract students!'}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <div className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                  {formData.category.charAt(0).toUpperCase() + formData.category.slice(1)}
                </div>
                <div className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                  {formData.difficulty.charAt(0).toUpperCase() + formData.difficulty.slice(1)}
                </div>
                <div className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                  {formData.estimatedHours} hours
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-md font-medium text-white mb-3">Course Content</h3>
                
                {courseModules.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">No content added yet</p>
                ) : (
                  <div className="space-y-4">
                    {courseModules.map((module, index) => (
                      <div key={module.id} className="bg-dark-750 border border-gray-700 rounded-lg overflow-hidden">
                        <div className="p-3 bg-dark-850 border-b border-gray-700">
                          <h4 className="font-medium text-white">
                            Module {index + 1}: {module.title}
                          </h4>
                        </div>
                        
                        {!module.lessons || module.lessons.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500">No lessons in this module</div>
                        ) : (
                          <div className="divide-y divide-gray-800">
                            {module.lessons.map((lesson: Lesson, lessonIndex: number) => (
                              <div key={lesson.id} className="p-3 flex items-center text-sm">
                                <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center mr-3 text-xs text-purple-300">
                                  {lessonIndex + 1}
                                </div>
                                <span className="text-gray-300">{lesson.title}</span>
                                <div className="ml-auto flex items-center">
                                  <div className="px-2 py-0.5 rounded text-xs bg-dark-700 text-gray-400">
                                    {lesson.type === 'video' ? 'Video' : lesson.type === 'quiz' ? 'Quiz' : 'Article'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Save/Publish Actions */}
      <div className="mt-8 border-t border-gray-700 pt-6 flex justify-between items-center">
        <button 
          className="px-4 py-2 bg-dark-700 hover:bg-dark-600 transition-colors rounded-md text-gray-300"
          onClick={() => navigateTo('course-creator')}
        >
          Cancel
        </button>
        
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 border border-purple-500 text-purple-400 hover:bg-purple-500/10 transition-colors rounded-md">
            Save Draft
          </button>
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 transition-colors rounded-md text-white">
            {editingCourse ? 'Update Course' : 'Publish Course'}
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Main render method - choose which screen to render based on currentScreen
  return (
    <div className="h-full w-full bg-dark-900 text-white overflow-y-auto">
      <AnimatePresence mode="wait">
        {currentScreen === 'hub' && renderHub()}
        {currentScreen === 'course-creator' && renderCourseCreator()}
        {currentScreen === 'publishing' && renderPublishingCenter()}
        {currentScreen === 'course-editor' && renderCourseEditor()}
      </AnimatePresence>
    </div>
  );
};
