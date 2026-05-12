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

function initMainMenuSettings() {
  const audio = document.getElementById('bgMusic');
  if (!audio) return;

  const sliderIds = ['music-vol-main', 'music-vol'];
  const labelIds  = ['vol-label-main', 'vol-label'];
  const toggleIds = ['music-toggle-main', 'music-toggle'];

  function updateAll(val) {
    const pct = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
    audio.volume = Math.pow(pct / 100, 2);
    localStorage.setItem('aurora-music-vol', pct);
    
    sliderIds.forEach(id => {
      const s = document.getElementById(id);
      if (s) s.value = pct;
    });
    labelIds.forEach(id => {
      const l = document.getElementById(id);
      if (l) l.textContent = pct + '%';
    });
  }

  function syncToggle(isPaused) {
    toggleIds.forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.textContent = isPaused ? 'Play' : 'Pause';
      if (isPaused) btn.classList.add('paused');
      else btn.classList.remove('paused');
    });
  }

  // Initial state
  const saved = parseInt(localStorage.getItem('aurora-music-vol') || '25', 10);
  updateAll(saved);
  syncToggle(audio.paused);

  // Event Listeners
  sliderIds.forEach(id => {
    const s = document.getElementById(id);
    if (s) {
      s.addEventListener('input', () => updateAll(s.value));
      s.addEventListener('change', () => updateAll(s.value));
    }
  });

  toggleIds.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audio.paused) {
          audio.play().then(() => syncToggle(false)).catch(() => {});
        } else {
          audio.pause();
          syncToggle(true);
        }
      });
    }
  });

  // Autoplay fallback
  const startPlaying = () => {
    if (audio.paused) {
      audio.play().then(() => syncToggle(false)).catch(() => {
        const resume = () => {
          if (audio.paused) audio.play().then(() => syncToggle(false)).catch(() => {});
          window.removeEventListener('click', resume);
        };
        window.addEventListener('click', resume);
      });
    }
  };
  startPlaying();
}
