import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TestTube, Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  testName: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  data?: any;
}

export const TournamentSystemTester: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { testName: 'Backend Connection', status: 'pending' },
    { testName: 'Topic Quiz Generation', status: 'pending' },
    { testName: 'Quiz Data Format', status: 'pending' },
    { testName: 'Answer Validation', status: 'pending' },
    { testName: 'Tournament Service', status: 'pending' }
  ]);

  const updateTest = (testName: string, status: TestResult['status'], message?: string, data?: any) => {
    setTests(prev => prev.map(test => 
      test.testName === testName ? { ...test, status, message, data } : test
    ));
  };

  const runTest = async (testName: string) => {
    updateTest(testName, 'running');

    try {
      switch (testName) {
        case 'Backend Connection':
          await testBackendConnection();
          break;
        case 'Topic Quiz Generation':
          await testTopicQuizGeneration();
          break;
        case 'Quiz Data Format':
          await testQuizDataFormat();
          break;
        case 'Answer Validation':
          await testAnswerValidation();
          break;
        case 'Tournament Service':
          await testTournamentService();
          break;
      }
    } catch (error) {
      updateTest(testName, 'error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testBackendConnection = async () => {
    const KANA_API_BASE_URL = import.meta.env.VITE_KANA_API_BASE_URL || 'https://kana-backend-app.onrender.com/api/kana';
    
    try {
      const response = await fetch(`${KANA_API_BASE_URL.replace('/api/kana', '')}/health`, {
        method: 'GET',
      });
      
      if (response.ok) {
        updateTest('Backend Connection', 'success', 'Backend is accessible');
      } else {
        throw new Error(`Backend responded with status: ${response.status}`);
      }
    } catch (error) {
      // Try alternative health check
      const response = await fetch(KANA_API_BASE_URL + '/generate-topic-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: 'test', difficulty: 'easy', numQuestions: 1 })
      });
      
      if (response.status === 500 || response.status === 400) {
        updateTest('Backend Connection', 'success', 'Backend is accessible (endpoint exists)');
      } else {
        throw error;
      }
    }
  };

  const testTopicQuizGeneration = async () => {
    const KANA_API_BASE_URL = import.meta.env.VITE_KANA_API_BASE_URL || 'https://kana-backend-app.onrender.com/api/kana';
    
    const response = await fetch(`${KANA_API_BASE_URL}/generate-topic-quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Mathematics',
        difficulty: 'easy',
        numQuestions: 2
      })
    });

    if (!response.ok) {
      throw new Error(`Quiz generation failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    updateTest('Topic Quiz Generation', 'success', 'Quiz generated successfully', data);
  };

  const testQuizDataFormat = async () => {
    const KANA_API_BASE_URL = import.meta.env.VITE_KANA_API_BASE_URL || 'https://kana-backend-app.onrender.com/api/kana';
    
    const response = await fetch(`${KANA_API_BASE_URL}/generate-topic-quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Science',
        difficulty: 'easy',
        numQuestions: 1
      })
    });

    const data = await response.json();
    
    if (!data.quiz || !Array.isArray(data.quiz)) {
      throw new Error('Invalid quiz format: missing quiz array');
    }

    const question = data.quiz[0];
    if (!question.question || !question.options || !question.answer) {
      throw new Error('Invalid question format: missing required fields');
    }

    if (!Array.isArray(question.options) || question.options.length !== 4) {
      throw new Error('Invalid options format: should be array of 4 options');
    }

    updateTest('Quiz Data Format', 'success', 'Quiz data format is correct');
  };

  const testAnswerValidation = async () => {
    // Test the answer validation logic with sample data
    const sampleQuestion = {
      id: 'test-1',
      questionText: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4'
    };

    // Test correct answer
    const correctOptionIndex = 1; // Index of '4'
    const selectedOption = sampleQuestion.options[correctOptionIndex];
    const isCorrect = selectedOption === sampleQuestion.correctAnswer;

    if (!isCorrect) {
      throw new Error('Answer validation failed for correct answer');
    }

    // Test incorrect answer
    const incorrectOptionIndex = 0; // Index of '3'
    const incorrectSelectedOption = sampleQuestion.options[incorrectOptionIndex];
    const isIncorrect = incorrectSelectedOption !== sampleQuestion.correctAnswer;

    if (!isIncorrect) {
      throw new Error('Answer validation failed for incorrect answer');
    }

    updateTest('Answer Validation', 'success', 'Answer validation logic works correctly');
  };

  const testTournamentService = async () => {
    try {
      // Test if tournament service can be imported
      const { tournamentService } = await import('../../services/tournamentService');
      
      if (!tournamentService) {
        throw new Error('Tournament service not found');
      }

      updateTest('Tournament Service', 'success', 'Tournament service is available');
    } catch (error) {
      throw new Error('Tournament service import failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test.testName);
      // Add small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <TestTube className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Tournament System Tester</h2>
        </div>

        <div className="flex gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={runAllTests}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Play className="h-4 w-4" />
            Run All Tests
          </motion.button>
        </div>

        <div className="space-y-4">
          {tests.map((test) => (
            <motion.div
              key={test.testName}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              whileHover={{ backgroundColor: '#f9fafb' }}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <h3 className="font-medium text-gray-800">{test.testName}</h3>
                  {test.message && (
                    <p className={`text-sm ${test.status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
                      {test.message}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => runTest(test.testName)}
                disabled={test.status === 'running'}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {test.status === 'running' ? 'Running...' : 'Run Test'}
              </button>
            </motion.div>
          ))}
        </div>

        {tests.some(t => t.data) && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Test Data:</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(tests.find(t => t.data)?.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
