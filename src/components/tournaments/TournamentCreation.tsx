import React, { useState, useEffect, useRef } from 'react';
import { backendTournamentService } from '../../services/backendTournamentService';
import { chainlinkTestnetService } from '../../services/chainlinkTestnetService';
import { useWallet } from '../shared/WalletContext';

interface TournamentCreationProps {
    userAddress: string;
    onTournamentCreated?: (tournamentId: string) => void;
    onClose?: () => void;
}

export const TournamentCreation: React.FC<TournamentCreationProps> = ({
    userAddress,
    onTournamentCreated,
    onClose
}) => {
    const { provider, signer } = useWallet();
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        max_players: 8,
        entry_fee: 0,
        prize_pool: 0,
        questions_per_match: 10, // 7-15 questions configurable
        time_limit_minutes: 30,
        difficulty_level: 'medium' as 'easy' | 'medium' | 'hard',
        subject_category: 'general',
        custom_topics: [] as string[],
        is_public: true
    });

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
    const [customTopicInput, setCustomTopicInput] = useState('');
    const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const [debugScrollButtons, setDebugScrollButtons] = useState(false); // Debug mode
    const [inkBalance, setInkBalance] = useState<string>('0');
    const [loadingBalance, setLoadingBalance] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize services and load available subjects
        backendTournamentService.initialize(userAddress, provider || undefined, signer || undefined);
        setAvailableSubjects(backendTournamentService.getAvailableSubjects());

        // Load INK balance if wallet is connected
        if (provider && signer) {
            loadInkBalance();
        }
    }, [userAddress, provider, signer]);

    const loadInkBalance = async () => {
        if (!provider || !signer) return;

        try {
            setLoadingBalance(true);
            const balance = await backendTournamentService.getINKBalance();
            setInkBalance(balance);
        } catch (error) {
            console.error('Failed to load INK balance:', error);
            setInkBalance('0');
        } finally {
            setLoadingBalance(false);
        }
    };

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
    }, [formData, previewQuestions, showPreview]); // Re-run when content changes

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setError(null);
    };

    const addCustomTopic = () => {
        if (customTopicInput.trim() && !formData.custom_topics.includes(customTopicInput.trim())) {
            setFormData(prev => ({
                ...prev,
                custom_topics: [...prev.custom_topics, customTopicInput.trim()]
            }));
            setCustomTopicInput('');
        }
    };

    const removeCustomTopic = (topic: string) => {
        setFormData(prev => ({
            ...prev,
            custom_topics: prev.custom_topics.filter(t => t !== topic)
        }));
    };

    const previewChainlinkQuestions = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Generate preview questions using Chainlink + Kana AI
            const questions = await backendTournamentService.generateChainlinkQuestions(
                formData.subject_category,
                formData.difficulty_level,
                Math.min(formData.questions_per_match, 3) // Preview only 3 questions
            );

            setPreviewQuestions(questions);
            setShowPreview(true);
        } catch (err: any) {
            setError(`Preview failed: ${err.message}`);
            console.error('Preview error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const validateForm = (): string | null => {
        if (!formData.name.trim()) return 'Tournament name is required';
        if (!backendTournamentService.validateMaxPlayers(formData.max_players)) {
            return 'Max players must be 4, 8, 16, 32, or 64';
        }
        if (!backendTournamentService.validateQuestionCount(formData.questions_per_match)) {
            return 'Questions per match must be between 7 and 15';
        }
        if (formData.time_limit_minutes < 5 || formData.time_limit_minutes > 120) {
            return 'Time limit must be between 5 and 120 minutes';
        }
        return null;
    };

    const handleCreateTournament = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        // Additional validation
        if (!userAddress || userAddress.trim() === '') {
            setError('User address is required. Please connect your wallet.');
            return;
        }

        if (!formData.name || formData.name.trim() === '') {
            setError('Tournament name is required.');
            return;
        }

        // Validate INK token requirements
        if (formData.prize_pool > 0) {
            if (!provider || !signer) {
                setError('Wallet connection required for INK token transactions. Please connect your wallet.');
                return;
            }
        }

        try {
            setIsLoading(true);
            setError(null);

            console.log('Creating tournament with data:', {
                ...formData,
                creator_address: userAddress
            });

            // Check INK balance if prize pool is set
            if (formData.prize_pool > 0) {
                console.log(`💰 Prize pool required: ${formData.prize_pool} INK tokens`);

                try {
                    const balance = await backendTournamentService.getINKBalance();
                    console.log(`💰 Current INK balance: ${balance}`);

                    if (parseFloat(balance) < formData.prize_pool) {
                        setError(`Insufficient INK balance. You have ${balance} INK but need ${formData.prize_pool} INK for the prize pool.`);
                        return;
                    }
                } catch (balanceError: any) {
                    console.error('Error checking INK balance:', balanceError);
                    setError(`Failed to check INK balance: ${balanceError.message}`);
                    return;
                }
            }

            const result = await backendTournamentService.createTournament({
                ...formData,
                creator_address: userAddress.toLowerCase().trim(),
                name: formData.name.trim(),
                description: formData.description.trim()
            });

            if (result.success) {
                console.log(`🏆 Tournament created: ${result.tournament.name} (ID: ${result.tournament_id})`);

                if (result.transaction_hash) {
                    console.log(`💰 INK tokens transferred: ${result.transaction_hash}`);
                    setError(null);
                    // Show success message with transaction hash
                    alert(`Tournament created successfully! ${formData.prize_pool > 0 ? `INK tokens transferred: ${result.transaction_hash}` : ''}`);
                }

                if (onTournamentCreated) {
                    onTournamentCreated(result.tournament_id);
                }
                if (onClose) {
                    onClose();
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create tournament');
            console.error('Tournament creation error:', err);
        } finally {
            setIsLoading(false);
        }
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

    return (
        <div className="h-full flex flex-col bg-dark/95 backdrop-blur-sm border border-primary/30 rounded-lg">
            <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-primary/20">
                <h2 className="text-2xl font-bold text-primary">Create Tournament</h2>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6" ref={containerRef}>
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                <div className="space-y-6 max-w-2xl mx-auto">{/* ...existing code... */}
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Tournament Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter tournament name"
                                className="w-full px-3 py-2 bg-dark/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Max Players *
                            </label>
                            <select
                                value={formData.max_players}
                                onChange={(e) => handleInputChange('max_players', parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-dark/50 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none"
                            >
                                <option value={4}>4 Players</option>
                                <option value={8}>8 Players</option>
                                <option value={16}>16 Players</option>
                                <option value={32}>32 Players</option>
                                <option value={64}>64 Players</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Describe your tournament..."
                            rows={3}
                            className="w-full px-3 py-2 bg-dark/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none"
                        />
                    </div>

                    {/* Quiz Configuration */}
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-primary mb-4">
                            🧠 Quiz Configuration (Powered by Chainlink + Kana AI)
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Questions per Match * (7-15)
                                </label>
                                <input
                                    type="number"
                                    min={7}
                                    max={15}
                                    value={formData.questions_per_match}
                                    onChange={(e) => handleInputChange('questions_per_match', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-dark/50 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    AI-generated questions via Chainlink Automation
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Time Limit (minutes)
                                </label>
                                <input
                                    type="number"
                                    min={5}
                                    max={120}
                                    value={formData.time_limit_minutes}
                                    onChange={(e) => handleInputChange('time_limit_minutes', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-dark/50 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Difficulty Level
                                </label>
                                <select
                                    value={formData.difficulty_level}
                                    onChange={(e) => handleInputChange('difficulty_level', e.target.value)}
                                    className="w-full px-3 py-2 bg-dark/50 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Subject Category
                                </label>
                                <select
                                    value={formData.subject_category}
                                    onChange={(e) => handleInputChange('subject_category', e.target.value)}
                                    className="w-full px-3 py-2 bg-dark/50 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none"
                                >
                                    {availableSubjects.map(subject => (
                                        <option key={subject} value={subject}>
                                            {subject.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Custom Topics (Optional)
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={customTopicInput}
                                    onChange={(e) => setCustomTopicInput(e.target.value)}
                                    placeholder="Add custom topic..."
                                    className="flex-1 px-3 py-2 bg-dark/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none"
                                    onKeyPress={(e) => e.key === 'Enter' && addCustomTopic()}
                                />
                                <button
                                    onClick={addCustomTopic}
                                    className="px-4 py-2 bg-primary/20 border border-primary/50 rounded-lg text-primary hover:bg-primary/30 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                            {formData.custom_topics.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.custom_topics.map(topic => (
                                        <span
                                            key={topic}
                                            className="px-3 py-1 bg-primary/20 border border-primary/50 rounded-full text-sm text-primary flex items-center gap-2"
                                        >
                                            {topic}
                                            <button
                                                onClick={() => removeCustomTopic(topic)}
                                                className="text-primary/70 hover:text-primary"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={previewChainlinkQuestions}
                                disabled={isLoading}
                                className="px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Generating...' : '🔗 Preview Chainlink Questions'}
                            </button>
                        </div>
                    </div>

                    {/* Tournament Settings */}
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-yellow-400">
                                💰 INK Token Economics
                            </h3>
                            <div className="text-right">
                                <div className="text-sm text-gray-400">Your INK Balance</div>
                                <div className="text-lg font-bold text-yellow-400">
                                    {loadingBalance ? 'Loading...' : `${inkBalance} INK`}
                                </div>
                                {provider && signer && (
                                    <button
                                        onClick={loadInkBalance}
                                        className="text-xs text-blue-400 hover:text-blue-300"
                                    >
                                        Refresh
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Entry Fee (INK tokens)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.1}
                                    value={formData.entry_fee}
                                    onChange={(e) => handleInputChange('entry_fee', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 bg-dark/50 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none"
                                    placeholder="0"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Participants pay this to join
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Prize Pool (INK tokens)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.1}
                                    value={formData.prize_pool}
                                    onChange={(e) => handleInputChange('prize_pool', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 bg-dark/50 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none"
                                    placeholder="0"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    You will pay this amount now
                                </p>
                            </div>
                        </div>

                        {formData.prize_pool > 0 && (
                            <div className={`border rounded-lg p-3 mb-4 ${parseFloat(inkBalance) >= formData.prize_pool
                                    ? 'bg-yellow-500/20 border-yellow-500/50'
                                    : 'bg-red-500/20 border-red-500/50'
                                }`}>
                                <p className={`text-sm ${parseFloat(inkBalance) >= formData.prize_pool
                                        ? 'text-yellow-300'
                                        : 'text-red-300'
                                    }`}>
                                    {parseFloat(inkBalance) >= formData.prize_pool ? (
                                        <>⚠️ <strong>You will be charged {formData.prize_pool} INK tokens</strong> when creating this tournament.
                                            The tokens will be held in escrow until the tournament completes.</>
                                    ) : (
                                        <>❌ <strong>Insufficient INK balance!</strong> You have {inkBalance} INK but need {formData.prize_pool} INK for the prize pool.</>
                                    )}
                                </p>
                            </div>
                        )}

                        {formData.entry_fee > 0 && (
                            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3">
                                <p className="text-blue-300 text-sm">
                                    💡 Participants will pay {formData.entry_fee} INK tokens to join.
                                    Total potential prize: {formData.prize_pool + (formData.entry_fee * formData.max_players)} INK
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="is_public"
                            checked={formData.is_public}
                            onChange={(e) => handleInputChange('is_public', e.target.checked)}
                            className="mr-2"
                        />
                        <label htmlFor="is_public" className="text-sm text-gray-300">
                            Make tournament public (visible to all users)
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={handleCreateTournament}
                            disabled={
                                isLoading ||
                                !formData.name.trim() ||
                                (formData.prize_pool > 0 && parseFloat(inkBalance) < formData.prize_pool) ||
                                (formData.prize_pool > 0 && (!provider || !signer))
                            }
                            className="flex-1 px-6 py-3 bg-primary text-dark font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Creating Tournament...' :
                                formData.prize_pool > 0 && parseFloat(inkBalance) < formData.prize_pool ? 'Insufficient INK Balance' :
                                    formData.prize_pool > 0 && (!provider || !signer) ? 'Connect Wallet for INK Tokens' :
                                        'Create Tournament'}
                        </button>

                        {onClose && (
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-dark border border-primary/30 rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-primary">
                                🔗 Chainlink + Kana AI Question Preview
                            </h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {previewQuestions.map((q, index) => (
                                <div key={index} className="border border-gray-600 rounded-lg p-4">
                                    <h4 className="font-medium text-white mb-2">Q{index + 1}: {q.question}</h4>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        {Object.entries(q.options).map(([letter, option]) => (
                                            <div
                                                key={letter}
                                                className={`p-2 rounded border ${letter === q.correct_answer
                                                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                                    : 'bg-gray-600/20 border-gray-600/50 text-gray-300'
                                                    }`}
                                            >
                                                {letter}: {String(option)}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-400">✅ {q.explanation}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                            <p className="text-blue-400 text-sm">
                                <strong>🔗 Powered by Chainlink Functions + Kana AI</strong><br />
                                Questions are dynamically generated using decentralized AI with tamper-proof randomness.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Scroll Buttons */}
            {(showScrollTop || debugScrollButtons) && (
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
            {(showScrollBottom || debugScrollButtons) && (
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

            {/* Debug button to test scroll buttons */}
            <button
                onClick={() => setDebugScrollButtons(!debugScrollButtons)}
                className="fixed top-20 right-6 z-[9999] bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg"
                title="Toggle scroll buttons (debug)"
            >
                {debugScrollButtons ? 'Hide' : 'Show'} Scroll Buttons
            </button>
        </div>
    );
};
