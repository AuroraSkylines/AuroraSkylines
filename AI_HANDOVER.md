# 🤖 Aurora Skylines: Technical Handover for AI Development

This document provides the necessary context for an AI assistant to continue development on the Aurora Skylines engine.

## 🏗 Core Architecture
- **Engine:** Three.js (WebGL).
- **State Management:** A global `state` object in `js/state.js` tracks all city data.
- **Modularity:** Logic is split into `core.js` (rendering), `audio.js` (sound), `supabase.js` (db), `saveManager.js` (slots), and `authUi.js` (initialization).

## 💾 Save & State Logic
- **6 Cloud Slots:** The database uses a `game_saves` table with `user_id` and `slot_id`.
- **Hard Resets:** `seedStartingCity()` in `core.js` must be called for New Games to wipe background menu state.
- **Auto-Save:** A 60-second interval in `saveManager.js` syncs the `active-slot` to Supabase.
- **Menu Backgrounds:** `loadMenuBackgroundCity()` fetches cloud data for the selected background slot.

## 🔊 Audio System
- **Unified Sync:** Both the Main Menu Settings and In-Game Pause Menu control a single `<audio id="bgMusic">` element.
- **Wiring:** Event listeners are attached in `authUi.js` after authentication to ensure DOM readiness.

## 🔐 Authentication
- **Invite Gating:** New accounts require a key from the `invite_keys` table.
- **Synthetic Identity:** Usernames are mapped to `@auroracity.com` internal emails.

## 🚀 Deployment (Cloudflare Pages)
- **Limit:** 25MB per file. 
- **Build:** No build command; serves the `/build` directory directly.

## 🛠 Next Steps
1. **Optimization:** Implement object pooling for large cities.
2. **Security:** Hard-code the invite key trigger in Supabase if moving out of Private Alpha.
3. **UI/UX:** Add hover tooltips for building stats.

---
*Handover completed on 2026-05-12.*
