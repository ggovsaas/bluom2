// src/services/fuel.ts
// Fuel system: Foods, Meals, Water, Recipes (Enhanced)

import { supabase } from '../lib/supabaseClient';

// ============ CUSTOM FOODS ============

export async function addCustomFood(userId: string, food: {
  name: string;
  brand?: string;
  serving_size?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  barcode?: string;
  source?: string;
}) {
  const { data, error } = await supabase
    .from('foods')
    .insert({
      user_id: userId,
      ...food,
      source: food.source || 'custom',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function searchUserFoods(query: string, userId: string) {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .ilike('name', `%${query}%`)
    .eq('user_id', userId)
    .limit(50);

  if (error) throw error;
  return data || [];
}

// ============ RECIPES ============

export async function createRecipe(
  userId: string,
  name: string,
  instructions?: string
) {
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: userId,
      name,
      instructions,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addRecipeItem(
  recipeId: string,
  foodId: number,
  quantity: number,
  unit: string = 'g'
) {
  const { data, error } = await supabase
    .from('recipe_items')
    .insert({
      recipe_id: recipeId,
      food_id: foodId,
      quantity,
      unit,
    })
    .select()
    .single();

  if (error) throw error;

  // Recalculate recipe totals
  await recalculateRecipeTotals(recipeId);

  return data;
}

async function recalculateRecipeTotals(recipeId: string) {
  // Get all recipe items with food data
  const { data: items } = await supabase
    .from('recipe_items')
    .select(`
      *,
      foods (*)
    `)
    .eq('recipe_id', recipeId);

  if (!items) return;

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  items.forEach((item) => {
    if (item.foods) {
      const multiplier = item.quantity / (parseFloat(item.foods.serving_size || '1') || 1);
      totalCalories += (item.foods.calories || 0) * multiplier;
      totalProtein += (item.foods.protein || 0) * multiplier;
      totalCarbs += (item.foods.carbs || 0) * multiplier;
      totalFat += (item.foods.fat || 0) * multiplier;
    }
  });

  await supabase
    .from('recipes')
    .update({
      total_calories: Math.round(totalCalories),
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fat: totalFat,
    })
    .eq('id', recipeId);
}

export async function getUserRecipes(userId: string) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============ MEAL LOGS ============

export async function ensureMealLog(
  userId: string,
  date: string,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
) {
  let { data } = await supabase
    .from('meal_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .eq('meal_type', mealType)
    .maybeSingle();

  if (!data) {
    const { data: newData, error } = await supabase
      .from('meal_logs')
      .insert({
        user_id: userId,
        date,
        meal_type: mealType,
      })
      .select()
      .single();

    if (error) throw error;
    data = newData;
  }

  return data;
}

export async function getMealLog(
  userId: string,
  date: string,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
) {
  const { data, error } = await supabase
    .from('meal_logs')
    .select(`
      *,
      meal_log_items (
        *,
        foods (*),
        recipes (*)
      )
    `)
    .eq('user_id', userId)
    .eq('date', date)
    .eq('meal_type', mealType)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function addFoodToMeal(
  mealLogId: number | string,
  foodId: number | null,
  recipeId: string | null,
  quantity: number = 1
) {
  // Get meal log to get user_id and date
  const { data: mealLog } = await supabase
    .from('meal_logs')
    .select('user_id, date')
    .eq('id', mealLogId)
    .single();

  if (!mealLog) throw new Error('Meal log not found');

  // Get food or recipe data
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  if (foodId) {
    const { data: food } = await supabase
      .from('foods')
      .select('*')
      .eq('id', foodId)
      .single();

    if (food) {
      const multiplier = quantity / (parseFloat(food.serving_size || '1') || 1);
      calories = Math.round((food.calories || 0) * multiplier);
      protein = (food.protein || 0) * multiplier;
      carbs = (food.carbs || 0) * multiplier;
      fat = (food.fat || 0) * multiplier;
    }
  } else if (recipeId) {
    const { data: recipe } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single();

    if (recipe) {
      calories = Math.round((recipe.total_calories || 0) * quantity);
      protein = (recipe.total_protein || 0) * quantity;
      carbs = (recipe.total_carbs || 0) * quantity;
      fat = (recipe.total_fat || 0) * quantity;
    }
  }

  const { data, error } = await supabase
    .from('meal_log_items')
    .insert({
      meal_log_id: mealLogId,
      food_id: foodId,
      recipe_id: recipeId,
      quantity,
      calories,
      protein,
      carbs,
      fat,
    })
    .select()
    .single();

  if (error) throw error;

  // Update daily snapshot
  await supabase.rpc('update_daily_snapshot', {
    p_user_id: mealLog.user_id,
    p_date: mealLog.date,
  });

  return data;
}

export async function removeMealItem(itemId: string) {
  const { error } = await supabase
    .from('meal_log_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}

// ============ WATER ============

export async function addWater(userId: string, ml: number) {
  const { data, error } = await supabase
    .from('water_logs')
    .insert({
      user_id: userId,
      ml,
    })
    .select()
    .single();

  if (error) throw error;

  // Update daily snapshot
  const today = new Date().toISOString().split('T')[0];
  await supabase.rpc('update_daily_snapshot', {
    p_user_id: userId,
    p_date: today,
  });

  return data;
}

export async function getWaterToday(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('water_logs')
    .select('ml')
    .eq('user_id', userId)
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  if (error) throw error;

  const total = data?.reduce((sum, log) => sum + log.ml, 0) || 0;
  return total;
}

// ============ DAILY TOTALS ============

export async function getDailyTotals(userId: string, date: string) {
  // Get all meal logs for the date
  const { data: mealLogs } = await supabase
    .from('meal_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('date', date);

  if (!mealLogs || mealLogs.length === 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  const mealLogIds = mealLogs.map((log) => log.id);

  // Get all meal log items
  const { data: items, error } = await supabase
    .from('meal_log_items')
    .select('calories, protein, carbs, fat')
    .in('meal_log_id', mealLogIds);

  if (error) throw error;

  const totals = items?.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      carbs: acc.carbs + (item.carbs || 0),
      fat: acc.fat + (item.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  return totals;
}
