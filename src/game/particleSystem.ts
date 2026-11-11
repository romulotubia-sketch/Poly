import * as THREE from 'three';
import { GraphicsQuality } from '../types/game';

type ParticleMeshType = 'spark' | 'flame' | 'ring' | 'spike' | 'heart' | 'star' | 'ribbon' | 'custom';

interface Particle {
  mesh: THREE.Object3D;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scaleDelta?: number;
  rotDelta?: THREE.Vector3;
  orbitCenter?: THREE.Vector3;
  orbitSpeed?: number;
  orbitRadius?: number;
  orbitAngle?: number;
  isHarvestFly?: boolean;
  startPos?: THREE.Vector3;
  targetPos?: THREE.Vector3;
  poolType: ParticleMeshType;
}

interface DamageTextSpriteItem {
  sprite: THREE.Sprite;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  baseScale: number;
  inUse: boolean;
}

export class ParticleSystem {
  public group: THREE.Group;
  private particles: Particle[] = [];

  // Graphics Quality & Particle Limits
  public quality: GraphicsQuality = 'medium';
  public maxActiveParticles = 260;
  public spawnMultiplier = 0.8;

  // Shared Geometries (Created once, reused forever)
  private sparkGeo = new THREE.DodecahedronGeometry(0.14, 0);
  private flameGeo = new THREE.ConeGeometry(0.16, 0.45, 5);
  private ringGeo = new THREE.RingGeometry(0.2, 0.45, 16);
  private spikeGeo = new THREE.ConeGeometry(0.25, 1.2, 5);
  private heartGeo = new THREE.OctahedronGeometry(0.14, 0);
  private starGeo = new THREE.OctahedronGeometry(0.12, 0);
  private ribbonGeo = new THREE.PlaneGeometry(0.35, 0.12);

  // Shared Materials (Cached & reused)
  private fireMat = new THREE.MeshBasicMaterial({ color: 0xff5400 });
  private brightFlameMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
  private waterMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
  private windMat = new THREE.MeshBasicMaterial({ color: 0xd8f3dc, transparent: true, opacity: 0.75 });
  private windTealMat = new THREE.MeshBasicMaterial({ color: 0x70e000, transparent: true, opacity: 0.7 });
  private earthMat = new THREE.MeshStandardMaterial({ color: 0x7f4f24, roughness: 0.9 });
  private healMat = new THREE.MeshBasicMaterial({ color: 0x06d6a0, transparent: true, opacity: 0.9 });
  private arcaneMat = new THREE.MeshBasicMaterial({ color: 0x9d4edd, transparent: true, opacity: 0.85 });
  private goldMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });
  private heartMat = new THREE.MeshBasicMaterial({ color: 0xff4d6d });
  private stunMat = new THREE.MeshBasicMaterial({ color: 0xffd000 });
  private hitRedMat = new THREE.MeshBasicMaterial({ color: 0xff0054 });
  private defeatPurpleMat = new THREE.MeshBasicMaterial({ color: 0x7209b7, transparent: true, opacity: 0.9 });
  private waterRippleMat = new THREE.MeshBasicMaterial({ color: 0x90e0ef, side: THREE.DoubleSide, transparent: true, opacity: 0.75, depthWrite: false });

  // Mesh Object Pools: type -> array of inactive available meshes
  private pools: Map<ParticleMeshType, THREE.Mesh[]> = new Map();

  // Damage Text Billboard Pool (16 persistent sprites with pre-allocated CanvasTextures)
  private damageSpritePool: DamageTextSpriteItem[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'particles';

    // Initialize pool containers
    const types: ParticleMeshType[] = ['spark', 'flame', 'ring', 'spike', 'heart', 'star', 'ribbon'];
    types.forEach((t) => this.pools.set(t, []));

    // Pre-allocate 16 damage text billboard sprites
    for (let i = 0; i < 16; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 96;
      const ctx = canvas.getContext('2d')!;

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.visible = false;
      this.group.add(sprite);

      this.damageSpritePool.push({
        sprite,
        canvas,
        ctx,
        texture,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1.0,
        baseScale: 1.6,
        inUse: false,
      });
    }
  }

  public setQuality(quality: GraphicsQuality) {
    this.quality = quality;
    if (quality === 'low') {
      this.maxActiveParticles = 120;
      this.spawnMultiplier = 0.5;
    } else if (quality === 'medium') {
      this.maxActiveParticles = 260;
      this.spawnMultiplier = 0.8;
    } else {
      this.maxActiveParticles = 500;
      this.spawnMultiplier = 1.0;
    }
  }

  public getActiveCount(): number {
    return this.particles.length;
  }

  public getMaxCount(): number {
    return this.maxActiveParticles;
  }

  // --- OBJECT POOLING ACQUIRE / RELEASE ---

  private acquireMesh(type: ParticleMeshType, mat: THREE.Material): THREE.Mesh {
    const pool = this.pools.get(type);
    if (pool && pool.length > 0) {
      const mesh = pool.pop()!;
      mesh.material = mat;
      mesh.visible = true;
      mesh.scale.set(1, 1, 1);
      mesh.rotation.set(0, 0, 0);
      return mesh;
    }

    // Allocate geometry on demand if pool is empty
    let geo: THREE.BufferGeometry;
    switch (type) {
      case 'spark': geo = this.sparkGeo; break;
      case 'flame': geo = this.flameGeo; break;
      case 'ring': geo = this.ringGeo; break;
      case 'spike': geo = this.spikeGeo; break;
      case 'heart': geo = this.heartGeo; break;
      case 'star': geo = this.starGeo; break;
      case 'ribbon': geo = this.ribbonGeo; break;
      default: geo = this.sparkGeo; break;
    }

    const mesh = new THREE.Mesh(geo, mat);
    this.group.add(mesh);
    return mesh;
  }

  private releaseParticle(p: Particle) {
    p.mesh.visible = false;
    if (p.poolType !== 'custom' && p.mesh instanceof THREE.Mesh) {
      const pool = this.pools.get(p.poolType);
      if (pool) {
        pool.push(p.mesh);
        return;
      }
    }
    this.group.remove(p.mesh);
  }

  private addParticle(p: Particle) {
    // If active particle limit reached, recycle oldest particle
    if (this.particles.length >= this.maxActiveParticles) {
      const oldest = this.particles[0];
      this.releaseParticle(oldest);
      // Fast swap-pop
      this.particles[0] = this.particles[this.particles.length - 1];
      this.particles.pop();
    }
    this.particles.push(p);
  }

  // Calculate adjusted spawn count based on graphics settings and distance
  private getAdjustedCount(baseCount: number, pos?: THREE.Vector3, cameraPos?: THREE.Vector3): number {
    let count = Math.round(baseCount * this.spawnMultiplier);
    if (pos && cameraPos) {
      const dist = pos.distanceTo(cameraPos);
      if (dist > 35) count = Math.max(1, Math.round(count * 0.5));
    }
    return Math.max(1, count);
  }

  // --- PARTICLE SPAWNERS (ALL OBJECT-POOLED) ---

  // Flame Dash trail: glowing flames + spark embers
  public spawnFlameTrail(position: THREE.Vector3) {
    const count = this.getAdjustedCount(4);
    for (let i = 0; i < count; i++) {
      const isCone = Math.random() < 0.6;
      const type: ParticleMeshType = isCone ? 'flame' : 'spark';
      const mat = Math.random() < 0.5 ? this.fireMat : this.brightFlameMat;
      const mesh = this.acquireMesh(type, mat);

      mesh.position.copy(position);
      mesh.position.x += (Math.random() - 0.5) * 0.5;
      mesh.position.y += Math.random() * 0.4 + 0.1;
      mesh.position.z += (Math.random() - 0.5) * 0.5;
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      this.addParticle({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.6, Math.random() * 1.8 + 0.8, (Math.random() - 0.5) * 0.6),
        life: 0,
        maxLife: 0.55 + Math.random() * 0.3,
        scaleDelta: -0.5,
        rotDelta: new THREE.Vector3(Math.random() * 4, Math.random() * 4, 0),
        poolType: type,
      });
    }
  }

  // Flame Explosion
  public spawnFlameExplosion(position: THREE.Vector3, radius = 5.0) {
    const count = this.getAdjustedCount(24);
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.4;
      const speed = 3.5 + Math.random() * radius * 0.8;
      const mat = Math.random() < 0.4 ? this.brightFlameMat : this.fireMat;
      const mesh = this.acquireMesh('flame', mat);
      mesh.position.set(position.x, position.y + 0.3, position.z);

      this.addParticle({
        mesh,
        velocity: new THREE.Vector3(Math.cos(angle) * speed, 1.8 + Math.random() * 2.5, Math.sin(angle) * speed),
        life: 0,
        maxLife: 0.6 + Math.random() * 0.3,
        scaleDelta: -0.4,
        rotDelta: new THREE.Vector3(Math.random() * 6, Math.random() * 6, 0),
        poolType: 'flame',
      });
    }
  }

  // Tidal Barrier: Swirling water burst
  public spawnWaterBurst(position: THREE.Vector3, radius = 5.5) {
    const count = this.getAdjustedCount(28);
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const mesh = this.acquireMesh('spark', this.waterMat);
      mesh.position.set(position.x, position.y + 0.4, position.z);

      const speed = radius * 1.5;
      this.addParticle({
        mesh,
        velocity: new THREE.Vector3(Math.cos(angle) * speed, 1.4 + Math.random() * 0.8, Math.sin(angle) * speed),
        life: 0,
        maxLife: 0.75,
        scaleDelta: -0.3,
        poolType: 'spark',
      });
    }
  }

  // Phantom Leap Impact: Expanding shockwave ring + golden flash shards
  public spawnPhantomLanding(position: THREE.Vector3, radius = 5.5) {
    const ringMesh = this.acquireMesh('ring', this.goldMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(position.x, 0.05, position.z);

    this.addParticle({
      mesh: ringMesh,
      velocity: new THREE.Vector3(0, 0, 0),
      life: 0,
      maxLife: 0.65,
      scaleDelta: radius * 2.4,
      poolType: 'ring',
    });

    const count = this.getAdjustedCount(18);
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const mesh = this.acquireMesh('spark', this.goldMat);
      mesh.position.set(position.x, 0.3, position.z);

      this.addParticle({
        mesh,
        velocity: new THREE.Vector3(Math.cos(angle) * (radius * 0.9), 3.5 + Math.random() * 2.5, Math.sin(angle) * (radius * 0.9)),
        life: 0,
        maxLife: 0.55,
        scaleDelta: -0.5,
        poolType: 'spark',
      });
    }
  }

  // Cyclone Tornado Vortex: Spiral vortex ribbons
  public spawnCycloneVortex(position: THREE.Vector3, duration = 3.5, radius = 6.0) {
    const count = this.getAdjustedCount(32);
    for (let i = 0; i < count; i++) {
      const mat = Math.random() < 0.6 ? this.windMat : this.windTealMat;
      const mesh = this.acquireMesh('ribbon', mat);
      const angle = Math.random() * Math.PI * 2;
      const r = 1.0 + Math.random() * (radius * 0.8);
      const y = Math.random() * 3.5 + 0.2;

      mesh.position.set(position.x + Math.cos(angle) * r, position.y + y, position.z + Math.sin(angle) * r);

      this.addParticle({
        mesh,
        velocity: new THREE.Vector3(0, 0.4 + Math.random() * 0.6, 0),
        life: 0,
        maxLife: duration,
        orbitCenter: position.clone(),
        orbitRadius: r,
        orbitSpeed: 4.5 + Math.random() * 3.0,
        orbitAngle: angle,
        rotDelta: new THREE.Vector3(0, 6.0, 0),
        poolType: 'ribbon',
      });
    }
  }

  // Wind Gust breeze
  public spawnWindGust(position: THREE.Vector3, dir: THREE.Vector3) {
    const count = this.getAdjustedCount(18);
    for (let i = 0; i < count; i++) {
      const mesh = this.acquireMesh('spark', this.windMat);
      mesh.position.copy(position);
      mesh.position.x += (Math.random() - 0.5) * 1.5;
      mesh.position.y += Math.random() * 1.0 + 0.2;
      mesh.position.z += (Math.random() - 0.5) * 1.5;

      const vel = dir.clone().multiplyScalar(10 + Math.random() * 5);
      vel.y += (Math.random() - 0.5) * 1.5;

      this.addParticle({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.85,
        scaleDelta: -0.3,
        poolType: 'spark',
      });
    }
  }

  // Earthshatter Ground Shockwave
  public spawnEarthshatterSpikes(position: THREE.Vector3, radius = 7.0) {
    const ringMesh = this.acquireMesh('ring', this.earthMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(position.x, 0.05, position.z);

    this.addParticle({
      mesh: ringMesh,
      velocity: new THREE.Vector3(0, 0, 0),
      life: 0,
      maxLife: 0.75,
      scaleDelta: radius * 2.2,
      poolType: 'ring',
    });

    const spikeCount = this.getAdjustedCount(12);
    for (let i = 0; i < spikeCount; i++) {
      const angle = (i * Math.PI * 2) / spikeCount + (Math.random() - 0.5) * 0.3;
      const dist = 1.5 + Math.random() * (radius * 0.7);
      const spike = this.acquireMesh('spike', this.earthMat);
      spike.position.set(position.x + Math.cos(angle) * dist, -0.4, position.z + Math.sin(angle) * dist);
      spike.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.5);

      this.addParticle({
        mesh: spike,
        velocity: new THREE.Vector3(0, 3.2, 0),
        life: 0,
        maxLife: 1.4,
        poolType: 'spike',
      });
    }
  }

  // Arcane Burst: Magical energy sphere & sparkles
  public spawnArcaneNova(position: THREE.Vector3, radius = 6.5) {
    const count = this.getAdjustedCount(24);
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const mesh = this.acquireMesh('spark', Math.random() < 0.6 ? this.healMat : this.arcaneMat);
      mesh.position.set(position.x, position.y + 0.6, position.z);

      const speed = 3.5 + Math.random() * (radius * 0.8);
      this.addParticle({
        mesh,
        velocity: new THREE.Vector3(Math.cos(angle) * speed, 1.5 + Math.random() * 2.0, Math.sin(angle) * speed),
        life: 0,
        maxLife: 0.8,
        scaleDelta: -0.4,
        poolType: 'spark',
      });
    }
  }

  public spawnGroundSlam(position: THREE.Vector3, radius = 6) {
    this.spawnEarthshatterSpikes(position, radius);
  }

  public spawnHealingBubbles(position: THREE.Vector3) {
    const count = this.getAdjustedCount(18);
    for (let i = 0; i < count; i++) {
      const mesh = this.acquireMesh('spark', this.healMat);
      mesh.position.set(position.x + (Math.random() - 0.5) * 2.5, position.y + 0.2, position.z + (Math.random() - 0.5) * 2.5);

      this.addParticle({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.4, 1.8 + Math.random() * 1.2, (Math.random() - 0.5) * 0.4),
        life: 0,
        maxLife: 1.1,
        scaleDelta: 0.3,
        poolType: 'spark',
      });
    }
  }

  public spawnCritImpact(position: THREE.Vector3) {
    const count = this.getAdjustedCount(12);
    for (let i = 0; i < count; i++) {
      const mesh = this.acquireMesh('star', this.goldMat);
      mesh.position.copy(position);
      mesh.position.y += 0.5;

      this.addParticle({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 7.0, 4.0 + Math.random() * 3.5, (Math.random() - 0.5) * 7.0),
        life: 0,
        maxLife: 0.38,
        scaleDelta: -0.6,
        poolType: 'star',
      });
    }
  }

  public spawnBurnTick(position: THREE.Vector3) {
    for (let i = 0; i < 2; i++) {
      const mesh = this.acquireMesh('spark', this.fireMat);
      mesh.position.set(position.x + (Math.random() - 0.5) * 0.5, position.y + 0.4 + Math.random() * 0.6, position.z + (Math.random() - 0.5) * 0.5);

      this.addParticle({
        mesh,
        velocity: new THREE.Vector3(0, 1.5 + Math.random() * 0.8, 0),
        life: 0,
        maxLife: 0.4,
        scaleDelta: -0.7,
        poolType: 'spark',
      });
    }
  }

  public spawnStunStars(position: THREE.Vector3) {
    for (let i = 0; i < 3; i++) {
      const mesh = this.acquireMesh('star', this.stunMat);
      mesh.position.set(position.x, position.y + 1.8, position.z);

      this.addParticle({
        mesh,
        velocity: new THREE.Vector3(0, 0, 0),
        life: 0,
        maxLife: 1.1,
        orbitCenter: new THREE.Vector3(position.x, position.y + 1.8, position.z),
        orbitRadius: 0.55,
        orbitSpeed: 5.0,
        orbitAngle: (i * Math.PI * 2) / 3,
        poolType: 'star',
      });
    }
  }

  public spawnHarvestBurst(position: THREE.Vector3) {
    const count = this.getAdjustedCount(12);
    for (let i = 0; i < count; i++) {
      const mesh = this.acquireMesh('spark', this.goldMat);
      mesh.position.set(position.x, position.y + 0.3, position.z);

      this.addParticle({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 3, 2.5 + Math.random() * 2, (Math.random() - 0.5) * 3),
        life: 0,
        maxLife: 0.75,
        scaleDelta: -0.5,
        poolType: 'spark',
      });
    }
  }

  public spawnPetAffection(position: THREE.Vector3) {
    for (let i = 0; i < 4; i++) {
      const mesh = this.acquireMesh('heart', this.heartMat);
      mesh.position.set(position.x + (Math.random() - 0.5) * 0.4, position.y + 0.5 + i * 0.15, position.z + (Math.random() - 0.5) * 0.4);

      this.addParticle({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.3, 1.2 + Math.random() * 0.6, (Math.random() - 0.5) * 0.3),
        life: 0,
        maxLife: 0.95,
        scaleDelta: 0.1,
        poolType: 'heart',
      });
    }
  }

  public spawnCombatHit(position: THREE.Vector3, color = 0xff0054) {
    const count = this.getAdjustedCount(8);
    const mat = color === 0xff0054 ? this.hitRedMat : new THREE.MeshBasicMaterial({ color });
    for (let i = 0; i < count; i++) {
      const mesh = this.acquireMesh('spark', mat);
      mesh.position.copy(position);
      mesh.position.y += 0.5 + (Math.random() - 0.5) * 0.4;

      this.addParticle({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 4 + 2, (Math.random() - 0.5) * 6),
        life: 0,
        maxLife: 0.32 + Math.random() * 0.2,
        scaleDelta: -0.8,
        poolType: 'spark',
      });
    }
  }

  public spawnEnemyDefeat(position: THREE.Vector3) {
    const count = this.getAdjustedCount(14);
    for (let i = 0; i < count; i++) {
      const mesh = this.acquireMesh('spark', this.defeatPurpleMat);
      mesh.position.copy(position);
      mesh.position.y += 0.4;

      this.addParticle({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3 + 1, (Math.random() - 0.5) * 4),
        life: 0,
        maxLife: 0.55 + Math.random() * 0.25,
        scaleDelta: -0.5,
        poolType: 'spark',
      });
    }
  }

  // --- REUSABLE CANVAS SPRITE POOL FOR FLOATING DAMAGE TEXTS (ZERO MEMORY LEAKS) ---
  public spawnDamageNumber(
    position: THREE.Vector3,
    amount: number | string,
    isCrit = false,
    isBoss = false,
    type: 'damage' | 'heal' | 'shield' | 'burn' = 'damage'
  ) {
    // Find an unused sprite in the pre-allocated pool
    const item = this.damageSpritePool.find((s) => !s.inUse);
    if (!item) return; // Pool full, gracefully skip to protect framerate

    let text = String(amount);
    let color = '#ffffff';
    let stroke = '#1c1917';
    let fontSize = 34;
    let scaleW = 1.6;
    let scaleH = 0.6;

    if (type === 'heal') {
      text = `+${amount} HP`;
      color = '#10b981';
      stroke = '#064e3b';
      fontSize = 32;
    } else if (type === 'shield') {
      text = `ABSORB ${amount}`;
      color = '#38bdf8';
      stroke = '#075985';
      fontSize = 28;
      scaleW = 1.9;
    } else if (type === 'burn') {
      text = `🔥 ${amount}`;
      color = '#fb923c';
      stroke = '#7c2d12';
      fontSize = 30;
    } else if (isCrit) {
      text = `💥 CRIT! ${amount}`;
      color = '#fbbf24';
      stroke = '#78350f';
      fontSize = 38;
      scaleW = 2.4;
      scaleH = 0.9;
    } else if (isBoss) {
      text = `⚔️ ${amount}`;
      color = '#f43f5e';
      stroke = '#881337';
      fontSize = 36;
      scaleW = 2.0;
      scaleH = 0.75;
    }

    // Paint onto existing pooled canvas
    const { ctx, canvas, texture, sprite } = item;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.lineWidth = 7;
    ctx.strokeStyle = stroke;
    ctx.strokeText(text, 128, 48);

    ctx.fillStyle = color;
    ctx.fillText(text, 128, 48);

    texture.needsUpdate = true;

    sprite.position.set(
      position.x + (Math.random() - 0.5) * 0.4,
      position.y + 1.4 + Math.random() * 0.3,
      position.z + (Math.random() - 0.5) * 0.4
    );
    sprite.scale.set(scaleW, scaleH, 1.0);
    sprite.material.opacity = 1.0;
    sprite.visible = true;

    item.inUse = true;
    item.life = 0;
    item.maxLife = isCrit || isBoss ? 0.9 : 0.7;
    item.baseScale = scaleW;
    item.velocity.set((Math.random() - 0.5) * 0.4, 2.2 + Math.random() * 0.8, (Math.random() - 0.5) * 0.4);
  }

  public spawnWaterRipple(position: THREE.Vector3, initialRadius = 0.4) {
    const ring = this.acquireMesh('ring', this.waterRippleMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(position.x, position.y + 0.04, position.z);
    ring.scale.set(initialRadius, initialRadius, 1);

    this.addParticle({
      mesh: ring,
      velocity: new THREE.Vector3(0, 0, 0),
      life: 0,
      maxLife: 0.8,
      scaleDelta: 2.8,
      poolType: 'ring',
    });
  }

  public spawnWaterSplash(position: THREE.Vector3) {
    const count = this.getAdjustedCount(6);
    for (let i = 0; i < count; i++) {
      const drop = this.acquireMesh('spark', this.waterMat);
      drop.position.set(position.x + (Math.random() - 0.5) * 0.3, position.y + 0.1, position.z + (Math.random() - 0.5) * 0.3);
      drop.scale.set(0.6, 0.6, 0.6);

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 1.5;

      this.addParticle({
        mesh: drop,
        velocity: new THREE.Vector3(Math.cos(angle) * speed, 2.2 + Math.random() * 1.5, Math.sin(angle) * speed),
        life: 0,
        maxLife: 0.55,
        scaleDelta: -0.4,
        poolType: 'spark',
      });
    }
  }

  public spawnHarvestPop(position: THREE.Vector3, colorHex = 0xffd166) {
    const ring = this.acquireMesh('ring', this.goldMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(position.x, position.y + 0.1, position.z);

    this.addParticle({
      mesh: ring,
      velocity: new THREE.Vector3(0, 0.3, 0),
      life: 0,
      maxLife: 0.7,
      scaleDelta: 3.2,
      poolType: 'ring',
    });

    const count = this.getAdjustedCount(14);
    for (let i = 0; i < count; i++) {
      const star = this.acquireMesh('star', this.goldMat);
      star.position.set(position.x, position.y + 0.3, position.z);
      star.scale.set(0.85, 0.85, 0.85);

      const angle = (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.2;
      const speed = 1.8 + Math.random() * 2.2;

      this.addParticle({
        mesh: star,
        velocity: new THREE.Vector3(Math.cos(angle) * speed, 3.2 + Math.random() * 2.5, Math.sin(angle) * speed),
        life: 0,
        maxLife: 0.8,
        scaleDelta: -0.6,
        rotDelta: new THREE.Vector3(Math.random() * 6, Math.random() * 6, 0),
        poolType: 'star',
      });
    }
  }

  public spawnHarvestFlyItem(startPos: THREE.Vector3, targetPos: THREE.Vector3, itemMesh: THREE.Object3D) {
    itemMesh.position.copy(startPos);
    itemMesh.position.y += 0.35;
    itemMesh.scale.set(0.7, 0.7, 0.7);
    this.group.add(itemMesh);

    this.addParticle({
      mesh: itemMesh,
      velocity: new THREE.Vector3(0, 0, 0),
      life: 0,
      maxLife: 0.75,
      rotDelta: new THREE.Vector3(4.0, 7.0, 3.0),
      isHarvestFly: true,
      startPos: startPos.clone(),
      targetPos: targetPos.clone(),
      poolType: 'custom',
    });
  }

  public spawnPortalIdleMote(portalPos: THREE.Vector3, colorHex: number) {
    if (this.quality === 'low') return; // Skip ambient portal motes on low
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.85 });
    const mesh = this.acquireMesh('spark', mat);
    const radius = 1.3 + Math.random() * 0.8;
    const angle = Math.random() * Math.PI * 2;
    mesh.position.set(portalPos.x + Math.cos(angle) * radius, portalPos.y + 1.8 + (Math.random() - 0.5) * 1.6, portalPos.z + Math.sin(angle) * radius * 0.4);

    this.addParticle({
      mesh,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.3, Math.random() * 0.6 + 0.4, (Math.random() - 0.5) * 0.3),
      life: 0,
      maxLife: 1.1,
      scaleDelta: -0.5,
      poolType: 'spark',
    });
  }

  public spawnFlameGroundPatch(position: THREE.Vector3) {
    for (let i = 0; i < 2; i++) {
      const flame = this.acquireMesh('flame', this.fireMat);
      flame.position.set(position.x + (Math.random() - 0.5) * 0.8, 0.2, position.z + (Math.random() - 0.5) * 0.8);
      flame.scale.set(0.65, 0.95, 0.65);

      this.addParticle({
        mesh: flame,
        velocity: new THREE.Vector3(0, 0.04, 0),
        life: 0,
        maxLife: 2.0,
        scaleDelta: -0.7,
        poolType: 'flame',
      });
    }
  }

  public spawnBossHit(position: THREE.Vector3) {
    const count = this.getAdjustedCount(18);
    for (let i = 0; i < count; i++) {
      const mesh = this.acquireMesh('star', this.goldMat);
      mesh.position.copy(position);
      mesh.position.y += 0.8 + (Math.random() - 0.5) * 0.6;

      this.addParticle({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 10, Math.random() * 6 + 3, (Math.random() - 0.5) * 10),
        life: 0,
        maxLife: 0.5,
        scaleDelta: -0.4,
        poolType: 'star',
      });
    }
  }

  public spawnCycloneDispersion(position: THREE.Vector3, radius = 6.0) {
    const count = this.getAdjustedCount(24);
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const mesh = this.acquireMesh('ribbon', this.windTealMat);
      mesh.position.set(position.x, position.y + 0.8 + Math.random() * 2.0, position.z);

      this.addParticle({
        mesh,
        velocity: new THREE.Vector3(Math.cos(angle) * (radius * 1.8), 1.5 + Math.random() * 2.5, Math.sin(angle) * (radius * 1.8)),
        life: 0,
        maxLife: 0.7,
        scaleDelta: -0.5,
        poolType: 'ribbon',
      });
    }
  }

  public spawnShieldRipple(position: THREE.Vector3) {
    const mesh = this.acquireMesh('ring', this.waterMat);
    mesh.position.set(position.x, position.y + 0.4, position.z);
    mesh.rotation.x = Math.PI / 2;
    mesh.scale.set(0.6, 0.6, 0.6);

    this.addParticle({
      mesh,
      velocity: new THREE.Vector3(0, 0.2, 0),
      life: 0,
      maxLife: 0.6,
      scaleDelta: 3.5,
      poolType: 'ring',
    });
  }

  public spawnPhantomTrail(position: THREE.Vector3, _rotY?: number) {
    const count = this.getAdjustedCount(4);
    for (let i = 0; i < count; i++) {
      const mesh = this.acquireMesh('spark', this.goldMat);
      mesh.position.set(
        position.x + (Math.random() - 0.5) * 0.6,
        position.y + 0.4 + (Math.random() - 0.5) * 0.4,
        position.z + (Math.random() - 0.5) * 0.6
      );
      this.addParticle({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.8, Math.random() * 0.5, (Math.random() - 0.5) * 0.8),
        life: 0,
        maxLife: 0.4,
        scaleDelta: -0.5,
        poolType: 'spark',
      });
    }
  }

  public spawnCraterDecal(position: THREE.Vector3, radius = 3.5) {
    const mesh = this.acquireMesh('ring', this.earthMat);
    mesh.position.set(position.x, 0.05, position.z);
    mesh.rotation.x = -Math.PI / 2;
    mesh.scale.set(radius * 0.4, radius * 0.4, radius * 0.4);

    this.addParticle({
      mesh,
      velocity: new THREE.Vector3(0, 0, 0),
      life: 0,
      maxLife: 1.2,
      scaleDelta: 0.5,
      poolType: 'ring',
    });
  }

  public spawnFissureCracks(position: THREE.Vector3, radius = 5.0) {
    const count = this.getAdjustedCount(8);
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.4;
      const dist = radius * (0.3 + Math.random() * 0.6);
      const mesh = this.acquireMesh('spike', this.earthMat);
      mesh.position.set(position.x + Math.cos(angle) * dist, 0.1, position.z + Math.sin(angle) * dist);
      mesh.rotation.x = (Math.random() - 0.5) * 0.4;
      mesh.rotation.z = (Math.random() - 0.5) * 0.4;

      this.addParticle({
        mesh,
        velocity: new THREE.Vector3(0, 0.8, 0),
        life: 0,
        maxLife: 0.8,
        scaleDelta: -0.4,
        poolType: 'spike',
      });
    }
  }

  public spawnAscendingHealAura(position: THREE.Vector3) {
    const count = this.getAdjustedCount(10);
    for (let i = 0; i < count; i++) {
      const mesh = this.acquireMesh('heart', this.healMat);
      mesh.position.set(
        position.x + (Math.random() - 0.5) * 1.5,
        position.y + 0.2 + Math.random() * 0.5,
        position.z + (Math.random() - 0.5) * 1.5
      );

      this.addParticle({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.6, 1.8 + Math.random() * 1.2, (Math.random() - 0.5) * 0.6),
        life: 0,
        maxLife: 0.9,
        scaleDelta: -0.3,
        poolType: 'heart',
      });
    }
  }

  public spawnPortalWarpBurst(position: THREE.Vector3, _colorHex?: number) {
    const count = this.getAdjustedCount(30);
    for (let i = 0; i < count; i++) {
      const mesh = this.acquireMesh('spark', this.arcaneMat);
      mesh.position.set(position.x, position.y + 2.0, position.z);
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4.5;
      const vy = (Math.random() - 0.3) * 4.0;

      this.addParticle({
        mesh,
        velocity: new THREE.Vector3(Math.cos(angle) * speed, vy, Math.sin(angle) * speed),
        life: 0,
        maxLife: 1.0,
        scaleDelta: -0.4,
        poolType: 'spark',
      });
    }
  }

  public spawnPortalProximityAura(position: THREE.Vector3, _colorHex?: number) {
    const mesh = this.acquireMesh('spark', this.arcaneMat);
    const angle = Math.random() * Math.PI * 2;
    const r = 1.0 + Math.random() * 1.8;
    mesh.position.set(position.x + Math.cos(angle) * r, position.y + 0.5 + Math.random() * 3.0, position.z + Math.sin(angle) * r);

    this.addParticle({
      mesh,
      velocity: new THREE.Vector3(0, 0.4 + Math.random() * 0.8, 0),
      life: 0,
      maxLife: 0.8,
      scaleDelta: -0.3,
      poolType: 'spark',
    });
  }

  // --- EFFICIENT TICK UPDATE LOOP (ZERO GC) ---

  public update(delta: number) {
    // 1. Update 3D Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        if (p.isHarvestFly) {
          this.spawnHarvestBurst(p.mesh.position);
        }
        this.releaseParticle(p);
        // Fast swap-with-last removal
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
        continue;
      }

      // Parabolic flight arc for harvested item collection
      if (p.isHarvestFly && p.startPos && p.targetPos) {
        const progress = p.life / p.maxLife;
        p.mesh.position.x = THREE.MathUtils.lerp(p.startPos.x, p.targetPos.x, progress);
        p.mesh.position.z = THREE.MathUtils.lerp(p.startPos.z, p.targetPos.z, progress);
        const arc = Math.sin(progress * Math.PI) * 1.6;
        p.mesh.position.y = THREE.MathUtils.lerp(p.startPos.y + 0.35, p.targetPos.y + 0.9, progress) + arc;
      } else if (p.orbitCenter && p.orbitRadius !== undefined && p.orbitAngle !== undefined && p.orbitSpeed !== undefined) {
        p.orbitAngle += p.orbitSpeed * delta;
        p.mesh.position.x = p.orbitCenter.x + Math.cos(p.orbitAngle) * p.orbitRadius;
        p.mesh.position.z = p.orbitCenter.z + Math.sin(p.orbitAngle) * p.orbitRadius;
        p.mesh.position.y += p.velocity.y * delta;
      } else {
        p.mesh.position.addScaledVector(p.velocity, delta);
      }

      // Rotations
      if (p.rotDelta) {
        p.mesh.rotation.x += p.rotDelta.x * delta;
        p.mesh.rotation.y += p.rotDelta.y * delta;
        p.mesh.rotation.z += p.rotDelta.z * delta;
      }

      // Scale animation
      const progress = p.life / p.maxLife;
      if (p.scaleDelta) {
        const factor = Math.max(0.01, 1.0 + p.scaleDelta * progress);
        p.mesh.scale.set(factor, factor, factor);
      }

      // Opacity fade if supported
      const mat = (p.mesh as THREE.Mesh).material;
      if (mat && 'opacity' in mat) {
        (mat as THREE.MeshBasicMaterial).opacity = Math.max(0, 1.0 - progress);
      }
    }

    // 2. Update Pooled Damage Text Sprites
    for (let i = 0; i < this.damageSpritePool.length; i++) {
      const item = this.damageSpritePool[i];
      if (!item.inUse) continue;

      item.life += delta;
      if (item.life >= item.maxLife) {
        item.sprite.visible = false;
        item.inUse = false;
        continue;
      }

      item.sprite.position.addScaledVector(item.velocity, delta);
      item.velocity.y = Math.max(0.4, item.velocity.y - delta * 2.2);

      const progress = item.life / item.maxLife;
      const scaleMult = progress < 0.2 ? 1.0 + Math.sin((progress / 0.2) * Math.PI * 0.5) * 0.35 : 1.35 - (progress - 0.2) * 0.4;
      item.sprite.scale.set(item.baseScale * scaleMult, item.baseScale * scaleMult * 0.375, 1.0);
      item.sprite.material.opacity = Math.max(0, 1.0 - Math.pow(progress, 2.0));
    }
  }

  public dispose() {
    this.particles.forEach((p) => this.releaseParticle(p));
    this.particles = [];
    this.damageSpritePool.forEach((item) => {
      this.group.remove(item.sprite);
      item.texture.dispose();
      item.sprite.material.dispose();
    });
    this.damageSpritePool = [];
    this.pools.clear();
  }
}
