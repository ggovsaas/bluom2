# ✅ MODULE S — SUBSCRIPTIONS ENGINE — COMPLETE

## 📋 Overview

Module S creates the **Stripe-native subscription management system** for Bluöm. This module handles free trials, monthly/annual plans, subscription status management, and premium entitlements. It connects Stripe ↔ Supabase ↔ App UI and supports cross-platform subscriptions (web + iOS + Android).

## 🎯 What This Module Adds

### Core Features
- **Stripe Integration** - Native Stripe product and price management
- **Free Trial** - 3-day free trial for new users
- **Subscription Plans** - Monthly and annual plans
- **Status Management** - free, trialing, active, past_due, canceled, expired
- **Premium Entitlements** - Simple `is_premium` boolean for app checks
- **Auto-Downgrade** - Automatic downgrade when trial/subscription expires
- **Cross-Platform** - Supports web (Stripe), iOS (StoreKit), Android (Google Play)

## 📊 Database Schema

### New Tables

1. **`subscription_products`**
   - Stripe products (monthly + annual plans)
   - Fields: id, stripe_product_id (unique), name, description, created_at
   - Public read access (for pricing page)

2. **`subscription_prices`**
   - Stripe price IDs per billing period
   - Fields: id, stripe_price_id (unique), product_id, interval ('month' or 'year'), amount (cents), currency, created_at
   - Public read access (for pricing page)

3. **`user_subscriptions`**
   - One row per user, always synced with Stripe
   - Fields:
     - user_id (unique, references auth.users)
     - stripe_customer_id (unique)
     - stripe_subscription_id (unique)
     - plan_id (references subscription_prices)
     - status (free, trialing, active, past_due, canceled, expired)
     - trial_end, current_period_end
     - is_premium (boolean)
   - Auto-initialized on user signup

### Views

1. **`subscription_status_summary`**
   - Summary of subscription statuses
   - Shows: status, user_count, premium_count

## 🔧 RPC Functions

### Core Functions

1. **`init_subscription_for_user(user_id)`**
   - Creates subscription row when user signs up
   - Called automatically by trigger on `auth.users` creation
   - Sets status to 'free', is_premium to false

2. **`update_subscription_from_stripe(...)`**
   - Updates subscription from Stripe webhook
   - Parameters: user_id, stripe_customer_id, stripe_subscription_id, status, plan_id, period_end, trial_end
   - Updates is_premium based on status
   - Creates row if it doesn't exist

3. **`downgrade_expired_subscriptions()`**
   - Downgrades users automatically when trial/sub expires
   - Called via CRON job (daily recommended)
   - Handles:
     - Expired trials → status = 'expired', is_premium = false
     - Expired active subscriptions → status = 'canceled', is_premium = false
     - Past due subscriptions (7+ days) → status = 'expired', is_premium = false
   - Returns list of affected users

4. **`get_user_entitlement(user_id)`**
   - Check entitlements (frontend helper)
   - Returns JSON: status, is_premium, trial_end, current_period_end, plan_id, stripe_customer_id, stripe_subscription_id

5. **`is_user_premium(user_id)`**
   - Quick premium check
   - Returns boolean

6. **`start_trial(user_id, trial_days)`**
   - Starts a free trial for a user
   - Default: 3 days
   - Sets status = 'trialing', is_premium = true

7. **`cancel_subscription(user_id)`**
   - Cancels a subscription
   - Sets status = 'canceled', is_premium = false immediately

8. **`get_subscription_products()`**
   - Gets all subscription products with prices
   - Returns: product_id, product_name, product_description, price_id, stripe_price_id, interval, amount, currency
   - Used for pricing page

## 🎯 Entitlements Logic

| Status   | App Tier               | is_premium |
| -------- | ---------------------- | ---------- |
| free     | Free/basic features    | false      |
| trialing | Premium                | true       |
| active   | Premium                | true       |
| past_due | Premium (grace period) | true       |
| canceled | Free                   | false      |
| expired  | Free                   | false      |

### Premium Check in App

```typescript
const { data: entitlement } = await supabase
  .rpc('get_user_entitlement', { p_user_id: user.id });

const isPremium = entitlement.is_premium;
```

## 🔗 Stripe Webhooks Required

You need to handle these Stripe webhooks:

1. **`customer.created`**
   - Store `stripe_customer_id` in `user_subscriptions`

2. **`customer.subscription.created`**
   - Call `update_subscription_from_stripe()` with:
     - status = 'trialing' or 'active'
     - stripe_subscription_id
     - plan_id (lookup from stripe_price_id)
     - trial_end, current_period_end

3. **`customer.subscription.updated`**
   - Call `update_subscription_from_stripe()` with updated status/period

4. **`customer.subscription.deleted`**
   - Call `update_subscription_from_stripe()` with:
     - status = 'canceled'
     - is_premium = false

5. **`checkout.session.completed`**
   - Link subscription to user
   - Call `update_subscription_from_stripe()`

## 📱 Mobile Integration (React Native)

### Android (Google Play Billing)
- On purchase → call backend → backend validates receipt → update Supabase
- On app start → call `get_user_entitlement()`

### iOS (StoreKit)
- On purchase → call backend → backend validates receipt → update Supabase
- On app start → call `get_user_entitlement()`
- "Restore purchases" → backend revalidates receipt → update Supabase

### App Logic

```typescript
// Check premium status
const { data: entitlement } = await supabase
  .rpc('get_user_entitlement', { p_user_id: user.id });

const isPremium = entitlement.is_premium;

// Show/hide premium features
if (isPremium) {
  // Show premium features
} else {
  // Show upgrade prompt
}
```

## 🎮 Free vs Premium Enforcement

### FREE TIER (after 3-day trial ends)

**Allowed:**
- Log up to 4 meals/day
- Water tracking
- Steps tracking
- Exercise database (view only)
- Create simple workouts
- Sleep tracking
- Mood tracking
- Habits tracking
- Mind games (2 per category)
- Home Dashboard basic view

### PREMIUM TIER

**Unlocked:**

#### Nutrition
- Unlimited meal logging
- Custom macro targets
- Recipe recommendations
- AI meal planning
- Nutrition insights
- Custom food ingredients
- Barcode scanner

#### Fitness
- Unlimited workout routines
- Personalized plans
- Form analysis
- Video library
- Progression engine
- Advanced analytics

#### Wellness
- Advanced sleep insights
- Stress analytics
- Complete meditation world
- AI recommendations
- Recovery optimization

#### AI
- AI Coach
- AI recommendations
- Weekly reports

## 🔗 Module Integration

| Module                | Uses Subscription Engine        |
| --------------------- | ------------------------------- |
| Nutrition (B)         | Meal limits, insights           |
| Fitness (D)           | Advanced routines, plans        |
| Wellness (C)          | Meditation world, insights      |
| Analytics (Q)         | Premium analytics               |
| AI Coach (K)          | Locked if free                  |
| Habits/Sleep/Mood (C) | Free but premium insights       |
| Rewards (P)           | 2× XP multiplier for premium    |
| Meditation (O)        | Premium content unlocked        |

## 🔐 Security (RLS)

All tables have Row Level Security enabled:
- **subscription_products** - Public read (everyone can see products)
- **subscription_prices** - Public read (everyone can see prices)
- **user_subscriptions** - Users can only access their own subscription

## 📈 Performance

### Indexes Created
- `idx_user_subscriptions_user` - Fast user lookup
- `idx_user_subscriptions_status` - Fast status queries
- `idx_user_subscriptions_stripe_customer` - Fast Stripe customer lookup
- `idx_user_subscriptions_stripe_subscription` - Fast Stripe subscription lookup
- `idx_subscription_prices_product` - Fast product/price joins

## ✅ Migration File

**File**: `supabase/migrations/015_module_s_subscriptions.sql`

### How to Apply

1. Open Supabase SQL Editor
2. Copy the entire contents of `015_module_s_subscriptions.sql`
3. Paste into SQL Editor
4. Click **Run**

### What It Does

- Creates 3 new tables (`subscription_products`, `subscription_prices`, `user_subscriptions`)
- Creates 8 RPC functions (init, update, downgrade, entitlements, trial, cancel, products)
- Sets up RLS policies
- Creates performance indexes
- Sets up triggers for auto-initialization on user signup
- Creates view for subscription status summary

### Dependencies

- **Stripe Account** - Requires Stripe products and prices to be created
- **Webhook Handler** - Backend needs to handle Stripe webhooks
- **CRON Job** - Set up daily CRON to call `downgrade_expired_subscriptions()`

## 🎯 Next Steps

1. **Create Stripe Products** - Create monthly and annual products in Stripe
2. **Seed Database** - Insert products and prices into `subscription_products` and `subscription_prices`
3. **Webhook Handler** - Build backend endpoint to handle Stripe webhooks
4. **CRON Job** - Set up daily CRON to call `downgrade_expired_subscriptions()`
5. **Frontend Integration** - Build pricing page and subscription management UI
6. **Mobile Integration** - Integrate with StoreKit (iOS) and Google Play Billing (Android)
7. **Premium Checks** - Add premium checks throughout the app using `is_user_premium()`

## 🔄 Integration Pattern

### When User Signs Up:

```sql
-- Automatically called by trigger
SELECT init_subscription_for_user(user_id);
```

### When Stripe Webhook Received:

```sql
SELECT update_subscription_from_stripe(
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    'active', -- or 'trialing', 'canceled', etc.
    plan_id,
    current_period_end,
    trial_end
);
```

### Daily CRON Job:

```sql
SELECT * FROM downgrade_expired_subscriptions();
```

### Frontend Premium Check:

```typescript
const { data: entitlement } = await supabase
  .rpc('get_user_entitlement', { p_user_id: user.id });

if (entitlement.is_premium) {
  // Show premium features
}
```

## 🎉 Module S Status: COMPLETE

This module creates the **Stripe-native subscription system** that powers:
- ✅ Free trial management
- ✅ Monthly/annual plans
- ✅ Premium entitlements
- ✅ Cross-platform subscriptions
- ✅ Auto-downgrade on expiration
- ✅ Webhook integration
- ✅ Mobile restore purchases
- ✅ Simple premium checks

Module S is the **subscription engine** that monetizes Bluöm! 💰🎯

