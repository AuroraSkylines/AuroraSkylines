// =====================================================
//  Aurora Skylines — Save Manager (Cloud Edition)
// =====================================================
'use strict';

async function startGameNew() {
  if (await customConfirm("Start a new city? This will wipe your current cloud save.", "Start New")) {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    // Clear cloud save by syncing empty payload if needed, or just let it overwrite later
    if (window.db && window.db.session) {
      await window.db.syncCloudSave(null); // Or {}
    }
    location.reload();
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

// Replaces local slot saving with a forced cloud sync
async function saveToCloud() {
  if (isBackgroundMode) return;
  const payload = buildSavePayload();
  // Also keep a local backup just in case
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  
  if (window.db && window.db.session) {
    await window.db.syncCloudSave(payload);
    if (typeof toast === 'function') toast('Synced to cloud ☁️', 'ok');
  }
}

// We override the old save manager UI logic
function openSaveManager() {
  // Instead of opening a complex slot manager, just force a save for the alpha
  saveToCloud();
}

function closeSaveManager() {
  // No-op for cloud edition
}

// Hook into beforeunload to attempt a final save
window.addEventListener('beforeunload', (e) => {
  if (!isBackgroundMode && window.db && window.db.session) {
    const payload = buildSavePayload();
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    // Supabase async call might not finish, but we try
    window.db.syncCloudSave(payload);
  }
});
