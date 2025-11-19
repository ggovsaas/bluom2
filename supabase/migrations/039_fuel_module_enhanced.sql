-- =========================================================
-- FUEL MODULE ENHANCED
-- Additional tables for meal_log_items and enhanced food structure
-- =========================================================

-- Note: foods, recipes, recipe_items, meal_logs already exist in core schema
-- This migration adds meal_log_items and user_id to foods for custom foods

-- Add user_id to foods if it doesn't exist (for custom foods)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'foods' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE foods ADD COLUMN user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Meal log items (links foods/recipes to meal logs)
CREATE TABLE IF NOT EXISTS meal_log_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_log_id bigint NOT NULL REFERENCES meal_logs(id) ON DELETE CASCADE,
    food_id bigint REFERENCES foods(id) ON DELETE SET NULL,
    recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
    quantity numeric NOT NULL DEFAULT 1,
    calories int,
    protein numeric,
    carbs numeric,
    fat numeric,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_meal_log_items_meal_log ON meal_log_items(meal_log_id);
CREATE INDEX IF NOT EXISTS idx_meal_log_items_food ON meal_log_items(food_id);
CREATE INDEX IF NOT EXISTS idx_meal_log_items_recipe ON meal_log_items(recipe_id);

-- RLS Policy
ALTER TABLE meal_log_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_meal_log_items" ON meal_log_items
    FOR ALL USING (
        auth.uid() = (
            SELECT user_id FROM meal_logs WHERE id = meal_log_items.meal_log_id
        )
    ) WITH CHECK (
        auth.uid() = (
            SELECT user_id FROM meal_logs WHERE id = meal_log_items.meal_log_id
        )
    );

-- =========================================================
-- FUEL MODULE ENHANCED — COMPLETE
-- =========================================================

