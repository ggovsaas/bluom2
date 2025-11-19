// src/app/fuel/log.tsx
// Log meal screen

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { searchFoods, addMeal } from '../../services/fuel';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export default function LogMealScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 2) {
      handleSearch();
    } else {
      setFoods([]);
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    try {
      const results = await searchFoods(searchQuery);
      setFoods(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleAddMeal = async () => {
    if (!selectedFood) {
      Alert.alert('Error', 'Please select a food');
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      await addMeal(user!.id, today, mealType, selectedFood.id, parseFloat(quantity));
      Alert.alert('Success', 'Meal logged!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not log meal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Log Meal</Text>
      </View>

      {/* Meal Type Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal Type</Text>
        <View style={styles.mealTypeRow}>
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.mealTypeButton,
                mealType === type && styles.mealTypeButtonActive,
              ]}
              onPress={() => setMealType(type)}
            >
              <Text
                style={[
                  styles.mealTypeText,
                  mealType === type && styles.mealTypeTextActive,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Food Search */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Search Food</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search foods..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {foods.length > 0 && (
          <View style={styles.foodList}>
            {foods.map((food) => (
              <TouchableOpacity
                key={food.id}
                style={[
                  styles.foodItem,
                  selectedFood?.id === food.id && styles.foodItemSelected,
                ]}
                onPress={() => setSelectedFood(food)}
              >
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  {food.brand && (
                    <Text style={styles.foodBrand}>{food.brand}</Text>
                  )}
                  <Text style={styles.foodMacros}>
                    {food.calories} kcal • {food.protein}g P • {food.carbs}g C • {food.fat}g F
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Quantity */}
      {selectedFood && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <TextInput
            style={styles.quantityInput}
            placeholder="1"
            placeholderTextColor="#666"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
          />
          <Text style={styles.quantityHint}>
            Serving size: {selectedFood.serving_size || '1 serving'}
          </Text>
        </View>
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, loading && styles.addButtonDisabled]}
        onPress={handleAddMeal}
        disabled={loading || !selectedFood}
      >
        <Text style={styles.addButtonText}>
          {loading ? 'Adding...' : 'Add Meal'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    backgroundColor: '#2a2a2a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  mealTypeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  mealTypeText: {
    color: '#aaa',
    fontWeight: 'bold',
  },
  mealTypeTextActive: {
    color: '#fff',
  },
  searchInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  foodList: {
    marginTop: 12,
  },
  foodItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  foodItemSelected: {
    borderColor: '#4CAF50',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  foodBrand: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  foodMacros: {
    color: '#666',
    fontSize: 12,
  },
  quantityInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#333',
  },
  quantityHint: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 8,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

