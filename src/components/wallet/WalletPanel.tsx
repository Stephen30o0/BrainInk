import { useState } from 'react';
import { useWallet } from '../shared/WalletContext';
import { Wallet, Send, LogOut, X, Settings } from 'lucide-react';
import { WalletDiagnostics } from './WalletDiagnostics';
import { QuickNetworkSwitcher } from '../shared/QuickNetworkSwitcher';

interface WalletPanelProps {
  isOpen: boolean;
  onClose: () => void;
}
export const WalletPanel = ({
  isOpen,
  onClose
}: WalletPanelProps) => {
  const {
    balance,
    address,
    isConnected,
    isLoading,
    transactions,
    connectWallet,
    disconnectWallet,
    sendTokens
  } = useWallet();
  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'history' | 'network'>('overview');  const [sendAmount, setSendAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const handleSendTokens = () => {
    const amountNum = parseFloat(sendAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!recipientAddress.trim()) {
      alert('Please enter a recipient address.');
      return;
    }
    if (amountNum > balance) {
      alert('Insufficient balance.');
      return;
    }
    sendTokens(recipientAddress.trim(), amountNum);
    setSendAmount('');
    setRecipientAddress('');
    // Optionally, provide user feedback e.g., a success message or close panel
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-dark/95 border-2 border-primary/30 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-primary/20 border-b border-primary/30 flex items-center justify-between">
          <div className="flex items-center">
            <Wallet className="text-primary mr-2" size={20} />
            <h2 className="font-pixel text-primary text-sm">INK Wallet</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>        {!isConnected ? <div className="p-8 text-center">
            <Wallet className="text-primary/50 w-16 h-16 mx-auto mb-4" />
            <h3 className="font-pixel text-primary mb-2">Connect Wallet</h3>
            <p className="text-gray-400 text-sm mb-6">
              Connect your wallet to access INK features
            </p>
            {/* Debug info */}
            <div className="text-xs text-gray-500 mb-4 space-y-1">
              <div>MetaMask: {window.ethereum ? '✓ Detected' : '✗ Not Found'}</div>
              <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
              <div>Address: {address || 'None'}</div>
              <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
            </div>
            <div className="space-y-3">
              <button 
                onClick={connectWallet} 
                disabled={isLoading}
                className="w-full px-6 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Connecting...' : 'Connect Now'}
              </button>
              <button 
                onClick={() => setShowDiagnostics(true)} 
                className="w-full px-6 py-2 bg-dark/60 border border-gray-600 text-gray-400 rounded-lg hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <Settings size={16} />
                Troubleshoot Connection
              </button>
            </div>
          </div>: <>            {/* Tabs */}
            <div className="flex border-b border-primary/20">
              <button className={`flex-1 px-4 py-3 text-xs font-pixel tracking-wider ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-primary/80'}`} onClick={() => setActiveTab('overview')}>
                OVERVIEW
              </button>
              <button className={`flex-1 px-4 py-3 text-xs font-pixel tracking-wider ${activeTab === 'send' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-primary/80'}`} onClick={() => setActiveTab('send')}>
                SEND
              </button>
              <button className={`flex-1 px-4 py-3 text-xs font-pixel tracking-wider ${activeTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-primary/80'}`} onClick={() => setActiveTab('history')}>
                HISTORY
              </button>
              <button className={`flex-1 px-4 py-3 text-xs font-pixel tracking-wider ${activeTab === 'network' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-primary/80'}`} onClick={() => setActiveTab('network')}>
                NETWORK
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6 text-center">
                  <div>
                    <div className="font-pixel text-4xl text-primary mb-1">
                      {balance}
                    </div>
                    <div className="text-gray-400 text-sm">INK Tokens</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs break-all">{address}</div>
                    <button 
                      onClick={() => navigator.clipboard.writeText(address || '')} 
                      className="text-xs text-primary/70 hover:text-primary mt-1"
                    >
                      Copy Address
                    </button>                  </div>
                  <div className="space-y-3">
                    <button 
                      onClick={disconnectWallet} 
                      className="w-full px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center text-sm">
                      <LogOut size={16} className="mr-2" />
                      Disconnect Wallet
                    </button>
                    <button 
                      onClick={() => setShowDiagnostics(true)} 
                      className="w-full px-4 py-3 bg-dark/60 border border-gray-600 text-gray-400 rounded-lg hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center text-sm gap-2"
                    >
                      <Settings size={16} />
                      Wallet Diagnostics
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'send' && (
                <div className="bg-dark/50 border border-primary/20 rounded-lg p-4">
                  <h3 className="font-pixel text-primary text-md mb-4 text-center">
                    Send INK Tokens
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">
                        Amount
                      </label>
                      <input type="number" value={sendAmount} onChange={e => setSendAmount(e.target.value)} className="w-full bg-dark border border-primary/30 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-primary focus:border-primary" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">
                        Recipient Address
                      </label>
                      <input type="text" value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} className="w-full bg-dark border border-primary/30 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-primary focus:border-primary" placeholder="0x..." />
                    </div>
                    <button 
                      onClick={handleSendTokens}
                      className="w-full px-4 py-3 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors flex items-center justify-center text-sm"
                      disabled={!sendAmount || !recipientAddress || parseFloat(sendAmount) <= 0 || parseFloat(sendAmount) > balance}
                    >
                      <Send size={16} className="mr-2" />
                      Confirm & Send
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {transactions.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No transactions yet.</p>
                  )}
                  {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-dark/50 border border-primary/20 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-lg ${tx.type === 'earn' || tx.type === 'receive' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {tx.type === 'earn' || tx.type === 'receive' ? '+' : '-'}
                        </div>
                        <div>
                          <div className="text-sm text-gray-200">
                            {tx.description || (tx.type === 'send' ? 'Sent Tokens' : 'Received Tokens')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(tx.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className={`font-pixel text-sm ${tx.type === 'earn' || tx.type === 'receive' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'earn' || tx.type === 'receive' ? '+' : '-'}{Math.abs(tx.amount)} INK
                      </div>
                    </div>
                  ))}                </div>
              )}

              {activeTab === 'network' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="font-pixel text-primary text-sm mb-2">Network Switcher</h3>
                    <p className="text-gray-400 text-xs mb-4">
                      Switch between networks to access different features
                    </p>
                  </div>
                  <QuickNetworkSwitcher />
                  <hr className="border-primary/20" />
                  <div className="text-center">
                    <h3 className="font-pixel text-primary text-sm mb-2">Wallet Diagnostics</h3>
                    <p className="text-gray-400 text-xs mb-4">
                      Troubleshoot connection issues
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowDiagnostics(true)} 
                    className="w-full px-4 py-2 bg-dark/60 border border-gray-600 text-gray-400 rounded-lg hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <Settings size={16} />
                    Run Diagnostics
                  </button>
                </div>
              )}
            </div>
          </>}
      </div>
      
      {/* Wallet Diagnostics Modal */}
      {showDiagnostics && (
        <WalletDiagnostics onClose={() => setShowDiagnostics(false)} />
      )}
    </div>;
};