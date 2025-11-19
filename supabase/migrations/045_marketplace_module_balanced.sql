-- =========================================================
-- MARKETPLACE MODULE (OPTION C3 — BALANCED)
-- Products stored in Supabase + Shopify/WooCommerce integration
-- AI recommendations, user interactions, favorites, checkout
-- =========================================================

-- Product categories
CREATE TABLE IF NOT EXISTS product_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    description text,
    icon text,
    order_index int DEFAULT 0,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Pre-populate categories
INSERT INTO product_categories (name, slug, description, order_index) VALUES
    ('Supplements', 'supplements', 'Protein, vitamins, minerals, and health supplements', 1),
    ('Fitness Gear', 'fitness-gear', 'Equipment, accessories, and workout tools', 2),
    ('Sleep Tools', 'sleep-tools', 'Sleep masks, white noise machines, and sleep aids', 3),
    ('Stress Tools', 'stress-tools', 'Stress balls, essential oils, and relaxation products', 4),
    ('Apparel', 'apparel', 'Workout clothes, activewear, and accessories', 5),
    ('Notebooks', 'notebooks', 'Journals, planners, and gratitude notebooks', 6),
    ('Bundles', 'bundles', 'Product bundles and special offers', 7)
ON CONFLICT (slug) DO NOTHING;

-- Products (stored in Supabase)
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    short_description text,
    category_id uuid REFERENCES product_categories(id),
    image_url text,
    gallery_urls text[] DEFAULT '{}',
    price numeric(10,2) NOT NULL,
    compare_at_price numeric(10,2), -- Original price if on sale
    currency text DEFAULT 'EUR',
    sku text,
    stock_quantity int DEFAULT 0,
    in_stock boolean DEFAULT true,
    featured boolean DEFAULT false,
    premium_only boolean DEFAULT false, -- Premium users only
    external_source text CHECK (external_source IN ('shopify', 'woocommerce', 'manual')),
    external_product_id text, -- Shopify/WooCommerce product ID
    external_url text, -- Direct link to product page
    tags text[] DEFAULT '{}',
    specifications jsonb DEFAULT '{}'::jsonb, -- {weight: '500g', dimensions: '...'}
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- Product variants (size, color, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name text NOT NULL, -- 'Small', 'Red', '500g', etc.
    price numeric(10,2),
    stock_quantity int DEFAULT 0,
    sku text,
    image_url text,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Product reviews
CREATE TABLE IF NOT EXISTS product_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title text,
    review_text text,
    verified_purchase boolean DEFAULT false,
    helpful_count int DEFAULT 0,
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(product_id, user_id) -- One review per user per product
);

-- AI shop recommendations (enhanced from 042)
CREATE TABLE IF NOT EXISTS ai_shop_recommendations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE SET NULL,
    category_id uuid REFERENCES product_categories(id) ON DELETE SET NULL,
    source text NOT NULL CHECK (source IN ('stress', 'sleep', 'mood', 'goal', 'habit', 'workout', 'nutrition')),
    reasoning text NOT NULL,
    priority int DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    clicked boolean DEFAULT false,
    purchased boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- User product interactions (enhanced)
CREATE TABLE IF NOT EXISTS shop_product_interactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    interaction_type text NOT NULL CHECK (interaction_type IN ('viewed', 'clicked', 'added_to_cart', 'removed_from_cart', 'purchased', 'reviewed')),
    metadata jsonb DEFAULT '{}'::jsonb, -- {variant_id, quantity, etc.}
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Shopping cart (in-app cart before checkout)
CREATE TABLE IF NOT EXISTS shopping_carts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id) -- One cart per user
);

-- Cart items
CREATE TABLE IF NOT EXISTS cart_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id uuid NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(cart_id, product_id, variant_id) -- One item per variant per cart
);

-- Product favorites (enhanced)
CREATE TABLE IF NOT EXISTS shop_favorites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, product_id)
);

-- Orders (track purchases)
CREATE TABLE IF NOT EXISTS shop_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_number text NOT NULL UNIQUE,
    status text NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    total_amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'EUR',
    shipping_address jsonb,
    billing_address jsonb,
    payment_method text,
    external_order_id text, -- Shopify/WooCommerce order ID
    external_source text CHECK (external_source IN ('shopify', 'woocommerce', 'manual')),
    created_at timestamptz DEFAULT timezone('utc', now()),
    updated_at timestamptz DEFAULT timezone('utc', now())
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name text NOT NULL, -- Denormalized for history
    product_price numeric(10,2) NOT NULL,
    quantity int NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_premium ON products(premium_only) WHERE premium_only = true;
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id, rating DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_shop_recommendations_user ON ai_shop_recommendations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_shop_recommendations_priority ON ai_shop_recommendations(user_id, priority DESC, clicked) WHERE clicked = false;
CREATE INDEX IF NOT EXISTS idx_shop_interactions_user ON shop_product_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_interactions_product ON shop_product_interactions(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_shop_favorites_user ON shop_favorites(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_orders_user ON shop_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- RLS Policies
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_shop_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_product_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read for categories and products
CREATE POLICY "public_read_categories" ON product_categories FOR SELECT USING (true);
CREATE POLICY "public_read_products" ON products FOR SELECT USING (true);
CREATE POLICY "public_read_variants" ON product_variants FOR SELECT USING (true);
CREATE POLICY "public_read_reviews" ON product_reviews FOR SELECT USING (true);

-- User-owned data
CREATE POLICY "users_own_recommendations" ON ai_shop_recommendations
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_interactions" ON shop_product_interactions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_cart" ON shopping_carts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_cart_items" ON cart_items
    FOR ALL USING (
        auth.uid() = (SELECT user_id FROM shopping_carts WHERE id = cart_id)
    ) WITH CHECK (
        auth.uid() = (SELECT user_id FROM shopping_carts WHERE id = cart_id)
    );

CREATE POLICY "users_own_favorites" ON shop_favorites
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_orders" ON shop_orders
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_order_items" ON order_items
    FOR ALL USING (
        auth.uid() = (SELECT user_id FROM shop_orders WHERE id = order_id)
    );

CREATE POLICY "users_own_reviews" ON product_reviews
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RPC Functions

-- RPC: Generate AI shop recommendations (enhanced)
CREATE OR REPLACE FUNCTION generate_ai_shop_recommendations(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_stress_level text;
    v_sleep_avg numeric;
    v_mood_avg numeric;
    v_goal text;
    v_habit_completion numeric;
    v_workout_frequency int;
BEGIN
    -- Get user state from cache
    SELECT stress_level, habit_completion_rate INTO v_stress_level, v_habit_completion
    FROM user_state_cache
    WHERE user_id = p_user_id;
    
    -- Get sleep average (last 7 days)
    SELECT AVG(hours) INTO v_sleep_avg
    FROM sleep_logs
    WHERE user_id = p_user_id
    AND date >= CURRENT_DATE - INTERVAL '7 days';
    
    -- Get mood average (last 7 days)
    SELECT AVG(mood) INTO v_mood_avg
    FROM mood_logs
    WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE - INTERVAL '7 days';
    
    -- Get user goal
    SELECT goal INTO v_goal
    FROM profiles
    WHERE id = p_user_id;
    
    -- Get workout frequency (last 7 days)
    SELECT COUNT(*) INTO v_workout_frequency
    FROM workout_logs
    WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE - INTERVAL '7 days';
    
    -- Generate recommendations based on state
    
    -- Poor sleep → sleep tools
    IF v_sleep_avg < 6 THEN
        INSERT INTO ai_shop_recommendations (user_id, category_id, source, reasoning, priority)
        SELECT p_user_id, pc.id, 'sleep', 
               'You''ve been sleeping less than 6h. A sleep mask can improve sleep quality.', 5
        FROM product_categories pc
        WHERE pc.slug = 'sleep-tools'
        ON CONFLICT DO NOTHING;
        
        INSERT INTO ai_shop_recommendations (user_id, category_id, source, reasoning, priority)
        SELECT p_user_id, pc.id, 'sleep',
               'Magnesium supports better sleep and recovery.', 4
        FROM product_categories pc
        WHERE pc.slug = 'supplements'
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- High stress → stress tools
    IF v_stress_level = 'high' THEN
        INSERT INTO ai_shop_recommendations (user_id, category_id, source, reasoning, priority)
        SELECT p_user_id, pc.id, 'stress',
               'High stress detected. A stress ball can help manage tension.', 5
        FROM product_categories pc
        WHERE pc.slug = 'stress-tools'
        ON CONFLICT DO NOTHING;
        
        INSERT INTO ai_shop_recommendations (user_id, category_id, source, reasoning, priority)
        SELECT p_user_id, pc.id, 'stress',
               'Essential oils can reduce stress and improve mood.', 4
        FROM product_categories pc
        WHERE pc.slug = 'stress-tools'
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Low mood → mood boosters
    IF v_mood_avg < 2.5 THEN
        INSERT INTO ai_shop_recommendations (user_id, category_id, source, reasoning, priority)
        SELECT p_user_id, pc.id, 'mood',
               'Journaling can improve mood and mental clarity.', 4
        FROM product_categories pc
        WHERE pc.slug = 'notebooks'
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Bulking goal → supplements
    IF v_goal ILIKE '%bulk%' OR v_goal ILIKE '%gain%' THEN
        INSERT INTO ai_shop_recommendations (user_id, category_id, source, reasoning, priority)
        SELECT p_user_id, pc.id, 'goal',
               'Creatine supports muscle growth and strength gains.', 4
        FROM product_categories pc
        WHERE pc.slug = 'supplements'
        ON CONFLICT DO NOTHING;
        
        INSERT INTO ai_shop_recommendations (user_id, category_id, source, reasoning, priority)
        SELECT p_user_id, pc.id, 'goal',
               'Extra protein supports muscle building during bulking.', 3
        FROM product_categories pc
        WHERE pc.slug = 'supplements'
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- High workout frequency → recovery supplements
    IF v_workout_frequency >= 5 THEN
        INSERT INTO ai_shop_recommendations (user_id, category_id, source, reasoning, priority)
        SELECT p_user_id, pc.id, 'workout',
               'You train frequently. Recovery supplements can help.', 3
        FROM product_categories pc
        WHERE pc.slug = 'supplements'
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$;

-- RPC: Get or create user cart
CREATE OR REPLACE FUNCTION get_or_create_cart(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_cart_id uuid;
BEGIN
    SELECT id INTO v_cart_id
    FROM shopping_carts
    WHERE user_id = p_user_id;
    
    IF v_cart_id IS NULL THEN
        INSERT INTO shopping_carts (user_id)
        VALUES (p_user_id)
        RETURNING id INTO v_cart_id;
    END IF;
    
    RETURN v_cart_id;
END;
$$;

-- RPC: Calculate cart total
CREATE OR REPLACE FUNCTION calculate_cart_total(p_cart_id uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    v_total numeric := 0;
BEGIN
    SELECT COALESCE(SUM(ci.quantity * COALESCE(pv.price, p.price)), 0)
    INTO v_total
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN product_variants pv ON pv.id = ci.variant_id
    WHERE ci.cart_id = p_cart_id;
    
    RETURN v_total;
END;
$$;

-- =========================================================
-- MARKETPLACE MODULE (BALANCED) — COMPLETE
-- =========================================================

