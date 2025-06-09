import React, { useState, useRef } from 'react';
import { ArrowLeft, Play, Pause, Volume1, Volume2, VolumeX, Maximize, List, ThumbsUp, MessageSquare } from 'lucide-react';

// Define CoreApiAuthor if not imported (ensure consistency with LibraryHub.tsx)
interface CoreApiAuthor {
  name: string;
}

interface LibraryItem {
  id: string;
  title: string;
  authors: CoreApiAuthor[]; // Changed from author: string
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [volume, setVolume] = useState(1);

  const fileUrl = `http://localhost:3001/study_material_files/${item.storedFilename}`;

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused || videoRef.current.ended) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  // Toggle mute/unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
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
            <p className="text-gray-400 text-sm" title={item.authors ? item.authors.map(a => a.name).join(', ') : 'N/A'}>{item.authors ? item.authors.map(a => a.name).join(', ') : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Video player area */}
      <div className="bg-black rounded-lg overflow-hidden mb-4 relative aspect-video">
        {item.mimetype && item.mimetype.startsWith('video/') ? (
          <video
            ref={videoRef}
            className="w-full h-full"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
            onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
            onVolumeChange={() => videoRef.current && (setIsMuted(videoRef.current.muted), setVolume(videoRef.current.volume))}
            onClick={togglePlay} // Allow clicking video to play/pause
          >
            <source src={fileUrl} type={item.mimetype} />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 text-white p-4">
            <p className="text-xl mb-2">Cannot play this file type directly.</p>
            <p className="text-gray-400 text-sm mb-4">MIME type: {item.mimetype}</p>
            <a 
              href={fileUrl} 
              download={item.originalFilename || item.storedFilename} 
              className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
            >
              Download File
            </a>
          </div>
        )}

        {/* Video controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress bar */}
          <input 
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={(e) => {
              if (videoRef.current) videoRef.current.currentTime = Number(e.target.value);
            }}
            className="w-full h-1 bg-gray-600 rounded-full mb-3 cursor-pointer accent-primary appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
          />

          {/* Time display */}
          <div className="text-xs text-white mb-2">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Main controls row */}
          <div className="flex items-center justify-between">
            {/* Left controls */}
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlay}
                className="p-1 text-white hover:text-primary transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button 
                onClick={toggleMute}
                className="p-1 text-white hover:text-primary transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX size={20} />
                ) : volume === 0 ? (
                  <VolumeX size={20} />
                ) : volume < 0.5 ? (
                  <Volume1 size={20} />
                ) : (
                  <Volume2 size={20} />
                )}
              </button>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  if (videoRef.current) {
                    const newVolume = Number(e.target.value);
                    videoRef.current.volume = newVolume;
                    setVolume(newVolume);
                    if (newVolume > 0 && videoRef.current.muted) {
                      videoRef.current.muted = false; // Unmute if volume is adjusted while muted
                      setIsMuted(false);
                    }
                  }
                }}
                className="w-20 h-1 bg-gray-600 rounded-full cursor-pointer accent-primary appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                aria-label="Volume"
              />
              
              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
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
