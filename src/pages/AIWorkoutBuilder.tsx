// src/pages/AIWorkoutBuilder.tsx
// AI Workout Builder - Generate personalized workout plans

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Dumbbell, Target, Loader2, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PremiumGate } from '../components/PremiumGate';

interface WorkoutPlan {
  id: string;
  name: string;
  frequency: number;
  split: string;
  workouts: Workout[];
}

interface Workout {
  id: string;
  name: string;
  day: number;
  exercises: Exercise[];
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  rest: number;
}

export default function AIWorkoutBuilder() {
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<WorkoutPlan | null>(null);
  const [formData, setFormData] = useState({
    experience: 'beginner',
    goal: 'build_muscle',
    frequency: 3,
    equipment: '',
    schedule: '',
    preferences: ''
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Call Supabase RPC function to generate workout plan
      const { data, error } = await supabase.rpc('generate_workout_plan', {
        p_user_id: user.id,
        p_experience: formData.experience,
        p_goal: formData.goal,
        p_frequency: formData.frequency,
        p_equipment: formData.equipment || null,
        p_schedule: formData.schedule || null,
        p_preferences: formData.preferences || null
      });

      if (error) throw error;

      // Save workout plan to database
      if (data) {
        const { error: saveError } = await supabase
          .from('workout_plans')
          .insert({
            user_id: user.id,
            plan_data: data,
            created_at: new Date().toISOString()
          });

        if (saveError) throw saveError;

        setGeneratedPlan(data);
      }
    } catch (error) {
      console.error("Error generating workout plan:", error);
      alert("Failed to generate workout plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumGate feature="AI Workout Builder">
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-3">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">AI Workout Builder</h1>
                <p className="text-gray-600">Generate personalized workout plans powered by AI</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal
                </label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="build_muscle">Build Muscle</option>
                  <option value="lose_weight">Lose Weight</option>
                  <option value="strength">Build Strength</option>
                  <option value="endurance">Improve Endurance</option>
                  <option value="general_fitness">General Fitness</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workouts Per Week
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Equipment
                </label>
                <input
                  type="text"
                  value={formData.equipment}
                  onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                  placeholder="e.g., dumbbells, barbell, resistance bands"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Preferences (optional)
              </label>
              <textarea
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                placeholder="e.g., Morning workouts, 45 minutes max, prefer full body..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                rows={3}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Preferences (optional)
              </label>
              <textarea
                value={formData.preferences}
                onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                placeholder="e.g., Focus on upper body, avoid squats due to knee injury..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                rows={3}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                  Generating Workout Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 inline mr-2" />
                  Generate AI Workout Plan
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
              <h2 className="text-xl font-bold text-gray-800 mb-4">Your Generated Workout Plan</h2>
              <div className="space-y-6">
                {generatedPlan.workouts?.map((workout, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">{workout.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Day {workout.day}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {workout.exercises?.map((exercise, exIndex) => (
                        <div key={exIndex} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{exercise.name}</span>
                            <span className="text-sm text-gray-600">
                              {exercise.sets} sets × {exercise.reps} reps
                              {exercise.weight && ` @ ${exercise.weight}kg`}
                            </span>
                          </div>
                          {exercise.rest > 0 && (
                            <span className="text-xs text-gray-500">
                              Rest: {exercise.rest}s
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
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


