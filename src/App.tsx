import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameCanvas } from './game/GameCanvas';
import { HUD } from './components/HUD';
import { PetModal } from './components/PetModal';
import { InventoryModal } from './components/InventoryModal';
import { SettingsModal } from './components/SettingsModal';
import { MobileControls } from './components/MobileControls';
import { SeedShopModal } from './components/SeedShopModal';
import { SeedPickerModal } from './components/SeedPickerModal';
import { PetEssenceShopModal } from './components/PetEssenceShopModal';
import { InstancePortalModal } from './components/InstancePortalModal';
import { InstanceResultModal } from './components/InstanceResultModal';
import { DuplicateNotificationModal } from './components/DuplicateNotificationModal';
import { NourishmentModal } from './components/NourishmentModal';
import { PetInteractionModal } from './components/PetInteractionModal';
import { MissionBoardModal } from './components/MissionBoardModal';
import {
  PetData,
  FarmPlotState,
  PlayerStats,
  EssenceShopItem,
  GraphicsQuality,
  PerformanceStatsData,
  MissionBoardState,
  MissionEventType,
  MissionPeriod,
  MissionReward,
} from './types/game';
import { INITIAL_PETS, INITIAL_FARM_PLOTS, INITIAL_INVENTORY, DUPLICATE_ESSENCE_VALUES, CROPS, INITIAL_NOURISHMENT, NOURISHMENT_CONFIGS } from './game/constants';
import { soundEngine } from './audio/soundEngine';
import { computeActiveSkillStats } from './game/combatSkills';
import { PortalTheme } from './game/portalSystem';
import { TimePhase } from './game/environmentSystem';
import {
  loadAndSyncMissions,
  syncMissionsWithClock,
  applyMissionEvent,
  saveMissionState,
  getUnclaimedMissionRewardsCount,
} from './game/missions';

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
            nourishment: parsed.player.nourishment
              ? { ...INITIAL_NOURISHMENT, ...parsed.player.nourishment }
              : INITIAL_NOURISHMENT,
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
      nourishment: INITIAL_NOURISHMENT,
    };
  });

  const [pets, setPets] = useState<PetData[]>(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.pets && Array.isArray(parsed.pets)) {
          const defaultEquipped = ['pet_fox', 'pet_turtle', 'pet_rabbit', 'pet_owl', 'pet_bear'];
          const equippedSlots: string[] = parsed.player?.equippedSkillSlots || defaultEquipped;
          return INITIAL_PETS.map((init) => {
            const savedPet = parsed.pets.find((p: PetData) => p.id === init.id);
            if (savedPet) {
              const isUnlocked = savedPet.unlocked ?? init.unlocked;
              const shouldFollow = isUnlocked && equippedSlots.includes(init.id);
              return {
                ...init,
                ...savedPet,
                unlocked: isUnlocked,
                isFollowing: shouldFollow,
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

  // Location State ('farm', 'wild_grounds', or 'pet_den')
  const [currentLocation, setCurrentLocation] = useState<'farm' | 'wild_grounds' | 'pet_den'>('farm');
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
  const [showNourishmentModal, setShowNourishmentModal] = useState(false);
  const [interactingPetId, setInteractingPetId] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSeedShopModal, setShowSeedShopModal] = useState(false);
  const [showSeedPickerModal, setShowSeedPickerModal] = useState(false);
  const [activePlotForSeedPicker, setActivePlotForSeedPicker] = useState<number | null>(null);
  const [showEssenceShopModal, setShowEssenceShopModal] = useState(false);
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [instanceResultData, setInstanceResultData] = useState<InstanceResultData | null>(null);
  const [showMissionModal, setShowMissionModal] = useState(false);

  // Daily & Weekly Mission System State
  const initialMissionSyncRef = useRef<{ dailyRefreshed: boolean; weeklyRefreshed: boolean }>({
    dailyRefreshed: false,
    weeklyRefreshed: false,
  });
  const [missionState, setMissionState] = useState<MissionBoardState>(() => {
    const loaded = loadAndSyncMissions(Date.now());
    initialMissionSyncRef.current = {
      dailyRefreshed: loaded.dailyRefreshed,
      weeklyRefreshed: loaded.weeklyRefreshed,
    };
    return loaded.state;
  });
  const missionStateRef = useRef<MissionBoardState>(missionState);
  missionStateRef.current = missionState;

  const [missionToast, setMissionToast] = useState<string | null>(null);
  const missionToastTimeoutRef = useRef<number | null>(null);
  const showMissionToast = useCallback((text: string) => {
    setMissionToast(text);
    if (missionToastTimeoutRef.current) clearTimeout(missionToastTimeoutRef.current);
    missionToastTimeoutRef.current = window.setTimeout(() => {
      setMissionToast(null);
    }, 3600);
  }, []);

  // Duplicate pet conversion modal event
  const [duplicateEvent, setDuplicateEvent] = useState<{ pet: PetData; essenceEarned: number } | null>(null);

  const [isZenMode, setIsZenMode] = useState(false);
  const [messageToast, setMessageToast] = useState<string | null>('Welcome to Pet Haven! Tap empty space to spawn the movement joystick.');

  // Graphics Quality & Performance Monitoring
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>(() => {
    try {
      const saved = localStorage.getItem('pet_haven_graphics_quality');
      if (saved === 'low' || saved === 'medium' || saved === 'high') return saved;
    } catch {
      // ignore
    }
    return 'medium';
  });

  const [showPerfStats, setShowPerfStats] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pet_haven_show_perf_stats') === 'true';
    } catch {
      // ignore
    }
    return false;
  });

  const [perfStats, setPerfStats] = useState<PerformanceStatsData | null>(null);

  const handleSelectQuality = useCallback((q: GraphicsQuality) => {
    setGraphicsQuality(q);
    try {
      localStorage.setItem('pet_haven_graphics_quality', q);
    } catch {
      // ignore
    }
  }, []);

  const handleTogglePerfStats = useCallback(() => {
    setShowPerfStats((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pet_haven_show_perf_stats', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const [cameraAngleDeg, setCameraAngleDeg] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pet_haven_camera_angle_v2_deg');
      if (saved) {
        const parsed = Number(saved);
        if (!Number.isNaN(parsed)) {
          return Math.max(35, Math.min(82, Math.round(parsed)));
        }
      }
    } catch {
      // ignore
    }
    return 62;
  });

  const handleChangeCameraAngleDeg = useCallback((deg: number) => {
    const clamped = Math.max(35, Math.min(82, Math.round(deg)));
    setCameraAngleDeg(clamped);
    try {
      localStorage.setItem('pet_haven_camera_angle_v2_deg', String(clamped));
    } catch {
      // ignore
    }
  }, []);

  // Fullscreen support (defaults to portrait orientation)
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
      if ('orientation' in screen && 'lock' in screen.orientation) {
        (screen.orientation.lock as (o: string) => Promise<void>)('portrait').catch(() => {});
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

  // Mobile Jump trigger
  const [jumpCount, setJumpCount] = useState(0);

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

  // Time Phase state for day/night HUD display
  const [timePhase, setTimePhase] = useState<'morning' | 'day' | 'sunset' | 'night'>('day');

  // Auto Hunt Mode State for Wild Grounds
  const [isAutoHunt, setIsAutoHunt] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pet_haven_auto_hunt') === 'true';
    } catch {
      return false;
    }
  });

  const [playerTargetInfo, setPlayerTargetInfo] = useState<{ id: string; name: string; hpRatio: number; maxHealth?: number; health?: number } | null>(null);
  const [petsEngagedCount, setPetsEngagedCount] = useState<number>(0);

  const handleToggleAutoHunt = useCallback(() => {
    setIsAutoHunt((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pet_haven_auto_hunt', String(next));
      } catch {
        // ignore
      }
      showMessage(next ? '⚔️ Auto Hunt Activated! Player and pets are engaging enemies!' : '🛡️ Auto Hunt Deactivated. Manual control restored.');
      return next;
    });
  }, [showMessage]);

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

  // Mission System: Event Tracking, UTC+8 Resets, Playtime, & Manual Reward Claiming
  const syncMissionClock = useCallback(() => {
    const res = syncMissionsWithClock(missionStateRef.current, Date.now());
    if (res.dailyRefreshed || res.weeklyRefreshed) {
      missionStateRef.current = res.state;
      setMissionState(res.state);
      if (res.weeklyRefreshed && res.dailyRefreshed) {
        showMissionToast('Daily & Weekly Missions Reset! New objectives ready.');
      } else if (res.weeklyRefreshed) {
        showMissionToast('Weekly Missions Reset! New weekly objectives ready.');
      } else {
        showMissionToast('Daily Missions Reset! New daily objectives ready.');
      }
    }
    return res.state;
  }, [showMissionToast]);

  const recordMissionEvent = useCallback(
    (eventType: MissionEventType, amount: number = 1, trackKey?: string) => {
      const currentSynced = syncMissionClock();
      const { nextState, newlyCompleted, newlyUnlockedMilestones } = applyMissionEvent(
        currentSynced,
        eventType,
        amount,
        trackKey ? { trackKey } : undefined
      );

      if (nextState !== currentSynced) {
        missionStateRef.current = nextState;
        setMissionState(nextState);
        saveMissionState(nextState);
      }

      if (newlyUnlockedMilestones.length > 0) {
        const ms = newlyUnlockedMilestones[0];
        showMissionToast(`Milestone Unlocked: ${ms.title}! Open Missions to claim.`);
      } else if (newlyCompleted.length > 0) {
        const first = newlyCompleted[0];
        showMissionToast(`Mission Complete: ${first.title}! Open Missions to claim.`);
      }
    },
    [syncMissionClock, showMissionToast]
  );

  const grantMissionReward = useCallback(
    (reward: MissionReward) => {
      // Grant Gold and Pet Essence directly (do NOT emit earn_coins for mission rewards)
      if ((reward.gold && reward.gold > 0) || (reward.petEssence && reward.petEssence > 0)) {
        setPlayer((prev) => ({
          ...prev,
          gold: prev.gold + (reward.gold || 0),
          petEssence: (prev.petEssence || 0) + (reward.petEssence || 0),
        }));
      }
      if (reward.seeds && reward.seeds.length > 0) {
        for (const seed of reward.seeds) {
          if (seed.count > 0) {
            handleAddInventory(seed.seedKey, seed.count);
          }
        }
      }
    },
    [handleAddInventory]
  );

  const handleClaimMission = useCallback(
    (missionId: string, period: MissionPeriod) => {
      const current = syncMissionClock();
      const list = period === 'daily' ? current.dailyMissions : current.weeklyMissions;
      const target = list.find((m) => m.id === missionId);
      if (!target || !target.completed || target.claimed) return;

      const updatedList = list.map((m) => (m.id === missionId ? { ...m, claimed: true } : m));
      const nextState: MissionBoardState =
        period === 'daily'
          ? { ...current, dailyMissions: updatedList }
          : { ...current, weeklyMissions: updatedList };

      missionStateRef.current = nextState;
      setMissionState(nextState);
      saveMissionState(nextState);
      grantMissionReward(target.reward);
      soundEngine.playBuySuccess();
      showMissionToast(`Claimed reward for "${target.title}"!`);
    },
    [syncMissionClock, grantMissionReward, showMissionToast]
  );

  const handleClaimMilestone = useCallback(
    (milestoneId: string, period: MissionPeriod) => {
      const current = syncMissionClock();
      const completedCount =
        period === 'daily'
          ? current.dailyMissions.filter((m) => m.completed).length
          : current.weeklyMissions.filter((m) => m.completed).length;

      const list = period === 'daily' ? current.dailyMilestones : current.weeklyMilestones;
      const target = list.find((ms) => ms.id === milestoneId);
      if (!target || target.claimed || completedCount < target.requiredCount) return;

      const updatedList = list.map((ms) => (ms.id === milestoneId ? { ...ms, claimed: true } : ms));
      const nextState: MissionBoardState =
        period === 'daily'
          ? { ...current, dailyMilestones: updatedList }
          : { ...current, weeklyMilestones: updatedList };

      missionStateRef.current = nextState;
      setMissionState(nextState);
      saveMissionState(nextState);
      grantMissionReward(target.reward);
      soundEngine.playLevelUp();
      showMissionToast(`Claimed Milestone: ${target.title}!`);
    },
    [syncMissionClock, grantMissionReward, showMissionToast]
  );

  // Show startup refresh notice if UTC+8 reset happened while offline
  useEffect(() => {
    const { dailyRefreshed, weeklyRefreshed } = initialMissionSyncRef.current;
    if (dailyRefreshed && weeklyRefreshed) {
      showMissionToast('Daily & Weekly Missions Refreshed!');
    } else if (weeklyRefreshed) {
      showMissionToast('Weekly Missions Refreshed!');
    } else if (dailyRefreshed) {
      showMissionToast('Daily Missions Refreshed!');
    }
  }, [showMissionToast]);

  // Periodically check UTC+8 Daily/Weekly reset boundaries every 10s
  useEffect(() => {
    const resetCheckTimer = window.setInterval(() => {
      syncMissionClock();
    }, 10000);
    return () => window.clearInterval(resetCheckTimer);
  }, [syncMissionClock]);

  // Active Playtime Tracker (1 minute intervals while tab is visible)
  useEffect(() => {
    const playtimeTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        recordMissionEvent('play_time_minute', 1);
      }
    }, 60000);
    return () => window.clearInterval(playtimeTimer);
  }, [recordMissionEvent]);

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
              isHarvested: false,
            }
          : plot
      )
    );
    soundEngine.playPlantSeed();
    const crop = CROPS[cropId];
    showMessage(`Planted ${crop?.name || cropId}! Watered soil.`);
    recordMissionEvent('plant_seed', 1, cropId);
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
      recordMissionEvent('gain_pet_exp', expAdd);
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
          version: 2,
          player,
          pets,
          farmPlots,
          inventory,
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
          version: 2,
          player,
          pets,
          farmPlots,
          inventory,
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

  // Permanent Character Nourishment Consumption Handler
  const handleConsumeCrop = useCallback(
    (cropId: string, count: number = 1) => {
      const available = inventory[cropId] || 0;
      if (available < count || count <= 0) {
        showMessage('You do not have enough crops to consume.');
        return;
      }

      const cfg = NOURISHMENT_CONFIGS[cropId];
      if (!cfg) return;

      const currentBonuses = player.nourishment || INITIAL_NOURISHMENT;
      const currentVal = currentBonuses[cfg.statKey] ?? 0;

      // Calculate how many can actually be consumed before hitting the cap
      const remainingCapacity = Math.max(0, cfg.maxBonus - currentVal);
      const bonusPerItem = cfg.bonusPerCrop;
      const maxPossibleToConsume = Math.min(count, Math.ceil(remainingCapacity / bonusPerItem));

      if (remainingCapacity <= 0 || maxPossibleToConsume <= 0) {
        showMessage(`Your ${cfg.statName} bonus is already at the maximum capacity (+${cfg.maxBonus}${cfg.unit})!`);
        return;
      }

      const actualConsumeCount = Math.min(count, maxPossibleToConsume);
      const addedBonus = Number(Math.min(remainingCapacity, actualConsumeCount * bonusPerItem).toFixed(2));
      const nextVal = Number(Math.min(cfg.maxBonus, currentVal + addedBonus).toFixed(2));

      // Remove crops from inventory
      handleAddInventory(cropId, -actualConsumeCount);

      // Apply bonus immediately to player stats
      setPlayer((prev) => {
        const prevNourish = prev.nourishment || INITIAL_NOURISHMENT;
        const prevCountForCrop =
          prevNourish.consumedCounts?.[cropId] ??
          (cfg.consumedKey ? prevNourish[cfg.consumedKey] : 0) ??
          0;
        const nextNourishment = {
          ...prevNourish,
          [cfg.statKey]: nextVal,
          consumedCounts: {
            ...(prevNourish.consumedCounts || {}),
            [cropId]: prevCountForCrop + actualConsumeCount,
          },
          ...(cfg.consumedKey
            ? { [cfg.consumedKey]: (prevNourish[cfg.consumedKey] || 0) + actualConsumeCount }
            : {}),
        };

        const updated: PlayerStats = {
          ...prev,
          nourishment: nextNourishment,
        };

        // If crop boosts Max HP (Sweet Carrot, Watermelon, Crystal Fruit), increase maxHealth and restore health accordingly
        if (cfg.statKey === 'maxHpBonus') {
          const newMaxHealth = Number((100 + nextVal).toFixed(1));
          updated.maxHealth = newMaxHealth;
          updated.health = Math.min(newMaxHealth, (prev.health || 100) + addedBonus);
        }

        return updated;
      });

      soundEngine.playBuySuccess();
      showMessage(
        `Nourished! Consumed ${actualConsumeCount}x ${cfg.name} (+${addedBonus}${cfg.unit} ${cfg.statName})! Total bonus: +${nextVal}${cfg.unit}`
      );
    },
    [inventory, player.nourishment, handleAddInventory, showMessage]
  );

  // Enter Pet Den (Sanctuary)
  const handleEnterPetDen = useCallback(() => {
    recordMissionEvent('visit_pet_den', 1);
    setIsWarpingTransition(true);
    soundEngine.playPortalWarp();
    window.setTimeout(() => {
      setCurrentLocation('pet_den');
      window.setTimeout(() => {
        setIsWarpingTransition(false);
      }, 350);
    }, 450);
  }, [recordMissionEvent]);

  // Leave Pet Den back to Farm
  const handleLeavePetDen = useCallback(() => {
    setIsWarpingTransition(true);
    soundEngine.playPortalWarp();
    window.setTimeout(() => {
      setCurrentLocation('farm');
      window.setTimeout(() => {
        setIsWarpingTransition(false);
      }, 350);
    }, 450);
  }, []);

  // Feed Pet from Interaction Modal
  const handleFeedPetFromInteraction = useCallback(
    (petId: string, cropId: string) => {
      const available = inventory[cropId] || 0;
      if (available <= 0) {
        showMessage('You do not have any of this crop to feed!');
        return;
      }

      handleAddInventory(cropId, -1);
      soundEngine.playHarvest();

      const rarityExpMap: Record<string, number> = {
        Common: 25,
        Uncommon: 35,
        Rare: 50,
        Epic: 65,
        Legendary: 80,
        Mythical: 95,
      };
      const cropDef = CROPS[cropId];
      const addedExp = cropId === 'pet_treat' ? 35 : cropDef ? rarityExpMap[cropDef.rarity] || 30 : 30;
      const foodLabel = cropId === 'pet_treat' ? 'Pet Treat' : cropDef?.name || cropId;

      setPets((prev) =>
        prev.map((pet) => {
          if (pet.id === petId) {
            const newExp = pet.exp + addedExp;
            let newLevel = pet.level;
            let newMaxExp = pet.maxExp;
            let remainingExp = newExp;

            if (newExp >= pet.maxExp) {
              newLevel += 1;
              remainingExp = newExp - pet.maxExp;
              newMaxExp = Math.round(pet.maxExp * 1.3);
              soundEngine.playLevelUp();
              showMessage(`✨ ${pet.name} leveled up to Lv ${newLevel}!`);
            } else {
              showMessage(`Fed ${pet.name} fresh ${foodLabel}! (+${addedExp} EXP, +Happiness)`);
            }

            return {
              ...pet,
              level: newLevel,
              exp: remainingExp,
              maxExp: newMaxExp,
              happiness: Math.min(100, pet.happiness + 25),
              hunger: Math.min(100, pet.hunger + 35),
            };
          }
          return pet;
        })
      );
      recordMissionEvent('feed_pet', 1);
      recordMissionEvent('interact_pet', 1, petId);
      recordMissionEvent('gain_pet_exp', addedExp);
    },
    [inventory, handleAddInventory, showMessage, recordMissionEvent]
  );

  // Pet the Pet from Interaction Modal
  const handlePetPetFromInteraction = useCallback(
    (petId: string) => {
      const pet = pets.find((p) => p.id === petId);
      if (!pet) return;

      soundEngine.playPetJoy();
      setPets((prev) =>
        prev.map((p) => {
          if (p.id === petId) {
            const addedExp = 15;
            const newExp = p.exp + addedExp;
            let newLevel = p.level;
            let newMaxExp = p.maxExp;
            let remainingExp = newExp;

            if (newExp >= p.maxExp) {
              newLevel += 1;
              remainingExp = newExp - p.maxExp;
              newMaxExp = Math.round(p.maxExp * 1.3);
              soundEngine.playLevelUp();
              showMessage(`✨ ${p.name} leveled up to Lv ${newLevel}!`);
            } else {
              showMessage(`Gave loving pats to ${p.name}! (+Affection)`);
            }

            return {
              ...p,
              level: newLevel,
              exp: remainingExp,
              maxExp: newMaxExp,
              happiness: Math.min(100, p.happiness + 20),
            };
          }
          return p;
        })
      );
      recordMissionEvent('interact_pet', 1, petId);
      recordMissionEvent('gain_pet_exp', 15);
    },
    [pets, showMessage, recordMissionEvent]
  );

  // Ensure pets.isFollowing always strictly matches unlocked status and player.equippedSkillSlots
  useEffect(() => {
    const equippedSet = new Set(player.equippedSkillSlots.filter(Boolean) as string[]);
    setPets((prev) => {
      let changed = false;
      const next = prev.map((p) => {
        const shouldFollow = p.unlocked && equippedSet.has(p.id);
        if (p.isFollowing !== shouldFollow) {
          changed = true;
          return { ...p, isFollowing: shouldFollow };
        }
        return p;
      });
      return changed ? next : prev;
    });
  }, [player.equippedSkillSlots, pets]);

  // Toggle Following from Interaction Modal (synchronizes equipped skill slots)
  const handleToggleFollowFromInteraction = useCallback(
    (petId: string) => {
      const pet = pets.find((p) => p.id === petId);
      if (!pet) return;

      const isEquipped = player.equippedSkillSlots.includes(petId);
      let nextSlots = [...player.equippedSkillSlots];

      if (isEquipped) {
        nextSlots = nextSlots.map((id) => (id === petId ? null : id));
        showMessage(`${pet.name} returned to resting at the Pet Den.`);
      } else {
        const emptyIdx = nextSlots.indexOf(null);
        if (emptyIdx !== -1) {
          nextSlots[emptyIdx] = petId;
        } else {
          nextSlots[nextSlots.length - 1] = petId;
        }
        showMessage(`${pet.name} is now equipped and following you!`);
      }

      setPlayer((prev) => ({ ...prev, equippedSkillSlots: nextSlots }));
      soundEngine.playBuySuccess();
    },
    [pets, player.equippedSkillSlots, showMessage]
  );

  // Instance Victory Handler
  const handleInstanceVictory = (res: { wavesCleared: number; essenceEarned: number; goldEarned: number }) => {
    setPlayer((prev) => ({
      ...prev,
      highestWaveCleared: 10,
      totalInstancesCleared: (prev.totalInstancesCleared || 0) + 1,
    }));
    recordMissionEvent('complete_instance', 1);

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
      nourishment: INITIAL_NOURISHMENT,
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
        currentLocation={currentLocation}
        onWaveInfoChange={setWaveInfo}
        onInstanceVictory={handleInstanceVictory}
        onInstanceDefeat={handleInstanceDefeat}
        onOpenSeedShop={() => setShowSeedShopModal(true)}
        onOpenPortalModal={() => setShowPortalModal(true)}
        onEnterPetDen={handleEnterPetDen}
        onLeavePetDen={handleLeavePetDen}
        onOpenPetInteraction={(petId) => setInteractingPetId(petId)}
        onOpenSeedPicker={(plotId) => {
          setActivePlotForSeedPicker(plotId);
          setShowSeedPickerModal(true);
        }}
        portalTheme={portalTheme}
        isWarping={isWarpingTransition}
        graphicsQuality={graphicsQuality}
        onPerfStatsChange={setPerfStats}
        onTimePhaseChange={(phase) => setTimePhase(phase)}
        isAutoHunt={isAutoHunt}
        onToggleAutoHunt={handleToggleAutoHunt}
        onPlayerTargetChange={setPlayerTargetInfo}
        onPetsEngagedChange={setPetsEngagedCount}
        skillCooldowns={skillCooldowns}
        onTriggerSkill={handleTriggerSkill}
        onMissionEvent={recordMissionEvent}
        cameraAngleDeg={cameraAngleDeg}
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
        onOpenNourishment={() => setShowNourishmentModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenSeedShop={() => setShowSeedShopModal(true)}
        onOpenEssenceShop={() => setShowEssenceShopModal(true)}
        onLeaveInstance={handleReturnToFarm}
        onEnterPetDen={handleEnterPetDen}
        onLeavePetDen={handleLeavePetDen}
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
        timePhase={timePhase}
        perfStats={perfStats}
        showPerfStats={showPerfStats}
        graphicsQuality={graphicsQuality}
        isAutoHunt={isAutoHunt}
        onToggleAutoHunt={handleToggleAutoHunt}
        playerTargetInfo={playerTargetInfo}
        petsEngagedCount={petsEngagedCount}
        onOpenMissions={() => {
          syncMissionClock();
          setShowMissionModal(true);
        }}
        unclaimedMissionCount={getUnclaimedMissionRewardsCount(missionState)}
        missionToast={missionToast}
      />

      {/* Mobile touch controls (Tap-anywhere Floating Joystick, Action & Jump buttons) */}
      <MobileControls
        onJoystickMove={setJoystickVector}
        onJump={() => setJumpCount((c) => c + 1)}
        onInteract={() => {
          if (nearInteractable) {
            nearInteractable.action();
          }
        }}
        hasInteractable={Boolean(nearInteractable)}
        isZenMode={isZenMode}
        isModalOpen={Boolean(
          showPetModal ||
            showInventoryModal ||
            showNourishmentModal ||
            interactingPetId ||
            showSettingsModal ||
            showSeedShopModal ||
            showSeedPickerModal ||
            showEssenceShopModal ||
            showPortalModal ||
            showResultModal ||
            showMissionModal ||
            duplicateEvent
        )}
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
          onEnterPetDen={handleEnterPetDen}
          onMissionEvent={recordMissionEvent}
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
          onConsumeCrop={handleConsumeCrop}
          onMissionEvent={recordMissionEvent}
        />
      )}

      {/* Daily & Weekly Mission Board Modal */}
      {showMissionModal && (
        <MissionBoardModal
          missionState={missionState}
          onClose={() => setShowMissionModal(false)}
          onClaimMission={handleClaimMission}
          onClaimMilestone={handleClaimMilestone}
        />
      )}

      {/* Permanent Character Nourishment Modal */}
      {showNourishmentModal && (
        <NourishmentModal
          player={player}
          inventory={inventory}
          onClose={() => setShowNourishmentModal(false)}
          onConsumeCrop={handleConsumeCrop}
        />
      )}

      {/* 3D Pet Interaction Dialog Modal */}
      {interactingPetId && pets.find((p) => p.id === interactingPetId) && (
        <PetInteractionModal
          pet={pets.find((p) => p.id === interactingPetId)!}
          player={player}
          inventory={inventory}
          onClose={() => setInteractingPetId(null)}
          onFeedPet={handleFeedPetFromInteraction}
          onPetPet={handlePetPetFromInteraction}
          onToggleFollow={handleToggleFollowFromInteraction}
          onOpenFullInfo={() => {
            setInteractingPetId(null);
            setShowPetModal(true);
          }}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          onResetGame={handleResetGame}
          onShowMessage={showMessage}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          graphicsQuality={graphicsQuality}
          onSelectQuality={handleSelectQuality}
          showPerfStats={showPerfStats}
          onTogglePerfStats={handleTogglePerfStats}
          cameraAngleDeg={cameraAngleDeg}
          onChangeCameraAngleDeg={handleChangeCameraAngleDeg}
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
                {currentLocation === 'pet_den'
                  ? 'Entering Pet Sanctuary (Pet Den)...'
                  : currentLocation === 'wild_grounds'
                  ? 'Entering Wild Grounds...'
                  : 'Returning to Pet Haven Farm...'}
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
