import * as THREE from 'three';

export type PortalTheme = 'normal' | 'advanced' | 'expert' | 'special';

export interface PortalThemeColors {
  name: string;
  primary: number;     // Main glowing energy
  secondary: number;   // Deep ring color
  accent: number;      // Bright highlight
  lightColor: number;  // Point light color
  particleColor: number;
  bgHex: string;
  borderHex: string;
  badgeHex: string;
  title: string;
  desc: string;
}

export const PORTAL_THEMES: Record<PortalTheme, PortalThemeColors> = {
  normal: {
    name: 'Normal',
    primary: 0x38bdf8,     // Sky Blue / Cyan
    secondary: 0x0284c7,
    accent: 0x93c5fd,
    lightColor: 0x38bdf8,
    particleColor: 0x38bdf8,
    bgHex: 'from-sky-950/80 to-blue-950/80',
    borderHex: 'border-sky-500/50',
    badgeHex: 'bg-sky-900/80 text-sky-200 border-sky-400/40',
    title: 'Standard Wild Grounds',
    desc: 'The baseline untamed trial. Slimes, imps, and forest wolves with standard enemy stats.',
  },
  advanced: {
    name: 'Advanced',
    primary: 0xa855f7,     // Mystic Purple / Violet
    secondary: 0x7e22ce,
    accent: 0xd8b4fe,
    lightColor: 0xa855f7,
    particleColor: 0xa855f7,
    bgHex: 'from-purple-950/80 to-indigo-950/80',
    borderHex: 'border-purple-500/50',
    badgeHex: 'bg-purple-900/80 text-purple-200 border-purple-400/40',
    title: 'Enraged Wild Grounds',
    desc: 'Empowered adversaries infused with arcane wild ether. Faster pacing and +25% Essence rewards.',
  },
  expert: {
    name: 'Expert',
    primary: 0xef4444,     // Crimson / Fire Red
    secondary: 0xb91c1c,
    accent: 0xfca5a5,
    lightColor: 0xef4444,
    particleColor: 0xff3333,
    bgHex: 'from-rose-950/80 to-red-950/80',
    borderHex: 'border-rose-500/50',
    badgeHex: 'bg-rose-900/80 text-rose-200 border-rose-400/40',
    title: 'Eclipse Nightmare',
    desc: 'Raging eclipse monsters with enhanced aggression and brutal strikes. High risk, double rewards!',
  },
  special: {
    name: 'Special',
    primary: 0xf59e0b,     // Celestial Gold / Amber
    secondary: 0xd97706,
    accent: 0xfef08a,
    lightColor: 0xf59e0b,
    particleColor: 0xffd166,
    bgHex: 'from-amber-950/80 to-yellow-950/80',
    borderHex: 'border-amber-500/50',
    badgeHex: 'bg-amber-900/80 text-amber-200 border-amber-400/40',
    title: 'Celestial Horizon Trial',
    desc: 'A shimmering sanctuary dimension overflowing with pure celestial pet essence and mythical fortune.',
  },
};

export interface UpgradedPortal {
  group: THREE.Group;
  vortexMesh: THREE.Mesh;
  innerRingMesh: THREE.Mesh;
  outerRingMesh: THREE.Mesh;
  runeRingMesh: THREE.Mesh;
  pointLight: THREE.PointLight;
  apexCrystal: THREE.Mesh;
  groundRuneMesh: THREE.Mesh;
  floatingRunes: THREE.Mesh[];
  pillarRunes: THREE.Mesh[];
  currentTheme: PortalTheme;
  proximityBlend: number; // 0 (far) to 1 (near)
  setTheme: (theme: PortalTheme) => void;
  update: (delta: number, playerDist: number, isWarping: boolean) => void;
  triggerWarpAnimation: (onComplete: () => void) => void;
}

/**
 * Creates the high-fidelity low-poly magical portal entrance
 * with tiered pedestal, megalith pillars, counter-rotating energy rings,
 * swirling multi-layer vortex, floating runes, and dynamic proximity illumination.
 */
export function createUpgradedPortal(initialTheme: PortalTheme = 'normal'): UpgradedPortal {
  const group = new THREE.Group();
  group.name = 'upgraded_wild_grounds_portal';

  // --- MATERIALS ---
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x3d405b,
    roughness: 0.88,
    metalness: 0.12,
  });

  const stoneDarkMat = new THREE.MeshStandardMaterial({
    color: 0x242438,
    roughness: 0.92,
  });

  const mossMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f,
    roughness: 0.85,
  });

  const goldAccentMat = new THREE.MeshStandardMaterial({
    color: 0xffb703,
    roughness: 0.35,
    metalness: 0.65,
  });

  const themeCfg = PORTAL_THEMES[initialTheme];

  // Dynamic Theme Materials
  const vortexMat = new THREE.MeshStandardMaterial({
    color: themeCfg.primary,
    emissive: themeCfg.secondary,
    emissiveIntensity: 0.9,
    roughness: 0.15,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });

  const innerSpiralMat = new THREE.MeshBasicMaterial({
    color: themeCfg.accent,
    wireframe: true,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
  });

  const runeMat = new THREE.MeshStandardMaterial({
    color: themeCfg.primary,
    emissive: themeCfg.primary,
    emissiveIntensity: 0.95,
    roughness: 0.25,
  });

  const ringGlowMat = new THREE.MeshStandardMaterial({
    color: themeCfg.primary,
    emissive: themeCfg.secondary,
    emissiveIntensity: 1.1,
    roughness: 0.3,
  });

  const groundRuneMat = new THREE.MeshStandardMaterial({
    color: themeCfg.primary,
    emissive: themeCfg.primary,
    emissiveIntensity: 0.75,
    roughness: 0.3,
    transparent: true,
    opacity: 0.9,
  });

  // --- 1. TIERED STONE DAIS (PEDESTAL STEPS) ---
  const daisBase1 = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.25, 8), stoneDarkMat);
  daisBase1.position.y = 0.125;
  daisBase1.receiveShadow = true;

  const daisBase2 = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.25, 8), stoneMat);
  daisBase2.position.y = 0.375;
  daisBase2.receiveShadow = true;

  const daisBase3 = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.25, 0.2, 8), stoneDarkMat);
  daisBase3.position.y = 0.58;
  daisBase3.receiveShadow = true;

  // Ground Glowing Inset Rune Ring on Dais
  const groundRuneGeo = new THREE.RingGeometry(1.2, 1.85, 16);
  const groundRuneMesh = new THREE.Mesh(groundRuneGeo, groundRuneMat);
  groundRuneMesh.rotation.x = -Math.PI / 2;
  groundRuneMesh.position.y = 0.685;
  groundRuneMesh.receiveShadow = true;

  // 8 radial spoke markers on ground
  const spokesGroup = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.55), runeMat);
    const angle = (i * Math.PI * 2) / 8;
    spoke.position.set(Math.sin(angle) * 1.5, 0.69, Math.cos(angle) * 1.5);
    spoke.rotation.y = angle;
    spokesGroup.add(spoke);
  }

  // Moss clumps on steps
  for (let m = 0; m < 5; m++) {
    const moss = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), mossMat);
    const ang = (m * Math.PI * 2) / 5 + 0.3;
    moss.position.set(Math.sin(ang) * 2.4, 0.45, Math.cos(ang) * 2.4);
    group.add(moss);
  }

  group.add(daisBase1, daisBase2, daisBase3, groundRuneMesh, spokesGroup);

  // --- 2. STONE PILLARS & ARCHWAY ---
  const pillarRunes: THREE.Mesh[] = [];

  // Helper to create a megalith pillar
  const createPillar = (xSign: number) => {
    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(xSign * 1.95, 0.68, 0);

    // Pillar base plinth
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.9), stoneDarkMat);
    plinth.position.y = 0.3;
    plinth.castShadow = true;
    pillarGroup.add(plinth);

    // Main pillar shaft
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.72, 3.6, 0.72), stoneMat);
    shaft.position.y = 2.4;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    pillarGroup.add(shaft);

    // Weathered angled buttress support
    const buttress = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 0.6), stoneDarkMat);
    buttress.position.set(xSign * 0.45, 1.3, 0);
    buttress.rotation.z = -xSign * 0.15;
    buttress.castShadow = true;
    pillarGroup.add(buttress);

    // Pillar Capital (top block)
    const capital = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.4, 0.85), stoneDarkMat);
    capital.position.y = 4.3;
    capital.castShadow = true;
    pillarGroup.add(capital);

    // Glowing carved runic bands along the pillar
    for (let r = 0; r < 4; r++) {
      const runeBand = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.14, 0.76), runeMat);
      runeBand.position.y = 1.3 + r * 0.85;
      pillarGroup.add(runeBand);
      pillarRunes.push(runeBand);
    }

    return pillarGroup;
  };

  const pillarL = createPillar(-1);
  const pillarR = createPillar(1);
  group.add(pillarL, pillarR);

  // Curved Arch Lintel
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.7, 0.85), stoneMat);
  lintel.position.set(0, 5.25, 0);
  lintel.castShadow = true;
  group.add(lintel);

  // Lintel decorative carved corbels
  const corbelL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.86), stoneDarkMat);
  corbelL.position.set(-1.8, 4.75, 0);
  const corbelR = corbelL.clone();
  corbelR.position.set(1.8, 4.75, 0);
  group.add(corbelL, corbelR);

  // Central Ornate Keystone
  const keystone = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.95, 0.92), stoneDarkMat);
  keystone.position.set(0, 5.4, 0);
  keystone.castShadow = true;
  group.add(keystone);

  // Floating Apex Arcane Power Crystal
  const apexCrystalGeo = new THREE.OctahedronGeometry(0.38, 0);
  const apexCrystal = new THREE.Mesh(apexCrystalGeo, runeMat);
  apexCrystal.position.set(0, 6.2, 0);
  group.add(apexCrystal);

  // Gold trim crest on keystone
  const crest = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), goldAccentMat);
  crest.position.set(0, 5.4, 0.5);
  group.add(crest);

  // --- 3. CONCENTRIC ROTATING ENERGY RINGS & VORTEX ---
  const portalCenterY = 3.0;

  // Outer Glowing Beveled Energy Ring
  const outerRingGeo = new THREE.TorusGeometry(1.68, 0.08, 6, 24);
  const outerRingMesh = new THREE.Mesh(outerRingGeo, ringGlowMat);
  outerRingMesh.position.set(0, portalCenterY, 0);
  group.add(outerRingMesh);

  // Middle Rune Tooth Ring (Counter-rotating)
  const runeRingGroup = new THREE.Group();
  runeRingGroup.position.set(0, portalCenterY, 0.02);
  const runeRingMesh = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.05, 5, 20), ringGlowMat);
  runeRingGroup.add(runeRingMesh);

  // 6 rune teeth along the ring
  for (let i = 0; i < 6; i++) {
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 4), runeMat);
    const ang = (i * Math.PI * 2) / 6;
    tooth.position.set(Math.cos(ang) * 1.42, Math.sin(ang) * 1.42, 0);
    tooth.rotation.z = ang - Math.PI / 2;
    runeRingGroup.add(tooth);
  }
  group.add(runeRingGroup);

  // Inner Shimmering Focus Ring
  const innerRingGeo = new THREE.TorusGeometry(1.05, 0.04, 5, 18);
  const innerRingMesh = new THREE.Mesh(innerRingGeo, ringGlowMat);
  innerRingMesh.position.set(0, portalCenterY, 0.04);
  group.add(innerRingMesh);

  // Swirling Vortex Disc (Dimensional Horizon)
  const vortexGeo = new THREE.CircleGeometry(1.62, 24);
  const vortexMesh = new THREE.Mesh(vortexGeo, vortexMat);
  vortexMesh.position.set(0, portalCenterY, 0);
  group.add(vortexMesh);

  // Inner Spinning Wireframe Spiral Aperture
  const innerSpiralGeo = new THREE.RingGeometry(0.2, 1.35, 16);
  const innerSpiralMesh = new THREE.Mesh(innerSpiralGeo, innerSpiralMat);
  innerSpiralMesh.position.set(0, portalCenterY, 0.03);
  group.add(innerSpiralMesh);

  // Central Event Horizon Core (Black / Deep Energy Void)
  const coreVoid = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 16),
    new THREE.MeshBasicMaterial({ color: 0x050510, side: THREE.DoubleSide })
  );
  coreVoid.position.set(0, portalCenterY, 0.05);
  group.add(coreVoid);

  // --- 4. FLOATING ORBITING MAGICAL RUNE GLYPHS ---
  const floatingRunes: THREE.Mesh[] = [];
  const numFloating = 6;
  for (let f = 0; f < numFloating; f++) {
    const fRune = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), runeMat);
    const baseAngle = (f * Math.PI) / (numFloating - 1) + 0.15; // Arc over the arch
    const r = 2.15;
    fRune.position.set(Math.cos(baseAngle) * r, portalCenterY + Math.sin(baseAngle) * (r * 0.95), 0.25);
    (fRune.userData as any) = {
      baseX: fRune.position.x,
      baseY: fRune.position.y,
      baseZ: fRune.position.z,
      phase: f * 1.1,
    };
    floatingRunes.push(fRune);
    group.add(fRune);
  }

  // --- 5. DYNAMIC POINT LIGHT (GROUND ILLUMINATION & AMBIENCE) ---
  const pointLight = new THREE.PointLight(themeCfg.lightColor, 1.4, 9.0, 2.0);
  pointLight.position.set(0, portalCenterY, 0.6);
  group.add(pointLight);

  // --- CONTROLLER INSTANCE ---
  let currentTheme: PortalTheme = initialTheme;
  let proximityBlend = 0; // 0 to 1
  let warpTimer = 0;
  let isWarpAnimating = false;
  let warpCallback: (() => void) | null = null;
  let animClock = 0;

  const setTheme = (theme: PortalTheme) => {
    currentTheme = theme;
    const cfg = PORTAL_THEMES[theme];

    vortexMat.color.setHex(cfg.primary);
    vortexMat.emissive.setHex(cfg.secondary);
    innerSpiralMat.color.setHex(cfg.accent);

    runeMat.color.setHex(cfg.primary);
    runeMat.emissive.setHex(cfg.primary);

    ringGlowMat.color.setHex(cfg.primary);
    ringGlowMat.emissive.setHex(cfg.secondary);

    groundRuneMat.color.setHex(cfg.primary);
    groundRuneMat.emissive.setHex(cfg.primary);

    pointLight.color.setHex(cfg.lightColor);
  };

  const triggerWarpAnimation = (onComplete: () => void) => {
    isWarpAnimating = true;
    warpTimer = 0.55;
    warpCallback = onComplete;
  };

  const update = (delta: number, playerDist: number, isWarping: boolean) => {
    animClock += delta;

    // Smooth proximity detection blend (active when within 4.8m)
    const targetBlend = Math.max(0, Math.min(1, (4.8 - playerDist) / 3.0));
    proximityBlend = THREE.MathUtils.damp(proximityBlend, targetBlend, 8, delta);

    // Speed multiplier increases when player approaches
    const speedMultiplier = 1.0 + proximityBlend * 1.2;

    // 1. Continuous Counter-Rotating Energy Rings
    outerRingMesh.rotation.z += delta * 0.7 * speedMultiplier;
    runeRingGroup.rotation.z -= delta * 1.1 * speedMultiplier;
    innerRingMesh.rotation.z += delta * 1.6 * speedMultiplier;

    // Subtle 3D tilt oscillation for depth
    outerRingMesh.rotation.x = Math.sin(animClock * 1.4) * 0.06;
    runeRingGroup.rotation.y = Math.cos(animClock * 1.2) * 0.05;

    // 2. Swirling Vortex Interior Disc
    vortexMesh.rotation.z += delta * 1.8 * speedMultiplier;
    innerSpiralMesh.rotation.z -= delta * 2.5 * speedMultiplier;

    // 3. Floating Magical Runes undulating in place
    floatingRunes.forEach((rMesh) => {
      const u = rMesh.userData as any;
      const t = animClock * 2.2 + u.phase;
      rMesh.position.y = u.baseY + Math.sin(t) * 0.12;
      rMesh.position.x = u.baseX + Math.cos(t * 0.8) * 0.05;
      rMesh.rotation.x += delta * 1.2;
      rMesh.rotation.y += delta * 1.5;
    });

    // 4. Floating Apex Crystal
    apexCrystal.rotation.y += delta * 1.4;
    apexCrystal.rotation.x = Math.sin(animClock * 1.8) * 0.15;
    apexCrystal.position.y = 6.2 + Math.sin(animClock * 2.5) * 0.08;

    // 5. Breathing Emissive Intensity & Ground Illumination
    const breath = Math.sin(animClock * 3.0) * 0.2;
    const baseEmissive = 0.85 + breath;
    const activeEmissive = baseEmissive * (1.0 + proximityBlend * 0.8);

    vortexMat.emissiveIntensity = activeEmissive;
    runeMat.emissiveIntensity = activeEmissive * 1.1;
    ringGlowMat.emissiveIntensity = activeEmissive;
    groundRuneMat.emissiveIntensity = 0.65 + proximityBlend * 0.65;

    // Point Light Intensity
    const targetLightIntensity = 1.2 + proximityBlend * 1.8 + Math.sin(animClock * 4.0) * 0.25;
    pointLight.intensity = THREE.MathUtils.damp(pointLight.intensity, targetLightIntensity, 10, delta);
    pointLight.distance = 9.0 + proximityBlend * 3.0;

    // Central core void subtle breathing scale
    const coreScale = 1.0 + Math.sin(animClock * 4.5) * 0.08;
    coreVoid.scale.set(coreScale, coreScale, 1.0);

    // 6. Warp Energy Expansion Sequence
    if (isWarpAnimating) {
      warpTimer -= delta;
      const progress = 1.0 - warpTimer / 0.55;

      // Energy expansion surge
      const expand = 1.0 + Math.sin(progress * Math.PI) * 0.75;
      vortexMesh.scale.set(expand, expand, 1.0);
      outerRingMesh.scale.set(expand * 1.1, expand * 1.1, 1.0);
      runeRingGroup.scale.set(expand * 1.05, expand * 1.05, 1.0);

      // Extreme flash rotation
      vortexMesh.rotation.z += delta * 12.0;
      runeRingGroup.rotation.z -= delta * 14.0;
      pointLight.intensity = 5.5 + Math.sin(progress * Math.PI * 4) * 2.0;

      if (warpTimer <= 0) {
        isWarpAnimating = false;
        vortexMesh.scale.set(1, 1, 1);
        outerRingMesh.scale.set(1, 1, 1);
        runeRingGroup.scale.set(1, 1, 1);
        if (warpCallback) {
          const cb = warpCallback;
          warpCallback = null;
          cb();
        }
      }
    }
  };

  return {
    group,
    vortexMesh,
    innerRingMesh,
    outerRingMesh,
    runeRingMesh,
    pointLight,
    apexCrystal,
    groundRuneMesh,
    floatingRunes,
    pillarRunes,
    currentTheme,
    proximityBlend,
    setTheme,
    update,
    triggerWarpAnimation,
  };
}
