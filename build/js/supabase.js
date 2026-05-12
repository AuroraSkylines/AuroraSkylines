// =====================================================
//  Aurora Skylines — Supabase Integration
// =====================================================
'use strict';

// IMPORTANT: Replace these with your actual Supabase URL and Anon Key before deployment
const SUPABASE_URL = 'https://sgiyocgutsglftcuuwng.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXlvY2d1dHNnbGZ0Y3V1d25nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjkyNDIsImV4cCI6MjA5NDEwNTI0Mn0.nvP2XXA72dz-Dt0EjXi94jM1Fl_4cIDFanKrhArLeTk';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const syntheticEmailSuffix = '@auroracity.com';

function getSyntheticEmail(username) {
  return username.trim().toLowerCase() + syntheticEmailSuffix;
}

const db = {
  session: null,
  cloudSaveTimestamp: 0,
  
  async init() {
    const { data: { session }, error } = await sb.auth.getSession();
    if (error) console.error('Auth session error:', error);
    this.session = session;
    
    sb.auth.onAuthStateChange((_event, session) => {
      this.session = session;
    });
    
    return session;
  },
  
  async register(username, password, inviteKey) {
    if (!username || !password || !inviteKey) {
      throw new Error('All fields are required');
    }
    const email = getSyntheticEmail(username);
    
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          invite_key: inviteKey
        }
      }
    });
    
    if (error) {
      // Clean up error message for user
      let msg = error.message;
      if (msg.includes('Database error saving new user')) {
         msg = 'Invalid or already used invite key.';
      }
      throw new Error(msg);
    }
    return data;
  },
  
  async login(username, password) {
    if (!username || !password) throw new Error('Username and password are required');
    const email = getSyntheticEmail(username);
    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },
  
  async logout() {
    await sb.auth.signOut();
    this.session = null;
    location.reload();
  },
  
  async loadCloudSave(slotId = 1) {
    if (!this.session) return null;
    const { data, error } = await sb
      .from('game_saves')
      .select('save_data, updated_at')
      .eq('user_id', this.session.user.id)
      .eq('slot_id', slotId)
      .maybeSingle();
      
    if (error) {
      console.error('Error loading cloud save:', error);
      return null;
    }
    
    if (data) {
      this.cloudSaveTimestamp = new Date(data.updated_at).getTime();
      return data.save_data;
    }
    return null;
  },
  
  async syncCloudSave(payload, slotId = 1) {
    if (!this.session) return;
    
    const { data: currentData, error: fetchError } = await sb
      .from('game_saves')
      .select('updated_at')
      .eq('user_id', this.session.user.id)
      .eq('slot_id', slotId)
      .maybeSingle();
      
    if (fetchError) {
      console.error('Error checking cloud save state:', fetchError);
      return;
    }
    
    // Conflict handling: last-write-wins protection
    if (currentData) {
      const serverTime = new Date(currentData.updated_at).getTime();
      if (serverTime > this.cloudSaveTimestamp + 2000) {
        console.warn('Conflict detected: Server has a newer save. Skipping local push to avoid overwriting.');
        return;
      }
    }
    
    const { data, error } = await sb
      .from('game_saves')
      .upsert({
        user_id: this.session.user.id,
        slot_id: slotId,
        save_data: payload,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,slot_id' })
      .select('updated_at')
      .single();
      
    if (error) {
      console.error('Error syncing to cloud:', error);
    } else if (data) {
      this.cloudSaveTimestamp = new Date(data.updated_at).getTime();
    }
  }
};

window.db = db;
console.log("Aurora Skylines: Database system initialized.", window.db);
