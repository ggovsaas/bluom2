import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { playSound } from '../utils/soundEffects';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

interface Exercise {
  id: number;
  name: string;
  category: string;
  type: 'weight' | 'bodyweight' | 'cardio';
  caloriesPerMinute: number;
  muscleGroups: string[];
}

interface ExerciseEntry {
  id: string;
  exerciseId: number;
  name: string;
  duration: number;
  calories: number;
  sets?: number;
  reps?: number;
  weight?: number;
  type: string;
  date: string;
  timestamp: Date;
}

interface StepsEntry {
  id: string;
  steps: number;
  calories: number;
  date: string;
  timestamp: Date;
}

export default function MoveScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { 
    profile, 
    dailyData, 
    updateDailyData, 
    addExerciseEntry, 
    getExerciseEntriesForDate, 
    getCurrentDate 
  } = useUser();
  
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [showCustomExercise, setShowCustomExercise] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [workoutForm, setWorkoutForm] = useState({
    duration: '',
    sets: '',
    reps: '',
    weight: '',
    calories: ''
  });
  
  const [customExerciseForm, setCustomExerciseForm] = useState({
    name: '',
    description: '',
    duration: '',
    calories: ''
  });
  
  const [stepsInput, setStepsInput] = useState('');
  const [stepsEntries, setStepsEntries] = useState<StepsEntry[]>([]);

  const currentDate = getCurrentDate();
  const todayExercises = getExerciseEntriesForDate(currentDate);
  const todayStepsEntries = stepsEntries.filter(entry => entry.date === currentDate);
  
  // Calculate today's totals from exercise entries
  const todayTotals = todayExercises.reduce((total, exercise) => ({
    workouts: total.workouts + 1,
    minutes: total.minutes + exercise.duration,
    calories: total.calories + exercise.calories
  }), { workouts: 0, minutes: 0, calories: 0 });

  const workoutCategories = ['All', 'Strength', 'Cardio', 'HIIT', 'Flexibility'];

  // Listen for route params to open modals
  useEffect(() => {
    const params = route.params as any;
    if (params?.openWorkouts) {
      setShowExerciseSearch(true);
      // Clear the param after opening
      navigation.setParams({ openWorkouts: undefined });
    }
  }, [route.params, navigation]);

  // Load steps entries from AsyncStorage
  useEffect(() => {
    const loadStepsEntries = async () => {
      try {
        const savedStepsEntries = await AsyncStorage.getItem('aifit_steps_entries');
        if (savedStepsEntries) {
          setStepsEntries(JSON.parse(savedStepsEntries));
        }
      } catch (error) {
        console.error('Error loading steps entries:', error);
      }
    };
    loadStepsEntries();
  }, []);

  const searchExercises = async (query: string, category?: string) => {
    if (!query.trim() && !category) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      let queryBuilder = supabase.from('exercise_library').select('*');
      
      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      }
      
      if (category && category !== 'All') {
        queryBuilder = queryBuilder.eq('category', category);
      }
      
      const { data, error } = await queryBuilder.limit(50);
      
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Exercise search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchExercises(searchQuery, selectedCategory);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory]);

  const calculateCalories = (exercise: Exercise, duration: number, sets?: number, reps?: number, weight?: number) => {
    let baseCalories = exercise.caloriesPerMinute * duration;
    
    // Adjust for weight training
    if (exercise.type === 'weight' && sets && reps && weight) {
      const intensityMultiplier = Math.min(weight / 50, 2); // Cap at 2x multiplier
      baseCalories *= intensityMultiplier;
    }
    
    return Math.round(baseCalories);
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setWorkoutForm({
      duration: '30',
      sets: exercise.type === 'weight' ? '3' : '',
      reps: exercise.type === 'weight' ? '10' : '',
      weight: exercise.type === 'weight' ? '50' : '',
      calories: ''
    });
  };

  const logExercise = async () => {
    if (!selectedExercise || !workoutForm.duration) return;

    const duration = parseInt(workoutForm.duration);
    const sets = workoutForm.sets ? parseInt(workoutForm.sets) : undefined;
    const reps = workoutForm.reps ? parseInt(workoutForm.reps) : undefined;
    const weight = workoutForm.weight ? parseInt(workoutForm.weight) : undefined;
    
    const calculatedCalories = workoutForm.calories 
      ? parseInt(workoutForm.calories)
      : calculateCalories(selectedExercise, duration, sets, reps, weight);

    const entry: ExerciseEntry = {
      id: `${Date.now()}-${Math.random()}`,
      exerciseId: selectedExercise.id,
      name: selectedExercise.name,
      duration,
      calories: calculatedCalories,
      sets,
      reps,
      weight,
      type: selectedExercise.type,
      date: currentDate,
      timestamp: new Date()
    };

    await addExerciseEntry(entry);
    playSound('impact');
    
    // Update daily data
    updateDailyData({
      exerciseMinutes: dailyData.exerciseMinutes + duration,
      caloriesBurned: dailyData.caloriesBurned + calculatedCalories
    });

    // Reset form
    setSelectedExercise(null);
    setWorkoutForm({ duration: '', sets: '', reps: '', weight: '', calories: '' });
    setShowExerciseSearch(false);
    setShowWorkoutModal(false);
    
    playSound('ding');
    Alert.alert('Success', `${selectedExercise.name} logged successfully!`);
  };

  const logCustomExercise = async () => {
    if (!customExerciseForm.name || !customExerciseForm.duration || !customExerciseForm.calories) return;

    const entry: ExerciseEntry = {
      id: `${Date.now()}-${Math.random()}`,
      exerciseId: 0,
      name: customExerciseForm.name,
      duration: parseInt(customExerciseForm.duration),
      calories: parseInt(customExerciseForm.calories),
      type: 'custom',
      date: currentDate,
      timestamp: new Date()
    };

    await addExerciseEntry(entry);
    playSound('impact');
    
    // Update daily data
    updateDailyData({
      exerciseMinutes: dailyData.exerciseMinutes + parseInt(customExerciseForm.duration),
      caloriesBurned: dailyData.caloriesBurned + parseInt(customExerciseForm.calories)
    });

    // Reset form
    setCustomExerciseForm({ name: '', description: '', duration: '', calories: '' });
    setShowCustomExercise(false);
    setShowWorkoutModal(false);
    
    playSound('ding');
    Alert.alert('Success', `${customExerciseForm.name} logged successfully!`);
  };

  const addSteps = async () => {
    if (stepsInput) {
      const steps = parseInt(stepsInput);
      const estimatedCalories = Math.round(steps * 0.04); // 0.04 calories per step
      
      // Create steps entry
      const stepsEntry: StepsEntry = {
        id: `steps-${Date.now()}-${Math.random()}`,
        steps,
        calories: estimatedCalories,
        date: currentDate,
        timestamp: new Date()
      };

      // Add to steps entries
      const updatedStepsEntries = [...stepsEntries, stepsEntry];
      setStepsEntries(updatedStepsEntries);
      await AsyncStorage.setItem('aifit_steps_entries', JSON.stringify(updatedStepsEntries));
      
      // Update daily data
      updateDailyData({
        steps: dailyData.steps + steps,
        caloriesBurned: dailyData.caloriesBurned + estimatedCalories
      });
      
      playSound('click');
      setStepsInput('');
      setShowStepsModal(false);
      
      Alert.alert('Success', `${steps.toLocaleString()} steps added!`);
    }
  };

  const weeklyStats = {
    workouts: 16,
    totalTime: 12 * 60, // 12 hours in minutes
    totalCalories: 2400,
    avgPerDay: Math.round(2400 / 7)
  };

  // Combine exercise and steps entries for today's activities
  const todayActivities = [
    ...todayExercises.map(exercise => ({
      ...exercise,
      activityType: 'exercise' as const
    })),
    ...todayStepsEntries.map(stepsEntry => ({
      id: stepsEntry.id,
      name: `${stepsEntry.steps.toLocaleString()} Steps`,
      duration: 0,
      calories: stepsEntry.calories,
      timestamp: stepsEntry.timestamp,
      activityType: 'steps' as const
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Weekly chart data
  const weekData = [2, 1, 3, 2, 4, 1, todayTotals.workouts || 1];
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
        <Text style={styles.title}>Move</Text>
              <Text style={styles.subtitle}>Track your workouts & activity</Text>
      </View>

            {/* Plus Button */}
            <TouchableOpacity
              style={[styles.headerButton, styles.plusButton]}
              onPress={() => setShowDropdown(!showDropdown)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
        </View>
      </View>

        {/* Plus Menu */}
        {showDropdown && (
          <View style={styles.plusMenu}>
        <TouchableOpacity 
              style={styles.plusMenuItem}
              onPress={() => {
                setShowWorkoutModal(true);
                setShowDropdown(false);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="barbell" size={20} color="#1e293b" />
              <Text style={styles.plusMenuText}>Log Workout</Text>
        </TouchableOpacity>
        <TouchableOpacity 
              style={styles.plusMenuItem}
              onPress={() => {
                setShowStepsModal(true);
                setShowDropdown(false);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="locate" size={20} color="#1e293b" />
              <Text style={styles.plusMenuText}>Add Steps</Text>
        </TouchableOpacity>
        <TouchableOpacity 
              style={styles.plusMenuItem}
              onPress={() => {
                setShowCustomExercise(true);
                setShowWorkoutModal(true);
                setShowDropdown(false);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={20} color="#1e293b" />
              <Text style={styles.plusMenuText}>Custom Exercise</Text>
        </TouchableOpacity>
      </View>
        )}

        {/* Enhanced Activity Summary */}
        <View style={styles.activitySummary}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="barbell" size={24} color="#2563eb" />
          </View>
            <Text style={styles.summaryLabel} numberOfLines={1} adjustsFontSizeToFit>Workouts</Text>
            <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>{todayTotals.workouts}</Text>
            <Text style={styles.summarySubtext} numberOfLines={1} adjustsFontSizeToFit>Today</Text>
              </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="time" size={24} color="#2563eb" />
              </View>
            <Text style={styles.summaryLabel} numberOfLines={1} adjustsFontSizeToFit>Minutes</Text>
            <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>{todayTotals.minutes}</Text>
            <Text style={styles.summarySubtext} numberOfLines={1} adjustsFontSizeToFit>Exercise time</Text>
            </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="flash" size={24} color="#2563eb" />
            </View>
            <Text style={styles.summaryLabel} numberOfLines={1} adjustsFontSizeToFit>Calories</Text>
            <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>{todayTotals.calories}</Text>
            <Text style={styles.summarySubtext} numberOfLines={1} adjustsFontSizeToFit>Burned today</Text>
      </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#ede9fe' }]}>
              <Ionicons name="locate" size={24} color="#8b5cf6" />
            </View>
            <Text style={styles.summaryLabel} numberOfLines={1} adjustsFontSizeToFit>Steps</Text>
            <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>{dailyData.steps.toLocaleString()}</Text>
            <TouchableOpacity onPress={() => setShowStepsModal(true)}>
              <Text style={styles.addStepsLink}>Add steps</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Progress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Weekly Progress</Text>
            <Ionicons name="trending-up" size={24} color="#2563eb" />
          </View>

          <View style={styles.chartContainer}>
            {weekData.map((workouts, index) => (
              <View key={index} style={styles.chartBarWrapper}>
                <View
              style={[
                    styles.chartBar,
                    { height: workouts * 15 }, // Scale height for better visualization
                  ]}
                />
                <Text style={styles.chartDay}>{weekDays[index]}</Text>
              </View>
            ))}
          </View>

          <View style={styles.weeklyStatsGrid}>
            <View style={styles.weeklyStatItem}>
              <Text style={styles.weeklyStatValue}>{weeklyStats.workouts}</Text>
              <Text style={styles.weeklyStatLabel}>Workouts</Text>
            </View>
            <View style={styles.weeklyStatItem}>
              <Text style={styles.weeklyStatValue}>{Math.round(weeklyStats.totalTime / 60)}h</Text>
              <Text style={styles.weeklyStatLabel}>Total time</Text>
            </View>
            <View style={styles.weeklyStatItem}>
              <Text style={styles.weeklyStatValue}>{weeklyStats.totalCalories}</Text>
              <Text style={styles.weeklyStatLabel}>Calories</Text>
            </View>
          </View>
        </View>

        {/* Today's Activities */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Activities</Text>
            <Ionicons name="pulse" size={24} color="#2563eb" />
          </View>
          
          {todayActivities.length > 0 ? (
            <View style={styles.activitiesList}>
              {todayActivities.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={styles.activityLeft}>
                    <View style={[styles.activityIconContainer, { backgroundColor: '#dbeafe' }]}>
                      {activity.activityType === 'steps' ? (
                        <Ionicons name="locate" size={16} color="#2563eb" />
                      ) : (
                        <Ionicons name="barbell" size={16} color="#2563eb" />
                      )}
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityName}>{activity.name}</Text>
                      <Text style={styles.activityDetails}>
                        {activity.activityType === 'exercise' && activity.duration > 0 && `${activity.duration} min • `}
                        {activity.calories} cal
                        {activity.activityType === 'exercise' && 'sets' in activity && activity.sets && activity.reps && (
                          <Text> • {activity.sets}x{activity.reps}</Text>
                        )}
                        {activity.activityType === 'exercise' && 'weight' in activity && activity.weight && (
                          <Text> • {activity.weight}lbs</Text>
                        )}
              </Text>
                    </View>
                  </View>
                  <Text style={styles.activityTime}>
                    {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
          ))}
        </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="barbell" size={32} color="#94a3b8" />
              </View>
              <Text style={styles.emptyStateText}>No activities logged today</Text>
              <Text style={styles.emptyStateSubtext}>Start your fitness journey!</Text>
            </View>
          )}
      </View>

        {/* Achievements */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Achievements</Text>
            <Ionicons name="trophy" size={24} color="#f59e0b" />
          </View>

          <View style={styles.achievementsList}>
            <View style={[styles.achievementItem, { backgroundColor: '#fef3c7' }]}>
              <View style={[styles.achievementIcon, { backgroundColor: '#f59e0b' }]}>
                <Ionicons name="star" size={16} color="#ffffff" />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>First Workout</Text>
                <Text style={styles.achievementDescription}>Completed your first exercise session!</Text>
              </View>
            </View>
            
            <View style={[styles.achievementItem, { backgroundColor: '#dbeafe' }]}>
              <View style={[styles.achievementIcon, { backgroundColor: '#2563eb' }]}>
                <Ionicons name="locate" size={16} color="#ffffff" />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>Step Goal</Text>
                <Text style={styles.achievementDescription}>Reached 10,000 steps in a day!</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Workout Modal */}
      <Modal visible={showWorkoutModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowWorkoutModal(false)}>
        <SafeAreaView style={styles.modalContent} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{showCustomExercise ? 'Create Custom Exercise' : 'Log Workout'}</Text>
            <TouchableOpacity onPress={() => {
              setShowWorkoutModal(false);
              setShowCustomExercise(false);
            }}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {showCustomExercise ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Exercise name</Text>
          <TextInput
                    style={styles.input}
                    placeholder="Exercise name"
                    value={customExerciseForm.name}
                    onChangeText={(text) => setCustomExerciseForm({ ...customExerciseForm, name: text })}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description (optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Description (optional)"
                    value={customExerciseForm.description}
                    onChangeText={(text) => setCustomExerciseForm({ ...customExerciseForm, description: text })}
                    multiline
                    numberOfLines={3}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Duration (minutes)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Duration (minutes)"
                    value={customExerciseForm.duration}
                    onChangeText={(text) => setCustomExerciseForm({ ...customExerciseForm, duration: text })}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Calories burned</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Calories burned"
                    value={customExerciseForm.calories}
                    onChangeText={(text) => setCustomExerciseForm({ ...customExerciseForm, calories: text })}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.modalButtons}>
                <TouchableOpacity
                    style={styles.modalButtonSecondary}
                  onPress={() => {
                      setShowCustomExercise(false);
                      setShowWorkoutModal(false);
                    }}
                  >
                    <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, (!customExerciseForm.name || !customExerciseForm.duration || !customExerciseForm.calories) && styles.modalButtonDisabled]}
                    onPress={logCustomExercise}
                    disabled={!customExerciseForm.name || !customExerciseForm.duration || !customExerciseForm.calories}
                  >
                    <Text style={styles.modalButtonText}>Log Exercise</Text>
            </TouchableOpacity>
          </View>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.searchExerciseButton}
                  onPress={() => setShowExerciseSearch(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="search" size={20} color="#64748b" />
                  <Text style={styles.searchExerciseButtonText}>Search Exercise Database</Text>
                </TouchableOpacity>

            {selectedExercise && (
                  <View style={styles.selectedExerciseCard}>
                    <Text style={styles.selectedExerciseName}>{selectedExercise.name}</Text>
                    <Text style={styles.selectedExerciseCategory}>{selectedExercise.category} • {selectedExercise.type}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                        placeholder="Duration (minutes)"
                value={workoutForm.duration}
                        onChangeText={(text) => setWorkoutForm({ ...workoutForm, duration: text })}
                keyboardType="numeric"
              />
            </View>

                    {selectedExercise.type === 'weight' && (
              <>
                        <View style={styles.inputRow}>
                          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Sets</Text>
                  <TextInput
                    style={styles.input}
                              placeholder="Sets"
                    value={workoutForm.sets}
                    onChangeText={(text) => setWorkoutForm({ ...workoutForm, sets: text })}
                    keyboardType="numeric"
                  />
                </View>
                          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Reps</Text>
                  <TextInput
                    style={styles.input}
                              placeholder="Reps"
                    value={workoutForm.reps}
                    onChangeText={(text) => setWorkoutForm({ ...workoutForm, reps: text })}
                    keyboardType="numeric"
                  />
                </View>
                        </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Weight (lbs)</Text>
                  <TextInput
                    style={styles.input}
                            placeholder="Weight (lbs)"
                    value={workoutForm.weight}
                    onChangeText={(text) => setWorkoutForm({ ...workoutForm, weight: text })}
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Calories burned (optional)</Text>
              <TextInput
                style={styles.input}
                        placeholder="Calories burned (optional)"
                value={workoutForm.calories}
                onChangeText={(text) => setWorkoutForm({ ...workoutForm, calories: text })}
                keyboardType="numeric"
              />
            </View>
            
                    {workoutForm.duration && (
                      <Text style={styles.estimatedCalories}>
                        Estimated calories: {calculateCalories(
                          selectedExercise, 
                          parseInt(workoutForm.duration) || 0,
                          workoutForm.sets ? parseInt(workoutForm.sets) : undefined,
                          workoutForm.reps ? parseInt(workoutForm.reps) : undefined,
                          workoutForm.weight ? parseInt(workoutForm.weight) : undefined
                        )}
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButtonSecondary}
                    onPress={() => setShowWorkoutModal(false)}
                  >
                    <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, (!selectedExercise || !workoutForm.duration) && styles.modalButtonDisabled]}
                    onPress={logExercise}
                    disabled={!selectedExercise || !workoutForm.duration}
                  >
                    <Text style={styles.modalButtonText}>Log Workout</Text>
                  </TouchableOpacity>
        </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Exercise Search Modal */}
      <Modal visible={showExerciseSearch} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowExerciseSearch(false)}>
        <SafeAreaView style={styles.modalContent} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Exercises</Text>
            <TouchableOpacity onPress={() => setShowExerciseSearch(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search exercises..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {workoutCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipActive
                  ]}
                  onPress={() => setSelectedCategory(category)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.categoryChipTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={styles.loadingText}>Searching exercises...</Text>
            </View>
              ) : (
                <>
                  {searchResults.map((exercise) => (
                    <TouchableOpacity
                      key={exercise.id}
                      style={styles.exerciseResultItem}
                      onPress={() => {
                        handleExerciseSelect(exercise);
                        setShowExerciseSearch(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.exerciseResultInfo}>
                        <Text style={styles.exerciseResultName}>{exercise.name}</Text>
                        <Text style={styles.exerciseResultCategory}>
                          {exercise.category} • {exercise.type} • {exercise.caloriesPerMinute} cal/min
                        </Text>
                        <Text style={styles.exerciseResultMuscles}>
                          {exercise.muscleGroups.join(', ')}
                        </Text>
                      </View>
                      <View style={styles.exerciseResultAdd}>
                        <Ionicons name="add" size={16} color="#2563eb" />
                      </View>
                    </TouchableOpacity>
                  ))}

                  {!loading && searchQuery && searchResults.length === 0 && (
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>No exercises found for "{searchQuery}"</Text>
            </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Steps Modal */}
      <Modal visible={showStepsModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowStepsModal(false)}>
        <SafeAreaView style={styles.modalContent} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Steps</Text>
            <TouchableOpacity onPress={() => setShowStepsModal(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalScroll}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Number of steps</Text>
              <TextInput
                style={styles.input}
                placeholder="Number of steps"
                value={stepsInput}
                onChangeText={setStepsInput}
                keyboardType="numeric"
              />
            </View>
            
            {stepsInput && (
              <Text style={styles.estimatedCalories}>
                Estimated calories: {Math.round(parseInt(stepsInput) * 0.04)}
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowStepsModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, !stepsInput && styles.modalButtonDisabled]}
                onPress={addSteps}
                disabled={!stepsInput}
              >
                <Text style={styles.modalButtonText}>Add Steps</Text>
              </TouchableOpacity>
        </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ebf2fe',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  plusButton: {
    backgroundColor: '#3b82f6',
  },
  plusMenu: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  plusMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  plusMenuText: {
    fontSize: 14,
    color: '#1e293b',
  },
  activitySummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  summaryCard: {
    width: (width - 48 - 16) / 2,
    backgroundColor: '#ffffff',
    padding: isSmallScreen ? 12 : 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryIconContainer: {
    width: isSmallScreen ? 40 : 48,
    height: isSmallScreen ? 40 : 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 8 : 12,
  },
  summaryLabel: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#64748b',
    marginBottom: 4,
    minHeight: 16,
  },
  summaryValue: {
    fontSize: isSmallScreen ? 18 : 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
    minHeight: isSmallScreen ? 22 : 28,
  },
  summarySubtext: {
    fontSize: isSmallScreen ? 10 : 12,
    color: '#94a3b8',
    minHeight: 14,
  },
  addStepsLink: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  chartBarWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 24,
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  chartDay: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  weeklyStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  weeklyStatItem: {
    alignItems: 'center',
  },
  weeklyStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  weeklyStatLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  activitiesList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 14,
    color: '#64748b',
  },
  activityTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#f1f5f9',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  // Modal styles
  modalContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  searchExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  searchExerciseButtonText: {
    fontSize: 16,
    color: '#64748b',
  },
  selectedExerciseCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectedExerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  selectedExerciseCategory: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  estimatedCalories: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalButtonSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  searchContainer: {
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1e293b',
  },
  categoriesScroll: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#2563eb',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
  exerciseResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 12,
  },
  exerciseResultInfo: {
    flex: 1,
  },
  exerciseResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  exerciseResultCategory: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  exerciseResultMuscles: {
    fontSize: 12,
    color: '#94a3b8',
  },
  exerciseResultAdd: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#64748b',
  },
});
