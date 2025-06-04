import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, BookOpen, Award, TrophyIcon, Zap, CheckCircle, ChevronRight, Brain, ArrowLeft, Image } from 'lucide-react';

interface GameSetupProps {
  mode: 'quick' | 'ranked';
  onStart: (settings: GameSettings) => void;
  onBack: () => void;
  userRank?: {
    tier: string;
    division: number;
    points: number;
  };
}

export interface GameSettings {
  mode: 'quick' | 'ranked';
  subjects: string[];
  timeLimit: number; // in minutes
  questionTypes: ('multiple-choice' | 'theory' | 'image-based')[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
}

export const GameSetup: React.FC<GameSetupProps> = ({ mode, onStart, onBack, userRank }) => {
  // Default settings
  const [settings, setSettings] = useState<GameSettings>({
    mode,
    subjects: [],
    timeLimit: mode === 'quick' ? 5 : 10,
    questionTypes: ['multiple-choice'],
    difficulty: mode === 'quick' ? 'mixed' : 'medium',
  });
  
  // Step tracking for multi-step setup
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = mode === 'quick' ? 2 : 3; // Ranked has an extra confirmation step
  
  // Available subjects
  const availableSubjects = [
    { id: 'math', name: 'Mathematics', icon: '🧮' },
    { id: 'science', name: 'Science', icon: '🧪' },
    { id: 'cs', name: 'Computer Science', icon: '💻' },
    { id: 'history', name: 'History', icon: '📜' },
    { id: 'geography', name: 'Geography', icon: '🌍' },
    { id: 'language', name: 'Language Arts', icon: '📝' },
    { id: 'art', name: 'Art & Music', icon: '🎨' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
  ];
  
  // Time limit options
  const timeLimitOptions = mode === 'quick' 
    ? [3, 5, 7] // minutes for quick mode
    : [10, 15, 20]; // minutes for ranked mode
  
  // Question type options
  const questionTypeOptions = [
    { id: 'multiple-choice', name: 'Multiple Choice', icon: <CheckCircle size={16} /> },
    { id: 'theory', name: 'Theory Questions', icon: <BookOpen size={16} /> },
    { id: 'image-based', name: 'Visual Questions', icon: <Image size={16} /> },
  ];
  
  // Difficulty options
  const difficultyOptions = [
    { id: 'easy', name: 'Easy', color: 'text-green-400' },
    { id: 'medium', name: 'Medium', color: 'text-yellow-400' },
    { id: 'hard', name: 'Hard', color: 'text-red-400' },
    { id: 'mixed', name: 'Mixed', color: 'text-purple-400' },
  ];
  
  // Calculate potential XP reward
  const calculateXpReward = () => {
    let baseXp = mode === 'quick' ? 100 : 250;
    
    // Add bonus for each selected subject
    baseXp += settings.subjects.length * 20;
    
    // Add bonus for time limit
    baseXp += settings.timeLimit * 5;
    
    // Add bonus for difficulty
    if (settings.difficulty === 'medium') baseXp *= 1.2;
    if (settings.difficulty === 'hard') baseXp *= 1.5;
    
    // Add bonus for question types
    if (settings.questionTypes.includes('theory')) baseXp *= 1.1;
    if (settings.questionTypes.includes('image-based')) baseXp *= 1.15;
    
    return Math.floor(baseXp);
  };
  
  // Toggle subject selection
  const toggleSubject = (subjectId: string) => {
    setSettings(prev => {
      if (prev.subjects.includes(subjectId)) {
        return { ...prev, subjects: prev.subjects.filter(id => id !== subjectId) };
      } else {
        // For quick match, limit to 3 subjects max
        if (mode === 'quick' && prev.subjects.length >= 3) {
          return prev;
        }
        return { ...prev, subjects: [...prev.subjects, subjectId] };
      }
    });
  };
  
  // Toggle question type selection
  const toggleQuestionType = (typeId: 'multiple-choice' | 'theory' | 'image-based') => {
    setSettings(prev => {
      if (prev.questionTypes.includes(typeId)) {
        // Don't allow removing all types
        if (prev.questionTypes.length <= 1) return prev;
        return { ...prev, questionTypes: prev.questionTypes.filter(id => id !== typeId) };
      } else {
        return { ...prev, questionTypes: [...prev.questionTypes, typeId] };
      }
    });
  };
  
  // Set time limit
  const setTimeLimit = (time: number) => {
    setSettings(prev => ({ ...prev, timeLimit: time }));
  };
  
  // Set difficulty
  const setDifficulty = (difficulty: 'easy' | 'medium' | 'hard' | 'mixed') => {
    setSettings(prev => ({ ...prev, difficulty }));
  };
  
  // Go to next step
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onStart(settings);
    }
  };
  
  // Check if current step is valid to proceed
  const isStepValid = () => {
    if (currentStep === 1) {
      return settings.subjects.length > 0;
    }
    return true;
  };
  
  // Render step 1: Subject selection
  const renderSubjectSelection = () => (
    <div>
      <h3 className="font-pixel text-lg text-primary mb-4">
        Select Subjects
        {mode === 'quick' && <span className="text-gray-400 text-sm ml-2">(Up to 3)</span>}
      </h3>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        {availableSubjects.map(subject => (
          <button
            key={subject.id}
            onClick={() => toggleSubject(subject.id)}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${settings.subjects.includes(subject.id) 
              ? 'border-primary bg-primary/10 text-primary' 
              : 'border-gray-700 bg-dark/50 text-gray-300 hover:bg-dark/70'}`}
          >
            <div className="text-xl">{subject.icon}</div>
            <span>{subject.name}</span>
          </button>
        ))}
      </div>
      
      {/* Question types */}
      <h3 className="font-pixel text-lg text-primary mb-4">Question Types</h3>
      
      <div className="flex flex-wrap gap-3 mb-6">
        {questionTypeOptions.map(type => (
          <button
            key={type.id}
            onClick={() => toggleQuestionType(type.id as any)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${settings.questionTypes.includes(type.id as any) 
              ? 'border-primary bg-primary/10 text-primary' 
              : 'border-gray-700 bg-dark/50 text-gray-300 hover:bg-dark/70'}`}
          >
            {type.icon}
            <span>{type.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
  
  // Render step 2: Time and difficulty
  const renderTimeAndDifficulty = () => (
    <div>
      <h3 className="font-pixel text-lg text-primary mb-4">Time Limit</h3>
      
      <div className="flex gap-3 mb-6">
        {timeLimitOptions.map(time => (
          <button
            key={time}
            onClick={() => setTimeLimit(time)}
            className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${settings.timeLimit === time 
              ? 'border-primary bg-primary/10 text-primary' 
              : 'border-gray-700 bg-dark/50 text-gray-300 hover:bg-dark/70'}`}
          >
            <Clock size={20} />
            <span className="text-lg font-bold">{time}</span>
            <span className="text-xs">minutes</span>
          </button>
        ))}
      </div>
      
      <h3 className="font-pixel text-lg text-primary mb-4">Difficulty</h3>
      
      <div className="flex gap-3 mb-6">
        {difficultyOptions.map(diff => (
          <button
            key={diff.id}
            onClick={() => setDifficulty(diff.id as any)}
            className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${settings.difficulty === diff.id 
              ? 'border-primary bg-primary/10' 
              : 'border-gray-700 bg-dark/50 text-gray-300 hover:bg-dark/70'}`}
          >
            <span className={`text-lg font-bold ${diff.color}`}>{diff.name}</span>
          </button>
        ))}
      </div>
      
      {/* XP reward preview */}
      <div className="bg-dark/30 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Zap className="text-yellow-400" size={20} />
          </div>
          <div>
            <h4 className="text-white">Potential Reward</h4>
            <p className="text-gray-400 text-xs">Complete all questions to earn</p>
          </div>
        </div>
        <div className="text-yellow-400 font-pixel text-xl">
          {calculateXpReward()} XP
        </div>
      </div>
    </div>
  );
  
  // Render step 3: Confirmation (Ranked only)
  const renderConfirmation = () => (
    <div className="flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
        <TrophyIcon size={40} className="text-primary" />
      </div>
      
      <h3 className="font-pixel text-lg text-primary mb-2">Ready for Ranked Match</h3>
      <p className="text-gray-300 mb-6">Your performance will affect your ranking</p>
      
      {/* Current rank display */}
      <div className="bg-dark/30 border border-primary/20 rounded-lg p-4 w-full mb-6">
        <h4 className="text-gray-400 text-sm mb-2">Current Rank</h4>
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Award size={28} className="text-purple-400" />
            </div>
            <div className="text-left">
              <div className="text-purple-400 font-bold">{userRank?.tier || 'Silver'}</div>
              <div className="text-gray-400 text-xs">Division {userRank?.division || 2}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-primary font-pixel text-lg">{userRank?.points || 1250} LP</div>
            <div className="text-gray-400 text-xs">Rank Points</div>
          </div>
        </div>
      </div>
      
      <div className="bg-dark/30 border border-primary/20 rounded-lg p-4 w-full mb-6">
        <h4 className="text-gray-400 text-sm mb-2">Match Settings</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-gray-400" />
            <span className="text-gray-300">
              {settings.subjects.length} subject{settings.subjects.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <span className="text-gray-300">{settings.timeLimit} minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-gray-400" />
            <span className="text-gray-300">{settings.questionTypes.length} question types</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-gray-400" />
            <span className="text-gray-300 capitalize">{settings.difficulty} difficulty</span>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-dark/50 border-b border-primary/30 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {mode === 'quick' ? (
            <Zap size={20} className="text-blue-400" />
          ) : (
            <Award size={20} className="text-purple-400" />
          )}
          <h2 className="font-pixel text-lg">
            {mode === 'quick' ? (
              <span className="text-blue-400">Quick Match</span>
            ) : (
              <span className="text-purple-400">Ranked Match</span>
            )}
          </h2>
        </div>
        <button 
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-primary"
        >
          <ArrowLeft size={20} />
        </button>
      </div>
      
      {/* Steps indicator */}
      <div className="px-6 pt-4 flex gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div 
            key={index}
            className={`h-1 flex-1 rounded-full ${index + 1 <= currentStep ? 'bg-primary' : 'bg-gray-700'}`}
          />
        ))}
      </div>
      
      {/* Content area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {currentStep === 1 && renderSubjectSelection()}
        {currentStep === 2 && renderTimeAndDifficulty()}
        {currentStep === 3 && renderConfirmation()}
      </div>
      
      {/* Footer with navigation */}
      <div className="p-4 border-t border-primary/30 flex justify-between">
        <button
          onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onBack()}
          className="px-4 py-2 bg-dark/50 hover:bg-dark/70 text-white rounded-lg transition-colors"
        >
          {currentStep > 1 ? 'Back' : 'Cancel'}
        </button>
        
        <button
          onClick={nextStep}
          disabled={!isStepValid()}
          className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-colors ${isStepValid() 
            ? 'bg-primary text-dark hover:bg-primary/90' 
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
        >
          {currentStep < totalSteps ? 'Next' : mode === 'quick' ? 'Start Match' : 'Begin Ranked Match'}
          {isStepValid() && currentStep < totalSteps && <ChevronRight size={18} />}
        </button>
      </div>
    </div>
  );
};
