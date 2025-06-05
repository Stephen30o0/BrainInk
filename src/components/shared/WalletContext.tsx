import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { ethers, Contract, BrowserProvider, Signer, formatUnits, parseUnits } from 'ethers';

// Define constants for the InkToken contract
const INK_TOKEN_ADDRESS = '0xe3CAF39D7BdeCd039EA5a42A328335115dd05153'; // Sepolia Deployed Address
const INK_TOKEN_ABI = [
  "constructor(uint256 initialSupply)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function decreaseAllowance(address spender, uint256 subtractedValue) returns (bool)",
  "function increaseAllowance(address spender, uint256 addedValue) returns (bool)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
];

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'earn' | 'spend' | 'approve'; // Added 'approve' for potential future use
  amount: number;
  description: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string; // Optional transaction hash
}

interface WalletContextType {
  balance: number;
  address: string | null;
  isConnected: boolean;
  transactions: Transaction[];
  provider: BrowserProvider | null;
  signer: Signer | null;
  inkTokenContract: Contract | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  sendTokens: (toAddress: string, amount: number) => Promise<void>;
  addTokens: (amount: number, description?: string) => void; // Kept as mock for now
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState<number>(0);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [inkTokenContract, setInkTokenContract] = useState<Contract | null>(null);
  const [tokenDecimals, setTokenDecimals] = useState<number>(18); // Default to 18, fetch dynamically

  // Load wallet state from localStorage (address only, balance/txns re-fetched or managed by events)
  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress) {
      // Attempt to reconnect if address was saved and MetaMask is available
      // This is a simplified auto-connect; a more robust solution might involve checking connection status
      if (window.ethereum) {
        connectWallet();
      }
    }
  }, []);

  // Save address to localStorage when connected/disconnected
  useEffect(() => {
    if (address) {
      localStorage.setItem('walletAddress', address);
    } else {
      localStorage.removeItem('walletAddress');
    }
  }, [address]);

  // Handle MetaMask account and network changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          console.log('MetaMask disconnected.');
          disconnectWallet();
        } else {
          console.log('Account changed:', accounts[0]);
          // Re-initialize with the new account
          connectWallet(); 
        }
      };

      const handleChainChanged = (chainId: string) => {
        console.log('Network changed to:', chainId); // Sepolia Chain ID: 11155111 (0xaa36a7)
        // Optionally, reload the app or prompt user to switch to the correct network.
        // For now, re-connecting will attempt to use the new network.
        // User must ensure MetaMask is on Sepolia for correct contract interaction.
        connectWallet(); 
      };

      (window.ethereum as any).on('accountsChanged', handleAccountsChanged);
      (window.ethereum as any).on('chainChanged', handleChainChanged);

      return () => {
        (window.ethereum as any).removeListener('accountsChanged', handleAccountsChanged);
        (window.ethereum as any).removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  const connectWallet = useCallback(async () => {
    if (window.ethereum) {
      try {
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(newProvider);

        const accounts = await newProvider.send('eth_requestAccounts', []);
        if (accounts.length === 0) {
          console.error('No accounts found/selected in MetaMask.');
          disconnectWallet();
          return;
        }
        const currentAddress = accounts[0];
        setAddress(currentAddress);
        setIsConnected(true);

        const newSigner = await newProvider.getSigner();
        setSigner(newSigner);

        const contract = new ethers.Contract(INK_TOKEN_ADDRESS, INK_TOKEN_ABI, newSigner);
        setInkTokenContract(contract);

        const decimals = await contract.decimals();
        setTokenDecimals(Number(decimals));

        const rawBalance = await contract.balanceOf(currentAddress);
        setBalance(parseFloat(formatUnits(rawBalance, Number(decimals))));
        
        console.log('Wallet connected:', currentAddress);
        console.log('Token Decimals:', Number(decimals));
        console.log('Balance fetched:', parseFloat(formatUnits(rawBalance, Number(decimals))));

      } catch (error) {
        console.error('Failed to connect wallet:', error);
        disconnectWallet();
      }
    } else {
      console.error('MetaMask is not installed!');
      alert('MetaMask is not installed. Please install it to use this feature.');
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setBalance(0);
    setIsConnected(false);
    setTransactions([]);
    setProvider(null);
    setSigner(null);
    setInkTokenContract(null);
    localStorage.removeItem('walletAddress'); // Clear saved address
    localStorage.removeItem('walletTransactions'); // Clear saved transactions if any
    console.log('Wallet disconnected');
  }, []);

  const sendTokens = useCallback(async (toAddress: string, amount: number) => {
    if (!inkTokenContract || !signer || !address) {
      console.error('Wallet not connected or contract not initialized.');
      alert('Please connect your wallet first.');
      return;
    }
    if (amount <= 0) {
      alert('Amount must be greater than zero.');
      return;
    }
    console.log('[sendTokens] Validating toAddress:', JSON.stringify(toAddress)); // Log the address being validated
    if (!ethers.isAddress(toAddress)) {
        alert('Invalid recipient address.');
        return;
    }

    try {
      const amountToSend = parseUnits(amount.toString(), tokenDecimals);
      const tx = await inkTokenContract.transfer(toAddress, amountToSend);
      console.log('Transaction sent:', tx.hash);
      
      const newTransaction: Transaction = {
        id: tx.hash, // Use tx hash as ID for uniqueness
        type: 'send',
        amount: -amount, // Negative for sending
        description: `Sent INK to ${toAddress.substring(0,6)}...${toAddress.substring(toAddress.length-4)}`,
        timestamp: Date.now(),
        status: 'pending',
        txHash: tx.hash,
      };
      setTransactions(prev => [newTransaction, ...prev]);

      await tx.wait(); // Wait for transaction confirmation
      console.log('Transaction confirmed:', tx.hash);

      setTransactions(prev => 
        prev.map(t => t.id === tx.hash ? { ...t, status: 'completed' } : t)
      );

      // Refresh balance after successful transaction
      const rawBalance = await inkTokenContract.balanceOf(address);
      setBalance(parseFloat(formatUnits(rawBalance, tokenDecimals)));

    } catch (error) {
      console.error('Failed to send tokens:', error);
      alert('Transaction failed. See console for details.');
      setTransactions(prev => 
        prev.map(t => (t.txHash && t.status === 'pending') ? { ...t, status: 'failed' } : t)
      );
    }
  }, [inkTokenContract, signer, address, tokenDecimals]);

  // Mock addTokens function (actual minting/receiving logic would be complex)
  const addTokens = useCallback((amount: number, description: string = 'Tokens Added (Mock)') => {
    setBalance(prev => prev + amount);
    const newTransaction: Transaction = {
      id: `mock_${Date.now()}`,
      type: 'receive',
      amount: amount,
      description: description,
      timestamp: Date.now(),
      status: 'completed',
    };
    setTransactions(prev => [newTransaction, ...prev]);
    console.warn('addTokens is a mock function. No actual tokens were minted or transferred on the blockchain.');
  }, []);

  return (
    <WalletContext.Provider value={{
      balance,
      address,
      isConnected,
      transactions,
      provider,
      signer,
      inkTokenContract,
      connectWallet,
      disconnectWallet,
      sendTokens,
      addTokens
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};