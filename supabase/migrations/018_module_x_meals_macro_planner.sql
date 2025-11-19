-- =========================================================
-- MODULE X — MEALS & MACRO PLANNER
-- Daily and weekly meal plans, smart swaps, adaptive learning, grocery integration
-- =========================================================

-- 1. TABLES -----------------------------------------------

-- X1 — user_nutrition_settings
-- From onboarding profile + goals
CREATE TABLE IF NOT EXISTS user_nutrition_settings (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_calories int,
    protein_target int,
    carbs_target int,
    fat_target int,
    diet_type text, 
    -- vegetarian, vegan, paleo, keto, standard, pescatarian, mediterranean
    allergies text[] DEFAULT '{}'::text[],
    disliked_foods text[] DEFAULT '{}'::text[],
    preferred_foods text[] DEFAULT '{}'::text[],
    meals_per_day int DEFAULT 3,
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- X2 — meal_plans
-- Daily & Weekly meal plans
CREATE TABLE IF NOT EXISTS meal_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    type text NOT NULL, 
    -- 'daily' or 'weekly'
    metadata jsonb DEFAULT '{}'::jsonb,
    -- {"total_calories": 2200, "protein": 165, "carbs": 200, "fat": 65, "meals_count": 3}
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, date, type)
);

-- X3 — meal_plan_items
-- Each individual meal (breakfast/lunch/snack/dinner)
CREATE TABLE IF NOT EXISTS meal_plan_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    meal_slot text NOT NULL,
    -- breakfast, lunch, dinner, snack1, snack2
    recipe_id bigint REFERENCES recipes(id) ON DELETE SET NULL,
    food_id bigint REFERENCES foods(id) ON DELETE SET NULL,
    user_food_id bigint REFERENCES user_foods(id) ON DELETE SET NULL,
    quantity numeric(10,2) DEFAULT 1.0,
    macros jsonb DEFAULT '{}'::jsonb,
    -- {calories: 450, protein: 35, carbs: 40, fat: 18}
    order_index int DEFAULT 0,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- X4 — meal_plan_swaps
-- When user swaps meals → tracked for personalization
CREATE TABLE IF NOT EXISTS meal_plan_swaps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_item_id uuid REFERENCES meal_plan_items(id) ON DELETE SET NULL,
    old_item jsonb NOT NULL,
    new_item jsonb NOT NULL,
    reason text,
    -- "high_protein", "low_calorie", "budget", "5_min", "same_ingredients", "preference"
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- X5 — meal_plan_preferences
-- Adaptive Learning - tracks what user likes/dislikes
CREATE TABLE IF NOT EXISTS meal_plan_preferences (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    liked_recipes bigint[] DEFAULT '{}'::bigint[],
    disliked_recipes bigint[] DEFAULT '{}'::bigint[],
    liked_foods bigint[] DEFAULT '{}'::bigint[],
    disliked_foods bigint[] DEFAULT '{}'::bigint[],
    frequency_map jsonb DEFAULT '{}'::jsonb, 
    -- {"oats": 12, "chicken": 32, "salmon": 8}
    meal_timing_preferences jsonb DEFAULT '{}'::jsonb,
    -- {"breakfast": "07:00", "lunch": "12:30", "dinner": "19:00"}
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- 2. INDEXES ----------------------------------------------

CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_plans_type ON meal_plans(type);
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_plan ON meal_plan_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_meal_slot ON meal_plan_items(meal_slot);
CREATE INDEX IF NOT EXISTS idx_meal_plan_swaps_user ON meal_plan_swaps(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_swaps_created ON meal_plan_swaps(created_at DESC);

-- 3. RLS (Row-Level Security) ----------------------------

ALTER TABLE user_nutrition_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "users_manage_own_nutrition_settings"
ON user_nutrition_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_meal_plans"
ON meal_plans
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_meal_plan_items"
ON meal_plan_items
FOR ALL
USING (
    auth.uid() = (
        SELECT user_id FROM meal_plans WHERE id = plan_id
    )
)
WITH CHECK (
    auth.uid() = (
        SELECT user_id FROM meal_plans WHERE id = plan_id
    )
);

CREATE POLICY "users_manage_own_meal_swaps"
ON meal_plan_swaps
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_meal_preferences"
ON meal_plan_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. RPC FUNCTIONS ---------------------------------------

-- X-RPC1 — generate_daily_meal_plan(user_id, date)
-- Generates a daily meal plan
CREATE OR REPLACE FUNCTION generate_daily_meal_plan(
    p_user uuid,
    p_date date DEFAULT CURRENT_DATE
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_plan_id uuid;
    settings_record RECORD;
    goals_record RECORD;
    is_premium boolean;
    calories_target int;
    protein_target int;
    carbs_target int;
    fat_target int;
    meals_count int;
BEGIN
    -- Check if user is premium (weekly plans are premium-only)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    -- Get nutrition settings
    SELECT * INTO settings_record
    FROM user_nutrition_settings
    WHERE user_id = p_user;
    
    -- If no settings, get from user_goals
    IF settings_record IS NULL THEN
        SELECT 
            calories_target, protein_target, carbs_target, fats_target
        INTO calories_target, protein_target, carbs_target, fat_target
        FROM user_goals
        WHERE user_id = p_user
        ORDER BY generated_at DESC
        LIMIT 1;
        
        meals_count := 3; -- default
    ELSE
        calories_target := settings_record.daily_calories;
        protein_target := settings_record.protein_target;
        carbs_target := settings_record.carbs_target;
        fat_target := settings_record.fat_target;
        meals_count := COALESCE(settings_record.meals_per_day, 3);
    END IF;
    
    -- If still no targets, use defaults
    IF calories_target IS NULL THEN
        calories_target := 2000;
        protein_target := 150;
        carbs_target := 200;
        fat_target := 65;
    END IF;
    
    -- Create meal plan
    INSERT INTO meal_plans (user_id, date, type, metadata)
    VALUES (
        p_user,
        p_date,
        'daily',
        jsonb_build_object(
            'total_calories', calories_target,
            'protein', protein_target,
            'carbs', carbs_target,
            'fat', fat_target,
            'meals_count', meals_count,
            'diet_type', COALESCE(settings_record.diet_type, 'standard'),
            'is_premium', is_premium
        )
    )
    ON CONFLICT (user_id, date, type) 
    DO UPDATE SET
        metadata = EXCLUDED.metadata,
        created_at = timezone('utc', now())
    RETURNING id INTO new_plan_id;
    
    -- Note: Actual meal generation logic will be in API layer (Cursor)
    -- This function just creates the plan structure
    
    RETURN new_plan_id;
END;
$$;

-- X-RPC2 — generate_weekly_meal_plan(user_id, start_date)
-- Generates a weekly meal plan (premium only)
CREATE OR REPLACE FUNCTION generate_weekly_meal_plan(
    p_user uuid,
    p_start_date date DEFAULT CURRENT_DATE
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_plan_id uuid;
    is_premium boolean;
    settings_record RECORD;
    calories_target int;
    protein_target int;
    carbs_target int;
    fat_target int;
BEGIN
    -- Check if user is premium (weekly plans are premium-only)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    IF NOT is_premium THEN
        RAISE EXCEPTION 'Weekly meal plans require premium subscription.';
    END IF;
    
    -- Get nutrition settings
    SELECT * INTO settings_record
    FROM user_nutrition_settings
    WHERE user_id = p_user;
    
    -- If no settings, get from user_goals
    IF settings_record IS NULL THEN
        SELECT 
            calories_target, protein_target, carbs_target, fats_target
        INTO calories_target, protein_target, carbs_target, fat_target
        FROM user_goals
        WHERE user_id = p_user
        ORDER BY generated_at DESC
        LIMIT 1;
    ELSE
        calories_target := settings_record.daily_calories;
        protein_target := settings_record.protein_target;
        carbs_target := settings_record.carbs_target;
        fat_target := settings_record.fat_target;
    END IF;
    
    -- If still no targets, use defaults
    IF calories_target IS NULL THEN
        calories_target := 2000;
        protein_target := 150;
        carbs_target := 200;
        fat_target := 65;
    END IF;
    
    -- Create weekly meal plan
    INSERT INTO meal_plans (user_id, date, type, metadata)
    VALUES (
        p_user,
        p_start_date,
        'weekly',
        jsonb_build_object(
            'total_calories', calories_target * 7,
            'protein', protein_target * 7,
            'carbs', carbs_target * 7,
            'fat', fat_target * 7,
            'start_date', p_start_date,
            'end_date', p_start_date + INTERVAL '6 days',
            'diet_type', COALESCE(settings_record.diet_type, 'standard')
        )
    )
    ON CONFLICT (user_id, date, type) 
    DO UPDATE SET
        metadata = EXCLUDED.metadata,
        created_at = timezone('utc', now())
    RETURNING id INTO new_plan_id;
    
    RETURN new_plan_id;
END;
$$;

-- X-RPC3 — get_meal_plan(user_id, date, type)
-- Gets meal plan for a user
CREATE OR REPLACE FUNCTION get_meal_plan(
    p_user uuid,
    p_date date DEFAULT CURRENT_DATE,
    p_type text DEFAULT 'daily'
)
RETURNS jsonb
LANGUAGE sql
AS $$
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
    )
    FROM meal_plans mp
    WHERE mp.user_id = p_user
      AND mp.date = p_date
      AND mp.type = p_type
    LIMIT 1;
$$;

-- X-RPC4 — add_meal_to_plan(plan_id, meal_slot, recipe_id, food_id, user_food_id, quantity, macros)
-- Adds a meal item to a plan
CREATE OR REPLACE FUNCTION add_meal_to_plan(
    p_plan_id uuid,
    p_meal_slot text,
    p_recipe_id bigint DEFAULT NULL,
    p_food_id bigint DEFAULT NULL,
    p_user_food_id bigint DEFAULT NULL,
    p_quantity numeric DEFAULT 1.0,
    p_macros jsonb DEFAULT '{}'::jsonb,
    p_order_index int DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    new_item_id uuid;
BEGIN
    -- Validate that at least one food source is provided
    IF p_recipe_id IS NULL AND p_food_id IS NULL AND p_user_food_id IS NULL THEN
        RAISE EXCEPTION 'At least one food source (recipe_id, food_id, or user_food_id) must be provided';
    END IF;
    
    INSERT INTO meal_plan_items (
        plan_id, meal_slot, recipe_id, food_id, user_food_id, 
        quantity, macros, order_index
    )
    VALUES (
        p_plan_id, p_meal_slot, p_recipe_id, p_food_id, p_user_food_id,
        p_quantity, p_macros, p_order_index
    )
    RETURNING id INTO new_item_id;
    
    RETURN new_item_id;
END;
$$;

-- X-RPC5 — create_meal_swap(user_id, plan_item_id, old_item, new_item, reason)
-- Tracks what user replaces
CREATE OR REPLACE FUNCTION create_meal_swap(
    p_user uuid,
    p_plan_item_id uuid,
    p_old_item jsonb,
    p_new_item jsonb,
    p_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    swap_id uuid;
    is_premium boolean;
BEGIN
    -- Check if user is premium (smart swaps are premium-only)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    IF NOT is_premium AND p_reason IN ('high_protein', 'low_calorie', 'budget', '5_min', 'same_ingredients') THEN
        RAISE EXCEPTION 'Smart swaps require premium subscription.';
    END IF;
    
    INSERT INTO meal_plan_swaps (user_id, plan_item_id, old_item, new_item, reason)
    VALUES (p_user, p_plan_item_id, p_old_item, p_new_item, p_reason)
    RETURNING id INTO swap_id;
    
    -- Update the meal plan item
    UPDATE meal_plan_items
    SET 
        recipe_id = CASE WHEN p_new_item->>'recipe_id' IS NOT NULL THEN (p_new_item->>'recipe_id')::bigint ELSE recipe_id END,
        food_id = CASE WHEN p_new_item->>'food_id' IS NOT NULL THEN (p_new_item->>'food_id')::bigint ELSE food_id END,
        user_food_id = CASE WHEN p_new_item->>'user_food_id' IS NOT NULL THEN (p_new_item->>'user_food_id')::bigint ELSE user_food_id END,
        quantity = CASE WHEN p_new_item->>'quantity' IS NOT NULL THEN (p_new_item->>'quantity')::numeric ELSE quantity END,
        macros = COALESCE(p_new_item->'macros', macros)
    WHERE id = p_plan_item_id;
    
    RETURN swap_id;
END;
$$;

-- X-RPC6 — update_nutrition_settings(user_id, updates)
-- Updates user nutrition settings
CREATE OR REPLACE FUNCTION update_nutrition_settings(
    p_user uuid,
    p_updates jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO user_nutrition_settings (
        user_id,
        daily_calories,
        protein_target,
        carbs_target,
        fat_target,
        diet_type,
        allergies,
        disliked_foods,
        preferred_foods,
        meals_per_day,
        updated_at
    )
    VALUES (
        p_user,
        (p_updates->>'daily_calories')::int,
        (p_updates->>'protein_target')::int,
        (p_updates->>'carbs_target')::int,
        (p_updates->>'fat_target')::int,
        p_updates->>'diet_type',
        COALESCE((p_updates->'allergies')::text[], '{}'::text[]),
        COALESCE((p_updates->'disliked_foods')::text[], '{}'::text[]),
        COALESCE((p_updates->'preferred_foods')::text[], '{}'::text[]),
        COALESCE((p_updates->>'meals_per_day')::int, 3),
        timezone('utc', now())
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
        daily_calories = COALESCE(EXCLUDED.daily_calories, user_nutrition_settings.daily_calories),
        protein_target = COALESCE(EXCLUDED.protein_target, user_nutrition_settings.protein_target),
        carbs_target = COALESCE(EXCLUDED.carbs_target, user_nutrition_settings.carbs_target),
        fat_target = COALESCE(EXCLUDED.fat_target, user_nutrition_settings.fat_target),
        diet_type = COALESCE(EXCLUDED.diet_type, user_nutrition_settings.diet_type),
        allergies = COALESCE(EXCLUDED.allergies, user_nutrition_settings.allergies),
        disliked_foods = COALESCE(EXCLUDED.disliked_foods, user_nutrition_settings.disliked_foods),
        preferred_foods = COALESCE(EXCLUDED.preferred_foods, user_nutrition_settings.preferred_foods),
        meals_per_day = COALESCE(EXCLUDED.meals_per_day, user_nutrition_settings.meals_per_day),
        updated_at = timezone('utc', now());
END;
$$;

-- X-RPC7 — get_nutrition_settings(user_id)
-- Gets user nutrition settings
CREATE OR REPLACE FUNCTION get_nutrition_settings(p_user uuid)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_build_object(
        'daily_calories', daily_calories,
        'protein_target', protein_target,
        'carbs_target', carbs_target,
        'fat_target', fat_target,
        'diet_type', diet_type,
        'allergies', COALESCE(allergies, '{}'::text[]),
        'disliked_foods', COALESCE(disliked_foods, '{}'::text[]),
        'preferred_foods', COALESCE(preferred_foods, '{}'::text[]),
        'meals_per_day', COALESCE(meals_per_day, 3),
        'updated_at', updated_at
    )
    FROM user_nutrition_settings
    WHERE user_id = p_user;
$$;

-- X-RPC8 — update_meal_preferences(user_id, updates)
-- Updates meal plan preferences (adaptive learning)
CREATE OR REPLACE FUNCTION update_meal_preferences(
    p_user uuid,
    p_updates jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO meal_plan_preferences (
        user_id,
        liked_recipes,
        disliked_recipes,
        liked_foods,
        disliked_foods,
        frequency_map,
        meal_timing_preferences,
        updated_at
    )
    VALUES (
        p_user,
        COALESCE((p_updates->'liked_recipes')::bigint[], '{}'::bigint[]),
        COALESCE((p_updates->'disliked_recipes')::bigint[], '{}'::bigint[]),
        COALESCE((p_updates->'liked_foods')::bigint[], '{}'::bigint[]),
        COALESCE((p_updates->'disliked_foods')::bigint[], '{}'::bigint[]),
        COALESCE(p_updates->'frequency_map', '{}'::jsonb),
        COALESCE(p_updates->'meal_timing_preferences', '{}'::jsonb),
        timezone('utc', now())
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
        liked_recipes = COALESCE(EXCLUDED.liked_recipes, meal_plan_preferences.liked_recipes),
        disliked_recipes = COALESCE(EXCLUDED.disliked_recipes, meal_plan_preferences.disliked_recipes),
        liked_foods = COALESCE(EXCLUDED.liked_foods, meal_plan_preferences.liked_foods),
        disliked_foods = COALESCE(EXCLUDED.disliked_foods, meal_plan_preferences.disliked_foods),
        frequency_map = COALESCE(EXCLUDED.frequency_map, meal_plan_preferences.frequency_map),
        meal_timing_preferences = COALESCE(EXCLUDED.meal_timing_preferences, meal_plan_preferences.meal_timing_preferences),
        updated_at = timezone('utc', now());
END;
$$;

-- X-RPC9 — get_meal_preferences(user_id)
-- Gets meal plan preferences
CREATE OR REPLACE FUNCTION get_meal_preferences(p_user uuid)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_build_object(
        'liked_recipes', COALESCE(liked_recipes, '{}'::bigint[]),
        'disliked_recipes', COALESCE(disliked_recipes, '{}'::bigint[]),
        'liked_foods', COALESCE(liked_foods, '{}'::bigint[]),
        'disliked_foods', COALESCE(disliked_foods, '{}'::bigint[]),
        'frequency_map', COALESCE(frequency_map, '{}'::jsonb),
        'meal_timing_preferences', COALESCE(meal_timing_preferences, '{}'::jsonb),
        'updated_at', updated_at
    )
    FROM meal_plan_preferences
    WHERE user_id = p_user;
$$;

-- X-RPC10 — generate_grocery_list_from_plan(user_id, plan_id)
-- Auto-generates grocery list from meal plan (connects to Module F)
CREATE OR REPLACE FUNCTION generate_grocery_list_from_plan(
    p_user uuid,
    p_plan_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    plan_record RECORD;
    item_record RECORD;
    ingredient_record RECORD;
    grocery_items jsonb := '[]'::jsonb;
    shopping_list_id bigint;
    is_premium boolean;
    existing_item_id bigint;
BEGIN
    -- Check if user is premium (advanced grocery generator is premium-only)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    -- Get plan
    SELECT * INTO plan_record
    FROM meal_plans
    WHERE id = p_plan_id AND user_id = p_user;
    
    IF plan_record IS NULL THEN
        RETURN jsonb_build_object('error', 'Plan not found');
    END IF;
    
    -- Get or create shopping list (Module F)
    SELECT id INTO shopping_list_id
    FROM shopping_lists
    WHERE user_id = p_user
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF shopping_list_id IS NULL THEN
        -- Create new shopping list
        INSERT INTO shopping_lists (user_id, name)
        VALUES (p_user, 'Meal Plan Groceries')
        RETURNING id INTO shopping_list_id;
    END IF;
    
    -- Loop through meal plan items
    FOR item_record IN 
        SELECT * FROM meal_plan_items WHERE plan_id = p_plan_id
    LOOP
        -- If it's a recipe, get ingredients
        IF item_record.recipe_id IS NOT NULL THEN
            FOR ingredient_record IN
                SELECT ri.*, f.name as food_name, uf.name as user_food_name
                FROM recipe_ingredients ri
                LEFT JOIN foods f ON f.id = ri.food_id
                LEFT JOIN user_foods uf ON uf.id = ri.user_food_id
                WHERE ri.recipe_id = item_record.recipe_id
            LOOP
                -- Add to shopping list (Module F) - check if already exists (unchecked items only)
                -- Note: Requires Module F to be applied (uses is_checked column)
                SELECT id INTO existing_item_id
                FROM shopping_list_items
                WHERE list_id = shopping_list_id
                  AND item_name = COALESCE(ingredient_record.food_name, ingredient_record.user_food_name, 'Ingredient')
                  AND is_checked = false
                LIMIT 1;
                
                IF existing_item_id IS NULL THEN
                    INSERT INTO shopping_list_items (
                        list_id, item_name, quantity, category, added_from_recipe
                    )
                    VALUES (
                        shopping_list_id,
                        COALESCE(ingredient_record.food_name, ingredient_record.user_food_name, 'Ingredient'),
                        ingredient_record.quantity::text || ' ' || COALESCE(ingredient_record.measure_unit, 'units'),
                        'pantry',
                        true
                    );
                END IF;
                
                grocery_items := grocery_items || jsonb_build_object(
                    'item', COALESCE(ingredient_record.food_name, ingredient_record.user_food_name),
                    'quantity', ingredient_record.quantity,
                    'unit', ingredient_record.measure_unit
                );
            END LOOP;
        ELSIF item_record.food_id IS NOT NULL THEN
            -- Direct food item
            SELECT name INTO ingredient_record.food_name
            FROM foods
            WHERE id = item_record.food_id;
            
            -- Check if already exists (unchecked items only)
            -- Note: Requires Module F to be applied (uses is_checked column)
            SELECT id INTO existing_item_id
            FROM shopping_list_items
            WHERE list_id = shopping_list_id
              AND item_name = ingredient_record.food_name
              AND is_checked = false
            LIMIT 1;
            
            IF existing_item_id IS NULL THEN
                INSERT INTO shopping_list_items (
                    list_id, item_name, quantity, category
                )
                VALUES (
                    shopping_list_id,
                    ingredient_record.food_name,
                    item_record.quantity::text,
                    'pantry'
                );
            END IF;
            
            grocery_items := grocery_items || jsonb_build_object(
                'item', ingredient_record.food_name,
                'quantity', item_record.quantity
            );
        END IF;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'shopping_list_id', shopping_list_id,
        'items_added', jsonb_array_length(grocery_items),
        'items', grocery_items
    );
END;
$$;

-- X-RPC11 — get_plan_macros(plan_id)
-- Calculates total macros for a meal plan
CREATE OR REPLACE FUNCTION get_plan_macros(p_plan_id uuid)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_build_object(
        'total_calories', COALESCE(SUM((macros->>'calories')::numeric), 0),
        'total_protein', COALESCE(SUM((macros->>'protein')::numeric), 0),
        'total_carbs', COALESCE(SUM((macros->>'carbs')::numeric), 0),
        'total_fat', COALESCE(SUM((macros->>'fat')::numeric), 0),
        'meals_count', COUNT(*)
    )
    FROM meal_plan_items
    WHERE plan_id = p_plan_id;
$$;

-- X-RPC12 — delete_meal_plan_item(item_id)
-- Deletes a meal from plan
CREATE OR REPLACE FUNCTION delete_meal_plan_item(p_item_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM meal_plan_items
    WHERE id = p_item_id;
END;
$$;

-- 5. TRIGGERS ---------------------------------------------

-- Auto-update updated_at on user_nutrition_settings
CREATE OR REPLACE FUNCTION update_nutrition_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nutrition_settings_timestamp
BEFORE UPDATE ON user_nutrition_settings
FOR EACH ROW
EXECUTE FUNCTION update_nutrition_settings_timestamp();

-- Auto-update updated_at on meal_plan_preferences
CREATE OR REPLACE FUNCTION update_meal_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meal_preferences_timestamp
BEFORE UPDATE ON meal_plan_preferences
FOR EACH ROW
EXECUTE FUNCTION update_meal_preferences_timestamp();

