// src/components/mealplanner/MealPlanCard.tsx
// Meal Plan Card Component - Individual meal card in plan
// React Native + Web compatible

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface MealPlanCardProps {
  meal: {
    meal_slot: string;
    name?: string;
    recipe_id?: string;
    food_id?: string;
    macros?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    };
  };
  onPress?: () => void;
  onSwap?: () => void;
}

export default function MealPlanCard({ meal, onPress, onSwap }: MealPlanCardProps) {
  const mealLabels = {
    breakfast: '🌅 Breakfast',
    lunch: '🍽️ Lunch',
    dinner: '🌙 Dinner',
    snack1: '🥨 Snack 1',
    snack2: '🥨 Snack 2',
  };

  const mealLabel = mealLabels[meal.meal_slot] || meal.meal_slot;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.mealLabel}>{mealLabel}</Text>
        {onSwap && (
          <TouchableOpacity onPress={onSwap} style={styles.swapButton}>
            <Text style={styles.swapText}>🔄</Text>
          </TouchableOpacity>
        )}
      </View>

      {meal.name && (
        <Text style={styles.mealName}>{meal.name}</Text>
      )}

      {meal.macros && (
        <View style={styles.macros}>
          <Text style={styles.macroText}>
            {Math.round(meal.macros.calories || 0)} cal
          </Text>
          <Text style={styles.macroText}>
            P: {Math.round(meal.macros.protein || 0)}g
          </Text>
          <Text style={styles.macroText}>
            C: {Math.round(meal.macros.carbs || 0)}g
          </Text>
          <Text style={styles.macroText}>
            F: {Math.round(meal.macros.fat || 0)}g
          </Text>
        </View>
      )}

      {!meal.name && (
        <Text style={styles.placeholderText}>Tap to add meal</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  swapButton: {
    padding: 4,
  },
  swapText: {
    fontSize: 18,
  },
  mealName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  macros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  macroText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

