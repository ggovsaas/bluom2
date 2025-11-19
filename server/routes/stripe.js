// server/routes/stripe.js
// Stripe integration routes: checkout, portal, webhooks

import express from "express";
import Stripe from "stripe";
import bodyParser from "body-parser";
import { supabaseAdmin } from "../supabase/adminClient.js";

const router = express.Router();

// Lazy initialization of Stripe client
let stripe = null;
function getStripe() {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY not set in .env');
    }
    stripe = new Stripe(secretKey, {
      apiVersion: "2023-10-16"
    });
  }
  return stripe;
}

// ⚠️ These MUST match your Stripe price IDs from Stripe Dashboard
function getPriceIds() {
  const PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY;
  const PRICE_YEARLY = process.env.STRIPE_PRICE_YEARLY;
  
  if (!PRICE_MONTHLY || !PRICE_YEARLY) {
    throw new Error("Stripe price IDs not configured. Please set STRIPE_PRICE_MONTHLY and STRIPE_PRICE_YEARLY in .env");
  }
  
  return { PRICE_MONTHLY, PRICE_YEARLY };
}

// ---------- CREATE CHECKOUT SESSION ----------
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { user_id, plan } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    const { PRICE_MONTHLY, PRICE_YEARLY } = getPriceIds();
    const priceId = plan === "yearly" ? PRICE_YEARLY : PRICE_MONTHLY;

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.APP_URL || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/cancel`,
      metadata: { user_id }
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error("Error creating checkout session:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- PORTAL SESSION ----------
router.post("/create-portal-session", async (req, res) => {
  try {
    const { customer_id } = req.body;

    if (!customer_id) {
      return res.status(400).json({ error: "Missing customer_id" });
    }

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: customer_id,
      return_url: `${process.env.APP_URL || "http://localhost:3000"}/profile`
    });

    res.json({ url: portalSession.url });

  } catch (err) {
    console.error("Portal error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- WEBHOOK HANDLER ----------
// Must use raw body parser for Stripe webhook signature verification
router.post("/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).send("Missing stripe-signature header");
  }

  let event;

  try {
      event = getStripe().webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const eventType = event.type;
  const data = event.data.object;

  try {
    switch (eventType) {
      // Checkout finished successfully
      case "checkout.session.completed": {
        const userId = data.metadata?.user_id;
        const customerId = data.customer;

        if (userId && customerId) {
          // Update profile with Stripe customer ID
          await supabaseAdmin
            .from("profiles")
            .update({
              stripe_customer_id: customerId,
            })
            .eq("id", userId);

          // Get subscription from checkout session
          if (data.subscription) {
            const subscription = await getStripe().subscriptions.retrieve(data.subscription);
            const { PRICE_YEARLY } = getPriceIds();
            
            // Update or create subscription record
            await supabaseAdmin
              .from("subscriptions")
              .upsert({
                user_id: userId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscription.id,
                status: subscription.status,
                plan: subscription.items.data[0]?.price.id === PRICE_YEARLY ? "premium_yearly" : "premium_monthly",
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
                updated_at: new Date().toISOString()
              }, {
                onConflict: "user_id"
              });
          }
        }
        break;
      }

      // Subscription activated or updated
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const customerId = data.customer;
        const status = data.status;
        const subscriptionId = data.id;

        // Find user by Stripe customer ID
        const { data: user, error: userError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (user && !userError) {
          // Determine plan type
          const { PRICE_YEARLY } = getPriceIds();
          const priceId = data.items?.data[0]?.price?.id;
          const plan = priceId === PRICE_YEARLY ? "premium_yearly" : "premium_monthly";

          await supabaseAdmin
            .from("subscriptions")
            .upsert({
              user_id: user.id,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: status,
              plan: plan,
              current_period_end: new Date(data.current_period_end * 1000).toISOString(),
              trial_end: data.trial_end ? new Date(data.trial_end * 1000).toISOString() : null,
              updated_at: new Date().toISOString()
            }, {
              onConflict: "user_id"
            });
        }
        break;
      }

      // Subscription canceled
      case "customer.subscription.deleted": {
        const customerId = data.customer;

        const { data: user, error: userError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (user && !userError) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ 
              status: "canceled",
              updated_at: new Date().toISOString()
            })
            .eq("user_id", user.id);
        }
        break;
      }

      // Invoice payment succeeded
      case "invoice.payment_succeeded": {
        const customerId = data.customer;
        const subscriptionId = data.subscription;

        if (subscriptionId) {
          const { data: user } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (user) {
            await supabaseAdmin
              .from("subscriptions")
              .update({
                status: "active",
                updated_at: new Date().toISOString()
              })
              .eq("user_id", user.id);
          }
        }
        break;
      }

      // Invoice payment failed
      case "invoice.payment_failed": {
        const customerId = data.customer;
        const subscriptionId = data.subscription;

        if (subscriptionId) {
          const { data: user } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (user) {
            await supabaseAdmin
              .from("subscriptions")
              .update({
                status: "past_due",
                updated_at: new Date().toISOString()
              })
              .eq("user_id", user.id);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    res.json({ received: true });

  } catch (err) {
    console.error("Webhook processing error:", err);
    return res.status(500).send("Webhook handler failed");
  }
});

export default router;


