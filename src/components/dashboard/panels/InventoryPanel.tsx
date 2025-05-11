import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
export const InventoryPanel = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const inventory = [{
    id: '1',
    name: 'Study Boost',
    type: 'consumable',
    rarity: 'rare',
    icon: '⚡',
    desc: '2x XP for 1 hour',
    quantity: 3
  }, {
    id: '2',
    name: 'Knowledge Crystal',
    type: 'material',
    rarity: 'epic',
    icon: '💎',
    desc: 'Used for crafting advanced items',
    quantity: 5
  }, {
    id: '3',
    name: "Scholar's Robe",
    type: 'equipment',
    rarity: 'legendary',
    icon: '👘',
    desc: '+15% wisdom bonus',
    quantity: 1
  }];
  const categories = [{
    id: 'all',
    label: 'All'
  }, {
    id: 'consumable',
    label: 'Consumables'
  }, {
    id: 'material',
    label: 'Materials'
  }, {
    id: 'equipment',
    label: 'Equipment'
  }];
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'text-yellow-400';
      case 'epic':
        return 'text-purple-400';
      case 'rare':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };
  return <div className="p-4">
      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <input type="text" placeholder="Search inventory..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-dark/50 border border-primary/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary" />
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(category => <button key={category.id} onClick={() => setActiveCategory(category.id)} className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${activeCategory === category.id ? 'bg-primary/20 text-primary' : 'bg-dark/50 text-gray-400 hover:bg-primary/10'}`}>
              {category.label}
            </button>)}
        </div>
      </div>
      {/* Inventory Grid */}
      <div className="grid grid-cols-2 gap-4">
        {inventory.filter(item => (activeCategory === 'all' || item.type === activeCategory) && item.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => <div key={item.id} className="bg-dark/30 border border-primary/20 rounded-lg p-3 hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{item.icon}</div>
                <div className="flex-1">
                  <h3 className={`text-sm ${getRarityColor(item.rarity)}`}>
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-primary">
                      x{item.quantity}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {item.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>)}
      </div>
    </div>;
};