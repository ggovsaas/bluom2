-- =========================================================
-- MODULE A — CORE SYSTEM
-- Core tables, user profile, subscriptions, settings, logs
-- =========================================================

-- 1. ENUMS -------------------------------------------------

CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium_monthly', 'premium_yearly');
CREATE TYPE device_type AS ENUM ('ios', 'android', 'web');

-- 2. USER PROFILE TABLE ------------------------------------

CREATE TABLE profiles (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    gender gender_type,
    birthdate DATE,
    height_cm NUMERIC(5,2),
    weight_kg NUMERIC(5,2),
    goal TEXT,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION moddatetime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION moddatetime();

-- 3. USER SETTINGS ------------------------------------------

CREATE TABLE user_settings (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT true,
    restrict_after_9pm BOOLEAN DEFAULT true,
    measurement_unit TEXT DEFAULT 'metric',
    dark_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 4. SUBSCRIPTIONS ------------------------------------------

CREATE TABLE subscriptions (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tier subscription_tier DEFAULT 'free',
    started_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    expires_at TIMESTAMPTZ,
    renewal_active BOOLEAN DEFAULT false
);

-- Grant premium automatically for trials
CREATE OR REPLACE FUNCTION set_trial_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO subscriptions (user_id, tier, expires_at, renewal_active)
    VALUES (NEW.id, 'premium_monthly', now() + INTERVAL '3 days', false)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER give_trial_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION set_trial_subscription();

-- 5. DEVICES (for notifications & analytics) ------------------

CREATE TABLE devices (
    id BIGSERIAL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    device_type device_type,
    push_token TEXT,
    app_version TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 6. AUDIT LOGS ----------------------------------------------

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 7. ONBOARDING RESPONSES -------------------------------------

CREATE TABLE onboarding_responses (
    id BIGSERIAL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id INTEGER,
    answer TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 8. PERSONALIZED PLANS (Nutrition + Fitness + Wellness) -----

CREATE TABLE personalized_plans (
    id BIGSERIAL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT CHECK (plan_type IN ('nutrition','fitness','wellness')),
    plan_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 9. RLS POLICIES -------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Each user sees only their own data
CREATE POLICY "users_manage_own_profile"
    ON profiles
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_settings"
    ON user_settings
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_subscriptions"
    ON subscriptions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_onboarding"
    ON onboarding_responses
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_devices"
    ON devices
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_plans"
    ON personalized_plans
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

