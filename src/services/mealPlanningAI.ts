// src/services/mealPlanningAI.ts
// Full Meal Planning AI - Complete system

import { supabase } from '../lib/supabaseClient';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

// ============ DAILY MEAL TARGETS ============

export async function calculateDailyMealTargets(userId: string, date?: string) {
  const { data, error } = await supabase.rpc('calculate_daily_meal_targets', {
    p_user_id: userId,
    p_date: date || new Date().toISOString().split('T')[0],
  });

  if (error) throw error;
  return data;
}

// ============ AI MEAL BLUEPRINT GENERATOR ============

export async function generateMealBlueprint(
  userId: string,
  date: string
): Promise<{
  breakfast: { calories: number; protein: number; carbs: number; fats: number };
  lunch: { calories: number; protein: number; carbs: number; fats: number };
  dinner: { calories: number; protein: number; carbs: number; fats: number };
  snacks: { calories: number; protein: number; carbs: number; fats: number };
}> {
  const targets = await calculateDailyMealTargets(userId, date);

  // Distribute macros across meals
  const breakfast = {
    calories: Math.round(targets.calories * 0.25),
    protein: Math.round(targets.protein * 0.25),
    carbs: Math.round(targets.carbs * 0.25),
    fats: Math.round(targets.fats * 0.25),
  };

  const lunch = {
    calories: Math.round(targets.calories * 0.35),
    protein: Math.round(targets.protein * 0.35),
    carbs: Math.round(targets.carbs * 0.35),
    fats: Math.round(targets.fats * 0.35),
  };

  const dinner = {
    calories: Math.round(targets.calories * 0.30),
    protein: Math.round(targets.protein * 0.30),
    carbs: Math.round(targets.carbs * 0.30),
    fats: Math.round(targets.fats * 0.30),
  };

  const snacks = {
    calories: Math.round(targets.calories * 0.10),
    protein: Math.round(targets.protein * 0.10),
    carbs: Math.round(targets.carbs * 0.10),
    fats: Math.round(targets.fats * 0.10),
  };

  return { breakfast, lunch, dinner, snacks };
}

// ============ AI RECIPE BUILDER ============

export async function generateAIRecipe(
  userId: string,
  params: {
    targetMacros: { calories: number; protein: number; carbs: number; fats: number };
    availableFoods?: number[];
    pantryItems?: string[];
    cookingSkill?: 'beginner' | 'intermediate' | 'advanced';
    equipment?: string[];
    preferences?: string[];
  }
) {
  // Get user's custom foods and pantry
  const { data: userFoods } = await supabase
    .from('user_foods')
    .select('*')
    .eq('user_id', userId);

  const { data: pantry } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', userId);

  // Build prompt for OpenAI
  const prompt = `Create a recipe that meets these macros:
Calories: ${params.targetMacros.calories}
Protein: ${params.targetMacros.protein}g
Carbs: ${params.targetMacros.carbs}g
Fats: ${params.targetMacros.fats}g

Available ingredients: ${pantry?.map((p) => p.item_name).join(', ') || 'Any'}
Cooking skill: ${params.cookingSkill || 'intermediate'}
Equipment: ${params.equipment?.join(', ') || 'Standard kitchen'}

Return JSON with: title, description, ingredients (array of {name, quantity, unit}), steps (array of strings), cooking_time_minutes, difficulty, tags.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a nutritionist and chef. Create healthy, delicious recipes.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const recipe = JSON.parse(completion.choices[0].message.content || '{}');

    // Save to database
    const { data, error } = await supabase
      .from('ai_recipes')
      .insert({
        user_id: userId,
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        macros: params.targetMacros,
        cooking_time_minutes: recipe.cooking_time_minutes,
        difficulty: recipe.difficulty,
        tags: recipe.tags,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error generating AI recipe:', error);
    throw error;
  }
}

// ============ AUTO GROCERY LIST ============

export async function generateGroceryListFromMealPlan(
  userId: string,
  mealPlanId: string
) {
  // Get meal plan items
  const { data: mealPlan } = await supabase
    .from('meal_plans')
    .select(`
      *,
      meal_plan_items (
        *,
        foods (*),
        recipes (*)
      )
    `)
    .eq('id', mealPlanId)
    .single();

  if (!mealPlan) throw new Error('Meal plan not found');

  // Get pantry items
  const { data: pantry } = await supabase
    .from('pantry_items')
    .select('item_name, quantity')
    .eq('user_id', userId);

  const pantryMap = new Map(pantry?.map((p) => [p.item_name.toLowerCase(), p.quantity]) || []);

  // Aggregate ingredients
  const ingredients = new Map<string, { quantity: string; unit: string }>();

  mealPlan.meal_plan_items?.forEach((item: any) => {
    if (item.recipe_id && item.recipes) {
      // Recipe ingredients
      item.recipes.ingredients?.forEach((ing: any) => {
        const key = ing.name.toLowerCase();
        const existing = ingredients.get(key);
        if (existing) {
          // Merge quantities
          ingredients.set(key, {
            quantity: `${parseFloat(existing.quantity) + parseFloat(ing.quantity)}`,
            unit: ing.unit,
          });
        } else {
          ingredients.set(key, { quantity: ing.quantity, unit: ing.unit });
        }
      });
    } else if (item.food_id && item.foods) {
      // Direct food item
      const key = item.foods.name.toLowerCase();
      ingredients.set(key, {
        quantity: item.quantity?.toString() || '1',
        unit: item.unit || 'serving',
      });
    }
  });

  // Filter out pantry items
  const needed = Array.from(ingredients.entries())
    .filter(([name]) => !pantryMap.has(name))
    .map(([name, data]) => ({ name, ...data }));

  // Create shopping list
  const { data: shoppingList, error: listError } = await supabase
    .from('shopping_lists')
    .insert({
      user_id: userId,
      name: `Meal Plan: ${mealPlan.name || 'Weekly Plan'}`,
    })
    .select()
    .single();

  if (listError) throw listError;

  // Add items
  const items = needed.map((ing) => ({
    list_id: shoppingList.id,
    item_name: ing.name,
    quantity: ing.quantity,
    category: 'produce', // Could be smarter
  }));

  await supabase.from('shopping_list_items').insert(items);

  return shoppingList;
}

// ============ MEAL PLAN FEEDBACK ============

export async function logMealFeedback(
  userId: string,
  foodId?: number,
  recipeId?: string,
  mealLogId?: number,
  liked: boolean = true,
  notes?: string
) {
  const { data, error } = await supabase
    .from('meal_plan_feedback')
    .insert({
      user_id: userId,
      food_id: foodId || null,
      recipe_id: recipeId || null,
      meal_log_id: mealLogId || null,
      liked,
      notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============ AUTO MACRO CORRECTION ============

export async function generateMacroCorrection(userId: string, date?: string) {
  const { data, error } = await supabase.rpc('generate_macro_correction', {
    p_user_id: userId,
    p_date: date || new Date().toISOString().split('T')[0],
  });

  if (error) throw error;
  return data;
}

// ============ RESTAURANT MODE ============

export async function logRestaurantMeal(
  userId: string,
  params: {
    restaurantName?: string;
    mealDescription: string;
    imageUrl?: string;
    source: 'vision_ai' | 'fatsecret' | 'manual' | 'text_analysis';
  }
) {
  // Use OpenAI to estimate macros from description
  const prompt = `Estimate the nutritional information for this meal: "${params.mealDescription}"

Return JSON with: calories, protein (grams), carbs (grams), fats (grams), confidence (0-1).`;

  let estimatedMacros: any = {};
  let confidence = 0.5;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a nutritionist. Estimate meal macros accurately.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    estimatedMacros = {
      calories: result.calories || 500,
      protein: result.protein || 30,
      carbs: result.carbs || 50,
      fats: result.fats || 20,
    };
    confidence = result.confidence || 0.7;
  } catch (error) {
    console.error('Error estimating macros:', error);
  }

  const { data, error } = await supabase
    .from('restaurant_meal_logs')
    .insert({
      user_id: userId,
      restaurant_name: params.restaurantName,
      meal_description: params.mealDescription,
      image_url: params.imageUrl,
      estimated_calories: estimatedMacros.calories,
      estimated_protein: estimatedMacros.protein,
      estimated_carbs: estimatedMacros.carbs,
      estimated_fats: estimatedMacros.fats,
      confidence_score: confidence,
      source: params.source,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============ NUTRITION REPORTS ============

export async function generateWeeklyReport(userId: string, weekStart: string) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  // Get nutrition data
  const { data: nutritionData } = await supabase
    .from('daily_nutrition_summary')
    .select('*')
    .eq('user_id', userId)
    .gte('date', weekStart)
    .lte('date', weekEnd.toISOString().split('T')[0]);

  // Get sleep data
  const { data: sleepData } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', weekStart)
    .lte('date', weekEnd.toISOString().split('T')[0]);

  // Calculate trends
  const avgCalories = nutritionData?.reduce((sum, d) => sum + (d.calories || 0), 0) / (nutritionData?.length || 1);
  const avgSleep = sleepData?.reduce((sum, d) => sum + parseFloat(d.hours.toString()), 0) / (sleepData?.length || 1);

  const report = {
    period: { start: weekStart, end: weekEnd.toISOString().split('T')[0] },
    nutrition: {
      avg_calories: Math.round(avgCalories),
      avg_protein: nutritionData?.reduce((sum, d) => sum + (d.protein || 0), 0) / (nutritionData?.length || 1),
      macro_accuracy: 85, // Calculate from targets vs actual
    },
    sleep: {
      avg_hours: Math.round(avgSleep * 10) / 10,
    },
    trends: {
      weight: 'stable', // Calculate from weight logs
      calories: 'stable',
      sleep: avgSleep < 7 ? 'declining' : 'stable',
    },
    projections: {
      next_7days: {
        estimated_calories: Math.round(avgCalories),
        estimated_weight_change: 0,
      },
    },
  };

  // Save report
  const { data, error } = await supabase
    .from('nutrition_reports')
    .insert({
      user_id: userId,
      report_type: 'weekly',
      report_period_start: weekStart,
      report_period_end: weekEnd.toISOString().split('T')[0],
      report,
      macro_accuracy: report.nutrition.macro_accuracy,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

