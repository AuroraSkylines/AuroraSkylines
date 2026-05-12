// =====================================================
//  Aurora Skylines — Roads (Remodelled)
// =====================================================
'use strict';

// Shared materials (created once, reused)
const _roadMats = {
  asphalt:  new THREE.MeshPhongMaterial({ color: 0x2a2e38, flatShading: true, shininess: 18 }),
  sidewalk: new THREE.MeshPhongMaterial({ color: 0x5a5e68, flatShading: true, shininess: 6 }),
  curb:     new THREE.MeshPhongMaterial({ color: 0x4a505e, flatShading: true, shininess: 4 }),
  marking:  new THREE.MeshPhongMaterial({ color: 0xf0e8c0, flatShading: true, emissive: 0x332200, emissiveIntensity: 0.06, shininess: 30 }),
  stopLine: new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true, emissive: 0x221100, emissiveIntensity: 0.04 }),
  manhole:  new THREE.MeshPhongMaterial({ color: 0x3a3e48, flatShading: true, shininess: 25 }),
  lampPole: new THREE.MeshPhongMaterial({ color: 0x5a5e72, flatShading: true }),
  lampHead: new THREE.MeshPhongMaterial({ color: 0xffdd88, emissive: 0xffaa22, emissiveIntensity: 0.0, flatShading: true }),
};

function _addBox(g, x, y, z, w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = false;
  m.receiveShadow = true;
  g.add(m);
  return m;
}

function _addLampPost(g, x, z, rotY) {
  // Pole
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.055, 1.4, 5),
    _roadMats.lampPole
  );
  pole.position.set(x, 0.82, z);
  pole.castShadow = true;
  g.add(pole);

  // Arm
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.05, 0.05),
    _roadMats.lampPole
  );
  arm.position.set(x + Math.sin(rotY) * 0.16, 1.52, z + Math.cos(rotY) * 0.16);
  arm.rotation.y = rotY;
  g.add(arm);

  // Lamp head (emissive, flagged for night glow)
  const lampMat = _roadMats.lampHead.clone();
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 5, 4),
    lampMat
  );
  head.position.set(x + Math.sin(rotY) * 0.32, 1.5, z + Math.cos(rotY) * 0.32);
  head.userData.isLamp = true;
  g.add(head);
}

function makeRoad(gx, gz) {
  const g = new THREE.Group();
  const half = CELL / 2;
  const sw = 0.28; // sidewalk width

  const N = state.grid[key(gx, gz-1)]?.type === 'road';
  const S = state.grid[key(gx, gz+1)]?.type === 'road';
  const W = state.grid[key(gx-1, gz)]?.type === 'road';
  const E = state.grid[key(gx+1, gz)]?.type === 'road';
  const nLinks = (N?1:0) + (S?1:0) + (E?1:0) + (W?1:0);

  // ── Asphalt base ──────────────────────────────
  _addBox(g, 0, 0.01, 0, CELL - 0.04, 0.24, CELL - 0.04, _roadMats.asphalt);

  // ── Sidewalks on open sides ────────────────────
  const swY = 0.14;
  const swH = 0.08;
  if (!N) _addBox(g, 0, swY, -(half - sw/2), CELL, swH, sw, _roadMats.sidewalk);
  if (!S) _addBox(g, 0, swY,  (half - sw/2), CELL, swH, sw, _roadMats.sidewalk);
  if (!W) _addBox(g, -(half - sw/2), swY, 0, sw, swH, CELL, _roadMats.sidewalk);
  if (!E) _addBox(g,  (half - sw/2), swY, 0, sw, swH, CELL, _roadMats.sidewalk);

  // ── Curbs ─────────────────────────────────────
  const curbH = 0.07;
  const curbW = 0.08;
  const curbY = 0.14;
  if (!N) _addBox(g, 0, curbY, -(half - sw - curbW/2), CELL, curbH, curbW, _roadMats.curb);
  if (!S) _addBox(g, 0, curbY,  (half - sw - curbW/2), CELL, curbH, curbW, _roadMats.curb);
  if (!W) _addBox(g, -(half - sw - curbW/2), curbY, 0, curbW, curbH, CELL, _roadMats.curb);
  if (!E) _addBox(g,  (half - sw - curbW/2), curbY, 0, curbW, curbH, CELL, _roadMats.curb);

  // ── Road markings ─────────────────────────────
  const mY = 0.14;
  const mH = 0.005;
  const isStraightNS = (N || S) && !E && !W;
  const isStraightEW = (E || W) && !N && !S;

  if (nLinks > 2) {
    // Intersection — stop lines on each incoming road
    if (N) {
      _addBox(g, 0, mY, -(half - sw - 0.15), 0.7, mH, 0.08, _roadMats.stopLine);
      _addBox(g, 0, mY, -0.5, 0.07, mH, 0.45, _roadMats.marking);
      _addBox(g, 0, mY, -1.05, 0.07, mH, 0.45, _roadMats.marking);
    }
    if (S) {
      _addBox(g, 0, mY, (half - sw - 0.15), 0.7, mH, 0.08, _roadMats.stopLine);
      _addBox(g, 0, mY, 0.5, 0.07, mH, 0.45, _roadMats.marking);
      _addBox(g, 0, mY, 1.05, 0.07, mH, 0.45, _roadMats.marking);
    }
    if (E) {
      _addBox(g, (half - sw - 0.15), mY, 0, 0.08, mH, 0.7, _roadMats.stopLine);
      _addBox(g, 0.5, mY, 0, 0.45, mH, 0.07, _roadMats.marking);
      _addBox(g, 1.05, mY, 0, 0.45, mH, 0.07, _roadMats.marking);
    }
    if (W) {
      _addBox(g, -(half - sw - 0.15), mY, 0, 0.08, mH, 0.7, _roadMats.stopLine);
      _addBox(g, -0.5, mY, 0, 0.45, mH, 0.07, _roadMats.marking);
      _addBox(g, -1.05, mY, 0, 0.45, mH, 0.07, _roadMats.marking);
    }
  } else if (isStraightNS) {
    // Dashed center line N-S
    [-0.9, -0.3, 0.3, 0.9].forEach(z => {
      _addBox(g, 0, mY, z, 0.07, mH, 0.38, _roadMats.marking);
    });
    // Edge cap lines
    if (N) _addBox(g, 0, mY, -(half - sw - 0.12), 0.07, mH, 0.22, _roadMats.marking);
    if (S) _addBox(g, 0, mY,  (half - sw - 0.12), 0.07, mH, 0.22, _roadMats.marking);
  } else if (isStraightEW || nLinks === 0) {
    // Dashed center line E-W
    [-0.9, -0.3, 0.3, 0.9].forEach(x => {
      _addBox(g, x, mY, 0, 0.38, mH, 0.07, _roadMats.marking);
    });
    if (W) _addBox(g, -(half - sw - 0.12), mY, 0, 0.22, mH, 0.07, _roadMats.marking);
    if (E) _addBox(g,  (half - sw - 0.12), mY, 0, 0.22, mH, 0.07, _roadMats.marking);
  } else {
    // Turning lane — short diagonal marking
    const ang = (N && E) ? -Math.PI/4 : (N && W) ? Math.PI/4 : (S && E) ? Math.PI/4 : -Math.PI/4;
    const mc = new THREE.Mesh(new THREE.BoxGeometry(0.07, mH, 0.7), _roadMats.marking);
    mc.position.set((E ? 0.4 : -0.4), mY, (N ? -0.4 : 0.4));
    mc.rotation.y = ang;
    g.add(mc);
  }

  // ── Manhole cover ─────────────────────────────
  if (seededRandom(gx, gz, 5) > 0.65) {
    const mh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.02, 8),
      _roadMats.manhole
    );
    mh.position.set(
      seededRandom(gx, gz, 6) * 0.8 - 0.4,
      0.14,
      seededRandom(gx, gz, 7) * 0.8 - 0.4
    );
    g.add(mh);
  }

  // ── Street lamp posts on dead-end / edge sides ─
  if (window.gfxSettings?.streetLights !== 'off') {
    if (!N && seededRandom(gx, gz, 50) > 0.4) _addLampPost(g, -0.6, -(half - 0.18), 0);
    if (!S && seededRandom(gx, gz, 51) > 0.4) _addLampPost(g,  0.6,  (half - 0.18), Math.PI);
    if (!W && seededRandom(gx, gz, 52) > 0.4) _addLampPost(g, -(half - 0.18), -0.6, -Math.PI/2);
    if (!E && seededRandom(gx, gz, 53) > 0.4) _addLampPost(g,  (half - 0.18),  0.6, Math.PI/2);
  }

  return g;
}

function rebuildRoad(gx, gz) {
  const k = key(gx, gz);
  if (state.grid[k]?.type !== 'road') return;
  const old = state.meshes[k];
  if (old) scene.remove(old);
  const g = makeRoad(gx, gz);
  g.position.copy(worldPos(gx, gz));
  g.userData = { type: 'road', gx, gz };
  scene.add(g);
  state.meshes[k] = g;
}
