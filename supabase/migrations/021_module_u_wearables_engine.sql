-- =========================================================
-- MODULE U — WEARABLES ENGINE (Apple Health + Google Fit + Smartwatches)
-- Real fitness OS: biometrics, steps, heart rate, sleep, calories, HRV, workouts
-- =========================================================

-- 1. TABLES -----------------------------------------------

-- U1 — wearable_connections
-- Tracks whether user connected Apple/Google and stores tokens (Google only)
CREATE TABLE IF NOT EXISTS wearable_connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider text NOT NULL,  -- 'apple', 'google', 'fitbit', 'garmin', 'whoop', 'oura'
    access_token text,       -- google only (encrypted in production)
    refresh_token text,      -- google only (encrypted in production)
    expires_at timestamptz,  -- google only
    connected boolean DEFAULT false,
    permissions jsonb DEFAULT '{}'::jsonb,  -- {"steps": true, "heart_rate": true, "sleep": true, "workouts": true}
    last_sync timestamptz,
    sync_frequency text DEFAULT 'manual',  -- manual, every_15min, hourly, daily
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, provider)
);

-- U2 — wearable_sync_logs
-- Store every sync event (for debug + analytics)
CREATE TABLE IF NOT EXISTS wearable_sync_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider text NOT NULL,
    data_type text NOT NULL,       -- steps, heart_rate, hrv, sleep, workouts, calories, weight
    status text NOT NULL,          -- success, error, partial
    error_message text,
    synced_records int DEFAULT 0,
    sync_duration_ms int,          -- How long the sync took
    metadata jsonb DEFAULT '{}'::jsonb,  -- Additional sync details
    timestamp timestamptz DEFAULT timezone('utc', now())
);

-- U3 — wearable_steps
-- Steps data from wearables (can merge with steps_tracking from Module D)
CREATE TABLE IF NOT EXISTS wearable_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    steps int NOT NULL,
    source text NOT NULL,  -- apple, google, fitbit, garmin, etc.
    synced_at timestamptz DEFAULT timezone('utc', now()),
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, date, source)
);

-- U4 — wearable_heart_data
-- Heart rate and HRV data from wearables
CREATE TABLE IF NOT EXISTS wearable_heart_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timestamp timestamptz NOT NULL,
    bpm int,              -- Heart rate (beats per minute)
    hrv_ms int,           -- Heart rate variability (milliseconds)
    stress_level int,     -- 1-5 (from Pixel/Samsung)
    source text NOT NULL, -- apple, google, fitbit, garmin, whoop, oura
    synced_at timestamptz DEFAULT timezone('utc', now()),
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- U5 — wearable_sleep_data
-- Sleep data from wearables (can enhance sleep_logs from Module C/Z)
CREATE TABLE IF NOT EXISTS wearable_sleep_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    bedtime timestamptz,
    wake_time timestamptz,
    duration_minutes int,
    sleep_stages jsonb DEFAULT '{}'::jsonb,  -- {"deep": 120, "rem": 90, "light": 180, "awake": 30}
    source text NOT NULL, -- apple, google, fitbit, garmin, whoop, oura
    synced_at timestamptz DEFAULT timezone('utc', now()),
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, date, source)
);

-- U6 — wearable_workouts
-- Workout data from wearables (can merge with workout_logs from Module M)
CREATE TABLE IF NOT EXISTS wearable_workouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time timestamptz NOT NULL,
    end_time timestamptz,
    type text NOT NULL,            -- running, cycling, gym, walking, swimming, yoga, etc.
    calories int,
    distance_km numeric,
    avg_heart_rate int,
    max_heart_rate int,
    elevation_gain numeric,
    pace_per_km numeric,           -- minutes per kilometer
    source text NOT NULL,          -- apple, google, fitbit, garmin, etc.
    external_id text,              -- ID from the wearable platform
    synced_at timestamptz DEFAULT timezone('utc', now()),
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, external_id, source)
);

-- U7 — wearable_weight
-- Weight data from wearables/scales
CREATE TABLE IF NOT EXISTS wearable_weight (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timestamp timestamptz NOT NULL,
    weight_kg numeric NOT NULL,
    body_fat_percentage numeric,
    muscle_mass_kg numeric,
    source text NOT NULL, -- apple, google, fitbit, garmin, withings, etc.
    synced_at timestamptz DEFAULT timezone('utc', now()),
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- 2. INDEXES ----------------------------------------------

CREATE INDEX IF NOT EXISTS idx_wearable_connections_user ON wearable_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_connections_provider ON wearable_connections(provider);
CREATE INDEX IF NOT EXISTS idx_wearable_sync_logs_user ON wearable_sync_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_wearable_sync_logs_provider ON wearable_sync_logs(provider, status);
CREATE INDEX IF NOT EXISTS idx_wearable_steps_user_date ON wearable_steps(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_wearable_steps_source ON wearable_steps(source);
CREATE INDEX IF NOT EXISTS idx_wearable_heart_data_user_timestamp ON wearable_heart_data(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_wearable_heart_data_source ON wearable_heart_data(source);
CREATE INDEX IF NOT EXISTS idx_wearable_sleep_data_user_date ON wearable_sleep_data(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_wearable_sleep_data_source ON wearable_sleep_data(source);
CREATE INDEX IF NOT EXISTS idx_wearable_workouts_user_start ON wearable_workouts(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_wearable_workouts_source ON wearable_workouts(source);
CREATE INDEX IF NOT EXISTS idx_wearable_weight_user_timestamp ON wearable_weight(user_id, timestamp DESC);

-- 3. RLS (Row-Level Security) ----------------------------

ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_heart_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_sleep_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_weight ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "users_manage_own_wearable_connections"
ON wearable_connections
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_sync_logs"
ON wearable_sync_logs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_wearable_steps"
ON wearable_steps
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_wearable_heart_data"
ON wearable_heart_data
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_wearable_sleep_data"
ON wearable_sleep_data
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_wearable_workouts"
ON wearable_workouts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_wearable_weight"
ON wearable_weight
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. RPC FUNCTIONS ---------------------------------------

-- U-RPC1 — connect_wearable(user_id, provider, access_token, refresh_token, expires_at, permissions)
-- Connects a wearable provider
CREATE OR REPLACE FUNCTION connect_wearable(
    p_user uuid,
    p_provider text,
    p_access_token text DEFAULT NULL,
    p_refresh_token text DEFAULT NULL,
    p_expires_at timestamptz DEFAULT NULL,
    p_permissions jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    connection_id uuid;
    is_premium boolean;
BEGIN
    -- Check if user is premium (wearable sync is premium-only)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    IF NOT is_premium THEN
        RAISE EXCEPTION 'Wearable integrations require premium subscription.';
    END IF;
    
    INSERT INTO wearable_connections (
        user_id, provider, access_token, refresh_token,
        expires_at, connected, permissions, last_sync
    )
    VALUES (
        p_user, p_provider, p_access_token, p_refresh_token,
        p_expires_at, true, p_permissions, timezone('utc', now())
    )
    ON CONFLICT (user_id, provider) DO UPDATE
    SET
        access_token = COALESCE(EXCLUDED.access_token, wearable_connections.access_token),
        refresh_token = COALESCE(EXCLUDED.refresh_token, wearable_connections.refresh_token),
        expires_at = COALESCE(EXCLUDED.expires_at, wearable_connections.expires_at),
        connected = true,
        permissions = COALESCE(EXCLUDED.permissions, wearable_connections.permissions),
        last_sync = timezone('utc', now()),
        updated_at = timezone('utc', now())
    RETURNING id INTO connection_id;
    
    RETURN connection_id;
END;
$$;

-- U-RPC2 — disconnect_wearable(user_id, provider)
-- Disconnects a wearable provider
CREATE OR REPLACE FUNCTION disconnect_wearable(
    p_user uuid,
    p_provider text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE wearable_connections
    SET
        connected = false,
        access_token = NULL,
        refresh_token = NULL,
        expires_at = NULL,
        updated_at = timezone('utc', now())
    WHERE user_id = p_user AND provider = p_provider;
END;
$$;

-- U-RPC3 — log_sync_event(user_id, provider, data_type, status, synced_records, error_message, sync_duration_ms, metadata)
-- Logs a sync event
CREATE OR REPLACE FUNCTION log_sync_event(
    p_user uuid,
    p_provider text,
    p_data_type text,
    p_status text,
    p_synced_records int DEFAULT 0,
    p_error_message text DEFAULT NULL,
    p_sync_duration_ms int DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    log_id uuid;
BEGIN
    INSERT INTO wearable_sync_logs (
        user_id, provider, data_type, status,
        error_message, synced_records, sync_duration_ms, metadata
    )
    VALUES (
        p_user, p_provider, p_data_type, p_status,
        p_error_message, p_synced_records, p_sync_duration_ms, p_metadata
    )
    RETURNING id INTO log_id;
    
    -- Update last_sync in wearable_connections
    UPDATE wearable_connections
    SET last_sync = timezone('utc', now())
    WHERE user_id = p_user AND provider = p_provider;
    
    RETURN log_id;
END;
$$;

-- U-RPC4 — save_wearable_steps(user_id, date, steps, source)
-- Saves steps from wearable (can merge with steps_tracking from Module D)
CREATE OR REPLACE FUNCTION save_wearable_steps(
    p_user uuid,
    p_date date,
    p_steps int,
    p_source text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    step_id uuid;
    is_premium boolean;
BEGIN
    -- Check if user is premium (wearable sync is premium-only)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    IF NOT is_premium THEN
        RAISE EXCEPTION 'Wearable steps sync requires premium subscription.';
    END IF;
    
    INSERT INTO wearable_steps (user_id, date, steps, source)
    VALUES (p_user, p_date, p_steps, p_source)
    ON CONFLICT (user_id, date, source) DO UPDATE
    SET steps = EXCLUDED.steps,
        synced_at = timezone('utc', now())
    RETURNING id INTO step_id;
    
    -- Optionally merge into steps_tracking (Module D)
    -- This allows wearable steps to appear in the main steps table
    INSERT INTO steps_tracking (user_id, date, steps, source)
    VALUES (p_user, p_date, p_steps, p_source)
    ON CONFLICT (user_id, date) DO UPDATE
    SET steps = GREATEST(steps_tracking.steps, EXCLUDED.steps),
        source = CASE 
            WHEN EXCLUDED.steps > steps_tracking.steps THEN EXCLUDED.source
            ELSE steps_tracking.source
        END;
    
    RETURN step_id;
END;
$$;

-- U-RPC5 — save_wearable_heart_data(user_id, timestamp, bpm, hrv_ms, stress_level, source)
-- Saves heart rate and HRV data
CREATE OR REPLACE FUNCTION save_wearable_heart_data(
    p_user uuid,
    p_timestamp timestamptz,
    p_bpm int DEFAULT NULL,
    p_hrv_ms int DEFAULT NULL,
    p_stress_level int DEFAULT NULL,
    p_source text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    heart_id uuid;
    is_premium boolean;
BEGIN
    -- Check if user is premium (heart rate data is premium-only)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    IF NOT is_premium THEN
        RAISE EXCEPTION 'Wearable heart rate data requires premium subscription.';
    END IF;
    
    INSERT INTO wearable_heart_data (
        user_id, timestamp, bpm, hrv_ms, stress_level, source
    )
    VALUES (
        p_user, p_timestamp, p_bpm, p_hrv_ms, p_stress_level, p_source
    )
    RETURNING id INTO heart_id;
    
    RETURN heart_id;
END;
$$;

-- U-RPC6 — save_wearable_sleep(user_id, date, bedtime, wake_time, duration_minutes, sleep_stages, source)
-- Saves sleep data from wearable (can enhance sleep_logs from Module C/Z)
CREATE OR REPLACE FUNCTION save_wearable_sleep(
    p_user uuid,
    p_date date,
    p_bedtime timestamptz DEFAULT NULL,
    p_wake_time timestamptz DEFAULT NULL,
    p_duration_minutes int DEFAULT NULL,
    p_sleep_stages jsonb DEFAULT '{}'::jsonb,
    p_source text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sleep_id uuid;
    is_premium boolean;
BEGIN
    -- Check if user is premium (wearable sleep is premium-only)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    IF NOT is_premium THEN
        RAISE EXCEPTION 'Wearable sleep data requires premium subscription.';
    END IF;
    
    -- Calculate duration if not provided
    IF p_duration_minutes IS NULL AND p_bedtime IS NOT NULL AND p_wake_time IS NOT NULL THEN
        p_duration_minutes := EXTRACT(EPOCH FROM (p_wake_time - p_bedtime)) / 60;
    END IF;
    
    INSERT INTO wearable_sleep_data (
        user_id, date, bedtime, wake_time, duration_minutes, sleep_stages, source
    )
    VALUES (
        p_user, p_date, p_bedtime, p_wake_time, p_duration_minutes, p_sleep_stages, p_source
    )
    ON CONFLICT (user_id, date, source) DO UPDATE
    SET
        bedtime = EXCLUDED.bedtime,
        wake_time = EXCLUDED.wake_time,
        duration_minutes = EXCLUDED.duration_minutes,
        sleep_stages = EXCLUDED.sleep_stages,
        synced_at = timezone('utc', now())
    RETURNING id INTO sleep_id;
    
    -- Optionally enhance sleep_logs (Module C/Z) with wearable data
    -- This allows wearable sleep to appear in the main sleep table
    -- Only if no manual entry exists for this date
    IF p_duration_minutes IS NOT NULL THEN
        -- Check if manual entry exists
        IF NOT EXISTS (
            SELECT 1 FROM sleep_logs
            WHERE user_id = p_user AND date = p_date
        ) THEN
            INSERT INTO sleep_logs (
                user_id, date, bedtime, wake_time, duration_minutes,
                hours, sleep_start, sleep_end
            )
            VALUES (
                p_user, p_date, p_bedtime, p_wake_time, p_duration_minutes,
                (p_duration_minutes / 60.0)::numeric, p_bedtime, p_wake_time
            );
        END IF;
    END IF;
    
    RETURN sleep_id;
END;
$$;

-- U-RPC7 — save_wearable_workout(user_id, start_time, end_time, type, calories, distance_km, avg_heart_rate, max_heart_rate, elevation_gain, pace_per_km, source, external_id)
-- Saves workout from wearable (can merge with workout_logs from Module M)
CREATE OR REPLACE FUNCTION save_wearable_workout(
    p_user uuid,
    p_start_time timestamptz,
    p_end_time timestamptz DEFAULT NULL,
    p_type text,
    p_calories int DEFAULT NULL,
    p_distance_km numeric DEFAULT NULL,
    p_avg_heart_rate int DEFAULT NULL,
    p_max_heart_rate int DEFAULT NULL,
    p_elevation_gain numeric DEFAULT NULL,
    p_pace_per_km numeric DEFAULT NULL,
    p_source text,
    p_external_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    workout_id uuid;
    is_premium boolean;
BEGIN
    -- Check if user is premium (workout auto-import is premium-only)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    IF NOT is_premium THEN
        RAISE EXCEPTION 'Wearable workout auto-import requires premium subscription.';
    END IF;
    
    INSERT INTO wearable_workouts (
        user_id, start_time, end_time, type, calories, distance_km,
        avg_heart_rate, max_heart_rate, elevation_gain, pace_per_km,
        source, external_id
    )
    VALUES (
        p_user, p_start_time, p_end_time, p_type, p_calories, p_distance_km,
        p_avg_heart_rate, p_max_heart_rate, p_elevation_gain, p_pace_per_km,
        p_source, p_external_id
    )
    ON CONFLICT (user_id, external_id, source) DO UPDATE
    SET
        end_time = EXCLUDED.end_time,
        type = EXCLUDED.type,
        calories = EXCLUDED.calories,
        distance_km = EXCLUDED.distance_km,
        avg_heart_rate = EXCLUDED.avg_heart_rate,
        max_heart_rate = EXCLUDED.max_heart_rate,
        elevation_gain = EXCLUDED.elevation_gain,
        pace_per_km = EXCLUDED.pace_per_km,
        synced_at = timezone('utc', now())
    RETURNING id INTO workout_id;
    
    -- Optionally create workout_log entry (Module M)
    -- This allows wearable workouts to appear in the main workout logs
    -- Only if no similar workout exists (within 5 minutes of start time)
    IF p_end_time IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM workout_logs
            WHERE user_id = p_user
              AND ABS(EXTRACT(EPOCH FROM (completed_at - p_start_time))) < 300  -- 5 minutes
        ) THEN
            INSERT INTO workout_logs (
                user_id, completed_at, duration_minutes, calories_burned, notes
            )
            VALUES (
                p_user, p_start_time,
                EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 60,
                p_calories,
                'Imported from ' || p_source || ' - ' || p_type
            );
        END IF;
    END IF;
    
    RETURN workout_id;
END;
$$;

-- U-RPC8 — save_wearable_weight(user_id, timestamp, weight_kg, body_fat_percentage, muscle_mass_kg, source)
-- Saves weight data from wearable/scales
CREATE OR REPLACE FUNCTION save_wearable_weight(
    p_user uuid,
    p_timestamp timestamptz,
    p_weight_kg numeric,
    p_body_fat_percentage numeric DEFAULT NULL,
    p_muscle_mass_kg numeric DEFAULT NULL,
    p_source text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    weight_id uuid;
    is_premium boolean;
BEGIN
    -- Check if user is premium (weight sync is premium-only)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    IF NOT is_premium THEN
        RAISE EXCEPTION 'Wearable weight sync requires premium subscription.';
    END IF;
    
    INSERT INTO wearable_weight (
        user_id, timestamp, weight_kg, body_fat_percentage, muscle_mass_kg, source
    )
    VALUES (
        p_user, p_timestamp, p_weight_kg, p_body_fat_percentage, p_muscle_mass_kg, p_source
    )
    RETURNING id INTO weight_id;
    
    RETURN weight_id;
END;
$$;

-- U-RPC9 — get_wearable_connections(user_id)
-- Gets all wearable connections for a user
CREATE OR REPLACE FUNCTION get_wearable_connections(p_user uuid)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'provider', provider,
            'connected', connected,
            'permissions', permissions,
            'last_sync', last_sync,
            'sync_frequency', sync_frequency,
            'created_at', created_at
        )
    )
    FROM wearable_connections
    WHERE user_id = p_user;
$$;

-- U-RPC10 — get_wearable_sync_status(user_id, provider)
-- Gets sync status and recent logs
CREATE OR REPLACE FUNCTION get_wearable_sync_status(
    p_user uuid,
    p_provider text
)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_build_object(
        'connection', (
            SELECT jsonb_build_object(
                'connected', connected,
                'last_sync', last_sync,
                'sync_frequency', sync_frequency,
                'permissions', permissions
            )
            FROM wearable_connections
            WHERE user_id = p_user AND provider = p_provider
        ),
        'recent_syncs', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'data_type', data_type,
                    'status', status,
                    'synced_records', synced_records,
                    'timestamp', timestamp,
                    'error_message', error_message
                )
                ORDER BY timestamp DESC
            )
            FROM wearable_sync_logs
            WHERE user_id = p_user AND provider = p_provider
            LIMIT 10
        )
    );
$$;

-- U-RPC11 — get_wearable_data_summary(user_id, days)
-- Gets summary of wearable data
CREATE OR REPLACE FUNCTION get_wearable_data_summary(
    p_user uuid,
    p_days int DEFAULT 30
)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_build_object(
        'steps', (
            SELECT jsonb_build_object(
                'total_days', COUNT(DISTINCT date),
                'avg_steps', AVG(steps),
                'max_steps', MAX(steps),
                'sources', jsonb_agg(DISTINCT source)
            )
            FROM wearable_steps
            WHERE user_id = p_user
              AND date >= CURRENT_DATE - (p_days || ' days')::interval
        ),
        'heart_data', (
            SELECT jsonb_build_object(
                'total_readings', COUNT(*),
                'avg_bpm', AVG(bpm),
                'avg_hrv', AVG(hrv_ms),
                'sources', jsonb_agg(DISTINCT source)
            )
            FROM wearable_heart_data
            WHERE user_id = p_user
              AND timestamp >= CURRENT_DATE - (p_days || ' days')::interval
        ),
        'sleep', (
            SELECT jsonb_build_object(
                'total_nights', COUNT(DISTINCT date),
                'avg_duration', AVG(duration_minutes),
                'sources', jsonb_agg(DISTINCT source)
            )
            FROM wearable_sleep_data
            WHERE user_id = p_user
              AND date >= CURRENT_DATE - (p_days || ' days')::interval
        ),
        'workouts', (
            SELECT jsonb_build_object(
                'total_workouts', COUNT(*),
                'total_calories', SUM(calories),
                'total_distance', SUM(distance_km),
                'sources', jsonb_agg(DISTINCT source)
            )
            FROM wearable_workouts
            WHERE user_id = p_user
              AND start_time >= CURRENT_DATE - (p_days || ' days')::interval
        )
    );
$$;

-- U-RPC12 — merge_wearable_steps_to_main(user_id, date)
-- Merges wearable steps into main steps_tracking table (Module D)
CREATE OR REPLACE FUNCTION merge_wearable_steps_to_main(
    p_user uuid,
    p_date date DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Merge wearable steps into steps_tracking
    INSERT INTO steps_tracking (user_id, date, steps, source)
    SELECT user_id, date, MAX(steps), 'wearable'
    FROM wearable_steps
    WHERE user_id = p_user AND date = p_date
    GROUP BY user_id, date
    ON CONFLICT (user_id, date) DO UPDATE
    SET steps = GREATEST(steps_tracking.steps, EXCLUDED.steps),
        source = CASE 
            WHEN EXCLUDED.steps > steps_tracking.steps THEN 'wearable'
            ELSE steps_tracking.source
        END;
END;
$$;

-- 5. TRIGGERS ---------------------------------------------

-- Auto-update updated_at on wearable_connections
CREATE OR REPLACE FUNCTION update_wearable_connections_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wearable_connections_timestamp
BEFORE UPDATE ON wearable_connections
FOR EACH ROW
EXECUTE FUNCTION update_wearable_connections_timestamp();

