// src/components/FuelMeal.tsx
// Fuel meal component - displays and manages a single meal

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ensureMealLog, getMealLog, addFoodToMeal, removeMealItem } from '../services/fuel';
import { supabase } from '../lib/supabaseClient';
import FoodSearchModal from './FoodSearchModal';

interface FuelMealProps {
  userId: string;
  date: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export default function FuelMeal({ userId, date, meal }: FuelMealProps) {
  const [mealLog, setMealLog] = useState<any>(null);
  const [openSearch, setOpenSearch] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMealLog();
  }, [userId, date, meal]);

  const loadMealLog = async () => {
    try {
      setLoading(true);
      const log = await ensureMealLog(userId, date, meal);
      const full = await getMealLog(userId, date, meal);
      setMealLog(full || log);
    } catch (error) {
      console.error('Error loading meal log:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = async (food: any) => {
    try {
      let currentMealLog = mealLog;
      if (!currentMealLog) {
        currentMealLog = await ensureMealLog(userId, date, meal);
        setMealLog(currentMealLog);
      }

      // Handle food ID (could be number or string like "fatsecret_123")
      let foodId: number | null = null;
      if (typeof food.id === 'number') {
        foodId = food.id;
      } else if (food.source && food.source !== 'custom') {
        // External food - need to save it first
        const { data: savedFood } = await supabase
          .from('foods')
          .insert({
            user_id: userId,
            name: food.name,
            brand: food.brand,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            serving_size: food.serving_size,
            barcode: food.barcode,
            source: food.source,
          })
          .select()
          .single();
        
        if (savedFood) {
          foodId = savedFood.id;
        }
      }

      await addFoodToMeal(currentMealLog.id, foodId, null, 1);
      await loadMealLog();
      setOpenSearch(false);
    } catch (error: any) {
      console.error('Error adding food:', error);
      alert(error.message || 'Could not add food');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeMealItem(itemId);
      await loadMealLog();
    } catch (error: any) {
      console.error('Error removing item:', error);
      alert(error.message || 'Could not remove item');
    }
  };

  const items = mealLog?.meal_log_items || [];
  const totalCalories = items.reduce((sum: number, item: any) => sum + (item.calories || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mealTitle}>{meal.charAt(0).toUpperCase() + meal.slice(1)}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setOpenSearch(true)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {items.length > 0 && (
        <View style={styles.itemsList}>
          {items.map((item: any) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>
                  {item.foods?.name || item.recipes?.name || 'Food'}
                </Text>
                {item.quantity > 1 && (
                  <Text style={styles.itemQuantity}>× {item.quantity}</Text>
                )}
              </View>
              <View style={styles.itemActions}>
                <Text style={styles.itemCalories}>{item.calories || 0} kcal</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(item.id)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {items.length > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalCalories}>{totalCalories} kcal</Text>
        </View>
      )}

      {items.length === 0 && (
        <Text style={styles.emptyText}>No items yet</Text>
      )}

      {openSearch && (
        <FoodSearchModal
          userId={userId}
          onSelect={handleAddFood}
          onClose={() => setOpenSearch(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  itemsList: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  itemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
  },
  itemQuantity: {
    color: '#aaa',
    fontSize: 14,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemCalories: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    color: '#ff4444',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalCalories: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
});

