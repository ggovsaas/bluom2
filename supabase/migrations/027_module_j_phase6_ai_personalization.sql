-- =========================================================
-- MODULE J PHASE 6 — AI PERSONALIZATION ENGINE
-- Enhanced personalization with meal plans, workout plans, and AI-driven recommendations
-- =========================================================

-- 1. USER PROFILE ANSWERS TABLE ---------------------------------
-- Stores individual onboarding question answers for AI processing
CREATE TABLE IF NOT EXISTS user_profile_answers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_key text NOT NULL,
    answer_value text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, question_key)
);

-- 2. PERSONALIZED GOALS TABLE (Enhanced) ------------------------
-- Stores calculated macro targets, workout goal, wellness category
CREATE TABLE IF NOT EXISTS personalized_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    primary_goal text,               -- lose_fat / gain_muscle / recomposition / maintain
    calorie_target integer,
    protein_target integer,
    carbs_target integer,
    fats_target integer,
    workout_focus text,              -- hypertrophy / weight_loss / endurance / strength
    wellness_focus text,             -- stress, sleep, mindset, balance
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- 3. PERSONALIZED MEAL PLAN TABLE ------------------------------
-- Daily meal schedule created from goals
CREATE TABLE IF NOT EXISTS personalized_meal_plan (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_index int NOT NULL,         -- 1-7 (Monday-Sunday)
    meal_label text NOT NULL,       -- breakfast, lunch, dinner, snack
    items jsonb NOT NULL,            -- [{"food":"Oats","grams":80,"calories":300,"protein":10}]
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, day_index, meal_label)
);

-- 4. PERSONALIZED WORKOUT PLAN TABLE (Enhanced) ----------------
-- Rep sets + exercise list based on user goal
CREATE TABLE IF NOT EXISTS personalized_workout_plan (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_index int NOT NULL,         -- 1-7 (Monday-Sunday)
    workout_type text,               -- push / pull / legs / cardio / upper/lower / full_body
    exercises jsonb NOT NULL,        -- [{"name":"Bench Press","sets":4,"reps":"6-8","rest":120}]
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, day_index)
);

-- 5. INDEXES ----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_profile_answers_user ON user_profile_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_answers_key ON user_profile_answers(question_key);
CREATE INDEX IF NOT EXISTS idx_personalized_goals_user ON personalized_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_meal_plan_user ON personalized_meal_plan(user_id, day_index);
CREATE INDEX IF NOT EXISTS idx_personalized_workout_plan_user ON personalized_workout_plan(user_id, day_index);

-- 6. RLS POLICIES ----------------------------------------------
ALTER TABLE user_profile_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_meal_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_workout_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile answers" ON user_profile_answers
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own goals" ON personalized_goals
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own meal plan" ON personalized_meal_plan
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own workout plan" ON personalized_workout_plan
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. TRIGGERS FOR UPDATED_AT -----------------------------------
CREATE TRIGGER update_personalized_goals_updated_at
    BEFORE UPDATE ON personalized_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personalized_meal_plan_updated_at
    BEFORE UPDATE ON personalized_meal_plan
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personalized_workout_plan_updated_at
    BEFORE UPDATE ON personalized_workout_plan
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. RPC FUNCTIONS ---------------------------------------------

-- 8.1 Save onboarding answers to user_profile_answers
CREATE OR REPLACE FUNCTION save_profile_answers(
    p_user_id uuid,
    p_answers jsonb
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    answer_key text;
    answer_value text;
BEGIN
    -- Loop through answers JSONB and insert/update
    FOR answer_key, answer_value IN SELECT * FROM jsonb_each_text(p_answers)
    LOOP
        INSERT INTO user_profile_answers (user_id, question_key, answer_value)
        VALUES (p_user_id, answer_key, answer_value)
        ON CONFLICT (user_id, question_key) 
        DO UPDATE SET answer_value = EXCLUDED.answer_value;
    END LOOP;
END;
$$;

-- 8.2 Get all profile answers for a user
CREATE OR REPLACE FUNCTION get_profile_answers(
    p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_answers jsonb := '{}'::jsonb;
    answer_record RECORD;
BEGIN
    FOR answer_record IN 
        SELECT question_key, answer_value 
        FROM user_profile_answers 
        WHERE user_id = p_user_id
    LOOP
        v_answers := v_answers || jsonb_build_object(
            answer_record.question_key, 
            answer_record.answer_value
        );
    END LOOP;
    
    RETURN v_answers;
END;
$$;

-- 8.3 Get complete personalization (goals + meal plan + workout plan)
CREATE OR REPLACE FUNCTION get_complete_personalization(
    p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_goals personalized_goals%ROWTYPE;
    v_meals jsonb := '[]'::jsonb;
    v_workouts jsonb := '[]'::jsonb;
    v_result jsonb;
BEGIN
    -- Get goals
    SELECT * INTO v_goals FROM personalized_goals WHERE user_id = p_user_id;
    
    -- Get meal plan (all 7 days)
    SELECT jsonb_agg(
        jsonb_build_object(
            'day_index', day_index,
            'meal_label', meal_label,
            'items', items
        ) ORDER BY day_index, meal_label
    ) INTO v_meals
    FROM personalized_meal_plan
    WHERE user_id = p_user_id;
    
    -- Get workout plan (all 7 days)
    SELECT jsonb_agg(
        jsonb_build_object(
            'day_index', day_index,
            'workout_type', workout_type,
            'exercises', exercises
        ) ORDER BY day_index
    ) INTO v_workouts
    FROM personalized_workout_plan
    WHERE user_id = p_user_id;
    
    -- Build result
    v_result := jsonb_build_object(
        'goals', CASE WHEN v_goals.id IS NOT NULL THEN
            jsonb_build_object(
                'primary_goal', v_goals.primary_goal,
                'calorie_target', v_goals.calorie_target,
                'protein_target', v_goals.protein_target,
                'carbs_target', v_goals.carbs_target,
                'fats_target', v_goals.fats_target,
                'workout_focus', v_goals.workout_focus,
                'wellness_focus', v_goals.wellness_focus
            )
        ELSE NULL END,
        'meal_plan', COALESCE(v_meals, '[]'::jsonb),
        'workout_plan', COALESCE(v_workouts, '[]'::jsonb)
    );
    
    RETURN v_result;
END;
$$;

-- =========================================================
-- MODULE J PHASE 6 — COMPLETE
-- =========================================================

