// src/pages/AIMealBuilder.tsx
// AI Meal Builder - Generate personalized meal plans

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Utensils, Target, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PremiumGate } from '../components/PremiumGate';

interface MealPlan {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: Meal[];
}

interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
}

export default function AIMealBuilder() {
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<MealPlan | null>(null);
  const [formData, setFormData] = useState({
    targetCalories: 2000,
    targetProtein: 150,
    targetCarbs: 225,
    targetFat: 67,
    preferences: '',
    avoidIngredients: '',
    dietaryRestrictions: ''
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Call Supabase RPC function to generate meal plan
      const { data, error } = await supabase.rpc('generate_meal_plan', {
        p_user_id: user.id,
        p_target_calories: formData.targetCalories,
        p_target_protein: formData.targetProtein,
        p_target_carbs: formData.targetCarbs,
        p_target_fat: formData.targetFat,
        p_preferences: formData.preferences || null,
        p_avoid_ingredients: formData.avoidIngredients || null,
        p_dietary_restrictions: formData.dietaryRestrictions || null
      });

      if (error) throw error;

      // Save meal plan to database
      if (data) {
        const { error: saveError } = await supabase
          .from('meal_planner')
          .insert({
            user_id: user.id,
            plan_data: data,
            created_at: new Date().toISOString()
          });

        if (saveError) throw saveError;

        setGeneratedPlan(data);
      }
    } catch (error) {
      console.error("Error generating meal plan:", error);
      alert("Failed to generate meal plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumGate feature="AI Meal Builder">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">AI Meal Builder</h1>
                <p className="text-gray-600">Generate personalized meal plans powered by AI</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Calories
                </label>
                <input
                  type="number"
                  value={formData.targetCalories}
                  onChange={(e) => setFormData({ ...formData, targetCalories: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Protein (g)
                </label>
                <input
                  type="number"
                  value={formData.targetProtein}
                  onChange={(e) => setFormData({ ...formData, targetProtein: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Carbs (g)
                </label>
                <input
                  type="number"
                  value={formData.targetCarbs}
                  onChange={(e) => setFormData({ ...formData, targetCarbs: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Fat (g)
                </label>
                <input
                  type="number"
                  value={formData.targetFat}
                  onChange={(e) => setFormData({ ...formData, targetFat: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Food Preferences (optional)
              </label>
              <textarea
                value={formData.preferences}
                onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                placeholder="e.g., I love Mediterranean food, prefer chicken over beef..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avoid Ingredients (optional)
              </label>
              <input
                type="text"
                value={formData.avoidIngredients}
                onChange={(e) => setFormData({ ...formData, avoidIngredients: e.target.value })}
                placeholder="e.g., nuts, dairy, gluten"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                  Generating Meal Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 inline mr-2" />
                  Generate AI Meal Plan
                </>
              )}
            </button>
          </motion.div>

          {generatedPlan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">Your Generated Meal Plan</h2>
              <div className="space-y-4">
                {generatedPlan.meals?.map((meal, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{meal.name}</h3>
                      <span className="text-sm text-gray-600 capitalize">{meal.type}</span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 mb-2">
                      <span>{meal.calories} cal</span>
                      <span>{meal.protein}g protein</span>
                      <span>{meal.carbs}g carbs</span>
                      <span>{meal.fat}g fat</span>
                    </div>
                    {meal.ingredients && meal.ingredients.length > 0 && (
                      <div className="text-sm text-gray-500">
                        <strong>Ingredients:</strong> {meal.ingredients.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PremiumGate>
  );
}


