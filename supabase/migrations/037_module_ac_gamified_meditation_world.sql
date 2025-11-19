-- =========================================================
-- MODULE AC — GAMIFIED MEDITATION WORLD (FULL SYSTEM)
-- Worlds, levels, progression, XP, unlocks, and game integration
-- =========================================================

-- 1. MEDITATION WORLDS -------------------------------------

CREATE TABLE IF NOT EXISTS meditation_worlds (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    thumbnail_url text,
    background_url text,
    is_locked boolean DEFAULT true,
    unlock_xp integer DEFAULT 0,
    unlock_level integer DEFAULT 1,
    order_index int DEFAULT 0,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Pre-populate worlds
INSERT INTO meditation_worlds (name, description, is_locked, unlock_xp, unlock_level, order_index) VALUES
    ('Forest Realm', 'Calm and grounding meditations in a peaceful forest', false, 0, 1, 1),
    ('Ocean Realm', 'Deep breathing and flow meditations by the ocean', true, 100, 2, 2),
    ('Volcano Realm', 'Stress release and energy meditations', true, 300, 5, 3),
    ('Sky Realm', 'Focus and clarity meditations in the clouds', true, 500, 8, 4),
    ('Ice Realm', 'Cold mind and discipline meditations', true, 1000, 12, 5)
ON CONFLICT DO NOTHING;

-- 2. MEDITATION LEVELS ------------------------------------

CREATE TABLE IF NOT EXISTS meditation_levels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id uuid NOT NULL REFERENCES meditation_worlds(id) ON DELETE CASCADE,
    level_number integer NOT NULL,
    name text NOT NULL,
    description text,
    duration_minutes integer DEFAULT 5,
    soundscape_url text,
    script_url text,
    xp_reward integer DEFAULT 20,
    difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'easy',
    is_locked boolean DEFAULT true,
    unlock_previous_level boolean DEFAULT true,
    order_index int DEFAULT 0,
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(world_id, level_number)
);

-- Pre-populate levels for Forest Realm (Level 1 is unlocked by default)
INSERT INTO meditation_levels (world_id, level_number, name, description, duration_minutes, xp_reward, difficulty, is_locked, order_index)
SELECT 
    mw.id,
    level_data.level_number,
    level_data.name,
    level_data.description,
    level_data.duration_minutes,
    level_data.xp_reward,
    level_data.difficulty,
    level_data.is_locked,
    level_data.level_number
FROM meditation_worlds mw
CROSS JOIN (VALUES
    (1, 'Grounding Calm', 'Begin your journey with a grounding meditation', 5, 20, 'easy', false),
    (2, 'Breath Awareness', 'Learn to focus on your breath', 7, 25, 'easy', true),
    (3, 'Body Scan', 'Scan your body for tension and release', 10, 30, 'medium', true),
    (4, 'Visualization', 'Visualize peace and calm', 12, 35, 'medium', true),
    (5, 'Deep Calm', 'Achieve deep relaxation', 15, 50, 'hard', true)
) AS level_data(level_number, name, description, duration_minutes, xp_reward, difficulty, is_locked)
WHERE mw.name = 'Forest Realm'
ON CONFLICT DO NOTHING;

-- 3. MEDITATION SESSIONS (Enhanced) -----------------------

CREATE TABLE IF NOT EXISTS meditation_sessions_ac (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    level_id uuid REFERENCES meditation_levels(id) ON DELETE SET NULL,
    world_id uuid REFERENCES meditation_worlds(id) ON DELETE SET NULL,
    started_at timestamptz DEFAULT timezone('utc', now()),
    completed_at timestamptz,
    duration_seconds integer,
    xp_earned integer DEFAULT 0,
    mood_before text,
    mood_after text,
    stress_before integer CHECK (stress_before BETWEEN 1 AND 10),
    stress_after integer CHECK (stress_after BETWEEN 1 AND 10),
    completed boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- 4. MIND GAMES (Enhanced - if not exists) -----------------

-- Note: mind_games already exists in Module C/O, we just ensure it has needed columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mind_games' AND column_name = 'type') THEN
        ALTER TABLE mind_games ADD COLUMN type text CHECK (type IN ('focus', 'reaction', 'memory', 'calm', 'breathing'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mind_games' AND column_name = 'xp_reward') THEN
        ALTER TABLE mind_games ADD COLUMN xp_reward integer DEFAULT 10;
    END IF;
END $$;

-- 5. MIND GAME SESSIONS (Enhanced) ------------------------

-- Note: mind_game_sessions already exists in Module C/O, we just ensure it has needed columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mind_game_sessions' AND column_name = 'xp_earned') THEN
        ALTER TABLE mind_game_sessions ADD COLUMN xp_earned integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mind_game_sessions' AND column_name = 'duration_seconds') THEN
        ALTER TABLE mind_game_sessions ADD COLUMN duration_seconds integer;
    END IF;
END $$;

-- 6. MEDITATION USER PROGRESS -----------------------------

CREATE TABLE IF NOT EXISTS meditation_user_progress (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_xp integer DEFAULT 0,
    current_world_id uuid REFERENCES meditation_worlds(id),
    current_level_id uuid REFERENCES meditation_levels(id),
    levels_completed integer DEFAULT 0,
    worlds_unlocked integer DEFAULT 0,
    meditation_streak integer DEFAULT 0,
    games_streak integer DEFAULT 0,
    total_meditation_minutes integer DEFAULT 0,
    total_game_sessions integer DEFAULT 0,
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- 7. WORLD UNLOCKS (Track which worlds user has unlocked) --

CREATE TABLE IF NOT EXISTS world_unlocks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    world_id uuid NOT NULL REFERENCES meditation_worlds(id) ON DELETE CASCADE,
    unlocked_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, world_id)
);

-- 8. LEVEL COMPLETIONS (Track which levels user has completed) --

CREATE TABLE IF NOT EXISTS level_completions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    level_id uuid NOT NULL REFERENCES meditation_levels(id) ON DELETE CASCADE,
    world_id uuid NOT NULL REFERENCES meditation_worlds(id) ON DELETE CASCADE,
    completed_at timestamptz DEFAULT timezone('utc', now()),
    xp_earned integer DEFAULT 0,
    mood_improvement integer, -- mood_after - mood_before
    stress_reduction integer, -- stress_before - stress_after
    UNIQUE(user_id, level_id)
);

-- 9. INDEXES ------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_meditation_levels_world ON meditation_levels(world_id, level_number);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_ac_user ON meditation_sessions_ac(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_ac_level ON meditation_sessions_ac(level_id);
CREATE INDEX IF NOT EXISTS idx_world_unlocks_user ON world_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_level_completions_user ON level_completions(user_id, world_id);
CREATE INDEX IF NOT EXISTS idx_meditation_worlds_order ON meditation_worlds(order_index);

-- 10. RLS POLICIES -----------------------------------------

ALTER TABLE meditation_worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_sessions_ac ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_worlds" ON meditation_worlds FOR SELECT USING (true);
CREATE POLICY "public_read_levels" ON meditation_levels FOR SELECT USING (true);
CREATE POLICY "users_manage_own_sessions" ON meditation_sessions_ac FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_manage_own_progress" ON meditation_user_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_manage_own_world_unlocks" ON world_unlocks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_manage_own_level_completions" ON level_completions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11. RPC FUNCTIONS ----------------------------------------

-- AC-RPC1: get_user_worlds(user_id)
-- Gets all worlds with unlock status
CREATE OR REPLACE FUNCTION get_user_worlds(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    user_progress_record RECORD;
    worlds_result jsonb;
BEGIN
    -- Get user progress
    SELECT * INTO user_progress_record
    FROM meditation_user_progress
    WHERE user_id = p_user_id;
    
    -- If no progress, initialize
    IF NOT FOUND THEN
        INSERT INTO meditation_user_progress (user_id)
        VALUES (p_user_id)
        RETURNING * INTO user_progress_record;
        
        -- Unlock first world
        INSERT INTO world_unlocks (user_id, world_id)
        SELECT p_user_id, id
        FROM meditation_worlds
        WHERE is_locked = false
        ORDER BY order_index
        LIMIT 1
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Get all worlds with unlock status
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', mw.id,
            'name', mw.name,
            'description', mw.description,
            'thumbnail_url', mw.thumbnail_url,
            'background_url', mw.background_url,
            'unlock_xp', mw.unlock_xp,
            'unlock_level', mw.unlock_level,
            'order_index', mw.order_index,
            'is_unlocked', EXISTS(
                SELECT 1 FROM world_unlocks 
                WHERE user_id = p_user_id AND world_id = mw.id
            ),
            'can_unlock', (
                COALESCE(user_progress_record.total_xp, 0) >= mw.unlock_xp AND
                COALESCE(user_progress_record.levels_completed, 0) >= mw.unlock_level
            )
        )
        ORDER BY mw.order_index
    ) INTO worlds_result
    FROM meditation_worlds mw;
    
    RETURN COALESCE(worlds_result, '[]'::jsonb);
END;
$$;

-- AC-RPC2: get_world_levels(user_id, world_id)
-- Gets all levels for a world with completion status
CREATE OR REPLACE FUNCTION get_world_levels(
    p_user_id uuid,
    p_world_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    levels_result jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', ml.id,
            'level_number', ml.level_number,
            'name', ml.name,
            'description', ml.description,
            'duration_minutes', ml.duration_minutes,
            'soundscape_url', ml.soundscape_url,
            'script_url', ml.script_url,
            'xp_reward', ml.xp_reward,
            'difficulty', ml.difficulty,
            'is_locked', ml.is_locked,
            'is_completed', EXISTS(
                SELECT 1 FROM level_completions
                WHERE user_id = p_user_id AND level_id = ml.id
            ),
            'can_unlock', (
                ml.level_number = 1 OR EXISTS(
                    SELECT 1 FROM level_completions
                    WHERE user_id = p_user_id 
                    AND world_id = p_world_id
                    AND level_id IN (
                        SELECT id FROM meditation_levels
                        WHERE world_id = p_world_id
                        AND level_number = ml.level_number - 1
                    )
                )
            )
        )
        ORDER BY ml.level_number
    ) INTO levels_result
    FROM meditation_levels ml
    WHERE ml.world_id = p_world_id;
    
    RETURN COALESCE(levels_result, '[]'::jsonb);
END;
$$;

-- AC-RPC3: start_meditation_session(user_id, level_id)
CREATE OR REPLACE FUNCTION start_meditation_session(
    p_user_id uuid,
    p_level_id uuid,
    p_mood_before text DEFAULT NULL,
    p_stress_before int DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    session_id uuid;
    level_record RECORD;
BEGIN
    -- Get level details
    SELECT * INTO level_record
    FROM meditation_levels
    WHERE id = p_level_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Level not found';
    END IF;
    
    -- Create session
    INSERT INTO meditation_sessions_ac (
        user_id, level_id, world_id, mood_before, stress_before
    )
    VALUES (
        p_user_id, p_level_id, level_record.world_id, p_mood_before, p_stress_before
    )
    RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$;

-- AC-RPC4: complete_meditation_session(session_id, mood_after, stress_after, duration_seconds)
CREATE OR REPLACE FUNCTION complete_meditation_session(
    p_session_id uuid,
    p_mood_after text DEFAULT NULL,
    p_stress_after int DEFAULT NULL,
    p_duration_seconds int DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    session_record RECORD;
    level_record RECORD;
    xp_earned int;
    mood_improvement int;
    stress_reduction int;
    is_first_completion boolean;
    new_world_unlocked boolean := false;
BEGIN
    -- Get session
    SELECT * INTO session_record
    FROM meditation_sessions_ac
    WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session not found');
    END IF;
    
    -- Get level details
    SELECT * INTO level_record
    FROM meditation_levels
    WHERE id = session_record.level_id;
    
    -- Calculate XP (base + mood improvement bonus)
    xp_earned := level_record.xp_reward;
    
    -- Mood improvement bonus
    IF session_record.mood_before IS NOT NULL AND p_mood_after IS NOT NULL THEN
        IF p_mood_after > session_record.mood_before THEN
            xp_earned := xp_earned + 10;
        END IF;
    END IF;
    
    -- Stress reduction bonus
    IF session_record.stress_before IS NOT NULL AND p_stress_after IS NOT NULL THEN
        stress_reduction := session_record.stress_before - p_stress_after;
        IF stress_reduction > 0 THEN
            xp_earned := xp_earned + (stress_reduction * 2);
        END IF;
    END IF;
    
    -- Check if first completion
    SELECT NOT EXISTS(
        SELECT 1 FROM level_completions
        WHERE user_id = session_record.user_id AND level_id = session_record.level_id
    ) INTO is_first_completion;
    
    -- Update session
    UPDATE meditation_sessions_ac
    SET 
        completed_at = timezone('utc', now()),
        completed = true,
        duration_seconds = COALESCE(p_duration_seconds, EXTRACT(EPOCH FROM (timezone('utc', now()) - started_at))::int),
        mood_after = p_mood_after,
        stress_after = p_stress_after,
        xp_earned = xp_earned
    WHERE id = p_session_id;
    
    -- Record level completion (if first time)
    IF is_first_completion THEN
        INSERT INTO level_completions (
            user_id, level_id, world_id, xp_earned, mood_improvement, stress_reduction
        )
        VALUES (
            session_record.user_id,
            session_record.level_id,
            session_record.world_id,
            xp_earned,
            CASE WHEN p_mood_after > session_record.mood_before THEN 1 ELSE 0 END,
            COALESCE(stress_reduction, 0)
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Update user progress
    UPDATE meditation_user_progress
    SET 
        total_xp = COALESCE(total_xp, 0) + xp_earned,
        levels_completed = (
            SELECT COUNT(*) FROM level_completions
            WHERE user_id = session_record.user_id
        ),
        total_meditation_minutes = COALESCE(total_meditation_minutes, 0) + 
            COALESCE(p_duration_seconds, 0) / 60,
        current_world_id = session_record.world_id,
        current_level_id = session_record.level_id,
        updated_at = timezone('utc', now())
    WHERE user_id = session_record.user_id;
    
    -- Check for world unlocks
    DECLARE
        unlocked_world_id uuid;
    BEGIN
        SELECT mw.id INTO unlocked_world_id
        FROM meditation_worlds mw
        WHERE mw.id NOT IN (
            SELECT world_id FROM world_unlocks WHERE user_id = session_record.user_id
        )
        AND (
            SELECT total_xp FROM meditation_user_progress WHERE user_id = session_record.user_id
        ) >= mw.unlock_xp
        AND (
            SELECT levels_completed FROM meditation_user_progress WHERE user_id = session_record.user_id
        ) >= mw.unlock_level
        ORDER BY mw.order_index
        LIMIT 1;
        
        IF unlocked_world_id IS NOT NULL THEN
            INSERT INTO world_unlocks (user_id, world_id)
            VALUES (session_record.user_id, unlocked_world_id)
            ON CONFLICT DO NOTHING;
            
            UPDATE meditation_user_progress
            SET worlds_unlocked = (
                SELECT COUNT(*) FROM world_unlocks WHERE user_id = session_record.user_id
            )
            WHERE user_id = session_record.user_id;
            
            new_world_unlocked := true;
        END IF;
    END;
    
    -- Award XP to Module J's mind_garden_state (if exists)
    BEGIN
        PERFORM add_xp(
            session_record.user_id,
            xp_earned,
            'meditation',
            p_session_id,
            format('Completed %s', level_record.name)
        );
    EXCEPTION WHEN OTHERS THEN
        -- Module J might not be applied, ignore
        NULL;
    END;
    
    -- Update meditation streak (Module 12)
    BEGIN
        PERFORM log_meditation_streak(session_record.user_id);
    EXCEPTION WHEN OTHERS THEN
        -- Module 12 might not be applied, ignore
        NULL;
    END;
    
    RETURN jsonb_build_object(
        'success', true,
        'xp_earned', xp_earned,
        'level_completed', is_first_completion,
        'world_unlocked', new_world_unlocked,
        'unlocked_world_id', unlocked_world_id
    );
END;
$$;

-- AC-RPC5: get_user_progress(user_id)
CREATE OR REPLACE FUNCTION get_user_progress(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    progress_record RECORD;
BEGIN
    SELECT * INTO progress_record
    FROM meditation_user_progress
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- Initialize
        INSERT INTO meditation_user_progress (user_id)
        VALUES (p_user_id)
        RETURNING * INTO progress_record;
        
        -- Unlock first world
        INSERT INTO world_unlocks (user_id, world_id)
        SELECT p_user_id, id
        FROM meditation_worlds
        WHERE is_locked = false
        ORDER BY order_index
        LIMIT 1
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN jsonb_build_object(
        'total_xp', COALESCE(progress_record.total_xp, 0),
        'current_world_id', progress_record.current_world_id,
        'current_level_id', progress_record.current_level_id,
        'levels_completed', COALESCE(progress_record.levels_completed, 0),
        'worlds_unlocked', COALESCE(progress_record.worlds_unlocked, 0),
        'meditation_streak', COALESCE(progress_record.meditation_streak, 0),
        'games_streak', COALESCE(progress_record.games_streak, 0),
        'total_meditation_minutes', COALESCE(progress_record.total_meditation_minutes, 0),
        'total_game_sessions', COALESCE(progress_record.total_game_sessions, 0)
    );
END;
$$;

-- AC-RPC6: unlock_world(user_id, world_id)
CREATE OR REPLACE FUNCTION unlock_world(
    p_user_id uuid,
    p_world_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    world_record RECORD;
    progress_record RECORD;
    can_unlock boolean := false;
BEGIN
    -- Get world details
    SELECT * INTO world_record
    FROM meditation_worlds
    WHERE id = p_world_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'World not found');
    END IF;
    
    -- Check if already unlocked
    IF EXISTS(SELECT 1 FROM world_unlocks WHERE user_id = p_user_id AND world_id = p_world_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'World already unlocked');
    END IF;
    
    -- Get user progress
    SELECT * INTO progress_record
    FROM meditation_user_progress
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User progress not found');
    END IF;
    
    -- Check unlock requirements
    can_unlock := (
        COALESCE(progress_record.total_xp, 0) >= world_record.unlock_xp AND
        COALESCE(progress_record.levels_completed, 0) >= world_record.unlock_level
    );
    
    IF NOT can_unlock THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Requirements not met',
            'required_xp', world_record.unlock_xp,
            'required_levels', world_record.unlock_level,
            'current_xp', progress_record.total_xp,
            'current_levels', progress_record.levels_completed
        );
    END IF;
    
    -- Unlock world
    INSERT INTO world_unlocks (user_id, world_id)
    VALUES (p_user_id, p_world_id)
    ON CONFLICT DO NOTHING;
    
    -- Update progress
    UPDATE meditation_user_progress
    SET 
        worlds_unlocked = (
            SELECT COUNT(*) FROM world_unlocks WHERE user_id = p_user_id
        ),
        updated_at = timezone('utc', now())
    WHERE user_id = p_user_id;
    
    RETURN jsonb_build_object('success', true, 'world_id', p_world_id);
END;
$$;

-- AC-RPC7: complete_game_session(user_id, game_id, score, duration_seconds)
CREATE OR REPLACE FUNCTION complete_game_session(
    p_user_id uuid,
    p_game_id uuid,
    p_score int DEFAULT NULL,
    p_duration_seconds int DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    game_record RECORD;
    xp_earned int;
BEGIN
    -- Get game details
    SELECT * INTO game_record
    FROM mind_games
    WHERE id = p_game_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Game not found');
    END IF;
    
    -- Calculate XP (base + score bonus)
    xp_earned := COALESCE(game_record.xp_reward, 10);
    
    -- Score bonus (if score is high)
    IF p_score IS NOT NULL AND p_score > 80 THEN
        xp_earned := xp_earned + 10;
    ELSIF p_score IS NOT NULL AND p_score > 60 THEN
        xp_earned := xp_earned + 5;
    END IF;
    
    -- Log game session (use existing table from Module C/O)
    INSERT INTO mind_game_sessions (
        user_id, game_id, score, duration_seconds, xp_earned, completed_at
    )
    VALUES (
        p_user_id, p_game_id, p_score, p_duration_seconds, xp_earned, timezone('utc', now())
    )
    ON CONFLICT DO NOTHING;
    
    -- Update user progress
    UPDATE meditation_user_progress
    SET 
        total_xp = COALESCE(total_xp, 0) + xp_earned,
        total_game_sessions = COALESCE(total_game_sessions, 0) + 1,
        updated_at = timezone('utc', now())
    WHERE user_id = p_user_id;
    
    -- Award XP to Module J's mind_garden_state (if exists)
    BEGIN
        PERFORM add_xp(
            p_user_id,
            xp_earned,
            'game',
            p_game_id,
            format('Completed %s', game_record.name)
        );
    EXCEPTION WHEN OTHERS THEN
        -- Module J might not be applied, ignore
        NULL;
    END;
    
    -- Update game streak (Module 12)
    BEGIN
        PERFORM log_mind_game_streak(p_user_id);
    EXCEPTION WHEN OTHERS THEN
        -- Module 12 might not be applied, ignore
        NULL;
    END;
    
    RETURN jsonb_build_object(
        'success', true,
        'xp_earned', xp_earned
    );
END;
$$;

-- 12. TRIGGERS ---------------------------------------------

CREATE OR REPLACE FUNCTION update_meditation_user_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meditation_user_progress_timestamp
BEFORE UPDATE ON meditation_user_progress
FOR EACH ROW
EXECUTE FUNCTION update_meditation_user_progress_timestamp();

-- =========================================================
-- MODULE AC — GAMIFIED MEDITATION WORLD — COMPLETE
-- =========================================================

