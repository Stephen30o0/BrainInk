import React, { useState, useEffect } from 'react';
import { PixelButton } from './shared/PixelButton';
import { chainlinkTestnetService } from '../services/chainlinkTestnetService';

export const QuestSection = () => {
  const [selectedRank, setSelectedRank] = useState('gold');
  const [todaysQuiz, setTodaysQuiz] = useState<any>(null);
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [loadingChainlink, setLoadingChainlink] = useState(false);

  // Load Chainlink data
  useEffect(() => {
    loadChainlinkData();
  }, []);

  const loadChainlinkData = async () => {
    try {
      setLoadingChainlink(true);
      
      // Set contract addresses
      chainlinkTestnetService.setContractAddresses({
        chainlinkIntegration: '0xA50de864EaFD91d472106F568cdB000F25C65EA8',
        xpToken: '0x8273A230b80C9621e767bC2154455b297CEC5BD6',
        badgeNFT: '0xd5fddF56bcacD54D15083989DC7b9Dd88dE78df3'
      });

      // Load today's Chainlink-powered quiz
      const quiz = await chainlinkTestnetService.getTodaysQuiz();
      setTodaysQuiz(quiz);

      // Load current ETH price for dynamic rewards
      const price = await chainlinkTestnetService.getCurrentETHPrice();
      setEthPrice(price);
    } catch (error) {
      console.log('Chainlink data will load when wallet is connected');
    } finally {
      setLoadingChainlink(false);
    }
  };

  const startChainlinkQuiz = async () => {
    try {
      if (!todaysQuiz) {
        // Generate a new quiz using Chainlink Functions
        setLoadingChainlink(true);
        await chainlinkTestnetService.generateTestQuiz();
        await loadChainlinkData();
      } else {
        // Navigate to quiz interface with Chainlink data
        window.location.href = '/quiz/chainlink';
      }
    } catch (error) {
      console.error('Error starting Chainlink quiz:', error);
      alert('Please connect your wallet to access Chainlink-powered quizzes!');
    }
  };

  const ranks = [{
    id: 'bronze',
    name: 'Bronze Scholar',
    color: '#cd7f32',
    xp: '0-1000'
  }, {
    id: 'gold',
    name: 'Gold Thinker',
    color: '#ffd700',
    xp: '1001-5000'
  }, {
    id: 'diamond',
    name: 'Diamond Prodigy',
    color: '#b9f2ff',
    xp: '5001-15000'
  }, {
    id: 'master',
    name: 'Master Sage',
    color: '#a020f0',
    xp: '15001-50000'
  }, {
    id: 'emerald',
    name: 'Emerald Elite',
    color: '#50c878',
    xp: '50001+'
  }];
  return <section className="min-h-screen w-full bg-dark py-20 relative overflow-hidden" id="quests">
      {/* Decorative background elements */}
      <div className="absolute inset-0 z-0">
        {/* Diagonal lines */}
        <div className="w-full h-full opacity-10" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, #00a8ff, #00a8ff 2px, transparent 2px, transparent 10px)'
      }}></div>
      </div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-pixel text-3xl md:text-4xl mb-4 text-primary">
            CHOOSE YOUR <span className="text-secondary">QUEST</span>
          </h2>
          <p className="text-gray-300 font-pixel text-sm max-w-2xl mx-auto">
            Level Up Like a Legend
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Rank Progression */}
          <div className="w-full md:w-1/2">
            <div className="bg-dark/50 border-2 border-primary/30 rounded-lg p-6">
              <h3 className="font-pixel text-primary text-xl mb-6">
                Rank Progression
              </h3>
              <div className="space-y-6">
                {ranks.map(rank => <div key={rank.id} className={`relative cursor-pointer transition-all ${selectedRank === rank.id ? 'scale-105' : ''}`} onClick={() => setSelectedRank(rank.id)}>
                    <div className="flex items-center">
                      {/* Rank Icon */}
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${selectedRank === rank.id ? 'animate-pulse-slow' : ''}`} style={{
                    backgroundColor: `${rank.color}20`,
                    borderColor: rank.color,
                    boxShadow: selectedRank === rank.id ? `0 0 10px ${rank.color}80` : 'none'
                  }}>
                        <div className="w-6 h-6 rounded-full" style={{
                      backgroundColor: rank.color
                    }}></div>
                      </div>
                      {/* Rank Details */}
                      <div className="flex-1">
                        <h4 className="font-pixel text-sm mb-1" style={{
                      color: rank.color
                    }}>
                          {rank.name}
                        </h4>
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-800 h-2 rounded-full overflow-hidden">
                            <div className="h-full" style={{
                          width: selectedRank === rank.id ? '60%' : '40%',
                          backgroundColor: rank.color
                        }}></div>
                          </div>
                          <span className="ml-2 text-xs text-gray-400">
                            {rank.xp} XP
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Connection Line */}
                    {rank.id !== ranks[ranks.length - 1].id && <div className="absolute left-6 top-12 w-0.5 h-6 bg-gray-700"></div>}
                  </div>)}
              </div>
            </div>
          </div>
          {/* Achievements & Rewards */}
          <div className="w-full md:w-1/2">
            <div className="bg-dark/50 border-2 border-primary/30 rounded-lg p-6">
              <h3 className="font-pixel text-primary text-xl mb-6">
                Achievements & Rewards
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[{
                name: 'First Question',
                icon: '❓',
                desc: 'Asked your first question'
              }, {
                name: 'Quiz Master',
                icon: '🎯',
                desc: 'Win 5 quizzes in a row'
              }, {
                name: 'Knowledge Seeker',
                icon: '🔍',
                desc: 'Complete 10 courses'
              }, {
                name: 'Social Butterfly',
                icon: '🦋',
                desc: 'Join 3 discussion rooms'
              }, {
                name: 'Token Collector',
                icon: '💰',
                desc: 'Earn 100 INK tokens'
              }, {
                name: 'Perfect Score',
                icon: '💯',
                desc: 'Get 100% on any test'
              }].map((achievement, i) => <div key={i} className="bg-dark border border-primary/20 p-4 rounded-lg hover:border-primary/50 transition-colors hover-scale">
                    <div className="text-2xl mb-2">{achievement.icon}</div>
                    <h3 className="font-pixel text-primary text-xs mb-1">
                      {achievement.name}
                    </h3>
                    <p className="text-gray-400 text-xs">{achievement.desc}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-secondary">+50 XP</span>
                      <div className="w-4 h-4 rounded-full border border-secondary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-secondary"></div>
                      </div>
                    </div>
                  </div>)}
              </div>
              <div className="mt-6 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-yellow-400/20 border border-yellow-400 flex items-center justify-center mr-3">
                    <span className="text-yellow-400 text-lg">🎁</span>
                  </div>
                  <div>
                    <h4 className="font-pixel text-yellow-400 text-sm">
                      Daily Reward
                    </h4>
                    <p className="text-gray-300 text-xs">
                      Log in tomorrow to claim 25 INK tokens and XP boost!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center mt-12">
          <PixelButton primary onClick={startChainlinkQuiz} disabled={loadingChainlink}>
            {loadingChainlink ? 'Loading Quiz...' : 'View All Quests'}
          </PixelButton>
        </div>
      </div>
    </section>;
};