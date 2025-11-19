# 🅑 FRONTEND ROUTING MAP (EXPO + WEB)

## Core Routes for 5 Essential Modules Only

---

## 📱 **AUTH ROUTES**

### `/auth`
- **`/auth/login`** - Sign in screen
  - Email/password form
  - "Forgot password" link
  - "Sign up" link
  
- **`/auth/register`** - Sign up screen
  - Email/password form
  - Terms & conditions
  - Redirect to onboarding after signup
  
- **`/auth/forgot`** - Password reset
  - Email input
  - Send reset link

---

## 🏠 **HOME DASHBOARD**

### `/home`
- **`/home`** (or `/`) - Main dashboard
  - Daily calories remaining (ring/progress bar)
  - Steps today (ring/progress bar)
  - Water today (ring/progress bar)
  - Sleep last night (hours + quality)
  - Mood today (emoji + number)
  - Quick add buttons (Log meal, Log workout, Log water, Log mood)
  - Streaks display (meditation, workout, nutrition, habits)
  - Small insights ("Your protein is low today", "You slept 1h less than usual")
  
- **`/home/insights`** - Weekly insights
  - Trends (calories, steps, sleep, mood)
  - Weekly summary
  - Recommendations

---

## 🍽️ **FUEL SYSTEM**

### `/fuel`
- **`/fuel`** - Main fuel screen
  - Daily macro breakdown (calories, protein, carbs, fats)
  - Meal list (breakfast, lunch, dinner, snacks)
  - Quick add button
  - Water tracker
  
- **`/fuel/log`** - Log meal screen
  - Meal type selector (breakfast/lunch/dinner/snack)
  - Food search bar
  - Recent foods
  - Barcode scanner button
  - Quantity input
  - Add to meal button
  
- **`/fuel/food/search`** - Food search
  - Search bar
  - Results list (name, brand, macros)
  - Add to meal button
  
- **`/fuel/recipes`** - Recipes list
  - User's saved recipes
  - "Create recipe" button
  
- **`/fuel/recipes/create`** - Create recipe
  - Title, instructions
  - Add ingredients (search foods)
  - Calculate totals
  - Save button

---

## 💪 **MOVE SYSTEM**

### `/move`
- **`/move`** - Main move screen
  - Today's workout (if scheduled)
  - Quick start button
  - Steps today (ring/progress bar)
  - Recent workouts list
  
- **`/move/workouts`** - Workouts list
  - User's routines
  - "Create routine" button
  - Exercise database link
  
- **`/move/workouts/routine/:id`** - Routine details
  - Exercises list
  - Sets/reps
  - Start workout button
  
- **`/move/workouts/log`** - Log workout
  - Exercise selector
  - Sets input (weight, reps, rest)
  - Add set button
  - Complete workout button
  
- **`/move/steps`** - Steps tracker
  - Today's steps
  - Weekly chart
  - Manual entry button

---

## 🧘 **WELLNESS SYSTEM**

### `/wellness`
- **`/wellness`** - Main wellness screen
  - Sleep tracker
  - Mood tracker
  - Habits grid
  
- **`/wellness/sleep`** - Sleep log
  - Hours input (slider or number)
  - Quality selector (1-5)
  - Date picker
  - Save button
  
- **`/wellness/mood`** - Mood log
  - Mood selector (1-5 emoji)
  - Note input (optional)
  - Save button
  
- **`/wellness/habits`** - Habits manager
  - Habits list with checkboxes
  - "Add habit" button
  - Daily completion tracking

---

## 👤 **PROFILE & SETTINGS**

### `/profile`
- **`/profile`** - Profile screen
  - User info (name, age, height, weight)
  - Edit button
  
- **`/profile/settings`** - Settings
  - Daily calorie target
  - Macro split
  - Water goal
  - Steps goal
  - Sleep goal
  
- **`/profile/subscription`** - Subscription
  - Current plan (free/premium)
  - Upgrade button (if free)
  - Manage subscription (if premium)
  - Trial status
  
- **`/profile/notifications`** - Notification settings
  - Enable/disable toggle
  - Quiet hours (start/end time)
  - Max daily notifications
  - Category toggles (water, meals, sleep, habits, workouts)

---

## 🎯 **ONBOARDING**

### `/onboarding`
- **`/onboarding`** - Onboarding flow
  - 30 questions (multi-step form)
  - Progress indicator
  - Submit button
  - Redirects to home after completion

---

## 🔄 **NAVIGATION STRUCTURE**

### Bottom Tab Navigator (Mobile)
- Home (🏠)
- Fuel (🍽️)
- Move (💪)
- Wellness (🧘)
- Profile (👤)

### Stack Navigators
- Auth Stack (login, register, forgot)
- Home Stack (dashboard, insights)
- Fuel Stack (main, log, search, recipes)
- Move Stack (main, workouts, log, steps)
- Wellness Stack (main, sleep, mood, habits)
- Profile Stack (main, settings, subscription, notifications)

---

## 📱 **DEEP LINKS**

- `bluom://fuel/log` - Open meal log
- `bluom://move/log` - Open workout log
- `bluom://wellness/mood` - Open mood log
- `bluom://wellness/sleep` - Open sleep log
- `bluom://home` - Open dashboard

---

## ✅ **COMPLETE ROUTING MAP**

All routes are minimal, focused, and essential for launch.

