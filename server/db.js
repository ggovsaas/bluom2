// server/db.js
// Database connection - supports both Supabase and legacy Neon/Postgres
// During migration: Use Supabase for new features, legacy pool for existing code

import pg from 'pg';
import { supabase } from './supabase/client.js';

const { Pool } = pg;

// Legacy Neon/Postgres connection (for backward compatibility during migration)
let pool = null;

if (process.env.DATABASE_URL && !process.env.SUPABASE_URL) {
  // Only create legacy pool if DATABASE_URL exists and Supabase is not configured
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  pool.on('connect', () => {
    console.log('✅ Legacy database connected (Neon/Postgres)');
  });

  pool.on('error', (err) => {
    console.error('❌ Legacy database connection error:', err);
  });
}

// Export Supabase as primary database client
export { supabase };

// Export legacy pool for backward compatibility (will be removed after full migration)
export { pool };

// Default export: prefer Supabase, fallback to legacy pool
export default process.env.SUPABASE_URL ? supabase : pool;


