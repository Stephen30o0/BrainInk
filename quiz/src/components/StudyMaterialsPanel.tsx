import React, { useState, useEffect, useRef } from 'react';

const KANA_API_BASE_URL = import.meta.env.VITE_KANA_API_BASE_URL || '';
import { X, File, Upload, Folder, Search, CheckSquare, ExternalLink } from 'lucide-react'; // Added CheckSquare

// It's highly recommended to centralize these interfaces if used in multiple places
// For now, we'll define them here to match what LibraryHub expects.
interface CoreApiAuthor {
  name: string;
}

interface LibraryItem {
  id: string;
  title: string;
  authors?: CoreApiAuthor[];
  category: string;
  coverImage?: string;
  description?: string;
  publishDate?: string;
  rating?: number;
  views?: number;
  readTime?: string;
  storedFilename: string | null;
  mimetype: string;
  originalFilename?: string;
  isExternal?: boolean;
  externalUrl?: string;
  abstract?: string;
  size?: string; // Assuming size might come from backend or can be calculated
  // Add any other fields that your backend's /api/library/items provides
}

// Placeholder - Define based on actual CORE API response structure (transformed by your backend)
interface CoreSearchResultItem {
  coreId: string; // Or whatever ID CORE provides
  title: string;
  authors: { name: string }[];
  abstract?: string;
  year?: number;
  downloadUrl?: string; // Link to PDF or landing page
  doi?: string;
  publisher?: string;
  // Add other relevant fields
}

interface StudyMaterialsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMaterial: (material: LibraryItem) => void; // New prop
}

const StudyMaterialsPanel: React.FC<StudyMaterialsPanelProps> = ({
  isOpen,
  onClose,
  onSelectMaterial,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [folders, setFolders] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileForUpload, setSelectedFileForUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [searchMode, setSearchMode] = useState<'library' | 'coreApi'>('library');
  const [coreApiSearchTerm, setCoreApiSearchTerm] = useState<string>('');
  const [coreApiResults, setCoreApiResults] = useState<CoreSearchResultItem[]>([]);
  const [isCoreApiSearching, setIsCoreApiSearching] = useState<boolean>(false);
  const [coreApiError, setCoreApiError] = useState<string | null>(null);

  const fetchLibraryItems = () => {
    setIsLoading(true);
    setError(null);
    fetch(`${KANA_API_BASE_URL}/api/study-materials`) // Assuming this is your endpoint
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch library items: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data: LibraryItem[]) => {
        setLibraryItems(data);
        const uniqueCategories = Array.from(new Set(data.map(item => item.category)));
        setFolders(['All', ...uniqueCategories]);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching library items:", err);
        setError(err.message);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchLibraryItems();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredMaterials = libraryItems.filter(material =>
    (selectedFolder === 'All' || material.category === selectedFolder) &&
    (material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (material.authors && material.authors.some(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()))) ||
     (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelectedForUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFileForUpload(file);
      setUploadError(null);
      setUploadSuccessMessage(null);
    }
  };

  const handlePerformUpload = async () => {
    if (!selectedFileForUpload) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFileForUpload);
    // You might want to add other metadata here, e.g., category, title if not derived by backend
    // formData.append('title', selectedFileForUpload.name); // Example

    try {
      const response = await fetch(`${KANA_API_BASE_URL}/api/upload-study-material`, { // Assuming this is your upload endpoint
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed with non-JSON response.'}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // const result = await response.json(); // If backend returns data about the uploaded file
      setUploadSuccessMessage(`Successfully uploaded: ${selectedFileForUpload.name}`);
      setSelectedFileForUpload(null);
      fetchLibraryItems(); // Refresh the list
    } catch (err: any) {
      setUploadError(err.message || 'An unknown error occurred during upload.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoreApiSearch = async () => {
    if (!coreApiSearchTerm.trim()) {
      setCoreApiError('Please enter a search term.');
      setCoreApiResults([]);
      return;
    }
    setIsCoreApiSearching(true);
    setCoreApiError(null);
    setCoreApiResults([]);
    try {
      // IMPORTANT: Replace '/api/core/search' with your actual backend endpoint for CORE API searches
      const response = await fetch(`${KANA_API_BASE_URL}/api/core-search?query=${encodeURIComponent(coreApiSearchTerm)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Search failed with non-JSON response.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data: CoreSearchResultItem[] = await response.json();
      setCoreApiResults(data);
      if (data.length === 0) {
        setCoreApiError('No results found for your query.');
      }
    } catch (err: any) {
      setCoreApiError(err.message || 'An unknown error occurred while searching CORE API.');
      console.error('CORE API Search error:', err);
    } finally {
      setIsCoreApiSearching(false);
    }
  };

  // Placeholder for saving CORE item to library
  const handleSaveCoreApiItem = async (item: CoreSearchResultItem) => {
    console.log('Attempting to save CORE item:', item);
    // TODO: Implement API call to backend to save this item
    // e.g., POST to /api/library/add-external with item details
    // After successful save, you might want to show a success message and/or refresh library items
    alert(`Save functionality for "${item.title}" is not yet implemented.`);
  };

  const handleSelectMaterial = (material: LibraryItem) => {
    onSelectMaterial(material);
    // Optionally close the panel after selection, or let the parent component decide
    // onClose(); 
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0e17] border border-[#1a223a] rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-[#1a223a]">
          <h3 className="text-lg font-medium flex items-center text-white">
            <File className="h-5 w-5 mr-2 text-blue-400" />
            Study Materials
          </h3>
          <div className="flex items-center">
            {/* Mode Toggle Placeholder - Will be styled better */}
            <div className="mr-4 flex border border-[#1a223a] rounded-md">
              <button 
                onClick={() => setSearchMode('library')}
                className={`px-3 py-1 text-sm rounded-l-md ${searchMode === 'library' ? 'bg-blue-600 text-white' : 'bg-[#0a0e17] text-gray-300 hover:bg-[#141b2d]'}`}>My Library</button>
              <button 
                onClick={() => setSearchMode('coreApi')}
                className={`px-3 py-1 text-sm rounded-r-md ${searchMode === 'coreApi' ? 'bg-blue-600 text-white' : 'bg-[#0a0e17] text-gray-300 hover:bg-[#141b2d]'}`}>Search CORE API</button>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          {/* Conditional Rendering based on searchMode will go here */}
          {/* For now, keeping the library view active to avoid breaking existing structure */}

          {/* Sidebar */}
          <div className="w-56 border-r border-[#1a223a] p-4 overflow-y-auto flex flex-col">
            <input type="file" ref={fileInputRef} onChange={handleFileSelectedForUpload} accept=".pdf,.txt,.md,.docx" style={{ display: 'none' }} />
            <button onClick={handleUploadButtonClick} className="w-full mb-2 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium flex items-center justify-center text-white">
              <Upload className="h-4 w-4 mr-2" />
              Choose File to Upload
            </button>
            {selectedFileForUpload && (
              <div className="mb-2 text-xs text-gray-300">
                <p className="truncate">Selected: {selectedFileForUpload.name}</p>
                <button 
                  onClick={handlePerformUpload} 
                  disabled={isUploading}
                  className="w-full mt-1 py-1.5 bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium text-white disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Confirm Upload'}
                </button>
              </div>
            )}
            {uploadSuccessMessage && <p className="mb-2 text-xs text-green-400">{uploadSuccessMessage}</p>}
            {uploadError && <p className="mb-2 text-xs text-red-400">Error: {uploadError}</p>}
            
            <div className="space-y-1 flex-grow">
              {folders.map(folder => (
                <button
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center ${
                    selectedFolder === folder ? 'bg-[#1a223a] text-white' : 'text-gray-400 hover:bg-[#141b2d] hover:text-white'
                  }`}
                >
                  <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{folder}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Main content - Will also be conditional based on searchMode */}
          {searchMode === 'library' && (
            <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search (Library) */}
            <div className="p-4 border-b border-[#1a223a]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search your library by title, author, description..."
                  className="w-full bg-[#141b2d] border border-[#1a223a] rounded-md py-2 pl-8 pr-3 text-sm text-white focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
            {/* Materials list (Library) */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading && <p className="text-gray-400">Loading materials...</p>}
              {error && <p className="text-red-500">Error: {error}</p>}
              {!isLoading && !error && filteredMaterials.length === 0 && (
                <p className="text-gray-400">No materials found in your library matching your criteria.</p>
              )}
              {!isLoading && !error && filteredMaterials.length > 0 && (
                <div className="space-y-2">
                  {filteredMaterials.map(material => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-3 bg-[#141b2d] rounded-lg border border-[#1a223a] hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-center overflow-hidden">
                        {material.isExternal ? (
                            <ExternalLink className="h-5 w-5 text-purple-400 mr-3 flex-shrink-0" />
                        ) : (
                            <File className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
                        )}
                        <div className="truncate">
                          <p className="font-medium text-white truncate" title={material.title}>{material.title}</p>
                          <p className="text-sm text-gray-400 truncate">
                            {material.category}
                            {material.authors && material.authors.length > 0 && ` • ${material.authors.map(a => a.name).join(', ')}`}
                            {material.size && ` • ${material.size}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectMaterial(material)}
                        title="Select this material for AI context"
                        className="p-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors text-white ml-2 flex-shrink-0"
                      >
                        <CheckSquare className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          )}
          {searchMode === 'coreApi' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* CORE API Search Input */}
              <div className="p-4 border-b border-[#1a223a]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search CORE database (e.g., 'machine learning applications')"
                    className="flex-grow bg-[#141b2d] border border-[#1a223a] rounded-md py-2 px-3 text-sm text-white focus:ring-blue-500 focus:border-blue-500"
                    value={coreApiSearchTerm}
                    onChange={e => setCoreApiSearchTerm(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleCoreApiSearch()}
                  />
                  <button 
                    onClick={handleCoreApiSearch}
                    disabled={isCoreApiSearching}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium text-white disabled:opacity-50 flex items-center justify-center"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {isCoreApiSearching ? 'Searching...' : 'Search CORE'}
                  </button>
                </div>
              </div>
              {/* CORE API Results Display */}
              <div className="flex-1 overflow-y-auto p-4">
                {isCoreApiSearching && <p className="text-gray-400 text-center">Searching CORE database...</p>}
                {coreApiError && !isCoreApiSearching && <p className="text-red-500 text-center">Error: {coreApiError}</p>}
                {!isCoreApiSearching && coreApiResults.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-300 mb-2">Found {coreApiResults.length} result(s):</p>
                    {coreApiResults.map(item => (
                      <div key={item.coreId} className="p-3 bg-[#141b2d] rounded-lg border border-[#1a223a]">
                        <h5 className="font-semibold text-white mb-1" title={item.title}>{item.title}</h5>
                        {item.authors && item.authors.length > 0 && (
                          <p className="text-xs text-gray-400 mb-1">Authors: {item.authors.map(a => a.name).join(', ')}</p>
                        )}
                        {item.year && <p className="text-xs text-gray-400 mb-1">Year: {item.year}</p>}
                        {item.publisher && <p className="text-xs text-gray-400 mb-1">Publisher: {item.publisher}</p>}
                        {item.abstract && (
                          <p className="text-sm text-gray-300 mt-1 mb-2 leading-relaxed max-h-20 overflow-y-auto pr-1 text-ellipsis">
                            {item.abstract.substring(0, 250)}{item.abstract.length > 250 ? '...' : ''}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          {item.downloadUrl && (
                            <a 
                              href={item.downloadUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-md text-xs font-medium text-white flex items-center"
                            >
                              <ExternalLink className="h-3 w-3 mr-1.5" /> View/Download
                            </a>
                          )}
                          <button 
                            onClick={() => handleSaveCoreApiItem(item)}
                            title="Save this item to your K.A.N.A. library"
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-xs font-medium text-white flex items-center"
                          >
                            <File className="h-3 w-3 mr-1.5" /> Save to Library
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!isCoreApiSearching && !coreApiError && coreApiResults.length === 0 && coreApiSearchTerm && (
                  <p className="text-gray-400 text-center">No results found for "{coreApiSearchTerm}". Try a different query.</p>
                )}
              </div>
            </div>
          )}
          {/* Old Main content - to be removed or fully integrated into conditional rendering 
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-[#1a223a]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search materials by title, author, description..."
                  className="w-full bg-[#141b2d] border border-[#1a223a] rounded-md py-2 pl-8 pr-3 text-sm text-white focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
            {/* Materials list */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading && <p className="text-gray-400">Loading materials...</p>}
              {error && <p className="text-red-500">Error: {error}</p>}
              {!isLoading && !error && filteredMaterials.length === 0 && (
                <p className="text-gray-400">No materials found matching your criteria.</p>
              )}
              {!isLoading && !error && filteredMaterials.length > 0 && (
                <div className="space-y-2">
                  {filteredMaterials.map(material => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-3 bg-[#141b2d] rounded-lg border border-[#1a223a] hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-center overflow-hidden">
                        {material.isExternal ? (
                            <ExternalLink className="h-5 w-5 text-purple-400 mr-3 flex-shrink-0" />
                        ) : (
                            <File className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
                        )}
                        <div className="truncate">
                          <p className="font-medium text-white truncate" title={material.title}>{material.title}</p>
                          <p className="text-sm text-gray-400 truncate">
                            {material.category}
                            {material.authors && material.authors.length > 0 && ` • ${material.authors.map(a => a.name).join(', ')}`}
                            {material.size && ` • ${material.size}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectMaterial(material)}
                        title="Select this material for AI context"
                        className="p-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors text-white ml-2 flex-shrink-0"
                      >
                        <CheckSquare className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          {/*</div> Closing div for old main content - now handled by conditional rendering */}
        </div>
      </div>
    </div>
  );
};

export default StudyMaterialsPanel;