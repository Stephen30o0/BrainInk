import React, { useState } from 'react';
import { ArrowLeft, Search, Calendar, Filter, Download, FileText, BookOpen } from 'lucide-react';

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

interface ArchiveExplorerProps {
  item: LibraryItem;
  onBack: () => void;
}

// Mock archive documents
interface ArchiveDocument {
  id: string;
  title: string;
  author: string;
  type: string;
  year: number;
  category: string;
  tags: string[];
  abstract: string;
  url: string;
}

const archiveDocuments: ArchiveDocument[] = [
  {
    id: 'doc-1',
    title: 'On the Structure of the Brain and Spinal Cord',
    author: 'Santiago Ramón y Cajal',
    type: 'Research Paper',
    year: 1894,
    category: 'Historical',
    tags: ['Neuroanatomy', 'Cellular Structure', 'Foundational'],
    abstract: 'This seminal paper presents early observations on neuronal structure and the organization of neural tissue, laying the groundwork for modern neuroscience.',
    url: '#'
  },
  {
    id: 'doc-2',
    title: 'The Organization of Behavior',
    author: 'Donald Hebb',
    type: 'Book',
    year: 1949,
    category: 'Historical',
    tags: ['Neural Networks', 'Learning', 'Synaptic Plasticity'],
    abstract: 'This influential work introduced the concept of Hebbian learning and the famous postulate that "neurons that fire together, wire together", which has become foundational to our understanding of neural plasticity and learning.',
    url: '#'
  },
  {
    id: 'doc-3',
    title: 'Principles of Neural Science',
    author: 'Eric Kandel et al.',
    type: 'Textbook',
    year: 1981,
    category: 'Educational',
    tags: ['Comprehensive', 'Medical', 'Reference'],
    abstract: 'The first edition of what would become the definitive textbook in neuroscience, covering cellular and molecular mechanisms, sensory and motor systems, and higher cognitive functions.',
    url: '#'
  },
  {
    id: 'doc-4',
    title: 'The Brain That Changes Itself',
    author: 'Norman Doidge',
    type: 'Book',
    year: 2007,
    category: 'Popular Science',
    tags: ['Neuroplasticity', 'Rehabilitation', 'Case Studies'],
    abstract: 'A groundbreaking book that explored the concept of neuroplasticity through compelling case studies of patients who recovered from seemingly irreversible neurological conditions.',
    url: '#'
  },
  {
    id: 'doc-5',
    title: "The Brain's Reward System and Addiction",
    author: 'Nora Volkow',
    type: 'Research Paper',
    year: 2012,
    category: 'Medical',
    tags: ['Addiction', 'Dopamine', 'Neural Circuits'],
    abstract: "This paper explores the neural basis of addiction, focusing on the role of the brain's reward circuits and neurotransmitter systems in substance dependence and compulsive behaviors.",
    url: '#'
  },
];

// Filter categories
const filterCategories = [
  { id: 'all', name: 'All Categories' },
  { id: 'historical', name: 'Historical' },
  { id: 'educational', name: 'Educational' },
  { id: 'medical', name: 'Medical' },
  { id: 'popular', name: 'Popular Science' }
];

// Document types
const documentTypes = [
  { id: 'all', name: 'All Types' },
  { id: 'research', name: 'Research Papers' },
  { id: 'book', name: 'Books' },
  { id: 'textbook', name: 'Textbooks' },
  { id: 'lecture', name: 'Lecture Notes' }
];

export const ArchiveExplorer: React.FC<ArchiveExplorerProps> = ({ item, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [timeFrame, setTimeFrame] = useState<[number, number]>([1800, 2025]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ArchiveDocument | null>(null);

  // Filter documents based on search and filters
  const filteredDocuments = archiveDocuments.filter(doc => {
    // Search query filter
    const matchesSearch = searchQuery === '' || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Category filter
    const matchesCategory = selectedCategory === 'all' || 
      doc.category.toLowerCase() === selectedCategory.toLowerCase();
    
    // Type filter
    const matchesType = selectedType === 'all' || 
      doc.type.toLowerCase().includes(selectedType.toLowerCase());
    
    // Time frame filter
    const matchesTimeFrame = doc.year >= timeFrame[0] && doc.year <= timeFrame[1];
    
    return matchesSearch && matchesCategory && matchesType && matchesTimeFrame;
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
            <p className="text-gray-400 text-sm">{item.author}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <Filter size={20} />
          </button>
        </div>
      </div>
      
      {/* Search bar */}
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Search archives..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-dark/50 border border-primary/30 rounded-lg py-2 px-4 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-primary/60"
        />
        <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="bg-dark/30 rounded-lg p-4 border border-primary/20 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category filter */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Category</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-dark/50 border border-primary/30 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary/60"
            >
              {filterCategories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          
          {/* Type filter */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Document Type</label>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-dark/50 border border-primary/30 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary/60"
            >
              {documentTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
          
          {/* Time period filter */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Time Period: {timeFrame[0]} - {timeFrame[1]}</label>
            <div className="flex items-center gap-2">
              <input 
                type="range"
                min={1800}
                max={2025}
                value={timeFrame[0]}
                onChange={(e) => setTimeFrame([parseInt(e.target.value), timeFrame[1]])}
                className="w-full accent-primary"
              />
              <input 
                type="range"
                min={1800}
                max={2025}
                value={timeFrame[1]}
                onChange={(e) => setTimeFrame([timeFrame[0], parseInt(e.target.value)])}
                className="w-full accent-primary"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Document list */}
        <div className={`flex-1 bg-dark/30 rounded-lg border border-primary/20 overflow-y-auto ${selectedDocument ? 'hidden md:block md:w-1/2' : 'w-full'}`}>
          <div className="p-4 border-b border-gray-700 sticky top-0 bg-dark/90 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <h3 className="font-pixel text-primary">
                {filteredDocuments.length} Document{filteredDocuments.length !== 1 ? 's' : ''} Found
              </h3>
              <div className="text-gray-400 text-sm flex items-center gap-1">
                <Calendar size={14} />
                <span>Sorted by Year</span>
              </div>
            </div>
          </div>
          
          {filteredDocuments.length > 0 ? (
            <div>
              {filteredDocuments.map(doc => (
                <div 
                  key={doc.id}
                  className="p-4 border-b border-gray-700/50 hover:bg-dark/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedDocument(doc)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-medium text-sm">{doc.title}</h4>
                    <div className="ml-2 text-primary text-xs font-mono">{doc.year}</div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-gray-400">{doc.author}</div>
                    <div className="text-gray-500 flex items-center gap-1">
                      <FileText size={12} />
                      {doc.type}
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm mt-2 line-clamp-2">{doc.abstract}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {doc.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400">
              No documents match your search criteria
            </div>
          )}
        </div>
        
        {/* Document view */}
        {selectedDocument && (
          <div className="flex-1 bg-dark/30 rounded-lg border border-primary/20 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-pixel text-xl text-primary">{selectedDocument.title}</h3>
                <button 
                  onClick={() => setSelectedDocument(null)}
                  className="p-2 rounded-lg hover:bg-primary/20 transition-colors md:hidden"
                >
                  <ArrowLeft size={20} className="text-primary" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-dark/40 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Author</div>
                  <div className="text-white">{selectedDocument.author}</div>
                </div>
                
                <div className="bg-dark/40 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Year</div>
                  <div className="text-white">{selectedDocument.year}</div>
                </div>
                
                <div className="bg-dark/40 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Type</div>
                  <div className="text-white">{selectedDocument.type}</div>
                </div>
                
                <div className="bg-dark/40 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Category</div>
                  <div className="text-white">{selectedDocument.category}</div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-primary font-medium mb-2">Abstract</h4>
                <p className="text-gray-200 leading-relaxed">{selectedDocument.abstract}</p>
              </div>
              
              <div className="mb-6">
                <h4 className="text-primary font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDocument.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Mock document preview */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 mb-6">
                <div className="flex items-center justify-center flex-col gap-4 py-12">
                  <FileText size={48} className="text-gray-500" />
                  <p className="text-gray-400">Document preview not available in this view</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                  <Download size={16} />
                  Download Document
                </button>
                
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-dark/50 text-white hover:bg-dark/70 transition-colors">
                  <BookOpen size={16} />
                  Open Full View
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
