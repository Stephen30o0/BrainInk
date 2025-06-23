import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Zap, Shield } from 'lucide-react';
import { useWallet } from '../shared/WalletContext';

export const NetworkSwitcher: React.FC = () => {
  const { currentNetwork, switchNetwork, isConnected } = useWallet();

  const networks = [
    {
      key: 'SEPOLIA' as const,
      name: 'Ethereum Sepolia',
      icon: '🔷',
      description: 'INK Token & NFTs',
      chainId: 11155111
    },
    {
      key: 'BASE_SEPOLIA' as const,
      name: 'Base Sepolia',
      icon: '🔵',
      description: 'Chainlink Features',
      chainId: 84532
    }
  ];

  const handleNetworkSwitch = async (networkKey: 'SEPOLIA' | 'BASE_SEPOLIA') => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    
    await switchNetwork(networkKey);
  };

  return (
    <div className="bg-dark/60 border border-primary/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <ArrowLeftRight size={16} className="text-blue-400" />
        <span className="font-pixel text-blue-400 text-sm">NETWORK SWITCHER</span>
      </div>

      <div className="space-y-2">
        {networks.map((network) => {
          const isActive = currentNetwork.chainId === network.chainId;
          
          return (
            <motion.button
              key={network.key}
              onClick={() => handleNetworkSwitch(network.key)}
              disabled={!isConnected || isActive}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                isActive
                  ? 'bg-green-500/20 border-green-500/50 text-green-400'
                  : 'bg-dark/30 border-gray-600 hover:border-primary/50 text-gray-300 hover:text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              whileHover={!isActive && isConnected ? { scale: 1.02 } : {}}
              whileTap={!isActive && isConnected ? { scale: 0.98 } : {}}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{network.icon}</span>
                  <div>
                    <div className="font-medium">{network.name}</div>
                    <div className="text-xs opacity-75">{network.description}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isActive && (
                    <div className="flex items-center gap-1 bg-green-500/30 px-2 py-1 rounded text-xs">
                      <Shield size={10} />
                      Active
                    </div>
                  )}
                  {network.key === 'BASE_SEPOLIA' && (
                    <div className="bg-blue-500/20 px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Zap size={10} />
                      Chainlink
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {!isConnected && (
        <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-400 text-xs">
          Connect your wallet to switch networks
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        <p>• Ethereum Sepolia: INK tokens, achievements, NFTs</p>
        <p>• Base Sepolia: Chainlink VRF, Price Feeds, Automation</p>
      </div>
    </div>
  );
};
