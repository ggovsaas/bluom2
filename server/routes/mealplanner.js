// server/routes/mealplanner.js
// Module X: Meals & Macro Planner API Routes
// Handles daily/weekly meal plans, macro tracking, AI meal generation, grocery list integration

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

// GET /api/mealplanner/macros
// Get daily macros (targets, consumed, remaining)
router.get('/macros', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { date } = req.query;

    const { data, error } = await supabase
      .rpc('get_daily_macros', {
        p_user_id: userId,
        p_date: date || null
      });

    if (error) {
      console.error('Error getting daily macros:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get daily macros' 
      });
    }

    res.json({ 
      success: true, 
      macros: data 
    });

  } catch (error) {
    console.error('Error getting daily macros:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get daily macros' 
    });
  }
});

// POST /api/mealplanner/macros
// Update macro targets
router.post('/macros', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { calories, protein, carbs, fats, updated_by } = req.body;

    const { data, error } = await supabase
      .rpc('update_macro_targets', {
        p_user_id: userId,
        p_calories: calories || null,
        p_protein: protein || null,
        p_carbs: carbs || null,
        p_fats: fats || null,
        p_updated_by: updated_by || 'manual'
      });

    if (error) {
      console.error('Error updating macro targets:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update macro targets' 
      });
    }

    res.json({ 
      success: true, 
      target_id: data 
    });

  } catch (error) {
    console.error('Error updating macro targets:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update macro targets' 
    });
  }
});

// GET /api/mealplanner/plan
// Get meal plan (daily or weekly)
router.get('/plan', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { date, type } = req.query;

    const { data, error } = await supabase
      .rpc('get_meal_plan_full', {
        p_user_id: userId,
        p_date: date || null,
        p_type: type || 'daily'
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
      plan: data 
    });

  } catch (error) {
    console.error('Error getting meal plan:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get meal plan' 
    });
  }
});

// POST /api/mealplanner/generate-daily
// Generate daily meal plan
router.post('/generate-daily', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { date } = req.body;

    // Create plan structure
    const { data: planId, error: planError } = await supabase
      .rpc('generate_daily_meal_plan', {
        p_user: userId,
        p_date: date || null
      });

    if (planError) {
      console.error('Error creating daily plan:', planError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create daily plan' 
      });
    }

    // Get user preferences and macros
    const { data: macros } = await supabase
      .rpc('get_daily_macros', { p_user_id: userId, p_date: date || null });

    const { data: preferences } = await supabase
      .rpc('get_meal_preferences_full', { p_user_id: userId });

    // Generate meals with AI
    const meals = await generateAIMeals(userId, macros, preferences, 'daily');

    // Add meals to plan
    for (const meal of meals) {
      await supabase.rpc('add_meal_to_plan', {
        p_plan_id: planId,
        p_meal_slot: meal.meal_slot,
        p_recipe_id: meal.recipe_id || null,
        p_food_id: meal.food_id || null,
        p_user_food_id: meal.user_food_id || null,
        p_quantity: meal.quantity || 1.0,
        p_macros: meal.macros || {},
        p_order_index: meal.order_index || 0
      });
    }

    res.json({ 
      success: true, 
      plan_id: planId,
      meals: meals.length
    });

  } catch (error) {
    console.error('Error generating daily plan:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate daily plan' 
    });
  }
});

// POST /api/mealplanner/generate-weekly
// Generate weekly meal plan (premium only)
router.post('/generate-weekly', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    // Create weekly plan structure
    const { data: planId, error: planError } = await supabase
      .rpc('generate_weekly_meal_plan_structure', {
        p_user_id: userId
      });

    if (planError) {
      console.error('Error creating weekly plan:', planError);
      return res.status(500).json({ 
        success: false, 
        error: planError.message || 'Failed to create weekly plan' 
      });
    }

    // Get user preferences and macros
    const { data: macros } = await supabase
      .rpc('get_daily_macros', { p_user_id: userId });

    const { data: preferences } = await supabase
      .rpc('get_meal_preferences_full', { p_user_id: userId });

    // Get plan days
    const { data: days } = await supabase
      .from('meal_plan_days')
      .select('*')
      .eq('plan_id', planId)
      .order('date');

    // Generate meals for each day
    for (const day of days || []) {
      const meals = await generateAIMeals(userId, macros, preferences, 'daily');
      
      for (const meal of meals) {
        await supabase
          .from('meal_plan_meals')
          .insert({
            day_id: day.id,
            meal_type: meal.meal_slot,
            recipe_id: meal.recipe_id || null,
            generated_by: 'ai'
          });
      }
    }

    res.json({ 
      success: true, 
      plan_id: planId,
      days: days?.length || 0
    });

  } catch (error) {
    console.error('Error generating weekly plan:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate weekly plan' 
    });
  }
});

// POST /api/mealplanner/generate-grocery-list
// Generate grocery list from meal plan
router.post('/generate-grocery-list', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { plan_id } = req.body;

    if (!plan_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Plan ID required' 
      });
    }

    // Use existing function from Module X
    const { data, error } = await supabase
      .rpc('generate_grocery_list_from_plan', {
        p_user: userId,
        p_plan_id: plan_id
      });

    if (error) {
      console.error('Error generating grocery list:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to generate grocery list' 
      });
    }

    res.json({ 
      success: true, 
      grocery_list: data 
    });

  } catch (error) {
    console.error('Error generating grocery list:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate grocery list' 
    });
  }
});

// GET /api/mealplanner/preferences
// Get meal preferences
router.get('/preferences', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabase
      .rpc('get_meal_preferences_full', { p_user_id: userId });

    if (error) {
      console.error('Error getting preferences:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get preferences' 
      });
    }

    res.json({ 
      success: true, 
      preferences: data 
    });

  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get preferences' 
    });
  }
});

// POST /api/mealplanner/preferences
// Update meal preferences
router.post('/preferences', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { diet_type, allergies, dislikes, preferred_cuisines, avoid_foods, preferred_meal_times } = req.body;

    const { error } = await supabase
      .from('meal_preferences')
      .upsert({
        user_id: userId,
        diet_type: diet_type || null,
        allergies: allergies || [],
        dislikes: dislikes || [],
        preferred_cuisines: preferred_cuisines || [],
        avoid_foods: avoid_foods || [],
        preferred_meal_times: preferred_meal_times || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating preferences:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update preferences' 
      });
    }

    res.json({ 
      success: true 
    });

  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update preferences' 
    });
  }
});

// Helper function: Generate AI meals
async function generateAIMeals(userId, macros, preferences, type) {
  try {
    const prompt = `You are Bluöm AI Meal Planner. Generate ${type === 'daily' ? 'a day' : 'a week'} of meals that meet these requirements:

Target Macros:
- Calories: ${macros?.calories_target || 2000}
- Protein: ${macros?.protein_target || 150}g
- Carbs: ${macros?.carbs_target || 200}g
- Fats: ${macros?.fats_target || 65}g

Diet Type: ${preferences?.diet_type || 'balanced'}
Allergies: ${preferences?.allergies?.join(', ') || 'none'}
Dislikes: ${preferences?.dislikes?.join(', ') || 'none'}
Preferred Cuisines: ${preferences?.preferred_cuisines?.join(', ') || 'any'}

Return JSON array of meals with:
- meal_slot: "breakfast", "lunch", "dinner", "snack1", "snack2"
- name: meal name
- calories, protein, carbs, fats: macro breakdown
- ingredients: array of ingredient names
- instructions: brief cooking instructions

Balance macros across all meals. Make meals practical and easy to prepare.`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a nutrition expert meal planner. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const responseText = completion.choices[0].message.content;
    const meals = JSON.parse(responseText);

    // Convert AI meals to plan items
    return meals.map((meal, index) => ({
      meal_slot: meal.meal_slot,
      recipe_id: null, // Would need to create recipe first
      food_id: null,
      user_food_id: null,
      quantity: 1.0,
      macros: {
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fats
      },
      order_index: index
    }));

  } catch (error) {
    console.error('Error generating AI meals:', error);
    // Return default meals if AI fails
    return [
      {
        meal_slot: 'breakfast',
        macros: { calories: 400, protein: 30, carbs: 50, fat: 15 },
        order_index: 0
      },
      {
        meal_slot: 'lunch',
        macros: { calories: 600, protein: 45, carbs: 70, fat: 20 },
        order_index: 1
      },
      {
        meal_slot: 'dinner',
        macros: { calories: 700, protein: 50, carbs: 60, fat: 25 },
        order_index: 2
      }
    ];
  }
}

export default router;

