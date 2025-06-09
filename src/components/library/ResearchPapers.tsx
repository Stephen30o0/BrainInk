import React from 'react';
const KANA_API_BASE_URL = import.meta.env.VITE_KANA_API_BASE_URL || '';
import { ArrowLeft, Download, ExternalLink, Clock, Calendar, FileText } from 'lucide-react';

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
  abstract?: string; 
}

interface ResearchPapersProps {
  item: LibraryItem;
  onBack: () => void;
}



export const ResearchPapers: React.FC<ResearchPapersProps> = ({ item, onBack }) => {
  const publicationDate = new Date(item.publishDate);
  const formattedDate = publicationDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
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
          {item.isExternal && item.externalUrl ? (
            <a 
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white bg-primary/20 hover:bg-primary/30 transition-colors"
            >
              <ExternalLink size={16} />
              View Source
            </a>
          ) : item.storedFilename && (item.mimetype === 'application/pdf' || !item.mimetype || item.mimetype.startsWith('application/')) ? (
            <a 
              href={`${KANA_API_BASE_URL}/study_material_files/${item.storedFilename}`}
              download={item.originalFilename || item.storedFilename}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white bg-primary/20 hover:bg-primary/30 transition-colors"
            >
              <Download size={16} />
              {item.mimetype === 'application/pdf' ? 'PDF' : 'Download'}
            </a>
          ) : null}
        </div>
      </div>
      
      {/* Paper metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-dark/30 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Calendar size={16} />
            <span>Published</span>
          </div>
          <div className="text-white">{formattedDate}</div>
        </div>
        
        <div className="bg-dark/30 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Clock size={16} />
            <span>Reading Time</span>
          </div>
          <div className="text-white">{item.readTime}</div>
        </div>
        
        <div className="bg-dark/30 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <FileText size={16} />
            <span>Category</span>
          </div>
          <div className="text-white">{item.category}</div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col md:flex-row gap-6 flex-1">
        {/* Paper content */}
        <div className="flex-1 bg-dark/30 rounded-lg p-6 border border-primary/20 overflow-y-auto">
          {(item.abstract || item.description) && (
            <>
              <h3 className="font-pixel text-lg text-primary mb-2">Abstract</h3>
              <p className="text-gray-200 mb-6 leading-relaxed whitespace-pre-wrap">
                {item.abstract || item.description || 'No abstract available.'}
              </p>
            </>
          )}
          {!item.abstract && !item.description && !item.isExternal && (
             <p className="text-gray-400">No abstract or description available for this local item.</p>
          )}
          {item.isExternal && !item.abstract && (
             <p className="text-gray-400">Detailed content beyond the abstract is typically not available for externally sourced items directly within K.A.N.A. Please use the 'View Source' link to access the full material.</p>
          )}
        </div>
      </div>
    </div>
  );
};
