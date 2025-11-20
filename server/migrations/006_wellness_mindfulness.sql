/*
  # Wellness & Mindfulness Schema

  ## Description
  Complete wellness tracking including mood logs, sleep logs, habits, meditation sessions,
  mind games, gratitude, journaling, and stress tracking.

  ## Tables Created
  1. **mood_logs** - Daily mood tracking
     - `id` (uuid, pk)
     - `user_id` (uuid, fk)
     - `mood` (integer) - 1-5 rating
     - `notes` (text)
     - `created_at` (timestamptz)

  2. **sleep_logs** - Sleep tracking
     - `id` (uuid, pk)
     - `user_id` (uuid, fk)
     - `date` (date)
     - `hours` (numeric) - Hours slept
     - `quality` (integer) - 1-5 rating
     - `notes` (text)
     - `created_at` (timestamptz)

  3. **habits** - User habit definitions
     - `id` (uuid, pk)
     - `user_id` (uuid, fk)
     - `name` (text)
     - `description` (text)
     - `frequency` (text) - daily, weekly, custom
     - `target_days` (integer array) - Days of week
     - `created_at` (timestamptz)

  4. **habit_logs** - Habit completion tracking
     - `id` (uuid, pk)
     - `habit_id` (uuid, fk)
     - `date` (date)
     - `completed` (boolean)
     - `notes` (text)
     - `created_at` (timestamptz)

  5. **meditation_sessions** - Basic meditation tracking
     - `id` (uuid, pk)
     - `user_id` (uuid, fk)
     - `category` (text)
     - `duration` (integer) - Seconds
     - `completed_at` (timestamptz)
     - `created_at` (timestamptz)

  6. **meditation_sessions_ac** - Advanced gamified meditation
     - `id` (uuid, pk)
     - `user_id` (uuid, fk)
     - `level_id` (uuid, fk)
     - `mood_before`, `mood_after` (integer)
     - `stress_before`, `stress_after` (integer)
     - `duration_seconds` (integer)
     - `completed` (boolean)
     - `created_at`, `completed_at` (timestamptz)

  7. **mind_game_sessions** - Cognitive game tracking
     - `id` (uuid, pk)
     - `user_id` (uuid, fk)
     - `game_id` (text)
     - `score` (integer)
     - `metrics` (jsonb) - Game-specific metrics
     - `created_at` (timestamptz)

  8. **gratitude_entries** - Gratitude journaling
     - `id` (uuid, pk)
     - `user_id` (uuid, fk)
     - `entry` (text)
     - `created_at` (timestamptz)

  9. **journal_entries** - General journaling
     - `id` (uuid, pk)
     - `user_id` (uuid, fk)
     - `title` (text)
     - `content` (text)
     - `created_at` (timestamptz)

  10. **wellness_insights** - AI-generated wellness insights
      - `id` (uuid, pk)
      - `user_id` (uuid, fk)
      - `insight_type` (text)
      - `content` (text)
      - `created_at` (timestamptz)

  11. **stress_scores** - Stress level tracking
      - `id` (uuid, pk)
      - `user_id` (uuid, fk)
      - `score` (integer) - 1-10
      - `factors` (jsonb)
      - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data

  ## Notes
  - Mood and sleep use 1-5 ratings
  - Habits support flexible scheduling
  - Meditation has both basic and gamified tracking
  - Mind games track performance metrics
*/

DROP TABLE IF EXISTS stress_scores CASCADE;
DROP TABLE IF EXISTS wellness_insights CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS gratitude_entries CASCADE;
DROP TABLE IF EXISTS mind_game_sessions CASCADE;
DROP TABLE IF EXISTS meditation_sessions_ac CASCADE;
DROP TABLE IF EXISTS meditation_sessions CASCADE;
DROP TABLE IF EXISTS habit_logs CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS sleep_logs CASCADE;
DROP TABLE IF EXISTS mood_logs CASCADE;
DROP TABLE IF EXISTS games_sessions_mindworld CASCADE;

-- =============================================
-- MOOD LOGS
-- =============================================

CREATE TABLE mood_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood integer NOT NULL CHECK (mood BETWEEN 1 AND 5),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mood logs"
  ON mood_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood logs"
  ON mood_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood logs"
  ON mood_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood logs"
  ON mood_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- SLEEP LOGS
-- =============================================

CREATE TABLE sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  hours numeric NOT NULL,
  quality integer CHECK (quality BETWEEN 1 AND 5),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sleep logs"
  ON sleep_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sleep logs"
  ON sleep_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sleep logs"
  ON sleep_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sleep logs"
  ON sleep_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- HABITS
-- =============================================

CREATE TABLE habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  frequency text DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'custom')),
  target_days integer[] DEFAULT '{1,2,3,4,5,6,7}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own habits"
  ON habits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
  ON habits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON habits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON habits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- HABIT LOGS
-- =============================================

CREATE TABLE habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date date NOT NULL,
  completed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(habit_id, date)
);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read logs for their habits"
  ON habit_logs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert logs for their habits"
  ON habit_logs FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid()
  ));

CREATE POLICY "Users can update logs for their habits"
  ON habit_logs FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete logs for their habits"
  ON habit_logs FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid()
  ));

-- =============================================
-- MEDITATION SESSIONS (Basic)
-- =============================================

CREATE TABLE meditation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text,
  duration integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own meditation sessions"
  ON meditation_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meditation sessions"
  ON meditation_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- MEDITATION SESSIONS AC (Advanced/Gamified)
-- =============================================

CREATE TABLE meditation_sessions_ac (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id uuid,
  mood_before integer CHECK (mood_before BETWEEN 1 AND 5),
  mood_after integer CHECK (mood_after BETWEEN 1 AND 5),
  stress_before integer CHECK (stress_before BETWEEN 1 AND 10),
  stress_after integer CHECK (stress_after BETWEEN 1 AND 10),
  duration_seconds integer,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE meditation_sessions_ac ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own meditation sessions (AC)"
  ON meditation_sessions_ac FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meditation sessions (AC)"
  ON meditation_sessions_ac FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meditation sessions (AC)"
  ON meditation_sessions_ac FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- MIND GAME SESSIONS
-- =============================================

CREATE TABLE mind_game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id text NOT NULL,
  score integer DEFAULT 0,
  metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mind_game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own game sessions"
  ON mind_game_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game sessions"
  ON mind_game_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Alias for MindWorld games
CREATE TABLE games_sessions_mindworld (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id text NOT NULL,
  score integer DEFAULT 0,
  metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE games_sessions_mindworld ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own game sessions (mindworld)"
  ON games_sessions_mindworld FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game sessions (mindworld)"
  ON games_sessions_mindworld FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- GRATITUDE ENTRIES
-- =============================================

CREATE TABLE gratitude_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gratitude_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own gratitude entries"
  ON gratitude_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gratitude entries"
  ON gratitude_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own gratitude entries"
  ON gratitude_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- JOURNAL ENTRIES
-- =============================================

CREATE TABLE journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own journal entries"
  ON journal_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- WELLNESS INSIGHTS
-- =============================================

CREATE TABLE wellness_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wellness_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wellness insights"
  ON wellness_insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellness insights"
  ON wellness_insights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- STRESS SCORES
-- =============================================

CREATE TABLE stress_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score BETWEEN 1 AND 10),
  factors jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stress_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own stress scores"
  ON stress_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stress scores"
  ON stress_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_mood_logs_user_date ON mood_logs(user_id, created_at DESC);
CREATE INDEX idx_sleep_logs_user_date ON sleep_logs(user_id, date DESC);
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habit_logs_habit_date ON habit_logs(habit_id, date DESC);
CREATE INDEX idx_meditation_sessions_user_id ON meditation_sessions(user_id);
CREATE INDEX idx_meditation_sessions_created_at ON meditation_sessions(created_at DESC);
CREATE INDEX idx_meditation_sessions_ac_user_id ON meditation_sessions_ac(user_id);
CREATE INDEX idx_meditation_sessions_ac_created_at ON meditation_sessions_ac(created_at DESC);
CREATE INDEX idx_mind_game_sessions_user_id ON mind_game_sessions(user_id);
CREATE INDEX idx_mind_game_sessions_created_at ON mind_game_sessions(created_at DESC);
CREATE INDEX idx_gratitude_entries_user_date ON gratitude_entries(user_id, created_at DESC);
CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, created_at DESC);
CREATE INDEX idx_wellness_insights_user_type ON wellness_insights(user_id, insight_type);
CREATE INDEX idx_stress_scores_user_date ON stress_scores(user_id, created_at DESC);
