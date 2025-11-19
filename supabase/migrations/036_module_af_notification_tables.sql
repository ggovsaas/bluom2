-- =========================================================
-- MODULE AF — NOTIFICATION TABLES (Additional)
-- Additional tables for queued notifications, sent notifications, and rules
-- =========================================================

-- AF-ADDITIONAL-1: queued_notifications
-- Notification queue (pending)
CREATE TABLE IF NOT EXISTS queued_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category text NOT NULL,
    type text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb,
    scheduled_at timestamptz,
    status text DEFAULT 'pending', -- pending, sent, failed, cancelled
    priority int DEFAULT 1,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- AF-ADDITIONAL-2: sent_notifications
-- Notifications already sent (for analytics and tracking)
CREATE TABLE IF NOT EXISTS sent_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category text NOT NULL,
    type text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb,
    sent_at timestamptz DEFAULT timezone('utc', now()),
    opened boolean DEFAULT false,
    opened_at timestamptz,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- AF-ADDITIONAL-3: notification_rules
-- Rule table for logging & analytics
CREATE TABLE IF NOT EXISTS notification_rules (
    id serial PRIMARY KEY,
    category text NOT NULL,
    type text NOT NULL,
    weekday_window_start time,
    weekday_window_end time,
    weekend_window_start time,
    weekend_window_end time,
    enabled boolean DEFAULT true,
    priority int DEFAULT 1,
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(category, type)
);

-- AF-ADDITIONAL-4: notification_tone_preferences
-- User preference for notification tone (motivational, friendly, minimal)
CREATE TABLE IF NOT EXISTS notification_tone_preferences (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tone text DEFAULT 'friendly', -- 'motivational', 'friendly', 'minimal'
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- 2. INDEXES ------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_queued_notifications_user ON queued_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_queued_notifications_status ON queued_notifications(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_queued_notifications_scheduled ON queued_notifications(scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_sent_notifications_user_date ON sent_notifications(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sent_notifications_category ON sent_notifications(category);
CREATE INDEX IF NOT EXISTS idx_notification_rules_enabled ON notification_rules(enabled) WHERE enabled = true;

-- 3. RLS POLICIES -------------------------------------------

ALTER TABLE queued_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_tone_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_queued" ON queued_notifications
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_sent" ON sent_notifications
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "public_read_rules" ON notification_rules
    FOR SELECT USING (enabled = true);

CREATE POLICY "users_manage_own_tone" ON notification_tone_preferences
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. RPC FUNCTIONS -----------------------------------------

-- AF-ADDITIONAL-RPC1: queue_notification(user_id, category, type, payload, scheduled_at, priority)
CREATE OR REPLACE FUNCTION queue_notification(
    p_user_id uuid,
    p_category text,
    p_type text,
    p_payload jsonb DEFAULT '{}'::jsonb,
    p_scheduled_at timestamptz DEFAULT NULL,
    p_priority int DEFAULT 1
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    notification_id uuid;
BEGIN
    INSERT INTO queued_notifications (
        user_id, category, type, payload, scheduled_at, priority
    )
    VALUES (
        p_user_id, p_category, p_type, p_payload, 
        COALESCE(p_scheduled_at, now()), p_priority
    )
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- AF-ADDITIONAL-RPC2: mark_notification_sent(queued_id, sent_payload)
CREATE OR REPLACE FUNCTION mark_notification_sent(
    p_queued_id uuid,
    p_sent_payload jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    queued_record RECORD;
    sent_id uuid;
BEGIN
    -- Get queued notification
    SELECT * INTO queued_record
    FROM queued_notifications
    WHERE id = p_queued_id;
    
    IF queued_record IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Insert into sent_notifications
    INSERT INTO sent_notifications (
        user_id, category, type, payload
    )
    VALUES (
        queued_record.user_id,
        queued_record.category,
        queued_record.type,
        p_sent_payload
    )
    RETURNING id INTO sent_id;
    
    -- Update queued status
    UPDATE queued_notifications
    SET status = 'sent'
    WHERE id = p_queued_id;
    
    RETURN sent_id;
END;
$$;

-- AF-ADDITIONAL-RPC3: get_user_tone_preference(user_id)
CREATE OR REPLACE FUNCTION get_user_tone_preference(p_user_id uuid)
RETURNS text
LANGUAGE sql
AS $$
    SELECT COALESCE(tone, 'friendly')
    FROM notification_tone_preferences
    WHERE user_id = p_user_id;
$$;

-- AF-ADDITIONAL-RPC4: update_user_tone_preference(user_id, tone)
CREATE OR REPLACE FUNCTION update_user_tone_preference(
    p_user_id uuid,
    p_tone text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO notification_tone_preferences (user_id, tone)
    VALUES (p_user_id, p_tone)
    ON CONFLICT (user_id) DO UPDATE
    SET tone = EXCLUDED.tone, updated_at = timezone('utc', now());
END;
$$;

-- =========================================================
-- MODULE AF — ADDITIONAL TABLES — COMPLETE
-- =========================================================

