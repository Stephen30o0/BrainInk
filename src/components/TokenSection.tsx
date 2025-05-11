import React from 'react';
import { PixelButton } from './shared/PixelButton';
import { CoinsIcon, TrendingUpIcon, ShieldIcon, ZapIcon } from 'lucide-react';
export const TokenSection = () => {
  return <section className="min-h-screen w-full bg-dark py-20 relative overflow-hidden" id="tokens">
      {/* Background decorations */}
      <div className="absolute inset-0 z-0">
        {/* Floating coins */}
        {Array.from({
        length: 20
      }).map((_, i) => <div key={i} className="absolute animate-float" style={{
        width: `${Math.random() * 20 + 10}px`,
        height: `${Math.random() * 20 + 10}px`,
        backgroundColor: `rgba(255, 215, 0, ${Math.random() * 0.3 + 0.1})`,
        borderRadius: '50%',
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
        animationDuration: `${Math.random() * 10 + 5}s`,
        animationDelay: `${Math.random() * 5}s`
      }} />)}
        {/* Binary code background */}
        {Array.from({
        length: 10
      }).map((_, i) => <div key={i} className="absolute font-mono text-xs text-yellow-400/20" style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        transform: `rotate(${Math.random() * 360}deg)`
      }}>
            {Array.from({
          length: 50
        }).map(() => Math.round(Math.random())).join('')}
          </div>)}
      </div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-pixel text-3xl md:text-4xl mb-4 text-primary">
            <span className="text-yellow-400">INK TOKENS</span> & BLOCKCHAIN
            MAGIC
          </h2>
          <p className="text-gray-300 font-pixel text-sm max-w-2xl mx-auto">
            Learn to Earn: The Future of Education Is On-Chain
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Token Explainer */}
          <div className="w-full md:w-1/2">
            <div className="bg-dark/50 border-2 border-yellow-400/30 rounded-lg p-6 h-full">
              <h3 className="font-pixel text-yellow-400 text-xl mb-6">
                How INK Flows
              </h3>
              {/* Token Flow Chart */}
              <div className="relative py-10">
                {/* Flow steps */}
                <div className="flex justify-between relative">
                  {/* Connection line */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-yellow-400/30 -z-10"></div>
                  {[{
                  icon: '🎓',
                  label: 'Learn & Quiz'
                }, {
                  icon: '🏆',
                  label: 'Win'
                }, {
                  icon: '💰',
                  label: 'Earn Tokens'
                }, {
                  icon: '🔄',
                  label: 'Use or Cash Out'
                }].map((step, i) => <div key={i} className="flex flex-col items-center relative z-10">
                      <div className="w-12 h-12 rounded-full bg-dark border-2 border-yellow-400 flex items-center justify-center mb-2">
                        <span className="text-xl">{step.icon}</span>
                      </div>
                      <span className="font-pixel text-yellow-400 text-xs text-center">
                        {step.label}
                      </span>
                    </div>)}
                </div>
              </div>
              {/* Token Features */}
              <div className="space-y-6 mt-8">
                {[{
                icon: <ShieldIcon size={24} className="text-yellow-400" />,
                title: 'Secure Wallet',
                description: 'Every user gets a secure blockchain wallet to store INK tokens'
              }, {
                icon: <TrendingUpIcon size={24} className="text-yellow-400" />,
                title: 'Stake & Earn',
                description: 'Stake your tokens in tournaments or invest in premium content'
              }, {
                icon: <ZapIcon size={24} className="text-yellow-400" />,
                title: 'Instant Payouts',
                description: 'Withdraw your earnings anytime with minimal fees'
              }, {
                icon: <CoinsIcon size={24} className="text-yellow-400" />,
                title: 'Real Value',
                description: 'Exchange INK for other cryptocurrencies or fiat currency'
              }].map((feature, i) => <div key={i} className="flex hover-scale cursor-pointer">
                    <div className="w-12 h-12 rounded-lg bg-dark flex items-center justify-center mr-4 flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-pixel text-yellow-400 text-sm mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>)}
              </div>
            </div>
          </div>
          {/* Wallet Preview */}
          <div className="w-full md:w-1/2">
            <div className="bg-dark/50 border-2 border-yellow-400/30 rounded-lg overflow-hidden">
              {/* Wallet Header */}
              <div className="bg-yellow-400/20 p-4 border-b border-yellow-400/30">
                <div className="flex justify-between items-center">
                  <h3 className="font-pixel text-yellow-400 text-sm">
                    Your INK Wallet
                  </h3>
                  <div className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                    CONNECTED
                  </div>
                </div>
                <div className="flex items-center mt-2 text-xs text-gray-400">
                  <span>Wallet ID: ink_0x7f...e3a9</span>
                </div>
              </div>
              {/* Wallet Balance */}
              <div className="p-6 text-center">
                <div className="mb-4">
                  <span className="text-gray-400 text-sm">Current Balance</span>
                  <div className="flex items-center justify-center">
                    <CoinsIcon size={24} className="text-yellow-400 mr-2" />
                    <span className="font-pixel text-yellow-400 text-3xl">
                      125
                    </span>
                  </div>
                  <span className="text-gray-400 text-xs">≈ $12.50 USD</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button className="bg-yellow-400/20 border border-yellow-400/30 rounded-lg p-3 text-yellow-400 font-pixel text-xs hover:bg-yellow-400/30 transition-colors">
                    Send
                  </button>
                  <button className="bg-yellow-400/20 border border-yellow-400/30 rounded-lg p-3 text-yellow-400 font-pixel text-xs hover:bg-yellow-400/30 transition-colors">
                    Receive
                  </button>
                </div>
                {/* Transaction History */}
                <div className="bg-dark rounded-lg border border-yellow-400/20 overflow-hidden">
                  <div className="p-2 border-b border-yellow-400/20 text-left">
                    <span className="text-yellow-400 font-pixel text-xs">
                      Recent Transactions
                    </span>
                  </div>
                  <div className="p-2">
                    <div className="space-y-2">
                      {[{
                      type: 'earn',
                      amount: '+10',
                      desc: 'Quiz Victory',
                      time: '2h ago'
                    }, {
                      type: 'spend',
                      amount: '-25',
                      desc: 'Course Enrollment',
                      time: '1d ago'
                    }, {
                      type: 'earn',
                      amount: '+50',
                      desc: 'Tournament Prize',
                      time: '3d ago'
                    }, {
                      type: 'earn',
                      amount: '+5',
                      desc: 'Daily Bonus',
                      time: '4d ago'
                    }].map((tx, i) => <div key={i} className="flex justify-between items-center p-2 border-b border-yellow-400/10">
                          <div className="flex items-center">
                            <div className={`w-6 h-6 rounded-full ${tx.type === 'earn' ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center mr-2`}>
                              <span className={tx.type === 'earn' ? 'text-green-400' : 'text-red-400'}>
                                {tx.type === 'earn' ? '↑' : '↓'}
                              </span>
                            </div>
                            <div className="text-left">
                              <div className="text-gray-300 text-xs">
                                {tx.desc}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {tx.time}
                              </div>
                            </div>
                          </div>
                          <div className={`font-pixel text-sm ${tx.type === 'earn' ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.amount}
                          </div>
                        </div>)}
                    </div>
                  </div>
                </div>
              </div>
              {/* Wallet Actions */}
              <div className="p-4 border-t border-yellow-400/30 bg-dark">
                <div className="flex justify-between items-center">
                  <PixelButton>History</PixelButton>
                  <PixelButton primary>Earn More</PixelButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};