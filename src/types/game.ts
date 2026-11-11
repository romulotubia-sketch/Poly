export type PetRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythical';
export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface PerformanceStatsData {
  fps: number;
  frameTimeMs: number;
  activeParticles: number;
  maxParticles: number;
  drawCalls: number;
  triangles: number;
  activeEnemies: number;
  activePets: number;
}

export interface PetSkill {
  id: string;
  name: string;
  type: 'active' | 'passive';
  description: string;
  icon: string; // Lucide icon name or emoji identifier
  baseCooldown: number; // in seconds (for active)
  cooldown: number; // calculated cooldown
  effectValue: number; // e.g. % bonus or radius
  levelBonusDescription?: (level: number) => string;
}

export interface PetData {
  id: string;
  species: 'fox' | 'turtle' | 'rabbit' | 'owl' | 'bear' | 'slime' | 'wolf' | 'frog' | 'deer' | 'dragon' | 'phoenix';
  name: string;
  nickname?: string;
  role?: string;
  description: string;
  rarity: PetRarity;
  level: number;
  exp: number;
  maxExp: number;
  happiness: number; // 0 - 100
  hunger: number; // 0 - 100 (100 = full)
  isFollowing: boolean;
  activeSkill: PetSkill;
  passiveSkill: PetSkill;
  color: string;
  accentColor: string;
  unlocked: boolean;
}

export interface CropDefinition {
  id: string;
  name: string;
  growTimeSeconds: number;
  seedPrice: number;
  sellPrice: number;
  expReward: number;
  icon: string;
  color: string;
  stageColors: [string, string, string]; // sprout, growing, mature
  description: string;
}

export interface FarmPlotState {
  id: number;
  x: number;
  z: number;
  tilled: boolean;
  watered: boolean;
  waterLevel: number; // 0 to 1
  cropId: string | null;
  plantedAt: number | null; // timestamp
  growProgress: number; // 0 to 1
  fertilized?: boolean;
  isHarvested?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'seed' | 'crop' | 'material' | 'treat' | 'tool' | 'essence_item';
  count: number;
  description: string;
  icon: string;
  sellPrice?: number;
}

export interface NourishmentBonuses {
  carrotsConsumed: number;
  tomatoesConsumed: number;
  strawberriesConsumed: number;
  cornConsumed: number;
  pumpkinsConsumed: number;
  maxHpBonus: number;        // up to +100 Max HP (+0.1 per carrot)
  attackDamagePct: number;   // up to +20% (+0.1% per tomato)
  critChancePct: number;     // up to +10% (+0.1% per strawberry)
  moveSpeedPct: number;      // up to +10% (+0.1% per corn)
  defensePct: number;        // up to +20% (+0.1% per pumpkin)
}

export interface PlayerStats {
  gold: number;
  petEssence: number; // Pet Essence currency from duplicate conversions
  health: number; // Player HP in Wild Grounds instance (0-100)
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  day: number;
  dayTime: number; // 0 to 1
  farmExpansionLevel: number;
  equippedSkillSlots: (string | null)[]; // up to 5 pet IDs
  highestWaveCleared: number; // Instance progression record
  totalInstancesCleared: number;
  nourishment?: NourishmentBonuses;
  isAutoHunt?: boolean;
}

export interface CombatTargetInfo {
  id: string;
  name: string;
  type: string;
  health: number;
  maxHealth: number;
  hpRatio: number;
}

export interface EssenceShopItem {
  id: string;
  name: string;
  cost: number; // in Pet Essence
  category: 'exp' | 'enhancement' | 'egg';
  icon: string;
  description: string;
  effect: string;
}

export interface EnemyInstanceUnit {
  id: string;
  name: string;
  type: 'slime' | 'imp' | 'wolf' | 'golem' | 'boss';
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  x: number;
  z: number;
  size: number;
  color: string;
  isBoss?: boolean;
  attackCooldown: number;
}

export interface InstanceWaveConfig {
  wave: number;
  title: string;
  enemyCount: number;
  types: ('slime' | 'imp' | 'wolf' | 'golem' | 'boss')[];
  prepDurationSeconds: number;
  essenceReward: number;
}

export interface DuplicateConversionEvent {
  pet: PetData;
  essenceEarned: number;
  timestamp: number;
}

export interface GameSaveState {
  version: number;
  player: PlayerStats;
  pets: PetData[];
  farmPlots: FarmPlotState[];
  inventory: Record<string, number>;
  unlockedDecors: string[];
}
