// =====================================================
//  Aurora Skylines — Utility Functions
// =====================================================
'use strict';

// ── Number / currency formatting ──────────────────
function fmtEuro(n) {
  try {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  } catch (e) {
    return `${n} €`;
  }
}
function fmtEuroSigned(n) {
  if (n === 0) return fmtEuro(0);
  const sign = n < 0 ? '−' : '+';
  return sign + fmtEuro(Math.abs(n));
}
function fmtNumDE(n) {
  try { return new Intl.NumberFormat('de-DE').format(n); } catch (e) { return String(n); }
}

// ── Grid helpers ──────────────────────────────────
function key(gx, gz) { return `${gx},${gz}`; }

function worldPos(gx, gz) {
  return new THREE.Vector3(gx * CELL - HALF + CELL / 2, 0, gz * CELL - HALF + CELL / 2);
}

function neighbours(gx, gz) {
  return [[gx-1,gz],[gx+1,gz],[gx,gz-1],[gx,gz+1]]
    .filter(([x,z]) => x >= 0 && x < GRID && z >= 0 && z < GRID);
}

function hasRoadNeighbour(gx, gz) {
  return neighbours(gx, gz).some(([x,z]) => state.grid[key(x,z)]?.type === 'road');
}

// ── Upgrade helpers ───────────────────────────────
function getUpgradeLevel(id) { return state.upgradeLevels[id] || 0; }

function getRoadCost() {
  const lv = getUpgradeLevel('efficient_paving');
  return Math.max(4, Math.floor(10 * Math.pow(0.82, lv)));
}

// ── Seeded deterministic random ───────────────────
function seededRandom(gx, gz, salt = 0) {
  let val = Math.sin((gx || 0) * 12.9898 + (gz || 0) * 78.233 + salt) * 43758.5453;
  return val - Math.floor(val);
}

// ── Date formatting ───────────────────────────────
function fmtSaveDate(ts) {
  if (!ts) return 'Unknown date';
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch (e) { return 'Unknown date'; }
}

// ── UI helpers ────────────────────────────────────
function isMainMenuVisible() {
  const splash = document.getElementById('main-menu');
  return !!(splash && splash.style.display !== 'none');
}

function customConfirm(message, okLabel='Confirm') {
  return new Promise(resolve => {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return resolve(confirm(message));
    
    document.getElementById('confirm-body').textContent = message;
    const btnOk = document.getElementById('confirm-ok');
    const btnCancel = document.getElementById('confirm-cancel');
    
    btnOk.textContent = okLabel;
    modal.classList.remove('hidden');
    
    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };
    
    const cleanup = () => {
      modal.classList.add('hidden');
      btnOk.removeEventListener('click', onOk);
      btnCancel.removeEventListener('click', onCancel);
    };
    
    btnOk.addEventListener('click', onOk);
    btnCancel.addEventListener('click', onCancel);
  });
}

function incomeForCell(c) {
  const d = BDATA[c.type];
  if (!d) return 0;
  let inc = d.income;
  const ch = getUpgradeLevel('commerce_hub');
  const gc = getUpgradeLevel('green_city');
  if (c.type === 'shop') inc += ch * 6;
  if (c.type === 'park') inc += gc * 2;
  return inc;
}

function happinessMultiplier() {
  const h = state.happiness;
  if (h >= 80) return 1.25;
  if (h >= 60) return 1.0;
  if (h >= 40) return 0.80;
  return 0.55;
}

function happinessLabel() {
  const h = state.happiness;
  if (h >= 80) return '😄 Happy';
  if (h >= 60) return '🙂 Content';
  if (h >= 40) return '😐 Uneasy';
  return '😡 Angry';
}

function projectedDailyIncome() {
  let income = 0;
  Object.values(state.grid).forEach(c => { income += incomeForCell(c); });
  if (state.energy < 0) income = Math.floor(income * 0.6);
  return Math.floor(income * happinessMultiplier());
}

// ── Animations ────────────────────────────────────
function easeOutBack(t){const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);}
function popIn(obj){
  obj.scale.set(.01,.01,.01);
  const s=performance.now(),dur=400;
  (function tick(now){const t=Math.min((now-s)/dur,1);obj.scale.setScalar(easeOutBack(t));if(t<1)requestAnimationFrame(tick);})(s);
}
function shrinkOut(obj,cb){
  const s=performance.now(),dur=240;
  (function tick(now){const t=Math.min((now-s)/dur,1);obj.scale.setScalar(1-t);obj.position.y+=.04;if(t<1)requestAnimationFrame(tick);else cb&&cb();})(s);
}

function spawnCoin(wx,wz){
  const mesh=new THREE.Mesh(
    new THREE.TorusGeometry(.1,.035,6,10),
    new THREE.MeshPhongMaterial({color:0xfbbf24,emissive:0xd97706,emissiveIntensity:.6,shininess:90,transparent:true})
  );
  mesh.rotation.x = Math.PI/2;
  mesh.position.set(wx,1.55,wz); scene.add(mesh);
  const s=performance.now(),dur=820;
  (function tick(now){const t=Math.min((now-s)/dur,1);mesh.position.y=1.55+t*2.4;mesh.rotation.z=t*4;mesh.material.opacity=1-t;if(t<1)requestAnimationFrame(tick);else scene.remove(mesh);})(s);
}
