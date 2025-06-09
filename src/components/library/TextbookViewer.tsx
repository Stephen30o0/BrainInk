import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bookmark, ThumbsUp, Share2 } from 'lucide-react';

// Define CoreApiAuthor if not imported (ensure consistency with LibraryHub.tsx)
interface CoreApiAuthor {
  name: string;
}

interface LibraryItem {
  id: string;
  title: string;
  authors: CoreApiAuthor[];
  category: string;
  coverImage: string;
  description: string;
  publishDate: string;
  rating: number;
  views: number;
  readTime: string;
  storedFilename: string | null;
  mimetype: string;
  originalFilename: string;
  isExternal?: boolean;
  externalUrl?: string;
}

interface TextbookViewerProps {
  item: LibraryItem;
  onBack: () => void;
}

export const TextbookViewer: React.FC<TextbookViewerProps> = ({ item, onBack }) => {
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileUrl = `http://localhost:3001/study_material_files/${item.storedFilename}`;

  useEffect(() => {
    if (item.mimetype === 'text/plain') {
      setIsLoading(true);
      setError(null);
      fetch(fileUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch text file: ${response.statusText}`);
          }
          return response.text();
        })
        .then(text => {
          setTextContent(text);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching text content:', err);
          setError(err.message);
          setIsLoading(false);
        });
    }
  }, [item.mimetype, fileUrl]);

  const renderContent = () => {
    if (item.mimetype === 'application/pdf') {
      return (
        <iframe 
          src={fileUrl}
          title={item.title}
          className="w-full h-full border-0"
          allowFullScreen
        />
      );
    } else if (item.mimetype === 'text/plain') {
      if (isLoading) return <p className="text-gray-300">Loading text content...</p>;
      if (error) return <p className="text-red-500">Error: {error}</p>;
      if (textContent) {
        return (
          <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
            {textContent}
          </div>
        );
      }
      return <p className="text-gray-400">No text content to display.</p>;
    } else if (item.isExternal && item.externalUrl) {
      return (
        <div className="text-center text-gray-400">
          <p>This is an external resource. Click below to open it in a new tab.</p>
          <a 
            href={item.externalUrl} 
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            Open External Link
          </a>
        </div>
      );
    } else if (item.storedFilename) { // Fallback for local, non-viewable files
      return (
        <div className="text-center text-gray-400">
          <p>File type "{item.mimetype}" is not directly viewable.</p>
          <a 
            href={fileUrl} 
            download={item.originalFilename || item.storedFilename} 
            className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            Download File
          </a>
        </div>
      );
    } else {
      return (
        <div className="text-center text-gray-400">
          <p>Content not available for this item.</p>
        </div>
      );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 rounded-lg hover:bg-primary/20 transition-colors"
          >
            <ArrowLeft size={20} className="text-primary" />
          </button>
          <div>
            <h2 className="font-pixel text-xl text-primary">{item.title}</h2>
            <p className="text-gray-400 text-sm" title={item.authors ? item.authors.map(a => a.name).join(', ') : 'N/A'}>{item.authors ? item.authors.map(a => a.name).join(', ') : 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setBookmarked(!bookmarked)}
            className={`p-2 rounded-lg transition-colors ${bookmarked ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <Bookmark size={20} />
          </button>
          <button 
            onClick={() => setLiked(!liked)}
            className={`p-2 rounded-lg transition-colors ${liked ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <ThumbsUp size={20} />
          </button>
          <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 transition-colors">
            <Share2 size={20} />
          </button>
        </div>
      </div>
      
      {/* Content area */}
      <div className="flex-1 overflow-y-auto bg-dark/30 rounded-lg p-6 border border-primary/20 flex flex-col">
        {/* For PDF, iframe takes full space. For text, title might be shown if desired, or just content. */}
        {/* If not PDF, we might want to show item.title as a header here */}
        {item.mimetype !== 'application/pdf' && (
            <h3 className="font-pixel text-lg text-primary mb-4">
                {item.title} {/* Display item title for non-PDFs or as a general title */}
            </h3>
        )}
        {renderContent()}
      </div>
      
      {/* Page navigation (Only for specific content types if we re-introduce chunking for large text) */}
      {/* For now, PDF handles its own navigation, and text is displayed fully. */}
      {/* If pagination for plain text is needed later, this section can be re-enabled and adapted. */}
      {/* 
      {item.mimetype === 'text/plain' && textContent && (
        <div className="flex items-center justify-between mt-4">
          <button className={`flex items-center gap-1 px-3 py-1 rounded-lg text-gray-600 cursor-not-allowed`}>
            <ChevronLeft size={16} />
            Previous
          </button>
          <div className="text-gray-400 text-sm">
            Page 1 of 1
          </div>
          <button className={`flex items-center gap-1 px-3 py-1 rounded-lg text-gray-600 cursor-not-allowed`}>
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      */}
    </div>
  );
};
