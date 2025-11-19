// src/utils/premium.ts
// Premium feature locking utilities

import { supabase } from '../lib/supabase';

export interface SubscriptionStatus {
  isPremium: boolean;
  status: string;
  plan: string | null;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
}

/**
 * Check if user has premium subscription
 */
export async function checkPremiumStatus(): Promise<SubscriptionStatus> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        isPremium: false,
        status: 'free',
        plan: null,
        trialEnd: null,
        currentPeriodEnd: null
      };
    }

    // Check subscription status
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("status, plan, trial_end, current_period_end")
      .eq("user_id", user.id)
      .single();

    if (error || !subscription) {
      // No subscription found, user is on free tier
      return {
        isPremium: false,
        status: 'free',
        plan: null,
        trialEnd: null,
        currentPeriodEnd: null
      };
    }

    // Determine premium status
    const isPremium = 
      subscription.status === "active" || 
      subscription.status === "trialing" || 
      subscription.status === "past_due";

    return {
      isPremium,
      status: subscription.status,
      plan: subscription.plan,
      trialEnd: subscription.trial_end,
      currentPeriodEnd: subscription.current_period_end
    };
  } catch (error) {
    console.error("Error checking premium status:", error);
    return {
      isPremium: false,
      status: 'free',
      plan: null,
      trialEnd: null,
      currentPeriodEnd: null
    };
  }
}

/**
 * Premium feature gate component props
 */
export interface PremiumGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

/**
 * Premium features list for reference
 */
export const PREMIUM_FEATURES = {
  nutrition: [
    "unlimited_meal_logging",
    "barcode_scanner",
    "ai_meal_builder",
    "recipe_recommendations",
    "macros_ai_insights"
  ],
  fitness: [
    "unlimited_workout_routines",
    "ai_workout_builder",
    "progression_ai",
    "video_workout_library"
  ],
  wellness: [
    "advanced_sleep_analysis",
    "stress_ai",
    "meditation_programs",
    "game_packs_beyond_default"
  ],
  analytics: [
    "advanced_reports",
    "predictions",
    "export"
  ],
  shopping: [
    "ai_suggestions",
    "budget_tracking",
    "autosorting"
  ]
} as const;


