-- =========================================================
-- MODULE J — GAMIFIED MEDITATION WORLD (Phase 1: Schema Add-On)
-- Hybrid integration: Games + Meditation + Wellness data
-- Extends existing modules (O, P, C) without duplication
-- =========================================================

-- NOTE: This module INTEGRATES with:
-- - Module O: meditation_catalog, meditation_logs, soundscapes, mind_games, mind_game_sessions
-- - Module P: user_progress (XP/level), user_streaks, daily_missions, user_daily_missions
-- - Module C: meditation_sessions, moods, sleep_logs, habits
-- We only create NEW tables that don't exist.

-- =========================================================
-- 1. MIND GARDEN STATE (NEW - Core of the gamified world)
-- =========================================================

CREATE TABLE IF NOT EXISTS mind_garden_state (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    level int DEFAULT 1,
    xp bigint DEFAULT 0,
    tokens bigint DEFAULT 0,
    garden_json jsonb DEFAULT '{"plants": [], "decorations": [], "weather": "sunny", "timeOfDay": "day"}'::jsonb,
    unlocked_items jsonb DEFAULT '[]'::jsonb,
    last_updated timestamptz DEFAULT timezone('utc', now()),
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- =========================================================
-- 2. MIND TOKENS (NEW - Virtual currency for garden)
-- =========================================================

CREATE TABLE IF NOT EXISTS mind_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount int NOT NULL,
    source text NOT NULL, -- 'streak', 'quest', 'achievement', 'purchase', 'reward'
    source_id uuid, -- Reference to quest, streak, etc.
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- =========================================================
-- 3. XP LOGS (NEW - Detailed XP tracking, complements Module P's user_progress)
-- =========================================================

CREATE TABLE IF NOT EXISTS xp_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source text NOT NULL, -- 'game', 'meditation', 'streak', 'quest', 'mood', 'sleep', 'habit', 'water'
    source_id uuid, -- Reference to game session, meditation, quest, etc.
    xp int NOT NULL,
    description text,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- =========================================================
-- 4. GARDEN UNLOCKABLES (NEW - Cosmetics, plants, decorations)
-- =========================================================

CREATE TABLE IF NOT EXISTS garden_unlockables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL, -- 'plant', 'sky', 'weather', 'ornament', 'frame', 'path', 'fountain'
    name text NOT NULL,
    description text,
    xp_required int DEFAULT 0,
    token_cost int DEFAULT 0,
    level_required int DEFAULT 1,
    asset_url text,
    premium boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- =========================================================
-- 5. USER UNLOCKED ITEMS (NEW - Tracks what user has unlocked)
-- =========================================================

CREATE TABLE IF NOT EXISTS user_unlocked_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    unlockable_id uuid NOT NULL REFERENCES garden_unlockables(id) ON DELETE CASCADE,
    unlocked_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, unlockable_id)
);

-- =========================================================
-- 6. DAILY QUESTS (NEW - Auto-generated, different from Module P's daily_missions)
-- =========================================================
-- Module P has daily_missions (catalog) and user_daily_missions (completion tracking)
-- This table stores AUTO-GENERATED daily quests for the Mind Garden world

CREATE TABLE IF NOT EXISTS quests_daily (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    quest_type text NOT NULL, -- 'meditate', 'play_game', 'log_mood', 'log_sleep', 'drink_water', 'complete_habit', 'hit_steps'
    quest_value int DEFAULT 1, -- e.g., meditate 5 minutes, play 1 game, drink 2L water
    xp_reward int DEFAULT 50,
    token_reward int DEFAULT 1,
    completed boolean DEFAULT false,
    completed_at timestamptz,
    date date DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, date, quest_type)
);

-- =========================================================
-- 7. WEEKLY QUESTS (NEW - Bigger rewards)
-- =========================================================

CREATE TABLE IF NOT EXISTS quests_weekly (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    quest_type text NOT NULL, -- 'meditate_3x', 'play_10_games', 'complete_5_daily_quests', '3_day_hydration_streak', 'log_sleep_5x'
    quest_value int NOT NULL, -- e.g., meditate 3 times, play 10 games
    xp_reward int DEFAULT 200,
    token_reward int DEFAULT 5,
    completed boolean DEFAULT false,
    completed_at timestamptz,
    week_start date NOT NULL, -- Monday of the week
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, week_start, quest_type)
);

-- =========================================================
-- 8. QUESTS HISTORY (NEW - Historical log for analytics)
-- =========================================================

CREATE TABLE IF NOT EXISTS quests_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quest_type text NOT NULL, -- 'daily', 'weekly'
    quest_title text NOT NULL,
    quest_category text, -- 'meditation', 'games', 'wellness', 'hydration', 'sleep'
    completed boolean DEFAULT false,
    completed_at timestamptz,
    xp_reward int,
    token_reward int,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- =========================================================
-- 9. REWARD CLAIMS (NEW - Chest claims, unlocks, token rewards)
-- =========================================================

CREATE TABLE IF NOT EXISTS reward_claims (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_type text NOT NULL, -- 'chest', 'daily', 'weekly', 'unlock', 'level_up', 'streak_bonus'
    reward_value jsonb NOT NULL, -- {xp: 100, tokens: 5, items: [...]}
    claimed_at timestamptz DEFAULT timezone('utc', now()),
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- =========================================================
-- 10. GAME SESSIONS (NEW - Enhanced tracking for Mind Garden XP/tokens)
-- =========================================================
-- NOTE: Module C and O already have mind_game_sessions
-- This table adds XP/token tracking specifically for the gamified world
-- We'll use a VIEW or trigger to sync with existing mind_game_sessions

CREATE TABLE IF NOT EXISTS games_sessions_mindworld (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id uuid REFERENCES mind_games(id) ON DELETE SET NULL, -- From Module O
    game_name text NOT NULL, -- Denormalized for easier queries
    score int,
    duration_seconds int,
    xp_earned int DEFAULT 0,
    tokens_earned int DEFAULT 0,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- =========================================================
-- 11. MEDITATION SESSIONS MINWORLD (NEW - Enhanced tracking for Mind Garden)
-- =========================================================
-- NOTE: Module C has meditation_sessions, Module O has meditation_logs
-- This table adds XP/token tracking specifically for the gamified world

CREATE TABLE IF NOT EXISTS meditation_sessions_mindworld (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meditation_id uuid REFERENCES meditation_catalog(id) ON DELETE SET NULL, -- From Module O
    meditation_title text, -- Denormalized
    duration_seconds int NOT NULL,
    xp_earned int DEFAULT 0,
    tokens_earned int DEFAULT 0,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- =========================================================
-- 12. AI RECOMMENDATIONS MIND (NEW - AI suggestions for meditation/games)
-- =========================================================

CREATE TABLE IF NOT EXISTS ai_recommendations_mind (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category text NOT NULL, -- 'meditation', 'sleep', 'focus', 'stress', 'mood', 'game'
    recommendation text NOT NULL,
    reason text, -- Why this recommendation
    priority int DEFAULT 1, -- 1-5, higher = more important
    seen boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- =========================================================
-- 13. INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_mind_garden_state_user ON mind_garden_state(user_id);
CREATE INDEX IF NOT EXISTS idx_mind_tokens_user ON mind_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_mind_tokens_created ON mind_tokens(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_logs_user ON xp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_logs_source ON xp_logs(source, source_id);
CREATE INDEX IF NOT EXISTS idx_xp_logs_created ON xp_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_unlocked_items_user ON user_unlocked_items(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_daily_user_date ON quests_daily(user_id, date);
CREATE INDEX IF NOT EXISTS idx_quests_weekly_user_week ON quests_weekly(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_quests_history_user ON quests_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_user ON reward_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_games_sessions_mindworld_user ON games_sessions_mindworld(user_id);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_mindworld_user ON meditation_sessions_mindworld(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_mind_user ON ai_recommendations_mind(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_mind_seen ON ai_recommendations_mind(user_id, seen);

-- =========================================================
-- 14. RLS POLICIES
-- =========================================================

ALTER TABLE mind_garden_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_unlockables ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_unlocked_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests_weekly ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE games_sessions_mindworld ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_sessions_mindworld ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations_mind ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "users_manage_own_garden_state" ON mind_garden_state
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_tokens" ON mind_tokens
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_xp_logs" ON xp_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Everyone can read unlockables catalog, but only users can unlock
CREATE POLICY "public_read_unlockables" ON garden_unlockables
    FOR SELECT USING (true);

CREATE POLICY "users_manage_own_unlocked_items" ON user_unlocked_items
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_daily_quests" ON quests_daily
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_weekly_quests" ON quests_weekly
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_quests_history" ON quests_history
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_reward_claims" ON reward_claims
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_games_sessions" ON games_sessions_mindworld
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_meditation_sessions" ON meditation_sessions_mindworld
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_ai_recommendations" ON ai_recommendations_mind
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- 15. TRIGGERS FOR UPDATED_AT
-- =========================================================

CREATE OR REPLACE FUNCTION update_mind_garden_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mind_garden_state_timestamp
    BEFORE UPDATE ON mind_garden_state
    FOR EACH ROW
    EXECUTE FUNCTION update_mind_garden_state_timestamp();

-- =========================================================
-- 16. INITIALIZE GARDEN STATE ON USER CREATION
-- =========================================================

CREATE OR REPLACE FUNCTION init_mind_garden_state()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO mind_garden_state (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'init_mind_garden_state_on_user_create'
    ) THEN
        CREATE TRIGGER init_mind_garden_state_on_user_create
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION init_mind_garden_state();
    END IF;
END $$;

-- =========================================================
-- MODULE J PHASE 1 — COMPLETE
-- =========================================================
-- This schema supports:
-- ✅ Mind Garden (visual world state)
-- ✅ XP/Level/Token Engine (complements Module P)
-- ✅ 20+ mini-games integration (uses existing mind_game_sessions)
-- ✅ Meditation Hub (uses existing meditation_catalog/logs)
-- ✅ Soundscapes (uses existing soundscapes from Module O)
-- ✅ Daily & Weekly quests (auto-generated)
-- ✅ Streaks (uses Module P's user_streaks + Module O's meditation_streaks)
-- ✅ Gamified rewards (chests, unlocks)
-- ✅ AI insights (meditation/game recommendations)
-- =========================================================
-- Next: Phase 2 — RPC Functions (add_xp, log_game, unlock_item, quest generators)
-- =========================================================

