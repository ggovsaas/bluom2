-- =========================================================
-- MODULE S — SUBSCRIPTIONS ENGINE
-- Stripe-native subscription management, free trial, premium entitlements
-- =========================================================

-- 1. TABLES -----------------------------------------------

-- S1 — subscription_products
-- Stripe products (monthly + annual plans)
CREATE TABLE IF NOT EXISTS subscription_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_product_id text UNIQUE NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- S2 — subscription_prices
-- Stripe price IDs per billing period
CREATE TABLE IF NOT EXISTS subscription_prices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_price_id text UNIQUE NOT NULL,
    product_id uuid NOT NULL REFERENCES subscription_products(id) ON DELETE CASCADE,
    interval text NOT NULL, -- 'month' or 'year'
    amount integer NOT NULL, -- in cents
    currency text DEFAULT 'usd',
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- S3 — user_subscriptions
-- One row per user, always synced with Stripe
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    stripe_customer_id text UNIQUE,
    stripe_subscription_id text UNIQUE,
    plan_id uuid REFERENCES subscription_prices(id),
    status text NOT NULL DEFAULT 'free', -- free, trialing, active, past_due, canceled, expired
    trial_end timestamptz,
    current_period_end timestamptz,
    is_premium boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- 2. INDEXES ----------------------------------------------

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user
ON user_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status
ON user_subscriptions (status);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer
ON user_subscriptions (stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription
ON user_subscriptions (stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_prices_product
ON subscription_prices (product_id);

-- 3. RLS (Row-Level Security) ----------------------------

ALTER TABLE subscription_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read products and prices (for pricing page)
CREATE POLICY "public_read_products"
ON subscription_products
FOR SELECT
USING (true);

CREATE POLICY "public_read_prices"
ON subscription_prices
FOR SELECT
USING (true);

-- Users can only access their own subscription
CREATE POLICY "users_manage_own_subscription"
ON user_subscriptions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. RPC FUNCTIONS ---------------------------------------

-- S-RPC1 — init_subscription_for_user(user_id)
-- Creates subscription row when user signs up (called by trigger)
CREATE OR REPLACE FUNCTION init_subscription_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_subscriptions (user_id, status, is_premium)
    VALUES (p_user_id, 'free', false)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- S-RPC2 — update_subscription_from_stripe(...)
-- Updates subscription from Stripe webhook
CREATE OR REPLACE FUNCTION update_subscription_from_stripe(
    p_user_id uuid,
    p_stripe_customer_id text DEFAULT NULL,
    p_stripe_subscription_id text DEFAULT NULL,
    p_status text,
    p_plan_id uuid DEFAULT NULL,
    p_period_end timestamptz DEFAULT NULL,
    p_trial_end timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE user_subscriptions
    SET
        stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
        stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
        status = p_status,
        plan_id = COALESCE(p_plan_id, plan_id),
        current_period_end = COALESCE(p_period_end, current_period_end),
        trial_end = COALESCE(p_trial_end, trial_end),
        is_premium = (p_status IN ('active', 'trialing', 'past_due')),
        updated_at = timezone('utc', now())
    WHERE user_id = p_user_id;
    
    -- If no row exists, create one
    IF NOT FOUND THEN
        INSERT INTO user_subscriptions (
            user_id, stripe_customer_id, stripe_subscription_id,
            status, plan_id, current_period_end, trial_end, is_premium
        )
        VALUES (
            p_user_id, p_stripe_customer_id, p_stripe_subscription_id,
            p_status, p_plan_id, p_period_end, p_trial_end,
            (p_status IN ('active', 'trialing', 'past_due'))
        );
    END IF;
END;
$$;

-- S-RPC3 — downgrade_expired_subscriptions()
-- Downgrades users automatically when trial/sub expires (called via CRON)
CREATE OR REPLACE FUNCTION downgrade_expired_subscriptions()
RETURNS TABLE (
    user_id uuid,
    old_status text,
    new_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected_user uuid;
    old_stat text;
BEGIN
    -- Downgrade expired trials
    FOR affected_user, old_stat IN
        SELECT user_id, status
        FROM user_subscriptions
        WHERE trial_end < timezone('utc', now())
          AND status = 'trialing'
    LOOP
        UPDATE user_subscriptions
        SET
            status = 'expired',
            is_premium = false,
            updated_at = timezone('utc', now())
        WHERE user_subscriptions.user_id = affected_user;
        
        user_id := affected_user;
        old_status := old_stat;
        new_status := 'expired';
        RETURN NEXT;
    END LOOP;
    
    -- Downgrade expired active subscriptions
    FOR affected_user, old_stat IN
        SELECT user_id, status
        FROM user_subscriptions
        WHERE current_period_end < timezone('utc', now())
          AND status = 'active'
    LOOP
        UPDATE user_subscriptions
        SET
            status = 'canceled',
            is_premium = false,
            updated_at = timezone('utc', now())
        WHERE user_subscriptions.user_id = affected_user;
        
        user_id := affected_user;
        old_status := old_stat;
        new_status := 'canceled';
        RETURN NEXT;
    END LOOP;
    
    -- Downgrade past_due subscriptions that are too old (grace period expired)
    FOR affected_user, old_stat IN
        SELECT user_id, status
        FROM user_subscriptions
        WHERE current_period_end < timezone('utc', now()) - INTERVAL '7 days'
          AND status = 'past_due'
    LOOP
        UPDATE user_subscriptions
        SET
            status = 'expired',
            is_premium = false,
            updated_at = timezone('utc', now())
        WHERE user_subscriptions.user_id = affected_user;
        
        user_id := affected_user;
        old_status := old_stat;
        new_status := 'expired';
        RETURN NEXT;
    END LOOP;
END;
$$;

-- S-RPC4 — get_user_entitlement(user_id)
-- Check entitlements (frontend helper)
CREATE OR REPLACE FUNCTION get_user_entitlement(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_build_object(
        'status', COALESCE(status, 'free'),
        'is_premium', COALESCE(is_premium, false),
        'trial_end', trial_end,
        'current_period_end', current_period_end,
        'plan_id', plan_id,
        'stripe_customer_id', stripe_customer_id,
        'stripe_subscription_id', stripe_subscription_id
    )
    FROM user_subscriptions
    WHERE user_id = p_user_id;
$$;

-- S-RPC5 — is_user_premium(user_id)
-- Quick premium check
CREATE OR REPLACE FUNCTION is_user_premium(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
AS $$
    SELECT COALESCE(is_premium, false)
    FROM user_subscriptions
    WHERE user_id = p_user_id;
$$;

-- S-RPC6 — start_trial(user_id, trial_days)
-- Starts a free trial for a user
CREATE OR REPLACE FUNCTION start_trial(
    p_user_id uuid,
    p_trial_days int DEFAULT 3
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE user_subscriptions
    SET
        status = 'trialing',
        trial_end = timezone('utc', now()) + (p_trial_days || ' days')::interval,
        is_premium = true,
        updated_at = timezone('utc', now())
    WHERE user_id = p_user_id;
    
    -- If no row exists, create one
    IF NOT FOUND THEN
        INSERT INTO user_subscriptions (
            user_id, status, trial_end, is_premium
        )
        VALUES (
            p_user_id, 'trialing',
            timezone('utc', now()) + (p_trial_days || ' days')::interval,
            true
        );
    END IF;
END;
$$;

-- S-RPC7 — cancel_subscription(user_id)
-- Cancels a subscription (keeps premium until period_end)
CREATE OR REPLACE FUNCTION cancel_subscription(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE user_subscriptions
    SET
        status = 'canceled',
        updated_at = timezone('utc', now())
    WHERE user_id = p_user_id
      AND status IN ('active', 'trialing', 'past_due');
    
    -- Set is_premium to false immediately on cancel
    UPDATE user_subscriptions
    SET
        is_premium = false
    WHERE user_id = p_user_id
      AND status = 'canceled';
END;
$$;

-- S-RPC8 — get_subscription_products()
-- Gets all subscription products with prices
CREATE OR REPLACE FUNCTION get_subscription_products()
RETURNS TABLE (
    product_id uuid,
    product_name text,
    product_description text,
    price_id uuid,
    stripe_price_id text,
    interval text,
    amount integer,
    currency text
)
LANGUAGE sql
AS $$
    SELECT 
        sp.id,
        sp.name,
        sp.description,
        spr.id,
        spr.stripe_price_id,
        spr.interval,
        spr.amount,
        spr.currency
    FROM subscription_products sp
    JOIN subscription_prices spr ON spr.product_id = sp.id
    ORDER BY spr.interval, spr.amount;
$$;

-- 5. TRIGGERS ---------------------------------------------

-- Auto-initialize subscription when user signs up
CREATE OR REPLACE FUNCTION on_user_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM init_subscription_for_user(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'auto_init_subscription'
    ) THEN
        CREATE TRIGGER auto_init_subscription
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION on_user_created();
    END IF;
END $$;

-- Auto-update updated_at on user_subscriptions
CREATE OR REPLACE FUNCTION update_user_subscriptions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_subscriptions_timestamp
BEFORE UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_user_subscriptions_timestamp();

-- 6. HELPER VIEWS -----------------------------------------

-- View for subscription status summary
CREATE OR REPLACE VIEW subscription_status_summary AS
SELECT
    status,
    COUNT(*) as user_count,
    COUNT(*) FILTER (WHERE is_premium = true) as premium_count
FROM user_subscriptions
GROUP BY status;

