import React, { useState, useEffect, useCallback } from 'react';
const KANA_API_BASE_URL = import.meta.env.VITE_KANA_API_BASE_URL || 'http://localhost:10000/api/kana';
const BACKEND_BASE_URL = import.meta.env.VITE_KANA_API_BASE_URL?.replace('/api/kana', '') || 'http://localhost:10000'; // For non-kana routes
import { motion } from 'framer-motion';
import { Book, FileText, Film, Gamepad, Archive, ArrowLeft, Search, Clock, UploadCloud, Link, X, Zap } from 'lucide-react';
import { TextbookViewer } from './TextbookViewer';
import { ResearchPapers } from './ResearchPapers';
import { VideoLectures } from './VideoLectures';
import { InteractiveSimulations } from './InteractiveSimulations';
import { ChainlinkQuizGenerator } from './ChainlinkQuizGenerator';

interface LibraryHubProps {
  onExit: () => void;
  initialMode?: string;
  featureId?: string;
  subFeatureId?: string;
}

type LibraryScreen = 'hub' | 'textbooks' | 'research-papers' | 'video-lectures' | 'simulations' | 'archives' | 'chainlink-quiz';

interface BackendStudyMaterial {
  id: string;
  originalFilename: string;
  storedFilename: string;
  filePath: string;
  mimetype: string;
  topic: string;
  uploadTimestamp: string;
  size: number;
}

interface CoreApiAuthor {
  name: string;
  // other author fields if available and needed
}

interface CoreSearchResultItem {
  id: string; // CORE API provides an ID
  title: string;
  authors: CoreApiAuthor[];
  abstract?: string; // Abstract might be long, consider snippet
  doi?: string;
  downloadUrl?: string; // Direct PDF link if available
  yearPublished?: number;
  publisher?: string;
  source?: string; // To indicate it's from CORE
  [key: string]: any; // Allow other properties from CORE API
}

interface LibraryItem {
  id: string;
  title: string;
  authors: CoreApiAuthor[]; // Changed from author: string
  category: string;
  coverImage: string; 
  description: string; // For local items, or abstract for external
  publishDate: string; // Formatted date or year
  rating: number;
  views: number;
  readTime: string;
  storedFilename: string | null; // Null for external items
  mimetype: string;
  originalFilename: string;
  // Fields for external items
  isExternal?: boolean;
  externalUrl?: string;
  doi?: string;
  abstract?: string;
  yearPublished?: number;
  publisher?: string;
  sourceApi?: string;
}

interface CategoryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  itemCount: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ title, description, icon, color, onClick, itemCount }) => (
  <motion.div
    className={`p-6 rounded-lg shadow-lg cursor-pointer bg-dark/60 hover:bg-dark/80 border border-primary/30 transform hover:scale-105 transition-all duration-300`}
    onClick={onClick}
    whileHover={{ y: -5 }}
  >
    <div className={`flex items-center justify-center w-16 h-16 rounded-full bg-${color}-500/20 text-${color}-400 mb-4`}>
      {icon}
    </div>
    <h3 className={`text-xl font-pixel text-${color}-400 mb-2`}>{title}</h3>
    <p className="text-gray-400 text-sm mb-3">{description}</p>
    <p className="text-xs text-gray-500">{itemCount} items</p>
  </motion.div>
);

export const LibraryHub: React.FC<LibraryHubProps> = ({
  onExit,
  initialMode = 'hub',
  featureId,
  subFeatureId
}) => {
  const [currentScreen, setCurrentScreen] = useState<LibraryScreen>('hub');
  const [searchQuery, setSearchQuery] = useState('');
  const [allLibraryItems, setAllLibraryItems] = useState<LibraryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<LibraryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [topic, setTopic] = useState<string>('');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // State for CORE API Search
  const [coreSearchQuery, setCoreSearchQuery] = useState<string>('');
  const [coreSearchResults, setCoreSearchResults] = useState<CoreSearchResultItem[]>([]);
  const [isCoreSearching, setIsCoreSearching] = useState<boolean>(false);
  const [coreSearchError, setCoreSearchError] = useState<string | null>(null);

  // State for Save External Item Modal
  const [itemToSave, setItemToSave] = useState<CoreSearchResultItem | null>(null);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [selectedSaveCategory, setSelectedSaveCategory] = useState<string>('Research Papers'); // Default category
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/study-materials/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAllLibraryItems(prevItems => prevItems.filter(item => item.id !== itemId));
        // Optionally, show a success message
        // alert('Item deleted successfully.');
      } else {
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || 'An unknown error occurred.';
          } else {
            // The response is not JSON, it might be HTML or plain text.
            const textError = await response.text();
            console.error('Received non-JSON error response:', textError); // Log the full HTML/text for debugging
            errorMessage = `The server returned an unexpected response. Please check the console for details.`;
          }
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        console.error('Failed to delete item:', errorMessage);
        alert(`Failed to delete item: ${errorMessage}`);
      }
    } catch (error) {
      console.error('An error occurred while deleting the item:', error);
      alert('An error occurred while deleting the item.');
    }
  };


  const transformBackendMaterialToLibraryItem = useCallback((material: BackendStudyMaterial & Partial<CoreSearchResultItem> & { isExternal?: boolean, externalUrl?: string, sourceApi?: string, topic?: string }): LibraryItem => {
    let category = 'Archives';
    const knownCategories = ['Textbooks', 'Research Papers', 'Video Lectures', 'Simulations', 'Archives'];
    if (knownCategories.includes(material.topic)) {
      category = material.topic;
    } else if (material.mimetype.startsWith('video/')) {
      category = 'Video Lectures';
    } else if (material.mimetype === 'application/pdf') {
      category = material.topic.toLowerCase().includes('book') || material.originalFilename.toLowerCase().includes('book') ? 'Textbooks' : 'Research Papers';
    } else if (material.mimetype === 'text/plain') {
      category = 'Textbooks'; 
    } else if (material.mimetype.startsWith('image/')){
      category = 'Archives'; // Or a new 'Images' category
    } else if (material.mimetype.startsWith('audio/')){
      category = 'Archives'; // Or a new 'Audio' category
    }

    let coverImage = '❓';
    if (category === 'Textbooks') coverImage = '📚';
    else if (category === 'Research Papers') coverImage = '📄';
    else if (category === 'Video Lectures') coverImage = '🎬';
    else if (category === 'Simulations') coverImage = '🎮';
    else if (category === 'Archives') coverImage = '🗄️';
    else if (material.mimetype.startsWith('image/')) coverImage = '🖼️';
    else if (material.mimetype.startsWith('audio/')) coverImage = '🎧';

    const isExternal = material.isExternal || material.mimetype === 'application/external-link';

    let itemTitle = material.originalFilename;
    if (isExternal && material.title) {
      itemTitle = material.title; // Use the actual title for external items
    }

    let itemAuthors: CoreApiAuthor[] = [];
    if (isExternal && material.authors && Array.isArray(material.authors)) {
      itemAuthors = material.authors;
    } else if (!isExternal && material.topic) { // Fallback for local items if 'topic' was used for author
      itemAuthors = [{ name: material.topic }];
    } else {
      itemAuthors = [{ name: 'N/A' }];
    }

    let itemDescription = 'Placeholder description - to be updated.';
    if (isExternal && material.abstract) {
      itemDescription = material.abstract;
    }

    let itemPublishDate = new Date(material.uploadTimestamp).toLocaleDateString();
    if (isExternal && material.yearPublished) {
      itemPublishDate = material.yearPublished.toString();
    }

    return {
      id: material.id,
      title: itemTitle,
      authors: itemAuthors,
      category,
      coverImage,
      description: itemDescription, // Will be abstract for external items
      publishDate: itemPublishDate,
      rating: 0, // Placeholder
      views: 0, // Placeholder
      readTime: 'N/A', // Placeholder
      storedFilename: isExternal ? null : material.storedFilename,
      mimetype: material.mimetype,
      originalFilename: material.originalFilename, // This is the pseudo-filename for external links
      // External specific fields
      isExternal: isExternal,
      externalUrl: material.externalUrl,
      doi: material.doi,
      abstract: material.abstract, // Storing raw abstract too
      yearPublished: material.yearPublished,
      publisher: material.publisher,
      sourceApi: material.sourceApi,
    };
  }, []);

  const getCategoryTitle = useCallback((screen: LibraryScreen): string => {
    switch (screen) {
      case 'textbooks': return 'Textbooks';
      case 'research-papers': return 'Research Papers';
      case 'video-lectures': return 'Video Lectures';
      case 'simulations': return 'Simulations';
      case 'archives': return 'Archives';
      default: return 'Library';
    }
  }, []);

  const fetchLibraryItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/study-materials`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: BackendStudyMaterial[] = await response.json();
      const transformedItems = data.map(transformBackendMaterialToLibraryItem);
      setAllLibraryItems(transformedItems);
      setFilteredItems(transformedItems);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch library items.');
      console.error("Fetch error:", err);
    }
    setIsLoading(false);
  }, [transformBackendMaterialToLibraryItem]);

  useEffect(() => {
    fetchLibraryItems();
  }, [fetchLibraryItems]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadMessage(null);
    }
  };

  const handleTopicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTopic(event.target.value);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage('Please select a file to upload.');
      return;
    }
    setIsUploading(true);
    setUploadMessage('Uploading... Please wait.');
    const formData = new FormData();
    formData.append('studyMaterial', selectedFile);
    formData.append('topic', topic || 'General');

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/upload-study-material`, {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        setUploadMessage(result.message || 'Upload successful!');
        setSelectedFile(null);
        setTopic('');
        fetchLibraryItems(); 
      } else {
        setUploadMessage(result.message || 'Upload failed. Please try again.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadMessage('An error occurred during upload. Check console for details.');
    }
    setIsUploading(false);
  };

  const handleCoreSearchQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCoreSearchQuery(event.target.value);
  };

  const handleExecuteCoreSearch = async () => {
    if (!coreSearchQuery.trim()) {
      setCoreSearchError('Please enter a search term.');
      setCoreSearchResults([]);
      return;
    }
    setIsCoreSearching(true);
    setCoreSearchError(null);
    setCoreSearchResults([]);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/core-search?q=${encodeURIComponent(coreSearchQuery)}`);
      const data = await response.json();
      if (response.ok) {
        // The backend now returns the array of results directly on success.
        const resultsWithSource = data.map((item: CoreSearchResultItem) => ({ ...item, source: 'CORE' }));
        setCoreSearchResults(resultsWithSource);
        if (resultsWithSource.length === 0) {
          setCoreSearchError('No results found for your query.');
        }
      } else {
        // On failure, the backend returns an object with a message property.
        throw new Error(data.message || 'Failed to fetch CORE search results.');
      }
    } catch (err: any) {
      setCoreSearchError(err.message || 'An error occurred while searching CORE.');
      console.error('CORE Search error:', err);
    }
    setIsCoreSearching(false);
  };

  const openSaveModal = (item: CoreSearchResultItem) => {
    setItemToSave(item);
    setSelectedSaveCategory(item.documentType === 'journal article' || item.documentType === 'conference proceedings' || item.documentType === 'report' ? 'Research Papers' : 'Archives'); // Basic default category logic
    setShowSaveModal(true);
    setSaveStatusMessage(null);
  };

  const closeSaveModal = () => {
    setShowSaveModal(false);
    setItemToSave(null);
    setSaveStatusMessage(null);
  };

  const handleSaveCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSaveCategory(event.target.value);
  };

  const confirmSaveItem = async () => {
    if (!itemToSave) return;
    setSaveStatusMessage('Saving...');

    const payload = {
      title: itemToSave.title,
      authors: itemToSave.authors,
      abstract: itemToSave.abstract,
      doi: itemToSave.doi,
      downloadUrl: itemToSave.downloadUrl,
      yearPublished: itemToSave.yearPublished,
      publisher: itemToSave.publisher,
      topic: selectedSaveCategory, // Use 'topic' for the category
    };

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/save-external-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message || 'Successfully saved paper to library!');
        fetchLibraryItems(); // Refresh library items
        setTimeout(() => closeSaveModal(), 1500);
      } else {
        throw new Error(result.message || 'Failed to save paper.');
      }
    } catch (error: any) {
      console.error('Failed to save external item:', error);
      setSaveStatusMessage(`Error: ${error.message || 'Could not save item.'}`);
    }
  };

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const currentCategoryTitle = getCategoryTitle(currentScreen);
    const newFilteredItems = allLibraryItems.filter(item => {
      const matchesCategory = currentScreen === 'hub' || item.category === currentCategoryTitle;
      const matchesSearch = 
        item.title.toLowerCase().includes(lowercasedQuery) || 
        item.description.toLowerCase().includes(lowercasedQuery) ||
        (item.authors && item.authors.some(a => a.name.toLowerCase().includes(lowercasedQuery)));
      return matchesCategory && matchesSearch;
    });
    setFilteredItems(newFilteredItems);
  }, [searchQuery, allLibraryItems, currentScreen, getCategoryTitle]);

  useEffect(() => {
    if (initialMode && initialMode !== 'hub' && featureId) {
      // Logic for initialMode, featureId, subFeatureId if needed for deep linking
    }
  }, [initialMode, featureId, subFeatureId, allLibraryItems]);

  const renderUploadSection = () => (
    <div className="my-8 p-6 bg-dark/50 border border-primary/20 rounded-lg shadow-md">
      <h3 className="text-xl font-pixel text-primary mb-4 flex items-center">
        <UploadCloud size={24} className="mr-2" /> Upload New Study Material
      </h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-1">
            Select File (PDF, TXT, Video, Audio, Image - Max 500MB)
          </label>
          <input 
            id="file-upload"
            type="file" 
            onChange={handleFileChange} 
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/80 file:text-white hover:file:bg-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label htmlFor="topic-input" className="block text-sm font-medium text-gray-300 mb-1">
            Topic (e.g., Textbooks, Research Papers, Video Lectures, Simulations, Archives, or custom)
          </label>
          <input 
            id="topic-input"
            type="text" 
            value={topic} 
            onChange={handleTopicChange} 
            placeholder="Enter topic or leave blank for auto-categorization..." 
            className="w-full px-3 py-2 bg-dark/70 border border-primary/30 rounded-md text-gray-200 focus:ring-accent focus:border-accent placeholder-gray-500"
          />
        </div>
        <button 
          onClick={handleUpload} 
          disabled={isUploading || !selectedFile}
          className="w-full px-4 py-2.5 bg-accent hover:bg-accent-dark text-white font-semibold rounded-md disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out flex items-center justify-center"
        >
          {isUploading ? (
            <>
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
              ></motion.div>
              Uploading...
            </>
          ) : 'Upload Material'}
        </button>
        {uploadMessage && (
          <p className={`mt-2 text-sm text-center ${uploadMessage.includes('failed') || uploadMessage.includes('error') ? 'text-red-400' : 'text-green-400'}`}>
            {uploadMessage}
          </p>
        )}
      </div>
    </div>
  );

  const renderCoreSearchResults = () => {
    if (isCoreSearching) {
      return <div className="text-center py-4 text-gray-400">Searching external resources...</div>;
    }
    if (coreSearchError) {
      return <div className="text-center py-4 text-red-400">Error: {coreSearchError}</div>;
    }
    // Show 'No results' only if a search was made (query exists and not currently searching)
    if (coreSearchResults.length === 0 && coreSearchQuery.trim() && !isCoreSearching) { 
      return <div className="text-center py-4 text-gray-500">No external results found.</div>;
    }
    if (coreSearchResults.length === 0) {
        return null; // Don't show anything if no search has been made yet or query is empty
    }

    return (
      <div className="mt-6 space-y-4">
        {coreSearchResults.map((item) => (
          <motion.div
            key={item.id || item.doi} 
            className="p-4 bg-dark/70 border border-accent/30 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h4 className="text-lg font-semibold text-accent mb-1">{item.title || 'No Title'}</h4>
            {item.authors && item.authors.length > 0 && (
              <p className="text-sm text-gray-400 mb-1">
                Authors: {item.authors.map(author => author.name || 'Unknown Author').join(', ')}
              </p>
            )}
            {item.yearPublished && <p className="text-xs text-gray-500 mb-1">Published: {item.yearPublished}</p>}
            {item.abstract && (
              <p className="text-sm text-gray-300 mb-2" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.abstract}
              </p>
            )}
            <div className="flex space-x-3 mt-2">
              {item.downloadUrl && (
                <a 
                  href={item.downloadUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                >
                  Download PDF
                </a>
              )}
              {item.doi && (
                <a 
                  href={`https://doi.org/${item.doi}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-green-400 hover:text-green-300 hover:underline"
                >
                  View on DOI.org
                </a>
              )}
               {!item.downloadUrl && !item.doi && item.journals?.[0]?.url && ( // Fallback to journal URL if available
                 <a 
                  href={item.journals[0].url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:text-purple-300 hover:underline"
                >
                  View Source
                </a>
              )}
              <button 
                onClick={() => openSaveModal(item)}
                className="ml-auto px-3 py-1.5 bg-primary/70 hover:bg-primary text-white text-xs font-semibold rounded-md transition-colors duration-150 ease-in-out"
              >
                Save to Library
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderCoreSearchSection = () => (
    <div className="my-10 p-6 bg-dark/50 border border-accent/20 rounded-lg shadow-md">
      <h3 className="text-xl font-pixel text-accent mb-4 flex items-center">
        <Search size={22} className="mr-2" /> Search External Academic Resources (CORE)
      </h3>
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <input 
          type="text" 
          value={coreSearchQuery} 
          onChange={handleCoreSearchQueryChange} 
          onKeyPress={(e) => e.key === 'Enter' && handleExecuteCoreSearch()}
          placeholder="Search research papers, articles..."
          className="flex-grow w-full px-4 py-2.5 bg-dark/70 border border-primary/30 rounded-md text-gray-200 focus:ring-accent focus:border-accent placeholder-gray-500"
        />
        <button 
          onClick={handleExecuteCoreSearch} 
          disabled={isCoreSearching || !coreSearchQuery.trim()}
          className="w-full sm:w-auto px-6 py-2.5 bg-accent hover:bg-accent-dark text-white font-semibold rounded-md disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out flex items-center justify-center"
        >
          {isCoreSearching ? (
            <>
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
              ></motion.div>
              Searching...
            </>
          ) : 'Search CORE'}
        </button>
      </div>
      {renderCoreSearchResults()}
    </div>
  );

  const renderLibraryHub = () => {    const categories = [
      { title: 'Textbooks', screen: 'textbooks', icon: <Book size={30} />, color: 'blue', description: 'Academic textbooks and guides' },
      { title: 'Research Papers', screen: 'research-papers', icon: <FileText size={30} />, color: 'green', description: 'Scholarly articles and papers' },
      { title: 'Video Lectures', screen: 'video-lectures', icon: <Film size={30} />, color: 'purple', description: 'Educational video content' },
      { title: 'Simulations', screen: 'simulations', icon: <Gamepad size={30} />, color: 'yellow', description: 'Interactive learning simulations' },
      { title: 'Archives', screen: 'archives', icon: <Archive size={30} />, color: 'gray', description: 'General documents and resources' },
      { title: 'AI Quiz Generator', screen: 'chainlink-quiz', icon: <Zap size={30} />, color: 'purple', description: 'Generate dynamic quizzes with Chainlink Functions' },
    ];

    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-pixel text-accent">Knowledge Library</h1>
          <button onClick={onExit} className="text-primary hover:underline">
            Back to Dashboard
          </button>
        </div>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-200 mb-2">Welcome to Your Learning Space</h2>
          <p className="text-gray-300">
            Explore our vast collection of learning materials and resources.
          </p>
        </div>

        {renderUploadSection()}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <CategoryCard
              key={cat.screen}
              title={cat.title}
              description={cat.description}
              icon={cat.icon}
              color={cat.color}
              onClick={() => { setCurrentScreen(cat.screen as LibraryScreen); setSearchQuery(''); }}
              itemCount={allLibraryItems.filter(item => item.category === cat.title).length}
            />
          ))}
        </div>

        {/* CORE Search Section */}
        {renderCoreSearchSection()}
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading && currentScreen === 'hub' && allLibraryItems.length === 0) {
      return <div className="text-center py-10 text-gray-400">Loading library...</div>;
    }
    if (error && currentScreen === 'hub' && allLibraryItems.length === 0) {
      return <div className="text-center py-10 text-red-400">Error: {error}</div>;
    }

    if (selectedItem) {
      // Prioritize specific viewers if they exist for the category
      switch (selectedItem.category) {
        case 'Textbooks':
          return <TextbookViewer item={selectedItem} onBack={() => setSelectedItem(null)} />;
        case 'Research Papers':
          return <ResearchPapers item={selectedItem} onBack={() => setSelectedItem(null)} />;
        case 'Video Lectures':
          return <VideoLectures item={selectedItem} onBack={() => setSelectedItem(null)} />;
        case 'Simulations':
          return <InteractiveSimulations item={selectedItem} onBack={() => setSelectedItem(null)} />;
        case 'Archives': // Fall through to generic viewer if no specific ArchiveExplorer or if it's simple
        default:
          // Generic viewer for any file type not specifically handled or as a fallback
          return (
            <div className="p-4 bg-dark/50 rounded-lg">
              <button onClick={() => setSelectedItem(null)} className="mb-4 text-primary hover:underline flex items-center">
                <ArrowLeft size={18} className="inline mr-1" /> Back to {getCategoryTitle(currentScreen)}
              </button>
              <h2 className="text-2xl font-pixel text-accent mb-2">{selectedItem.title}</h2>
              <p className="text-gray-300 mb-1">Category: {selectedItem.category}</p>
              <p className="text-gray-400 text-sm mb-1">Original Filename: {selectedItem.originalFilename}</p>
              <p className="text-gray-400 text-sm mb-1">MIME Type: {selectedItem.mimetype}</p>
              <p className="text-gray-400 text-sm mb-1">Published: {selectedItem.publishDate}</p>
              {selectedItem.authors && selectedItem.authors.length > 0 && (
                <p className="text-gray-400 text-sm mb-1">Authors: {selectedItem.authors.map(a => a.name).join(', ')}</p>
              )}
              {selectedItem.isExternal && selectedItem.publisher && (
                <p className="text-gray-400 text-sm mb-1">Publisher: {selectedItem.publisher}</p>
              )}
              {selectedItem.doi && (
                <p className="text-gray-400 text-sm mb-1">DOI: <a href={`https://doi.org/${selectedItem.doi}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{selectedItem.doi}</a></p>
              )}
              {selectedItem.isExternal && selectedItem.externalUrl && (
                <a 
                  href={selectedItem.externalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 my-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-md transition-colors duration-150 ease-in-out"
                >
                  <Link size={16} className="inline mr-2" /> View Source / Download
                </a>
              )}
              {selectedItem.isExternal && selectedItem.abstract && (
                <div className="mt-4 pt-4 border-t border-primary/20">
                  <h4 className="text-lg font-pixel text-primary mb-2">Abstract</h4>
                  <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{selectedItem.abstract}</p>
                </div>
              )}
              
              {!selectedItem.isExternal && selectedItem.mimetype.startsWith('image/') && (
                <img src={`${KANA_API_BASE_URL}/study_material_files/${selectedItem.storedFilename}`} alt={selectedItem.title} className="max-w-full h-auto rounded-md shadow-lg mb-4" />
              )}
              {selectedItem.mimetype.startsWith('video/') && (
                <video controls src={`${KANA_API_BASE_URL}/study_material_files/${selectedItem.storedFilename}`} className="max-w-full rounded-md shadow-lg mb-4">
                  Your browser does not support the video tag.
                </video>
              )}
              {selectedItem.mimetype.startsWith('audio/') && (
                <audio controls src={`${KANA_API_BASE_URL}/study_material_files/${selectedItem.storedFilename}`} className="w-full mb-4">
                  Your browser does not support the audio element.
                </audio>
              )}
              {(selectedItem.mimetype === 'application/pdf' || selectedItem.mimetype === 'text/plain') && (
                 <iframe 
                    src={`${KANA_API_BASE_URL}/study_material_files/${selectedItem.storedFilename}`}
                    className="w-full h-[600px] border border-primary/30 rounded-md mb-4"
                    title={selectedItem.title}
                  ></iframe>
              )}

              <a 
                href={`${KANA_API_BASE_URL}/study_material_files/${selectedItem.storedFilename}`}
                download={selectedItem.originalFilename}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block px-6 py-2.5 bg-accent hover:bg-accent-dark text-white font-semibold rounded-md transition-colors duration-150 ease-in-out"
              >
                Download File
              </a>
            </div>
          );
      }
    }    if (currentScreen === 'hub') {
      return renderLibraryHub();
    }

    if (currentScreen === 'chainlink-quiz') {
      return <ChainlinkQuizGenerator onBack={() => setCurrentScreen('hub')} />;
    }

    // Category view (listing items)
    return (
      <div className="p-1">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => { setCurrentScreen('hub'); setSelectedItem(null); }} className="text-primary hover:underline flex items-center">
            <ArrowLeft size={18} className="inline mr-1" /> Back to Hub
          </button>
          <h2 className="text-3xl font-pixel text-accent">{getCategoryTitle(currentScreen)}</h2>
          <div className="w-1/3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder={`Search in ${getCategoryTitle(currentScreen)}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-dark/50 border border-primary/30 rounded-md text-gray-200 focus:ring-accent focus:border-accent placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {isLoading && filteredItems.length === 0 && <div className="text-center py-10 text-gray-400">Loading items...</div>}
        {error && filteredItems.length === 0 && <div className="text-center py-10 text-red-400">Error: {error}</div>}
        {!isLoading && !error && filteredItems.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            No items found in {getCategoryTitle(currentScreen)} {searchQuery && `matching "${searchQuery}"`}.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <motion.div
              key={item.id}
              className="relative group bg-dark/60 p-4 rounded-lg shadow-md cursor-pointer border border-primary/20 hover:border-primary/50 transition-all duration-200 flex flex-col justify-between"
              onClick={() => setSelectedItem(item)}
              layoutId={`library-item-${item.id}`}
              whileHover={{ y: -4 }}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} 
                className="absolute top-2 right-2 p-1.5 bg-red-600/70 rounded-full text-white hover:bg-red-500 transition-all z-20 opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Delete item"
              >
                <X size={16} />
              </button>
              <div className="w-full h-32 bg-dark/60 rounded-md flex items-center justify-center text-5xl mb-3 text-gray-500">
                {item.coverImage || '❓'} 
              </div>
              <h3 className="font-pixel text-primary text-lg truncate mb-1" title={item.title}>{item.title}</h3>
              <p className="text-gray-400 text-xs truncate mb-1" title={item.authors && item.authors.length > 0 ? item.authors.map(a => a.name).join(', ') : 'N/A'}>Authors: {item.authors && item.authors.length > 0 ? item.authors.map(a => a.name).join(', ') : 'N/A'}</p> {/* Author field is used for Topic here */}
              <p className="text-gray-400 text-xs truncate mb-2">Category: {item.category}</p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span><Clock size={12} className="inline mr-1" />{item.publishDate}</span>
                {/* <span>{item.views} views</span> */}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const KANACategories = ['Textbooks', 'Research Papers', 'Video Lectures', 'Simulations', 'Archives']; // Define available categories

  return (
    <div className="p-6 bg-dark min-h-screen text-gray-100 font-sans">
      {renderContent()}

      {/* Save External Item Modal */}
      {showSaveModal && itemToSave && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-dark-light p-6 rounded-lg shadow-xl w-full max-w-md border border-primary/30"
          >
            <h3 className="text-xl font-pixel text-accent mb-1">Save to K.A.N.A. Library</h3>
            <p className="text-sm text-gray-300 mb-4 truncate">Item: {itemToSave.title}</p>
            <div className="mb-4">
              <label htmlFor="category-select" className="block text-sm font-medium text-gray-300 mb-1">Select Category:</label>
              <select 
                id="category-select" 
                value={selectedSaveCategory} 
                onChange={handleSaveCategoryChange}
                className="w-full px-3 py-2 bg-dark/70 border border-primary/30 rounded-md text-gray-200 focus:ring-accent focus:border-accent"
              >
                {KANACategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {saveStatusMessage && (
              <p className={`mb-3 text-sm text-center ${saveStatusMessage.startsWith('Error:') ? 'text-red-400' : 'text-green-400'}`}>
                {saveStatusMessage}
              </p>
            )}

            <div className="flex justify-end space-x-3">
              <button 
                onClick={closeSaveModal}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-dark/70 hover:bg-dark/90 rounded-md border border-primary/20 transition-colors"
                disabled={saveStatusMessage === 'Saving...'}
              >
                Cancel
              </button>
              <button 
                onClick={confirmSaveItem}
                className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-md transition-colors"
                disabled={saveStatusMessage === 'Saving...' || saveStatusMessage === 'Item saved successfully to your library!'}
              >
                {saveStatusMessage === 'Saving...' ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
