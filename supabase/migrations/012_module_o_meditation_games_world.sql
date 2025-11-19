-- =========================================================
-- MODULE O — MEDITATION + MIND GAMES WORLD
-- Meditation catalog, soundscapes, game scores, progress tracking, personalization
-- =========================================================

-- 1. ENHANCE EXISTING TABLES (from Module C) --------------

-- Enhance mind_games if needed
DO $$
BEGIN
    -- Add difficulty if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mind_games' AND column_name = 'difficulty'
    ) THEN
        ALTER TABLE mind_games ADD COLUMN difficulty text DEFAULT 'medium';
    END IF;
    
    -- Add premium flag if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mind_games' AND column_name = 'premium'
    ) THEN
        ALTER TABLE mind_games ADD COLUMN premium boolean DEFAULT false;
    END IF;
    
    -- Add thumbnail_url if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mind_games' AND column_name = 'thumbnail_url'
    ) THEN
        ALTER TABLE mind_games ADD COLUMN thumbnail_url text;
    END IF;
    
    -- Rename title to name if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mind_games' AND column_name = 'title'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mind_games' AND column_name = 'name'
    ) THEN
        ALTER TABLE mind_games RENAME COLUMN title TO name;
    END IF;
END $$;

-- Enhance mind_game_sessions if needed
DO $$
BEGIN
    -- Add reaction_time_ms if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mind_game_sessions' AND column_name = 'reaction_time_ms'
    ) THEN
        ALTER TABLE mind_game_sessions ADD COLUMN reaction_time_ms int;
    END IF;
    
    -- Add accuracy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mind_game_sessions' AND column_name = 'accuracy'
    ) THEN
        ALTER TABLE mind_game_sessions ADD COLUMN accuracy numeric;
    END IF;
    
    -- Rename created_at to completed_at if needed (for consistency)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mind_game_sessions' AND column_name = 'created_at'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mind_game_sessions' AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE mind_game_sessions ADD COLUMN completed_at timestamptz DEFAULT timezone('utc', now());
        UPDATE mind_game_sessions SET completed_at = created_at;
    END IF;
END $$;

-- 2. NEW TABLES -------------------------------------------

-- O1 — meditation_catalog
-- Catalog of available meditation sessions (separate from user logs)
CREATE TABLE IF NOT EXISTS meditation_catalog (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    category text NOT NULL, -- sleep, stress, focus, anxiety, mindfulness, gratitude, breathwork
    duration_minutes int NOT NULL,
    audio_url text,
    image_url text,
    premium boolean DEFAULT true,
    difficulty text DEFAULT 'beginner', -- beginner, intermediate, advanced
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- O2 — meditation_logs
-- Tracks when a user completes a meditation (enhances Module C's meditation_sessions)
CREATE TABLE IF NOT EXISTS meditation_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id uuid REFERENCES meditation_catalog(id),
    duration_minutes int,
    completed boolean DEFAULT true,
    completed_at timestamptz DEFAULT timezone('utc', now())
);

-- O3 — soundscapes
-- Catalog of soundscapes
CREATE TABLE IF NOT EXISTS soundscapes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    category text NOT NULL, -- rain, ocean, white_noise, wind, forest, night, city, cafe
    audio_url text NOT NULL,
    image_url text,
    premium boolean DEFAULT false,
    duration_minutes int, -- null for loop
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- O4 — soundscape_logs
-- Tracks soundscape usage
CREATE TABLE IF NOT EXISTS soundscape_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    soundscape_id uuid REFERENCES soundscapes(id),
    duration_minutes int,
    played_at timestamptz DEFAULT timezone('utc', now())
);

-- O5 — meditation_streaks
-- Tracks meditation streaks for gamification
CREATE TABLE IF NOT EXISTS meditation_streaks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    current_streak int DEFAULT 0,
    longest_streak int DEFAULT 0,
    last_meditation_date date,
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- O6 — game_leaderboards (optional, for social features)
CREATE TABLE IF NOT EXISTS game_leaderboards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id uuid REFERENCES mind_games(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    score int NOT NULL,
    reaction_time_ms int,
    accuracy numeric,
    rank int,
    achieved_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(game_id, user_id)
);

-- 3. RLS (Row-Level Security) ----------------------------

ALTER TABLE meditation_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE soundscapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE soundscape_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_leaderboards ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read meditation catalog (free + premium marked)
CREATE POLICY "public_read_meditation_catalog"
ON meditation_catalog
FOR SELECT
USING (true);

CREATE POLICY "users_manage_own_meditation_logs"
ON meditation_logs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Everyone can read soundscapes
CREATE POLICY "public_read_soundscapes"
ON soundscapes
FOR SELECT
USING (true);

CREATE POLICY "users_manage_own_soundscape_logs"
ON soundscape_logs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_streaks"
ON meditation_streaks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Leaderboards: users can see all, but only update their own
CREATE POLICY "public_read_leaderboards"
ON game_leaderboards
FOR SELECT
USING (true);

CREATE POLICY "users_update_own_leaderboard"
ON game_leaderboards
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. INDEXES ----------------------------------------------

CREATE INDEX IF NOT EXISTS idx_meditation_catalog_category ON meditation_catalog(category);
CREATE INDEX IF NOT EXISTS idx_meditation_catalog_premium ON meditation_catalog(premium);
CREATE INDEX IF NOT EXISTS idx_meditation_logs_user_date ON meditation_logs(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_soundscapes_category ON soundscapes(category);
CREATE INDEX IF NOT EXISTS idx_soundscape_logs_user_date ON soundscape_logs(user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_leaderboards_game_score ON game_leaderboards(game_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_mind_game_sessions_user_game ON mind_game_sessions(user_id, game_id);

-- 5. RPC FUNCTIONS ---------------------------------------

-- O-RPC1 — log_meditation_session(user_id, session_id, duration_minutes)
-- Log a completed meditation session
CREATE OR REPLACE FUNCTION log_meditation_session(
    user_id_param uuid,
    session_id_param uuid,
    duration_minutes_param int
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    log_id uuid;
BEGIN
    INSERT INTO meditation_logs (user_id, session_id, duration_minutes)
    VALUES (user_id_param, session_id_param, duration_minutes_param)
    RETURNING id INTO log_id;
    
    -- Update streak
    PERFORM update_meditation_streak(user_id_param);
    
    RETURN log_id;
END;
$$;

-- O-RPC2 — update_meditation_streak(user_id)
-- Updates meditation streak based on logs
CREATE OR REPLACE FUNCTION update_meditation_streak(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_streak_val int := 0;
    longest_streak_val int := 0;
    last_date date;
    check_date date := CURRENT_DATE;
    has_meditation boolean;
BEGIN
    -- Get current streak info
    SELECT current_streak, longest_streak, last_meditation_date
    INTO current_streak_val, longest_streak_val, last_date
    FROM meditation_streaks
    WHERE user_id = user_id_param;
    
    -- Check if meditated today
    SELECT EXISTS (
        SELECT 1 FROM meditation_logs
        WHERE user_id = user_id_param
          AND DATE(completed_at) = CURRENT_DATE
    ) INTO has_meditation;
    
    IF has_meditation THEN
        -- Check if streak continues
        IF last_date IS NULL OR last_date = CURRENT_DATE - INTERVAL '1 day' THEN
            -- Streak continues
            current_streak_val := COALESCE(current_streak_val, 0) + 1;
        ELSIF last_date < CURRENT_DATE - INTERVAL '1 day' THEN
            -- Streak broken, restart
            current_streak_val := 1;
        END IF;
        
        -- Update longest streak
        IF current_streak_val > longest_streak_val THEN
            longest_streak_val := current_streak_val;
        END IF;
        
        -- Upsert streak
        INSERT INTO meditation_streaks (user_id, current_streak, longest_streak, last_meditation_date)
        VALUES (user_id_param, current_streak_val, longest_streak_val, CURRENT_DATE)
        ON CONFLICT (user_id) DO UPDATE
        SET current_streak = EXCLUDED.current_streak,
            longest_streak = EXCLUDED.longest_streak,
            last_meditation_date = EXCLUDED.last_meditation_date,
            updated_at = timezone('utc', now());
    END IF;
END;
$$;

-- O-RPC3 — log_soundscape(user_id, soundscape_id, duration_minutes)
-- Log soundscape usage
CREATE OR REPLACE FUNCTION log_soundscape(
    user_id_param uuid,
    soundscape_id_param uuid,
    duration_minutes_param int DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    log_id uuid;
BEGIN
    INSERT INTO soundscape_logs (user_id, soundscape_id, duration_minutes)
    VALUES (user_id_param, soundscape_id_param, duration_minutes_param)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- O-RPC4 — log_game_score(user_id, game_id, score, reaction_time_ms, accuracy)
-- Log game session with detailed metrics
CREATE OR REPLACE FUNCTION log_game_score(
    user_id_param uuid,
    game_id_param uuid,
    score_param int,
    reaction_time_ms_param int DEFAULT NULL,
    accuracy_param numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    session_id uuid;
    current_best_score int;
BEGIN
    -- Insert game session
    INSERT INTO mind_game_sessions (
        user_id, game_id, score, reaction_time_ms, accuracy, metrics
    )
    VALUES (
        user_id_param, game_id_param, score_param, 
        reaction_time_ms_param, accuracy_param,
        jsonb_build_object(
            'reaction_time_ms', reaction_time_ms_param,
            'accuracy', accuracy_param
        )
    )
    RETURNING id INTO session_id;
    
    -- Update leaderboard if this is a new best
    SELECT COALESCE(MAX(score), 0) INTO current_best_score
    FROM game_leaderboards
    WHERE game_id = game_id_param AND user_id = user_id_param;
    
    IF score_param > current_best_score THEN
        INSERT INTO game_leaderboards (game_id, user_id, score, reaction_time_ms, accuracy)
        VALUES (game_id_param, user_id_param, score_param, reaction_time_ms_param, accuracy_param)
        ON CONFLICT (game_id, user_id) DO UPDATE
        SET score = EXCLUDED.score,
            reaction_time_ms = EXCLUDED.reaction_time_ms,
            accuracy = EXCLUDED.accuracy,
            achieved_at = timezone('utc', now());
    END IF;
    
    RETURN session_id;
END;
$$;

-- O-RPC5 — get_meditation_recommendations(user_id)
-- Get personalized meditation recommendations
CREATE OR REPLACE FUNCTION get_meditation_recommendations(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    mood_val text;
    sleep_val numeric;
    stress_level int;
    recommendations jsonb := '[]'::jsonb;
BEGIN
    -- Get latest mood and sleep
    SELECT 
        CASE 
            WHEN mood_value = 1 THEN 'very_low'
            WHEN mood_value = 2 THEN 'low'
            WHEN mood_value = 3 THEN 'neutral'
            WHEN mood_value = 4 THEN 'good'
            WHEN mood_value = 5 THEN 'great'
            ELSE NULL
        END,
        hours
    INTO mood_val, sleep_val
    FROM (
        SELECT mood_value, created_at
        FROM moods
        WHERE user_id = user_id_param
        ORDER BY created_at DESC
        LIMIT 1
    ) m
    LEFT JOIN LATERAL (
        SELECT hours
        FROM sleep_logs
        WHERE user_id = user_id_param
        ORDER BY created_at DESC
        LIMIT 1
    ) s ON true;
    
    -- Generate recommendations based on state
    IF sleep_val IS NOT NULL AND sleep_val < 6 THEN
        recommendations := recommendations || jsonb_build_array(
            jsonb_build_object(
                'type', 'meditation',
                'category', 'sleep',
                'reason', 'You slept less than 6 hours. Try a sleep meditation.'
            )
        );
    END IF;
    
    IF mood_val IN ('low', 'very_low') THEN
        recommendations := recommendations || jsonb_build_array(
            jsonb_build_object(
                'type', 'meditation',
                'category', 'gratitude',
                'reason', 'Your mood is lower today. A gratitude meditation can help.'
            )
        );
    END IF;
    
    IF mood_val = 'stressed' OR stress_level > 3 THEN
        recommendations := recommendations || jsonb_build_array(
            jsonb_build_object(
                'type', 'meditation',
                'category', 'stress',
                'reason', 'You seem stressed. Try a calming meditation.'
            )
        );
    END IF;
    
    RETURN recommendations;
END;
$$;

-- O-RPC6 — get_user_meditation_stats(user_id)
-- Get meditation statistics for progress dashboard
CREATE OR REPLACE FUNCTION get_user_meditation_stats(user_id_param uuid)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_build_object(
        'total_minutes', COALESCE(SUM(duration_minutes), 0),
        'total_sessions', COUNT(*),
        'current_streak', COALESCE(
            (SELECT current_streak FROM meditation_streaks WHERE user_id = user_id_param),
            0
        ),
        'longest_streak', COALESCE(
            (SELECT longest_streak FROM meditation_streaks WHERE user_id = user_id_param),
            0
        ),
        'this_week_sessions', COUNT(*) FILTER (
            WHERE completed_at >= CURRENT_DATE - INTERVAL '7 days'
        ),
        'this_week_minutes', COALESCE(
            SUM(duration_minutes) FILTER (
                WHERE completed_at >= CURRENT_DATE - INTERVAL '7 days'
            ),
            0
        )
    )
    FROM meditation_logs
    WHERE user_id = user_id_param;
$$;

-- O-RPC7 — get_user_game_stats(user_id, game_id)
-- Get game statistics for a specific game
CREATE OR REPLACE FUNCTION get_user_game_stats(
    user_id_param uuid,
    game_id_param uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_build_object(
        'total_games_played', COUNT(*),
        'best_score', MAX(score),
        'avg_score', ROUND(AVG(score)::numeric, 2),
        'best_reaction_time', MIN(reaction_time_ms),
        'avg_reaction_time', ROUND(AVG(reaction_time_ms)::numeric, 2),
        'best_accuracy', MAX(accuracy),
        'avg_accuracy', ROUND(AVG(accuracy)::numeric, 2),
        'games_this_week', COUNT(*) FILTER (
            WHERE completed_at >= CURRENT_DATE - INTERVAL '7 days'
        )
    )
    FROM mind_game_sessions
    WHERE user_id = user_id_param
      AND (game_id_param IS NULL OR game_id = game_id_param);
$$;

-- O-RPC8 — get_leaderboard(game_id, limit_count)
-- Get leaderboard for a game
CREATE OR REPLACE FUNCTION get_leaderboard(
    game_id_param uuid,
    limit_count int DEFAULT 10
)
RETURNS TABLE (
    rank int,
    user_id uuid,
    score int,
    reaction_time_ms int,
    accuracy numeric,
    achieved_at timestamptz
)
LANGUAGE sql
AS $$
    SELECT 
        ROW_NUMBER() OVER (ORDER BY score DESC, reaction_time_ms ASC NULLS LAST)::int as rank,
        user_id,
        score,
        reaction_time_ms,
        accuracy,
        achieved_at
    FROM game_leaderboards
    WHERE game_id = game_id_param
    ORDER BY score DESC, reaction_time_ms ASC NULLS LAST
    LIMIT limit_count;
$$;

-- O-RPC9 — search_meditations(category_filter, duration_filter, premium_filter)
-- Search meditation catalog
CREATE OR REPLACE FUNCTION search_meditations(
    category_filter text DEFAULT NULL,
    duration_filter int DEFAULT NULL,
    premium_filter boolean DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    category text,
    duration_minutes int,
    audio_url text,
    image_url text,
    premium boolean,
    difficulty text
)
LANGUAGE sql
AS $$
    SELECT 
        id, title, description, category, duration_minutes,
        audio_url, image_url, premium, difficulty
    FROM meditation_catalog
    WHERE (
        category_filter IS NULL OR category = category_filter
    )
    AND (
        duration_filter IS NULL OR duration_minutes = duration_filter
    )
    AND (
        premium_filter IS NULL OR premium = premium_filter
    )
    ORDER BY premium ASC, title;
$$;

-- O-RPC10 — get_soundscapes_by_category(category_filter)
-- Get soundscapes by category
CREATE OR REPLACE FUNCTION get_soundscapes_by_category(category_filter text DEFAULT NULL)
RETURNS TABLE (
    id uuid,
    title text,
    category text,
    audio_url text,
    image_url text,
    premium boolean,
    duration_minutes int
)
LANGUAGE sql
AS $$
    SELECT id, title, category, audio_url, image_url, premium, duration_minutes
    FROM soundscapes
    WHERE category_filter IS NULL OR category = category_filter
    ORDER BY premium ASC, title;
$$;

-- 6. TRIGGERS ---------------------------------------------

-- Auto-update updated_at on meditation_streaks
CREATE OR REPLACE FUNCTION update_meditation_streaks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meditation_streaks_timestamp
BEFORE UPDATE ON meditation_streaks
FOR EACH ROW
EXECUTE FUNCTION update_meditation_streaks_timestamp();

