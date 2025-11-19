# ✅ Module L - Recipe Engine (AI Meal Builder + Grocery Integration) - COMPLETE

## 📦 What Was Created

### 1. Database Migration
- **File**: `supabase/migrations/009_module_l_recipe_engine.sql`
- **Status**: Ready to run in Supabase SQL Editor
- **Contains**: Enhanced recipe tables, new ingredient/step tables, RPC functions, RLS policies, indexes

## 🎯 Module L Tables Created

### Enhanced Tables (from Module B)
1. **recipes** - Enhanced with:
   - `servings` - Number of servings (default 1)
   - `prep_time` - Preparation time in minutes
   - `cook_time` - Cooking time in minutes
   - `tags` - Array of tags (high_protein, keto, vegan, breakfast, quick, etc.)
   - `is_ai_generated` - Flag for AI-generated recipes

### New Tables (4 tables)
2. **ingredients** - All ingredients (user-created or system-verified)
   - Name, brand, serving_size (grams)
   - Nutrition: calories, protein, carbs, fats
   - is_verified flag (system verified vs user)
   - Can be user-specific or public (if verified)

3. **recipe_steps** - Ordered cooking instructions
   - Step number and instruction text
   - Unique constraint on (recipe_id, step_number)
   - Supports cook mode (step-by-step swiper)

4. **ai_generated_meals** - AI one-click meals
   - User request text ("Make me a 600-calorie lunch high in protein")
   - Generated meal JSONB (contains ingredients, nutrition, steps)
   - Links to user for personalization

5. **recipe_grocery_links** - Links recipes to shopping list items
   - Connects recipes to Module F shopping lists
   - Auto-generates grocery list from recipe ingredients
   - Tracks which shopping items came from which recipe

## 🔧 RPC Functions (10 functions)

### Ingredient Management
1. **`add_ingredient(...)`** - Add manual ingredient
   - Creates user-specific or public ingredient
   - Stores nutrition data

2. **`search_ingredients(search_term)`** - Search ingredients
   - Returns verified ingredients + user's own ingredients
   - Case-insensitive search on name and brand
   - Limited to 50 results

### Recipe Management
3. **`calculate_recipe_nutrition(ingredients_jsonb)`** - Calculate nutrition
   - Helper function that calculates total calories/macros
   - Based on ingredient amounts and serving sizes
   - Returns JSONB with totals

4. **`create_recipe(...)`** - Create recipe with automatic nutrition
   - Calculates nutrition from ingredients automatically
   - Inserts recipe with all metadata
   - Inserts recipe steps
   - Returns recipe ID (bigint from Module B)

5. **`add_recipe_step(recipe_id, step_number, instruction)`** - Add step
   - Upserts step (updates if step_number exists)
   - Returns step UUID

6. **`get_recipe_with_steps(recipe_id)`** - Get recipe with steps
   - Returns recipe JSONB with steps array
   - Steps ordered by step_number

7. **`get_recipe_ingredients(recipe_id)`** - Get all ingredients
   - Returns ingredients with nutrition data
   - Works with Module B structure (foods/user_foods)

### AI Meal Builder
8. **`save_ai_generated_meal(...)`** - Save AI-generated meal
   - Stores user request and generated meal JSONB
   - Returns meal UUID

9. **`get_user_ai_meals(user_id, limit)`** - Get user's AI meals
   - Returns recent AI-generated meals
   - Ordered by created_at DESC
   - Default limit: 20

### Grocery Integration
10. **`add_recipe_to_shopping_list(recipe_id, list_id)`** - Add to shopping list
    - Gets all recipe ingredients
    - Adds each to shopping list
    - Creates links in recipe_grocery_links
    - Handles both BIGSERIAL and uuid list IDs

## 🔒 Security Features

- **RLS Enabled**: All tables have Row Level Security
- **User Isolation**: Users can only access their own recipes and ingredients
- **Public Ingredients**: Verified ingredients are readable by all users
- **Policies**: 
  - Users manage their own ingredients (or use public verified ones)
  - Users manage their own recipe steps
  - Users manage their own AI meals
  - Users manage their own grocery links

## ⚡ Performance Optimizations

Indexes created for:
- `ingredients(user_id)` - Fast user ingredient queries
- `ingredients(is_verified)` - Fast verified ingredient queries
- `recipe_steps(recipe_id)` - Fast step lookups
- `ai_generated_meals(user_id)` - Fast AI meal queries
- `recipe_grocery_links(recipe_id)` - Fast recipe-shopping links
- `recipe_grocery_links(shopping_item_id)` - Fast shopping-recipe links

## 🧠 AI Meal Builder Features

### User Request Examples:
- "Make me a 600-calorie lunch high in protein"
- "Make a meal using eggs + spinach only"
- "Give me a 5-minute breakfast under 300 calories"
- "Create a vegan dinner under 500 calories"

### AI Integration:
- Uses personalization data from Module A (goals, preferences)
- Considers dietary restrictions and allergies
- Matches calorie and macro targets
- Generates complete recipe with:
  - Ingredients list with amounts
  - Nutrition breakdown
  - Step-by-step instructions
  - Prep and cook times
  - Tags (high_protein, quick, vegan, etc.)

### AI Chef Prompt (for backend):
```
You are the Bluöm AI Chef.
Generate a recipe that meets: {goal}.
User context: {nutrition profile}, allergies: {allergies}.
Return ingredients (grams), macros, calories, and step-by-step instructions.
```

## 🛒 Shopping List Integration

### Auto-Generate Grocery List:
1. User selects recipe
2. Clicks "Add to Shopping List"
3. System calls `add_recipe_to_shopping_list()`
4. All ingredients added to shopping list
5. Links created in `recipe_grocery_links`
6. Items grouped by category (produce, dairy, protein, etc.)

### Features:
- **One-click add** - Recipe ingredients → shopping list
- **Category grouping** - Ingredients organized by type
- **Check off items** - Mark ingredients as purchased
- **Recipe tracking** - Know which items came from which recipe
- **Alternative suggestions** - AI suggests ingredient substitutions

## 📱 Frontend Integration

### Recipe Hub Tabs:
- **My Recipes** - User-created recipes
- **AI Meals** - AI-generated meals
- **Ingredients** - Ingredient database
- **Grocery Sync** - Recipe → shopping list
- **Favorites** - Saved recipes

### Recipe Card UI:
- Image
- Calories per serving
- Macros breakdown
- Tags ("High Protein", "Quick", "Vegan")
- Buttons:
  - **Cook Mode** (step-by-step swiper)
  - **Add to Shopping List**
  - **Track Meal**

### AI Meal Builder UI:
Form fields:
- Goal (lose weight / build muscle / maintain)
- Calories target
- Dietary type (vegan, keto, etc.)
- Allergies
- Time-to-cook
- Ingredients to include/exclude
- Number of servings

### Cook Mode:
- Each step is a card
- Swipe → next step
- Voice playback (optional)
- Image/GIF support

## ⚠️ Important Notes

- **Module B Compatibility**: Enhances existing recipes table from Module B
- **ID Type Handling**: Handles BIGSERIAL (Module B) and uuid (new tables)
- **Ingredient System**: Separate from foods/user_foods for recipe-specific ingredients
- **Recipe Steps**: Ordered instructions for cook mode experience
- **Grocery Links**: Full integration with Module F shopping lists
- **AI Integration**: Backend generates meals using AI and calls `save_ai_generated_meal()`
- **Nutrition Calculation**: Automatic calculation from ingredient amounts

## ✅ Status

**Module L is complete and ready for Supabase migration.**

This module provides the complete recipe system:
- AI-powered meal builder
- User-created recipes with steps
- Ingredient database
- Automatic nutrition calculation
- Full grocery list integration
- Cook mode support

**🎉 The Recipe Engine is now ready to power smart cooking + nutrition system!**

