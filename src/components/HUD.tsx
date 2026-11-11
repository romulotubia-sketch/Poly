import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  Droplets,
  Rabbit,
  Wind,
  Hammer,
  HeartHandshake,
  Sun,
  ShieldCheck,
  Eye,
  Dumbbell,
  HeartPulse,
  Coins,
  Calendar,
  Package,
  Heart,
  ChevronDown,
  ChevronUp,
  Settings,
  Maximize,
  Minimize,
  EyeOff,
} from 'lucide-react';
import { PetData, PlayerStats, GraphicsQuality, PerformanceStatsData } from '../types/game';

interface HUDProps {
  player: PlayerStats;
  pets: PetData[];
  onTriggerSkill: (petId: string) => void;
  skillCooldowns: Record<string, number>; // remaining seconds
  nearInteractable: { text: string; action: () => void } | null;
  onOpenPets: () => void;
  onOpenInventory: () => void;
  onOpenSettings: () => void;
  onOpenSeedShop?: () => void;
  onOpenEssenceShop?: () => void;
  onLeaveInstance?: () => void;
  currentLocation?: 'farm' | 'wild_grounds';
  currentWave?: number;
  waveTitle?: string;
  totalWaves?: number;
  enemiesRemaining?: number;
  prepCountdown?: number | null;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  messageToast: string | null;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  timePhase?: 'morning' | 'day' | 'sunset' | 'night';
  perfStats?: PerformanceStatsData | null;
  showPerfStats?: boolean;
  graphicsQuality?: GraphicsQuality;
}

const SKILL_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Flame,
  Droplets,
  Rabbit,
  Wind,
  Hammer,
  HeartHandshake,
  Sun,
  ShieldCheck,
  Sparkles,
  Eye,
  Dumbbell,
  HeartPulse,
};

export const HUD: React.FC<HUDProps> = ({
  player,
  pets,
  onTriggerSkill,
  skillCooldowns,
  nearInteractable,
  onOpenPets,
  onOpenInventory,
  onOpenSettings,
  onOpenSeedShop,
  onOpenEssenceShop,
  onLeaveInstance,
  currentLocation = 'farm',
  currentWave = 1,
  waveTitle = '',
  totalWaves = 10,
  enemiesRemaining = 0,
  prepCountdown = null,
  isZenMode,
  onToggleZenMode,
  messageToast,
  isFullscreen,
  onToggleFullscreen,
  timePhase = 'day',
  perfStats = null,
  showPerfStats = false,
  graphicsQuality = 'medium',
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Equipped pet skills in the 5 slots
  const equippedPets = player.equippedSkillSlots.map((id) => (id ? pets.find((p) => p.id === id) || null : null));

  // Find currently following pet
  const followingPet = pets.find((p) => p.isFollowing) || pets[0];

  const maxHealth = player.maxHealth || 100;
  const healthPercent = Math.max(0, Math.min(100, ((player.health ?? maxHealth) / maxHealth) * 100));

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden font-sans">
      {/* Performance Monitor Floating Overlay (Requirement 5) */}
      {showPerfStats && perfStats && !isZenMode && (
        <aside
          aria-label="Performance Monitor"
          className="pointer-events-auto absolute top-14 right-2 sm:right-4 z-40 bg-stone-950/90 border border-stone-700/80 rounded-xl px-2.5 py-1.5 shadow-2xl backdrop-blur-sm text-[10px] font-mono flex flex-col gap-0.5 text-stone-200 min-w-[130px]"
        >
          <div className="flex items-center justify-between gap-3 font-bold border-b border-stone-800 pb-0.5">
            <span
              className={
                perfStats.fps >= 50
                  ? 'text-emerald-400'
                  : perfStats.fps >= 30
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }
            >
              ⚡ {perfStats.fps} FPS
            </span>
            <span className="text-stone-400 text-[9px]">{perfStats.frameTimeMs} ms</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[9px] text-stone-300">
            <span>Particles:</span>
            <span className="text-amber-300 font-bold">
              {perfStats.activeParticles}/{perfStats.maxParticles}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[9px] text-stone-300">
            <span>Draw Calls:</span>
            <span className="text-sky-300 font-bold">{perfStats.drawCalls}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[9px] text-stone-300">
            <span>Triangles:</span>
            <span className="text-purple-300 font-bold">
              {(perfStats.triangles / 1000).toFixed(1)}k
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[9px] text-stone-400 border-t border-stone-800/80 pt-0.5 mt-0.5">
            <span>Enemies / Pets:</span>
            <span className="text-stone-200 font-bold">
              {perfStats.activeEnemies} / {perfStats.activePets}
            </span>
          </div>
          <div className="flex items-center justify-between text-[8.5px] text-stone-400 pt-0.5">
            <span>Profile:</span>
            <span className="uppercase font-bold px-1 rounded bg-stone-800 text-amber-300">
              {graphicsQuality}
            </span>
          </div>
        </aside>
      )}

      {/* Toast Notification Banner */}
      {messageToast && (
        <div className="pointer-events-auto absolute top-14 left-1/2 -translate-x-1/2 z-50 px-2 max-w-[90vw]">
          <div className="bg-amber-950/90 text-amber-100 text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg border border-amber-500/50 backdrop-blur-md flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{messageToast}</span>
          </div>
        </div>
      )}

      {/* Wild Grounds Wave Status Center Banner */}
      {currentLocation === 'wild_grounds' && !isZenMode && (
        <div className="pointer-events-auto absolute top-14 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1">
          <div className="bg-stone-950/90 border-2 border-indigo-500/60 rounded-2xl px-4 py-1.5 shadow-2xl flex items-center gap-3 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-indigo-300 font-black text-xs sm:text-sm uppercase tracking-wide">
              <span>WAVE {currentWave} / {totalWaves}</span>
              {waveTitle && <span className="text-stone-300 text-xs font-normal">({waveTitle})</span>}
            </div>
            <div className="h-4 w-px bg-stone-700" />
            {prepCountdown !== null && prepCountdown > 0 ? (
              <div className="text-amber-400 font-bold text-xs animate-bounce">
                ⚔️ Spawning in {prepCountdown}s...
              </div>
            ) : (
              <div className="text-rose-400 font-bold text-xs flex items-center gap-1">
                <span>Enemies:</span>
                <span className="text-white font-black">{enemiesRemaining}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Bar for Mobile Landscape */}
      {!isZenMode && (
        <header className="pointer-events-auto absolute top-2 inset-x-2 sm:inset-x-4 flex items-center justify-between gap-2 z-30">
          {/* Left: App Title Badge, Location & Following Pet Pill */}
          <div className="flex items-center gap-2">
            <div className="bg-emerald-950/85 border border-emerald-600/40 rounded-xl px-2.5 py-1.5 text-white shadow flex items-center gap-2">
              <span className="text-sm">{currentLocation === 'wild_grounds' ? '⚔️' : '🐾'}</span>
              <div>
                <h1 className="text-[11px] font-black tracking-wide text-emerald-300 leading-tight">
                  {currentLocation === 'wild_grounds' ? 'WILD GROUNDS' : 'PET HAVEN'}
                </h1>
                <div className="text-[9px] text-emerald-100/90 flex items-center gap-1.5 font-medium">
                  <span className="flex items-center gap-0.5">
                    <Calendar className="w-2.5 h-2.5 text-emerald-400" /> Day {player.day}
                  </span>
                  {currentLocation === 'farm' && (
                    <span
                      className={`px-1.5 py-0.2 rounded-md font-bold text-[8.5px] border ${
                        timePhase === 'morning'
                          ? 'bg-rose-950/80 text-rose-200 border-rose-500/40'
                          : timePhase === 'sunset'
                          ? 'bg-amber-950/80 text-amber-200 border-amber-500/40'
                          : timePhase === 'night'
                          ? 'bg-indigo-950/90 text-indigo-200 border-indigo-400/50'
                          : 'bg-sky-950/80 text-sky-200 border-sky-400/40'
                      }`}
                    >
                      {timePhase === 'morning'
                        ? '🌅 Morning'
                        : timePhase === 'sunset'
                        ? '🌇 Sunset'
                        : timePhase === 'night'
                        ? '🌙 Night'
                        : '☀️ Day'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Player Health Bar */}
            <div className="bg-stone-900/90 border border-stone-700 rounded-xl px-2.5 py-1 flex items-center gap-2 shadow">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
              <div className="flex flex-col">
                <div className="flex items-center justify-between text-[9px] font-bold text-rose-200">
                  <span>HP</span>
                  <span>{player.health ?? maxHealth}/{maxHealth}</span>
                </div>
                <div className="w-16 sm:w-20 h-1.5 bg-stone-950 rounded-full overflow-hidden border border-rose-950">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-300 rounded-full"
                    style={{ width: `${healthPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Following Pet Widget */}
            {followingPet && (
              <button
                onClick={onOpenPets}
                className="flex items-center gap-2 bg-amber-950/80 active:bg-amber-900 border border-amber-600/40 rounded-xl px-2.5 py-1 text-white shadow transition-all cursor-pointer"
              >
                <div
                  className="w-6 h-6 rounded-full border border-amber-300 flex items-center justify-center text-xs font-bold shadow-inner"
                  style={{ backgroundColor: followingPet.color }}
                >
                  {followingPet.name[0]}
                </div>
                <div className="text-left leading-none">
                  <div className="text-[10px] font-bold text-amber-200">{followingPet.name}</div>
                  <div className="flex items-center gap-1.5 text-[8px] text-amber-100/80 mt-0.5">
                    <span className="flex items-center gap-0.5 text-rose-300">
                      <Heart className="w-2 h-2 fill-rose-400 text-rose-400" /> {followingPet.happiness}%
                    </span>
                    <span>🍖 {followingPet.hunger}%</span>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Right: Currencies & Navigation Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Coins */}
            <div className="bg-amber-950/85 border border-amber-500/40 rounded-xl px-2.5 py-1 text-amber-300 font-bold text-xs flex items-center gap-1 shadow">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{player.gold}</span>
            </div>

            {/* Pet Essence Badge */}
            <button
              onClick={onOpenEssenceShop}
              className="bg-purple-950/85 hover:bg-purple-900/90 border border-purple-500/40 rounded-xl px-2.5 py-1 text-purple-300 font-bold text-xs flex items-center gap-1 shadow cursor-pointer transition-transform active:scale-95"
              title="Open Essence Sanctuary"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              <span>{player.petEssence || 0}</span>
            </button>

            {/* Fast Seed Shop Button (when on farm) */}
            {currentLocation === 'farm' && onOpenSeedShop && (
              <button
                onClick={onOpenSeedShop}
                className="bg-emerald-800/85 active:bg-emerald-700 text-emerald-200 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-emerald-500/40 shadow flex items-center gap-1 transition-transform active:scale-95 cursor-pointer"
                title="Barnaby's Seed Shop"
              >
                <span>🌱</span>
                <span>Seeds</span>
              </button>
            )}

            {/* Wild Grounds Leave Button */}
            {currentLocation === 'wild_grounds' && onLeaveInstance && (
              <button
                onClick={onLeaveInstance}
                className="bg-rose-800 active:bg-rose-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl border border-rose-500/40 shadow flex items-center gap-1 transition-transform active:scale-95 cursor-pointer"
              >
                <span>🏃 Return</span>
              </button>
            )}

            {/* Pets Sanctuary Button */}
            <button
              onClick={onOpenPets}
              className="bg-emerald-700 active:bg-emerald-600 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl border border-emerald-500/40 shadow flex items-center gap-1 transition-transform active:scale-95 cursor-pointer"
            >
              <span>🐾</span>
              <span>Pets</span>
            </button>

            {/* Bag Button */}
            <button
              onClick={onOpenInventory}
              className="bg-amber-700 active:bg-amber-600 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl border border-amber-500/40 shadow flex items-center gap-1 transition-transform active:scale-95 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Bag</span>
            </button>

            {/* Fullscreen Toggle Button */}
            <button
              onClick={onToggleFullscreen}
              className="bg-stone-850/80 active:bg-stone-750 text-amber-300 p-1.5 rounded-xl border border-amber-600/40 shadow transition-transform active:scale-95 cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="bg-stone-850/80 active:bg-stone-750 text-stone-200 p-1.5 rounded-xl border border-stone-600/40 shadow transition-transform active:scale-95 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Zen Mode Button */}
            <button
              onClick={onToggleZenMode}
              className="bg-stone-850/80 active:bg-stone-750 text-teal-300 p-1.5 rounded-xl border border-teal-600/40 shadow transition-transform active:scale-95 cursor-pointer"
              title="Zen Mode"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* Floating Near Interactable Prompt Banner (Centered Lower Middle) */}
      {nearInteractable && (
        <div className="pointer-events-auto absolute bottom-20 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={nearInteractable.action}
            className="bg-gradient-to-r from-amber-600 to-amber-500 active:from-amber-700 active:to-amber-600 text-white font-black text-xs sm:text-sm px-5 py-2 rounded-full shadow-2xl border-2 border-amber-200 flex items-center gap-2 active:scale-95 transition-transform cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-yellow-200 animate-spin" />
            <span>{nearInteractable.text}</span>
          </button>
        </div>
      )}

      {/* Bottom Dock: 5 Equipped Pet Skill Slots for Mobile Landscape */}
      <footer className="pointer-events-auto absolute bottom-2 inset-x-0 flex flex-col items-center justify-end z-30">
        {/* Zen Toggle Handle */}
        <button
          onClick={onToggleZenMode}
          className="mb-1 bg-stone-900/80 active:bg-stone-800 text-stone-300 text-[10px] font-bold px-3 py-0.5 rounded-full border border-stone-700/60 shadow flex items-center gap-1 cursor-pointer"
        >
          {isZenMode ? (
            <>
              <ChevronUp className="w-3 h-3" />
              <span>Show Skills</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              <span>Zen View</span>
            </>
          )}
        </button>

        {!isZenMode && (
          <div className="bg-stone-950/90 border border-amber-600/35 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1.5 sm:gap-2 max-w-[94vw] overflow-x-auto">
            {/* The 5 Skill Slots */}
            {[0, 1, 2, 3, 4].map((slotIndex) => {
              const pet = equippedPets[slotIndex];
              const skill = pet?.activeSkill;
              const cd = pet ? skillCooldowns[pet.id] || 0 : 0;
              const isCoolingDown = cd > 0;
              const IconComp = skill ? SKILL_ICONS[skill.icon] || Sparkles : null;

              return (
                <div key={slotIndex} className="relative">
                  <button
                    type="button"
                    disabled={pet ? isCoolingDown : false}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      if (pet) {
                        if (!isCoolingDown) onTriggerSkill(pet.id);
                      } else {
                        onOpenPets();
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (pet) {
                        if (!isCoolingDown) onTriggerSkill(pet.id);
                      } else {
                        onOpenPets();
                      }
                    }}
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-transform active:scale-90 cursor-pointer touch-manipulation ${
                      pet
                        ? isCoolingDown
                          ? 'bg-stone-900/95 border-stone-700 opacity-60'
                          : 'bg-stone-850 active:bg-amber-900/40 border-amber-500/80 shadow-md active:border-amber-300'
                        : 'bg-stone-900/60 border-dashed border-stone-700/80 opacity-50 active:opacity-90'
                    }`}
                  >
                    {pet && skill && IconComp ? (
                      <>
                        {/* Pet Color Tint Dot */}
                        <div
                          className="w-2 h-2 rounded-full absolute top-1 right-1 border border-white/40 shadow-sm"
                          style={{ backgroundColor: pet.color }}
                        />

                        {/* Skill Icon */}
                        <div className="text-amber-300">
                          <IconComp className="w-5 h-5" />
                        </div>

                        {/* Skill Name */}
                        <span className="text-[8px] font-black text-stone-200 truncate max-w-[42px] mt-0.5 leading-none">
                          {skill.name.split(' ')[0]}
                        </span>

                        {/* Cooldown Overlay */}
                        {isCoolingDown && (
                          <div className="absolute inset-0 bg-stone-950/85 rounded-xl flex items-center justify-center text-amber-400 font-black text-[11px]">
                            {cd.toFixed(0)}s
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-[9px] text-stone-500 font-bold">+</span>
                    )}
                  </button>

                  {/* Tooltip on Tap */}
                  {activeTooltip === pet?.id && pet && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 bg-stone-950/95 border border-amber-500/60 rounded-xl p-2 shadow-2xl text-left pointer-events-none z-50">
                      <div className="flex items-center justify-between pb-1 mb-1 border-b border-stone-800">
                        <span className="text-[11px] font-bold text-amber-300">{pet.name}</span>
                        <span className="text-[9px] bg-amber-900/60 text-amber-200 px-1 rounded">Lv.{pet.level}</span>
                      </div>
                      <div className="text-[10px] font-bold text-amber-200">⚡ {pet.activeSkill.name}</div>
                      <p className="text-[9px] text-stone-300 mb-1 leading-snug">{pet.activeSkill.description}</p>
                      <div className="text-[10px] font-bold text-emerald-300">🛡️ {pet.passiveSkill.name}</div>
                      <p className="text-[9px] text-stone-300 leading-snug">{pet.passiveSkill.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </footer>
    </div>
  );
};
