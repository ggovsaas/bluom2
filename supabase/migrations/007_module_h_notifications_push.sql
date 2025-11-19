-- =========================================================
-- MODULE H — NOTIFICATIONS & PUSH SYSTEM
-- iOS + Android (Expo) + Web push notifications, smart reminders, AI triggers
-- =========================================================

-- 1. TABLES -----------------------------------------------

-- H1 — user_devices
CREATE TABLE user_devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    device_type text NOT NULL,             -- "ios", "android", "web"
    push_token text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- H2 — notification_settings
CREATE TABLE notification_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    hydration boolean DEFAULT true,
    meals boolean DEFAULT true,
    steps boolean DEFAULT true,
    workouts boolean DEFAULT true,
    sleep boolean DEFAULT true,
    mindfulness boolean DEFAULT true,
    marketing boolean DEFAULT false,
    
    -- quiet hours
    do_not_disturb_start time DEFAULT '21:00',
    do_not_disturb_end time DEFAULT '08:00',
    
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- H3 — notifications
CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    title text NOT NULL,
    body text NOT NULL,
    type text NOT NULL,               -- 'hydration', 'meal', 'steps', 'workout', 'sleep', 'mindfulness', 'marketing'
    delivered boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- H4 — scheduled_notifications
CREATE TABLE scheduled_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    title text NOT NULL,
    body text NOT NULL,
    type text,                        -- 'meal', 'hydration', 'sleep', 'habit', 'medication'
    schedule_time time NOT NULL,
    repeat_interval text DEFAULT 'daily',   -- 'daily', 'hourly', 'weekly', 'once'
    enabled boolean DEFAULT true,
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- H5 — smart_triggers
CREATE TABLE smart_triggers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    trigger_type text NOT NULL,       -- 'hydration', 'sleep', 'mood', 'steps', 'workout', 'nutrition'
    triggered_at timestamptz DEFAULT timezone('utc', now()),
    metadata jsonb DEFAULT '{}'::jsonb,
    notification_sent boolean DEFAULT false
);

-- 2. RLS (Row-Level Security) ----------------------------

ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_triggers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "users_manage_their_devices"
ON user_devices FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_their_settings"
ON notification_settings FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_view_their_notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- Users can update delivery status
CREATE POLICY "users_update_notification_delivery"
ON notifications FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_their_scheduled_notifications"
ON scheduled_notifications FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_view_smart_triggers"
ON smart_triggers FOR SELECT
USING (user_id = auth.uid());

-- Backend can insert smart triggers (via service role)
CREATE POLICY "service_insert_smart_triggers"
ON smart_triggers FOR INSERT
WITH CHECK (true);

-- 3. INDEXES ----------------------------------------------

CREATE INDEX idx_user_devices_user ON user_devices(user_id);
CREATE INDEX idx_user_devices_token ON user_devices(push_token);
CREATE INDEX idx_notification_settings_user ON notification_settings(user_id);
CREATE INDEX idx_notifications_user_date ON notifications(user_id, created_at);
CREATE INDEX idx_notifications_delivered ON notifications(delivered) WHERE delivered = false;
CREATE INDEX idx_scheduled_notifications_user ON scheduled_notifications(user_id);
CREATE INDEX idx_scheduled_notifications_enabled ON scheduled_notifications(enabled) WHERE enabled = true;
CREATE INDEX idx_smart_triggers_user_date ON smart_triggers(user_id, triggered_at);

-- 4. RPC FUNCTIONS ---------------------------------------

-- H-RPC1 — should_notify_now(user_id, check_time)
-- Prevents notifications during quiet hours
CREATE OR REPLACE FUNCTION should_notify_now(
    user_id_param uuid,
    check_time timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    dnd_start time;
    dnd_end time;
    local_time time;
    user_tz text;
BEGIN
    -- Get user timezone (from users table or default to UTC)
    SELECT timezone INTO user_tz
    FROM users
    WHERE id = user_id_param;
    
    IF user_tz IS NULL THEN
        user_tz := 'UTC';
    END IF;
    
    -- Get quiet hours
    SELECT do_not_disturb_start, do_not_disturb_end
    INTO dnd_start, dnd_end
    FROM notification_settings
    WHERE notification_settings.user_id = user_id_param;
    
    -- Default quiet hours if not set
    IF dnd_start IS NULL THEN
        dnd_start := '21:00';
    END IF;
    
    IF dnd_end IS NULL THEN
        dnd_end := '08:00';
    END IF;
    
    -- Convert check_time to user's local time
    local_time := (check_time AT TIME ZONE user_tz)::time;
    
    -- Handle quiet hours that span midnight (e.g., 21:00 to 08:00)
    IF dnd_start < dnd_end THEN
        -- Normal case: quiet hours don't span midnight (e.g., 10:00 to 14:00)
        RETURN NOT (local_time >= dnd_start AND local_time <= dnd_end);
    ELSE
        -- Quiet hours span midnight (e.g., 21:00 to 08:00)
        RETURN NOT (local_time >= dnd_start OR local_time <= dnd_end);
    END IF;
END;
$$;

-- H-RPC2 — register_device(device_type, push_token)
CREATE OR REPLACE FUNCTION register_device(
    device_type_param text,
    push_token_param text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    device_id uuid;
BEGIN
    INSERT INTO user_devices (user_id, device_type, push_token)
    VALUES (auth.uid(), device_type_param, push_token_param)
    ON CONFLICT (push_token) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        device_type = EXCLUDED.device_type,
        updated_at = timezone('utc', now())
    RETURNING id INTO device_id;
    
    RETURN device_id;
END;
$$;

-- H-RPC3 — update_notification_settings(...)
CREATE OR REPLACE FUNCTION update_notification_settings(
    hydration_param boolean DEFAULT NULL,
    meals_param boolean DEFAULT NULL,
    steps_param boolean DEFAULT NULL,
    workouts_param boolean DEFAULT NULL,
    sleep_param boolean DEFAULT NULL,
    mindfulness_param boolean DEFAULT NULL,
    marketing_param boolean DEFAULT NULL,
    dnd_start_param time DEFAULT NULL,
    dnd_end_param time DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO notification_settings (
        user_id, hydration, meals, steps, workouts, sleep, 
        mindfulness, marketing, do_not_disturb_start, do_not_disturb_end
    )
    VALUES (
        auth.uid(),
        COALESCE(hydration_param, true),
        COALESCE(meals_param, true),
        COALESCE(steps_param, true),
        COALESCE(workouts_param, true),
        COALESCE(sleep_param, true),
        COALESCE(mindfulness_param, true),
        COALESCE(marketing_param, false),
        COALESCE(dnd_start_param, '21:00'),
        COALESCE(dnd_end_param, '08:00')
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        hydration = COALESCE(EXCLUDED.hydration, notification_settings.hydration),
        meals = COALESCE(EXCLUDED.meals, notification_settings.meals),
        steps = COALESCE(EXCLUDED.steps, notification_settings.steps),
        workouts = COALESCE(EXCLUDED.workouts, notification_settings.workouts),
        sleep = COALESCE(EXCLUDED.sleep, notification_settings.sleep),
        mindfulness = COALESCE(EXCLUDED.mindfulness, notification_settings.mindfulness),
        marketing = COALESCE(EXCLUDED.marketing, notification_settings.marketing),
        do_not_disturb_start = COALESCE(EXCLUDED.do_not_disturb_start, notification_settings.do_not_disturb_start),
        do_not_disturb_end = COALESCE(EXCLUDED.do_not_disturb_end, notification_settings.do_not_disturb_end),
        updated_at = timezone('utc', now());
END;
$$;

-- H-RPC4 — create_scheduled_notification(title, body, type, schedule_time, repeat_interval)
CREATE OR REPLACE FUNCTION create_scheduled_notification(
    title_param text,
    body_param text,
    type_param text,
    schedule_time_param time,
    repeat_interval_param text DEFAULT 'daily'
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    notification_id uuid;
BEGIN
    INSERT INTO scheduled_notifications (
        user_id, title, body, type, schedule_time, repeat_interval
    )
    VALUES (
        auth.uid(), title_param, body_param, type_param, 
        schedule_time_param, repeat_interval_param
    )
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- H-RPC5 — get_user_push_tokens(user_id)
-- Returns all active push tokens for a user
CREATE OR REPLACE FUNCTION get_user_push_tokens(user_id_param uuid)
RETURNS TABLE (
    device_id uuid,
    device_type text,
    push_token text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT id, device_type, push_token
    FROM user_devices
    WHERE user_id = user_id_param;
$$;

-- H-RPC6 — log_notification(user_id, title, body, type)
CREATE OR REPLACE FUNCTION log_notification(
    user_id_param uuid,
    title_param text,
    body_param text,
    type_param text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id uuid;
BEGIN
    INSERT INTO notifications (user_id, title, body, type)
    VALUES (user_id_param, title_param, body_param, type_param)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- H-RPC7 — mark_notification_delivered(notification_id)
CREATE OR REPLACE FUNCTION mark_notification_delivered(notification_id uuid)
RETURNS void
LANGUAGE sql
AS $$
    UPDATE notifications
    SET delivered = true
    WHERE id = notification_id AND user_id = auth.uid();
$$;

-- H-RPC8 — create_smart_trigger(user_id, trigger_type, metadata)
CREATE OR REPLACE FUNCTION create_smart_trigger(
    user_id_param uuid,
    trigger_type_param text,
    metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    trigger_id uuid;
BEGIN
    INSERT INTO smart_triggers (user_id, trigger_type, metadata)
    VALUES (user_id_param, trigger_type_param, metadata_param)
    RETURNING id INTO trigger_id;
    
    RETURN trigger_id;
END;
$$;

-- 5. TRIGGERS ---------------------------------------------

-- Auto-update updated_at on user_devices
CREATE OR REPLACE FUNCTION update_user_devices_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_devices_timestamp
BEFORE UPDATE ON user_devices
FOR EACH ROW
EXECUTE FUNCTION update_user_devices_timestamp();

-- Auto-update updated_at on notification_settings
CREATE OR REPLACE FUNCTION update_notification_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_settings_timestamp
BEFORE UPDATE ON notification_settings
FOR EACH ROW
EXECUTE FUNCTION update_notification_settings_timestamp();

-- Auto-update updated_at on scheduled_notifications
CREATE OR REPLACE FUNCTION update_scheduled_notifications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scheduled_notifications_timestamp
BEFORE UPDATE ON scheduled_notifications
FOR EACH ROW
EXECUTE FUNCTION update_scheduled_notifications_timestamp();

-- 6. HELPER VIEWS -----------------------------------------

-- View: Active scheduled notifications for today
CREATE OR REPLACE VIEW active_scheduled_notifications AS
SELECT 
    sn.*,
    u.timezone as user_timezone
FROM scheduled_notifications sn
JOIN users u ON sn.user_id = u.id
WHERE sn.enabled = true
  AND (
    sn.repeat_interval = 'daily'
    OR sn.repeat_interval = 'hourly'
    OR (sn.repeat_interval = 'weekly' AND EXTRACT(DOW FROM CURRENT_DATE) = EXTRACT(DOW FROM sn.created_at))
  );

