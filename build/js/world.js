// =====================================================
//  Aurora Skylines — World: Ground, Stars, Particles
// =====================================================
'use strict';

// ── Ground ────────────────────────────────────────
function buildGround() {
  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      const col = new THREE.Color().lerpColors(
        new THREE.Color(0x143d28),
        new THREE.Color(0x1f5c3e),
        0.35 + Math.random() * 0.65
      );
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(CELL - 0.08, 0.16, CELL - 0.08),
        new THREE.MeshPhongMaterial({ color: col, flatShading: true, shininess: 6 })
      );
      m.position.set(x * CELL - HALF + CELL / 2, 0, z * CELL - HALF + CELL / 2);
      m.receiveShadow = true;
      scene.add(m);
    }
  }
  // Outer border frame
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(GRID * CELL + 0.55, 0.12, GRID * CELL + 0.55),
    new THREE.MeshPhongMaterial({ color: 0x0a1f14, flatShading: true, shininess: 10 })
  );
  frame.position.y = -0.1;
  frame.receiveShadow = true;
  scene.add(frame);
}

// ── Starfield ─────────────────────────────────────
function buildStars() {
  const sp = new Float32Array(420 * 3);
  for (let i = 0; i < 420; i++) {
    sp[i * 3]     = (Math.random() - 0.5) * 260;
    sp[i * 3 + 1] = 26 + Math.random() * 60;
    sp[i * 3 + 2] = (Math.random() - 0.5) * 260;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({
    color: 0xe0e7ff, size: 0.2, transparent: true, opacity: 0.72, sizeAttenuation: true
  })));
}

// ── Firefly Particles ─────────────────────────────
const PC    = 96;
const pArr  = new Float32Array(PC * 3);
const pVel  = [];
const pPhase = [];

for (let i = 0; i < PC; i++) {
  pArr[i * 3]     = (Math.random() - 0.5) * GRID * CELL;
  pArr[i * 3 + 1] = Math.random() * 8;
  pArr[i * 3 + 2] = (Math.random() - 0.5) * GRID * CELL;
  pVel.push({ x: (Math.random() - 0.5) * 0.012, y: 0.012 + Math.random() * 0.02, z: (Math.random() - 0.5) * 0.012 });
  pPhase.push(Math.random() * Math.PI * 2);
}

const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
const pMat = new THREE.PointsMaterial({ color: 0xfef9c3, size: 0.12, transparent: true, opacity: 0.58, sizeAttenuation: true });
scene.add(new THREE.Points(pGeo, pMat));

let partT = 0;

function animPart(dt) {
  partT += dt;
  const a = pGeo.attributes.position.array;
  const b = GRID * CELL * 0.5;
  for (let i = 0; i < PC; i++) {
    a[i * 3]     += pVel[i].x;
    a[i * 3 + 1] += pVel[i].y;
    a[i * 3 + 2] += pVel[i].z;
    if (a[i * 3 + 1] > 11) {
      a[i * 3]     = (Math.random() - 0.5) * b * 2;
      a[i * 3 + 1] = 0;
      a[i * 3 + 2] = (Math.random() - 0.5) * b * 2;
    }
  }
  pGeo.attributes.position.needsUpdate = true;
  pMat.opacity = 0.45 + 0.22 * Math.sin(partT * 1.4);
}
