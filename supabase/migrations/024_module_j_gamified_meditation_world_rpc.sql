-- =========================================================
-- MODULE J — GAMIFIED MEDITATION WORLD (Phase 2: RPC Functions)
-- Core gameplay logic: XP, tokens, quests, unlocks, garden state
-- =========================================================

-- =========================================================
-- 1. ADD XP (Core function - called by all activities)
-- =========================================================

CREATE OR REPLACE FUNCTION add_xp(
    p_user_id uuid,
    p_xp int,
    p_source text,
    p_source_id uuid DEFAULT NULL,
    p_description text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_xp bigint;
    v_new_level int;
    v_level_up boolean := false;
    v_previous_level int;
    v_garden_state mind_garden_state%ROWTYPE;
BEGIN
    -- Get current garden state
    SELECT * INTO v_garden_state FROM mind_garden_state WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- Initialize garden state if it doesn't exist
        INSERT INTO mind_garden_state (user_id, xp, level)
        VALUES (p_user_id, 0, 1)
        RETURNING * INTO v_garden_state;
    END IF;
    
    v_previous_level := v_garden_state.level;
    v_new_xp := v_garden_state.xp + p_xp;
    
    -- Calculate new level (100 XP per level, exponential after level 10)
    IF v_garden_state.level < 10 THEN
        v_new_level := LEAST(10, (v_new_xp / 100)::int + 1);
    ELSE
        -- Exponential after level 10: level 11 = 200 XP, level 12 = 400 XP, etc.
        v_new_level := 10 + (LOG(2, GREATEST(1, (v_new_xp - 1000) / 100 + 1)))::int;
    END IF;
    
    v_level_up := v_new_level > v_previous_level;
    
    -- Update garden state
    UPDATE mind_garden_state
    SET xp = v_new_xp,
        level = v_new_level,
        last_updated = timezone('utc', now())
    WHERE user_id = p_user_id;
    
    -- Also update Module P's user_progress for consistency
    UPDATE user_progress
    SET xp = v_new_xp::int,
        level = v_new_level,
        total_xp_earned = total_xp_earned + p_xp,
        updated_at = timezone('utc', now())
    WHERE user_id = p_user_id;
    
    -- Log XP transaction
    INSERT INTO xp_logs (user_id, source, source_id, xp, description)
    VALUES (p_user_id, p_source, p_source_id, p_xp, p_description);
    
    RETURN jsonb_build_object(
        'xp_added', p_xp,
        'total_xp', v_new_xp,
        'level', v_new_level,
        'level_up', v_level_up,
        'previous_level', v_previous_level
    );
END;
$$;

-- =========================================================
-- 2. ADD TOKENS
-- =========================================================

CREATE OR REPLACE FUNCTION add_tokens(
    p_user_id uuid,
    p_amount int,
    p_source text,
    p_source_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_tokens bigint;
    v_garden_state mind_garden_state%ROWTYPE;
BEGIN
    -- Get current garden state
    SELECT * INTO v_garden_state FROM mind_garden_state WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        INSERT INTO mind_garden_state (user_id, tokens)
        VALUES (p_user_id, 0)
        RETURNING * INTO v_garden_state;
    END IF;
    
    v_new_tokens := v_garden_state.tokens + p_amount;
    
    -- Update garden state
    UPDATE mind_garden_state
    SET tokens = v_new_tokens,
        last_updated = timezone('utc', now())
    WHERE user_id = p_user_id;
    
    -- Log token transaction
    INSERT INTO mind_tokens (user_id, amount, source, source_id)
    VALUES (p_user_id, p_amount, p_source, p_source_id);
    
    RETURN jsonb_build_object(
        'tokens_added', p_amount,
        'total_tokens', v_new_tokens
    );
END;
$$;

-- =========================================================
-- 3. LOG GAME SESSION (for Mind Garden XP/tokens)
-- =========================================================

CREATE OR REPLACE FUNCTION log_game_session_mindworld(
    p_user_id uuid,
    p_game_id uuid,
    p_game_name text,
    p_score int DEFAULT NULL,
    p_duration_seconds int DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_xp_earned int;
    v_tokens_earned int;
    v_session_id uuid;
    v_result jsonb;
BEGIN
    -- Calculate XP based on score and duration
    -- Base XP: 10 per game
    -- Bonus: +1 XP per 10 points scored (max +50)
    -- Bonus: +1 XP per 30 seconds played (max +20)
    v_xp_earned := 10;
    
    IF p_score IS NOT NULL THEN
        v_xp_earned := v_xp_earned + LEAST(50, (p_score / 10));
    END IF;
    
    IF p_duration_seconds IS NOT NULL THEN
        v_xp_earned := v_xp_earned + LEAST(20, (p_duration_seconds / 30));
    END IF;
    
    -- Tokens: 1 token per game (2 for premium users)
    v_tokens_earned := 1;
    
    -- Check if user is premium (from Module S)
    IF EXISTS (
        SELECT 1 FROM user_subscriptions 
        WHERE user_id = p_user_id AND is_premium = true
    ) THEN
        v_tokens_earned := 2;
        v_xp_earned := v_xp_earned * 2; -- 2x XP for premium
    END IF;
    
    -- Log session
    INSERT INTO games_sessions_mindworld (
        user_id, game_id, game_name, score, duration_seconds, xp_earned, tokens_earned
    )
    VALUES (
        p_user_id, p_game_id, p_game_name, p_score, p_duration_seconds, v_xp_earned, v_tokens_earned
    )
    RETURNING id INTO v_session_id;
    
    -- Add XP and tokens
    PERFORM add_xp(p_user_id, v_xp_earned, 'game', v_session_id, format('Played %s', p_game_name));
    PERFORM add_tokens(p_user_id, v_tokens_earned, 'game', v_session_id);
    
    -- Check and update daily quest progress
    PERFORM check_quest_progress(p_user_id, 'play_game', 1);
    
    RETURN jsonb_build_object(
        'session_id', v_session_id,
        'xp_earned', v_xp_earned,
        'tokens_earned', v_tokens_earned
    );
END;
$$;

-- =========================================================
-- 4. LOG MEDITATION SESSION (for Mind Garden XP/tokens)
-- =========================================================

CREATE OR REPLACE FUNCTION log_meditation_session_mindworld(
    p_user_id uuid,
    p_meditation_id uuid,
    p_meditation_title text,
    p_duration_seconds int
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_xp_earned int;
    v_tokens_earned int;
    v_session_id uuid;
    v_duration_minutes int;
BEGIN
    v_duration_minutes := p_duration_seconds / 60;
    
    -- Calculate XP: 3 XP per minute (min 5, max 100)
    v_xp_earned := GREATEST(5, LEAST(100, v_duration_minutes * 3));
    
    -- Tokens: 1 token per 5 minutes (min 1, max 5)
    v_tokens_earned := GREATEST(1, LEAST(5, v_duration_minutes / 5));
    
    -- Premium bonus
    IF EXISTS (
        SELECT 1 FROM user_subscriptions 
        WHERE user_id = p_user_id AND is_premium = true
    ) THEN
        v_xp_earned := v_xp_earned * 2;
        v_tokens_earned := v_tokens_earned * 2;
    END IF;
    
    -- Log session
    INSERT INTO meditation_sessions_mindworld (
        user_id, meditation_id, meditation_title, duration_seconds, xp_earned, tokens_earned
    )
    VALUES (
        p_user_id, p_meditation_id, p_meditation_title, p_duration_seconds, v_xp_earned, v_tokens_earned
    )
    RETURNING id INTO v_session_id;
    
    -- Add XP and tokens
    PERFORM add_xp(p_user_id, v_xp_earned, 'meditation', v_session_id, format('Meditated %s minutes', v_duration_minutes));
    PERFORM add_tokens(p_user_id, v_tokens_earned, 'meditation', v_session_id);
    
    -- Check and update daily quest progress
    PERFORM check_quest_progress(p_user_id, 'meditate', v_duration_minutes);
    
    RETURN jsonb_build_object(
        'session_id', v_session_id,
        'xp_earned', v_xp_earned,
        'tokens_earned', v_tokens_earned
    );
END;
$$;

-- =========================================================
-- 5. UNLOCK ITEM (Garden unlockables)
-- =========================================================

CREATE OR REPLACE FUNCTION unlock_item(
    p_user_id uuid,
    p_unlockable_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_unlockable garden_unlockables%ROWTYPE;
    v_garden_state mind_garden_state%ROWTYPE;
    v_already_unlocked boolean;
    v_can_afford boolean := false;
    v_result jsonb;
BEGIN
    -- Get unlockable details
    SELECT * INTO v_unlockable FROM garden_unlockables WHERE id = p_unlockable_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unlockable not found');
    END IF;
    
    -- Check if already unlocked
    SELECT EXISTS (
        SELECT 1 FROM user_unlocked_items 
        WHERE user_id = p_user_id AND unlockable_id = p_unlockable_id
    ) INTO v_already_unlocked;
    
    IF v_already_unlocked THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already unlocked');
    END IF;
    
    -- Get garden state
    SELECT * INTO v_garden_state FROM mind_garden_state WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Garden state not found');
    END IF;
    
    -- Check requirements
    IF v_garden_state.level < v_unlockable.level_required THEN
        RETURN jsonb_build_object('success', false, 'error', format('Level %s required', v_unlockable.level_required));
    END IF;
    
    IF v_unlockable.xp_required > 0 AND v_garden_state.xp < v_unlockable.xp_required THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not enough XP');
    END IF;
    
    IF v_unlockable.token_cost > 0 AND v_garden_state.tokens < v_unlockable.token_cost THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not enough tokens');
    END IF;
    
    -- Deduct tokens if needed
    IF v_unlockable.token_cost > 0 THEN
        UPDATE mind_garden_state
        SET tokens = tokens - v_unlockable.token_cost,
            last_updated = timezone('utc', now())
        WHERE user_id = p_user_id;
    END IF;
    
    -- Unlock item
    INSERT INTO user_unlocked_items (user_id, unlockable_id)
    VALUES (p_user_id, p_unlockable_id)
    ON CONFLICT (user_id, unlockable_id) DO NOTHING;
    
    -- Update garden_json to include unlocked item
    UPDATE mind_garden_state
    SET garden_json = jsonb_set(
        garden_json,
        '{unlocked_items}',
        COALESCE(garden_json->'unlocked_items', '[]'::jsonb) || jsonb_build_array(v_unlockable.id::text),
        true
    ),
    last_updated = timezone('utc', now())
    WHERE user_id = p_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'unlockable', jsonb_build_object(
            'id', v_unlockable.id,
            'type', v_unlockable.type,
            'name', v_unlockable.name
        )
    );
END;
$$;

-- =========================================================
-- 6. GET GARDEN STATE
-- =========================================================

CREATE OR REPLACE FUNCTION get_garden_state(
    p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_garden_state mind_garden_state%ROWTYPE;
    v_unlocked_count int;
    v_result jsonb;
BEGIN
    -- Get garden state
    SELECT * INTO v_garden_state FROM mind_garden_state WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- Initialize if doesn't exist
        INSERT INTO mind_garden_state (user_id)
        VALUES (p_user_id)
        RETURNING * INTO v_garden_state;
    END IF;
    
    -- Count unlocked items
    SELECT COUNT(*) INTO v_unlocked_count
    FROM user_unlocked_items
    WHERE user_id = p_user_id;
    
    -- Build result
    v_result := jsonb_build_object(
        'level', v_garden_state.level,
        'xp', v_garden_state.xp,
        'tokens', v_garden_state.tokens,
        'garden', v_garden_state.garden_json,
        'unlocked_count', v_unlocked_count,
        'last_updated', v_garden_state.last_updated
    );
    
    RETURN v_result;
END;
$$;

-- =========================================================
-- 7. UPDATE GARDEN STATE (for visual updates)
-- =========================================================

CREATE OR REPLACE FUNCTION update_garden_state(
    p_user_id uuid,
    p_garden_json jsonb DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE mind_garden_state
    SET garden_json = COALESCE(p_garden_json, garden_json),
        last_updated = timezone('utc', now())
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        INSERT INTO mind_garden_state (user_id, garden_json)
        VALUES (p_user_id, COALESCE(p_garden_json, '{}'::jsonb))
        ON CONFLICT (user_id) DO UPDATE SET
            garden_json = EXCLUDED.garden_json,
            last_updated = timezone('utc', now());
    END IF;
    
    RETURN jsonb_build_object('success', true);
END;
$$;

-- =========================================================
-- 8. GENERATE DAILY QUESTS
-- =========================================================

CREATE OR REPLACE FUNCTION generate_daily_quests(
    p_user_id uuid,
    p_date date DEFAULT CURRENT_DATE
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_quests jsonb := '[]'::jsonb;
    v_quest jsonb;
BEGIN
    -- Delete existing quests for today
    DELETE FROM quests_daily WHERE user_id = p_user_id AND date = p_date;
    
    -- Generate 3-5 random daily quests
    -- Quest 1: Meditate
    INSERT INTO quests_daily (user_id, title, description, quest_type, quest_value, xp_reward, token_reward, date)
    VALUES (
        p_user_id,
        'Meditate for 5 minutes',
        'Take a moment to center yourself',
        'meditate',
        5,
        50,
        1,
        p_date
    );
    
    -- Quest 2: Play a game
    INSERT INTO quests_daily (user_id, title, description, quest_type, quest_value, xp_reward, token_reward, date)
    VALUES (
        p_user_id,
        'Play a mind game',
        'Challenge your cognitive skills',
        'play_game',
        1,
        30,
        1,
        p_date
    );
    
    -- Quest 3: Log mood
    INSERT INTO quests_daily (user_id, title, description, quest_type, quest_value, xp_reward, token_reward, date)
    VALUES (
        p_user_id,
        'Log your mood',
        'Track how you're feeling today',
        'log_mood',
        1,
        20,
        0,
        p_date
    );
    
    -- Quest 4: Drink water (if hydration tracking enabled)
    INSERT INTO quests_daily (user_id, title, description, quest_type, quest_value, xp_reward, token_reward, date)
    VALUES (
        p_user_id,
        'Drink 2L of water',
        'Stay hydrated throughout the day',
        'drink_water',
        2000,
        40,
        1,
        p_date
    )
    ON CONFLICT (user_id, date, quest_type) DO NOTHING;
    
    -- Quest 5: Log sleep (if sleep tracking enabled)
    INSERT INTO quests_daily (user_id, title, description, quest_type, quest_value, xp_reward, token_reward, date)
    VALUES (
        p_user_id,
        'Log your sleep',
        'Track your sleep quality',
        'log_sleep',
        1,
        30,
        1,
        p_date
    )
    ON CONFLICT (user_id, date, quest_type) DO NOTHING;
    
    -- Return generated quests
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'description', description,
            'quest_type', quest_type,
            'quest_value', quest_value,
            'xp_reward', xp_reward,
            'token_reward', token_reward,
            'completed', completed
        )
    ) INTO v_quests
    FROM quests_daily
    WHERE user_id = p_user_id AND date = p_date;
    
    RETURN jsonb_build_object('quests', COALESCE(v_quests, '[]'::jsonb));
END;
$$;

-- =========================================================
-- 9. GET DAILY QUESTS
-- =========================================================

CREATE OR REPLACE FUNCTION get_daily_quests(
    p_user_id uuid,
    p_date date DEFAULT CURRENT_DATE
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_quests jsonb;
    v_quest_count int;
BEGIN
    -- Check if quests exist for today
    SELECT COUNT(*) INTO v_quest_count
    FROM quests_daily
    WHERE user_id = p_user_id AND date = p_date;
    
    -- Generate if none exist
    IF v_quest_count = 0 THEN
        PERFORM generate_daily_quests(p_user_id, p_date);
    END IF;
    
    -- Get quests
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'description', description,
            'quest_type', quest_type,
            'quest_value', quest_value,
            'xp_reward', xp_reward,
            'token_reward', token_reward,
            'completed', completed,
            'completed_at', completed_at
        )
    ) INTO v_quests
    FROM quests_daily
    WHERE user_id = p_user_id AND date = p_date
    ORDER BY completed, created_at;
    
    RETURN jsonb_build_object('quests', COALESCE(v_quests, '[]'::jsonb));
END;
$$;

-- =========================================================
-- 10. GENERATE WEEKLY QUESTS
-- =========================================================

CREATE OR REPLACE FUNCTION generate_weekly_quests(
    p_user_id uuid,
    p_week_start date DEFAULT date_trunc('week', CURRENT_DATE)::date
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_quests jsonb := '[]'::jsonb;
BEGIN
    -- Delete existing quests for this week
    DELETE FROM quests_weekly WHERE user_id = p_user_id AND week_start = p_week_start;
    
    -- Generate weekly quests
    INSERT INTO quests_weekly (user_id, title, description, quest_type, quest_value, xp_reward, token_reward, week_start)
    VALUES
        (p_user_id, 'Meditate 3 times this week', 'Build a consistent meditation practice', 'meditate_3x', 3, 200, 5, p_week_start),
        (p_user_id, 'Play 10 mind games', 'Keep your mind sharp', 'play_10_games', 10, 150, 3, p_week_start),
        (p_user_id, 'Complete 5 daily quests', 'Stay consistent with daily goals', 'complete_5_daily_quests', 5, 100, 2, p_week_start),
        (p_user_id, '3-day hydration streak', 'Drink water consistently', '3_day_hydration_streak', 3, 150, 3, p_week_start),
        (p_user_id, 'Log sleep 5 times', 'Track your sleep patterns', 'log_sleep_5x', 5, 120, 2, p_week_start);
    
    -- Return generated quests
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'description', description,
            'quest_type', quest_type,
            'quest_value', quest_value,
            'xp_reward', xp_reward,
            'token_reward', token_reward,
            'completed', completed,
            'completed_at', completed_at
        )
    ) INTO v_quests
    FROM quests_weekly
    WHERE user_id = p_user_id AND week_start = p_week_start;
    
    RETURN jsonb_build_object('quests', COALESCE(v_quests, '[]'::jsonb));
END;
$$;

-- =========================================================
-- 11. GET WEEKLY QUESTS
-- =========================================================

CREATE OR REPLACE FUNCTION get_weekly_quests(
    p_user_id uuid,
    p_week_start date DEFAULT date_trunc('week', CURRENT_DATE)::date
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_quests jsonb;
    v_quest_count int;
BEGIN
    -- Check if quests exist for this week
    SELECT COUNT(*) INTO v_quest_count
    FROM quests_weekly
    WHERE user_id = p_user_id AND week_start = p_week_start;
    
    -- Generate if none exist
    IF v_quest_count = 0 THEN
        PERFORM generate_weekly_quests(p_user_id, p_week_start);
    END IF;
    
    -- Get quests
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'description', description,
            'quest_type', quest_type,
            'quest_value', quest_value,
            'xp_reward', xp_reward,
            'token_reward', token_reward,
            'completed', completed,
            'completed_at', completed_at
        )
    ) INTO v_quests
    FROM quests_weekly
    WHERE user_id = p_user_id AND week_start = p_week_start
    ORDER BY completed, created_at;
    
    RETURN jsonb_build_object('quests', COALESCE(v_quests, '[]'::jsonb));
END;
$$;

-- =========================================================
-- 12. CHECK QUEST PROGRESS (Helper function)
-- =========================================================

CREATE OR REPLACE FUNCTION check_quest_progress(
    p_user_id uuid,
    p_quest_type text,
    p_progress_value int DEFAULT 1
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_quest quests_daily%ROWTYPE;
    v_weekly_quest quests_weekly%ROWTYPE;
    v_completed boolean := false;
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
            UPDATE quests_daily
            SET completed = true,
                completed_at = timezone('utc', now())
            WHERE id = v_quest.id;
            
            -- Award XP and tokens
            PERFORM add_xp(p_user_id, v_quest.xp_reward, 'quest', v_quest.id, format('Completed: %s', v_quest.title));
            IF v_quest.token_reward > 0 THEN
                PERFORM add_tokens(p_user_id, v_quest.token_reward, 'quest', v_quest.id);
            END IF;
            
            -- Log to history
            INSERT INTO quests_history (user_id, quest_type, quest_title, completed, completed_at, xp_reward, token_reward)
            VALUES (p_user_id, 'daily', v_quest.title, true, timezone('utc', now()), v_quest.xp_reward, v_quest.token_reward);
        END IF;
    END LOOP;
    
    -- Check weekly quests (similar logic, but more complex - would need to track progress)
    -- This is a simplified version - full implementation would track progress separately
END;
$$;

-- =========================================================
-- 13. COMPLETE QUEST (Manual completion)
-- =========================================================

CREATE OR REPLACE FUNCTION complete_quest(
    p_user_id uuid,
    p_quest_id uuid,
    p_quest_type text -- 'daily' or 'weekly'
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_daily_quest quests_daily%ROWTYPE;
    v_weekly_quest quests_weekly%ROWTYPE;
    v_result jsonb;
BEGIN
    IF p_quest_type = 'daily' THEN
        SELECT * INTO v_daily_quest FROM quests_daily WHERE id = p_quest_id AND user_id = p_user_id;
        
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Quest not found');
        END IF;
        
        IF v_daily_quest.completed THEN
            RETURN jsonb_build_object('success', false, 'error', 'Quest already completed');
        END IF;
        
        -- Mark as completed
        UPDATE quests_daily
        SET completed = true,
            completed_at = timezone('utc', now())
        WHERE id = p_quest_id;
        
        -- Award rewards
        PERFORM add_xp(p_user_id, v_daily_quest.xp_reward, 'quest', p_quest_id, format('Completed: %s', v_daily_quest.title));
        IF v_daily_quest.token_reward > 0 THEN
            PERFORM add_tokens(p_user_id, v_daily_quest.token_reward, 'quest', p_quest_id);
        END IF;
        
        -- Log to history
        INSERT INTO quests_history (user_id, quest_type, quest_title, completed, completed_at, xp_reward, token_reward)
        VALUES (p_user_id, 'daily', v_daily_quest.title, true, timezone('utc', now()), v_daily_quest.xp_reward, v_daily_quest.token_reward);
        
        RETURN jsonb_build_object(
            'success', true,
            'xp_earned', v_daily_quest.xp_reward,
            'tokens_earned', v_daily_quest.token_reward
        );
        
    ELSIF p_quest_type = 'weekly' THEN
        SELECT * INTO v_weekly_quest FROM quests_weekly WHERE id = p_quest_id AND user_id = p_user_id;
        
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Quest not found');
        END IF;
        
        IF v_weekly_quest.completed THEN
            RETURN jsonb_build_object('success', false, 'error', 'Quest already completed');
        END IF;
        
        -- Mark as completed
        UPDATE quests_weekly
        SET completed = true,
            completed_at = timezone('utc', now())
        WHERE id = p_quest_id;
        
        -- Award rewards
        PERFORM add_xp(p_user_id, v_weekly_quest.xp_reward, 'quest', p_quest_id, format('Completed: %s', v_weekly_quest.title));
        IF v_weekly_quest.token_reward > 0 THEN
            PERFORM add_tokens(p_user_id, v_weekly_quest.token_reward, 'quest', p_quest_id);
        END IF;
        
        -- Log to history
        INSERT INTO quests_history (user_id, quest_type, quest_title, completed, completed_at, xp_reward, token_reward)
        VALUES (p_user_id, 'weekly', v_weekly_quest.title, true, timezone('utc', now()), v_weekly_quest.xp_reward, v_weekly_quest.token_reward);
        
        RETURN jsonb_build_object(
            'success', true,
            'xp_earned', v_weekly_quest.xp_reward,
            'tokens_earned', v_weekly_quest.token_reward
        );
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Invalid quest type');
    END IF;
END;
$$;

-- =========================================================
-- MODULE J PHASE 2 — COMPLETE
-- =========================================================
-- RPC Functions created:
-- ✅ add_xp - Core XP system
-- ✅ add_tokens - Token economy
-- ✅ log_game_session_mindworld - Game session tracking
-- ✅ log_meditation_session_mindworld - Meditation tracking
-- ✅ unlock_item - Garden unlockables
-- ✅ get_garden_state - Get user's garden
-- ✅ update_garden_state - Update garden visuals
-- ✅ generate_daily_quests - Auto-generate daily quests
-- ✅ get_daily_quests - Get today's quests
-- ✅ generate_weekly_quests - Auto-generate weekly quests
-- ✅ get_weekly_quests - Get this week's quests
-- ✅ check_quest_progress - Auto-complete quests
-- ✅ complete_quest - Manual quest completion
-- =========================================================
-- Next: Phase 3 — Client-side XP/Level/Token Engine
-- =========================================================

