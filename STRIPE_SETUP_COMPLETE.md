# 🎯 STRIPE INTEGRATION - COMPLETE SETUP GUIDE

## ✅ STEP 1 - Install ngrok (Mac)

```bash
brew install ngrok/ngrok/ngrok
```

Authenticate:
```bash
ngrok config add-authtoken 35cHT5G3rXfvnUr3t4cuXOVA8Px_7U6LTRQYDe5GFArLZVqhk
```

Run webhook tunnel:
```bash
ngrok http 3000
```

Webhook URL format: `https://[id].ngrok-free.app/api/stripe/webhook`

---

## ✅ STEP 2 - Create `server/routes/stripe.js`

**Status**: ❌ **NOT CREATED YET**

**File to create**: `server/routes/stripe.js`

**Includes**:
- Checkout session creation
- Customer portal session
- Webhook handler
- Subscription state updater (Supabase)

**Key features**:
- `POST /api/stripe/create-checkout-session`
- `POST /api/stripe/create-portal-session`
- `POST /api/stripe/webhook`

**Webhook events handled**:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

## ✅ STEP 3 - Register Stripe Routes

**Status**: ❌ **NOT ADDED YET**

**File to modify**: `server/index.js`

**Add**:
```js
import stripeRoutes from "./routes/stripe.js";
app.use("/api/stripe", stripeRoutes);
```

---

## ✅ STEP 4 - Create Admin Client

**Status**: ❌ **NOT CREATED YET**

**File to create**: `server/supabase/adminClient.js`

**Purpose**: Supabase client with service role key for admin operations

---

## ✅ STEP 5 - Environment Variables

**Status**: ⚠️ **NEEDS VERIFICATION**

**Required in `.env`**:

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx  # Add your Stripe secret key here
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Add your webhook secret here
STRIPE_PRICE_MONTHLY=price_xxxxx
STRIPE_PRICE_YEARLY=price_xxxxx

# App
APP_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://pthmddtyxdragzbtjeuu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0aG1kZHR5eGRyYWd6YnRqZXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMDY1MjMsImV4cCI6MjA3ODc4MjUyM30.R0WHKlyrgF63n469hjL5ShjlwW9WtkKr5cBEGT1WDEs
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

**Note**: `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY` should be Stripe Price IDs (not amounts)

---

## ✅ STEP 6 - Frontend Upgrade Button

**Status**: ❌ **NOT IMPLEMENTED YET**

**Function to add**:
```ts
async function startCheckout(plan: "monthly" | "yearly") {
  const user = await supabase.auth.getUser();
  const user_id = user.data.user.id;
  const res = await fetch(`${API_URL}/stripe/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, plan })
  });
  const data = await res.json();
  window.location.href = data.url;
}
```

---

## 📋 SUPABASE VERIFICATION CHECKLIST

### Required Tables
- [ ] `profiles`
- [ ] `subscriptions`
- [ ] `foods`, `meal_logs`, `recipes`
- [ ] `exercise_library`, `workout_logs`
- [ ] `mood_logs`, `sleep_logs`, `habit_logs`
- [ ] `shopping_lists`, `pantry_items`
- [ ] `marketplace_products`
- [ ] `friends`, `posts`
- [ ] `ai_recommendations`
- [ ] `notifications`
- [ ] `admin_users` (NEW - needs creation)
- [ ] `global_app_settings` (NEW - needs creation)
- [ ] `content_library` (NEW - needs creation)

### Required RPC Functions
- [ ] `search_foods`
- [ ] `search_recipes`
- [ ] `search_exercises`
- [ ] `generate_meal_plan`
- [ ] `generate_workout_plan`
- [ ] `log_workout`
- [ ] `log_mood`, `log_sleep`, `log_habit`
- [ ] `admin_upload_content` (NEW)
- [ ] `stripe_sync_subscription` (NEW)

### Required Extensions
- [ ] `pgcrypto`
- [ ] `uuid-ossp`
- [ ] `pg_net`
- [ ] `pg_graphql`
- [ ] `pgjwt`
- [ ] `pgvector`

### Required RLS Policies
- [ ] All user tables: `user_id = auth.uid()`
- [ ] Admin tables: `role = 'admin'`
- [ ] Public tables: read access for all

### Required Indexes
- [ ] `foods (name)`
- [ ] `recipes (name)`
- [ ] `exercise_library (name)`
- [ ] `meal_logs (user_id, date)`
- [ ] `workout_logs (user_id, date)`
- [ ] `sleep_logs (user_id, date)`

### Required Storage Buckets
- [ ] `workouts_videos`
- [ ] `recipes_images`
- [ ] `marketplace_images`
- [ ] `meditation_audio`
- [ ] `admin_uploads`

---

## 🖥 ADMIN DASHBOARD MODULE

**Status**: ❌ **NOT CREATED YET**

### Required Tables
- `admin_users`
- `admin_roles`
- `admin_activity_logs`
- `global_app_settings`
- `content_library`

### Required Pages
- `/admin` - Login
- `/admin/dashboard`
- `/admin/workouts`
- `/admin/recipes`
- `/admin/meditation`
- `/admin/marketplace`
- `/admin/notifications`
- `/admin/settings`
- `/admin/users`
- `/admin/logs`

### Required Functions
- `admin_upload_content()`
- `admin_delete_content()`
- `admin_update_settings()`
- `admin_set_featured_content()`
- `admin_generate_ai_template()`
- `admin_push_notification()`
- `admin_overwrite_user_plan()`

---

## 🔧 CURSOR REPAIR PROMPT

**Status**: ⚠️ **READY TO USE**

**Key focus areas**:
1. Fix all 404 API calls
2. Replace dead Express routes with Supabase RPCs
3. Verify Supabase client usage everywhere
4. Implement missing API logic using Supabase RPCs
5. Fix food/exercise/recipe search features
6. Add loading UX, error handling
7. Validate all Supabase queries
8. Fix module imports for Expo
9. Remove old backend route references
10. Implement role-based access (free vs premium)
11. Integrate Stripe status from subscriptions table
12. Fix environment variable loading
13. Add admin dashboard placeholder routes
14. Fix RLS errors

---

## 📊 PROGRESS TRACKER

### Backend
- [ ] ngrok installed and configured
- [ ] `server/routes/stripe.js` created
- [ ] Stripe routes registered in `server/index.js`
- [ ] `server/supabase/adminClient.js` created
- [ ] Environment variables set

### Frontend
- [ ] Upgrade button implemented (Web)
- [ ] Upgrade button implemented (Expo)
- [ ] Stripe status check integrated
- [ ] Premium feature gating implemented

### Database
- [ ] All required tables verified
- [ ] All RPC functions verified
- [ ] All extensions enabled
- [ ] RLS policies verified
- [ ] Indexes created
- [ ] Storage buckets created

### Admin
- [ ] Admin tables created
- [ ] Admin dashboard pages created
- [ ] Admin functions implemented
- [ ] Admin RLS policies set

### Testing
- [ ] Stripe checkout flow tested
- [ ] Webhook events tested
- [ ] Subscription status updates tested
- [ ] Premium feature gating tested
- [ ] Admin dashboard tested

---

## 🚨 CRITICAL NEXT STEPS

1. **Install ngrok** and set up webhook tunnel
2. **Create Stripe routes file** (`server/routes/stripe.js`)
3. **Create admin client** (`server/supabase/adminClient.js`)
4. **Register Stripe routes** in `server/index.js`
5. **Set environment variables** in `.env`
6. **Get Stripe Price IDs** from Stripe Dashboard
7. **Configure webhook** in Stripe Dashboard
8. **Test checkout flow** end-to-end
9. **Verify Supabase tables** exist
10. **Create admin module** (if needed)

---

**Last Updated**: $(date)
**Status**: 📋 **READY TO IMPLEMENT**


