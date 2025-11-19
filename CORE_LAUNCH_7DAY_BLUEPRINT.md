# 🅓 7-DAY LAUNCH BLUEPRINT

## Step-by-Step Guide to Finish Your App in 7 Days

**Focus:** Only the 5 core modules (Auth, Data Engine, Personalization, Dashboard, Notifications)

---

## 📅 **DAY 1 — CONNECT SUPABASE + AUTH**

### Morning (2-3 hours)
1. **Set up Supabase project**
   - Create project at supabase.com
   - Get `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - Add to `.env` file

2. **Apply core schema**
   - Run `038_core_launch_schema.sql` in Supabase SQL Editor
   - Verify tables created (check Supabase dashboard)

3. **Set up Supabase client**
   - Install `@supabase/supabase-js` in frontend
   - Create `src/lib/supabase.ts`:
   ```ts
   import { createClient } from '@supabase/supabase-js';
   export const supabase = createClient(
     process.env.EXPO_PUBLIC_SUPABASE_URL!,
     process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
   );
   ```

### Afternoon (2-3 hours)
4. **Build auth screens**
   - `/auth/login` - Email/password form
   - `/auth/register` - Sign up form
   - `/auth/forgot` - Password reset
   - Use Supabase auth: `supabase.auth.signUp()`, `supabase.auth.signInWithPassword()`

5. **Test auth flow**
   - Create test account
   - Login/logout works
   - Redirect to home after login

### Evening (1 hour)
6. **Create user profile on signup**
   - Trigger profile creation in Supabase (already in schema)
   - Verify profile table populated

**✅ Day 1 Goal:** Users can sign up, log in, and have a profile created.

---

## 📅 **DAY 2 — FUEL SYSTEM**

### Morning (3 hours)
1. **Food search API**
   - Create `GET /api/foods/search` endpoint
   - Integrate FatSecret API (or use local food database)
   - Test search returns results

2. **Food search UI**
   - Create `/fuel/food/search` screen
   - Search bar + results list
   - Display name, brand, macros

### Afternoon (3 hours)
3. **Meal logging**
   - Create `POST /api/meals/add` endpoint
   - Create `/fuel/log` screen
   - Meal type selector (breakfast/lunch/dinner/snack)
   - Food search integration
   - Quantity input
   - Save meal

4. **Meal display**
   - Create `/fuel` main screen
   - Show today's meals grouped by type
   - Display daily totals (calories, protein, carbs, fats)

### Evening (1 hour)
5. **Water logging**
   - Create `POST /api/water/add` endpoint
   - Add water button on `/fuel` screen
   - Display water progress (ml / goal)

**✅ Day 2 Goal:** Users can search foods, log meals, and see daily nutrition totals.

---

## 📅 **DAY 3 — MOVE SYSTEM**

### Morning (2 hours)
1. **Exercise database**
   - Seed `exercise_db` table with 50-100 common exercises
   - Create `GET /api/exercises` endpoint
   - Test returns exercises

2. **Exercise list UI**
   - Create exercise browser (optional)
   - Or just use in workout logging

### Afternoon (3 hours)
3. **Workout logging**
   - Create `POST /api/workouts/log` endpoint
   - Create `/move/workouts/log` screen
   - Exercise selector
   - Sets input (weight, reps, rest)
   - Add set button
   - Complete workout button

4. **Workout display**
   - Create `/move` main screen
   - Show today's workouts
   - Display workout history

### Evening (2 hours)
5. **Steps tracking**
   - Create `POST /api/steps/log` endpoint
   - Add steps input on `/move` screen
   - Display steps progress (steps / goal)

**✅ Day 3 Goal:** Users can log workouts and steps, see workout history.

---

## 📅 **DAY 4 — WELLNESS SYSTEM**

### Morning (2 hours)
1. **Sleep logging**
   - Create `POST /api/sleep/log` endpoint
   - Create `/wellness/sleep` screen
   - Hours input (slider or number)
   - Quality selector (1-5)
   - Save button

2. **Sleep display**
   - Show last night's sleep on `/wellness` screen
   - Display sleep hours and quality

### Afternoon (2 hours)
3. **Mood logging**
   - Create `POST /api/mood/log` endpoint
   - Create `/wellness/mood` screen
   - Mood selector (1-5 emoji)
   - Note input (optional)
   - Save button

4. **Mood display**
   - Show today's mood on `/wellness` screen
   - Display mood trend (last 7 days)

### Evening (2 hours)
5. **Habits system**
   - Create `POST /api/habits/create` endpoint
   - Create `POST /api/habits/log` endpoint
   - Create `/wellness/habits` screen
   - Habits list with checkboxes
   - "Add habit" button
   - Daily completion tracking

**✅ Day 4 Goal:** Users can log sleep, mood, and habits, see wellness data.

---

## 📅 **DAY 5 — PERSONALIZATION**

### Morning (3 hours)
1. **Onboarding flow**
   - Create `/onboarding` screen
   - 30 questions (multi-step form)
   - Progress indicator
   - Save answers to `onboarding_answers` table

2. **Onboarding API**
   - Create `POST /api/onboarding/submit` endpoint
   - Store answers in database

### Afternoon (3 hours)
3. **Plan generation**
   - Create plan generation logic (or use AI)
   - Calculate BMR/TDEE from onboarding answers
   - Generate daily calories and macros
   - Generate meal suggestions
   - Generate workout plan (frequency, split, exercises)
   - Save to `generated_meal_plan` and `generated_workout_plan` tables

4. **Plan display**
   - Create `/api/personalized/mealplan` endpoint
   - Create `/api/personalized/workoutplan` endpoint
   - Display plan on home screen or dedicated plan screen

### Evening (1 hour)
5. **Test personalization**
   - Complete onboarding
   - Verify plans generated
   - Check plan display

**✅ Day 5 Goal:** Users complete onboarding and receive personalized meal/workout plans.

---

## 📅 **DAY 6 — DASHBOARD**

### Morning (3 hours)
1. **Daily snapshot function**
   - Verify `update_daily_snapshot()` RPC works
   - Call it after each log (meal, workout, sleep, etc.)
   - Or call it on dashboard load

2. **Dashboard API**
   - Create `GET /api/dashboard/today` endpoint
   - Aggregate today's data:
     - Calories eaten / remaining
     - Protein/carbs/fats eaten
     - Water ml
     - Steps
     - Sleep hours
     - Mood
     - Habits completed
     - Workouts completed

3. **Streaks calculation**
   - Calculate streaks (nutrition, workout, habits)
   - Add to dashboard response

### Afternoon (3 hours)
4. **Dashboard UI**
   - Create `/home` dashboard screen
   - Daily calories remaining (ring/progress bar)
   - Steps today (ring/progress bar)
   - Water today (ring/progress bar)
   - Sleep last night (hours + quality)
   - Mood today (emoji + number)
   - Quick add buttons (Log meal, Log workout, Log water, Log mood)
   - Streaks display
   - Small insights ("Your protein is low today", "You slept 1h less than usual")

5. **Insights logic**
   - Simple rule-based insights:
     - If protein < target: "Your protein is Xg below target"
     - If sleep < goal: "You slept Xh less than your goal"
     - If steps < goal: "You're X steps away from your goal"

### Evening (1 hour)
6. **Test dashboard**
   - Log various data
   - Verify dashboard updates
   - Check insights appear

**✅ Day 6 Goal:** Users see unified dashboard with all daily data, streaks, and insights.

---

## 📅 **DAY 7 — NOTIFICATIONS**

### Morning (2 hours)
1. **Notification preferences**
   - Create `PUT /api/notifications/preferences` endpoint
   - Create `/profile/notifications` screen
   - Enable/disable toggle
   - Quiet hours (start/end time)
   - Max daily notifications

2. **Push token registration**
   - Create `POST /api/notifications/registerPush` endpoint
   - Register Expo push token on app start
   - Store in `user_devices` table (if exists) or notification_preferences

### Afternoon (3 hours)
3. **Notification scheduling**
   - Create notification scheduler (cron job or Supabase Edge Function)
   - Schedule notifications based on:
     - Water reminders (every 2-3 hours during active hours)
     - Meal reminders (breakfast 8:30, lunch 12:30, dinner 19:00)
     - Sleep reminder (21:00)
     - Habit reminders (evening)
   - Use `can_send_notification()` RPC to check limits

4. **Notification sending**
   - Use Expo Push Notification API
   - Send scheduled notifications
   - Log to `notification_log` table
   - Respect quiet hours and daily limits

### Evening (2 hours)
5. **Test notifications**
   - Register push token
   - Set preferences
   - Trigger test notification
   - Verify delivery
   - Check quiet hours work
   - Check daily limit works

**✅ Day 7 Goal:** Users receive smart, time-aware notifications without spam.

---

## 🎯 **LAUNCH CHECKLIST**

### Before Launch:
- [ ] All 5 core modules working
- [ ] Auth flow tested
- [ ] Data logging works (meals, workouts, sleep, mood, habits)
- [ ] Personalization generates plans
- [ ] Dashboard displays all data
- [ ] Notifications send correctly
- [ ] No critical bugs
- [ ] Basic error handling
- [ ] Loading states on all screens

### Optional (Post-Launch):
- [ ] Stripe subscription integration
- [ ] Premium feature gating
- [ ] More exercises in database
- [ ] Recipe builder
- [ ] Workout routines
- [ ] Advanced analytics
- [ ] Social features
- [ ] Wearables integration

---

## 📊 **SUCCESS METRICS**

After 7 days, your app should:
- ✅ Users can sign up and log in
- ✅ Users can log meals, workouts, sleep, mood, habits
- ✅ Users receive personalized plans
- ✅ Users see unified dashboard
- ✅ Users receive smart notifications

**This is enough to launch and get real users.**

---

## 🚀 **NEXT STEPS AFTER LAUNCH**

1. **Week 1:** Fix bugs, improve UX based on user feedback
2. **Week 2:** Add Stripe subscriptions, premium features
3. **Week 3:** Add more exercises, recipes, workout routines
4. **Week 4:** Add analytics, insights, trends
5. **Month 2:** Add optional features (wearables, social, etc.)

---

**✅ 7-DAY BLUEPRINT COMPLETE**

Focus on these 5 modules only. Everything else can wait.

