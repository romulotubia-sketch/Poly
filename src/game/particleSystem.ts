import * as THREE from 'three';

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
}

interface DamageTextSprite {
  sprite: THREE.Sprite;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  baseScale: number;
}

export class ParticleSystem {
  public group: THREE.Group;
  private particles: Particle[] = [];
  private damageTexts: DamageTextSprite[] = [];

  // Geometries
  private sparkGeo = new THREE.DodecahedronGeometry(0.14, 0);
  private flameGeo = new THREE.ConeGeometry(0.16, 0.45, 5);
  private ringGeo = new THREE.RingGeometry(0.2, 0.45, 16);
  private spikeGeo = new THREE.ConeGeometry(0.25, 1.2, 5);
  private heartGeo = new THREE.OctahedronGeometry(0.14, 0);
  private starGeo = new THREE.OctahedronGeometry(0.12, 0);
  private ribbonGeo = new THREE.PlaneGeometry(0.35, 0.12);

  // Materials
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

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'particles';
  }

  // Flame Dash trail: glowing flames + spark embers
  public spawnFlameTrail(position: THREE.Vector3) {
    for (let i = 0; i < 4; i++) {
      const isCone = Math.random() < 0.6;
      const mesh = new THREE.Mesh(
        isCone ? this.flameGeo : this.sparkGeo,
        Math.random() < 0.5 ? this.fireMat : this.brightFlameMat
      );
      mesh.position.copy(position);
      mesh.position.x += (Math.random() - 0.5) * 0.5;
      mesh.position.y += Math.random() * 0.4 + 0.1;
      mesh.position.z += (Math.random() - 0.5) * 0.5;
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.6, Math.random() * 1.8 + 0.8, (Math.random() - 0.5) * 0.6),
        life: 0,
        maxLife: 0.6 + Math.random() * 0.35,
        scaleDelta: -0.5,
        rotDelta: new THREE.Vector3(Math.random() * 4, Math.random() * 4, 0),
      });
    }
  }

  // Flame Explosion at end of dash or impact
  public spawnFlameExplosion(position: THREE.Vector3, radius = 5.0) {
    const count = 28;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.4;
      const speed = 3.5 + Math.random() * radius * 0.8;
      const mesh = new THREE.Mesh(this.flameGeo, Math.random() < 0.4 ? this.brightFlameMat : this.fireMat);
      mesh.position.set(position.x, position.y + 0.3, position.z);

      const vel = new THREE.Vector3(Math.cos(angle) * speed, 1.8 + Math.random() * 2.5, Math.sin(angle) * speed);

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.65 + Math.random() * 0.3,
        scaleDelta: -0.4,
        rotDelta: new THREE.Vector3(Math.random() * 6, Math.random() * 6, 0),
      });
    }
  }

  // Tidal Barrier: Swirling water burst + rotating hydro spheres
  public spawnWaterBurst(position: THREE.Vector3, radius = 5.5) {
    const count = 36;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const mesh = new THREE.Mesh(this.sparkGeo, this.waterMat);
      mesh.position.set(position.x, position.y + 0.4, position.z);

      const speed = radius * 1.6;
      const vel = new THREE.Vector3(Math.cos(angle) * speed, 1.4 + Math.random() * 0.8, Math.sin(angle) * speed);

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.8,
        scaleDelta: -0.3,
      });
    }
  }

  // Phantom Leap Impact: Giant shockwave crater ring + dust sparks
  public spawnPhantomLanding(position: THREE.Vector3, radius = 5.5) {
    // Expanding ground ring
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffb703,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ringMesh = new THREE.Mesh(this.ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(position.x, 0.05, position.z);

    this.group.add(ringMesh);
    this.particles.push({
      mesh: ringMesh,
      velocity: new THREE.Vector3(0, 0, 0),
      life: 0,
      maxLife: 0.65,
      scaleDelta: radius * 2.4,
    });

    // Upward golden flash shards
    for (let i = 0; i < 22; i++) {
      const angle = (i * Math.PI * 2) / 22;
      const mesh = new THREE.Mesh(this.sparkGeo, this.goldMat);
      mesh.position.set(position.x, 0.3, position.z);
      const vel = new THREE.Vector3(Math.cos(angle) * (radius * 0.9), 3.5 + Math.random() * 2.5, Math.sin(angle) * (radius * 0.9));

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.6,
        scaleDelta: -0.5,
      });
    }
  }

  // Cyclone Tornado Vortex: Spiral vortex particles that pull toward center
  public spawnCycloneVortex(position: THREE.Vector3, duration = 3.5, radius = 6.0) {
    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
      const mesh = new THREE.Mesh(this.ribbonGeo, Math.random() < 0.6 ? this.windMat : this.windTealMat);
      const angle = Math.random() * Math.PI * 2;
      const r = 1.0 + Math.random() * (radius * 0.8);
      const y = Math.random() * 3.5 + 0.2;

      mesh.position.set(position.x + Math.cos(angle) * r, position.y + y, position.z + Math.sin(angle) * r);
      this.group.add(mesh);

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(0, 0.4 + Math.random() * 0.6, 0),
        life: 0,
        maxLife: duration,
        orbitCenter: position.clone(),
        orbitRadius: r,
        orbitSpeed: 4.5 + Math.random() * 3.0,
        orbitAngle: angle,
        rotDelta: new THREE.Vector3(0, 6.0, 0),
      });
    }
  }

  // Wind Gust breeze
  public spawnWindGust(position: THREE.Vector3, dir: THREE.Vector3) {
    for (let i = 0; i < 24; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, this.windMat);
      mesh.position.copy(position);
      mesh.position.x += (Math.random() - 0.5) * 1.5;
      mesh.position.y += Math.random() * 1.0 + 0.2;
      mesh.position.z += (Math.random() - 0.5) * 1.5;

      const vel = dir.clone().multiplyScalar(10 + Math.random() * 5);
      vel.y += (Math.random() - 0.5) * 1.5;

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.9,
        scaleDelta: -0.3,
      });
    }
  }

  // Earthshatter Ground Shockwave: Jagged rock spike pillars burst out
  public spawnEarthshatterSpikes(position: THREE.Vector3, radius = 7.0) {
    // Ground shockwave rings
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x582f0e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ringMesh = new THREE.Mesh(this.ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(position.x, 0.05, position.z);

    this.group.add(ringMesh);
    this.particles.push({
      mesh: ringMesh,
      velocity: new THREE.Vector3(0, 0, 0),
      life: 0,
      maxLife: 0.8,
      scaleDelta: radius * 2.2,
    });

    // Jagged earthen rock spikes shooting upward
    const spikeCount = 14;
    for (let i = 0; i < spikeCount; i++) {
      const angle = (i * Math.PI * 2) / spikeCount + (Math.random() - 0.5) * 0.3;
      const dist = 1.5 + Math.random() * (radius * 0.7);
      const spike = new THREE.Mesh(this.spikeGeo, this.earthMat);
      spike.position.set(
        position.x + Math.cos(angle) * dist,
        -0.4,
        position.z + Math.sin(angle) * dist
      );
      spike.rotation.x = (Math.random() - 0.5) * 0.5;
      spike.rotation.z = (Math.random() - 0.5) * 0.5;
      spike.rotation.y = Math.random() * Math.PI * 2;
      spike.scale.setScalar(0.7 + Math.random() * 0.6);

      this.group.add(spike);
      this.particles.push({
        mesh: spike,
        velocity: new THREE.Vector3(0, 3.2, 0), // pops up rapidly
        life: 0,
        maxLife: 1.5, // lingers as stone spike obstacle
      });
    }

    // Flying rock fragments
    for (let i = 0; i < 18; i++) {
      const angle = (i * Math.PI * 2) / 18;
      const frag = new THREE.Mesh(this.sparkGeo, this.earthMat);
      frag.position.set(position.x, 0.2, position.z);
      const vel = new THREE.Vector3(
        Math.cos(angle) * (2.5 + Math.random() * 3.5),
        4.0 + Math.random() * 3.0,
        Math.sin(angle) * (2.5 + Math.random() * 3.5)
      );

      this.group.add(frag);
      this.particles.push({
        mesh: frag,
        velocity: vel,
        life: 0,
        maxLife: 0.85,
        scaleDelta: -0.4,
      });
    }
  }

  // Arcane Burst: Expanding magical energy explosion & restorative sparkles
  public spawnArcaneNova(position: THREE.Vector3, radius = 6.5) {
    // Expanding magical energy sphere
    const sphereGeo = new THREE.SphereGeometry(0.5, 12, 12);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x06d6a0,
      transparent: true,
      opacity: 0.85,
      wireframe: true,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereMesh.position.set(position.x, position.y + 0.8, position.z);
    this.group.add(sphereMesh);
    this.particles.push({
      mesh: sphereMesh,
      velocity: new THREE.Vector3(0, 0.2, 0),
      life: 0,
      maxLife: 0.7,
      scaleDelta: radius * 2.0,
    });

    // Prismatic burst stars
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const mesh = new THREE.Mesh(this.sparkGeo, Math.random() < 0.6 ? this.healMat : this.arcaneMat);
      mesh.position.set(position.x, position.y + 0.6, position.z);

      const speed = 3.5 + Math.random() * (radius * 0.8);
      const vel = new THREE.Vector3(Math.cos(angle) * speed, 1.5 + Math.random() * 2.0, Math.sin(angle) * speed);

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.85,
        scaleDelta: -0.4,
      });
    }
  }

  // Ground Slam Shockwave (backward compatibility)
  public spawnGroundSlam(position: THREE.Vector3, radius = 6) {
    this.spawnEarthshatterSpikes(position, radius);
  }

  // Healing Bubble Ring
  public spawnHealingBubbles(position: THREE.Vector3) {
    for (let i = 0; i < 24; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, this.healMat);
      mesh.position.set(
        position.x + (Math.random() - 0.5) * 2.5,
        position.y + 0.2,
        position.z + (Math.random() - 0.5) * 2.5
      );

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.4, 1.8 + Math.random() * 1.2, (Math.random() - 0.5) * 0.4),
        life: 0,
        maxLife: 1.2,
        scaleDelta: 0.3,
      });
    }
  }

  // Critical Strike Impact: Sharp golden spark burst
  public spawnCritImpact(position: THREE.Vector3) {
    for (let i = 0; i < 14; i++) {
      const mesh = new THREE.Mesh(this.starGeo, this.goldMat);
      mesh.position.copy(position);
      mesh.position.y += 0.5;

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 7.0,
        4.0 + Math.random() * 3.5,
        (Math.random() - 0.5) * 7.0
      );

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.4,
        scaleDelta: -0.6,
      });
    }
  }

  // Burning Embers over burning enemies
  public spawnBurnTick(position: THREE.Vector3) {
    for (let i = 0; i < 3; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, this.fireMat);
      mesh.position.set(
        position.x + (Math.random() - 0.5) * 0.5,
        position.y + 0.4 + Math.random() * 0.6,
        position.z + (Math.random() - 0.5) * 0.5
      );
      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(0, 1.5 + Math.random() * 0.8, 0),
        life: 0,
        maxLife: 0.45,
        scaleDelta: -0.7,
      });
    }
  }

  // Stun Stars over stunned enemies
  public spawnStunStars(position: THREE.Vector3) {
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(this.starGeo, this.stunMat);
      mesh.position.set(position.x, position.y + 1.8, position.z);
      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(0, 0, 0),
        life: 0,
        maxLife: 1.2,
        orbitCenter: new THREE.Vector3(position.x, position.y + 1.8, position.z),
        orbitRadius: 0.55,
        orbitSpeed: 5.0,
        orbitAngle: (i * Math.PI * 2) / 4,
      });
    }
  }

  // Golden Harvest Explosion
  public spawnHarvestBurst(position: THREE.Vector3) {
    for (let i = 0; i < 14; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, this.goldMat);
      mesh.position.set(position.x, position.y + 0.3, position.z);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        2.5 + Math.random() * 2,
        (Math.random() - 0.5) * 3
      );

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.8,
        scaleDelta: -0.5,
      });
    }
  }

  // Hearts for Petting / Feeding
  public spawnPetAffection(position: THREE.Vector3) {
    for (let i = 0; i < 5; i++) {
      const mesh = new THREE.Mesh(this.heartGeo, this.heartMat);
      mesh.position.set(
        position.x + (Math.random() - 0.5) * 0.4,
        position.y + 0.5 + i * 0.15,
        position.z + (Math.random() - 0.5) * 0.4
      );

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.3, 1.2 + Math.random() * 0.6, (Math.random() - 0.5) * 0.3),
        life: 0,
        maxLife: 1.0,
        scaleDelta: 0.1,
      });
    }
  }

  // Combat Hit Sparks
  public spawnCombatHit(position: THREE.Vector3, color = 0xff0054) {
    const mat = new THREE.MeshBasicMaterial({ color });
    for (let i = 0; i < 10; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.copy(position);
      mesh.position.y += 0.5 + (Math.random() - 0.5) * 0.4;
      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 4 + 2, (Math.random() - 0.5) * 6),
        life: 0,
        maxLife: 0.35 + Math.random() * 0.2,
        scaleDelta: -0.8,
      });
    }
  }

  // Enemy Defeat Poof
  public spawnEnemyDefeat(position: THREE.Vector3) {
    const mat = new THREE.MeshBasicMaterial({ color: 0x7209b7, transparent: true, opacity: 0.9 });
    for (let i = 0; i < 18; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.copy(position);
      mesh.position.y += 0.4;
      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3 + 1, (Math.random() - 0.5) * 4),
        life: 0,
        maxLife: 0.6 + Math.random() * 0.3,
        scaleDelta: -0.5,
      });
    }
  }

  // Floating 3D Damage / Heal / Shield Billboard Text
  public spawnDamageNumber(
    position: THREE.Vector3,
    amount: number | string,
    isCrit = false,
    isBoss = false,
    type: 'damage' | 'heal' | 'shield' | 'burn' = 'damage'
  ) {
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
      scaleW = 1.6;
      scaleH = 0.6;
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

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.lineWidth = 7;
    ctx.strokeStyle = stroke;
    ctx.strokeText(text, 128, 48);

    ctx.fillStyle = color;
    ctx.fillText(text, 128, 48);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(
      position.x + (Math.random() - 0.5) * 0.4,
      position.y + 1.4 + Math.random() * 0.3,
      position.z + (Math.random() - 0.5) * 0.4
    );
    sprite.scale.set(scaleW, scaleH, 1.0);
    this.group.add(sprite);

    this.damageTexts.push({
      sprite,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.4, 2.2 + Math.random() * 0.8, (Math.random() - 0.5) * 0.4),
      life: 0,
      maxLife: isCrit || isBoss ? 0.95 : 0.75,
      baseScale: scaleW,
    });
  }

  // Lingering Ground Flame Patches for Fox Flame Dash
  public spawnFlameGroundPatch(position: THREE.Vector3) {
    for (let i = 0; i < 3; i++) {
      const flame = new THREE.Mesh(this.flameGeo, Math.random() < 0.5 ? this.fireMat : this.brightFlameMat);
      flame.position.set(
        position.x + (Math.random() - 0.5) * 0.8,
        0.2,
        position.z + (Math.random() - 0.5) * 0.8
      );
      flame.scale.set(0.65, 0.95, 0.65);
      this.group.add(flame);
      this.particles.push({
        mesh: flame,
        velocity: new THREE.Vector3(0, 0.04, 0),
        life: 0,
        maxLife: 2.2,
        scaleDelta: -0.7,
        rotDelta: new THREE.Vector3(0, (Math.random() - 0.5) * 4, 0),
      });
    }
  }

  // Water Shield Impact Ripple Ring for Turtle Tidal Barrier
  public spawnShieldRipple(position: THREE.Vector3) {
    const rippleMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ring = new THREE.Mesh(this.ringGeo, rippleMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(position.x, position.y + 0.8, position.z);
    this.group.add(ring);
    this.particles.push({
      mesh: ring,
      velocity: new THREE.Vector3(0, 0, 0),
      life: 0,
      maxLife: 0.5,
      scaleDelta: 4.5,
    });
  }

  // Rabbit Phantom Motion Silhouette Trail
  public spawnPhantomTrail(position: THREE.Vector3, rotY: number) {
    const shadowGroup = new THREE.Group();
    shadowGroup.position.copy(position);
    shadowGroup.rotation.y = rotY;

    const phantomMat = new THREE.MeshBasicMaterial({
      color: 0xffb703,
      transparent: true,
      opacity: 0.55,
      wireframe: false,
    });

    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.5), phantomMat);
    bodyMesh.position.y = 0.45;
    shadowGroup.add(bodyMesh);

    const ear1 = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.55, 4), phantomMat);
    ear1.position.set(0.18, 1.1, 0);
    const ear2 = ear1.clone();
    ear2.position.set(-0.18, 1.1, 0);
    shadowGroup.add(ear1);
    shadowGroup.add(ear2);

    this.group.add(shadowGroup);
    this.particles.push({
      mesh: shadowGroup,
      velocity: new THREE.Vector3(0, 0, 0),
      life: 0,
      maxLife: 0.45,
      scaleDelta: 0.05,
    });
  }

  // Rabbit Landing Crater with Radial Ground Fracture Cracks
  public spawnCraterDecal(position: THREE.Vector3, radius = 5.0) {
    const crackMat = new THREE.MeshBasicMaterial({
      color: 0x292524,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8 + (Math.random() - 0.5) * 0.2;
      const len = radius * 0.45 + Math.random() * (radius * 0.4);
      const slabGeo = new THREE.PlaneGeometry(0.3, len);
      const slab = new THREE.Mesh(slabGeo, crackMat);
      slab.rotation.x = -Math.PI / 2;
      slab.rotation.z = angle;
      slab.position.set(
        position.x + Math.cos(angle) * (len * 0.5),
        0.03,
        position.z + Math.sin(angle) * (len * 0.5)
      );
      this.group.add(slab);
      this.particles.push({
        mesh: slab,
        velocity: new THREE.Vector3(0, 0, 0),
        life: 0,
        maxLife: 3.5,
      });
    }
  }

  // Bear Earthshatter Ground Fissure Slabs
  public spawnFissureCracks(position: THREE.Vector3, radius = 7.0) {
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI * 2) / 10 + (Math.random() - 0.5) * 0.3;
      const dist = 1.4 + Math.random() * (radius * 0.7);
      const crackGeo = new THREE.BoxGeometry(0.35, 0.15, dist);
      const crackMat = new THREE.MeshStandardMaterial({
        color: 0x3e2723,
        roughness: 0.95,
      });
      const crack = new THREE.Mesh(crackGeo, crackMat);
      crack.position.set(
        position.x + Math.cos(angle) * (dist * 0.5),
        0.04,
        position.z + Math.sin(angle) * (dist * 0.5)
      );
      crack.rotation.y = angle + Math.PI / 2;
      this.group.add(crack);
      this.particles.push({
        mesh: crack,
        velocity: new THREE.Vector3(0, 0, 0),
        life: 0,
        maxLife: 3.2,
      });
    }
  }

  // Final Wind Burst Explosion when Cyclone ends
  public spawnCycloneDispersion(position: THREE.Vector3, radius = 6.0) {
    for (let i = 0; i < 35; i++) {
      const angle = (i * Math.PI * 2) / 35;
      const isLeaf = Math.random() < 0.45;
      const mesh = new THREE.Mesh(
        isLeaf ? this.ribbonGeo : this.sparkGeo,
        isLeaf ? this.windTealMat : this.windMat
      );
      mesh.position.set(position.x, position.y + 0.8 + Math.random() * 2.0, position.z);
      const vel = new THREE.Vector3(
        Math.cos(angle) * (radius * 2.0),
        1.5 + Math.random() * 2.5,
        Math.sin(angle) * (radius * 2.0)
      );
      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.75,
        scaleDelta: -0.5,
        rotDelta: new THREE.Vector3(Math.random() * 8, Math.random() * 8, 0),
      });
    }
  }

  // Ascending Healing Energy Helix for Slime Arcane Burst
  public spawnAscendingHealAura(position: THREE.Vector3) {
    for (let i = 0; i < 3; i++) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const ring = new THREE.Mesh(this.ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(position.x, position.y + 0.1 + i * 0.5, position.z);
      this.group.add(ring);
      this.particles.push({
        mesh: ring,
        velocity: new THREE.Vector3(0, 2.6, 0),
        life: 0,
        maxLife: 0.95,
        scaleDelta: 1.6,
      });
    }
  }

  // Boss Impact Starburst & Heavy Shockwave
  public spawnBossHit(position: THREE.Vector3) {
    for (let i = 0; i < 24; i++) {
      const mesh = new THREE.Mesh(
        this.starGeo,
        Math.random() < 0.5 ? this.goldMat : new THREE.MeshBasicMaterial({ color: 0xff0054 })
      );
      mesh.position.copy(position);
      mesh.position.y += 0.8 + (Math.random() - 0.5) * 0.6;
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 6 + 3,
        (Math.random() - 0.5) * 10
      );
      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.55,
        scaleDelta: -0.4,
      });
    }
  }

  // --- PORTAL PARTICLE SYSTEMS ---
  public spawnPortalIdleMote(portalPos: THREE.Vector3, colorHex: number) {
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.85 });
    const mesh = new THREE.Mesh(this.sparkGeo, mat);
    const radius = 1.3 + Math.random() * 0.8;
    const angle = Math.random() * Math.PI * 2;
    mesh.position.set(
      portalPos.x + Math.cos(angle) * radius,
      portalPos.y + 1.8 + (Math.random() - 0.5) * 1.6,
      portalPos.z + Math.sin(angle) * radius * 0.4
    );
    mesh.scale.set(0.65, 0.65, 0.65);
    this.group.add(mesh);

    // Spirals gently upwards towards apex or center
    this.particles.push({
      mesh,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.3, Math.random() * 0.6 + 0.4, (Math.random() - 0.5) * 0.3),
      life: 0,
      maxLife: 1.2 + Math.random() * 0.6,
      scaleDelta: -0.5,
      rotDelta: new THREE.Vector3(Math.random() * 3, Math.random() * 3, 0),
    });
  }

  public spawnPortalProximityAura(portalPos: THREE.Vector3, colorHex: number) {
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 });
    for (let i = 0; i < 3; i++) {
      const mesh = new THREE.Mesh(this.starGeo, mat);
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.6 + Math.random() * 1.5;
      mesh.position.set(
        portalPos.x + Math.cos(angle) * radius,
        portalPos.y + 1.2 + Math.random() * 2.2,
        portalPos.z + Math.sin(angle) * radius * 0.35 + 0.2
      );
      mesh.scale.set(0.7, 0.7, 0.7);
      this.group.add(mesh);

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.4, Math.random() * 1.2 + 0.6, (Math.random() - 0.5) * 0.4),
        life: 0,
        maxLife: 0.85 + Math.random() * 0.4,
        scaleDelta: -0.3,
        rotDelta: new THREE.Vector3(Math.random() * 5, Math.random() * 5, 0),
      });
    }
  }

  public spawnPortalWarpBurst(portalPos: THREE.Vector3, colorHex: number) {
    const count = 36;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.2;
      const speed = 4.0 + Math.random() * 6.0;
      const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.95 });
      const isCone = Math.random() < 0.5;
      const mesh = new THREE.Mesh(isCone ? this.flameGeo : this.sparkGeo, mat);
      mesh.position.set(portalPos.x, portalPos.y + 3.0, portalPos.z + 0.2);
      mesh.rotation.z = angle;

      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        (Math.random() - 0.5) * 4.0 + 1.5,
        Math.sin(angle) * (speed * 0.4)
      );

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.75 + Math.random() * 0.35,
        scaleDelta: -0.5,
        rotDelta: new THREE.Vector3(Math.random() * 8, Math.random() * 8, 0),
      });
    }
  }

  // Water Ripple on Pond & River
  public spawnWaterRipple(position: THREE.Vector3, initialRadius = 0.4) {
    const rippleMat = new THREE.MeshBasicMaterial({
      color: 0x90e0ef,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const ring = new THREE.Mesh(this.ringGeo, rippleMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(position.x, position.y + 0.04, position.z);
    ring.scale.set(initialRadius, initialRadius, 1);

    this.group.add(ring);
    this.particles.push({
      mesh: ring,
      velocity: new THREE.Vector3(0, 0, 0),
      life: 0,
      maxLife: 0.85,
      scaleDelta: 2.8,
    });
  }

  // Water Splash Droplets
  public spawnWaterSplash(position: THREE.Vector3) {
    for (let i = 0; i < 7; i++) {
      const drop = new THREE.Mesh(this.sparkGeo, this.waterMat);
      drop.position.set(
        position.x + (Math.random() - 0.5) * 0.3,
        position.y + 0.1,
        position.z + (Math.random() - 0.5) * 0.3
      );
      drop.scale.set(0.6, 0.6, 0.6);

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 1.5;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        2.2 + Math.random() * 1.5,
        Math.sin(angle) * speed
      );

      this.group.add(drop);
      this.particles.push({
        mesh: drop,
        velocity: vel,
        life: 0,
        maxLife: 0.6,
        scaleDelta: -0.4,
      });
    }
  }

  // Enhanced Celebratory Crop Harvest Popping Burst
  public spawnHarvestPop(position: THREE.Vector3, colorHex = 0xffd166) {
    // 1. Expanding golden shockwave ring
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ring = new THREE.Mesh(this.ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(position.x, position.y + 0.1, position.z);

    this.group.add(ring);
    this.particles.push({
      mesh: ring,
      velocity: new THREE.Vector3(0, 0.3, 0),
      life: 0,
      maxLife: 0.7,
      scaleDelta: 3.2,
    });

    // 2. Bursting colorful stars & sparkles
    const starMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.95 });
    for (let i = 0; i < 16; i++) {
      const star = new THREE.Mesh(this.starGeo, starMat);
      star.position.set(position.x, position.y + 0.3, position.z);
      star.scale.set(0.85, 0.85, 0.85);

      const angle = (i * Math.PI * 2) / 16 + (Math.random() - 0.5) * 0.2;
      const speed = 1.8 + Math.random() * 2.2;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        3.2 + Math.random() * 2.5,
        Math.sin(angle) * speed
      );

      this.group.add(star);
      this.particles.push({
        mesh: star,
        velocity: vel,
        life: 0,
        maxLife: 0.85,
        scaleDelta: -0.6,
        rotDelta: new THREE.Vector3(Math.random() * 6, Math.random() * 6, 0),
      });
    }
  }

  public update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.group.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      // Orbital vortex motion if specified
      if (p.orbitCenter && p.orbitRadius !== undefined && p.orbitAngle !== undefined && p.orbitSpeed !== undefined) {
        p.orbitAngle += p.orbitSpeed * delta;
        p.mesh.position.x = p.orbitCenter.x + Math.cos(p.orbitAngle) * p.orbitRadius;
        p.mesh.position.z = p.orbitCenter.z + Math.sin(p.orbitAngle) * p.orbitRadius;
        p.mesh.position.y += p.velocity.y * delta;
      } else {
        // Linear velocity integration
        p.mesh.position.addScaledVector(p.velocity, delta);
      }

      // Rotation updates
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

    // Update Floating Damage / Heal / Shield Text Sprites
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const dt = this.damageTexts[i];
      dt.life += delta;
      if (dt.life >= dt.maxLife) {
        this.group.remove(dt.sprite);
        dt.sprite.material.map?.dispose();
        dt.sprite.material.dispose();
        this.damageTexts.splice(i, 1);
        continue;
      }

      dt.sprite.position.addScaledVector(dt.velocity, delta);
      dt.velocity.y = Math.max(0.4, dt.velocity.y - delta * 2.2);

      const progress = dt.life / dt.maxLife;
      const scaleMult = progress < 0.2 ? 1.0 + Math.sin((progress / 0.2) * Math.PI * 0.5) * 0.35 : 1.35 - (progress - 0.2) * 0.4;
      dt.sprite.scale.set(dt.baseScale * scaleMult, dt.baseScale * scaleMult * 0.375, 1.0);
      dt.sprite.material.opacity = Math.max(0, 1.0 - Math.pow(progress, 2.0));
    }
  }

  public dispose() {
    this.particles.forEach((p) => this.group.remove(p.mesh));
    this.particles = [];
    this.damageTexts.forEach((dt) => {
      this.group.remove(dt.sprite);
      dt.sprite.material.map?.dispose();
      dt.sprite.material.dispose();
    });
    this.damageTexts = [];
  }
}
