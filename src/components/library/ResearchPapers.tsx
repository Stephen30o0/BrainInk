import React from 'react';
import { ArrowLeft, Download, ExternalLink, Clock, Calendar, FileText } from 'lucide-react';

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

interface ResearchPapersProps {
  item: LibraryItem;
  onBack: () => void;
}

// Mock abstract for the research paper
const paperAbstract = `
This paper presents a comprehensive analysis of neural network applications in educational technology. 
We explore how deep learning algorithms can be optimized for personalized learning experiences, 
and demonstrate a novel approach to content recommendation based on cognitive profiles. 
Our research indicates that adaptive neural systems can improve learning outcomes by 28% 
compared to traditional educational approaches. We further discuss the ethical implications 
of AI-driven educational tools and propose a framework for responsible implementation.
`;

// Mock sections in the paper
const paperSections = [
  'Abstract',
  'Introduction',
  'Literature Review',
  'Methodology',
  'Results',
  'Discussion',
  'Conclusion',
  'References'
];

// Mock references in the paper
const paperReferences = [
  'Johnson, A. et al. (2023). "Deep learning applications in educational contexts." Journal of Educational Technology, 45(2), 112-128.',
  'Smith, B. & Wong, C. (2022). "Cognitive modeling in adaptive learning systems." Cognitive Science, 33(4), 289-304.',
  'Patel, N. (2024). "Ethical considerations in AI-driven educational platforms." Ethics in Technology, 18(1), 45-62.',
  'Zhang, L. et al. (2023). "Personalized learning algorithms: A meta-analysis." Learning Analytics Journal, 12(3), 201-219.',
  'Brown, D. & Garcia, M. (2022). "Neural networks and student engagement metrics." AI in Education, 9(2), 78-93.'
];

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
            <p className="text-gray-400 text-sm">{item.author}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white bg-primary/20 hover:bg-primary/30 transition-colors">
            <Download size={16} />
            PDF
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white bg-gray-700/60 hover:bg-gray-700/80 transition-colors">
            <ExternalLink size={16} />
            Cite
          </button>
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
          <div className="text-white">Neuroscience, Education</div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col md:flex-row gap-6 flex-1">
        {/* Table of contents */}
        <div className="md:w-64 bg-dark/30 rounded-lg p-4 border border-primary/20 h-fit">
          <h3 className="font-pixel text-primary mb-3">Contents</h3>
          <ul className="space-y-2">
            {paperSections.map((section, index) => (
              <li key={index}>
                <button className="text-gray-300 hover:text-primary transition-colors text-left w-full text-sm">
                  {section}
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Paper content */}
        <div className="flex-1 bg-dark/30 rounded-lg p-6 border border-primary/20 overflow-y-auto">
          <h3 className="font-pixel text-lg text-primary mb-2">Abstract</h3>
          <p className="text-gray-200 mb-6 leading-relaxed">{paperAbstract}</p>
          
          <h3 className="font-pixel text-lg text-primary mb-2">Introduction</h3>
          <p className="text-gray-200 mb-6 leading-relaxed">
            Educational technology has undergone significant transformation with the advent of artificial intelligence and machine learning algorithms. This paper examines the specific impact of neural networks on personalized learning systems and adaptive educational platforms.
          </p>
          <p className="text-gray-200 mb-6 leading-relaxed">
            Our research focuses on three key areas: (1) the implementation of deep learning for content recommendation, (2) cognitive modeling through neural networks, and (3) performance optimization for educational outcomes. Through a series of experiments and case studies, we demonstrate the efficacy of these approaches in real-world educational settings.
          </p>
          
          <h3 className="font-pixel text-lg text-primary mb-2">References</h3>
          <ul className="text-gray-300 space-y-2 text-sm">
            {paperReferences.map((reference, index) => (
              <li key={index} className="leading-relaxed">{reference}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
