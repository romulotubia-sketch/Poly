import React from 'react';
import { X, Clock, Coins, Sparkles, Store } from 'lucide-react';
import { CROPS, NOURISHMENT_CONFIGS } from '../game/constants';
import { PetRarity } from '../types/game';

const RARITY_BADGE_STYLE: Record<PetRarity, string> = {
  Common: 'bg-stone-800 text-stone-300 border-stone-600/60',
  Uncommon: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
  Rare: 'bg-sky-950/80 text-sky-300 border-sky-500/50',
  Epic: 'bg-purple-950/80 text-purple-300 border-purple-500/50',
  Legendary: 'bg-amber-950/80 text-amber-300 border-amber-500/60',
  Mythical: 'bg-rose-950/80 text-rose-300 border-rose-500/60',
};

interface SeedPickerModalProps {
  plotId: number;
  inventory: Record<string, number>;
  onClose: () => void;
  onSelectSeed: (plotId: number, cropId: string) => void;
  onOpenSeedShop: () => void;
}

export const SeedPickerModal: React.FC<SeedPickerModalProps> = ({
  plotId,
  inventory,
  onClose,
  onSelectSeed,
  onOpenSeedShop,
}) => {
  const cropKeys = Object.keys(CROPS);
  const availableSeeds = cropKeys.filter((key) => (inventory[`seed_${key}`] || 0) > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/75 select-none font-sans">
      <div className="bg-stone-900 border-2 border-emerald-500/60 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-stone-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-stone-900 px-4 py-3 flex items-center justify-between border-b border-emerald-700/40">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <div>
              <h2 className="text-sm font-black text-emerald-200">CHOOSE SEED TO PLANT</h2>
              <p className="text-[10px] text-emerald-300/70">Select an owned seed for Plot #{plotId + 1}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 active:scale-95 transition-transform cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Seeds Grid */}
        <div className="p-3 sm:p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {availableSeeds.length === 0 ? (
            <div className="text-center py-6 px-4 bg-stone-850 rounded-2xl border border-stone-800 space-y-3">
              <div className="text-3xl">🌾</div>
              <h3 className="font-bold text-sm text-stone-200">No Seeds in Inventory</h3>
              <p className="text-xs text-stone-400">
                You do not have any seeds in your pouch. Visit Barnaby's Seed Stall to purchase seeds!
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenSeedShop();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <Store className="w-4 h-4" />
                <span>Visit Seed Shop</span>
              </button>
            </div>
          ) : (
            availableSeeds.map((cropId) => {
              const crop = CROPS[cropId];
              const nourish = NOURISHMENT_CONFIGS[cropId];
              const count = inventory[`seed_${cropId}`] || 0;

              return (
                <button
                  key={cropId}
                  onClick={() => {
                    onSelectSeed(plotId, cropId);
                    onClose();
                  }}
                  className="w-full bg-stone-850 hover:bg-stone-800 border border-stone-700 hover:border-emerald-500/70 rounded-2xl p-2.5 flex items-center justify-between text-left transition-all active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner border border-white/10 shrink-0"
                      style={{ backgroundColor: `${crop.color}33` }}
                    >
                      {crop.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-xs text-stone-100">{crop.name}</h4>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            RARITY_BADGE_STYLE[crop.rarity]
                          }`}
                        >
                          {crop.rarity}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/40">
                          x{count}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-stone-400">
                        <span className="flex items-center gap-0.5 text-sky-300">
                          <Clock className="w-2.5 h-2.5" /> {crop.growTimeSeconds}s
                        </span>
                        <span className="flex items-center gap-0.5 text-amber-300">
                          <Coins className="w-2.5 h-2.5" /> Harvest: {crop.sellPrice}g
                        </span>
                        {nourish && (
                          <span className="text-purple-300">
                            +{nourish.bonusPerCrop}{nourish.unit} {nourish.statName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-emerald-600/90 text-white font-bold text-xs rounded-xl shadow">
                    Plant
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Quick Link to Shop */}
        <div className="bg-stone-950/80 px-4 py-2.5 border-t border-stone-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Water after planting for faster growth!</span>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenSeedShop();
            }}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Buy More</span>
          </button>
        </div>
      </div>
    </div>
  );
};
