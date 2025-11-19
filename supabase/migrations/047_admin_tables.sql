-- =========================================================
-- ADMIN MODULE — ADMIN TABLES & SETTINGS
-- Global settings, activity logs, admin roles
-- =========================================================

-- 1. GLOBAL APP SETTINGS -----------------------------------

CREATE TABLE IF NOT EXISTS global_app_settings (
  id int PRIMARY KEY DEFAULT 1,
  maintenance_mode boolean DEFAULT false,
  notifications_enabled boolean DEFAULT true,
  featured_recipe_id uuid,
  featured_workout_id uuid,
  featured_meditation_id uuid,
  marketplace_banner text,
  ai_personalization_toggle boolean DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc', now()),
  updated_at timestamptz DEFAULT timezone('utc', now()),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default row
INSERT INTO global_app_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- 2. ADMIN USERS (extends profiles) ----------------------

-- Add admin role to profiles if not exists
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin'));

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role) WHERE role IN ('admin', 'superadmin');

-- 3. ADMIN ACTIVITY LOGS ----------------------------------

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT timezone('utc', now())
);

-- Indexes for activity logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_activity_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_activity_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_activity_logs(created_at DESC);

-- 4. CONTENT LIBRARY (for centralized content management) --

CREATE TABLE IF NOT EXISTS content_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('video', 'audio', 'image', 'pdf')),
  category text NOT NULL CHECK (category IN ('workout', 'recipe', 'meditation', 'game', 'marketplace')),
  url text NOT NULL,
  title text,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT timezone('utc', now()),
  updated_at timestamptz DEFAULT timezone('utc', now())
);

-- Indexes for content library
CREATE INDEX IF NOT EXISTS idx_content_library_type ON content_library(type);
CREATE INDEX IF NOT EXISTS idx_content_library_category ON content_library(category);
CREATE INDEX IF NOT EXISTS idx_content_library_created ON content_library(created_at DESC);

-- 5. RLS POLICIES -----------------------------------------

-- Global settings: public read, admin write
ALTER TABLE global_app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_settings" ON global_app_settings
  FOR SELECT USING (true);

CREATE POLICY "admin_write_settings" ON global_app_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Admin activity logs: admin only
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_logs" ON admin_activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "admin_write_logs" ON admin_activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
    AND admin_id = auth.uid()
  );

-- Content library: public read, admin write
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_content" ON content_library
  FOR SELECT USING (true);

CREATE POLICY "admin_write_content" ON content_library
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- 6. RPC FUNCTIONS ----------------------------------------

-- Function to update global settings
CREATE OR REPLACE FUNCTION update_global_settings(
  p_maintenance_mode boolean DEFAULT NULL,
  p_notifications_enabled boolean DEFAULT NULL,
  p_featured_recipe_id uuid DEFAULT NULL,
  p_featured_workout_id uuid DEFAULT NULL,
  p_featured_meditation_id uuid DEFAULT NULL,
  p_marketplace_banner text DEFAULT NULL,
  p_ai_personalization_toggle boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE global_app_settings
  SET
    maintenance_mode = COALESCE(p_maintenance_mode, maintenance_mode),
    notifications_enabled = COALESCE(p_notifications_enabled, notifications_enabled),
    featured_recipe_id = COALESCE(p_featured_recipe_id, featured_recipe_id),
    featured_workout_id = COALESCE(p_featured_workout_id, featured_workout_id),
    featured_meditation_id = COALESCE(p_featured_meditation_id, featured_meditation_id),
    marketplace_banner = COALESCE(p_marketplace_banner, marketplace_banner),
    ai_personalization_toggle = COALESCE(p_ai_personalization_toggle, ai_personalization_toggle),
    updated_at = timezone('utc', now())
  WHERE id = 1;
END;
$$;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_action text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO admin_activity_logs (admin_id, action, details)
  VALUES (auth.uid(), p_action, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN v_role IN ('admin', 'superadmin');
END;
$$;

-- =========================================================
-- ADMIN MODULE — COMPLETE
-- =========================================================


