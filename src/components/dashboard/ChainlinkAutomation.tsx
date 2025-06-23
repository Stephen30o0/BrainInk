import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Zap, CheckCircle, XCircle, RefreshCw, Star } from 'lucide-react';
import { chainlinkTestnetService } from '../../services/chainlinkTestnetService';

interface DailyChallenge {
  id: number;
  day: number;
  question: string;
  options: string[];
  correctAnswer: number;
  xpReward: number;
  completed: boolean;
  userAnswer?: number;
  generatedAt: string;
  isToday: boolean;
  topic?: string; // Optional topic field for tracking
}

interface ChainlinkAutomationProps {
  onChallengeComplete?: (xpEarned: number) => void;
}

export const ChainlinkAutomation: React.FC<ChainlinkAutomationProps> = ({
  onChallengeComplete
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [todaysChallenge, setTodaysChallenge] = useState<DailyChallenge | null>(null);
  const [challengeHistory, setChallengeHistory] = useState<DailyChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    loadAutomationData();
  }, []);

  const loadAutomationData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const connected = await chainlinkTestnetService.connectWallet();
      setIsConnected(connected);

      if (connected) {
        await loadTodaysChallenge();
        await loadChallengeHistory();
        calculateStreak();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Chainlink Automation');
      console.error('Automation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTodaysChallenge = async () => {
    try {
      // For demo purposes, always generate AI-powered challenges
      // This showcases the Chainlink Functions + Kana AI integration
      await generateTodaysChallenge();
    } catch (err) {
      console.error('Error loading today\'s challenge:', err);
      setError('Failed to load daily challenge. Please ensure the Kana AI backend is running.');
    }
  };

  const generateTodaysChallenge = async () => {
    try {
      setIsLoading(true);
        // Use Chainlink Functions + Kana AI to generate dynamic content
      const currentTopic = getDailyTopic();
      const quizData = await chainlinkTestnetService.generateDynamicQuiz(currentTopic, 'medium');
      
      if (quizData && quizData.success) {
        const today = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
        
        setTodaysChallenge({
          id: today,
          day: today,
          question: quizData.question,
          options: quizData.options,
          correctAnswer: quizData.correctAnswer,
          xpReward: quizData.xpReward,
          completed: false,
          generatedAt: quizData.generatedAt,
          isToday: true,
          topic: currentTopic
        });
        
        console.log(`✅ Generated AI-powered challenge: ${quizData.source || 'Kana AI'}`);
      } else {
        throw new Error('Failed to generate quiz via Kana AI - backend may be unavailable');
      }
    } catch (err) {
      console.error('Error generating AI challenge:', err);
      setError('Unable to generate daily challenge. Please ensure the Kana AI backend is running on port 10000.');
    } finally {
      setIsLoading(false);
    }
  };  // Get daily topic with more variety - includes hour for more frequent rotation
  const getDailyTopic = () => {
    const topics = [
      'mathematics',
      'physics',
      'chemistry',
      'biology',
      'history',
      'geography',
      'literature',
      'computer-science',
      'psychology',
      'economics',
      'astronomy',
      'art-history',
      'philosophy',
      'environmental-science',
      'anatomy',
      'genetics',
      'world-languages',
      'music-theory',
      'engineering',
      'archaeology',
      'neuroscience',
      'statistics',
      'geology',
      'political-science',
      'sociology'
    ];
    // Use hour-based rotation for more variety (changes every 3 hours)
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const hourBlock = Math.floor(now.getHours() / 3); // Changes every 3 hours (0, 3, 6, 9, 12, 15, 18, 21)
    const topicIndex = (dayOfYear * 8 + hourBlock) % topics.length;
    return topics[topicIndex];
  };

  const loadChallengeHistory = async () => {
    // Mock challenge history for the past week
    const history: DailyChallenge[] = [];
    const today = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    
    for (let i = 1; i <= 7; i++) {
      const day = today - i;
      const completed = Math.random() > 0.3; // 70% completion rate for demo
      
      history.push({
        id: day,
        day: day,
        question: `Previous challenge for day ${day}`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: Math.floor(Math.random() * 4),
        xpReward: 50,
        completed: completed,
        userAnswer: completed ? Math.floor(Math.random() * 4) : undefined,
        generatedAt: new Date(day * 24 * 60 * 60 * 1000).toISOString(),
        isToday: false
      });
    }
    
    setChallengeHistory(history);
  };

  const calculateStreak = () => {
    // Calculate current streak from challenge history
    let currentStreak = 0;
    const sortedHistory = challengeHistory.sort((a, b) => b.day - a.day);
    
    for (const challenge of sortedHistory) {
      if (challenge.completed) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    setStreak(currentStreak);
  };

  const submitAnswer = async () => {
    if (!todaysChallenge || selectedAnswer === null || !isConnected) return;

    try {
      setIsSubmitting(true);
      // Submit answer to smart contract (for demo, we simulate this)
      // await chainlinkTestnetService.submitDailyChallengeAnswer(todaysChallenge.day, selectedAnswer);
      
      const isCorrect = selectedAnswer === todaysChallenge.correctAnswer;
      const xpEarned = isCorrect ? todaysChallenge.xpReward : Math.floor(todaysChallenge.xpReward * 0.25);
      
      // Update challenge state
      setTodaysChallenge({
        ...todaysChallenge,
        completed: true,
        userAnswer: selectedAnswer
      });
      
      setShowResult(true);
      
      if (onChallengeComplete) {
        onChallengeComplete(xpEarned);
      }
      
      // Update streak
      if (isCorrect) {
        setStreak(prev => prev + 1);
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer');
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  const refreshChallenge = async () => {
    setTodaysChallenge(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setError(null);
    
    // Generate a new challenge with a random topic for variety
    const topics = [
      'mathematics', 'physics', 'chemistry', 'biology', 'history', 'geography',
      'literature', 'computer-science', 'psychology', 'economics', 'astronomy',
      'art-history', 'philosophy', 'environmental-science', 'anatomy', 'genetics',
      'world-languages', 'music-theory', 'engineering', 'archaeology', 'neuroscience',
      'statistics', 'geology', 'political-science', 'sociology'
    ];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    try {
      setIsLoading(true);
      const quizData = await chainlinkTestnetService.generateDynamicQuiz(randomTopic, 'medium');
      
      if (quizData && quizData.success) {
        const now = Date.now();
        setTodaysChallenge({
          id: now,
          day: Math.floor(now / (24 * 60 * 60 * 1000)),
          question: quizData.question,
          options: quizData.options,
          correctAnswer: quizData.correctAnswer,
          xpReward: quizData.xpReward,
          completed: false,
          generatedAt: quizData.generatedAt,
          isToday: true,
          topic: randomTopic // Store the topic used
        });
        
        console.log(`✅ Generated fresh challenge: ${randomTopic}`);
      }
    } catch (err) {
      console.error('Error refreshing challenge:', err);
      setError('Failed to generate new challenge');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-dark/20 backdrop-blur-sm border border-primary/30 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-3">
          <RefreshCw className="text-primary animate-spin" size={24} />
          <span className="text-primary font-pixel">Loading Chainlink Automation...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-dark/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <XCircle className="text-red-400" size={24} />
            <h3 className="text-red-400 font-pixel text-lg">Automation Error</h3>
          </div>
          <button
            onClick={loadAutomationData}
            className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded font-pixel text-sm hover:bg-red-500/30"
          >
            Retry
          </button>
        </div>
        <p className="text-gray-300 text-sm">{error}</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-dark/20 backdrop-blur-sm border border-primary/30 rounded-lg p-6">
        <div className="text-center">
          <Zap className="text-primary mx-auto mb-4" size={48} />
          <h3 className="text-primary font-pixel text-lg mb-2">Connect Wallet</h3>
          <p className="text-gray-400 text-sm mb-4">
            Connect your wallet to access daily challenges powered by Chainlink Automation
          </p>
          <button
            onClick={() => chainlinkTestnetService.connectWallet()}
            className="px-4 py-2 bg-primary/20 border border-primary/30 text-primary rounded font-pixel hover:bg-primary/30"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Challenge */}
      <div className="bg-dark/20 backdrop-blur-sm border border-primary/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className="text-primary" size={24} />
            <h3 className="text-primary font-pixel text-lg">Daily Challenge</h3>
            <div className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded font-pixel">
              🧠 KANA AI
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-orange-400 font-pixel text-sm">
              🔥 {streak} streak
            </div>            <button
              onClick={refreshChallenge}
              className="p-2 text-gray-400 hover:text-primary transition-colors"
              title="Generate challenge with random topic"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {todaysChallenge ? (
          <div className="space-y-4">
            <div className="bg-dark/30 rounded-lg p-4 border border-primary/20">
              <div className="flex justify-between items-center mb-3">                <span className="text-purple-400 text-sm font-pixel">
                  Current Topic: {(todaysChallenge.topic || getDailyTopic()).split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
                <span className="text-blue-400 text-sm">
                  +{todaysChallenge.xpReward} XP
                </span>
              </div>
              
              <h4 className="text-primary font-pixel text-base mb-4">
                {todaysChallenge.question}
              </h4>

              {!todaysChallenge.completed && !showResult && (
                <div className="space-y-2">
                  {todaysChallenge.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedAnswer(index)}
                      className={`w-full p-3 rounded border text-left transition-all font-pixel text-sm ${
                        selectedAnswer === index
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-gray-600 bg-dark/30 text-gray-300 hover:border-primary/50'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}. {option}
                    </button>
                  ))}
                  
                  {selectedAnswer !== null && (
                    <button
                      onClick={submitAnswer}
                      disabled={isSubmitting}
                      className="w-full mt-4 px-4 py-2 bg-primary/20 border border-primary/30 text-primary rounded font-pixel hover:bg-primary/30 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                    </button>
                  )}
                </div>
              )}

              {(todaysChallenge.completed || showResult) && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    {todaysChallenge.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded border font-pixel text-sm ${
                          index === todaysChallenge.correctAnswer
                            ? 'border-green-500 bg-green-500/20 text-green-400'
                            : todaysChallenge.userAnswer === index && index !== todaysChallenge.correctAnswer
                            ? 'border-red-500 bg-red-500/20 text-red-400'
                            : 'border-gray-600 bg-dark/30 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{String.fromCharCode(65 + index)}. {option}</span>
                          <div className="flex items-center space-x-1">
                            {index === todaysChallenge.correctAnswer && (
                              <CheckCircle size={16} className="text-green-400" />
                            )}
                            {todaysChallenge.userAnswer === index && index !== todaysChallenge.correctAnswer && (
                              <XCircle size={16} className="text-red-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-600">
                    <div className="flex items-center space-x-2">
                      {todaysChallenge.userAnswer === todaysChallenge.correctAnswer ? (
                        <CheckCircle className="text-green-400" size={20} />
                      ) : (
                        <XCircle className="text-red-400" size={20} />
                      )}
                      <span className="font-pixel text-sm text-gray-300">
                        {todaysChallenge.userAnswer === todaysChallenge.correctAnswer 
                          ? `Correct! +${todaysChallenge.xpReward} XP` 
                          : `Incorrect. +${Math.floor(todaysChallenge.xpReward * 0.25)} XP`
                        }
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Generated by Kana AI
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-gray-400 font-pixel">No challenge available yet</p>
            <button
              onClick={generateTodaysChallenge}
              className="mt-4 px-4 py-2 bg-primary/20 border border-primary/30 text-primary rounded font-pixel hover:bg-primary/30"
            >
              Generate Challenge
            </button>
          </div>
        )}
      </div>

      {/* Challenge History */}
      <div className="bg-dark/20 backdrop-blur-sm border border-primary/30 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Star className="text-primary" size={24} />
          <h3 className="text-primary font-pixel text-lg">Challenge History</h3>
        </div>
        
        <div className="space-y-2">
          {challengeHistory.slice(0, 5).map((challenge, index) => (
            <div
              key={challenge.id}
              className="flex items-center justify-between p-3 bg-dark/30 rounded border border-gray-600"
            >
              <div className="flex items-center space-x-3">
                <div className="text-gray-400 font-pixel text-sm">
                  Day {challenge.day}
                </div>
                <div className="text-gray-300 text-sm truncate max-w-xs">
                  {challenge.question}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {challenge.completed ? (
                  <CheckCircle className="text-green-400" size={16} />
                ) : (
                  <XCircle className="text-gray-500" size={16} />
                )}
                <span className="text-gray-400 text-sm">
                  {challenge.completed ? '+50 XP' : 'Missed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Automation Stats */}
      <div className="bg-dark/20 backdrop-blur-sm border border-primary/30 rounded-lg p-6">
        <h3 className="text-primary font-pixel text-lg mb-4">Automation Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-pixel text-primary mb-1">{streak}</div>
            <div className="text-gray-400 text-sm">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-pixel text-primary mb-1">
              {challengeHistory.filter(c => c.completed).length}
            </div>
            <div className="text-gray-400 text-sm">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-pixel text-primary mb-1">
              {challengeHistory.filter(c => c.completed).length * 50}
            </div>
            <div className="text-gray-400 text-sm">Total XP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-pixel text-primary mb-1">
              {Math.round((challengeHistory.filter(c => c.completed).length / challengeHistory.length) * 100) || 0}%
            </div>
            <div className="text-gray-400 text-sm">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};
