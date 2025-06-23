import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrophyIcon, ZapIcon, Dice6, ShieldCheckIcon, ChevronRight } from 'lucide-react';

// Use Dice6 as DiceIcon alias
const DiceIcon = Dice6;
import { chainlinkTestnetService } from '../../services/chainlinkTestnetService';

interface ChainlinkTournamentProps {
  onBack: () => void;
  onCreateStandard: () => void;
}

interface Tournament {
  id: number;
  name: string;
  entryFee: number;
  participants: number;
  maxParticipants: number;
  status: 'open' | 'in-progress' | 'completed';
  isChainlinkPowered: boolean;
  vrfRequestId?: number;
  prizePool: number;
  ethPrice: number;
}

export const ChainlinkTournament: React.FC<ChainlinkTournamentProps> = ({
  onBack,
  onCreateStandard
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [dynamicFee, setDynamicFee] = useState<number>(0);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChainlinkData();
  }, []);

  const loadChainlinkData = async () => {
    try {
      setIsLoading(true);
      const connected = await chainlinkTestnetService.connectWallet();
      setIsConnected(connected);

      if (connected) {
        // Get current ETH price from Chainlink Price Feeds
        const price = await chainlinkTestnetService.getCurrentETHPrice();
        setEthPrice(price);

        // Calculate dynamic entry fee based on ETH price
        const fee = calculateDynamicFee(price);
        setDynamicFee(fee);

        // Load existing tournaments (mock data for now)
        setTournaments([
          {
            id: 1,
            name: "Daily VRF Championship",
            entryFee: fee,
            participants: 12,
            maxParticipants: 16,
            status: 'open',
            isChainlinkPowered: true,
            prizePool: fee * 12 * 0.9, // 90% of entry fees
            ethPrice: price
          },
          {
            id: 2,
            name: "Fair Play Tournament",
            entryFee: fee * 1.5,
            participants: 8,
            maxParticipants: 32,
            status: 'open',
            isChainlinkPowered: true,
            prizePool: fee * 1.5 * 8 * 0.9,
            ethPrice: price
          }
        ]);
      }
    } catch (err) {
      setError('Failed to connect to Chainlink services');
      console.error('Chainlink connection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDynamicFee = (ethPrice: number): number => {
    // Dynamic fee calculation based on ETH price
    // Higher ETH price = lower entry fee in INK tokens
    const baseFee = 100; // Base fee in INK tokens
    const priceMultiplier = Math.max(0.5, Math.min(2.0, 3000 / ethPrice)); // Scale between 0.5x and 2x
    return Math.floor(baseFee * priceMultiplier);
  };

  const createChainlinkTournament = async () => {
    if (!isConnected) {
      await loadChainlinkData();
      return;
    }

    try {
      setIsLoading(true);
      
      // Create tournament with Chainlink VRF
      const tournamentName = `VRF Tournament ${Date.now()}`;
      await chainlinkTestnetService.createTournament(tournamentName);
      
      // Add to local tournaments list
      const newTournament: Tournament = {
        id: Date.now(),
        name: tournamentName,
        entryFee: dynamicFee,
        participants: 1,
        maxParticipants: 16,
        status: 'open',
        isChainlinkPowered: true,
        prizePool: dynamicFee * 0.9,
        ethPrice
      };
      
      setTournaments(prev => [newTournament, ...prev]);
      
    } catch (err) {
      setError('Failed to create Chainlink tournament');
      console.error('Tournament creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const joinTournament = async (tournament: Tournament) => {
    try {
      setIsLoading(true);
      // In a real implementation, this would interact with the smart contract
      console.log(`Joining tournament ${tournament.id} with VRF-powered fairness`);
      
      // Update tournament participants
      setTournaments(prev => prev.map(t => 
        t.id === tournament.id 
          ? { ...t, participants: t.participants + 1, prizePool: t.prizePool + t.entryFee * 0.9 }
          : t
      ));
      
    } catch (err) {
      setError('Failed to join tournament');
      console.error('Join tournament error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && tournaments.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🔗</div>
          <p className="text-white">Connecting to Chainlink oracles...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="h-full flex flex-col bg-gradient-to-br from-purple-900/20 to-blue-900/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="bg-dark/50 border-b border-primary/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={onBack} className="text-gray-400 hover:text-white">
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <div className="flex items-center space-x-2">
              <DiceIcon className="text-blue-400" size={24} />
              <h2 className="font-pixel text-white text-xl">Chainlink VRF Tournaments</h2>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-gray-400">ETH Price: </span>
              <span className="text-green-400 font-semibold">${ethPrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1 text-yellow-400">
              <ShieldCheckIcon size={16} />
              <span className="text-xs">Provably Fair</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Chainlink Features Info */}
        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center space-x-3 mb-3">
            <div className="text-2xl">🔗</div>
            <div>
              <h3 className="font-semibold text-white">Chainlink-Powered Tournaments</h3>
              <p className="text-sm text-gray-300">Fair, transparent, and automated</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center space-x-2">
              <DiceIcon className="text-purple-400" size={16} />
              <span className="text-sm text-gray-300">VRF Random Winners</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrophyIcon className="text-yellow-400" size={16} />
              <span className="text-sm text-gray-300">Dynamic Prize Pools</span>
            </div>
            <div className="flex items-center space-x-2">
              <ZapIcon className="text-green-400" size={16} />
              <span className="text-sm text-gray-300">Price Feed Entry Fees</span>
            </div>
          </div>
        </div>

        {/* Dynamic Fee Display */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-white mb-1">Dynamic Entry Fee</h4>
              <p className="text-sm text-gray-300">Automatically adjusted based on live ETH price</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">{dynamicFee} INK</div>
              <div className="text-sm text-gray-400">Based on ${ethPrice} ETH</div>
            </div>
          </div>
        </div>

        {/* Create Tournament Button */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={createChainlinkTournament}
              disabled={isLoading}
              className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border border-blue-500/50 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <DiceIcon size={24} />
                <div className="text-left">
                  <div className="font-semibold">Create VRF Tournament</div>
                  <div className="text-sm opacity-80">Chainlink-powered fairness</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={onCreateStandard}
              className="p-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 border border-gray-500/50 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <div className="flex items-center space-x-3">
                <TrophyIcon size={24} />
                <div className="text-left">
                  <div className="font-semibold">Standard Tournament</div>
                  <div className="text-sm opacity-80">Traditional gameplay</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Active Tournaments */}
        <div>
          <h3 className="font-pixel text-white text-lg mb-4 flex items-center space-x-2">
            <TrophyIcon size={20} />
            <span>Active Chainlink Tournaments</span>
          </h3>
          
          <div className="grid gap-4">
            {tournaments.map((tournament) => (
              <motion.div
                key={tournament.id}
                className="p-4 bg-dark/50 border border-primary/30 rounded-lg hover:border-primary/50 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-white">{tournament.name}</h4>
                      {tournament.isChainlinkPowered && (
                        <div className="flex items-center space-x-1 bg-blue-600/20 px-2 py-1 rounded text-xs">
                          <ShieldCheckIcon size={12} />
                          <span>VRF</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Entry Fee: </span>
                        <span className="text-yellow-400 font-semibold">{tournament.entryFee} INK</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Players: </span>
                        <span className="text-white">{tournament.participants}/{tournament.maxParticipants}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Prize Pool: </span>
                        <span className="text-green-400 font-semibold">{Math.floor(tournament.prizePool)} INK</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Status: </span>
                        <span className={`capitalize ${
                          tournament.status === 'open' ? 'text-green-400' :
                          tournament.status === 'in-progress' ? 'text-yellow-400' :
                          'text-gray-400'
                        }`}>
                          {tournament.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    {tournament.status === 'open' && (
                      <button
                        onClick={() => joinTournament(tournament)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {tournaments.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-400">
              No active Chainlink tournaments. Create one to get started!
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChainlinkTournament;
