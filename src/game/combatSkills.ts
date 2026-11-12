import { PetData } from '../types/game';
import {
  getActiveSkillEnhancementBonuses,
  getPassiveEnhancementMultiplier,
} from './petStats';

export interface MilestoneInfo {
  level: number;
  title: string;
  effect: string;
}

export interface PetBasicAttackConfig {
  name: string;
  isRanged: boolean;
  attackRange: number;
  attackInterval: number;
  damageMultiplier: number;
  animDuration: number;
}

export const PET_BASIC_ATTACK_STATS: Record<string, PetBasicAttackConfig> = {
  fox: { name: 'Fire Claw', isRanged: false, attackRange: 1.45, attackInterval: 1.05, damageMultiplier: 1.0, animDuration: 0.48 },
  turtle: { name: 'Shell Bash', isRanged: false, attackRange: 1.45, attackInterval: 1.15, damageMultiplier: 0.95, animDuration: 0.54 },
  rabbit: { name: 'Quick Kick', isRanged: false, attackRange: 1.45, attackInterval: 0.9, damageMultiplier: 0.95, animDuration: 0.44 },
  owl: { name: 'Gale Feather', isRanged: true, attackRange: 3.6, attackInterval: 1.25, damageMultiplier: 1.0, animDuration: 0.5 },
  bear: { name: 'Heavy Paw', isRanged: false, attackRange: 1.55, attackInterval: 1.25, damageMultiplier: 1.2, animDuration: 0.58 },
  slime: { name: 'Nectar Bolt', isRanged: true, attackRange: 3.6, attackInterval: 1.2, damageMultiplier: 0.95, animDuration: 0.48 },
  wolf: { name: 'Moon Fang', isRanged: false, attackRange: 1.5, attackInterval: 1.0, damageMultiplier: 1.05, animDuration: 0.48 },
  frog: { name: 'Splash Snap', isRanged: false, attackRange: 1.6, attackInterval: 1.05, damageMultiplier: 1.0, animDuration: 0.48 },
  deer: { name: 'Hoof Strike', isRanged: false, attackRange: 1.5, attackInterval: 1.05, damageMultiplier: 0.95, animDuration: 0.48 },
  dragon: { name: 'Starfire Bolt', isRanged: true, attackRange: 3.8, attackInterval: 1.25, damageMultiplier: 1.25, animDuration: 0.5 },
  phoenix: { name: 'Solar Bolt', isRanged: true, attackRange: 3.8, attackInterval: 1.25, damageMultiplier: 1.25, animDuration: 0.5 },
  // 10 New Expansion Pets
  red_panda: { name: 'Quick Claw Swipe', isRanged: false, attackRange: 1.5, attackInterval: 0.95, damageMultiplier: 0.95, animDuration: 0.45 },
  timber_wolf: { name: 'Bite', isRanged: false, attackRange: 1.55, attackInterval: 0.92, damageMultiplier: 1.12, animDuration: 0.46 },
  sylvan_deer: { name: 'Antler Strike', isRanged: false, attackRange: 1.6, attackInterval: 1.08, damageMultiplier: 0.98, animDuration: 0.5 },
  penguin: { name: 'Beak Strike', isRanged: false, attackRange: 1.45, attackInterval: 0.98, damageMultiplier: 1.0, animDuration: 0.46 },
  bat: { name: 'Sonic Projectile', isRanged: true, attackRange: 4.0, attackInterval: 1.1, damageMultiplier: 1.02, animDuration: 0.48 },
  poison_frog: { name: 'Tongue Strike', isRanged: false, attackRange: 2.1, attackInterval: 1.02, damageMultiplier: 1.02, animDuration: 0.48 },
  hedgehog: { name: 'Short Headbutt', isRanged: false, attackRange: 1.45, attackInterval: 1.05, damageMultiplier: 1.05, animDuration: 0.48 },
  bee: { name: 'Honey Projectile', isRanged: true, attackRange: 4.2, attackInterval: 0.92, damageMultiplier: 0.92, animDuration: 0.42 },
  dragon_whelp: { name: 'Small Fireball', isRanged: true, attackRange: 3.8, attackInterval: 1.15, damageMultiplier: 1.18, animDuration: 0.5 },
  capybara: { name: 'Gentle Body Bump', isRanged: false, attackRange: 1.45, attackInterval: 1.2, damageMultiplier: 0.9, animDuration: 0.52 },
};

export function getPetBasicAttackConfig(species: string): PetBasicAttackConfig {
  return (
    PET_BASIC_ATTACK_STATS[species] || {
      name: 'Basic Strike',
      isRanged: false,
      attackRange: 1.45,
      attackInterval: 1.05,
      damageMultiplier: 1.0,
      animDuration: 0.48,
    }
  );
}

export interface PetCombatConfig {
  species: string;
  name: string;
  role: string;
  active: {
    id: string;
    name: string;
    icon: string;
    baseCooldown: number;
    description: string;
    milestones: MilestoneInfo[];
  };
  passive: {
    id: string;
    name: string;
    icon: string;
    description: string;
    milestones: MilestoneInfo[];
  };
}

export const PET_COMBAT_CONFIGS: Record<string, PetCombatConfig> = {
  pet_fox: {
    species: 'fox',
    name: 'Ember',
    role: 'Damage / Mobility',
    active: {
      id: 'skill_flame_dash',
      name: 'Flame Dash',
      icon: 'Flame',
      baseCooldown: 8,
      description: 'Dash forward with blazing speed, damaging enemies along the path and leaving a searing burning trail.',
      milestones: [
        { level: 1, title: 'Flame Trail', effect: 'Deals 90 base damage and leaves a 2s fire trail.' },
        { level: 10, title: 'Ignited Momentum', effect: 'Dash speed increased by +35%; damage increases to 125.' },
        { level: 20, title: 'Searing Path', effect: 'Trail lasts 4s and widens by +40%. Cooldown reduced to 6.8s (170 damage).' },
        { level: 30, title: 'Ignition Burst', effect: 'Unleashes a radial fireburst at the end of dash, staggering enemies for 75 bonus damage.' },
        { level: 40, title: 'Blazing Phantom', effect: 'Leaves a fiery decoy at dash origin that detonates for 220 damage after 2 seconds.' },
        { level: 50, title: 'Inferno Overdrive', effect: 'Maximum potential: 320 damage, 5s cooldown, turns fire trail into molten magma.' },
      ],
    },
    passive: {
      id: 'passive_burning_spirit',
      name: 'Burning Spirit',
      icon: 'Sun',
      description: 'Enemies hit by the Fox\'s abilities receive additional burn damage over time.',
      milestones: [
        { level: 1, title: 'Kindling Sparks', effect: 'Burns targets for 20% ability damage over 3 seconds.' },
        { level: 10, title: 'Intense Heat', effect: 'Burn duration +1.5s, ticks 25% faster.' },
        { level: 20, title: 'Smoldering Cinders', effect: 'Burned enemies have their movement speed reduced by 25%.' },
        { level: 30, title: 'Spreading Embers', effect: 'When a burning enemy dies, the blaze spreads to nearby foes.' },
        { level: 40, title: 'Conflagration', effect: 'Burning enemies take +25% amplified damage from all player pet skills.' },
        { level: 50, title: 'Everburning Soul', effect: 'Burns stack up to 3 times, inflicting devastating true burn damage.' },
      ],
    },
  },

  pet_turtle: {
    species: 'turtle',
    name: 'Shelly',
    role: 'Defense / Control',
    active: {
      id: 'skill_tidal_barrier',
      name: 'Tidal Barrier',
      icon: 'Droplets',
      baseCooldown: 12,
      description: 'Summon a rotating water shield that absorbs incoming damage and pushes nearby enemies away.',
      milestones: [
        { level: 1, title: 'Hydro Ring', effect: 'Grants 70 shield health and repels enemies within 4m.' },
        { level: 10, title: 'Crest Shield', effect: 'Shield capacity +45 (115 total), knockback force increased by +30%.' },
        { level: 20, title: 'Hydro Surge', effect: 'Shield pulses water shockwaves every 1.5s, dealing 40 damage to close foes. Cooldown 10s.' },
        { level: 30, title: 'Tsunami Detonation', effect: 'When shield expires or breaks, it erupts in a tidal wave, slowing foes by 50% for 3.5s.' },
        { level: 40, title: 'Vortex Aegis', effect: 'Reflects 35% of all absorbed incoming damage back at attackers (220 shield capacity).' },
        { level: 50, title: 'Abyssal Sanctuary', effect: '340 shield capacity, 8s cooldown, grants complete immunity to stuns and knockback while active.' },
      ],
    },
    passive: {
      id: 'passive_ocean_armor',
      name: 'Ocean Armor',
      icon: 'ShieldCheck',
      description: 'Reduces incoming damage. Damage reduction increases when the player\'s health is low.',
      milestones: [
        { level: 1, title: 'Tide Guard', effect: 'Reduces incoming damage by 15%. Increases to 25% when HP is below 50%.' },
        { level: 10, title: 'Reef Plating', effect: 'Base damage reduction increases to 20%; low-HP reduction increases to 35%.' },
        { level: 20, title: 'Protective Mist', effect: 'Taking damage releases a soothing mist granting +20% movement speed.' },
        { level: 30, title: 'Shell Fortification', effect: 'Prevents the player from taking more than 25% of maximum HP from any single hit.' },
        { level: 40, title: 'Deep Current Vitality', effect: 'When below 35% HP, damage reduction reaches 50% and regenerates 3% HP/sec.' },
        { level: 50, title: 'Leviathan Carapace', effect: 'Permanent 30% baseline damage reduction; at low HP grants 65% reduction and converts 25% of blocked damage to HP.' },
      ],
    },
  },

  pet_rabbit: {
    species: 'rabbit',
    name: 'Hoppy',
    role: 'Mobility / Critical Damage',
    active: {
      id: 'skill_phantom_leap',
      name: 'Phantom Leap',
      icon: 'Rabbit',
      baseCooldown: 6,
      description: 'Leap toward a targeted location, dealing area damage upon landing.',
      milestones: [
        { level: 1, title: 'Acrobatic Impact', effect: 'Leaps high and slams down dealing 80 area damage (5.5m radius).' },
        { level: 10, title: 'Swift Trajectory', effect: 'Jump speed +30%, damage increases to 115, landing radius +20%.' },
        { level: 20, title: 'Seismic Vault', effect: 'Knocks enemies airborne for 0.6s upon landing. Cooldown reduced to 5.0s (155 damage).' },
        { level: 30, title: 'Phantom Double', effect: 'Leaves an ethereal afterimage upon landing that slashes adjacent foes for 85 bonus damage.' },
        { level: 40, title: 'Celerity Bounce', effect: 'Hitting 2 or more enemies immediately refunds 50% of Phantom Leap\'s cooldown.' },
        { level: 50, title: 'Apex Blitz', effect: '275 landing damage, guarantees a 100% Critical Hit, and vacuums enemies inward upon touchdown.' },
      ],
    },
    passive: {
      id: 'passive_predator_instinct',
      name: 'Predator Instinct',
      icon: 'Sparkles',
      description: 'Increases critical hit chance against enemies with low health.',
      milestones: [
        { level: 1, title: 'Keen Eye', effect: '+20% Critical Hit chance against enemies below 50% HP (Crits deal 160% damage).' },
        { level: 10, title: 'Hunter\'s Focus', effect: 'Crit chance +30% against low-HP foes; base crit chance +10% against all enemies.' },
        { level: 20, title: 'Adrenaline Strike', effect: 'Landing a critical hit grants +25% attack and move speed for 2.5s.' },
        { level: 30, title: 'Executioner\'s Edge', effect: 'Critical strikes against enemies below 30% HP deal 220% massive damage.' },
        { level: 40, title: 'Bloodhound Rush', effect: 'Defeating an enemy with a critical hit instantly restores 8% of the player\'s max HP.' },
        { level: 50, title: 'Apex Predator', effect: '+45% Crit Chance against all targets, +90% against low-HP foes, and crits bypass 50% armor.' },
      ],
    },
  },

  pet_owl: {
    species: 'owl',
    name: 'Barnaby',
    role: 'Ranged Damage / Crowd Control',
    active: {
      id: 'skill_cyclone',
      name: 'Cyclone',
      icon: 'Wind',
      baseCooldown: 10,
      description: 'Create a tornado that pulls enemies together and repeatedly damages them.',
      milestones: [
        { level: 1, title: 'Gale Vortex', effect: 'Spawns a 3.5s tornado pulling enemies within 6m, dealing 7 ticks of 14 damage (98 total).' },
        { level: 10, title: 'High Pressure', effect: 'Pull radius expanded to 8m; tick damage increased to 20 (140 total).' },
        { level: 20, title: 'Tempest Drag', effect: 'Vortex duration 4.5s; trapped enemies are slowed by 45% for 3s after release. Cooldown 8.5s.' },
        { level: 30, title: 'Razor Feathers', effect: 'Vortex launches 6 razor gale feathers outward at expiration, dealing 75 damage each.' },
        { level: 40, title: 'Eye of the Storm', effect: 'Enemies pulled to the center are stunned for 1.5s and take +30% damage from other abilities.' },
        { level: 50, title: 'Vortex of Doom', effect: 'Gigantic twister pulls across 12m, dealing 38 dmg/tick (304 total) and generating arc lightning.' },
      ],
    },
    passive: {
      id: 'passive_aerial_hunter',
      name: 'Aerial Hunter',
      icon: 'Eye',
      description: 'Increases damage against airborne, slowed, or grouped enemies.',
      milestones: [
        { level: 1, title: 'Flock Hunter', effect: '+20% damage against enemies that are airborne, slowed, or grouped (2+ within 3.5m).' },
        { level: 10, title: 'Raptor Precision', effect: 'Grouped/crowd-controlled bonus increased to +30%.' },
        { level: 20, title: 'Broad Horizon', effect: 'Increases the area-of-effect radius of all equipped pet abilities by +25%.' },
        { level: 30, title: 'Thermal Lift', effect: 'Airborne and stun durations inflicted on enemies are extended by +40%.' },
        { level: 40, title: 'Predatory Ambush', effect: '+25% Critical Hit chance against enemies caught in crowd control or grouped.' },
        { level: 50, title: 'Sky Sovereign', effect: '+50% damage against grouped/slowed foes; enemy deaths inside crowd control trigger an airburst for 120 damage.' },
      ],
    },
  },

  pet_bear: {
    species: 'bear',
    name: 'Grizz',
    role: 'Tank / Heavy Damage',
    active: {
      id: 'skill_earthshatter',
      name: 'Earthshatter',
      icon: 'Hammer',
      baseCooldown: 14,
      description: 'Slam the ground, creating a shockwave that damages and briefly stuns nearby enemies.',
      milestones: [
        { level: 1, title: 'Ground Tremor', effect: 'Deals 120 damage and stuns enemies in a 6.5m radius for 1.2 seconds.' },
        { level: 10, title: 'Heavy Impact', effect: 'Damage increased to 165; radius 8m; cooldown reduced to 12s.' },
        { level: 20, title: 'Tectonic Spikes', effect: 'Summons sharp earth spikes that linger for 4s, dealing 30 damage/sec to foes inside.' },
        { level: 30, title: 'Fissure Break', effect: 'Shockwave sends 3 ground fissures extending stun range to 11m.' },
        { level: 40, title: 'Armor Rupture', effect: 'Shatters enemy armor: affected targets take +35% increased damage for 5s (245 damage).' },
        { level: 50, title: 'Tectonic Cataclysm', effect: 'Massive 380 damage, 2.5s stun, creates an earthquake zone that continuously crushes and staggers foes.' },
      ],
    },
    passive: {
      id: 'passive_unyielding',
      name: 'Unyielding',
      icon: 'Dumbbell',
      description: 'Taking damage builds resistance, temporarily reducing subsequent incoming damage.',
      milestones: [
        { level: 1, title: 'Thick Hide', effect: 'Taking damage builds a Fortitude stack (+7% damage reduction for 4s, stacks up to 3 times).' },
        { level: 10, title: 'Grizzly Resolve', effect: 'Fortitude grants +9% reduction per stack, max 4 stacks (up to 36% damage reduction).' },
        { level: 20, title: 'Unstoppable Bulk', effect: 'At max Fortitude stacks, gain complete knockback immunity and +20% bonus attack damage.' },
        { level: 30, title: 'Enduring Vigor', effect: 'Stacks last 6s; taking damage at max stacks restores 12 HP (2s internal cooldown).' },
        { level: 40, title: 'Fury of the Wild', effect: 'Max stacks increased to 5 (up to 50% damage reduction); converts 20% of blocked damage into a counter-shockwave.' },
        { level: 50, title: 'Juggernaut Colossus', effect: 'Upon receiving lethal damage, survive at 1 HP and gain 100% invulnerability for 3s (75s cooldown).' },
      ],
    },
  },

  pet_slime: {
    species: 'slime',
    name: 'Boba',
    role: 'Healing / Area Damage',
    active: {
      id: 'skill_arcane_burst',
      name: 'Arcane Burst',
      icon: 'HeartHandshake',
      baseCooldown: 15,
      description: 'Release an expanding magical explosion that damages enemies and restores a portion of the player\'s health.',
      milestones: [
        { level: 1, title: 'Dewdrop Pulse', effect: 'Deals 70 area damage and restores +45 player health (5.5m radius).' },
        { level: 10, title: 'Rejuvenating Blast', effect: 'Damage 105; heals +65 HP; cooldown reduced to 13s.' },
        { level: 20, title: 'Viscous Residue', effect: 'Radius increases to 7.5m; leaves sticky slime that slows enemies by 50% for 4s.' },
        { level: 30, title: 'Bubbling Vitality', effect: 'Grants a soothing aura restoring an additional +10 HP/sec for 4s after cast.' },
        { level: 40, title: 'Prismatic Echo', effect: 'Explosion detonates twice (initial + echo) for 180 total damage, heals +95 HP.' },
        { level: 50, title: 'Supernova Gel', effect: 'Massive 280 damage nova, restores 140 HP, and spawns 3 mini-slimes that distract and taunt enemies.' },
      ],
    },
    passive: {
      id: 'passive_gelatinous_body',
      name: 'Gelatinous Body',
      icon: 'HeartPulse',
      description: 'Periodically restores a small amount of player health after avoiding damage for a short period.',
      milestones: [
        { level: 1, title: 'Regenerative Core', effect: 'After avoiding damage for 4 seconds, restores 4 HP every 2 seconds.' },
        { level: 10, title: 'Accelerated Mending', effect: 'Damage-free delay reduced to 3s; restores 7 HP every 2 seconds.' },
        { level: 20, title: 'Elastic Resilience', effect: 'Permanently increases player maximum health by +30 HP.' },
        { level: 30, title: 'Rubber Rebound', effect: 'Melee attackers hitting the player are knocked backward and slowed by 30%.' },
        { level: 40, title: 'Emergency Mitosis', effect: 'When health falls below 30%, instantly heals for 40 HP (45s cooldown).' },
        { level: 50, title: 'Living Ambrosia', effect: 'Out-of-combat heal increases to 16 HP/sec; player max HP +60; all incoming damage reduced by 15%.' },
      ],
    },
  },

  pet_frog: {
    species: 'frog',
    name: 'Puddles',
    role: 'Mobility / Hydro Burst',
    active: {
      id: 'skill_splash_hop',
      name: 'Splash Hop',
      icon: 'Droplets',
      baseCooldown: 8,
      description: 'Leap into the air and slam down, creating a tidal water wave that deals area damage and slows foes.',
      milestones: [
        { level: 1, title: 'Puddle Leap', effect: 'Deals 75 damage in a 5.5m radius and slows enemies by 25% for 2s.' },
        { level: 10, title: 'Geyser Surge', effect: 'Damage increased to 110; slow increased to 40%.' },
        { level: 20, title: 'Tidal Cascade', effect: 'Leaves a pool of water that accelerates player movement by +30%.' },
        { level: 30, title: 'Riptide Bounce', effect: 'Can be cast twice within 3 seconds before going on cooldown.' },
        { level: 40, title: 'Torrential Crash', effect: 'Damage increased to 220; knocks all hit enemies airborne.' },
        { level: 50, title: 'Tidal Monolith', effect: '310 damage, 5s cooldown, creates 4 water vortexes around impact point.' },
      ],
    },
    passive: {
      id: 'passive_swamp_blessing',
      name: 'Swamp Blessing',
      icon: 'ShieldCheck',
      description: 'Drenches nearby enemies upon taking damage, reducing their attack speed and damage dealt.',
      milestones: [
        { level: 1, title: 'Drenching Aura', effect: 'Enemies within 5m deal 12% reduced damage to the player.' },
        { level: 10, title: 'Murky Waters', effect: 'Enemy damage reduction increased to 20%; player moves 15% faster.' },
        { level: 20, title: 'Slippery Skin', effect: '15% chance to completely evade incoming attacks.' },
        { level: 30, title: 'Swamp Mire', effect: 'Enemies that attack player in melee have their attack speed slowed by 35%.' },
        { level: 40, title: 'Amphibian Grace', effect: 'Evasion chance increases to 25%; evading an attack heals 15 HP.' },
        { level: 50, title: 'Lord of the Marsh', effect: 'Enemies deal 35% reduced damage; 30% evasion; evading resets Splash Hop cooldown.' },
      ],
    },
  },

  pet_wolf: {
    species: 'wolf',
    name: 'Shadow',
    role: 'Burst Damage / Attack Buff',
    active: {
      id: 'skill_lunar_howl',
      name: 'Lunar Howl',
      icon: 'Flame',
      baseCooldown: 11,
      description: 'Unleash a terrifying lunar howl that deals damage, terrifies foes, and buffs active damage.',
      milestones: [
        { level: 1, title: 'Wolf Howl', effect: 'Deals 85 damage in 6m and grants +25% attack damage boost for 4s.' },
        { level: 10, title: 'Bloodmoon Howl', effect: 'Damage 125; attack boost +35%; duration 5s.' },
        { level: 20, title: 'Terrifying Roar', effect: 'Enemies hit are feared/staggered for 1.2s. Cooldown reduced to 9s.' },
        { level: 30, title: 'Pack Rend', effect: 'Spawns 2 shadow wolves that charge forward, tearing enemies for 90 damage each.' },
        { level: 40, title: 'Midnight Frenzy', effect: 'During attack boost, player movement speed is increased by +40% and crits heal 5% HP.' },
        { level: 50, title: 'Apex Moonfang', effect: '260 burst damage, +60% attack buff for 7s, shadow wolves persist and fight alongside player.' },
      ],
    },
    passive: {
      id: 'passive_pack_instinct',
      name: 'Pack Instinct',
      icon: 'Eye',
      description: 'Increases all pet skill damage and movement speed when enemies are nearby.',
      milestones: [
        { level: 1, title: 'Pack Bond', effect: '+15% bonus damage when fighting within 8m of enemies.' },
        { level: 10, title: 'Alpha Stance', effect: 'Damage bonus increased to +25%; move speed +15%.' },
        { level: 20, title: 'Relentless Chase', effect: '+20% Critical Hit chance against retreating or fleeing foes.' },
        { level: 30, title: 'Predatory Prowl', effect: 'Increases cooldown recovery rate of all active pet skills by +15%.' },
        { level: 40, title: 'Feral Might', effect: '+40% damage bonus when fighting multiple foes; lifesteal 10% on pet skills.' },
        { level: 50, title: 'Shadow Packmaster', effect: '+55% overall skill damage, +25% cooldown speed, kills grant a 3s 100% crit aura.' },
      ],
    },
  },

  pet_deer: {
    species: 'deer',
    name: 'Fawn',
    role: 'Mobility / Regeneration',
    active: {
      id: 'skill_nature_sprint',
      name: 'Nature Sprint',
      icon: 'Sun',
      baseCooldown: 9,
      description: 'Gallop forward with celestial grace, damaging foes, healing health, and boosting speed.',
      milestones: [
        { level: 1, title: 'Bough Charge', effect: 'Gallops forward dealing 70 damage, heals +35 HP, and gives +40% speed for 3s.' },
        { level: 10, title: 'Verdant Dash', effect: 'Damage 100; heal +50 HP; speed boost +55% for 4s.' },
        { level: 20, title: 'Floral Awakening', effect: 'Leaves a trail of healing flowers that restore 8 HP/sec to player inside.' },
        { level: 30, title: 'Blossom Trample', effect: 'Enemies caught in the dash are knocked back and blinded for 2s.' },
        { level: 40, title: 'Forest Radiance', effect: 'Damage 190; heal +85 HP; grants a 100-point nature barrier for 4s.' },
        { level: 50, title: 'Elder Spirit Sprint', effect: '280 damage, heals +120 HP, cooldown 6s, clears all negative effects and grants brief invulnerability.' },
      ],
    },
    passive: {
      id: 'passive_herbalist',
      name: 'Herbalist Vitality',
      icon: 'Sparkles',
      description: 'Increases healing effectiveness and grants a regenerating shield when at full health.',
      milestones: [
        { level: 1, title: 'Green Thumb', effect: 'All healing effects received are boosted by +20%.' },
        { level: 10, title: 'Vital Roots', effect: 'Healing boost increased to +35%; +20 maximum HP.' },
        { level: 20, title: 'Photosynthesis', effect: 'Regenerates 2 HP every second continuously in combat.' },
        { level: 30, title: 'Overgrowth Shield', effect: 'Excess healing converts into a protective bark shield up to 50 HP.' },
        { level: 40, title: 'Ancient Flora', effect: 'Healing boost +50%; bark shield capacity increases to 100 HP.' },
        { level: 50, title: 'Avatar of Spring', effect: '+70% healing received; passive regen 8 HP/s; bark shield reflects 50% damage.' },
      ],
    },
  },

  pet_dragon: {
    species: 'dragon',
    name: 'Ignis',
    role: 'Mythical Annihilation',
    active: {
      id: 'skill_inferno_nova',
      name: 'Inferno Nova',
      icon: 'Flame',
      baseCooldown: 18,
      description: 'Summons a blazing orbital supernova that annihilates all enemies in an 8.5m radius.',
      milestones: [
        { level: 1, title: 'Dragon Nova', effect: 'Deals 200 massive area damage and sets all targets on fire.' },
        { level: 10, title: 'Solar Flare Surge', effect: 'Damage increased to 280; radius 9.5m; cooldown reduced to 16s.' },
        { level: 20, title: 'Meltdown', effect: 'Supernova burns away 50% of enemy armor for 6 seconds.' },
        { level: 30, title: 'Orbital Meteor', effect: 'Calls down 3 supplementary meteors for 100 damage each around the epicenter.' },
        { level: 40, title: 'Dragonfire Cataclysm', effect: 'Damage 440; vaporizes regular enemy projectiles and staggers all foes.' },
        { level: 50, title: 'Primordial Supernova', effect: '650 apocalyptic damage, 12m radius, 12s cooldown, obliterates lesser foes instantly.' },
      ],
    },
    passive: {
      id: 'passive_dragon_might',
      name: 'Dragon Might',
      icon: 'Dumbbell',
      description: 'Permanently increases all damage dealt and burns enemies that step within melee range.',
      milestones: [
        { level: 1, title: 'Draconic Aura', effect: '+25% all skill damage dealt; melee aura burns foes for 15 dmg/s.' },
        { level: 10, title: 'Ignited Blood', effect: 'Damage bonus +40%; aura radius 5m (25 dmg/s).' },
        { level: 20, title: 'Dragon Scales', effect: 'Reduces all incoming damage by 20% and renders player immune to burns.' },
        { level: 30, title: 'Infernal Wrath', effect: '+25% Critical Hit damage and all skills have a 20% chance to trigger mini-explosions.' },
        { level: 40, title: 'Wyrm Lord', effect: 'Damage bonus +60%; aura burns for 50 dmg/s and slows enemy attack speed.' },
        { level: 50, title: 'Primordial Dragon God', effect: '+100% all damage dealt, permanent 30% damage reduction, critical hits inflict execute burn.' },
      ],
    },
  },

  pet_phoenix: {
    species: 'phoenix',
    name: 'Solara',
    role: 'Mythical Holy / Revive',
    active: {
      id: 'skill_solar_flare',
      name: 'Solar Flare',
      icon: 'Sun',
      baseCooldown: 20,
      description: 'Bathes the field in celestial dawn light, dealing holy damage and fully healing player HP.',
      milestones: [
        { level: 1, title: 'Solar Blessing', effect: 'Deals 180 holy damage to all foes and restores 80 HP to the player.' },
        { level: 10, title: 'Sunburst', effect: 'Damage 260; fully restores 100% player HP; cooldown reduced to 18s.' },
        { level: 20, title: 'Blinding Luminescence', effect: 'Blinds and stuns all enemies for 2 seconds upon flare detonation.' },
        { level: 30, title: 'Solar Rays', effect: 'Leaves a celestial sunbeam for 5s that continuously burns foes and heals player.' },
        { level: 40, title: 'Dawnfire Judgment', effect: 'Damage 420; grants complete damage immunity for 3 seconds after cast.' },
        { level: 50, title: 'Solar Rebirth Call', effect: '600 holy damage, 14s cooldown, 100% full heal, grants 5s divine shield and +50% speed.' },
      ],
    },
    passive: {
      id: 'passive_eternal_dawn',
      name: 'Eternal Dawn',
      icon: 'ShieldCheck',
      description: 'Prevents fatal damage once per run, immediately reviving the player with restored health.',
      milestones: [
        { level: 1, title: 'Phoenix Rebirth', effect: 'Upon fatal damage, revive with 50% HP and trigger a holy blast (once per instance).' },
        { level: 10, title: 'Ascending Flame', effect: 'Revives with 75% HP; holy blast stuns all enemies for 3s.' },
        { level: 20, title: 'Solar Regeneration', effect: 'Passive health regeneration of 4 HP every second permanently.' },
        { level: 30, title: 'Sunfire Shield', effect: 'Taking damage has a 20% chance to unleash a radiant burst dealing 60 damage.' },
        { level: 40, title: 'Immortal Radiance', effect: 'Revives with 100% HP and 4s complete damage invulnerability.' },
        { level: 50, title: 'Everlasting Phoenix', effect: 'Revive can trigger twice per instance run; passive regen 12 HP/s; all holy damage +50%.' },
      ],
    },
  },

  // --- 10 NEW EXPANSION PETS ---
  pet_red_panda: {
    species: 'red_panda',
    name: 'Red Panda',
    role: 'Support / Healing',
    active: {
      id: 'skill_healing_leaves',
      name: 'Healing Leaves',
      icon: 'HeartPulse',
      baseCooldown: 12,
      description: 'Creates an area that gradually heals the player.',
      milestones: [
        { level: 1, title: 'Leaf Sanctuary', effect: 'Summons a 5s leaf grove restoring 12 HP/sec and dealing 40 nature damage.' },
        { level: 10, title: 'Herbal Breeze', effect: 'Heal ticks increase to 17 HP/sec; radius expands to 6.5m.' },
        { level: 20, title: 'Soothing Petals', effect: 'Duration increases to 6s; grants +15% movement speed inside the grove.' },
        { level: 30, title: 'Reviving Canopy', effect: 'Heal ticks reach 24 HP/sec and cleanse slow effects.' },
        { level: 40, title: 'Evergreen Bloom', effect: 'Burst-heals 55 HP on cast plus 30 HP/sec over 6.5s.' },
        { level: 50, title: 'Elder Bamboo Grove', effect: 'Restores 40 HP/sec across 8m, deals 180 area damage, cooldown 8.5s.' },
      ],
    },
    passive: {
      id: 'passive_gentle_nature',
      name: 'Gentle Nature',
      icon: 'HeartHandshake',
      description: 'Increases healing received.',
      milestones: [
        { level: 1, title: 'Warm Care', effect: 'Increases all healing received by +15%.' },
        { level: 10, title: 'Tender Touch', effect: 'Healing received bonus increases to +22%.' },
        { level: 20, title: 'Tranquil Spirit', effect: 'Healing received +28%; healing skills also grant +10% defense for 3s.' },
        { level: 30, title: 'Blossom Grace', effect: 'Healing received +35%.' },
        { level: 40, title: 'Verdant Aura', effect: 'Healing received +42%; restores 10 bonus HP after every wave.' },
        { level: 50, title: 'Spirit of Serenity', effect: 'Healing received +50% and excess healing converts into a temporary barrier.' },
      ],
    },
  },

  pet_timber_wolf: {
    species: 'timber_wolf',
    name: 'Timber Wolf',
    role: 'Physical Damage',
    active: {
      id: 'skill_pack_assault',
      name: 'Pack Assault',
      icon: 'Flame',
      baseCooldown: 9,
      description: 'Performs a powerful forward charge.',
      milestones: [
        { level: 1, title: 'Feral Charge', effect: 'Charges forward dealing 105 physical damage along the path.' },
        { level: 10, title: 'Savage Lunge', effect: 'Charge damage increases to 145 and knocks enemies back.' },
        { level: 20, title: 'Twin Fangs', effect: 'Follows charge with a sweeping fang cleave for +55 damage.' },
        { level: 30, title: 'Alpha Momentum', effect: 'Cooldown reduced to 7s; gains +25% bonus damage if charging 1 target.' },
        { level: 40, title: 'Predator Rush', effect: 'Deals 250 physical damage and briefly stuns impacted enemies.' },
        { level: 50, title: 'Apex Rampage', effect: 'Deals 340 crushing physical damage across a wide charge lane.' },
      ],
    },
    passive: {
      id: 'passive_hunters_instinct',
      name: "Hunter's Instinct",
      icon: 'Eye',
      description: 'Increases damage against isolated enemies.',
      milestones: [
        { level: 1, title: 'Lone Prey', effect: '+20% damage against isolated enemies (no other foes within 4m).' },
        { level: 10, title: 'Stalking Gaze', effect: 'Isolated enemy damage bonus increases to +28%.' },
        { level: 20, title: 'Cornered Quarry', effect: '+34% damage and +15% crit chance vs isolated targets.' },
        { level: 30, title: 'Relentless Fang', effect: 'Isolated bonus increases to +40%.' },
        { level: 40, title: 'Ruthless Pursuit', effect: '+46% damage against isolated enemies; +15% move speed.' },
        { level: 50, title: 'Apex Stalker', effect: '+55% damage and guaranteed 1.8x critical strike chance boost vs isolated foes.' },
      ],
    },
  },

  pet_sylvan_deer: {
    species: 'sylvan_deer',
    name: 'Sylvan Deer',
    role: 'Support / Defense',
    active: {
      id: 'skill_natures_blessing',
      name: "Nature's Blessing",
      icon: 'ShieldCheck',
      baseCooldown: 13,
      description: 'Creates a protective nature field.',
      milestones: [
        { level: 1, title: 'Ward of Leaves', effect: 'Creates a 5s protective field granting +60 barrier and 25% damage reduction.' },
        { level: 10, title: 'Rooted Sanctuary', effect: 'Barrier increases to +95; field slows enemies entering by 25%.' },
        { level: 20, title: 'Bough Canopy', effect: 'Field lasts 6s and grants +30% damage reduction.' },
        { level: 30, title: 'Ancient Bark', effect: 'Restores 35 HP on cast and grants +130 barrier.' },
        { level: 40, title: 'Grove Bastion', effect: 'Field deals 60 pulsing nature damage to encroaching foes.' },
        { level: 50, title: 'Heartwood Aegis', effect: '+220 barrier, 40% damage reduction for 7s, 9s cooldown.' },
      ],
    },
    passive: {
      id: 'passive_forest_guardian',
      name: 'Forest Guardian',
      icon: 'Shield',
      description: 'Improves player defense.',
      milestones: [
        { level: 1, title: 'Bark Skin', effect: 'Reduces all incoming damage by 12%.' },
        { level: 10, title: 'Oakguard', effect: 'Defense bonus increases to 16% incoming damage reduction.' },
        { level: 20, title: 'Thicket Ward', effect: '20% damage reduction and +15 max HP.' },
        { level: 30, title: 'Elderwood Mail', effect: '24% damage reduction against all attacks.' },
        { level: 40, title: 'Sylvan Bulwark', effect: '28% damage reduction; reduces boss hit burst.' },
        { level: 50, title: 'Immortal Sentinel', effect: 'Permanent 34% incoming damage reduction.' },
      ],
    },
  },

  pet_penguin: {
    species: 'penguin',
    name: 'Penguin',
    role: 'Control / Ice',
    active: {
      id: 'skill_frozen_slide',
      name: 'Frozen Slide',
      icon: 'Droplets',
      baseCooldown: 9,
      description: 'Slides forward, damaging and slowing enemies.',
      milestones: [
        { level: 1, title: 'Glacier Dash', effect: 'Slides forward dealing 85 frost damage and slowing hit foes by 40% for 3.5s.' },
        { level: 10, title: 'Permafrost Wake', effect: 'Damage 120; slow strength increases to 50%.' },
        { level: 20, title: 'Frostbite Trail', effect: 'Leaves an icy trail for 4s that chills chasing enemies.' },
        { level: 30, title: 'Icebreaker', effect: 'Cooldown reduced to 7s; deals +35% bonus damage to slowed enemies.' },
        { level: 40, title: 'Blizzard Glide', effect: 'Deals 210 frost damage and freezes enemies briefly (0.8s stun).' },
        { level: 50, title: 'Polar Avalanche', effect: '295 damage, 65% slow for 4.5s, 1.2s freeze stun.' },
      ],
    },
    passive: {
      id: 'passive_chilly_presence',
      name: 'Chilly Presence',
      icon: 'Wind',
      description: 'Improves damage against slowed enemies.',
      milestones: [
        { level: 1, title: 'Frostbite', effect: '+20% damage against slowed enemies.' },
        { level: 10, title: 'Biting Gale', effect: '+28% damage against slowed enemies.' },
        { level: 20, title: 'Rime Shatter', effect: '+34% damage against slowed enemies; extends slow durations by +25%.' },
        { level: 30, title: 'Deep Freeze', effect: '+40% damage against slowed enemies.' },
        { level: 40, title: 'Glacial Focus', effect: '+46% damage and +15% crit chance vs slowed foes.' },
        { level: 50, title: 'Absolute Zero', effect: '+55% damage against slowed enemies.' },
      ],
    },
  },

  pet_bat: {
    species: 'bat',
    name: 'Bat',
    role: 'Ranged / Lifesteal',
    active: {
      id: 'skill_blood_echo',
      name: 'Blood Echo',
      icon: 'Zap',
      baseCooldown: 11,
      description: 'Releases an energy wave that damages enemies and restores some player health.',
      milestones: [
        { level: 1, title: 'Crimson Pulse', effect: 'Emits a sonic wave dealing 90 damage and restoring 28 HP (+8 HP per hit enemy).' },
        { level: 10, title: 'Vampiric Resonance', effect: 'Wave damage 125; restores 38 HP + 10 HP per hit enemy.' },
        { level: 20, title: 'Echoing Drain', effect: 'Wave radius expands to 7.5m; weakens enemies for 3s.' },
        { level: 30, title: 'Nightmare Shriek', effect: 'Cooldown reduced to 8.5s; heals 50 HP + 12 HP per hit enemy.' },
        { level: 40, title: 'Sanguine Surge', effect: 'Deals 220 damage and restores up to 110 HP.' },
        { level: 50, title: 'Nocturnal Eclipse', effect: '300 sonic damage across 9m, massive lifesteal recovery.' },
      ],
    },
    passive: {
      id: 'passive_night_hunter',
      name: 'Night Hunter',
      icon: 'Eye',
      description: 'Improves damage against weakened enemies.',
      milestones: [
        { level: 1, title: 'Blood Scent', effect: '+20% damage against weakened enemies (below 60% HP or afflicted).' },
        { level: 10, title: 'Dusk Stalker', effect: '+28% damage against weakened enemies.' },
        { level: 20, title: 'Twilight Fang', effect: '+34% damage vs weakened enemies and +5% lifesteal on skills.' },
        { level: 30, title: 'Shadow Predator', effect: '+40% damage against weakened enemies.' },
        { level: 40, title: 'Crimson Precision', effect: '+46% damage against weakened enemies.' },
        { level: 50, title: 'Lord of Dusk', effect: '+55% damage vs weakened foes and skills restore bonus HP on kill.' },
      ],
    },
  },

  pet_poison_frog: {
    species: 'poison_frog',
    name: 'Venom Frog',
    role: 'Control / Poison',
    active: {
      id: 'skill_toxic_tongue',
      name: 'Toxic Tongue',
      icon: 'Droplets',
      baseCooldown: 10,
      description: 'Strikes an enemy and creates a damaging poison area.',
      milestones: [
        { level: 1, title: 'Venom Lash', effect: 'Strikes for 80 damage and spawns a 4.5s poison mire (22 dmg/tick + slow).' },
        { level: 10, title: 'Bog Acid', effect: 'Strike damage 115; poison ticks deal 30 damage.' },
        { level: 20, title: 'Noxious Cloud', effect: 'Poison pool radius expands to 5.5m and slows foes by 40%.' },
        { level: 30, title: 'Corrosive Spit', effect: 'Poisoned foes take +15% increased damage.' },
        { level: 40, title: 'Mire Eruption', effect: 'Initial strike deals 195 damage; pool lasts 6s.' },
        { level: 50, title: 'Plague Marsh', effect: '280 strike damage + massive 6s toxic zone dealing 55 dmg/tick.' },
      ],
    },
    passive: {
      id: 'passive_poison_resistance',
      name: 'Poison Resistance',
      icon: 'ShieldCheck',
      description: 'Reduces incoming poison damage.',
      milestones: [
        { level: 1, title: 'Toxin Filter', effect: 'Reduces incoming poison/hazard damage by 35% and general hits by 8%.' },
        { level: 10, title: 'Antivenom Gland', effect: 'Poison/hazard damage reduced by 45%; general damage reduced by 11%.' },
        { level: 20, title: 'Alchemical Skin', effect: 'Poison/hazard damage reduced by 55%; general damage reduced by 14%.' },
        { level: 30, title: 'Immunity Serum', effect: 'Poison/hazard damage reduced by 65%; general damage reduced by 17%.' },
        { level: 40, title: 'Venom Ward', effect: 'Poison/hazard damage reduced by 75%; general damage reduced by 20%.' },
        { level: 50, title: 'Pure Antidote', effect: '85% poison/hazard resistance and 24% general damage mitigation.' },
      ],
    },
  },

  pet_hedgehog: {
    species: 'hedgehog',
    name: 'Hedgehog',
    role: 'Defense / Counterattack',
    active: {
      id: 'skill_spiky_roll',
      name: 'Spiky Roll',
      icon: 'Hammer',
      baseCooldown: 8,
      description: 'Rolls forward, damaging enemies along its path.',
      milestones: [
        { level: 1, title: 'Quill Dash', effect: 'Rolls forward dealing 95 damage and knocking enemies aside.' },
        { level: 10, title: 'Iron Spines', effect: 'Roll damage increases to 135; briefly grants +40 shield.' },
        { level: 20, title: 'Pinwheel Impact', effect: 'Cooldown reduced to 6.5s; radius widens.' },
        { level: 30, title: 'Needle Scatter', effect: 'Fires quills at roll end dealing 65 extra area damage.' },
        { level: 40, title: 'Armored Juggernaut', effect: 'Deals 225 damage and stuns enemies for 1s.' },
        { level: 50, title: 'Steel Tempest Roll', effect: '310 damage, 5s cooldown, +100 shield on roll.' },
      ],
    },
    passive: {
      id: 'passive_thorny_hide',
      name: 'Thorny Hide',
      icon: 'Shield',
      description: 'Improves player defense against nearby enemies.',
      milestones: [
        { level: 1, title: 'Bristled Quills', effect: 'Reduces damage from nearby enemies (within 3.5m) by 18% and reflects 15%.' },
        { level: 10, title: 'Barbed Coat', effect: 'Close-range defense +24%; reflects 22% melee damage.' },
        { level: 20, title: 'Spiked Carapace', effect: 'Close-range defense +28%; reflects 28% damage.' },
        { level: 30, title: 'Iron Briars', effect: 'Close-range defense +32%; reflects 35% damage.' },
        { level: 40, title: 'Quill Counter', effect: 'Close-range defense +36%; attackers are slowed briefly.' },
        { level: 50, title: 'Fortress of Needles', effect: 'Reduces nearby enemy damage by 42% and reflects 50% back.' },
      ],
    },
  },

  pet_bee: {
    species: 'bee',
    name: 'Bee',
    role: 'Ranged / Speed',
    active: {
      id: 'skill_honey_barrage',
      name: 'Honey Barrage',
      icon: 'Sparkles',
      baseCooldown: 8,
      description: 'Fires several magical honey projectiles.',
      milestones: [
        { level: 1, title: 'Nectar Volley', effect: 'Fires 5 golden honey bolts for 30 damage each (150 total) and slows targets.' },
        { level: 10, title: 'Royal Swarm', effect: 'Fires 6 honey bolts dealing 38 damage each (228 total).' },
        { level: 20, title: 'Sticky Glaze', effect: 'Bolts slow enemies by 40% for 3s; cooldown 6.5s.' },
        { level: 30, title: 'Pollen Burst', effect: 'Fires 7 bolts with small splash detonations on hit.' },
        { level: 40, title: 'Golden Hail', effect: 'Fires 8 bolts for 52 damage each.' },
        { level: 50, title: 'Queen’s Barrage', effect: 'Unleashes 9 homing honey bolts for 65 damage each (585 total).' },
      ],
    },
    passive: {
      id: 'passive_swift_wings',
      name: 'Swift Wings',
      icon: 'Wind',
      description: 'Improves player movement speed.',
      milestones: [
        { level: 1, title: 'Tailwind', effect: 'Increases player movement speed by +12%.' },
        { level: 10, title: 'Darting Flight', effect: 'Increases movement speed by +16%.' },
        { level: 20, title: 'Humming Tempo', effect: 'Increases movement speed by +20%.' },
        { level: 30, title: 'Bumble Breeze', effect: 'Increases movement speed by +24% and trims skill cooldowns slightly.' },
        { level: 40, title: 'Zephyr Wings', effect: 'Increases movement speed by +28%.' },
        { level: 50, title: 'Supersonic Hive', effect: 'Increases player movement speed by +34%.' },
      ],
    },
  },

  pet_dragon_whelp: {
    species: 'dragon_whelp',
    name: 'Dragon Whelp',
    role: 'Fire / Burst Damage',
    active: {
      id: 'skill_ember_breath',
      name: 'Ember Breath',
      icon: 'Flame',
      baseCooldown: 10,
      description: 'Breathes fire in a cone.',
      milestones: [
        { level: 1, title: 'Cinder Cone', effect: 'Breathes fire in a 7m forward cone dealing 125 fire damage and burning foes.' },
        { level: 10, title: 'Scorching Jet', effect: 'Cone range 8m; deals 175 fire damage with stronger burn DoT.' },
        { level: 20, title: 'Molten Gust', effect: 'Cooldown reduced to 8s; cone widens and staggers hit foes.' },
        { level: 30, title: 'Blaze Flare', effect: 'Deals 250 fire damage and melts enemy defenses.' },
        { level: 40, title: 'Wyrmfire Surge', effect: 'Deals 330 fire damage across a 9m blazing arc.' },
        { level: 50, title: 'Infernal Hatchling', effect: '450 burst fire damage in a wide cone, scorching all foes for 5s.' },
      ],
    },
    passive: {
      id: 'passive_dragon_heart',
      name: 'Dragon Heart',
      icon: 'Sun',
      description: 'Improves player fire damage.',
      milestones: [
        { level: 1, title: 'Kindled Core', effect: 'Increases all player fire skill & burn damage by +20%.' },
        { level: 10, title: 'Ember Pulse', effect: 'Fire damage increased by +28%.' },
        { level: 20, title: 'Searing Blood', effect: 'Fire damage increased by +35%; burn duration +1s.' },
        { level: 30, title: 'Flame Resonance', effect: 'Fire damage increased by +42%.' },
        { level: 40, title: 'Pyre Heart', effect: 'Fire damage increased by +50%.' },
        { level: 50, title: 'Primordial Furnace', effect: 'Fire damage increased by +65% and burns ignite adjacent enemies.' },
      ],
    },
  },

  pet_capybara: {
    species: 'capybara',
    name: 'Capybara',
    role: 'Support / Defense',
    active: {
      id: 'skill_calm_aura',
      name: 'Calm Aura',
      icon: 'ShieldCheck',
      baseCooldown: 14,
      description: 'Creates an area that reduces damage received.',
      milestones: [
        { level: 1, title: 'Tranquil Zone', effect: 'Creates a 5s calm sanctuary reducing damage received by 30% and healing 20 HP.' },
        { level: 10, title: 'Hot Spring Mist', effect: 'Damage reduction increases to 36%; restores 35 HP.' },
        { level: 20, title: 'Zen Ripple', effect: 'Aura lasts 6s across 6.5m and gently pushes aggressive enemies back.' },
        { level: 30, title: 'Serene Sanctuary', effect: 'Damage reduction 42%; heals 12 HP/sec inside.' },
        { level: 40, title: 'Unbothered', effect: 'Damage reduction 48%; grants stagger immunity inside aura.' },
        { level: 50, title: 'Nirvana Oasis', effect: '55% damage reduction for 7s, restores 120 HP total, 10s cooldown.' },
      ],
    },
    passive: {
      id: 'passive_peaceful_companion',
      name: 'Peaceful Companion',
      icon: 'HeartHandshake',
      description: 'Gradually improves player health recovery outside combat.',
      milestones: [
        { level: 1, title: 'Cozy Rest', effect: 'After 3s without taking damage, restores 5 HP every 2s.' },
        { level: 10, title: 'Easygoing', effect: 'Out-of-combat recovery increases to 8 HP every 2s.' },
        { level: 20, title: 'Warm Presence', effect: 'Out-of-combat delay reduced to 2.5s; heals 11 HP every 2s.' },
        { level: 30, title: 'Meadow Nap', effect: 'Also restores +2 HP/sec passively and +15 Max HP.' },
        { level: 40, title: 'Tranquil Bond', effect: 'Out-of-combat recovery reaches 16 HP every 2s.' },
        { level: 50, title: 'Master of Chill', effect: 'Restores 22 HP every 2s outside combat and boosts all recovery by +20%.' },
      ],
    },
  },
};

/**
 * Calculates current active milestone tier and descriptions
 */
export function getMilestoneTier(level: number): number {
  if (level >= 50) return 50;
  if (level >= 40) return 40;
  if (level >= 30) return 30;
  if (level >= 20) return 20;
  if (level >= 10) return 10;
  return 1;
}

export function getPetCombatConfig(petId: string): PetCombatConfig | null {
  return PET_COMBAT_CONFIGS[petId] || null;
}

/**
 * Formats level bonus text for UI display
 */
export function formatSkillLevelBonus(petId: string, skillType: 'active' | 'passive', level: number): string {
  const cfg = PET_COMBAT_CONFIGS[petId];
  if (!cfg) return `Level ${level} mastery (+${level * 5}% effectiveness)`;

  const skillData = skillType === 'active' ? cfg.active : cfg.passive;
  const currentMilestone = [...skillData.milestones]
    .reverse()
    .find((m) => level >= m.level) || skillData.milestones[0];

  const nextMilestone = skillData.milestones.find((m) => level < m.level);

  let text = `[Lv.${currentMilestone.level} ${currentMilestone.title}] ${currentMilestone.effect}`;
  if (nextMilestone) {
    text += ` | Next at Lv.${nextMilestone.level}: ${nextMilestone.title}`;
  } else {
    text += ` | ⭐ MAX POTENTIAL REACHED!`;
  }
  return text;
}

/**
 * Computes passive skill effectiveness multiplier from Pet Training Passive Skill Enhancement level.
 */
export function computePassiveEnhancementMultiplier(passiveEnhancementLevel: number = 0): number {
  return getPassiveEnhancementMultiplier(passiveEnhancementLevel);
}

/**
 * Computes dynamic combat scaling based on pet level and Active Skill Enhancement level (0..5)
 */
export function computeActiveSkillStats(
  petId: string,
  level: number,
  activeEnhancementLevel: number = 0
) {
  const cfg = PET_COMBAT_CONFIGS[petId];
  const enh = getActiveSkillEnhancementBonuses(activeEnhancementLevel);
  const scalePower = (v: number) => Math.round(v * enh.powerMultiplier);
  const scaleRadius = (v: number) => Number((v * enh.areaMultiplier).toFixed(2));
  const scaleCd = (v: number, floor: number) =>
    Math.max(Number((floor * enh.cooldownMultiplier).toFixed(1)), Math.round(v * enh.cooldownMultiplier * 10) / 10);

  if (!cfg) {
    return {
      damage: scalePower(80 + level * 10),
      cooldown: scaleCd(10, 4.0),
      radius: scaleRadius(5),
      heal: 0,
      shield: 0,
      stunDuration: 0,
    };
  }

  const baseCd = cfg.active.baseCooldown;
  const cdReductionFactor = Math.max(0.55, 1 - (level - 1) * 0.012);
  const calculatedCd = Math.round(baseCd * cdReductionFactor * 10) / 10;

  switch (petId) {
    case 'pet_fox':
      return {
        damage: scalePower(90 + level * 4.6), // 90 -> 320 at Lv 50
        cooldown: scaleCd(Math.max(5.0, calculatedCd), 3.8),
        radius: scaleRadius(5.5),
        burnDmgPerTick: scalePower(15 + level * 1.5),
        burnTicks: level >= 10 ? 8 : 6,
        dashSpeedMultiplier: 1.75 + Math.min(0.75, level * 0.015),
        hasDecoy: level >= 40,
        hasIgnitionBurst: level >= 30,
        isOverdrive: level >= 50,
      };

    case 'pet_turtle':
      return {
        damage: scalePower(40 + level * 2.5),
        shield: scalePower(70 + level * 5.4), // 70 -> 340 at Lv 50
        cooldown: scaleCd(Math.max(8.0, calculatedCd), 6.0),
        radius: scaleRadius(4.5 + Math.min(2.5, level * 0.05)),
        knockbackForce: 1.5 + Math.min(1.5, level * 0.03),
        reflectPct: level >= 40 ? 0.35 : 0,
        slowPct: level >= 30 ? 0.5 : 0.25,
        ccImmunity: level >= 50,
      };

    case 'pet_rabbit':
      return {
        damage: scalePower(80 + level * 3.9), // 80 -> 275 at Lv 50
        cooldown: scaleCd(Math.max(4.5, calculatedCd), 3.5),
        radius: scaleRadius(5.5 + Math.min(2.0, level * 0.04)),
        knockbackAirborne: level >= 20,
        hasAfterimage: level >= 30,
        cooldownRefundOnMultiHit: level >= 40,
        guaranteedCrit: level >= 50,
      };

    case 'pet_owl':
      return {
        tickDamage: scalePower(14 + level * 0.48), // 14 -> 38 at Lv 50
        totalTicks: level >= 20 ? 9 : 7,
        cooldown: scaleCd(Math.max(7.5, calculatedCd), 5.5),
        radius: scaleRadius(6.0 + Math.min(6.0, level * 0.12)), // 6m -> 12m at Lv 50
        duration: Number(((level >= 20 ? 4.5 : 3.5) * (1 + activeEnhancementLevel * 0.04)).toFixed(1)),
        razorFeathers: level >= 30,
        centerStun: level >= 40,
        isVortexOfDoom: level >= 50,
      };

    case 'pet_bear':
      return {
        damage: scalePower(120 + level * 5.2), // 120 -> 380 at Lv 50
        cooldown: scaleCd(Math.max(10.0, calculatedCd), 7.5),
        radius: scaleRadius(6.5 + Math.min(4.5, level * 0.09)), // 6.5m -> 11m
        stunDuration: level >= 50 ? 2.5 : level >= 10 ? 1.5 : 1.2,
        lingeringSpikes: level >= 20,
        armorRupture: level >= 40,
        cataclysmZone: level >= 50,
      };

    case 'pet_slime':
      return {
        damage: scalePower(70 + level * 4.2), // 70 -> 280 at Lv 50
        heal: scalePower(45 + level * 1.9), // 45 -> 140 at Lv 50
        cooldown: scaleCd(Math.max(11.0, calculatedCd), 8.0),
        radius: scaleRadius(5.5 + Math.min(3.5, level * 0.07)),
        slowDuration: level >= 20 ? 4.0 : 0,
        lingeringHealOverTime: level >= 30,
        doubleEcho: level >= 40,
        miniSlimes: level >= 50,
      };

    case 'pet_frog':
      return {
        damage: scalePower(75 + level * 4.7),
        cooldown: scaleCd(Math.max(5.0, calculatedCd), 4.0),
        radius: scaleRadius(5.5 + Math.min(2.5, level * 0.05)),
        slowPct: level >= 10 ? 0.4 : 0.25,
        doubleCast: level >= 30,
      };

    case 'pet_wolf':
      return {
        damage: scalePower(85 + level * 3.5),
        attackBoostPct: Number(((0.25 + Math.min(0.35, level * 0.007)) * enh.powerMultiplier).toFixed(2)),
        cooldown: scaleCd(Math.max(8.0, calculatedCd), 6.0),
        radius: scaleRadius(6.0),
        fearDuration: level >= 20 ? 1.2 : 0,
        spawnShadowWolves: level >= 30,
      };

    case 'pet_deer':
      return {
        damage: scalePower(70 + level * 4.2),
        heal: scalePower(35 + level * 1.7),
        speedBoost: 0.4 + Math.min(0.4, level * 0.008),
        cooldown: scaleCd(Math.max(6.0, calculatedCd), 4.5),
        radius: scaleRadius(5.0),
      };

    case 'pet_dragon':
      return {
        damage: scalePower(200 + level * 9.0), // 200 -> 650
        cooldown: scaleCd(Math.max(12.0, calculatedCd), 9.0),
        radius: scaleRadius(8.5 + Math.min(3.5, level * 0.07)),
        burnTargets: true,
        extraMeteors: level >= 30,
      };

    case 'pet_phoenix':
      return {
        damage: scalePower(180 + level * 8.4), // 180 -> 600
        heal: level >= 10 ? 9999 : scalePower(80 + level * 3.0), // full heal from Lv 10+
        cooldown: scaleCd(Math.max(14.0, calculatedCd), 10.0),
        radius: scaleRadius(8.0),
        blindStun: level >= 20,
        divineShield: level >= 40,
      };

    // 10 New Expansion Pets
    case 'pet_red_panda':
      return {
        damage: scalePower(40 + level * 2.8),
        healPerTick: scalePower(12 + level * 0.56),
        burstHeal: level >= 40 ? scalePower(55) : 0,
        duration: Number(((level >= 40 ? 6.5 : level >= 20 ? 6.0 : 5.0) * (1 + activeEnhancementLevel * 0.04)).toFixed(1)),
        cooldown: scaleCd(Math.max(8.5, calculatedCd), 6.5),
        radius: scaleRadius(level >= 50 ? 8.0 : level >= 10 ? 6.5 : 5.5),
      };

    case 'pet_timber_wolf':
      return {
        damage: scalePower(105 + level * 4.7),
        cooldown: scaleCd(Math.max(6.0, calculatedCd), 4.5),
        radius: scaleRadius(5.5),
        knockbackForce: level >= 10 ? 1.8 : 1.0,
        stunDuration: level >= 40 ? 1.0 : 0,
      };

    case 'pet_sylvan_deer':
      return {
        damage: scalePower(level >= 40 ? Math.round(60 + level * 1.6) : Math.round(45 + level * 1.2)),
        shield: scalePower(60 + level * 3.2),
        heal: level >= 30 ? scalePower(35) : 0,
        defensePct: Math.min(50, Math.round((25 + Math.floor(level / 3)) * enh.powerMultiplier)),
        duration: Number(((level >= 50 ? 7.0 : level >= 20 ? 6.0 : 5.0) * (1 + activeEnhancementLevel * 0.04)).toFixed(1)),
        cooldown: scaleCd(Math.max(9.0, calculatedCd), 6.8),
        radius: scaleRadius(6.0),
      };

    case 'pet_penguin':
      return {
        damage: scalePower(85 + level * 4.2),
        cooldown: scaleCd(Math.max(6.5, calculatedCd), 4.8),
        radius: scaleRadius(5.2),
        slowPct: level >= 50 ? 0.65 : level >= 10 ? 0.5 : 0.4,
        slowDuration: level >= 50 ? 4.5 : 3.5,
        stunDuration: level >= 50 ? 1.2 : level >= 40 ? 0.8 : 0,
      };

    case 'pet_bat':
      return {
        damage: scalePower(90 + level * 4.2),
        baseHeal: scalePower(28 + level * 1.2),
        healPerTarget: scalePower(8 + Math.floor(level / 8)),
        cooldown: scaleCd(Math.max(7.5, calculatedCd), 5.6),
        radius: scaleRadius(level >= 50 ? 9.0 : level >= 20 ? 7.5 : 6.2),
      };

    case 'pet_poison_frog':
      return {
        damage: scalePower(80 + level * 4.0),
        tickDamage: scalePower(22 + level * 0.66),
        duration: Number(((level >= 40 ? 6.0 : 4.5) * (1 + activeEnhancementLevel * 0.04)).toFixed(1)),
        cooldown: scaleCd(Math.max(7.0, calculatedCd), 5.2),
        radius: scaleRadius(level >= 20 ? 5.5 : 4.5),
        slowPct: level >= 20 ? 0.4 : 0.25,
      };

    case 'pet_hedgehog':
      return {
        damage: scalePower(95 + level * 4.3),
        shield: level >= 50 ? scalePower(100) : level >= 10 ? scalePower(40) : 0,
        cooldown: scaleCd(Math.max(5.0, calculatedCd), 3.8),
        radius: scaleRadius(level >= 20 ? 5.5 : 4.5),
        stunDuration: level >= 40 ? 1.0 : 0,
      };

    case 'pet_bee': {
      const boltCount = level >= 50 ? 9 : level >= 40 ? 8 : level >= 30 ? 7 : level >= 10 ? 6 : 5;
      const dmgPerBolt = scalePower(30 + level * 0.7);
      return {
        damage: dmgPerBolt * boltCount,
        dmgPerBolt,
        boltCount,
        cooldown: scaleCd(Math.max(5.5, calculatedCd), 4.2),
        radius: scaleRadius(9.0),
        slowPct: level >= 20 ? 0.4 : 0.25,
      };
    }

    case 'pet_dragon_whelp':
      return {
        damage: scalePower(125 + level * 6.5),
        cooldown: scaleCd(Math.max(6.5, calculatedCd), 4.8),
        radius: scaleRadius(level >= 40 ? 9.0 : level >= 10 ? 8.0 : 7.0),
        burnDmgPerTick: scalePower(16 + level * 1.2),
        isFireSkill: true,
      };

    case 'pet_capybara':
      return {
        damage: 0,
        heal: scalePower(20 + level * 2.0),
        defensePct: Math.min(62, Math.round((30 + Math.floor(level * 0.5)) * enh.powerMultiplier)),
        duration: Number(((level >= 50 ? 7.0 : level >= 20 ? 6.0 : 5.0) * (1 + activeEnhancementLevel * 0.04)).toFixed(1)),
        cooldown: scaleCd(Math.max(10.0, calculatedCd), 7.5),
        radius: scaleRadius(level >= 20 ? 6.5 : 5.5),
      };

    default:
      return {
        damage: scalePower(80 + level * 10),
        cooldown: scaleCd(calculatedCd, 4.0),
        radius: scaleRadius(6.0),
        heal: 0,
        shield: 0,
        stunDuration: 0,
      };
  }
}
