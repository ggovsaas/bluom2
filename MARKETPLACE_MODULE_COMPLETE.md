# ✅ MARKETPLACE MODULE (OPTION C3 — BALANCED) — COMPLETE

## Overview

The Marketplace Module uses a **BALANCED** approach:
- ✅ Products stored in Supabase (full control, search, filtering)
- ✅ AI recommendations based on user wellness data
- ✅ Shopping cart system
- ✅ Order tracking
- ✅ Optional Shopify/WooCommerce integration for checkout
- ✅ Product reviews and favorites

## Database Structure

### Core Tables

1. **`product_categories`** — Product categories (Supplements, Fitness Gear, Sleep Tools, etc.)
2. **`products`** — Main products table (stored in Supabase)
3. **`product_variants`** — Product variants (size, color, etc.)
4. **`product_reviews`** — User reviews and ratings

### User Interaction Tables

5. **`ai_shop_recommendations`** — AI-generated product recommendations
6. **`shop_product_interactions`** — Track views, clicks, cart adds, purchases
7. **`shopping_carts`** — User shopping carts
8. **`cart_items`** — Items in cart
9. **`shop_favorites`** — User favorite products

### Order Management

10. **`shop_orders`** — Order records
11. **`order_items`** — Items in each order

## Features

### ✅ AI Recommendations

Recommendations are generated based on:
- **Stress level** → Stress tools, essential oils
- **Sleep quality** → Sleep masks, magnesium
- **Mood** → Gratitude journals, mood boosters
- **Goals** → Supplements (bulking/cutting)
- **Workout frequency** → Recovery supplements
- **Habit completion** → Productivity tools

### ✅ Shopping Cart

- One cart per user
- Add/remove items
- Variant support (size, color, etc.)
- Calculate totals automatically
- Persist across sessions

### ✅ Product Management

- Full product catalog in Supabase
- Categories and tags
- Variants (size, color, etc.)
- Stock management
- Premium-only products
- Featured products
- External integration (Shopify/WooCommerce) optional

### ✅ Order Tracking

- Track all orders
- Order status (pending, processing, shipped, delivered)
- Integration with Shopify/WooCommerce orders
- Shipping and billing addresses
- Payment method tracking

## Integration Points

### With Wellness Data

- Uses `user_state_cache` for stress/sleep/mood
- Uses `mood_logs`, `sleep_logs` for recommendations
- Uses `workout_logs` for workout-related suggestions
- Uses `profiles.goal` for goal-based recommendations

### With Premium System

- `premium_only` flag on products
- Check subscription status before showing premium products
- Gate checkout for premium-only items

### With External E-commerce (Optional)

- `external_source` field: 'shopify' or 'woocommerce'
- `external_product_id` for linking
- `external_url` for direct product links
- `external_order_id` for order sync

## RPC Functions

1. **`generate_ai_shop_recommendations(user_id)`**
   - Generates recommendations based on user wellness state
   - Inserts into `ai_shop_recommendations` table

2. **`get_or_create_cart(user_id)`**
   - Gets existing cart or creates new one
   - Returns cart ID

3. **`calculate_cart_total(cart_id)`**
   - Calculates total price of all items in cart
   - Includes variant pricing

## Usage Examples

### Get AI Recommendations

```typescript
// Generate recommendations
await supabase.rpc('generate_ai_shop_recommendations', {
  p_user_id: userId,
});

// Get recommendations
const { data } = await supabase
  .from('ai_shop_recommendations')
  .select('*, products(*), product_categories(*)')
  .eq('user_id', userId)
  .eq('clicked', false)
  .order('priority', { ascending: false });
```

### Add to Cart

```typescript
// Get or create cart
const { data: cartId } = await supabase.rpc('get_or_create_cart', {
  p_user_id: userId,
});

// Add item
await supabase.from('cart_items').insert({
  cart_id: cartId,
  product_id: productId,
  variant_id: variantId, // optional
  quantity: 1,
});
```

### Checkout (External)

```typescript
// For Shopify/WooCommerce checkout
const product = await supabase
  .from('products')
  .select('*')
  .eq('id', productId)
  .single();

if (product.external_source === 'shopify') {
  // Redirect to Shopify checkout
  window.open(product.external_url);
} else if (product.external_source === 'woocommerce') {
  // Redirect to WooCommerce checkout
  window.open(product.external_url);
}
```

## Migration File

**File:** `045_marketplace_module_balanced.sql`

This migration creates all marketplace tables, indexes, RLS policies, and RPC functions.

## Next Steps

1. ✅ Run migration `045_marketplace_module_balanced.sql`
2. ✅ Populate `product_categories` (already pre-populated)
3. ✅ Add products to `products` table
4. ✅ Connect to Shopify/WooCommerce (optional)
5. ✅ Implement frontend UI for marketplace
6. ✅ Test AI recommendations
7. ✅ Test shopping cart
8. ✅ Test checkout flow

---

**MARKETPLACE MODULE — COMPLETE**

