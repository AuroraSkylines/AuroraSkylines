// =====================================================
//  Aurora Skylines — Save Manager (Cloud Edition)
// =====================================================
'use strict';

// let isQuitMode = false; (Already declared in state.js)

async function renderSaveManager() {
  const container = document.getElementById('sm-slots');
  if (!container) {
    console.error("Save Manager: Container #sm-slots not found!");
    return;
  }
  
  container.innerHTML = '<div class="sm-loading" style="color:#fff;font-family:var(--fu);font-size:14px;padding:20px;text-align:center;">Loading cloud city...</div>';

  let cloudData = null;
  try {
    if (window.db && typeof window.db.loadCloudSave === 'function') {
      cloudData = await window.db.loadCloudSave();
    } else {
      console.warn("Database not ready for cloud load.");
    }
  } catch (e) {
    console.error("Cloud load error:", e);
  }

  container.innerHTML = '';
  
  try {
    // Single Slot Mode for Private Alpha
    const id = (typeof SAVE_SLOTS !== 'undefined' && SAVE_SLOTS[0]) ? SAVE_SLOTS[0] : 'aurora-save-slot-1';
    const slot = cloudData; 
    
    const card = document.createElement('div');
    card.className = 'sm-slot' + (slot ? ' has-save sm-slot--active' : ' empty');
    
    if (slot && typeof slot === 'object') {
      const date = slot.savedAt ? new Date(slot.savedAt).toLocaleString() : 'Recent Save';
      const day = slot.day || 1;
      const gold = slot.gold || 0;
      
      card.innerHTML = `
        <div class="sm-slot-num">1</div>
        <div class="sm-slot-info">
          <div class="sm-slot-name">Cloud Save <span class="sm-tag">READY</span></div>
          <div class="sm-slot-ts">Last sync: ${date}</div>
          <div class="sm-stats">
            <div class="sm-stat">Day <span>${day}</span></div>
            <div class="sm-stat">Budget <span>${typeof fmtEuro === 'function' ? fmtEuro(gold) : gold + ' €'}</span></div>
          </div>
        </div>
        <div class="sm-slot-actions">
          <button class="sm-btn sm-btn--load" onclick="window.loadFromSlot('${id}')">Load City</button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="sm-slot-num">1</div>
        <div class="sm-slot-info">
          <div class="sm-slot-name">New Cloud Slot</div>
          <div class="sm-slot-empty">No city found in the cloud yet.</div>
        </div>
        <div class="sm-slot-actions">
          <button class="sm-btn sm-btn--save" onclick="window.saveToSlot('${id}')">Start Here</button>
        </div>
      `;
    }
    container.appendChild(card);
  } catch (err) {
    console.error("Render loop error:", err);
    container.innerHTML = '<div style="color:#f87171;padding:20px;text-align:center;">Error displaying saves. Check console (F12).</div>';
  }
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
  await window.db.syncCloudSave(payload);
  
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  sessionStorage.setItem('aurora-active-slot', id);
  
  if (typeof toast === 'function') toast(`Saved to Cloud`, 'ok');
  
  if (isQuitMode) {
     location.reload();
  } else {
     closeSaveManager();
     renderSaveManager();
  }
}

async function loadFromSlot(id) {
  const payload = await window.db.loadCloudSave();
  if (!payload) return;
  
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
