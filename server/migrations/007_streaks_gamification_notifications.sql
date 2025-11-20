/*
  # Streaks, Gamification & Notifications Schema

  ## Description
  Complete gamification system including streaks, XP, tokens, achievements, quests,
  MindWorld progression, notifications, and AI recommendations.

  ## Major Systems
  - **Streak System**: Universal streak tracking across all activities
  - **XP & Rewards**: Experience points, mind tokens, badges
  - **Quest System**: Daily and weekly quests with rewards
  - **MindWorld**: Gamified meditation worlds with levels
  - **Notifications**: AI-powered notification engine
  - **AI Recommendations**: Context-aware suggestions

  ## Tables Created (by system)

  ### STREAK SYSTEM
  1. **streak_types** - Streak definitions
  2. **user_streaks** - Current streak states
  3. **streak_history** - Historical streak events

  ### XP & REWARDS
  4. **xp_transactions** - XP earning history
  5. **mind_token_transactions** - Token transactions
  6. **badges** - Achievement definitions
  7. **user_badges** - User badge ownership

  ### QUEST SYSTEM
  8. **daily_quests** - Active daily quests
  9. **weekly_quests** - Active weekly quests
  10. **quest_progress** - Quest completion tracking

  ### MINDWORLD
  11. **meditation_worlds** - World definitions
  12. **meditation_levels** - Level content
  13. **meditation_user_progress** - User progression
  14. **level_completions** - Completed levels
  15. **meditation_world_rewards** - Reward definitions

  ### NOTIFICATIONS
  16. **notifications** - In-app notifications
  17. **queued_notifications** - Push notification queue
  18. **notification_daily_counts** - Rate limiting
  19. **notification_templates** - Message templates
  20. **notification_rules_wellness** - AI decision rules

  ### AI RECOMMENDATIONS
  21. **ai_recommendations** - Active recommendations
  22. **ai_recommendations_wellness** - Wellness-specific
  23. **ai_daily_actions** - Real-time suggestions

  ### MEAL PLANNING
  24. **meal_plan_days** - Meal plan structure
  25. **meal_plan_meals** - Meals in plans
  26. **meal_preferences** - User dietary preferences

  ### ADMIN
  27. **products** - Shop products
  28. **global_app_settings** - App configuration

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Notification templates are public read
  - Some tables have realtime subscriptions

  ## Notes
  - Comprehensive gamification system
  - AI-powered recommendations and notifications
  - Cross-module integration via foreign keys
*/

-- DROP TABLES (in dependency order)
DROP TABLE IF EXISTS global_app_settings CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS meal_preferences CASCADE;
DROP TABLE IF EXISTS meal_plan_meals CASCADE;
DROP TABLE IF EXISTS meal_plan_days CASCADE;
DROP TABLE IF EXISTS ai_daily_actions CASCADE;
DROP TABLE IF EXISTS ai_recommendations_wellness CASCADE;
DROP TABLE IF EXISTS ai_recommendations CASCADE;
DROP TABLE IF EXISTS notification_rules_wellness CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS notification_daily_counts CASCADE;
DROP TABLE IF EXISTS queued_notifications CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS meditation_world_rewards CASCADE;
DROP TABLE IF EXISTS level_completions CASCADE;
DROP TABLE IF EXISTS meditation_user_progress CASCADE;
DROP TABLE IF EXISTS meditation_levels CASCADE;
DROP TABLE IF EXISTS meditation_worlds CASCADE;
DROP TABLE IF EXISTS quest_progress CASCADE;
DROP TABLE IF EXISTS weekly_quests CASCADE;
DROP TABLE IF EXISTS daily_quests CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS mind_token_transactions CASCADE;
DROP TABLE IF EXISTS xp_transactions CASCADE;
DROP TABLE IF EXISTS streak_history CASCADE;
DROP TABLE IF EXISTS user_streaks CASCADE;
DROP TABLE IF EXISTS streak_types CASCADE;

-- =============================================
-- STREAK SYSTEM
-- =============================================

CREATE TABLE streak_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  category text CHECK (category IN ('nutrition', 'workout', 'wellness', 'hydration', 'sleep')),
  icon text,
  created_at timestamptz DEFAULT now()
);

-- Public read access for streak types
ALTER TABLE streak_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read streak types"
  ON streak_types FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_type_id uuid NOT NULL REFERENCES streak_types(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_logged_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, streak_type_id)
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own streaks"
  ON user_streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks"
  ON user_streaks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON user_streaks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE streak_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_type_id uuid NOT NULL REFERENCES streak_types(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  streak_count integer DEFAULT 1,
  source text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE streak_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own streak history"
  ON streak_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak history"
  ON streak_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- XP & REWARDS SYSTEM
-- =============================================

CREATE TABLE xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  source text NOT NULL,
  source_id text,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own XP transactions"
  ON xp_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own XP transactions"
  ON xp_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE mind_token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  source text NOT NULL,
  source_id text,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mind_token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own token transactions"
  ON mind_token_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own token transactions"
  ON mind_token_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon text,
  category text,
  rarity text CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  requirement_type text,
  requirement_value integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read badges"
  ON badges FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
  ON user_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- QUEST SYSTEM
-- =============================================

CREATE TABLE daily_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_type text NOT NULL,
  title text NOT NULL,
  description text,
  target_value integer DEFAULT 1,
  current_value integer DEFAULT 0,
  reward_xp integer DEFAULT 50,
  reward_tokens integer DEFAULT 10,
  date date NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own daily quests"
  ON daily_quests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily quests"
  ON daily_quests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily quests"
  ON daily_quests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE weekly_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_type text NOT NULL,
  title text NOT NULL,
  description text,
  target_value integer DEFAULT 7,
  current_value integer DEFAULT 0,
  reward_xp integer DEFAULT 200,
  reward_tokens integer DEFAULT 50,
  week_start date NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE weekly_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own weekly quests"
  ON weekly_quests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly quests"
  ON weekly_quests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly quests"
  ON weekly_quests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE quest_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id uuid NOT NULL,
  progress integer DEFAULT 0,
  completed boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quest_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quest progress"
  ON quest_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quest progress"
  ON quest_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quest progress"
  ON quest_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- MINDWORLD GAMIFIED MEDITATION
-- =============================================

CREATE TABLE meditation_worlds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  theme text,
  unlock_requirement text,
  order_index integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meditation_worlds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read meditation worlds"
  ON meditation_worlds FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE meditation_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id uuid NOT NULL REFERENCES meditation_worlds(id) ON DELETE CASCADE,
  level_number integer NOT NULL,
  title text NOT NULL,
  duration_seconds integer NOT NULL,
  audio_url text,
  script text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(world_id, level_number)
);

ALTER TABLE meditation_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read meditation levels"
  ON meditation_levels FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE meditation_user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  world_id uuid NOT NULL REFERENCES meditation_worlds(id) ON DELETE CASCADE,
  unlocked boolean DEFAULT false,
  current_level integer DEFAULT 1,
  total_xp integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, world_id)
);

ALTER TABLE meditation_user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own meditation progress"
  ON meditation_user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meditation progress"
  ON meditation_user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meditation progress"
  ON meditation_user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE level_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id uuid NOT NULL REFERENCES meditation_levels(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, level_id)
);

ALTER TABLE level_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own level completions"
  ON level_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own level completions"
  ON level_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE meditation_world_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id uuid NOT NULL REFERENCES meditation_worlds(id) ON DELETE CASCADE,
  reward_type text NOT NULL,
  reward_value integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meditation_world_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read meditation rewards"
  ON meditation_world_rewards FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- NOTIFICATION SYSTEM
-- =============================================

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  category text,
  deep_link text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE queued_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('push', 'in_app', 'email')),
  category text,
  title text NOT NULL,
  body text NOT NULL,
  deep_link text,
  scheduled_at timestamptz,
  priority integer DEFAULT 1,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  error text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE queued_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own queued notifications"
  ON queued_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queued notifications"
  ON queued_notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE notification_daily_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE notification_daily_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notification counts"
  ON notification_daily_counts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification counts"
  ON notification_daily_counts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification counts"
  ON notification_daily_counts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  trigger_type text NOT NULL,
  title_template text NOT NULL,
  body_template text NOT NULL,
  deep_link text,
  priority integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category, trigger_type)
);

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read notification templates"
  ON notification_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE notification_rules_wellness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type text NOT NULL,
  condition jsonb NOT NULL,
  notification_template_id uuid REFERENCES notification_templates(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notification_rules_wellness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read notification rules"
  ON notification_rules_wellness FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- AI RECOMMENDATIONS
-- =============================================

CREATE TABLE ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  action jsonb DEFAULT '{}'::jsonb,
  score numeric DEFAULT 0.8,
  priority integer DEFAULT 3,
  clicked boolean DEFAULT false,
  dismissed boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own recommendations"
  ON ai_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON ai_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON ai_recommendations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE ai_recommendations_wellness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_recommendations_wellness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wellness recommendations"
  ON ai_recommendations_wellness FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellness recommendations"
  ON ai_recommendations_wellness FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE ai_daily_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  title text NOT NULL,
  description text,
  data jsonb DEFAULT '{}'::jsonb,
  executed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_daily_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own daily actions"
  ON ai_daily_actions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily actions"
  ON ai_daily_actions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily actions"
  ON ai_daily_actions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- MEAL PLANNING
-- =============================================

CREATE TABLE meal_plan_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid,
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE meal_plan_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own meal plan days"
  ON meal_plan_days FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plan days"
  ON meal_plan_days FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plan days"
  ON meal_plan_days FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE meal_plan_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid NOT NULL REFERENCES meal_plan_days(id) ON DELETE CASCADE,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
  generated_by text CHECK (generated_by IN ('ai', 'manual')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_plan_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read meals for their plan days"
  ON meal_plan_meals FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_plan_days WHERE meal_plan_days.id = meal_plan_meals.day_id AND meal_plan_days.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert meals for their plan days"
  ON meal_plan_meals FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM meal_plan_days WHERE meal_plan_days.id = meal_plan_meals.day_id AND meal_plan_days.user_id = auth.uid()
  ));

CREATE TABLE meal_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  diet_type text,
  allergies text[] DEFAULT '{}',
  dislikes text[] DEFAULT '{}',
  preferred_cuisines text[] DEFAULT '{}',
  avoid_foods text[] DEFAULT '{}',
  preferred_meal_times jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE meal_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own meal preferences"
  ON meal_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal preferences"
  ON meal_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal preferences"
  ON meal_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- ADMIN & SHOP
-- =============================================

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  category text,
  image_url text,
  affiliate_link text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE global_app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE global_app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read global settings"
  ON global_app_settings FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- INDEXES
-- =============================================

-- Streak indexes
CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX idx_streak_history_user_date ON streak_history(user_id, event_date DESC);

-- XP & Rewards indexes
CREATE INDEX idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX idx_mind_token_transactions_user_id ON mind_token_transactions(user_id);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);

-- Quest indexes
CREATE INDEX idx_daily_quests_user_date ON daily_quests(user_id, date DESC);
CREATE INDEX idx_weekly_quests_user_week ON weekly_quests(user_id, week_start DESC);

-- MindWorld indexes
CREATE INDEX idx_meditation_user_progress_user_id ON meditation_user_progress(user_id);
CREATE INDEX idx_level_completions_user_id ON level_completions(user_id);

-- Notification indexes
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_queued_notifications_status ON queued_notifications(status, scheduled_at);
CREATE INDEX idx_notification_daily_counts_user_date ON notification_daily_counts(user_id, date DESC);

-- AI Recommendations indexes
CREATE INDEX idx_ai_recommendations_user_created ON ai_recommendations(user_id, created_at DESC);
CREATE INDEX idx_ai_recommendations_expires ON ai_recommendations(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_ai_daily_actions_user_created ON ai_daily_actions(user_id, created_at DESC);

-- Meal planning indexes
CREATE INDEX idx_meal_plan_days_user_date ON meal_plan_days(user_id, date DESC);
CREATE INDEX idx_meal_plan_meals_day_id ON meal_plan_meals(day_id);
