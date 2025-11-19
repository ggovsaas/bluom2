# ✅ MODULE Q — CENTRALIZED ANALYTICS ENGINE — COMPLETE

## 📋 Overview

Module Q creates the **centralized analytics engine** that becomes the **heart of all intelligence** in Bluöm. This module provides a single source of truth for daily analytics, event logging, and comprehensive views that power the home dashboard, AI Coach, notifications, and all intelligent features.

## 🎯 What This Module Adds

### Core Features
- **Centralized Daily Analytics** - One table (`daily_analytics`) with all metrics per user per day
- **Event Logging** - Complete event log (`analytics_events`) for trend analysis and AI correlation
- **Analytics Views** - Pre-built views for dashboard, weekly summaries, monthly summaries
- **Sync Functions** - Helper functions to sync data from other modules
- **Comprehensive Metrics** - Nutrition, fitness, wellness, habits, recovery all in one place

## 📊 Database Schema

### New Tables

1. **`daily_analytics`**
   - Main centralized analytics table: one row per user per day
   - Fields:
     - **Nutrition**: calories, protein, carbs, fat, fiber, sugar, water_ml
     - **Fitness**: steps, workouts_completed, workout_minutes, strength_volume
     - **Wellness**: sleep_hours, sleep_quality, mood, stress_level
     - **Habits**: habits_completed, total_habits
     - **Recovery**: recovery_score
   - Unique constraint on (user_id, date)

2. **`analytics_events`**
   - Event log for trend analysis, time-series, AI correlation
   - Fields: id, user_id, event_type, value, meta (jsonb), created_at
   - Event types: "meal_logged", "water_added", "sleep_logged", "workout_completed", "steps_updated", "mood_logged", "habit_completed", etc.

### Views

1. **`analytics_summary_view`**
   - Used for home dashboard, AI insights, weekly reports
   - Selects all fields from `daily_analytics`

2. **`analytics_weekly_summary`**
   - Weekly aggregates for trend analysis
   - Aggregates: weekly_calories, weekly_protein, weekly_steps, weekly_workouts, avg_sleep, avg_mood, avg_stress, etc.

3. **`analytics_monthly_summary`**
   - Monthly aggregates
   - Similar to weekly but monthly grouping

4. **`event_summary_view`**
   - Summary of events by type
   - Shows: event_count, avg_value, total_value, first_occurrence, last_occurrence

## 🔧 RPC Functions

### Core Functions

1. **`upsert_daily_analytics(...)`**
   - Upserts daily analytics data
   - **Additive fields**: calories, protein, carbs, fat, fiber, sugar, water_ml, workouts_completed, workout_minutes, strength_volume
   - **Replacement fields**: steps (uses GREATEST), sleep_hours, sleep_quality, mood, stress_level, habits_completed, total_habits, recovery_score
   - Automatically handles conflicts and updates

2. **`log_event(user_id, event_type, value, meta)`**
   - Logs an analytics event for trend analysis
   - Returns event ID
   - Used throughout the app whenever user performs an action

3. **`get_daily_analytics(user_id, date)`**
   - Gets analytics for a specific day
   - Returns all fields from `daily_analytics`

4. **`get_analytics_range(user_id, start_date, end_date)`**
   - Gets analytics for a date range
   - Returns key metrics for trend analysis

5. **`get_event_trends(user_id, event_type, days)`**
   - Gets event trends for analysis
   - Returns: date, event_count, avg_value, total_value
   - Used for AI correlation and pattern detection

### Sync Functions (Module Integration)

6. **`sync_from_meal_log(user_id, date)`**
   - Syncs nutrition data from `meal_logs` (Module B)
   - Aggregates from foods, user_foods, and recipes
   - Updates `daily_analytics` with nutrition totals

7. **`sync_from_workout(user_id, date)`**
   - Syncs workout data from `workout_logs` and `set_logs` (Module M)
   - Calculates workouts_completed, workout_minutes, strength_volume
   - Updates `daily_analytics`

8. **`sync_from_wellness(user_id, date)`**
   - Syncs wellness data from `sleep_logs`, `moods`, `habit_logs` (Module C)
   - Gets latest sleep, mood, and habit completion
   - Updates `daily_analytics`

## 🎨 How Modules Use This

### Module R — Dashboard Intelligence
- Reads `analytics_summary_view` for home dashboard
- Fast access to all daily metrics

### Module K — AI Coach Engine
- Pulls mood trends, sleep patterns, habit consistency, workout frequency
- Uses `get_analytics_range()` and `get_event_trends()` for context

### Module H — Notification AI
- Uses analytics to decide:
  - "You're low on water"
  - "You haven't logged a meal today"
  - "You slept poorly → reduce intensity today"

### Module P — Rewards & Gamification
- Can use `daily_analytics` for health score calculation
- Tracks streaks and completion rates

### Module E — Analytics + AI Engine
- Can coexist with `analytics_daily_summary` (Module E)
- Module Q provides more comprehensive centralized view

## 📈 Event Types

Common event types to log:
- `meal_logged` - When user logs a meal
- `water_added` - When user logs water
- `sleep_logged` - When user logs sleep
- `workout_completed` - When user completes workout
- `steps_updated` - When steps are synced
- `mood_logged` - When user logs mood
- `habit_completed` - When user completes habit
- `meditation_completed` - When user completes meditation
- `game_played` - When user plays mind game

## 🔐 Security (RLS)

All tables have Row Level Security enabled:
- **daily_analytics** - Users can only access their own analytics
- **analytics_events** - Users can only access their own events

## 📈 Performance

### Indexes Created
- `idx_daily_analytics_user_date` - Fast user/date queries
- `idx_daily_analytics_date` - Fast date-based queries
- `idx_analytics_events_user_type` - Fast event type queries
- `idx_analytics_events_user_date` - Fast user event history
- `idx_analytics_events_type_date` - Fast event type trends

## ✅ Migration File

**File**: `supabase/migrations/014_module_q_centralized_analytics.sql`

### How to Apply

1. Open Supabase SQL Editor
2. Copy the entire contents of `014_module_q_centralized_analytics.sql`
3. Paste into SQL Editor
4. Click **Run**

### What It Does

- Creates 2 new tables (`daily_analytics`, `analytics_events`)
- Creates 4 views (summary, weekly, monthly, event summary)
- Creates 8 RPC functions (upsert, log, get, sync functions)
- Sets up RLS policies
- Creates performance indexes
- Sets up triggers for auto-updating timestamps

### Dependencies

- **Module B** (Nutrition) - Syncs from `meal_logs`, `foods`, `user_foods`, `recipes`
- **Module C** (Wellness) - Syncs from `sleep_logs`, `moods`, `habit_logs`
- **Module M** (Workouts) - Syncs from `workout_logs`, `set_logs`
- **All Modules** - Can log events from any module

## 🎯 Next Steps

1. **Event Logging Integration** - Call `log_event()` from all activity logging endpoints
2. **Daily Sync** - Set up cron jobs or triggers to call sync functions daily
3. **Dashboard Integration** - Use `analytics_summary_view` in home dashboard
4. **AI Integration** - Use `get_analytics_range()` and `get_event_trends()` for AI Coach
5. **Notification Integration** - Use analytics for smart notification triggers
6. **Analytics Dashboard** - Build analytics dashboard using views

## 🔄 Integration Pattern

### When User Logs Activity:

1. **Log the event**:
   ```sql
   SELECT log_event(user_id, 'meal_logged', calories, '{"food_id": "..."}');
   ```

2. **Update daily analytics**:
   ```sql
   SELECT upsert_daily_analytics(user_id, CURRENT_DATE, calories, protein, ...);
   ```

3. **Or use sync function**:
   ```sql
   SELECT sync_from_meal_log(user_id, CURRENT_DATE);
   ```

### For Dashboard:

```sql
SELECT * FROM analytics_summary_view 
WHERE user_id = $1 AND date = CURRENT_DATE;
```

### For AI Coach:

```sql
SELECT * FROM get_analytics_range(user_id, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE);
SELECT * FROM get_event_trends(user_id, 'mood_logged', 30);
```

## 🎉 Module Q Status: COMPLETE

This module creates the **centralized analytics engine** that powers:
- ✅ Home dashboard intelligence
- ✅ AI Coach context
- ✅ Notification AI decisions
- ✅ Sleep/Recovery AI
- ✅ Streak Engine
- ✅ Meal & Macro Planner
- ✅ Workout Auto-Progression
- ✅ Mood trends
- ✅ Habit consistency tracking
- ✅ Hydration insights
- ✅ Stress/Recovery patterns
- ✅ Personalization Engine follow-up

Module Q is the **heart of all intelligence** in Bluöm! 🧠📊

