import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// API configuration for React Native
const API_BASE_URL = 'http://localhost:3001'; // You'll need to update this for production
const API_ENDPOINTS = {
  USER_LOG_FOOD: `${API_BASE_URL}/api/user/log-food`,
  USER_LOG_EXERCISE: `${API_BASE_URL}/api/user/log-exercise`,
  USER_LOG_WEIGHT: `${API_BASE_URL}/api/user/log-weight`,
  USER_LOG_SLEEP: `${API_BASE_URL}/api/user/log-sleep`,
  USER_LOG_MOOD: `${API_BASE_URL}/api/user/log-mood`,
};

interface UserProfile {
  name: string;
  gender: string;
  age: number;
  weight: number;
  height: number;
  weightUnit: string;
  heightUnit: string;
  weightInKg: number;
  heightInCm: number;
  targetWeight?: number;
  goal: string;
  activityLevel: string;
  fitnessGoal: string;
  workoutPreference: string;
  timeAvailable: string;
  nutritionPreference: string;
  dietaryRestrictions: string[];
  sleepHours: number;
  stressLevel: string;
  mealFrequency: string;
  motivation: string[];
  challenges: string[];
  experience: string;
  isPremium: boolean;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  bmr: number;
  tdee: number;
  trialStartDate?: string; // ISO date string when trial started
  trialEndDate?: string; // ISO date string when trial ends (3 days after start)
}

interface FoodEntry {
  id: string;
  foodId: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  meal: string;
  date: string;
  nutrition?: any; // Allow nutrition property for logged recipes/foods
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

interface UserContextType {
  profile: UserProfile | null;
  updateProfile: (profile: Partial<UserProfile>) => void;
  dailyData: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
    steps: number;
    exerciseMinutes: number;
    caloriesBurned: number;
    sleepHours: number;
    mood: string;
    weight: number;
  };
  updateDailyData: (data: any) => void;
  foodEntries: FoodEntry[];
  addFoodEntry: (entry: FoodEntry) => void;
  removeFoodEntry: (entryId: string) => void;
  getFoodEntriesForDate: (date: string) => FoodEntry[];
  getFoodEntriesForMeal: (meal: string, date?: string) => FoodEntry[];
  exerciseEntries: ExerciseEntry[];
  addExerciseEntry: (entry: ExerciseEntry) => void;
  getExerciseEntriesForDate: (date: string) => ExerciseEntry[];
  getUsedDays: () => string[];
  getCurrentDate: () => string;
  getTodayTotals: () => { calories: number; protein: number; carbs: number; fat: number };
  hasActiveTrial: () => boolean;
  isPremiumOrTrial: () => boolean;
  startTrial: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyData, setDailyData] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    water: 0,
    steps: 0,
    exerciseMinutes: 0,
    caloriesBurned: 0,
    sleepHours: 0,
    mood: '',
    weight: 0,
  });
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [exerciseEntries, setExerciseEntries] = useState<ExerciseEntry[]>([]);

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getTodayTotals = () => {
    const currentDate = getCurrentDate();
    const todayEntries = foodEntries.filter(entry => entry.date === currentDate);
    
    return todayEntries.reduce((total, entry) => ({
      calories: total.calories + (entry.calories * entry.quantity),
      protein: total.protein + (entry.protein * entry.quantity),
      carbs: total.carbs + (entry.carbs * entry.quantity),
      fat: total.fat + (entry.fat * entry.quantity)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('aifit_profile');
      const savedDailyData = await AsyncStorage.getItem('aifit_daily_data');
      const savedFoodEntries = await AsyncStorage.getItem('aifit_food_entries');
      const savedExerciseEntries = await AsyncStorage.getItem('aifit_exercise_entries');
      
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile(parsedProfile);
        
        // Check if trial has expired
        if (parsedProfile.trialEndDate && !parsedProfile.isPremium) {
          const trialEnd = new Date(parsedProfile.trialEndDate);
          const now = new Date();
          if (now > trialEnd) {
            // Trial expired, ensure isPremium is false
            await updateProfile({ isPremium: false });
          }
        }
      }
      
      if (savedFoodEntries) {
        setFoodEntries(JSON.parse(savedFoodEntries));
      }

      if (savedExerciseEntries) {
        setExerciseEntries(JSON.parse(savedExerciseEntries));
      }

      // Check if it's a new day and reset daily data while preserving historical entries
      const lastActiveDate = await AsyncStorage.getItem('aifit_last_active_date');
      const currentDate = getCurrentDate();
      
      if (lastActiveDate !== currentDate) {
        // Reset daily data for new day (but keep entries for history)
        const resetData = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          water: 0,
          steps: 0,
          exerciseMinutes: 0,
          caloriesBurned: 0,
          sleepHours: 0,
          mood: '',
          weight: 0,
        };
        setDailyData(resetData);
        await AsyncStorage.setItem('aifit_daily_data', JSON.stringify(resetData));
        await AsyncStorage.setItem('aifit_last_active_date', currentDate);
      } else if (savedDailyData) {
        // Same day, load existing daily data
        setDailyData(JSON.parse(savedDailyData));
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  };

  const updateProfile = async (newProfile: Partial<UserProfile>) => {
    try {
      const updatedProfile = { ...profile, ...newProfile } as UserProfile;
      setProfile(updatedProfile);
      await AsyncStorage.setItem('aifit_profile', JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const updateDailyData = async (newData: any) => {
    try {
      const updatedData = { ...dailyData, ...newData };
      setDailyData(updatedData);
      await AsyncStorage.setItem('aifit_daily_data', JSON.stringify(updatedData));
      await AsyncStorage.setItem('aifit_last_active_date', getCurrentDate());
    } catch (error) {
      console.error('Error updating daily data:', error);
    }
  };

  const addFoodEntry = async (entry: FoodEntry & { nutrition?: any }) => {
    try {
      // Log to Supabase meal_logs table
      const { error } = await supabase
        .from('meal_logs')
        .insert({
          user_id: profile?.id || 1,
          food_id: entry.foodId,
          quantity: entry.quantity,
          meal_type: entry.meal,
          date: entry.date,
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (e) {
      // Optionally handle error
      console.error('Failed to log food to Supabase', e);
    }
    // Always update local state
    try {
      const updatedEntries = [...foodEntries, entry];
      setFoodEntries(updatedEntries);
      await AsyncStorage.setItem('aifit_food_entries', JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Error saving food entry:', error);
    }
  };

  const removeFoodEntry = async (entryId: string) => {
    try {
      const updatedEntries = foodEntries.filter(entry => entry.id !== entryId);
      setFoodEntries(updatedEntries);
      await AsyncStorage.setItem('aifit_food_entries', JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Error removing food entry:', error);
    }
  };

  const addExerciseEntry = async (entry: ExerciseEntry) => {
    try {
      const updatedEntries = [...exerciseEntries, entry];
      setExerciseEntries(updatedEntries);
      await AsyncStorage.setItem('aifit_exercise_entries', JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Error adding exercise entry:', error);
    }
  };

  const getFoodEntriesForDate = (date: string) => {
    return foodEntries.filter(entry => entry.date === date);
  };

  const getFoodEntriesForMeal = (meal: string, date?: string) => {
    const targetDate = date || getCurrentDate();
    if (meal === '') {
      // Return all entries for the date (used for daily totals)
      return foodEntries.filter(entry => entry.date === targetDate);
    }
    return foodEntries.filter(entry => entry.meal === meal && entry.date === targetDate);
  };

  const getExerciseEntriesForDate = (date: string) => {
    return exerciseEntries.filter(entry => entry.date === date);
  };

  const getUsedDays = () => {
    // Get current week dates
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }

    // Return only dates from this week that have food entries
    return weekDates.filter(date => 
      foodEntries.some(entry => entry.date === date)
    );
  };

  const hasActiveTrial = (): boolean => {
    if (!profile) return false;
    if (profile.isPremium) return false; // Premium users don't need trial
    if (!profile.trialEndDate) return false;
    
    const trialEnd = new Date(profile.trialEndDate);
    const now = new Date();
    return now <= trialEnd;
  };

  const isPremiumOrTrial = (): boolean => {
    if (!profile) return false;
    return profile.isPremium || hasActiveTrial();
  };

  const startTrial = async (): Promise<void> => {
    if (!profile) return;
    
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 3); // 3-day trial
    
    await updateProfile({
      trialStartDate: now.toISOString(),
      trialEndDate: trialEnd.toISOString(),
    });
  };

  return (
    <UserContext.Provider value={{ 
      profile, 
      updateProfile, 
      dailyData, 
      updateDailyData,
      foodEntries,
      addFoodEntry,
      removeFoodEntry,
      getFoodEntriesForDate,
      getFoodEntriesForMeal,
      exerciseEntries,
      addExerciseEntry,
      getExerciseEntriesForDate,
      getUsedDays,
      getCurrentDate,
      getTodayTotals,
      hasActiveTrial,
      isPremiumOrTrial,
      startTrial
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
