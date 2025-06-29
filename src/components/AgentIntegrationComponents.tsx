import React, { useState } from 'react';
import { Brain, Sparkles, Users, Clock } from 'lucide-react';
import { useBrainInkAgents } from '../hooks/useBrainInkAgents';

interface AgentQuizGeneratorProps {
    onQuizGenerated?: (quiz: string) => void;
    defaultSubject?: string;
}

export const AgentQuizGenerator: React.FC<AgentQuizGeneratorProps> = ({
    onQuizGenerated,
    defaultSubject = ''
}) => {
    const [subject, setSubject] = useState(defaultSubject);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [questionCount, setQuestionCount] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuiz, setGeneratedQuiz] = useState<string>('');

    const { generateQuiz, systemStatus } = useBrainInkAgents({ autoConnect: true });

    const handleGenerateQuiz = async () => {
        if (!subject.trim()) return;

        setIsGenerating(true);
        try {
            const response = await generateQuiz(subject, difficulty, questionCount);
            setGeneratedQuiz(response.message);
            onQuizGenerated?.(response.message);
        } catch (error) {
            console.error('Failed to generate quiz:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const isOffline = systemStatus === 'offline';

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                    <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">AI Quiz Generator</h3>
                    <p className="text-sm text-gray-600">
                        {isOffline ? 'Offline - Limited functionality' : 'Generate custom quizzes with K.A.N.A.'}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Subject Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                    </label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g., Mathematics, Chemistry, History"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                {/* Difficulty and Question Count */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Difficulty
                        </label>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Questions
                        </label>
                        <select
                            value={questionCount}
                            onChange={(e) => setQuestionCount(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value={3}>3 Questions</option>
                            <option value={5}>5 Questions</option>
                            <option value={10}>10 Questions</option>
                            <option value={15}>15 Questions</option>
                        </select>
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerateQuiz}
                    disabled={!subject.trim() || isGenerating || isOffline}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                    {isGenerating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Generating Quiz...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Generate Quiz
                        </>
                    )}
                </button>

                {/* Generated Quiz Display */}
                {generatedQuiz && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Generated Quiz:</h4>
                        <div className="whitespace-pre-wrap text-sm text-gray-700">
                            {generatedQuiz}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface AgentProgressAnalyzerProps {
    onAnalysisComplete?: (analysis: string) => void;
}

export const AgentProgressAnalyzer: React.FC<AgentProgressAnalyzerProps> = ({
    onAnalysisComplete
}) => {
    const [selectedSubject, setSelectedSubject] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<string>('');

    const { analyzeProgress, systemStatus } = useBrainInkAgents();

    const subjects = [
        'All Subjects',
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biology',
        'History',
        'Literature',
        'Computer Science',
        'Languages'
    ];

    const handleAnalyzeProgress = async () => {
        setIsAnalyzing(true);
        try {
            const subjectToAnalyze = selectedSubject === 'All Subjects' ? undefined : selectedSubject;
            const response = await analyzeProgress(subjectToAnalyze);
            setAnalysis(response.message);
            onAnalysisComplete?.(response.message);
        } catch (error) {
            console.error('Failed to analyze progress:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const isOffline = systemStatus === 'offline';

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 p-2 rounded-lg">
                    <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Progress Analysis</h3>
                    <p className="text-sm text-gray-600">
                        {isOffline ? 'Offline - Analysis unavailable' : 'Get insights on your learning progress'}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Subject Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject to Analyze
                    </label>
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">Select a subject</option>
                        {subjects.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>
                </div>

                {/* Analyze Button */}
                <button
                    onClick={handleAnalyzeProgress}
                    disabled={!selectedSubject || isAnalyzing || isOffline}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                    {isAnalyzing ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Analyzing Progress...
                        </>
                    ) : (
                        <>
                            <Clock className="w-4 h-4" />
                            Analyze Progress
                        </>
                    )}
                </button>

                {/* Analysis Results */}
                {analysis && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Progress Analysis:</h4>
                        <div className="whitespace-pre-wrap text-sm text-gray-700">
                            {analysis}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface AgentSquadCoordinatorProps {
    squadId?: string;
    onRecommendation?: (recommendation: string) => void;
}

export const AgentSquadCoordinator: React.FC<AgentSquadCoordinatorProps> = ({
    squadId,
    onRecommendation
}) => {
    const [selectedAction, setSelectedAction] = useState<'status' | 'find_partners' | 'suggest_activity'>('status');
    const [subject, setSubject] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [recommendation, setRecommendation] = useState<string>('');

    const { coordinateSquad, systemStatus } = useBrainInkAgents();

    const actions = [
        { value: 'status', label: 'Squad Status', description: 'Check how your squad is doing' },
        { value: 'find_partners', label: 'Find Partners', description: 'Get help finding study partners' },
        { value: 'suggest_activity', label: 'Suggest Activity', description: 'Get activity suggestions for your squad' }
    ];

    const handleCoordinate = async () => {
        setIsProcessing(true);
        try {
            const response = await coordinateSquad(squadId, selectedAction, subject || undefined);
            setRecommendation(response.message);
            onRecommendation?.(response.message);
        } catch (error) {
            console.error('Failed to coordinate squad:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const isOffline = systemStatus === 'offline';

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Squad Coordinator</h3>
                    <p className="text-sm text-gray-600">
                        {isOffline ? 'Offline - Coordination unavailable' : 'Get AI assistance with squad management'}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Action Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        What would you like to do?
                    </label>
                    <div className="space-y-2">
                        {actions.map(action => (
                            <label key={action.value} className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="action"
                                    value={action.value}
                                    checked={selectedAction === action.value}
                                    onChange={(e) => setSelectedAction(e.target.value as any)}
                                    className="mt-1 text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                    <div className="font-medium text-gray-900">{action.label}</div>
                                    <div className="text-sm text-gray-600">{action.description}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Subject Input (optional for some actions) */}
                {(selectedAction === 'find_partners' || selectedAction === 'suggest_activity') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subject (Optional)
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g., Mathematics, Chemistry"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}

                {/* Coordinate Button */}
                <button
                    onClick={handleCoordinate}
                    disabled={isProcessing || isOffline}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                    {isProcessing ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Users className="w-4 h-4" />
                            Get Recommendation
                        </>
                    )}
                </button>

                {/* Recommendation Display */}
                {recommendation && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Squad Coordination:</h4>
                        <div className="whitespace-pre-wrap text-sm text-gray-700">
                            {recommendation}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
