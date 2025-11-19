# 🔥 BOLT TASKS — Supabase, Auth, Stripe Integration

**IMPORTANT:** These tasks MUST be done in Bolt. Cursor cannot reliably handle these integrations.

---

## ✅ TASK A — SUPABASE DATABASE INTEGRATION (CRITICAL)

### 1. Connect Project to Supabase

```
Supabase URL: https://pthmddtyxdragzbtjeuu.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0aG1kZHR5eGRyYWd6YnRqZXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMDY1MjMsImV4cCI6MjA3ODc4MjUyM30.R0WHKlyrgF63n469hjL5ShjlwW9WtkKr5cBEGT1WDEs
Service Role Key: [Get from Supabase Dashboard → Settings → API]
```

### 2. Load ALL Migrations

Execute ALL SQL files in this order from `/supabase/migrations/`:

```
001_module_a_user_system.sql
002_module_b_nutrition_engine.sql
003_module_c_wellness_aimind.sql
004_module_d_fitness_engine.sql
005_module_e_analytics_ai_engine.sql
006_module_f_shopping_list_engine.sql
007_module_h_notifications_push.sql
010_module_m_workout_builder_engine.sql
011_module_r_home_dashboard_intelligence.sql
012_module_o_meditation_games_world.sql
013_module_p_rewards_gamification.sql
014_module_q_centralized_analytics.sql
015_module_s_subscriptions.sql
016_module_t_social_layer.sql
017_module_w_ai_recommendation_engine.sql
018_module_x_meals_macro_planner.sql
019_module_y_workout_auto_progression.sql
020_module_z_sleep_recovery_ai.sql
021_module_u_wearables_engine.sql
022_module_j_personalization_engine.sql
023_module_j_gamified_meditation_world.sql
024_module_j_gamified_meditation_world_rpc.sql
025_module_j_mindworld_rpc_functions.sql
026_module_j_streak_engine.sql
027_module_j_phase6_ai_personalization.sql
028_module_j_phase6b_weekly_revision.sql
029_module_j_phase7_realtime_optimizer.sql
030_module_j_phase8_workout_forecaster.sql
031_module_j_phase9b_recipe_ai.sql
032_module_12_streak_engine.sql
033_module_x_complete.sql
034_module_w_extended.sql
035_module_af_notification_ai.sql
036_module_af_notification_tables.sql
037_module_ac_gamified_meditation_world.sql
038_core_launch_schema.sql
039_fuel_module_enhanced.sql
040_move_module_enhanced.sql
041_ai_wellness_stress.sql
042_marketplace_integration.sql
043_workout_engine_polishing.sql
044_full_meal_planning_ai.sql
```

### 3. Validate Database Structure

After migrations, verify these tables exist:

**Core Tables:**
- `profiles`
- `users` (auth.users)
- `user_settings`
- `onboarding_answers`

**Nutrition Tables:**
- `foods`
- `user_foods`
- `recipes`
- `recipe_ingredients`
- `meal_logs`
- `meal_log_items`
- `daily_nutrition_summary`
- `shopping_lists`
- `shopping_list_items`
- `pantry_items`

**Fitness Tables:**
- `exercise_db`
- `exercise_categories`
- `workout_routines`
- `workout_exercises`
- `workout_logs`
- `workout_log_sets`
- `steps_logs`
- `exercise_alternatives`
- `weekly_training_goals`
- `workout_auto_regulations`

**Wellness Tables:**
- `mood_logs`
- `sleep_logs`
- `habits`
- `habit_logs`
- `journals`
- `gratitude_entries`
- `meditation_sessions`
- `meditation_sessions_ac`
- `mind_games`
- `mind_game_sessions`
- `meditation_worlds`
- `meditation_levels`
- `level_completions`

**AI & Analytics Tables:**
- `ai_recommendations`
- `ai_recommendations_wellness`
- `stress_scores`
- `user_state_cache`
- `analytics_daily_summary`
- `analytics_weekly_summary`
- `daily_summaries`
- `insights`

**Gamification Tables:**
- `user_progress`
- `badges`
- `user_badges`
- `xp_transactions`
- `mind_tokens`
- `mind_garden_streaks`
- `meditation_world_rewards`

**Social Tables:**
- `friends`
- `posts`
- `post_likes`
- `post_comments`
- `social_challenges`

**Notification Tables:**
- `user_devices`
- `notification_settings`
- `notifications`
- `queued_notifications`
- `notification_rules_wellness`

**Subscription Tables:**
- `user_subscriptions`
- `subscription_products`
- `subscription_prices`

**Meal Planning Tables:**
- `ai_recipes`
- `meal_plan_feedback`
- `nutrition_reports`
- `meal_plan_adaptations`
- `restaurant_meal_logs`
- `auto_macro_corrections`

**Marketplace Tables:**
- `ai_shop_recommendations`
- `shop_product_interactions`
- `shop_favorites`

### 4. Enable Row Level Security (RLS)

Ensure RLS is enabled on ALL tables. Verify policies:

- **User-owned tables:** `auth.uid() = user_id` for INSERT/SELECT/UPDATE/DELETE
- **Public read tables:** `SELECT USING (true)` for foods, exercises, exercise_categories
- **No public write:** All INSERT/UPDATE/DELETE require `auth.uid() = user_id`

### 5. Verify RPC Functions

Test these critical RPC functions exist and work:

- `calculate_bmr()`
- `calculate_tdee()`
- `build_personalization_plan()`
- `add_xp()`
- `add_tokens()`
- `increment_streak()`
- `update_daily_snapshot()`
- `generate_ai_recommendations()`
- `can_send_notification()`
- `queue_notification()`
- `auto_regulate_workout()`
- `generate_macro_correction()`

### 6. Create TypeScript Types

Generate `supabase.types.ts` file with all table types using Supabase CLI:

```bash
npx supabase gen types typescript --project-id pthmddtyxdragzbtjeuu > supabase.types.ts
```

### 7. Fix Migration Conflicts

If any migrations fail due to conflicts:
- Check for duplicate table/column names
- Use `CREATE TABLE IF NOT EXISTS` where appropriate
- Use `DO $$ ... END $$;` blocks for conditional ALTER TABLE statements
- Resolve any foreign key constraint issues

---

## ✅ TASK B — SUPABASE AUTHENTICATION (Email/Password)

### 1. Enable Auth Methods in Supabase Dashboard

- Go to Authentication → Providers
- Enable **Email** provider
- Enable **Magic Link** (optional, for passwordless login)
- Configure email templates (welcome, password reset)

### 2. Configure Auth Settings

- Set email confirmation: **Optional** (for faster onboarding)
- Set password reset: **Enabled**
- Set session duration: **7 days** (default)

### 3. Create Auth Trigger for Profiles

Ensure this trigger exists (should be in Module A migration):

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', 'User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4. Implement Auth in Expo (React Native)

Update `/src/lib/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### 5. Implement Auth Functions

Create/update `/src/services/auth.ts`:

```typescript
import { supabase } from '../lib/supabaseClient';

export async function signUp(email: string, password: string, metadata?: { name?: string }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'bluom://reset-password',
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
}
```

### 6. Add Auth State Listener

In your root component or AuthContext:

```typescript
useEffect(() => {
  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
  });

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session);
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

### 7. Create Profile Update Function

```typescript
export async function updateProfile(userId: string, updates: {
  username?: string;
  height_cm?: number;
  weight_kg?: number;
  goal?: string;
  activity_level?: string;
  birthdate?: string;
  gender?: string;
}) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

---

## ✅ TASK C — STRIPE SUBSCRIPTIONS (Premium Plans)

### 1. Set Up Stripe Account

- Create Stripe account (if not exists)
- Get API keys from Stripe Dashboard
- Add to environment variables:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`

### 2. Create Stripe Products

Create these products in Stripe Dashboard:

**Product 1: Free Plan**
- Name: "Free Plan"
- Price: €0.00 (one-time)
- Description: "Basic features"

**Product 2: Premium Monthly**
- Name: "Premium Monthly"
- Price: €8.09/month (recurring)
- Description: "Full access to all features"

**Product 3: Premium Annual**
- Name: "Premium Annual"
- Price: €4.50/month (billed annually = €54.00/year)
- Description: "Full access, best value"

**Product 4: Premium 3-Day Trial**
- Name: "Premium 3-Day Trial"
- Price: €0.00 for 3 days, then €8.09/month
- Description: "Try premium free for 3 days"

### 3. Sync Products to Supabase

Create/update `/server/routes/stripe.js`:

```javascript
import Stripe from 'stripe';
import { supabase } from '../supabase/client.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize products in Supabase
export async function initStripeProducts() {
  const products = await stripe.products.list();
  const prices = await stripe.prices.list();

  for (const product of products.data) {
    // Insert/update product
    await supabase.from('subscription_products').upsert({
      stripe_product_id: product.id,
      name: product.name,
      description: product.description,
      active: product.active,
    });

    // Insert/update prices
    const productPrices = prices.data.filter(p => p.product === product.id);
    for (const price of productPrices) {
      await supabase.from('subscription_prices').upsert({
        stripe_price_id: price.id,
        stripe_product_id: product.id,
        amount: price.unit_amount / 100, // Convert cents to euros
        currency: price.currency,
        interval: price.recurring?.interval,
        interval_count: price.recurring?.interval_count,
        active: price.active,
      });
    }
  }
}
```

### 4. Create Checkout Session Endpoint

```javascript
export async function createCheckoutSession(userId, priceId, trialDays = 0) {
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email, // Get from Supabase
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    subscription_data: trialDays > 0 ? {
      trial_period_days: trialDays,
    } : undefined,
    success_url: `bluom://subscription-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `bluom://subscription-cancel`,
    metadata: {
      user_id: userId,
    },
  });

  return session;
}
```

### 5. Set Up Stripe Webhooks

Create `/server/routes/stripe-webhooks.js`:

```javascript
import Stripe from 'stripe';
import { supabase } from '../supabase/client.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }

  res.json({ received: true });
}

async function handleCheckoutCompleted(session) {
  const userId = session.metadata.user_id;
  
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  
  await supabase.from('user_subscriptions').upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    is_active: subscription.status === 'active' || subscription.status === 'trialing',
  });
}

async function handleSubscriptionUpdate(subscription) {
  await supabase.from('user_subscriptions').update({
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    is_active: subscription.status === 'active' || subscription.status === 'trialing',
  }).eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionDeleted(subscription) {
  await supabase.from('user_subscriptions').update({
    status: 'canceled',
    is_active: false,
  }).eq('stripe_subscription_id', subscription.id);
}

async function handlePaymentFailed(invoice) {
  // Send notification to user
  const subscription = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', invoice.subscription)
    .single();
  
  if (subscription.data) {
    // Queue notification via Notification AI
    await supabase.rpc('queue_notification', {
      p_user_id: subscription.data.user_id,
      p_category: 'subscription',
      p_type: 'payment_failed',
      p_payload: {
        title: 'Payment Failed',
        body: 'Your subscription payment failed. Please update your payment method.',
      },
    });
  }
}
```

### 6. Create Customer Portal Endpoint

```javascript
export async function createPortalSession(userId) {
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (!subscription) throw new Error('No subscription found');

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `bluom://subscription-portal`,
  });

  return session;
}
```

### 7. Add Subscription Check Function

```typescript
export async function checkSubscriptionStatus(userId: string): Promise<{
  isPremium: boolean;
  plan: string | null;
  expiresAt: string | null;
  isTrial: boolean;
}> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    return {
      isPremium: false,
      plan: null,
      expiresAt: null,
      isTrial: false,
    };
  }

  return {
    isPremium: true,
    plan: data.plan_id || 'premium',
    expiresAt: data.current_period_end,
    isTrial: data.status === 'trialing',
  };
}
```

### 8. Add Premium Gating in Frontend

Create `/src/utils/premium.ts`:

```typescript
import { checkSubscriptionStatus } from '../services/subscriptions';

export async function requirePremium(userId: string, feature: string) {
  const status = await checkSubscriptionStatus(userId);
  
  if (!status.isPremium) {
    throw new Error(`Premium required for ${feature}. Upgrade to unlock.`);
  }
  
  return true;
}
```

---

## ✅ VERIFICATION CHECKLIST

After completing all tasks, verify:

- [ ] All migrations executed successfully
- [ ] All tables exist in Supabase
- [ ] RLS policies enabled on all tables
- [ ] Auth signup/login/logout works
- [ ] Profile created automatically on signup
- [ ] Stripe products synced to Supabase
- [ ] Checkout sessions create subscriptions
- [ ] Webhooks update subscription status
- [ ] Premium gating works in app
- [ ] Free trial activates correctly

---

**END OF BOLT TASKS**

