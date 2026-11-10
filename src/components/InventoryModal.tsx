import React, { useState } from 'react';
import { X, Package, ShoppingBag, Coins, Sparkles, Sprout, ArrowRight } from 'lucide-react';
import { PlayerStats } from '../types/game';
import { CROPS } from '../game/constants';
import { soundEngine } from '../audio/soundEngine';

interface InventoryModalProps {
  inventory: Record<string, number>;
  player: PlayerStats;
  onClose: () => void;
  onAddInventory: (itemId: string, count: number) => void;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onShowMessage: (msg: string) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  player,
  onClose,
  onAddInventory,
  onUpdatePlayer,
  onShowMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'shop'>('inventory');

  // Sell harvested crop for gold
  const handleSellCrop = (cropId: string) => {
    const currentCount = inventory[cropId] || 0;
    if (currentCount <= 0) return;

    const cropDef = CROPS[cropId];
    const unitPrice = cropDef ? cropDef.sellPrice : 20;

    onAddInventory(cropId, -1);
    onUpdatePlayer((prev) => ({ ...prev, gold: prev.gold + unitPrice }));
    soundEngine.playHarvest();
    onShowMessage(`Sold 1x ${cropDef?.name || cropId} for +${unitPrice} Gold!`);
  };

  // Buy seed with gold
  const handleBuySeed = (cropId: string) => {
    const cropDef = CROPS[cropId];
    if (!cropDef) return;

    if (player.gold < cropDef.seedPrice) {
      onShowMessage('Not enough gold to purchase seeds!');
      return;
    }

    onUpdatePlayer((prev) => ({ ...prev, gold: prev.gold - cropDef.seedPrice }));
    onAddInventory(`seed_${cropId}`, 1);
    soundEngine.playPlantSeed();
    onShowMessage(`Purchased 1x ${cropDef.name} Seed!`);
  };

  // Buy farm upgrades
  const handleBuyUpgrade = (title: string, cost: number) => {
    if (player.gold < cost) {
      onShowMessage('Need more gold for this farm expansion!');
      return;
    }
    onUpdatePlayer((prev) => ({
      ...prev,
      gold: prev.gold - cost,
      farmExpansionLevel: prev.farmExpansionLevel + 1,
    }));
    soundEngine.playLevelUp();
    onShowMessage(`✨ Unlocked ${title}! Farm capabilities expanded.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm select-none">
      <div className="bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-600/40 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎒</span>
            <div>
              <h2 className="text-lg font-bold text-amber-200">Farm Storage & Haven Market</h2>
              <p className="text-xs text-stone-400">Manage seeds, harvested produce, tools, and farm expansions</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-amber-950/80 border border-amber-500/40 rounded-xl px-3 py-1 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{player.gold} Gold</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-stone-800 bg-stone-950/80 px-6 pt-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'inventory'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Player Storage & Bag</span>
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'shop'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Farm Shop & Expansions</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'inventory' ? (
            <div className="space-y-6">
              {/* Harvested Produce Section */}
              <div>
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">Harvested Crops</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(CROPS).map(([cropId, crop]) => {
                    const count = inventory[cropId] || 0;
                    return (
                      <div
                        key={cropId}
                        className="bg-stone-900/60 border border-stone-800 rounded-2xl p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow"
                            style={{ backgroundColor: crop.color + '33', border: `1px solid ${crop.color}` }}
                          >
                            🥕
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{crop.name}</h4>
                            <p className="text-[11px] text-stone-400">Owned: {count}</p>
                          </div>
                        </div>

                        <button
                          disabled={count <= 0}
                          onClick={() => handleSellCrop(cropId)}
                          className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
                            count > 0
                              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow cursor-pointer active:scale-95'
                              : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                          }`}
                        >
                          <span>Sell</span>
                          <span className="text-[10px] text-amber-200">+{crop.sellPrice}g</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seeds & Resources */}
              <div>
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">Seeds & Materials</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(inventory)
                    .filter(([key]) => !['carrot', 'strawberry', 'wheat', 'starfruit'].includes(key))
                    .map(([itemId, count]) => {
                      const displayName = itemId.replace('seed_', '').replace('_', ' ').toUpperCase();
                      return (
                        <div
                          key={itemId}
                          className="bg-stone-900/60 border border-stone-800 rounded-2xl p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">
                              {itemId.startsWith('seed') ? '🌱' : itemId === 'stone' ? '🪨' : itemId === 'wood' ? '🪵' : '🍖'}
                            </span>
                            <span className="text-xs font-semibold text-stone-200">{displayName}</span>
                          </div>
                          <span className="text-xs font-bold text-amber-400 px-2 py-0.5 rounded-md bg-stone-800">
                            x{count}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Seed Purchasing */}
              <div>
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">Buy Seeds</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(CROPS).map(([cropId, crop]) => (
                    <div
                      key={cropId}
                      className="bg-stone-900/60 border border-stone-800 rounded-2xl p-3.5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-lg">
                          🌱
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{crop.name} Seed</h4>
                          <p className="text-[10px] text-stone-400">Grows in {crop.growTimeSeconds}s</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleBuySeed(cropId)}
                        disabled={player.gold < crop.seedPrice}
                        className={`text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
                          player.gold >= crop.seedPrice
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow cursor-pointer active:scale-95'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        <span>Buy</span>
                        <span className="text-[10px] text-amber-300">{crop.seedPrice}g</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Farm Expansions */}
              <div>
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">Farm Expansions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-amber-200">Greenhouse Fertilizer</h4>
                      <p className="text-[10px] text-stone-400">+25% global crop growth speed permanently</p>
                    </div>
                    <button
                      onClick={() => handleBuyUpgrade('Greenhouse Fertilizer', 120)}
                      className="text-xs bg-amber-700 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl font-bold transition-all shadow cursor-pointer"
                    >
                      120 Gold
                    </button>
                  </div>

                  <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-amber-200">Spring Water Pump</h4>
                      <p className="text-[10px] text-stone-400">Plots retain water 2x longer</p>
                    </div>
                    <button
                      onClick={() => handleBuyUpgrade('Spring Water Pump', 180)}
                      className="text-xs bg-amber-700 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl font-bold transition-all shadow cursor-pointer"
                    >
                      180 Gold
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
