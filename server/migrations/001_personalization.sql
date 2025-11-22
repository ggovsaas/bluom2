/*
  # Personalization & User Preferences

  ## Description
  Creates initial tables for user personalization and preferences.
  This migration is designed to work with Supabase auth system.

  ## New Tables
  1. **user_preferences** - User preferences and settings
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `timezone` (text)
     - `language` (text)
     - `notification_preferences` (jsonb)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  2. **personalized_plans** - AI-generated personalized fitness/nutrition plans
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `plan` (jsonb) - The complete plan data
     - `generated_at` (timestamptz)

  3. **product_recommendations** - Product recommendation history
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `payload` (jsonb) - Recommendation data
     - `recommended_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
*/

-- =============================================
-- USER PREFERENCES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  notification_preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- PERSONALIZED PLANS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS personalized_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan jsonb NOT NULL,
  generated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_personalized_plans_user_id ON personalized_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_plans_generated_at ON personalized_plans(generated_at DESC);

-- Enable RLS
ALTER TABLE personalized_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own plans"
  ON personalized_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans"
  ON personalized_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
  ON personalized_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans"
  ON personalized_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- PRODUCT RECOMMENDATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS product_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payload jsonb DEFAULT '{}'::jsonb,
  recommended_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_product_recommendations_user_id ON product_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_recommended_at ON product_recommendations(recommended_at DESC);

-- Enable RLS
ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own recommendations"
  ON product_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON product_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_preferences
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
