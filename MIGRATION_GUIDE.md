# 🗄️ Database Migration Guide - Run Migrations in Order

## ⚠️ IMPORTANT: You Must Run ALL Migrations in Order!

The database is empty. You need to run migrations **001 through 011** in sequence.

---

## 📋 Migration Order Checklist

Run these in **Supabase Dashboard → SQL Editor** one at a time:

### ✅ Step 1: Run Migration 001 - Personalization
**File:** `server/migrations/001_personalization.sql`

Creates:
- `user_preferences` table (personalization settings)

---

### ✅ Step 2: Run Migration 002 - Core Users & Profiles
**File:** `server/migrations/002_core_users_profiles.sql`

Creates:
- `profiles` table (Stripe integration)
- `user_data` table (fitness data)
- RLS policies

---

### ✅ Step 3: Run Migration 003 - Onboarding & Personalization
**File:** `server/migrations/003_onboarding_personalization.sql`

Creates:
- `user_goals` table
- `user_preferences` enhancements
- Onboarding flow tables

---

### ✅ Step 4: Run Migration 004 - Fuel & Nutrition
**File:** `server/migrations/004_fuel_nutrition.sql`

Creates:
- `foods` table
- `recipes` table
- `meal_logs` table
- `water_logs` table
- Food tracking system

---

### ✅ Step 5: Run Migration 005 - Move & Workouts
**File:** `server/migrations/005_move_workouts.sql`

Creates:
- `workouts` table
- `workout_logs` table
- `exercises` table
- Workout tracking system

---

### ✅ Step 6: Run Migration 006 - Wellness & Mindfulness
**File:** `server/migrations/006_wellness_mindfulness.sql`

Creates:
- `meditation_sessions` table
- `wellness_logs` table
- `mindfulness_worlds` table
- Meditation tracking

---

### ✅ Step 7: Run Migration 007 - Streaks, Gamification & Notifications
**File:** `server/migrations/007_streaks_gamification_notifications.sql`

Creates:
- `streaks` table
- `achievements` table
- `user_achievements` table
- `mind_tokens` table
- `notifications` table
- `push_tokens` table
- Gamification system

---

### ✅ Step 8: Run Migration 008 - RPC Functions Core
**File:** `server/migrations/008_rpc_functions_core.sql`

Creates:
- Database functions for calculations
- Helper RPC functions
- Aggregation utilities

---

### ✅ Step 9: Run Migration 009 - Enable Realtime & Storage
**File:** `server/migrations/009_enable_realtime_storage.sql`

Creates:
- Realtime subscriptions
- Storage buckets
- Storage policies

---

### ✅ Step 10: Run Migration 010 - Fix Missing Columns
**File:** `server/migrations/010_fix_missing_columns.sql`

Creates:
- Fixes any missing columns from previous migrations
- Data consistency patches

---

### ✅ Step 11: Run Migration 011 - Food Recognition Logs ⭐ (FIXED!)
**File:** `server/migrations/011_food_recognition_logs.sql`

Creates:
- `food_recognition_logs` table (AI photo recognition logs)
- `food_items_multilang` table (6 languages: EN, PT, ES, NL, DE, FR)
- `user_food_photos` table (saved food photos with nutrition)
- 60 pre-seeded food translations
- Helper function: `get_translated_food_name()`

**✅ THIS MIGRATION HAS BEEN FIXED!**
- Removed the non-existent `is_admin` column reference
- Now 100% safe to run after migrations 001-010

---

## 🚀 Quick Run Instructions

### Option A: Run All at Once (Recommended for Empty Database)

1. Go to **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Click **"New query"**
4. Copy and paste the contents of **ALL** migrations in order (001 → 011)
5. Click **"Run"**

### Option B: Run One at a Time (Safer, More Control)

1. Go to **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. For each migration (001 → 011):
   - Click **"New query"**
   - Copy the entire contents of the migration file
   - Paste into the editor
   - Click **"Run"**
   - Verify success before moving to the next one

---

## ✅ Expected Results After Each Migration

### After Migration 002:
```sql
SELECT * FROM profiles LIMIT 1;
-- Should return: id, stripe_customer_id, subscription_status, subscription_tier, created_at
```

### After Migration 004:
```sql
SELECT COUNT(*) FROM foods;
-- Should return a number (seeded foods)
```

### After Migration 007:
```sql
SELECT COUNT(*) FROM achievements;
-- Should return achievement count
```

### After Migration 011:
```sql
SELECT COUNT(*) FROM food_items_multilang;
-- Should return: 60 (10 foods × 6 languages)

SELECT * FROM food_items_multilang WHERE canonical_name = 'Apple';
-- Should show: Apple in 6 languages (en, pt, es, nl, de, fr)
```

---

## 🐛 Troubleshooting

### Error: "relation already exists"
**Solution:** This is OK! The migration uses `IF NOT EXISTS`, so it will skip existing tables.

### Error: "column does not exist"
**Solution:** You skipped a migration. Go back and run them in order (001 → 011).

### Error: "duplicate key value violates unique constraint"
**Solution:** This migration was already run. Safe to skip.

### Error: "permission denied"
**Solution:** Make sure you're using the Supabase Dashboard SQL Editor, not a direct psql connection.

---

## 📊 Verify All Migrations Completed

Run this query to see all your tables:

```sql
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**You should see at least these tables:**
- achievements
- exercises
- food_items_multilang ⭐ (NEW!)
- food_recognition_logs ⭐ (NEW!)
- foods
- meal_logs
- meditation_sessions
- mind_tokens
- notifications
- profiles
- push_tokens
- recipes
- streaks
- user_achievements
- user_data
- user_food_photos ⭐ (NEW!)
- user_goals
- user_preferences
- water_logs
- wellness_logs
- workout_logs
- workouts

**Total: ~23 tables**

---

## 🎯 After All Migrations Complete

1. **Configure Supabase Secrets** (see START_HERE.md)
   - CLARIFAI_PAT
   - OPENAI_API_KEY
   - FATSECRET_CLIENT_ID
   - FATSECRET_CLIENT_SECRET
   - USDA_API_KEY

2. **Test Photo Recognition**
   - Open app → Fuel page
   - Click Camera icon
   - Take photo of food
   - Watch the magic! ✨

---

## 📞 Need Help?

### Check Migration Status:
```sql
-- See all tables
\dt

-- Check specific table
\d food_recognition_logs
```

### Reset Everything (DANGER - DELETES ALL DATA):
```sql
-- DO NOT RUN THIS UNLESS YOU WANT TO START OVER
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

---

## ✅ Migration 011 Fix Summary

**What was wrong:**
- Referenced `profiles.is_admin` column that doesn't exist

**What was fixed:**
- Removed admin policy
- Food translations are now read-only for all users
- Only service role can modify (via Supabase Dashboard or backend)

**Status:** ✅ Safe to run!

---

**Ready to proceed?** Run migrations 001-011 in order, then configure your Supabase secrets!
