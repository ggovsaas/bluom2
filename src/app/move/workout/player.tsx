// src/app/move/workout/player.tsx
// Workout player - perform workout and log sets

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { getWorkout, startWorkout, logSet, endWorkout } from '../../../services/move';
import SetLogModal from '../../../components/SetLogModal';

export default function WorkoutPlayer() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams();
  const { user } = useAuth();
  const [workout, setWorkout] = useState<any>(null);
  const [workoutLog, setWorkoutLog] = useState<any>(null);
  const [exerciseSets, setExerciseSets] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [setModalVisible, setSetModalVisible] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<{ id: number; name: string; reps?: number } | null>(null);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);

  useEffect(() => {
    if (workoutId && user) {
      loadWorkout();
    }
  }, [workoutId, user]);

  const loadWorkout = async () => {
    try {
      setLoading(true);
      const workoutData = await getWorkout(workoutId as string);
      setWorkout(workoutData);

      // Start workout log
      const log = await startWorkout(user!.id, workoutId as string);
      setWorkoutLog(log);

      // Initialize sets tracking
      const initialSets: Record<number, any[]> = {};
      workoutData.workout_exercises?.forEach((we: any) => {
        initialSets[we.exercise_id] = [];
      });
      setExerciseSets(initialSets);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not load workout');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSetModal = (exerciseId: number, exerciseName: string, setNumber: number, defaultReps?: number) => {
    setCurrentExercise({ id: exerciseId, name: exerciseName, reps: defaultReps });
    setCurrentSetNumber(setNumber);
    setSetModalVisible(true);
  };

  const handleLogSet = async (setData: { weight?: number; reps?: number; rpe?: number }) => {
    if (!currentExercise || !workoutLog) return;

    try {
      const defaultSets = workout?.workout_exercises?.find(
        (we: any) => we.exercise_id === currentExercise.id
      );

      const loggedSet = await logSet(
        workoutLog.id,
        currentExercise.id,
        currentSetNumber,
        setData.weight,
        setData.reps || currentExercise.reps || defaultSets?.reps || 10,
        setData.rpe,
        defaultSets?.rest_seconds || 90
      );

      // Update local state
      setExerciseSets((prev) => ({
        ...prev,
        [currentExercise.id]: [...(prev[currentExercise.id] || []), loggedSet],
      }));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not log set');
    }
  };

  const handleFinishWorkout = async () => {
    try {
      await endWorkout(workoutLog.id);
      Alert.alert('Success', 'Workout completed!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not finish workout');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!workout || !workoutLog) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Workout not found</Text>
      </View>
    );
  }

  const exercises = workout.workout_exercises || [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{workout.title}</Text>
        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinishWorkout}
        >
          <Text style={styles.finishButtonText}>Finish</Text>
        </TouchableOpacity>
      </View>

      {exercises.map((we: any, index: number) => {
        const exercise = we.exercise_db;
        const sets = exerciseSets[we.exercise_id] || [];
        const nextSetNumber = sets.length + 1;

        return (
          <View key={we.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseNumber}>{index + 1}</Text>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise?.name || 'Exercise'}</Text>
                <Text style={styles.exerciseTarget}>
                  Target: {we.sets} sets × {we.reps || '?'} reps
                </Text>
              </View>
            </View>

            {/* Logged Sets */}
            {sets.length > 0 && (
              <View style={styles.setsList}>
                {sets.map((set: any, setIndex: number) => (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={styles.setNumber}>Set {setIndex + 1}</Text>
                    <Text style={styles.setData}>
                      {set.weight ? `${set.weight}kg` : '—'} × {set.reps || '—'} reps
                      {set.rpe && ` @ RPE ${set.rpe}`}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Add Set Button */}
            {nextSetNumber <= (we.sets || 3) && (
              <TouchableOpacity
                style={styles.addSetButton}
                onPress={() => handleOpenSetModal(we.exercise_id, exercise?.name || 'Exercise', nextSetNumber, we.reps)}
              >
                <Text style={styles.addSetButtonText}>
                  + Log Set {nextSetNumber}
                </Text>
              </TouchableOpacity>
            )}

            {sets.length >= (we.sets || 3) && (
              <Text style={styles.completeText}>✓ All sets completed</Text>
            )}
          </View>
        );
      })}

      <SetLogModal
        visible={setModalVisible}
        exerciseName={currentExercise?.name || ''}
        setNumber={currentSetNumber}
        defaultReps={currentExercise?.reps}
        onSave={handleLogSet}
        onClose={() => setSetModalVisible(false)}
      />
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  finishButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  finishButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  exerciseCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  exerciseNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 12,
    width: 30,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  exerciseTarget: {
    fontSize: 14,
    color: '#aaa',
  },
  setsList: {
    marginBottom: 12,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  setNumber: {
    color: '#aaa',
    fontSize: 14,
  },
  setData: {
    color: '#fff',
    fontSize: 14,
  },
  addSetButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addSetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});

