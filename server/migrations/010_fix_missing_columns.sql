/*
  # Fix Missing Columns

  ## Description
  Adds missing columns that the frontend expects but don't exist in the database.

  ## Changes
  1. **foods table** - Add `description` column
  2. **exercise_library table** - Add `description` column
  3. **recipes table** - Add `category` column
*/

-- =============================================
-- ADD MISSING COLUMNS TO FOODS
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'foods' AND column_name = 'description'
  ) THEN
    ALTER TABLE foods ADD COLUMN description text;
  END IF;
END $$;

-- =============================================
-- ADD MISSING COLUMNS TO EXERCISE_LIBRARY
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercise_library' AND column_name = 'description'
  ) THEN
    ALTER TABLE exercise_library ADD COLUMN description text;
  END IF;
END $$;

-- Also add to exercise_db for consistency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercise_db' AND column_name = 'description'
  ) THEN
    ALTER TABLE exercise_db ADD COLUMN description text;
  END IF;
END $$;

-- =============================================
-- ADD MISSING COLUMNS TO RECIPES
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'category'
  ) THEN
    ALTER TABLE recipes ADD COLUMN category text;
  END IF;
END $$;

-- =============================================
-- VERIFY COLUMNS EXIST
-- =============================================

-- Query to verify new columns
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name IN ('foods', 'exercise_library', 'exercise_db', 'recipes')
-- AND column_name IN ('description', 'category')
-- ORDER BY table_name, column_name;
