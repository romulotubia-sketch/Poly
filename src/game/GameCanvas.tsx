import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  PetData,
  FarmPlotState,
  PlayerStats,
  GraphicsQuality,
  PerformanceStatsData,
  MissionEventType,
  PetCombatRuntimeStatus,
} from '../types/game';
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
  createPetHouse,
  createFoodBowl,
  createWaterBowl,
  createPetBed,
  createPlayBall,
  createSanctuaryArchway,
  createPetDenBuilding,
  createPetTrainingStation,
  PlayerMeshGroup,
  PetMeshGroup,
} from './proceduralModels';
import { ParticleSystem } from './particleSystem';
import { soundEngine } from '../audio/soundEngine';
import { INSTANCE_WAVES, CROPS } from './constants';
import { computeActiveSkillStats, getPetBasicAttackConfig } from './combatSkills';
import { calculatePetStats, getPassiveEnhancementMultiplier } from './petStats';
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
  currentLocation: 'farm' | 'wild_grounds' | 'pet_den';
  onWaveInfoChange: (info: { wave: number; title: string; enemiesRemaining: number; prepCountdown: number | null }) => void;
  onInstanceVictory: (result: { wavesCleared: number; essenceEarned: number; goldEarned: number }) => void;
  onInstanceDefeat: (result: { wavesCleared: number; essenceEarned: number; goldEarned: number }) => void;
  onOpenSeedShop: () => void;
  onOpenPortalModal: () => void;
  onOpenSeedPicker: (plotId: number) => void;
  onOpenPetInteraction?: (petId: string) => void;
  onEnterPetDen?: () => void;
  onLeavePetDen?: () => void;
  portalTheme?: PortalTheme;
  isWarping?: boolean;
  onTimePhaseChange?: (phase: TimePhase, timeOfDay: number) => void;
  graphicsQuality?: GraphicsQuality;
  onPerfStatsChange?: (stats: PerformanceStatsData) => void;
  isAutoHunt?: boolean;
  onToggleAutoHunt?: () => void;
  onPlayerTargetChange?: (info: { id: string; name: string; hpRatio: number; maxHealth: number; health: number } | null) => void;
  onPetsEngagedChange?: (count: number) => void;
  skillCooldowns?: Record<string, number>;
  onTriggerSkill?: (petId: string) => void;
  onMissionEvent?: (eventType: MissionEventType, amount?: number, trackKey?: string) => void;
  cameraAngleDeg?: number;
  onOpenTrainingStation?: () => void;
  onNearTrainingStationChange?: (near: boolean) => void;
  onPetCombatStatusChange?: (statuses: PetCombatRuntimeStatus[]) => void;
}

// Math helpers pre-allocated at module scope to avoid GC inside render loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3Cam = new THREE.Vector3();
const _vec3ScaleNormal = new THREE.Vector3(1, 1, 1);

interface PetRuntimeCombatEntry {
  petId: string;
  name: string;
  species: string;
  currentHp: number;
  maxHp: number;
  defeated: boolean;
}

interface PetCombatAIState {
  state: 'FOLLOW_PLAYER' | 'SEARCH_ENEMY' | 'APPROACH_TARGET' | 'BASIC_ATTACK' | 'RETURN_TO_PLAYER' | 'IDLE';
  currentTargetId: string | null;
  targetEvalTimer: number;
  attackCooldownTimer: number;
  attackAnimTimer: number;
  attackTotalDuration: number;
  hasDealtDamage: boolean;
  isAttacking: boolean;
}

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
  // Target tracking (player or participating living pet)
  targetKind: 'player' | string;
  targetEvalTimer: number;
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
  _defeatReported?: boolean;
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

interface ActiveGroundZone {
  type: 'heal_zone' | 'defense_zone' | 'poison_zone';
  mesh: THREE.Group;
  pos: THREE.Vector3;
  duration: number;
  radius: number;
  tickTimer: number;
  healPerTick?: number;
  damagePerTick?: number;
  damageReductionPct?: number;
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
  currentLocation,
  onWaveInfoChange,
  onInstanceVictory,
  onInstanceDefeat,
  onOpenSeedShop,
  onOpenPortalModal,
  onOpenSeedPicker,
  onOpenPetInteraction,
  onEnterPetDen,
  onLeavePetDen,
  portalTheme = 'normal',
  isWarping = false,
  onTimePhaseChange,
  graphicsQuality = 'medium',
  onPerfStatsChange,
  isAutoHunt = false,
  onToggleAutoHunt,
  onPlayerTargetChange,
  onPetsEngagedChange,
  skillCooldowns,
  onTriggerSkill,
  onMissionEvent,
  cameraAngleDeg = 62,
  onOpenTrainingStation,
  onNearTrainingStationChange,
  onPetCombatStatusChange,
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
    onOpenPetInteraction,
    onEnterPetDen,
    onLeavePetDen,
    isZenMode,
    portalTheme,
    isWarping,
    onTimePhaseChange,
    graphicsQuality,
    onPerfStatsChange,
    isAutoHunt,
    onToggleAutoHunt,
    onPlayerTargetChange,
    onPetsEngagedChange,
    skillCooldowns,
    onTriggerSkill,
    onMissionEvent,
    cameraAngleDeg,
    onOpenTrainingStation,
    onNearTrainingStationChange,
    onPetCombatStatusChange,
  });

  useEffect(() => {
    stateRef.current = {
      player,
      pets,
      farmPlots,
      joystickInput,
      jumpCount,
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
      onOpenPetInteraction,
      onEnterPetDen,
      onLeavePetDen,
      isZenMode,
      portalTheme,
      isWarping,
      onTimePhaseChange,
      graphicsQuality,
      onPerfStatsChange,
      isAutoHunt,
      onToggleAutoHunt,
      onPlayerTargetChange,
      onPetsEngagedChange,
      skillCooldowns,
      onTriggerSkill,
      onMissionEvent,
      cameraAngleDeg,
      onOpenTrainingStation,
      onNearTrainingStationChange,
      onPetCombatStatusChange,
    };
  }, [
    player,
    pets,
    farmPlots,
    joystickInput,
    jumpCount,
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
    onOpenPetInteraction,
    onEnterPetDen,
    onLeavePetDen,
    isZenMode,
    portalTheme,
    isWarping,
    onTimePhaseChange,
    graphicsQuality,
    onPerfStatsChange,
    isAutoHunt,
    onToggleAutoHunt,
    onPlayerTargetChange,
    onPetsEngagedChange,
    skillCooldowns,
    onTriggerSkill,
    onMissionEvent,
    cameraAngleDeg,
    onOpenTrainingStation,
    onNearTrainingStationChange,
    onPetCombatStatusChange,
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
    scene.fog = new THREE.Fog(skyColor, 42, 115);

    // Camera setup (Wide Bird's-Eye POV)
    const camera = new THREE.PerspectiveCamera(64, container.clientWidth / container.clientHeight, 0.1, 180);
    camera.position.set(0, 17, 9);

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

    // --- PROMINENT 3D PET DEN (SANCTUARY) ON FARM ---
    const petDenBuilding = createPetDenBuilding();
    petDenBuilding.position.set(13.5, 0, 0);
    petDenBuilding.rotation.y = -Math.PI / 2;
    farmEnvironmentGroup.add(petDenBuilding);

    // --- PHYSICAL 3D PET TRAINING STATION ON FARM ---
    const { group: trainingStationGroup, crystals: trainingCrystals } = createPetTrainingStation();
    trainingStationGroup.position.set(-2.0, 0, 14.0);
    trainingStationGroup.rotation.y = Math.PI; // Faces north down the stone garden walkway
    farmEnvironmentGroup.add(trainingStationGroup);

    // Welcoming flagstone stepping path connecting the farm square to the Pet Den porch
    for (let s = 0; s <= 7; s++) {
      const stone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62 - s * 0.02, 0.68 - s * 0.02, 0.04, 8),
        new THREE.MeshStandardMaterial({ color: 0xddb892, roughness: 0.95 })
      );
      stone.position.set(5.5 + s * 0.9, 0.02, 0 + Math.sin(s * 0.7) * 0.2);
      stone.rotation.y = s * 0.6;
      stone.receiveShadow = true;
      farmEnvironmentGroup.add(stone);
    }

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
    let waveClearedSummary = { wavesCleared: 0, essenceEarned: 0, goldEarned: 0 };
    let instanceActive = false;

    // 3D Animated Target Reticle for Player Auto-Hunt
    const targetReticleGroup = new THREE.Group();
    targetReticleGroup.name = 'target_reticle_group';
    targetReticleGroup.visible = false;
    const reticleRingMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const reticleRing = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.15, 32), reticleRingMat);
    reticleRing.rotation.x = -Math.PI / 2;
    targetReticleGroup.add(reticleRing);
    for (let i = 0; i < 4; i++) {
      const notch = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.1), new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide }));
      notch.rotation.x = -Math.PI / 2;
      const angle = (i * Math.PI) / 2;
      notch.position.set(Math.cos(angle) * 1.25, 0.01, Math.sin(angle) * 1.25);
      notch.rotation.z = -angle;
      targetReticleGroup.add(notch);
    }
    instanceEnvironmentGroup.add(targetReticleGroup);

    // AI state tracking for equipped pets and player auto-hunt
    const petCombatAIMap = new Map<string, PetCombatAIState>();
    let playerAutoTargetId: string | null = null;
    let playerAutoSkillCooldown = 0;
    let playerTargetCheckTimer = 0;

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
    function spawnWave(waveNum: number, customMessage?: string) {
      // Clear previous enemies
      while (enemiesGroup.children.length > 0) {
        enemiesGroup.remove(enemiesGroup.children[0]);
      }
      activeEnemies.length = 0;

      const config = INSTANCE_WAVES[waveNum - 1] || INSTANCE_WAVES[0];
      const count = config.enemyCount;

      stateRef.current.onShowMessage(customMessage || `⚔️ WAVE ${waveNum}: ${config.title}!`);
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
          targetKind: 'player',
          targetEvalTimer: Math.random() * 0.35,
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
    // 3. PET DEN / PET SANCTUARY ENVIRONMENT GROUP
    // ==========================================
    const petDenEnvironmentGroup = new THREE.Group();
    petDenEnvironmentGroup.name = 'pet_den_environment';
    petDenEnvironmentGroup.visible = false;
    scene.add(petDenEnvironmentGroup);

    // Spacious, lush green sanctuary meadow
    const denGroundGeo = new THREE.CylinderGeometry(30, 32, 4, 32);
    const denGroundMat = new THREE.MeshStandardMaterial({
      color: 0x68a357,
      roughness: 0.9,
    });
    const denGround = new THREE.Mesh(denGroundGeo, denGroundMat);
    denGround.position.y = -2;
    denGround.receiveShadow = true;
    petDenEnvironmentGroup.add(denGround);

    // Perimeter gentle grassy mounds
    for (let i = 0; i < 18; i++) {
      const ang = (i * Math.PI * 2) / 18;
      const mound = new THREE.Mesh(
        new THREE.SphereGeometry(2.2 + (i % 3) * 0.4, 8, 8),
        new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0x588157 : 0x70a962, roughness: 0.95 })
      );
      mound.position.set(Math.cos(ang) * 27.5, -0.6, Math.sin(ang) * 27.5);
      mound.scale.set(1.5, 0.45, 1.5);
      petDenEnvironmentGroup.add(mound);
    }

    // Walking Paths (winding sandy/flagstone paths)
    // 1. Entrance to Central Pond path
    for (let z = -14; z <= -3; z += 1.8) {
      const pathStone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.9, 0.04, 8),
        new THREE.MeshStandardMaterial({ color: 0xddb892, roughness: 0.95 })
      );
      pathStone.position.set(Math.sin(z * 0.5) * 0.8, 0.02, z);
      pathStone.receiveShadow = true;
      petDenEnvironmentGroup.add(pathStone);
    }

    // 2. West branch path to Cottage 1 & beds
    for (let x = -2; x >= -8; x -= 1.6) {
      const pathStone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75, 0.8, 0.04, 7),
        new THREE.MeshStandardMaterial({ color: 0xddb892, roughness: 0.95 })
      );
      pathStone.position.set(x, 0.02, -5 + Math.sin(x * 0.8) * 0.6);
      pathStone.receiveShadow = true;
      petDenEnvironmentGroup.add(pathStone);
    }

    // 3. East branch path to Cottage 2 & Gazebo
    for (let x = 2; x <= 8; x += 1.6) {
      const pathStone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75, 0.8, 0.04, 7),
        new THREE.MeshStandardMaterial({ color: 0xddb892, roughness: 0.95 })
      );
      pathStone.position.set(x, 0.02, -4 + Math.sin(x * 0.8) * 0.6);
      pathStone.receiveShadow = true;
      petDenEnvironmentGroup.add(pathStone);
    }

    // Central Scenic Pet Sanctuary Pond
    const denPond = new THREE.Group();
    denPond.position.set(-0.5, 0, 0.5);

    // Pond rim of smooth mossy rocks
    for (let i = 0; i < 16; i++) {
      const ang = (i * Math.PI * 2) / 16;
      const rockRadius = 0.5 + (i % 3) * 0.15;
      const rock = createRock(rockRadius);
      rock.position.set(Math.cos(ang) * 3.6, 0, Math.sin(ang) * 3.6);
      rock.scale.set(1.2, 0.6, 1.2);
      denPond.add(rock);
    }

    // Shimmering Pond Water
    const denWaterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.06,
      metalness: 0.25,
      transparent: true,
      opacity: 0.88,
      envMapIntensity: 1.5,
    });
    const denWater = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.2, 24), denWaterMat);
    denWater.position.y = 0.12;
    denWater.receiveShadow = true;
    denPond.add(denWater);

    // Animated Pond Surface Ripple
    const denRippleMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const denRipple = new THREE.Mesh(new THREE.RingGeometry(0.8, 0.95, 20), denRippleMat);
    denRipple.rotation.x = -Math.PI / 2;
    denRipple.position.y = 0.14;
    denPond.add(denRipple);

    // Floating Water Lily Pads
    const lilyMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 });
    const flwMat = new THREE.MeshStandardMaterial({ color: 0xff758f, roughness: 0.6 });
    for (let i = 0; i < 5; i++) {
      const ang = i * 1.3 + 0.4;
      const dist = 1.2 + (i % 3) * 0.7;
      const lily = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.02, 8), lilyMat);
      lily.position.set(Math.cos(ang) * dist, 0.13, Math.sin(ang) * dist);
      if (i % 2 === 0) {
        const petal = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.14, 6), flwMat);
        petal.position.set(0, 0.08, 0);
        lily.add(petal);
      }
      denPond.add(lily);
    }

    // Wooden Pond Pier / Viewing Dock
    const dock = new THREE.Group();
    dock.position.set(0, 0, 3.2);
    for (let p = 0; p < 4; p++) {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.08, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x7f4f24, roughness: 0.85 })
      );
      plank.position.set(0, 0.18, p * 0.48);
      plank.castShadow = true;
      dock.add(plank);
    }
    denPond.add(dock);
    petDenEnvironmentGroup.add(denPond);
    envSystem.registerPondWater(denWater);

    // 3 Cute Pet Cottages / Houses
    const petHouse1 = createPetHouse();
    petHouse1.position.set(-9, 0, -6);
    petHouse1.rotation.y = Math.PI / 5;
    petDenEnvironmentGroup.add(petHouse1);

    const petHouse2 = createPetHouse();
    petHouse2.position.set(9, 0, -5);
    petHouse2.rotation.y = -Math.PI / 6;
    petDenEnvironmentGroup.add(petHouse2);

    const petHouse3 = createPetHouse();
    petHouse3.position.set(-10, 0, 7);
    petHouse3.rotation.y = Math.PI / 2.5;
    petDenEnvironmentGroup.add(petHouse3);

    // Pet Resting Beds & Cushions
    const bed1 = createPetBed();
    bed1.position.set(-4.5, 0, -3.5);
    petDenEnvironmentGroup.add(bed1);

    const bed2 = createPetBed();
    bed2.position.set(5.5, 0, -3);
    petDenEnvironmentGroup.add(bed2);

    const bed3 = createPetBed();
    bed3.position.set(-6, 0, 4.5);
    petDenEnvironmentGroup.add(bed3);

    const bed4 = createPetBed();
    bed4.position.set(6, 0, 4.5);
    petDenEnvironmentGroup.add(bed4);

    // Wooden Gazebo Canopy with soft shade
    const gazebo = new THREE.Group();
    gazebo.position.set(10, 0, 3);
    for (let c = 0; c < 4; c++) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.14, 2.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x6f4e37, roughness: 0.85 })
      );
      const postX = c % 2 === 0 ? -1.2 : 1.2;
      const postZ = c < 2 ? -1.2 : 1.2;
      post.position.set(postX, 1.3, postZ);
      post.castShadow = true;
      gazebo.add(post);
    }
    const gazeboRoof = new THREE.Mesh(
      new THREE.ConeGeometry(2.4, 1.2, 4),
      new THREE.MeshStandardMaterial({ color: 0x588157, roughness: 0.85 })
    );
    gazeboRoof.position.set(0, 3.1, 0);
    gazeboRoof.rotation.y = Math.PI / 4;
    gazeboRoof.castShadow = true;
    gazebo.add(gazeboRoof);
    petDenEnvironmentGroup.add(gazebo);

    // Food & Water Bowls throughout sanctuary
    const foodBowl1 = createFoodBowl();
    foodBowl1.position.set(-2.8, 0, -2.2);
    petDenEnvironmentGroup.add(foodBowl1);

    const waterBowl1 = createWaterBowl();
    waterBowl1.position.set(-2.0, 0, -2.2);
    petDenEnvironmentGroup.add(waterBowl1);

    const foodBowl2 = createFoodBowl();
    foodBowl2.position.set(4.2, 0, 1.8);
    petDenEnvironmentGroup.add(foodBowl2);

    const waterBowl2 = createWaterBowl();
    waterBowl2.position.set(5.0, 0, 1.8);
    petDenEnvironmentGroup.add(waterBowl2);

    // Play Area & Toys
    const ball1 = createPlayBall(0xff0054);
    ball1.position.set(-3.5, 0, 6);
    petDenEnvironmentGroup.add(ball1);

    const ball2 = createPlayBall(0x0077b6);
    ball2.position.set(3.2, 0, 6.8);
    petDenEnvironmentGroup.add(ball2);

    // Agility play logs & ramp
    const rampGroup = new THREE.Group();
    rampGroup.position.set(0, 0, 7.5);
    const log1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 2.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x582f0e, roughness: 0.9 })
    );
    log1.rotation.z = Math.PI / 2;
    log1.position.set(0, 0.24, 0);
    log1.castShadow = true;
    rampGroup.add(log1);
    petDenEnvironmentGroup.add(rampGroup);

    // Trees & Lush Vegetation
    for (let t = 0; t < 12; t++) {
      const ang = (t * Math.PI * 2) / 12 + (t % 2) * 0.2;
      const dist = 18 + (t % 3) * 3.5;
      const treeType = t % 3 === 0 ? 'apple' : t % 2 === 0 ? 'oak' : 'pine';
      const tree = createTree(treeType);
      tree.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
      petDenEnvironmentGroup.add(tree);
      envSystem.registerTree(tree);
    }

    // Flower clusters across sanctuary
    for (let f = 0; f < 16; f++) {
      const ang = (f * Math.PI * 2) / 16 + 0.3;
      const dist = 8 + (f % 4) * 3.2;
      const flowerCluster = new THREE.Group();
      flowerCluster.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
      const flwColor = [0xff4d6d, 0xffb703, 0x7209b7, 0x38bdf8][f % 4];
      const flwMaterial = new THREE.MeshStandardMaterial({ color: flwColor, roughness: 0.6 });
      for (let k = 0; k < 4; k++) {
        const blossom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), flwMaterial);
        blossom.position.set((Math.random() - 0.5) * 0.8, 0.12, (Math.random() - 0.5) * 0.8);
        flowerCluster.add(blossom);
      }
      petDenEnvironmentGroup.add(flowerCluster);
    }

    // Low Bushes & Rocks
    for (let b = 0; b < 10; b++) {
      const ang = (b * Math.PI * 2) / 10 + 0.1;
      const dist = 13 + (b % 3) * 4;
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(0.7 + (b % 2) * 0.3, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0x38b000, roughness: 0.9 })
      );
      bush.position.set(Math.cos(ang) * dist, 0.35, Math.sin(ang) * dist);
      bush.scale.set(1.2, 0.8, 1.2);
      bush.castShadow = true;
      petDenEnvironmentGroup.add(bush);
    }

    // Return to Farm Archway (at entrance/exit of sanctuary)
    const returnFarmArch = createSanctuaryArchway('Return to Farm');
    returnFarmArch.position.set(0, 0, -14.5);
    returnFarmArch.rotation.y = 0;
    petDenEnvironmentGroup.add(returnFarmArch);

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

    // Camera variables (Fixed non-draggable Bird's-Eye View)
    const camYaw = Math.PI;
    let camPitch = THREE.MathUtils.degToRad(
      THREE.MathUtils.clamp(stateRef.current.cameraAngleDeg ?? 62, 35, 82)
    );
    const getBirdViewCamDist = () => {
      const aspect = container.clientWidth / Math.max(1, container.clientHeight);
      return aspect < 1 ? 21.0 : 17.5;
    };

    // Active 3D Cyclone & Ground Zone instances in the world
    const activeCyclones: ActiveCyclone[] = [];
    const activeGroundZones: ActiveGroundZone[] = [];

    // Passive Skill Enhancement helper (scales passive potency by Pet Training passive_skill level)
    const getPassiveMult = (petId: string): number => {
      const found = stateRef.current.pets.find((p) => p.id === petId);
      return getPassiveEnhancementMultiplier(found?.training?.passive_skill || 0);
    };

    // Runtime Wild Grounds combat HP & defeat tracking per equipped pet
    const petRuntimeCombatMap = new Map<string, PetRuntimeCombatEntry>();
    let petStatusDirty = true;
    let petCombatSyncTimer = 0;

    const resetPetRuntimeHealth = () => {
      const equippedSet = new Set(stateRef.current.player.equippedSkillSlots.filter(Boolean) as string[]);
      petRuntimeCombatMap.clear();
      stateRef.current.pets.forEach((pet) => {
        if (pet.unlocked && equippedSet.has(pet.id)) {
          const calc = calculatePetStats(pet);
          petRuntimeCombatMap.set(pet.id, {
            petId: pet.id,
            name: pet.name,
            species: pet.species,
            currentHp: calc.maxHp,
            maxHp: calc.maxHp,
            defeated: false,
          });
        }
      });
      petStatusDirty = true;
    };

    const syncPetRuntimeCombat = (forceEmit = false) => {
      const equippedSlots = stateRef.current.player.equippedSkillSlots.filter(Boolean) as string[];
      const seen = new Set<string>();
      const statuses: PetCombatRuntimeStatus[] = [];

      for (const petId of equippedSlots) {
        if (seen.has(petId)) continue;
        seen.add(petId);
        const pet = stateRef.current.pets.find((p) => p.id === petId && p.unlocked);
        if (!pet) continue;

        const calc = calculatePetStats(pet);
        let entry = petRuntimeCombatMap.get(pet.id);
        if (!entry) {
          entry = {
            petId: pet.id,
            name: pet.name,
            species: pet.species,
            currentHp: calc.maxHp,
            maxHp: calc.maxHp,
            defeated: false,
          };
          petRuntimeCombatMap.set(pet.id, entry);
          petStatusDirty = true;
        } else {
          entry.name = pet.name;
          if (entry.maxHp !== calc.maxHp) {
            const ratio = entry.maxHp > 0 ? entry.currentHp / entry.maxHp : 1;
            entry.maxHp = calc.maxHp;
            entry.currentHp = entry.defeated ? 0 : Math.min(calc.maxHp, Math.max(1, Math.round(calc.maxHp * ratio)));
            petStatusDirty = true;
          }
        }

        statuses.push({
          petId: entry.petId,
          name: entry.name,
          species: entry.species,
          currentHp: Math.max(0, Math.round(entry.currentHp)),
          maxHp: entry.maxHp,
          defeated: entry.defeated,
        });
      }

      if (forceEmit || petStatusDirty) {
        petStatusDirty = false;
        stateRef.current.onPetCombatStatusChange?.(statuses);
      }
    };

    // Unified player heal helper (respects Red Panda Gentle Nature & Deer Herbalist passives + training)
    const applyPlayerHeal = (baseHeal: number): number => {
      if (baseHeal <= 0) return 0;
      const equipped = stateRef.current.player.equippedSkillSlots;
      let mult = 1.0;
      if (equipped.includes('pet_red_panda')) {
        const rpPet = stateRef.current.pets.find((p) => p.id === 'pet_red_panda');
        const rpLvl = rpPet?.level || 1;
        const rpBase = rpLvl >= 50 ? 0.5 : rpLvl >= 30 ? 0.35 : rpLvl >= 10 ? 0.22 : 0.15;
        mult += rpBase * getPassiveMult('pet_red_panda');
      }
      if (equipped.includes('pet_deer')) {
        mult += 0.2 * getPassiveMult('pet_deer');
      }
      const finalHeal = Math.max(1, Math.round(baseHeal * mult));
      stateRef.current.onUpdatePlayer((prev) => ({
        ...prev,
        health: Math.min(prev.maxHealth || 100, (prev.health ?? prev.maxHealth ?? 100) + finalHeal),
      }));
      return finalHeal;
    };

    // Unified single-count enemy defeat tracker for missions
    const trackEnemyDefeat = (enemy: ActiveEnemy) => {
      if (enemy._defeatReported) return;
      enemy._defeatReported = true;
      stateRef.current.onMissionEvent?.('defeat_enemy', 1);
      if (enemy.type === 'golem' || enemy.type === 'boss') {
        stateRef.current.onMissionEvent?.('defeat_elite', 1);
      }
      if (enemy.type === 'boss') {
        stateRef.current.onMissionEvent?.('defeat_boss', 1);
      }
    };

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

    // Autonomous AI state for Sanctuary / Pet Den
    interface PetDenAIState {
      behavior: 'wander' | 'rest' | 'play' | 'eat' | 'drink' | 'explore' | 'social';
      targetPos: THREE.Vector3;
      timer: number;
      subTimer: number;
      speed: number;
      socialPartnerId?: string;
      restPose: 'sit' | 'lie';
      playMotion: 'bounce' | 'spin' | 'wiggle';
      wanderAngle: number;
    }
    const petDenAIMap = new Map<string, PetDenAIState>();

    const SANCTUARY_FOOD_BOWLS = [new THREE.Vector3(-2.8, 0, -2.2), new THREE.Vector3(4.2, 0, 1.8)];
    const SANCTUARY_WATER_BOWLS = [new THREE.Vector3(-2.0, 0, -2.2), new THREE.Vector3(5.0, 0, 1.8)];
    const SANCTUARY_POND_EDGES = [
      new THREE.Vector3(-1.2, 0, 2.6),
      new THREE.Vector3(1.8, 0, 1.4),
      new THREE.Vector3(-2.2, 0, -0.6),
      new THREE.Vector3(0.5, 0, -2.5),
    ];
    const SANCTUARY_BEDS = [
      new THREE.Vector3(-4.5, 0, -3.5),
      new THREE.Vector3(5.5, 0, -3),
      new THREE.Vector3(-6, 0, 4.5),
      new THREE.Vector3(6, 0, 4.5),
      new THREE.Vector3(10, 0, 3),
    ];
    const SANCTUARY_PLAY_AREAS = [
      new THREE.Vector3(-3.5, 0, 6),
      new THREE.Vector3(3.2, 0, 6.8),
      new THREE.Vector3(0, 0, 7.5),
    ];
    const SANCTUARY_EXPLORE_SPOTS = [
      new THREE.Vector3(-9, 0, -6),
      new THREE.Vector3(9, 0, -5),
      new THREE.Vector3(-10, 0, 7),
      new THREE.Vector3(-12, 0, 0),
      new THREE.Vector3(12, 0, -2),
      new THREE.Vector3(-5, 0, 10),
      new THREE.Vector3(5, 0, 10),
    ];

    function pickNewSanctuaryBehavior(pet: PetData, curPos: THREE.Vector3): PetDenAIState {
      const roll = Math.random();
      const species = pet.species;

      let chosenBehavior: PetDenAIState['behavior'] = 'wander';
      const target = curPos.clone();
      let duration = 5.0 + Math.random() * 5.0;
      let moveSpeed = 1.6 + Math.random() * 0.6;

      if (species === 'turtle') {
        moveSpeed = 0.7;
        if (roll < 0.4) chosenBehavior = 'rest';
        else if (roll < 0.7) chosenBehavior = 'drink';
        else chosenBehavior = 'wander';
      } else if (species === 'fox') {
        moveSpeed = 2.6;
        if (roll < 0.35) chosenBehavior = 'wander';
        else if (roll < 0.65) chosenBehavior = 'explore';
        else if (roll < 0.85) chosenBehavior = 'play';
        else chosenBehavior = 'eat';
      } else if (species === 'rabbit') {
        moveSpeed = 2.2;
        if (roll < 0.4) chosenBehavior = 'play';
        else if (roll < 0.75) chosenBehavior = 'wander';
        else chosenBehavior = 'eat';
      } else if (species === 'owl') {
        moveSpeed = 1.8;
        if (roll < 0.35) chosenBehavior = 'explore';
        else if (roll < 0.65) chosenBehavior = 'rest';
        else chosenBehavior = 'wander';
      } else if (species === 'bear') {
        moveSpeed = 1.1;
        if (roll < 0.45) chosenBehavior = 'rest';
        else if (roll < 0.7) chosenBehavior = 'eat';
        else chosenBehavior = 'wander';
      } else if (species === 'slime') {
        moveSpeed = 1.4;
        if (roll < 0.5) chosenBehavior = 'play';
        else chosenBehavior = 'wander';
      } else if (species === 'frog' || species === 'poison_frog') {
        moveSpeed = 1.8;
        if (roll < 0.4) chosenBehavior = 'drink';
        else if (roll < 0.7) chosenBehavior = 'play';
        else chosenBehavior = 'wander';
      } else if (species === 'red_panda') {
        moveSpeed = 1.7;
        if (roll < 0.35) chosenBehavior = 'eat';
        else if (roll < 0.65) chosenBehavior = 'rest';
        else if (roll < 0.85) chosenBehavior = 'play';
        else chosenBehavior = 'wander';
      } else if (species === 'timber_wolf') {
        moveSpeed = 2.7;
        if (roll < 0.45) chosenBehavior = 'explore';
        else if (roll < 0.75) chosenBehavior = 'wander';
        else chosenBehavior = 'rest';
      } else if (species === 'sylvan_deer') {
        moveSpeed = 2.3;
        if (roll < 0.4) chosenBehavior = 'wander';
        else if (roll < 0.7) chosenBehavior = 'drink';
        else chosenBehavior = 'explore';
      } else if (species === 'penguin') {
        moveSpeed = 1.5;
        if (roll < 0.45) chosenBehavior = 'drink';
        else if (roll < 0.75) chosenBehavior = 'play';
        else chosenBehavior = 'wander';
      } else if (species === 'bat' || species === 'bee') {
        moveSpeed = 2.5;
        if (roll < 0.45) chosenBehavior = 'explore';
        else if (roll < 0.8) chosenBehavior = 'play';
        else chosenBehavior = 'wander';
      } else if (species === 'hedgehog') {
        moveSpeed = 1.3;
        if (roll < 0.4) chosenBehavior = 'explore';
        else if (roll < 0.7) chosenBehavior = 'eat';
        else chosenBehavior = 'rest';
      } else if (species === 'dragon_whelp') {
        moveSpeed = 2.4;
        if (roll < 0.4) chosenBehavior = 'play';
        else if (roll < 0.75) chosenBehavior = 'explore';
        else chosenBehavior = 'rest';
      } else if (species === 'capybara') {
        moveSpeed = 1.0;
        if (roll < 0.5) chosenBehavior = 'rest';
        else if (roll < 0.85) chosenBehavior = 'drink';
        else chosenBehavior = 'eat';
      } else {
        if (roll < 0.3) chosenBehavior = 'explore';
        else if (roll < 0.6) chosenBehavior = 'wander';
        else if (roll < 0.8) chosenBehavior = 'play';
        else chosenBehavior = 'rest';
      }

      if (chosenBehavior === 'eat') {
        const bowl = SANCTUARY_FOOD_BOWLS[Math.floor(Math.random() * SANCTUARY_FOOD_BOWLS.length)];
        target.copy(bowl).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 0, (Math.random() - 0.5) * 0.8));
        duration = 6.0;
      } else if (chosenBehavior === 'drink') {
        const list = Math.random() < 0.5 ? SANCTUARY_WATER_BOWLS : SANCTUARY_POND_EDGES;
        const pt = list[Math.floor(Math.random() * list.length)];
        target.copy(pt).add(new THREE.Vector3((Math.random() - 0.5) * 0.6, 0, (Math.random() - 0.5) * 0.6));
        duration = 6.0;
      } else if (chosenBehavior === 'rest') {
        const bed = SANCTUARY_BEDS[Math.floor(Math.random() * SANCTUARY_BEDS.length)];
        target.copy(bed).add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5));
        duration = 8.0 + Math.random() * 6.0;
      } else if (chosenBehavior === 'play') {
        const playSpot = SANCTUARY_PLAY_AREAS[Math.floor(Math.random() * SANCTUARY_PLAY_AREAS.length)];
        target.copy(playSpot).add(new THREE.Vector3((Math.random() - 0.5) * 2.0, 0, (Math.random() - 0.5) * 2.0));
        duration = 5.0 + Math.random() * 4.0;
      } else if (chosenBehavior === 'explore') {
        const spot = SANCTUARY_EXPLORE_SPOTS[Math.floor(Math.random() * SANCTUARY_EXPLORE_SPOTS.length)];
        target.copy(spot).add(new THREE.Vector3((Math.random() - 0.5) * 1.5, 0, (Math.random() - 0.5) * 1.5));
        duration = 6.0 + Math.random() * 4.0;
      } else {
        const ang = Math.random() * Math.PI * 2;
        const dist = 3.0 + Math.random() * 16.0;
        target.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
        if (Math.hypot(target.x, target.z) < 3.2) {
          target.multiplyScalar(1.6);
        }
        duration = 5.0 + Math.random() * 5.0;
      }

      return {
        behavior: chosenBehavior,
        targetPos: target,
        timer: duration,
        subTimer: 0,
        speed: moveSpeed,
        restPose: Math.random() < 0.6 ? 'sit' : 'lie',
        playMotion: Math.random() < 0.4 ? 'bounce' : Math.random() < 0.7 ? 'spin' : 'wiggle',
        wanderAngle: Math.atan2(target.x - curPos.x, target.z - curPos.z),
      };
    }

    function createPetNameBadge(name: string): THREE.Sprite {
      const canvas = document.createElement('canvas');
      canvas.width = 192;
      canvas.height = 48;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'rgba(28, 25, 23, 0.82)';
      ctx.roundRect(4, 4, 184, 40, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, 96, 24);
      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(1.4, 0.35, 1);
      sprite.position.y = 1.35;
      return sprite;
    }

    // Follower & Sanctuary Pet Meshes
    const petMeshMap = new Map<string, PetMeshGroup>();
    const initialEquippedSlots = stateRef.current.player.equippedSkillSlots;
    stateRef.current.pets.forEach((pet) => {
      const petMesh = createPetModel(pet.species);
      const isSanctuary = stateRef.current.currentLocation === 'pet_den';
      const equippedSlotIdx = initialEquippedSlots.indexOf(pet.id);
      const isEquippedFollowing = pet.unlocked && equippedSlotIdx !== -1;

      if (isEquippedFollowing) {
        // Escort formation fan-out behind player
        const ang = Math.PI + (equippedSlotIdx - 2) * 0.45;
        petMesh.position.set(
          playerPhysics.pos.x + Math.sin(ang) * (2.0 + (equippedSlotIdx % 2) * 0.8),
          0,
          playerPhysics.pos.z + Math.cos(ang) * (2.0 + (equippedSlotIdx % 2) * 0.8)
        );
        petMesh.visible = true;
      } else if (isSanctuary && pet.unlocked) {
        // In Pet Sanctuary, roam meadow
        petMesh.position.set((Math.random() - 0.5) * 16, 0, (Math.random() - 0.5) * 16);
        petMesh.visible = true;
      } else {
        // Non-followers reside peacefully in the Pet Den
        petMesh.position.set(0, -100, 0);
        petMesh.visible = false;
      }

      // Add 3D Floating Name Badge above pet head
      const nameBadge = createPetNameBadge(pet.name);
      nameBadge.visible = false;
      petMesh.add(nameBadge);
      (petMesh.userData as any).nameBadge = nameBadge;

      // Add 3D Floating Combat HP Bar above pet (visible in Wild Grounds)
      const petHb = createEnemyHealthBar(0.95, 1.15);
      (petHb.foreground.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
      petHb.group.visible = false;
      petMesh.add(petHb.group);
      (petMesh.userData as any).petHpBarGroup = petHb.group;
      (petMesh.userData as any).petHpBarForeground = petHb.foreground;

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

      petDenAIMap.set(pet.id, pickNewSanctuaryBehavior(pet, petMesh.position));
    });

    resetPetRuntimeHealth();
    syncPetRuntimeCombat(true);

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
    let wasNearTrainingStation = false;
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
      const activeEnhLevel = pet?.training?.active_skill || 0;

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
        const hasHuntersInstinct = equipped.includes('pet_timber_wolf');
        const hasChillyPresence = equipped.includes('pet_penguin');
        const hasNightHunter = equipped.includes('pet_bat');
        const hasDragonHeart = equipped.includes('pet_dragon_whelp');

        let enemiesHitCount = 0;

        for (let i = activeEnemies.length - 1; i >= 0; i--) {
          const enemy = activeEnemies[i];
          const dist = enemy.mesh.position.distanceTo(center);
          if (dist <= radius) {
            enemiesHitCount++;
            let finalDmg = baseDmg;

            // Wolf Pack Instinct & Dragon Might damage multiplier (scaled by Passive Enhancement)
            if (hasWolfMight) finalDmg *= 1 + 0.25 * getPassiveMult('pet_wolf');
            if (hasDragonMight) finalDmg *= 1 + 0.35 * getPassiveMult('pet_dragon');

            // Tomato / Pineapple / Moonberry / Sunmelon Nourishment: permanent attack damage multiplier
            const tomatoAttackBonus = (stateRef.current.player.nourishment?.attackDamagePct || 0) / 100;
            if (tomatoAttackBonus > 0) {
              finalDmg *= 1 + tomatoAttackBonus;
            }

            // Glow Mushroom Nourishment: permanent skill damage multiplier
            const skillDmgBonus = (stateRef.current.player.nourishment?.skillDamagePct || 0) / 100;
            if (skillDmgBonus > 0) {
              finalDmg *= 1 + skillDmgBonus;
            }

            // Dragon Whelp Passive: Dragon Heart boosts fire skills (Fox, Dragon, Phoenix, Dragon Whelp)
            if (hasDragonHeart && (options?.isFoxSkill || petId === 'pet_dragon_whelp' || petId === 'pet_dragon' || petId === 'pet_phoenix')) {
              const dwPet = stateRef.current.pets.find((p) => p.id === 'pet_dragon_whelp');
              const dwLvl = dwPet?.level || 1;
              const fireBonus = (dwLvl >= 50 ? 0.5 : dwLvl >= 30 ? 0.35 : dwLvl >= 10 ? 0.25 : 0.2) * getPassiveMult('pet_dragon_whelp');
              finalDmg *= 1 + fireBonus;
            }

            // Timber Wolf Passive: Hunter's Instinct boosts damage against isolated enemies
            if (hasHuntersInstinct) {
              let hasNeighbor = false;
              for (const other of activeEnemies) {
                if (other !== enemy && other.health > 0 && other.mesh.position.distanceTo(enemy.mesh.position) <= 4.0) {
                  hasNeighbor = true;
                  break;
                }
              }
              if (!hasNeighbor) {
                const twPet = stateRef.current.pets.find((p) => p.id === 'pet_timber_wolf');
                const twLvl = twPet?.level || 1;
                const isoBonus = (twLvl >= 50 ? 0.55 : twLvl >= 30 ? 0.4 : twLvl >= 10 ? 0.28 : 0.2) * getPassiveMult('pet_timber_wolf');
                finalDmg *= 1 + isoBonus;
              }
            }

            // Penguin Passive: Chilly Presence boosts damage against slowed enemies
            if (hasChillyPresence && enemy.slowTimer > 0) {
              const pgPet = stateRef.current.pets.find((p) => p.id === 'pet_penguin');
              const pgLvl = pgPet?.level || 1;
              const chillBonus = (pgLvl >= 50 ? 0.55 : pgLvl >= 30 ? 0.4 : pgLvl >= 10 ? 0.28 : 0.2) * getPassiveMult('pet_penguin');
              finalDmg *= 1 + chillBonus;
            }

            // Bat Passive: Night Hunter boosts damage against weakened enemies
            if (hasNightHunter && (enemy.health / enemy.maxHealth <= 0.6 || enemy.slowTimer > 0 || enemy.stunTimer > 0 || enemy.burnTimer > 0)) {
              const btPet = stateRef.current.pets.find((p) => p.id === 'pet_bat');
              const btLvl = btPet?.level || 1;
              const nightBonus = (btLvl >= 50 ? 0.5 : btLvl >= 30 ? 0.38 : btLvl >= 10 ? 0.28 : 0.2) * getPassiveMult('pet_bat');
              finalDmg *= 1 + nightBonus;
            }

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
                const owlBonus = (owlLvl >= 50 ? 0.50 : owlLvl >= 10 ? 0.30 : 0.20) * getPassiveMult('pet_owl');
                finalDmg *= (1 + owlBonus);
              }
            }

            // Critical Hit chance (Strawberry / Starfruit Nourishment + Rabbit Predator Instinct)
            let isCrit = false;
            let critChance = (stateRef.current.player.nourishment?.critChancePct || 0) / 100;

            if (hasPredatorInstinct) {
              const rabLvl = rabbitPet?.level || 1;
              const rabMult = getPassiveMult('pet_rabbit');
              const hpPct = enemy.health / enemy.maxHealth;
              critChance += (rabLvl >= 10 ? 0.12 : 0.05) * rabMult;
              if (hpPct <= 0.5) {
                critChance += (rabLvl >= 50 ? 0.90 : rabLvl >= 10 ? 0.40 : 0.25) * rabMult;
              }
              if (options?.isRabbitSkill && rabLvl >= 50) {
                critChance = 1.0; // 100% Guaranteed Crit at Lv 50
              }
            }

            // Combat overall cap: 85% (0.85) maximum unless a 100% guaranteed skill override
            if (critChance < 1.0) {
              critChance = Math.min(0.85, critChance);
            }

            if (critChance > 0 && Math.random() < critChance) {
              isCrit = true;
              const hpPct = enemy.health / enemy.maxHealth;
              const rabLvl = rabbitPet?.level || 1;
              const baseCritMult = hasPredatorInstinct && hpPct <= 0.3 && rabLvl >= 30 ? 2.2 : 1.6;
              const blueberryCritDmgBonus = (stateRef.current.player.nourishment?.critDamagePct || 0) / 100;
              finalDmg *= baseCritMult + blueberryCritDmgBonus;
              soundEngine.playCritHit();
              particleSys.spawnCritImpact(enemy.mesh.position);
              if (hasPredatorInstinct && rabLvl >= 20) {
                playerPhysics.speedBoostTimer = 2.0;
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

              trackEnemyDefeat(enemy);
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
                prepCountdown: null,
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
        const stats = computeActiveSkillStats('pet_fox', level, activeEnhLevel) as any;
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
        const stats = computeActiveSkillStats('pet_turtle', level, activeEnhLevel) as any;
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
        const stats = computeActiveSkillStats('pet_rabbit', level, activeEnhLevel) as any;
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
                  stateRef.current.onMissionEvent?.('harvest_crop', 1, String(plot.id));
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
        const stats = computeActiveSkillStats('pet_owl', level, activeEnhLevel) as any;
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
        const stats = computeActiveSkillStats('pet_bear', level, activeEnhLevel) as any;
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
        const stats = computeActiveSkillStats('pet_slime', level, activeEnhLevel) as any;

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
          const actualHeal = applyPlayerHeal(stats.heal);
          particleSys.spawnDamageNumber(playerPhysics.pos, actualHeal, false, false, 'heal');
          particleSys.spawnHealingBubbles(playerPhysics.pos);
          stateRef.current.onShowMessage(`Boba cast Arcane Burst! Restored +${actualHeal} HP & blasted enemies!`);

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
        const stats = computeActiveSkillStats('pet_frog', level, activeEnhLevel) as any;
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
        const stats = computeActiveSkillStats('pet_wolf', level, activeEnhLevel) as any;
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
        const stats = computeActiveSkillStats('pet_deer', level, activeEnhLevel) as any;
        soundEngine.playSwiftLeap();
        playerPhysics.speedBoostTimer = 4.0;
        const healed = applyPlayerHeal(stats.heal);
        dealDamageInRadius(pPos, stats.radius, stats.damage);
        stateRef.current.onShowMessage(`Fawn sprinted forward! Restored +${healed} HP & surging speed!`);
      } else if (petId === 'pet_dragon') {
        // Dragon Inferno Nova
        const stats = computeActiveSkillStats('pet_dragon', level, activeEnhLevel) as any;
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
        const stats = computeActiveSkillStats('pet_phoenix', level, activeEnhLevel) as any;
        soundEngine.playVictory();
        particleSys.spawnArcaneNova(pPos, stats.radius);
        if (stats.heal >= 9000) {
          stateRef.current.onUpdatePlayer((prev) => ({ ...prev, health: prev.maxHealth || 100 }));
        } else {
          applyPlayerHeal(stats.heal);
        }
        dealDamageInRadius(pPos, stats.radius, stats.damage, {
          stunDuration: stats.blindStun ? 2.0 : 0,
        });
        stateRef.current.onShowMessage(`Solara summoned Solar Flare! Full Health Revive & Holy Blast!`);
      } else if (petId === 'pet_red_panda') {
        // RED PANDA: Healing Leaves (gradually heals player inside leaf zone)
        const stats = computeActiveSkillStats('pet_red_panda', level, activeEnhLevel) as any;
        soundEngine.playArcaneBurst();
        particleSys.spawnAscendingHealAura(pPos);
        const zonePos = pPos.clone();
        const zoneGroup = new THREE.Group();
        zoneGroup.position.set(zonePos.x, 0.06, zonePos.z);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(stats.radius * 0.85, stats.radius, 24),
          new THREE.MeshBasicMaterial({ color: 0x52b788, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
        );
        ring.rotation.x = -Math.PI / 2;
        const fill = new THREE.Mesh(
          new THREE.CircleGeometry(stats.radius * 0.85, 24),
          new THREE.MeshBasicMaterial({ color: 0x95d5b2, side: THREE.DoubleSide, transparent: true, opacity: 0.25 })
        );
        fill.rotation.x = -Math.PI / 2;
        zoneGroup.add(ring, fill);
        scene.add(zoneGroup);

        if (inWild) {
          activeGroundZones.push({
            type: 'heal_zone',
            mesh: zoneGroup,
            pos: zonePos,
            duration: stats.duration,
            radius: stats.radius,
            tickTimer: 0.2,
            healPerTick: stats.healPerTick,
          });
          dealDamageInRadius(zonePos, stats.radius, stats.damage, { knockback: 0.6 });
        } else {
          setTimeout(() => scene.remove(zoneGroup), 2000);
        }
        const burstHeal = applyPlayerHeal((stats.healPerTick || 12) + (stats.burstHeal || 0));
        particleSys.spawnDamageNumber(pPos, burstHeal, false, false, 'heal');
        stateRef.current.onShowMessage(`Red Panda summoned Healing Leaves! Restoring HP over ${stats.duration}s!`);
      } else if (petId === 'pet_timber_wolf') {
        // TIMBER WOLF: Pack Assault (powerful forward charge)
        const stats = computeActiveSkillStats('pet_timber_wolf', level, activeEnhLevel) as any;
        soundEngine.playFlameDash();
        playerPhysics.dashTimer = 0.26;
        playerPhysics.dashSpeed = 24.0;
        playerPhysics.dashDir.set(Math.sin(playerPhysics.rotY), 0, Math.cos(playerPhysics.rotY));
        stateRef.current.onShowMessage(`Wolf unleashed Pack Assault! (${stats.damage} physical charge)`);
        setTimeout(() => {
          particleSys.spawnEarthshatterSpikes(playerPhysics.pos, stats.radius);
          dealDamageInRadius(playerPhysics.pos, stats.radius, stats.damage, {
            knockback: stats.knockbackForce || 1.8,
            stunDuration: stats.stunDuration || 0,
          });
        }, 250);
      } else if (petId === 'pet_sylvan_deer') {
        // SYLVAN DEER: Nature's Blessing (protective nature field)
        const stats = computeActiveSkillStats('pet_sylvan_deer', level, activeEnhLevel) as any;
        soundEngine.playTidalBarrier();
        playerPhysics.shield = Math.max(playerPhysics.shield, stats.shield);
        playerPhysics.maxShield = Math.max(playerPhysics.maxShield, stats.shield);
        if (stats.heal > 0) applyPlayerHeal(stats.heal);
        if (waterShieldMesh) waterShieldMesh.visible = true;
        particleSys.spawnShieldRipple(pPos);

        const zonePos = pPos.clone();
        const zoneGroup = new THREE.Group();
        zoneGroup.position.set(zonePos.x, 0.06, zonePos.z);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(stats.radius * 0.85, stats.radius, 24),
          new THREE.MeshBasicMaterial({ color: 0x84cc16, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
        );
        ring.rotation.x = -Math.PI / 2;
        zoneGroup.add(ring);
        scene.add(zoneGroup);

        if (inWild) {
          activeGroundZones.push({
            type: 'defense_zone',
            mesh: zoneGroup,
            pos: zonePos,
            duration: stats.duration,
            radius: stats.radius,
            tickTimer: 0.5,
            damageReductionPct: (stats.defensePct || 25) / 100,
          });
          dealDamageInRadius(zonePos, stats.radius, stats.damage, { slowPct: 0.25, slowDuration: 2.5 });
        } else {
          setTimeout(() => scene.remove(zoneGroup), 2000);
        }
        stateRef.current.onShowMessage(`Deer cast Nature's Blessing! +${stats.shield} Shield & Protective Field!`);
      } else if (petId === 'pet_penguin') {
        // PENGUIN: Frozen Slide (slides forward, damaging and slowing enemies)
        const stats = computeActiveSkillStats('pet_penguin', level, activeEnhLevel) as any;
        soundEngine.playWaterSplash();
        playerPhysics.dashTimer = 0.3;
        playerPhysics.dashSpeed = 20.0;
        playerPhysics.dashDir.set(Math.sin(playerPhysics.rotY), 0, Math.cos(playerPhysics.rotY));
        particleSys.spawnWaterBurst(pPos, 2.2);
        stateRef.current.onShowMessage(`Penguin used Frozen Slide! Chilling foes along its path!`);
        setTimeout(() => {
          particleSys.spawnWaterBurst(playerPhysics.pos, stats.radius);
          dealDamageInRadius(playerPhysics.pos, stats.radius, stats.damage, {
            slowPct: stats.slowPct,
            slowDuration: stats.slowDuration || 3.5,
            stunDuration: stats.stunDuration || 0,
            knockback: 1.0,
          });
        }, 260);
      } else if (petId === 'pet_bat') {
        // BAT: Blood Echo (energy wave damaging enemies and restoring HP)
        const stats = computeActiveSkillStats('pet_bat', level, activeEnhLevel) as any;
        soundEngine.playArcaneBurst();
        particleSys.spawnArcaneNova(pPos, stats.radius);
        let hits = 0;
        for (const e of activeEnemies) {
          if (e.health > 0 && e.mesh.position.distanceTo(pPos) <= stats.radius) hits++;
        }
        dealDamageInRadius(pPos, stats.radius, stats.damage, { knockback: 1.1 });
        const totalHeal = applyPlayerHeal((stats.baseHeal || 28) + hits * (stats.healPerTarget || 8));
        particleSys.spawnDamageNumber(pPos, totalHeal, false, false, 'heal');
        particleSys.spawnAscendingHealAura(pPos);
        stateRef.current.onShowMessage(`Bat emitted Blood Echo! Drained foes & restored +${totalHeal} HP!`);
      } else if (petId === 'pet_poison_frog') {
        // POISON FROG: Toxic Tongue (strikes ahead & creates poison pool)
        const stats = computeActiveSkillStats('pet_poison_frog', level, activeEnhLevel) as any;
        soundEngine.playWaterSplash();
        const fwd = _vec3A.set(Math.sin(playerPhysics.rotY), 0, Math.cos(playerPhysics.rotY));
        const poolPos = pPos.clone().addScaledVector(fwd, 3.2);
        particleSys.spawnPetBasicAttackHit(poolPos, 'poison_frog');
        dealDamageInRadius(poolPos, stats.radius, stats.damage, { slowPct: stats.slowPct || 0.25, slowDuration: 2.5 });

        const zoneGroup = new THREE.Group();
        zoneGroup.position.set(poolPos.x, 0.06, poolPos.z);
        const pool = new THREE.Mesh(
          new THREE.CircleGeometry(stats.radius, 20),
          new THREE.MeshBasicMaterial({ color: 0x65a30d, side: THREE.DoubleSide, transparent: true, opacity: 0.45 })
        );
        pool.rotation.x = -Math.PI / 2;
        zoneGroup.add(pool);
        scene.add(zoneGroup);
        if (inWild) {
          activeGroundZones.push({
            type: 'poison_zone',
            mesh: zoneGroup,
            pos: poolPos,
            duration: stats.duration,
            radius: stats.radius,
            tickTimer: 0.35,
            damagePerTick: stats.tickDamage,
          });
        } else {
          setTimeout(() => scene.remove(zoneGroup), 2000);
        }
        stateRef.current.onShowMessage(`Frog lashed Toxic Tongue! Created venomous bog!`);
      } else if (petId === 'pet_hedgehog') {
        // HEDGEHOG: Spiky Roll (rolls forward, damaging enemies)
        const stats = computeActiveSkillStats('pet_hedgehog', level, activeEnhLevel) as any;
        soundEngine.playEarthshatter();
        if (stats.shield > 0) {
          playerPhysics.shield = Math.max(playerPhysics.shield, stats.shield);
          playerPhysics.maxShield = Math.max(playerPhysics.maxShield, stats.shield);
        }
        playerPhysics.dashTimer = 0.28;
        playerPhysics.dashSpeed = 21.0;
        playerPhysics.dashDir.set(Math.sin(playerPhysics.rotY), 0, Math.cos(playerPhysics.rotY));
        stateRef.current.onShowMessage(`Hedgehog triggered Spiky Roll! Bowling through foes!`);
        setTimeout(() => {
          particleSys.spawnCraterDecal(playerPhysics.pos, stats.radius);
          dealDamageInRadius(playerPhysics.pos, stats.radius, stats.damage, {
            knockback: 1.9,
            stunDuration: stats.stunDuration || 0,
          });
        }, 250);
      } else if (petId === 'pet_bee') {
        // BEE: Honey Barrage (fires several magical honey projectiles)
        const stats = computeActiveSkillStats('pet_bee', level, activeEnhLevel) as any;
        soundEngine.playSwiftLeap();
        const boltCount = stats.boltCount || 5;
        const perBoltDmg = stats.dmgPerBolt || Math.max(25, Math.round(stats.damage / boltCount));
        const targets = activeEnemies.filter((e) => e.health > 0).slice(0, boltCount);
        if (targets.length > 0) {
          for (let i = 0; i < boltCount; i++) {
            const target = targets[i % targets.length];
            setTimeout(() => {
              if (target.health > 0) {
                particleSys.spawnPetAttackProjectile(playerPhysics.pos, target.mesh.position, 'bee');
                dealDamageInRadius(target.mesh.position, 2.2, perBoltDmg, {
                  knockback: 0.5,
                  slowPct: stats.slowPct || 0.25,
                  slowDuration: 2.5,
                });
              }
            }, i * 75);
          }
        } else {
          const aimPos = pPos.clone().addScaledVector(_vec3A.set(Math.sin(playerPhysics.rotY), 0, Math.cos(playerPhysics.rotY)), 4.0);
          particleSys.spawnPetAttackProjectile(pPos, aimPos, 'bee');
        }
        stateRef.current.onShowMessage(`Bee launched Honey Barrage! (${boltCount} nectar bolts)`);
      } else if (petId === 'pet_dragon_whelp') {
        // DRAGON WHELP: Ember Breath (breathes fire in a cone)
        const stats = computeActiveSkillStats('pet_dragon_whelp', level, activeEnhLevel) as any;
        soundEngine.playFlameDash();
        const coneRange = stats.radius || 7.0;
        const fwd = new THREE.Vector3(Math.sin(playerPhysics.rotY), 0, Math.cos(playerPhysics.rotY)).normalize();
        const coneCenter = pPos.clone().addScaledVector(fwd, coneRange * 0.52);
        particleSys.spawnFlameExplosion(coneCenter, coneRange * 0.55);
        particleSys.spawnFlameTrail(pPos.clone().addScaledVector(fwd, 2.0));

        if (inWild) {
          for (let i = activeEnemies.length - 1; i >= 0; i--) {
            const e = activeEnemies[i];
            const toE = e.mesh.position.clone().sub(pPos);
            toE.y = 0;
            const d = toE.length();
            if (d <= coneRange) {
              const dot = d > 0.01 ? fwd.dot(toE.normalize()) : 1;
              if (dot >= 0.42) {
                e.burnTimer = Math.max(e.burnTimer, 3.0);
                e.burnDmgPerTick = stats.burnDmgPerTick || Math.round(16 + level * 1.2);
                e.burnTickTimer = 0;
                dealDamageInRadius(e.mesh.position, 0.9, stats.damage, { isFoxSkill: true, knockback: 1.2 });
              }
            }
          }
        }
        stateRef.current.onShowMessage(`Dragon Whelp breathed Ember Breath! Scorched enemies in a cone!`);
      } else if (petId === 'pet_capybara') {
        // CAPYBARA: Calm Aura (creates area reducing damage received)
        const stats = computeActiveSkillStats('pet_capybara', level, activeEnhLevel) as any;
        soundEngine.playArcaneBurst();
        const zonePos = pPos.clone();
        const zoneGroup = new THREE.Group();
        zoneGroup.position.set(zonePos.x, 0.06, zonePos.z);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(stats.radius * 0.85, stats.radius, 24),
          new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
        );
        ring.rotation.x = -Math.PI / 2;
        zoneGroup.add(ring);
        scene.add(zoneGroup);
        const healTick = Math.max(6, Math.round((stats.heal || 20) / 3));
        if (inWild) {
          activeGroundZones.push({
            type: 'defense_zone',
            mesh: zoneGroup,
            pos: zonePos,
            duration: stats.duration,
            radius: stats.radius,
            tickTimer: 0.8,
            damageReductionPct: (stats.defensePct || 30) / 100,
            healPerTick: healTick,
          });
        } else {
          setTimeout(() => scene.remove(zoneGroup), 2000);
        }
        applyPlayerHeal(stats.heal || 20);
        stateRef.current.onShowMessage(`Capybara radiated Calm Aura! Damage reduced inside tranquil zone!`);
      }
    }

    // Performance monitoring tracking variables
    let perfLastTimestamp = performance.now();
    let perfFrameCount = 0;
    let perfFrameTimeAccum = 0;
    let loopFrameIndex = 0;

    // --- COLLISION OBSTACLE DEFINITIONS & RESOLVER ---
    const FARM_TREE_COLLIDERS: [number, number][] = [
      [-16, -14], [-20, -8], [-18, 0], [-19, 14], [-8, 18],
      [2, 22], [14, 20], [22, 12], [24, -2], [22, -16],
      [7, -18], [-10, -18], [18, -6],
    ];
    const SANCTUARY_TREE_COLLIDERS: [number, number][] = [];
    for (let t = 0; t < 12; t++) {
      const ang = (t * Math.PI * 2) / 12 + (t % 2) * 0.2;
      const dist = 18 + (t % 3) * 3.5;
      SANCTUARY_TREE_COLLIDERS.push([Math.cos(ang) * dist, Math.sin(ang) * dist]);
    }

    function applyWorldCollisions(pos: THREE.Vector3, location: 'farm' | 'wild_grounds' | 'pet_den', playerRadius = 0.55) {
      // Circle collision resolver (smooth slide)
      const resolveCircle = (obsX: number, obsZ: number, obsRadius: number) => {
        const dx = pos.x - obsX;
        const dz = pos.z - obsZ;
        const dist = Math.hypot(dx, dz);
        const minDist = playerRadius + obsRadius;
        if (dist < minDist && dist > 0.0001) {
          const push = (minDist - dist) / dist;
          pos.x += dx * push;
          pos.z += dz * push;
        }
      };

      // Axis-aligned box collision resolver (smooth wall sliding)
      const resolveBox = (minX: number, maxX: number, minZ: number, maxZ: number) => {
        const closestX = Math.max(minX, Math.min(pos.x, maxX));
        const closestZ = Math.max(minZ, Math.min(pos.z, maxZ));
        const dx = pos.x - closestX;
        const dz = pos.z - closestZ;
        const dist = Math.hypot(dx, dz);
        if (dist < playerRadius) {
          if (dist > 0.0001) {
            const push = (playerRadius - dist) / dist;
            pos.x += dx * push;
            pos.z += dz * push;
          } else {
            const left = pos.x - minX;
            const right = maxX - pos.x;
            const top = pos.z - minZ;
            const bottom = maxZ - pos.z;
            const minEdge = Math.min(left, right, top, bottom);
            if (minEdge === left) pos.x = minX - playerRadius;
            else if (minEdge === right) pos.x = maxX + playerRadius;
            else if (minEdge === top) pos.z = minZ - playerRadius;
            else pos.z = maxZ + playerRadius;
          }
        }
      };

      if (location === 'farm') {
        // Main Farmhouse
        resolveBox(-5.6, 1.6, -13.0, -7.2);
        // Red Barn
        resolveBox(6.8, 13.2, -14.2, -7.8);
        // Windmill
        resolveCircle(-15, 5, 2.2);
        // Stone Well
        resolveCircle(4, 1, 1.35);
        // Barnaby's Seed Stall
        resolveBox(5.4, 8.6, -3.2, -0.8);
        // Fox Den
        resolveCircle(-11, -2, 1.85);
        // Turtle Pond rim
        resolveCircle(12, 8, 2.8);
        // Quarry Node Boulders
        resolveCircle(23, -8, 1.7);
        resolveCircle(25, 4, 1.7);
        // Perimeter wooden fences
        resolveBox(-8.8, 2.8, -1.8, -1.2);
        // Pet Den Sanctuary Building (solid timber cabin walls, leaving front porch steps clear)
        resolveBox(11.1, 16.2, -3.0, 3.0);
        // Pet Training Station platform (-2.0, 0, 14.0)
        resolveBox(-5.4, 1.4, 11.1, 16.9);
        // Wild Portal archway wooden posts (leaving arch passage clear)
        resolveCircle(-13.8, -10, 0.45);
        resolveCircle(-10.2, -10, 0.45);
        // Farm Trees
        for (let i = 0; i < FARM_TREE_COLLIDERS.length; i++) {
          resolveCircle(FARM_TREE_COLLIDERS[i][0], FARM_TREE_COLLIDERS[i][1], 1.15);
        }
        // Farm outer boundary
        const distFromCenter = Math.hypot(pos.x, pos.z);
        if (distFromCenter > 34) {
          pos.x = (pos.x / distFromCenter) * 34;
          pos.z = (pos.z / distFromCenter) * 34;
        }
      } else if (location === 'pet_den') {
        // 3 Pet Cottages
        resolveBox(-10.5, -7.5, -7.5, -4.5);
        resolveBox(7.5, 10.5, -6.5, -3.5);
        resolveBox(-11.5, -8.5, 5.5, 8.5);
        // Gazebo corner posts
        resolveCircle(8.8, 1.8, 0.35);
        resolveCircle(11.2, 1.8, 0.35);
        resolveCircle(8.8, 4.2, 0.35);
        resolveCircle(11.2, 4.2, 0.35);
        // Central Pond deep water center
        resolveCircle(0, 0, 3.5);
        // Agility play logs
        resolveBox(-1.8, 1.8, 7.1, 7.9);
        // Return Archway wooden posts
        resolveCircle(-1.8, -14.5, 0.45);
        resolveCircle(1.8, -14.5, 0.45);
        // Sanctuary Perimeter Trees
        for (let t = 0; t < SANCTUARY_TREE_COLLIDERS.length; t++) {
          resolveCircle(SANCTUARY_TREE_COLLIDERS[t][0], SANCTUARY_TREE_COLLIDERS[t][1], 1.2);
        }
        // Sanctuary outer boundary
        const distFromCenter = Math.hypot(pos.x, pos.z);
        if (distFromCenter > 25.5) {
          pos.x = (pos.x / distFromCenter) * 25.5;
          pos.z = (pos.z / distFromCenter) * 25.5;
        }
      } else if (location === 'wild_grounds') {
        // Arena outer boundary
        const distFromCenter = Math.hypot(pos.x, pos.z);
        if (distFromCenter > 28.5) {
          pos.x = (pos.x / distFromCenter) * 28.5;
          pos.z = (pos.z / distFromCenter) * 28.5;
        }
      }
    }

    // Main tick loop
    function tick() {
      const frameStartTime = performance.now();
      loopFrameIndex++;
      const delta = Math.min(clock.getDelta(), 0.1);
      const now = Date.now();

      // Check for location change (Farm <-> Wild Grounds <-> Pet Den)
      const currentLoc = stateRef.current.currentLocation;
      if (currentLoc !== lastLocation) {
        const prevLoc = lastLocation;
        lastLocation = currentLoc;
        isPlayerVictory = false;
        isPlayerDefeat = false;
        playerDamageTimer = 0;
        playerLandingTimer = 0;
        currentSkillCasting = null;
        petCombatAIMap.clear();
        resetPetRuntimeHealth();
        syncPetRuntimeCombat(true);
        if (currentLoc !== 'farm' && wasNearTrainingStation) {
          wasNearTrainingStation = false;
          stateRef.current.onNearTrainingStationChange?.(false);
        }
        while (activeGroundZones.length > 0) {
          const z = activeGroundZones.pop()!;
          scene.remove(z.mesh);
        }

        if (currentLoc === 'wild_grounds') {
          farmEnvironmentGroup.visible = false;
          instanceEnvironmentGroup.visible = true;
          petDenEnvironmentGroup.visible = false;
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
          waveClearedSummary = { wavesCleared: 0, essenceEarned: 0, goldEarned: 0 };
          instanceActive = true;
          spawnWave(1);
          soundEngine.playPortalWarp();
          scene.background = new THREE.Color(0x1a1226);
          scene.fog = new THREE.Fog(0x1a1226, 36, 94);
          sunLight.color.setHex(0xb5838d);
          hemiLight.color.setHex(0x5a189a);
        } else if (currentLoc === 'pet_den') {
          farmEnvironmentGroup.visible = false;
          instanceEnvironmentGroup.visible = false;
          petDenEnvironmentGroup.visible = true;
          playerPhysics.pos.set(0, 0, -12); // inside Sanctuary entrance
          playerPhysics.rotY = 0;
          playerPhysics.shield = 0;
          if (waterShieldMesh) waterShieldMesh.visible = false;
          instanceActive = false;
          soundEngine.playPortalWarp();
          scene.background = new THREE.Color(0xbbf7d0); // peaceful sanctuary sky
          scene.fog = new THREE.Fog(0xbbf7d0, 42, 110);
          sunLight.color.setHex(0xfffbeb);
          hemiLight.color.setHex(0xdcfce7);
        } else {
          farmEnvironmentGroup.visible = true;
          instanceEnvironmentGroup.visible = false;
          petDenEnvironmentGroup.visible = false;
          if (prevLoc === 'pet_den') {
            playerPhysics.pos.set(10.2, 0, 0); // outside Pet Den porch steps on farm
            playerPhysics.rotY = -Math.PI / 2;
          } else {
            playerPhysics.pos.set(-11, 0, -8); // outside Wild portal on farm
          }
          playerPhysics.shield = 0;
          if (waterShieldMesh) waterShieldMesh.visible = false;
          instanceActive = false;
          soundEngine.playPortalWarp();
          scene.background = new THREE.Color(0xa7c7e7);
          scene.fog = new THREE.Fog(0xa7c7e7, 40, 108);
          sunLight.color.setHex(0xfffae0);
          hemiLight.color.setHex(0xe0f2fe);
        }

        // Reposition follower pets smoothly around spawn position
        const allPets = stateRef.current.pets;
        const warpEquippedSet = new Set(stateRef.current.player.equippedSkillSlots.filter(Boolean) as string[]);
        allPets.forEach((pet) => {
          const mesh = petMeshMap.get(pet.id);
          if (!mesh) return;
          if (pet.unlocked && warpEquippedSet.has(pet.id)) {
            mesh.visible = true;
            mesh.rotation.z = 0;
            mesh.scale.set(1, 1, 1);
            mesh.position.set(
              playerPhysics.pos.x + (Math.random() - 0.5) * 3,
              0,
              playerPhysics.pos.z - 2 + (Math.random() - 0.5) * 2
            );
          } else if (currentLoc === 'pet_den' && pet.unlocked) {
            mesh.visible = true;
            mesh.rotation.z = 0;
            mesh.scale.set(1, 1, 1);
            mesh.position.set(
              (Math.random() - 0.5) * 14,
              0,
              (Math.random() - 0.5) * 14
            );
          } else {
            mesh.visible = false;
            mesh.position.set(0, -100, 0);
          }
        });
      }

      // Check for incoming skill cast requests from HUD
      const trigger = stateRef.current.skillCastTrigger;
      if (trigger && trigger.timestamp !== lastHandledSkillRef.current) {
        lastHandledSkillRef.current = trigger.timestamp;
        executePetSkill(trigger.petId);
        stateRef.current.onSkillCastHandled();
      }

      // Windmill blade spin & Training Station floating crystals
      windmillBlades.rotation.z += delta * 0.8;
      if (currentLoc === 'farm') {
        const crystalTime = now * 0.0022;
        for (let ci = 0; ci < trainingCrystals.length; ci++) {
          const c = trainingCrystals[ci];
          const baseY = (c.userData.baseY as number) || 1.42;
          const phase = (c.userData.phaseOffset as number) || 0;
          c.position.y = baseY + Math.sin(crystalTime + phase) * 0.16;
          c.rotation.y += delta * 1.3;
        }
      }

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
      const envLoc = stateRef.current.currentLocation === 'wild_grounds' ? 'wild_grounds' : 'farm';
      envSystem.update(delta, [], envLoc, particleSys);
      if (stateRef.current.onTimePhaseChange) {
        stateRef.current.onTimePhaseChange(envSystem.getTimePhase(), envSystem.timeOfDay);
      }

      // Fixed camera yaw (camera is non-draggable in bird-view mode)

      // Handle mobile jump trigger button
      if (stateRef.current.jumpCount !== lastHandledJump) {
        lastHandledJump = stateRef.current.jumpCount;
        if (playerPhysics.isGrounded) {
          playerPhysics.velY = 9.2;
          playerPhysics.isGrounded = false;
          soundEngine.playSwiftLeap();
        }
      }

      // --- PLAYER TARGET DETECTION & AUTO HUNT COMBAT SYSTEM ---
      const inWildCombat = currentLoc === 'wild_grounds' && instanceActive;
      let playerTargetEnemy: ActiveEnemy | null = null;

      if (inWildCombat) {
        // Validate or find player's combat target
        if (playerAutoTargetId) {
          playerTargetEnemy = activeEnemies.find((e) => e.id === playerAutoTargetId && e.health > 0) || null;
          if (playerTargetEnemy) {
            const d = playerTargetEnemy.mesh.position.distanceTo(playerPhysics.pos);
            if (d > 26) {
              playerTargetEnemy = null;
              playerAutoTargetId = null;
            }
          } else {
            playerAutoTargetId = null;
          }
        }

        playerTargetCheckTimer -= delta;
        if (!playerTargetEnemy || playerTargetCheckTimer <= 0) {
          playerTargetCheckTimer = 0.2;
          let bestScore = Infinity;
          let bestEnemy: ActiveEnemy | null = null;
          for (const enemy of activeEnemies) {
            if (enemy.health <= 0) continue;
            const d = enemy.mesh.position.distanceTo(playerPhysics.pos);
            if (d > 26) continue;
            // Prefer enemies attacking player or within 4.5m
            const threatBonus = d < 4.5 ? -3.0 : 0;
            const score = d + threatBonus;
            if (score < bestScore) {
              bestScore = score;
              bestEnemy = enemy;
            }
          }
          if (bestEnemy) {
            playerTargetEnemy = bestEnemy;
            playerAutoTargetId = bestEnemy.id;
          }
        }

        // 3D Target Reticle and HUD synchronization
        if (playerTargetEnemy) {
          targetReticleGroup.visible = true;
          targetReticleGroup.position.set(playerTargetEnemy.mesh.position.x, 0.05, playerTargetEnemy.mesh.position.z);
          targetReticleGroup.rotation.y += delta * 2.4;

          const eName = playerTargetEnemy.type === 'boss'
            ? 'Shadow Titan'
            : playerTargetEnemy.type === 'golem'
            ? 'Grove Golem'
            : playerTargetEnemy.type === 'wolf'
            ? 'Shadow Wolf'
            : playerTargetEnemy.type === 'imp'
            ? 'Forest Imp'
            : 'Shadow Slime';

          stateRef.current.onPlayerTargetChange?.({
            id: playerTargetEnemy.id,
            name: eName,
            hpRatio: Math.max(0, playerTargetEnemy.health / playerTargetEnemy.maxHealth),
            maxHealth: playerTargetEnemy.maxHealth,
            health: playerTargetEnemy.health,
          });
        } else {
          targetReticleGroup.visible = false;
          stateRef.current.onPlayerTargetChange?.(null);
        }
      } else {
        targetReticleGroup.visible = false;
        playerAutoTargetId = null;
        stateRef.current.onPlayerTargetChange?.(null);
      }

      // --- MOVEMENT CALCULATIONS ---
      let moveSpeed = 6.2;
      const cornSpeedBonus = (stateRef.current.player.nourishment?.moveSpeedPct || 0) / 100;
      if (cornSpeedBonus > 0) {
        moveSpeed *= 1 + cornSpeedBonus;
      }
      const equipped = stateRef.current.player.equippedSkillSlots;
      if (equipped.includes('pet_fox')) moveSpeed *= 1 + 0.15 * getPassiveMult('pet_fox'); // Fox passive
      if (equipped.includes('pet_bee')) {
        const beePet = stateRef.current.pets.find((p) => p.id === 'pet_bee');
        const beeLvl = beePet?.level || 1;
        const beeSpeedBonus = (beeLvl >= 50 ? 0.35 : beeLvl >= 30 ? 0.25 : beeLvl >= 10 ? 0.2 : 0.15) * getPassiveMult('pet_bee');
        moveSpeed *= 1 + beeSpeedBonus;
      }
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
        applyWorldCollisions(playerPhysics.pos, currentLoc);
        particleSys.spawnFlameTrail(playerPhysics.pos);
        if (Math.random() < 0.45) {
          particleSys.spawnFlameGroundPatch(playerPhysics.pos);
        }
      }

      let isMoving = false;
      let effectiveMoveSpeed = 0;
      const isAutoHuntActive = stateRef.current.isAutoHunt && inWildCombat;

      if (isAutoHuntActive) {
        // --- AUTO HUNT CHASE & AUTOMATIC SKILL COMBAT ---
        // STRICT RULE: The player character NEVER performs basic attacks!
        if (playerTargetEnemy && !currentSkillCasting) {
          const distToTarget = playerPhysics.pos.distanceTo(playerTargetEnemy.mesh.position);
          const skillRange = 3.6; // effective combat skill distance

          if (distToTarget > skillRange) {
            // Chase towards selected target enemy
            const chaseDir = _vec3A.subVectors(playerTargetEnemy.mesh.position, playerPhysics.pos);
            chaseDir.y = 0;
            chaseDir.normalize();

            playerPhysics.pos.addScaledVector(chaseDir, moveSpeed * delta);
            applyWorldCollisions(playerPhysics.pos, currentLoc);

            const targetRotY = Math.atan2(chaseDir.x, chaseDir.z);
            const rotDiff = THREE.MathUtils.euclideanModulo(targetRotY - playerPhysics.rotY + Math.PI, Math.PI * 2) - Math.PI;
            playerPhysics.rotY += rotDiff * Math.min(delta * 14, 1);

            isMoving = true;
            effectiveMoveSpeed = moveSpeed;
          } else {
            // Within effective skill range: stop movement and face target enemy
            isMoving = false;
            effectiveMoveSpeed = 0;
            const faceDir = _vec3A.subVectors(playerTargetEnemy.mesh.position, playerPhysics.pos);
            faceDir.y = 0;
            if (faceDir.lengthSq() > 0.01) {
              faceDir.normalize();
              const targetRotY = Math.atan2(faceDir.x, faceDir.z);
              const rotDiff = THREE.MathUtils.euclideanModulo(targetRotY - playerPhysics.rotY + Math.PI, Math.PI * 2) - Math.PI;
              playerPhysics.rotY += rotDiff * Math.min(delta * 14, 1);
            }
          }

          // Automatic Skill Evaluation and Execution
          playerAutoSkillCooldown -= delta;
          if (playerAutoSkillCooldown <= 0 && !currentSkillCasting) {
            const equippedSlots = stateRef.current.player.equippedSkillSlots.filter(Boolean) as string[];
            const cds = stateRef.current.skillCooldowns || {};
            const readySkills = equippedSlots.filter((id) => (cds[id] || 0) <= 0);

            if (readySkills.length > 0) {
              // Count enemies grouped around player
              let nearbyEnemies = 0;
              for (const other of activeEnemies) {
                if (other.health > 0 && other.mesh.position.distanceTo(playerPhysics.pos) <= 6.5) {
                  nearbyEnemies++;
                }
              }

              // Prefer Area of Effect skills when multiple enemies are grouped
              const aoeSkills = [
                'pet_owl',
                'pet_bear',
                'pet_slime',
                'pet_dragon',
                'pet_frog',
                'pet_bat',
                'pet_dragon_whelp',
                'pet_poison_frog',
                'pet_red_panda',
                'pet_sylvan_deer',
                'pet_capybara',
              ];
              let chosenSkillId: string | null = null;

              if (nearbyEnemies >= 2) {
                chosenSkillId = readySkills.find((id) => aoeSkills.includes(id)) || readySkills[0];
              } else {
                chosenSkillId = readySkills.find((id) => !aoeSkills.includes(id)) || readySkills[0];
              }

              if (chosenSkillId) {
                playerAutoSkillCooldown = 0.35; // buffer between skill activations to prevent conflicts
                stateRef.current.onTriggerSkill?.(chosenSkillId);
              }
            }
          }
        }
      } else {
        // --- MANUAL MOVEMENT VIA JOYSTICK ---
        // STRICT RULE: The player character NEVER performs basic attacks!
        let moveX = 0;
        let moveZ = 0;

        const joy = stateRef.current.joystickInput;
        if (joy && (Math.abs(joy.x) > 0.05 || Math.abs(joy.y) > 0.05)) {
          moveX = joy.x;
          moveZ = -joy.y;
        }

        const inputLen = Math.hypot(moveX, moveZ);
        if (inputLen > 0.1) {
          isMoving = true;
          const normX = moveX / inputLen;
          const normZ = moveZ / inputLen;

          const forward = _vec3A.set(Math.sin(camYaw), 0, Math.cos(camYaw));
          const right = _vec3B.set(-Math.cos(camYaw), 0, Math.sin(camYaw));

          const worldDir = _vec3Cam
            .set(0, 0, 0)
            .addScaledVector(right, normX)
            .addScaledVector(forward, normZ)
            .normalize();

          const stepSpeed = moveSpeed * Math.min(inputLen, 1);
          playerPhysics.pos.addScaledVector(worldDir, stepSpeed * delta);
          applyWorldCollisions(playerPhysics.pos, currentLoc);

          const targetRotY = Math.atan2(worldDir.x, worldDir.z);
          const rotDiff = THREE.MathUtils.euclideanModulo(targetRotY - playerPhysics.rotY + Math.PI, Math.PI * 2) - Math.PI;
          playerPhysics.rotY += rotDiff * Math.min(delta * 14, 1);

          effectiveMoveSpeed = stepSpeed;
        }
      }

      if (isMoving) {
        footstepTimer += delta;
        const footstepInterval = effectiveMoveSpeed > 5.5 ? 0.24 : 0.35;
        if (footstepTimer > footstepInterval) {
          soundEngine.playFootstep();
          footstepTimer = 0;
        }

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
          velocity: isMoving ? _vec3Cam.clone().multiplyScalar(effectiveMoveSpeed) : new THREE.Vector3(),
          horizontalSpeed: isMoving ? effectiveMoveSpeed : 0,
          isGrounded: playerPhysics.isGrounded,
          isJumping,
          isFalling,
          isLanding: playerPhysics.isGrounded && playerLandingTimer > 0,
          landingTimer: Math.max(0, playerLandingTimer / 0.18),
          isAttacking: false, // Character NEVER performs basic attacks
          attackTimer: 0,
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

      // Slime Gelatinous Body / Capybara Peaceful Companion out-of-combat heal (avoids damage for 3.5s)
      outOfCombatDamageTimer += delta;
      const equippedSlots = stateRef.current.player.equippedSkillSlots;
      const hasSlimeRegen = equippedSlots.includes('pet_slime');
      const hasCapyRegen = equippedSlots.includes('pet_capybara');
      if ((hasSlimeRegen || hasCapyRegen) && outOfCombatDamageTimer >= 3.5) {
        slimeRegenTicker += delta;
        if (slimeRegenTicker >= 2.0) {
          slimeRegenTicker = 0;
          let regenAmount = 0;
          if (hasSlimeRegen) {
            const slimePet = stateRef.current.pets.find((p) => p.id === 'pet_slime');
            regenAmount += Math.round((5 + (slimePet?.level || 1) * 1.4) * getPassiveMult('pet_slime'));
          }
          if (hasCapyRegen) {
            const capyPet = stateRef.current.pets.find((p) => p.id === 'pet_capybara');
            regenAmount += Math.round((6 + (capyPet?.level || 1) * 1.1) * getPassiveMult('pet_capybara'));
          }
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

      // Bird's-eye wide-POV camera tracking (non-draggable, fixed ground pitch from Settings)
      const targetPitchRad = THREE.MathUtils.degToRad(
        THREE.MathUtils.clamp(stateRef.current.cameraAngleDeg ?? 62, 35, 82)
      );
      camPitch = THREE.MathUtils.damp(camPitch, targetPitchRad, 8, delta);
      const camDist = getBirdViewCamDist();

      const targetCamX = playerPhysics.pos.x - Math.sin(camYaw) * (camDist * Math.cos(camPitch));
      const targetCamY = playerPhysics.pos.y + 1.0 + camDist * Math.sin(camPitch);
      const targetCamZ = playerPhysics.pos.z - Math.cos(camYaw) * (camDist * Math.cos(camPitch));

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 10, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 10, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 10, delta);

      _vec3Cam.set(playerPhysics.pos.x, playerPhysics.pos.y + 0.9, playerPhysics.pos.z);
      camera.lookAt(_vec3Cam);

      // Pet Following, Flocking, Independent Combat AI & Personality Animations
      const allPets = stateRef.current.pets;
      const equippedSlotList = stateRef.current.player.equippedSkillSlots;
      const equippedIdSet = new Set(equippedSlotList.filter(Boolean) as string[]);
      const followingPets = equippedSlotList
        .filter((id): id is string => Boolean(id))
        .map((id) => allPets.find((p) => p.id === id && p.unlocked))
        .filter((p): p is PetData => Boolean(p));
      const followingMeshes = followingPets.map((p) => petMeshMap.get(p.id)).filter(Boolean) as PetMeshGroup[];
      let activePetsEngaged = 0;

      // Keep runtime HP map synced with equipped pets & training stat changes
      petCombatSyncTimer += delta;
      syncPetRuntimeCombat(petCombatSyncTimer >= 0.25);
      if (petCombatSyncTimer >= 0.25) petCombatSyncTimer = 0;

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
        let petAiState: PetCombatAIState | null = null;
        let isPetDefeated = false;

        const isPetEquippedFollowing = pet.unlocked && equippedIdSet.has(pet.id);
        const runtimeStatus = isPetEquippedFollowing ? petRuntimeCombatMap.get(pet.id) : undefined;
        isPetDefeated = Boolean(currentLoc === 'wild_grounds' && runtimeStatus?.defeated);

        if (isPetEquippedFollowing) {
          mesh.visible = true;

          // Update 3D floating pet HP bar visibility & fill in Wild Grounds
          const petHpBarGroup = (mesh.userData as any).petHpBarGroup as THREE.Group | undefined;
          const petHpBarFg = (mesh.userData as any).petHpBarForeground as THREE.Mesh | undefined;
          if (petHpBarGroup && petHpBarFg) {
            if (currentLoc === 'wild_grounds' && runtimeStatus) {
              petHpBarGroup.visible = true;
              petHpBarGroup.rotation.y = camYaw;
              const ratio = Math.max(0, Math.min(1, runtimeStatus.currentHp / Math.max(1, runtimeStatus.maxHp)));
              petHpBarFg.scale.x = Math.max(0.001, ratio);
              const barMat = petHpBarFg.material as THREE.MeshBasicMaterial;
              barMat.color.setHex(runtimeStatus.defeated ? 0x6b7280 : ratio < 0.35 ? 0xef4444 : 0x10b981);
            } else {
              petHpBarGroup.visible = false;
            }
          }

          // ========================================================
          // DEFEATED PET STATE (0 HP IN WILD GROUNDS)
          // Immediately stops moving, chasing, attacking & participating
          // until the current wave is cleared.
          // ========================================================
          if (isPetDefeated) {
            const existingAi = petCombatAIMap.get(pet.id);
            if (existingAi) {
              existingAi.isAttacking = false;
              existingAi.currentTargetId = null;
              existingAi.state = 'IDLE';
            }
            petVel.set(0, 0, 0);
            petSpeed = 0;
          } else if (currentLoc === 'wild_grounds' && instanceActive && activeEnemies.length > 0) {
            // ========================================================
            // EQUIPPED PETS - INDEPENDENT COMBAT AI (BASIC ATTACKS ONLY)
            // Uses each pet's individual calculated combat stats.
            // ========================================================
            const petStats = calculatePetStats(pet);
            let petCombatAi = petCombatAIMap.get(pet.id);
            if (!petCombatAi) {
              petCombatAi = {
                state: 'SEARCH_ENEMY',
                currentTargetId: null,
                targetEvalTimer: Math.random() * 0.2,
                attackCooldownTimer: 0.2 + Math.random() * 0.4,
                attackAnimTimer: 0,
                attackTotalDuration: 0.48,
                hasDealtDamage: false,
                isAttacking: false,
              };
              petCombatAIMap.set(pet.id, petCombatAi);
            }
            petAiState = petCombatAi;

            // Step 1: Validate or detect independent combat target
            let petTarget = petCombatAi.currentTargetId
              ? activeEnemies.find((e) => e.id === petCombatAi!.currentTargetId && e.health > 0) || null
              : null;

            if (petTarget) {
              const dPet = mesh.position.distanceTo(petTarget.mesh.position);
              const dPlayer = playerPhysics.pos.distanceTo(petTarget.mesh.position);
              if (dPet > 24 || dPlayer > 26) {
                petTarget = null;
                petCombatAi.currentTargetId = null;
              }
            }

            petCombatAi.targetEvalTimer -= delta;
            if (!petTarget && petCombatAi.targetEvalTimer <= 0) {
              petCombatAi.targetEvalTimer = 0.25;

              const targetCounts = new Map<string, number>();
              petCombatAIMap.forEach((otherAi, otherPetId) => {
                if (otherPetId !== pet.id && otherAi.currentTargetId) {
                  targetCounts.set(otherAi.currentTargetId, (targetCounts.get(otherAi.currentTargetId) || 0) + 1);
                }
              });

              let bestEnemy: ActiveEnemy | null = null;
              let bestScore = Infinity;

              for (const enemy of activeEnemies) {
                if (enemy.health <= 0) continue;
                const dPet = mesh.position.distanceTo(enemy.mesh.position);
                const dPlayer = playerPhysics.pos.distanceTo(enemy.mesh.position);
                if (dPet > 22 || dPlayer > 25) continue;

                const petsAlreadyOnTarget = targetCounts.get(enemy.id) || 0;
                const score = dPet + petsAlreadyOnTarget * 4.5 + (enemy.isBoss ? -3.5 : 0);
                if (score < bestScore) {
                  bestScore = score;
                  bestEnemy = enemy;
                }
              }

              if (bestEnemy) {
                petCombatAi.currentTargetId = bestEnemy.id;
                petTarget = bestEnemy;
                petCombatAi.state = 'APPROACH_TARGET';
              } else {
                petCombatAi.state = 'RETURN_TO_PLAYER';
              }
            }

            // Step 2: Combat Movement and Basic Attack Execution (using calculated petStats)
            const basicCfg = getPetBasicAttackConfig(pet.species);
            const isRanged = basicCfg.isRanged;
            const attackRange = petStats.attackRange;

            if (petTarget) {
              activePetsEngaged++;
              const distToEnemy = mesh.position.distanceTo(petTarget.mesh.position);

              if (distToEnemy > attackRange + 0.25) {
                // APPROACH_TARGET: Move using pet's calculated Move Speed
                petCombatAi.state = 'APPROACH_TARGET';
                _vec3A.subVectors(petTarget.mesh.position, mesh.position);
                _vec3A.y = 0;
                _vec3A.normalize();

                // Separation force from other living pets to avoid clumping
                for (const otherMesh of followingMeshes) {
                  if (otherMesh === mesh) continue;
                  const sepD = mesh.position.distanceTo(otherMesh.position);
                  if (sepD < 1.15 && sepD > 0.01) {
                    _vec3B.subVectors(mesh.position, otherMesh.position).normalize();
                    _vec3A.addScaledVector(_vec3B, 1.1);
                  }
                }
                _vec3A.normalize();

                const approachSpeed = petStats.moveSpeed;
                mesh.position.addScaledVector(_vec3A, approachSpeed * delta);

                const targetAngle = Math.atan2(_vec3A.x, _vec3A.z);
                const rotDiff = THREE.MathUtils.euclideanModulo(targetAngle - mesh.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
                mesh.rotation.y += rotDiff * Math.min(delta * 14, 1);

                petVel.copy(_vec3A).multiplyScalar(approachSpeed);
                petSpeed = approachSpeed;
                distToTarget = distToEnemy;
              } else {
                // BASIC_ATTACK: Stop and perform basic attack using calculated Attack Speed, Crit & Damage
                petCombatAi.state = 'BASIC_ATTACK';
                _vec3A.subVectors(petTarget.mesh.position, mesh.position);
                _vec3A.y = 0;
                if (_vec3A.lengthSq() > 0.01) {
                  _vec3A.normalize();
                  const targetAngle = Math.atan2(_vec3A.x, _vec3A.z);
                  const rotDiff = THREE.MathUtils.euclideanModulo(targetAngle - mesh.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
                  mesh.rotation.y += rotDiff * Math.min(delta * 16, 1);
                }

                petVel.set(0, 0, 0);
                petSpeed = 0;
                distToTarget = distToEnemy;

                if (!petCombatAi.isAttacking) {
                  petCombatAi.attackCooldownTimer -= delta;
                  if (petCombatAi.attackCooldownTimer <= 0) {
                    petCombatAi.isAttacking = true;
                    const scaledAnimDur = Math.min(basicCfg.animDuration, Math.max(0.28, petStats.attackInterval * 0.55));
                    petCombatAi.attackTotalDuration = scaledAnimDur;
                    petCombatAi.attackAnimTimer = scaledAnimDur;
                    petCombatAi.hasDealtDamage = false;
                  }
                } else {
                  petCombatAi.attackAnimTimer -= delta;
                  const progress = THREE.MathUtils.clamp(
                    1.0 - petCombatAi.attackAnimTimer / petCombatAi.attackTotalDuration,
                    0,
                    1
                  );

                  // Strike impact occurs at 38% progress
                  if (progress >= 0.38 && !petCombatAi.hasDealtDamage) {
                    petCombatAi.hasDealtDamage = true;

                    const tomatoBonus = (stateRef.current.player.nourishment?.attackDamagePct || 0) / 100;
                    let finalDmg = petStats.attackDamage * (1 + tomatoBonus);
                    if (petTarget.armorRuptureTimer > 0) finalDmg *= 1.35;

                    const isCrit = Math.random() < petStats.critChance;
                    if (isCrit) {
                      finalDmg *= petStats.critDamage;
                    }
                    finalDmg = Math.max(1, Math.round(finalDmg));

                    petTarget.health -= finalDmg;
                    petTarget.hitFlashTimer = 0.14;
                    const hpPct = Math.max(0, petTarget.health / petTarget.maxHealth);
                    petTarget.healthBarForeground.scale.x = hpPct;

                    if (isRanged) {
                      particleSys.spawnPetAttackProjectile(mesh.position, petTarget.mesh.position, pet.species);
                    } else {
                      particleSys.spawnPetAttackArc(mesh.position, _vec3A, pet.species);
                    }
                    if (isCrit) {
                      particleSys.spawnCritImpact(petTarget.mesh.position);
                      soundEngine.playCritHit();
                    } else {
                      particleSys.spawnPetBasicAttackHit(petTarget.mesh.position, pet.species);
                      soundEngine.playPetBasicAttack(pet.species);
                    }
                    particleSys.spawnDamageNumber(
                      petTarget.mesh.position,
                      finalDmg,
                      isCrit,
                      petTarget.isBoss,
                      isCrit ? 'damage' : 'pet'
                    );

                    // Enemy defeat check
                    if (petTarget.health <= 0) {
                      trackEnemyDefeat(petTarget);
                      particleSys.spawnEnemyDefeat(petTarget.mesh.position);
                      soundEngine.playEnemyDefeat();
                      enemiesGroup.remove(petTarget.mesh);
                      const eIdx = activeEnemies.indexOf(petTarget);
                      if (eIdx >= 0) activeEnemies.splice(eIdx, 1);

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
                        prepCountdown: null,
                      });

                      petCombatAi.currentTargetId = null;
                      petTarget = null;
                    }
                  }

                  if (petCombatAi.attackAnimTimer <= 0) {
                    petCombatAi.isAttacking = false;
                    const pauseInterval = Math.max(0.15, petStats.attackInterval - petCombatAi.attackTotalDuration);
                    petCombatAi.attackCooldownTimer = pauseInterval + Math.random() * 0.06;
                  }
                }
              }
            } else {
              // RETURN_TO_PLAYER: Smoothly return to formation behind player
              petCombatAi.state = 'RETURN_TO_PLAYER';
              const followSlotIdx = followingPets.findIndex((p) => p.id === pet.id);
              const followResult = petFollowingController.updatePetPosition(
                mesh,
                playerPhysics.pos,
                playerPhysics.rotY,
                followSlotIdx >= 0 ? followSlotIdx : 0,
                followingMeshes,
                true,
                delta
              );
              petVel = followResult.velocity;
              petSpeed = followResult.speed;
              distToTarget = followResult.distToTarget;
            }
          } else {
            // Normal formation following outside of active combat
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
          }

          pState.currentSpeed = petSpeed;
          pState.velocity.copy(petVel);
          pState.distToTarget = distToTarget;
        } else if (currentLoc === 'pet_den' && pet.unlocked) {
          // Autonomous Sanctuary AI behavior in Pet Den
          mesh.visible = true;
          const petHpBarGroup = (mesh.userData as any).petHpBarGroup as THREE.Group | undefined;
          if (petHpBarGroup) petHpBarGroup.visible = false;
          let ai = petDenAIMap.get(pet.id);
          if (!ai) {
            ai = pickNewSanctuaryBehavior(pet, mesh.position);
            petDenAIMap.set(pet.id, ai);
            mesh.position.set((Math.random() - 0.5) * 14, 0, (Math.random() - 0.5) * 14);
          }

          ai.timer -= delta;
          if (ai.timer <= 0) {
            ai = pickNewSanctuaryBehavior(pet, mesh.position);
            petDenAIMap.set(pet.id, ai);
          }

          // Execute action
          if (ai.behavior === 'rest') {
            petSpeed = 0;
            petVel.set(0, 0, 0);
          } else if (ai.behavior === 'play') {
            petSpeed = 0.6;
            mesh.rotation.y += delta * 2.8;
            mesh.position.y = Math.abs(Math.sin(((mesh.userData as any).animTime || 0) * 6)) * 0.25;
            petVel.set(0, 0, 0);
          } else {
            // Moving towards ai.targetPos (wander, eat, drink, explore, social)
            const toTarget = new THREE.Vector3().subVectors(ai.targetPos, mesh.position);
            toTarget.y = 0;
            const dist = toTarget.length();
            if (dist > 0.45) {
              toTarget.normalize();
              const step = Math.min(dist, ai.speed * delta);
              mesh.position.addScaledVector(toTarget, step);
              const targetAngle = Math.atan2(toTarget.x, toTarget.z);
              mesh.rotation.y = THREE.MathUtils.damp(mesh.rotation.y, targetAngle, 8, delta);
              petSpeed = ai.speed;
              petVel.copy(toTarget).multiplyScalar(ai.speed);
            } else {
              petSpeed = 0;
              petVel.set(0, 0, 0);
            }
          }
          pState.currentSpeed = petSpeed;
          pState.velocity.copy(petVel);
        } else {
          // Non-following pets reside in the Pet Sanctuary and are hidden on farm/wild grounds
          mesh.visible = false;
          mesh.position.set(0, -100, 0);
          pState.currentSpeed = 0;
          pState.velocity.set(0, 0, 0);
          return;
        }

        // 3D floating name badge visibility and camera facing
        const nameBadge = (mesh.userData as any).nameBadge;
        if (nameBadge) {
          const showBadge = (currentLoc === 'pet_den' && pet.unlocked) || (currentLoc === 'farm' && isPetEquippedFollowing);
          nameBadge.visible = showBadge;
          if (showBadge) {
            nameBadge.lookAt(camera.position);
          }
        }

        // Distance culling for performance: skip micro limb calculations if distant
        const distToCamera = mesh.position.distanceTo(camera.position);
        if (distToCamera < 48.0) {
          if (distToCamera > 22.0 && (loopFrameIndex + overallIdx) % 2 !== 0) {
            // Throttled frame
          } else {
            petAnimator.update(
              mesh,
              {
                petId: pet.id,
                species: pet.species,
                position: mesh.position,
                velocity: petVel,
                speed: petSpeed,
                isGrounded: true,
                isFollowing: isPetEquippedFollowing,
                targetPos: isPetEquippedFollowing ? playerPhysics.pos : (petDenAIMap.get(pet.id)?.targetPos || playerPhysics.pos),
                distToTarget,
                isCastingSkill: pState.isCastingSkill && !isPetDefeated,
                skillPhase: pState.skillPhase,
                skillTimer: pState.skillTimer,
                isTakingDamage: pState.damageTimer > 0,
                damageTimer: pState.damageTimer,
                isStunned: false,
                stunTimer: 0,
                isVictory: isPlayerVictory,
                isDefeat: isPlayerDefeat,
                animTime: mesh.userData.animTime,
                slotIndex: overallIdx,
                isBasicAttacking: !isPetDefeated && (petAiState?.isAttacking || false),
                basicAttackTimer: petAiState?.attackAnimTimer || 0,
                basicAttackTotalDuration: petAiState?.attackTotalDuration || 0.48,
                basicAttackPhase: (petAiState?.attackAnimTimer || 0) > (petAiState?.attackTotalDuration || 0.48) * 0.65
                  ? 'windup'
                  : (petAiState?.attackAnimTimer || 0) > (petAiState?.attackTotalDuration || 0.48) * 0.32
                  ? 'strike'
                  : 'recovery',
                combatState: isPetDefeated ? 'IDLE' : (petAiState?.state || 'FOLLOW_PLAYER'),
                isPetDefeated,
              },
              delta
            );
          }
          // Water ripple & splash interaction when pet enters water
          if (stateRef.current.currentLocation === 'farm' && isPetEquippedFollowing && petSpeed > 0.15) {
            envSystem.checkWaterInteraction([{ id: pet.id, pos: mesh.position, isMoving: true }], particleSys);
          }
        }
      });

      // Report active pets engaged in combat to HUD
      if (currentLoc === 'wild_grounds') {
        stateRef.current.onPetsEngagedChange?.(activePetsEngaged);
      } else {
        stateRef.current.onPetsEngagedChange?.(0);
      }

      // ==========================================
      // WILD GROUNDS INSTANCE BATTLE LOGIC
      // ==========================================
      if (currentLoc === 'wild_grounds' && instanceActive) {
        {
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
                  tickDmg *= 1 + (stateRef.current.player.nourishment?.skillDamagePct || 0) / 100;
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
                    trackEnemyDefeat(enemy);
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
                      prepCountdown: null,
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

          // 1b. Update active Ground Zones (Healing Leaves, Nature's Blessing, Toxic Tongue, Calm Aura)
          for (let zIdx = activeGroundZones.length - 1; zIdx >= 0; zIdx--) {
            const z = activeGroundZones[zIdx];
            z.duration -= delta;
            z.mesh.rotation.y += delta * 1.4;
            z.tickTimer -= delta;

            if (z.tickTimer <= 0) {
              z.tickTimer = z.type === 'poison_zone' ? 0.5 : 1.0;
              if ((z.type === 'heal_zone' || z.type === 'defense_zone') && z.healPerTick && playerPhysics.pos.distanceTo(z.pos) <= z.radius) {
                const healed = applyPlayerHeal(z.healPerTick);
                particleSys.spawnHealingBubbles(playerPhysics.pos);
                particleSys.spawnDamageNumber(playerPhysics.pos, healed, false, false, 'heal');
              } else if (z.type === 'poison_zone' && z.damagePerTick) {
                const skillBonus = 1 + (stateRef.current.player.nourishment?.skillDamagePct || 0) / 100;
                const tickDmg = Math.round(z.damagePerTick * skillBonus);
                for (let eIdx = activeEnemies.length - 1; eIdx >= 0; eIdx--) {
                  const enemy = activeEnemies[eIdx];
                  if (enemy.mesh.position.distanceTo(z.pos) <= z.radius) {
                    enemy.health -= tickDmg;
                    enemy.hitFlashTimer = 0.1;
                    enemy.slowTimer = Math.max(enemy.slowTimer, 0.7);
                    enemy.slowFactor = Math.min(enemy.slowFactor || 1, 0.75);
                    particleSys.spawnPetBasicAttackHit(enemy.mesh.position, 'poison_frog');
                    particleSys.spawnDamageNumber(enemy.mesh.position, tickDmg, false, enemy.isBoss);
                    enemy.healthBarForeground.scale.x = Math.max(0, enemy.health / enemy.maxHealth);
                    if (enemy.health <= 0) {
                      trackEnemyDefeat(enemy);
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
                        prepCountdown: null,
                      });
                    }
                  }
                }
              }
            }

            if (z.duration <= 0) {
              scene.remove(z.mesh);
              z.mesh.traverse((obj) => {
                if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
                if ((obj as THREE.Mesh).material) {
                  const m = (obj as THREE.Mesh).material;
                  if (Array.isArray(m)) m.forEach((x) => x.dispose());
                  else m.dispose();
                }
              });
              activeGroundZones.splice(zIdx, 1);
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

                  trackEnemyDefeat(enemy);
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
                    prepCountdown: null,
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

            // Evaluate enemy combat target: player OR any living participating equipped pet
            enemy.targetEvalTimer -= delta;
            let chosenPetTarget: PetData | null = null;
            if (enemy.targetKind !== 'player') {
              const candStatus = petRuntimeCombatMap.get(enemy.targetKind);
              const candPet = followingPets.find((p) => p.id === enemy.targetKind) || null;
              if (!candStatus || candStatus.defeated || !candPet) {
                enemy.targetKind = 'player';
              } else {
                chosenPetTarget = candPet;
              }
            }

            if (enemy.targetEvalTimer <= 0) {
              enemy.targetEvalTimer = 0.55;
              let bestTargetKind: 'player' | string = 'player';
              let bestDistScore = distToPlayer;
              for (const candPet of followingPets) {
                const candStatus = petRuntimeCombatMap.get(candPet.id);
                if (!candStatus || candStatus.defeated) continue;
                const candMesh = petMeshMap.get(candPet.id);
                if (!candMesh || !candMesh.visible) continue;
                const dCand = ePos.distanceTo(candMesh.position);
                // Slight preference for nearby pets actively engaging in melee/range
                if (dCand < bestDistScore - 0.35) {
                  bestDistScore = dCand;
                  bestTargetKind = candPet.id;
                  chosenPetTarget = candPet;
                }
              }
              enemy.targetKind = bestTargetKind;
              if (bestTargetKind === 'player') chosenPetTarget = null;
            }

            const targetPetMesh = chosenPetTarget ? petMeshMap.get(chosenPetTarget.id) : undefined;
            const targetPos = targetPetMesh ? targetPetMesh.position : playerPhysics.pos;
            const distToTargetPos = ePos.distanceTo(targetPos);

            if (distToTargetPos > attackRange) {
              // Move towards chosen target (player or pet)
              const dir = _vec3A.subVectors(targetPos, ePos).normalize();
              ePos.addScaledVector(dir, moveDelta);
              enemy.mesh.rotation.y = Math.atan2(dir.x, dir.z);

              if (!isDistant) {
                enemy.mesh.position.y = Math.abs(Math.sin(now * 0.008 * effectiveSpeed)) * 0.15;
              } else {
                enemy.mesh.position.y = 0;
              }
            } else {
              // Within attack range: attack chosen target on cooldown
              enemy.attackTimer -= delta;
              enemy.mesh.rotation.y = Math.atan2(targetPos.x - ePos.x, targetPos.z - ePos.z);

              if (enemy.attackTimer <= 0) {
                enemy.attackTimer = enemy.attackCooldown;

                if (chosenPetTarget && targetPetMesh) {
                  // --- ENEMY ATTACKS LIVING PET ---
                  const petStatus = petRuntimeCombatMap.get(chosenPetTarget.id);
                  if (petStatus && !petStatus.defeated) {
                    const petStats = calculatePetStats(chosenPetTarget);
                    const reducedDmg = Math.max(1, Math.round(enemy.damage * (1 - petStats.damageReductionPct)));
                    petStatus.currentHp = Math.max(0, petStatus.currentHp - reducedDmg);

                    const pAnim = petAnimStateMap.get(chosenPetTarget.id);
                    if (pAnim) pAnim.damageTimer = 0.24;

                    particleSys.spawnCombatHit(targetPetMesh.position, 0xff0054);
                    particleSys.spawnDamageNumber(targetPetMesh.position, reducedDmg, false, false);
                    soundEngine.playCombatHit();

                    if (petStatus.currentHp <= 0) {
                      petStatus.currentHp = 0;
                      petStatus.defeated = true;
                      const defeatedAi = petCombatAIMap.get(chosenPetTarget.id);
                      if (defeatedAi) {
                        defeatedAi.isAttacking = false;
                        defeatedAi.currentTargetId = null;
                        defeatedAi.state = 'IDLE';
                      }
                      for (const otherEnemy of activeEnemies) {
                        if (otherEnemy.targetKind === chosenPetTarget.id) {
                          otherEnemy.targetKind = 'player';
                          otherEnemy.targetEvalTimer = 0;
                        }
                      }
                      soundEngine.playPetDefeated();
                      stateRef.current.onShowMessage(`💔 ${chosenPetTarget.name} was defeated! Clear the wave to recover!`);
                    }
                    petStatusDirty = true;
                  } else {
                    enemy.targetKind = 'player';
                  }
                } else {
                  // --- ENEMY ATTACKS PLAYER ---
                  particleSys.spawnCombatHit(playerPhysics.pos, 0xff0054);
                  soundEngine.playCombatHit();

                  outOfCombatDamageTimer = 0;

                  if (playerPhysics.invulnTimer > 0) {
                    continue;
                  }

                  let incomingDmg = enemy.damage;

                  const defenseBonusPct = Math.min(20, stateRef.current.player.nourishment?.defensePct || 0);
                  if (defenseBonusPct > 0) {
                    incomingDmg *= 1 - defenseBonusPct / 100;
                  }

                  const equipped = stateRef.current.player.equippedSkillSlots;

                  // TURTLE PASSIVE: Ocean Armor
                  if (equipped.includes('pet_turtle')) {
                    const turtlePet = stateRef.current.pets.find((p) => p.id === 'pet_turtle');
                    const tLvl = turtlePet?.level || 1;
                    let redPct = (tLvl >= 40 ? 0.30 : tLvl >= 20 ? 0.25 : tLvl >= 10 ? 0.20 : 0.15) * getPassiveMult('pet_turtle');

                    const curHp = stateRef.current.player.health ?? stateRef.current.player.maxHealth ?? 100;
                    const maxHp = stateRef.current.player.maxHealth || 100;
                    const hpRatio = curHp / maxHp;
                    if (hpRatio < 0.5) {
                      const lowHpBonus = (1 - hpRatio / 0.5) * (tLvl >= 30 ? 0.35 : 0.20) * getPassiveMult('pet_turtle');
                      redPct += lowHpBonus;
                    }
                    redPct = Math.min(0.68, redPct);
                    incomingDmg *= 1 - redPct;

                    if (tLvl >= 40) {
                      const reflectDmg = Math.round(enemy.damage * 0.35);
                      enemy.health -= reflectDmg;
                      particleSys.spawnCombatHit(enemy.mesh.position, 0x38bdf8);
                      soundEngine.playShieldAbsorb();
                      const pct = Math.max(0, enemy.health / enemy.maxHealth);
                      enemy.healthBarForeground.scale.x = pct;
                      if (enemy.health <= 0) {
                        trackEnemyDefeat(enemy);
                        particleSys.spawnEnemyDefeat(ePos);
                        soundEngine.playEnemyDefeat();
                        enemiesGroup.remove(enemy.mesh);
                        activeEnemies.splice(eIdx, 1);
                        continue;
                      }
                    }
                  }

                  // BEAR PASSIVE: Unyielding
                  if (equipped.includes('pet_bear')) {
                    const bearPet = stateRef.current.pets.find((p) => p.id === 'pet_bear');
                    const bLvl = bearPet?.level || 1;
                    const stackReduction = (bLvl >= 20 ? 0.10 : bLvl >= 10 ? 0.08 : 0.06) * getPassiveMult('pet_bear');
                    const totalFortReduction = Math.min(0.55, fortitudeStacks * stackReduction);
                    incomingDmg *= 1 - totalFortReduction;

                    fortitudeStacks = Math.min(5, fortitudeStacks + 1);
                    fortitudeTimer = 5.0;
                  }

                  // SYLVAN DEER PASSIVE: Forest Guardian
                  if (equipped.includes('pet_sylvan_deer')) {
                    const deerPet = stateRef.current.pets.find((p) => p.id === 'pet_sylvan_deer');
                    const dLvl = deerPet?.level || 1;
                    const deerDef = Math.min(0.55, (dLvl >= 50 ? 0.34 : dLvl >= 30 ? 0.24 : dLvl >= 10 ? 0.16 : 0.12) * getPassiveMult('pet_sylvan_deer'));
                    incomingDmg *= 1 - deerDef;
                  }

                  // POISON FROG PASSIVE: Poison Resistance
                  if (equipped.includes('pet_poison_frog')) {
                    const pfPet = stateRef.current.pets.find((p) => p.id === 'pet_poison_frog');
                    const pfLvl = pfPet?.level || 1;
                    const poisRed = Math.min(0.42, (pfLvl >= 50 ? 0.25 : pfLvl >= 20 ? 0.18 : 0.12) * getPassiveMult('pet_poison_frog'));
                    incomingDmg *= 1 - poisRed;
                  }

                  // HEDGEHOG PASSIVE: Thorny Hide
                  if (equipped.includes('pet_hedgehog') && distToPlayer <= 3.5) {
                    const hhPet = stateRef.current.pets.find((p) => p.id === 'pet_hedgehog');
                    const hhLvl = hhPet?.level || 1;
                    const hhDef = Math.min(0.55, (hhLvl >= 50 ? 0.34 : hhLvl >= 30 ? 0.25 : hhLvl >= 10 ? 0.2 : 0.15) * getPassiveMult('pet_hedgehog'));
                    incomingDmg *= 1 - hhDef;
                    const thornReflect = Math.round(enemy.damage * (hhLvl >= 40 ? 0.35 : 0.2));
                    enemy.health -= thornReflect;
                    particleSys.spawnCombatHit(enemy.mesh.position, 0xd6d3d1);
                    enemy.healthBarForeground.scale.x = Math.max(0, enemy.health / enemy.maxHealth);
                    if (enemy.health <= 0) {
                      trackEnemyDefeat(enemy);
                      particleSys.spawnEnemyDefeat(ePos);
                      soundEngine.playEnemyDefeat();
                      enemiesGroup.remove(enemy.mesh);
                      activeEnemies.splice(eIdx, 1);
                    }
                  }

                  // Active Protective Zone Damage Reduction
                  for (const z of activeGroundZones) {
                    if (z.type === 'defense_zone' && z.damageReductionPct && playerPhysics.pos.distanceTo(z.pos) <= z.radius) {
                      incomingDmg *= 1 - z.damageReductionPct;
                      break;
                    }
                  }

                  // Shield absorbs damage first
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
                      const nextHp = curHp - incomingDmg;

                      if (nextHp <= 0) {
                        const bearPet = stateRef.current.pets.find((p) => p.id === 'pet_bear');
                        if (equipped.includes('pet_bear') && (bearPet?.level || 1) >= 50 && !bearCheatDeathUsed) {
                          bearCheatDeathUsed = true;
                          playerPhysics.invulnTimer = 3.5;
                          soundEngine.playBossRoar();
                          stateRef.current.onShowMessage('🐻 JUGGERNAUT COLOSSUS! Withstood lethal hit with 3.5s Invulnerability!');
                          return { ...prev, health: 1 };
                        }

                        const slimePet = stateRef.current.pets.find((p) => p.id === 'pet_slime');
                        if (equipped.includes('pet_slime') && (slimePet?.level || 1) >= 50 && !slimeCheatDeathUsed) {
                          slimeCheatDeathUsed = true;
                          playerPhysics.invulnTimer = 2.0;
                          soundEngine.playArcaneBurst();
                          particleSys.spawnArcaneNova(playerPhysics.pos, 5.0);
                          stateRef.current.onShowMessage('🧪 MITOSIS REVIVAL! Boba divided and restored 35% HP!');
                          return { ...prev, health: Math.round((prev.maxHealth || 100) * 0.35) };
                        }

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
            stateRef.current.onMissionEvent?.('complete_wave', 1);
            stateRef.current.onMissionEvent?.('earn_coins', 25);

            // Wave-clear pet recovery: immediately restore ALL living & defeated participating pets to full HP
            let revivedCount = 0;
            petRuntimeCombatMap.forEach((status, pId) => {
              const pData = stateRef.current.pets.find((p) => p.id === pId);
              if (pData) {
                status.maxHp = calculatePetStats(pData).maxHp;
              }
              if (status.defeated) revivedCount++;
              status.currentHp = status.maxHp;
              status.defeated = false;
              const ai = petCombatAIMap.get(pId);
              if (ai) {
                ai.isAttacking = false;
                ai.currentTargetId = null;
                ai.state = 'RETURN_TO_PLAYER';
              }
              const pMesh = petMeshMap.get(pId);
              if (pMesh && pMesh.visible) {
                pMesh.rotation.z = 0;
                pMesh.scale.set(1, 1, 1);
                particleSys.spawnHealingBubbles(pMesh.position);
                particleSys.spawnDamageNumber(pMesh.position, status.maxHp, false, false, 'heal');
              }
            });
            petStatusDirty = true;
            syncPetRuntimeCombat(true);

            if (currentWaveIndex < 9) {
              // Immediately spawn next wave (no countdown)
              const clearedWaveNum = currentWaveIndex + 1;
              currentWaveIndex++;
              const nextWaveNum = currentWaveIndex + 1;
              const nextConfig = INSTANCE_WAVES[currentWaveIndex] || INSTANCE_WAVES[0];
              soundEngine.playLevelUp();
              const reviveSuffix = revivedCount > 0 ? ` 💚 ${revivedCount} pet(s) revived!` : ' 💚 Pets recovered!';
              spawnWave(
                nextWaveNum,
                `🎉 Wave ${clearedWaveNum} Cleared! +${completedWaveConfig.essenceReward} Essence${reviveSuffix} — ⚔️ Wave ${nextWaveNum}: ${nextConfig.title}!`
              );
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
              const cropDef = CROPS[plot.cropId];
              const growSec = Math.max(10, cropDef?.growTimeSeconds || 20);
              const expMult = 1 + Math.max(0, (stateRef.current.player.farmExpansionLevel || 1) - 1) * 0.15;
              const growthRate = (plot.watered ? 1.0 / growSec : 0.25 / growSec) * expMult;
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

        // 2. Check Pet Training Station (-2.0, 0, 14.0)
        const distToTrainingStation = Math.hypot(-2.0 - pPos.x, 14.0 - pPos.z);
        const nearTrainingNow = distToTrainingStation < 5.0;
        if (nearTrainingNow !== wasNearTrainingStation) {
          wasNearTrainingStation = nearTrainingNow;
          stateRef.current.onNearTrainingStationChange?.(nearTrainingNow);
        }
        if (!prompt && nearTrainingNow) {
          prompt = {
            text: '🏋️ Open Pet Training Station',
            action: () => stateRef.current.onOpenTrainingStation?.(),
          };
        }

        // 3. Check Pet Den Sanctuary Building (13.5, 0, 0)
        if (!prompt) {
          const distToPetDen = Math.hypot(13.5 - pPos.x, 0 - pPos.z);
          if (distToPetDen < 4.8) {
            prompt = {
              text: '🏡 Enter Pet Den (Sanctuary)',
              action: () => stateRef.current.onEnterPetDen?.(),
            };
          }
        }

        // 3. Check Barnaby's Seed Stall (7, 0, -2)
        if (!prompt) {
          const distToStall = Math.hypot(7 - pPos.x, -2 - pPos.z);
          if (distToStall < 3.2) {
            prompt = {
              text: 'Talk to Shopkeeper (Seeds)',
              action: () => stateRef.current.onOpenSeedShop(),
            };
          }
        }

        // 4. Check Farm Plots
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
                    const cropDef = CROPS[crop];
                    const harvestCoins = cropDef ? Math.max(20, Math.round(cropDef.seedPrice * 0.2)) : 20;
                    const updated = stateRef.current.farmPlots.map((p) =>
                      p.id === plot.id ? { ...p, cropId: null, plantedAt: null, growProgress: 0, isHarvested: true } : p
                    );
                    stateRef.current.onUpdatePlots(updated);
                    rebuildFarmPlotMeshes(updated);
                    stateRef.current.onAddInventory(crop, 1);
                    stateRef.current.onUpdatePlayer((prev) => ({ ...prev, gold: prev.gold + harvestCoins }));
                    const harvestPos = new THREE.Vector3(plot.x, 0.4, plot.z);
                    particleSys.spawnHarvestPop(harvestPos, 0xffd166);
                    particleSys.spawnHarvestBurst(harvestPos);
                    const itemMesh = createHarvestItemMesh(crop);
                    particleSys.spawnHarvestFlyItem(harvestPos, playerPhysics.pos, itemMesh);
                    particleSys.spawnDamageNumber(harvestPos, `+1 ${cropDef?.name || crop.toUpperCase()} (+${harvestCoins} Gold)`, false, false, 'heal');
                    soundEngine.playHarvest();
                    stateRef.current.onShowMessage(`Harvested ${cropDef?.name || crop}! (+${harvestCoins} Coins)`);
                    stateRef.current.onMissionEvent?.('harvest_crop', 1, String(plot.id));
                    stateRef.current.onMissionEvent?.('earn_farm_coins', harvestCoins);
                    stateRef.current.onMissionEvent?.('earn_coins', harvestCoins);
                    const equippedHarvestIds = new Set(
                      stateRef.current.player.equippedSkillSlots.filter(Boolean) as string[]
                    );
                    const followingCount = stateRef.current.pets.filter(
                      (p) => p.unlocked && equippedHarvestIds.has(p.id)
                    ).length;
                    if (followingCount > 0) {
                      stateRef.current.onMissionEvent?.('gain_pet_exp', followingCount * 25);
                    }

                    stateRef.current.onUpdatePets((prev) =>
                      prev.map((pet) => {
                        if (pet.unlocked && equippedHarvestIds.has(pet.id)) {
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

        // 5. Check Pets in Farm
        if (!prompt) {
          for (const pet of stateRef.current.pets) {
            if (!pet.unlocked) continue;
            const mesh = petMeshMap.get(pet.id);
            if (mesh && mesh.visible && mesh.position.distanceTo(pPos) < 2.5) {
              prompt = {
                text: `Interact with ${pet.name}`,
                action: () => stateRef.current.onOpenPetInteraction?.(pet.id),
              };
              break;
            }
          }
        }

        // 6. Check Well
        if (!prompt && Math.hypot(well.position.x - pPos.x, well.position.z - pPos.z) < 2.5) {
          prompt = {
            text: 'Draw Fresh Water',
            action: () => {
              soundEngine.playWaterSplash();
              stateRef.current.onShowMessage('Water bucket refilled with fresh spring water!');
            },
          };
        }

        // 7. Check Farmhouse
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
      } else if (currentLoc === 'pet_den') {
        const pPos = playerPhysics.pos;
        let prompt: { text: string; action: () => void } | null = null;

        // 1. Check Return Archway to Farm (0, 0, -14.5)
        const distToReturn = Math.hypot(0 - pPos.x, -14.5 - pPos.z);
        if (distToReturn < 3.4) {
          prompt = {
            text: 'Return to Farm',
            action: () => stateRef.current.onLeavePetDen?.(),
          };
        }

        // 2. Check Sanctuary Pets
        if (!prompt) {
          for (const pet of stateRef.current.pets) {
            if (!pet.unlocked) continue;
            const mesh = petMeshMap.get(pet.id);
            if (mesh && mesh.position.distanceTo(pPos) < 2.5) {
              prompt = {
                text: `Interact with ${pet.name}`,
                action: () => stateRef.current.onOpenPetInteraction?.(pet.id),
              };
              break;
            }
          }
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
