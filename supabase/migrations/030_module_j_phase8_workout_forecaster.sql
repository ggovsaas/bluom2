-- =========================================================
-- MODULE J PHASE 8 — WORKOUT INTENSITY FORECASTER (AI AUTO-REGRESSION ENGINE)
-- Predicts tomorrow's optimal workout difficulty using 30-day patterns
-- =========================================================

-- 1. TRAINING HISTORY DAILY TABLE ---------------------------------
-- Tracks daily workout metrics for pattern analysis
CREATE TABLE IF NOT EXISTS training_history_daily (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL DEFAULT CURRENT_DATE,
    total_volume int DEFAULT 0,           -- sets * reps * weight (kg)
    total_sets int DEFAULT 0,
    total_reps int DEFAULT 0,
    rpe_avg numeric DEFAULT 6,            -- Rate of Perceived Exertion (1-10)
    workout_load int DEFAULT 0,           -- normalized 0–100
    sleep_hours numeric DEFAULT 0,
    recovery_score int DEFAULT 50,
    readiness_score int DEFAULT 50,
    soreness_level int DEFAULT 3 CHECK (soreness_level BETWEEN 1 AND 5),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, date)
);

-- 2. WORKOUT FORECAST TABLE ---------------------------------------
-- Stores predictions for tomorrow's workout
CREATE TABLE IF NOT EXISTS workout_forecast (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_date date NOT NULL,
    predicted_load int CHECK (predicted_load BETWEEN 0 AND 100),
    predicted_sets int,
    predicted_reps int,
    predicted_volume int,
    predicted_intensity text,              -- low, moderate, high, very_high
    deload boolean DEFAULT false,
    rest_day boolean DEFAULT false,
    recommended_workout_type text,         -- strength, hypertrophy, cardio, recovery, mobility
    exercise_swaps jsonb,                  -- Suggested exercise substitutions
    volume_adjustment_percent int,         -- -50 to +50
    tempo_adjustment text,                 -- normal, slow, explosive
    rpe_adjustment numeric,                -- Target RPE
    reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, target_date)
);

-- 3. INDEXES ----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_training_history_user_date ON training_history_daily(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_forecast_user_date ON workout_forecast(user_id, target_date DESC);

-- 4. RLS POLICIES ----------------------------------------------
ALTER TABLE training_history_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_forecast ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own training history" ON training_history_daily
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own forecasts" ON workout_forecast
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. TRIGGERS ---------------------------------------------------
CREATE TRIGGER update_training_history_updated_at
    BEFORE UPDATE ON training_history_daily
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_forecast_updated_at
    BEFORE UPDATE ON workout_forecast
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. RPC FUNCTIONS ---------------------------------------------

-- 6.1 Update training history after workout log
CREATE OR REPLACE FUNCTION update_training_history(
    p_user_id uuid
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_volume int := 0;
    v_total_sets int := 0;
    v_total_reps int := 0;
    v_rpe_sum numeric := 0;
    v_rpe_count int := 0;
    v_workout_load int := 0;
    v_recovery int;
    v_readiness int;
    v_sleep numeric;
    v_soreness int;
BEGIN
    -- Calculate today's workout metrics from workout_sets
    SELECT 
        COALESCE(SUM((weight::numeric * reps::numeric)), 0)::int,
        COALESCE(SUM(sets), 0),
        COALESCE(SUM(reps), 0),
        COALESCE(SUM(rpe), 0),
        COUNT(*)
    INTO v_total_volume, v_total_sets, v_total_reps, v_rpe_sum, v_rpe_count
    FROM workout_sets
    WHERE user_id = p_user_id
    AND DATE(created_at) = CURRENT_DATE;
    
    -- Calculate average RPE
    DECLARE
        v_rpe_avg numeric;
    BEGIN
        IF v_rpe_count > 0 THEN
            v_rpe_avg := v_rpe_sum / v_rpe_count;
        ELSE
            v_rpe_avg := 6;
        END IF;
        
        -- Normalize workout load (0-100)
        -- Formula: (volume / 1000) * (RPE / 10) * 10, capped at 100
        v_workout_load := LEAST(100, GREATEST(0, 
            (v_total_volume::numeric / 1000.0 * v_rpe_avg / 10.0 * 10.0)::int
        ));
    END;
    
    -- Get recovery metrics from realtime_user_state
    SELECT 
        recovery_score,
        readiness_score,
        sleep_hours,
        3 -- Default soreness (can be updated separately)
    INTO v_recovery, v_readiness, v_sleep, v_soreness
    FROM realtime_user_state
    WHERE user_id = p_user_id
    AND date = CURRENT_DATE;
    
    -- Upsert training history
    INSERT INTO training_history_daily (
        user_id,
        date,
        total_volume,
        total_sets,
        total_reps,
        rpe_avg,
        workout_load,
        sleep_hours,
        recovery_score,
        readiness_score,
        soreness_level
    ) VALUES (
        p_user_id,
        CURRENT_DATE,
        v_total_volume,
        v_total_sets,
        v_total_reps,
        COALESCE(v_rpe_avg, 6),
        v_workout_load,
        COALESCE(v_sleep, 0),
        COALESCE(v_recovery, 50),
        COALESCE(v_readiness, 50),
        COALESCE(v_soreness, 3)
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
        total_volume = EXCLUDED.total_volume,
        total_sets = EXCLUDED.total_sets,
        total_reps = EXCLUDED.total_reps,
        rpe_avg = EXCLUDED.rpe_avg,
        workout_load = EXCLUDED.workout_load,
        sleep_hours = EXCLUDED.sleep_hours,
        recovery_score = EXCLUDED.recovery_score,
        readiness_score = EXCLUDED.readiness_score,
        soreness_level = EXCLUDED.soreness_level,
        updated_at = now();
END;
$$;

-- 6.2 Generate tomorrow's workout forecast
CREATE OR REPLACE FUNCTION generate_tomorrow_forecast(
    p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_last3_workload numeric := 0;
    v_last7_avg numeric := 0;
    v_last30_avg numeric := 0;
    v_recovery int := 50;
    v_readiness int := 50;
    v_sleep_avg numeric := 7.5;
    v_soreness int := 3;
    v_predicted_load int := 50;
    v_deload_mode boolean := false;
    v_rest_day boolean := false;
    v_reason text := '';
    v_intensity text;
    v_workout_type text;
    v_volume_adj int := 0;
    v_forecast_id uuid;
    v_user_goal text;
BEGIN
    -- Get user's goal
    SELECT primary_goal INTO v_user_goal
    FROM personalized_goals
    WHERE user_id = p_user_id;
    
    -- Aggregate last 3 days workload
    SELECT COALESCE(SUM(workout_load), 0) INTO v_last3_workload
    FROM training_history_daily
    WHERE user_id = p_user_id
    AND date >= CURRENT_DATE - INTERVAL '3 days'
    AND date < CURRENT_DATE;
    
    -- Aggregate last 7 days average
    SELECT COALESCE(AVG(workout_load), 0) INTO v_last7_avg
    FROM training_history_daily
    WHERE user_id = p_user_id
    AND date >= CURRENT_DATE - INTERVAL '7 days'
    AND date < CURRENT_DATE;
    
    -- Aggregate last 30 days average
    SELECT COALESCE(AVG(workout_load), 0) INTO v_last30_avg
    FROM training_history_daily
    WHERE user_id = p_user_id
    AND date >= CURRENT_DATE - INTERVAL '30 days'
    AND date < CURRENT_DATE;
    
    -- Get latest recovery metrics
    SELECT 
        recovery_score,
        readiness_score,
        sleep_hours,
        soreness_level
    INTO v_recovery, v_readiness, v_sleep_avg, v_soreness
    FROM training_history_daily
    WHERE user_id = p_user_id
    ORDER BY date DESC
    LIMIT 1;
    
    -- Default values if not found
    v_recovery := COALESCE(v_recovery, 50);
    v_readiness := COALESCE(v_readiness, 50);
    v_sleep_avg := COALESCE(v_sleep_avg, 7.5);
    v_soreness := COALESCE(v_soreness, 3);
    
    -- Auto-regression logic
    -- Base prediction: 40% last 7 days avg + 30% readiness + 30% recovery
    v_predicted_load := ROUND(
        (v_last7_avg * 0.4) +
        (v_readiness * 0.3) +
        (v_recovery * 0.3)
    );
    
    -- Adjustments based on conditions
    IF v_soreness >= 4 THEN
        v_predicted_load := v_predicted_load - 20;
        v_reason := v_reason || 'High soreness detected. ';
    END IF;
    
    IF v_sleep_avg < 6 THEN
        v_predicted_load := v_predicted_load - 15;
        v_reason := v_reason || 'Low sleep detected. ';
    END IF;
    
    -- Deload trigger (every ~5 weeks of high volume)
    IF v_last30_avg > (v_last7_avg * 4.5) AND v_last7_avg > 60 THEN
        v_deload_mode := true;
        v_predicted_load := 30;
        v_reason := v_reason || 'Deload week triggered after high volume period. ';
    END IF;
    
    -- Rest day logic
    IF v_recovery < 40 OR v_readiness < 30 THEN
        v_rest_day := true;
        v_predicted_load := 0;
        v_reason := 'Low readiness/recovery - rest day recommended.';
        
        -- Insert rest day forecast
        INSERT INTO workout_forecast (
            user_id,
            target_date,
            predicted_load,
            predicted_sets,
            predicted_reps,
            predicted_volume,
            deload,
            rest_day,
            recommended_workout_type,
            reason
        ) VALUES (
            p_user_id,
            CURRENT_DATE + INTERVAL '1 day',
            0,
            0,
            0,
            0,
            false,
            true,
            'recovery',
            v_reason
        )
        ON CONFLICT (user_id, target_date) DO UPDATE SET
            predicted_load = EXCLUDED.predicted_load,
            rest_day = EXCLUDED.rest_day,
            reason = EXCLUDED.reason,
            updated_at = now()
        RETURNING id INTO v_forecast_id;
        
        RETURN jsonb_build_object(
            'forecast_id', v_forecast_id,
            'predicted_load', 0,
            'rest_day', true,
            'reason', v_reason,
            'recommended_workout_type', 'recovery'
        );
    END IF;
    
    -- Cap predicted load
    v_predicted_load := GREATEST(0, LEAST(100, v_predicted_load));
    
    -- Determine intensity
    IF v_predicted_load >= 80 THEN
        v_intensity := 'very_high';
        v_workout_type := 'strength';
        v_volume_adj := 10;
    ELSIF v_predicted_load >= 60 THEN
        v_intensity := 'high';
        v_workout_type := 'hypertrophy';
        v_volume_adj := 5;
    ELSIF v_predicted_load >= 40 THEN
        v_intensity := 'moderate';
        v_workout_type := CASE v_user_goal
            WHEN 'gain_muscle' THEN 'hypertrophy'
            WHEN 'lose_fat' THEN 'cardio'
            ELSE 'strength'
        END;
        v_volume_adj := 0;
    ELSIF v_predicted_load >= 20 THEN
        v_intensity := 'low';
        v_workout_type := 'recovery';
        v_volume_adj := -20;
    ELSE
        v_intensity := 'very_low';
        v_workout_type := 'mobility';
        v_volume_adj := -40;
    END IF;
    
    -- Build reason if empty
    IF v_reason = '' THEN
        v_reason := format('Forecast based on workload (7-day avg: %s) + readiness (%s) + recovery (%s)',
            ROUND(v_last7_avg), v_readiness, v_recovery);
    END IF;
    
    -- Save forecast
    INSERT INTO workout_forecast (
        user_id,
        target_date,
        predicted_load,
        predicted_sets,
        predicted_reps,
        predicted_volume,
        predicted_intensity,
        deload,
        rest_day,
        recommended_workout_type,
        volume_adjustment_percent,
        reason
    ) VALUES (
        p_user_id,
        CURRENT_DATE + INTERVAL '1 day',
        v_predicted_load,
        ROUND(v_predicted_load / 10),  -- Estimated sets
        ROUND(v_predicted_load / 5),  -- Estimated reps per set
        v_predicted_load * 50,         -- Estimated volume
        v_intensity,
        v_deload_mode,
        false,
        v_workout_type,
        v_volume_adj,
        v_reason
    )
    ON CONFLICT (user_id, target_date) DO UPDATE SET
        predicted_load = EXCLUDED.predicted_load,
        predicted_sets = EXCLUDED.predicted_sets,
        predicted_reps = EXCLUDED.predicted_reps,
        predicted_volume = EXCLUDED.predicted_volume,
        predicted_intensity = EXCLUDED.predicted_intensity,
        deload = EXCLUDED.deload,
        rest_day = EXCLUDED.rest_day,
        recommended_workout_type = EXCLUDED.recommended_workout_type,
        volume_adjustment_percent = EXCLUDED.volume_adjustment_percent,
        reason = EXCLUDED.reason,
        updated_at = now()
    RETURNING id INTO v_forecast_id;
    
    -- Return forecast
    RETURN jsonb_build_object(
        'forecast_id', v_forecast_id,
        'predicted_load', v_predicted_load,
        'predicted_intensity', v_intensity,
        'recommended_workout_type', v_workout_type,
        'deload', v_deload_mode,
        'rest_day', v_rest_day,
        'volume_adjustment_percent', v_volume_adj,
        'reason', v_reason
    );
END;
$$;

-- 6.3 Get tomorrow's forecast
CREATE OR REPLACE FUNCTION get_tomorrow_forecast(
    p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_forecast workout_forecast%ROWTYPE;
BEGIN
    SELECT * INTO v_forecast
    FROM workout_forecast
    WHERE user_id = p_user_id
    AND target_date = CURRENT_DATE + INTERVAL '1 day';
    
    IF NOT FOUND THEN
        -- Generate forecast if doesn't exist
        RETURN generate_tomorrow_forecast(p_user_id);
    END IF;
    
    RETURN jsonb_build_object(
        'forecast_id', v_forecast.id,
        'target_date', v_forecast.target_date,
        'predicted_load', v_forecast.predicted_load,
        'predicted_intensity', v_forecast.predicted_intensity,
        'recommended_workout_type', v_forecast.recommended_workout_type,
        'deload', v_forecast.deload,
        'rest_day', v_forecast.rest_day,
        'volume_adjustment_percent', v_forecast.volume_adjustment_percent,
        'exercise_swaps', v_forecast.exercise_swaps,
        'tempo_adjustment', v_forecast.tempo_adjustment,
        'rpe_adjustment', v_forecast.rpe_adjustment,
        'reason', v_forecast.reason,
        'created_at', v_forecast.created_at
    );
END;
$$;

-- 6.4 Get training history summary
CREATE OR REPLACE FUNCTION get_training_history_summary(
    p_user_id uuid,
    p_days int DEFAULT 30
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_summary jsonb;
BEGIN
    SELECT jsonb_build_object(
        'last_3_days_workload', (
            SELECT COALESCE(SUM(workout_load), 0)
            FROM training_history_daily
            WHERE user_id = p_user_id
            AND date >= CURRENT_DATE - INTERVAL '3 days'
        ),
        'last_7_days_avg', (
            SELECT COALESCE(AVG(workout_load), 0)
            FROM training_history_daily
            WHERE user_id = p_user_id
            AND date >= CURRENT_DATE - INTERVAL '7 days'
        ),
        'last_30_days_avg', (
            SELECT COALESCE(AVG(workout_load), 0)
            FROM training_history_daily
            WHERE user_id = p_user_id
            AND date >= CURRENT_DATE - INTERVAL '30 days'
        ),
        'total_workouts', (
            SELECT COUNT(*)
            FROM training_history_daily
            WHERE user_id = p_user_id
            AND date >= CURRENT_DATE - INTERVAL '30 days'
            AND workout_load > 0
        ),
        'avg_recovery', (
            SELECT COALESCE(AVG(recovery_score), 50)
            FROM training_history_daily
            WHERE user_id = p_user_id
            AND date >= CURRENT_DATE - INTERVAL '30 days'
        ),
        'avg_readiness', (
            SELECT COALESCE(AVG(readiness_score), 50)
            FROM training_history_daily
            WHERE user_id = p_user_id
            AND date >= CURRENT_DATE - INTERVAL '30 days'
        )
    ) INTO v_summary;
    
    RETURN v_summary;
END;
$$;

-- 6.5 Update soreness level
CREATE OR REPLACE FUNCTION update_soreness_level(
    p_user_id uuid,
    p_soreness int,
    p_date date DEFAULT CURRENT_DATE
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE training_history_daily
    SET soreness_level = p_soreness,
        updated_at = now()
    WHERE user_id = p_user_id
    AND date = p_date;
    
    -- If no record exists, create one
    IF NOT FOUND THEN
        INSERT INTO training_history_daily (
            user_id,
            date,
            soreness_level
        ) VALUES (
            p_user_id,
            p_date,
            p_soreness
        );
    END IF;
    
    -- Regenerate forecast if updating today's soreness
    IF p_date = CURRENT_DATE THEN
        PERFORM generate_tomorrow_forecast(p_user_id);
    END IF;
END;
$$;

-- =========================================================
-- MODULE J PHASE 8 — COMPLETE
-- =========================================================

