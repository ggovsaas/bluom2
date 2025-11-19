-- =========================================================
-- MODULE B — NUTRITION ENGINE
-- Food database, recipes, meal logs, shopping lists, AI suggestions
-- =========================================================

-- 1. GLOBAL FOOD DATABASE ---------------------------------

CREATE TABLE foods (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    serving_size NUMERIC(10,2),
    serving_unit TEXT,
    calories NUMERIC(10,2),
    protein NUMERIC(10,2),
    carbs NUMERIC(10,2),
    fat NUMERIC(10,2),
    fiber NUMERIC(10,2),
    sugar NUMERIC(10,2),
    saturated_fat NUMERIC(10,2),
    sodium NUMERIC(10,2),
    potassium NUMERIC(10,2),
    cholesterol NUMERIC(10,2),
    barcode TEXT UNIQUE,
    source TEXT CHECK (source IN ('fatsecret','usda','manual')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

-- Everyone can read global foods
CREATE POLICY "public_read_foods"
ON foods FOR SELECT
USING (true);

-- 2. USER CUSTOM FOODS ------------------------------------

CREATE TABLE user_foods (
    id BIGSERIAL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    brand TEXT,
    serving_size NUMERIC(10,2),
    serving_unit TEXT,
    calories NUMERIC(10,2),
    protein NUMERIC(10,2),
    carbs NUMERIC(10,2),
    fat NUMERIC(10,2),
    fiber NUMERIC(10,2),
    sugar NUMERIC(10,2),
    saturated_fat NUMERIC(10,2),
    sodium NUMERIC(10,2),
    potassium NUMERIC(10,2),
    cholesterol NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE user_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_user_foods"
ON user_foods FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. RECIPES ---------------------------------------------

CREATE TABLE recipes (
    id BIGSERIAL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    total_calories NUMERIC(10,2),
    total_protein NUMERIC(10,2),
    total_carbs NUMERIC(10,2),
    total_fat NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_recipes"
ON recipes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3B. RECIPE INGREDIENTS -----------------------------------

CREATE TABLE recipe_ingredients (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT REFERENCES recipes(id) ON DELETE CASCADE,
    food_id BIGINT REFERENCES foods(id),
    user_food_id BIGINT REFERENCES user_foods(id),
    quantity NUMERIC(10,2),
    measure_unit TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Users can only see ingredients for their own recipes
CREATE POLICY "users_manage_own_recipe_ingredients"
ON recipe_ingredients FOR ALL
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

-- 4. MEAL LOGS --------------------------------------------

CREATE TYPE meal_type AS ENUM ('breakfast','lunch','dinner','snack');

CREATE TABLE meal_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    meal meal_type NOT NULL,
    food_id BIGINT REFERENCES foods(id),
    user_food_id BIGINT REFERENCES user_foods(id),
    recipe_id BIGINT REFERENCES recipes(id),
    quantity NUMERIC(10,2) NOT NULL,
    logged_at DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_meals"
ON meal_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. SHOPPING LIST ----------------------------------------

CREATE TABLE shopping_lists (
    id BIGSERIAL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'My Shopping List',
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE TABLE shopping_list_items (
    id BIGSERIAL PRIMARY KEY,
    list_id BIGINT REFERENCES shopping_lists(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity TEXT,
    category TEXT,
    checked BOOLEAN DEFAULT false,
    added_from_recipe BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_lists"
ON shopping_lists FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_list_items"
ON shopping_list_items FOR ALL
USING (
    auth.uid() = (
        SELECT user_id FROM shopping_lists WHERE id = list_id
    )
)
WITH CHECK (
    auth.uid() = (
        SELECT user_id FROM shopping_lists WHERE id = list_id
    )
);

-- 6. AI SUGGESTION LOG ------------------------------------

CREATE TABLE ai_meal_suggestions (
    id BIGSERIAL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    suggestion JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE ai_meal_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_ai_suggestions"
ON ai_meal_suggestions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. BARCODE SCAN HISTORY ---------------------------------

CREATE TABLE barcode_scans (
    id BIGSERIAL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    barcode TEXT NOT NULL,
    match_found BOOLEAN,
    food_id BIGINT REFERENCES foods(id),
    scanned_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE barcode_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_scans"
ON barcode_scans FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 8. DAILY MACROS -----------------------------------------

CREATE TABLE daily_nutrition_summary (
    id BIGSERIAL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    calories NUMERIC(10,2),
    protein NUMERIC(10,2),
    carbs NUMERIC(10,2),
    fat NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    UNIQUE(user_id, date)
);

ALTER TABLE daily_nutrition_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_nutrition_summary"
ON daily_nutrition_summary FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- INDEXES for performance ---------------------------------

CREATE INDEX idx_meal_logs_user_date ON meal_logs(user_id, logged_at);
CREATE INDEX idx_foods_barcode ON foods(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_shopping_list_items_list ON shopping_list_items(list_id);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_daily_nutrition_user_date ON daily_nutrition_summary(user_id, date);

