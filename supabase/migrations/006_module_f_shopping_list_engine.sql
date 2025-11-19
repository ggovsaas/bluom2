-- =========================================================
-- MODULE F — SHOPPING LIST ENGINE (Advanced)
-- Smart grocery planning: recipes, meal plans, pantry, AI suggestions, budgeting
-- =========================================================

-- NOTE: Module B has basic shopping_lists and shopping_list_items
-- This module enhances them and adds advanced features

-- 1. ENHANCE EXISTING TABLES (from Module B) --------------

-- Add missing columns to shopping_lists if they don't exist
DO $$
BEGIN
    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shopping_lists' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE shopping_lists ADD COLUMN updated_at timestamptz DEFAULT timezone('utc', now());
    END IF;
END $$;

-- Add missing columns to shopping_list_items if they don't exist
DO $$
BEGIN
    -- Add notes if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shopping_list_items' AND column_name = 'notes'
    ) THEN
        ALTER TABLE shopping_list_items ADD COLUMN notes text;
    END IF;
    
    -- Add estimated_price if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shopping_list_items' AND column_name = 'estimated_price'
    ) THEN
        ALTER TABLE shopping_list_items ADD COLUMN estimated_price numeric;
    END IF;
    
    -- Rename checked to is_checked if needed (for consistency)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shopping_list_items' AND column_name = 'checked'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shopping_list_items' AND column_name = 'is_checked'
    ) THEN
        ALTER TABLE shopping_list_items RENAME COLUMN checked TO is_checked;
    END IF;
END $$;

-- 2. NEW TABLES -------------------------------------------

-- F3 — pantry_items
CREATE TABLE IF NOT EXISTS pantry_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    item_name text NOT NULL,
    quantity text,
    category text,
    expires_on date,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- F4 — ai_suggestions (shopping-specific, different from ai_meal_suggestions)
CREATE TABLE IF NOT EXISTS ai_suggestions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    suggestion_type text,     -- recipe_based, macro_based, habit_based, pantry_based
    item_name text,
    reason text,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- F5 — favorite_items
CREATE TABLE IF NOT EXISTS favorite_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    item_name text NOT NULL,
    default_category text,
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, item_name)
);

-- F6 — auto_sorted_rules
CREATE TABLE IF NOT EXISTS auto_sorted_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    category text NOT NULL,
    priority int NOT NULL,     -- 1 = first in list
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, category)
);

-- 3. RLS (Row-Level Security) ----------------------------

ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_sorted_rules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "users_manage_own_pantry"
ON pantry_items
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_ai_suggestions"
ON ai_suggestions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_favorites"
ON favorite_items
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_sort_rules"
ON auto_sorted_rules
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. INDEXES ----------------------------------------------

CREATE INDEX IF NOT EXISTS idx_pantry_items_user ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_expires ON pantry_items(expires_on) WHERE expires_on IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user ON ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_items_user ON favorite_items(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_sorted_rules_user ON auto_sorted_rules(user_id);

-- 5. SEED DEFAULT SORT RULES ------------------------------

-- Function to seed default rules for a user
CREATE OR REPLACE FUNCTION seed_default_sort_rules(uid uuid)
RETURNS void
LANGUAGE sql
AS $$
    INSERT INTO auto_sorted_rules(user_id, category, priority)
    VALUES
        (uid, 'produce', 1),
        (uid, 'meat', 2),
        (uid, 'dairy', 3),
        (uid, 'pantry', 4),
        (uid, 'frozen', 5),
        (uid, 'supplements', 6)
    ON CONFLICT (user_id, category) DO NOTHING;
$$;

-- 6. RPC FUNCTIONS ---------------------------------------

-- F-RPC1 — create_shopping_list(name)
-- Works with both BIGSERIAL (Module B) and uuid
CREATE OR REPLACE FUNCTION create_shopping_list(list_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    list_id_result text;
    id_type text;
BEGIN
    -- Check if using uuid or bigserial for shopping_lists
    SELECT data_type INTO id_type
    FROM information_schema.columns 
    WHERE table_name = 'shopping_lists' AND column_name = 'id';
    
    IF id_type = 'uuid' THEN
        INSERT INTO shopping_lists (user_id, name)
        VALUES (auth.uid(), list_name)
        RETURNING id::text INTO list_id_result;
    ELSIF id_type = 'bigint' THEN
        -- Module B uses BIGSERIAL
        INSERT INTO shopping_lists (user_id, name)
        VALUES (auth.uid(), list_name)
        RETURNING id::text INTO list_id_result;
    ELSE
        RAISE EXCEPTION 'Shopping lists table id type not recognized: %', id_type;
    END IF;
    
    RETURN list_id_result;
END;
$$;

-- F-RPC2 — add_shopping_item(list_id, name, qty, category, notes)
-- Works with both BIGSERIAL (Module B) and uuid
CREATE OR REPLACE FUNCTION add_shopping_item(
    list_id_param text,
    name text,
    qty text DEFAULT NULL,
    category text DEFAULT NULL,
    notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    list_id_type text;
BEGIN
    -- Check if list_id column is bigint or uuid
    SELECT data_type INTO list_id_type
    FROM information_schema.columns 
    WHERE table_name = 'shopping_list_items' AND column_name = 'list_id';
    
    IF list_id_type = 'bigint' THEN
        -- Module B uses BIGINT
        INSERT INTO shopping_list_items(
            list_id, user_id, item_name, quantity, category, notes
        )
        VALUES (
            list_id_param::bigint, auth.uid(), name, qty, category, notes
        );
    ELSIF list_id_type = 'uuid' THEN
        -- Enhanced version uses UUID
        INSERT INTO shopping_list_items(
            list_id, user_id, item_name, quantity, category, notes
        )
        VALUES (
            list_id_param::uuid, auth.uid(), name, qty, category, notes
        );
    ELSE
        RAISE EXCEPTION 'Shopping list items list_id type not recognized: %', list_id_type;
    END IF;
END;
$$;

-- F-RPC3 — toggle_item_check(item_id)
-- Works with both BIGSERIAL (Module B) and uuid
CREATE OR REPLACE FUNCTION toggle_item_check(item_id text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    id_type text;
BEGIN
    -- Check if id column is bigint or uuid
    SELECT data_type INTO id_type
    FROM information_schema.columns 
    WHERE table_name = 'shopping_list_items' AND column_name = 'id';
    
    IF id_type = 'bigint' THEN
        UPDATE shopping_list_items
        SET is_checked = NOT is_checked
        WHERE id = item_id::bigint 
          AND user_id = auth.uid();
    ELSIF id_type = 'uuid' THEN
        UPDATE shopping_list_items
        SET is_checked = NOT is_checked
        WHERE id = item_id::uuid 
          AND user_id = auth.uid();
    ELSE
        RAISE EXCEPTION 'Shopping list items id type not recognized: %', id_type;
    END IF;
END;
$$;

-- F-RPC4 — autosort_list(list_id)
-- Returns items sorted by category priority
CREATE OR REPLACE FUNCTION autosort_list(list_id_param uuid)
RETURNS TABLE (
    id bigint,
    list_id bigint,
    user_id uuid,
    item_name text,
    quantity text,
    category text,
    notes text,
    is_checked boolean,
    estimated_price numeric,
    added_from_recipe boolean,
    created_at timestamptz
)
LANGUAGE sql
AS $$
    SELECT 
        sli.id,
        sli.list_id,
        sli.user_id,
        sli.item_name,
        sli.quantity,
        sli.category,
        sli.notes,
        sli.is_checked,
        sli.estimated_price,
        sli.added_from_recipe,
        sli.created_at
    FROM shopping_list_items sli
    LEFT JOIN auto_sorted_rules asr
        ON sli.category = asr.category 
        AND asr.user_id = auth.uid()
    WHERE sli.list_id = list_id_param
      AND sli.user_id = auth.uid()
    ORDER BY 
        COALESCE(asr.priority, 99), 
        sli.item_name;
$$;

-- F-RPC5 — suggest_missing_items()
CREATE OR REPLACE FUNCTION suggest_missing_items()
RETURNS TABLE (
    id uuid,
    user_id uuid,
    suggestion_type text,
    item_name text,
    reason text,
    created_at timestamptz
)
LANGUAGE sql
AS $$
    SELECT 
        ai.id,
        ai.user_id,
        ai.suggestion_type,
        ai.item_name,
        ai.reason,
        ai.created_at
    FROM ai_suggestions ai
    WHERE ai.user_id = auth.uid()
    ORDER BY ai.created_at DESC;
$$;

-- F-RPC6 — add_to_favorites(item_name, category)
CREATE OR REPLACE FUNCTION add_to_favorites(item_name text, category text DEFAULT NULL)
RETURNS void
LANGUAGE sql
AS $$
    INSERT INTO favorite_items (user_id, item_name, default_category)
    VALUES (auth.uid(), item_name, category)
    ON CONFLICT (user_id, item_name) DO UPDATE
    SET default_category = EXCLUDED.default_category;
$$;

-- F-RPC7 — add_from_favorites(list_id, favorite_id)
CREATE OR REPLACE FUNCTION add_from_favorites(list_id_param uuid, favorite_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    fav_item_name text;
    fav_category text;
BEGIN
    SELECT item_name, default_category
    INTO fav_item_name, fav_category
    FROM favorite_items
    WHERE id = favorite_id AND user_id = auth.uid();
    
    IF fav_item_name IS NOT NULL THEN
        PERFORM add_shopping_item(list_id_param, fav_item_name, NULL, fav_category, NULL);
    END IF;
END;
$$;

-- F-RPC8 — check_pantry(item_name)
-- Returns true if item exists in pantry
CREATE OR REPLACE FUNCTION check_pantry(item_name text)
RETURNS boolean
LANGUAGE sql
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM pantry_items 
        WHERE user_id = auth.uid() 
          AND LOWER(item_name) = LOWER(pantry_items.item_name)
          AND (expires_on IS NULL OR expires_on >= CURRENT_DATE)
    );
$$;

-- F-RPC9 — add_pantry_item(item_name, quantity, category, expires_on)
CREATE OR REPLACE FUNCTION add_pantry_item(
    item_name text,
    quantity text DEFAULT NULL,
    category text DEFAULT NULL,
    expires_on date DEFAULT NULL
)
RETURNS void
LANGUAGE sql
AS $$
    INSERT INTO pantry_items (user_id, item_name, quantity, category, expires_on)
    VALUES (auth.uid(), item_name, quantity, category, expires_on);
$$;

-- F-RPC10 — generate_ai_suggestions()
-- This is a placeholder - actual AI logic would be in backend
-- Frontend/backend calls this after generating suggestions
CREATE OR REPLACE FUNCTION save_ai_suggestion(
    suggestion_type text,
    item_name text,
    reason text
)
RETURNS void
LANGUAGE sql
AS $$
    INSERT INTO ai_suggestions (user_id, suggestion_type, item_name, reason)
    VALUES (auth.uid(), suggestion_type, item_name, reason);
$$;

-- 7. TRIGGER: Auto-update updated_at on shopping_lists -----

CREATE OR REPLACE FUNCTION update_shopping_list_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_shopping_lists_timestamp'
    ) THEN
        CREATE TRIGGER update_shopping_lists_timestamp
        BEFORE UPDATE ON shopping_lists
        FOR EACH ROW
        EXECUTE FUNCTION update_shopping_list_timestamp();
    END IF;
END $$;

