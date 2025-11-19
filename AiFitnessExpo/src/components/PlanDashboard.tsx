// src/components/PlanDashboard.tsx
// React Native component to display personalized plans

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import usePlan, { PersonalizedPlan } from '../hooks/usePlan';
import { useUser } from '../context/UserContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

interface PlanDashboardProps {
  userId?: number;
}

export default function PlanDashboard({ userId }: PlanDashboardProps) {
  const { plan, loading, error, refresh, regenerate } = usePlan();
  const { isPremiumOrTrial } = useUser();
  const navigation = useNavigation();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading your plan...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="document-text" size={48} color="#9ca3af" />
        <Text style={styles.emptyText}>No plan available</Text>
        <Text style={styles.emptySubtext}>Complete onboarding to generate your plan</Text>
      </View>
    );
  }

  const { meta, nutrition, workouts, wellness, recommendations } = plan;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your Personalized Plan</Text>
            <Text style={styles.subtitle}>
              Generated {new Date(meta.generatedAt).toLocaleDateString()}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={refresh}>
            <Ionicons name="refresh" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Nutrition Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="nutrition" size={24} color="#3b82f6" />
            <Text style={styles.cardTitle}>Nutrition</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Calories</Text>
              <Text style={styles.statValue}>{nutrition.calories}</Text>
              <Text style={styles.statUnit}>kcal</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Protein</Text>
              <Text style={styles.statValue}>{nutrition.macros.proteinG}</Text>
              <Text style={styles.statUnit}>g</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Carbs</Text>
              <Text style={styles.statValue}>{nutrition.macros.carbsG}</Text>
              <Text style={styles.statUnit}>g</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Fat</Text>
              <Text style={styles.statValue}>{nutrition.macros.fatG}</Text>
              <Text style={styles.statUnit}>g</Text>
            </View>
          </View>
          <View style={styles.mealsSection}>
            <Text style={styles.sectionLabel}>Meal Plan ({nutrition.meals.length} meals/day)</Text>
            {nutrition.meals.map((meal) => (
              <View key={meal.id} style={styles.mealItem}>
                <Text style={styles.mealText}>
                  Meal {meal.id}: {meal.calories} kcal
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Workouts Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="barbell" size={24} color="#10b981" />
            <Text style={styles.cardTitle}>Workouts</Text>
          </View>
          {workouts.slice(0, 3).map((workout) => (
            <View key={workout.id} style={styles.workoutItem}>
              <Text style={styles.workoutTitle}>{workout.title}</Text>
              <View style={styles.exercisesList}>
                {workout.exercises.map((exercise, idx) => (
                  <Text key={idx} style={styles.exerciseText}>
                    • {exercise.name} ({exercise.sets} sets × {exercise.reps})
                  </Text>
                ))}
              </View>
              <Text style={styles.workoutNotes}>{workout.notes}</Text>
            </View>
          ))}
          {workouts.length > 3 && (
            <Text style={styles.moreText}>+ {workouts.length - 3} more sessions</Text>
          )}
        </View>

        {/* Wellness Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="heart" size={24} color="#f59e0b" />
            <Text style={styles.cardTitle}>Wellness</Text>
          </View>
          {wellness.map((routine, idx) => (
            <View key={idx} style={styles.wellnessItem}>
              <View style={styles.wellnessHeader}>
                <Text style={styles.wellnessType}>{routine.type}</Text>
                <Text style={styles.wellnessDuration}>{routine.duration} min</Text>
              </View>
              <Text style={styles.wellnessAction}>{routine.action}</Text>
            </View>
          ))}
        </View>

        {/* Recommendations Card */}
        {recommendations.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="sparkles" size={24} color="#8b5cf6" />
              <Text style={styles.cardTitle}>Recommendations</Text>
            </View>
            {recommendations.map((rec, idx) => (
              <View key={idx} style={styles.recommendationItem}>
                <Ionicons name="star" size={16} color="#f59e0b" />
                <Text style={styles.recommendationText}>{rec.title}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Regenerate Button (Premium/Trial only) */}
        {isPremiumOrTrial() && (
          <TouchableOpacity
            style={styles.regenerateButton}
            onPress={async () => {
              try {
                await regenerate();
              } catch (err) {
                // Error handling is done in the hook
              }
            }}
          >
            <Ionicons name="refresh-circle" size={20} color="#fff" />
            <Text style={styles.regenerateButtonText}>Regenerate Plan</Text>
          </TouchableOpacity>
        )}

        {/* Meta Info */}
        <View style={styles.metaCard}>
          <Text style={styles.metaTitle}>Your Metabolic Info</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>BMR:</Text>
            <Text style={styles.metaValue}>{meta.bmr} kcal</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>TDEE:</Text>
            <Text style={styles.metaValue}>{meta.tdee} kcal</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: isSmallScreen ? 22 : 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: isSmallScreen ? 12 : 14,
    color: '#6b7280',
  },
  refreshButton: {
    padding: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    marginLeft: 8,
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '700',
    color: '#111827',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '700',
    color: '#111827',
  },
  statUnit: {
    fontSize: isSmallScreen ? 10 : 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  mealsSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionLabel: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  mealItem: {
    paddingVertical: 8,
  },
  mealText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#6b7280',
  },
  workoutItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  workoutTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  exercisesList: {
    marginLeft: 8,
    marginBottom: 8,
  },
  exerciseText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  workoutNotes: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 4,
  },
  moreText: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#3b82f6',
    textAlign: 'center',
    marginTop: 8,
  },
  wellnessItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  wellnessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  wellnessType: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: '#111827',
    textTransform: 'capitalize',
  },
  wellnessDuration: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#6b7280',
  },
  wellnessAction: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#6b7280',
    marginTop: 4,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationText: {
    marginLeft: 8,
    fontSize: isSmallScreen ? 13 : 14,
    color: '#374151',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  regenerateButtonText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '600',
  },
  metaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  metaTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  metaLabel: {
    fontSize: isSmallScreen ? 14 : 15,
    color: '#6b7280',
  },
  metaValue: {
    fontSize: isSmallScreen ? 14 : 15,
    fontWeight: '600',
    color: '#111827',
  },
});

