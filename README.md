# Aurora Skylines - Private Alpha Setup

This repository contains the source code for the Aurora Skylines city builder, now featuring a fully integrated private alpha access system and cloud saves powered by Supabase.

## Supabase Backend Setup

To enable authentication and cloud saves, you need to configure a Supabase backend.

1. **Create a Supabase Project:**
   - Go to [Supabase](https://supabase.com) and create a new project.
2. **Run the Database Schema:**
   - Open the **SQL Editor** in your Supabase dashboard.
   - Copy the contents of `supabase_schema.sql` (found in this repository) and paste it into the editor.
   - Click **Run** to execute the script. This will create the `invite_keys` and `game_saves` tables, configure security policies, and seed 5 invite keys.
3. **Get Your API Credentials:**
   - Go to **Project Settings > API**.
   - Note down the **Project URL** and the **anon / public key**.

## Frontend Setup & Deployment (Netlify)

This project is deployed as a static site and can be hosted freely on Netlify.

1. **Push your code to GitHub/GitLab:**
   Ensure all files (especially `index.html`, `js/supabase.js`, and `js/authUi.js`) are pushed to your repository.
2. **Create a Netlify Site:**
   - Connect Netlify to your repository and create a new site.
   - Set the Publish directory to `build/`.
3. **Configure Environment Variables in Netlify:**
   - In Netlify, go to **Site configuration > Environment variables**.
   - Add the following variables using the credentials from Supabase:
     - `VITE_SUPABASE_URL` = (Your Supabase Project URL)
     - `VITE_SUPABASE_ANON_KEY` = (Your Supabase anon key)
   *(Note: Since this is currently a vanilla HTML/JS setup without a bundler, the frontend actually loads these from a `config.js` file or hardcoded placeholders. Please open `build/js/supabase.js` and manually inject the `SUPABASE_URL` and `SUPABASE_KEY` constants before deploying, or set up a basic bundler like Vite if you wish to use true `.env` variables).*

## Alpha Invite Keys

By default, the SQL script generates 5 invite keys. You can see them in your Supabase `invite_keys` table. 
Users will need one of these keys to successfully register.
- CHILL-ALPHA-0001
- CHILL-ALPHA-0002
- COZY-TOWN-0003
- COZY-TOWN-0004
- AURORA-TEST-0005

## Save System Behavior

- **Auto-Load:** When a user logs in, the game queries the `game_saves` table. If a save exists, it is loaded automatically.
- **Auto-Save:** The game automatically syncs the city state to the cloud every 60 seconds and when crucial actions occur (like returning to the main menu).
