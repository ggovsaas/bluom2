-- =========================================================
-- MODULE J — GAMIFIED MEDITATION WORLD (Phase 3: Streak Engine)
-- Complete streak system: mood, sleep, meditation, games, hydration, habits, meals
-- Automatic resets, recoveries, rewards, freeze passes
-- =========================================================

-- NOTE: This integrates with:
-- - Module P: user_streaks (general app streaks)
-- - Module O: meditation_streaks (meditation-specific)
-- - Module J: mind_garden_state (for XP/tokens rewards)
-- We create a unified streak system for the Mind Garden world

-- =========================================================
-- 1. STREAKS TABLE (Unified for Mind Garden)
-- =========================================================

CREATE TABLE IF NOT EXISTS mind_garden_streaks (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category text NOT NULL, -- 'mood', 'sleep', 'meditation', 'game', 'water', 'meal', 'habit', 'wellness', 'activity'
    streak_count int DEFAULT 0,
    longest_streak int DEFAULT 0,
    last_log timestamptz,
    last_updated timestamptz DEFAULT timezone('utc', now()),
    PRIMARY KEY (user_id, category)
);

-- =========================================================
-- 2. FREEZE PASSES TABLE (Premium feature)
-- =========================================================

CREATE TABLE IF NOT EXISTS user_streaks_freeze (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    freeze_passes int DEFAULT 0,
    last_purchased timestamptz,
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- =========================================================
-- 3. STREAK MILESTONES TABLE (Track milestone achievements)
-- =========================================================

CREATE TABLE IF NOT EXISTS streak_milestones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category text NOT NULL,
    milestone_days int NOT NULL, -- 7, 14, 30, 90, etc.
    achieved_at timestamptz DEFAULT timezone('utc', now()),
    reward_claimed boolean DEFAULT false,
    UNIQUE(user_id, category, milestone_days)
);

-- =========================================================
-- 4. INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_mind_garden_streaks_user ON mind_garden_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_mind_garden_streaks_category ON mind_garden_streaks(category);
CREATE INDEX IF NOT EXISTS idx_streak_milestones_user ON streak_milestones(user_id);

-- =========================================================
-- 5. RLS POLICIES
-- =========================================================

ALTER TABLE mind_garden_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks_freeze ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_streaks" ON mind_garden_streaks
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_freeze_passes" ON user_streaks_freeze
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_milestones" ON streak_milestones
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- 6. RPC FUNCTIONS
-- =========================================================

-- PART 1 — Utility Functions
-- =========================================================

-- 1. get_last_log_timestamp(user_id, category)
-- Used to check if streak should increment or reset.
CREATE OR REPLACE FUNCTION get_last_log_timestamp(
    p_user_id uuid,
    p_category TEXT
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    ts TIMESTAMPTZ;
BEGIN
    SELECT last_log INTO ts
    FROM mind_garden_streaks
    WHERE user_id = p_user_id AND category = p_category;

    RETURN ts;
END;
$$;

-- PART 2 — Increment Streak Logic
-- =========================================================

-- 2. increment_streak(user_id, category)
-- Handles checking last log time, incrementing streak, resetting streak,
-- applying freeze pass (premium), issuing streak rewards
CREATE OR REPLACE FUNCTION increment_streak(
    p_user_id uuid,
    p_category TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    prev_log TIMESTAMPTZ;
    prev_streak INT;
    prev_longest INT;
    new_streak INT;
    use_freeze BOOLEAN := FALSE;
    freeze_passes_available INT;
    reward_xp INT := 0;
    milestone_reward jsonb;
BEGIN
    -- Fetch streak row (with lock to prevent race conditions)
    SELECT last_log, streak_count, longest_streak
    INTO prev_log, prev_streak, prev_longest
    FROM mind_garden_streaks
    WHERE user_id = p_user_id
      AND category = p_category
    FOR UPDATE;

    -- If no streak entry exists yet, initialize it
    IF prev_log IS NULL THEN
        INSERT INTO mind_garden_streaks(user_id, category, streak_count, longest_streak, last_log)
        VALUES (p_user_id, p_category, 1, 1, timezone('utc', now()))
        ON CONFLICT (user_id, category) DO UPDATE SET
            streak_count = 1,
            longest_streak = GREATEST(1, mind_garden_streaks.longest_streak),
            last_log = timezone('utc', now()),
            last_updated = timezone('utc', now());

        -- Award initial XP
        PERFORM add_xp(p_user_id, 5, 'streak', NULL::text);

        RETURN jsonb_build_object(
            'streak', 1,
            'status', 'initialized',
            'reward_xp', 5
        );
    END IF;

    -- CASE 1: same day → do nothing
    IF prev_log::date = CURRENT_DATE THEN
        RETURN jsonb_build_object(
            'streak', prev_streak,
            'status', 'already_counted'
        );
    END IF;

    -- CASE 2: consecutive day → increment streak
    IF prev_log::date = CURRENT_DATE - INTERVAL '1 day' THEN
        new_streak := prev_streak + 1;
    -- CASE 3: streak broken → attempt freeze pass
    ELSE
        -- Check for freeze passes
        SELECT COALESCE(freeze_passes, 0) INTO freeze_passes_available
        FROM user_streaks_freeze
        WHERE user_id = p_user_id;

        IF freeze_passes_available > 0 THEN
            -- Use freeze pass
            UPDATE user_streaks_freeze
            SET freeze_passes = freeze_passes - 1,
                updated_at = timezone('utc', now())
            WHERE user_id = p_user_id;

            new_streak := prev_streak; -- Keep streak alive
            use_freeze := TRUE;
        ELSE
            -- Reset streak
            new_streak := 1;
        END IF;
    END IF;

    -- Update longest streak if needed
    IF new_streak > prev_longest THEN
        prev_longest := new_streak;
    END IF;

    -- Update streak
    UPDATE mind_garden_streaks
    SET streak_count = new_streak,
        longest_streak = prev_longest,
        last_log = timezone('utc', now()),
        last_updated = timezone('utc', now())
    WHERE user_id = p_user_id
      AND category = p_category;

    -- Daily XP reward (scales with streak length)
    reward_xp := 5 + (new_streak / 3)::INT * 5;
    PERFORM add_xp(p_user_id, reward_xp, 'streak', NULL::text);

    -- Check for milestone rewards
    milestone_reward := evaluate_streak_rewards(p_user_id, p_category, new_streak);

    RETURN jsonb_build_object(
        'streak', new_streak,
        'longest_streak', prev_longest,
        'reward_xp', reward_xp,
        'status', CASE WHEN use_freeze THEN 'frozen' ELSE 'updated' END,
        'freeze_used', use_freeze,
        'milestone', milestone_reward
    );
END;
$$;

-- PART 3 — Freeze Pass Purchases
-- =========================================================

-- 3. buy_freeze_pass(user_id)
-- Costs 10 tokens. Premium users can buy "freeze passes" to save streaks.
CREATE OR REPLACE FUNCTION buy_freeze_pass(
    p_user_id uuid
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tokens BIGINT;
    current_passes INT;
BEGIN
    -- Get current tokens
    SELECT COALESCE(tokens, 0) INTO tokens
    FROM mind_garden_state
    WHERE user_id = p_user_id;

    IF tokens < 10 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Not enough tokens',
            'required', 10,
            'current', tokens
        );
    END IF;

    -- Deduct tokens
    UPDATE mind_garden_state
    SET tokens = tokens - 10,
        last_updated = timezone('utc', now())
    WHERE user_id = p_user_id;

    -- Add freeze pass (initialize if doesn't exist)
    INSERT INTO user_streaks_freeze (user_id, freeze_passes, last_purchased)
    VALUES (p_user_id, 1, timezone('utc', now()))
    ON CONFLICT (user_id) DO UPDATE SET
        freeze_passes = user_streaks_freeze.freeze_passes + 1,
        last_purchased = timezone('utc', now()),
        updated_at = timezone('utc', now());

    SELECT freeze_passes INTO current_passes
    FROM user_streaks_freeze
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'freeze_passes', current_passes,
        'tokens_spent', 10
    );
END;
$$;

-- PART 4 — Daily Award Engine
-- =========================================================

-- 4. evaluate_streak_rewards(user_id, category, streak_count)
-- Reward bonuses based on streak thresholds:
-- * 7 days → +100 XP
-- * 14 days → +1 token
-- * 30 days → +3 tokens + 500 XP
-- * 90 days → +10 tokens + badge
CREATE OR REPLACE FUNCTION evaluate_streak_rewards(
    p_user_id uuid,
    p_category TEXT,
    p_streak_count INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    milestone_achieved boolean := false;
    reward_description text;
BEGIN
    -- Check if milestone already achieved
    IF EXISTS (
        SELECT 1 FROM streak_milestones
        WHERE user_id = p_user_id
        AND category = p_category
        AND milestone_days = p_streak_count
    ) THEN
        RETURN jsonb_build_object('reward', 'none', 'reason', 'already_achieved');
    END IF;

    -- 7-day milestone
    IF p_streak_count = 7 THEN
        PERFORM add_xp(p_user_id, 100, 'streak_reward', NULL::text);
        INSERT INTO streak_milestones (user_id, category, milestone_days)
        VALUES (p_user_id, p_category, 7)
        ON CONFLICT (user_id, category, milestone_days) DO NOTHING;
        
        RETURN jsonb_build_object(
            'reward', '7-day XP Boost',
            'xp', 100,
            'milestone', 7
        );

    -- 14-day milestone
    ELSIF p_streak_count = 14 THEN
        PERFORM add_tokens(p_user_id, 1);
        INSERT INTO streak_milestones (user_id, category, milestone_days)
        VALUES (p_user_id, p_category, 14)
        ON CONFLICT (user_id, category, milestone_days) DO NOTHING;
        
        RETURN jsonb_build_object(
            'reward', '2-week Token',
            'tokens', 1,
            'milestone', 14
        );

    -- 30-day milestone
    ELSIF p_streak_count = 30 THEN
        PERFORM add_xp(p_user_id, 500, 'streak_reward', NULL::text);
        PERFORM add_tokens(p_user_id, 3);
        INSERT INTO streak_milestones (user_id, category, milestone_days)
        VALUES (p_user_id, p_category, 30)
        ON CONFLICT (user_id, category, milestone_days) DO NOTHING;
        
        -- Award badge (if badges table exists from Module P)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badges') THEN
            INSERT INTO user_badges (user_id, badge_id)
            SELECT p_user_id, id
            FROM badges
            WHERE name = format('%s 30-Day Streak', p_category)
            LIMIT 1
            ON CONFLICT DO NOTHING;
        END IF;
        
        RETURN jsonb_build_object(
            'reward', '30-day Mega Reward',
            'xp', 500,
            'tokens', 3,
            'badge', true,
            'milestone', 30
        );

    -- 90-day milestone
    ELSIF p_streak_count = 90 THEN
        PERFORM add_tokens(p_user_id, 10);
        PERFORM add_xp(p_user_id, 1000, 'streak_reward', NULL::text);
        INSERT INTO streak_milestones (user_id, category, milestone_days)
        VALUES (p_user_id, p_category, 90)
        ON CONFLICT (user_id, category, milestone_days) DO NOTHING;
        
        -- Award badge
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badges') THEN
            INSERT INTO user_badges (user_id, badge_id)
            SELECT p_user_id, id
            FROM badges
            WHERE name = format('%s 90-Day Master', p_category)
            LIMIT 1
            ON CONFLICT DO NOTHING;
        END IF;
        
        RETURN jsonb_build_object(
            'reward', '90-day Badge',
            'tokens', 10,
            'xp', 1000,
            'badge', true,
            'milestone', 90
        );
    END IF;

    RETURN jsonb_build_object('reward', 'none');
END;
$$;

-- PART 5 — Unified Logging Endpoints
-- =========================================================

-- These are the functions your app will call directly:

-- Mood log → increments streak
CREATE OR REPLACE FUNCTION log_mood_action(p_user_id uuid)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN increment_streak(p_user_id, 'mood');
END;
$$;

-- Meditation → increments streak
CREATE OR REPLACE FUNCTION log_meditation_action(p_user_id uuid)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN increment_streak(p_user_id, 'meditation');
END;
$$;

-- Game → increments streak
CREATE OR REPLACE FUNCTION log_game_action(p_user_id uuid)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN increment_streak(p_user_id, 'game');
END;
$$;

-- Sleep → increments streak
CREATE OR REPLACE FUNCTION log_sleep_action(p_user_id uuid)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN increment_streak(p_user_id, 'sleep');
END;
$$;

-- Hydration → increments streak
CREATE OR REPLACE FUNCTION log_water_action(p_user_id uuid)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN increment_streak(p_user_id, 'water');
END;
$$;

-- Meal logging → increments streak
CREATE OR REPLACE FUNCTION log_meal_action(p_user_id uuid)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN increment_streak(p_user_id, 'meal');
END;
$$;

-- Habit completion → increments streak (for specific habit)
CREATE OR REPLACE FUNCTION log_habit_action(
    p_user_id uuid,
    p_habit_id uuid
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    habit_name text;
BEGIN
    -- Get habit name for category
    SELECT title INTO habit_name
    FROM habits
    WHERE id = p_habit_id AND user_id = p_user_id;

    IF habit_name IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Habit not found');
    END IF;

    -- Use habit-specific category
    RETURN increment_streak(p_user_id, format('habit_%s', p_habit_id::text));
END;
$$;

-- Daily wellness streak (if user completes 3 wellness actions)
CREATE OR REPLACE FUNCTION check_wellness_streak(p_user_id uuid)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    wellness_count int;
BEGIN
    -- Count wellness actions today (mood + sleep + meditation + habits)
    SELECT COUNT(*) INTO wellness_count
    FROM (
        SELECT 1 FROM moods WHERE user_id = p_user_id AND created_at::date = CURRENT_DATE
        UNION ALL
        SELECT 1 FROM sleep_logs WHERE user_id = p_user_id AND date = CURRENT_DATE
        UNION ALL
        SELECT 1 FROM meditation_sessions_mindworld WHERE user_id = p_user_id AND created_at::date = CURRENT_DATE
        UNION ALL
        SELECT 1 FROM habit_logs WHERE user_id = p_user_id AND date = CURRENT_DATE AND completed = true
    ) AS actions;

    -- If 3+ wellness actions, increment wellness streak
    IF wellness_count >= 3 THEN
        RETURN increment_streak(p_user_id, 'wellness');
    ELSE
        RETURN jsonb_build_object(
            'streak', (SELECT streak_count FROM mind_garden_streaks WHERE user_id = p_user_id AND category = 'wellness'),
            'status', 'not_met',
            'actions_today', wellness_count,
            'required', 3
        );
    END IF;
END;
$$;

-- Daily activity streak (if steps > target)
CREATE OR REPLACE FUNCTION check_activity_streak(
    p_user_id uuid,
    p_steps_today int DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    steps_target int;
    steps_actual int;
BEGIN
    -- Get steps target from personalized plan or default to 10000
    SELECT COALESCE(
        (SELECT steps FROM daily_summaries WHERE user_id = p_user_id AND date = CURRENT_DATE),
        p_steps_today,
        0
    ) INTO steps_actual;

    -- Default target
    steps_target := 10000;

    -- If steps meet target, increment activity streak
    IF steps_actual >= steps_target THEN
        RETURN increment_streak(p_user_id, 'activity');
    ELSE
        RETURN jsonb_build_object(
            'streak', (SELECT streak_count FROM mind_garden_streaks WHERE user_id = p_user_id AND category = 'activity'),
            'status', 'not_met',
            'steps_today', steps_actual,
            'target', steps_target
        );
    END IF;
END;
$$;

-- Get all streaks for user
CREATE OR REPLACE FUNCTION get_all_streaks(p_user_id uuid)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_streaks jsonb;
BEGIN
    SELECT jsonb_object_agg(
        category,
        jsonb_build_object(
            'streak', streak_count,
            'longest', longest_streak,
            'last_log', last_log
        )
    ) INTO v_streaks
    FROM mind_garden_streaks
    WHERE user_id = p_user_id;

    RETURN COALESCE(v_streaks, '{}'::jsonb);
END;
$$;

-- Get freeze passes
CREATE OR REPLACE FUNCTION get_freeze_passes(p_user_id uuid)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    passes int;
BEGIN
    SELECT COALESCE(freeze_passes, 0) INTO passes
    FROM user_streaks_freeze
    WHERE user_id = p_user_id;

    -- Initialize if doesn't exist
    IF passes IS NULL THEN
        INSERT INTO user_streaks_freeze (user_id, freeze_passes)
        VALUES (p_user_id, 0)
        ON CONFLICT (user_id) DO NOTHING;
        passes := 0;
    END IF;

    RETURN jsonb_build_object('freeze_passes', passes);
END;
$$;

-- =========================================================
-- 7. TRIGGERS
-- =========================================================

-- Auto-update last_updated
CREATE OR REPLACE FUNCTION update_mind_garden_streaks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mind_garden_streaks_timestamp
    BEFORE UPDATE ON mind_garden_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_mind_garden_streaks_timestamp();

-- =========================================================
-- PHASE 3 — COMPLETE
-- =========================================================
-- ✅ Complete streak engine
-- ✅ Handles resets, increments, freeze, edge cases
-- ✅ Supports mood, sleep, meditation, water, meals, games, habits, wellness, activity
-- ✅ Integrated XP + tokens as rewards
-- ✅ Achievement + badges integration (Module P)
-- ✅ Unified API for frontend
-- ✅ Milestone rewards (7, 14, 30, 90 days)
-- ✅ Freeze pass system (premium feature)
-- =========================================================

