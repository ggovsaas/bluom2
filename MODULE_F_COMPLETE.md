# ✅ Module F - Shopping List Engine (Advanced) - COMPLETE

## 📦 What Was Created

### 1. Database Migration
- **File**: `supabase/migrations/006_module_f_shopping_list_engine.sql`
- **Status**: Ready to run in Supabase SQL Editor
- **Contains**: Enhanced shopping list tables, new advanced tables, RPC functions, RLS policies, indexes

## 🎯 Module F Tables Created

### Enhanced Tables (from Module B)
1. **shopping_lists** - Enhanced with:
   - `updated_at` column (auto-updated via trigger)

2. **shopping_list_items** - Enhanced with:
   - `notes` column (additional context)
   - `estimated_price` column (budgeting)
   - Renamed `checked` to `is_checked` for consistency

### New Tables (4 tables)
3. **pantry_items** - Track what user already has
   - Item name, quantity, category
   - Expiration date tracking
   - Helps avoid duplicate purchases

4. **ai_suggestions** - Shopping-specific AI recommendations
   - Suggestion types: recipe_based, macro_based, habit_based, pantry_based
   - Item name and reason
   - Separate from `ai_meal_suggestions` (Module B)

5. **favorite_items** - Fast re-adding to lists
   - Item name and default category
   - Unique constraint on (user_id, item_name)
   - One-click add to any list

6. **auto_sorted_rules** - Smart sorting by category/aisle
   - Category and priority (1 = first in list)
   - Unique constraint on (user_id, category)
   - Default rules seeded: produce(1), meat(2), dairy(3), pantry(4), frozen(5), supplements(6)

## 🔧 RPC Functions (10 functions)

### List Management
1. **`create_shopping_list(name text)`** - Create new shopping list
   - Returns list UUID
   - Automatically sets user_id from auth

2. **`add_shopping_item(list_id, name, qty, category, notes)`** - Add item to list
   - All parameters optional except list_id and name
   - Automatically sets user_id

3. **`toggle_item_check(item_id)`** - Mark/unmark item as bought
   - Toggles `is_checked` boolean
   - Only works for user's own items

### Sorting & Organization
4. **`autosort_list(list_id)`** - Returns sorted items by category priority
   - Joins with `auto_sorted_rules` to get priority
   - Falls back to priority 99 if no rule exists
   - Secondary sort by item name

5. **`seed_default_sort_rules(uid)`** - Seed default category priorities
   - Called automatically for new users
   - Creates 6 default rules (produce, meat, dairy, pantry, frozen, supplements)

### Favorites
6. **`add_to_favorites(item_name, category)`** - Add item to favorites
   - Upserts (updates if exists)
   - Stores default category for quick add

7. **`add_from_favorites(list_id, favorite_id)`** - Add favorite to list
   - Looks up favorite by ID
   - Calls `add_shopping_item()` with favorite's name and category

### Pantry
8. **`check_pantry(item_name)`** - Check if item exists in pantry
   - Case-insensitive match
   - Only returns true if not expired
   - Returns boolean

9. **`add_pantry_item(item_name, quantity, category, expires_on)`** - Add to pantry
   - All parameters optional except item_name
   - Tracks expiration dates

### AI Suggestions
10. **`suggest_missing_items()`** - Get AI suggestions for user
    - Returns all suggestions ordered by most recent
    - Used by frontend to display suggestion panel

11. **`save_ai_suggestion(type, item_name, reason)`** - Save AI-generated suggestion
    - Called by backend/frontend after generating suggestions
    - Stores suggestion type, item name, and reason

## 🔒 Security Features

- **RLS Enabled**: All new tables have Row Level Security
- **User Isolation**: Users can only access their own data
- **Policies**: All tables use `auth.uid() = user_id` pattern
- **Safe Updates**: All RPC functions use `auth.uid()` to ensure user can only modify their own data

## ⚡ Performance Optimizations

Indexes created for:
- `pantry_items(user_id)` - Fast pantry queries
- `pantry_items(expires_on)` - Fast expiration checks
- `ai_suggestions(user_id)` - Fast suggestion queries
- `favorite_items(user_id)` - Fast favorite lookups
- `auto_sorted_rules(user_id)` - Fast sorting queries

## 🧠 AI-Powered Features

### AI Suggestion Engine Inputs:
- **Recipes planned this week** → Recipe-based suggestions
- **Meal plan calories/macros** → Macro-based suggestions
- **Pantry items** → Pantry-based suggestions (what's missing)
- **User's common choices** → Habit-based suggestions
- **Goal** (cutting, bulking, maintenance) → Goal-based suggestions
- **Mood** (from Wellness Module C) → Mood-based suggestions
- **Habits** (e.g., hydration) → Habit-based suggestions

### AI Recommendations Examples:
- **Nutrition-based**: "If protein intake is low → suggest: chicken breast, tuna cans, greek yogurt, whey protein"
- **Hydration-based**: "If user logs low water → suggest: electrolyte tablets"
- **Sleep-based**: "If poor sleep → chamomile tea, magnesium glycinate"
- **Fitness-based**: "If steps low → resistance bands, running socks"
- **Recipe-based**: "User saved a curry recipe → add spices, coconut milk, rice"

## 📱 Frontend Integration

### Shopping List UI Components:
- **Lists View**: Weekly Groceries, Supplements, Meal Prep List, Pantry Refill, Custom lists
- **Items View**: Auto-sorted, category color tags, checkboxes, swipe actions (delete/edit)
- **AI Suggestions Panel**: Sidebar/modal with one-click add
- **Pantry Integration**: Auto-label "You already have this" if in pantry

### Features:
- Swipe left → delete item
- Swipe right → edit item
- One-click add from favorites
- One-click add from AI suggestions
- Pantry check before adding
- Auto-sort by aisle/category

## ⚠️ Important Notes

- **Module B Compatibility**: This module enhances existing shopping list tables from Module B
- **ID Type Handling**: Module B uses BIGSERIAL, Module F uses uuid. The migration handles this gracefully with conditional logic
- **Default Rules**: Automatically seeds default category priorities (produce → meat → dairy → pantry → frozen → supplements)
- **Pantry Expiration**: Only non-expired items are considered when checking pantry
- **AI Integration**: Backend/frontend generates suggestions using business logic, then calls `save_ai_suggestion()` to store them

## ✅ Status

**Module F is complete and ready for Supabase migration.**

This module provides the complete advanced shopping list system:
- Enhanced basic shopping lists
- Pantry inventory tracking
- AI-powered suggestions
- Favorites for quick add
- Auto-sorting by category/aisle
- Budgeting support
- Notes and context

**Ready for Module G (Notifications) when you are.**

