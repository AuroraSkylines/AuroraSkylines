// =====================================================
//  Aurora Skylines — Auth UI & Initialization
// =====================================================
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const authScreen = document.getElementById('auth-screen');
  const mainMenu = document.getElementById('main-menu');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('auth-login-form');
  const formRegister = document.getElementById('auth-register-form');
  const btnLogin = document.getElementById('btn-login');
  const btnRegister = document.getElementById('btn-register');
  const errLogin = document.getElementById('login-error');
  const errReg = document.getElementById('reg-error');
  const loadingText = document.getElementById('auth-loading');

  // Start background city rendering but hide the main menu for now
  init(false, true);
  if (mainMenu) mainMenu.style.display = 'none';

  function showLoading(show) {
    if (show) {
      formLogin.classList.add('hidden');
      formRegister.classList.add('hidden');
      tabLogin.parentElement.style.display = 'none';
      loadingText.classList.remove('hidden');
    } else {
      loadingText.classList.add('hidden');
      tabLogin.parentElement.style.display = 'flex';
      if (tabLogin.classList.contains('active')) formLogin.classList.remove('hidden');
      else formRegister.classList.remove('hidden');
    }
  }

  function showError(el, msg) {
    if (!msg) {
      el.classList.add('hidden');
    } else {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
  }

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLogin.classList.remove('hidden');
    formRegister.classList.add('hidden');
    showError(errLogin, '');
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    formRegister.classList.remove('hidden');
    formLogin.classList.add('hidden');
    showError(errReg, '');
  });

  async function handlePostAuth() {
    showLoading(true);
    try {
      // Hide the auth overlay
      authScreen.classList.add('hidden');
      setTimeout(() => authScreen.style.display = 'none', 500);
      
      // Reveal the main menu
      const mainMenu = document.getElementById('main-menu');
      if (mainMenu) {
        mainMenu.style.display = 'flex';
        mainMenu.style.opacity = '1';
      }
      
      // Ensure we are in background mode (menu mode)
      if (typeof window.init === 'function') {
        window.init(false, true); 
      }

      // ── Wire up Settings audio controls for the start menu ──
      const audio = document.getElementById('bgMusic');
      if (audio) {
        const savedVol = parseInt(localStorage.getItem('aurora-music-vol') || '25', 10);
        audio.volume = Math.pow(savedVol / 100, 2);
        audio.play().catch(() => {
          const resume = () => { audio.play().catch(() => {}); document.removeEventListener('click', resume); };
          document.addEventListener('click', resume);
        });

        const allSliderIds = ['music-vol-main', 'music-vol'];
        const allLabelIds  = ['vol-label-main', 'vol-label'];
        const allToggleIds = ['music-toggle-main', 'music-toggle'];

        function setVolAll(pct) {
          pct = Math.max(0, Math.min(100, parseInt(pct, 10) || 0));
          audio.volume = Math.pow(pct / 100, 2);
          localStorage.setItem('aurora-music-vol', pct);
          allSliderIds.forEach(id => { const s = document.getElementById(id); if (s) s.value = pct; });
          allLabelIds.forEach(id  => { const l = document.getElementById(id); if (l) l.textContent = pct + '%'; });
        }
        setVolAll(savedVol);

        allSliderIds.forEach(id => {
          const s = document.getElementById(id);
          if (s) {
            s.addEventListener('input',  () => setVolAll(s.value));
            s.addEventListener('change', () => setVolAll(s.value));
          }
        });

        allToggleIds.forEach(id => {
          const btn = document.getElementById(id);
          if (btn) {
            btn.addEventListener('click', e => {
              e.stopPropagation();
              if (audio.paused) {
                audio.play().catch(() => {});
                allToggleIds.forEach(bid => { const b = document.getElementById(bid); if (b) { b.textContent = 'Pause'; b.classList.remove('paused'); }});
              } else {
                audio.pause();
                allToggleIds.forEach(bid => { const b = document.getElementById(bid); if (b) { b.textContent = 'Play'; b.classList.add('paused'); }});
              }
            });
          }
        });
      }
    } catch (e) {
      console.error("Post-auth error:", e);
      location.reload(); 
    }
  }

  btnLogin.addEventListener('click', async () => {
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value;
    showError(errLogin, '');
    showLoading(true);
    try {
      await window.db.login(user, pass);
      await handlePostAuth();
    } catch (e) {
      showError(errLogin, e.message);
      showLoading(false);
    }
  });

  btnRegister.addEventListener('click', async () => {
    const user = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-password').value;
    const key = document.getElementById('reg-invite').value.trim().toUpperCase();
    showError(errReg, '');
    showLoading(true);
    try {
      await window.db.register(user, pass, key);
      await handlePostAuth();
    } catch (e) {
      showError(errReg, e.message);
      showLoading(false);
    }
  });

  // Check existing session
  showLoading(true);
  try {
    if (!window.db) throw new Error("Database script failed to load. Check your supabase.js file for syntax errors or missing folders.");
    await window.db.init();
    if (window.db.session) {
      await handlePostAuth();
    } else {
      showLoading(false);
    }
  } catch (err) {
    console.error("Initialization Error:", err);
    showLoading(false);
    showError(errLogin, "System Error: " + err.message);
  }

  // ── Account Manager Logic ──
  window.openAccountManager = () => {
    const overlay = document.getElementById('account-overlay');
    const nameEl = document.getElementById('account-username');
    const adminBtn = document.getElementById('btn-open-admin');
    
    if (overlay && window.db && window.db.session) {
      const username = window.db.session.user.user_metadata.username || 'User';
      nameEl.textContent = `Logged in as: ${username}`;
      
      // Show Admin button if the user is 'admin' (or modify this check as needed)
      if (username.toLowerCase() === 'admin' && adminBtn) {
        adminBtn.classList.remove('hidden');
      } else if (adminBtn) {
        adminBtn.classList.add('hidden');
      }

      overlay.classList.remove('hidden');
      overlay.setAttribute('aria-hidden', 'false');
    }
  };

  window.closeAccountManager = () => {
    const overlay = document.getElementById('account-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
      document.getElementById('account-new-password').value = '';
      showError(document.getElementById('account-msg'), '');
    }
  };

  document.getElementById('btn-change-password').addEventListener('click', async () => {
    const newPass = document.getElementById('account-new-password').value;
    const msgEl = document.getElementById('account-msg');
    if (!newPass || newPass.length < 6) {
      showError(msgEl, 'Password must be at least 6 characters.');
      return;
    }
    
    try {
      await window.db.changePassword(newPass);
      showError(msgEl, 'Password updated successfully!');
      msgEl.style.color = '#10b981'; // Green success color
      setTimeout(() => {
        msgEl.style.color = ''; // Reset
        window.closeAccountManager();
      }, 2000);
    } catch (e) {
      msgEl.style.color = '';
      showError(msgEl, e.message);
    }
  });

  document.getElementById('btn-logout').addEventListener('click', async () => {
    try {
      await window.db.logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
  });

  // ── Admin Key Manager Logic ──
  window.openAdminManager = async () => {
    document.getElementById('account-overlay').classList.add('hidden');
    const adminOverlay = document.getElementById('admin-overlay');
    if (adminOverlay) {
      adminOverlay.classList.remove('hidden');
      adminOverlay.setAttribute('aria-hidden', 'false');
      await refreshAdminKeys();
    }
  };

  window.closeAdminManager = () => {
    const adminOverlay = document.getElementById('admin-overlay');
    if (adminOverlay) {
      adminOverlay.classList.add('hidden');
      adminOverlay.setAttribute('aria-hidden', 'true');
      document.getElementById('account-overlay').classList.remove('hidden'); // Back to account
    }
  };

  async function refreshAdminKeys() {
    const list = document.getElementById('admin-keys-list');
    list.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.3);font-family:var(--fu);font-size:12px;padding:20px;">Loading keys...</div>';
    try {
      const keys = await window.db.fetchKeys();
      if (!keys || keys.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.3);font-family:var(--fu);font-size:12px;padding:20px;">No keys found. Generate one above!</div>';
        return;
      }
      
      list.innerHTML = '';
      keys.forEach(k => {
        const item = document.createElement('div');
        item.style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; font-family: var(--fu); font-size: 13px;';
        
        const keyText = document.createElement('span');
        keyText.style.cssText = 'font-family: monospace; font-weight: bold; color: #fff; letter-spacing: 1px;';
        keyText.textContent = k.key;
        
        const statusBadge = document.createElement('span');
        if (k.used) {
          statusBadge.textContent = 'USED';
          statusBadge.style.cssText = 'font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: rgba(251,113,133,0.15); color: #fecdd3; border: 1px solid rgba(251,113,133,0.25);';
        } else {
          statusBadge.textContent = 'AVAILABLE';
          statusBadge.style.cssText = 'font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: rgba(46,230,166,0.15); color: var(--mint); border: 1px solid rgba(46,230,166,0.25);';
        }
        
        item.appendChild(keyText);
        item.appendChild(statusBadge);
        list.appendChild(item);
      });
    } catch (e) {
      list.innerHTML = `<div style="text-align:center;color:var(--rose);font-family:var(--fu);font-size:12px;padding:20px;">Error: ${e.message}</div>`;
    }
  }

  document.getElementById('btn-generate-key')?.addEventListener('click', async () => {
    const prefixInput = document.getElementById('admin-key-prefix').value.trim();
    const msgEl = document.getElementById('admin-msg');
    showError(msgEl, '');
    
    const oldText = document.getElementById('btn-generate-key').textContent;
    document.getElementById('btn-generate-key').textContent = '...';
    try {
      const prefix = prefixInput || 'ALPHA-';
      await window.db.generateKey(prefix);
      document.getElementById('admin-key-prefix').value = '';
      await refreshAdminKeys();
    } catch (e) {
      showError(msgEl, e.message);
    }
    document.getElementById('btn-generate-key').textContent = oldText;
  });

});
