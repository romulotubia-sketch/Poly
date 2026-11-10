import React from 'react';
import { X, Sparkles, Droplets, Zap, Shield, Eye, HeartHandshake, Flame, ShoppingBag } from 'lucide-react';
import { ESSENCE_SHOP_ITEMS } from '../game/constants';
import { PlayerStats, PetData, EssenceShopItem } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface PetEssenceShopModalProps {
  player: PlayerStats;
  pets: PetData[];
  onClose: () => void;
  onBuyItem: (item: EssenceShopItem) => void;
  onShowMessage: (text: string) => void;
}

const ITEM_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Droplets,
  Sparkles,
  Zap,
  Shield,
  Eye,
  HeartHandshake,
  Flame,
};

export const PetEssenceShopModal: React.FC<PetEssenceShopModalProps> = ({
  player,
  onClose,
  onBuyItem,
  onShowMessage,
}) => {
  const handlePurchase = (item: EssenceShopItem) => {
    if (player.petEssence < item.cost) {
      onShowMessage(`Not enough Pet Essence! Need ${item.cost} Essence.`);
      return;
    }

    onBuyItem(item);
    soundEngine.playBuySuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/75 select-none font-sans">
      <div className="bg-stone-900 border-2 border-purple-500/60 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-stone-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-stone-900 px-4 py-3 flex items-center justify-between border-b border-purple-700/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-700/80 border border-purple-400/50 flex items-center justify-center text-lg shadow-inner">
              🔮
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-purple-200 tracking-wide flex items-center gap-2">
                PET ESSENCE SANCTUARY
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/70 text-purple-300 font-bold border border-purple-500/40">
                  Essence Exchange
                </span>
              </h2>
              <p className="text-[11px] text-purple-200/70">
                Spend Pet Essence from duplicate pet conversions on EXP treats, shards & eggs!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Essence Balance Badge */}
            <div className="flex items-center gap-1.5 bg-purple-950/90 border border-purple-500/50 px-3 py-1 rounded-full text-purple-300 font-bold text-xs shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              <span>{player.petEssence} Essence</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 active:scale-95 transition-transform cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Catalog */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[70vh]">
          {ESSENCE_SHOP_ITEMS.map((item) => {
            const IconComponent = ITEM_ICONS[item.icon] || Sparkles;
            const canAfford = player.petEssence >= item.cost;

            return (
              <div
                key={item.id}
                className="bg-stone-850/90 border border-stone-700/80 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner border shrink-0 ${
                      item.category === 'egg'
                        ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                        : item.category === 'enhancement'
                        ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                        : 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                    }`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-stone-100">{item.name}</h3>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          item.category === 'egg'
                            ? 'bg-amber-950 text-amber-300 border border-amber-600/40'
                            : item.category === 'enhancement'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/40'
                            : 'bg-purple-950 text-purple-300 border border-purple-600/40'
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-300/80 mt-0.5">{item.description}</p>
                    <div className="text-[10px] font-semibold text-emerald-300 mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>{item.effect}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(item)}
                  disabled={!canAfford}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                    canAfford
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Obtain ({item.cost}</span>
                  <Sparkles className="w-3 h-3 text-purple-300" />
                  <span>)</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-stone-950/80 px-4 py-2.5 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
          <span>Earn Pet Essence automatically by obtaining duplicate pets and clearing Wild Grounds waves.</span>
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
