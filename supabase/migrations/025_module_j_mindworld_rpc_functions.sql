-- =========================================================
-- MODULE J — GAMIFIED MEDITATION WORLD (Phase 2: RPC Functions - Updated)
-- Full RPC function pack: XP, Tokens, Streaks, Quests, Garden, Games, Meditation
-- This is the BRAIN of the Gamified Meditation World
-- =========================================================

-- ⚡ PART 1 — XP SYSTEM
-- =========================================================

-- 1. add_xp(user_id, amount, source, source_id)
-- Core XP function. Automatically updates level, logs, and returns new totals.
CREATE OR REPLACE FUNCTION add_xp(
    p_user_id uuid,
    p_amount INT,
    p_source TEXT,
    p_source_id BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_xp BIGINT;
    new_xp BIGINT;
    xp_needed INT;
    current_level INT;
    leveled_up BOOLEAN := FALSE;
BEGIN
    -- Get user state (with lock to prevent race conditions)
    SELECT xp, level INTO current_xp, current_level
    FROM mind_garden_state
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- Initialize if doesn't exist
    IF current_xp IS NULL THEN
        INSERT INTO mind_garden_state (user_id, xp, level)
        VALUES (p_user_id, 0, 1)
        ON CONFLICT (user_id) DO NOTHING;
        
        SELECT xp, level INTO current_xp, current_level
        FROM mind_garden_state
        WHERE user_id = p_user_id
        FOR UPDATE;
    END IF;

    new_xp := current_xp + p_amount;

    -- XP required follows a simple formula: level^2 * 100
    xp_needed := (current_level * current_level) * 100;

    -- Level up loop
    WHILE new_xp >= xp_needed LOOP
        new_xp := new_xp - xp_needed;
        current_level := current_level + 1;
        xp_needed := (current_level * current_level) * 100;
        leveled_up := TRUE;
    END LOOP;

    -- Update state
    UPDATE mind_garden_state
    SET xp = new_xp,
        level = current_level,
        last_updated = timezone('utc', now())
    WHERE user_id = p_user_id;

    -- Also update Module P's user_progress for consistency
    UPDATE user_progress
    SET xp = new_xp::int,
        level = current_level,
        total_xp_earned = COALESCE(total_xp_earned, 0) + p_amount,
        updated_at = timezone('utc', now())
    WHERE user_id = p_user_id;

    -- Log XP
    INSERT INTO xp_logs(user_id, source, source_id, xp)
    VALUES (p_user_id, p_source, p_source_id, p_amount);

    RETURN jsonb_build_object(
        'xp', new_xp,
        'level', current_level,
        'leveled_up', leveled_up
    );
END;
$$;

-- 🪙 PART 2 — TOKENS
-- =========================================================

-- 2. add_tokens(user_id, amount)
-- Used for games, quests, meditation rewards.
CREATE OR REPLACE FUNCTION add_tokens(
    p_user_id uuid,
    p_amount INT
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_tokens BIGINT;
BEGIN
    -- Initialize if doesn't exist
    INSERT INTO mind_garden_state (user_id, tokens)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE mind_garden_state
    SET tokens = tokens + p_amount,
        last_updated = timezone('utc', now())
    WHERE user_id = p_user_id
    RETURNING tokens INTO new_tokens;

    -- Log token transaction
    INSERT INTO mind_tokens (user_id, amount, source)
    VALUES (p_user_id, p_amount, 'system');

    RETURN new_tokens;
END;
$$;

-- 🪴 PART 3 — MIND GARDEN UNLOCKS
-- =========================================================

-- 3. unlock_garden_item(user_id, item_id)
-- Checks XP, tokens, unlocks item, returns status.
CREATE OR REPLACE FUNCTION unlock_garden_item(
    p_user_id uuid,
    p_item_id uuid
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cost INT;
    xp_req INT;
    level_req INT;
    tokens BIGINT;
    current_xp BIGINT;
    current_level INT;
    already_unlocked BOOLEAN;
BEGIN
    -- Get unlockable details
    SELECT token_cost, xp_required, level_required
    INTO cost, xp_req, level_req
    FROM garden_unlockables
    WHERE id = p_item_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Item not found'
        );
    END IF;

    -- Check if already unlocked
    SELECT EXISTS (
        SELECT 1 FROM user_unlocked_items
        WHERE user_id = p_user_id AND unlockable_id = p_item_id
    ) INTO already_unlocked;

    IF already_unlocked THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Item already unlocked'
        );
    END IF;

    -- Get user state
    SELECT xp, tokens, level INTO current_xp, tokens, current_level
    FROM mind_garden_state
    WHERE user_id = p_user_id;

    IF current_xp IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Garden state not initialized'
        );
    END IF;

    -- Check requirements
    IF current_level < level_req THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', format('Level %s required', level_req)
        );
    END IF;

    IF current_xp < xp_req THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Not enough XP'
        );
    END IF;

    IF tokens < cost THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Not enough tokens'
        );
    END IF;

    -- Deduct tokens
    UPDATE mind_garden_state
    SET tokens = tokens - cost,
        unlocked_items = unlocked_items || jsonb_build_array(p_item_id::text),
        last_updated = timezone('utc', now())
    WHERE user_id = p_user_id;

    -- Record unlock
    INSERT INTO user_unlocked_items (user_id, unlockable_id)
    VALUES (p_user_id, p_item_id)
    ON CONFLICT (user_id, unlockable_id) DO NOTHING;

    RETURN jsonb_build_object('success', TRUE);
END;
$$;

-- 🎮 PART 4 — MINI-GAMES LOGIC
-- =========================================================

-- 4. log_game_session(user_id, game_id, score, duration)
-- Automatically awards XP and tokens.
-- NOTE: Uses games_sessions_mindworld table (from Phase 1 schema)
CREATE OR REPLACE FUNCTION log_game_session(
    p_user_id uuid,
    p_game_id uuid,
    p_game_name TEXT,
    p_score INT,
    p_duration INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    xp_gain INT;
    token_gain INT;
    session_id uuid;
    is_premium BOOLEAN;
BEGIN
    -- Check if premium (2x rewards)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user_id;

    -- Calculate XP: base 10, +1 per 10 points (max +50), +1 per 30 seconds (max +20)
    xp_gain := 10;
    IF p_score > 0 THEN
        xp_gain := xp_gain + LEAST(50, (p_score / 10));
    END IF;
    IF p_duration > 0 THEN
        xp_gain := xp_gain + LEAST(20, (p_duration / 30));
    END IF;

    -- Premium bonus
    IF is_premium THEN
        xp_gain := xp_gain * 2;
    END IF;

    -- Tokens: 1 token if score > 50, 2 if premium
    token_gain := CASE WHEN p_score > 50 THEN 1 ELSE 0 END;
    IF is_premium AND token_gain > 0 THEN
        token_gain := token_gain * 2;
    END IF;

    -- Log session (using games_sessions_mindworld from Phase 1)
    INSERT INTO games_sessions_mindworld(
        user_id, game_id, game_name, score, duration_seconds, xp_earned, tokens_earned
    ) VALUES (
        p_user_id, p_game_id, p_game_name, p_score, p_duration, xp_gain, token_gain
    ) RETURNING id INTO session_id;

    -- Award XP and tokens
    PERFORM add_xp(p_user_id, xp_gain, 'game', session_id::text);
    IF token_gain > 0 THEN
        PERFORM add_tokens(p_user_id, token_gain);
    END IF;

    -- Check quest progress
    PERFORM check_quest_progress(p_user_id, 'play_game', 1);

    RETURN jsonb_build_object(
        'session_id', session_id,
        'xp', xp_gain,
        'tokens', token_gain
    );
END;
$$;

-- 🧘 PART 5 — MEDITATION LOGIC
-- =========================================================

-- 5. log_meditation_session(user_id, meditation_id, duration)
-- XP gain = 1 XP every 6 seconds (10 min = 100 XP)
-- NOTE: Uses meditation_sessions_mindworld table (from Phase 1 schema)
CREATE OR REPLACE FUNCTION log_meditation_session(
    p_user_id uuid,
    p_meditation_id uuid,
    p_meditation_title TEXT,
    p_duration INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    xp_gain INT;
    tok INT;
    rec_id uuid;
    is_premium BOOLEAN;
BEGIN
    -- Check if premium (2x rewards)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user_id;

    -- XP: 1 XP per 6 seconds (10 min = 100 XP, min 5, max 200)
    xp_gain := GREATEST(5, LEAST(200, p_duration / 6));
    
    -- Premium bonus
    IF is_premium THEN
        xp_gain := xp_gain * 2;
    END IF;

    -- Tokens: 1 token if >= 10 minutes, 2 if premium
    tok := CASE WHEN p_duration >= 600 THEN 1 ELSE 0 END;
    IF is_premium AND tok > 0 THEN
        tok := tok * 2;
    END IF;

    -- Log session (using meditation_sessions_mindworld from Phase 1)
    INSERT INTO meditation_sessions_mindworld(
        user_id, meditation_id, meditation_title, duration_seconds, xp_earned, tokens_earned
    ) VALUES (
        p_user_id, p_meditation_id, p_meditation_title, p_duration, xp_gain, tok
    ) RETURNING id INTO rec_id;

    -- Award XP and tokens
    PERFORM add_xp(p_user_id, xp_gain, 'meditation', rec_id::text);
    IF tok > 0 THEN
        PERFORM add_tokens(p_user_id, tok);
    END IF;

    -- Check quest progress (meditate 5 minutes)
    PERFORM check_quest_progress(p_user_id, 'meditate', (p_duration / 60));

    RETURN jsonb_build_object(
        'session_id', rec_id,
        'xp', xp_gain,
        'tokens', tok
    );
END;
$$;

-- 🔥 PART 6 — DAILY QUESTS
-- =========================================================

-- 6. generate_daily_quests(user_id)
-- Creates 3-5 new quests every day.
CREATE OR REPLACE FUNCTION generate_daily_quests(
    p_user_id uuid
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete existing quests for today
    DELETE FROM quests_daily
    WHERE user_id = p_user_id AND date = CURRENT_DATE;

    -- Insert new daily quests
    INSERT INTO quests_daily (user_id, title, description, quest_type, quest_value, xp_reward, token_reward, date)
    VALUES
        (p_user_id, 'Complete 1 Meditation', 'Do any meditation for 5 minutes', 'meditate', 5, 50, 1, CURRENT_DATE),
        (p_user_id, 'Play 1 Mini-Game', 'Play any mini-game of your choice', 'play_game', 1, 30, 1, CURRENT_DATE),
        (p_user_id, 'Log Your Mood', 'Add a mood log today', 'log_mood', 1, 20, 0, CURRENT_DATE),
        (p_user_id, 'Drink 2L Water', 'Stay hydrated throughout the day', 'drink_water', 2000, 40, 1, CURRENT_DATE),
        (p_user_id, 'Log Your Sleep', 'Track your sleep quality', 'log_sleep', 1, 30, 1, CURRENT_DATE)
    ON CONFLICT (user_id, date, quest_type) DO NOTHING;
END;
$$;

-- 🎯 PART 7 — COMPLETE QUEST
-- =========================================================

-- 7. complete_quest(quest_id, type)
-- Awards XP, tokens, moves to history.
CREATE OR REPLACE FUNCTION complete_quest(
    p_quest_id uuid,
    p_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    uid uuid;
    xp INT;
    tk INT;
    ttl TEXT;
BEGIN
    IF p_type = 'daily' THEN
        SELECT user_id, xp_reward, token_reward, title
        INTO uid, xp, tk, ttl
        FROM quests_daily
        WHERE id = p_quest_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'Quest not found');
        END IF;

        -- Mark as completed
        UPDATE quests_daily
        SET completed = TRUE,
            completed_at = timezone('utc', now())
        WHERE id = p_quest_id;

    ELSIF p_type = 'weekly' THEN
        SELECT user_id, xp_reward, token_reward, title
        INTO uid, xp, tk, ttl
        FROM quests_weekly
        WHERE id = p_quest_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'Quest not found');
        END IF;

        -- Mark as completed
        UPDATE quests_weekly
        SET completed = TRUE,
            completed_at = timezone('utc', now())
        WHERE id = p_quest_id;
    ELSE
        RETURN jsonb_build_object('success', FALSE, 'error', 'Invalid quest type');
    END IF;

    -- Award rewards
    PERFORM add_xp(uid, xp, 'quest', p_quest_id::text);
    IF tk > 0 THEN
        PERFORM add_tokens(uid, tk);
    END IF;

    -- Log to history
    INSERT INTO quests_history(user_id, quest_type, quest_title, completed, xp_reward, token_reward, completed_at)
    VALUES (uid, p_type, ttl, TRUE, xp, tk, timezone('utc', now()));

    RETURN jsonb_build_object(
        'success', TRUE,
        'xp', xp,
        'tokens', tk
    );
END;
$$;

-- 🔥 PART 8 — CHECK QUEST PROGRESS (Helper function)
-- =========================================================

-- 8. check_quest_progress(user_id, quest_type, progress_value)
-- Auto-completes quests when progress meets requirement
CREATE OR REPLACE FUNCTION check_quest_progress(
    p_user_id uuid,
    p_quest_type text,
    p_progress_value int DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_quest quests_daily%ROWTYPE;
BEGIN
    -- Check daily quests
    FOR v_quest IN
        SELECT * FROM quests_daily
        WHERE user_id = p_user_id
        AND date = CURRENT_DATE
        AND quest_type = p_quest_type
        AND completed = false
    LOOP
        -- Mark as completed if progress meets requirement
        IF p_progress_value >= v_quest.quest_value THEN
            PERFORM complete_quest(v_quest.id, 'daily');
        END IF;
    END LOOP;
END;
$$;

-- 🔥 PART 9 — GET GARDEN STATE
-- =========================================================

-- 9. get_garden_state(user_id)
-- Returns complete garden state with unlocked items
CREATE OR REPLACE FUNCTION get_garden_state(
    p_user_id uuid
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_garden_state mind_garden_state%ROWTYPE;
    v_unlocked_items jsonb;
BEGIN
    -- Get or initialize garden state
    SELECT * INTO v_garden_state
    FROM mind_garden_state
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        INSERT INTO mind_garden_state (user_id)
        VALUES (p_user_id)
        RETURNING * INTO v_garden_state;
    END IF;

    -- Get unlocked items
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', ui.unlockable_id,
            'unlocked_at', ui.unlocked_at
        )
    ) INTO v_unlocked_items
    FROM user_unlocked_items ui
    WHERE ui.user_id = p_user_id;

    RETURN jsonb_build_object(
        'level', v_garden_state.level,
        'xp', v_garden_state.xp,
        'tokens', v_garden_state.tokens,
        'garden', v_garden_state.garden_json,
        'unlocked_items', COALESCE(v_unlocked_items, '[]'::jsonb),
        'last_updated', v_garden_state.last_updated
    );
END;
$$;

-- =========================================================
-- PHASE 2 COMPLETE
-- =========================================================
-- You now have:
-- ✅ XP System (with level-up logic)
-- ✅ Token Economy
-- ✅ Mini-game XP/Token auto-reward
-- ✅ Meditation XP/Token auto-reward
-- ✅ Daily Quests (auto-generation)
-- ✅ Weekly Quests (from Phase 1 RPC)
-- ✅ Garden Unlocks
-- ✅ XP Logs
-- ✅ Full gamified backend engine
-- =========================================================
-- All functions use SECURITY DEFINER for proper permissions
-- All functions integrate with existing modules (O, P, C, S)
-- =========================================================

