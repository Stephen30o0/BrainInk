import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { ChainlinkPriceFeeds } from './ChainlinkPriceFeeds';

interface Resource {
  id: number;
  title: string;
  description: string;
  type: 'book' | 'course' | 'notes' | 'video';
  price: number;
  rating: number;
  seller: {
    id: number;
    name: string;
    rating: number;
  };
  thumbnail?: string;
  popularity: number;
}

interface DynamicResourceCardProps {
  resource: Resource;
  onAddToCart: (resource: Resource, dynamicPrice: number) => void;
  onViewDetails: (resource: Resource) => void;
}

export const DynamicResourceCard: React.FC<DynamicResourceCardProps> = ({
  resource,
  onAddToCart,
  onViewDetails
}) => {
  const [dynamicPrice, setDynamicPrice] = useState(resource.price);
  const [showPriceDetails, setShowPriceDetails] = useState(false);

  const handlePriceUpdate = (newPrice: number) => {
    setDynamicPrice(newPrice);
  };

  const getPriceChangeIndicator = () => {
    const difference = dynamicPrice - resource.price;
    const percentChange = ((difference / resource.price) * 100);
    
    if (Math.abs(percentChange) < 1) {
      return { icon: null, color: 'text-gray-400', text: 'Stable' };
    } else if (difference < 0) {
      return { 
        icon: <TrendingDown size={12} />, 
        color: 'text-green-400', 
        text: `${Math.abs(percentChange).toFixed(1)}% off!`
      };
    } else {
      return { 
        icon: <TrendingUp size={12} />, 
        color: 'text-red-400', 
        text: `+${percentChange.toFixed(1)}%`
      };
    }
  };

  const priceIndicator = getPriceChangeIndicator();

  return (
    <motion.div
      className="bg-dark-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-yellow-500/50 transition-all"
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start mb-3" onClick={() => onViewDetails(resource)}>
        <div className="text-3xl mr-3">{resource.thumbnail}</div>
        <div className="flex-1">
          <h3 className="font-medium text-white">{resource.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            {/* Base Price */}
            {dynamicPrice !== resource.price && (
              <span className="text-gray-500 text-sm line-through">
                {resource.price} INK
              </span>
            )}
            
            {/* Dynamic Price */}
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 font-medium">
                {Math.floor(dynamicPrice)} INK
              </span>
              {priceIndicator.icon && (
                <div className={`flex items-center gap-1 ${priceIndicator.color}`}>
                  {priceIndicator.icon}
                  <span className="text-xs">{priceIndicator.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-gray-400 text-sm mb-3 line-clamp-2" onClick={() => onViewDetails(resource)}>
        {resource.description}
      </p>

      {/* Chainlink Price Feed Integration */}
      <div className="mb-3">
        <button
          onClick={() => setShowPriceDetails(!showPriceDetails)}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Zap size={12} />
          {showPriceDetails ? 'Hide' : 'Show'} Dynamic Pricing
        </button>
        
        {showPriceDetails && (
          <div className="mt-2">
            <ChainlinkPriceFeeds
              basePrice={resource.price}
              onPriceUpdate={handlePriceUpdate}
            />
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center text-sm text-gray-500">
          <Star size={14} className="text-yellow-400 mr-1" />
          {resource.rating} • {resource.popularity} views
        </div>
        <button 
          className="px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded text-sm hover:bg-yellow-400/30 transition-colors flex items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart({...resource, price: Math.floor(dynamicPrice)}, Math.floor(dynamicPrice));
          }}
        >
          <ShoppingCart size={14} />
          Add to Cart
        </button>
      </div>
    </motion.div>
  );
};
