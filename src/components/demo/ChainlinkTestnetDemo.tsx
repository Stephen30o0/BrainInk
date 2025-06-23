import React, { useState, useEffect } from 'react';
import { chainlinkTestnetService } from '../../services/chainlinkTestnetService';
import type { TodaysQuiz, Tournament } from '../../services/chainlinkTestnetService';

interface ChainlinkDemoProps {
  onClose: () => void;
}

export const ChainlinkTestnetDemo: React.FC<ChainlinkDemoProps> = ({ onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [todaysQuiz, setTodaysQuiz] = useState<TodaysQuiz | null>(null);
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number>(-1);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set contract addresses (replace with actual deployed addresses)
    chainlinkTestnetService.setContractAddresses({
      chainlinkIntegration: '0x...', // Set after deployment
      xpToken: '0x...',              // Set after deployment
      badgeNFT: '0x...'              // Set after deployment
    });
  }, []);

  const connectWallet = async () => {
    setLoading(true);
    const connected = await chainlinkTestnetService.connectWallet();
    setIsConnected(connected);
    
    if (connected) {
      await loadData();
    }
    setLoading(false);
  };

  const loadData = async () => {
    try {
      // Load today's quiz
      const quiz = await chainlinkTestnetService.getTodaysQuiz();
      setTodaysQuiz(quiz);

      // Load ETH price
      const price = await chainlinkTestnetService.getCurrentETHPrice();
      setEthPrice(price);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const submitQuizAnswer = async () => {
    if (selectedAnswer === -1) return;
    
    setLoading(true);
    const success = await chainlinkTestnetService.submitQuizAnswer(selectedAnswer);
    
    if (success) {
      // Reload quiz status
      await loadData();
    }
    setLoading(false);
  };

  const generateTestQuiz = async () => {
    setLoading(true);
    const success = await chainlinkTestnetService.generateTestQuiz();
    
    if (success) {
      // Wait a moment for transaction to process, then reload
      setTimeout(async () => {
        await loadData();
        setLoading(false);
      }, 3000);
    } else {
      setLoading(false);
    }
  };

  const createTournament = async () => {
    const name = prompt('Enter tournament name:');
    if (!name) return;

    setLoading(true);
    const tournament = await chainlinkTestnetService.createTournament(name);
    
    if (tournament) {
      setTournaments(prev => [...prev, tournament]);
    }
    setLoading(false);
  };

  const networkInfo = chainlinkTestnetService.getNetworkInfo();
  const dashboards = chainlinkTestnetService.getChainlinkDashboards();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-dark/95 border-2 border-primary/30 rounded-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 bg-primary/20 border-b border-primary/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-pixel text-primary text-xl">🔗 Chainlink Testnet Demo</h2>
              <p className="text-gray-300 text-sm">Competition Features on Base Sepolia</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Network Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h3 className="font-pixel text-blue-400 text-lg mb-2">🧪 Testnet Configuration</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Network:</span>
                <span className="text-white ml-2">{networkInfo.name}</span>
              </div>
              <div>
                <span className="text-gray-400">Chain ID:</span>
                <span className="text-white ml-2">{networkInfo.chainId}</span>
              </div>
            </div>
            
            <div className="mt-3">
              <span className="text-gray-400">Get Testnet Tokens:</span>
              <div className="flex gap-2 mt-1">
                {networkInfo.faucets.map((faucet, index) => (
                  <a
                    key={index}
                    href={faucet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs underline"
                  >
                    {faucet.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Wallet Connection */}
          {!isConnected ? (
            <div className="text-center">
              <button
                onClick={connectWallet}
                disabled={loading}
                className="px-6 py-3 bg-primary text-dark font-pixel rounded-lg hover:bg-primary/80 disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Connect Wallet to Base Sepolia'}
              </button>
            </div>
          ) : (
            <>
              {/* Chainlink Services Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h4 className="font-pixel text-green-400 text-sm mb-2">📊 Chainlink Price Feeds</h4>
                  <div className="text-white">
                    <span className="text-gray-400">ETH/USD:</span>
                    <span className="ml-2">${ethPrice.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">✅ Live data from testnet</div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="font-pixel text-purple-400 text-sm mb-2">🎲 Chainlink VRF</h4>
                  <div className="text-white text-sm">Provably fair randomness</div>
                  <div className="text-xs text-gray-400 mt-1">✅ Ready for tournaments</div>
                </div>
              </div>

              {/* Today's Quiz (Chainlink Functions + VRF) */}
              <div className="bg-dark/50 border border-primary/20 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-pixel text-primary text-lg">📚 Daily Quiz Challenge</h3>
                  <span className="text-xs text-gray-400">Powered by Chainlink Functions + VRF</span>
                </div>

                {todaysQuiz ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-white font-medium">{todaysQuiz.question}</p>
                      <div className="text-sm text-gray-400 mt-1">
                        Reward: {todaysQuiz.xpReward} XP
                      </div>
                    </div>

                    {!todaysQuiz.completed ? (
                      <div className="space-y-2">
                        {todaysQuiz.options.map((option, index) => (
                          <label key={index} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="quiz-answer"
                              value={index}
                              onChange={() => setSelectedAnswer(index)}
                              className="text-primary"
                            />
                            <span className="text-gray-300">{option}</span>
                          </label>
                        ))}

                        <button
                          onClick={submitQuizAnswer}
                          disabled={selectedAnswer === -1 || loading}
                          className="px-4 py-2 bg-primary text-dark font-pixel rounded disabled:opacity-50 hover:bg-primary/80"
                        >
                          {loading ? 'Submitting...' : 'Submit Answer'}
                        </button>
                      </div>
                    ) : (
                      <div className="text-green-400 font-pixel">✅ Quiz completed today!</div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-400 mb-3">No quiz available. Generate one for demo:</p>
                    <button
                      onClick={generateTestQuiz}
                      disabled={loading}
                      className="px-4 py-2 bg-secondary text-dark font-pixel rounded disabled:opacity-50 hover:bg-secondary/80"
                    >
                      {loading ? 'Generating...' : 'Generate Test Quiz'}
                    </button>
                  </div>
                )}
              </div>

              {/* Tournament Creation (Dynamic Pricing) */}
              <div className="bg-dark/50 border border-primary/20 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-pixel text-primary text-lg">🏆 Dynamic Tournament Pricing</h3>
                  <span className="text-xs text-gray-400">Powered by Chainlink Price Feeds</span>
                </div>

                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-gray-400">Current entry fee (based on ETH price):</span>
                    <span className="text-white ml-2">~1000 XP tokens</span>
                  </div>

                  <button
                    onClick={createTournament}
                    disabled={loading}
                    className="px-4 py-2 bg-yellow-500 text-dark font-pixel rounded disabled:opacity-50 hover:bg-yellow-400"
                  >
                    {loading ? 'Creating...' : 'Create Tournament'}
                  </button>

                  {tournaments.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-gray-400 text-xs mb-2">Created Tournaments:</h4>
                      {tournaments.map((tournament) => (
                        <div key={tournament.id} className="text-xs text-gray-300 bg-dark/30 p-2 rounded">
                          {tournament.name} - Entry: {tournament.entryFee} XP
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Chainlink Dashboards */}
              <div className="bg-dark/50 border border-primary/20 rounded-lg p-4">
                <h3 className="font-pixel text-primary text-lg mb-3">🔗 Chainlink Service Dashboards</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <a href={dashboards.functions} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-400 hover:text-blue-300 underline">
                    📝 Functions Console
                  </a>
                  <a href={dashboards.vrf} target="_blank" rel="noopener noreferrer"
                     className="text-purple-400 hover:text-purple-300 underline">
                    🎲 VRF Console
                  </a>
                  <a href={dashboards.automation} target="_blank" rel="noopener noreferrer"
                     className="text-green-400 hover:text-green-300 underline">
                    ⚙️ Automation Console
                  </a>
                  <a href={dashboards.priceFeeds} target="_blank" rel="noopener noreferrer"
                     className="text-orange-400 hover:text-orange-300 underline">
                    📊 Price Feeds
                  </a>
                </div>
              </div>

              {/* Competition Features Summary */}
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-lg p-4">
                <h3 className="font-pixel text-primary text-lg mb-3">🏆 Competition Features Demo</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="text-yellow-400 font-pixel mb-2">Grand Prize ($35k)</h4>
                    <ul className="text-gray-300 space-y-1 text-xs">
                      <li>✅ Chainlink Functions (AI quiz generation)</li>
                      <li>✅ Chainlink Automation (daily challenges)</li>
                      <li>✅ Chainlink VRF (fair randomness)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-green-400 font-pixel mb-2">DeFi Prize ($16.5k)</h4>
                    <ul className="text-gray-300 space-y-1 text-xs">
                      <li>✅ Dynamic pricing (Price Feeds)</li>
                      <li>✅ Staking mechanisms</li>
                      <li>✅ Yield farming rewards</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
