import React, { useState } from 'react';
import { UnifiedTournamentHub } from '../components/arena/UnifiedTournamentHub';
import { QuizMatch } from '../components/tournaments/QuizMatch';
import { ChainlinkAutomation } from '../components/dashboard/ChainlinkAutomation';

interface TournamentIntegrationProps {
    userAddress: string;
}

export const TournamentIntegration: React.FC<TournamentIntegrationProps> = ({ userAddress }) => {
    const [activeView, setActiveView] = useState<'dashboard' | 'match' | 'chainlink'>('dashboard');
    const [activeMatch, setActiveMatch] = useState<{ tournamentId: string; matchId: string } | null>(null);

    const handleStartMatch = (tournamentId: string, matchId: string) => {
        setActiveMatch({ tournamentId, matchId });
        setActiveView('match');
    };

    const handleMatchComplete = () => {
        setActiveView('dashboard');
        setActiveMatch(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark via-dark/95 to-primary/5 p-6">
            {/* Navigation */}
            <div className="max-w-6xl mx-auto mb-6">
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => setActiveView('dashboard')}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeView === 'dashboard'
                            ? 'bg-primary text-dark'
                            : 'bg-dark/50 text-gray-300 hover:bg-dark/70'
                            }`}
                    >
                        🏆 Tournament Dashboard
                    </button>

                    <button
                        onClick={() => setActiveView('chainlink')}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeView === 'chainlink'
                            ? 'bg-primary text-dark'
                            : 'bg-dark/50 text-gray-300 hover:bg-dark/70'
                            }`}
                    >
                        🔗 Chainlink Automation
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto">
                {activeView === 'dashboard' && (
                    <UnifiedTournamentHub
                        onBack={() => setActiveView('dashboard')}
                        onStartQuiz={(tournamentId) => handleStartMatch(tournamentId, 'default-match')}
                    />
                )}

                {activeView === 'match' && activeMatch && (
                    <QuizMatch
                        tournamentId={activeMatch.tournamentId}
                        matchId={activeMatch.matchId}
                        userAddress={userAddress}
                        onMatchComplete={handleMatchComplete}
                    />
                )}

                {activeView === 'chainlink' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-primary mb-2">🔗 Chainlink Automation</h1>
                            <p className="text-gray-300">
                                Daily challenges and AI-powered question generation
                            </p>
                        </div>

                        <ChainlinkAutomation
                            onChallengeComplete={(xpEarned) => {
                                console.log(`XP earned from daily challenge: ${xpEarned}`);
                            }}
                        />

                        <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-6">
                            <h3 className="text-lg font-bold text-blue-400 mb-3">
                                🧠 Kana AI + Chainlink Integration
                            </h3>
                            <div className="space-y-3 text-sm text-gray-300">
                                <p>
                                    <strong>🔗 Chainlink Functions:</strong> Securely connects to Kana AI backend for question generation
                                </p>
                                <p>
                                    <strong>🎯 Tournament Questions:</strong> 7-15 questions per match, configurable difficulty and subjects
                                </p>
                                <p>
                                    <strong>⚡ Dynamic Generation:</strong> Questions generated in real-time using AI with tamper-proof randomness
                                </p>
                                <p>
                                    <strong>📊 Backend API:</strong> Full tournament management with PostgreSQL persistence
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Integration Status */}
            <div className="fixed bottom-4 right-4 bg-dark/90 border border-primary/30 rounded-lg p-4 max-w-sm">
                <h4 className="font-bold text-primary mb-2">🔧 Integration Status</h4>
                <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-gray-300">Backend API Connected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-gray-300">Chainlink Functions Ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-gray-300">AI Question Generation</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="text-gray-300">7-15 Questions Configurable</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TournamentIntegration;
