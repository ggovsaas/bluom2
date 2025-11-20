/*
  # Onboarding and Personalization Schema

  ## Description
  Handles user onboarding questionnaires and AI-powered personalization plans
  including goals, meal plans, and workout plans.

  ## Tables Created
  1. **onboarding_answers** - Stores user onboarding questionnaire responses
     - `id` (uuid, pk)
     - `user_id` (uuid, fk) - References auth.users
     - `answers` (jsonb) - Structured questionnaire responses
     - `created_at` (timestamptz)

  2. **personalized_goals** - AI-generated nutrition and fitness goals
     - `id` (uuid, pk)
     - `user_id` (uuid, fk, unique) - One active goal set per user
     - `primary_goal` (text) - lose_fat, gain_muscle, recomposition, maintain
     - `calorie_target` (integer)
     - `protein_target` (integer)
     - `carbs_target` (integer)
     - `fats_target` (integer)
     - `workout_focus` (text) - hypertrophy, weight_loss, endurance, strength
     - `wellness_focus` (text) - stress, sleep, mindset, balance
     - `created_at`, `updated_at` (timestamptz)

  3. **personalized_meal_plan** - AI-generated meal structure
     - `id` (uuid, pk)
     - `user_id` (uuid, fk)
     - `day_index` (integer) - 1-7 for each day of week
     - `meal_label` (text) - breakfast, lunch, dinner, snack
     - `items` (jsonb) - Array of meal items with macros
     - `created_at` (timestamptz)

  4. **personalized_workout_plan** - AI-generated workout routines
     - `id` (uuid, pk)
     - `user_id` (uuid, fk)
     - `day_index` (integer) - 1-7 for each day of week
     - `workout_type` (text) - push, pull, legs, cardio, upper, lower, full_body
     - `exercises` (jsonb) - Array of exercises with sets/reps
     - `created_at` (timestamptz)

  5. **weekly_revisions** - Weekly AI plan adjustments
     - `id` (uuid, pk)
     - `user_id` (uuid, fk)
     - `week_start`, `week_end` (date) - Week period
     - `summary` (text) - AI-generated summary
     - `changes` (jsonb) - Structured plan changes
     - `adherence_score` (numeric) - 0-100 score
     - `weight_change` (numeric) - Kg change
     - `calories_avg`, `protein_avg` (numeric) - Average consumption
     - `workouts_completed` (integer)
     - `sleep_avg`, `mood_avg` (numeric)
     - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Unique constraints prevent duplicate goals per user

  ## Notes
  - Supports 7-day meal and workout plans
  - Weekly revisions track user progress
  - All AI-generated content stored as JSONB
*/

DROP TABLE IF EXISTS weekly_revisions CASCADE;
DROP TABLE IF EXISTS personalized_workout_plan CASCADE;
DROP TABLE IF EXISTS personalized_meal_plan CASCADE;
DROP TABLE IF EXISTS personalized_goals CASCADE;
DROP TABLE IF EXISTS onboarding_answers CASCADE;

-- =============================================
-- ONBOARDING ANSWERS
-- =============================================

CREATE TABLE onboarding_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own onboarding answers"
  ON onboarding_answers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding answers"
  ON onboarding_answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- PERSONALIZED GOALS
-- =============================================

CREATE TABLE personalized_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_goal text NOT NULL CHECK (primary_goal IN ('lose_fat', 'gain_muscle', 'recomposition', 'maintain')),
  calorie_target integer NOT NULL DEFAULT 2000,
  protein_target integer NOT NULL DEFAULT 150,
  carbs_target integer NOT NULL DEFAULT 200,
  fats_target integer NOT NULL DEFAULT 65,
  workout_focus text CHECK (workout_focus IN ('hypertrophy', 'weight_loss', 'endurance', 'strength')),
  wellness_focus text CHECK (wellness_focus IN ('stress', 'sleep', 'mindset', 'balance')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE personalized_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own goals"
  ON personalized_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON personalized_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON personalized_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- PERSONALIZED MEAL PLAN
-- =============================================

CREATE TABLE personalized_meal_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_index integer NOT NULL CHECK (day_index BETWEEN 1 AND 7),
  meal_label text NOT NULL CHECK (meal_label IN ('breakfast', 'lunch', 'dinner', 'snack')),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, day_index, meal_label)
);

ALTER TABLE personalized_meal_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own meal plan"
  ON personalized_meal_plan FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plan"
  ON personalized_meal_plan FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plan"
  ON personalized_meal_plan FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plan"
  ON personalized_meal_plan FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- PERSONALIZED WORKOUT PLAN
-- =============================================

CREATE TABLE personalized_workout_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_index integer NOT NULL CHECK (day_index BETWEEN 1 AND 7),
  workout_type text CHECK (workout_type IN ('push', 'pull', 'legs', 'cardio', 'upper', 'lower', 'full_body')),
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, day_index)
);

ALTER TABLE personalized_workout_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own workout plan"
  ON personalized_workout_plan FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout plan"
  ON personalized_workout_plan FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plan"
  ON personalized_workout_plan FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout plan"
  ON personalized_workout_plan FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- WEEKLY REVISIONS
-- =============================================

CREATE TABLE weekly_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  summary text,
  changes jsonb DEFAULT '{}'::jsonb,
  adherence_score numeric CHECK (adherence_score BETWEEN 0 AND 100),
  weight_change numeric DEFAULT 0,
  calories_avg numeric,
  protein_avg numeric,
  workouts_completed integer DEFAULT 0,
  sleep_avg numeric,
  mood_avg numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own revisions"
  ON weekly_revisions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own revisions"
  ON weekly_revisions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_onboarding_answers_user_id ON onboarding_answers(user_id);
CREATE INDEX idx_personalized_goals_user_id ON personalized_goals(user_id);
CREATE INDEX idx_personalized_meal_plan_user_id ON personalized_meal_plan(user_id);
CREATE INDEX idx_personalized_meal_plan_day ON personalized_meal_plan(user_id, day_index);
CREATE INDEX idx_personalized_workout_plan_user_id ON personalized_workout_plan(user_id);
CREATE INDEX idx_personalized_workout_plan_day ON personalized_workout_plan(user_id, day_index);
CREATE INDEX idx_weekly_revisions_user_id ON weekly_revisions(user_id);
CREATE INDEX idx_weekly_revisions_week ON weekly_revisions(user_id, week_start DESC);
