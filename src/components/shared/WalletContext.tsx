import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
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
  const [tokenDecimals, setTokenDecimals] = useState<number | undefined>(undefined); // Default to 18, fetch dynamically

  // Memoized disconnect function to prevent re-renders
  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setBalance(0);
    setIsConnected(false);
    setProvider(null);
    setSigner(null);
    toast.success('Wallet disconnected.');
    setInkTokenContract(null);
    setTokenDecimals(undefined); // Reset decimals
    setTransactions([]); // Clear transactions on disconnect
    console.log('Wallet disconnected');
  }, []);

  const connectWallet = useCallback(async () => {
    console.log('[ConnectWallet] Attempting to connect...');
    if (window.ethereum) {
      try {
        console.log('[ConnectWallet] MetaMask detected. Creating BrowserProvider...');
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        console.log('[ConnectWallet] BrowserProvider created. Setting provider state...');
        setProvider(newProvider);
        console.log('[ConnectWallet] Provider state set.');

        console.log('[ConnectWallet] Requesting accounts via eth_requestAccounts...');
        const accounts = await newProvider.send('eth_requestAccounts', []);
        console.log('[ConnectWallet] Accounts received:', accounts);
        if (accounts.length === 0) {
          console.error('[ConnectWallet] No accounts found/selected in MetaMask.');
          return;
        }
        const currentAddress = accounts[0];
        console.log('[ConnectWallet] Current address:', currentAddress);
        console.log('[ConnectWallet] Setting address and isConnected state...');
        setAddress(currentAddress);
        setIsConnected(true);
        console.log('[ConnectWallet] Address and isConnected state set.');

        console.log('[ConnectWallet] Getting signer...');
        const newSigner = await newProvider.getSigner();
        console.log('[ConnectWallet] Signer obtained. Setting signer state...');
        setSigner(newSigner);
        console.log('[ConnectWallet] Signer state set.');

        console.log('[ConnectWallet] Creating contract instance...');
        const contract = new ethers.Contract(INK_TOKEN_ADDRESS, INK_TOKEN_ABI, newSigner);
        console.log('[ConnectWallet] Contract instance created. Setting contract state...');
        setInkTokenContract(contract);
        console.log('[ConnectWallet] Contract state set.');

        console.log('[ConnectWallet] Fetching token decimals...');
        const decimals = await contract.decimals();
        console.log('[ConnectWallet] Decimals fetched:', Number(decimals));
        console.log('[ConnectWallet] Setting token decimals state...');
        setTokenDecimals(Number(decimals));
        console.log('[ConnectWallet] Token decimals state set.');

        console.log('[ConnectWallet] Fetching token balance for address:', currentAddress);
        const rawBalance = await contract.balanceOf(currentAddress);
        console.log('[ConnectWallet] Raw balance fetched:', rawBalance.toString());
        console.log('[ConnectWallet] Setting balance state...');
        setBalance(parseFloat(formatUnits(rawBalance, Number(decimals))));
        console.log('[ConnectWallet] Balance state set.');
        
        console.log('[ConnectWallet] Wallet connection successful. Final state logged above.');
      toast.success(`Wallet connected: ${currentAddress.substring(0, 6)}...${currentAddress.substring(currentAddress.length - 4)}`);
        console.log('Wallet connected:', currentAddress);
        console.log('Token Decimals:', Number(decimals));
        console.log('Balance fetched:', parseFloat(formatUnits(rawBalance, Number(decimals))));

      } catch (error) {
        console.error('[ConnectWallet] Failed during connection process:', error);
      toast.error('Failed to connect wallet.');
        disconnectWallet();
      }
    } else {
      console.error('[ConnectWallet] MetaMask is not installed!');
      toast.error('MetaMask is not installed! Please install it.');
    }
  }, [disconnectWallet]); // Added disconnectWallet to dependency array as it's called in catch

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
  }, [connectWallet]);

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
  }, [connectWallet, disconnectWallet]); // Add connectWallet and disconnectWallet to dependencies

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
    console.log(`[sendTokens] Attempting to send ${amount} INK to ${toAddress}`);
    const toastId = toast.loading('Preparing transaction...');
    if (!ethers.isAddress(toAddress)) {
        alert('Invalid recipient address.');
        return;
    }

    try {
      const amountToSend = parseUnits(amount.toString(), tokenDecimals);
      const tx = await inkTokenContract.transfer(toAddress, amountToSend);
      console.log('[sendTokens] Transaction sent, hash:', tx.hash);
    toast.loading(`Transaction submitted: ${tx.hash.substring(0, 6)}...${tx.hash.substring(tx.hash.length - 4)}. Waiting for confirmation...`, { id: toastId });
      
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
      toast.success(`Transaction confirmed: ${tx.hash.substring(0, 6)}...${tx.hash.substring(tx.hash.length - 4)}`, { id: toastId });

      // Refresh balance after successful transaction
      const rawBalance = await inkTokenContract.balanceOf(address);
      setBalance(parseFloat(formatUnits(rawBalance, tokenDecimals)));

    } catch (e: any) { 
      console.error('Failed to send tokens:', e);
      let errorMessage = 'Unknown transaction error';
      if (e && typeof e === 'object') {
        if ('reason' in e && typeof e.reason === 'string') {
          errorMessage = e.reason;
        } else if ('message' in e && typeof e.message === 'string') {
          errorMessage = e.message;
        } else if ('data' in e && e.data && typeof e.data === 'object' && 'message' in e.data && typeof e.data.message === 'string') {
          // Ethers.js often wraps the actual error message in data.message
          errorMessage = e.data.message;
        }
      }
      toast.error(`Error: ${errorMessage}`, { id: toastId });
      // Consider removing the alert if toast notifications are sufficient
      // alert('Transaction failed. See console for details.'); 
      setTransactions(prev => 
        prev.map(t => (t.txHash && t.status === 'pending') ? { ...t, status: 'failed' } : t)
      ); // Update status for the pending transaction if it exists
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
      // Toaster needs to be rendered, typically at the root of your app or here
      // However, to ensure it's available, we'll add it here. 
      // Consider moving <Toaster /> to your App.tsx or main layout for global availability if preferred.
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
      <Toaster position="bottom-right" reverseOrder={false} />
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