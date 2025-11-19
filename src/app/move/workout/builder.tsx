// src/app/move/workout/builder.tsx
// Workout builder screen

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { getExercises, getExerciseCategories, createWorkout, addExerciseToWorkout, getWorkout, removeExerciseFromWorkout } from '../../../services/move';

export default function WorkoutBuilder() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('hypertrophy');
  const [library, setLibrary] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [currentWorkoutId, setCurrentWorkoutId] = useState<string | null>(workoutId as string || null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentWorkoutId) {
      loadWorkout();
    }
  }, [currentWorkoutId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [exercisesData, categoriesData] = await Promise.all([
        getExercises(user!.id),
        getExerciseCategories(),
      ]);

      setLibrary(exercisesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkout = async () => {
    try {
      const workout = await getWorkout(currentWorkoutId!);
      setName(workout.title);
      setGoal(workout.description || 'hypertrophy');
      setSelectedExercises(workout.workout_exercises || []);
    } catch (error) {
      console.error('Error loading workout:', error);
    }
  };

  const handleCreateWorkout = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }

    try {
      const workout = await createWorkout(user!.id, name, goal);
      setCurrentWorkoutId(workout.id);
      Alert.alert('Success', 'Workout created! Now add exercises.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not create workout');
    }
  };

  const handleAddExercise = async (exercise: any) => {
    if (!currentWorkoutId) {
      Alert.alert('Error', 'Please create workout first');
      return;
    }

    try {
      await addExerciseToWorkout(
        currentWorkoutId,
        exercise.id,
        selectedExercises.length,
        3,
        10,
        90
      );
      await loadWorkout();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not add exercise');
    }
  };

  const handleRemoveExercise = async (workoutExerciseId: number) => {
    try {
      await removeExerciseFromWorkout(workoutExerciseId);
      await loadWorkout();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not remove exercise');
    }
  };

  const filteredExercises = library.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || ex.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
        <Text style={styles.title}>
          {currentWorkoutId ? 'Edit Workout' : 'New Workout'}
        </Text>
      </View>

      {!currentWorkoutId ? (
        <View style={styles.createSection}>
          <TextInput
            style={styles.input}
            placeholder="Workout Name"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Goal (optional)"
            placeholderTextColor="#666"
            value={goal}
            onChangeText={setGoal}
          />
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateWorkout}
          >
            <Text style={styles.createButtonText}>Create Workout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutName}>{name}</Text>
            {goal && <Text style={styles.workoutGoal}>{goal}</Text>}
          </View>

          <View style={styles.selectedSection}>
            <Text style={styles.sectionTitle}>Exercises ({selectedExercises.length})</Text>
            {selectedExercises.map((we, index) => (
              <View key={we.id} style={styles.selectedExercise}>
                <View style={styles.selectedExerciseInfo}>
                  <Text style={styles.selectedExerciseName}>
                    {index + 1}. {we.exercise_db?.name || 'Exercise'}
                  </Text>
                  <Text style={styles.selectedExerciseMeta}>
                    {we.sets} sets × {we.reps || '?'} reps
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveExercise(we.id)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.librarySection}>
            <Text style={styles.sectionTitle}>Exercise Library</Text>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <ScrollView horizontal style={styles.categoriesList}>
              <TouchableOpacity
                style={[styles.categoryTag, !selectedCategory && styles.categoryTagActive]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.categoryTagText, !selectedCategory && styles.categoryTagTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryTag, selectedCategory === cat.id && styles.categoryTagActive]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={[styles.categoryTagText, selectedCategory === cat.id && styles.categoryTagTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.exercisesList}>
              {filteredExercises.map((exercise) => {
                const isSelected = selectedExercises.some((se) => se.exercise_id === exercise.id);
                return (
                  <TouchableOpacity
                    key={exercise.id}
                    style={[styles.exerciseItem, isSelected && styles.exerciseItemSelected]}
                    onPress={() => !isSelected && handleAddExercise(exercise)}
                    disabled={isSelected}
                  >
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      {exercise.muscle_group && (
                        <Text style={styles.exerciseMuscle}>{exercise.muscle_group}</Text>
                      )}
                      {exercise.equipment && (
                        <Text style={styles.exerciseEquipment}>{exercise.equipment}</Text>
                      )}
                    </View>
                    {isSelected && (
                      <Text style={styles.addedBadge}>✓ Added</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => router.back()}
          >
            <Text style={styles.finishButtonText}>Done</Text>
          </TouchableOpacity>
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
    padding: 20,
    backgroundColor: '#2a2a2a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  createSection: {
    padding: 20,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  workoutInfo: {
    padding: 20,
    backgroundColor: '#2a2a2a',
    marginBottom: 16,
  },
  workoutName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  workoutGoal: {
    fontSize: 16,
    color: '#aaa',
  },
  selectedSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  selectedExercise: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedExerciseInfo: {
    flex: 1,
  },
  selectedExerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  selectedExerciseMeta: {
    fontSize: 14,
    color: '#aaa',
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    color: '#ff4444',
    fontSize: 24,
    fontWeight: 'bold',
  },
  librarySection: {
    padding: 20,
  },
  searchInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  categoriesList: {
    marginBottom: 16,
  },
  categoryTag: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryTagActive: {
    backgroundColor: '#4CAF50',
  },
  categoryTagText: {
    color: '#aaa',
    fontSize: 14,
  },
  categoryTagTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  exercisesList: {
    maxHeight: 400,
  },
  exerciseItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseItemSelected: {
    opacity: 0.5,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  exerciseMuscle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 2,
  },
  exerciseEquipment: {
    fontSize: 12,
    color: '#666',
  },
  addedBadge: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  finishButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

