import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { ethers, Contract, BrowserProvider, Signer, formatUnits, parseUnits } from 'ethers';

// Define constants for multi-network support
const NETWORKS = {
  SEPOLIA: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    blockExplorer: 'https://sepolia.etherscan.io',
    inkTokenAddress: '0xe3CAF39D7BdeCd039EA5a42A328335115dd05153', // Your current INK token
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18
    }
  },  BASE_SEPOLIA: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    inkTokenAddress: '0x3400d455aC4d50dF70E581b96f980516Af63Fa1c', // Original INK Token on Base Sepolia
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18
    }
  }
};

const DEFAULT_NETWORK = NETWORKS.SEPOLIA; // Start with Sepolia as default

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

interface WalletContextType {  balance: number;
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
  transactions: Transaction[];
  provider: BrowserProvider | null;
  signer: Signer | null;
  inkTokenContract: Contract | null;
  currentNetwork: typeof NETWORKS.SEPOLIA | typeof NETWORKS.BASE_SEPOLIA;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  sendTokens: (toAddress: string, amount: number) => Promise<void>;
  addTokens: (amount: number, description?: string) => void;
  switchNetwork: (network: 'SEPOLIA' | 'BASE_SEPOLIA') => Promise<void>;
  addNetworkToMetaMask: (network: typeof NETWORKS.SEPOLIA | typeof NETWORKS.BASE_SEPOLIA) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {  const [balance, setBalance] = useState<number>(0);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [inkTokenContract, setInkTokenContract] = useState<Contract | null>(null);
  const [currentNetwork, setCurrentNetwork] = useState<typeof NETWORKS.SEPOLIA | typeof NETWORKS.BASE_SEPOLIA>(NETWORKS.BASE_SEPOLIA);
  const [tokenDecimals, setTokenDecimals] = useState<number | undefined>(undefined); // Default to 18, fetch dynamically
  // Memoized disconnect function to prevent re-renders
  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setBalance(0);
    setIsConnected(false);
    setIsLoading(false);
    setProvider(null);
    setSigner(null);
    toast.success('Wallet disconnected.');
    setInkTokenContract(null);
    setTokenDecimals(undefined); // Reset decimals
    setTransactions([]); // Clear transactions on disconnect
    console.log('Wallet disconnected');
  }, []);const connectWallet = useCallback(async () => {
    console.log('[ConnectWallet] Attempting to connect...');
    if (!window.ethereum) {
      console.error('[ConnectWallet] MetaMask is not installed!');
      toast.error('MetaMask is not installed! Please install it.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('[ConnectWallet] MetaMask detected. Creating BrowserProvider...');
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      console.log('[ConnectWallet] BrowserProvider created. Setting provider state...');
      setProvider(newProvider);
      console.log('[ConnectWallet] Provider state set.');

      // Check current network
      const network = await newProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      console.log('[ConnectWallet] Current network chain ID:', currentChainId);      // Auto-detect network based on chain ID
      let detectedNetwork = NETWORKS.BASE_SEPOLIA; // Default to Base Sepolia
      if (currentChainId === NETWORKS.BASE_SEPOLIA.chainId) {
        detectedNetwork = NETWORKS.BASE_SEPOLIA;
        toast.success('Connected to Base Sepolia');
      } else if (currentChainId === NETWORKS.SEPOLIA.chainId) {
        detectedNetwork = NETWORKS.SEPOLIA;
        toast.success('Connected to Ethereum Sepolia');      } else {
        console.warn(`[ConnectWallet] Unsupported network (${currentChainId}), defaulting to Base Sepolia`);
        toast.error(`Unsupported network. Switching to Base Sepolia...`);
        
        // Try to switch to Base Sepolia
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${NETWORKS.BASE_SEPOLIA.chainId.toString(16)}` }]
          });
          console.log('[ConnectWallet] Successfully switched to Base Sepolia');
          toast.success('Switched to Base Sepolia testnet');
          detectedNetwork = NETWORKS.BASE_SEPOLIA;
        } catch (switchError: any) {
          console.error('[ConnectWallet] Failed to switch network:', switchError);
          if (switchError.code === 4902) {
            // Network not added to MetaMask, try to add it
            await addNetworkToMetaMask(NETWORKS.BASE_SEPOLIA);
            detectedNetwork = NETWORKS.BASE_SEPOLIA;
          } else {
            toast.error('Failed to switch to supported network. Some features may not work.');
          }
        }
      }

      setCurrentNetwork(detectedNetwork);

      console.log('[ConnectWallet] Requesting accounts via eth_requestAccounts...');
      const accounts = await newProvider.send('eth_requestAccounts', []);
      console.log('[ConnectWallet] Accounts received:', accounts.length);
      
      if (accounts.length === 0) {
        console.error('[ConnectWallet] No accounts found/selected in MetaMask.');
        toast.error('No accounts found. Please check MetaMask.');
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
      console.log('[ConnectWallet] Signer state set.');      // Create contract for supported networks
      if (currentChainId === NETWORKS.SEPOLIA.chainId || currentChainId === NETWORKS.BASE_SEPOLIA.chainId) {
        console.log('[ConnectWallet] Creating contract instance...');
        const contract = new ethers.Contract(detectedNetwork.inkTokenAddress, INK_TOKEN_ABI, newSigner);
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
        
        toast.success(`Wallet connected: ${currentAddress.substring(0, 6)}...${currentAddress.substring(currentAddress.length - 4)}`);
        console.log('Wallet connected:', currentAddress);
        console.log('Token Decimals:', Number(decimals));
        console.log('Balance fetched:', parseFloat(formatUnits(rawBalance, Number(decimals))));
      } else {
        console.log('[ConnectWallet] Not on Sepolia, skipping contract initialization');
        setBalance(0);
        setInkTokenContract(null);
        setTokenDecimals(undefined);
        toast.success(`Wallet connected: ${currentAddress.substring(0, 6)}...${currentAddress.substring(currentAddress.length - 4)} (Switch to Sepolia for INK tokens)`);
      }

    } catch (error: any) {
      console.error('[ConnectWallet] Failed during connection process:', error);
      
      // More specific error messages
      if (error.code === 4001) {
        toast.error('Connection rejected by user.');
      } else if (error.code === -32002) {
        toast.error('Connection request pending. Check MetaMask.');      } else {
        toast.error(`Failed to connect wallet: ${error.message || 'Unknown error'}`);
      }
      
      disconnectWallet();
    } finally {
      setIsLoading(false);
    }
  }, [disconnectWallet]);

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
  // Helper function to add network to MetaMask
  const addNetworkToMetaMask = async (network: typeof NETWORKS.SEPOLIA | typeof NETWORKS.BASE_SEPOLIA) => {
    if (!window.ethereum) {
      toast.error('MetaMask not found');
      return;
    }
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${network.chainId.toString(16)}`,
          chainName: network.name,
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: [network.blockExplorer],
          nativeCurrency: network.nativeCurrency
        }]
      });
      toast.success(`${network.name} added to MetaMask`);
    } catch (error) {
      console.error('Failed to add network:', error);
      toast.error(`Failed to add ${network.name} to MetaMask`);
    }
  };

  // Function to switch networks
  const switchNetwork = useCallback(async (networkKey: 'SEPOLIA' | 'BASE_SEPOLIA') => {
    if (!window.ethereum) {
      toast.error('MetaMask not found');
      return;
    }
    
    const network = NETWORKS[networkKey];
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${network.chainId.toString(16)}` }]
      });
      
      setCurrentNetwork(network);
      toast.success(`Switched to ${network.name}`);
      
      // Reconnect to update contracts and balances
      if (isConnected) {
        await connectWallet();
      }
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added, try to add it
        await addNetworkToMetaMask(network);
        // Try switching again after adding
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${network.chainId.toString(16)}` }]
          });
          setCurrentNetwork(network);
          toast.success(`Switched to ${network.name}`);
        } catch (secondError) {
          toast.error(`Failed to switch to ${network.name}`);
        }
      } else {
        toast.error(`Failed to switch to ${network.name}`);
      }
    }
  }, [isConnected, connectWallet]);
  return (
    <WalletContext.Provider value={{
      balance,
      address,
      isConnected,
      isLoading,
      transactions,
      provider,
      signer,
      inkTokenContract,
      currentNetwork,
      connectWallet,
      disconnectWallet,
      sendTokens,
      addTokens,
      switchNetwork,
      addNetworkToMetaMask
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