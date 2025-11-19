// server/supabase/client.js
// Supabase client for server-side operations

import { createClient } from '@supabase/supabase-js';

// Lazy initialization - only create clients when accessed
let _supabase = null;
let _supabaseAnon = null;

function getSupabase() {
  if (!_supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('⚠️  Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    }

    _supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return _supabase;
}

function getSupabaseAnon() {
  if (!_supabaseAnon) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('⚠️  Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
    }

    _supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false
      }
    });
  }
  return _supabaseAnon;
}

// Export getters that create clients lazily
export const supabase = new Proxy({}, {
  get(target, prop) {
    return getSupabase()[prop];
  }
});

export const supabaseAnon = new Proxy({}, {
  get(target, prop) {
    return getSupabaseAnon()[prop];
  }
});

export default supabase;

