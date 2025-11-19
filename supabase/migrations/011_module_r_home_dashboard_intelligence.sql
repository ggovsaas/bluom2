-- =========================================================
-- MODULE R — HOME DASHBOARD INTELLIGENCE LAYER
-- Smart summaries, AI insights, trends, alerts, recommendations for home dashboard
-- =========================================================

-- 1. TABLES -----------------------------------------------

-- R1 — daily_summaries
-- Stores aggregated metrics for fast dashboard loading (optimized for home screen)
CREATE TABLE IF NOT EXISTS daily_summaries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    date date NOT NULL,
    
    -- Nutrition (with targets for comparison)
    calories_consumed numeric DEFAULT 0,
    calories_target numeric,
    protein_consumed numeric DEFAULT 0,
    protein_target numeric,
    carbs_consumed numeric DEFAULT 0,
    carbs_target numeric,
    fats_consumed numeric DEFAULT 0,
    fats_target numeric,
    
    -- Activity
    steps int DEFAULT 0,
    steps_target int,
    water_ml int DEFAULT 0,
    water_target_ml int,
    
    -- Wellness
    mood text,              -- Can be text or int (1-5)
    mood_value int,         -- 1-5 scale for consistency
    sleep_hours numeric,
    sleep_target_hours numeric,
    
    -- Workouts
    workout_completed boolean DEFAULT false,
    workout_minutes int DEFAULT 0,
    workout_calories numeric DEFAULT 0,
    workout_name text,
    
    -- Habits
    habits_completed int DEFAULT 0,
    habits_total int DEFAULT 0,
    
    -- Quick access flags
    has_logged_breakfast boolean DEFAULT false,
    has_logged_lunch boolean DEFAULT false,
    has_logged_dinner boolean DEFAULT false,
    has_logged_water boolean DEFAULT false,
    has_logged_mood boolean DEFAULT false,
    has_logged_sleep boolean DEFAULT false,
    
    updated_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, date)
);

-- R2 — insights
-- AI-generated insights to show on dashboard
CREATE TABLE IF NOT EXISTS insights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    date date NOT NULL,
    type text NOT NULL, -- sleep, workout, nutrition, mood, recovery, hydration, habit, general
    insight text NOT NULL,
    action_step text,
    severity int DEFAULT 1 CHECK (severity BETWEEN 1 AND 5), -- 1=info, 5=critical
    ai_generated boolean DEFAULT true,
    seen boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- 2. RLS (Row-Level Security) ----------------------------

ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "users_manage_own_daily_summaries"
ON daily_summaries
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_insights"
ON insights
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. INDEXES ----------------------------------------------

CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON daily_summaries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_insights_user_date ON insights(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_insights_user_seen ON insights(user_id, seen) WHERE seen = false;
CREATE INDEX IF NOT EXISTS idx_insights_user_type ON insights(user_id, type);

-- 4. RPC FUNCTIONS ---------------------------------------

-- R-RPC1 — update_daily_summary(user_id, date)
-- Aggregates all data for a day and updates daily_summaries
CREATE OR REPLACE FUNCTION update_daily_summary(
    user_id_param uuid,
    date_param date DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    calories_sum numeric := 0;
    protein_sum numeric := 0;
    carbs_sum numeric := 0;
    fats_sum numeric := 0;
    water_sum int := 0;
    steps_val int := 0;
    mood_val text;
    mood_int int;
    sleep_val numeric;
    workout_count int := 0;
    workout_duration int := 0;
    workout_calories_sum numeric := 0;
    workout_name_val text;
    habits_completed_count int := 0;
    habits_total_count int := 0;
    calories_target_val numeric;
    protein_target_val numeric;
    carbs_target_val numeric;
    fats_target_val numeric;
    steps_target_val int;
    water_target_val int;
    sleep_target_val numeric;
    ml_record record;
    food_calories numeric;
    food_protein numeric;
    food_carbs numeric;
    food_fat numeric;
    has_breakfast boolean := false;
    has_lunch boolean := false;
    has_dinner boolean := false;
BEGIN
    -- Get targets from user_goals (Module A)
    SELECT 
        calories_target, protein_target, carbs_target, fats_target,
        steps_target, sleep_hours_target
    INTO 
        calories_target_val, protein_target_val, carbs_target_val, fats_target_val,
        steps_target_val, sleep_target_val
    FROM user_goals
    WHERE user_id = user_id_param
    ORDER BY generated_at DESC
    LIMIT 1;
    
    -- Calculate nutrition from meal_logs (Module B)
    FOR ml_record IN 
        SELECT ml.*, ml.quantity as qty
        FROM meal_logs ml
        WHERE ml.user_id = user_id_param AND ml.logged_at = date_param
    LOOP
        -- Check meal types
        IF ml_record.meal = 'breakfast' THEN has_breakfast := true;
        ELSIF ml_record.meal = 'lunch' THEN has_lunch := true;
        ELSIF ml_record.meal = 'dinner' THEN has_dinner := true;
        END IF;
        
        -- Calculate nutrition (same logic as Module E)
        IF ml_record.food_id IS NOT NULL THEN
            SELECT 
                COALESCE(calories, 0) * ml_record.qty,
                COALESCE(protein, 0) * ml_record.qty,
                COALESCE(carbs, 0) * ml_record.qty,
                COALESCE(fat, 0) * ml_record.qty
            INTO food_calories, food_protein, food_carbs, food_fat
            FROM foods
            WHERE id = ml_record.food_id;
            
            calories_sum := calories_sum + COALESCE(food_calories, 0);
            protein_sum := protein_sum + COALESCE(food_protein, 0);
            carbs_sum := carbs_sum + COALESCE(food_carbs, 0);
            fats_sum := fats_sum + COALESCE(food_fat, 0);
            
        ELSIF ml_record.user_food_id IS NOT NULL THEN
            SELECT 
                COALESCE(calories, 0) * ml_record.qty,
                COALESCE(protein, 0) * ml_record.qty,
                COALESCE(carbs, 0) * ml_record.qty,
                COALESCE(fat, 0) * ml_record.qty
            INTO food_calories, food_protein, food_carbs, food_fat
            FROM user_foods
            WHERE id = ml_record.user_food_id;
            
            calories_sum := calories_sum + COALESCE(food_calories, 0);
            protein_sum := protein_sum + COALESCE(food_protein, 0);
            carbs_sum := carbs_sum + COALESCE(food_carbs, 0);
            fats_sum := fats_sum + COALESCE(food_fat, 0);
            
        ELSIF ml_record.recipe_id IS NOT NULL THEN
            SELECT 
                COALESCE(total_calories, 0) * ml_record.qty,
                COALESCE(total_protein, 0) * ml_record.qty,
                COALESCE(total_carbs, 0) * ml_record.qty,
                COALESCE(total_fat, 0) * ml_record.qty
            INTO food_calories, food_protein, food_carbs, food_fat
            FROM recipes
            WHERE id = ml_record.recipe_id;
            
            calories_sum := calories_sum + COALESCE(food_calories, 0);
            protein_sum := protein_sum + COALESCE(food_protein, 0);
            carbs_sum := carbs_sum + COALESCE(food_carbs, 0);
            fats_sum := fats_sum + COALESCE(food_fat, 0);
        END IF;
    END LOOP;
    
    -- Get steps (Module D)
    SELECT COALESCE(steps, 0)
    INTO steps_val
    FROM steps_tracking
    WHERE user_id = user_id_param AND date = date_param
    LIMIT 1;
    
    -- Get mood (Module C)
    SELECT mood_value, 
           CASE 
               WHEN mood_value = 1 THEN 'very_low'
               WHEN mood_value = 2 THEN 'low'
               WHEN mood_value = 3 THEN 'neutral'
               WHEN mood_value = 4 THEN 'good'
               WHEN mood_value = 5 THEN 'great'
               ELSE NULL
           END
    INTO mood_int, mood_val
    FROM moods
    WHERE user_id = user_id_param 
      AND DATE(created_at) = date_param
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Get sleep (Module C)
    SELECT hours
    INTO sleep_val
    FROM sleep_logs
    WHERE user_id = user_id_param 
      AND DATE(created_at) = date_param
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Get workouts (Module M or Module D)
    SELECT 
        COUNT(*),
        COALESCE(SUM(duration_minutes), 0),
        COALESCE(SUM(calories_burned), 0),
        MAX(name)
    INTO workout_count, workout_duration, workout_calories_sum, workout_name_val
    FROM workout_logs
    WHERE user_id = user_id_param 
      AND DATE(completed_at) = date_param;
    
    -- If no workout_logs, check workout_sessions (Module D)
    IF workout_count = 0 THEN
        SELECT 
            COUNT(*),
            COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 60)::int, 0),
            0,
            'Workout'
        INTO workout_count, workout_duration, workout_calories_sum, workout_name_val
        FROM workout_sessions
        WHERE user_id = user_id_param 
          AND DATE(start_time) = date_param;
    END IF;
    
    -- Get habits (Module C)
    SELECT 
        COUNT(*) FILTER (WHERE completed = true),
        COUNT(*)
    INTO habits_completed_count, habits_total_count
    FROM habit_logs
    WHERE user_id = user_id_param AND date = date_param;
    
    -- Get total habits for user
    SELECT COUNT(*)
    INTO habits_total_count
    FROM habits
    WHERE user_id = user_id_param;
    
    -- Water target (default 2000ml if not set)
    water_target_val := COALESCE(2000, NULL);
    
    -- Upsert daily summary
    INSERT INTO daily_summaries (
        user_id, date,
        calories_consumed, calories_target,
        protein_consumed, protein_target,
        carbs_consumed, carbs_target,
        fats_consumed, fats_target,
        steps, steps_target,
        water_ml, water_target_ml,
        mood, mood_value,
        sleep_hours, sleep_target_hours,
        workout_completed, workout_minutes, workout_calories, workout_name,
        habits_completed, habits_total,
        has_logged_breakfast, has_logged_lunch, has_logged_dinner,
        has_logged_water, has_logged_mood, has_logged_sleep
    )
    VALUES (
        user_id_param, date_param,
        calories_sum, calories_target_val,
        protein_sum, protein_target_val,
        carbs_sum, carbs_target_val,
        fats_sum, fats_target_val,
        steps_val, steps_target_val,
        water_sum, water_target_val,
        mood_val, mood_int,
        sleep_val, sleep_target_val,
        workout_count > 0, workout_duration, workout_calories_sum, workout_name_val,
        habits_completed_count, habits_total_count,
        has_breakfast, has_lunch, has_dinner,
        water_sum > 0, mood_int IS NOT NULL, sleep_val IS NOT NULL
    )
    ON CONFLICT (user_id, date) DO UPDATE
    SET 
        calories_consumed = EXCLUDED.calories_consumed,
        calories_target = EXCLUDED.calories_target,
        protein_consumed = EXCLUDED.protein_consumed,
        protein_target = EXCLUDED.protein_target,
        carbs_consumed = EXCLUDED.carbs_consumed,
        carbs_target = EXCLUDED.carbs_target,
        fats_consumed = EXCLUDED.fats_consumed,
        fats_target = EXCLUDED.fats_target,
        steps = EXCLUDED.steps,
        steps_target = EXCLUDED.steps_target,
        water_ml = EXCLUDED.water_ml,
        water_target_ml = EXCLUDED.water_target_ml,
        mood = EXCLUDED.mood,
        mood_value = EXCLUDED.mood_value,
        sleep_hours = EXCLUDED.sleep_hours,
        sleep_target_hours = EXCLUDED.sleep_target_hours,
        workout_completed = EXCLUDED.workout_completed,
        workout_minutes = EXCLUDED.workout_minutes,
        workout_calories = EXCLUDED.workout_calories,
        workout_name = EXCLUDED.workout_name,
        habits_completed = EXCLUDED.habits_completed,
        habits_total = EXCLUDED.habits_total,
        has_logged_breakfast = EXCLUDED.has_logged_breakfast,
        has_logged_lunch = EXCLUDED.has_logged_lunch,
        has_logged_dinner = EXCLUDED.has_logged_dinner,
        has_logged_water = EXCLUDED.has_logged_water,
        has_logged_mood = EXCLUDED.has_logged_mood,
        has_logged_sleep = EXCLUDED.has_logged_sleep,
        updated_at = timezone('utc', now());
END;
$$;

-- R-RPC2 — get_dashboard_summary(user_id, date)
-- Get today's dashboard summary
CREATE OR REPLACE FUNCTION get_dashboard_summary(
    user_id_param uuid,
    date_param date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT to_jsonb(ds.*)
    FROM daily_summaries ds
    WHERE ds.user_id = user_id_param
      AND ds.date = date_param;
$$;

-- R-RPC3 — save_insight(user_id, date, type, insight, action_step, severity)
-- Save AI-generated insight
CREATE OR REPLACE FUNCTION save_insight(
    user_id_param uuid,
    date_param date,
    type_param text,
    insight_param text,
    action_step_param text DEFAULT NULL,
    severity_param int DEFAULT 1
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    insight_id uuid;
BEGIN
    INSERT INTO insights (
        user_id, date, type, insight, action_step, severity
    )
    VALUES (
        user_id_param, date_param, type_param, insight_param, action_step_param, severity_param
    )
    RETURNING id INTO insight_id;
    
    RETURN insight_id;
END;
$$;

-- R-RPC4 — get_today_insights(user_id, date)
-- Get insights for today
CREATE OR REPLACE FUNCTION get_today_insights(
    user_id_param uuid,
    date_param date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    id uuid,
    type text,
    insight text,
    action_step text,
    severity int,
    seen boolean,
    created_at timestamptz
)
LANGUAGE sql
AS $$
    SELECT id, type, insight, action_step, severity, seen, created_at
    FROM insights
    WHERE user_id = user_id_param
      AND date = date_param
    ORDER BY severity DESC, created_at DESC
    LIMIT 10;
$$;

-- R-RPC5 — mark_insight_seen(insight_id)
-- Mark insight as seen
CREATE OR REPLACE FUNCTION mark_insight_seen(insight_id uuid)
RETURNS void
LANGUAGE sql
AS $$
    UPDATE insights
    SET seen = true
    WHERE id = insight_id AND user_id = auth.uid();
$$;

-- R-RPC6 — get_dashboard_quick_stats(user_id)
-- Get quick stats for dashboard widgets
CREATE OR REPLACE FUNCTION get_dashboard_quick_stats(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    today_summary jsonb;
    yesterday_summary jsonb;
    week_avg jsonb;
    result jsonb;
BEGIN
    -- Get today's summary
    SELECT to_jsonb(ds.*) INTO today_summary
    FROM daily_summaries ds
    WHERE ds.user_id = user_id_param
      AND ds.date = CURRENT_DATE;
    
    -- Get yesterday's summary
    SELECT to_jsonb(ds.*) INTO yesterday_summary
    FROM daily_summaries ds
    WHERE ds.user_id = user_id_param
      AND ds.date = CURRENT_DATE - INTERVAL '1 day';
    
    -- Get week average
    SELECT jsonb_build_object(
        'avg_calories', AVG(calories_consumed),
        'avg_protein', AVG(protein_consumed),
        'avg_steps', AVG(steps),
        'avg_sleep', AVG(sleep_hours),
        'avg_mood', AVG(mood_value)
    ) INTO week_avg
    FROM daily_summaries
    WHERE user_id = user_id_param
      AND date >= CURRENT_DATE - INTERVAL '7 days';
    
    -- Combine
    result := jsonb_build_object(
        'today', COALESCE(today_summary, '{}'::jsonb),
        'yesterday', COALESCE(yesterday_summary, '{}'::jsonb),
        'week_average', COALESCE(week_avg, '{}'::jsonb)
    );
    
    RETURN result;
END;
$$;

-- R-RPC7 — get_missing_logs(user_id)
-- Get what user hasn't logged today (for smart reminders)
CREATE OR REPLACE FUNCTION get_missing_logs(user_id_param uuid)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_build_object(
        'breakfast', NOT COALESCE(has_logged_breakfast, false),
        'lunch', NOT COALESCE(has_logged_lunch, false),
        'dinner', NOT COALESCE(has_logged_dinner, false),
        'water', NOT COALESCE(has_logged_water, false),
        'mood', NOT COALESCE(has_logged_mood, false),
        'sleep', NOT COALESCE(has_logged_sleep, false),
        'workout', NOT COALESCE(workout_completed, false)
    )
    FROM daily_summaries
    WHERE user_id = user_id_param
      AND date = CURRENT_DATE;
$$;

-- 5. TRIGGERS ---------------------------------------------

-- Auto-update updated_at on daily_summaries
CREATE OR REPLACE FUNCTION update_daily_summaries_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_summaries_timestamp
BEFORE UPDATE ON daily_summaries
FOR EACH ROW
EXECUTE FUNCTION update_daily_summaries_timestamp();

-- 6. HELPER VIEWS -----------------------------------------

-- View: Today's dashboard summary
CREATE OR REPLACE VIEW today_dashboard AS
SELECT 
    ds.*,
    CASE 
        WHEN ds.calories_target > 0 THEN 
            ROUND((ds.calories_consumed / ds.calories_target * 100)::numeric, 1)
        ELSE NULL
    END as calories_percentage,
    CASE 
        WHEN ds.protein_target > 0 THEN 
            ROUND((ds.protein_consumed / ds.protein_target * 100)::numeric, 1)
        ELSE NULL
    END as protein_percentage,
    CASE 
        WHEN ds.steps_target > 0 THEN 
            ROUND((ds.steps::numeric / ds.steps_target * 100)::numeric, 1)
        ELSE NULL
    END as steps_percentage
FROM daily_summaries ds
WHERE ds.date = CURRENT_DATE;

