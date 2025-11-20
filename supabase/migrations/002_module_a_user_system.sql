-- =========================================================
-- MODULE A — USER SYSTEM + ONBOARDING + PERSONALIZATION ENGINE
-- Foundation of the entire app: users, onboarding, goals, personalization
-- =========================================================

-- 1. TABLES -----------------------------------------------

-- A1 — users (extends Supabase auth.users metadata)
CREATE TABLE users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT timezone('utc', now()),
    name text,
    gender text,
    birthday date,
    timezone text DEFAULT 'UTC',
    height_cm numeric,
    weight_kg numeric,
    activity_level text,         -- sedentary / light / moderate / high / athlete
    goal text,                    -- lose / maintain / gain
    avatar_url text,
    onboarding_completed boolean DEFAULT false
);

-- A2 — onboarding_answers
CREATE TABLE onboarding_answers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    question_id int,
    question text,
    answer text,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- A3 — user_goals
CREATE TABLE user_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    calories_target int,
    protein_target int,
    carbs_target int,
    fats_target int,
    steps_target int,
    workouts_per_week int,
    sleep_hours_target numeric,
    wellness_focus text,      -- stress, mindfulness, recovery, balance
    generated_at timestamptz DEFAULT timezone('utc', now())
);

-- A4 — personalization_history
CREATE TABLE personalization_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    old_goals jsonb,
    new_goals jsonb,
    triggered_by text, -- onboarding, weight_update, manual, weekly_review
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- A5 — user_preferences
CREATE TABLE user_preferences (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    units text DEFAULT 'metric',        -- metric / imperial
    show_push_notifications boolean DEFAULT true,
    quiet_hours_start int DEFAULT 21,   -- no notifications after 21
    quiet_hours_end int DEFAULT 7,      -- resume notifications at 07
    preferred_coach_persona text DEFAULT 'Nova', 
    theme text DEFAULT 'light',
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- 2. RLS — Row-Level Security ----------------------------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalization_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES ---------------------------------------------

-- Users can only modify their own data
CREATE POLICY "user owns row"
ON users
FOR SELECT USING (auth.uid() = id)
FOR UPDATE USING (auth.uid() = id)
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "user owns their answers"
ON onboarding_answers
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user owns their goals"
ON user_goals
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user owns their history"
ON personalization_history
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user owns their preferences"
ON user_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. RPC FUNCTIONS ---------------------------------------

-- RPC: generate_user_goals()
-- Triggered after onboarding
-- Uses Mifflin-St Jeor + activity multipliers
CREATE OR REPLACE FUNCTION generate_user_goals(uid uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    age_val int;
    gender_val text;
    height_val numeric;
    weight_val numeric;
    goal_val text;
    activity_val text;
    bmr numeric;
    tdee numeric;
    multiplier numeric;
    calories int;
    protein int;
    fats int;
    carbs int;
BEGIN
    SELECT 
        (EXTRACT(YEAR FROM AGE(birthday)))::int,
        users.gender,
        users.height_cm,
        users.weight_kg,
        users.goal,
        users.activity_level
    INTO age_val, gender_val, height_val, weight_val, goal_val, activity_val
    FROM users WHERE id = uid;

    -- BMR calculation (Mifflin-St Jeor)
    IF gender_val = 'male' THEN
        bmr := 10 * weight_val + 6.25 * height_val - 5 * age_val + 5;
    ELSE
        bmr := 10 * weight_val + 6.25 * height_val - 5 * age_val - 161;
    END IF;

    -- Activity multiplier
    multiplier := CASE 
        WHEN activity_val = 'sedentary' THEN 1.2
        WHEN activity_val = 'light' THEN 1.375
        WHEN activity_val = 'moderate' THEN 1.55
        WHEN activity_val = 'high' THEN 1.725
        WHEN activity_val = 'athlete' THEN 1.9
        ELSE 1.3 
    END;

    tdee := bmr * multiplier;

    -- Calorie target based on goal
    calories := CASE
        WHEN goal_val = 'lose' THEN (tdee - 400)::int
        WHEN goal_val = 'gain' THEN (tdee + 300)::int
        ELSE tdee::int 
    END;

    -- Macro targets
    protein := (weight_val * 2.2)::int;     -- 2.2g per kg
    fats := (calories * 0.25 / 9)::int;
    carbs := ((calories - (protein * 4 + fats * 9)) / 4)::int;

    -- Insert goals
    INSERT INTO user_goals (
        user_id, calories_target, protein_target, carbs_target, fats_target,
        steps_target, workouts_per_week, sleep_hours_target, wellness_focus
    ) VALUES (
        uid, calories, protein, carbs, fats,
        8000, 3, 7.5, 'balance'
    );
END;
$$;

-- RPC: complete_onboarding()
CREATE OR REPLACE FUNCTION complete_onboarding(uid uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE users
    SET onboarding_completed = true
    WHERE id = uid;

    PERFORM generate_user_goals(uid);
END;
$$;

-- INDEXES for performance ---------------------------------

CREATE INDEX idx_onboarding_answers_user ON onboarding_answers(user_id);
CREATE INDEX idx_user_goals_user ON user_goals(user_id);
CREATE INDEX idx_personalization_history_user ON personalization_history(user_id);

