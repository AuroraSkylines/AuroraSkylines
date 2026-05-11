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
renderer.toneMappingExposure = 1.05;
if ('outputEncoding' in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
if ('physicallyCorrectLights' in renderer) renderer.physicallyCorrectLights = true;

// ── Scene & Sky ───────────────────────────────────
const scene = new THREE.Scene();
const SKY_DAY   = new THREE.Color(0x7a9fc7);
const SKY_NIGHT = new THREE.Color(0x080c14);
scene.background = SKY_NIGHT.clone();
scene.fog = new THREE.Fog(SKY_NIGHT.clone(), 52, 148);

// ── Camera ────────────────────────────────────────
const CAM_SIZE = 16;
let camAspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  -CAM_SIZE * camAspect, CAM_SIZE * camAspect, CAM_SIZE, -CAM_SIZE, 0.1, 220
);
camera.position.set(28, 28, 28);
camera.lookAt(0, 0, 0);

// ── Lighting ──────────────────────────────────────
const hemi = new THREE.HemisphereLight(0xb8d4f0, 0x1a3020, 0.42);
scene.add(hemi);

const ambient = new THREE.AmbientLight(0xc4d4ee, 0.38);
scene.add(ambient);

// Sun — primary directional light with shadows
// NOTE: shadow.bias = -0.0004 is tuned to prevent shadow acne on flat grid. Do not change casually.
const sun = new THREE.DirectionalLight(0xfff6e8, 1.25);
sun.position.set(32, 48, 28);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 140;
sun.shadow.camera.left = sun.shadow.camera.bottom = -62;
sun.shadow.camera.right = sun.shadow.camera.top = 62;
sun.shadow.bias = -0.0004;
sun.shadow.radius = 3;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x8899ff, 0.22);
fill.position.set(-22, 14, -18);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xc084fc, 0.12);
rim.position.set(0, 12, -40);
scene.add(rim);

// ── Sky phase (day/night lerp) ────────────────────
function applySkyPhase(phase) {
  const p = Math.max(0, Math.min(1, phase));
  scene.background.copy(SKY_NIGHT).lerp(SKY_DAY, p);
  if (scene.fog && scene.fog.color) scene.fog.color.copy(scene.background);
  hemi.intensity    = 0.28 + p * 0.28;
  ambient.intensity = 0.22 + p * 0.32;
  sun.intensity     = 0.35 + p * 1.15;
  rim.intensity     = 0.06 + (1 - p) * 0.14;
}

// ── Resize handler ────────────────────────────────
window.addEventListener('resize', () => {
  camAspect = window.innerWidth / window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
  applyZoom();
});
