import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Heart,
  Zap,
  Target,
  Wind,
  Shield,
  Utensils,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { PlayerStats, NourishmentBonuses } from '../types/game';
import { NOURISHMENT_CONFIGS, CropNourishmentConfig, CROPS } from '../game/constants';
import { soundEngine } from '../audio/soundEngine';

interface NourishmentModalProps {
  player: PlayerStats;
  inventory: Record<string, number>;
  onClose: () => void;
  onConsumeCrop: (cropId: string, count?: number) => void;
}

export const NourishmentModal: React.FC<NourishmentModalProps> = ({
  player,
  inventory,
  onClose,
  onConsumeCrop,
}) => {
  const [confirmCrop, setConfirmCrop] = useState<CropNourishmentConfig | null>(null);
  const [consumeAmount, setConsumeAmount] = useState<number>(1);

  const nourishment: NourishmentBonuses = player.nourishment || {
    carrotsConsumed: 0,
    tomatoesConsumed: 0,
    strawberriesConsumed: 0,
    cornConsumed: 0,
    pumpkinsConsumed: 0,
    maxHpBonus: 0,
    attackDamagePct: 0,
    critChancePct: 0,
    moveSpeedPct: 0,
    defensePct: 0,
  };

  const handleStartConsume = (config: CropNourishmentConfig, amount: number = 1) => {
    const available = inventory[config.cropId] || 0;
    if (available <= 0) return;

    const currentBonus = nourishment[config.statKey] || 0;
    const remainingCap = Math.max(0, config.maxBonus - currentBonus);
    if (remainingCap <= 0.001) return;

    // Cap the consume amount to remaining progression capacity
    const maxAffordableByCap = Math.ceil(remainingCap / config.bonusPerCrop);
    const validAmount = Math.max(1, Math.min(amount, available, maxAffordableByCap));

    setConsumeAmount(validAmount);
    setConfirmCrop(config);
  };

  const handleConfirmConsume = () => {
    if (!confirmCrop) return;
    onConsumeCrop(confirmCrop.cropId, consumeAmount);
    soundEngine.playHarvest();
    setConfirmCrop(null);
  };

  const configs = Object.values(NOURISHMENT_CONFIGS);

  // Overall stats calculations
  const totalMaxHp = 100 + Number((nourishment.maxHpBonus || 0).toFixed(1));
  const totalAttackDamagePct = Number((nourishment.attackDamagePct || 0).toFixed(1));
  const totalCritChancePct = Number((nourishment.critChancePct || 0).toFixed(1));
  const totalMoveSpeedPct = Number((nourishment.moveSpeedPct || 0).toFixed(1));
  const totalDefensePct = Number((nourishment.defensePct || 0).toFixed(1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md select-none">
      <div className="bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 border border-amber-600/50 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-800 bg-stone-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shadow">
              🥗
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-amber-200 tracking-wide">
                  Character Nourishment
                </h2>
                <span className="bg-amber-950/90 text-amber-300 border border-amber-600/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  PERMANENT
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Consume harvested crops to permanently empower your character's combat attributes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Attributes Overview Banner */}
        <div className="px-5 sm:px-6 py-3.5 bg-stone-950/70 border-b border-stone-800/80 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {/* Max HP */}
          <div className="bg-stone-900/90 border border-rose-500/30 rounded-xl p-2.5 flex items-center gap-2.5">
            <Heart className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Max HP</div>
              <div className="text-xs sm:text-sm font-black text-rose-200">
                {totalMaxHp}
                <span className="text-[10px] text-rose-400/90 ml-1">
                  (+{(nourishment.maxHpBonus || 0).toFixed(1)})
                </span>
              </div>
            </div>
          </div>

          {/* Attack Damage */}
          <div className="bg-stone-900/90 border border-amber-500/30 rounded-xl p-2.5 flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Attack</div>
              <div className="text-xs sm:text-sm font-black text-amber-200">
                +{totalAttackDamagePct}%
              </div>
            </div>
          </div>

          {/* Critical Chance */}
          <div className="bg-stone-900/90 border border-purple-500/30 rounded-xl p-2.5 flex items-center gap-2.5">
            <Target className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Crit Rate</div>
              <div className="text-xs sm:text-sm font-black text-purple-200">
                +{totalCritChancePct}%
              </div>
            </div>
          </div>

          {/* Move Speed */}
          <div className="bg-stone-900/90 border border-sky-500/30 rounded-xl p-2.5 flex items-center gap-2.5">
            <Wind className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Speed</div>
              <div className="text-xs sm:text-sm font-black text-sky-200">
                +{totalMoveSpeedPct}%
              </div>
            </div>
          </div>

          {/* Defense */}
          <div className="bg-stone-900/90 border border-emerald-500/30 rounded-xl p-2.5 flex items-center gap-2.5 col-span-2 sm:col-span-1">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Defense</div>
              <div className="text-xs sm:text-sm font-black text-emerald-200">
                +{totalDefensePct}%
              </div>
            </div>
          </div>
        </div>

        {/* Crops List & Progression */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
          {configs.map((cfg) => {
            const cropDef = CROPS[cfg.cropId];
            const ownedCount = inventory[cfg.cropId] || 0;
            const accumulatedBonus = Number((nourishment[cfg.statKey] || 0).toFixed(1));
            const remainingCapacity = Number(Math.max(0, cfg.maxBonus - accumulatedBonus).toFixed(1));
            const progressPct = Math.min(100, Math.max(0, (accumulatedBonus / cfg.maxBonus) * 100));
            const isMaxed = accumulatedBonus >= cfg.maxBonus;
            const consumedCount = nourishment[cfg.consumedKey] || 0;

            return (
              <div
                key={cfg.cropId}
                className={`border rounded-2xl p-4 transition-all ${
                  isMaxed
                    ? 'bg-stone-900/40 border-stone-800 opacity-90'
                    : 'bg-stone-900/80 border-stone-800 hover:border-amber-600/40 shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Icon, Name & Effect */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0"
                      style={{
                        backgroundColor: (cropDef?.color || '#ff7b00') + '25',
                        border: `1.5px solid ${cropDef?.color || '#ff7b00'}80`,
                      }}
                    >
                      {cfg.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white tracking-wide">{cfg.name}</h4>
                        <span className="bg-stone-800 text-stone-300 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                          Bag: <strong className="text-amber-300">{ownedCount}</strong>
                        </span>
                        {isMaxed && (
                          <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-[9px] font-black px-2 py-0.2 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> MAX
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-300 font-medium mt-0.5">{cfg.description}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        Consumed: {consumedCount} | Target Stat: {cfg.statName}
                      </p>
                    </div>
                  </div>

                  {/* Right: Progress and Action */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2.5 border-t sm:border-t-0 border-stone-800/80 pt-2 sm:pt-0">
                    <div className="text-right">
                      <div className="text-xs font-black text-stone-200">
                        +{accumulatedBonus} / +{cfg.maxBonus} {cfg.unit}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {isMaxed ? 'Capacity reached' : `Remaining: +${remainingCapacity} ${cfg.unit}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Single Consume */}
                      <button
                        onClick={() => handleStartConsume(cfg, 1)}
                        disabled={ownedCount <= 0 || isMaxed}
                        className={`text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow ${
                          ownedCount > 0 && !isMaxed
                            ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer active:scale-95'
                            : 'bg-stone-850 text-stone-500 cursor-not-allowed border border-stone-800'
                        }`}
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Eat 1</span>
                      </button>

                      {/* Quick 5 or All Consume if player has multiple */}
                      {ownedCount >= 5 && !isMaxed && (
                        <button
                          onClick={() => handleStartConsume(cfg, 5)}
                          className="text-xs px-2.5 py-1.5 rounded-xl font-bold bg-amber-700/80 hover:bg-amber-600 text-amber-100 transition-all shadow cursor-pointer active:scale-95"
                          title="Eat 5"
                        >
                          +5
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar towards maximum bonus */}
                <div className="mt-3 pt-2.5 border-t border-stone-800/60">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-stone-400 mb-1">
                    <span>Bonus Progress</span>
                    <span className="text-amber-300 font-bold">{progressPct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300 rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info note */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-1.5 text-stone-300 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>All nourishment bonuses persist permanently across your entire adventure.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Confirmation Modal Prompt before Consumption */}
      {confirmCrop && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-stone-900 border-2 border-amber-500/80 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl text-stone-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-300 mb-3">
              <span className="text-3xl">{confirmCrop.icon}</span>
              <div>
                <h3 className="text-base font-black text-amber-200">Confirm Nourishment</h3>
                <p className="text-xs text-stone-400">Consume {confirmCrop.name}?</p>
              </div>
            </div>

            <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 my-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Crop to consume:</span>
                <span className="font-bold text-white">
                  {consumeAmount}x {confirmCrop.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Permanent Bonus Gained:</span>
                <span className="font-black text-emerald-400">
                  +{(confirmCrop.bonusPerCrop * consumeAmount).toFixed(1)} {confirmCrop.unit} {confirmCrop.statName}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-stone-800/80 pt-2">
                <span className="text-stone-400">Inventory after eating:</span>
                <span className="font-bold text-amber-300">
                  {(inventory[confirmCrop.cropId] || 0) - consumeAmount} remaining
                </span>
              </div>
            </div>

            <p className="text-[11px] text-stone-400 italic mb-5">
              This crop will be removed from your bag and the attribute increase will be applied immediately.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmCrop(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConsume}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black text-xs shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Yes, Consume</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
