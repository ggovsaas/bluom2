-- =========================================================
-- MODULE J — PERSONALIZATION ENGINE
-- Complete personalization system: onboarding → macros → workout → wellness → recommendations
-- =========================================================

-- 1. PERSONALIZED MACROS TABLE ---------------------------------
CREATE TABLE IF NOT EXISTS personalized_macros (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calories numeric NOT NULL,
    protein numeric NOT NULL,
    carbs numeric NOT NULL,
    fat numeric NOT NULL,
    water_target_liters numeric DEFAULT 2.5,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- 2. PERSONALIZED WORKOUT PLAN TABLE ---------------------------
CREATE TABLE IF NOT EXISTS personalized_workout_plan (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_json jsonb NOT NULL,
    progression_level int DEFAULT 1 CHECK (progression_level BETWEEN 1 AND 10),
    days_per_week int DEFAULT 3 CHECK (days_per_week BETWEEN 1 AND 7),
    experience_level text DEFAULT 'beginner',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- 3. PERSONALIZED WELLNESS PLAN TABLE --------------------------
CREATE TABLE IF NOT EXISTS personalized_wellness_plan (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sleep_goal_hours numeric DEFAULT 7.5,
    meditation_minutes int DEFAULT 10,
    stress_reduction_methods jsonb DEFAULT '[]'::jsonb,
    habit_recommendations jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- 4. PERSONALIZED RECOMMENDATIONS TABLE -----------------------
CREATE TABLE IF NOT EXISTS personalized_recommendations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendations jsonb NOT NULL,
    type text DEFAULT 'daily', -- 'daily' or 'weekly'
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. INDEXES --------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_personalized_macros_user ON personalized_macros(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_workout_plan_user ON personalized_workout_plan(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_wellness_plan_user ON personalized_wellness_plan(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_recommendations_user ON personalized_recommendations(user_id);

-- 6. RLS POLICIES ---------------------------------------------
ALTER TABLE personalized_macros ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_workout_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_wellness_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own macros" ON personalized_macros
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own workout plan" ON personalized_workout_plan
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own wellness plan" ON personalized_wellness_plan
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own recommendations" ON personalized_recommendations
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. RPC FUNCTIONS --------------------------------------------

-- 7.1 Calculate BMR (Mifflin-St Jeor)
CREATE OR REPLACE FUNCTION calculate_bmr(
    p_weight_kg numeric,
    p_height_cm numeric,
    p_age int,
    p_gender text
) RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    bmr numeric;
BEGIN
    IF LOWER(p_gender) = 'male' THEN
        bmr := 10 * p_weight_kg + 6.25 * p_height_cm - 5 * p_age + 5;
    ELSE
        bmr := 10 * p_weight_kg + 6.25 * p_height_cm - 5 * p_age - 161;
    END IF;
    
    RETURN ROUND(bmr);
END;
$$;

-- 7.2 Calculate TDEE from BMR and activity level
CREATE OR REPLACE FUNCTION calculate_tdee(
    p_bmr numeric,
    p_activity_level text
) RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    multiplier numeric;
    tdee numeric;
BEGIN
    multiplier := CASE LOWER(p_activity_level)
        WHEN 'sedentary' THEN 1.2
        WHEN 'light' THEN 1.375
        WHEN 'moderate' THEN 1.55
        WHEN 'active' THEN 1.725
        WHEN 'very' THEN 1.9
        WHEN 'athlete' THEN 1.9
        ELSE 1.375
    END;
    
    tdee := p_bmr * multiplier;
    RETURN ROUND(tdee);
END;
$$;

-- 7.3 Adjust calories for goal
CREATE OR REPLACE FUNCTION adjust_calories_for_goal(
    p_tdee numeric,
    p_goal text
) RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    adjusted numeric;
BEGIN
    adjusted := CASE LOWER(p_goal)
        WHEN 'lose' THEN p_tdee * 0.8  -- -20%
        WHEN 'lose weight' THEN p_tdee * 0.8
        WHEN 'lose fat' THEN p_tdee * 0.8
        WHEN 'gain' THEN p_tdee * 1.15  -- +15%
        WHEN 'build muscle' THEN p_tdee * 1.15
        WHEN 'gain weight' THEN p_tdee * 1.15
        ELSE p_tdee  -- maintain
    END;
    
    RETURN ROUND(adjusted);
END;
$$;

-- 7.4 Calculate macros from calories and goal
CREATE OR REPLACE FUNCTION calculate_macros(
    p_calories numeric,
    p_weight_kg numeric,
    p_goal text,
    p_diet_preference text DEFAULT 'balanced'
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    protein_g numeric;
    protein_cals numeric;
    carb_perc numeric;
    fat_perc numeric;
    remaining_cals numeric;
    carbs_g numeric;
    fat_g numeric;
    result jsonb;
BEGIN
    -- Protein calculation based on goal
    IF LOWER(p_goal) IN ('gain', 'build muscle', 'gain weight') THEN
        protein_g := ROUND(p_weight_kg * 2.0);
    ELSIF LOWER(p_goal) IN ('lose', 'lose weight', 'lose fat') THEN
        protein_g := ROUND(p_weight_kg * 2.2);
    ELSE
        protein_g := ROUND(p_weight_kg * 1.6);
    END IF;
    
    protein_cals := protein_g * 4;
    remaining_cals := GREATEST(0, p_calories - protein_cals);
    
    -- Macro split based on diet preference
    IF LOWER(p_diet_preference) IN ('low carb', 'low-carb', 'keto') THEN
        carb_perc := CASE WHEN LOWER(p_diet_preference) = 'keto' THEN 0.1 ELSE 0.25 END;
        fat_perc := CASE WHEN LOWER(p_diet_preference) = 'keto' THEN 0.7 ELSE 0.45 END;
    ELSIF LOWER(p_diet_preference) IN ('high carb', 'high-carb') THEN
        carb_perc := 0.55;
        fat_perc := 0.25;
    ELSIF LOWER(p_diet_preference) IN ('high protein') THEN
        carb_perc := 0.35;
        fat_perc := 0.30;
    ELSE
        -- Balanced
        carb_perc := 0.45;
        fat_perc := 0.30;
    END IF;
    
    carbs_g := ROUND((remaining_cals * carb_perc) / 4);
    fat_g := ROUND((remaining_cals * fat_perc) / 9);
    
    result := jsonb_build_object(
        'protein', protein_g,
        'carbs', carbs_g,
        'fat', fat_g
    );
    
    RETURN result;
END;
$$;

-- 7.5 Build complete personalization plan
CREATE OR REPLACE FUNCTION build_personalization_plan(
    p_user_id uuid,
    p_onboarding_answers jsonb
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_user users%ROWTYPE;
    v_bmr numeric;
    v_tdee numeric;
    v_calories numeric;
    v_macros jsonb;
    v_water_target numeric;
    v_workout_plan jsonb;
    v_wellness_plan jsonb;
    v_recommendations jsonb;
    v_result jsonb;
BEGIN
    -- Get user data
    SELECT * INTO v_user FROM users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Calculate BMR
    v_bmr := calculate_bmr(
        COALESCE(v_user.weight_kg, 75),
        COALESCE(v_user.height_cm, 175),
        COALESCE(EXTRACT(YEAR FROM AGE(v_user.birthday))::int, 30),
        COALESCE(v_user.gender, 'male')
    );
    
    -- Calculate TDEE
    v_tdee := calculate_tdee(v_bmr, COALESCE(v_user.activity_level, 'light'));
    
    -- Adjust for goal
    v_calories := adjust_calories_for_goal(v_tdee, COALESCE(v_user.goal, 'maintain'));
    
    -- Calculate macros
    v_macros := calculate_macros(
        v_calories,
        COALESCE(v_user.weight_kg, 75),
        COALESCE(v_user.goal, 'maintain'),
        COALESCE((p_onboarding_answers->>'diet_preference')::text, 'balanced')
    );
    
    -- Water target based on activity and hydration habits
    v_water_target := 2.5;
    IF (p_onboarding_answers->>'hydration_habits')::text = 'low' THEN
        v_water_target := 3.5;
    END IF;
    IF v_user.activity_level IN ('active', 'very', 'athlete') THEN
        v_water_target := v_water_target + 0.5;
    END IF;
    
    -- Generate workout plan
    v_workout_plan := generate_workout_plan_json(
        COALESCE((p_onboarding_answers->>'workout_experience')::text, 'beginner'),
        COALESCE((p_onboarding_answers->>'workout_days')::int, 3),
        COALESCE((p_onboarding_answers->>'workout_preference')::text, 'gym'),
        COALESCE((p_onboarding_answers->>'injuries')::text, 'none')
    );
    
    -- Generate wellness plan
    v_wellness_plan := generate_wellness_plan_json(
        COALESCE((p_onboarding_answers->>'sleep_quality')::numeric, 7),
        COALESCE((p_onboarding_answers->>'stress_level')::int, 4),
        COALESCE((p_onboarding_answers->>'meditation_experience')::text, 'beginner')
    );
    
    -- Generate recommendations
    v_recommendations := generate_initial_recommendations(
        p_user_id,
        v_calories,
        v_macros,
        v_workout_plan,
        v_wellness_plan
    );
    
    -- Save to tables
    INSERT INTO personalized_macros (user_id, calories, protein, carbs, fat, water_target_liters)
    VALUES (
        p_user_id,
        v_calories,
        (v_macros->>'protein')::numeric,
        (v_macros->>'carbs')::numeric,
        (v_macros->>'fat')::numeric,
        v_water_target
    )
    ON CONFLICT (user_id) DO UPDATE SET
        calories = EXCLUDED.calories,
        protein = EXCLUDED.protein,
        carbs = EXCLUDED.carbs,
        fat = EXCLUDED.fat,
        water_target_liters = EXCLUDED.water_target_liters,
        updated_at = now();
    
    INSERT INTO personalized_workout_plan (user_id, plan_json, progression_level, days_per_week, experience_level)
    VALUES (
        p_user_id,
        v_workout_plan,
        COALESCE((p_onboarding_answers->>'progression_level')::int, 1),
        COALESCE((p_onboarding_answers->>'workout_days')::int, 3),
        COALESCE((p_onboarding_answers->>'workout_experience')::text, 'beginner')
    )
    ON CONFLICT (user_id) DO UPDATE SET
        plan_json = EXCLUDED.plan_json,
        progression_level = EXCLUDED.progression_level,
        days_per_week = EXCLUDED.days_per_week,
        experience_level = EXCLUDED.experience_level,
        updated_at = now();
    
    INSERT INTO personalized_wellness_plan (user_id, sleep_goal_hours, meditation_minutes, stress_reduction_methods, habit_recommendations)
    VALUES (
        p_user_id,
        COALESCE((p_onboarding_answers->>'sleep_goal')::numeric, 7.5),
        COALESCE((p_onboarding_answers->>'meditation_minutes')::int, 10),
        COALESCE((p_onboarding_answers->'stress_reduction')::jsonb, '[]'::jsonb),
        COALESCE((p_onboarding_answers->'habit_recommendations')::jsonb, '[]'::jsonb)
    )
    ON CONFLICT (user_id) DO UPDATE SET
        sleep_goal_hours = EXCLUDED.sleep_goal_hours,
        meditation_minutes = EXCLUDED.meditation_minutes,
        stress_reduction_methods = EXCLUDED.stress_reduction_methods,
        habit_recommendations = EXCLUDED.habit_recommendations,
        updated_at = now();
    
    INSERT INTO personalized_recommendations (user_id, recommendations, type)
    VALUES (p_user_id, v_recommendations, 'daily')
    ON CONFLICT DO NOTHING;
    
    -- Build result
    v_result := jsonb_build_object(
        'meta', jsonb_build_object(
            'generated_at', now(),
            'user_id', p_user_id,
            'bmr', v_bmr,
            'tdee', v_tdee,
            'calorie_target', v_calories
        ),
        'nutrition', jsonb_build_object(
            'calories', v_calories,
            'macros', v_macros,
            'water_target_liters', v_water_target
        ),
        'workouts', v_workout_plan,
        'wellness', v_wellness_plan,
        'recommendations', v_recommendations
    );
    
    RETURN v_result;
END;
$$;

-- 7.6 Generate workout plan JSON
CREATE OR REPLACE FUNCTION generate_workout_plan_json(
    p_experience text,
    p_days_per_week int,
    p_preference text,
    p_injuries text
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_plan jsonb;
    v_days jsonb;
    v_day_names text[];
    v_day_templates jsonb;
BEGIN
    -- Day templates based on days per week
    IF p_days_per_week = 2 THEN
        v_day_names := ARRAY['Monday', 'Thursday'];
        v_day_templates := jsonb_build_array(
            jsonb_build_object('title', 'Full Body', 'focus', 'compound movements'),
            jsonb_build_object('title', 'Full Body', 'focus', 'compound movements')
        );
    ELSIF p_days_per_week = 3 THEN
        v_day_names := ARRAY['Monday', 'Wednesday', 'Friday'];
        v_day_templates := jsonb_build_array(
            jsonb_build_object('title', 'Full Body', 'focus', 'compound movements'),
            jsonb_build_object('title', 'Full Body', 'focus', 'compound movements'),
            jsonb_build_object('title', 'Accessory', 'focus', 'isolation and mobility')
        );
    ELSIF p_days_per_week = 4 THEN
        v_day_names := ARRAY['Monday', 'Tuesday', 'Thursday', 'Friday'];
        v_day_templates := jsonb_build_array(
            jsonb_build_object('title', 'Upper Body', 'focus', 'push and pull'),
            jsonb_build_object('title', 'Lower Body', 'focus', 'squats and hinges'),
            jsonb_build_object('title', 'Upper Body', 'focus', 'push and pull'),
            jsonb_build_object('title', 'Lower Body', 'focus', 'squats and hinges')
        );
    ELSIF p_days_per_week = 5 THEN
        v_day_names := ARRAY['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday'];
        v_day_templates := jsonb_build_array(
            jsonb_build_object('title', 'Push', 'focus', 'chest, shoulders, triceps'),
            jsonb_build_object('title', 'Pull', 'focus', 'back, biceps'),
            jsonb_build_object('title', 'Legs', 'focus', 'quads, hamstrings, glutes'),
            jsonb_build_object('title', 'Upper Accessory', 'focus', 'shoulders, arms'),
            jsonb_build_object('title', 'Mobility', 'focus', 'stretching and recovery')
        );
    ELSE
        -- Default 3 days
        v_day_names := ARRAY['Monday', 'Wednesday', 'Friday'];
        v_day_templates := jsonb_build_array(
            jsonb_build_object('title', 'Full Body', 'focus', 'compound movements'),
            jsonb_build_object('title', 'Full Body', 'focus', 'compound movements'),
            jsonb_build_object('title', 'Accessory', 'focus', 'isolation and mobility')
        );
    END IF;
    
    -- Build days array
    v_days := jsonb_build_array();
    FOR i IN 1..array_length(v_day_names, 1) LOOP
        v_days := v_days || jsonb_build_object(
            'day', v_day_names[i],
            'title', v_day_templates->(i-1)->>'title',
            'focus', v_day_templates->(i-1)->>'focus',
            'exercises', jsonb_build_array(
                jsonb_build_object('name', 'Primary compound', 'sets', 3, 'reps', CASE WHEN p_experience = 'beginner' THEN '8-12' ELSE '6-10' END),
                jsonb_build_object('name', 'Secondary movement', 'sets', 3, 'reps', CASE WHEN p_experience = 'beginner' THEN '10-15' ELSE '8-12' END),
                jsonb_build_object('name', 'Accessory/core', 'sets', 2, 'reps', '12-15')
            ),
            'equipment', p_preference,
            'notes', CASE WHEN p_injuries != 'none' THEN 'Modify exercises based on injuries' ELSE '' END
        );
    END LOOP;
    
    v_plan := jsonb_build_object(
        'days', v_days,
        'progression', jsonb_build_object(
            'level', 1,
            'next_increase', 'week 2',
            'deload_week', 4
        ),
        'experience', p_experience,
        'days_per_week', p_days_per_week
    );
    
    RETURN v_plan;
END;
$$;

-- 7.7 Generate wellness plan JSON
CREATE OR REPLACE FUNCTION generate_wellness_plan_json(
    p_sleep_quality numeric,
    p_stress_level int,
    p_meditation_experience text
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_plan jsonb;
    v_routines jsonb;
BEGIN
    v_routines := jsonb_build_array();
    
    -- Sleep routine if sleep quality is low
    IF p_sleep_quality < 6 THEN
        v_routines := v_routines || jsonb_build_object(
            'type', 'sleep_prep',
            'duration', 10,
            'action', 'Wind-down breathing + dim lights 30 min before bed'
        );
    END IF;
    
    -- Stress reduction if stress is high
    IF p_stress_level >= 7 THEN
        v_routines := v_routines || jsonb_build_object(
            'type', 'anxiety_relief',
            'duration', 5,
            'action', 'Grounding exercise + quick journal prompt'
        );
    END IF;
    
    -- Daily gratitude
    v_routines := v_routines || jsonb_build_object(
        'type', 'daily_gratitude',
        'duration', 3,
        'action', 'Write 3 things you are grateful for'
    );
    
    -- Meditation based on experience
    v_routines := v_routines || jsonb_build_object(
        'type', 'meditation',
        'duration', CASE 
            WHEN p_meditation_experience = 'beginner' THEN 5
            WHEN p_meditation_experience = 'intermediate' THEN 10
            ELSE 15
        END,
        'action', 'Mindful breathing or guided meditation'
    );
    
    v_plan := jsonb_build_object(
        'sleep_goal_hours', GREATEST(7, p_sleep_quality),
        'routines', v_routines,
        'stress_reduction', jsonb_build_array(
            'Deep breathing',
            'Progressive muscle relaxation',
            'Nature sounds'
        ),
        'habit_recommendations', jsonb_build_array(
            'Drink water upon waking',
            'Log mood daily',
            '10-minute morning stretch',
            'Evening gratitude practice'
        )
    );
    
    RETURN v_plan;
END;
$$;

-- 7.8 Generate initial recommendations
CREATE OR REPLACE FUNCTION generate_initial_recommendations(
    p_user_id uuid,
    p_calories numeric,
    p_macros jsonb,
    p_workout_plan jsonb,
    p_wellness_plan jsonb
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_recommendations jsonb;
BEGIN
    v_recommendations := jsonb_build_array(
        jsonb_build_object(
            'type', 'nutrition',
            'message', format('Your daily calorie target is %s with %sg protein, %sg carbs, and %sg fat', 
                p_calories, 
                (p_macros->>'protein')::numeric,
                (p_macros->>'carbs')::numeric,
                (p_macros->>'fat')::numeric
            ),
            'action', 'Start logging meals to track your macros'
        ),
        jsonb_build_object(
            'type', 'workout',
            'message', format('Your personalized workout plan includes %s days per week', 
                (p_workout_plan->>'days_per_week')::int
            ),
            'action', 'View your workout plan and start your first session'
        ),
        jsonb_build_object(
            'type', 'wellness',
            'message', format('Aim for %s hours of sleep and %s minutes of meditation daily',
                (p_wellness_plan->>'sleep_goal_hours')::numeric,
                (p_wellness_plan->'routines'->0->>'duration')::int
            ),
            'action', 'Set up your wellness routines'
        ),
        jsonb_build_object(
            'type', 'hydration',
            'message', 'Stay hydrated throughout the day',
            'action', 'Log your water intake'
        )
    );
    
    RETURN v_recommendations;
END;
$$;

-- 7.9 Get user personalization (all plans combined)
CREATE OR REPLACE FUNCTION get_user_personalization(
    p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_macros personalized_macros%ROWTYPE;
    v_workout personalized_workout_plan%ROWTYPE;
    v_wellness personalized_wellness_plan%ROWTYPE;
    v_recommendations jsonb;
    v_result jsonb;
BEGIN
    -- Get macros
    SELECT * INTO v_macros FROM personalized_macros WHERE user_id = p_user_id;
    
    -- Get workout plan
    SELECT * INTO v_workout FROM personalized_workout_plan WHERE user_id = p_user_id;
    
    -- Get wellness plan
    SELECT * INTO v_wellness FROM personalized_wellness_plan WHERE user_id = p_user_id;
    
    -- Get latest recommendations
    SELECT recommendations INTO v_recommendations 
    FROM personalized_recommendations 
    WHERE user_id = p_user_id 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Build result
    v_result := jsonb_build_object(
        'macros', CASE WHEN v_macros.id IS NOT NULL THEN
            jsonb_build_object(
                'calories', v_macros.calories,
                'protein', v_macros.protein,
                'carbs', v_macros.carbs,
                'fat', v_macros.fat,
                'water_target_liters', v_macros.water_target_liters
            )
        ELSE NULL END,
        'workout', CASE WHEN v_workout.id IS NOT NULL THEN
            jsonb_build_object(
                'plan', v_workout.plan_json,
                'progression_level', v_workout.progression_level,
                'days_per_week', v_workout.days_per_week,
                'experience_level', v_workout.experience_level
            )
        ELSE NULL END,
        'wellness', CASE WHEN v_wellness.id IS NOT NULL THEN
            jsonb_build_object(
                'sleep_goal_hours', v_wellness.sleep_goal_hours,
                'meditation_minutes', v_wellness.meditation_minutes,
                'stress_reduction_methods', v_wellness.stress_reduction_methods,
                'habit_recommendations', v_wellness.habit_recommendations
            )
        ELSE NULL END,
        'recommendations', COALESCE(v_recommendations, '[]'::jsonb)
    );
    
    RETURN v_result;
END;
$$;

-- 8. TRIGGERS FOR UPDATED_AT ----------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_personalized_macros_updated_at
    BEFORE UPDATE ON personalized_macros
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personalized_workout_plan_updated_at
    BEFORE UPDATE ON personalized_workout_plan
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personalized_wellness_plan_updated_at
    BEFORE UPDATE ON personalized_wellness_plan
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personalized_recommendations_updated_at
    BEFORE UPDATE ON personalized_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- MODULE J — COMPLETE
-- =========================================================
-- This module provides:
-- ✅ Personalized macros calculation (BMR, TDEE, goal adjustment)
-- ✅ Personalized workout plan generation
-- ✅ Personalized wellness plan generation
-- ✅ Initial recommendations
-- ✅ Complete personalization pipeline
-- ✅ RLS policies for data security
-- =========================================================

