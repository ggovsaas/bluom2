-- =========================================================
-- MARKETPLACE INTEGRATION (Shopify + WooCommerce)
-- AI recommendations, product tracking, no inventory storage
-- =========================================================

-- AI shop recommendations
CREATE TABLE IF NOT EXISTS ai_shop_recommendations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id text NOT NULL,
    product_title text,
    product_image_url text,
    source text NOT NULL CHECK (source IN ('shopify', 'woocommerce')),
    category text, -- 'supplements', 'fitness_gear', 'sleep_tools', 'stress_tools', 'apparel', 'notebooks', 'bundles'
    reasoning text,
    priority int DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    clicked boolean DEFAULT false,
    purchased boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- User product interactions (for learning)
CREATE TABLE IF NOT EXISTS shop_product_interactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id text NOT NULL,
    source text NOT NULL CHECK (source IN ('shopify', 'woocommerce')),
    interaction_type text NOT NULL CHECK (interaction_type IN ('viewed', 'clicked', 'added_to_cart', 'purchased')),
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Product favorites (user-saved products)
CREATE TABLE IF NOT EXISTS shop_favorites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id text NOT NULL,
    source text NOT NULL CHECK (source IN ('shopify', 'woocommerce')),
    product_title text,
    product_image_url text,
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, product_id, source)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_shop_recommendations_user ON ai_shop_recommendations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_shop_recommendations_priority ON ai_shop_recommendations(user_id, priority DESC, clicked) WHERE clicked = false;
CREATE INDEX IF NOT EXISTS idx_shop_interactions_user ON shop_product_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_favorites_user ON shop_favorites(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE ai_shop_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_product_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_shop_recommendations" ON ai_shop_recommendations
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_shop_interactions" ON shop_product_interactions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_shop_favorites" ON shop_favorites
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RPC: Generate AI shop recommendations
CREATE OR REPLACE FUNCTION generate_ai_shop_recommendations(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_stress_level text;
    v_sleep_avg numeric;
    v_mood_avg numeric;
    v_goal text;
    v_meditation_count int;
    v_workout_frequency int;
BEGIN
    -- Get user state from cache
    SELECT stress_level, habit_completion_rate INTO v_stress_level, v_meditation_count
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
    
    -- Generate recommendations based on state
    -- Poor sleep → sleep tools
    IF v_sleep_avg < 6 THEN
        INSERT INTO ai_shop_recommendations (user_id, product_id, product_title, source, category, reasoning, priority)
        VALUES 
            (p_user_id, 'sleep_mask_001', 'Sleep Mask', 'shopify', 'sleep_tools', 'You''ve been sleeping less than 6h. A sleep mask can improve sleep quality.', 5),
            (p_user_id, 'magnesium_001', 'Magnesium Supplement', 'shopify', 'supplements', 'Magnesium supports better sleep and recovery.', 4);
    END IF;
    
    -- High stress → stress tools
    IF v_stress_level = 'high' THEN
        INSERT INTO ai_shop_recommendations (user_id, product_id, product_title, source, category, reasoning, priority)
        VALUES 
            (p_user_id, 'stress_ball_001', 'Stress Relief Ball', 'shopify', 'stress_tools', 'High stress detected. A stress ball can help manage tension.', 5),
            (p_user_id, 'essential_oils_001', 'Calming Essential Oils', 'shopify', 'stress_tools', 'Essential oils can reduce stress and improve mood.', 4);
    END IF;
    
    -- Low mood → mood boosters
    IF v_mood_avg < 2.5 THEN
        INSERT INTO ai_shop_recommendations (user_id, product_id, product_title, source, category, reasoning, priority)
        VALUES 
            (p_user_id, 'gratitude_journal_001', 'Gratitude Journal', 'shopify', 'notebooks', 'Journaling can improve mood and mental clarity.', 4);
    END IF;
    
    -- Bulking goal → supplements
    IF v_goal ILIKE '%bulk%' OR v_goal ILIKE '%gain%' THEN
        INSERT INTO ai_shop_recommendations (user_id, product_id, product_title, source, category, reasoning, priority)
        VALUES 
            (p_user_id, 'creatine_001', 'Creatine Monohydrate', 'shopify', 'supplements', 'Creatine supports muscle growth and strength gains.', 4),
            (p_user_id, 'protein_powder_001', 'Whey Protein', 'shopify', 'supplements', 'Extra protein supports muscle building during bulking.', 3);
    END IF;
    
    -- Cutting goal → low-cal options
    IF v_goal ILIKE '%cut%' OR v_goal ILIKE '%lose%' THEN
        INSERT INTO ai_shop_recommendations (user_id, product_id, product_title, source, category, reasoning, priority)
        VALUES 
            (p_user_id, 'meal_prep_containers_001', 'Meal Prep Containers', 'shopify', 'fitness_gear', 'Meal prep helps control calories during cutting.', 4);
    END IF;
END;
$$;

-- =========================================================
-- MARKETPLACE INTEGRATION — COMPLETE
-- =========================================================

