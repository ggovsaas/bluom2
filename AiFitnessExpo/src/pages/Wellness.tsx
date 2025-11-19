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
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import MeditationHub from '../components/MeditationHub';
import GamesHub from '../components/GamesHub';
import { playSound } from '../utils/soundEffects';
import { SparkleEffect, BounceView, GlowView, RippleButton } from '../components/MicroInteractions';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;
const isMediumScreen = width >= 380 && width < 420;
const summaryCardWidth = (width - 48 - 24) / 3; // Full width - margins - gaps

interface Habit {
  id: string;
  name: string;
  icon: string;
  category: string;
  streak: number;
  completedToday: boolean;
  completedDates: string[];
  target?: number;
  unit?: string;
  isCustom: boolean;
}

export default function WellnessScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { profile, dailyData, updateDailyData, getCurrentDate } = useUser();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showGratitudeModal, setShowGratitudeModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showMeditationHub, setShowMeditationHub] = useState(false);
  const [showGamesHub, setShowGamesHub] = useState(false);
  
  const [sleepInput, setSleepInput] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState({
    name: '',
    icon: 'Target',
    category: 'Health'
  });
  
  const [gratitudeEntry, setGratitudeEntry] = useState('');
  const [gratitudeEntries, setGratitudeEntries] = useState<any[]>([]);
  const [journalContent, setJournalContent] = useState('');
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showAllHabits, setShowAllHabits] = useState(false);
  const [sparkleTrigger, setSparkleTrigger] = useState<string | null>(null);
  const [bounceTrigger, setBounceTrigger] = useState<string | null>(null);
  const [glowTrigger, setGlowTrigger] = useState(false);

  const currentDate = getCurrentDate();

  const moods = [
    { label: 'Excellent', value: 'excellent', color: '#16a34a', icon: 'happy' },
    { label: 'Good', value: 'good', color: '#3b82f6', icon: 'happy-outline' },
    { label: 'Okay', value: 'okay', color: '#eab308', icon: 'remove-circle-outline' },
    { label: 'Low', value: 'low', color: '#f97316', icon: 'sad-outline' },
    { label: 'Poor', value: 'poor', color: '#dc2626', icon: 'sad' },
  ];

  const habitCategories = ['Health', 'Fitness', 'Mindfulness', 'Productivity', 'Social', 'Learning'];

  const iconOptions = [
    { name: 'Target', iconName: 'locate' },
    { name: 'Droplets', iconName: 'water' },
    { name: 'Pill', iconName: 'medical' },
    { name: 'Book', iconName: 'book' },
    { name: 'Leaf', iconName: 'leaf' },
    { name: 'Zap', iconName: 'flash' },
    { name: 'Coffee', iconName: 'cafe' },
    { name: 'Apple', iconName: 'nutrition' },
    { name: 'Dumbbell', iconName: 'barbell' },
    { name: 'Phone', iconName: 'phone-portrait' },
    { name: 'Users', iconName: 'people' },
    { name: 'Music', iconName: 'musical-notes' },
    { name: 'Camera', iconName: 'camera' },
    { name: 'Heart', iconName: 'heart' },
    { name: 'Brain', iconName: 'brain' },
    { name: 'Sun', iconName: 'sunny' },
    { name: 'Moon', iconName: 'moon' }
  ];

  const defaultHabits: Habit[] = [
    {
      id: 'water',
      name: 'Drink 8 glasses of water',
      icon: 'Droplets',
      category: 'Health',
      streak: 7,
      completedToday: dailyData.water >= 64,
      completedDates: [],
      target: 8,
      unit: 'glasses',
      isCustom: false
    },
    {
      id: 'vitamins',
      name: 'Take daily vitamins',
      icon: 'Pill',
      category: 'Health',
      streak: 12,
      completedToday: false,
      completedDates: [],
      isCustom: false
    },
    {
      id: 'meditation',
      name: 'Meditate for 10 minutes',
      icon: 'Brain',
      category: 'Mindfulness',
      streak: 3,
      completedToday: false,
      completedDates: [],
      target: 10,
      unit: 'minutes',
      isCustom: false
    },
    {
      id: 'gratitude',
      name: 'Practice gratitude',
      icon: 'Heart',
      category: 'Mindfulness',
      streak: 5,
      completedToday: false,
      completedDates: [],
      isCustom: false
    },
    {
      id: 'nature',
      name: 'Spend time in nature',
      icon: 'Leaf',
      category: 'Health',
      streak: 2,
      completedToday: false,
      completedDates: [],
      target: 30,
      unit: 'minutes',
      isCustom: false
    },
    {
      id: 'reading',
      name: 'Read for 30 minutes',
      icon: 'Book',
      category: 'Learning',
      streak: 0,
      completedToday: false,
      completedDates: [],
      target: 30,
      unit: 'minutes',
      isCustom: false
    },
    {
      id: 'exercise',
      name: 'Exercise for 30 minutes',
      icon: 'Dumbbell',
      category: 'Fitness',
      streak: 0,
      completedToday: false,
      completedDates: [],
      target: 30,
      unit: 'minutes',
      isCustom: false
    },
    {
      id: 'sleep',
      name: 'Get 8 hours of sleep',
      icon: 'Moon',
      category: 'Health',
      streak: 0,
      completedToday: dailyData.sleepHours >= 8,
      completedDates: [],
      target: 8,
      unit: 'hours',
      isCustom: false
    },
    {
      id: 'social',
      name: 'Connect with friends/family',
      icon: 'Users',
      category: 'Social',
      streak: 0,
      completedToday: false,
      completedDates: [],
      isCustom: false
    },
    {
      id: 'screen-time',
      name: 'Limit screen time',
      icon: 'Phone',
      category: 'Health',
      streak: 0,
      completedToday: false,
      completedDates: [],
      target: 2,
      unit: 'hours max',
      isCustom: false
    }
  ];

  const sleepQuality = [
    { night: 'Mon', quality: 85, hours: 7.5 },
    { night: 'Tue', quality: 92, hours: 8.2 },
    { night: 'Wed', quality: 78, hours: 6.8 },
    { night: 'Thu', quality: 88, hours: 7.8 },
    { night: 'Fri', quality: 90, hours: 8.0 },
    { night: 'Sat', quality: 95, hours: 8.5 },
    { night: 'Sun', quality: 87, hours: 7.9 },
  ];

  // Get userId from profile or default to 1
  const getUserId = () => {
    return profile?.id || 1;
  };

  // Load habits from AsyncStorage
  useEffect(() => {
    const loadHabits = async () => {
      try {
        const savedHabits = await AsyncStorage.getItem('aifit_habits');
        if (savedHabits) {
          setHabits(JSON.parse(savedHabits));
        } else {
          setHabits(defaultHabits);
        }
      } catch (error) {
        console.error('Error loading habits:', error);
        setHabits(defaultHabits);
      }
    };
    loadHabits();
  }, []);

  // Load AIMind data
  useEffect(() => {
    const userId = getUserId();
    fetchGratitudeEntries(userId);
    fetchJournalEntries(userId);
    fetchInsights(userId);
  }, [profile]);

  // Fetch gratitude entries
  const fetchGratitudeEntries = async (userId: number) => {
    try {
      const { data, error } = await supabase
        .from('gratitude_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setGratitudeEntries(data || []);
    } catch (error) {
      console.error('Error fetching gratitude entries:', error);
    }
  };

  // Fetch journal entries
  const fetchJournalEntries = async (userId: number) => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setJournalEntries(data || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    }
  };

  // Fetch insights
  const fetchInsights = async (userId: number) => {
    setLoadingInsights(true);
    try {
      // Insights can be computed from journal/gratitude entries or stored separately
      const { data, error } = await supabase
        .from('wellness_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      setInsights(data);
    } catch (error: any) {
      console.log('Insights not available yet');
      setInsights(null);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Save gratitude entry
  const saveGratitude = async () => {
    if (!gratitudeEntry.trim()) return;
    
    const userId = getUserId();
    try {
      const { error } = await supabase
        .from('gratitude_entries')
        .insert({
          user_id: userId,
          entry: gratitudeEntry,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      setGratitudeEntry('');
      setShowGratitudeModal(false);
      fetchGratitudeEntries(userId);
      Alert.alert('Success', 'Gratitude entry saved!');
    } catch (error) {
      console.error('Error saving gratitude:', error);
      Alert.alert('Error', 'Failed to save gratitude entry');
    }
  };

  // Save journal entry
  const saveJournal = async () => {
    if (!journalContent.trim()) return;
    
    const userId = getUserId();
    try {
      const { error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: userId,
          content: journalContent,
          mood_tag: dailyData.mood || null,
          created_at: new Date().toISOString()
        });
      setJournalContent('');
      setShowJournalModal(false);
      fetchJournalEntries(userId);
      fetchInsights(userId);
      Alert.alert('Success', 'Journal entry saved!');
    } catch (error) {
      console.error('Error saving journal:', error);
      Alert.alert('Error', 'Failed to save journal entry');
    }
  };

  // Open meditation hub
  const startMeditation = () => {
    setShowMeditationHub(true);
  };

  // Open games hub
  const startGame = () => {
    setShowGamesHub(true);
  };

  // Save habits to AsyncStorage
  const saveHabits = async (updatedHabits: Habit[]) => {
    setHabits(updatedHabits);
    try {
      await AsyncStorage.setItem('aifit_habits', JSON.stringify(updatedHabits));
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  };

  const addSleep = async () => {
    if (sleepInput) {
      const hours = parseFloat(sleepInput);
      await updateDailyData({ sleepHours: hours });
      
      // Update sleep habit if it exists
      const updatedHabits = habits.map(habit => {
        if (habit.id === 'sleep') {
          return {
            ...habit,
            completedToday: hours >= (habit.target || 8)
          };
        }
        return habit;
      });
      await saveHabits(updatedHabits);
      
      setSleepInput('');
      setShowSleepModal(false);
      setGlowTrigger(true);
      setTimeout(() => setGlowTrigger(false), 2000);
      playSound('chime');
      Alert.alert('Success', `${hours} hours of sleep logged!`);
    }
  };

  const addMood = (mood: string) => {
    playSound('tick');
    setBounceTrigger(mood);
    setTimeout(() => setBounceTrigger(null), 500);
    updateDailyData({ mood });
    setShowMoodModal(false);
    playSound('pop');
    Alert.alert('Success', 'Mood logged successfully!');
  };

  const toggleHabit = async (habitId: string) => {
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const wasCompleted = habit.completedToday;
        const newCompletedToday = !wasCompleted;
        
        let newStreak = habit.streak;
        let newCompletedDates = [...habit.completedDates];
        
        if (newCompletedToday) {
          if (!newCompletedDates.includes(currentDate)) {
            newCompletedDates.push(currentDate);
            newStreak = habit.streak + 1;
            // Trigger sparkle effect
            setSparkleTrigger(habitId);
            setTimeout(() => setSparkleTrigger(null), 1000);
            playSound('chime');
          }
        } else {
          newCompletedDates = newCompletedDates.filter(date => date !== currentDate);
          newStreak = Math.max(0, habit.streak - 1);
        }
        
        return {
          ...habit,
          completedToday: newCompletedToday,
          streak: newStreak,
          completedDates: newCompletedDates
        };
      }
      return habit;
    });
    
    await saveHabits(updatedHabits);
  };

  const addCustomHabit = async () => {
    if (!newHabit.name.trim()) return;
    
    const customHabit: Habit = {
      id: `custom-${Date.now()}`,
      name: newHabit.name,
      icon: newHabit.icon,
      category: newHabit.category,
      streak: 0,
      completedToday: false,
      completedDates: [],
      isCustom: true
    };
    
    await saveHabits([...habits, customHabit]);
    setNewHabit({ name: '', icon: 'Target', category: 'Health' });
    setShowHabitModal(false);
    Alert.alert('Success', 'Custom habit added!');
  };

  const deleteHabit = async (habitId: string) => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const updatedHabits = habits.filter(habit => habit.id !== habitId);
            await saveHabits(updatedHabits);
          }
        }
      ]
    );
  };

  const getIconName = (iconName: string) => {
    const iconOption = iconOptions.find(option => option.name === iconName);
    return iconOption ? iconOption.iconName : 'locate';
  };

  const getHabitsByCategory = (category: string) => {
    return habits.filter(habit => habit.category === category);
  };

  const completedHabitsToday = habits.filter(habit => habit.completedToday).length;
  const totalHabits = habits.length;
  const completionPercentage = totalHabits > 0 ? Math.round((completedHabitsToday / totalHabits) * 100) : 0;

  const averageSleep = sleepQuality.reduce((sum, night) => sum + night.hours, 0) / sleepQuality.length;

  const getMoodIcon = (mood: string) => {
    const moodData = moods.find(m => m.value === mood);
    return moodData ? moodData.icon : 'remove-circle-outline';
  };

  const getMoodColor = (mood: string) => {
    const moodData = moods.find(m => m.value === mood);
    return moodData ? moodData.color : '#eab308';
  };

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
              <Text style={styles.title}>Wellness</Text>
              <Text style={styles.subtitle}>Track your sleep, mood & daily habits</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={[styles.headerButton, styles.plusButton]}
                onPress={() => setShowDropdown(!showDropdown)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Plus Menu */}
        {showDropdown && (
          <View style={styles.plusMenu}>
            <TouchableOpacity
              style={styles.plusMenuItem}
              onPress={() => {
                setShowSleepModal(true);
                setShowDropdown(false);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="moon" size={20} color="#8b5cf6" />
              <Text style={styles.plusMenuText}>Log Sleep</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.plusMenuItem}
              onPress={() => {
                setShowMoodModal(true);
                setShowDropdown(false);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="happy-outline" size={20} color="#eab308" />
              <Text style={styles.plusMenuText}>Log Mood</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.plusMenuItem}
              onPress={() => {
                setShowHabitModal(true);
                setShowDropdown(false);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={20} color="#16a34a" />
              <Text style={styles.plusMenuText}>Add Habit</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Today's Summary */}
        <View style={styles.summaryGrid}>
          <GlowView visible={glowTrigger} color="#8b5cf6">
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIconContainer, { backgroundColor: '#ede9fe' }]}>
                <Ionicons name="moon" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.summaryLabel} numberOfLines={1} adjustsFontSizeToFit>Sleep</Text>
              <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>{dailyData.sleepHours || 0}h</Text>
              <Text style={styles.summarySubtext} numberOfLines={1} adjustsFontSizeToFit>Last night</Text>
            </View>
          </GlowView>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name={getMoodIcon(dailyData.mood)} size={24} color={getMoodColor(dailyData.mood)} />
            </View>
            <Text style={styles.summaryLabel} numberOfLines={1} adjustsFontSizeToFit>Mood</Text>
            <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
              {dailyData.mood ? dailyData.mood.charAt(0).toUpperCase() + dailyData.mood.slice(1) : 'Not set'}
            </Text>
            <Text style={styles.summarySubtext} numberOfLines={1} adjustsFontSizeToFit>Today</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="locate" size={24} color="#16a34a" />
            </View>
            <Text style={styles.summaryLabel} numberOfLines={1} adjustsFontSizeToFit>Habits</Text>
            <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>{completedHabitsToday}/{totalHabits}</Text>
            <Text style={styles.summarySubtext} numberOfLines={1} adjustsFontSizeToFit>{completionPercentage}% complete</Text>
          </View>
        </View>

        {/* Enhanced Daily Habits Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Daily Habits</Text>
              <Text style={styles.habitsSubtitle}>{completedHabitsToday} of {totalHabits} completed today</Text>
            </View>
            <TouchableOpacity
              style={styles.addHabitButton}
              onPress={() => setShowHabitModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarLabel}>
              <Text style={styles.progressBarText}>Today's Progress</Text>
              <Text style={styles.progressBarText}>{completionPercentage}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${completionPercentage}%` }
                ]}
              />
            </View>
          </View>

          {/* Habits by Category */}
          <View style={styles.habitsList}>
            {habitCategories.map((category, categoryIndex) => {
              const categoryHabits = getHabitsByCategory(category);
              if (categoryHabits.length === 0) return null;

              // Calculate total habits shown so far
              let totalShown = 0;
              for (let i = 0; i < categoryIndex; i++) {
                totalShown += getHabitsByCategory(habitCategories[i]).length;
              }

              // Show first 3 habits total across all categories, all if showAllHabits is true
              let habitsToShow = categoryHabits;
              if (!showAllHabits && totalShown < 3) {
                const remaining = 3 - totalShown;
                habitsToShow = categoryHabits.slice(0, remaining);
              } else if (!showAllHabits && totalShown >= 3) {
                return null; // Don't show this category if we've already shown 3 habits
              }

              const hasMoreHabits = !showAllHabits && totalShown + categoryHabits.length > 3;

              return (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>{category.toUpperCase()}</Text>
                  {habitsToShow.map((habit) => {
                    const iconName = getIconName(habit.icon);
                    return (
                      <View key={habit.id} style={styles.habitItem}>
                        <View style={styles.habitLeft}>
                          <View style={{ position: 'relative' }}>
                            <TouchableOpacity
                              style={[
                                styles.habitCheckbox,
                                habit.completedToday && styles.habitCheckboxCompleted
                              ]}
                              onPress={() => toggleHabit(habit.id)}
                              activeOpacity={0.7}
                            >
                              {habit.completedToday && (
                                <Ionicons name="checkmark" size={16} color="#ffffff" />
                              )}
                            </TouchableOpacity>
                            <SparkleEffect visible={sparkleTrigger === habit.id} />
                          </View>
                          <View style={[styles.habitIconContainer, { backgroundColor: '#dbeafe' }]}>
                            <Ionicons name={iconName as any} size={16} color="#2563eb" />
                          </View>
                          <View style={styles.habitInfo}>
                            <Text style={styles.habitName}>{habit.name}</Text>
                            <View style={styles.habitMeta}>
                              <Text style={styles.habitStreak}>{habit.streak} day streak</Text>
                              {habit.target && (
                                <Text style={styles.habitTarget}>• {habit.target} {habit.unit}</Text>
                              )}
                            </View>
                          </View>
                        </View>
                        <View style={styles.habitRight}>
                          <View style={styles.streakDots}>
                            {[...Array(Math.min(habit.streak, 7))].map((_, i) => (
                              <View key={i} style={styles.streakDot} />
                            ))}
                          </View>
                          {habit.isCustom && (
                            <TouchableOpacity
                              style={styles.deleteHabitButton}
                              onPress={() => deleteHabit(habit.id)}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="trash" size={16} color="#dc2626" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}
            {!showAllHabits && totalHabits > 3 && (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={() => setShowAllHabits(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.showMoreText}>Show {totalHabits - 3} more habits</Text>
                <Ionicons name="chevron-down" size={16} color="#2563eb" />
              </TouchableOpacity>
            )}
            {showAllHabits && totalHabits > 3 && (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={() => setShowAllHabits(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.showMoreText}>Show less</Text>
                <Ionicons name="chevron-up" size={16} color="#2563eb" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sleep Analysis */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Sleep Analysis</Text>
            <Ionicons name="moon" size={24} color="#8b5cf6" />
          </View>

          <View style={styles.sleepStatsGrid}>
            <View style={styles.sleepStatItem}>
              <Text style={styles.sleepStatValue}>{averageSleep.toFixed(1)}h</Text>
              <Text style={styles.sleepStatLabel}>Avg Sleep</Text>
            </View>
            <View style={styles.sleepStatItem}>
              <Text style={styles.sleepStatValue}>87%</Text>
              <Text style={styles.sleepStatLabel}>Quality</Text>
            </View>
            <View style={styles.sleepStatItem}>
              <Text style={styles.sleepStatValue}>6/7</Text>
              <Text style={styles.sleepStatLabel}>Good Nights</Text>
            </View>
          </View>

          <View style={styles.sleepWeekList}>
            <Text style={styles.sleepWeekTitle}>This Week</Text>
            {sleepQuality.map((night) => (
              <View key={night.night} style={styles.sleepWeekItem}>
                <Text style={styles.sleepWeekDay}>{night.night}</Text>
                <View style={styles.sleepWeekBarContainer}>
                  <View style={styles.sleepWeekBar}>
                    <View
                      style={[
                        styles.sleepWeekBarFill,
                        { width: `${night.quality}%` }
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.sleepWeekHours}>{night.hours}h</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Mood Tracker */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Mood Tracker</Text>
            <Ionicons name="heart" size={24} color="#ec4899" />
          </View>

          <View style={styles.moodGrid}>
            {moods.map((mood) => (
              <BounceView key={mood.value} trigger={bounceTrigger === mood.value}>
                <TouchableOpacity
                  style={[
                    styles.moodButton,
                    dailyData.mood === mood.value && styles.moodButtonSelected
                  ]}
                  onPress={() => addMood(mood.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={mood.icon as any} size={isSmallScreen ? 28 : 32} color={mood.color} />
                  <Text style={styles.moodLabel} numberOfLines={1} adjustsFontSizeToFit>{mood.label}</Text>
                </TouchableOpacity>
              </BounceView>
            ))}
          </View>

          <View style={styles.moodTrendContainer}>
            <Text style={styles.moodTrendTitle}>Weekly Mood Trend</Text>
            <View style={styles.moodTrendGrid}>
              {['😊', '😄', '😐', '😊', '😔', '😄', '😊'].map((emoji, index) => (
                <View key={index} style={styles.moodTrendItem}>
                  <Text style={styles.moodTrendEmoji}>{emoji}</Text>
                  <Text style={styles.moodTrendDay}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* AIMind Hub */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>🧠 AIMind Hub</Text>
              <Text style={styles.aimindSubtitle}>Meditation, gratitude, journaling & insights</Text>
            </View>
            <Ionicons name="brain" size={24} color="#6366f1" />
          </View>

          {/* AIMind Cards Grid */}
          <View style={styles.aimindGrid}>
            <TouchableOpacity
              style={[styles.aimindCard, { backgroundColor: '#6366f1' }]}
              onPress={startMeditation}
              activeOpacity={0.7}
            >
              <Ionicons name="leaf" size={isSmallScreen ? 20 : 24} color="#ffffff" />
              <Text style={styles.aimindCardText} numberOfLines={1} adjustsFontSizeToFit>Meditate</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.aimindCard, { backgroundColor: '#f43f5e' }]}
              onPress={() => setShowGratitudeModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="heart" size={isSmallScreen ? 20 : 24} color="#ffffff" />
              <Text style={styles.aimindCardText} numberOfLines={1} adjustsFontSizeToFit>Gratitude</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.aimindCard, { backgroundColor: '#f59e0b' }]}
              onPress={() => setShowJournalModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="create" size={isSmallScreen ? 20 : 24} color="#ffffff" />
              <Text style={styles.aimindCardText} numberOfLines={1} adjustsFontSizeToFit>Journal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.aimindCard, { backgroundColor: '#14b8a6' }]}
              onPress={() => setShowInsightsModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="stats-chart" size={isSmallScreen ? 20 : 24} color="#ffffff" />
              <Text style={styles.aimindCardText} numberOfLines={1} adjustsFontSizeToFit>Insights</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.aimindCard, { backgroundColor: '#a855f7' }]}
              onPress={startGame}
              activeOpacity={0.7}
            >
              <Ionicons name="game-controller" size={isSmallScreen ? 20 : 24} color="#ffffff" />
              <Text style={styles.aimindCardText} numberOfLines={1} adjustsFontSizeToFit>Games</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={styles.aimindStatsGrid}>
            <View style={[styles.aimindStatCard, { backgroundColor: '#ede9fe' }]}>
              <Text style={[styles.aimindStatValue, { color: '#6366f1' }]}>{gratitudeEntries.length}</Text>
              <Text style={styles.aimindStatLabel}>Gratitude Entries</Text>
            </View>
            <View style={[styles.aimindStatCard, { backgroundColor: '#fef3c7' }]}>
              <Text style={[styles.aimindStatValue, { color: '#eab308' }]}>{journalEntries.length}</Text>
              <Text style={styles.aimindStatLabel}>Journal Entries</Text>
            </View>
            <View style={[styles.aimindStatCard, { backgroundColor: '#ccfbf1' }]}>
              <Text style={[styles.aimindStatValue, { color: '#14b8a6' }]}>
                {insights ? `${insights.calmnessScore}%` : '--'}
              </Text>
              <Text style={styles.aimindStatLabel}>Calmness Score</Text>
            </View>
          </View>
        </View>

        {/* Mindfulness Session */}
        <View style={styles.mindfulnessCard}>
          <View style={styles.mindfulnessContent}>
            <View style={styles.mindfulnessTextContainer}>
              <Text style={styles.mindfulnessTitle}>aiMind Session</Text>
              <Text style={styles.mindfulnessSubtitle} numberOfLines={3}>
                Guided meditation{'\n'}for better sleep
              </Text>
              <Text style={styles.mindfulnessTonight}>Tonight's Session</Text>
              <Text style={styles.mindfulnessSessionName} numberOfLines={1} adjustsFontSizeToFit>Deep Sleep Journey</Text>
            </View>
            <TouchableOpacity
              style={styles.mindfulnessButton}
              onPress={startMeditation}
              activeOpacity={0.7}
            >
              <Text style={styles.mindfulnessButtonText} numberOfLines={1} adjustsFontSizeToFit>Start 10 min</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Premium Insights */}
        {!profile?.isPremium && (
          <TouchableOpacity
            style={styles.premiumCard}
            onPress={() => navigation.navigate('Premium' as never)}
            activeOpacity={0.7}
          >
            <View style={styles.premiumContent}>
              <View style={styles.premiumIconContainer}>
                <Ionicons name="trending-up" size={32} color="#eab308" />
              </View>
              <Text style={styles.premiumTitle}>Unlock Wellness Insights</Text>
              <Text style={styles.premiumText}>
                Get personalized sleep recommendations, mood analysis, and wellness coaching
              </Text>
              <TouchableOpacity style={styles.premiumButton} activeOpacity={0.7}>
                <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Bottom padding for tab bar */}
        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Sleep Modal */}
      <Modal visible={showSleepModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSleepModal(false)}>
        <SafeAreaView style={styles.modalContent} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Sleep</Text>
            <TouchableOpacity onPress={() => setShowSleepModal(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalScroll}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>How many hours did you sleep?</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 7.5"
                value={sleepInput}
                onChangeText={setSleepInput}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowSleepModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#8b5cf6' }, !sleepInput && styles.modalButtonDisabled]}
                onPress={addSleep}
                disabled={!sleepInput}
              >
                <Text style={styles.modalButtonText}>Log Sleep</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Mood Modal */}
      <Modal visible={showMoodModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowMoodModal(false)}>
        <SafeAreaView style={styles.modalContent} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>How are you feeling today?</Text>
            <TouchableOpacity onPress={() => setShowMoodModal(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalScroll}>
            <View style={styles.moodModalGrid}>
              {moods.map((mood) => (
                <TouchableOpacity
                  key={mood.value}
                  style={[
                    styles.moodModalButton,
                    dailyData.mood === mood.value && styles.moodModalButtonSelected
                  ]}
                  onPress={() => addMood(mood.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={mood.icon as any} size={40} color={mood.color} />
                  <Text style={styles.moodModalLabel}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => setShowMoodModal(false)}
            >
              <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Add Custom Habit Modal */}
      <Modal visible={showHabitModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowHabitModal(false)}>
        <SafeAreaView style={styles.modalContent} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Custom Habit</Text>
            <TouchableOpacity onPress={() => setShowHabitModal(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Habit Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Drink green tea"
                value={newHabit.name}
                onChangeText={(text) => setNewHabit({ ...newHabit, name: text })}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {habitCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      newHabit.category === category && styles.categoryChipActive
                    ]}
                    onPress={() => setNewHabit({ ...newHabit, category })}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      newHabit.category === category && styles.categoryChipTextActive
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Icon</Text>
              <View style={styles.iconGrid}>
                {iconOptions.map((option) => {
                  const isSelected = newHabit.icon === option.name;
                  return (
                    <TouchableOpacity
                      key={option.name}
                      style={[
                        styles.iconButton,
                        isSelected && styles.iconButtonSelected
                      ]}
                      onPress={() => setNewHabit({ ...newHabit, icon: option.name })}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={option.iconName as any}
                        size={20}
                        color={isSelected ? '#ffffff' : '#64748b'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowHabitModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, !newHabit.name.trim() && styles.modalButtonDisabled]}
                onPress={addCustomHabit}
                disabled={!newHabit.name.trim()}
              >
                <Text style={styles.modalButtonText}>Add Habit</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Gratitude Modal */}
      <Modal visible={showGratitudeModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowGratitudeModal(false)}>
        <SafeAreaView style={styles.modalContent} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>💗 Gratitude</Text>
            <TouchableOpacity onPress={() => setShowGratitudeModal(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>What are you grateful for today?</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="I'm grateful for..."
                value={gratitudeEntry}
                onChangeText={setGratitudeEntry}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.recentEntriesSection}>
              <Text style={styles.recentEntriesTitle}>Recent Entries</Text>
              {gratitudeEntries.length === 0 ? (
                <Text style={styles.noEntriesText}>No entries yet</Text>
              ) : (
                <View style={styles.entriesList}>
                  {gratitudeEntries.map((entry) => (
                    <View key={entry.id} style={styles.entryCard}>
                      <Text style={styles.entryText}>{entry.entry}</Text>
                      <Text style={styles.entryDate}>
                        {new Date(entry.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowGratitudeModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#f43f5e' }, !gratitudeEntry.trim() && styles.modalButtonDisabled]}
                onPress={saveGratitude}
                disabled={!gratitudeEntry.trim()}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Journal Modal */}
      <Modal visible={showJournalModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowJournalModal(false)}>
        <SafeAreaView style={styles.modalContent} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>✍️ Journal</Text>
            <TouchableOpacity onPress={() => setShowJournalModal(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>How are you feeling today?</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Write your thoughts..."
                value={journalContent}
                onChangeText={setJournalContent}
                multiline
                numberOfLines={6}
              />
            </View>

            <View style={styles.recentEntriesSection}>
              <Text style={styles.recentEntriesTitle}>Recent Entries</Text>
              {journalEntries.length === 0 ? (
                <Text style={styles.noEntriesText}>No entries yet</Text>
              ) : (
                <View style={styles.entriesList}>
                  {journalEntries.map((entry) => (
                    <View key={entry.id} style={styles.entryCard}>
                      <Text style={styles.entryText}>{entry.content}</Text>
                      <Text style={styles.entryDate}>
                        {new Date(entry.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowJournalModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#f59e0b' }, !journalContent.trim() && styles.modalButtonDisabled]}
                onPress={saveJournal}
                disabled={!journalContent.trim()}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Insights Modal */}
      <Modal visible={showInsightsModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowInsightsModal(false)}>
        <SafeAreaView style={styles.modalContent} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📊 Wellness Insights</Text>
            <TouchableOpacity onPress={() => setShowInsightsModal(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {loadingInsights ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#14b8a6" />
                <Text style={styles.loadingText}>Loading insights...</Text>
              </View>
            ) : insights ? (
              <View style={styles.insightsContent}>
                <View style={styles.insightCardLarge}>
                  <Text style={styles.insightValueLarge}>{insights.calmnessScore || '--'}%</Text>
                  <Text style={styles.insightLabelLarge}>Calmness Score</Text>
                </View>

                <View style={styles.insightStatsGrid}>
                  <View style={styles.insightStatCard}>
                    <Text style={styles.insightStatValue}>{insights.avgSleep || 0}h</Text>
                    <Text style={styles.insightStatLabel}>Avg Sleep</Text>
                  </View>
                  <View style={styles.insightStatCard}>
                    <Text style={styles.insightStatValue}>{insights.moodStability || 0}%</Text>
                    <Text style={styles.insightStatLabel}>Mood Stability</Text>
                  </View>
                </View>

                <View style={styles.insightSection}>
                  <Text style={styles.insightSectionTitle}>Activity Summary</Text>
                  <View style={styles.insightActivityList}>
                    <View style={styles.insightActivityItem}>
                      <Text style={styles.insightActivityLabel}>Meditations</Text>
                      <Text style={styles.insightActivityValue}>{insights.meditationCount || 0}</Text>
                    </View>
                    <View style={styles.insightActivityItem}>
                      <Text style={styles.insightActivityLabel}>Gratitude Entries</Text>
                      <Text style={styles.insightActivityValue}>{insights.gratitudeCount || 0}</Text>
                    </View>
                    <View style={styles.insightActivityItem}>
                      <Text style={styles.insightActivityLabel}>Journal Entries</Text>
                      <Text style={styles.insightActivityValue}>{insights.journalCount || 0}</Text>
                    </View>
                  </View>
                </View>

                {insights.recommendations && insights.recommendations.length > 0 && (
                  <View style={styles.insightSection}>
                    <Text style={styles.insightSectionTitle}>Recommendations</Text>
                    {insights.recommendations.map((rec: any, index: number) => (
                      <View key={index} style={styles.recommendationCard}>
                        <Text style={styles.recommendationMessage}>{rec.message}</Text>
                        <Text style={styles.recommendationAction}>{rec.action}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noInsightsContainer}>
                <Text style={styles.noInsightsText}>No insights available yet</Text>
                <Text style={styles.noInsightsSubtext}>Start tracking your wellness to see insights</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#14b8a6', marginTop: 24 }]}
              onPress={() => {
                fetchInsights(getUserId());
              }}
            >
              <Text style={styles.modalButtonText}>Refresh Insights</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Meditation Hub */}
      {showMeditationHub && (
        <MeditationHub
          userId={getUserId()}
          onClose={() => setShowMeditationHub(false)}
        />
      )}

      {/* Games Hub */}
      {showGamesHub && (
        <GamesHub
          userId={getUserId()}
          onClose={() => setShowGamesHub(false)}
        />
      )}
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  headerButton: {
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
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: 0, // Allow flex shrinking
    backgroundColor: '#ffffff',
    padding: isSmallScreen ? 12 : 16,
    borderRadius: 16,
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
  habitsSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  addHabitButton: {
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
  progressBarContainer: {
    marginBottom: 24,
  },
  progressBarLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBarText: {
    fontSize: 14,
    color: '#64748b',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 6,
  },
  habitsList: {
    gap: 24,
  },
  categorySection: {
    gap: 12,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  showMoreText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  habitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  habitCheckbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitCheckboxCompleted: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  habitIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  habitStreak: {
    fontSize: 12,
    color: '#64748b',
  },
  habitTarget: {
    fontSize: 12,
    color: '#64748b',
  },
  habitRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakDots: {
    flexDirection: 'row',
    gap: 4,
  },
  streakDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  deleteHabitButton: {
    padding: 4,
  },
  sleepStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sleepStatItem: {
    alignItems: 'center',
  },
  sleepStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  sleepStatLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  sleepWeekList: {
    gap: 12,
  },
  sleepWeekTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  sleepWeekItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sleepWeekDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    width: 32,
  },
  sleepWeekBarContainer: {
    flex: 1,
  },
  sleepWeekBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sleepWeekBarFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  sleepWeekHours: {
    fontSize: 14,
    color: '#64748b',
    width: 40,
    textAlign: 'right',
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: isSmallScreen ? 4 : 8,
  },
  moodButton: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    padding: isSmallScreen ? 8 : 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  moodButtonSelected: {
    backgroundColor: '#f1f5f9',
  },
  moodLabel: {
    fontSize: isSmallScreen ? 10 : 12,
    color: '#64748b',
    marginTop: isSmallScreen ? 4 : 8,
    minHeight: 14,
  },
  moodTrendContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  moodTrendTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  moodTrendGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodTrendItem: {
    alignItems: 'center',
  },
  moodTrendEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  moodTrendDay: {
    fontSize: 12,
    color: '#94a3b8',
  },
  aimindSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  aimindGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: isSmallScreen ? 8 : 12,
  },
  aimindCard: {
    width: (width - 48 - (isSmallScreen ? 32 : 48)) / 5,
    minWidth: 0,
    padding: isSmallScreen ? 10 : 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aimindCardText: {
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: isSmallScreen ? 4 : 8,
    minHeight: 14,
  },
  aimindStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  aimindStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  aimindStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aimindStatLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  mindfulnessCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mindfulnessContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  mindfulnessTextContainer: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  mindfulnessTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  mindfulnessSubtitle: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: isSmallScreen ? 8 : 12,
    lineHeight: isSmallScreen ? 16 : 20,
  },
  mindfulnessTonight: {
    fontSize: isSmallScreen ? 10 : 12,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 4,
  },
  mindfulnessSessionName: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: '#ffffff',
    minHeight: isSmallScreen ? 18 : 20,
  },
  mindfulnessButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingVertical: isSmallScreen ? 10 : 12,
    borderRadius: 20,
    flexShrink: 0,
  },
  mindfulnessButtonText: {
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '600',
    color: '#ffffff',
    minHeight: 16,
  },
  premiumCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#fef3c7',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  premiumContent: {
    alignItems: 'center',
  },
  premiumIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  premiumText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  premiumButton: {
    backgroundColor: '#eab308',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  premiumButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
  inputGroup: {
    marginBottom: 20,
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
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#16a34a',
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
  moodModalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  moodModalButton: {
    width: (width - 80) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  moodModalButtonSelected: {
    backgroundColor: '#f1f5f9',
  },
  moodModalLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
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
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonSelected: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  recentEntriesSection: {
    marginBottom: 24,
  },
  recentEntriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  noEntriesText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 16,
  },
  entriesList: {
    gap: 8,
    maxHeight: 200,
  },
  entryCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
  },
  entryText: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 12,
    color: '#94a3b8',
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
  insightsContent: {
    gap: 24,
  },
  insightCardLarge: {
    backgroundColor: '#14b8a6',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  insightValueLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  insightLabelLarge: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  insightStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  insightStatCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  insightStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  insightStatLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  insightSection: {
    gap: 12,
  },
  insightSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  insightActivityList: {
    gap: 8,
  },
  insightActivityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  insightActivityLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  insightActivityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  recommendationCard: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  recommendationMessage: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 4,
  },
  recommendationAction: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  noInsightsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noInsightsText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  noInsightsSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
