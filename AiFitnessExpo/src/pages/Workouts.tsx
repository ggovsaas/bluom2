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
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

interface Exercise {
  name: string;
  duration: number;
  reps?: number;
  sets?: number;
  description: string;
}

interface Workout {
  id: number;
  title: string;
  thumbnail: string;
  videoUrl?: string;
  duration: number;
  calories: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  equipment: string[];
  rating: number;
  reviews: number;
  instructor: string;
  description: string;
  exercises: Exercise[];
  saved: boolean;
  isPremium: boolean;
}

export default function WorkoutsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { profile } = useUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [savedWorkouts, setSavedWorkouts] = useState<number[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [accessedWorkouts, setAccessedWorkouts] = useState<number[]>([]);

  const categories = ['All', 'Strength', 'Cardio', 'HIIT', 'Yoga', 'Pilates', 'Flexibility', 'Core'];

  // Check if user can access workout (3 free limit for non-premium)
  const canAccessWorkout = (workoutId: number) => {
    if (profile?.isPremium) return true;
    return accessedWorkouts.includes(workoutId) || accessedWorkouts.length < 3;
  };

  // Fetch workouts from Supabase
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoading(true);
        let query = supabase.from('workouts').select('*');
        
        // Filter by category if not 'All'
        if (selectedCategory !== 'All') {
          query = query.eq('category', selectedCategory);
        }
        
        // Filter by search query if provided
        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        setWorkouts(data || []);
      } catch (error) {
        console.error('Error fetching workouts:', error);
        setWorkouts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [selectedCategory, searchQuery]);

  const toggleSaveWorkout = (workoutId: number) => {
    setSavedWorkouts(prev =>
      prev.includes(workoutId)
        ? prev.filter(id => id !== workoutId)
        : [...prev, workoutId]
    );
  };

  const handleSelectWorkout = (workout: Workout) => {
    if (!canAccessWorkout(workout.id) && !profile?.isPremium) {
      Alert.alert(
        'Premium Required',
        'You\'ve reached your limit of 3 free workouts. Upgrade to Premium for unlimited access!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Premium' as never) },
        ]
      );
      return;
    }

    if (!accessedWorkouts.includes(workout.id)) {
      setAccessedWorkouts([...accessedWorkouts, workout.id]);
    }
    setSelectedWorkout(workout);
  };

  const handlePlayVideo = () => {
    if (selectedWorkout?.videoUrl) {
      setShowVideoModal(true);
    } else {
      Alert.alert('Coming Soon', 'Video tutorial coming soon! This is a demo feature.');
    }
  };

  // Workout Detail View
  if (selectedWorkout) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
            <TouchableOpacity
              onPress={() => setSelectedWorkout(null)}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
              <Text style={styles.backText}>Back to Workouts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => toggleSaveWorkout(selectedWorkout.id)}
              style={[
                styles.saveButton,
                savedWorkouts.includes(selectedWorkout.id) && styles.saveButtonActive
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={savedWorkouts.includes(selectedWorkout.id) ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={savedWorkouts.includes(selectedWorkout.id) ? '#ffffff' : '#1e293b'}
              />
            </TouchableOpacity>
          </View>

          {/* Workout Thumbnail */}
          <View style={styles.workoutImageContainer}>
            <Image source={{ uri: selectedWorkout.thumbnail }} style={styles.workoutImage} />
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayVideo}
              activeOpacity={0.7}
            >
              <Ionicons name="play" size={32} color="#16a34a" />
            </TouchableOpacity>
            {selectedWorkout.isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={14} color="#ffffff" />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            )}
            {!selectedWorkout.videoUrl && (
              <View style={styles.demoBadge}>
                <Ionicons name="information-circle" size={14} color="#ffffff" />
                <Text style={styles.demoBadgeText}>Demo</Text>
              </View>
            )}
          </View>

          {/* Workout Info */}
          <View style={styles.card}>
            <Text style={styles.workoutTitle}>{selectedWorkout.title}</Text>
            <Text style={styles.workoutDescription}>{selectedWorkout.description}</Text>

            <View style={styles.workoutMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="star" size={16} color="#f59e0b" />
                <Text style={styles.metaText}>{selectedWorkout.rating}</Text>
                <Text style={styles.metaSubtext}>({selectedWorkout.reviews} reviews)</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="#64748b" />
                <Text style={styles.metaText}>{selectedWorkout.duration} min</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="flash" size={16} color="#64748b" />
                <Text style={styles.metaText}>{selectedWorkout.calories} cal</Text>
              </View>
            </View>

            <View style={styles.workoutDetails}>
              <View>
                <Text style={styles.detailLabel}>Instructor</Text>
                <Text style={styles.detailValue}>{selectedWorkout.instructor}</Text>
              </View>
              <View>
                <Text style={styles.detailLabel}>Equipment</Text>
                <Text style={styles.detailValue}>{selectedWorkout.equipment.join(', ')}</Text>
              </View>
              <View style={styles.difficultyContainer}>
                <View style={[
                  styles.difficultyBadge,
                  selectedWorkout.difficulty === 'Beginner' && styles.difficultyBadgeGreen,
                  selectedWorkout.difficulty === 'Intermediate' && styles.difficultyBadgeYellow,
                  selectedWorkout.difficulty === 'Advanced' && styles.difficultyBadgeRed,
                ]}>
                  <Text style={styles.difficultyText}>{selectedWorkout.difficulty}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Exercise List */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Workout Breakdown</Text>
            {selectedWorkout.exercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseItem}>
                <View style={styles.exerciseNumber}>
                  <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.exerciseContent}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                </View>
                <View style={styles.exerciseStats}>
                  {exercise.reps && exercise.sets ? (
                    <Text style={styles.exerciseStatsText}>
                      {exercise.sets} sets × {exercise.reps} reps
                    </Text>
                  ) : (
                    <Text style={styles.exerciseStatsText}>
                      {Math.floor(exercise.duration / 60)}:{(exercise.duration % 60).toString().padStart(2, '0')}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Start Workout Button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('Move' as never)}
            activeOpacity={0.7}
          >
            <Ionicons name="play" size={24} color="#ffffff" />
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Video Modal */}
        <Modal visible={showVideoModal} animationType="slide" transparent={true} onRequestClose={() => setShowVideoModal(false)}>
          <View style={styles.videoModalOverlay}>
            <View style={styles.videoModalContent}>
              <View style={styles.videoModalHeader}>
                <Text style={styles.videoModalTitle}>{selectedWorkout.title}</Text>
                <TouchableOpacity
                  onPress={() => setShowVideoModal(false)}
                  style={styles.videoModalClose}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color="#1e293b" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.videoPlayerPlaceholder}>
                <Ionicons name="play-circle" size={64} color="#ffffff" style={{ opacity: 0.5 }} />
                <Text style={styles.videoPlayerText}>Video Player</Text>
                <Text style={styles.videoPlayerSubtext}>Video tutorials coming soon!</Text>
                <Text style={styles.videoPlayerHint}>This is a demo interface</Text>
              </View>
              
              <View style={styles.videoModalFooter}>
                <TouchableOpacity style={styles.videoPlayButton} activeOpacity={0.7}>
                  <Text style={styles.videoPlayButtonText}>Play</Text>
                </TouchableOpacity>
                <Text style={styles.videoDuration}>{selectedWorkout.duration} minutes</Text>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Workout List View
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          <View>
            <Text style={styles.title}>Workouts</Text>
            <Text style={styles.subtitle}>Video tutorials & guided routines</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Move' as never)}
            style={styles.addButton}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Search and Filter */}
        <View style={styles.card}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search workouts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((category) => (
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
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#16a34a" />
            <Text style={styles.loadingText}>Loading amazing workouts...</Text>
          </View>
        )}

        {/* Workout Grid */}
        {!loading && workouts.length > 0 && (
          <View style={styles.workoutsGrid}>
            {workouts.map((workout) => {
              const canAccess = canAccessWorkout(workout.id);
              return (
                <TouchableOpacity
                  key={workout.id}
                  style={styles.workoutCard}
                  onPress={() => handleSelectWorkout(workout)}
                  activeOpacity={0.7}
                >
                  <View style={styles.workoutCardImageContainer}>
                    <Image source={{ uri: workout.thumbnail }} style={styles.workoutCardImage} />
                    <View style={styles.workoutCardPlayOverlay}>
                      <View style={styles.workoutCardPlayButton}>
                        <Ionicons name="play" size={20} color="#16a34a" />
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.workoutCardSaveButton,
                        savedWorkouts.includes(workout.id) && styles.workoutCardSaveButtonActive
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleSaveWorkout(workout.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={savedWorkouts.includes(workout.id) ? 'bookmark' : 'bookmark-outline'}
                        size={16}
                        color={savedWorkouts.includes(workout.id) ? '#ffffff' : '#1e293b'}
                      />
                    </TouchableOpacity>
                    {workout.isPremium && (
                      <View style={styles.workoutCardPremiumBadge}>
                        <Text style={styles.workoutCardPremiumText}>Premium</Text>
                      </View>
                    )}
                    <View style={styles.workoutCardDifficultyBadge}>
                      <Text style={styles.workoutCardDifficultyText}>{workout.difficulty}</Text>
                    </View>
                    {!canAccess && !profile?.isPremium && (
                      <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={24} color="#ffffff" />
                      </View>
                    )}
                  </View>

                  <View style={styles.workoutCardContent}>
                    <Text style={styles.workoutCardTitle} numberOfLines={2}>
                      {workout.title}
                    </Text>
                    <Text style={styles.workoutCardDescription} numberOfLines={2}>
                      {workout.description}
                    </Text>

                    <View style={styles.workoutCardMeta}>
                      <View style={styles.workoutCardMetaItem}>
                        <Ionicons name="time-outline" size={14} color="#64748b" />
                        <Text style={styles.workoutCardMetaText}>{workout.duration}m</Text>
                      </View>
                      <View style={styles.workoutCardMetaItem}>
                        <Ionicons name="flash" size={14} color="#64748b" />
                        <Text style={styles.workoutCardMetaText}>{workout.calories} cal</Text>
                      </View>
                      <View style={styles.workoutCardMetaItem}>
                        <Ionicons name="star" size={14} color="#f59e0b" />
                        <Text style={styles.workoutCardMetaText}>{workout.rating}</Text>
                      </View>
                    </View>

                    <View style={styles.workoutCardFooter}>
                      <Text style={styles.workoutCardInstructor}>by {workout.instructor}</Text>
                      <View style={styles.workoutCardCategory}>
                        <Text style={styles.workoutCardCategoryText}>{workout.category}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {!loading && workouts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>No workouts found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or category filter</Text>
          </View>
        )}

        {/* Premium CTA for Free Users */}
        {!profile?.isPremium && accessedWorkouts.length >= 3 && (
          <View style={styles.premiumCard}>
            <Ionicons name="star" size={32} color="#f59e0b" />
            <Text style={styles.premiumCardTitle}>Unlock Unlimited Workouts</Text>
            <Text style={styles.premiumCardText}>
              You've used your 3 free workouts. Upgrade to Premium for unlimited access!
            </Text>
            <TouchableOpacity
              style={styles.premiumCardButton}
              onPress={() => navigation.navigate('Premium' as never)}
              activeOpacity={0.7}
            >
              <Text style={styles.premiumCardButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
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
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    fontSize: 16,
    color: '#1e293b',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonActive: {
    backgroundColor: '#dc2626',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 50,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  categoriesScroll: {
    marginHorizontal: -4,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#16a34a',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  workoutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  workoutCard: {
    width: (width - 64) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  workoutCardImageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  workoutCardImage: {
    width: '100%',
    height: '100%',
  },
  workoutCardPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  workoutCardPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutCardSaveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  workoutCardSaveButtonActive: {
    backgroundColor: '#dc2626',
  },
  workoutCardPremiumBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
  },
  workoutCardPremiumText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  workoutCardDifficultyBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#16a34a',
  },
  workoutCardDifficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutCardContent: {
    padding: 12,
  },
  workoutCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  workoutCardDescription: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  workoutCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  workoutCardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutCardMetaText: {
    fontSize: 12,
    color: '#64748b',
  },
  workoutCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutCardInstructor: {
    fontSize: 12,
    color: '#64748b',
  },
  workoutCardCategory: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
  },
  workoutCardCategoryText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#16a34a',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  workoutImageContainer: {
    width: '100%',
    height: 240,
    marginBottom: 16,
    position: 'relative',
  },
  workoutImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -32 }, { translateY: -32 }],
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  demoBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#2563eb',
  },
  demoBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  workoutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  workoutDescription: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  metaSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  workoutDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  difficultyContainer: {
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyBadgeGreen: {
    backgroundColor: '#dcfce7',
  },
  difficultyBadgeYellow: {
    backgroundColor: '#fef3c7',
  },
  difficultyBadgeRed: {
    backgroundColor: '#fee2e2',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    gap: 12,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  exerciseNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  exerciseStats: {
    alignItems: 'flex-end',
  },
  exerciseStatsText: {
    fontSize: 12,
    color: '#64748b',
  },
  startButton: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  videoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  videoModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 600,
  },
  videoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  videoModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  videoModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerPlaceholder: {
    aspectRatio: 16 / 9,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  videoPlayerText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ffffff',
    marginTop: 16,
  },
  videoPlayerSubtext: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.75,
    marginTop: 8,
  },
  videoPlayerHint: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.5,
    marginTop: 8,
  },
  videoModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoPlayButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  videoPlayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  videoDuration: {
    fontSize: 14,
    color: '#64748b',
  },
  premiumCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#fef08a',
  },
  premiumCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 8,
  },
  premiumCardText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  premiumCardButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  premiumCardButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
