import { PetData } from '../types/game';

export interface MilestoneInfo {
  level: number;
  title: string;
  effect: string;
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
 * Computes dynamic combat scaling based on pet level
 */
export function computeActiveSkillStats(petId: string, level: number) {
  const cfg = PET_COMBAT_CONFIGS[petId];
  if (!cfg) {
    return {
      damage: 80 + level * 10,
      cooldown: 10,
      radius: 5,
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
        damage: Math.round(90 + level * 4.6), // 90 -> 320 at Lv 50
        cooldown: Math.max(5.0, calculatedCd),
        radius: 5.5,
        burnDmgPerTick: Math.round(15 + level * 1.5),
        burnTicks: level >= 10 ? 8 : 6,
        dashSpeedMultiplier: 1.75 + Math.min(0.75, level * 0.015),
        hasDecoy: level >= 40,
        hasIgnitionBurst: level >= 30,
        isOverdrive: level >= 50,
      };

    case 'pet_turtle':
      return {
        damage: Math.round(40 + level * 2.5),
        shield: Math.round(70 + level * 5.4), // 70 -> 340 at Lv 50
        cooldown: Math.max(8.0, calculatedCd),
        radius: 4.5 + Math.min(2.5, level * 0.05),
        knockbackForce: 1.5 + Math.min(1.5, level * 0.03),
        reflectPct: level >= 40 ? 0.35 : 0,
        slowPct: level >= 30 ? 0.5 : 0.25,
        ccImmunity: level >= 50,
      };

    case 'pet_rabbit':
      return {
        damage: Math.round(80 + level * 3.9), // 80 -> 275 at Lv 50
        cooldown: Math.max(4.5, calculatedCd),
        radius: 5.5 + Math.min(2.0, level * 0.04),
        knockbackAirborne: level >= 20,
        hasAfterimage: level >= 30,
        cooldownRefundOnMultiHit: level >= 40,
        guaranteedCrit: level >= 50,
      };

    case 'pet_owl':
      return {
        tickDamage: Math.round(14 + level * 0.48), // 14 -> 38 at Lv 50
        totalTicks: level >= 20 ? 9 : 7,
        cooldown: Math.max(7.5, calculatedCd),
        radius: 6.0 + Math.min(6.0, level * 0.12), // 6m -> 12m at Lv 50
        duration: level >= 20 ? 4.5 : 3.5,
        razorFeathers: level >= 30,
        centerStun: level >= 40,
        isVortexOfDoom: level >= 50,
      };

    case 'pet_bear':
      return {
        damage: Math.round(120 + level * 5.2), // 120 -> 380 at Lv 50
        cooldown: Math.max(10.0, calculatedCd),
        radius: 6.5 + Math.min(4.5, level * 0.09), // 6.5m -> 11m
        stunDuration: level >= 50 ? 2.5 : level >= 10 ? 1.5 : 1.2,
        lingeringSpikes: level >= 20,
        armorRupture: level >= 40,
        cataclysmZone: level >= 50,
      };

    case 'pet_slime':
      return {
        damage: Math.round(70 + level * 4.2), // 70 -> 280 at Lv 50
        heal: Math.round(45 + level * 1.9), // 45 -> 140 at Lv 50
        cooldown: Math.max(11.0, calculatedCd),
        radius: 5.5 + Math.min(3.5, level * 0.07),
        slowDuration: level >= 20 ? 4.0 : 0,
        lingeringHealOverTime: level >= 30,
        doubleEcho: level >= 40,
        miniSlimes: level >= 50,
      };

    case 'pet_frog':
      return {
        damage: Math.round(75 + level * 4.7),
        cooldown: Math.max(5.0, calculatedCd),
        radius: 5.5 + Math.min(2.5, level * 0.05),
        slowPct: level >= 10 ? 0.4 : 0.25,
        doubleCast: level >= 30,
      };

    case 'pet_wolf':
      return {
        damage: Math.round(85 + level * 3.5),
        attackBoostPct: 0.25 + Math.min(0.35, level * 0.007),
        cooldown: Math.max(8.0, calculatedCd),
        radius: 6.0,
        fearDuration: level >= 20 ? 1.2 : 0,
        spawnShadowWolves: level >= 30,
      };

    case 'pet_deer':
      return {
        damage: Math.round(70 + level * 4.2),
        heal: Math.round(35 + level * 1.7),
        speedBoost: 0.4 + Math.min(0.4, level * 0.008),
        cooldown: Math.max(6.0, calculatedCd),
        radius: 5.0,
      };

    case 'pet_dragon':
      return {
        damage: Math.round(200 + level * 9.0), // 200 -> 650
        cooldown: Math.max(12.0, calculatedCd),
        radius: 8.5 + Math.min(3.5, level * 0.07),
        burnTargets: true,
        extraMeteors: level >= 30,
      };

    case 'pet_phoenix':
      return {
        damage: Math.round(180 + level * 8.4), // 180 -> 600
        heal: level >= 10 ? 9999 : 80 + level * 3.0, // full heal from Lv 10+
        cooldown: Math.max(14.0, calculatedCd),
        radius: 8.0,
        blindStun: level >= 20,
        divineShield: level >= 40,
      };

    default:
      return {
        damage: 80 + level * 10,
        cooldown: calculatedCd,
        radius: 6.0,
        heal: 0,
        shield: 0,
        stunDuration: 0,
      };
  }
}
