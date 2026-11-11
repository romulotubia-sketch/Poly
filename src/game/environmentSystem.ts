import * as THREE from 'three';
import { ParticleSystem } from './particleSystem';
import { soundEngine } from '../audio/soundEngine';

export type TimePhase = 'morning' | 'day' | 'sunset' | 'night';

export interface DayNightKeyframe {
  skyColor: THREE.Color;
  fogColor: THREE.Color;
  sunColor: THREE.Color;
  sunIntensity: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  sunElevation: number;
  sunAzimuth: number;
}

// Reusable zero-GC color & vector math helpers
const _tempColorA = new THREE.Color();
const _tempColorB = new THREE.Color();
const _tempColorC = new THREE.Color();
const _tempVec3 = new THREE.Vector3();

export class EnvironmentSystem {
  public scene: THREE.Scene;
  public sunLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public isSoftwareGl: boolean;

  // Day/Night cycle
  public timeOfDay = 0.35; // 0.0 to 1.0 (starts at pleasant sunny afternoon)
  public timeSpeed = 1 / 180; // 1 full day every 180 seconds (~3 minutes)
  public isCyclePaused = false;

  // Celestial Meshes
  public celestialGroup = new THREE.Group();
  public sunMesh: THREE.Mesh;
  public sunRays: THREE.Mesh;
  public moonMesh: THREE.Group;
  public starsMesh: THREE.InstancedMesh | null = null;

  // Environmental groups & animated actors
  public environmentGroup = new THREE.Group();
  public clouds: THREE.Group[] = [];
  public birds: { group: THREE.Group; leftWing: THREE.Mesh; rightWing: THREE.Mesh; speed: number; radius: number; angle: number; altitude: number }[] = [];
  public butterflies: { group: THREE.Group; leftWing: THREE.Mesh; rightWing: THREE.Mesh; pathRadius: number; center: THREE.Vector3; angle: number; speed: number; flapSpeed: number; baseAltitude: number }[] = [];
  public swayingTrees: THREE.Group[] = [];
  public registeredCrops: THREE.Group[] = [];
  public fireflies: { mesh: THREE.Mesh; light: THREE.PointLight | null; basePos: THREE.Vector3; phase: number; speed: number }[] = [];
  public driftingLeaves: { mesh: THREE.Mesh; vel: THREE.Vector3; rotSpeed: THREE.Vector3; life: number; maxLife: number }[] = [];

  // Instanced Grass, Wildflowers & Sunbeam Pollen
  public grassMesh: THREE.InstancedMesh | null = null;
  public flowerMesh: THREE.InstancedMesh | null = null;
  public pollenMesh: THREE.InstancedMesh | null = null;
  private pollenCount = 0;
  private pollenData: { basePos: THREE.Vector3; phase: number; speed: number; amp: number }[] = [];

  // Wind shader uniforms for instanced foliage
  public grassWindUniforms = { uTime: { value: 0 } };
  public flowerWindUniforms = { uTime: { value: 0 } };

  // Water Surfaces & Dynamic Ripple Animations
  public pondWaterMesh: THREE.Mesh | null = null;
  public riverWaterMesh: THREE.Mesh | null = null;
  public pondRipples: { mesh: THREE.Mesh; timer: number; speed: number; maxRadius: number }[] = [];
  public riverRipples: { mesh: THREE.Mesh; baseZ: number; speed: number }[] = [];

  // Water interaction tracking (per character)
  private lastSplashTimes: Map<string, number> = new Map();
  private animClock = 0;

  constructor(scene: THREE.Scene, sunLight: THREE.DirectionalLight, hemiLight: THREE.HemisphereLight, isSoftwareGl: boolean) {
    this.scene = scene;
    this.sunLight = sunLight;
    this.hemiLight = hemiLight;
    this.isSoftwareGl = isSoftwareGl;

    this.environmentGroup.name = 'farm_atmosphere_system';
    this.celestialGroup.name = 'celestial_dome';
    this.scene.add(this.environmentGroup);
    this.scene.add(this.celestialGroup);

    // 1. Build Celestial Objects (Sun, Moon, Stars)
    const { sunMesh, sunRays } = this.createSun();
    this.sunMesh = sunMesh;
    this.sunRays = sunRays;
    this.moonMesh = this.createMoon();
    this.celestialGroup.add(this.sunMesh, this.moonMesh);
    this.createStarfield();

    // 2. Build Environmental Elements
    this.createClouds();
    this.createBirds();
    this.createButterflies();
    this.createInstancedGrassAndFlowers();
    this.createSunbeamPollen();
    this.createFireflies();
    this.createDriftingLeaves();
    this.createWaterSurfaceRipples();

    // Initial Day/Night state sync
    this.applyDayNightLighting(this.timeOfDay);
  }

  // --- CELESTIALS ---

  private createSun() {
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff3b0 });
    const sunGeo = new THREE.SphereGeometry(2.5, 12, 12);
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);

    // Low-poly radial sun rays
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xffd166,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const rayGeo = new THREE.RingGeometry(2.7, 4.0, 12);
    const sunRays = new THREE.Mesh(rayGeo, rayMat);
    sunMesh.add(sunRays);

    return { sunMesh, sunRays };
  }

  private createMoon() {
    const moonGroup = new THREE.Group();
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });
    const moonBody = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 12), moonMat);

    // Glowing lunar halo rim
    const rimMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const rim = new THREE.Mesh(new THREE.RingGeometry(2.3, 3.2, 16), rimMat);
    moonGroup.add(moonBody, rim);

    // Subtle low-poly craters
    const craterMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    for (let i = 0; i < 5; i++) {
      const crater = new THREE.Mesh(new THREE.CircleGeometry(0.35 + (i % 2) * 0.15, 6), craterMat);
      const ang = (i * Math.PI * 2) / 5 + 0.3;
      crater.position.set(Math.cos(ang) * 1.1, Math.sin(ang) * 1.1, 2.15);
      moonGroup.add(crater);
    }

    return moonGroup;
  }

  private createStarfield() {
    const starCount = this.isSoftwareGl ? 80 : 160;
    const starGeo = new THREE.OctahedronGeometry(0.24, 0);
    const starMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0, // starts invisible during day
      depthWrite: false,
    });

    const mesh = new THREE.InstancedMesh(starGeo, starMat, starCount);
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0) * 0.45; // upper sky dome
      const r = 70 + Math.random() * 15;

      dummy.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) + 10,
        r * Math.sin(phi) * Math.sin(theta)
      );
      dummy.scale.setScalar(0.7 + Math.random() * 0.7);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    this.starsMesh = mesh;
    this.celestialGroup.add(mesh);
  }

  // --- CLOUDS ---

  private createClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    });

    const cloudPositions = [
      { x: -35, y: 24, z: -25, scale: 1.25 },
      { x: -15, y: 28, z: 15, scale: 0.95 },
      { x: 10, y: 26, z: -35, scale: 1.4 },
      { x: 30, y: 29, z: 5, scale: 1.05 },
      { x: -45, y: 27, z: 5, scale: 1.15 },
      { x: 5, y: 25, z: 30, scale: 1.3 },
    ];

    cloudPositions.forEach((cp, idx) => {
      const cloud = new THREE.Group();
      cloud.position.set(cp.x, cp.y, cp.z);

      // Low-poly composite cloud puffs (3-5 intersecting dodecahedrons)
      const puffGeo = new THREE.DodecahedronGeometry(1.8, 0);
      const p1 = new THREE.Mesh(puffGeo, cloudMat);
      p1.scale.set(1.4, 0.8, 1.0);

      const p2 = new THREE.Mesh(puffGeo, cloudMat);
      p2.position.set(1.5, -0.2, 0.3);
      p2.scale.set(1.1, 0.75, 0.9);

      const p3 = new THREE.Mesh(puffGeo, cloudMat);
      p3.position.set(-1.4, -0.15, -0.2);
      p3.scale.set(1.0, 0.7, 0.85);

      const p4 = new THREE.Mesh(puffGeo, cloudMat);
      p4.position.set(0.2, 0.7, 0.1);
      p4.scale.set(0.9, 0.65, 0.8);

      cloud.add(p1, p2, p3, p4);
      cloud.scale.setScalar(cp.scale);
      cloud.userData = { speed: 0.55 + (idx % 3) * 0.22 };

      this.clouds.push(cloud);
      this.environmentGroup.add(cloud);
    });
  }

  // --- BIRDS ---

  private createBirds() {
    const birdMat = new THREE.MeshBasicMaterial({ color: 0x334155, side: THREE.DoubleSide });

    for (let i = 0; i < 5; i++) {
      const bird = new THREE.Group();

      const body = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.55, 4), birdMat);
      body.rotation.x = Math.PI / 2;
      bird.add(body);

      const wingGeo = new THREE.PlaneGeometry(0.42, 0.25);
      const leftWing = new THREE.Mesh(wingGeo, birdMat);
      leftWing.position.set(-0.24, 0.05, 0);

      const rightWing = new THREE.Mesh(wingGeo, birdMat);
      rightWing.position.set(0.24, 0.05, 0);

      bird.add(leftWing, rightWing);

      const radius = 34 + (i % 3) * 6;
      const angle = (i * Math.PI * 2) / 5;
      const altitude = 20 + (i % 3) * 2.5;

      bird.position.set(Math.cos(angle) * radius, altitude, Math.sin(angle) * radius);
      this.environmentGroup.add(bird);

      this.birds.push({
        group: bird,
        leftWing,
        rightWing,
        speed: 0.32 + (i % 2) * 0.1,
        radius,
        angle,
        altitude,
      });
    }
  }

  // --- BUTTERFLIES ---

  private createButterflies() {
    const butterflyConfigs = [
      { color: 0x38bdf8, center: new THREE.Vector3(1, 0.6, 2), radius: 3.5 }, // Sky Blue
      { color: 0xfb923c, center: new THREE.Vector3(-4, 0.6, 5), radius: 3.0 }, // Monarch Orange
      { color: 0xc084fc, center: new THREE.Vector3(10, 0.7, 6), radius: 2.8 }, // Lavender
      { color: 0xfacc15, center: new THREE.Vector3(6, 0.6, -4), radius: 3.2 }, // Lemon Yellow
      { color: 0xf43f5e, center: new THREE.Vector3(-10, 0.6, 2), radius: 3.0 }, // Rose Red
    ];

    butterflyConfigs.forEach((cfg, idx) => {
      const bGroup = new THREE.Group();

      const wingMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        side: THREE.DoubleSide,
      });

      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.quadraticCurveTo(0.18, 0.22, 0.22, 0.12);
      wingShape.quadraticCurveTo(0.25, -0.05, 0, 0);
      const wingGeo = new THREE.ShapeGeometry(wingShape);

      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.scale.set(0.85, 0.85, 1);
      leftWing.rotation.y = 0.2;

      const rightWing = new THREE.Mesh(wingGeo, wingMat);
      rightWing.scale.set(-0.85, 0.85, 1);
      rightWing.rotation.y = -0.2;

      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.14, 4),
        new THREE.MeshBasicMaterial({ color: 0x1e293b })
      );
      body.rotation.x = Math.PI / 2;

      bGroup.add(leftWing, rightWing, body);
      bGroup.position.copy(cfg.center);

      this.environmentGroup.add(bGroup);
      this.butterflies.push({
        group: bGroup,
        leftWing,
        rightWing,
        pathRadius: cfg.radius,
        center: cfg.center,
        angle: (idx * Math.PI) / 2.5,
        speed: 0.75 + idx * 0.15,
        flapSpeed: 16 + idx * 2,
        baseAltitude: 0.65 + (idx % 2) * 0.35,
      });
    });
  }

  // --- INSTANCED GRASS, WILDFLOWERS WITH WIND DISPLACEMENT SHADERS ---

  private createInstancedGrassAndFlowers() {
    const grassCount = this.isSoftwareGl ? 90 : 200;
    const flowerCount = this.isSoftwareGl ? 35 : 75;

    // Grass Tuft Mesh with GPU-accelerated wind vertex sway
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x52b788,
      roughness: 0.85,
      side: THREE.DoubleSide,
    });

    // Inject wind sway into Grass Standard Material
    grassMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.grassWindUniforms.uTime;
      shader.vertexShader = `
        uniform float uTime;
        ${shader.vertexShader}
      `;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        // Sway tips of grass blades with wind
        float windFactor = clamp(position.y * 1.8, 0.0, 1.0);
        float swayAngle = uTime * 2.2 + transformed.x * 0.35 + transformed.z * 0.35;
        transformed.x += sin(swayAngle) * 0.14 * windFactor;
        transformed.z += cos(swayAngle * 0.75) * 0.09 * windFactor;
        `
      );
    };

    const grassGeo = new THREE.ConeGeometry(0.14, 0.55, 3);
    const grassInst = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
    grassInst.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < grassCount; i++) {
      const r = 6 + Math.random() * 26;
      const theta = Math.random() * Math.PI * 2;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      dummy.position.set(x, 0.25, z);
      dummy.scale.set(0.8 + Math.random() * 0.5, 0.7 + Math.random() * 0.6, 0.8 + Math.random() * 0.5);
      dummy.rotation.set((Math.random() - 0.5) * 0.2, Math.random() * Math.PI, (Math.random() - 0.5) * 0.2);
      dummy.updateMatrix();
      grassInst.setMatrixAt(i, dummy.matrix);
    }
    grassInst.instanceMatrix.needsUpdate = true;
    this.grassMesh = grassInst;
    this.environmentGroup.add(grassInst);

    // Wildflowers with wind nodding
    const flowerMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      roughness: 0.5,
    });
    flowerMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.flowerWindUniforms.uTime;
      shader.vertexShader = `
        uniform float uTime;
        ${shader.vertexShader}
      `;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float swayAngle = uTime * 1.8 + transformed.x * 0.3 + transformed.z * 0.3;
        transformed.x += sin(swayAngle) * 0.06;
        transformed.z += cos(swayAngle * 0.9) * 0.04;
        `
      );
    };

    const flowerGeo = new THREE.DodecahedronGeometry(0.12, 0);
    const flowerInst = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);
    flowerInst.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    const flowerColors = [0xf43f5e, 0x38bdf8, 0xfacc15, 0xc084fc, 0xfb923c, 0xff70a6];
    for (let f = 0; f < flowerCount; f++) {
      const r = 5 + Math.random() * 22;
      const theta = Math.random() * Math.PI * 2;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      dummy.position.set(x, 0.35 + Math.random() * 0.1, z);
      dummy.scale.setScalar(0.8 + Math.random() * 0.6);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      flowerInst.setMatrixAt(f, dummy.matrix);

      const col = new THREE.Color(flowerColors[f % flowerColors.length]);
      flowerInst.setColorAt(f, col);
    }
    flowerInst.instanceMatrix.needsUpdate = true;
    if (flowerInst.instanceColor) flowerInst.instanceColor.needsUpdate = true;
    this.flowerMesh = flowerInst;
    this.environmentGroup.add(flowerInst);
  }

  // --- FLOATING SUNBEAM POLLEN / AIRBORNE PARTICLES ---

  private createSunbeamPollen() {
    this.pollenCount = this.isSoftwareGl ? 25 : 55;
    const pollenGeo = new THREE.OctahedronGeometry(0.08, 0);
    const pollenMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });

    const inst = new THREE.InstancedMesh(pollenGeo, pollenMat, this.pollenCount);
    inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this.pollenData = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < this.pollenCount; i++) {
      const r = 4 + Math.random() * 22;
      const theta = Math.random() * Math.PI * 2;
      const basePos = new THREE.Vector3(
        Math.cos(theta) * r,
        0.8 + Math.random() * 3.5,
        Math.sin(theta) * r
      );
      this.pollenData.push({
        basePos,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.5,
        amp: 0.4 + Math.random() * 0.6,
      });

      dummy.position.copy(basePos);
      dummy.scale.setScalar(0.7 + Math.random() * 0.6);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    this.pollenMesh = inst;
    this.environmentGroup.add(inst);
  }

  // --- FIREFLIES (NIGHTTIME BIOLUMINESCENCE) ---

  private createFireflies() {
    const fireflyCount = this.isSoftwareGl ? 8 : 16;
    const fireflyMat = new THREE.MeshBasicMaterial({
      color: 0xd9f99d,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });

    const fireflyGeo = new THREE.SphereGeometry(0.08, 4, 4);

    for (let i = 0; i < fireflyCount; i++) {
      const mesh = new THREE.Mesh(fireflyGeo, fireflyMat);
      const r = 4 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const basePos = new THREE.Vector3(Math.cos(theta) * r, 0.8 + Math.random() * 1.5, Math.sin(theta) * r);
      mesh.position.copy(basePos);

      let light: THREE.PointLight | null = null;
      if (i < 4 && !this.isSoftwareGl) {
        light = new THREE.PointLight(0xa3e635, 0.0, 3.5, 2.0);
        mesh.add(light);
      }

      this.environmentGroup.add(mesh);
      this.fireflies.push({
        mesh,
        light,
        basePos,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 0.8,
      });
    }
  }

  // --- DRIFTING LEAVES ---

  private createDriftingLeaves() {
    const leafColors = [0x84cc16, 0xa3e635, 0xfbbf24, 0xf472b6];
    const leafGeo = new THREE.PlaneGeometry(0.18, 0.12);

    for (let i = 0; i < 16; i++) {
      const leafMat = new THREE.MeshBasicMaterial({
        color: leafColors[i % leafColors.length],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(leafGeo, leafMat);
      mesh.position.set(-25 + Math.random() * 45, 1.2 + Math.random() * 3.5, -25 + Math.random() * 45);

      this.environmentGroup.add(mesh);
      this.driftingLeaves.push({
        mesh,
        vel: new THREE.Vector3(0.8 + Math.random() * 1.2, -0.18 - Math.random() * 0.25, 0.4 + Math.random() * 0.8),
        rotSpeed: new THREE.Vector3(Math.random() * 3, Math.random() * 3, Math.random() * 2),
        life: Math.random() * 8,
        maxLife: 8.0,
      });
    }
  }

  // --- WATER SURFACE EXPANDING RIPPLES ---

  private createWaterSurfaceRipples() {
    const rippleMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // 2 concentric animated ripple rings on Turtle Pond (center: 12, 0.33, 8)
    for (let i = 0; i < 2; i++) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.52, 16), rippleMat.clone());
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(12, 0.33, 8);
      this.environmentGroup.add(ring);

      this.pondRipples.push({
        mesh: ring,
        timer: i * 1.5,
        speed: 0.4,
        maxRadius: 2.2,
      });
    }

    // 3 small surface glints/ripples along river (X ~ 16, Z: -12 to 12)
    const riverGlintMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    for (let r = 0; r < 3; r++) {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.15), riverGlintMat);
      g.rotation.x = -Math.PI / 2;
      g.rotation.z = 0.15;
      const baseZ = -10 + r * 10;
      g.position.set(16 + (r % 2 ? 0.4 : -0.4), 0.04, baseZ);
      this.environmentGroup.add(g);
      this.riverRipples.push({
        mesh: g,
        baseZ,
        speed: 1.2 + r * 0.4,
      });
    }
  }

  // --- REGISTRATION HELPERS ---

  public registerTree(treeGroup: THREE.Group) {
    this.swayingTrees.push(treeGroup);
  }

  public registerPondWater(waterMesh: THREE.Mesh) {
    this.pondWaterMesh = waterMesh;
  }

  public registerRiverWater(riverMesh: THREE.Mesh) {
    this.riverWaterMesh = riverMesh;
  }

  public registerPlotMesh(cropGroup: THREE.Group) {
    this.registeredCrops.push(cropGroup);
  }

  public clearPlotMeshes() {
    this.registeredCrops = [];
  }

  // --- DAY/NIGHT LIGHTING & ATMOSPHERE ---

  public getTimePhase(): TimePhase {
    if (this.timeOfDay >= 0.0 && this.timeOfDay < 0.22) return 'morning';
    if (this.timeOfDay >= 0.22 && this.timeOfDay < 0.58) return 'day';
    if (this.timeOfDay >= 0.58 && this.timeOfDay < 0.74) return 'sunset';
    return 'night';
  }

  public applyDayNightLighting(t: number) {
    let skyHex = 0x7dd3fc;
    let fogHex = 0xbce4fa;
    let sunHex = 0xfffae0;
    let sunInt = 1.8;
    let hemiSkyHex = 0xe0f2fe;
    let hemiGndHex = 0x588157;
    let hemiInt = 0.7;
    let starOpacity = 0.0;
    let fireflyOpacity = 0.0;
    let pollenOpacity = 0.65;

    // Smooth sinusoidal sun & moon celestial elevation
    const sunAngle = t * Math.PI * 2 - Math.PI / 2;
    const sunElevation = Math.sin(sunAngle);
    const sunX = Math.cos(sunAngle) * 38;
    const sunY = Math.max(-10, Math.sin(sunAngle) * 38);
    const sunZ = 18;

    this.sunLight.position.set(sunX, Math.max(8, sunY), sunZ);
    this.sunMesh.position.set(sunX, sunY, sunZ);

    // Moon on opposite side of dome
    const moonAngle = sunAngle + Math.PI;
    const moonX = Math.cos(moonAngle) * 36;
    const moonY = Math.sin(moonAngle) * 36;
    const moonZ = -18;
    this.moonMesh.position.set(moonX, moonY, moonZ);

    if (t < 0.22) {
      // --- DAWN / MORNING ---
      const factor = t / 0.22;
      _tempColorA.setHex(0xfbcfe8); // Pastel pink dawn
      _tempColorB.setHex(0xbce4fa); // Day sky
      _tempColorA.lerp(_tempColorB, factor);
      skyHex = _tempColorA.getHex();
      fogHex = skyHex;

      sunHex = 0xffe8d6;
      sunInt = 1.2 + factor * 0.6;
      hemiSkyHex = 0xfef08a;
      hemiGndHex = 0x4d7c0f;
      hemiInt = 0.68;
      starOpacity = Math.max(0, 1.0 - factor * 2.5);
      fireflyOpacity = Math.max(0, 1.0 - factor * 3.0);
      pollenOpacity = factor * 0.65;
    } else if (t < 0.58) {
      // --- MIDDAY / AFTERNOON ---
      skyHex = 0x7dd3fc;
      fogHex = 0xbce4fa;
      sunHex = 0xfffae0;
      sunInt = 1.85;
      hemiSkyHex = 0xe0f2fe;
      hemiGndHex = 0x588157;
      hemiInt = 0.75;
      starOpacity = 0.0;
      fireflyOpacity = 0.0;
      pollenOpacity = 0.65;
    } else if (t < 0.74) {
      // --- GOLDEN SUNSET / DUSK ---
      const factor = (t - 0.58) / 0.16;
      _tempColorA.setHex(0x7dd3fc);
      _tempColorB.setHex(0xf97316); // Amber Sunset
      _tempColorC.setHex(0x6366f1); // Violet Dusk
      if (factor < 0.6) {
        _tempColorA.lerp(_tempColorB, factor / 0.6);
      } else {
        _tempColorB.lerp(_tempColorC, (factor - 0.6) / 0.4);
        _tempColorA.copy(_tempColorB);
      }
      skyHex = _tempColorA.getHex();
      fogHex = 0xfb923c;
      sunHex = 0xf97316;
      sunInt = 1.5 - factor * 0.6;
      hemiSkyHex = 0xfdba74;
      hemiGndHex = 0x312e81;
      hemiInt = 0.65;
      starOpacity = Math.min(1.0, factor * 1.5);
      fireflyOpacity = Math.min(1.0, factor * 2.0);
      pollenOpacity = (1.0 - factor) * 0.65;
    } else {
      // --- NIGHT / TWILIGHT (Comfortable visibility preserved) ---
      skyHex = 0x0f172a; // Deep Navy Starlight Dome
      fogHex = 0x1e1b4b; // Indigo Fog
      sunHex = 0x93c5fd; // Silvery moonlight
      sunInt = 0.95; // Clear night visibility
      hemiSkyHex = 0x38bdf8;
      hemiGndHex = 0x14532d;
      hemiInt = 0.58;
      starOpacity = 0.95;
      fireflyOpacity = 1.0;
      pollenOpacity = 0.0;
    }

    // Apply colors to scene & lights
    this.scene.background = new THREE.Color(skyHex);
    if (this.scene.fog) {
      this.scene.fog.color.setHex(fogHex);
    }

    this.sunLight.color.setHex(sunHex);
    this.sunLight.intensity = sunInt;

    this.hemiLight.color.setHex(hemiSkyHex);
    this.hemiLight.groundColor.setHex(hemiGndHex);
    this.hemiLight.intensity = hemiInt;

    // Stars opacity
    if (this.starsMesh) {
      (this.starsMesh.material as THREE.MeshBasicMaterial).opacity = starOpacity;
    }

    // Sunbeam pollen motes opacity
    if (this.pollenMesh) {
      (this.pollenMesh.material as THREE.MeshBasicMaterial).opacity = pollenOpacity;
    }

    // Fireflies opacity & subtle lighting
    this.fireflies.forEach((ff) => {
      (ff.mesh.material as THREE.MeshBasicMaterial).opacity = fireflyOpacity;
      if (ff.light) {
        ff.light.intensity = fireflyOpacity * 0.8;
      }
    });

    // Cloud tinting based on sunset / night
    const cloudMat = this.clouds[0]?.children[0] ? ((this.clouds[0].children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial) : null;
    if (cloudMat) {
      if (t >= 0.58 && t < 0.74) {
        cloudMat.color.setHex(0xfecdd3); // Rosy sunset
      } else if (t >= 0.74 || t < 0.08) {
        cloudMat.color.setHex(0x334155); // Night twilight
      } else {
        cloudMat.color.setHex(0xf8fafc); // Crisp daytime white
      }
    }
  }

  // --- MULTI-CHARACTER WATER INTERACTION ---

  public checkWaterInteraction(positions: { id: string; pos: THREE.Vector3; isMoving: boolean }[], particleSys: ParticleSystem) {
    const now = performance.now();

    positions.forEach(({ id, pos, isMoving }) => {
      if (!isMoving) return;

      // 1. Turtle Pond: Center (12, 0, 8), Radius: 2.5
      const distPond = Math.hypot(pos.x - 12, pos.z - 8);
      const inPond = distPond < 2.5;

      // 2. River: X ~ 16, Z between -18 and 18, excluding bridge around Z = 0
      const inRiver = Math.abs(pos.x - 16) < 3.2 && Math.abs(pos.z) < 18 && Math.abs(pos.z) > 1.6;

      if (inPond || inRiver) {
        const lastSplash = this.lastSplashTimes.get(id) || 0;
        if (now - lastSplash > 300) {
          this.lastSplashTimes.set(id, now);
          _tempVec3.set(pos.x, inPond ? 0.34 : 0.05, pos.z);
          particleSys.spawnWaterRipple(_tempVec3, 0.4);
          particleSys.spawnWaterSplash(_tempVec3);
          soundEngine.playWaterSplash();
        }
      }
    });
  }

  // --- TICK UPDATE ---

  public update(delta: number, characters: { id: string; pos: THREE.Vector3; isMoving: boolean }[] = [], currentLocation: 'farm' | 'wild_grounds' = 'farm', particleSys?: ParticleSystem) {
    this.animClock += delta;

    // Advance Day/Night Cycle on farm if not paused
    if (currentLocation === 'farm') {
      if (!this.isCyclePaused) {
        this.timeOfDay = (this.timeOfDay + delta * this.timeSpeed) % 1.0;
      }
      this.applyDayNightLighting(this.timeOfDay);

      // Check water interactions for player and follower pets
      if (particleSys) this.checkWaterInteraction(characters, particleSys);

      // 1. Wind Sway Uniforms for Instanced Grass & Wildflowers
      this.grassWindUniforms.uTime.value = this.animClock;
      this.flowerWindUniforms.uTime.value = this.animClock;

      // 2. Trees and Branches Swaying (Trunk + Multi-level Foliage Clusters)
      this.swayingTrees.forEach((tree) => {
        const offset = tree.position.x * 0.2 + tree.position.z * 0.3;
        const trunkSway = Math.sin(this.animClock * 1.4 + offset) * 0.022;
        tree.rotation.z = trunkSway;
        tree.rotation.x = Math.cos(this.animClock * 1.0 + offset) * 0.015;

        // Secondary branch / foliage sway
        const foliage = tree.userData.foliage as THREE.Mesh[] | undefined;
        if (foliage) {
          foliage.forEach((f, fIdx) => {
            const fSway = Math.sin(this.animClock * 1.9 + offset + fIdx * 0.7) * 0.035;
            f.rotation.z = fSway;
            f.rotation.x = Math.cos(this.animClock * 1.5 + offset + fIdx * 0.5) * 0.025;
          });
        }
      });

      // 3. Subtle Crop Movement & Harvest-Ready Sparkle Aura
      this.registeredCrops.forEach((crop, idx) => {
        const sway = Math.sin(this.animClock * 2.2 + idx * 0.6) * 0.04;
        crop.rotation.z = sway;
        crop.rotation.x = Math.cos(this.animClock * 1.7 + idx * 0.4) * 0.025;

        // Animated golden pulse on harvest-ready aura
        const aura = crop.getObjectByName('ready_aura');
        if (aura) {
          aura.rotation.z += delta * 1.2;
          const pulse = 0.45 + Math.sin(this.animClock * 3.5 + idx) * 0.3;
          const mat = (aura as THREE.Mesh).material as THREE.MeshBasicMaterial;
          if (mat) mat.opacity = pulse;
        }
      });

      // 4. Clouds Moving Slowly across Sky
      this.clouds.forEach((cloud) => {
        const speed = (cloud.userData as any).speed || 0.6;
        cloud.position.x += delta * speed;
        if (cloud.position.x > 50) {
          cloud.position.x = -50;
        }
      });

      // 5. Distant Birds Soaring & Banking
      this.birds.forEach((b) => {
        b.angle += delta * b.speed * 0.4;
        b.group.position.x = Math.cos(b.angle) * b.radius;
        b.group.position.z = Math.sin(b.angle) * b.radius;
        b.group.position.y = b.altitude + Math.sin(this.animClock * 1.2 + b.radius) * 0.8;

        b.group.rotation.y = -b.angle;
        b.group.rotation.z = 0.25;

        const flap = Math.sin(this.animClock * 9.0 + b.radius) * 0.42;
        b.leftWing.rotation.z = flap;
        b.rightWing.rotation.z = -flap;
      });

      // 6. Butterflies Fluttering
      this.butterflies.forEach((bf) => {
        bf.angle += delta * bf.speed;
        bf.group.position.x = bf.center.x + Math.cos(bf.angle) * bf.pathRadius;
        bf.group.position.z = bf.center.z + Math.sin(bf.angle) * bf.pathRadius;
        bf.group.position.y = bf.baseAltitude + Math.sin(this.animClock * 4.0 + bf.angle) * 0.25;

        bf.group.rotation.y = -bf.angle + Math.PI / 2;

        const flap = Math.sin(this.animClock * bf.flapSpeed) * 0.85;
        bf.leftWing.rotation.y = flap;
        bf.rightWing.rotation.y = -flap;
      });

      // 7. Floating Sunbeam Pollen / Dust Motes
      if (this.pollenMesh && this.pollenData.length > 0 && this.timeOfDay < 0.74) {
        const dummy = new THREE.Object3D();
        for (let i = 0; i < this.pollenCount; i++) {
          const pd = this.pollenData[i];
          const t = this.animClock * pd.speed + pd.phase;
          dummy.position.set(
            pd.basePos.x + Math.sin(t * 0.8) * pd.amp,
            pd.basePos.y + Math.sin(t * 1.6) * 0.35,
            pd.basePos.z + Math.cos(t * 0.9) * pd.amp
          );
          dummy.scale.setScalar(0.75 + Math.sin(t * 2.0) * 0.25);
          dummy.updateMatrix();
          this.pollenMesh.setMatrixAt(i, dummy.matrix);
        }
        this.pollenMesh.instanceMatrix.needsUpdate = true;
      }

      // 8. Nighttime Fireflies hovering
      if (this.timeOfDay >= 0.72 || this.timeOfDay < 0.1) {
        this.fireflies.forEach((ff) => {
          const t = this.animClock * ff.speed + ff.phase;
          ff.mesh.position.x = ff.basePos.x + Math.sin(t * 0.7) * 0.8;
          ff.mesh.position.y = ff.basePos.y + Math.sin(t * 1.5) * 0.35;
          ff.mesh.position.z = ff.basePos.z + Math.cos(t * 0.9) * 0.8;

          const glow = 0.5 + Math.sin(t * 3.5) * 0.45;
          (ff.mesh.material as THREE.MeshBasicMaterial).opacity = glow;
        });
      }

      // 9. Drifting Wind Leaves
      this.driftingLeaves.forEach((leaf) => {
        leaf.life += delta;
        leaf.mesh.position.addScaledVector(leaf.vel, delta);
        leaf.mesh.rotation.x += leaf.rotSpeed.x * delta;
        leaf.mesh.rotation.y += leaf.rotSpeed.y * delta;

        if (leaf.mesh.position.y < 0.2 || leaf.mesh.position.x > 30 || leaf.life >= leaf.maxLife) {
          leaf.life = 0;
          leaf.mesh.position.set(-28 + Math.random() * 8, 2.5 + Math.random() * 2.5, -25 + Math.random() * 45);
        }
      });

      // 10. Water Surface Animations & Expanding Concentric Ripples
      if (this.pondWaterMesh) {
        this.pondWaterMesh.rotation.z += delta * 0.25;
      }
      if (this.riverWaterMesh) {
        this.riverWaterMesh.position.y = 0.02 + Math.sin(this.animClock * 2.0) * 0.008;
      }

      // Pond concentric ripples
      this.pondRipples.forEach((pr) => {
        pr.timer += delta * pr.speed;
        if (pr.timer > 1.0) pr.timer = 0;
        const radius = 0.5 + pr.timer * (pr.maxRadius - 0.5);
        pr.mesh.scale.set(radius, radius, 1);
        (pr.mesh.material as THREE.MeshBasicMaterial).opacity = (1.0 - pr.timer) * 0.45;
      });

      // River flowing glints
      this.riverRipples.forEach((rr) => {
        rr.mesh.position.z += delta * rr.speed;
        if (rr.mesh.position.z > 16) {
          rr.mesh.position.z = -16;
        }
      });
    }
  }

  public dispose() {
    this.scene.remove(this.environmentGroup);
    this.scene.remove(this.celestialGroup);
  }
}
