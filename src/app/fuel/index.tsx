// src/app/fuel/index.tsx
// Fuel dashboard - Main screen

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getWaterToday } from '../../services/fuel';
import { supabase } from '../../lib/supabaseClient';
import FuelMeal from '../../components/FuelMeal';

export default function FuelScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [water, setWater] = useState(0);
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [waterData] = await Promise.all([
        getWaterToday(user!.id),
      ]);

      setWater(waterData);

      // Get calorie target from user settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('daily_calorie_target')
        .eq('user_id', user!.id)
        .single();

      if (settings?.daily_calorie_target) {
        setCalorieTarget(settings.daily_calorie_target);
      }
    } catch (error) {
      console.error('Error loading fuel data:', error);
    } finally {
      setLoading(false);
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
        <Text style={styles.title}>Fuel</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/fuel/log')}
        >
          <Text style={styles.addButtonText}>+ Log Meal</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/fuel/barcode')}
        >
          <Text style={styles.quickActionText}>📷 Scan Barcode</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/fuel/vision')}
        >
          <Text style={styles.quickActionText}>🤖 Photo Recognition</Text>
        </TouchableOpacity>
      </View>

      {/* Water */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Water</Text>
        <View style={styles.waterRow}>
          <Text style={styles.waterText}>{water}ml / 2500ml</Text>
          <TouchableOpacity
            style={styles.waterButton}
            onPress={() => router.push('/fuel/water')}
          >
            <Text style={styles.waterButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${(water / 2500) * 100}%`, backgroundColor: '#2196F3' }]}
          />
        </View>
      </View>

      {/* Meals */}
      {user && (
        <>
          <FuelMeal userId={user.id} date={today} meal="breakfast" />
          <FuelMeal userId={user.id} date={today} meal="lunch" />
          <FuelMeal userId={user.id} date={today} meal="dinner" />
          <FuelMeal userId={user.id} date={today} meal="snack" />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2a2a2a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#2a2a2a',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  remainingText: {
    color: '#aaa',
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  waterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  waterText: {
    color: '#fff',
    fontSize: 16,
  },
  waterButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  waterButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});

