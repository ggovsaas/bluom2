# Supabase Migration Guide

## 📋 Module A - User System + Onboarding + Personalization Engine

This migration creates the foundational tables for users, onboarding answers, personalized goals, and user preferences. This is the **foundation** of the entire app.

## 🚀 How to Apply

### Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project: `pthmddtyxdragzbtjeuu`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run Module A Migration

1. Open `supabase/migrations/001_module_a_user_system.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify

After running, you should see:
- ✅ Tables created: `users`, `onboarding_answers`, `user_goals`, `personalization_history`, `user_preferences`
- ✅ RPC functions created: `generate_user_goals()`, `complete_onboarding()`
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance

## 📊 What This Module Creates

### Tables
- **users** - User profile extending Supabase auth.users (name, gender, birthday, height, weight, activity level, goals)
- **onboarding_answers** - Stores all 30-question onboarding flow answers
- **user_goals** - Personalized macro targets, training goals, sleep goals, wellness goals
- **personalization_history** - Tracks every recomputation (weight updates, goal changes, etc.)
- **user_preferences** - User settings (units, notifications, quiet hours, coach persona, theme)

### Features
- **Personalization Engine** - Automatic goal generation using Mifflin-St Jeor BMR calculation
- **Activity Multipliers** - TDEE calculation based on activity level (sedentary to athlete)
- **Goal-Based Calories** - Automatic adjustment for lose/maintain/gain goals
- **Macro Calculation** - Protein (2.2g/kg), fats (25% calories), carbs (remaining)
- **Onboarding Integration** - RPC function to complete onboarding and generate goals
- Row Level Security (RLS) policies for data isolation
- Timezone-aware timestamps

### RPC Functions
- `generate_user_goals(uid uuid)` - Calculates personalized goals using BMR/TDEE
- `complete_onboarding(uid uuid)` - Marks onboarding complete and generates goals

## ⚠️ Important Notes

- This migration uses `auth.users` from Supabase Auth
- All tables reference `auth.users(id)` as the primary key
- RLS policies ensure users can only access their own data
- The trial subscription trigger automatically grants premium access for 3 days

## 🔄 Next Steps

After Module A is applied, proceed to Module B (Nutrition Engine).

---

## 📋 Module B - Nutrition Engine

This migration creates all nutrition-related tables: foods, recipes, meal logs, shopping lists, and AI suggestions.

### Step 1: Run Module B Migration

1. Open `supabase/migrations/002_module_b_nutrition_engine.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Verify

After running, you should see:
- ✅ Tables created: `foods`, `user_foods`, `recipes`, `recipe_ingredients`, `meal_logs`, `shopping_lists`, `shopping_list_items`, `ai_meal_suggestions`, `barcode_scans`, `daily_nutrition_summary`
- ✅ Enum created: `meal_type`
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance

## 📊 What Module B Creates

### Tables
- **foods** - Global food database (FatSecret/USDA/manual sources)
- **user_foods** - User-created custom foods
- **recipes** - User-generated recipes
- **recipe_ingredients** - Ingredients for recipes
- **meal_logs** - Breakfast/lunch/dinner/snack tracking
- **shopping_lists** - Shopping list management
- **shopping_list_items** - Individual shopping list items
- **ai_meal_suggestions** - AI-generated meal recommendations
- **barcode_scans** - Barcode scanning history
- **daily_nutrition_summary** - Daily macro totals

### Features
- 18 essential nutrients tracked (calories, protein, carbs, fat, fiber, sugar, etc.)
- Recipe system with automatic nutrition calculation
- Shopping list integration with recipe auto-add
- Barcode scanning support
- AI meal suggestion logging
- Daily nutrition summaries

## ⚠️ Important Notes

- Global `foods` table is publicly readable (for food database)
- All user-specific tables have RLS enabled
- Shopping lists support recipe-based auto-population
- Daily nutrition summaries use unique constraint on (user_id, date)

## 🔄 Next Steps

After Module B is applied, proceed to Module C (Wellness/AIMind) and Module D (Fitness Engine).

---

## 📋 Module C - Wellness (AIMind)

This migration creates all wellness-related tables: mood tracking, sleep logs, habits, journaling, gratitude, meditation, and mind games.

### Step 1: Run Module C Migration

1. Open `supabase/migrations/003_module_c_wellness_aimind.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Verify

After running, you should see:
- ✅ Tables created: `moods`, `sleep_logs`, `habits`, `habit_logs`, `journals`, `gratitude_entries`, `meditation_sessions`, `mind_games`, `mind_game_sessions`, `wellness_insights`
- ✅ RPC functions created: `log_mood`, `log_sleep`, `add_habit`, `toggle_habit`, `add_journal`, `add_gratitude`, `log_meditation`, `log_game`
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance

## 📊 What Module C Creates

### Tables
- **moods** - Daily mood tracking (1-5 scale)
- **sleep_logs** - Sleep duration and quality tracking
- **habits** - User-defined habits to track
- **habit_logs** - Daily habit completion tracking
- **journals** - Freeform journaling entries
- **gratitude_entries** - Gratitude journaling
- **meditation_sessions** - Meditation and breathing session tracking
- **mind_games** - Registry of available mind games
- **mind_game_sessions** - User game performance tracking
- **wellness_insights** - AI-generated wellness insights

### Features
- Mood tracking with notes
- Sleep logging with start/end times and quality
- Habit system with daily completion tracking
- Journaling and gratitude entries
- Meditation session logging (breath, calming, sleep, anxiety, focus)
- Mind games with score and metrics tracking
- AI insights for future GPT integration

### RPC Functions
All wellness operations can be called via Supabase RPC functions for secure, server-side execution.

---

## 📋 Module D - Fitness Engine (Move)

This migration creates all fitness-related tables: exercises, routines, workout sessions, sets, PRs, steps, and cardio tracking.

### Step 1: Run Module D Migration

1. Open `supabase/migrations/004_module_d_fitness_engine.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Verify

After running, you should see:
- ✅ Tables created: `exercises`, `routines`, `routine_exercises`, `workout_sessions`, `workout_sets`, `personal_records`, `steps_tracking`, `cardio_sessions`
- ✅ RPC functions created: `log_set`, `update_session_totals`, `detect_pr`, `create_custom_ex`, `start_workout`, `finish_workout`
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance

## 📊 What Module D Creates

### Tables
- **exercises** - Global exercise library + user custom exercises
- **routines** - User workout plans with objectives
- **routine_exercises** - Exercises within routines (sets, reps, rest)
- **workout_sessions** - Active workout tracking
- **workout_sets** - Detailed set-by-set performance data
- **personal_records** - Auto-detected PRs (weight, reps, volume, time)
- **steps_tracking** - Daily steps tracking
- **cardio_sessions** - Running, cycling, rowing, etc.

### Features
- Global exercise database (bench press, squat, deadlift, etc.)
- Custom exercise creation
- Workout routine builder with scheduled days
- Real-time workout session tracking
- Set-by-set logging with weight, reps, RPE
- Automatic volume calculation
- PR detection and tracking
- Steps and cardio integration

### RPC Functions
All fitness operations can be called via Supabase RPC functions for secure, server-side execution.

## ⚠️ Important Notes

- Global `exercises` table is publicly readable (for exercise database)
- Custom exercises are user-specific with RLS
- Workout sessions automatically calculate total volume
- PR detection runs automatically on set logging
- Steps tracking uses unique constraint on (user_id, date)

## 🔄 Next Steps

After Modules C and D are applied, proceed to Module E (Analytics + AI Engine).

---

## 📋 Module E - Analytics + AI Engine

This migration creates all analytics and AI-related tables: daily summaries, weekly summaries, predictions, and insights feed.

### Step 1: Run Module E Migration

1. Open `supabase/migrations/005_module_e_analytics_ai_engine.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Verify

After running, you should see:
- ✅ Tables created: `analytics_daily_summary`, `analytics_weekly_summary`, `prediction_engine`, `user_insights_feed`
- ✅ RPC functions created: `aggregate_daily_data()`, `compute_weekly_summary()`, `push_insight()`, `save_prediction()`
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance

## 📊 What Module E Creates

### Tables
- **analytics_daily_summary** - One row per user per day with aggregated nutrition, activity, wellness data
- **analytics_weekly_summary** - Weekly analysis with trends, insights, and recommendations
- **prediction_engine** - Model-ready historical features + predicted values (weight, sleep, mood, steps, calories)
- **user_insights_feed** - Dashboard feed items ("Your Mood is Improving", "Consistency Streak", etc.)

### Features
- **Data Aggregation** - Automatically aggregates data from Modules B, C, D
- **Weekly Insights** - Generates insights like "You slept less than 6 hours on average"
- **Predictions** - Stores predicted values for weight, sleep, mood, steps, calories
- **Trend Detection** - Tracks trends for overeating, undereating, burnout, depression markers
- **AI Coach Recommendations** - Generates personalized recommendations
- **Streaks & Progress Scoring** - Calculates nutrition, fitness, wellness, and overall scores
- **User Timeline Feed** - "Your Week in Review" style insights

### RPC Functions
- `aggregate_daily_data(uid uuid, for_date date)` - Aggregates daily data from meal logs, workouts, steps, mood, sleep
- `compute_weekly_summary(uid uuid, week_start date)` - Generates weekly insights and recommendations
- `push_insight(uid uuid, message text, type text, ctx jsonb)` - Adds insight to user feed
- `save_prediction(uid uuid, for_date date, ...)` - Stores prediction outputs from AI models

## ⚠️ Important Notes

- **Depends on Modules A, B, C, D** - This module aggregates data from previous modules
- Daily summaries use unique constraint on (user_id, date)
- Weekly summaries use unique constraint on (user_id, week_start)
- RPC functions automatically calculate nutrition from meal_logs by joining with foods/user_foods/recipes
- Water tracking is included but may need a separate water_log table (currently set to 0)

## 🔄 Next Steps

After Module E is applied, proceed to Module F (Shopping List Engine).

---

## 📋 Module F - Shopping List Engine (Advanced)

This migration enhances the basic shopping lists from Module B and adds advanced features: pantry tracking, AI suggestions, favorites, and auto-sorting.

### Step 1: Run Module F Migration

1. Open `supabase/migrations/006_module_f_shopping_list_engine.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Verify

After running, you should see:
- ✅ Enhanced `shopping_lists` and `shopping_list_items` tables (added columns)
- ✅ New tables: `pantry_items`, `ai_suggestions`, `favorite_items`, `auto_sorted_rules`
- ✅ RPC functions created: `create_shopping_list()`, `add_shopping_item()`, `toggle_item_check()`, `autosort_list()`, `suggest_missing_items()`, and more
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance

## 📊 What Module F Creates

### Enhanced Tables (from Module B)
- **shopping_lists** - Added `updated_at` column
- **shopping_list_items** - Added `notes` and `estimated_price` columns

### New Tables
- **pantry_items** - Track what user already has (with expiration dates)
- **ai_suggestions** - Shopping-specific AI recommendations (recipe-based, macro-based, habit-based)
- **favorite_items** - Fast re-adding to lists
- **auto_sorted_rules** - Smart sorting by category/aisle order

### Features
- **Pantry Integration** - Check if items are already in pantry
- **AI Suggestions** - Based on recipes, meal plans, macros, habits
- **Favorites** - Quick-add frequently used items
- **Auto-Sorting** - Sort lists by category priority (produce → meat → dairy → pantry → frozen → supplements)
- **Budgeting** - Estimated price tracking per item
- **Notes** - Additional context per item

### RPC Functions (10 functions)
- `create_shopping_list(name text)` - Create new list
- `add_shopping_item(list_id, name, qty, category, notes)` - Add item to list
- `toggle_item_check(item_id)` - Mark/unmark as bought
- `autosort_list(list_id)` - Returns sorted items by category priority
- `suggest_missing_items()` - Get AI suggestions
- `add_to_favorites(item_name, category)` - Add to favorites
- `add_from_favorites(list_id, favorite_id)` - Add favorite to list
- `check_pantry(item_name)` - Check if item exists in pantry
- `add_pantry_item(item_name, quantity, category, expires_on)` - Add to pantry
- `save_ai_suggestion(type, item_name, reason)` - Save AI-generated suggestion

## ⚠️ Important Notes

- **Enhances Module B** - This module adds to existing shopping list tables from Module B
- **ID Type Compatibility** - Module B uses BIGSERIAL, Module F uses uuid. The migration handles this gracefully
- **Default Sort Rules** - Automatically seeds default category priorities for new users
- **Pantry Expiration** - Tracks expiration dates for better inventory management
- **AI Integration** - Backend/frontend generates suggestions and calls `save_ai_suggestion()`

## 🔄 Next Steps

After Module F is applied, proceed to Module H (Notifications & Push System).

---

## 📋 Module H - Notifications & Push System

This migration creates all notification-related tables: device tokens, notification settings, scheduled notifications, and smart triggers.

### Step 1: Run Module H Migration

1. Open `supabase/migrations/007_module_h_notifications_push.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Verify

After running, you should see:
- ✅ Tables created: `user_devices`, `notification_settings`, `notifications`, `scheduled_notifications`, `smart_triggers`
- ✅ RPC functions created: `should_notify_now()`, `register_device()`, `update_notification_settings()`, `create_scheduled_notification()`, and more
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance
- ✅ Triggers for auto-updating timestamps

## 📊 What Module H Creates

### Tables
- **user_devices** - Stores Expo push tokens or FCM tokens (iOS, Android, Web)
- **notification_settings** - User preferences for each notification type + quiet hours
- **notifications** - History of sent notifications for analytics and debugging
- **scheduled_notifications** - User-set reminders (meals, hydration, sleep, habits)
- **smart_triggers** - AI/autonomic logic notifications (hydration alerts, sleep warnings, mood trends)

### Features
- **Cross-Platform Support** - iOS, Android, Web push notifications
- **Quiet Hours** - No notifications during user-defined hours (default: 21:00-08:00)
- **Time-Zone Aware** - Respects user's timezone from users table
- **Smart Notifications** - AI-triggered based on behavior patterns
- **Scheduled Reminders** - Daily, hourly, weekly, or one-time notifications
- **Notification History** - Track all sent notifications for analytics
- **Per-Type Settings** - Enable/disable hydration, meals, steps, workouts, sleep, mindfulness, marketing

### RPC Functions (8 functions)
- `should_notify_now(user_id, check_time)` - Checks if notification should be sent (respects quiet hours)
- `register_device(device_type, push_token)` - Register device for push notifications
- `update_notification_settings(...)` - Update user notification preferences
- `create_scheduled_notification(...)` - Create user-set reminder
- `get_user_push_tokens(user_id)` - Get all active push tokens for a user
- `log_notification(user_id, title, body, type)` - Log sent notification
- `mark_notification_delivered(notification_id)` - Mark notification as delivered
- `create_smart_trigger(user_id, trigger_type, metadata)` - Create AI-triggered notification

### Smart Notification Examples
- **Hydration**: "Your hydration is below target today—drink a glass of water now."
- **Steps**: "Great job! You've hit your steps goal for 3 days in a row."
- **Sleep**: "Your sleep has been low for 2 nights—try a meditation before bed."
- **Mood**: "Mood trend detected: You reported 3 days of 'low' mood."

## ⚠️ Important Notes

- **Depends on Module A** - Uses `users` table for timezone
- **Quiet Hours Logic** - Handles both normal hours (10:00-14:00) and midnight-spanning hours (21:00-08:00)
- **Push Token Management** - Tokens are unique and auto-updated if device re-registers
- **Notification Settings** - One row per user (unique constraint on user_id)
- **Smart Triggers** - Backend/AI generates triggers and calls `create_smart_trigger()`
- **Security** - Most functions use `SECURITY DEFINER` for backend access, user functions use `auth.uid()`

## 🔄 Next Steps

After Module H is applied, proceed to Module K (AI Coach Engine).

---

## 📋 Module K - AI Coach Engine

This migration creates the AI coaching system: chat history, daily coaching messages, weekly reports, and AI insights.

### Step 1: Run Module K Migration

1. Open `supabase/migrations/008_module_k_ai_coach_engine.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Verify

After running, you should see:
- ✅ Tables created: `ai_coach_context`, `ai_messages`, `ai_daily_coach_queue`, `ai_weekly_reports`, `ai_insights_saved`
- ✅ RPC functions created: `update_coach_context()`, `get_coach_context()`, `add_ai_message()`, `get_recent_messages()`, and more
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance
- ✅ Triggers for auto-updating timestamps

## 📊 What Module K Creates

### Tables
- **ai_coach_context** - What the AI knows about each user (profile, nutrition, fitness, wellness, recent logs, insights)
- **ai_messages** - Chat history between user and AI coach (last 30 messages kept)
- **ai_daily_coach_queue** - Scheduled daily coaching messages (motivation, nutrition, fitness, wellness, habit, accountability)
- **ai_weekly_reports** - Weekly AI-generated check-in summaries
- **ai_insights_saved** - AI-generated insights from pattern detection (sleep, mood, workout consistency, nutrition patterns)

### Features
- **AI Chat** - Full conversation history with context-aware responses
- **Daily Coaching** - Automated daily messages (morning nutrition, noon meal reminder, afternoon movement, evening recovery)
- **Weekly Reports** - AI-generated weekly summaries with trends and recommendations
- **Smart Insights** - Pattern detection (sleep debt, mood-sleep correlation, workout inconsistency, nutrition mismatch)
- **Context Management** - Compact JSON context combining all user data
- **Message Cleanup** - Automatically keeps only last 30 messages per user

### RPC Functions (12 functions)
- `update_coach_context(...)` - Update AI coach context for a user
- `get_coach_context(user_id)` - Get AI coach context
- `add_ai_message(user_id, role, message, metadata)` - Add message to chat history
- `get_recent_messages(user_id, limit)` - Get last N messages (default 30)
- `queue_daily_coach_message(...)` - Queue a daily coaching message
- `get_pending_coach_messages(limit)` - Get messages ready for delivery
- `mark_coach_message_delivered(message_id)` - Mark message as delivered
- `save_weekly_report(...)` - Save weekly AI report
- `get_latest_weekly_report(user_id)` - Get most recent weekly report
- `save_ai_insight(...)` - Save AI-generated insight
- `get_user_insights(user_id, category)` - Get insights (optionally filtered)
- `cleanup_old_messages(user_id)` - Keep only last 30 messages

## 🧠 AI Coach Behavior Rules

The AI Coach behaves as:
- **A strict but positive trainer**
- **A science-backed nutritionist**
- **A calm wellness mentor**
- **Not a therapist**
- **Never giving medical advice**

### Rules:
1. Always personalize responses based on user context
2. Use short messages (1–2 paragraphs max)
3. Give one actionable step per message
4. Reference recent data ("Yesterday you hit 1500 steps below your goal")
5. Never guilt or shame
6. Never give medical, diagnostic, or supplement recommendations
7. Use motivational tone, not therapy tone
8. Never contradict the user's goal

## ⚠️ Important Notes

- **Depends on Modules A, B, C, D, E** - Integrates data from all previous modules
- **Context Building** - Backend builds compact JSON context from all user data
- **Message Limits** - Chat history limited to last 30 messages (auto-cleanup)
- **Daily Queue** - Messages are queued and delivered via Module H (Notifications)
- **Weekly Reports** - Generated every Sunday at 7pm (backend automation)
- **Insights** - AI detects patterns and saves insights automatically
- **Security** - Most functions use `SECURITY DEFINER` for backend access

## 🔄 Next Steps

After Module K is applied, proceed to Module L (Recipe Engine).

---

## 📋 Module L - Recipe Engine (AI Meal Builder + Grocery Integration)

This migration enhances the basic recipes from Module B and adds advanced features: ingredients, recipe steps, AI-generated meals, and grocery list integration.

### Step 1: Run Module L Migration

1. Open `supabase/migrations/009_module_l_recipe_engine.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Verify

After running, you should see:
- ✅ Enhanced `recipes` table (added servings, prep_time, cook_time, tags, is_ai_generated)
- ✅ New tables: `ingredients`, `recipe_steps`, `ai_generated_meals`, `recipe_grocery_links`
- ✅ RPC functions created: `add_ingredient()`, `create_recipe()`, `calculate_recipe_nutrition()`, and more
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance

## 📊 What Module L Creates

### Enhanced Tables (from Module B)
- **recipes** - Enhanced with:
  - `servings` - Number of servings
  - `prep_time` - Preparation time in minutes
  - `cook_time` - Cooking time in minutes
  - `tags` - Array of tags (high_protein, keto, vegan, breakfast, etc.)
  - `is_ai_generated` - Flag for AI-generated recipes

### New Tables (4 tables)
- **ingredients** - All ingredients (user-created or system-verified)
  - Nutrition data (calories, protein, carbs, fats)
  - Serving size in grams
  - Verification flag (system vs user)

- **recipe_steps** - Ordered cooking instructions
  - Step number and instruction text
  - Unique constraint on (recipe_id, step_number)

- **ai_generated_meals** - AI one-click meals
  - User request text
  - Generated meal JSONB (ingredients, nutrition, steps)

- **recipe_grocery_links** - Links recipes to shopping list items
  - Integration with Module F shopping lists
  - Auto-generates grocery list from recipe ingredients

### Features
- **AI Meal Builder** - Generate meals based on calories, macros, dietary preferences
- **Recipe Steps** - Step-by-step cooking instructions
- **Automatic Nutrition Calculation** - Calculates total calories/macros from ingredients
- **Grocery Integration** - Auto-adds recipe ingredients to shopping list
- **Ingredient Search** - Search verified and user ingredients
- **Recipe Tags** - Categorize recipes (high_protein, keto, vegan, quick, etc.)

### RPC Functions (10 functions)
- `add_ingredient(...)` - Add manual ingredient
- `calculate_recipe_nutrition(ingredients_jsonb)` - Calculate nutrition from ingredients
- `create_recipe(...)` - Create recipe with automatic nutrition calculation
- `add_recipe_step(recipe_id, step_number, instruction)` - Add step to recipe
- `get_recipe_with_steps(recipe_id)` - Get recipe with all steps
- `save_ai_generated_meal(...)` - Save AI-generated meal
- `add_recipe_to_shopping_list(recipe_id, list_id)` - Add recipe ingredients to shopping list
- `get_recipe_ingredients(recipe_id)` - Get all ingredients for a recipe
- `search_ingredients(search_term)` - Search ingredients
- `get_user_ai_meals(user_id, limit)` - Get user's AI-generated meals

## 🧠 AI Meal Builder

### User Requests Examples:
- "Make me a 600-calorie lunch high in protein"
- "Make a meal using eggs + spinach only"
- "Give me a 5-minute breakfast under 300 calories"

### AI Integration:
- Uses personalization data from Module A
- Considers user goals (lose weight, build muscle, maintain)
- Matches dietary preferences and allergies
- Generates complete recipe with ingredients, nutrition, and steps
- Saves to `ai_generated_meals` table

## 🛒 Shopping List Integration

Recipes can:
- **Auto-generate grocery list** - All ingredients added automatically
- **Sync with shopping list** - Links recipes to shopping items
- **Group by category** - Ingredients organized by produce, dairy, protein, carbs
- **Check items off** - Mark ingredients as purchased
- **Recommend alternatives** - Suggest ingredient substitutions

## ⚠️ Important Notes

- **Enhances Module B** - Adds to existing recipes and recipe_ingredients tables
- **ID Type Compatibility** - Handles BIGSERIAL (Module B) and uuid (new tables)
- **Ingredient System** - Separate from foods/user_foods (Module B) for recipe-specific ingredients
- **Recipe Steps** - Ordered instructions for cook mode
- **Grocery Links** - Connects recipes to Module F shopping lists
- **AI Integration** - Backend generates meals and calls `save_ai_generated_meal()`

## 🔄 Next Steps

After Module L is applied, proceed to Module M (Workout Builder Engine).

---

## 📋 Module M - Workout Builder Engine

This migration enhances the basic exercises from Module D and adds advanced features: AI workout builder, training plans, progression tracking, and equipment matching.

### Step 1: Run Module M Migration

1. Open `supabase/migrations/010_module_m_workout_builder_engine.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Verify

After running, you should see:
- ✅ Enhanced `exercises` table (added category, muscle_groups array, equipment_array, instructions, is_verified)
- ✅ New tables: `workouts`, `workout_exercises`, `workout_logs`, `set_logs`, `user_equipment`, `training_plans`, `training_plan_days`
- ✅ RPC functions created: `add_exercise()`, `create_workout()`, `log_workout()`, `get_exercise_progress()`, and more
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance

## 📊 What Module M Creates

### Enhanced Tables (from Module D)
- **exercises** - Enhanced with:
  - `category` - strength, cardio, mobility, stretching
  - `muscle_groups` - Array of muscles worked (chest, quads, glutes, etc.)
  - `equipment_array` - Array of equipment needed (dumbbells, barbell, band, bodyweight)
  - `instructions` - Exercise form instructions
  - `is_verified` - System verified vs user-created
  - Renamed `video_url` → `demo_video_url`
  - Renamed `demo_image` → `demo_image_url`

### New Tables (7 tables)
- **workouts** - Training sessions or routines (separate from Module D routines)
  - Goal, duration, difficulty
  - AI-generated flag

- **workout_exercises** - Exercises in a workout with order, sets, reps, rest
  - Reps as text (supports "12", "8-12", "AMRAP", "30 sec")

- **workout_logs** - Completed workout sessions
  - Duration, calories burned, notes

- **set_logs** - Every working set logged for progression
  - Weight, reps, RIR (reps-in-reserve)
  - Links to workout_logs

- **user_equipment** - User's available equipment
  - Array of equipment (dumbbell, band, bodyweight, barbell, etc.)
  - One row per user

- **training_plans** - Multi-week training plans
  - Goal, duration in weeks
  - AI-generated flag

- **training_plan_days** - Scheduled workouts per day
  - Week number, day of week (1=Monday, 7=Sunday)
  - Links workouts to plans

### Features
- **AI Workout Builder** - Generate workouts based on goal, equipment, time, experience
- **Training Plans** - Multi-week structured programs
- **Progression Tracking** - Track strength over time with set logs
- **Equipment Matching** - Filter workouts by available equipment
- **Exercise Library** - Searchable with filters (category, muscle group, equipment, difficulty)
- **Workout Player Mode** - Gym-friendly interface with timers and set logging

### RPC Functions (11 functions)
- `add_exercise(...)` - Add custom exercise
- `create_workout(...)` - Create workout with exercises
- `log_workout(...)` - Log completed workout with sets
- `get_exercise_progress(user_id, exercise_id, limit)` - Get progression for an exercise
- `update_user_equipment(user_id, equipment_array)` - Update available equipment
- `get_user_equipment(user_id)` - Get user's equipment
- `create_training_plan(...)` - Create multi-week training plan
- `get_workout_for_today(user_id, plan_id)` - Get today's workout from plan
- `search_exercises(...)` - Search exercises with filters
- `get_workout_with_exercises(workout_id)` - Get workout with all exercises
- `save_ai_workout(...)` - Save AI-generated workout

## 🧠 AI Workout Builder

### User Request Examples:
- "Build me a 45-minute strength workout for chest and triceps"
- "Create a fat loss workout using only bodyweight"
- "Generate a 30-minute HIIT workout for beginners"

### AI Integration:
- Uses personalization data from Module A
- Considers user's available equipment
- Matches goal (strength, fat_loss, hypertrophy, mobility)
- Generates complete workout with exercises, sets, reps, rest
- Saves to `workouts` table with `is_ai_generated = true`

### AI Coach Prompt (for backend):
```
You are Bluöm AI Coach.
Generate a workout tailored to:
- Goal: {goal}
- Equipment user has: {equipment}
- Time available: {duration}
- Experience: {difficulty}
- Injuries: {injuries}
- Muscle group focus: {focus}
Return: exercises in order, reps, sets, rest, and explanations.
```

## 📈 Progression Tracking

### Features:
- **Set-by-set logging** - Every working set tracked
- **RIR tracking** - Reps-in-reserve for advanced users
- **Exercise history** - Last 10 logs per exercise
- **Strength charts** - One-rep max estimates, volume over time
- **Muscle group balance** - Track which muscles are worked
- **Workout streaks** - Consistency tracking

## 🛠 Equipment Matching

### Personalization:
- User sets available equipment (dumbbells, bands, bodyweight, etc.)
- AI filters workouts to match equipment
- Exercise library filters by equipment
- Smart substitutions suggested

## ⚠️ Important Notes

- **Enhances Module D** - Adds to existing exercises, routines, workout_sessions
- **Coexistence** - `workouts` and `workout_logs` work alongside Module D's `routines` and `workout_sessions`
- **Equipment Arrays** - Uses PostgreSQL arrays for efficient filtering
- **Training Plans** - Multi-week structured programs with daily scheduling
- **Progression** - Set logs enable detailed strength tracking
- **AI Integration** - Backend generates workouts and calls `save_ai_workout()`

## 🔄 Next Steps

After Module M is applied, proceed to Module R (Home Dashboard Intelligence Layer).

---

## 📋 Module R - Home Dashboard Intelligence Layer

This migration creates the intelligence layer for the home dashboard: daily summaries with targets, AI-generated insights, and quick stats for instant dashboard loading.

### Step 1: Run Module R Migration

1. Open `supabase/migrations/011_module_r_home_dashboard_intelligence.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Verify

After running, you should see:
- ✅ Tables created: `daily_summaries`, `insights`
- ✅ RPC functions created: `update_daily_summary()`, `get_dashboard_summary()`, `save_insight()`, `get_today_insights()`, and more
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance
- ✅ View created: `today_dashboard` with calculated percentages

## 📊 What Module R Creates

### Tables
- **daily_summaries** - Aggregated metrics for fast dashboard loading
  - Nutrition: calories, protein, carbs, fats (consumed + targets)
  - Activity: steps, water (consumed + targets)
  - Wellness: mood, sleep (actual + targets)
  - Workouts: completed status, minutes, calories, name
  - Habits: completed count, total count
  - Quick flags: has_logged_breakfast, has_logged_lunch, etc.
  - Unique constraint on (user_id, date)

- **insights** - AI-generated insights for dashboard
  - Type: sleep, workout, nutrition, mood, recovery, hydration, habit, general
  - Insight text and action step
  - Severity (1-5 scale)
  - Seen flag for unread insights

### Features
- **Smart Aggregation** - Automatically aggregates data from all modules
- **Target Comparison** - Shows consumed vs targets for all metrics
- **Quick Flags** - Fast checks for what's been logged today
- **AI Insights** - Context-aware recommendations and alerts
- **Dashboard View** - Pre-calculated percentages for UI
- **Missing Logs Detection** - Identifies what user hasn't logged

### RPC Functions (7 functions)
- `update_daily_summary(user_id, date)` - Aggregates all data for a day
- `get_dashboard_summary(user_id, date)` - Get today's summary
- `save_insight(user_id, date, type, insight, action_step, severity)` - Save AI insight
- `get_today_insights(user_id, date)` - Get insights for today
- `mark_insight_seen(insight_id)` - Mark insight as seen
- `get_dashboard_quick_stats(user_id)` - Get quick stats (today, yesterday, week avg)
- `get_missing_logs(user_id)` - Get what user hasn't logged today

## 🧠 Dashboard Intelligence

### Data Sources:
- **Module A** - User goals and targets
- **Module B** - Meal logs, nutrition data
- **Module C** - Mood, sleep, habits
- **Module D** - Steps, workout_sessions
- **Module M** - Workout_logs, training plans

### Aggregation Logic:
- Calculates nutrition from meal_logs (joins with foods/user_foods/recipes)
- Gets steps from steps_tracking
- Gets mood from moods (latest of the day)
- Gets sleep from sleep_logs (latest of the day)
- Gets workouts from workout_logs or workout_sessions
- Gets habits from habit_logs
- Pulls targets from user_goals

### AI Insight Examples:
- **Sleep → Mood**: "Your mood drops by 30% on days after <6 hours sleep — aim for 7+ tonight."
- **Protein**: "You reached only 55% of your protein target. Add a high-protein snack."
- **Workouts**: "You're most consistent on Mondays. Let's schedule workouts earlier in the week."
- **Hydration**: "Hydration drops after 8 PM. Try logging water before dinner."

## 📱 Dashboard Widgets

### Widget Cards:
1. **Calories Card** - Calories consumed / target with percentage
2. **Protein Card** - Protein consumed / target
3. **Sleep Card** - Last night's hours + trend
4. **Mood Card** - Today's mood + weekly trend
5. **Workout Card** - Today's plan + start button
6. **Steps Card** - Steps + estimated km
7. **Water Card** - Visual gauge + quick add button
8. **Habits Card** - Streaks + completion percentage
9. **Insights Card** - AI-generated insights with action steps

## ⚠️ Important Notes

- **Depends on Modules A, B, C, D, M** - Aggregates data from all previous modules
- **Coexists with Module E** - `daily_summaries` is dashboard-optimized, `analytics_daily_summary` is for analytics
- **Auto-Aggregation** - Call `update_daily_summary()` whenever user logs data
- **Targets** - Pulls from `user_goals` table (Module A)
- **Quick Flags** - Fast boolean checks for what's been logged (optimized for UI)
- **Insights** - Backend generates insights using AI and calls `save_insight()`

## 🔄 Next Steps

After Module R is applied, the complete home dashboard intelligence system is ready. This module makes the entire app feel smart, personal, and alive! 🎉

---

## 📋 Module O - Meditation + Mind Games World

This migration creates the complete meditation and mind games ecosystem, transforming Bluöm into an immersive mental-fitness world. This module enhances Module C's basic meditation and game tracking with a full catalog system, soundscapes, streaks, leaderboards, and AI-powered personalization.

## 🚀 How to Apply

### Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project: `pthmddtyxdragzbtjeuu`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run Module O Migration

1. Open `supabase/migrations/012_module_o_meditation_games_world.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify

After running, you should see:
- ✅ Tables created: `meditation_catalog`, `meditation_logs`, `soundscapes`, `soundscape_logs`, `meditation_streaks`, `game_leaderboards`
- ✅ Enhanced tables: `mind_games`, `mind_game_sessions` (from Module C)
- ✅ RPC functions created: 10 functions for meditation, soundscapes, and games
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance

## 📊 What This Module Creates

### New Tables

- **`meditation_catalog`** - Catalog of available meditation sessions (sleep, stress, focus, anxiety, mindfulness, gratitude, breathwork)
- **`meditation_logs`** - Tracks when users complete meditation sessions
- **`soundscapes`** - Catalog of ambient soundscapes (rain, ocean, white noise, wind, forest, night, city, cafe)
- **`soundscape_logs`** - Tracks soundscape usage
- **`meditation_streaks`** - Tracks meditation streaks for gamification
- **`game_leaderboards`** - Leaderboards for mind games (optional social feature)

### Enhanced Tables (from Module C)

- **`mind_games`** - Added: difficulty, premium, thumbnail_url
- **`mind_game_sessions`** - Added: reaction_time_ms, accuracy, completed_at

### Features

- **Meditation Catalog System** - Full library of meditation sessions with categories, durations, and premium flags
- **Soundscapes Library** - Ambient sounds for sleep, focus, and relaxation
- **Meditation Streaks** - Automatic streak tracking and gamification
- **Game Leaderboards** - Social competition for mind games
- **AI Recommendations** - Personalized meditation suggestions based on mood, sleep, and habits
- **Progress Analytics** - Comprehensive statistics for meditation and games
- **Premium Gating** - Free vs premium content separation

### RPC Functions

#### Meditation Functions
- `log_meditation_session(user_id, session_id, duration_minutes)` - Log completed meditation and update streak
- `update_meditation_streak(user_id)` - Update meditation streak based on logs
- `get_meditation_recommendations(user_id)` - AI-powered recommendations based on mood/sleep/habits
- `get_user_meditation_stats(user_id)` - Get comprehensive meditation statistics
- `search_meditations(category_filter, duration_filter, premium_filter)` - Search meditation catalog

#### Soundscape Functions
- `log_soundscape(user_id, soundscape_id, duration_minutes)` - Log soundscape usage
- `get_soundscapes_by_category(category_filter)` - Get soundscapes by category

#### Game Functions
- `log_game_score(user_id, game_id, score, reaction_time_ms, accuracy)` - Log game session and update leaderboard
- `get_user_game_stats(user_id, game_id)` - Get game statistics
- `get_leaderboard(game_id, limit_count)` - Get leaderboard for a game

## 🎨 Frontend Architecture

### Screens to Build

1. **Meditation Hub** (`/wellness/meditation`)
   - Start a Meditation
   - Quick Calm (1-2 min)
   - Sleep Stories
   - Breathing Exercises
   - Soundscapes
   - Custom Recommendations (AI-powered)
   - Continue Your Journey (resume last)

2. **Mind Games Hub** (`/wellness/games`)
   - Featured Games
   - Your Best Scores
   - New This Week
   - Recommended for You
   - Categories: Reaction, Memory, Focus, Stress, Cognitive

3. **Sleep World** (`/wellness/sleep`)
   - Night soundscapes
   - Sleep meditations
   - Bedtime routines
   - "Prepare for Sleep" sequence
   - Smart suggestions (mood + sleep correlation)

4. **Progress Dashboard** (`/wellness/progress`)
   - Total meditation time
   - Current streak
   - Mood vs meditation graph
   - Sleep vs meditation graph
   - Best game scores
   - Cognitive improvement stats
   - Focus score trends

## 🤖 AI Personalization

### Recommendation Logic

The `get_meditation_recommendations()` function analyzes:
- **Sleep < 6 hours** → Recommend sleep meditation
- **Mood = low/very_low** → Recommend gratitude meditation
- **Mood = stressed** → Recommend stress/calming meditation
- **Habits incomplete** → Recommend "2-minute reset meditation"
- **Workout fatigue high** → Recommend restorative breathing

### Integration Points

- **Module C** (Wellness) - Uses mood, sleep, habits data
- **Module R** (Dashboard) - Provides insights and recommendations
- **Module K** (AI Coach) - Can suggest meditations in chat
- **Module H** (Notifications) - Can send meditation reminders

## 🎮 Premium vs Free

### Free Tier
- 2 meditations
- 2 soundscapes
- 2 mind games
- Basic breathing exercises
- Basic mood tracking
- Basic sleep logs

### Premium Tier
- Entire meditation library
- Entire game library
- Unlimited usage
- Sleep world features
- AI personalized recommendations
- Advanced insights
- Game analytics
- Journey tracking
- Leaderboard access

## ⚠️ Important Notes

- **Enhances Module C** - Adds catalog system to existing meditation/game tracking
- **Depends on Module C** - Requires `mind_games` and `mind_game_sessions` tables
- **Depends on Module A** - Uses `auth.users` for user references
- **Audio Storage** - Meditation audio files and soundscapes should be stored in Supabase Storage
- **Seed Data** - Populate `meditation_catalog` and `soundscapes` with initial content
- **RLS Enabled** - All tables have Row Level Security policies
- **Public Catalog Access** - Meditation and soundscape catalogs are publicly readable (premium flag indicates access level)

## 🔄 Next Steps

After Module O is applied:
1. **Seed Data** - Populate `meditation_catalog` and `soundscapes` with initial content
2. **Frontend Integration** - Build the 4 screens (Meditation Hub, Games Hub, Sleep World, Progress Dashboard)
3. **Audio Storage** - Set up Supabase Storage buckets for meditation audio files and soundscapes
4. **AI Integration** - Connect `get_meditation_recommendations()` to frontend
5. **Gamification** - Implement streak badges and rewards (Module P)
6. **Social Features** - Implement leaderboard UI (optional)

This module transforms Bluöm into a **multi-dimensional wellness universe** competitive with Calm, Headspace, and Balance! 🎉

---

## 📋 Module P - Rewards & Gamification

This migration creates the complete gamification system, transforming Bluöm from a "health tracker" into an **addictive daily habit loop** that keeps users engaged, progressing, and upgrading to Premium. This is one of the **most valuable retention modules** in consumer wellness apps.

## 🚀 How to Apply

### Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project: `pthmddtyxdragzbtjeuu`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run Module P Migration

1. Open `supabase/migrations/013_module_p_rewards_gamification.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify

After running, you should see:
- ✅ Tables created: `user_progress`, `badges`, `user_badges`, `daily_missions`, `user_daily_missions`, `user_streaks`, `challenges`, `user_challenges`, `xp_transactions`
- ✅ RPC functions created: 10 functions for XP, badges, missions, challenges, streaks, health score
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance

## 📊 What This Module Creates

### New Tables

- **`user_progress`** - Tracks XP, level, and health score per user
- **`badges`** - Catalog of available badges (sleep, mood, nutrition, fitness, mindfulness)
- **`user_badges`** - Tracks which badges users have earned
- **`daily_missions`** - Catalog of daily missions (LOG_MEAL, DRINK_WATER, MEDITATE, etc.)
- **`user_daily_missions`** - Tracks which missions users completed today
- **`user_streaks`** - General app usage streak tracking
- **`challenges`** - Weekly/monthly challenges
- **`user_challenges`** - Tracks user participation in challenges
- **`xp_transactions`** - Complete audit log of all XP earned

### Features

- **XP System** - Experience points earned across all app activities
- **Level System** - Progressive leveling (Level = XP / 150)
- **Badge System** - Achievement system with automatic badge checking
- **Daily Missions** - Dynamic daily tasks that reset each day
- **Challenges** - Weekly/monthly challenges with goals and rewards
- **Streak Tracking** - General app usage streak (separate from meditation streaks)
- **Health Score** - Universal 0-100 score representing overall wellness
- **Premium Integration** - 2× XP multiplier for premium users
- **Complete Audit Log** - All XP transactions tracked

### RPC Functions

#### XP & Level Functions
- `award_xp(user_id, xp_amount, source, source_id, multiplier)` - Awards XP and handles level ups
- `check_and_award_badges(user_id)` - Automatically checks and awards badges

#### Mission Functions
- `complete_mission(user_id, mission_code)` - Marks mission complete and awards XP
- `get_daily_missions_for_user(user_id)` - Gets today's missions with completion status

#### Streak Functions
- `update_user_streak(user_id)` - Updates general app usage streak

#### Challenge Functions
- `join_challenge(user_id, challenge_id)` - User joins a challenge
- `update_challenge_progress(user_id, challenge_id, progress_increment)` - Updates challenge progress

#### Health Score Functions
- `calculate_health_score(user_id)` - Calculates overall health score (0-100)

#### Progress Functions
- `get_user_progress(user_id)` - Gets complete progress summary
- `get_user_badges(user_id)` - Gets all badges earned by user

## 🎮 XP Earning Rules

### Nutrition
- Log food → +10 XP
- Hit calories target → +20 XP
- Create recipe → +15 XP
- Drink 2L water → +15 XP

### Fitness
- Log workout → +20 XP
- Finish steps goal → +15 XP
- Complete workout plan day → +40 XP

### Wellness
- Complete sleep log → +10 XP
- Mood entry → +5 XP
- Complete habit → +10 XP per habit
- Meditation → XP = duration_minutes × 3
- Play cognitive game → +score/100 XP

### Missions & Challenges
- Complete daily mission → Mission XP reward
- Complete challenge → Challenge XP reward (typically 100+)

### Badges
- Earn badge → +50 XP

### Level Progression
- **Formula**: Level up when XP ≥ level × 150

## 🏆 Badge Examples

- **Meditation**: "Zen Beginner" (3 meditations), "Focus Master" (1 hour total)
- **Fitness**: "Sweat Starter" (first workout), "Beast Mode" (20 workouts)
- **Nutrition**: "Clean Plate" (log meals 7 days), "Hydra King" (hit water goal 10×)
- **Mind Games**: "Lightning Reflexes" (reaction < 200ms), "Memory Architect" (10 memory games)

## 📅 Daily Missions Examples

### Free Missions
- ✔ Log 2 meals → 10 XP
- ✔ Meditate 5 minutes → 15 XP
- ✔ Walk 5000 steps → 20 XP
- ✔ Play 1 mind game → 10 XP

### Premium Missions
- ✔ Meditate 15 min → +40 XP
- ✔ Complete a sleep session → +25 XP
- ✔ Hit all macro targets → +30 XP

## 📊 Health Score Formula

```
health_score = (
    sleep_score * 0.25 +
    nutrition_score * 0.25 +
    activity_score * 0.25 +
    wellness_score * 0.25
)
```

## 🎨 Frontend Components

1. **XP Progress Bar** - Shows current XP and progress to next level
2. **Level Bubble** - Displays current level with level up animation
3. **Daily Mission Cards** - List of today's missions with checkboxes
4. **Badge Showcase** - Grid of earned/locked badges
5. **Challenge Tracker** - Active challenges with progress bars
6. **Streak Tracker** - Current streak display with fire emoji
7. **Health Score Ring** - Circular progress indicator (0-100)
8. **Reward Unlock Popups** - Level up, badge earned, challenge completed animations

## 🤖 Integration Points

- **Module A** (User System) - Uses `user_goals` for targets
- **Module B** (Nutrition) - Awards XP for meal logs, recipes, water
- **Module C** (Wellness) - Awards XP for mood, sleep, habits
- **Module D** (Fitness) - Awards XP for workouts, steps
- **Module M** (Workouts) - Awards XP for workout plans
- **Module O** (Meditation/Games) - Awards XP for meditation, games
- **Module R** (Dashboard) - Uses `daily_summaries` for health score

## 🎮 Premium Integration

Premium users get:
- **2× XP multiplier** on all activities
- Premium-only challenges
- Premium-only badges
- Unlocked content (meditations, games)
- Bonus streak protection (1 free miss per month)
- Auto-check daily mission for workout plans

## ⚠️ Important Notes

- **Depends on Module R** - `calculate_health_score()` requires `daily_summaries` table
- **Depends on Module A** - Uses `user_goals` for health score targets
- **Integrates with All Modules** - XP awarded from all activity logging
- **Seed Data Required** - Populate `badges` and `daily_missions` with initial content
- **RLS Enabled** - All tables have Row Level Security policies
- **Audit Logging** - All XP transactions are logged in `xp_transactions`

## 🔄 Next Steps

After Module P is applied:
1. **Seed Data** - Populate `badges` and `daily_missions` with initial content
2. **Frontend Integration** - Build gamification UI components
3. **XP Integration** - Call `award_xp()` from all activity logging endpoints
4. **Mission System** - Generate daily missions (static or AI-generated)
5. **Challenge System** - Create weekly/monthly challenges
6. **Premium Integration** - Add 2× XP multiplier for premium users
7. **Badge Icons** - Design and upload badge icons to Supabase Storage

This module transforms Bluöm into an **addictive daily habit loop** competitive with MyFitnessPal, Noom, Strava, and other engagement-focused wellness apps! 🎮🏆

---

## 📋 Module Q - Centralized Analytics Engine

This migration creates the **centralized analytics engine** that becomes the **heart of all intelligence** in Bluöm. This module provides a single source of truth for daily analytics, event logging, and comprehensive views that power the home dashboard, AI Coach, notifications, and all intelligent features.

## 🚀 How to Apply

### Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project: `pthmddtyxdragzbtjeuu`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run Module Q Migration

1. Open `supabase/migrations/014_module_q_centralized_analytics.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify

After running, you should see:
- ✅ Tables created: `daily_analytics`, `analytics_events`
- ✅ Views created: `analytics_summary_view`, `analytics_weekly_summary`, `analytics_monthly_summary`, `event_summary_view`
- ✅ RPC functions created: 8 functions (upsert, log, get, sync functions)
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance

## 📊 What This Module Creates

### New Tables

- **`daily_analytics`** - Main centralized analytics table: one row per user per day
  - Nutrition: calories, protein, carbs, fat, fiber, sugar, water_ml
  - Fitness: steps, workouts_completed, workout_minutes, strength_volume
  - Wellness: sleep_hours, sleep_quality, mood, stress_level
  - Habits: habits_completed, total_habits
  - Recovery: recovery_score

- **`analytics_events`** - Event log for trend analysis, time-series, AI correlation
  - Fields: user_id, event_type, value, meta (jsonb), created_at
  - Event types: "meal_logged", "water_added", "sleep_logged", "workout_completed", etc.

### Views

- **`analytics_summary_view`** - Used for home dashboard, AI insights, weekly reports
- **`analytics_weekly_summary`** - Weekly aggregates for trend analysis
- **`analytics_monthly_summary`** - Monthly aggregates
- **`event_summary_view`** - Summary of events by type

### Features

- **Centralized Daily Analytics** - All metrics in one table per user per day
- **Event Logging** - Complete event log for trend analysis
- **Analytics Views** - Pre-built views for dashboard and reports
- **Sync Functions** - Helper functions to sync data from other modules
- **Comprehensive Metrics** - Nutrition, fitness, wellness, habits, recovery all in one place

### RPC Functions

#### Core Functions
- `upsert_daily_analytics(...)` - Upserts daily analytics (additive for some fields, replacement for others)
- `log_event(user_id, event_type, value, meta)` - Logs an analytics event
- `get_daily_analytics(user_id, date)` - Gets analytics for a specific day
- `get_analytics_range(user_id, start_date, end_date)` - Gets analytics for a date range
- `get_event_trends(user_id, event_type, days)` - Gets event trends for analysis

#### Sync Functions (Module Integration)
- `sync_from_meal_log(user_id, date)` - Syncs nutrition data from meal_logs
- `sync_from_workout(user_id, date)` - Syncs workout data from workout_logs
- `sync_from_wellness(user_id, date)` - Syncs wellness data from sleep_logs, moods, habit_logs

## 🎨 How Modules Use This

### Module R — Dashboard Intelligence
- Reads `analytics_summary_view` for home dashboard
- Fast access to all daily metrics

### Module K — AI Coach Engine
- Pulls mood trends, sleep patterns, habit consistency, workout frequency
- Uses `get_analytics_range()` and `get_event_trends()` for context

### Module H — Notification AI
- Uses analytics to decide:
  - "You're low on water"
  - "You haven't logged a meal today"
  - "You slept poorly → reduce intensity today"

### Module P — Rewards & Gamification
- Can use `daily_analytics` for health score calculation
- Tracks streaks and completion rates

## 📈 Event Types

Common event types to log:
- `meal_logged` - When user logs a meal
- `water_added` - When user logs water
- `sleep_logged` - When user logs sleep
- `workout_completed` - When user completes workout
- `steps_updated` - When steps are synced
- `mood_logged` - When user logs mood
- `habit_completed` - When user completes habit
- `meditation_completed` - When user completes meditation
- `game_played` - When user plays mind game

## ⚠️ Important Notes

- **Works Alongside Modules E and R** - Module Q provides centralized analytics, while E and R have their own specialized analytics
- **Depends on Modules B, C, M** - Sync functions pull from meal_logs, sleep_logs, moods, workout_logs
- **Event Logging** - Call `log_event()` from all activity logging endpoints
- **Daily Sync** - Set up cron jobs or triggers to call sync functions daily
- **RLS Enabled** - All tables have Row Level Security policies
- **Performance Optimized** - Indexes created for fast queries

## 🔄 Next Steps

After Module Q is applied:
1. **Event Logging Integration** - Call `log_event()` from all activity logging endpoints
2. **Daily Sync** - Set up cron jobs or triggers to call sync functions daily
3. **Dashboard Integration** - Use `analytics_summary_view` in home dashboard
4. **AI Integration** - Use `get_analytics_range()` and `get_event_trends()` for AI Coach
5. **Notification Integration** - Use analytics for smart notification triggers
6. **Analytics Dashboard** - Build analytics dashboard using views

## 🔄 Integration Pattern

### When User Logs Activity:

1. **Log the event**:
   ```sql
   SELECT log_event(user_id, 'meal_logged', calories, '{"food_id": "..."}');
   ```

2. **Update daily analytics**:
   ```sql
   SELECT upsert_daily_analytics(user_id, CURRENT_DATE, calories, protein, ...);
   ```

3. **Or use sync function**:
   ```sql
   SELECT sync_from_meal_log(user_id, CURRENT_DATE);
   ```

### For Dashboard:

```sql
SELECT * FROM analytics_summary_view 
WHERE user_id = $1 AND date = CURRENT_DATE;
```

### For AI Coach:

```sql
SELECT * FROM get_analytics_range(user_id, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE);
SELECT * FROM get_event_trends(user_id, 'mood_logged', 30);
```

This module creates the **centralized analytics engine** that powers all intelligence in Bluöm! 🧠📊

---

## 📋 Module S - Subscriptions Engine

This migration creates the **Stripe-native subscription management system** for Bluöm. This module handles free trials, monthly/annual plans, subscription status management, and premium entitlements. It connects Stripe ↔ Supabase ↔ App UI and supports cross-platform subscriptions (web + iOS + Android).

## 🚀 How to Apply

### Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project: `pthmddtyxdragzbtjeuu`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run Module S Migration

1. Open `supabase/migrations/015_module_s_subscriptions.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify

After running, you should see:
- ✅ Tables created: `subscription_products`, `subscription_prices`, `user_subscriptions`
- ✅ RPC functions created: 8 functions (init, update, downgrade, entitlements, trial, cancel, products)
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance
- ✅ Trigger created for auto-initialization on user signup

## 📊 What This Module Creates

### New Tables

- **`subscription_products`** - Stripe products (monthly + annual plans)
  - Fields: id, stripe_product_id (unique), name, description, created_at
  - Public read access (for pricing page)

- **`subscription_prices`** - Stripe price IDs per billing period
  - Fields: id, stripe_price_id (unique), product_id, interval ('month' or 'year'), amount (cents), currency, created_at
  - Public read access (for pricing page)

- **`user_subscriptions`** - One row per user, always synced with Stripe
  - Fields: user_id (unique), stripe_customer_id, stripe_subscription_id, plan_id, status, trial_end, current_period_end, is_premium
  - Auto-initialized on user signup

### Features

- **Stripe Integration** - Native Stripe product and price management
- **Free Trial** - 3-day free trial for new users
- **Subscription Plans** - Monthly and annual plans
- **Status Management** - free, trialing, active, past_due, canceled, expired
- **Premium Entitlements** - Simple `is_premium` boolean for app checks
- **Auto-Downgrade** - Automatic downgrade when trial/subscription expires
- **Cross-Platform** - Supports web (Stripe), iOS (StoreKit), Android (Google Play)

### RPC Functions

#### Core Functions
- `init_subscription_for_user(user_id)` - Creates subscription row when user signs up (auto-called by trigger)
- `update_subscription_from_stripe(...)` - Updates subscription from Stripe webhook
- `downgrade_expired_subscriptions()` - Downgrades expired subscriptions (call via CRON)
- `get_user_entitlement(user_id)` - Check entitlements (frontend helper)
- `is_user_premium(user_id)` - Quick premium check
- `start_trial(user_id, trial_days)` - Starts a free trial
- `cancel_subscription(user_id)` - Cancels a subscription
- `get_subscription_products()` - Gets all products with prices (for pricing page)

## 🎯 Entitlements Logic

| Status   | App Tier               | is_premium |
| -------- | ---------------------- | ---------- |
| free     | Free/basic features    | false      |
| trialing | Premium                | true       |
| active   | Premium                | true       |
| past_due | Premium (grace period) | true       |
| canceled | Free                   | false      |
| expired  | Free                   | false      |

### Premium Check in App

```typescript
const { data: entitlement } = await supabase
  .rpc('get_user_entitlement', { p_user_id: user.id });

const isPremium = entitlement.is_premium;
```

## 🔗 Stripe Webhooks Required

You need to handle these Stripe webhooks:

1. **`customer.created`** - Store `stripe_customer_id`
2. **`customer.subscription.created`** - Call `update_subscription_from_stripe()`
3. **`customer.subscription.updated`** - Call `update_subscription_from_stripe()`
4. **`customer.subscription.deleted`** - Call `update_subscription_from_stripe()` with status = 'canceled'
5. **`checkout.session.completed`** - Link subscription to user

## 📱 Mobile Integration

### Android (Google Play Billing)
- On purchase → call backend → backend validates receipt → update Supabase
- On app start → call `get_user_entitlement()`

### iOS (StoreKit)
- On purchase → call backend → backend validates receipt → update Supabase
- On app start → call `get_user_entitlement()`
- "Restore purchases" → backend revalidates receipt → update Supabase

## 🎮 Free vs Premium Enforcement

### FREE TIER (after 3-day trial ends)
- Log up to 4 meals/day
- Water tracking
- Steps tracking
- Exercise database (view only)
- Create simple workouts
- Sleep tracking
- Mood tracking
- Habits tracking
- Mind games (2 per category)
- Home Dashboard basic view

### PREMIUM TIER
- Unlimited meal logging
- Custom macro targets
- Recipe recommendations
- AI meal planning
- Unlimited workout routines
- Personalized plans
- Complete meditation world
- AI Coach
- AI recommendations
- Weekly reports
- Advanced analytics
- 2× XP multiplier

## ⚠️ Important Notes

- **Replaces Old Subscription System** - Module S replaces the old `subscriptions` table from Module A
- **Stripe Account Required** - Requires Stripe products and prices to be created
- **Webhook Handler** - Backend needs to handle Stripe webhooks
- **CRON Job** - Set up daily CRON to call `downgrade_expired_subscriptions()`
- **Auto-Initialization** - Subscription row is automatically created on user signup
- **RLS Enabled** - All tables have Row Level Security policies

## 🔄 Next Steps

After Module S is applied:
1. **Create Stripe Products** - Create monthly and annual products in Stripe
2. **Seed Database** - Insert products and prices into `subscription_products` and `subscription_prices`
3. **Webhook Handler** - Build backend endpoint to handle Stripe webhooks
4. **CRON Job** - Set up daily CRON to call `downgrade_expired_subscriptions()`
5. **Frontend Integration** - Build pricing page and subscription management UI
6. **Mobile Integration** - Integrate with StoreKit (iOS) and Google Play Billing (Android)
7. **Premium Checks** - Add premium checks throughout the app using `is_user_premium()`

## 🔄 Integration Pattern

### When User Signs Up:
```sql
-- Automatically called by trigger
SELECT init_subscription_for_user(user_id);
```

### When Stripe Webhook Received:
```sql
SELECT update_subscription_from_stripe(
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    'active', -- or 'trialing', 'canceled', etc.
    plan_id,
    current_period_end,
    trial_end
);
```

### Daily CRON Job:
```sql
SELECT * FROM downgrade_expired_subscriptions();
```

### Frontend Premium Check:
```typescript
const { data: entitlement } = await supabase
  .rpc('get_user_entitlement', { p_user_id: user.id });

if (entitlement.is_premium) {
  // Show premium features
}
```

This module creates the **Stripe-native subscription system** that monetizes Bluöm! 💰🎯

---

## 📋 Module T - Social Layer

This migration creates the **social layer** for Bluöm, transforming it from a personal health tracker into a **community-driven experience**. This module includes friends, social feed, posts, likes, comments, social challenges, and activity feed. All features are premium-friendly with appropriate gating.

## 🚀 How to Apply

### Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project: `pthmddtyxdragzbtjeuu`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run Module T Migration

1. Open `supabase/migrations/016_module_t_social_layer.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify

After running, you should see:
- ✅ Tables created: `friends`, `posts`, `post_likes`, `post_comments`, `social_challenges`, `social_challenge_participants`, `activity_feed`
- ✅ RPC functions created: 15 functions (friend management, post management, challenge management, activity logging)
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance

## 📊 What This Module Creates

### New Tables

- **`friends`** - Friend relationships (pending, accepted, blocked)
- **`posts`** - Social feed posts (meal, workout, mood, sleep, journal, progress, text)
- **`post_likes`** - Likes on posts
- **`post_comments`** - Comments on posts
- **`social_challenges`** - Social challenges (separate from Module P's gamification challenges)
- **`social_challenge_participants`** - Participants in social challenges
- **`activity_feed`** - Auto-generated events (workouts, goals reached, streaks)

### Features

- **Friends System** - Add friends, send/accept/reject requests, block users
- **Social Feed** - Share meals, workouts, mood, sleep, journal entries, or text posts
- **Likes & Comments** - Engage with posts through likes and comments
- **Social Challenges** - Create and join challenges (steps, water, workouts, meditation, mood, sleep, habit)
- **Activity Feed** - Auto-generated events
- **Privacy Controls** - Posts can be private, friends-only, or public
- **Premium Gating** - Some features require premium (create challenges, unlimited posts)

### RPC Functions

#### Friend Functions
- `send_friend_request(user_id, friend_id)` - Sends a friend request
- `accept_friend_request(user_id, friend_id)` - Accepts a friend request
- `reject_friend_request(user_id, friend_id)` - Rejects a friend request
- `block_user(user_id, friend_id)` - Blocks a user
- `get_friends_list(user_id)` - Gets list of accepted friends
- `get_pending_friend_requests(user_id)` - Gets pending requests

#### Post Functions
- `create_post(user_id, type, content, visibility)` - Creates a post (free: 3/day, premium: unlimited)
- `like_post(user_id, post_id)` - Likes a post
- `unlike_post(user_id, post_id)` - Unlikes a post
- `add_comment(user_id, post_id, comment)` - Adds a comment
- `get_friends_feed(user_id, limit_count)` - Gets social feed from friends

#### Challenge Functions
- `create_social_challenge(...)` - Creates a challenge (premium only)
- `join_social_challenge(user_id, challenge_id)` - Joins a challenge
- `update_social_challenge_progress(user_id, challenge_id, progress_increment)` - Updates progress

#### Activity Functions
- `log_activity(user_id, event_type, metadata)` - Logs an activity feed event

## 🎮 Premium Gating

| Feature                      | Free               | Premium   |
| ---------------------------- | ------------------ | --------- |
| Add friends                  | ✔️                 | ✔️        |
| Join challenges              | ✔️                 | ✔️        |
| Post to feed                 | ✔️ limited (3/day) | unlimited |
| View unlimited feed          | ✔️                 | ✔️        |
| Comment                      | ✔️                 | ✔️        |
| Emoji reacts                 | ✔️                 | ✔️        |
| Create challenges            | ❌                  | ✔️        |
| Advanced challenge analytics | ❌                  | ✔️        |
| Global leaderboard           | ❌                  | ✔️        |
| Share journal entries        | ❌                  | ✔️        |
| AI challenge suggestions     | ❌                  | ✔️        |

## 🔗 Cross-Module Integrations

### Auto-Create Posts

Automatically create posts when user:
- Logs a workout
- Completes a habit
- Hits water/steps target
- Hits a sleep streak
- Logs strong mood
- Completes meditation
- Achieves a streak (Module P)

### Auto-Challenge Updates

Update challenge progress every midnight from:
- Steps tracking
- Water logs
- Workout logs
- Meditation logs
- Mood logs
- Habit logs

### AI Coach Integration (Module K)

AI Coach can generate:
- Friend suggestions
- Challenge recommendations
- "Social Health Score"

### Notification Hooks (Module H)

Push notifications:
- "Your friend ___ invited you to a challenge."
- "New comment on your post."
- "___ liked your workout."
- "You're falling behind in your challenge."

## ⚠️ Important Notes

- **Separate from Module P** - Social challenges are separate from Module P's gamification challenges
- **Depends on Module S** - Checks `is_premium` for post limits and challenge creation
- **Privacy Controls** - Posts respect visibility settings (private, friends, public)
- **RLS Enabled** - All tables have Row Level Security with complex visibility logic
- **Performance Optimized** - Indexes created for fast queries

## 🔄 Next Steps

After Module T is applied:
1. **Frontend Integration** - Build Friends tab, Social Feed, Challenges tab
2. **Auto-Post Integration** - Add `create_post()` calls to activity logging endpoints
3. **Challenge Updates** - Set up daily CRON to update challenge progress
4. **Activity Feed** - Add `log_activity()` calls throughout the app
5. **Notification Integration** - Connect to Module H for social notifications
6. **AI Integration** - Connect to Module K for friend/challenge suggestions
7. **Premium Checks** - Add premium checks for challenge creation and post limits

## 🎨 UI/UX Blueprint

### Friends Tab
- Friend Requests (sent/received)
- Add Friends (search emails/usernames)
- Friend List
- Blocked List

### Social Feed
- Profile picture, username, time
- Type icon (meal/mood/workout/journal)
- Content preview
- Emoji reactions
- Comments
- Share button (premium-only)

### Challenges Tab
- Categories: Steps, Hydration, Workouts, Meditation, Mood streak, Habit streak
- Sections: Featured Challenges, Friends Challenges, My Challenges, Completed
- Challenge Screen: Goal progress ring, Leaderboard, Share progress to feed

This module creates the **social layer** that transforms Bluöm into a **community-driven experience**! 👥🎯

---

## 📋 Module W - AI Recommendation Engine

This migration creates the **AI Recommendation Engine** that learns the user, adapts daily, and makes personalized decisions across nutrition, fitness, wellness, and recovery. This is the **real intelligence** behind Bluöm, providing daily AI-driven recommendations, contextual recommendations, and global AI insights.

## 🚀 How to Apply

### Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project: `pthmddtyxdragzbtjeuu`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run Module W Migration

1. Open `supabase/migrations/017_module_w_ai_recommendation_engine.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify

After running, you should see:
- ✅ Tables created: `ai_recommendations`, `ai_context_triggers`, `ai_recommendation_stats`, `ai_personalization_profile`
- ✅ RPC functions created: 9 functions (generate daily, generate context, get, mark status, update profile, get profile, log interaction, cleanup, insights)
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance

## 📊 What This Module Creates

### New Tables

- **`ai_recommendations`** - Stores all AI suggestions (nutrition, workout, wellness, sleep, mood, recovery, grocery, habit, challenge, hydration)
- **`ai_context_triggers`** - Instant recommendations triggered by user actions
- **`ai_recommendation_stats`** - Tracks engagement to improve personalization
- **`ai_personalization_profile`** - Adaptively learns user preferences (meals, workouts, patterns)

### Features

- **Daily Recommendations Feed** - Personalized recommendations generated daily (runs at midnight)
- **Contextual Recommendations** - Instant recommendations triggered by user actions (premium only)
- **Personalization Profile** - Adaptively learns user preferences
- **Recommendation Stats** - Tracks engagement to improve personalization
- **Context Triggers** - Responds instantly when user logs activities
- **Premium Gating** - Context recommendations are premium-only, daily recommendations limited for free users

### RPC Functions

#### Core Functions
- `generate_daily_recommendations(user_id)` - Generates daily recommendations (free: 2/day, premium: unlimited)
- `generate_context_recommendation(user_id, trigger_type, payload)` - Generates instant contextual recommendations (premium only)
- `get_user_recommendations(user_id, category_filter, limit_count)` - Gets recommendations for a user
- `mark_recommendation_status(user_id, recommendation_id, status)` - Marks recommendation as read/ignored/completed
- `update_personalization_profile(user_id, updates)` - Updates user personalization profile
- `get_personalization_profile(user_id)` - Gets user personalization profile
- `log_recommendation_interaction(user_id, recommendation_id, interaction)` - Logs user interaction
- `cleanup_expired_recommendations()` - Cleans up expired recommendations (call via CRON)
- `get_recommendation_insights(user_id, days)` - Gets insights about what recommendations work best

## 🧠 AI Logic Examples

### Daily Recommendations

**Nutrition:**
- "Protein looks low today" - If yesterday's protein < 70% of target
- "Increase Hydration Today" - If water intake < 1500ml yesterday

**Workouts:**
- "Upper Body Recommended" - If last upper body workout > 4 days ago
- "Take a Walk" - If steps are below goal

**Sleep:**
- "Recovery Focus Today" - If sleep < 85% of target (premium only)

### Contextual Recommendations

**When user logs heavy carb meal:**
- → AI suggests a walk
- → Adds item to tomorrow's plan
- → Suggests lower-carb recipes

**When user logs poor sleep:**
- → AI adjusts workout intensity
- → Suggests meditation
- → Suggests hydration increases
- → Sends "recovery day" recommendation

**When user logs strong mood:**
- → AI suggests sharing on feed
- → Suggests harder workout
- → Suggests habit streak reward

## 🎯 Premium Gating

| Feature                    | Free       | Premium   |
| -------------------------- | ---------- | --------- |
| Daily AI tips              | ✔️ (2/day) | unlimited |
| Context AI                 | ❌          | ✔️        |
| Personalized meal planning | ❌          | ✔️        |
| Personalized workout plans | ❌          | ✔️        |
| Sleep & recovery insights  | ❌          | ✔️        |
| Habit intelligence         | ❌          | ✔️        |
| Grocery suggestions        | ❌          | ✔️        |
| Challenge recommendations  | ❌          | ✔️        |

## 🔗 Cross-Module Integrations

### Connected to:

- **Module A** (User System) - Uses user_goals for targets
- **Module B** (Nutrition) - Analyzes meal_logs, food tracking
- **Module C** (Wellness) - Analyzes mood, sleep, habits
- **Module D** (Fitness) - Analyzes workouts, steps
- **Module Q** (Analytics) - Uses daily_analytics for patterns
- **Module R** (Dashboard) - Uses daily_summaries for insights
- **Module P** (Rewards) - Can suggest challenges based on streaks
- **Module S** (Subscriptions) - Checks is_premium for gating
- **Module T** (Social) - Can suggest sharing achievements

## 🚀 What the Engine Actually DOES

### 1. Learns Patterns
- "User eats low protein every Sunday."
- "User sleeps worse after late workouts."
- "User's mood dips on low hydration."

### 2. Anticipates Needs
- "Today is a recovery day."
- "Suggest 20 min walking after heavy meal."

### 3. Reacts Instantly
- Mood drop → breathing exercise
- Poor sleep → reduce intensity
- Low water → hydration prompt
- Finishes workout → recovery stretch

### 4. Helps Achieve Goals
- Weight loss
- Muscle gain
- Stress reduction
- Habit formation
- Sleep improvement

## ⚠️ Important Notes

- **Does NOT Overlap** - Module W is separate from Q (Analytics), R (Dashboard Intelligence), K (AI Coach)
- **Uses Other Modules** - Pulls data from Q, R, A, B, C, D for recommendations
- **Depends on Module S** - Checks `is_premium` for gating
- **CRON Required** - Set up daily CRON to call `generate_daily_recommendations()` at midnight
- **Context Integration** - Call `generate_context_recommendation()` from activity logging endpoints
- **RLS Enabled** - All tables have Row Level Security policies

## 🔄 Next Steps

After Module W is applied:
1. **CRON Job Setup** - Set up daily CRON to call `generate_daily_recommendations()` at midnight
2. **Context Integration** - Call `generate_context_recommendation()` from activity logging endpoints
3. **Frontend Integration** - Build recommendations UI (cards, feed, actions)
4. **Profile Learning** - Update `ai_personalization_profile` based on user interactions
5. **Analytics Integration** - Use `get_recommendation_insights()` for improving recommendations
6. **Cleanup Job** - Set up CRON to call `cleanup_expired_recommendations()` daily
7. **Premium Checks** - Add premium checks for context recommendations

## 🎨 UI/UX Blueprint

### Daily Recommendations UI
- "Your Day, Optimized by AI"
- Stacked cards:
  - Nutrition Tip
  - Workout Tip
  - Wellness Tip
  - Sleep Insight
  - Habit Suggestion
  - Recovery Prompt
  - Grocery Suggestion
- Each card has:
  - Icon
  - Short title
  - Description
  - "Do It" button
  - Dismiss button

### Context Recommendations
- Appear as notifications or inline suggestions
- Triggered by user actions
- Quick actions (e.g., "Take a walk now")

## 🔄 Integration Pattern

### Daily CRON Job (Midnight):
```sql
SELECT generate_daily_recommendations(user_id) 
FROM auth.users 
WHERE onboarding_completed = true;
```

### When User Logs Activity:
```sql
SELECT generate_context_recommendation(
    user_id, 
    'mood_low', 
    '{"mood_value": 2}'::jsonb
);
```

### Frontend Get Recommendations:
```typescript
const { data: recommendations } = await supabase
  .rpc('get_user_recommendations', {
    p_user_id: user.id,
    p_category_filter: null,
    p_limit_count: 10
  });
```

### Mark as Done:
```typescript
await supabase.rpc('mark_recommendation_status', {
  p_user_id: user.id,
  p_recommendation_id: recommendation.id,
  p_status: 'completed'
});
```

This module creates the **AI Recommendation Engine** that makes Bluöm feel smart and personalized! 🧠✨

---

## 📋 Module X - Meals & Macro Planner

This migration creates the **Meals & Macro Planner** that turns onboarding + goals + food logs + preferences into daily and weekly meal plans. This is the "nutrition brain" of Bluöm, connecting all nutrition modules to generate true personalized nutrition.

## 🚀 How to Apply

### Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project: `pthmddtyxdragzbtjeuu`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run Module X Migration

1. Open `supabase/migrations/018_module_x_meals_macro_planner.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify

After running, you should see:
- ✅ Tables created: `user_nutrition_settings`, `meal_plans`, `meal_plan_items`, `meal_plan_swaps`, `meal_plan_preferences`
- ✅ RPC functions created: 12 functions (generate daily, generate weekly, get, add meal, swap, update settings, get settings, update preferences, get preferences, generate grocery, get macros, delete item)
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance

## 📊 What This Module Creates

### New Tables

- **`user_nutrition_settings`** - Stores user nutrition targets and preferences (diet type, allergies, targets)
- **`meal_plans`** - Daily & Weekly meal plans (metadata with macros)
- **`meal_plan_items`** - Each individual meal (breakfast/lunch/snack/dinner) with recipe/food references
- **`meal_plan_swaps`** - Tracks when user swaps meals for personalization
- **`meal_plan_preferences`** - Adaptive Learning - tracks what user likes/dislikes

### Features

- **Daily Meal Plan** - Auto-built, macro-balanced, 3-5 meals/day
- **Weekly Meal Plan** - 7-day macro-balanced calendar (premium only)
- **Smart Swap System** - Swap by macro, ingredient, or preference (premium only)
- **Auto-Generated Grocery List** - Based on weekly plan, connects to Module F
- **Adaptive Learning** - Tracks user preferences and learns from swaps
- **Nutrition Settings** - Stores diet type, allergies, preferences, targets

### RPC Functions

#### Core Functions
- `generate_daily_meal_plan(user_id, date)` - Generates a daily meal plan
- `generate_weekly_meal_plan(user_id, start_date)` - Generates a weekly meal plan (premium only)
- `get_meal_plan(user_id, date, type)` - Gets meal plan for a user
- `add_meal_to_plan(plan_id, meal_slot, recipe_id, food_id, user_food_id, quantity, macros, order_index)` - Adds a meal item to a plan
- `create_meal_swap(user_id, plan_item_id, old_item, new_item, reason)` - Tracks what user replaces (smart swaps premium only)
- `update_nutrition_settings(user_id, updates)` - Updates user nutrition settings
- `get_nutrition_settings(user_id)` - Gets user nutrition settings
- `update_meal_preferences(user_id, updates)` - Updates meal plan preferences (adaptive learning)
- `get_meal_preferences(user_id)` - Gets meal plan preferences
- `generate_grocery_list_from_plan(user_id, plan_id)` - Auto-generates grocery list from meal plan (connects to Module F)
- `get_plan_macros(plan_id)` - Calculates total macros for a meal plan
- `delete_meal_plan_item(item_id)` - Deletes a meal from plan

## 🧠 Intelligence Layer

### How It Works

1. **Pull Onboarding Data** - Goal, weight, age, height, lifestyle, diet type, restrictions
2. **Compute Daily Calories & Macros** - Uses user_nutrition_settings or user_goals
3. **Build Meals Using:** Recipe database, ingredient database, macro balance, personal preferences, previous swaps, AI engine
4. **Weekly Plan** - Generated by looping 7× daily builder, ensures no repeat meals 2× in a row
5. **Auto-Grocery List** - Weekly plan → ingredients → deduplicated → checked against pantry → inserted into shopping_list_items
6. **AI Monitoring** - AI engine adjusts calories, protein peak days, carb cycling, meal timing

## 🎯 Premium Gating

| Feature                         | Free     | Premium                    |
| ------------------------------- | -------- | -------------------------- |
| Daily meal plan                 | ✔️ basic | ✔️ AI personalised         |
| Weekly meal plan                | ❌        | ✔️                         |
| Smart swaps                     | ❌        | ✔️ unlimited               |
| Grocery generator               | ✔️ basic | ✔️ advanced (pantry-aware) |
| Diet presets                    | ✔️       | ✔️                         |
| Goal adaptation                 | ❌        | ✔️                         |
| AI adaptive macro cycles       | ❌        | ✔️                         |
| Advanced recipe recommendations | ❌        | ✔️                         |

## 🔗 Cross-Module Integrations

### Connected to:

- **Module A** (User System) - Uses user_goals for targets, onboarding data
- **Module B** (Nutrition) - Uses foods, user_foods, recipes, meal_logs
- **Module F** (Shopping List) - Generates grocery lists, checks pantry (requires is_checked column)
- **Module L** (Recipe Engine) - Uses recipes, ingredients, recipe_steps
- **Module S** (Subscriptions) - Checks is_premium for gating
- **Module W** (AI Recommendations) - Gets AI meal suggestions

## 🎨 UI/UX Blueprint

### Tabbed Planner UI

**Tabs:**
- Today
- Weekly
- Grocery
- Preferences

### When User Taps a Meal

**Options:**
- View recipe
- Track meal
- Swap meal
- Add to favorites
- Add ingredients to shopping list

### Swipe → Smart Swap Options

- High-protein swap
- Low-calorie swap
- Budget swap
- 5-min recipe swap
- Same ingredients swap

### Weekly Plan Page

- Calendar grid
- Tap any day → expand
- Regenerate day
- Regenerate week (premium only)

## ⚠️ Important Notes

- **Does NOT Duplicate** - Module X does not duplicate Food DB, Meal Logs, Recipe Engine, or AI Recommendation Engine
- **Connects All Modules** - Instead, it connects them all to generate true personalized nutrition
- **Depends on Module F** - Requires Module F to be applied (uses is_checked column in shopping_list_items)
- **Depends on Module S** - Checks is_premium for gating
- **API Layer Required** - Actual meal generation logic will be in API layer (Cursor)
- **RLS Enabled** - All tables have Row Level Security policies

## 🔄 Next Steps

After Module X is applied:
1. **API Integration** - Build meal generation logic in API layer (uses AI/ML)
2. **Frontend Integration** - Build planner UI (tabs, calendar, swap interface)
3. **Smart Swap Logic** - Implement swap algorithms (high-protein, low-calorie, etc.)
4. **Weekly Plan Generation** - Build 7-day plan generator with no-repeat logic
5. **Grocery Integration** - Connect to Module F shopping lists
6. **Preference Learning** - Update preferences based on user swaps and interactions
7. **AI Integration** - Connect to Module W for AI meal suggestions

## 🔄 Integration Pattern

### Generate Daily Plan:
```typescript
const { data: planId } = await supabase.rpc('generate_daily_meal_plan', {
  p_user: user.id,
  p_date: '2024-01-15'
});
```

### Get Meal Plan:
```typescript
const { data: plan } = await supabase.rpc('get_meal_plan', {
  p_user: user.id,
  p_date: '2024-01-15',
  p_type: 'daily'
});
```

### Create Swap:
```typescript
await supabase.rpc('create_meal_swap', {
  p_user: user.id,
  p_plan_item_id: item.id,
  p_old_item: oldItem,
  p_new_item: newItem,
  p_reason: 'high_protein'
});
```

### Generate Grocery List:
```typescript
const { data: result } = await supabase.rpc('generate_grocery_list_from_plan', {
  p_user: user.id,
  p_plan_id: plan.id
});
```

This module creates the **Meals & Macro Planner** that connects all nutrition modules to generate true personalized nutrition! 🍽️✨

---

## 📋 Module Y - Workout Auto-Progression Engine

This migration creates the **Workout Auto-Progression Engine** that makes workouts behave like a real coach — progressive overload, auto-adjustments, deload weeks, missed-workout recovery, movement substitutions, rep prescriptions, and predictive 1RM formulas. This is what Fitbod, Strong, Freeletics, and AthleticAI are built on.

## 🚀 How to Apply

### Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project: `pthmddtyxdragzbtjeuu`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run Module Y Migration

1. Open `supabase/migrations/019_module_y_workout_auto_progression.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify

After running, you should see:
- ✅ Tables created: `workout_progressions`, `scheduled_progressions`, `missed_workout_log`, `deload_cycles`, `exercise_substitutions`
- ✅ RPC functions created: 10 functions (compute 1RM, update progression, get next progression, log missed workout, trigger deload, get progressions, suggest substitutions, check deload needed, get history)
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance

## 📊 What This Module Creates

### New Tables

- **`workout_progressions`** - Tracks latest performance per exercise (weight, reps, RPE, RIR, 1RM)
- **`scheduled_progressions`** - Stores auto-generated next workout weights and reps
- **`missed_workout_log`** - Tracks missed workouts for recovery logic (premium)
- **`deload_cycles`** - Tracks deload weeks (premium)
- **`exercise_substitutions`** - Stores intelligent movement substitutions (premium)

### Features

- **Auto-Progression of Exercises** - +2.5kg, +5kg, or +1 rep depending on performance
- **Weight Prediction** - Uses Epley or Brzycki formula for 1RM calculations
- **Missed Workout Recovery** - Regression algorithm for missed sessions (premium)
- **Deload Logic** - Every 4-8 weeks, auto-reduce volume and intensity (premium)
- **Intelligent Substitutions** - Suggest similar movements if equipment unavailable (premium)
- **Personalized Difficulty Scaling** - Beginner/intermediate/advanced progression rates
- **RPE/RIR Based Adjustments** - Rate of Perceived Exertion and Reps in Reserve logic

### RPC Functions

#### Core Functions
- `compute_one_rep_max(weight, reps)` - Uses Epley formula (Fitbod standard)
- `compute_one_rep_max_brzycki(weight, reps)` - Alternative formula (Brzycki)
- `update_progression(user_id, exercise_id, weight, reps, rpe, rir, volume, sets)` - Recalculates 1RM and next workout
- `get_next_exercise_progression(user_id, exercise_id)` - Gets next workout progression
- `log_missed_workout(user_id, date, reason, scheduled_workout_id)` - Logs missed workout (premium)
- `trigger_deload_week(user_id, triggered_by, volume_reduction, intensity_reduction)` - Triggers deload (premium)
- `get_user_progressions(user_id, exercise_id_filter)` - Gets all progressions
- `suggest_exercise_substitution(user_id, exercise_id, reason)` - Suggests substitutions (premium)
- `check_deload_needed(user_id)` - Checks if deload needed (premium)
- `get_progression_history(user_id, exercise_id, days)` - Gets progression history

## 🧠 Intelligence Layer

### How It Works

1. **First Workout** - User chooses weight → Module Y sets baseline
2. **Next Session** - Auto progression based on RPE/RIR:
   - RPE ≤ 6 or RIR ≥ 3: Increase weight 5%
   - RPE 7-8 or RIR 1-2: Increase weight 2.5%
   - RPE ≥ 9 or RIR = 0: Maintain weight, add reps
3. **Cycle Detection** - If user consistently hits top of rep range → auto-increase
4. **Missed Day Logic** (Premium):
   - 3+ days missed: -5% weight, keep same reps
   - 7+ days missed: -10% weight, reduce reps by 2
5. **Deload Week** (Premium):
   - Every 6 hard weeks OR user logs fatigue OR HRV low
   - Auto-reduce volume 40-50%, intensity 10-20%
6. **Substitution Logic** (Premium) - Same movement, muscle group, difficulty

## 🎯 Premium Gating

| Feature                     | Free     | Premium                   |
| --------------------------- | -------- | ------------------------- |
| Auto progression            | ✔️ basic | ✔️ advanced logic         |
| Missed-day handling         | ❌        | ✔️                        |
| Deload weeks                | ❌        | ✔️                        |
| Movement substitutions      | ❌        | ✔️                        |
| 1RM predictions             | ✔️       | ✔️ advanced multi-formula |
| Auto-generated weekly split | ❌        | ✔️                        |
| Workout fatigue analysis    | ❌        | ✔️ (uses mood/sleep)      |

## 🔗 Cross-Module Integrations

### Connected to:

- **Module D** (Fitness Engine) - Uses exercises, workout_logs, set_logs
- **Module M** (Workout Builder) - Uses workouts, workout_exercises, set_logs
- **Module R** (Dashboard Intelligence) - Uses daily_summaries for fatigue analysis
- **Module C** (Wellness) - Uses moods for fatigue detection
- **Module S** (Subscriptions) - Checks is_premium for gating

## 🎨 UI/UX Blueprint

### Exercise Card Shows:
- Current weight
- Suggested next weight
- RPE selector (1-10)
- RIR selector (0-5)
- Rep range display
- Auto notes ("Today is a deload day")

### Workout Completion UX:
- "Great job!"
- Slider for difficulty (RPE/RIR)
- Auto-adjusts next session
- Shows progression type

### In Workout Builder:
- Auto-fill progressions
- "Recommended progression" badge
- Substitution suggestions

## ⚠️ Important Notes

- **Connects to Modules D & M** - Uses exercises, workout_logs, set_logs from existing modules
- **Depends on Module S** - Checks is_premium for gating
- **Uses Module C & R** - Can use moods and daily_summaries for fatigue detection
- **RLS Enabled** - All tables have Row Level Security policies

## 🔄 Next Steps

After Module Y is applied:
1. **API Integration** - Build progression logic in API layer
2. **Frontend Integration** - Build progression UI (exercise cards, RPE/RIR selectors, deload indicators)
3. **Substitution Algorithm** - Implement similarity scoring for exercise substitutions
4. **Deload Automation** - Set up CRON to check for deload needs weekly
5. **Progression Analytics** - Build charts showing progression over time
6. **Premium Checks** - Add premium checks for advanced features

## 🔄 Integration Pattern

### Update Progression After Workout:
```typescript
const { data: result } = await supabase.rpc('update_progression', {
  p_user: user.id,
  p_exercise: exercise.id,
  p_weight: 100,
  p_reps: 8,
  p_rpe: 7,
  p_rir: 2,
  p_volume: 2400,
  p_sets: 3
});
```

### Get Next Workout Weight:
```typescript
const { data: next } = await supabase.rpc('get_next_exercise_progression', {
  p_user: user.id,
  p_exercise: exercise.id
});
```

### Check Deload Needed:
```typescript
const { data: deload } = await supabase.rpc('check_deload_needed', {
  p_user: user.id
});
```

### Trigger Deload:
```typescript
const { data: deloadId } = await supabase.rpc('trigger_deload_week', {
  p_user: user.id,
  p_triggered_by: 'auto',
  p_volume_reduction: 50,
  p_intensity_reduction: 20
});
```

This module creates the **Workout Auto-Progression Engine** that makes workouts behave like a real coach! 💪✨

---

## 📋 Module Z - Sleep + Recovery AI

This migration creates the **Sleep + Recovery AI** system that turns Bluöm into a WHOOP-level sleep intelligence system — without hardware — and integrates with Wellness, Workouts, Habits, and the AI Recommendation Engine. This is one of the most valuable premium features in any fitness/wellness app.

## 🚀 How to Apply

### Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project: `pthmddtyxdragzbtjeuu`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run Module Z Migration

1. Open `supabase/migrations/020_module_z_sleep_recovery_ai.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify

After running, you should see:
- ✅ Enhanced `sleep_logs` table (new columns added, data migrated)
- ✅ Tables created: `recovery_logs`, `sleep_insights`, `sleep_recommendations`
- ✅ RPC functions created: 10 functions (calculate sleep score, log sleep, compute recovery, calculate daily recovery, generate insights, get insights, create recommendations, get recommendations, get recovery history, get sleep summary)
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance

## 📊 What This Module Creates

### Enhanced Tables

- **`sleep_logs`** (Enhanced from Module C) - Added: date, bedtime, wake_time, duration_minutes, sleep_latency_minutes, wake_after_sleep_onset, interruptions, sleep_quality_score, notes, updated_at

### New Tables

- **`recovery_logs`** - Tracks holistic recovery (sleep, workout, stress, hydration, mood, nutrition)
- **`sleep_insights`** - AI generated insights, correlations, warnings (premium)
- **`sleep_recommendations`** - Smart bedtime reminders, supplement suggestions, routines (premium)

### Features

- **Enhanced Sleep Logging** - Manual input, smart detection, notes (caffeine, stress, late meal, workouts)
- **Sleep Quality Score** - Computed from time asleep, consistency, latency, WASO, interruptions (0-100)
- **Recovery Score** - Holistic recovery influenced by sleep, workout intensity, mood, stress, habits, nutrition, hydration
- **AI Insights** - Pattern detection, correlations, warnings, coaching (premium)
- **Sleep Recommendations** - Smart bedtime reminders, supplement suggestions, routines (premium)

### RPC Functions

#### Core Functions
- `calculate_sleep_score(duration, latency, waso, interruptions)` - Calculates sleep quality score (0-100)
- `log_sleep_session(user_id, date, bedtime, wake_time, latency, waso, interruptions, notes)` - Logs sleep and calculates score
- `compute_recovery_score(sleep_score, workout_intensity, stress_level, hydration_score, mood_score, nutrition_score)` - Computes holistic recovery (0-100)
- `calculate_daily_recovery(user_id, date)` - Calculates and stores daily recovery score
- `generate_sleep_insight(user_id)` - Generates AI sleep insights (premium)
- `get_sleep_insights(user_id, days, type_filter)` - Gets sleep insights
- `create_sleep_recommendation(user_id, recommendation, recommended_time, category, priority, is_premium, action_url)` - Creates recommendation
- `get_sleep_recommendations(user_id, category_filter)` - Gets recommendations
- `get_recovery_history(user_id, days)` - Gets recovery history
- `get_sleep_summary(user_id, days)` - Gets sleep summary statistics

## 🧠 Intelligence Layer

### How It Works

1. **After User Logs Sleep → AI Computes:**
   - Sleep score (0-100)
   - Quality patterns
   - Recovery score
   - AI insights (premium)
   - Personalized recommendations (premium)

2. **Detects Poor Patterns:**
   - Late sleep
   - Too many interruptions
   - Poor mood + bad sleep correlation
   - High stress before bed
   - Heavy training before bedtime

3. **Cross-Module Correlation:**
   - From Wellness: Mood, stress, journaling
   - From Fuel: Caffeine, late meals, low hydration
   - From Move: Workout intensity, timing of training

4. **Recovery Score Affects Workouts:**
   - Integration with Module Y:
     - Low sleep → decrease weights, increase rest
     - High sleep → increase progression
     - Sleep debt → suggest deload
     - Overtraining + sleep = red alert

5. **Premium-Only Actions:**
   - "Smart Bedtime Window"
   - "Your perfect wake-up time"
   - "Daily Sleep Coaching"
   - "Deep Insight Reports"
   - "Personalized wind-down routine"
   - "Stimulant intake warnings"

## 🎯 Premium Gating

| Feature                    | Free | Premium |
| -------------------------- | ---- | ------- |
| Manual sleep logging       | ✔️   | ✔️      |
| Basic sleep score          | ✔️   | ✔️      |
| Recovery score             | ✔️   | ✔️      |
| AI insights                | ❌    | ✔️      |
| Sleep coaching             | ❌    | ✔️      |
| Morning energy predictions | ❌    | ✔️      |
| Habit & sleep correlations | ❌    | ✔️      |
| Bedtime recommendations    | ❌    | ✔️      |
| Stress–sleep analysis      | ❌    | ✔️      |

## 🔗 Cross-Module Integrations

### Connected to:

- **Module C** (Wellness) - Enhances sleep_logs, uses moods for stress/mood analysis
- **Module R** (Dashboard Intelligence) - Uses daily_summaries for hydration/nutrition
- **Module M** (Workout Builder) - Uses workout_logs for workout intensity
- **Module Y** (Auto-Progression) - Recovery score affects workout progression
- **Module W** (AI Recommendations) - Can trigger sleep recommendations
- **Module S** (Subscriptions) - Checks is_premium for gating

## 🎨 UI/UX Blueprint

### Dashboard Card
- Sleep hours (bar)
- Sleep score (circle gauge)
- Recovery score
- AI tip

### Logging Modal
- Bedtime selector
- Wake-time selector
- Notes: caffeine, stress, late workout

### Sleep Trends Page
- Weekly chart
- Insights
- Recovery timeline

### Premium Cards
- "Unlock Sleep Coaching"
- "Unlock Advanced Recovery"

## ⚠️ Important Notes

- **Enhances Module C** - Adds columns to existing sleep_logs table, migrates existing data
- **Depends on Module S** - Checks is_premium for gating
- **Uses Multiple Modules** - Pulls data from C, R, M for recovery calculation
- **RLS Enabled** - All tables have Row Level Security policies

## 🔄 Next Steps

After Module Z is applied:
1. **API Integration** - Build sleep logging UI and recovery calculation automation
2. **Frontend Integration** - Build sleep dashboard, trends page, logging modal
3. **AI Insight Generation** - Enhance insight generation with more sophisticated patterns
4. **Recovery Automation** - Set up CRON to calculate daily recovery scores
5. **Workout Integration** - Connect recovery scores to Module Y progression
6. **Premium Checks** - Add premium checks for AI insights and recommendations

## 🔄 Integration Pattern

### Log Sleep Session:
```typescript
const { data: sleepId } = await supabase.rpc('log_sleep_session', {
  p_user: user.id,
  p_date: '2024-01-15',
  p_bedtime: '2024-01-15T22:00:00Z',
  p_wake_time: '2024-01-16T06:30:00Z',
  p_latency: 15,
  p_waso: 20,
  p_interruptions: 1,
  p_notes: 'Had coffee at 2pm'
});
```

### Calculate Daily Recovery:
```typescript
const { data: recovery } = await supabase.rpc('calculate_daily_recovery', {
  p_user: user.id,
  p_date: '2024-01-15'
});
```

### Get Sleep Insights:
```typescript
const { data: insights } = await supabase.rpc('get_sleep_insights', {
  p_user: user.id,
  p_days: 30,
  p_type_filter: 'warning'
});
```

### Get Recovery History:
```typescript
const { data: history } = await supabase.rpc('get_recovery_history', {
  p_user: user.id,
  p_days: 30
});
```

This module creates the **Sleep + Recovery AI** system that turns Bluöm into a comprehensive sleep and recovery intelligence system! 😴✨

---

## 📋 Module U - Wearables Engine

This migration creates the **Wearables Engine** that turns Bluöm into a real fitness OS, pulling real biometrics, steps, heart rate, sleep, calories, HRV, workouts, and more from Apple Health, Google Fit, and smartwatches. This is one of the highest-value premium features in any fitness/wellness app.

## 🚀 How to Apply

### Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project: `pthmddtyxdragzbtjeuu`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query`

### Step 2: Run Module U Migration

1. Open `supabase/migrations/021_module_u_wearables_engine.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify

After running, you should see:
- ✅ Tables created: `wearable_connections`, `wearable_sync_logs`, `wearable_steps`, `wearable_heart_data`, `wearable_sleep_data`, `wearable_workouts`, `wearable_weight`
- ✅ RPC functions created: 12 functions (connect, disconnect, log sync, save steps, save heart, save sleep, save workout, save weight, get connections, get sync status, get summary, merge steps)
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance

## 📊 What This Module Creates

### New Tables

- **`wearable_connections`** - Tracks wearable provider connections and tokens (Google only)
- **`wearable_sync_logs`** - Store every sync event (for debug + analytics)
- **`wearable_steps`** - Steps data from wearables (can merge with steps_tracking from Module D)
- **`wearable_heart_data`** - Heart rate and HRV data from wearables
- **`wearable_sleep_data`** - Sleep data from wearables (can enhance sleep_logs from Module C/Z)
- **`wearable_workouts`** - Workout data from wearables (can merge with workout_logs from Module M)
- **`wearable_weight`** - Weight data from wearables/scales

### Features

- **Apple Health Integration** (iOS) - Steps, heart rate, HRV, sleep, active energy, workouts, weight, mindfulness minutes
- **Google Fit Integration** (Android) - Steps, move minutes, heart rate, sleep, calories, workouts, weight
- **Smartwatch Support** (Future) - Fitbit, Garmin, Whoop, Oura (Phase 2)
- **Auto-Sync** - Background syncing every 15 minutes, hourly, or daily
- **Data Merging** - Wearable data merges with existing steps_tracking, sleep_logs, workout_logs
- **Sync Logging** - Full audit trail of all sync events

### RPC Functions

#### Core Functions
- `connect_wearable(user_id, provider, access_token, refresh_token, expires_at, permissions)` - Connects a wearable provider (premium)
- `disconnect_wearable(user_id, provider)` - Disconnects a wearable provider
- `log_sync_event(user_id, provider, data_type, status, synced_records, error_message, sync_duration_ms, metadata)` - Logs a sync event
- `save_wearable_steps(user_id, date, steps, source)` - Saves steps from wearable (premium, merges with steps_tracking)
- `save_wearable_heart_data(user_id, timestamp, bpm, hrv_ms, stress_level, source)` - Saves heart rate and HRV data (premium)
- `save_wearable_sleep(user_id, date, bedtime, wake_time, duration_minutes, sleep_stages, source)` - Saves sleep data (premium, enhances sleep_logs)
- `save_wearable_workout(user_id, start_time, end_time, type, calories, distance_km, avg_heart_rate, max_heart_rate, elevation_gain, pace_per_km, source, external_id)` - Saves workout (premium, creates workout_log)
- `save_wearable_weight(user_id, timestamp, weight_kg, body_fat_percentage, muscle_mass_kg, source)` - Saves weight data (premium)
- `get_wearable_connections(user_id)` - Gets all wearable connections
- `get_wearable_sync_status(user_id, provider)` - Gets sync status and recent logs
- `get_wearable_data_summary(user_id, days)` - Gets summary of wearable data
- `merge_wearable_steps_to_main(user_id, date)` - Merges wearable steps into main steps_tracking table

## 🧠 Backend Logic

### What Needs to be Implemented in API/Edge Functions

#### Google Fit
- OAuth flow
- Refresh tokens
- Pull: steps, HR, HRV, sleep, workouts, calories

#### Apple Health (iOS)
- Handled **inside the Expo app** via:
  - `expo-health` (Apple HealthKit)
  - `expo-fitness` (steps, HR, sleep)
- No backend tokens needed — data is fetched directly on device and posted to Supabase using the RPCs above

## 📱 Frontend (Expo + Web)

### Connect Wearables Screen

**For iOS (Apple Health):**
```
[Connect Apple Health]  
Permission toggles:  
- Steps  
- Sleep  
- Heart rate  
- HRV  
- Workouts  
```

**For Android (Google Fit):**
```
[Connect Google Fit]
→ Opens OAuth flow
```

### Sync Settings
- Sync every 15 minutes
- Or manual sync
- Show last sync timestamp
- Show data types synced

### Dashboard Integration
- **Sleep card**: Pull from wearable_sleep_data, override manual sleep
- **Steps card**: Auto updates from wearable_steps
- **Workout card**: Shows wearable-workouts + custom workouts
- **Recovery**: Uses HR, HRV, Sleep, Steps, Workout intensity

## 🎯 Premium Gating

| Feature                        | Free | Premium |
| ------------------------------ | ---- | ------- |
| Manual steps                   | ✔️   | ✔️      |
| Manual sleep                   | ✔️   | ✔️      |
| Manual workouts                | ✔️   | ✔️      |
| Wearable steps sync            | ❌    | ✔️      |
| Wearable heart rate            | ❌    | ✔️      |
| Wearable sleep                 | ❌    | ✔️      |
| Workout auto-import            | ❌    | ✔️      |
| HRV-based recovery             | ❌    | ✔️      |
| Auto-sleep detection           | ❌    | ✔️      |
| Sleep staging (when available) | ❌    | ✔️      |

## 🔗 Cross-Module Integrations

### Connected to:

- **Module D** (Fitness Engine) - Merges steps into steps_tracking
- **Module M** (Workout Builder) - Creates workout_log entries from wearable workouts
- **Module C** (Wellness) - Enhances sleep_logs with wearable sleep data
- **Module Z** (Sleep + Recovery AI) - Uses wearable HR/HRV for recovery scoring
- **Module S** (Subscriptions) - Checks is_premium for gating

## 🎨 UI/UX Blueprint

### Connect Wearables Screen
- Provider selection (Apple Health, Google Fit)
- Permission toggles
- Connection status
- Last sync timestamp

### Sync Settings
- Sync frequency selector
- Manual sync button
- Sync history
- Error logs

### Dashboard Integration
- Auto-update from wearables
- Override manual entries
- Show data source badges

## ⚠️ Important Notes

- **Premium Only** - All wearable sync features require premium subscription
- **Data Merging** - Wearable data merges with existing tables (steps_tracking, sleep_logs, workout_logs)
- **Apple Health** - No backend tokens needed, handled in Expo app
- **Google Fit** - Requires OAuth flow and token refresh in backend
- **RLS Enabled** - All tables have Row Level Security policies

## 🔄 Next Steps

After Module U is applied:
1. **API Integration** - Build Google Fit OAuth flow and token refresh
2. **Frontend Integration** - Build connect wearables screen, sync settings, dashboard integration
3. **Expo Integration** - Implement Apple HealthKit and Google Fit SDKs
4. **Sync Automation** - Set up background sync jobs (every 15 min, hourly, daily)
5. **Data Merging** - Implement smart merging logic (wearable vs manual priority)
6. **Premium Checks** - Add premium checks for all wearable features

## 🔄 Integration Pattern

### Connect Wearable:
```typescript
const { data: connectionId } = await supabase.rpc('connect_wearable', {
  p_user: user.id,
  p_provider: 'google',
  p_access_token: accessToken,
  p_refresh_token: refreshToken,
  p_expires_at: expiresAt,
  p_permissions: {steps: true, heart_rate: true, sleep: true}
});
```

### Save Steps:
```typescript
await supabase.rpc('save_wearable_steps', {
  p_user: user.id,
  p_date: '2024-01-15',
  p_steps: 8500,
  p_source: 'apple'
});
```

### Save Heart Data:
```typescript
await supabase.rpc('save_wearable_heart_data', {
  p_user: user.id,
  p_timestamp: '2024-01-15T12:00:00Z',
  p_bpm: 72,
  p_hrv_ms: 45,
  p_source: 'apple'
});
```

### Get Sync Status:
```typescript
const { data: status } = await supabase.rpc('get_wearable_sync_status', {
  p_user: user.id,
  p_provider: 'apple'
});
```

## ⚠️ Performance Notes

- **Runtime impact**: Low — all syncing is scheduled/background-triggered
- **Database size**: Moderate — but purge rules can be added if needed
- **No slowdown** to the app

This module creates the **Wearables Engine** that turns Bluöm into a real fitness OS with wearable integration! ⌚✨

