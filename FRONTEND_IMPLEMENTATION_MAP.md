# ✅ FRONTEND IMPLEMENTATION MAP (Expo + Web + Supabase)

**This is the architecture your app *must* follow.**

---

# 📁 1. PROJECT STRUCTURE (Expo Router)

```
src/
  app/
    (auth)/
      login.tsx
      register.tsx
      forgot.tsx
    (onboarding)/
      index.tsx
      q1.tsx
      q2.tsx
      ...
      summary.tsx
    (tabs)/
      _layout.tsx
      home.tsx
      fuel.tsx
      move.tsx
      wellness.tsx
      profile.tsx
    wellness/
      mood.tsx
      sleep.tsx
      habits.tsx
      meditation.tsx
      games/
        index.tsx
        reaction.tsx
        breathing.tsx
        memory.tsx
      journal.tsx
      gratitude.tsx
    fuel/
      food-database.tsx
      food-details.tsx
      add-food.tsx
      recipes/
        index.tsx
        recipe-details.tsx
        create-recipe.tsx
      grocery-list.tsx
      pantry.tsx
    move/
      workouts/
        index.tsx
        workout-details.tsx
        auto-plan.tsx
        create-workout.tsx
      exercises/
        index.tsx
        exercise-details.tsx
      steps.tsx
    profile/
      settings.tsx
      preferences.tsx
      subscriptions.tsx
      sync-wearables.tsx
      notifications.tsx
  components/
    ui/
      Button.tsx
      Card.tsx
      Input.tsx
      Switch.tsx
      Slider.tsx
      Badge.tsx
      TabBar.tsx
    widgets/
      RingProgress.tsx
      BarChart.tsx
      LineChart.tsx
      CardStat.tsx
    modals/
      MoodModal.tsx
      SleepModal.tsx
      HabitModal.tsx
      JournalModal.tsx
      GratitudeModal.tsx
      MeditationModal.tsx
      GamesModal.tsx
  hooks/
    useUser.ts
    useHydration.ts
    useMealLog.ts
    useWorkoutLog.ts
    useMeditation.ts
    useShoppingList.ts
    useAI.ts
  lib/
    supabase.ts
    api/
      fatsecret.ts
      usda.ts
      googleVision.ts
      ai.ts
  store/
    userStore.ts
    mealStore.ts
    workoutStore.ts
    wellnessStore.ts
    shoppingStore.ts
  utils/
    dates.ts
    format.ts
    enums.ts
    validators.ts
```

---

# 📌 2. NAVIGATION MAP (Expo Router Structure)

### Tab Navigator (`src/app/(tabs)/_layout.tsx`)

Tabs:
1. **home**
2. **fuel**
3. **move**
4. **wellness**
5. **profile**

Each tab loads a screen + widgets + metrics.

---

# 📌 3. HOME DASHBOARD (Uses Module R Intelligence Layer)

Displays:
* Daily calories (EAT)
* Protein/Carbs/Fats macros
* Steps + workout minutes
* Sleep summary
* Mood summary
* Hydration ring
* Habit streaks
* XP/Rewards bar (Module P)
* AI Insights (Module W)
* "Continue your plan" CTA (Module J personalization)

---

# 📌 4. FUEL MODULE — SCREENS

### `/fuel`
* Today's meals
* AI meal suggestions
* Macros ring
* Water tracker
* Grocery quick-add

### `/fuel/food-database`
* Search API (FatSecret + USDA + userFoods)

### `/fuel/add-food`
* Manual create food form
  → Saves to `user_foods`

### `/fuel/recipes`
* List of recipes (user + recommended)

### `/fuel/grocery-list`
* Connects to **Module F shopping engine**
* Auto-sorted list
* Pantry integration

---

# 📌 5. MOVE MODULE — SCREENS

### `/move`
* Today steps
* Workout summary
* Streaks
* AI workout suggestion (Module W)

### `/move/workouts`
* All workouts
* Auto-plan (Module Y)

### `/move/exercises`
* Exercise database (videos)

---

# 📌 6. WELLNESS MODULE — SCREENS

### `/wellness`
Contains:
* Mood widget
* Sleep widget
* Habit widget
* Meditation CTA
* Games CTA
* Journal & Gratitude shortcuts
* Wellness insights (Module Z + W)

### `/wellness/meditation`
* Timer
* Guided sessions
* Nature sound mixer
* Breathing visualizer

### `/wellness/games`
* Reaction
* Focus
* Memory
* Breathing game
* "Coming soon" slots

### `/wellness/journal`
* Text journal
* Notebook CTA (Shopify/WP)

### `/wellness/gratitude`
* Daily gratitude entry

---

# 📌 7. PROFILE MODULE — SCREENS

### `/profile/settings`
* Units
* Preferences
* Timezone auto-detection

### `/profile/subscriptions`
* Supabase Stripe checkout
* Handles:
  * free
  * monthly
  * annual

### `/profile/sync-wearables`
* Apple Health/Google Fit sync (Module U)

### `/profile/notifications`
* Push toggle
* Quiet hours (default 21:00)

---

# 📌 8. FRONTEND → BACKEND INTERACTION MAP

### Nutrition
* FatSecret API → search foods
* USDA API → barcode & nutrient data
* Google Vision → "scan food"
* Supabase → save logs, recipes, grocery

### Fitness
* Exercise library (local JSON)
* Workout CRUD in Supabase
* Auto-progress (Module Y)

### Wellness
* Mood/sleep/habits → Supabase logs
* Meditation minutes → Supabase
* Games → results saved for AI

### Shopify/WP Integration

Two options:

#### Shopify
```
https://yourstore.myshopify.com/collections/fitness.json
```

#### WooCommerce
Use:
```
/wp-json/wc/v3/products
```

---

# 📌 9. SHARED UTILITIES

### Timezones
Uses:
```
Intl.DateTimeFormat().resolvedOptions().timeZone
```

### Quiet hours logic
No push after 21:00
(or user-customizable)

---

# 📌 10. WHAT THIS MAP ENABLES

✔ Cursor can scaffold
✔ Bolt can create API routes
✔ Supabase migration team can fill in schema
✔ Expo can build both **mobile + web**
✔ All remaining modules plug in cleanly

---

# 🔗 Supabase Integration Points

## Home Dashboard (`/home`)
- Uses `daily_summaries` (Module R)
- Uses `insights` (Module R)
- Uses `user_progress` (Module P) for XP/Levels
- Uses `ai_recommendations` (Module W) for AI tips
- Uses `daily_analytics` (Module Q) for quick stats

## Fuel Module (`/fuel`)
- Uses `foods`, `user_foods` (Module B)
- Uses `meal_logs` (Module B)
- Uses `recipes` (Module L)
- Uses `shopping_lists`, `shopping_list_items` (Module F)
- Uses `meal_plans` (Module X)
- Calls FatSecret API, USDA API, Google Vision API

## Move Module (`/move`)
- Uses `exercises` (Module D)
- Uses `workouts`, `workout_logs` (Module M)
- Uses `steps_tracking` (Module D)
- Uses `workout_progressions` (Module Y)
- Uses `scheduled_progressions` (Module Y)

## Wellness Module (`/wellness`)
- Uses `moods` (Module C)
- Uses `sleep_logs` (Module C/Z)
- Uses `habits`, `habit_logs` (Module C)
- Uses `meditation_sessions`, `meditation_logs` (Module O)
- Uses `mind_games`, `mind_game_sessions` (Module O)
- Uses `journals`, `gratitude_entries` (Module C)
- Uses `recovery_logs` (Module Z)

## Profile Module (`/profile`)
- Uses `users`, `user_goals` (Module A)
- Uses `user_subscriptions` (Module S)
- Uses `wearable_connections` (Module U)
- Uses `notification_settings` (Module H)

---

# 🎯 API Integration Points

## External APIs

### FatSecret API
- **Endpoint**: `https://platform.fatsecret.com/rest/server.api`
- **Use**: Search branded foods, get nutrition data
- **Keys**: `FATSECRET_API_KEY`, `FATSECRET_API_SECRET`
- **Integration**: `lib/api/fatsecret.ts`

### USDA API
- **Endpoint**: `https://api.nal.usda.gov/fdc/v1/`
- **Use**: Search whole foods, barcode lookup
- **Key**: `USDA_API_KEY`
- **Integration**: `lib/api/usda.ts`

### Google Vision API
- **Endpoint**: `https://vision.googleapis.com/v1/images:annotate`
- **Use**: OCR food labels, extract nutrition info
- **Key**: `GOOGLE_VISION_API_KEY`
- **Integration**: `lib/api/googleVision.ts`

---

# 📱 Mobile-Specific (Expo)

## Apple Health (iOS)
- **Package**: `expo-health` or `expo-fitness`
- **Integration**: Direct device access, no backend tokens
- **Data Flow**: Device → Expo App → Supabase RPCs

## Google Fit (Android)
- **Package**: `@react-native-google-fit/google-fit`
- **Integration**: OAuth flow → Backend tokens → Supabase RPCs

---

# 🌐 Web-Specific

## Browser APIs
- **LocalStorage**: Session persistence
- **Service Workers**: Background sync (future)
- **Web Push**: Notifications (Module H)

---

# 🔄 State Management

## Stores (Zustand/Redux)

### `userStore.ts`
- Current user
- Subscription status
- Preferences
- Goals

### `mealStore.ts`
- Today's meals
- Selected food
- Macros totals

### `workoutStore.ts`
- Current workout
- Exercise library
- Progression data

### `wellnessStore.ts`
- Today's mood
- Sleep data
- Habit status
- Meditation state

### `shoppingStore.ts`
- Active shopping list
- Pantry items
- Favorites

---

# 🎨 Component Library

## UI Components
- **Button**: Primary, secondary, outline variants
- **Card**: Stat cards, info cards, action cards
- **Input**: Text, number, date, time pickers
- **Switch**: Toggle switches
- **Slider**: RPE/RIR sliders, progress bars
- **Badge**: XP badges, level badges, achievement badges
- **TabBar**: Bottom navigation

## Widgets
- **RingProgress**: Circular progress (calories, macros, hydration)
- **BarChart**: Daily/weekly charts
- **LineChart**: Trend lines
- **CardStat**: Quick stat cards

## Modals
- **MoodModal**: Mood picker (1-5)
- **SleepModal**: Sleep logger
- **HabitModal**: Habit completion
- **JournalModal**: Journal entry
- **GratitudeModal**: Gratitude entry
- **MeditationModal**: Meditation timer
- **GamesModal**: Game launcher

---

# 🪝 Custom Hooks

## `useUser.ts`
- Get current user
- Check premium status
- Update profile

## `useHydration.ts`
- Get daily water intake
- Log water
- Get hydration goal

## `useMealLog.ts`
- Get today's meals
- Log meal
- Delete meal
- Get macros

## `useWorkoutLog.ts`
- Get workouts
- Log workout
- Get progression
- Get next workout weights

## `useMeditation.ts`
- Get meditation catalog
- Start session
- Log session
- Get streaks

## `useShoppingList.ts`
- Get shopping lists
- Add item
- Toggle check
- Auto-sort

## `useAI.ts`
- Get recommendations
- Generate insights
- Chat with AI coach
- Get meal suggestions

---

# 📝 Notes

- All screens use Supabase RPC functions where possible
- External APIs (FatSecret, USDA, Vision) are called from backend/API routes
- State management handles optimistic updates
- All data respects RLS policies
- Premium features are gated at component level

---

**Last Updated**: After Module U completion
**Status**: ✅ Frontend architecture blueprint ready for implementation

