/*
  # Food Photo Recognition System

  ## Description
  Creates tables to support food photo recognition, nutrition tracking, and multi-language support.

  ## New Tables
  1. **food_recognition_logs** - Stores photo recognition attempts and results
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `image_url` (text) - Optional storage URL if we save images
     - `detected_items` (jsonb) - Array of detected food items with confidence
     - `vision_source` (text) - clarifai or openai
     - `language` (text) - User's language preference
     - `created_at` (timestamptz)

  2. **food_items_multilang** - Multi-language food name translations
     - `id` (uuid, primary key)
     - `canonical_name` (text) - English canonical name
     - `language_code` (text) - ISO language code (en, pt, es, nl, de, fr)
     - `translated_name` (text) - Localized food name
     - `category` (text) - Food category
     - `created_at` (timestamptz)

  3. **user_food_photos** - User uploaded food photos with nutrition
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `photo_url` (text) - Storage bucket URL
     - `detected_foods` (jsonb) - Recognition results
     - `total_calories` (numeric) - Sum of all items
     - `total_protein` (numeric)
     - `total_carbs` (numeric)
     - `total_fat` (numeric)
     - `meal_type` (text) - breakfast, lunch, dinner, snack
     - `meal_date` (date)
     - `notes` (text)
     - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
*/

-- =============================================
-- FOOD RECOGNITION LOGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS food_recognition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url text,
  detected_items jsonb DEFAULT '[]'::jsonb,
  vision_source text CHECK (vision_source IN ('clarifai', 'openai')),
  language text DEFAULT 'en',
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_food_recognition_logs_user_id ON food_recognition_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_food_recognition_logs_created_at ON food_recognition_logs(created_at DESC);

-- Enable RLS
ALTER TABLE food_recognition_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own recognition logs"
  ON food_recognition_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recognition logs"
  ON food_recognition_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- MULTI-LANGUAGE FOOD NAMES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS food_items_multilang (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  language_code text NOT NULL CHECK (language_code IN ('en', 'pt', 'es', 'nl', 'de', 'fr')),
  translated_name text NOT NULL,
  category text,
  aliases text[], -- Alternative names in this language
  created_at timestamptz DEFAULT now(),
  UNIQUE(canonical_name, language_code)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_food_multilang_canonical ON food_items_multilang(canonical_name);
CREATE INDEX IF NOT EXISTS idx_food_multilang_language ON food_items_multilang(language_code);
CREATE INDEX IF NOT EXISTS idx_food_multilang_translated ON food_items_multilang(translated_name);

-- Enable RLS (read-only for all authenticated users)
ALTER TABLE food_items_multilang ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "All authenticated users can read food translations"
  ON food_items_multilang FOR SELECT
  TO authenticated
  USING (true);

-- Note: Only service role can insert/update translations
-- Regular users have read-only access
-- Admins should use Supabase Dashboard or service role key for modifications

-- =============================================
-- USER FOOD PHOTOS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS user_food_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  photo_url text,
  detected_foods jsonb DEFAULT '[]'::jsonb,
  total_calories numeric DEFAULT 0,
  total_protein numeric DEFAULT 0,
  total_carbs numeric DEFAULT 0,
  total_fat numeric DEFAULT 0,
  total_fiber numeric DEFAULT 0,
  meal_type text CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_food_photos_user_id ON user_food_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_food_photos_meal_date ON user_food_photos(meal_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_food_photos_created_at ON user_food_photos(created_at DESC);

-- Enable RLS
ALTER TABLE user_food_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own food photos"
  ON user_food_photos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food photos"
  ON user_food_photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food photos"
  ON user_food_photos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own food photos"
  ON user_food_photos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get translated food name
CREATE OR REPLACE FUNCTION get_translated_food_name(
  p_canonical_name text,
  p_language_code text DEFAULT 'en'
)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_translated_name text;
BEGIN
  SELECT translated_name INTO v_translated_name
  FROM food_items_multilang
  WHERE canonical_name = p_canonical_name
    AND language_code = p_language_code
  LIMIT 1;

  -- Return canonical name if no translation found
  RETURN COALESCE(v_translated_name, p_canonical_name);
END;
$$;

-- =============================================
-- SEED COMMON FOOD TRANSLATIONS
-- =============================================

-- Insert some common foods in multiple languages
INSERT INTO food_items_multilang (canonical_name, language_code, translated_name, category) VALUES
  -- Apple
  ('Apple', 'en', 'Apple', 'Fruit'),
  ('Apple', 'pt', 'Maçã', 'Fruta'),
  ('Apple', 'es', 'Manzana', 'Fruta'),
  ('Apple', 'nl', 'Appel', 'Fruit'),
  ('Apple', 'de', 'Apfel', 'Obst'),
  ('Apple', 'fr', 'Pomme', 'Fruit'),

  -- Banana
  ('Banana', 'en', 'Banana', 'Fruit'),
  ('Banana', 'pt', 'Banana', 'Fruta'),
  ('Banana', 'es', 'Plátano', 'Fruta'),
  ('Banana', 'nl', 'Banaan', 'Fruit'),
  ('Banana', 'de', 'Banane', 'Obst'),
  ('Banana', 'fr', 'Banane', 'Fruit'),

  -- Chicken Breast
  ('Chicken Breast', 'en', 'Chicken Breast', 'Protein'),
  ('Chicken Breast', 'pt', 'Peito de Frango', 'Proteína'),
  ('Chicken Breast', 'es', 'Pechuga de Pollo', 'Proteína'),
  ('Chicken Breast', 'nl', 'Kipfilet', 'Eiwit'),
  ('Chicken Breast', 'de', 'Hähnchenbrust', 'Protein'),
  ('Chicken Breast', 'fr', 'Blanc de Poulet', 'Protéine'),

  -- Rice
  ('Rice', 'en', 'Rice', 'Grain'),
  ('Rice', 'pt', 'Arroz', 'Grão'),
  ('Rice', 'es', 'Arroz', 'Grano'),
  ('Rice', 'nl', 'Rijst', 'Graan'),
  ('Rice', 'de', 'Reis', 'Getreide'),
  ('Rice', 'fr', 'Riz', 'Céréale'),

  -- Broccoli
  ('Broccoli', 'en', 'Broccoli', 'Vegetable'),
  ('Broccoli', 'pt', 'Brócolis', 'Vegetal'),
  ('Broccoli', 'es', 'Brócoli', 'Vegetal'),
  ('Broccoli', 'nl', 'Broccoli', 'Groente'),
  ('Broccoli', 'de', 'Brokkoli', 'Gemüse'),
  ('Broccoli', 'fr', 'Brocoli', 'Légume'),

  -- Egg
  ('Egg', 'en', 'Egg', 'Protein'),
  ('Egg', 'pt', 'Ovo', 'Proteína'),
  ('Egg', 'es', 'Huevo', 'Proteína'),
  ('Egg', 'nl', 'Ei', 'Eiwit'),
  ('Egg', 'de', 'Ei', 'Protein'),
  ('Egg', 'fr', 'Œuf', 'Protéine'),

  -- Bread
  ('Bread', 'en', 'Bread', 'Grain'),
  ('Bread', 'pt', 'Pão', 'Grão'),
  ('Bread', 'es', 'Pan', 'Grano'),
  ('Bread', 'nl', 'Brood', 'Graan'),
  ('Bread', 'de', 'Brot', 'Getreide'),
  ('Bread', 'fr', 'Pain', 'Céréale'),

  -- Salmon
  ('Salmon', 'en', 'Salmon', 'Fish'),
  ('Salmon', 'pt', 'Salmão', 'Peixe'),
  ('Salmon', 'es', 'Salmón', 'Pescado'),
  ('Salmon', 'nl', 'Zalm', 'Vis'),
  ('Salmon', 'de', 'Lachs', 'Fisch'),
  ('Salmon', 'fr', 'Saumon', 'Poisson'),

  -- Milk
  ('Milk', 'en', 'Milk', 'Dairy'),
  ('Milk', 'pt', 'Leite', 'Laticínio'),
  ('Milk', 'es', 'Leche', 'Lácteo'),
  ('Milk', 'nl', 'Melk', 'Zuivel'),
  ('Milk', 'de', 'Milch', 'Milchprodukt'),
  ('Milk', 'fr', 'Lait', 'Produit Laitier'),

  -- Yogurt
  ('Yogurt', 'en', 'Yogurt', 'Dairy'),
  ('Yogurt', 'pt', 'Iogurte', 'Laticínio'),
  ('Yogurt', 'es', 'Yogur', 'Lácteo'),
  ('Yogurt', 'nl', 'Yoghurt', 'Zuivel'),
  ('Yogurt', 'de', 'Joghurt', 'Milchprodukt'),
  ('Yogurt', 'fr', 'Yaourt', 'Produit Laitier')
ON CONFLICT (canonical_name, language_code) DO NOTHING;
