import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, RefreshCw, Wifi, WifiOff, Settings, ExternalLink } from 'lucide-react';
import { ethers } from 'ethers';

interface NetworkConfig {
  chainId: number;
  name: string;
  rpc: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrls: string[];
}

const SUPPORTED_NETWORKS: { [key: number]: NetworkConfig } = {
  // Ethereum Sepolia (where INK token is deployed)
  11155111: {
    chainId: 11155111,
    name: 'Sepolia test network',
    rpc: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorerUrls: ['https://sepolia.etherscan.io']
  },
  // Base Sepolia (where Chainlink contracts are deployed)
  84532: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpc: 'https://sepolia.base.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorerUrls: ['https://sepolia.basescan.org']
  }
};

interface WalletDiagnosticsProps {
  onClose: () => void;
}

export const WalletDiagnostics: React.FC<WalletDiagnosticsProps> = ({ onClose }) => {
  const [diagnostics, setDiagnostics] = useState<{
    metamaskInstalled: boolean;
    isConnected: boolean;
    currentNetwork: number | null;
    currentAccount: string | null;
    inkTokenBalance: string | null;
    errors: string[];
    suggestions: string[];
  }>({
    metamaskInstalled: false,
    isConnected: false,
    currentNetwork: null,
    currentAccount: null,
    inkTokenBalance: null,
    errors: [],
    suggestions: []
  });
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setIsLoading(true);
    const newDiagnostics = {
      metamaskInstalled: false,
      isConnected: false,
      currentNetwork: null,
      currentAccount: null,
      inkTokenBalance: null,
      errors: [] as string[],
      suggestions: [] as string[]
    };

    try {
      // Check if MetaMask is installed
      if (typeof window !== 'undefined' && window.ethereum) {
        newDiagnostics.metamaskInstalled = true;
        
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          
          // Check network
          const network = await provider.getNetwork();
          newDiagnostics.currentNetwork = Number(network.chainId);
          
          // Check if connected
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            newDiagnostics.isConnected = true;
            newDiagnostics.currentAccount = accounts[0].address;
            
            // Check INK token balance if on Sepolia
            if (newDiagnostics.currentNetwork === 11155111) {
              try {
                const inkTokenAddress = '0xe3CAF39D7BdeCd039EA5a42A328335115dd05153';
                const inkTokenABI = [
                  "function balanceOf(address account) view returns (uint256)",
                  "function decimals() view returns (uint8)"
                ];
                
                const signer = await provider.getSigner();
                const contract = new ethers.Contract(inkTokenAddress, inkTokenABI, signer);
                const balance = await contract.balanceOf(newDiagnostics.currentAccount);
                const decimals = await contract.decimals();
                newDiagnostics.inkTokenBalance = ethers.formatUnits(balance, decimals);
              } catch (error: any) {
                newDiagnostics.errors.push(`Failed to fetch INK token balance: ${error.message}`);
              }
            }
          }
          
          // Generate suggestions based on current state
          if (!newDiagnostics.isConnected) {
            newDiagnostics.suggestions.push('Connect your MetaMask wallet');
          }
          
          if (newDiagnostics.currentNetwork && !SUPPORTED_NETWORKS[newDiagnostics.currentNetwork]) {
            newDiagnostics.errors.push(`Unsupported network: ${newDiagnostics.currentNetwork}`);
            newDiagnostics.suggestions.push('Switch to Sepolia testnet for INK tokens or Base Sepolia for Chainlink features');
          }
          
          if (newDiagnostics.currentNetwork === 84532) {
            newDiagnostics.suggestions.push('You\'re on Base Sepolia - great for Chainlink features! Switch to Sepolia for INK tokens.');
          }
          
          if (newDiagnostics.currentNetwork === 11155111) {
            newDiagnostics.suggestions.push('You\'re on Sepolia - perfect for INK tokens! Switch to Base Sepolia for Chainlink features.');
          }
          
        } catch (error: any) {
          newDiagnostics.errors.push(`Provider error: ${error.message}`);
        }
      } else {
        newDiagnostics.errors.push('MetaMask not detected');
        newDiagnostics.suggestions.push('Install MetaMask browser extension');
      }
      
    } catch (error: any) {
      newDiagnostics.errors.push(`Diagnostics error: ${error.message}`);
    }
    
    setDiagnostics(newDiagnostics);
    setIsLoading(false);
  };

  const addNetwork = async (chainId: number) => {
    if (!window.ethereum) return;
    
    const networkConfig = SUPPORTED_NETWORKS[chainId];
    if (!networkConfig) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: networkConfig.name,
          rpcUrls: [networkConfig.rpc],
          nativeCurrency: networkConfig.nativeCurrency,
          blockExplorerUrls: networkConfig.blockExplorerUrls
        }]
      });
    } catch (error: any) {
      console.error('Failed to add network:', error);
    }
  };

  const switchNetwork = async (chainId: number) => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
      
      // Re-run diagnostics after network switch
      setTimeout(runDiagnostics, 1000);
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added to MetaMask, add it first
        await addNetwork(chainId);
      } else {
        console.error('Failed to switch network:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      setTimeout(runDiagnostics, 1000);
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-dark border border-primary/30 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-primary font-pixel text-xl">Wallet Diagnostics</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-primary"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw size={32} className="animate-spin text-primary" />
            <span className="ml-3 text-gray-400">Running diagnostics...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded border ${diagnostics.metamaskInstalled ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                <div className="flex items-center gap-2">
                  {diagnostics.metamaskInstalled ? <CheckCircle size={16} className="text-green-400" /> : <AlertTriangle size={16} className="text-red-400" />}
                  <span className={diagnostics.metamaskInstalled ? 'text-green-400' : 'text-red-400'}>
                    MetaMask {diagnostics.metamaskInstalled ? 'Installed' : 'Not Found'}
                  </span>
                </div>
              </div>
              
              <div className={`p-4 rounded border ${diagnostics.isConnected ? 'bg-green-500/20 border-green-500/30' : 'bg-yellow-500/20 border-yellow-500/30'}`}>
                <div className="flex items-center gap-2">
                  {diagnostics.isConnected ? <Wifi size={16} className="text-green-400" /> : <WifiOff size={16} className="text-yellow-400" />}
                  <span className={diagnostics.isConnected ? 'text-green-400' : 'text-yellow-400'}>
                    Wallet {diagnostics.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                {diagnostics.currentAccount && (
                  <p className="text-xs text-gray-400 mt-1">
                    {diagnostics.currentAccount.slice(0, 6)}...{diagnostics.currentAccount.slice(-4)}
                  </p>
                )}
              </div>
            </div>

            {/* Network Info */}
            {diagnostics.currentNetwork && (
              <div className="bg-dark/60 border border-primary/20 rounded p-4">
                <h3 className="text-primary font-pixel mb-2">Current Network</h3>
                <p className="text-white">
                  {SUPPORTED_NETWORKS[diagnostics.currentNetwork]?.name || `Unknown Network (${diagnostics.currentNetwork})`}
                </p>
                <p className="text-gray-400 text-sm">Chain ID: {diagnostics.currentNetwork}</p>
                
                {diagnostics.inkTokenBalance && (
                  <p className="text-yellow-400 text-sm mt-2">
                    INK Balance: {parseFloat(diagnostics.inkTokenBalance).toFixed(2)} INK
                  </p>
                )}
              </div>
            )}

            {/* Network Switching */}
            <div className="bg-dark/60 border border-primary/20 rounded p-4">
              <h3 className="text-primary font-pixel mb-3">Quick Network Switch</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => switchNetwork(11155111)}
                  className={`p-3 rounded border transition-all ${
                    diagnostics.currentNetwork === 11155111
                      ? 'bg-green-500/20 border-green-500/30 text-green-400'
                      : 'bg-dark/30 border-gray-600 hover:border-primary/50 text-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium">Sepolia Testnet</div>
                  <div className="text-xs text-gray-400">For INK Tokens</div>
                </button>
                
                <button
                  onClick={() => switchNetwork(84532)}
                  className={`p-3 rounded border transition-all ${
                    diagnostics.currentNetwork === 84532
                      ? 'bg-green-500/20 border-green-500/30 text-green-400'
                      : 'bg-dark/30 border-gray-600 hover:border-primary/50 text-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium">Base Sepolia</div>
                  <div className="text-xs text-gray-400">For Chainlink Features</div>
                </button>
              </div>
            </div>

            {/* Errors */}
            {diagnostics.errors.length > 0 && (
              <div className="bg-red-500/20 border border-red-500/30 rounded p-4">
                <h3 className="text-red-400 font-pixel mb-2 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Issues Found
                </h3>
                <ul className="space-y-1">
                  {diagnostics.errors.map((error, index) => (
                    <li key={index} className="text-red-300 text-sm">• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {diagnostics.suggestions.length > 0 && (
              <div className="bg-blue-500/20 border border-blue-500/30 rounded p-4">
                <h3 className="text-blue-400 font-pixel mb-2 flex items-center gap-2">
                  <Settings size={16} />
                  Suggestions
                </h3>
                <ul className="space-y-1">
                  {diagnostics.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-blue-300 text-sm">• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {!diagnostics.isConnected && diagnostics.metamaskInstalled && (
                <button
                  onClick={connectWallet}
                  className="bg-primary hover:bg-primary/80 text-dark font-pixel py-2 px-4 rounded transition-all"
                >
                  Connect Wallet
                </button>
              )}
              
              <button
                onClick={runDiagnostics}
                className="bg-dark/60 border border-primary/30 hover:border-primary/50 text-primary font-pixel py-2 px-4 rounded transition-all flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Re-run Diagnostics
              </button>
              
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/50 text-orange-400 font-pixel py-2 px-4 rounded transition-all flex items-center gap-2"
              >
                <ExternalLink size={16} />
                Get MetaMask
              </a>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
