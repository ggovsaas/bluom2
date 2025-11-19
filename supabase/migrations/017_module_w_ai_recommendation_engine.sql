-- =========================================================
-- MODULE W — AI RECOMMENDATION ENGINE
-- Daily AI-driven recommendations for nutrition, workouts, wellness, sleep, habits, and recovery
-- =========================================================

-- 1. TABLES -----------------------------------------------

-- W1 — ai_recommendations
-- Stores all AI suggestions generated for each user
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category text NOT NULL, 
    -- nutrition, workout, wellness, sleep, mood, recovery, grocery, habit, challenge, hydration
    title text NOT NULL,
    description text NOT NULL,
    action jsonb DEFAULT '{}'::jsonb,       
    -- example: {"type": "open_page", "target": "/workout/upper-body"}
    -- or:      {"type": "add_item", "item_id": "apple", "qty": 3}
    score numeric DEFAULT 0, 
    -- relevance weight (0–1)
    status text DEFAULT 'new', 
    -- new, read, ignored, completed
    created_at timestamptz DEFAULT timezone('utc', now()),
    expires_at timestamptz
);

-- W2 — ai_context_triggers
-- When user logs something → the AI responds instantly
CREATE TABLE IF NOT EXISTS ai_context_triggers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trigger_type text NOT NULL, 
    -- "meal_logged", "workout_completed", "mood_low", "sleep_poor", "water_low", "steps_low", "habit_complete", etc.
    payload jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- W3 — ai_recommendation_stats
-- Tracks what users engage with to improve personalization
CREATE TABLE IF NOT EXISTS ai_recommendation_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation_id uuid REFERENCES ai_recommendations(id) ON DELETE CASCADE,
    interaction text NOT NULL, -- viewed, dismissed, done, clicked
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- W4 — ai_personalization_profile
-- Adaptively updates user preferences
CREATE TABLE IF NOT EXISTS ai_personalization_profile (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_meals jsonb DEFAULT '[]'::jsonb, 
    disliked_meals jsonb DEFAULT '[]'::jsonb,
    favorite_workouts jsonb DEFAULT '[]'::jsonb,
    struggle_workouts jsonb DEFAULT '[]'::jsonb,
    stress_patterns jsonb DEFAULT '[]'::jsonb,
    mood_patterns jsonb DEFAULT '[]'::jsonb,
    recovery_patterns jsonb DEFAULT '[]'::jsonb,
    optimal_sleep_window jsonb DEFAULT NULL,
    -- {"start": "22:00", "end": "06:00"}
    hydration_baseline integer DEFAULT 2000,
    last_updated timestamptz DEFAULT timezone('utc', now())
);

-- 2. INDEXES ----------------------------------------------

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_category ON ai_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_created ON ai_recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_expires ON ai_recommendations(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_context_triggers_user ON ai_context_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_triggers_type ON ai_context_triggers(trigger_type);
CREATE INDEX IF NOT EXISTS idx_ai_context_triggers_created ON ai_context_triggers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendation_stats_user ON ai_recommendation_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendation_stats_recommendation ON ai_recommendation_stats(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendation_stats_interaction ON ai_recommendation_stats(interaction);

-- 3. RLS (Row-Level Security) ----------------------------

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_context_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendation_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_personalization_profile ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "users_manage_own_recommendations"
ON ai_recommendations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_context_triggers"
ON ai_context_triggers
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_recommendation_stats"
ON ai_recommendation_stats
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_personalization_profile"
ON ai_personalization_profile
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. RPC FUNCTIONS ---------------------------------------

-- W-RPC1 — generate_daily_recommendations(user_id)
-- Generates daily recommendations (runs at midnight via CRON)
CREATE OR REPLACE FUNCTION generate_daily_recommendations(p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_premium boolean;
    daily_recommendation_count int;
    protein_yesterday int;
    protein_target int;
    last_upper_body_date date;
    last_workout_date date;
    sleep_hours_last_night numeric;
    sleep_target numeric;
    water_yesterday int;
    mood_today int;
    stress_level int;
BEGIN
    -- Check if user is premium
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    -- Check daily recommendation count (free: 2/day, premium: unlimited)
    SELECT COUNT(*) INTO daily_recommendation_count
    FROM ai_recommendations
    WHERE user_id = p_user
      AND DATE(created_at) = CURRENT_DATE
      AND status != 'ignored';
    
    -- NUTRITION RECOMMENDATION
    -- Check protein intake from yesterday
    SELECT COALESCE(protein, 0), COALESCE(protein_target, 0)
    INTO protein_yesterday, protein_target
    FROM daily_summaries
    WHERE user_id = p_user AND date = CURRENT_DATE - INTERVAL '1 day';
    
    IF protein_target IS NULL THEN
        SELECT protein_target INTO protein_target
        FROM user_goals
        WHERE user_id = p_user
        ORDER BY generated_at DESC
        LIMIT 1;
    END IF;
    
    IF protein_yesterday < protein_target * 0.7 AND (is_premium OR daily_recommendation_count < 2) THEN
        INSERT INTO ai_recommendations (
            user_id, category, title, description, action, score, expires_at
        )
        VALUES (
            p_user,
            'nutrition',
            'Protein looks low today',
            'Based on yesterday''s intake, you should aim for at least ' || ROUND(protein_target * 0.3)::text || 'g protein in your next meal.',
            jsonb_build_object('type', 'open_page', 'target', '/fuel/recipes'),
            0.8,
            timezone('utc', now()) + INTERVAL '1 day'
        );
        daily_recommendation_count := daily_recommendation_count + 1;
    END IF;
    
    -- WORKOUT RECOMMENDATION
    -- Check last upper body workout
    SELECT MAX(DATE(completed_at)) INTO last_upper_body_date
    FROM workout_logs wl
    JOIN workout_exercises we ON we.workout_id = wl.workout_id
    JOIN exercises e ON e.id = we.exercise_id
    WHERE wl.user_id = p_user
      AND (e.muscle_groups @> ARRAY['chest']::text[] 
           OR e.muscle_groups @> ARRAY['shoulders']::text[]
           OR e.muscle_groups @> ARRAY['triceps']::text[]);
    
    IF last_upper_body_date IS NULL OR last_upper_body_date < CURRENT_DATE - INTERVAL '4 days' THEN
        IF is_premium OR daily_recommendation_count < 2 THEN
            INSERT INTO ai_recommendations (
                user_id, category, title, description, action, score, expires_at
            )
            VALUES (
                p_user,
                'workout',
                'Upper Body Recommended',
                CASE 
                    WHEN last_upper_body_date IS NULL THEN 'Start your upper body training today for balanced muscle development.'
                    ELSE 'Your last upper-body session was ' || (CURRENT_DATE - last_upper_body_date)::text || ' days ago. A new session today keeps your plan balanced.'
                END,
                jsonb_build_object('type', 'open_page', 'target', '/move/workouts'),
                0.9,
                timezone('utc', now()) + INTERVAL '1 day'
            );
            daily_recommendation_count := daily_recommendation_count + 1;
        END IF;
    END IF;
    
    -- SLEEP RECOMMENDATION
    -- Check sleep from last night
    SELECT hours INTO sleep_hours_last_night
    FROM sleep_logs
    WHERE user_id = p_user
      AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF sleep_hours_last_night IS NOT NULL THEN
        SELECT sleep_hours_target INTO sleep_target
        FROM user_goals
        WHERE user_id = p_user
        ORDER BY generated_at DESC
        LIMIT 1;
        
        IF sleep_target IS NOT NULL AND sleep_hours_last_night < sleep_target * 0.85 AND is_premium THEN
            INSERT INTO ai_recommendations (
                user_id, category, title, description, action, score, expires_at
            )
            VALUES (
                p_user,
                'sleep',
                'Recovery Focus Today',
                'You slept ' || ROUND(sleep_hours_last_night, 1)::text || ' hours last night. Consider lighter activity and earlier bedtime tonight.',
                jsonb_build_object('type', 'open_page', 'target', '/wellness/sleep'),
                0.85,
                timezone('utc', now()) + INTERVAL '1 day'
            );
        END IF;
    END IF;
    
    -- HYDRATION RECOMMENDATION
    -- Check water intake from yesterday
    SELECT COALESCE(water_ml, 0) INTO water_yesterday
    FROM daily_summaries
    WHERE user_id = p_user AND date = CURRENT_DATE - INTERVAL '1 day';
    
    IF water_yesterday < 1500 AND (is_premium OR daily_recommendation_count < 2) THEN
        INSERT INTO ai_recommendations (
            user_id, category, title, description, action, score, expires_at
        )
        VALUES (
            p_user,
            'hydration',
            'Increase Hydration Today',
            'You drank ' || water_yesterday::text || 'ml yesterday. Aim for at least 2000ml today for optimal performance.',
            jsonb_build_object('type', 'open_page', 'target', '/fuel/water'),
            0.75,
            timezone('utc', now()) + INTERVAL '1 day'
        );
    END IF;
END;
$$;

-- W-RPC2 — generate_context_recommendation(user_id, trigger_type, payload)
-- Called when user does actions - generates instant contextual recommendations
CREATE OR REPLACE FUNCTION generate_context_recommendation(
    p_user uuid,
    p_trigger text,
    p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recommendation_id uuid;
    is_premium boolean;
    mood_value int;
    sleep_hours numeric;
    calories_meal numeric;
    workout_intensity text;
BEGIN
    -- Check if user is premium (context recommendations are premium-only)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    IF NOT is_premium THEN
        RETURN NULL;
    END IF;
    
    -- Log the trigger
    INSERT INTO ai_context_triggers (user_id, trigger_type, payload)
    VALUES (p_user, p_trigger, p_payload);
    
    -- Generate recommendations based on trigger type
    CASE p_trigger
        WHEN 'mood_low' THEN
            mood_value := COALESCE((p_payload->>'mood_value')::int, 0);
            IF mood_value <= 2 THEN
                INSERT INTO ai_recommendations (
                    user_id, category, title, description, action, score, expires_at
                )
                VALUES (
                    p_user,
                    'wellness',
                    'Try a 5-minute meditation',
                    'Your mood dropped — a quick breathing exercise may help.',
                    jsonb_build_object('type', 'open_page', 'target', '/wellness/meditate'),
                    1.0,
                    timezone('utc', now()) + INTERVAL '12 hours'
                )
                RETURNING id INTO recommendation_id;
            END IF;
            
        WHEN 'sleep_poor' THEN
            sleep_hours := COALESCE((p_payload->>'hours')::numeric, 0);
            IF sleep_hours < 6 THEN
                -- Adjust workout intensity
                INSERT INTO ai_recommendations (
                    user_id, category, title, description, action, score, expires_at
                )
                VALUES (
                    p_user,
                    'recovery',
                    'Reduce Workout Intensity Today',
                    'You slept ' || ROUND(sleep_hours, 1)::text || ' hours. Consider lighter activity or rest day.',
                    jsonb_build_object('type', 'open_page', 'target', '/move/recovery'),
                    0.95,
                    timezone('utc', now()) + INTERVAL '1 day'
                )
                RETURNING id INTO recommendation_id;
                
                -- Suggest meditation
                INSERT INTO ai_recommendations (
                    user_id, category, title, description, action, score, expires_at
                )
                VALUES (
                    p_user,
                    'wellness',
                    'Evening Meditation Recommended',
                    'A sleep meditation tonight can help improve your rest quality.',
                    jsonb_build_object('type', 'open_page', 'target', '/wellness/meditate'),
                    0.9,
                    timezone('utc', now()) + INTERVAL '1 day'
                );
            END IF;
            
        WHEN 'water_low' THEN
            INSERT INTO ai_recommendations (
                user_id, category, title, description, action, score, expires_at
            )
            VALUES (
                p_user,
                'hydration',
                'Hydration Check',
                'You haven''t logged water in a while. Stay hydrated for better performance!',
                jsonb_build_object('type', 'open_page', 'target', '/fuel/water'),
                0.85,
                timezone('utc', now()) + INTERVAL '6 hours'
            )
            RETURNING id INTO recommendation_id;
            
        WHEN 'steps_low' THEN
            INSERT INTO ai_recommendations (
                user_id, category, title, description, action, score, expires_at
            )
            VALUES (
                p_user,
                'workout',
                'Take a Walk',
                'You''re below your steps goal. A 10-minute walk can help!',
                jsonb_build_object('type', 'open_page', 'target', '/move/steps'),
                0.8,
                timezone('utc', now()) + INTERVAL '6 hours'
            )
            RETURNING id INTO recommendation_id;
            
        WHEN 'meal_logged' THEN
            calories_meal := COALESCE((p_payload->>'calories')::numeric, 0);
            IF calories_meal > 800 THEN
                -- Suggest a walk after heavy meal
                INSERT INTO ai_recommendations (
                    user_id, category, title, description, action, score, expires_at
                )
                VALUES (
                    p_user,
                    'workout',
                    'Post-Meal Walk',
                    'A 15-minute walk after this meal can help with digestion and blood sugar.',
                    jsonb_build_object('type', 'open_page', 'target', '/move/steps'),
                    0.75,
                    timezone('utc', now()) + INTERVAL '2 hours'
                )
                RETURNING id INTO recommendation_id;
            END IF;
            
        WHEN 'workout_completed' THEN
            workout_intensity := COALESCE(p_payload->>'intensity', 'moderate');
            IF workout_intensity IN ('high', 'very_high') THEN
                -- Recovery recommendation
                INSERT INTO ai_recommendations (
                    user_id, category, title, description, action, score, expires_at
                )
                VALUES (
                    p_user,
                    'recovery',
                    'Recovery Stretch',
                    'Great workout! A 10-minute stretch session will help with recovery.',
                    jsonb_build_object('type', 'open_page', 'target', '/move/recovery'),
                    0.9,
                    timezone('utc', now()) + INTERVAL '2 hours'
                )
                RETURNING id INTO recommendation_id;
            END IF;
            
        WHEN 'habit_complete' THEN
            INSERT INTO ai_recommendations (
                user_id, category, title, description, action, score, expires_at
            )
            VALUES (
                p_user,
                'habit',
                'Keep the Streak Going!',
                'Great job completing your habit! Consistency is key.',
                jsonb_build_object('type', 'open_page', 'target', '/wellness/habits'),
                0.7,
                timezone('utc', now()) + INTERVAL '1 day'
            )
            RETURNING id INTO recommendation_id;
    END CASE;
    
    RETURN recommendation_id;
END;
$$;

-- W-RPC3 — get_user_recommendations(user_id, category_filter, limit_count)
-- Gets recommendations for a user
CREATE OR REPLACE FUNCTION get_user_recommendations(
    p_user uuid,
    p_category_filter text DEFAULT NULL,
    p_limit_count int DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    category text,
    title text,
    description text,
    action jsonb,
    score numeric,
    status text,
    created_at timestamptz,
    expires_at timestamptz
)
LANGUAGE sql
AS $$
    SELECT 
        id, category, title, description, action, score, status, created_at, expires_at
    FROM ai_recommendations
    WHERE user_id = p_user
      AND (p_category_filter IS NULL OR category = p_category_filter)
      AND (expires_at IS NULL OR expires_at > timezone('utc', now()))
      AND status != 'ignored'
    ORDER BY score DESC, created_at DESC
    LIMIT p_limit_count;
$$;

-- W-RPC4 — mark_recommendation_status(user_id, recommendation_id, status)
-- Marks a recommendation as read, ignored, or completed
CREATE OR REPLACE FUNCTION mark_recommendation_status(
    p_user uuid,
    p_recommendation_id uuid,
    p_status text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE ai_recommendations
    SET status = p_status
    WHERE id = p_recommendation_id AND user_id = p_user;
    
    -- Log the interaction
    INSERT INTO ai_recommendation_stats (user_id, recommendation_id, interaction)
    VALUES (p_user, p_recommendation_id, p_status);
END;
$$;

-- W-RPC5 — update_personalization_profile(user_id, updates)
-- Updates user personalization profile
CREATE OR REPLACE FUNCTION update_personalization_profile(
    p_user uuid,
    p_updates jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO ai_personalization_profile (
        user_id,
        preferred_meals,
        disliked_meals,
        favorite_workouts,
        struggle_workouts,
        stress_patterns,
        mood_patterns,
        recovery_patterns,
        optimal_sleep_window,
        hydration_baseline,
        last_updated
    )
    VALUES (
        p_user,
        COALESCE(p_updates->'preferred_meals', '[]'::jsonb),
        COALESCE(p_updates->'disliked_meals', '[]'::jsonb),
        COALESCE(p_updates->'favorite_workouts', '[]'::jsonb),
        COALESCE(p_updates->'struggle_workouts', '[]'::jsonb),
        COALESCE(p_updates->'stress_patterns', '[]'::jsonb),
        COALESCE(p_updates->'mood_patterns', '[]'::jsonb),
        COALESCE(p_updates->'recovery_patterns', '[]'::jsonb),
        p_updates->'optimal_sleep_window',
        COALESCE((p_updates->>'hydration_baseline')::int, 2000),
        timezone('utc', now())
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
        preferred_meals = COALESCE(EXCLUDED.preferred_meals, ai_personalization_profile.preferred_meals),
        disliked_meals = COALESCE(EXCLUDED.disliked_meals, ai_personalization_profile.disliked_meals),
        favorite_workouts = COALESCE(EXCLUDED.favorite_workouts, ai_personalization_profile.favorite_workouts),
        struggle_workouts = COALESCE(EXCLUDED.struggle_workouts, ai_personalization_profile.struggle_workouts),
        stress_patterns = COALESCE(EXCLUDED.stress_patterns, ai_personalization_profile.stress_patterns),
        mood_patterns = COALESCE(EXCLUDED.mood_patterns, ai_personalization_profile.mood_patterns),
        recovery_patterns = COALESCE(EXCLUDED.recovery_patterns, ai_personalization_profile.recovery_patterns),
        optimal_sleep_window = COALESCE(EXCLUDED.optimal_sleep_window, ai_personalization_profile.optimal_sleep_window),
        hydration_baseline = COALESCE(EXCLUDED.hydration_baseline, ai_personalization_profile.hydration_baseline),
        last_updated = timezone('utc', now());
END;
$$;

-- W-RPC6 — get_personalization_profile(user_id)
-- Gets user personalization profile
CREATE OR REPLACE FUNCTION get_personalization_profile(p_user uuid)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_build_object(
        'preferred_meals', COALESCE(preferred_meals, '[]'::jsonb),
        'disliked_meals', COALESCE(disliked_meals, '[]'::jsonb),
        'favorite_workouts', COALESCE(favorite_workouts, '[]'::jsonb),
        'struggle_workouts', COALESCE(struggle_workouts, '[]'::jsonb),
        'stress_patterns', COALESCE(stress_patterns, '[]'::jsonb),
        'mood_patterns', COALESCE(mood_patterns, '[]'::jsonb),
        'recovery_patterns', COALESCE(recovery_patterns, '[]'::jsonb),
        'optimal_sleep_window', optimal_sleep_window,
        'hydration_baseline', COALESCE(hydration_baseline, 2000),
        'last_updated', last_updated
    )
    FROM ai_personalization_profile
    WHERE user_id = p_user;
$$;

-- W-RPC7 — log_recommendation_interaction(user_id, recommendation_id, interaction)
-- Logs user interaction with a recommendation
CREATE OR REPLACE FUNCTION log_recommendation_interaction(
    p_user uuid,
    p_recommendation_id uuid,
    p_interaction text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO ai_recommendation_stats (user_id, recommendation_id, interaction)
    VALUES (p_user, p_recommendation_id, p_interaction);
END;
$$;

-- W-RPC8 — cleanup_expired_recommendations()
-- Cleans up expired recommendations (call via CRON)
CREATE OR REPLACE FUNCTION cleanup_expired_recommendations()
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count int;
BEGIN
    DELETE FROM ai_recommendations
    WHERE expires_at < timezone('utc', now())
      AND status IN ('read', 'ignored');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- W-RPC9 — get_recommendation_insights(user_id, days)
-- Gets insights about what recommendations work best for user
CREATE OR REPLACE FUNCTION get_recommendation_insights(
    p_user uuid,
    p_days int DEFAULT 30
)
RETURNS jsonb
LANGUAGE sql
AS $$
    SELECT jsonb_build_object(
        'total_recommendations', COUNT(DISTINCT ar.id),
        'viewed_count', COUNT(DISTINCT ars.recommendation_id) FILTER (WHERE ars.interaction = 'viewed'),
        'done_count', COUNT(DISTINCT ars.recommendation_id) FILTER (WHERE ars.interaction = 'done'),
        'dismissed_count', COUNT(DISTINCT ars.recommendation_id) FILTER (WHERE ars.interaction = 'dismissed'),
        'most_engaged_category', (
            SELECT category
            FROM ai_recommendations ar2
            JOIN ai_recommendation_stats ars2 ON ars2.recommendation_id = ar2.id
            WHERE ar2.user_id = p_user
              AND ar2.created_at >= CURRENT_DATE - (p_days || ' days')::interval
              AND ars2.interaction = 'done'
            GROUP BY category
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ),
        'avg_score', ROUND(AVG(ar.score)::numeric, 2)
    )
    FROM ai_recommendations ar
    LEFT JOIN ai_recommendation_stats ars ON ars.recommendation_id = ar.id
    WHERE ar.user_id = p_user
      AND ar.created_at >= CURRENT_DATE - (p_days || ' days')::interval;
$$;

-- 5. TRIGGERS ---------------------------------------------

-- Auto-update last_updated on ai_personalization_profile
CREATE OR REPLACE FUNCTION update_personalization_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_personalization_profile_timestamp
BEFORE UPDATE ON ai_personalization_profile
FOR EACH ROW
EXECUTE FUNCTION update_personalization_profile_timestamp();

