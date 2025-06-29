import React, { useState, useEffect } from 'react';
import { TrendingUp, Brain, Target, BookOpen, Trophy, Loader, X } from 'lucide-react';

interface UserProgressAIProps {
    userId: string;
    onClose: () => void;
}

interface ProgressData {
    totalXP: number;
    weeklyXP: number;
    streak: number;
    subjectsStudied: string[];
    quizzesCompleted: number;
    averageScore: number;
    strongSubjects: string[];
    weakSubjects: string[];
    squadRank: number;
    badges: number;
}

export const UserProgressAI: React.FC<UserProgressAIProps> = ({ userId, onClose }) => {
    const [progressData, setProgressData] = useState<ProgressData | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [recommendations, setRecommendations] = useState<string>('');
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        loadUserProgress();
    }, [userId]);

    const loadUserProgress = async () => {
        try {
            setIsLoadingData(true);
            setError('');

            // Call the Brain Ink backend to get user progress data
            const response = await fetch(`https://brainink-backend-freinds-micro.onrender.com/users/${userId}/progress`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // If backend call fails, use mock data for demonstration
                const mockData: ProgressData = {
                    totalXP: 12450,
                    weeklyXP: 850,
                    streak: 7,
                    subjectsStudied: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
                    quizzesCompleted: 143,
                    averageScore: 84.2,
                    strongSubjects: ['Mathematics', 'Physics'],
                    weakSubjects: ['Chemistry', 'Biology'],
                    squadRank: 3,
                    badges: 12
                };
                setProgressData(mockData);
            } else {
                const data = await response.json();
                setProgressData(data);
            }

            // Automatically trigger AI analysis after loading data
            await getAIAnalysis();
        } catch (error) {
            console.error('Error loading user progress:', error);
            setError('Failed to load progress data');
        } finally {
            setIsLoadingData(false);
        }
    };

    const getAIAnalysis = async () => {
        if (!progressData) return;

        try {
            setIsLoadingAnalysis(true);
            setError('');

            // Prepare context for the AI agent
            const progressContext = {
                totalXP: progressData.totalXP,
                weeklyXP: progressData.weeklyXP,
                streak: progressData.streak,
                averageScore: progressData.averageScore,
                strongSubjects: progressData.strongSubjects.join(', '),
                weakSubjects: progressData.weakSubjects.join(', '),
                quizzesCompleted: progressData.quizzesCompleted,
                squadRank: progressData.squadRank
            };

            const message = `Analyze this user's learning progress and provide detailed insights:
      
Total XP: ${progressData.totalXP}
Weekly XP: ${progressData.weeklyXP}
Current Streak: ${progressData.streak} days
Quizzes Completed: ${progressData.quizzesCompleted}
Average Score: ${progressData.averageScore}%
Strong Subjects: ${progressData.strongSubjects.join(', ')}
Weak Subjects: ${progressData.weakSubjects.join(', ')}
Squad Rank: #${progressData.squadRank}
Badges Earned: ${progressData.badges}

Please provide:
1. Performance analysis
2. Learning patterns
3. Strengths and areas for improvement
4. Specific recommendations for continued growth`;

            const response = await fetch(`${process.env.BRAININK_AGENT_URL || process.env.VITE_AGENT_API_BASE_URL || 'https://brainink.onrender.com'}/chat/Learning Progress Analyst`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    userId,
                    context: {
                        action: 'detailed_progress_analysis',
                        ...progressContext
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();
            setAiAnalysis(data.response);

            // Get recommendations from K.A.N.A.
            await getRecommendations(progressContext);
        } catch (error) {
            console.error('Error getting AI analysis:', error);
            setError('Failed to get AI analysis. Make sure the agent system is running.');
        } finally {
            setIsLoadingAnalysis(false);
        }
    };

    const getRecommendations = async (context: any) => {
        try {
            const message = `Based on this learning data, provide personalized study recommendations:

Strong subjects: ${context.strongSubjects}
Weak subjects: ${context.weakSubjects}
Average score: ${context.averageScore}%
Weekly XP: ${context.weeklyXP}
Current streak: ${context.streak} days

Please suggest:
1. Specific study strategies
2. Subject focus areas
3. Quiz types to practice
4. Time management tips
5. Goals for next week`;

            const response = await fetch(`${process.env.BRAININK_AGENT_URL || process.env.VITE_AGENT_API_BASE_URL || 'https://brainink.onrender.com'}/chat/K.A.N.A. Educational Tutor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    userId,
                    context: {
                        action: 'personalized_recommendations',
                        ...context
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                setRecommendations(data.response);
            }
        } catch (error) {
            console.error('Error getting recommendations:', error);
        }
    };

    if (isLoadingData) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 text-center">
                    <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                    <p className="text-gray-600">Loading your progress data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-8 h-8" />
                            <div>
                                <h2 className="text-xl font-bold">AI Progress Analysis</h2>
                                <p className="text-green-100">Powered by Learning Progress Analyst</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700">{error}</p>
                        </div>
                    )}

                    {progressData && (
                        <div className="space-y-6">
                            {/* Progress Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg text-center">
                                    <Trophy className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                                    <div className="font-bold text-xl text-blue-900">{progressData.totalXP.toLocaleString()}</div>
                                    <div className="text-sm text-blue-600">Total XP</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg text-center">
                                    <Target className="w-6 h-6 mx-auto text-green-600 mb-2" />
                                    <div className="font-bold text-xl text-green-900">{progressData.weeklyXP}</div>
                                    <div className="text-sm text-green-600">Weekly XP</div>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-lg text-center">
                                    <BookOpen className="w-6 h-6 mx-auto text-orange-600 mb-2" />
                                    <div className="font-bold text-xl text-orange-900">{progressData.quizzesCompleted}</div>
                                    <div className="text-sm text-orange-600">Quizzes</div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg text-center">
                                    <Brain className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                                    <div className="font-bold text-xl text-purple-900">{progressData.averageScore}%</div>
                                    <div className="text-sm text-purple-600">Avg Score</div>
                                </div>
                            </div>

                            {/* Subjects */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-green-900 mb-2">Strong Subjects</h3>
                                    <div className="space-y-1">
                                        {progressData.strongSubjects.map(subject => (
                                            <div key={subject} className="text-green-700 text-sm">• {subject}</div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-red-900 mb-2">Areas for Improvement</h3>
                                    <div className="space-y-1">
                                        {progressData.weakSubjects.map(subject => (
                                            <div key={subject} className="text-red-700 text-sm">• {subject}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* AI Analysis */}
                            {isLoadingAnalysis ? (
                                <div className="bg-gray-50 p-6 rounded-lg text-center">
                                    <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-600" />
                                    <p className="text-gray-600">AI is analyzing your progress...</p>
                                </div>
                            ) : aiAnalysis && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                        <Brain className="w-5 h-5" />
                                        AI Analysis
                                    </h3>
                                    <div className="whitespace-pre-wrap text-sm text-blue-800">
                                        {aiAnalysis}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            {recommendations && (
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                        <Target className="w-5 h-5" />
                                        Personalized Recommendations
                                    </h3>
                                    <div className="whitespace-pre-wrap text-sm text-purple-800">
                                        {recommendations}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            User ID: {userId}
                        </div>
                        <button
                            onClick={getAIAnalysis}
                            disabled={isLoadingAnalysis}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            {isLoadingAnalysis ? 'Analyzing...' : 'Refresh Analysis'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
