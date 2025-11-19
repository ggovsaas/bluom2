# ✅ BACKEND API ROUTING MAP

**This is EXACTLY what Cursor + Bolt need to scaffold the entire backend cleanly.**

Everything is grouped by module and built for:
* **Supabase**
* **FatSecret**
* **USDA**
* **Google Vision**
* **AI (OpenAI/GPT)**
* **Expo + Web**

This is the master API routing plan.

---

# 🧩 GLOBAL BACKEND STRUCTURE

```
/api
  auth/
  user/
  onboarding/
  nutrition/
  workouts/
  wellness/
  ai/
  marketplace/
  recommendations/
  subscriptions/
  analytics/
  notifications/
  wearables/
  shopping/
  search/
```

All endpoints return:
```json
{
  "success": boolean,
  "data"?: any,
  "error"?: string
}
```

---

# 🔥 1. AUTH MODULE

### `POST /api/auth/register`
- Creates user in Supabase Auth
- Initializes user profile (Module A)
- Creates subscription entry (Module S)

### `POST /api/auth/login`
- Authenticates with Supabase Auth
- Returns session token

### `POST /api/auth/logout`
- Clears session

### `POST /api/auth/social`
- Apple Sign In
- Google Sign In
- Creates/links account

### `GET /api/auth/session`
- Returns Supabase session user
- Checks authentication status

---

# 👤 2. USER MODULE

### `GET /api/user/profile`
- Gets user profile from `users` table (Module A)
- Returns: name, gender, birthday, height, weight, goal, etc.

### `PUT /api/user/profile`
- Updates user profile
- Updates `users` table

### `PUT /api/user/preferences`
- Updates `user_preferences` table (Module A)
- Settings: notifications, units, dark mode, etc.

### `PUT /api/user/timezone`
- Updates user timezone
- Used for date calculations across all modules

---

# 🧭 3. ONBOARDING (30-question personalization)

### `POST /api/onboarding/answers`
- Save answers → table: `onboarding_answers` (Module A)
- Body: `{ question_id, answer }`

### `GET /api/onboarding/recommendation`
- Returns:
  * Recommended macros (calories, protein, carbs, fats)
  * Recommended workout plan
  * Recommended wellness journey
- Uses `generate_user_goals` RPC (Module A)

---

# 🍽 4. NUTRITION MODULE

### Food Search
`GET /api/nutrition/search?query=…`
- Searches: FatSecret + USDA + user_foods
- Returns: Combined results from all sources
- Uses: `FATSECRET_API_KEY`, `USDA_API_KEY`

### Food Details
`GET /api/nutrition/food/:id`
- Gets food details from `foods` or `user_foods` (Module B)
- Returns: Full nutrition breakdown

### Add Custom Food
`POST /api/nutrition/custom-food`
- Creates entry in `user_foods` table (Module B)
- Body: `{ name, brand, serving_size, calories, protein, carbs, fat, ... }`

### Meal Logging
`POST /api/nutrition/log-meal`
- Logs meal to `meal_logs` table (Module B)
- Body: `{ meal_type, food_id, user_food_id, recipe_id, quantity, logged_at }`
- Updates `daily_summaries` (Module R)

`POST /api/nutrition/remove-meal-item`
- Deletes meal log entry
- Updates daily summaries

`GET /api/nutrition/daily-log?date=…`
- Returns all meals & totals for date
- Uses `meal_logs` table (Module B)
- Calculates macros from `foods`, `user_foods`, `recipes`

### Recipes
`POST /api/nutrition/recipes`
- Creates recipe in `recipes` table (Module B/L)
- Body: `{ name, description, ingredients, steps, ... }`
- Uses `createRecipe` RPC (Module L)

`GET /api/nutrition/recipes`
- Gets user's recipes
- Returns: List of recipes with nutrition totals

`GET /api/nutrition/recipes/:id`
- Gets recipe details with ingredients and steps
- Uses `recipes`, `recipe_ingredients`, `recipe_steps` (Module L)

`PUT /api/nutrition/recipes/:id`
- Updates recipe

### Barcode Scan
`POST /api/nutrition/barcode`
- Body: `{ barcode: "1234567890" }`
- Uses USDA or FatSecret API
- Saves to `barcode_scans` table (Module B)
- Returns: Food match or null

### Image Scan (Vision API)
`POST /api/nutrition/image-detect`
- Body: `{ image: base64 or file }`
- Uses `GOOGLE_VISION_API_KEY`
- OCR food label → extracts nutrition info
- Returns: Predicted food + macros
- Can auto-create `user_foods` entry

---

# 🏋️‍♂️ 5. WORKOUT MODULE

### Exercise Database
`GET /api/workouts/exercises`
- Gets exercise library from `exercises` table (Module D/M)
- Filters: category, muscle_group, equipment, difficulty

`GET /api/workouts/exercises/:id`
- Gets exercise details
- Returns: name, instructions, video, muscle groups, equipment

### Workout CRUD
`POST /api/workouts`
- Creates workout in `workouts` table (Module M)
- Body: `{ name, description, goal, exercises: [...] }`
- Uses `createWorkout` RPC (Module M)

`GET /api/workouts`
- Gets user's workouts
- Returns: List of workouts

`GET /api/workouts/:id`
- Gets workout details with exercises
- Uses `workouts`, `workout_exercises` (Module M)

`PUT /api/workouts/:id`
- Updates workout

### Workout Logging
`POST /api/workouts/log`
- Logs workout to `workout_logs` table (Module M)
- Body: `{ workout_id, duration_minutes, calories_burned, sets: [...] }`
- Uses `logWorkout` RPC (Module M)
- Triggers `update_progression` (Module Y)

`GET /api/workouts/daily-log?date=…`
- Returns workouts for date
- Includes sets and progression data

### Auto-Progression (Module Y)
`POST /api/workouts/auto-plan`
- Gets next workout weights/reps
- Uses `get_next_exercise_progression` RPC (Module Y)
- Returns: Suggested weights for each exercise

---

# 😴 6. WELLNESS MODULE

### Mood
`POST /api/wellness/mood`
- Logs mood to `moods` table (Module C)
- Body: `{ mood_value: 1-5, note }`
- Uses `log_mood` RPC (Module C)
- Updates `daily_summaries` (Module R)

`GET /api/wellness/mood?range=week`
- Gets mood history
- Returns: Array of mood entries

### Sleep
`POST /api/wellness/sleep`
- Logs sleep to `sleep_logs` table (Module C/Z)
- Body: `{ bedtime, wake_time, latency, waso, interruptions, notes }`
- Uses `log_sleep_session` RPC (Module Z)
- Calculates sleep score automatically
- Updates `daily_summaries` (Module R)

`GET /api/wellness/sleep?range=week`
- Gets sleep history
- Returns: Array of sleep logs with scores

### Habits
`POST /api/wellness/habits`
- Creates habit in `habits` table (Module C)
- Body: `{ title, category }`

`POST /api/wellness/habits/toggle`
- Toggles habit completion
- Uses `toggle_habit` RPC (Module C)
- Updates `habit_logs` table

`GET /api/wellness/habits`
- Gets user's habits with completion status
- Returns: Habits with today's completion status

### Meditations
`POST /api/wellness/meditation/log`
- Logs meditation session
- Uses `meditation_logs` table (Module O)
- Body: `{ session_id, duration_minutes }`

`GET /api/wellness/meditation/stats`
- Gets meditation statistics
- Returns: Total time, streak, sessions count

### Games
`POST /api/wellness/games/log`
- Logs mind game session
- Uses `mind_game_sessions` table (Module O)
- Body: `{ game_id, score, metrics }`

`GET /api/wellness/games/stats`
- Gets game statistics
- Returns: Best scores, reaction times, accuracy

### Journal
`POST /api/wellness/journal`
- Creates journal entry
- Uses `journals` table (Module C)
- Body: `{ content }`

`GET /api/wellness/journal`
- Gets journal entries
- Returns: List of journal entries

### Gratitude
`POST /api/wellness/gratitude`
- Creates gratitude entry
- Uses `gratitude_entries` table (Module C)
- Body: `{ entry }`

`GET /api/wellness/gratitude`
- Gets gratitude entries
- Returns: List of gratitude entries

---

# 🛒 7. SHOPPING LIST ENGINE (Module F)

### `POST /api/shopping/list`
- Creates shopping list
- Uses `create_shopping_list` RPC (Module F)
- Body: `{ name }`

### `GET /api/shopping/list`
- Gets user's shopping lists
- Returns: Lists with items

### `POST /api/shopping/item`
- Adds item to shopping list
- Uses `add_shopping_item` RPC (Module F)
- Body: `{ list_id, item_name, quantity, category }`

### `POST /api/shopping/item/toggle`
- Toggles item checked status
- Uses `toggle_item_check` RPC (Module F)
- Body: `{ item_id }`

### `POST /api/shopping/sort`
- Auto-sorts shopping list
- Uses `autosort_list` RPC (Module F)
- Body: `{ list_id }`

### `GET /api/shopping/pantry`
- Gets pantry items
- Returns: List from `pantry_items` table (Module F)

### `POST /api/shopping/pantry`
- Adds/updates pantry item
- Body: `{ item_name, quantity, category, expires_on }`

### `POST /api/shopping/favorites`
- Adds favorite item
- Uses `favorite_items` table (Module F)

### `POST /api/shopping/suggestions`
- Gets AI shopping suggestions
- Uses `suggest_missing_items` RPC (Module F)
- Returns: Suggested items based on meal plans, recipes, habits

---

# 🛍 8. MARKETPLACE (Shopify + WooCommerce)

### Shopify
`GET /api/marketplace/shopify/products`
- Fetches from: `https://yourstore.myshopify.com/collections/fitness.json`
- Returns: Product list
- No DB required — uses remote API

`GET /api/marketplace/shopify/collections`
- Gets product collections

### WooCommerce
`GET /api/marketplace/wp/products`
- Fetches from: `/wp-json/wc/v3/products`
- Returns: Product list
- No DB required — uses remote API

---

# 🤖 9. AI MODULE (GPT + Internal Models)

### Insights
`GET /api/ai/insights`
- Returns:
  * Mood correlations
  * Sleep → workouts patterns
  * Eating patterns
  * Hydration insights
- Uses `get_sleep_insights` RPC (Module Z)
- Uses `get_recommendation_insights` RPC (Module W)
- Uses `analytics_weekly_summary` (Module E)

### AI Coach
`POST /api/ai/coach`
- Body: `{ message: "user question" }`
- Provides: advice, guidance, explanation, motivation
- Uses `ai_messages` table (Module K)
- Uses `buildCoachContext` logic (Module K)
- Returns: AI response

### AI Recipes
`POST /api/ai/recipe-builder`
- Body: `{ goal: "high protein breakfast", calories: 400, ... }`
- Generates recipe using GPT
- Saves to `ai_generated_meals` table (Module L)
- Returns: Recipe with ingredients and steps

### AI Meal Plan
`POST /api/ai/meal-plan`
- Body: `{ date, type: "daily" | "weekly" }`
- Generates meal plan
- Uses `generate_daily_meal_plan` or `generate_weekly_meal_plan` RPC (Module X)
- Returns: Meal plan with items

### AI Workout Plan
`POST /api/ai/workout-plan`
- Body: `{ goal, equipment, duration, difficulty }`
- Generates workout using GPT
- Saves to `workouts` table (Module M)
- Returns: Workout with exercises

### AI Greeting
`GET /api/ai/greeting`
- Returns personalized greeting
- Uses user context from `ai_coach_context` (Module K)
- Returns: Personalized message

---

# ⭐ 10. RECOMMENDATION ENGINE (Module W)

### `GET /api/recommendations/daily`
- Returns daily recommendations
- Food + workout + wellness + water + habits
- Uses `get_user_recommendations` RPC (Module W)
- Returns: Array of recommendations

### `GET /api/recommendations/weekly`
- Returns weekly recommendations
- Macro split + workouts + recovery
- Uses `get_user_recommendations` RPC with weekly filter

---

# 💳 11. SUBSCRIPTIONS MODULE (Stripe → Supabase)

### `POST /api/subscriptions/create-checkout`
- Creates Stripe Checkout session
- Body: `{ price_id, success_url, cancel_url }`
- Returns: Checkout URL

### `POST /api/subscriptions/portal`
- Creates Stripe Customer Portal session
- Returns: Portal URL

### `GET /api/subscriptions/status`
- Gets subscription status
- Uses `get_user_entitlement` RPC (Module S)
- Returns: `{ status, is_premium, trial_end, current_period_end }`
- Handles: free, monthly, annual

---

# 🔔 12. NOTIFICATION ENGINE (Module H)

### Quiet hours (default 21:00)
- Enforced in `should_notify_now` RPC (Module H)

### `POST /api/notifications/push`
- Sends push notification
- Body: `{ title, body, type, user_id }`
- Uses `user_devices` table (Module H)
- Respects quiet hours

### `POST /api/notifications/schedule`
- Schedules notification
- Body: `{ title, body, schedule_time, repeat_interval }`
- Uses `scheduled_notifications` table (Module H)

### `GET /api/notifications/preferences`
- Gets notification settings
- Uses `notification_settings` table (Module H)

### `PUT /api/notifications/preferences`
- Updates notification settings
- Body: `{ hydration, meals, steps, workouts, sleep, mindfulness, marketing, do_not_disturb_start, do_not_disturb_end }`

---

# 📊 13. ANALYTICS ENGINE (Module Q)

### `GET /api/analytics/daily`
- Gets daily analytics
- Uses `daily_analytics` table (Module Q)
- Returns: All metrics for date

### `GET /api/analytics/weekly`
- Gets weekly analytics
- Uses `analytics_weekly_summary` view (Module Q)
- Returns: Weekly aggregates

### `GET /api/analytics/monthly`
- Gets monthly analytics
- Uses `analytics_monthly_summary` view (Module Q)
- Returns: Monthly aggregates

Includes:
* Meals
* Steps
* Workouts
* Mood
* Sleep
* Hydration
* Habits

Combines **Module A + R + Q + Z** to predict:
* Trends
* Plateaus
* Burnout risk
* Recovery needs

---

# ⌚ 14. WEARABLES MODULE (Module U)

### `POST /api/wearables/apple-health/import`
- Imports data from Apple Health
- Body: `{ steps: [...], heart_rate: [...], sleep: [...], workouts: [...] }`
- Uses `save_wearable_steps`, `save_wearable_heart_data`, `save_wearable_sleep`, `save_wearable_workout` RPCs (Module U)
- No backend tokens needed (handled in Expo app)

### `POST /api/wearables/google-fit/import`
- Imports data from Google Fit
- Body: `{ steps: [...], heart_rate: [...], sleep: [...], workouts: [...] }`
- Uses same RPCs as Apple Health
- Requires OAuth tokens (stored in `wearable_connections`)

Sync:
* Steps
* Calories
* Distance
* Heart rate
* Sleep
* Mindfulness time

---

# 🧠 15. SEARCH ENGINE (app-wide)

### `GET /api/search?query=…`
Searches across:
* Foods (`foods`, `user_foods`)
* Exercises (`exercises`)
* Recipes (`recipes`)
* Journal (`journals`)
* Gratitude (`gratitude_entries`)
* Shopping (`shopping_list_items`)
* Workouts (`workouts`)

Returns: Unified search results with type and relevance score

---

# 🔥 YOU ARE NOW READY TO:

✔ Import into Cursor
✔ Bolt creates all handlers
✔ Supabase auto-wires the DB
✔ Expo app hits these endpoints directly

---

# 🔗 Supabase RPC Integration

## Direct RPC Calls (Frontend → Supabase)

Many endpoints can call Supabase RPC functions directly from the frontend:

### Nutrition
- `get_meal_plan(user_id, date, type)` - Module X
- `generate_grocery_list_from_plan(user_id, plan_id)` - Module X
- `create_meal_swap(user_id, plan_item_id, old_item, new_item, reason)` - Module X

### Workouts
- `update_progression(user_id, exercise_id, weight, reps, rpe, rir, volume, sets)` - Module Y
- `get_next_exercise_progression(user_id, exercise_id)` - Module Y
- `check_deload_needed(user_id)` - Module Y
- `trigger_deload_week(user_id, triggered_by, volume_reduction, intensity_reduction)` - Module Y

### Wellness
- `log_sleep_session(user_id, date, bedtime, wake_time, latency, waso, interruptions, notes)` - Module Z
- `calculate_daily_recovery(user_id, date)` - Module Z
- `generate_sleep_insight(user_id)` - Module Z

### AI
- `generate_daily_recommendations(user_id)` - Module W
- `generate_context_recommendation(user_id, trigger_type, payload)` - Module W
- `get_user_recommendations(user_id, category_filter, limit_count)` - Module W

### Analytics
- `upsert_daily_analytics(user_id, date, ...)` - Module Q
- `log_event(user_id, event_type, value, meta)` - Module Q

---

# 🔐 Authentication

All endpoints (except `/api/auth/*`) require:
- Supabase session token in header: `Authorization: Bearer <token>`
- RLS policies enforce user data isolation

---

# 📝 Error Handling

All endpoints should handle:
- 401 Unauthorized (no session)
- 403 Forbidden (premium required)
- 400 Bad Request (invalid input)
- 500 Server Error (database/API failure)

Error response format:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

# 🎯 Premium Gating

Endpoints that require premium should check:
```typescript
const { data: entitlement } = await supabase.rpc('get_user_entitlement', {
  p_user_id: user.id
});

if (!entitlement.is_premium) {
  return { success: false, error: 'Premium required' };
}
```

---

**Last Updated**: After Module U completion
**Status**: ✅ Backend API routing blueprint ready for implementation

