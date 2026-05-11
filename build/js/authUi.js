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
});
