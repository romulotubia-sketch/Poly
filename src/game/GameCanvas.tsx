import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PetData, FarmPlotState, PlayerStats, GraphicsQuality, PerformanceStatsData } from '../types/game';
import {
  createPlayerModel,
  createFarmhouse,
  createBarn,
  createWindmill,
  createWell,
  createTree,
  createRock,
  createQuarryNode,
  createFenceSegment,
  createCropMesh,
  createHarvestItemMesh,
  createPortalArch,
  createSeedStall,
  createShadowSlime,
  createForestImp,
  createShadowWolf,
  createGroveGolem,
  createShadowTitan,
  createPetModel,
  PlayerMeshGroup,
  PetMeshGroup,
} from './proceduralModels';
import { ParticleSystem } from './particleSystem';
import { soundEngine } from '../audio/soundEngine';
import { INSTANCE_WAVES } from './constants';
import { computeActiveSkillStats } from './combatSkills';
import {
  PlayerAnimator,
  PetAnimator,
  PetFollowingController,
  CharacterAnimState,
} from './characterAnimator';
import {
  createUpgradedPortal,
  UpgradedPortal,
  PortalTheme,
  PORTAL_THEMES,
} from './portalSystem';
import { EnvironmentSystem, TimePhase } from './environmentSystem';

interface JoystickVector {
  x: number;
  y: number;
}

interface GameCanvasProps {
  player: PlayerStats;
  pets: PetData[];
  farmPlots: FarmPlotState[];
  onUpdatePlots: (newPlots: FarmPlotState[]) => void;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onUpdatePets: (updater: (prev: PetData[]) => PetData[]) => void;
  onAddInventory: (itemId: string, count: number) => void;
  onShowMessage: (text: string) => void;
  joystickInput: JoystickVector;
  skillCastTrigger: { petId: string; timestamp: number } | null;
  onSkillCastHandled: () => void;
  onNearInteractableChange: (prompt: { text: string; action: () => void } | null) => void;
  isZenMode: boolean;
  jumpCount: number;
  camTurnDelta: number;
  currentLocation: 'farm' | 'wild_grounds';
  onWaveInfoChange: (info: { wave: number; title: string; enemiesRemaining: number; prepCountdown: number | null }) => void;
  onInstanceVictory: (result: { wavesCleared: number; essenceEarned: number; goldEarned: number }) => void;
  onInstanceDefeat: (result: { wavesCleared: number; essenceEarned: number; goldEarned: number }) => void;
  onOpenSeedShop: () => void;
  onOpenPortalModal: () => void;
  onOpenSeedPicker: (plotId: number) => void;
  portalTheme?: PortalTheme;
  isWarping?: boolean;
  onTimePhaseChange?: (phase: TimePhase, timeOfDay: number) => void;
  graphicsQuality?: GraphicsQuality;
  onPerfStatsChange?: (stats: PerformanceStatsData) => void;
}

// Math helpers pre-allocated at module scope to avoid GC inside render loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3Cam = new THREE.Vector3();
const _vec3ScaleNormal = new THREE.Vector3(1, 1, 1);

interface ActiveEnemy {
  id: string;
  type: string;
  mesh: THREE.Group;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  attackCooldown: number;
  attackTimer: number;
  isBoss: boolean;
  healthBarForeground: THREE.Mesh;
  // Combat status effects
  burnTimer: number;
  burnDmgPerTick: number;
  burnTickTimer: number;
  burnSourceLevel: number;
  stunTimer: number;
  slowTimer: number;
  slowFactor: number;
  isAirborne: boolean;
  airborneTimer: number;
  armorRuptureTimer: number;
  hitFlashTimer?: number;
}

interface ActiveCyclone {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  duration: number;
  maxDuration: number;
  radius: number;
  tickTimer: number;
  tickDamage: number;
  level: number;
  hasRazorFeathers: boolean;
  hasCenterStun: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  player,
  pets,
  farmPlots,
  onUpdatePlots,
  onUpdatePlayer,
  onUpdatePets,
  onAddInventory,
  onShowMessage,
  joystickInput,
  skillCastTrigger,
  onSkillCastHandled,
  onNearInteractableChange,
  isZenMode,
  jumpCount,
  camTurnDelta,
  currentLocation,
  onWaveInfoChange,
  onInstanceVictory,
  onInstanceDefeat,
  onOpenSeedShop,
  onOpenPortalModal,
  onOpenSeedPicker,
  portalTheme = 'normal',
  isWarping = false,
  onTimePhaseChange,
  graphicsQuality = 'medium',
  onPerfStatsChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<UpgradedPortal | null>(null);

  // References to WebGL resources for dynamic quality changes
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particleSysRef = useRef<ParticleSystem | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const isSoftwareGlRef = useRef<boolean>(false);

  // References to keep state fresh in Three.js tick loop without rebuilding WebGL context
  const stateRef = useRef({
    player,
    pets,
    farmPlots,
    joystickInput,
    jumpCount,
    camTurnDelta,
    skillCastTrigger,
    currentLocation,
    onSkillCastHandled,
    onUpdatePlots,
    onUpdatePlayer,
    onUpdatePets,
    onAddInventory,
    onShowMessage,
    onNearInteractableChange,
    onWaveInfoChange,
    onInstanceVictory,
    onInstanceDefeat,
    onOpenSeedShop,
    onOpenPortalModal,
    onOpenSeedPicker,
    isZenMode,
    portalTheme,
    isWarping,
    onTimePhaseChange,
    graphicsQuality,
    onPerfStatsChange,
  });

  useEffect(() => {
    stateRef.current = {
      player,
      pets,
      farmPlots,
      joystickInput,
      jumpCount,
      camTurnDelta,
      skillCastTrigger,
      currentLocation,
      onSkillCastHandled,
      onUpdatePlots,
      onUpdatePlayer,
      onUpdatePets,
      onAddInventory,
      onShowMessage,
      onNearInteractableChange,
      onWaveInfoChange,
      onInstanceVictory,
      onInstanceDefeat,
      onOpenSeedShop,
      onOpenPortalModal,
      onOpenSeedPicker,
      isZenMode,
      portalTheme,
      isWarping,
      onTimePhaseChange,
      graphicsQuality,
      onPerfStatsChange,
    };
  }, [
    player,
    pets,
    farmPlots,
    joystickInput,
    jumpCount,
    camTurnDelta,
    skillCastTrigger,
    currentLocation,
    onSkillCastHandled,
    onUpdatePlots,
    onUpdatePlayer,
    onUpdatePets,
    onAddInventory,
    onShowMessage,
    onNearInteractableChange,
    onWaveInfoChange,
    onInstanceVictory,
    onInstanceDefeat,
    onOpenSeedShop,
    onOpenPortalModal,
    onOpenSeedPicker,
    isZenMode,
    portalTheme,
    isWarping,
    onTimePhaseChange,
    graphicsQuality,
    onPerfStatsChange,
  ]);

  useEffect(() => {
    if (portalRef.current && portalTheme) {
      portalRef.current.setTheme(portalTheme);
    }
  }, [portalTheme]);

  // Real-time Graphics Quality adjustments without reloading scene (Requirement 4)
  useEffect(() => {
    const renderer = rendererRef.current;
    const particleSys = particleSysRef.current;
    const sunLight = sunLightRef.current;
    const isSoftwareGl = isSoftwareGlRef.current;
    if (!renderer || !particleSys) return;

    // 1. Particle pool limits
    particleSys.setQuality(graphicsQuality);

    // 2. Pixel ratio / Resolution
    if (graphicsQuality === 'low' || isSoftwareGl) {
      renderer.setPixelRatio(1.0);
    } else if (graphicsQuality === 'medium') {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    } else {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    }

    if (mountRef.current) {
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    }

    // 3. Shadows & Lighting quality
    if (graphicsQuality === 'low' || isSoftwareGl) {
      renderer.shadowMap.enabled = false;
      if (sunLight) sunLight.castShadow = false;
    } else {
      renderer.shadowMap.enabled = true;
      if (sunLight) sunLight.castShadow = true;
      if (graphicsQuality === 'medium') {
        renderer.shadowMap.type = THREE.BasicShadowMap;
      } else {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
      renderer.shadowMap.needsUpdate = true;
    }
  }, [graphicsQuality]);

  const lastHandledSkillRef = useRef<number>(0);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // Detect software WebGL as per Three.js skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Initialize Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);

    const initQuality = stateRef.current.graphicsQuality || 'medium';
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // Apply initial graphics quality
    if (initQuality === 'low' || isSoftwareGl) {
      renderer.setPixelRatio(1.0);
      renderer.shadowMap.enabled = false;
    } else if (initQuality === 'medium') {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.BasicShadowMap;
    } else {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    container.appendChild(renderer.domElement);

    // Scene setup
    const scene = new THREE.Scene();
    const skyColor = 0xbce4fa;
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.Fog(skyColor, 35, 105);

    // Camera setup (Third-person)
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 150);
    camera.position.set(0, 7, 12);

    // Mandatory RoomEnvironment Studio Reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Lighting: Warm key directional sun + cool sky/warm ground hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x588157, 0.7);
    hemiLight.position.set(0, 40, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffae0, 1.8);
    sunLight.position.set(25, 38, 20);
    sunLight.castShadow = initQuality !== 'low' && !isSoftwareGl;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 85;
    const d = 28;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    // Store references for dynamic settings updates
    rendererRef.current = renderer;
    sunLightRef.current = sunLight;
    isSoftwareGlRef.current = isSoftwareGl;

    // Particle System
    const particleSys = new ParticleSystem();
    particleSys.setQuality(initQuality);
    particleSysRef.current = particleSys;
    scene.add(particleSys.group);

    // Environment System (Day/Night, Wind, Swaying Trees, Clouds, Birds, Butterflies, Water)
    const envSystem = new EnvironmentSystem(scene, sunLight, hemiLight, isSoftwareGl);

    // ==========================================
    // 1. FARM ENVIRONMENT GROUP
    // ==========================================
    const farmEnvironmentGroup = new THREE.Group();
    farmEnvironmentGroup.name = 'farm_environment';
    scene.add(farmEnvironmentGroup);

    // Island / Meadow ground
    const groundGeo = new THREE.CylinderGeometry(46, 48, 4, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x70a962,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -2;
    ground.receiveShadow = true;
    farmEnvironmentGroup.add(ground);

    // River / Stream cutting through farm side
    const riverGeo = new THREE.PlaneGeometry(10, 40, 16, 24);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.08,
      metalness: 0.35,
      transparent: true,
      opacity: 0.88,
      envMapIntensity: 1.5,
    });
    riverMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = envSystem.grassWindUniforms.uTime;
      shader.vertexShader = `
        uniform float uTime;
        ${shader.vertexShader}
      `;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float wave = sin(uTime * 2.2 + position.x * 0.8 + position.y * 0.5) * 0.02;
        transformed.z += wave;
        `
      );
    };
    const river = new THREE.Mesh(riverGeo, riverMat);
    river.rotation.x = -Math.PI / 2;
    river.rotation.z = 0.15;
    river.position.set(16, 0.02, 0);
    river.receiveShadow = true;
    farmEnvironmentGroup.add(river);
    envSystem.registerRiverWater(river);

    // Wooden Bridge across river
    const bridge = new THREE.Group();
    bridge.position.set(15.5, 0.1, 0);
    const plankMat = new THREE.MeshStandardMaterial({ color: 0x936639, roughness: 0.8 });
    for (let i = 0; i < 7; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 3.2), plankMat);
      plank.position.set(-1.8 + i * 0.6, 0.1, 0);
      plank.castShadow = true;
      bridge.add(plank);
    }
    farmEnvironmentGroup.add(bridge);

    // Stone pathway from Farmhouse to Fields
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xc4b59d, roughness: 0.9 });
    for (let i = 0; i < 18; i++) {
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.45 + (i % 2) * 0.1, 0.5, 0.04, 6), pathMat);
      stone.position.set(-2 + Math.sin(i * 0.4) * 0.6, 0.02, -8 + i * 1.0);
      stone.rotation.y = i * 0.7;
      stone.receiveShadow = true;
      farmEnvironmentGroup.add(stone);
    }

    // Main Farmhouse
    const farmhouse = createFarmhouse();
    farmhouse.position.set(-2, 0, -10);
    farmEnvironmentGroup.add(farmhouse);

    // Red Barn
    const barn = createBarn();
    barn.position.set(10, 0, -11);
    farmEnvironmentGroup.add(barn);

    // Windmill with rotating blades
    const { group: windmillGroup, blades: windmillBlades } = createWindmill();
    windmillGroup.position.set(-15, 0, 5);
    farmEnvironmentGroup.add(windmillGroup);

    // Stone Well
    const well = createWell();
    well.position.set(4, 0, 1);
    farmEnvironmentGroup.add(well);

    // Wooden perimeter fences
    for (let i = 0; i < 6; i++) {
      const fence = createFenceSegment();
      fence.position.set(-8.5 + i * 2.0, 0, -1.5);
      farmEnvironmentGroup.add(fence);
    }

    // Stylized Trees around farm
    const treePositions: [number, number, 'oak' | 'pine' | 'apple'][] = [
      [-16, -14, 'pine'],
      [-20, -8, 'oak'],
      [-18, 0, 'pine'],
      [-19, 14, 'pine'],
      [-8, 18, 'oak'],
      [2, 22, 'apple'],
      [14, 20, 'apple'],
      [22, 12, 'pine'],
      [24, -2, 'oak'],
      [22, -16, 'pine'],
      [7, -18, 'pine'],
      [-10, -18, 'oak'],
      [18, -6, 'apple'],
    ];
    treePositions.forEach(([x, z, type]) => {
      const tree = createTree(type);
      tree.position.set(x, 0, z);
      farmEnvironmentGroup.add(tree);
      envSystem.registerTree(tree);
    });

    // Quarry Crystal Boulders
    const quarry1 = createQuarryNode();
    quarry1.position.set(23, 0, -8);
    const quarry2 = createQuarryNode();
    quarry2.position.set(25, 0, 4);
    farmEnvironmentGroup.add(quarry1, quarry2);

    // Decorative Rocks
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12;
      const r = 26 + (i % 3) * 5;
      const rock = createRock(0.8 + (i % 3) * 0.4);
      rock.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
      farmEnvironmentGroup.add(rock);
    }

    // Pet Habitats
    const foxDen = new THREE.Group();
    foxDen.position.set(-11, 0, -2);
    const denLogs = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 1.6, 6), new THREE.MeshStandardMaterial({ color: 0x582f0e, roughness: 0.85 }));
    denLogs.position.y = 0.8;
    denLogs.castShadow = true;
    const denRoof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.0, 6), new THREE.MeshStandardMaterial({ color: 0xe76f51, roughness: 0.8 }));
    denRoof.position.y = 1.9;
    foxDen.add(denLogs, denRoof);
    farmEnvironmentGroup.add(foxDen);

    const turtlePond = new THREE.Group();
    turtlePond.position.set(12, 0, 8);
    const pondRim = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.0, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0x8d99ae, roughness: 0.9 }));
    pondRim.position.y = 0.2;
    const pondWaterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.08,
      metalness: 0.35,
      transparent: true,
      opacity: 0.88,
      envMapIntensity: 1.5,
    });
    const pondWater = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.2, 16), pondWaterMat);
    pondWater.position.y = 0.3;
    turtlePond.add(pondRim, pondWater);

    // Small animated surface ripples on Turtle Pond
    const pondRippleRingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const pondRipple = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.82, 16), pondRippleRingMat);
    pondRipple.rotation.x = -Math.PI / 2;
    pondRipple.position.y = 0.32;
    turtlePond.add(pondRipple);

    farmEnvironmentGroup.add(turtlePond);
    envSystem.registerPondWater(pondWater);

    // --- SEED SHOPKEEPER STALL ON FARM ---
    const seedStall = createSeedStall();
    seedStall.position.set(7, 0, -2);
    seedStall.rotation.y = -Math.PI / 4;
    farmEnvironmentGroup.add(seedStall);

    // --- PORTAL TO WILD GROUNDS ON FARM (UPGRADED MAGICAL PORTAL) ---
    const upgradedPortal = createUpgradedPortal(stateRef.current.portalTheme || 'normal');
    upgradedPortal.group.position.set(-12, 0, -10);
    upgradedPortal.group.rotation.y = Math.PI / 6;
    farmEnvironmentGroup.add(upgradedPortal.group);
    portalRef.current = upgradedPortal;

    // --- FARM PLOTS MESHES ---
    const plotMeshMap = new Map<number, { group: THREE.Group; dirt: THREE.Mesh; cropGroup: THREE.Group }>();
    const dirtMatDry = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.95 });
    const dirtMatWet = new THREE.MeshStandardMaterial({ color: 0x402511, roughness: 0.4, metalness: 0.08 });
    const dirtMatUntilled = new THREE.MeshStandardMaterial({ color: 0x5e8c45, roughness: 0.9 });

    const gardenPlotsGroup = new THREE.Group();
    gardenPlotsGroup.name = 'garden_plots';
    farmEnvironmentGroup.add(gardenPlotsGroup);

    function rebuildFarmPlotMeshes(currentPlots: FarmPlotState[]) {
      while (gardenPlotsGroup.children.length > 0) {
        gardenPlotsGroup.remove(gardenPlotsGroup.children[0]);
      }
      plotMeshMap.clear();
      envSystem.clearPlotMeshes();

      currentPlots.forEach((plot) => {
        const plotGroup = new THREE.Group();
        plotGroup.position.set(plot.x, 0, plot.z);

        const dirtMat = !plot.tilled ? dirtMatUntilled : plot.watered ? dirtMatWet : dirtMatDry;
        const dirt = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.14, 2.0), dirtMat);
        dirt.position.y = 0.07;
        dirt.receiveShadow = true;
        dirt.castShadow = true;
        plotGroup.add(dirt);

        if (plot.tilled) {
          for (let r = -0.5; r <= 0.5; r += 0.5) {
            const ridge = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.28), dirtMat);
            ridge.position.set(0, 0.14, r);
            ridge.castShadow = true;
            plotGroup.add(ridge);
          }
        }

        const cropGroup = new THREE.Group();
        if (plot.cropId) {
          const cropMesh = createCropMesh(plot.cropId, plot.growProgress, false);
          cropMesh.position.y = 0.15;
          cropGroup.add(cropMesh);
          envSystem.registerPlotMesh(cropGroup);
        } else if (plot.isHarvested) {
          const harvestedMesh = createCropMesh('harvested', 0, true);
          harvestedMesh.position.y = 0.15;
          cropGroup.add(harvestedMesh);
        }
        plotGroup.add(cropGroup);

        gardenPlotsGroup.add(plotGroup);
        plotMeshMap.set(plot.id, { group: plotGroup, dirt, cropGroup });
      });
    }

    rebuildFarmPlotMeshes(farmPlots);

    // ==========================================
    // 2. WILD GROUNDS INSTANCE BATTLEFIELD GROUP
    // ==========================================
    const instanceEnvironmentGroup = new THREE.Group();
    instanceEnvironmentGroup.name = 'instance_environment';
    instanceEnvironmentGroup.visible = false;
    scene.add(instanceEnvironmentGroup);

    // Spacious Arena Ground
    const arenaGroundGeo = new THREE.CylinderGeometry(34, 36, 4, 32);
    const arenaGroundMat = new THREE.MeshStandardMaterial({
      color: 0x2b3a2a,
      roughness: 0.95,
    });
    const arenaGround = new THREE.Mesh(arenaGroundGeo, arenaGroundMat);
    arenaGround.position.y = -2;
    arenaGround.receiveShadow = true;
    instanceEnvironmentGroup.add(arenaGround);

    // Inner Battle Ring Stone Decals
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x5a189a,
      roughness: 0.7,
      emissive: 0x3c096c,
      emissiveIntensity: 0.3,
    });
    const battleRing = new THREE.Mesh(new THREE.RingGeometry(18, 19.5, 32), ringMat);
    battleRing.rotation.x = -Math.PI / 2;
    battleRing.position.y = 0.02;
    instanceEnvironmentGroup.add(battleRing);

    // Ancient Monolith Pillars surrounding arena
    for (let i = 0; i < 10; i++) {
      const ang = (i * Math.PI * 2) / 10;
      const monolith = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 5.5, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x3d348b, roughness: 0.9 })
      );
      monolith.position.set(Math.cos(ang) * 28, 2.75, Math.sin(ang) * 28);
      monolith.rotation.y = ang + 0.3;
      monolith.castShadow = true;
      instanceEnvironmentGroup.add(monolith);

      // Glowing rune crystal on top
      const runeCryst = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.5, 0),
        new THREE.MeshBasicMaterial({ color: 0x7209b7 })
      );
      runeCryst.position.set(Math.cos(ang) * 28, 6.2, Math.sin(ang) * 28);
      instanceEnvironmentGroup.add(runeCryst);
    }

    // Dark pine barrier woods surrounding arena perimeter
    for (let i = 0; i < 16; i++) {
      const ang = (i * Math.PI * 2) / 16 + 0.1;
      const pine = createTree('pine');
      pine.position.set(Math.cos(ang) * 31, 0, Math.sin(ang) * 31);
      instanceEnvironmentGroup.add(pine);
    }

    // Arena Rocks
    for (let i = 0; i < 8; i++) {
      const rock = createRock(1.2 + (i % 2) * 0.5);
      const ang = (i * Math.PI * 2) / 8 + 0.4;
      rock.position.set(Math.cos(ang) * 16, 0, Math.sin(ang) * 16);
      instanceEnvironmentGroup.add(rock);
    }

    // Group for active hostile enemy units in the instance
    const enemiesGroup = new THREE.Group();
    enemiesGroup.name = 'enemies_group';
    instanceEnvironmentGroup.add(enemiesGroup);

    // Active Enemies state tracking in loop
    const activeEnemies: ActiveEnemy[] = [];
    let currentWaveIndex = 0; // 0 to 9
    let prepCountdownTimer: number | null = 4.0;
    let waveClearedSummary = { wavesCleared: 0, essenceEarned: 0, goldEarned: 0 };
    let instanceActive = false;

    // Helper: Create 3D Floating Health Bar billboard over enemy
    function createEnemyHealthBar(width = 1.0, yOffset = 1.4): { group: THREE.Group; foreground: THREE.Mesh } {
      const barGroup = new THREE.Group();
      barGroup.position.y = yOffset;

      const bgMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
      const bg = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.12), bgMat);
      barGroup.add(bg);

      const fgMat = new THREE.MeshBasicMaterial({ color: 0xe63946 });
      const fg = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.1), fgMat);
      fg.position.z = 0.01;
      barGroup.add(fg);

      return { group: barGroup, foreground: fg };
    }

    // Helper: Spawn enemies for a given wave
    function spawnWave(waveNum: number) {
      // Clear previous enemies
      while (enemiesGroup.children.length > 0) {
        enemiesGroup.remove(enemiesGroup.children[0]);
      }
      activeEnemies.length = 0;

      const config = INSTANCE_WAVES[waveNum - 1] || INSTANCE_WAVES[0];
      const count = config.enemyCount;

      stateRef.current.onShowMessage(`⚔️ WAVE ${waveNum}: ${config.title}!`);
      if (waveNum === 5 || waveNum === 9 || waveNum === 10) {
        soundEngine.playBossRoar();
      }

      for (let i = 0; i < count; i++) {
        const typeIndex = i % config.types.length;
        const enemyType = config.types[typeIndex];
        const isBoss = enemyType === 'boss' || enemyType === 'golem';

        let mesh: THREE.Group;
        let hp = 100 + waveNum * 40;
        let dmg = 8 + waveNum * 2.5;
        let spd = 3.6 + Math.random() * 0.8;
        let barOffset = 1.3;

        if (enemyType === 'slime') {
          mesh = createShadowSlime(1.0);
          hp = 80 + waveNum * 30;
          dmg = 8 + waveNum * 2;
          spd = 3.2;
          barOffset = 1.1;
        } else if (enemyType === 'imp') {
          mesh = createForestImp(1.0);
          hp = 95 + waveNum * 35;
          dmg = 12 + waveNum * 3;
          spd = 4.2;
          barOffset = 1.4;
        } else if (enemyType === 'wolf') {
          mesh = createShadowWolf(1.1);
          hp = 140 + waveNum * 45;
          dmg = 16 + waveNum * 3;
          spd = 4.8;
          barOffset = 1.3;
        } else if (enemyType === 'golem') {
          mesh = createGroveGolem(waveNum === 10 ? 1.9 : 1.5);
          hp = 450 + waveNum * 120;
          dmg = 24 + waveNum * 4;
          spd = 2.4;
          barOffset = 2.2;
        } else {
          // Boss Titan
          mesh = createShadowTitan(2.2);
          hp = 1200;
          dmg = 35;
          spd = 2.8;
          barOffset = 3.4;
        }

        // Spawn spread out in circle around player
        const angle = (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.4;
        const dist = 14 + Math.random() * 6;
        mesh.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);

        // Add 3D Health Bar
        const { group: hbGroup, foreground: fg } = createEnemyHealthBar(isBoss ? 1.8 : 1.1, barOffset);
        mesh.add(hbGroup);

        enemiesGroup.add(mesh);

        activeEnemies.push({
          id: `enemy_${waveNum}_${i}`,
          type: enemyType,
          mesh,
          health: hp,
          maxHealth: hp,
          damage: dmg,
          speed: spd,
          attackCooldown: isBoss ? 2.2 : 1.4,
          attackTimer: 0,
          isBoss,
          healthBarForeground: fg,
          burnTimer: 0,
          burnDmgPerTick: 0,
          burnTickTimer: 0,
          burnSourceLevel: 1,
          stunTimer: 0,
          slowTimer: 0,
          slowFactor: 1,
          isAirborne: false,
          airborneTimer: 0,
          armorRuptureTimer: 0,
        });
      }

      stateRef.current.onWaveInfoChange({
        wave: waveNum,
        title: config.title,
        enemiesRemaining: activeEnemies.length,
        prepCountdown: null,
      });
    }

    // ==========================================
    // 3. PLAYER SPAWN & STATE
    // ==========================================
    const playerMesh = createPlayerModel();
    playerMesh.position.set(0, 0, 0);
    scene.add(playerMesh);

    // 3D Multi-Layer Tidal Barrier Hydro Shield Mesh
    const waterShieldMesh = new THREE.Group();
    waterShieldMesh.position.set(0, 0.8, 0);
    waterShieldMesh.visible = false;

    // 1. Outer flowing translucent water sphere (low-poly icosahedron)
    const outerShieldMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const outerShield = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, 2), outerShieldMat);
    waterShieldMesh.add(outerShield);

    // 2. Inner faceted water energy core
    const innerShieldMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const innerShield = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 1), innerShieldMat);
    waterShieldMesh.add(innerShield);

    // 3. Tilted concentric water rings
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.75,
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.05, 8, 24), ringMat1);
    ring1.rotation.x = Math.PI / 2;
    waterShieldMesh.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.04, 8, 24), ringMat1);
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 4;
    waterShieldMesh.add(ring2);

    // 4. Six orbiting water droplets
    const orbGroup = new THREE.Group();
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.4,
      transparent: true,
      opacity: 0.9,
    });
    for (let i = 0; i < 6; i++) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), orbMat);
      const ang = (i * Math.PI * 2) / 6;
      orb.position.set(Math.cos(ang) * 1.45, Math.sin(ang * 2) * 0.25, Math.sin(ang) * 1.45);
      orbGroup.add(orb);
    }
    waterShieldMesh.add(orbGroup);
    playerMesh.add(waterShieldMesh);

    waterShieldMesh.userData = {
      outerShield,
      innerShield,
      ring1,
      ring2,
      orbGroup,
      hitFlashTimer: 0,
    };

    const playerPhysics = {
      pos: new THREE.Vector3(0, 0, 0),
      rotY: 0,
      velY: 0,
      isGrounded: true,
      walkCycle: 0,
      speedBoostTimer: 0,
      dashDir: new THREE.Vector3(0, 0, 0),
      dashTimer: 0,
      dashSpeed: 0,
      squashTimer: 0,
      shield: 0,
      maxShield: 100,
      invulnTimer: 0,
    };

    // Camera variables
    let camYaw = Math.PI;
    let camPitch = 0.32;
    const camDist = 9.5;

    // Active 3D Cyclone instances in the world
    const activeCyclones: ActiveCyclone[] = [];

    // Bear Fortitude stacks (Unyielding passive)
    let fortitudeStacks = 0;
    let fortitudeTimer = 0;

    // Slime Gelatinous Body out-of-combat heal timers
    let outOfCombatDamageTimer = 5.0;
    let slimeRegenTicker = 0;

    // Instance cheat-death mechanics
    let bearCheatDeathUsed = false;
    let slimeCheatDeathUsed = false;

    // Animation Systems & Controllers
    const playerAnimator = new PlayerAnimator();
    const petAnimator = new PetAnimator();
    const petFollowingController = new PetFollowingController();

    let playerLandingTimer = 0;
    let playerDamageTimer = 0;
    let playerStunTimer = 0;
    let playerAttackTimer = 0;
    let isPlayerVictory = false;
    let isPlayerDefeat = false;
    let currentSkillCasting: {
      petId: string;
      phase: 'anticipation' | 'execution' | 'recovery';
      timer: number;
    } | null = null;

    interface PetAnimRuntimeState {
      currentSpeed: number;
      velocity: THREE.Vector3;
      distToTarget: number;
      isCastingSkill: boolean;
      skillPhase: 'anticipation' | 'execution' | 'recovery';
      skillTimer: number;
      damageTimer: number;
      stunTimer: number;
    }
    const petAnimStateMap = new Map<string, PetAnimRuntimeState>();

    // Follower Pet Meshes
    const petMeshMap = new Map<string, PetMeshGroup>();
    stateRef.current.pets.forEach((pet) => {
      const petMesh = createPetModel(pet.species);
      petMesh.position.set(Math.random() * 4 - 2, 0, Math.random() * 4 - 2);
      scene.add(petMesh);
      petMeshMap.set(pet.id, petMesh);

      petAnimStateMap.set(pet.id, {
        currentSpeed: 0,
        velocity: new THREE.Vector3(),
        distToTarget: 0,
        isCastingSkill: false,
        skillPhase: 'anticipation',
        skillTimer: 0,
        damageTimer: 0,
        stunTimer: 0,
      });
    });

    // Touch & Mouse controls listeners for camera drag
    let touchStartX = 0;
    let touchStartY = 0;
    let isDraggingCam = false;

    const dom = renderer.domElement;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1 && e.touches[0].clientX > window.innerWidth * 0.35) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isDraggingCam = true;
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingCam || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      camYaw -= dx * 0.006;
      // Inverted up and down dragging fixed so dragging up pitches down toward horizon, dragging down pitches up toward bird's-eye
      camPitch = Math.max(0.12, Math.min(0.85, camPitch + dy * 0.005));
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = () => {
      isDraggingCam = false;
    };

    // Desktop Mouse Dragging
    let isMouseDragging = false;
    let mouseStartX = 0;
    let mouseStartY = 0;
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDragging = true;
        mouseStartX = e.clientX;
        mouseStartY = e.clientY;
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDragging) return;
      const dx = e.clientX - mouseStartX;
      const dy = e.clientY - mouseStartY;
      camYaw -= dx * 0.006;
      camPitch = Math.max(0.12, Math.min(0.85, camPitch + dy * 0.005));
      mouseStartX = e.clientX;
      mouseStartY = e.clientY;
    };
    const handleMouseUp = () => {
      isMouseDragging = false;
    };

    dom.addEventListener('touchstart', handleTouchStart, { passive: true });
    dom.addEventListener('touchmove', handleTouchMove, { passive: true });
    dom.addEventListener('touchend', handleTouchEnd, { passive: true });
    dom.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Timers
    const clock = new THREE.Clock();
    let frameId = 0;
    let footstepTimer = 0;
    let growCheckTimer = 0;
    let lastHandledJump = 0;
    let lastLocation = stateRef.current.currentLocation;
    let wasNearPortal = false;
    let wasWarping = false;

    // Software WebGL pacing helper
    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    // --- SKILL EXECUTION IN 3D WORLD & INSTANCE COMBAT ---
    function executePetSkill(petId: string) {
      currentSkillCasting = {
        petId,
        phase: 'anticipation',
        timer: 0.22,
      };
      const pAnimState = petAnimStateMap.get(petId);
      if (pAnimState) {
        pAnimState.isCastingSkill = true;
        pAnimState.skillPhase = 'anticipation';
        pAnimState.skillTimer = 0.22;
      }

      const pPos = playerPhysics.pos;
      const inWild = stateRef.current.currentLocation === 'wild_grounds';
      const pet = stateRef.current.pets.find((p) => p.id === petId);
      const level = pet?.level || 1;

      // Combat damage helper: applies damage and checks active equipped passives
      const dealDamageInRadius = (
        center: THREE.Vector3,
        radius: number,
        baseDmg: number,
        options?: {
          isFoxSkill?: boolean;
          isRabbitSkill?: boolean;
          isOwlSkill?: boolean;
          isBearSkill?: boolean;
          isSlimeSkill?: boolean;
          knockback?: number;
          stunDuration?: number;
          airborne?: boolean;
          slowPct?: number;
          slowDuration?: number;
          armorRupture?: boolean;
        }
      ) => {
        if (!inWild) return;
        const equipped = stateRef.current.player.equippedSkillSlots;
        const foxPet = stateRef.current.pets.find((p) => p.id === 'pet_fox');
        const rabbitPet = stateRef.current.pets.find((p) => p.id === 'pet_rabbit');
        const owlPet = stateRef.current.pets.find((p) => p.id === 'pet_owl');
        const bearPet = stateRef.current.pets.find((p) => p.id === 'pet_bear');

        const hasBurningSpirit = equipped.includes('pet_fox');
        const hasPredatorInstinct = equipped.includes('pet_rabbit');
        const hasAerialHunter = equipped.includes('pet_owl');
        const hasWolfMight = equipped.includes('pet_wolf');
        const hasDragonMight = equipped.includes('pet_dragon');

        let enemiesHitCount = 0;

        for (let i = activeEnemies.length - 1; i >= 0; i--) {
          const enemy = activeEnemies[i];
          const dist = enemy.mesh.position.distanceTo(center);
          if (dist <= radius) {
            enemiesHitCount++;
            let finalDmg = baseDmg;

            // Wolf Pack Instinct & Dragon Might damage multiplier
            if (hasWolfMight) finalDmg *= 1.25;
            if (hasDragonMight) finalDmg *= 1.35;

            // Armor rupture from Bear Earthshatter Lv 40+
            if (enemy.armorRuptureTimer > 0) {
              finalDmg *= 1.35;
            }

            // Burning Spirit Lv 40 Conflagration: burning enemies take +25% from all skills
            if (enemy.burnTimer > 0 && hasBurningSpirit && (foxPet?.level || 1) >= 40) {
              finalDmg *= 1.25;
            }

            // Owl Aerial Hunter: +20% to +50% damage against airborne, stunned, slowed, or grouped enemies
            if (hasAerialHunter) {
              const isCCed = enemy.isAirborne || enemy.stunTimer > 0 || enemy.slowTimer > 0;
              let isGrouped = false;
              for (const other of activeEnemies) {
                if (other !== enemy && other.mesh.position.distanceTo(enemy.mesh.position) <= 3.5) {
                  isGrouped = true;
                  break;
                }
              }
              if (isCCed || isGrouped) {
                const owlLvl = owlPet?.level || 1;
                const owlBonus = owlLvl >= 50 ? 0.50 : owlLvl >= 10 ? 0.30 : 0.20;
                finalDmg *= (1 + owlBonus);
              }
            }

            // Rabbit Predator Instinct: Critical Hit chance against enemies with low health (< 50% HP)
            let isCrit = false;
            if (hasPredatorInstinct) {
              const rabLvl = rabbitPet?.level || 1;
              const hpPct = enemy.health / enemy.maxHealth;
              let critChance = rabLvl >= 10 ? 0.12 : 0.05;
              if (hpPct <= 0.5) {
                critChance += rabLvl >= 50 ? 0.90 : rabLvl >= 10 ? 0.40 : 0.25;
              }
              if (options?.isRabbitSkill && rabLvl >= 50) {
                critChance = 1.0; // 100% Guaranteed Crit at Lv 50
              }
              if (Math.random() < critChance) {
                isCrit = true;
                const critMult = hpPct <= 0.3 && rabLvl >= 30 ? 2.2 : 1.6;
                finalDmg *= critMult;
                soundEngine.playCritHit();
                particleSys.spawnCritImpact(enemy.mesh.position);
                if (rabLvl >= 20) {
                  playerPhysics.speedBoostTimer = 2.0;
                }
              }
            }

            // Apply Damage & Combat Feedback
            finalDmg = Math.round(finalDmg);
            enemy.health -= finalDmg;
            enemy.hitFlashTimer = 0.14;
            particleSys.spawnDamageNumber(enemy.mesh.position, finalDmg, isCrit, enemy.isBoss);

            if (enemy.isBoss) {
              particleSys.spawnBossHit(enemy.mesh.position);
            } else {
              particleSys.spawnCombatHit(enemy.mesh.position, isCrit ? 0xffb703 : 0xff0054);
            }
            if (!isCrit) soundEngine.playCombatHit();

            // Fox Burning Spirit: applies damage over time to targets hit by Fox's abilities
            if (options?.isFoxSkill && hasBurningSpirit) {
              const foxLvl = foxPet?.level || 1;
              enemy.burnTimer = foxLvl >= 20 ? 4.5 : 3.0;
              enemy.burnDmgPerTick = Math.round(15 + foxLvl * 1.6);
              enemy.burnTickTimer = 0;
              enemy.burnSourceLevel = foxLvl;
              if (foxLvl >= 20) {
                enemy.slowTimer = 4.0;
                enemy.slowFactor = 0.75;
              }
              particleSys.spawnBurnTick(enemy.mesh.position);
            }

            // Status effects from options
            if (options?.stunDuration && options.stunDuration > 0) {
              enemy.stunTimer = Math.max(enemy.stunTimer, options.stunDuration);
              particleSys.spawnStunStars(enemy.mesh.position);
            }
            if (options?.slowDuration && options.slowDuration > 0 && options.slowPct) {
              enemy.slowTimer = Math.max(enemy.slowTimer, options.slowDuration);
              enemy.slowFactor = Math.min(enemy.slowFactor, 1 - options.slowPct);
            }
            if (options?.airborne) {
              enemy.isAirborne = true;
              enemy.airborneTimer = 0.6;
            }
            if (options?.armorRupture) {
              enemy.armorRuptureTimer = 5.0;
            }

            // Physical Knockback
            const kbDist = options?.knockback || 0.8;
            const kb = _vec3A.subVectors(enemy.mesh.position, center).normalize().multiplyScalar(kbDist);
            enemy.mesh.position.add(kb);

            // Update health bar scale
            const pct = Math.max(0, enemy.health / enemy.maxHealth);
            enemy.healthBarForeground.scale.x = pct;

            // Defeated check
            if (enemy.health <= 0) {
              // Fox Lv 30 Spreading Embers: spreads burn to nearby enemies
              if (enemy.burnTimer > 0 && hasBurningSpirit && (foxPet?.level || 1) >= 30) {
                for (const other of activeEnemies) {
                  if (other !== enemy && other.health > 0 && other.mesh.position.distanceTo(enemy.mesh.position) <= 5.0) {
                    other.burnTimer = 3.5;
                    other.burnDmgPerTick = enemy.burnDmgPerTick;
                    particleSys.spawnBurnTick(other.mesh.position);
                  }
                }
              }
              // Rabbit Lv 40 Hunting Rush: crit kill restores 8% max HP
              if (isCrit && hasPredatorInstinct && (rabbitPet?.level || 1) >= 40) {
                const heal = Math.round((stateRef.current.player.maxHealth || 100) * 0.08);
                stateRef.current.onUpdatePlayer((prev) => ({
                  ...prev,
                  health: Math.min(prev.maxHealth || 100, (prev.health ?? 100) + heal),
                }));
                particleSys.spawnHealingBubbles(playerPhysics.pos);
              }

              particleSys.spawnEnemyDefeat(enemy.mesh.position);
              soundEngine.playEnemyDefeat();
              enemiesGroup.remove(enemy.mesh);
              activeEnemies.splice(i, 1);

              const waveConfig = INSTANCE_WAVES[currentWaveIndex] || INSTANCE_WAVES[0];
              const rewardPiece = Math.max(1, Math.round(waveConfig.essenceReward / waveConfig.enemyCount));
              waveClearedSummary.essenceEarned += rewardPiece;
              stateRef.current.onUpdatePlayer((prev) => ({
                ...prev,
                petEssence: (prev.petEssence || 0) + rewardPiece,
              }));

              stateRef.current.onWaveInfoChange({
                wave: currentWaveIndex + 1,
                title: waveConfig.title,
                enemiesRemaining: activeEnemies.length,
                prepCountdown: prepCountdownTimer,
              });
            }
          }
        }

        // Rabbit Lv 40 Celerity Bounce refund:
        if (options?.isRabbitSkill && enemiesHitCount >= 2 && (rabbitPet?.level || 1) >= 40) {
          stateRef.current.onShowMessage('⚡ Celerity Bounce! Multi-hit refunded 50% cooldown!');
        }
      };

      if (petId === 'pet_fox') {
        // FOX: Flame Dash (Active) & Burning Spirit (Passive)
        const stats = computeActiveSkillStats('pet_fox', level) as any;
        soundEngine.playFlameDash();
        playerPhysics.speedBoostTimer = 3.5;
        stateRef.current.onShowMessage(`Ember used Flame Dash! (${stats.damage} damage & burning trail)`);

        // Smooth forward dash animation across frames
        playerPhysics.dashTimer = 0.28;
        playerPhysics.dashSpeed = 22.0;
        playerPhysics.dashDir.set(Math.sin(playerPhysics.rotY), 0, Math.cos(playerPhysics.rotY));
        particleSys.spawnFlameTrail(playerPhysics.pos);
        particleSys.spawnFlameGroundPatch(playerPhysics.pos);

        // At end of dash, radial explosion + damage
        setTimeout(() => {
          particleSys.spawnFlameExplosion(playerPhysics.pos, stats.radius);
          particleSys.spawnFlameGroundPatch(playerPhysics.pos);
          dealDamageInRadius(playerPhysics.pos, stats.radius, stats.damage, {
            isFoxSkill: true,
            knockback: 1.2,
          });

          if (!inWild) {
            const currentPlots = [...stateRef.current.farmPlots];
            let boosted = false;
            currentPlots.forEach((plot) => {
              const dist = Math.hypot(plot.x - pPos.x, plot.z - pPos.z);
              if (dist < 5.0 && plot.cropId && plot.growProgress < 1.0) {
                plot.growProgress = Math.min(1.0, plot.growProgress + 0.4);
                boosted = true;
              }
            });
            if (boosted) {
              stateRef.current.onUpdatePlots(currentPlots);
              rebuildFarmPlotMeshes(currentPlots);
            }
          }
        }, 280);
      } else if (petId === 'pet_turtle') {
        // TURTLE: Tidal Barrier (Active) & Ocean Armor (Passive)
        const stats = computeActiveSkillStats('pet_turtle', level) as any;
        soundEngine.playTidalBarrier();
        particleSys.spawnWaterBurst(pPos, stats.radius);
        particleSys.spawnShieldRipple(pPos);
        playerPhysics.shield = stats.shield;
        playerPhysics.maxShield = stats.shield;

        if (waterShieldMesh) {
          waterShieldMesh.visible = true;
          waterShieldMesh.scale.set(1.25, 1.25, 1.25);
        }

        dealDamageInRadius(pPos, stats.radius, stats.damage, {
          knockback: stats.knockbackForce,
          slowPct: stats.slowPct,
          slowDuration: 3.0,
        });
        stateRef.current.onShowMessage(`Shelly cast Tidal Barrier! +${stats.shield} Water Shield & shockwave repelled foes.`);

        if (!inWild) {
          const currentPlots = stateRef.current.farmPlots.map((plot) => {
            const dist = Math.hypot(plot.x - pPos.x, plot.z - pPos.z);
            if (dist <= 7.0 && plot.tilled) {
              return { ...plot, watered: true, waterLevel: 1.0 };
            }
            return plot;
          });
          stateRef.current.onUpdatePlots(currentPlots);
          rebuildFarmPlotMeshes(currentPlots);
        }
      } else if (petId === 'pet_rabbit') {
        // RABBIT: Phantom Leap (Active) & Predator Instinct (Passive)
        const stats = computeActiveSkillStats('pet_rabbit', level) as any;
        soundEngine.playPhantomLeap();

        // Squash anticipation
        playerMesh.scale.set(1.25, 0.65, 1.25);
        stateRef.current.onShowMessage(`Hoppy executed Phantom Leap! (${stats.damage} area stomp damage)`);

        setTimeout(() => {
          playerPhysics.velY = 16.5;
          playerPhysics.isGrounded = false;
          playerMesh.scale.set(0.85, 1.3, 0.85);

          // Launch forward arc
          const leapFwd = _vec3A.set(Math.sin(playerPhysics.rotY), 0, Math.cos(playerPhysics.rotY)).multiplyScalar(6.5);
          playerPhysics.pos.add(leapFwd);

          // Phantom motion silhouette trail
          particleSys.spawnPhantomTrail(playerPhysics.pos, playerPhysics.rotY);

          setTimeout(() => {
            // Landing impact: crater decal + landing stomp shockwave + recovery squash
            playerMesh.scale.set(1.3, 0.65, 1.3);
            particleSys.spawnCraterDecal(playerPhysics.pos, stats.radius);
            particleSys.spawnPhantomLanding(playerPhysics.pos, stats.radius);

            dealDamageInRadius(playerPhysics.pos, stats.radius, stats.damage, {
              isRabbitSkill: true,
              airborne: stats.knockbackAirborne,
              knockback: 1.4,
            });

            setTimeout(() => {
              playerMesh.scale.set(1, 1, 1);
            }, 120);

            if (!inWild) {
              const currentPlots = [...stateRef.current.farmPlots];
              let harvestCount = 0;
              currentPlots.forEach((plot) => {
                const dist = Math.hypot(plot.x - playerPhysics.pos.x, plot.z - playerPhysics.pos.z);
                if (dist < 5.5 && plot.cropId && plot.growProgress >= 1.0) {
                  const crop = plot.cropId;
                  plot.cropId = null;
                  plot.isHarvested = true;
                  plot.plantedAt = null;
                  plot.growProgress = 0;
                  stateRef.current.onAddInventory(crop, 2);
                  const hPos = new THREE.Vector3(plot.x, 0.4, plot.z);
                  particleSys.spawnHarvestPop(hPos, 0xffd166);
                  particleSys.spawnHarvestBurst(hPos);
                  const itemMesh = createHarvestItemMesh(crop);
                  particleSys.spawnHarvestFlyItem(hPos, playerPhysics.pos, itemMesh);
                  particleSys.spawnDamageNumber(hPos, `+2 ${crop.toUpperCase()}`, false, false, 'heal');
                  harvestCount++;
                }
              });
              if (harvestCount > 0) {
                soundEngine.playHarvest();
                stateRef.current.onUpdatePlots(currentPlots);
                rebuildFarmPlotMeshes(currentPlots);
                stateRef.current.onShowMessage(`Phantom Leap harvested ${harvestCount} crops!`);
              }
            }
          }, 360);
        }, 90);
      } else if (petId === 'pet_owl') {
        // OWL: Cyclone (Active) & Aerial Hunter (Passive)
        const stats = computeActiveSkillStats('pet_owl', level) as any;
        soundEngine.playCyclone();
        stateRef.current.onShowMessage(`Barnaby created Cyclone! Tornado pulls enemies together and shreds them!`);

        // Spawn position: 4m ahead of player
        const spawnPos = playerPhysics.pos.clone();
        const fwd = _vec3A.set(Math.sin(playerPhysics.rotY), 0, Math.cos(playerPhysics.rotY));
        spawnPos.addScaledVector(fwd, 4.0);

        // Multi-layer rotating 3D tornado group with tiered rings and floating leaves
        const cycloneGroup = new THREE.Group();
        cycloneGroup.position.copy(spawnPos);
        const windMat = new THREE.MeshBasicMaterial({ color: 0x99f6e4, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
        const leafMat = new THREE.MeshBasicMaterial({ color: 0x52b788, side: THREE.DoubleSide });

        for (let ringIdx = 0; ringIdx < 6; ringIdx++) {
          const r = 0.4 + ringIdx * 0.45;
          const torus = new THREE.Mesh(new THREE.TorusGeometry(r, 0.07, 6, 18), windMat);
          torus.rotation.x = Math.PI / 2;
          torus.position.y = 0.15 + ringIdx * 0.62;
          cycloneGroup.add(torus);

          // Add orbiting autumn leaves
          for (let l = 0; l < 2; l++) {
            const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.14), leafMat);
            const ang = (l * Math.PI) + ringIdx * 0.7;
            leaf.position.set(Math.cos(ang) * (r * 0.9), torus.position.y, Math.sin(ang) * (r * 0.9));
            leaf.rotation.set(Math.random(), Math.random(), Math.random());
            cycloneGroup.add(leaf);
          }
        }
        scene.add(cycloneGroup);

        particleSys.spawnCycloneVortex(spawnPos, stats.duration, stats.radius);

        activeCyclones.push({
          mesh: cycloneGroup,
          pos: spawnPos,
          duration: stats.duration,
          maxDuration: stats.duration,
          radius: stats.radius,
          tickTimer: 0,
          tickDamage: stats.tickDamage,
          level,
          hasRazorFeathers: stats.razorFeathers,
          hasCenterStun: stats.centerStun,
        });

        if (!inWild) {
          const currentPlots = [...stateRef.current.farmPlots];
          currentPlots.forEach((plot) => {
            if (plot.cropId && plot.growProgress < 1.0) {
              plot.growProgress = Math.min(1.0, plot.growProgress + 0.35);
            }
          });
          stateRef.current.onUpdatePlots(currentPlots);
          rebuildFarmPlotMeshes(currentPlots);
          const seedTypes = ['seed_pumpkin', 'seed_corn', 'seed_strawberry'];
          stateRef.current.onAddInventory(seedTypes[Math.floor(Math.random() * seedTypes.length)], 2);
        }
      } else if (petId === 'pet_bear') {
        // BEAR: Earthshatter (Active) & Unyielding (Passive)
        const stats = computeActiveSkillStats('pet_bear', level) as any;
        soundEngine.playEarthshatter();

        // Heavy attack anticipation: rear up arms and pause
        if (playerMesh.userData.leftArm) playerMesh.userData.leftArm.rotation.x = -2.4;
        if (playerMesh.userData.rightArm) playerMesh.userData.rightArm.rotation.x = -2.4;
        playerMesh.position.y += 0.25;
        stateRef.current.onShowMessage(`Grizz unleashed Earthshatter! Stunned surrounding foes for ${stats.stunDuration}s!`);

        setTimeout(() => {
          playerMesh.position.y = playerPhysics.pos.y;
          if (playerMesh.userData.leftArm) playerMesh.userData.leftArm.rotation.x = 0;
          if (playerMesh.userData.rightArm) playerMesh.userData.rightArm.rotation.x = 0;

          // Ground impact: radial fissures, stone spikes, flying rocks
          particleSys.spawnFissureCracks(playerPhysics.pos, stats.radius);
          particleSys.spawnEarthshatterSpikes(playerPhysics.pos, stats.radius);

          dealDamageInRadius(playerPhysics.pos, stats.radius, stats.damage, {
            isBearSkill: true,
            stunDuration: stats.stunDuration,
            armorRupture: stats.armorRupture,
            knockback: 1.8,
          });

          if (!inWild) {
            const currentPlots = stateRef.current.farmPlots.map((plot) => {
              const dist = Math.hypot(plot.x - playerPhysics.pos.x, plot.z - playerPhysics.pos.z);
              if (dist <= 7.5) return { ...plot, tilled: true };
              return plot;
            });
            stateRef.current.onUpdatePlots(currentPlots);
            rebuildFarmPlotMeshes(currentPlots);
            const distToQuarry = Math.hypot(23 - playerPhysics.pos.x, -8 - playerPhysics.pos.z);
            if (distToQuarry < 9) {
              stateRef.current.onAddInventory('stone', 12);
              stateRef.current.onShowMessage('Quarry shattered: +12 Stone!');
            }
          }
        }, 220);
      } else if (petId === 'pet_slime') {
        // SLIME: Arcane Burst (Active) & Gelatinous Body (Passive)
        const stats = computeActiveSkillStats('pet_slime', level) as any;

        // Charging anticipation: glowing mana orb grows above player
        const chargeOrb = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0x9d4edd, wireframe: true, transparent: true, opacity: 0.85 })
        );
        chargeOrb.position.set(playerPhysics.pos.x, playerPhysics.pos.y + 1.6, playerPhysics.pos.z);
        scene.add(chargeOrb);

        setTimeout(() => {
          scene.remove(chargeOrb);
          chargeOrb.geometry.dispose();
          (chargeOrb.material as THREE.Material).dispose();

          soundEngine.playArcaneBurst();
          particleSys.spawnArcaneNova(playerPhysics.pos, stats.radius);
          particleSys.spawnAscendingHealAura(playerPhysics.pos);

          dealDamageInRadius(playerPhysics.pos, stats.radius, stats.damage, {
            isSlimeSkill: true,
            slowPct: stats.slowDuration > 0 ? 0.5 : 0,
            slowDuration: stats.slowDuration,
          });

          // Restores Player Health & floating green heal number
          stateRef.current.onUpdatePlayer((prev) => ({
            ...prev,
            health: Math.min(prev.maxHealth || 100, (prev.health ?? prev.maxHealth ?? 100) + stats.heal),
          }));
          particleSys.spawnDamageNumber(playerPhysics.pos, stats.heal, false, false, 'heal');
          particleSys.spawnHealingBubbles(playerPhysics.pos);
          stateRef.current.onShowMessage(`Boba cast Arcane Burst! Restored +${stats.heal} HP & blasted enemies!`);

          if (stats.doubleEcho) {
            setTimeout(() => {
              if (stateRef.current.currentLocation === 'wild_grounds') {
                particleSys.spawnArcaneNova(playerPhysics.pos, stats.radius * 0.8);
                dealDamageInRadius(playerPhysics.pos, stats.radius * 0.8, stats.damage * 0.6, { isSlimeSkill: true });
              }
            }, 600);
          }

          stateRef.current.onUpdatePets((prev) =>
            prev.map((p) => ({ ...p, happiness: 100, hunger: 100 }))
          );
        }, 220);

        stateRef.current.onUpdatePets((prev) =>
          prev.map((p) => ({ ...p, happiness: 100, hunger: 100 }))
        );
      } else if (petId === 'pet_frog') {
        // Frog Splash Hop
        const stats = computeActiveSkillStats('pet_frog', level) as any;
        soundEngine.playWaterSplash();
        particleSys.spawnWaterBurst(pPos, stats.radius);
        dealDamageInRadius(pPos, stats.radius, stats.damage, {
          knockback: 1.2,
          slowPct: stats.slowPct,
          slowDuration: 2.5,
        });
        stateRef.current.onShowMessage(`Puddles used Splash Hop! Tidal wave strikes foes for ${stats.damage} damage.`);
      } else if (petId === 'pet_wolf') {
        // Wolf Lunar Howl
        const stats = computeActiveSkillStats('pet_wolf', level) as any;
        soundEngine.playBossRoar();
        particleSys.spawnEarthshatterSpikes(pPos, stats.radius);
        playerPhysics.speedBoostTimer = 4.0;
        dealDamageInRadius(pPos, stats.radius, stats.damage, {
          stunDuration: stats.fearDuration,
          knockback: 1.4,
        });
        stateRef.current.onShowMessage(`Shadow howled! Fear strikes foes and attack power boosted by +${Math.round(stats.attackBoostPct * 100)}%!`);
      } else if (petId === 'pet_deer') {
        // Deer Nature Sprint
        const stats = computeActiveSkillStats('pet_deer', level) as any;
        soundEngine.playSwiftLeap();
        playerPhysics.speedBoostTimer = 4.0;
        stateRef.current.onUpdatePlayer((prev) => ({
          ...prev,
          health: Math.min(prev.maxHealth || 100, (prev.health ?? 100) + stats.heal),
        }));
        dealDamageInRadius(pPos, stats.radius, stats.damage);
        stateRef.current.onShowMessage(`Fawn sprinted forward! Restored +${stats.heal} HP & surging speed!`);
      } else if (petId === 'pet_dragon') {
        // Dragon Inferno Nova
        const stats = computeActiveSkillStats('pet_dragon', level) as any;
        soundEngine.playBossRoar();
        particleSys.spawnFlameExplosion(pPos, stats.radius);
        particleSys.spawnEarthshatterSpikes(pPos, stats.radius);
        dealDamageInRadius(pPos, stats.radius, stats.damage, {
          isFoxSkill: true,
          knockback: 2.5,
        });
        stateRef.current.onShowMessage(`Ignis unleashed Inferno Nova! Massive ${stats.damage} cataclysmic damage!`);
      } else if (petId === 'pet_phoenix') {
        // Phoenix Solar Flare
        const stats = computeActiveSkillStats('pet_phoenix', level) as any;
        soundEngine.playVictory();
        particleSys.spawnArcaneNova(pPos, stats.radius);
        stateRef.current.onUpdatePlayer((prev) => ({ ...prev, health: prev.maxHealth || 100 }));
        dealDamageInRadius(pPos, stats.radius, stats.damage, {
          stunDuration: stats.blindStun ? 2.0 : 0,
        });
        stateRef.current.onShowMessage(`Solara summoned Solar Flare! 100% Full Health Revive & Holy Blast!`);
      }
    }

    // Performance monitoring tracking variables
    let perfLastTimestamp = performance.now();
    let perfFrameCount = 0;
    let perfFrameTimeAccum = 0;
    let loopFrameIndex = 0;

    // Main tick loop
    function tick() {
      const frameStartTime = performance.now();
      loopFrameIndex++;
      const delta = Math.min(clock.getDelta(), 0.1);
      const now = Date.now();

      // Check for location change (Farm <-> Wild Grounds)
      const currentLoc = stateRef.current.currentLocation;
      if (currentLoc !== lastLocation) {
        lastLocation = currentLoc;
        isPlayerVictory = false;
        isPlayerDefeat = false;
        playerDamageTimer = 0;
        playerLandingTimer = 0;
        currentSkillCasting = null;

        if (currentLoc === 'wild_grounds') {
          farmEnvironmentGroup.visible = false;
          instanceEnvironmentGroup.visible = true;
          playerPhysics.pos.set(0, 0, 0);
          playerPhysics.rotY = 0;
          playerPhysics.shield = 0;
          if (waterShieldMesh) waterShieldMesh.visible = false;
          bearCheatDeathUsed = false;
          slimeCheatDeathUsed = false;
          fortitudeStacks = 0;
          fortitudeTimer = 0;
          outOfCombatDamageTimer = 5.0;
          currentWaveIndex = 0;
          prepCountdownTimer = 4.0;
          waveClearedSummary = { wavesCleared: 0, essenceEarned: 0, goldEarned: 0 };
          instanceActive = true;
          soundEngine.playPortalWarp();
          scene.background = new THREE.Color(0x1a1226);
          scene.fog = new THREE.Fog(0x1a1226, 25, 65);
          sunLight.color.setHex(0xb5838d);
          hemiLight.color.setHex(0x5a189a);
        } else {
          farmEnvironmentGroup.visible = true;
          instanceEnvironmentGroup.visible = false;
          playerPhysics.pos.set(-11, 0, -8); // spawn outside portal on farm
          instanceActive = false;
          sunLight.color.setHex(0xfffae0);
          hemiLight.color.setHex(0xe0f2fe);
        }

        // Reposition follower pets smoothly around spawn position
        petMeshMap.forEach((mesh) => {
          mesh.position.set(
            playerPhysics.pos.x + (Math.random() - 0.5) * 3,
            0,
            playerPhysics.pos.z - 2 + (Math.random() - 0.5) * 2
          );
        });
      }

      // Check for incoming skill cast requests from HUD
      const trigger = stateRef.current.skillCastTrigger;
      if (trigger && trigger.timestamp !== lastHandledSkillRef.current) {
        lastHandledSkillRef.current = trigger.timestamp;
        executePetSkill(trigger.petId);
        stateRef.current.onSkillCastHandled();
      }

      // Windmill blade spin
      windmillBlades.rotation.z += delta * 0.8;

      // Wild Grounds Upgraded Portal Animation & Particle FX
      if (portalRef.current) {
        const portalObj = portalRef.current;
        const portalPos = portalObj.group.position;
        const distToPortal = Math.hypot(portalPos.x - playerPhysics.pos.x, portalPos.z - playerPhysics.pos.z);
        const activeTheme = portalObj.currentTheme;
        const themeHex = PORTAL_THEMES[activeTheme]?.particleColor ?? 0x38bdf8;

        // Check if warp transition just triggered
        if (stateRef.current.isWarping && !wasWarping) {
          wasWarping = true;
          portalObj.triggerWarpAnimation(() => {});
          particleSys.spawnPortalWarpBurst(portalPos, themeHex);
        } else if (!stateRef.current.isWarping && wasWarping) {
          wasWarping = false;
        }

        portalObj.update(delta, distToPortal, Boolean(stateRef.current.isWarping));

        // Ambient particles when on the farm
        if (stateRef.current.currentLocation === 'farm') {
          if (distToPortal < 4.8) {
            // Proximity aura - extra swirling motes
            if (Math.random() < 0.35) {
              particleSys.spawnPortalProximityAura(portalPos, themeHex);
            }
          } else if (distToPortal < 16.0) {
            // Subtle idle floating motes
            if (Math.random() < 0.16) {
              particleSys.spawnPortalIdleMote(portalPos, themeHex);
            }
          }
        }
      }

      // Update particle effects
      particleSys.update(delta);

      // Update Atmospheric Environment System (Day/Night, Wind, Swaying Trees, Crops, Clouds, Birds, Butterflies, Water)
      envSystem.update(delta, [], stateRef.current.currentLocation, particleSys);
      if (stateRef.current.onTimePhaseChange) {
        stateRef.current.onTimePhaseChange(envSystem.getTimePhase(), envSystem.timeOfDay);
      }

      // Handle mobile camera turn buttons
      if (stateRef.current.camTurnDelta !== 0) {
        camYaw += stateRef.current.camTurnDelta * delta * 2.2;
      }

      // Handle mobile jump trigger button
      if (stateRef.current.jumpCount !== lastHandledJump) {
        lastHandledJump = stateRef.current.jumpCount;
        if (playerPhysics.isGrounded) {
          playerPhysics.velY = 9.2;
          playerPhysics.isGrounded = false;
          soundEngine.playSwiftLeap();
        }
      }

      // --- PLAYER MOVEMENT CALCULATIONS (Driven 100% by Mobile Joystick) ---
      let moveX = 0;
      let moveZ = 0;

      const joy = stateRef.current.joystickInput;
      if (joy && (Math.abs(joy.x) > 0.05 || Math.abs(joy.y) > 0.05)) {
        moveX = joy.x;
        moveZ = -joy.y;
      }

      const inputLen = Math.hypot(moveX, moveZ);
      const isMoving = inputLen > 0.1;

      let moveSpeed = 6.2;
      const equipped = stateRef.current.player.equippedSkillSlots;
      if (equipped.includes('pet_fox')) moveSpeed *= 1.15; // Fox passive
      if (playerPhysics.speedBoostTimer > 0) {
        playerPhysics.speedBoostTimer -= delta;
        moveSpeed *= 1.75;
        if (Math.random() < 0.4) {
          particleSys.spawnFlameTrail(playerPhysics.pos);
        }
      }

      // Smooth continuous Flame Dash forward translation across frames
      if (playerPhysics.dashTimer > 0) {
        playerPhysics.dashTimer -= delta;
        playerPhysics.pos.addScaledVector(playerPhysics.dashDir, playerPhysics.dashSpeed * delta);
        particleSys.spawnFlameTrail(playerPhysics.pos);
        if (Math.random() < 0.45) {
          particleSys.spawnFlameGroundPatch(playerPhysics.pos);
        }
      }

      if (isMoving) {
        const normX = moveX / inputLen;
        const normZ = moveZ / inputLen;

        // Camera relative movement
        const forward = _vec3A.set(Math.sin(camYaw), 0, Math.cos(camYaw));
        const right = _vec3B.set(-Math.cos(camYaw), 0, Math.sin(camYaw));

        const worldDir = _vec3Cam
          .set(0, 0, 0)
          .addScaledVector(right, normX)
          .addScaledVector(forward, normZ)
          .normalize();

        playerPhysics.pos.addScaledVector(worldDir, moveSpeed * delta * Math.min(inputLen, 1));

        // Smooth rotation towards movement direction
        const targetRotY = Math.atan2(worldDir.x, worldDir.z);
        const rotDiff = THREE.MathUtils.euclideanModulo(targetRotY - playerPhysics.rotY + Math.PI, Math.PI * 2) - Math.PI;
        playerPhysics.rotY += rotDiff * Math.min(delta * 14, 1);

        // Bounds check (radius ~32m in instance, ~36m on farm)
        const maxDist = currentLoc === 'wild_grounds' ? 30 : 36;
        const distFromCenter = Math.hypot(playerPhysics.pos.x, playerPhysics.pos.z);
        if (distFromCenter > maxDist) {
          playerPhysics.pos.setLength(maxDist);
        }

        // Footstep audio during movement
        footstepTimer += delta;
        const footstepInterval = moveSpeed > 5.5 ? 0.24 : 0.35;
        if (footstepTimer > footstepInterval) {
          soundEngine.playFootstep();
          footstepTimer = 0;
        }

        // Check character water ripple & splash interaction on pond and river
        if (stateRef.current.currentLocation === 'farm') {
          envSystem.checkWaterInteraction([{ id: 'player', pos: playerPhysics.pos, isMoving: true }], particleSys);
        }
      }

      // Jumping & Gravity
      if (!playerPhysics.isGrounded) {
        playerPhysics.velY -= 24 * delta;
        playerPhysics.pos.y += playerPhysics.velY * delta;
        if (playerPhysics.pos.y <= 0) {
          playerPhysics.pos.y = 0;
          playerPhysics.velY = 0;
          playerPhysics.isGrounded = true;
          playerLandingTimer = 0.18; // Trigger landing impact squash
          soundEngine.playFootstep();
        }
      }

      // Decrement player reaction timers
      if (playerLandingTimer > 0) playerLandingTimer -= delta;
      if (playerDamageTimer > 0) playerDamageTimer -= delta;
      if (playerStunTimer > 0) playerStunTimer -= delta;
      if (playerAttackTimer > 0) playerAttackTimer -= delta;

      // Update skill casting state machine for player
      if (currentSkillCasting) {
        currentSkillCasting.timer -= delta;
        if (currentSkillCasting.timer <= 0) {
          if (currentSkillCasting.phase === 'anticipation') {
            currentSkillCasting.phase = 'execution';
            currentSkillCasting.timer = 0.35;
          } else if (currentSkillCasting.phase === 'execution') {
            currentSkillCasting.phase = 'recovery';
            currentSkillCasting.timer = 0.18;
          } else {
            currentSkillCasting = null;
          }
        }
      }

      // Unified procedural player animation update across all 12 states
      const isJumping = !playerPhysics.isGrounded && playerPhysics.velY > 0.5;
      const isFalling = !playerPhysics.isGrounded && playerPhysics.velY < -0.5;
      playerAnimator.update(
        playerMesh,
        {
          position: playerPhysics.pos,
          velocity: isMoving ? _vec3Cam.clone().multiplyScalar(moveSpeed * Math.min(inputLen, 1)) : new THREE.Vector3(),
          horizontalSpeed: isMoving ? moveSpeed * Math.min(inputLen, 1) : 0,
          isGrounded: playerPhysics.isGrounded,
          isJumping,
          isFalling,
          isLanding: playerPhysics.isGrounded && playerLandingTimer > 0,
          landingTimer: Math.max(0, playerLandingTimer / 0.18),
          isAttacking: playerAttackTimer > 0,
          attackTimer: playerAttackTimer,
          isCastingSkill: currentSkillCasting !== null,
          skillId: currentSkillCasting?.petId,
          skillPhase: currentSkillCasting?.phase || 'anticipation',
          skillTimer: currentSkillCasting?.timer || 0,
          isTakingDamage: playerDamageTimer > 0,
          damageTimer: playerDamageTimer,
          isStunned: playerStunTimer > 0,
          stunTimer: playerStunTimer,
          isVictory: isPlayerVictory,
          isDefeat: isPlayerDefeat,
          walkCycle: playerPhysics.walkCycle,
        },
        delta
      );

      playerMesh.position.copy(playerPhysics.pos);
      playerMesh.rotation.y = playerPhysics.rotY;

      // Invulnerability tick
      if (playerPhysics.invulnTimer > 0) {
        playerPhysics.invulnTimer -= delta;
      }

      // Bear Fortitude decay
      if (fortitudeTimer > 0) {
        fortitudeTimer -= delta;
        if (fortitudeTimer <= 0) {
          fortitudeStacks = 0;
        }
      }

      // Slime Gelatinous Body out-of-combat heal (avoids damage for 3.5s)
      outOfCombatDamageTimer += delta;
      const equippedSlots = stateRef.current.player.equippedSkillSlots;
      if (equippedSlots.includes('pet_slime') && outOfCombatDamageTimer >= 3.5) {
        slimeRegenTicker += delta;
        if (slimeRegenTicker >= 2.0) {
          slimeRegenTicker = 0;
          const slimePet = stateRef.current.pets.find((p) => p.id === 'pet_slime');
          const sLvl = slimePet?.level || 1;
          const regenAmount = Math.round(5 + sLvl * 1.4);
          stateRef.current.onUpdatePlayer((prev) => {
            const maxHp = prev.maxHealth || 100;
            const cur = prev.health ?? maxHp;
            if (cur < maxHp) {
              const next = Math.min(maxHp, cur + regenAmount);
              particleSys.spawnHealingBubbles(playerPhysics.pos);
              return { ...prev, health: next };
            }
            return prev;
          });
        }
      }

      // Water Shield Mesh multi-layer animation & visual feedback
      if (playerPhysics.shield > 0) {
        waterShieldMesh.visible = true;
        const shieldData = waterShieldMesh.userData as any;
        if (shieldData) {
          if (shieldData.outerShield) shieldData.outerShield.rotation.y += delta * 1.8;
          if (shieldData.innerShield) shieldData.innerShield.rotation.y -= delta * 2.4;
          if (shieldData.ring1) shieldData.ring1.rotation.z += delta * 3.2;
          if (shieldData.ring2) shieldData.ring2.rotation.x += delta * 2.6;
          if (shieldData.orbGroup) shieldData.orbGroup.rotation.y += delta * 4.2;

          // Hit flash reaction
          if (shieldData.hitFlashTimer > 0) {
            shieldData.hitFlashTimer -= delta;
            waterShieldMesh.scale.set(1.22, 1.22, 1.22);
          } else {
            waterShieldMesh.scale.lerp(_vec3ScaleNormal, Math.min(delta * 8, 1));
          }

          // Low-shield visual feedback (under 35% shield)
          const shieldPct = playerPhysics.shield / Math.max(1, playerPhysics.maxShield);
          if (shieldPct < 0.35) {
            const pulse = 0.65 + Math.sin(now * 0.012) * 0.25;
            if (shieldData.outerShield?.material) {
              shieldData.outerShield.material.opacity = 0.45 * pulse;
            }
          } else if (shieldData.outerShield?.material) {
            shieldData.outerShield.material.opacity = 0.55;
          }
        } else {
          waterShieldMesh.rotation.y += delta * 3.2;
        }
      } else {
        waterShieldMesh.visible = false;
      }

      // Third-person camera tracking
      const targetCamX = playerPhysics.pos.x - Math.sin(camYaw) * (camDist * Math.cos(camPitch));
      const targetCamY = playerPhysics.pos.y + 1.2 + camDist * Math.sin(camPitch);
      const targetCamZ = playerPhysics.pos.z - Math.cos(camYaw) * (camDist * Math.cos(camPitch));

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 10, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 10, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 10, delta);

      _vec3Cam.set(playerPhysics.pos.x, playerPhysics.pos.y + 1.2, playerPhysics.pos.z);
      camera.lookAt(_vec3Cam);

      // Pet Following, Flocking, Obstacle Avoidance & Personality Animations
      const allPets = stateRef.current.pets;
      const followingPets = allPets.filter((p) => p.isFollowing);
      const followingMeshes = followingPets.map((p) => petMeshMap.get(p.id)).filter(Boolean) as PetMeshGroup[];

      allPets.forEach((pet, overallIdx) => {
        const mesh = petMeshMap.get(pet.id);
        if (!mesh) return;

        mesh.userData.animTime = (mesh.userData.animTime || 0) + delta;

        let pState = petAnimStateMap.get(pet.id);
        if (!pState) {
          pState = {
            currentSpeed: 0,
            velocity: new THREE.Vector3(),
            distToTarget: 0,
            isCastingSkill: false,
            skillPhase: 'anticipation',
            skillTimer: 0,
            damageTimer: 0,
            stunTimer: 0,
          };
          petAnimStateMap.set(pet.id, pState);
        }

        // Skill casting timers for pet
        if (pState.isCastingSkill) {
          pState.skillTimer -= delta;
          if (pState.skillTimer <= 0) {
            if (pState.skillPhase === 'anticipation') {
              pState.skillPhase = 'execution';
              pState.skillTimer = 0.35;
            } else if (pState.skillPhase === 'execution') {
              pState.skillPhase = 'recovery';
              pState.skillTimer = 0.2;
            } else {
              pState.isCastingSkill = false;
            }
          }
        }

        if (pState.damageTimer > 0) pState.damageTimer -= delta;
        if (pState.stunTimer > 0) pState.stunTimer -= delta;

        let petVel = pState.velocity;
        let petSpeed = 0;
        let distToTarget = 0;

        if (pet.isFollowing) {
          const followSlotIdx = followingPets.findIndex((p) => p.id === pet.id);
          const followResult = petFollowingController.updatePetPosition(
            mesh,
            playerPhysics.pos,
            playerPhysics.rotY,
            followSlotIdx >= 0 ? followSlotIdx : 0,
            followingMeshes,
            currentLoc === 'wild_grounds',
            delta
          );
          petVel = followResult.velocity;
          petSpeed = followResult.speed;
          distToTarget = followResult.distToTarget;
          pState.currentSpeed = petSpeed;
          pState.velocity.copy(petVel);
          pState.distToTarget = distToTarget;
        } else {
          // Pet is resting in farm habitat or idle spot
          pState.currentSpeed = 0;
          pState.velocity.set(0, 0, 0);
        }

        // Distance culling for performance: skip micro limb calculations if > 50m away
        const distToCamera = mesh.position.distanceTo(camera.position);
        if (distToCamera < 50.0) {
          petAnimator.update(
            mesh,
            {
              petId: pet.id,
              species: pet.species,
              position: mesh.position,
              velocity: petVel,
              speed: petSpeed,
              isGrounded: true,
              isFollowing: pet.isFollowing,
              targetPos: playerPhysics.pos,
              distToTarget,
              isCastingSkill: pState.isCastingSkill,
              skillPhase: pState.skillPhase,
              skillTimer: pState.skillTimer,
              isTakingDamage: pState.damageTimer > 0,
              damageTimer: pState.damageTimer,
              isStunned: pState.stunTimer > 0,
              stunTimer: pState.stunTimer,
              isVictory: isPlayerVictory,
              isDefeat: isPlayerDefeat,
              animTime: mesh.userData.animTime,
              slotIndex: overallIdx,
            },
            delta
          );
          // Water ripple & splash interaction when pet enters water
          if (stateRef.current.currentLocation === 'farm' && pet.isFollowing && petSpeed > 0.15) {
            envSystem.checkWaterInteraction([{ id: pet.id, pos: mesh.position, isMoving: true }], particleSys);
          }
        }
      });

      // ==========================================
      // WILD GROUNDS INSTANCE BATTLE LOGIC
      // ==========================================
      if (currentLoc === 'wild_grounds' && instanceActive) {
        if (prepCountdownTimer !== null) {
          prepCountdownTimer -= delta;
          if (prepCountdownTimer <= 0) {
            prepCountdownTimer = null;
            spawnWave(currentWaveIndex + 1);
          } else {
            const cfg = INSTANCE_WAVES[currentWaveIndex] || INSTANCE_WAVES[0];
            stateRef.current.onWaveInfoChange({
              wave: currentWaveIndex + 1,
              title: cfg.title,
              enemiesRemaining: 0,
              prepCountdown: Math.ceil(prepCountdownTimer),
            });
          }
        } else {
          // 1. Update active cyclones (Owl Cyclone active skill)
          for (let cIdx = activeCyclones.length - 1; cIdx >= 0; cIdx--) {
            const cyc = activeCyclones[cIdx];
            cyc.duration -= delta;
            cyc.mesh.rotation.y += delta * 7.5;
            cyc.mesh.children.forEach((child, idx) => {
              child.rotation.z += delta * (idx % 2 === 0 ? 3.5 : -3.5);
            });

            cyc.tickTimer -= delta;
            const isTick = cyc.tickTimer <= 0;
            if (isTick) cyc.tickTimer = 0.35;

            // Pull enemies towards cyclone and apply shredding damage ticks
            for (let eIdx = activeEnemies.length - 1; eIdx >= 0; eIdx--) {
              const enemy = activeEnemies[eIdx];
              const dist = enemy.mesh.position.distanceTo(cyc.pos);
              if (dist <= cyc.radius) {
                // Inward vortex pull
                const pullDir = _vec3A.subVectors(cyc.pos, enemy.mesh.position).normalize();
                const pullPower = Math.min(dist, (cyc.radius - dist + 1) * 3.4 * delta);
                enemy.mesh.position.addScaledVector(pullDir, pullPower);
                enemy.slowTimer = Math.max(enemy.slowTimer, 0.4);
                enemy.slowFactor = 0.45;

                if (isTick) {
                  let tickDmg = cyc.tickDamage;
                  const equipped = stateRef.current.player.equippedSkillSlots;
                  if (equipped.includes('pet_owl')) {
                    const owlPet = stateRef.current.pets.find((p) => p.id === 'pet_owl');
                    const owlLvl = owlPet?.level || 1;
                    const owlBonus = owlLvl >= 50 ? 0.5 : owlLvl >= 10 ? 0.3 : 0.2;
                    tickDmg *= 1 + owlBonus;
                  }
                  if (cyc.hasRazorFeathers) tickDmg *= 1.35;
                  tickDmg = Math.round(tickDmg);

                  enemy.health -= tickDmg;
                  particleSys.spawnCombatHit(enemy.mesh.position, 0x99f6e4);
                  particleSys.spawnDamageNumber(enemy.mesh.position, tickDmg, false, enemy.isBoss);
                  enemy.hitFlashTimer = 0.14;

                  if (cyc.hasCenterStun && dist < 1.6) {
                    enemy.stunTimer = Math.max(enemy.stunTimer, 1.2);
                    particleSys.spawnStunStars(enemy.mesh.position);
                  }

                  const pct = Math.max(0, enemy.health / enemy.maxHealth);
                  enemy.healthBarForeground.scale.x = pct;

                  if (enemy.health <= 0) {
                    particleSys.spawnEnemyDefeat(enemy.mesh.position);
                    soundEngine.playEnemyDefeat();
                    enemiesGroup.remove(enemy.mesh);
                    activeEnemies.splice(eIdx, 1);

                    const waveConfig = INSTANCE_WAVES[currentWaveIndex] || INSTANCE_WAVES[0];
                    const rewardPiece = Math.max(1, Math.round(waveConfig.essenceReward / waveConfig.enemyCount));
                    waveClearedSummary.essenceEarned += rewardPiece;
                    stateRef.current.onUpdatePlayer((prev) => ({
                      ...prev,
                      petEssence: (prev.petEssence || 0) + rewardPiece,
                    }));
                    stateRef.current.onWaveInfoChange({
                      wave: currentWaveIndex + 1,
                      title: waveConfig.title,
                      enemiesRemaining: activeEnemies.length,
                      prepCountdown: prepCountdownTimer,
                    });
                  }
                }
              }
            }

            if (cyc.duration <= 0) {
              particleSys.spawnCycloneDispersion(cyc.pos, cyc.radius);
              scene.remove(cyc.mesh);
              cyc.mesh.traverse((obj) => {
                if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
                if ((obj as THREE.Mesh).material) {
                  const m = (obj as THREE.Mesh).material;
                  if (Array.isArray(m)) m.forEach((x) => x.dispose());
                  else m.dispose();
                }
              });
              activeCyclones.splice(cIdx, 1);
            }
          }

          // 2. Enemies AI & Combat Status update
          for (let eIdx = activeEnemies.length - 1; eIdx >= 0; eIdx--) {
            const enemy = activeEnemies[eIdx];
            const ePos = enemy.mesh.position;
            const distToPlayer = ePos.distanceTo(playerPhysics.pos);
            const isDistant = distToPlayer > 32;

            // Health bar billboard faces camera (only when within 28m to save draw/matrix updates)
            if (distToPlayer < 28) {
              const hb = enemy.mesh.children.find((c) => c !== enemy.mesh.children[0]);
              if (hb) hb.rotation.y = camYaw;
            }

            // Distant enemy optimization: throttle calculation to alternate frames
            if (isDistant && ((eIdx + loopFrameIndex) % 2 === 1)) {
              continue;
            }

            // Hit reaction flash / squash animation
            if (enemy.hitFlashTimer && enemy.hitFlashTimer > 0) {
              enemy.hitFlashTimer -= delta;
              enemy.mesh.scale.set(1.15, 0.88, 1.15);
            } else {
              enemy.mesh.scale.set(1, 1, 1);
            }

            // Process Burn DoT (Fox Burning Spirit Passive)
            if (enemy.burnTimer > 0) {
              enemy.burnTimer -= delta;
              enemy.burnTickTimer -= delta;
              if (enemy.burnTickTimer <= 0) {
                enemy.burnTickTimer = 0.5;
                enemy.health -= enemy.burnDmgPerTick;
                particleSys.spawnBurnTick(ePos);
                particleSys.spawnDamageNumber(ePos, enemy.burnDmgPerTick, false, false, 'burn');
                const pct = Math.max(0, enemy.health / enemy.maxHealth);
                enemy.healthBarForeground.scale.x = pct;

                if (enemy.health <= 0) {
                  const equipped = stateRef.current.player.equippedSkillSlots;
                  const foxPet = stateRef.current.pets.find((p) => p.id === 'pet_fox');
                  if (equipped.includes('pet_fox') && (foxPet?.level || 1) >= 30) {
                    for (const other of activeEnemies) {
                      if (other !== enemy && other.health > 0 && other.mesh.position.distanceTo(ePos) <= 5.0) {
                        other.burnTimer = 3.5;
                        other.burnDmgPerTick = enemy.burnDmgPerTick;
                        particleSys.spawnBurnTick(other.mesh.position);
                      }
                    }
                  }

                  particleSys.spawnEnemyDefeat(ePos);
                  soundEngine.playEnemyDefeat();
                  enemiesGroup.remove(enemy.mesh);
                  activeEnemies.splice(eIdx, 1);

                  const waveConfig = INSTANCE_WAVES[currentWaveIndex] || INSTANCE_WAVES[0];
                  const rewardPiece = Math.max(1, Math.round(waveConfig.essenceReward / waveConfig.enemyCount));
                  waveClearedSummary.essenceEarned += rewardPiece;
                  stateRef.current.onUpdatePlayer((prev) => ({
                    ...prev,
                    petEssence: (prev.petEssence || 0) + rewardPiece,
                  }));
                  stateRef.current.onWaveInfoChange({
                    wave: currentWaveIndex + 1,
                    title: waveConfig.title,
                    enemiesRemaining: activeEnemies.length,
                    prepCountdown: prepCountdownTimer,
                  });
                  continue;
                }
              }
            }

            // Process Stun Freeze (Bear Earthshatter / Owl Cyclone / etc.)
            if (enemy.stunTimer > 0) {
              enemy.stunTimer -= delta;
              enemy.mesh.rotation.z = Math.sin(now * 0.015) * 0.15;
              if (Math.random() < 0.12) {
                particleSys.spawnStunStars(ePos);
              }
              continue; // Cannot move or attack while stunned
            } else {
              enemy.mesh.rotation.z = 0;
            }

            // Process Airborne Trajectory (Rabbit Phantom Leap)
            if (enemy.isAirborne) {
              enemy.airborneTimer -= delta;
              enemy.mesh.position.y = Math.sin(((0.6 - enemy.airborneTimer) / 0.6) * Math.PI) * 2.2;
              if (enemy.airborneTimer <= 0) {
                enemy.isAirborne = false;
                enemy.mesh.position.y = 0;
              }
              continue; // Cannot move or attack while airborne
            }

            // Armor rupture timer
            if (enemy.armorRuptureTimer > 0) {
              enemy.armorRuptureTimer -= delta;
            }

            // Effective movement speed (applying slow)
            let effectiveSpeed = enemy.speed;
            if (enemy.slowTimer > 0) {
              enemy.slowTimer -= delta;
              effectiveSpeed *= enemy.slowFactor || 0.6;
            }

            const attackRange = enemy.isBoss ? 2.6 : 1.7;
            const moveDelta = effectiveSpeed * delta * (isDistant ? 2 : 1);

            if (distToPlayer > attackRange) {
              // Move towards player
              const dir = _vec3A.subVectors(playerPhysics.pos, ePos).normalize();
              ePos.addScaledVector(dir, moveDelta);
              enemy.mesh.rotation.y = Math.atan2(dir.x, dir.z);

              // Lunge / run bounce (skip for distant enemies to save calculations)
              if (!isDistant) {
                enemy.mesh.position.y = Math.abs(Math.sin(now * 0.008 * effectiveSpeed)) * 0.15;
              } else {
                enemy.mesh.position.y = 0;
              }
            } else {
              // Within attack range: attack player on cooldown
              enemy.attackTimer -= delta;
              enemy.mesh.rotation.y = Math.atan2(playerPhysics.pos.x - ePos.x, playerPhysics.pos.z - ePos.z);

              if (enemy.attackTimer <= 0) {
                enemy.attackTimer = enemy.attackCooldown;
                particleSys.spawnCombatHit(playerPhysics.pos, 0xff0054);
                soundEngine.playCombatHit();

                // Reset Slime out-of-combat heal timer when player takes damage
                outOfCombatDamageTimer = 0;

                // Invulnerability check
                if (playerPhysics.invulnTimer > 0) {
                  continue;
                }

                let incomingDmg = enemy.damage;
                const equipped = stateRef.current.player.equippedSkillSlots;

                // TURTLE PASSIVE: Ocean Armor (reduces incoming damage, scaling when HP is low)
                if (equipped.includes('pet_turtle')) {
                  const turtlePet = stateRef.current.pets.find((p) => p.id === 'pet_turtle');
                  const tLvl = turtlePet?.level || 1;
                  let redPct = tLvl >= 40 ? 0.30 : tLvl >= 20 ? 0.25 : tLvl >= 10 ? 0.20 : 0.15;

                  const curHp = stateRef.current.player.health ?? stateRef.current.player.maxHealth ?? 100;
                  const maxHp = stateRef.current.player.maxHealth || 100;
                  const hpRatio = curHp / maxHp;
                  if (hpRatio < 0.5) {
                    const lowHpBonus = (1 - hpRatio / 0.5) * (tLvl >= 30 ? 0.35 : 0.20);
                    redPct += lowHpBonus;
                  }
                  redPct = Math.min(0.68, redPct);
                  incomingDmg *= 1 - redPct;

                  // Turtle Lv 40 Shell Spikes: Reflect 35% damage back onto attacker
                  if (tLvl >= 40) {
                    const reflectDmg = Math.round(enemy.damage * 0.35);
                    enemy.health -= reflectDmg;
                    particleSys.spawnCombatHit(enemy.mesh.position, 0x38bdf8);
                    soundEngine.playShieldAbsorb();
                    const pct = Math.max(0, enemy.health / enemy.maxHealth);
                    enemy.healthBarForeground.scale.x = pct;
                    if (enemy.health <= 0) {
                      particleSys.spawnEnemyDefeat(ePos);
                      soundEngine.playEnemyDefeat();
                      enemiesGroup.remove(enemy.mesh);
                      activeEnemies.splice(eIdx, 1);
                      continue;
                    }
                  }
                }

                // BEAR PASSIVE: Unyielding (taking damage builds fortitude resistance stacks)
                if (equipped.includes('pet_bear')) {
                  const bearPet = stateRef.current.pets.find((p) => p.id === 'pet_bear');
                  const bLvl = bearPet?.level || 1;
                  const stackReduction = bLvl >= 20 ? 0.10 : bLvl >= 10 ? 0.08 : 0.06;
                  const totalFortReduction = Math.min(0.50, fortitudeStacks * stackReduction);
                  incomingDmg *= 1 - totalFortReduction;

                  fortitudeStacks = Math.min(5, fortitudeStacks + 1);
                  fortitudeTimer = 5.0;
                }

                // Shield absorbs damage first (Tidal Barrier)
                if (playerPhysics.shield > 0) {
                  const absorbed = Math.min(playerPhysics.shield, incomingDmg);
                  playerPhysics.shield -= absorbed;
                  incomingDmg -= absorbed;
                  soundEngine.playShieldAbsorb();
                  particleSys.spawnWaterBurst(playerPhysics.pos, 1.2);
                  particleSys.spawnShieldRipple(playerPhysics.pos);
                  particleSys.spawnDamageNumber(playerPhysics.pos, Math.round(absorbed), false, false, 'shield');
                  if (waterShieldMesh) {
                    (waterShieldMesh.userData as any).hitFlashTimer = 0.22;
                  }
                  if (playerPhysics.shield <= 0 && waterShieldMesh) {
                    waterShieldMesh.visible = false;
                  }
                }

                incomingDmg = Math.round(incomingDmg);

                if (incomingDmg > 0) {
                  playerDamageTimer = 0.25;
                  particleSys.spawnDamageNumber(playerPhysics.pos, incomingDmg, false, true);
                  stateRef.current.onUpdatePlayer((prev) => {
                    const curHp = prev.health ?? prev.maxHealth ?? 100;
                    let nextHp = curHp - incomingDmg;

                    if (nextHp <= 0) {
                      // Bear Lv 50 Juggernaut Colossus cheat-death
                      const bearPet = stateRef.current.pets.find((p) => p.id === 'pet_bear');
                      if (equipped.includes('pet_bear') && (bearPet?.level || 1) >= 50 && !bearCheatDeathUsed) {
                        bearCheatDeathUsed = true;
                        playerPhysics.invulnTimer = 3.5;
                        soundEngine.playBossRoar();
                        stateRef.current.onShowMessage('🐻 JUGGERNAUT COLOSSUS! Withstood lethal hit with 3.5s Invulnerability!');
                        return { ...prev, health: 1 };
                      }

                      // Slime Lv 50 Mitosis cheat-death
                      const slimePet = stateRef.current.pets.find((p) => p.id === 'pet_slime');
                      if (equipped.includes('pet_slime') && (slimePet?.level || 1) >= 50 && !slimeCheatDeathUsed) {
                        slimeCheatDeathUsed = true;
                        playerPhysics.invulnTimer = 2.0;
                        soundEngine.playArcaneBurst();
                        particleSys.spawnArcaneNova(playerPhysics.pos, 5.0);
                        stateRef.current.onShowMessage('🧪 MITOSIS REVIVAL! Boba divided and restored 35% HP!');
                        return { ...prev, health: Math.round((prev.maxHealth || 100) * 0.35) };
                      }

                      // Player defeat!
                      instanceActive = false;
                      isPlayerDefeat = true;
                      soundEngine.playDefeat();
                      stateRef.current.onInstanceDefeat({
                        wavesCleared: currentWaveIndex,
                        essenceEarned: waveClearedSummary.essenceEarned,
                        goldEarned: waveClearedSummary.goldEarned,
                      });
                      return { ...prev, health: 0 };
                    }
                    return { ...prev, health: nextHp };
                  });
                }
              }
            }
          }

          // Check if all enemies in current wave are defeated
          if (activeEnemies.length === 0) {
            waveClearedSummary.wavesCleared = currentWaveIndex + 1;
            const completedWaveConfig = INSTANCE_WAVES[currentWaveIndex];
            waveClearedSummary.essenceEarned += completedWaveConfig.essenceReward;
            waveClearedSummary.goldEarned += 25;

            stateRef.current.onUpdatePlayer((prev) => ({
              ...prev,
              petEssence: (prev.petEssence || 0) + completedWaveConfig.essenceReward,
              gold: prev.gold + 25,
            }));

            if (currentWaveIndex < 9) {
              // Prepare for next wave
              currentWaveIndex++;
              prepCountdownTimer = INSTANCE_WAVES[currentWaveIndex].prepDurationSeconds;
              soundEngine.playLevelUp();
              stateRef.current.onShowMessage(`🎉 Wave ${currentWaveIndex} Cleared! +${completedWaveConfig.essenceReward} Pet Essence!`);
            } else {
              // VICTORY! All 10 Waves cleared!
              instanceActive = false;
              isPlayerVictory = true;
              soundEngine.playVictory();
              stateRef.current.onInstanceVictory({
                wavesCleared: 10,
                essenceEarned: waveClearedSummary.essenceEarned + 150,
                goldEarned: waveClearedSummary.goldEarned + 200,
              });
            }
          }
        }
      }

      // ==========================================
      // FARM CROPS & INTERACTION DETECTION
      // ==========================================
      if (currentLoc === 'farm') {
        growCheckTimer += delta;
        if (growCheckTimer >= 1.0) {
          growCheckTimer = 0;
          let plotsChanged = false;
          const currentPlots = [...stateRef.current.farmPlots];

          currentPlots.forEach((plot) => {
            if (plot.cropId && plot.growProgress < 1.0) {
              const growthRate = plot.watered ? 0.06 : 0.01;
              plot.growProgress = Math.min(1.0, plot.growProgress + growthRate);
              plotsChanged = true;
            }
          });

          if (plotsChanged) {
            stateRef.current.onUpdatePlots(currentPlots);
            rebuildFarmPlotMeshes(currentPlots);
          }
        }

        // Proximity detection
        const pPos = playerPhysics.pos;
        let prompt: { text: string; action: () => void } | null = null;

        // 1. Check Portal to Wild Grounds (-12, 0, -10)
        const distToPortal = Math.hypot(-12 - pPos.x, -10 - pPos.z);
        if (distToPortal < 4.5) {
          if (!wasNearPortal) {
            wasNearPortal = true;
            soundEngine.playPortalHum();
          }
          const themeName = PORTAL_THEMES[stateRef.current.portalTheme || 'normal']?.name || 'Wild';
          prompt = {
            text: `Enter Wild Grounds (${themeName} Portal)`,
            action: () => stateRef.current.onOpenPortalModal(),
          };
        } else {
          wasNearPortal = false;
        }

        // 2. Check Barnaby's Seed Stall (7, 0, -2)
        if (!prompt) {
          const distToStall = Math.hypot(7 - pPos.x, -2 - pPos.z);
          if (distToStall < 3.2) {
            prompt = {
              text: 'Talk to Shopkeeper (Seeds)',
              action: () => stateRef.current.onOpenSeedShop(),
            };
          }
        }

        // 3. Check Farm Plots
        if (!prompt) {
          for (const plot of stateRef.current.farmPlots) {
            const dist = Math.hypot(plot.x - pPos.x, plot.z - pPos.z);
            if (dist < 1.9) {
              if (!plot.tilled) {
                prompt = {
                  text: 'Till Soil Plot',
                  action: () => {
                    const updated = stateRef.current.farmPlots.map((p) => (p.id === plot.id ? { ...p, tilled: true, isHarvested: false } : p));
                    stateRef.current.onUpdatePlots(updated);
                    rebuildFarmPlotMeshes(updated);
                    soundEngine.playPlantSeed();
                    stateRef.current.onShowMessage('Soil tilled and ready for planting!');
                  },
                };
              } else if (!plot.cropId) {
                prompt = {
                  text: 'Plant Seed...',
                  action: () => stateRef.current.onOpenSeedPicker(plot.id),
                };
              } else if (plot.growProgress >= 1.0) {
                prompt = {
                  text: `Harvest ${plot.cropId.toUpperCase()}`,
                  action: () => {
                    const crop = plot.cropId!;
                    const updated = stateRef.current.farmPlots.map((p) =>
                      p.id === plot.id ? { ...p, cropId: null, plantedAt: null, growProgress: 0, isHarvested: true } : p
                    );
                    stateRef.current.onUpdatePlots(updated);
                    rebuildFarmPlotMeshes(updated);
                    stateRef.current.onAddInventory(crop, 1);
                    stateRef.current.onUpdatePlayer((prev) => ({ ...prev, gold: prev.gold + 20 }));
                    const harvestPos = new THREE.Vector3(plot.x, 0.4, plot.z);
                    particleSys.spawnHarvestPop(harvestPos, 0xffd166);
                    particleSys.spawnHarvestBurst(harvestPos);
                    const itemMesh = createHarvestItemMesh(crop);
                    particleSys.spawnHarvestFlyItem(harvestPos, playerPhysics.pos, itemMesh);
                    particleSys.spawnDamageNumber(harvestPos, `+1 ${crop.toUpperCase()} (+20 Gold)`, false, false, 'heal');
                    soundEngine.playHarvest();
                    stateRef.current.onShowMessage(`Harvested fresh ${crop}! (+20 Coins)`);

                    stateRef.current.onUpdatePets((prev) =>
                      prev.map((pet) => {
                        if (pet.isFollowing) {
                          const newExp = pet.exp + 25;
                          if (newExp >= pet.maxExp) {
                            soundEngine.playLevelUp();
                            return {
                              ...pet,
                              level: pet.level + 1,
                              exp: newExp - pet.maxExp,
                              maxExp: Math.round(pet.maxExp * 1.3),
                              happiness: Math.min(100, pet.happiness + 20),
                            };
                          }
                          return { ...pet, exp: newExp };
                        }
                        return pet;
                      })
                    );
                  },
                };
              } else if (!plot.watered) {
                prompt = {
                  text: 'Water Crops',
                  action: () => {
                    const updated = stateRef.current.farmPlots.map((p) => (p.id === plot.id ? { ...p, watered: true, waterLevel: 1.0 } : p));
                    stateRef.current.onUpdatePlots(updated);
                    rebuildFarmPlotMeshes(updated);
                    soundEngine.playWaterSplash();
                    stateRef.current.onShowMessage('Watered plot!');
                  },
                };
              }
              break;
            }
          }
        }

        // 4. Check Pets
        if (!prompt) {
          for (const pet of stateRef.current.pets) {
            const mesh = petMeshMap.get(pet.id);
            if (mesh && mesh.position.distanceTo(pPos) < 2.2) {
              prompt = {
                text: `Pet & Feed ${pet.name}`,
                action: () => {
                  soundEngine.playPetJoy();
                  particleSys.spawnPetAffection(mesh.position);
                  stateRef.current.onUpdatePets((prev) =>
                    prev.map((p) =>
                      p.id === pet.id
                        ? {
                            ...p,
                            happiness: Math.min(100, p.happiness + 15),
                            hunger: Math.min(100, p.hunger + 25),
                            exp: p.exp + 20,
                          }
                        : p
                    )
                  );
                  stateRef.current.onShowMessage(`${pet.name} is delighted! (+Happiness, +Hunger)`);
                },
              };
              break;
            }
          }
        }

        // 5. Check Well
        if (!prompt && Math.hypot(well.position.x - pPos.x, well.position.z - pPos.z) < 2.5) {
          prompt = {
            text: 'Draw Fresh Water',
            action: () => {
              soundEngine.playWaterSplash();
              stateRef.current.onShowMessage('Water bucket refilled with fresh spring water!');
            },
          };
        }

        // 6. Check Farmhouse
        if (!prompt && Math.hypot(farmhouse.position.x - pPos.x, farmhouse.position.z + 10 - pPos.z) < 3.2) {
          prompt = {
            text: 'Rest at Farmhouse (New Day)',
            action: () => {
              soundEngine.playLevelUp();
              stateRef.current.onUpdatePlayer((prev) => ({
                ...prev,
                day: prev.day + 1,
                energy: prev.maxEnergy,
                health: prev.maxHealth || 100,
              }));
              const updated = stateRef.current.farmPlots.map((p) =>
                p.cropId ? { ...p, growProgress: Math.min(1.0, p.growProgress + 0.5), watered: false } : p
              );
              stateRef.current.onUpdatePlots(updated);
              rebuildFarmPlotMeshes(updated);
              envSystem.timeOfDay = 0.12;
              envSystem.applyDayNightLighting(0.12);
              stateRef.current.onShowMessage('A new sunny morning begins at Pet Haven! (Health restored)');
            },
          };
        }

        stateRef.current.onNearInteractableChange(prompt);
      } else {
        stateRef.current.onNearInteractableChange(null);
      }

      // Render Scene
      renderer.render(scene, camera);

      // Performance Monitor metrics dispatch (every 250ms)
      const frameEndTime = performance.now();
      perfFrameTimeAccum += frameEndTime - frameStartTime;
      perfFrameCount++;

      const perfElapsed = frameEndTime - perfLastTimestamp;
      if (perfElapsed >= 250) {
        const computedFps = Math.round((perfFrameCount * 1000) / perfElapsed);
        const avgFrameTime = Number((perfFrameTimeAccum / perfFrameCount).toFixed(1));

        if (stateRef.current.onPerfStatsChange) {
          stateRef.current.onPerfStatsChange({
            fps: computedFps,
            frameTimeMs: avgFrameTime,
            activeParticles: particleSys.getActiveCount(),
            maxParticles: particleSys.getMaxCount(),
            drawCalls: renderer.info.render.calls,
            triangles: renderer.info.render.triangles,
            activeEnemies: activeEnemies.length,
            activePets: petMeshMap.size,
          });
        }

        perfLastTimestamp = frameEndTime;
        perfFrameCount = 0;
        perfFrameTimeAccum = 0;
      }

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    // Start loop
    if (isSoftwareGl) afterDraw(tick);
    else frameId = requestAnimationFrame(tick);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('touchstart', handleTouchStart);
      dom.removeEventListener('touchmove', handleTouchMove);
      dom.removeEventListener('touchend', handleTouchEnd);
      dom.removeEventListener('touchcancel', handleTouchEnd);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      activeCyclones.forEach((cyc) => {
        scene.remove(cyc.mesh);
      });

      rendererRef.current = null;
      particleSysRef.current = null;
      sunLightRef.current = null;

      envSystem.dispose();
      particleSys.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full overflow-hidden select-none" />;
};
