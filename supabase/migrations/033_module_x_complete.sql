-- =========================================================
-- MODULE X — MEALS & MACRO PLANNER (COMPLETION)
-- Adds missing tables and functions to complete the module
-- =========================================================

-- 1. ADDITIONAL TABLES (if not exists) --------------------

-- X-COMPLETE-1: macro_targets (daily macro goals per user)
-- This is a separate table from user_nutrition_settings for tracking daily targets
CREATE TABLE IF NOT EXISTS macro_targets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calories int,
    protein int,
    carbs int,
    fats int,
    updated_by text, -- 'onboarding', 'ai_auto', 'manual', 'personalization'
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- X-COMPLETE-2: weekly_meal_plans (7-day plan structure)
-- Separate table for weekly plans (complements meal_plans with type='weekly')
CREATE TABLE IF NOT EXISTS weekly_meal_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start_date date NOT NULL, -- Monday
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, week_start_date)
);

-- X-COMPLETE-3: meal_plan_days (each day of weekly plan)
CREATE TABLE IF NOT EXISTS meal_plan_days (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES weekly_meal_plans(id) ON DELETE CASCADE,
    date date NOT NULL,
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(plan_id, date)
);

-- X-COMPLETE-4: meal_plan_meals (breakfast, lunch, dinner, snacks for each day)
CREATE TABLE IF NOT EXISTS meal_plan_meals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id uuid NOT NULL REFERENCES meal_plan_days(id) ON DELETE CASCADE,
    meal_type text NOT NULL, -- breakfast, lunch, dinner, snack1, snack2
    recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
    generated_by text, -- 'ai', 'user', 'recommended'
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- X-COMPLETE-5: meal_preferences (allergies, dislikes, diet type)
-- Enhanced version with preferred_cuisines and avoid_foods
CREATE TABLE IF NOT EXISTS meal_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    diet_type text, -- keto, vegan, balanced, high-protein, etc.
    allergies text[] DEFAULT '{}'::text[],
    dislikes text[] DEFAULT '{}'::text[],
    preferred_cuisines text[] DEFAULT '{}'::text[],
    avoid_foods text[] DEFAULT '{}'::text[],
    preferred_meal_times jsonb DEFAULT '{}'::jsonb, -- {"breakfast": "8:00", "dinner": "20:00"}
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id)
);

-- 2. INDEXES ------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_macro_targets_user ON macro_targets(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_meal_plans_user ON weekly_meal_plans(user_id, week_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_plan_days_plan ON meal_plan_days(plan_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_plan_meals_day ON meal_plan_meals(day_id, meal_type);
CREATE INDEX IF NOT EXISTS idx_meal_preferences_user ON meal_preferences(user_id);

-- 3. RLS POLICIES -------------------------------------------

ALTER TABLE macro_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_macro_targets" ON macro_targets
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_weekly_plans" ON weekly_meal_plans
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_meal_plan_days" ON meal_plan_days
    FOR ALL USING (
        auth.uid() = (SELECT user_id FROM weekly_meal_plans WHERE id = plan_id)
    ) WITH CHECK (
        auth.uid() = (SELECT user_id FROM weekly_meal_plans WHERE id = plan_id)
    );

CREATE POLICY "users_manage_own_meal_plan_meals" ON meal_plan_meals
    FOR ALL USING (
        auth.uid() = (
            SELECT wmp.user_id 
            FROM weekly_meal_plans wmp
            JOIN meal_plan_days mpd ON mpd.plan_id = wmp.id
            WHERE mpd.id = day_id
        )
    ) WITH CHECK (
        auth.uid() = (
            SELECT wmp.user_id 
            FROM weekly_meal_plans wmp
            JOIN meal_plan_days mpd ON mpd.plan_id = wmp.id
            WHERE mpd.id = day_id
        )
    );

CREATE POLICY "users_manage_own_meal_preferences" ON meal_preferences
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. RPC FUNCTIONS (COMPLETION) -----------------------------

-- X-COMPLETE-RPC1: get_daily_macros(user_id, date)
-- Returns current targets, consumed macros, and remaining macros
CREATE OR REPLACE FUNCTION get_daily_macros(
    p_user_id uuid,
    p_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    target_record RECORD;
    totals_record RECORD;
    settings_record RECORD;
BEGIN
    -- Get latest macro targets
    SELECT * INTO target_record
    FROM macro_targets
    WHERE user_id = p_user_id
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- If no macro_targets, try user_nutrition_settings
    IF target_record IS NULL THEN
        SELECT * INTO settings_record
        FROM user_nutrition_settings
        WHERE user_id = p_user_id;
        
        IF settings_record IS NOT NULL THEN
            target_record.calories := settings_record.daily_calories;
            target_record.protein := settings_record.protein_target;
            target_record.carbs := settings_record.carbs_target;
            target_record.fats := settings_record.fat_target;
        END IF;
    END IF;
    
    -- Get consumed totals from meal_logs
    SELECT 
        COALESCE(SUM(
            CASE 
                WHEN ml.recipe_id IS NOT NULL THEN
                    (SELECT r.total_calories FROM recipes r WHERE r.id = ml.recipe_id) * ml.quantity
                WHEN ml.food_id IS NOT NULL THEN
                    (SELECT f.calories FROM foods f WHERE f.id = ml.food_id) * ml.quantity
                WHEN ml.user_food_id IS NOT NULL THEN
                    (SELECT uf.calories FROM user_foods uf WHERE uf.id = ml.user_food_id) * ml.quantity
                ELSE 0
            END
        ), 0) as calories_consumed,
        COALESCE(SUM(
            CASE 
                WHEN ml.recipe_id IS NOT NULL THEN
                    (SELECT r.total_protein FROM recipes r WHERE r.id = ml.recipe_id) * ml.quantity
                WHEN ml.food_id IS NOT NULL THEN
                    (SELECT f.protein FROM foods f WHERE f.id = ml.food_id) * ml.quantity
                WHEN ml.user_food_id IS NOT NULL THEN
                    (SELECT uf.protein FROM user_foods uf WHERE uf.id = ml.user_food_id) * ml.quantity
                ELSE 0
            END
        ), 0) as protein_consumed,
        COALESCE(SUM(
            CASE 
                WHEN ml.recipe_id IS NOT NULL THEN
                    (SELECT r.total_carbs FROM recipes r WHERE r.id = ml.recipe_id) * ml.quantity
                WHEN ml.food_id IS NOT NULL THEN
                    (SELECT f.carbs FROM foods f WHERE f.id = ml.food_id) * ml.quantity
                WHEN ml.user_food_id IS NOT NULL THEN
                    (SELECT uf.carbs FROM user_foods uf WHERE uf.id = ml.user_food_id) * ml.quantity
                ELSE 0
            END
        ), 0) as carbs_consumed,
        COALESCE(SUM(
            CASE 
                WHEN ml.recipe_id IS NOT NULL THEN
                    (SELECT r.total_fat FROM recipes r WHERE r.id = ml.recipe_id) * ml.quantity
                WHEN ml.food_id IS NOT NULL THEN
                    (SELECT f.fat FROM foods f WHERE f.id = ml.food_id) * ml.quantity
                WHEN ml.user_food_id IS NOT NULL THEN
                    (SELECT uf.fat FROM user_foods uf WHERE uf.id = ml.user_food_id) * ml.quantity
                ELSE 0
            END
        ), 0) as fats_consumed
    INTO totals_record
    FROM meal_logs ml
    WHERE ml.user_id = p_user_id 
    AND DATE(ml.logged_at) = p_date;
    
    RETURN jsonb_build_object(
        'calories_target', COALESCE(target_record.calories, 2000),
        'protein_target', COALESCE(target_record.protein, 150),
        'carbs_target', COALESCE(target_record.carbs, 200),
        'fats_target', COALESCE(target_record.fats, 65),
        'calories_consumed', COALESCE(totals_record.calories_consumed, 0),
        'protein_consumed', COALESCE(totals_record.protein_consumed, 0),
        'carbs_consumed', COALESCE(totals_record.carbs_consumed, 0),
        'fats_consumed', COALESCE(totals_record.fats_consumed, 0),
        'calories_remaining', GREATEST(0, COALESCE(target_record.calories, 2000) - COALESCE(totals_record.calories_consumed, 0)),
        'protein_remaining', GREATEST(0, COALESCE(target_record.protein, 150) - COALESCE(totals_record.protein_consumed, 0)),
        'carbs_remaining', GREATEST(0, COALESCE(target_record.carbs, 200) - COALESCE(totals_record.carbs_consumed, 0)),
        'fats_remaining', GREATEST(0, COALESCE(target_record.fats, 65) - COALESCE(totals_record.fats_consumed, 0))
    );
END;
$$;

-- X-COMPLETE-RPC2: generate_weekly_meal_plan_structure(user_id)
-- Creates empty weekly plan structure (7 days)
CREATE OR REPLACE FUNCTION generate_weekly_meal_plan_structure(
    p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    plan_id uuid;
    start_date date;
    d int;
    day_id uuid;
    is_premium boolean;
BEGIN
    -- Check premium status
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user_id;
    
    IF NOT is_premium THEN
        RAISE EXCEPTION 'Weekly meal plans require premium subscription.';
    END IF;
    
    -- Get Monday of current week
    start_date := date_trunc('week', CURRENT_DATE)::date;
    
    -- Create weekly plan
    INSERT INTO weekly_meal_plans (user_id, week_start_date)
    VALUES (p_user_id, start_date)
    ON CONFLICT (user_id, week_start_date) DO UPDATE
    SET created_at = timezone('utc', now())
    RETURNING id INTO plan_id;
    
    -- Create 7 days
    FOR d IN 0..6 LOOP
        INSERT INTO meal_plan_days (plan_id, date)
        VALUES (plan_id, start_date + d)
        ON CONFLICT (plan_id, date) DO NOTHING
        RETURNING id INTO day_id;
    END LOOP;
    
    RETURN plan_id;
END;
$$;

-- X-COMPLETE-RPC3: get_meal_plan_full(user_id, date, type)
-- Returns full nested meal plan with all details
CREATE OR REPLACE FUNCTION get_meal_plan_full(
    p_user_id uuid,
    p_date date DEFAULT CURRENT_DATE,
    p_type text DEFAULT 'daily'
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    plan_result jsonb;
BEGIN
    IF p_type = 'weekly' THEN
        -- Get weekly plan
        SELECT jsonb_build_object(
            'plan', row_to_json(wmp.*),
            'days', COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'day', mpd.date,
                            'meals', COALESCE(
                                (
                                    SELECT jsonb_agg(
                                        jsonb_build_object(
                                            'id', mpm.id,
                                            'meal_type', mpm.meal_type,
                                            'recipe_id', mpm.recipe_id,
                                            'generated_by', mpm.generated_by
                                        )
                                        ORDER BY 
                                            CASE mpm.meal_type
                                                WHEN 'breakfast' THEN 1
                                                WHEN 'snack1' THEN 2
                                                WHEN 'lunch' THEN 3
                                                WHEN 'snack2' THEN 4
                                                WHEN 'dinner' THEN 5
                                                ELSE 6
                                            END
                                    )
                                    FROM meal_plan_meals mpm
                                    WHERE mpm.day_id = mpd.id
                                ),
                                '[]'::jsonb
                            )
                        )
                        ORDER BY mpd.date
                    )
                    FROM meal_plan_days mpd
                    WHERE mpd.plan_id = wmp.id
                ),
                '[]'::jsonb
            )
        ) INTO plan_result
        FROM weekly_meal_plans wmp
        WHERE wmp.user_id = p_user_id
        AND wmp.week_start_date <= p_date
        AND wmp.week_start_date + INTERVAL '6 days' >= p_date
        ORDER BY wmp.week_start_date DESC
        LIMIT 1;
    ELSE
        -- Get daily plan (from existing meal_plans table)
        SELECT jsonb_build_object(
            'plan', row_to_json(mp.*),
            'items', COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', mpi.id,
                            'meal_slot', mpi.meal_slot,
                            'recipe_id', mpi.recipe_id,
                            'food_id', mpi.food_id,
                            'user_food_id', mpi.user_food_id,
                            'quantity', mpi.quantity,
                            'macros', mpi.macros,
                            'order_index', mpi.order_index
                        )
                        ORDER BY mpi.order_index, mpi.meal_slot
                    )
                    FROM meal_plan_items mpi
                    WHERE mpi.plan_id = mp.id
                ),
                '[]'::jsonb
            )
        ) INTO plan_result
        FROM meal_plans mp
        WHERE mp.user_id = p_user_id
        AND mp.date = p_date
        AND mp.type = 'daily'
        LIMIT 1;
    END IF;
    
    RETURN COALESCE(plan_result, '{}'::jsonb);
END;
$$;

-- X-COMPLETE-RPC4: update_macro_targets(user_id, calories, protein, carbs, fats, updated_by)
CREATE OR REPLACE FUNCTION update_macro_targets(
    p_user_id uuid,
    p_calories int DEFAULT NULL,
    p_protein int DEFAULT NULL,
    p_carbs int DEFAULT NULL,
    p_fats int DEFAULT NULL,
    p_updated_by text DEFAULT 'manual'
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    target_id uuid;
BEGIN
    -- Always insert new record (history tracking)
    INSERT INTO macro_targets (
        user_id, calories, protein, carbs, fats, updated_by
    )
    VALUES (
        p_user_id,
        p_calories,
        p_protein,
        p_carbs,
        p_fats,
        p_updated_by
    )
    RETURNING id INTO target_id;
    
    RETURN target_id;
END;
$$;

-- X-COMPLETE-RPC5: get_meal_preferences_full(user_id)
CREATE OR REPLACE FUNCTION get_meal_preferences_full(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_build_object(
        'diet_type', diet_type,
        'allergies', COALESCE(allergies, '{}'::text[]),
        'dislikes', COALESCE(dislikes, '{}'::text[]),
        'preferred_cuisines', COALESCE(preferred_cuisines, '{}'::text[]),
        'avoid_foods', COALESCE(avoid_foods, '{}'::text[]),
        'preferred_meal_times', COALESCE(preferred_meal_times, '{}'::jsonb),
        'updated_at', updated_at
    )
    FROM meal_preferences
    WHERE user_id = p_user_id;
$$;

-- 5. TRIGGERS ------------------------------------------------

CREATE OR REPLACE FUNCTION update_macro_targets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_macro_targets_timestamp
BEFORE UPDATE ON macro_targets
FOR EACH ROW
EXECUTE FUNCTION update_macro_targets_timestamp();

CREATE OR REPLACE FUNCTION update_meal_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meal_preferences_timestamp
BEFORE UPDATE ON meal_preferences
FOR EACH ROW
EXECUTE FUNCTION update_meal_preferences_timestamp();

-- =========================================================
-- MODULE X — COMPLETION — DONE
-- =========================================================

