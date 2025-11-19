-- =========================================================
-- MODULE AF — NOTIFICATION AI (FULL SYSTEM)
-- Smart notification engine with weekday/weekend windows, AI decision logic, rate limiting
-- =========================================================

-- 1. ENHANCED TABLES (Extends Module H) ------------------

-- AF1: notification_channels (system table)
CREATE TABLE IF NOT EXISTS notification_channels (
    id serial PRIMARY KEY,
    name text UNIQUE NOT NULL,  -- "push", "in_app"
    description text
);

INSERT INTO notification_channels (name, description) VALUES
    ('push', 'Push notifications via Expo/FCM'),
    ('in_app', 'In-app notification center')
ON CONFLICT (name) DO NOTHING;

-- AF2: Enhanced user_notification_settings (extends Module H)
-- Add weekday/weekend windows and enhanced category toggles
ALTER TABLE notification_settings 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Europe/Lisbon',
ADD COLUMN IF NOT EXISTS max_notifications_per_day int DEFAULT 4,
ADD COLUMN IF NOT EXISTS allow_push boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_in_app boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS nutrition_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS workouts_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS hydration_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS sleep_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS mood_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS habits_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS wellness_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS streaks_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS ai_recos_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS marketplace_enabled boolean DEFAULT false;

-- AF3: Enhanced notifications table (extends Module H)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS channel text DEFAULT 'push',
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS deep_link text,
ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
ADD COLUMN IF NOT EXISTS sent_at timestamptz,
ADD COLUMN IF NOT EXISTS read_at timestamptz,
ADD COLUMN IF NOT EXISTS priority int DEFAULT 1;

-- AF4: notification_daily_counts (rate limit per user)
CREATE TABLE IF NOT EXISTS notification_daily_counts (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    count int DEFAULT 0,
    fuel_count int DEFAULT 0,
    move_count int DEFAULT 0,
    wellness_count int DEFAULT 0,
    other_count int DEFAULT 0,
    PRIMARY KEY (user_id, date)
);

-- AF5: notification_templates (pre-defined templates)
CREATE TABLE IF NOT EXISTS notification_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category text NOT NULL,
    trigger_type text NOT NULL,
    title_template text NOT NULL,
    body_template text NOT NULL,
    deep_link text,
    priority int DEFAULT 1,
    weekday_window_start time,
    weekday_window_end time,
    weekend_window_start time,
    weekend_window_end time,
    enabled boolean DEFAULT true,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Pre-populate notification templates
INSERT INTO notification_templates (category, trigger_type, title_template, body_template, deep_link, priority, weekday_window_start, weekday_window_end, weekend_window_start, weekend_window_end) VALUES
    -- Fuel
    ('nutrition', 'breakfast_missing', 'Forgot breakfast? 🥣', 'A small meal now will help you stay on track.', '/fuel', 3, '08:30', '09:30', '11:00', '11:00'),
    ('hydration', 'water_low_afternoon', 'Time for a sip 💧', 'You''re behind your hydration target today.', '/fuel/water', 4, '12:00', '14:00', '11:00', '11:00'),
    ('hydration', 'water_low_evening', 'Stay hydrated 💧', 'You''re below 60% of your daily target.', '/fuel/water', 3, '16:00', '18:00', '16:00', '16:00'),
    ('nutrition', 'protein_low', 'Protein check-in 🍗', 'You''re below your goal — a quick snack could help.', '/fuel/macros', 2, '19:00', '20:00', '20:00', '20:00'),
    ('nutrition', 'calories_low', 'Don''t forget dinner 🥗', 'Logging your last meal keeps your plan accurate.', '/fuel', 2, '19:00', '20:00', '20:00', '20:00'),
    ('nutrition', 'meal_plan_ready', 'We built tomorrow''s meals for you 🔥', 'Want to approve your plan?', '/fuel/plan', 1, '20:00', '20:00', '20:00', '20:00'),
    ('nutrition', 'grocery_auto_add', 'Add missing items to your Shopping List? 🛒', 'Your recipe needs these ingredients.', '/shopping-list', 1, '12:00', '22:00', '10:00', '22:00'),
    
    -- Move
    ('workout', 'workout_scheduled', 'Time for your workout 💪', 'Your scheduled session is ready.', '/move/today', 4, '17:00', '19:00', '11:00', '14:00'),
    ('workout', 'streak_at_risk', '🔥 Don''t lose your {streak}-day workout streak.', 'Even 10 minutes counts.', '/move/today', 5, '18:30', '18:30', '19:00', '19:00'),
    ('workout', 'workout_missed', 'You missed yesterday''s session', 'Want a lighter option today?', '/move/adapted', 3, '09:00', '12:00', '11:00', '14:00'),
    ('workout', 'high_readiness', 'Your body is ready 💪', 'Great time for your session.', '/move', 3, '09:00', '12:00', '11:00', '14:00'),
    ('workout', 'auto_progression', 'New progression unlocked!', 'Your plan adapted based on last week.', '/move/program', 2, '08:00', '22:00', '10:00', '22:00'),
    ('workout', 'steps_low', 'Take a Walk', 'You''re below your steps goal. A 10-minute walk can help!', '/move/steps', 2, '17:00', '17:00', '17:00', '17:00'),
    
    -- Wellness
    ('wellness', 'mood_evening', 'How was your day? 💬', 'A quick mood check helps track patterns.', '/wellness/mood', 3, '19:00', '19:00', '18:00', '18:00'),
    ('wellness', 'habits_incomplete', 'You''re almost done for today!', '{count} habits left to check off.', '/wellness/habits', 2, '19:00', '19:00', '18:00', '18:00'),
    ('wellness', 'journaling_suggestion', 'Take 1 minute to clear your mind ✨', 'Journaling can help you process today.', '/wellness/journal', 2, '20:00', '20:00', '21:00', '21:00'),
    ('wellness', 'meditation_suggestion', 'Need a reset?', 'Try a 2-minute breathing exercise.', '/wellness/meditate', 2, '17:00', '19:00', '16:00', '19:00'),
    ('wellness', 'weekly_review', 'Your weekly wellness trends are ready 🌿', 'Check your insights.', '/wellness/insights', 1, '08:00', '10:00', '10:00', '12:00'),
    
    -- Games
    ('wellness', 'game_low_mood', 'Try a quick focus reset 🧠', '30 seconds can help clear your mind.', '/wellness/games/focus', 2, '15:00', '18:00', '14:00', '18:00'),
    ('wellness', 'game_high_stress', 'Need a break?', 'Try a calming breathing mini-game.', '/wellness/games/breathing', 2, '15:00', '18:00', '14:00', '18:00'),
    ('wellness', 'game_inactivity', 'Ready for today''s challenge?', 'Beat your last score!', '/wellness/games', 1, '15:00', '18:00', '14:00', '18:00'),
    
    -- Sleep
    ('sleep', 'bedtime_routine', 'Start winding down 🌙', 'Try a 5-minute relaxation.', '/wellness/meditate', 4, '21:00', '21:00', '21:00', '21:00'),
    ('sleep', 'poor_sleep', 'Rough night?', 'Take it slow today — your plan has been adjusted.', '/coach/today', 3, '08:15', '08:15', '10:00', '10:00'),
    ('sleep', 'sleep_log_missing', 'How did you sleep?', 'Logging helps track recovery.', '/wellness/sleep', 2, '08:20', '08:20', '10:15', '10:15'),
    ('sleep', 'sleep_insight', 'Sleep insights ready', 'Check your recovery score.', '/wellness/sleep', 1, '08:15', '08:15', '10:00', '10:00')
ON CONFLICT DO NOTHING;

-- 2. INDEXES ------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_notification_daily_counts_user_date ON notification_daily_counts(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_at) WHERE sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category, enabled);

-- 3. RLS POLICIES -------------------------------------------

ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_daily_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_channels" ON notification_channels FOR SELECT USING (true);
CREATE POLICY "users_manage_own_daily_counts" ON notification_daily_counts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "public_read_templates" ON notification_templates FOR SELECT USING (enabled = true);

-- 4. RPC FUNCTIONS -----------------------------------------

-- AF-RPC1: can_send_notification(user_id, category)
-- Check quiet hours + daily limit + user prefs + weekday/weekend windows
CREATE OR REPLACE FUNCTION can_send_notification(
    p_user_id uuid,
    p_category text
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    settings_record RECORD;
    today_count int;
    now_local timestamptz;
    current_tod time;
    current_dow int; -- day of week (0=Sunday, 6=Saturday)
    enabled boolean := true;
    window_start time;
    window_end time;
    is_weekend boolean;
    user_tz text;
    dnd_start time;
    dnd_end time;
BEGIN
    -- Get user settings
    SELECT * INTO settings_record
    FROM notification_settings
    WHERE user_id = p_user_id;
    
    -- Default settings if not exists
    IF settings_record IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if push/in-app enabled
    IF settings_record.allow_push = false AND settings_record.allow_in_app = false THEN
        RETURN false;
    END IF;
    
    -- Category toggle check
    CASE p_category
        WHEN 'nutrition' THEN enabled := COALESCE(settings_record.nutrition_enabled, true);
        WHEN 'workout' THEN enabled := COALESCE(settings_record.workouts_enabled, true);
        WHEN 'hydration' THEN enabled := COALESCE(settings_record.hydration_enabled, true);
        WHEN 'sleep' THEN enabled := COALESCE(settings_record.sleep_enabled, true);
        WHEN 'mood' THEN enabled := COALESCE(settings_record.mood_enabled, true);
        WHEN 'habits' THEN enabled := COALESCE(settings_record.habits_enabled, true);
        WHEN 'wellness' THEN enabled := COALESCE(settings_record.wellness_enabled, true);
        WHEN 'streaks' THEN enabled := COALESCE(settings_record.streaks_enabled, true);
        WHEN 'ai' THEN enabled := COALESCE(settings_record.ai_recos_enabled, true);
        WHEN 'marketplace' THEN enabled := COALESCE(settings_record.marketplace_enabled, false);
        ELSE enabled := true;
    END CASE;
    
    IF NOT enabled THEN
        RETURN false;
    END IF;
    
    -- Get user timezone
    user_tz := COALESCE(settings_record.timezone, 'Europe/Lisbon');
    
    -- Convert now() to user timezone
    now_local := (now() AT TIME ZONE user_tz);
    current_tod := (now_local::time);
    current_dow := EXTRACT(DOW FROM now_local);
    
    -- Check if weekend (Saturday=6, Sunday=0)
    is_weekend := (current_dow = 0 OR current_dow = 6);
    
    -- Get quiet hours
    dnd_start := COALESCE(settings_record.do_not_disturb_start, '21:30'::time);
    dnd_end := COALESCE(settings_record.do_not_disturb_end, '07:30'::time);
    
    -- Check weekday/weekend windows
    IF is_weekend THEN
        -- Weekend: 10:00 → 22:00
        IF current_tod < '10:00' OR current_tod > '22:00' THEN
            RETURN false;
        END IF;
    ELSE
        -- Weekday: 08:15 → 21:30
        IF current_tod < '08:15' OR current_tod > '21:30' THEN
            RETURN false;
        END IF;
    END IF;
    
    -- Check quiet hours (from settings)
    IF dnd_start < dnd_end THEN
        IF current_tod >= dnd_start AND current_tod <= dnd_end THEN
            RETURN false;
        END IF;
    ELSE
        IF current_tod >= dnd_start OR current_tod <= dnd_end THEN
            RETURN false;
        END IF;
    END IF;
    
    -- Check daily limit
    SELECT count INTO today_count
    FROM notification_daily_counts
    WHERE user_id = p_user_id 
    AND date = (now_local::date);
    
    IF COALESCE(today_count, 0) >= COALESCE(settings_record.max_notifications_per_day, 4) THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

-- AF-RPC2: enqueue_notification(...)
-- Create notification if allowed + increment count
CREATE OR REPLACE FUNCTION enqueue_notification(
    p_user_id uuid,
    p_channel text DEFAULT 'push',
    p_category text,
    p_title text,
    p_body text,
    p_deep_link text DEFAULT NULL,
    p_scheduled_at timestamptz DEFAULT NULL,
    p_priority int DEFAULT 1
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    allowed boolean;
    new_id uuid;
    local_date date;
    user_tz text;
    category_group text;
BEGIN
    -- Check if allowed
    allowed := can_send_notification(p_user_id, p_category);
    
    IF NOT allowed THEN
        RETURN NULL;
    END IF;
    
    -- Get user timezone
    SELECT COALESCE(timezone, 'Europe/Lisbon') INTO user_tz
    FROM notification_settings
    WHERE user_id = p_user_id;
    
    local_date := ((now() AT TIME ZONE user_tz)::date);
    
    -- Determine category group for counting
    category_group := CASE 
        WHEN p_category IN ('nutrition', 'hydration') THEN 'fuel'
        WHEN p_category IN ('workout', 'steps') THEN 'move'
        WHEN p_category IN ('wellness', 'mood', 'habits', 'sleep', 'games') THEN 'wellness'
        ELSE 'other'
    END;
    
    -- Check category-specific limits (max 1 per category group per day)
    DECLARE
        fuel_count int;
        move_count int;
        wellness_count int;
    BEGIN
        SELECT COALESCE(fuel_count, 0), COALESCE(move_count, 0), COALESCE(wellness_count, 0)
        INTO fuel_count, move_count, wellness_count
        FROM notification_daily_counts
        WHERE user_id = p_user_id AND date = local_date;
        
        IF category_group = 'fuel' AND fuel_count >= 1 THEN
            RETURN NULL;
        END IF;
        
        IF category_group = 'move' AND move_count >= 1 THEN
            RETURN NULL;
        END IF;
        
        IF category_group = 'wellness' AND wellness_count >= 1 THEN
            RETURN NULL;
        END IF;
    END;
    
    -- Insert notification
    INSERT INTO notifications (
        user_id, channel, category, title, body, deep_link, scheduled_at, priority
    )
    VALUES (
        p_user_id, p_channel, p_category, p_title, p_body, p_deep_link, 
        COALESCE(p_scheduled_at, now()), p_priority
    )
    RETURNING id INTO new_id;
    
    -- Update daily counts
    INSERT INTO notification_daily_counts (user_id, date, count, fuel_count, move_count, wellness_count, other_count)
    VALUES (
        p_user_id, local_date, 1,
        CASE WHEN category_group = 'fuel' THEN 1 ELSE 0 END,
        CASE WHEN category_group = 'move' THEN 1 ELSE 0 END,
        CASE WHEN category_group = 'wellness' THEN 1 ELSE 0 END,
        CASE WHEN category_group = 'other' THEN 1 ELSE 0 END
    )
    ON CONFLICT (user_id, date) DO UPDATE
    SET 
        count = notification_daily_counts.count + 1,
        fuel_count = notification_daily_counts.fuel_count + CASE WHEN category_group = 'fuel' THEN 1 ELSE 0 END,
        move_count = notification_daily_counts.move_count + CASE WHEN category_group = 'move' THEN 1 ELSE 0 END,
        wellness_count = notification_daily_counts.wellness_count + CASE WHEN category_group = 'wellness' THEN 1 ELSE 0 END,
        other_count = notification_daily_counts.other_count + CASE WHEN category_group = 'other' THEN 1 ELSE 0 END;
    
    RETURN new_id;
END;
$$;

-- AF-RPC3: mark_notification_read(notification_id)
CREATE OR REPLACE FUNCTION mark_notification_read(p_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE notifications
    SET read_at = now()
    WHERE id = p_id AND user_id = auth.uid();
END;
$$;

-- AF-RPC4: get_notification_template(category, trigger_type)
CREATE OR REPLACE FUNCTION get_notification_template(
    p_category text,
    p_trigger_type text
)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_build_object(
        'id', id,
        'category', category,
        'trigger_type', trigger_type,
        'title_template', title_template,
        'body_template', body_template,
        'deep_link', deep_link,
        'priority', priority,
        'weekday_window_start', weekday_window_start,
        'weekday_window_end', weekday_window_end,
        'weekend_window_start', weekend_window_start,
        'weekend_window_end', weekend_window_end
    )
    FROM notification_templates
    WHERE category = p_category
      AND trigger_type = p_trigger_type
      AND enabled = true
    LIMIT 1;
$$;

-- AF-RPC5: get_unread_notifications_count(user_id)
CREATE OR REPLACE FUNCTION get_unread_notifications_count(p_user_id uuid)
RETURNS int
LANGUAGE sql
AS $$
    SELECT COUNT(*)
    FROM notifications
    WHERE user_id = p_user_id
      AND read_at IS NULL
      AND sent_at IS NOT NULL;
$$;

-- AF-RPC6: get_pending_notifications()
-- Get notifications ready to send (for worker)
CREATE OR REPLACE FUNCTION get_pending_notifications()
RETURNS TABLE (
    id uuid,
    user_id uuid,
    channel text,
    category text,
    title text,
    body text,
    deep_link text,
    priority int
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        n.id,
        n.user_id,
        n.channel,
        n.category,
        n.title,
        n.body,
        n.deep_link,
        n.priority
    FROM notifications n
    WHERE n.sent_at IS NULL
      AND (n.scheduled_at IS NULL OR n.scheduled_at <= now())
      AND can_send_notification(n.user_id, n.category)
    ORDER BY n.priority DESC, n.scheduled_at ASC
    LIMIT 100;
$$;

-- AF-RPC7: mark_notification_sent(notification_id)
CREATE OR REPLACE FUNCTION mark_notification_sent(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE notifications
    SET sent_at = now()
    WHERE id = p_id;
END;
$$;

-- =========================================================
-- MODULE AF — NOTIFICATION AI — COMPLETE
-- =========================================================

