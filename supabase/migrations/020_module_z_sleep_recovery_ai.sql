-- =========================================================
-- MODULE Z — SLEEP + RECOVERY AI
-- WHOOP-level sleep intelligence system, recovery scoring, AI insights
-- =========================================================

-- 1. ENHANCE EXISTING SLEEP_LOGS TABLE (from Module C) -------

-- Add missing columns to sleep_logs if they don't exist
DO $$
BEGIN
    -- Add date if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sleep_logs' AND column_name = 'date'
    ) THEN
        ALTER TABLE sleep_logs ADD COLUMN date date DEFAULT CURRENT_DATE;
    END IF;
    
    -- Add bedtime if it doesn't exist (enhancement of sleep_start)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sleep_logs' AND column_name = 'bedtime'
    ) THEN
        ALTER TABLE sleep_logs ADD COLUMN bedtime timestamptz;
    END IF;
    
    -- Add wake_time if it doesn't exist (enhancement of sleep_end)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sleep_logs' AND column_name = 'wake_time'
    ) THEN
        ALTER TABLE sleep_logs ADD COLUMN wake_time timestamptz;
    END IF;
    
    -- Add duration_minutes if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sleep_logs' AND column_name = 'duration_minutes'
    ) THEN
        ALTER TABLE sleep_logs ADD COLUMN duration_minutes int;
    END IF;
    
    -- Add sleep_latency_minutes if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sleep_logs' AND column_name = 'sleep_latency_minutes'
    ) THEN
        ALTER TABLE sleep_logs ADD COLUMN sleep_latency_minutes int;
    END IF;
    
    -- Add wake_after_sleep_onset if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sleep_logs' AND column_name = 'wake_after_sleep_onset'
    ) THEN
        ALTER TABLE sleep_logs ADD COLUMN wake_after_sleep_onset int;
    END IF;
    
    -- Add interruptions if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sleep_logs' AND column_name = 'interruptions'
    ) THEN
        ALTER TABLE sleep_logs ADD COLUMN interruptions int DEFAULT 0;
    END IF;
    
    -- Add sleep_quality_score if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sleep_logs' AND column_name = 'sleep_quality_score'
    ) THEN
        ALTER TABLE sleep_logs ADD COLUMN sleep_quality_score int;
    END IF;
    
    -- Add notes if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sleep_logs' AND column_name = 'notes'
    ) THEN
        ALTER TABLE sleep_logs ADD COLUMN notes text;
    END IF;
    
    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sleep_logs' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE sleep_logs ADD COLUMN updated_at timestamptz DEFAULT timezone('utc', now());
    END IF;
    
    -- Migrate existing data: if sleep_start/sleep_end exist, use them for bedtime/wake_time
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sleep_logs' AND column_name = 'sleep_start'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sleep_logs' AND column_name = 'sleep_end'
    ) THEN
        UPDATE sleep_logs 
        SET bedtime = sleep_start, 
            wake_time = sleep_end,
            date = COALESCE(date, DATE(sleep_start))
        WHERE bedtime IS NULL AND sleep_start IS NOT NULL;
    END IF;
    
    -- Migrate hours to duration_minutes
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sleep_logs' AND column_name = 'hours'
    ) THEN
        UPDATE sleep_logs 
        SET duration_minutes = COALESCE(duration_minutes, (hours * 60)::int)
        WHERE duration_minutes IS NULL AND hours IS NOT NULL;
    END IF;
    
    -- Migrate quality to sleep_quality_score (scale 1-5 to 0-100)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sleep_logs' AND column_name = 'quality'
    ) THEN
        UPDATE sleep_logs 
        SET sleep_quality_score = COALESCE(sleep_quality_score, (quality * 20)::int)
        WHERE sleep_quality_score IS NULL AND quality IS NOT NULL;
    END IF;
END $$;

-- 2. NEW TABLES -------------------------------------------

-- Z1 — recovery_logs
-- Tracks holistic recovery, merges all modules
CREATE TABLE IF NOT EXISTS recovery_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    sleep_score int,              -- 0-100
    workout_intensity int,        -- 0-100 (from workout logs)
    stress_level int,             -- 1-5 (from wellness)
    hydration_score int,          -- 0-100 (from nutrition)
    mood_score int,               -- 0-100 (from moods, 1-5 scale converted)
    nutrition_score int,          -- 0-100 (from daily summaries)
    total_recovery_score int,     -- final weighted score 0-100
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, date)
);

-- Z2 — sleep_insights
-- AI generated insights, correlations, warnings
CREATE TABLE IF NOT EXISTS sleep_insights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date DEFAULT CURRENT_DATE,
    insight_type text NOT NULL,   -- pattern, warning, correlation, coaching, recommendation
    message text NOT NULL,
    confidence numeric DEFAULT 0.8, -- 0-1
    metadata jsonb DEFAULT '{}'::jsonb, -- Additional context
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Z3 — sleep_recommendations
-- Smart bedtime reminders, supplement suggestions, routines
CREATE TABLE IF NOT EXISTS sleep_recommendations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation text NOT NULL,
    recommended_time timestamptz,
    category text NOT NULL,        -- bedtime, recovery, supplement, behavior, routine
    priority int DEFAULT 5,       -- 1-10, higher = more important
    is_premium boolean DEFAULT false,
    action_url text,              -- Deep link to relevant screen
    created_at timestamptz DEFAULT timezone('utc', now()),
    expires_at timestamptz
);

-- 3. INDEXES ----------------------------------------------

CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_date ON sleep_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_recovery_logs_user_date ON recovery_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sleep_insights_user_date ON sleep_insights(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sleep_insights_type ON sleep_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_sleep_recommendations_user ON sleep_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_recommendations_category ON sleep_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_sleep_recommendations_expires ON sleep_recommendations(expires_at);

-- 4. RLS (Row-Level Security) ----------------------------

ALTER TABLE recovery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_recommendations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "users_manage_own_recovery_logs"
ON recovery_logs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_sleep_insights"
ON sleep_insights
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_sleep_recommendations"
ON sleep_recommendations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. RPC FUNCTIONS ---------------------------------------

-- Z-RPC1 — calculate_sleep_score(duration, latency, waso, interruptions)
-- Calculates sleep quality score (0-100)
CREATE OR REPLACE FUNCTION calculate_sleep_score(
    p_duration int,
    p_latency int DEFAULT NULL,
    p_waso int DEFAULT NULL,
    p_interruptions int DEFAULT 0
)
RETURNS int
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    score int := 0;
BEGIN
    -- Duration scoring (40 points max)
    IF p_duration IS NOT NULL THEN
        IF p_duration >= 420 AND p_duration <= 540 THEN  -- 7-9 hrs (optimal)
            score := score + 40;
        ELSIF p_duration >= 360 AND p_duration < 420 THEN  -- 6-7 hrs
            score := score + 25;
        ELSIF p_duration > 540 AND p_duration <= 600 THEN  -- 9-10 hrs
            score := score + 30;
        ELSIF p_duration >= 300 AND p_duration < 360 THEN  -- 5-6 hrs
            score := score + 15;
        ELSE
            score := score + 10;  -- <5 hrs or >10 hrs
        END IF;
    END IF;
    
    -- Latency scoring (20 points max)
    IF p_latency IS NOT NULL THEN
        IF p_latency <= 20 THEN
            score := score + 20;
        ELSIF p_latency <= 40 THEN
            score := score + 10;
        ELSIF p_latency <= 60 THEN
            score := score + 5;
        END IF;
    END IF;
    
    -- WASO (Wake After Sleep Onset) scoring (25 points max)
    IF p_waso IS NOT NULL THEN
        IF p_waso < 30 THEN
            score := score + 25;
        ELSIF p_waso < 60 THEN
            score := score + 15;
        ELSIF p_waso < 90 THEN
            score := score + 10;
        END IF;
    END IF;
    
    -- Interruptions (15 points max)
    score := score + GREATEST(0, 15 - (p_interruptions * 3));
    
    RETURN LEAST(score, 100);
END;
$$;

-- Z-RPC2 — log_sleep_session(user_id, date, bedtime, wake_time, latency, waso, interruptions, notes)
-- Logs a sleep session and calculates score
CREATE OR REPLACE FUNCTION log_sleep_session(
    p_user uuid,
    p_date date DEFAULT CURRENT_DATE,
    p_bedtime timestamptz DEFAULT NULL,
    p_wake_time timestamptz DEFAULT NULL,
    p_latency int DEFAULT NULL,
    p_waso int DEFAULT NULL,
    p_interruptions int DEFAULT 0,
    p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    duration_min int;
    score int;
    sleep_id uuid;
    bedtime_ts timestamptz;
    wake_ts timestamptz;
BEGIN
    -- Calculate duration from bedtime/wake_time if provided
    IF p_bedtime IS NOT NULL AND p_wake_time IS NOT NULL THEN
        duration_min := EXTRACT(EPOCH FROM (p_wake_time - p_bedtime)) / 60;
        bedtime_ts := p_bedtime;
        wake_ts := p_wake_time;
    ELSIF p_bedtime IS NOT NULL THEN
        -- Only bedtime provided, estimate wake time
        bedtime_ts := p_bedtime;
        wake_ts := p_bedtime + INTERVAL '8 hours';
        duration_min := 480; -- Default 8 hours
    ELSIF p_wake_time IS NOT NULL THEN
        -- Only wake time provided, estimate bedtime
        wake_ts := p_wake_time;
        bedtime_ts := p_wake_time - INTERVAL '8 hours';
        duration_min := 480; -- Default 8 hours
    ELSE
        -- Fallback: use existing hours column if available
        SELECT hours INTO duration_min
        FROM sleep_logs
        WHERE user_id = p_user AND date = p_date
        ORDER BY created_at DESC
        LIMIT 1;
        
        IF duration_min IS NULL THEN
            duration_min := 480; -- Default 8 hours
        ELSE
            duration_min := (duration_min * 60)::int;
        END IF;
    END IF;
    
    -- Calculate sleep score
    score := calculate_sleep_score(duration_min, p_latency, p_waso, p_interruptions);
    
    -- Check if sleep log already exists for this date
    SELECT id INTO sleep_id
    FROM sleep_logs
    WHERE user_id = p_user AND date = p_date
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Update existing or insert new
    IF sleep_id IS NOT NULL THEN
        UPDATE sleep_logs
        SET
            bedtime = bedtime_ts,
            wake_time = wake_ts,
            duration_minutes = duration_min,
            sleep_latency_minutes = p_latency,
            wake_after_sleep_onset = p_waso,
            interruptions = p_interruptions,
            sleep_quality_score = score,
            notes = p_notes,
            hours = (duration_min / 60.0)::numeric,
            sleep_start = bedtime_ts,
            sleep_end = wake_ts,
            quality = (score / 20)::int,
            updated_at = timezone('utc', now())
        WHERE id = sleep_id;
    ELSE
        INSERT INTO sleep_logs (
            user_id, date, bedtime, wake_time,
            duration_minutes, sleep_latency_minutes,
            wake_after_sleep_onset, interruptions,
            sleep_quality_score, notes,
            hours, sleep_start, sleep_end, quality, updated_at
        )
        VALUES (
            p_user, p_date, bedtime_ts, wake_ts,
            duration_min, p_latency,
            p_waso, p_interruptions,
            score, p_notes,
            (duration_min / 60.0)::numeric, bedtime_ts, wake_ts, (score / 20)::int, timezone('utc', now())
        )
        RETURNING id INTO sleep_id;
    END IF;
    
    RETURN sleep_id;
END;
$$;

-- Z-RPC3 — compute_recovery_score(sleep_score, workout_intensity, stress_level, hydration_score, mood_score, nutrition_score)
-- Computes holistic recovery score (0-100)
CREATE OR REPLACE FUNCTION compute_recovery_score(
    p_sleep int DEFAULT 0,
    p_workout int DEFAULT 0,
    p_stress int DEFAULT 0,
    p_hydration int DEFAULT 0,
    p_mood int DEFAULT 0,
    p_nutrition int DEFAULT 0
)
RETURNS int
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT GREATEST(0, LEAST(100,
        (COALESCE(p_sleep, 0) * 0.4) +
        (COALESCE(p_workout, 0) * 0.15) +
        (COALESCE(p_mood, 0) * 0.15) +
        (COALESCE(p_stress, 0) * 0.10) +
        (COALESCE(p_hydration, 0) * 0.10) +
        (COALESCE(p_nutrition, 0) * 0.10)
    ))::int;
$$;

-- Z-RPC4 — calculate_daily_recovery(user_id, date)
-- Calculates and stores daily recovery score
CREATE OR REPLACE FUNCTION calculate_daily_recovery(
    p_user uuid,
    p_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sleep_score int;
    workout_intensity int;
    stress_level int;
    hydration_score int;
    mood_score int;
    nutrition_score int;
    total_recovery int;
    is_premium boolean;
BEGIN
    -- Check if user is premium (advanced recovery analysis is premium-only)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    -- Get sleep score
    SELECT COALESCE(sleep_quality_score, 0) INTO sleep_score
    FROM sleep_logs
    WHERE user_id = p_user AND date = p_date
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Get workout intensity (from workout_logs, Module M)
    SELECT COALESCE(
        CASE 
            WHEN COUNT(*) = 0 THEN 100  -- No workout = full recovery
            ELSE GREATEST(0, 100 - (AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60)::int))
        END,
        100
    ) INTO workout_intensity
    FROM workout_logs
    WHERE user_id = p_user AND DATE(completed_at) = p_date;
    
    -- Get stress level (from wellness, Module C - if stress tracking exists)
    -- For now, use mood as proxy (inverted: low mood = high stress)
    SELECT COALESCE(
        CASE 
            WHEN AVG(mood_value) >= 4 THEN 100  -- High mood = low stress
            WHEN AVG(mood_value) >= 3 THEN 70
            WHEN AVG(mood_value) >= 2 THEN 40
            ELSE 20
        END,
        50
    )::int INTO stress_level
    FROM moods
    WHERE user_id = p_user AND DATE(created_at) = p_date;
    
    -- Get hydration score (from daily_summaries, Module R)
    SELECT COALESCE(
        CASE 
            WHEN water_ml >= 2500 THEN 100
            WHEN water_ml >= 2000 THEN 80
            WHEN water_ml >= 1500 THEN 60
            WHEN water_ml >= 1000 THEN 40
            ELSE 20
        END,
        50
    )::int INTO hydration_score
    FROM daily_summaries
    WHERE user_id = p_user AND date = p_date;
    
    -- Get mood score (from moods, Module C)
    SELECT COALESCE((AVG(mood_value) * 20)::int, 50) INTO mood_score
    FROM moods
    WHERE user_id = p_user AND DATE(created_at) = p_date;
    
    -- Get nutrition score (from daily_summaries, Module R)
    SELECT COALESCE(
        CASE 
            WHEN calories_consumed >= calories_target * 0.9 
             AND calories_consumed <= calories_target * 1.1 THEN 100
            WHEN calories_consumed >= calories_target * 0.8 
             AND calories_consumed <= calories_target * 1.2 THEN 70
            ELSE 50
        END,
        50
    )::int INTO nutrition_score
    FROM daily_summaries
    WHERE user_id = p_user AND date = p_date;
    
    -- Calculate total recovery score
    total_recovery := compute_recovery_score(
        sleep_score, workout_intensity, stress_level,
        hydration_score, mood_score, nutrition_score
    );
    
    -- Upsert recovery log
    INSERT INTO recovery_logs (
        user_id, date, sleep_score, workout_intensity,
        stress_level, hydration_score, mood_score,
        nutrition_score, total_recovery_score
    )
    VALUES (
        p_user, p_date, sleep_score, workout_intensity,
        stress_level, hydration_score, mood_score,
        nutrition_score, total_recovery
    )
    ON CONFLICT (user_id, date) DO UPDATE
    SET
        sleep_score = EXCLUDED.sleep_score,
        workout_intensity = EXCLUDED.workout_intensity,
        stress_level = EXCLUDED.stress_level,
        hydration_score = EXCLUDED.hydration_score,
        mood_score = EXCLUDED.mood_score,
        nutrition_score = EXCLUDED.nutrition_score,
        total_recovery_score = EXCLUDED.total_recovery_score;
    
    RETURN jsonb_build_object(
        'success', true,
        'date', p_date,
        'sleep_score', sleep_score,
        'workout_intensity', workout_intensity,
        'stress_level', stress_level,
        'hydration_score', hydration_score,
        'mood_score', mood_score,
        'nutrition_score', nutrition_score,
        'total_recovery_score', total_recovery
    );
END;
$$;

-- Z-RPC5 — generate_sleep_insight(user_id)
-- Generates AI sleep insights (premium only)
CREATE OR REPLACE FUNCTION generate_sleep_insight(p_user uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    insight_id uuid;
    avg_sleep numeric;
    avg_mood numeric;
    insight text;
    insight_type text;
    confidence numeric;
    is_premium boolean;
    sleep_trend numeric;
    mood_trend numeric;
BEGIN
    -- Check if user is premium (AI insights are premium-only)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    IF NOT is_premium THEN
        RAISE EXCEPTION 'AI sleep insights require premium subscription.';
    END IF;
    
    -- Get average sleep score (last 14 days)
    SELECT AVG(sleep_quality_score) INTO avg_sleep
    FROM sleep_logs
    WHERE user_id = p_user
      AND date >= CURRENT_DATE - INTERVAL '14 days';
    
    -- Get average mood (last 14 days)
    SELECT AVG(mood_value) INTO avg_mood
    FROM moods
    WHERE user_id = p_user
      AND created_at >= CURRENT_DATE - INTERVAL '14 days';
    
    -- Get sleep trend (comparing last 7 days to previous 7 days)
    SELECT 
        AVG(CASE WHEN date >= CURRENT_DATE - INTERVAL '7 days' THEN sleep_quality_score END) -
        AVG(CASE WHEN date >= CURRENT_DATE - INTERVAL '14 days' AND date < CURRENT_DATE - INTERVAL '7 days' THEN sleep_quality_score END)
    INTO sleep_trend
    FROM sleep_logs
    WHERE user_id = p_user
      AND date >= CURRENT_DATE - INTERVAL '14 days';
    
    -- Generate insights based on patterns
    IF avg_sleep < 60 THEN
        insight := 'Your sleep quality has been low. Try reducing late screen time and establishing a consistent bedtime.';
        insight_type := 'warning';
        confidence := 0.85;
    ELSIF avg_sleep > 80 THEN
        insight := 'Great sleep consistency! Keep doing what you''re doing.';
        insight_type := 'pattern';
        confidence := 0.9;
    ELSIF sleep_trend < -10 THEN
        insight := 'Your sleep quality dropped 14% this week. Consider reviewing your bedtime routine.';
        insight_type := 'warning';
        confidence := 0.8;
    ELSIF avg_mood IS NOT NULL AND avg_sleep IS NOT NULL AND avg_mood < 2.5 AND avg_sleep < 65 THEN
        insight := 'Your mood is consistently low after poor sleep. Aim for 7-9 hours nightly.';
        insight_type := 'correlation';
        confidence := 0.75;
    ELSE
        insight := 'Your sleep patterns look good. Maintain consistency for optimal recovery.';
        insight_type := 'pattern';
        confidence := 0.7;
    END IF;
    
    INSERT INTO sleep_insights (user_id, insight_type, message, confidence)
    VALUES (p_user, insight_type, insight, confidence)
    RETURNING id INTO insight_id;
    
    RETURN insight_id;
END;
$$;

-- Z-RPC6 — get_sleep_insights(user_id, days, type_filter)
-- Gets sleep insights for a user
CREATE OR REPLACE FUNCTION get_sleep_insights(
    p_user uuid,
    p_days int DEFAULT 30,
    p_type_filter text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'date', date,
            'insight_type', insight_type,
            'message', message,
            'confidence', confidence,
            'metadata', metadata,
            'created_at', created_at
        )
        ORDER BY created_at DESC
    )
    FROM sleep_insights
    WHERE user_id = p_user
      AND date >= CURRENT_DATE - (p_days || ' days')::interval
      AND (p_type_filter IS NULL OR insight_type = p_type_filter);
$$;

-- Z-RPC7 — create_sleep_recommendation(user_id, recommendation, recommended_time, category, priority, is_premium, action_url)
-- Creates a sleep recommendation
CREATE OR REPLACE FUNCTION create_sleep_recommendation(
    p_user uuid,
    p_recommendation text,
    p_recommended_time timestamptz DEFAULT NULL,
    p_category text DEFAULT 'behavior',
    p_priority int DEFAULT 5,
    p_is_premium boolean DEFAULT false,
    p_action_url text DEFAULT NULL,
    p_expires_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec_id uuid;
    is_premium_user boolean;
BEGIN
    -- Check if user is premium (premium recommendations require premium)
    IF p_is_premium THEN
        SELECT COALESCE(is_premium, false) INTO is_premium_user
        FROM user_subscriptions
        WHERE user_id = p_user;
        
        IF NOT is_premium_user THEN
            RAISE EXCEPTION 'Premium sleep recommendations require premium subscription.';
        END IF;
    END IF;
    
    INSERT INTO sleep_recommendations (
        user_id, recommendation, recommended_time,
        category, priority, is_premium, action_url, expires_at
    )
    VALUES (
        p_user, p_recommendation, p_recommended_time,
        p_category, p_priority, p_is_premium, p_action_url, p_expires_at
    )
    RETURNING id INTO rec_id;
    
    RETURN rec_id;
END;
$$;

-- Z-RPC8 — get_sleep_recommendations(user_id, category_filter)
-- Gets sleep recommendations for a user
CREATE OR REPLACE FUNCTION get_sleep_recommendations(
    p_user uuid,
    p_category_filter text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'recommendation', recommendation,
            'recommended_time', recommended_time,
            'category', category,
            'priority', priority,
            'is_premium', is_premium,
            'action_url', action_url,
            'created_at', created_at,
            'expires_at', expires_at
        )
        ORDER BY priority DESC, created_at DESC
    )
    FROM sleep_recommendations
    WHERE user_id = p_user
      AND (p_category_filter IS NULL OR category = p_category_filter)
      AND (expires_at IS NULL OR expires_at > timezone('utc', now()));
$$;

-- Z-RPC9 — get_recovery_history(user_id, days)
-- Gets recovery history for a user
CREATE OR REPLACE FUNCTION get_recovery_history(
    p_user uuid,
    p_days int DEFAULT 30
)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', date,
            'sleep_score', sleep_score,
            'workout_intensity', workout_intensity,
            'stress_level', stress_level,
            'hydration_score', hydration_score,
            'mood_score', mood_score,
            'nutrition_score', nutrition_score,
            'total_recovery_score', total_recovery_score
        )
        ORDER BY date DESC
    )
    FROM recovery_logs
    WHERE user_id = p_user
      AND date >= CURRENT_DATE - (p_days || ' days')::interval;
$$;

-- Z-RPC10 — get_sleep_summary(user_id, days)
-- Gets sleep summary statistics
CREATE OR REPLACE FUNCTION get_sleep_summary(
    p_user uuid,
    p_days int DEFAULT 30
)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_build_object(
        'avg_duration_minutes', AVG(duration_minutes),
        'avg_sleep_score', AVG(sleep_quality_score),
        'avg_latency', AVG(sleep_latency_minutes),
        'avg_waso', AVG(wake_after_sleep_onset),
        'avg_interruptions', AVG(interruptions),
        'total_nights', COUNT(*),
        'nights_7plus_hours', COUNT(*) FILTER (WHERE duration_minutes >= 420),
        'nights_optimal', COUNT(*) FILTER (WHERE duration_minutes >= 420 AND duration_minutes <= 540),
        'best_sleep_score', MAX(sleep_quality_score),
        'worst_sleep_score', MIN(sleep_quality_score)
    )
    FROM sleep_logs
    WHERE user_id = p_user
      AND date >= CURRENT_DATE - (p_days || ' days')::interval;
$$;

-- 6. TRIGGERS ---------------------------------------------

-- Auto-update updated_at on sleep_logs
CREATE OR REPLACE FUNCTION update_sleep_logs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_sleep_logs_timestamp'
    ) THEN
        CREATE TRIGGER update_sleep_logs_timestamp
        BEFORE UPDATE ON sleep_logs
        FOR EACH ROW
        EXECUTE FUNCTION update_sleep_logs_timestamp();
    END IF;
END $$;

