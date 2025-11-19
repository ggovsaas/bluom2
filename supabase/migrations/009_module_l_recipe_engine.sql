-- =========================================================
-- MODULE L — RECIPE ENGINE (AI Meal Builder + Grocery Integration)
-- AI-generated recipes, user-created recipes, auto-generated grocery lists
-- =========================================================

-- 1. ENHANCE EXISTING RECIPES TABLE (from Module B) -------

-- Add missing columns to recipes if they don't exist
DO $$
BEGIN
    -- Add servings if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'servings'
    ) THEN
        ALTER TABLE recipes ADD COLUMN servings int DEFAULT 1;
    END IF;
    
    -- Add prep_time if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'prep_time'
    ) THEN
        ALTER TABLE recipes ADD COLUMN prep_time int;
    END IF;
    
    -- Add cook_time if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'cook_time'
    ) THEN
        ALTER TABLE recipes ADD COLUMN cook_time int;
    END IF;
    
    -- Add tags if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'tags'
    ) THEN
        ALTER TABLE recipes ADD COLUMN tags text[] DEFAULT '{}';
    END IF;
    
    -- Add is_ai_generated if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'is_ai_generated'
    ) THEN
        ALTER TABLE recipes ADD COLUMN is_ai_generated boolean DEFAULT false;
    END IF;
END $$;

-- 2. NEW TABLES -------------------------------------------

-- L1 — ingredients
-- All ingredients created by users or auto-imported
CREATE TABLE IF NOT EXISTS ingredients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    
    name text NOT NULL,
    brand text,
    serving_size numeric,            -- in grams
    calories numeric,
    protein numeric,
    carbs numeric,
    fats numeric,
    
    is_verified boolean DEFAULT false,  -- system verified vs user
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- L2 — recipe_steps
-- Ordered instructions for recipes
CREATE TABLE IF NOT EXISTS recipe_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id bigint REFERENCES recipes(id) ON DELETE CASCADE,
    step_number int NOT NULL,
    instruction text NOT NULL,
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(recipe_id, step_number)
);

-- L3 — ai_generated_meals
-- AI one-click meals from "Build me a lunch under 600 calories"
CREATE TABLE IF NOT EXISTS ai_generated_meals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    
    request text NOT NULL,
    generated_meal jsonb NOT NULL,        -- contains ingredients + nutrition + steps
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- L4 — recipe_grocery_links
-- Links recipes to shopping list items (Module F integration)
CREATE TABLE IF NOT EXISTS recipe_grocery_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id bigint REFERENCES recipes(id) ON DELETE CASCADE,
    shopping_item_id bigint,  -- References shopping_list_items(id) from Module F
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- 3. RLS (Row-Level Security) ----------------------------

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_grocery_links ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "users_manage_own_ingredients"
ON ingredients
FOR ALL
USING (user_id IS NULL OR auth.uid() = user_id)
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Public ingredients (system verified) are readable by all
CREATE POLICY "public_read_verified_ingredients"
ON ingredients
FOR SELECT
USING (is_verified = true OR user_id = auth.uid());

CREATE POLICY "users_manage_own_recipe_steps"
ON recipe_steps
FOR ALL
USING (
    auth.uid() = (
        SELECT user_id FROM recipes WHERE id = recipe_id
    )
)
WITH CHECK (
    auth.uid() = (
        SELECT user_id FROM recipes WHERE id = recipe_id
    )
);

CREATE POLICY "users_manage_own_ai_meals"
ON ai_generated_meals
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_grocery_links"
ON recipe_grocery_links
FOR ALL
USING (
    auth.uid() = (
        SELECT user_id FROM recipes WHERE id = recipe_id
    )
)
WITH CHECK (
    auth.uid() = (
        SELECT user_id FROM recipes WHERE id = recipe_id
    )
);

-- 4. INDEXES ----------------------------------------------

CREATE INDEX IF NOT EXISTS idx_ingredients_user ON ingredients(user_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_verified ON ingredients(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe ON recipe_steps(recipe_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_meals_user ON ai_generated_meals(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_grocery_links_recipe ON recipe_grocery_links(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_grocery_links_item ON recipe_grocery_links(shopping_item_id);

-- 5. RPC FUNCTIONS ---------------------------------------

-- L-RPC1 — add_ingredient(user_id, name, brand, serving_size, calories, protein, carbs, fats)
-- Add manual ingredient
CREATE OR REPLACE FUNCTION add_ingredient(
    user_id_param uuid,
    name_param text,
    brand_param text DEFAULT NULL,
    serving_size_param numeric DEFAULT NULL,
    calories_param numeric DEFAULT NULL,
    protein_param numeric DEFAULT NULL,
    carbs_param numeric DEFAULT NULL,
    fats_param numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    ingredient_id uuid;
BEGIN
    INSERT INTO ingredients (
        user_id, name, brand, serving_size, calories, protein, carbs, fats
    )
    VALUES (
        user_id_param, name_param, brand_param, serving_size_param,
        calories_param, protein_param, carbs_param, fats_param
    )
    RETURNING id INTO ingredient_id;
    
    RETURN ingredient_id;
END;
$$;

-- L-RPC2 — calculate_recipe_nutrition(ingredients_jsonb)
-- Helper function to calculate total nutrition from ingredients
CREATE OR REPLACE FUNCTION calculate_recipe_nutrition(ingredients_jsonb jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    total_calories numeric := 0;
    total_protein numeric := 0;
    total_carbs numeric := 0;
    total_fats numeric := 0;
    ing record;
    ing_calories numeric;
    ing_protein numeric;
    ing_carbs numeric;
    ing_fats numeric;
    amount numeric;
    serving_size numeric;
BEGIN
    FOR ing IN SELECT * FROM jsonb_array_elements(ingredients_jsonb)
    LOOP
        -- Get ingredient nutrition
        SELECT calories, protein, carbs, fats, serving_size
        INTO ing_calories, ing_protein, ing_carbs, ing_fats, serving_size
        FROM ingredients
        WHERE id = (ing->>'ingredient_id')::uuid;
        
        -- Get amount in grams
        amount := (ing->>'amount')::numeric;
        
        -- Calculate nutrition based on amount
        IF serving_size > 0 THEN
            total_calories := total_calories + (ing_calories * amount / serving_size);
            total_protein := total_protein + (ing_protein * amount / serving_size);
            total_carbs := total_carbs + (ing_carbs * amount / serving_size);
            total_fats := total_fats + (ing_fats * amount / serving_size);
        END IF;
    END LOOP;
    
    RETURN jsonb_build_object(
        'total_calories', total_calories,
        'total_protein', total_protein,
        'total_carbs', total_carbs,
        'total_fats', total_fats
    );
END;
$$;

-- L-RPC3 — create_recipe(user_id, name, description, servings, prep_time, cook_time, tags, ingredients_jsonb, steps_array)
-- Creates recipe with automatic nutrition calculation
CREATE OR REPLACE FUNCTION create_recipe(
    user_id_param uuid,
    name_param text,
    description_param text DEFAULT NULL,
    servings_param int DEFAULT 1,
    prep_time_param int DEFAULT NULL,
    cook_time_param int DEFAULT NULL,
    tags_param text[] DEFAULT '{}',
    ingredients_jsonb jsonb DEFAULT '[]'::jsonb,
    steps_array text[] DEFAULT '{}'::text[]
)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
    recipe_id_result bigint;
    nutrition jsonb;
    ing record;
    step_text text;
    step_num int := 1;
BEGIN
    -- Calculate nutrition from ingredients
    nutrition := calculate_recipe_nutrition(ingredients_jsonb);
    
    -- Insert recipe
    INSERT INTO recipes (
        user_id, name, description, servings, prep_time, cook_time, tags,
        total_calories, total_protein, total_carbs, total_fat,
        is_ai_generated
    )
    VALUES (
        user_id_param, name_param, description_param, servings_param,
        prep_time_param, cook_time_param, tags_param,
        (nutrition->>'total_calories')::numeric,
        (nutrition->>'total_protein')::numeric,
        (nutrition->>'total_carbs')::numeric,
        (nutrition->>'total_fats')::numeric,
        false
    )
    RETURNING id INTO recipe_id_result;
    
    -- Insert recipe ingredients (using Module B structure - food_id/user_food_id)
    -- Note: This function uses ingredients table, but Module B uses foods/user_foods
    -- For compatibility, we'll create a bridge or use ingredients directly
    -- This is a simplified version - full implementation would handle both
    
    -- Insert recipe steps
    FOREACH step_text IN ARRAY steps_array
    LOOP
        INSERT INTO recipe_steps (recipe_id, step_number, instruction)
        VALUES (recipe_id_result, step_num, step_text);
        step_num := step_num + 1;
    END LOOP;
    
    RETURN recipe_id_result;
END;
$$;

-- L-RPC4 — add_recipe_step(recipe_id, step_number, instruction)
-- Add a step to a recipe
CREATE OR REPLACE FUNCTION add_recipe_step(
    recipe_id_param bigint,
    step_number_param int,
    instruction_param text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    step_id uuid;
BEGIN
    INSERT INTO recipe_steps (recipe_id, step_number, instruction)
    VALUES (recipe_id_param, step_number_param, instruction_param)
    ON CONFLICT (recipe_id, step_number) DO UPDATE
    SET instruction = EXCLUDED.instruction
    RETURNING id INTO step_id;
    
    RETURN step_id;
END;
$$;

-- L-RPC5 — get_recipe_with_steps(recipe_id)
-- Get recipe with all steps ordered
CREATE OR REPLACE FUNCTION get_recipe_with_steps(recipe_id_param bigint)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    recipe_data jsonb;
    steps_data jsonb;
BEGIN
    -- Get recipe
    SELECT to_jsonb(r.*) INTO recipe_data
    FROM recipes r
    WHERE r.id = recipe_id_param;
    
    -- Get steps
    SELECT jsonb_agg(
        jsonb_build_object(
            'step_number', step_number,
            'instruction', instruction
        ) ORDER BY step_number
    ) INTO steps_data
    FROM recipe_steps
    WHERE recipe_id = recipe_id_param;
    
    -- Combine
    RETURN recipe_data || jsonb_build_object('steps', COALESCE(steps_data, '[]'::jsonb));
END;
$$;

-- L-RPC6 — save_ai_generated_meal(user_id, request, generated_meal)
-- Save AI-generated meal
CREATE OR REPLACE FUNCTION save_ai_generated_meal(
    user_id_param uuid,
    request_param text,
    generated_meal_param jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    meal_id uuid;
BEGIN
    INSERT INTO ai_generated_meals (user_id, request, generated_meal)
    VALUES (user_id_param, request_param, generated_meal_param)
    RETURNING id INTO meal_id;
    
    RETURN meal_id;
END;
$$;

-- L-RPC7 — add_recipe_to_shopping_list(recipe_id, list_id)
-- Adds all recipe ingredients to shopping list
CREATE OR REPLACE FUNCTION add_recipe_to_shopping_list(
    recipe_id_param bigint,
    list_id_param text  -- Can be bigint (Module B) or uuid (Module F)
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    ing record;
    shopping_item_id_result bigint;
    list_id_type text;
    user_id_val uuid;
BEGIN
    -- Get user_id from recipe
    SELECT user_id INTO user_id_val
    FROM recipes
    WHERE id = recipe_id_param;
    
    -- Check if list_id is bigint or uuid
    SELECT data_type INTO list_id_type
    FROM information_schema.columns
    WHERE table_name = 'shopping_list_items' AND column_name = 'list_id';
    
    -- Get recipe ingredients (from Module B structure)
    FOR ing IN 
        SELECT 
            ri.quantity,
            ri.measure_unit,
            COALESCE(f.name, uf.name) as ingredient_name
        FROM recipe_ingredients ri
        LEFT JOIN foods f ON ri.food_id = f.id
        LEFT JOIN user_foods uf ON ri.user_food_id = uf.id
        WHERE ri.recipe_id = recipe_id_param
    LOOP
        -- Insert into shopping list
        IF list_id_type = 'bigint' THEN
            INSERT INTO shopping_list_items (
                list_id, user_id, item_name, quantity, category
            )
            VALUES (
                list_id_param::bigint, user_id_val, ing.ingredient_name,
                ing.quantity::text, 'pantry'
            )
            RETURNING id INTO shopping_item_id_result;
            
            -- Link to recipe
            INSERT INTO recipe_grocery_links (recipe_id, shopping_item_id)
            VALUES (recipe_id_param, shopping_item_id_result)
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END;
$$;

-- L-RPC8 — get_recipe_ingredients(recipe_id)
-- Get all ingredients for a recipe
CREATE OR REPLACE FUNCTION get_recipe_ingredients(recipe_id_param bigint)
RETURNS TABLE (
    ingredient_name text,
    quantity numeric,
    unit text,
    calories numeric,
    protein numeric,
    carbs numeric,
    fats numeric
)
LANGUAGE sql
AS $$
    SELECT 
        COALESCE(f.name, uf.name) as ingredient_name,
        ri.quantity,
        ri.measure_unit as unit,
        COALESCE(f.calories, uf.calories) as calories,
        COALESCE(f.protein, uf.protein) as protein,
        COALESCE(f.carbs, uf.carbs) as carbs,
        COALESCE(f.fat, uf.fat) as fats
    FROM recipe_ingredients ri
    LEFT JOIN foods f ON ri.food_id = f.id
    LEFT JOIN user_foods uf ON ri.user_food_id = uf.id
    WHERE ri.recipe_id = recipe_id_param
    ORDER BY ri.id;
$$;

-- L-RPC9 — search_ingredients(search_term)
-- Search ingredients (verified + user's own)
CREATE OR REPLACE FUNCTION search_ingredients(search_term text)
RETURNS TABLE (
    id uuid,
    name text,
    brand text,
    serving_size numeric,
    calories numeric,
    protein numeric,
    carbs numeric,
    fats numeric,
    is_verified boolean
)
LANGUAGE sql
AS $$
    SELECT 
        i.id, i.name, i.brand, i.serving_size,
        i.calories, i.protein, i.carbs, i.fats,
        i.is_verified
    FROM ingredients i
    WHERE (
        i.is_verified = true 
        OR i.user_id = auth.uid()
    )
    AND (
        LOWER(i.name) LIKE '%' || LOWER(search_term) || '%'
        OR (i.brand IS NOT NULL AND LOWER(i.brand) LIKE '%' || LOWER(search_term) || '%')
    )
    ORDER BY i.is_verified DESC, i.name
    LIMIT 50;
$$;

-- L-RPC10 — get_user_ai_meals(user_id, limit_count)
-- Get user's AI-generated meals
CREATE OR REPLACE FUNCTION get_user_ai_meals(
    user_id_param uuid,
    limit_count int DEFAULT 20
)
RETURNS TABLE (
    id uuid,
    request text,
    generated_meal jsonb,
    created_at timestamptz
)
LANGUAGE sql
AS $$
    SELECT id, request, generated_meal, created_at
    FROM ai_generated_meals
    WHERE user_id = user_id_param
    ORDER BY created_at DESC
    LIMIT limit_count;
$$;

