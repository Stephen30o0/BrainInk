import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Brain, ArrowLeft, RefreshCw, CheckCircle, XCircle, Sparkles, X } from 'lucide-react';
import { chainlinkTestnetService } from '../../services/chainlinkTestnetService';

interface ChainlinkQuizGeneratorProps {
  onBack: () => void;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface GeneratedQuiz {
  id: string;
  topic: string;
  difficulty: string;
  questions: QuizQuestion[];
  generated_at: string;
  chainlink_request_id?: string;
}

export const ChainlinkQuizGenerator: React.FC<ChainlinkQuizGeneratorProps> = ({
  onBack
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<GeneratedQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizTopic, setQuizTopic] = useState('mathematics');
  const [quizDifficulty, setQuizDifficulty] = useState('medium');

  useEffect(() => {
    connectToChainlink();
  }, []);

  const connectToChainlink = async () => {
    try {
      const connected = await chainlinkTestnetService.connectWallet();
      setIsConnected(connected);
    } catch (err) {
      setError('Failed to connect to Chainlink services');
      console.error('Connection error:', err);
    }
  };

  const generateQuizWithChainlink = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    
    try {
      setIsGenerating(true);
      setError(null);

      console.log(`🧠 Generating AI quiz for topic: ${quizTopic}, difficulty: ${quizDifficulty}`);

      // Call Chainlink Functions to generate dynamic quiz via Kana AI
      const response = await chainlinkTestnetService.generateDynamicQuiz(quizTopic, quizDifficulty);
      
      if (response && response.success && response.question) {
        console.log(`✅ AI Quiz generated successfully:`, response);
        
        // Use the AI-generated quiz content
        const aiQuiz: GeneratedQuiz = {
          id: `quiz_${Date.now()}`,
          topic: quizTopic,
          difficulty: quizDifficulty,
          generated_at: response.generatedAt || new Date().toISOString(),
          chainlink_request_id: response.requestId,
          questions: [{
            id: 1,
            question: response.question,
            options: response.options,
            correctAnswer: response.correctAnswer,
            explanation: `This question was generated by Kana AI (${response.source || 'Gemini'}) via Chainlink Functions.`
          }]
        };

        setCurrentQuiz(aiQuiz);
        setCurrentQuestionIndex(0);
        setSelectedAnswers([]);
        console.log(`🎯 AI Quiz ready:`, aiQuiz);
      } else {
        throw new Error('Failed to generate AI quiz - backend may be unavailable');
      }
    } catch (err: any) {
      setError(err.message || 'Quiz generation failed. Please ensure the Kana AI backend is running.');
      console.error('Quiz generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    if (!currentQuiz) return 0;
    let correct = 0;
    currentQuiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setError(null);
  };

  if (!currentQuiz && !isGenerating) {
    return (
      <motion.div
        className="h-full flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="bg-dark/50 border-b border-primary/30 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-purple-400" />
            <h2 className="text-primary font-pixel text-lg">Chainlink Quiz Generator</h2>
            <div className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded">
              🧠 KANA AI + CHAINLINK FUNCTIONS
            </div>
          </div>
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-primary"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Sparkles size={48} className="text-purple-400 mx-auto mb-4" />
              <h3 className="font-pixel text-2xl text-purple-400 mb-2">AI-Powered Quiz Generation</h3>
              <p className="text-gray-400">
                Generate personalized quizzes using Chainlink Functions for dynamic, 
                AI-powered educational content via Kana AI and Gemini.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 text-red-300">
                <div className="flex items-center gap-2">
                  <XCircle size={20} />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="bg-dark/50 rounded-lg p-6 border border-primary/20">
                <h4 className="font-pixel text-primary mb-4">Quiz Configuration</h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Topic</label>                    <select
                      value={quizTopic}
                      onChange={(e) => setQuizTopic(e.target.value)}
                      className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-primary"
                      disabled={isGenerating}
                    >
                      <option value="mathematics">Mathematics</option>
                      <option value="physics">Physics</option>
                      <option value="chemistry">Chemistry</option>
                      <option value="biology">Biology</option>
                      <option value="history">History</option>
                      <option value="geography">Geography</option>
                      <option value="literature">Literature</option>
                      <option value="computer-science">Computer Science</option>
                      <option value="psychology">Psychology</option>
                      <option value="economics">Economics</option>
                      <option value="astronomy">Astronomy</option>
                      <option value="art-history">Art History</option>
                      <option value="philosophy">Philosophy</option>
                      <option value="environmental-science">Environmental Science</option>
                      <option value="anatomy">Anatomy</option>
                      <option value="genetics">Genetics</option>
                      <option value="world-languages">World Languages</option>
                      <option value="music-theory">Music Theory</option>
                      <option value="engineering">Engineering</option>
                      <option value="archaeology">Archaeology</option>
                      <option value="neuroscience">Neuroscience</option>
                      <option value="statistics">Statistics</option>
                      <option value="geology">Geology</option>
                      <option value="political-science">Political Science</option>
                      <option value="sociology">Sociology</option>
                      <option value="blockchain">Blockchain</option>
                      <option value="cryptography">Cryptography</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Difficulty</label>
                    <select
                      value={quizDifficulty}
                      onChange={(e) => setQuizDifficulty(e.target.value)}
                      className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-primary"
                      disabled={isGenerating}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={generateQuizWithChainlink}
                  disabled={!isConnected || isGenerating}
                  className="w-full mt-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-lg font-pixel disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-blue-600 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      Generating AI Quiz...
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      Generate Quiz with Kana AI
                    </>
                  )}
                </button>

                {!isConnected && (
                  <p className="text-orange-400 text-sm mt-2 text-center">
                    Please connect your wallet to generate quizzes
                  </p>
                )}
              </div>

              <div className="bg-dark/50 rounded-lg p-6 border border-primary/20">
                <h4 className="font-pixel text-primary mb-4">How It Works</h4>
                <div className="space-y-3 text-gray-400 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-xs font-bold">1</div>
                    <div>
                      <strong>Smart Contract Trigger:</strong> Your request initiates a Chainlink Automation upkeep
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-xs font-bold">2</div>
                    <div>
                      <strong>Chainlink Functions:</strong> Securely calls the Kana AI backend to generate quiz content
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-xs font-bold">3</div>
                    <div>
                      <strong>AI Generation:</strong> Gemini AI creates personalized questions based on your topic and difficulty
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-xs font-bold">4</div>
                    <div>
                      <strong>On-Chain Storage:</strong> Quiz data is returned and can be stored on Base Sepolia
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / currentQuiz!.questions.length) * 100);

    return (
      <motion.div
        className="h-full flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="bg-dark/50 border-b border-primary/30 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-purple-400" />
            <h2 className="text-primary font-pixel text-lg">Quiz Results</h2>
          </div>
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-primary"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              {percentage >= 70 ? (
                <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
              ) : (
                <XCircle size={64} className="text-red-400 mx-auto mb-4" />
              )}
              
              <h3 className="font-pixel text-3xl text-primary mb-2">
                {score}/{currentQuiz!.questions.length}
              </h3>
              <p className="text-gray-400 text-lg">{percentage}% Correct</p>
              
              <div className="bg-dark/50 rounded-lg p-4 mt-6 border border-primary/20">
                <p className="text-sm text-gray-400">
                  Quiz generated by <span className="text-purple-400">Kana AI (Gemini)</span> via <span className="text-blue-400">Chainlink Functions</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Request ID: {currentQuiz!.chainlink_request_id}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={resetQuiz}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-lg font-pixel hover:from-purple-600 hover:to-blue-600"
              >
                Generate Another Quiz
              </button>
              
              <button
                onClick={onBack}
                className="w-full bg-dark/50 border border-primary/30 text-primary py-3 px-6 rounded-lg font-pixel hover:bg-dark/70"
              >
                Back to Library
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (currentQuiz) {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const isAnswered = selectedAnswers[currentQuestionIndex] !== undefined;

    return (
      <motion.div
        className="h-full flex flex-col"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="bg-dark/50 border-b border-primary/30 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-purple-400" />
            <h2 className="text-primary font-pixel text-lg">
              Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
            </h2>
            <div className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded">
              🧠 KANA AI
            </div>
          </div>
          <button
            onClick={resetQuiz}
            className="p-2 text-gray-400 hover:text-primary"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <div className="bg-dark/50 rounded-lg p-6 border border-primary/20 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-400">
                  {currentQuiz.topic.charAt(0).toUpperCase() + currentQuiz.topic.slice(1)} • {currentQuiz.difficulty.charAt(0).toUpperCase() + currentQuiz.difficulty.slice(1)}
                </span>
                <span className="text-sm text-purple-400">
                  Generated by Kana AI
                </span>
              </div>
              
              <h3 className="font-pixel text-xl text-primary mb-6">
                {currentQuestion.question}
              </h3>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      selectedAnswers[currentQuestionIndex] === index
                        ? 'border-purple-400 bg-purple-500/20 text-purple-300'
                        : 'border-primary/30 bg-dark/30 text-gray-300 hover:border-primary/50 hover:bg-dark/50'
                    }`}
                  >
                    <span className="font-pixel text-sm mr-3">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </button>
                ))}
              </div>

              {currentQuestion.explanation && isAnswered && (
                <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    <strong>Explanation:</strong> {currentQuestion.explanation}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 bg-dark/50 border border-primary/30 text-primary rounded-lg font-pixel disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <button
                onClick={handleNextQuestion}
                disabled={!isAnswered}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-pixel disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-blue-600"
              >
                {currentQuestionIndex === currentQuiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              </button>
            </div>

            <div className="mt-4 text-center text-sm text-gray-400">
              Progress: {currentQuestionIndex + 1} / {currentQuiz.questions.length}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <RefreshCw size={48} className="text-purple-400 mx-auto mb-4 animate-spin" />
        <p className="text-primary font-pixel">Loading Quiz Generator...</p>
      </div>
    </div>
  );
};
