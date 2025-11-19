# ✅ MODULE J — PERSONALIZATION ENGINE — COMPLETE

## 📋 Summary

Module J implements the **complete Personalization Engine** that transforms onboarding answers into personalized nutrition, workout, and wellness plans.

---

## 🗄️ Database Schema

### Tables Created

1. **`personalized_macros`**
   - Stores calculated macros (calories, protein, carbs, fat, water target)
   - One row per user (UNIQUE constraint)

2. **`personalized_workout_plan`**
   - Stores AI-generated workout plan as JSONB
   - Includes progression level, days per week, experience level

3. **`personalized_wellness_plan`**
   - Stores sleep goals, meditation minutes, stress reduction methods, habit recommendations

4. **`personalized_recommendations`**
   - Stores daily/weekly AI recommendations
   - Can have multiple rows per user (history)

---

## 🔧 RPC Functions

### Calculation Functions

1. **`calculate_bmr(weight_kg, height_cm, age, gender)`**
   - Mifflin-St Jeor formula
   - Returns BMR in calories

2. **`calculate_tdee(bmr, activity_level)`**
   - Multiplies BMR by activity multiplier
   - Returns TDEE in calories

3. **`adjust_calories_for_goal(tdee, goal)`**
   - Lose: -20%
   - Maintain: 0%
   - Gain: +15%

4. **`calculate_macros(calories, weight_kg, goal, diet_preference)`**
   - Calculates protein, carbs, fat based on goal and diet preference
   - Returns JSONB with macros

### Plan Generation Functions

5. **`generate_workout_plan_json(experience, days_per_week, preference, injuries)`**
   - Generates workout plan based on experience and availability
   - Returns structured JSONB with days, exercises, progression

6. **`generate_wellness_plan_json(sleep_quality, stress_level, meditation_experience)`**
   - Generates wellness routines based on user needs
   - Returns JSONB with sleep goals, meditation, stress reduction, habits

7. **`generate_initial_recommendations(user_id, calories, macros, workout_plan, wellness_plan)`**
   - Creates initial recommendations for user
   - Returns JSONB array of recommendations

### Main Functions

8. **`build_personalization_plan(user_id, onboarding_answers)`**
   - **Main function** that orchestrates the entire personalization process
   - Calls all calculation and generation functions
   - Saves results to all tables
   - Returns complete personalization plan

9. **`get_user_personalization(user_id)`**
   - Retrieves all personalization data for a user
   - Returns combined JSONB with macros, workout, wellness, recommendations

---

## 🔌 API Routes

### `/api/onboarding/answers` (POST)
- Saves onboarding answers
- Updates user profile
- Triggers personalization build
- Returns onboarding data + personalization plan

### `/api/onboarding/recommendation` (GET)
- Gets personalized recommendations
- Returns macros, workout plan, wellness plan, recommendations

### `/api/personalized-plan` (GET)
- Gets user's complete personalization plan
- Returns all personalization data

### `/api/personalized-plan/regenerate` (POST)
- Regenerates personalization plan (premium/trial only)
- Uses latest onboarding answers

### `/api/personalized-plan/build` (POST)
- Manually triggers personalization build
- Takes onboarding_answers in body

---

## 🔐 Authentication

All routes require:
- `Authorization: Bearer <supabase_token>` header
- Supabase session validation
- RLS policies enforce user data isolation

---

## 📊 Personalization Flow

1. **User completes onboarding** (30 questions)
2. **POST `/api/onboarding/answers`** is called
3. **Onboarding answers saved** to `onboarding_answers` table
4. **User profile updated** with basic info
5. **`build_personalization_plan` RPC called** automatically
6. **Personalization calculated:**
   - BMR → TDEE → Goal-adjusted calories
   - Macros calculated (protein, carbs, fat)
   - Workout plan generated
   - Wellness plan generated
   - Recommendations created
7. **All data saved** to personalization tables
8. **Response returned** with complete plan

---

## 🎯 Integration Points

### Frontend Onboarding Form
- Should call `POST /api/onboarding/answers` on completion
- Receives personalization plan in response
- Can redirect to home dashboard with personalized data

### Home Dashboard
- Calls `GET /api/personalized-plan` to load user's plan
- Displays macros, workout plan, wellness goals

### AI Coach (Module K)
- Reads personalization data for context
- Uses macros, workout plan, wellness goals in responses

### Meal Planner (Module X)
- Uses `personalized_macros` for meal planning
- Generates meals based on calorie and macro targets

### Workout Builder (Module M)
- Uses `personalized_workout_plan` for workout suggestions
- Respects experience level and days per week

---

## ✅ Status

- ✅ Supabase migration created (`022_module_j_personalization_engine.sql`)
- ✅ RPC functions implemented
- ✅ API routes created
- ✅ Authentication middleware
- ✅ Premium/trial checking
- ✅ RLS policies enabled
- ✅ Integration with Module A (onboarding_answers)
- ✅ Integration with Module S (subscriptions)

---

## 📝 Next Steps

1. **Apply migration** to Supabase:
   ```sql
   -- Run in Supabase SQL Editor
   -- File: supabase/migrations/022_module_j_personalization_engine.sql
   ```

2. **Update frontend onboarding form** to call:
   ```typescript
   POST /api/onboarding/answers
   Body: { answers: { ...all 30 answers } }
   ```

3. **Update home dashboard** to load personalization:
   ```typescript
   GET /api/personalized-plan
   ```

4. **Test end-to-end flow:**
   - Complete onboarding
   - Verify personalization tables populated
   - Check home dashboard shows personalized data

---

## 🔗 Dependencies

- **Module A**: Uses `users` and `onboarding_answers` tables
- **Module S**: Uses `user_subscriptions` for premium checks
- **Module X**: Will use `personalized_macros` for meal planning
- **Module M**: Will use `personalized_workout_plan` for workouts
- **Module K**: Will use personalization data for AI context

---

**Last Updated**: After Module J implementation
**Status**: ✅ Complete and ready for integration

