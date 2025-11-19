-- =========================================================
-- MODULE Y — WORKOUT AUTO-PROGRESSION ENGINE
-- Progressive overload, auto-adjustments, deload weeks, missed-workout recovery, movement substitutions
-- =========================================================

-- 1. TABLES -----------------------------------------------

-- Y1 — workout_progressions
-- Tracks latest performance per exercise
CREATE TABLE IF NOT EXISTS workout_progressions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    last_weight numeric,
    last_reps int,
    last_rpe numeric,              -- Reps in Reserve / Rate of Perceived Exertion (1-10)
    last_rir int,                  -- Reps in Reserve (alternative to RPE)
    last_1rm numeric,              -- Calculated 1-rep max
    last_volume numeric,           -- Total volume (weight × reps × sets)
    last_workout_date date,
    -- Adaptive difficulty
    difficulty_level text DEFAULT 'normal', 
    -- beginner, normal, advanced
    progression_rate numeric DEFAULT 1.0,  -- Multiplier for progression speed
    consecutive_sessions int DEFAULT 0,    -- Sessions completed at current level
    updated_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, exercise_id)
);

-- Y2 — scheduled_progressions
-- Stores auto-generated next workout weights
CREATE TABLE IF NOT EXISTS scheduled_progressions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    next_weight numeric,
    next_reps int,
    next_sets int,
    target_rpe numeric DEFAULT 7,  -- Target RPE for next session
    target_rir int,                 -- Target RIR for next session
    progression_type text,          -- weight_increase, rep_increase, volume_increase, maintain
    notes text,                     -- "Deload week", "Missed workout recovery", etc.
    created_at timestamptz DEFAULT timezone('utc', now()),
    expires_at timestamptz,         -- When this progression expires
    UNIQUE(user_id, exercise_id)
);

-- Y3 — missed_workout_log
-- Tracks missed workouts for recovery logic
CREATE TABLE IF NOT EXISTS missed_workout_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    scheduled_workout_id uuid REFERENCES workouts(id) ON DELETE SET NULL,
    reason text,                    -- busy, sick, travel, fatigue, etc.
    days_since_last_workout int,   -- Calculated field
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Y4 — deload_cycles
-- Tracks deload weeks (premium feature)
CREATE TABLE IF NOT EXISTS deload_cycles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date date NOT NULL,
    end_date date NOT NULL,
    volume_reduction int DEFAULT 50,   -- Percentage reduction (40-50%)
    intensity_reduction int DEFAULT 20, -- Percentage reduction (10-20%)
    triggered_by text NOT NULL,        -- auto, manual, recovery_need, fatigue, hrv_low
    weeks_since_last_deload int,       -- How many weeks since last deload
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Y5 — exercise_substitutions
-- Stores intelligent movement substitutions
CREATE TABLE IF NOT EXISTS exercise_substitutions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    substitute_exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    reason text,                    -- equipment_unavailable, dislike, injury, variation
    similarity_score numeric,       -- 0-1, how similar the movements are
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- 2. INDEXES ----------------------------------------------

CREATE INDEX IF NOT EXISTS idx_workout_progressions_user_exercise ON workout_progressions(user_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_progressions_updated ON workout_progressions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_progressions_user_exercise ON scheduled_progressions(user_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_progressions_expires ON scheduled_progressions(expires_at);
CREATE INDEX IF NOT EXISTS idx_missed_workout_log_user_date ON missed_workout_log(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_deload_cycles_user_active ON deload_cycles(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_deload_cycles_dates ON deload_cycles(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_exercise_substitutions_user ON exercise_substitutions(user_id);

-- 3. RLS (Row-Level Security) ----------------------------

ALTER TABLE workout_progressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_progressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE missed_workout_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE deload_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_substitutions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "users_manage_own_progressions"
ON workout_progressions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_scheduled_progressions"
ON scheduled_progressions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_missed_workouts"
ON missed_workout_log
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_deload_cycles"
ON deload_cycles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_substitutions"
ON exercise_substitutions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. RPC FUNCTIONS ---------------------------------------

-- Y-RPC1 — compute_one_rep_max(weight, reps)
-- Uses Epley formula (Fitbod standard)
CREATE OR REPLACE FUNCTION compute_one_rep_max(p_weight numeric, p_reps int)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE 
        WHEN p_reps = 1 THEN p_weight
        WHEN p_reps > 0 THEN p_weight * (1 + p_reps / 30.0)
        ELSE NULL
    END;
$$;

-- Y-RPC2 — compute_one_rep_max_brzycki(weight, reps)
-- Alternative formula (Brzycki)
CREATE OR REPLACE FUNCTION compute_one_rep_max_brzycki(p_weight numeric, p_reps int)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE 
        WHEN p_reps = 1 THEN p_weight
        WHEN p_reps > 0 AND p_reps <= 10 THEN p_weight * (36.0 / (37.0 - p_reps))
        ELSE NULL
    END;
$$;

-- Y-RPC3 — update_progression(user_id, exercise_id, weight, reps, rpe, rir, volume)
-- Recalculates 1RM, next workout weight, next reps based on performance
CREATE OR REPLACE FUNCTION update_progression(
    p_user uuid,
    p_exercise uuid,
    p_weight numeric,
    p_reps int,
    p_rpe numeric DEFAULT NULL,
    p_rir int DEFAULT NULL,
    p_volume numeric DEFAULT NULL,
    p_sets int DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_1rm numeric;
    next_w numeric;
    next_r int;
    next_s int;
    target_rpe numeric;
    progression_type text;
    is_premium boolean;
    difficulty_level text;
    progression_rate numeric;
    consecutive_sessions int;
    last_weight numeric;
    last_reps int;
    days_since_last date;
    is_deload boolean;
    deload_volume_red int;
    deload_intensity_red int;
BEGIN
    -- Check if user is premium (advanced progression logic is premium-only)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    -- Get current progression data
    SELECT 
        last_weight, last_reps, difficulty_level, progression_rate, consecutive_sessions,
        last_workout_date
    INTO 
        last_weight, last_reps, difficulty_level, progression_rate, consecutive_sessions,
        days_since_last
    FROM workout_progressions
    WHERE user_id = p_user AND exercise_id = p_exercise;
    
    -- Calculate 1RM using Epley formula
    new_1rm := compute_one_rep_max(p_weight, p_reps);
    
    -- Check if we're in a deload cycle
    SELECT EXISTS (
        SELECT 1 FROM deload_cycles
        WHERE user_id = p_user
          AND is_active = true
          AND CURRENT_DATE BETWEEN start_date AND end_date
    ) INTO is_deload;
    
    -- Auto-progression logic based on RPE/RIR
    IF p_rpe IS NOT NULL THEN
        -- RPE-based progression (1-10 scale, lower = easier)
        IF p_rpe <= 6 THEN
            -- Easy - increase weight significantly
            next_w := p_weight * (1.0 + (0.05 * progression_rate));
            next_r := GREATEST(p_reps - 1, 5);
            progression_type := 'weight_increase';
            target_rpe := 7;
        ELSIF p_rpe <= 8 THEN
            -- Moderate - small weight increase
            next_w := p_weight * (1.0 + (0.025 * progression_rate));
            next_r := p_reps;
            progression_type := 'weight_increase';
            target_rpe := 7;
        ELSE
            -- Hard - maintain weight, add reps
            next_w := p_weight;
            next_r := LEAST(p_reps + 1, 15);
            progression_type := 'rep_increase';
            target_rpe := 8;
        END IF;
    ELSIF p_rir IS NOT NULL THEN
        -- RIR-based progression (Reps in Reserve, higher = easier)
        IF p_rir >= 3 THEN
            -- Too easy - increase weight
            next_w := p_weight * (1.0 + (0.05 * progression_rate));
            next_r := GREATEST(p_reps - 1, 5);
            progression_type := 'weight_increase';
            target_rpe := 7;
        ELSIF p_rir >= 1 THEN
            -- Good - small increase
            next_w := p_weight * (1.0 + (0.025 * progression_rate));
            next_r := p_reps;
            progression_type := 'weight_increase';
            target_rpe := 7;
        ELSE
            -- Hard - maintain, add reps
            next_w := p_weight;
            next_r := LEAST(p_reps + 1, 15);
            progression_type := 'rep_increase';
            target_rpe := 8;
        END IF;
    ELSE
        -- Default progression (no RPE/RIR provided)
        next_w := p_weight * (1.0 + (0.025 * progression_rate));
        next_r := p_reps;
        progression_type := 'weight_increase';
        target_rpe := 7;
    END IF;
    
    -- Apply deload if active
    IF is_deload THEN
        SELECT volume_reduction, intensity_reduction 
        INTO deload_volume_red, deload_intensity_red
        FROM deload_cycles
        WHERE user_id = p_user AND is_active = true
        ORDER BY start_date DESC
        LIMIT 1;
        
        next_w := next_w * (1.0 - (deload_intensity_red / 100.0));
        next_r := GREATEST(next_r - 2, 5);
        progression_type := 'deload';
    END IF;
    
    -- Handle missed workout recovery (premium only)
    IF is_premium AND days_since_last IS NOT NULL THEN
        IF days_since_last >= 7 THEN
            -- 7+ days missed - reduce weight 10%, reduce reps by 2
            next_w := next_w * 0.9;
            next_r := GREATEST(next_r - 2, 5);
            progression_type := 'missed_workout_recovery';
        ELSIF days_since_last >= 3 THEN
            -- 3-6 days missed - reduce weight 5%
            next_w := next_w * 0.95;
            progression_type := 'missed_workout_recovery';
        END IF;
    END IF;
    
    -- Round weight to nearest 2.5kg or 5lb (depending on preference)
    next_w := ROUND(next_w / 2.5) * 2.5;
    
    -- Calculate volume if provided
    IF p_volume IS NULL THEN
        p_volume := p_weight * p_reps * p_sets;
    END IF;
    
    next_s := p_sets; -- Keep same number of sets
    
    -- Update progression table
    INSERT INTO workout_progressions (
        user_id, exercise_id, last_weight, last_reps, last_rpe, last_rir,
        last_1rm, last_volume, last_workout_date, difficulty_level,
        progression_rate, consecutive_sessions, updated_at
    )
    VALUES (
        p_user, p_exercise, p_weight, p_reps, p_rpe, p_rir,
        new_1rm, p_volume, CURRENT_DATE, 
        COALESCE(difficulty_level, 'normal'),
        COALESCE(progression_rate, 1.0),
        COALESCE(consecutive_sessions, 0) + 1,
        timezone('utc', now())
    )
    ON CONFLICT (user_id, exercise_id) DO UPDATE
    SET
        last_weight = EXCLUDED.last_weight,
        last_reps = EXCLUDED.last_reps,
        last_rpe = EXCLUDED.last_rpe,
        last_rir = EXCLUDED.last_rir,
        last_1rm = EXCLUDED.last_1rm,
        last_volume = EXCLUDED.last_volume,
        last_workout_date = EXCLUDED.last_workout_date,
        consecutive_sessions = EXCLUDED.consecutive_sessions,
        updated_at = timezone('utc', now());
    
    -- Upsert scheduled next workout
    INSERT INTO scheduled_progressions (
        user_id, exercise_id, next_weight, next_reps, next_sets,
        target_rpe, target_rir, progression_type, expires_at
    )
    VALUES (
        p_user, p_exercise, next_w, next_r, next_s,
        target_rpe, COALESCE(p_rir, 2), progression_type,
        timezone('utc', now()) + INTERVAL '14 days'
    )
    ON CONFLICT (user_id, exercise_id) DO UPDATE
    SET
        next_weight = EXCLUDED.next_weight,
        next_reps = EXCLUDED.next_reps,
        next_sets = EXCLUDED.next_sets,
        target_rpe = EXCLUDED.target_rpe,
        target_rir = EXCLUDED.target_rir,
        progression_type = EXCLUDED.progression_type,
        expires_at = EXCLUDED.expires_at;
    
    RETURN jsonb_build_object(
        'success', true,
        'exercise_id', p_exercise,
        'current_1rm', new_1rm,
        'next_weight', next_w,
        'next_reps', next_r,
        'next_sets', next_s,
        'target_rpe', target_rpe,
        'progression_type', progression_type,
        'is_deload', is_deload
    );
END;
$$;

-- Y-RPC4 — get_next_exercise_progression(user_id, exercise_id)
-- Gets the next workout progression for an exercise
CREATE OR REPLACE FUNCTION get_next_exercise_progression(
    p_user uuid,
    p_exercise uuid
)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_build_object(
        'exercise_id', p_exercise,
        'next_weight', next_weight,
        'next_reps', next_reps,
        'next_sets', next_sets,
        'target_rpe', target_rpe,
        'target_rir', target_rir,
        'progression_type', progression_type,
        'notes', notes,
        'expires_at', expires_at
    )
    FROM scheduled_progressions
    WHERE user_id = p_user
      AND exercise_id = p_exercise
      AND (expires_at IS NULL OR expires_at > timezone('utc', now()));
$$;

-- Y-RPC5 — log_missed_workout(user_id, date, reason, scheduled_workout_id)
-- Logs a missed workout for recovery logic
CREATE OR REPLACE FUNCTION log_missed_workout(
    p_user uuid,
    p_date date DEFAULT CURRENT_DATE,
    p_reason text DEFAULT NULL,
    p_scheduled_workout_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    missed_id uuid;
    days_since_last int;
    last_workout_date date;
    is_premium boolean;
BEGIN
    -- Check if user is premium (missed workout handling is premium-only)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    IF NOT is_premium THEN
        RAISE EXCEPTION 'Missed workout tracking requires premium subscription.';
    END IF;
    
    -- Get last workout date
    SELECT MAX(completed_at::date) INTO last_workout_date
    FROM workout_logs
    WHERE user_id = p_user;
    
    -- Calculate days since last workout
    IF last_workout_date IS NOT NULL THEN
        days_since_last := p_date - last_workout_date;
    ELSE
        days_since_last := 0;
    END IF;
    
    -- Insert missed workout log
    INSERT INTO missed_workout_log (
        user_id, date, reason, scheduled_workout_id, days_since_last_workout
    )
    VALUES (
        p_user, p_date, p_reason, p_scheduled_workout_id, days_since_last
    )
    RETURNING id INTO missed_id;
    
    RETURN missed_id;
END;
$$;

-- Y-RPC6 — trigger_deload_week(user_id, triggered_by, volume_reduction, intensity_reduction)
-- Triggers a deload week (premium only)
CREATE OR REPLACE FUNCTION trigger_deload_week(
    p_user uuid,
    p_triggered_by text DEFAULT 'auto',
    p_volume_reduction int DEFAULT 50,
    p_intensity_reduction int DEFAULT 20
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deload_id uuid;
    is_premium boolean;
    weeks_since_last int;
    last_deload_date date;
BEGIN
    -- Check if user is premium (deload weeks are premium-only)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    IF NOT is_premium THEN
        RAISE EXCEPTION 'Deload weeks require premium subscription.';
    END IF;
    
    -- Get last deload date
    SELECT MAX(end_date) INTO last_deload_date
    FROM deload_cycles
    WHERE user_id = p_user;
    
    -- Calculate weeks since last deload
    IF last_deload_date IS NOT NULL THEN
        weeks_since_last := EXTRACT(WEEK FROM CURRENT_DATE - last_deload_date);
    ELSE
        weeks_since_last := 0;
    END IF;
    
    -- Deactivate any existing active deload cycles
    UPDATE deload_cycles
    SET is_active = false
    WHERE user_id = p_user AND is_active = true;
    
    -- Create new deload cycle
    INSERT INTO deload_cycles (
        user_id,
        start_date,
        end_date,
        volume_reduction,
        intensity_reduction,
        triggered_by,
        weeks_since_last_deload,
        is_active
    )
    VALUES (
        p_user,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '7 days',
        p_volume_reduction,
        p_intensity_reduction,
        p_triggered_by,
        weeks_since_last,
        true
    )
    RETURNING id INTO deload_id;
    
    RETURN deload_id;
END;
$$;

-- Y-RPC7 — get_user_progressions(user_id, exercise_id_filter)
-- Gets all progressions for a user
CREATE OR REPLACE FUNCTION get_user_progressions(
    p_user uuid,
    p_exercise_id_filter uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_agg(
        jsonb_build_object(
            'exercise_id', wp.exercise_id,
            'exercise_name', e.name,
            'last_weight', wp.last_weight,
            'last_reps', wp.last_reps,
            'last_rpe', wp.last_rpe,
            'last_rir', wp.last_rir,
            'last_1rm', wp.last_1rm,
            'last_volume', wp.last_volume,
            'last_workout_date', wp.last_workout_date,
            'difficulty_level', wp.difficulty_level,
            'progression_rate', wp.progression_rate,
            'consecutive_sessions', wp.consecutive_sessions,
            'next_progression', (
                SELECT jsonb_build_object(
                    'next_weight', sp.next_weight,
                    'next_reps', sp.next_reps,
                    'next_sets', sp.next_sets,
                    'target_rpe', sp.target_rpe,
                    'progression_type', sp.progression_type
                )
                FROM scheduled_progressions sp
                WHERE sp.user_id = wp.user_id
                  AND sp.exercise_id = wp.exercise_id
                LIMIT 1
            )
        )
    )
    FROM workout_progressions wp
    JOIN exercises e ON e.id = wp.exercise_id
    WHERE wp.user_id = p_user
      AND (p_exercise_id_filter IS NULL OR wp.exercise_id = p_exercise_id_filter);
$$;

-- Y-RPC8 — suggest_exercise_substitution(user_id, exercise_id, reason)
-- Suggests exercise substitutions (premium only)
CREATE OR REPLACE FUNCTION suggest_exercise_substitution(
    p_user uuid,
    p_exercise_id uuid,
    p_reason text DEFAULT 'equipment_unavailable'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_premium boolean;
    original_exercise RECORD;
    substitutions jsonb;
BEGIN
    -- Check if user is premium (substitutions are premium-only)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    IF NOT is_premium THEN
        RAISE EXCEPTION 'Exercise substitutions require premium subscription.';
    END IF;
    
    -- Get original exercise details
    SELECT * INTO original_exercise
    FROM exercises
    WHERE id = p_exercise_id;
    
    -- Find similar exercises (same muscle groups, similar equipment)
    -- This is a simplified version - full logic would be in API layer
    SELECT jsonb_agg(
        jsonb_build_object(
            'exercise_id', e.id,
            'name', e.name,
            'muscle_group', e.muscle_group,
            'equipment', e.equipment,
            'similarity_score', 0.8  -- Placeholder - would be calculated in API
        )
    )
    INTO substitutions
    FROM exercises e
    WHERE e.id != p_exercise_id
      AND (
        e.muscle_group = original_exercise.muscle_group
        OR e.muscle_groups && ARRAY[original_exercise.muscle_group]
      )
      AND e.is_custom = false
    LIMIT 5;
    
    RETURN jsonb_build_object(
        'original_exercise_id', p_exercise_id,
        'original_exercise_name', original_exercise.name,
        'reason', p_reason,
        'substitutions', COALESCE(substitutions, '[]'::jsonb)
    );
END;
$$;

-- Y-RPC9 — check_deload_needed(user_id)
-- Checks if user needs a deload week (premium only)
CREATE OR REPLACE FUNCTION check_deload_needed(p_user uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_premium boolean;
    weeks_since_last_deload int;
    last_deload_date date;
    consecutive_weeks int;
    fatigue_level int;
    needs_deload boolean := false;
    reason text;
BEGIN
    -- Check if user is premium
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    IF NOT is_premium THEN
        RETURN jsonb_build_object('needs_deload', false, 'reason', 'premium_required');
    END IF;
    
    -- Get last deload date
    SELECT MAX(end_date) INTO last_deload_date
    FROM deload_cycles
    WHERE user_id = p_user;
    
    -- Calculate weeks since last deload
    IF last_deload_date IS NOT NULL THEN
        weeks_since_last_deload := EXTRACT(WEEK FROM CURRENT_DATE - last_deload_date);
    ELSE
        weeks_since_last_deload := 999; -- Never had a deload
    END IF;
    
    -- Check consecutive weeks of training
    SELECT COUNT(DISTINCT DATE_TRUNC('week', completed_at))
    INTO consecutive_weeks
    FROM workout_logs
    WHERE user_id = p_user
      AND completed_at >= CURRENT_DATE - INTERVAL '8 weeks';
    
    -- Check fatigue/stress from wellness module (if available)
    SELECT COALESCE(AVG(mood_value), 3)::int INTO fatigue_level
    FROM moods
    WHERE user_id = p_user
      AND created_at >= CURRENT_DATE - INTERVAL '7 days';
    
    -- Deload logic
    IF weeks_since_last_deload >= 6 AND consecutive_weeks >= 4 THEN
        needs_deload := true;
        reason := 'auto_6_weeks';
    ELSIF fatigue_level <= 2 THEN
        needs_deload := true;
        reason := 'recovery_need';
    ELSIF consecutive_weeks >= 8 THEN
        needs_deload := true;
        reason := 'auto_8_weeks';
    END IF;
    
    RETURN jsonb_build_object(
        'needs_deload', needs_deload,
        'reason', reason,
        'weeks_since_last_deload', weeks_since_last_deload,
        'consecutive_weeks', consecutive_weeks,
        'fatigue_level', fatigue_level
    );
END;
$$;

-- Y-RPC10 — get_progression_history(user_id, exercise_id, days)
-- Gets progression history for an exercise
CREATE OR REPLACE FUNCTION get_progression_history(
    p_user uuid,
    p_exercise_id uuid,
    p_days int DEFAULT 30
)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', DATE(wl.completed_at),
            'weight', sl.weight,
            'reps', sl.reps,
            'sets', COUNT(*),
            'volume', SUM(sl.weight * sl.reps),
            'rpe', sl.rir,  -- Using rir field as RPE placeholder
            '1rm', compute_one_rep_max(sl.weight, sl.reps)
        )
        ORDER BY wl.completed_at DESC
    )
    FROM set_logs sl
    JOIN workout_logs wl ON sl.workout_log_id = wl.id
    WHERE wl.user_id = p_user
      AND sl.exercise_id = p_exercise_id
      AND wl.completed_at >= CURRENT_DATE - (p_days || ' days')::interval;
$$;

-- 5. TRIGGERS ---------------------------------------------

-- Auto-update updated_at on workout_progressions
CREATE OR REPLACE FUNCTION update_progression_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_progression_timestamp
BEFORE UPDATE ON workout_progressions
FOR EACH ROW
EXECUTE FUNCTION update_progression_timestamp();

