// =====================================================
//  Aurora Skylines — Constants & Building Data
// =====================================================
'use strict';

const GRID = 32;
const CELL = 2.5;
const HALF = (GRID * CELL) / 2;

const BDATA = {
  road:         { icon:'🛣️', name:'Road',          cost:10,  pop:0,  energy:0,   income:1,  desc:'Connects blocks. Most buildings need a road neighbor.', note:'Roads refund full demolish. Cost drops with Efficient Paving.' },
  house:        { icon:'🏠', name:'House',         cost:50,  pop:4,  energy:-1,  income:5,  desc:'Homes for citizens and steady rent.',  note:'Needs a road next to it.' },
  apartment:    { icon:'🏢', name:'Apartment',     cost:150, pop:15, energy:-3,  income:18, desc:'Dense housing — big population jumps.',   note:'Needs a road next to it.' },
  shop:         { icon:'🏪', name:'Shop',          cost:80,  pop:0,  energy:-2,  income:25, desc:'Retail hub. Commerce upgrades stack.',    note:'Needs a road next to it.' },
  park:         { icon:'🌳', name:'Park',          cost:40,  pop:0,  energy:0,   income:2,  desc:'Green space — small payout, big vibes.',   note:'Needs a road next to it.' },
  windturbine:  { icon:'💨', name:'Wind Turbine',  cost:80,  pop:0,  energy:5,   income:-2, desc:'Clean energy. Cheap but low output. Smart Grid adds +2 ⚡.', note:'Needs a road next to it.' },
  solar:        { icon:'☀️', name:'Solar Farm',    cost:150, pop:0,  energy:12,  income:-4, desc:'Moderate energy. Great for urban zones. Smart Grid adds +4 ⚡.', note:'Needs a road next to it.' },
  nuclear:      { icon:'☢️', name:'Nuclear Plant', cost:400, pop:0,  energy:40,  income:-10,desc:'Massive energy output. Powers the whole district. Smart Grid adds +8 ⚡.', note:'Needs a road next to it.' },
  factory:      { icon:'🏭', name:'Factory',       cost:200, pop:0,  energy:-5,  income:40, desc:'High output industry.',    note:'Needs a road next to it.' },
  demolish:     { icon:'🗑️', name:'Demolish',      cost:0,   pop:0,  energy:0,   income:0,  desc:'Remove a tile. Refund 30% of build cost (roads: full refund).',           note:'Click any tile.' },
};

const NEEDS_ROAD = new Set(['house','apartment','shop','park','factory','windturbine','solar','nuclear']);

const SAVE_KEY   = 'aurora-skylines-save-v1';
const SAVE_SLOTS = [
  'aurora-save-slot-1', 'aurora-save-slot-2', 'aurora-save-slot-3',
  'aurora-save-slot-4', 'aurora-save-slot-5', 'aurora-save-slot-6'
];

const UPGRADE_DEFS = [
  { id:'efficient_paving', name:'Efficient Paving', icon:'🛤️', desc:'Road tiles cost less to build.', max:3,
    cost:(lvl) => 180 + lvl * 280 },
  { id:'commerce_hub', name:'Commerce Hub', icon:'💼', desc:'Each shop earns more every payout.', max:3,
    cost:(lvl) => 300 + lvl * 420 },
  { id:'green_city', name:'Green City', icon:'🌿', desc:'Parks bring nicer bonuses.', max:3,
    cost:(lvl) => 220 + lvl * 260 },
  { id:'smart_grid', name:'Smart Grid', icon:'🔌', desc:'Power plants output extra energy.', max:3,
    cost:(lvl) => 350 + lvl * 520 },
  { id:'housing_boom', name:'Housing Boom', icon:'🏘️', desc:'Houses & apartments house more people.', max:3,
    cost:(lvl) => 280 + lvl * 380 },
  { id:'transit_ai', name:'Transit AI', icon:'🚌', desc:'Smarter traffic: more cars, tighter spawn cadence.', max:3,
    cost:(lvl) => 260 + lvl * 340 },
];
