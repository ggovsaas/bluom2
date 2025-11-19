# ✅ MODULE Y — WORKOUT AUTO-PROGRESSION ENGINE — COMPLETE

## 📋 Overview

Module Y creates the **Workout Auto-Progression Engine** that makes workouts behave like a real coach — progressive overload, auto-adjustments, deload weeks, missed-workout recovery, movement substitutions, rep prescriptions, and predictive 1RM formulas. This is what Fitbod, Strong, Freeletics, and AthleticAI are built on.

## 🎯 What This Module Adds

### Core Features
- **Auto-Progression of Exercises** - +2.5kg, +5kg, or +1 rep depending on performance
- **Weight Prediction** - Uses Epley or Brzycki formula for 1RM calculations
- **Missed Workout Recovery** - Regression algorithm for missed sessions (premium)
- **Deload Logic** - Every 4-8 weeks, auto-reduce volume and intensity (premium)
- **Intelligent Substitutions** - Suggest similar movements if equipment unavailable (premium)
- **Personalized Difficulty Scaling** - Beginner/intermediate/advanced progression rates
- **RPE/RIR Based Adjustments** - Rate of Perceived Exertion and Reps in Reserve logic

## 📊 Database Schema

### New Tables

1. **`workout_progressions`**
   - Tracks latest performance per exercise
   - Fields:
     - id, user_id, exercise_id
     - last_weight, last_reps, last_rpe, last_rir, last_1rm, last_volume
     - last_workout_date
     - difficulty_level (beginner, normal, advanced)
     - progression_rate (multiplier for progression speed)
     - consecutive_sessions
     - updated_at
   - Unique constraint: (user_id, exercise_id)

2. **`scheduled_progressions`**
   - Stores auto-generated next workout weights
   - Fields:
     - id, user_id, exercise_id
     - next_weight, next_reps, next_sets
     - target_rpe, target_rir
     - progression_type (weight_increase, rep_increase, volume_increase, maintain)
     - notes (e.g., "Deload week", "Missed workout recovery")
     - created_at, expires_at
   - Unique constraint: (user_id, exercise_id)

3. **`missed_workout_log`**
   - Tracks missed workouts for recovery logic
   - Fields:
     - id, user_id, date, scheduled_workout_id
     - reason (busy, sick, travel, fatigue, etc.)
     - days_since_last_workout
     - created_at

4. **`deload_cycles`**
   - Tracks deload weeks (premium feature)
   - Fields:
     - id, user_id, start_date, end_date
     - volume_reduction (40-50%), intensity_reduction (10-20%)
     - triggered_by (auto, manual, recovery_need, fatigue, hrv_low)
     - weeks_since_last_deload
     - is_active
     - created_at

5. **`exercise_substitutions`**
   - Stores intelligent movement substitutions
   - Fields:
     - id, user_id, original_exercise_id, substitute_exercise_id
     - reason (equipment_unavailable, dislike, injury, variation)
     - similarity_score (0-1)
     - created_at

## 🔧 RPC Functions

### Core Functions

1. **`compute_one_rep_max(weight, reps)`**
   - Uses Epley formula (Fitbod standard)
   - Formula: weight × (1 + reps / 30.0)
   - Returns: calculated 1RM

2. **`compute_one_rep_max_brzycki(weight, reps)`**
   - Alternative formula (Brzycki)
   - Formula: weight × (36.0 / (37.0 - reps))
   - Returns: calculated 1RM

3. **`update_progression(user_id, exercise_id, weight, reps, rpe, rir, volume, sets)`**
   - Recalculates 1RM, next workout weight, next reps based on performance
   - Auto-progression logic:
     - RPE ≤ 6 or RIR ≥ 3: Increase weight 5%
     - RPE 7-8 or RIR 1-2: Increase weight 2.5%
     - RPE ≥ 9 or RIR = 0: Maintain weight, add reps
   - Handles deload weeks
   - Handles missed workout recovery (premium)
   - Returns: JSON with next workout details

4. **`get_next_exercise_progression(user_id, exercise_id)`**
   - Gets the next workout progression for an exercise
   - Returns: JSON with next_weight, next_reps, next_sets, target_rpe, progression_type

5. **`log_missed_workout(user_id, date, reason, scheduled_workout_id)`**
   - Logs a missed workout for recovery logic (premium only)
   - Calculates days since last workout
   - Returns: missed_workout_log id

6. **`trigger_deload_week(user_id, triggered_by, volume_reduction, intensity_reduction)`**
   - Triggers a deload week (premium only)
   - Deactivates existing active deload cycles
   - Creates 7-day deload cycle
   - Returns: deload_cycle id

7. **`get_user_progressions(user_id, exercise_id_filter)`**
   - Gets all progressions for a user
   - Includes next progression details
   - Returns: JSON array with all progressions

8. **`suggest_exercise_substitution(user_id, exercise_id, reason)`**
   - Suggests exercise substitutions (premium only)
   - Finds similar exercises (same muscle groups, similar equipment)
   - Returns: JSON with original exercise and substitution options

9. **`check_deload_needed(user_id)`**
   - Checks if user needs a deload week (premium only)
   - Logic:
     - 6+ weeks since last deload AND 4+ consecutive weeks training
     - Low mood/fatigue (from wellness module)
     - 8+ consecutive weeks training
   - Returns: JSON with needs_deload, reason, and stats

10. **`get_progression_history(user_id, exercise_id, days)`**
    - Gets progression history for an exercise
    - Returns: JSON array with historical data (date, weight, reps, sets, volume, 1RM)

## 🧠 Intelligence Layer

### How It Works

1. **First Workout**
   - User chooses weight → Module Y sets baseline

2. **Next Session**
   - Auto progression:
     - If RPE ≤ 6 → Increase weight + 5%
     - If RPE 7-8 → Increase weight + 2.5%
     - If RPE ≥ 9 → Add reps
     - If failure → keep weight

3. **Cycle Detection**
   - If user consistently hits top of rep range → auto-increase

4. **Missed Day Logic** (Premium)
   - If user misses 3+ days: -5% weight, keep same reps
   - If user misses 7+ days: -10% weight, reduce reps by 2

5. **Deload Week** (Premium)
   - Every 6 hard weeks OR
   - User logs fatigue (from Wellness module) OR
   - HRV synced from wearables (Module U)
   - Auto-reduce volume 40-50%
   - Auto-reduce intensity 10-20%

6. **Substitution Logic** (Premium)
   - If gym is busy → recommend:
     - Same movement
     - Same muscle group
     - Same difficulty

## 🎯 Premium Gating

| Feature                     | Free     | Premium                   |
| --------------------------- | -------- | ------------------------- |
| Auto progression            | ✔️ basic | ✔️ advanced logic         |
| Missed-day handling         | ❌        | ✔️                        |
| Deload weeks                | ❌        | ✔️                        |
| Movement substitutions      | ❌        | ✔️                        |
| 1RM predictions             | ✔️       | ✔️ advanced multi-formula |
| Auto-generated weekly split | ❌        | ✔️                        |
| Workout fatigue analysis    | ❌        | ✔️ (uses mood/sleep)      |

## 🔗 Cross-Module Integrations

### Connected to:

- **Module D** (Fitness Engine) - Uses exercises, workout_logs, set_logs
- **Module M** (Workout Builder) - Uses workouts, workout_exercises, set_logs
- **Module R** (Dashboard Intelligence) - Uses daily_summaries for fatigue analysis
- **Module C** (Wellness) - Uses moods for fatigue detection
- **Module S** (Subscriptions) - Checks is_premium for gating

## 🎨 UI/UX Blueprint

### Exercise Card Shows:
- Current weight
- Suggested next weight
- RPE selector (1-10)
- RIR selector (0-5)
- Rep range display
- Auto notes ("Today is a deload day")

### Workout Completion UX:
- "Great job!"
- Slider for difficulty (RPE/RIR)
- Auto-adjusts next session
- Shows progression type

### In Workout Builder:
- Auto-fill progressions
- "Recommended progression" badge
- Substitution suggestions

## 📈 Performance

### Indexes Created
- `idx_workout_progressions_user_exercise` - Fast user/exercise lookups
- `idx_workout_progressions_updated` - Fast chronological queries
- `idx_scheduled_progressions_user_exercise` - Fast next workout queries
- `idx_scheduled_progressions_expires` - Fast expiration queries
- `idx_missed_workout_log_user_date` - Fast missed workout queries
- `idx_deload_cycles_user_active` - Fast active deload queries
- `idx_deload_cycles_dates` - Fast date range queries
- `idx_exercise_substitutions_user` - Fast substitution queries

## ✅ Migration File

**File**: `supabase/migrations/019_module_y_workout_auto_progression.sql`

### How to Apply

1. Open Supabase SQL Editor
2. Copy the entire contents of `019_module_y_workout_auto_progression.sql`
3. Paste into SQL Editor
4. Click **Run**

### What It Does

- Creates 5 new tables (workout_progressions, scheduled_progressions, missed_workout_log, deload_cycles, exercise_substitutions)
- Creates 10 RPC functions (compute 1RM, update progression, get next progression, log missed workout, trigger deload, get progressions, suggest substitutions, check deload needed, get history)
- Sets up RLS policies
- Creates performance indexes
- Sets up triggers for auto-updating timestamps

### Dependencies

- **Module D** (Fitness Engine) - Uses exercises, workout_logs, set_logs
- **Module M** (Workout Builder) - Uses workouts, set_logs
- **Module R** (Dashboard Intelligence) - Can use daily_summaries for fatigue
- **Module C** (Wellness) - Uses moods for fatigue detection
- **Module S** (Subscriptions) - Checks is_premium for gating

## 🎯 Next Steps

1. **API Integration** - Build progression logic in API layer
2. **Frontend Integration** - Build progression UI (exercise cards, RPE/RIR selectors, deload indicators)
3. **Substitution Algorithm** - Implement similarity scoring for exercise substitutions
4. **Deload Automation** - Set up CRON to check for deload needs weekly
5. **Progression Analytics** - Build charts showing progression over time
6. **Premium Checks** - Add premium checks for advanced features

## 🔄 Integration Pattern

### Update Progression After Workout:
```typescript
const { data: result } = await supabase.rpc('update_progression', {
  p_user: user.id,
  p_exercise: exercise.id,
  p_weight: 100,
  p_reps: 8,
  p_rpe: 7,
  p_rir: 2,
  p_volume: 2400,
  p_sets: 3
});
```

### Get Next Workout Weight:
```typescript
const { data: next } = await supabase.rpc('get_next_exercise_progression', {
  p_user: user.id,
  p_exercise: exercise.id
});
```

### Check Deload Needed:
```typescript
const { data: deload } = await supabase.rpc('check_deload_needed', {
  p_user: user.id
});
```

### Trigger Deload:
```typescript
const { data: deloadId } = await supabase.rpc('trigger_deload_week', {
  p_user: user.id,
  p_triggered_by: 'auto',
  p_volume_reduction: 50,
  p_intensity_reduction: 20
});
```

## 🎉 Module Y Status: COMPLETE

This module creates the **Workout Auto-Progression Engine** that powers:
- ✅ Progressive overload automation
- ✅ 1RM calculations (Epley & Brzycki)
- ✅ RPE/RIR based adjustments
- ✅ Deload week management (premium)
- ✅ Missed workout recovery (premium)
- ✅ Exercise substitutions (premium)
- ✅ Personalized difficulty scaling
- ✅ Full RLS security
- ✅ Performance optimized

Module Y makes workouts behave like a real coach with intelligent progression! 💪✨

