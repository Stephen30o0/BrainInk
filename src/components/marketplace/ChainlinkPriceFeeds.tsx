import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, RefreshCw, Zap, AlertTriangle } from 'lucide-react';
import { chainlinkTestnetService } from '../../services/chainlinkTestnetService';

interface PriceFeedData {
  ethPrice: number;
  lastUpdated: string;
  priceChange24h: number;
  confidence: string;
}

interface DynamicPricingProps {
  basePrice: number;
  onPriceUpdate: (newPrice: number) => void;
}

export const ChainlinkPriceFeeds: React.FC<DynamicPricingProps> = ({
  basePrice,
  onPriceUpdate
}) => {
  const [priceData, setPriceData] = useState<PriceFeedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dynamicPrice, setDynamicPrice] = useState(basePrice);

  useEffect(() => {
    connectAndLoadPrice();
  }, []);

  useEffect(() => {
    if (priceData) {
      const adjustedPrice = calculateDynamicPrice(basePrice, priceData.ethPrice);
      setDynamicPrice(adjustedPrice);
      onPriceUpdate(adjustedPrice);
    }
  }, [basePrice, priceData, onPriceUpdate]);

  const connectAndLoadPrice = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const connected = await chainlinkTestnetService.connectWallet();
      setIsConnected(connected);

      if (connected) {
        await loadPriceData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Chainlink Price Feeds');
      console.error('Price feed error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPriceData = async () => {
    try {
      const ethPrice = await chainlinkTestnetService.getCurrentETHPrice();
      
      // Mock additional data (in production, these would come from multiple Chainlink feeds)
      const mockPriceData: PriceFeedData = {
        ethPrice: ethPrice,
        lastUpdated: new Date().toISOString(),
        priceChange24h: (Math.random() - 0.5) * 200, // Random change for demo
        confidence: '99.9%'
      };

      setPriceData(mockPriceData);
    } catch (err: any) {
      setError('Failed to fetch price data');
      console.error('Price fetch error:', err);
    }
  };

  const calculateDynamicPrice = (basePriceInINK: number, ethPriceUSD: number): number => {
    // Dynamic pricing algorithm based on ETH price
    // Higher ETH price = lower INK price (inverse relationship)
    // This creates more accessible pricing when crypto prices are high
    
    const baseETHPrice = 3000; // Reference ETH price in USD
    const priceFactor = baseETHPrice / ethPriceUSD;
    const adjustedPrice = Math.max(
      Math.floor(basePriceInINK * priceFactor * 0.8), // 20% buffer
      Math.floor(basePriceInINK * 0.5) // Minimum 50% of base price
    );
    
    return Math.min(adjustedPrice, basePriceInINK * 1.5); // Maximum 150% of base price
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp size={16} className="text-green-400" />;
    if (change < 0) return <TrendingDown size={16} className="text-red-400" />;
    return <DollarSign size={16} className="text-gray-400" />;
  };

  const refreshPriceData = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    await loadPriceData();
    setIsLoading(false);
  };

  if (!isConnected) {
    return (
      <div className="bg-dark/60 border border-yellow-500/30 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-yellow-400 mb-2">
          <AlertTriangle size={16} />
          <span className="font-pixel text-sm">Dynamic Pricing Offline</span>
        </div>
        <p className="text-gray-400 text-xs mb-2">
          Connect your wallet to enable Chainlink Price Feed integration for dynamic pricing.
        </p>
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-gray-400" />
          <span className="text-white font-pixel">{basePrice} INK</span>
          <span className="text-gray-500 text-xs">(Base Price)</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-dark/60 border border-primary/30 rounded-lg p-4 mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-blue-400" />
          <span className="font-pixel text-blue-400 text-sm">CHAINLINK PRICE FEEDS</span>
        </div>
        <button
          onClick={refreshPriceData}
          disabled={isLoading}
          className="p-1 text-gray-400 hover:text-primary transition-colors"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded p-2 mb-3">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {priceData && (
        <div className="space-y-2">
          {/* Current Dynamic Price */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Dynamic Price:</span>
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-green-400" />
              <span className="text-white font-pixel text-lg">{dynamicPrice}</span>
              <span className="text-green-400 font-pixel text-sm">INK</span>
            </div>
          </div>

          {/* Price Comparison */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Base Price: {basePrice} INK</span>
            <span className={`flex items-center gap-1 ${
              dynamicPrice < basePrice ? 'text-green-400' : 
              dynamicPrice > basePrice ? 'text-red-400' : 'text-gray-400'
            }`}>
              {dynamicPrice < basePrice ? 'DISCOUNT' : 
               dynamicPrice > basePrice ? 'PREMIUM' : 'STABLE'}
              {Math.abs(((dynamicPrice - basePrice) / basePrice) * 100).toFixed(1)}%
            </span>
          </div>

          {/* ETH Price Feed */}
          <div className="border-t border-primary/20 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">ETH/USD:</span>
              <div className="flex items-center gap-1">
                <span className="text-white">${priceData.ethPrice.toLocaleString()}</span>
                {getPriceChangeIcon(priceData.priceChange24h)}
                <span className={getPriceChangeColor(priceData.priceChange24h)}>
                  {priceData.priceChange24h > 0 ? '+' : ''}
                  {priceData.priceChange24h.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-gray-500">Confidence:</span>
              <span className="text-green-400">{priceData.confidence}</span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Last Updated:</span>
              <span className="text-gray-400">
                {new Date(priceData.lastUpdated).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Pricing Algorithm Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2 mt-2">
            <p className="text-blue-400 text-xs font-pixel mb-1">SMART PRICING</p>
            <p className="text-gray-400 text-xs">
              Price adjusts based on real-time ETH price data from Chainlink oracles, 
              making educational content more accessible during high crypto prices.
            </p>
          </div>
        </div>
      )}

      {isLoading && !priceData && (
        <div className="flex items-center justify-center py-4">
          <RefreshCw size={16} className="animate-spin text-primary mr-2" />
          <span className="text-gray-400 text-sm">Loading price data...</span>
        </div>
      )}
    </motion.div>
  );
};
