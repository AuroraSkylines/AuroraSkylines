// =====================================================
//  Aurora Skylines — Game State
// =====================================================
'use strict';

const state = {
  gold: 2000,
  pop: 0,
  energy: 0,
  happiness: 75,
  day: 1,
  selected: 'road',
  grid: {},
  meshes: {},
  dayTimer: 0,
  DAY_LEN: 14,
  upgradeLevels: {},
  nextEventDay: 5 + Math.floor(Math.random() * 4),
};

// Initialise all upgrade levels to 0
UPGRADE_DEFS.forEach(u => { state.upgradeLevels[u.id] = 0; });

let isBackgroundMode = false;
let gamePaused       = false;
let isQuitMode       = false;

const cars = [];
let carSpawnTimer = 0;
let lastT = 0;
