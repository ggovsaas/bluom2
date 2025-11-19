-- =========================================================
-- FULL MEAL PLANNING AI (COMPLETE VERSION)
-- AI meal blueprint, recipe builder, grocery list, adaptation, restaurant mode, macro correction
-- =========================================================

-- AI recipes (user-generated recipes)
CREATE TABLE IF NOT EXISTS ai_recipes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    ingredients jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{food_id, quantity, unit}]
    steps text[] DEFAULT '{}',
    macros jsonb NOT NULL DEFAULT '{}'::jsonb, -- {calories, protein, carbs, fats}
    cooking_time_minutes int,
    difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
    equipment_needed text[],
    tags text[] DEFAULT '{}',
    image_url text,
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- Meal plan feedback (likes/dislikes)
CREATE TABLE IF NOT EXISTS meal_plan_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    food_id bigint REFERENCES foods(id) ON DELETE SET NULL,
    recipe_id uuid REFERENCES ai_recipes(id) ON DELETE SET NULL,
    meal_log_id bigint REFERENCES meal_logs(id) ON DELETE SET NULL,
    liked boolean NOT NULL,
    notes text,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Nutrition reports (weekly summaries)
CREATE TABLE IF NOT EXISTS nutrition_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    report_type text NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'custom')),
    report_period_start date NOT NULL,
    report_period_end date NOT NULL,
    report jsonb NOT NULL DEFAULT '{}'::jsonb, -- Full report data
    weight_trend numeric,
    macro_accuracy numeric, -- 0-100
    hunger_patterns jsonb DEFAULT '{}'::jsonb,
    sleep_appetite_correlation numeric,
    projection_next_7days jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Meal plan adaptations (track changes)
CREATE TABLE IF NOT EXISTS meal_plan_adaptations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    adaptation_type text NOT NULL CHECK (adaptation_type IN ('fatigue_adjustment', 'stress_adjustment', 'budget_adjustment', 'adherence_adjustment', 'taste_adjustment', 'macro_correction')),
    reason text,
    changes jsonb NOT NULL DEFAULT '{}'::jsonb, -- What changed
    applied_at timestamptz DEFAULT timezone('utc', now())
);

-- Restaurant meal logs (for restaurant mode)
CREATE TABLE IF NOT EXISTS restaurant_meal_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    restaurant_name text,
    meal_description text NOT NULL,
    image_url text,
    estimated_calories int,
    estimated_protein numeric,
    estimated_carbs numeric,
    estimated_fats numeric,
    confidence_score numeric CHECK (confidence_score BETWEEN 0 AND 1),
    source text CHECK (source IN ('vision_ai', 'fatsecret', 'manual', 'text_analysis')),
    logged_at date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Auto macro corrections (track AI adjustments)
CREATE TABLE IF NOT EXISTS auto_macro_corrections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    correction_date date NOT NULL,
    deficit_calories int, -- How many calories user is behind
    deficit_protein numeric,
    deficit_carbs numeric,
    deficit_fats numeric,
    suggested_foods jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{food_id, quantity, reason}]
    applied boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_recipes_user ON ai_recipes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meal_plan_feedback_user ON meal_plan_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nutrition_reports_user ON nutrition_reports(user_id, report_period_start DESC);
CREATE INDEX IF NOT EXISTS idx_meal_plan_adaptations_user ON meal_plan_adaptations(user_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_restaurant_meal_logs_user ON restaurant_meal_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_macro_corrections_user ON auto_macro_corrections(user_id, correction_date DESC);

-- RLS Policies
ALTER TABLE ai_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_adaptations ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_macro_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_ai_recipes" ON ai_recipes
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_meal_feedback" ON meal_plan_feedback
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_nutrition_reports" ON nutrition_reports
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_meal_adaptations" ON meal_plan_adaptations
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_restaurant_logs" ON restaurant_meal_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_macro_corrections" ON auto_macro_corrections
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RPC: Calculate daily meal targets
CREATE OR REPLACE FUNCTION calculate_daily_meal_targets(p_user_id uuid, p_date date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_profile RECORD;
    v_targets jsonb;
BEGIN
    SELECT daily_calorie_target, daily_protein_target, daily_carb_target, daily_fat_target
    INTO v_profile
    FROM profiles
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'calories', 2000,
            'protein', 150,
            'carbs', 200,
            'fats', 65
        );
    END IF;
    
    RETURN jsonb_build_object(
        'calories', COALESCE(v_profile.daily_calorie_target, 2000),
        'protein', COALESCE(v_profile.daily_protein_target, 150),
        'carbs', COALESCE(v_profile.daily_carb_target, 200),
        'fats', COALESCE(v_profile.daily_fat_target, 65)
    );
END;
$$;

-- RPC: Generate auto macro correction
CREATE OR REPLACE FUNCTION generate_macro_correction(p_user_id uuid, p_date date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_targets jsonb;
    v_consumed jsonb;
    v_deficit jsonb;
    v_suggestions jsonb := '[]'::jsonb;
BEGIN
    -- Get targets
    v_targets := calculate_daily_meal_targets(p_user_id, p_date);
    
    -- Get consumed (from meal_logs)
    SELECT jsonb_build_object(
        'calories', COALESCE(SUM(calories), 0),
        'protein', COALESCE(SUM(protein), 0),
        'carbs', COALESCE(SUM(carbs), 0),
        'fats', COALESCE(SUM(fats), 0)
    ) INTO v_consumed
    FROM daily_nutrition_summary
    WHERE user_id = p_user_id AND date = p_date;
    
    -- Calculate deficit
    v_deficit := jsonb_build_object(
        'calories', (v_targets->>'calories')::int - (v_consumed->>'calories')::int,
        'protein', (v_targets->>'protein')::numeric - (v_consumed->>'protein')::numeric,
        'carbs', (v_targets->>'carbs')::numeric - (v_consumed->>'carbs')::numeric,
        'fats', (v_targets->>'fats')::numeric - (v_consumed->>'fats')::numeric
    );
    
    -- If significant deficit, suggest foods
    IF (v_deficit->>'calories')::int < -300 THEN
        -- Suggest high-calorie foods
        SELECT jsonb_agg(jsonb_build_object(
            'food_id', id,
            'name', name,
            'quantity', '100g',
            'calories', calories,
            'reason', 'High calorie food to meet daily target'
        )) INTO v_suggestions
        FROM foods
        WHERE calories > 300
        ORDER BY calories DESC
        LIMIT 3;
    END IF;
    
    -- Save correction
    INSERT INTO auto_macro_corrections (
        user_id, correction_date, deficit_calories, deficit_protein,
        deficit_carbs, deficit_fats, suggested_foods
    )
    VALUES (
        p_user_id, p_date,
        (v_deficit->>'calories')::int,
        (v_deficit->>'protein')::numeric,
        (v_deficit->>'carbs')::numeric,
        (v_deficit->>'fats')::numeric,
        v_suggestions
    )
    ON CONFLICT DO NOTHING;
    
    RETURN jsonb_build_object(
        'deficit', v_deficit,
        'suggestions', v_suggestions
    );
END;
$$;

-- =========================================================
-- FULL MEAL PLANNING AI — COMPLETE
-- =========================================================

