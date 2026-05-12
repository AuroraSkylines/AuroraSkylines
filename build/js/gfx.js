// =====================================================
//  Aurora Skylines — Graphics Manager
// =====================================================
'use strict';

window.gfxSettings = {
  shadowQuality: localStorage.getItem('aurora-gfx-shadow') || 'high',
  renderDistance: localStorage.getItem('aurora-gfx-distance') || 'far',
  particles: localStorage.getItem('aurora-gfx-particles') || 'on',
  streetLights: localStorage.getItem('aurora-gfx-lights') || 'on',
  waterEffects: localStorage.getItem('aurora-gfx-water') || 'on',
};

function setGraphicsQuality(key, value) {
  window.gfxSettings[key] = value;
  localStorage.setItem('aurora-gfx-' + key.replace(/([A-Z])/g, '-$1').toLowerCase().replace('render-distance', 'distance'), value);

  if (typeof sun !== 'undefined') {
    if (key === 'shadowQuality') {
      if (value === 'off') {
        sun.castShadow = false;
      } else {
        sun.castShadow = true;
        if (value === 'low') sun.shadow.mapSize.set(512, 512);
        else if (value === 'medium') sun.shadow.mapSize.set(1024, 1024);
        else sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.map?.dispose();
        sun.shadow.map = null;
      }
    }
  }

  // Other settings take effect over time (particles) or on next rebuild (water/lights)
  // Re-run applySkyPhase to update fog
  if (typeof applySkyPhase === 'function' && typeof state !== 'undefined' && state.dayTimer) {
    applySkyPhase(state.dayTimer / state.DAY_LEN);
  }
}
