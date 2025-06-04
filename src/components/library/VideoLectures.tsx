import React, { useState } from 'react';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, List, ThumbsUp, MessageSquare } from 'lucide-react';

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

interface VideoLecturesProps {
  item: LibraryItem;
  onBack: () => void;
}

// Mock related videos
const relatedVideos = [
  {
    id: 'video-2',
    title: 'The Role of Neurotransmitters',
    author: 'BrainLab Academy',
    duration: '42:15',
    thumbnail: 'ud83eudde0'
  },
  {
    id: 'video-3',
    title: 'Brain Plasticity and Learning',
    author: 'Neuroscience Institute',
    duration: '36:08',
    thumbnail: 'ud83eudde0'
  },
  {
    id: 'video-4',
    title: 'Neuroimaging Techniques',
    author: 'Medical Research Channel',
    duration: '28:30',
    thumbnail: 'ud83dudcfa'
  }
];

export const VideoLectures: React.FC<VideoLecturesProps> = ({ item, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showComments, setShowComments] = useState(false);
  
  // Mock video duration in seconds
  const videoDuration = 1120; // 18:40
  
  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Toggle mute/unmute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Format time (seconds) to MM:SS
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
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
      </div>
      
      {/* Video player area */}
      <div className="bg-black rounded-lg overflow-hidden mb-4 relative aspect-video">
        {/* Video placeholder - in a real app, this would be a video element */}
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          {!isPlaying && (
            <div className="text-6xl">{item.coverImage}</div>
          )}
          {isPlaying && (
            <div className="text-white text-center">
              <p className="text-xl mb-2">Video is playing...</p>
              <p className="text-gray-400 text-sm">
                (This is a mockup - no actual video is playing)
              </p>
            </div>
          )}
        </div>
        
        {/* Video controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress bar */}
          <div className="w-full h-1 bg-gray-600 rounded-full mb-3 cursor-pointer">
            <div 
              className="h-full bg-primary rounded-full relative" 
              style={{ width: `${(currentTime / videoDuration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-primary rounded-full"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            {/* Left controls */}
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlay}
                className="p-1 text-white hover:text-primary transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <button 
                onClick={toggleMute}
                className="p-1 text-white hover:text-primary transition-colors"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              
              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(videoDuration)}
              </div>
            </div>
            
            {/* Right controls */}
            <div className="flex items-center gap-4">
              <button className="p-1 text-white hover:text-primary transition-colors">
                <List size={20} />
              </button>
              <button className="p-1 text-white hover:text-primary transition-colors">
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Video info and actions */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div>
          <div className="text-gray-400 text-sm">
            {item.views.toLocaleString()} views • Published {new Date(item.publishDate).toLocaleDateString()}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-gray-400 hover:text-primary transition-colors">
            <ThumbsUp size={20} />
            <span>{Math.floor(item.rating * 100)}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1 transition-colors ${showComments ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}
          >
            <MessageSquare size={20} />
            <span>32</span>
          </button>
        </div>
      </div>
      
      {/* Tabs content area */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Video description and comments */}
        <div className="flex-1 bg-dark/30 rounded-lg p-6 border border-primary/20 overflow-y-auto">
          {showComments ? (
            <div>
              <h3 className="font-pixel text-lg text-primary mb-4">Comments (32)</h3>
              
              {/* Comment input */}
              <div className="mb-6">
                <textarea 
                  placeholder="Add a comment..."
                  className="w-full bg-dark/50 border border-primary/30 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-primary/60 resize-none"
                  rows={2}
                />
                <div className="flex justify-end mt-2">
                  <button className="px-4 py-1.5 bg-primary/20 text-primary rounded-lg text-sm hover:bg-primary/30 transition-colors">
                    Comment
                  </button>
                </div>
              </div>
              
              {/* Comments list */}
              <div className="space-y-4">
                <div className="border-b border-gray-700 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary">JD</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">Dr. Jane Doe</span>
                        <span className="text-gray-500 text-xs">2 days ago</span>
                      </div>
                      <p className="text-gray-300 mt-1">
                        Excellent explanation of memory formation! I particularly appreciated the clear breakdown of the different memory types and their neural correlates.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border-b border-gray-700 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-500">MS</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">Mark Smith</span>
                        <span className="text-gray-500 text-xs">1 week ago</span>
                      </div>
                      <p className="text-gray-300 mt-1">
                        The visual diagrams really helped me understand the process. Could you possibly do a follow-up video on the consolidation of short-term to long-term memory?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-pixel text-lg text-primary mb-4">Description</h3>
              <p className="text-gray-200 mb-4 leading-relaxed">{item.description}</p>
              <p className="text-gray-200 mb-4 leading-relaxed">
                This lecture explores the fascinating process of memory formation in the human brain. We'll cover the three main stages of memory processing: encoding, storage, and retrieval, and examine the neural structures involved in each stage.
              </p>
              <p className="text-gray-200 mb-4 leading-relaxed">
                Key topics covered in this lecture:
              </p>
              <ul className="list-disc pl-5 text-gray-200 space-y-1 mb-4">
                <li>The role of the hippocampus in memory formation</li>
                <li>Short-term vs. long-term memory systems</li>
                <li>Cellular and molecular mechanisms of memory</li>
                <li>Memory consolidation and reconsolidation</li>
                <li>Factors affecting memory formation and recall</li>
              </ul>
              <p className="text-gray-200">
                This lecture is part of our Cognitive Neuroscience series and is suitable for undergraduate students or anyone with a basic understanding of neuroscience concepts.
              </p>
            </div>
          )}
        </div>
        
        {/* Related videos */}
        <div className="w-72 bg-dark/30 rounded-lg p-4 border border-primary/20 overflow-y-auto hidden md:block">
          <h3 className="font-pixel text-primary mb-3">Related Videos</h3>
          <div className="space-y-3">
            {relatedVideos.map((video) => (
              <div 
                key={video.id}
                className="flex gap-3 p-2 rounded-lg hover:bg-dark/50 cursor-pointer transition-colors"
              >
                <div className="text-2xl">{video.thumbnail}</div>
                <div>
                  <h4 className="text-white text-sm font-medium leading-tight">{video.title}</h4>
                  <p className="text-gray-400 text-xs mt-1">{video.author}</p>
                  <p className="text-gray-500 text-xs mt-1">{video.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
