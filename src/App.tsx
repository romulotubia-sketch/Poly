import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameCanvas } from './game/GameCanvas';
import { HUD } from './components/HUD';
import { PetModal } from './components/PetModal';
import { InventoryModal } from './components/InventoryModal';
import { SettingsModal } from './components/SettingsModal';
import { MobileControls } from './components/MobileControls';
import { LandscapeNotice } from './components/LandscapeNotice';
import { SeedShopModal } from './components/SeedShopModal';
import { SeedPickerModal } from './components/SeedPickerModal';
import { PetEssenceShopModal } from './components/PetEssenceShopModal';
import { InstancePortalModal } from './components/InstancePortalModal';
import { InstanceResultModal } from './components/InstanceResultModal';
import { DuplicateNotificationModal } from './components/DuplicateNotificationModal';
import { PetData, FarmPlotState, PlayerStats, EssenceShopItem } from './types/game';
import { INITIAL_PETS, INITIAL_FARM_PLOTS, INITIAL_INVENTORY, DUPLICATE_ESSENCE_VALUES, CROPS } from './game/constants';
import { soundEngine } from './audio/soundEngine';
import { computeActiveSkillStats } from './game/combatSkills';
import { PortalTheme } from './game/portalSystem';
import { TimePhase } from './game/environmentSystem';

const SAVE_KEY = 'pet_haven_saved_game_v2';

interface InstanceResultData {
  isVictory: boolean;
  wavesCleared: number;
  totalWaves: number;
  essenceEarned: number;
  goldEarned: number;
  rewardPet: PetData | null;
  duplicateConverted: boolean;
  duplicateEssenceValue: number;
}

export default function App() {
  // --- GAME STATE ---
  const [player, setPlayer] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.player) {
          return {
            ...parsed.player,
            petEssence: parsed.player.petEssence ?? 0,
            health: parsed.player.health ?? 100,
            maxHealth: parsed.player.maxHealth ?? 100,
            highestWaveCleared: parsed.player.highestWaveCleared ?? 0,
            totalInstancesCleared: parsed.player.totalInstancesCleared ?? 0,
          };
        }
      }
    } catch {
      // ignore
    }
    return {
      gold: 60,
      petEssence: 15,
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      day: 1,
      dayTime: 0.25,
      farmExpansionLevel: 1,
      equippedSkillSlots: ['pet_fox', 'pet_turtle', 'pet_rabbit', 'pet_owl', 'pet_bear'],
      highestWaveCleared: 0,
      totalInstancesCleared: 0,
    };
  });

  const [pets, setPets] = useState<PetData[]>(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.pets && Array.isArray(parsed.pets)) {
          return INITIAL_PETS.map((init) => {
            const savedPet = parsed.pets.find((p: PetData) => p.id === init.id);
            if (savedPet) {
              return {
                ...init,
                ...savedPet,
                species: init.species,
                color: init.color,
                activeSkill: {
                  ...savedPet.activeSkill,
                  ...init.activeSkill,
                },
                passiveSkill: {
                  ...savedPet.passiveSkill,
                  ...init.passiveSkill,
                },
              };
            }
            return init;
          });
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_PETS;
  });

  const [farmPlots, setFarmPlots] = useState<FarmPlotState[]>(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.farmPlots && Array.isArray(parsed.farmPlots)) return parsed.farmPlots;
      }
    } catch {
      // ignore
    }
    return INITIAL_FARM_PLOTS;
  });

  const [inventory, setInventory] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.inventory) return parsed.inventory;
      }
    } catch {
      // ignore
    }
    return INITIAL_INVENTORY;
  });

  // Location State ('farm' or 'wild_grounds')
  const [currentLocation, setCurrentLocation] = useState<'farm' | 'wild_grounds'>('farm');
  const [portalTheme, setPortalTheme] = useState<PortalTheme>('normal');
  const [isWarpingTransition, setIsWarpingTransition] = useState<boolean>(false);

  // Instance wave tracking info
  const [waveInfo, setWaveInfo] = useState<{
    wave: number;
    title: string;
    enemiesRemaining: number;
    prepCountdown: number | null;
  }>({
    wave: 1,
    title: 'Shadow Slime Scout',
    enemiesRemaining: 3,
    prepCountdown: null,
  });

  // UI Modals & Views
  const [showPetModal, setShowPetModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSeedShopModal, setShowSeedShopModal] = useState(false);
  const [showSeedPickerModal, setShowSeedPickerModal] = useState(false);
  const [activePlotForSeedPicker, setActivePlotForSeedPicker] = useState<number | null>(null);
  const [showEssenceShopModal, setShowEssenceShopModal] = useState(false);
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [instanceResultData, setInstanceResultData] = useState<InstanceResultData | null>(null);

  // Duplicate pet conversion modal event
  const [duplicateEvent, setDuplicateEvent] = useState<{ pet: PetData; essenceEarned: number } | null>(null);

  const [isZenMode, setIsZenMode] = useState(false);
  const [messageToast, setMessageToast] = useState<string | null>('Welcome to Pet Haven! Use the left joystick to move.');

  // Fullscreen support
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
      if ('orientation' in screen && 'lock' in screen.orientation) {
        (screen.orientation.lock as (o: string) => Promise<void>)('landscape').catch(() => {});
      }
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Contextual Interaction Prompt from 3D world
  const [nearInteractable, setNearInteractable] = useState<{ text: string; action: () => void } | null>(null);

  // Mobile virtual joystick input vector
  const [joystickVector, setJoystickVector] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mobile Jump trigger and camera turning
  const [jumpCount, setJumpCount] = useState(0);
  const [camTurnDelta, setCamTurnDelta] = useState(0);

  // Skill Cooldowns (petId -> remaining seconds)
  const [skillCooldowns, setSkillCooldowns] = useState<Record<string, number>>({});

  // Skill Trigger to pass to GameCanvas
  const [skillCastTrigger, setSkillCastTrigger] = useState<{ petId: string; timestamp: number } | null>(null);

  // Toast message helper
  const toastTimeoutRef = useRef<number | null>(null);
  const showMessage = useCallback((text: string) => {
    setMessageToast(text);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setMessageToast(null);
    }, 3500);
  }, []);

  // Inventory Helper
  const handleAddInventory = useCallback((itemId: string, count: number) => {
    setInventory((prev) => {
      const current = prev[itemId] || 0;
      const nextCount = Math.max(0, current + count);
      const copy = { ...prev };
      if (nextCount === 0) {
        delete copy[itemId];
      } else {
        copy[itemId] = nextCount;
      }
      return copy;
    });
  }, []);

  // Save game to LocalStorage periodically
  useEffect(() => {
    const saveTimer = setInterval(() => {
      try {
        const payload = {
          version: 2,
          player,
          pets,
          farmPlots,
          inventory,
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      } catch {
        // storage quota or private mode
      }
    }, 5000);
    return () => clearInterval(saveTimer);
  }, [player, pets, farmPlots, inventory]);

  // Skill Cooldown decrement ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setSkillCooldowns((prev) => {
        let hasChanges = false;
        const next: Record<string, number> = {};
        for (const [id, remaining] of Object.entries(prev)) {
          if (remaining > 0.1) {
            next[id] = Math.max(0, remaining - 0.1);
            hasChanges = true;
          }
        }
        return hasChanges ? next : prev;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Triggering a Pet Skill
  const handleTriggerSkill = useCallback(
    (petId: string) => {
      const pet = pets.find((p) => p.id === petId);
      if (!pet) return;

      const currentCd = skillCooldowns[petId] || 0;
      if (currentCd > 0) {
        showMessage(`${pet.activeSkill.name} is on cooldown (${currentCd.toFixed(0)}s)`);
        return;
      }

      const skillStats = computeActiveSkillStats(pet.id, pet.level);
      const calculatedCd = skillStats.cooldown;

      setSkillCooldowns((prev) => ({
        ...prev,
        [petId]: calculatedCd,
      }));

      setSkillCastTrigger({
        petId,
        timestamp: Date.now(),
      });
    },
    [pets, skillCooldowns, showMessage]
  );

  // PET DUPLICATE CONVERSION LOGIC
  // If player already owns pet, automatically convert to Pet Essence and notify user!
  // Conversion values: Common: 5, Uncommon: 10, Rare: 25, Epic: 60, Legendary: 150, Mythical: 350
  const handleAwardPet = useCallback(
    (petId: string): { pet: PetData; isDuplicate: boolean; essenceEarned: number } => {
      const pet = pets.find((p) => p.id === petId);
      if (!pet) {
        const fallback = pets[0];
        return { pet: fallback, isDuplicate: false, essenceEarned: 0 };
      }

      if (pet.unlocked) {
        // DUPLICATE CONVERSION
        const essenceValue = DUPLICATE_ESSENCE_VALUES[pet.rarity] || 15;
        setPlayer((prev) => ({
          ...prev,
          petEssence: (prev.petEssence || 0) + essenceValue,
        }));
        setDuplicateEvent({ pet, essenceEarned: essenceValue });
        soundEngine.playBuySuccess();
        return { pet, isDuplicate: true, essenceEarned: essenceValue };
      } else {
        // NEW PET UNLOCKED
        setPets((prev) => prev.map((p) => (p.id === petId ? { ...p, unlocked: true } : p)));
        soundEngine.playLevelUp();
        showMessage(`🌟 New companion unlocked: ${pet.name} (${pet.rarity})!`);
        return { pet, isDuplicate: false, essenceEarned: 0 };
      }
    },
    [pets, showMessage]
  );

  // Purchasing seeds from Barnaby's Seed Stall
  const handleBuySeed = (seedKey: string, cost: number, count: number) => {
    setPlayer((prev) => ({ ...prev, gold: Math.max(0, prev.gold - cost) }));
    handleAddInventory(seedKey, count);
  };

  // Planting a seed chosen from SeedPickerModal
  const handlePlantSeed = (plotId: number, cropId: string) => {
    const seedKey = `seed_${cropId}`;
    if ((inventory[seedKey] || 0) <= 0) {
      showMessage(`You have no ${cropId} seeds!`);
      return;
    }

    handleAddInventory(seedKey, -1);
    setFarmPlots((prev) =>
      prev.map((plot) =>
        plot.id === plotId
          ? {
              ...plot,
              cropId,
              plantedAt: Date.now(),
              growProgress: 0.05,
              watered: true,
            }
          : plot
      )
    );
    soundEngine.playPlantSeed();
    const crop = CROPS[cropId];
    showMessage(`Planted ${crop?.name || cropId}! Watered soil.`);
  };

  // Purchasing items from Pet Essence Shop
  const handleBuyEssenceItem = (item: EssenceShopItem) => {
    setPlayer((prev) => ({ ...prev, petEssence: Math.max(0, prev.petEssence - item.cost) }));

    if (item.category === 'exp') {
      const activePet = pets.find((p) => p.isFollowing) || pets.find((p) => p.unlocked) || pets[0];
      const expAdd = item.id.includes('astral') ? 750 : item.id.includes('starfruit') ? 250 : 50;

      setPets((prev) =>
        prev.map((p) => {
          if (p.id === activePet.id) {
            const nextExp = p.exp + expAdd;
            if (nextExp >= p.maxExp) {
              soundEngine.playLevelUp();
              return {
                ...p,
                level: p.level + 1,
                exp: nextExp - p.maxExp,
                maxExp: Math.round(p.maxExp * 1.3),
                happiness: 100,
              };
            }
            return { ...p, exp: nextExp };
          }
          return p;
        })
      );
      showMessage(`Fed ${item.name} to ${activePet.name}! (+${expAdd} EXP)`);
    } else if (item.category === 'enhancement') {
      showMessage(`Empowered pets with ${item.name}! Abilities boosted.`);
    } else if (item.category === 'egg') {
      // Hatch a pet based on egg rarity
      let rollPool: PetData[];
      if (item.id.includes('prismatic')) {
        rollPool = pets.filter((p) => ['Rare', 'Epic', 'Legendary', 'Mythical'].includes(p.rarity));
      } else {
        rollPool = pets.filter((p) => ['Common', 'Uncommon', 'Rare', 'Epic'].includes(p.rarity));
      }
      const chosen = rollPool[Math.floor(Math.random() * rollPool.length)] || pets[0];
      handleAwardPet(chosen.id);
    }
  };

  // Entering Wild Grounds with Attuned Portal Theme
  const handleEnterInstance = (theme: PortalTheme = portalTheme) => {
    // 1. Save current farm state
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          player,
          pets,
          farmPlots,
          savedAt: Date.now(),
        })
      );
    } catch (e) {
      console.warn('Failed to save farm state before entering instance', e);
    }

    setPortalTheme(theme);
    setShowPortalModal(false);
    setIsWarpingTransition(true);
    soundEngine.playPortalWarp();

    // Smooth transition sequence avoiding abrupt scene changes
    window.setTimeout(() => {
      setCurrentLocation('wild_grounds');
      setPlayer((prev) => ({ ...prev, health: prev.maxHealth || 100 }));

      window.setTimeout(() => {
        setIsWarpingTransition(false);
      }, 350);
    }, 450);
  };

  // Returning to Farm from Wild Grounds
  const handleReturnToFarm = () => {
    // Save state before leaving
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          player,
          pets,
          farmPlots,
          savedAt: Date.now(),
        })
      );
    } catch (e) {
      console.warn('Failed to save state on leaving instance', e);
    }

    setIsWarpingTransition(true);
    soundEngine.playPortalWarp();

    window.setTimeout(() => {
      setCurrentLocation('farm');
      setShowResultModal(false);
      setInstanceResultData(null);

      window.setTimeout(() => {
        setIsWarpingTransition(false);
      }, 350);
    }, 450);
  };

  // Instance Victory Handler
  const handleInstanceVictory = (res: { wavesCleared: number; essenceEarned: number; goldEarned: number }) => {
    setPlayer((prev) => ({
      ...prev,
      highestWaveCleared: 10,
      totalInstancesCleared: (prev.totalInstancesCleared || 0) + 1,
    }));

    // Guaranteed random pet reward!
    const rollablePets = pets;
    const randomPet = rollablePets[Math.floor(Math.random() * rollablePets.length)];
    const awardResult = handleAwardPet(randomPet.id);

    setInstanceResultData({
      isVictory: true,
      wavesCleared: 10,
      totalWaves: 10,
      essenceEarned: res.essenceEarned,
      goldEarned: res.goldEarned,
      rewardPet: awardResult.pet,
      duplicateConverted: awardResult.isDuplicate,
      duplicateEssenceValue: awardResult.essenceEarned,
    });
    setShowResultModal(true);
  };

  // Instance Defeat Handler
  const handleInstanceDefeat = (res: { wavesCleared: number; essenceEarned: number; goldEarned: number }) => {
    setInstanceResultData({
      isVictory: false,
      wavesCleared: res.wavesCleared,
      totalWaves: 10,
      essenceEarned: res.essenceEarned,
      goldEarned: res.goldEarned,
      rewardPet: null,
      duplicateConverted: false,
      duplicateEssenceValue: 0,
    });
    setShowResultModal(true);
  };

  // Reset Game
  const handleResetGame = () => {
    localStorage.removeItem(SAVE_KEY);
    setPlayer({
      gold: 60,
      petEssence: 15,
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      day: 1,
      dayTime: 0.25,
      farmExpansionLevel: 1,
      equippedSkillSlots: ['pet_fox', 'pet_turtle', 'pet_rabbit', 'pet_owl', 'pet_bear'],
      highestWaveCleared: 0,
      totalInstancesCleared: 0,
    });
    setPets(INITIAL_PETS);
    setFarmPlots(INITIAL_FARM_PLOTS);
    setInventory(INITIAL_INVENTORY);
    setSkillCooldowns({});
    setShowSettingsModal(false);
    setCurrentLocation('farm');
    showMessage('Farm reset to Day 1! Welcome back.');
  };

  // Start music on first touch/tap
  const handleUserInteract = () => {
    soundEngine.startAmbientMusic();
  };

  return (
    <div
      onClick={handleUserInteract}
      onTouchStart={handleUserInteract}
      className="relative w-full h-full overflow-hidden bg-sky-200 select-none font-sans"
    >
      {/* Landscape Orientation Guidance Overlay */}
      <LandscapeNotice onEnterFullscreen={toggleFullscreen} isFullscreen={isFullscreen} />

      {/* 3D WebGL Canvas Viewport */}
      <GameCanvas
        player={player}
        pets={pets}
        farmPlots={farmPlots}
        onUpdatePlots={setFarmPlots}
        onUpdatePlayer={setPlayer}
        onUpdatePets={setPets}
        onAddInventory={handleAddInventory}
        onShowMessage={showMessage}
        joystickInput={joystickVector}
        skillCastTrigger={skillCastTrigger}
        onSkillCastHandled={() => setSkillCastTrigger(null)}
        onNearInteractableChange={setNearInteractable}
        isZenMode={isZenMode}
        jumpCount={jumpCount}
        camTurnDelta={camTurnDelta}
        currentLocation={currentLocation}
        onWaveInfoChange={setWaveInfo}
        onInstanceVictory={handleInstanceVictory}
        onInstanceDefeat={handleInstanceDefeat}
        onOpenSeedShop={() => setShowSeedShopModal(true)}
        onOpenPortalModal={() => setShowPortalModal(true)}
        onOpenSeedPicker={(plotId) => {
          setActivePlotForSeedPicker(plotId);
          setShowSeedPickerModal(true);
        }}
        portalTheme={portalTheme}
        isWarping={isWarpingTransition}
      />

      {/* Main HUD overlay with 5 equipped skill slots and top bar */}
      <HUD
        player={player}
        pets={pets}
        onTriggerSkill={handleTriggerSkill}
        skillCooldowns={skillCooldowns}
        nearInteractable={nearInteractable}
        onOpenPets={() => setShowPetModal(true)}
        onOpenInventory={() => setShowInventoryModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenSeedShop={() => setShowSeedShopModal(true)}
        onOpenEssenceShop={() => setShowEssenceShopModal(true)}
        onLeaveInstance={handleReturnToFarm}
        currentLocation={currentLocation}
        currentWave={waveInfo.wave}
        waveTitle={waveInfo.title}
        totalWaves={10}
        enemiesRemaining={waveInfo.enemiesRemaining}
        prepCountdown={waveInfo.prepCountdown}
        isZenMode={isZenMode}
        onToggleZenMode={() => setIsZenMode((prev) => !prev)}
        messageToast={messageToast}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Mobile touch controls (Virtual Joystick, Action & Jump buttons, Camera turning) */}
      <MobileControls
        onJoystickMove={setJoystickVector}
        onJump={() => setJumpCount((c) => c + 1)}
        onInteract={() => {
          if (nearInteractable) {
            nearInteractable.action();
          }
        }}
        onCamTurn={setCamTurnDelta}
        hasInteractable={Boolean(nearInteractable)}
        isZenMode={isZenMode}
      />

      {/* MODALS */}
      {showPetModal && (
        <PetModal
          pets={pets}
          player={player}
          onClose={() => setShowPetModal(false)}
          onUpdatePets={setPets}
          onUpdatePlayer={setPlayer}
          onShowMessage={showMessage}
        />
      )}

      {showInventoryModal && (
        <InventoryModal
          inventory={inventory}
          player={player}
          onClose={() => setShowInventoryModal(false)}
          onAddInventory={handleAddInventory}
          onUpdatePlayer={setPlayer}
          onShowMessage={showMessage}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          onResetGame={handleResetGame}
          onShowMessage={showMessage}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      {/* Seed Shop Modal */}
      {showSeedShopModal && (
        <SeedShopModal
          player={player}
          inventory={inventory}
          onClose={() => setShowSeedShopModal(false)}
          onBuySeed={handleBuySeed}
          onShowMessage={showMessage}
        />
      )}

      {/* Seed Picker Modal */}
      {showSeedPickerModal && activePlotForSeedPicker !== null && (
        <SeedPickerModal
          plotId={activePlotForSeedPicker}
          inventory={inventory}
          onClose={() => {
            setShowSeedPickerModal(false);
            setActivePlotForSeedPicker(null);
          }}
          onSelectSeed={handlePlantSeed}
          onOpenSeedShop={() => {
            setShowSeedPickerModal(false);
            setShowSeedShopModal(true);
          }}
        />
      )}

      {/* Pet Essence Shop Modal */}
      {showEssenceShopModal && (
        <PetEssenceShopModal
          player={player}
          pets={pets}
          onClose={() => setShowEssenceShopModal(false)}
          onBuyItem={handleBuyEssenceItem}
          onShowMessage={showMessage}
        />
      )}

      {/* Wild Grounds Portal Entrance Modal */}
      {showPortalModal && (
        <InstancePortalModal
          player={player}
          currentTheme={portalTheme}
          onSelectTheme={setPortalTheme}
          onClose={() => setShowPortalModal(false)}
          onEnterInstance={handleEnterInstance}
        />
      )}

      {/* Dimensional Portal Warp Transition Overlay */}
      {isWarpingTransition && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center transition-all duration-300">
          <div
            className={`absolute inset-0 animate-pulse ${
              portalTheme === 'special'
                ? 'bg-amber-950/70'
                : portalTheme === 'expert'
                ? 'bg-rose-950/70'
                : portalTheme === 'advanced'
                ? 'bg-purple-950/70'
                : 'bg-sky-950/70'
            } backdrop-blur-md`}
          />
          <div className="relative flex flex-col items-center gap-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin flex items-center justify-center shadow-[0_0_50px_rgba(56,189,248,0.8)]">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-purple-400 border-b-transparent animate-spin duration-700 shadow-inner" />
            </div>
            <div className="text-center space-y-1">
              <span className="text-xs sm:text-sm font-black tracking-widest text-white uppercase drop-shadow-md">
                Dimensional Rift Transition
              </span>
              <p className="text-[11px] text-indigo-200 font-semibold">
                {currentLocation === 'farm' ? 'Entering Wild Grounds...' : 'Returning to Pet Haven Farm...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instance Victory / Defeat Result Modal */}
      {showResultModal && instanceResultData && (
        <InstanceResultModal
          isVictory={instanceResultData.isVictory}
          wavesCleared={instanceResultData.wavesCleared}
          totalWaves={instanceResultData.totalWaves}
          essenceEarned={instanceResultData.essenceEarned}
          goldEarned={instanceResultData.goldEarned}
          rewardPet={instanceResultData.rewardPet}
          duplicateConverted={instanceResultData.duplicateConverted}
          duplicateEssenceValue={instanceResultData.duplicateEssenceValue}
          onRetry={() => {
            setShowResultModal(false);
            handleEnterInstance();
          }}
          onReturnToFarm={handleReturnToFarm}
        />
      )}

      {/* Duplicate Pet Conversion Notification Popup */}
      {duplicateEvent && (
        <DuplicateNotificationModal
          pet={duplicateEvent.pet}
          essenceEarned={duplicateEvent.essenceEarned}
          onClose={() => setDuplicateEvent(null)}
        />
      )}
    </div>
  );
}
