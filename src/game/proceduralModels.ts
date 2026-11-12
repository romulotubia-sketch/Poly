import * as THREE from 'three';

// Low-poly materials cache for performance and clean aesthetic
const materials = {
  skin: new THREE.MeshStandardMaterial({ color: 0xffd1ba, roughness: 0.8 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 }),
  overalls: new THREE.MeshStandardMaterial({ color: 0x3a86ff, roughness: 0.7 }),
  shirt: new THREE.MeshStandardMaterial({ color: 0xffeedd, roughness: 0.85 }),
  boots: new THREE.MeshStandardMaterial({ color: 0x582f0e, roughness: 0.6 }),
  strawHat: new THREE.MeshStandardMaterial({ color: 0xf4a261, roughness: 0.95 }),
  hatRibbon: new THREE.MeshStandardMaterial({ color: 0xe76f51, roughness: 0.7 }),
  backpack: new THREE.MeshStandardMaterial({ color: 0x936639, roughness: 0.8 }),
  woodPlanks: new THREE.MeshStandardMaterial({ color: 0x7f4f24, roughness: 0.85 }),
  woodLight: new THREE.MeshStandardMaterial({ color: 0xb08968, roughness: 0.8 }),
  barnRed: new THREE.MeshStandardMaterial({ color: 0xba181b, roughness: 0.75 }),
  roofBlue: new THREE.MeshStandardMaterial({ color: 0x457b9d, roughness: 0.6 }),
  roofShingles: new THREE.MeshStandardMaterial({ color: 0x6b705c, roughness: 0.7 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x8d99ae, roughness: 0.9 }),
  stoneDark: new THREE.MeshStandardMaterial({ color: 0x5c677d, roughness: 0.95 }),
  quarryOre: new THREE.MeshStandardMaterial({ color: 0x7209b7, roughness: 0.3, metalness: 0.4 }),
  whiteTrim: new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.6 }),
  dirtDry: new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.95 }),
  dirtWet: new THREE.MeshStandardMaterial({ color: 0x4a2810, roughness: 0.45, metalness: 0.05 }),
  leafGreen: new THREE.MeshStandardMaterial({ color: 0x588157, roughness: 0.85 }),
  leafDarkGreen: new THREE.MeshStandardMaterial({ color: 0x344e41, roughness: 0.85 }),
  trunkBrown: new THREE.MeshStandardMaterial({ color: 0x582f0e, roughness: 0.9 }),
  goldAccent: new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.3, metalness: 0.7 }),
  water: new THREE.MeshStandardMaterial({
    color: 0x48cae4,
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.8,
  }),
};

// --- PLAYER MODEL ---
export interface PlayerMeshGroup extends THREE.Group {
  userData: {
    leftLeg?: THREE.Mesh;
    rightLeg?: THREE.Mesh;
    leftArm?: THREE.Mesh;
    rightArm?: THREE.Mesh;
    torso?: THREE.Group;
    head?: THREE.Group;
  };
}

export function createPlayerModel(): PlayerMeshGroup {
  const group = new THREE.Group() as PlayerMeshGroup;
  group.name = 'player';

  // Torso Group (centered at y = 0.72)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.72, 0);

  // Shirt / Upper Body
  const bodyGeo = new THREE.BoxGeometry(0.52, 0.54, 0.36);
  const bodyMesh = new THREE.Mesh(bodyGeo, materials.shirt);
  bodyMesh.position.set(0, 0, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  torsoGroup.add(bodyMesh);

  // Overalls (Blue dungarees with bib and shoulder straps)
  const bibGeo = new THREE.BoxGeometry(0.54, 0.38, 0.38);
  const bibMesh = new THREE.Mesh(bibGeo, materials.overalls);
  bibMesh.position.set(0, -0.08, 0);
  bibMesh.castShadow = true;
  torsoGroup.add(bibMesh);

  // Overalls Brass Buckles
  const buckleGeo = new THREE.BoxGeometry(0.08, 0.08, 0.04);
  const buckleL = new THREE.Mesh(buckleGeo, materials.goldAccent);
  buckleL.position.set(0.14, 0.06, 0.2);
  const buckleR = buckleL.clone();
  buckleR.position.set(-0.14, 0.06, 0.2);
  torsoGroup.add(buckleL, buckleR);

  // Leather Backpack
  const packGeo = new THREE.BoxGeometry(0.36, 0.4, 0.2);
  const packMesh = new THREE.Mesh(packGeo, materials.backpack);
  packMesh.position.set(0, 0.02, -0.26);
  packMesh.castShadow = true;
  torsoGroup.add(packMesh);

  // Bedroll on top of backpack
  const rollGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.44, 8);
  rollGeo.rotateZ(Math.PI / 2);
  const rollMesh = new THREE.Mesh(rollGeo, materials.strawHat);
  rollMesh.position.set(0, 0.26, -0.26);
  rollMesh.castShadow = true;
  torsoGroup.add(rollMesh);

  // Head Group (centered at y = 1.24)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.24, 0);

  const headGeo = new THREE.BoxGeometry(0.42, 0.4, 0.38);
  const headMesh = new THREE.Mesh(headGeo, materials.skin);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Hair
  const hairGeo = new THREE.BoxGeometry(0.44, 0.16, 0.4);
  const hairMesh = new THREE.Mesh(hairGeo, materials.hair);
  hairMesh.position.y = 0.16;
  headGroup.add(hairMesh);

  // Straw Hat
  const hatBrimGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 12);
  const hatBrim = new THREE.Mesh(hatBrimGeo, materials.strawHat);
  hatBrim.position.y = 0.22;
  hatBrim.castShadow = true;
  headGroup.add(hatBrim);

  const hatTopGeo = new THREE.CylinderGeometry(0.26, 0.32, 0.24, 10);
  const hatTop = new THREE.Mesh(hatTopGeo, materials.strawHat);
  hatTop.position.y = 0.35;
  hatTop.castShadow = true;
  headGroup.add(hatTop);

  const ribbonGeo = new THREE.CylinderGeometry(0.325, 0.325, 0.06, 10);
  const ribbon = new THREE.Mesh(ribbonGeo, materials.hatRibbon);
  ribbon.position.y = 0.28;
  headGroup.add(ribbon);

  // Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1f2421 });
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), eyeMat);
  eyeL.position.set(0.11, 0.02, 0.2);
  const eyeR = eyeL.clone();
  eyeR.position.set(-0.11, 0.02, 0.2);
  headGroup.add(eyeL, eyeR);

  // Blush marks
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xf28482 });
  const blushL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.02), blushMat);
  blushL.position.set(0.13, -0.05, 0.2);
  const blushR = blushL.clone();
  blushR.position.set(-0.13, -0.05, 0.2);
  headGroup.add(blushL, blushR);

  // Legs & Boots (from y = 0 to 0.45)
  const legGeo = new THREE.BoxGeometry(0.18, 0.38, 0.2);
  const leftLeg = new THREE.Mesh(legGeo, materials.overalls);
  leftLeg.position.set(0.14, 0.25, 0);
  leftLeg.castShadow = true;

  const bootGeo = new THREE.BoxGeometry(0.2, 0.16, 0.28);
  const bootL = new THREE.Mesh(bootGeo, materials.boots);
  bootL.position.set(0, -0.14, 0.03);
  bootL.castShadow = true;
  leftLeg.add(bootL);

  const rightLeg = new THREE.Mesh(legGeo, materials.overalls);
  rightLeg.position.set(-0.14, 0.25, 0);
  rightLeg.castShadow = true;

  const bootR = bootL.clone();
  rightLeg.add(bootR);

  // Arms (shoulders at y = 0.85)
  const armGeo = new THREE.BoxGeometry(0.14, 0.42, 0.16);
  const leftArm = new THREE.Mesh(armGeo, materials.shirt);
  leftArm.position.set(0.35, 0.72, 0);
  leftArm.castShadow = true;

  const handGeo = new THREE.BoxGeometry(0.12, 0.12, 0.14);
  const handL = new THREE.Mesh(handGeo, materials.skin);
  handL.position.y = -0.22;
  leftArm.add(handL);

  const rightArm = new THREE.Mesh(armGeo, materials.shirt);
  rightArm.position.set(-0.35, 0.72, 0);
  rightArm.castShadow = true;

  const handR = handL.clone();
  rightArm.add(handR);

  group.add(torsoGroup);
  group.add(headGroup);
  group.add(leftLeg);
  group.add(rightLeg);
  group.add(leftArm);
  group.add(rightArm);

  group.userData = {
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    torso: torsoGroup,
    head: headGroup,
  };

  return group;
}

// --- PET 3D MODELS ---

export interface PetMeshGroup extends THREE.Group {
  userData: {
    species: string;
    body?: THREE.Object3D;
    tail?: THREE.Object3D;
    ears?: THREE.Object3D[];
    head?: THREE.Object3D;
    wings?: THREE.Object3D[];
    legs?: THREE.Object3D[];
    animTime: number;
    initialY: number;
  };
}

// 1. Fox (Ember)
export function createFoxModel(): PetMeshGroup {
  const group = new THREE.Group() as PetMeshGroup;
  const matBody = new THREE.MeshStandardMaterial({ color: 0xe76f51, roughness: 0.7 });
  const matWhite = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.85 });
  const matBlack = new THREE.MeshStandardMaterial({ color: 0x264653, roughness: 0.6 });

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.65), matBody);
  body.position.set(0, 0.38, 0);
  body.castShadow = true;
  group.add(body);

  // Chest white patch
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.25), matWhite);
  chest.position.set(0, 0.4, 0.25);
  group.add(chest);

  // Head
  const head = new THREE.Group();
  head.position.set(0, 0.55, 0.35);

  const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.35), matBody);
  headBox.castShadow = true;
  head.add(headBox);

  // Snout
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.25, 4), matWhite);
  snout.rotation.x = -Math.PI / 2;
  snout.position.set(0, -0.05, 0.25);
  head.add(snout);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), matBlack);
  nose.position.set(0, -0.03, 0.38);
  head.add(nose);

  // Ears
  const earGeo = new THREE.ConeGeometry(0.1, 0.22, 4);
  const earL = new THREE.Mesh(earGeo, matBlack);
  earL.position.set(0.12, 0.22, -0.02);
  const earR = earL.clone();
  earR.position.set(-0.12, 0.22, -0.02);
  head.add(earL, earR);

  // Eyes
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), matBlack);
  eyeL.position.set(0.11, 0.04, 0.18);
  const eyeR = eyeL.clone();
  eyeR.position.set(-0.11, 0.04, 0.18);
  head.add(eyeL, eyeR);
  group.add(head);

  // 4 Legs
  const legGeo = new THREE.BoxGeometry(0.11, 0.28, 0.11);
  const legFL = new THREE.Mesh(legGeo, matBody);
  legFL.position.set(0.16, 0.14, 0.22);
  legFL.castShadow = true;

  const legFR = legFL.clone();
  legFR.position.set(-0.16, 0.14, 0.22);

  const legBL = legFL.clone();
  legBL.position.set(0.16, 0.14, -0.22);

  const legBR = legFL.clone();
  legBR.position.set(-0.16, 0.14, -0.22);

  group.add(legFL, legFR, legBL, legBR);

  // Bushy Tail
  const tail = new THREE.Group();
  tail.position.set(0, 0.42, -0.32);
  const tailBase = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 5), matBody);
  tailBase.rotation.x = -Math.PI / 3;
  tail.add(tailBase);

  const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.2, 5), matWhite);
  tailTip.rotation.x = -Math.PI / 3;
  tailTip.position.set(0, 0.2, -0.12);
  tail.add(tailTip);
  group.add(tail);

  group.userData = {
    species: 'fox',
    body,
    head,
    tail,
    legs: [legFL, legFR, legBL, legBR],
    animTime: 0,
    initialY: 0,
  };
  return group;
}

// 2. Turtle (Shelly)
export function createTurtleModel(): PetMeshGroup {
  const group = new THREE.Group() as PetMeshGroup;
  const matShell = new THREE.MeshStandardMaterial({ color: 0x2a9d8f, roughness: 0.65 });
  const matPlate = new THREE.MeshStandardMaterial({ color: 0x264653, roughness: 0.8 });
  const matSkin = new THREE.MeshStandardMaterial({ color: 0x8ab17d, roughness: 0.8 });
  const matBelly = new THREE.MeshStandardMaterial({ color: 0xe9c46a, roughness: 0.85 });

  // Domed Shell
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 0.32, 7), matShell);
  shell.position.set(0, 0.34, 0);
  shell.castShadow = true;
  group.add(shell);

  // Decorative shell hexagon plate
  const hexPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.34, 6), matPlate);
  hexPlate.position.set(0, 0.35, 0);
  group.add(hexPlate);

  // Belly
  const belly = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.1, 0.75), matBelly);
  belly.position.set(0, 0.18, 0);
  group.add(belly);

  // Head
  const head = new THREE.Group();
  head.position.set(0, 0.26, 0.42);
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.28), matSkin);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1d3557 });
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), eyeMat);
  eyeL.position.set(0.12, 0.04, 0.1);
  const eyeR = eyeL.clone();
  eyeR.position.set(-0.12, 0.04, 0.1);
  head.add(eyeL, eyeR);
  group.add(head);

  // Flippers / Stubby legs
  const flipperGeo = new THREE.BoxGeometry(0.18, 0.12, 0.22);
  const flipperFL = new THREE.Mesh(flipperGeo, matSkin);
  flipperFL.position.set(0.28, 0.12, 0.22);
  flipperFL.rotation.y = Math.PI / 4;

  const flipperFR = flipperFL.clone();
  flipperFR.position.set(-0.28, 0.12, 0.22);
  flipperFR.rotation.y = -Math.PI / 4;

  const flipperBL = flipperFL.clone();
  flipperBL.position.set(0.26, 0.12, -0.22);
  flipperBL.rotation.y = -Math.PI / 4;

  const flipperBR = flipperFL.clone();
  flipperBR.position.set(-0.26, 0.12, -0.22);
  flipperBR.rotation.y = Math.PI / 4;

  group.add(flipperFL, flipperFR, flipperBL, flipperBR);

  group.userData = {
    species: 'turtle',
    body: shell,
    head,
    legs: [flipperFL, flipperFR, flipperBL, flipperBR],
    animTime: 0,
    initialY: 0,
  };
  return group;
}

// 3. Rabbit (Hoppy)
export function createRabbitModel(): PetMeshGroup {
  const group = new THREE.Group() as PetMeshGroup;
  const matFur = new THREE.MeshStandardMaterial({ color: 0xf7ede2, roughness: 0.85 });
  const matEarInner = new THREE.MeshStandardMaterial({ color: 0xf5cac3, roughness: 0.9 });
  const matGoldPatch = new THREE.MeshStandardMaterial({ color: 0xf4a261, roughness: 0.8 });

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.45), matFur);
  body.position.set(0, 0.32, 0);
  body.castShadow = true;
  group.add(body);

  // Back fur spot
  const spot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.26), matGoldPatch);
  spot.position.set(0, 0.48, -0.05);
  group.add(spot);

  // Head
  const head = new THREE.Group();
  head.position.set(0, 0.52, 0.24);
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.3), matFur);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Snout
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.08), matEarInner);
  snout.position.set(0, -0.04, 0.16);
  head.add(snout);

  // Tall Ears
  const earGeo = new THREE.BoxGeometry(0.08, 0.36, 0.06);
  const earL = new THREE.Mesh(earGeo, matFur);
  earL.position.set(0.1, 0.28, -0.02);
  earL.rotation.z = -0.1;
  const earInnerL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.02), matEarInner);
  earInnerL.position.set(0, 0, 0.03);
  earL.add(earInnerL);

  const earR = new THREE.Mesh(earGeo, matFur);
  earR.position.set(-0.1, 0.28, -0.02);
  earR.rotation.z = 0.1;
  const earInnerR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.02), matEarInner);
  earInnerR.position.set(0, 0, 0.03);
  earR.add(earInnerR);

  head.add(earL, earR);

  // Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x844 });
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.03), eyeMat);
  eyeL.position.set(0.12, 0.04, 0.15);
  const eyeR = eyeL.clone();
  eyeR.position.set(-0.12, 0.04, 0.15);
  head.add(eyeL, eyeR);
  group.add(head);

  // Tail puff
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 5), matFur);
  tail.position.set(0, 0.28, -0.26);
  group.add(tail);

  // Feet
  const footGeo = new THREE.BoxGeometry(0.12, 0.1, 0.22);
  const footFL = new THREE.Mesh(footGeo, matFur);
  footFL.position.set(0.12, 0.08, 0.14);

  const footFR = footFL.clone();
  footFR.position.set(-0.12, 0.08, 0.14);

  const footBL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.28), matFur);
  footBL.position.set(0.15, 0.12, -0.15);

  const footBR = footBL.clone();
  footBR.position.set(-0.15, 0.12, -0.15);

  group.add(footFL, footFR, footBL, footBR);

  group.userData = {
    species: 'rabbit',
    body,
    head,
    tail,
    ears: [earL, earR],
    legs: [footFL, footFR, footBL, footBR],
    animTime: 0,
    initialY: 0,
  };
  return group;
}

// 4. Owl (Barnaby)
export function createOwlModel(): PetMeshGroup {
  const group = new THREE.Group() as PetMeshGroup;
  const matFeather = new THREE.MeshStandardMaterial({ color: 0x7b2cbf, roughness: 0.75 });
  const matChest = new THREE.MeshStandardMaterial({ color: 0xc77dff, roughness: 0.85 });
  const matBeak = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.5 });
  const matGoldEye = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.2 });

  // Plump egg body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.65, 8), matFeather);
  body.position.set(0, 0.48, 0);
  body.castShadow = true;
  group.add(body);

  // Chest chevron pattern
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.2), matChest);
  chest.position.set(0, 0.46, 0.2);
  group.add(chest);

  // Head with tufts
  const head = new THREE.Group();
  head.position.set(0, 0.82, 0.05);
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.36), matFeather);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Feather ear tufts
  const tuftGeo = new THREE.ConeGeometry(0.08, 0.2, 4);
  const tuftL = new THREE.Mesh(tuftGeo, matChest);
  tuftL.position.set(0.14, 0.22, 0);
  tuftL.rotation.z = -0.2;

  const tuftR = tuftL.clone();
  tuftR.position.set(-0.14, 0.22, 0);
  tuftR.rotation.z = 0.2;
  head.add(tuftL, tuftR);

  // Giant eyes
  const eyeL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 8), matGoldEye);
  eyeL.rotation.x = Math.PI / 2;
  eyeL.position.set(0.1, 0.04, 0.18);
  const pupilL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 8), new THREE.MeshBasicMaterial({ color: 0x111 }));
  pupilL.rotation.x = Math.PI / 2;
  pupilL.position.set(0.1, 0.04, 0.19);

  const eyeR = eyeL.clone();
  eyeR.position.set(-0.1, 0.04, 0.18);
  const pupilR = pupilL.clone();
  pupilR.position.set(-0.1, 0.04, 0.19);
  head.add(eyeL, pupilL, eyeR, pupilR);

  // Beak
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 4), matBeak);
  beak.rotation.x = Math.PI / 2 + 0.3;
  beak.position.set(0, -0.06, 0.21);
  head.add(beak);
  group.add(head);

  // Wings
  const wingGeo = new THREE.BoxGeometry(0.08, 0.42, 0.3);
  const wingL = new THREE.Mesh(wingGeo, matFeather);
  wingL.position.set(0.32, 0.48, 0);
  wingL.castShadow = true;

  const wingR = wingL.clone();
  wingR.position.set(-0.32, 0.48, 0);

  group.add(wingL, wingR);

  // Claws
  const clawGeo = new THREE.BoxGeometry(0.1, 0.08, 0.18);
  const clawL = new THREE.Mesh(clawGeo, matBeak);
  clawL.position.set(0.11, 0.06, 0.08);

  const clawR = clawL.clone();
  clawR.position.set(-0.11, 0.06, 0.08);

  group.add(clawL, clawR);

  group.userData = {
    species: 'owl',
    body,
    head,
    wings: [wingL, wingR],
    legs: [clawL, clawR],
    animTime: 0,
    initialY: 0,
  };
  return group;
}

// 5. Bear (Grizz)
export function createBearModel(): PetMeshGroup {
  const group = new THREE.Group() as PetMeshGroup;
  const matFur = new THREE.MeshStandardMaterial({ color: 0x6f4e37, roughness: 0.85 });
  const matMuzzle = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.8 });
  const matNose = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });
  const matChest = new THREE.MeshStandardMaterial({ color: 0xfaedcd, roughness: 0.9 });

  // Big chunky body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.65, 0.85), matFur);
  body.position.set(0, 0.58, 0);
  body.castShadow = true;
  group.add(body);

  // Golden Honey/Cream chest crescent
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.4, 0.2), matChest);
  chest.position.set(0, 0.65, 0.38);
  group.add(chest);

  // Head
  const head = new THREE.Group();
  head.position.set(0, 0.86, 0.45);
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.44, 0.46), matFur);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Muzzle
  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.24), matMuzzle);
  muzzle.position.set(0, -0.06, 0.26);
  head.add(muzzle);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.08), matNose);
  nose.position.set(0, 0.02, 0.38);
  head.add(nose);

  // Round ears
  const earGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.06, 8);
  earGeo.rotateX(Math.PI / 2);
  const earL = new THREE.Mesh(earGeo, matFur);
  earL.position.set(0.22, 0.25, 0.05);

  const earR = earL.clone();
  earR.position.set(-0.22, 0.25, 0.05);
  head.add(earL, earR);

  // Eyes
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), matNose);
  eyeL.position.set(0.14, 0.08, 0.24);
  const eyeR = eyeL.clone();
  eyeR.position.set(-0.14, 0.08, 0.24);
  head.add(eyeL, eyeR);
  group.add(head);

  // 4 chunky sturdy paws
  const legGeo = new THREE.BoxGeometry(0.2, 0.42, 0.22);
  const legFL = new THREE.Mesh(legGeo, matFur);
  legFL.position.set(0.24, 0.21, 0.3);
  legFL.castShadow = true;

  const legFR = legFL.clone();
  legFR.position.set(-0.24, 0.21, 0.3);

  const legBL = legFL.clone();
  legBL.position.set(0.24, 0.21, -0.3);

  const legBR = legFL.clone();
  legBR.position.set(-0.24, 0.21, -0.3);

  group.add(legFL, legFR, legBL, legBR);

  // Stubby tail
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.09, 5, 5), matFur);
  tail.position.set(0, 0.65, -0.46);
  group.add(tail);

  group.userData = {
    species: 'bear',
    body,
    head,
    legs: [legFL, legFR, legBL, legBR],
    animTime: 0,
    initialY: 0,
  };
  return group;
}

// 6. Slime (Boba)
export function createSlimeModel(): PetMeshGroup {
  const group = new THREE.Group() as PetMeshGroup;
  const matJelly = new THREE.MeshPhysicalMaterial({
    color: 0x06d6a0,
    roughness: 0.15,
    transmission: 0.6,
    thickness: 0.8,
    transparent: true,
    opacity: 0.88,
  });
  const matCore = new THREE.MeshStandardMaterial({
    color: 0x70e000,
    roughness: 0.3,
    emissive: 0x38b000,
    emissiveIntensity: 0.3,
  });

  // Jelly Body (slightly squashed sphere)
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), matJelly);
  body.scale.set(1.1, 0.85, 1.1);
  body.position.set(0, 0.32, 0);
  body.castShadow = true;
  group.add(body);

  // Glowing Core inside
  const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18), matCore);
  core.position.set(0, 0.32, 0);
  group.add(core);

  // Cute big bouncy eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x132a13 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeMat);
  eyeL.position.set(0.14, 0.36, 0.38);

  const eyeR = eyeL.clone();
  eyeR.position.set(-0.14, 0.36, 0.38);

  const whiteHighlight = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const glintL = new THREE.Mesh(new THREE.SphereGeometry(0.02, 4, 4), whiteHighlight);
  glintL.position.set(0.15, 0.38, 0.42);

  const glintR = glintL.clone();
  glintR.position.set(-0.13, 0.38, 0.42);

  // Cute mouth
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.015, 4, 8, Math.PI), eyeMat);
  smile.rotation.x = Math.PI;
  smile.position.set(0, 0.3, 0.41);

  group.add(eyeL, eyeR, glintL, glintR, smile);

  // Tiny orbiting bubble droplet
  const dropMat = new THREE.MeshStandardMaterial({ color: 0xa7c957, transparent: true, opacity: 0.8 });
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), dropMat);
  drop.position.set(0.38, 0.55, 0.1);
  group.add(drop);

  group.userData = {
    species: 'slime',
    body,
    head: drop, // used for secondary wobble
    animTime: 0,
    initialY: 0,
  };
  return group;
}

// --- FARM ENVIRONMENT BUILDINGS & PROPS ---

export function createFarmhouse(): THREE.Group {
  const house = new THREE.Group();
  house.name = 'farmhouse';

  // Base stone foundation
  const base = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.6, 5.4), materials.stone);
  base.position.y = 0.3;
  base.castShadow = true;
  base.receiveShadow = true;
  house.add(base);

  // Timber Walls
  const walls = new THREE.Mesh(new THREE.BoxGeometry(6.0, 3.4, 5.0), materials.woodPlanks);
  walls.position.y = 2.2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  house.add(walls);

  // Roof A-frame
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 2.2, 4), materials.roofBlue);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 4.8;
  roof.scale.set(1.1, 1, 0.95);
  roof.castShadow = true;
  house.add(roof);

  // Chimney
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.4, 0.7), materials.stoneDark);
  chimney.position.set(1.8, 4.8, -0.8);
  chimney.castShadow = true;
  house.add(chimney);

  // Door
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.9, 0.15), materials.woodLight);
  door.position.set(0, 1.55, 2.55);
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), materials.goldAccent);
  handle.position.set(0.38, 1.55, 2.65);
  house.add(door, handle);

  // Porch roof & posts
  const postL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.2, 0.18), materials.woodLight);
  postL.position.set(1.6, 1.6, 3.5);
  const postR = postL.clone();
  postR.position.set(-1.6, 1.6, 3.5);
  house.add(postL, postR);

  const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 1.4), materials.roofShingles);
  porchRoof.position.set(0, 2.7, 3.2);
  porchRoof.rotation.x = 0.15;
  house.add(porchRoof);

  // Glowing warm windows
  const winMat = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    emissive: 0xffd166,
    emissiveIntensity: 0.6,
    roughness: 0.2,
  });
  const winL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.1), winMat);
  winL.position.set(1.8, 2.2, 2.53);
  const winR = winL.clone();
  winR.position.set(-1.8, 2.2, 2.53);
  house.add(winL, winR);

  return house;
}

export function createBarn(): THREE.Group {
  const barn = new THREE.Group();
  barn.name = 'barn';

  // Red main body
  const body = new THREE.Mesh(new THREE.BoxGeometry(7.0, 4.0, 5.5), materials.barnRed);
  body.position.y = 2.0;
  body.castShadow = true;
  body.receiveShadow = true;
  barn.add(body);

  // Gambrel curved/sloped roof
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.0, 7.2, 6), materials.roofShingles);
  roof.rotation.z = Math.PI / 2;
  roof.position.y = 4.8;
  roof.castShadow = true;
  barn.add(roof);

  // White cross-braced double barn doors
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 0.15), materials.whiteTrim);
  doorFrame.position.set(0, 1.4, 2.8);
  barn.add(doorFrame);

  const doorWood = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.6, 0.18), materials.woodPlanks);
  doorWood.position.set(0, 1.4, 2.82);
  barn.add(doorWood);

  // Hay loft window
  const loftWin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.15), materials.whiteTrim);
  loftWin.position.set(0, 3.8, 2.8);
  barn.add(loftWin);

  // Hay bale outside
  const hayMat = new THREE.MeshStandardMaterial({ color: 0xddb892, roughness: 0.9 });
  const hayBale1 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 8), hayMat);
  hayBale1.rotation.z = Math.PI / 2;
  hayBale1.position.set(4.2, 0.6, 1.5);
  hayBale1.castShadow = true;
  barn.add(hayBale1);

  return barn;
}

export function createWindmill(): { group: THREE.Group; blades: THREE.Group } {
  const group = new THREE.Group();
  group.name = 'windmill';

  // Tapered tower
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.2, 7.5, 8), materials.stone);
  tower.position.y = 3.75;
  tower.castShadow = true;
  tower.receiveShadow = true;
  group.add(tower);

  // Conical cap roof
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.8, 8), materials.roofBlue);
  cap.position.y = 8.1;
  cap.castShadow = true;
  group.add(cap);

  // Blades group
  const blades = new THREE.Group();
  blades.position.set(0, 6.8, 1.45);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 8), materials.woodPlanks);
  hub.rotation.x = Math.PI / 2;
  blades.add(hub);

  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.6, 0.08), materials.woodPlanks);
    arm.position.set(Math.sin(angle) * 1.8, Math.cos(angle) * 1.8, 0);
    arm.rotation.z = -angle;

    const sail = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 2.8), bladeMat);
    sail.position.set(Math.sin(angle) * 1.9 + 0.25, Math.cos(angle) * 1.9, 0.04);
    sail.rotation.z = -angle;

    blades.add(arm, sail);
  }
  group.add(blades);

  return { group, blades };
}

// Water well
export function createWell(): THREE.Group {
  const well = new THREE.Group();
  well.name = 'well';

  // Circular stone base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.25, 0.9, 10), materials.stone);
  base.position.y = 0.45;
  base.castShadow = true;
  well.add(base);

  // Water inside
  const waterMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.1, 10), materials.water);
  waterMesh.position.y = 0.65;
  well.add(waterMesh);

  // Roof posts & shingle roof
  const post1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 0.12), materials.woodPlanks);
  post1.position.set(0.9, 1.2, 0);
  const post2 = post1.clone();
  post2.position.set(-0.9, 1.2, 0);
  well.add(post1, post2);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.0, 4), materials.roofShingles);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 2.4;
  roof.castShadow = true;
  well.add(roof);

  return well;
}

// Low-poly Stylized Tree
export function createTree(type: 'oak' | 'pine' | 'apple' = 'oak'): THREE.Group {
  const tree = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 2.2, 6);
  const trunk = new THREE.Mesh(trunkGeo, materials.trunkBrown);
  trunk.position.y = 1.1;
  trunk.castShadow = true;
  tree.add(trunk);

  if (type === 'pine') {
    // 3 layered cones
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.2, 6), materials.leafDarkGreen);
    c1.position.y = 2.4;
    c1.castShadow = true;
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.8, 6), materials.leafDarkGreen);
    c2.position.y = 3.6;
    c2.castShadow = true;
    const c3 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.5, 6), materials.leafDarkGreen);
    c3.position.y = 4.7;
    c3.castShadow = true;
    tree.add(c1, c2, c3);
    tree.userData.foliage = [c1, c2, c3];
  } else {
    // Low-poly fluffy dodecahedron clusters
    const f1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 0), materials.leafGreen);
    f1.position.set(0, 2.6, 0);
    f1.castShadow = true;
    const f2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 0), materials.leafGreen);
    f2.position.set(0.6, 3.4, 0.3);
    f2.castShadow = true;
    const f3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 0), materials.leafGreen);
    f3.position.set(-0.5, 3.2, -0.4);
    f3.castShadow = true;
    tree.add(f1, f2, f3);
    tree.userData.foliage = [f1, f2, f3];

    if (type === 'apple') {
      const appleMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.3 });
      for (let i = 0; i < 5; i++) {
        const apple = new THREE.Mesh(new THREE.SphereGeometry(0.14, 5, 5), appleMat);
        const theta = (i * Math.PI * 2) / 5;
        apple.position.set(Math.cos(theta) * 1.1, 2.4 + (i % 2) * 0.5, Math.sin(theta) * 1.1);
        tree.add(apple);
      }
    }
  }

  return tree;
}

// Low-poly Rock Boulder
export function createRock(scale = 1.0): THREE.Mesh {
  const rockGeo = new THREE.DodecahedronGeometry(scale, 0);
  const rock = new THREE.Mesh(rockGeo, materials.stone);
  rock.scale.set(1.2, 0.8, 1.0);
  rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  rock.position.y = scale * 0.45;
  rock.castShadow = true;
  rock.receiveShadow = true;
  return rock;
}

// Low-poly Crystal / Quarry Node
export function createQuarryNode(): THREE.Group {
  const group = new THREE.Group();
  const baseRock = createRock(1.2);
  group.add(baseRock);

  const crystalGeo = new THREE.ConeGeometry(0.3, 0.9, 5);
  for (let i = 0; i < 4; i++) {
    const crystal = new THREE.Mesh(crystalGeo, materials.quarryOre);
    crystal.position.set((Math.random() - 0.5) * 0.8, 0.6 + Math.random() * 0.4, (Math.random() - 0.5) * 0.8);
    crystal.rotation.set((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6);
    crystal.castShadow = true;
    group.add(crystal);
  }
  return group;
}

// Fence Segment
export function createFenceSegment(): THREE.Group {
  const fence = new THREE.Group();
  const post1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.1, 0.14), materials.woodPlanks);
  post1.position.set(-1.0, 0.55, 0);
  post1.castShadow = true;

  const post2 = post1.clone();
  post2.position.set(1.0, 0.55, 0);

  const rail1 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.08), materials.woodLight);
  rail1.position.set(0, 0.8, 0);
  rail1.castShadow = true;

  const rail2 = rail1.clone();
  rail2.position.set(0, 0.38, 0);

  fence.add(post1, post2, rail1, rail2);
  return fence;
}

// Crop 3D Visualizer with 4 distinct growth stages (Seedling, Growing, Mature, Harvested)
export function createCropMesh(cropId: string, progress: number, isHarvested = false): THREE.Group {
  const group = new THREE.Group();
  group.name = isHarvested ? 'crop_harvested_stubble' : `crop_${cropId}`;
  group.userData = { cropId, progress, isCrop: true, isHarvested };

  const soilMoundMat = new THREE.MeshStandardMaterial({ color: 0x4a2810, roughness: 0.95 });
  const youngGreenMat = new THREE.MeshStandardMaterial({ color: 0x70e000, roughness: 0.6 });
  const lushGreenMat = new THREE.MeshStandardMaterial({ color: 0x38b000, roughness: 0.7 });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.75 });
  const stubbleMat = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.9 });

  if (isHarvested) {
    // ----------------------------------------------------
    // STAGE 4: HARVESTED (Turned soil mound + cut stem stubble & clippings)
    // ----------------------------------------------------
    const mound = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.1, 7), soilMoundMat);
    mound.position.y = 0.05;
    mound.receiveShadow = true;
    group.add(mound);

    // 2 short snipped stalks
    const stubble1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.12, 5), stubbleMat);
    stubble1.position.set(-0.06, 0.1, 0.04);
    stubble1.rotation.z = 0.15;
    const stubble2 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.1, 5), stubbleMat);
    stubble2.position.set(0.07, 0.09, -0.05);
    stubble2.rotation.x = -0.12;

    // Small cut foliage clippings
    const cutLeaf = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08), youngGreenMat);
    cutLeaf.rotation.x = -Math.PI / 2;
    cutLeaf.rotation.z = 0.4;
    cutLeaf.position.set(0.08, 0.07, 0.08);

    group.add(stubble1, stubble2, cutLeaf);
    return group;
  }

  if (progress < 0.28) {
    // ----------------------------------------------------
    // STAGE 1: SEEDLING (Tender shoots & miniature cotyledons)
    // ----------------------------------------------------
    // Small soil mound
    const mound = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.08, 6), soilMoundMat);
    mound.position.y = 0.04;
    group.add(mound);

    // Main sprout stem
    const sproutStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.16, 5), youngGreenMat);
    sproutStem.position.y = 0.09;
    group.add(sproutStem);

    // 2 opposite cotyledon seed leaves
    const leafGeo = new THREE.ConeGeometry(0.06, 0.14, 4);
    const leaf1 = new THREE.Mesh(leafGeo, youngGreenMat);
    leaf1.position.set(0.035, 0.14, 0);
    leaf1.rotation.z = -0.65;
    leaf1.rotation.y = 0.3;

    const leaf2 = new THREE.Mesh(leafGeo, youngGreenMat);
    leaf2.position.set(-0.035, 0.14, 0);
    leaf2.rotation.z = 0.65;
    leaf2.rotation.y = -0.3;

    group.add(leaf1, leaf2);
  } else if (progress < 0.85) {
    // ----------------------------------------------------
    // STAGE 2: GROWING (Branching leafy foliage & unripe bud)
    // ----------------------------------------------------
    const growthRatio = (progress - 0.28) / 0.57; // 0 to 1
    const stalkH = 0.24 + growthRatio * 0.16;

    const mainStalk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, stalkH, 5), stemMat);
    mainStalk.position.y = stalkH / 2;
    group.add(mainStalk);

    // Bushy foliage clusters
    const foliageCluster = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.18 + growthRatio * 0.08, 0),
      lushGreenMat
    );
    foliageCluster.position.y = stalkH + 0.06;
    group.add(foliageCluster);

    // Side leaves
    for (let i = 0; i < 3; i++) {
      const sideLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 4), youngGreenMat);
      const ang = (i * Math.PI * 2) / 3;
      sideLeaf.position.set(Math.cos(ang) * 0.1, stalkH * 0.55, Math.sin(ang) * 0.1);
      sideLeaf.rotation.z = 0.5;
      sideLeaf.rotation.y = ang;
      group.add(sideLeaf);
    }

    // Small unripe green produce buds
    const unripeMat = new THREE.MeshStandardMaterial({ color: 0x9ef01a, roughness: 0.5 });
    if (cropId === 'carrot') {
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), unripeMat);
      tip.rotation.x = Math.PI;
      tip.position.set(0, 0.08, 0.06);
      group.add(tip);
    } else if (cropId === 'tomato' || cropId === 'strawberry') {
      const bud = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 5), unripeMat);
      bud.position.set(0.08, stalkH * 0.7, 0.06);
      group.add(bud);
    } else if (cropId === 'corn') {
      const babyCob = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.18, 5), unripeMat);
      babyCob.position.set(0.08, stalkH * 0.6, 0);
      babyCob.rotation.z = 0.3;
      group.add(babyCob);
    } else if (cropId === 'pumpkin') {
      const babyPumpkin = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), unripeMat);
      babyPumpkin.scale.set(1.2, 0.8, 1.2);
      babyPumpkin.position.set(0.1, 0.1, 0.1);
      group.add(babyPumpkin);
    }
  } else {
    // ----------------------------------------------------
    // STAGE 3 & 4: MATURE / HARVEST-READY
    // ----------------------------------------------------
    const mainStalk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.45, 5), stemMat);
    mainStalk.position.y = 0.22;
    group.add(mainStalk);

    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), lushGreenMat);
    bush.position.y = 0.44;
    group.add(bush);

    if (cropId === 'carrot') {
      // Lush feathered fern fronds + bright orange carrot top protruding
      const carrotMat = new THREE.MeshStandardMaterial({ color: 0xff7b00, roughness: 0.45 });
      const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.38, 6), carrotMat);
      carrot.rotation.x = Math.PI;
      carrot.position.set(0, 0.22, 0.08);
      group.add(carrot);

      for (let f = 0; f < 3; f++) {
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 4), youngGreenMat);
        const ang = (f * Math.PI * 2) / 3;
        frond.position.set(Math.cos(ang) * 0.12, 0.48, Math.sin(ang) * 0.12);
        frond.rotation.z = 0.4;
        frond.rotation.y = ang;
        group.add(frond);
      }
    } else if (cropId === 'tomato') {
      const tomatoMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.25 });
      const calyxMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.6 });

      // Sturdy garden trellis stake
      const stakeMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
      const stake = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.75, 0.04), stakeMat);
      stake.position.set(-0.08, 0.36, -0.05);
      group.add(stake);

      for (let i = 0; i < 3; i++) {
        const tom = new THREE.Mesh(new THREE.SphereGeometry(0.13, 7, 7), tomatoMat);
        const ang = (i * Math.PI * 2) / 3;
        tom.position.set(Math.cos(ang) * 0.16, 0.34 + (i % 2) * 0.1, Math.sin(ang) * 0.16);

        // Star calyx
        const calyx = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.04, 5), calyxMat);
        calyx.position.set(0, 0.13, 0);
        tom.add(calyx);
        group.add(tom);
      }
    } else if (cropId === 'strawberry') {
      const berryMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.28 });
      const flowerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
      const centerMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.3 });

      // 3 plump red strawberries
      for (let b = 0; b < 3; b++) {
        const ang = (b * Math.PI * 2) / 3;
        const berry = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 5), berryMat);
        berry.rotation.x = Math.PI * 0.85;
        berry.position.set(Math.cos(ang) * 0.16, 0.22 + (b % 2) * 0.06, Math.sin(ang) * 0.16);
        group.add(berry);
      }

      // Small white strawberry blossom flower
      const flower = new THREE.Mesh(new THREE.CircleGeometry(0.07, 5), flowerMat);
      flower.position.set(0, 0.52, 0.1);
      flower.rotation.x = -0.5;
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), centerMat);
      center.position.z = 0.02;
      flower.add(center);
      group.add(flower);
    } else if (cropId === 'corn') {
      const cornMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.35 });
      const huskMat = new THREE.MeshStandardMaterial({ color: 0x74c69d, roughness: 0.8 });
      const silkMat = new THREE.MeshStandardMaterial({ color: 0xb5838d, roughness: 0.6 });

      // Tall sturdy jointed maize stalk
      const tallStalk = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.95, 6), stemMat);
      tallStalk.position.y = 0.48;
      group.add(tallStalk);

      // Arching ribbon leaves
      for (let l = 0; l < 4; l++) {
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.01), lushGreenMat);
        const lAng = (l * Math.PI) / 2;
        leaf.position.set(Math.cos(lAng) * 0.14, 0.4 + l * 0.1, Math.sin(lAng) * 0.14);
        leaf.rotation.z = 0.6;
        leaf.rotation.y = lAng;
        group.add(leaf);
      }

      // 2 plump ears of corn with silks and peeling husks
      const cob1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.095, 0.34, 6), cornMat);
      cob1.rotation.z = 0.45;
      cob1.position.set(0.16, 0.52, 0);

      const husk1 = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.28, 4), huskMat);
      husk1.position.set(0.04, -0.06, 0);
      cob1.add(husk1);

      const silk1 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 4), silkMat);
      silk1.position.set(0, 0.2, 0);
      cob1.add(silk1);

      const cob2 = cob1.clone();
      cob2.rotation.z = -0.45;
      cob2.position.set(-0.16, 0.62, 0);
      group.add(cob1, cob2);
    } else if (cropId === 'pumpkin') {
      const pumpkinMat = new THREE.MeshStandardMaterial({ color: 0xf77f00, roughness: 0.48 });
      const pStemMat = new THREE.MeshStandardMaterial({ color: 0x40916c, roughness: 0.7 });

      // Broad lobed creeping vine leaves
      for (let v = 0; v < 3; v++) {
        const vLeaf = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), lushGreenMat);
        vLeaf.scale.set(1.4, 0.3, 1.4);
        const ang = (v * Math.PI * 2) / 3;
        vLeaf.position.set(Math.cos(ang) * 0.32, 0.06, Math.sin(ang) * 0.32);
        group.add(vLeaf);
      }

      // Large ribbed pumpkin
      const pumpkin = new THREE.Mesh(new THREE.SphereGeometry(0.3, 9, 8), pumpkinMat);
      pumpkin.scale.set(1.25, 0.85, 1.25);
      pumpkin.position.set(0, 0.25, 0);

      const pStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.16, 5), pStemMat);
      pStem.position.set(0, 0.24, 0);
      pStem.rotation.z = 0.25;
      pumpkin.add(pStem);
      group.add(pumpkin);
    } else {
      // Generic fallback crop
      const genericMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.4 });
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), genericMat);
      fruit.position.set(0, 0.42, 0);
      group.add(fruit);
    }

    // Ready-to-Harvest Golden Aura Ring when progress >= 1.0
    if (progress >= 1.0) {
      const readyGlowMat = new THREE.MeshBasicMaterial({
        color: 0xffd166,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      });
      const aura = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.45, 8), readyGlowMat);
      aura.rotation.x = -Math.PI / 2;
      aura.position.y = 0.02;
      aura.name = 'ready_aura';
      group.add(aura);
    }
  }

  return group;
}

// Visual 3D collectible prop representing harvested crop that pops and flies to the player
export function createHarvestItemMesh(cropId: string): THREE.Group {
  const item = new THREE.Group();
  item.name = `harvest_item_${cropId}`;

  if (cropId === 'carrot') {
    const carrotMat = new THREE.MeshStandardMaterial({ color: 0xff7b00, roughness: 0.4 });
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 6), carrotMat);
    c.rotation.x = Math.PI;
    const topMat = new THREE.MeshStandardMaterial({ color: 0x38b000, roughness: 0.6 });
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), topMat);
    top.position.y = 0.28;
    item.add(c, top);
  } else if (cropId === 'tomato') {
    const tomatoMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.2 });
    const tom = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), tomatoMat);
    const calyx = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.05, 5), new THREE.MeshStandardMaterial({ color: 0x2d6a4f }));
    calyx.position.y = 0.2;
    item.add(tom, calyx);
  } else if (cropId === 'strawberry') {
    const berryMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.25 });
    const berry = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.32, 6), berryMat);
    berry.rotation.x = Math.PI;
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.06, 5), new THREE.MeshStandardMaterial({ color: 0x38b000 }));
    top.position.y = 0.17;
    item.add(berry, top);
  } else if (cropId === 'corn') {
    const cob = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.45, 6), new THREE.MeshStandardMaterial({ color: 0xffd166 }));
    const husk = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 4), new THREE.MeshStandardMaterial({ color: 0x74c69d }));
    husk.position.y = -0.1;
    item.add(cob, husk);
  } else if (cropId === 'pumpkin') {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 7), new THREE.MeshStandardMaterial({ color: 0xf77f00 }));
    p.scale.set(1.2, 0.85, 1.2);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.14, 5), new THREE.MeshStandardMaterial({ color: 0x40916c }));
    stem.position.y = 0.22;
    item.add(p, stem);
  } else {
    const gem = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), new THREE.MeshStandardMaterial({ color: 0xffb703 }));
    item.add(gem);
  }
  return item;
}

// --- PORTAL TO WILD GROUNDS ---
export function createPortalArch(): { group: THREE.Group; vortex: THREE.Mesh } {
  const group = new THREE.Group();
  group.name = 'portal_wild_grounds';

  const stoneMat = materials.stoneDark;
  const runeMat = new THREE.MeshStandardMaterial({
    color: 0x7209b7,
    emissive: 0x7209b7,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });

  // Left Stone Pillar
  const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.8, 0.7), stoneMat);
  pillarL.position.set(-1.8, 1.9, 0);
  pillarL.castShadow = true;
  pillarL.receiveShadow = true;

  // Left rune insets
  const runeL1 = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.2, 0.74), runeMat);
  runeL1.position.set(-1.8, 1.2, 0);
  const runeL2 = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.2, 0.74), runeMat);
  runeL2.position.set(-1.8, 2.6, 0);

  // Right Stone Pillar
  const pillarR = pillarL.clone();
  pillarR.position.set(1.8, 1.9, 0);
  const runeR1 = runeL1.clone();
  runeR1.position.set(1.8, 1.2, 0);
  const runeR2 = runeL2.clone();
  runeR2.position.set(1.8, 2.6, 0);

  // Top Lintel Arch Stone
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.7, 0.8), stoneMat);
  lintel.position.set(0, 3.95, 0);
  lintel.castShadow = true;

  const topRune = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), runeMat);
  topRune.position.set(0, 4.45, 0);

  // Portal Base Dais Steps
  const base1 = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.3, 8), stoneMat);
  base1.position.set(0, 0.15, 0);
  base1.receiveShadow = true;
  const base2 = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.3, 0.25, 8), stoneMat);
  base2.position.set(0, 0.38, 0);
  base2.receiveShadow = true;

  // Swirling Portal Energy Vortex Disc
  const vortexMat = new THREE.MeshStandardMaterial({
    color: 0x4cc9f0,
    emissive: 0x4361ee,
    emissiveIntensity: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  const vortexGeo = new THREE.CircleGeometry(1.4, 16);
  const vortex = new THREE.Mesh(vortexGeo, vortexMat);
  vortex.position.set(0, 2.2, 0);

  // Inner energy ring
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xf72585, wireframe: true });
  const innerRing = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.35, 16), ringMat);
  innerRing.position.set(0, 2.2, 0.02);

  group.add(base1, base2, pillarL, pillarR, runeL1, runeL2, runeR1, runeR2, lintel, topRune, vortex, innerRing);

  return { group, vortex };
}

// --- SEED SHOPKEEPER STALL ---
export function createSeedStall(): THREE.Group {
  const stall = new THREE.Group();
  stall.name = 'seed_shop_stall';

  // Wooden Counter & Base
  const counterBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, 1.6), materials.woodPlanks);
  counterBase.position.set(0, 0.55, 0);
  counterBase.castShadow = true;
  counterBase.receiveShadow = true;

  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.15, 1.8), materials.woodLight);
  counterTop.position.set(0, 1.15, 0);
  counterTop.castShadow = true;

  // Four corner posts for awning
  const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6);
  const p1 = new THREE.Mesh(postGeo, materials.woodPlanks);
  p1.position.set(1.7, 2.1, 0.7);
  const p2 = p1.clone();
  p2.position.set(-1.7, 2.1, 0.7);
  const p3 = p1.clone();
  p3.position.set(1.7, 2.1, -0.7);
  const p4 = p1.clone();
  p4.position.set(-1.7, 2.1, -0.7);

  // Striped Fabric Awning (Green & Cream)
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xfefae0, roughness: 0.8 });
  const awning = new THREE.Group();
  awning.position.set(0, 3.2, 0);

  const numStripes = 8;
  const stripeWidth = 4.0 / numStripes;
  for (let i = 0; i < numStripes; i++) {
    const sMat = i % 2 === 0 ? greenMat : creamMat;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(stripeWidth, 0.1, 2.1), sMat);
    stripe.position.set(-2.0 + stripeWidth * (i + 0.5), 0, 0);
    stripe.rotation.x = 0.15;
    stripe.castShadow = true;
    awning.add(stripe);
  }

  // Crates on counter with display produce
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x936639, roughness: 0.85 });
  const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.6), crateMat);
  crate1.position.set(-1.1, 1.35, 0.1);
  crate1.castShadow = true;

  // Display Carrots in crate 1
  const miniCarrot = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.25, 4), new THREE.MeshStandardMaterial({ color: 0xff7b00 }));
  miniCarrot.rotation.x = Math.PI * 0.8;
  miniCarrot.position.set(-1.1, 1.55, 0.1);

  // Crate 2 with Tomatoes
  const crate2 = crate1.clone();
  crate2.position.set(0, 1.35, 0.1);
  const miniTom = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 5), new THREE.MeshStandardMaterial({ color: 0xe63946 }));
  miniTom.position.set(0, 1.55, 0.1);

  // Crate 3 with Pumpkins / Corn
  const crate3 = crate1.clone();
  crate3.position.set(1.1, 1.35, 0.1);
  const miniPumpkin = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshStandardMaterial({ color: 0xf77f00 }));
  miniPumpkin.scale.set(1.2, 0.8, 1.2);
  miniPumpkin.position.set(1.1, 1.55, 0.1);

  // Shop Sign: "SEEDS"
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.08), materials.woodLight);
  signBoard.position.set(0, 3.45, 0.95);
  const signTextMat = new THREE.MeshBasicMaterial({ color: 0x2d6a4f });
  const signIcon = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 4), signTextMat);
  signIcon.position.set(0, 3.45, 1.0);

  // Low-poly NPC Shopkeeper ("Barnaby the Seed Merchant")
  const npc = new THREE.Group();
  npc.position.set(0, 0, -0.6);

  const npcBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.35), new THREE.MeshStandardMaterial({ color: 0x2b2d42 }));
  npcBody.position.y = 1.0;
  npcBody.castShadow = true;

  const npcHead = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.35), materials.skin);
  npcHead.position.y = 1.6;
  npcHead.castShadow = true;

  // Merchant Hat
  const npcHat = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.4, 6), new THREE.MeshStandardMaterial({ color: 0x40916c }));
  npcHat.position.y = 1.95;
  npcHat.castShadow = true;

  // Friendly beard
  const beard = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.15), new THREE.MeshStandardMaterial({ color: 0xe9ecef }));
  beard.position.set(0, 1.48, 0.18);

  npc.add(npcBody, npcHead, npcHat, beard);

  stall.add(counterBase, counterTop, p1, p2, p3, p4, awning, crate1, miniCarrot, crate2, miniTom, crate3, miniPumpkin, signBoard, signIcon, npc);

  return stall;
}

// --- WILD GROUNDS ENEMY 3D MODELS ---

// 1. Shadow Slime (hostile slime with spikes/horns)
export function createShadowSlime(scale = 1.0): THREE.Group {
  const group = new THREE.Group();
  group.name = 'enemy_slime';

  const slimeMat = new THREE.MeshStandardMaterial({
    color: 0x5a189a,
    roughness: 0.2,
    emissive: 0x3c096c,
    emissiveIntensity: 0.4,
  });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5 * scale, 8, 8), slimeMat);
  body.scale.set(1.1, 0.85, 1.1);
  body.position.y = 0.4 * scale;
  body.castShadow = true;

  // Glowing evil red eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0054 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08 * scale, 5, 5), eyeMat);
  eyeL.position.set(0.18 * scale, 0.45 * scale, 0.42 * scale);
  const eyeR = eyeL.clone();
  eyeR.position.set(-0.18 * scale, 0.45 * scale, 0.42 * scale);

  // Spikes
  const hornMat = new THREE.MeshStandardMaterial({ color: 0x240046 });
  const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.1 * scale, 0.3 * scale, 4), hornMat);
  hornL.position.set(0.22 * scale, 0.8 * scale, 0);
  hornL.rotation.z = -0.3;
  const hornR = hornL.clone();
  hornR.position.set(-0.22 * scale, 0.8 * scale, 0);
  hornR.rotation.z = 0.3;

  group.add(body, eyeL, eyeR, hornL, hornR);
  return group;
}

// 2. Forest Imp (winged mischievous goblin)
export function createForestImp(scale = 1.0): THREE.Group {
  const group = new THREE.Group();
  group.name = 'enemy_imp';

  const impMat = new THREE.MeshStandardMaterial({ color: 0x7b2cbf, roughness: 0.7 });
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x3c096c, side: THREE.DoubleSide, roughness: 0.5 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.4 * scale, 0.5 * scale, 0.3 * scale), impMat);
  body.position.y = 0.6 * scale;
  body.castShadow = true;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.35 * scale, 0.35 * scale, 0.35 * scale), impMat);
  head.position.set(0, 0.95 * scale, 0.05 * scale);
  head.castShadow = true;

  // Glowing eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffe600 });
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.07 * scale, 0.07 * scale, 0.04 * scale), eyeMat);
  eyeL.position.set(0.1 * scale, 0.96 * scale, 0.22 * scale);
  const eyeR = eyeL.clone();
  eyeR.position.set(-0.1 * scale, 0.96 * scale, 0.22 * scale);

  // Wings
  const wingL = new THREE.Mesh(new THREE.PlaneGeometry(0.4 * scale, 0.5 * scale), wingMat);
  wingL.position.set(0.3 * scale, 0.75 * scale, -0.15 * scale);
  wingL.rotation.y = -0.4;
  const wingR = wingL.clone();
  wingR.position.set(-0.3 * scale, 0.75 * scale, -0.15 * scale);
  wingR.rotation.y = 0.4;

  group.add(body, head, eyeL, eyeR, wingL, wingR);
  return group;
}

// 3. Shadow Wolf (aggressive canine beast)
export function createShadowWolf(scale = 1.0): THREE.Group {
  const group = new THREE.Group();
  group.name = 'enemy_wolf';

  const furMat = new THREE.MeshStandardMaterial({ color: 0x343a40, roughness: 0.8 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff4d6d });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5 * scale, 0.45 * scale, 0.9 * scale), furMat);
  body.position.y = 0.55 * scale;
  body.castShadow = true;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.38 * scale, 0.35 * scale, 0.4 * scale), furMat);
  head.position.set(0, 0.8 * scale, 0.45 * scale);
  head.castShadow = true;

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22 * scale, 0.18 * scale, 0.3 * scale), furMat);
  snout.position.set(0, 0.72 * scale, 0.72 * scale);

  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06 * scale, 0.06 * scale, 0.04 * scale), eyeMat);
  eyeL.position.set(0.12 * scale, 0.85 * scale, 0.62 * scale);
  const eyeR = eyeL.clone();
  eyeR.position.set(-0.12 * scale, 0.85 * scale, 0.62 * scale);

  group.add(body, head, snout, eyeL, eyeR);
  return group;
}

// 4. Ancient Grove Golem (heavy mini-boss rock monster)
export function createGroveGolem(scale = 1.6): THREE.Group {
  const group = new THREE.Group();
  group.name = 'enemy_golem';

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x495057, roughness: 0.9 });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 });
  const runeMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });

  // Large Boulder Torso
  const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7 * scale, 0), stoneMat);
  torso.scale.set(1.2, 1.1, 0.9);
  torso.position.y = 1.2 * scale;
  torso.castShadow = true;

  // Moss shoulders
  const mossL = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35 * scale, 0), mossMat);
  mossL.position.set(0.7 * scale, 1.6 * scale, 0);
  const mossR = mossL.clone();
  mossR.position.set(-0.7 * scale, 1.6 * scale, 0);

  // Heavy Rock Arms
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.35 * scale, 0.9 * scale, 0.35 * scale), stoneMat);
  armL.position.set(0.85 * scale, 0.9 * scale, 0);
  armL.castShadow = true;
  const armR = armL.clone();
  armR.position.set(-0.85 * scale, 0.9 * scale, 0);

  // Glowing Eye Runes
  const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.12 * scale, 0.08 * scale, 0.05 * scale), runeMat);
  eye1.position.set(0.16 * scale, 1.35 * scale, 0.65 * scale);
  const eye2 = eye1.clone();
  eye2.position.set(-0.16 * scale, 1.35 * scale, 0.65 * scale);

  group.add(torso, mossL, mossR, armL, armR, eye1, eye2);
  return group;
}

// 5. Eclipse Shadow Titan (Towering Final Boss)
export function createShadowTitan(scale = 2.4): THREE.Group {
  const group = new THREE.Group();
  group.name = 'enemy_titan';

  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x10002b,
    roughness: 0.3,
    metalness: 0.6,
  });
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xff0054 });
  const hornMat = new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.5, roughness: 0.3 });

  // Armored Colossus Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9 * scale, 1.2 * scale, 0.6 * scale), armorMat);
  torso.position.y = 1.4 * scale;
  torso.castShadow = true;

  // Glowing Nether Core in chest
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.25 * scale, 0), coreMat);
  core.position.set(0, 1.4 * scale, 0.32 * scale);

  // Huge Spiked Shoulders
  const shoulderL = new THREE.Mesh(new THREE.ConeGeometry(0.3 * scale, 0.7 * scale, 4), hornMat);
  shoulderL.position.set(0.65 * scale, 1.9 * scale, 0);
  shoulderL.rotation.z = -0.5;
  const shoulderR = shoulderL.clone();
  shoulderR.position.set(-0.65 * scale, 1.9 * scale, 0);
  shoulderR.rotation.z = 0.5;

  // Horned Helm Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5 * scale, 0.5 * scale, 0.5 * scale), armorMat);
  head.position.set(0, 2.1 * scale, 0.05 * scale);
  head.castShadow = true;

  const crownHorn = new THREE.Mesh(new THREE.ConeGeometry(0.18 * scale, 0.6 * scale, 4), hornMat);
  crownHorn.position.set(0, 2.5 * scale, 0.05 * scale);

  // Glowing Visor
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32 * scale, 0.1 * scale, 0.06 * scale), coreMat);
  visor.position.set(0, 2.1 * scale, 0.3 * scale);

  // Heavy Arms
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.38 * scale, 1.1 * scale, 0.38 * scale), armorMat);
  armL.position.set(0.75 * scale, 1.0 * scale, 0);
  armL.castShadow = true;
  const armR = armL.clone();
  armR.position.set(-0.75 * scale, 1.0 * scale, 0);

  group.add(torso, core, shoulderL, shoulderR, head, crownHorn, visor, armL, armR);
  return group;
}

// Universal Pet Factory
export function createPetModel(species: string): PetMeshGroup {
  switch (species) {
    case 'fox':
      return createFoxModel();
    case 'turtle':
      return createTurtleModel();
    case 'rabbit':
      return createRabbitModel();
    case 'owl':
      return createOwlModel();
    case 'bear':
      return createBearModel();
    case 'slime':
      return createSlimeModel();
    case 'wolf': {
      // Wolf variant from fox base with silver palette
      const wolf = createFoxModel();
      wolf.userData.species = 'wolf';
      wolf.scale.set(1.15, 1.15, 1.15);
      return wolf;
    }
    case 'frog': {
      // Frog model
      const frog = createSlimeModel();
      frog.userData.species = 'frog';
      frog.scale.set(0.9, 0.7, 0.9);
      return frog;
    }
    case 'deer': {
      const deer = createFoxModel();
      deer.userData.species = 'deer';
      deer.scale.set(1.1, 1.3, 1.1);
      return deer;
    }
    case 'dragon': {
      const dragon = createOwlModel();
      dragon.userData.species = 'dragon';
      dragon.scale.set(1.3, 1.3, 1.3);
      return dragon;
    }
    case 'phoenix': {
      const phoenix = createOwlModel();
      phoenix.userData.species = 'phoenix';
      phoenix.scale.set(1.25, 1.25, 1.25);
      return phoenix;
    }
    default:
      return createFoxModel();
  }
}

// --- PET DEN / PET SANCTUARY PROCEDURAL MODELS ---

export function createPetHouse(): THREE.Group {
  const house = new THREE.Group();
  house.name = 'pet_house';

  const woodMat = new THREE.MeshStandardMaterial({ color: 0xa67c52, roughness: 0.85 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x9e2a2b, roughness: 0.75 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xffeedd, roughness: 0.8 });
  const darkInteriorMat = new THREE.MeshStandardMaterial({ color: 0x2b1e17, roughness: 0.95 });

  // Main body box
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.8), woodMat);
  body.position.set(0, 0.6, 0);
  body.castShadow = true;
  body.receiveShadow = true;

  // Doorway opening cutout simulation
  const doorHole = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.05), darkInteriorMat);
  doorHole.position.set(0, 0.45, 0.91);

  const doorArch = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 12, 1, false, 0, Math.PI), trimMat);
  doorArch.position.set(0, 0.9, 0.91);
  doorArch.rotation.z = Math.PI;

  // Roof Left slope
  const roofL = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 2.05), roofMat);
  roofL.position.set(-0.48, 1.48, 0);
  roofL.rotation.z = Math.PI / 4.2;
  roofL.castShadow = true;

  // Roof Right slope
  const roofR = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 2.05), roofMat);
  roofR.position.set(0.48, 1.48, 0);
  roofR.rotation.z = -Math.PI / 4.2;
  roofR.castShadow = true;

  // Front gable triangle
  const gableGeo = new THREE.BufferGeometry();
  const gableVertices = new Float32Array([
    -0.8, 1.2, 0.9,
     0.8, 1.2, 0.9,
     0.0, 1.85, 0.9,
  ]);
  gableGeo.setAttribute('position', new THREE.BufferAttribute(gableVertices, 3));
  gableGeo.computeVertexNormals();
  const frontGable = new THREE.Mesh(gableGeo, woodMat);

  // Little cute sign plate above doorway
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.06), trimMat);
  sign.position.set(0, 1.05, 0.94);

  // Soft straw bedding poking out
  const strawMat = new THREE.MeshStandardMaterial({ color: 0xf4a261, roughness: 0.95 });
  const straw = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.4), strawMat);
  straw.position.set(0, 0.03, 0.92);

  house.add(body, doorHole, doorArch, roofL, roofR, frontGable, sign, straw);
  return house;
}

export function createFoodBowl(): THREE.Group {
  const bowlGroup = new THREE.Group();
  bowlGroup.name = 'food_bowl';

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.8 });
  const foodMat = new THREE.MeshStandardMaterial({ color: 0xc8963e, roughness: 0.9 });
  const berryMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.5 });

  // Wooden outer bowl
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.28, 0.18, 12), woodMat);
  bowl.position.set(0, 0.09, 0);
  bowl.castShadow = true;

  // Kibble mounds
  const food = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), foodMat);
  food.position.set(0, 0.14, 0);

  // A couple of tasty red berries on top
  for (let i = 0; i < 3; i++) {
    const ang = (i * Math.PI * 2) / 3;
    const berry = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), berryMat);
    berry.position.set(Math.cos(ang) * 0.14, 0.25, Math.sin(ang) * 0.14);
    bowlGroup.add(berry);
  }

  bowlGroup.add(bowl, food);
  return bowlGroup;
}

export function createWaterBowl(): THREE.Group {
  const bowlGroup = new THREE.Group();
  bowlGroup.name = 'water_bowl';

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6c757d, roughness: 0.7 });
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.05,
    metalness: 0.3,
    transparent: true,
    opacity: 0.9,
  });

  // Ceramic/stone bowl
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.28, 0.18, 12), stoneMat);
  bowl.position.set(0, 0.09, 0);
  bowl.castShadow = true;

  // Glistening water disc
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.02, 12), waterMat);
  water.position.set(0, 0.15, 0);

  bowlGroup.add(bowl, water);
  return bowlGroup;
}

export function createPetBed(): THREE.Group {
  const bedGroup = new THREE.Group();
  bedGroup.name = 'pet_bed';

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x7f4f24, roughness: 0.85 });
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0x588157, roughness: 0.9 });
  const blanketMat = new THREE.MeshStandardMaterial({ color: 0xe9c46a, roughness: 0.85 });

  // Wooden circular border rim
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.2, 16), woodMat);
  rim.position.set(0, 0.1, 0);
  rim.castShadow = true;

  // Soft plump cushion
  const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.18, 16), cushionMat);
  cushion.position.set(0, 0.14, 0);

  // Warm folded blanket
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.45), blanketMat);
  blanket.position.set(0.2, 0.23, 0.1);
  blanket.rotation.y = 0.25;

  bedGroup.add(rim, cushion, blanket);
  return bedGroup;
}

export function createPlayBall(color = 0xff0054): THREE.Group {
  const group = new THREE.Group();
  group.name = 'play_ball';

  const ballMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.3 });

  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), ballMat);
  ball.position.set(0, 0.28, 0);
  ball.castShadow = true;

  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.06, 12), stripeMat);
  stripe.position.set(0, 0.28, 0);

  group.add(ball, stripe);
  return group;
}

export function createSanctuaryArchway(title: string): THREE.Group {
  const arch = new THREE.Group();
  arch.name = 'sanctuary_arch';

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6f4e37, roughness: 0.85 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x38b000, roughness: 0.85 });
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0xff4d6d, roughness: 0.6 });
  const signMat = new THREE.MeshStandardMaterial({ color: 0xfefae0, roughness: 0.8 });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffb703,
    emissive: 0xffaa00,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });

  // Left Post
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 3.4, 8), woodMat);
  postL.position.set(-1.8, 1.7, 0);
  postL.castShadow = true;

  // Right Post
  const postR = postL.clone();
  postR.position.set(1.8, 1.7, 0);

  // Top Curved Beam
  const beam = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.32, 0.4), woodMat);
  beam.position.set(0, 3.4, 0);
  beam.castShadow = true;

  // Wooden Signboard with Title
  const signboard = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.65, 0.12), signMat);
  signboard.position.set(0, 3.2, 0.15);
  signboard.castShadow = true;

  // Flowering Vines wrap around posts
  for (let y = 0.5; y <= 3.2; y += 0.5) {
    const vineL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), leafMat);
    vineL.position.set(-1.8 + (Math.random() - 0.5) * 0.15, y, (Math.random() - 0.5) * 0.2);
    const flowerL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 5), flowerMat);
    flowerL.position.set(-1.75, y + 0.1, 0.18);

    const vineR = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), leafMat);
    vineR.position.set(1.8 + (Math.random() - 0.5) * 0.15, y, (Math.random() - 0.5) * 0.2);
    const flowerR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 5), flowerMat);
    flowerR.position.set(1.75, y + 0.1, 0.18);

    arch.add(vineL, flowerL, vineR, flowerR);
  }

  // Hanging Lantern from beam
  const lanternPost = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), woodMat);
  lanternPost.position.set(-1.2, 3.0, 0);
  const lanternGlass = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.22), lanternMat);
  lanternGlass.position.set(-1.2, 2.7, 0);

  const lanternPostR = lanternPost.clone();
  lanternPostR.position.set(1.2, 3.0, 0);
  const lanternGlassR = lanternGlass.clone();
  lanternGlassR.position.set(1.2, 2.7, 0);

  arch.add(postL, postR, beam, signboard, lanternPost, lanternGlass, lanternPostR, lanternGlassR);
  return arch;
}

// ==========================================
// PROMINENT PET DEN (SANCTUARY) BUILDING
// ==========================================
export function createPetDenBuilding(): THREE.Group {
  const building = new THREE.Group();
  building.name = 'pet_den_building';

  const woodWallMat = new THREE.MeshStandardMaterial({ color: 0x855835, roughness: 0.85 });
  const woodDarkMat = new THREE.MeshStandardMaterial({ color: 0x54361c, roughness: 0.9 });
  const stoneBaseMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.95 });
  const roofShingleMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 }); // Forest green shingles
  const roofTrimMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.75 });
  const goldSignMat = new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.7 });
  const warmGlowMat = new THREE.MeshBasicMaterial({ color: 0xffbe53 });
  const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

  // 1. Mossy Cobblestone Base / Foundation
  const base = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.45, 5.4), stoneBaseMat);
  base.position.set(0, 0.22, 0);
  base.castShadow = true;
  base.receiveShadow = true;
  building.add(base);

  // 2. Timber Log Walls
  const walls = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.9, 4.8), woodWallMat);
  walls.position.set(0, 1.85, 0);
  walls.castShadow = true;
  walls.receiveShadow = true;
  building.add(walls);

  // 3. Welcoming Porch Deck (extending forward along +Z)
  const porch = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.35, 2.0), woodDarkMat);
  porch.position.set(0, 0.2, 2.8);
  porch.receiveShadow = true;
  building.add(porch);

  // Porch Steps
  const step = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 0.8), stoneBaseMat);
  step.position.set(0, 0.09, 4.0);
  step.receiveShadow = true;
  building.add(step);

  // 4. Porch Pillars
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x6f4e37, roughness: 0.85 });
  const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 2.6, 8), pillarMat);
  pillarL.position.set(-2.2, 1.4, 3.6);
  pillarL.castShadow = true;
  const pillarR = pillarL.clone();
  pillarR.position.set(2.2, 1.4, 3.6);
  building.add(pillarL, pillarR);

  // Hanging Porch Lanterns
  const lanternL = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), lanternMat);
  lanternL.position.set(-2.2, 2.3, 3.6);
  const lanternR = lanternL.clone();
  lanternR.position.set(2.2, 2.3, 3.6);
  building.add(lanternL, lanternR);

  // Porch Overhang Roof
  const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.2, 1.8), roofShingleMat);
  porchRoof.position.set(0, 2.75, 2.9);
  porchRoof.rotation.x = 0.18;
  porchRoof.castShadow = true;
  building.add(porchRoof);

  // 5. Main Gabled Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.5, 4), roofShingleMat);
  roof.position.set(0, 4.3, 0);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.15, 1, 0.95);
  roof.castShadow = true;
  building.add(roof);

  // Roof Crest Trim
  const roofCrest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 5.2), roofTrimMat);
  roofCrest.position.set(0, 5.2, 0);
  building.add(roofCrest);

  // 6. Arched Doorway with Warm Interior Glow
  const doorCutout = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.1, 0.2), new THREE.MeshBasicMaterial({ color: 0x24150c }));
  doorCutout.position.set(0, 1.25, 2.42);
  building.add(doorCutout);

  const doorGlow = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.1), warmGlowMat);
  doorGlow.position.set(0, 1.15, 2.45);
  building.add(doorGlow);

  // Warm interior PointLight
  const interiorLight = new THREE.PointLight(0xffbe53, 1.6, 7.5);
  interiorLight.position.set(0, 1.6, 2.8);
  building.add(interiorLight);

  // 7. Large Carved Wooden Signboard: "🐾 PET DEN"
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.7, 0.15), goldSignMat);
  signBoard.position.set(0, 2.5, 2.5);
  signBoard.castShadow = true;
  building.add(signBoard);

  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 128;
  const sCtx = signCanvas.getContext('2d');
  if (sCtx) {
    sCtx.fillStyle = '#fef3c7';
    sCtx.fillRect(0, 0, 512, 128);
    sCtx.lineWidth = 8;
    sCtx.strokeStyle = '#78350f';
    sCtx.strokeRect(6, 6, 500, 116);
    sCtx.fillStyle = '#78350f';
    sCtx.font = 'bold 54px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText('🐾  PET DEN  🐾', 256, 64);
  }
  const signTexture = new THREE.CanvasTexture(signCanvas);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 0.65),
    new THREE.MeshBasicMaterial({ map: signTexture, transparent: true })
  );
  signMesh.position.set(0, 2.5, 2.58);
  building.add(signMesh);

  // 8. Stone Chimney on the side
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.2, 0.8), stoneBaseMat);
  chimney.position.set(2.2, 4.2, -0.8);
  chimney.castShadow = true;
  building.add(chimney);

  // 9. Floating 3D Beacon Billboard (visible clearly from across the whole farm)
  const beaconCanvas = document.createElement('canvas');
  beaconCanvas.width = 384;
  beaconCanvas.height = 128;
  const bCtx = beaconCanvas.getContext('2d');
  if (bCtx) {
    bCtx.fillStyle = 'rgba(13, 148, 136, 0.95)';
    bCtx.beginPath();
    bCtx.roundRect(8, 8, 368, 112, 28);
    bCtx.fill();
    bCtx.lineWidth = 6;
    bCtx.strokeStyle = '#5eead4';
    bCtx.stroke();
    bCtx.fillStyle = '#ffffff';
    bCtx.font = 'bold 44px sans-serif';
    bCtx.textAlign = 'center';
    bCtx.textBaseline = 'middle';
    bCtx.fillText('🏡 PET DEN', 192, 48);
    bCtx.fillStyle = '#99f6e4';
    bCtx.font = 'bold 24px sans-serif';
    bCtx.fillText('🐾 Pet Sanctuary', 192, 88);
  }
  const beaconTexture = new THREE.CanvasTexture(beaconCanvas);
  const beaconSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: beaconTexture, transparent: true, depthTest: false }));
  beaconSprite.scale.set(3.4, 1.15, 1);
  beaconSprite.position.set(0, 6.2, 0);
  building.add(beaconSprite);

  // 10. Porch Props: Miniature Doghouse, Food Bowl, Water Bowl, Pet Cushion
  const miniHouse = createPetHouse();
  miniHouse.scale.set(0.65, 0.65, 0.65);
  miniHouse.position.set(-1.8, 0.38, 2.8);
  miniHouse.rotation.y = Math.PI / 4;
  building.add(miniHouse);

  const petBed = createPetBed();
  petBed.scale.set(0.8, 0.8, 0.8);
  petBed.position.set(1.7, 0.38, 2.7);
  building.add(petBed);

  const foodB = createFoodBowl();
  foodB.scale.set(0.85, 0.85, 0.85);
  foodB.position.set(1.2, 0.38, 3.4);
  building.add(foodB);

  const waterB = createWaterBowl();
  waterB.scale.set(0.85, 0.85, 0.85);
  waterB.position.set(1.7, 0.38, 3.4);
  building.add(waterB);

  return building;
}



