# ✅ Schema Availability: Web & Mobile

## 🎯 **YES - All Schema Modules Are Applied to BOTH Web and Mobile**

All the alphabetic schema modules (A, B, C, D, E, F, H, K, L, M, O, P, Q, R, S, T, W, X) are applied to the **SAME Supabase database**, which means they are **automatically available to both web and mobile** applications.

---

## 🏗️ How It Works

### **Single Database, Multiple Clients**

```
┌─────────────────────────────────────────┐
│     Supabase Database (PostgreSQL)      │
│  ┌───────────────────────────────────┐ │
│  │  All Schema Modules (A-X)          │ │
│  │  • Tables                           │ │
│  │  • RPC Functions                    │ │
│  │  • RLS Policies                     │ │
│  │  • Indexes                          │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
           │                    │
           │                    │
    ┌──────▼──────┐      ┌──────▼──────┐
    │  Web Client │      │ Mobile Client│
    │  (React)    │      │  (React      │
    │             │      │   Native)    │
    └─────────────┘      └──────────────┘
```

### **Key Point:**
- ✅ **Schema is at the DATABASE level** (not platform-specific)
- ✅ **Both clients connect to the SAME Supabase project**
- ✅ **All tables, functions, and policies are shared**
- ✅ **RLS (Row Level Security) works the same on both platforms**

---

## 📱 Client Configurations

### **Web Client** (`src/lib/supabase.ts`)
```typescript
// Uses browser localStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true  // For OAuth callbacks
  }
});
```

**Environment Variables:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key

### **Mobile Client** (`AiFitnessExpo/src/lib/supabase.ts`)
```typescript
// Uses AsyncStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,      // React Native storage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false   // Not needed on mobile
  }
});
```

**Environment Variables:**
- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL (same as web)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key (same as web)

---

## ✅ What This Means

### **All Modules Available on Both Platforms:**

| Module | Web | Mobile | Notes |
|--------|-----|--------|-------|
| **A** - User System | ✅ | ✅ | Same auth.users, same profiles |
| **B** - Nutrition Engine | ✅ | ✅ | Same foods, recipes, meal_logs |
| **C** - Wellness (AIMind) | ✅ | ✅ | Same moods, sleep, habits |
| **D** - Fitness Engine | ✅ | ✅ | Same exercises, workouts |
| **E** - Analytics + AI | ✅ | ✅ | Same analytics, predictions |
| **F** - Shopping List | ✅ | ✅ | Same shopping lists |
| **H** - Notifications | ✅ | ✅ | Same push tokens, notifications |
| **K** - AI Coach | ✅ | ✅ | Same AI messages, coaching |
| **L** - Recipe Engine | ✅ | ✅ | Same recipes, ingredients |
| **M** - Workout Builder | ✅ | ✅ | Same workouts, training plans |
| **O** - Meditation + Games | ✅ | ✅ | Same meditation, games |
| **P** - Rewards & Gamification | ✅ | ✅ | Same XP, badges, streaks |
| **Q** - Centralized Analytics | ✅ | ✅ | Same daily_analytics |
| **R** - Dashboard Intelligence | ✅ | ✅ | Same daily_summaries, insights |
| **S** - Subscriptions | ✅ | ✅ | Same subscriptions, entitlements |
| **T** - Social Layer | ✅ | ✅ | Same friends, posts, challenges |
| **W** - AI Recommendations | ✅ | ✅ | Same recommendations |
| **X** - Meals & Macro Planner | ✅ | ✅ | Same meal plans |

---

## 🔐 Row Level Security (RLS)

**RLS policies work identically on both platforms:**

```sql
-- Example: Users can only see their own meal logs
CREATE POLICY "users_manage_own_meals"
ON meal_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

This policy:
- ✅ Works on **web** (React)
- ✅ Works on **mobile** (React Native)
- ✅ Enforced at the **database level**
- ✅ No platform-specific code needed

---

## 📞 RPC Functions

**All RPC functions are available on both platforms:**

### **Web Example:**
```typescript
// src/components/MealPlan.tsx
import { supabase } from '@/lib/supabase';

const { data: plan } = await supabase.rpc('get_meal_plan', {
  p_user: user.id,
  p_date: '2024-01-15',
  p_type: 'daily'
});
```

### **Mobile Example:**
```typescript
// AiFitnessExpo/src/screens/MealPlanScreen.tsx
import { supabase } from '@/lib/supabase';

const { data: plan } = await supabase.rpc('get_meal_plan', {
  p_user: user.id,
  p_date: '2024-01-15',
  p_type: 'daily'
});
```

**Same function, same result, different platform!** 🎉

---

## 🎯 Platform-Specific Considerations

### **What's Different:**

1. **Session Storage**
   - Web: `localStorage` (browser)
   - Mobile: `AsyncStorage` (React Native)

2. **OAuth Callbacks**
   - Web: Uses URL redirects (`detectSessionInUrl: true`)
   - Mobile: Uses deep links or app schemes

3. **Push Notifications**
   - Web: Web Push API
   - Mobile: Expo Push Notifications / FCM

### **What's the Same:**

- ✅ **All database tables**
- ✅ **All RPC functions**
- ✅ **All RLS policies**
- ✅ **All data and relationships**
- ✅ **Authentication flow**
- ✅ **Real-time subscriptions**

---

## 🚀 How to Use

### **1. Set Environment Variables**

**Web** (`.env` in project root):
```env
VITE_SUPABASE_URL=https://pthmddtyxdragzbtjeuu.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Mobile** (`.env` in `AiFitnessExpo/`):
```env
EXPO_PUBLIC_SUPABASE_URL=https://pthmddtyxdragzbtjeuu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Note:** Both use the **SAME URL and KEY** - they connect to the same database!

### **2. Import and Use**

**Web:**
```typescript
import { supabase } from '@/lib/supabase';
```

**Mobile:**
```typescript
import { supabase } from '@/lib/supabase';
```

### **3. Use Any Module**

Both platforms can use any module:

```typescript
// Get meal plan (Module X)
const { data: plan } = await supabase.rpc('get_meal_plan', {...});

// Get recommendations (Module W)
const { data: recs } = await supabase.rpc('get_user_recommendations', {...});

// Get daily summary (Module R)
const { data: summary } = await supabase
  .from('daily_summaries')
  .select('*')
  .eq('user_id', user.id)
  .eq('date', today)
  .single();

// Log workout (Module D)
await supabase.rpc('log_workout', {...});
```

---

## ✅ Verification Checklist

To verify both platforms can access the schema:

### **1. Check Supabase Project**
- Go to https://app.supabase.com
- Select your project: `pthmddtyxdragzbtjeuu`
- Go to **Table Editor** - you should see all tables from all modules

### **2. Test Web Client**
```typescript
// In web app
import { supabase } from '@/lib/supabase';
const { data } = await supabase.from('users').select('*').limit(1);
console.log('Web can access:', data);
```

### **3. Test Mobile Client**
```typescript
// In mobile app
import { supabase } from '@/lib/supabase';
const { data } = await supabase.from('users').select('*').limit(1);
console.log('Mobile can access:', data);
```

### **4. Test RPC Function**
```typescript
// Both platforms
const { data } = await supabase.rpc('get_meal_plan', {
  p_user: user.id,
  p_date: new Date().toISOString().split('T')[0],
  p_type: 'daily'
});
```

---

## 🎉 Summary

**✅ YES - All schema modules (A-X) are available on BOTH web and mobile!**

- **Single database** = Single source of truth
- **Multiple clients** = Same data, different platforms
- **RLS policies** = Same security on both
- **RPC functions** = Same logic on both
- **Real-time** = Works on both platforms

**No platform-specific schema needed!** The database is platform-agnostic, and both clients connect to the same Supabase project. 🚀

---

## 📚 Related Documentation

- **Migration Files**: `supabase/migrations/` - All modules applied to database
- **Web Client**: `src/lib/supabase.ts` - React/Web configuration
- **Mobile Client**: `AiFitnessExpo/src/lib/supabase.ts` - React Native configuration
- **Server Client**: `server/supabase/client.js` - Server-side operations
- **Migration Guide**: `supabase/README.md` - How to apply migrations

---

**Last Updated**: After Module X completion
**Status**: ✅ All modules available on both platforms

