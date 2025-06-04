import React, { useEffect, useState, createContext, useContext } from 'react';
interface WalletContextType {
  balance: number;
  address: string | null;
  isConnected: boolean;
  transactions: Transaction[];
  connectWallet: () => void;
  disconnectWallet: () => void;
  sendTokens: (amount: number, to: string) => void;
  addTokens: (amount: number) => void;
}
interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'earn' | 'spend';
  amount: number;
  description: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
}
const WalletContext = createContext<WalletContextType | undefined>(undefined);
export const WalletProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [balance, setBalance] = useState(0);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // Load wallet state from localStorage
  useEffect(() => {
    const savedWallet = localStorage.getItem('wallet');
    const defaultWallet = {
      balance: 0,
      address: null,
      transactions: []
    };
    
    if (savedWallet) {
      const walletData = JSON.parse(savedWallet);
      setBalance(walletData.balance || defaultWallet.balance);
      setAddress(walletData.address || defaultWallet.address);
      setTransactions(walletData.transactions || defaultWallet.transactions);
      setIsConnected(true);
    } else {
      // Initialize with default values if no saved wallet exists
      setBalance(defaultWallet.balance);
      setAddress(defaultWallet.address);
      setTransactions(defaultWallet.transactions);
    }
  }, []);
  // Save wallet state to localStorage
  useEffect(() => {
    if (isConnected) {
      localStorage.setItem('wallet', JSON.stringify({
        balance,
        address,
        transactions
      }));
    }
  }, [balance, address, transactions, isConnected]);
  const connectWallet = () => {
    // Generate a mock wallet address
    const mockAddress = `ink_${Math.random().toString(36).substr(2, 6)}...${Math.random().toString(36).substr(2, 4)}`;
    setAddress(mockAddress);
    setIsConnected(true);
    setBalance(100); // Start with 100 INK tokens
    // Add initial transaction
    addTransaction({
      type: 'receive',
      amount: 100,
      description: 'Welcome bonus'
    });
  };
  const disconnectWallet = () => {
    setAddress(null);
    setIsConnected(false);
    setBalance(0);
    setTransactions([]);
    localStorage.removeItem('wallet');
  };
  const addTransaction = ({
    type,
    amount,
    description
  }: Omit<Transaction, 'id' | 'timestamp' | 'status'>) => {
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      amount,
      description,
      timestamp: Date.now(),
      status: 'completed'
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };
  const sendTokens = (amount: number, to: string) => {
    if (amount <= balance) {
      setBalance(prev => prev - amount);
      addTransaction({
        type: 'send',
        amount: -amount,
        description: `Sent to ${to}`
      });
    }
  };
  const addTokens = (amount: number) => {
    setBalance(prev => prev + amount);
    addTransaction({
      type: 'earn',
      amount,
      description: 'Earned from activity'
    });
  };
  return <WalletContext.Provider value={{
    balance,
    address,
    isConnected,
    transactions,
    connectWallet,
    disconnectWallet,
    sendTokens,
    addTokens
  }}>
      {children}
    </WalletContext.Provider>;
};
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};