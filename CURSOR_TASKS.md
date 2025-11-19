# ⚡ CURSOR TASKS — App Logic, UI, AI, Features

**IMPORTANT:** These tasks should be done in Cursor. Bolt handles Supabase/Auth/Stripe only.

---

## ✅ TASK 1 — FIX ALL UI ISSUES (Expo + Web Responsiveness)

### Mobile Screen Fixes

**Dashboard (`/src/app/home/index.tsx`):**
- Fix widget grid: Use `flexWrap` and proper spacing
- Ensure cards don't overflow on small screens (320px width)
- Fix text truncation: Add `numberOfLines` props
- Fix scroll areas: Use `ScrollView` with proper `contentContainerStyle`
- Fix spacing: Use consistent padding (16px) and margins (8px)

**Fuel Module (`/src/app/fuel/index.tsx`):**
- Fix meal cards: Stack vertically on mobile, horizontal on tablet
- Fix food search modal: Full screen on mobile, modal on web
- Fix barcode scanner: Full screen camera view
- Fix macro progress bars: Horizontal on mobile, don't wrap

**Move Module (`/src/app/move/index.tsx`):**
- Fix workout cards: Proper card height, no text overflow
- Fix exercise list: Virtualized list for performance
- Fix workout player: Full screen on mobile
- Fix steps widget: Compact design for mobile

**Wellness Module (`/src/app/wellness/index.tsx`):**
- Fix stress score display: Circular progress fits screen
- Fix recommendation cards: Stack vertically, readable text
- Fix meditation progress: Compact stats display
- Fix quick actions: Grid with proper touch targets (44x44px minimum)

**Profile Module (`/src/app/profile/index.tsx`):**
- Fix settings list: Proper spacing, readable text
- Fix subscription card: Clear CTA button
- Fix stats display: Responsive grid

### Web Screen Fixes

- Use max-width containers (1200px) for desktop
- Use proper grid layouts (CSS Grid or Flexbox)
- Ensure hover states work
- Fix navigation: Sidebar on desktop, bottom nav on mobile

### Global Fixes

- Add consistent theme colors (use StyleSheet or CSS variables)
- Fix font sizes: Use responsive units (rem/em on web, scale on mobile)
- Fix loading states: Show spinners, not blank screens
- Fix error states: Show error messages, retry buttons

---

## ✅ TASK 2 — FIX FOOD LOGS + MEAL LOGGING

### Connect Meal Logging to Supabase

**File: `/src/services/fuel.ts`**

Ensure these functions work:

```typescript
// Add food to meal
export async function addFoodToMeal(
  userId: string,
  mealLogId: number,
  foodId: number,
  quantity: number
) {
  // Insert into meal_log_items
  const { data, error } = await supabase
    .from('meal_log_items')
    .insert({
      meal_log_id: mealLogId,
      food_id: foodId,
      quantity,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Update daily summary
  await supabase.rpc('update_daily_snapshot', {
    p_user_id: userId,
    p_date: new Date().toISOString().split('T')[0],
  });
  
  return data;
}

// Get meal log for date
export async function getMealLog(userId: string, date: string) {
  const { data, error } = await supabase
    .from('meal_logs')
    .select(`
      *,
      meal_log_items (
        *,
        foods (*)
      )
    `)
    .eq('user_id', userId)
    .eq('logged_at', date)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

// Remove food from meal
export async function removeMealItem(itemId: string) {
  const { error } = await supabase
    .from('meal_log_items')
    .delete()
    .eq('id', itemId);
  
  if (error) throw error;
}
```

### Fix Persistence Issues

**In `/src/app/fuel/index.tsx`:**

```typescript
useEffect(() => {
  if (user) {
    loadMealLogs();
  }
}, [user, selectedDate]);

const loadMealLogs = async () => {
  try {
    const date = selectedDate || new Date().toISOString().split('T')[0];
    const mealLog = await getMealLog(user.id, date);
    setMealLogs(mealLog || { breakfast: [], lunch: [], dinner: [], snacks: [] });
  } catch (error) {
    console.error('Error loading meal logs:', error);
  }
};
```

### Add Real-Time Updates

```typescript
useEffect(() => {
  if (!user) return;

  const channel = supabase
    .channel('meal_logs')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'meal_logs',
      filter: `user_id=eq.${user.id}`,
    }, (payload) => {
      loadMealLogs(); // Reload on any change
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user]);
```

---

## ✅ TASK 3 — FIX WELLNESS LOGS (Mood, Sleep, Habits, Gratitude, Journal)

### Mood Tracking

**File: `/src/services/wellness.ts`**

```typescript
export async function logMood(
  userId: string,
  mood: number, // 1-5
  note?: string
) {
  const { data, error } = await supabase
    .from('mood_logs')
    .insert({
      user_id: userId,
      mood,
      note,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Update daily snapshot
  await supabase.rpc('update_daily_snapshot', {
    p_user_id: userId,
    p_date: new Date().toISOString().split('T')[0],
  });
  
  return data;
}

export async function getMoodHistory(userId: string, days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const { data, error } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}
```

### Sleep Tracking

```typescript
export async function logSleep(
  userId: string,
  hours: number,
  quality: number, // 1-5
  date?: string
) {
  const sleepDate = date || new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('sleep_logs')
    .upsert({
      user_id: userId,
      date: sleepDate,
      hours,
      quality,
    }, {
      onConflict: 'user_id,date',
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Update daily snapshot
  await supabase.rpc('update_daily_snapshot', {
    p_user_id: userId,
    p_date: sleepDate,
  });
  
  return data;
}
```

### Habit Tracking

```typescript
export async function toggleHabit(
  userId: string,
  habitId: string,
  date?: string
) {
  const habitDate = date || new Date().toISOString().split('T')[0];
  
  // Check if already completed
  const { data: existing } = await supabase
    .from('habit_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('habit_id', habitId)
    .eq('date', habitDate)
    .maybeSingle();
  
  if (existing) {
    // Remove completion
    await supabase
      .from('habit_logs')
      .delete()
      .eq('id', existing.id);
    return { completed: false };
  } else {
    // Add completion
    const { data, error } = await supabase
      .from('habit_logs')
      .insert({
        user_id: userId,
        habit_id: habitId,
        date: habitDate,
        completed: true,
      })
      .select()
      .single();
    
    if (error) throw error;
    return { completed: true, data };
  }
}
```

### Gratitude & Journal

```typescript
export async function logGratitude(userId: string, entry: string) {
  const { data, error } = await supabase
    .from('gratitude_entries')
    .insert({
      user_id: userId,
      entry,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function logJournal(userId: string, content: string) {
  const { data, error } = await supabase
    .from('journals')
    .insert({
      user_id: userId,
      content,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

### Fix Persistence in UI

Add `useEffect` hooks to load data on screen mount:

```typescript
useEffect(() => {
  if (user) {
    loadMoodHistory();
    loadSleepHistory();
    loadHabits();
  }
}, [user]);
```

---

## ✅ TASK 4 — INTEGRATE PERSONALIZED PLANS (Nutrition + Training + Wellness)

### Connect Onboarding to Plan Generation

**File: `/src/app/onboarding/index.tsx`**

After user completes onboarding:

```typescript
const handleCompleteOnboarding = async () => {
  try {
    // Save onboarding answers
    const { data: answers } = await supabase
      .from('onboarding_answers')
      .insert({
        user_id: user.id,
        answers: onboardingData, // JSON object with all answers
      })
      .select()
      .single();
    
    // Generate personalized plan
    const { data: plan, error } = await supabase.rpc('build_personalization_plan', {
      p_user_id: user.id,
      p_onboarding_answers: onboardingData,
    });
    
    if (error) throw error;
    
    // Navigate to home
    router.replace('/home');
  } catch (error) {
    console.error('Error completing onboarding:', error);
    alert('Failed to generate plan. Please try again.');
  }
};
```

### Display Personalized Targets

**File: `/src/app/home/index.tsx`**

```typescript
useEffect(() => {
  if (user) {
    loadPersonalizedTargets();
  }
}, [user]);

const loadPersonalizedTargets = async () => {
  const { data, error } = await supabase
    .from('personalized_macros')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (data) {
    setDailyTargets({
      calories: data.daily_calories,
      protein: data.daily_protein,
      carbs: data.daily_carbs,
      fats: data.daily_fats,
    });
  }
};
```

### Show Suggested Meals

```typescript
const loadSuggestedMeals = async () => {
  const { data, error } = await supabase
    .from('ai_recommendations')
    .select('*')
    .eq('user_id', user.id)
    .eq('category', 'nutrition')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (data) {
    setSuggestedMeals(data);
  }
};
```

---

## ✅ TASK 5 — IMPLEMENT THE AI COACH

### Connect AI Coach to Data

**File: `/src/services/aiCoach.ts`**

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

export async function getAICoachMessage(userId: string, context: string) {
  // Get user data
  const [nutrition, workouts, wellness, sleep, mood] = await Promise.all([
    getDailyNutrition(userId),
    getRecentWorkouts(userId),
    getWellnessData(userId),
    getSleepData(userId),
    getMoodData(userId),
  ]);
  
  const prompt = `You are Nova, an AI fitness coach. Analyze this user's data and provide personalized advice.

Nutrition: ${JSON.stringify(nutrition)}
Workouts: ${JSON.stringify(workouts)}
Wellness: ${JSON.stringify(wellness)}
Sleep: ${JSON.stringify(sleep)}
Mood: ${JSON.stringify(mood)}

Context: ${context}

Provide a helpful, motivating message (max 200 words).`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are Nova, a friendly AI fitness coach.' },
      { role: 'user', content: prompt },
    ],
  });
  
  return completion.choices[0].message.content;
}
```

### Display AI Coach in UI

**File: `/src/components/AICoach.tsx`**

```typescript
export default function AICoach({ userId }: { userId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const loadCoachMessage = async () => {
    setLoading(true);
    try {
      const msg = await getAICoachMessage(userId, 'daily_checkin');
      setMessage(msg);
    } catch (error) {
      console.error('Error loading AI coach:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadCoachMessage();
  }, [userId]);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nova AI Coach</Text>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
}
```

---

## ✅ TASK 6 — GAMIFIED MEDITATION WORLD

### Integrate Meditation Hub

**File: `/src/app/wellness/meditation/index.tsx`**

```typescript
export default function MeditationHub() {
  const { user } = useAuth();
  const [worlds, setWorlds] = useState([]);
  const [levels, setLevels] = useState([]);
  
  useEffect(() => {
    if (user) {
      loadWorlds();
    }
  }, [user]);
  
  const loadWorlds = async () => {
    const { data } = await supabase
      .from('meditation_worlds')
      .select('*')
      .order('order_index');
    
    setWorlds(data || []);
  };
  
  const loadLevels = async (worldId: string) => {
    const { data } = await supabase
      .from('meditation_levels')
      .select('*')
      .eq('world_id', worldId)
      .order('level_number');
    
    setLevels(data || []);
  };
  
  return (
    <ScrollView>
      {worlds.map((world) => (
        <TouchableOpacity
          key={world.id}
          onPress={() => loadLevels(world.id)}
        >
          <Text>{world.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
```

### Integrate Mini-Game Hub

**File: `/src/app/wellness/games/index.tsx`**

```typescript
export default function GamesHub() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  
  useEffect(() => {
    if (user) {
      loadGames();
    }
  }, [user]);
  
  const loadGames = async () => {
    const { data } = await supabase
      .from('mind_games')
      .select('*')
      .order('title');
    
    setGames(data || []);
  };
  
  const handleGameComplete = async (gameId: string, score: number) => {
    // Log game session
    await supabase.from('mind_game_sessions').insert({
      user_id: user.id,
      game_id: gameId,
      score,
    });
    
    // Award XP (if Module J exists)
    try {
      await supabase.rpc('add_xp', {
        p_user_id: user.id,
        p_xp: 10,
        p_source: 'game',
        p_source_id: gameId,
      });
    } catch (error) {
      console.log('Could not award XP:', error);
    }
  };
  
  return (
    <ScrollView>
      {games.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          onComplete={(score) => handleGameComplete(game.id, score)}
        />
      ))}
    </ScrollView>
  );
}
```

### Connect XP + Streak System

Ensure XP and streaks update when:
- Meditation completed
- Game completed
- Habit completed
- Mood logged
- Sleep logged

Use the `reportActivity` function from Phase 5:

```typescript
import { reportActivity } from '../utils/activityReporter';

// After meditation
await reportActivity({
  userId: user.id,
  activity: 'meditation_5min',
  xp: 20,
  tokens: 5,
  streakType: 'meditation',
});
```

---

## ✅ TASK 7 — SHOPPING LIST + PANTRY INTEGRATION

### Connect Advanced Shopping List

**File: `/src/services/shoppingList.ts`**

```typescript
export async function createShoppingList(userId: string, name?: string) {
  const { data, error } = await supabase
    .from('shopping_lists')
    .insert({
      user_id: userId,
      name: name || 'My Shopping List',
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function addShoppingItem(
  listId: string,
  itemName: string,
  quantity?: string,
  category?: string
) {
  const { data, error } = await supabase
    .from('shopping_list_items')
    .insert({
      list_id: listId,
      item_name: itemName,
      quantity,
      category,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function toggleItemChecked(itemId: string, checked: boolean) {
  const { error } = await supabase
    .from('shopping_list_items')
    .update({ is_checked: checked })
    .eq('id', itemId);
  
  if (error) throw error;
}
```

### Connect Pantry

```typescript
export async function addPantryItem(
  userId: string,
  itemName: string,
  quantity?: string,
  expiresOn?: string
) {
  const { data, error } = await supabase
    .from('pantry_items')
    .insert({
      user_id: userId,
      item_name: itemName,
      quantity,
      expires_on: expiresOn,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getPantryItems(userId: string) {
  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', userId)
    .order('expires_on', { ascending: true });
  
  if (error) throw error;
  return data || [];
}
```

### Auto-Generate from Recipes

```typescript
export async function addRecipeToShoppingList(
  userId: string,
  recipeId: string,
  listId?: string
) {
  // Get or create list
  let shoppingList;
  if (listId) {
    const { data } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('id', listId)
      .single();
    shoppingList = data;
  } else {
    shoppingList = await createShoppingList(userId);
  }
  
  // Get recipe ingredients
  const { data: recipe } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_ingredients (
        *,
        foods (*)
      )
    `)
    .eq('id', recipeId)
    .single();
  
  // Add ingredients to list
  for (const ingredient of recipe.recipe_ingredients) {
    await addShoppingItem(
      shoppingList.id,
      ingredient.foods?.name || 'Ingredient',
      ingredient.quantity?.toString(),
      'produce'
    );
  }
  
  return shoppingList;
}
```

---

## ✅ TASK 8 — HOME DASHBOARD INTELLIGENCE LAYER

### Connect Dashboard Cards

**File: `/src/app/home/index.tsx`**

```typescript
useEffect(() => {
  if (user) {
    loadDashboardData();
  }
}, [user]);

const loadDashboardData = async () => {
  const today = new Date().toISOString().split('T')[0];
  
  // Load daily summary
  const { data: summary } = await supabase
    .from('daily_summaries')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle();
  
  // Load insights
  const { data: insights } = await supabase
    .from('insights')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);
  
  // Load streaks
  const { data: streaks } = await supabase.rpc('get_all_streaks', {
    p_user_id: user.id,
  });
  
  setDashboardData({
    summary,
    insights: insights || [],
    streaks: streaks || [],
  });
};
```

### Display Cards

```typescript
<View style={styles.dashboard}>
  {/* Water Card */}
  <WaterCard
    current={dashboardData.summary?.water_ml || 0}
    target={2000}
  />
  
  {/* Steps Card */}
  <StepsCard
    current={dashboardData.summary?.steps || 0}
    target={8000}
  />
  
  {/* Sleep Card */}
  <SleepCard
    hours={dashboardData.summary?.sleep_hours || 0}
    quality={dashboardData.summary?.sleep_quality || 3}
  />
  
  {/* Mood Card */}
  <MoodCard
    mood={dashboardData.summary?.mood || 3}
    trend={dashboardData.summary?.mood_trend}
  />
  
  {/* Streaks Card */}
  <StreaksCard streaks={dashboardData.streaks} />
  
  {/* AI Insights Card */}
  <InsightsCard insights={dashboardData.insights} />
</View>
```

---

## ✅ TASK 9 — NOTIFICATION LOGIC (Client-Side)

### Implement Notification Rules

**File: `/src/services/notifications.ts`**

```typescript
export async function scheduleNotification(
  userId: string,
  category: string,
  title: string,
  body: string,
  scheduledTime: Date
) {
  // Check if can send (respects quiet hours, daily limit)
  const { data: canSend } = await supabase.rpc('can_send_notification', {
    p_user_id: userId,
    p_category: category,
  });
  
  if (!canSend) {
    return null;
  }
  
  // Queue notification
  const { data, error } = await supabase.rpc('queue_notification', {
    p_user_id: userId,
    p_category: category,
    p_type: 'reminder',
    p_payload: {
      title,
      body,
    },
    p_scheduled_at: scheduledTime.toISOString(),
    p_priority: 3,
  });
  
  if (error) throw error;
  return data;
}
```

### Daily Reminder Logic

```typescript
export async function scheduleDailyReminders(userId: string) {
  const now = new Date();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  
  // First reminder: 8:15 AM (weekdays) or 10:00 AM (weekends)
  const firstReminder = new Date();
  firstReminder.setHours(isWeekend ? 10 : 8, isWeekend ? 0 : 15, 0, 0);
  
  if (firstReminder < now) {
    firstReminder.setDate(firstReminder.getDate() + 1);
  }
  
  await scheduleNotification(
    userId,
    'wellness',
    'Good morning!',
    'Start your day with a quick check-in.',
    firstReminder
  );
  
  // No reminders after 9:30 PM
  const lastReminder = new Date();
  lastReminder.setHours(21, 30, 0, 0);
  
  if (lastReminder > now) {
    await scheduleNotification(
      userId,
      'wellness',
      'Wind down time',
      'Log your mood and prepare for sleep.',
      lastReminder
    );
  }
}
```

### Merge Reminders

```typescript
export async function getMergedReminders(userId: string) {
  // Get pending notifications
  const { data: notifications } = await supabase
    .from('queued_notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('sent', false)
    .order('scheduled_at', { ascending: true });
  
  // Merge hydration + meal reminders if within 30 minutes
  const merged: any[] = [];
  let lastNotification: any = null;
  
  for (const notif of notifications || []) {
    if (
      lastNotification &&
      (notif.category === 'fuel' || notif.category === 'wellness') &&
      (lastNotification.category === 'fuel' || lastNotification.category === 'wellness') &&
      new Date(notif.scheduled_at).getTime() - new Date(lastNotification.scheduled_at).getTime() < 30 * 60 * 1000
    ) {
      // Merge
      merged[merged.length - 1] = {
        ...lastNotification,
        title: 'Reminder',
        body: `${lastNotification.payload.body} Also, don't forget to drink water and log your meals.`,
      };
      lastNotification = null;
    } else {
      merged.push(notif);
      lastNotification = notif;
    }
  }
  
  return merged;
}
```

---

## ✅ VERIFICATION CHECKLIST

After completing all tasks, verify:

- [ ] All UI components are responsive on mobile (320px+)
- [ ] Meal logs persist and reload correctly
- [ ] Wellness logs (mood, sleep, habits) save and display
- [ ] Personalized plans generate after onboarding
- [ ] AI Coach displays messages
- [ ] Meditation world loads and plays levels
- [ ] Games hub loads and tracks scores
- [ ] Shopping list creates and updates items
- [ ] Pantry items save and display
- [ ] Dashboard shows all cards with real data
- [ ] Notifications respect quiet hours and daily limits

---

**END OF CURSOR TASKS**

