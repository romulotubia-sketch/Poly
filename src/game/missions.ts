import {
  MilestoneState,
  MissionBoardState,
  MissionCategory,
  MissionDifficulty,
  MissionEventType,
  MissionInstance,
  MissionPeriod,
  MissionReward,
} from '../types/game';

export const MISSIONS_SAVE_KEY = 'pet_haven_missions_v1';
export const PH_OFFSET_MS = 8 * 60 * 60 * 1000; // UTC+8 (Philippine Standard Time)

export interface MissionTemplate {
  templateId: string;
  period: MissionPeriod;
  category: MissionCategory;
  difficulty: MissionDifficulty;
  title: string;
  description: string;
  eventType: MissionEventType;
  uniqueTrackKey?: boolean;
  target: number;
  reward: MissionReward;
}

export const DAILY_MISSION_TEMPLATES: MissionTemplate[] = [
  // Farming
  {
    templateId: 'daily_harvest_5',
    period: 'daily',
    category: 'farming',
    difficulty: 'easy',
    title: 'Morning Harvest',
    description: 'Harvest 5 ripe crops from your farm plots.',
    eventType: 'harvest_crop',
    target: 5,
    reward: {
      gold: 50,
      seeds: [{ seedKey: 'seed_carrot', name: 'Sweet Carrot Seed', count: 2, icon: '🥕' }],
    },
  },
  {
    templateId: 'daily_harvest_10',
    period: 'daily',
    category: 'farming',
    difficulty: 'medium',
    title: 'Bountiful Fields',
    description: 'Harvest 10 ripe crops from your farm.',
    eventType: 'harvest_crop',
    target: 10,
    reward: {
      gold: 100,
      seeds: [{ seedKey: 'seed_tomato', name: 'Juicy Tomato Seed', count: 2, icon: '🍅' }],
    },
  },
  {
    templateId: 'daily_plant_5',
    period: 'daily',
    category: 'farming',
    difficulty: 'easy',
    title: 'Green Thumb',
    description: 'Plant 5 seeds in tilled farm plots.',
    eventType: 'plant_seed',
    target: 5,
    reward: {
      gold: 50,
      seeds: [{ seedKey: 'seed_strawberry', name: 'Sugar Berry Seed', count: 2, icon: '🍓' }],
    },
  },
  {
    templateId: 'daily_farm_coins_100',
    period: 'daily',
    category: 'farming',
    difficulty: 'medium',
    title: 'Market Day',
    description: 'Collect 100 coins from harvesting or selling crops.',
    eventType: 'earn_farm_coins',
    target: 100,
    reward: {
      gold: 100,
      petEssence: 5,
    },
  },
  {
    templateId: 'daily_plant_variety_3',
    period: 'daily',
    category: 'farming',
    difficulty: 'medium',
    title: 'Botanical Variety',
    description: 'Plant 3 different types of seeds in your garden.',
    eventType: 'plant_seed',
    uniqueTrackKey: true,
    target: 3,
    reward: {
      gold: 95,
      petEssence: 6,
      seeds: [{ seedKey: 'seed_pineapple', name: 'Pineapple Seed', count: 1, icon: '🍍' }],
    },
  },

  // Pet
  {
    templateId: 'daily_feed_3',
    period: 'daily',
    category: 'pet',
    difficulty: 'easy',
    title: 'Treat Time',
    description: 'Feed your pets 3 times.',
    eventType: 'feed_pet',
    target: 3,
    reward: {
      gold: 50,
      petEssence: 5,
    },
  },
  {
    templateId: 'daily_visit_den',
    period: 'daily',
    category: 'pet',
    difficulty: 'easy',
    title: 'Sanctuary Check-In',
    description: 'Visit the Pet Den Sanctuary.',
    eventType: 'visit_pet_den',
    target: 1,
    reward: {
      gold: 50,
      petEssence: 5,
    },
  },
  {
    templateId: 'daily_interact_3_pets',
    period: 'daily',
    category: 'pet',
    difficulty: 'medium',
    title: 'Beloved Caretaker',
    description: 'Interact with (feed or pet) 3 different pets.',
    eventType: 'interact_pet',
    uniqueTrackKey: true,
    target: 3,
    reward: {
      gold: 100,
      petEssence: 8,
    },
  },
  {
    templateId: 'daily_pet_exp_500',
    period: 'daily',
    category: 'pet',
    difficulty: 'hard',
    title: 'Companion Training',
    description: 'Earn 500 total pet experience across your pets.',
    eventType: 'gain_pet_exp',
    target: 500,
    reward: {
      gold: 150,
      petEssence: 10,
    },
  },

  // Wild Grounds
  {
    templateId: 'daily_defeat_15',
    period: 'daily',
    category: 'wild_grounds',
    difficulty: 'medium',
    title: 'Wild Patroller',
    description: 'Defeat 15 enemies in Wild Grounds.',
    eventType: 'defeat_enemy',
    target: 15,
    reward: {
      gold: 100,
      petEssence: 8,
    },
  },
  {
    templateId: 'daily_waves_2',
    period: 'daily',
    category: 'wild_grounds',
    difficulty: 'easy',
    title: 'Wave Breaker',
    description: 'Complete 2 Wild Grounds waves.',
    eventType: 'complete_wave',
    target: 2,
    reward: {
      gold: 60,
      petEssence: 6,
    },
  },
  {
    templateId: 'daily_elite_1',
    period: 'daily',
    category: 'wild_grounds',
    difficulty: 'medium',
    title: 'Elite Hunter',
    description: 'Defeat 1 elite enemy (Golem or Boss) in Wild Grounds.',
    eventType: 'defeat_elite',
    target: 1,
    reward: {
      gold: 110,
      petEssence: 10,
    },
  },
  {
    templateId: 'daily_instance_1',
    period: 'daily',
    category: 'wild_grounds',
    difficulty: 'hard',
    title: 'Rift Conqueror',
    description: 'Complete 1 full Wild Grounds instance (all 10 waves).',
    eventType: 'complete_instance',
    target: 1,
    reward: {
      gold: 150,
      petEssence: 12,
      seeds: [{ seedKey: 'seed_pumpkin', name: 'Harvest Pumpkin Seed', count: 1, icon: '🎃' }],
    },
  },

  // General
  {
    templateId: 'daily_coins_100',
    period: 'daily',
    category: 'general',
    difficulty: 'easy',
    title: 'Coin Collector',
    description: 'Collect 100 coins from farming, trading, or combat.',
    eventType: 'earn_coins',
    target: 100,
    reward: {
      gold: 50,
      seeds: [{ seedKey: 'seed_carrot', name: 'Sweet Carrot Seed', count: 2, icon: '🥕' }],
    },
  },
  {
    templateId: 'daily_play_10',
    period: 'daily',
    category: 'general',
    difficulty: 'medium',
    title: 'Haven Devotion',
    description: 'Spend 10 active minutes playing Pet Haven.',
    eventType: 'play_time_minute',
    target: 10,
    reward: {
      gold: 100,
      petEssence: 6,
    },
  },
  {
    templateId: 'daily_complete_3_missions',
    period: 'daily',
    category: 'general',
    difficulty: 'hard',
    title: 'Daily Achiever',
    description: 'Complete 3 other missions today.',
    eventType: 'complete_mission',
    target: 3,
    reward: {
      gold: 150,
      petEssence: 10,
      seeds: [{ seedKey: 'seed_corn', name: 'Golden Corn Seed', count: 1, icon: '🌽' }],
    },
  },
];

export const WEEKLY_MISSION_TEMPLATES: MissionTemplate[] = [
  // Farming
  {
    templateId: 'weekly_harvest_50',
    period: 'weekly',
    category: 'farming',
    difficulty: 'medium',
    title: 'Grand Harvester',
    description: 'Harvest 50 crops across the week.',
    eventType: 'harvest_crop',
    target: 50,
    reward: {
      gold: 500,
      petEssence: 25,
    },
  },
  {
    templateId: 'weekly_plant_30',
    period: 'weekly',
    category: 'farming',
    difficulty: 'easy',
    title: 'Seed Sower',
    description: 'Plant 30 seeds on your farm.',
    eventType: 'plant_seed',
    target: 30,
    reward: {
      gold: 300,
      seeds: [{ seedKey: 'seed_strawberry', name: 'Sugar Berry Seed', count: 4, icon: '🍓' }],
    },
  },
  {
    templateId: 'weekly_harvest_10_plots',
    period: 'weekly',
    category: 'farming',
    difficulty: 'medium',
    title: 'Full Acreage',
    description: 'Harvest from 10 different crop plots.',
    eventType: 'harvest_crop',
    uniqueTrackKey: true,
    target: 10,
    reward: {
      gold: 450,
      petEssence: 20,
      seeds: [{ seedKey: 'seed_lavender', name: 'Lavender Seed', count: 2, icon: '🪻' }],
    },
  },

  // Pet
  {
    templateId: 'weekly_feed_15',
    period: 'weekly',
    category: 'pet',
    difficulty: 'easy',
    title: 'Feast Provider',
    description: 'Feed your pets 15 times.',
    eventType: 'feed_pet',
    target: 15,
    reward: {
      gold: 300,
      petEssence: 15,
    },
  },
  {
    templateId: 'weekly_pet_exp_5000',
    period: 'weekly',
    category: 'pet',
    difficulty: 'hard',
    title: 'Master Trainer',
    description: 'Gain 5,000 total pet experience.',
    eventType: 'gain_pet_exp',
    target: 5000,
    reward: {
      gold: 950,
      petEssence: 45,
      seeds: [{ seedKey: 'seed_pumpkin', name: 'Harvest Pumpkin Seed', count: 2, icon: '🎃' }],
    },
  },
  {
    templateId: 'weekly_interact_20',
    period: 'weekly',
    category: 'pet',
    difficulty: 'medium',
    title: 'Deep Bond',
    description: 'Interact with pets (feed or pet) 20 times.',
    eventType: 'interact_pet',
    target: 20,
    reward: {
      gold: 500,
      petEssence: 25,
    },
  },

  // Wild Grounds
  {
    templateId: 'weekly_defeat_150',
    period: 'weekly',
    category: 'wild_grounds',
    difficulty: 'hard',
    title: 'Guardian of the Haven',
    description: 'Defeat 150 enemies in Wild Grounds.',
    eventType: 'defeat_enemy',
    target: 150,
    reward: {
      gold: 1000,
      petEssence: 50,
      seeds: [{ seedKey: 'seed_pumpkin', name: 'Harvest Pumpkin Seed', count: 3, icon: '🎃' }],
    },
  },
  {
    templateId: 'weekly_instances_10',
    period: 'weekly',
    category: 'wild_grounds',
    difficulty: 'hard',
    title: 'Rift Champion',
    description: 'Complete 10 Wild Grounds instances.',
    eventType: 'complete_instance',
    target: 10,
    reward: {
      gold: 1000,
      petEssence: 50,
      seeds: [{ seedKey: 'seed_corn', name: 'Golden Corn Seed', count: 3, icon: '🌽' }],
    },
  },
  {
    templateId: 'weekly_elites_5',
    period: 'weekly',
    category: 'wild_grounds',
    difficulty: 'medium',
    title: 'Colossus Slayer',
    description: 'Defeat 5 elite enemies in Wild Grounds.',
    eventType: 'defeat_elite',
    target: 5,
    reward: {
      gold: 550,
      petEssence: 30,
    },
  },
  {
    templateId: 'weekly_bosses_3',
    period: 'weekly',
    category: 'wild_grounds',
    difficulty: 'hard',
    title: 'Titan Vanquisher',
    description: 'Defeat 3 bosses in Wild Grounds.',
    eventType: 'defeat_boss',
    target: 3,
    reward: {
      gold: 900,
      petEssence: 45,
      seeds: [{ seedKey: 'seed_starfruit', name: 'Starfruit Seed', count: 2, icon: '🌟' }],
    },
  },

  // General
  {
    templateId: 'weekly_coins_5000',
    period: 'weekly',
    category: 'general',
    difficulty: 'hard',
    title: 'Haven Tycoon',
    description: 'Earn 5,000 coins across the week.',
    eventType: 'earn_coins',
    target: 5000,
    reward: {
      gold: 1000,
      petEssence: 50,
    },
  },
  {
    templateId: 'weekly_daily_missions_20',
    period: 'weekly',
    category: 'general',
    difficulty: 'medium',
    title: 'Consistent Caretaker',
    description: 'Complete 20 daily missions.',
    eventType: 'complete_daily_mission',
    target: 20,
    reward: {
      gold: 550,
      petEssence: 30,
      seeds: [{ seedKey: 'seed_corn', name: 'Golden Corn Seed', count: 3, icon: '🌽' }],
    },
  },
  {
    templateId: 'weekly_play_120',
    period: 'weekly',
    category: 'general',
    difficulty: 'medium',
    title: 'Dedicated Rancher',
    description: 'Play Pet Haven for 120 active minutes this week.',
    eventType: 'play_time_minute',
    target: 120,
    reward: {
      gold: 500,
      petEssence: 25,
    },
  },
];

export const DAILY_MILESTONE_DEFS: Omit<MilestoneState, 'claimed'>[] = [
  {
    id: 'daily_milestone_2',
    period: 'daily',
    requiredCount: 2,
    title: '2 Daily Missions',
    reward: { gold: 100 },
  },
  {
    id: 'daily_milestone_4',
    period: 'daily',
    requiredCount: 4,
    title: '4 Daily Missions',
    reward: { petEssence: 15 },
  },
  {
    id: 'daily_milestone_5',
    period: 'daily',
    requiredCount: 5,
    title: 'All 5 Daily Missions',
    reward: {
      gold: 200,
      petEssence: 25,
      seeds: [{ seedKey: 'seed_pumpkin', name: 'Harvest Pumpkin Seed', count: 2, icon: '🎃' }],
    },
  },
];

export const WEEKLY_MILESTONE_DEFS: Omit<MilestoneState, 'claimed'>[] = [
  {
    id: 'weekly_milestone_3',
    period: 'weekly',
    requiredCount: 3,
    title: '3 Weekly Missions',
    reward: { gold: 300 },
  },
  {
    id: 'weekly_milestone_5',
    period: 'weekly',
    requiredCount: 5,
    title: '5 Weekly Missions',
    reward: { petEssence: 50 },
  },
  {
    id: 'weekly_milestone_7',
    period: 'weekly',
    requiredCount: 7,
    title: 'All 7 Weekly Missions',
    reward: {
      gold: 750,
      petEssence: 75,
      seeds: [
        { seedKey: 'seed_pumpkin', name: 'Harvest Pumpkin Seed', count: 5, icon: '🎃' },
        { seedKey: 'seed_corn', name: 'Golden Corn Seed', count: 5, icon: '🌽' },
      ],
    },
  },
];

// Deterministic hash & seeded PRNG for consistent daily/weekly selection per reset key
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createRng(seedStr: string): () => number {
  let state = hashSeed(seedStr) || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function instantiateMission(tpl: MissionTemplate, keyPrefix: string): MissionInstance {
  return {
    id: `${keyPrefix}_${tpl.templateId}`,
    templateId: tpl.templateId,
    period: tpl.period,
    category: tpl.category,
    difficulty: tpl.difficulty,
    title: tpl.title,
    description: tpl.description,
    eventType: tpl.eventType,
    uniqueTrackKey: tpl.uniqueTrackKey,
    trackedKeys: tpl.uniqueTrackKey ? [] : undefined,
    target: tpl.target,
    progress: 0,
    completed: false,
    claimed: false,
    reward: tpl.reward,
  };
}

export function getPhilippineDateKey(nowMs: number = Date.now()): string {
  const phDate = new Date(nowMs + PH_OFFSET_MS);
  const y = phDate.getUTCFullYear();
  const m = String(phDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(phDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getPhilippineMondayKey(nowMs: number = Date.now()): string {
  const phDate = new Date(nowMs + PH_OFFSET_MS);
  const day = phDate.getUTCDay(); // 0=Sun, 1=Mon, ... 6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const mondayUtcMs = Date.UTC(
    phDate.getUTCFullYear(),
    phDate.getUTCMonth(),
    phDate.getUTCDate() + diffToMonday
  );
  const monDate = new Date(mondayUtcMs);
  const y = monDate.getUTCFullYear();
  const m = String(monDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(monDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getNextDailyResetMs(nowMs: number = Date.now()): number {
  const phDate = new Date(nowMs + PH_OFFSET_MS);
  const nextMidnightPhAsUtc = Date.UTC(
    phDate.getUTCFullYear(),
    phDate.getUTCMonth(),
    phDate.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
  return nextMidnightPhAsUtc - PH_OFFSET_MS;
}

export function getNextWeeklyResetMs(nowMs: number = Date.now()): number {
  const phDate = new Date(nowMs + PH_OFFSET_MS);
  const day = phDate.getUTCDay(); // 0=Sun, 1=Mon...
  const daysUntilNextMonday = day === 0 ? 1 : 8 - day;
  const nextMondayPhAsUtc = Date.UTC(
    phDate.getUTCFullYear(),
    phDate.getUTCMonth(),
    phDate.getUTCDate() + daysUntilNextMonday,
    0,
    0,
    0,
    0
  );
  return nextMondayPhAsUtc - PH_OFFSET_MS;
}

export function formatCountdownMs(ms: number): string {
  const clamped = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(clamped / 86400);
  const hours = Math.floor((clamped % 86400) / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

export function generateDailyMissions(dailyKey: string): MissionInstance[] {
  const rng = createRng(`daily_${dailyKey}`);
  const categories: MissionCategory[] = ['farming', 'pet', 'wild_grounds', 'general'];
  const picked: MissionTemplate[] = [];
  const usedIds = new Set<string>();
  const usedEventTypes = new Set<string>();

  // Guarantee 1 mission from each of the 4 categories
  for (const cat of categories) {
    const candidates = shuffleWithRng(
      DAILY_MISSION_TEMPLATES.filter((t) => t.category === cat),
      rng
    );
    const chosen = candidates[0];
    if (chosen) {
      picked.push(chosen);
      usedIds.add(chosen.templateId);
      usedEventTypes.add(chosen.eventType);
    }
  }

  // Pick 5th mission from remaining pool, preferring a new eventType for variety
  const remaining = shuffleWithRng(
    DAILY_MISSION_TEMPLATES.filter((t) => !usedIds.has(t.templateId)),
    rng
  );
  const fifth = remaining.find((t) => !usedEventTypes.has(t.eventType)) || remaining[0];
  if (fifth) {
    picked.push(fifth);
  }

  return picked.slice(0, 5).map((tpl) => instantiateMission(tpl, `d_${dailyKey}`));
}

export function generateWeeklyMissions(weeklyKey: string): MissionInstance[] {
  const rng = createRng(`weekly_${weeklyKey}`);
  const categories: MissionCategory[] = ['farming', 'pet', 'wild_grounds', 'general'];
  const picked: MissionTemplate[] = [];
  const usedIds = new Set<string>();
  const categoryCounts: Record<MissionCategory, number> = {
    farming: 0,
    pet: 0,
    wild_grounds: 0,
    general: 0,
  };

  // Guarantee 1 mission from each of the 4 categories
  for (const cat of categories) {
    const candidates = shuffleWithRng(
      WEEKLY_MISSION_TEMPLATES.filter((t) => t.category === cat),
      rng
    );
    const chosen = candidates[0];
    if (chosen) {
      picked.push(chosen);
      usedIds.add(chosen.templateId);
      categoryCounts[cat] += 1;
    }
  }

  // Fill remaining 3 slots (to total 7) keeping category spread balanced (<= 2 per category first)
  const remaining = shuffleWithRng(
    WEEKLY_MISSION_TEMPLATES.filter((t) => !usedIds.has(t.templateId)),
    rng
  );

  for (const cand of remaining) {
    if (picked.length >= 7) break;
    if (categoryCounts[cand.category] < 2) {
      picked.push(cand);
      usedIds.add(cand.templateId);
      categoryCounts[cand.category] += 1;
    }
  }

  for (const cand of remaining) {
    if (picked.length >= 7) break;
    if (!usedIds.has(cand.templateId)) {
      picked.push(cand);
      usedIds.add(cand.templateId);
    }
  }

  return picked.slice(0, 7).map((tpl) => instantiateMission(tpl, `w_${weeklyKey}`));
}

export function createInitialDailyMilestones(): MilestoneState[] {
  return DAILY_MILESTONE_DEFS.map((m) => ({ ...m, claimed: false }));
}

export function createInitialWeeklyMilestones(): MilestoneState[] {
  return WEEKLY_MILESTONE_DEFS.map((m) => ({ ...m, claimed: false }));
}

export function saveMissionState(state: MissionBoardState): void {
  try {
    localStorage.setItem(MISSIONS_SAVE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

export function loadAndSyncMissions(nowMs: number = Date.now()): {
  state: MissionBoardState;
  dailyRefreshed: boolean;
  weeklyRefreshed: boolean;
} {
  const todayKey = getPhilippineDateKey(nowMs);
  const weekKey = getPhilippineMondayKey(nowMs);

  let existing: Partial<MissionBoardState> | null = null;
  try {
    const raw = localStorage.getItem(MISSIONS_SAVE_KEY);
    if (raw) {
      existing = JSON.parse(raw);
    }
  } catch {
    existing = null;
  }

  const hasValidDaily =
    existing &&
    existing.lastDailyResetKey === todayKey &&
    Array.isArray(existing.dailyMissions) &&
    existing.dailyMissions.length === 5 &&
    Array.isArray(existing.dailyMilestones) &&
    existing.dailyMilestones.length === DAILY_MILESTONE_DEFS.length;

  const hasValidWeekly =
    existing &&
    existing.lastWeeklyResetKey === weekKey &&
    Array.isArray(existing.weeklyMissions) &&
    existing.weeklyMissions.length === 7 &&
    Array.isArray(existing.weeklyMilestones) &&
    existing.weeklyMilestones.length === WEEKLY_MILESTONE_DEFS.length;

  const dailyRefreshed = Boolean(existing && !hasValidDaily);
  const weeklyRefreshed = Boolean(existing && !hasValidWeekly);

  const state: MissionBoardState = {
    version: 1,
    dailyMissions: hasValidDaily ? existing!.dailyMissions! : generateDailyMissions(todayKey),
    weeklyMissions: hasValidWeekly ? existing!.weeklyMissions! : generateWeeklyMissions(weekKey),
    dailyMilestones: hasValidDaily ? existing!.dailyMilestones! : createInitialDailyMilestones(),
    weeklyMilestones: hasValidWeekly ? existing!.weeklyMilestones! : createInitialWeeklyMilestones(),
    lastDailyResetKey: todayKey,
    lastWeeklyResetKey: weekKey,
    lastDailyResetAt: hasValidDaily ? existing!.lastDailyResetAt || nowMs : nowMs,
    lastWeeklyResetAt: hasValidWeekly ? existing!.lastWeeklyResetAt || nowMs : nowMs,
  };

  if (!existing || dailyRefreshed || weeklyRefreshed) {
    saveMissionState(state);
  }

  return { state, dailyRefreshed, weeklyRefreshed };
}

export function syncMissionsWithClock(
  current: MissionBoardState,
  nowMs: number = Date.now()
): { state: MissionBoardState; dailyRefreshed: boolean; weeklyRefreshed: boolean } {
  const todayKey = getPhilippineDateKey(nowMs);
  const weekKey = getPhilippineMondayKey(nowMs);

  const dailyNeedsReset = current.lastDailyResetKey !== todayKey;
  const weeklyNeedsReset = current.lastWeeklyResetKey !== weekKey;

  if (!dailyNeedsReset && !weeklyNeedsReset) {
    return { state: current, dailyRefreshed: false, weeklyRefreshed: false };
  }

  const nextState: MissionBoardState = {
    ...current,
    dailyMissions: dailyNeedsReset ? generateDailyMissions(todayKey) : current.dailyMissions,
    dailyMilestones: dailyNeedsReset ? createInitialDailyMilestones() : current.dailyMilestones,
    lastDailyResetKey: todayKey,
    lastDailyResetAt: dailyNeedsReset ? nowMs : current.lastDailyResetAt,
    weeklyMissions: weeklyNeedsReset ? generateWeeklyMissions(weekKey) : current.weeklyMissions,
    weeklyMilestones: weeklyNeedsReset ? createInitialWeeklyMilestones() : current.weeklyMilestones,
    lastWeeklyResetKey: weekKey,
    lastWeeklyResetAt: weeklyNeedsReset ? nowMs : current.lastWeeklyResetAt,
  };

  saveMissionState(nextState);
  return { state: nextState, dailyRefreshed: dailyNeedsReset, weeklyRefreshed: weeklyNeedsReset };
}

function advanceMissionList(
  list: MissionInstance[],
  eventType: MissionEventType,
  amount: number,
  trackKey?: string
): { updated: MissionInstance[]; newlyCompleted: MissionInstance[] } {
  const newlyCompleted: MissionInstance[] = [];
  const updated = list.map((mission) => {
    if (mission.completed || mission.eventType !== eventType) {
      return mission;
    }

    let nextProgress = mission.progress;
    let nextTrackedKeys = mission.trackedKeys;

    if (mission.uniqueTrackKey) {
      if (!trackKey) return mission;
      const existingKeys = mission.trackedKeys || [];
      if (existingKeys.includes(trackKey)) {
        return mission;
      }
      nextTrackedKeys = [...existingKeys, trackKey];
      nextProgress = Math.min(mission.target, nextTrackedKeys.length);
    } else {
      nextProgress = Math.min(mission.target, mission.progress + amount);
    }

    if (nextProgress === mission.progress) {
      return mission;
    }

    const nowCompleted = nextProgress >= mission.target;
    const nextMission: MissionInstance = {
      ...mission,
      progress: nextProgress,
      trackedKeys: nextTrackedKeys,
      completed: nowCompleted,
    };

    if (nowCompleted) {
      newlyCompleted.push(nextMission);
    }
    return nextMission;
  });

  return { updated, newlyCompleted };
}

export function applyMissionEvent(
  state: MissionBoardState,
  eventType: MissionEventType,
  amount: number = 1,
  meta?: { trackKey?: string }
): {
  nextState: MissionBoardState;
  newlyCompleted: MissionInstance[];
  newlyUnlockedMilestones: MilestoneState[];
} {
  if (amount <= 0) {
    return { nextState: state, newlyCompleted: [], newlyUnlockedMilestones: [] };
  }

  const prevDailyCompletedCount = state.dailyMissions.filter((m) => m.completed).length;
  const prevWeeklyCompletedCount = state.weeklyMissions.filter((m) => m.completed).length;

  const dailyRes = advanceMissionList(state.dailyMissions, eventType, amount, meta?.trackKey);
  const weeklyRes = advanceMissionList(state.weeklyMissions, eventType, amount, meta?.trackKey);

  let nextDaily = dailyRes.updated;
  let nextWeekly = weeklyRes.updated;
  const newlyCompleted: MissionInstance[] = [...dailyRes.newlyCompleted, ...weeklyRes.newlyCompleted];

  // Propagate mission completion meta-events (without infinite recursion)
  const completedDailyNow = dailyRes.newlyCompleted.length;
  const completedAnyNow = newlyCompleted.filter((m) => m.eventType !== 'complete_mission').length;

  if (completedDailyNow > 0 && eventType !== 'complete_daily_mission') {
    const dMeta = advanceMissionList(nextDaily, 'complete_daily_mission', completedDailyNow);
    const wMeta = advanceMissionList(nextWeekly, 'complete_daily_mission', completedDailyNow);
    nextDaily = dMeta.updated;
    nextWeekly = wMeta.updated;
    newlyCompleted.push(...dMeta.newlyCompleted, ...wMeta.newlyCompleted);
  }

  if (completedAnyNow > 0 && eventType !== 'complete_mission') {
    const dMeta = advanceMissionList(nextDaily, 'complete_mission', completedAnyNow);
    const wMeta = advanceMissionList(nextWeekly, 'complete_mission', completedAnyNow);
    nextDaily = dMeta.updated;
    nextWeekly = wMeta.updated;
    newlyCompleted.push(...dMeta.newlyCompleted, ...wMeta.newlyCompleted);
  }

  const nextDailyCompletedCount = nextDaily.filter((m) => m.completed).length;
  const nextWeeklyCompletedCount = nextWeekly.filter((m) => m.completed).length;

  const newlyUnlockedMilestones: MilestoneState[] = [];
  for (const ms of state.dailyMilestones) {
    if (!ms.claimed && prevDailyCompletedCount < ms.requiredCount && nextDailyCompletedCount >= ms.requiredCount) {
      newlyUnlockedMilestones.push(ms);
    }
  }
  for (const ms of state.weeklyMilestones) {
    if (!ms.claimed && prevWeeklyCompletedCount < ms.requiredCount && nextWeeklyCompletedCount >= ms.requiredCount) {
      newlyUnlockedMilestones.push(ms);
    }
  }

  if (
    nextDaily === state.dailyMissions &&
    nextWeekly === state.weeklyMissions &&
    newlyCompleted.length === 0
  ) {
    return { nextState: state, newlyCompleted: [], newlyUnlockedMilestones: [] };
  }

  const nextState: MissionBoardState = {
    ...state,
    dailyMissions: nextDaily,
    weeklyMissions: nextWeekly,
  };

  return { nextState, newlyCompleted, newlyUnlockedMilestones };
}

export function getUnclaimedMissionRewardsCount(state: MissionBoardState): number {
  const dailyMissionUnclaimed = state.dailyMissions.filter((m) => m.completed && !m.claimed).length;
  const weeklyMissionUnclaimed = state.weeklyMissions.filter((m) => m.completed && !m.claimed).length;

  const dailyCompletedCount = state.dailyMissions.filter((m) => m.completed).length;
  const weeklyCompletedCount = state.weeklyMissions.filter((m) => m.completed).length;

  const dailyMilestoneUnclaimed = state.dailyMilestones.filter(
    (ms) => !ms.claimed && dailyCompletedCount >= ms.requiredCount
  ).length;
  const weeklyMilestoneUnclaimed = state.weeklyMilestones.filter(
    (ms) => !ms.claimed && weeklyCompletedCount >= ms.requiredCount
  ).length;

  return dailyMissionUnclaimed + weeklyMissionUnclaimed + dailyMilestoneUnclaimed + weeklyMilestoneUnclaimed;
}
