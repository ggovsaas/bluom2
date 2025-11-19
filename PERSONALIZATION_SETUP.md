# Personalization System Setup Guide

This guide explains how to set up and use the complete personalization system for the AiFitness app.

## 📋 What's Included

1. **Backend Service** - Generates personalized nutrition, fitness, and wellness plans
2. **Database Schema** - SQL migrations for storing plans and recommendations
3. **API Endpoints** - Express routes for fetching and regenerating plans
4. **React Native Components** - Mobile UI for displaying plans
5. **Hooks** - Custom React hook for fetching plans

## 🗄️ Database Setup

### Step 1: Run SQL Migration

Run the migration file in your Neon Postgres database:

```bash
# Option 1: Using psql
psql $DATABASE_URL -f server/migrations/001_personalization.sql

# Option 2: Copy and paste the SQL into Neon dashboard
```

The migration creates:
- Additional columns on `users` table (timezone, premium, trial fields, onboarding data)
- `personalized_plans` table (stores generated plans as JSONB)
- `product_recommendations` table (tracks product recommendations)
- `meditation_sessions` table (if not exists)

### Step 2: Set Environment Variable

Add your Neon database connection string to `.env`:

```env
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

## 🔧 Backend Setup

### Step 1: Install Dependencies

```bash
cd server
npm install
```

This will install `pg` (PostgreSQL client) if not already present.

### Step 2: Verify Server Structure

Ensure these files exist:
- `server/db.js` - Database connection pool
- `server/services/personalizationService.js` - Plan generation logic
- `server/routes/personalization.js` - API routes

### Step 3: Start Server

```bash
npm start
# or for development
npm run dev
```

The server will log:
```
🎯 Personalization Endpoints:
GET    /api/personalized-plan - Get personalized plan
POST   /api/personalized-plan/regenerate - Regenerate plan (premium/trial)
```

## 📱 Mobile App Integration

### Step 1: Verify Files

Ensure these files exist in `AiFitnessExpo/src/`:
- `hooks/usePlan.ts` - React hook for fetching plans
- `components/PlanDashboard.tsx` - UI component for displaying plans
- `pages/Plans.tsx` - Full-screen plans page

### Step 2: API Configuration

The API endpoints are already added to `src/config/api.ts`:
- `PERSONALIZED_PLAN` - GET endpoint
- `REGENERATE_PLAN` - POST endpoint (premium/trial only)

### Step 3: Navigation

The `Plans` screen is already added to `App.tsx`. Navigate to it using:

```typescript
navigation.navigate('Plans');
```

## 🎯 How It Works

### Plan Generation Flow

1. **Onboarding Completion** → User completes onboarding with all questions
2. **Plan Generation** → Backend generates personalized plan based on:
   - Age, gender, height, weight
   - Activity level, fitness goal
   - Diet preferences, experience level
   - Sleep patterns, stress levels
3. **Storage** → Plan saved to `personalized_plans` table as JSONB
4. **Display** → Mobile app fetches and displays plan using `PlanDashboard`

### Plan Components

Each plan includes:

**Nutrition:**
- Calorie target (based on TDEE and goal)
- Macro breakdown (protein, carbs, fat)
- Meal templates (3-5 meals per day)

**Fitness:**
- Workout program type (Full Body, Upper/Lower, PPL, etc.)
- Exercise selection based on equipment/experience
- Volume and progression recommendations

**Wellness:**
- Daily micro-practices (meditation, gratitude, breathing)
- Habit suggestions
- Bedtime routines
- Soundscape recommendations

**Recommendations:**
- Product suggestions based on user data
- Equipment recommendations

## 🔐 Premium/Trial Gating

- **Free Users**: Can view their initial plan (generated after onboarding)
- **Trial Users**: Can view and regenerate plans (3-day trial)
- **Premium Users**: Full access to regenerate plans anytime

The `checkPremiumOrTrial` middleware in `routes/personalization.js` handles this.

## 🧪 Testing

### Test Plan Generation

```bash
# Using curl
curl "http://localhost:3001/api/personalized-plan?userId=1"

# Response will be JSON with nutrition, workouts, wellness, recommendations
```

### Test Regeneration (Premium/Trial)

```bash
curl -X POST http://localhost:3001/api/personalized-plan/regenerate \
  -H "Content-Type: application/json" \
  -d '{"userId": 1}'
```

### Test in Mobile App

1. Complete onboarding
2. Navigate to Plans screen (add button in Profile or Home)
3. View your personalized plan
4. If premium/trial, tap "Regenerate Plan" button

## 📝 Notes

- Plans are cached in the database - subsequent fetches return the latest plan
- Regeneration creates a new plan and saves it (overwrites previous)
- The system uses rule-based logic (can be upgraded to ML/AI later)
- Product recommendations are simple rules (can integrate with WooCommerce/Shopify)

## 🚀 Next Steps

1. **Add Plan Display to Profile** - Add a "View My Plan" button in Profile screen
2. **Weekly Regeneration** - Add logic to auto-regenerate plans weekly
3. **Progress-Based Updates** - Regenerate when user hits milestones
4. **Recipe Integration** - Populate meal templates with actual recipe suggestions
5. **Workout Videos** - Link workout exercises to video library
6. **Product Links** - Connect recommendations to actual product pages

## 🐛 Troubleshooting

### Database Connection Error

- Verify `DATABASE_URL` is set correctly
- Check Neon database is accessible
- Ensure SSL is enabled for production

### Plan Not Generating

- Check user has completed onboarding
- Verify user record has required fields (age, weight, height, etc.)
- Check server logs for errors

### Mobile App Not Loading Plan

- Verify API endpoint URL is correct
- Check user ID is being passed correctly
- Ensure backend server is running
- Check network requests in React Native debugger

## 📚 File Structure

```
server/
├── migrations/
│   └── 001_personalization.sql
├── services/
│   └── personalizationService.js
├── routes/
│   └── personalization.js
├── db.js
└── index.js (updated with route)

AiFitnessExpo/src/
├── hooks/
│   └── usePlan.ts
├── components/
│   └── PlanDashboard.tsx
└── pages/
    └── Plans.tsx
```

---

**Ready to use!** The system is fully integrated and ready for testing. 🎉


