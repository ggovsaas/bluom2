/*
  # Move & Workouts Schema

  ## Description
  Complete workout tracking system including exercise database, workout routines,
  workout logs, exercise performance tracking, and steps logging.

  ## Tables Created
  1. **exercise_categories** - Exercise classification
     - `id` (uuid, pk)
     - `name` (text) - Category name (e.g., Chest, Back, Legs)
     - `description` (text)
     - `created_at` (timestamptz)

  2. **exercise_db** - Exercise library (global + custom)
     - `id` (serial, pk)
     - `user_id` (uuid, fk) - Null for global exercises
     - `name` (text) - Exercise name
     - `category_id` (uuid, fk)
     - `muscle_group` (text) - Primary muscle targeted
     - `equipment` (text) - Required equipment
     - `video_url` (text) - Demonstration video
     - `instructions` (text) - How to perform
     - `muscles` (text array) - All muscles targeted
     - `is_custom` (boolean)
     - `created_at` (timestamptz)

  3. **workout_routines** - Saved workout templates
     - `id` (uuid, pk)
     - `user_id` (uuid, fk)
     - `title` (text)
     - `description` (text)
     - `created_at`, `updated_at` (timestamptz)

  4. **workout_exercises** - Exercises in routines
     - `id` (serial, pk)
     - `routine_id` (uuid, fk)
     - `exercise_id` (integer, fk)
     - `order_index` (integer) - Exercise order
     - `sets` (integer)
     - `reps` (integer)
     - `rest_seconds` (integer)
     - `created_at` (timestamptz)

  5. **workout_logs** - Workout session instances
     - `id` (serial, pk)
     - `user_id` (uuid, fk)
     - `routine_id` (uuid, fk) - Optional template reference
     - `created_at` (timestamptz) - Workout start time
     - `completed_at` (timestamptz) - Workout end time

  6. **workout_log_sets** - Individual set performance
     - `id` (uuid, pk)
     - `workout_log_id` (integer, fk)
     - `exercise_id` (integer, fk)
     - `set_number` (integer)
     - `weight` (numeric) - Weight lifted (kg)
     - `reps` (integer) - Reps completed
     - `rpe` (integer) - Rate of perceived exertion (1-10)
     - `rest_seconds` (integer)
     - `notes` (text)
     - `created_at` (timestamptz)

  7. **steps_logs** - Daily step tracking
     - `id` (uuid, pk)
     - `user_id` (uuid, fk)
     - `date` (date)
     - `steps` (integer)
     - `created_at`, `updated_at` (timestamptz)

  8. **weekly_training_goals** - AI workout planning
     - `id` (uuid, pk)
     - `user_id` (uuid, fk)
     - `week_start` (date)
     - `goals` (jsonb)
     - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Global exercises (user_id IS NULL) visible to all

  ## Notes
  - Exercise library supports both global and custom exercises
  - Workout routines are templates, logs are instances
  - Sets track weight, reps, and RPE for progressive overload
  - Steps tracking uses unique constraint per user per day
*/

DROP TABLE IF EXISTS weekly_training_goals CASCADE;
DROP TABLE IF EXISTS steps_logs CASCADE;
DROP TABLE IF EXISTS workout_log_sets CASCADE;
DROP TABLE IF EXISTS workout_logs CASCADE;
DROP TABLE IF EXISTS workout_exercises CASCADE;
DROP TABLE IF EXISTS workout_routines CASCADE;
DROP TABLE IF EXISTS exercise_db CASCADE;
DROP TABLE IF EXISTS exercise_categories CASCADE;
DROP TABLE IF EXISTS exercise_library CASCADE;

-- =============================================
-- EXERCISE CATEGORIES
-- =============================================

CREATE TABLE exercise_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- No RLS - public read access
ALTER TABLE exercise_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read exercise categories"
  ON exercise_categories FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- EXERCISE DATABASE
-- =============================================

CREATE TABLE exercise_db (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category_id uuid REFERENCES exercise_categories(id) ON DELETE SET NULL,
  muscle_group text,
  equipment text,
  video_url text,
  instructions text,
  muscles text[] DEFAULT '{}',
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Alias table name for compatibility
CREATE TABLE IF NOT EXISTS exercise_library (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category_id uuid REFERENCES exercise_categories(id) ON DELETE SET NULL,
  muscle_group text,
  equipment text,
  video_url text,
  instructions text,
  muscles text[] DEFAULT '{}',
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exercise_db ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read global and own exercises"
  ON exercise_db FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own exercises"
  ON exercise_db FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercises"
  ON exercise_db FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercises"
  ON exercise_db FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Same policies for exercise_library
CREATE POLICY "Users can read global and own exercises (library)"
  ON exercise_library FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own exercises (library)"
  ON exercise_library FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- WORKOUT ROUTINES
-- =============================================

CREATE TABLE workout_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Alias table name
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own workout routines"
  ON workout_routines FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout routines"
  ON workout_routines FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout routines"
  ON workout_routines FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout routines"
  ON workout_routines FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Same policies for workouts
CREATE POLICY "Users can read own workouts"
  ON workouts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts"
  ON workouts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- WORKOUT EXERCISES (routine templates)
-- =============================================

CREATE TABLE workout_exercises (
  id serial PRIMARY KEY,
  routine_id uuid NOT NULL REFERENCES workout_routines(id) ON DELETE CASCADE,
  exercise_id integer NOT NULL REFERENCES exercise_db(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  sets integer DEFAULT 3,
  reps integer,
  rest_seconds integer DEFAULT 90,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read exercises in their routines"
  ON workout_exercises FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM workout_routines WHERE workout_routines.id = workout_exercises.routine_id AND workout_routines.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert exercises in their routines"
  ON workout_exercises FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM workout_routines WHERE workout_routines.id = workout_exercises.routine_id AND workout_routines.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete exercises from their routines"
  ON workout_exercises FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM workout_routines WHERE workout_routines.id = workout_exercises.routine_id AND workout_routines.user_id = auth.uid()
  ));

-- =============================================
-- WORKOUT LOGS (workout instances)
-- =============================================

CREATE TABLE workout_logs (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id uuid REFERENCES workout_routines(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own workout logs"
  ON workout_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout logs"
  ON workout_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout logs"
  ON workout_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout logs"
  ON workout_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- WORKOUT LOG SETS (performance tracking)
-- =============================================

CREATE TABLE workout_log_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id integer NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  exercise_id integer NOT NULL REFERENCES exercise_db(id) ON DELETE CASCADE,
  set_number integer NOT NULL,
  weight numeric,
  reps integer,
  rpe integer CHECK (rpe BETWEEN 1 AND 10),
  rest_seconds integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_log_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read sets from their workout logs"
  ON workout_log_sets FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM workout_logs WHERE workout_logs.id = workout_log_sets.workout_log_id AND workout_logs.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert sets in their workout logs"
  ON workout_log_sets FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM workout_logs WHERE workout_logs.id = workout_log_sets.workout_log_id AND workout_logs.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete sets from their workout logs"
  ON workout_log_sets FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM workout_logs WHERE workout_logs.id = workout_log_sets.workout_log_id AND workout_logs.user_id = auth.uid()
  ));

-- =============================================
-- STEPS LOGS
-- =============================================

CREATE TABLE steps_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  steps integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE steps_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own steps logs"
  ON steps_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own steps logs"
  ON steps_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own steps logs"
  ON steps_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own steps logs"
  ON steps_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- WEEKLY TRAINING GOALS
-- =============================================

CREATE TABLE weekly_training_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  goals jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_training_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own training goals"
  ON weekly_training_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training goals"
  ON weekly_training_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training goals"
  ON weekly_training_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_exercise_db_user_id ON exercise_db(user_id);
CREATE INDEX idx_exercise_db_name ON exercise_db(name);
CREATE INDEX idx_exercise_db_category ON exercise_db(category_id);
CREATE INDEX idx_workout_routines_user_id ON workout_routines(user_id);
CREATE INDEX idx_workout_exercises_routine_id ON workout_exercises(routine_id);
CREATE INDEX idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX idx_workout_logs_created_at ON workout_logs(created_at DESC);
CREATE INDEX idx_workout_log_sets_workout_log_id ON workout_log_sets(workout_log_id);
CREATE INDEX idx_workout_log_sets_exercise_id ON workout_log_sets(exercise_id);
CREATE INDEX idx_steps_logs_user_date ON steps_logs(user_id, date DESC);
CREATE INDEX idx_weekly_training_goals_user_id ON weekly_training_goals(user_id);
