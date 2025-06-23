import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useWallet } from '../shared/WalletContext';

export const QuickNetworkSwitcher: React.FC = () => {
  const { currentNetwork, switchNetwork } = useWallet();

  const handleSwitchToBaseSepolia = async () => {
    try {
      await switchNetwork('BASE_SEPOLIA');
    } catch (error: any) {
      console.error('Error switching to Base Sepolia:', error);
    }
  };

  const handleSwitchToSepolia = async () => {
    try {
      await switchNetwork('SEPOLIA');
    } catch (error: any) {
      console.error('Error switching to Sepolia:', error);
    }
  };

  return (
    <motion.div
      className="bg-dark/60 border border-primary/30 rounded-lg p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Zap size={16} className="text-blue-400" />
        <span className="font-pixel text-blue-400 text-sm">NETWORK SWITCHER</span>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-gray-400 mb-2">
          Current: {currentNetwork?.name || 'Unknown'}
        </div>

        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={handleSwitchToBaseSepolia}
            className={`p-3 rounded border text-left transition-all ${
              currentNetwork?.chainId === 84532
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                : 'bg-dark/30 border-gray-600 hover:border-blue-500/50 text-gray-300 hover:text-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Base Sepolia</div>
                <div className="text-xs text-gray-400">Chainlink Contracts</div>
              </div>
              {currentNetwork?.chainId === 84532 && (
                <div className="text-green-400 text-xs">✓ Active</div>
              )}
            </div>
          </button>

          <button
            onClick={handleSwitchToSepolia}
            className={`p-3 rounded border text-left transition-all ${
              currentNetwork?.chainId === 11155111
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                : 'bg-dark/30 border-gray-600 hover:border-purple-500/50 text-gray-300 hover:text-purple-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Ethereum Sepolia</div>
                <div className="text-xs text-gray-400">Original INK Token</div>
              </div>
              {currentNetwork?.chainId === 11155111 && (
                <div className="text-green-400 text-xs">✓ Active</div>
              )}
            </div>
          </button>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2 mt-3">
          <p className="text-blue-400 text-xs font-pixel mb-1">RECOMMENDATION</p>
          <p className="text-gray-400 text-xs">
            Use Base Sepolia for Chainlink features (VRF, Functions, Price Feeds, Automation)
          </p>
        </div>
      </div>
    </motion.div>
  );
};
