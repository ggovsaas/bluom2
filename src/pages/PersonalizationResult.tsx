// src/pages/PersonalizationResult.tsx
// Personalization Result Screen - Shows generated plans
// React Native + Web compatible

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface PersonalizationResultProps {
  userId?: string;
}

export default function PersonalizationResult({ userId }: PersonalizationResultProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [personalization, setPersonalization] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPersonalization();
  }, []);

  const loadPersonalization = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = userId || session?.user?.id;

      if (!currentUserId) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/personalize', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load personalization');
      }

      const result = await response.json();
      setPersonalization(result.personalization);
    } catch (err: any) {
      console.error('Error loading personalization:', err);
      setError(err.message || 'Failed to load personalization');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your personalized plan...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigate('/onboarding')}
        >
          <Text style={styles.buttonText}>Complete Onboarding</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!personalization) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No personalization found</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigate('/onboarding')}
        >
          <Text style={styles.buttonText}>Complete Onboarding</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Your Personalized Plan</Text>
        <Text style={styles.subtitle}>Tailored just for you</Text>
      </View>

      {/* Goals Section */}
      {personalization.goals && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧬 Your Goal</Text>
          <View style={styles.goalCard}>
            <Text style={styles.goalText}>
              {personalization.goals.primary_goal?.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.goalDescription}>
              {personalization.goals.workout_focus?.replace('_', ' ')}
            </Text>
          </View>
        </View>
      )}

      {/* Macros Section */}
      {personalization.goals && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Recommended Macros</Text>
          <View style={styles.macrosGrid}>
            <View style={styles.macroCard}>
              <Text style={styles.macroValue}>{personalization.goals.calorie_target}</Text>
              <Text style={styles.macroLabel}>Calories</Text>
            </View>
            <View style={styles.macroCard}>
              <Text style={styles.macroValue}>{personalization.goals.protein_target}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroCard}>
              <Text style={styles.macroValue}>{personalization.goals.carbs_target}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroCard}>
              <Text style={styles.macroValue}>{personalization.goals.fats_target}g</Text>
              <Text style={styles.macroLabel}>Fats</Text>
            </View>
          </View>
        </View>
      )}

      {/* Meal Plan Section */}
      {personalization.meal_plan && personalization.meal_plan.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍱 Your Meal Plan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const dayMeals = personalization.meal_plan.filter(
                (m: any) => m.day_index === day
              );
              if (dayMeals.length === 0) return null;

              const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
              
              return (
                <View key={day} style={styles.dayCard}>
                  <Text style={styles.dayTitle}>{dayNames[day - 1]}</Text>
                  {dayMeals.map((meal: any, idx: number) => (
                    <View key={idx} style={styles.mealItem}>
                      <Text style={styles.mealLabel}>{meal.meal_label}</Text>
                      {meal.items?.map((item: any, itemIdx: number) => (
                        <Text key={itemIdx} style={styles.mealFood}>
                          • {item.food} ({item.grams}g)
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Workout Plan Section */}
      {personalization.workout_plan && personalization.workout_plan.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏋️ Your Workout Plan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {personalization.workout_plan.map((workout: any, idx: number) => {
              const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
              
              return (
                <View key={idx} style={styles.workoutCard}>
                  <Text style={styles.workoutDay}>{dayNames[workout.day_index - 1]}</Text>
                  <Text style={styles.workoutType}>{workout.workout_type?.replace('_', ' ').toUpperCase()}</Text>
                  {workout.exercises?.map((exercise: any, exIdx: number) => (
                    <View key={exIdx} style={styles.exerciseItem}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseDetails}>
                        {exercise.sets} sets × {exercise.reps} reps
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Wellness Focus Section */}
      {personalization.goals?.wellness_focus && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧘 Wellness Focus</Text>
          <View style={styles.wellnessCard}>
            <Text style={styles.wellnessText}>
              {personalization.goals.wellness_focus?.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.wellnessDescription}>
              Focus on improving your {personalization.goals.wellness_focus} through meditation, 
              sleep hygiene, and stress management.
            </Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigate('/home')}
        >
          <Text style={styles.buttonText}>Start Your Journey</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigate('/shopping-list')}
        >
          <Text style={styles.secondaryButtonText}>View Shopping List</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    margin: 24,
  },
  section: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  goalCard: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  goalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  macroCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
  },
  dayCard: {
    width: 280,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  mealItem: {
    marginBottom: 12,
  },
  mealLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4,
  },
  mealFood: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  workoutCard: {
    width: 280,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  workoutDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  workoutType: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 12,
  },
  exerciseItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 12,
    color: '#666',
  },
  wellnessCard: {
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 8,
  },
  wellnessText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  wellnessDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
});

