import React, { useState } from 'react';
import {
  X,
  Package,
  ShoppingBag,
  Coins,
  Sparkles,
  Sprout,
  ArrowRight,
  Utensils,
  Heart,
  Zap,
  Target,
  Wind,
  Shield,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { PlayerStats, NourishmentBonuses, MissionEventType, PetRarity } from '../types/game';
import { CROPS, NOURISHMENT_CONFIGS } from '../game/constants';
import { soundEngine } from '../audio/soundEngine';

const RARITY_BADGE_STYLE: Record<PetRarity, string> = {
  Common: 'bg-stone-800 text-stone-300 border-stone-600/60',
  Uncommon: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
  Rare: 'bg-sky-950/80 text-sky-300 border-sky-500/50',
  Epic: 'bg-purple-950/80 text-purple-300 border-purple-500/50',
  Legendary: 'bg-amber-950/80 text-amber-300 border-amber-500/60',
  Mythical: 'bg-rose-950/80 text-rose-300 border-rose-500/60',
};

interface InventoryModalProps {
  inventory: Record<string, number>;
  player: PlayerStats;
  onClose: () => void;
  onAddInventory: (itemId: string, count: number) => void;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onShowMessage: (msg: string) => void;
  onConsumeCrop?: (cropId: string, count?: number) => void;
  initialTab?: 'inventory' | 'shop' | 'nourishment';
  onMissionEvent?: (eventType: MissionEventType, amount?: number, trackKey?: string) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  player,
  onClose,
  onAddInventory,
  onUpdatePlayer,
  onShowMessage,
  onConsumeCrop,
  initialTab = 'inventory',
  onMissionEvent,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'shop' | 'nourishment'>(initialTab);
  const [confirmConsumeCropId, setConfirmConsumeCropId] = useState<string | null>(null);

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
    onMissionEvent?.('earn_farm_coins', unitPrice);
    onMissionEvent?.('earn_coins', unitPrice);
  };

  const handleTriggerConsume = (cropId: string) => {
    if (onConsumeCrop) {
      onConsumeCrop(cropId, 1);
    }
    setConfirmConsumeCropId(null);
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
        <div className="flex border-b border-stone-800 bg-stone-950/80 px-6 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'inventory'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Player Storage & Bag</span>
          </button>
          <button
            onClick={() => setActiveTab('nourishment')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'nourishment'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>🥗</span>
            <span>Character Nourishment</span>
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Harvested Crops</h3>
                  <button
                    onClick={() => setActiveTab('nourishment')}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <span>View Nourishment Stats</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(CROPS).map(([cropId, crop]) => {
                    const count = inventory[cropId] || 0;
                    const cfg = NOURISHMENT_CONFIGS[cropId];
                    const cropBonus = cfg ? cfg.description : '';
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
                            {crop.emoji || cfg?.icon || '🌱'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-white">{crop.name}</h4>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                  RARITY_BADGE_STYLE[crop.rarity]
                                }`}
                              >
                                {crop.rarity}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-400">Owned: {count}</p>
                            {cropBonus && (
                              <p className="text-[9.5px] text-emerald-400/90 font-medium">{cropBonus}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={count <= 0}
                            onClick={() => setConfirmConsumeCropId(cropId)}
                            className={`text-xs px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
                              count > 0
                                ? 'bg-emerald-700 hover:bg-emerald-600 text-emerald-100 shadow cursor-pointer active:scale-95'
                                : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                            }`}
                            title="Consume for permanent stat bonus"
                          >
                            <Utensils className="w-3 h-3" />
                            <span>Eat</span>
                          </button>
                          <button
                            disabled={count <= 0}
                            onClick={() => handleSellCrop(cropId)}
                            className={`text-xs px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
                              count > 0
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow cursor-pointer active:scale-95'
                                : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                            }`}
                          >
                            <span>Sell</span>
                            <span className="text-[10px] text-amber-200">+{crop.sellPrice}g</span>
                          </button>
                        </div>
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
                    .filter(([key]) => !Object.prototype.hasOwnProperty.call(CROPS, key))
                    .map(([itemId, count]) => {
                      const seedCropId = itemId.startsWith('seed_') ? itemId.replace('seed_', '') : null;
                      const seedCrop = seedCropId ? CROPS[seedCropId] : null;
                      const displayName = seedCrop
                        ? `${seedCrop.name} Seed`
                        : itemId.replace('seed_', '').replace(/_/g, ' ').toUpperCase();
                      return (
                        <div
                          key={itemId}
                          className="bg-stone-900/60 border border-stone-800 rounded-2xl p-3 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-lg shrink-0">
                              {seedCrop
                                ? seedCrop.emoji
                                : itemId.startsWith('seed')
                                ? '🌱'
                                : itemId === 'stone'
                                ? '🪨'
                                : itemId === 'wood'
                                ? '🪵'
                                : '🍖'}
                            </span>
                            <span className="text-xs font-semibold text-stone-200 truncate">{displayName}</span>
                          </div>
                          <span className="text-xs font-bold text-amber-400 px-2 py-0.5 rounded-md bg-stone-800 shrink-0">
                            x{count}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : activeTab === 'nourishment' ? (
            <div className="space-y-5">
              {/* Stats overview banner */}
              <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-stone-400 font-bold uppercase">Max HP</div>
                    <div className="text-xs font-black text-rose-200">
                      {100 + Number((player.nourishment?.maxHpBonus || 0).toFixed(1))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-stone-400 font-bold uppercase">Attack</div>
                    <div className="text-xs font-black text-amber-200">
                      +{(player.nourishment?.attackDamagePct || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-stone-400 font-bold uppercase">Crit Rate</div>
                    <div className="text-xs font-black text-purple-200">
                      +{(player.nourishment?.critChancePct || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-stone-400 font-bold uppercase">Crit Dmg</div>
                    <div className="text-xs font-black text-orange-200">
                      +{(player.nourishment?.critDamagePct || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-stone-400 font-bold uppercase">Skill Dmg</div>
                    <div className="text-xs font-black text-cyan-200">
                      +{(player.nourishment?.skillDamagePct || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-stone-400 font-bold uppercase">Speed</div>
                    <div className="text-xs font-black text-sky-200">
                      +{(player.nourishment?.moveSpeedPct || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-stone-400 font-bold uppercase">Defense</div>
                    <div className="text-xs font-black text-emerald-200">
                      +{(player.nourishment?.defensePct || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Crop Cards */}
              <div className="space-y-3">
                {Object.values(NOURISHMENT_CONFIGS).map((cfg) => {
                  const owned = inventory[cfg.cropId] || 0;
                  const currentBonus = player.nourishment?.[cfg.statKey] ?? 0;
                  const isMaxed = currentBonus >= cfg.maxBonus;
                  const pct = Math.min(100, (currentBonus / cfg.maxBonus) * 100);

                  return (
                    <div
                      key={cfg.cropId}
                      className="bg-stone-900/70 border border-stone-800 rounded-2xl p-3.5 flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{cfg.icon}</span>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-white">{cfg.name}</h4>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                  RARITY_BADGE_STYLE[cfg.rarity]
                                }`}
                              >
                                {cfg.rarity}
                              </span>
                              <span className="text-[10px] bg-stone-800 text-amber-300 font-semibold px-2 py-0.2 rounded-full">
                                {owned} in bag
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-300">{cfg.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right text-[11px]">
                            <div className="font-bold text-white">
                              +{currentBonus.toFixed(1)} / +{cfg.maxBonus} {cfg.unit}
                            </div>
                            <div className="text-[9.5px] text-stone-400">
                              {isMaxed ? 'Max reached' : `+${(cfg.maxBonus - currentBonus).toFixed(1)} cap left`}
                            </div>
                          </div>
                          <button
                            disabled={owned <= 0 || isMaxed}
                            onClick={() => setConfirmConsumeCropId(cfg.cropId)}
                            className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 shadow transition-all ${
                              owned > 0 && !isMaxed
                                ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer active:scale-95'
                                : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                            }`}
                          >
                            <Utensils className="w-3 h-3" />
                            <span>Consume</span>
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                        <div
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
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
                          {crop.emoji}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-white">{crop.name} Seed</h4>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                RARITY_BADGE_STYLE[crop.rarity]
                              }`}
                            >
                              {crop.rarity}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-400">
                            Grows in {crop.growTimeSeconds}s • Sell {crop.sellPrice}g
                          </p>
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

        {/* Confirmation Modal for Direct Crop Consumption */}
        {confirmConsumeCropId && NOURISHMENT_CONFIGS[confirmConsumeCropId] && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-stone-900 border-2 border-amber-500/80 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-stone-100 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 text-amber-300 mb-2">
                <span className="text-3xl">{NOURISHMENT_CONFIGS[confirmConsumeCropId].icon}</span>
                <div>
                  <h4 className="text-sm font-black text-amber-200">Confirm Nourishment</h4>
                  <p className="text-xs text-stone-400">{NOURISHMENT_CONFIGS[confirmConsumeCropId].name}</p>
                </div>
              </div>
              <p className="text-xs text-stone-300 my-3 bg-stone-950/80 border border-stone-800 rounded-xl p-3">
                Consume 1x {NOURISHMENT_CONFIGS[confirmConsumeCropId].name}?
                <br />
                <strong className="text-emerald-400">
                  {NOURISHMENT_CONFIGS[confirmConsumeCropId].description}
                </strong>{' '}
                permanently!
              </p>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setConfirmConsumeCropId(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleTriggerConsume(confirmConsumeCropId)}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Yes, Eat</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
