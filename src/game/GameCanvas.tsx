import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PetData, FarmPlotState, PlayerStats } from '../types/game';
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
}

// Math helpers pre-allocated at module scope to avoid GC inside render loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3Cam = new THREE.Vector3();

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
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

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
  ]);

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
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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
    sunLight.castShadow = !isSoftwareGl;
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

    // Particle System
    const particleSys = new ParticleSystem();
    scene.add(particleSys.group);

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
    const riverGeo = new THREE.PlaneGeometry(10, 40, 8, 8);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    const river = new THREE.Mesh(riverGeo, riverMat);
    river.rotation.x = -Math.PI / 2;
    river.rotation.z = 0.15;
    river.position.set(16, 0.02, 0);
    river.receiveShadow = true;
    farmEnvironmentGroup.add(river);

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
    const pondRim = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.0, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0x8d99ae, roughness: 0.9 }));
    pondRim.position.y = 0.2;
    const pondWater = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.2, 12), new THREE.MeshStandardMaterial({ color: 0x48cae4, transparent: true, opacity: 0.85 }));
    pondWater.position.y = 0.3;
    turtlePond.add(pondRim, pondWater);
    farmEnvironmentGroup.add(turtlePond);

    // --- SEED SHOPKEEPER STALL ON FARM ---
    const seedStall = createSeedStall();
    seedStall.position.set(7, 0, -2);
    seedStall.rotation.y = -Math.PI / 4;
    farmEnvironmentGroup.add(seedStall);

    // --- PORTAL TO WILD GROUNDS ON FARM ---
    const { group: portalGroup, vortex: portalVortex } = createPortalArch();
    portalGroup.position.set(-12, 0, -10);
    portalGroup.rotation.y = Math.PI / 6;
    farmEnvironmentGroup.add(portalGroup);

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
          const cropMesh = createCropMesh(plot.cropId, plot.growProgress);
          cropMesh.position.y = 0.15;
          cropGroup.add(cropMesh);
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

    const playerPhysics = {
      pos: new THREE.Vector3(0, 0, 0),
      rotY: 0,
      velY: 0,
      isGrounded: true,
      walkCycle: 0,
      speedBoostTimer: 0,
      dashDir: new THREE.Vector3(0, 0, 0),
      shield: 0,
      invulnTimer: 0,
    };

    // Camera variables
    let camYaw = Math.PI;
    let camPitch = 0.32;
    const camDist = 9.5;

    // Follower Pet Meshes
    const petMeshMap = new Map<string, PetMeshGroup>();
    stateRef.current.pets.forEach((pet) => {
      const petMesh = createPetModel(pet.species);
      petMesh.position.set(Math.random() * 4 - 2, 0, Math.random() * 4 - 2);
      scene.add(petMesh);
      petMeshMap.set(pet.id, petMesh);
    });

    // Touch controls listeners for mobile camera drag
    let touchStartX = 0;
    let touchStartY = 0;
    let isDraggingCam = false;

    const dom = renderer.domElement;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1 && e.touches[0].clientX > window.innerWidth * 0.45) {
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
      camPitch = Math.max(0.12, Math.min(0.85, camPitch - dy * 0.005));
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = () => {
      isDraggingCam = false;
    };

    dom.addEventListener('touchstart', handleTouchStart, { passive: true });
    dom.addEventListener('touchmove', handleTouchMove, { passive: true });
    dom.addEventListener('touchend', handleTouchEnd, { passive: true });
    dom.addEventListener('touchcancel', handleTouchEnd, { passive: true });

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
      const pPos = playerPhysics.pos;
      const inWild = stateRef.current.currentLocation === 'wild_grounds';
      const pet = stateRef.current.pets.find((p) => p.id === petId);
      const level = pet?.level || 1;

      // Combat damage helper: applies damage to all enemies within radius
      const dealDamageInRadius = (center: THREE.Vector3, radius: number, dmg: number) => {
        if (!inWild) return;
        for (let i = activeEnemies.length - 1; i >= 0; i--) {
          const enemy = activeEnemies[i];
          const dist = enemy.mesh.position.distanceTo(center);
          if (dist <= radius) {
            enemy.health -= dmg;
            particleSys.spawnCombatHit(enemy.mesh.position, 0xff0054);
            soundEngine.playCombatHit();

            // Update health bar scale
            const pct = Math.max(0, enemy.health / enemy.maxHealth);
            enemy.healthBarForeground.scale.x = pct;

            // Knockback slightly away from center
            const kb = _vec3A.subVectors(enemy.mesh.position, center).normalize().multiplyScalar(0.8);
            enemy.mesh.position.add(kb);

            // Defeated check
            if (enemy.health <= 0) {
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
      };

      if (petId === 'pet_fox') {
        // Flame Dash: dashes forward leaving radiant trail, damages enemies, speeds up crops
        soundEngine.playFlameDash();
        playerPhysics.speedBoostTimer = 3.0;
        particleSys.spawnFlameTrail(pPos);
        stateRef.current.onShowMessage('Ember activated Flame Dash! (+75% speed boost & 85 damage)');
        dealDamageInRadius(pPos, 5.0, 85 + level * 10);

        if (!inWild) {
          const currentPlots = [...stateRef.current.farmPlots];
          let boosted = false;
          currentPlots.forEach((plot) => {
            const dist = Math.hypot(plot.x - pPos.x, plot.z - pPos.z);
            if (dist < 4.5 && plot.cropId && plot.growProgress < 1.0) {
              plot.growProgress = Math.min(1.0, plot.growProgress + 0.35);
              boosted = true;
            }
          });
          if (boosted) {
            stateRef.current.onUpdatePlots(currentPlots);
            rebuildFarmPlotMeshes(currentPlots);
          }
        }
      } else if (petId === 'pet_turtle') {
        // Water Shield: hydro sphere waters crops, shields player, damages nearby foes
        soundEngine.playWaterShield();
        particleSys.spawnWaterBurst(pPos, 6.0);
        playerPhysics.shield = 50 + level * 8;
        dealDamageInRadius(pPos, 6.0, 50 + level * 8);
        stateRef.current.onShowMessage('Shelly cast Water Shield! Shield active & surrounding foes splashed.');

        if (!inWild) {
          const currentPlots = stateRef.current.farmPlots.map((plot) => {
            const dist = Math.hypot(plot.x - pPos.x, plot.z - pPos.z);
            if (dist <= 6.5 && plot.tilled) {
              return { ...plot, watered: true, waterLevel: 1.0 };
            }
            return plot;
          });
          stateRef.current.onUpdatePlots(currentPlots);
          rebuildFarmPlotMeshes(currentPlots);
        }
      } else if (petId === 'pet_rabbit') {
        // Swift Leap: giant harvest jump stomps enemies on landing
        soundEngine.playSwiftLeap();
        playerPhysics.velY = 13.5;
        playerPhysics.isGrounded = false;
        stateRef.current.onShowMessage('Hoppy activated Swift Leap! Ground stomp attack.');

        setTimeout(() => {
          dealDamageInRadius(playerPhysics.pos, 5.5, 70 + level * 8);

          if (!inWild) {
            const currentPlots = [...stateRef.current.farmPlots];
            let harvestCount = 0;
            currentPlots.forEach((plot) => {
              const dist = Math.hypot(plot.x - playerPhysics.pos.x, plot.z - playerPhysics.pos.z);
              if (dist < 5.0 && plot.cropId && plot.growProgress >= 1.0) {
                const crop = plot.cropId;
                plot.cropId = null;
                plot.plantedAt = null;
                plot.growProgress = 0;
                stateRef.current.onAddInventory(crop, 2);
                stateRef.current.onUpdatePlayer((prev) => ({ ...prev, gold: prev.gold + 25 }));
                particleSys.spawnHarvestBurst(new THREE.Vector3(plot.x, 0.5, plot.z));
                harvestCount++;
              }
            });
            if (harvestCount > 0) {
              soundEngine.playHarvest();
              stateRef.current.onUpdatePlots(currentPlots);
              rebuildFarmPlotMeshes(currentPlots);
              stateRef.current.onShowMessage(`Swift Leap harvested ${harvestCount} crops!`);
            }
          }
        }, 550);
      } else if (petId === 'pet_owl') {
        // Wind Gust: knocks back enemies & pollinates crops
        soundEngine.playWindGust();
        _vec3A.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerPhysics.rotY);
        particleSys.spawnWindGust(pPos, _vec3A);
        dealDamageInRadius(pPos, 7.0, 55 + level * 7);
        stateRef.current.onShowMessage('Barnaby summoned Wind Gust! Enemies knocked back.');

        if (!inWild) {
          const currentPlots = [...stateRef.current.farmPlots];
          currentPlots.forEach((plot) => {
            if (plot.cropId && plot.growProgress < 1.0) {
              plot.growProgress = Math.min(1.0, plot.growProgress + 0.25);
            }
          });
          stateRef.current.onUpdatePlots(currentPlots);
          rebuildFarmPlotMeshes(currentPlots);

          const seedTypes = ['seed_strawberry', 'seed_tomato', 'seed_carrot'];
          const randomSeed = seedTypes[Math.floor(Math.random() * seedTypes.length)];
          stateRef.current.onAddInventory(randomSeed, 2);
        }
      } else if (petId === 'pet_bear') {
        // Ground Slam: heavy seismic shockwave deal massive damage
        soundEngine.playGroundSlam();
        particleSys.spawnGroundSlam(pPos, 7.0);
        dealDamageInRadius(pPos, 7.5, 110 + level * 15);
        stateRef.current.onShowMessage('Grizz unleashed Ground Slam! Seismic shockwave hits all foes.');

        if (!inWild) {
          const currentPlots = stateRef.current.farmPlots.map((plot) => {
            const dist = Math.hypot(plot.x - pPos.x, plot.z - pPos.z);
            if (dist <= 6.5) return { ...plot, tilled: true };
            return plot;
          });
          stateRef.current.onUpdatePlots(currentPlots);
          rebuildFarmPlotMeshes(currentPlots);

          const distToQuarry = Math.hypot(23 - pPos.x, -8 - pPos.z);
          if (distToQuarry < 8) {
            stateRef.current.onAddInventory('stone', 8);
            stateRef.current.onShowMessage('Quarry mined: +8 Stone!');
          }
        }
      } else if (petId === 'pet_slime') {
        // Healing Bubble: restores player HP and heals pets
        soundEngine.playHealingBubble();
        particleSys.spawnHealingBubbles(pPos);
        const healAmt = 45 + level * 5;
        stateRef.current.onUpdatePlayer((prev) => ({
          ...prev,
          health: Math.min(prev.maxHealth || 100, (prev.health ?? prev.maxHealth ?? 100) + healAmt),
        }));
        dealDamageInRadius(pPos, 5.0, 35);
        stateRef.current.onShowMessage(`Boba used Healing Bubble! Restored +${healAmt} HP!`);

        stateRef.current.onUpdatePets((prev) =>
          prev.map((p) => ({ ...p, happiness: 100, hunger: 100 }))
        );
      } else if (petId === 'pet_frog') {
        soundEngine.playWaterSplash();
        particleSys.spawnWaterBurst(pPos, 5.0);
        dealDamageInRadius(pPos, 5.5, 65 + level * 8);
        stateRef.current.onShowMessage('Puddles used Splash Hop! Tidal wave strikes foes.');
      } else if (petId === 'pet_wolf') {
        soundEngine.playBossRoar();
        particleSys.spawnGroundSlam(pPos, 6.0);
        playerPhysics.speedBoostTimer = 4.0;
        dealDamageInRadius(pPos, 6.5, 80 + level * 10);
        stateRef.current.onShowMessage('Shadow howled! Enemies intimidated and speed boosted.');
      } else if (petId === 'pet_deer') {
        soundEngine.playSwiftLeap();
        playerPhysics.speedBoostTimer = 4.0;
        stateRef.current.onUpdatePlayer((prev) => ({
          ...prev,
          health: Math.min(prev.maxHealth || 100, (prev.health ?? 100) + 30),
        }));
        dealDamageInRadius(pPos, 5.0, 50);
        stateRef.current.onShowMessage('Fawn sprinted forward! Restored +30 HP & speed boosted.');
      } else if (petId === 'pet_dragon') {
        soundEngine.playBossRoar();
        particleSys.spawnFlameTrail(pPos);
        particleSys.spawnGroundSlam(pPos, 8.5);
        dealDamageInRadius(pPos, 8.5, 180 + level * 25);
        stateRef.current.onShowMessage('Ignis unleashed Inferno Nova! Massive 180 damage blast!');
      } else if (petId === 'pet_phoenix') {
        soundEngine.playVictory();
        particleSys.spawnHealingBubbles(pPos);
        particleSys.spawnWaterBurst(pPos, 8.0);
        stateRef.current.onUpdatePlayer((prev) => ({ ...prev, health: prev.maxHealth || 100 }));
        dealDamageInRadius(pPos, 8.0, 160 + level * 20);
        stateRef.current.onShowMessage('Solara summoned Solar Flare! 100% HP Revive & Holy Blast!');
      }
    }

    // Main tick loop
    function tick() {
      const delta = Math.min(clock.getDelta(), 0.1);
      const now = Date.now();

      // Check for location change (Farm <-> Wild Grounds)
      const currentLoc = stateRef.current.currentLocation;
      if (currentLoc !== lastLocation) {
        lastLocation = currentLoc;
        if (currentLoc === 'wild_grounds') {
          farmEnvironmentGroup.visible = false;
          instanceEnvironmentGroup.visible = true;
          playerPhysics.pos.set(0, 0, 0);
          playerPhysics.rotY = 0;
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
          scene.background = new THREE.Color(skyColor);
          scene.fog = new THREE.Fog(skyColor, 35, 105);
          sunLight.color.setHex(0xfffae0);
          hemiLight.color.setHex(0xe0f2fe);
        }
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

      // Portal energy vortex rotation
      portalVortex.rotation.z += delta * 1.5;

      // Update particle effects
      particleSys.update(delta);

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

        // Animate legs and arms walking
        playerPhysics.walkCycle += delta * moveSpeed * 2.2;
        const legAngle = Math.sin(playerPhysics.walkCycle) * 0.6;
        if (playerMesh.userData.leftLeg) playerMesh.userData.leftLeg.rotation.x = legAngle;
        if (playerMesh.userData.rightLeg) playerMesh.userData.rightLeg.rotation.x = -legAngle;
        if (playerMesh.userData.leftArm) playerMesh.userData.leftArm.rotation.x = -legAngle * 0.8;
        if (playerMesh.userData.rightArm) playerMesh.userData.rightArm.rotation.x = legAngle * 0.8;
        if (playerMesh.userData.torso) playerMesh.userData.torso.position.y = 0.72 + Math.abs(Math.sin(playerPhysics.walkCycle * 2)) * 0.04;

        // Footstep audio
        footstepTimer += delta;
        if (footstepTimer > 0.32) {
          soundEngine.playFootstep();
          footstepTimer = 0;
        }
      } else {
        // Idle animation
        playerPhysics.walkCycle += delta * 1.5;
        const breath = Math.sin(playerPhysics.walkCycle) * 0.03;
        if (playerMesh.userData.leftLeg) playerMesh.userData.leftLeg.rotation.x *= 0.8;
        if (playerMesh.userData.rightLeg) playerMesh.userData.rightLeg.rotation.x *= 0.8;
        if (playerMesh.userData.leftArm) playerMesh.userData.leftArm.rotation.x *= 0.8;
        if (playerMesh.userData.rightArm) playerMesh.userData.rightArm.rotation.x *= 0.8;
        if (playerMesh.userData.torso) playerMesh.userData.torso.position.y = 0.72 + breath;
      }

      // Jumping & Gravity
      if (!playerPhysics.isGrounded) {
        playerPhysics.velY -= 24 * delta;
        playerPhysics.pos.y += playerPhysics.velY * delta;
        if (playerPhysics.pos.y <= 0) {
          playerPhysics.pos.y = 0;
          playerPhysics.velY = 0;
          playerPhysics.isGrounded = true;
        }
      }

      playerMesh.position.copy(playerPhysics.pos);
      playerMesh.rotation.y = playerPhysics.rotY;

      // Third-person camera tracking
      const targetCamX = playerPhysics.pos.x - Math.sin(camYaw) * (camDist * Math.cos(camPitch));
      const targetCamY = playerPhysics.pos.y + 1.2 + camDist * Math.sin(camPitch);
      const targetCamZ = playerPhysics.pos.z - Math.cos(camYaw) * (camDist * Math.cos(camPitch));

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 10, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 10, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 10, delta);

      _vec3Cam.set(playerPhysics.pos.x, playerPhysics.pos.y + 1.2, playerPhysics.pos.z);
      camera.lookAt(_vec3Cam);

      // Pet Following/Wandering
      stateRef.current.pets.forEach((pet) => {
        const mesh = petMeshMap.get(pet.id);
        if (!mesh) return;

        mesh.userData.animTime += delta;
        const anim = mesh.userData.animTime;

        if (pet.isFollowing) {
          const distToPlayer = mesh.position.distanceTo(playerPhysics.pos);
          const idealDist = 2.4;

          if (distToPlayer > idealDist) {
            const dir = _vec3A.subVectors(playerPhysics.pos, mesh.position).normalize();
            mesh.position.addScaledVector(dir, Math.min(moveSpeed * 1.1, distToPlayer * 3.5) * delta);
            mesh.rotation.y = Math.atan2(dir.x, dir.z);

            const trot = Math.sin(anim * 12);
            if (mesh.userData.legs) {
              mesh.userData.legs.forEach((leg, idx) => {
                leg.rotation.x = trot * (idx % 2 === 0 ? 0.6 : -0.6);
              });
            }
            if (mesh.userData.tail) mesh.userData.tail.rotation.y = Math.sin(anim * 14) * 0.5;
            if (mesh.userData.wings) {
              mesh.userData.wings[0].rotation.z = -Math.abs(Math.sin(anim * 12)) * 0.8;
              mesh.userData.wings[1].rotation.z = Math.abs(Math.sin(anim * 12)) * 0.8;
            }
          } else {
            if (mesh.userData.legs) mesh.userData.legs.forEach((leg) => (leg.rotation.x *= 0.8));
            if (mesh.userData.tail) mesh.userData.tail.rotation.y = Math.sin(anim * 4) * 0.2;
            mesh.position.y = Math.sin(anim * 2.5) * 0.04;
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
          // Enemies AI update
          for (const enemy of activeEnemies) {
            const ePos = enemy.mesh.position;
            const distToPlayer = ePos.distanceTo(playerPhysics.pos);
            const attackRange = enemy.isBoss ? 2.6 : 1.7;

            if (distToPlayer > attackRange) {
              // Move towards player
              const dir = _vec3A.subVectors(playerPhysics.pos, ePos).normalize();
              ePos.addScaledVector(dir, enemy.speed * delta);
              enemy.mesh.rotation.y = Math.atan2(dir.x, dir.z);

              // Lunge / run bounce
              enemy.mesh.position.y = Math.abs(Math.sin(now * 0.008 * enemy.speed)) * 0.15;
            } else {
              // Within attack range: attack player on cooldown
              enemy.attackTimer -= delta;
              enemy.mesh.rotation.y = Math.atan2(playerPhysics.pos.x - ePos.x, playerPhysics.pos.z - ePos.z);

              if (enemy.attackTimer <= 0) {
                enemy.attackTimer = enemy.attackCooldown;
                // Attack animation (lunge forward & back)
                particleSys.spawnCombatHit(playerPhysics.pos, 0xff0054);
                soundEngine.playCombatHit();

                // Shield absorbs damage first
                let incomingDmg = enemy.damage;
                if (playerPhysics.shield > 0) {
                  const absorbed = Math.min(playerPhysics.shield, incomingDmg);
                  playerPhysics.shield -= absorbed;
                  incomingDmg -= absorbed;
                }

                if (incomingDmg > 0) {
                  stateRef.current.onUpdatePlayer((prev) => {
                    const nextHp = Math.max(0, (prev.health ?? prev.maxHealth ?? 100) - incomingDmg);
                    if (nextHp <= 0) {
                      // Player defeat!
                      instanceActive = false;
                      soundEngine.playDefeat();
                      stateRef.current.onInstanceDefeat({
                        wavesCleared: currentWaveIndex,
                        essenceEarned: waveClearedSummary.essenceEarned,
                        goldEarned: waveClearedSummary.goldEarned,
                      });
                    }
                    return { ...prev, health: nextHp };
                  });
                }
              }
            }

            // Health bar billboard faces camera
            const hb = enemy.mesh.children.find((c) => c !== enemy.mesh.children[0]);
            if (hb) hb.rotation.y = camYaw;
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
        if (distToPortal < 3.5) {
          prompt = {
            text: 'Enter Wild Grounds (Portal)',
            action: () => stateRef.current.onOpenPortalModal(),
          };
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
                    const updated = stateRef.current.farmPlots.map((p) => (p.id === plot.id ? { ...p, tilled: true } : p));
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
                      p.id === plot.id ? { ...p, cropId: null, plantedAt: null, growProgress: 0 } : p
                    );
                    stateRef.current.onUpdatePlots(updated);
                    rebuildFarmPlotMeshes(updated);
                    stateRef.current.onAddInventory(crop, 1);
                    stateRef.current.onUpdatePlayer((prev) => ({ ...prev, gold: prev.gold + 20 }));
                    particleSys.spawnHarvestBurst(new THREE.Vector3(plot.x, 0.5, plot.z));
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

      particleSys.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full overflow-hidden select-none" />;
};
