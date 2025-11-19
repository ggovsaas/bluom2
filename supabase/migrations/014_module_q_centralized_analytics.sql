-- =========================================================
-- MODULE Q — CENTRALIZED ANALYTICS ENGINE
-- The heart of all intelligence: centralized daily analytics, event logging, views
-- =========================================================

-- 1. TABLES -----------------------------------------------

-- Q1 — daily_analytics
-- Main centralized analytics table: one row per user per day
CREATE TABLE IF NOT EXISTS daily_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    
    -- Nutrition
    calories int DEFAULT 0,
    protein int DEFAULT 0,
    carbs int DEFAULT 0,
    fat int DEFAULT 0,
    fiber int DEFAULT 0,
    sugar int DEFAULT 0,
    water_ml int DEFAULT 0,
    
    -- Fitness
    steps int DEFAULT 0,
    workouts_completed int DEFAULT 0,
    workout_minutes int DEFAULT 0,
    strength_volume int DEFAULT 0, -- total kg lifted
    
    -- Wellness
    sleep_hours decimal(4,2) DEFAULT 0,
    sleep_quality int DEFAULT 0, -- 1–5
    mood int DEFAULT 0,          -- 1–5
    stress_level int DEFAULT 0,   -- 1–5
    
    -- Habits
    habits_completed int DEFAULT 0,
    total_habits int DEFAULT 0,
    
    -- Recovery
    recovery_score int DEFAULT 0,
    
    -- System
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now()),
    
    UNIQUE(user_id, date)
);

-- Q2 — analytics_events
-- Event log for trend analysis, time-series, AI correlation
CREATE TABLE IF NOT EXISTS analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    value numeric,
    meta jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- 2. RLS (Row-Level Security) ----------------------------

ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "users_manage_own_daily_analytics"
ON daily_analytics
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_events"
ON analytics_events
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. INDEXES ----------------------------------------------

CREATE INDEX IF NOT EXISTS idx_daily_analytics_user_date
ON daily_analytics (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_date
ON daily_analytics (date DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_type
ON analytics_events (user_id, event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_date
ON analytics_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type_date
ON analytics_events (event_type, created_at DESC);

-- 4. RPC FUNCTIONS ---------------------------------------

-- Q-RPC1 — upsert_daily_analytics
-- Upserts daily analytics data (additive for some fields, replacement for others)
CREATE OR REPLACE FUNCTION upsert_daily_analytics(
    p_user_id uuid,
    p_date date,
    p_calories int DEFAULT 0,
    p_protein int DEFAULT 0,
    p_carbs int DEFAULT 0,
    p_fat int DEFAULT 0,
    p_fiber int DEFAULT 0,
    p_sugar int DEFAULT 0,
    p_water_ml int DEFAULT 0,
    p_steps int DEFAULT 0,
    p_workouts_completed int DEFAULT 0,
    p_workout_minutes int DEFAULT 0,
    p_strength_volume int DEFAULT 0,
    p_sleep_hours decimal DEFAULT 0,
    p_sleep_quality int DEFAULT 0,
    p_mood int DEFAULT 0,
    p_stress_level int DEFAULT 0,
    p_habits_completed int DEFAULT 0,
    p_total_habits int DEFAULT 0,
    p_recovery_score int DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO daily_analytics (
        user_id, date,
        calories, protein, carbs, fat, fiber, sugar, water_ml,
        steps, workouts_completed, workout_minutes, strength_volume,
        sleep_hours, sleep_quality, mood, stress_level,
        habits_completed, total_habits, recovery_score
    ) VALUES (
        p_user_id, p_date,
        p_calories, p_protein, p_carbs, p_fat, p_fiber, p_sugar, p_water_ml,
        p_steps, p_workouts_completed, p_workout_minutes, p_strength_volume,
        p_sleep_hours, p_sleep_quality, p_mood, p_stress_level,
        p_habits_completed, p_total_habits, p_recovery_score
    )
    ON CONFLICT (user_id, date) DO UPDATE
    SET
        -- Additive fields (nutrition, workouts, steps, strength)
        calories = daily_analytics.calories + EXCLUDED.calories,
        protein = daily_analytics.protein + EXCLUDED.protein,
        carbs = daily_analytics.carbs + EXCLUDED.carbs,
        fat = daily_analytics.fat + EXCLUDED.fat,
        fiber = daily_analytics.fiber + EXCLUDED.fiber,
        sugar = daily_analytics.sugar + EXCLUDED.sugar,
        water_ml = daily_analytics.water_ml + EXCLUDED.water_ml,
        workouts_completed = daily_analytics.workouts_completed + EXCLUDED.workouts_completed,
        workout_minutes = daily_analytics.workout_minutes + EXCLUDED.workout_minutes,
        strength_volume = daily_analytics.strength_volume + EXCLUDED.strength_volume,
        -- Replacement fields (use greatest for steps, latest for wellness)
        steps = GREATEST(daily_analytics.steps, EXCLUDED.steps),
        sleep_hours = CASE WHEN EXCLUDED.sleep_hours > 0 THEN EXCLUDED.sleep_hours ELSE daily_analytics.sleep_hours END,
        sleep_quality = CASE WHEN EXCLUDED.sleep_quality > 0 THEN EXCLUDED.sleep_quality ELSE daily_analytics.sleep_quality END,
        mood = CASE WHEN EXCLUDED.mood > 0 THEN EXCLUDED.mood ELSE daily_analytics.mood END,
        stress_level = CASE WHEN EXCLUDED.stress_level > 0 THEN EXCLUDED.stress_level ELSE daily_analytics.stress_level END,
        habits_completed = EXCLUDED.habits_completed,
        total_habits = EXCLUDED.total_habits,
        recovery_score = CASE WHEN EXCLUDED.recovery_score > 0 THEN EXCLUDED.recovery_score ELSE daily_analytics.recovery_score END,
        updated_at = timezone('utc', now());
END;
$$;

-- Q-RPC2 — log_event
-- Logs an analytics event for trend analysis
CREATE OR REPLACE FUNCTION log_event(
    p_user_id uuid,
    p_event_type text,
    p_value numeric DEFAULT NULL,
    p_meta jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    event_id uuid;
BEGIN
    INSERT INTO analytics_events (user_id, event_type, value, meta)
    VALUES (p_user_id, p_event_type, p_value, p_meta)
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$;

-- Q-RPC3 — get_daily_analytics(user_id, date)
-- Gets analytics for a specific day
CREATE OR REPLACE FUNCTION get_daily_analytics(
    p_user_id uuid,
    p_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    date date,
    calories int,
    protein int,
    carbs int,
    fat int,
    fiber int,
    sugar int,
    water_ml int,
    steps int,
    workouts_completed int,
    workout_minutes int,
    strength_volume int,
    sleep_hours decimal,
    sleep_quality int,
    mood int,
    stress_level int,
    habits_completed int,
    total_habits int,
    recovery_score int,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE sql
AS $$
    SELECT 
        id, user_id, date,
        calories, protein, carbs, fat, fiber, sugar, water_ml,
        steps, workouts_completed, workout_minutes, strength_volume,
        sleep_hours, sleep_quality, mood, stress_level,
        habits_completed, total_habits, recovery_score,
        created_at, updated_at
    FROM daily_analytics
    WHERE user_id = p_user_id AND date = p_date;
$$;

-- Q-RPC4 — get_analytics_range(user_id, start_date, end_date)
-- Gets analytics for a date range
CREATE OR REPLACE FUNCTION get_analytics_range(
    p_user_id uuid,
    p_start_date date,
    p_end_date date
)
RETURNS TABLE (
    date date,
    calories int,
    protein int,
    carbs int,
    fat int,
    steps int,
    workouts_completed int,
    sleep_hours decimal,
    mood int,
    recovery_score int
)
LANGUAGE sql
AS $$
    SELECT 
        date,
        calories, protein, carbs, fat,
        steps, workouts_completed,
        sleep_hours, mood, recovery_score
    FROM daily_analytics
    WHERE user_id = p_user_id
      AND date >= p_start_date
      AND date <= p_end_date
    ORDER BY date ASC;
$$;

-- Q-RPC5 — get_event_trends(user_id, event_type, days)
-- Gets event trends for analysis
CREATE OR REPLACE FUNCTION get_event_trends(
    p_user_id uuid,
    p_event_type text,
    p_days int DEFAULT 30
)
RETURNS TABLE (
    date date,
    event_count bigint,
    avg_value numeric,
    total_value numeric
)
LANGUAGE sql
AS $$
    SELECT 
        DATE(created_at) as date,
        COUNT(*) as event_count,
        AVG(value) as avg_value,
        SUM(value) as total_value
    FROM analytics_events
    WHERE user_id = p_user_id
      AND event_type = p_event_type
      AND created_at >= CURRENT_DATE - (p_days || ' days')::interval
    GROUP BY DATE(created_at)
    ORDER BY date ASC;
$$;

-- 5. VIEWS ------------------------------------------------

-- Q-VIEW1 — analytics_summary_view
-- Used for home dashboard, AI insights, weekly reports
CREATE OR REPLACE VIEW analytics_summary_view AS
SELECT
    user_id,
    date,
    calories,
    protein,
    carbs,
    fat,
    water_ml,
    steps,
    workouts_completed,
    workout_minutes,
    sleep_hours,
    sleep_quality,
    mood,
    stress_level,
    habits_completed,
    total_habits,
    recovery_score,
    created_at,
    updated_at
FROM daily_analytics;

-- Q-VIEW2 — analytics_weekly_summary
-- Weekly aggregates for trend analysis
CREATE OR REPLACE VIEW analytics_weekly_summary AS
SELECT
    user_id,
    date_trunc('week', date)::date as week_start,
    SUM(calories)::int as weekly_calories,
    SUM(protein)::int as weekly_protein,
    SUM(carbs)::int as weekly_carbs,
    SUM(fat)::int as weekly_fat,
    SUM(steps)::int as weekly_steps,
    SUM(workouts_completed)::int as weekly_workouts,
    SUM(workout_minutes)::int as weekly_workout_minutes,
    SUM(strength_volume)::int as weekly_strength_volume,
    AVG(sleep_hours)::decimal(4,2) as avg_sleep,
    AVG(sleep_quality)::numeric(3,1) as avg_sleep_quality,
    AVG(mood)::numeric(3,1) as avg_mood,
    AVG(stress_level)::numeric(3,1) as avg_stress,
    AVG(recovery_score)::numeric(3,1) as avg_recovery_score,
    SUM(habits_completed)::int as weekly_habits_completed,
    COUNT(*) as days_logged
FROM daily_analytics
GROUP BY user_id, date_trunc('week', date)
ORDER BY week_start DESC;

-- Q-VIEW3 — analytics_monthly_summary
-- Monthly aggregates
CREATE OR REPLACE VIEW analytics_monthly_summary AS
SELECT
    user_id,
    date_trunc('month', date)::date as month_start,
    SUM(calories)::int as monthly_calories,
    SUM(protein)::int as monthly_protein,
    SUM(steps)::int as monthly_steps,
    SUM(workouts_completed)::int as monthly_workouts,
    AVG(sleep_hours)::decimal(4,2) as avg_sleep,
    AVG(mood)::numeric(3,1) as avg_mood,
    AVG(recovery_score)::numeric(3,1) as avg_recovery_score,
    COUNT(*) as days_logged
FROM daily_analytics
GROUP BY user_id, date_trunc('month', date)
ORDER BY month_start DESC;

-- Q-VIEW4 — event_summary_view
-- Summary of events by type
CREATE OR REPLACE VIEW event_summary_view AS
SELECT
    user_id,
    event_type,
    COUNT(*) as event_count,
    AVG(value) as avg_value,
    SUM(value) as total_value,
    MIN(created_at) as first_occurrence,
    MAX(created_at) as last_occurrence
FROM analytics_events
GROUP BY user_id, event_type;

-- 6. TRIGGERS ---------------------------------------------

-- Auto-update updated_at on daily_analytics
CREATE OR REPLACE FUNCTION update_daily_analytics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_analytics_timestamp
BEFORE UPDATE ON daily_analytics
FOR EACH ROW
EXECUTE FUNCTION update_daily_analytics_timestamp();

-- 7. HELPER FUNCTIONS FOR MODULE INTEGRATION -------------

-- Q-RPC6 — sync_from_meal_log(user_id, date)
-- Syncs nutrition data from meal_logs
CREATE OR REPLACE FUNCTION sync_from_meal_log(
    p_user_id uuid,
    p_date date
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    total_cals int := 0;
    total_pro int := 0;
    total_carbs int := 0;
    total_fat int := 0;
    total_fiber int := 0;
    total_sugar int := 0;
    ml_record RECORD;
    food_cals numeric;
    food_pro numeric;
    food_carbs numeric;
    food_fat numeric;
    food_fiber numeric;
    food_sugar numeric;
BEGIN
    -- Aggregate from meal_logs
    FOR ml_record IN 
        SELECT * FROM meal_logs 
        WHERE user_id = p_user_id AND DATE(logged_at) = p_date
    LOOP
        IF ml_record.food_id IS NOT NULL THEN
            SELECT 
                COALESCE(calories, 0) * ml_record.quantity,
                COALESCE(protein, 0) * ml_record.quantity,
                COALESCE(carbs, 0) * ml_record.quantity,
                COALESCE(fat, 0) * ml_record.quantity,
                COALESCE(fiber, 0) * ml_record.quantity,
                COALESCE(sugar, 0) * ml_record.quantity
            INTO food_cals, food_pro, food_carbs, food_fat, food_fiber, food_sugar
            FROM foods
            WHERE id = ml_record.food_id;
            
            total_cals := total_cals + COALESCE(food_cals::int, 0);
            total_pro := total_pro + COALESCE(food_pro::int, 0);
            total_carbs := total_carbs + COALESCE(food_carbs::int, 0);
            total_fat := total_fat + COALESCE(food_fat::int, 0);
            total_fiber := total_fiber + COALESCE(food_fiber::int, 0);
            total_sugar := total_sugar + COALESCE(food_sugar::int, 0);
            
        ELSIF ml_record.user_food_id IS NOT NULL THEN
            SELECT 
                COALESCE(calories, 0) * ml_record.quantity,
                COALESCE(protein, 0) * ml_record.quantity,
                COALESCE(carbs, 0) * ml_record.quantity,
                COALESCE(fat, 0) * ml_record.quantity,
                COALESCE(fiber, 0) * ml_record.quantity,
                COALESCE(sugar, 0) * ml_record.quantity
            INTO food_cals, food_pro, food_carbs, food_fat, food_fiber, food_sugar
            FROM user_foods
            WHERE id = ml_record.user_food_id;
            
            total_cals := total_cals + COALESCE(food_cals::int, 0);
            total_pro := total_pro + COALESCE(food_pro::int, 0);
            total_carbs := total_carbs + COALESCE(food_carbs::int, 0);
            total_fat := total_fat + COALESCE(food_fat::int, 0);
            total_fiber := total_fiber + COALESCE(food_fiber::int, 0);
            total_sugar := total_sugar + COALESCE(food_sugar::int, 0);
            
        ELSIF ml_record.recipe_id IS NOT NULL THEN
            SELECT 
                COALESCE(total_calories, 0) * ml_record.quantity,
                COALESCE(total_protein, 0) * ml_record.quantity,
                COALESCE(total_carbs, 0) * ml_record.quantity,
                COALESCE(total_fat, 0) * ml_record.quantity,
                0, -- recipes don't have fiber/sugar in Module B
                0
            INTO food_cals, food_pro, food_carbs, food_fat, food_fiber, food_sugar
            FROM recipes
            WHERE id = ml_record.recipe_id;
            
            total_cals := total_cals + COALESCE(food_cals::int, 0);
            total_pro := total_pro + COALESCE(food_pro::int, 0);
            total_carbs := total_carbs + COALESCE(food_carbs::int, 0);
            total_fat := total_fat + COALESCE(food_fat::int, 0);
        END IF;
    END LOOP;
    
    -- Update daily_analytics
    PERFORM upsert_daily_analytics(
        p_user_id, p_date,
        total_cals, total_pro, total_carbs, total_fat, total_fiber, total_sugar,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    );
END;
$$;

-- Q-RPC7 — sync_from_workout(user_id, date)
-- Syncs workout data
CREATE OR REPLACE FUNCTION sync_from_workout(
    p_user_id uuid,
    p_date date
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    total_workouts int := 0;
    total_minutes int := 0;
    total_volume int := 0;
BEGIN
    -- Count workout sessions
    SELECT COUNT(*), COALESCE(SUM(duration_minutes), 0)
    INTO total_workouts, total_minutes
    FROM workout_logs
    WHERE user_id = p_user_id AND DATE(completed_at) = p_date;
    
    -- Calculate strength volume (from set_logs)
    SELECT COALESCE(SUM(weight * reps), 0)
    INTO total_volume
    FROM set_logs sl
    JOIN workout_logs wl ON sl.workout_log_id = wl.id
    WHERE wl.user_id = p_user_id 
      AND DATE(wl.completed_at) = p_date
      AND sl.weight IS NOT NULL;
    
    -- Update daily_analytics
    PERFORM upsert_daily_analytics(
        p_user_id, p_date,
        0, 0, 0, 0, 0, 0, 0,
        0, total_workouts, total_minutes, total_volume::int,
        0, 0, 0, 0, 0, 0, 0
    );
END;
$$;

-- Q-RPC8 — sync_from_wellness(user_id, date)
-- Syncs wellness data (sleep, mood, habits)
CREATE OR REPLACE FUNCTION sync_from_wellness(
    p_user_id uuid,
    p_date date
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    sleep_h decimal := 0;
    sleep_q int := 0;
    mood_val int := 0;
    habits_comp int := 0;
    habits_tot int := 0;
BEGIN
    -- Get latest sleep log
    SELECT hours, quality
    INTO sleep_h, sleep_q
    FROM sleep_logs
    WHERE user_id = p_user_id AND DATE(created_at) = p_date
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Get latest mood
    SELECT mood_value
    INTO mood_val
    FROM moods
    WHERE user_id = p_user_id AND DATE(created_at) = p_date
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Count habits
    SELECT 
        COUNT(*) FILTER (WHERE completed = true),
        COUNT(*)
    INTO habits_comp, habits_tot
    FROM habit_logs
    WHERE user_id = p_user_id AND date = p_date;
    
    -- Update daily_analytics
    PERFORM upsert_daily_analytics(
        p_user_id, p_date,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0,
        COALESCE(sleep_h, 0), COALESCE(sleep_q, 0), COALESCE(mood_val, 0), 0,
        COALESCE(habits_comp, 0), COALESCE(habits_tot, 0), 0
    );
END;
$$;

