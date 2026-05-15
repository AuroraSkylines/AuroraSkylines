// =====================================================
//  Aurora Skylines — Save Manager (Cloud Edition)
// =====================================================
'use strict';

// let isQuitMode = false; (Already declared in state.js)

async function renderSaveManager() {
  const container = document.getElementById('sm-slots');
  if (!container) return;
  
  container.innerHTML = '<div class="sm-loading" style="color:#fff;font-family:var(--fu);font-size:14px;padding:20px;text-align:center;">Fetching cloud cities...</div>';

  const slots = [1, 2, 3, 4, 5, 6];
  const cloudData = {};

  try {
    if (window.db && typeof window.db.loadCloudSave === 'function') {
      const results = await Promise.all(slots.map(id => window.db.loadCloudSave(id)));
      slots.forEach((id, idx) => { cloudData[id] = results[idx]; });
    }
  } catch (e) { console.error("Cloud fetch error:", e); }

  container.innerHTML = '';
  
  slots.forEach(id => {
    const slot = cloudData[id];
    const card = document.createElement('div');
    card.className = 'sm-slot' + (slot ? ' has-save' : ' empty');
    
    if (slot && typeof slot === 'object') {
      const date = slot.savedAt ? new Date(slot.savedAt).toLocaleDateString() : 'Recent';
      const time = slot.savedAt ? new Date(slot.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      const day = slot.day || 1;
      const gold = slot.gold || 0;
      const pop = (slot.snapshot && slot.snapshot.pop) || 0;
      const happiness = (slot.snapshot && slot.snapshot.happiness) || 100;
      const inMenu = (typeof isBackgroundMode === 'undefined') || isBackgroundMode;

      card.innerHTML = `
        <div class="sm-slot-info">
          <div class="sm-slot-name">
            <span>City Slot ${id}</span>
            <span class="sm-tag">READY</span>
          </div>
          <div class="sm-slot-ts">${date} • ${time}</div>
          <div class="sm-stats">
            <div class="sm-stat">Day <span>${day}</span></div>
            <div class="sm-stat">Pop <span>${pop}</span></div>
            <div class="sm-stat">Budget <span>${typeof fmtEuro === 'function' ? fmtEuro(gold) : gold + ' €'}</span></div>
          </div>
        </div>
        <div class="sm-slot-actions">
          ${inMenu ? 
            `<button class="sm-btn sm-btn--load" onclick="window.loadFromSlot(${id})" style="flex:1;">Load City</button>` : 
            `<button class="sm-btn sm-btn--save" onclick="window.saveToSlot(${id})" style="flex:1;">Overwrite</button>`
          }
          <button class="sm-btn sm-btn--danger" onclick="window.deleteSlot(${id})" style="width:40px;padding:8px 0;display:flex;align-items:center;justify-content:center;" title="Delete Slot">🗑️</button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="sm-slot-info">
          <div class="sm-slot-name">Empty Terminal</div>
          <div class="sm-slot-ts">No data detected in cloud slot ${id}</div>
        </div>
        <div class="sm-slot-actions">
          <button class="sm-btn sm-btn--save" onclick="window.saveToSlot(${id})" style="flex:1;">Initialize New City</button>
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

async function _saveToSlot(id, force = false) {
  const payload = buildSavePayload();
  let syncResult = { success: true };

  if (window.db && window.db.syncCloudSave) {
    syncResult = await window.db.syncCloudSave(payload, id, force);
  }
  
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  sessionStorage.setItem('aurora-active-slot', id);
  
  if (syncResult && syncResult.error) {
    if (syncResult.error === 'conflict') {
      toast(`Cloud Conflict: A newer save exists on the server.`, 'warn');
    } else {
      toast(`Local Save OK, but Cloud Sync failed: ${syncResult.error}`, 'warn');
    }
  } else {
    if (typeof toast === 'function') toast(`City Saved to Cloud (Slot ${id})`, 'ok');
  }
  
  if (isQuitMode) {
     location.reload();
  } else {
     renderSaveManager();
  }
}

async function loadFromSlot(id) {
  const payload = await window.db.loadCloudSave(id);
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
  await window.db.syncCloudSave(allSlots, id, true); // force delete
  
  renderSaveManager();
}

// Auto-save every 60s
setInterval(() => {
  const activeSlot = sessionStorage.getItem('aurora-active-slot');
  if (!isBackgroundMode && window.db && window.db.session && activeSlot && !gamePaused) {
    _saveToSlot(parseInt(activeSlot, 10), false); // Autosave is NOT forced
  }
}, 60000);

// Export to window
window.renderSaveManager = renderSaveManager;
window.saveToSlot = (id) => _saveToSlot(id, true); // Manual clicks are forced
window.loadFromSlot = loadFromSlot;
window.deleteSlot = deleteSlot;
window.buildSavePayload = buildSavePayload;
window.saveToCloud = () => {
    const activeSlot = sessionStorage.getItem('aurora-active-slot');
    if (activeSlot) _saveToSlot(parseInt(activeSlot, 10), true);
    else openSaveManager();
};
