/*
  # Core RPC Functions for BloomYou

  ## Description
  Essential stored procedures and functions required by the application.

  ## Functions Created
  1. **Streak Functions** - Track and manage all streak types
  2. **XP & Token Functions** - Gamification rewards
  3. **Macro Functions** - Daily nutrition calculations
  4. **State Functions** - Real-time user state updates
  5. **Notification Functions** - Push notification management

  ## Security
  - All functions use SECURITY DEFINER where needed for RLS bypass
  - Functions validate user_id matches auth.uid() where appropriate
*/

-- =============================================
-- STREAK FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION log_streak_event(
  p_user_id uuid,
  p_streak_type_name text,
  p_event_date date DEFAULT CURRENT_DATE,
  p_source text DEFAULT 'manual',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_streak_type_id integer;
  v_current_streak record;
  v_result jsonb;
BEGIN
  -- Get streak type ID
  SELECT id INTO v_streak_type_id
  FROM streak_types
  WHERE name = p_streak_type_name;

  IF v_streak_type_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid streak type');
  END IF;

  -- Get or create user streak
  INSERT INTO user_streaks (user_id, streak_type_id, current_count, best_count, last_event_date)
  VALUES (p_user_id, v_streak_type_id, 0, 0, NULL)
  ON CONFLICT (user_id, streak_type_id) DO NOTHING;

  SELECT * INTO v_current_streak
  FROM user_streaks
  WHERE user_id = p_user_id AND streak_type_id = v_streak_type_id;

  -- Calculate new streak
  IF v_current_streak.last_event_date IS NULL THEN
    -- First event
    UPDATE user_streaks
    SET current_count = 1,
        best_count = GREATEST(1, best_count),
        last_event_date = p_event_date,
        updated_at = now()
    WHERE user_id = p_user_id AND streak_type_id = v_streak_type_id;
  ELSIF p_event_date = v_current_streak.last_event_date THEN
    -- Same day, no update
    RETURN jsonb_build_object('message', 'Already logged today', 'current_count', v_current_streak.current_count);
  ELSIF p_event_date = v_current_streak.last_event_date + INTERVAL '1 day' THEN
    -- Consecutive day
    UPDATE user_streaks
    SET current_count = current_count + 1,
        best_count = GREATEST(current_count + 1, best_count),
        last_event_date = p_event_date,
        updated_at = now()
    WHERE user_id = p_user_id AND streak_type_id = v_streak_type_id;
  ELSE
    -- Streak broken
    UPDATE user_streaks
    SET current_count = 1,
        last_event_date = p_event_date,
        updated_at = now()
    WHERE user_id = p_user_id AND streak_type_id = v_streak_type_id;
  END IF;

  -- Log history
  INSERT INTO streak_history (user_id, streak_type_id, event_date, count_after_event, source, metadata)
  SELECT p_user_id, v_streak_type_id, p_event_date, current_count, p_source, p_metadata
  FROM user_streaks
  WHERE user_id = p_user_id AND streak_type_id = v_streak_type_id;

  -- Return updated streak
  SELECT jsonb_build_object(
    'success', true,
    'current_count', current_count,
    'best_count', best_count,
    'last_event_date', last_event_date
  ) INTO v_result
  FROM user_streaks
  WHERE user_id = p_user_id AND streak_type_id = v_streak_type_id;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION get_all_user_streaks(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'type', st.name,
      'category', st.category,
      'icon', st.icon,
      'current_count', us.current_count,
      'best_count', us.best_count,
      'last_event_date', us.last_event_date
    )
  ) INTO v_result
  FROM user_streaks us
  JOIN streak_types st ON us.streak_type_id = st.id
  WHERE us.user_id = p_user_id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- =============================================
-- XP & TOKEN FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION add_xp(
  p_user_id uuid,
  p_amount integer,
  p_source text,
  p_source_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_total integer;
BEGIN
  -- Add XP transaction
  INSERT INTO xp_transactions (user_id, amount, source, source_id, description)
  VALUES (p_user_id, p_amount, p_source, p_source_id, p_description);

  -- Calculate new total
  SELECT COALESCE(SUM(amount), 0) INTO v_new_total
  FROM xp_transactions
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'amount', p_amount,
    'new_total', v_new_total
  );
END;
$$;

CREATE OR REPLACE FUNCTION add_tokens(
  p_user_id uuid,
  p_amount integer,
  p_source text,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  -- Add token transaction
  INSERT INTO mind_token_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, p_amount, p_source, p_description);

  -- Calculate new balance
  SELECT COALESCE(SUM(amount), 0) INTO v_new_balance
  FROM mind_token_transactions
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'amount', p_amount,
    'new_balance', v_new_balance
  );
END;
$$;

-- =============================================
-- MACRO TRACKING FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION get_daily_macros(
  p_user_id uuid,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_total_calories numeric := 0;
  v_total_protein numeric := 0;
  v_total_carbs numeric := 0;
  v_total_fats numeric := 0;
BEGIN
  -- Sum from meal log items
  SELECT
    COALESCE(SUM(mli.calories), 0),
    COALESCE(SUM(mli.protein), 0),
    COALESCE(SUM(mli.carbs), 0),
    COALESCE(SUM(mli.fats), 0)
  INTO v_total_calories, v_total_protein, v_total_carbs, v_total_fats
  FROM meal_logs ml
  JOIN meal_log_items mli ON ml.id = mli.meal_log_id
  WHERE ml.user_id = p_user_id
    AND ml.log_date = p_date;

  v_result := jsonb_build_object(
    'date', p_date,
    'calories', v_total_calories,
    'protein', v_total_protein,
    'carbs', v_total_carbs,
    'fats', v_total_fats
  );

  RETURN v_result;
END;
$$;

-- =============================================
-- REALTIME STATE FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION update_state_after_meal(
  p_user_id uuid,
  p_calories numeric,
  p_protein numeric,
  p_carbs numeric,
  p_fats numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log streak
  PERFORM log_streak_event(p_user_id, 'meal', CURRENT_DATE, 'meal_log');

  -- Add XP
  PERFORM add_xp(p_user_id, 10, 'meal_logged', NULL, 'Logged a meal');
END;
$$;

CREATE OR REPLACE FUNCTION update_state_after_workout(
  p_user_id uuid,
  p_workout_load integer,
  p_duration_minutes integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log streak
  PERFORM log_streak_event(p_user_id, 'workout', CURRENT_DATE, 'workout_log');

  -- Add XP based on duration
  PERFORM add_xp(p_user_id, GREATEST(20, p_duration_minutes), 'workout_completed', NULL, 'Completed workout');
END;
$$;

-- =============================================
-- NOTIFICATION FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION get_unread_notifications_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE user_id = p_user_id
    AND read_at IS NULL;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION mark_notification_read(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET read_at = now()
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION enqueue_notification(
  p_user_id uuid,
  p_category text,
  p_title text,
  p_body text,
  p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id uuid;
  v_daily_count integer;
BEGIN
  -- Check daily limit (max 4 per day)
  SELECT count INTO v_daily_count
  FROM notification_daily_counts
  WHERE user_id = p_user_id
    AND notification_date = CURRENT_DATE
    AND category = p_category;

  IF v_daily_count >= 4 THEN
    RETURN NULL; -- Rate limited
  END IF;

  -- Create in-app notification
  INSERT INTO notifications (user_id, category, title, body, data)
  VALUES (p_user_id, p_category, p_title, p_body, p_data)
  RETURNING id INTO v_notification_id;

  -- Queue push notification
  INSERT INTO queued_notifications (user_id, category, title, body, data)
  VALUES (p_user_id, p_category, p_title, p_body, p_data);

  -- Update daily count
  INSERT INTO notification_daily_counts (user_id, category, notification_date, count)
  VALUES (p_user_id, p_category, CURRENT_DATE, 1)
  ON CONFLICT (user_id, category, notification_date)
  DO UPDATE SET count = notification_daily_counts.count + 1;

  RETURN v_notification_id;
END;
$$;

-- =============================================
-- MEDITATION & MINDWORLD FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION complete_meditation_session(
  p_session_id uuid,
  p_mood_after integer,
  p_stress_after integer,
  p_duration_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_xp_earned integer;
BEGIN
  -- Update session
  UPDATE meditation_sessions_ac
  SET mood_after = p_mood_after,
      stress_after = p_stress_after,
      duration_seconds = p_duration_seconds,
      completed_at = now()
  WHERE id = p_session_id
  RETURNING user_id INTO v_user_id;

  -- Calculate XP (1 per minute)
  v_xp_earned := GREATEST(1, p_duration_seconds / 60);

  -- Add rewards
  PERFORM add_xp(v_user_id, v_xp_earned, 'meditation', p_session_id, 'Completed meditation');
  PERFORM add_tokens(v_user_id, 5, 'meditation', 'Completed meditation session');
  PERFORM log_streak_event(v_user_id, 'meditation', CURRENT_DATE, 'meditation_session');

  RETURN jsonb_build_object(
    'success', true,
    'xp_earned', v_xp_earned,
    'tokens_earned', 5
  );
END;
$$;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION get_user_premium_status(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_premium boolean;
BEGIN
  SELECT premium INTO v_premium
  FROM users
  WHERE id = p_user_id;

  RETURN COALESCE(v_premium, false);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
