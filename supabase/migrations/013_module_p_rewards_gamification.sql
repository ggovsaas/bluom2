-- =========================================================
-- MODULE P — REWARDS & GAMIFICATION
-- XP system, levels, badges, missions, challenges, streaks, health score
-- =========================================================

-- 1. TABLES -----------------------------------------------

-- P1 — user_progress
-- XP, level, and health score tracking
CREATE TABLE IF NOT EXISTS user_progress (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    xp int DEFAULT 0,
    level int DEFAULT 1,
    health_score numeric DEFAULT 50,
    total_xp_earned int DEFAULT 0,
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- P2 — badges
-- Catalog of available badges
CREATE TABLE IF NOT EXISTS badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    icon_url text,
    category text NOT NULL, -- sleep, mood, nutrition, fitness, mindfulness, general
    requirement_type text NOT NULL, -- log_count, streak, score, duration, xp, level
    requirement_value int NOT NULL,
    premium boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- P3 — user_badges
-- Tracks which badges users have earned
CREATE TABLE IF NOT EXISTS user_badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id uuid REFERENCES badges(id) ON DELETE CASCADE,
    earned_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, badge_id)
);

-- P4 — daily_missions
-- Catalog of daily missions (can be seeded or generated)
CREATE TABLE IF NOT EXISTS daily_missions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    xp_reward int NOT NULL DEFAULT 10,
    mission_code text NOT NULL, -- LOG_MEAL, DRINK_WATER, MEDITATE, PLAY_GAME, LOG_WORKOUT, LOG_SLEEP, LOG_MOOD, COMPLETE_HABIT, WALK_STEPS
    premium boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- P5 — user_daily_missions
-- Tracks which missions the user completed today
CREATE TABLE IF NOT EXISTS user_daily_missions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_id uuid REFERENCES daily_missions(id) ON DELETE CASCADE,
    date date DEFAULT CURRENT_DATE,
    completed boolean DEFAULT false,
    completed_at timestamptz,
    UNIQUE(user_id, mission_id, date)
);

-- P6 — user_streaks
-- General app usage streak (separate from meditation_streaks in Module O)
CREATE TABLE IF NOT EXISTS user_streaks (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak int DEFAULT 0,
    longest_streak int DEFAULT 0,
    last_active_date date,
    streak_type text DEFAULT 'general', -- general, workout, nutrition, wellness
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- P7 — challenges
-- Weekly / monthly challenges
CREATE TABLE IF NOT EXISTS challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    duration text NOT NULL, -- weekly, monthly
    xp_reward int NOT NULL DEFAULT 100,
    goal_type text NOT NULL, -- workouts, meditations, steps, meals, habits, water
    goal_value int NOT NULL,
    premium boolean DEFAULT false,
    start_date date,
    end_date date,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- P8 — user_challenges
-- Tracks user participation in challenges
CREATE TABLE IF NOT EXISTS user_challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
    progress_value int DEFAULT 0,
    completed boolean DEFAULT false,
    completed_at timestamptz,
    started_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, challenge_id)
);

-- P9 — xp_transactions
-- Audit log of all XP earned (for debugging and analytics)
CREATE TABLE IF NOT EXISTS xp_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    xp_amount int NOT NULL,
    source text NOT NULL, -- LOG_MEAL, WORKOUT, MEDITATION, MISSION, CHALLENGE, BADGE, etc.
    source_id uuid, -- ID of the related record (workout_log_id, mission_id, etc.)
    multiplier numeric DEFAULT 1.0, -- Premium users get 2.0
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- 2. RLS (Row-Level Security) ----------------------------

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read badges catalog
CREATE POLICY "public_read_badges"
ON badges
FOR SELECT
USING (true);

CREATE POLICY "users_manage_own_progress"
ON user_progress
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_badges"
ON user_badges
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Everyone can read daily missions
CREATE POLICY "public_read_daily_missions"
ON daily_missions
FOR SELECT
USING (true);

CREATE POLICY "users_manage_own_daily_missions"
ON user_daily_missions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_streaks"
ON user_streaks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Everyone can read challenges
CREATE POLICY "public_read_challenges"
ON challenges
FOR SELECT
USING (true);

CREATE POLICY "users_manage_own_challenges"
ON user_challenges
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_view_own_xp_transactions"
ON xp_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- 3. INDEXES ---------------------------------------------

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_missions_user_date ON user_daily_missions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge ON user_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_date ON xp_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_daily_missions_code ON daily_missions(mission_code);

-- 4. RPC FUNCTIONS ---------------------------------------

-- P-RPC1 — award_xp(user_id, xp_amount, source, source_id)
-- Awards XP to a user and handles level ups
CREATE OR REPLACE FUNCTION award_xp(
    user_id_param uuid,
    xp_amount_param int,
    source_param text,
    source_id_param uuid DEFAULT NULL,
    multiplier_param numeric DEFAULT 1.0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    final_xp int;
    current_xp int;
    current_level int;
    new_level int;
    xp_for_next_level int;
    leveled_up boolean := false;
    is_premium boolean;
BEGIN
    -- Check if user is premium (2x XP multiplier)
    -- This would check subscriptions table - for now default to 1.0
    -- TODO: Integrate with subscription check
    final_xp := FLOOR(xp_amount_param * multiplier_param)::int;
    
    -- Get current progress
    SELECT xp, level INTO current_xp, current_level
    FROM user_progress
    WHERE user_id = user_id_param;
    
    -- If user doesn't exist in progress table, create entry
    IF current_xp IS NULL THEN
        INSERT INTO user_progress (user_id, xp, level)
        VALUES (user_id_param, 0, 1)
        ON CONFLICT (user_id) DO NOTHING;
        current_xp := 0;
        current_level := 1;
    END IF;
    
    -- Add XP
    new_level := current_level;
    xp_for_next_level := new_level * 150;
    
    -- Check for level ups
    WHILE (current_xp + final_xp) >= xp_for_next_level LOOP
        new_level := new_level + 1;
        xp_for_next_level := new_level * 150;
        leveled_up := true;
    END LOOP;
    
    -- Update progress
    UPDATE user_progress
    SET xp = current_xp + final_xp,
        level = new_level,
        total_xp_earned = total_xp_earned + final_xp,
        updated_at = timezone('utc', now())
    WHERE user_id = user_id_param;
    
    -- Log transaction
    INSERT INTO xp_transactions (user_id, xp_amount, source, source_id, multiplier)
    VALUES (user_id_param, final_xp, source_param, source_id_param, multiplier_param);
    
    -- Check for badges
    PERFORM check_and_award_badges(user_id_param);
    
    RETURN jsonb_build_object(
        'xp_awarded', final_xp,
        'new_total_xp', current_xp + final_xp,
        'level', new_level,
        'leveled_up', leveled_up,
        'xp_for_next_level', xp_for_next_level - (current_xp + final_xp)
    );
END;
$$;

-- P-RPC2 — check_and_award_badges(user_id)
-- Checks if user qualifies for any badges
CREATE OR REPLACE FUNCTION check_and_award_badges(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    badge_record RECORD;
    qualifies boolean;
    badge_count int;
    streak_days int;
    total_xp int;
    user_level int;
BEGIN
    FOR badge_record IN 
        SELECT * FROM badges 
        WHERE id NOT IN (
            SELECT badge_id FROM user_badges WHERE user_id = user_id_param
        )
    LOOP
        qualifies := false;
        
        CASE badge_record.requirement_type
            WHEN 'log_count' THEN
                -- Check log counts based on category
                IF badge_record.category = 'nutrition' THEN
                    SELECT COUNT(*) INTO badge_count
                    FROM meal_logs
                    WHERE user_id = user_id_param;
                ELSIF badge_record.category = 'fitness' THEN
                    SELECT COUNT(*) INTO badge_count
                    FROM workout_logs
                    WHERE user_id = user_id_param;
                ELSIF badge_record.category = 'mindfulness' THEN
                    SELECT COUNT(*) INTO badge_count
                    FROM meditation_logs
                    WHERE user_id = user_id_param;
                ELSIF badge_record.category = 'wellness' THEN
                    SELECT COUNT(*) INTO badge_count
                    FROM moods
                    WHERE user_id = user_id_param;
                END IF;
                
                qualifies := badge_count >= badge_record.requirement_value;
                
            WHEN 'streak' THEN
                SELECT current_streak INTO streak_days
                FROM user_streaks
                WHERE user_id = user_id_param AND streak_type = 'general';
                
                IF streak_days IS NULL THEN
                    streak_days := 0;
                END IF;
                
                qualifies := streak_days >= badge_record.requirement_value;
                
            WHEN 'xp' THEN
                SELECT total_xp_earned INTO total_xp
                FROM user_progress
                WHERE user_id = user_id_param;
                
                IF total_xp IS NULL THEN
                    total_xp := 0;
                END IF;
                
                qualifies := total_xp >= badge_record.requirement_value;
                
            WHEN 'level' THEN
                SELECT level INTO user_level
                FROM user_progress
                WHERE user_id = user_id_param;
                
                IF user_level IS NULL THEN
                    user_level := 1;
                END IF;
                
                qualifies := user_level >= badge_record.requirement_value;
                
            WHEN 'score' THEN
                -- For game-related badges
                SELECT MAX(score) INTO badge_count
                FROM mind_game_sessions
                WHERE user_id = user_id_param;
                
                IF badge_count IS NULL THEN
                    badge_count := 0;
                END IF;
                
                qualifies := badge_count >= badge_record.requirement_value;
                
            WHEN 'duration' THEN
                -- For meditation duration badges
                SELECT SUM(duration_minutes) INTO badge_count
                FROM meditation_logs
                WHERE user_id = user_id_param;
                
                IF badge_count IS NULL THEN
                    badge_count := 0;
                END IF;
                
                qualifies := badge_count >= badge_record.requirement_value;
        END CASE;
        
        IF qualifies THEN
            INSERT INTO user_badges (user_id, badge_id)
            VALUES (user_id_param, badge_record.id)
            ON CONFLICT (user_id, badge_id) DO NOTHING;
            
            -- Award XP for badge
            PERFORM award_xp(user_id_param, 50, 'BADGE', badge_record.id);
        END IF;
    END LOOP;
END;
$$;

-- P-RPC3 — complete_mission(user_id, mission_code)
-- Marks a daily mission as complete and awards XP
CREATE OR REPLACE FUNCTION complete_mission(
    user_id_param uuid,
    mission_code_param text
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    mission_record RECORD;
    mission_completed boolean;
    xp_result jsonb;
BEGIN
    -- Find the mission
    SELECT * INTO mission_record
    FROM daily_missions
    WHERE mission_code = mission_code_param
    LIMIT 1;
    
    IF mission_record IS NULL THEN
        RETURN jsonb_build_object('error', 'Mission not found');
    END IF;
    
    -- Check if already completed today
    SELECT completed INTO mission_completed
    FROM user_daily_missions
    WHERE user_id = user_id_param
      AND mission_id = mission_record.id
      AND date = CURRENT_DATE;
    
    IF mission_completed THEN
        RETURN jsonb_build_object('error', 'Mission already completed today');
    END IF;
    
    -- Mark as completed
    INSERT INTO user_daily_missions (user_id, mission_id, completed, completed_at)
    VALUES (user_id_param, mission_record.id, true, timezone('utc', now()))
    ON CONFLICT (user_id, mission_id, date) 
    DO UPDATE SET completed = true, completed_at = timezone('utc', now());
    
    -- Award XP
    xp_result := award_xp(user_id_param, mission_record.xp_reward, 'MISSION', mission_record.id);
    
    -- Update streak
    PERFORM update_user_streak(user_id_param);
    
    RETURN jsonb_build_object(
        'mission_completed', true,
        'xp_awarded', mission_record.xp_reward,
        'xp_result', xp_result
    );
END;
$$;

-- P-RPC4 — update_user_streak(user_id)
-- Updates general app usage streak
CREATE OR REPLACE FUNCTION update_user_streak(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_streak_val int := 0;
    longest_streak_val int := 0;
    last_date date;
    has_activity boolean;
BEGIN
    -- Check if user was active today (any log entry)
    SELECT EXISTS (
        SELECT 1 FROM meal_logs WHERE user_id = user_id_param AND DATE(logged_at) = CURRENT_DATE
        UNION
        SELECT 1 FROM workout_logs WHERE user_id = user_id_param AND DATE(completed_at) = CURRENT_DATE
        UNION
        SELECT 1 FROM meditation_logs WHERE user_id = user_id_param AND DATE(completed_at) = CURRENT_DATE
        UNION
        SELECT 1 FROM moods WHERE user_id = user_id_param AND DATE(created_at) = CURRENT_DATE
        UNION
        SELECT 1 FROM sleep_logs WHERE user_id = user_id_param AND DATE(created_at) = CURRENT_DATE
        UNION
        SELECT 1 FROM habit_logs WHERE user_id = user_id_param AND date = CURRENT_DATE
    ) INTO has_activity;
    
    IF NOT has_activity THEN
        RETURN;
    END IF;
    
    -- Get current streak info
    SELECT current_streak, longest_streak, last_active_date
    INTO current_streak_val, longest_streak_val, last_date
    FROM user_streaks
    WHERE user_id = user_id_param AND streak_type = 'general';
    
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
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date, streak_type)
    VALUES (user_id_param, current_streak_val, longest_streak_val, CURRENT_DATE, 'general')
    ON CONFLICT (user_id) 
    DO UPDATE SET
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        last_active_date = EXCLUDED.last_active_date,
        updated_at = timezone('utc', now());
END;
$$;

-- P-RPC5 — join_challenge(user_id, challenge_id)
-- User joins a challenge
CREATE OR REPLACE FUNCTION join_challenge(
    user_id_param uuid,
    challenge_id_param uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    challenge_record RECORD;
BEGIN
    -- Get challenge
    SELECT * INTO challenge_record
    FROM challenges
    WHERE id = challenge_id_param;
    
    IF challenge_record IS NULL THEN
        RETURN jsonb_build_object('error', 'Challenge not found');
    END IF;
    
    -- Check if challenge is active
    IF challenge_record.end_date < CURRENT_DATE THEN
        RETURN jsonb_build_object('error', 'Challenge has ended');
    END IF;
    
    -- Join challenge
    INSERT INTO user_challenges (user_id, challenge_id, progress_value)
    VALUES (user_id_param, challenge_id_param, 0)
    ON CONFLICT (user_id, challenge_id) DO NOTHING;
    
    RETURN jsonb_build_object('joined', true, 'challenge', challenge_record.title);
END;
$$;

-- P-RPC6 — update_challenge_progress(user_id, challenge_id, progress_increment)
-- Updates challenge progress
CREATE OR REPLACE FUNCTION update_challenge_progress(
    user_id_param uuid,
    challenge_id_param uuid,
    progress_increment int DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    challenge_record RECORD;
    current_progress int;
    goal_value int;
    completed boolean;
    xp_result jsonb;
BEGIN
    -- Get challenge
    SELECT * INTO challenge_record
    FROM challenges
    WHERE id = challenge_id_param;
    
    IF challenge_record IS NULL THEN
        RETURN jsonb_build_object('error', 'Challenge not found');
    END IF;
    
    -- Get current progress
    SELECT progress_value, completed INTO current_progress, completed
    FROM user_challenges
    WHERE user_id = user_id_param AND challenge_id = challenge_id_param;
    
    IF current_progress IS NULL THEN
        RETURN jsonb_build_object('error', 'User not in challenge');
    END IF;
    
    IF completed THEN
        RETURN jsonb_build_object('error', 'Challenge already completed');
    END IF;
    
    -- Update progress
    current_progress := current_progress + progress_increment;
    goal_value := challenge_record.goal_value;
    
    IF current_progress >= goal_value THEN
        completed := true;
        -- Award XP
        xp_result := award_xp(user_id_param, challenge_record.xp_reward, 'CHALLENGE', challenge_id_param);
    END IF;
    
    UPDATE user_challenges
    SET progress_value = current_progress,
        completed = completed,
        completed_at = CASE WHEN completed THEN timezone('utc', now()) ELSE NULL END
    WHERE user_id = user_id_param AND challenge_id = challenge_id_param;
    
    RETURN jsonb_build_object(
        'progress', current_progress,
        'goal', goal_value,
        'completed', completed,
        'xp_result', xp_result
    );
END;
$$;

-- P-RPC7 — calculate_health_score(user_id)
-- Calculates overall health score (0-100)
CREATE OR REPLACE FUNCTION calculate_health_score(user_id_param uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    sleep_score numeric := 0;
    nutrition_score numeric := 0;
    activity_score numeric := 0;
    wellness_score numeric := 0;
    health_score numeric;
    
    sleep_hours numeric;
    sleep_target numeric;
    calories_consumed numeric;
    calories_target numeric;
    protein_consumed numeric;
    protein_target numeric;
    steps_today int;
    steps_target int;
    mood_today int;
    habits_completed int;
    habits_total int;
BEGIN
    -- Get today's data from daily_summaries (Module R)
    -- NOTE: Module R must be applied before Module P for this function to work
    SELECT 
        sleep_hours,
        calories_consumed, calories_target,
        protein_consumed, protein_target,
        steps, steps_target,
        mood,
        habits_completed, habits_total
    INTO 
        sleep_hours, sleep_target,
        calories_consumed, calories_target,
        protein_consumed, protein_target,
        steps_today, steps_target,
        mood_today,
        habits_completed, habits_total
    FROM daily_summaries
    WHERE user_id = user_id_param AND date = CURRENT_DATE;
    
    -- If no data, try to get from user_goals for targets
    IF sleep_target IS NULL THEN
        SELECT sleep_hours_target INTO sleep_target
        FROM user_goals
        WHERE user_id = user_id_param
        ORDER BY generated_at DESC
        LIMIT 1;
    END IF;
    
    IF calories_target IS NULL OR steps_target IS NULL THEN
        SELECT calories_target, steps_target INTO calories_target, steps_target
        FROM user_goals
        WHERE user_id = user_id_param
        ORDER BY generated_at DESC
        LIMIT 1;
    END IF;
    
    -- Calculate sleep score (0-100)
    IF sleep_hours IS NOT NULL AND sleep_target IS NOT NULL THEN
        IF sleep_hours >= sleep_target THEN
            sleep_score := 100;
        ELSIF sleep_hours >= sleep_target * 0.8 THEN
            sleep_score := 80;
        ELSIF sleep_hours >= sleep_target * 0.6 THEN
            sleep_score := 60;
        ELSE
            sleep_score := 40;
        END IF;
    ELSE
        sleep_score := 50; -- Default if no data
    END IF;
    
    -- Calculate nutrition score (0-100)
    IF calories_consumed IS NOT NULL AND calories_target IS NOT NULL THEN
        nutrition_score := LEAST(100, (calories_consumed::numeric / calories_target::numeric) * 100);
        
        -- Bonus for protein
        IF protein_consumed IS NOT NULL AND protein_target IS NOT NULL THEN
            IF protein_consumed >= protein_target THEN
                nutrition_score := LEAST(100, nutrition_score + 10);
            END IF;
        END IF;
    ELSE
        nutrition_score := 50;
    END IF;
    
    -- Calculate activity score (0-100)
    IF steps_today IS NOT NULL AND steps_target IS NOT NULL THEN
        activity_score := LEAST(100, (steps_today::numeric / steps_target::numeric) * 100);
    ELSE
        activity_score := 50;
    END IF;
    
    -- Calculate wellness score (0-100)
    IF mood_today IS NOT NULL THEN
        wellness_score := (mood_today::numeric / 5.0) * 100;
    ELSE
        wellness_score := 50;
    END IF;
    
    IF habits_total > 0 THEN
        wellness_score := (wellness_score + (habits_completed::numeric / habits_total::numeric) * 100) / 2;
    END IF;
    
    -- Weighted average
    health_score := (
        sleep_score * 0.25 +
        nutrition_score * 0.25 +
        activity_score * 0.25 +
        wellness_score * 0.25
    );
    
    -- Update user_progress
    UPDATE user_progress
    SET health_score = health_score,
        updated_at = timezone('utc', now())
    WHERE user_id = user_id_param;
    
    RETURN health_score;
END;
$$;

-- P-RPC8 — get_user_progress(user_id)
-- Gets complete progress summary
CREATE OR REPLACE FUNCTION get_user_progress(user_id_param uuid)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_build_object(
        'xp', COALESCE(xp, 0),
        'level', COALESCE(level, 1),
        'health_score', COALESCE(health_score, 50),
        'total_xp_earned', COALESCE(total_xp_earned, 0),
        'xp_for_next_level', (COALESCE(level, 1) * 150) - COALESCE(xp, 0),
        'streak', COALESCE(
            (SELECT current_streak FROM user_streaks WHERE user_id = user_id_param AND streak_type = 'general'),
            0
        ),
        'longest_streak', COALESCE(
            (SELECT longest_streak FROM user_streaks WHERE user_id = user_id_param AND streak_type = 'general'),
            0
        ),
        'badges_earned', (
            SELECT COUNT(*) FROM user_badges WHERE user_id = user_id_param
        ),
        'missions_completed_today', (
            SELECT COUNT(*) FROM user_daily_missions 
            WHERE user_id = user_id_param 
              AND date = CURRENT_DATE 
              AND completed = true
        ),
        'active_challenges', (
            SELECT COUNT(*) FROM user_challenges 
            WHERE user_id = user_id_param 
              AND completed = false
        )
    )
    FROM user_progress
    WHERE user_id = user_id_param;
$$;

-- P-RPC9 — get_daily_missions_for_user(user_id)
-- Gets today's missions with completion status
CREATE OR REPLACE FUNCTION get_daily_missions_for_user(user_id_param uuid)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    xp_reward int,
    mission_code text,
    premium boolean,
    completed boolean
)
LANGUAGE sql
AS $$
    SELECT 
        dm.id,
        dm.title,
        dm.description,
        dm.xp_reward,
        dm.mission_code,
        dm.premium,
        COALESCE(udm.completed, false) as completed
    FROM daily_missions dm
    LEFT JOIN user_daily_missions udm ON (
        udm.mission_id = dm.id 
        AND udm.user_id = user_id_param 
        AND udm.date = CURRENT_DATE
    )
    ORDER BY dm.premium ASC, dm.xp_reward DESC;
$$;

-- P-RPC10 — get_user_badges(user_id)
-- Gets all badges earned by user
CREATE OR REPLACE FUNCTION get_user_badges(user_id_param uuid)
RETURNS TABLE (
    badge_id uuid,
    name text,
    description text,
    icon_url text,
    category text,
    earned_at timestamptz
)
LANGUAGE sql
AS $$
    SELECT 
        b.id,
        b.name,
        b.description,
        b.icon_url,
        b.category,
        ub.earned_at
    FROM user_badges ub
    JOIN badges b ON ub.badge_id = b.id
    WHERE ub.user_id = user_id_param
    ORDER BY ub.earned_at DESC;
$$;

-- 5. TRIGGERS ---------------------------------------------

-- Auto-update updated_at on user_progress
CREATE OR REPLACE FUNCTION update_user_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_progress_timestamp
BEFORE UPDATE ON user_progress
FOR EACH ROW
EXECUTE FUNCTION update_user_progress_timestamp();

-- Auto-update updated_at on user_streaks
CREATE OR REPLACE FUNCTION update_user_streaks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_streaks_timestamp
BEFORE UPDATE ON user_streaks
FOR EACH ROW
EXECUTE FUNCTION update_user_streaks_timestamp();

