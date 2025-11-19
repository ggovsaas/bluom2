-- =========================================================
-- MODULE C — WELLNESS (AIMind)
-- Mood tracking, sleep, habits, journaling, gratitude, meditation, games
-- =========================================================

-- 1. MOODS ------------------------------------------------

CREATE TABLE moods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    mood_value int CHECK (mood_value BETWEEN 1 AND 5),
    note text,
    created_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_moods"
ON moods FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. SLEEP LOGS -------------------------------------------

CREATE TABLE sleep_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    hours numeric,
    quality int,
    sleep_start timestamptz,
    sleep_end timestamptz,
    created_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_sleep"
ON sleep_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. HABITS -----------------------------------------------

CREATE TABLE habits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text,
    category text,  -- wellbeing, productivity, health
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_habits"
ON habits FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. HABIT LOGS -------------------------------------------

CREATE TABLE habit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id uuid REFERENCES habits(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    date date DEFAULT current_date,
    completed boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(habit_id, date)
);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_habit_logs"
ON habit_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. JOURNALS ---------------------------------------------

CREATE TABLE journals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    content text,
    created_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_journals"
ON journals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. GRATITUDE ENTRIES ------------------------------------

CREATE TABLE gratitude_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    entry text,
    created_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE gratitude_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_gratitude"
ON gratitude_entries FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. MEDITATION SESSIONS ---------------------------------

CREATE TABLE meditation_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    type text,          -- breath, calming, sleep, anxiety, focus
    duration int,       -- in seconds
    completed boolean DEFAULT true,
    created_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_meditation"
ON meditation_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 8. MIND GAMES (Registry) --------------------------------

CREATE TABLE mind_games (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text,
    category text,        -- reaction, attention, memory, calm
    description text,
    created_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE mind_games ENABLE ROW LEVEL SECURITY;

-- Everyone can read available games
CREATE POLICY "public_read_games"
ON mind_games FOR SELECT
USING (true);

-- 9. MIND GAME SESSIONS -----------------------------------

CREATE TABLE mind_game_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id uuid REFERENCES mind_games(id) ON DELETE CASCADE,
    score numeric,
    metrics jsonb,        -- e.g. { reaction_ms: 245 }
    created_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE mind_game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_game_sessions"
ON mind_game_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 10. WELLNESS INSIGHTS (AI-generated) -------------------

CREATE TABLE wellness_insights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    category text,         -- mood, habits, sleep, overall
    insight text,
    created_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE wellness_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_insights"
ON wellness_insights FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- INDEXES for performance ---------------------------------

CREATE INDEX idx_moods_user_date ON moods(user_id, created_at);
CREATE INDEX idx_sleep_logs_user_date ON sleep_logs(user_id, created_at);
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, date);
CREATE INDEX idx_journals_user_date ON journals(user_id, created_at);
CREATE INDEX idx_gratitude_user_date ON gratitude_entries(user_id, created_at);
CREATE INDEX idx_meditation_user_date ON meditation_sessions(user_id, created_at);
CREATE INDEX idx_game_sessions_user_date ON mind_game_sessions(user_id, created_at);

-- RPC FUNCTIONS -------------------------------------------

-- 1. Log mood
CREATE OR REPLACE FUNCTION log_mood(m int, note text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO moods(user_id, mood_value, note)
    VALUES (auth.uid(), m, note);
END;
$$;

-- 2. Log sleep
CREATE OR REPLACE FUNCTION log_sleep(hours numeric, quality int, start_at timestamptz, end_at timestamptz)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO sleep_logs(user_id, hours, quality, sleep_start, sleep_end)
    VALUES (auth.uid(), hours, quality, start_at, end_at);
END;
$$;

-- 3. Add habit
CREATE OR REPLACE FUNCTION add_habit(title text, category text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO habits(user_id, title, category)
    VALUES (auth.uid(), title, category);
END;
$$;

-- 4. Toggle habit completion
CREATE OR REPLACE FUNCTION toggle_habit(habit uuid, date_in date)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    exists boolean;
BEGIN
    SELECT true INTO exists FROM habit_logs WHERE habit_id = habit AND date = date_in AND user_id = auth.uid();
    
    IF exists THEN
        DELETE FROM habit_logs WHERE habit_id = habit AND date = date_in AND user_id = auth.uid();
    ELSE
        INSERT INTO habit_logs(habit_id, user_id, date, completed)
        VALUES (habit, auth.uid(), date_in, true);
    END IF;
END;
$$;

-- 5. Add journal entry
CREATE OR REPLACE FUNCTION add_journal(content text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO journals(user_id, content)
    VALUES (auth.uid(), content);
END;
$$;

-- 6. Add gratitude entry
CREATE OR REPLACE FUNCTION add_gratitude(entry text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO gratitude_entries(user_id, entry)
    VALUES (auth.uid(), entry);
END;
$$;

-- 7. Log meditation session
CREATE OR REPLACE FUNCTION log_meditation(type text, duration int)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO meditation_sessions(user_id, type, duration)
    VALUES (auth.uid(), type, duration);
END;
$$;

-- 8. Log mind game session
CREATE OR REPLACE FUNCTION log_game(game uuid, score numeric, metrics jsonb)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO mind_game_sessions(user_id, game_id, score, metrics)
    VALUES (auth.uid(), game, score, metrics);
END;
$$;

