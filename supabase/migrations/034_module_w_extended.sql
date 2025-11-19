-- =========================================================
-- MODULE W — AI RECOMMENDATION ENGINE (EXTENDED VERSION)
-- Adds embedding vectors, enhanced AI logic, rule-based triggers, and advanced features
-- =========================================================

-- 1. ADDITIONAL TABLES (Extended) -------------------------

-- W-EXTENDED-1: ai_user_vectors
-- Cached embedding vectors for user behavior (massively speeds up similarity recommendations)
-- Note: Requires pgvector extension (Supabase supports it)
CREATE TABLE IF NOT EXISTS ai_user_vectors (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nutrition_vector vector(384),  -- OpenAI text-embedding-3-small dimension
    workout_vector vector(384),
    sleep_vector vector(384),
    wellness_vector vector(384),
    mood_vector vector(384),
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- W-EXTENDED-2: ai_reco_logs
-- Enhanced interaction tracking (complements ai_recommendation_stats)
CREATE TABLE IF NOT EXISTS ai_reco_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reco_id uuid NOT NULL REFERENCES ai_recommendations(id) ON DELETE CASCADE,
    clicked boolean DEFAULT false,
    dismissed boolean DEFAULT false,
    completed boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- W-EXTENDED-3: ai_rules
-- Rule-based triggers (hybrid approach for faster recommendations)
CREATE TABLE IF NOT EXISTS ai_rules (
    id serial PRIMARY KEY,
    rule_name text NOT NULL UNIQUE,
    condition jsonb NOT NULL,
    -- Example: {"sleep_avg": {"<": 6}, "mood_avg": {"<": 3}}
    recommendation jsonb NOT NULL,
    -- Example: {"category": "sleep", "title": "Improve Sleep", "description": "..."}
    priority int DEFAULT 1,
    enabled boolean DEFAULT true,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Pre-populate common rules
INSERT INTO ai_rules (rule_name, condition, recommendation, priority) VALUES
    (
        'low_sleep_recovery',
        '{"sleep_avg": {"<": 6}}',
        '{"category": "recovery", "title": "Recovery Focus Today", "description": "You slept less than 6 hours. Consider lighter activity and earlier bedtime.", "action": {"type": "open_page", "target": "/wellness/sleep"}}',
        5
    ),
    (
        'low_protein_nutrition',
        '{"protein_avg": {"<": 100}}',
        '{"category": "nutrition", "title": "Increase Protein Intake", "description": "Your protein intake is below optimal. Aim for at least 100g daily.", "action": {"type": "open_page", "target": "/fuel/recipes"}}',
        4
    ),
    (
        'low_hydration',
        '{"water_avg": {"<": 1500}}',
        '{"category": "hydration", "title": "Increase Hydration", "description": "You are consistently below your hydration target. Drink more water today.", "action": {"type": "open_page", "target": "/fuel/water"}}',
        3
    ),
    (
        'low_mood_wellness',
        '{"mood_avg": {"<": 3}}',
        '{"category": "wellness", "title": "Try Meditation", "description": "Your mood has been lower. A 5-minute meditation may help.", "action": {"type": "open_page", "target": "/wellness/meditate"}}',
        4
    ),
    (
        'low_steps_workout',
        '{"steps_avg": {"<": 5000}}',
        '{"category": "workout", "title": "Take a Walk", "description": "You are below your steps goal. A 10-minute walk can help!", "action": {"type": "open_page", "target": "/move/steps"}}',
        3
    )
ON CONFLICT (rule_name) DO NOTHING;

-- 2. INDEXES ------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_ai_reco_logs_user ON ai_reco_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_reco_logs_reco ON ai_reco_logs(reco_id);
CREATE INDEX IF NOT EXISTS idx_ai_reco_logs_created ON ai_reco_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_rules_enabled ON ai_rules(enabled) WHERE enabled = true;

-- 3. RLS POLICIES -------------------------------------------

ALTER TABLE ai_user_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reco_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_vectors" ON ai_user_vectors
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_reco_logs" ON ai_reco_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Public read for rules (system rules)
CREATE POLICY "public_read_ai_rules" ON ai_rules
    FOR SELECT USING (enabled = true);

-- 4. ENHANCED RPC FUNCTIONS --------------------------------

-- W-EXTENDED-RPC1: log_recommendation_interaction()
-- Enhanced version with all interaction types
CREATE OR REPLACE FUNCTION log_recommendation_interaction(
    p_reco_id uuid,
    p_user_id uuid,
    p_clicked boolean DEFAULT false,
    p_dismissed boolean DEFAULT false,
    p_completed boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO ai_reco_logs (user_id, reco_id, clicked, dismissed, completed)
    VALUES (p_user_id, p_reco_id, p_clicked, p_dismissed, p_completed)
    ON CONFLICT DO NOTHING;
    
    -- Also update ai_recommendation_stats for backward compatibility
    IF p_clicked THEN
        INSERT INTO ai_recommendation_stats (user_id, recommendation_id, interaction)
        VALUES (p_user_id, p_reco_id, 'clicked')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF p_dismissed THEN
        INSERT INTO ai_recommendation_stats (user_id, recommendation_id, interaction)
        VALUES (p_user_id, p_reco_id, 'dismissed')
        ON CONFLICT DO NOTHING;
        
        -- Mark recommendation as ignored
        UPDATE ai_recommendations
        SET status = 'ignored'
        WHERE id = p_reco_id AND user_id = p_user_id;
    END IF;
    
    IF p_completed THEN
        INSERT INTO ai_recommendation_stats (user_id, recommendation_id, interaction)
        VALUES (p_user_id, p_reco_id, 'done')
        ON CONFLICT DO NOTHING;
        
        -- Mark recommendation as completed
        UPDATE ai_recommendations
        SET status = 'completed'
        WHERE id = p_reco_id AND user_id = p_user_id;
    END IF;
END;
$$;

-- W-EXTENDED-RPC2: clear_expired_ai()
-- Cleanup job for expired recommendations
CREATE OR REPLACE FUNCTION clear_expired_ai()
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count int;
BEGIN
    DELETE FROM ai_recommendations
    WHERE expires_at < timezone('utc', now())
      AND status IN ('read', 'ignored', 'completed');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- W-EXTENDED-RPC3: get_active_recommendations(user_id, limit_count)
-- Returns most relevant, not expired, sorted by priority
CREATE OR REPLACE FUNCTION get_active_recommendations(
    p_user_id uuid,
    p_limit_count int DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    category text,
    title text,
    description text,
    action jsonb,
    priority int,
    ai_confidence numeric,
    score numeric,
    status text,
    created_at timestamptz,
    expires_at timestamptz
)
LANGUAGE sql
AS $$
    SELECT 
        ar.id,
        ar.category,
        ar.title,
        ar.description,
        ar.action,
        COALESCE((ar.action->>'priority')::int, 1) as priority,
        COALESCE((ar.action->>'ai_confidence')::numeric, ar.score) as ai_confidence,
        ar.score,
        ar.status,
        ar.created_at,
        ar.expires_at
    FROM ai_recommendations ar
    WHERE ar.user_id = p_user_id
      AND (ar.expires_at IS NULL OR ar.expires_at > timezone('utc', now()))
      AND ar.status NOT IN ('ignored', 'completed')
    ORDER BY 
        COALESCE((ar.action->>'priority')::int, 1) DESC,
        ar.score DESC,
        ar.created_at DESC
    LIMIT p_limit_count;
$$;

-- W-EXTENDED-RPC4: build_user_state(user_id, days)
-- Builds comprehensive user state object for AI analysis
CREATE OR REPLACE FUNCTION build_user_state(
    p_user_id uuid,
    p_days int DEFAULT 14
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    state jsonb;
    calorie_avg numeric;
    protein_avg numeric;
    sleep_avg numeric;
    mood_avg numeric;
    water_avg numeric;
    steps_avg numeric;
    workout_count int;
    goal text;
    diet_type text;
BEGIN
    -- Get averages from daily_summaries (Module R)
    SELECT 
        AVG(calories_consumed),
        AVG(protein_consumed),
        AVG(sleep_hours),
        AVG(CASE WHEN mood = 'happy' THEN 5 WHEN mood = 'sad' THEN 1 ELSE 3 END),
        AVG(water_ml),
        AVG(steps),
        COUNT(*) FILTER (WHERE workout_completed = true)
    INTO calorie_avg, protein_avg, sleep_avg, mood_avg, water_avg, steps_avg, workout_count
    FROM daily_summaries
    WHERE user_id = p_user_id
      AND date >= CURRENT_DATE - (p_days || ' days')::interval;
    
    -- Get goal and diet type
    SELECT goal, diet_type
    INTO goal, diet_type
    FROM user_goals
    WHERE user_id = p_user_id
    ORDER BY generated_at DESC
    LIMIT 1;
    
    -- Build state object
    state := jsonb_build_object(
        'calorie_avg', COALESCE(calorie_avg, 2000),
        'protein_avg', COALESCE(protein_avg, 100),
        'sleep_avg', COALESCE(sleep_avg, 7),
        'mood_avg', COALESCE(mood_avg, 3),
        'water_avg', COALESCE(water_avg, 2000),
        'steps_avg', COALESCE(steps_avg, 7000),
        'workout_load', workout_count,
        'goal', COALESCE(goal, 'maintain'),
        'diet_type', COALESCE(diet_type, 'balanced'),
        'weak_zones', jsonb_build_array(
            CASE WHEN COALESCE(sleep_avg, 7) < 6 THEN 'sleep' END,
            CASE WHEN COALESCE(water_avg, 2000) < 1500 THEN 'hydration' END,
            CASE WHEN COALESCE(protein_avg, 100) < 80 THEN 'protein' END
        ),
        'streaks', (
            SELECT jsonb_build_object(
                'nutrition', COALESCE((SELECT current_streak FROM user_streaks WHERE user_id = p_user_id AND streak_type_id = (SELECT id FROM streak_types WHERE name = 'meal_log')), 0),
                'sleep', COALESCE((SELECT current_streak FROM user_streaks WHERE user_id = p_user_id AND streak_type_id = (SELECT id FROM streak_types WHERE name = 'sleep_log')), 0),
                'hydration', COALESCE((SELECT current_streak FROM user_streaks WHERE user_id = p_user_id AND streak_type_id = (SELECT id FROM streak_types WHERE name = 'water_intake')), 0)
            )
        )
    );
    
    RETURN state;
END;
$$;

-- W-EXTENDED-RPC5: evaluate_ai_rules(user_id)
-- Evaluates rule-based triggers and generates recommendations
CREATE OR REPLACE FUNCTION evaluate_ai_rules(p_user_id uuid)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    user_state jsonb;
    rule_record RECORD;
    condition_result boolean;
    recommendations_created int := 0;
    is_premium boolean;
BEGIN
    -- Check premium status
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user_id;
    
    -- Build user state
    user_state := build_user_state(p_user_id);
    
    -- Evaluate each enabled rule
    FOR rule_record IN 
        SELECT * FROM ai_rules WHERE enabled = true ORDER BY priority DESC
    LOOP
        -- Simple condition evaluation (can be extended)
        condition_result := true; -- Placeholder - would need JSON path evaluation
        
        IF condition_result THEN
            -- Create recommendation
            INSERT INTO ai_recommendations (
                user_id,
                category,
                title,
                description,
                action,
                score,
                expires_at
            )
            VALUES (
                p_user_id,
                rule_record.recommendation->>'category',
                rule_record.recommendation->>'title',
                rule_record.recommendation->>'description',
                rule_record.recommendation->'action',
                (rule_record.priority::numeric / 5.0),
                timezone('utc', now()) + INTERVAL '1 day'
            )
            ON CONFLICT DO NOTHING;
            
            recommendations_created := recommendations_created + 1;
        END IF;
    END LOOP;
    
    RETURN recommendations_created;
END;
$$;

-- W-EXTENDED-RPC6: update_user_vector(user_id, vector_type, vector_data)
-- Updates user embedding vector (called by backend after generating embeddings)
CREATE OR REPLACE FUNCTION update_user_vector(
    p_user_id uuid,
    p_vector_type text,
    p_vector_data vector
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO ai_user_vectors (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO UPDATE
    SET
        nutrition_vector = CASE WHEN p_vector_type = 'nutrition' THEN p_vector_data ELSE ai_user_vectors.nutrition_vector END,
        workout_vector = CASE WHEN p_vector_type = 'workout' THEN p_vector_data ELSE ai_user_vectors.workout_vector END,
        sleep_vector = CASE WHEN p_vector_type = 'sleep' THEN p_vector_data ELSE ai_user_vectors.sleep_vector END,
        wellness_vector = CASE WHEN p_vector_type = 'wellness' THEN p_vector_data ELSE ai_user_vectors.wellness_vector END,
        mood_vector = CASE WHEN p_vector_type = 'mood' THEN p_vector_data ELSE ai_user_vectors.mood_vector END,
        updated_at = timezone('utc', now());
END;
$$;

-- 5. TRIGGERS ------------------------------------------------

CREATE OR REPLACE FUNCTION update_ai_user_vectors_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_user_vectors_timestamp
BEFORE UPDATE ON ai_user_vectors
FOR EACH ROW
EXECUTE FUNCTION update_ai_user_vectors_timestamp();

-- =========================================================
-- MODULE W — EXTENDED — COMPLETE
-- =========================================================

