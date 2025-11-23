/*
  # Create Foods and Exercise Library Tables

  1. New Tables
    - `foods`
      - `id` (serial, primary key)
      - `user_id` (uuid, foreign key to auth.users, nullable for global foods)
      - `name` (text)
      - `brand` (text, nullable)
      - `serving_size` (text, default '100g')
      - `calories` (numeric, default 0)
      - `protein` (numeric, default 0)
      - `carbs` (numeric, default 0)
      - `fat` (numeric, default 0)
      - `barcode` (text, nullable)
      - `source` (text, constrained to specific values)
      - `created_at` (timestamptz, default now())
    
    - `exercise_library`
      - `id` (serial, primary key)
      - `user_id` (uuid, foreign key to auth.users, nullable for global exercises)
      - `name` (text)
      - `description` (text, nullable)
      - `muscle_group` (text, nullable)
      - `equipment` (text, nullable)
      - `instructions` (text, nullable)
      - `muscles` (text array, default empty)
      - `is_custom` (boolean, default false)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on both tables
    - Users can read global (user_id IS NULL) and their own foods/exercises
    - Users can insert their own foods/exercises

  3. Seed Data
    - 20 common foods (chicken, rice, fruits, vegetables, etc.)
    - 15 common exercises (push-ups, squats, bench press, etc.)
*/

-- 1. CREATE FOODS TABLE
CREATE TABLE IF NOT EXISTS foods (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  serving_size text DEFAULT '100g',
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

-- 2. CREATE EXERCISE_LIBRARY TABLE
CREATE TABLE IF NOT EXISTS exercise_library (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  muscle_group text,
  equipment text,
  instructions text,
  muscles text[] DEFAULT '{}',
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read global and own exercises"
  ON exercise_library FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own exercises"
  ON exercise_library FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. SEED FOODS DATA
INSERT INTO foods (user_id, name, brand, serving_size, calories, protein, carbs, fat, source) VALUES
  (NULL, 'Chicken Breast', 'Generic', '100g', 165, 31, 0, 3.6, 'usda'),
  (NULL, 'Brown Rice', 'Generic', '100g', 112, 2.6, 23.5, 0.9, 'usda'),
  (NULL, 'Banana', 'Generic', '1 medium', 105, 1.3, 27, 0.4, 'usda'),
  (NULL, 'Broccoli', 'Generic', '100g', 34, 2.8, 7, 0.4, 'usda'),
  (NULL, 'Salmon', 'Generic', '100g', 208, 20, 0, 13, 'usda'),
  (NULL, 'Eggs', 'Generic', '2 large', 155, 13, 1.1, 11, 'usda'),
  (NULL, 'Sweet Potato', 'Generic', '100g', 86, 1.6, 20, 0.1, 'usda'),
  (NULL, 'Almonds', 'Generic', '28g', 164, 6, 6, 14, 'usda'),
  (NULL, 'Oatmeal', 'Generic', '100g', 68, 2.4, 12, 1.4, 'usda'),
  (NULL, 'Greek Yogurt', 'Generic', '170g', 100, 17, 6, 0.7, 'usda'),
  (NULL, 'Avocado', 'Generic', '100g', 160, 2, 8.5, 14.7, 'usda'),
  (NULL, 'Quinoa', 'Generic', '100g', 120, 4.4, 21.3, 1.9, 'usda'),
  (NULL, 'Spinach', 'Generic', '100g', 23, 2.9, 3.6, 0.4, 'usda'),
  (NULL, 'Blueberries', 'Generic', '100g', 57, 0.7, 14.5, 0.3, 'usda'),
  (NULL, 'Tuna', 'Generic', '100g', 132, 28, 0, 1.3, 'usda'),
  (NULL, 'Apple', 'Generic', '1 medium', 95, 0.5, 25, 0.3, 'usda'),
  (NULL, 'Pasta', 'Generic', '100g', 131, 5, 25, 1.1, 'usda'),
  (NULL, 'Ground Beef', 'Generic', '100g', 250, 26, 0, 17, 'usda'),
  (NULL, 'Turkey Breast', 'Generic', '100g', 135, 30, 0, 1, 'usda'),
  (NULL, 'White Rice', 'Generic', '100g', 130, 2.7, 28, 0.3, 'usda')
ON CONFLICT DO NOTHING;

-- 4. SEED EXERCISES DATA
INSERT INTO exercise_library (user_id, name, description, muscle_group, equipment, instructions, muscles, is_custom) VALUES
  (NULL, 'Push-ups', 'Classic bodyweight chest exercise', 'chest', 'bodyweight', 'Start in plank. Lower body until chest nearly touches ground. Push back up.', ARRAY['chest', 'triceps', 'shoulders'], false),
  (NULL, 'Squats', 'Fundamental lower body movement', 'legs', 'bodyweight', 'Stand with feet shoulder-width apart. Lower hips back and down. Push through heels.', ARRAY['quads', 'glutes', 'hamstrings'], false),
  (NULL, 'Plank', 'Core stability exercise', 'core', 'bodyweight', 'Hold body straight from head to heels, supported on forearms and toes.', ARRAY['abs', 'core'], false),
  (NULL, 'Pull-ups', 'Upper body pulling exercise', 'back', 'pull-up bar', 'Hang from bar. Pull body up until chin clears bar. Lower with control.', ARRAY['back', 'biceps'], false),
  (NULL, 'Lunges', 'Single-leg lower body exercise', 'legs', 'bodyweight', 'Step forward. Lower hips until both knees bent at 90 degrees. Push back up.', ARRAY['quads', 'glutes'], false),
  (NULL, 'Burpees', 'Full body conditioning exercise', 'full body', 'bodyweight', 'Squat down, hands on floor. Jump feet back. Do push-up. Jump feet forward. Jump up.', ARRAY['legs', 'chest', 'core'], false),
  (NULL, 'Dumbbell Press', 'Chest pressing movement', 'chest', 'dumbbells', 'Lie on bench holding dumbbells. Press weights up until arms extended. Lower with control.', ARRAY['chest', 'triceps', 'shoulders'], false),
  (NULL, 'Deadlift', 'Hip hinge movement pattern', 'back', 'barbell', 'Stand with feet hip-width. Bend at hips to grip bar. Lift by extending hips and knees.', ARRAY['back', 'hamstrings', 'glutes'], false),
  (NULL, 'Bench Press', 'Classic chest exercise', 'chest', 'barbell', 'Lie on bench. Lower bar to chest. Press bar up until arms fully extended.', ARRAY['chest', 'triceps'], false),
  (NULL, 'Dumbbell Rows', 'Back pulling movement', 'back', 'dumbbells', 'Bend forward at waist with one hand supported. Pull dumbbell to hip. Lower with control.', ARRAY['back', 'biceps'], false),
  (NULL, 'Shoulder Press', 'Overhead pressing movement', 'shoulders', 'dumbbells', 'Hold dumbbells at shoulder height. Press overhead until arms extended.', ARRAY['shoulders', 'triceps'], false),
  (NULL, 'Bicep Curls', 'Arm isolation exercise', 'arms', 'dumbbells', 'Stand holding dumbbells at sides. Curl weights up to shoulders. Lower with control.', ARRAY['biceps'], false),
  (NULL, 'Tricep Dips', 'Bodyweight arm exercise', 'arms', 'bodyweight', 'Support body on bars or bench. Lower body by bending elbows. Push back up.', ARRAY['triceps'], false),
  (NULL, 'Mountain Climbers', 'Cardio and core exercise', 'core', 'bodyweight', 'Start in plank. Alternate driving knees toward chest rapidly.', ARRAY['core', 'legs'], false),
  (NULL, 'Jump Rope', 'Cardio conditioning', 'full body', 'jump rope', 'Hold rope handles. Swing rope over head and jump as it passes under feet.', ARRAY['legs', 'cardio'], false)
ON CONFLICT DO NOTHING;