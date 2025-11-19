-- =========================================================
-- MODULE J PHASE 7 — REAL-TIME DYNAMIC OPTIMIZER (AI COACH 2.0)
-- Real-time daily optimization with AI - reacts to every user action
-- =========================================================

-- 1. REAL-TIME USER STATE TABLE ---------------------------------
-- Tracks current day's state - updated in real-time with every log
CREATE TABLE IF NOT EXISTS realtime_user_state (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL DEFAULT CURRENT_DATE,
    current_calories int DEFAULT 0,
    protein_g int DEFAULT 0,
    carbs_g int DEFAULT 0,
    fats_g int DEFAULT 0,
    steps int DEFAULT 0,
    workout_load int DEFAULT 0,        -- Total volume (sets × reps × weight)
    sleep_hours numeric DEFAULT 0,
    mood int DEFAULT 3 CHECK (mood BETWEEN 1 AND 5),
    stress int DEFAULT 3 CHECK (stress BETWEEN 1 AND 5),
    hydration_ml int DEFAULT 0,
    recovery_score int DEFAULT 50 CHECK (recovery_score BETWEEN 0 AND 100),
    readiness_score int DEFAULT 50 CHECK (readiness_score BETWEEN 0 AND 100),
    target_calories int,
    target_protein int,
    target_carbs int,
    target_fats int,
    target_steps int DEFAULT 8000,
    target_sleep numeric DEFAULT 7.5,
    target_hydration_ml int DEFAULT 2500,
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, date)
);

-- 2. AI DAILY ACTIONS TABLE --------------------------------------
-- Stores AI-generated actions and recommendations
CREATE TABLE IF NOT EXISTS ai_daily_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL DEFAULT CURRENT_DATE,
    action_type text NOT NULL,         -- "nutrition_adjust", "workout_modify", "sleep_suggestion", "hydration_reminder", "meditation_suggestion", "coach_message"
    action_payload jsonb NOT NULL,     -- Specific action data
    reason text,                       -- Why this action was generated
    priority int DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = urgent, 10 = optional
    executed boolean DEFAULT false,   -- Whether user acted on it
    created_at timestamptz DEFAULT now()
);

-- 3. INDEXES ----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_realtime_user_state_user_date ON realtime_user_state(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_daily_actions_user_date ON ai_daily_actions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_daily_actions_type ON ai_daily_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_ai_daily_actions_priority ON ai_daily_actions(priority);

-- 4. RLS POLICIES ----------------------------------------------
ALTER TABLE realtime_user_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_daily_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own realtime state" ON realtime_user_state
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own daily actions" ON ai_daily_actions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. TRIGGERS ---------------------------------------------------
CREATE TRIGGER update_realtime_user_state_updated_at
    BEFORE UPDATE ON realtime_user_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. RPC FUNCTIONS ---------------------------------------------

-- 6.1 Initialize or get realtime state for today
CREATE OR REPLACE FUNCTION get_or_init_realtime_state(
    p_user_id uuid
) RETURNS realtime_user_state
LANGUAGE plpgsql
AS $$
DECLARE
    v_state realtime_user_state%ROWTYPE;
    v_targets personalized_goals%ROWTYPE;
BEGIN
    -- Try to get existing state
    SELECT * INTO v_state
    FROM realtime_user_state
    WHERE user_id = p_user_id
    AND date = CURRENT_DATE;
    
    -- If not found, initialize
    IF NOT FOUND THEN
        -- Get targets from personalized_goals
        SELECT * INTO v_targets
        FROM personalized_goals
        WHERE user_id = p_user_id;
        
        -- Initialize state
        INSERT INTO realtime_user_state (
            user_id,
            date,
            target_calories,
            target_protein,
            target_carbs,
            target_fats,
            target_steps,
            target_sleep,
            target_hydration_ml
        ) VALUES (
            p_user_id,
            CURRENT_DATE,
            COALESCE(v_targets.calorie_target, 2000),
            COALESCE(v_targets.protein_target, 150),
            COALESCE(v_targets.carbs_target, 200),
            COALESCE(v_targets.fats_target, 65),
            8000,
            7.5,
            2500
        )
        RETURNING * INTO v_state;
    END IF;
    
    RETURN v_state;
END;
$$;

-- 6.2 Update state after meal log
CREATE OR REPLACE FUNCTION update_state_after_meal(
    p_user_id uuid,
    p_calories int,
    p_protein int,
    p_carbs int,
    p_fats int
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Get or init state
    PERFORM get_or_init_realtime_state(p_user_id);
    
    -- Update nutrition values
    UPDATE realtime_user_state
    SET
        current_calories = current_calories + p_calories,
        protein_g = protein_g + p_protein,
        carbs_g = carbs_g + p_carbs,
        fats_g = fats_g + p_fats,
        updated_at = now()
    WHERE user_id = p_user_id
    AND date = CURRENT_DATE;
    
    -- Recalculate scores and generate actions
    PERFORM calculate_recovery_and_readiness(p_user_id);
    PERFORM ai_generate_daily_actions(p_user_id);
END;
$$;

-- 6.3 Update state after workout log
CREATE OR REPLACE FUNCTION update_state_after_workout(
    p_user_id uuid,
    p_workout_load int,
    p_duration_minutes int DEFAULT 0
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Get or init state
    PERFORM get_or_init_realtime_state(p_user_id);
    
    -- Update workout load
    UPDATE realtime_user_state
    SET
        workout_load = workout_load + p_workout_load,
        updated_at = now()
    WHERE user_id = p_user_id
    AND date = CURRENT_DATE;
    
    -- Recalculate scores
    PERFORM calculate_recovery_and_readiness(p_user_id);
    PERFORM ai_generate_daily_actions(p_user_id);
END;
$$;

-- 6.4 Update state after steps log
CREATE OR REPLACE FUNCTION update_state_after_steps(
    p_user_id uuid,
    p_steps int
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Get or init state
    PERFORM get_or_init_realtime_state(p_user_id);
    
    -- Update steps
    UPDATE realtime_user_state
    SET
        steps = GREATEST(steps, p_steps), -- Use max (in case of multiple updates)
        updated_at = now()
    WHERE user_id = p_user_id
    AND date = CURRENT_DATE;
    
    -- Recalculate scores
    PERFORM calculate_recovery_and_readiness(p_user_id);
    PERFORM ai_generate_daily_actions(p_user_id);
END;
$$;

-- 6.5 Update state after sleep log
CREATE OR REPLACE FUNCTION update_state_after_sleep(
    p_user_id uuid,
    p_sleep_hours numeric
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Get or init state
    PERFORM get_or_init_realtime_state(p_user_id);
    
    -- Update sleep
    UPDATE realtime_user_state
    SET
        sleep_hours = p_sleep_hours,
        updated_at = now()
    WHERE user_id = p_user_id
    AND date = CURRENT_DATE;
    
    -- Recalculate scores
    PERFORM calculate_recovery_and_readiness(p_user_id);
    PERFORM ai_generate_daily_actions(p_user_id);
END;
$$;

-- 6.6 Update state after mood/stress log
CREATE OR REPLACE FUNCTION update_state_after_mood(
    p_user_id uuid,
    p_mood int,
    p_stress int DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Get or init state
    PERFORM get_or_init_realtime_state(p_user_id);
    
    -- Update mood and stress
    UPDATE realtime_user_state
    SET
        mood = p_mood,
        stress = COALESCE(p_stress, stress),
        updated_at = now()
    WHERE user_id = p_user_id
    AND date = CURRENT_DATE;
    
    -- Recalculate scores
    PERFORM calculate_recovery_and_readiness(p_user_id);
    PERFORM ai_generate_daily_actions(p_user_id);
END;
$$;

-- 6.7 Update state after hydration log
CREATE OR REPLACE FUNCTION update_state_after_hydration(
    p_user_id uuid,
    p_hydration_ml int
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Get or init state
    PERFORM get_or_init_realtime_state(p_user_id);
    
    -- Update hydration
    UPDATE realtime_user_state
    SET
        hydration_ml = hydration_ml + p_hydration_ml,
        updated_at = now()
    WHERE user_id = p_user_id
    AND date = CURRENT_DATE;
    
    -- Recalculate scores
    PERFORM calculate_recovery_and_readiness(p_user_id);
    PERFORM ai_generate_daily_actions(p_user_id);
END;
$$;

-- 6.8 Calculate Recovery and Readiness Scores
CREATE OR REPLACE FUNCTION calculate_recovery_and_readiness(
    p_user_id uuid
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_state realtime_user_state%ROWTYPE;
    v_recovery numeric;
    v_readiness numeric;
    v_sleep_score numeric;
    v_stress_score numeric;
    v_mood_score numeric;
    v_nutrition_score numeric;
    v_hydration_score numeric;
    v_steps_score numeric;
BEGIN
    -- Get current state
    SELECT * INTO v_state
    FROM realtime_user_state
    WHERE user_id = p_user_id
    AND date = CURRENT_DATE;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Calculate Recovery Score (0-100)
    -- Based on: sleep, stress, mood, previous workout load
    v_sleep_score := LEAST(100, (v_state.sleep_hours / v_state.target_sleep) * 40);
    v_stress_score := GREATEST(0, (6 - v_state.stress) * 10); -- Lower stress = higher score
    v_mood_score := v_state.mood * 10; -- 1-5 mood = 10-50 points
    v_recovery := v_sleep_score + v_stress_score + v_mood_score - (v_state.workout_load / 100);
    v_recovery := GREATEST(0, LEAST(100, v_recovery));
    
    -- Calculate Readiness Score (0-100)
    -- Based on: recovery + nutrition + hydration + steps
    v_nutrition_score := CASE
        WHEN v_state.target_calories > 0 THEN
            GREATEST(0, 100 - (ABS(v_state.current_calories - v_state.target_calories) / v_state.target_calories * 50))
        ELSE 50
    END;
    
    v_hydration_score := LEAST(20, (v_state.hydration_ml / v_state.target_hydration_ml) * 20);
    v_steps_score := LEAST(10, (v_state.steps / v_state.target_steps) * 10);
    
    v_readiness := (v_recovery * 0.5) + (v_nutrition_score * 0.2) + v_hydration_score + v_steps_score;
    v_readiness := GREATEST(0, LEAST(100, v_readiness));
    
    -- Update scores
    UPDATE realtime_user_state
    SET
        recovery_score = ROUND(v_recovery),
        readiness_score = ROUND(v_readiness),
        updated_at = now()
    WHERE user_id = p_user_id
    AND date = CURRENT_DATE;
END;
$$;

-- 6.9 Generate AI Daily Actions
CREATE OR REPLACE FUNCTION ai_generate_daily_actions(
    p_user_id uuid
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_state realtime_user_state%ROWTYPE;
    v_actions jsonb := '[]'::jsonb;
    v_action jsonb;
BEGIN
    -- Get current state
    SELECT * INTO v_state
    FROM realtime_user_state
    WHERE user_id = p_user_id
    AND date = CURRENT_DATE;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Clear old actions for today (keep only unexecuted high-priority ones)
    DELETE FROM ai_daily_actions
    WHERE user_id = p_user_id
    AND date = CURRENT_DATE
    AND (executed = true OR priority > 5);
    
    -- NUTRITION ADJUSTMENTS
    -- If under-eating at breakfast (before 10am)
    IF EXTRACT(HOUR FROM now()) < 10 AND v_state.current_calories < (v_state.target_calories * 0.2) THEN
        v_action := jsonb_build_object(
            'action_type', 'nutrition_adjust',
            'action_payload', jsonb_build_object(
                'adjustment', 'increase_lunch',
                'calories_add', (v_state.target_calories * 0.15),
                'protein_add', 20
            ),
            'reason', 'Low breakfast calories detected - increasing lunch targets',
            'priority', 7
        );
        v_actions := v_actions || v_action;
    END IF;
    
    -- If over calories by midday
    IF EXTRACT(HOUR FROM now()) >= 12 AND EXTRACT(HOUR FROM now()) < 15 
       AND v_state.current_calories > (v_state.target_calories * 0.7) THEN
        v_action := jsonb_build_object(
            'action_type', 'nutrition_adjust',
            'action_payload', jsonb_build_object(
                'adjustment', 'reduce_dinner',
                'calories_reduce', (v_state.current_calories - v_state.target_calories * 0.7),
                'suggest_low_cal', true
            ),
            'reason', 'High calorie intake detected - reducing dinner targets',
            'priority', 8
        );
        v_actions := v_actions || v_action;
    END IF;
    
    -- If protein too low
    IF v_state.protein_g < (v_state.target_protein * 0.6) THEN
        v_action := jsonb_build_object(
            'action_type', 'nutrition_adjust',
            'action_payload', jsonb_build_object(
                'adjustment', 'increase_protein',
                'protein_needed', (v_state.target_protein - v_state.protein_g),
                'suggestions', jsonb_build_array('chicken breast', 'greek yogurt', 'protein shake')
            ),
            'reason', format('Protein intake low (%sg/%sg) - add protein-rich foods', 
                v_state.protein_g, v_state.target_protein),
            'priority', 6
        );
        v_actions := v_actions || v_action;
    END IF;
    
    -- WORKOUT ADJUSTMENTS
    -- If recovery < 40
    IF v_state.recovery_score < 40 THEN
        v_action := jsonb_build_object(
            'action_type', 'workout_modify',
            'action_payload', jsonb_build_object(
                'modification', 'replace_with_recovery',
                'suggestions', jsonb_build_array('yoga', 'mobility', 'light stretching', 'walking')
            ),
            'reason', format('Low recovery score (%s) - recommend recovery activities', v_state.recovery_score),
            'priority', 9
        );
        v_actions := v_actions || v_action;
    END IF;
    
    -- If readiness > 80
    IF v_state.readiness_score > 80 THEN
        v_action := jsonb_build_object(
            'action_type', 'workout_modify',
            'action_payload', jsonb_build_object(
                'modification', 'increase_intensity',
                'increase_percent', 10,
                'reason', 'High readiness - can push harder'
            ),
            'reason', format('High readiness score (%s) - increase workout intensity', v_state.readiness_score),
            'priority', 5
        );
        v_actions := v_actions || v_action;
    END IF;
    
    -- SLEEP OPTIMIZATION
    -- If sleep < 6 hours (from previous night)
    IF v_state.sleep_hours > 0 AND v_state.sleep_hours < 6 THEN
        v_action := jsonb_build_object(
            'action_type', 'sleep_suggestion',
            'action_payload', jsonb_build_object(
                'suggestions', jsonb_build_array(
                    'No stimulants after 2pm',
                    'Short stretching routine before bed',
                    'Guided meditation',
                    'Earlier bedtime reminder'
                ),
                'target_bedtime', '22:00'
            ),
            'reason', format('Low sleep detected (%s hours) - optimize sleep hygiene', v_state.sleep_hours),
            'priority', 8
        );
        v_actions := v_actions || v_action;
    END IF;
    
    -- HYDRATION
    -- If hydration low
    IF v_state.hydration_ml < (v_state.target_hydration_ml * 0.5) 
       AND EXTRACT(HOUR FROM now()) >= 14 THEN
        v_action := jsonb_build_object(
            'action_type', 'hydration_reminder',
            'action_payload', jsonb_build_object(
                'ml_needed', (v_state.target_hydration_ml - v_state.hydration_ml),
                'suggestion', 'Drink 300ml water now'
            ),
            'reason', format('Low hydration (%sml/%sml) - increase water intake', 
                v_state.hydration_ml, v_state.target_hydration_ml),
            'priority', 7
        );
        v_actions := v_actions || v_action;
    END IF;
    
    -- MOOD & STRESS
    -- If stress > 4 or mood < 2
    IF v_state.stress > 4 OR v_state.mood < 2 THEN
        v_action := jsonb_build_object(
            'action_type', 'meditation_suggestion',
            'action_payload', jsonb_build_object(
                'suggestions', jsonb_build_array(
                    '3-minute breathing exercise',
                    'Stress relief meditation',
                    'Journaling prompt',
                    'Light walk'
                ),
                'reduce_workout_intensity', true
            ),
            'reason', format('High stress (%s) or low mood (%s) - focus on wellness', 
                v_state.stress, v_state.mood),
            'priority', 9
        );
        v_actions := v_actions || v_action;
    END IF;
    
    -- COACH MESSAGES
    -- Generate daily coach message based on state
    DECLARE
        v_message text;
        v_message_type text;
    BEGIN
        IF v_state.recovery_score < 40 THEN
            v_message := 'Today is a recovery day — aim for 7k steps, hydrate more, and prioritize rest.';
            v_message_type := 'recovery_day';
        ELSIF v_state.readiness_score > 80 THEN
            v_message := 'You slept great! Let''s push a little harder in today''s workout.';
            v_message_type := 'high_readiness';
        ELSIF v_state.current_calories < (v_state.target_calories * 0.5) 
              AND EXTRACT(HOUR FROM now()) >= 18 THEN
            v_message := 'Calories are low today — make sure dinner includes protein and healthy carbs.';
            v_message_type := 'low_calories';
        ELSIF v_state.steps < (v_state.target_steps * 0.5) 
              AND EXTRACT(HOUR FROM now()) >= 16 THEN
            v_message := 'Step count is low — try a 10-minute walk to boost your activity.';
            v_message_type := 'low_steps';
        ELSE
            v_message := 'You''re on track! Keep up the great work.';
            v_message_type := 'encouragement';
        END IF;
        
        v_action := jsonb_build_object(
            'action_type', 'coach_message',
            'action_payload', jsonb_build_object(
                'message', v_message,
                'type', v_message_type
            ),
            'reason', 'Daily coach message based on current state',
            'priority', 4
        );
        v_actions := v_actions || v_action;
    END;
    
    -- Insert actions
    FOR i IN 0..jsonb_array_length(v_actions) - 1 LOOP
        INSERT INTO ai_daily_actions (
            user_id,
            date,
            action_type,
            action_payload,
            reason,
            priority
        ) VALUES (
            p_user_id,
            CURRENT_DATE,
            (v_actions->i->>'action_type')::text,
            (v_actions->i->>'action_payload')::jsonb,
            (v_actions->i->>'reason')::text,
            COALESCE((v_actions->i->>'priority')::int, 5)
        )
        ON CONFLICT DO NOTHING; -- Avoid duplicates
    END LOOP;
END;
$$;

-- 6.10 Get current realtime state
CREATE OR REPLACE FUNCTION get_realtime_state(
    p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_state realtime_user_state%ROWTYPE;
    v_actions jsonb;
BEGIN
    -- Get or init state
    PERFORM get_or_init_realtime_state(p_user_id);
    
    -- Get state
    SELECT * INTO v_state
    FROM realtime_user_state
    WHERE user_id = p_user_id
    AND date = CURRENT_DATE;
    
    -- Get today's actions
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'action_type', action_type,
            'action_payload', action_payload,
            'reason', reason,
            'priority', priority,
            'executed', executed,
            'created_at', created_at
        ) ORDER BY priority ASC, created_at DESC
    ) INTO v_actions
    FROM ai_daily_actions
    WHERE user_id = p_user_id
    AND date = CURRENT_DATE
    AND executed = false;
    
    -- Build result
    RETURN jsonb_build_object(
        'state', jsonb_build_object(
            'current_calories', v_state.current_calories,
            'target_calories', v_state.target_calories,
            'protein_g', v_state.protein_g,
            'target_protein', v_state.target_protein,
            'carbs_g', v_state.carbs_g,
            'target_carbs', v_state.target_carbs,
            'fats_g', v_state.fats_g,
            'target_fats', v_state.target_fats,
            'steps', v_state.steps,
            'target_steps', v_state.target_steps,
            'sleep_hours', v_state.sleep_hours,
            'target_sleep', v_state.target_sleep,
            'hydration_ml', v_state.hydration_ml,
            'target_hydration_ml', v_state.target_hydration_ml,
            'workout_load', v_state.workout_load,
            'mood', v_state.mood,
            'stress', v_state.stress,
            'recovery_score', v_state.recovery_score,
            'readiness_score', v_state.readiness_score
        ),
        'actions', COALESCE(v_actions, '[]'::jsonb)
    );
END;
$$;

-- =========================================================
-- MODULE J PHASE 7 — COMPLETE
-- =========================================================

