
import React, { useState } from 'react';
import { Bot, Sparkles, Users, TrendingUp, MessageSquare, X, Loader, Brain } from 'lucide-react';

interface SquadAIAssistantProps {
    squadId: string;
    squadMembers: any[];
    onClose: () => void;
}

interface QuizData {
    question: string;
    options: string[];
    correctAnswer: number;
    xpReward: number;
    topic: string;
    generatedAt: string;
}

export const SquadAIAssistant: React.FC<SquadAIAssistantProps> = ({
    squadId,
    squadMembers,
    onClose
}) => {
    const [selectedAction, setSelectedAction] = useState<'analysis' | 'quiz' | 'coordination' | 'chat'>('analysis');
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [chatMessage, setChatMessage] = useState('');
    const [generatedQuiz, setGeneratedQuiz] = useState<QuizData | null>(null);

    const agentActions = [
        {
            id: 'analysis',
            label: 'Squad Analysis',
            icon: TrendingUp,
            description: 'Get AI insights about your squad performance',
            agent: 'Learning Progress Analyst'
        },
        {
            id: 'quiz',
            label: 'Generate Quiz',
            icon: Sparkles,
            description: 'Create a custom quiz for your squad',
            agent: 'K.A.N.A. Educational Tutor'
        },
        {
            id: 'coordination',
            label: 'Squad Coordination',
            icon: Users,
            description: 'Get suggestions for squad activities',
            agent: 'Squad Learning Coordinator'
        },
        {
            id: 'chat',
            label: 'Free Chat',
            icon: MessageSquare,
            description: 'Chat freely with any agent',
            agent: 'K.A.N.A. Educational Tutor'
        }
    ];

    const analyzeSquadRealData = async (): Promise<string> => {
        try {
            // Call the REAL agent backend analyze endpoint directly (same as quiz generation)
            const response = await fetch(`http://localhost:3001/squad/${squadId}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    include_detailed_analysis: true,
                    analysis_period_days: 7
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();

            // Return the real AI analysis
            if (data.analysis) {
                return `📊 **Real Squad Analysis** (Powered by Supabase Data + AI)

${data.analysis}

**Data Summary:**
• Squad: ${data.squad_data?.squad?.name || 'Unknown'} ${data.squad_data?.squad?.emoji || ''}
• Members: ${data.squad_data?.member_count || 0}
• Recent Activity: ${data.squad_data?.recent_activity_count || 0} messages
• Top Performer: ${data.squad_data?.top_performer?.username || 'None'}
• Average Engagement: ${data.squad_data?.engagement_summary?.average_engagement || 0}

*Generated using real Supabase database data + AI analysis*`;
            } else {
                return `📊 **Squad Analysis Generated** 

${JSON.stringify(data, null, 2)}

**Note:** The analysis was generated but might not be formatted properly. The data above shows what was returned from the AI system.`;
            }

        } catch (error) {
            console.error('Squad analysis error:', error);
            return `❌ **Squad Analysis Failed**
            
I encountered an error while analyzing squad "${squadId}":

**Error:** ${error instanceof Error ? error.message : 'Unknown error'}

**This could be due to:**
• Squad doesn't exist in the database (check if squad ID is valid)
• Agent backend not running on port 3001
• Database connection issues
• Network connectivity problems

**To fix this:** Make sure the ElizaOS agent backend is running on port 3001 and the squad ID is valid.

**Technical info:** Direct call to http://localhost:3001/squad/${squadId}/analyze failed`;
        }
    };

    const generateSquadQuiz = async (): Promise<string> => {
        try {
            setIsLoading(true);

            const response = await fetch(`http://localhost:3001/squad/${squadId}/generate-quiz`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    topic: 'mathematics',
                    difficulty: 'medium'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();

            if (data.success && data.quiz) {
                setGeneratedQuiz({
                    question: data.quiz.question,
                    options: data.quiz.options,
                    correctAnswer: data.quiz.correctAnswer,
                    xpReward: data.quiz.xpReward,
                    topic: data.quiz.topic,
                    generatedAt: data.quiz.generatedAt
                });

                return `🎯 **Quiz Generated for Your Squad!**

**Question:** ${data.quiz.question}

**Options:**
${data.quiz.options.map((option: string, index: number) => `${String.fromCharCode(65 + index)}. ${option}`).join('\n')}

**Details:**
• Topic: ${data.quiz.topic}
• XP Reward: ${data.quiz.xpReward} XP
• Generated via Brain Ink AI Agents
• Perfect for squad collaboration!

**How to Use:**
1. Share this quiz with your squad members
2. Discuss the answer together
3. Everyone can participate and earn XP
4. Use this for study sessions or competitions

*Generated at: ${new Date(data.quiz.generatedAt).toLocaleString()}*`;
            } else {
                throw new Error('Invalid quiz data received');
            }
        } catch (error) {
            return `❌ **Quiz Generation Failed**
            
I couldn't generate a quiz right now. This might be because:
• Agent backend is not running on port 3001
• AI service is temporarily unavailable
• Network connectivity issues

**Alternative:** You can still create manual quizzes or try again in a few minutes.
            
Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    };

    const coordinateSquadActivities = async (): Promise<string> => {
        try {
            // Use the REAL agent backend endpoint for Squad Coordination
            const response = await fetch(`http://localhost:3001/squad/${squadId}/coordinate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    include_activity_suggestions: true,
                    focus_areas: ['collaboration', 'engagement', 'learning']
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();

            // Return the REAL coordination response from the agent backend
            return `🎯 **Squad Coordination Suggestions**

${data.coordination || 'No coordination suggestions available'}

*Generated by Squad Learning Coordinator Agent*
*Using real squad data from Brain Ink database*`;
        } catch (error) {
            return `❌ **Squad Coordination Failed**
            
I couldn't generate coordination suggestions right now. This might be because:
• The agent backend is not running on port 3001
• Database connection issues  
• Network connectivity problems

**To fix this:** Make sure the ElizaOS agent backend is running on port 3001.
            
Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    };

    const handleKanaChat = async (message: string): Promise<string> => {
        try {
            // Connect to real Kana AI backend via the correct agent name
            const response = await fetch(`http://localhost:3001/chat/K.A.N.A. Educational Tutor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    userId: 'current-user', // This should come from your auth system
                    squadId: squadId, // Pass squadId so the agent can use squad context
                    conversationId: `squad_${squadId}_chat_${Date.now()}` // Unique conversation ID
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();

            // Handle different response types
            if (data.type === 'mathematical_graph' && data.generatedImageUrl) {
                return `🎯 **Kana's Response:**

${data.response}

📊 **Mathematical Graph Generated:**
![Graph](${data.generatedImageUrl})

*Generated by Kana AI using real Gemini integration*`;
            }

            return `🎯 **Kana's Response:**

${data.response || 'No response from Kana'}

*Powered by Kana AI (Gemini) - Real Brain Ink integration*`;
        } catch (error) {
            return `❌ **Kana Chat Failed**
            
I'm having trouble connecting to Kana right now. This might be because:
• The agent backend is not running on port 3001
• Kana AI backend is not running on port 10000
• Network connectivity issues

**What Kana can help with:**
• Answer questions about study topics
• Provide learning explanations and concepts
• Give study tips and strategies
• Help with homework and assignments
• Generate mathematical graphs and plots
• Discuss educational concepts with squad context

**To fix this:** Make sure both the ElizaOS agent backend (port 3001) and Kana AI backend (port 10000) are running.
            
Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    };

    const handleActionExecute = async () => {
        try {
            setIsLoading(true);
            setError('');

            let result = '';

            switch (selectedAction) {
                case 'analysis':
                    result = await analyzeSquadRealData();
                    break;

                case 'quiz':
                    result = await generateSquadQuiz();
                    break;

                case 'coordination':
                    result = await coordinateSquadActivities();
                    break;

                case 'chat':
                    if (!chatMessage.trim()) {
                        setError('Please enter a message to chat with Kana.');
                        return;
                    }
                    result = await handleKanaChat(chatMessage);
                    setChatMessage('');
                    break;

                default:
                    result = 'Unknown action selected.';
            }

            setResponse(result);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to get response from AI agent');
        } finally {
            setIsLoading(false);
        }
    };

    const selectedActionData = agentActions.find(a => a.id === selectedAction);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Bot className="w-8 h-8" />
                            <div>
                                <h2 className="text-xl font-bold">Squad AI Assistant</h2>
                                <p className="text-purple-100">Powered by Brain Ink Agents</p>
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
                    {/* Action Selection */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Choose an Action</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {agentActions.map((action) => {
                                const Icon = action.icon;
                                const isSelected = selectedAction === action.id;

                                return (
                                    <button
                                        key={action.id}
                                        onClick={() => setSelectedAction(action.id as any)}
                                        className={`p-4 rounded-lg border transition-all text-left ${isSelected
                                            ? 'border-purple-500 bg-purple-50 text-purple-900'
                                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Icon className="w-5 h-5" />
                                            <span className="font-medium">{action.label}</span>
                                        </div>
                                        <p className="text-sm opacity-80">{action.description}</p>
                                        <p className="text-xs mt-1 opacity-60">Agent: {action.agent}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Chat Input for Free Chat */}
                    {selectedAction === 'chat' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Your Message
                            </label>
                            <textarea
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                placeholder="Ask the AI agent anything..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                rows={3}
                            />
                        </div>
                    )}

                    {/* Execute Button */}
                    <button
                        onClick={handleActionExecute}
                        disabled={isLoading || (selectedAction === 'chat' && !chatMessage.trim())}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mb-4"
                    >
                        {isLoading ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Getting AI Response...
                            </>
                        ) : (
                            <>
                                <Bot className="w-5 h-5" />
                                {selectedActionData?.label || 'Execute Action'}
                            </>
                        )}
                    </button>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Response Display */}
                    {response && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">AI Response:</h4>
                            <div className="whitespace-pre-wrap text-sm text-blue-800">
                                {response}
                            </div>

                            {/* Special Display for Generated Quiz */}
                            {selectedAction === 'quiz' && generatedQuiz && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Brain className="w-5 h-5 text-purple-600" />
                                        <h5 className="font-medium text-purple-900">Interactive Quiz</h5>
                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                            {generatedQuiz.xpReward} XP
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="font-medium text-gray-900">{generatedQuiz.question}</p>
                                        <div className="space-y-1">
                                            {generatedQuiz.options.map((option, index) => (
                                                <div
                                                    key={index}
                                                    className={`p-2 rounded border ${index === generatedQuiz.correctAnswer
                                                        ? 'bg-green-50 border-green-200 text-green-800'
                                                        : 'bg-gray-50 border-gray-200'
                                                        }`}
                                                >
                                                    <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                                                    {index === generatedQuiz.correctAnswer && (
                                                        <span className="ml-2 text-green-600 text-sm">✓ Correct</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-3 text-xs text-gray-600">
                                        Topic: {generatedQuiz.topic} • Generated: {new Date(generatedQuiz.generatedAt).toLocaleString()}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <div>Squad ID: {squadId}</div>
                        <div>{squadMembers.length} members</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
