import * as THREE from 'three';
import { PlayerMeshGroup, PetMeshGroup } from './proceduralModels';

// Pre-allocated math variables for high-performance zero-GC loop
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _vecC = new THREE.Vector3();
const _targetScale = new THREE.Vector3(1, 1, 1);

export type CharacterAnimState =
  | 'idle'
  | 'walking'
  | 'running'
  | 'jumping'
  | 'falling'
  | 'landing'
  | 'attacking'
  | 'skill_casting'
  | 'taking_damage'
  | 'stunned'
  | 'victory'
  | 'defeat';

export interface PlayerAnimContext {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  horizontalSpeed: number;
  isGrounded: boolean;
  isJumping: boolean;
  isFalling: boolean;
  isLanding: boolean;
  landingTimer: number; // 0 to 1 countdown
  isAttacking: boolean;
  attackTimer: number;
  isCastingSkill: boolean;
  skillId?: string | null;
  skillPhase: 'anticipation' | 'execution' | 'recovery';
  skillTimer: number;
  isTakingDamage: boolean;
  damageTimer: number;
  isStunned: boolean;
  stunTimer: number;
  isVictory: boolean;
  isDefeat: boolean;
  walkCycle: number;
}

export interface PetAnimContext {
  petId: string;
  species: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  speed: number;
  isGrounded: boolean;
  isFollowing: boolean;
  targetPos: THREE.Vector3;
  distToTarget: number;
  isCastingSkill: boolean;
  skillPhase: 'anticipation' | 'execution' | 'recovery';
  skillTimer: number;
  isTakingDamage: boolean;
  damageTimer: number;
  isStunned: boolean;
  stunTimer: number;
  isVictory: boolean;
  isDefeat: boolean;
  animTime: number;
  slotIndex: number;
}

export interface FarmObstacle {
  x: number;
  z: number;
  radius: number;
  name: string;
}

// Fixed obstacles in the Farm Haven world
export const FARM_OBSTACLES: FarmObstacle[] = [
  { x: -2, z: -10, radius: 3.8, name: 'farmhouse' },
  { x: 10, z: -11, radius: 4.2, name: 'barn' },
  { x: -15, z: 5, radius: 2.8, name: 'windmill' },
  { x: 4, z: 1, radius: 1.8, name: 'well' },
  { x: 6, z: -2, radius: 2.4, name: 'seed_stall' },
  { x: -12, z: -10, radius: 3.2, name: 'portal' },
  { x: 23, z: -8, radius: 2.6, name: 'quarry_1' },
  { x: 25, z: 4, radius: 2.6, name: 'quarry_2' },
  { x: -11, z: -2, radius: 2.2, name: 'fox_den' },
];

/**
 * Procedural Player Animation Controller
 * Handles smooth state transitions, running/walking cycles, foot placement,
 * jump arcs, landing impacts, skill casting stances, damage flinches, and victory/defeat.
 */
export class PlayerAnimator {
  private currentWalkCycle = 0;
  private currentRunBlend = 0; // 0 = walk, 1 = run
  private currentMoveBlend = 0; // 0 = idle, 1 = moving
  private torsoBaseY = 0.72;
  private headBaseY = 1.24;

  public update(playerMesh: PlayerMeshGroup, ctx: PlayerAnimContext, delta: number) {
    const ud = playerMesh.userData;
    if (!ud.torso || !ud.head || !ud.leftLeg || !ud.rightLeg || !ud.leftArm || !ud.rightArm) return;

    const speed = ctx.horizontalSpeed;
    const isMoving = speed > 0.15;
    const targetMoveBlend = isMoving ? 1.0 : 0.0;
    this.currentMoveBlend = THREE.MathUtils.damp(this.currentMoveBlend, targetMoveBlend, 12, delta);

    const isRunning = speed >= 5.0;
    const targetRunBlend = isRunning ? 1.0 : 0.0;
    this.currentRunBlend = THREE.MathUtils.damp(this.currentRunBlend, targetRunBlend, 8, delta);

    // Synchronize gait frequency with ground velocity so foot placement doesn't slide
    const gaitSpeed = THREE.MathUtils.lerp(speed * 2.1, speed * 2.8, this.currentRunBlend);
    this.currentWalkCycle += delta * (isMoving ? gaitSpeed : 1.6);
    const cycle = this.currentWalkCycle;

    // Reset base transforms
    playerMesh.scale.lerp(_targetScale, Math.min(delta * 10, 1));
    ud.head.rotation.set(0, 0, 0);
    ud.torso.rotation.set(0, 0, 0);

    // ==========================================
    // 1. DEFEAT STATE (Collapsed on knees)
    // ==========================================
    if (ctx.isDefeat) {
      playerMesh.position.y = -0.32;
      ud.torso.position.y = this.torsoBaseY - 0.25;
      ud.torso.rotation.x = 0.55; // Slumped forward
      ud.head.position.y = this.headBaseY - 0.28;
      ud.head.rotation.x = 0.45; // Bowed head

      // Kneeling legs
      ud.leftLeg.rotation.x = 1.45;
      ud.rightLeg.rotation.x = 1.45;
      ud.leftLeg.rotation.z = -0.15;
      ud.rightLeg.rotation.z = 0.15;

      // Limp drooping arms
      ud.leftArm.rotation.set(0.25, 0, -0.2);
      ud.rightArm.rotation.set(0.25, 0, 0.2);
      return;
    }

    // ==========================================
    // 2. VICTORY STATE (Joyful jumping & cheering)
    // ==========================================
    if (ctx.isVictory) {
      const cheerCycle = cycle * 4.5;
      const hop = Math.abs(Math.sin(cheerCycle)) * 0.45;
      playerMesh.position.y = hop;

      ud.torso.position.y = this.torsoBaseY + hop * 0.2;
      ud.torso.rotation.y = Math.sin(cheerCycle * 0.5) * 0.2;
      ud.head.position.y = this.headBaseY + hop * 0.2;
      ud.head.rotation.x = -0.3; // Looking up proudly

      // Pumping both fists in the air
      ud.leftArm.rotation.x = -2.7 + Math.sin(cheerCycle) * 0.4;
      ud.rightArm.rotation.x = -2.7 - Math.sin(cheerCycle) * 0.4;
      ud.leftArm.rotation.z = -0.35;
      ud.rightArm.rotation.z = 0.35;

      // Happy kick legs
      ud.leftLeg.rotation.x = Math.sin(cheerCycle) * 0.45;
      ud.rightLeg.rotation.x = -Math.sin(cheerCycle) * 0.45;
      return;
    }

    // ==========================================
    // 3. STUNNED STATE (Dizzy wobble & stars)
    // ==========================================
    if (ctx.isStunned) {
      const stunCycle = cycle * 3.5;
      ud.torso.position.y = this.torsoBaseY + Math.sin(stunCycle * 2) * 0.03;
      ud.torso.rotation.z = Math.sin(stunCycle) * 0.12;
      ud.torso.rotation.x = Math.cos(stunCycle) * 0.08;

      // Head rolling in dizzy circles
      ud.head.rotation.z = Math.sin(stunCycle * 1.5) * 0.28;
      ud.head.rotation.x = Math.cos(stunCycle * 1.5) * 0.22;
      ud.head.rotation.y = Math.sin(stunCycle * 0.8) * 0.35;

      // Limp swaying arms
      ud.leftArm.rotation.x = 0.2 + Math.sin(stunCycle) * 0.15;
      ud.rightArm.rotation.x = 0.2 - Math.sin(stunCycle) * 0.15;
      ud.leftLeg.rotation.x *= 0.85;
      ud.rightLeg.rotation.x *= 0.85;
      return;
    }

    // ==========================================
    // 4. TAKING DAMAGE STATE (Flinch & recoil)
    // ==========================================
    if (ctx.isTakingDamage && ctx.damageTimer > 0) {
      const flinchPct = ctx.damageTimer / 0.25; // 0 to 1
      const recoil = Math.sin(flinchPct * Math.PI);

      ud.torso.position.y = this.torsoBaseY + recoil * 0.08;
      ud.torso.position.z = -recoil * 0.15; // Knocked backward
      ud.torso.rotation.x = -recoil * 0.35; // Chest heaves back
      ud.head.rotation.x = -recoil * 0.45; // Head snaps back

      // Defensive flail arms
      ud.leftArm.rotation.x = -0.8 * recoil;
      ud.rightArm.rotation.x = -0.8 * recoil;
      ud.leftArm.rotation.z = -0.5 * recoil;
      ud.rightArm.rotation.z = 0.5 * recoil;

      ud.leftLeg.rotation.x = 0.3 * recoil;
      ud.rightLeg.rotation.x = -0.3 * recoil;
      return;
    }

    // ==========================================
    // 5. SKILL CASTING (Custom poses per skill)
    // ==========================================
    if (ctx.isCastingSkill) {
      const phase = ctx.skillPhase;
      const t = ctx.skillTimer;

      if (ctx.skillId === 'pet_fox') {
        // Flame Dash: Low athletic sprint lean, arms swept back like ninja
        ud.torso.position.y = this.torsoBaseY - 0.15;
        ud.torso.rotation.x = 0.55; // Strong forward lean
        ud.head.rotation.x = -0.4; // Eyes locked on horizon
        ud.leftArm.rotation.set(0.9, 0, -0.4);
        ud.rightArm.rotation.set(0.9, 0, 0.4);
        ud.leftLeg.rotation.x = Math.sin(cycle * 3) * 0.8;
        ud.rightLeg.rotation.x = -Math.sin(cycle * 3) * 0.8;
        return;
      }

      if (ctx.skillId === 'pet_turtle') {
        // Tidal Barrier: Hunker down, arms raised outwards summoning water dome
        ud.torso.position.y = this.torsoBaseY - 0.12;
        ud.torso.rotation.x = -0.15;
        ud.leftArm.rotation.set(-1.4, 0, -0.9);
        ud.rightArm.rotation.set(-1.4, 0, 0.9);
        ud.leftLeg.rotation.z = 0.2;
        ud.rightLeg.rotation.z = -0.2;
        return;
      }

      if (ctx.skillId === 'pet_bear') {
        // Earthshatter: Anticipation rears arms high up, execution slams down
        if (phase === 'anticipation') {
          ud.torso.position.y = this.torsoBaseY + 0.12;
          ud.torso.rotation.x = -0.35; // Arched back
          ud.head.rotation.x = -0.25;
          ud.leftArm.rotation.set(-2.6, 0, -0.3);
          ud.rightArm.rotation.set(-2.6, 0, 0.3);
        } else {
          // Slamming into ground
          ud.torso.position.y = this.torsoBaseY - 0.22;
          ud.torso.rotation.x = 0.65;
          ud.head.rotation.x = 0.4;
          ud.leftArm.rotation.set(0.5, 0, -0.1);
          ud.rightArm.rotation.set(0.5, 0, 0.1);
        }
        return;
      }

      if (ctx.skillId === 'pet_rabbit') {
        // Phantom Leap: Deep crouch squat anticipation before launch
        if (phase === 'anticipation') {
          playerMesh.scale.set(1.22, 0.65, 1.22);
          ud.torso.position.y = this.torsoBaseY - 0.28;
          ud.leftLeg.rotation.x = 0.8;
          ud.rightLeg.rotation.x = 0.8;
          ud.leftArm.rotation.set(-0.6, 0, -0.4);
          ud.rightArm.rotation.set(-0.6, 0, 0.4);
          return;
        }
      }

      if (ctx.skillId === 'pet_owl') {
        // Cyclone: Outstretched channeling arm directing the vortex
        ud.torso.rotation.y = 0.4;
        ud.rightArm.rotation.set(-1.8, 0, 0.2);
        ud.leftArm.rotation.set(-0.4, 0, -0.5);
        return;
      }

      if (ctx.skillId === 'pet_slime') {
        // Arcane Burst: Hovering casting pose with floating pulse
        ud.torso.position.y = this.torsoBaseY + 0.15 + Math.sin(cycle * 4) * 0.05;
        ud.leftArm.rotation.set(-1.6, 0, -0.7);
        ud.rightArm.rotation.set(-1.6, 0, 0.7);
        return;
      }
    }

    // ==========================================
    // 6. AIRBORNE: JUMPING, FALLING, LANDING
    // ==========================================
    if (!ctx.isGrounded) {
      if (ctx.isJumping) {
        // Rising: Arms up slightly, legs tucked up into chest
        ud.torso.position.y = this.torsoBaseY + 0.05;
        ud.torso.rotation.x = -0.1;
        ud.leftLeg.rotation.x = 0.55;
        ud.rightLeg.rotation.x = 0.35;
        ud.leftArm.rotation.set(-1.6, 0, -0.35);
        ud.rightArm.rotation.set(-1.6, 0, 0.35);
      } else if (ctx.isFalling) {
        // Falling: Torso tilts forward, limbs spread for balance
        ud.torso.rotation.x = 0.2;
        ud.leftLeg.rotation.x = -0.3;
        ud.rightLeg.rotation.x = -0.2;
        ud.leftArm.rotation.set(-0.8, 0, -0.7);
        ud.rightArm.rotation.set(-0.8, 0, 0.7);
      }
      return;
    }

    // Landing squash & recovery
    if (ctx.isLanding && ctx.landingTimer > 0) {
      const landPct = ctx.landingTimer; // 1 down to 0
      const squash = Math.sin(landPct * Math.PI) * 0.28;
      playerMesh.scale.set(1 + squash * 0.8, 1 - squash, 1 + squash * 0.8);
      ud.torso.position.y = this.torsoBaseY - squash * 0.35;
      ud.leftLeg.rotation.x = squash * 1.1;
      ud.rightLeg.rotation.x = squash * 1.1;
      ud.leftArm.rotation.set(-0.4 * squash, 0, -0.4 * squash);
      ud.rightArm.rotation.set(-0.4 * squash, 0, 0.4 * squash);
      return;
    }

    // ==========================================
    // 7. GROUND MOVEMENT: WALKING & RUNNING
    // ==========================================
    if (this.currentMoveBlend > 0.05) {
      const mb = this.currentMoveBlend;
      const rb = this.currentRunBlend;

      // Swing amplitude scales smoothly between walk and run
      const legAmp = THREE.MathUtils.lerp(0.55, 0.95, rb) * mb;
      const armAmp = THREE.MathUtils.lerp(0.48, 0.85, rb) * mb;

      // Leg swing (sinusoidal natural stride)
      const legAngle = Math.sin(cycle) * legAmp;
      ud.leftLeg.rotation.x = legAngle;
      ud.rightLeg.rotation.x = -legAngle;

      // Slight knee bend on backswing
      ud.leftLeg.rotation.z = Math.sin(cycle * 0.5) * 0.05 * mb;
      ud.rightLeg.rotation.z = -Math.sin(cycle * 0.5) * 0.05 * mb;

      // Arm counter-swing (opposite to legs)
      ud.leftArm.rotation.x = -legAngle * (armAmp / legAmp);
      ud.rightArm.rotation.x = legAngle * (armAmp / legAmp);

      // Inward arm angle during running pump
      ud.leftArm.rotation.z = THREE.MathUtils.lerp(-0.08, -0.22, rb);
      ud.rightArm.rotation.z = THREE.MathUtils.lerp(0.08, 0.22, rb);

      // Torso vertical bounce (two bounces per full gait cycle)
      const bounce = Math.abs(Math.sin(cycle)) * THREE.MathUtils.lerp(0.035, 0.08, rb) * mb;
      ud.torso.position.y = this.torsoBaseY + bounce;

      // Torso forward lean into movement (athletic posture when running)
      ud.torso.rotation.x = THREE.MathUtils.lerp(0.06, 0.22, rb) * mb;

      // Torso pelvic twist
      ud.torso.rotation.y = Math.sin(cycle) * THREE.MathUtils.lerp(0.06, 0.14, rb) * mb;

      // Head keeps gaze forward and stabilizes against torso bounce
      ud.head.position.y = this.headBaseY + bounce * 0.7;
      ud.head.rotation.x = -ud.torso.rotation.x * 0.6;
      ud.head.rotation.y = -ud.torso.rotation.y * 0.4;
      return;
    }

    // ==========================================
    // 8. IDLE STATE (Gentle breathing, weight shift)
    // ==========================================
    const idleCycle = cycle * 1.2;
    const breath = Math.sin(idleCycle) * 0.025;
    const sway = Math.sin(idleCycle * 0.5) * 0.015;

    ud.torso.position.y = this.torsoBaseY + breath;
    ud.torso.rotation.z = sway;
    ud.head.position.y = this.headBaseY + breath * 0.8;
    ud.head.rotation.z = -sway * 0.5;

    // Arms relax by the sides with slight breathing sway
    ud.leftArm.rotation.x = THREE.MathUtils.damp(ud.leftArm.rotation.x, breath * 1.5, 8, delta);
    ud.rightArm.rotation.x = THREE.MathUtils.damp(ud.rightArm.rotation.x, breath * 1.5, 8, delta);
    ud.leftArm.rotation.z = THREE.MathUtils.damp(ud.leftArm.rotation.z, -0.06, 8, delta);
    ud.rightArm.rotation.z = THREE.MathUtils.damp(ud.rightArm.rotation.z, 0.06, 8, delta);

    ud.leftLeg.rotation.x = THREE.MathUtils.damp(ud.leftLeg.rotation.x, 0, 10, delta);
    ud.rightLeg.rotation.x = THREE.MathUtils.damp(ud.rightLeg.rotation.x, 0, 10, delta);
  }
}

/**
 * Universal Procedural Pet Animator
 * Implements personality-specific movement, idle behaviors, and combat animations for:
 * Fox, Turtle, Rabbit, Owl, Bear, Slime, and variants.
 */
export class PetAnimator {
  public update(petMesh: PetMeshGroup, ctx: PetAnimContext, delta: number) {
    const species = ctx.species;
    const animTime = ctx.animTime;
    const speed = ctx.speed;
    const isMoving = speed > 0.15;

    // Reset base transform
    petMesh.scale.lerp(_targetScale, Math.min(delta * 12, 1));

    switch (species) {
      case 'fox':
      case 'wolf':
      case 'deer':
        this.updateFox(petMesh, ctx, delta);
        break;
      case 'turtle':
        this.updateTurtle(petMesh, ctx, delta);
        break;
      case 'rabbit':
        this.updateRabbit(petMesh, ctx, delta);
        break;
      case 'owl':
      case 'dragon':
      case 'phoenix':
        this.updateOwl(petMesh, ctx, delta);
        break;
      case 'bear':
        this.updateBear(petMesh, ctx, delta);
        break;
      case 'slime':
      case 'frog':
      default:
        this.updateSlime(petMesh, ctx, delta);
        break;
    }
  }

  // ----------------------------------------------------
  // 1. FOX (Ember): Agile, playful, springy trot, flame tail
  // ----------------------------------------------------
  private updateFox(mesh: PetMeshGroup, ctx: PetAnimContext, delta: number) {
    const ud = mesh.userData;
    const legs = ud.legs;
    const tail = ud.tail;
    const head = ud.head;
    const anim = ctx.animTime;
    const speed = ctx.speed;
    const isMoving = speed > 0.15;

    // Skill Casting: Flame Dash fiery spin & charge
    if (ctx.isCastingSkill) {
      if (ctx.skillPhase === 'anticipation') {
        // Coils back, lowering front body like a stalking predator
        mesh.position.y = 0.08;
        if (head) head.rotation.x = -0.3;
        if (tail) tail.rotation.y = Math.sin(anim * 24) * 0.7; // rapid tail wag
        if (legs) {
          legs[0].rotation.x = 0.5;
          legs[1].rotation.x = 0.5;
          legs[2].rotation.x = -0.4;
          legs[3].rotation.x = -0.4;
        }
        return;
      } else {
        // Dash release: Long forward bound, tail streaming flat
        mesh.position.y = 0.25;
        if (tail) tail.rotation.x = -0.2;
        if (legs) {
          legs[0].rotation.x = -0.8;
          legs[1].rotation.x = -0.8;
          legs[2].rotation.x = 0.9;
          legs[3].rotation.x = 0.9;
        }
        return;
      }
    }

    // Damage Flinch
    if (ctx.isTakingDamage && ctx.damageTimer > 0) {
      const flinch = Math.sin((ctx.damageTimer / 0.25) * Math.PI);
      mesh.position.y = flinch * 0.15;
      if (head) head.rotation.x = -flinch * 0.4;
      if (tail) tail.rotation.x = -0.6; // Tuck tail
      return;
    }

    if (isMoving) {
      // Quadruped trot / gallop cycle
      const isGallop = speed > 5.2;
      const gaitFreq = isGallop ? speed * 2.8 : speed * 2.2;
      const t = anim * gaitFreq;

      if (legs && legs.length >= 4) {
        if (!isGallop) {
          // Diagonal trot gait (FL + BR swing together, FR + BL swing opposite)
          const swing = Math.sin(t) * 0.65;
          legs[0].rotation.x = swing;
          legs[1].rotation.x = -swing;
          legs[2].rotation.x = -swing;
          legs[3].rotation.x = swing;
        } else {
          // Galloping bound (front pair and back pair phase-shifted)
          const fSwing = Math.sin(t) * 0.85;
          const bSwing = Math.sin(t + 1.2) * 0.85;
          legs[0].rotation.x = fSwing;
          legs[1].rotation.x = fSwing;
          legs[2].rotation.x = bSwing;
          legs[3].rotation.x = bSwing;
        }
      }

      // Playful tail sway in flight
      if (tail) {
        tail.rotation.y = Math.sin(t * 0.9) * 0.6;
        tail.rotation.z = Math.cos(t * 0.9) * 0.25;
      }

      // Head bobbing with sprint
      if (head) {
        head.rotation.x = Math.sin(t) * 0.12;
      }

      // Body bounding vertical hop
      mesh.position.y = Math.abs(Math.sin(t)) * (isGallop ? 0.12 : 0.05);
    } else {
      // Playful idle: head tilts, tail wagging, sniffing
      const idleT = anim * 2.0 + ctx.slotIndex * 1.5;
      mesh.position.y = Math.sin(idleT) * 0.02;

      // Smooth happy tail wag (dual axis wave)
      if (tail) {
        tail.rotation.y = Math.sin(anim * 4.2) * 0.45;
        tail.rotation.x = -Math.PI / 3 + Math.sin(anim * 2.1) * 0.1;
      }

      // Inquisitive head tilt every few seconds
      if (head) {
        const tiltPhase = Math.sin(anim * 0.8);
        head.rotation.z = tiltPhase > 0.4 ? 0.22 : tiltPhase < -0.4 ? -0.22 : 0;
        head.rotation.y = Math.sin(anim * 1.4) * 0.25;
      }

      // Rest legs
      if (legs) {
        legs.forEach((leg) => {
          leg.rotation.x = THREE.MathUtils.damp(leg.rotation.x, 0, 10, delta);
        });
      }
    }
  }

  // ----------------------------------------------------
  // 2. TURTLE (Shelly): Heavy, deliberate, defensive shell
  // ----------------------------------------------------
  private updateTurtle(mesh: PetMeshGroup, ctx: PetAnimContext, delta: number) {
    const ud = mesh.userData;
    const legs = ud.legs;
    const head = ud.head;
    const body = ud.body;
    const anim = ctx.animTime;
    const speed = ctx.speed;
    const isMoving = speed > 0.15;

    // Skill: Tidal Barrier - retracts into shell, stomps outward
    if (ctx.isCastingSkill) {
      if (ctx.skillPhase === 'anticipation') {
        // Defensive tuck into shell
        if (head) head.position.z = THREE.MathUtils.damp(head.position.z, 0.18, 14, delta);
        if (legs) {
          legs.forEach((leg) => {
            leg.position.y = 0.04;
          });
        }
        mesh.scale.set(1.15, 0.8, 1.15);
        return;
      } else {
        // Release: pops head out, heavy stomp shockwave
        if (head) head.position.z = THREE.MathUtils.damp(head.position.z, 0.45, 14, delta);
        mesh.scale.set(1.2, 1.15, 1.2);
        return;
      }
    }

    // Hit Reaction: pulls head back into shell defensively
    if (ctx.isTakingDamage && ctx.damageTimer > 0) {
      if (head) head.position.z = 0.22;
      mesh.scale.set(1.08, 0.9, 1.08);
      return;
    }

    if (head) head.position.z = THREE.MathUtils.damp(head.position.z, 0.42, 8, delta);

    if (isMoving) {
      // Slow, heavy rowing flipper crawl
      const crawlFreq = speed * 2.4;
      const t = anim * crawlFreq;

      if (legs && legs.length >= 4) {
        legs[0].rotation.y = Math.PI / 4 + Math.sin(t) * 0.45;
        legs[1].rotation.y = -Math.PI / 4 - Math.sin(t) * 0.45;
        legs[2].rotation.y = -Math.PI / 4 + Math.cos(t) * 0.4;
        legs[3].rotation.y = Math.PI / 4 - Math.cos(t) * 0.4;
      }

      // Side-to-side shell wobble
      if (body) {
        body.rotation.z = Math.sin(t) * 0.08;
        body.rotation.y = Math.cos(t) * 0.05;
      }

      mesh.position.y = Math.abs(Math.sin(t * 2)) * 0.03;
    } else {
      // Calm, sturdy idle: gentle shell sway
      const idleT = anim * 1.2 + ctx.slotIndex;
      if (body) {
        body.rotation.z = Math.sin(idleT) * 0.03;
        body.rotation.y = 0;
      }
      if (head) {
        head.rotation.y = Math.sin(idleT * 0.7) * 0.12;
      }
      if (legs) {
        legs.forEach((leg) => {
          leg.rotation.y = THREE.MathUtils.damp(leg.rotation.y, 0, 8, delta);
        });
      }
      mesh.position.y = Math.sin(idleT) * 0.015;
    }
  }

  // ----------------------------------------------------
  // 3. RABBIT (Hoppy): Bouncy, twitchy ears, leaping bounds
  // ----------------------------------------------------
  private updateRabbit(mesh: PetMeshGroup, ctx: PetAnimContext, delta: number) {
    const ud = mesh.userData;
    const legs = ud.legs;
    const head = ud.head;
    const ears = ud.ears;
    const anim = ctx.animTime;
    const speed = ctx.speed;
    const isMoving = speed > 0.15;

    // Skill: Phantom Leap - deep crouch -> skyrocket -> ground slam squash
    if (ctx.isCastingSkill) {
      if (ctx.skillPhase === 'anticipation') {
        mesh.scale.set(1.35, 0.55, 1.35); // Deep squash
        if (ears) {
          ears[0].rotation.x = 0.5;
          ears[1].rotation.x = 0.5;
        }
        return;
      } else {
        mesh.scale.set(0.8, 1.45, 0.8); // High stretch in flight
        return;
      }
    }

    if (isMoving) {
      // Classic rabbit hop cycle (push off -> stretch -> land squash)
      const hopFreq = speed * 3.2;
      const t = anim * hopFreq;
      const hopPhase = Math.sin(t);
      const isAirborne = hopPhase > 0;

      if (isAirborne) {
        mesh.position.y = hopPhase * 0.32;
        mesh.scale.set(0.9, 1.15, 0.9); // Stretched
        if (ears) {
          ears[0].rotation.x = -0.45; // Ears blow back in wind
          ears[1].rotation.x = -0.45;
        }
      } else {
        mesh.position.y = 0;
        mesh.scale.set(1.15, 0.85, 1.15); // Squash on touchdown
        if (ears) {
          ears[0].rotation.x = 0.2;
          ears[1].rotation.x = 0.2;
        }
      }

      if (legs && legs.length >= 4) {
        const legSwing = Math.sin(t) * 0.7;
        legs[0].rotation.x = legSwing;
        legs[1].rotation.x = legSwing;
        legs[2].rotation.x = -legSwing;
        legs[3].rotation.x = -legSwing;
      }
    } else {
      // Bouncy idle: sitting upright, independent ear twitches, happy double hop
      const idleT = anim * 2.5 + ctx.slotIndex * 2;
      const miniHop = Math.max(0, Math.sin(idleT * 1.5)) * 0.08;
      mesh.position.y = miniHop;

      // Independent ear wiggles
      if (ears && ears.length >= 2) {
        ears[0].rotation.z = -0.1 + Math.sin(anim * 5.2) * 0.15;
        ears[1].rotation.z = 0.1 + Math.sin(anim * 4.8 + 1) * 0.15;
        ears[0].rotation.x = Math.sin(anim * 2.2) * 0.1;
        ears[1].rotation.x = Math.cos(anim * 2.2) * 0.1;
      }

      // Nose sniffing head motion
      if (head) {
        head.rotation.x = Math.sin(anim * 8.0) * 0.05;
        head.rotation.y = Math.sin(anim * 1.8) * 0.2;
      }

      if (legs) {
        legs.forEach((leg) => {
          leg.rotation.x = THREE.MathUtils.damp(leg.rotation.x, 0, 10, delta);
        });
      }
    }
  }

  // ----------------------------------------------------
  // 4. OWL (Barnaby): Floating, graceful wings, 180° head snaps
  // ----------------------------------------------------
  private updateOwl(mesh: PetMeshGroup, ctx: PetAnimContext, delta: number) {
    const ud = mesh.userData;
    const wings = ud.wings;
    const head = ud.head;
    const anim = ctx.animTime;
    const speed = ctx.speed;
    const isMoving = speed > 0.15;

    // Owl hovers naturally at y = 0.45 to 0.75
    const baseHoverY = 0.55;

    // Skill: Cyclone - spreads wings wide, flurry of wind flaps
    if (ctx.isCastingSkill) {
      mesh.position.y = baseHoverY + 0.35 + Math.sin(anim * 18) * 0.12;
      if (wings && wings.length >= 2) {
        const flap = Math.sin(anim * 28) * 1.2;
        wings[0].rotation.z = -flap;
        wings[1].rotation.z = flap;
      }
      return;
    }

    if (isMoving) {
      // Aerodynamic flight: banking into turns, wing flap cycle
      const flapFreq = speed * 2.4;
      const flap = Math.sin(anim * flapFreq);
      mesh.position.y = baseHoverY + Math.sin(anim * 3.5) * 0.12;

      // Wings flapping
      if (wings && wings.length >= 2) {
        wings[0].rotation.z = -0.3 - Math.abs(flap) * 0.95;
        wings[1].rotation.z = 0.3 + Math.abs(flap) * 0.95;
        wings[0].rotation.x = flap * 0.3;
        wings[1].rotation.x = flap * 0.3;
      }

      // Banking into movement direction
      const turnAngle = Math.sin(anim * 1.5) * 0.18;
      mesh.rotation.z = THREE.MathUtils.damp(mesh.rotation.z, turnAngle, 6, delta);

      // Head stabilizes horizon
      if (head) {
        head.rotation.z = -mesh.rotation.z;
        head.rotation.x = 0.15; // looking forward-down
      }
    } else {
      // Gentle hover idle with rhythmic wing flaps and famous owl head snap
      mesh.position.y = baseHoverY + Math.sin(anim * 2.4) * 0.08;
      mesh.rotation.z = THREE.MathUtils.damp(mesh.rotation.z, 0, 8, delta);

      if (wings && wings.length >= 2) {
        const softFlap = Math.sin(anim * 3.8) * 0.35;
        wings[0].rotation.z = -0.15 - softFlap;
        wings[1].rotation.z = 0.15 + softFlap;
      }

      // Famous Owl 180-degree head swivel snap!
      if (head) {
        const swivelCycle = Math.sin(anim * 0.4 + ctx.slotIndex);
        const snapLook = swivelCycle > 0.6 ? 1.4 : swivelCycle < -0.6 ? -1.4 : 0;
        head.rotation.y = THREE.MathUtils.damp(head.rotation.y, snapLook, 16, delta);
        head.rotation.x = Math.sin(anim * 1.5) * 0.06;
      }
    }
  }

  // ----------------------------------------------------
  // 5. BEAR (Grizz): Massive, heavy lumber, two-legged roar
  // ----------------------------------------------------
  private updateBear(mesh: PetMeshGroup, ctx: PetAnimContext, delta: number) {
    const ud = mesh.userData;
    const legs = ud.legs;
    const head = ud.head;
    const body = ud.body;
    const anim = ctx.animTime;
    const speed = ctx.speed;
    const isMoving = speed > 0.15;

    // Skill: Earthshatter - rears onto 2 legs with raised paws -> slams down
    if (ctx.isCastingSkill) {
      if (ctx.skillPhase === 'anticipation') {
        // Rearing up tall on hind paws
        mesh.position.y = 0.35;
        if (body) body.rotation.x = -0.7; // Rear up
        if (head) head.rotation.x = -0.4;
        if (legs && legs.length >= 4) {
          legs[0].rotation.x = -1.9; // Front paws raised high
          legs[1].rotation.x = -1.9;
          legs[2].rotation.x = 0.35;
          legs[3].rotation.x = 0.35;
        }
        return;
      } else {
        // Earth slam down
        mesh.position.y = 0;
        if (body) body.rotation.x = 0.3;
        if (legs && legs.length >= 4) {
          legs[0].rotation.x = 0.4;
          legs[1].rotation.x = 0.4;
        }
        return;
      }
    }

    if (body) body.rotation.x = THREE.MathUtils.damp(body.rotation.x, 0, 10, delta);

    if (isMoving) {
      // Heavy quadruped lumbering gait with rolling shoulders
      const lumberFreq = speed * 2.0;
      const t = anim * lumberFreq;
      const swing = Math.sin(t) * 0.65;

      if (legs && legs.length >= 4) {
        legs[0].rotation.x = swing;
        legs[1].rotation.x = -swing;
        legs[2].rotation.x = -swing;
        legs[3].rotation.x = swing;
      }

      // Heavy body shoulder roll
      if (body) {
        body.rotation.z = Math.sin(t) * 0.12;
      }

      // Step bounce
      mesh.position.y = Math.abs(Math.sin(t)) * 0.08;
    } else {
      // Broad standing idle with heavy chest heaves
      const idleT = anim * 1.5 + ctx.slotIndex * 1.8;
      const heave = Math.sin(idleT) * 0.03;
      mesh.position.y = heave;

      if (body) {
        body.rotation.z = Math.sin(idleT * 0.5) * 0.04;
      }
      if (head) {
        head.rotation.y = Math.sin(idleT * 0.7) * 0.18;
      }
      if (legs) {
        legs.forEach((leg) => {
          leg.rotation.x = THREE.MathUtils.damp(leg.rotation.x, 0, 8, delta);
        });
      }
    }
  }

  // ----------------------------------------------------
  // 6. SLIME (Boba): Cartoon squash & stretch, jelly ripples
  // ----------------------------------------------------
  private updateSlime(mesh: PetMeshGroup, ctx: PetAnimContext, delta: number) {
    const ud = mesh.userData;
    const body = ud.body;
    const droplet = ud.head; // tiny orbiting droplet
    const anim = ctx.animTime;
    const speed = ctx.speed;
    const isMoving = speed > 0.15;

    // Skill: Arcane Burst - rapid ballooning and pulse
    if (ctx.isCastingSkill) {
      if (ctx.skillPhase === 'anticipation') {
        const pulse = 1.0 + Math.sin(anim * 35) * 0.35;
        mesh.scale.set(pulse * 1.25, 1 / pulse, pulse * 1.25);
        return;
      } else {
        mesh.scale.set(1.4, 0.7, 1.4);
        return;
      }
    }

    if (isMoving) {
      // Classic cartoon squash and stretch hop
      const hopFreq = speed * 3.4;
      const t = anim * hopFreq;
      const hopPhase = Math.sin(t);

      if (hopPhase > 0) {
        // Airborne: stretch tall
        mesh.position.y = hopPhase * 0.38;
        const stretch = 1 + hopPhase * 0.45;
        mesh.scale.set(1 / Math.sqrt(stretch), stretch, 1 / Math.sqrt(stretch));
      } else {
        // Touchdown: squash wide
        mesh.position.y = 0;
        const squash = 1 + Math.abs(hopPhase) * 0.4;
        mesh.scale.set(squash, 1 / (squash * squash), squash);
      }
    } else {
      // Jelly breathing pulse
      const breathT = anim * 2.8 + ctx.slotIndex * 1.4;
      const jellyPulse = 1.0 + Math.sin(breathT) * 0.08;
      mesh.scale.set(jellyPulse, 1 / Math.sqrt(jellyPulse), jellyPulse);
      mesh.position.y = Math.sin(breathT) * 0.03;
    }

    // Playful orbiting bubble droplet
    if (droplet) {
      const orbAngle = anim * 3.2;
      droplet.position.set(
        Math.cos(orbAngle) * 0.42,
        0.45 + Math.sin(orbAngle * 2) * 0.12,
        Math.sin(orbAngle) * 0.42
      );
    }
  }
}

/**
 * Formation & Flocking Following Controller
 * Prevents pets from clumping or clipping into each other.
 * Steers around world obstacles (farmhouse, barn, windmill, etc.).
 * Provides dynamic catch-up speeds when pets fall behind.
 */
export class PetFollowingController {
  // Pre-allocated formation offsets relative to player facing direction
  // Fan-out escort formation behind the player
  private static readonly FORMATION_OFFSETS = [
    { dist: 2.5, angle: Math.PI + 0.5 },  // Rear right flank
    { dist: 2.5, angle: Math.PI - 0.5 },  // Rear left flank
    { dist: 3.5, angle: Math.PI },        // Directly behind
    { dist: 3.6, angle: Math.PI + 1.0 },  // Far right flank
    { dist: 3.6, angle: Math.PI - 1.0 },  // Far left flank
    { dist: 4.6, angle: Math.PI + 0.4 },  // Second tier rear right
    { dist: 4.6, angle: Math.PI - 0.4 },  // Second tier rear left
  ];

  public updatePetPosition(
    petMesh: PetMeshGroup,
    playerPos: THREE.Vector3,
    playerRotY: THREE.Vector3 | number,
    slotIndex: number,
    otherPetMeshes: PetMeshGroup[],
    isWildGrounds: boolean,
    delta: number
  ): { velocity: THREE.Vector3; speed: number; distToTarget: number } {
    const rotY = typeof playerRotY === 'number' ? playerRotY : 0;
    const offsetCfg = PetFollowingController.FORMATION_OFFSETS[slotIndex % PetFollowingController.FORMATION_OFFSETS.length];

    // Compute desired target slot in world coordinates based on player facing direction
    const targetAngle = rotY + offsetCfg.angle;
    const targetX = playerPos.x + Math.sin(targetAngle) * offsetCfg.dist;
    const targetZ = playerPos.z + Math.cos(targetAngle) * offsetCfg.dist;

    _vecA.set(targetX, 0, targetZ);
    const distToTarget = petMesh.position.distanceTo(_vecA);
    const distToPlayer = petMesh.position.distanceTo(playerPos);

    // Teleport catch-up if far separated (e.g. initial spawn or map change)
    if (distToPlayer > 26.0) {
      petMesh.position.set(targetX, 0, targetZ);
      return { velocity: new THREE.Vector3(), speed: 0, distToTarget: 0 };
    }

    // Steering velocity
    _vecB.set(0, 0, 0);

    // 1. Seek target formation position
    if (distToTarget > 0.3) {
      const seekDir = _vecC.subVectors(_vecA, petMesh.position).normalize();
      // Dynamic catch-up speed scaling
      let desiredSpeed = 4.8;
      if (distToPlayer > 10.0) desiredSpeed = 11.5; // Swift sprint
      else if (distToPlayer > 6.0) desiredSpeed = 7.5; // Fast trot
      else if (distToTarget < 1.2) desiredSpeed = 3.2; // Slow approach

      _vecB.addScaledVector(seekDir, desiredSpeed);
    }

    // 2. Separation force between pets (avoid clumping / overlapping)
    const separationRadius = 1.25;
    otherPetMeshes.forEach((other) => {
      if (other === petMesh) return;
      const d = petMesh.position.distanceTo(other.position);
      if (d > 0.001 && d < separationRadius) {
        const pushDir = _vecC.subVectors(petMesh.position, other.position).normalize();
        const force = ((separationRadius - d) / separationRadius) * 4.5;
        _vecB.addScaledVector(pushDir, force);
      }
    });

    // 3. Obstacle Avoidance (Only on farm where buildings exist)
    if (!isWildGrounds) {
      FARM_OBSTACLES.forEach((obs) => {
        const dx = petMesh.position.x - obs.x;
        const dz = petMesh.position.z - obs.z;
        const dist = Math.hypot(dx, dz);
        if (dist < obs.radius + 0.8) {
          const pushMag = ((obs.radius + 0.8 - dist) / (obs.radius + 0.8)) * 6.0;
          _vecB.x += (dx / Math.max(0.1, dist)) * pushMag;
          _vecB.z += (dz / Math.max(0.1, dist)) * pushMag;
        }
      });
    }

    // Apply movement
    const moveLen = _vecB.length();
    if (moveLen > 0.05) {
      _vecB.normalize();
      const actualSpeed = Math.min(moveLen, 12.0);
      petMesh.position.addScaledVector(_vecB, actualSpeed * delta);

      // Smooth rotation toward movement direction
      const targetRotY = Math.atan2(_vecB.x, _vecB.z);
      const rotDiff = THREE.MathUtils.euclideanModulo(targetRotY - petMesh.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
      petMesh.rotation.y += rotDiff * Math.min(delta * 12, 1);

      return { velocity: _vecB.clone().multiplyScalar(actualSpeed), speed: actualSpeed, distToTarget };
    }

    return { velocity: new THREE.Vector3(), speed: 0, distToTarget };
  }
}
