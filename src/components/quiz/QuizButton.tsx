import React, { useState, useEffect } from 'react';
import {
    Brain,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import { quizGeneratorService } from '../../services/quizGeneratorService';

interface QuizButtonProps {
    assignmentId: number;
    studentId: number;
    feedback: string;
    weaknessAreas: string[];
    subject: string;
    grade: number;
    className?: string;
}

export const QuizButton: React.FC<QuizButtonProps> = ({
    assignmentId,
    studentId,
    feedback,
    weaknessAreas,
    subject,
    grade,
    className = ""
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Always reset to allow new quiz generation on page reload
        // Since quizzes are not persisted, we want users to always be able to generate new ones
        setLoading(false);
        console.log('🔄 Quiz state reset - ready for new quiz generation');
    }, [assignmentId, studentId]);

    const generateQuiz = async () => {
        if (isGenerating) return;

        try {
            setIsGenerating(true);
            setError(null);
            console.log('🧠 Generating improvement quiz with full analysis feedback...');

            // Extract weakness areas from feedback if none provided
            const extractedWeaknessAreas = weaknessAreas.length > 0
                ? weaknessAreas
                : extractWeaknessAreasFromFeedback(feedback);

            // Enhanced feedback that includes the full analysis for more accurate quiz generation
            const enhancedFeedback = `
ASSIGNMENT FEEDBACK & ANALYSIS:
${feedback}

EXTRACTED WEAKNESS AREAS:
${extractedWeaknessAreas.join(', ')}

SUBJECT CONTEXT: ${subject}
GRADE LEVEL: ${grade}%

This quiz should target the specific areas mentioned in the feedback above to help the student improve their understanding in the identified weak areas.
            `;

            const newQuiz = await quizGeneratorService.generateQuizFromAssignment(
                assignmentId,
                studentId,
                enhancedFeedback, // Use enhanced feedback with full context
                extractedWeaknessAreas,
                subject,
                grade
            );

            if (newQuiz) {
                console.log('✅ Quiz generated successfully with enhanced feedback');

                // Open quiz in new tab or navigate
                openQuiz(newQuiz.id);
            } else {
                setError('Failed to generate quiz. Please try again.');
            }

        } catch (error) {
            console.error('❌ Failed to generate quiz:', error);
            setError('Failed to generate quiz. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const extractWeaknessAreasFromFeedback = (feedback: string): string[] => {
        const areas: string[] = [];
        const lowerFeedback = feedback.toLowerCase();

        // Common weakness patterns to look for
        const patterns = [
            'algebra', 'geometry', 'calculus', 'trigonometry',
            'reading comprehension', 'writing', 'grammar', 'vocabulary',
            'physics', 'chemistry', 'biology', 'science',
            'history', 'geography', 'literature', 'math', 'mathematics',
            'problem solving', 'critical thinking', 'analysis'
        ];

        patterns.forEach(pattern => {
            if (lowerFeedback.includes(pattern)) {
                areas.push(pattern.charAt(0).toUpperCase() + pattern.slice(1));
            }
        });

        // If no specific areas found, use general ones based on grade
        if (areas.length === 0) {
            if (grade < 60) {
                areas.push('Fundamental Concepts', 'Basic Understanding');
            } else if (grade < 80) {
                areas.push('Application Skills', 'Problem Solving');
            } else {
                areas.push('Advanced Concepts', 'Critical Analysis');
            }
        }

        return areas.slice(0, 3); // Limit to 3 areas
    };

    const openQuiz = (quizId: string) => {
        // Open quiz in new tab
        const quizUrl = `/quiz/${quizId}?student=${studentId}`;
        window.open(quizUrl, '_blank');
    };

    if (loading) {
        return (
            <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
                <div className="flex items-center space-x-3">
                    <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
                    <div>
                        <p className="text-blue-800 font-medium">Preparing quiz generator...</p>
                        <p className="text-blue-600 text-sm">Setting up personalized quiz options</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
                <div className="flex items-center space-x-3">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    <div className="flex-1">
                        <p className="text-red-800 font-medium">Quiz Generation Failed</p>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                    <button
                        onClick={generateQuiz}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Show generate quiz button (always available on page reload since quizzes are not stored)
    return (
        <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Brain className="w-6 h-6 text-blue-600" />
                    <div>
                        <h4 className="font-semibold text-blue-900">Generate Practice Quiz</h4>
                        <p className="text-blue-700 text-sm">
                            Get a personalized quiz based on your assignment feedback and analysis
                        </p>
                        {weaknessAreas.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                                <span className="text-xs text-blue-600">Will focus on:</span>
                                {weaknessAreas.slice(0, 2).map((area, index) => (
                                    <span
                                        key={index}
                                        className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs"
                                    >
                                        {area}
                                    </span>
                                ))}
                                {weaknessAreas.length > 2 && (
                                    <span className="text-xs text-blue-600">
                                        +{weaknessAreas.length - 2} more
                                    </span>
                                )}
                            </div>
                        )}
                        <div className="mt-2 text-xs text-blue-600 bg-blue-100 rounded px-2 py-1 inline-block">
                            💡 Fresh quiz generated each time - uses your full feedback for accuracy
                        </div>
                    </div>
                </div>

                <button
                    onClick={generateQuiz}
                    disabled={isGenerating}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                    {isGenerating ? (
                        <>
                            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Generating...
                        </>
                    ) : (
                        <>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Generate New Quiz
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
