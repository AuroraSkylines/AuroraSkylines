// =====================================================
//  Aurora Skylines — World: Ground, Water, Stars, Particles
// =====================================================
'use strict';

// ── Ground ────────────────────────────────────────
let waterMesh = null;
let waterT = 0;

function buildGround() {
  const GRASS_COLS = [0x2d6a4f, 0x40916c, 0x1b4332, 0x52b788, 0x245c40, 0x388659];
  const DIRT_COLS  = [0x3a2d1e, 0x4a3828, 0x2e2318];

  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      const rnd = seededRandom(x, z, 0);
      const rnd2 = seededRandom(x, z, 1);
      const rnd3 = seededRandom(x, z, 2);

      // Slight height jitter for organic feel
      const yOff = (rnd3 - 0.5) * 0.06;

      // Occasionally a dirt patch
      let col;
      if (rnd2 < 0.06) {
        col = DIRT_COLS[Math.floor(rnd2 * 50) % DIRT_COLS.length];
      } else {
        col = GRASS_COLS[Math.floor(rnd * GRASS_COLS.length)];
      }

      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(CELL - 0.06, 0.18 + Math.abs(yOff), CELL - 0.06),
        new THREE.MeshPhongMaterial({ color: col, flatShading: true, shininess: 4 })
      );
      tile.position.set(
        x * CELL - HALF + CELL / 2,
        yOff,
        z * CELL - HALF + CELL / 2
      );
      tile.receiveShadow = true;
      scene.add(tile);

      // Grass tufts on some tiles (decorative only, skipped by buildings placed later)
      if (rnd > 0.72) {
        const count = Math.floor(rnd * 3) + 1;
        for (let t = 0; t < count; t++) {
          const tx = seededRandom(x, z, 10 + t) * (CELL - 0.5) - (CELL - 0.5) / 2;
          const tz = seededRandom(x, z, 20 + t) * (CELL - 0.5) - (CELL - 0.5) / 2;
          const th = 0.12 + seededRandom(x, z, 30 + t) * 0.14;
          const tuft = new THREE.Mesh(
            new THREE.ConeGeometry(0.06, th, 3),
            new THREE.MeshPhongMaterial({
              color: new THREE.Color().setHSL(0.33 + seededRandom(x, z, 40 + t) * 0.06, 0.7, 0.28),
              flatShading: true
            })
          );
          tuft.position.set(
            x * CELL - HALF + CELL / 2 + tx,
            yOff + 0.09 + th / 2,
            z * CELL - HALF + CELL / 2 + tz
          );
          tuft.userData.isGrassTuft = true;
          scene.add(tuft);
        }
      }
    }
  }

  // ── Outer cliff edge ──────────────────────────────
  const edgeSize = GRID * CELL + 1.6;
  const cliffMat = new THREE.MeshPhongMaterial({ color: 0x2a3a2e, flatShading: true });
  const cliff = new THREE.Mesh(
    new THREE.BoxGeometry(edgeSize, 0.8, edgeSize),
    cliffMat
  );
  cliff.position.y = -0.42;
  cliff.receiveShadow = true;
  scene.add(cliff);

  // ── Water ring ────────────────────────────────────
  if (window.gfxSettings?.waterEffects !== 'off') {
    const waterSize = GRID * CELL + 22;
    const waterMat = new THREE.MeshPhongMaterial({
      color: 0x0a3a5c,
      emissive: 0x0a3a5c,
      emissiveIntensity: 0.25,
      shininess: 120,
      flatShading: true,
      transparent: true,
      opacity: 0.88
    });
    waterMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(waterSize, waterSize, 12, 12),
      waterMat
    );
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = -0.85;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);

    // Water foam/edge border strips
    const foamMat = new THREE.MeshPhongMaterial({ color: 0x4aa8cc, flatShading: true, transparent: true, opacity: 0.55 });
    const foamH = 0.12;
    const halfW = GRID * CELL / 2 + 0.6;
    const foamDepth = 2.2;
    [
      [0,                       -halfW - foamDepth / 2,  GRID * CELL + foamDepth * 2, foamDepth],
      [0,                        halfW + foamDepth / 2,  GRID * CELL + foamDepth * 2, foamDepth],
      [-halfW - foamDepth / 2,  0,                       foamDepth,                   GRID * CELL],
      [ halfW + foamDepth / 2,  0,                       foamDepth,                   GRID * CELL],
    ].forEach(([fx, fz, fw, fd]) => {
      const foam = new THREE.Mesh(new THREE.BoxGeometry(fw, foamH, fd), foamMat);
      foam.position.set(fx, -0.82, fz);
      scene.add(foam);
    });
  }
}

// ── Starfield ─────────────────────────────────────
function buildStars() {
  const STAR_COUNT = 1400;
  const sp = new Float32Array(STAR_COUNT * 3);
  const sc = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    sp[i * 3]     = (Math.random() - 0.5) * 300;
    sp[i * 3 + 1] = 28 + Math.random() * 80;
    sp[i * 3 + 2] = (Math.random() - 0.5) * 300;
    // Slight color variation: some blue-white, some warm white
    const warm = Math.random() > 0.7;
    sc[i * 3]     = warm ? 1.0 : 0.88;
    sc[i * 3 + 1] = warm ? 0.95 : 0.92;
    sc[i * 3 + 2] = warm ? 0.8  : 1.0;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({
    vertexColors: true,
    size: 0.22,
    transparent: true,
    opacity: 0.82,
    sizeAttenuation: true
  })));
}

// ── Firefly Particles ─────────────────────────────
const PC     = 120;
const pArr   = new Float32Array(PC * 3);
const pVel   = [];
const pPhase = [];

for (let i = 0; i < PC; i++) {
  pArr[i * 3]     = (Math.random() - 0.5) * GRID * CELL;
  pArr[i * 3 + 1] = Math.random() * 9;
  pArr[i * 3 + 2] = (Math.random() - 0.5) * GRID * CELL;
  pVel.push({
    x: (Math.random() - 0.5) * 0.013,
    y: 0.01 + Math.random() * 0.022,
    z: (Math.random() - 0.5) * 0.013
  });
  pPhase.push(Math.random() * Math.PI * 2);
}

const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
const pMat = new THREE.PointsMaterial({
  color: 0xfefcc0,
  size: 0.14,
  transparent: true,
  opacity: 0.62,
  sizeAttenuation: true
});
const particlePoints = new THREE.Points(pGeo, pMat);
scene.add(particlePoints);

let partT = 0;

function animPart(dt) {
  partT += dt;

  // Water shimmer
  if (waterMesh) {
    waterT = (waterT || 0) + dt;
    waterMesh.material.emissiveIntensity = 0.18 + 0.10 * Math.sin(waterT * 0.9);
    // Subtle color shift
    const hue = 0.55 + 0.02 * Math.sin(waterT * 0.3);
    waterMesh.material.color.setHSL(hue, 0.7, 0.22);
    waterMesh.material.emissive.setHSL(hue, 0.7, 0.22);
  }

  // Skip particle update if disabled
  if (window.gfxSettings?.particles === 'off') {
    particlePoints.visible = false;
    return;
  }
  particlePoints.visible = true;

  const a = pGeo.attributes.position.array;
  const b = GRID * CELL * 0.5;
  for (let i = 0; i < PC; i++) {
    a[i * 3]     += pVel[i].x;
    a[i * 3 + 1] += pVel[i].y;
    a[i * 3 + 2] += pVel[i].z;
    if (a[i * 3 + 1] > 12) {
      a[i * 3]     = (Math.random() - 0.5) * b * 2;
      a[i * 3 + 1] = 0;
      a[i * 3 + 2] = (Math.random() - 0.5) * b * 2;
    }
  }
  pGeo.attributes.position.needsUpdate = true;
  pMat.opacity = 0.48 + 0.24 * Math.sin(partT * 1.2);
}
