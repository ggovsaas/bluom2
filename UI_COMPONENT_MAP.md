# 🟦 H — FULL UI COMPONENT MAP (Expo + Web)

🏗 *Your complete frontend architecture*

This document tells Cursor:
- Which screens exist
- Which components exist
- Which modals exist
- How they connect
- What props they need
- What API calls they use
- What personalization affects
- What's visible for free vs premium

---

# 🔵 TOP-LEVEL NAVIGATION (5 Tabs)

### 1) **Home**
- Route: `/home`
- Component: `HomeScreen.tsx`

### 2) **Fuel** (Nutrition)
- Route: `/fuel`
- Component: `FuelScreen.tsx`

### 3) **Move** (Fitness)
- Route: `/move`
- Component: `MoveScreen.tsx`

### 4) **Wellness**
- Route: `/wellness`
- Component: `WellnessScreen.tsx`

### 5) **Profile**
- Route: `/profile`
- Component: `ProfileScreen.tsx`

---

# 🔵 SHARED GLOBAL COMPONENTS

```
/src/components/
    Header.tsx
    BottomTabs.tsx
    StatCard.tsx
    CircularStat.tsx
    ProgressBar.tsx
    SectionHeader.tsx
    ModalWrapper.tsx
    PrimaryButton.tsx
    SecondaryButton.tsx
    IconButton.tsx
    PremiumLock.tsx        (for locked premium content)
    AiCoachBubble.tsx
    EmptyState.tsx
```

---

# 🔵 MODALS (Global Modals)

```
/src/modals/
    AddFoodModal.tsx
    FoodDetailsModal.tsx
    CreateRecipeModal.tsx
    EditMealModal.tsx
    AddExerciseModal.tsx
    SleepInputModal.tsx
    MoodInputModal.tsx
    HabitEditorModal.tsx
    MeditationPlayerModal.tsx
    GratitudeModal.tsx
    JournalModal.tsx
    WaterQuickAddModal.tsx
    ShoppingListAddItemModal.tsx
    GameHubModal.tsx
    SingleGameModal.tsx
    UpgradeToPremiumModal.tsx
```

---

# 🔵 HOME TAB

### `/home`

**HomeScreen.tsx**

Widgets (personalized):
- Today's calories (from `personalized_macros`)
- Water intake (from `water_logs`)
- Steps (wearables or manual)
- Mood widget
- Sleep widget
- Quick add buttons:
  - Meal
  - Water
  - Mood
  - Sleep
- AI Coach banner
- Weekly summary graph
  - Component: `WeeklyOverviewGraph.tsx`

**API Calls:**
- `GET /api/personalized-plan` - Get macros and targets
- `GET /api/analytics/daily` - Get today's stats
- `GET /api/wellness/mood?range=today` - Get today's mood
- `GET /api/wellness/sleep?range=today` - Get today's sleep
- `GET /api/wearables/steps?date=today` - Get today's steps

**Personalization Integration:**
- Displays calories from `personalized_macros`
- Shows water target from `personalized_macros.water_target_liters`
- Workout plan from `personalized_workout_plan`
- Wellness goals from `personalized_wellness_plan`

---

# 🟧 FUEL TAB (Nutrition)

### `/fuel`

**Components:**
```
FuelScreen.tsx
    MealCard.tsx
    AddFoodButton.tsx
    FoodSearch.tsx
    FoodListItem.tsx
    MacroRing.tsx
    RecipeCard.tsx
    WaterTracker.tsx
```

**Screens:**
```
/fuel/food-database
/fuel/recipes
/fuel/meal/[id]
```

**Modals:**
- `AddFoodModal.tsx`
- `CreateRecipeModal.tsx`
- `FoodDetailsModal.tsx`

**API Calls:**
- `GET /api/nutrition/search?query=...` - Search foods (FatSecret + USDA + user_foods)
- `GET /api/nutrition/food/:id` - Get food details
- `POST /api/nutrition/custom-food` - Add custom food
- `POST /api/nutrition/log-meal` - Log meal
- `GET /api/nutrition/daily-log?date=...` - Get daily meals
- `POST /api/nutrition/barcode` - Scan barcode
- `POST /api/nutrition/image-detect` - Vision API food recognition
- `GET /api/nutrition/recipes` - Get user recipes
- `POST /api/nutrition/recipes` - Create recipe
- `GET /api/personalized-plan` - Get macro targets

**Supabase Direct Calls:**
- `supabase.from('meal_logs').select()` - Get meal logs
- `supabase.from('foods').select()` - Get global foods
- `supabase.from('user_foods').select()` - Get user foods
- `supabase.from('recipes').select()` - Get recipes

**Premium Locks:**
- Unlimited meal logging (free: 5 meals/day)
- Recipe recommendations
- AI meal plans (Module X)
- Barcode scanner
- Advanced macro tracking

---

# 🟩 MOVE TAB (Fitness)

### `/move`

**Components:**
```
MoveScreen.tsx
    WorkoutPlanHeader.tsx
    TodayWorkoutCard.tsx
    ExerciseRow.tsx
    ExerciseVideo.tsx
    ProgressionGraph.tsx
```

**Screens:**
```
/move/workout-plan
/move/exercise-database
/move/workout/[id]
```

**Modals:**
- `AddExerciseModal.tsx`
- `EditExerciseModal.tsx`

**API Calls:**
- `GET /api/workouts/exercises` - Get exercise library
- `GET /api/workouts/exercises/:id` - Get exercise details
- `POST /api/workouts` - Create workout
- `GET /api/workouts` - Get user's workouts
- `GET /api/workouts/:id` - Get workout details
- `POST /api/workouts/log` - Log workout
- `GET /api/workouts/daily-log?date=...` - Get daily workouts
- `POST /api/workouts/auto-plan` - Get auto-progression suggestions
- `GET /api/personalized-plan` - Get workout plan

**Supabase Direct Calls:**
- `supabase.from('exercises').select()` - Get exercises
- `supabase.from('workouts').select()` - Get workouts
- `supabase.from('workout_logs').select()` - Get workout logs
- `supabase.from('set_logs').select()` - Get set logs
- `supabase.rpc('get_next_exercise_progression')` - Get progression (Module Y)

**Premium Locks:**
- Auto-progression (Module Y)
- Personalized training plan
- Video library
- Form analysis (future)
- Advanced workout analytics
- Unlimited workout logging (free: 3 workouts/week)

---

# 💜 WELLNESS TAB

### `/wellness`

This is your "AIMind" unified hub.

**Components:**
```
WellnessScreen.tsx
    MoodWidget.tsx
    SleepWidget.tsx
    HabitWidget.tsx
    MeditationWidget.tsx
    GamesWidget.tsx
    GratitudeWidget.tsx
    JournalWidget.tsx
    WellnessInsights.tsx
```

**Modals:**
- `MoodInputModal.tsx`
- `SleepInputModal.tsx`
- `MeditationPlayerModal.tsx`
- `GameHubModal.tsx`
- `SingleGameModal.tsx`
- `GratitudeModal.tsx`
- `JournalModal.tsx`

### Meditation UI:
```
MeditationHub.tsx
MeditationPlayerModal.tsx
MeditationCard.tsx
```

### Games UI:
```
GameHubModal.tsx
GameCard.tsx
ReactionGame.tsx
BreathingGame.tsx
FocusTapGame.tsx
MemoryMatchGame.tsx
```

**API Calls:**
- `POST /api/wellness/mood` - Log mood
- `GET /api/wellness/mood?range=week` - Get mood history
- `POST /api/wellness/sleep` - Log sleep
- `GET /api/wellness/sleep?range=week` - Get sleep history
- `POST /api/wellness/habits` - Create habit
- `POST /api/wellness/habits/toggle` - Toggle habit completion
- `GET /api/wellness/habits` - Get habits
- `POST /api/wellness/meditation/log` - Log meditation
- `GET /api/wellness/meditation/stats` - Get meditation stats
- `POST /api/wellness/games/log` - Log game session
- `GET /api/wellness/games/stats` - Get game stats
- `POST /api/wellness/journal` - Create journal entry
- `GET /api/wellness/journal` - Get journal entries
- `POST /api/wellness/gratitude` - Create gratitude entry
- `GET /api/wellness/gratitude` - Get gratitude entries

**Supabase Direct Calls:**
- `supabase.rpc('log_mood')` - Log mood (Module C)
- `supabase.rpc('log_sleep_session')` - Log sleep (Module Z)
- `supabase.rpc('toggle_habit')` - Toggle habit (Module C)
- `supabase.from('meditation_logs').select()` - Get meditation logs (Module O)
- `supabase.from('mind_game_sessions').select()` - Get game sessions (Module O)
- `supabase.from('journals').select()` - Get journals (Module C)
- `supabase.from('gratitude_entries').select()` - Get gratitude (Module C)

**Premium Locks:**
- Unlimited mindfulness sessions (free: 2/week)
- Advanced sleep insights (Module Z)
- Mood pattern analysis
- AI mental health insights
- Stress management tools
- Full meditation library (Module O)
- Full game library (Module O)

---

# 🟨 PROFILE TAB

### `/profile`

**Components:**
```
ProfileScreen.tsx
    ProfileHeader.tsx
    SubscriptionCard.tsx
    Preferences.tsx
    ConnectedApps.tsx
    AccountInfo.tsx
```

**Sub-pages:**
```
/profile/settings
/profile/notifications
/profile/premium
/profile/data-export
```

**API Calls:**
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `PUT /api/user/preferences` - Update preferences
- `GET /api/subscriptions/status` - Get subscription status
- `POST /api/subscriptions/create-checkout` - Create Stripe checkout
- `GET /api/notifications/preferences` - Get notification settings
- `PUT /api/notifications/preferences` - Update notification settings

**Supabase Direct Calls:**
- `supabase.from('users').select()` - Get user data
- `supabase.from('user_settings').select()` - Get settings
- `supabase.rpc('get_user_entitlement')` - Get subscription status (Module S)
- `supabase.from('notification_settings').select()` - Get notification settings (Module H)

**Premium Lock Indicators:**
- Premium banner
- Upgrade modal
- Feature comparison

---

# 🟦 EXTRA MODULE SCREENS

### A) **Shopping List**

Route: `/shopping`

**Components:**
```
ShoppingListScreen.tsx
    ShoppingItemRow.tsx
    PantryItemRow.tsx
    FavoritesList.tsx
```

**API Calls:**
- `POST /api/shopping/list` - Create shopping list
- `GET /api/shopping/list` - Get shopping lists
- `POST /api/shopping/item` - Add item
- `POST /api/shopping/item/toggle` - Toggle item checked
- `POST /api/shopping/sort` - Auto-sort list
- `GET /api/shopping/pantry` - Get pantry items
- `POST /api/shopping/pantry` - Add pantry item
- `POST /api/shopping/favorites` - Add favorite
- `POST /api/shopping/suggestions` - Get AI suggestions

**Supabase Direct Calls:**
- `supabase.rpc('create_shopping_list')` - Create list (Module F)
- `supabase.rpc('add_shopping_item')` - Add item (Module F)
- `supabase.rpc('toggle_item_check')` - Toggle check (Module F)
- `supabase.rpc('autosort_list')` - Auto-sort (Module F)
- `supabase.rpc('suggest_missing_items')` - Get suggestions (Module F)

---

### B) **Marketplace (Shopify / WooCommerce)**

Route: `/shop`

**Components:**
```
ShopScreen.tsx
    ProductCard.tsx
    ProductDetailsScreen.tsx
```

**API Calls:**
- `GET /api/marketplace/shopify/products` - Get Shopify products
- `GET /api/marketplace/shopify/collections` - Get collections
- `GET /api/marketplace/wp/products` - Get WooCommerce products

**Data loaded via:**
- Shopify Storefront API OR
- WooCommerce REST API

⭐ **No database required** unless saving favorites.

---

# 🟪 AI COACH

### Floating Component
`AiCoachBubble.tsx`

### Full Page
Route: `/coach`

**Components:**
```
ChatCoachScreen.tsx
    MessageBubble.tsx
    CoachSuggestions.tsx
    QuickActions.tsx
```

**API Calls:**
- `POST /api/ai/coach` - Send message to AI coach
- `GET /api/ai/insights` - Get AI insights
- `GET /api/ai/greeting` - Get personalized greeting
- `GET /api/recommendations/daily` - Get daily recommendations

**Supabase Direct Calls:**
- `supabase.from('ai_messages').select()` - Get chat history (Module K)
- `supabase.from('ai_coach_context').select()` - Get AI context (Module K)
- `supabase.from('ai_daily_coach_queue').select()` - Get daily coaching (Module K)
- `supabase.from('ai_recommendations').select()` - Get recommendations (Module W)

**Depends on:**
- Personalized macros (`personalized_macros`)
- Workout plan (`personalized_workout_plan`)
- Wellness data (mood, sleep, habits)
- Trends (analytics)

---

# 🟥 ONBOARDING (30 Questions)

Route: `/onboarding`

**Components:**
```
OnboardingScreen.tsx
    QuestionCard.tsx
    MultiChoice.tsx
    SliderInput.tsx
    PhotoUpload.tsx
    SummaryScreen.tsx
```

**API Calls:**
- `POST /api/onboarding/answers` - Submit onboarding answers
- `GET /api/onboarding/recommendation` - Get recommendations after onboarding

**After completion → triggers:**
```typescript
// 1. Submit answers
POST /api/onboarding/answers
Body: { answers: { ...all 30 answers } }

// 2. Personalization automatically built
// Response includes personalization plan

// 3. Navigate to /home
navigate('/home');
```

**Supabase Direct Calls:**
- `supabase.from('onboarding_answers').insert()` - Save answers (Module A)
- `supabase.rpc('build_personalization_plan')` - Build plan (Module J)

---

# 🟫 AUTHENTICATION

**Routes:**
```
/login
/register
/forgot-password
```

**Components:**
```
AuthScreen.tsx
    EmailInput.tsx
    PasswordInput.tsx
    SocialLoginButtons.tsx
```

**API Calls:**
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/social` - Social login (Apple/Google)
- `GET /api/auth/session` - Get current session

**Supabase Direct Calls:**
- `supabase.auth.signUp()` - Register
- `supabase.auth.signInWithPassword()` - Login
- `supabase.auth.signInWithOAuth()` - Social login
- `supabase.auth.signOut()` - Logout
- `supabase.auth.getSession()` - Get session

---

# 🔷 GLOBAL STATE MANAGEMENT

**Recommended:** Zustand (for Expo/Web)

**State Slices:**
```
useUserStore
    - user profile
    - subscription status
    - preferences
    - timezone

useMealsStore
    - today's meals
    - daily macros
    - food search results

useWorkoutsStore
    - today's workouts
    - exercise library
    - workout plans

useWellnessStore
    - today's mood
    - sleep data
    - habits
    - meditation sessions

useShoppingListStore
    - active shopping list
    - pantry items
    - favorites

useCoachStore
    - chat history
    - AI context
    - recommendations

useOnboardingStore
    - onboarding answers
    - personalization plan
```

**Alternative:** Recoil (if preferred)

---

# ⚡ CONNECTION BETWEEN MODULES

### Nutrition affects:
- Shopping list (auto-populates from meal plans)
- Marketplace suggestions (based on macros/goals)
- AI coach (nutrition advice)
- Analytics (daily summaries)

### Workouts affect:
- Auto-progression (Module Y)
- AI coach (workout advice)
- Analytics (daily summaries)
- Daily dashboard (workout completion)

### Wellness affects:
- Meditation suggestions (based on mood/stress)
- Insights (Module Z sleep AI)
- Sleep AI (Module Z)
- Mood patterns (trends)

### Wearables affect:
- Steps (merged with manual steps)
- HR (heart rate data)
- Sleep (optional enhancement)
- Workouts (auto-detected)

### Personalization affects:
- **Everything** - All modules use personalization data:
  - Macros from `personalized_macros`
  - Workout plan from `personalized_workout_plan`
  - Wellness goals from `personalized_wellness_plan`
  - Recommendations from `personalized_recommendations`

---

# 🎨 COMPONENT PROPS EXAMPLES

### `MealCard.tsx`
```typescript
interface MealCardProps {
  meal: {
    id: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    food_id?: string;
    user_food_id?: string;
    recipe_id?: string;
    quantity: number;
    logged_at: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  showMacros?: boolean;
}
```

### `WorkoutPlanHeader.tsx`
```typescript
interface WorkoutPlanHeaderProps {
  plan: {
    days: Array<{
      day: string;
      title: string;
      exercises: Array<{
        name: string;
        sets: number;
        reps: string;
      }>;
    }>;
    progression_level: number;
    days_per_week: number;
  };
  onStartWorkout?: () => void;
}
```

### `MoodWidget.tsx`
```typescript
interface MoodWidgetProps {
  todayMood?: {
    mood_value: number; // 1-5
    note?: string;
    created_at: string;
  };
  onLogMood?: () => void;
  showHistory?: boolean;
}
```

---

# 🔐 PREMIUM GATING PATTERN

```typescript
// Component example
import { PremiumLock } from '@/components/PremiumLock';
import { useUserStore } from '@/stores/useUserStore';

function SomeFeature() {
  const { isPremium } = useUserStore();
  
  if (!isPremium) {
    return (
      <PremiumLock
        feature="Advanced Analytics"
        onUpgrade={() => navigate('/profile/premium')}
      />
    );
  }
  
  return <AdvancedAnalytics />;
}
```

---

# 📱 EXPO ROUTER STRUCTURE

```
/app/
    (tabs)/
        _layout.tsx          (Bottom tabs)
        home.tsx             (HomeScreen)
        fuel.tsx             (FuelScreen)
        move.tsx             (MoveScreen)
        wellness.tsx         (WellnessScreen)
        profile.tsx          (ProfileScreen)
    
    onboarding/
        index.tsx            (OnboardingScreen)
    
    auth/
        login.tsx
        register.tsx
        forgot-password.tsx
    
    coach/
        index.tsx            (ChatCoachScreen)
    
    shopping/
        index.tsx            (ShoppingListScreen)
    
    shop/
        index.tsx            (ShopScreen)
        [id].tsx             (ProductDetailsScreen)
    
    _layout.tsx              (Root layout)
```

---

# 🏆 NEXT STEPS FOR CURSOR

1. **Create component structure** based on this map
2. **Implement shared components** first (Header, BottomTabs, etc.)
3. **Build each tab screen** one at a time
4. **Add modals** as needed
5. **Connect to Supabase** using direct calls or API routes
6. **Add premium gating** where needed
7. **Integrate personalization** data throughout

---

**Last Updated**: After Module J completion
**Status**: ✅ Complete UI/UX architecture blueprint

