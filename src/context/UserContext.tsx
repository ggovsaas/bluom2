import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

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
    const savedProfile = localStorage.getItem('aifit_profile');
    const savedDailyData = localStorage.getItem('aifit_daily_data');
    const savedFoodEntries = localStorage.getItem('aifit_food_entries');
    const savedExerciseEntries = localStorage.getItem('aifit_exercise_entries');
    
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
    
    if (savedFoodEntries) {
      setFoodEntries(JSON.parse(savedFoodEntries));
    }

    if (savedExerciseEntries) {
      setExerciseEntries(JSON.parse(savedExerciseEntries));
    }

    // Check if it's a new day and reset daily data while preserving historical entries
    const lastActiveDate = localStorage.getItem('aifit_last_active_date');
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
      localStorage.setItem('aifit_daily_data', JSON.stringify(resetData));
      localStorage.setItem('aifit_last_active_date', currentDate);
    } else if (savedDailyData) {
      // Same day, load existing daily data
      setDailyData(JSON.parse(savedDailyData));
    }
  }, []);

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    const updatedProfile = { ...profile, ...newProfile } as UserProfile;
    setProfile(updatedProfile);
    localStorage.setItem('aifit_profile', JSON.stringify(updatedProfile));
  };

  const updateDailyData = (newData: any) => {
    const updatedData = { ...dailyData, ...newData };
    setDailyData(updatedData);
    localStorage.setItem('aifit_daily_data', JSON.stringify(updatedData));
    localStorage.setItem('aifit_last_active_date', getCurrentDate());
  };

  const addFoodEntry = async (entry: FoodEntry & { nutrition?: any }) => {
    try {
      // If nutrition is present, send to backend
      const payload = {
        foodId: entry.foodId,
        quantity: entry.quantity,
        meal: entry.meal,
        date: entry.date,
        nutrition: entry.nutrition || {
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat
        }
      };
      await axios.post(API_ENDPOINTS.USER_LOG_FOOD, payload);
    } catch (e) {
      // Optionally handle error
      console.error('Failed to log food to backend', e);
    }
    // Always update local state
    const updatedEntries = [...foodEntries, entry];
    setFoodEntries(updatedEntries);
    localStorage.setItem('aifit_food_entries', JSON.stringify(updatedEntries));
  };

  const removeFoodEntry = (entryId: string) => {
    const updatedEntries = foodEntries.filter(entry => entry.id !== entryId);
    setFoodEntries(updatedEntries);
    localStorage.setItem('aifit_food_entries', JSON.stringify(updatedEntries));
  };

  const addExerciseEntry = (entry: ExerciseEntry) => {
    const updatedEntries = [...exerciseEntries, entry];
    setExerciseEntries(updatedEntries);
    localStorage.setItem('aifit_exercise_entries', JSON.stringify(updatedEntries));
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
      getTodayTotals
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