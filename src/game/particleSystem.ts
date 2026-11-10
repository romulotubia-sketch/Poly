import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scaleDelta?: number;
  rotDelta?: THREE.Vector3;
}

export class ParticleSystem {
  public group: THREE.Group;
  private particles: Particle[] = [];

  // Reusable geometries
  private sparkGeo = new THREE.DodecahedronGeometry(0.12, 0);
  private ringGeo = new THREE.RingGeometry(0.2, 0.45, 16);
  private heartGeo = new THREE.OctahedronGeometry(0.14, 0);

  // Materials
  private fireMat = new THREE.MeshBasicMaterial({ color: 0xff5400 });
  private waterMat = new THREE.MeshBasicMaterial({ color: 0x48cae4, transparent: true, opacity: 0.85 });
  private windMat = new THREE.MeshBasicMaterial({ color: 0xd8f3dc, transparent: true, opacity: 0.8 });
  private earthMat = new THREE.MeshBasicMaterial({ color: 0xa68a64 });
  private healMat = new THREE.MeshBasicMaterial({ color: 0x70e000, transparent: true, opacity: 0.9 });
  private goldMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
  private heartMat = new THREE.MeshBasicMaterial({ color: 0xff4d6d });

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'particles';
  }

  // Flame Dash trail
  public spawnFlameTrail(position: THREE.Vector3) {
    for (let i = 0; i < 3; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, this.fireMat);
      mesh.position.copy(position);
      mesh.position.x += (Math.random() - 0.5) * 0.4;
      mesh.position.y += Math.random() * 0.3 + 0.1;
      mesh.position.z += (Math.random() - 0.5) * 0.4;

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.5, Math.random() * 1.5 + 0.5, (Math.random() - 0.5) * 0.5),
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
        scaleDelta: -0.6,
      });
    }
  }

  // Water Shield ring
  public spawnWaterBurst(position: THREE.Vector3, radius = 5) {
    const count = 32;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const mesh = new THREE.Mesh(this.sparkGeo, this.waterMat);
      mesh.position.set(position.x, position.y + 0.3, position.z);

      const speed = radius * 1.8;
      const vel = new THREE.Vector3(Math.cos(angle) * speed, 1.2 + Math.random() * 0.5, Math.sin(angle) * speed);

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

  // Wind Gust breeze
  public spawnWindGust(position: THREE.Vector3, dir: THREE.Vector3) {
    for (let i = 0; i < 20; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, this.windMat);
      mesh.position.copy(position);
      mesh.position.x += (Math.random() - 0.5) * 1.2;
      mesh.position.y += Math.random() * 0.8 + 0.2;
      mesh.position.z += (Math.random() - 0.5) * 1.2;

      const vel = dir.clone().multiplyScalar(9 + Math.random() * 4);
      vel.y += (Math.random() - 0.5) * 1.5;

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.9,
        scaleDelta: -0.2,
      });
    }
  }

  // Ground Slam Shockwave
  public spawnGroundSlam(position: THREE.Vector3, radius = 6) {
    // Expanding ground ring
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x936639,
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
      maxLife: 0.7,
      scaleDelta: radius * 2.2,
    });

    // Rock fragments flying up
    for (let i = 0; i < 18; i++) {
      const angle = (i * Math.PI * 2) / 18;
      const frag = new THREE.Mesh(this.sparkGeo, this.earthMat);
      frag.position.set(position.x, 0.2, position.z);

      const vel = new THREE.Vector3(Math.cos(angle) * (2 + Math.random() * 3), 3 + Math.random() * 2, Math.sin(angle) * (2 + Math.random() * 3));

      this.group.add(frag);
      this.particles.push({
        mesh: frag,
        velocity: vel,
        life: 0,
        maxLife: 0.75,
        scaleDelta: -0.4,
      });
    }
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

  public update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.group.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      // Physics integration
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Scale / Fade animation
      const progress = p.life / p.maxLife;
      if (p.scaleDelta) {
        const factor = Math.max(0.01, 1.0 + p.scaleDelta * progress);
        p.mesh.scale.set(factor, factor, factor);
      }

      // Opacity fade if material supports it
      const mat = p.mesh.material as THREE.Material;
      if ('opacity' in mat) {
        (mat as THREE.MeshBasicMaterial).opacity = Math.max(0, 1.0 - progress);
      }
    }
  }

  public dispose() {
    this.particles.forEach((p) => this.group.remove(p.mesh));
    this.particles = [];
  }
}
