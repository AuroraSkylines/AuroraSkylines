# 🌆 Aurora Skylines — Full Technical Handover Document

This document provides an exhaustive technical overview of **Aurora Skylines**, a premium, grid-based city builder developed with vanilla JavaScript and Three.js. It is designed to allow any developer or AI to assume control of the project with full context.

---

## 1. Project Summary

*   **Project Name:** Aurora Skylines
*   **Genre:** Casual City Builder / Management Simulation
*   **Core Gameplay Loop:** Connect the grid with roads → Zone residential, commercial, and industrial areas → Manage energy output vs. demand → Invest in city-wide upgrades → Grow population and maintain budget stability.
*   **Main Objective:** Strategically expand the city to maximize population while maintaining a healthy financial surplus and 100% energy coverage.
*   **Platform:** Web (Cross-browser compatible, responsive canvas).
*   **Current Development Stage:** **Beta (Feature Complete Core)**. All systems for simulation, rendering, saving, and cloud integration are implemented and stabilized.

---

## 2. Full Feature List

| Feature System | Status | Description |
| :--- | :--- | :--- |
| **Grid System** | Complete | 32x32 tile world with coordinate-keyed state (`"x,z"`). |
| **Building Placement** | Complete | Real-time placement with road-proximity validation and budget checking. |
| **Demolition** | Complete | Removal of any tile with partial building refund and 100% road refund. |
| **Day/Night Cycle** | Complete | 15-minute (900s) cycle with dynamic sky lerping, sun/moon orbits, and window/lamp glow. |
| **Glassmorphism HUD** | Complete | Translucent, blurred UI for real-time stats (Gold, Pop, Energy, Day). |
| **Build Menu** | Complete | Multi-category folder system (Roads, Zones, Services, Tools) with tooltips. |
| **Upgrades Shop** | Complete | 6 unique tiers (Efficient Paving, Transit AI, etc.) with cumulative effects. |
| **Cloud Save (Supabase)** | Complete | 6-slot cloud architecture with user authentication and conflict protection. |
| **Local Save** | Complete | `localStorage` fallback and "Auto-Resume" functionality. |
| **Procedural SFX** | Complete | `AudioContext` generated sounds for placement, demolition, and UI errors. |
| **Dynamic BGM** | Complete | Looping ambient synth track with persistence and volume controls. |
| **Orthographic Camera** | Complete | Isometric feel with WASD panning, mouse drag-to-pan, and smooth scroll-zoom. |
| **NPC Traffic AI** | Complete | BFS-based pathfinding for cars that navigate road networks in real-time. |
| **VFX & Particles** | Complete | Procedural fireflies, starfield, and building "pop-in" animations. |
| **Background Mode** | Complete | Main menu runs a live city background with a cinematic rotating camera. |
| **Mobile Support** | Partial | Panning and zooming work via touch (simulated mouse), but HUD scaling is optimized for desktop/tablet. |

---

## 3. Project File Structure

The project has been modularized for maintainability while remaining a vanilla JavaScript implementation.

### Core Files (Root)
*   `index.html`: Entry point. Defines UI structure, loads Three.js, and initializes the boot sequence.
*   `style.css`: Main design system. Implements the "Aurora" glassmorphism aesthetic and animations.
*   `auth.css`: Specialized styling for the Supabase login/register screens.

### JavaScript Modules (`/build/js/`)
1.  `state.js`: The **Source of Truth**. Defines the global `state` object, current selection, and simulation timers.
2.  `constants.js`: Data definitions for buildings (`BDATA`), upgrades (`UPGRADE_DEFS`), and grid dimensions.
3.  `core.js`: **Engine Heart**. Manages the main game loop (`animate`), simulation logic (`tickDay`), and placement validation.
4.  `renderer.js`: Three.js setup. Handles lighting, sky phases, fog, and the `OrthographicCamera`.
5.  `world.js`: World generation. Procedurally builds the ground grid, water ring, starfield, and fireflies.
6.  `buildings.js`: Factory functions for every building mesh. Includes randomized variants for houses and apartments.
7.  `roads.js`: Complex road mesh builder. Automatically detects neighbors to create corners, T-junctions, and cross-roads.
8.  `traffic.js`: Pathfinding and car simulation. Uses Breadth-First Search (BFS) to find routes.
9.  `ui.js`: HUD updates, menu toggles, upgrade shop interaction, and toast notifications.
10. `input.js`: Keyboard (WASD) and Mouse (Drag/Wheel) handling. Translates screen clicks to grid coordinates.
11. `saveManager.js`: Slot-based saving logic. Serializes city data and handles local/cloud persistence.
12. `supabase.js`: Integration with Supabase Auth and Database. Handles cloud sync conflict resolution.
13. `authUi.js`: UI logic for the login/register screens.
14. `audio.js`: `AudioContext` SFX generation and music volume/loop management.
15. `gfx.js`: Graphics quality settings (Shadows, Particles, Distance).
16. `utils.js`: Shared helper functions (Currency formatting, coordinate math, seeded randoms).

---

## 4. Architecture Overview

Aurora Skylines follows a **State-Driven Modular Architecture**.

1.  **Boot Phase:** `index.html` loads scripts in order. `init()` in `core.js` is called.
2.  **State Initialization:** `state.js` creates the global `state`. If `loadSave` is true, `saveManager.js` fetches data and populates `state.grid`.
3.  **Simulation Loop (`tickDay`):** Runs every frame. Streams income based on population and modifiers. Every 900s, the "Day" counter increments.
4.  **Render Loop (`animate`):**
    *   Updates camera position with smoothing (lerp).
    *   Updates sky color and light intensities based on `dayTimer`.
    *   Animates NPC cars and rotors (wind turbines).
    *   Renders the Three.js scene.
5.  **Event Flow:** User click → `input.js` → `core.js` (place/demo) → `ui.js` (refresh HUD).

---

## 5. Game Systems Breakdown

### Grid & Building System
*   **Logic:** Uses a `Map`-like object `state.grid` where keys are `"x,z"` strings. This allows O(1) lookup for any tile.
*   **Validation:** Buildings (except roads) require a "Road Neighbor" (`hasRoadNeighbour()`).
*   **Facing:** Buildings automatically rotate to face the nearest road using `getRoadFacingAngle()`.

### Economy & Resource System
*   **Income:** Calculated in `incomeForCell()`.
*   **Modifiers:** 
    *   **Energy Deficit:** If `energy < 0`, income is penalized by 40%.
    *   **Happiness:** Multipliers range from 0.55x (Angry) to 1.25x (Happy).
*   **Upgrades:** `Commerce Hub` and `Green City` add flat per-payout bonuses to shops and parks.

### NPC Traffic System
*   **Pathfinding:** When a car spawns, it picks two random roads and runs a **BFS** through the road network.
*   **Movement:** Cars follow the path segments, interpolating position and rotating to face the movement vector.
*   **Lane Logic:** Cars are offset by `0.3` units from the center of the road to simulate driving on the right.

### Day/Night System
*   **Sky Arc:** Cycles through 6 phases: Night → Dawn → Sunrise → Day → Dusk → Evening.
*   **Lights:** The `sun` (Directional) orbits the city. At night, `moonLight` takes over.
*   **Emissive Shift:** Windows on buildings and street lamps have `emissiveIntensity` that increases as the sky darkens.

---

## 6. State & Data Models

### Main State Object
```javascript
const state = {
  gold: 2000,
  pop: 0,
  energy: 0,
  happiness: 75,
  grid: { "16,16": { type: "road" }, ... },
  upgradeLevels: { "transit_ai": 2, ... },
  day: 1,
  dayTimer: 450.5, // 0 to 900
};
```

### Building Data (`BDATA`)
```javascript
house: { 
  icon: '🏠', 
  name: 'House', 
  cost: 50, 
  pop: 4, 
  energy: -1, 
  income: 5, 
  desc: 'Homes for citizens.' 
}
```

---

## 7. Save/Load System

*   **Logic:** `saveManager.js` handles serialization.
*   **Cloud Sync:** `supabase.js` uses `db.syncCloudSave()` to push JSON to the `game_saves` table.
*   **Conflict Handling:** Uses `updated_at` timestamps. If the server has a version >5s newer than the local "known" time, it warns of a conflict to prevent accidental overwrites.
*   **Slots:** 6 dedicated slots. Slot 1 is the default "Legacy" slot.

---

## 8. UI/UX Documentation

*   **HUD:** Defined in `index.html` (#top-bar). Updated by `ui.js`.
*   **Build Menu:** Category-based (#build-menu). Uses `cat-btn` to switch between `build-folder` divs.
*   **Modals:** Custom implementations for "Confirm" and "Save Manager" to avoid browser-native popups.
*   **Toasts:** Two layers: `#toast` (system info) and `#event-toast` (gameplay events).

---

## 9. Assets & Dependencies

*   **Libraries:** 
    *   **Three.js (r128):** Core 3D engine.
    *   **Supabase JS SDK:** Auth and Database.
*   **Assets:**
    *   `music.mp3`: Ambient synth loop.
    *   `aurora_skylines_bg.png`: Menu fallback image.
    *   **Fonts:** Outfit & DM Sans (Google Fonts).
*   **Models:** **Zero external models.** Every 3D object is procedurally generated from primitives in `buildings.js` and `roads.js`.

---

## 10. Known Bugs & Issues

### Critical
*   **Supabase Schema Mismatch:** The `supabase_schema.sql` file in the repo may miss the `slot_id` column. Ensure the database table `game_saves` has `(user_id, slot_id)` as a unique composite key.

### Medium
*   **Z-Fighting:** On some GPUs, road markings may flicker if the `mY` offset (0.152) is too close to the asphalt top.
*   **Car Pathing:** If a road is demolished while a car is on it, the car may "jump" to its destination or disappear abruptly.

### Minor
*   **Shadow Acne:** In extreme sunset/sunrise angles, shadows might show striping. Managed by `sun.shadow.bias`.

---

## 11. Technical Debt

1.  **Global Namespace:** Most variables are on the `window` object for simplicity. Future-proofing would involve a full ES Module refactor with a build tool (Vite/Webpack).
2.  **Direct DOM Manipulation:** Uses `document.getElementById` everywhere. A reactive framework (like Preact) would reduce the verbosity of `ui.js`.
3.  **Car BFS:** The BFS runs on every car spawn. For very large road networks (>200 tiles), this should be cached in a graph structure.

---

## 12. Roadmap & Suggested Next Steps

1.  **NPC Citizens:** Implement walking NPCs on sidewalks (similar logic to cars).
2.  **Weather Visuals:** Add a particle-based Rain/Snow system that syncs with the "Bad Weather" random event.
3.  **District Tools:** Selection tool to name different areas of the city.
4.  **Audio Polish:** Add unique spatial SFX for clicking specific buildings (e.g., wind turbine hum).

---

## 13. Code Rules & Conventions

*   **Maintain the Aesthetic:** Always use the `_box` and `_cyl` helpers in `buildings.js` to ensure visual consistency (flat shading, specific shininess).
*   **Don't Break Saves:** Adding new state variables is fine, but **never** change the structure of `state.grid` or the `SAVE_KEY`.
*   **Vanilla First:** Avoid adding new heavy libraries. Aurora Skylines is built on the philosophy of being lightweight and fast.

---

## 14. Deployment

1.  **Local:** Open `index.html` using a local server (VS Code Live Server or `npx serve build`).
2.  **Production:** The `build/` folder is ready for static hosting (Netlify, Vercel, etc.).
3.  **Supabase:** Ensure your `SUPABASE_URL` and `SUPABASE_KEY` in `js/supabase.js` are valid and the SQL schema is applied.
