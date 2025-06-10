import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  FileText, FileArchive, FileImage, FileVideo, FileAudio,
  Search, X, Upload, File as FileIcon, 
  Loader2, CheckSquare, Folder
} from 'lucide-react';
import type { LibraryItem, CoreSearchResultItem } from '../lib/types';

// Define the component props
export interface StudyMaterialsPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelectMaterial?: (material: LibraryItem) => void;
}

// File type options for filtering
const fileTypeOptions = [
  { value: 'all', label: 'All File Types' },
  { value: 'pdf', label: 'PDF' },
  { value: 'document', label: 'Document' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
] as const;

// File icons mapping
const fileIcons: Record<string, React.ReactNode> = {
  'pdf': <FileText className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />,
  'doc': <FileText className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />,
  'docx': <FileText className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />,
  'txt': <FileText className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />,
  'zip': <FileArchive className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />,
  'mp4': <FileVideo className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />,
  'mp3': <FileAudio className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />,
  'jpg': <FileImage className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0" />,
  'jpeg': <FileImage className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0" />,
  'png': <FileImage className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />,
};

// Helper function to get file icon based on file extension
const getFileIcon = (filename: string): React.ReactNode => {
  const extension = filename.split('.').pop()?.toLowerCase() || 'file';
  return fileIcons[extension] || <FileText className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />;
};

const StudyMaterialsPanel: React.FC<StudyMaterialsPanelProps> = ({
  isOpen = false,
  onClose = () => {},
  onSelectMaterial = () => {}
}) => {
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI State
  const [searchMode, setSearchMode] = useState<'library' | 'coreApi'>('library');
  
  // Upload State
  const [selectedFileForUpload, setSelectedFileForUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [, setUploadSuccessMessage] = useState('');
  const [, setUploadError] = useState('');
  
  // Library State
  const [, setIsLoading] = useState(false);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  
  // Filter & Sort State
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // CORE API State
  const [coreSearchQuery, setCoreSearchQuery] = useState('');
  const [isCoreSearching, setIsCoreSearching] = useState(false);
  const [, setCoreSearchError] = useState('');
  
  // API base URL from environment variables
  const KANA_API_BASE_URL = import.meta.env.VITE_KANA_API_BASE_URL || '';
  
  // Drag and drop state
  // Drag state is managed directly in the JSX

  // Filtered materials based on search
  const filteredMaterials = useMemo(() => {
    return libraryItems.filter(item => {
      const matchesSearch = searchTerm === '' || 
        (item.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesFolder = selectedFolder === 'All' || item.category === selectedFolder;
      
      return matchesSearch && matchesFolder;
    }).sort((a, b) => {
      // Use uploadDate if available, otherwise use current date
      const dateA = new Date(a.uploadDate || new Date());
      const dateB = new Date(b.uploadDate || new Date());
      
      // Sort by newest first by default
      return dateB.getTime() - dateA.getTime();
    });
  }, [libraryItems, searchTerm, selectedFolder]);

  const fetchLibraryItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${KANA_API_BASE_URL}/api/study-materials`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch library items: ${response.statusText}`);
      }
      
      const data: LibraryItem[] = await response.json();
      
      // Process items to add fileType if not present
      const processedItems = data.map(item => ({
        ...item,
        fileType: item.fileType || getFileTypeFromMime(item.mimetype || '')
      }));
      
      setLibraryItems(processedItems);
    } catch (err) {
      console.error("Error fetching library items:", err);
      setUploadError('Failed to load library items. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [KANA_API_BASE_URL]);

  const getFileTypeFromMime = (mimeType: string): string => {
    if (!mimeType) return 'other';
    
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('video')) return 'video';
    if (mimeType.includes('audio')) return 'audio';
    return 'other';
  };

  useEffect(() => {
    if (isOpen) {
      fetchLibraryItems();
    }
  }, [isOpen]);

  // Upload button click is now handled directly in the onClick handler

  const handleFileSelectedForUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileForUpload(file);
      setUploadError('');
      setUploadSuccessMessage('');
      // Auto-start upload when file is selected
      handlePerformUpload();
    }
  };

  const handlePerformUpload = async () => {
    if (!selectedFileForUpload) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFileForUpload);
      
      const response = await fetch(`${KANA_API_BASE_URL}/api/upload-study-material`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      // We don't need the response data, just check if it was successful
      await response.json();
      
      // Refresh the library items
      await fetchLibraryItems();
      
      setUploadSuccessMessage('File uploaded successfully!');
      setSelectedFileForUpload(null);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const [coreSearchResults, setCoreSearchResults] = useState<CoreSearchResultItem[]>([]);
  const [, setIsSavingCorePaper] = useState(false);

  const handleCoreApiSearch = async () => {
    if (!coreSearchQuery.trim()) return;
    
    setIsCoreSearching(true);
    setCoreSearchError('');
    
    try {
      const response = await fetch(
        `${KANA_API_BASE_URL}/api/core-search?q=${encodeURIComponent(coreSearchQuery)}`
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setCoreSearchResults(data);
      if (data.length === 0) {
        setCoreSearchError('No results found for your query.');
      }
    } catch (err: any) {
      setCoreSearchError(err.message || 'An unknown error occurred while searching CORE API.');
      console.error('CORE API Search error:', err);
    } finally {
      setIsCoreSearching(false);
    }
  };

  const handleSaveCoreApiItem = async (item: CoreSearchResultItem) => {
    console.log('Attempting to save CORE item:', item);
    setIsSavingCorePaper(true);
    
    try {
      const response = await fetch(`${KANA_API_BASE_URL}/api/study-materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: item.title,
          description: item.abstract,
          source: 'CORE_API',
          metadata: {
            authors: item.authors,
            year: item.year,
            doi: item.doi,
            publisher: item.publisher,
            downloadUrl: item.downloadUrl
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save item to library');
      }
      
      // After successful save, refresh the library
      await fetchLibraryItems();
      setUploadSuccessMessage(`Successfully saved "${item.title}" to your library.`);
    } catch (err) {
      setUploadError('Failed to save paper to library.');
      console.error('Error saving paper:', err);
    } finally {
      setIsSavingCorePaper(false);
    }
  };

  const [uploadProgress, setUploadProgress] = useState(0);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title-asc' | 'title-desc'>('newest');
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  
  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Files' },
    { id: 'recent', name: 'Recently Added' },
    { id: 'favorites', name: 'Favorites' },
    { id: 'pdf', name: 'PDFs' },
    { id: 'documents', name: 'Documents' },
    { id: 'images', name: 'Images' },
  ];
  
  // Simulate upload progress
  useEffect(() => {
    if (isUploading) {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            setUploadSuccessMessage('Upload completed successfully!');
            setTimeout(() => setUploadSuccessMessage(''), 3000);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
      return () => clearInterval(interval);
    } else {
      setUploadProgress(0);
    }
  }, [isUploading]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex flex-col bg-[#0a0f1e] text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1a223a] bg-[#0c1220]">
          <h2 className="text-xl font-semibold">Study Materials</h2>
          <div className="flex items-center space-x-4">
            {/* Search Mode Toggle */}
            <div className="flex bg-[#0f172a] rounded-lg p-1">
              <button
                type="button"
                className={`px-4 py-2 rounded-md flex items-center ${
                  searchMode === 'library'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setSearchMode('library')}
              >
                <Folder className="h-4 w-4 mr-2" />
                My Library
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-md flex items-center ${
                  searchMode === 'coreApi'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setSearchMode('coreApi')}
              >
                <Search className="h-4 w-4 mr-2" />
                Search CORE
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#1e293b] text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-[#1a223a] bg-[#0c1220] p-4 flex flex-col">
            {/* Upload Section */}
            <div className="mb-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Upload File</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelectedForUpload} 
                className="hidden" 
                accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.xls,.xlsx"
                multiple
              />
              {isUploading && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Uploading... {uploadProgress}%</p>
                </div>
              )}
            </div>
            
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search library..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#1a223a] rounded-md py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                File Type
              </h3>
              <select
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#1a223a] rounded-md py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {fileTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">
                Sort By
              </h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-[#0f172a] border border-[#1a223a] rounded-md py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
              </select>
            </div>
            
            {/* Categories */}
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Categories
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedFolder('All')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    selectedFolder === 'All' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-[#1a223a]'
                  }`}
                >
                  All Items
                </button>
                {categories.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.name)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                      selectedFolder === folder.name 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-300 hover:bg-[#1a223a]'
                    }`}
                  >
                    {folder.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {searchMode === 'library' ? (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredMaterials.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        setSelectedMaterialId(item.id);
                        onSelectMaterial(item);
                      }}
                      className={`bg-[#0f172a] rounded-lg overflow-hidden border ${
                        selectedMaterialId === item.id 
                          ? 'border-blue-500 ring-2 ring-blue-500' 
                          : 'border-[#1a223a] hover:border-blue-300'
                      } transition-all cursor-pointer`}
                    >
                      <div className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          {getFileIcon(item.originalFilename || '')}
                          <h3 className="font-medium text-white truncate">{item.title}</h3>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{item.category}</span>
                          <span>{item.uploadDate ? new Date(item.uploadDate).toLocaleDateString() : ''}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredMaterials.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <FileIcon className="h-12 w-12 mb-4 opacity-50" />
                    <p>No materials found. Try adjusting your filters or upload a new file.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto">
                  <div className="flex space-x-4 mb-6">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={coreSearchQuery}
                        onChange={(e) => setCoreSearchQuery(e.target.value)}
                        placeholder="Search for academic papers..."
                        className="w-full bg-[#0f172a] border border-[#1a223a] rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyDown={(e) => e.key === 'Enter' && handleCoreApiSearch()}
                      />
                    </div>
                    <button
                      onClick={handleCoreApiSearch}
                      disabled={isCoreSearching || !coreSearchQuery.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isCoreSearching ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Searching...</span>
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          <span>Search</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {isCoreSearching ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : coreSearchResults.length > 0 ? (
                    <div className="space-y-6">
                      {coreSearchResults.map((result) => (
                        <div key={result.coreId} className="bg-[#0f172a] rounded-lg p-4 border border-[#1a223a]">
                          <h3 className="text-lg font-medium text-white mb-2">{result.title}</h3>
                          {result.authors && result.authors.length > 0 && (
                            <p className="text-sm text-gray-400 mb-2">
                              {result.authors.map(a => a.name).join(', ')}
                            </p>
                          )}
                          {result.abstract && (
                            <p className="text-sm text-gray-300 mb-4 line-clamp-3">
                              {result.abstract}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                              {result.year && (
                                <span className="text-xs bg-[#1a223a] text-gray-400 px-2 py-1 rounded">
                                  {result.year}
                                </span>
                              )}
                              {result.publisher && (
                                <span className="text-xs bg-[#1a223a] text-gray-400 px-2 py-1 rounded">
                                  {result.publisher}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleSaveCoreApiItem(result)}
                              className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                            >
                              <span>Save to Library</span>
  <CheckSquare className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : coreSearchQuery ? (
                    <div className="text-center py-12 text-gray-400">
                      <p>No results found for "{coreSearchQuery}"</p>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <p>Search for academic papers using the CORE API</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyMaterialsPanel;