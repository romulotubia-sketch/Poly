import { PetData, CropDefinition, FarmPlotState, EssenceShopItem, InstanceWaveConfig, PetRarity } from '../types/game';

// Duplicate Conversion Values as specified:
// Common: 5 Essence, Uncommon: 10 Essence, Rare: 25 Essence, Epic: 60 Essence, Legendary: 150 Essence, Mythical: 350 Essence
export const DUPLICATE_ESSENCE_VALUES: Record<PetRarity, number> = {
  Common: 5,
  Uncommon: 10,
  Rare: 25,
  Epic: 60,
  Legendary: 150,
  Mythical: 350,
};

export const INITIAL_PETS: PetData[] = [
  {
    id: 'pet_fox',
    species: 'fox',
    name: 'Ember',
    description: 'A nimble, fiery fox with a warm spirit. Loves running through tall grass and helping crops flourish.',
    rarity: 'Rare',
    level: 1,
    exp: 0,
    maxExp: 100,
    happiness: 90,
    hunger: 80,
    isFollowing: true,
    color: '#e76f51',
    accentColor: '#f4a261',
    unlocked: true,
    activeSkill: {
      id: 'skill_flame_dash',
      name: 'Flame Dash',
      type: 'active',
      description: 'Dashes forward leaving a radiant flame trail that boosts move speed by +75% for 3s, hits enemies for 85 damage, and accelerates crop growth.',
      icon: 'Flame',
      baseCooldown: 8,
      cooldown: 8,
      effectValue: 75,
    },
    passiveSkill: {
      id: 'passive_burning_spirit',
      name: 'Burning Spirit',
      type: 'passive',
      description: 'Increases player base move speed by +15% and increases overall farm growth rate by +10%.',
      icon: 'Sun',
      baseCooldown: 0,
      cooldown: 0,
      effectValue: 15,
    },
  },
  {
    id: 'pet_turtle',
    species: 'turtle',
    name: 'Shelly',
    description: 'A serene ancient turtle with a moss-carpeted shell. Commands gentle mountain waters.',
    rarity: 'Common',
    level: 1,
    exp: 0,
    maxExp: 100,
    happiness: 85,
    hunger: 90,
    isFollowing: false,
    color: '#2a9d8f',
    accentColor: '#8ab17d',
    unlocked: true,
    activeSkill: {
      id: 'skill_water_shield',
      name: 'Water Shield',
      type: 'active',
      description: 'Creates a protective swirling hydro sphere that waters all crops within 5m, shields player for 50 damage, and splashes nearby foes.',
      icon: 'Droplets',
      baseCooldown: 12,
      cooldown: 12,
      effectValue: 5,
    },
    passiveSkill: {
      id: 'passive_natural_protection',
      name: 'Natural Protection',
      type: 'passive',
      description: 'Crops retain hydration 50% longer. Gives +20% defense and stamina regeneration.',
      icon: 'ShieldCheck',
      baseCooldown: 0,
      cooldown: 0,
      effectValue: 50,
    },
  },
  {
    id: 'pet_rabbit',
    species: 'rabbit',
    name: 'Hoppy',
    description: 'An energetic cotton-tailed hare who is an expert at finding the sweetest harvest carrots.',
    rarity: 'Common',
    level: 1,
    exp: 0,
    maxExp: 100,
    happiness: 95,
    hunger: 70,
    isFollowing: false,
    color: '#e9c46a',
    accentColor: '#f7ede2',
    unlocked: true,
    activeSkill: {
      id: 'skill_swift_leap',
      name: 'Swift Leap',
      type: 'active',
      description: 'Performs a giant acrobatic leap forward. Harvests mature crops in radius and stomps enemies for 70 damage upon landing.',
      icon: 'Rabbit',
      baseCooldown: 6,
      cooldown: 6,
      effectValue: 4,
    },
    passiveSkill: {
      id: 'passive_quick_harvest',
      name: 'Quick Harvest',
      type: 'passive',
      description: 'Provides a +35% chance to harvest bonus double crops and seeds.',
      icon: 'Sparkles',
      baseCooldown: 0,
      cooldown: 0,
      effectValue: 35,
    },
  },
  {
    id: 'pet_owl',
    species: 'owl',
    name: 'Barnaby',
    description: 'A wise nocturnal owl with luminous eyes that reveal the secrets of the forest and rare seeds.',
    rarity: 'Epic',
    level: 1,
    exp: 0,
    maxExp: 120,
    happiness: 80,
    hunger: 85,
    isFollowing: false,
    color: '#7b2cbf',
    accentColor: '#9d4edd',
    unlocked: true,
    activeSkill: {
      id: 'skill_wind_gust',
      name: 'Wind Gust',
      type: 'active',
      description: 'Unleashes a sweeping floral gale forward that knocks back enemies, pollinates crops (instant +25% growth) and uncovers hidden wild seeds.',
      icon: 'Wind',
      baseCooldown: 10,
      cooldown: 10,
      effectValue: 25,
    },
    passiveSkill: {
      id: 'passive_keen_sight',
      name: 'Keen Sight',
      type: 'passive',
      description: 'Increases rare and exotic seed drop chance by +30%. Highlights harvestable crops with a subtle golden beacon.',
      icon: 'Eye',
      baseCooldown: 0,
      cooldown: 0,
      effectValue: 30,
    },
  },
  {
    id: 'pet_bear',
    species: 'bear',
    name: 'Grizz',
    description: 'A gentle giant of a bear who loves berries and honey. His strength can reshape the earth.',
    rarity: 'Epic',
    level: 1,
    exp: 0,
    maxExp: 130,
    happiness: 88,
    hunger: 75,
    isFollowing: false,
    color: '#7f4f24',
    accentColor: '#a68a64',
    unlocked: true,
    activeSkill: {
      id: 'skill_ground_slam',
      name: 'Ground Slam',
      type: 'active',
      description: 'Slams the ground creating a seismic shockwave that deals 110 damage to surrounding foes, tills untilled soil, and breaks nearby rocks.',
      icon: 'Hammer',
      baseCooldown: 14,
      cooldown: 14,
      effectValue: 6,
    },
    passiveSkill: {
      id: 'passive_heavy_strength',
      name: 'Heavy Strength',
      type: 'passive',
      description: 'Expands player inventory capacity by +50% and doubles stone & timber gathered from rocks and stumps.',
      icon: 'Dumbbell',
      baseCooldown: 0,
      cooldown: 0,
      effectValue: 50,
    },
  },
  {
    id: 'pet_slime',
    species: 'slime',
    name: 'Boba',
    description: 'A bouncy, cheerful slime made of sweetened dewdrop nectar. Spreads joy and soothing revitalizing moisture.',
    rarity: 'Legendary',
    level: 1,
    exp: 0,
    maxExp: 150,
    happiness: 100,
    hunger: 100,
    isFollowing: false,
    color: '#06d6a0',
    accentColor: '#70e000',
    unlocked: true,
    activeSkill: {
      id: 'skill_healing_bubble',
      name: 'Healing Bubble',
      type: 'active',
      description: 'Emanates a joyful restorative bubble ring that restores +45 Player HP, fully replenishes pet hunger/happiness, and hydrates nearby soil.',
      icon: 'HeartHandshake',
      baseCooldown: 15,
      cooldown: 15,
      effectValue: 100,
    },
    passiveSkill: {
      id: 'passive_regeneration',
      name: 'Regeneration',
      type: 'passive',
      description: 'All pets continuously regenerate happiness and hunger over time. Player energy and HP regenerates slowly.',
      icon: 'HeartPulse',
      baseCooldown: 0,
      cooldown: 0,
      effectValue: 100,
    },
  },
  // Additional collectible pets for reward pool and duplicate conversions
  {
    id: 'pet_frog',
    species: 'frog',
    name: 'Puddles',
    description: 'A cheerful pond frog who loves rain showers and leaps across puddles with boundless enthusiasm.',
    rarity: 'Uncommon',
    level: 1,
    exp: 0,
    maxExp: 110,
    happiness: 90,
    hunger: 80,
    isFollowing: false,
    color: '#52b788',
    accentColor: '#74c69d',
    unlocked: false,
    activeSkill: {
      id: 'skill_splash_hop',
      name: 'Splash Hop',
      type: 'active',
      description: 'Hops into the air creating a tidal splash that drenches crops and deals 65 damage to enemies.',
      icon: 'Droplets',
      baseCooldown: 8,
      cooldown: 8,
      effectValue: 65,
    },
    passiveSkill: {
      id: 'passive_swamp_blessing',
      name: 'Swamp Blessing',
      type: 'passive',
      description: 'Increases water retention on all plots by 30% and gives +15% movement speed on moist soil.',
      icon: 'Sparkles',
      baseCooldown: 0,
      cooldown: 0,
      effectValue: 30,
    },
  },
  {
    id: 'pet_wolf',
    species: 'wolf',
    name: 'Shadow',
    description: 'A loyal silver-maned wolf with keen senses and the fierce spirit of the moonlit wilderness.',
    rarity: 'Rare',
    level: 1,
    exp: 0,
    maxExp: 125,
    happiness: 90,
    hunger: 80,
    isFollowing: false,
    color: '#6c757d',
    accentColor: '#adb5bd',
    unlocked: false,
    activeSkill: {
      id: 'skill_lunar_howl',
      name: 'Lunar Howl',
      type: 'active',
      description: 'Releases a reverberating howl that intimidates enemies for 80 damage and grants +30% attack boost for 5s.',
      icon: 'Flame',
      baseCooldown: 11,
      cooldown: 11,
      effectValue: 80,
    },
    passiveSkill: {
      id: 'passive_pack_instinct',
      name: 'Pack Instinct',
      type: 'passive',
      description: 'All pets level up +20% faster and gain +15% happiness from farm exploration.',
      icon: 'Eye',
      baseCooldown: 0,
      cooldown: 0,
      effectValue: 20,
    },
  },
  {
    id: 'pet_deer',
    species: 'deer',
    name: 'Fawn',
    description: 'A gentle forest spirit whose blossoming antlers radiate forest harmony and bountiful blooms.',
    rarity: 'Uncommon',
    level: 1,
    exp: 0,
    maxExp: 105,
    happiness: 92,
    hunger: 85,
    isFollowing: false,
    color: '#b08968',
    accentColor: '#e6ccb2',
    unlocked: false,
    activeSkill: {
      id: 'skill_nature_sprint',
      name: 'Nature Sprint',
      type: 'active',
      description: 'Gallops forward surrounded by golden leaves, boosting move speed by +50% and healing 30 HP.',
      icon: 'Sun',
      baseCooldown: 9,
      cooldown: 9,
      effectValue: 50,
    },
    passiveSkill: {
      id: 'passive_herbalist',
      name: 'Herbalist',
      type: 'passive',
      description: 'Increases harvest coin yields by +15% and speeds up crop maturity by +10%.',
      icon: 'Sparkles',
      baseCooldown: 0,
      cooldown: 0,
      effectValue: 15,
    },
  },
  {
    id: 'pet_dragon',
    species: 'dragon',
    name: 'Ignis',
    description: 'An ancient miniature dragon whose golden scales gleam with primordial starlight and boundless valor.',
    rarity: 'Mythical',
    level: 1,
    exp: 0,
    maxExp: 200,
    happiness: 100,
    hunger: 100,
    isFollowing: false,
    color: '#d90429',
    accentColor: '#ffb703',
    unlocked: false,
    activeSkill: {
      id: 'skill_inferno_nova',
      name: 'Inferno Nova',
      type: 'active',
      description: 'Summons a blazing orbital supernova that annihilates all enemies in an 8m radius for 180 damage and instantly matures surrounding crops!',
      icon: 'Flame',
      baseCooldown: 18,
      cooldown: 18,
      effectValue: 180,
    },
    passiveSkill: {
      id: 'passive_dragon_might',
      name: 'Dragon Might',
      type: 'passive',
      description: 'Player damage increased by +50%, farm harvest sell values boosted by +40%, and passive Pet Essence generation.',
      icon: 'Dumbbell',
      baseCooldown: 0,
      cooldown: 0,
      effectValue: 50,
    },
  },
  {
    id: 'pet_phoenix',
    species: 'phoenix',
    name: 'Solara',
    description: 'A radiant legendary bird born from solar flares. When fallen, it rises with brilliant luminescent vigor.',
    rarity: 'Mythical',
    level: 1,
    exp: 0,
    maxExp: 200,
    happiness: 100,
    hunger: 100,
    isFollowing: false,
    color: '#fb8500',
    accentColor: '#ffb703',
    unlocked: false,
    activeSkill: {
      id: 'skill_solar_flare',
      name: 'Solar Flare',
      type: 'active',
      description: 'Bathes the field in celestial dawn light, dealing 160 holy damage to all foes and fully reviving player HP to 100%!',
      icon: 'Sun',
      baseCooldown: 20,
      cooldown: 20,
      effectValue: 160,
    },
    passiveSkill: {
      id: 'passive_eternal_dawn',
      name: 'Eternal Dawn',
      type: 'passive',
      description: 'Prevents fatal damage once per instance run, restoring 50% HP, and doubles crop growth rate under sunlight.',
      icon: 'ShieldCheck',
      baseCooldown: 0,
      cooldown: 0,
      effectValue: 100,
    },
  },
];

export function getSkillLevelBonus(skillId: string, level: number): string {
  switch (skillId) {
    case 'skill_flame_dash':
      return `Dash speed: +${75 + level * 5}%, Cooldown: ${(8 * Math.max(0.6, 1 - level * 0.03)).toFixed(1)}s, Damage: ${85 + level * 10}`;
    case 'passive_burning_spirit':
      return `Move speed: +${15 + level * 2}%, Farm growth rate: +${10 + level * 3}%`;
    case 'skill_water_shield':
      return `Watering radius: ${(5 + level * 0.5).toFixed(1)}m, Cooldown: ${(12 * Math.max(0.6, 1 - level * 0.03)).toFixed(1)}s, Shield: ${50 + level * 8}`;
    case 'passive_natural_protection':
      return `Moisture retention: +${50 + level * 5}%, Stamina regen: +${level * 4}%`;
    case 'skill_swift_leap':
      return `Harvest leap radius: ${(4 + level * 0.4).toFixed(1)}m, Jump distance: +${level * 8}%, Damage: ${70 + level * 8}`;
    case 'passive_quick_harvest':
      return `Bonus harvest chance: +${35 + level * 3}%, Gathering speed: +${20 + level * 2}%`;
    case 'skill_wind_gust':
      return `Growth boost: +${25 + level * 4}%, Gust distance: ${(8 + level * 0.8).toFixed(1)}m, Damage: ${55 + level * 7}`;
    case 'passive_keen_sight':
      return `Rare seed chance: +${30 + level * 5}%, Discovery range: +${level * 2}m`;
    case 'skill_ground_slam':
      return `Shockwave radius: ${(6 + level * 0.6).toFixed(1)}m, Mineral yield: +${level * 10}%, Damage: ${110 + level * 15}`;
    case 'passive_heavy_strength':
      return `Inventory cap: +${50 + level * 10}%, Gathering yield: +${100 + level * 15}%`;
    case 'skill_healing_bubble':
      return `Player Heal: ${45 + level * 5} HP, Pet Happiness: +${30 + level * 5}%, Cooldown: ${(15 * Math.max(0.5, 1 - level * 0.03)).toFixed(1)}s`;
    case 'passive_regeneration':
      return `Auto-regen speed: +${100 + level * 10}%, Energy recovery: +${level * 5}%`;
    case 'skill_splash_hop':
      return `Splash Damage: ${65 + level * 8}, Drench Radius: ${(4 + level * 0.5).toFixed(1)}m`;
    case 'skill_lunar_howl':
      return `Howl Damage: ${80 + level * 10}, Attack Boost: +${30 + level * 3}%`;
    case 'skill_inferno_nova':
      return `Nova Damage: ${180 + level * 25}, Radius: ${(8 + level * 0.8).toFixed(1)}m`;
    case 'skill_solar_flare':
      return `Flare Damage: ${160 + level * 20}, Revives 100% HP`;
    default:
      return `Level ${level} mastery active (+${level * 5}% power)`;
  }
}

// Initial Seeds and Crops configured exactly as specified:
// Carrot Seed: 10 coins -> Carrot: 20 coin harvest value (15s grow time)
// Tomato Seed: 20 coins -> Tomato: 40 coin harvest value (25s grow time)
// Strawberry Seed: 35 coins -> Strawberry: 70 coin harvest value (35s grow time)
// Corn Seed: 50 coins -> Corn: 100 coin harvest value (50s grow time)
// Pumpkin Seed: 100 coins -> Pumpkin: 220 coin harvest value (75s grow time)
export const CROPS: Record<string, CropDefinition> = {
  carrot: {
    id: 'carrot',
    name: 'Sweet Carrot',
    description: 'Crisp, sweet, and rich in nutrients. Rapid growth cycle.',
    growTimeSeconds: 15,
    seedPrice: 10,
    sellPrice: 20,
    expReward: 15,
    icon: 'Carrot',
    color: '#ff7b00',
    stageColors: ['#a7c957', '#e76f51', '#f77f00'],
  },
  tomato: {
    id: 'tomato',
    name: 'Juicy Tomato',
    description: 'Plump, ripe red tomatoes bursting with sweet savory juice.',
    growTimeSeconds: 25,
    seedPrice: 20,
    sellPrice: 40,
    expReward: 25,
    icon: 'Apple',
    color: '#e63946',
    stageColors: ['#a7c957', '#f4a261', '#e63946'],
  },
  strawberry: {
    id: 'strawberry',
    name: 'Sugar Berry',
    description: 'Delicately scented wild strawberries loved by forest hares.',
    growTimeSeconds: 35,
    seedPrice: 35,
    sellPrice: 70,
    expReward: 35,
    icon: 'Cherry',
    color: '#d90429',
    stageColors: ['#a7c957', '#ffb703', '#d90429'],
  },
  corn: {
    id: 'corn',
    name: 'Golden Corn',
    description: 'Tall golden stalks bearing sweet sun-ripened corn cobs.',
    growTimeSeconds: 50,
    seedPrice: 50,
    sellPrice: 100,
    expReward: 50,
    icon: 'Wheat',
    color: '#ffd166',
    stageColors: ['#a7c957', '#e9c46a', '#ffd166'],
  },
  pumpkin: {
    id: 'pumpkin',
    name: 'Harvest Pumpkin',
    description: 'A heavy, magnificent autumn pumpkin with extraordinary market value.',
    growTimeSeconds: 75,
    seedPrice: 100,
    sellPrice: 220,
    expReward: 95,
    icon: 'Sparkles',
    color: '#f77f00',
    stageColors: ['#a7c957', '#fcbf49', '#f77f00'],
  },
};

// Pet Essence Shop Catalog
export const ESSENCE_SHOP_ITEMS: EssenceShopItem[] = [
  {
    id: 'essence_nectar_drops',
    name: 'Sweet Nectar Drops',
    cost: 15,
    category: 'exp',
    icon: 'Droplets',
    description: 'Distilled dewdrop nectar collected from mystical blooms.',
    effect: 'Grants +50 EXP to your active pet.',
  },
  {
    id: 'essence_starfruit_ambrosia',
    name: 'Starfruit Ambrosia',
    cost: 45,
    category: 'exp',
    icon: 'Sparkles',
    description: 'Golden fermented starlight fruit packed with magical growth vigor.',
    effect: 'Grants +250 EXP to your active pet.',
  },
  {
    id: 'essence_astral_elixir',
    name: 'Astral Elixir',
    cost: 110,
    category: 'exp',
    icon: 'Zap',
    description: 'Concentrated essence from celestial constellations.',
    effect: 'Grants +750 EXP to your active pet.',
  },
  {
    id: 'essence_skill_shard',
    name: 'Ancient Skill Shard',
    cost: 65,
    category: 'enhancement',
    icon: 'Shield',
    description: 'A glowing runic stone carved by the ancient Haven wardens.',
    effect: 'Enhances active skill damage and potency by +15% permanently.',
  },
  {
    id: 'essence_prism_core',
    name: 'Prism Time Core',
    cost: 95,
    category: 'enhancement',
    icon: 'Eye',
    description: 'A chronal crystal that speeds up ability cooldowns.',
    effect: 'Permanently reduces pet skill cooldowns by -10%.',
  },
  {
    id: 'essence_mystery_egg',
    name: 'Mystery Pet Egg',
    cost: 80,
    category: 'egg',
    icon: 'HeartHandshake',
    description: 'A warm spotted egg humming with friendly creature chirps.',
    effect: 'Hatches a random pet (Common, Uncommon, Rare, or Epic). Duplicates convert to Essence!',
  },
  {
    id: 'essence_prismatic_egg',
    name: 'Prismatic Dragon Egg',
    cost: 250,
    category: 'egg',
    icon: 'Flame',
    description: 'A shimmering iridescent egg blazing with primordial majesty.',
    effect: 'Hatches a guaranteed Rare, Epic, Legendary, or Mythical pet (like Ignis or Solara)!',
  },
];

// 10 Progressive Waves for Wild Grounds Instance:
// Wave 1: 3 weak enemies
// Wave 2: 4 weak enemies
// Wave 3: 5 enemies
// Wave 4: 4 stronger enemies
// Wave 5: Mini-boss
// Wave 6: 6 stronger enemies
// Wave 7: 8 mixed enemies
// Wave 8: 10 elite enemies
// Wave 9: Elite boss
// Wave 10: Final boss
export const INSTANCE_WAVES: InstanceWaveConfig[] = [
  { wave: 1, title: 'Shadow Slime Scout', enemyCount: 3, types: ['slime'], prepDurationSeconds: 4, essenceReward: 8 },
  { wave: 2, title: 'Forest Imp Vanguard', enemyCount: 4, types: ['slime', 'imp'], prepDurationSeconds: 4, essenceReward: 12 },
  { wave: 3, title: 'Imp Swarm', enemyCount: 5, types: ['imp'], prepDurationSeconds: 4, essenceReward: 16 },
  { wave: 4, title: 'Phantom Wolf Pack', enemyCount: 4, types: ['imp', 'wolf'], prepDurationSeconds: 4, essenceReward: 22 },
  { wave: 5, title: 'MINI-BOSS: Ancient Grove Golem', enemyCount: 1, types: ['golem'], prepDurationSeconds: 5, essenceReward: 35 },
  { wave: 6, title: 'Fierce Wolf Ambush', enemyCount: 6, types: ['wolf'], prepDurationSeconds: 4, essenceReward: 28 },
  { wave: 7, title: 'Chaos Horde', enemyCount: 8, types: ['slime', 'imp', 'wolf'], prepDurationSeconds: 4, essenceReward: 34 },
  { wave: 8, title: 'Elite Golem Legion', enemyCount: 10, types: ['wolf', 'golem'], prepDurationSeconds: 4, essenceReward: 45 },
  { wave: 9, title: 'ELITE BOSS: Nether Chimera', enemyCount: 1, types: ['golem', 'boss'], prepDurationSeconds: 5, essenceReward: 60 },
  { wave: 10, title: 'FINAL BOSS: Eclipse Shadow Titan', enemyCount: 1, types: ['boss'], prepDurationSeconds: 6, essenceReward: 100 },
];

// Default 12 initial farm plots in garden grid
export const INITIAL_FARM_PLOTS: FarmPlotState[] = [
  { id: 0, x: -6, z: 2, tilled: true, watered: true, waterLevel: 1, cropId: 'carrot', plantedAt: Date.now() - 10000, growProgress: 0.7 },
  { id: 1, x: -3.5, z: 2, tilled: true, watered: true, waterLevel: 1, cropId: 'strawberry', plantedAt: Date.now() - 5000, growProgress: 0.3 },
  { id: 2, x: -1, z: 2, tilled: true, watered: false, waterLevel: 0, cropId: null, plantedAt: null, growProgress: 0 },
  { id: 3, x: 1.5, z: 2, tilled: true, watered: false, waterLevel: 0, cropId: null, plantedAt: null, growProgress: 0 },

  { id: 4, x: -6, z: 4.5, tilled: true, watered: true, waterLevel: 1, cropId: 'corn', plantedAt: Date.now() - 16000, growProgress: 0.9 },
  { id: 5, x: -3.5, z: 4.5, tilled: true, watered: false, waterLevel: 0, cropId: null, plantedAt: null, growProgress: 0 },
  { id: 6, x: -1, z: 4.5, tilled: false, watered: false, waterLevel: 0, cropId: null, plantedAt: null, growProgress: 0 },
  { id: 7, x: 1.5, z: 4.5, tilled: false, watered: false, waterLevel: 0, cropId: null, plantedAt: null, growProgress: 0 },

  { id: 8, x: -6, z: 7, tilled: true, watered: false, waterLevel: 0, cropId: null, plantedAt: null, growProgress: 0 },
  { id: 9, x: -3.5, z: 7, tilled: false, watered: false, waterLevel: 0, cropId: null, plantedAt: null, growProgress: 0 },
  { id: 10, x: -1, z: 7, tilled: false, watered: false, waterLevel: 0, cropId: null, plantedAt: null, growProgress: 0 },
  { id: 11, x: 1.5, z: 7, tilled: false, watered: false, waterLevel: 0, cropId: null, plantedAt: null, growProgress: 0 },
];

export const INITIAL_INVENTORY: Record<string, number> = {
  seed_carrot: 5,
  seed_tomato: 3,
  seed_strawberry: 3,
  seed_corn: 2,
  seed_pumpkin: 1,
  wood: 15,
  stone: 10,
  pet_treat: 8,
};
