-- =========================================================
-- MODULE D — FITNESS ENGINE (Move)
-- Exercises, routines, workouts, sets, PRs, steps, cardio
-- =========================================================

-- 1. EXERCISES (Global Library + Custom) -----------------

CREATE TABLE exercises (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    muscle_group text,
    equipment text,
    difficulty text,
    video_url text,
    demo_image text,
    description text,
    is_custom boolean DEFAULT false,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- only if custom
    created_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Everyone can read global exercises
CREATE POLICY "public_read_exercises"
ON exercises FOR SELECT
USING (is_custom = false OR auth.uid() = user_id);

-- Users can manage their own custom exercises
CREATE POLICY "users_manage_own_exercises"
ON exercises FOR ALL
USING (is_custom = false OR auth.uid() = user_id)
WITH CHECK (is_custom = false OR auth.uid() = user_id);

-- 2. ROUTINES (User Workout Plans) -----------------------

CREATE TABLE routines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    objective text,     -- hypertrophy, strength, fat loss
    scheduled_day text, -- optional: Mon/Tue/Fri etc.
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_routines"
ON routines FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. ROUTINE EXERCISES (Exercises in a Routine) ----------

CREATE TABLE routine_exercises (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id uuid REFERENCES routines(id) ON DELETE CASCADE,
    exercise_id uuid REFERENCES exercises(id) ON DELETE CASCADE,
    order_index int,
    sets int,
    reps int,
    rest_seconds int,
    target_rpe int,
    created_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;

-- Users can only see exercises for their own routines
CREATE POLICY "users_manage_own_routine_exercises"
ON routine_exercises FOR ALL
USING (
    auth.uid() = (
        SELECT user_id FROM routines WHERE id = routine_id
    )
)
WITH CHECK (
    auth.uid() = (
        SELECT user_id FROM routines WHERE id = routine_id
    )
);

-- 4. WORKOUT SESSIONS (When User Starts a Workout) -------

CREATE TABLE workout_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    routine_id uuid REFERENCES routines(id),
    start_time timestamptz DEFAULT timezone('utc', now()),
    end_time timestamptz,
    total_volume numeric DEFAULT 0,
    total_calories numeric DEFAULT 0,
    created_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_sessions"
ON workout_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. WORKOUT SETS (Detailed Tracking) --------------------

CREATE TABLE workout_sets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id uuid REFERENCES exercises(id),
    set_number int,
    weight numeric,
    reps int,
    rpe int,
    volume numeric,
    created_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

-- Users can only see sets for their own sessions
CREATE POLICY "users_manage_own_sets"
ON workout_sets FOR ALL
USING (
    auth.uid() = (
        SELECT user_id FROM workout_sessions WHERE id = session_id
    )
)
WITH CHECK (
    auth.uid() = (
        SELECT user_id FROM workout_sessions WHERE id = session_id
    )
);

-- 6. PERSONAL RECORDS (Auto-detected PRs) -----------------

CREATE TABLE personal_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id uuid REFERENCES exercises(id),
    pr_type text,                 -- weight, reps, volume, time
    value numeric,
    created_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_prs"
ON personal_records FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. STEPS TRACKING ---------------------------------------

CREATE TABLE steps_tracking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    date date DEFAULT current_date,
    steps int,
    source text, -- device, manual
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, date)
);

ALTER TABLE steps_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_steps"
ON steps_tracking FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 8. CARDIO SESSIONS --------------------------------------

CREATE TABLE cardio_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    type text,
    duration_seconds int,
    calories numeric,
    distance_km numeric,
    avg_hr int,
    created_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE cardio_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_cardio"
ON cardio_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- INDEXES for performance ---------------------------------

CREATE INDEX idx_routine_exercises_routine ON routine_exercises(routine_id);
CREATE INDEX idx_workout_sets_session ON workout_sets(session_id);
CREATE INDEX idx_workout_sessions_user_date ON workout_sessions(user_id, start_time);
CREATE INDEX idx_personal_records_user_exercise ON personal_records(user_id, exercise_id);
CREATE INDEX idx_steps_tracking_user_date ON steps_tracking(user_id, date);
CREATE INDEX idx_cardio_sessions_user_date ON cardio_sessions(user_id, created_at);

-- RPC FUNCTIONS -------------------------------------------

-- 1. Log completed set
CREATE OR REPLACE FUNCTION log_set(
    s_id uuid,
    ex uuid,
    num int,
    w numeric,
    r int,
    rpe_val int
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO workout_sets(session_id, exercise_id, set_number, weight, reps, rpe, volume)
    VALUES (s_id, ex, num, w, r, rpe_val, w*r);
    
    -- Auto-update session totals
    PERFORM update_session_totals(s_id);
END;
$$;

-- 2. Auto-update session totals
CREATE OR REPLACE FUNCTION update_session_totals(s_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    UPDATE workout_sessions
    SET total_volume = (
        SELECT COALESCE(SUM(volume), 0) 
        FROM workout_sets 
        WHERE session_id = s_id
    )
    WHERE id = s_id;
END;
$$;

-- 3. Detect PR (personal record)
CREATE OR REPLACE FUNCTION detect_pr(user_in uuid, exercise_in uuid, value_in numeric)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    current_pr numeric;
BEGIN
    SELECT value INTO current_pr FROM personal_records
    WHERE user_id = user_in 
      AND exercise_id = exercise_in 
      AND pr_type = 'weight'
    ORDER BY value DESC 
    LIMIT 1;
    
    IF current_pr IS NULL OR value_in > current_pr THEN
        INSERT INTO personal_records(user_id, exercise_id, pr_type, value)
        VALUES (user_in, exercise_in, 'weight', value_in);
    END IF;
END;
$$;

-- 4. Create custom exercise
CREATE OR REPLACE FUNCTION create_custom_ex(name text, muscle text, equipment text)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE 
    ex_id uuid;
BEGIN
    INSERT INTO exercises(name, muscle_group, equipment, is_custom, user_id)
    VALUES (name, muscle, equipment, true, auth.uid())
    RETURNING id INTO ex_id;
    
    RETURN ex_id;
END;
$$;

-- 5. Start new workout session
CREATE OR REPLACE FUNCTION start_workout(r_id uuid)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE 
    s_id uuid;
BEGIN
    INSERT INTO workout_sessions(user_id, routine_id)
    VALUES (auth.uid(), r_id)
    RETURNING id INTO s_id;
    
    RETURN s_id;
END;
$$;

-- 6. Finish workout session
CREATE OR REPLACE FUNCTION finish_workout(s_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    UPDATE workout_sessions
    SET end_time = timezone('utc', now())
    WHERE id = s_id;
    
    PERFORM update_session_totals(s_id);
END;
$$;

