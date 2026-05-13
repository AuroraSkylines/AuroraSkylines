// =====================================================
//  Aurora Skylines — Three.js Scene & Renderer Setup
// =====================================================
'use strict';

const THREE = window.THREE;

// ── Renderer ──────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
if ('outputEncoding' in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
if ('physicallyCorrectLights' in renderer) renderer.physicallyCorrectLights = true;

// ── Scene ─────────────────────────────────────────
const scene = new THREE.Scene();

// Sky color palette (night → dawn → day → dusk → night)
const SKY_NIGHT   = new THREE.Color(0x06080f);
const SKY_DAWN    = new THREE.Color(0x1a0e28);
const SKY_SUNRISE = new THREE.Color(0xd4602a);
const SKY_DAY     = new THREE.Color(0x5a9fd4);
const SKY_DUSK    = new THREE.Color(0xc05030);
const SKY_EVENING = new THREE.Color(0x110820);

scene.background = SKY_NIGHT.clone();
scene.fog = new THREE.Fog(0x06080f, 55, 165);

// ── Camera ────────────────────────────────────────
const CAM_SIZE = 16;
let camAspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  -CAM_SIZE * camAspect, CAM_SIZE * camAspect, CAM_SIZE, -CAM_SIZE, 0.1, 220
);
camera.position.set(28, 28, 28);
camera.lookAt(0, 0, 0);

// ── Lighting ──────────────────────────────────────
const hemi = new THREE.HemisphereLight(0xb8d4f0, 0x2a4a30, 0.3);
scene.add(hemi);

const ambient = new THREE.AmbientLight(0xc4d4ee, 0.2);
scene.add(ambient);

// Sun — primary directional light with shadows
const sun = new THREE.DirectionalLight(0xfff6e8, 1.4);
sun.position.set(32, 48, 28);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 10;
sun.shadow.camera.far = 160;
sun.shadow.camera.left = -50;
sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50;
sun.shadow.camera.bottom = -50;
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.04; // Helps with low poly artifacts
sun.shadow.radius = 2;
scene.add(sun);

// Moon — cool blue-silver directional
const moonLight = new THREE.DirectionalLight(0x4466bb, 0.0);
moonLight.position.set(-32, 36, -28);
moonLight.castShadow = false;
scene.add(moonLight);

// Fill light — sky bounce
const fill = new THREE.DirectionalLight(0x88aaff, 0.18);
fill.position.set(-22, 14, -18);
scene.add(fill);

// Rim light — back edge purple highlight
const rim = new THREE.DirectionalLight(0xc084fc, 0.08);
rim.position.set(0, 12, -40);
scene.add(rim);

// ── Window / Lamp glow update (throttled) ─────
// ── Proximity-based lamp culling ───────────────────
// Only enable real PointLights near the camera. This caps GPU cost
// regardless of city size. Shadow-less PointLights still need
// uniforms/math per-light per-fragment, so we cap at MAX_ACTIVE_LAMPS.
const MAX_ACTIVE_LAMPS = 16; // safe ceiling for most GPUs
let _allLampLights = [];     // flat list rebuilt when city changes
let _lampListDirty = true;   // set true after any road build
let _lastProxTime  = 0;      // timestamp for throttling
let _currentLampIntensity = 0;

// Call this whenever roads are added/removed so we rescan next frame
function markLampsDirty() { _lampListDirty = true; }
window.markLampsDirty = markLampsDirty;

function _rebuildLampList() {
  _allLampLights = [];
  scene.traverse(obj => {
    if (obj.isPointLight && obj.userData.isLampLight) {
      _allLampLights.push(obj);
    }
  });
  _lampListDirty = false;
}

function updateLampProximity(now) {
  // Throttle to every 500 ms
  if (now - _lastProxTime < 500) return;
  _lastProxTime = now;

  if (_lampListDirty) _rebuildLampList();
  if (_allLampLights.length === 0) return;

  const targetIntensity = _currentLampIntensity;
  if (targetIntensity <= 0) {
    // Night phase off — disable all (fast path)
    _allLampLights.forEach(l => { l.intensity = 0; l.visible = false; });
    return;
  }

  // World-space camera target (approx: camera mid-point at y=0)
  const cx = camera.position.x;
  const cz = camera.position.z;

  // Compute squared distance for each light (world space)
  _allLampLights.forEach(l => {
    l.userData._distSq = (l.getWorldPosition(_tmpVec3).x - cx) ** 2 +
                         (l.getWorldPosition(_tmpVec3).z - cz) ** 2;
  });

  // Sort ascending by distance
  _allLampLights.sort((a, b) => a.userData._distSq - b.userData._distSq);

  // Enable nearest N, disable the rest
  _allLampLights.forEach((l, i) => {
    if (i < MAX_ACTIVE_LAMPS) {
      l.intensity = targetIntensity;
      l.visible = true;
    } else {
      l.intensity = 0;
      l.visible = false;
    }
  });
}

const _tmpVec3 = new THREE.Vector3();

let _lastWindowPhase = -1;
function updateWindowGlow(phase) {
  if (Math.abs(phase - _lastWindowPhase) < 0.008) return;
  _lastWindowPhase = phase;
  const winIntensity  = Math.max(0, 0.9 - phase * 1.8);
  // Lamp intensity: full at night (phase 0), fade out by phase 0.5
  const lampIntensity = Math.max(0, 1.0 - phase * 2.0) * 2.2;
  _currentLampIntensity = lampIntensity; // shared with proximity culler

  scene.traverse(obj => {
    if (!obj.isMesh) return;
    if (obj.userData.isWindow) {
      obj.material.emissiveIntensity = winIntensity * (obj.userData.winRnd || 1.0);
    }
    if (obj.userData.isLamp) {
      // Emissive on the lens fixture itself (cheap, always on)
      obj.material.emissiveIntensity = lampIntensity * 1.1;
    }
  });
  // Note: actual PointLight intensities are set by updateLampProximity()
}

// ── Sky phase (phase 0=night, 1=full day) ─────────
function applySkyPhase(phase) {
  const p = Math.max(0, Math.min(1, phase));

  // Sky color through the day arc
  let skyCol = new THREE.Color();
  if (p < 0.15) {
    skyCol.copy(SKY_NIGHT).lerp(SKY_DAWN,    p / 0.15);
  } else if (p < 0.30) {
    skyCol.copy(SKY_DAWN).lerp(SKY_SUNRISE,  (p - 0.15) / 0.15);
  } else if (p < 0.48) {
    skyCol.copy(SKY_SUNRISE).lerp(SKY_DAY,   (p - 0.30) / 0.18);
  } else if (p < 0.72) {
    skyCol.copy(SKY_DAY);
  } else if (p < 0.85) {
    skyCol.copy(SKY_DAY).lerp(SKY_DUSK,      (p - 0.72) / 0.13);
  } else {
    skyCol.copy(SKY_DUSK).lerp(SKY_EVENING,  (p - 0.85) / 0.15);
  }
  scene.background.copy(skyCol);
  if (scene.fog) scene.fog.color.copy(skyCol);

  // Light intensities
  hemi.intensity    = 0.12 + p * 0.52;
  ambient.intensity = 0.12 + p * 0.40;
  sun.intensity     = Math.max(0, (p - 0.20) / 0.30) * 1.6;
  
  // Moonlight intensity: high at start (0.0) and end (1.0), zero during day (0.25 - 0.75)
  const moonFade = Math.max(0, Math.min(1, (p - 0.2) * 5)) * Math.max(0, Math.min(1, (0.8 - p) * 5));
  moonLight.intensity = (1.0 - moonFade) * 0.45;
  
  rim.intensity     = 0.04 + (1 - p) * 0.20;
  fill.intensity    = 0.10 + p * 0.14;

  // Sun color arc: orange sunrise → white day → orange sunset
  if (p < 0.28) {
    sun.color.setHex(0xff7035);
  } else if (p < 0.55) {
    sun.color.setHex(0xfff6e8);
  } else if (p < 0.72) {
    sun.color.setHex(0xfff0d0);
  } else {
    sun.color.setHex(0xff6020);
  }

  // Dynamic shadow casting — only cast shadows when sun is sufficiently high
  // phase 0.3 to 0.8 is roughly daytime.
  const shadowEnabled = (window.gfxSettings?.shadowQuality !== 'off');
  sun.castShadow = shadowEnabled && (p > 0.26 && p < 0.84);

  // Fog density — thicker at dawn/dusk
  if (scene.fog) {
    const fogFar = (window.gfxSettings?.renderDistance === 'near') ? 90 :
                   (window.gfxSettings?.renderDistance === 'medium') ? 130 : 165;
    scene.fog.near = 50;
    scene.fog.far  = fogFar;
  }

  updateWindowGlow(p);
}

// ── Resize handler ────────────────────────────────
window.addEventListener('resize', () => {
  camAspect = window.innerWidth / window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
  applyZoom();
});
