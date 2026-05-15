// =====================================================
//  Aurora Skylines — UI & HUD
// =====================================================
'use strict';

function closePauseMenu() {
  const el = document.getElementById('pause-overlay');
  if (!el) return;
  el.classList.remove('is-visible');
  el.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('game-paused');
  gamePaused = false;
}

function togglePauseMenu() {
  const el = document.getElementById('pause-overlay');
  if (!el) return;
  if (el.classList.contains('is-visible')) {
    closePauseMenu();
    return;
  }
  el.classList.add('is-visible');
  el.setAttribute('aria-hidden', 'false');
  document.body.classList.add('game-paused');
  gamePaused = true;
  closeUpgrades();
  const ip = document.getElementById('info-panel');
  const ib = document.getElementById('info-btn');
  if (ip) ip.classList.add('hidden');
  if (ib) ib.classList.remove('active');
}

function upgradeMetaLine(id, lv, maxed) {
  const def = UPGRADE_DEFS.find(u => u.id === id);
  if (maxed) return `Max tier (${def ? def.max : '—'})`;
  switch (id) {
    case 'efficient_paving': return `Roads ${fmtEuro(getRoadCost())} / tile now`;
    case 'commerce_hub': return `Shops +${fmtEuro(6 * lv)}/day → +${fmtEuro(6 * (lv + 1))} next`;
    case 'green_city': return `Parks +${fmtEuro(2 * lv)}/day → +${fmtEuro(2 * (lv + 1))} next`;
    case 'smart_grid': return `Plants +${4 * lv} ⚡ now → +${4 * (lv + 1)} next`;
    case 'housing_boom': return `Houses +${lv} 👥, apts +${lv * 2} (now) → +${lv + 1} / +${(lv + 1) * 2} next`;
    case 'transit_ai': return `Max cars ${12 + lv * 10} → ${12 + (lv + 1) * 10} next`;
    default: return '';
  }
}

function refreshUpgradeCards() {
  UPGRADE_DEFS.forEach(def => {
    const card = document.querySelector(`.upgrade-card[data-id="${def.id}"]`);
    if (!card) return;
    const lv = getUpgradeLevel(def.id);
    const btn = card.querySelector('.upgrade-buy');
    const meta = card.querySelector('.uc-meta');
    const maxed = lv >= def.max;
    const price = maxed ? 0 : def.cost(lv);
    if (meta) meta.textContent = upgradeMetaLine(def.id, lv, maxed);
    if (btn) {
      btn.disabled = maxed || state.gold < price;
      btn.textContent = maxed ? 'Maxed' : fmtEuro(price);
      btn.classList.toggle('maxed-btn', maxed);
    }
    card.classList.toggle('maxed', maxed);
  });
  updateBuildBarCosts();
}

function buyUpgrade(id) {
  const def = UPGRADE_DEFS.find(u => u.id === id);
  if (!def) return;
  const lv = getUpgradeLevel(id);
  if (lv >= def.max) return;
  const price = def.cost(lv);
  if (state.gold < price) { toast('Not enough budget for this upgrade', 'warn'); return; }
  state.gold -= price;
  state.upgradeLevels[id] = lv + 1;
  playSound('upgrade');
  toast(`${def.name} upgraded`, 'ok');
  hudUpdate(true);
  updateIncomePreview();
  refreshUpgradeCards();
  recalc();
  hudUpdate();
  updateIncomePreview();
}

function initUpgradeShop() {
  const list = document.getElementById('upgrades-list');
  if (!list) return;
  list.innerHTML = '';
  UPGRADE_DEFS.forEach(def => {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.dataset.id = def.id;
    card.innerHTML = `
      <div class="uc-icon">${def.icon}</div>
      <div class="uc-body">
        <h4>${def.name}</h4>
        <p>${def.desc}</p>
        <div class="uc-meta"></div>
      </div>
      <button type="button" class="upgrade-buy">Buy</button>
    `;
    card.querySelector('.upgrade-buy').addEventListener('click', e => { e.stopPropagation(); buyUpgrade(def.id); });
    list.appendChild(card);
  });
  refreshUpgradeCards();
}

function updateBuildBarCosts() {
  const roadBtn = document.querySelector('[data-type="road"] .bc');
  if (roadBtn) roadBtn.textContent = fmtEuro(getRoadCost());
}

const infoPanelEl=document.getElementById('info-panel');
const upgradesPanelEl=document.getElementById('upgrades-panel');
const upgradesBtn=document.getElementById('upgrades-btn');
const infoBtn=document.getElementById('info-btn');

if (infoPanelEl) infoPanelEl.classList.add('hidden');
if (upgradesPanelEl) upgradesPanelEl.classList.add('hidden');

document.querySelectorAll('.build-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    playSound('click');
    document.querySelectorAll('.build-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); state.selected=btn.dataset.type;
    updateInfoPanel(btn.dataset.type);
  });
});

document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    playSound('click');
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const targetId = btn.dataset.folder;
    document.querySelectorAll('.build-folder').forEach(folder => {
      if (folder.id === targetId) {
        folder.classList.add('active');
      } else {
        folder.classList.remove('active');
      }
    });
  });
});

function updateInfoPanel(type){
  const d=BDATA[type]; if(!d)return;
  const iconEl=document.getElementById('info-icon');
  const nameEl=document.getElementById('info-name');
  const costEl=document.getElementById('info-cost');
  if(iconEl) iconEl.textContent=d.icon;
  if(nameEl) nameEl.textContent=d.name;
  if(costEl) {
    if (type === 'road') costEl.textContent = fmtEuro(getRoadCost());
    else costEl.textContent = d.cost>0?fmtEuro(d.cost):'Free';
  }
  const descEl=document.getElementById('info-desc');
  if(descEl) descEl.textContent=d.desc;
  const stats=document.getElementById('info-stats');
  if(stats){
    stats.innerHTML='';
    const hb=getUpgradeLevel('housing_boom');
    const sg=getUpgradeLevel('smart_grid');
    let popShow=d.pop;
    if(type==='house') popShow+=hb;
    if(type==='apartment') popShow+=hb*2;
    let nrg=d.energy;
    if(type==='power') nrg+=sg*4;
    const incShow=incomeForCell({type});
    [[`Population`,popShow],[`Energy`,nrg]].forEach(([label,val])=>{
      if(val===0) return;
      const row=document.createElement('div'); row.className='stat-row';
      const cls=val>0?'stat-pos':val<0?'stat-neg':'stat-neu';
      row.innerHTML=`<span>${label}</span><span class="stat-val ${cls}">${val>0?'+':''}${val}</span>`;
      stats.appendChild(row);
    });
    const irow=document.createElement('div'); irow.className='stat-row';
    const icls=incShow>0?'stat-pos':incShow<0?'stat-neg':'stat-neu';
    irow.innerHTML=`<span>Income / day</span><span class="stat-val ${icls}">${fmtEuroSigned(incShow)} / day</span>`;
    stats.appendChild(irow);
  }
  const noteEl=document.getElementById('info-note');
  if(noteEl) noteEl.textContent=d.note||'';
}

function openUpgrades(){
  if(!upgradesPanelEl)return;
  closePauseMenu();
  upgradesPanelEl.classList.remove('hidden');
  upgradesPanelEl.setAttribute('aria-hidden','false');
  if (upgradesBtn) upgradesBtn.classList.add('active');
  if(infoPanelEl){infoPanelEl.classList.add('hidden');if(infoBtn)infoBtn.classList.remove('active');}
  refreshUpgradeCards();
}
function closeUpgrades(){
  if(!upgradesPanelEl)return;
  upgradesPanelEl.classList.add('hidden');
  upgradesPanelEl.setAttribute('aria-hidden','true');
  if (upgradesBtn) upgradesBtn.classList.remove('active');
}

if (upgradesBtn) {
  upgradesBtn.addEventListener('click', e => { e.stopPropagation(); playSound('click'); upgradesPanelEl.classList.contains('hidden')?openUpgrades():closeUpgrades(); });
}
const upgradesClose=document.getElementById('upgrades-close');
if (upgradesClose) {
  upgradesClose.addEventListener('click', e => { e.stopPropagation(); closeUpgrades(); });
}

if (infoBtn) {
  infoBtn.addEventListener('click',()=>{
    playSound('click');
    closePauseMenu();
    const h=infoPanelEl.classList.toggle('hidden');
    infoBtn.classList.toggle('active',!h);
    if(!h){updateInfoPanel(state.selected);closeUpgrades();}
  });
}

function initBuildMenuTooltips() {
  const tooltip = document.getElementById('build-tooltip');
  if (!tooltip) return;
  document.querySelectorAll('.build-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      const type = btn.dataset.type;
      const data = BDATA[type] || (type === 'demolish' ? { name:'Demolish', icon:'🗑️', desc:'Remove buildings.', note:'Roads refund full cost.' } : null);
      if (!data) return;
      tooltip.innerHTML = `
        <div class="tt-head"><span class="tt-icon">${data.icon}</span><div class="tt-title">${data.name}</div></div>
        <div class="tt-desc">${data.desc}</div>
        <div class="tt-note">${data.note}</div>
      `;
      tooltip.classList.remove('hidden');
      tooltip.classList.add('tooltip-active');
      const rect = btn.getBoundingClientRect();
      tooltip.style.left = (rect.left + rect.width/2) + 'px';
      tooltip.style.bottom = (window.innerHeight - rect.top + 16) + 'px';
    });
    btn.addEventListener('mouseleave', () => {
      tooltip.classList.remove('tooltip-active');
      tooltip.classList.add('hidden');
    });
  });
}

function updateDayBar() {
  const fill = document.getElementById('day-cycle-fill');
  if (fill) fill.style.width = `${(state.dayTimer / state.DAY_LEN) * 100}%`;

  const clock = document.getElementById('game-clock');
  if (clock) {
    const totalMinutes = (state.dayTimer / state.DAY_LEN) * 24 * 60;
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.floor(totalMinutes % 60);
    clock.textContent = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}

function updateIncomePreview() {
  // Now handled by custom HUD tooltips
}

function hudUpdate(pop=false){
  const gel=document.getElementById('val-gold');
  if(gel){
    gel.textContent=fmtEuro(Math.floor(state.gold));
    if(pop){gel.classList.remove('pop');void gel.offsetWidth;gel.classList.add('pop');}
  }
  setVal('val-pop',state.pop,pop);
  const ev=document.getElementById('val-energy');
  if(ev){
    ev.textContent=state.energy>=0?`+${state.energy}`:state.energy;
    document.getElementById('pill-energy').classList.toggle('danger',state.energy<0);
  }
  const dv=document.getElementById('day-num');
  if(dv) dv.textContent=Math.floor(state.day);
}

function setVal(id,val,anim){
  const el=document.getElementById(id); if(!el)return;
  el.textContent=val;
  if(anim){el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');}
}

let toastTmr=null;
function toast(msg,type=''){
  const el=document.getElementById('toast');
  if(!el)return;
  if(type==='error'||type==='warn') playSound('error');
  el.textContent=msg; el.className='show'+(type?' '+type:'');
  clearTimeout(toastTmr); toastTmr=setTimeout(()=>el.className='',2400);
}

let eventToastTmr = null;
function toastEvent(msg, gold, type) {
  playSound(type === 'ok' ? 'upgrade' : 'error');
  const el = document.getElementById('event-toast');
  if (!el) { toast(msg, type); return; }
  const goldStr = gold > 0 ? `<span class="et-gold">+${fmtEuro(gold)}</span>` :
                  gold < 0 ? `<span class="et-loss">${fmtEuroSigned(gold)}</span>` : '';
  el.innerHTML = `<span class="et-icon">${type==='ok'?'✨':'⚠️'}</span><span class="et-msg">${msg}</span>${goldStr}`;
  el.className = 'et-show ' + type;
  clearTimeout(eventToastTmr);
  eventToastTmr = setTimeout(() => el.className = '', 4200);
}

document.getElementById('pause-resume')?.addEventListener('click', () => closePauseMenu());
document.getElementById('pause-save-open')?.addEventListener('click', () => { openSaveManager(); });
document.getElementById('save-manager-close')?.addEventListener('click', () => { closeSaveManager(); });
document.querySelector('.sm-backdrop')?.addEventListener('click', () => { closeSaveManager(); });
document.getElementById('pause-quit')?.addEventListener('click', () => {
  if (typeof buildSavePayload !== 'function') {
    location.reload();
    return;
  }
  const activeSlot = sessionStorage.getItem('aurora-active-slot');
  const slotIdStr = activeSlot ? (activeSlot.includes('slot-') ? activeSlot : `aurora-save-slot-${activeSlot}`) : null;
  if (slotIdStr && SAVE_SLOTS.includes(slotIdStr)) {
    isQuitMode = true;
    saveToSlot(parseInt(activeSlot.replace(/\D/g, ''), 10));
  } else {
    isQuitMode = true;
    if (typeof openSaveManager === 'function') {
      renderSaveManager();
      openSaveManager();
      if (typeof toast === 'function') toast('Select a slot to save your new city', 'info');
    } else {
      const payload = buildSavePayload();
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      location.reload();
    }
  }
});
document.getElementById('save-manager-close')?.addEventListener('click', () => {
  isQuitMode = false;
  closeSaveManager();
  renderSaveManager();
});
document.querySelector('#pause-overlay .pause-backdrop')?.addEventListener('click', () => closePauseMenu());
document.getElementById('pause-fab')?.addEventListener('click', e => { e.stopPropagation(); playSound('click'); togglePauseMenu(); });

// HUD TOOLTIPS
function initHudTooltips() {
  const tt = document.getElementById('hud-tooltip');
  if (!tt) return;

  document.querySelectorAll('.res-pill').forEach(pill => {
    pill.addEventListener('mouseenter', () => {
      let content = '';
      const id = pill.id;

      if (id === 'money-pill') {
        const daily = projectedDailyIncome();
        const hourly = Math.floor(daily / 24);
        const cls = hourly >= 0 ? 'ht-pos' : 'ht-neg';
        content = `
          <span class="ht-label">Hourly Projection</span>
          <div class="ht-value ${cls}">${fmtEuroSigned(hourly)}/h</div>
        `;
      } else if (pill.classList.contains('pop-pill')) {
        content = `
          <span class="ht-label">City Demographics</span>
          <div class="ht-value ht-neu">${state.pop} Citizens</div>
        `;
      } else if (id === 'pill-energy') {
        const cls = state.energy >= 0 ? 'ht-pos' : 'ht-neg';
        content = `
          <span class="ht-label">Power Balance</span>
          <div class="ht-value ${cls}">${state.energy >= 0 ? '+' : ''}${state.energy} GW</div>
        `;
      } else if (pill.classList.contains('day-pill')) {
        content = `
          <span class="ht-label">Simulation Time</span>
          <div class="ht-value ht-neu">Day ${Math.floor(state.day)}</div>
        `;
      }

      if (content) {
        tt.innerHTML = content;
        tt.classList.add('show');
        const rect = pill.getBoundingClientRect();
        tt.style.left = (rect.left + rect.width / 2) + 'px';
        tt.style.top = (rect.bottom + 12) + 'px';
      }
    });

    pill.addEventListener('mouseleave', () => {
      tt.classList.remove('show');
    });
  });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initHudTooltips();
});
// Also run immediately if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initHudTooltips();
}
