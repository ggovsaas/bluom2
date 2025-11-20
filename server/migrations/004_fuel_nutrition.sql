/*
  # Fuel & Nutrition Schema

  ## Description
  Complete nutrition tracking system including foods, recipes, meal logs, water logs,
  pantry management, and macro tracking.

  ## Tables Created
  1. **foods** - Food database (custom and external)
     - `id` (serial, pk)
     - `user_id` (uuid, fk) - Null for global foods
     - `name` (text) - Food name
     - `brand` (text) - Brand name
     - `serving_size` (text) - Serving size description
     - `calories`, `protein`, `carbs`, `fat` (numeric) - Macros
     - `barcode` (text) - Barcode for scanning
     - `source` (text) - custom, usda, external
     - `created_at` (timestamptz)

  2. **recipes** - User-created recipes
     - `id` (uuid, pk)
     - `user_id` (uuid, fk)
     - `name` (text)
     - `instructions` (text)
     - `title`, `description` (text)
     - `cooking_time` (integer) - Minutes
     - `servings` (integer)
     - `total_calories`, `total_protein`, `total_carbs`, `total_fat` (numeric)
     - `steps` (jsonb array)
     - `tags` (text array)
     - `ingredients` (jsonb array)
     - `ai_source` (text) - gpt, gpt_pantry, gpt_meal_plan

  3. **recipe_items** - Recipe ingredient relationships
     - `id` (uuid, pk)
     - `recipe_id` (uuid, fk)
     - `food_id` (integer, fk)
     - `quantity`, `unit` (text)

  4. **recipe_ingredients** - Alternative recipe ingredients table
  5. **recipe_steps** - Alternative recipe steps table

  6. **meal_logs** - Daily meal containers
     - `id` (serial, pk)
     - `user_id` (uuid, fk)
     - `date` (date)
     - `meal_type` (text) - breakfast, lunch, dinner, snack
     - `created_at` (timestamptz)

  7. **meal_log_items** - Individual foods/recipes in meals
     - `id` (uuid, pk)
     - `meal_log_id` (integer, fk)
     - `food_id` (integer, fk)
     - `recipe_id` (uuid, fk)
     - `quantity` (numeric)
     - `calories`, `protein`, `carbs`, `fat` (numeric)
     - `created_at` (timestamptz)

  8. **water_logs** - Water intake tracking
     - `id` (uuid, pk)
     - `user_id` (uuid, fk)
     - `ml` (integer) - Milliliters consumed
     - `created_at` (timestamptz)

  9. **pantry_items** - User pantry inventory
     - `id` (uuid, pk)
     - `user_id` (uuid, fk)
     - `item_name` (text)
     - `quantity`, `unit` (text)
     - `expires_at` (date)
     - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Global foods (user_id IS NULL) visible to all

  ## Notes
  - Supports both custom foods and external API foods
  - Recipe macros auto-calculated from ingredients
  - Meal logs group items by date and meal type
  - Water tracking in milliliters
*/

DROP TABLE IF EXISTS pantry_items CASCADE;
DROP TABLE IF EXISTS water_logs CASCADE;
DROP TABLE IF EXISTS meal_log_items CASCADE;
DROP TABLE IF EXISTS meal_logs CASCADE;
DROP TABLE IF EXISTS recipe_steps CASCADE;
DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS recipe_items CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS foods CASCADE;

-- =============================================
-- FOODS TABLE
-- =============================================

CREATE TABLE foods (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  serving_size text DEFAULT '100',
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  barcode text,
  source text DEFAULT 'custom' CHECK (source IN ('custom', 'usda', 'external', 'api')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own and global foods"
  ON foods FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own foods"
  ON foods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own foods"
  ON foods FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own foods"
  ON foods FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- RECIPES TABLE
-- =============================================

CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  title text,
  description text,
  instructions text,
  cooking_time integer,
  servings integer DEFAULT 1,
  total_calories numeric DEFAULT 0,
  total_protein numeric DEFAULT 0,
  total_carbs numeric DEFAULT 0,
  total_fat numeric DEFAULT 0,
  steps jsonb DEFAULT '[]'::jsonb,
  tags text[] DEFAULT '{}',
  ingredients jsonb DEFAULT '[]'::jsonb,
  ai_source text CHECK (ai_source IN ('gpt', 'gpt_pantry', 'gpt_meal_plan', 'manual')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own recipes"
  ON recipes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
  ON recipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- RECIPE ITEMS (ingredient relationships)
-- =============================================

CREATE TABLE recipe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  food_id integer NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 1,
  unit text DEFAULT 'g',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read recipe items for their recipes"
  ON recipe_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_items.recipe_id AND recipes.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert recipe items for their recipes"
  ON recipe_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_items.recipe_id AND recipes.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete recipe items for their recipes"
  ON recipe_items FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_items.recipe_id AND recipes.user_id = auth.uid()
  ));

-- =============================================
-- RECIPE INGREDIENTS (alternative structure)
-- =============================================

CREATE TABLE recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity numeric,
  unit text,
  calories numeric DEFAULT 0,
  protein numeric DEFAULT 0,
  carbs numeric DEFAULT 0,
  fats numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read ingredients for their recipes"
  ON recipe_ingredients FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()
  ));

-- =============================================
-- RECIPE STEPS (alternative structure)
-- =============================================

CREATE TABLE recipe_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  instruction text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(recipe_id, step_number)
);

ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read steps for their recipes"
  ON recipe_steps FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_steps.recipe_id AND recipes.user_id = auth.uid()
  ));

-- =============================================
-- MEAL LOGS
-- =============================================

CREATE TABLE meal_logs (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date, meal_type)
);

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own meal logs"
  ON meal_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal logs"
  ON meal_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs"
  ON meal_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs"
  ON meal_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- MEAL LOG ITEMS
-- =============================================

CREATE TABLE meal_log_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_log_id integer NOT NULL REFERENCES meal_logs(id) ON DELETE CASCADE,
  food_id integer REFERENCES foods(id) ON DELETE CASCADE,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 1,
  calories numeric DEFAULT 0,
  protein numeric DEFAULT 0,
  carbs numeric DEFAULT 0,
  fat numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CHECK ((food_id IS NOT NULL AND recipe_id IS NULL) OR (food_id IS NULL AND recipe_id IS NOT NULL))
);

ALTER TABLE meal_log_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read items for their meal logs"
  ON meal_log_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_logs WHERE meal_logs.id = meal_log_items.meal_log_id AND meal_logs.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert items for their meal logs"
  ON meal_log_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM meal_logs WHERE meal_logs.id = meal_log_items.meal_log_id AND meal_logs.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete items from their meal logs"
  ON meal_log_items FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_logs WHERE meal_logs.id = meal_log_items.meal_log_id AND meal_logs.user_id = auth.uid()
  ));

-- =============================================
-- WATER LOGS
-- =============================================

CREATE TABLE water_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ml integer NOT NULL DEFAULT 250,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own water logs"
  ON water_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water logs"
  ON water_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own water logs"
  ON water_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- PANTRY ITEMS
-- =============================================

CREATE TABLE pantry_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity text,
  unit text,
  expires_at date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pantry items"
  ON pantry_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pantry items"
  ON pantry_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pantry items"
  ON pantry_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pantry items"
  ON pantry_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_foods_user_id ON foods(user_id);
CREATE INDEX idx_foods_name ON foods(name);
CREATE INDEX idx_foods_barcode ON foods(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX idx_recipe_items_recipe_id ON recipe_items(recipe_id);
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
CREATE INDEX idx_meal_logs_user_date ON meal_logs(user_id, date DESC);
CREATE INDEX idx_meal_logs_date ON meal_logs(date DESC);
CREATE INDEX idx_meal_log_items_meal_log_id ON meal_log_items(meal_log_id);
CREATE INDEX idx_water_logs_user_date ON water_logs(user_id, created_at DESC);
CREATE INDEX idx_pantry_items_user_id ON pantry_items(user_id);
