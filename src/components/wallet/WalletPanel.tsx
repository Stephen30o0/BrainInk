import React, { useState } from 'react';
import { useWallet } from '../shared/WalletContext';
import { Wallet, Send, CreditCard, History, LogOut, ChevronRight, X } from 'lucide-react';
import { BuyTokensForm } from './BuyTokensForm';
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
    transactions,
    connectWallet,
    disconnectWallet,
    addTokens
  } = useWallet();
  const [activeTab, setActiveTab] = useState<'balance' | 'history'>('balance');
  const [sendAmount, setSendAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  // Add this function to handle token purchases
  const handlePurchaseTokens = (amount: number) => {
    addTokens(amount);
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
        </div>
        {!isConnected ? <div className="p-8 text-center">
            <Wallet className="text-primary/50 w-16 h-16 mx-auto mb-4" />
            <h3 className="font-pixel text-primary mb-2">Connect Wallet</h3>
            <p className="text-gray-400 text-sm mb-6">
              Connect your wallet to access INK features
            </p>
            <button onClick={connectWallet} className="px-6 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors">
              Connect Now
            </button>
          </div> : <>
            {/* Balance Display */}
            <div className="p-6 text-center border-b border-primary/20">
              <div className="font-pixel text-3xl text-primary mb-2">
                {balance}
              </div>
              <div className="text-gray-400 text-sm">INK Tokens</div>
              <div className="text-gray-500 text-xs mt-1">{address}</div>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-primary/20">
              <button className={`flex-1 px-4 py-2 text-sm font-pixel ${activeTab === 'balance' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-primary'}`} onClick={() => setActiveTab('balance')}>
                Balance
              </button>
              <button className={`flex-1 px-4 py-2 text-sm font-pixel ${activeTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-primary'}`} onClick={() => setActiveTab('history')}>
                History
              </button>
            </div>
            {/* Tab Content */}
            <div className="p-4">
              {activeTab === 'balance' ? <div className="space-y-4">
                  {/* Send Tokens Form */}
                  <div className="bg-dark/50 border border-primary/20 rounded-lg p-4">
                    <h3 className="font-pixel text-primary text-sm mb-4">
                      Send Tokens
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-400 text-xs mb-1">
                          Amount
                        </label>
                        <input type="number" value={sendAmount} onChange={e => setSendAmount(e.target.value)} className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-white" placeholder="Enter amount" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-xs mb-1">
                          Recipient
                        </label>
                        <input type="text" value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-white" placeholder="Enter recipient address" />
                      </div>
                      <button className="w-full px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded hover:bg-primary/30 transition-colors flex items-center justify-center">
                        <Send size={16} className="mr-2" />
                        Send Tokens
                      </button>
                    </div>
                  </div>
                  {/* Buy Tokens Form */}
                  <BuyTokensForm onPurchase={handlePurchaseTokens} />
                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-4">
                    <button className="p-4 bg-dark/50 border border-primary/20 rounded-lg hover:border-primary/50 transition-colors">
                      <CreditCard size={20} className="text-primary mb-2" />
                      <div className="text-xs text-gray-400">Buy Tokens</div>
                    </button>
                    <button className="p-4 bg-dark/50 border border-primary/20 rounded-lg hover:border-primary/50 transition-colors">
                      <History size={20} className="text-primary mb-2" />
                      <div className="text-xs text-gray-400">View History</div>
                    </button>
                  </div>
                </div> : <div className="space-y-2">
                  {transactions.map(tx => <div key={tx.id} className="flex items-center justify-between p-3 bg-dark/50 border border-primary/20 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${tx.type === 'earn' || tx.type === 'receive' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {tx.type === 'earn' || tx.type === 'receive' ? '+' : '-'}
                        </div>
                        <div>
                          <div className="text-sm text-gray-300">
                            {tx.description}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="font-pixel text-sm">
                        {Math.abs(tx.amount)} INK
                      </div>
                    </div>)}
                </div>}
            </div>
            {/* Footer */}
            <div className="p-4 border-t border-primary/20">
              <button onClick={disconnectWallet} className="w-full px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors flex items-center justify-center">
                <LogOut size={16} className="mr-2" />
                Disconnect Wallet
              </button>
            </div>
          </>}
      </div>
    </div>;
};