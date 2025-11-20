# BloomYou Database Setup Checklist

## ✅ Completed Steps

### 1. Database Migrations
- [x] 002_core_users_profiles.sql ✓
- [x] 003_onboarding_personalization.sql ✓
- [x] 004_fuel_nutrition.sql ✓
- [x] 005_move_workouts.sql ✓
- [x] 006_wellness_mindfulness.sql ✓
- [x] 007_streaks_gamification_notifications.sql ✓

**Result:** 70+ tables created with full RLS policies

### 2. RLS (Row Level Security)
- [x] Enabled on ALL user tables ✓
- [x] Policies created for SELECT/INSERT/UPDATE/DELETE ✓
- [x] Uses `auth.uid()` for user validation ✓

---

## 🔴 REQUIRED: Manual Setup in Supabase Dashboard

### 3. RPC Functions - **PASTE THIS NOW**

**Location:** Supabase Dashboard → SQL Editor

**File:** `/server/migrations/008_rpc_functions_core.sql`

**What it creates:**
- ✓ Streak tracking functions
- ✓ XP and token reward functions
- ✓ Daily macro calculation
- ✓ Notification system
- ✓ Meditation session completion

**Action:** Copy entire file and paste into SQL Editor → Run

---

### 4. Realtime - **ENABLE THESE TABLES**

**Location:** Supabase Dashboard → Database → Replication

**Enable Realtime for:**
```
☐ notifications
☐ streaks
☐ user_streaks
☐ workout_logs
☐ meal_logs
☐ meditation_sessions_ac
☐ ai_recommendations
```

**Why:** Live updates in the app (notifications, streak updates, etc.)

---

### 5. Storage Buckets - **CREATE THESE**

**Location:** Supabase Dashboard → Storage

#### Bucket: `avatars`
- **Public:** No
- **File size limit:** 5MB
- **Allowed MIME types:** `image/jpeg, image/png, image/webp`

**RLS Policy:**
```sql
-- Users can upload their own avatar
CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can read their own avatar
CREATE POLICY "Users read own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Bucket: `recipe-images`
- **Public:** No
- **File size limit:** 10MB
- **Allowed MIME types:** `image/jpeg, image/png, image/webp`

**RLS Policy:**
```sql
-- Users can upload recipe images
CREATE POLICY "Users upload recipe images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recipe-images');

-- Everyone can read recipe images
CREATE POLICY "Anyone read recipe images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'recipe-images');
```

#### Bucket: `workout-videos` (Optional)
- **Public:** No
- **File size limit:** 50MB
- **Allowed MIME types:** `video/mp4, video/quicktime`

---

## 📋 Verification Checklist

After completing the manual steps above, verify:

### Database Tables
```sql
-- Run in SQL Editor to verify all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```
**Expected:** ~70 tables

### RPC Functions
```sql
-- Verify functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```
**Expected:** At least 15+ functions

### RLS Policies
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
**Expected:** All user tables show `rowsecurity = true`

### Storage Buckets
**Go to:** Storage → Verify buckets exist with policies

---

## 🚀 Environment Variables

Already configured in `.env`:
```
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## 📝 Notes

### Why No Migration 001?
Migration 001 only adds columns to `users` table. Migration 002 already creates the complete `users` table with all those columns, so 001 is redundant.

### Data Safety
All migrations use `DROP TABLE IF EXISTS` - this is for development. In production:
1. Remove all DROP statements
2. Use `CREATE TABLE IF NOT EXISTS`
3. Always backup before migrations

### Next Steps After Setup
1. Test user registration/login
2. Verify streak tracking works
3. Test meal logging
4. Test workout logging
5. Verify notifications appear
6. Test file uploads (avatars, recipe images)

---

## 🆘 Troubleshooting

### "Function does not exist"
→ Run migration 008_rpc_functions_core.sql

### "Permission denied for table"
→ Check RLS policies are created

### "Bucket not found"
→ Create storage buckets manually

### Realtime not working
→ Enable replication for tables in Dashboard

---

## ✅ Setup Complete When:
- [ ] All 6 migrations executed (002-007)
- [ ] RPC functions created (008)
- [ ] Realtime enabled for 7 tables
- [ ] Storage buckets created with policies
- [ ] Test user can login and create data
