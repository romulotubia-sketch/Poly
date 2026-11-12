import {
  PetBaseStats,
  PetCalculatedStats,
  PetData,
  PetTrainingCategory,
  PetTrainingLevels,
} from '../types/game';

export const MAX_TRAINING_LEVEL = 5;

/**
 * Centralized Pet Essence upgrade costs for levels 1..5 across all categories.
 */
export const TRAINING_UPGRADE_COSTS: readonly [number, number, number, number, number] = [
  20, 40, 70, 110, 160,
];

export const DEFAULT_PET_TRAINING_LEVELS: PetTrainingLevels = {
  vitality: 0,
  attack: 0,
  speed: 0,
  defense: 0,
  agility: 0,
  precision: 0,
  critical: 0,
  range: 0,
  active_skill: 0,
  passive_skill: 0,
};

/**
 * Species-specific base combat attributes at Level 1, Training 0.
 * Distinct strengths/weaknesses per species & role.
 */
export const PET_SPECIES_BASE_STATS: Record<string, PetBaseStats> = {
  fox: {
    maxHp: 220,
    attackDamage: 29,
    attackSpeed: 0.98,
    attackRange: 1.5,
    moveSpeed: 7.3,
    defense: 14,
    critChance: 0.11,
    critDamage: 1.58,
  },
  turtle: {
    maxHp: 360,
    attackDamage: 24,
    attackSpeed: 0.82,
    attackRange: 1.5,
    moveSpeed: 4.9,
    defense: 34,
    critChance: 0.05,
    critDamage: 1.45,
  },
  rabbit: {
    maxHp: 185,
    attackDamage: 25,
    attackSpeed: 1.18,
    attackRange: 1.45,
    moveSpeed: 8.2,
    defense: 10,
    critChance: 0.15,
    critDamage: 1.66,
  },
  owl: {
    maxHp: 195,
    attackDamage: 30,
    attackSpeed: 0.86,
    attackRange: 4.1,
    moveSpeed: 6.6,
    defense: 11,
    critChance: 0.12,
    critDamage: 1.6,
  },
  bear: {
    maxHp: 340,
    attackDamage: 36,
    attackSpeed: 0.76,
    attackRange: 1.6,
    moveSpeed: 5.8,
    defense: 28,
    critChance: 0.07,
    critDamage: 1.55,
  },
  slime: {
    maxHp: 250,
    attackDamage: 25,
    attackSpeed: 0.9,
    attackRange: 3.7,
    moveSpeed: 5.9,
    defense: 16,
    critChance: 0.08,
    critDamage: 1.5,
  },
  wolf: {
    maxHp: 240,
    attackDamage: 34,
    attackSpeed: 1.02,
    attackRange: 1.55,
    moveSpeed: 7.4,
    defense: 15,
    critChance: 0.13,
    critDamage: 1.65,
  },
  frog: {
    maxHp: 235,
    attackDamage: 26,
    attackSpeed: 0.96,
    attackRange: 1.65,
    moveSpeed: 6.7,
    defense: 15,
    critChance: 0.09,
    critDamage: 1.52,
  },
  deer: {
    maxHp: 260,
    attackDamage: 25,
    attackSpeed: 0.95,
    attackRange: 1.55,
    moveSpeed: 7.8,
    defense: 18,
    critChance: 0.08,
    critDamage: 1.5,
  },
  dragon: {
    maxHp: 320,
    attackDamage: 42,
    attackSpeed: 0.82,
    attackRange: 4.0,
    moveSpeed: 7.0,
    defense: 24,
    critChance: 0.15,
    critDamage: 1.78,
  },
  phoenix: {
    maxHp: 300,
    attackDamage: 38,
    attackSpeed: 0.88,
    attackRange: 4.1,
    moveSpeed: 7.4,
    defense: 22,
    critChance: 0.14,
    critDamage: 1.72,
  },
  red_panda: {
    maxHp: 265,
    attackDamage: 24,
    attackSpeed: 1.02,
    attackRange: 1.5,
    moveSpeed: 6.9,
    defense: 18,
    critChance: 0.09,
    critDamage: 1.52,
  },
  timber_wolf: {
    maxHp: 245,
    attackDamage: 35,
    attackSpeed: 1.05,
    attackRange: 1.55,
    moveSpeed: 7.5,
    defense: 15,
    critChance: 0.13,
    critDamage: 1.65,
  },
  sylvan_deer: {
    maxHp: 295,
    attackDamage: 26,
    attackSpeed: 0.92,
    attackRange: 1.6,
    moveSpeed: 7.3,
    defense: 24,
    critChance: 0.08,
    critDamage: 1.5,
  },
  penguin: {
    maxHp: 230,
    attackDamage: 27,
    attackSpeed: 1.0,
    attackRange: 1.5,
    moveSpeed: 6.4,
    defense: 16,
    critChance: 0.1,
    critDamage: 1.58,
  },
  bat: {
    maxHp: 185,
    attackDamage: 30,
    attackSpeed: 0.96,
    attackRange: 4.2,
    moveSpeed: 7.2,
    defense: 10,
    critChance: 0.16,
    critDamage: 1.72,
  },
  poison_frog: {
    maxHp: 225,
    attackDamage: 27,
    attackSpeed: 0.98,
    attackRange: 2.1,
    moveSpeed: 6.6,
    defense: 15,
    critChance: 0.1,
    critDamage: 1.56,
  },
  hedgehog: {
    maxHp: 310,
    attackDamage: 27,
    attackSpeed: 0.94,
    attackRange: 1.45,
    moveSpeed: 5.7,
    defense: 29,
    critChance: 0.07,
    critDamage: 1.5,
  },
  bee: {
    maxHp: 170,
    attackDamage: 22,
    attackSpeed: 1.22,
    attackRange: 4.3,
    moveSpeed: 8.0,
    defense: 9,
    critChance: 0.12,
    critDamage: 1.6,
  },
  dragon_whelp: {
    maxHp: 270,
    attackDamage: 38,
    attackSpeed: 0.84,
    attackRange: 4.0,
    moveSpeed: 6.8,
    defense: 18,
    critChance: 0.12,
    critDamage: 1.68,
  },
  capybara: {
    maxHp: 335,
    attackDamage: 23,
    attackSpeed: 0.85,
    attackRange: 1.45,
    moveSpeed: 5.4,
    defense: 27,
    critChance: 0.06,
    critDamage: 1.48,
  },
};

export interface TrainingCategoryDefinition {
  id: PetTrainingCategory;
  group: 'stat' | 'skill';
  name: string;
  shortName: string;
  description: string;
  icon: string;
  unit: string;
  /** Cumulative bonus at levels [0, 1, 2, 3, 4, 5] */
  cumulativeBonuses: readonly [number, number, number, number, number, number];
  formatBonus: (val: number) => string;
}

export const PET_TRAINING_CATEGORIES: Record<PetTrainingCategory, TrainingCategoryDefinition> = {
  vitality: {
    id: 'vitality',
    group: 'stat',
    name: 'Vitality Training',
    shortName: 'Vitality',
    description: 'Increases the pet’s maximum HP in Wild Grounds combat.',
    icon: 'Heart',
    unit: 'HP',
    cumulativeBonuses: [0, 25, 55, 95, 145, 210],
    formatBonus: (v) => `+${Math.round(v)} HP`,
  },
  attack: {
    id: 'attack',
    group: 'stat',
    name: 'Attack Training',
    shortName: 'Attack',
    description: 'Increases basic attack damage dealt to enemies.',
    icon: 'Sword',
    unit: 'ATK',
    cumulativeBonuses: [0, 4, 9, 16, 25, 36],
    formatBonus: (v) => `+${Math.round(v)} ATK`,
  },
  speed: {
    id: 'speed',
    group: 'stat',
    name: 'Speed Training',
    shortName: 'Atk Speed',
    description: 'Increases basic attack frequency (attacks per second).',
    icon: 'Zap',
    unit: 'atk/s',
    cumulativeBonuses: [0, 0.06, 0.13, 0.21, 0.30, 0.42],
    formatBonus: (v) => `+${v.toFixed(2)} /s`,
  },
  defense: {
    id: 'defense',
    group: 'stat',
    name: 'Defense Training',
    shortName: 'Defense',
    description: 'Strengthens armor to reduce incoming enemy damage.',
    icon: 'Shield',
    unit: 'DEF',
    cumulativeBonuses: [0, 4, 9, 16, 24, 35],
    formatBonus: (v) => `+${Math.round(v)} DEF`,
  },
  agility: {
    id: 'agility',
    group: 'stat',
    name: 'Agility Training',
    shortName: 'Move Speed',
    description: 'Increases movement speed when chasing targets and following.',
    icon: 'Wind',
    unit: 'm/s',
    cumulativeBonuses: [0, 0.35, 0.75, 1.2, 1.7, 2.3],
    formatBonus: (v) => `+${v.toFixed(2)} m/s`,
  },
  precision: {
    id: 'precision',
    group: 'stat',
    name: 'Precision Training',
    shortName: 'Crit Chance',
    description: 'Increases critical hit probability on basic attacks.',
    icon: 'Target',
    unit: '%',
    cumulativeBonuses: [0, 0.03, 0.065, 0.105, 0.15, 0.21],
    formatBonus: (v) => `+${(v * 100).toFixed(1)}%`,
  },
  critical: {
    id: 'critical',
    group: 'stat',
    name: 'Critical Training',
    shortName: 'Crit Damage',
    description: 'Increases critical hit damage multiplier on basic attacks.',
    icon: 'Sparkles',
    unit: '%',
    cumulativeBonuses: [0, 0.12, 0.26, 0.42, 0.62, 0.85],
    formatBonus: (v) => `+${Math.round(v * 100)}%`,
  },
  range: {
    id: 'range',
    group: 'stat',
    name: 'Range Training',
    shortName: 'Range',
    description: 'Extends maximum basic attack reach distance.',
    icon: 'Compass',
    unit: 'm',
    cumulativeBonuses: [0, 0.18, 0.38, 0.60, 0.86, 1.15],
    formatBonus: (v) => `+${v.toFixed(2)}m`,
  },
  active_skill: {
    id: 'active_skill',
    group: 'skill',
    name: 'Active Skill Enhancement',
    shortName: 'Active Skill',
    description:
      'Boosts the pet’s active skill potency (damage, healing, shield, radius, duration) and reduces cooldown.',
    icon: 'Flame',
    unit: '%',
    cumulativeBonuses: [0, 8, 17, 28, 41, 56],
    formatBonus: (v) => `+${Math.round(v)}% Power`,
  },
  passive_skill: {
    id: 'passive_skill',
    group: 'skill',
    name: 'Passive Skill Enhancement',
    shortName: 'Passive Skill',
    description:
      'Amplifies the pet’s passive effect strength while equipped on the player’s skill bar.',
    icon: 'ShieldCheck',
    unit: '%',
    cumulativeBonuses: [0, 10, 22, 36, 52, 70],
    formatBonus: (v) => `+${Math.round(v)}% Effect`,
  },
};

export const STAT_TRAINING_ORDER: PetTrainingCategory[] = [
  'vitality',
  'attack',
  'speed',
  'defense',
  'agility',
  'precision',
  'critical',
  'range',
];

export const SKILL_ENHANCEMENT_ORDER: PetTrainingCategory[] = [
  'active_skill',
  'passive_skill',
];

export function getSpeciesBaseStats(species: string): PetBaseStats {
  const found = PET_SPECIES_BASE_STATS[species] || PET_SPECIES_BASE_STATS.fox;
  return { ...found };
}

export function normalizeTrainingLevels(training?: Partial<PetTrainingLevels>): PetTrainingLevels {
  const clampLvl = (val: unknown): number => {
    const n = typeof val === 'number' && !Number.isNaN(val) ? Math.floor(val) : 0;
    return Math.max(0, Math.min(MAX_TRAINING_LEVEL, n));
  };
  return {
    vitality: clampLvl(training?.vitality),
    attack: clampLvl(training?.attack),
    speed: clampLvl(training?.speed),
    defense: clampLvl(training?.defense),
    agility: clampLvl(training?.agility),
    precision: clampLvl(training?.precision),
    critical: clampLvl(training?.critical),
    range: clampLvl(training?.range),
    active_skill: clampLvl(training?.active_skill),
    passive_skill: clampLvl(training?.passive_skill),
  };
}

export function getNextUpgradeCost(currentLevel: number): number | null {
  if (currentLevel >= MAX_TRAINING_LEVEL) return null;
  const idx = Math.max(0, Math.min(MAX_TRAINING_LEVEL - 1, currentLevel));
  return TRAINING_UPGRADE_COSTS[idx];
}

export function computeTotalEssenceInvested(training?: Partial<PetTrainingLevels>): number {
  const norm = normalizeTrainingLevels(training);
  let total = 0;
  for (const key of Object.keys(norm) as PetTrainingCategory[]) {
    const lvl = norm[key];
    for (let i = 0; i < lvl; i++) {
      total += TRAINING_UPGRADE_COSTS[i] || 0;
    }
  }
  return total;
}

/**
 * Multipliers used by combatSkills.ts & GameCanvas.tsx for Skill Enhancement Levels (0..5)
 */
export function getActiveSkillEnhancementBonuses(level: number = 0) {
  const clamped = Math.max(0, Math.min(MAX_TRAINING_LEVEL, Math.floor(level)));
  const powerPct = PET_TRAINING_CATEGORIES.active_skill.cumulativeBonuses[clamped] || 0;
  const cdReductionLevels = [0, 0.03, 0.06, 0.1, 0.14, 0.18];
  const areaBonusLevels = [0, 0.04, 0.08, 0.12, 0.16, 0.2];
  return {
    level: clamped,
    powerMultiplier: 1 + powerPct / 100,
    powerBonusPct: powerPct,
    cooldownMultiplier: 1 - (cdReductionLevels[clamped] || 0),
    cooldownReductionPct: Math.round((cdReductionLevels[clamped] || 0) * 100),
    areaMultiplier: 1 + (areaBonusLevels[clamped] || 0),
    areaBonusPct: Math.round((areaBonusLevels[clamped] || 0) * 100),
  };
}

export function getPassiveEnhancementMultiplier(level: number = 0): number {
  const clamped = Math.max(0, Math.min(MAX_TRAINING_LEVEL, Math.floor(level)));
  const pct = PET_TRAINING_CATEGORIES.passive_skill.cumulativeBonuses[clamped] || 0;
  return 1 + pct / 100;
}

/**
 * Calculates deterministic final combat stats for a single pet from:
 *   1. Species Base Stats (base)
 *   2. Pet Level Progression Bonuses (levelBonus)
 *   3. Individual Training Upgrades (trainingBonus)
 * Never applies the same bonus twice.
 */
export function calculatePetStats(pet: PetData): PetCalculatedStats {
  const base = pet.baseStats ? { ...pet.baseStats } : getSpeciesBaseStats(pet.species);
  const lvlAboveOne = Math.max(0, (pet.level || 1) - 1);
  const training = normalizeTrainingLevels(pet.training);

  const levelBonus: PetBaseStats = {
    maxHp: Math.round(lvlAboveOne * (base.maxHp * 0.055)),
    attackDamage: Math.round(lvlAboveOne * (base.attackDamage * 0.065) * 10) / 10,
    attackSpeed: Math.round(lvlAboveOne * 0.004 * 1000) / 1000,
    attackRange: Math.round(Math.min(0.6, lvlAboveOne * 0.01) * 100) / 100,
    moveSpeed: Math.round(Math.min(1.8, lvlAboveOne * 0.03) * 100) / 100,
    defense: Math.round(lvlAboveOne * (base.defense * 0.055) * 10) / 10,
    critChance: Math.round(Math.min(0.15, lvlAboveOne * 0.0025) * 1000) / 1000,
    critDamage: Math.round(Math.min(0.35, lvlAboveOne * 0.006) * 1000) / 1000,
  };

  const trainingBonus: PetBaseStats = {
    maxHp: PET_TRAINING_CATEGORIES.vitality.cumulativeBonuses[training.vitality],
    attackDamage: PET_TRAINING_CATEGORIES.attack.cumulativeBonuses[training.attack],
    attackSpeed: PET_TRAINING_CATEGORIES.speed.cumulativeBonuses[training.speed],
    attackRange: PET_TRAINING_CATEGORIES.range.cumulativeBonuses[training.range],
    moveSpeed: PET_TRAINING_CATEGORIES.agility.cumulativeBonuses[training.agility],
    defense: PET_TRAINING_CATEGORIES.defense.cumulativeBonuses[training.defense],
    critChance: PET_TRAINING_CATEGORIES.precision.cumulativeBonuses[training.precision],
    critDamage: PET_TRAINING_CATEGORIES.critical.cumulativeBonuses[training.critical],
  };

  const maxHp = Math.max(1, Math.round(base.maxHp + levelBonus.maxHp + trainingBonus.maxHp));
  const attackDamage = Math.max(1, Math.round(base.attackDamage + levelBonus.attackDamage + trainingBonus.attackDamage));
  const attackSpeed = Number(
    Math.min(2.6, base.attackSpeed + levelBonus.attackSpeed + trainingBonus.attackSpeed).toFixed(2)
  );
  const attackRange = Number(
    (base.attackRange + levelBonus.attackRange + trainingBonus.attackRange).toFixed(2)
  );
  const moveSpeed = Number(
    (base.moveSpeed + levelBonus.moveSpeed + trainingBonus.moveSpeed).toFixed(2)
  );
  const defense = Math.round(base.defense + levelBonus.defense + trainingBonus.defense);
  const critChance = Number(
    Math.min(0.85, base.critChance + levelBonus.critChance + trainingBonus.critChance).toFixed(3)
  );
  const critDamage = Number(
    (base.critDamage + levelBonus.critDamage + trainingBonus.critDamage).toFixed(2)
  );

  const attackInterval = Number((1 / Math.max(0.25, attackSpeed)).toFixed(2));
  const damageReductionPct = Number(Math.min(0.72, defense / (defense + 65)).toFixed(3));

  return {
    maxHp,
    attackDamage,
    attackSpeed,
    attackRange,
    moveSpeed,
    defense,
    critChance,
    critDamage,
    attackInterval,
    damageReductionPct,
    base,
    levelBonus,
    trainingBonus,
    totalEssenceInvested: computeTotalEssenceInvested(training),
  };
}

/**
 * Idempotent save-migration helper for PetData.
 * Preserves ownership, levels, XP, skills, and existing training/history while filling missing fields.
 */
export function migratePetData(pet: PetData, fallbackTemplate?: PetData): PetData {
  const species = pet.species || fallbackTemplate?.species || 'fox';
  const baseStats = pet.baseStats
    ? { ...getSpeciesBaseStats(species), ...pet.baseStats }
    : getSpeciesBaseStats(species);
  const training = normalizeTrainingLevels(pet.training);
  const upgradeHistory = Array.isArray(pet.upgradeHistory) ? pet.upgradeHistory : [];

  const merged: PetData = {
    ...(fallbackTemplate || {}),
    ...pet,
    species,
    baseStats,
    training,
    upgradeHistory,
    defeated: false,
  };

  const calculated = calculatePetStats(merged);
  merged.maxHp = calculated.maxHp;
  merged.currentHp = calculated.maxHp;
  return merged;
}
