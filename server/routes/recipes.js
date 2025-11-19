// server/routes/recipes.js
// Phase 9B: Full Recipe AI API Routes
// Handles AI recipe generation, meal planning, and grocery list integration

import express from 'express';
import { supabase } from '../supabase/client.js';
import OpenAI from 'openai';

const router = express.Router();

// Lazy initialization of OpenAI client
let openai = null;
function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
      throw new Error('OPENAI_API_KEY not set in .env');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

// Middleware to authenticate user
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
}

// POST /api/recipes/generate
// Generate AI recipe based on macros/requirements
router.post('/generate', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { 
      calories, 
      protein, 
      carbs, 
      fats, 
      diet_type, 
      allergies, 
      dislikes,
      meal_type,
      request_text 
    } = req.body;

    // Get user's personalized goals if not provided
    let targetCalories = calories;
    let targetProtein = protein;
    let targetCarbs = carbs;
    let targetFats = fats;

    if (!targetCalories || !targetProtein) {
      const { data: goals } = await supabase
        .from('personalized_goals')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (goals) {
        targetCalories = targetCalories || goals.calorie_target;
        targetProtein = targetProtein || goals.protein_target;
        targetCarbs = targetCarbs || goals.carbs_target;
        targetFats = targetFats || goals.fats_target;
      }
    }

    // Get user preferences
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Build AI prompt
    const prompt = buildMealBuilderPrompt({
      calories: targetCalories,
      protein: targetProtein,
      carbs: targetCarbs,
      fats: targetFats,
      diet_type: diet_type || 'balanced',
      allergies: allergies || [],
      dislikes: dislikes || [],
      meal_type: meal_type || 'lunch',
      request_text: request_text
    });

    // Call OpenAI
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a world-class nutritionist and chef. Create detailed, accurate recipes with exact nutrition information. Always return valid JSON.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);

    // Save recipe
    const recipeData = {
      user_id: userId,
      title: aiResponse.title,
      description: aiResponse.description,
      cooking_time: aiResponse.cooking_time,
      servings: aiResponse.servings || 1,
      calories: aiResponse.calories,
      protein: aiResponse.protein,
      carbs: aiResponse.carbs,
      fats: aiResponse.fats,
      steps: aiResponse.steps || [],
      tags: aiResponse.tags || [],
      ingredients: aiResponse.ingredients || [],
      ai_source: 'gpt'
    };

    const { data: recipeId, error: recipeError } = await supabase
      .rpc('create_recipe_ai', { p_recipe_data: recipeData });

    if (recipeError) {
      console.error('Error creating recipe:', recipeError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save recipe' 
      });
    }

    res.json({ 
      success: true, 
      recipe_id: recipeId,
      recipe: aiResponse
    });

  } catch (error) {
    console.error('Error generating recipe:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate recipe' 
    });
  }
});

// POST /api/recipes/generate-from-pantry
// Generate recipes from ingredients user already has
router.post('/generate-from-pantry', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    // Get pantry items
    const { data: pantryItems, error: pantryError } = await supabase
      .from('pantry_items')
      .select('item_name')
      .eq('user_id', userId);

    if (pantryError) {
      console.error('Error getting pantry:', pantryError);
    }

    const pantryList = pantryItems?.map(item => item.item_name).join(', ') || 'No items in pantry';

    // Get user goals
    const { data: goals } = await supabase
      .from('personalized_goals')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Build prompt
    const prompt = `Given these ingredients the user already has:
${pantryList}

User's daily targets:
- Calories: ${goals?.calorie_target || 2000}
- Protein: ${goals?.protein_target || 150}g
- Carbs: ${goals?.carbs_target || 200}g
- Fats: ${goals?.fats_target || 65}g

Suggest 3 full recipes the user can cook with these ingredients.
Match user macros and dietary preferences.
Return JSON array with recipes in this format:
[
  {
    "title": "",
    "description": "",
    "cooking_time": 30,
    "servings": 2,
    "calories": 500,
    "protein": 30,
    "carbs": 50,
    "fats": 20,
    "steps": ["step 1", "step 2"],
    "tags": ["high-protein"],
    "ingredients": [
      {
        "name": "ingredient name",
        "quantity": 100,
        "unit": "g",
        "calories": 50,
        "protein": 5,
        "carbs": 10,
        "fats": 2
      }
    ]
  }
]`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a creative chef. Suggest recipes using available ingredients. Return valid JSON array.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);
    const recipes = Array.isArray(aiResponse) ? aiResponse : aiResponse.recipes || [];

    // Save recipes
    const savedRecipes = [];
    for (const recipe of recipes) {
      const recipeData = {
        user_id: userId,
        ...recipe,
        ai_source: 'gpt_pantry'
      };

      const { data: recipeId } = await supabase
        .rpc('create_recipe_ai', { p_recipe_data: recipeData });

      if (recipeId) {
        savedRecipes.push({ ...recipe, id: recipeId });
      }
    }

    res.json({ 
      success: true, 
      recipes: savedRecipes
    });

  } catch (error) {
    console.error('Error generating recipes from pantry:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate recipes' 
    });
  }
});

// POST /api/recipes/generate-meal-plan
// Generate 7-day meal plan
router.post('/generate-meal-plan', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { days = 7 } = req.body;

    // Get user goals
    const { data: goals } = await supabase
      .from('personalized_goals')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Build prompt
    const prompt = `Generate a ${days}-day meal plan for user:

Goal: ${goals?.primary_goal || 'maintain'}
Calories/day: ${goals?.calorie_target || 2000}
Protein/day: ${goals?.protein_target || 150}g
Carbs/day: ${goals?.carbs_target || 200}g
Fats/day: ${goals?.fats_target || 65}g
Diet: balanced

Include for each day:
- Breakfast
- Lunch
- Dinner
- Snack

Return JSON with this structure:
{
  "days": [
    {
      "date": "2024-01-01",
      "meals": {
        "breakfast": { "title": "", "calories": 500, "protein": 30, ... },
        "lunch": { ... },
        "dinner": { ... },
        "snack": { ... }
      }
    }
  ]
}

Each meal should have: title, description, cooking_time, servings, calories, protein, carbs, fats, steps, ingredients.`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a meal planning expert. Create balanced, varied meal plans. Return valid JSON.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);

    // Save meal plan
    const savedMeals = [];
    const startDate = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayData = aiResponse.days?.[i];

      if (dayData) {
        // Create meal plan day
        const { data: dayId } = await supabase
          .from('meal_plan_days')
          .upsert({
            user_id: userId,
            date: date.toISOString().split('T')[0]
          }, {
            onConflict: 'user_id,date'
          })
          .select('id')
          .single();

        // Add meals
        for (const [mealType, mealData] of Object.entries(dayData.meals || {})) {
          if (mealData && mealData.title) {
            // Create recipe
            const recipeData = {
              user_id: userId,
              ...mealData,
              ai_source: 'gpt_meal_plan'
            };

            const { data: recipeId } = await supabase
              .rpc('create_recipe_ai', { p_recipe_data: recipeData });

            if (recipeId && dayId) {
              // Add to meal plan
              await supabase
                .rpc('add_recipe_to_meal_plan', {
                  p_user_id: userId,
                  p_date: date.toISOString().split('T')[0],
                  p_meal_type: mealType,
                  p_recipe_id: recipeId
                });
            }
          }
        }
      }
    }

    res.json({ 
      success: true, 
      meal_plan: aiResponse
    });

  } catch (error) {
    console.error('Error generating meal plan:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate meal plan' 
    });
  }
});

// GET /api/recipes
// Get recipes with filters
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { 
      search, 
      tags, 
      max_calories, 
      min_protein,
      limit = 20 
    } = req.query;

    const { data, error } = await supabase
      .rpc('get_recipes_filtered', {
        p_user_id: userId,
        p_search_term: search || null,
        p_tags: tags ? tags.split(',') : null,
        p_max_calories: max_calories ? parseInt(max_calories) : null,
        p_min_protein: min_protein ? parseInt(min_protein) : null,
        p_limit: parseInt(limit)
      });

    if (error) {
      console.error('Error getting recipes:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get recipes' 
      });
    }

    res.json({ 
      success: true, 
      recipes: data 
    });

  } catch (error) {
    console.error('Error getting recipes:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get recipes' 
    });
  }
});

// GET /api/recipes/:id
// Get single recipe with ingredients
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const recipeId = req.params.id;

    // Get recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      return res.status(404).json({ 
        success: false, 
        error: 'Recipe not found' 
      });
    }

    // Get ingredients
    const { data: ingredients } = await supabase
      .from('recipe_ingredients')
      .select('*')
      .eq('recipe_id', recipeId);

    // Get steps (if using recipe_steps table)
    let steps = [];
    if (recipe.steps && Array.isArray(recipe.steps)) {
      steps = recipe.steps;
    } else {
      const { data: stepData } = await supabase
        .from('recipe_steps')
        .select('instruction')
        .eq('recipe_id', recipeId)
        .order('step_number');
      
      if (stepData) {
        steps = stepData.map(s => s.instruction);
      }
    }

    res.json({ 
      success: true, 
      recipe: {
        ...recipe,
        ingredients: ingredients || [],
        steps: steps
      }
    });

  } catch (error) {
    console.error('Error getting recipe:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get recipe' 
    });
  }
});

// POST /api/recipes/:id/add-to-shopping-list
// Add recipe ingredients to shopping list
router.post('/:id/add-to-shopping-list', authenticateUser, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const { list_id } = req.body;
    const userId = req.userId;

    if (!list_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'List ID required' 
      });
    }

    const { error } = await supabase
      .rpc('add_recipe_to_shopping_list', {
        p_recipe_id: parseInt(recipeId),
        p_list_id: list_id
      });

    if (error) {
      console.error('Error adding to shopping list:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to add to shopping list' 
      });
    }

    res.json({ 
      success: true 
    });

  } catch (error) {
    console.error('Error adding to shopping list:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to add to shopping list' 
    });
  }
});

// GET /api/recipes/meal-plan
// Get meal plan for date range
router.get('/meal-plan', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Start and end dates required' 
      });
    }

    const { data, error } = await supabase
      .rpc('get_meal_plan', {
        p_user_id: userId,
        p_start_date: start_date,
        p_end_date: end_date
      });

    if (error) {
      console.error('Error getting meal plan:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get meal plan' 
      });
    }

    res.json({ 
      success: true, 
      meal_plan: data 
    });

  } catch (error) {
    console.error('Error getting meal plan:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get meal plan' 
    });
  }
});

// Helper functions

function buildMealBuilderPrompt({ calories, protein, carbs, fats, diet_type, allergies, dislikes, meal_type, request_text }) {
  return `You are a world-class nutritionist. Create a meal that matches:

Calories: ${calories}
Protein: ${protein}g
Carbs: ${carbs}g
Fats: ${fats}g
Diet type: ${diet_type}
Allergies: ${allergies.join(', ') || 'none'}
Foods to avoid: ${dislikes.join(', ') || 'none'}
Meal type: ${meal_type}
${request_text ? `Special request: ${request_text}` : ''}

Return JSON with this exact structure:
{
  "title": "Meal name",
  "description": "Brief description",
  "cooking_time": 30,
  "servings": 1,
  "calories": ${calories},
  "protein": ${protein},
  "carbs": ${carbs},
  "fats": ${fats},
  "steps": ["step 1", "step 2", "step 3"],
  "tags": ["high-protein", "${meal_type}"],
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": 100,
      "unit": "g",
      "calories": 50,
      "protein": 5,
      "carbs": 10,
      "fats": 2
    }
  ]
}

Ensure:
- Total calories match target (within 5%)
- Total protein matches target (within 5%)
- Total carbs match target (within 5%)
- Total fats match target (within 5%)
- All ingredients are realistic and available
- Steps are clear and actionable`;
}

export default router;

