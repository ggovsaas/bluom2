// Personalization Engine - Generates personalized plans based on onboarding data

import { UserProfile } from '../context/UserContext';

export interface PersonalizedNutritionPlan {
  calorieTarget: number;
  macroTargets: {
    protein: number;
    carbs: number;
    fat: number;
  };
  mealFrequency: '3meals' | '5meals' | 'intermittent';
  mealTemplates: MealTemplate[];
  waterGoal: number; // in oz
  recipeRecommendations: string[]; // categories/preferences
}

export interface MealTemplate {
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  suggestions: string[];
}

export interface PersonalizedFitnessPlan {
  programType: string;
  weeklySchedule: WeeklySchedule;
  exercises: ExerciseRecommendation[];
  volume: {
    sets: number;
    reps: number;
    restPeriod: number; // seconds
  };
  progression: {
    type: 'linear' | 'periodized' | 'auto-regulated';
    weeklyIncrease: number; // percentage
  };
}

export interface WeeklySchedule {
  days: WorkoutDay[];
}

export interface WorkoutDay {
  day: string;
  focus: string;
  exercises: string[];
  duration: number; // minutes
}

export interface ExerciseRecommendation {
  name: string;
  category: string;
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  reason: string;
}

export interface PersonalizedWellnessPlan {
  dailyPractices: DailyPractice[];
  breathworkPlan: BreathworkPlan;
  journalingPrompts: string[];
  hydrationReminders: HydrationReminder[];
  habitSuggestions: HabitSuggestion[];
  bedtimeRoutine: BedtimeRoutine;
  soundscapeRecommendations: string[];
  meditationRecommendations: string[];
}

export interface DailyPractice {
  name: string;
  duration: number; // minutes
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  description: string;
}

export interface BreathworkPlan {
  technique: string;
  frequency: string;
  duration: number;
}

export interface HydrationReminder {
  time: string;
  amount: number; // oz
  message: string;
}

export interface HabitSuggestion {
  name: string;
  category: string;
  reason: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface BedtimeRoutine {
  steps: string[];
  soundscape: string;
  duration: number;
}

// Generate Personalized Nutrition Plan
export const generateNutritionPlan = (profile: UserProfile): PersonalizedNutritionPlan => {
  const calorieTarget = profile.dailyCalories;
  const macroTargets = {
    protein: profile.dailyProtein,
    carbs: profile.dailyCarbs,
    fat: profile.dailyFat,
  };

  // Determine meal frequency based on preference
  let mealFrequency: '3meals' | '5meals' | 'intermittent' = '3meals';
  if (profile.mealFrequency?.includes('5')) {
    mealFrequency = '5meals';
  } else if (profile.nutritionPreference?.toLowerCase().includes('fasting')) {
    mealFrequency = 'intermittent';
  }

  // Calculate water goal (0.5-0.7 oz per lb body weight, or 30-35ml per kg)
  const weightInKg = profile.weightInKg;
  const waterGoalOz = Math.round(weightInKg * 0.67 * 33.814); // Convert to oz
  const baseWaterGoal = Math.max(64, Math.min(128, waterGoalOz)); // Clamp between 64-128oz
  
  // Adjust for activity level
  const activityMultiplier = profile.activityLevel?.toLowerCase().includes('very') ? 1.2 :
                             profile.activityLevel?.toLowerCase().includes('moderate') ? 1.1 : 1.0;
  const waterGoal = Math.round(baseWaterGoal * activityMultiplier);

  // Generate meal templates
  const mealTemplates = generateMealTemplates(calorieTarget, macroTargets, mealFrequency, profile);

  // Recipe recommendations based on dietary preferences
  const recipeRecommendations = generateRecipeRecommendations(profile);

  return {
    calorieTarget,
    macroTargets,
    mealFrequency,
    mealTemplates,
    waterGoal,
    recipeRecommendations,
  };
};

// Generate meal templates
const generateMealTemplates = (
  totalCalories: number,
  macros: { protein: number; carbs: number; fat: number },
  frequency: '3meals' | '5meals' | 'intermittent',
  profile: UserProfile
): MealTemplate[] => {
  const templates: MealTemplate[] = [];

  if (frequency === 'intermittent') {
    // Intermittent fasting: 2 larger meals
    const mealCalories = totalCalories / 2;
    templates.push({
      meal: 'Lunch',
      calories: Math.round(mealCalories * 0.6),
      protein: Math.round(macros.protein * 0.6),
      carbs: Math.round(macros.carbs * 0.6),
      fat: Math.round(macros.fat * 0.6),
      suggestions: getMealSuggestions('Lunch', profile),
    });
    templates.push({
      meal: 'Dinner',
      calories: Math.round(mealCalories * 0.4),
      protein: Math.round(macros.protein * 0.4),
      carbs: Math.round(macros.carbs * 0.4),
      fat: Math.round(macros.fat * 0.4),
      suggestions: getMealSuggestions('Dinner', profile),
    });
  } else if (frequency === '5meals') {
    // 5 meals: 3 main + 2 snacks
    const mainMealCalories = totalCalories * 0.25;
    const snackCalories = totalCalories * 0.125;
    
    ['Breakfast', 'Lunch', 'Dinner'].forEach((meal) => {
      templates.push({
        meal: meal as 'Breakfast' | 'Lunch' | 'Dinner',
        calories: Math.round(mainMealCalories),
        protein: Math.round(macros.protein * 0.25),
        carbs: Math.round(macros.carbs * 0.25),
        fat: Math.round(macros.fat * 0.25),
        suggestions: getMealSuggestions(meal as 'Breakfast' | 'Lunch' | 'Dinner', profile),
      });
    });

    // 2 snacks
    for (let i = 0; i < 2; i++) {
      templates.push({
        meal: 'Snack',
        calories: Math.round(snackCalories),
        protein: Math.round(macros.protein * 0.125),
        carbs: Math.round(macros.carbs * 0.125),
        fat: Math.round(macros.fat * 0.125),
        suggestions: getMealSuggestions('Snack', profile),
      });
    }
  } else {
    // 3 meals + 1 snack (default)
    const mealCalories = totalCalories * 0.3;
    const snackCalories = totalCalories * 0.1;

    ['Breakfast', 'Lunch', 'Dinner'].forEach((meal) => {
      templates.push({
        meal: meal as 'Breakfast' | 'Lunch' | 'Dinner',
        calories: Math.round(mealCalories),
        protein: Math.round(macros.protein * 0.3),
        carbs: Math.round(macros.carbs * 0.3),
        fat: Math.round(macros.fat * 0.3),
        suggestions: getMealSuggestions(meal as 'Breakfast' | 'Lunch' | 'Dinner', profile),
      });
    });

    templates.push({
      meal: 'Snack',
      calories: Math.round(snackCalories),
      protein: Math.round(macros.protein * 0.1),
      carbs: Math.round(macros.carbs * 0.1),
      fat: Math.round(macros.fat * 0.1),
      suggestions: getMealSuggestions('Snack', profile),
    });
  }

  return templates;
};

// Get meal suggestions based on preferences
const getMealSuggestions = (
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack',
  profile: UserProfile
): string[] => {
  const suggestions: string[] = [];
  const pref = profile.nutritionPreference?.toLowerCase() || '';

  if (pref.includes('high protein') || pref.includes('protein')) {
    suggestions.push('High-protein options');
  }
  if (pref.includes('low carb') || pref.includes('keto')) {
    suggestions.push('Low-carb alternatives');
  }
  if (pref.includes('plant') || pref.includes('vegan') || pref.includes('vegetarian')) {
    suggestions.push('Plant-based recipes');
  }

  if (meal === 'Breakfast') {
    suggestions.push('Oatmeal', 'Eggs', 'Smoothies');
  } else if (meal === 'Lunch') {
    suggestions.push('Salads', 'Sandwiches', 'Bowls');
  } else if (meal === 'Dinner') {
    suggestions.push('Grilled proteins', 'Vegetables', 'Whole grains');
  } else {
    suggestions.push('Nuts', 'Fruits', 'Yogurt');
  }

  return suggestions.slice(0, 3);
};

// Generate recipe recommendations
const generateRecipeRecommendations = (profile: UserProfile): string[] => {
  const recommendations: string[] = [];
  const pref = profile.nutritionPreference?.toLowerCase() || '';
  const restrictions = profile.dietaryRestrictions || [];

  if (pref.includes('high protein')) {
    recommendations.push('High-Protein');
  }
  if (pref.includes('low carb') || pref.includes('keto')) {
    recommendations.push('Low-Carb', 'Keto');
  }
  if (pref.includes('plant')) {
    recommendations.push('Plant-Based', 'Vegan');
  }
  if (restrictions.includes('Gluten-Free')) {
    recommendations.push('Gluten-Free');
  }
  if (restrictions.includes('Dairy-Free')) {
    recommendations.push('Dairy-Free');
  }

  // Default recommendations
  if (recommendations.length === 0) {
    recommendations.push('Balanced', 'Quick & Easy', 'Meal Prep');
  }

  return recommendations;
};

// Generate Personalized Fitness Plan
export const generateFitnessPlan = (profile: UserProfile): PersonalizedFitnessPlan => {
  const goal = profile.fitnessGoal?.toLowerCase() || '';
  const experience = profile.experience?.toLowerCase() || 'beginner';
  const timeAvailable = profile.timeAvailable || '';
  const preference = profile.workoutPreference?.toLowerCase() || '';

  // Determine program type
  let programType = 'Full Body';
  let weeklySchedule: WeeklySchedule;
  let volume = { sets: 3, reps: 10, restPeriod: 60 };

  if (goal.includes('muscle') || goal.includes('build')) {
    if (timeAvailable.includes('2-4') || timeAvailable.includes('1-2')) {
      programType = '3-Day Full Body';
      weeklySchedule = generate3DayFullBody(experience, preference);
    } else if (timeAvailable.includes('4-6') || timeAvailable.includes('5+')) {
      programType = '5-Day Push/Pull/Legs';
      weeklySchedule = generate5DayPPL(experience);
      volume = { sets: 4, reps: 8, restPeriod: 90 };
    } else {
      programType = '4-Day Upper/Lower';
      weeklySchedule = generate4DayUpperLower(experience);
    }
  } else if (goal.includes('lose') || goal.includes('weight')) {
    programType = 'Weight Loss + Cardio';
    weeklySchedule = generateWeightLossProgram(experience, timeAvailable);
    volume = { sets: 3, reps: 12, restPeriod: 45 };
  } else if (preference.includes('home') || preference.includes('bodyweight')) {
    programType = 'Home Bodyweight';
    weeklySchedule = generateHomeBodyweight(experience);
  } else if (goal.includes('strength') || goal.includes('power')) {
    programType = 'Strength/Power';
    weeklySchedule = generateStrengthProgram(experience);
    volume = { sets: 5, reps: 5, restPeriod: 180 };
  } else {
    programType = '3-Day Full Body';
    weeklySchedule = generate3DayFullBody(experience, preference);
  }

  // Exercise selection
  const exercises = generateExerciseRecommendations(profile);

  // Progression
  const progression = {
    type: experience === 'beginner' ? 'linear' : 'periodized' as 'linear' | 'periodized' | 'auto-regulated',
    weeklyIncrease: experience === 'beginner' ? 2.5 : experience === 'intermediate' ? 5 : 2.5,
  };

  return {
    programType,
    weeklySchedule,
    exercises,
    volume,
    progression,
  };
};

// Generate workout schedules
const generate3DayFullBody = (experience: string, preference: string): WeeklySchedule => ({
  days: [
    { day: 'Monday', focus: 'Full Body', exercises: ['Squats', 'Bench Press', 'Rows', 'Shoulder Press'], duration: 60 },
    { day: 'Wednesday', focus: 'Full Body', exercises: ['Deadlifts', 'Pull-ups', 'Dips', 'Lunges'], duration: 60 },
    { day: 'Friday', focus: 'Full Body', exercises: ['Squats', 'Overhead Press', 'Rows', 'Leg Press'], duration: 60 },
  ],
});

const generate4DayUpperLower = (experience: string): WeeklySchedule => ({
  days: [
    { day: 'Monday', focus: 'Upper Body', exercises: ['Bench Press', 'Rows', 'Shoulder Press', 'Bicep Curls'], duration: 60 },
    { day: 'Tuesday', focus: 'Lower Body', exercises: ['Squats', 'Deadlifts', 'Leg Press', 'Calf Raises'], duration: 60 },
    { day: 'Thursday', focus: 'Upper Body', exercises: ['Pull-ups', 'Overhead Press', 'Tricep Extensions', 'Lateral Raises'], duration: 60 },
    { day: 'Friday', focus: 'Lower Body', exercises: ['Romanian Deadlifts', 'Lunges', 'Leg Curls', 'Hip Thrusts'], duration: 60 },
  ],
});

const generate5DayPPL = (experience: string): WeeklySchedule => ({
  days: [
    { day: 'Monday', focus: 'Push', exercises: ['Bench Press', 'Overhead Press', 'Tricep Dips', 'Lateral Raises'], duration: 75 },
    { day: 'Tuesday', focus: 'Pull', exercises: ['Deadlifts', 'Pull-ups', 'Rows', 'Bicep Curls'], duration: 75 },
    { day: 'Wednesday', focus: 'Legs', exercises: ['Squats', 'Leg Press', 'Leg Curls', 'Calf Raises'], duration: 75 },
    { day: 'Friday', focus: 'Push', exercises: ['Incline Bench', 'Shoulder Press', 'Tricep Extensions', 'Chest Flyes'], duration: 75 },
    { day: 'Saturday', focus: 'Pull', exercises: ['Barbell Rows', 'Lat Pulldowns', 'Face Pulls', 'Hammer Curls'], duration: 75 },
  ],
});

const generateWeightLossProgram = (experience: string, timeAvailable: string): WeeklySchedule => ({
  days: [
    { day: 'Monday', focus: 'Strength + Cardio', exercises: ['Circuit Training', 'HIIT'], duration: 45 },
    { day: 'Wednesday', focus: 'Full Body', exercises: ['Compound Movements', 'Cardio Finisher'], duration: 45 },
    { day: 'Friday', focus: 'Strength + Cardio', exercises: ['Circuit Training', 'HIIT'], duration: 45 },
    { day: 'Saturday', focus: 'Cardio', exercises: ['Running', 'Cycling', 'Swimming'], duration: 30 },
  ],
});

const generateHomeBodyweight = (experience: string): WeeklySchedule => ({
  days: [
    { day: 'Monday', focus: 'Upper Body', exercises: ['Push-ups', 'Pull-ups', 'Dips', 'Planks'], duration: 30 },
    { day: 'Wednesday', focus: 'Lower Body', exercises: ['Squats', 'Lunges', 'Jump Squats', 'Calf Raises'], duration: 30 },
    { day: 'Friday', focus: 'Full Body', exercises: ['Burpees', 'Mountain Climbers', 'Planks', 'Jumping Jacks'], duration: 30 },
  ],
});

const generateStrengthProgram = (experience: string): WeeklySchedule => ({
  days: [
    { day: 'Monday', focus: 'Squat Day', exercises: ['Back Squats', 'Front Squats', 'Leg Press'], duration: 90 },
    { day: 'Wednesday', focus: 'Bench Day', exercises: ['Bench Press', 'Close Grip Bench', 'Tricep Work'], duration: 90 },
    { day: 'Friday', focus: 'Deadlift Day', exercises: ['Deadlifts', 'Romanian Deadlifts', 'Rows'], duration: 90 },
  ],
});

// Generate exercise recommendations
const generateExerciseRecommendations = (profile: UserProfile): ExerciseRecommendation[] => {
  const recommendations: ExerciseRecommendation[] = [];
  const goal = profile.fitnessGoal?.toLowerCase() || '';
  const experience = profile.experience?.toLowerCase() || 'beginner';
  const preference = profile.workoutPreference?.toLowerCase() || '';
  const injuries = profile.challenges || [];

  // Core exercises based on goal
  if (goal.includes('muscle') || goal.includes('build')) {
    recommendations.push(
      { name: 'Squats', category: 'Legs', equipment: ['Barbell', 'Rack'], difficulty: experience as any, reason: 'Builds lower body strength' },
      { name: 'Bench Press', category: 'Chest', equipment: ['Barbell', 'Bench'], difficulty: experience as any, reason: 'Primary chest builder' },
      { name: 'Deadlifts', category: 'Back', equipment: ['Barbell'], difficulty: experience as any, reason: 'Full body strength' },
    );
  }

  if (preference.includes('home') || preference.includes('bodyweight')) {
    recommendations.push(
      { name: 'Push-ups', category: 'Chest', equipment: [], difficulty: 'beginner', reason: 'No equipment needed' },
      { name: 'Pull-ups', category: 'Back', equipment: ['Pull-up Bar'], difficulty: 'intermediate', reason: 'Bodyweight back exercise' },
      { name: 'Squats', category: 'Legs', equipment: [], difficulty: 'beginner', reason: 'Bodyweight leg builder' },
    );
  }

  return recommendations;
};

// Generate Personalized Wellness Plan
export const generateWellnessPlan = (profile: UserProfile): PersonalizedWellnessPlan => {
  const stressLevel = profile.stressLevel?.toLowerCase() || 'moderate';
  const sleepHours = profile.sleepHours || 7;
  const moodTendencies = profile.challenges || [];

  // Daily practices
  const dailyPractices: DailyPractice[] = [];
  if (stressLevel.includes('high') || stressLevel.includes('very')) {
    dailyPractices.push({
      name: 'Morning Meditation',
      duration: 5,
      timeOfDay: 'morning',
      description: 'Start your day with calm',
    });
    dailyPractices.push({
      name: 'Evening Wind-Down',
      duration: 10,
      timeOfDay: 'evening',
      description: 'Release daily tension',
    });
  } else {
    dailyPractices.push({
      name: 'Quick Mindfulness',
      duration: 3,
      timeOfDay: 'afternoon',
      description: 'Midday reset',
    });
  }

  // Breathwork plan
  const breathworkPlan: BreathworkPlan = {
    technique: stressLevel.includes('high') ? 'Box Breathing' : 'Deep Breathing',
    frequency: 'Daily',
    duration: stressLevel.includes('high') ? 10 : 5,
  };

  // Journaling prompts based on mood/stress
  const journalingPrompts: string[] = [];
  if (stressLevel.includes('high')) {
    journalingPrompts.push('What caused stress today?', 'How did you handle it?', 'What can you do differently?');
  } else {
    journalingPrompts.push('What are you grateful for?', 'What went well today?', 'What are you looking forward to?');
  }

  // Hydration reminders
  const waterGoal = Math.round((profile.weightInKg * 0.67 * 33.814) * 1.1);
  const hydrationReminders: HydrationReminder[] = [
    { time: '09:00', amount: Math.round(waterGoal * 0.2), message: 'Start your day hydrated' },
    { time: '12:00', amount: Math.round(waterGoal * 0.3), message: 'Midday hydration boost' },
    { time: '15:00', amount: Math.round(waterGoal * 0.3), message: 'Afternoon refresh' },
    { time: '18:00', amount: Math.round(waterGoal * 0.2), message: 'Evening hydration' },
  ];

  // Habit suggestions
  const habitSuggestions: HabitSuggestion[] = [];
  if (sleepHours < 7) {
    habitSuggestions.push({
      name: 'Consistent Sleep Schedule',
      category: 'Health',
      reason: 'Improve sleep quality',
      difficulty: 'medium',
    });
  }
  if (stressLevel.includes('high')) {
    habitSuggestions.push({
      name: 'Daily Meditation',
      category: 'Mindfulness',
      reason: 'Reduce stress levels',
      difficulty: 'easy',
    });
  }
  habitSuggestions.push({
    name: 'Morning Stretch',
    category: 'Fitness',
    reason: 'Improve mobility',
    difficulty: 'easy',
  });

  // Bedtime routine
  const bedtimeRoutine: BedtimeRoutine = {
    steps: sleepHours < 7 ? [
      'Dim lights 1 hour before bed',
      'Avoid screens 30 min before sleep',
      'Practice deep breathing',
      'Listen to calming soundscape',
    ] : [
      'Wind down with light reading',
      'Practice gratitude',
      'Set tomorrow\'s intentions',
    ],
    soundscape: stressLevel.includes('high') ? 'brownNoise' : 'rain',
    duration: 15,
  };

  // Soundscape recommendations
  const soundscapeRecommendations: string[] = [];
  if (stressLevel.includes('high')) {
    soundscapeRecommendations.push('brownNoise', 'rain', 'ocean');
  } else {
    soundscapeRecommendations.push('forest', 'river', 'whiteNoise');
  }

  // Meditation recommendations
  const meditationRecommendations: string[] = [];
  if (stressLevel.includes('high')) {
    meditationRecommendations.push('anxiety', 'sleep', 'stress-relief');
  } else {
    meditationRecommendations.push('focus', 'morning', 'gratitude');
  }

  return {
    dailyPractices,
    breathworkPlan,
    journalingPrompts,
    hydrationReminders,
    habitSuggestions,
    bedtimeRoutine,
    soundscapeRecommendations,
    meditationRecommendations,
  };
};

// Save personalized plans to AsyncStorage
export const savePersonalizedPlans = async (
  nutritionPlan: PersonalizedNutritionPlan,
  fitnessPlan: PersonalizedFitnessPlan,
  wellnessPlan: PersonalizedWellnessPlan
): Promise<void> => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('aifit_nutrition_plan', JSON.stringify(nutritionPlan));
    await AsyncStorage.setItem('aifit_fitness_plan', JSON.stringify(fitnessPlan));
    await AsyncStorage.setItem('aifit_wellness_plan', JSON.stringify(wellnessPlan));
  } catch (error) {
    console.error('Error saving personalized plans:', error);
  }
};

// Load personalized plans from AsyncStorage
export const loadPersonalizedPlans = async (): Promise<{
  nutritionPlan: PersonalizedNutritionPlan | null;
  fitnessPlan: PersonalizedFitnessPlan | null;
  wellnessPlan: PersonalizedWellnessPlan | null;
}> => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const nutrition = await AsyncStorage.getItem('aifit_nutrition_plan');
    const fitness = await AsyncStorage.getItem('aifit_fitness_plan');
    const wellness = await AsyncStorage.getItem('aifit_wellness_plan');

    return {
      nutritionPlan: nutrition ? JSON.parse(nutrition) : null,
      fitnessPlan: fitness ? JSON.parse(fitness) : null,
      wellnessPlan: wellness ? JSON.parse(wellness) : null,
    };
  } catch (error) {
    console.error('Error loading personalized plans:', error);
    return { nutritionPlan: null, fitnessPlan: null, wellnessPlan: null };
  }
};


