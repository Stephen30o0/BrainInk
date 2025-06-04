import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Bookmark, Share2, ThumbsUp } from 'lucide-react';

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

interface TextbookViewerProps {
  item: LibraryItem;
  onBack: () => void;
}

// Mock content for textbook
const textbookContent = [
  {
    title: 'Chapter 1: Introduction to the Brain',
    content: `
The human brain is the command center for the human nervous system. It receives signals from the body's sensory organs and outputs information to the muscles. The brain is a highly complex organ consisting of approximately 86 billion neurons, with roughly 16 billion located in the cerebral cortex.

The brain can be divided into three main parts:

1. **Cerebrum**: The cerebrum is the largest part of the human brain, containing the cerebral cortex, which is responsible for higher brain functions such as thought, reasoning, learning, memory, and emotion.

2. **Cerebellum**: Located at the back of the brain beneath the cerebrum, the cerebellum is responsible for coordination, precision, and timing of movements.

3. **Brainstem**: The brainstem connects the brain to the spinal cord and controls automatic functions such as breathing, heart rate, and blood pressure.

Neuroscience is the scientific study of the nervous system, including the brain. It is an interdisciplinary field that combines aspects of biology, chemistry, computer science, medicine, and psychology to understand the fundamental properties of neurons and neural circuits.
    `
  },
  {
    title: 'Chapter 2: Neurons and Neural Networks',
    content: `
Neurons are the fundamental units of the brain and nervous system, responsible for receiving and transmitting information throughout the body. They communicate with each other through electrical and chemical signals at specialized junctions called synapses.

A typical neuron consists of three main parts:

1. **Cell Body (Soma)**: Contains the nucleus and is responsible for the neuron's metabolic functions.

2. **Dendrites**: Branch-like extensions that receive signals from other neurons.

3. **Axon**: A long, slender projection that transmits electrical impulses away from the cell body to other neurons.

Neural networks are complex systems of interconnected neurons. When a neuron receives sufficient input from other neurons, it generates an action potential—an electrical impulse that travels down the axon and triggers the release of neurotransmitters at the synapses.

Neurotransmitters are chemical messengers that cross the synaptic gap and bind to receptors on the receiving neuron, potentially causing it to generate its own action potential. This is the basis for neural communication and information processing in the brain.
    `
  },
  {
    title: 'Chapter 3: Cognitive Functions',
    content: `
Cognitive functions encompass a wide range of mental processes that allow humans to perceive, think, learn, remember, and make decisions. These functions are distributed across various regions of the brain, working together in complex networks.

Some key cognitive functions include:

1. **Perception**: The process of recognizing and interpreting sensory information, which is handled by specialized areas of the brain. For example, visual information is processed in the occipital lobe, while auditory information is processed in the temporal lobe.

2. **Attention**: The ability to focus on specific stimuli while ignoring others. The prefrontal cortex and parietal lobe play important roles in attention.

3. **Memory**: The ability to encode, store, and retrieve information. Different types of memory involve different brain regions, with the hippocampus being crucial for the formation of new explicit memories.

4. **Language**: The ability to understand and produce spoken and written language. Key language areas include Broca's area (speech production) and Wernicke's area (language comprehension), typically located in the left hemisphere.

5. **Executive Functions**: Higher-order cognitive processes that control and coordinate other cognitive abilities, including planning, decision-making, problem-solving, and self-control. The prefrontal cortex is central to executive functions.

Understanding these cognitive functions is essential for comprehending how the brain works and how various neurological conditions can affect mental processes.
    `
  }
];

export const TextbookViewer: React.FC<TextbookViewerProps> = ({ item, onBack }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  
  const nextPage = () => {
    if (currentPage < textbookContent.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
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
            <p className="text-gray-400 text-sm">{item.author}</p>
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
      <div className="flex-1 overflow-y-auto bg-dark/30 rounded-lg p-6 border border-primary/20">
        <h3 className="font-pixel text-lg text-primary mb-4">
          {textbookContent[currentPage].title}
        </h3>
        <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
          {textbookContent[currentPage].content}
        </div>
      </div>
      
      {/* Page navigation */}
      <div className="flex items-center justify-between mt-4">
        <button 
          onClick={prevPage}
          disabled={currentPage === 0}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg ${currentPage === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-800'}`}
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        
        <div className="text-gray-400 text-sm">
          Page {currentPage + 1} of {textbookContent.length}
        </div>
        
        <button 
          onClick={nextPage}
          disabled={currentPage === textbookContent.length - 1}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg ${currentPage === textbookContent.length - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-800'}`}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
