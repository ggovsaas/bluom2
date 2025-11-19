// src/pages/MealPlanner.tsx
// Meal Planner Page - Full meal planning interface
// React Native + Web compatible

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import MacroTracker from '../components/mealplanner/MacroTracker';
import MealPlanCard from '../components/mealplanner/MealPlanCard';

export default function MealPlanner() {
  const [userId, setUserId] = useState<string | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadPlan();
    }
  }, [userId, selectedDate]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const loadPlan = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `/api/mealplanner/plan?date=${selectedDate}&type=daily`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        setPlan(result.plan);
      }
    } catch (error) {
      console.error('Error loading plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    try {
      setGenerating(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/mealplanner/generate-daily', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date: selectedDate })
      });

      if (response.ok) {
        await loadPlan();
      }
    } catch (error) {
      console.error('Error generating plan:', error);
    } finally {
      setGenerating(false);
    }
  };

  const generateGroceryList = async () => {
    if (!plan?.plan?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/mealplanner/generate-grocery-list', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan_id: plan.plan.id })
      });

      if (response.ok) {
        alert('Grocery list generated!');
      }
    } catch (error) {
      console.error('Error generating grocery list:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meal Planner</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={generatePlan}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Generate Plan</Text>
          )}
        </TouchableOpacity>
      </View>

      {userId && (
        <MacroTracker userId={userId} date={selectedDate} />
      )}

      <View style={styles.planSection}>
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        
        {plan?.items && plan.items.length > 0 ? (
          plan.items.map((item: any, index: number) => (
            <MealPlanCard
              key={item.id || index}
              meal={item}
              onSwap={() => {
                // Handle meal swap
                console.log('Swap meal:', item.id);
              }}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No meals planned yet</Text>
            <Text style={styles.emptySubtext}>
              Tap "Generate Plan" to create your meal plan
            </Text>
          </View>
        )}
      </View>

      {plan?.plan?.id && (
        <TouchableOpacity
          style={styles.groceryButton}
          onPress={generateGroceryList}
        >
          <Text style={styles.groceryButtonText}>
            🛒 Generate Grocery List
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  planSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  groceryButton: {
    backgroundColor: '#2196F3',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  groceryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

