// AiFitnessExpo/src/utils/stripe.ts
// Stripe integration utilities for Expo/React Native

import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Start Stripe checkout session (Expo)
 */
export async function startCheckout(plan: "monthly" | "yearly") {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const res = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, plan })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to create checkout session");
    }

    const data = await res.json();
    
    // Open Stripe Checkout in browser
    if (data.url) {
      await WebBrowser.openBrowserAsync(data.url);
    } else {
      throw new Error("No checkout URL received");
    }
  } catch (error) {
    console.error("Checkout error:", error);
    throw error;
  }
}

/**
 * Open Stripe Customer Portal for subscription management (Expo)
 */
export async function openCustomerPortal() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get user's Stripe customer ID from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      throw new Error("No Stripe customer ID found. Please contact support.");
    }

    const res = await fetch(`${API_URL}/api/stripe/create-portal-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: profile.stripe_customer_id })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to create portal session");
    }

    const data = await res.json();
    
    // Open Stripe Customer Portal in browser
    if (data.url) {
      await WebBrowser.openBrowserAsync(data.url);
    } else {
      throw new Error("No portal URL received");
    }
  } catch (error) {
    console.error("Portal error:", error);
    throw error;
  }
}


