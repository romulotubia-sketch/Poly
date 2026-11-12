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

export type PetTrainingCategory =
  | 'vitality'
  | 'attack'
  | 'speed'
  | 'defense'
  | 'agility'
  | 'precision'
  | 'critical'
  | 'range'
  | 'active_skill'
  | 'passive_skill';

export interface PetTrainingLevels {
  vitality: number;
  attack: number;
  speed: number;
  defense: number;
  agility: number;
  precision: number;
  critical: number;
  range: number;
  active_skill: number;
  passive_skill: number;
}

export interface PetBaseStats {
  maxHp: number;
  attackDamage: number;
  attackSpeed: number; // attacks per second
  attackRange: number; // meters
  moveSpeed: number; // m/s
  defense: number; // defense rating
  critChance: number; // 0 to 1
  critDamage: number; // multiplier e.g. 1.55 = 155%
}

export interface PetCalculatedStats extends PetBaseStats {
  base: PetBaseStats;
  levelBonus: PetBaseStats;
  trainingBonus: PetBaseStats;
  attackInterval: number; // 1 / attackSpeed
  damageReductionPct: number; // 0 to 0.72
  totalEssenceInvested: number;
}

export interface PetUpgradeHistoryEntry {
  id: string;
  petId: string;
  petName: string;
  species: string;
  category: PetTrainingCategory;
  categoryLabel: string;
  previousLevel: number;
  newLevel: number;
  essenceSpent: number;
  timestamp: number;
}

export interface PetCombatRuntimeStatus {
  petId: string;
  name: string;
  species: string;
  color: string;
  currentHp: number;
  maxHp: number;
  defeated: boolean;
  slotIndex: number;
}

export interface PetData {
  id: string;
  species:
    | 'fox'
    | 'turtle'
    | 'rabbit'
    | 'owl'
    | 'bear'
    | 'slime'
    | 'wolf'
    | 'frog'
    | 'deer'
    | 'dragon'
    | 'phoenix'
    | 'red_panda'
    | 'timber_wolf'
    | 'sylvan_deer'
    | 'penguin'
    | 'bat'
    | 'poison_frog'
    | 'hedgehog'
    | 'bee'
    | 'dragon_whelp'
    | 'capybara';
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
  baseStats?: PetBaseStats;
  training?: PetTrainingLevels;
  currentHp?: number;
  maxHp?: number;
  defeated?: boolean;
  upgradeHistory?: PetUpgradeHistoryEntry[];
}

export interface CropDefinition {
  id: string;
  name: string;
  rarity: PetRarity;
  growTimeSeconds: number;
  seedPrice: number;
  sellPrice: number;
  expReward: number;
  icon: string;
  emoji: string;
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
  consumedCounts?: Record<string, number>;
  maxHpBonus: number;        // up to +100 Max HP
  attackDamagePct: number;   // up to +20%
  critChancePct: number;     // up to +10%
  moveSpeedPct: number;      // up to +10%
  defensePct: number;        // up to +20%
  critDamagePct?: number;    // up to +40%
  skillDamagePct?: number;   // up to +25%
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

export type MissionPeriod = 'daily' | 'weekly';
export type MissionCategory = 'farming' | 'pet' | 'wild_grounds' | 'general';
export type MissionDifficulty = 'easy' | 'medium' | 'hard';

export type MissionEventType =
  | 'harvest_crop'
  | 'plant_seed'
  | 'earn_farm_coins'
  | 'earn_coins'
  | 'feed_pet'
  | 'interact_pet'
  | 'visit_pet_den'
  | 'gain_pet_exp'
  | 'defeat_enemy'
  | 'defeat_elite'
  | 'defeat_boss'
  | 'complete_wave'
  | 'complete_instance'
  | 'play_time_minute'
  | 'complete_daily_mission'
  | 'complete_mission';

export interface MissionSeedReward {
  seedKey: string;
  name: string;
  count: number;
  icon: string;
}

export interface MissionReward {
  gold?: number;
  petEssence?: number;
  seeds?: MissionSeedReward[];
}

export interface MissionInstance {
  id: string;
  templateId: string;
  period: MissionPeriod;
  category: MissionCategory;
  difficulty: MissionDifficulty;
  title: string;
  description: string;
  eventType: MissionEventType;
  uniqueTrackKey?: boolean;
  trackedKeys?: string[];
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  reward: MissionReward;
}

export interface MilestoneState {
  id: string;
  period: MissionPeriod;
  requiredCount: number;
  title: string;
  reward: MissionReward;
  claimed: boolean;
}

export interface MissionBoardState {
  version: number;
  dailyMissions: MissionInstance[];
  weeklyMissions: MissionInstance[];
  dailyMilestones: MilestoneState[];
  weeklyMilestones: MilestoneState[];
  lastDailyResetKey: string;
  lastWeeklyResetKey: string;
  lastDailyResetAt: number;
  lastWeeklyResetAt: number;
}

