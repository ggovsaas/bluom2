-- =========================================================
-- MODULE J PHASE 6B — WEEKLY PERSONALIZATION REVISION
-- Auto-updating personalization based on user behavior
-- =========================================================

-- 1. WEEKLY REVISIONS TABLE -------------------------------------
-- Stores each weekly update and AI analysis
CREATE TABLE IF NOT EXISTS weekly_revisions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start date NOT NULL,
    week_end date NOT NULL,
    summary text,                    -- AI summary of last week
    changes jsonb,                   -- macros, workouts, meals changed
    adherence_score numeric,         -- 0-100: how well user followed plan
    weight_change numeric,           -- kg change from previous week
    calories_avg numeric,            -- average calories consumed
    protein_avg numeric,             -- average protein consumed
    workouts_completed int,           -- number of workouts completed
    sleep_avg numeric,                -- average sleep hours
    mood_avg numeric,                 -- average mood (1-5)
    created_at timestamptz DEFAULT now()
);

-- 2. REVISION SCHEDULE TABLE ------------------------------------
-- Tracks when next revision is due
CREATE TABLE IF NOT EXISTS revision_schedule (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    next_revision date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
    last_revision date,
    revision_count int DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. INDEXES ----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_weekly_revisions_user ON weekly_revisions(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_revision_schedule_user ON revision_schedule(user_id);

-- 4. RLS POLICIES ----------------------------------------------
ALTER TABLE weekly_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own revisions" ON weekly_revisions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own revision schedule" ON revision_schedule
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. TRIGGERS ---------------------------------------------------
CREATE TRIGGER update_revision_schedule_updated_at
    BEFORE UPDATE ON revision_schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. RPC FUNCTIONS ---------------------------------------------

-- 6.1 Check if revision is due
CREATE OR REPLACE FUNCTION is_revision_due(
    p_user_id uuid
) RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    v_schedule revision_schedule%ROWTYPE;
BEGIN
    SELECT * INTO v_schedule 
    FROM revision_schedule 
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- First time, create schedule
        INSERT INTO revision_schedule (user_id, next_revision)
        VALUES (p_user_id, CURRENT_DATE + INTERVAL '7 days');
        RETURN false;
    END IF;
    
    RETURN v_schedule.next_revision <= CURRENT_DATE;
END;
$$;

-- 6.2 Get user data for revision (last 7 days)
CREATE OR REPLACE FUNCTION get_user_revision_data(
    p_user_id uuid,
    p_week_start date DEFAULT (CURRENT_DATE - INTERVAL '7 days')
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_week_end date := p_week_start + INTERVAL '7 days';
    v_meals jsonb;
    v_workouts jsonb;
    v_sleep jsonb;
    v_mood jsonb;
    v_steps jsonb;
    v_habits jsonb;
    v_weight jsonb;
    v_result jsonb;
BEGIN
    -- Get meal logs
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', logged_at,
            'meal', meal,
            'calories', calories,
            'protein', protein,
            'carbs', carbs,
            'fat', fat
        )
    ) INTO v_meals
    FROM meal_logs
    WHERE user_id = p_user_id 
    AND logged_at::date >= p_week_start 
    AND logged_at::date < v_week_end;
    
    -- Get workout logs
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', completed_at::date,
            'workout_id', workout_id,
            'duration_minutes', duration_minutes,
            'calories_burned', calories_burned
        )
    ) INTO v_workouts
    FROM workout_logs
    WHERE user_id = p_user_id 
    AND completed_at::date >= p_week_start 
    AND completed_at::date < v_week_end;
    
    -- Get sleep logs
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', date,
            'hours', duration_minutes / 60.0,
            'quality', sleep_quality_score
        )
    ) INTO v_sleep
    FROM sleep_logs
    WHERE user_id = p_user_id 
    AND date >= p_week_start 
    AND date < v_week_end;
    
    -- Get mood logs
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', created_at::date,
            'mood', mood_value
        )
    ) INTO v_mood
    FROM moods
    WHERE user_id = p_user_id 
    AND created_at::date >= p_week_start 
    AND created_at::date < v_week_end;
    
    -- Get steps
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', date,
            'steps', steps
        )
    ) INTO v_steps
    FROM steps_tracking
    WHERE user_id = p_user_id 
    AND date >= p_week_start 
    AND date < v_week_end;
    
    -- Get habits
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', date,
            'completed', completed
        )
    ) INTO v_habits
    FROM habit_logs
    WHERE user_id = p_user_id 
    AND date >= p_week_start 
    AND date < v_week_end;
    
    -- Build result
    v_result := jsonb_build_object(
        'week_start', p_week_start,
        'week_end', v_week_end,
        'meals', COALESCE(v_meals, '[]'::jsonb),
        'workouts', COALESCE(v_workouts, '[]'::jsonb),
        'sleep', COALESCE(v_sleep, '[]'::jsonb),
        'mood', COALESCE(v_mood, '[]'::jsonb),
        'steps', COALESCE(v_steps, '[]'::jsonb),
        'habits', COALESCE(v_habits, '[]'::jsonb)
    );
    
    RETURN v_result;
END;
$$;

-- 6.3 Save weekly revision
CREATE OR REPLACE FUNCTION save_weekly_revision(
    p_user_id uuid,
    p_week_start date,
    p_week_end date,
    p_summary text,
    p_changes jsonb,
    p_adherence_score numeric,
    p_weight_change numeric,
    p_calories_avg numeric,
    p_protein_avg numeric,
    p_workouts_completed int,
    p_sleep_avg numeric,
    p_mood_avg numeric
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_revision_id uuid;
BEGIN
    INSERT INTO weekly_revisions (
        user_id,
        week_start,
        week_end,
        summary,
        changes,
        adherence_score,
        weight_change,
        calories_avg,
        protein_avg,
        workouts_completed,
        sleep_avg,
        mood_avg
    ) VALUES (
        p_user_id,
        p_week_start,
        p_week_end,
        p_summary,
        p_changes,
        p_adherence_score,
        p_weight_change,
        p_calories_avg,
        p_protein_avg,
        p_workouts_completed,
        p_sleep_avg,
        p_mood_avg
    )
    RETURNING id INTO v_revision_id;
    
    -- Update revision schedule
    UPDATE revision_schedule
    SET 
        last_revision = CURRENT_DATE,
        next_revision = CURRENT_DATE + INTERVAL '7 days',
        revision_count = revision_count + 1,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Create schedule if doesn't exist
    IF NOT FOUND THEN
        INSERT INTO revision_schedule (
            user_id,
            last_revision,
            next_revision,
            revision_count
        ) VALUES (
            p_user_id,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '7 days',
            1
        );
    END IF;
    
    RETURN v_revision_id;
END;
$$;

-- 6.4 Get revision history
CREATE OR REPLACE FUNCTION get_revision_history(
    p_user_id uuid,
    p_limit int DEFAULT 10
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_revisions jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'week_start', week_start,
            'week_end', week_end,
            'summary', summary,
            'changes', changes,
            'adherence_score', adherence_score,
            'weight_change', weight_change,
            'created_at', created_at
        ) ORDER BY week_start DESC
    ) INTO v_revisions
    FROM weekly_revisions
    WHERE user_id = p_user_id
    ORDER BY week_start DESC
    LIMIT p_limit;
    
    RETURN COALESCE(v_revisions, '[]'::jsonb);
END;
$$;

-- =========================================================
-- MODULE J PHASE 6B — COMPLETE
-- =========================================================

