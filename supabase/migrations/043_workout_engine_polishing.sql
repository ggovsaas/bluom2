-- =========================================================
-- WORKOUT ENGINE POLISHING
-- Auto-regulation, exercise alternatives, recovery integration, weekly goals
-- =========================================================

-- Exercise alternatives
CREATE TABLE IF NOT EXISTS exercise_alternatives (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id bigint NOT NULL REFERENCES exercise_db(id) ON DELETE CASCADE,
    alt_exercise_id bigint NOT NULL REFERENCES exercise_db(id) ON DELETE CASCADE,
    reason text, -- 'equipment', 'injury', 'preference', 'difficulty'
    priority int DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(exercise_id, alt_exercise_id)
);

-- Pre-populate common alternatives
INSERT INTO exercise_alternatives (exercise_id, alt_exercise_id, reason, priority)
SELECT 
    e1.id,
    e2.id,
    'equipment',
    3
FROM exercise_db e1
CROSS JOIN exercise_db e2
WHERE e1.name ILIKE '%barbell squat%'
AND e2.name ILIKE '%goblet squat%'
ON CONFLICT DO NOTHING;

-- Weekly training goals
CREATE TABLE IF NOT EXISTS weekly_training_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    week_number int NOT NULL,
    week_start_date date NOT NULL,
    target_volume int, -- total sets
    target_frequency int, -- workouts per week
    target_intensity numeric, -- average RPE
    actual_volume int DEFAULT 0,
    actual_frequency int DEFAULT 0,
    actual_intensity numeric DEFAULT 0,
    completed boolean DEFAULT false,
    auto_repeat boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, week_number, week_start_date)
);

-- Workout auto-regulation log
CREATE TABLE IF NOT EXISTS workout_auto_regulations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    workout_log_id bigint REFERENCES workout_logs(id) ON DELETE SET NULL,
    exercise_id bigint REFERENCES exercise_db(id) ON DELETE SET NULL,
    regulation_type text NOT NULL CHECK (regulation_type IN ('reps_reduced', 'reps_increased', 'weight_reduced', 'weight_increased', 'sets_reduced', 'sets_increased', 'rest_increased', 'rest_reduced', 'exercise_swapped', 'deload_triggered')),
    reason text, -- 'high_rpe', 'low_recovery', 'injury_risk', 'missed_workouts', 'fatigue'
    old_value text,
    new_value text,
    recovery_score numeric,
    rpe numeric,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Exercise search vector (full text search)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exercise_db' AND column_name = 'searchable'
    ) THEN
        ALTER TABLE exercise_db ADD COLUMN searchable tsvector;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_exercise_searchable ON exercise_db USING gin(searchable);
        
        -- Update existing rows
        UPDATE exercise_db
        SET searchable = to_tsvector('english', 
            COALESCE(name, '') || ' ' || 
            COALESCE(muscle_group, '') || ' ' || 
            COALESCE(equipment, '') || ' ' || 
            COALESCE(instructions, '')
        );
        
        -- Create trigger to auto-update searchable
        CREATE OR REPLACE FUNCTION update_exercise_searchable()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.searchable := to_tsvector('english', 
                COALESCE(NEW.name, '') || ' ' || 
                COALESCE(NEW.muscle_group, '') || ' ' || 
                COALESCE(NEW.equipment, '') || ' ' || 
                COALESCE(NEW.instructions, '')
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER exercise_searchable_trigger
        BEFORE INSERT OR UPDATE ON exercise_db
        FOR EACH ROW
        EXECUTE FUNCTION update_exercise_searchable();
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exercise_alternatives_exercise ON exercise_alternatives(exercise_id);
CREATE INDEX IF NOT EXISTS idx_weekly_training_goals_user ON weekly_training_goals(user_id, week_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_auto_regulations_user ON workout_auto_regulations(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE exercise_alternatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_training_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_auto_regulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_alternatives" ON exercise_alternatives FOR SELECT USING (true);
CREATE POLICY "users_own_weekly_goals" ON weekly_training_goals
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_auto_regulations" ON workout_auto_regulations
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RPC: Get exercise alternatives
CREATE OR REPLACE FUNCTION get_exercise_alternatives(p_exercise_id bigint)
RETURNS TABLE (
    alt_exercise_id bigint,
    name text,
    muscle_group text,
    equipment text,
    reason text,
    priority int
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.muscle_group,
        e.equipment,
        ea.reason,
        ea.priority
    FROM exercise_alternatives ea
    JOIN exercise_db e ON e.id = ea.alt_exercise_id
    WHERE ea.exercise_id = p_exercise_id
    ORDER BY ea.priority DESC, e.name;
END;
$$;

-- RPC: Auto-regulate workout based on recovery
CREATE OR REPLACE FUNCTION auto_regulate_workout(
    p_user_id uuid,
    p_workout_log_id bigint,
    p_recovery_score numeric,
    p_rpe numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_regulations jsonb := '[]'::jsonb;
    v_reduction_percent numeric;
BEGIN
    -- If recovery is low, reduce load
    IF p_recovery_score < 50 THEN
        v_reduction_percent := (50 - p_recovery_score) / 50 * 0.3; -- Up to 30% reduction
        
        -- Log regulation
        INSERT INTO workout_auto_regulations (
            user_id, workout_log_id, regulation_type, reason,
            old_value, new_value, recovery_score, rpe
        )
        VALUES (
            p_user_id, p_workout_log_id, 'weight_reduced',
            'Low recovery score: ' || p_recovery_score::text,
            '100%', (100 - (v_reduction_percent * 100))::text || '%',
            p_recovery_score, p_rpe
        );
        
        v_regulations := v_regulations || jsonb_build_object(
            'type', 'weight_reduction',
            'percent', v_reduction_percent * 100,
            'reason', 'Low recovery'
        );
    END IF;
    
    -- If RPE is very high (>9), reduce intensity
    IF p_rpe IS NOT NULL AND p_rpe > 9 THEN
        INSERT INTO workout_auto_regulations (
            user_id, workout_log_id, regulation_type, reason,
            old_value, new_value, recovery_score, rpe
        )
        VALUES (
            p_user_id, p_workout_log_id, 'reps_reduced',
            'Very high RPE: ' || p_rpe::text,
            'target', 'target - 2',
            p_recovery_score, p_rpe
        );
        
        v_regulations := v_regulations || jsonb_build_object(
            'type', 'reps_reduction',
            'amount', 2,
            'reason', 'High RPE'
        );
    END IF;
    
    RETURN v_regulations;
END;
$$;

-- =========================================================
-- WORKOUT ENGINE POLISHING — COMPLETE
-- =========================================================

