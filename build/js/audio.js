// =====================================================
//  Aurora Skylines — Audio
// =====================================================
'use strict';

let audioCtx = null;

/**
 * Play a procedurally generated sound effect.
 * Silenced in background (menu) mode.
 */
function playSound(type) {
  if (isBackgroundMode) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'place') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);

    } else if (type === 'demolish') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);

    } else if (type === 'click') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now); osc.stop(now + 0.05);

    } else if (type === 'upgrade') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.1);
      osc.frequency.setValueAtTime(659, now + 0.2);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);

    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.setValueAtTime(150, now + 0.1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    }
  } catch (e) {}
}

/**
 * Initialise main-menu & in-game music controls.
 * Syncs both the pause-menu and settings-overlay sliders/toggles.
 */
function initMainMenuSettings() {
  const audio      = document.getElementById('bgMusic');
  const sliders    = ['music-vol-main', 'music-vol'];
  const labels     = ['vol-label-main', 'vol-label'];
  const toggleBtns = ['music-toggle-main', 'music-toggle'];

  if (!audio) return;

  // Persist volume across sessions
  const savedVol   = localStorage.getItem('aurora-music-vol');
  const initialVol = savedVol !== null ? parseInt(savedVol, 10) : 25;

  const updateAll = (val) => {
    const pct = parseInt(val, 10) || 0;
    audio.volume = Math.pow(pct / 100, 2);
    localStorage.setItem('aurora-music-vol', pct);
    sliders.forEach(id => { const s = document.getElementById(id); if (s) s.value = pct; });
    labels.forEach(id  => { const l = document.getElementById(id); if (l) l.textContent = pct + '%'; });
  };

  const updateToggleStates = (text) => {
    toggleBtns.forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.textContent = text;
      if (text === 'Play') btn.classList.add('paused');
      else btn.classList.remove('paused');
    });
  };

  updateAll(initialVol);

  sliders.forEach(id => {
    const s = document.getElementById(id);
    if (s) {
      s.addEventListener('input',  () => updateAll(s.value));
      s.addEventListener('change', () => updateAll(s.value));
    }
  });

  toggleBtns.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audio.paused) { audio.play().catch(() => {}); updateToggleStates('Pause'); }
        else              { audio.pause();                  updateToggleStates('Play');  }
      });
    }
  });

  // Auto-play; defer to first user interaction if browser blocks it
  const startPlaying = () => {
    if (audio.paused) {
      audio.play().then(() => {
        const v = localStorage.getItem('aurora-music-vol') || 25;
        updateAll(v);
        updateToggleStates('Pause');
      }).catch(() => {
        const resume = () => {
          if (audio.paused) {
            audio.play().then(() => {
              const v = localStorage.getItem('aurora-music-vol') || 25;
              updateAll(v);
              updateToggleStates('Pause');
            }).catch(() => {});
          }
          window.removeEventListener('click',   resume);
          window.removeEventListener('keydown', resume);
        };
        window.addEventListener('click',   resume);
        window.addEventListener('keydown', resume);
      });
    }
  };
  startPlaying();
}
