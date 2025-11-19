-- =========================================================
-- AI WELLNESS + STRESS AI + MEDITATION WORLD PROGRESSION
-- Stress scoring, AI recommendations, meditation progression
-- =========================================================

-- Stress scores table
CREATE TABLE IF NOT EXISTS stress_scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    level text NOT NULL CHECK (level IN ('low', 'moderate', 'high')),
    score int NOT NULL CHECK (score BETWEEN 0 AND 100),
    factors jsonb DEFAULT '{}'::jsonb, -- {mood_impact: 10, sleep_impact: 20, ...}
    generated_at timestamptz DEFAULT timezone('utc', now())
);

-- AI recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations_wellness (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category text NOT NULL, -- 'stress', 'sleep', 'mood', 'meditation', 'habits', 'games'
    text text NOT NULL,
    priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    action_type text, -- 'meditation', 'game', 'breathing', 'sleep', 'mood_log'
    action_data jsonb DEFAULT '{}'::jsonb, -- {duration: 5, level: 1, game_id: '...'}
    seen boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Notification rules (enhanced from Module AF)
CREATE TABLE IF NOT EXISTS notification_rules_wellness (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category text NOT NULL, -- 'stress', 'sleep', 'mood', 'meditation', 'habits'
    priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    active boolean DEFAULT true,
    trigger_condition jsonb DEFAULT '{}'::jsonb, -- {stress_level: 'high', sleep_hours: '<6', ...}
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- User state cache (for quick access)
CREATE TABLE IF NOT EXISTS user_state_cache (
    user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    stress_level text CHECK (stress_level IN ('low', 'moderate', 'high')),
    stress_score int CHECK (stress_score BETWEEN 0 AND 100),
    mood_trend text, -- 'improving', 'stable', 'declining'
    sleep_trend text, -- 'improving', 'stable', 'declining'
    habit_completion_rate numeric,
    meditation_streak int DEFAULT 0,
    last_meditation_at timestamptz,
    last_updated timestamptz DEFAULT timezone('utc', now())
);

-- Meditation world progression (enhance existing if needed)
DO $$
BEGIN
    -- Check if meditation_world_levels exists (from Module AC)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meditation_levels') THEN
        -- Add columns if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'meditation_levels' AND column_name = 'xp_reward'
        ) THEN
            ALTER TABLE meditation_levels ADD COLUMN xp_reward int DEFAULT 20;
        END IF;
    END IF;
END $$;

-- Meditation world rewards
CREATE TABLE IF NOT EXISTS meditation_world_rewards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    level_id uuid REFERENCES meditation_levels(id) ON DELETE SET NULL,
    reward_type text NOT NULL, -- 'xp', 'token', 'badge', 'unlock'
    value int,
    badge_name text,
    unlocked_item_id uuid,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Meditation level completions (enhance from Module AC if needed)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'level_completions') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'level_completions' AND column_name = 'stars'
        ) THEN
            ALTER TABLE level_completions ADD COLUMN stars int DEFAULT 1 CHECK (stars BETWEEN 1 AND 3);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'level_completions' AND column_name = 'duration_seconds'
        ) THEN
            ALTER TABLE level_completions ADD COLUMN duration_seconds int;
        END IF;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stress_scores_user_date ON stress_scores(user_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user ON ai_recommendations_wellness(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_seen ON ai_recommendations_wellness(user_id, seen) WHERE seen = false;
CREATE INDEX IF NOT EXISTS idx_notification_rules_wellness_user ON notification_rules_wellness(user_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_meditation_world_rewards_user ON meditation_world_rewards(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE stress_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations_wellness ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules_wellness ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_state_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_world_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_stress_scores" ON stress_scores
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_ai_recommendations" ON ai_recommendations_wellness
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_notification_rules" ON notification_rules_wellness
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_state_cache" ON user_state_cache
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_meditation_rewards" ON meditation_world_rewards
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RPC Functions

-- RPC: Update user state cache
CREATE OR REPLACE FUNCTION update_user_state_cache(
    p_user_id uuid,
    p_stress_level text,
    p_stress_score int,
    p_mood_trend text DEFAULT NULL,
    p_sleep_trend text DEFAULT NULL,
    p_habit_completion_rate numeric DEFAULT NULL,
    p_meditation_streak int DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO user_state_cache (
        user_id, stress_level, stress_score, mood_trend, sleep_trend,
        habit_completion_rate, meditation_streak, last_updated
    )
    VALUES (
        p_user_id, p_stress_level, p_stress_score, p_mood_trend, p_sleep_trend,
        p_habit_completion_rate, p_meditation_streak, timezone('utc', now())
    )
    ON CONFLICT (user_id) DO UPDATE SET
        stress_level = EXCLUDED.stress_level,
        stress_score = EXCLUDED.stress_score,
        mood_trend = EXCLUDED.mood_trend,
        sleep_trend = EXCLUDED.sleep_trend,
        habit_completion_rate = EXCLUDED.habit_completion_rate,
        meditation_streak = EXCLUDED.meditation_streak,
        last_updated = timezone('utc', now());
END;
$$;

-- RPC: Get user state cache
CREATE OR REPLACE FUNCTION get_user_state_cache(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    state_record RECORD;
BEGIN
    SELECT * INTO state_record
    FROM user_state_cache
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'stress_level', 'low',
            'stress_score', 0,
            'mood_trend', 'stable',
            'sleep_trend', 'stable',
            'habit_completion_rate', 0,
            'meditation_streak', 0
        );
    END IF;
    
    RETURN jsonb_build_object(
        'stress_level', state_record.stress_level,
        'stress_score', state_record.stress_score,
        'mood_trend', state_record.mood_trend,
        'sleep_trend', state_record.sleep_trend,
        'habit_completion_rate', state_record.habit_completion_rate,
        'meditation_streak', state_record.meditation_streak,
        'last_updated', state_record.last_updated
    );
END;
$$;

-- =========================================================
-- AI WELLNESS + STRESS AI — COMPLETE
-- =========================================================

