# 🎯 ENHANCED CURSOR REPAIR PROMPT

Copy and paste this entire prompt into Cursor:

---

You are now the full-stack repair agent for the AiFitnessApp.

Your job is to fix ALL broken functionality, unify the codebase, and make the app fully functional.

## 🔥 CRITICAL: REPLACE ALL AXIOS CALLS

**Replace all Axios API calls with Supabase client calls, because the Express backend no longer exists. Every request must use the Supabase client (web + mobile).**

### Examples:

**❌ OLD (Axios):**
```ts
axios.get('/api/foods')
axios.post('/api/log-meal', data)
axios.get('/api/exercises/search')
```

**✅ NEW (Supabase):**
```ts
supabase.rpc("search_foods", { query })
supabase.from("meal_logs").insert(data)
supabase.from("exercise_library").select("*").ilike("name", `%${query}%`)
```

### All endpoints to replace:
- `/api/foods` → `supabase.from("foods").select()` or `supabase.rpc("search_foods")`
- `/api/recipes` → `supabase.from("recipes").select()` or `supabase.rpc("search_recipes")`
- `/api/exercises` → `supabase.from("exercise_library").select()` or `supabase.rpc("search_exercises")`
- `/api/log-meal` → `supabase.from("meal_logs").insert()`
- `/api/log-workout` → `supabase.from("workout_logs").insert()`
- `/api/gratitude` → `supabase.from("gratitude_logs").select()`
- `/api/sleep` → `supabase.from("sleep_logs").select()`
- `/api/journal` → `supabase.from("journal_entries").select()`
- `/api/habits` → `supabase.from("habit_logs").select()`

---

## FOCUS AREAS:

### 1. Fix ALL 404 API calls:
   - search foods
   - search recipes
   - search exercises
   - log food
   - log workout
   - fetch gratitude
   - fetch sleep
   - fetch journal
   - fetch habits

### 2. Replace all dead Express routes with Supabase RPCs.

### 3. Verify the app uses the SUPABASE client in all data operations:
   - Web: `src/lib/supabase.ts`
   - Expo: `AiFitnessExpo/src/lib/supabase.ts`

### 4. Implement ALL missing API logic using Supabase RPCs:
   - `search_foods`
   - `search_recipes`
   - `search_exercises`
   - `generate_workout_plan`
   - `generate_meal_plan`

### 5. Fix the food search feature:
   - search bar
   - food database results
   - add to meal

### 6. Fix the exercise search feature:
   - exercise list
   - search filter
   - video player

### 7. Fix the recipe feature:
   - search recipes
   - recipe images
   - recipe details

### 8. Fix loading UX, skeletons, spinners, no-results messages.

### 9. Validate all Supabase queries:
   - match table names
   - match column names
   - match RPC names

### 10. Add error-handling wrappers so nothing crashes on mobile.

### 11. Fix module imports for Expo:
    - Notifications
    - Storage
    - Assets

### 12. Remove all references to old backend routes.
    The backend now only handles Stripe webhooks.

### 13. Implement role-based access:
    - free user
    - premium user

### 14. Integrate Stripe status from `subscriptions` table.

### 15. Fix environment variable loading across:
    - Web (Vite)
    - Expo
    - Server

### 16. Add admin dashboard pages (placeholder routes):
    - `/admin`
    - `/admin/content`
    - `/admin/workouts`
    - `/admin/recipes`
    - `/admin/meditation`
    - `/admin/marketplace`
    - `/admin/notifications`
    - `/admin/settings`

### 17. Fix RLS errors:
    - `user_id` must match `auth.uid()`
    - admin tables: only admins allowed

### 18. After repair, run full app-wide QA:
    - Wellness
    - Move
    - Fuel
    - Recipes
    - Shopping List
    - Games
    - Meditation
    - Profile
    - Social
    - Dashboard
    - Notifications

---

## 🎯 Goal

Produce a fully working version of the AiFitnessApp with all modules functional using ONLY Supabase + client-side logic + Stripe webhooks.

**DO NOT STOP until all errors are fixed.**


