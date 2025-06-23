import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

export const WalletDiagnostics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      checks: []
    };

    // Check 1: MetaMask availability
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        results.checks.push({
          name: 'MetaMask Detection',
          status: 'pass',
          message: 'MetaMask is installed and available',
          details: `Provider: ${(window.ethereum as any)?.isMetaMask ? 'MetaMask' : 'Unknown'}`
        });
      } else {
        results.checks.push({
          name: 'MetaMask Detection',
          status: 'fail',
          message: 'MetaMask not detected',
          details: 'Please install MetaMask extension'
        });
      }
    } catch (error) {
      results.checks.push({
        name: 'MetaMask Detection',
        status: 'error',
        message: 'Error checking MetaMask',
        details: String(error)
      });
    }

    // Check 2: Network connectivity
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        results.checks.push({
          name: 'Account Access',
          status: accounts.length > 0 ? 'pass' : 'warn',
          message: accounts.length > 0 ? `${accounts.length} account(s) available` : 'No accounts connected',
          details: accounts.length > 0 ? `Primary: ${accounts[0]}` : 'Run eth_requestAccounts to connect'
        });

        // Check current network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const chainIdDecimal = parseInt(chainId, 16);
        
        let networkName = 'Unknown Network';
        let networkStatus = 'warn';
        
        if (chainIdDecimal === 84532) {
          networkName = 'Base Sepolia (Recommended for Chainlink)';
          networkStatus = 'pass';
        } else if (chainIdDecimal === 11155111) {
          networkName = 'Ethereum Sepolia';
          networkStatus = 'pass';
        } else {
          networkName = `Unsupported Network (Chain ID: ${chainIdDecimal})`;
          networkStatus = 'fail';
        }

        results.checks.push({
          name: 'Network Check',
          status: networkStatus,
          message: networkName,
          details: `Chain ID: ${chainIdDecimal} (0x${chainId.slice(2)})`
        });
      }
    } catch (error) {
      results.checks.push({
        name: 'Network Check',
        status: 'error',
        message: 'Failed to check network',
        details: String(error)
      });
    }

    // Check 3: Permissions
    try {
      if (window.ethereum) {
        const permissions = await window.ethereum.request({
          method: 'wallet_getPermissions'
        });
        
        results.checks.push({
          name: 'Wallet Permissions',
          status: permissions.length > 0 ? 'pass' : 'warn',
          message: `${permissions.length} permission(s) granted`,
          details: permissions.map((p: any) => p.parentCapability).join(', ') || 'No permissions'
        });
      }
    } catch (error) {
      results.checks.push({
        name: 'Wallet Permissions',
        status: 'error',
        message: 'Failed to check permissions',
        details: String(error)
      });
    }

    // Check 4: Local storage and session
    try {
      const hasLocalStorage = typeof localStorage !== 'undefined';
      const hasSessionStorage = typeof sessionStorage !== 'undefined';
      
      results.checks.push({
        name: 'Browser Storage',
        status: hasLocalStorage && hasSessionStorage ? 'pass' : 'warn',
        message: 'Storage availability check',
        details: `localStorage: ${hasLocalStorage}, sessionStorage: ${hasSessionStorage}`
      });
    } catch (error) {
      results.checks.push({
        name: 'Browser Storage',
        status: 'error',
        message: 'Storage check failed',
        details: String(error)
      });
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'warn':
        return <AlertTriangle size={16} className="text-yellow-400" />;
      case 'fail':
        return <XCircle size={16} className="text-red-400" />;
      case 'error':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Info size={16} className="text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'border-green-500/30 bg-green-500/10';
      case 'warn':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'fail':
        return 'border-red-500/30 bg-red-500/10';
      case 'error':
        return 'border-red-600/30 bg-red-600/10';
      default:
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  const tryQuickFix = async () => {
    try {
      if (window.ethereum) {
        console.log('Attempting quick fix...');
        
        // Try to request accounts
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        console.log('Quick fix - accounts:', accounts);
        
        // Rerun diagnostics
        await runDiagnostics();
      }
    } catch (error) {
      console.error('Quick fix failed:', error);
    }
  };

  return (
    <motion.div
      className="bg-dark/60 border border-primary/30 rounded-lg p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={16} className="text-orange-400" />
        <span className="font-pixel text-orange-400 text-sm">WALLET DIAGNOSTICS</span>
      </div>

      <div className="space-y-3">
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 font-pixel py-2 px-4 rounded transition-all flex items-center justify-center gap-2"
        >
          {isRunning ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            <>
              <RefreshCw size={14} />
              Run Diagnostics
            </>
          )}
        </button>

        {diagnostics && (
          <div className="space-y-2">
            <div className="text-xs text-gray-400 mb-3">
              Last run: {new Date(diagnostics.timestamp).toLocaleTimeString()}
            </div>

            {diagnostics.checks.map((check: any, index: number) => (
              <div
                key={index}
                className={`border rounded p-3 ${getStatusColor(check.status)}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(check.status)}
                  <span className="font-medium text-sm text-white">{check.name}</span>
                </div>
                <div className="text-xs text-gray-300 mb-1">{check.message}</div>
                {check.details && (
                  <div className="text-xs text-gray-400 font-mono">{check.details}</div>
                )}
              </div>
            ))}

            {diagnostics.checks.some((c: any) => c.status === 'fail' || c.status === 'error') && (
              <button
                onClick={tryQuickFix}
                className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 text-sm py-2 px-4 rounded transition-all"
              >
                Try Quick Fix
              </button>
            )}
          </div>
        )}

        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
          <p className="text-blue-400 text-xs font-pixel mb-1">TROUBLESHOOTING TIPS</p>
          <ul className="text-gray-400 text-xs space-y-1">
            <li>• Refresh the page and try again</li>
            <li>• Check MetaMask is unlocked</li>
            <li>• Try disconnecting and reconnecting MetaMask</li>
            <li>• Switch to Base Sepolia for Chainlink features</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};
