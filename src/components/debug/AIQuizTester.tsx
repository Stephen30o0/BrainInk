import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, RefreshCw } from 'lucide-react';

export const AIQuizTester: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testKanaAI = async () => {
    setIsLoading(true);
    setError(null);
    setQuiz(null);

    try {      // Test the Kana AI endpoint directly
      const BACKEND_BASE_URL = import.meta.env.VITE_KANA_API_BASE_URL?.replace('/api/kana', '') || 'http://localhost:10000';
      
      console.log('Testing Kana AI at:', BACKEND_BASE_URL);
      
      const response = await fetch(`${BACKEND_BASE_URL}/api/kana/generate-daily-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: 'blockchain',
          difficulty: 'medium',
          numQuestions: 1
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`Kana API request failed: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (!data.quiz || !data.quiz[0]) {
        throw new Error('Invalid quiz format from Kana AI');
      }

      setQuiz(data.quiz[0]);
      
    } catch (err: any) {
      console.error('Error testing Kana AI:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed top-4 right-4 bg-dark/95 border border-primary/30 rounded-lg p-4 max-w-md z-50"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Brain size={16} className="text-blue-400" />
        <span className="font-pixel text-blue-400 text-sm">KANA AI TESTER</span>
      </div>

      <button
        onClick={testKanaAI}
        disabled={isLoading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-pixel py-2 px-4 rounded transition-all mb-4 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <RefreshCw size={14} className="animate-spin" />
            Testing AI...
          </>
        ) : (
          <>
            <Zap size={14} />
            Test Kana AI
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded mb-4 text-xs">
          <strong>Error:</strong> {error}
        </div>
      )}

      {quiz && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-400 p-3 rounded text-xs">
          <strong>✅ AI Generated Quiz:</strong>
          <div className="mt-2 text-white">
            <strong>Q:</strong> {quiz.question}
          </div>
          <div className="mt-1">
            <strong>Options:</strong>
            <ul className="list-disc list-inside mt-1">
              {quiz.options?.map((option: string, index: number) => (
                <li key={index} className={option === quiz.answer ? 'text-green-300' : ''}>{option}</li>
              ))}
            </ul>
          </div>
          <div className="mt-1">
            <strong>Answer:</strong> {quiz.answer}
          </div>
        </div>
      )}
    </motion.div>
  );
};
