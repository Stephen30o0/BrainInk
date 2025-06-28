import React, { useState, useEffect, useRef } from 'react';
import { backendTournamentService, QuizQuestion, MatchSubmission } from '../../services/backendTournamentService';

interface QuizMatchProps {
    tournamentId: string;
    matchId: string;
    userAddress: string;
    onMatchComplete?: (result: MatchSubmission) => void;
}

export const QuizMatch: React.FC<QuizMatchProps> = ({
    tournamentId,
    matchId,
    userAddress,
    onMatchComplete
}) => {
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [matchStartTime, setMatchStartTime] = useState<number>(0);
    const [showResult, setShowResult] = useState(false);
    const [matchResult, setMatchResult] = useState<MatchSubmission | null>(null);
    const [questionsExpired, setQuestionsExpired] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadQuestions();
    }, [tournamentId, matchId]);

    useEffect(() => {
        if (timeLeft > 0 && !showResult) {
            const timer = setTimeout(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleTimeExpired();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft, showResult]);

    // Scroll functionality
    useEffect(() => {
        const handleScroll = () => {
            if (containerRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
                const isScrollable = scrollHeight > clientHeight;

                // Show scroll-to-top button if scrolled down by at least 50px and content is scrollable
                setShowScrollTop(scrollTop > 50 && isScrollable);

                // Show scroll-to-bottom button if not at bottom and content is scrollable
                setShowScrollBottom(scrollTop < scrollHeight - clientHeight - 50 && isScrollable);
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            // Initial check after a short delay to ensure content is rendered
            setTimeout(handleScroll, 100);
            // Also check on resize
            window.addEventListener('resize', handleScroll);

            return () => {
                container.removeEventListener('scroll', handleScroll);
                window.removeEventListener('resize', handleScroll);
            };
        }
    }, [questions, currentQuestion, showResult]); // Re-run when content changes

    const loadQuestions = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Generate questions for this match
            const result = await backendTournamentService.generateQuestionsForMatch(tournamentId, matchId);

            if (result.success) {
                setQuestions(result.questions);
                setTimeLeft(result.time_limit_minutes * 60); // Convert to seconds
                setMatchStartTime(Date.now());
                setAnswers(new Array(result.questions.length).fill(''));

                // Check if questions have expired
                const expiresAt = new Date(result.expires_at);
                const now = new Date();
                if (now > expiresAt) {
                    setQuestionsExpired(true);
                    setError('Time limit for this match has expired');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load questions');
            console.error('Load questions error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerSelect = (answer: string) => {
        setSelectedAnswer(answer);
    };

    const handleNextQuestion = () => {
        if (selectedAnswer) {
            const newAnswers = [...answers];
            newAnswers[currentQuestion] = selectedAnswer;
            setAnswers(newAnswers);
            setSelectedAnswer(null);

            if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(prev => prev + 1);
            } else {
                // All questions answered, submit automatically
                submitAnswers(newAnswers);
            }
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestion > 0) {
            // Save current answer
            if (selectedAnswer) {
                const newAnswers = [...answers];
                newAnswers[currentQuestion] = selectedAnswer;
                setAnswers(newAnswers);
            }

            setCurrentQuestion(prev => prev - 1);
            setSelectedAnswer(answers[currentQuestion - 1] || null);
        }
    };

    const handleTimeExpired = () => {
        // Auto-submit with current answers when time expires
        submitAnswers(answers);
    };

    const submitAnswers = async (finalAnswers: string[] = answers) => {
        if (isSubmitting || showResult) return;

        try {
            setIsSubmitting(true);
            setError(null);

            const completionTime = Date.now() - matchStartTime;
            const result = await backendTournamentService.submitAnswers(
                tournamentId,
                matchId,
                userAddress,
                finalAnswers,
                completionTime
            );

            if (result.success) {
                setMatchResult(result.submission);
                setShowResult(true);

                if (onMatchComplete) {
                    onMatchComplete(result.submission);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to submit answers');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgressPercentage = (): number => {
        return ((currentQuestion + 1) / questions.length) * 100;
    };

    const scrollToTop = () => {
        containerRef.current?.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const scrollToBottom = () => {
        containerRef.current?.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: 'smooth'
        });
    };

    if (isLoading) {
        return (
            <div className="bg-dark/95 backdrop-blur-sm border border-primary/30 rounded-lg p-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-primary mb-2">🔗 Generating Chainlink Questions</h3>
                <p className="text-gray-300">
                    Using Chainlink Functions + Kana AI to create your personalized quiz...
                </p>
            </div>
        );
    }

    if (error || questionsExpired) {
        return (
            <div className="bg-dark/95 backdrop-blur-sm border border-red-500/30 rounded-lg p-8 text-center">
                <h3 className="text-xl font-bold text-red-400 mb-2">Match Unavailable</h3>
                <p className="text-gray-300 mb-4">{error}</p>
                <button
                    onClick={() => window.history.back()}
                    className="px-6 py-3 bg-primary text-dark font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Back to Tournament
                </button>
            </div>
        );
    }

    if (showResult && matchResult) {
        return (
            <div className="bg-dark/95 backdrop-blur-sm border border-primary/30 rounded-lg p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-primary mb-2">🏆 Match Complete!</h2>
                    <div className="text-6xl font-bold text-primary mb-4">
                        {matchResult.score}%
                    </div>
                    <p className="text-xl text-gray-300">
                        {matchResult.correct_answers} out of {matchResult.total_questions} correct
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-primary/20 border border-primary/50 rounded-lg p-4 text-center">
                        <h3 className="text-lg font-semibold text-primary mb-2">Score</h3>
                        <p className="text-2xl font-bold text-white">{matchResult.percentage}%</p>
                    </div>

                    <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
                        <h3 className="text-lg font-semibold text-green-400 mb-2">Correct Answers</h3>
                        <p className="text-2xl font-bold text-white">{matchResult.correct_answers}</p>
                    </div>

                    <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 text-center">
                        <h3 className="text-lg font-semibold text-blue-400 mb-2">Completion Time</h3>
                        <p className="text-2xl font-bold text-white">
                            {Math.round(matchResult.completion_time_ms / 1000)}s
                        </p>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <h3 className="text-xl font-bold text-white">Detailed Results:</h3>
                    {matchResult.detailed_results.map((result, index) => (
                        <div
                            key={index}
                            className={`border rounded-lg p-4 ${result.is_correct
                                ? 'bg-green-500/20 border-green-500/50'
                                : 'bg-red-500/20 border-red-500/50'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-white">Q{index + 1}: {result.question}</h4>
                                <span className={`px-2 py-1 rounded text-sm font-medium ${result.is_correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                    }`}>
                                    {result.is_correct ? '✓' : '✗'}
                                </span>
                            </div>

                            <div className="space-y-1 text-sm">
                                <p className="text-gray-300">
                                    Your Answer: <span className={result.is_correct ? 'text-green-400' : 'text-red-400'}>
                                        {result.user_answer || 'No answer'}
                                    </span>
                                </p>
                                <p className="text-gray-300">
                                    Correct Answer: <span className="text-green-400">{result.correct_answer}</span>
                                </p>
                                {result.explanation && (
                                    <p className="text-gray-400 italic">{result.explanation}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-3 bg-primary text-dark font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Back to Tournament
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentQuestion];
    if (!currentQ) return null;

    return (
        <div className="relative h-full flex flex-col">
            <div
                className="flex-1 overflow-y-auto bg-dark/95 backdrop-blur-sm border border-primary/30 rounded-lg p-6 max-w-4xl mx-auto"
                ref={containerRef}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-primary">Tournament Quiz Match</h2>
                        <p className="text-gray-300">
                            Question {currentQuestion + 1} of {questions.length}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-bold ${timeLeft <= 60 ? 'text-red-400' : 'text-primary'}`}>
                            ⏱️ {formatTime(timeLeft)}
                        </div>
                        <p className="text-sm text-gray-400">Time remaining</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-600 rounded-full h-2 mb-6">
                    <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                </div>

                {/* Question */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-6 leading-relaxed">
                        {currentQ.question}
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                        {Object.entries(currentQ.options).map(([letter, option]) => (
                            <button
                                key={letter}
                                onClick={() => handleAnswerSelect(letter)}
                                className={`p-4 text-left rounded-lg border-2 transition-all duration-200 ${selectedAnswer === letter
                                    ? 'bg-primary/20 border-primary text-primary'
                                    : 'bg-dark/50 border-gray-600 text-gray-300 hover:border-primary/50 hover:bg-dark/70'
                                    }`}
                            >
                                <span className="font-semibold mr-3">{letter}.</span>
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={handlePreviousQuestion}
                        disabled={currentQuestion === 0}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ← Previous
                    </button>

                    <div className="flex items-center gap-4">
                        <span className="text-gray-400">
                            {answers.filter(a => a).length} answered
                        </span>

                        {currentQuestion === questions.length - 1 ? (
                            <button
                                onClick={() => submitAnswers()}
                                disabled={!selectedAnswer || isSubmitting}
                                className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                            </button>
                        ) : (
                            <button
                                onClick={handleNextQuestion}
                                disabled={!selectedAnswer}
                                className="px-4 py-2 bg-primary text-dark font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next →
                            </button>
                        )}
                    </div>
                </div>

                {/* Chainlink Attribution */}
                <div className="mt-6 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                    <p className="text-blue-400 text-sm text-center">
                        🔗 <strong>Powered by Chainlink Functions + Kana AI</strong> •
                        Questions generated with tamper-proof randomness and decentralized AI
                    </p>
                </div>

                {/* Scroll Buttons */}
                {showScrollTop && (
                    <button
                        onClick={scrollToTop}
                        className="fixed bottom-20 right-6 z-[9999] bg-primary hover:bg-primary/90 text-dark p-3 rounded-full shadow-xl border-2 border-dark/20 transition-all duration-300 ease-in-out transform hover:scale-110"
                        title="Scroll to top"
                        style={{ backdropFilter: 'blur(8px)' }}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                )}
                {showScrollBottom && (
                    <button
                        onClick={scrollToBottom}
                        className="fixed bottom-6 right-6 z-[9999] bg-primary hover:bg-primary/90 text-dark p-3 rounded-full shadow-xl border-2 border-dark/20 transition-all duration-300 ease-in-out transform hover:scale-110"
                        title="Scroll to bottom"
                        style={{ backdropFilter: 'blur(8px)' }}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};
