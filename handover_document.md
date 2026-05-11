# 🌆 Aurora Skylines — Technical Handover Document

This document provides a comprehensive technical overview and handover for **Aurora Skylines**, a grid-based city builder developed using vanilla JavaScript and Three.js.

---

## 1. Project Summary

*   **Project Name:** Aurora Skylines
*   **Genre:** Casual City Builder / Management Simulation
*   **Core Gameplay Loop:** Build roads to expand the grid → Place residential, commercial, and industrial zones → Manage Energy and Budget → Invest in Upgrades → Grow the population while balancing happiness.
*   **Main Objective:** Maximize city population and financial stability through strategic urban planning.
*   **Platform:** Web (Browser-based)
*   **Current Development Stage:** Beta / Feature-Complete Core. The game is fully playable with saving, loading, progression, and procedural systems.

---

## 2. Full Feature List

### Core Gameplay Systems
*   **Grid System:** 32x32 playable tiles with a coordinate-based state map. [Complete]
*   **Building Placement:** Real-time placement with validation (budget, occupancy, road proximity). [Complete]
*   **Demolition System:** Tile removal with partial building refund and full road refund. [Complete]
*   **Day/Night Cycle:** 14-second day cycle with dynamic sky color lerping and lighting shifts. [Complete]

### UI Systems
*   **Glassmorphism HUD:** Translucent, blurred UI panels for budget, population, and energy. [Complete]
*   **Build Menu:** Category-based folder system (Roads, Zones, Services, Tools). [Complete]
*   **Upgrades Panel:** Tiered investment system with real-time stat impact. [Complete]
*   **Toast Notifications:** Procedural status messages and random event alerts. [Complete]

### Save/Load
*   **6-Slot Manager:** Full city state serialization including camera position and zoom. [Complete]
*   **Auto-Resume:** Remembers the last session via `localStorage`. [Complete]

### Audio
*   **Dynamic BGM:** Background music with persistence across menus and volume controls. [Complete]
*   **Procedural SFX:** `AudioContext` generated sine/sawtooth waves for placement, errors, and UI. [Complete]

### Camera & Input
*   **Orthographic Camera:** Top-down perspective with WASD panning and mouse-drag support. [Complete]
*   **Zoom:** Scroll-wheel based smooth zoom scaling. [Complete]

### Economy & Resources
*   **Budget (Gold):** Primary currency for building and upgrades. [Complete]
*   **Population:** Driven by residential tiers (House, Apartment). [Complete]
*   **Energy Grid:** Resource required for maximum income; deficit penalizes revenue. [Complete]
*   **Random Events:** 8+ unique events (Festivals, Storms, Grants) impacting budget. [Complete]

### Visuals & Effects
*   **VFX:** Procedural fireflies (Points), starfield, and "pop-in/shrink-out" animations. [Complete]
*   **NPC Cars:** Pathfinding-based traffic system with multiple car variants. [Complete]

---

## 3. Project File Structure

The project follows a flat structure for simplicity, intended for easy deployment to static hosting.

*   **index.html:** The entry point. Contains the HTML5 canvas, UI structure (HUD, Menus, Modals), and initial audio/boot logic.
*   **game.js:** The "Monolith". Contains the entire game logic, Three.js rendering, state management, and systems.
    *   *Main Functions:* `init()`, `animate()`, `placeBuilding()`, `recalc()`, `tickDay()`, `saveToSlot()`.
*   **style.css:** Comprehensive design system. Implements the "Aurora" aesthetic (vibrant gradients, glassmorphism, Outfit/DM Sans fonts).
*   **music.mp3:** Main background track (looping).
*   **aurora_skylines_bg.png:** Fallback background asset for the main menu.
*   **vendor/three.min.js:** Three.js R128+ library.

---

## 4. Architecture Overview

Aurora Skylines uses a **State-Driven Procedural Architecture** with a single `state` object as the source of truth.

1.  **Initialization (`init`):** Sets up the Three.js scene, builds the ground grid, initializes the upgrade shop, and either loads a save or seeds a starting road.
2.  **Update Loop (`animate`):**
    *   **Input Processing:** Processes panning keys and mouse drag.
    *   **Simulation Tick (`tickDay`):** Updates the day timer, processes sky color lerps, and calculates daily payouts.
    *   **Animation:** Rotates wind turbines, updates particle positions (fireflies), and moves NPC cars along their calculated paths.
3.  **Rendering Flow:** Standard Three.js WebGL renderer. Uses `OrthographicCamera` for the classic isometric city-builder feel.
4.  **Event Flow:** DOM events (buttons/clicks) trigger logic in `game.js`, which updates the `state` object and then calls `hudUpdate()` to refresh the UI.

---

## 5. Game Systems Breakdown

### Grid & Building System
*   **Logic:** Uses a coordinate key string (`"x,z"`) for O(1) lookups in `state.grid`.
*   **Factories:** Each building type has a generator function (e.g., `makeApartment`) that returns a `THREE.Group` with randomized variants.
*   **Road Connectivity:** Road meshes are rebuilt whenever a neighbor is changed to create seamless intersections (T-junctions, corners, etc.).

### Economy System
*   **Income Calculation:** Sum of `BDATA[type].income`.
*   **Modifiers:**
    *   `Energy < 0`: 40% income penalty.
    *   `Happiness`: Scaled multiplier (0.55x to 1.25x).
    *   `Upgrades`: Bonuses for shops, parks, etc.
*   **Payout:** Occurs at the end of every `DAY_LEN` (14s).

### NPC Traffic System
*   **Spawn:** Triggered every ~3.6s (reduced by `Transit AI`).
*   **Logic:** Selects two random road tiles, finds a path using **BFS Pathfinding**, and moves a `CarMesh` along the segment list.

---

## 6. State & Data Models

### Main State Object (`state`)
```javascript
const state = {
  gold: 2000,
  pop: 0,
  energy: 0,
  happiness: 75,
  day: 1,
  selected: 'road',
  grid: {}, // Key: "x,z", Value: { type: 'house' }
  meshes: {}, // Key: "x,z", Value: THREE.Group
  dayTimer: 0,
  upgradeLevels: { efficient_paving: 0, ... },
  nextEventDay: 5
};
```

### Building Definitions (`BDATA`)
Each building entry defines its costs, population contribution, energy usage, and descriptive text.

---

## 7. Save/Load System

*   **Storage:** `localStorage` is the primary persistence layer.
*   **Format:** JSON string.
*   **Serialization:** `buildSavePayload()` gathers all critical variables, grid state, camera targets, and a "snapshot" for the Save Manager UI.
*   **Slots:** 6 dedicated keys (`aurora-save-slot-1` through `6`). Slot 1 acts as the "Legacy/Auto" save.

---

## 8. UI/UX Documentation

| Component | File Control | Description |
| :--- | :--- | :--- |
| **Main Menu** | `index.html` / `game.js` | Title, Load/New buttons, Settings access. |
| **HUD** | `style.css` | Budget Diamond, Stat Pills, Day Progress Bar. |
| **Build Menu** | `game.js` | Category switcher and tool selection. |
| **Save Manager** | `game.js` | Modal displaying snapshots of all 6 slots. |
| **Toasts** | `game.js` | Slide-in notifications for events and errors. |

---

## 10. Assets

*   **Fonts:** Outfit, DM Sans (via Google Fonts).
*   **Music:** `music.mp3` (Ambient Synth).
*   **Models:** None. All 3D geometry is procedurally generated using Three.js primitives (Box, Cylinder, Sphere).
*   **Icons:** Unicode Emojis (🛣️, 🏠, ☢️, etc.) used for visual consistency without texture overhead.

---

## 11. Dependencies & Libraries

*   **Three.js (r128):** Core 3D engine.
*   **Native Web Audio API:** Procedural SFX.
*   **Intl.NumberFormat:** Localization for currency (Euro) and numbers.

---

## 12. Known Bugs & Issues

### Critical
*   *None known.*

### Medium
*   **Save Corruption Risk:** If `localStorage` is cleared or exceeds quota (unlikely given city size), saves will be lost.
*   **Z-Fighting:** Rare flickering on road intersections if tiles overlap perfectly (minimized by `0.05` offsets).

### Minor
*   **Car Pathing:** Cars occasionally "jump" if a road tile they are on is demolished mid-transit.

---

## 13. Technical Debt

*   **The Monolith:** `game.js` is >2000 lines. Ideally, this should be split into `Simulation.js`, `Renderer.js`, and `UI.js`.
*   **Procedural Geometry:** Geometry is created on the fly during placement. For very large grids (>64x64), this should move to a cached instancing system.
*   **Direct DOM Manipulation:** The game uses `document.getElementById` extensively. A small reactive wrapper or framework (like Preact) would clean this up.

---

## 14. Performance Notes

*   **GPU Bound:** The game uses `PCFSoftShadowMap` and `ACESFilmicToneMapping`. While beautiful, integrated GPUs may struggle at 4K.
*   **Memory:** Procedural groups are cleared correctly during demolition, but long sessions without reloads should be monitored for Three.js object leakage.

---

## 15. Unfinished / Partial Features

*   **NPC Walkers:** Code for cars exists, but pedestrians (walking on sidewalks/parks) were planned but not implemented.
*   **Natural Disasters:** Fires and Storms are currently "Toasts" only; they don't visually damage the 3D grid yet.

---

## 16. Roadmap / Suggested Next Steps

1.  **Refactor Modules:** Split `game.js` into logical files.
2.  **Visual Polish:** Add weather effects (Rain/Snow particles) that sync with the Random Events system.
3.  **Expansion:** Larger grid sizes (64x64 or 128x128) with a Mini-map.
4.  **Advanced AI:** Implementation of "Workplace" vs "Home" pathfinding for citizens.

---

## 17. Code Style & Rules

*   **Vanilla JS:** Keep the project dependency-free (except Three.js). Do not introduce React/Vue unless a full rewrite is planned.
*   **State Integrity:** Never modify `state.grid` directly without calling `recalc()` and `hudUpdate()`.
*   **Aesthetics:** Maintain the "Glassmorphism" UI style. Avoid opaque, flat colors.

---

## 18. Deployment

1.  **Local Development:** Run via any local server (e.g., `npx serve .`).
2.  **Production:** Upload the `build/` directory to Netlify, Vercel, or GitHub Pages.
3.  **Config:** `netlify.toml` is provided for basic SPAs.

---

## 19. Critical Knowledge Transfer

*   **The "Menu Background" Secret:** The main menu background is actually a live instance of the game running in `isBackgroundMode`. It suppresses the HUD and uses a wide-angle rotating camera. You can change which city is shown in the Menu Settings.
*   **Road Logic:** Roads aren't just meshes; they are "Graphs". Demolishing a road breaks car pathfinding instantly; the `try/catch` in the render loop prevents crashes during these frames.
*   **Shadow Bias:** The `sun.shadow.bias = -0.0004` is finely tuned to prevent "shadow acne" on the flat ground grid. Do not change it casually.

---
**Handover Generated by Antigravity AI**
*Date: May 11, 2026*
