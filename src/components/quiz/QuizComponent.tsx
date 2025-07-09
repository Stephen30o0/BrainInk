import React, { useState, useEffect } from 'react';
import {
    Brain,
    Clock,
    CheckCircle,
    XCircle,
    RotateCcw,
    Award,
    BookOpen,
    ArrowRight,
    Target,
    HelpCircle,
    Timer,
    TrendingUp,
    Star
} from 'lucide-react';
import { quizGeneratorService, GeneratedQuiz, QuizAttempt } from '../../services/quizGeneratorService';

interface QuizComponentProps {
    quizId: string;
    studentId: number;
    onComplete?: (attempt: QuizAttempt) => void;
    onClose?: () => void;
}

export const QuizComponent: React.FC<QuizComponentProps> = ({
    quizId,
    studentId,
    onComplete,
    onClose
}) => {
    const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [questionId: string]: number }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [startTime] = useState(Date.now());
    const [showResults, setShowResults] = useState(false);
    const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadQuiz();
    }, [quizId, studentId]);

    useEffect(() => {
        // Timer for quiz
        if (quiz?.time_limit_minutes && timeRemaining !== null && timeRemaining > 0 && !showResults) {
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev && prev <= 1) {
                        handleTimeUp();
                        return 0;
                    }
                    return prev ? prev - 1 : 0;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [quiz, timeRemaining, showResults]);

    const loadQuiz = async () => {
        try {
            setLoading(true);
            console.log('📋 Loading quiz:', quizId);

            const quizData = await quizGeneratorService.getQuiz(quizId, studentId);

            if (!quizData) {
                setError('Quiz not found or expired');
                return;
            }

            console.log('🔍 Quiz data loaded:', quizData);
            console.log('🔍 Questions:', quizData.questions);

            // Check if student can still take the quiz
            if (!quizGeneratorService.canTakeQuiz(quizData)) {
                setError('Maximum attempts reached for this quiz');
                return;
            }

            setQuiz(quizData);

            // Set timer if quiz has time limit
            if (quizData.time_limit_minutes) {
                setTimeRemaining(quizData.time_limit_minutes * 60);
            }

            console.log('✅ Quiz loaded:', quizData.title);
        } catch (error) {
            console.error('❌ Failed to load quiz:', error);
            setError('Failed to load quiz. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (questionId: string, answerIndex: number) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answerIndex
        }));
    };

    const handleNextQuestion = () => {
        if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleTimeUp = async () => {
        console.log('Time is up! Auto-submitting quiz...');
        await submitQuiz();
    };

    const submitQuiz = async () => {
        if (!quiz || isSubmitting) return;

        try {
            setIsSubmitting(true);
            console.log('📝 Submitting quiz attempt...');

            const timeTaken = Math.floor((Date.now() - startTime) / 1000);

            const attemptResult = await quizGeneratorService.submitQuizAttempt(
                quizId,
                studentId,
                answers,
                timeTaken
            );

            if (attemptResult) {
                setAttempt(attemptResult);
                setShowResults(true);
                console.log('✅ Quiz submitted successfully');

                if (onComplete) {
                    onComplete(attemptResult);
                }
            } else {
                setError('Failed to submit quiz. Please try again.');
            }

        } catch (error) {
            console.error('❌ Failed to submit quiz:', error);
            setError('Failed to submit quiz. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBadgeColor = (score: number): string => {
        if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
        if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-red-100 text-red-800 border-red-200';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Quiz...</h2>
                        <p className="text-gray-600">Preparing your personalized learning quiz</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiz Unavailable</h2>
                        <p className="text-red-600 mb-6">{error}</p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiz Not Found</h2>
                        <p className="text-gray-600 mb-6">The requested quiz could not be found.</p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (showResults && attempt) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        {/* Results Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
                            <Award className="w-16 h-16 mx-auto mb-4" />
                            <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
                            <p className="text-blue-100">Great job working on your improvement areas</p>
                        </div>

                        <div className="p-8">
                            {/* Score */}
                            <div className="text-center mb-8">
                                <div className={`inline-flex items-center px-6 py-3 rounded-full border-2 ${getScoreBadgeColor(attempt.score)} mb-4`}>
                                    <Star className="w-6 h-6 mr-2" />
                                    <span className="text-2xl font-bold">{attempt.score}%</span>
                                </div>
                                <p className={`text-lg font-semibold ${getScoreColor(attempt.score)}`}>
                                    {attempt.score >= 80 ? 'Excellent!' : attempt.score >= 60 ? 'Good Progress!' : 'Keep Learning!'}
                                </p>
                            </div>

                            {/* Feedback */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                                <h3 className="text-lg font-semibold text-blue-900 mb-3">Your Feedback</h3>
                                <p className="text-blue-800">{attempt.feedback}</p>
                            </div>

                            {/* Question Review */}
                            <div className="mb-8">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Question Review</h3>
                                <div className="space-y-4">                                    {quiz.questions.map((question, index) => {
                                    const userAnswer = answers[question.id];
                                    const isCorrect = userAnswer === question.correctAnswer;

                                    // console.log(`Question ${index + 1}: User: ${userAnswer}, Correct: ${question.correctAnswer}, Match: ${isCorrect}`);

                                    return (
                                        <div key={question.id} className="border rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <h4 className="font-medium text-gray-900 flex-1">
                                                    {index + 1}. {question.question}
                                                </h4>
                                                {isCorrect ? (
                                                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 ml-3" />
                                                ) : (
                                                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 ml-3" />
                                                )}
                                            </div>

                                            <div className="space-y-2 mb-3">
                                                {question.options && question.options.map((option, optionIndex) => {
                                                    let optionClass = 'p-2 rounded border text-sm ';

                                                    if (optionIndex === question.correctAnswer) {
                                                        optionClass += 'bg-green-50 border-green-200 text-green-800';
                                                    } else if (optionIndex === userAnswer && !isCorrect) {
                                                        optionClass += 'bg-red-50 border-red-200 text-red-800';
                                                    } else {
                                                        optionClass += 'bg-gray-50 border-gray-200 text-gray-700';
                                                    }

                                                    return (
                                                        <div key={optionIndex} className={optionClass}>
                                                            <span className="font-medium">
                                                                {String.fromCharCode(65 + optionIndex)}. {option || `Option ${String.fromCharCode(65 + optionIndex)}`}
                                                            </span>
                                                            {optionIndex === question.correctAnswer && (
                                                                <span className="ml-2 text-green-600 font-medium">✓ Correct</span>
                                                            )}
                                                            {optionIndex === userAnswer && !isCorrect && (
                                                                <span className="ml-2 text-red-600 font-medium">✗ Your answer</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {question.explanation && (
                                                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                                    <p className="text-yellow-800 text-sm">
                                                        <strong>Explanation:</strong> {question.explanation}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-center space-x-4">
                                {quizGeneratorService.canTakeQuiz(quiz) && (
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                    >
                                        <RotateCcw className="w-5 h-5 mr-2" />
                                        Try Again
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                >
                                    <BookOpen className="w-5 h-5 mr-2" />
                                    Back to Assignment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];

    // Safety check for current question - more detailed logging
    if (!currentQuestion) {
        console.error('❌ No current question found at index:', currentQuestionIndex);
        console.error('❌ Quiz questions:', quiz.questions);
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Question Not Found</h2>
                        <p className="text-red-600 mb-6">Question at index {currentQuestionIndex} not found.</p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }    // Log current question data for debugging
    // console.log('🔍 Current question:', currentQuestion);
    // console.log('🔍 Question options:', currentQuestion.options);

    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
    const canProceed = answers[currentQuestion.id] !== undefined;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Quiz Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-2xl font-bold">{quiz.title}</h1>
                                <p className="text-blue-100 mt-1">{quiz.description}</p>
                            </div>
                            {timeRemaining !== null && (
                                <div className="flex items-center bg-blue-700 bg-opacity-50 px-4 py-2 rounded-lg">
                                    <Timer className="w-5 h-5 mr-2" />
                                    <span className="font-semibold">{formatTime(timeRemaining)}</span>
                                </div>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-sm text-blue-100 mb-2">
                                <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                                <span>{Math.round(progress)}% Complete</span>
                            </div>
                            <div className="w-full bg-blue-700 bg-opacity-50 rounded-full h-2">
                                <div
                                    className="bg-white h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Weakness Areas */}
                        <div className="flex flex-wrap gap-2">
                            <span className="text-blue-100 text-sm">Focus areas:</span>
                            {quiz.weakness_areas.slice(0, 3).map((area, index) => (
                                <span key={index} className="bg-blue-700 bg-opacity-50 px-2 py-1 rounded text-sm">
                                    {area}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Current Question */}
                        <div className="mb-8">
                            <div className="flex items-start mb-6">
                                <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-4 flex-shrink-0 mt-1">
                                    {currentQuestionIndex + 1}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                        {currentQuestion.question}
                                    </h2>
                                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                                        <span className="flex items-center">
                                            <Target className="w-4 h-4 mr-1" />
                                            {currentQuestion.weakness_area}
                                        </span>
                                        <span className="flex items-center">
                                            <TrendingUp className="w-4 h-4 mr-1" />
                                            {currentQuestion.difficulty}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Answer Options */}
                            <div className="space-y-3">
                                {currentQuestion.options && currentQuestion.options.length > 0 ? (
                                    currentQuestion.options.map((option, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                                            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${answers[currentQuestion.id] === index
                                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center">
                                                <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center text-sm font-medium ${answers[currentQuestion.id] === index
                                                    ? 'border-blue-500 bg-blue-500 text-white'
                                                    : 'border-gray-300 text-gray-700'
                                                    }`}>
                                                    {String.fromCharCode(65 + index)}
                                                </div>
                                                <span className="text-gray-900 font-medium">
                                                    {option || `Option ${String.fromCharCode(65 + index)}`}
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center p-8 text-gray-500">
                                        <p>No options available for this question.</p>
                                        <p className="text-sm mt-2">Question data: {JSON.stringify(currentQuestion, null, 2)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between items-center">
                            <button
                                onClick={handlePreviousQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
                                Previous
                            </button>

                            <div className="flex items-center space-x-4">
                                {isLastQuestion ? (
                                    <button
                                        onClick={submitQuiz}
                                        disabled={!canProceed || isSubmitting}
                                        className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                Submit Quiz
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleNextQuestion}
                                        disabled={!canProceed}
                                        className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                                    >
                                        Next
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
