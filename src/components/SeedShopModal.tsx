import React, { useState } from 'react';
import { X, Coins, Clock, Sparkles, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { CROPS, NOURISHMENT_CONFIGS } from '../game/constants';
import { PlayerStats, PetRarity } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface SeedShopModalProps {
  player: PlayerStats;
  inventory: Record<string, number>;
  onClose: () => void;
  onBuySeed: (seedKey: string, cost: number, count: number) => void;
  onShowMessage: (text: string) => void;
}

const RARITY_TABS: ('All' | PetRarity)[] = ['All', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythical'];

const RARITY_BADGE_STYLE: Record<PetRarity, string> = {
  Common: 'bg-stone-800 text-stone-300 border-stone-600/60',
  Uncommon: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
  Rare: 'bg-sky-950/80 text-sky-300 border-sky-500/50',
  Epic: 'bg-purple-950/80 text-purple-300 border-purple-500/50',
  Legendary: 'bg-amber-950/80 text-amber-300 border-amber-500/60',
  Mythical: 'bg-rose-950/80 text-rose-300 border-rose-500/60',
};

export const SeedShopModal: React.FC<SeedShopModalProps> = ({
  player,
  inventory,
  onClose,
  onBuySeed,
  onShowMessage,
}) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [rarityFilter, setRarityFilter] = useState<'All' | PetRarity>('All');

  const cropKeys = Object.keys(CROPS).filter((key) => {
    if (rarityFilter === 'All') return true;
    return CROPS[key].rarity === rarityFilter;
  });

  const handleBuy = (cropId: string) => {
    const crop = CROPS[cropId];
    if (!crop) return;
    const qty = quantities[cropId] || 1;
    const totalCost = crop.seedPrice * qty;

    if (player.gold < totalCost) {
      onShowMessage(`Not enough coins! Need ${totalCost} coins.`);
      return;
    }

    onBuySeed(`seed_${cropId}`, totalCost, qty);
    soundEngine.playBuySuccess();
    onShowMessage(`Purchased ${qty}x ${crop.name} Seed!`);
  };

  const updateQty = (cropId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [cropId]: Math.max(1, Math.min(20, (prev[cropId] || 1) + delta)),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/75 select-none font-sans">
      <div className="bg-stone-900 border-2 border-emerald-600/60 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-stone-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-stone-900 px-4 py-3 flex items-center justify-between border-b border-emerald-700/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-700/80 border border-emerald-400/50 flex items-center justify-center text-lg shadow-inner">
              🌱
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-emerald-200 tracking-wide flex items-center gap-2">
                BARNABY'S SEED STALL
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 font-bold border border-emerald-500/40">
                  {Object.keys(CROPS).length} Varieties
                </span>
              </h2>
              <p className="text-[11px] text-emerald-100/70">Buy seeds to cultivate bountiful harvests, profit, and permanent buffs!</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-500/40 px-3 py-1 rounded-full text-amber-300 font-bold text-xs shadow-inner">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{player.gold}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 active:scale-95 transition-transform cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Rarity Filter Tabs */}
        <div className="px-3 sm:px-4 py-2 bg-stone-950/80 border-b border-stone-800 flex items-center gap-1.5 overflow-x-auto">
          {RARITY_TABS.map((tab) => {
            const active = rarityFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setRarityFilter(tab)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all shrink-0 cursor-pointer ${
                  active
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                    : 'bg-stone-900 text-stone-400 border-stone-700 hover:text-stone-200'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Catalog List */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[65vh]">
          {cropKeys.map((key) => {
            const crop = CROPS[key];
            const nourish = NOURISHMENT_CONFIGS[key];
            const qty = quantities[key] || 1;
            const totalCost = crop.seedPrice * qty;
            const owned = inventory[`seed_${key}`] || 0;
            const profitPerCrop = crop.sellPrice - crop.seedPrice;

            return (
              <div
                key={key}
                className="bg-stone-850/90 border border-stone-700/80 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-emerald-500/50 transition-colors"
              >
                {/* Crop Icon & Info */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/10 shrink-0"
                    style={{ backgroundColor: `${crop.color}33` }}
                  >
                    {crop.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-sm text-stone-100">{crop.name} Seed</h3>
                      <span
                        className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border ${
                          RARITY_BADGE_STYLE[crop.rarity]
                        }`}
                      >
                        {crop.rarity}
                      </span>
                      <span className="text-[10px] text-stone-400 bg-stone-900 px-2 py-0.5 rounded-md border border-stone-700">
                        Owned: {owned}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-300/80 line-clamp-1 mt-0.5">{crop.description}</p>
                    {/* Stats badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
                      <span className="flex items-center gap-1 text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-800/40">
                        <Clock className="w-3 h-3 text-sky-400" /> {crop.growTimeSeconds}s
                      </span>
                      <span className="flex items-center gap-1 text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                        <ArrowUpRight className="w-3 h-3 text-emerald-400" /> Sell: {crop.sellPrice}g
                      </span>
                      <span className="text-amber-400 font-semibold bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-700/30">
                        +{profitPerCrop}g profit
                      </span>
                      {nourish && (
                        <span className="text-purple-300 font-medium bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-700/30">
                          🥗 +{nourish.bonusPerCrop}{nourish.unit} {nourish.statName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Purchase Controls */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-800 shrink-0">
                  {/* Quantity selector */}
                  <div className="flex items-center bg-stone-900 rounded-xl border border-stone-700 p-0.5">
                    <button
                      onClick={() => updateQty(key, -1)}
                      className="w-7 h-7 flex items-center justify-center font-bold text-stone-300 hover:text-white rounded-lg active:bg-stone-800 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-xs text-emerald-300">{qty}</span>
                    <button
                      onClick={() => updateQty(key, 1)}
                      className="w-7 h-7 flex items-center justify-center font-bold text-stone-300 hover:text-white rounded-lg active:bg-stone-800 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Buy Button */}
                  <button
                    onClick={() => handleBuy(key)}
                    disabled={player.gold < totalCost}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer ${
                      player.gold >= totalCost
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Buy ({totalCost}</span>
                    <Coins className="w-3 h-3 text-amber-300" />
                    <span>)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="bg-stone-950/80 px-4 py-2.5 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Watered plots grow at full speed. Eat crops for permanent nourishment stats!</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-lg cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

