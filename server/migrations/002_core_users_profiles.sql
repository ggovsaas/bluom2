/*
  # Core Users and Profiles Schema

  ## Description
  Creates core user profile tables with authentication support, subscriptions, and device management.

  ## Tables Created
  1. **users** - Main user profile table
     - `id` (uuid, pk) - User ID from Supabase Auth
     - `email` (text) - User email
     - `full_name` (text) - User's full name
     - `avatar_url` (text) - Profile picture URL
     - `birthday` (date) - Date of birth
     - `gender` (text) - Gender identity
     - `height_cm` (numeric) - Height in centimeters
     - `weight_kg` (numeric) - Weight in kilograms
     - `activity_level` (text) - Activity level (sedentary, light, moderate, active, very_active)
     - `goal` (text) - Primary fitness goal
     - `onboarding_completed` (boolean) - Onboarding status
     - `timezone` (text) - User timezone
     - `created_at`, `updated_at` (timestamptz) - Timestamps

  2. **profiles** - Extended profile for Stripe integration
     - `id` (uuid, pk) - References auth.users
     - `stripe_customer_id` (text) - Stripe customer identifier
     - `subscription_status` (text) - Current subscription status
     - `subscription_tier` (text) - Subscription tier (free, premium, pro)

  3. **subscriptions** - Subscription management
     - `id` (uuid, pk)
     - `user_id` (uuid, fk) - References auth.users
     - `stripe_subscription_id` (text) - Stripe subscription ID
     - `stripe_customer_id` (text) - Stripe customer ID
     - `status` (text) - Subscription status
     - `current_period_start`, `current_period_end` (timestamptz) - Billing period
     - `cancel_at_period_end` (boolean) - Cancellation flag

  4. **user_devices** - Push notification device tokens
     - `id` (uuid, pk)
     - `user_id` (uuid, fk) - References auth.users
     - `device_type` (text) - Device platform (ios, android, web)
     - `push_token` (text, unique) - Expo push token
     - `created_at`, `updated_at` (timestamptz) - Timestamps

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Admin bypass for Stripe webhooks via service role

  ## Notes
  - Uses UUID primary keys for auth integration
  - Timestamps default to `now()`
  - Includes indexes for performance
*/

-- Drop tables if they exist (for development)
DROP TABLE IF EXISTS user_devices CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- USERS TABLE
-- =============================================

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  birthday date,
  gender text,
  height_cm numeric,
  weight_kg numeric,
  activity_level text CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal text,
  onboarding_completed boolean DEFAULT false,
  timezone text DEFAULT 'UTC',
  premium boolean DEFAULT false,
  trial_started_at timestamptz,
  trial_days integer DEFAULT 3,
  sex text,
  diet_pref text,
  fitness_experience text,
  workout_days integer,
  avg_sleep_hours numeric,
  self_reported_stress integer,
  available_minutes integer,
  meals_per_day integer DEFAULT 3,
  equipment jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =============================================
-- PROFILES TABLE (Stripe integration)
-- =============================================

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE,
  subscription_status text DEFAULT 'inactive',
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =============================================
-- SUBSCRIPTIONS TABLE
-- =============================================

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  status text NOT NULL DEFAULT 'inactive',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- USER DEVICES TABLE (Push Notifications)
-- =============================================

CREATE TABLE user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_type text NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  push_token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies for user_devices
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own devices"
  ON user_devices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
  ON user_devices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
  ON user_devices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
  ON user_devices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_user_devices_push_token ON user_devices(push_token);
