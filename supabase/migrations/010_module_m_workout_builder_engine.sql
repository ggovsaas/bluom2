-- =========================================================
-- MODULE M — WORKOUT BUILDER ENGINE
-- AI workout builder, training plans, progression tracking, equipment matching
-- =========================================================

-- 1. ENHANCE EXISTING EXERCISES TABLE (from Module D) -------

-- Add missing columns to exercises if they don't exist
DO $$
BEGIN
    -- Add category if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exercises' AND column_name = 'category'
    ) THEN
        ALTER TABLE exercises ADD COLUMN category text;
    END IF;
    
    -- Add muscle_groups array if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exercises' AND column_name = 'muscle_groups'
    ) THEN
        ALTER TABLE exercises ADD COLUMN muscle_groups text[] DEFAULT '{}';
    END IF;
    
    -- Convert equipment to array if it's text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exercises' AND column_name = 'equipment' 
        AND data_type = 'text'
    ) THEN
        -- Add equipment_array column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'exercises' AND column_name = 'equipment_array'
        ) THEN
            ALTER TABLE exercises ADD COLUMN equipment_array text[] DEFAULT '{}';
            -- Migrate existing equipment text to array
            UPDATE exercises SET equipment_array = ARRAY[equipment] WHERE equipment IS NOT NULL;
        END IF;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exercises' AND column_name = 'equipment_array'
    ) THEN
        ALTER TABLE exercises ADD COLUMN equipment_array text[] DEFAULT '{}';
    END IF;
    
    -- Add instructions if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exercises' AND column_name = 'instructions'
    ) THEN
        ALTER TABLE exercises ADD COLUMN instructions text;
    END IF;
    
    -- Add is_verified if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exercises' AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE exercises ADD COLUMN is_verified boolean DEFAULT false;
    END IF;
    
    -- Rename video_url to demo_video_url if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exercises' AND column_name = 'video_url'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exercises' AND column_name = 'demo_video_url'
    ) THEN
        ALTER TABLE exercises RENAME COLUMN video_url TO demo_video_url;
    END IF;
    
    -- Rename demo_image to demo_image_url if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exercises' AND column_name = 'demo_image'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exercises' AND column_name = 'demo_image_url'
    ) THEN
        ALTER TABLE exercises RENAME COLUMN demo_image TO demo_image_url;
    END IF;
END $$;

-- 2. NEW TABLES -------------------------------------------

-- M1 — workouts
-- A "workout" is a training session or routine (separate from Module D routines)
CREATE TABLE IF NOT EXISTS workouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    goal text, -- strength, fat_loss, speed, hypertrophy, mobility, endurance
    duration_minutes int,
    difficulty text DEFAULT 'beginner', -- beginner, intermediate, advanced
    is_ai_generated boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- M2 — workout_exercises
-- Exercise order + sets + reps + rest per workout
CREATE TABLE IF NOT EXISTS workout_exercises (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id uuid REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id uuid REFERENCES exercises(id) ON DELETE CASCADE,
    order_index int NOT NULL,
    sets int NOT NULL,
    reps text,             -- "12", "8-12", "AMRAP", "30 sec"
    rest_seconds int DEFAULT 60,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- M3 — workout_logs
-- Every time user completes a workout → logged here
CREATE TABLE IF NOT EXISTS workout_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    workout_id uuid REFERENCES workouts(id) ON DELETE SET NULL,
    duration_minutes int,
    calories_burned numeric,
    notes text,
    completed_at timestamptz DEFAULT timezone('utc', now())
);

-- M4 — set_logs
-- Every WORKING SET logged for progression tracking
CREATE TABLE IF NOT EXISTS set_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_log_id uuid REFERENCES workout_logs(id) ON DELETE CASCADE,
    exercise_id uuid REFERENCES exercises(id),
    set_number int,
    weight numeric,    -- null for bodyweight
    reps int,
    rir int,           -- reps-in-reserve (optional, 0-5)
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- M5 — user_equipment
-- Personalization: what equipment user has available
CREATE TABLE IF NOT EXISTS user_equipment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    equipment text[] DEFAULT '{}',   -- ['dumbbell', 'band', 'bodyweight', 'barbell', 'kettlebell']
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- M6 — training_plans
-- A plan = many workouts combined into a schedule (AI or user-created)
CREATE TABLE IF NOT EXISTS training_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    goal text, -- lose_weight, build_muscle, tone_up, athlete, endurance
    duration_weeks int,
    is_ai_generated boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- M7 — training_plan_days
-- Each plan contains scheduled workouts per day
CREATE TABLE IF NOT EXISTS training_plan_days (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid REFERENCES training_plans(id) ON DELETE CASCADE,
    workout_id uuid REFERENCES workouts(id),
    week int NOT NULL,
    day_of_week int NOT NULL, -- 1 = Monday… 7 = Sunday
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- 3. RLS (Row-Level Security) ----------------------------

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plan_days ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "users_manage_own_workouts"
ON workouts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_workout_exercises"
ON workout_exercises
FOR ALL
USING (
    auth.uid() = (
        SELECT user_id FROM workouts WHERE id = workout_id
    )
)
WITH CHECK (
    auth.uid() = (
        SELECT user_id FROM workouts WHERE id = workout_id
    )
);

CREATE POLICY "users_manage_own_workout_logs"
ON workout_logs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_set_logs"
ON set_logs
FOR ALL
USING (
    auth.uid() = (
        SELECT user_id FROM workout_logs WHERE id = workout_log_id
    )
)
WITH CHECK (
    auth.uid() = (
        SELECT user_id FROM workout_logs WHERE id = workout_log_id
    )
);

CREATE POLICY "users_manage_own_equipment"
ON user_equipment
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_training_plans"
ON training_plans
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_plan_days"
ON training_plan_days
FOR ALL
USING (
    auth.uid() = (
        SELECT user_id FROM training_plans WHERE id = plan_id
    )
)
WITH CHECK (
    auth.uid() = (
        SELECT user_id FROM training_plans WHERE id = plan_id
    )
);

-- 4. INDEXES ----------------------------------------------

CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_groups ON exercises USING GIN(muscle_groups);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment_array ON exercises USING GIN(equipment_array);
CREATE INDEX IF NOT EXISTS idx_exercises_verified ON exercises(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_workouts_user ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_set_logs_workout_log ON set_logs(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_set_logs_exercise ON set_logs(exercise_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_user ON training_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_training_plan_days_plan ON training_plan_days(plan_id);
CREATE INDEX IF NOT EXISTS idx_training_plan_days_week_day ON training_plan_days(week, day_of_week);

-- 5. RPC FUNCTIONS ---------------------------------------

-- M-RPC1 — add_exercise(user_id, name, category, muscle_groups, equipment_array, difficulty, ...)
-- Add custom exercise
CREATE OR REPLACE FUNCTION add_exercise(
    user_id_param uuid,
    name_param text,
    category_param text,
    muscle_groups_param text[] DEFAULT '{}',
    equipment_array_param text[] DEFAULT '{}',
    difficulty_param text DEFAULT 'beginner',
    demo_video_url_param text DEFAULT NULL,
    demo_image_url_param text DEFAULT NULL,
    instructions_param text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    exercise_id_result uuid;
BEGIN
    INSERT INTO exercises (
        user_id, name, category, muscle_groups, equipment_array,
        difficulty, demo_video_url, demo_image_url, instructions,
        is_custom, is_verified
    )
    VALUES (
        user_id_param, name_param, category_param, muscle_groups_param,
        equipment_array_param, difficulty_param, demo_video_url_param,
        demo_image_url_param, instructions_param, true, false
    )
    RETURNING id INTO exercise_id_result;
    
    RETURN exercise_id_result;
END;
$$;

-- M-RPC2 — create_workout(user_id, name, description, goal, duration_minutes, difficulty, exercises_jsonb)
-- Create workout with exercises
CREATE OR REPLACE FUNCTION create_workout(
    user_id_param uuid,
    name_param text,
    description_param text DEFAULT NULL,
    goal_param text DEFAULT NULL,
    duration_minutes_param int DEFAULT NULL,
    difficulty_param text DEFAULT 'beginner',
    exercises_jsonb jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    workout_id_result uuid;
    ex record;
    order_idx int := 1;
BEGIN
    -- Insert workout
    INSERT INTO workouts (
        user_id, name, description, goal, duration_minutes, difficulty
    )
    VALUES (
        user_id_param, name_param, description_param, goal_param,
        duration_minutes_param, difficulty_param
    )
    RETURNING id INTO workout_id_result;
    
    -- Insert workout exercises
    FOR ex IN SELECT * FROM jsonb_array_elements(exercises_jsonb)
    LOOP
        INSERT INTO workout_exercises (
            workout_id, exercise_id, order_index, sets, reps, rest_seconds
        )
        VALUES (
            workout_id_result,
            (ex->>'exercise_id')::uuid,
            order_idx,
            (ex->>'sets')::int,
            ex->>'reps',
            COALESCE((ex->>'rest_seconds')::int, 60)
        );
        
        order_idx := order_idx + 1;
    END LOOP;
    
    RETURN workout_id_result;
END;
$$;

-- M-RPC3 — log_workout(user_id, workout_id, duration_minutes, calories_burned, notes, sets_jsonb)
-- Log workout with sets
CREATE OR REPLACE FUNCTION log_workout(
    user_id_param uuid,
    workout_id_param uuid DEFAULT NULL,
    duration_minutes_param int DEFAULT NULL,
    calories_burned_param numeric DEFAULT NULL,
    notes_param text DEFAULT NULL,
    sets_jsonb jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    workout_log_id_result uuid;
    set_record record;
BEGIN
    -- Insert workout log
    INSERT INTO workout_logs (
        user_id, workout_id, duration_minutes, calories_burned, notes
    )
    VALUES (
        user_id_param, workout_id_param, duration_minutes_param,
        calories_burned_param, notes_param
    )
    RETURNING id INTO workout_log_id_result;
    
    -- Insert set logs
    FOR set_record IN SELECT * FROM jsonb_array_elements(sets_jsonb)
    LOOP
        INSERT INTO set_logs (
            workout_log_id, exercise_id, set_number, weight, reps, rir
        )
        VALUES (
            workout_log_id_result,
            (set_record->>'exercise_id')::uuid,
            (set_record->>'set_number')::int,
            CASE WHEN set_record->>'weight' = 'null' THEN NULL ELSE (set_record->>'weight')::numeric END,
            (set_record->>'reps')::int,
            CASE WHEN set_record->>'rir' IS NULL THEN NULL ELSE (set_record->>'rir')::int END
        );
    END LOOP;
    
    RETURN workout_log_id_result;
END;
$$;

-- M-RPC4 — get_exercise_progress(user_id, exercise_id, limit_count)
-- Get user progression for an exercise
CREATE OR REPLACE FUNCTION get_exercise_progress(
    user_id_param uuid,
    exercise_id_param uuid,
    limit_count int DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    workout_log_id uuid,
    set_number int,
    weight numeric,
    reps int,
    rir int,
    created_at timestamptz
)
LANGUAGE sql
AS $$
    SELECT 
        sl.id, sl.workout_log_id, sl.set_number, sl.weight, sl.reps, sl.rir, sl.created_at
    FROM set_logs sl
    JOIN workout_logs wl ON sl.workout_log_id = wl.id
    WHERE wl.user_id = user_id_param
      AND sl.exercise_id = exercise_id_param
    ORDER BY sl.created_at DESC
    LIMIT limit_count;
$$;

-- M-RPC5 — update_user_equipment(user_id, equipment_array)
-- Update user's available equipment
CREATE OR REPLACE FUNCTION update_user_equipment(
    user_id_param uuid,
    equipment_array_param text[]
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO user_equipment (user_id, equipment)
    VALUES (user_id_param, equipment_array_param)
    ON CONFLICT (user_id) DO UPDATE
    SET equipment = EXCLUDED.equipment,
        updated_at = timezone('utc', now());
END;
$$;

-- M-RPC6 — get_user_equipment(user_id)
-- Get user's available equipment
CREATE OR REPLACE FUNCTION get_user_equipment(user_id_param uuid)
RETURNS text[]
LANGUAGE sql
AS $$
    SELECT COALESCE(equipment, '{}'::text[])
    FROM user_equipment
    WHERE user_id = user_id_param;
$$;

-- M-RPC7 — create_training_plan(user_id, name, goal, duration_weeks, workouts_jsonb)
-- Create training plan with scheduled workouts
CREATE OR REPLACE FUNCTION create_training_plan(
    user_id_param uuid,
    name_param text,
    goal_param text DEFAULT NULL,
    duration_weeks_param int DEFAULT NULL,
    workouts_jsonb jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    plan_id_result uuid;
    w record;
BEGIN
    -- Insert training plan
    INSERT INTO training_plans (user_id, name, goal, duration_weeks)
    VALUES (user_id_param, name_param, goal_param, duration_weeks_param)
    RETURNING id INTO plan_id_result;
    
    -- Insert plan days
    FOR w IN SELECT * FROM jsonb_array_elements(workouts_jsonb)
    LOOP
        INSERT INTO training_plan_days (
            plan_id, workout_id, week, day_of_week
        )
        VALUES (
            plan_id_result,
            (w->>'workout_id')::uuid,
            (w->>'week')::int,
            (w->>'day_of_week')::int
        );
    END LOOP;
    
    RETURN plan_id_result;
END;
$$;

-- M-RPC8 — get_workout_for_today(user_id, plan_id)
-- Get today's workout from a training plan
CREATE OR REPLACE FUNCTION get_workout_for_today(
    user_id_param uuid,
    plan_id_param uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    current_week int;
    current_day int;
    workout_data jsonb;
BEGIN
    -- Calculate current week (assuming plan starts at created_at)
    SELECT 
        EXTRACT(WEEK FROM CURRENT_DATE) - EXTRACT(WEEK FROM created_at) + 1,
        EXTRACT(DOW FROM CURRENT_DATE)
    INTO current_week, current_day
    FROM training_plans
    WHERE id = plan_id_param AND user_id = user_id_param;
    
    -- Adjust day_of_week (PostgreSQL DOW: 0=Sunday, 1=Monday...)
    IF current_day = 0 THEN
        current_day := 7; -- Sunday
    END IF;
    
    -- Get workout for today
    SELECT jsonb_build_object(
        'workout_id', tpd.workout_id,
        'workout', to_jsonb(w.*),
        'week', tpd.week,
        'day_of_week', tpd.day_of_week
    )
    INTO workout_data
    FROM training_plan_days tpd
    JOIN workouts w ON tpd.workout_id = w.id
    WHERE tpd.plan_id = plan_id_param
      AND tpd.week = current_week
      AND tpd.day_of_week = current_day
    LIMIT 1;
    
    RETURN COALESCE(workout_data, '{}'::jsonb);
END;
$$;

-- M-RPC9 — search_exercises(search_term, category_filter, equipment_filter, difficulty_filter)
-- Search exercises with filters
CREATE OR REPLACE FUNCTION search_exercises(
    search_term text DEFAULT NULL,
    category_filter text DEFAULT NULL,
    equipment_filter text[] DEFAULT NULL,
    difficulty_filter text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    name text,
    category text,
    muscle_groups text[],
    equipment_array text[],
    difficulty text,
    demo_video_url text,
    demo_image_url text,
    instructions text,
    is_verified boolean
)
LANGUAGE sql
AS $$
    SELECT 
        e.id, e.name, e.category, e.muscle_groups, e.equipment_array,
        e.difficulty, e.demo_video_url, e.demo_image_url, e.instructions, e.is_verified
    FROM exercises e
    WHERE (
        e.is_custom = false OR e.user_id = auth.uid()
    )
    AND (
        search_term IS NULL OR LOWER(e.name) LIKE '%' || LOWER(search_term) || '%'
    )
    AND (
        category_filter IS NULL OR e.category = category_filter
    )
    AND (
        equipment_filter IS NULL OR e.equipment_array && equipment_filter
    )
    AND (
        difficulty_filter IS NULL OR e.difficulty = difficulty_filter
    )
    ORDER BY e.is_verified DESC, e.name
    LIMIT 100;
$$;

-- M-RPC10 — get_workout_with_exercises(workout_id)
-- Get workout with all exercises ordered
CREATE OR REPLACE FUNCTION get_workout_with_exercises(workout_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    workout_data jsonb;
    exercises_data jsonb;
BEGIN
    -- Get workout
    SELECT to_jsonb(w.*) INTO workout_data
    FROM workouts w
    WHERE w.id = workout_id_param;
    
    -- Get exercises
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', we.id,
            'exercise_id', we.exercise_id,
            'exercise', to_jsonb(e.*),
            'order_index', we.order_index,
            'sets', we.sets,
            'reps', we.reps,
            'rest_seconds', we.rest_seconds
        ) ORDER BY we.order_index
    ) INTO exercises_data
    FROM workout_exercises we
    JOIN exercises e ON we.exercise_id = e.id
    WHERE we.workout_id = workout_id_param;
    
    -- Combine
    RETURN workout_data || jsonb_build_object('exercises', COALESCE(exercises_data, '[]'::jsonb));
END;
$$;

-- M-RPC11 — save_ai_workout(user_id, request, generated_workout_jsonb)
-- Save AI-generated workout
CREATE OR REPLACE FUNCTION save_ai_workout(
    user_id_param uuid,
    request_param text,
    generated_workout_jsonb jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    workout_id_result uuid;
    exercises_jsonb jsonb;
BEGIN
    -- Extract workout data
    exercises_jsonb := generated_workout_jsonb->'exercises';
    
    -- Create workout
    SELECT create_workout(
        user_id_param,
        generated_workout_jsonb->>'name',
        generated_workout_jsonb->>'description',
        generated_workout_jsonb->>'goal',
        (generated_workout_jsonb->>'duration_minutes')::int,
        generated_workout_jsonb->>'difficulty',
        exercises_jsonb
    ) INTO workout_id_result;
    
    -- Mark as AI-generated
    UPDATE workouts
    SET is_ai_generated = true
    WHERE id = workout_id_result;
    
    RETURN workout_id_result;
END;
$$;

-- 6. TRIGGERS ---------------------------------------------

-- Auto-update updated_at on user_equipment
CREATE OR REPLACE FUNCTION update_user_equipment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_equipment_timestamp
BEFORE UPDATE ON user_equipment
FOR EACH ROW
EXECUTE FUNCTION update_user_equipment_timestamp();

