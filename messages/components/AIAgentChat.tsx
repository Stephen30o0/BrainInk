import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { X, BookOpen, Send, Zap, Brain, Target, TrendingUp } from 'lucide-react';
import { aiAgentService } from '../services/aiAgentService';

interface AIMessage {
    id: string;
    agent: 'kana';
    content: string;
    type: 'text' | 'quiz' | 'explanation' | 'suggestion' | 'leaderboard' | 'achievement';
    timestamp: string;
    metadata?: any;
}

interface QuizDrop {
    id: string;
    question: string;
    options: string[];
    correct_answer: number;
    explanation: string;
    subject: string;
    difficulty: 'easy' | 'medium' | 'hard';
    xp_reward: number;
}

export const AIAgentChat = ({
    onClose,
    kanaMessages = []
}: {
    onClose?: () => void; // onClose is now optional since it's not a modal
    kanaMessages: AIMessage[];
}) => {
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [currentQuiz, setCurrentQuiz] = useState<QuizDrop | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages(kanaMessages);
    }, [kanaMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const userMessage: AIMessage = {
            id: `user_${Date.now()}`,
            agent: 'kana',
            content: newMessage,
            type: 'text',
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setNewMessage('');
        setIsTyping(true);

        try {
            const response = await aiAgentService.sendMessageToAgent(newMessage);

            setTimeout(() => {
                setMessages(prev => [...prev, response]);
                setIsTyping(false);
            }, 1000 + Math.random() * 2000);

        } catch (error) {
            setIsTyping(false);
            const errorMessage: AIMessage = {
                id: `error_${Date.now()}`,
                agent: 'kana',
                content: "Sorry, I'm having trouble connecting right now. Please try again later.",
                type: 'text',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    const handleQuickAction = async (action: string) => {
        let quickMessage = '';
        switch (action) {
            case 'quiz':
                quickMessage = 'Can you give me a quiz question?';
                break;
            case 'explain':
                quickMessage = 'Can you explain a difficult concept?';
                break;
            case 'study-plan':
                quickMessage = 'Help me create a study plan';
                break;
            case 'motivation':
                quickMessage = 'I need some motivation to study';
                break;
            case 'past-papers':
                quickMessage = 'Show me some past papers';
                break;
            case 'weakness':
                quickMessage = 'What are my weak areas?';
                break;
            default:
                return;
        }
        setNewMessage(quickMessage);
        const event = { preventDefault: () => { } } as React.FormEvent;
        handleSendMessage(event);
    };

    const handleQuizDrop = async () => {
        try {
            const quiz = await aiAgentService.getQuizDrop();
            setCurrentQuiz(quiz);
            setSelectedAnswer(null);

            const quizMessage: AIMessage = {
                id: `quiz_${Date.now()}`,
                agent: 'kana',
                content: '🎯 Here\'s a quiz question for you!',
                type: 'quiz',
                timestamp: new Date().toISOString(),
                metadata: quiz
            };

            setMessages(prev => [...prev, quizMessage]);
        } catch (error) {
            // handle error
        }
    };

    const handleQuizSubmit = async (quizId: string, answer: number) => {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(answer);

        try {
            const result = await aiAgentService.submitQuizAnswer(quizId, answer);

            const resultMessage: AIMessage = {
                id: `quiz_result_${Date.now()}`,
                agent: 'kana',
                content: result.correct
                    ? `🎉 Correct! +${result.xp_earned} XP\n\n${result.explanation}`
                    : `❌ Not quite right. The correct answer is option ${currentQuiz?.correct_answer! + 1}.\n\n${result.explanation}`,
                type: 'explanation',
                timestamp: new Date().toISOString(),
                metadata: { xp_earned: result.xp_earned, correct: result.correct }
            };

            setTimeout(() => {
                setMessages(prev => [...prev, resultMessage]);
                setCurrentQuiz(null);
            }, 500);

        } catch (error) {
            // handle error
        }
    };

    const quickActions = [
        { id: 'motivation', label: 'Get Motivation', icon: <Brain size={16} /> },
        { id: 'study-plan', label: 'Study Plan', icon: <Target size={16} /> },
        { id: 'quiz', label: 'Practice Quiz', icon: <Zap size={16} /> },
        { id: 'explain', label: 'Explain Concept', icon: <BookOpen size={16} /> },
        { id: 'past-papers', label: 'Past Papers', icon: <BookOpen size={16} /> },
        { id: 'weakness', label: 'Weak Areas', icon: <TrendingUp size={16} /> }
    ];

    const renderMessage = (message: AIMessage) => {
        const isUser = message.id.startsWith('user_');
        const agent = { name: 'Kana', icon: '📚', color: 'purple' };

        if (message.type === 'quiz' && message.metadata) {
            const quiz = message.metadata as QuizDrop;
            return (
                <div key={message.id} className="mb-6">
                    <div className="flex justify-start mb-4">
                        <div className="max-w-[80%] bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg">{agent.icon}</span>
                                <span className="font-medium text-purple-300">{agent.name}</span>
                                <span className="text-xs text-gray-400">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <p className="text-white mb-3">{message.content}</p>
                            <div className="bg-dark/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-white">{quiz.question}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-xs ${quiz.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                                            quiz.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                            {quiz.difficulty}
                                        </span>
                                        <span className="text-primary text-xs">+{quiz.xp_reward} XP</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {quiz.options.map((option, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleQuizSubmit(quiz.id, index)}
                                            disabled={selectedAnswer !== null}
                                            className={`w-full text-left p-3 rounded-lg transition-colors ${selectedAnswer !== null
                                                ? index === quiz.correct_answer
                                                    ? 'bg-green-500/20 border border-green-500/40 text-green-300'
                                                    : selectedAnswer === index
                                                        ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                                                        : 'bg-gray-800/50 text-gray-400'
                                                : 'bg-primary/10 hover:bg-primary/20 border border-primary/20 text-white'
                                                }`}
                                        >
                                            <span className="font-medium mr-2">
                                                {String.fromCharCode(65 + index)}.
                                            </span>
                                            {option}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between mt-3 text-sm">
                                    <span className="text-gray-400">{quiz.subject}</span>
                                    {selectedAnswer !== null && (
                                        <span className={selectedAnswer === quiz.correct_answer ? 'text-green-400' : 'text-red-400'}>
                                            {selectedAnswer === quiz.correct_answer ? '✓ Correct' : '✗ Incorrect'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className={`max-w-[80%] ${isUser
                    ? 'bg-primary/20 border border-primary/40'
                    : 'bg-purple-500/10 border border-purple-500/20'
                    } rounded-lg p-3`}>
                    {!isUser && (
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{agent.icon}</span>
                            <span className="font-medium text-purple-300">{agent.name}</span>
                        </div>
                    )}
                    <p className="text-white whitespace-pre-wrap">{message.content}</p>
                    {message.metadata?.xp_earned && (
                        <div className="mt-2 px-2 py-1 bg-primary/20 rounded text-primary text-sm">
                            +{message.metadata.xp_earned} XP earned!
                        </div>
                    )}
                    <span className="text-xs text-gray-400 mt-2 block">
                        {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                </div>
            </div>
        );
    };    return (
        <div className="w-full h-full flex flex-col bg-dark rounded-lg overflow-hidden">
            {/* Header - Fixed */}
            <div className="flex-shrink-0 p-4 border-b border-primary/20 bg-dark/95 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-lg">
                        📚
                    </div>
                    <div>
                        <h2 className="font-medium text-white">Kana</h2>
                        <span className="text-sm text-gray-400">
                            Study Coach & Academic Assistant
                        </span>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-400">
                            <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center text-4xl mx-auto mb-4">
                                📚
                            </div>
                            <h3 className="text-xl font-medium mb-2">
                                Chat with Kana
                            </h3>
                            <p className="text-sm mb-4">
                                Get study tips, motivation, explanations, past papers, and more!
                            </p>
                            <p className="text-xs text-gray-500">
                                Try asking a question or use the quick actions below!
                            </p>
                        </div>
                    </div>
                ) : (
                    messages.map(renderMessage)
                )}
                {isTyping && (
                    <div className="flex justify-start mb-4">
                        <div className="bg-purple-500/10 border-purple-500/20 rounded-lg p-3 border">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">📚</span>
                                <span className="text-gray-400">is typing</span>
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />            </div>
            {/* Quick Actions & Special - now just above the text input */}
            <div className="p-4 border-t border-primary/20 bg-dark/90">
                <div className="flex flex-wrap gap-2 mb-2">
                    {quickActions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => handleQuickAction(action.id)}
                            className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors text-sm flex items-center gap-2"
                        >
                            {action.icon}
                            {action.label}
                        </button>
                    ))}
                </div>
                <div className="mt-2">
                    <button
                        onClick={handleQuizDrop}
                        className="w-full p-3 rounded-lg bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/40 text-white hover:from-primary/30 hover:to-purple-500/30 transition-all"
                    >
                        <Zap size={16} className="inline mr-2" />
                        Quiz Drop!
                    </button>
                </div>
            </div>
            {/* Message Input */}
            <div className="p-4 border-t border-primary/20">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Ask Kana anything..."
                        className="flex-1 bg-dark/50 border border-primary/20 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isTyping}
                        className="p-2 rounded-full bg-primary text-dark disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
};