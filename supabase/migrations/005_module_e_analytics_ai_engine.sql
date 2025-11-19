-- =========================================================
-- MODULE E — ANALYTICS + AI ENGINE
-- Data aggregation, weekly insights, predictions, trend detection, AI coach recommendations
-- =========================================================

-- 1. TABLES -----------------------------------------------

-- E1 — analytics_daily_summary
CREATE TABLE analytics_daily_summary (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    date date NOT NULL,

    -- Aggregated Nutrition
    calories_consumed int,
    protein int,
    carbs int,
    fats int,
    water_ml int,

    -- Activity
    steps int,
    workouts_completed int,

    -- Wellness
    mood int,              -- 1–5 scale
    sleep_hours numeric,
    stress_level int,      -- optional future feature

    -- Scores
    nutrition_score int,   -- 0–100
    fitness_score int,     -- 0–100
    wellness_score int,    -- 0–100
    overall_score int,     -- weighted

    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- Unique per user/date
CREATE UNIQUE INDEX idx_analytics_daily_summary_user_date ON analytics_daily_summary (user_id, date);

-- E2 — analytics_weekly_summary
CREATE TABLE analytics_weekly_summary (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    week_start date NOT NULL,

    avg_calories numeric,
    avg_protein numeric,
    avg_steps numeric,
    avg_sleep numeric,
    avg_mood numeric,

    trend_weight numeric,
    trend_calories numeric,
    trend_sleep numeric,
    trend_mood numeric,
    trend_steps numeric,

    insights jsonb,     -- ["You are sleeping 1.2h less than usual", ...]
    recommendations jsonb, -- ["Increase protein by 25g/day", ...]

    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Unique per user/week
CREATE UNIQUE INDEX idx_analytics_weekly_summary_user_week ON analytics_weekly_summary (user_id, week_start);

-- E3 — prediction_engine
CREATE TABLE prediction_engine (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    date date NOT NULL,

    feature_vector jsonb,  -- normalized inputs
    predicted_weight numeric,
    predicted_sleep numeric,
    predicted_mood numeric,
    predicted_steps numeric,
    predicted_calories numeric,

    confidence numeric,    -- 0–1 score
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- E4 — user_insights_feed
CREATE TABLE user_insights_feed (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,

    message text,
    type text,         -- success, warning, alert, info
    context jsonb,     -- data behind the insight
    generated_at timestamptz DEFAULT timezone('utc', now()),
    seen boolean DEFAULT false
);

-- 2. RLS (Row Level Security) ----------------------------

ALTER TABLE analytics_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_weekly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_engine ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_insights_feed ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "user owns analytics"
ON analytics_daily_summary
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user owns weekly analytics"
ON analytics_weekly_summary
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user owns predictions"
ON prediction_engine
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user owns insights"
ON user_insights_feed
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- INDEXES for performance ---------------------------------

CREATE INDEX idx_analytics_daily_user_date ON analytics_daily_summary(user_id, date);
CREATE INDEX idx_analytics_weekly_user_week ON analytics_weekly_summary(user_id, week_start);
CREATE INDEX idx_prediction_engine_user_date ON prediction_engine(user_id, date);
CREATE INDEX idx_user_insights_feed_user_seen ON user_insights_feed(user_id, seen);

-- 3. RPC FUNCTIONS ---------------------------------------

-- RPC E1 — aggregate_daily_data(uid, for_date)
-- Pulls meal logs, workouts, steps, mood, sleep from Modules B–D
CREATE OR REPLACE FUNCTION aggregate_daily_data(uid uuid, for_date date)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    cals numeric := 0;
    pro numeric := 0;
    car numeric := 0;
    fat numeric := 0;
    water_data int := 0;
    steps_data int := 0;
    workouts int := 0;
    mood_data int;
    sleep_data numeric;
    ml_record record;
    food_calories numeric;
    food_protein numeric;
    food_carbs numeric;
    food_fat numeric;
BEGIN
    -- Nutrition: Calculate from meal_logs
    -- Join with foods/user_foods/recipes to get nutrition values
    FOR ml_record IN 
        SELECT ml.*, ml.quantity as qty
        FROM meal_logs ml
        WHERE ml.user_id = uid AND ml.logged_at = for_date
    LOOP
        -- Calculate nutrition based on food_id, user_food_id, or recipe_id
        IF ml_record.food_id IS NOT NULL THEN
            SELECT 
                COALESCE(calories, 0) * ml_record.qty,
                COALESCE(protein, 0) * ml_record.qty,
                COALESCE(carbs, 0) * ml_record.qty,
                COALESCE(fat, 0) * ml_record.qty
            INTO food_calories, food_protein, food_carbs, food_fat
            FROM foods
            WHERE id = ml_record.food_id;
            
            cals := cals + COALESCE(food_calories, 0);
            pro := pro + COALESCE(food_protein, 0);
            car := car + COALESCE(food_carbs, 0);
            fat := fat + COALESCE(food_fat, 0);
            
        ELSIF ml_record.user_food_id IS NOT NULL THEN
            SELECT 
                COALESCE(calories, 0) * ml_record.qty,
                COALESCE(protein, 0) * ml_record.qty,
                COALESCE(carbs, 0) * ml_record.qty,
                COALESCE(fat, 0) * ml_record.qty
            INTO food_calories, food_protein, food_carbs, food_fat
            FROM user_foods
            WHERE id = ml_record.user_food_id;
            
            cals := cals + COALESCE(food_calories, 0);
            pro := pro + COALESCE(food_protein, 0);
            car := car + COALESCE(food_carbs, 0);
            fat := fat + COALESCE(food_fat, 0);
            
        ELSIF ml_record.recipe_id IS NOT NULL THEN
            -- For recipes, use the total values (already calculated)
            SELECT 
                COALESCE(total_calories, 0) * ml_record.qty,
                COALESCE(total_protein, 0) * ml_record.qty,
                COALESCE(total_carbs, 0) * ml_record.qty,
                COALESCE(total_fat, 0) * ml_record.qty
            INTO food_calories, food_protein, food_carbs, food_fat
            FROM recipes
            WHERE id = ml_record.recipe_id;
            
            cals := cals + COALESCE(food_calories, 0);
            pro := pro + COALESCE(food_protein, 0);
            car := car + COALESCE(food_carbs, 0);
            fat := fat + COALESCE(food_fat, 0);
        END IF;
    END LOOP;

    -- Steps
    SELECT COALESCE(steps, 0)
    INTO steps_data
    FROM steps_tracking
    WHERE user_id = uid AND date = for_date
    LIMIT 1;

    -- Workouts (count sessions that started on this date)
    SELECT COUNT(*)
    INTO workouts
    FROM workout_sessions
    WHERE user_id = uid 
      AND DATE(start_time) = for_date;

    -- Mood
    SELECT mood_value
    INTO mood_data
    FROM moods
    WHERE user_id = uid 
      AND DATE(created_at) = for_date
    ORDER BY created_at DESC
    LIMIT 1;

    -- Sleep
    SELECT hours
    INTO sleep_data
    FROM sleep_logs
    WHERE user_id = uid 
      AND DATE(created_at) = for_date
    ORDER BY created_at DESC
    LIMIT 1;

    -- Upsert Daily Summary
    INSERT INTO analytics_daily_summary (
        user_id, date, calories_consumed, protein, carbs, fats,
        water_ml, steps, workouts_completed, mood, sleep_hours
    )
    VALUES (
        uid, for_date, cals::int, pro::int, car::int, fat::int,
        water_data, steps_data, workouts, mood_data, sleep_data
    )
    ON CONFLICT (user_id, date) DO UPDATE
    SET calories_consumed = EXCLUDED.calories_consumed,
        protein = EXCLUDED.protein,
        carbs = EXCLUDED.carbs,
        fats = EXCLUDED.fats,
        water_ml = EXCLUDED.water_ml,
        steps = EXCLUDED.steps,
        workouts_completed = EXCLUDED.workouts_completed,
        mood = EXCLUDED.mood,
        sleep_hours = EXCLUDED.sleep_hours,
        updated_at = timezone('utc', now());
END;
$$;

-- RPC E2 — compute_weekly_summary(uid, week_start)
-- Generates insights & recommendations
CREATE OR REPLACE FUNCTION compute_weekly_summary(uid uuid, week_start date)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    avgcal numeric;
    avgpro numeric;
    avgsteps numeric;
    avgsleep numeric;
    avgmood numeric;
    insights_json jsonb := '[]'::jsonb;
    recs_json jsonb := '[]'::jsonb;
BEGIN
    -- Get averages
    SELECT
        AVG(calories_consumed),
        AVG(protein),
        AVG(steps),
        AVG(sleep_hours),
        AVG(mood)
    INTO avgcal, avgpro, avgsteps, avgsleep, avgmood
    FROM analytics_daily_summary
    WHERE user_id = uid
      AND date >= week_start
      AND date < week_start + INTERVAL '7 days';

    -- Example insight rules
    IF avgsleep < 6 THEN
        insights_json := insights_json || jsonb_build_array('You slept less than 6 hours on average.');
        recs_json := recs_json || jsonb_build_array('Try a sleep wind-down routine 30 minutes before bed.');
    END IF;

    IF avgsteps < 5000 THEN
        insights_json := insights_json || jsonb_build_array('Your step count is below 5,000/day.');
        recs_json := recs_json || jsonb_build_array('Aim for at least 1 short walk daily.');
    END IF;

    IF avgcal IS NOT NULL AND avgcal < 1200 THEN
        insights_json := insights_json || jsonb_build_array('Your calorie intake is very low.');
        recs_json := recs_json || jsonb_build_array('Consider increasing portion sizes or adding healthy snacks.');
    END IF;

    IF avgmood IS NOT NULL AND avgmood < 3 THEN
        insights_json := insights_json || jsonb_build_array('Your mood has been lower than usual.');
        recs_json := recs_json || jsonb_build_array('Try a 5-minute meditation or gratitude practice.');
    END IF;

    -- Insert weekly summary
    INSERT INTO analytics_weekly_summary(
        user_id, week_start,
        avg_calories, avg_protein, avg_steps, avg_sleep, avg_mood,
        insights, recommendations
    )
    VALUES (
        uid, week_start,
        avgcal, avgpro, avgsteps, avgsleep, avgmood,
        insights_json, recs_json
    )
    ON CONFLICT (user_id, week_start) DO UPDATE
    SET avg_calories = EXCLUDED.avg_calories,
        avg_protein = EXCLUDED.avg_protein,
        avg_steps = EXCLUDED.avg_steps,
        avg_sleep = EXCLUDED.avg_sleep,
        avg_mood = EXCLUDED.avg_mood,
        insights = EXCLUDED.insights,
        recommendations = EXCLUDED.recommendations;
END;
$$;

-- RPC E3 — push_insight(uid, message, type, json)
CREATE OR REPLACE FUNCTION push_insight(
    uid uuid,
    message text,
    insight_type text,
    ctx jsonb
)
RETURNS void
LANGUAGE sql
AS $$
    INSERT INTO user_insights_feed (user_id, message, type, context)
    VALUES (uid, message, insight_type, ctx);
$$;

-- RPC E4 — save_prediction(uid, date, ...)
-- Stores prediction outputs; frontend AI will calculate values
CREATE OR REPLACE FUNCTION save_prediction(
    uid uuid,
    for_date date,
    fv jsonb,
    p_weight numeric,
    p_sleep numeric,
    p_mood numeric,
    p_steps numeric,
    p_calories numeric,
    conf numeric
)
RETURNS void
LANGUAGE sql
AS $$
    INSERT INTO prediction_engine (
        user_id, date, feature_vector,
        predicted_weight, predicted_sleep, predicted_mood,
        predicted_steps, predicted_calories,
        confidence
    ) VALUES (
        uid, for_date, fv,
        p_weight, p_sleep, p_mood,
        p_steps, p_calories,
        conf
    );
$$;

