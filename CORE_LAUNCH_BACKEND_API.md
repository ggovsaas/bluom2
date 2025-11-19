# 🅒 BACKEND API MAP

## Core API Endpoints for 5 Essential Modules Only

---

## 🔐 **AUTH ENDPOINTS**

### `POST /api/auth/register`
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```
**Response:**
```json
{
  "success": true,
  "user": { "id": "uuid", "email": "..." },
  "session": { "access_token": "..." }
}
```

### `POST /api/auth/login`
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "user": { "id": "uuid", "email": "..." },
  "session": { "access_token": "..." }
}
```

### `GET /api/auth/me`
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "...",
    "name": "...",
    "profile": { ... }
  }
}
```

---

## 💳 **SUBSCRIPTION ENDPOINTS**

### `POST /api/subscriptions/create`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "plan": "premium_monthly" | "premium_yearly"
}
```
**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "uuid",
    "status": "trialing",
    "plan": "premium_monthly",
    "trial_end": "2024-01-10T00:00:00Z"
  },
  "checkout_url": "https://checkout.stripe.com/..."
}
```

### `POST /api/subscriptions/webhook`
**Body:** Stripe webhook payload
**Response:**
```json
{
  "success": true
}
```

### `GET /api/subscriptions/status`
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "subscription": {
    "status": "active" | "trialing" | "past_due" | "canceled",
    "plan": "free" | "premium_monthly" | "premium_yearly",
    "trial_end": "...",
    "current_period_end": "..."
  },
  "is_premium": true
}
```

---

## 🍽️ **FUEL ENDPOINTS**

### `GET /api/foods/search?q=chicken`
**Headers:** `Authorization: Bearer <token>`
**Query:** `q` (search term)
**Response:**
```json
{
  "success": true,
  "foods": [
    {
      "id": 1,
      "name": "Chicken Breast",
      "brand": "...",
      "calories": 165,
      "protein": 31,
      "carbs": 0,
      "fat": 3.6
    }
  ]
}
```

### `POST /api/meals/add`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "date": "2024-01-05",
  "meal_type": "breakfast",
  "food_id": 123,
  "quantity": 1.5
}
```
**Response:**
```json
{
  "success": true,
  "meal": { "id": 456, ... }
}
```

### `GET /api/meals/day/:date`
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "meals": [
    {
      "id": 456,
      "meal_type": "breakfast",
      "food": { "name": "...", ... },
      "quantity": 1.5,
      "calories": 247
    }
  ],
  "totals": {
    "calories": 1850,
    "protein": 120,
    "carbs": 200,
    "fat": 65
  }
}
```

### `POST /api/water/add`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "ml": 250
}
```
**Response:**
```json
{
  "success": true,
  "total_today": 1250
}
```

### `POST /api/recipes/create`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "title": "Chicken Salad",
  "instructions": "...",
  "ingredients": [
    { "food_id": 123, "quantity": 200, "unit": "g" }
  ]
}
```
**Response:**
```json
{
  "success": true,
  "recipe": { "id": "uuid", ... }
}
```

---

## 💪 **MOVE ENDPOINTS**

### `GET /api/exercises?muscle_group=chest`
**Headers:** `Authorization: Bearer <token>`
**Query:** `muscle_group` (optional)
**Response:**
```json
{
  "success": true,
  "exercises": [
    {
      "id": 1,
      "name": "Bench Press",
      "muscle_group": "chest",
      "equipment": "barbell",
      "video_url": "..."
    }
  ]
}
```

### `GET /api/workouts`
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "routines": [
    {
      "id": "uuid",
      "title": "Upper Body",
      "exercises": [...]
    }
  ]
}
```

### `GET /api/workouts/:id`
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "routine": {
    "id": "uuid",
    "title": "Upper Body",
    "exercises": [
      {
        "exercise": { "name": "...", ... },
        "sets": 3,
        "reps": 10
      }
    ]
  }
}
```

### `POST /api/workouts/log`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "exercise_id": 1,
  "routine_id": "uuid",
  "sets": [
    { "weight": 50, "reps": 10, "rest": 60 },
    { "weight": 50, "reps": 10, "rest": 60 }
  ],
  "duration_minutes": 30
}
```
**Response:**
```json
{
  "success": true,
  "workout": { "id": 789, ... }
}
```

### `POST /api/steps/log`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "steps": 8500,
  "date": "2024-01-05"
}
```
**Response:**
```json
{
  "success": true,
  "total_today": 8500
}
```

---

## 🧘 **WELLNESS ENDPOINTS**

### `POST /api/sleep/log`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "hours": 7.5,
  "quality": 4,
  "date": "2024-01-05"
}
```
**Response:**
```json
{
  "success": true,
  "sleep": { "id": 123, ... }
}
```

### `POST /api/mood/log`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "mood": 4,
  "note": "Feeling great today!"
}
```
**Response:**
```json
{
  "success": true,
  "mood": { "id": 456, ... }
}
```

### `POST /api/habits/create`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "name": "Drink 8 glasses of water",
  "category": "health"
}
```
**Response:**
```json
{
  "success": true,
  "habit": { "id": "uuid", ... }
}
```

### `POST /api/habits/log`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "habit_id": "uuid",
  "date": "2024-01-05",
  "completed": true
}
```
**Response:**
```json
{
  "success": true,
  "habit_log": { "id": "uuid", ... }
}
```

---

## 🎯 **PERSONALIZATION ENDPOINTS**

### `POST /api/onboarding/submit`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "answers": {
    "q1": "lose weight",
    "q2": "moderate",
    "q3": "3-4 times per week",
    ...
  }
}
```
**Response:**
```json
{
  "success": true,
  "plans_generated": true
}
```

### `GET /api/personalized/mealplan`
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "plan": {
    "daily_calories": 2000,
    "macros": {
      "protein": 150,
      "carbs": 200,
      "fats": 67
    },
    "meals": [
      {
        "meal_type": "breakfast",
        "suggestions": ["Oatmeal with berries", ...]
      }
    ]
  }
}
```

### `GET /api/personalized/workoutplan`
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "plan": {
    "frequency": 4,
    "split": "upper/lower",
    "exercises": [
      {
        "day": "Monday",
        "exercises": [
          { "name": "Bench Press", "sets": 3, "reps": 10 }
        ]
      }
    ]
  }
}
```

---

## 📊 **DASHBOARD ENDPOINTS**

### `GET /api/dashboard/today`
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "snapshot": {
    "calories_eaten": 1850,
    "calories_remaining": 150,
    "protein_eaten": 120,
    "carbs_eaten": 200,
    "fat_eaten": 65,
    "water_ml": 1250,
    "steps": 8500,
    "sleep_hours": 7.5,
    "mood": 4,
    "habits_completed": 3,
    "workouts_completed": 1
  },
  "streaks": {
    "nutrition": 5,
    "workout": 3,
    "meditation": 0,
    "habits": 7
  },
  "insights": [
    "Your protein is 30g below target today",
    "You slept 1h less than your goal"
  ]
}
```

---

## 🔔 **NOTIFICATION ENDPOINTS**

### `POST /api/notifications/registerPush`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "expo_push_token": "ExponentPushToken[...]",
  "device_type": "ios" | "android" | "web"
}
```
**Response:**
```json
{
  "success": true
}
```

### `GET /api/notifications/next`
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "category": "water",
      "message": "Time to hydrate! 💧",
      "scheduled_at": "2024-01-05T14:00:00Z"
    }
  ]
}
```

### `PUT /api/notifications/preferences`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "enabled": true,
  "quiet_hours": {
    "start": "21:30",
    "end": "08:15"
  },
  "max_daily": 4
}
```
**Response:**
```json
{
  "success": true
}
```

---

## ✅ **COMPLETE API MAP**

All endpoints are minimal, focused, and essential for launch.

