// =====================================================
//  Aurora Skylines — Core Logic & Main Loop
// =====================================================
'use strict';

function tickDay(dt){
  state.dayTimer+=dt;
  updateDayBar();
  const cycle = 0.62 + 0.38 * Math.sin((state.dayTimer / state.DAY_LEN) * Math.PI * 2);
  applySkyPhase(cycle * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(state.day * 0.25))));

  if(state.dayTimer<state.DAY_LEN)return;
  state.dayTimer=0; state.day++;
  const dn = document.getElementById('day-num');
  if (dn) dn.textContent=state.day;

  let income=0;
  const earners=[];
  Object.entries(state.grid).forEach(([k,cell])=>{
    const inc = incomeForCell(cell);
    income += inc;
    if(inc>0) earners.push(k);
  });
  if(state.energy<0) income=Math.floor(income*0.6);
  income = Math.floor(income * happinessMultiplier());
  state.gold+=income;
  earners.sort(()=>Math.random()-.5).slice(0,5).forEach(k=>{
    const[gx,gz]=k.split(',').map(Number);
    const wp=worldPos(gx,gz); spawnCoin(wp.x,wp.z);
  });
  hudUpdate(true);
  updateIncomePreview();
  refreshUpgradeCards();

  if (state.day >= state.nextEventDay) {
    state.nextEventDay = state.day + 5 + Math.floor(Math.random() * 5);
    const events = [
      { msg: '🎉 City Festival! Parks thriving.', gold: 0, type: 'ok', condition: () => Object.values(state.grid).some(c => c.type==='park') },
      { msg: '💰 Tax Windfall! Budget surges.', gold: Math.max(120, Math.floor(state.pop * 8)), type: 'ok' },
      { msg: '⚡ Power Surge! Grid overloaded.', gold: -80, type: 'error', condition: () => state.energy > 0 },
      { msg: '🏗️ Construction Boom! Builders arrive.', gold: 200, type: 'ok', condition: () => state.pop > 10 },
      { msg: '🌧️ Storm damage. Repairs needed.', gold: -Math.floor(50 + Math.random() * 100), type: 'error' },
      { msg: '🤝 Trade Deal! Commerce booms.', gold: Math.max(80, Math.floor(Object.values(state.grid).filter(c=>c.type==='shop').length * 30)), type: 'ok' },
      { msg: '🔥 Factory Fire! Insurers pay out.', gold: -150, type: 'error', condition: () => Object.values(state.grid).some(c=>c.type==='factory') },
      { msg: '🎓 Tech Grant! City gets smarter.', gold: 300, type: 'ok', condition: () => state.day > 15 },
    ];
    const valid = events.filter(e => !e.condition || e.condition());
    const ev = valid[Math.floor(Math.random() * valid.length)];
    if (ev) {
      state.gold += ev.gold;
      if (ev.gold !== 0) hudUpdate(true);
      toastEvent(ev.msg, ev.gold, ev.type);
    }
  }
}

function recalc() {
  let pop=0,energy=0;
  const hb = getUpgradeLevel('housing_boom');
  const sg = getUpgradeLevel('smart_grid');
  Object.values(state.grid).forEach(c=>{
    const d=BDATA[c.type]; if(!d) return;
    let p=d.pop, e=d.energy;
    if (c.type==='house') p += hb;
    if (c.type==='apartment') p += hb * 2;
    if (c.type==='windturbine') e += sg * 2;
    if (c.type==='solar')       e += sg * 4;
    if (c.type==='nuclear')     e += sg * 8;
    pop += p; energy += e;
  });
  state.pop=Math.max(0,pop); state.energy=energy;
  let hap = 80;
  Object.values(state.grid).forEach(c => {
    if (c.type === 'park') hap += 15;
  });
  state.happiness = Math.max(0, Math.min(100, hap));
}

function removeMesh(k) {
  const m=state.meshes[k];
  if(m){shrinkOut(m,()=>scene.remove(m));}
  delete state.meshes[k];
}

function placeBuilding(gx, gz) {
  const type=state.selected, k=key(gx,gz);

  if (type==='demolish') {
    const cell=state.grid[k];
    if (!cell){toast('Nothing here to demolish','warn');return;}
    const baseCost = cell.type === 'road' ? getRoadCost() : (BDATA[cell.type]?.cost||0);
    const refund = cell.type === 'road' ? baseCost : Math.floor(baseCost * 0.3);
    removeMesh(k); delete state.grid[k];
    playSound('demolish');
    if(refund>0){state.gold+=refund;toast(`Refunded ${fmtEuro(refund)}`,'ok');}
    else toast('Demolished');
    neighbours(gx,gz).forEach(([x,z])=>rebuildRoad(x,z));
    recalc();hudUpdate();updateIncomePreview();refreshUpgradeCards();return;
  }

  const cfg=BDATA[type];

  if (type==='road') {
    const rc = getRoadCost();
    if(state.gold<rc){toast('Not enough budget','error');return;}
    if(state.grid[k]){toast('Tile occupied','warn');return;}
    state.gold-=rc; state.grid[k]={type};
    const g=makeRoad(gx,gz);
    g.position.copy(worldPos(gx,gz));
    g.userData={type,gx,gz};
    playSound('place');
    scene.add(g); state.meshes[k]=g; popIn(g);
    neighbours(gx,gz).forEach(([x,z])=>rebuildRoad(x,z));
    recalc();hudUpdate();updateIncomePreview();refreshUpgradeCards();return;
  }

  if(NEEDS_ROAD.has(type)&&!hasRoadNeighbour(gx,gz)){toast('Needs a road neighbor','warn');return;}
  if(state.gold<cfg.cost){toast('Not enough budget','error');return;}
  if(state.grid[k]){toast('Tile occupied','warn');return;}

  state.gold-=cfg.cost; state.grid[k]={type};
  const fn=FACTORIES[type]; if(!fn)return;
  const g=fn(gx, gz);
  g.position.copy(worldPos(gx,gz));
  g.rotation.y = getRoadFacingAngle(gx, gz);
  g.userData={type,gx,gz};
  playSound('place');
  scene.add(g); state.meshes[k]=g; popIn(g);
  recalc();hudUpdate();updateIncomePreview();refreshUpgradeCards();
}

function clearCarsAndMeshes() {
  while (cars.length) {
    const c = cars.pop();
    if (c.mesh) scene.remove(c.mesh);
  }
  carSpawnTimer = 0;
  Object.keys(state.meshes).forEach(k => {
    const m = state.meshes[k];
    if (m) scene.remove(m);
    delete state.meshes[k];
  });
}

function spawnMeshOnly(gx, gz, type) {
  const k = key(gx, gz);
  if (type === 'road') {
    const g = makeRoad(gx, gz);
    g.position.copy(worldPos(gx, gz));
    g.userData = { type, gx, gz };
    scene.add(g);
    state.meshes[k] = g;
  } else {
    const fn = FACTORIES[type];
    if (!fn) return;
    const g = fn(gx, gz);
    g.position.copy(worldPos(gx, gz));
    g.rotation.y = getRoadFacingAngle(gx, gz);
    g.userData = { type, gx, gz };
    scene.add(g);
    state.meshes[k] = g;
  }
}

function seedStartingCity() {
  // Hard reset global state to defaults
  state.gold = 2000;
  state.pop = 0;
  state.energy = 0;
  state.happiness = 75;
  state.day = 1;
  state.dayTimer = 0;
  state.selected = 'road';
  state.grid = {};
  state.upgradeLevels = {};
  UPGRADE_DEFS.forEach(u => { state.upgradeLevels[u.id] = 0; });
  
  // Reset camera
  if (window.camTarget) camTarget.set(0, 0, 0);
  if (typeof applyZoom === 'function') {
    zoomLevel = 1;
    applyZoom();
  }
  
  // Clear scene
  clearCarsAndMeshes();

  // Create initial road
  const center = Math.floor(GRID / 2), roadStart = GRID - 1;
  for (let z = roadStart; z >= center; z--) state.grid[key(center, z)] = { type: 'road' };
  for (let z = roadStart; z >= center; z--) {
    const g = makeRoad(center, z);
    g.position.copy(worldPos(center, z));
    g.userData = { type: 'road', gx: center, gz: z };
    scene.add(g);
    state.meshes[key(center, z)] = g;
  }
  for (let z = roadStart; z >= center; z--) rebuildRoad(center, z);
}

function seedBackgroundCity() {
  clearCarsAndMeshes();
  state.grid = {};
  state.gold = 100000;
  
  for(let i=10; i<31; i++) placeBuilding(i, 25, 'road', false);
  for(let i=10; i<25; i++) placeBuilding(18, i, 'road', false);
  for(let i=8; i<18; i++) placeBuilding(i, 12, 'road', false);
  for(let i=12; i<20; i++) placeBuilding(8, i, 'road', false);
  for(let i=8; i<14; i++) placeBuilding(i, 20, 'road', false);

  for(let i=18; i<26; i++) placeBuilding(i, 18, 'road', false);
  for(let i=22; i<28; i++) placeBuilding(i, 14, 'road', false);
  for(let i=14; i<20; i++) placeBuilding(24, i, 'road', false);

  const apts = [[7,11],[9,11],[11,11],[8,13],[8,15],[7,19],[9,19],[11,19],[13,21],[15,21]];
  apts.forEach(([x,z]) => placeBuilding(x,z,'apartment', false));

  const houses = [[14,13],[16,13],[18,11],[20,13],[22,13],[17,24],[19,24],[21,24],[23,24],[25,24],[27,25],[29,25]];
  houses.forEach(([x,z]) => placeBuilding(x,z,'house', false));

  placeBuilding(12,15,'shop', false);
  placeBuilding(20,17,'shop', false);
  placeBuilding(10,5,'park', false);
  placeBuilding(25,8,'park', false);

  placeBuilding(28,27,'nuclear', false);
  placeBuilding(30,27,'nuclear', false);
  placeBuilding(29,29,'solar', false);
  placeBuilding(27,29,'windturbine', false);
  placeBuilding(30,15,'factory', false);
  placeBuilding(31,17,'factory', false);

  recalc();
}

async function loadMenuBackgroundCity() {
  const slotId = parseInt(localStorage.getItem('aurora-menu-bg-slot') || '1', 10);
  
  let data = null;
  if (window.db && window.db.session) {
    try {
      data = await window.db.loadCloudSave(slotId);
    } catch(e) {}
  }
  
  if (!data) {
    const raw = localStorage.getItem('aurora-save-slot-' + slotId) || localStorage.getItem(SAVE_KEY);
    if (raw) {
      try { data = JSON.parse(raw); } catch(e) {}
    }
  }

  if (data && data.grid) {
    state.grid = data.grid;
    state.gold = data.gold ?? 2000;
    state.day = data.day ?? 1;
    state.dayTimer = data.dayTimer ?? 0;
    UPGRADE_DEFS.forEach(u => {
      state.upgradeLevels[u.id] = data.upgradeLevels?.[u.id] ?? 0;
    });
    rebuildAllMeshes();
    recalc();
  } else {
    seedBackgroundCity();
    rebuildAllMeshes();
  }
}

async function updateMenuBg(slotVal) {
  const slotId = parseInt(slotVal.replace('aurora-save-slot-', ''), 10) || 1;
  localStorage.setItem('aurora-menu-bg-slot', slotId);
  await loadMenuBackgroundCity();
}

function loadGameFromStorage() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    if (!data || !data.grid) return false;
    
    state.grid = data.grid;
    state.gold = data.gold ?? 2000;
    state.day = data.day ?? 1;
    state.dayTimer = data.dayTimer ?? 0;
    state.selected = data.selected || 'road';
    
    UPGRADE_DEFS.forEach(u => {
      state.upgradeLevels[u.id] = data.upgradeLevels?.[u.id] ?? 0;
    });
    
    if (data.camTarget) {
      camTarget.set(data.camTarget.x, 0, data.camTarget.z);
    }
    if (data.zoomLevel) zoomLevel = data.zoomLevel;
    
    rebuildAllMeshes();
    recalc();
    applyZoom();
    return true;
  } catch (e) {
    console.error('Load fail', e);
    return false;
  }
}

function rebuildAllMeshes() {
  clearCarsAndMeshes();
  Object.entries(state.grid).forEach(([k, cell]) => {
    const [gx, gz] = k.split(',').map(Number);
    const type = cell.type;
    const cfg = BDATA[type];
    if (type === 'road') {
      const g = makeRoad(gx, gz);
      g.position.copy(worldPos(gx, gz));
      g.userData = { type, gx, gz };
      scene.add(g);
      state.meshes[k] = g;
    } else {
      const fn = FACTORIES[type];
      if (fn) {
        const g = fn(gx, gz);
        g.position.copy(worldPos(gx, gz));
        g.rotation.y = getRoadFacingAngle(gx, gz);
        g.userData = { type, gx, gz };
        scene.add(g);
        state.meshes[k] = g;
      }
    }
  });
  Object.keys(state.grid).forEach(k => {
    const [x, z] = k.split(',').map(Number);
    if (state.grid[k].type === 'road') rebuildRoad(x, z);
  });
}

function dismissLoadingScreen() {
  const l = document.getElementById('loading');
  if (!l) return;
  l.classList.add('out');
  setTimeout(() => { try { l.remove(); } catch (e) { l.style.display = 'none'; } }, 650);
}

function init(loadSave, bgMode = false){
  // If we are already in the requested mode, skip
  if (window.__auroraBootMode === (bgMode ? 'bg' : 'game')) {
    return;
  }
  
  const wasInBgMode = (window.__auroraBootMode === 'bg');
  window.__auroraBootMode = bgMode ? 'bg' : 'game';
  isBackgroundMode = bgMode;

  // If we were in background mode and are now starting for real
  if (wasInBgMode && !bgMode) {
    document.body.classList.remove('is-background-mode');
    gamePaused = false;
    closePauseMenu();
    
    // CRITICAL: If starting fresh (no loadSave), we MUST reset the city state
    if (!loadSave) {
      seedStartingCity();
    } else {
      loadGameFromStorage();
    }
    
    recalc();
    hudUpdate();
    return;
  }

  gamePaused = false;
  closePauseMenu();

  const fail = (err) => {
    console.error(err);
    window.__auroraBoot = false;
    dismissLoadingScreen();
    const msg = err && err.message ? err.message : String(err);
    alert('The game could not start. Try updating the browser, allow WebGL, or use a local server.\n\n' + msg);
  };

  try {
    if (!window.THREE) {
      throw new Error('Three.js did not load (check internet / CDN block).');
    }

    buildGround();
    buildStars();
    initUpgradeShop();

    let loaded = false;
    if (loadSave) loaded = loadGameFromStorage();
    if (!loaded) seedStartingCity();

    document.querySelectorAll('.build-btn').forEach(b=>b.classList.remove('active'));
    const sel = String(state.selected || 'road').replace(/[^a-z_]/gi, '');
    const pick = document.querySelector(`[data-type="${sel}"]`) || document.querySelector('[data-type="road"]');
    if (pick) pick.classList.add('active');
    state.selected = pick?.dataset?.type || 'road';

    recalc();
    hudUpdate();
    updateBuildBarCosts();
    updateIncomePreview();
    updateDayBar();
    applySkyPhase(0.65);
    refreshUpgradeCards();
  } catch (e) {
    fail(e);
    return;
  }

  if (isBackgroundMode) {
    document.body.classList.add('is-background-mode');
    loadMenuBackgroundCity();
    const selector = document.getElementById('menu-bg-selector');
    if (selector) {
      selector.value = localStorage.getItem('aurora-menu-bg-slot') || SAVE_SLOTS[0];
      selector.onchange = () => updateMenuBg(selector.value);
    }
  }


  initBuildMenuTooltips();
  dismissLoadingScreen();
  try {
    animate(0);
  } catch (e) {
    fail(e);
  }
}

function animate(now){
  requestAnimationFrame(animate);
  try {
    const t = (typeof now === 'number' && !isNaN(now)) ? now : performance.now();
    if (gamePaused) {
      renderer.render(scene, camera);
      return;
    }
    const dt=Math.min((t-lastT)/1000,.1); lastT=t;

    const pan = 14 * dt;
    if (keys.w || keys.arrowup) camTarget.z -= pan;
    if (keys.s || keys.arrowdown) camTarget.z += pan;
    if (keys.a || keys.arrowleft) camTarget.x -= pan;
    if (keys.d || keys.arrowright) camTarget.x += pan;
    if (keys.w || keys.s || keys.a || keys.d || keys.arrowup || keys.arrowdown || keys.arrowleft || keys.arrowright) clampCam();

    if (!isBackgroundMode) tickDay(dt);
    const tgt=new THREE.Vector3(camTarget.x,0,camTarget.z);
    camera.position.lerp(tgt.clone().add(CAM_OFF),.085);
    camera.lookAt(tgt);

    const sunAngle = performance.now()*0.00006;
    sun.position.set(Math.cos(sunAngle)*40,40+Math.sin(sunAngle*0.6)*10,Math.sin(sunAngle)*38);

    animPart(dt);
    updateCars(dt);

    Object.values(state.meshes).forEach(mesh => {
      if (mesh.userData.rotor) {
        mesh.userData.rotor.rotation.z += dt * 1.4;
      }
    });

    carSpawnTimer += dt;
    const transit = getUpgradeLevel('transit_ai');
    const spawnEvery = Math.max(1.1, 3.6 - transit * 0.55);
    if (carSpawnTimer >= spawnEvery) {
      carSpawnTimer = 0;
      trySpawnCar();
    }

    if (isBackgroundMode) {
      const angle = Math.sin(Date.now() * 0.0003) * 0.6;
      camera.position.x = Math.sin(angle) * 75;
      camera.position.y = 45;
      camera.position.z = Math.cos(angle) * 75;
      camera.lookAt(0, 0, 0);
    }

    renderer.render(scene,camera);
  } catch (err) {
    console.error('Render loop', err);
  }
}

// Auto-save loop every 60 seconds
setInterval(() => {
  if (!isBackgroundMode && window.db && window.db.session && !gamePaused) {
    saveToCloud();
  }
}, 60000);
