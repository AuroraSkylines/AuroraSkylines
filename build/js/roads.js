// =====================================================
//  Aurora Skylines — Roads
// =====================================================
'use strict';

function addKerb(g, x, z, w, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.26, d), mat);
  m.position.set(x, 0, z); m.receiveShadow = true; g.add(m);
}

function makeRoad(gx, gz) {
  const g = new THREE.Group();
  const matA = new THREE.MeshPhongMaterial({ color:0x3d4452, flatShading:true, shininess:12 });
  const matL = new THREE.MeshPhongMaterial({ color:0xf5e6a8, flatShading:true, shininess:35, emissive:0x332200, emissiveIntensity:0.04 });
  const matS = new THREE.MeshPhongMaterial({ color:0x252a33, flatShading:true, shininess:8 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(CELL - 0.05, 0.22, CELL - 0.05), matA);
  base.castShadow = true; base.receiveShadow = true; g.add(base);

  const N = state.grid[key(gx, gz-1)]?.type === 'road';
  const S = state.grid[key(gx, gz+1)]?.type === 'road';
  const W = state.grid[key(gx-1, gz)]?.type === 'road';
  const E = state.grid[key(gx+1, gz)]?.type === 'road';
  const kw = 0.14;

  if (!N) addKerb(g, 0, -(CELL/2-kw/2), CELL, kw, matS);
  if (!S) addKerb(g, 0,  (CELL/2-kw/2), CELL, kw, matS);
  if (!W) addKerb(g, -(CELL/2-kw/2), 0, kw, CELL, matS);
  if (!E) addKerb(g,  (CELL/2-kw/2), 0, kw, CELL, matS);

  const nLinks = (N?1:0) + (S?1:0) + (E?1:0) + (W?1:0);
  const isStraightNS = (N || S) && !E && !W;
  const isStraightEW = (E || W) && !N && !S;

  if (nLinks > 2) {
    if (N) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(.08,.24,.29), matL); c.position.set(0,0,-0.105); g.add(c);
      const d = new THREE.Mesh(new THREE.BoxGeometry(.08,.24,.5), matL); d.position.set(0,0,-0.78); g.add(d);
      const e = new THREE.Mesh(new THREE.BoxGeometry(.08,.24,.22), matL); e.position.set(0,0,-(CELL/2-.05)); g.add(e);
    }
    if (S) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(.08,.24,.29), matL); c.position.set(0,0,0.105); g.add(c);
      const d = new THREE.Mesh(new THREE.BoxGeometry(.08,.24,.5), matL); d.position.set(0,0,0.78); g.add(d);
      const e = new THREE.Mesh(new THREE.BoxGeometry(.08,.24,.22), matL); e.position.set(0,0,(CELL/2-.05)); g.add(e);
    }
    if (E) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(.29,.24,.08), matL); c.position.set(0.105,0,0); g.add(c);
      const d = new THREE.Mesh(new THREE.BoxGeometry(.5,.24,.08), matL); d.position.set(0.78,0,0); g.add(d);
      const e = new THREE.Mesh(new THREE.BoxGeometry(.22,.24,.08), matL); e.position.set((CELL/2-.05),0,0); g.add(e);
    }
    if (W) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(.29,.24,.08), matL); c.position.set(-0.105,0,0); g.add(c);
      const d = new THREE.Mesh(new THREE.BoxGeometry(.5,.24,.08), matL); d.position.set(-0.78,0,0); g.add(d);
      const e = new THREE.Mesh(new THREE.BoxGeometry(.22,.24,.08), matL); e.position.set(-(CELL/2-.05),0,0); g.add(e);
    }
  } else if (isStraightNS) {
    [-1,0,1].forEach(i => {
      const d = new THREE.Mesh(new THREE.BoxGeometry(.08,.24,.5), matL);
      d.position.set(0,0,i*.78); g.add(d);
    });
    if (N) { const e=new THREE.Mesh(new THREE.BoxGeometry(.08,.24,.22),matL); e.position.set(0,0,-(CELL/2-.05)); g.add(e); }
    if (S) { const e=new THREE.Mesh(new THREE.BoxGeometry(.08,.24,.22),matL); e.position.set(0,0, (CELL/2-.05)); g.add(e); }
  } else if (isStraightEW || nLinks === 0) {
    [-1,0,1].forEach(i => {
      const d = new THREE.Mesh(new THREE.BoxGeometry(.5,.24,.08), matL);
      d.position.set(i*.78,0,0); g.add(d);
    });
    if (W) { const e=new THREE.Mesh(new THREE.BoxGeometry(.22,.24,.08),matL); e.position.set(-(CELL/2-.05),0,0); g.add(e); }
    if (E) { const e=new THREE.Mesh(new THREE.BoxGeometry(.22,.24,.08),matL); e.position.set( (CELL/2-.05),0,0); g.add(e); }
  } else {
    const diag = new THREE.Mesh(new THREE.BoxGeometry(.08,.24,.5), matL);
    if (N && E) {
      diag.position.set(0.366, 0, -0.366); diag.rotation.y = Math.PI/4;
      const e1 = new THREE.Mesh(new THREE.BoxGeometry(.08,.24,.22), matL); e1.position.set(0,0,-(CELL/2-.05)); g.add(e1);
      const e2 = new THREE.Mesh(new THREE.BoxGeometry(.22,.24,.08), matL); e2.position.set((CELL/2-.05),0,0); g.add(e2);
    } else if (N && W) {
      diag.position.set(-0.366, 0, -0.366); diag.rotation.y = -Math.PI/4;
      const e1 = new THREE.Mesh(new THREE.BoxGeometry(.08,.24,.22), matL); e1.position.set(0,0,-(CELL/2-.05)); g.add(e1);
      const e2 = new THREE.Mesh(new THREE.BoxGeometry(.22,.24,.08), matL); e2.position.set(-(CELL/2-.05),0,0); g.add(e2);
    } else if (S && E) {
      diag.position.set(0.366, 0, 0.366); diag.rotation.y = -Math.PI/4;
      const e1 = new THREE.Mesh(new THREE.BoxGeometry(.08,.24,.22), matL); e1.position.set(0,0,(CELL/2-.05)); g.add(e1);
      const e2 = new THREE.Mesh(new THREE.BoxGeometry(.22,.24,.08), matL); e2.position.set((CELL/2-.05),0,0); g.add(e2);
    } else if (S && W) {
      diag.position.set(-0.366, 0, 0.366); diag.rotation.y = Math.PI/4;
      const e1 = new THREE.Mesh(new THREE.BoxGeometry(.08,.24,.22), matL); e1.position.set(0,0,(CELL/2-.05)); g.add(e1);
      const e2 = new THREE.Mesh(new THREE.BoxGeometry(.22,.24,.08), matL); e2.position.set(-(CELL/2-.05),0,0); g.add(e2);
    }
    g.add(diag);
  }

  if (seededRandom(gx, gz, 5) > 0.7) {
    const manhole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.14, 8), new THREE.MeshPhongMaterial({color:0x333333}));
    manhole.position.set(seededRandom(gx, gz, 6)*0.6 - 0.3, 0.08, seededRandom(gx, gz, 7)*0.6 - 0.3);
    g.add(manhole);
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
  g.userData = { type:'road', gx, gz };
  scene.add(g);
  state.meshes[k] = g;
}
