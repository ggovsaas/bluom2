// server/supabase/adminClient.js
// Supabase admin client with service role key for admin operations
// This bypasses RLS policies - use only for admin/server operations

import { createClient } from '@supabase/supabase-js';

// Lazy initialization - only create client when accessed
let _supabaseAdmin = null;

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('⚠️  Supabase admin credentials not found. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    }

    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return _supabaseAdmin;
}

// Export getter that creates client lazily
export const supabaseAdmin = new Proxy({}, {
  get(target, prop) {
    return getSupabaseAdmin()[prop];
  }
});

export default supabaseAdmin;


