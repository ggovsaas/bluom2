-- =========================================================
-- MODULE J PHASE 9B — FULL RECIPE AI (Auto Grocery Lists + Meal Builder)
-- Complete AI recipe system with meal planning and grocery integration
-- =========================================================

-- 1. ENHANCE RECIPES TABLE (if needed) ------------------------
DO $$
BEGIN
    -- Add image_url if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE recipes ADD COLUMN image_url text;
    END IF;
    
    -- Add cooking_time if it doesn't exist (or use cook_time)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'cooking_time'
    ) THEN
        ALTER TABLE recipes ADD COLUMN cooking_time int;
    END IF;
    
    -- Add steps array if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'steps'
    ) THEN
        ALTER TABLE recipes ADD COLUMN steps text[] DEFAULT '{}';
    END IF;
    
    -- Add ai_source if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'ai_source'
    ) THEN
        ALTER TABLE recipes ADD COLUMN ai_source text DEFAULT 'user';
    END IF;
    
    -- Rename name to title if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'name'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'title'
    ) THEN
        ALTER TABLE recipes RENAME COLUMN name TO title;
    END IF;
    
    -- Rename total_calories to calories if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'total_calories'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'calories'
    ) THEN
        ALTER TABLE recipes RENAME COLUMN total_calories TO calories;
    END IF;
    
    -- Rename total_protein to protein if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'total_protein'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'protein'
    ) THEN
        ALTER TABLE recipes RENAME COLUMN total_protein TO protein;
    END IF;
    
    -- Rename total_carbs to carbs if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'total_carbs'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'carbs'
    ) THEN
        ALTER TABLE recipes RENAME COLUMN total_carbs TO carbs;
    END IF;
    
    -- Rename total_fat to fats if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'total_fat'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'fats'
    ) THEN
        ALTER TABLE recipes RENAME COLUMN total_fat TO fats;
    END IF;
END $$;

-- 2. ENHANCE RECIPE_INGREDIENTS TABLE (if needed) ------------
DO $$
BEGIN
    -- Add ingredient_name if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipe_ingredients' AND column_name = 'ingredient_name'
    ) THEN
        ALTER TABLE recipe_ingredients ADD COLUMN ingredient_name text;
    END IF;
    
    -- Add unit if it doesn't exist (or use measure_unit)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipe_ingredients' AND column_name = 'unit'
    ) THEN
        ALTER TABLE recipe_ingredients ADD COLUMN unit text;
    END IF;
    
    -- Add nutrition columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipe_ingredients' AND column_name = 'calories'
    ) THEN
        ALTER TABLE recipe_ingredients ADD COLUMN calories int;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipe_ingredients' AND column_name = 'protein'
    ) THEN
        ALTER TABLE recipe_ingredients ADD COLUMN protein numeric;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipe_ingredients' AND column_name = 'carbs'
    ) THEN
        ALTER TABLE recipe_ingredients ADD COLUMN carbs numeric;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipe_ingredients' AND column_name = 'fats'
    ) THEN
        ALTER TABLE recipe_ingredients ADD COLUMN fats numeric;
    END IF;
END $$;

-- 3. MEAL PLAN DAYS TABLE ------------------------------------
CREATE TABLE IF NOT EXISTS meal_plan_days (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, date)
);

-- 4. MEAL PLAN ITEMS TABLE -----------------------------------
CREATE TABLE IF NOT EXISTS meal_plan_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id uuid NOT NULL REFERENCES meal_plan_days(id) ON DELETE CASCADE,
    meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    recipe_id bigint REFERENCES recipes(id) ON DELETE SET NULL,
    food_id bigint REFERENCES foods(id) ON DELETE SET NULL,
    user_food_id bigint REFERENCES user_foods(id) ON DELETE SET NULL,
    quantity numeric DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    UNIQUE(day_id, meal_type, recipe_id, food_id, user_food_id)
);

-- 5. INDEXES ----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_meal_plan_days_user_date ON meal_plan_days(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_day ON meal_plan_items(day_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_recipe ON meal_plan_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipes_user ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);

-- 6. RLS POLICIES ----------------------------------------------
ALTER TABLE meal_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own meal plan days" ON meal_plan_days
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own meal plan items" ON meal_plan_items
    FOR ALL USING (
        auth.uid() = (SELECT user_id FROM meal_plan_days WHERE id = day_id)
    ) WITH CHECK (
        auth.uid() = (SELECT user_id FROM meal_plan_days WHERE id = day_id)
    );

-- 7. TRIGGERS ---------------------------------------------------
CREATE TRIGGER update_meal_plan_days_updated_at
    BEFORE UPDATE ON meal_plan_days
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. RPC FUNCTIONS ---------------------------------------------

-- 8.1 Create recipe (enhanced version)
CREATE OR REPLACE FUNCTION create_recipe_ai(
    p_recipe_data jsonb
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_recipe_id bigint;
    v_ingredient jsonb;
    v_step text;
    v_step_array text[];
BEGIN
    -- Insert recipe
    INSERT INTO recipes (
        user_id,
        title,
        description,
        image_url,
        cooking_time,
        servings,
        calories,
        protein,
        carbs,
        fats,
        steps,
        tags,
        ai_source
    ) VALUES (
        (p_recipe_data->>'user_id')::uuid,
        p_recipe_data->>'title',
        p_recipe_data->>'description',
        p_recipe_data->>'image_url',
        (p_recipe_data->>'cooking_time')::int,
        COALESCE((p_recipe_data->>'servings')::int, 1),
        (p_recipe_data->>'calories')::int,
        (p_recipe_data->>'protein')::numeric,
        (p_recipe_data->>'carbs')::numeric,
        (p_recipe_data->>'fats')::numeric,
        ARRAY(SELECT jsonb_array_elements_text(p_recipe_data->'steps')),
        ARRAY(SELECT jsonb_array_elements_text(p_recipe_data->'tags')),
        COALESCE(p_recipe_data->>'ai_source', 'gpt')
    )
    RETURNING id INTO v_recipe_id;
    
    -- Insert ingredients
    FOR v_ingredient IN SELECT * FROM jsonb_array_elements(p_recipe_data->'ingredients')
    LOOP
        INSERT INTO recipe_ingredients (
            recipe_id,
            ingredient_name,
            quantity,
            unit,
            calories,
            protein,
            carbs,
            fats
        ) VALUES (
            v_recipe_id,
            v_ingredient->>'name',
            (v_ingredient->>'quantity')::numeric,
            v_ingredient->>'unit',
            (v_ingredient->>'calories')::int,
            (v_ingredient->>'protein')::numeric,
            (v_ingredient->>'carbs')::numeric,
            (v_ingredient->>'fats')::numeric
        );
    END LOOP;
    
    -- Insert steps (if using recipe_steps table)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recipe_steps') THEN
        FOR v_step IN SELECT jsonb_array_elements_text(p_recipe_data->'steps')
        LOOP
            INSERT INTO recipe_steps (recipe_id, step_number, instruction)
            VALUES (
                v_recipe_id,
                array_length(ARRAY(SELECT jsonb_array_elements_text(p_recipe_data->'steps')), 1) - 
                array_length(ARRAY(SELECT jsonb_array_elements_text(p_recipe_data->'steps')), 1) + 
                (SELECT COUNT(*) FROM recipe_steps WHERE recipe_id = v_recipe_id) + 1,
                v_step
            )
            ON CONFLICT (recipe_id, step_number) DO NOTHING;
        END LOOP;
    END IF;
    
    RETURN v_recipe_id::uuid;
END;
$$;

-- 8.2 Add recipe to shopping list
CREATE OR REPLACE FUNCTION add_recipe_to_shopping_list(
    p_recipe_id bigint,
    p_list_id text  -- Can be bigint or uuid, handled dynamically
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_list_id_type text;
    v_user_id uuid;
    v_ingredient RECORD;
    v_shopping_item_id bigint;
BEGIN
    -- Get user_id from recipe
    SELECT user_id INTO v_user_id
    FROM recipes
    WHERE id = p_recipe_id;
    
    -- Check list_id type
    SELECT data_type INTO v_list_id_type
    FROM information_schema.columns
    WHERE table_name = 'shopping_lists' AND column_name = 'id';
    
    -- Get recipe ingredients
    FOR v_ingredient IN
        SELECT 
            COALESCE(ri.ingredient_name, f.name, uf.name) as name,
            ri.quantity,
            COALESCE(ri.unit, ri.measure_unit, 'g') as unit
        FROM recipe_ingredients ri
        LEFT JOIN foods f ON ri.food_id = f.id
        LEFT JOIN user_foods uf ON ri.user_food_id = uf.id
        WHERE ri.recipe_id = p_recipe_id
    LOOP
        -- Insert into shopping list
        IF v_list_id_type = 'bigint' THEN
            INSERT INTO shopping_list_items (
                list_id, user_id, item_name, quantity, category, added_from_recipe
            )
            VALUES (
                p_list_id::bigint,
                v_user_id,
                v_ingredient.name,
                v_ingredient.quantity::text || ' ' || v_ingredient.unit,
                'pantry',
                true
            )
            ON CONFLICT DO NOTHING;
        ELSIF v_list_id_type = 'uuid' THEN
            INSERT INTO shopping_list_items (
                list_id, user_id, item_name, quantity, category, added_from_recipe
            )
            VALUES (
                p_list_id::uuid,
                v_user_id,
                v_ingredient.name,
                v_ingredient.quantity::text || ' ' || v_ingredient.unit,
                'pantry',
                true
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END;
$$;

-- 8.3 Get recipes with filters
CREATE OR REPLACE FUNCTION get_recipes_filtered(
    p_user_id uuid,
    p_search_term text DEFAULT NULL,
    p_tags text[] DEFAULT NULL,
    p_max_calories int DEFAULT NULL,
    p_min_protein int DEFAULT NULL,
    p_limit int DEFAULT 20
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_recipes jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'description', description,
            'image_url', image_url,
            'cooking_time', cooking_time,
            'servings', servings,
            'calories', calories,
            'protein', protein,
            'carbs', carbs,
            'fats', fats,
            'tags', tags,
            'ai_source', ai_source,
            'created_at', created_at
        )
    ) INTO v_recipes
    FROM recipes
    WHERE (
        user_id = p_user_id OR user_id IS NULL  -- Public recipes
    )
    AND (
        p_search_term IS NULL OR 
        title ILIKE '%' || p_search_term || '%' OR
        description ILIKE '%' || p_search_term || '%'
    )
    AND (
        p_tags IS NULL OR tags && p_tags
    )
    AND (
        p_max_calories IS NULL OR calories <= p_max_calories
    )
    AND (
        p_min_protein IS NULL OR protein >= p_min_protein
    )
    ORDER BY created_at DESC
    LIMIT p_limit;
    
    RETURN COALESCE(v_recipes, '[]'::jsonb);
END;
$$;

-- 8.4 Get meal plan for date range
CREATE OR REPLACE FUNCTION get_meal_plan(
    p_user_id uuid,
    p_start_date date,
    p_end_date date
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_plan jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', mpd.date,
            'meals', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', mpi.id,
                        'meal_type', mpi.meal_type,
                        'recipe_id', mpi.recipe_id,
                        'recipe', CASE WHEN mpi.recipe_id IS NOT NULL THEN
                            jsonb_build_object(
                                'id', r.id,
                                'title', r.title,
                                'calories', r.calories,
                                'protein', r.protein,
                                'carbs', r.carbs,
                                'fats', r.fats
                            )
                        ELSE NULL END,
                        'quantity', mpi.quantity
                    )
                )
                FROM meal_plan_items mpi
                LEFT JOIN recipes r ON r.id = mpi.recipe_id
                WHERE mpi.day_id = mpd.id
            )
        )
    ) INTO v_plan
    FROM meal_plan_days mpd
    WHERE mpd.user_id = p_user_id
    AND mpd.date >= p_start_date
    AND mpd.date <= p_end_date
    ORDER BY mpd.date;
    
    RETURN COALESCE(v_plan, '[]'::jsonb);
END;
$$;

-- 8.5 Add recipe to meal plan
CREATE OR REPLACE FUNCTION add_recipe_to_meal_plan(
    p_user_id uuid,
    p_date date,
    p_meal_type text,
    p_recipe_id bigint
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_day_id uuid;
BEGIN
    -- Get or create meal plan day
    INSERT INTO meal_plan_days (user_id, date)
    VALUES (p_user_id, p_date)
    ON CONFLICT (user_id, date) DO UPDATE SET updated_at = now()
    RETURNING id INTO v_day_id;
    
    -- Get day_id if already exists
    IF v_day_id IS NULL THEN
        SELECT id INTO v_day_id
        FROM meal_plan_days
        WHERE user_id = p_user_id AND date = p_date;
    END IF;
    
    -- Add meal plan item
    INSERT INTO meal_plan_items (day_id, meal_type, recipe_id)
    VALUES (v_day_id, p_meal_type, p_recipe_id)
    ON CONFLICT (day_id, meal_type, recipe_id, food_id, user_food_id) DO NOTHING
    RETURNING id INTO v_day_id;
    
    RETURN v_day_id;
END;
$$;

-- =========================================================
-- MODULE J PHASE 9B — COMPLETE
-- =========================================================

