# Bolt Integration Instructions

## 🎯 Purpose

This document provides **ONLY** the connection instructions for Bolt. All database schema and migrations are already prepared in Cursor.

## ✅ What Bolt Needs to Do

**ONLY add these environment variables to your `.env` file:**

```env
SUPABASE_URL=https://pthmddtyxdragzbtjeuu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0aG1kZHR5eGRyYWd6YnRqZXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMDY1MjMsImV4cCI6MjA3ODc4MjUyM30.R0WHKlyrgF63n469hjL5ShjlwW9WtkKr5cBEGT1WDEs
SUPABASE_SERVICE_ROLE_KEY=<get-from-supabase-dashboard>
```

**That's it. Do NOT:**
- ❌ Create tables
- ❌ Run migrations
- ❌ Modify code
- ❌ Change database structure

## 📁 Project Structure

- `supabase/migrations/` - All SQL migrations (ready to run in Supabase SQL Editor)
- `server/supabase/client.js` - Server-side Supabase client (already created)
- `src/lib/supabase.ts` - Frontend Supabase client (already created)
- `AiFitnessExpo/src/lib/supabase.ts` - React Native Supabase client (already created)

## 🔧 Where to Get Service Role Key

1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Copy the "service_role" key (keep it secret!)

## ✅ Verification

After adding the environment variables, the app should be able to connect to Supabase. All migrations will be run manually in the Supabase SQL Editor.

## 🌐 Web & Mobile

**Important:** All schema modules (A-X) are applied to the **SAME Supabase database**, which means they are **automatically available to both web and mobile** applications.

- **Web Client**: `src/lib/supabase.ts` (uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)
- **Mobile Client**: `AiFitnessExpo/src/lib/supabase.ts` (uses `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
- **Both connect to the same database** - all tables, RPC functions, and RLS policies are shared

See `SCHEMA_WEB_MOBILE.md` for detailed documentation.

