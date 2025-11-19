-- =========================================================
-- MODULE K — AI COACH ENGINE
-- AI personal coach: chat, daily coaching, weekly reports, insights
-- =========================================================

-- 1. TABLES -----------------------------------------------

-- K1 — ai_coach_context
-- What the AI knows about each user (safe, minimized, updated automatically)
CREATE TABLE ai_coach_context (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    profile jsonb,           -- age, weight, goal, preferences
    nutrition jsonb,         -- calories, macros, diet preference
    fitness jsonb,           -- workout split, schedules
    wellness jsonb,          -- sleep target, mood baseline, habits
    recent_logs jsonb,       -- last 7 days of data (food, exercise, sleep, mood)
    insights jsonb,          -- AI-generated insights saved weekly
    
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- K2 — ai_messages (chat history)
-- Stores user ↔ AI conversation history
CREATE TABLE ai_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    role text CHECK (role IN ('user','assistant','system')),
    message text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- K3 — ai_daily_coach_queue (scheduled tasks)
-- AI generates daily coaching messages
CREATE TABLE ai_daily_coach_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    delivery_time timestamptz NOT NULL,
    type text CHECK (type IN ('motivation','nutrition','fitness','wellness','habit','accountability')),
    payload jsonb NOT NULL,
    delivered boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- K4 — ai_weekly_reports
-- AI sends weekly check-in summary
CREATE TABLE ai_weekly_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    report jsonb NOT NULL,         -- full 360° analysis
    week_start date NOT NULL,
    week_end date NOT NULL,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- K5 — ai_insights_saved
-- Smart predictions the AI makes from patterns
CREATE TABLE ai_insights_saved (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    category text NOT NULL,         -- sleep, mood, workout_consistency, nutrition_patterns, hydration, stress
    insight text NOT NULL,
    severity int DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),  -- 1=info, 5=critical
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- 2. RLS (Row-Level Security) ----------------------------

ALTER TABLE ai_coach_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_daily_coach_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights_saved ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "users_manage_own_coach_context"
ON ai_coach_context
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_messages"
ON ai_messages
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_coach_queue"
ON ai_daily_coach_queue
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_view_own_reports"
ON ai_weekly_reports
FOR SELECT
USING (auth.uid() = user_id);

-- Backend can insert reports (via service role)
CREATE POLICY "service_insert_weekly_reports"
ON ai_weekly_reports
FOR INSERT
WITH CHECK (true);

CREATE POLICY "users_view_own_insights"
ON ai_insights_saved
FOR SELECT
USING (auth.uid() = user_id);

-- Backend can insert insights (via service role)
CREATE POLICY "service_insert_insights"
ON ai_insights_saved
FOR INSERT
WITH CHECK (true);

-- 3. INDEXES ----------------------------------------------

CREATE INDEX idx_ai_messages_user_date ON ai_messages(user_id, created_at DESC);
CREATE INDEX idx_ai_daily_coach_queue_user_delivery ON ai_daily_coach_queue(user_id, delivery_time);
CREATE INDEX idx_ai_daily_coach_queue_undelivered ON ai_daily_coach_queue(delivered, delivery_time) WHERE delivered = false;
CREATE INDEX idx_ai_weekly_reports_user_week ON ai_weekly_reports(user_id, week_start DESC);
CREATE INDEX idx_ai_insights_saved_user_category ON ai_insights_saved(user_id, category);
CREATE INDEX idx_ai_insights_saved_user_date ON ai_insights_saved(user_id, created_at DESC);

-- 4. RPC FUNCTIONS ---------------------------------------

-- K-RPC1 — update_coach_context(user_id, context_jsonb)
-- Updates AI coach context for a user
CREATE OR REPLACE FUNCTION update_coach_context(
    user_id_param uuid,
    profile_json jsonb DEFAULT NULL,
    nutrition_json jsonb DEFAULT NULL,
    fitness_json jsonb DEFAULT NULL,
    wellness_json jsonb DEFAULT NULL,
    recent_logs_json jsonb DEFAULT NULL,
    insights_json jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO ai_coach_context (
        user_id, profile, nutrition, fitness, wellness, recent_logs, insights
    )
    VALUES (
        user_id_param,
        COALESCE(profile_json, '{}'::jsonb),
        COALESCE(nutrition_json, '{}'::jsonb),
        COALESCE(fitness_json, '{}'::jsonb),
        COALESCE(wellness_json, '{}'::jsonb),
        COALESCE(recent_logs_json, '{}'::jsonb),
        COALESCE(insights_json, '{}'::jsonb)
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        profile = COALESCE(EXCLUDED.profile, ai_coach_context.profile),
        nutrition = COALESCE(EXCLUDED.nutrition, ai_coach_context.nutrition),
        fitness = COALESCE(EXCLUDED.fitness, ai_coach_context.fitness),
        wellness = COALESCE(EXCLUDED.wellness, ai_coach_context.wellness),
        recent_logs = COALESCE(EXCLUDED.recent_logs, ai_coach_context.recent_logs),
        insights = COALESCE(EXCLUDED.insights, ai_coach_context.insights),
        updated_at = timezone('utc', now());
END;
$$;

-- K-RPC2 — get_coach_context(user_id)
-- Gets AI coach context for a user
CREATE OR REPLACE FUNCTION get_coach_context(user_id_param uuid)
RETURNS TABLE (
    profile jsonb,
    nutrition jsonb,
    fitness jsonb,
    wellness jsonb,
    recent_logs jsonb,
    insights jsonb,
    updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        profile, nutrition, fitness, wellness, recent_logs, insights, updated_at
    FROM ai_coach_context
    WHERE user_id = user_id_param;
$$;

-- K-RPC3 — add_ai_message(user_id, role, message, metadata)
-- Adds a message to chat history
CREATE OR REPLACE FUNCTION add_ai_message(
    user_id_param uuid,
    role_param text,
    message_param text,
    metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    message_id uuid;
BEGIN
    INSERT INTO ai_messages (user_id, role, message, metadata)
    VALUES (user_id_param, role_param, message_param, metadata_param)
    RETURNING id INTO message_id;
    
    RETURN message_id;
END;
$$;

-- K-RPC4 — get_recent_messages(user_id, limit_count)
-- Gets last N messages for chat context (default 30)
CREATE OR REPLACE FUNCTION get_recent_messages(
    user_id_param uuid,
    limit_count int DEFAULT 30
)
RETURNS TABLE (
    id uuid,
    role text,
    message text,
    metadata jsonb,
    created_at timestamptz
)
LANGUAGE sql
AS $$
    SELECT id, role, message, metadata, created_at
    FROM ai_messages
    WHERE user_id = user_id_param
    ORDER BY created_at DESC
    LIMIT limit_count;
$$;

-- K-RPC5 — queue_daily_coach_message(user_id, delivery_time, type, payload)
-- Queues a daily coaching message
CREATE OR REPLACE FUNCTION queue_daily_coach_message(
    user_id_param uuid,
    delivery_time_param timestamptz,
    type_param text,
    payload_param jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    queue_id uuid;
BEGIN
    INSERT INTO ai_daily_coach_queue (user_id, delivery_time, type, payload)
    VALUES (user_id_param, delivery_time_param, type_param, payload_param)
    RETURNING id INTO queue_id;
    
    RETURN queue_id;
END;
$$;

-- K-RPC6 — get_pending_coach_messages(limit_count)
-- Gets pending messages ready to be delivered
CREATE OR REPLACE FUNCTION get_pending_coach_messages(limit_count int DEFAULT 100)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    delivery_time timestamptz,
    type text,
    payload jsonb
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT id, user_id, delivery_time, type, payload
    FROM ai_daily_coach_queue
    WHERE delivered = false
      AND delivery_time <= timezone('utc', now())
    ORDER BY delivery_time ASC
    LIMIT limit_count;
$$;

-- K-RPC7 — mark_coach_message_delivered(message_id)
-- Marks a coach message as delivered
CREATE OR REPLACE FUNCTION mark_coach_message_delivered(message_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
    UPDATE ai_daily_coach_queue
    SET delivered = true
    WHERE id = message_id;
$$;

-- K-RPC8 — save_weekly_report(user_id, report, week_start, week_end)
-- Saves a weekly AI report
CREATE OR REPLACE FUNCTION save_weekly_report(
    user_id_param uuid,
    report_param jsonb,
    week_start_param date,
    week_end_param date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    report_id uuid;
BEGIN
    INSERT INTO ai_weekly_reports (user_id, report, week_start, week_end)
    VALUES (user_id_param, report_param, week_start_param, week_end_param)
    RETURNING id INTO report_id;
    
    RETURN report_id;
END;
$$;

-- K-RPC9 — get_latest_weekly_report(user_id)
-- Gets the most recent weekly report for a user
CREATE OR REPLACE FUNCTION get_latest_weekly_report(user_id_param uuid)
RETURNS TABLE (
    id uuid,
    report jsonb,
    week_start date,
    week_end date,
    created_at timestamptz
)
LANGUAGE sql
AS $$
    SELECT id, report, week_start, week_end, created_at
    FROM ai_weekly_reports
    WHERE user_id = user_id_param
    ORDER BY week_start DESC
    LIMIT 1;
$$;

-- K-RPC10 — save_ai_insight(user_id, category, insight, severity, metadata)
-- Saves an AI-generated insight
CREATE OR REPLACE FUNCTION save_ai_insight(
    user_id_param uuid,
    category_param text,
    insight_param text,
    severity_param int DEFAULT 1,
    metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    insight_id uuid;
BEGIN
    INSERT INTO ai_insights_saved (user_id, category, insight, severity, metadata)
    VALUES (user_id_param, category_param, insight_param, severity_param, metadata_param)
    RETURNING id INTO insight_id;
    
    RETURN insight_id;
END;
$$;

-- K-RPC11 — get_user_insights(user_id, category_filter)
-- Gets insights for a user, optionally filtered by category
CREATE OR REPLACE FUNCTION get_user_insights(
    user_id_param uuid,
    category_filter text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    category text,
    insight text,
    severity int,
    metadata jsonb,
    created_at timestamptz
)
LANGUAGE sql
AS $$
    SELECT id, category, insight, severity, metadata, created_at
    FROM ai_insights_saved
    WHERE user_id = user_id_param
      AND (category_filter IS NULL OR category = category_filter)
    ORDER BY created_at DESC;
$$;

-- K-RPC12 — cleanup_old_messages(user_id)
-- Keeps only last 30 messages per user (for chat history management)
CREATE OR REPLACE FUNCTION cleanup_old_messages(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM ai_messages
    WHERE user_id = user_id_param
      AND id NOT IN (
          SELECT id
          FROM ai_messages
          WHERE user_id = user_id_param
          ORDER BY created_at DESC
          LIMIT 30
      );
END;
$$;

-- 5. TRIGGERS ---------------------------------------------

-- Auto-update updated_at on ai_coach_context
CREATE OR REPLACE FUNCTION update_ai_coach_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_coach_context_timestamp
BEFORE UPDATE ON ai_coach_context
FOR EACH ROW
EXECUTE FUNCTION update_ai_coach_context_timestamp();

-- 6. HELPER VIEWS -----------------------------------------

-- View: Recent messages for chat (ordered chronologically)
CREATE OR REPLACE VIEW recent_chat_messages AS
SELECT 
    id,
    user_id,
    role,
    message,
    metadata,
    created_at
FROM ai_messages
ORDER BY created_at ASC;

-- View: Pending coach messages ready for delivery
CREATE OR REPLACE VIEW pending_coach_messages AS
SELECT 
    id,
    user_id,
    delivery_time,
    type,
    payload,
    created_at
FROM ai_daily_coach_queue
WHERE delivered = false
  AND delivery_time <= timezone('utc', now())
ORDER BY delivery_time ASC;

