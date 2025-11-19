# ✅ MODULE Z — SLEEP + RECOVERY AI — COMPLETE

## 📋 Overview

Module Z creates the **Sleep + Recovery AI** system that turns Bluöm into a WHOOP-level sleep intelligence system — without hardware — and integrates with Wellness, Workouts, Habits, and the AI Recommendation Engine. This is one of the most valuable premium features in any fitness/wellness app.

## 🎯 What This Module Adds

### Core Features
- **Enhanced Sleep Logging** - Manual input, smart detection, notes (caffeine, stress, late meal, workouts)
- **Sleep Quality Score** - Computed from time asleep, consistency, latency, WASO, interruptions
- **Recovery Score** - Holistic recovery influenced by sleep, workout intensity, mood, stress, habits, nutrition, hydration
- **AI Insights** - Pattern detection, correlations, warnings, coaching
- **Sleep Recommendations** - Smart bedtime reminders, supplement suggestions, routines

## 📊 Database Schema

### Enhanced Tables

1. **`sleep_logs`** (Enhanced from Module C)
   - Added columns:
     - date, bedtime, wake_time
     - duration_minutes, sleep_latency_minutes
     - wake_after_sleep_onset, interruptions
     - sleep_quality_score (0-100)
     - notes, updated_at
   - Migrates existing data from Module C (hours → duration_minutes, quality → sleep_quality_score)

### New Tables

2. **`recovery_logs`**
   - Tracks holistic recovery, merges all modules
   - Fields:
     - id, user_id, date
     - sleep_score, workout_intensity, stress_level
     - hydration_score, mood_score, nutrition_score
     - total_recovery_score (final weighted score 0-100)
     - created_at
   - Unique constraint: (user_id, date)

3. **`sleep_insights`**
   - AI generated insights, correlations, warnings
   - Fields:
     - id, user_id, date
     - insight_type (pattern, warning, correlation, coaching, recommendation)
     - message, confidence (0-1)
     - metadata (jsonb)
     - created_at

4. **`sleep_recommendations`**
   - Smart bedtime reminders, supplement suggestions, routines
   - Fields:
     - id, user_id, recommendation
     - recommended_time, category (bedtime, recovery, supplement, behavior, routine)
     - priority (1-10), is_premium
     - action_url, created_at, expires_at

## 🔧 RPC Functions

### Core Functions

1. **`calculate_sleep_score(duration, latency, waso, interruptions)`**
   - Calculates sleep quality score (0-100)
   - Scoring:
     - Duration (40 points): 7-9 hrs = 40, 6-7 hrs = 25, 9-10 hrs = 30, 5-6 hrs = 15, <5 or >10 = 10
     - Latency (20 points): ≤20 min = 20, ≤40 min = 10, ≤60 min = 5
     - WASO (25 points): <30 min = 25, <60 min = 15, <90 min = 10
     - Interruptions (15 points): 15 - (interruptions × 3)
   - Returns: score (0-100)

2. **`log_sleep_session(user_id, date, bedtime, wake_time, latency, waso, interruptions, notes)`**
   - Logs a sleep session and calculates score
   - Handles existing sleep logs (updates if exists for date)
   - Calculates duration from bedtime/wake_time
   - Auto-calculates sleep score
   - Returns: sleep_log id

3. **`compute_recovery_score(sleep_score, workout_intensity, stress_level, hydration_score, mood_score, nutrition_score)`**
   - Computes holistic recovery score (0-100)
   - Weighted formula:
     - Sleep: 40%
     - Workout: 15%
     - Mood: 15%
     - Stress: 10%
     - Hydration: 10%
     - Nutrition: 10%
   - Returns: recovery score (0-100)

4. **`calculate_daily_recovery(user_id, date)`**
   - Calculates and stores daily recovery score
   - Pulls data from:
     - sleep_logs (sleep score)
     - workout_logs (workout intensity)
     - moods (stress level, mood score)
     - daily_summaries (hydration, nutrition)
   - Upserts recovery_logs
   - Returns: JSON with all scores

5. **`generate_sleep_insight(user_id)`**
   - Generates AI sleep insights (premium only)
   - Analyzes last 14 days of sleep and mood
   - Detects patterns, warnings, correlations
   - Returns: insight id

6. **`get_sleep_insights(user_id, days, type_filter)`**
   - Gets sleep insights for a user
   - Filters by type (optional)
   - Returns: JSON array with insights

7. **`create_sleep_recommendation(user_id, recommendation, recommended_time, category, priority, is_premium, action_url)`**
   - Creates a sleep recommendation
   - Premium recommendations require premium subscription
   - Returns: recommendation id

8. **`get_sleep_recommendations(user_id, category_filter)`**
   - Gets sleep recommendations for a user
   - Filters by category (optional)
   - Excludes expired recommendations
   - Returns: JSON array with recommendations

9. **`get_recovery_history(user_id, days)`**
   - Gets recovery history for a user
   - Returns: JSON array with recovery data

10. **`get_sleep_summary(user_id, days)`**
    - Gets sleep summary statistics
    - Returns: JSON with averages, totals, best/worst scores

## 🧠 Intelligence Layer

### How It Works

1. **After User Logs Sleep → AI Computes:**
   - Sleep score (0-100)
   - Quality patterns
   - Recovery score
   - AI insights (premium)
   - Personalized recommendations (premium)

2. **Detects Poor Patterns:**
   - Late sleep
   - Too many interruptions
   - Poor mood + bad sleep correlation
   - High stress before bed
   - Heavy training before bedtime

3. **Cross-Module Correlation:**
   - From Wellness: Mood, stress, journaling
   - From Fuel: Caffeine, late meals, low hydration
   - From Move: Workout intensity, timing of training

4. **Recovery Score Affects Workouts:**
   - Integration with Module Y:
     - Low sleep → decrease weights, increase rest
     - High sleep → increase progression
     - Sleep debt → suggest deload
     - Overtraining + sleep = red alert

5. **Premium-Only Actions:**
   - "Smart Bedtime Window"
   - "Your perfect wake-up time"
   - "Daily Sleep Coaching"
   - "Deep Insight Reports"
   - "Personalized wind-down routine"
   - "Stimulant intake warnings"

## 🎯 Premium Gating

| Feature                    | Free | Premium |
| -------------------------- | ---- | ------- |
| Manual sleep logging       | ✔️   | ✔️      |
| Basic sleep score          | ✔️   | ✔️      |
| Recovery score             | ✔️   | ✔️      |
| AI insights                | ❌    | ✔️      |
| Sleep coaching             | ❌    | ✔️      |
| Morning energy predictions | ❌    | ✔️      |
| Habit & sleep correlations | ❌    | ✔️      |
| Bedtime recommendations    | ❌    | ✔️      |
| Stress–sleep analysis      | ❌    | ✔️      |

## 🔗 Cross-Module Integrations

### Connected to:

- **Module C** (Wellness) - Enhances sleep_logs, uses moods for stress/mood analysis
- **Module R** (Dashboard Intelligence) - Uses daily_summaries for hydration/nutrition
- **Module M** (Workout Builder) - Uses workout_logs for workout intensity
- **Module Y** (Auto-Progression) - Recovery score affects workout progression
- **Module W** (AI Recommendations) - Can trigger sleep recommendations
- **Module S** (Subscriptions) - Checks is_premium for gating

## 🎨 UI/UX Blueprint

### Dashboard Card
- Sleep hours (bar)
- Sleep score (circle gauge)
- Recovery score
- AI tip

### Logging Modal
- Bedtime selector
- Wake-time selector
- Notes: caffeine, stress, late workout

### Sleep Trends Page
- Weekly chart
- Insights
- Recovery timeline

### Premium Cards
- "Unlock Sleep Coaching"
- "Unlock Advanced Recovery"

## 📈 Performance

### Indexes Created
- `idx_sleep_logs_user_date` - Fast user sleep queries
- `idx_sleep_logs_date` - Fast chronological queries
- `idx_recovery_logs_user_date` - Fast user recovery queries
- `idx_sleep_insights_user_date` - Fast user insights
- `idx_sleep_insights_type` - Fast type filtering
- `idx_sleep_recommendations_user` - Fast user recommendations
- `idx_sleep_recommendations_category` - Fast category filtering
- `idx_sleep_recommendations_expires` - Fast expiration queries

## ✅ Migration File

**File**: `supabase/migrations/020_module_z_sleep_recovery_ai.sql`

### How to Apply

1. Open Supabase SQL Editor
2. Copy the entire contents of `020_module_z_sleep_recovery_ai.sql`
3. Paste into SQL Editor
4. Click **Run**

### What It Does

- Enhances existing `sleep_logs` table (adds new columns, migrates data)
- Creates 3 new tables (recovery_logs, sleep_insights, sleep_recommendations)
- Creates 10 RPC functions (calculate sleep score, log sleep, compute recovery, calculate daily recovery, generate insights, get insights, create recommendations, get recommendations, get recovery history, get sleep summary)
- Sets up RLS policies
- Creates performance indexes
- Sets up triggers for auto-updating timestamps

### Dependencies

- **Module C** (Wellness) - Enhances sleep_logs, uses moods
- **Module R** (Dashboard Intelligence) - Uses daily_summaries
- **Module M** (Workout Builder) - Uses workout_logs
- **Module Y** (Auto-Progression) - Recovery score can affect progression
- **Module S** (Subscriptions) - Checks is_premium for gating

## 🎯 Next Steps

1. **API Integration** - Build sleep logging UI and recovery calculation automation
2. **Frontend Integration** - Build sleep dashboard, trends page, logging modal
3. **AI Insight Generation** - Enhance insight generation with more sophisticated patterns
4. **Recovery Automation** - Set up CRON to calculate daily recovery scores
5. **Workout Integration** - Connect recovery scores to Module Y progression
6. **Premium Checks** - Add premium checks for AI insights and recommendations

## 🔄 Integration Pattern

### Log Sleep Session:
```typescript
const { data: sleepId } = await supabase.rpc('log_sleep_session', {
  p_user: user.id,
  p_date: '2024-01-15',
  p_bedtime: '2024-01-15T22:00:00Z',
  p_wake_time: '2024-01-16T06:30:00Z',
  p_latency: 15,
  p_waso: 20,
  p_interruptions: 1,
  p_notes: 'Had coffee at 2pm'
});
```

### Calculate Daily Recovery:
```typescript
const { data: recovery } = await supabase.rpc('calculate_daily_recovery', {
  p_user: user.id,
  p_date: '2024-01-15'
});
```

### Get Sleep Insights:
```typescript
const { data: insights } = await supabase.rpc('get_sleep_insights', {
  p_user: user.id,
  p_days: 30,
  p_type_filter: 'warning'
});
```

### Get Recovery History:
```typescript
const { data: history } = await supabase.rpc('get_recovery_history', {
  p_user: user.id,
  p_days: 30
});
```

## 🎉 Module Z Status: COMPLETE

This module creates the **Sleep + Recovery AI** system that powers:
- ✅ WHOOP-level sleep intelligence
- ✅ Sleep quality scoring (0-100)
- ✅ Holistic recovery scoring
- ✅ AI insights and correlations (premium)
- ✅ Sleep recommendations (premium)
- ✅ Cross-module integration
- ✅ Full RLS security
- ✅ Performance optimized

Module Z turns Bluöm into a comprehensive sleep and recovery intelligence system! 😴✨

