import React, { useState, useEffect } from 'react';
import { chainlinkTestnetService } from '../../services/chainlinkTestnetService';

interface ChainlinkGrandPrizeDemoProps {
  onClose: () => void;
}

export const ChainlinkGrandPrizeDemo: React.FC<ChainlinkGrandPrizeDemoProps> = ({ onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [todaysQuiz, setTodaysQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'functions' | 'vrf' | 'automation' | 'pricefeeds'>('functions');

  useEffect(() => {
    // Set the deployed contract addresses
    chainlinkTestnetService.setContractAddresses({
      chainlinkIntegration: '0xA50de864EaFD91d472106F568cdB000F25C65EA8',
      xpToken: '0x8273A230b80C9621e767bC2154455b297CEC5BD6',
      badgeNFT: '0xd5fddF56bcacD54D15083989DC7b9Dd88dE78df3'
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
      // Load ETH price from Chainlink Price Feeds
      const price = await chainlinkTestnetService.getCurrentETHPrice();
      setEthPrice(price);

      // Load today's quiz from Chainlink Functions
      const quiz = await chainlinkTestnetService.getTodaysQuiz();
      setTodaysQuiz(quiz);
    } catch (error) {
      console.error('Error loading Chainlink data:', error);
    }
  };

  const generateTestQuiz = async () => {
    setLoading(true);
    try {
      await chainlinkTestnetService.generateTestQuiz();
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error generating quiz:', error);
    }
    setLoading(false);
  };

  const createRandomTournament = async () => {
    setLoading(true);
    try {
      await chainlinkTestnetService.createTournament("VRF Tournament " + Date.now());
      alert('Tournament created with Chainlink VRF for random winner selection!');
    } catch (error) {
      console.error('Error creating tournament:', error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            🏆 Chainlink Grand Prize Demo
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {!isConnected ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Connect to Base Sepolia Testnet</h3>
              <p className="text-gray-600 mb-4">
                Experience all 4 Chainlink Grand Prize features integrated into Brain Ink!
              </p>
            </div>
            <button
              onClick={connectWallet}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        ) : (
          <div>
            {/* Tab Navigation */}
            <div className="flex border-b mb-6">
              {[
                { id: 'functions', label: '🔮 Functions', desc: 'Dynamic Quiz Generation' },
                { id: 'vrf', label: '🎲 VRF', desc: 'Random Tournaments' },
                { id: 'automation', label: '⚡ Automation', desc: 'Daily Challenges' },
                { id: 'pricefeeds', label: '📈 Price Feeds', desc: 'Live ETH Price' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div>{tab.label}</div>
                  <div className="text-xs">{tab.desc}</div>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === 'functions' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">🔮 Chainlink Functions - Dynamic Quiz Generation</h3>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Chainlink Functions enables our platform to generate dynamic quiz content by calling external APIs.
                      This creates engaging, up-to-date educational content that adapts to current events and trends.
                    </p>
                  </div>
                  
                  {todaysQuiz ? (
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold mb-2">Today's Generated Quiz:</h4>
                      <p className="mb-2"><strong>Q:</strong> {todaysQuiz.question}</p>
                      <div className="mb-2">
                        {todaysQuiz.options.map((option: string, index: number) => (
                          <div key={index} className="ml-4">• {option}</div>
                        ))}
                      </div>
                      <p className="text-sm text-blue-600">XP Reward: {todaysQuiz.xpReward}</p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                      <p>No quiz generated yet for today. Generate one using Chainlink Functions!</p>
                    </div>
                  )}
                  
                  <button
                    onClick={generateTestQuiz}
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'Generate New Quiz'}
                  </button>
                </div>
              )}

              {activeTab === 'vrf' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">🎲 Chainlink VRF - Provably Random Tournaments</h3>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Chainlink VRF (Verifiable Random Function) provides cryptographically secure randomness for 
                      tournament winner selection, ensuring fair and transparent competition results.
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold mb-2">Tournament Features:</h4>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Cryptographically secure random winner selection</li>
                      <li>Transparent and verifiable on-chain</li>
                      <li>Automated prize distribution</li>
                      <li>Dynamic entry fees based on market conditions</li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={createRandomTournament}
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create VRF Tournament'}
                  </button>
                </div>
              )}

              {activeTab === 'automation' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">⚡ Chainlink Automation - Daily Challenge System</h3>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Chainlink Automation enables our platform to automatically trigger daily challenges, 
                      ensuring consistent user engagement without manual intervention.
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold mb-2">Automation Features:</h4>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Daily quiz generation triggered automatically</li>
                      <li>Challenge progression tracking</li>
                      <li>Reward distribution automation</li>
                      <li>Cross-chain compatibility</li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm">
                      <strong>Status:</strong> Automation is configured and will trigger daily at midnight UTC.
                      The system monitors blockchain conditions and executes challenges automatically.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'pricefeeds' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">📈 Chainlink Price Feeds - Live Market Data</h3>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Chainlink Price Feeds provide real-time, accurate price data that enables dynamic 
                      pricing for tournament entries and reward calculations.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold mb-2">Current ETH Price:</h4>
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      ${ethPrice.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600">
                      This live price data is used to calculate dynamic tournament entry fees and reward multipliers.
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Price Feed Applications:</h4>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Dynamic tournament entry fees</li>
                      <li>Market-responsive reward calculations</li>
                      <li>Economic incentive balancing</li>
                      <li>Cross-asset price correlations</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t">
              <div className="text-center text-sm text-gray-600">
                🏆 <strong>Chainlink Grand Prize Integration Complete!</strong><br/>
                All 4 core Chainlink services integrated into Brain Ink platform<br/>
                <span className="text-blue-600">Base Sepolia Testnet</span> • 
                <span className="text-green-600 ml-1">Ready for Competition Demo</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChainlinkGrandPrizeDemo;
