-- =========================================================
-- CORE LAUNCH SCHEMA — 5 ESSENTIAL MODULES ONLY
-- Auth + Subscriptions + Data Engine + Personalization + Dashboard + Notifications
-- =========================================================

-- =========================================================
-- 1. AUTH + USER PROFILES
-- =========================================================

CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    gender text,
    age int,
    height_cm int,
    weight_kg numeric,
    timezone text DEFAULT 'UTC',
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- =========================================================
-- 2. SUBSCRIPTIONS (Stripe)
-- =========================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status text NOT NULL, -- 'active', 'trialing', 'past_due', 'canceled', 'incomplete'
    plan text NOT NULL, -- 'free', 'premium_monthly', 'premium_yearly'
    stripe_subscription_id text,
    stripe_customer_id text,
    trial_end timestamptz,
    current_period_end timestamptz,
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- Auto-create free subscription on signup
CREATE OR REPLACE FUNCTION create_free_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO subscriptions (user_id, status, plan)
    VALUES (NEW.id, 'active', 'free');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_created
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION create_free_subscription();

-- =========================================================
-- 3. USER SETTINGS
-- =========================================================

CREATE TABLE IF NOT EXISTS user_settings (
    user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    daily_calorie_target int DEFAULT 2000,
    macro_split jsonb DEFAULT '{"protein": 30, "carbs": 40, "fats": 30}'::jsonb,
    send_notifications boolean DEFAULT true,
    water_goal_ml int DEFAULT 2500,
    steps_goal int DEFAULT 8000,
    sleep_goal_hours numeric DEFAULT 8,
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- =========================================================
-- 4. FUEL SYSTEM (Meals, Foods, Recipes)
-- =========================================================

CREATE TABLE IF NOT EXISTS foods (
    id bigserial PRIMARY KEY,
    name text NOT NULL,
    brand text,
    calories int,
    protein numeric,
    carbs numeric,
    fat numeric,
    fiber numeric,
    sugar numeric,
    serving_size text,
    barcode text,
    source text DEFAULT 'manual', -- 'fatsecret', 'usda', 'manual'
    created_at timestamptz DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS recipes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    instructions text,
    total_calories int,
    total_protein numeric,
    total_carbs numeric,
    total_fat numeric,
    servings int DEFAULT 1,
    created_at timestamptz DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS recipe_items (
    id bigserial PRIMARY KEY,
    recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    food_id bigint REFERENCES foods(id),
    quantity numeric NOT NULL,
    unit text DEFAULT 'g'
);

CREATE TABLE IF NOT EXISTS meal_logs (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date date NOT NULL DEFAULT CURRENT_DATE,
    meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    food_id bigint REFERENCES foods(id),
    recipe_id uuid REFERENCES recipes(id),
    quantity numeric NOT NULL DEFAULT 1,
    calories int,
    protein numeric,
    carbs numeric,
    fat numeric,
    created_at timestamptz DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS water_logs (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    ml int NOT NULL,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- =========================================================
-- 5. MOVE SYSTEM (Workouts, Exercises, Steps)
-- =========================================================

CREATE TABLE IF NOT EXISTS exercise_db (
    id bigserial PRIMARY KEY,
    name text NOT NULL,
    muscle_group text,
    equipment text,
    video_url text,
    instructions text,
    created_at timestamptz DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS workout_routines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    created_at timestamptz DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS workout_exercises (
    id bigserial PRIMARY KEY,
    routine_id uuid NOT NULL REFERENCES workout_routines(id) ON DELETE CASCADE,
    exercise_id bigint NOT NULL REFERENCES exercise_db(id),
    sets int DEFAULT 3,
    reps int,
    rest_seconds int DEFAULT 60,
    order_index int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS workout_logs (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_id bigint NOT NULL REFERENCES exercise_db(id),
    routine_id uuid REFERENCES workout_routines(id),
    sets jsonb NOT NULL, -- [{"weight": 50, "reps": 10, "rest": 60}, ...]
    duration_minutes int,
    calories_burned int,
    created_at timestamptz DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS steps_logs (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    steps int NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, date)
);

-- =========================================================
-- 6. WELLNESS SYSTEM (Sleep, Mood, Habits)
-- =========================================================

CREATE TABLE IF NOT EXISTS sleep_logs (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    hours numeric NOT NULL,
    quality int CHECK (quality BETWEEN 1 AND 5),
    date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS mood_logs (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mood int NOT NULL CHECK (mood BETWEEN 1 AND 5),
    note text,
    created_at timestamptz DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS habits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    category text, -- 'health', 'productivity', 'wellness'
    created_at timestamptz DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS habit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date date NOT NULL DEFAULT CURRENT_DATE,
    completed boolean DEFAULT true,
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(habit_id, date)
);

-- =========================================================
-- 7. PERSONALIZATION (Onboarding + Generated Plans)
-- =========================================================

CREATE TABLE IF NOT EXISTS onboarding_answers (
    user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    answers jsonb NOT NULL, -- {q1: "answer1", q2: "answer2", ...}
    completed_at timestamptz DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS generated_meal_plan (
    user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    plan jsonb NOT NULL, -- {daily_calories: 2000, macros: {...}, meals: [...]}
    updated_at timestamptz DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS generated_workout_plan (
    user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    plan jsonb NOT NULL, -- {frequency: 4, split: "upper/lower", exercises: [...]}
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- =========================================================
-- 8. DASHBOARD (Daily Snapshots)
-- =========================================================

CREATE TABLE IF NOT EXISTS dashboard_daily_snapshot (
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date date NOT NULL DEFAULT CURRENT_DATE,
    calories_eaten int DEFAULT 0,
    calories_burned int DEFAULT 0,
    calories_remaining int,
    protein_eaten numeric DEFAULT 0,
    carbs_eaten numeric DEFAULT 0,
    fat_eaten numeric DEFAULT 0,
    water_ml int DEFAULT 0,
    steps int DEFAULT 0,
    sleep_hours numeric,
    mood int,
    habits_completed int DEFAULT 0,
    workouts_completed int DEFAULT 0,
    updated_at timestamptz DEFAULT timezone('utc', now()),
    PRIMARY KEY (user_id, date)
);

-- RPC: Update daily snapshot
CREATE OR REPLACE FUNCTION update_daily_snapshot(p_user_id uuid, p_date date DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO dashboard_daily_snapshot (
        user_id, date,
        calories_eaten, protein_eaten, carbs_eaten, fat_eaten,
        water_ml, steps, sleep_hours, mood, habits_completed, workouts_completed
    )
    SELECT
        p_user_id, p_date,
        COALESCE(SUM(ml.calories), 0),
        COALESCE(SUM(ml.protein), 0),
        COALESCE(SUM(ml.carbs), 0),
        COALESCE(SUM(ml.fat), 0),
        COALESCE(SUM(wl.ml), 0),
        COALESCE(MAX(sl.steps), 0),
        COALESCE(MAX(sleep.hours), 0),
        (SELECT mood FROM mood_logs WHERE user_id = p_user_id AND DATE(created_at) = p_date ORDER BY created_at DESC LIMIT 1),
        (SELECT COUNT(*) FROM habit_logs hl JOIN habits h ON h.id = hl.habit_id WHERE h.user_id = p_user_id AND hl.date = p_date AND hl.completed = true),
        (SELECT COUNT(*) FROM workout_logs WHERE user_id = p_user_id AND DATE(created_at) = p_date)
    FROM meal_logs ml
    FULL OUTER JOIN water_logs wl ON wl.user_id = p_user_id AND DATE(wl.created_at) = p_date
    FULL OUTER JOIN steps_logs sl ON sl.user_id = p_user_id AND sl.date = p_date
    FULL OUTER JOIN sleep_logs sleep ON sleep.user_id = p_user_id AND sleep.date = p_date
    WHERE ml.user_id = p_user_id AND ml.date = p_date
    GROUP BY p_user_id, p_date
    ON CONFLICT (user_id, date) DO UPDATE SET
        calories_eaten = EXCLUDED.calories_eaten,
        protein_eaten = EXCLUDED.protein_eaten,
        carbs_eaten = EXCLUDED.carbs_eaten,
        fat_eaten = EXCLUDED.fat_eaten,
        water_ml = EXCLUDED.water_ml,
        steps = EXCLUDED.steps,
        sleep_hours = EXCLUDED.sleep_hours,
        mood = EXCLUDED.mood,
        habits_completed = EXCLUDED.habits_completed,
        workouts_completed = EXCLUDED.workouts_completed,
        calories_remaining = (SELECT daily_calorie_target FROM user_settings WHERE user_id = p_user_id) - EXCLUDED.calories_eaten + EXCLUDED.calories_burned,
        updated_at = timezone('utc', now());
END;
$$;

-- =========================================================
-- 9. NOTIFICATIONS (Lightweight)
-- =========================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    enabled boolean DEFAULT true,
    quiet_hours jsonb DEFAULT '{"start": "21:30", "end": "08:15"}'::jsonb,
    max_daily int DEFAULT 4,
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS notification_log (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category text NOT NULL, -- 'water', 'meal', 'sleep', 'habit', 'workout'
    message text NOT NULL,
    sent_at timestamptz DEFAULT timezone('utc', now())
);

-- RPC: Check if can send notification
CREATE OR REPLACE FUNCTION can_send_notification(p_user_id uuid, p_category text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    prefs RECORD;
    today_count int;
    current_hour int;
    quiet_start int;
    quiet_end int;
BEGIN
    -- Get preferences
    SELECT * INTO prefs FROM notification_preferences WHERE user_id = p_user_id;
    
    IF NOT FOUND OR NOT prefs.enabled THEN
        RETURN false;
    END IF;
    
    -- Check daily limit
    SELECT COUNT(*) INTO today_count
    FROM notification_log
    WHERE user_id = p_user_id AND DATE(sent_at) = CURRENT_DATE;
    
    IF today_count >= COALESCE(prefs.max_daily, 4) THEN
        RETURN false;
    END IF;
    
    -- Check quiet hours
    current_hour := EXTRACT(HOUR FROM timezone('utc', now()));
    quiet_start := (prefs.quiet_hours->>'start')::int;
    quiet_end := (prefs.quiet_hours->>'end')::int;
    
    IF quiet_start < quiet_end THEN
        IF current_hour >= quiet_start AND current_hour < quiet_end THEN
            RETURN false;
        END IF;
    ELSE
        IF current_hour >= quiet_start OR current_hour < quiet_end THEN
            RETURN false;
        END IF;
    END IF;
    
    RETURN true;
END;
$$;

-- =========================================================
-- 10. INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON meal_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_steps_logs_user_date ON steps_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON mood_logs(user_id, DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON habit_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_notification_log_user_date ON notification_log(user_id, DATE(sent_at));

-- =========================================================
-- 11. RLS POLICIES
-- =========================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_db ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_meal_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_workout_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_daily_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "users_own_profiles" ON profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_own_subscriptions" ON subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_settings" ON user_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "public_read_foods" ON foods FOR SELECT USING (true);
CREATE POLICY "users_own_recipes" ON recipes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_meal_logs" ON meal_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_water_logs" ON water_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "public_read_exercises" ON exercise_db FOR SELECT USING (true);
CREATE POLICY "users_own_workout_routines" ON workout_routines FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_workout_logs" ON workout_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_steps_logs" ON steps_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_sleep_logs" ON sleep_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_mood_logs" ON mood_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_habits" ON habits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_habit_logs" ON habit_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_onboarding" ON onboarding_answers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_meal_plan" ON generated_meal_plan FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_workout_plan" ON generated_workout_plan FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_dashboard" ON dashboard_daily_snapshot FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_notification_prefs" ON notification_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_notification_log" ON notification_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- CORE LAUNCH SCHEMA — COMPLETE
-- =========================================================

