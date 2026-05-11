// =====================================================
//  Aurora Skylines — Input & Camera Control
// =====================================================
'use strict';

const keys = {};

window.addEventListener('keydown', e => {
  const t = e.target;
  const inField = t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  const k = e.key.toLowerCase();

  if (k === 'escape' || k === 'p') {
    if (isMainMenuVisible()) return;
    if (e.repeat) return;
    if (k === 'p' && (e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    togglePauseMenu();
    return;
  }

  if (inField) return;

  keys[k] = true;
  if (k === 'arrowup' || k === 'arrowdown' || k === 'arrowleft' || k === 'arrowright') {
    e.preventDefault();
  }
});

window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

const camTarget = new THREE.Vector3(0, 0, 0);
const CAM_OFF = new THREE.Vector3(28, 28, 28);
let zoomLevel = 1.0;

function applyZoom(){
  const z=Math.max(.42,Math.min(2.5,zoomLevel)), s=CAM_SIZE*z, a=window.innerWidth/window.innerHeight;
  camera.left=-s*a;camera.right=s*a;camera.top=s;camera.bottom=-s;camera.updateProjectionMatrix();
}

function screenToWorld(sx,sy){
  const scale=(CAM_SIZE*zoomLevel)/(window.innerHeight/2);
  return{wx:(sx+sy)*scale*.707,wz:(sy-sx)*scale*.707};
}

function clampCam(){
  const lim=HALF-4;
  camTarget.x=Math.max(-lim,Math.min(lim,camTarget.x));
  camTarget.z=Math.max(-lim,Math.min(lim,camTarget.z));
}

const raycaster = new THREE.Raycaster();
const ndcPt = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0,1,0),0);

function handleGridClick(cx,cy){
  ndcPt.x=(cx/window.innerWidth)*2-1; ndcPt.y=-(cy/window.innerHeight)*2+1;
  raycaster.setFromCamera(ndcPt,camera);
  const hit=new THREE.Vector3();
  if(!raycaster.ray.intersectPlane(groundPlane,hit))return;
  const gx=Math.floor((hit.x+HALF)/CELL), gz=Math.floor((hit.z+HALF)/CELL);
  if(gx>=0&&gx<GRID&&gz>=0&&gz<GRID)placeBuilding(gx,gz);
}

let mDown = false, mBase = null, mPanButton = 0;

function endCanvasPointerSession(e) {
  if (!mDown) return;
  const placeOnRelease = mPanButton === 0;
  if (placeOnRelease && mBase && Math.hypot(e.clientX - mBase.tx, e.clientY - mBase.ty) < 8) {
    handleGridClick(e.clientX, e.clientY);
  }
  mDown = false;
  mBase = null;
  mPanButton = 0;
  canvas.style.cursor = 'grab';
  window.removeEventListener('mousemove', onWindowCanvasMouseMove);
  window.removeEventListener('mouseup', onWindowCanvasMouseUp);
}

function onWindowCanvasMouseMove(e) {
  if (!mDown || !mBase) return;
  const dx = e.clientX - mBase.tx, dy = e.clientY - mBase.ty, d = screenToWorld(dx, dy);
  camTarget.x = mBase.camX - d.wx;
  camTarget.z = mBase.camZ - d.wz;
  clampCam();
}

function onWindowCanvasMouseUp(e) {
  endCanvasPointerSession(e);
}

canvas.addEventListener('mousedown', e => {
  if (e.button !== 0 && e.button !== 1 && e.button !== 2) return;
  if (e.button === 1 || e.button === 2) e.preventDefault();
  mDown = true;
  mPanButton = e.button;
  mBase = { camX: camTarget.x, camZ: camTarget.z, tx: e.clientX, ty: e.clientY };
  canvas.style.cursor = 'grabbing';
  window.addEventListener('mousemove', onWindowCanvasMouseMove);
  window.addEventListener('mouseup', onWindowCanvasMouseUp);
});

canvas.addEventListener('contextmenu', e => { e.preventDefault(); });

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  zoomLevel *= 1 + e.deltaY * 0.001;
  applyZoom();
}, { passive: false });

window.addEventListener('blur', () => {
  for (const x of Object.keys(keys)) keys[x] = false;
  if (mDown) {
    mDown = false;
    mBase = null;
    mPanButton = 0;
    canvas.style.cursor = 'grab';
    window.removeEventListener('mousemove', onWindowCanvasMouseMove);
    window.removeEventListener('mouseup', onWindowCanvasMouseUp);
  }
});
