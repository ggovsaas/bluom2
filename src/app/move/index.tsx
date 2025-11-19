// src/app/move/index.tsx
// Move dashboard - Main screen

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getUserWorkouts, getSteps } from '../../services/move';
import { supabase } from '../../lib/supabaseClient';
import StepsWidget from '../../components/StepsWidget';
import WorkoutList from '../../components/WorkoutList';

export default function MoveScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [steps, setSteps] = useState(0);
  const [stepsGoal, setStepsGoal] = useState(8000);
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
      const [workoutsData, stepsData, settings] = await Promise.all([
        getUserWorkouts(user!.id),
        getSteps(user!.id, today),
        supabase
          .from('user_settings')
          .select('steps_goal')
          .eq('user_id', user!.id)
          .single(),
      ]);

      setWorkouts(workoutsData);
      setSteps(stepsData.steps || 0);

      if (settings.data?.steps_goal) {
        setStepsGoal(settings.data.steps_goal);
      }
    } catch (error) {
      console.error('Error loading move data:', error);
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

  const stepsPercent = Math.min((steps / stepsGoal) * 100, 100);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Move</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/move/workout/builder')}
        >
          <Text style={styles.addButtonText}>+ New Workout</Text>
        </TouchableOpacity>
      </View>

      {/* Steps Widget */}
      <StepsWidget userId={user!.id} date={today} />

      {/* Workouts */}
      <WorkoutList userId={user!.id} workouts={workouts} onRefresh={loadData} />
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
});

