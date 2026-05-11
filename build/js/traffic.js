// =====================================================
//  Aurora Skylines — Traffic & Pathfinding
// =====================================================
'use strict';

function findRoadPath(sgx, sgz, tgx, tgz) {
  const goal = key(tgx, tgz);
  const start = key(sgx, sgz);
  if (state.grid[start]?.type !== 'road' || state.grid[goal]?.type !== 'road') return null;
  const q = [[sgx, sgz]];
  const prev = new Map([[start, null]]);
  while (q.length) {
    const [x, z] = q.shift();
    if (key(x, z) === goal) {
      const path = [];
      let cur = goal;
      while (cur) {
        path.push(cur.split(',').map(Number));
        cur = prev.get(cur);
      }
      return path.reverse();
    }
    for (const [nx, nz] of neighbours(x, z)) {
      const nk = key(nx, nz);
      if (prev.has(nk)) continue;
      if (state.grid[nk]?.type !== 'road') continue;
      prev.set(nk, key(x, z));
      q.push([nx, nz]);
    }
  }
  return null;
}

function makeCarMesh() {
  const g = new THREE.Group();
  const variant = Math.floor(Math.random() * 3);
  const col = new THREE.Color().setHSL(Math.random(), 0.55, 0.52);
  const darkCol = col.clone().offsetHSL(0, 0, -0.08);
  const mat = new THREE.MeshPhongMaterial({ color: col, flatShading: true, shininess: 60, specular: 0x444444 });
  const dMat = new THREE.MeshPhongMaterial({ color: darkCol, flatShading: true, shininess: 50 });
  const wMat = new THREE.MeshPhongMaterial({ color: 0x111111, flatShading: true });
  const hMat = new THREE.MeshPhongMaterial({ color: 0xfffde7, emissive: 0xffaa66, emissiveIntensity: 0.8 });

  const addWheels = (zOffsets) => {
    [-0.2, 0.2].forEach(x => {
      zOffsets.forEach(z => {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 6), wMat);
        w.rotation.z = Math.PI/2;
        w.position.set(x, 0.06, z);
        g.add(w);
      });
    });
  };

  if (variant === 0) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.64), mat);
    body.position.y = 0.14; body.castShadow = true; g.add(body);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.32), dMat);
    roof.position.set(0, 0.28, -0.04); roof.castShadow = true; g.add(roof);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.08), hMat);
    head.position.set(0, 0.14, 0.34); g.add(head);
    addWheels([-0.2, 0.2]);
  } else if (variant === 1) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.22, 0.7), mat);
    body.position.y = 0.17; body.castShadow = true; g.add(body);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.45), dMat);
    roof.position.set(0, 0.35, -0.08); roof.castShadow = true; g.add(roof);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.08), hMat);
    head.position.set(0, 0.16, 0.37); g.add(head);
    addWheels([-0.22, 0.22]);
  } else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.15, 0.8), mat);
    body.position.y = 0.14; body.castShadow = true; g.add(body);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.3), dMat);
    cab.position.set(0, 0.29, 0.15); cab.castShadow = true; g.add(cab);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.08), hMat);
    head.position.set(0, 0.14, 0.42); g.add(head);
    addWheels([-0.26, 0.26]);
  }
  return g;
}

function trySpawnCar() {
  const transit = getUpgradeLevel('transit_ai');
  const maxCars = 12 + transit * 10;
  if (cars.length >= maxCars) return;
  const roadEntries = Object.entries(state.grid).filter(([, v]) => v.type === 'road');
  if (roadEntries.length < 2) return;
  let path = null;
  for (let attempt = 0; attempt < 12 && !path; attempt++) {
    const a = roadEntries[Math.floor(Math.random() * roadEntries.length)];
    const b = roadEntries[Math.floor(Math.random() * roadEntries.length)];
    if (a[0] === b[0]) continue;
    const [gx1, gz1] = a[0].split(',').map(Number);
    const [gx2, gz2] = b[0].split(',').map(Number);
    path = findRoadPath(gx1, gz1, gx2, gz2);
  }
  if (!path || path.length < 2) return;

  const mesh = makeCarMesh();
  const [gx0, gz0] = path[0];
  const [gx1, gz1] = path[1];
  const cur = worldPos(gx0, gz0);
  const nxt = worldPos(gx1, gz1);
  const dx = nxt.x - cur.x, dz = nxt.z - cur.z;
  const len = Math.hypot(dx, dz) || 1;
  const px = (-dz / len) * 0.3, pz = (dx / len) * 0.3;
  mesh.position.set(cur.x + px, 0.2, cur.z + pz);
  mesh.rotation.y = Math.atan2(dx, dz);
  scene.add(mesh);

  cars.push({
    mesh,
    path,
    segI: 0,
    along: 0,
    speed: 5.5 + Math.random() * 3.2,
    lane: 0.3,
  });
}

function updateCars(dt) {
  for (let i = cars.length - 1; i >= 0; i--) {
    const car = cars[i];
    const { path } = car;
    if (!path || car.segI >= path.length - 1) {
      scene.remove(car.mesh);
      cars.splice(i, 1);
      continue;
    }
    const [gx, gz] = path[car.segI];
    const [ngx, ngz] = path[car.segI + 1];
    const cur = worldPos(gx, gz);
    const nxt = worldPos(ngx, ngz);
    const dx = nxt.x - cur.x, dz = nxt.z - cur.z;
    const len = Math.hypot(dx, dz) || 1;
    const px = (-dz / len) * car.lane, pz = (dx / len) * car.lane;
    const fx = cur.x + px, fz = cur.z + pz;
    const tx = nxt.x + px, tz = nxt.z + pz;
    car.along += car.speed * dt;
    if (car.along >= len) {
      car.along = 0;
      car.segI++;
      if (car.segI >= path.length - 1) {
        scene.remove(car.mesh);
        cars.splice(i, 1);
        continue;
      }
    } else {
      const t = car.along / len;
      car.mesh.position.x = fx + (tx - fx) * t;
      car.mesh.position.z = fz + (tz - fz) * t;
      car.mesh.position.y = 0.2;
      car.mesh.rotation.y = Math.atan2(dx, dz);
    }
  }
}
