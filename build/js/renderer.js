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
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 150;
sun.shadow.camera.left = sun.shadow.camera.bottom = -72;
sun.shadow.camera.right = sun.shadow.camera.top = 72;
sun.shadow.bias = -0.0004;
sun.shadow.radius = 3.5;
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

// ── Window / Lamp glow update (throttled) ─────────
let _lastWindowPhase = -1;
function updateWindowGlow(phase) {
  if (Math.abs(phase - _lastWindowPhase) < 0.008) return;
  _lastWindowPhase = phase;
  const winIntensity   = Math.max(0, 0.9 - phase * 1.8);
  const lampIntensity  = Math.max(0, 1.0 - phase * 2.0);
  scene.traverse(obj => {
    if (!obj.isMesh) return;
    if (obj.userData.isWindow) {
      obj.material.emissiveIntensity = winIntensity * (obj.userData.winRnd || 1.0);
    }
    if (obj.userData.isLamp) {
      obj.material.emissiveIntensity = lampIntensity;
    }
  });
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
  sun.intensity     = Math.max(0, (p - 0.08) / 0.35) * 1.6;
  moonLight.intensity = Math.max(0, 0.40 - p * 0.8) * (p < 0.2 ? 1.0 : 0.0) + Math.max(0, 0.40 - (1-p) * 0.8) * (p > 0.8 ? 1.0 : 0.0);
  moonLight.intensity = Math.max(0, 0.42 * (1 - Math.min(1, p * 2.5)));
  rim.intensity     = 0.04 + (1 - p) * 0.20;
  fill.intensity    = 0.10 + p * 0.14;

  // Sun color arc: orange sunrise → white day → orange sunset
  if (p < 0.30) {
    sun.color.setHex(0xff7035);
  } else if (p < 0.55) {
    sun.color.setHex(0xfff6e8);
  } else if (p < 0.72) {
    sun.color.setHex(0xfff0d0);
  } else {
    sun.color.setHex(0xff6020);
  }

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
