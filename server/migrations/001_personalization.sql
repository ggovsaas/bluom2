-- migrations/001_personalization.sql
-- Run this in your Neon Postgres database

-- Add columns to users table (if not present)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS sex TEXT,
  ADD COLUMN IF NOT EXISTS activity_level TEXT,
  ADD COLUMN IF NOT EXISTS goal TEXT,
  ADD COLUMN IF NOT EXISTS diet_pref TEXT,
  ADD COLUMN IF NOT EXISTS fitness_experience TEXT,
  ADD COLUMN IF NOT EXISTS workout_days INTEGER,
  ADD COLUMN IF NOT EXISTS avg_sleep_hours NUMERIC,
  ADD COLUMN IF NOT EXISTS self_reported_stress INTEGER,
  ADD COLUMN IF NOT EXISTS available_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS weight NUMERIC,
  ADD COLUMN IF NOT EXISTS height NUMERIC,
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS meals_per_day INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS equipment JSONB DEFAULT '[]'::jsonb;

-- Personalized plans table
CREATE TABLE IF NOT EXISTS personalized_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  plan JSONB NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW()
);

-- Product recommendations history
CREATE TABLE IF NOT EXISTS product_recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  payload JSONB,
  recommended_at TIMESTAMP DEFAULT NOW()
);

-- Meditation sessions table (if not already exists)
CREATE TABLE IF NOT EXISTS meditation_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category TEXT,
  duration INTEGER,
  completed_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_personalized_plans_user_id ON personalized_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_plans_generated_at ON personalized_plans(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_user_id ON product_recommendations(user_id);


