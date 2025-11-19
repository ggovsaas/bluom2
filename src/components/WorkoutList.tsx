// src/components/WorkoutList.tsx
// Workout list component

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

interface WorkoutListProps {
  userId: string;
  workouts: any[];
  onRefresh: () => void;
}

export default function WorkoutList({ userId, workouts, onRefresh }: WorkoutListProps) {
  const router = useRouter();

  const handleStartWorkout = (workoutId: string) => {
    router.push({
      pathname: '/move/workout/player',
      params: { workoutId },
    });
  };

  const handleEditWorkout = (workoutId: string) => {
    router.push({
      pathname: '/move/workout/builder',
      params: { workoutId },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Workouts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/move/workout/builder')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {workouts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No workouts yet</Text>
          <Text style={styles.emptyHint}>Create your first workout to get started</Text>
        </View>
      ) : (
        <ScrollView style={styles.workoutsList}>
          {workouts.map((workout) => {
            const exerciseCount = workout.workout_exercises?.length || 0;
            return (
              <View key={workout.id} style={styles.workoutCard}>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutName}>{workout.title}</Text>
                  {workout.description && (
                    <Text style={styles.workoutDescription}>{workout.description}</Text>
                  )}
                  <Text style={styles.workoutMeta}>
                    {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
                  </Text>
                </View>
                <View style={styles.workoutActions}>
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => handleStartWorkout(workout.id)}
                  >
                    <Text style={styles.startButtonText}>Start</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditWorkout(workout.id)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginBottom: 8,
  },
  emptyHint: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  workoutsList: {
    maxHeight: 400,
  },
  workoutCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  workoutInfo: {
    marginBottom: 12,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  workoutDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  workoutMeta: {
    fontSize: 12,
    color: '#666',
  },
  workoutActions: {
    flexDirection: 'row',
    gap: 8,
  },
  startButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

