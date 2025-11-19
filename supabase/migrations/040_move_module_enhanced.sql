-- =========================================================
-- MOVE MODULE ENHANCED
-- Exercise library, workouts, workout logs, steps tracking
-- =========================================================

-- Note: exercise_db, workout_routines, workout_exercises, workout_logs, steps_logs exist in core schema
-- This migration adds exercise_categories and workout_log_sets for enhanced functionality

-- Exercise categories (push, pull, legs, core, etc.)
CREATE TABLE IF NOT EXISTS exercise_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Pre-populate categories
INSERT INTO exercise_categories (name) VALUES
    ('Push'),
    ('Pull'),
    ('Legs'),
    ('Core'),
    ('Cardio'),
    ('Full Body'),
    ('Upper Body'),
    ('Lower Body'),
    ('Arms'),
    ('Shoulders'),
    ('Back'),
    ('Chest')
ON CONFLICT (name) DO NOTHING;

-- Enhance exercise_db table (add category_id, user_id for custom exercises)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exercise_db' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE exercise_db ADD COLUMN category_id uuid REFERENCES exercise_categories(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exercise_db' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE exercise_db ADD COLUMN user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exercise_db' AND column_name = 'is_custom'
    ) THEN
        ALTER TABLE exercise_db ADD COLUMN is_custom boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exercise_db' AND column_name = 'muscles'
    ) THEN
        ALTER TABLE exercise_db ADD COLUMN muscles text[];
    END IF;
END $$;

-- Workout log sets (detailed set logging with weight, reps, RPE)
-- Note: workout_logs uses bigserial id, so workout_log_id is bigint
CREATE TABLE IF NOT EXISTS workout_log_sets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_log_id bigint NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
    exercise_id bigint NOT NULL REFERENCES exercise_db(id) ON DELETE CASCADE,
    set_number int NOT NULL,
    weight numeric,
    reps int,
    rpe numeric CHECK (rpe BETWEEN 1 AND 10),
    rest_seconds int,
    notes text,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workout_log_sets_log ON workout_log_sets(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_workout_log_sets_exercise ON workout_log_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_db_category ON exercise_db(category_id);
CREATE INDEX IF NOT EXISTS idx_exercise_db_user ON exercise_db(user_id);

-- RLS Policies
ALTER TABLE exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_log_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_categories" ON exercise_categories FOR SELECT USING (true);
CREATE POLICY "users_own_workout_log_sets" ON workout_log_sets
    FOR ALL USING (
        auth.uid() = (
            SELECT user_id FROM workout_logs WHERE id = workout_log_sets.workout_log_id
        )
    ) WITH CHECK (
        auth.uid() = (
            SELECT user_id FROM workout_logs WHERE id = workout_log_sets.workout_log_id
        )
    );

-- =========================================================
-- MOVE MODULE ENHANCED — COMPLETE
-- =========================================================

