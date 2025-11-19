-- =========================================================
-- MODULE 12 — STREAK ENGINE (Unified Cross-Module System)
-- Complete streak system for all app activities: habits, mood, sleep, water, meals, workouts, meditation, etc.
-- =========================================================

-- 1. STREAK TYPES TABLE (System Table) ---------------------
-- Defines what kind of streaks the app supports
CREATE TABLE IF NOT EXISTS streak_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    description text,
    category text,  -- nutrition, fitness, wellness, mood, sleep, water, etc.
    icon text,      -- emoji or icon identifier
    created_at timestamptz DEFAULT now()
);

-- Prepopulate streak types
INSERT INTO streak_types (name, description, category, icon) VALUES
    ('habit', 'Habit completion streak', 'wellness', '✅'),
    ('mood_checkin', 'Daily mood check-in streak', 'wellness', '😊'),
    ('sleep_log', 'Sleep logging streak', 'wellness', '😴'),
    ('water_intake', 'Water intake goal streak', 'nutrition', '💧'),
    ('meal_log', 'Meal logging streak', 'nutrition', '🍽️'),
    ('step_goal', 'Daily step goal streak', 'fitness', '🚶'),
    ('workout', 'Workout completion streak', 'fitness', '🏋️'),
    ('meditation', 'Meditation session streak', 'wellness', '🧘'),
    ('gratitude', 'Gratitude logging streak', 'wellness', '🙏'),
    ('journal', 'Journaling streak', 'wellness', '📔'),
    ('breathing', 'Breathwork session streak', 'wellness', '🌬️'),
    ('mind_game', 'Mind game completion streak', 'wellness', '🎮')
ON CONFLICT (name) DO NOTHING;

-- 2. USER STREAKS TABLE (Master Table) ---------------------
-- Tracks each user + each streak type
CREATE TABLE IF NOT EXISTS user_streaks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    streak_type_id uuid NOT NULL REFERENCES streak_types(id) ON DELETE CASCADE,
    current_streak int DEFAULT 0,
    longest_streak int DEFAULT 0,
    last_logged date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, streak_type_id)
);

-- 3. STREAK EVENTS TABLE (Audit Log) ----------------------
-- Every action that counts toward a streak
CREATE TABLE IF NOT EXISTS streak_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    streak_type_id uuid NOT NULL REFERENCES streak_types(id) ON DELETE CASCADE,
    event_date date NOT NULL,
    source text,               -- habits, workout, meal, mood, sleep, etc.
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- 4. INDEXES ----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_streak_types_name ON streak_types(name);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_type ON user_streaks(streak_type_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_last_logged ON user_streaks(last_logged);
CREATE INDEX IF NOT EXISTS idx_streak_events_user_date ON streak_events(user_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_streak_events_type ON streak_events(streak_type_id);

-- 5. RLS POLICIES ----------------------------------------------
ALTER TABLE streak_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_events ENABLE ROW LEVEL SECURITY;

-- Public read for streak types
CREATE POLICY "Public read streak types" ON streak_types
    FOR SELECT USING (true);

-- Users manage own streaks
CREATE POLICY "Users manage own streaks" ON user_streaks
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users manage own streak events
CREATE POLICY "Users manage own streak events" ON streak_events
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. TRIGGERS ---------------------------------------------------
CREATE TRIGGER update_user_streaks_updated_at
    BEFORE UPDATE ON user_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. RPC FUNCTIONS ---------------------------------------------

-- 7.1 Get streak type ID by name
CREATE OR REPLACE FUNCTION get_streak_type_id(
    p_name text
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_id uuid;
BEGIN
    SELECT id INTO v_id
    FROM streak_types
    WHERE name = p_name;
    
    RETURN v_id;
END;
$$;

-- 7.2 Master function: Log streak event
CREATE OR REPLACE FUNCTION log_streak_event(
    p_user_id uuid,
    p_streak_type_name text,
    p_event_date date DEFAULT CURRENT_DATE,
    p_source text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_streak_type_id uuid;
    v_last_date date;
    v_new_streak int;
    v_prev_streak int;
    v_prev_longest int;
    v_streak_updated boolean := false;
    v_xp_reward int := 0;
BEGIN
    -- Get streak type ID
    SELECT id INTO v_streak_type_id
    FROM streak_types
    WHERE name = p_streak_type_name;
    
    IF v_streak_type_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Streak type "%s" not found', p_streak_type_name)
        );
    END IF;
    
    -- Insert event audit
    INSERT INTO streak_events (
        user_id,
        streak_type_id,
        event_date,
        source,
        metadata
    ) VALUES (
        p_user_id,
        v_streak_type_id,
        p_event_date,
        p_source,
        p_metadata
    );
    
    -- Fetch current streak info
    SELECT last_logged, current_streak, longest_streak
    INTO v_last_date, v_prev_streak, v_prev_longest
    FROM user_streaks
    WHERE user_id = p_user_id
    AND streak_type_id = v_streak_type_id
    FOR UPDATE;
    
    -- If no streak exists → create one
    IF v_last_date IS NULL THEN
        INSERT INTO user_streaks (
            user_id,
            streak_type_id,
            current_streak,
            longest_streak,
            last_logged
        ) VALUES (
            p_user_id,
            v_streak_type_id,
            1,
            1,
            p_event_date
        );
        
        v_new_streak := 1;
        v_streak_updated := true;
        v_xp_reward := 5; -- First day XP
        
        RETURN jsonb_build_object(
            'success', true,
            'streak', 1,
            'status', 'initialized',
            'reward_xp', v_xp_reward,
            'streak_updated', true
        );
    END IF;
    
    -- Same-day log (ignore, but return current streak)
    IF p_event_date = v_last_date THEN
        RETURN jsonb_build_object(
            'success', true,
            'streak', v_prev_streak,
            'status', 'already_counted',
            'streak_updated', false
        );
    END IF;
    
    -- Continuing streak? (consecutive day)
    IF p_event_date = v_last_date + INTERVAL '1 day' THEN
        v_new_streak := v_prev_streak + 1;
        v_streak_updated := true;
        
        -- Calculate XP reward based on streak milestones
        IF v_new_streak = 3 THEN
            v_xp_reward := 15;
        ELSIF v_new_streak = 7 THEN
            v_xp_reward := 50;
        ELSIF v_new_streak = 30 THEN
            v_xp_reward := 300;
        ELSIF v_new_streak = 100 THEN
            v_xp_reward := 500;
        ELSE
            v_xp_reward := 5; -- Daily XP
        END IF;
        
        -- Update streak
        UPDATE user_streaks
        SET
            current_streak = v_new_streak,
            longest_streak = GREATEST(v_prev_longest, v_new_streak),
            last_logged = p_event_date,
            updated_at = now()
        WHERE user_id = p_user_id
        AND streak_type_id = v_streak_type_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'streak', v_new_streak,
            'longest_streak', GREATEST(v_prev_longest, v_new_streak),
            'status', 'updated',
            'reward_xp', v_xp_reward,
            'streak_updated', true
        );
    END IF;
    
    -- Streak broken (gap > 1 day)
    UPDATE user_streaks
    SET
        current_streak = 1,
        last_logged = p_event_date,
        updated_at = now()
    WHERE user_id = p_user_id
    AND streak_type_id = v_streak_type_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'streak', 1,
        'status', 'reset',
        'previous_streak', v_prev_streak,
        'streak_updated', true
    );
END;
$$;

-- 7.3 Get all streaks for a user
CREATE OR REPLACE FUNCTION get_all_user_streaks(
    p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_streaks jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'streak_type', st.name,
            'streak_type_name', st.description,
            'category', st.category,
            'icon', st.icon,
            'current_streak', us.current_streak,
            'longest_streak', us.longest_streak,
            'last_logged', us.last_logged
        )
        ORDER BY us.current_streak DESC
    ) INTO v_streaks
    FROM user_streaks us
    JOIN streak_types st ON st.id = us.streak_type_id
    WHERE us.user_id = p_user_id;
    
    RETURN COALESCE(v_streaks, '[]'::jsonb);
END;
$$;

-- 7.4 Get streak history (calendar view)
CREATE OR REPLACE FUNCTION get_streak_history(
    p_user_id uuid,
    p_streak_type_name text,
    p_start_date date,
    p_end_date date
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_streak_type_id uuid;
    v_history jsonb;
BEGIN
    -- Get streak type ID
    SELECT id INTO v_streak_type_id
    FROM streak_types
    WHERE name = p_streak_type_name;
    
    IF v_streak_type_id IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;
    
    -- Get events in date range
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', event_date,
            'source', source,
            'metadata', metadata
        )
        ORDER BY event_date
    ) INTO v_history
    FROM streak_events
    WHERE user_id = p_user_id
    AND streak_type_id = v_streak_type_id
    AND event_date >= p_start_date
    AND event_date <= p_end_date;
    
    RETURN COALESCE(v_history, '[]'::jsonb);
END;
$$;

-- 7.5 Check if streak is at risk (for notifications)
CREATE OR REPLACE FUNCTION check_streak_at_risk(
    p_user_id uuid,
    p_streak_type_name text
) RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    v_streak_type_id uuid;
    v_last_logged date;
BEGIN
    -- Get streak type ID
    SELECT id INTO v_streak_type_id
    FROM streak_types
    WHERE name = p_streak_type_name;
    
    IF v_streak_type_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Get last logged date
    SELECT last_logged INTO v_last_logged
    FROM user_streaks
    WHERE user_id = p_user_id
    AND streak_type_id = v_streak_type_id;
    
    -- At risk if last logged was yesterday (not today)
    RETURN v_last_logged = CURRENT_DATE - INTERVAL '1 day';
END;
$$;

-- 7.6 Get streaks at risk (for notifications)
CREATE OR REPLACE FUNCTION get_streaks_at_risk(
    p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_at_risk jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'streak_type', st.name,
            'streak_type_name', st.description,
            'icon', st.icon,
            'current_streak', us.current_streak,
            'last_logged', us.last_logged
        )
    ) INTO v_at_risk
    FROM user_streaks us
    JOIN streak_types st ON st.id = us.streak_type_id
    WHERE us.user_id = p_user_id
    AND us.last_logged = CURRENT_DATE - INTERVAL '1 day'
    AND us.current_streak > 0;
    
    RETURN COALESCE(v_at_risk, '[]'::jsonb);
END;
$$;

-- 7.7 Convenience functions for specific streak types
CREATE OR REPLACE FUNCTION log_meal_streak(
    p_user_id uuid,
    p_event_date date DEFAULT CURRENT_DATE
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN log_streak_event(p_user_id, 'meal_log', p_event_date, 'meal', '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION log_water_streak(
    p_user_id uuid,
    p_event_date date DEFAULT CURRENT_DATE
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN log_streak_event(p_user_id, 'water_intake', p_event_date, 'water', '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION log_mood_streak(
    p_user_id uuid,
    p_event_date date DEFAULT CURRENT_DATE
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN log_streak_event(p_user_id, 'mood_checkin', p_event_date, 'mood', '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION log_sleep_streak(
    p_user_id uuid,
    p_event_date date DEFAULT CURRENT_DATE
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN log_streak_event(p_user_id, 'sleep_log', p_event_date, 'sleep', '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION log_workout_streak(
    p_user_id uuid,
    p_event_date date DEFAULT CURRENT_DATE
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN log_streak_event(p_user_id, 'workout', p_event_date, 'workout', '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION log_meditation_streak(
    p_user_id uuid,
    p_event_date date DEFAULT CURRENT_DATE
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN log_streak_event(p_user_id, 'meditation', p_event_date, 'meditation', '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION log_habit_streak(
    p_user_id uuid,
    p_habit_id uuid,
    p_event_date date DEFAULT CURRENT_DATE
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_habit_name text;
BEGIN
    -- Get habit name for metadata
    SELECT title INTO v_habit_name
    FROM habits
    WHERE id = p_habit_id AND user_id = p_user_id;
    
    RETURN log_streak_event(
        p_user_id,
        'habit',
        p_event_date,
        'habit',
        jsonb_build_object('habit_id', p_habit_id, 'habit_name', v_habit_name)
    );
END;
$$;

CREATE OR REPLACE FUNCTION log_step_goal_streak(
    p_user_id uuid,
    p_event_date date DEFAULT CURRENT_DATE
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN log_streak_event(p_user_id, 'step_goal', p_event_date, 'steps', '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION log_journal_streak(
    p_user_id uuid,
    p_event_date date DEFAULT CURRENT_DATE
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN log_streak_event(p_user_id, 'journal', p_event_date, 'journal', '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION log_gratitude_streak(
    p_user_id uuid,
    p_event_date date DEFAULT CURRENT_DATE
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN log_streak_event(p_user_id, 'gratitude', p_event_date, 'gratitude', '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION log_mind_game_streak(
    p_user_id uuid,
    p_event_date date DEFAULT CURRENT_DATE
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN log_streak_event(p_user_id, 'mind_game', p_event_date, 'game', '{}'::jsonb);
END;
$$;

-- =========================================================
-- MODULE 12 — STREAK ENGINE — COMPLETE
-- =========================================================

