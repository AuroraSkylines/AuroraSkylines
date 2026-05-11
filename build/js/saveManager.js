// =====================================================
//  Aurora Skylines — Save Manager (Cloud Edition)
// =====================================================
'use strict';

let isQuitMode = false;

async function renderSaveManager() {
  const container = document.getElementById('sm-slots');
  if (!container) return;
  
  container.innerHTML = '<div class="sm-loading" style="color:#fff;font-family:var(--fu);font-size:14px;padding:20px;text-align:center;">Loading cloud saves...</div>';

  let allSlots = {};
  try {
    const cloudData = await window.db.loadCloudSave();
    if (cloudData && typeof cloudData === 'object') {
       allSlots = cloudData;
    }
  } catch (e) {
    console.error("Cloud load fail:", e);
  }

  container.innerHTML = '';
  SAVE_SLOTS.forEach((id, index) => {
    const slot = allSlots[id];
    const card = document.createElement('div');
    card.className = 'sm-slot' + (slot ? ' has-save' : ' empty');
    
    if (slot) {
      const date = new Date(slot.savedAt).toLocaleString();
      card.innerHTML = `
        <div class="sm-slot-num">${index + 1}</div>
        <div class="sm-slot-info">
          <div class="sm-slot-name">Slot ${index + 1} ${sessionStorage.getItem('aurora-active-slot') === id ? '<span class="sm-tag">ACTIVE</span>' : ''}</div>
          <div class="sm-slot-ts">${date}</div>
          <div class="sm-stats">
            <div class="sm-stat">Day <span>${slot.day || 1}</span></div>
            <div class="sm-stat">Budget <span>${slot.gold ? fmtEuro(slot.gold) : '0 €'}</span></div>
          </div>
        </div>
        <div class="sm-slot-actions">
          <button class="sm-btn sm-btn--load" onclick="window.loadFromSlot('${id}')">Load</button>
          <button class="sm-btn sm-btn--del" onclick="window.deleteSlot('${id}')">✕</button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="sm-slot-num">${index + 1}</div>
        <div class="sm-slot-info">
          <div class="sm-slot-name">Slot ${index + 1}</div>
          <div class="sm-slot-empty">Empty Slot</div>
        </div>
        <div class="sm-slot-actions">
          <button class="sm-btn sm-btn--save" onclick="window.saveToSlot('${id}')">Save Here</button>
        </div>
      `;
    }
    container.appendChild(card);
  });
}

function buildSavePayload() {
  const counts = {};
  Object.values(state.grid).forEach(c => { counts[c.type] = (counts[c.type] || 0) + 1; });
  return {
    v: 2,
    savedAt: Date.now(),
    gold: state.gold,
    grid: state.grid,
    day: state.day,
    dayTimer: state.dayTimer,
    upgradeLevels: { ...state.upgradeLevels },
    camTarget: { x: camTarget.x, z: camTarget.z },
    zoomLevel,
    selected: state.selected,
    snapshot: {
      pop: state.pop,
      energy: state.energy,
      happiness: state.happiness,
      gold: state.gold,
      day: state.day,
      counts,
    },
  };
}

async function saveToSlot(id) {
  const payload = buildSavePayload();
  let allSlots = {};
  try {
    const cloudData = await window.db.loadCloudSave();
    if (cloudData && typeof cloudData === 'object') allSlots = cloudData;
  } catch(e) {}
  
  allSlots[id] = payload;
  await window.db.syncCloudSave(allSlots);
  
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  sessionStorage.setItem('aurora-active-slot', id);
  
  if (typeof toast === 'function') toast(`Saved to Slot ${id.split('-').pop()}`, 'ok');
  
  if (isQuitMode) {
     location.reload();
  } else {
     closeSaveManager();
     renderSaveManager();
  }
}

async function loadFromSlot(id) {
  let allSlots = {};
  try {
    const cloudData = await window.db.loadCloudSave();
    if (cloudData && typeof cloudData === 'object') allSlots = cloudData;
  } catch(e) {}

  if (!allSlots[id]) return;
  
  const payload = allSlots[id];
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  sessionStorage.setItem('aurora-active-slot', id);
  
  closeSaveManager();
  if (typeof startGame === 'function') {
    startGame(true);
  } else {
    location.reload();
  }
}

async function deleteSlot(id) {
  if (!confirm("Delete this save slot?")) return;
  
  let allSlots = {};
  try {
    const cloudData = await window.db.loadCloudSave();
    if (cloudData && typeof cloudData === 'object') allSlots = cloudData;
  } catch(e) {}

  delete allSlots[id];
  await window.db.syncCloudSave(allSlots);
  
  renderSaveManager();
}

// Auto-save every 60s
setInterval(() => {
  const activeSlot = sessionStorage.getItem('aurora-active-slot');
  if (!isBackgroundMode && window.db && window.db.session && activeSlot && !gamePaused) {
    saveToSlot(activeSlot);
  }
}, 60000);

// Export to window
window.renderSaveManager = renderSaveManager;
window.saveToSlot = saveToSlot;
window.loadFromSlot = loadFromSlot;
window.deleteSlot = deleteSlot;
window.buildSavePayload = buildSavePayload;
window.saveToCloud = () => {
    const activeSlot = sessionStorage.getItem('aurora-active-slot');
    if (activeSlot) saveToSlot(activeSlot);
    else openSaveManager();
};
